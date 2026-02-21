'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { signUp } from '@/lib/supabase/auth';
import { SignUpSchema } from '../../../../types/auth';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

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
      const signUpResult = await signUp(formData.email, formData.password);

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
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-6">
      <div className="w-full max-w-md rounded-lg border border-border bg-white p-6 sm:p-8 shadow-sm">
        <h1 className="mb-2 text-xl sm:text-2xl font-bold">Create Your Account</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Sign up to start managing solar leads
        </p>

        {emailConfirmationSent ? (
          <div className="space-y-4 rounded-md bg-green-50 border-l-4 border-green-500 p-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">✅</span>
              <p className="text-sm font-semibold text-green-800">Account created successfully!</p>
            </div>
            <p className="text-sm text-green-700">
              We&apos;ve sent a confirmation email to <strong>{formData.email}</strong>.
            </p>
            <div className="space-y-2 bg-white/50 rounded p-3 text-sm text-green-700">
              <p className="font-medium">📧 Next Steps:</p>
              <ol className="list-decimal pl-5 space-y-1">
                <li>Check your inbox (and spam folder)</li>
                <li>Click the confirmation link</li>
                <li>You&apos;ll be redirected to the dashboard</li>
              </ol>
            </div>
            <div className="pt-2">
              <Link href="/auth/login" className="inline-block text-primary hover:underline text-sm font-medium">
                Already confirmed? Sign in →
              </Link>
            </div>
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
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                className="w-full rounded-md border border-border px-3 py-2.5 pr-10 text-base focus:border-primary focus:outline-none"
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
            <label htmlFor="confirmPassword" className="block text-sm font-medium">
              Confirm Password
            </label>
            <div className="relative mt-1">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full rounded-md border border-border px-3 py-2.5 pr-10 text-base focus:border-primary focus:outline-none"
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
