#!/usr/bin/env node
// Traffic Generator - Posts deals to multiple channels
// Run daily after updating deals

import { readFileSync } from 'fs';

const DATA_FILE = '/home/obanj/smart/projects/deal-hunter/data/deals.json';
const SITE_URL = 'https://blog-virid-ten-82.vercel.app';

function loadDeals() {
  try {
    return JSON.parse(readFileSync(DATA_FILE, 'utf-8'));
  } catch (e) {
    return [];
  }
}

function getTopDeals(deals, limit = 5) {
  return deals
    .sort((a, b) => (b.discount || 0) - (a.discount || 0))
    .slice(0, limit);
}

// Generate Reddit post
function generateRedditPost(deals) {
  const topDeals = getTopDeals(deals, 5);
  
  let post = `🔥 **Today's Best Amazon Australia Deals** (${new Date().toLocaleDateString('en-AU')})\n\n`;
  
  topDeals.forEach((deal, i) => {
    const savings = (deal.originalPrice - deal.price).toFixed(2);
    post += `${i + 1}. **${deal.title.slice(0, 80)}${deal.title.length > 80 ? '...' : ''}**\n`;
    post += `   💰 A$${deal.price.toFixed(2)} (was A$${deal.originalPrice.toFixed(2)}) - **${deal.discount}% OFF**\n`;
    post += `   🔗 [Get Deal](https://www.amazon.com.au/dp/${deal.id}?tag=your-tag-20)\n\n`;
  });
  
  post += `\n---\n`;
  post += `✅ All deals verified and updated daily\n`;
  post += `📱 More deals: ${SITE_URL}\n`;
  post += `\n*I am a bot, deals are automatically curated*`;
  
  return post;
}

// Generate Twitter thread
function generateTwitterThread(deals) {
  const topDeals = getTopDeals(deals, 4);
  
  const tweets = [];
  
  // First tweet
  tweets.push({
    text: `🔥 ${topDeals.length} HOT Amazon Australia deals today!\n\nUp to ${Math.max(...topDeals.map(d => d.discount))}% off\n\nThread 🧵👇\n\n#AussieDeals #AmazonAustralia #Bargains`
  });
  
  // Deal tweets
  topDeals.forEach(deal => {
    const text = `⚡ ${deal.discount}% OFF\n\n${deal.title.slice(0, 70)}...\n\nA$${deal.price.toFixed(2)} (was A$${deal.originalPrice.toFixed(2)})\n\n🔗 ${SITE_URL}\n\n#AmazonAU #DealAlert`;
    tweets.push({ text: text.slice(0, 280) });
  });
  
  // Final tweet
  tweets.push({
    text: `✅ More daily deals: ${SITE_URL}\n\nFollow for daily bargains! 🔥\n\n#AussieDeals #AmazonAustralia`
  });
  
  return tweets;
}

// Generate Telegram message
function generateTelegramPost(deals) {
  const topDeals = getTopDeals(deals, 5);
  
  let msg = `<b>🔥 TODAY'S TOP AMAZON AU DEALS</b>\n`;
  msg += `<i>${new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}</i>\n\n`;
  
  topDeals.forEach((deal, i) => {
    const savings = (deal.originalPrice - deal.price).toFixed(2);
    msg += `<b>${i + 1}.</b> ${deal.title.slice(0, 60)}${deal.title.length > 60 ? '...' : ''}\n`;
    msg += `💰 <b>A$${deal.price.toFixed(2)}</b> ~ <s>A$${deal.originalPrice.toFixed(2)}</s> (${deal.discount}% OFF)\n`;
    msg += `<a href="https://www.amazon.com.au/dp/${deal.id}?tag=your-tag-20">Grab Deal →</a>\n\n`;
  });
  
  msg += `\n<a href="${SITE_URL}">🌐 View All ${deals.length} Deals</a>`;
  
  return msg;
}

// Generate Facebook post
function generateFacebookPost(deals) {
  const topDeals = getTopDeals(deals, 3);
  
  let post = `🔥 HOT AMAZON AUSTRALIA DEALS 🔥\n\n`;
  post += `Here are today's best bargains:\n\n`;
  
  topDeals.forEach((deal, i) => {
    post += `${i + 1}. ${deal.title.slice(0, 60)}... - ${deal.discount}% OFF!\n`;
    post += `   A$${deal.price.toFixed(2)} (was A$${deal.originalPrice.toFixed(2)})\n\n`;
  });
  
  post += `\n👉 See all deals: ${SITE_URL}\n\n`;
  post += `#AmazonAustralia #AussieDeals #Bargains #OnlineShopping`;
  
  return post;
}

// CLI
const [,, cmd] = process.argv;

const deals = loadDeals();

if (deals.length === 0) {
  console.log('No deals found. Run scraper first.');
  process.exit(1);
}

switch (cmd) {
  case 'reddit':
    console.log('=== REDDIT POST ===\n');
    console.log(generateRedditPost(deals));
    break;
    
  case 'twitter':
    console.log('=== TWITTER THREAD ===\n');
    generateTwitterThread(deals).forEach((t, i) => {
      console.log(`\n--- Tweet ${i + 1} (${t.text.length} chars) ---\n`);
      console.log(t.text);
    });
    break;
    
  case 'telegram':
    console.log('=== TELEGRAM POST ===\n');
    console.log(generateTelegramPost(deals));
    break;
    
  case 'facebook':
    console.log('=== FACEBOOK POST ===\n');
    console.log(generateFacebookPost(deals));
    break;
    
  case 'all':
    console.log('=== REDDIT ===\n');
    console.log(generateRedditPost(deals));
    console.log('\n\n=== TWITTER ===\n');
    generateTwitterThread(deals).forEach((t, i) => {
      console.log(`\n--- Tweet ${i + 1} ---\n${t.text}`);
    });
    console.log('\n\n=== TELEGRAM ===\n');
    console.log(generateTelegramPost(deals));
    break;
    
  default:
    console.log(`
Traffic Generator

Usage:
  node traffic.js reddit    Generate Reddit post
  node traffic.js twitter   Generate Twitter thread
  node traffic.js telegram  Generate Telegram post
  node traffic.js facebook  Generate Facebook post
  node traffic.js all        Generate all formats
`);
}
