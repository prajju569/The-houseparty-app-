// @ts-nocheck
// Supabase Edge Function (Deno) — imports a public Spotify playlist's tracks.
//
// The Spotify Client Secret stays here (server-side); the app only ever calls
// this function with a playlist URL. Uses the Client-Credentials flow (no user
// login) to read PUBLIC playlists.
//
// Deploy:  supabase functions deploy spotify-playlist
// Secrets: supabase secrets set SPOTIFY_CLIENT_ID=... SPOTIFY_CLIENT_SECRET=...

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Accepts open.spotify.com/playlist/<id>?si=..., spotify:playlist:<id>, or a bare id.
function parsePlaylistId(url: string): string | null {
  const m = url.match(/playlist[/:]([A-Za-z0-9]+)/);
  if (m) return m[1];
  if (/^[A-Za-z0-9]{20,}$/.test(url.trim())) return url.trim();
  return null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { url } = await req.json().catch(() => ({}));
    const playlistId = parsePlaylistId(url ?? '');
    if (!playlistId) return json({ error: 'That doesn’t look like a Spotify playlist link.' }, 400);

    const clientId = Deno.env.get('SPOTIFY_CLIENT_ID');
    const clientSecret = Deno.env.get('SPOTIFY_CLIENT_SECRET');
    if (!clientId || !clientSecret) {
      return json({ error: 'Spotify credentials are not configured on the server.' }, 500);
    }

    // 1) App access token (Client Credentials).
    const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + btoa(`${clientId}:${clientSecret}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });
    if (!tokenRes.ok) {
      return json({ error: 'Spotify auth failed — check the Client ID/Secret.' }, 502);
    }
    const { access_token } = await tokenRes.json();

    // 2) Playlist metadata + first 100 tracks.
    const fields =
      'name,images,tracks.items(track(name,duration_ms,artists(name),album(images)))';
    const plRes = await fetch(
      `https://api.spotify.com/v1/playlists/${playlistId}?fields=${encodeURIComponent(fields)}`,
      { headers: { Authorization: `Bearer ${access_token}` } },
    );

    if (plRes.status === 404) return json({ error: 'Playlist not found, or it’s private.' }, 404);
    if (plRes.status === 403) {
      return json({ error: 'Spotify rejected the request (Web API access may require Premium for this app).' }, 403);
    }
    if (!plRes.ok) return json({ error: `Spotify API error (${plRes.status}).` }, 502);

    const pl = await plRes.json();
    const tracks = (pl.tracks?.items ?? [])
      .map((it: any) => it?.track)
      .filter(Boolean)
      .map((t: any) => ({
        title: t.name ?? 'Untitled',
        artist: (t.artists ?? []).map((a: any) => a.name).filter(Boolean).join(', ') || 'Unknown artist',
        duration_s: typeof t.duration_ms === 'number' ? Math.round(t.duration_ms / 1000) : null,
        // smallest album image = good thumbnail
        thumbnail_url: t.album?.images?.length ? t.album.images[t.album.images.length - 1].url : null,
      }));

    return json({
      title: pl.name ?? 'Spotify playlist',
      thumbnail: pl.images?.[0]?.url ?? null,
      track_count: tracks.length,
      tracks,
    });
  } catch (e) {
    return json({ error: `Importer error: ${String(e)}` }, 500);
  }
});
