import { getSupabaseClient } from './client';

// Use the singleton Supabase client to avoid multiple instances warning
export const supabase = getSupabaseClient();

/**
 * Sign up with email/password
 * Creates auth user and installer profile
 */
export async function signUp(
  email: string, 
  password: string,
  name: string
) {
  try {
    // Create auth user
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${appUrl}/auth/callback`,
        data: {
          name,
        },
      },
    });

    if (authError) {
      // Handle Supabase email sending failures gracefully
      if (authError.message?.includes('sending confirmation email') || 
          authError.message?.includes('email rate limit')) {
        throw new Error(
          'Account may have been created, but the confirmation email could not be sent. ' +
          'Please try logging in, or wait a few minutes and try signing up again.'
        );
      }
      throw authError;
    }
    if (!authData.user) throw new Error('Failed to create user');

    // Create installer profile
    const { error: profileError } = await supabase
      .from('installers')
      .insert({
        id: authData.user.id,
        email: email,
        company_name: name + ' Solar Co.', // Default company name
        contact_name: name,
        state: 'CA', // Default state, can be made configurable later
      });

    if (profileError) {
      console.error('Failed to create installer profile:', profileError);
      // Don't throw here - the user account is created, profile can be completed later
    }

    return { success: true, user: authData.user };
  } catch (error) {
    console.error('Sign up error:', error);
    throw error;
  }
}

/**
 * Sign in with email/password
 */
export async function signIn(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Provide user-friendly error message
      if (error.message === 'Invalid login credentials') {
        throw new Error('Incorrect email or password. Please try again.');
      }
      throw error;
    }

    return { success: true, session: data.session };
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  }
}

/**
 * Sign out
 */
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
}

/**
 * Sign in with Google OAuth
 */
export async function signInWithGoogle() {
  try {
    // Use window.location.origin so the redirect always points to the current domain
    // (works correctly in both local dev and production without needing NEXT_PUBLIC_APP_URL)
    const appUrl =
      typeof window !== 'undefined'
        ? window.location.origin
        : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${appUrl}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account',
        },
      },
    });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Google sign in error:', error);
    throw error;
  }
}

/**
 * Reset password
 */
export async function resetPassword(email: string) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/update-password`,
    });

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Reset password error:', error);
    throw error;
  }
}

/**
 * Get current session
 */
export async function getSession() {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  } catch (error) {
    console.error('Get session error:', error);
    return null;
  }
}

/**
 * Get current user
 */
export async function getCurrentUser() {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data.user;
  } catch (error) {
    console.error('Get user error:', error);
    return null;
  }
}

/**
 * Get installer profile for user
 */
export async function getInstallerProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from('installers')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Get installer profile error:', error);
    return null;
  }
}

/**
 * Update installer profile
 */
export async function updateInstallerProfile(
  userId: string,
  updates: { company_name?: string; phone?: string; website?: string }
) {
  try {
    const { data, error } = await supabase
      .from('installers')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Update installer profile error:', error);
    throw error;
  }
}
