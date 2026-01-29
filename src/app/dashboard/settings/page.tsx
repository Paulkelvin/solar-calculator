'use client';

import { useState, useEffect } from 'react';
import { useInstallerProfile } from '@/hooks/useInstallerProfile';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/auth';
import { Button } from '@/components/ui/button';

export default function SettingsPage() {
  const { session } = useAuth();
  const { profile, isLoading, refetch } = useInstallerProfile();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    company_name: '',
    contact_name: '',
    phone: '',
    website: '',
    state: '',
  });

  // Sync form data when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        company_name: profile.company_name || '',
        contact_name: profile.contact_name || '',
        phone: profile.phone || '',
        website: profile.website || '',
        state: profile.state || '',
      });
    }
  }, [profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session.user?.id) return;

    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const { error: err } = await supabase
        .from('installers')
        .update(formData)
        .eq('id', session.user.id);

      if (err) throw err;

      // Refetch profile to reflect latest changes
      await refetch();

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">Update your company information</p>
      </div>

      <div className="rounded-lg border border-border bg-white p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">
              Settings saved successfully!
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Company Name</label>
            <input
              type="text"
              name="company_name"
              value={formData.company_name}
              onChange={handleChange}
              className="w-full rounded-md border border-border px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Your Solar Company"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Contact Name</label>
            <input
              type="text"
              name="contact_name"
              value={formData.contact_name}
              onChange={handleChange}
              className="w-full rounded-md border border-border px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Your Name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Phone</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full rounded-md border border-border px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="(555) 123-4567"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Website</label>
            <input
              type="url"
              name="website"
              value={formData.website}
              onChange={handleChange}
              className="w-full rounded-md border border-border px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="https://yourcompany.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">State</label>
            <input
              type="text"
              name="state"
              value={formData.state}
              onChange={handleChange}
              maxLength={2}
              className="w-full rounded-md border border-border px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="CA"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={isSaving}
              className="flex-1"
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
