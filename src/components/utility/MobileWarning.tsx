"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

export function MobileWarning() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if device is mobile (width < 768px)
    const checkMobile = () => {
      if (window.innerWidth < 768) {
        // Check if user already dismissed it in this session
        const dismissed = sessionStorage.getItem("mobile-warning-dismissed");
        if (!dismissed) {
          setIsVisible(true);
        }
      } else {
        setIsVisible(false);
      }
    };

    // Initial check
    checkMobile();

    // Listen for resize
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const dismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem("mobile-warning-dismissed", "true");
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 flex items-start gap-3 rounded-lg bg-amber-50 border border-amber-200 p-4 shadow-lg sm:hidden">
      <div className="flex-1">
        <h3 className="text-sm font-medium text-amber-800">Desktop Recommended</h3>
        <p className="mt-1 text-xs text-amber-700">
          For the best experience using the solar calculator and viewing your proposal, please use a desktop or tablet device.
        </p>
      </div>
      <button
        onClick={dismiss}
        className="shrink-0 rounded-md p-1 text-amber-600 hover:bg-amber-100 transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
