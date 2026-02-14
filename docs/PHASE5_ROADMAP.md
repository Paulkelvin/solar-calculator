# Phase 5 Implementation Roadmap

## Current Status: Phase 4 Complete ✅

**Metrics:**
- ✅ 392 tests passing (100%)
- ✅ 0 TypeScript errors
- ✅ Build: 0 errors, 148 kB First Load JS
- ✅ All edge cases verified (47 comprehensive tests)
- ✅ Production ready

---

## Phase 5 Starting Point

### Prerequisites Checklist
- [ ] Phase 4 documentation complete → [PHASE4.6_EDGE_CASE_TESTING.md](PHASE4.6_EDGE_CASE_TESTING.md)
- [ ] All 392 tests passing
- [ ] API credentials ready (Google, DSIRE, OpenEI, SendGrid, etc.)
- [ ] Supabase project setup complete
- [ ] GitHub Actions/CI-CD configured
- [ ] Staging environment created

### API Structure Created
```
src/lib/apis/
├── google-solar-api.ts       ✅ Stub created
├── dsire-api.ts              ✅ Stub created
├── utility-rates-api.ts      ✅ Stub created
├── financing-api.ts          ✅ Stub created
└── email-service.ts          ✅ Stub created
```

---

## Phase 5.1: Google Solar API Integration (Weeks 1-2)

### Overview
Replace Phase 4 mock address autocomplete and solar calculations with real Google Solar API data.

### User Stories
1. **Address Autocomplete**: User types address → real Google Places results
2. **Solar Data**: Address selected → real solar potential from Google API
3. **Roof Analysis**: Get actual roof size, shading, orientation from Google data

### Acceptance Criteria
- [ ] Address autocomplete returns real results
- [ ] Solar potential data fetches successfully
- [ ] Fallback to Phase 4 mock if API unavailable
- [ ] API errors handled gracefully with user-facing messages
- [ ] Response time < 1 second
- [ ] Rate limiting handled (quota management)
- [ ] 15+ unit tests for API integration

### Implementation Tasks
1. **Set up Google Cloud Project**
   - Enable Solar API
   - Enable Places API
   - Create API keys
   - Set up quota monitoring

2. **Implement google-solar-api.ts**
   - `getGoogleSolarData(placeId)` → fetch real solar potential
   - `getAddressAutocomplete(input)` → fetch real address suggestions
   - Implement retry logic with exponential backoff
   - Add request throttling for rate limits

3. **Update Calculator Form**
   - Use real address autocomplete in form
   - Show real solar data in results
   - Add loading states and error handling

4. **Update Results Page**
   - Show Google Solar API data confidence level
   - Display disclaimer for mock vs. real data
   - Show actual roof size from Google data

5. **Testing**
   - Mock Google API responses for tests
   - Test fallback to Phase 4 data
   - Test error scenarios

### Environment Variables
```
NEXT_PUBLIC_GOOGLE_SOLAR_API_KEY=xxx
NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=xxx
GOOGLE_SOLAR_API_QUOTA_LIMIT=100
```

---

## Phase 5.2: DSIRE Incentives API (Week 3)

### Overview
Replace static incentive database with real DSIRE data feed.

### User Stories
1. **Dynamic Incentives**: Show real state/local incentives for selected address
2. **Updated Incentives**: Automatically refresh when new programs added
3. **Eligibility Check**: Verify customer eligibility for each incentive

### Acceptance Criteria
- [ ] DSIRE API integration working
- [ ] State incentives populate dynamically
- [ ] Eligibility checking functional
- [ ] Fallback to Phase 4 mock incentives
- [ ] Performance: < 500ms response time
- [ ] 10+ unit tests for DSIRE integration

### Implementation Tasks
1. **DSIRE API Integration**
   - Set up DSIRE API access
   - Implement `getDSIREIncentives()`
   - Implement `checkDSIREEligibility()`

2. **Update Calculations**
   - Use DSIRE incentives instead of mock data
   - Update incentive calculations

3. **Update Results Display**
   - Show real incentives in calculations
   - Show data source (DSIRE)

4. **Caching Strategy**
   - Cache incentive data by state (1 week TTL)
   - Invalidate on manual refresh

---

## Phase 5.3: Utility Rates API (Week 4)

### Overview
Replace estimated utility rates with real rates by location.

### User Stories
1. **Real Rates**: Show actual utility rates for customer's address
2. **Rate Trends**: Display historical rate trends
3. **Net Metering**: Show actual net metering policy for utility

### Acceptance Criteria
- [ ] Utility rates fetched for valid addresses
- [ ] Rate trends showing 5-year history
- [ ] Net metering policy displayed
- [ ] Fallback to $0.135/kWh estimate
- [ ] Caching strategy implemented
- [ ] 8+ unit tests

### Implementation Tasks
1. **OpenEI API Integration**
   - Set up OpenEI API access
   - Implement utility rate lookup
   - Implement rate trends API

2. **Update Calculations**
   - Use real utility rates in ROI calculations
   - Update savings projections

3. **Results Display**
   - Show actual utility rates
   - Show rate trends chart (if available)
   - Show net metering policy

---

## Phase 5.4: Financing Partner APIs (Weeks 5-6)

### Overview
Connect to real lending partners for actual APR quotes and financing availability.

### User Stories
1. **Real APR Quotes**: Show actual APR based on credit score and state
2. **Loan Pre-qualification**: Instant pre-qualification check
3. **Lease/PPA Availability**: Real availability from providers
4. **Multiple Quotes**: Show different lender options

### Acceptance Criteria
- [ ] Real APR quotes from lending partners
- [ ] Pre-qualification logic working
- [ ] Lease/PPA availability accurate
- [ ] Fallback to Phase 4.3 financing rules
- [ ] Performance: < 1 second for quotes
- [ ] 20+ unit tests for financing APIs

### Implementation Tasks
1. **Lending Partner Integration**
   - Set up partnerships API access
   - Implement APR quote API
   - Implement pre-qualification

2. **Update Financing Display**
   - Show real APR quotes
   - Show multiple lender options
   - Highlight best rates for credit score

3. **Update Results**
   - Show real financing monthly payments
   - Show partner logos/names

---

## Phase 5.5: PDF Generation & Email Delivery (Week 7)

### Overview
Generate professional proposal PDFs and email to customers/installers.

### User Stories
1. **PDF Report**: Generate downloadable proposal PDF
2. **Customer Email**: Email proposal to customer
3. **Installer Email**: Notify installer of new lead with details
4. **Email History**: Track emails sent in dashboard

### Acceptance Criteria
- [ ] PDF generation working (layout, data accuracy)
- [ ] Email delivery to customers working
- [ ] Email delivery to installers working
- [ ] Email templates professional
- [ ] Fallback if email service unavailable
- [ ] Email delivery tracking in database
- [ ] 12+ unit tests for PDF/email

### Implementation Tasks
1. **PDF Generation Library Setup**
   - Choose library (PDFKit, Puppeteer, html2pdf)
   - Create PDF templates
   - Test layout and formatting

2. **Email Service Setup**
   - Configure SendGrid/Mailgun
   - Create email templates
   - Test delivery

3. **API Routes**
   - `POST /api/pdf/generate` → generate PDF
   - `POST /api/email/send-customer` → send customer email
   - `POST /api/email/send-installer` → send installer email

4. **Database Integration**
   - Store email history
   - Store PDF links
   - Track delivery status

---

## Phase 5.6: Performance Optimization (Week 8)

### Overview
Optimize bundle size, load times, and API response times.

### Optimization Areas
1. **Code Splitting**
   - Lazy load results components
   - Lazy load calculator form
   - Dynamic imports for heavy libraries

2. **Bundle Analysis**
   - Identify large dependencies
   - Consider alternatives
   - Remove unused code

3. **Caching Strategy**
   - API response caching
   - Data memoization
   - Browser caching headers

4. **Database Optimization**
   - Index key fields
   - Query optimization
   - Connection pooling

### Success Metrics
- First Load JS: < 150 kB
- LCP (Largest Contentful Paint): < 2.5s
- FID (First Input Delay): < 100ms
- CLS (Cumulative Layout Shift): < 0.1
- Lighthouse Score: 90+

---

## Phase 5.7: Supabase Integration (Week 9)

### Overview
Enable real data persistence and installer authentication.

### Components
1. **Installer Authentication**
   - Email/password signup
   - Email verification
   - Password reset
   - Session management

2. **Lead Persistence**
   - Save leads to database
   - Lead history in dashboard
   - Lead status tracking

3. **Activity Logging**
   - Track all user actions
   - API call logging
   - Performance metrics

### Database Schema
```sql
-- Existing tables (from Phase 1-4)
- installers
- leads
- activity_log

-- New tables (Phase 5)
- api_calls          -- track API usage
- email_history      -- track emails sent
- performance_metrics -- track response times
- pdf_reports        -- store PDF metadata
```

### RLS Policies
- Installers see only their own leads
- Admin see all leads
- Activity logging accessible only to admin

---

## Phase 5.8: Deployment & Monitoring (Week 10)

### Overview
Deploy to production and set up monitoring.

### Deployment Strategy
1. **Staging Environment**
   - Deploy Phase 5 code to staging
   - Run full test suite
   - Performance testing

2. **Production Deployment**
   - Blue-green deployment
   - Canary releases for risky changes
   - Automatic rollback on errors

3. **Monitoring & Observability**
   - Error tracking (Sentry)
   - Performance monitoring (Vercel Analytics)
   - Uptime monitoring
   - Database monitoring
   - API rate limit monitoring

### Production Checklist
- [ ] All tests passing
- [ ] Performance benchmarks met
- [ ] Security audit completed
- [ ] GDPR/CCPA compliance verified
- [ ] API credentials secured in env
- [ ] Monitoring alerts configured
- [ ] Incident response plan ready
- [ ] Backup strategy in place

---

## Testing Strategy for Phase 5

### Unit Tests
- API integration mocks
- Credential validation
- Error handling
- Fallback logic

### Integration Tests
- Full calculator flow with real APIs
- Email delivery integration
- PDF generation
- Database persistence

### E2E Tests (Cypress/Playwright)
- User journey: Address → Results → Email
- Admin dashboard flows
- Error scenarios

### Performance Tests
- Load testing with artillery
- Bundle size analysis
- API response time benchmarks

### Security Tests
- API key validation
- RLS policy verification
- CORS configuration
- Input validation

---

## Risk Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| API rate limiting | High | Medium | Implement caching, request throttling |
| API downtime | Medium | High | Fallback to Phase 4 mock data |
| Performance degradation | Medium | Medium | Load testing, code splitting |
| Data accuracy issues | Low | High | Validation tests, manual verification |
| Security vulnerabilities | Low | Critical | Security audit, credential rotation |
| Compliance violations | Low | Critical | Legal review, GDPR/CCPA audit |

---

## Success Criteria - Phase 5 Complete

✅ All 392 Phase 4 tests still passing  
✅ 150+ new Phase 5 tests added  
✅ Build: 0 errors, <200 kB First Load JS (with code splitting)  
✅ All 5 API integrations functional (with fallbacks)  
✅ Email delivery working (customer + installer)  
✅ PDF generation working  
✅ Lighthouse score: 85+ on mobile  
✅ Supabase auth + data persistence working  
✅ Production deployed and monitoring active  
✅ Installer can see their leads in dashboard  

---

## Next Actions (This Week)

1. ✅ Create Phase 5 plan and stub files
2. [ ] Set up Google Cloud Project for Solar API
3. [ ] Create DSIRE API account
4. [ ] Set up OpenEI API access
5. [ ] Configure lending partner APIs
6. [ ] Set up SendGrid account
7. [ ] Create .env.example with all Phase 5 variables
8. [ ] Schedule Phase 5.1 kickoff meeting

---

**Phase 4 Status**: ✅ Complete (392 tests, 0 errors)  
**Phase 5 Status**: 📋 Planning (Stub files created)  
**Target Start**: Next week  
**Estimated Duration**: 10 weeks
