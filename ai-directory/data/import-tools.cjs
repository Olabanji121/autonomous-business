const fs = require('fs');

const tools = [
  // From Product Hunt Today
  { name: 'GPT Realtime 1.5', category: 'code', url: 'https://openai.com', pricing: 'Paid', description: 'Tighter instruction adherence in speech agents by OpenAI', featured: true },
  { name: 'Seedream 5.0 Lite', category: 'image', url: 'https://pixeldance.ai', pricing: 'Freemium', description: 'The next generation of AI image creation' },
  { name: 'DeltaMemory', category: 'code', url: 'https://deltamemory.ai', pricing: 'Paid', description: 'Fastest cognitive memory for AI Agents' },
  { name: 'Wispr Flow', category: 'productivity', url: 'https://wispr.ai', pricing: 'Freemium', description: 'Dictation that works everywhere. Stop typing. Start speaking. 4x faster.', featured: true },
  { name: 'Universal-3 Pro', category: 'audio', url: 'https://assemblyai.com', pricing: 'Paid', description: 'Speech-to-text that finally understands context', featured: true },
  { name: 'Wordwand', category: 'writing', url: 'https://wordwand.ai', pricing: 'Freemium', description: 'AI anywhere you type. 10x your productivity' },
  { name: 'Zavi AI', category: 'productivity', url: 'https://zavi.ai', pricing: 'Freemium', description: 'Voice keyboard that edits your text and takes action for you' },
  { name: 'Digital Twin by Read AI', category: 'productivity', url: 'https://read.ai', pricing: 'Freemium', description: 'Let your digital twin handle your meetings and emails' },
  { name: 'Playground by Natoma', category: 'code', url: 'https://natoma.ai', pricing: 'Free', description: 'Simple, fast way to find and try any MCP server. No setup.' },
  { name: 'Tessl', category: 'code', url: 'https://tessl.ai', pricing: 'Paid', description: 'Evaluate agent skills, ship 3× better code' },
  { name: 'Rover by rtrvr.ai', category: 'code', url: 'https://rtrvr.ai', pricing: 'Freemium', description: 'Turn your website into an AI agent with one script tag' },
  { name: 'CodeWords UI', category: 'code', url: 'https://codewords.ai', pricing: 'Paid', description: 'Bring your automations to life with AI' },
  
  // From Yesterday
  { name: 'KiloClaw', category: 'code', url: 'https://kiloclau.com', pricing: 'Paid', description: 'Hosted OpenClaw. No Mac mini required.', featured: true },
  { name: 'Notion Custom Agents', category: 'productivity', url: 'https://notion.so', pricing: 'Paid', description: 'Anything you can do in Notion, your Agent can do for you', featured: true },
  { name: 'Opal 2.0', category: 'chat', url: 'https://labs.google', pricing: 'Free', description: 'Google Labs AI with smart agent, memory, routing and interactive chat' },
  { name: 'Ask Fellow', category: 'productivity', url: 'https://fellow.app', pricing: 'Paid', description: 'Automate post-meeting actions from documentation to emails' },
  
  // From Last Week
  { name: 'Rork Max', category: 'code', url: 'https://rork.app', pricing: 'Paid', description: 'Best AI for iOS apps. Website that replaces Xcode', featured: true },
  { name: 'Base44 Backend Platform', category: 'code', url: 'https://base44.io', pricing: 'Freemium', description: 'The Backend for the age of AI' },
  { name: 'Sonnet 4.6', category: 'chat', url: 'https://anthropic.com', pricing: 'Paid', description: 'The most capable Sonnet model yet by Anthropic', featured: true },
  { name: 'Gemini 3.1 Pro', category: 'chat', url: 'https://ai.google', pricing: 'Paid', description: 'A smarter model for your most complex tasks by Google' },
  
  // Trending Products
  { name: 'Lovable', category: 'code', url: 'https://lovable.dev', pricing: 'Freemium', description: 'AI-powered app builder', featured: true },
  { name: 'bolt.new', category: 'code', url: 'https://bolt.new', pricing: 'Freemium', description: 'AI-powered full-stack web development' },
  { name: 'Granola', category: 'productivity', url: 'https://granola.ai', pricing: 'Paid', description: 'AI meeting notetaker' },
  { name: 'Vapi', category: 'audio', url: 'https://vapi.ai', pricing: 'Paid', description: 'Voice AI platform for developers' },
  { name: 'Screen Studio', category: 'video', url: 'https://screenstudio.com', pricing: 'Paid', description: 'AI-powered screen recording and editing' },
  { name: 'n8n', category: 'productivity', url: 'https://n8n.io', pricing: 'Freemium', description: 'Workflow automation with AI' },
  { name: 'Attio', category: 'productivity', url: 'https://attio.com', pricing: 'Freemium', description: 'AI-powered CRM' },
  { name: 'PostHog', category: 'data', url: 'https://posthog.com', pricing: 'Freemium', description: 'AI-powered product analytics' },
  { name: 'Raycast', category: 'productivity', url: 'https://raycast.com', pricing: 'Freemium', description: 'AI-powered launcher for Mac' },
  { name: 'Supabase', category: 'code', url: 'https://supabase.com', pricing: 'Freemium', description: 'AI-powered backend platform' },
  { name: 'Replit', category: 'code', url: 'https://replit.com', pricing: 'Freemium', description: 'AI-powered cloud development environment' },
];

// Load existing tools
let existing = [];
try {
  existing = JSON.parse(fs.readFileSync('data/tools.json', 'utf-8'));
} catch (e) {}

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// Create map of existing tools
const toolMap = new Map(existing.map(t => [t.slug, t]));

// Add/update tools
for (const tool of tools) {
  const slug = slugify(tool.name);
  const now = new Date().toISOString();
  
  toolMap.set(slug, {
    ...toolMap.get(slug),
    ...tool,
    id: slug,
    slug,
    addedAt: toolMap.get(slug)?.addedAt || now,
    updatedAt: now,
    featured: tool.featured || false,
  });
}

// Save
const allTools = Array.from(toolMap.values());
fs.writeFileSync('data/tools.json', JSON.stringify(allTools, null, 2));
console.log(`Imported ${tools.length} tools. Total: ${allTools.length}`);
