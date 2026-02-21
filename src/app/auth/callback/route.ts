import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

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

  console.log('🔐 Auth callback - code:', !!code, 'token_hash:', !!token_hash);

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // Handle PKCE flow (code exchange)
  if (code) {
    try {
      console.log('🔐 Exchanging code for session...');
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('❌ Code exchange error:', error.message);
        return NextResponse.redirect(
          new URL(`/auth/login?error=confirmation_failed&message=${encodeURIComponent(error.message)}`, request.url)
        );
      }
      
      console.log('✅ Session obtained:', !!data?.session);
      
      // Check if this is an OAuth user and create installer profile if needed
      if (data?.user) {
        const userId = data.user.id;
        const email = data.user.email || '';
        const fullName = data.user.user_metadata?.full_name || data.user.user_metadata?.name || '';
        const provider = data.user.app_metadata?.provider || 'email';
        
        console.log('🔐 User info:', { userId, email, provider });
        
        // Check if installer profile exists
        const { data: existingProfile } = await supabase
          .from('installers')
          .select('id')
          .eq('id', userId)
          .maybeSingle();
        
        // Create installer profile if it doesn't exist (for OAuth users)
        if (!existingProfile && provider !== 'email') {
          console.log('🔐 Creating installer profile for OAuth user...');
          const { error: profileError } = await supabase
            .from('installers')
            .insert({
              id: userId,
              email: email,
              company_name: fullName + ' Solar Co.' || 'My Solar Co.', // Default company name
              contact_name: fullName || email.split('@')[0],
              state: 'CA', // Default state
            });
          
          if (profileError) {
            console.error('❌ Failed to create installer profile:', profileError);
            // Don't block the login, profile can be completed later
          } else {
            console.log('✅ Installer profile created');
          }
        }
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
      
      // Create response with cookies manually set
      const dashboardUrl = new URL(next, request.url);
      dashboardUrl.searchParams.set('confirmed', 'true');
      
      const response = NextResponse.redirect(dashboardUrl);
      
      // Set auth cookies manually to ensure they're available on redirect
      if (data?.session) {
        const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\./)?.[1] || '';
        const maxAge = 60 * 60 * 24 * 7; // 7 days
        
        // Set the main auth token cookie
        response.cookies.set({
          name: `sb-${projectRef}-auth-token`,
          value: JSON.stringify({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
            expires_at: data.session.expires_at,
            expires_in: data.session.expires_in,
            token_type: 'bearer',
            user: data.session.user,
          }),
          maxAge,
          path: '/',
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
        });
        
        console.log('✅ Auth cookies set, redirecting to:', dashboardUrl.toString());
      }
      
      return response;
    } catch (err) {
      console.error('❌ Auth callback error:', err);
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
