#!/usr/bin/env node
import { build, addTool, listTools, getTool } from './directory.js';

const [,, cmd, ...args] = process.argv;

switch (cmd) {
  case 'build':
    build();
    break;
  case 'add':
    const [name, category, url, pricing, description] = args;
    if (!name || !category || !url) {
      console.log('Usage: ai-dir add "Name" "category" "url" "pricing" "description"');
      process.exit(1);
    }
    addTool({ name, category, url, pricing, description });
    break;
  case 'list':
    const tools = listTools();
    console.log(`\n${tools.length} tools:\n`);
    for (const t of tools) {
      console.log(`  ${t.featured ? '⭐' : '  '} ${t.name} - ${t.category} - ${t.pricing || 'N/A'}`);
    }
    break;
  case 'seed':
    // Import and run seed
    await import('./directory.js').then(m => m.seed && m.seed());
    break;
  default:
    console.log(`
AI Tool Directory CLI

Usage:
  ai-dir build          Build static site
  ai-dir add <name> <category> <url> [pricing] [description]
  ai-dir list           List all tools
  ai-dir seed           Add sample tools
`);
}
