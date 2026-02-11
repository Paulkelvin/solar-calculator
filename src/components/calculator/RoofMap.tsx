"use client";

import { useEffect, useState, useMemo, useCallback, type ReactNode } from "react";
import {
  MapContainer,
  TileLayer,
  useMap,
  Marker,
  Popup,
  ImageOverlay,
} from "react-leaflet";
import { LatLngBoundsExpression, LatLngExpression } from "leaflet";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import L from "leaflet";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface RoofSegment {
  bounds: { north: number; south: number; east: number; west: number };
  area: number;
  solarPotential: number;
  sunExposure: number;
  azimuth: number;
  tilt: number;
  center?: { latitude: number; longitude: number };
  footprint?: Array<{ latitude: number; longitude: number }>;
  footprintSource?: "google_polygon" | "rotated_bbox" | "axis_bbox";
}

interface RoofMapProps {
  latitude: number;
  longitude: number;
  roofSegments?: RoofSegment[];
  onPositionChange?: (lat: number, lng: number) => void;
  zoom?: number;
  variant?: "full" | "preview";
  headerMessage?: ReactNode;
}

function MapController({
  center,
  zoom,
}: {
  center: [number, number];
  zoom: number;
}) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

/** Returns [r, g, b] for a 0-1 intensity (low=blue, high=red-orange). */
function heatRGB(t: number): [number, number, number] {
  t = Math.max(0, Math.min(1, t));
  if (t < 0.25) {
    const s = t / 0.25;
    return [30, Math.round(60 + 180 * s), Math.round(220 - 80 * s)];
  }
  if (t < 0.5) {
    const s = (t - 0.25) / 0.25;
    return [
      Math.round(30 + 40 * s),
      Math.round(240 - 30 * s),
      Math.round(140 - 100 * s),
    ];
  }
  if (t < 0.75) {
    const s = (t - 0.5) / 0.25;
    return [
      Math.round(70 + 185 * s),
      Math.round(210 + 35 * s),
      Math.round(40 - 30 * s),
    ];
  }
  const s = (t - 0.75) / 0.25;
  return [255, Math.round(245 - 145 * s), Math.round(10 + 20 * s)];
}

/* ------------------------------------------------------------------ */
/*  Seeded PRNG so the organic jitter is stable across renders         */
/* ------------------------------------------------------------------ */
function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ------------------------------------------------------------------ */
/*  Canvas heat painter                                                */
/* ------------------------------------------------------------------ */

interface HeatGeoBounds {
  north: number;
  south: number;
  east: number;
  west: number;
  latSpan: number;
  lngSpan: number;
}

/**
 * Compute the tight geographic bounding box of all segments,
 * then add a small padding (~15 %) so the heat feathers just past
 * the roof edge but never balloons over neighbouring buildings.
 */
function computeHeatBounds(
  segments: RoofSegment[],
  centerLat: number,
  centerLng: number
): HeatGeoBounds {
  let north = -90,
    south = 90,
    east = -180,
    west = 180;

  for (const seg of segments) {
    if (seg.footprint && seg.footprint.length >= 3) {
      for (const p of seg.footprint) {
        if (p.latitude > north) north = p.latitude;
        if (p.latitude < south) south = p.latitude;
        if (p.longitude > east) east = p.longitude;
        if (p.longitude < west) west = p.longitude;
      }
    } else {
      if (seg.bounds.north > north) north = seg.bounds.north;
      if (seg.bounds.south < south) south = seg.bounds.south;
      if (seg.bounds.east > east) east = seg.bounds.east;
      if (seg.bounds.west < west) west = seg.bounds.west;
    }
  }

  // Fallback if everything collapsed to a point or invalid bounds
  if (north <= south || east <= west || !isFinite(north) || !isFinite(south) || !isFinite(east) || !isFinite(west)) {
    const tiny = 0.0003; // ~33 m
    north = (isFinite(centerLat) ? centerLat : 0) + tiny;
    south = (isFinite(centerLat) ? centerLat : 0) - tiny;
    east = (isFinite(centerLng) ? centerLng : 0) + tiny;
    west = (isFinite(centerLng) ? centerLng : 0) - tiny;
  }

  // Padding: 20 % of the larger dimension on each side
  const rawLat = north - south;
  const rawLng = east - west;
  const pad = Math.max(rawLat, rawLng) * 0.20;

  north += pad;
  south -= pad;
  east += pad;
  west -= pad;

  return {
    north,
    south,
    east,
    west,
    latSpan: north - south,
    lngSpan: east - west,
  };
}

/**
 * Paints a unified heat glow on a canvas that looks like one
 * cohesive thermal blob — not separate circles per segment.
 *
 * Strategy:
 *  1. Build a list of "heat points" from all segment centers.
 *  2. Draw a large unified base glow covering the whole roof using
 *     the area-weighted average exposure colour.
 *  3. Layer additive per-point radial gradients on top with
 *     `globalCompositeOperation = "lighter"` so overlapping regions
 *     merge seamlessly instead of stacking as separate discs.
 *  4. Bridge blobs between neighbouring segment centres so
 *     the gaps fill in.
 *  5. Fine speckles for thermal-camera texture.
 */
function paintHeatCanvas(
  segments: RoofSegment[],
  bounds: HeatGeoBounds,
  canvasSize: number
): string | null {
  if (segments.length === 0) return null;

  const canvas = document.createElement("canvas");
  canvas.width = canvasSize;
  canvas.height = canvasSize;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const { north, west, latSpan, lngSpan } = bounds;
  const maxSpan = Math.max(latSpan, lngSpan);

  const toX = (lng: number) => ((lng - west) / lngSpan) * canvasSize;
  const toY = (lat: number) => ((north - lat) / latSpan) * canvasSize;

  const rng = mulberry32(
    Math.round(bounds.north * 1e6) ^ Math.round(bounds.west * 1e6)
  );

  // Pre-compute segment centres and pixel positions
  const pts = segments.map((seg) => {
    // Always use marker position as the center for heat map
    const markerLng = (bounds.east + bounds.west) / 2;
    const markerLat = (bounds.north + bounds.south) / 2;
    const cx = toX(markerLng);
    const cy = toY(markerLat);
    const intensity = seg.sunExposure / 100;
    // Radius from area
    const areaM2 = seg.area || 20;
    const rMeters = Math.sqrt(Math.max(areaM2, 1) / Math.PI);
    const rGeo = Math.max(rMeters / 111320, 0.00001);
    const rPx = Math.max((rGeo / Math.max(maxSpan, 0.0001)) * canvasSize * 1.2, 10);
    return { cx, cy, intensity, rPx };
  });

  // Weighted average (safe against division by zero)
  const totalArea = segments.reduce((s, seg) => s + (seg.area || 0), 0);
  const avgIntensity =
    totalArea > 0
      ? segments.reduce((s, seg) => s + (seg.sunExposure / 100) * (seg.area || 0), 0) / totalArea
      : segments.reduce((s, seg) => s + (seg.sunExposure / 100), 0) / Math.max(segments.length, 1);
  // Validate avgIntensity is a valid number
  const safeIntensity = isFinite(avgIntensity) ? Math.max(0, Math.min(1, avgIntensity)) : 0.5;
  const [avgR, avgG, avgB] = heatRGB(safeIntensity);

  /* ---------- pass 1: unified base glow ---------- */
  // One large radial gradient covering ~45% of canvas from centre
  // Lower alpha so satellite imagery stays visible; colour saturation carries the intensity
  {
    const ccx = canvasSize / 2;
    const ccy = canvasSize / 2;
    const baseR = canvasSize * 0.42;
    const alpha = 0.10 + avgIntensity * 0.12;
    const grad = ctx.createRadialGradient(ccx, ccy, 0, ccx, ccy, baseR);
    grad.addColorStop(0, `rgba(${avgR},${avgG},${avgB},${alpha.toFixed(2)})`);
    grad.addColorStop(0.4, `rgba(${avgR},${avgG},${avgB},${(alpha * 0.55).toFixed(2)})`);
    grad.addColorStop(0.75, `rgba(${avgR},${avgG},${avgB},${(alpha * 0.18).toFixed(2)})`);
    grad.addColorStop(1, `rgba(${avgR},${avgG},${avgB},0)`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvasSize, canvasSize);
  }

  /* ---------- pass 2: additive per-segment blobs ---------- */
  // "lighter" compositing makes overlapping blobs merge into one glow
  ctx.globalCompositeOperation = "lighter";

  for (const pt of pts) {
    // Skip segments with invalid data
    if (!isFinite(pt.cx) || !isFinite(pt.cy) || !isFinite(pt.intensity) || !isFinite(pt.rPx)) continue;
    
    const [r, g, b] = heatRGB(pt.intensity);
    const blobR = Math.min(Math.max(pt.rPx * 1.3, 5), canvasSize * 0.42);

    // 2-3 slightly jittered blobs per segment
    const count = 2 + Math.floor(rng() * 2);
    for (let i = 0; i < count; i++) {
      const jx = pt.cx + (rng() - 0.5) * blobR * 0.25;
      const jy = pt.cy + (rng() - 0.5) * blobR * 0.25;
      const jr = blobR * (0.8 + rng() * 0.4);
      const alpha = 0.05 + pt.intensity * 0.07;

      const grad = ctx.createRadialGradient(jx, jy, 0, jx, jy, jr);
      grad.addColorStop(0, `rgba(${r},${g},${b},${alpha.toFixed(3)})`);
      grad.addColorStop(0.3, `rgba(${r},${g},${b},${(alpha * 0.55).toFixed(3)})`);
      grad.addColorStop(0.65, `rgba(${r},${g},${b},${(alpha * 0.15).toFixed(3)})`);
      grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.fillStyle = grad;
      ctx.fillRect(jx - jr, jy - jr, jr * 2, jr * 2);
    }
  }

  /* ---------- pass 3: bridge blobs between neighbours ---------- */
  // For each pair of segments that are close, draw a blob at the midpoint
  for (let a = 0; a < pts.length; a++) {
    for (let b = a + 1; b < pts.length; b++) {
      const dx = pts[b].cx - pts[a].cx;
      const dy = pts[b].cy - pts[a].cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      // Only bridge if segments are within 50% of canvas
      if (dist < canvasSize * 0.5) {
        const mx = (pts[a].cx + pts[b].cx) / 2 + (rng() - 0.5) * 8;
        const my = (pts[a].cy + pts[b].cy) / 2 + (rng() - 0.5) * 8;
        const midIntensity = (pts[a].intensity + pts[b].intensity) / 2;
        const [r, g, b_] = heatRGB(midIntensity);
        const mr = Math.max(dist * 0.45, 12);
        const alpha = 0.04 + midIntensity * 0.05;

        const grad = ctx.createRadialGradient(mx, my, 0, mx, my, mr);
        grad.addColorStop(0, `rgba(${r},${g},${b_},${alpha.toFixed(3)})`);
        grad.addColorStop(0.5, `rgba(${r},${g},${b_},${(alpha * 0.4).toFixed(3)})`);
        grad.addColorStop(1, `rgba(${r},${g},${b_},0)`);
        ctx.fillStyle = grad;
        ctx.fillRect(mx - mr, my - mr, mr * 2, mr * 2);
      }
    }
  }

  /* ---------- pass 4: fine speckles ---------- */
  const speckleCount = 25 + Math.floor(rng() * 15);
  for (let i = 0; i < speckleCount; i++) {
    const pt = pts[Math.floor(rng() * pts.length)];
    const spread = canvasSize * 0.05;
    const px = pt.cx + (rng() - 0.5) * spread * 2;
    const py = pt.cy + (rng() - 0.5) * spread * 2;
    const pr = 2 + rng() * 4;
    const [r, g, b] = heatRGB(pt.intensity * (0.7 + rng() * 0.3));
    const alpha = 0.02 + rng() * 0.04;

    const grad = ctx.createRadialGradient(px, py, 0, px, py, pr);
    grad.addColorStop(0, `rgba(${r},${g},${b},${alpha.toFixed(3)})`);
    grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
    ctx.fillStyle = grad;
    ctx.fillRect(px - pr, py - pr, pr * 2, pr * 2);
  }

  // Reset composite mode
  ctx.globalCompositeOperation = "source-over";

  return canvas.toDataURL("image/png");
}

/* ================================================================== */
/*  Component                                                          */
/* ================================================================== */

export function RoofMap({
  latitude,
  longitude,
  roofSegments = [],
  onPositionChange,
  zoom = 19,
  variant = "full",
  headerMessage,
}: RoofMapProps) {
  const [mounted, setMounted] = useState(false);
  const [heatUrl, setHeatUrl] = useState<string | null>(null);

  const hasSegments = roofSegments.length > 0;

  const CANVAS_PX = 800;

  // Derive heat bounds from actual segment footprints
  const heatGeo = useMemo<HeatGeoBounds | null>(() => {
    if (!hasSegments) return null;
    return computeHeatBounds(roofSegments, latitude, longitude);
  }, [roofSegments, latitude, longitude, hasSegments]);

  const heatBounds = useMemo<LatLngBoundsExpression | null>(() => {
    if (!heatGeo) return null;
    return [
      [heatGeo.south, heatGeo.west],
      [heatGeo.north, heatGeo.east],
    ];
  }, [heatGeo]);


  // Paint heat canvas whenever segments change
  const buildHeat = useCallback(() => {
    if (!heatGeo) { setHeatUrl(null); return; }
    const url = paintHeatCanvas(roofSegments, heatGeo, CANVAS_PX);
    setHeatUrl(url);
  }, [roofSegments, heatGeo]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && hasSegments) buildHeat();
    if (mounted && !hasSegments) setHeatUrl(null);
  }, [mounted, hasSegments, buildHeat]);

  /* ---- loading state ---- */
  if (!mounted) {
    return (
      <Card className="border-2 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="animate-spin h-6 w-6 border-3 border-blue-500 border-t-transparent rounded-full" />
            <p className="text-sm text-blue-700">Loading satellite map…</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${variant === "full" ? "border border-blue-200" : "border-0 shadow-none"} overflow-hidden`}>
      {variant === "full" && (
        <CardHeader className="py-2 pb-1">
          {headerMessage ? (
            headerMessage
          ) : (
            <p className="text-xs font-semibold text-blue-900">
              {hasSegments
                ? "🔥 Solar heat glow — warmer zones mark the strongest sun exposure"
                : "Satellite view of your property"}
            </p>
          )}
        </CardHeader>
      )}

      <CardContent className="p-0">
        <div className={`${variant === "full" ? "h-[400px]" : "h-[280px]"} w-full relative`}>
          <MapContainer
            center={[latitude, longitude]}
            zoom={zoom}
            scrollWheelZoom={true}
            style={{ height: "100%", width: "100%" }}
            className="z-0"
            attributionControl={false}
          >
            <MapController center={[latitude, longitude]} zoom={zoom} />

            {/* Satellite tiles */}
            <TileLayer
              url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
              maxZoom={21}
            />

            {/* ---- HEAT GLOW (canvas image overlay) ---- */}
            {heatUrl && heatBounds && (
              <ImageOverlay
                url={heatUrl}
                bounds={heatBounds}
                opacity={0.70}
                zIndex={500}
              />
            )}

            {/* Roof outline — hidden (heat glow is sufficient) */}

            {/* Property marker — draggable to re-target */}
            <Marker
              position={[latitude, longitude]}
              draggable={!!onPositionChange}
              eventHandlers={
                onPositionChange
                  ? {
                      dragend: (e) => {
                        const latlng = e.target.getLatLng();
                        onPositionChange(latlng.lat, latlng.lng);
                      },
                    }
                  : {}
              }
            >
              <Popup>
                <div className="text-xs">
                  <p className="font-semibold">Your Property</p>
                  <p className="text-muted-foreground">
                    {latitude.toFixed(6)}, {longitude.toFixed(6)}
                  </p>
                  {onPositionChange && (
                    <p className="text-blue-600 mt-1 font-medium">Drag marker to adjust</p>
                  )}
                </div>
              </Popup>
            </Marker>
          </MapContainer>

          {/* Gradient Legend for Heat Map */}
          <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-md border border-gray-200 z-[1000]">
            <p className="text-xs font-semibold text-gray-800 mb-2">Solar Potential</p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-yellow-400 border border-yellow-500" />
                <span className="text-xs text-gray-700">Good</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-orange-400 border border-orange-500" />
                <span className="text-xs text-gray-700">Very Good</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-500 border border-red-600" />
                <span className="text-xs text-gray-700">Excellent</span>
              </div>
            </div>
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
