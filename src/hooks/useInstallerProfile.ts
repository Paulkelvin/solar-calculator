import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth';
import { supabase } from '@/lib/supabase/client';
import type { InstallerProfile } from '../../types/auth';

/**
 * Hook to fetch installer profile with retry logic and caching
 */
export function useInstallerProfile() {
  const { session } = useAuth();
  const [profile, setProfile] = useState<InstallerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session.user?.id) return;

    const fetchProfile = async () => {
      setIsLoading(true);
      setError(null);

      // Try up to 3 times with 1 second delay between attempts
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const { data, error: err } = await supabase
            .from('installers')
            .select('id, email, company_name, contact_name, phone, website, state')
            .eq('id', session.user.id)
            .maybeSingle();

          if (err) throw err;

          if (data) {
            setProfile(data as unknown as InstallerProfile);
            setIsLoading(false);
            return;
          }

          // If no data and last attempt, show error
          if (attempt === 3) {
            throw new Error('Installer profile not found');
          }
        } catch (err) {
          if (attempt < 3) {
            // Wait 1 second before retrying
            await new Promise(resolve => setTimeout(resolve, 1000));
          } else {
            console.error('Failed to fetch installer profile after 3 attempts:', err);
            setError(err instanceof Error ? err.message : 'Failed to load profile');
          }
        }
      }

      setIsLoading(false);
    };

    fetchProfile();
  }, [session.user?.id]);

  return { profile, isLoading, error };
}
