export interface RegisterData {
  email: string
  password: string
  fullName: string
}

export interface LoginData {
  email: string
  password: string
}

export interface UserProfile {
  id: string
  full_name: string
  email: string
  role: 'inspector' | 'manager' | 'admin'
  status: 'pending' | 'approved' | 'rejected'
  company_domain: string
  created_at: string
  approved_at?: string
  approved_by?: string
}

export interface AuthResponse {
  user: any // Supabase user object
  profile?: UserProfile
  message?: string
}