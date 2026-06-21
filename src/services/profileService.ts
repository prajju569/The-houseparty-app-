/**
 * Supabase profile service.
 *
 * Run this SQL in your Supabase SQL Editor before using:
 *
 *   ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username       text UNIQUE;
 *   ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gender         text;
 *   ALTER TABLE profiles ADD COLUMN IF NOT EXISTS date_of_birth  date;
 *   ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone          text;
 *   ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio            text;
 *   ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at     timestamptz DEFAULT now();
 *
 *   -- Create avatars bucket: Storage > New Bucket > "avatars" > public: true
 */

import { supabase } from './supabaseClient';
import type { Profile } from '../shared/types';
import type { PlaylistTrack } from './playlistService';
import { blobTooLarge } from '../shared/utils/image';

/** Cross-user-readable profile (the public_profiles view — no PII). */
export type PublicProfile = {
  id: string;
  username: string | null;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  top_genres: string[] | null;
  top_artists: string[] | null;
  vibe_tags: string[] | null;
  top_songs: PlaylistTrack[] | null;
  role: 'guest' | 'host';
  is_private: boolean | null;
  is_verified: boolean | null;
};

const PUBLIC_COLS =
  'id, username, display_name, avatar_url, bio, top_genres, top_artists, vibe_tags, top_songs, role, is_private, is_verified';

/** Read any user's safe public profile (used for user-to-user profile views). */
export async function fetchPublicProfile(userId: string): Promise<PublicProfile | null> {
  const { data, error } = await supabase
    .from('public_profiles')
    .select(PUBLIC_COLS)
    .eq('id', userId)
    .maybeSingle();
  if (error) {
    console.warn('[profileService] fetchPublicProfile:', error.message);
    return null;
  }
  return (data as PublicProfile) ?? null;
}

/** Search people by username or display name. Input is sanitized because it is
 *  interpolated into a PostgREST or() filter expression. */
export async function searchUsers(query: string, excludeId?: string): Promise<PublicProfile[]> {
  // Strip characters that have meaning inside an or()/ilike filter expression.
  const q = query.trim().replace(/[,()*%\\]/g, '').slice(0, 40);
  if (!q) return [];
  let req = supabase
    .from('public_profiles')
    .select(PUBLIC_COLS)
    .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
    .limit(20);
  if (excludeId) req = req.neq('id', excludeId);
  const { data, error } = await req;
  if (error) {
    console.warn('[profileService] searchUsers:', error.message);
    return [];
  }
  return (data as PublicProfile[]) ?? [];
}

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) {
    console.warn('[profileService] fetchProfile:', error.message);
    return null;
  }
  return data as Profile;
}

export type ProfileUpdate = Partial<
  Pick<Profile, 'display_name' | 'username' | 'gender' | 'date_of_birth' | 'phone' | 'bio' | 'avatar_url' | 'top_genres' | 'top_artists' | 'vibe_tags' | 'fav_playlist_url'>
>;

export async function updateProfile(userId: string, updates: ProfileUpdate): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('profiles')
    .upsert({ id: userId, ...updates, updated_at: new Date().toISOString() });
  return { error: error ? error.message : null };
}

export async function uploadAvatar(userId: string, localUri: string): Promise<string | null> {
  try {
    const response = await fetch(localUri);
    const blob = await response.blob();
    if (blobTooLarge(blob)) {
      console.warn('[profileService] uploadAvatar: image exceeds size limit');
      return null;
    }

    const filePath = `${userId}/avatar.jpg`;
    const { error } = await supabase.storage
      .from('avatars')
      .upload(filePath, blob, { upsert: true, contentType: 'image/jpeg' });

    if (error) {
      console.warn('[profileService] uploadAvatar:', error.message);
      return null;
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
    // Bust the cache so the new image shows immediately
    return `${data.publicUrl}?t=${Date.now()}`;
  } catch (e) {
    console.warn('[profileService] uploadAvatar exception:', e);
    return null;
  }
}
