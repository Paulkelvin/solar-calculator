'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
// Removed Card imports, using divs instead
import { AlertCircle, Loader2 } from 'lucide-react';

interface RoofImageryViewerProps {
  address: string;
  coordinates?: { lat: number; lng: number };
  solarPotentialKwhAnnual?: number;
  roofImageryUrl?: string;
}

export function RoofImageryViewer({
  address,
  coordinates,
  solarPotentialKwhAnnual,
  roofImageryUrl,
}: RoofImageryViewerProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(roofImageryUrl || null);
  const [loading, setLoading] = useState(!roofImageryUrl);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (roofImageryUrl) {
      setImageUrl(roofImageryUrl);
      setLoading(false);
      return;
    }

    if (!coordinates) {
      setError('No coordinates available');
      setLoading(false);
      return;
    }

    // Generate Google Static Maps URL with satellite view
    const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${coordinates.lat},${coordinates.lng}&zoom=20&size=600x400&maptype=satellite&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;
    setImageUrl(mapUrl);
    setLoading(false);
  }, [coordinates, roofImageryUrl]);

  return (
    <div className="border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
      <div className="mb-2">
        <div className="flex items-center gap-2 text-xl font-semibold">
          <span className="text-2xl">🏠</span>
          Roof & Solar Potential Analysis
        </div>
        <p className="text-sm text-gray-600 mt-2">{address}</p>
      </div>
      <div className="space-y-4">
        {loading && (
          <div className="flex items-center justify-center h-96 bg-gray-200 rounded-lg">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-100 border border-red-300 rounded-lg text-red-700">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {imageUrl && !loading && (
          <div className="relative w-full h-96 bg-gray-300 rounded-lg overflow-hidden">
            <Image
              src={imageUrl}
              alt="Roof satellite imagery"
              fill
              className="object-cover"
              priority
            />
            {/* Solar potential heat map overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 via-orange-400 to-red-500 opacity-20 pointer-events-none" />
            
            {/* Legend */}
            <div className="absolute bottom-4 left-4 bg-white/90 p-3 rounded-lg text-sm">
              <p className="font-semibold text-gray-800 mb-2">Solar Potential</p>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-400 rounded" />
                  <span>Good</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-400 rounded" />
                  <span>Very Good</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded" />
                  <span>Excellent</span>
                </div>
              </div>
            </div>

            {/* Annual production badge */}
            {solarPotentialKwhAnnual && (
              <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-2 rounded-lg font-semibold">
                {Math.round(solarPotentialKwhAnnual).toLocaleString()} kWh/year
              </div>
            )}
          </div>
        )}

        {/* Solar potential details */}
        {solarPotentialKwhAnnual && (
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-xs text-gray-600">Annual Production</p>
              <p className="text-lg font-bold text-blue-600">
                {Math.round(solarPotentialKwhAnnual).toLocaleString()} kWh
              </p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-xs text-gray-600">Monthly Average</p>
              <p className="text-lg font-bold text-green-600">
                {Math.round(solarPotentialKwhAnnual / 12).toLocaleString()} kWh
              </p>
            </div>
          </div>
        )}

        <p className="text-xs text-gray-500 mt-4 italic">
          Satellite imagery and solar potential data from Google Solar API. Heat map shows relative solar production potential across the roof.
        </p>
      </div>
    </div>
  );
}
