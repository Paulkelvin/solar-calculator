import { z } from 'zod';

/**
 * Auth user from Supabase
 */
export interface AuthUser {
  id: string;
  email: string;
  installer_id: string | null;
  created_at: string;
}

/**
 * Installer profile
 */
export interface InstallerProfile {
  id: string;
  user_id: string;
  company_name: string;
  contact_name?: string;
  phone?: string;
  website?: string;
  state?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Login schema
 */
export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type LoginInput = z.infer<typeof LoginSchema>;

/**
 * Sign up schema
 */
export const SignUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[0-9]/, 'Must contain a number')
    .regex(/[^A-Za-z0-9]/, 'Must contain a special character (!@#$...)'),
  confirmPassword: z.string().min(8, 'Password must be at least 8 characters'),
  companyName: z.string().min(2, 'Company name required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type SignUpInput = z.infer<typeof SignUpSchema>;

/**
 * Reset password schema
 */
export const ResetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;

/**
 * Auth session
 */
export interface AuthSession {
  user: AuthUser | null;
  installer: InstallerProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}
