"use client";

import { useState } from "react";
import { signInWithGoogle } from "@/lib/supabase/auth";
import { toast } from "sonner";

export function GoogleSignInButton({ mode = "signin" }: { mode?: "signin" | "signup" }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    toast.loading(
      mode === "signin" ? "Redirecting to Google..." : "Redirecting to Google...",
      { id: "google-auth" }
    );

    try {
      console.log('🔐 Starting Google OAuth flow...');
      const result = await signInWithGoogle();
      console.log('🔐 Google OAuth initiated:', result);
      
      // Redirect happens automatically — keep loading state
      // Note: If redirect is successful, this code won't execute as page navigates away
      
      // If we're still here after 2 seconds, check what went wrong
      setTimeout(() => {
        const stillOnLoginPage = window.location.pathname === '/auth/login' || window.location.pathname === '/auth/signup';
        console.log('🔐 OAuth status check - Still on auth page:', stillOnLoginPage);
        
        if (stillOnLoginPage) {
          toast.error("Google sign-in didn't redirect", {
            description: "Please check browser console for details. Contact support if this persists.",
            id: "google-auth",
            duration: 8000,
          });
          setIsLoading(false);
        }
      }, 2000);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to sign in with Google";
      console.error('❌ Google OAuth error:', error);
      
      // Check if it's a network/blocked error
      if (errorMsg.includes('blocked') || errorMsg.includes('network')) {
        toast.error("Google sign-in blocked", {
          description: "It looks like an ad blocker or privacy extension is preventing Google Login. Please disable it for this site.",
          id: "google-auth",
          duration: 6000,
        });
      } else {
        toast.error("Google authentication failed", {
          description: errorMsg,
          id: "google-auth",
        });
      }
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleGoogleSignIn}
      disabled={isLoading}
      className={`
        group relative flex w-full items-center justify-center gap-3
        rounded-lg border border-gray-300 bg-white
        px-4 py-3 text-sm font-medium text-gray-700
        shadow-sm ring-0
        hover:bg-gray-50 hover:border-gray-400 hover:shadow-md
        active:bg-gray-100 active:scale-[0.99]
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
        disabled:opacity-60 disabled:cursor-not-allowed
        transition-all duration-150 ease-in-out
      `}
    >
      {/* Google logo */}
      {isLoading ? (
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
      ) : (
        <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
      )}
      <span>
        {isLoading
          ? "Redirecting..."
          : mode === "signin"
          ? "Continue with Google"
          : "Sign up with Google"}
      </span>
    </button>
  );
}
