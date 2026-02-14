/**
 * Google Solar Image Proxy
 * Proxies GeoTiff images from Google Solar API (they return 403 when accessed directly from browser)
 */

import { fromArrayBuffer } from 'geotiff';
import { PNG } from 'pngjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawUrl = searchParams.get('url');

    if (!rawUrl) {
      return new Response('Missing url parameter', { status: 400 });
    }

    // Decode and ensure API key is attached (Google returns 403 without it)
    const decodedUrl = decodeURIComponent(rawUrl);
    const apiKey = process.env.GOOGLE_SOLAR_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_SOLAR_API_KEY;
    const target = new URL(decodedUrl);

    // SECURITY: Only allow Google API domains to prevent SSRF
    const allowedHosts = ['solar.googleapis.com', 'maps.googleapis.com', 'storage.googleapis.com'];
    if (!allowedHosts.includes(target.hostname)) {
      return new Response('Forbidden: URL must be a Google API endpoint', { status: 403 });
    }

    if (apiKey && !target.searchParams.has('key')) {
      target.searchParams.set('key', apiKey);
    }

    const proxiedUrl = target.toString();
    console.log('[Solar Image Proxy] Fetching:', proxiedUrl.substring(0, 140) + '...');

    // Fetch the GeoTiff from Google
    const response = await fetch(proxiedUrl);

    if (!response.ok || !response.body) {
      console.error(`[Solar Image Proxy] Failed: ${response.status}`);
      return new Response('Failed to fetch image', { status: response.status });
    }

    const contentType = response.headers.get('Content-Type') || '';

    // If GeoTIFF, decode and convert to PNG so Leaflet can render it
    if (contentType.includes('tiff') || contentType.includes('tif')) {
      const buffer = await response.arrayBuffer();
      try {
        const tiff = await fromArrayBuffer(buffer);
        const image = await tiff.getImage();
        const width = image.getWidth();
        const height = image.getHeight();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const raster: any = await image.readRasters({ interleave: true });
        const rasterArray: Uint8Array = raster instanceof Uint8Array
          ? raster
          : new Uint8Array(raster);
        const samples = rasterArray.length / (width * height);

        let rgba: Uint8Array;
        if (samples === 4) {
          rgba = rasterArray;
        } else if (samples === 3) {
          rgba = new Uint8Array(width * height * 4);
          for (let i = 0, j = 0; i < rasterArray.length; i += 3, j += 4) {
            rgba[j] = rasterArray[i];
            rgba[j + 1] = rasterArray[i + 1];
            rgba[j + 2] = rasterArray[i + 2];
            rgba[j + 3] = 255;
          }
        } else if (samples === 1) {
          // Single-channel GeoTIFF (likely flux). Map to grayscale alpha.
          rgba = new Uint8Array(width * height * 4);
          for (let i = 0, j = 0; i < rasterArray.length; i++, j += 4) {
            const v = rasterArray[i];
            rgba[j] = v;
            rgba[j + 1] = v;
            rgba[j + 2] = v;
            rgba[j + 3] = 220; // slight transparency
          }
        } else {
          console.warn('[Solar Image Proxy] Unexpected samples count:', samples);
          return new Response('Unsupported image format', { status: 415 });
        }

        const png = new PNG({ width, height });
        png.data = rgba;
        const pngBuffer = PNG.sync.write(png);

        console.log(`[Solar Image Proxy] ✓ Converted GeoTIFF -> PNG (${width}x${height})`);

        return new Response(pngBuffer, {
          headers: {
            'Content-Type': 'image/png',
            'Cache-Control': 'public, max-age=86400',
          },
        });
      } catch (err) {
        console.error('[Solar Image Proxy] GeoTIFF decode failed:', err);
        return new Response('Failed to decode GeoTIFF', { status: 500 });
      }
    }

    // Non-TIFF: stream through
    return new Response(response.body, {
      headers: {
        'Content-Type': contentType || 'image/tiff',
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
      },
    });
  } catch (error) {
    console.error('[Solar Image Proxy] Error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
