# Phase 3 Setup Instructions

## Step 1: Install Dependencies ✅

Run this command to install all required packages:

```powershell
npm install puppeteer tsx
```

**Already Installed** (from package.json):
- ✅ jspdf (^4.0.0)
- ✅ html2canvas (^1.4.1)
- ✅ @supabase/supabase-js (2.48.0)

**New Installations**:
- puppeteer (^22.0.0) - For DSIRE web scraping
- tsx - TypeScript executor for running scraper scripts

---

## Step 2: Supabase Database Migration

### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project: https://supabase.com/dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the contents of `PHASE3_50_STATE_INCENTIVES.sql`
5. Click **Run** to execute the migration

### Option B: Using Supabase CLI

```powershell
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Run migration
supabase db push
```

### What Gets Created:

**Tables**:
- `incentives` table already exists (from Phase 2)
- Adds indexes: `idx_incentives_state_active`, `idx_incentives_expiration`, `idx_incentives_type`

**Data Inserted**:
- Federal programs (3 records): Commercial ITC, USDA REAP, MACRS
- State programs (sample for 5 states): AL, AK, AZ, CA, TX
- Total: ~20 incentive records

**Views**:
- `active_incentives` - Filters out expired incentives automatically

**Functions**:
- `deactivate_expired_incentives()` - Run monthly to mark expired incentives as inactive

### Verify Migration Success:

Run this query in Supabase SQL Editor:

```sql
SELECT state, COUNT(*) as incentive_count
FROM active_incentives
GROUP BY state
ORDER BY incentive_count DESC;
```

Expected output:
```
state | incentive_count
------|----------------
CA    | 6
US    | 3
TX    | 4
AZ    | 4
AL    | 3
AK    | 2
```

---

## Step 3: Configure Environment Variables

Add these to your `.env.local`:

```bash
# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Google Solar API (for real roof data)
GOOGLE_SOLAR_API_KEY=your_google_solar_api_key
NEXT_PUBLIC_USE_REAL_SOLAR_API=false  # Set to 'true' when ready

# NREL PVWatts (already configured)
NREL_API_KEY=your_nrel_api_key
```

---

## Step 4: Test DSIRE Scraper (Manual)

### Fix TypeScript Errors First:

The scraper file needs some adjustments for TypeScript compatibility. Update `src/lib/dsire-scraper.ts`:

1. Change the `require.main` check at the bottom:
```typescript
// Replace this:
if (require.main === module) {

// With this:
if (import.meta.url === `file://${process.argv[1]}`) {
```

### Run the Scraper:

```powershell
# Run for a single state (test mode)
npm run scrape-incentives

# Or manually with tsx:
npx tsx src/lib/dsire-scraper.ts
```

### Expected Output:

```
Starting DSIRE scrape for all 50 states + DC...
Scraping AL...
Scraping AK...
Scraping AZ...
...
Scraped 156 total incentives
Successfully upserted 156 incentives to Supabase
Expired incentives marked as inactive
DSIRE scrape complete!
```

### Notes:

⚠️ **DSIRE Website Structure**: The actual DSIRE website may have a different HTML structure than the scraper expects. You'll likely need to:

1. Visit https://www.dsireusa.org/
2. Inspect the HTML structure for incentive listings
3. Update the CSS selectors in `scrapeDSIREIncentives()` function
4. Test with a single state first: `scrapeAllStates()` → modify to run just one state

**Alternative Approach**: Since DSIRE's site structure changes frequently, consider:
- Manually curating the top 10-15 states with highest solar adoption (CA, TX, FL, NY, AZ, NJ, MA, NC, NV, CO)
- Using the static data in `US_INCENTIVES_SEED.sql` as a starting point
- Requesting API access from DSIRE directly: https://www.dsireusa.org/about/contact/

---

## Step 5: Set Up Monthly Cron Job

### Option A: Vercel Cron Jobs (Recommended for Production)

Create `src/app/api/cron/update-incentives/route.ts`:

```typescript
export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Run scraper
  const { scrapeAllStates, removeExpiredIncentives } = await import('@/lib/dsire-scraper');
  await scrapeAllStates();
  await removeExpiredIncentives();

  return Response.json({ success: true });
}
```

Then in `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/cron/update-incentives",
    "schedule": "0 0 1 * *"
  }]
}
```

### Option B: Local Cron (Linux/Mac)

```bash
# Edit crontab
crontab -e

# Add this line (runs 1st of every month at midnight)
0 0 1 * * cd /path/to/solar-calculator && npm run scrape-incentives >> /var/log/dsire-scraper.log 2>&1
```

### Option C: Windows Task Scheduler

1. Open **Task Scheduler**
2. Create Basic Task → Name: "DSIRE Incentives Update"
3. Trigger: Monthly, 1st day, 12:00 AM
4. Action: Start a program
   - Program: `C:\Program Files\nodejs\npm.cmd`
   - Arguments: `run scrape-incentives`
   - Start in: `C:\Users\paulo\Documents\solar-calculator`

---

## Step 6: Verify Everything Works

### Test the Full Flow:

1. **Check Dependencies**:
   ```powershell
   npm list puppeteer jspdf html2canvas
   ```

2. **Verify Database**:
   ```sql
   SELECT COUNT(*) FROM active_incentives;
   -- Should return > 0
   ```

3. **Test Incentives Service**:
   - Navigate to calculator in browser
   - Enter a California address
   - Check browser console for incentives fetched
   - Should see SGIP, NEM 3.0, leasing options

4. **Test PDF Export** (once UI is integrated):
   - Complete calculator flow
   - Click "Export Report" button
   - Should download `solar-roadmap.pdf` with charts

---

## Troubleshooting

### Issue: Puppeteer fails to install

**Error**: `Failed to download Chromium`

**Solution**:
```powershell
# Set environment variable to skip Chromium download
$env:PUPPETEER_SKIP_CHROMIUM_DOWNLOAD="true"

# Install puppeteer-core instead (requires manual Chrome path)
npm install puppeteer-core
```

### Issue: DSIRE scraper returns empty results

**Problem**: Website structure changed

**Solution**:
1. Visit https://www.dsireusa.org/resources/detailed-summary-maps/?state=CA
2. Open browser DevTools (F12)
3. Inspect incentive listing elements
4. Update CSS selectors in `scrapeDSIREIncentives()`
5. Test with `console.log()` to verify data extraction

### Issue: Supabase RLS blocks inserts

**Error**: `new row violates row-level security policy`

**Solution**:
```sql
-- Temporarily disable RLS for service role inserts
ALTER TABLE incentives DISABLE ROW LEVEL SECURITY;

-- Or create policy for service role:
CREATE POLICY "Service role can insert" ON incentives
  FOR INSERT
  TO service_role
  USING (true);
```

---

## Next Steps

After completing these setup steps:

1. ✅ Dependencies installed
2. ✅ Database migration complete
3. ✅ DSIRE scraper tested (or static data loaded)
4. 🔲 Integrate incentives into ResultsView.tsx
5. 🔲 Add "Include State Incentives" toggle to What-If sliders
6. 🔲 Create PDF export button UI
7. 🔲 Test full calculator flow end-to-end

---

## Quick Reference Commands

```powershell
# Install dependencies
npm install puppeteer tsx

# Run DSIRE scraper
npm run scrape-incentives

# Check database
# (Run in Supabase SQL Editor)
SELECT * FROM active_incentives WHERE state = 'CA';

# Start dev server
npm run dev
```

---

**Status**: Ready for Phase 3 testing and integration 🚀
