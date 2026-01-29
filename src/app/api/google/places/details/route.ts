/**
 * Google Places API Details Proxy
 * Phase 5.2: API route to handle place details requests
 * 
 * Why a proxy? CORS policy blocks direct client-side API calls.
 * This route runs on the server, avoiding CORS issues.
 */

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const placeId = searchParams.get('place_id');

    if (!placeId) {
      return Response.json({ error: 'Missing place_id' }, { status: 400 });
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      console.warn('Google Places API key not configured');
      return Response.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    // Call Google Places API from server (no CORS issues)
    // Include geometry to get coordinates for solar API
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${apiKey}&fields=formatted_address,address_components,geometry`,
      { method: 'GET' }
    );

    if (!response.ok) {
      console.error(`Google Places API error: ${response.status}`);
      return Response.json(
        { error: `Places API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error('Places details API proxy error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
