'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { Lead } from '../../../../types/leads';

export default function PublicEstimatePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  
  const [lead, setLead] = useState<Lead | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showScheduler, setShowScheduler] = useState(false);

  useEffect(() => {
    const fetchEstimate = async () => {
      try {
        const response = await fetch(`/api/estimate/${token}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Estimate not found. This link may be invalid or expired.');
          } else {
            setError('Failed to load your estimate. Please try again.');
          }
          return;
        }

        const data = await response.json();
        setLead(data.lead);
      } catch (err) {
        console.error('Failed to fetch estimate:', err);
        setError('Failed to load your estimate. Please check your connection.');
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      fetchEstimate();
    }
  }, [token]);

  const handleScheduleClick = () => {
    setShowScheduler(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your solar estimate...</p>
        </div>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Estimate Not Found</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <a
            href="/"
            className="inline-block bg-amber-600 text-white px-6 py-3 rounded-lg hover:bg-amber-700 transition"
          >
            Get a New Estimate
          </a>
        </div>
      </div>
    );
  }

  const systemSize = lead.system_size_kw || 0;
  const annualProduction = lead.estimated_annual_production || 0;
  const monthlyKwh = lead.usage?.monthlyKwh || (lead.usage?.billAmount ? lead.usage.billAmount / 0.14 : 0);
  const annualUsage = monthlyKwh * 12;
  const coverage = annualUsage > 0 ? Math.round((annualProduction / annualUsage) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Your Solar Estimate</h1>
            <div className="text-sm text-gray-500">
              {new Date(lead.created_at).toLocaleDateString()}
            </div>
          </div>
          <p className="text-lg text-gray-600">
            Hi {lead.contact?.name || 'there'}, here's your personalized solar proposal for{' '}
            <span className="font-semibold">{lead.address?.street}, {lead.address?.city}, {lead.address?.state}</span>
          </p>
        </div>

        {/* System Details */}
        <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Recommended Solar System</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-6">
              <div className="text-sm font-medium text-gray-600 mb-1">System Size</div>
              <div className="text-4xl font-bold text-amber-600">{systemSize.toFixed(2)} kW</div>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-6">
              <div className="text-sm font-medium text-gray-600 mb-1">Annual Production</div>
              <div className="text-4xl font-bold text-amber-600">{annualProduction.toLocaleString()} kWh</div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6">
              <div className="text-sm font-medium text-gray-600 mb-1">Your Annual Usage</div>
              <div className="text-4xl font-bold text-green-600">{Math.round(annualUsage).toLocaleString()} kWh</div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6">
              <div className="text-sm font-medium text-gray-600 mb-1">Energy Coverage</div>
              <div className="text-4xl font-bold text-blue-600">{coverage}%</div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg shadow-lg p-8 text-white mb-6">
          <h2 className="text-2xl font-bold mb-4">Ready to Go Solar?</h2>
          <p className="mb-6 text-amber-50">
            Schedule a free consultation with our solar experts to discuss your custom proposal and answer any questions.
          </p>
          
          {!showScheduler ? (
            <button
              onClick={handleScheduleClick}
              className="bg-white text-amber-600 px-8 py-4 rounded-lg font-semibold hover:bg-amber-50 transition text-lg shadow-md"
            >
              📅 Schedule Free Consultation
            </button>
          ) : (
            <div className="bg-white rounded-lg p-4">
              <iframe
                src={process.env.NEXT_PUBLIC_CALENDLY_URL || 'https://calendly.com/your-link'}
                width="100%"
                height="700"
                frameBorder="0"
                className="rounded"
              ></iframe>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-gray-600 text-sm">
          <p>Questions? Reply to the email you received or call us at (555) 123-4567</p>
          <p className="mt-2">© {new Date().getFullYear()} Solar Estimate Team. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
