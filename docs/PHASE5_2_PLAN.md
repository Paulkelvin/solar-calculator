# Phase 5.2: Real API Integration - Implementation Plan

**Date:** January 29, 2026  
**Status:** ✅ Initialized  
**Build On:** Phase 5.1 (Google Solar API - Production Ready)  

---

## 🎯 Phase 5.2 Objectives

Transform Phase 5.1 mock data into real API integration:

1. ✅ Implement Google Solar API (real API calls)
2. ✅ Implement Google Places API (real address suggestions)
3. ✅ Add request timeout handling
4. ✅ Add retry logic with exponential backoff
5. ✅ Add response caching
6. ✅ Add rate limiting
7. ✅ Implement DSIRE API for incentives
8. ✅ Implement Utility Rates API
9. ✅ Add integration tests
10. ✅ Add performance monitoring

---

## 📊 Current State (Phase 5.1 → Phase 5.2)

### What Phase 5.1 Provides
```
✅ Mock data infrastructure
✅ API credential validation
✅ Error handling structure
✅ Input validation layer
✅ Helper functions for transformation
✅ Test framework ready
✅ 404/404 tests passing
✅ 0 build errors
✅ Production-ready code quality
```

### What Phase 5.2 Adds
```
⏳ Real Google Solar API integration
⏳ Real Google Places API integration
⏳ Request timeout handling (5 second limit)
⏳ Exponential backoff retry logic
⏳ Response caching (60 minute TTL)
⏳ Rate limiting (100 req/min)
⏳ DSIRE incentive API integration
⏳ Utility rates API integration
⏳ Performance tests
⏳ Integration tests with mocked APIs
```

---

## 🚀 Week 1-2: Google APIs (Real Integration)

### Task 1: Google Solar API Real Implementation

**File:** `src/lib/apis/google-solar-api.ts`

**Current State (Phase 5.1):**
```typescript
if (apiKey) {
  // Real Google Solar API call
  // Phase 5.2+: Uncomment when ready to use real API
  // const response = await fetch(...);
}
```

**Phase 5.2 Implementation:**
```typescript
if (apiKey) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  
  try {
    const response = await fetch(
      `https://solar.googleapis.com/v1/buildingInsights:findClosest?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          location: { latitude, longitude },
          requiredQuality: 'HIGH'
        })
      }
    );
    
    if (!response.ok) {
      if (response.status === 429) {
        // Rate limited - implement backoff
        throw new RateLimitError();
      }
      throw new APIError(`${response.status}`);
    }
    
    return transformGoogleSolarResponse(await response.json());
  } finally {
    clearTimeout(timeout);
  }
}
```

**New Features:**
- ✅ Abort controller for timeout
- ✅ Error classification
- ✅ Proper response transformation
- ✅ Cleanup (clearTimeout)

**Tests Needed:**
- Successful API call
- Timeout scenario
- Rate limit scenario
- Network error scenario
- Invalid response scenario

---

### Task 2: Google Places API Real Implementation

**File:** `src/lib/apis/google-solar-api.ts`

**Phase 5.2 Changes:**
```typescript
if (apiKey) {
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(trimmedInput)}&key=${apiKey}&components=country:us`,
    { signal: controller.signal }
  );
  
  if (!response.ok) throw new APIError();
  
  const data = await response.json();
  return data.predictions?.map(transformGooglePlacesPrediction) ?? [];
}
```

**Key Points:**
- ✅ Proper URL encoding
- ✅ Geo-filtering (US only)
- ✅ Error handling
- ✅ Optional chaining

---

### Task 3: Add Request Timeout Handling

**New File:** `src/lib/apis/request-handler.ts`

```typescript
export class RequestTimeout extends Error {
  constructor(public readonly duration: number) {
    super(`Request timeout after ${duration}ms`);
  }
}

export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 5000
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'The operation was aborted') {
      throw new RequestTimeout(timeoutMs);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
```

**Benefits:**
- ✅ Prevents hanging requests
- ✅ Consistent timeout handling
- ✅ Type-safe error classification
- ✅ Reusable across APIs

---

### Task 4: Add Retry Logic with Backoff

**New File:** `src/lib/apis/retry-handler.ts`

```typescript
export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelayMs = 1000,
    maxDelayMs = 30000,
    backoffMultiplier = 2
  } = options;
  
  let lastError: Error | undefined;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on client errors (4xx) except 429 (rate limit)
      if (error instanceof Error) {
        if (error.message.includes('400') || error.message.includes('401')) {
          throw error;
        }
      }
      
      if (attempt < maxRetries - 1) {
        const delayMs = Math.min(
          initialDelayMs * Math.pow(backoffMultiplier, attempt),
          maxDelayMs
        );
        await sleep(delayMs);
      }
    }
  }
  
  throw lastError;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

**Exponential Backoff:**
```
Attempt 1: Fail immediately, retry after 1s
Attempt 2: Fail after 1s, retry after 2s
Attempt 3: Fail after 3s, retry after 4s
Attempt 4+: Cap at 30s, then give up
```

---

### Task 5: Add Response Caching

**New File:** `src/lib/apis/cache-handler.ts`

```typescript
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttlMs: number;
}

export class ResponseCache<K, V> {
  private cache = new Map<K, CacheEntry<V>>();
  
  get(key: K): V | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttlMs) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }
  
  set(key: K, data: V, ttlMs = 3600000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttlMs
    });
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  getStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.entries()).map(([key, entry]) => ({
        key,
        age: Date.now() - entry.timestamp,
        ttl: entry.ttlMs
      }))
    };
  }
}

// Singleton cache instances
export const solarDataCache = new ResponseCache<string, GoogleSolarData>();
export const addressCache = new ResponseCache<string, AddressAutocompleteResult[]>();
```

**Cache Strategy:**
- Solar data: 60 minutes (geographic data doesn't change often)
- Address suggestions: 24 hours (rarely changes)
- Incentives: 7 days (updated weekly)
- Utility rates: 30 days (annual updates)

---

### Task 6: Add Rate Limiting

**New File:** `src/lib/apis/rate-limiter.ts`

```typescript
export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export class RateLimiter {
  private requests: number[] = [];
  
  constructor(
    private readonly maxRequests: number,
    private readonly windowMs: number
  ) {}
  
  canRequest(): boolean {
    const now = Date.now();
    const cutoff = now - this.windowMs;
    
    // Remove old requests outside the window
    this.requests = this.requests.filter(time => time > cutoff);
    
    // Check if we can make a request
    if (this.requests.length < this.maxRequests) {
      this.requests.push(now);
      return true;
    }
    
    return false;
  }
  
  getRemaining(): number {
    const now = Date.now();
    const cutoff = now - this.windowMs;
    this.requests = this.requests.filter(time => time > cutoff);
    return Math.max(0, this.maxRequests - this.requests.length);
  }
  
  reset(): void {
    this.requests = [];
  }
}

// Rate limiters for each API
export const googleSolarLimiter = new RateLimiter(
  100, // 100 requests
  60000 // per 60 seconds
);

export const googlePlacesLimiter = new RateLimiter(
  1000, // 1000 requests
  60000 // per 60 seconds
);

export const desireLimiter = new RateLimiter(
  50, // 50 requests
  60000 // per 60 seconds
);
```

---

## 🗓️ Implementation Timeline

### Week 1: Days 1-2
- ✅ Google Solar API real implementation
- ✅ Google Places API real implementation
- ✅ Request timeout handling
- ✅ Error classification and handling

### Week 1: Days 3-4
- ✅ Retry logic with exponential backoff
- ✅ Response caching implementation
- ✅ Rate limiting implementation

### Week 1: Day 5
- ✅ Integration tests for Google APIs
- ✅ Performance tests
- ✅ End-to-end testing with real APIs

### Week 2: Days 1-3
- ✅ DSIRE API integration (Phase 5.2b)
- ✅ Utility Rates API integration (Phase 5.2c)
- ✅ Combined integration tests

### Week 2: Days 4-5
- ✅ Performance optimization
- ✅ Monitoring and logging
- ✅ Production deployment preparation

---

## ✅ Phase 5.2 Milestones

| Milestone | Target | Status |
|-----------|--------|--------|
| Week 1.1: Google APIs | Real integration working | ⏳ |
| Week 1.2: Resilience | Timeout + Retry + Cache | ⏳ |
| Week 1.3: Testing | Integration tests passing | ⏳ |
| Week 2.1: DSIRE API | Real incentives data | ⏳ |
| Week 2.2: Utility API | Real rate data | ⏳ |
| Week 2.3: E2E Testing | Full pipeline working | ⏳ |
| Week 2.4: Optimization | Performance tuned | ⏳ |
| Week 2.5: Production | Ready for deployment | ⏳ |

---

## 🎯 Success Criteria for Phase 5.2

### Code Quality
- ✅ 0 TypeScript errors
- ✅ 0 build errors
- ✅ Code quality: 4.8+/5
- ✅ Type safety: 100%

### Testing
- ✅ All Phase 4 tests passing (392)
- ✅ All Phase 5.1 tests passing (12)
- ✅ New Phase 5.2 tests: 25+ (integration + performance)
- ✅ Total: 430+ tests passing

### API Integration
- ✅ Real Google Solar API calls working
- ✅ Real Google Places API calls working
- ✅ Request timeout working
- ✅ Retry logic working
- ✅ Caching working
- ✅ Rate limiting working

### Performance
- ✅ Solar API calls: < 2 seconds (including retries)
- ✅ Address suggestions: < 1 second
- ✅ Cached responses: < 100ms
- ✅ Bundle size impact: < 50 KB

### Reliability
- ✅ Handles network timeouts
- ✅ Retries transient failures
- ✅ Rate limit compliance
- ✅ Graceful degradation
- ✅ Comprehensive error logging

---

## 📚 Reference Materials

### Google Solar API
- Documentation: https://developers.google.com/maps/documentation/solar
- BuildingInsights API: findClosest endpoint
- Response format: buildingInsights object with roofSegmentSummaries

### Google Places API
- Documentation: https://developers.google.com/maps/documentation/places
- Autocomplete: place/autocomplete/json endpoint
- Response format: predictions array

### Implementation Patterns
- Timeout: AbortController + setTimeout
- Retry: Exponential backoff (1s, 2s, 4s, ..., 30s max)
- Caching: In-memory Map with TTL
- Rate limiting: Sliding window counter

---

## 🔄 Git Workflow for Phase 5.2

### Branch Strategy
```
master (Phase 5.1 - Stable)
  ↓
phase-5.2 (Development)
  ├── phase-5.2a (Google APIs)
  ├── phase-5.2b (DSIRE API)
  ├── phase-5.2c (Utility API)
  └── phase-5.2-final (Integration & polish)
```

### Commit Strategy
```
Phase 5.2a: Google Solar API - Real Implementation
Phase 5.2a: Google Places API - Real Implementation
Phase 5.2a: Request Timeout Handling
Phase 5.2a: Retry Logic with Backoff
Phase 5.2a: Response Caching
Phase 5.2a: Rate Limiting
Phase 5.2a: Google API Integration Tests
... (etc)
```

---

## 🎓 Lessons from Phase 5.1 to Apply

### What Worked Well
1. ✅ Mock data first allowed testing without real APIs
2. ✅ Helper functions ready for Phase 5.2
3. ✅ Comprehensive error handling from the start
4. ✅ Type safety enforced throughout
5. ✅ Testing infrastructure ready

### Best Practices to Continue
1. ✅ Keep helper functions separate from main logic
2. ✅ Use error classification (APIError, TimeoutError, etc.)
3. ✅ Implement graceful fallback to mock data
4. ✅ Comprehensive input validation
5. ✅ Write tests alongside implementation

---

## 🚀 Next Steps

1. **Start Phase 5.2a Implementation**
   - Create phase-5.2 branch
   - Implement Google Solar API real calls
   - Implement request timeout handling
   - Add integration tests

2. **Monitor and Adjust**
   - Run tests continuously
   - Monitor performance metrics
   - Adjust retry/cache/rate-limit settings based on real API behavior

3. **Prepare for Phase 5.2b (DSIRE)**
   - Follow same pattern as Google APIs
   - Implement similar timeout/retry/cache
   - Add incentive data transformation

4. **Production Deployment**
   - Full regression testing
   - Performance monitoring
   - Production credentials setup

---

**Phase 5.2 Ready:** ✅ Initialized  
**Start Date:** January 29, 2026  
**Estimated Duration:** 2 weeks  
**Quality Target:** 4.8+/5  
