import "./globals.css";
import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { ClientLayout } from "@/components/providers/ClientLayout";

export const metadata: Metadata = {
  title: "Solar ROI Calculator — Get Your Free Solar Estimate",
  description:
    "Calculate your solar savings, compare financing options, and get a personalized solar proposal in minutes.",
  keywords: ["solar", "ROI", "calculator", "solar panels", "solar savings", "solar estimate"],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="h-screen w-full overflow-y-auto bg-background text-foreground" style={{ backgroundColor: "#f5f5f5", color: "#111111" }}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
