# Phase 4: Advanced Features & Real Integrations

**Estimated Duration:** 2-3 weeks (80-120 hours)  
**Starting:** January 29, 2026  
**Target Completion:** Mid-February 2026

---

## 🎯 Phase 4 Goals

- ✅ Tax credits (Federal ITC + state-specific incentives)
- ✅ Regional financing availability (state/credit-based)
- ✅ Credit score impact on loan rates
- ✅ Remove fallback mocks → use real APIs exclusively
- ✅ Enhanced lead dashboard (search, filtering, export)
- ✅ Comprehensive test coverage for new features
- ✅ Production-ready financial accuracy

---

## 📋 Phase 4 Workstreams (6 streams)

### Phase 4.1: Tax Credits Infrastructure (8 hours)
**Goal:** Implement Federal ITC + state tax credit calculations

**Deliverables:**
- [ ] Tax credit types: Federal ITC (30%), state credits (5-40% by state)
- [ ] Types/schemas for tax credits
- [ ] `src/lib/calculations/tax-credits.ts` with calculation logic
- [ ] Tax credit display in results cards
- [ ] Tests for all 50 states

**Key Features:**
```typescript
// Federal ITC
- 30% federal tax credit (through 2032)
- Ramps down: 30% (2024-26) → 26% (2027) → 22% (2029)

// State Credits (examples)
- CA: 15% (capped at $3,000)
- NY: 25% (capped at $5,625)
- MA: 15% (capped at $1,000)
- TX: None (fossil fuel state)
- NV: 10% (capped at $2,000)
// ...all 50 states

// Calculation
earnedTaxCredit = systemCostBeforeITC * federalRate
stateCredit = earnedTaxCredit * stateRate (if applicable)
totalTaxBenefit = federalCredit + stateCredit
```

**Files to Create:**
- `types/tax-credits.ts` (50 lines)
- `src/lib/calculations/tax-credits.ts` (250 lines)
- `tests/tax-credits.test.ts` (35 tests)

---

### Phase 4.2: State Incentives Database (6 hours)
**Goal:** Build comprehensive incentive lookup by state/utility

**Deliverables:**
- [ ] Incentives table schema in Supabase
- [ ] Data import: EnergySage API + manual state data
- [ ] `src/lib/calculations/incentives.ts` lookup logic
- [ ] Filter incentives by state + zip code
- [ ] Display available incentives on results page
- [ ] Tests covering all states with/without incentives

**Key Features:**
```
Incentive Types:
- Rebates (utility company)
- Grants (state/local)
- Property tax exemptions
- Sales tax exemptions
- Equipment incentives

Example Incentive:
{
  state: 'CA',
  utility: 'PG&E',
  name: 'Solar Rebate Program',
  amount: 2.50,
  unit: '$/watt',
  maxAmount: 5000,
  description: 'Direct rebate for residential solar'
}
```

**Files to Create:**
- `types/incentives.ts` (30 lines)
- `src/lib/calculations/incentives.ts` (200 lines)
- `src/lib/supabase/incentives-data.sql` (state/utility data)
- `tests/incentives.test.ts` (25 tests)

---

### Phase 4.3: Regional Financing Rules (8 hours)
**Goal:** Implement state/credit-based financing availability

**Deliverables:**
- [ ] Financing availability matrix (state + credit score)
- [ ] Loan options by state (which states allow loans)
- [ ] Lease/PPA providers by region
- [ ] Credit score thresholds for each option
- [ ] Hide unavailable options on results page
- [ ] Explain why options unavailable (UX)
- [ ] Tests for all scenarios

**Key Features:**
```
Financing Availability:

Cash:         Always available
Loan:         Credit score ≥ 650 (varies by state)
Lease:        Only in CA, NY, MA, IL, TX (20 states)
PPA:          Only in CA, AZ, NV, UT (solar-friendly)

Credit Score Impact:
  < 600:      Cash only
  600-650:    Cash + expensive loan (9%+ APR)
  650-750:    Loan at 6.5% APR
  750+:       Premium loan (5.5% APR)
```

**Files to Create:**
- `types/financing-rules.ts` (40 lines)
- `src/lib/calculations/financing-rules.ts` (300 lines)
- `tests/financing-rules.test.ts` (40 tests)

**Database Addition:**
- `financing_availability` table (state, min_credit_score, option_type)

---

### Phase 4.4: Credit Score Integration (6 hours)
**Goal:** Incorporate credit score into calculations

**Deliverables:**
- [ ] Optional credit score input in calculator
- [ ] APR adjustment based on score (5.5%-9%+ range)
- [ ] Financing availability filter
- [ ] Lead scoring updated to include credit
- [ ] Results show "Estimated APR based on credit" note
- [ ] Tests for all credit bands

**Key Features:**
```
Credit Score Input (optional):
- Range: 300-850
- Default: 700 (if not provided)
- Impact on APR:
  300-550: 9.0% (risky)
  550-650: 8.0%
  650-700: 6.5% (standard)
  700-750: 6.0%
  750+:    5.5% (premium)

Lead Scoring Update:
  Base: 0-50 (system size + ROI)
  + Credit: +10 (good score) / -10 (poor)
  + Location: +15 (incentives available)
  = Final: 0-100
```

**Files to Create:**
- Update `src/components/calculator/steps/PreferencesStep.tsx` (add credit score field)
- Update `src/lib/calculations/solar.ts` (credit score APR adjustment)
- `tests/credit-score.test.ts` (20 tests)

---

### Phase 4.5: Dashboard Enhancements (8 hours)
**Goal:** Advanced lead management & search

**Deliverables:**
- [ ] Full-text search (address, name, email)
- [ ] Filter by date range
- [ ] Filter by lead score band (0-20, 20-40, etc.)
- [ ] Filter by system size range
- [ ] Filter by financing type
- [ ] Sort by ROI, score, system size
- [ ] Export leads to CSV
- [ ] Pagination (25/50/100 per page)
- [ ] Lead status tracking (new, contacted, quoted, won/lost)
- [ ] Tests covering all filters

**Key Features:**
```
Lead List Columns:
- Date (sortable)
- Customer Name (searchable)
- Email (searchable)
- Phone (searchable)
- Address (searchable)
- System Size (kW) - sortable, filterable
- Est. ROI (%) - sortable
- Lead Score - sortable, filterable
- Status - filterable
- Actions (view details, email, export)

Filters:
- Date Range: [Start] - [End]
- Score: 0-20 / 20-40 / 40-60 / 60-80 / 80-100
- System Size: $[Min] - [Max] kW
- Financing: Cash / Loan / Lease / PPA
- Status: New / Contacted / Quoted / Won / Lost
- Search: Free-text across name, email, address

Export:
- CSV format with all columns
- PDF summary report
```

**Files to Create:**
- Update `src/app/dashboard/page.tsx` (search + filters UI)
- Update `src/components/dashboard/LeadsList.tsx` (filtering logic)
- `src/components/dashboard/LeadFilters.tsx` (filter component)
- `src/components/dashboard/LeadExport.tsx` (export component)
- `tests/dashboard.test.ts` (35 tests)

**Database Changes:**
- Add `lead_status` enum column to leads table
- Add indexes for search performance

---

### Phase 4.6: Testing & Documentation (10 hours)
**Goal:** Comprehensive test coverage + guides

**Deliverables:**
- [ ] Unit tests for all new calculations (150+ tests)
- [ ] Integration tests for full flows with new features
- [ ] Dashboard filter tests
- [ ] Tax credit tests (all 50 states)
- [ ] Incentive lookup tests
- [ ] Financing rules tests
- [ ] Component tests for new UI features
- [ ] Create PHASE4_IMPLEMENTATION.md (500+ lines)
- [ ] Update all existing test assertions
- [ ] Run full suite: target 200+ passing tests

**Test Breakdown:**
```
tax-credits.test.ts          50 tests
incentives.test.ts           30 tests
financing-rules.test.ts      40 tests
credit-score.test.ts         20 tests
dashboard.test.ts            35 tests
integration-phase4.test.ts   25 tests
────────────────────────────────────
TOTAL NEW              ~200 tests
EXISTING (Phase 3)      125 tests
────────────────────────────────────
GRAND TOTAL             325 tests ✅
```

**Documentation:**
- Tax credits calculation guide (all formulas)
- State-by-state incentives reference
- Financing availability matrix
- Credit score impact chart
- Dashboard filter usage guide

---

## 📊 Phase 4 File Structure

```
src/
├── lib/
│   ├── calculations/
│   │   ├── tax-credits.ts (NEW)
│   │   ├── incentives.ts (NEW)
│   │   ├── financing-rules.ts (NEW)
│   │   └── solar.ts (UPDATED - add credit score)
│   └── supabase/
│       └── incentives-data.sql (NEW)
├── components/
│   ├── calculator/
│   │   └── steps/
│   │       └── PreferencesStep.tsx (UPDATED - add credit score field)
│   └── dashboard/
│       ├── LeadFilters.tsx (NEW)
│       ├── LeadExport.tsx (NEW)
│       └── LeadsList.tsx (UPDATED)
├── app/
│   ├── api/
│   │   ├── tax-credits/ (NEW - endpoints)
│   │   ├── incentives/ (NEW - endpoints)
│   │   └── leads/export (NEW - CSV export)
│   └── dashboard/page.tsx (UPDATED)
types/
├── tax-credits.ts (NEW)
├── incentives.ts (NEW)
└── financing-rules.ts (NEW)
tests/
├── tax-credits.test.ts (NEW)
├── incentives.test.ts (NEW)
├── financing-rules.test.ts (NEW)
├── credit-score.test.ts (NEW)
├── dashboard.test.ts (NEW)
└── integration-phase4.test.ts (NEW)
```

---

## 🗄️ Database Schema Changes

### New Tables

**incentives**
```sql
CREATE TABLE incentives (
  id BIGSERIAL PRIMARY KEY,
  state VARCHAR(2) NOT NULL,
  utility_name VARCHAR(255),
  incentive_type VARCHAR(100),
  name VARCHAR(255) NOT NULL,
  amount DECIMAL(10, 2),
  unit VARCHAR(50),
  max_amount DECIMAL(10, 2),
  description TEXT,
  start_date DATE,
  end_date DATE,
  eligible_system_sizes JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(state, utility_name, name)
);
```

**financing_availability**
```sql
CREATE TABLE financing_availability (
  id BIGSERIAL PRIMARY KEY,
  state VARCHAR(2) NOT NULL,
  financing_type VARCHAR(50) NOT NULL,
  min_credit_score INT,
  available BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(state, financing_type)
);
```

**leads (ADD COLUMNS)**
```sql
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS lead_status VARCHAR(50) DEFAULT 'new',
ADD COLUMN IF NOT EXISTS credit_score INT,
ADD COLUMN IF NOT EXISTS financing_type VARCHAR(50);

CREATE INDEX idx_leads_status ON leads(lead_status);
CREATE INDEX idx_leads_score ON leads(credit_score);
```

---

## 🚀 Implementation Sequence

### Week 1 (Mon-Fri)
- **Mon-Tue:** Phase 4.1 - Tax Credits
- **Wed:** Phase 4.2 - Incentives (partial)
- **Thu-Fri:** Phase 4.2 - Incentives (complete)

### Week 2 (Mon-Fri)
- **Mon-Tue:** Phase 4.3 - Financing Rules
- **Wed:** Phase 4.4 - Credit Score
- **Thu-Fri:** Phase 4.5 - Dashboard (partial)

### Week 3 (Mon-Wed)
- **Mon-Tue:** Phase 4.5 - Dashboard (complete)
- **Wed:** Phase 4.6 - Testing
- **Thu-Fri:** Phase 4.6 - Documentation + Final Testing

---

## ✅ Success Criteria for Phase 4

- ✅ Federal ITC (30%) implemented for all states
- ✅ State-specific tax credits (50 states covered)
- ✅ Incentives database populated (500+ incentive records)
- ✅ Financing availability matrix (4 types × 50 states)
- ✅ Credit score integration (300-850 range)
- ✅ Dashboard filters functional (search, date, score, size)
- ✅ CSV export working
- ✅ 200+ new tests passing
- ✅ Production build: 0 errors
- ✅ All calculations accurate per state/credit
- ✅ Complete documentation with examples

---

## 📈 Impact on Results

### Before Phase 4 (Phase 3)
```
System: 8 kW, CO, $22,000 cost
Results show:
- Cash: $22,000 up front
- Loan: $4,400 + $295/month @ 6.5%
- Lease: $0 + $160/month
- PPA: $0 + $0.10/kWh
```

### After Phase 4
```
System: 8 kW, CO, $22,000 cost
Credit Score: 720
Results show:
- Tax Credit: -$6,600 (30% federal)
- State Incentive: -$2,000 (CO program)
- NET COST: $13,400
Results show:
- Cash: $13,400 up front
- Loan: $2,680 + $177/month @ 6.0% (premium rate)
- Lease: NOT AVAILABLE (CO not supported)
- PPA: NOT AVAILABLE (CO not supported)
- Lead Score: 85/100 (+15 for great incentives)
```

**Net Benefit:** -$8,600 (39% savings from incentives)

---

## 🔄 Integration Points

- **Calculator → Results:** Pass credit score to calculations
- **Results → Lead:** Include credit score in lead record
- **Lead Email:** Include tax credit/incentive summary
- **Dashboard:** Filter/sort by credit score, financing type
- **PDF Export:** Include tax credit breakdown

---

## 📚 Resources Needed

- **DSIRE Database:** State incentive lookup (dsireusa.org)
- **IRS Website:** Federal ITC rules & schedules
- **State Tax Board:** State-specific credit caps
- **Financing Data:** Loan availability by state (public)
- **EnergySage API:** Incentive data (if available)

---

## 🎯 Ready to Start?

**Phase 4.1 begins immediately:**
1. Create types/tax-credits.ts
2. Create src/lib/calculations/tax-credits.ts (Federal 30% + state lookup)
3. Integrate into results page
4. Write 50 state tests
5. Deploy + verify

**Estimated time to Phase 4.1 complete:** 8-10 hours

---

**PHASE 4 Status: READY TO BEGIN** ✅
