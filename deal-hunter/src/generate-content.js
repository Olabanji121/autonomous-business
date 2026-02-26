#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import * as store from './deal-store.js';
import { config } from './config.js';

const BLOG_DIR = '/home/obanj/smart/projects/deal-hunter/blog';

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function formatPrice(price) {
  return `$${parseFloat(price).toFixed(2)}`;
}

function generateDealPost(deal) {
  const title = deal.title || `Amazon Deal: ${formatPrice(deal.price)}`;
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
  
  const discount = deal.originalPrice > 0 
    ? Math.round((1 - deal.price / deal.originalPrice) * 100)
    : deal.discount || 0;
  
  const frontmatter = {
    title,
    date: new Date().toISOString().split('T')[0],
    category: deal.category,
    price: deal.price,
    originalPrice: deal.originalPrice,
    discount,
    affiliateUrl: deal.affiliateUrl,
    asin: deal.asin,
    source: deal.source,
  };
  
  const content = `---
${Object.entries(frontmatter).map(([k, v]) => `${k}: ${typeof v === 'string' ? `"${v}"` : v}`).join('\n')}
---

# ${title}

${deal.description || ''}

## Deal Details

- **Price:** ${formatPrice(deal.price)} ${deal.originalPrice > deal.price ? `(was ${formatPrice(deal.originalPrice)})` : ''}
- **Discount:** ${discount}% off
- **Category:** ${deal.category}

## Why This Deal?

${deal.rating ? `⭐ ${deal.rating}/5 rating (${deal.reviews || 'N/A'} reviews)` : 'Check reviews on Amazon'}

[**Get This Deal**](${deal.affiliateUrl}){: .btn .btn-primary}

---
*Prices and availability are accurate as of the date/time indicated and are subject to change.*
`;

  return { slug, content, frontmatter };
}

export function generateBlogPost(deal) {
  ensureDir(BLOG_DIR);
  ensureDir(path.join(BLOG_DIR, '_posts'));
  
  const { slug, content, frontmatter } = generateDealPost(deal);
  const date = new Date().toISOString().split('T')[0];
  const filename = `${date}-${slug}.md`;
  const filepath = path.join(BLOG_DIR, '_posts', filename);
  
  fs.writeFileSync(filepath, content);
  
  console.log(`Created: ${filename}`);
  
  store.markPosted(deal.id, 'blog');
  
  return { filename, filepath, frontmatter };
}

export function generateTweet(deal) {
  const discount = deal.originalPrice > 0 
    ? Math.round((1 - deal.price / deal.originalPrice) * 100)
    : deal.discount || 0;
  
  const emoji = discount >= 50 ? '🔥' : discount >= 30 ? '⚡' : '💰';
  
  const tweet = `${emoji} ${deal.title?.slice(0, 80) || 'Amazon Deal'}

${formatPrice(deal.price)} ${discount > 0 ? `(${discount}% OFF!)` : ''}

${deal.affiliateUrl}

#deals #${deal.category}`;

  return tweet.slice(0, 280); // Twitter limit
}

export function generateTelegram(deal) {
  const discount = deal.originalPrice > 0 
    ? Math.round((1 - deal.price / deal.originalPrice) * 100)
    : deal.discount || 0;
  
  return `<b>🛒 ${deal.title?.slice(0, 100) || 'Amazon Deal'}</b>

💰 Price: ${formatPrice(deal.price)}
${discount > 0 ? `🏷 Discount: ${discount}% OFF\n` : ''}📦 Category: ${deal.category}

<a href="${deal.affiliateUrl}">Get This Deal →</a>`;
}

export function generateDailyDigest(deals, format = 'blog') {
  if (deals.length === 0) {
    console.log('No deals to generate digest');
    return null;
  }
  
  const date = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  if (format === 'blog') {
    const topDeals = deals.slice(0, 10);
    
    const content = `---
title: "Top ${topDeals.length} Deals of the Day - ${date}"
date: "${new Date().toISOString().split('T')[0]}"
layout: digest
---

# 🛒 Top ${topDeals.length} Deals of the Day

*${date}*

${topDeals.map((d, i) => `## ${i + 1}. ${d.title || 'Amazon Deal'}

- **Price:** ${formatPrice(d.price)} ${d.originalPrice > d.price ? `(was ${formatPrice(d.originalPrice)})` : ''}
- **Discount:** ${d.discount || 0}% off
- [Get Deal](${d.affiliateUrl})

`).join('\n')}

---

*Affiliate links above. Prices may change.*
`;

    const filename = `${new Date().toISOString().split('T')[0]}-daily-digest.md`;
    const filepath = path.join(BLOG_DIR, '_posts', filename);
    
    ensureDir(path.dirname(filepath));
    fs.writeFileSync(filepath, content);
    
    console.log(`Created daily digest: ${filename}`);
    return filepath;
  }
  
  return null;
}

// CLI
const [,, cmd, ...args] = process.argv;

if (cmd === 'post') {
  const deals = store.getUnposted(null, 1);
  if (deals.length > 0) {
    generateBlogPost(deals[0]);
  } else {
    console.log('No unposted deals');
  }
} else if (cmd === 'tweet') {
  const deals = store.getUnposted(null, 1);
  if (deals.length > 0) {
    console.log(generateTweet(deals[0]));
  }
} else if (cmd === 'telegram') {
  const deals = store.getUnposted(null, 1);
  if (deals.length > 0) {
    console.log(generateTelegram(deals[0]));
  }
} else if (cmd === 'digest') {
  const deals = store.getUnposted(null, 10);
  generateDailyDigest(deals);
} else {
  console.log('Usage: node generate-content.js post|tweet|telegram|digest');
}
