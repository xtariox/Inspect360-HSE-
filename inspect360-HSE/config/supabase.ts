import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

const supabaseUrl = 'https://azbiswhhtqkftghmygdm.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6Ymlzd2hodHFrZnRnaG15Z2RtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4Mjg0MDQsImV4cCI6MjA2ODQwNDQwNH0.aqoaxgqYpaJrIk_IAYa2jHLW0zXJ5Ij5PyAkAfdN8yU'

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)