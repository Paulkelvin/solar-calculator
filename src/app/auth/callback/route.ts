import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Auth callback handler for Supabase email confirmation & OAuth
 * 
 * When a user clicks the confirmation link in their email,
 * Supabase redirects here with a `code` query param.
 * We exchange the code for a session, then redirect to /dashboard.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const rawNext = searchParams.get('next') || '/dashboard';
  // Prevent open redirect — only allow relative paths
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/dashboard';

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.redirect(new URL('/auth/login?error=config', request.url));
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // Handle PKCE flow (code exchange)
  if (code) {
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        console.error('Code exchange error:', error.message);
        return NextResponse.redirect(
          new URL(`/auth/login?error=confirmation_failed&message=${encodeURIComponent(error.message)}`, request.url)
        );
      }
      
      // Successfully confirmed — trigger welcome email in background (non-blocking)
      if (data?.user?.email) {
        const origin = new URL(request.url).origin;
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || origin;
        fetch(`${appUrl}/api/email/send-welcome`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: data.user.email }),
        }).catch(err => console.error('Welcome email trigger failed:', err));
      }
      
      // Redirect to dashboard with success indicator
      const dashboardUrl = new URL(next, request.url);
      dashboardUrl.searchParams.set('confirmed', 'true');
      return NextResponse.redirect(dashboardUrl);
    } catch (err) {
      console.error('Auth callback error:', err);
      return NextResponse.redirect(new URL('/auth/login?error=callback_error', request.url));
    }
  }

  // Handle token hash flow (magic link / email confirmation with token_hash)
  if (token_hash && type) {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        type: type as 'email' | 'signup' | 'recovery',
        token_hash,
      });
      if (error) {
        console.error('OTP verification error:', error.message);
        return NextResponse.redirect(
          new URL(`/auth/login?error=verification_failed&message=${encodeURIComponent(error.message)}`, request.url)
        );
      }
      
      // Successfully confirmed — trigger welcome email in background (non-blocking)
      if (data?.user?.email) {
        const origin = new URL(request.url).origin;
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || origin;
        fetch(`${appUrl}/api/email/send-welcome`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: data.user.email }),
        }).catch(err => console.error('Welcome email trigger failed:', err));
      }
      
      const dashboardUrl = new URL(next, request.url);
      dashboardUrl.searchParams.set('confirmed', 'true');
      return NextResponse.redirect(dashboardUrl);
    } catch (err) {
      console.error('Auth callback OTP error:', err);
      return NextResponse.redirect(new URL('/auth/login?error=callback_error', request.url));
    }
  }

  // No code or token_hash — redirect to login
  return NextResponse.redirect(new URL('/auth/login', request.url));
}
