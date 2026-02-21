"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth";
import { getInstallerProfile } from "@/lib/supabase/auth";
import { User, Mail, ChevronDown, LogOut, Settings } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface InstallerProfile {
  contact_name: string | null;
  email: string;
}

export function UserProfile() {
  const { session } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<InstallerProfile | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!session?.user?.id) return;
      
      const data = await getInstallerProfile(session.user.id);
      if (data) {
        setProfile({
          contact_name: (data.contact_name as string) || null,
          email: (data.email as string) || session.user.email || '',
        });
      }
    };

    fetchProfile();
  }, [session?.user?.id, session?.user?.email]);

  const handleSignOut = async () => {
    const loadingToast = toast.loading("Signing out...");
    try {
      await supabase.auth.signOut();
      toast.success("Signed out successfully", { id: loadingToast });
      router.push("/auth/login");
    } catch (error) {
      toast.error("Failed to sign out", { id: loadingToast });
    }
  };

  if (!session || !profile) return null;

  const displayName = profile.contact_name || session.user?.email?.split('@')[0] || 'User';
  const initials = profile.contact_name
    ? profile.contact_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : (session.user?.email?.[0] || 'U').toUpperCase();

  return (
    <div className="relative">
      {/* Profile Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-sm font-semibold text-white">
            {initials}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-sm font-medium text-gray-900">{displayName}</p>
          </div>
        </div>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <div className="absolute right-0 mt-2 w-72 rounded-lg border border-gray-200 bg-white shadow-lg z-20">
            {/* Profile Info */}
            <div className="border-b border-gray-100 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-base font-semibold text-white">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
                  <p className="text-xs text-gray-500 truncate flex items-center gap-1 mt-0.5">
                    <Mail className="h-3 w-3" />
                    {profile.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="p-2">
              <button
                onClick={() => {
                  setIsOpen(false);
                  router.push('/dashboard/settings');
                }}
                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <Settings className="h-4 w-4 text-gray-400" />
                Settings
              </button>
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
