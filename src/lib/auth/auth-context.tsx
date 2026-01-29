/**
 * Phase 6.1: Auth Context
 * React context for managing authentication state across the app
 */

'use client';

import { createContext, useEffect, useState, useCallback } from 'react';
import type { AuthContext as AuthContextType, AuthUser, Installer } from './auth-types';
import { signUp, signIn, signOut, onAuthStateChange } from './auth-service';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [installer, setInstaller] = useState<Installer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Try to get existing session
        const { getSession } = await import('./auth-service');
        const session = await getSession();
        if (session) {
          setUser(session.user);
          setInstaller(session.installer);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: subscription } = onAuthStateChange((data) => {
      if (data) {
        setUser(data.user);
        setInstaller(data.installer);
      } else {
        setUser(null);
        setInstaller(null);
      }
    });

    return () => {
      subscription?.subscription?.unsubscribe();
    };
  }, []);

  const handleSignUp = useCallback(async (email: string, password: string, installerData: Partial<Installer>) => {
    setError(null);
    try {
      const result = await signUp(email, password, installerData);
      setUser(result.user);
      setInstaller(result.installer);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Signup failed';
      setError(message);
      throw err;
    }
  }, []);

  const handleSignIn = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      const result = await signIn(email, password);
      setUser(result.user);
      setInstaller(result.installer);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      throw err;
    }
  }, []);

  const handleSignOut = useCallback(async () => {
    setError(null);
    try {
      await signOut();
      setUser(null);
      setInstaller(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Logout failed';
      setError(message);
      throw err;
    }
  }, []);

  const value: AuthContextType = {
    user,
    installer,
    isLoading,
    isAuthenticated: !!user,
    signUp: handleSignUp,
    signIn: handleSignIn,
    signOut: handleSignOut,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
