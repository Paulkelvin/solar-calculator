-- US Solar Incentives Database Population
-- Run this in Supabase SQL Editor to populate the incentives table

-- Clear existing data (optional - comment out if you want to preserve existing records)
-- DELETE FROM incentives;

-- California
INSERT INTO incentives (name, type, amount, state, description, eligible_financing_types, created_at, updated_at)
VALUES
(
  'SGIP (Self-Generation Incentive Program)',
  'state_rebate',
  0.15, -- $/watt (stored as numeric, max $3000 applied in app logic)
  'CA',
  'Battery storage incentive for solar+storage systems. Varies by utility territory. Max $3000.',
  ARRAY['cash', 'loan', 'lease', 'ppa'],
  NOW(),
  NOW()
),
(
  'NEM 3.0 Net Metering',
  'net_metering',
  0.21, -- ~75% of $0.28/kWh retail rate
  'CA',
  'Export credits at ~75% of retail rate for most utilities. Legacy NEM 2.0 grandfathered at full retail.',
  ARRAY['cash', 'loan', 'lease', 'ppa'],
  NOW(),
  NOW()
);

-- Texas  
INSERT INTO incentives (name, type, amount, state, description, eligible_financing_types, created_at, updated_at)
VALUES
(
  'Wholesale Buyback',
  'net_metering',
  0.04, -- Wholesale rate ~$0.03-0.05/kWh
  'TX',
  'No statewide net metering. Some utilities offer limited buyback at wholesale rates.',
  ARRAY['cash', 'loan', 'lease', 'ppa'],
  NOW(),
  NOW()
);

-- Florida
INSERT INTO incentives (name, type, amount, state, description, eligible_financing_types, created_at, updated_at)
VALUES
(
  'Property Tax Exemption',
  'state_rebate',
  1000, -- Estimated annual value (stored as one-time for simplicity)
  'FL',
  'Solar systems exempt from property tax assessment increase. Saves ~$500-1500/year.',
  ARRAY['cash', 'loan'],
  NOW(),
  NOW()
),
(
  'Retail Net Metering',
  'net_metering',
  0.13, -- Full retail rate
  'FL',
  'Full retail net metering with monthly rollover. Excess credits expire annually.',
  ARRAY['cash', 'loan', 'lease', 'ppa'],
  NOW(),
  NOW()
);

-- New York
INSERT INTO incentives (name, type, amount, state, description, eligible_financing_types, created_at, updated_at)
VALUES
(
  'NY-Sun Incentive',
  'state_rebate',
  0.40, -- $/watt, max $5000
  'NY',
  'Statewide solar rebate. Amount varies by utility zone and system size. Max $5000.',
  ARRAY['cash', 'loan', 'lease', 'ppa'],
  NOW(),
  NOW()
),
(
  'VDER Net Metering',
  'net_metering',
  0.20, -- Full retail rate
  'NY',
  'Full retail net metering with VDER (Value of Distributed Energy Resources) credits in some zones.',
  ARRAY['cash', 'loan', 'lease', 'ppa'],
  NOW(),
  NOW()
);

-- Arizona
INSERT INTO incentives (name, type, amount, state, description, eligible_financing_types, created_at, updated_at)
VALUES
(
  'APS Solar Partner Program',
  'utility_rebate',
  0.10, -- $/watt, max $1000
  'AZ',
  'Utility-specific incentives. APS and SRP offer limited rebates. Max $1000.',
  ARRAY['cash', 'loan'],
  NOW(),
  NOW()
),
(
  'Variable Export Credit',
  'net_metering',
  0.10, -- Export rate varies by utility
  'AZ',
  'Export rates vary by utility. APS ~$0.10/kWh export credit. Lower than retail but still valuable.',
  ARRAY['cash', 'loan', 'lease', 'ppa'],
  NOW(),
  NOW()
);

-- Massachusetts
INSERT INTO incentives (name, type, amount, state, description, eligible_financing_types, created_at, updated_at)
VALUES
(
  'SMART Program',
  'state_rebate',
  0.30, -- $/watt, max $4000
  'MA',
  'Solar Massachusetts Renewable Target. Capacity-based incentive declining over time. Max $4000.',
  ARRAY['cash', 'loan', 'lease', 'ppa'],
  NOW(),
  NOW()
),
(
  'Retail Net Metering',
  'net_metering',
  0.24, -- Full retail rate
  'MA',
  'Full retail net metering with monthly rollover. Market Net Metering Credit for excess.',
  ARRAY['cash', 'loan', 'lease', 'ppa'],
  NOW(),
  NOW()
);

-- New Jersey
INSERT INTO incentives (name, type, amount, state, description, eligible_financing_types, created_at, updated_at)
VALUES
(
  'SREC-II Program',
  'srec',
  85, -- ~$80-90/MWh = $0.085/kWh
  'NJ',
  'Solar Renewable Energy Certificates. Earn tradable credits worth ~$80-90/MWh. Passive income stream.',
  ARRAY['cash', 'loan', 'lease', 'ppa'],
  NOW(),
  NOW()
),
(
  'Retail Net Metering',
  'net_metering',
  0.17, -- Full retail rate
  'NJ',
  'Full retail net metering with annual true-up. Strong net metering policy.',
  ARRAY['cash', 'loan', 'lease', 'ppa'],
  NOW(),
  NOW()
);

-- Colorado
INSERT INTO incentives (name, type, amount, state, description, eligible_financing_types, created_at, updated_at)
VALUES
(
  'Xcel Energy Solar*Rewards',
  'utility_rebate',
  0.08, -- $/watt, max $800
  'CO',
  'Utility rebate for Xcel customers. Other utilities have similar programs. Max $800.',
  ARRAY['cash', 'loan'],
  NOW(),
  NOW()
),
(
  'Retail Net Metering',
  'net_metering',
  0.13, -- Full retail rate
  'CO',
  'Full retail net metering with monthly rollover.',
  ARRAY['cash', 'loan', 'lease', 'ppa'],
  NOW(),
  NOW()
);

-- North Carolina
INSERT INTO incentives (name, type, amount, state, description, eligible_financing_types, created_at, updated_at)
VALUES
(
  'Variable Net Metering',
  'net_metering',
  0.08, -- Avoided cost rate (~70% of retail)
  'NC',
  'Net metering available but rates vary. Some utilities offer avoided cost rates.',
  ARRAY['cash', 'loan', 'lease', 'ppa'],
  NOW(),
  NOW()
);

-- Nevada
INSERT INTO incentives (name, type, amount, state, description, eligible_financing_types, created_at, updated_at)
VALUES
(
  'Retail Net Metering',
  'net_metering',
  0.12, -- Full retail rate
  'NV',
  'Restored full retail net metering in 2017 after brief suspension.',
  ARRAY['cash', 'loan', 'lease', 'ppa'],
  NOW(),
  NOW()
);

-- Add utility rates table data
-- Note: This assumes you have a utility_rates table. If not, you can query incentives by state.
-- The application should use the averageUtilityRate from us-incentives-data.ts

-- Migration note:
-- If incentives table doesn't have eligible_financing_types column, add it:
-- ALTER TABLE incentives ADD COLUMN IF NOT EXISTS eligible_financing_types TEXT[];

-- If you need to add a 'type' column to distinguish incentive types:
-- ALTER TABLE incentives ADD COLUMN IF NOT EXISTS type VARCHAR(50);

COMMIT;
