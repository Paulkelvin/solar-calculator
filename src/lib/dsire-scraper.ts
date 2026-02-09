/**
 * DSIRE (Database of State Incentives for Renewables & Efficiency) Scraper
 * 
 * Scrapes state-specific solar incentives from dsireusa.org
 * Run monthly via cron to keep incentives data fresh
 * 
 * Usage:
 *   npm install puppeteer
 *   node --loader ts-node/esm src/lib/dsire-scraper.ts
 * 
 * Or via cron (monthly):
 *   0 0 1 * * cd /path/to/solar-calculator && npm run scrape-incentives
 */

import puppeteer from 'puppeteer';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface ScrapedIncentive {
  state: string;
  name: string;
  type: 'rebate' | 'tax_credit' | 'net_metering' | 'lease' | 'ppa' | 'other';
  amount?: string;
  description: string;
  expirationDate?: string;
  eligibility?: string;
  websiteUrl?: string;
}

/**
 * Scrape DSIRE for state-specific solar incentives
 */
export async function scrapeDSIREIncentives(stateCode: string): Promise<ScrapedIncentive[]> {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    // Navigate to DSIRE state page
    const url = `https://www.dsireusa.org/resources/detailed-summary-maps/?state=${stateCode}`;
    await page.goto(url, { waitUntil: 'networkidle2' });
    
    // Extract incentive data
    const incentives = await page.evaluate(() => {
      const results: ScrapedIncentive[] = [];
      
      // DSIRE uses different selectors - adjust based on actual site structure
      const incentiveCards = document.querySelectorAll('.incentive-card, .program-listing');
      
      incentiveCards.forEach((card) => {
        const nameEl = card.querySelector('.program-name, h3');
        const typeEl = card.querySelector('.program-type, .category');
        const amountEl = card.querySelector('.incentive-amount, .amount');
        const descEl = card.querySelector('.description, p');
        const expirationEl = card.querySelector('.expiration-date, .expires');
        const linkEl = card.querySelector('a');
        
        if (nameEl) {
          results.push({
            state: '', // Will be filled in
            name: nameEl.textContent?.trim() || '',
            type: determineType(typeEl?.textContent?.trim() || ''),
            amount: amountEl?.textContent?.trim(),
            description: descEl?.textContent?.trim() || '',
            expirationDate: expirationEl?.textContent?.trim(),
            websiteUrl: linkEl?.getAttribute('href') || undefined,
          });
        }
      });
      
      return results;
    });
    
    await browser.close();
    
    // Add state code to all incentives
    return incentives.map(inc => ({ ...inc, state: stateCode }));
    
  } catch (error) {
    console.error(`Error scraping DSIRE for ${stateCode}:`, error);
    await browser.close();
    return [];
  }
}

/**
 * Determine incentive type from category text
 */
function determineType(categoryText: string): ScrapedIncentive['type'] {
  const lower = categoryText.toLowerCase();
  if (lower.includes('rebate')) return 'rebate';
  if (lower.includes('tax credit') || lower.includes('tax incentive')) return 'tax_credit';
  if (lower.includes('net metering')) return 'net_metering';
  if (lower.includes('lease') || lower.includes('solar lease')) return 'lease';
  if (lower.includes('ppa') || lower.includes('power purchase')) return 'ppa';
  return 'other';
}

/**
 * Scrape all 50 states + DC and upsert to Supabase
 */
export async function scrapeAllStates() {
  const states = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC', 'FL',
    'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME',
    'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH',
    'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI',
    'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ];
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const allIncentives: ScrapedIncentive[] = [];
  
  console.log('Starting DSIRE scrape for all 50 states + DC...');
  
  for (const state of states) {
    console.log(`Scraping ${state}...`);
    const incentives = await scrapeDSIREIncentives(state);
    allIncentives.push(...incentives);
    
    // Rate limiting: Wait 2 seconds between requests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log(`Scraped ${allIncentives.length} total incentives`);
  
  // Upsert to Supabase (bulk insert with conflict resolution)
  const { data, error } = await supabase
    .from('incentives')
    .upsert(
      allIncentives.map(inc => ({
        state: inc.state,
        name: inc.name,
        type: inc.type,
        amount: inc.amount,
        description: inc.description,
        expiration_date: inc.expirationDate ? parseDate(inc.expirationDate) : null,
        eligibility: inc.eligibility,
        website_url: inc.websiteUrl,
        is_active: true,
        last_scraped_at: new Date().toISOString(),
      })),
      { onConflict: 'state,name' }
    );
  
  if (error) {
    console.error('Error upserting to Supabase:', error);
  } else {
    console.log(`Successfully upserted ${allIncentives.length} incentives to Supabase`);
  }
  
  return allIncentives;
}

/**
 * Parse various date formats from DSIRE
 */
function parseDate(dateStr: string): string | null {
  try {
    // Handle formats like "12/31/2025", "December 31, 2025", "No expiration"
    if (dateStr.toLowerCase().includes('no expiration') || dateStr.toLowerCase().includes('ongoing')) {
      return null;
    }
    
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0]; // YYYY-MM-DD
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * Filter expired incentives from database
 */
export async function removeExpiredIncentives() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  
  const { data, error } = await supabase
    .from('incentives')
    .update({ is_active: false })
    .lt('expiration_date', new Date().toISOString().split('T')[0]);
  
  if (error) {
    console.error('Error removing expired incentives:', error);
  } else {
    console.log('Expired incentives marked as inactive');
  }
}

// CLI execution
if (require.main === module) {
  scrapeAllStates()
    .then(() => removeExpiredIncentives())
    .then(() => {
      console.log('DSIRE scrape complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Scrape failed:', error);
      process.exit(1);
    });
}
