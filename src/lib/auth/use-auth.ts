/**
 * Phase 6.1: useAuth Hook
 * Easy access to auth context throughout the app
 */

'use client';

import { useContext } from 'react';
import { AuthContext } from './auth-context';
import type { AuthContext as AuthContextType } from './auth-types';

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
