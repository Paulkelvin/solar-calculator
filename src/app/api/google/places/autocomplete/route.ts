/**
 * Google Places API Autocomplete Proxy
 * Phase 5.2: API route to handle Places autocomplete requests
 * 
 * Why a proxy? CORS policy blocks direct client-side API calls.
 * This route runs on the server, avoiding CORS issues.
 */

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const input = searchParams.get('input');

    if (!input || input.trim().length < 2) {
      return Response.json({ predictions: [] });
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      console.warn('Google Places API key not configured');
      return Response.json({ predictions: [] });
    }

    // Call Google Places API from server (no CORS issues)
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${apiKey}&components=country:us`,
      { method: 'GET' }
    );

    if (!response.ok) {
      console.error(`Google Places API error: ${response.status}`);
      return Response.json(
        { error: 'Failed to fetch predictions', predictions: [] },
        { status: response.status }
      );
    }

    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error('Places API proxy error:', error);
    return Response.json(
      { error: 'Internal server error', predictions: [] },
      { status: 500 }
    );
  }
}
