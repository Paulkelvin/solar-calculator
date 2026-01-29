# Solar ROI Calculator — Phase 1 Development Instructions

You are an expert full-stack developer tasked with building **Phase 1** of a solar ROI calculator SaaS app for solar installers. The focus is to establish the **project foundation, multi-step calculator UI, Supabase schema, mock calculation pipeline, and minimal dashboards** with clear paths for extending functionality in Phases 2–5.

## 1. Tech Stack & Tools

- **Next.js 14 App Router + TypeScript** (project bootstrapped in `src/`)
- **Tailwind CSS + shadcn/ui** for styling
- **Supabase** for database & backend
- **Vercel Blob Storage** for PDF uploads (Phase 2+)
- **Vitest** as the test runner
- **Lightweight unit tests only** in Phase 1 (Zod schemas + calculation stubs)
- **No CI** yet — defer until Phases 2–3

## 2. Database & RLS (Phase 1 scope)

- Tables: `installers`, `leads`, `utility_rates`, `incentives`, `activity_log`
- Minimal RLS enforced: **internal-use only**, single-tenant
- Include a **default installer** via `DEFAULT_INSTALLER_ID` (leads and activity records)
- Keep per-installer scoping for later phases (with auth)

## 3. Multi-Step Calculator (Phase 1)

- **Steps:** Address → Usage → Roof → Preferences → Contact
- Address autocomplete: **defer Google Places to Phase 2**, structure form to allow drop-in later
- Usage: Monthly bill or kWh input; estimate annual consumption
- Roof: manual input if Google Solar unavailable
- Preferences: battery, financing choice, timeline, notes
- Contact: name, email, phone
- Include **progress indicator**, Prev/Next buttons, validation, mobile responsiveness, and basic error/loading states

## 4. Phase 1 Calculation Engine

- Mock calculation logic lives in `src/lib/calculations/` (API route only orchestrates)
- Mock outputs should be **preliminary but realistically shaped** for:
  - System size
  - Estimated annual production
  - Cash + Loan financing card data (2 cards only)
  - Basic environmental metrics (CO₂ offset, trees equivalent)
- **Lead scoring**: use stubbed formula with same schema
- **Logging minimal activity** (`form_submitted`, `results_viewed`) in `src/lib/supabase/queries.ts`
- No real API calls yet; fallbacks or hardcoded mock data acceptable

## 5. Results Page (Phase 1)

- Show **reduced mock subset**:
  - 2 financing cards (Cash + Loan)
  - Basic environmental metrics
- Clearly label data as **mocked/estimates**
- Prepare UI and component structure for future 4-card layout and full metrics in Phases 2–3

## 6. Leads Dashboard (Phase 1)

- Minimal internal leads list: `src/app/dashboard/page.tsx`
- Read-only
- Supports **basic sorting by date and mock lead score**
- No filtering/search yet; defer richer features to later phases

## 7. Testing (Phase 1)

- Vitest unit tests only for:
  - Zod schema validation (happy path + invalid inputs)
  - Calculation stubs (mocked outputs with correct shape)
- **No component tests** yet
- Full calculation & API integration tests deferred to Phases 2–3
- CI deferred until testing expands

## 8. Project Structure (summary for Phase 1)

- `src/app/` → pages & API routes
- `src/components/calculator/` → form steps, progress bar
- `src/components/results/` → mock results components
- `src/components/dashboard/` → minimal LeadsList
- `src/lib/calculations/` → stub calculation logic
- `src/lib/supabase/queries.ts` → minimal activity logging
- `src/lib/utils.ts` → shared helpers
- `types/` → TypeScript types for leads, calculations, financing

## 9. Phase 1 Constraints / Decisions

1. Installer auth: **defer until later phases**
2. RLS: **basic internal enforcement only**
3. Address autocomplete: **defer to Phase 2**
4. Mocked calculations: **abstract into lib/calculations** now
5. Results page: **show 2 financing cards + basic env metrics**, mock
6. Leads dashboard: **minimal list with date/score sorting only**
7. Vitest tests: **Zod schemas + calculation stubs only**
8. CI: **defer**
9. Default installer: **include `DEFAULT_INSTALLER_ID`** in leads and activity records

## 10. Phase 1 Goals / Success Criteria

- ✅ Next.js + TypeScript project bootstrapped with App Router
- ✅ Tailwind + shadcn/ui installed and theme configured
- ✅ Multi-step calculator form working with validation and progress
- ✅ Mock calculation engine producing realistic test outputs
- ✅ Results page UI displays reduced mock data
- ✅ Minimal internal leads list functional and sortable
- ✅ Lightweight Vitest unit tests pass
- ✅ Data contracts (types + shapes) established for smooth Phase 2–3 integration

## Development & Testing

### Run Dev Server
```bash
npm run dev
```
Open http://localhost:3000 in your browser.

### Build for Production
```bash
npm run build
npm start
```

### Run Tests
```bash
npm run test
```

## Environment Setup

1. Copy `.env.example` to `.env.local`
2. Fill in Supabase credentials (mock values provided for development)
3. Supabase integration is stubbed; enable by uncommenting queries in `src/lib/supabase/queries.ts` when ready

## Key Implementation Notes

- All calculation logic is mocked but shaped realistically for Phase 2 integration
- Component structure supports future expansion without breaking changes
- Leads and activity are logged but not persisted to Supabase yet (stubbed)
- Address autocomplete form structure in place; ready for Google Places API in Phase 2
- Financing calculations support future expansion to 4+ card layouts

