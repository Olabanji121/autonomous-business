import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR = '/home/obanj/smart/projects/deal-hunter/data';

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function loadData(file) {
  const filepath = path.join(DATA_DIR, file);
  if (!fs.existsSync(filepath)) return [];
  try {
    return JSON.parse(fs.readFileSync(filepath, 'utf-8'));
  } catch {
    return [];
  }
}

function saveData(file, data) {
  ensureDir(DATA_DIR);
  const filepath = path.join(DATA_DIR, file);
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
}

export function getDeals(category = null) {
  const deals = loadData('deals.json');
  if (category) {
    return deals.filter(d => d.category === category);
  }
  return deals;
}

export function getDeal(id) {
  const deals = loadData('deals.json');
  return deals.find(d => d.id === id) || null;
}

export function saveDeal(deal) {
  const deals = loadData('deals.json');
  const existingIdx = deals.findIndex(d => d.id === deal.id);
  
  if (existingIdx >= 0) {
    deals[existingIdx] = { ...deals[existingIdx], ...deal, updatedAt: new Date().toISOString() };
  } else {
    deals.push({
      ...deal,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
  
  saveData('deals.json', deals);
  return deal;
}

export function saveDeals(newDeals) {
  const deals = loadData('deals.json');
  const dealMap = new Map(deals.map(d => [d.id, d]));
  
  for (const deal of newDeals) {
    dealMap.set(deal.id, {
      ...dealMap.get(deal.id),
      ...deal,
      updatedAt: new Date().toISOString(),
      createdAt: dealMap.get(deal.id)?.createdAt || new Date().toISOString(),
    });
  }
  
  saveData('deals.json', Array.from(dealMap.values()));
  return newDeals.length;
}

export function markPosted(id, channel) {
  const deals = loadData('deals.json');
  const idx = deals.findIndex(d => d.id === id);
  if (idx >= 0) {
    deals[idx].posted = deals[idx].posted || {};
    deals[idx].posted[channel] = new Date().toISOString();
    saveData('deals.json', deals);
  }
}

export function getUnposted(category = null, limit = 10) {
  const deals = loadData('deals.json');
  return deals
    .filter(d => !d.posted?.blog)
    .filter(d => category ? d.category === category : true)
    .sort((a, b) => (b.discount || 0) - (a.discount || 0))
    .slice(0, limit);
}

export function cleanOldDeals(maxDeals = 1000) {
  const deals = loadData('deals.json');
  if (deals.length <= maxDeals) return 0;
  
  // Keep deals that haven't expired yet, then by recency
  const now = Date.now();
  const sorted = deals.sort((a, b) => {
    const aExpired = a.expiresAt ? new Date(a.expiresAt).getTime() < now : false;
    const bExpired = b.expiresAt ? new Date(b.expiresAt).getTime() < now : false;
    if (aExpired !== bExpired) return aExpired ? 1 : -1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
  
  const kept = sorted.slice(0, maxDeals);
  saveData('deals.json', kept);
  return deals.length - kept.length;
}

export function getStats() {
  const deals = loadData('deals.json');
  const now = Date.now();
  
  const byCategory = {};
  const posted = { blog: 0, twitter: 0, telegram: 0 };
  let active = 0;
  
  for (const d of deals) {
    byCategory[d.category] = (byCategory[d.category] || 0) + 1;
    if (!d.expiresAt || new Date(d.expiresAt).getTime() > now) active++;
    if (d.posted?.blog) posted.blog++;
    if (d.posted?.twitter) posted.twitter++;
    if (d.posted?.telegram) posted.telegram++;
  }
  
  return {
    total: deals.length,
    active,
    byCategory,
    posted,
  };
}
