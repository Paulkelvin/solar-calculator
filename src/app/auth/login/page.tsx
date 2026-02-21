'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { signIn } from '@/lib/supabase/auth';
import { LoginSchema } from '../../../../types/auth';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const justRegistered = searchParams.get('registered') === 'true';
  const confirmationError = searchParams.get('error');
  const rawRedirect = searchParams.get('redirect') || '/dashboard';
  // Prevent open redirect — only allow relative paths
  const redirectTo = rawRedirect.startsWith('/') && !rawRedirect.startsWith('//') ? rawRedirect : '/dashboard';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Show toast messages based on URL params
  useEffect(() => {
    if (justRegistered) {
      toast.success('Account created!', {
        description: 'Please sign in to continue.',
      });
    }
    if (confirmationError === 'confirmation_failed') {
      toast.error('Email confirmation failed', {
        description: 'The link may have expired. Please try signing up again.',
      });
    }
    if (confirmationError === 'verification_failed') {
      toast.error('Email verification failed', {
        description: 'Please try again or contact support.',
      });
    }
  }, [justRegistered, confirmationError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Validate inputs
      const result = LoginSchema.safeParse({ email, password });
      if (!result.success) {
        const errorMsg = result.error.errors[0].message;
        setError(errorMsg);
        toast.error('Validation error', { description: errorMsg });
        setIsLoading(false);
        return;
      }

      // Sign in
      const { session } = await signIn(email, password);

      // Use replace instead of push to avoid back-button loop
      if (session) {
        toast.success('Welcome back!', {
          description: 'Redirecting to dashboard...',
        });
        setTimeout(() => router.replace(redirectTo), 100);
      } else {
        const msg = 'Login succeeded but no session was returned. You may need to confirm your email first.';
        setError(msg);
        toast.error('Sign in issue', { description: msg });
        setIsLoading(false);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Login failed';
      setError(errorMsg);
      toast.error('Sign in failed', { description: errorMsg });
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-6">
      <div className="w-full max-w-md rounded-lg border border-border bg-white p-6 sm:p-8 shadow-sm">
        <h1 className="mb-2 text-xl sm:text-2xl font-bold">Solar Installer Login</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Sign in to manage your solar leads
        </p>

        {/* Google Sign In */}
        <div className="space-y-3">
          <GoogleSignInButton mode="signin" />
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">Or continue with email</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          {justRegistered && (
            <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-700">
              Account created successfully! Please sign in.
            </div>
          )}

          {confirmationError === 'confirmation_failed' && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
              Email confirmation failed. The link may have expired — please try signing up again.
            </div>
          )}

          {confirmationError === 'verification_failed' && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
              Email verification failed. Please try again or contact support.
            </div>
          )}

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

          <div>
            <label htmlFor="password" className="block text-sm font-medium">
              Password
            </label>
            <div className="relative mt-1">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-border px-3 py-2.5 pr-10 text-base focus:border-primary focus:outline-none"
                placeholder="••••••••"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary py-2 text-white hover:bg-primary disabled:opacity-50"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <div className="mt-6 space-y-2 border-t border-border pt-6 text-center text-sm">
          <p>
            Don't have an account?{' '}
            <Link href="/auth/signup" className="font-medium text-primary hover:underline">
              Sign up
            </Link>
          </p>
          <p>
            <Link href="/auth/reset-password" className="text-primary hover:underline">
              Forgot password?
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
