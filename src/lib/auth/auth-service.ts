/**
 * Phase 6.1: Authentication Service
 * Handles Supabase auth operations (signup, login, logout, session management)
 */

import { getSupabaseClient } from '../supabase/client';
import type { AuthUser, Installer } from './auth-types';

// Use the singleton Supabase client to avoid multiple instances warning
const supabase = getSupabaseClient();

/**
 * Sign up a new installer
 */
export async function signUp(
  email: string,
  password: string,
  installerData: Partial<Installer>
): Promise<{ user: AuthUser; installer: Installer }> {
  try {
    // 1. Create user in auth.users
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    });

    if (authError || !authData.user) {
      throw new Error(authError?.message || 'Signup failed');
    }

    // 2. Create installer profile
    const { data: installerRecord, error: insertError } = await supabase
      .from('installers')
      .insert({
        id: authData.user.id,
        email,
        company_name: installerData.company_name || '',
        contact_name: installerData.contact_name || '',
        phone: installerData.phone,
        state: installerData.state || 'CA',
      })
      .select()
      .single();

    if (insertError || !installerRecord) {
      // Clean up auth user if installer creation failed
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw new Error(insertError?.message || 'Failed to create installer profile');
    }

    return {
      user: {
        id: authData.user.id,
        email: authData.user.email || '',
        created_at: authData.user.created_at,
      },
      installer: installerRecord as unknown as Installer,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Signup failed';
    throw new Error(message);
  }
}

/**
 * Sign in an existing installer
 */
export async function signIn(email: string, password: string): Promise<{ user: AuthUser; installer: Installer }> {
  try {
    // 1. Authenticate with email/password
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      throw new Error(authError?.message || 'Login failed');
    }

    // 2. Fetch installer profile
    const { data: installerRecord, error: fetchError } = await supabase
      .from('installers')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (fetchError || !installerRecord) {
      throw new Error(fetchError?.message || 'Installer profile not found');
    }

    return {
      user: {
        id: authData.user.id,
        email: authData.user.email || '',
        created_at: authData.user.created_at,
        last_sign_in_at: authData.user.last_sign_in_at,
      },
      installer: installerRecord as unknown as Installer,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed';
    throw new Error(message);
  }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<void> {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Logout failed';
    throw new Error(message);
  }
}

/**
 * Get the current user session
 */
export async function getSession(): Promise<{ user: AuthUser; installer: Installer } | null> {
  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !sessionData.session?.user) {
      return null;
    }

    // Fetch installer profile
    const { data: installerRecord, error: fetchError } = await supabase
      .from('installers')
      .select('*')
      .eq('id', sessionData.session.user.id)
      .single();

    if (fetchError || !installerRecord) {
      return null;
    }

    return {
      user: {
        id: sessionData.session.user.id,
        email: sessionData.session.user.email || '',
        created_at: sessionData.session.user.created_at,
        last_sign_in_at: sessionData.session.user.last_sign_in_at,
      },
      installer: installerRecord as unknown as Installer,
    };
  } catch (error) {
    console.error('Session fetch error:', error);
    return null;
  }
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChange(callback: (data: { user: AuthUser; installer: Installer } | null) => void) {
  return supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_OUT') {
      callback(null);
      return;
    }

    if (session?.user) {
      const sessionData = await getSession();
      callback(sessionData);
    }
  });
}
