# Phase 2.4: Google Places API Setup (Address Autocomplete)

## Quick Start

### 1. Enable Google Places API
- Go to [Google Cloud Console](https://console.cloud.google.com)
- Create a new project (or select existing)
- Enable these APIs:
  - **Places API**
  - **Maps JavaScript API**

### 2. Create API Key
- Go to **Credentials** > **Create Credentials** > **API Key**
- Copy the key

### 3. Restrict API Key (Recommended for Production)
- In Credentials, click on your API key
- Set **Application restrictions** to "Website"
- Add domain(s) where your app runs
- Set **API restrictions** to allow only:
  - Places API
  - Maps JavaScript API

### 4. Update `.env.local`
```
NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=your-api-key-here
```

### 5. Restart Dev Server
```bash
npm run dev
```

---

## Testing Address Autocomplete

1. Visit http://localhost:3000
2. Start typing an address in the "Street Address" field
3. You should see suggestions appear after 3 characters
4. Click a suggestion to auto-fill city, state, ZIP

### Expected Behavior
- ✅ Predictions dropdown appears
- ✅ Clicking a prediction fills all address fields
- ✅ Form validates successfully
- ✅ Can proceed to next step

---

## How It Works

### AddressStep.tsx
- Listens for user input in street field
- Calls `fetchPlacePredictions()` after 3+ characters
- Displays matching predictions
- On selection, calls `fetchPlaceDetails()` to extract street/city/state/zip

### google-places.ts
- `fetchPlacePredictions()` - Get address suggestions
- `fetchPlaceDetails()` - Extract address components from placeId

---

## Troubleshooting

**"Cannot read properties of undefined"**
- Ensure `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY` is set
- Restart dev server after adding key

**No predictions appearing**
- Check browser console for errors
- Verify API key is valid
- Confirm Places API is enabled in Google Cloud

**"This API project is not authorized"**
- Double-check API key in .env.local
- Ensure Places API is enabled in Google Cloud Console
- Check API key restrictions don't exclude your domain

---

## Production Notes

- Use environment variable for API key (already set up)
- Consider rate limiting for production
- Store API key securely (never in git)
- Add billing to Google Cloud account if over free tier

---

## What's Next

- ✅ Supabase integration (data persistence)
- ✅ Google Places API (address autocomplete)
- ⏳ **PDF Report Generation** (next priority)
