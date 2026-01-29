# Solar ROI Calculator — Phase 1

A Next.js + TypeScript SaaS application for solar installers to calculate ROI and manage leads.

## Phase 1 Features

- **Multi-Step Calculator**: Address → Usage → Roof → Preferences → Contact
- **Mock Calculation Engine**: Realistic solar sizing, production, and financing estimates
- **Results Page**: 2 financing cards (Cash + Loan) + environmental metrics
- **Leads Dashboard**: Minimal read-only list with date/score sorting
- **Vitest Unit Tests**: Schema validation + calculation stubs

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Zod (validation)
- Supabase (database hooks)
- Vitest (testing)

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Calculator
- Visit `/` to access the multi-step solar calculator
- Fill out all steps and submit to see mock results

### Dashboard
- Visit `/dashboard` to view the leads list (currently empty in Phase 1)

## Testing

```bash
npm run test
```

Runs Vitest unit tests for Zod schemas and calculation stubs.

## Build

```bash
npm run build
npm start
```

## Environment

Copy `.env.example` to `.env.local` and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

**Note:** Supabase integration is stubbed in Phase 1. Enable when ready by uncommenting queries in `src/lib/supabase/queries.ts`.

## Phase 1 Constraints

- No installer authentication (defer to later phases)
- RLS: basic internal enforcement only
- Address autocomplete: deferred to Phase 2
- Calculations: mocked but realistically shaped
- Leads dashboard: minimal, read-only
- CI/CD: deferred

## Project Structure

```
src/
  app/              # Pages & API routes
  components/
    calculator/     # Multi-step wizard + steps
    results/        # Results display
    dashboard/      # Leads list
    ui/             # Reusable UI components
  lib/
    calculations/   # Mock solar calculation logic
    supabase/       # Database queries (stubbed)
    utils.ts        # Shared helpers
types/              # TypeScript types & schemas
tests/              # Vitest unit tests
```

## Next Steps (Phase 2–3)

1. Enable full Supabase integration + RLS
2. Implement Google Places address autocomplete
3. Add satellite imagery for roof detection
4. Expand financing to 4 cards + incentive calculations
5. PDF proposal generation
6. Installer authentication & per-installer lead scoping
7. Advanced dashboard features (search, filtering, analytics)
8. CI/CD pipeline
