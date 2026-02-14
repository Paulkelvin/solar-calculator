'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth';
import { useInstallerProfile } from '@/hooks/useInstallerProfile';
import Link from 'next/link';
import {
  Calculator,
  LayoutDashboard,
  BarChart3,
  LogOut,
  Sun,
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { session, signOut } = useAuth();
  const { profile } = useInstallerProfile();
  const router = useRouter();
  const pathname = usePathname();
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
      router.push('/auth/login');
    }
  };

  if (!isMounted || session.isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-3">
          <div className="relative">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-500"></div>
            <Sun className="absolute inset-0 m-auto h-4 w-4 text-emerald-500 animate-pulse" />
          </div>
          <p className="text-sm text-gray-500 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!session.isAuthenticated) {
    return null;
  }

  const navLinks = [
    { href: '/', label: 'Calculator', icon: Calculator },
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  ];

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href) && href !== '/';
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-gradient-to-br from-gray-50 via-gray-50 to-emerald-50/30 overflow-hidden">
      {/* Navigation Header */}
      <nav className="flex-none z-50 border-b border-gray-200/80 bg-white/95 backdrop-blur-md shadow-sm">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 w-full">
          <div className="flex h-16 items-center justify-between">
            {/* Brand */}
            <Link href="/dashboard" className="flex items-center gap-2.5 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-md shadow-emerald-200/50 group-hover:shadow-lg group-hover:shadow-emerald-300/50 transition-all duration-300 group-hover:scale-105">
                <Sun className="h-5 w-5 text-white transition-transform duration-500 group-hover:rotate-90" />
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-bold text-gray-900 leading-tight">Solar ROI</p>
                {profile?.company_name && (
                  <p className="text-[11px] text-gray-400 leading-tight truncate max-w-[140px]">{profile.company_name}</p>
                )}
              </div>
            </Link>

            {/* Nav Links */}
            <div className="flex items-center gap-0.5">
              {navLinks.map(({ href, label, icon: Icon, exact }) => {
                const active = isActive(href, exact);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`relative inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                      active
                        ? 'text-emerald-700 bg-emerald-50'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                    }`}
                  >
                    <Icon className={`h-4 w-4 transition-colors ${active ? 'text-emerald-600' : ''}`} />
                    <span className="hidden sm:inline">{label}</span>
                    {active && (
                      <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-emerald-500 rounded-full" />
                    )}
                  </Link>
                );
              })}

              <div className="ml-2 h-6 w-px bg-gray-200" />

              <button
                onClick={handleSignOut}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all duration-200 ml-1"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Page Content — scrollable area */}
      <main className="flex-1 overflow-y-auto scroll-smooth">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 w-full">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {children}
          </div>
          <div className="h-8" />
        </div>
      </main>
    </div>
  );
}
