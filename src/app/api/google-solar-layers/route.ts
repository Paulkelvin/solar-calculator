/**
 * Google Solar API - Data Layers Route
 * Fetches solar flux imagery (heat map) for visualization
 * 
 * API Docs: https://developers.google.com/maps/documentation/solar/data-layers
 * Cost: $0.001 per tile request
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface SolarLayersRequest {
  latitude: number;
  longitude: number;
}

interface SolarLayersResponse {
  imageryDate: { year: number; month: number; day: number };
  imageryQuality: 'HIGH' | 'MEDIUM' | 'LOW';
  rgbUrl: string | null;
  maskUrl: string | null;
  annualFluxUrl: string | null;
  monthlyFluxUrls: string[];
  dsmUrl: string | null;
  imageryBounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  colorSource: 'rgb' | 'flux' | 'none';
}

function createBoundsFromRadius(latitude: number, longitude: number, radiusMeters = 120) {
  const earthRadiusMeters = 6378137;
  const latOffset = (radiusMeters / earthRadiusMeters) * (180 / Math.PI);
  const lngOffset = (radiusMeters / (earthRadiusMeters * Math.cos((latitude * Math.PI) / 180))) * (180 / Math.PI);

  return {
    north: latitude + latOffset,
    south: latitude - latOffset,
    east: longitude + lngOffset,
    west: longitude - lngOffset,
  };
}

export async function POST(request: Request) {
  try {
    const { latitude, longitude }: SolarLayersRequest = await request.json();
    
    if (!latitude || !longitude) {
      return Response.json(
        { error: 'Missing required parameters: latitude, longitude' },
        { status: 400 }
      );
    }
    
    const useRealAPI = process.env.NEXT_PUBLIC_USE_REAL_SOLAR_API === 'true';
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_SOLAR_API_KEY;
    
    const fallbackBounds = createBoundsFromRadius(latitude, longitude);

    if (!useRealAPI || !apiKey) {
      console.log('[Google Solar Layers] API disabled - returning placeholder URLs');
      return Response.json({
        imageryDate: { year: 2024, month: 6, day: 15 },
        imageryQuality: 'MEDIUM',
        rgbUrl: null,
        maskUrl: null,
        annualFluxUrl: null,
        monthlyFluxUrls: [],
        dsmUrl: null,
        imageryBounds: fallbackBounds,
        colorSource: 'none',
        _note: 'Real heat map imagery requires Google Solar API to be enabled'
      });
    }
    
    // Call Google Solar API - Data Layers
    const url = `https://solar.googleapis.com/v1/dataLayers:get?location.latitude=${latitude}&location.longitude=${longitude}&radiusMeters=100&view=FULL_LAYERS&requiredQuality=HIGH&pixelSizeMeters=0.5&key=${apiKey}`;
    
    console.log('[Google Solar Layers] Fetching heat map imagery...');
    
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) {
      console.error(`[Google Solar Layers] Error ${response.status}`);
      return Response.json({
        error: 'Failed to fetch solar imagery',
        status: response.status
      }, { status: response.status });
    }
    
    const data = await response.json();
    console.log('[Google Solar Layers] ✓ Heat map imagery retrieved');

    const imageryBounds = data.imageryBounds
      ? {
          north: data.imageryBounds?.ne?.latitude ?? data.imageryBounds?.north ?? fallbackBounds.north,
          south: data.imageryBounds?.sw?.latitude ?? data.imageryBounds?.south ?? fallbackBounds.south,
          east: data.imageryBounds?.ne?.longitude ?? data.imageryBounds?.east ?? fallbackBounds.east,
          west: data.imageryBounds?.sw?.longitude ?? data.imageryBounds?.west ?? fallbackBounds.west,
        }
      : fallbackBounds;
    
    // Proxy GeoTiff URLs through our API (Google URLs return 403 to browser)
    const proxyRgbUrl = data.rgbUrl 
      ? `/api/google-solar-image?url=${encodeURIComponent(data.rgbUrl)}`
      : null;
    
    const proxyAnnualFluxUrl = data.annualFluxUrl
      ? `/api/google-solar-image?url=${encodeURIComponent(data.annualFluxUrl)}`
      : null;

    const proxyMaskUrl = data.maskUrl
      ? `/api/google-solar-image?url=${encodeURIComponent(data.maskUrl)}`
      : null;

    console.log('[Google Solar Layers] ✓ Created proxy URLs:', {
      hasRgb: !!proxyRgbUrl,
      hasFlux: !!proxyAnnualFluxUrl,
    });

    // Transform response
    const transformed: SolarLayersResponse = {
      imageryDate: data.imageryDate,
      imageryQuality: data.imageryQuality,
      rgbUrl: proxyRgbUrl,
      maskUrl: proxyMaskUrl,
      annualFluxUrl: proxyAnnualFluxUrl,
      monthlyFluxUrls: data.monthlyFluxUrls || [],
      dsmUrl: data.dsmUrl ?? null,
      imageryBounds,
      colorSource: proxyRgbUrl ? 'rgb' : proxyAnnualFluxUrl ? 'flux' : 'none'
    };
    
    return Response.json(transformed);
    
  } catch (error) {
    console.error('[Google Solar Layers] Error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
