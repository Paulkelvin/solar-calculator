'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/auth';
import type { AuthSession, AuthUser, InstallerProfile } from '../../types/auth';

interface AuthContextType {
  session: AuthSession;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession>({
    user: null,
    installer: null,
    isLoading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    // Get initial session
    const initAuth = async () => {
      try {
        const {
          data: { session: sbSession },
        } = await supabase.auth.getSession();

        if (sbSession?.user) {
          const user: AuthUser = {
            id: sbSession.user.id,
            email: sbSession.user.email || '',
            installer_id: null,
            created_at: sbSession.user.created_at || new Date().toISOString(),
          };

          // Fetch installer profile
          const { data: installer } = await supabase
            .from('installers')
            .select('*')
            .eq('id', sbSession.user.id)
            .single();

          setSession({
            user,
            installer: installer || null,
            isLoading: false,
            isAuthenticated: true,
          });
        } else {
          setSession({
            user: null,
            installer: null,
            isLoading: false,
            isAuthenticated: false,
          });
        }
      } catch (error) {
        console.error('Auth init error:', error);
        setSession({
          user: null,
          installer: null,
          isLoading: false,
          isAuthenticated: false,
        });
      }
    };

    initAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, sbSession) => {
      if (sbSession?.user) {
        const user: AuthUser = {
          id: sbSession.user.id,
          email: sbSession.user.email || '',
          installer_id: null,
          created_at: sbSession.user.created_at || new Date().toISOString(),
        };

        // Fetch installer profile
        const { data: installer } = await supabase
          .from('installers')
          .select('*')
          .eq('id', sbSession.user.id)
          .single();

        setSession({
          user,
          installer: installer || null,
          isLoading: false,
          isAuthenticated: true,
        });
      } else {
        setSession({
          user: null,
          installer: null,
          isLoading: false,
          isAuthenticated: false,
        });
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSession({
      user: null,
      installer: null,
      isLoading: false,
      isAuthenticated: false,
    });
  };

  return (
    <AuthContext.Provider value={{ session, signOut: handleSignOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
