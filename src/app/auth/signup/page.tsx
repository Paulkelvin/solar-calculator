'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { signUp } from '@/lib/supabase/auth';
import { SignUpSchema } from '../../../../types/auth';

export default function SignUpPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [emailConfirmationSent, setEmailConfirmationSent] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Validate inputs
      const validation = SignUpSchema.safeParse(formData);
      if (!validation.success) {
        setError(validation.error.errors[0].message);
        setIsLoading(false);
        return;
      }

      // Sign up
      const signUpResult = await signUp(formData.email, formData.password);

      // Check if email confirmation is required
      // Supabase returns a user but confirmed_at is null when email confirmation is needed
      if (signUpResult.user && !(signUpResult.user as any).confirmed_at) {
        setEmailConfirmationSent(true);
        return;
      }

      // Redirect to login
      router.push('/auth/login?registered=true');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-white p-8 shadow-sm">
        <h1 className="mb-2 text-2xl font-bold">Create Your Account</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Sign up to start managing solar leads
        </p>

        {emailConfirmationSent ? (
          <div className="space-y-4 rounded-md bg-amber-50 p-4">
            <p className="text-sm font-medium text-amber-800">Account created!</p>
            <p className="text-sm text-amber-700">
              We&apos;ve sent a confirmation email to <strong>{formData.email}</strong>.
              Please check your inbox (and spam folder) and click the confirmation link before signing in.
            </p>
            <Link href="/auth/login" className="inline-block text-primary hover:underline text-sm font-medium">
              Go to Login →
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
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className="mt-1 w-full rounded-md border border-border px-3 py-2 focus:border-primary focus:outline-none"
              placeholder="you@company.com"
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              className="mt-1 w-full rounded-md border border-border px-3 py-2 focus:border-primary focus:outline-none"
              placeholder="At least 6 characters"
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
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
            {isLoading ? 'Creating account...' : 'Sign Up'}
          </Button>
        </form>
        )}

        <p className="mt-6 border-t border-border pt-6 text-center text-sm">
          Already have an account?{' '}
          <Link href="/auth/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
