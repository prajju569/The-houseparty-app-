/**
 * Run this SQL in Supabase SQL Editor once:
 *
 *   CREATE TABLE IF NOT EXISTS public.events (
 *     id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
 *     host_id      uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
 *     title        text NOT NULL,
 *     description  text,
 *     vibe         text[],
 *     date         timestamptz NOT NULL,
 *     venue        text,
 *     address      text,
 *     area         text,
 *     capacity     int DEFAULT 20 CHECK (capacity > 0),
 *     entry_fee    int DEFAULT 0  CHECK (entry_fee >= 0),
 *     cover_image  text,
 *     is_private   boolean DEFAULT false,
 *     status       text DEFAULT 'upcoming' CHECK (status IN ('upcoming','ongoing','closed')),
 *     created_at   timestamptz DEFAULT now()
 *   );
 *   ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
 *   CREATE POLICY "hosts manage their events" ON public.events
 *     USING (auth.uid() = host_id) WITH CHECK (auth.uid() = host_id);
 *   CREATE POLICY "guests view public events" ON public.events
 *     FOR SELECT USING (NOT is_private OR auth.uid() = host_id);
 *
 *   CREATE TABLE IF NOT EXISTS public.bookings (
 *     id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
 *     event_id    uuid REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
 *     guest_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
 *     guest_count int DEFAULT 1 CHECK (guest_count > 0),
 *     status      text DEFAULT 'confirmed' CHECK (status IN ('pending','confirmed','cancelled')),
 *     booking_ref text UNIQUE NOT NULL,
 *     created_at  timestamptz DEFAULT now(),
 *     UNIQUE (event_id, guest_id)
 *   );
 *   ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
 *   CREATE POLICY "guests manage their bookings" ON public.bookings
 *     USING (auth.uid() = guest_id) WITH CHECK (auth.uid() = guest_id);
 *   CREATE POLICY "hosts view event bookings" ON public.bookings
 *     FOR SELECT USING (
 *       auth.uid() = (SELECT host_id FROM public.events WHERE id = event_id)
 *     );
 *   -- Canonical owner column is `guest_id` (verified against the live DB schema).
 */

import { supabase } from './supabaseClient';

export type Event = {
  id: string;
  host_id: string;
  title: string;
  description?: string | null;
  vibe?: string[] | null;
  date: string;
  venue?: string | null;
  address?: string | null;
  area?: string | null;
  capacity: number;
  entry_fee: number;
  cover_image?: string | null;
  lat?: number | null;
  lng?: number | null;
  nearest_metro?: string | null;
  metro_distance?: string | null;
  is_private: boolean;
  status: 'upcoming' | 'ongoing' | 'closed';
  created_at: string;
  booking_count?: number;
};

export type CreateEventPayload = Omit<Event, 'id' | 'created_at' | 'booking_count'>;

// ── Host: create an event ─────────────────────────────────────────────────────
export async function createEvent(payload: CreateEventPayload): Promise<{ data: Event | null; error: string | null }> {
  const { data, error } = await supabase
    .from('events')
    .insert(payload)
    .select()
    .single();
  return { data: data as Event | null, error: error?.message ?? null };
}

// ── Host: fetch their own events with RSVP counts ────────────────────────────
export async function fetchHostEvents(hostId: string): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*, bookings(count)')
    .eq('host_id', hostId)
    .order('date', { ascending: true });
  if (error || !data) return [];
  return data.map((e: any) => ({
    ...e,
    booking_count: e.bookings?.[0]?.count ?? 0,
  }));
}

// ── Guest: fetch upcoming public events ──────────────────────────────────────
export async function fetchPublicEvents(limit = 20): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*, bookings(count)')
    .eq('is_private', false)
    .eq('status', 'upcoming')
    .order('date', { ascending: true })
    .limit(limit);
  if (error || !data) return [];
  return data.map((e: any) => ({
    ...e,
    booking_count: e.bookings?.[0]?.count ?? 0,
  }));
}

// ── Fetch a single event ──────────────────────────────────────────────────────
export async function fetchEvent(eventId: string): Promise<Event | null> {
  const { data, error } = await supabase
    .from('events')
    .select('*, bookings(count)')
    .eq('id', eventId)
    .single();
  if (error || !data) return null;
  return { ...data, booking_count: data.bookings?.[0]?.count ?? 0 };
}

// ── Host: update event status ─────────────────────────────────────────────────
export async function updateEventStatus(eventId: string, status: Event['status']): Promise<boolean> {
  const { error } = await supabase.from('events').update({ status }).eq('id', eventId);
  return !error;
}

// NOTE: Guest booking create/check/cancel live in bookingService.ts (the canonical
// path used by the RSVP flow). The duplicate booking helpers that used to live
// here have been removed; both paths now use the live `guest_id` column.

// ── Guest: fetch nearby events via Haversine RPC ────────────────────────────
export type NearbyEvent = Event & { distance_km: number };

export async function fetchNearbyEvents(
  lat: number,
  lng: number,
  radiusKm = 7,
): Promise<NearbyEvent[]> {
  // Call the nearby_events() SQL function (run the SQL from the plan to create it)
  const { data, error } = await supabase.rpc('nearby_events', {
    user_lat: lat,
    user_lng: lng,
    radius_km: radiusKm,
  });
  if (error || !data) return [];

  // RPC returns {id, title, distance_km} — fetch full event rows
  const ids: string[] = data.map((r: any) => r.id);
  if (ids.length === 0) return [];

  const distMap: Record<string, number> = {};
  data.forEach((r: any) => { distMap[r.id] = r.distance_km; });

  const { data: events } = await supabase
    .from('events')
    .select('*')
    .in('id', ids);

  if (!events) return [];
  return (events as Event[])
    .map(e => ({ ...e, distance_km: distMap[e.id] ?? 999 }))
    .sort((a, b) => a.distance_km - b.distance_km);
}

// ── Host: fetch all bookings for an event (with guest profile info) ───────────
export type EventBooking = {
  id: string;
  guest_id: string;
  guest_count: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  booking_ref: string;
  created_at: string;
  profiles: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  } | null;
};

export async function fetchEventBookings(eventId: string): Promise<EventBooking[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select('id, guest_id, guest_count, status, booking_ref, created_at')
    .eq('event_id', eventId)
    .order('created_at', { ascending: true });
  if (error || !data) return [];

  // No FK from bookings → profiles, so join guest profiles in a second query.
  const guestIds = [...new Set(data.map((b: any) => b.guest_id).filter(Boolean))];
  const profileMap: Record<string, EventBooking['profiles']> = {};
  if (guestIds.length) {
    const { data: profs } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .in('id', guestIds);
    (profs ?? []).forEach((p: any) => {
      profileMap[p.id] = { username: p.username, display_name: p.display_name, avatar_url: p.avatar_url };
    });
  }

  return data.map((b: any) => ({ ...b, profiles: profileMap[b.guest_id] ?? null })) as EventBooking[];
}

// ── Host: approve or deny a booking ──────────────────────────────────────────
export async function updateBookingStatus(
  bookingId: string,
  status: 'confirmed' | 'cancelled',
): Promise<boolean> {
  const { error } = await supabase
    .from('bookings')
    .update({ status })
    .eq('id', bookingId);
  return !error;
}

// ── Upload event cover image ──────────────────────────────────────────────────
export async function uploadEventCover(hostId: string, localUri: string): Promise<string | null> {
  try {
    const response = await fetch(localUri);
    const blob = await response.blob();
    const filePath = `${hostId}/${Date.now()}.jpg`;
    const { error } = await supabase.storage.from('event-covers').upload(filePath, blob, { contentType: 'image/jpeg', upsert: true });
    if (error) return null;
    const { data } = supabase.storage.from('event-covers').getPublicUrl(filePath);
    return data.publicUrl;
  } catch {
    return null;
  }
}
