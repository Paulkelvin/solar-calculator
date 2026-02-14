# Solar ROI Calculator

A production-grade Next.js + TypeScript SaaS application for solar installers to calculate ROI, manage leads, and generate professional solar proposals.

## Features

### Calculator (Multi-Step Wizard)
- **Address** — Google Places autocomplete with instant Solar Score teaser
- **Usage** — Monthly bill or kWh input with live debounced estimates
- **Roof** — Manual input + Google Solar API pre-population, interactive sliders
- **Preferences** — Battery interest, financing preference, timeline, notes
- **Contact** — Name, email, phone with Zod validation
- **System Design** — 3-option system size selector with real-time cost updates

### Results & Proposals
- **3 Financing Cards** — Cash, Loan, Lease with feature lists and ROI projections
- **Roof Satellite Imagery** — Google Static Maps with solar heatmap overlay
- **Solar Potential Analysis** — Roof area, sun exposure, shading, confidence score
- **25-Year Cash Flow Projections** — Interactive chart with all financing scenarios
- **Environmental Impact** — CO₂ offset, trees equivalent, grid independence
- **Bill Offset & Environmental Charts** — Side-by-side visual reinforcement
- **PDF Proposal Generation** — Professional downloadable solar proposals

### Dashboard (Installer Portal)
- **Leads Management** — Sortable leads list with lead scoring
- **Analytics** — Lead conversion metrics and pipeline visualization
- **Settings** — Installer profile and company configuration
- **Authentication** — Email/password signup, login, password reset

### Calculation Engine
- **50-State Tax Credits** — State-specific incentive database with eligibility checks
- **4-Option Financing** — Cash, Loan, Lease, PPA with credit-tier interest rates
- **Credit Score Integration** — 6 brackets affecting financing availability and APR
- **Google Solar API** — Real satellite data with comprehensive fallback system
- **OpenEI Utility Rates** — Real utility rate lookups by location

## Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| State | Zustand |
| Database | Supabase (PostgreSQL + Auth) |
| Validation | Zod |
| Charts | Recharts |
| PDF | jsPDF |
| Testing | Vitest (404 tests) |
| Maps | Leaflet + Google Static Maps |

## Getting Started

### Installation

```bash
npm install
```

### Environment Setup

Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anonymous key
- `GOOGLE_MAPS_API_KEY` — Google Maps/Places/Solar API key
- `NEXT_PUBLIC_APP_URL` — App URL (default: `http://localhost:3000`)

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
npm run build
npm start
```

### Testing

```bash
npm run test
```

Runs 404 Vitest unit tests covering schemas, calculations, tax credits, financing rules, credit score integration, incentives, auth, email, API fallbacks, dashboard utilities, and edge cases.

## Project Structure

```
src/
  app/                    # Pages & API routes
    api/                  # REST endpoints (solar, PDF, email, utility rates)
    auth/                 # Login, signup, password reset pages
    dashboard/            # Leads, analytics, settings (protected)
  components/
    calculator/           # Multi-step wizard + form steps
    results/              # Results display, charts, system design
    dashboard/            # Leads list, activity log
    auth/                 # Protected route wrapper
    providers/            # Client layout wrapper (SSR boundary)
    ui/                   # Reusable shadcn/ui components
    utility/              # Quick calculator widget
  contexts/               # Auth context (single source of truth)
  hooks/                  # Custom hooks (installer profile, solar data)
  lib/
    calculations/         # Solar sizing, tax credits, financing, incentives
    supabase/             # Database client, auth, lead service, queries
    apis/                 # Google Solar, DSIRE, utility rates, email stubs
    email/                # Email templates
  store/                  # Zustand calculator store
types/                    # TypeScript types & Zod schemas
tests/                    # Vitest unit tests (404 tests)
```

## API Routes

| Route | Purpose |
|-------|---------|
| `POST /api/google-solar` | Google Solar API proxy |
| `GET /api/google/places/autocomplete` | Address autocomplete |
| `GET /api/google/places/details` | Place details |
| `GET /api/pvwatts` | PVWatts production estimates |
| `GET /api/openei` | OpenEI utility rates |
| `POST /api/pdf/generate` | PDF proposal generation |
| `POST /api/email/send-customer` | Customer notification |
| `POST /api/email/send-installer` | Installer notification |

## License

Private — All rights reserved.
