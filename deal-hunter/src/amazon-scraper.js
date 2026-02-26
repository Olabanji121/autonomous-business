#!/usr/bin/env node
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { config } from './config.js';
import * as store from './deal-store.js';

const CAMOFOX_HOST = 'http://localhost:9222';

async function fetchPage(url) {
  // Use camofox if available, otherwise curl with headers
  return new Promise((resolve, reject) => {
    const curl = spawn('curl', [
      '-s', '-L',
      '-H', 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      '-H', 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      '-H', 'Accept-Language: en-US,en;q=0.5',
      '-H', 'Accept-Encoding: gzip, deflate',
      '--compressed',
      url
    ]);
    
    let output = '';
    curl.stdout.on('data', (d) => output += d);
    curl.stderr.on('data', () => {});
    curl.on('close', (code) => {
      if (code === 0) resolve(output);
      else reject(new Error(`curl exited ${code}`));
    });
  });
}

function parseAmazonDeals(html, category) {
  const deals = [];
  
  // Parse deal cards from Amazon Warehouse/Deals pages
  // This is a simplified parser - real implementation needs more robust parsing
  
  const dealPattern = /data-asin="([A-Z0-9]+)"[^>]*>[\s\S]*?<a[^>]*href="([^"]*)"[^>]*>([^<]+)<\/a>/g;
  const pricePattern = /\$([0-9,.]+)/g;
  const originalPricePattern = /class="[^"]*a-text-strike[^"]*"[^>]*>\$([0-9,.]+)/;
  const currentPricePattern = /class="[^"]*a-price-whole[^"]*">([0-9,.]+)</;
  const ratingPattern = /([0-9.]+)\s*out of\s*5\s*stars/;
  const reviewPattern = /([0-9,]+)\s*ratings/;
  
  // Alternative: parse JSON-LD data
  const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g);
  
  // For now, extract what we can
  const asinMatches = html.matchAll(/data-asin="([A-Z0-9]+)"/g);
  const asins = new Set();
  for (const match of asinMatches) {
    asins.add(match[1]);
  }
  
  // Extract product titles
  const titleMatches = html.matchAll(/<span[^>]*class="[^"]*a-text-normal[^"]*"[^>]*>([^<]{10,200})<\/span>/g);
  const titles = [];
  for (const match of titleMatches) {
    titles.push(match[1].trim());
  }
  
  console.log(`Found ${asins.size} ASINs, ${titles.length} titles for ${category}`);
  
  return deals;
}

function generateAffiliateLink(asin) {
  return `https://www.amazon.com/dp/${asin}?tag=${config.affiliateTag}`;
}

async function scrapeCategory(category) {
  console.log(`Scraping ${category.name}...`);
  
  const deals = [];
  
  for (const keyword of category.keywords.slice(0, 2)) {
    const url = `https://www.amazon.com/s?k=${encodeURIComponent(keyword)}&i=electronics&rh=p_6%3AATVPDKIKX0DER&s=price-desc-rank&deals&=p_72%3A2661618011`;
    
    try {
      const html = await fetchPage(url);
      const categoryDeals = parseAmazonDeals(html, category.name);
      deals.push(...categoryDeals);
      
      // Be nice to Amazon
      await new Promise(r => setTimeout(r, 2000 + Math.random() * 2000));
    } catch (e) {
      console.error(`Error scraping ${keyword}:`, e.message);
    }
  }
  
  return deals;
}

async function scrapeWithBrowser(category) {
  // Use Camoufox for better anti-detection
  // This would use the camofox tools
  
  console.log(`[Browser] Would scrape ${category.name} via Camoufox`);
  return [];
}

export async function scrapeAll() {
  console.log('Starting deal scrape...');
  const allDeals = [];
  
  for (const category of config.categories) {
    try {
      const deals = await scrapeCategory(category);
      allDeals.push(...deals);
    } catch (e) {
      console.error(`Failed to scrape ${category.name}:`, e.message);
    }
  }
  
  if (allDeals.length > 0) {
    const saved = store.saveDeals(allDeals);
    console.log(`Saved ${saved} deals`);
  }
  
  return allDeals;
}

export async function scrapeDeals(categoryName = null) {
  const categories = categoryName 
    ? config.categories.filter(c => c.name === categoryName)
    : config.categories;
  
  const allDeals = [];
  
  for (const category of categories) {
    const deals = await scrapeCategory(category);
    allDeals.push(...deals);
  }
  
  return allDeals;
}

// CLI
const [,, cmd, ...args] = process.argv;

if (cmd === 'run') {
  scrapeAll().then(() => {
    console.log(store.getStats());
    process.exit(0);
  });
} else if (cmd === 'stats') {
  console.log(store.getStats());
} else if (cmd === 'list') {
  const category = args[0];
  console.log(JSON.stringify(store.getDeals(category), null, 2));
} else if (cmd === 'unposted') {
  const limit = parseInt(args[0]) || 10;
  console.log(JSON.stringify(store.getUnposted(null, limit), null, 2));
}
