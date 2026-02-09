import "./globals.css";
import type { ReactNode } from "react";
import { AuthProvider } from "@/contexts/auth";

export const metadata = {
  title: "Solar ROI Calculator",
  description: "Phase 1 mock solar ROI calculator for installers"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="h-screen w-screen overflow-hidden bg-background text-foreground" style={{ backgroundColor: "#f5f5f5", color: "#111111" }}>
        <AuthProvider>
          <div className="h-full w-full flex flex-col mx-auto max-w-5xl px-4 py-4 md:py-6" style={{ maxWidth: "64rem", marginLeft: "auto", marginRight: "auto" }}>
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
