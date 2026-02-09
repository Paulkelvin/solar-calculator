/**
 * Google Solar API Integration Route
 * Phase 3: Real roof segment data from Google Solar API
 * 
 * API Docs: https://developers.google.com/maps/documentation/solar
 * Cost: $0.025 per request (Building Insights API)
 * 
 * Toggle via: NEXT_PUBLIC_USE_REAL_SOLAR_API=true
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { getStateFallbackRoofData } from '@/lib/state-sun-hours';
import type { Feature, Polygon as GeoPolygon, MultiPolygon as GeoMultiPolygon, Position } from 'geojson';
import * as turf from '@turf/turf';

const turfPolygon = turf.polygon;
const turfUnion = turf.union;
const turfSimplify = turf.simplify;
const turfArea = turf.area;

interface GoogleSolarRequest {
  latitude: number;
  longitude: number;
  stateCode?: string; // For fallback data
}

interface GoogleSolarResponse {
  name: string; // Building resource name
  center: { latitude: number; longitude: number };
  imageryDate: { year: number; month: number; day: number };
  imageryQuality: 'HIGH' | 'MEDIUM' | 'LOW';
  solarPotential: {
    maxArrayPanelsCount: number;
    maxArrayAreaMeters2: number;
    maxSunshineHoursPerYear: number;
    carbonOffsetFactorKgPerMwh: number;
    wholeRoofStats: {
      areaMeters2: number;
      sunshineQuantiles: number[];
      groundArea

Meters2: number;
    };
    roofSegmentStats: Array<{
      pitchDegrees: number;
      azimuthDegrees: number;
      stats: {
        areaMeters2: number;
        sunshineQuantiles: number[];
        groundAreaMeters2: number;
      };
      center: { latitude: number; longitude: number };
      boundingBox: {
        sw: { latitude: number; longitude: number };
        ne: { latitude: number; longitude: number };
      };
      polygon?: {
        vertices: Array<{ latitude: number; longitude: number }>;
      };
    }>;
    solarPanelConfigs: Array<{
      panelsCount: number;
      yearlyEnergyDcKwh: number;
      roofSegmentSummaries: Array<{
        pitchDegrees: number;
        azimuthDegrees: number;
        panelsCount: number;
        yearlyEnergyDcKwh: number;
      }>;
    }>;
  };
}

export async function POST(request: Request) {
  const startTime = Date.now();
  
  try {
    const { latitude, longitude, stateCode }: GoogleSolarRequest = await request.json();
    
    // Validate inputs
    if (!latitude || !longitude) {
      console.error('[Google Solar API] Missing required parameters');
      return Response.json(
        { error: 'Missing required parameters: latitude, longitude' },
        { status: 400 }
      );
    }
    
    // Check if real API is enabled
    const useRealAPI = process.env.NEXT_PUBLIC_USE_REAL_SOLAR_API === 'true';
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_SOLAR_API_KEY;
    
    console.log('[Google Solar API] Config check:', { 
      useRealAPI, 
      hasApiKey: !!apiKey,
      apiKeyPrefix: apiKey ? apiKey.substring(0, 10) + '...' : 'none'
    });
    
    if (!useRealAPI || !apiKey) {
      console.log(`[Google Solar API] Disabled or no API key - using ${stateCode ? 'state-specific' : 'generic'} fallback data`);
      const mockData = generateMockResponse(latitude, longitude, stateCode);
      console.log(`[Google Solar API] Mock data generated in ${Date.now() - startTime}ms`);
      return Response.json(mockData);
    }
    
    // Call Google Solar API - Building Insights
    const url = `https://solar.googleapis.com/v1/buildingInsights:findClosest?location.latitude=${latitude}&location.longitude=${longitude}&requiredQuality=HIGH&key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorTime = Date.now() - startTime;
      console.error(`[Google Solar API] Error ${response.status} ${response.statusText} (${errorTime}ms) - falling back to ${stateCode ? 'state-specific' : 'generic'} data`);
      
      // Fallback to mock data on error
      return Response.json({
        ...generateMockResponse(latitude, longitude, stateCode),
        _note: 'Using fallback data - Google Solar API unavailable',
      });
    }
    
    const data: GoogleSolarResponse = await response.json();
    const apiTime = Date.now() - startTime;
    console.log(`[Google Solar API] ✓ Success - ${data.imageryQuality} quality imagery from ${data.imageryDate.year}-${data.imageryDate.month} ($0.025, ${apiTime}ms)`);

    const roofSegments = data.solarPotential.roofSegmentStats.map(segment => {
      const footprint = resolveSegmentFootprint(segment);
      return {
        bounds: {
          north: segment.boundingBox.ne.latitude,
          south: segment.boundingBox.sw.latitude,
          east: segment.boundingBox.ne.longitude,
          west: segment.boundingBox.sw.longitude,
        },
        center: segment.center,
        area: segment.stats.areaMeters2,
        solarPotential: calculateSegmentProduction(
          segment.stats.areaMeters2,
          segment.stats.sunshineQuantiles
        ),
        sunExposure: segment.stats.sunshineQuantiles[5] || 75, // Median quantile
        azimuth: segment.azimuthDegrees,
        tilt: segment.pitchDegrees,
        footprint: footprint.points,
        footprintSource: footprint.source,
      };
    });

    const roofOutline = buildRoofOutlineFromSegments(roofSegments);

    // Transform to our format
    const transformed = {
      center: data.center,
      imageryDate: data.imageryDate,
      imageryQuality: data.imageryQuality,
      roofSegments,
      roofOutline: roofOutline?.points ?? (roofSegments[0]?.footprint ?? null),
      roofOutlineSource: roofOutline?.source ?? (roofSegments[0]?.footprintSource ?? null),
      maxArrayPanels: data.solarPotential.maxArrayPanelsCount,
      maxArrayArea: data.solarPotential.maxArrayAreaMeters2,
      maxSunshineHours: data.solarPotential.maxSunshineHoursPerYear,
      wholeRoofArea: data.solarPotential.wholeRoofStats.areaMeters2,
      carbonOffset: data.solarPotential.carbonOffsetFactorKgPerMwh,
      panelConfigs: data.solarPotential.solarPanelConfigs.slice(0, 5).map(config => ({
        panelsCount: config.panelsCount,
        yearlyEnergyKwh: config.yearlyEnergyDcKwh,
        systemSizeKw: config.panelsCount * 0.4, // Assume 400W panels
      })),
      _source: 'google_solar_api',
    };

    return Response.json(transformed);
    
  } catch (error) {
    console.error('Google Solar API error:', error);
    return Response.json(
      { error: 'Failed to fetch solar data' },
      { status: 500 }
    );
  }
}

/**
 * Calculate annual kWh production for a roof segment
 */
function calculateSegmentProduction(areaMeters2: number, sunshineQuantiles: number[]): number {
  // Use median sunshine quantile (index 5)
  const sunExposure = sunshineQuantiles[5] || 75;
  
  // Estimate: Area * panel efficiency (20%) * sun hours (4.5 avg) * 365 days
  const panelArea = areaMeters2 * 0.85; // 85% usable area
  const annualProduction = panelArea * 0.20 * 4.5 * 365;
  
  // Adjust by sun exposure percentage
  return Math.round(annualProduction * (sunExposure / 100));
}

/**
 * Generate mock response when API is unavailable
 * Uses state-specific fallback data for realistic estimates
 */
function generateMockResponse(latitude: number, longitude: number, stateCode?: string) {
  // Get state-specific fallback data
  const fallbackData = getStateFallbackRoofData(stateCode);
  const { tilt, azimuth, shading, source } = fallbackData;
  const stateName = 'stateName' in fallbackData ? fallbackData.stateName : undefined;
  
  const numSegments = Math.floor(Math.random() * 4) + 3; // 3-6 segments
  const segments = [];
  
  for (let i = 0; i < numSegments; i++) {
    const offsetLat = latitude + (Math.random() - 0.5) * 0.0001;
    const offsetLng = longitude + (Math.random() - 0.5) * 0.0001;
    
    // Use state-specific values with slight variation per segment
    const segmentTilt = tilt + Math.round((Math.random() - 0.5) * 10);
    const segmentAzimuth = azimuth + Math.round((Math.random() - 0.5) * 60);
    const segmentShading = Math.max(0, Math.min(100, shading + Math.round((Math.random() - 0.5) * 10)));
    
    const bounds = {
      north: offsetLat + 0.00005,
      south: offsetLat - 0.00005,
      east: offsetLng + 0.00005,
      west: offsetLng - 0.00005,
    };

    segments.push({
      bounds,
      center: { latitude: offsetLat, longitude: offsetLng },
      area: 50 + Math.random() * 100, // 50-150 m²
      solarPotential: Math.round(1000 + Math.random() * 2500),
      sunExposure: 100 - segmentShading,
      azimuth: segmentAzimuth,
      tilt: segmentTilt,
      footprint: boundsToPolygon(bounds),
      footprintSource: 'axis_bbox',
    });
  }

  const roofOutline = buildRoofOutlineFromSegments(segments);
  
  return {
    center: { latitude, longitude },
    imageryDate: { year: 2024, month: 6, day: 15 },
    imageryQuality: 'MEDIUM' as const,
    roofSegments: segments,
    roofOutline: roofOutline?.points ?? (segments[0]?.footprint ?? null),
    roofOutlineSource: roofOutline?.source ?? (segments[0]?.footprintSource ?? 'axis_bbox'),
    maxArrayPanels: 30,
    maxArrayArea: 200,
    maxSunshineHours: 1800,
    wholeRoofArea: 250,
    carbonOffset: 425,
    panelConfigs: [
      { panelsCount: 20, yearlyEnergyKwh: 8500, systemSizeKw: 8.0 },
      { panelsCount: 25, yearlyEnergyKwh: 10200, systemSizeKw: 10.0 },
      { panelsCount: 30, yearlyEnergyKwh: 12000, systemSizeKw: 12.0 },
    ],
    _source: source,
    _stateName: stateName,
  };
}

type RoofSegmentStat = GoogleSolarResponse['solarPotential']['roofSegmentStats'][number];

interface SegmentWithFootprint {
  footprint?: Array<{ latitude: number; longitude: number }>;
  footprintSource?: 'google_polygon' | 'rotated_bbox' | 'axis_bbox';
}

function buildRoofOutlineFromSegments(segments: SegmentWithFootprint[]) {
  const polygons = segments
    .map((segment) => segment.footprint)
    .filter((footprint): footprint is Array<{ latitude: number; longitude: number }> => !!footprint && footprint.length >= 3)
    .map((footprint) => {
      const closedRing: Position[] = footprint.map((point) => [point.longitude, point.latitude]);
      const first = closedRing[0];
      if (first) {
        closedRing.push([...first]);
      }
      return turfPolygon([closedRing]);
    });

  if (!polygons.length) {
    return null;
  }

  let merged: Feature<GeoPolygon | GeoMultiPolygon> | null = polygons[0];
  for (let i = 1; i < polygons.length; i++) {
    try {
      merged = turfUnion(merged as Feature<GeoPolygon | GeoMultiPolygon>, polygons[i]) as Feature<GeoPolygon | GeoMultiPolygon>;
    } catch (error) {
      console.warn('[Google Solar API] Failed to union roof polygons', error);
    }
  }

  if (!merged) {
    return null;
  }

  const simplified = turfSimplify(merged, { tolerance: 0.00001, highQuality: true }) as Feature<GeoPolygon | GeoMultiPolygon>;
  const ring = extractLargestRing(simplified);
  if (!ring || ring.length < 4) {
    return null;
  }

  const outline = ring.slice(0, -1).map(([lng, lat]) => ({ latitude: lat, longitude: lng }));
  return {
    points: outline,
    source: 'union' as const,
  };
}

function extractLargestRing(feature: Feature<GeoPolygon | GeoMultiPolygon>) {
  const geometry = feature.geometry;
  if (geometry.type === 'Polygon') {
    return geometry.coordinates[0];
  }

  if (geometry.type === 'MultiPolygon') {
    let bestRing: Position[] | null = null;
    let bestArea = 0;

    geometry.coordinates.forEach((polyCoords) => {
      const ring = polyCoords[0];
      if (!ring) return;
      const ringFeature = turfPolygon([ring]);
      const ringArea = turfArea(ringFeature);
      if (ringArea > bestArea) {
        bestArea = ringArea;
        bestRing = ring;
      }
    });

    return bestRing;
  }

  return null;
}

function resolveSegmentFootprint(segment: RoofSegmentStat) {
  const googlePolygon = normalizePolygon(segment.polygon?.vertices);
  if (googlePolygon) {
    return { points: googlePolygon, source: 'google_polygon' as const };
  }

  const rotated = buildRotatedRectangleFootprint(segment);
  if (rotated) {
    return { points: rotated, source: 'rotated_bbox' as const };
  }

  const bounds = {
    north: segment.boundingBox.ne.latitude,
    south: segment.boundingBox.sw.latitude,
    east: segment.boundingBox.ne.longitude,
    west: segment.boundingBox.sw.longitude,
  };

  return {
    points: boundsToPolygon(bounds),
    source: 'axis_bbox' as const,
  };
}

function normalizePolygon(vertices?: Array<{ latitude: number; longitude: number }>) {
  if (!vertices || vertices.length < 3) {
    return null;
  }
  return vertices.map(vertex => ({ latitude: vertex.latitude, longitude: vertex.longitude }));
}

function buildRotatedRectangleFootprint(segment: RoofSegmentStat) {
  if (!segment.center || !segment.boundingBox) {
    return null;
  }

  const centerLat = segment.center.latitude;
  const centerLng = segment.center.longitude;
  const { latMeters, lonMeters } = getMetersPerDegree(centerLat);

  const widthDeg = segment.boundingBox.ne.longitude - segment.boundingBox.sw.longitude;
  const heightDeg = segment.boundingBox.ne.latitude - segment.boundingBox.sw.latitude;
  if (widthDeg <= 0 || heightDeg <= 0 || !latMeters || !lonMeters) {
    return null;
  }

  const halfWidthMeters = (widthDeg * lonMeters) / 2;
  const halfHeightMeters = (heightDeg * latMeters) / 2;
  const azimuthRad = ((segment.azimuthDegrees ?? 0) * Math.PI) / 180;

  const corners = [
    { x: -halfWidthMeters, y: -halfHeightMeters },
    { x: halfWidthMeters, y: -halfHeightMeters },
    { x: halfWidthMeters, y: halfHeightMeters },
    { x: -halfWidthMeters, y: halfHeightMeters },
  ];

  return corners.map(({ x, y }) => {
    const rotatedX = x * Math.cos(azimuthRad) - y * Math.sin(azimuthRad);
    const rotatedY = x * Math.sin(azimuthRad) + y * Math.cos(azimuthRad);
    return {
      latitude: centerLat + rotatedY / latMeters,
      longitude: centerLng + rotatedX / lonMeters,
    };
  });
}

function boundsToPolygon(bounds: { north: number; south: number; east: number; west: number }) {
  return [
    { latitude: bounds.north, longitude: bounds.west },
    { latitude: bounds.north, longitude: bounds.east },
    { latitude: bounds.south, longitude: bounds.east },
    { latitude: bounds.south, longitude: bounds.west },
  ];
}

function getMetersPerDegree(latitude: number) {
  const latMeters = 111132; // Approx meters per degree latitude
  const lonMeters = Math.cos((latitude * Math.PI) / 180) * 111320;
  return { latMeters, lonMeters };
}
