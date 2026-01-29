'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth';
import { useInstallerProfile } from '@/hooks/useInstallerProfile';
import Link from 'next/link';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { session, signOut } = useAuth();
  const { profile } = useInstallerProfile();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || session.isLoading) return;

    if (!session.isAuthenticated) {
      router.push('/auth/login');
    }
  }, [session.isAuthenticated, session.isLoading, isMounted, router]);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      // Redirect to login regardless of error
      router.push('/auth/login');
    }
  };

  if (!isMounted || session.isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center space-y-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session.isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <nav className="border-b border-border bg-white">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Solar ROI Calculator</h1>
            {profile && (
              <p className="text-sm text-muted-foreground">{profile.company_name}</p>
            )}
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Calculator
            </Link>
            <Link
              href="/dashboard"
              className="text-sm font-medium text-foreground"
            >
              Dashboard
            </Link>
            <Link
              href="/dashboard/settings"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Settings
            </Link>
            <button
              onClick={handleSignOut}
              className="text-sm px-3 py-2 rounded-md bg-secondary hover:bg-muted transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      {/* Page Content */}
      <main className="mx-auto max-w-5xl px-4 py-6">
        {children}
      </main>
    </div>
  );
}
