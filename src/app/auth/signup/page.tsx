'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { signUp } from '@/lib/supabase/auth';
import { SignUpSchema } from '../../../../types/auth';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export default function SignUpPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [emailConfirmationSent, setEmailConfirmationSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
        const errorMsg = validation.error.errors[0].message;
        setError(errorMsg);
        toast.error(errorMsg);
        setIsLoading(false);
        return;
      }

      // Sign up
      const signUpResult = await signUp(
        formData.email, 
        formData.password,
        formData.name
      );

      // Check if email confirmation is required
      // Supabase returns a user but confirmed_at is null when email confirmation is needed
      if (signUpResult.user && !(signUpResult.user as any).confirmed_at) {
        setEmailConfirmationSent(true);
        toast.success('Account created! Check your email to confirm.', {
          description: 'We\'ve sent a confirmation link to ' + formData.email,
          duration: 7000,
        });
        return;
      }

      // Redirect to login
      toast.success('Account created successfully!');
      router.push('/auth/login?registered=true');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Sign up failed';
      setError(errorMsg);
      toast.error('Sign up failed', { description: errorMsg });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-amber-50/30 to-orange-50/40 px-4 py-8">
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
          {emailConfirmationSent ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100">
                  <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Check your email</p>
                  <p className="text-sm text-gray-500">We sent a confirmation link to <strong>{formData.email}</strong></p>
                </div>
              </div>
              <div className="rounded-lg bg-gray-50 border border-gray-200 p-4 text-sm text-gray-600 space-y-1.5">
                <p className="font-medium text-gray-700">Next steps:</p>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>Open your inbox (check spam too)</li>
                  <li>Click the confirmation link</li>
                  <li>You&apos;ll be redirected to the dashboard</li>
                </ol>
              </div>
              <Link href="/auth/login" className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-600 hover:text-amber-700 hover:underline">
                Already confirmed? Sign in →
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-gray-900">Create your account</h2>
              <p className="mt-1 mb-6 text-sm text-gray-500">
                Sign up to start managing solar leads
              </p>

              {/* Google Sign Up — primary CTA */}
              <div className="space-y-4 mb-5">
                <GoogleSignInButton mode="signup" />

                <div className="relative flex items-center gap-3">
                  <div className="h-px flex-1 bg-gray-200" />
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">or</span>
                  <div className="h-px flex-1 bg-gray-200" />
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Your Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20 transition"
                    placeholder="John Doe"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
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
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 pr-10 text-sm text-gray-900 placeholder-gray-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20 transition"
                      placeholder="At least 8 characters"
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

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    Confirm Password
                  </label>
                  <div className="relative mt-1.5">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 pr-10 text-sm text-gray-900 placeholder-gray-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20 transition"
                      placeholder="Confirm your password"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium py-2.5 rounded-lg shadow-sm transition-all duration-150"
                >
                  {isLoading ? 'Creating account...' : 'Create Account'}
                </Button>
              </form>
            </>
          )}

          <p className="mt-5 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/auth/login" className="font-medium text-amber-600 hover:text-amber-700 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
