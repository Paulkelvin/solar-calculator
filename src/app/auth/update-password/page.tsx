'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase/auth';

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [checking, setChecking] = useState(true);

  // Check if we have a valid session from the reset link
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setHasSession(!!session);
      setChecking(false);
    };
    checkSession();

    // Listen for the PASSWORD_RECOVERY event from Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setHasSession(true);
        setChecking(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) throw updateError;

      setSuccess(true);
      // Redirect to login after a short delay
      setTimeout(() => router.replace('/auth/login'), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-background p-8 shadow-sm">
        <h1 className="mb-2 text-2xl font-bold">Set New Password</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Enter your new password below
        </p>

        {!hasSession ? (
          <div className="space-y-4 rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-700">
              This password reset link is invalid or has expired. Please request a new one.
            </p>
            <Link href="/auth/reset-password" className="inline-block text-primary hover:underline text-sm">
              Request new reset link
            </Link>
          </div>
        ) : success ? (
          <div className="space-y-4 rounded-md bg-amber-50 p-4">
            <p className="text-sm text-amber-700">
              Your password has been updated successfully! Redirecting to login...
            </p>
            <Link href="/auth/login" className="inline-block text-primary hover:underline text-sm">
              Go to login now
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-medium">
                New Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-md border border-border px-3 py-2 focus:border-primary focus:outline-none"
                placeholder="At least 6 characters"
                disabled={isLoading}
                minLength={6}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 w-full rounded-md border border-border px-3 py-2 focus:border-primary focus:outline-none"
                placeholder="Confirm your password"
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary py-2 text-white hover:bg-primary disabled:opacity-50"
            >
              {isLoading ? 'Updating...' : 'Update Password'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
