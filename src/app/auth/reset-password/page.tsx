'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { resetPassword } from '@/lib/supabase/auth';
import { ResetPasswordSchema } from '../../../../types/auth';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setIsLoading(true);

    try {
      // Validate input
      const result = ResetPasswordSchema.safeParse({ email });
      if (!result.success) {
        setError(result.error.errors[0].message);
        setIsLoading(false);
        return;
      }

      // Send reset email
      await resetPassword(email);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-6">
      <div className="w-full max-w-md rounded-lg border border-border bg-white p-6 sm:p-8 shadow-sm">
        <h1 className="mb-2 text-xl sm:text-2xl font-bold">Reset Password</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Enter your email and we'll send a reset link
        </p>

        {success ? (
          <div className="space-y-4 rounded-md bg-amber-50 p-4">
            <p className="text-sm text-amber-700">
              ✓ Check your email for a password reset link. It may take a few minutes to arrive.
            </p>
            <Link href="/auth/login" className="inline-block text-primary hover:underline">
              Back to login
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
              <label htmlFor="email" className="block text-sm font-medium">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-md border border-border px-3 py-2.5 text-base focus:border-primary focus:outline-none"
                placeholder="you@company.com"
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary py-2 text-white hover:bg-primary disabled:opacity-50"
            >
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </Button>

            <p className="text-center text-sm">
              <Link href="/auth/login" className="text-primary hover:underline">
                Back to login
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
