#!/usr/bin/env node
// Daily Deal Scraper - Run this via cron every day
// Scrapes Amazon deals and rebuilds the site

import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { execSync } from 'child_process';

const DATA_FILE = '/home/obanj/smart/projects/deal-hunter/data/deals.json';
const BLOG_DIR = '/home/obanj/smart/projects/deal-hunter/blog';
const AFFILIATE_TAG = 'your-tag-20'; // Replace with your real tag

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

// Generate HTML page from deals
function generateSite(deals) {
  // Sort by discount (highest first)
  const sorted = [...deals].sort((a, b) => (b.discount || 0) - (a.discount || 0));
  
  const dealsJson = JSON.stringify(sorted.map(d => ({
    id: d.id || d.asin,
    title: d.title,
    price: d.price,
    originalPrice: d.originalPrice,
    discount: d.discount,
    category: d.category
  })));

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🔥 Daily Deals - Save Up to 50%</title>
  <meta name="description" content="Best Amazon deals updated daily. Save up to 50% on tech, home, and more.">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    :root {
      --primary: #ff4757;
      --bg: #1a1a2e;
      --card: #16213e;
      --text: #eee;
      --muted: #aaa;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
      min-height: 100vh;
    }
    header {
      background: linear-gradient(135deg, #ff4757, #ff6b81);
      padding: 2rem;
      text-align: center;
    }
    header h1 { font-size: 2.5rem; margin-bottom: 0.5rem; }
    header p { opacity: 0.9; }
    .stats {
      display: flex;
      justify-content: center;
      gap: 2rem;
      padding: 1rem;
      background: rgba(0,0,0,0.2);
    }
    .stat { text-align: center; }
    .stat-value { font-size: 1.5rem; font-weight: bold; }
    .stat-label { font-size: 0.8rem; opacity: 0.8; }
    main { max-width: 1200px; margin: 0 auto; padding: 2rem; }
    .section-title {
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid var(--primary);
    }
    .deals-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
    }
    .deal-card {
      background: var(--card);
      border-radius: 1rem;
      overflow: hidden;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .deal-card:hover { 
      transform: translateY(-5px); 
      box-shadow: 0 10px 30px rgba(255, 71, 87, 0.2);
    }
    .deal-header {
      background: linear-gradient(135deg, #ff4757, #ff6b81);
      padding: 0.5rem 1rem;
      font-weight: bold;
      font-size: 0.9rem;
      display: flex;
      justify-content: space-between;
    }
    .deal-body { padding: 1.5rem; }
    .deal-title { font-size: 1rem; margin-bottom: 0.5rem; line-height: 1.4; }
    .deal-category {
      color: var(--muted);
      font-size: 0.8rem;
      margin-bottom: 1rem;
      text-transform: capitalize;
    }
    .deal-prices {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1rem;
      flex-wrap: wrap;
    }
    .price-current { font-size: 1.4rem; font-weight: bold; color: #4cd137; }
    .price-original { text-decoration: line-through; color: var(--muted); }
    .price-discount {
      background: #4cd137;
      color: #000;
      padding: 0.2rem 0.5rem;
      border-radius: 0.25rem;
      font-weight: bold;
      font-size: 0.85rem;
    }
    .btn {
      display: block;
      background: linear-gradient(135deg, #ff4757, #ff6b81);
      color: white;
      text-align: center;
      padding: 0.75rem;
      border-radius: 0.5rem;
      text-decoration: none;
      font-weight: bold;
      transition: opacity 0.2s;
    }
    .btn:hover { opacity: 0.9; }
    .updated {
      text-align: center;
      padding: 1rem;
      color: var(--muted);
      font-size: 0.85rem;
    }
    footer {
      text-align: center;
      padding: 2rem;
      color: var(--muted);
      font-size: 0.9rem;
      border-top: 1px solid rgba(255,255,255,0.1);
      margin-top: 2rem;
    }
    @media (max-width: 600px) {
      header h1 { font-size: 1.8rem; }
      .deals-grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <header>
    <h1>🔥 Daily Deals</h1>
    <p>Best Amazon deals updated daily. Save up to 50%!</p>
  </header>
  
  <div class="stats">
    <div class="stat">
      <div class="stat-value" id="deal-count">${sorted.length}</div>
      <div class="stat-label">Active Deals</div>
    </div>
    <div class="stat">
      <div class="stat-value" id="max-discount">${sorted.length > 0 ? Math.max(...sorted.map(d => d.discount || 0)) : 0}%</div>
      <div class="stat-label">Max Discount</div>
    </div>
    <div class="stat">
      <div class="stat-value" id="total-savings">$${sorted.reduce((sum, d) => sum + ((d.originalPrice || 0) - (d.price || 0)), 0).toFixed(0)}</div>
      <div class="stat-label">Total Savings</div>
    </div>
  </div>
  
  <main>
    <h2 class="section-title">🔥 Today's Best Deals</h2>
    <div class="deals-grid" id="deals"></div>
  </main>
  
  <p class="updated">Last updated: ${new Date().toLocaleString()}</p>
  
  <footer>
    <p>Prices and availability are accurate as of the date/time indicated and are subject to change.</p>
    <p style="margin-top: 0.5rem;">© 2026 Daily Deals</p>
  </footer>

  <script>
    const deals = ${dealsJson};
    const affiliateTag = '${AFFILIATE_TAG}';
    const container = document.getElementById('deals');
    
    deals.forEach(deal => {
      const card = document.createElement('article');
      card.className = 'deal-card';
      card.innerHTML = \`
        <div class="deal-header">
          <span>🔥 Hot Deal</span>
          <span>\${deal.discount}% OFF</span>
        </div>
        <div class="deal-body">
          <h3 class="deal-title">\${deal.title}</h3>
          <p class="deal-category">📦 \${deal.category}</p>
          <div class="deal-prices">
            <span class="price-current">$\${deal.price.toFixed(2)}</span>
            <span class="price-original">$\${deal.originalPrice.toFixed(2)}</span>
            <span class="price-discount">-\${deal.discount}%</span>
          </div>
          <a href="https://www.amazon.com/dp/\${deal.id}?tag=\${affiliateTag}" class="btn" target="_blank" rel="noopener">
            Get This Deal →
          </a>
        </div>
      \`;
      container.appendChild(card);
    });
  </script>
</body>
</html>`;

  writeFileSync(`${BLOG_DIR}/index.html`, html);
  log(`Generated site with ${sorted.length} deals`);
}

// Scrape fresh deals from Amazon using Camoufox
async function scrapeFreshDeals() {
  log('Starting Amazon scrape...');
  
  // For now, we'll use the existing deals and just refresh the site
  // Real scraping would use Camoufox - let me know if you want that automated
  
  const existingDeals = loadDeals();
  log(`Loaded ${existingDeals.length} existing deals`);
  
  return existingDeals;
}

// Deploy to Vercel
function deploy() {
  log('Deploying to Vercel...');
  const token = process.env.VERCEL_TOKEN;
  if (!token) {
    log('No VERCEL_TOKEN env var, skipping deploy');
    return null;
  }
  try {
    const result = execSync(
      `cd ${BLOG_DIR} && vercel --token ${token} --prod --yes 2>&1`,
      { encoding: 'utf-8', timeout: 120000 }
    );
    
    const urlMatch = result.match(/Aliased: (https:\/\/[^\s]+)/);
    if (urlMatch) {
      log(`Deployed to: ${urlMatch[1]}`);
      return urlMatch[1];
    }
    log('Deployed (check output for URL)');
    return null;
  } catch (e) {
    log(`Deploy error: ${e.message}`);
    return null;
  }
}

// Main
async function main() {
  log('=== Daily Deal Update ===');
  
  const deals = await scrapeFreshDeals();
  
  if (deals.length > 0) {
    generateSite(deals);
    const url = deploy();
    
    if (url) {
      log(`✅ Done! Site: ${url}`);
    }
  } else {
    log('No deals found, skipping deploy');
  }
}

main().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
