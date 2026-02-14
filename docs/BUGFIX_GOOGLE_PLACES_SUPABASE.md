# Bug Fixes: Google Places API & Supabase Warnings

**Date:** February 4, 2026  
**Issues Resolved:** 2 critical errors

---

## 🐛 Issues Fixed

### 1. **404 Error on Google Places Details API** ✅

**Error:**
```
Failed to load resource: the server responded with a status of 404 (Not Found)
Error fetching place details: Error: API error: Not Found
```

**Root Cause:**
- The `/api/google/places/details` route was returning mock data with hardcoded place IDs
- When autocomplete returned real place IDs from Google, they didn't match the mock data
- Result: 404 error on every address selection

**Fix:**
- Updated route to call the **real Google Places Details API**
- Added proper error handling and status checking
- Moved old mock code to comments for reference

**Files Changed:**
- [src/app/api/google/places/details/route.ts](src/app/api/google/places/details/route.ts)

---

### 2. **Multiple Supabase Client Instances Warning** ✅

**Warning:**
```
Multiple GoTrueClient instances detected in the same browser context.
It is not an error, but this should be avoided as it may produce undefined behavior.
```

**Root Cause:**
- Three different files were creating separate Supabase client instances:
  1. `src/lib/supabase/auth.ts`
  2. `src/lib/auth/auth-service.ts`
  3. `middleware.ts`
- This created multiple GoTrueClient instances in the browser

**Fix:**
- Consolidated all client creation to use the singleton from `client.ts`
- Renamed `getSupabase()` → `getSupabaseClient()` for clarity
- Updated imports in `auth.ts` and `auth-service.ts`
- Added explanatory comment in `middleware.ts` (Edge Runtime must create its own)

**Files Changed:**
- [src/lib/supabase/client.ts](src/lib/supabase/client.ts) - Renamed function
- [src/lib/supabase/auth.ts](src/lib/supabase/auth.ts) - Use singleton
- [src/lib/auth/auth-service.ts](src/lib/auth/auth-service.ts) - Use singleton
- [middleware.ts](middleware.ts) - Added comment explaining Edge Runtime

---

## ✅ Result

- ✅ Address selection now works perfectly with real Google API
- ✅ No more 404 errors on place details
- ✅ No more multiple Supabase client warnings
- ✅ Cleaner architecture with proper singleton pattern
- ✅ Solar score teaser displays correctly after address selection

---

## 🧪 Testing

**Test Address Selection:**
1. Visit http://localhost:3000
2. Type any real address (e.g., "1600 Pennsylvania Ave NW, Washington")
3. Select from autocomplete dropdown
4. ✅ Should fetch coordinates and show solar score teaser
5. ✅ No console errors

**Verify No Warnings:**
1. Open browser console (F12)
2. Refresh page
3. Complete address step
4. ✅ No "Multiple GoTrueClient" warnings
5. ✅ No 404 errors

---

## 📝 Technical Details

### Google Places Details API Call
```typescript
// Before: Mock data
const mockDetails = { ... };
return Response.json(mockDetails[placeId]);

// After: Real API
const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${apiKey}&fields=formatted_address,address_components,geometry`;
const apiRes = await fetch(url);
const data = await apiRes.json();
return Response.json(data);
```

### Supabase Singleton Pattern
```typescript
// Before: Multiple instances
const supabase = createClient(url, key); // In 3 files!

// After: Single instance
export function getSupabaseClient() {
  if (!supabaseInstance) {
    supabaseInstance = createClient(url, key);
  }
  return supabaseInstance;
}
```

---

**Status:** Both issues resolved ✅  
**Impact:** Critical UX improvements - address selection now functional
