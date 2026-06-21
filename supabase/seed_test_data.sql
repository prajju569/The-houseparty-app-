-- ============================================================================
-- HouseParty — test data seed
-- Run in the Supabase SQL Editor. Idempotent (safe to re-run).
--
-- SAFE BY DESIGN: it only touches the auth users whose emails are listed in the
-- _seed block below. Your real account is never affected unless you add it here.
--
-- BEFORE RUNNING: edit the emails in the _seed INSERT to match the test auth
-- users you created (Authentication > Users). The one row with role 'host' is
-- the verified host of the shared event; the rest are guests who RSVP to it.
-- ============================================================================

BEGIN;

-- Persona table → resolved to auth user ids by email -------------------------
CREATE TEMP TABLE _seed (
  email text, display_name text, username text, bio text, avatar_url text,
  genres text[], vibes text[], artists text[], lat numeric, lng numeric,
  role text, verified boolean
) ON COMMIT DROP;

INSERT INTO _seed VALUES
  ('ramesh@test.com','Ramesh K','ramesh',
   'Chasing the next rooftop set. Techno after midnight.',
   'https://i.pravatar.cc/300?img=12',
   ARRAY['House','Techno','Electronic'], ARRAY['🔥 Hype','💃 Dance','🌙 Late Night'],
   ARRAY['Fred again..','Disclosure','ODESZA'], 12.9716, 77.6412, 'guest', false),

  ('priya@test.com','Priya Nair','priya',
   'Host of golden-hour sessions. R&B soul, good people, better views.',
   'https://i.pravatar.cc/300?img=45',
   ARRAY['R&B','Soul','Hip-Hop'], ARRAY['🌿 Chill','🍸 Cocktails','🎵 Live Music'],
   ARRAY['SZA','Frank Ocean','Drake'], 12.9352, 77.6245, 'host', true),

  ('aditya@test.com','Aditya Rao','aditya',
   'Warehouse raver. Four Tet on repeat.',
   'https://i.pravatar.cc/300?img=33',
   ARRAY['Techno','House','Drum & Bass'], ARRAY['🔥 Hype','🌙 Late Night'],
   ARRAY['Bicep','Four Tet','Fred again..'], 12.9116, 77.6389, 'guest', false),

  ('sara@test.com','Sara Mathew','sara',
   'Indie kid, lo-fi afternoons, film photos.',
   'https://i.pravatar.cc/300?img=20',
   ARRAY['Indie','Pop','Lo-Fi'], ARRAY['🌿 Chill','🎨 Creative'],
   ARRAY['Tame Impala','Clairo','Mac DeMarco'], 12.9298, 77.5878, 'guest', false),

  ('karan@test.com','Karan Shah','karan',
   'Hip-hop heart, afrobeats summers.',
   'https://i.pravatar.cc/300?img=51',
   ARRAY['Hip-Hop','R&B','Afrobeats'], ARRAY['🔥 Hype','💃 Dance'],
   ARRAY['Drake','Burna Boy','Travis Scott'], 12.9698, 77.7499, 'guest', false),

  ('meera@test.com','Meera Iyer','meera',
   'House + indie, sunset rooftops, slow mornings.',
   'https://i.pravatar.cc/300?img=27',
   ARRAY['House','Indie','Electronic'], ARRAY['🌿 Chill','🎵 Live Music','🍸 Cocktails'],
   ARRAY['ODESZA','Bonobo','Tame Impala'], 12.9784, 77.6408, 'guest', false);

CREATE TEMP TABLE _su ON COMMIT DROP AS
  SELECT u.id, s.* FROM _seed s JOIN auth.users u ON lower(u.email) = lower(s.email);

-- 1) Enrich the matched profiles. is_verified is guarded by a trigger, so we
--    briefly disable it for this server-side seed.
ALTER TABLE public.profiles DISABLE TRIGGER trg_guard_is_verified;

UPDATE public.profiles p SET
  display_name = su.display_name,
  username     = COALESCE(p.username, su.username),
  bio          = su.bio,
  avatar_url   = su.avatar_url,
  top_genres   = su.genres,
  vibe_tags    = su.vibes,
  top_artists  = su.artists,
  lat          = su.lat,
  lng          = su.lng,
  role         = su.role,
  is_verified  = su.verified,
  updated_at   = now()
FROM _su su
WHERE p.id = su.id;

ALTER TABLE public.profiles ENABLE TRIGGER trg_guard_is_verified;

-- 2) One shared upcoming Bengaluru event hosted by the verified host. Real
--    lat/lng so it shows on BOTH Home and Discover.
INSERT INTO public.events
  (id, host_id, title, description, vibe, date, venue, address, area,
   capacity, entry_fee, is_private, status, lat, lng)
SELECT gen_random_uuid(), su.id,
  'Rooftop Sundowner · Indiranagar',
  'Golden-hour rooftop session — house, sundowners and the best skyline in Bengaluru.',
  ARRAY['🔥 Hot','🥂 Rooftop','🎵 Music'],
  now() + interval '12 days',
  'The Terrace, 12th Floor', '100 Feet Road, Indiranagar', 'Indiranagar',
  40, 0, false, 'upcoming', 12.9716, 77.6412
FROM _su su
WHERE su.role = 'host'
  AND NOT EXISTS (SELECT 1 FROM public.events WHERE title = 'Rooftop Sundowner · Indiranagar');

-- 3) Every guest persona RSVPs the event (confirmed). Unique booking_ref derived
--    from the user id so re-runs are stable.
INSERT INTO public.bookings (event_id, guest_id, status, guest_count, booking_ref)
SELECT e.id, su.id, 'confirmed', 1,
       'HP-SEED-' || upper(left(replace(su.id::text, '-', ''), 6))
FROM (SELECT id FROM public.events WHERE title = 'Rooftop Sundowner · Indiranagar' LIMIT 1) e
CROSS JOIN _su su
WHERE su.role <> 'host'
ON CONFLICT (event_id, guest_id) DO NOTHING;

-- 4) Follow graph: every guest follows the host; host + two guests follow Ramesh
--    so he has non-zero followers and following.
INSERT INTO public.follows (follower_id, following_id)
SELECT g.id, h.id
FROM _su g CROSS JOIN _su h
WHERE h.role = 'host' AND g.role <> 'host'
ON CONFLICT DO NOTHING;

INSERT INTO public.follows (follower_id, following_id)
SELECT f.id, r.id
FROM _su f, _su r
WHERE r.email = 'ramesh@test.com'
  AND f.email IN ('priya@test.com','aditya@test.com','sara@test.com')
ON CONFLICT DO NOTHING;

-- 5) A couple of reviews so the verified host has a rating.
INSERT INTO public.host_reviews (host_id, reviewer_id, event_id, rating, comment)
SELECT h.id, gu.id, e.id, rv.rating, rv.comment
FROM (SELECT id FROM public.events WHERE title = 'Rooftop Sundowner · Indiranagar' LIMIT 1) e
CROSS JOIN _su h
JOIN (VALUES
        ('ramesh@test.com', 5, 'Incredible host — best rooftop party I''ve been to.'),
        ('aditya@test.com', 5, 'Sound system was unreal. Already waiting for the next one.')
     ) AS rv(email, rating, comment) ON true
JOIN _su gu ON gu.email = rv.email
WHERE h.role = 'host'
ON CONFLICT (host_id, reviewer_id, event_id) DO NOTHING;

COMMIT;
