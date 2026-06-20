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
