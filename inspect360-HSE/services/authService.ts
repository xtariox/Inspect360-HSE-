import { supabase } from '../config/supabase'
import { isValidCompanyEmail } from '../config/constants'
import type { RegisterData, LoginData, AuthResponse, UserProfile } from '../types/auth'

// Password policy: at least 8 characters, one uppercase, one lowercase, one digit, one special character
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;


// authService provides registration, login, logout, and user profile fetch logic
export const authService = {
  // Register a new user
  async register({ email, password, fullName }: RegisterData): Promise<AuthResponse> {
    console.log('Starting registration for:', email); // Debug log

    // 1. Validate company domain (must be @ocp.com)
    if (!isValidCompanyEmail(email)) {
      throw new Error('Registration is only allowed for @ocp.com email addresses')
    }

    // 2. Validate password strength
    if (!passwordRegex.test(password)) {
      throw new Error('Password must be at least 8 characters long and include uppercase, lowercase, a number, and a special character.')
    }

    // 3. Create user in Supabase Auth with metadata
    console.log('Creating auth user...'); // Debug log
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        }
      }
    })

    if (authError) {
      console.log('Auth error:', authError); // Debug log
      throw authError
    }
    if (!authData.user) throw new Error('Registration failed')

    console.log('Auth user created:', authData.user.id); // Debug log

    // 4. The profile will be created automatically by the database trigger
    // Wait a moment for the trigger to execute
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 5. Verify the profile was created
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (profileError) {
      console.log('Profile verification failed:', profileError); // Debug log
      throw new Error('Profile creation failed. Please contact support.')
    }

    console.log('Profile verified:', profile); // Debug log

    // 6. Sign out the user immediately after registration
    // They should not be logged in until approved by admin
    await supabase.auth.signOut();

    // 7. Return user and message
    return { 
      user: authData.user, 
      profile,
      message: 'Registration successful! Please wait for admin approval before logging in.' 
    }
  },

  // Login an existing user
  async login({ email, password }: LoginData): Promise<AuthResponse> {
    // 1. Check for missing credentials
    if (!email && !password) {
      throw new Error('Please enter both your email and password.')
    }
    if (!email) {
      throw new Error('Please enter your email address.')
    }
    if (!password) {
      throw new Error('Please enter your password.')
    }

    // 2. Validate company domain
    if (!isValidCompanyEmail(email)) {
      throw new Error('Login is only allowed for @ocp.com email addresses.')
    }

    // 3. Attempt login with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    console.log('Attempting login for:', email); // Debug log

    // 4. Handle Supabase errors (invalid credentials, etc.)
    if (error) {
      console.error('Auth error:', error); // Debug log
      // Supabase returns 400 for invalid credentials
      if (error.message && error.message.toLowerCase().includes('invalid login credentials')) {
        throw new Error('Incorrect email or password. Please try again.')
      }
      throw error
    }

    // 5. Check if user exists in Auth
    if (!data.user) {
      throw new Error('User not found. Please register first.')
    }

    // 6. Fetch user profile from custom table
    let { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', data.user.id)
      .single()

    // 7. If profile doesn't exist, create it automatically
    if (profileError && profileError.code === 'PGRST116') {
      console.log('Profile not found, creating one for:', email);
      
      const isAdmin = email === 'admin@ocp.com';
      const newProfile = {
        id: data.user.id,
        full_name: data.user.user_metadata?.full_name || (isAdmin ? 'System Administrator' : 'User'),
        email: email,
        role: isAdmin ? 'admin' : 'inspector',
        status: isAdmin ? 'approved' : 'pending',
        company_domain: email.split('@')[1],
        approved_at: isAdmin ? new Date().toISOString() : null,
        approved_by: isAdmin ? data.user.id : null
      };

      const { data: createdProfile, error: createError } = await supabase
        .from('user_profiles')
        .insert([newProfile])
        .select()
        .single();

      if (createError) {
        console.error('Failed to create profile:', createError);
        await supabase.auth.signOut();
        throw new Error('Unable to create user profile. Please contact your administrator.');
      }

      profile = createdProfile;
      console.log('Profile created successfully for:', email);
      
    } else if (profileError) {
      console.error('Profile fetch error:', profileError);
      console.error('Error details:', {
        code: profileError.code,
        message: profileError.message,
        details: profileError.details
      });
      
      // Check for infinite recursion error specifically
      if (profileError.code === '42P17') {
        await supabase.auth.signOut();
        throw new Error('Database policy error detected. Please run the fix-admin-profile.sql script to resolve RLS policy conflicts.');
      }
      
      await supabase.auth.signOut();
      throw new Error(`Profile access error: ${profileError.message}`);
    }

    // 8. Check if user is approved by admin (skip for admin user)
    if (profile?.status !== 'approved') {
      await supabase.auth.signOut()
      throw new Error('Your account is pending admin approval.')
    }

    // 9. Return user and profile
    return { user: data.user, profile }
  },


  // Logout the current user
  async logout(): Promise<void> {
    console.log('AuthService - logout() called');
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('AuthService - logout error:', error);
      throw error;
    }
    console.log('AuthService - logout successful');
  },

  // Get the current user's profile (if logged in)
  async getCurrentUser(): Promise<UserProfile | null> {
    try {
      console.log('🔍 AuthService - getCurrentUser() started');
      const { data: { session } } = await supabase.auth.getSession()
      console.log('🔍 AuthService - Session retrieved:', !!session?.user);
      
      if (!session?.user) {
        console.log('🔍 AuthService - No session found, returning null');
        return null;
      }

      console.log('AuthService - Session user:', {
        id: session.user.id,
        email: session.user.email,
        created_at: session.user.created_at
      }); // Enhanced debug log

      console.log('🔍 AuthService - Fetching profile from database...');
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (error) {
        console.error('❌ AuthService - Profile fetch error:', error);
        return null;
      }

      console.log('✅ AuthService - Profile fetched successfully:', {
        id: profile?.id,
        email: profile?.email,
        role: profile?.role,
        full_name: profile?.full_name
      }); // Enhanced debug log

      return profile;
    } catch (error) {
      console.error('❌ AuthService - getCurrentUser() error:', error);
      return null;
    }
  }
}
export default authService;