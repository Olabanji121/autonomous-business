#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR = '/home/obanj/smart/projects/ai-directory/data';
const BUILD_DIR = '/home/obanj/smart/projects/ai-directory/build';

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function loadData() {
  const file = path.join(DATA_DIR, 'tools.json');
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, 'utf-8'));
}

function loadCategories() {
  const file = path.join(DATA_DIR, 'categories.json');
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, 'utf-8'));
}

function saveData(tools) {
  ensureDir(DATA_DIR);
  fs.writeFileSync(path.join(DATA_DIR, 'tools.json'), JSON.stringify(tools, null, 2));
}

// SEO-friendly slug
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// Generate HTML page
function html(title, content, meta = {}) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | AI Tool Directory</title>
  <meta name="description" content="${meta.description || 'Discover the best AI tools for productivity, creativity, and business.'}">
  <meta name="keywords" content="${meta.keywords || 'AI tools, artificial intelligence, productivity, automation'}">
  <link rel="canonical" href="https://aitools.directory${meta.canonical || '/'}">
  
  <!-- Open Graph -->
  <meta property="og:title" content="${title} | AI Tool Directory">
  <meta property="og:description" content="${meta.description || 'Discover the best AI tools'}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://aitools.directory${meta.canonical || '/'}">
  
  <link href="/style.css" rel="stylesheet">
</head>
<body>
  <header>
    <a href="/" class="logo">🤖 AI Tools</a>
    <nav>
      <a href="/categories">Categories</a>
      <a href="/new">New Tools</a>
      <a href="/pricing">Pricing</a>
      <a href="/submit" class="btn">Submit Tool</a>
    </nav>
  </header>
  
  <main>
    ${content}
  </main>
  
  <footer>
    <p>© ${new Date().getFullYear()} AI Tool Directory</p>
    <nav>
      <a href="/about">About</a>
      <a href="/privacy">Privacy</a>
      <a href="/contact">Contact</a>
    </nav>
  </footer>
  
  <script src="/search.js"></script>
</body>
</html>`;
}

// Tool card component
function toolCard(tool) {
  return `
    <article class="tool-card ${tool.featured ? 'featured' : ''}">
      <img src="${tool.icon || '/default-icon.svg'}" alt="${tool.name}" class="tool-icon">
      <div class="tool-info">
        <h3><a href="/tool/${tool.slug}">${tool.name}</a></h3>
        <p class="tool-desc">${tool.description?.slice(0, 150) || ''}</p>
        <div class="tool-meta">
          <span class="category">${tool.category}</span>
          ${tool.pricing ? `<span class="pricing">${tool.pricing}</span>` : ''}
          ${tool.featured ? '<span class="badge">Featured</span>' : ''}
        </div>
      </div>
      <a href="${tool.url}" class="btn-visit" target="_blank" rel="noopener">Visit →</a>
    </article>`;
}

// Generate home page
function generateHome(tools, categories) {
  const featured = tools.filter(t => t.featured).slice(0, 6);
  const recent = tools.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt)).slice(0, 12);
  
  const content = `
    <section class="hero">
      <h1>Discover the Best AI Tools</h1>
      <p>Curated collection of ${tools.length} AI tools for productivity, creativity, and business.</p>
      <div class="search-box">
        <input type="search" id="search" placeholder="Search AI tools...">
      </div>
    </section>
    
    ${featured.length > 0 ? `
    <section class="featured">
      <h2>⭐ Featured Tools</h2>
      <div class="tool-grid">
        ${featured.map(toolCard).join('\n')}
      </div>
    </section>
    ` : ''}
    
    <section class="categories">
      <h2>Browse by Category</h2>
      <div class="category-grid">
        ${categories.map(c => `
          <a href="/category/${c.slug}" class="category-card">
            <span class="emoji">${c.emoji || '📁'}</span>
            <span class="name">${c.name}</span>
            <span class="count">${tools.filter(t => t.category === c.slug).length}</span>
          </a>
        `).join('\n')}
      </div>
    </section>
    
    <section class="recent">
      <h2>🆕 Recently Added</h2>
      <div class="tool-grid">
        ${recent.map(toolCard).join('\n')}
      </div>
    </section>
  `;
  
  return html('Best AI Tools', content, {
    description: `Discover ${tools.length}+ AI tools for productivity, writing, design, coding, and more. Updated daily.`,
    canonical: '/'
  });
}

// Generate category page
function generateCategory(category, tools) {
  const categoryTools = tools.filter(t => t.category === category.slug);
  
  const content = `
    <section class="category-header">
      <h1>${category.emoji || '📁'} ${category.name}</h1>
      <p>${category.description || `${categoryTools.length} AI tools in this category`}</p>
    </section>
    
    <div class="tool-grid">
      ${categoryTools.map(toolCard).join('\n')}
    </div>
  `;
  
  return html(`${category.name} AI Tools`, content, {
    description: category.description || `${categoryTools.length} ${category.name.toLowerCase()} AI tools`,
    canonical: `/category/${category.slug}`
  });
}

// Generate tool detail page
function generateToolDetail(tool) {
  const content = `
    <article class="tool-detail">
      <header>
        <img src="${tool.icon || '/default-icon.svg'}" alt="${tool.name}" class="tool-icon-lg">
        <div>
          <h1>${tool.name}</h1>
          <p class="tagline">${tool.tagline || tool.description?.slice(0, 100) || ''}</p>
          <div class="meta">
            <span class="category">${tool.category}</span>
            ${tool.pricing ? `<span class="pricing">${tool.pricing}</span>` : ''}
          </div>
        </div>
        <a href="${tool.url}" class="btn-primary" target="_blank" rel="noopener">Visit ${tool.name} →</a>
      </header>
      
      <section class="description">
        <h2>About ${tool.name}</h2>
        <p>${tool.description || 'No description available.'}</p>
      </section>
      
      ${tool.features ? `
      <section class="features">
        <h2>Features</h2>
        <ul>
          ${tool.features.map(f => `<li>${f}</li>`).join('\n')}
        </ul>
      </section>
      ` : ''}
      
      ${tool.useCases ? `
      <section class="use-cases">
        <h2>Use Cases</h2>
        <ul>
          ${tool.useCases.map(u => `<li>${u}</li>`).join('\n')}
        </ul>
      </section>
      ` : ''}
      
      <section class="actions">
        <a href="${tool.url}" class="btn-primary" target="_blank" rel="noopener">Try ${tool.name}</a>
        <a href="/category/${tool.category}" class="btn-secondary">More ${tool.category} tools</a>
      </section>
    </article>
  `;
  
  return html(tool.name, content, {
    description: tool.description?.slice(0, 160) || `${tool.name} - AI tool for ${tool.category}`,
    canonical: `/tool/${tool.slug}`,
    keywords: `${tool.name}, ${tool.category}, AI tools, ${tool.features?.join(', ') || ''}`
  });
}

// Generate all pages
export function build() {
  console.log('Building AI Tool Directory...');
  
  const tools = loadData();
  const categories = loadCategories();
  
  ensureDir(BUILD_DIR);
  ensureDir(path.join(BUILD_DIR, 'tool'));
  ensureDir(path.join(BUILD_DIR, 'category'));
  
  // Home page
  fs.writeFileSync(path.join(BUILD_DIR, 'index.html'), generateHome(tools, categories));
  console.log('✓ Home page');
  
  // Category pages
  for (const cat of categories) {
    ensureDir(path.join(BUILD_DIR, 'category', cat.slug));
    fs.writeFileSync(
      path.join(BUILD_DIR, 'category', cat.slug, 'index.html'),
      generateCategory(cat, tools)
    );
  }
  console.log(`✓ ${categories.length} category pages`);
  
  // Tool detail pages
  for (const tool of tools) {
    ensureDir(path.join(BUILD_DIR, 'tool', tool.slug));
    fs.writeFileSync(
      path.join(BUILD_DIR, 'tool', tool.slug, 'index.html'),
      generateToolDetail(tool)
    );
  }
  console.log(`✓ ${tools.length} tool pages`);
  
  // Generate sitemap
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://aitools.directory/</loc></url>
  ${categories.map(c => `<url><loc>https://aitools.directory/category/${c.slug}/</loc></url>`).join('\n')}
  ${tools.map(t => `<url><loc>https://aitools.directory/tool/${t.slug}/</loc></url>`).join('\n')}
</urlset>`;
  fs.writeFileSync(path.join(BUILD_DIR, 'sitemap.xml'), sitemap);
  console.log('✓ Sitemap');
  
  console.log(`\nBuild complete: ${BUILD_DIR}`);
}

// Tool management
export function addTool(tool) {
  const tools = loadData();
  
  // Generate slug and add metadata
  const newTool = {
    ...tool,
    id: slugify(tool.name),
    slug: slugify(tool.name),
    addedAt: new Date().toISOString(),
    featured: tool.featured || false,
  };
  
  // Check for duplicates
  if (tools.find(t => t.slug === newTool.slug)) {
    throw new Error(`Tool "${tool.name}" already exists`);
  }
  
  tools.push(newTool);
  saveData(tools);
  
  console.log(`Added: ${newTool.name}`);
  return newTool;
}

export function listTools() {
  return loadData();
}

export function getTool(slug) {
  return loadData().find(t => t.slug === slug);
}

// CLI
const [,, cmd, ...args] = process.argv;

if (cmd === 'build') {
  build();
} else if (cmd === 'add') {
  const [name, category, url, pricing, description] = args;
  if (!name || !category || !url) {
    console.log('Usage: node directory.js add "Name" "category" "url" "pricing" "description"');
    process.exit(1);
  }
  addTool({ name, category, url, pricing, description });
} else if (cmd === 'list') {
  const tools = listTools();
  console.log(`\n${tools.length} tools:\n`);
  for (const t of tools) {
    console.log(`  ${t.featured ? '⭐' : '  '} ${t.name} - ${t.category} - ${t.pricing || 'N/A'}`);
  }
} else if (cmd === 'seed') {
  // Seed with sample tools
  const sampleTools = [
    { name: 'Claude', category: 'chat', url: 'https://claude.ai', pricing: 'Freemium', description: 'Advanced AI assistant by Anthropic for conversations, analysis, and creative tasks.', featured: true },
    { name: 'ChatGPT', category: 'chat', url: 'https://chat.openai.com', pricing: 'Freemium', description: 'OpenAI\'s conversational AI for questions, writing, and coding assistance.', featured: true },
    { name: 'Midjourney', category: 'image', url: 'https://midjourney.com', pricing: 'Paid', description: 'AI image generation with artistic styles and detailed prompting.', featured: true },
    { name: 'DALL-E 3', category: 'image', url: 'https://openai.com/dall-e-3', pricing: 'Paid', description: 'OpenAI\'s image generation model with natural language prompts.', featured: true },
    { name: 'GitHub Copilot', category: 'code', url: 'https://github.com/features/copilot', pricing: 'Paid', description: 'AI pair programmer that suggests code in your IDE.', featured: true },
    { name: 'Cursor', category: 'code', url: 'https://cursor.sh', pricing: 'Freemium', description: 'AI-first code editor built for pair programming with AI.', featured: true },
    { name: 'Perplexity', category: 'search', url: 'https://perplexity.ai', pricing: 'Freemium', description: 'AI-powered search engine with cited sources and follow-up questions.' },
    { name: 'Notion AI', category: 'writing', url: 'https://notion.so/product/ai', pricing: 'Paid', description: 'AI writing assistant integrated into Notion workspace.' },
    { name: 'Jasper', category: 'writing', url: 'https://jasper.ai', pricing: 'Paid', description: 'AI content platform for marketing teams.' },
    { name: 'Runway', category: 'video', url: 'https://runway.ml', pricing: 'Freemium', description: 'AI video editing and generation tools.' },
    { name: 'ElevenLabs', category: 'audio', url: 'https://elevenlabs.io', pricing: 'Freemium', description: 'AI voice synthesis and cloning.' },
    { name: 'Otter.ai', category: 'audio', url: 'https://otter.ai', pricing: 'Freemium', description: 'AI meeting transcription and notes.' },
  ];
  
  for (const tool of sampleTools) {
    try {
      addTool(tool);
    } catch (e) {
      console.log(`Skipped: ${tool.name}`);
    }
  }
  
  // Also create categories
  const cats = [
    { name: 'Chat', slug: 'chat', emoji: '💬', description: 'AI chatbots and conversational assistants' },
    { name: 'Image', slug: 'image', emoji: '🎨', description: 'AI image generation and editing' },
    { name: 'Video', slug: 'video', emoji: '🎬', description: 'AI video creation and editing' },
    { name: 'Audio', slug: 'audio', emoji: '🎵', description: 'AI voice, music, and audio tools' },
    { name: 'Code', slug: 'code', emoji: '💻', description: 'AI coding assistants and tools' },
    { name: 'Writing', slug: 'writing', emoji: '✍️', description: 'AI writing and content tools' },
    { name: 'Search', slug: 'search', emoji: '🔍', description: 'AI-powered search engines' },
    { name: 'Productivity', slug: 'productivity', emoji: '⚡', description: 'AI tools for work efficiency' },
    { name: 'Data', slug: 'data', emoji: '📊', description: 'AI for data analysis and visualization' },
    { name: 'Design', slug: 'design', emoji: '🎯', description: 'AI design and creative tools' },
  ];
  
  fs.writeFileSync(path.join(DATA_DIR, 'categories.json'), JSON.stringify(cats, null, 2));
  console.log(`Created ${cats.length} categories`);
  
} else {
  console.log(`
AI Tool Directory CLI

Usage:
  node directory.js build         Build static site
  node directory.js add "Name" "category" "url" "pricing" "description"
  node directory.js list          List all tools
  node directory.js seed          Seed with sample tools
`);
}
