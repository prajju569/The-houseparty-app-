export type Profile = {
  id: string;
  email?: string | null;
  username: string;
  display_name: string;
  avatar_url?: string | null;
  role: 'guest' | 'host';
  date_of_birth?: string | null;
  gender?: string | null;
  phone?: string | null;
  bio?: string | null;
  // Music & vibe fields (Sprint E)
  top_genres?: string[] | null;
  top_artists?: string[] | null;
  vibe_tags?: string[] | null;
  fav_playlist_url?: string | null;
  is_private?: boolean | null;
  show_party_pics?: boolean | null;
  created_at?: string;
  updated_at?: string;
};
