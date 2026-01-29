import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Middleware to protect routes requiring authentication
 * Protected routes: /dashboard, /dashboard/*, /installer/*
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Routes that require authentication
  const protectedRoutes = ['/dashboard', '/installer'];
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

  // Routes that should redirect to dashboard if already logged in
  const authRoutes = ['/auth/login', '/auth/signup', '/auth/reset-password'];
  const isAuthRoute = authRoutes.includes(pathname);

  if (!isProtectedRoute && !isAuthRoute) {
    return NextResponse.next();
  }

  // Get session from request
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock_key';

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // Try to get session from auth header
  const token = request.cookies.get('sb-access-token')?.value;

  if (isProtectedRoute) {
    // Check if user is authenticated
    if (!token) {
      // Redirect to login
      const loginUrl = new URL('/auth/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (isAuthRoute && token) {
    // User is already logged in, redirect to dashboard
    const dashboardUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
