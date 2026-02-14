'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
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

    // Generate Google Static Maps URL with satellite view + marker
    const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${coordinates.lat},${coordinates.lng}&zoom=20&size=600x400&maptype=satellite&markers=color:red%7C${coordinates.lat},${coordinates.lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;
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
            {/* Solar potential heat map overlay — more vivid */}
            <div className="absolute inset-0 pointer-events-none" style={{
              background: 'radial-gradient(ellipse 60% 50% at 50% 45%, rgba(255,200,0,0.35) 0%, rgba(255,140,0,0.25) 30%, rgba(255,60,0,0.15) 60%, transparent 100%)'
            }} />

            {/* Annual production badge */}
            {solarPotentialKwhAnnual && (
              <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-2 rounded-lg font-semibold shadow-lg">
                {Math.round(solarPotentialKwhAnnual).toLocaleString()} kWh/year
              </div>
            )}

            {/* Heat map legend */}
            <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2">
              <div className="flex h-3 w-24 rounded-full overflow-hidden">
                <div className="flex-1 bg-red-500" />
                <div className="flex-1 bg-orange-400" />
                <div className="flex-1 bg-yellow-300" />
              </div>
              <span className="text-[10px] text-white font-medium">Solar Potential</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
