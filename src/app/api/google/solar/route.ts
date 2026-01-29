/**
 * Google Solar API Proxy
 * Phase 5.2: API route to handle Solar data requests
 * 
 * Why a proxy? CORS policy blocks direct client-side API calls.
 * This route runs on the server, avoiding CORS issues.
 */

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { latitude, longitude } = body;

    if (!latitude || !longitude) {
      return Response.json(
        { error: 'Missing coordinates' },
        { status: 400 }
      );
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_SOLAR_API_KEY;
    if (!apiKey) {
      console.warn('Google Solar API key not configured');
      return Response.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    // Call Google Solar API from server (no CORS issues)
    const response = await fetch(
      'https://solar.googleapis.com/v1/buildingInsights:findClosest?key=' + apiKey,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: { latitude, longitude },
          requiredQuality: 'HIGH'
        })
      }
    );

    if (!response.ok) {
      console.error(`Google Solar API error: ${response.status}`);
      return Response.json(
        { error: `Solar API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error('Solar API proxy error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
