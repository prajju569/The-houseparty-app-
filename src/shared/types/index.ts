export type UserRole = 'host' | 'guest';

export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Party {
  id: string;
  host_id: string;
  title: string;
  description: string | null;
  location: string;
  date: string;
  max_guests: number | null;
  is_public: boolean;
  created_at: string;
}
