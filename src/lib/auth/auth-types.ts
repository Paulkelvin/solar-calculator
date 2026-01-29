/**
 * Phase 6.1: Auth Types & Interfaces
 * Shared TypeScript types for authentication
 */

export interface AuthUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at?: string;
}

export interface Installer extends AuthUser {
  company_name: string;
  contact_name: string;
  phone?: string;
  state: string;
  updated_at: string;
}

export interface AuthContext {
  user: AuthUser | null;
  installer: Installer | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signUp: (email: string, password: string, installerData: Partial<Installer>) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  error: string | null;
}

export interface SignUpData {
  email: string;
  password: string;
  confirmPassword: string;
  company_name: string;
  contact_name: string;
  phone?: string;
  state: string;
}

export interface LoginData {
  email: string;
  password: string;
}
