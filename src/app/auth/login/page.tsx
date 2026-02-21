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
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-amber-50/30 to-orange-50/40 px-4 py-8 overflow-hidden">
      <div className="w-full max-w-md">
        {/* Brand header */}
        <div className="mb-6 text-center">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg mb-3">
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="5" fill="currentColor" stroke="none" />
              <line x1="12" y1="1" x2="12" y2="3" strokeLinecap="round" />
              <line x1="12" y1="21" x2="12" y2="23" strokeLinecap="round" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" strokeLinecap="round" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" strokeLinecap="round" />
              <line x1="1" y1="12" x2="3" y2="12" strokeLinecap="round" />
              <line x1="21" y1="12" x2="23" y2="12" strokeLinecap="round" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" strokeLinecap="round" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" strokeLinecap="round" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Solar ROI Calculator</h1>
          <p className="text-sm text-gray-500 mt-0.5">Installer Portal</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-7 shadow-xl shadow-gray-100/80">
          <h2 className="text-lg font-semibold text-gray-900">Welcome back</h2>
          <p className="mt-1 mb-6 text-sm text-gray-500">
            Sign in to manage your solar leads
          </p>

          {/* Google Sign In — primary CTA */}
          <div className="space-y-4">
            <GoogleSignInButton mode="signin" />

            <div className="relative flex items-center gap-3">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">or</span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 mt-1">
          {justRegistered && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
              Account created successfully! Please sign in.
            </div>
          )}

          {confirmationError === 'confirmation_failed' && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              Email confirmation failed. The link may have expired — please try signing up again.
            </div>
          )}

          {confirmationError === 'verification_failed' && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              Email verification failed. Please try again or contact support.
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20 transition"
              placeholder="you@company.com"
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="relative mt-1.5">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 pr-10 text-sm text-gray-900 placeholder-gray-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20 transition"
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

          <div className="flex justify-end">
            <Link href="/auth/reset-password" className="text-xs text-amber-600 hover:text-amber-700 hover:underline font-medium">
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium py-2.5 rounded-lg shadow-sm transition-all duration-150"
          >
            {isLoading ? 'Signing in...' : 'Sign In with Email'}
          </Button>
        </form>

          <p className="mt-5 text-center text-sm text-gray-500">
            Don&apos;t have an account?{' '}
            <Link href="/auth/signup" className="font-medium text-amber-600 hover:text-amber-700 hover:underline">
              Create one
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
