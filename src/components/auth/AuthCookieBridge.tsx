"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase/auth";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function setAuthCookieFromSession(session: any, projectRef: string) {
  if (!session || !projectRef) return;

  // Match Supabase browser cookie structure
  const value = JSON.stringify({
    currentSession: { ...session, token_type: session.token_type || "bearer" },
    expiresAt: session.expires_at,
  });

  document.cookie = `sb-${projectRef}-auth-token=${value}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax; ${process.env.NODE_ENV === "production" ? "Secure" : ""}`;
}

export function AuthCookieBridge() {
  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\./)?.[1] || "";
    if (!projectRef) return;

    // On mount, sync existing session from Supabase (stored in localStorage) into a cookie
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setAuthCookieFromSession(data.session, projectRef);
      }
    });

    // Keep cookie in sync on auth changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setAuthCookieFromSession(session, projectRef);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return null;
}