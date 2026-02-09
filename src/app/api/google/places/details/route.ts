/**
 * Google Places API Details Proxy
 * Phase Enhancement: Real API integration for place details
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
      return Response.json({ error: 'API key not configured' }, { status: 500 });
    }

    // Call the real Google Places Details API
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${apiKey}&fields=formatted_address,address_components,geometry`;
    
    const apiRes = await fetch(url);
    if (!apiRes.ok) {
      console.error('Google Places API error:', apiRes.status);
      return Response.json({ error: 'Failed to fetch place details' }, { status: 502 });
    }

    const data = await apiRes.json();
    
    if (data.status !== 'OK') {
      console.error('Google Places API status:', data.status);
      return Response.json({ error: data.status, status: data.status }, { status: 404 });
    }

    return Response.json(data);
  } catch (error) {
    console.error('Places details API error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/* OLD MOCK CODE - KEPT FOR REFERENCE
export async function GET_OLD(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const placeId = searchParams.get('place_id');

    if (!placeId) {
      return Response.json({ error: 'Missing place_id' }, { status: 400 });
    }

    // PHASE 1: Return mock place details based on place_id
    const mockDetails: Record<string, any> = {
      mock_ny: {
        result: {
          formatted_address: "13 Fifth Avenue, New York, NY 10003, USA",
          address_components: [
            { long_name: "13", short_name: "13", types: ["street_number"] },
            { long_name: "Fifth Avenue", short_name: "5th Ave", types: ["route"] },
            { long_name: "Manhattan", short_name: "Manhattan", types: ["sublocality", "sublocality_level_1"] },
            { long_name: "New York", short_name: "New York", types: ["locality", "political"] },
            { long_name: "New York County", short_name: "New York County", types: ["administrative_area_level_2", "political"] },
            { long_name: "New York", short_name: "NY", types: ["administrative_area_level_1", "political"] },
            { long_name: "United States", short_name: "US", types: ["country", "political"] },
            { long_name: "10003", short_name: "10003", types: ["postal_code"] }
          ],
          geometry: {
            location: { lat: 40.7359, lng: -73.9941 }
          }
        }
      },
      mock_la: {
        result: {
          formatted_address: "13 Main Street, Los Angeles, CA 90012, USA",
          address_components: [
            { long_name: "13", short_name: "13", types: ["street_number"] },
            { long_name: "Main Street", short_name: "Main St", types: ["route"] },
            { long_name: "Los Angeles", short_name: "LA", types: ["locality", "political"] },
            { long_name: "Los Angeles County", short_name: "Los Angeles County", types: ["administrative_area_level_2", "political"] },
            { long_name: "California", short_name: "CA", types: ["administrative_area_level_1", "political"] },
            { long_name: "United States", short_name: "US", types: ["country", "political"] },
            { long_name: "90012", short_name: "90012", types: ["postal_code"] }
          ],
          geometry: {
            location: { lat: 34.0522, lng: -118.2437 }
          }
        }
      },
      mock_chicago: {
        result: {
          formatted_address: "13 Oak Street, Chicago, IL 60611, USA",
          address_components: [
            { long_name: "13", short_name: "13", types: ["street_number"] },
            { long_name: "Oak Street", short_name: "Oak St", types: ["route"] },
            { long_name: "Chicago", short_name: "Chicago", types: ["locality", "political"] },
            { long_name: "Cook County", short_name: "Cook County", types: ["administrative_area_level_2", "political"] },
            { long_name: "Illinois", short_name: "IL", types: ["administrative_area_level_1", "political"] },
            { long_name: "United States", short_name: "US", types: ["country", "political"] },
            { long_name: "60611", short_name: "60611", types: ["postal_code"] }
          ],
          geometry: {
            location: { lat: 41.8781, lng: -87.6298 }
          }
        }
      },
      mock_seattle: {
        result: {
          formatted_address: "13 Pine Street, Seattle, WA 98101, USA",
          address_components: [
            { long_name: "13", short_name: "13", types: ["street_number"] },
            { long_name: "Pine Street", short_name: "Pine St", types: ["route"] },
            { long_name: "Seattle", short_name: "Seattle", types: ["locality", "political"] },
            { long_name: "King County", short_name: "King County", types: ["administrative_area_level_2", "political"] },
            { long_name: "Washington", short_name: "WA", types: ["administrative_area_level_1", "political"] },
            { long_name: "United States", short_name: "US", types: ["country", "political"] },
            { long_name: "98101", short_name: "98101", types: ["postal_code"] }
          ],
          geometry: {
            location: { lat: 47.6062, lng: -122.3321 }
          }
        }
      },
      mock_austin: {
        result: {
          formatted_address: "13 Elm Street, Austin, TX 78701, USA",
          address_components: [
            { long_name: "13", short_name: "13", types: ["street_number"] },
            { long_name: "Elm Street", short_name: "Elm St", types: ["route"] },
            { long_name: "Austin", short_name: "Austin", types: ["locality", "political"] },
            { long_name: "Travis County", short_name: "Travis County", types: ["administrative_area_level_2", "political"] },
            { long_name: "Texas", short_name: "TX", types: ["administrative_area_level_1", "political"] },
            { long_name: "United States", short_name: "US", types: ["country", "political"] },
            { long_name: "78701", short_name: "78701", types: ["postal_code"] }
          ],
          geometry: {
            location: { lat: 30.2672, lng: -97.7431 }
          }
        }
      }
    };

    const details = mockDetails[placeId];
    if (!details) {
      return Response.json({ error: 'Place not found' }, { status: 404 });
    }

    console.log('PHASE 1: Google Places details stubbed - returning mock details for place_id:', placeId);
    return Response.json(details);
  } catch (error) {
    console.error('Places details API proxy error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
*/
