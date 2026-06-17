export type UserRole = 'host' | 'guest';

export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null;
  date_of_birth: string | null; // ISO date YYYY-MM-DD
  phone: string | null;
  bio: string | null;
  created_at: string;
  updated_at?: string | null;
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
