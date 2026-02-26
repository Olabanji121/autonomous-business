#!/usr/bin/env node
import { spawn } from 'child_process';
import * as store from './deal-store.js';
import { config } from './config.js';

const [,, cmd, ...args] = process.argv;

function log(msg) {
  const ts = new Date().toISOString().split('T')[1].split('.')[0];
  console.log(`[${ts}] ${msg}`);
}

function runScript(script, args = []) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', [script, ...args], {
      cwd: '/home/obanj/smart/projects/deal-hunter/src',
      stdio: 'inherit'
    });
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Script exited ${code}`));
    });
  });
}

async function scrape(category) {
  log('Starting scrape...');
  await runScript('scrape-amazon.js', ['run', category].filter(Boolean));
}

async function post() {
  log('Generating blog post...');
  await runScript('generate-content.js', ['post']);
}

async function tweet() {
  log('Generating tweet...');
  await runScript('generate-content.js', ['tweet']);
}

async function digest() {
  log('Generating daily digest...');
  await runScript('generate-content.js', ['digest']);
}

function stats() {
  console.log('\n=== Deal Hunter Stats ===\n');
  const s = store.getStats();
  console.log(`Total deals: ${s.total}`);
  console.log(`Active deals: ${s.active}`);
  console.log(`\nBy category:`);
  for (const [cat, count] of Object.entries(s.byCategory)) {
    console.log(`  ${cat}: ${count}`);
  }
  console.log(`\nPosted:`);
  console.log(`  Blog: ${s.posted.blog}`);
  console.log(`  Twitter: ${s.posted.twitter}`);
  console.log(`  Telegram: ${s.posted.telegram}`);
}

function list(category) {
  const deals = store.getDeals(category).slice(0, 20);
  console.log(`\n=== Deals ${category ? `(${category})` : ''} ===\n`);
  for (const d of deals) {
    const price = d.price ? `$${d.price}` : 'N/A';
    const posted = d.posted?.blog ? '✓' : '○';
    console.log(`${posted} ${d.id.slice(0, 12)} ${price.padEnd(8)} ${d.title?.slice(0, 40) || 'No title'}`);
  }
}

function watch(intervalMinutes = 60) {
  log(`Starting watch mode (every ${intervalMinutes} min)`);
  
  async function tick() {
    try {
      log('Running scheduled scrape...');
      await scrape();
      log('Scrape complete');
    } catch (e) {
      log(`Error: ${e.message}`);
    }
  }
  
  tick();
  setInterval(tick, intervalMinutes * 60 * 1000);
}

async function main() {
  switch (cmd) {
    case 'scrape':
      await scrape(args[0]);
      break;
    case 'post':
      await post();
      break;
    case 'tweet':
      await tweet();
      break;
    case 'digest':
      await digest();
      break;
    case 'stats':
      stats();
      break;
    case 'list':
      list(args[0]);
      break;
    case 'watch':
      watch(parseInt(args[0]) || 60);
      break;
    case 'add':
      // Manually add a deal
      const deal = {
        id: args[0],
        title: args[1],
        price: parseFloat(args[2]) || 0,
        originalPrice: parseFloat(args[3]) || 0,
        category: args[4] || 'tech',
        affiliateUrl: `https://www.amazon.com/dp/${args[0]}?tag=${config.affiliateTag}`,
        url: `https://www.amazon.com/dp/${args[0]}`,
        asin: args[0],
        source: 'manual',
      };
      store.saveDeal(deal);
      log(`Added deal: ${deal.id}`);
      break;
    default:
      console.log(`
Deal Hunter CLI

Usage:
  deals scrape [category]    Scrape Amazon for deals
  deals post                 Generate blog post for next deal
  deals tweet                Generate tweet for next deal  
  deals digest               Generate daily digest
  deals stats                Show statistics
  deals list [category]      List deals
  deals watch [minutes]      Run scraper on interval
  deals add <asin> <title> <price> <origPrice> <category>
                             Manually add a deal
`);
  }
}

main().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
