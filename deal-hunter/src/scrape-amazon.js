#!/usr/bin/env node
// Amazon Deals Scraper using Camoufox
// Run with: node scrape-amazon.js [category]

import { config } from './config.js';
import * as store from './deal-store.js';

const CAMOFOX_URL = process.env.CAMOFOX_URL || 'http://localhost:9222';

async function camofoxRequest(action, params = {}) {
  const res = await fetch(`${CAMOFOX_URL}/${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  return res.json();
}

async function createTab(url) {
  const res = await fetch(`${CAMOFOX_URL}/create_tab`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  return res.json();
}

async function getSnapshot(tabId) {
  const res = await fetch(`${CAMOFOX_URL}/snapshot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tabId }),
  });
  return res.json();
}

async function closeTab(tabId) {
  await fetch(`${CAMOFOX_URL}/close_tab`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tabId }),
  });
}

function extractDealsFromSnapshot(snapshot, category) {
  const deals = [];
  const lines = snapshot.snapshot || '';
  
  // Look for product patterns in the snapshot
  // Amazon search results typically show:
  // - Product title (link with text)
  // - Price ($XX.XX)
  // - Original price with strikethrough
  // - Rating (X.X out of 5)
  // - ASIN in URL
  
  const priceRegex = /\$([0-9]+)\.?([0-9]{2})?/g;
  const asinRegex = /\/dp\/([A-Z0-9]{10})/g;
  
  // Extract ASINs
  const asins = new Map();
  let match;
  while ((match = asinRegex.exec(lines)) !== null) {
    if (!asins.has(match[1])) {
      asins.set(match[1], { asin: match[1], category });
    }
  }
  
  console.log(`Found ${asins.size} unique products`);
  
  for (const [asin, data] of asins) {
    deals.push({
      id: asin,
      asin,
      title: `Product ${asin}`, // Would need more parsing for real title
      url: `https://www.amazon.com/dp/${asin}`,
      affiliateUrl: `https://www.amazon.com/dp/${asin}?tag=${config.affiliateTag}`,
      category,
      source: 'amazon',
      discount: 0,
      price: 0,
      originalPrice: 0,
    });
  }
  
  return deals;
}

async function scrapeAmazonDeals(category) {
  console.log(`\n=== Scraping Amazon: ${category.name} ===`);
  
  const deals = [];
  
  for (const keyword of category.keywords) {
    const searchUrl = `https://www.amazon.com/s?k=${encodeURIComponent(keyword)}&rh=p_72:2661618011&s=price-desc-rank`;
    
    console.log(`Searching: ${keyword}`);
    
    try {
      const tab = await createTab(searchUrl);
      if (!tab.tabId) {
        console.error('Failed to create tab');
        continue;
      }
      
      // Wait for page load
      await new Promise(r => setTimeout(r, 3000));
      
      const snapshot = await getSnapshot(tab.tabId);
      const categoryDeals = extractDealsFromSnapshot(snapshot, category.name);
      deals.push(...categoryDeals);
      
      console.log(`Found ${categoryDeals.length} deals for ${keyword}`);
      
      await closeTab(tab.tabId);
      
      // Rate limiting
      await new Promise(r => setTimeout(r, 2000));
      
    } catch (e) {
      console.error(`Error: ${e.message}`);
    }
    
    // Only scrape first keyword for now to test
    break;
  }
  
  return deals;
}

async function scrapeAmazonWarehouse() {
  console.log('\n=== Scraping Amazon Warehouse ===');
  
  const warehouseUrl = 'https://www.amazon.com/Warehouse-Deals/b?ie=UTF8&node=10158976011';
  
  try {
    const tab = await createTab(warehouseUrl);
    if (!tab.tabId) {
      console.error('Failed to create tab');
      return [];
    }
    
    await new Promise(r => setTimeout(r, 4000));
    
    const snapshot = await getSnapshot(tab.tabId);
    console.log('Warehouse page loaded');
    
    await closeTab(tab.tabId);
    
    return [];
  } catch (e) {
    console.error(`Error: ${e.message}`);
    return [];
  }
}

export async function runScraper(categoryName = null) {
  console.log('Starting Amazon Deal Scraper...');
  console.log(`Time: ${new Date().toISOString()}`);
  
  const categories = categoryName 
    ? config.categories.filter(c => c.name === categoryName)
    : config.categories;
  
  const allDeals = [];
  
  // Scrape by category
  for (const category of categories) {
    try {
      const deals = await scrapeAmazonDeals(category);
      allDeals.push(...deals);
    } catch (e) {
      console.error(`Failed ${category.name}:`, e.message);
    }
  }
  
  // Save deals
  if (allDeals.length > 0) {
    const saved = store.saveDeals(allDeals);
    console.log(`\nSaved ${saved} deals`);
  }
  
  // Show stats
  console.log('\nStats:', store.getStats());
  
  return allDeals;
}

// CLI
const [,, cmd, ...args] = process.argv;

if (import.meta.url === `file://${process.argv[1]}`) {
  if (cmd === 'run') {
    runScraper(args[0]).then(() => process.exit(0));
  } else if (cmd === 'warehouse') {
    scrapeAmazonWarehouse().then(() => process.exit(0));
  } else if (cmd === 'stats') {
    console.log(store.getStats());
  } else if (cmd === 'list') {
    console.log(JSON.stringify(store.getDeals(args[0]), null, 2));
  } else {
    console.log('Usage: node scrape-amazon.js run [category]');
    console.log('       node scrape-amazon.js warehouse');
    console.log('       node scrape-amazon.js stats');
    console.log('       node scrape-amazon.js list [category]');
  }
}
