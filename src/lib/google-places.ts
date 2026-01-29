/**
 * Google Places Autocomplete utility
 * Phase 2: Address autocomplete integration
 */

export interface PlacePrediction {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

/**
 * Fetch place predictions from Google Places API
 * Requires NEXT_PUBLIC_GOOGLE_PLACES_API_KEY
 */
export async function fetchPlacePredictions(
  input: string
): Promise<PlacePrediction[]> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    console.warn("Google Places API key not configured");
    return [];
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
        input
      )}&key=${apiKey}&components=country:us`
    );

    if (!response.ok) {
      throw new Error(`Google API error: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      console.error("Google Places API error:", data.status);
      return [];
    }

    return (data.predictions || []).map(
      (prediction: {
        place_id: string;
        description: string;
        structured_formatting: { main_text: string; secondary_text: string };
      }) => ({
        placeId: prediction.place_id,
        description: prediction.description,
        mainText: prediction.structured_formatting.main_text,
        secondaryText: prediction.structured_formatting.secondary_text || ""
      })
    );
  } catch (error) {
    console.error("Error fetching place predictions:", error);
    return [];
  }
}

/**
 * Get place details from placeId (street, city, state, zip)
 */
export async function fetchPlaceDetails(placeId: string) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    return null;
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${apiKey}&fields=formatted_address,address_components`
    );

    if (!response.ok) {
      throw new Error(`Google API error: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.status !== "OK") {
      console.error("Google Places details error:", data.status);
      return null;
    }

    const result = data.result;
    const addressComponents = result.address_components || [];

    // Extract address components
    let street = "";
    let city = "";
    let state = "";
    let zip = "";

    addressComponents.forEach(
      (component: { long_name: string; short_name: string; types: string[] }) => {
        if (component.types.includes("street_number")) {
          street = component.long_name + " " + (street || "");
        }
        if (component.types.includes("route")) {
          street = street + component.long_name;
        }
        if (component.types.includes("locality")) {
          city = component.long_name;
        }
        if (component.types.includes("administrative_area_level_1")) {
          state = component.short_name;
        }
        if (component.types.includes("postal_code")) {
          zip = component.long_name;
        }
      }
    );

    return {
      street: street.trim(),
      city,
      state,
      zip
    };
  } catch (error) {
    console.error("Error fetching place details:", error);
    return null;
  }
}
