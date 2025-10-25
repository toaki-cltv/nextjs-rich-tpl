#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

async function copyDir(src, dest) {
  // Prefer native fs.cp if available (Node 16.7+ / 18+)
  try {
    if (typeof fs.cp === 'function') {
      await fs.cp(src, dest, { recursive: true, force: true });
      return;
    }
  } catch (err) {
    // fall through to manual copy
  }

  // Manual recursive copy
  async function _copy(s, d) {
    const stat = await fs.stat(s);
    if (stat.isDirectory()) {
      await fs.mkdir(d, { recursive: true });
      const entries = await fs.readdir(s);
      for (const e of entries) {
        if (e === 'node_modules' || e === '.git') continue;
        await _copy(path.join(s, e), path.join(d, e));
      }
    } else {
      await fs.mkdir(path.dirname(d), { recursive: true });
      await fs.copyFile(s, d);
    }
  }

  await _copy(src, dest);
}

async function run() {
  const repoRoot = path.resolve(new URL(import.meta.url).pathname, '..', '..');
  const indexPath = path.join(repoRoot, 'templates', 'index.json');
  try {
    const raw = await fs.readFile(indexPath, 'utf8');
    const doc = JSON.parse(raw);
    if (!doc || !Array.isArray(doc.templates)) throw new Error('invalid index.json');
    const failures = [];
    for (const t of doc.templates) {
      if (!t.source || t.source.type !== 'local') continue;
      const src = path.resolve(repoRoot, t.source.path);
      const dest = path.join(os.tmpdir(), `smoke-${t.id.replace(/[^a-z0-9]/gi,'_')}-${Date.now()}`);
      try {
        await copyDir(src, dest);
        // basic checks
        const hasPackageJson = await fs.access(path.join(dest, 'package.json')).then(()=>true).catch(()=>false);
        if (!hasPackageJson) throw new Error('missing package.json');
        console.log('SMOKE OK:', t.id, '->', dest);
      } catch (err) {
        console.error('SMOKE FAIL:', t.id, err.message || err);
        failures.push(t.id);
      }
    }
    if (failures.length) {
      console.error('Smoke tests failed for:', failures.join(', '));
      process.exit(2);
    }
    console.log('All smoke tests passed');
  } catch (err) {
    console.error('Smoke test runner failed:', err);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) run();
