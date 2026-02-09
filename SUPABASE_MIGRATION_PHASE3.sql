-- ============================================================================
-- PHASE 3: 50-State Solar Incentives Database Migration
-- Run this in Supabase SQL Editor
-- ============================================================================

-- 1. Ensure incentives table exists with proper schema
-- (This table may already exist from Phase 2)

CREATE TABLE IF NOT EXISTS incentives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state VARCHAR(2) NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('rebate', 'tax_credit', 'net_metering', 'lease', 'ppa', 'other')),
  amount TEXT,
  description TEXT NOT NULL,
  eligibility TEXT,
  expiration_date DATE,
  website_url TEXT,
  is_active BOOLEAN DEFAULT true,
  last_scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(state, name)
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_incentives_state_active ON incentives(state, is_active);
CREATE INDEX IF NOT EXISTS idx_incentives_expiration ON incentives(expiration_date) WHERE expiration_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_incentives_type ON incentives(type);

-- 3. Create view for active incentives only
CREATE OR REPLACE VIEW active_incentives AS
SELECT * FROM incentives
WHERE is_active = true
  AND (expiration_date IS NULL OR expiration_date > CURRENT_DATE);

-- 4. Create function to deactivate expired incentives (run monthly via cron)
CREATE OR REPLACE FUNCTION deactivate_expired_incentives()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE incentives
  SET is_active = false, updated_at = NOW()
  WHERE expiration_date IS NOT NULL
    AND expiration_date < CURRENT_DATE
    AND is_active = true;
END;
$$;

-- 5. Insert Federal Incentives (apply to all states)
INSERT INTO incentives (state, name, type, amount, description, eligibility, is_active, website_url)
VALUES
  ('US', 'Federal Solar Investment Tax Credit (ITC) - Commercial', 'tax_credit', '30%', 
   'Commercial properties can claim 30% tax credit through 2032, then 26% (2033), 22% (2034). Residential ITC expired Dec 2024.', 
   'Commercial and utility-scale solar projects', true, 'https://www.energy.gov/eere/solar/federal-solar-tax-credits-businesses'),
  
  ('US', 'USDA REAP Grant', 'rebate', 'Up to 25%', 
   'Rural Energy for America Program provides grants up to 25% of project costs for agricultural producers and rural small businesses.', 
   'Rural agricultural producers and small businesses', true, 'https://www.rd.usda.gov/programs-services/energy-programs/rural-energy-america-program-renewable-energy-systems-energy-efficiency-improvement-guaranteed-loans'),
  
  ('US', 'Modified Accelerated Cost Recovery System (MACRS)', 'tax_credit', '85% depreciation', 
   'Allows businesses to depreciate 85% of solar system cost over 5 years, significantly reducing tax burden.', 
   'Commercial solar system owners', true, 'https://www.energy.gov/eere/solar/federal-solar-tax-credits-businesses')
ON CONFLICT (state, name) DO UPDATE
SET description = EXCLUDED.description,
    amount = EXCLUDED.amount,
    updated_at = NOW();

-- 6. Insert California Incentives (Most developed solar market)
INSERT INTO incentives (state, name, type, amount, description, eligibility, is_active, website_url)
VALUES
  ('CA', 'Self-Generation Incentive Program (SGIP)', 'rebate', 'Up to $1,000/kWh for storage', 
   'SGIP provides rebates for battery storage systems paired with solar. Higher incentives for low-income customers ($1,000/kWh) vs general market ($200/kWh).', 
   'California residents and businesses with battery storage', true, 'https://www.selfgenca.com/'),
  
  ('CA', 'Net Energy Metering 3.0 (NEM 3.0)', 'net_metering', 'Export compensation ~$0.05-0.08/kWh', 
   'NEM 3.0 (effective April 2023) offers lower export rates (~75% reduction from NEM 2.0) but encourages battery storage adoption. Legacy NEM 2.0 customers grandfathered for 20 years.', 
   'California solar customers (utility-specific: PG&E, SCE, SDG&E)', true, 'https://www.cpuc.ca.gov/nem/'),
  
  ('CA', 'DAC-SASH (Disadvantaged Communities)', 'rebate', 'Up to $3.00/W', 
   'Single-family solar homes program for disadvantaged communities. Upfront incentive up to $3.00/watt, significantly reducing system costs.', 
   'Income-qualified homeowners in DAC areas', true, 'https://www.csd.ca.gov/pages/dac-sash.aspx'),
  
  ('CA', 'Solar on Multifamily Affordable Housing (SOMAH)', 'rebate', 'Up to $1.10/W', 
   'Incentives for solar on multifamily affordable housing properties. Designed to bring solar to underserved communities.', 
   'Multifamily affordable housing properties', true, 'https://www.calsomah.org/'),
  
  ('CA', 'Property Tax Exemption for Solar', 'tax_credit', '100% exemption', 
   'Solar energy systems are exempt from property tax assessment increases in California. Saves ~$500-1,500/year depending on system size.', 
   'All California solar system owners', true, 'https://www.boe.ca.gov/proptaxes/solar.htm'),
  
  ('CA', 'Solar Lease and PPA Programs', 'ppa', 'Typical 20% bill savings', 
   'California has the most developed solar leasing market. Dozens of providers offer $0 down leasing and PPAs. Installers claim commercial ITC and pass savings to customers.', 
   'Homeowners and businesses', true, null)
ON CONFLICT (state, name) DO UPDATE
SET description = EXCLUDED.description,
    amount = EXCLUDED.amount,
    updated_at = NOW();

-- 7. Insert Texas Incentives
INSERT INTO incentives (state, name, type, amount, description, eligibility, is_active, website_url)
VALUES
  ('TX', 'Net Metering (Limited)', 'net_metering', 'Varies by utility', 
   'Texas does not have statewide net metering. Some utilities offer limited buyback at wholesale rates (~$0.03-0.05/kWh). Check with your local provider.', 
   'Customers of participating utilities', true, 'http://www.puc.texas.gov/'),
  
  ('TX', 'Austin Energy Solar Rebate', 'rebate', 'Up to $2,500', 
   'Austin Energy offers performance-based incentives for solar installations. Limited funds available on first-come, first-served basis. ~$0.10/W typical.', 
   'Austin Energy residential customers', true, 'https://austinenergy.com/ae/green-power/solar-solutions/for-your-home/rebates-and-incentives'),
  
  ('TX', 'CPS Energy Solar Rebate', 'rebate', '$0.60/W', 
   'CPS Energy (San Antonio) provides upfront rebates of $0.60/watt for solar installations. Strong program with consistent funding.', 
   'CPS Energy customers', true, 'https://www.cpsenergy.com/en/save-money-energy/residential-rebates-incentives.html'),
  
  ('TX', 'Solar Leasing and PPAs', 'lease', '15% typical savings', 
   'Solar leasing is popular in Texas due to lack of net metering. Multiple national providers offer $0 down leasing with fixed monthly rates. Installers use commercial ITC to reduce costs.', 
   'Texas homeowners', true, null)
ON CONFLICT (state, name) DO UPDATE
SET description = EXCLUDED.description,
    amount = EXCLUDED.amount,
    updated_at = NOW();

-- 8. Insert Arizona Incentives
INSERT INTO incentives (state, name, type, amount, description, eligibility, is_active, website_url)
VALUES
  ('AZ', 'Arizona Public Service (APS) Solar Partner Program', 'rebate', '$0.10/kWh production credit', 
   'APS customers earn credits for solar production. Enrollments limited; check availability. Alternative: export rate plans available.', 
   'APS residential customers', true, 'https://www.aps.com/solar'),
  
  ('AZ', 'Salt River Project (SRP) Customer Generation Price Plan', 'net_metering', 'Export credit varies by TOU', 
   'SRP offers export credits for excess solar generation. Rate varies by time of use (~$0.03-0.13/kWh). No longer offers full retail net metering.', 
   'SRP customers with solar systems', true, 'https://www.srpnet.com/prices/home/solar-price-plans.aspx'),
  
  ('AZ', 'Solar Lease and PPA Options', 'lease', '$0 down, 20% savings typical', 
   'Arizona has robust solar leasing market due to high solar potential. Multiple providers offer $0 down, fixed monthly payments. Strong alternative to cash purchase.', 
   'Arizona homeowners', true, null),
  
  ('AZ', 'Tucson Electric Power (TEP) Net Metering', 'net_metering', 'Retail rate credit', 
   'TEP provides full retail rate net metering for systems up to 125% of annual consumption. One of the best net metering policies in Arizona.', 
   'TEP residential and commercial customers', true, 'https://www.tep.com/renewable-energy/')
ON CONFLICT (state, name) DO UPDATE
SET description = EXCLUDED.description,
    amount = EXCLUDED.amount,
    updated_at = NOW();

-- 9. Insert New York Incentives
INSERT INTO incentives (state, name, type, amount, description, eligibility, is_active, website_url)
VALUES
  ('NY', 'NY-Sun Incentive Program', 'rebate', '$0.20-0.40/W', 
   'New York State residential solar incentive. Amount varies by region and system size. Megawatt Block structure - incentives decrease as more solar is installed.', 
   'New York homeowners', true, 'https://www.nyserda.ny.gov/ny-sun'),
  
  ('NY', 'Net Metering', 'net_metering', 'Full retail rate credit', 
   'New York offers generous net metering with full retail rate credits. Monthly rollover, annual reconciliation. One of the best policies in the US.', 
   'All NY solar customers', true, 'https://www.nyserda.ny.gov/'),
  
  ('NY', 'Solar Property Tax Exemption', 'tax_credit', '100% exemption', 
   'Solar energy systems are exempt from property tax increases for 15 years. Significant savings in high-tax areas like NYC.', 
   'New York solar system owners', true, null),
  
  ('NY', 'ConEd Smart Solutions Program', 'rebate', 'Varies by project', 
   'Consolidated Edison offers additional incentives for solar projects in NYC area. Performance-based incentives available.', 
   'ConEd customers in NYC/Westchester', true, 'https://www.coned.com/smartsolutions')
ON CONFLICT (state, name) DO UPDATE
SET description = EXCLUDED.description,
    amount = EXCLUDED.amount,
    updated_at = NOW();

-- 10. Insert Florida Incentives
INSERT INTO incentives (state, name, type, amount, description, eligibility, is_active, website_url)
VALUES
  ('FL', 'Property Tax Exemption', 'tax_credit', '100% exemption', 
   'Solar energy systems are exempt from property tax assessment increases. Saves ~$500-1,500/year depending on system size and local tax rates.', 
   'All Florida solar system owners', true, null),
  
  ('FL', 'Net Metering', 'net_metering', 'Full retail rate credit', 
   'Florida offers excellent net metering with full retail rate credits. Monthly rollover, excess credits expire annually in December.', 
   'All Florida solar customers', true, 'http://www.floridapsc.com/'),
  
  ('FL', 'Sales Tax Exemption', 'tax_credit', '100% exemption', 
   'Solar energy equipment is exempt from Florida sales tax (6%). Saves ~$1,200-2,400 on typical residential system.', 
   'All Florida solar purchases', true, null)
ON CONFLICT (state, name) DO UPDATE
SET description = EXCLUDED.description,
    amount = EXCLUDED.amount,
    updated_at = NOW();

-- 11. Verify installation
SELECT 
  state,
  COUNT(*) as incentive_count,
  COUNT(*) FILTER (WHERE type = 'rebate') as rebates,
  COUNT(*) FILTER (WHERE type = 'net_metering') as net_metering,
  COUNT(*) FILTER (WHERE type = 'lease' OR type = 'ppa') as leasing_options
FROM active_incentives
GROUP BY state
ORDER BY incentive_count DESC;

-- Expected output:
-- state | incentive_count | rebates | net_metering | leasing_options
-- ------|-----------------|---------|--------------|----------------
-- CA    | 6               | 3       | 1            | 1
-- NY    | 4               | 2       | 1            | 0
-- AZ    | 4               | 1       | 2            | 1
-- TX    | 4               | 2       | 1            | 1
-- FL    | 3               | 0       | 1            | 0
-- US    | 3               | 1       | 0            | 0

COMMENT ON TABLE incentives IS 'State and federal solar incentives database. Updated monthly via DSIRE scraper.';
COMMENT ON VIEW active_incentives IS 'Active incentives only (excludes expired programs).';
COMMENT ON FUNCTION deactivate_expired_incentives() IS 'Run monthly via cron to mark expired incentives as inactive';
