-- ============================================================================
-- HouseParty — RLS hardening & gap fixes
-- Run in the Supabase SQL Editor. Idempotent: safe to run more than once.
-- Every policy below is derived from the live schema introspection + the exact
-- queries the client performs. Each fix notes the bug it closes.
--
-- Cross-user profile reads use the public_profiles view (bottom of this file),
-- which exposes only non-PII columns. The profiles table keeps its own-row-only
-- read policy. The client reads other users' data via public_profiles.
-- ============================================================================

-- ── PROFILES: signup insert ─────────────────────────────────────────────────
-- BUG: there was no INSERT policy, so App.tsx's auto-create of a profile row on
-- first sign-in was blocked by RLS — new users ended up with no profile and
-- could never get past setup. Allow a user to create their own row.
DROP POLICY IF EXISTS "users insert own profile" ON public.profiles;
CREATE POLICY "users insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ── BOOKINGS: host approve/deny + check-in ──────────────────────────────────
-- BUG: hosts could only SELECT bookings, so updateBookingStatus (approve/deny)
-- and verifyAndCheckIn (QR check-in flips checked_in) silently failed under RLS.
-- Allow the event's host to UPDATE bookings for events they own. WITH CHECK
-- mirrors USING so a host can't move a booking onto an event they don't own.
DROP POLICY IF EXISTS "hosts update event bookings" ON public.bookings;
CREATE POLICY "hosts update event bookings" ON public.bookings
  FOR UPDATE
  USING (auth.uid() = (SELECT host_id FROM public.events WHERE id = bookings.event_id))
  WITH CHECK (auth.uid() = (SELECT host_id FROM public.events WHERE id = bookings.event_id));
-- (existing "guests manage their bookings" ALL on guest_id and
--  "hosts view event bookings" SELECT remain correct and are left as-is.)

-- ── MESSAGES: mark received message read ────────────────────────────────────
-- BUG: no UPDATE policy, so setting read_at on received messages failed.
DROP POLICY IF EXISTS "receiver marks read" ON public.messages;
CREATE POLICY "receiver marks read" ON public.messages
  FOR UPDATE USING (auth.uid() = receiver_id);

-- ── GALLERY: attendance-gated upload (defense in depth) ─────────────────────
-- The in-app gate (event closed + confirmed booking) was client-side only; the
-- table INSERT policy let any user insert a row for any event. Enforce the same
-- rule server-side so a crafted client can't bypass it.
DROP POLICY IF EXISTS "users upload to gallery" ON public.gallery;
DROP POLICY IF EXISTS "attendees upload to gallery" ON public.gallery;
CREATE POLICY "attendees upload to gallery" ON public.gallery
  FOR INSERT WITH CHECK (
    auth.uid() = uploader_id
    AND EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.event_id = gallery.event_id
        AND b.guest_id = auth.uid()
        AND b.status = 'confirmed'
    )
    AND EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = gallery.event_id AND e.status = 'closed'
    )
  );

-- ── FOLLOW REQUESTS: secure accept ──────────────────────────────────────────
-- Accepting must (1) flip the request to accepted and (2) insert a follows row
-- with follower_id = requester. The TARGET performs the accept, so they can't
-- satisfy the follows INSERT policy (auth.uid() = follower_id). This
-- SECURITY DEFINER function does both atomically, but only after verifying the
-- caller is the request's target — which also fully closes the self-accept hole
-- a requester could otherwise exploit.
CREATE OR REPLACE FUNCTION public.accept_follow_request(p_request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r public.follow_requests%ROWTYPE;
BEGIN
  SELECT * INTO r FROM public.follow_requests WHERE id = p_request_id;
  IF r.id IS NULL THEN
    RAISE EXCEPTION 'Follow request not found';
  END IF;
  IF r.target_id <> auth.uid() THEN
    RAISE EXCEPTION 'Only the request target may accept it';
  END IF;

  UPDATE public.follow_requests SET status = 'accepted' WHERE id = p_request_id;

  INSERT INTO public.follows (follower_id, following_id)
  VALUES (r.requester_id, r.target_id)
  ON CONFLICT (follower_id, following_id) DO NOTHING;
END;
$$;

REVOKE ALL ON FUNCTION public.accept_follow_request(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.accept_follow_request(uuid) TO authenticated;

-- ── PROFILES: safe public view for cross-user reads ─────────────────────────
-- The profiles table stays own-row read only (its existing "Users can read own
-- profile" SELECT policy is kept), so PII (email, phone, date_of_birth, lat/lng)
-- is never exposed. Cross-user reads — host cards, nearby hosts, guest names,
-- vibe tags, follow-request names — go through this view, which exposes only
-- non-sensitive columns. security_invoker = false so the view reads with owner
-- rights and returns every profile's SAFE columns, bypassing the table RLS.
CREATE OR REPLACE VIEW public.public_profiles AS
  SELECT id, username, display_name, avatar_url, bio,
         top_genres, top_artists, vibe_tags, role, is_private
  FROM public.profiles;

ALTER VIEW public.public_profiles SET (security_invoker = false);
REVOKE ALL ON public.public_profiles FROM anon, public;
GRANT SELECT ON public.public_profiles TO authenticated;

-- ── REALTIME: live message delivery ─────────────────────────────────────────
-- ChatScreen subscribes to INSERTs on public.messages. Supabase does not add new
-- tables to the realtime publication automatically, so live chat won't fire
-- until messages is a member. Guarded so this is safe to re-run.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
END $$;

-- ── EVENTS: minimum age (age gate) ──────────────────────────────────────────
-- Optional per-event age restriction. NULL = no restriction. The RSVP flow
-- blocks a guest whose profile date_of_birth makes them younger than this.
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS min_age int;
