import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Middleware to protect routes requiring authentication
 * Protected routes: /dashboard, /dashboard/*, /installer/*
 * Also protects sensitive API routes: /api/pdf/*, /api/email/*
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Routes that require authentication
  const protectedRoutes = ['/dashboard', '/installer'];
  const protectedApiRoutes = ['/api/pdf', '/api/email'];
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));
  const isProtectedApiRoute = protectedApiRoutes.some((route) => pathname.startsWith(route));

  // Routes that should redirect to dashboard if already logged in
  const authRoutes = ['/auth/login', '/auth/signup', '/auth/reset-password'];
  const isAuthRoute = authRoutes.includes(pathname);

  if (!isProtectedRoute && !isProtectedApiRoute && !isAuthRoute) {
    return NextResponse.next();
  }

  // Get session from Supabase cookies
  // Supabase JS v2 stores auth in cookies with the pattern: sb-<project-ref>-auth-token
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  // Extract project ref from URL for cookie name lookup
  const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\./)?.[1] || '';

  // Try multiple cookie patterns Supabase might use
  let token: string | undefined;

  // Pattern 1: sb-<ref>-auth-token (Supabase v2 cookie)
  if (projectRef) {
    token = request.cookies.get(`sb-${projectRef}-auth-token`)?.value;
  }

  // Pattern 2: Legacy sb-access-token
  if (!token) {
    token = request.cookies.get('sb-access-token')?.value;
  }

  // Pattern 3: Check all cookies for any Supabase auth cookie
  if (!token) {
    for (const [name, cookie] of request.cookies) {
      if (name.startsWith('sb-') && name.endsWith('-auth-token')) {
        token = cookie.value;
        break;
      }
    }
  }

  // Validate token if present (not just existence check)
  let isValidSession = false;
  if (token && supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('mock')) {
    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${token}` } },
      });
      const { data: { user }, error } = await supabase.auth.getUser(token);
      isValidSession = !error && !!user;
    } catch {
      isValidSession = false;
    }
  } else if (token) {
    // In dev/mock mode, treat token existence as valid
    isValidSession = true;
  }

  if (isProtectedRoute) {
    if (!isValidSession) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (isProtectedApiRoute) {
    if (!isValidSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  if (isAuthRoute && isValidSession) {
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
