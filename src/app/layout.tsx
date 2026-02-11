"use client";

import "./globals.css";
import type { ReactNode } from "react";
import { useState } from "react";
import { AuthProvider } from "@/contexts/auth";
import { QuickCalculator } from "@/components/utility/QuickCalculator";

export default function RootLayout({ children }: { children: ReactNode }) {
  const [calcOpen, setCalcOpen] = useState(false);

  return (
    <html lang="en">
      <body className="h-screen w-screen overflow-hidden bg-background text-foreground" style={{ backgroundColor: "#f5f5f5", color: "#111111" }}>
        <AuthProvider>
          <div 
            className="relative h-full w-full flex flex-col mx-auto px-4 py-4 md:py-6 transition-all duration-300" 
            style={{ 
              maxWidth: calcOpen ? "calc(64rem - 180px)" : "64rem",
              marginLeft: "auto", 
              marginRight: "auto"
            }}
          >
            {children}
            <QuickCalculator isOpen={calcOpen} onToggle={setCalcOpen} />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
