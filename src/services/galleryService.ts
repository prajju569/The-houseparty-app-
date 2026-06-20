import { supabase } from './supabaseClient';

export type GalleryItem = {
  id: string;
  event_id: string;
  uploader_id: string;
  image_url: string;
  caption: string | null;
  like_count: number;
  created_at: string;
  profiles?: { display_name: string; avatar_url: string | null } | null;
};

export async function fetchGalleryItems(eventId: string): Promise<GalleryItem[]> {
  const { data, error } = await supabase
    .from('gallery')
    .select('*, profiles(display_name, avatar_url)')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return data as GalleryItem[];
}

export async function uploadGalleryPhoto(
  eventId: string,
  uploaderId: string,
  localUri: string,
  caption?: string,
): Promise<GalleryItem | null> {
  try {
    const response = await fetch(localUri);
    const blob = await response.blob();
    const filePath = `${eventId}/${uploaderId}/${Date.now()}.jpg`;
    const { error: uploadError } = await supabase.storage
      .from('gallery')
      .upload(filePath, blob, { contentType: 'image/jpeg', upsert: false });
    if (uploadError) return null;
    const { data: urlData } = supabase.storage.from('gallery').getPublicUrl(filePath);
    const { data, error } = await supabase
      .from('gallery')
      .insert({
        event_id: eventId,
        uploader_id: uploaderId,
        image_url: urlData.publicUrl,
        caption: caption?.trim() || null,
        like_count: 0,
      })
      .select('*, profiles(display_name, avatar_url)')
      .single();
    if (error) return null;
    return data as GalleryItem;
  } catch {
    return null;
  }
}

export async function toggleGalleryLike(
  itemId: string,
  userId: string,
  currentlyLiked: boolean,
): Promise<boolean> {
  if (currentlyLiked) {
    const { error } = await supabase.from('gallery_likes').delete()
      .eq('item_id', itemId).eq('user_id', userId);
    if (!error) {
      await supabase.rpc('decrement_gallery_like', { item_id: itemId });
    }
    return !error;
  } else {
    const { error } = await supabase.from('gallery_likes').insert({ item_id: itemId, user_id: userId });
    if (!error) {
      await supabase.rpc('increment_gallery_like', { item_id: itemId });
    }
    return !error;
  }
}

export async function fetchMyLikes(userId: string, itemIds: string[]): Promise<Set<string>> {
  if (itemIds.length === 0) return new Set();
  const { data } = await supabase
    .from('gallery_likes')
    .select('item_id')
    .eq('user_id', userId)
    .in('item_id', itemIds);
  return new Set((data ?? []).map((r: any) => r.item_id));
}
