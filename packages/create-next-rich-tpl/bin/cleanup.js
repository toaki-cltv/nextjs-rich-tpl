#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

function walk(dir, skip = ['node_modules', '.git']) {
  const files = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      if (skip.includes(e.name)) continue;
      const p = path.join(dir, e.name);
      if (e.isDirectory()) files.push(...walk(p, skip));
      else files.push(p);
    }
  } catch (e) {
    return [];
  }
  return files;
}

function removeDirSyncWithProgress(dir) {
  const files = walk(dir);
  const total = files.length;
  let removed = 0;
  // remove files first
  for (const f of files) {
    try {
      fs.unlinkSync(f);
    } catch (e) {}
    removed++;
    if (total > 0 && removed % 50 === 0) {
      // occasional progress output
      console.log(JSON.stringify({ type: 'progress', removed, total }));
    }
  }
  // then remove directories bottom-up
  try {
    fs.rmdirSync(dir, { recursive: true });
  } catch (e) {
    // fallback: attempt unlinking again
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e2) {}
  }
  console.log(JSON.stringify({ type: 'done', dir }));
}

async function main() {
  const args = process.argv.slice(2);
  if (!args[0]) {
    console.error('cleanup.js <dir>');
    process.exit(2);
  }
  const dir = args[0];
  try {
    removeDirSyncWithProgress(dir);
    process.exit(0);
  } catch (e) {
    console.error('cleanup failed', String(e));
    process.exit(3);
  }
}

main();
