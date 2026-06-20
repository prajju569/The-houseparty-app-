import { supabase } from './supabaseClient';

export type PlaylistTrack = {
  title: string;
  artist: string;
  duration_s: number | null;
  thumbnail_url: string | null;
};

export type PlaylistMeta = {
  platform: 'spotify' | 'youtube' | 'unknown';
  title: string;
  thumbnail: string | null;
  track_count: number | null;
};

export function detectPlatform(url: string): 'spotify' | 'youtube' | 'unknown' {
  if (url.includes('spotify.com')) return 'spotify';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  return 'unknown';
}

export async function fetchPlaylistMeta(url: string): Promise<PlaylistMeta | null> {
  try {
    const platform = detectPlatform(url);
    if (platform === 'unknown') return null;

    const oembedBase = platform === 'spotify'
      ? `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`
      : `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;

    const res = await fetch(oembedBase, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) return null;
    const json = await res.json();

    return {
      platform,
      title: json.title ?? 'Playlist',
      thumbnail: json.thumbnail_url ?? null,
      track_count: null, // oEmbed doesn't return track count — shown as "?" in UI
    };
  } catch {
    return null;
  }
}

/**
 * Import a public Spotify playlist's full track list via the spotify-playlist
 * edge function (the Client Secret lives server-side, never in the app).
 */
export async function importSpotifyPlaylist(
  url: string,
): Promise<{ ok: true; meta: PlaylistMeta; tracks: PlaylistTrack[] } | { ok: false; error: string }> {
  const { data, error } = await supabase.functions.invoke('spotify-playlist', { body: { url } });

  if (error) {
    // Try to surface the function's JSON error body (e.g. 403 Premium gate).
    let msg = error.message ?? 'Could not reach the Spotify importer.';
    try {
      const ctx = (error as any).context;
      const body = ctx && typeof ctx.json === 'function' ? await ctx.json() : null;
      if (body?.error) msg = body.error;
    } catch { /* keep generic message */ }
    return { ok: false, error: msg };
  }
  if (!data || data.error) return { ok: false, error: data?.error ?? 'Import failed.' };

  return {
    ok: true,
    meta: {
      platform: 'spotify',
      title: data.title ?? 'Spotify playlist',
      thumbnail: data.thumbnail ?? null,
      track_count: data.track_count ?? (data.tracks?.length ?? null),
    },
    tracks: (data.tracks ?? []) as PlaylistTrack[],
  };
}

export async function savePlaylist(
  eventId: string,
  playlistUrl: string,
  tracks: PlaylistTrack[],
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('events')
    .update({ playlist_url: playlistUrl, playlist_tracks: tracks })
    .eq('id', eventId);
  return { error: error?.message ?? null };
}

export async function updateTrackList(
  eventId: string,
  tracks: PlaylistTrack[],
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('events')
    .update({ playlist_tracks: tracks })
    .eq('id', eventId);
  return { error: error?.message ?? null };
}
