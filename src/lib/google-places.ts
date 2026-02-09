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
 * Phase 5.2: Uses API proxy route to avoid CORS issues
 * 
 * Previously called Google directly (CORS blocked).
 * Now calls /api/google/places/autocomplete which proxies to Google.
 */
export async function fetchPlacePredictions(
  input: string
): Promise<PlacePrediction[]> {
  try {
    // Call our API proxy route instead of Google directly
    const response = await fetch(
      `/api/google/places/autocomplete?input=${encodeURIComponent(input)}`
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
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
 * Get place details from placeId (street, city, state, zip, coordinates)
 * Phase 5.2: Uses API proxy route to avoid CORS issues
 * Now also extracts coordinates for Solar API
 */
export async function fetchPlaceDetails(placeId: string) {
  try {
    // Call our API proxy route instead of Google directly
    const response = await fetch(
      `/api/google/places/details?place_id=${placeId}`
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.status !== "OK") {
      console.error("Google Places details error:", data.status);
      return null;
    }

    const result = data.result;
    const addressComponents = result.address_components || [];
    const geometry = result.geometry || {};
    const location = geometry.location || {};

    // Extract address components
    let street = "";
    let city = "";
    let state = "";
    let zip = "";
    let altCity = "";

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
        if (
          component.types.includes("postal_town") ||
          component.types.includes("administrative_area_level_2") ||
          component.types.includes("sublocality") ||
          component.types.includes("sublocality_level_1") ||
          component.types.includes("neighborhood")
        ) {
          if (!altCity) {
            altCity = component.long_name;
          }
        }
        if (component.types.includes("administrative_area_level_1")) {
          state = component.short_name;
        }
        if (component.types.includes("postal_code")) {
          zip = component.long_name;
        }
      }
    );

    if (!city) {
      city = altCity || "";
    }

    return {
      street: street.trim(),
      city,
      state,
      zip,
      latitude: location.lat,
      longitude: location.lng
    };
  } catch (error) {
    console.error("Error fetching place details:", error);
    return null;
  }
}
