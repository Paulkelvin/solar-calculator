/**
 * Google Places API Autocomplete Proxy
 * Phase 5.2: API route to handle Places autocomplete requests
 * 
 * PHASE 1: Stubbed - returns mock predictions without external API calls
 */

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const input = searchParams.get('input');

    if (!input || input.trim().length < 2) {
      return Response.json({ predictions: [], status: "ZERO_RESULTS" });
    }

    // Use the Google Places API key from environment
    const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      return Response.json({ error: 'Google Places API key not set', predictions: [] }, { status: 500 });
    }

    // Call the real Google Places Autocomplete API
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${apiKey}&types=address&components=country:us`;
    const apiRes = await fetch(url);
    if (!apiRes.ok) {
      return Response.json({ error: 'Failed to fetch from Google Places', predictions: [] }, { status: 502 });
    }
    const data = await apiRes.json();
    // Pass through the predictions and status
    return Response.json({ predictions: data.predictions, status: data.status });
  } catch (error) {
    console.error('Places API proxy error:', error);
    return Response.json(
      { error: 'Internal server error', predictions: [] },
      { status: 500 }
    );
  }
}
