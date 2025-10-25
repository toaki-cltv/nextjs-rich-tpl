#!/usr/bin/env node
// scans templates/app/* and generates templates/index.json
import fs from 'fs/promises';
import path from 'path';

async function main() {
  const repoRoot = path.resolve(new URL(import.meta.url).pathname, '..', '..');
  const templatesDir = path.join(repoRoot, 'templates', 'app');
  const outPath = path.join(repoRoot, 'templates', 'index.json');

  try {
    const entries = await fs.readdir(templatesDir, { withFileTypes: true });
    const templates = [];
    for (const e of entries) {
      if (!e.isDirectory()) continue;
      const p = path.join(templatesDir, e.name);
      const title = e.name.replace(/[-_]/g, ' ');
      templates.push({
        id: `app/${e.name}`,
        title: title,
        description: '',
        source: { type: 'local', path: `templates/app/${e.name}` },
        tags: []
      });
    }
    const doc = { templates, generatedAt: new Date().toISOString() };
    await fs.mkdir(path.dirname(outPath), { recursive: true });
    await fs.writeFile(outPath, JSON.stringify(doc, null, 2) + '\n', 'utf8');
    console.log('Wrote', outPath);
  } catch (err) {
    console.error('Failed to generate index:', err);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
