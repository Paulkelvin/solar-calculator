"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth";
import { getInstallerProfile } from "@/lib/supabase/auth";

export function useUserProfile() {
  const { session } = useAuth();
  const [profile, setProfile] = useState<{
    name: string | null;
    email: string;
  } | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!session?.user?.id) return;
      
      const data = await getInstallerProfile(session.user.id);
      if (data) {
        setProfile({
          name: (data.contact_name as string) || null,
          email: (data.email as string) || session.user.email || '',
        });
      }
    };

    fetchProfile();
  }, [session?.user?.id, session?.user?.email]);

  return profile;
}
