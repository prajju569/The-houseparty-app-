/**
 * Booking service — Supabase when authenticated, AsyncStorage in bypass/dev mode.
 *
 * Run this SQL in Supabase before using with real auth:
 *
 *   CREATE TABLE IF NOT EXISTS public.bookings (
 *     id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
 *     user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
 *     event_id    text NOT NULL,
 *     status      text DEFAULT 'confirmed'
 *                 CHECK (status IN ('confirmed', 'waitlist', 'cancelled')),
 *     booking_ref text UNIQUE NOT NULL,
 *     guest_count integer DEFAULT 1 CHECK (guest_count BETWEEN 1 AND 4),
 *     created_at  timestamptz DEFAULT now()
 *   );
 *
 *   ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
 *   CREATE POLICY "own bookings select" ON public.bookings
 *     FOR SELECT USING (auth.uid() = user_id);
 *   CREATE POLICY "own bookings insert" ON public.bookings
 *     FOR INSERT WITH CHECK (auth.uid() = user_id);
 *   CREATE POLICY "own bookings update" ON public.bookings
 *     FOR UPDATE USING (auth.uid() = user_id);
 *
 *   -- If you already have the table, add guest_count:
 *   ALTER TABLE public.bookings
 *     ADD COLUMN IF NOT EXISTS guest_count integer DEFAULT 1 CHECK (guest_count BETWEEN 1 AND 4);
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
  return `HP-${String(Math.floor(1000 + Math.random() * 9000))}`;
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
      .insert({ user_id: userId, event_id: eventId, status, booking_ref: bookingRef, guest_count: guestCount })
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
      .eq('user_id', userId)
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
      .eq('user_id', userId);
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
      user_id: userId,
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
