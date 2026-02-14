'use client';

import { useState, useEffect } from 'react';
import { useInstallerProfile } from '@/hooks/useInstallerProfile';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/auth';
import { Button } from '@/components/ui/button';
import {
  Settings,
  Building2,
  User,
  Phone,
  Globe,
  MapPin,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';

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

    if (!formData.company_name.trim()) {
      setError('Company name is required');
      return;
    }
    if (formData.state && !/^[A-Z]{2}$/i.test(formData.state.trim())) {
      setError('State must be a 2-letter code (e.g., CA, NY)');
      return;
    }
    if (formData.website && formData.website.trim() && !/^https?:\/\//.test(formData.website.trim())) {
      setError('Website must start with http:// or https://');
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const normalizedData = {
        ...formData,
        company_name: formData.company_name.trim(),
        contact_name: formData.contact_name.trim(),
        phone: formData.phone.trim(),
        website: formData.website.trim(),
        state: formData.state.trim().toUpperCase(),
      };

      const { error: err } = await supabase
        .from('installers')
        .update(normalizedData)
        .eq('id', session.user.id);

      if (err) throw err;

      await refetch();

      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500 mx-auto" />
          <p className="text-sm text-gray-500 font-medium">Loading settings...</p>
        </div>
      </div>
    );
  }

  const fields = [
    {
      name: 'company_name',
      label: 'Company Name',
      icon: Building2,
      type: 'text',
      placeholder: 'Bright Solar Solutions',
      required: true,
    },
    {
      name: 'contact_name',
      label: 'Contact Name',
      icon: User,
      type: 'text',
      placeholder: 'John Smith',
    },
    {
      name: 'phone',
      label: 'Phone Number',
      icon: Phone,
      type: 'tel',
      placeholder: '(555) 123-4567',
    },
    {
      name: 'website',
      label: 'Website',
      icon: Globe,
      type: 'url',
      placeholder: 'https://yourcompany.com',
    },
    {
      name: 'state',
      label: 'State',
      icon: MapPin,
      type: 'text',
      placeholder: 'CA',
      maxLength: 2,
      hint: '2-letter state code',
    },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6 text-amber-600" />
          Settings
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your company profile and preferences.
        </p>
      </div>

      {/* Profile Card */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {/* Card Header */}
        <div className="bg-gradient-to-r from-amber-500 to-teal-500 px-6 py-5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30">
              <Building2 className="h-7 w-7 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                {formData.company_name || 'Your Company'}
              </h2>
              <p className="text-sm text-amber-100">
                {formData.state ? `Based in ${formData.state}` : 'Company profile'}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Alerts */}
          {error && (
            <div className="flex items-center gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3 animate-in fade-in slide-in-from-top-1 duration-200">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-3 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 animate-in fade-in slide-in-from-top-1 duration-200">
              <CheckCircle2 className="h-5 w-5 text-amber-500 flex-shrink-0" />
              <p className="text-sm text-amber-700 font-medium">Settings saved successfully!</p>
            </div>
          )}

          {/* Fields */}
          {fields.map(({ name, label, icon: Icon, type, placeholder, required, maxLength, hint }) => (
            <div key={name} className="group">
              <label htmlFor={name} className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Icon className="h-4 w-4 text-gray-400 group-focus-within:text-amber-500 transition-colors" />
                {label}
                {required && <span className="text-red-400 text-xs">*</span>}
              </label>
              <input
                id={name}
                type={type}
                name={name}
                value={(formData as any)[name]}
                onChange={handleChange}
                maxLength={maxLength}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-amber-300 focus:ring-2 focus:ring-amber-100 focus:outline-none transition-all duration-200"
                placeholder={placeholder}
              />
              {hint && (
                <p className="text-xs text-gray-400 mt-1.5 ml-1">{hint}</p>
              )}
            </div>
          ))}

          {/* Submit */}
          <div className="pt-3">
            <Button
              type="submit"
              disabled={isSaving}
              className="w-full h-12 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-medium text-sm transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50"
            >
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving changes...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Save Settings
                </span>
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Account Info */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Account</h3>
        <div className="space-y-2 text-sm text-gray-500">
          <p>Email: <span className="text-gray-900 font-medium">{session.user?.email || 'N/A'}</span></p>
          <p>User ID: <span className="text-gray-400 font-mono text-xs">{session.user?.id?.substring(0, 12)}...</span></p>
        </div>
      </div>
    </div>
  );
}
