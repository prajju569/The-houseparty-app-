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
