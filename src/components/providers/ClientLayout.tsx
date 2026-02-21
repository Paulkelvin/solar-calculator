"use client";

import { useState, type ReactNode } from "react";
import { AuthProvider } from "@/contexts/auth";
import { QuickCalculator } from "@/components/utility/QuickCalculator";
import { Toaster } from "@/components/providers/Toaster";
import { AuthCookieBridge } from "@/components/auth/AuthCookieBridge";
import { MobileWarning } from "@/components/utility/MobileWarning";

/**
 * Client-side layout wrapper
 * Isolates "use client" boundary so the root layout remains a server component.
 * This enables SSR for metadata, SEO, and static content outside this boundary.
 */
export function ClientLayout({ children }: { children: ReactNode }) {
  const [calcOpen, setCalcOpen] = useState(false);

  return (
    <AuthProvider>
      <AuthCookieBridge />
      <div
        className="relative h-full w-full flex flex-col mx-auto px-3 sm:px-4 py-3 sm:py-4 md:py-6 transition-all duration-300"
        style={{
          maxWidth: calcOpen ? "calc(64rem - 180px)" : "64rem",
          marginLeft: "auto",
          marginRight: "auto",
        }}
      >
        {children}
        <QuickCalculator isOpen={calcOpen} onToggle={setCalcOpen} />
      </div>
      <Toaster />
      <MobileWarning />
    </AuthProvider>
  );
}
