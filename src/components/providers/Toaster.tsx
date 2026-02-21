"use client";

import { Toaster as SonnerToaster } from "sonner";

/**
 * Toast notification provider
 * Wraps sonner with custom styling
 */
export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      expand={false}
      richColors
      closeButton
      duration={5000}
      toastOptions={{
        style: {
          background: 'white',
          border: '1px solid #e5e7eb',
          color: '#1f2937',
        },
        className: 'font-sans',
      }}
    />
  );
}
