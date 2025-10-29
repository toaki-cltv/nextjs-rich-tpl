import fs from 'fs/promises';
import path from 'path';
import {fileURLToPath} from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function readJson(p) {
  try {
    const s = await fs.readFile(p, 'utf8');
    return JSON.parse(s);
  } catch (e) {
    return null;
  }
}

function normalizeVersion(v) {
  if (!v) return null;
  return v.replace(/^[\^~>=< ]+/, '');
}

function compareSemver(a, b) {
  // simple numeric compare, enough for x.y.z stable versions
  const pa = (a || '').split('.').map(s => parseInt(s.replace(/[^0-9].*$/, '')) || 0);
  const pb = (b || '').split('.').map(s => parseInt(s.replace(/[^0-9].*$/, '')) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const na = pa[i] || 0;
    const nb = pb[i] || 0;
    if (na > nb) return 1;
    if (na < nb) return -1;
  }
  return 0;
}

async function getLatestFromRegistry(pkg) {
  const name = encodeURIComponent(pkg);
  const url = `https://registry.npmjs.org/${name}`;
  try {
    const res = await fetch(url, {method: 'GET', headers: {'Accept': 'application/vnd.npm.install-v1+json'}});
    if (!res.ok) return null;
    const j = await res.json();
    if (j['dist-tags'] && j['dist-tags'].latest) return j['dist-tags'].latest;
    // fallback: pick the highest version key
    const versions = Object.keys(j.versions || {});
    versions.sort((a,b)=> compareSemver(b,a));
    return versions[0] || null;
  } catch (e) {
    return null;
  }
}

async function collectPackageJsonPaths(root) {
  const files = [];
  const rootPkg = path.join(root, 'package.json');
  try { await fs.access(rootPkg); files.push(rootPkg); } catch {}

  // packages/*/package.json
  const packagesDir = path.join(root, 'packages');
  try {
    const items = await fs.readdir(packagesDir, {withFileTypes:true});
    for (const it of items) {
      if (!it.isDirectory()) continue;
      const p = path.join(packagesDir, it.name, 'package.json');
      try { await fs.access(p); files.push(p); } catch {}
    }
  } catch {}

  // templates/app/*/package.json
  const templatesApp = path.join(root, 'templates', 'app');
  try {
    const items = await fs.readdir(templatesApp, {withFileTypes:true});
    for (const it of items) {
      if (!it.isDirectory()) continue;
      const p = path.join(templatesApp, it.name, 'package.json');
      try { await fs.access(p); files.push(p); } catch {}
    }
  } catch {}

  return files;
}

async function run() {
  const root = path.join(__dirname, '..');
  const pkgPaths = await collectPackageJsonPaths(root);
  const summary = [];
  for (const p of pkgPaths) {
    const pkg = await readJson(p);
    if (!pkg) continue;
    const deps = Object.assign({}, pkg.dependencies || {}, pkg.devDependencies || {}, pkg.peerDependencies || {});
    const entries = Object.entries(deps);
    if (entries.length === 0) continue;
    const updates = [];
    for (const [name, ver] of entries) {
      const current = normalizeVersion(ver);
      if (!current) continue;
      const latest = await getLatestFromRegistry(name);
      if (!latest) continue;
      if (compareSemver(latest, current) > 0) {
        updates.push({name, current, latest});
      }
    }
    if (updates.length) summary.push({pkg: p, updates});
  }

  if (summary.length === 0) {
    console.log('No updates found (checked latest versions on npm registry).');
    return;
  }

  for (const s of summary) {
    console.log('\nPackage: %s', s.pkg);
    for (const u of s.updates) {
      console.log('  - %s: %s -> %s', u.name, u.current, u.latest);
    }
  }
  console.log('\nTip: this tool only reports newer versions; it does not modify package.json. Use `pnpm up <pkg>@latest` or `npx npm-check-updates` to update files.');
}

run().catch(err => { console.error(err); process.exitCode = 2; });
