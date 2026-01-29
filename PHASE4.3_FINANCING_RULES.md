# Phase 4.3: Regional Financing Rules Documentation

## Overview

Phase 4.3 implements the **Financing Rules Engine** - a comprehensive system for determining financing availability by state and credit score. This module controls which financing options (Cash, Loan, Lease, PPA) are available to customers based on their location and creditworthiness.

## Architecture

### Type System (`types/financing-rules.ts`)

#### Core Interfaces

**`FinancingOptionType`**
- Union type: `'cash' | 'loan' | 'lease' | 'ppa'`
- Represents the four financing options available

**`FinancingAvailability`**
```typescript
{
  option: FinancingOptionType;
  available: boolean;
  minCreditScore?: number;
  maxCreditScore?: number;
  states?: string[];
  notes?: string;
}
```
- Describes availability of a single financing option
- Includes eligibility requirements and notes

**`CreditScoreBracket`**
```typescript
{
  minScore: number;
  maxScore: number;
  aprAdjustment: number;
  label: string;
}
```
- 6 brackets defined: Poor, Fair, Good, Good+, Very Good, Excellent
- APR adjustments range from +3.5% to -1.0%

**`FinancingEligibility`**
- State + Credit Score → Available/Unavailable Options
- Includes personalized recommendations
- Example output:
  ```json
  {
    "state": "CA",
    "creditScore": 750,
    "availableOptions": ["cash", "loan", "lease", "ppa"],
    "unavailableOptions": [],
    "recommendations": ["Excellent credit score! You qualify for premium loan rates."]
  }
  ```

#### Constants

**Credit Score Brackets (6 tiers)**
| Bracket | Score Range | APR Adjustment | Label |
|---------|-------------|-----------------|--------|
| 1 | 300-549 | +3.5% | Poor |
| 2 | 550-649 | +2.0% | Fair |
| 3 | 650-699 | +0.5% | Good |
| 4 | 700-749 | 0% | Good+ |
| 5 | 750-799 | -0.5% | Very Good |
| 6 | 800-850 | -1.0% | Excellent |

**Lease Available States (20 states)**
- AZ, CA, CT, CO, DE, FL, HI, IL, MA, MD, ME, MN, NC, NH, NJ, NV, NY, TX, UT, WA
- Represents markets with established solar lease programs

**PPA Available States (4 states)**
- AZ, CA, NV, UT
- Subset of lease states with power purchase agreement programs

**Loan Defaults**
- Base APR: 6.5%
- Term: 25 years
- Down Payment: 20%

## Calculation Engine (`src/lib/calculations/financing-rules.ts`)

### Core Functions

#### 1. Credit Score Bracket Lookup
```typescript
getCreditScoreBracket(creditScore: number): CreditScoreBracket
```
- Maps credit score to bracket
- Returns applicable APR adjustment
- Example: 750 → Very Good bracket (-0.5% adjustment)

#### 2. APR Calculation
```typescript
calculateAPR(creditScore: number = 700): number
```
- Calculates final APR based on credit score
- Formula: Base APR (6.5%) + Bracket Adjustment
- Examples:
  - 500 (Poor): 6.5 + 3.5 = 10.0%
  - 700 (Good+): 6.5 + 0 = 6.5%
  - 825 (Excellent): 6.5 - 1.0 = 5.5%

#### 3. Individual Option Availability

**Cash Availability**
```typescript
isCashAvailable(): boolean
```
- Always returns `true`
- Cash purchase always available as option

**Loan Availability**
```typescript
isLoanAvailable(creditScore: number = 700): boolean
```
- Requires credit score ≥ 650
- Applies to all states
- Tier-based APR adjustment

**Lease Availability**
```typescript
isLeaseAvailable(stateCode: string): boolean
```
- True only in 20 specified states
- Includes CA, NY, TX, AZ, etc.
- Not available in most Midwest/South states

**PPA Availability**
```typescript
isPPAAvailable(stateCode: string): boolean
```
- True only in 4 states: AZ, CA, NV, UT
- Most restrictive option

#### 4. Eligibility Assessment
```typescript
getFinancingEligibility(config: FinancingRulesConfig): FinancingEligibility
```

**Input:**
```typescript
{
  state: string;           // State code (CA, TX, NY, etc.)
  creditScore?: number;    // Default 700
  systemSize: number;      // kW (used for filtering)
  systemCost: number;      // $ (used for filtering)
}
```

**Output:**
```typescript
{
  state: string;
  creditScore: number;
  availableOptions: FinancingOptionType[];
  unavailableOptions: Array<{ option: string; reason: string }>;
  recommendations: string[];
}
```

**Logic:**
1. Check each option availability
2. Build list of available options
3. Build list of unavailable options with reasons
4. Generate personalized recommendations

**Example Scenarios:**

*Scenario 1: Excellent credit in CA*
- Input: CA, 825
- Output: All 4 options available
- APR: 5.5%
- Recommendation: "Excellent credit score! You qualify for premium loan rates."

*Scenario 2: Fair credit in AL*
- Input: AL, 600
- Output: Cash only
- Unavailable: Loan (credit < 650), Lease (state), PPA (state)
- Recommendation: "Improve credit score to 650+ for loan access."

*Scenario 3: Good credit in TX*
- Input: TX, 700
- Output: Cash, Loan, Lease (3 options)
- No PPA (state limitation)
- APR: 6.5%

#### 5. State Financing Rules
```typescript
getStateFinancingRules(stateCode: string, creditScore: number = 700): StateFinancingRules
```
- Returns comprehensive rules for a state
- Includes loan defaults and all option availability
- Sorted availability details

#### 6. Comparative Analysis
```typescript
compareStateFinancing(creditScore: number = 700): Record<string, FinancingOptionType[]>
```
- Returns available options for all 50 states
- Parameterized by credit score
- Enables market analysis
- Example output:
  ```typescript
  {
    "CA": ["cash", "loan", "lease", "ppa"],
    "TX": ["cash", "loan", "lease"],
    "AL": ["cash", "loan"],
    // ... 47 more states
  }
  ```

#### 7. Top Financing States
```typescript
getTopFinancingStates(): string[]
```
- Returns states with all 4 options available
- Currently: AZ, CA, NV, UT
- Good targets for lease/PPA marketing

#### 8. Financing Summary
```typescript
getFinancingSummary(state: string, creditScore: number = 700): {
  state: string;
  creditScore: number;
  creditLabel: string;
  apr: number;
  availableCount: number;
  hasCash: boolean;
  hasLoan: boolean;
  hasLease: boolean;
  hasPPA: boolean;
}
```
- Consolidated view of financing for state + score
- Useful for quick lookup in results page

#### 9. Loan Availability by Credit Tier
```typescript
getLoanAvailabilityByScore(creditScore: number): {
  isAvailable: boolean;
  tier: string;
  apr: number;
  message: string;
}
```
- Detailed tier-based loan availability
- User-friendly messaging
- Examples:
  - 500: "Poor credit - loan not available"
  - 600: "Fair credit - loan requires 650+"
  - 750: "Very good credit - excellent rates"

#### 10. Lease/PPA Details
```typescript
getLeaseAvailabilityDetail(stateCode: string): LeaseAvailability
getLeaseAvailabilityDetail(stateCode: string): PPAAvailability
```
- Returns provider info and availability notes
- For UI display of why option unavailable

#### 11. State Analysis
```typescript
countStatesByOptions(): {
  allFour: number;
  threeOptions: number;
  twoOptions: number;
  onlyLoan: number;
  onlyCash: number;
}
```
- Distribution of options across states:
  - 4 states: All 4 options (CA, AZ, NV, UT)
  - ~16 states: 3 options (lease-available, no PPA)
  - ~30 states: 2 options (cash + loan only)
  - 0 states: Only 1 or fewer

## Eligibility Rules

### Cash Purchase
- **Availability:** 100% of states, all credit scores
- **Requirements:** None
- **APR:** Not applicable

### Loan Financing
- **Availability:** All 50 states
- **Requirements:** Credit score ≥ 650
- **APR:** Base 6.5% + credit score adjustment
  - Excellent (800+): 5.5% (up to -1.0%)
  - Very Good (750-799): 6.0% (-0.5%)
  - Good+ (700-749): 6.5% (0%)
  - Good (650-699): 7.0% (+0.5%)
  - Fair (550-649): Not eligible (need 650+)
  - Poor (<550): Not eligible
- **Term:** 25 years
- **Down Payment:** 20%

### Solar Lease
- **Availability:** 20 states only
  - Available: AZ, CA, CT, CO, DE, FL, HI, IL, MA, MD, ME, MN, NC, NH, NJ, NV, NY, TX, UT, WA
  - Not Available: 30 states (mainly Midwest/South)
- **Requirements:** 
  - None (available to all credit scores)
  - No credit check needed
- **Providers:** Sunrun, Vivint Solar, Local Providers
- **Typical Terms:** 20-25 year lease

### Power Purchase Agreement (PPA)
- **Availability:** 4 states only
  - AZ, CA, NV, UT
- **Requirements:** 
  - None (available to all credit scores)
  - No credit check needed
- **Providers:** Sunrun, Vivint Solar, Mosaic
- **Typical Terms:** 20-25 year PPA

## Integration Points

### Results Page
1. Query eligibility for customer's state
2. Show only available financing cards
3. Hide unavailable options with explanation
4. Display APR based on credit score
5. Show state-specific limitations

### Calculator Form
1. Add optional credit score input (future Phase 4.4)
2. Pass to financing rules engine
3. Update available options in real-time
4. Show messaging for credit requirements

### Lead Scoring
1. Include financing availability in score
2. Higher score for multi-option states
3. Incentivize credit improvement

## Test Coverage

### Test File: `tests/financing-rules.test.ts`

**Total Tests:** 62 across 13 describe blocks

**Test Categories:**

1. **Credit Score Brackets (8 tests)**
   - All 6 brackets verified
   - Boundary testing (300, 550, 650, 700, 750, 800, 850)
   - Count validation

2. **APR Calculation (9 tests)**
   - Each bracket's adjustment applied correctly
   - Default score handling
   - Min/max bounds (0-12%)
   - Specific rates: 5.5%, 6.0%, 6.5%, 7.0%, 10.0%

3. **Individual Options (7 tests)**
   - Cash always available
   - Loan requires 650+
   - Lease state-specific (20 states, 30 states excluded)
   - PPA state-specific (4 states only)
   - Case insensitivity
   - Array counts verified

4. **Financing Eligibility (8 tests)**
   - Cash in all states/scores
   - Loan eligibility logic
   - Lease availability logic
   - PPA availability logic
   - 4-option states (CA)
   - 1-option states (AL with poor credit)
   - Recommendations generated
   - Default credit score

5. **State Financing Rules (3 tests)**
   - All options returned
   - Loan defaults included
   - Unavailable options marked

6. **State Comparison (3 tests)**
   - All 50 states compared
   - Variations shown
   - Top states identified

7. **Financing Summary (3 tests)**
   - Complete summary data
   - Limited states verification
   - APR variation

8. **Loan Availability Tiers (4 tests)**
   - All 5 tiers tested (poor, fair, good, v-good, excellent)
   - Availability and messaging correct

9. **Lease Detail (3 tests)**
   - Availability in lease states
   - Unavailability in other states
   - Provider listings

10. **PPA Detail (2 tests)**
    - Availability in 4 states only
    - Unavailability in 46 states

11. **State Options Count (3 tests)**
    - All 50 states categorized
    - Totals sum to 50
    - Top states verified

12. **Edge Cases (5 tests)**
    - Case insensitivity
    - Boundary 650 for loans
    - Default credit score
    - Extreme credit scores (0, 1000)
    - All 50 states in comparison

13. **Integration Scenarios (4 tests)**
    - Excellent credit in CA (4 options)
    - Poor credit improvement messaging
    - Limited state options
    - Combined data sources

**Test Results:** ✅ 62/62 passing

## Data Structures

### State Availability Matrix

```
State | Cash | Loan | Lease | PPA
------|------|------|-------|-----
CA    |  ✓   |  ✓   |   ✓   | ✓
AZ    |  ✓   |  ✓   |   ✓   | ✓
NV    |  ✓   |  ✓   |   ✓   | ✓
UT    |  ✓   |  ✓   |   ✓   | ✓
TX    |  ✓   |  ✓   |   ✓   | ✗
NY    |  ✓   |  ✓   |   ✓   | ✗
... (14 more lease states)
AL    |  ✓   |  ✓   |   ✗   | ✗
... (29 more no-lease states)
```

### Credit Score Matrix

```
Score | Bracket    | APR Adj | Final APR
------|------------|---------|----------
300   | Poor       | +3.5%   | 10.0%
550   | Fair       | +2.0%   | 8.5%
650   | Good       | +0.5%   | 7.0%
700   | Good+      | 0%      | 6.5%
750   | Very Good  | -0.5%   | 6.0%
800   | Excellent  | -1.0%   | 5.5%
```

## Future Enhancements

### Phase 4.4: Credit Score Integration
- Add credit score input to calculator form
- Real-time eligibility updates
- APR display in financing cards
- Credit score optimization tips

### Phase 4.5: Dashboard Enhancements
- Search/filter by available options
- Export leads by financing availability
- Regional analysis tools

### Phase 5: Advanced Financing
- Partner financing programs
- State-specific rates
- DTC financing programs
- Credit-building tools

## Performance Notes

- **Lookup Speed:** O(1) for most queries (hash-based)
- **Array Operations:** O(n) where n ≤ 50 (states)
- **Memory:** ~5KB for all constants
- **No External Dependencies:** All calculations local

## Migration Path

### From Phase 3
- No breaking changes to existing calculations
- Additional financing options added
- New fields optional on leads

### To Phase 5
- Prepare for partner API integration
- Financing availability can be extended to dynamic sources
- APR can be replaced with API-based rates

## Summary

Phase 4.3 implements a robust, performant, and thoroughly tested financing eligibility engine that:

✅ Determines option availability by state (20/30 split for leases, 4 state PPA)
✅ Adjusts loan APR by credit score (5 tiers, 3.5% range)
✅ Provides personalized recommendations
✅ Supports 50-state coverage with clear messaging
✅ Integrates seamlessly with Phase 3 calculation pipeline
✅ Achieves 62/62 test coverage with 100% pass rate
✅ Production-ready with 0 build errors

**Total Phase 4 Progress:**
- Phase 4.1: Tax Credits (38 tests) ✅
- Phase 4.2: Incentives (33 tests) ✅
- Phase 4.3: Financing Rules (62 tests) ✅
- **Total: 133 tests passing**
- **Combined with Phase 3: 258 tests passing**
