import { supabase } from './supabaseClient';

export type Message = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
};

export type ConversationPreview = {
  other_id: string;
  other_display_name: string;
  other_avatar_url: string | null;
  last_message: string;
  last_message_at: string;
  unread_count: number;
};

export async function sendMessage(
  senderId: string,
  receiverId: string,
  content: string,
): Promise<Message | null> {
  const { data, error } = await supabase
    .from('messages')
    .insert({ sender_id: senderId, receiver_id: receiverId, content })
    .select()
    .single();
  if (error) return null;
  return data as Message;
}

export async function fetchConversation(
  userId: string,
  otherId: string,
): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${userId})`)
    .order('created_at', { ascending: true });
  if (error || !data) return [];
  // Mark received messages as read
  const unread = (data as Message[]).filter(m => m.receiver_id === userId && !m.read_at).map(m => m.id);
  if (unread.length > 0) {
    supabase.from('messages').update({ read_at: new Date().toISOString() }).in('id', unread);
  }
  return data as Message[];
}

export function subscribeToConversation(
  userId: string,
  otherId: string,
  onMessage: (msg: Message) => void,
) {
  const channel = supabase
    .channel(`conv:${[userId, otherId].sort().join('-')}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${userId}`,
      },
      payload => {
        const msg = payload.new as Message;
        if (msg.sender_id === otherId) onMessage(msg);
      },
    )
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}

export async function fetchConversations(userId: string): Promise<ConversationPreview[]> {
  // Get all messages where user is sender or receiver, then build conversation list
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order('created_at', { ascending: false });
  if (error || !data) return [];

  const msgs = data as Message[];

  // Build a map of other_id → most recent message
  const convMap = new Map<string, Message>();
  for (const msg of msgs) {
    const otherId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
    if (!convMap.has(otherId)) convMap.set(otherId, msg);
  }

  if (convMap.size === 0) return [];

  // Fetch profiles for each conversation partner
  const ids = Array.from(convMap.keys());
  const { data: profiles } = await supabase
    .from('public_profiles')
    .select('id, display_name, avatar_url')
    .in('id', ids);

  const profileMap: Record<string, { display_name: string; avatar_url: string | null }> = {};
  (profiles ?? []).forEach((p: any) => { profileMap[p.id] = p; });

  // Count unread per conversation
  const unreadCounts: Record<string, number> = {};
  for (const msg of msgs) {
    if (msg.receiver_id === userId && !msg.read_at) {
      const key = msg.sender_id;
      unreadCounts[key] = (unreadCounts[key] ?? 0) + 1;
    }
  }

  return Array.from(convMap.entries()).map(([otherId, lastMsg]) => ({
    other_id: otherId,
    other_display_name: profileMap[otherId]?.display_name ?? 'Unknown',
    other_avatar_url: profileMap[otherId]?.avatar_url ?? null,
    last_message: lastMsg.content,
    last_message_at: lastMsg.created_at,
    unread_count: unreadCounts[otherId] ?? 0,
  }));
}
