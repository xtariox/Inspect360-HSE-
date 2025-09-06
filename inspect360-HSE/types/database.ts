import type { UserProfile } from './auth'

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: UserProfile
        Insert: Omit<UserProfile, 'id' | 'created_at' | 'approved_at'>
        Update: Partial<Omit<UserProfile, 'id' | 'created_at'>>
      }
    }
  }
}