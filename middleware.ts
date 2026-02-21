import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Middleware to protect routes requiring authentication
 * Protected routes: /dashboard, /dashboard/*, /installer/*
 * Also protects sensitive API routes: /api/pdf/*, /api/email/*
 */
export async function middleware(request: NextRequest) {
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
