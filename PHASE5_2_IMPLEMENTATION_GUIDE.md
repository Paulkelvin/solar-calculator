# Phase 5.2: Real API Integration - Implementation Guide

**Status:** ✅ Initialized  
**Date:** January 29, 2026  
**GitHub:** https://github.com/Paulkelvin/solar-calculator (main branch)  

---

## Overview

Phase 5.2 focuses on implementing **real API integration** for Google Solar and Google Places APIs with enterprise-grade resilience patterns (retry logic, caching, rate limiting).

**Key Infrastructure Ready:**
- ✅ Request handler (timeout management)
- ✅ Retry handler (exponential backoff)
- ✅ Cache handler (response caching)
- ✅ Rate limiter (API quota management)

---

## Phase 5.2 Implementation Roadmap

### Week 1: Real Google Solar API Integration

**Tasks:**
1. **Implement Real API Call**
   - Uncomment real API code in `getGoogleSolarData()`
   - Add API authentication
   - Test with real coordinates
   - Add timeout handling via `requestHandler`

2. **Add Error Handling**
   - 5xx server errors (retry)
   - 4xx client errors (don't retry)
   - Network timeouts (retry with backoff)
   - Rate limit responses (429 status)

3. **Test Coverage**
   - Real API response transformation
   - Error scenarios (5xx, 429, timeout)
   - Fallback to mock data when API fails
   - Performance benchmarking

**Files to Modify:**
- `src/lib/apis/google-solar-api.ts` - Uncomment real API call
- `tests/phase5-google-solar-api.test.ts` - Add integration tests
- `src/lib/apis/request-handler.ts` - Implement timeout logic

**Expected Outcomes:**
- Real Google Solar data flowing through system
- Timeout protection (<5s per request)
- Proper error logging
- Cache population on successful calls

---

### Week 2: Real Google Places API Integration

**Tasks:**
1. **Implement Real Address Autocomplete**
   - Uncomment real API code in `getAddressAutocomplete()`
   - Add address validation
   - Test with real address queries
   - Add timeout handling

2. **Add Suggestions Ranking**
   - Primary suggestion (most relevant)
   - Alternative suggestions
   - Filter by country (US only)

3. **Test Coverage**
   - Real API responses
   - Address parsing edge cases
   - International address handling
   - Cache effectiveness

**Files to Modify:**
- `src/lib/apis/google-solar-api.ts` - Uncomment Places API call
- `tests/phase5-google-solar-api.test.ts` - Add autocomplete tests
- Component integration with real suggestions

**Expected Outcomes:**
- Real address autocomplete working in forms
- Response caching reducing duplicate lookups
- Consistent user experience with real data

---

### Week 3-4: Resilience Patterns Implementation

**Tasks:**
1. **Implement Retry Logic**
   - Exponential backoff with jitter
   - Max 3 retries for transient errors
   - Different strategies for different error types
   - Logging all retry attempts

2. **Implement Caching**
   - TTL-based cache invalidation
   - Cache statistics tracking
   - Manual cache clearing for testing
   - Cache key generation

3. **Implement Rate Limiting**
   - Sliding window or token bucket
   - Respect API quotas
   - Queue requests if rate limited
   - Circuit breaker pattern (optional)

4. **Monitoring & Logging**
   - Request/response logging
   - Error rate tracking
   - Cache hit/miss rates
   - Performance metrics

**Files to Modify/Complete:**
- `src/lib/apis/retry-handler.ts` - Full implementation
- `src/lib/apis/cache-handler.ts` - Full implementation
- `src/lib/apis/rate-limiter.ts` - Full implementation
- `src/lib/apis/request-handler.ts` - Complete timeout logic

**Testing:**
- Simulate API failures and verify retries
- Verify cache is working
- Verify rate limiting prevents excess calls
- Performance testing under load

---

### Week 5+: DSIRE & Utility Rates APIs

**Phase 5.3 Preview (Not Phase 5.2):**
- Implement DSIRE API for incentives
- Implement utility rates API
- Integration with calculator
- Dashboard enhancements

---

## Implementation Details

### Step 1: Uncomment Real Google Solar API

**File:** `src/lib/apis/google-solar-api.ts`

**Current (Phase 5.1):**
```typescript
if (apiKey) {
  // Real Google Solar API call
  // Phase 5.2+: Uncomment when ready to use real API
  // const response = await fetch(...)
}
```

**Phase 5.2 Change:**
```typescript
if (apiKey) {
  // Real Google Solar API call
  const response = await requestHandler.fetchWithTimeout(
    `https://solar.googleapis.com/v1/buildingInsights:findClosest?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: { latitude, longitude },
        requiredQuality: 'HIGH'
      }),
      timeout: 5000 // 5 second timeout
    }
  );
  
  if (!response.ok) {
    // Let retry handler manage retries
    if (response.status >= 500 || response.status === 429) {
      throw new Error(`API Error: ${response.status}`);
    }
    return null;
  }
  
  const data = await response.json();
  
  // Cache the successful response
  const cacheKey = `solar_${placeId}`;
  solarDataCache.set(cacheKey, transformGoogleSolarResponse(data), 3600000); // 1 hour TTL
  
  return transformGoogleSolarResponse(data);
}
```

---

### Step 2: Integrate Retry Logic

**Usage Pattern:**

```typescript
import { retryWithBackoff } from '../apis/retry-handler';

const result = await retryWithBackoff(
  () => getGoogleSolarData(placeId),
  {
    maxRetries: 3,
    initialDelayMs: 100,
    maxDelayMs: 5000,
    backoffMultiplier: 2,
    jitterFactor: 0.1
  }
);
```

---

### Step 3: Implement Caching

**Usage Pattern:**

```typescript
import { solarDataCache } from '../apis/cache-handler';

const cacheKey = `solar_${placeId}`;
const cached = solarDataCache.get(cacheKey);

if (cached) {
  return cached; // Return from cache
}

// Fetch from API
const data = await getGoogleSolarData(placeId);

// Store in cache (1 hour TTL)
solarDataCache.set(cacheKey, data, 3600000);

return data;
```

---

### Step 4: Rate Limiting

**Usage Pattern:**

```typescript
import { rateLimiter } from '../apis/rate-limiter';

// Initialize rate limiter
// 100 requests per minute
const limiter = rateLimiter.createLimiter(100, 60000);

async function fetchWithRateLimit() {
  if (!limiter.canRequest()) {
    // Wait or use cached data
    console.warn('Rate limit reached');
    return getCachedData() || null;
  }
  
  return await getGoogleSolarData(placeId);
}
```

---

## API Credentials Setup

### Get Google Solar API Key

1. Go to Google Cloud Console: https://console.cloud.google.com
2. Create new project or select existing
3. Enable "Solar API"
4. Create Service Account
5. Generate API key
6. Add to `.env.local`:

```env
NEXT_PUBLIC_GOOGLE_SOLAR_API_KEY=your_key_here
```

### Get Google Places API Key

1. In Google Cloud Console
2. Enable "Places API"
3. Create API key
4. Add to `.env.local`:

```env
NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=your_key_here
```

### Verify Setup

```bash
# Test API access
node -e "
const key = process.env.NEXT_PUBLIC_GOOGLE_SOLAR_API_KEY;
console.log('Solar API Key:', key ? 'Set ✓' : 'Not Set ✗');
"
```

---

## Testing Strategy

### Unit Tests

```typescript
describe('Phase 5.2: Real API Integration', () => {
  it('should retry failed requests', async () => {
    const result = await retryWithBackoff(
      failOnceThenSucceed,
      { maxRetries: 3 }
    );
    expect(result).toEqual('success');
  });
  
  it('should cache responses', () => {
    const cache = new ResponseCache();
    cache.set('key', 'value', 1000);
    expect(cache.get('key')).toEqual('value');
  });
  
  it('should respect rate limits', () => {
    const limiter = createLimiter(2, 1000); // 2 requests per second
    expect(limiter.canRequest()).toBe(true);
    expect(limiter.canRequest()).toBe(true);
    expect(limiter.canRequest()).toBe(false); // Rate limited
  });
});
```

### Integration Tests

```typescript
describe('Real API Integration', () => {
  it('should fetch real solar data with retry', async () => {
    const data = await retryWithBackoff(
      () => getGoogleSolarData('real_place_id'),
      { maxRetries: 3 }
    );
    expect(data).toHaveProperty('panelCapacityWatts');
  });
});
```

### E2E Tests

- Test full flow: Form → API → Cache → Results
- Verify timeout handling
- Verify error recovery
- Test with various addresses

---

## Monitoring & Observability

### Metrics to Track

1. **API Performance**
   - Average response time
   - P95/P99 response times
   - Success rate
   - Error rate by status code

2. **Cache Metrics**
   - Hit rate
   - Miss rate
   - Average age of cached data
   - Cache size

3. **Rate Limiting**
   - Requests allowed
   - Requests throttled
   - Time spent waiting

4. **Retry Statistics**
   - Successful retries
   - Failed after retries
   - Average retry count

### Logging

```typescript
logger.info('API Request', {
  endpoint: 'solar.googleapis.com',
  placeId,
  attempt: 1,
  timestamp: new Date().toISOString()
});

logger.info('Cache Hit', {
  key: cacheKey,
  age: timeSinceCreation
});

logger.warn('Rate Limited', {
  endpoint: 'places.googleapis.com',
  windowMs: 60000,
  requestsMade: 100
});

logger.error('API Error', {
  endpoint: 'solar.googleapis.com',
  status: 500,
  message: 'Internal Server Error',
  retryCount: 2
});
```

---

## Performance Targets

| Metric | Target | Phase 5.1 | Phase 5.2 Goal |
|--------|--------|-----------|-----------------|
| Solar API Response | < 2s | Mock: <1ms | Real: <2s |
| Address Autocomplete | < 1s | Mock: <1ms | Real: <1s |
| Cache Hit Time | < 10ms | N/A | < 10ms |
| Retry Overhead | < 5s | N/A | < 5s (max) |
| Bundle Size | < 200 kB | 148 kB | < 150 kB |
| Test Suite | < 15s | 9.38s | < 12s |

---

## Risk Mitigation

### Risk: API Rate Limiting
**Mitigation:** Implement exponential backoff and caching

### Risk: Network Timeouts
**Mitigation:** 5-second timeout with retry logic

### Risk: API Changes
**Mitigation:** Version API responses, handle gracefully

### Risk: Cache Staleness
**Mitigation:** TTL-based expiration, manual cache invalidation

### Risk: Memory Leaks
**Mitigation:** Cache size limits, cleanup on app shutdown

---

## Success Criteria

- ✅ Real Google Solar API returns accurate data
- ✅ Real Google Places API provides address suggestions
- ✅ Retry logic handles transient failures
- ✅ Caching reduces API calls by >80%
- ✅ Rate limiting prevents quota overages
- ✅ All Phase 4 tests still passing
- ✅ New integration tests passing
- ✅ Performance within targets
- ✅ 0 errors in production
- ✅ Graceful degradation when APIs unavailable

---

## Deliverables

### End of Phase 5.2

1. ✅ Real Google Solar API integrated
2. ✅ Real Google Places API integrated
3. ✅ Retry logic implemented with backoff
4. ✅ Cache handler fully functional
5. ✅ Rate limiter implemented
6. ✅ Comprehensive test coverage
7. ✅ Monitoring & logging in place
8. ✅ Documentation updated
9. ✅ All previous tests passing (404+)
10. ✅ Production deployment ready

---

## Next Steps

1. **Day 1:** Uncomment real Google Solar API, add basic timeout handling
2. **Day 2:** Implement retry logic with exponential backoff
3. **Day 3:** Integrate caching for responses
4. **Day 4:** Uncomment real Google Places API
5. **Day 5:** Implement rate limiting
6. **Days 6-7:** Comprehensive testing and optimization
7. **Days 8-10:** Integration testing, monitoring, documentation

---

## References

- Google Solar API Docs: https://developers.google.com/maps/documentation/solar
- Google Places API Docs: https://developers.google.com/maps/documentation/places
- Exponential Backoff: https://en.wikipedia.org/wiki/Exponential_backoff
- Rate Limiting Patterns: https://en.wikipedia.org/wiki/Rate_limiting

---

**Status:** Ready to implement  
**Target:** 2-3 weeks for Weeks 1-5  
**Next Phase:** Phase 5.3 (DSIRE & Utility Rates APIs)  
