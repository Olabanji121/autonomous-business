#!/usr/bin/env node
// Amazon Deal Scraper using Camoufox
// Run this to fetch fresh deals from Amazon

import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';

const DATA_FILE = '/home/obanj/smart/projects/deal-hunter/data/deals.json';
const AFFILIATE_TAG = 'your-tag-20';

function log(msg) {
  const ts = new Date().toISOString().split('T')[1].split('.')[0];
  console.log(`[${ts}] ${msg}`);
}

function loadDeals() {
  if (!existsSync(DATA_FILE)) return [];
  try {
    return JSON.parse(readFileSync(DATA_FILE, 'utf-8'));
  } catch (e) {
    return [];
  }
}

function saveDeals(deals) {
  mkdirSync('/home/obanj/smart/projects/deal-hunter/data', { recursive: true });
  writeFileSync(DATA_FILE, JSON.stringify(deals, null, 2));
}

// Call Camoufox API to scrape Amazon
async function camofoxRequest(action, params = {}) {
  const res = await fetch(`http://localhost:9222/${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  return res.json();
}

async function scrapeAmazonDeals() {
  log('Opening Amazon Deals page...');
  
  // Create tab
  const tabRes = await fetch('http://localhost:9222/create_tab', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: 'https://www.amazon.com/gp/goldbox' }),
  });
  const { tabId } = await tabRes.json();
  
  if (!tabId) {
    throw new Error('Failed to create browser tab');
  }
  
  log('Waiting for page to load...');
  await new Promise(r => setTimeout(r, 5000));
  
  // Get snapshot
  log('Extracting deals...');
  const snapRes = await fetch('http://localhost:9222/snapshot', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tabId }),
  });
  const { snapshot } = await snapRes.json();
  
  // Parse deals from snapshot
  const deals = parseDealsFromSnapshot(snapshot);
  log(`Found ${deals.length} deals`);
  
  // Close tab
  await fetch('http://localhost:9222/close_tab', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tabId }),
  });
  
  return deals;
}

function parseDealsFromSnapshot(snapshot) {
  const deals = [];
  const text = snapshot || '';
  
  // Pattern to match deal cards
  // Format: "XX% off Limited time deal Deal Price: AUD XXX.XX List: AUD XXX.XX Product Name"
  const dealPattern = /(\d+)% off.*?Deal Price: AUD?\s*([0-9,.]+)\s*(?:List:|Typical:)\s*AUD?\s*([0-9,.]+)\s*([^\n]+)/gi;
  
  let match;
  while ((match = dealPattern.exec(text)) !== null) {
    const discount = parseInt(match[1]);
    const price = parseFloat(match[2].replace(',', ''));
    const originalPrice = parseFloat(match[3].replace(',', ''));
    let title = match[4].trim();
    
    // Extract ASIN from URLs in the surrounding text
    const asinMatch = text.substring(Math.max(0, match.index - 500), match.index + 500).match(/\/dp\/([A-Z0-9]{10})/);
    const asin = asinMatch ? asinMatch[1] : `deal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    
    // Determine category from title
    const category = categorizeDeal(title);
    
    // Only add if we have valid data
    if (price > 0 && originalPrice > 0 && title.length > 10) {
      deals.push({
        id: asin,
        asin,
        title: title.slice(0, 150),
        price,
        originalPrice,
        discount,
        category,
        url: `https://www.amazon.com/dp/${asin}`,
        affiliateUrl: `https://www.amazon.com/dp/${asin}?tag=${AFFILIATE_TAG}`,
        source: 'amazon',
        scrapedAt: new Date().toISOString(),
      });
    }
  }
  
  // Remove duplicates by ASIN
  const seen = new Set();
  return deals.filter(d => {
    if (seen.has(d.asin)) return false;
    seen.add(d.asin);
    return true;
  });
}

function categorizeDeal(title) {
  const t = title.toLowerCase();
  
  if (/phone|iphone|samsung galaxy|pixel|mobile/i.test(t)) return 'phone';
  if (/headphones|earbuds|speaker|audio|sound/i.test(t)) return 'audio';
  if (/monitor|tv|screen|display/i.test(t)) return 'tech';
  if (/laptop|computer|keyboard|mouse|ssd|usb/i.test(t)) return 'tech';
  if (/gaming|game|controller|rgb/i.test(t)) return 'gaming';
  if(/pillow|sheet|towel|mattress|bed|blanket/i.test(t)) return 'home';
  if (/kitchen|blender|coffee|cook/i.test(t)) return 'home';
  if (/vitamin|supplement|health|fitness|exercise/i.test(t)) return 'health';
  if (/baby|kid|child|toy/i.test(t)) return 'baby';
  if (/fashion|dress|pants|shirt|shoes/i.test(t)) return 'fashion';
  if (/beauty|skin|makeup|hair/i.test(t)) return 'beauty';
  
  return 'general';
}

async function main() {
  try {
    log('=== Starting Amazon Deal Scraper ===');
    
    // Load existing deals
    const existing = loadDeals();
    log(`Existing deals: ${existing.length}`);
    
    // Scrape new deals
    const newDeals = await scrapeAmazonDeals();
    
    if (newDeals.length > 0) {
      // Merge: update existing, add new
      const dealMap = new Map(existing.map(d => [d.id || d.asin, d]));
      
      for (const deal of newDeals) {
        const key = deal.id || deal.asin;
        dealMap.set(key, {
          ...dealMap.get(key),
          ...deal,
          firstSeen: dealMap.get(key)?.firstSeen || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
      
      const allDeals = Array.from(dealMap.values());
      saveDeals(allDeals);
      log(`Saved ${allDeals.length} total deals (${newDeals.length} new/updated)`);
    } else {
      log('No new deals found');
    }
    
    log('=== Scraping complete ===');
  } catch (e) {
    log(`Error: ${e.message}`);
    console.error(e);
    process.exit(1);
  }
}

main();
