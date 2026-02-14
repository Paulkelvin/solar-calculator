# Quick Start Guide - Phase 2 Features

## 🚀 Setup Instructions

### 1. Environment Variables
Already configured in `.env.local`:
```bash
# NREL PVWatts API
NREL_API_KEY=DEMO_KEY  # Replace with real key from https://developer.nrel.gov/signup/
```

### 2. Install Dependencies
All required packages already installed:
- ✅ `recharts` - Charts library
- ✅ `leaflet` + `react-leaflet` - Maps
- ✅ `zustand` - State management

### 3. Database Setup

#### A. Enable RLS Policies
Run in Supabase SQL Editor:
```bash
# Copy contents of SUPABASE_RLS_ENABLE.sql
# Paste into Supabase SQL Editor → Run
```

#### B. Populate US Incentives
Run in Supabase SQL Editor:
```bash
# Copy contents of US_INCENTIVES_SEED.sql
# Paste into Supabase SQL Editor → Run
```

### 4. Start Development Server
```bash
npm run dev
```
Open http://localhost:3000

---

## 🧭 Feature Tour

### Calculator Flow

**1. Address Step**
- Enter address → Google Places autocomplete
- Select address → Solar Score teaser appears (0-100)
- Shows peak sun hours, percentile ranking, savings range
- Background: Generates mock roof segments for map

**2. Usage Step**
- Enter monthly bill OR kWh
- **NEW:** Live Production Preview card shows:
  - Annual kWh estimate
  - Bill offset %
  - Annual savings
  - Monthly breakdown chart (Recharts bar chart)
- Data source: NREL PVWatts API (or fallback)
- Battery suggestion appears if usage > $200/month

**3. Roof Step**
- **NEW:** Interactive satellite map (Leaflet)
  - Color-coded roof segments (green = high solar potential)
  - Click segment → updates tilt/azimuth/area sliders
  - Legend shows solar potential scale
- Manual sliders for roof area, tilt, direction
- Shading warning if >30% detected

**4. Preferences**
- Battery toggle
- Financing type (cash, loan, lease, PPA)
- Timeline
- Notes

**5. Contact**
- Name, email, phone

**6. Results Page**
- System overview (size, production)
- Satellite map with roof imagery
- **NEW:** 25-Year Cash Flow Chart (Recharts)
  - Shows 4 financing options
  - Accounts for rate escalation + degradation
  - Displays payback years
- **NEW:** Bill Offset Pie Chart
  - Solar vs grid power breakdown
- **NEW:** Environmental Impact Pie Chart
  - CO₂ offset, trees equivalent
- **NEW:** What-If Sliders
  - Adjust rate escalation (2-6%)
  - Add battery (5-20 kWh)
  - Change degradation (0.3-1%)
  - Real-time savings update
- **NEW:** Save to Dashboard button
  - Persists lead to Supabase
  - Logs activity
  - Shows confirmation

---

## 📊 US Incentives by State

| State | Rebate | Net Metering | Leasing/PPA Savings | Avg Rate |
|-------|--------|--------------|---------------------|----------|
| CA | SGIP ($0.15/W) | NEM 3.0 (75% retail) | 20% | $0.28/kWh |
| TX | None | Wholesale buyback | 15% | $0.12/kWh |
| FL | Property tax exemption | Full retail | 18% | $0.13/kWh |
| NY | NY-Sun ($0.40/W) | VDER retail | 22% | $0.20/kWh |
| AZ | APS ($0.10/W) | Variable export | 25% | $0.13/kWh |
| MA | SMART ($0.30/W) | Full retail | 24% | $0.24/kWh |
| NJ | SREC-II | Full retail | 23% | $0.17/kWh |
| CO | Xcel ($0.08/W) | Full retail | 18% | $0.13/kWh |
| NC | None | Variable | 16% | $0.11/kWh |
| NV | None | Full retail | 20% | $0.12/kWh |

**Note:** Federal ITC expired for new homeowner installs after 2025. Leasing/PPAs popular because installers claim credits and pass 20-30% savings to homeowners.

---

## 🗺️ Roof Map Usage

### How It Works:
1. User enters address → Google Places returns lat/lng
2. `generateMockRoofSegments()` creates 2-4 segments with realistic data
3. Map displays segments with color-coded overlay
4. User clicks segment → updates `selectedSegmentIndex` in state
5. RoofStep reads selected segment → updates sliders

### Future Integration:
Replace `generateMockRoofSegments()` with real Google Solar API data:
```typescript
// In AddressStep.tsx, replace:
const roofSegments = generateMockRoofSegments(...);

// With:
import { transformRoofSegments } from '../../../lib/google-solar-transformer';
const googleSolarData = await fetch('/api/google/solar', { lat, lng });
const roofSegments = transformRoofSegments(googleSolarData);
```

---

## 📈 NREL PVWatts API

### Endpoint:
`POST /api/pvwatts`

### Request Body:
```json
{
  "latitude": 37.7749,
  "longitude": -122.4194,
  "systemCapacity": 7.5,
  "tilt": 20,
  "azimuth": 180
}
```

### Response:
```json
{
  "success": true,
  "source": "nrel",
  "location": { "city": "San Francisco", "state": "CA" },
  "production": {
    "annual": 10500,
    "monthly": [850, 920, 1050, ...],
    "capacityFactor": 18.5
  },
  "savings": {
    "annual": 1575,
    "monthly": [127.5, 138, ...],
    "rate": 0.15
  },
  "system": {
    "capacity": 7.5,
    "tilt": 20,
    "azimuth": 180,
    "losses": 14
  }
}
```

### Fallback Logic:
If NREL API fails, uses formula:
```
peakSunHours = 4.5 * (1 + (35 - |latitude|) / 100)
annualProduction = systemCapacity × peakSunHours × 365 × 0.75
```

---

## 🎨 Component Structure

### New Components:
```
src/components/
├── calculator/
│   ├── RoofMap.tsx                    # Leaflet map with heatmap
│   ├── LiveProductionPreview.tsx       # PVWatts preview
│   └── steps/
│       ├── AddressStep.tsx             # Updated: roof segments
│       ├── UsageStep.tsx               # Updated: live preview
│       └── RoofStep.tsx                # Updated: map integration
├── results/
│   ├── CashFlowChart.tsx               # 25-year projections
│   ├── EnvironmentalCharts.tsx         # Pie charts (2)
│   ├── WhatIfSliders.tsx               # Interactive sliders
│   └── ResultsView.tsx                 # Updated: all charts
```

### Services:
```
src/lib/
├── pvwatts-service.ts                  # NREL API wrapper
├── google-solar-transformer.ts         # Roof segment utils
├── us-incentives-data.ts               # State database
└── supabase/
    └── lead-service.ts                 # CRUD + activity log
```

### API Routes:
```
src/app/api/
└── pvwatts/
    └── route.ts                        # NREL proxy
```

---

## 🧪 Testing Checklist

### Manual Testing:
- [ ] Address autocomplete works
- [ ] Solar score displays after address selection
- [ ] Live production preview updates with usage input
- [ ] Roof map renders with satellite tiles
- [ ] Click roof segment updates sliders
- [ ] All charts render on results page
- [ ] What-If sliders update calculations
- [ ] Save to Dashboard persists lead
- [ ] Activity log records events

### API Testing:
- [ ] `/api/pvwatts` returns valid data
- [ ] Fallback works when NREL API fails
- [ ] Google Places autocomplete works
- [ ] Google Places details returns coordinates

### Database Testing:
- [ ] RLS policies prevent unauthorized access
- [ ] Anonymous leads can be created
- [ ] Incentives are readable by public
- [ ] Activity log records timestamps

---

## 🐛 Troubleshooting

### Map Not Rendering:
- Check browser console for Leaflet errors
- Verify `react-leaflet` version compatibility
- Ensure `leaflet/dist/leaflet.css` is imported

### PVWatts API Error:
- Check `.env.local` has `NREL_API_KEY`
- Verify API route at `/api/pvwatts`
- Test with DEMO_KEY first (limited to 1000 requests/hour)
- Check fallback logic activates

### Charts Not Displaying:
- Verify `recharts` is installed
- Check `ResponsiveContainer` has height
- Ensure data array is valid
- Check browser console for errors

### Lead Not Saving:
- Check Supabase connection in `.env.local`
- Verify RLS policies are enabled
- Check `DEFAULT_INSTALLER_ID` exists in installers table
- View Supabase logs for errors

---

## 📚 Resources

### APIs:
- [NREL Developer Portal](https://developer.nrel.gov/)
- [Google Solar API Docs](https://developers.google.com/maps/documentation/solar)
- [Google Places API](https://developers.google.com/maps/documentation/places/web-service)

### Libraries:
- [Recharts Documentation](https://recharts.org/)
- [Leaflet Documentation](https://leafletjs.com/)
- [React Leaflet](https://react-leaflet.js.org/)
- [Zustand](https://zustand-demo.pmnd.rs/)

### Incentives:
- [DSIRE Database](https://www.dsireusa.org/)
- [Solar Energy Industries Association](https://www.seia.org/)

---

## ✅ Next Steps

1. **Get Real API Keys:**
   - NREL: https://developer.nrel.gov/signup/
   - Google Solar: Enable in Google Cloud Console

2. **Run SQL Scripts:**
   - Copy `SUPABASE_RLS_ENABLE.sql` → Supabase SQL Editor → Run
   - Copy `US_INCENTIVES_SEED.sql` → Supabase SQL Editor → Run

3. **Test Full Flow:**
   - npm run dev
   - Complete calculator from address to results
   - Verify all charts render
   - Test "Save to Dashboard"

4. **Add More States:**
   - Expand `us-incentives-data.ts`
   - Add entries for remaining 40 states
   - Update `US_INCENTIVES_SEED.sql`

5. **Deploy:**
   - Build: `npm run build`
   - Deploy to Vercel
   - Share demo link

---

**Questions?** Check [PHASE2_COMPLETION_SUMMARY.md](./PHASE2_COMPLETION_SUMMARY.md) for detailed documentation.
