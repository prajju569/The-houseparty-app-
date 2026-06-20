/**
 * Booking service — Supabase when authenticated; AsyncStorage is an offline fallback only.
 *
 * Live schema (verified against the DB): the owner column is `guest_id` (uuid),
 * and `event_id` is a uuid FK to public.events(id). RLS keys guest ownership on
 * `guest_id`; hosts read/update bookings for events they own (see the RLS script).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabaseClient';

const LOCAL_KEY = '@hp_bookings';

export type Booking = {
  id: string;
  eventId: string;
  status: 'confirmed' | 'waitlist' | 'cancelled';
  bookingRef: string;
  guestCount: number;
  createdAt: string;
};

function generateRef(): string {
  // 4 random bytes → 8 hex chars = 4 billion combinations (was only 9,000)
  const arr = new Uint8Array(4);
  crypto.getRandomValues(arr);
  return `HP-${Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
}

// ── Local (AsyncStorage) helpers ──────────────────────────────────────────────
async function getLocalBookings(): Promise<Booking[]> {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

async function saveLocalBookings(bookings: Booking[]): Promise<void> {
  await AsyncStorage.setItem(LOCAL_KEY, JSON.stringify(bookings));
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function createBooking(
  userId: string | null | undefined,
  eventId: string,
  status: 'confirmed' | 'waitlist' = 'confirmed',
  guestCount: number = 1
): Promise<{ booking: Booking | null; error: string | null }> {
  // Fix #20: idempotency check before generating ref
  const existing = await checkBooking(userId, eventId);
  if (existing) return { booking: existing, error: null };

  const bookingRef = generateRef();
  const newBooking: Booking = {
    id: `local_${Date.now()}`,
    eventId,
    status,
    bookingRef,
    guestCount,
    createdAt: new Date().toISOString(),
  };

  if (userId) {
    // Fix #22: handle sold-out conflict from Supabase
    const { data, error } = await supabase
      .from('bookings')
      .insert({ guest_id: userId, event_id: eventId, status, booking_ref: bookingRef, guest_count: guestCount })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') return { booking: null, error: 'You already have a booking for this event.' };
      return { booking: null, error: error.message };
    }

    const booking: Booking = {
      id: data.id,
      eventId: data.event_id,
      status: data.status,
      bookingRef: data.booking_ref,
      guestCount: data.guest_count ?? 1,
      createdAt: data.created_at,
    };
    return { booking, error: null };
  }

  // Bypass mode — persist locally
  const all = await getLocalBookings();
  await saveLocalBookings([newBooking, ...all]);
  return { booking: newBooking, error: null };
}

export async function getUserBookings(
  userId: string | null | undefined
): Promise<Booking[]> {
  if (userId) {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('guest_id', userId)
      .neq('status', 'cancelled')
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data.map(d => ({
      id: d.id,
      eventId: d.event_id,
      status: d.status,
      bookingRef: d.booking_ref,
      guestCount: d.guest_count ?? 1,
      createdAt: d.created_at,
    }));
  }

  const local = await getLocalBookings();
  return local.filter(b => b.status !== 'cancelled');
}

export async function checkBooking(
  userId: string | null | undefined,
  eventId: string
): Promise<Booking | null> {
  const all = await getUserBookings(userId);
  return all.find(b => b.eventId === eventId) ?? null;
}

// Fix #6: Deadline enforcement lives in the UI (GuestDashboardScreen checks hours remaining).
// This function just persists the cancellation.
export async function cancelBooking(
  userId: string | null | undefined,
  bookingId: string
): Promise<{ error: string | null }> {
  if (userId) {
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId)
      .eq('guest_id', userId);
    return { error: error?.message ?? null };
  }

  const all = await getLocalBookings();
  const updated = all.map(b => b.id === bookingId ? { ...b, status: 'cancelled' as const } : b);
  await saveLocalBookings(updated);
  return { error: null };
}

// Fix #25: Merge local AsyncStorage bookings → Supabase after real login
export async function mergeLocalBookingsToSupabase(userId: string): Promise<void> {
  const local = await getLocalBookings();
  if (!local.length) return;

  const rows = local
    .filter(b => b.status !== 'cancelled')
    .map(b => ({
      guest_id: userId,
      event_id: b.eventId,
      status: b.status,
      booking_ref: b.bookingRef,
      guest_count: b.guestCount ?? 1,
      created_at: b.createdAt,
    }));

  if (rows.length) {
    // upsert on booking_ref so duplicates are ignored
    await supabase.from('bookings').upsert(rows, { onConflict: 'booking_ref', ignoreDuplicates: true });
  }

  // Clear local after merge
  await AsyncStorage.removeItem(LOCAL_KEY);
}

export async function hasAttendedEvent(userId: string, eventId: string): Promise<boolean> {
  const { data } = await supabase
    .from('bookings')
    .select('id')
    .eq('guest_id', userId)
    .eq('event_id', eventId)
    .eq('status', 'confirmed')
    .maybeSingle();
  return !!data;
}

export type CheckInResult = {
  valid: boolean;
  guest_name?: string;
  guest_count?: number;
  already_checked_in?: boolean;
  checked_in_at?: string;
  booking_id?: string;
  error?: string;
};

export async function verifyAndCheckIn(bookingRef: string, eventId: string): Promise<CheckInResult> {
  const { data, error } = await supabase
    .from('bookings')
    .select('id, guest_id, status, guest_count, checked_in, checked_in_at')
    .eq('booking_ref', bookingRef)
    .eq('event_id', eventId)
    .maybeSingle();

  if (error || !data) return { valid: false, error: 'Ticket not found' };
  if (data.status === 'cancelled') return { valid: false, error: 'Ticket was cancelled' };

  // No FK from bookings → profiles, so resolve the guest name in a second query.
  const { data: prof } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', data.guest_id)
    .maybeSingle();
  const guestName = prof?.display_name ?? 'Guest';

  if (data.checked_in) {
    return {
      valid: true,
      already_checked_in: true,
      checked_in_at: data.checked_in_at,
      guest_name: guestName,
      guest_count: data.guest_count,
    };
  }

  // Mark as checked in
  await supabase
    .from('bookings')
    .update({ checked_in: true, checked_in_at: new Date().toISOString() })
    .eq('id', data.id);

  return {
    valid: true,
    already_checked_in: false,
    guest_name: guestName,
    guest_count: data.guest_count,
    booking_id: data.id,
  };
}

// Cache bookings locally so ticket is viewable offline (Fix #16)
export async function cacheBookingsOffline(bookings: Booking[]): Promise<void> {
  await AsyncStorage.setItem('@hp_bookings_cache', JSON.stringify(bookings));
}

export async function getCachedBookings(): Promise<Booking[]> {
  try {
    const raw = await AsyncStorage.getItem('@hp_bookings_cache');
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
