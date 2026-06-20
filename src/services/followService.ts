import { supabase } from './supabaseClient';

export async function followUser(followerId: string, followingId: string): Promise<boolean> {
  const { error } = await supabase
    .from('follows')
    .insert({ follower_id: followerId, following_id: followingId });
  return !error;
}

export async function unfollowUser(followerId: string, followingId: string): Promise<boolean> {
  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('following_id', followingId);
  return !error;
}

export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  const { data } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .maybeSingle();
  return !!data;
}

export async function getFollowerCount(userId: string): Promise<number> {
  const { count } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', userId);
  return count ?? 0;
}

export async function getFollowingCount(userId: string): Promise<number> {
  const { count } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', userId);
  return count ?? 0;
}

export type HostReview = {
  id: string;
  host_id: string;
  reviewer_id: string;
  event_id: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
  profiles?: { display_name: string; avatar_url: string | null } | null;
};

export async function fetchHostReviews(hostId: string): Promise<HostReview[]> {
  const { data } = await supabase
    .from('host_reviews')
    .select('*, profiles(display_name, avatar_url)')
    .eq('host_id', hostId)
    .order('created_at', { ascending: false })
    .limit(20);
  return (data ?? []) as HostReview[];
}

export async function submitHostReview(
  hostId: string,
  reviewerId: string,
  eventId: string | null,
  rating: number,
  comment: string,
): Promise<boolean> {
  const { error } = await supabase.from('host_reviews').upsert({
    host_id: hostId,
    reviewer_id: reviewerId,
    event_id: eventId,
    rating,
    comment,
  }, { onConflict: 'host_id,reviewer_id,event_id' });
  return !error;
}

// ── Follow requests (Instagram-style) ────────────────────────────────────────

export type FollowRequest = {
  id: string;
  requester_id: string;
  target_id: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  profiles?: { display_name: string; username: string; avatar_url: string | null } | null;
};

export async function requestFollow(requesterId: string, targetId: string): Promise<boolean> {
  const { error } = await supabase
    .from('follow_requests')
    .upsert({ requester_id: requesterId, target_id: targetId, status: 'pending' },
      { onConflict: 'requester_id,target_id' });
  return !error;
}

export async function acceptFollowRequest(requestId: string, requesterId: string, targetId: string): Promise<boolean> {
  const [res1, res2] = await Promise.all([
    supabase.from('follow_requests').update({ status: 'accepted' }).eq('id', requestId),
    supabase.from('follows').upsert({ follower_id: requesterId, following_id: targetId },
      { onConflict: 'follower_id,following_id' }),
  ]);
  return !res1.error && !res2.error;
}

export async function declineFollowRequest(requestId: string): Promise<boolean> {
  const { error } = await supabase
    .from('follow_requests')
    .update({ status: 'declined' })
    .eq('id', requestId);
  return !error;
}

export async function getPendingRequests(userId: string): Promise<FollowRequest[]> {
  const { data } = await supabase
    .from('follow_requests')
    .select('*, profiles:requester_id(display_name, username, avatar_url)')
    .eq('target_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  return (data ?? []) as FollowRequest[];
}

export async function hasPendingRequest(requesterId: string, targetId: string): Promise<boolean> {
  const { data } = await supabase
    .from('follow_requests')
    .select('id')
    .eq('requester_id', requesterId)
    .eq('target_id', targetId)
    .eq('status', 'pending')
    .maybeSingle();
  return !!data;
}

// ── Nearby hosts ──────────────────────────────────────────────────────────────

export type NearbyHost = {
  id: string;
  display_name: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  event_count: number;
  distance_km: number;
};

export async function fetchNearbyHosts(lat: number, lng: number, radiusKm = 15): Promise<NearbyHost[]> {
  const { data: rpcData, error } = await supabase.rpc('nearby_hosts', {
    user_lat: lat, user_lng: lng, radius_km: radiusKm,
  });
  if (error || !rpcData || rpcData.length === 0) return [];

  const ids: string[] = rpcData.map((r: any) => r.id);
  const distMap: Record<string, number> = {};
  rpcData.forEach((r: any) => { distMap[r.id] = r.distance_km; });

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name, username, avatar_url, bio')
    .in('id', ids);

  const eventCounts: Record<string, number> = {};
  await Promise.all(
    ids.map(id =>
      supabase.from('events').select('id', { count: 'exact', head: true }).eq('host_id', id)
        .then(({ count }) => { eventCounts[id] = count ?? 0; })
    )
  );

  return (profiles ?? []).map((p: any) => ({
    ...p,
    event_count: eventCounts[p.id] ?? 0,
    distance_km: Math.round((distMap[p.id] ?? 0) * 10) / 10,
  })).sort((a, b) => a.distance_km - b.distance_km);
}

export async function getHostStats(hostId: string): Promise<{ avgRating: number; reviewCount: number; eventCount: number }> {
  const [reviewsRes, eventsRes] = await Promise.all([
    supabase.from('host_reviews').select('rating').eq('host_id', hostId),
    supabase.from('events').select('id', { count: 'exact', head: true }).eq('host_id', hostId),
  ]);
  const ratings = (reviewsRes.data ?? []).map((r: any) => r.rating as number);
  const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
  return {
    avgRating: Math.round(avgRating * 10) / 10,
    reviewCount: ratings.length,
    eventCount: eventsRes.count ?? 0,
  };
}
