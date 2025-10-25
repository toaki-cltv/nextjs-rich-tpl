#!/usr/bin/env node

import { fileURLToPath } from "url";
import path from "path";
import fs from "fs/promises";
import { spawnSync } from "child_process";
import os from "os";

import { ensureInquirerAndChalk, copyRecursive as sharedCopy, runPostCreateScript } from "./index.mjs";
import crypto from 'crypto';
import Ajv from 'ajv';
import fsSync from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function repoRootFromBinDir() {
  // bin -> package dir -> packages -> repo root
  return path.resolve(__dirname, "..", "..", "..");
}

// track temporary directories we create so we can cleanup on signals/errors
const _tmpDirs = new Set();
function registerTmp(dir) {
  try {
    _tmpDirs.add(dir);
  } catch (e) {}
}
async function cleanupTmpDirs() {
  if (_tmpDirs.size === 0) return;
  for (const d of Array.from(_tmpDirs)) {
    try {
      // fs.rm available on modern node
      await fs.rm(d, { recursive: true, force: true });
    } catch (e) {
      try {
        // best-effort: ignore
      } catch (e2) {}
    }
    _tmpDirs.delete(d);
  }
}

function cleanupTmpDirsSync() {
  // sync fallback for very abrupt shutdowns
  try {
    const syncFs = require('fs');
    for (const d of Array.from(_tmpDirs)) {
      try {
        syncFs.rmSync(d, { recursive: true, force: true });
      } catch (e) {}
      _tmpDirs.delete(d);
    }
  } catch (e) {
    // if require not available (unlikely) ignore
  }
}

function safeExit(code) {
  // try async cleanup but fallback to sync after a short timeout
  const hardTimeout = setTimeout(() => {
    try { cleanupTmpDirsSync(); } catch (e) {}
    process.exit(code);
  }, 5000);
  cleanupTmpDirs().then(() => {
    clearTimeout(hardTimeout);
    process.exit(code);
  }).catch(() => {
    clearTimeout(hardTimeout);
    try { cleanupTmpDirsSync(); } catch (e) {}
    process.exit(code);
  });
}

// graceful shutdown handlers
process.on('SIGINT', () => {
  console.log('\nInterrupted — cleaning up...');
  safeExit(130);
});
process.on('SIGTERM', () => {
  console.log('\nTerminated — cleaning up...');
  safeExit(143);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  safeExit(1);
});
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
  safeExit(1);
});

async function findLocalTemplates(root) {
  // fallback behavior: scan templates/app directory
  const templatesDir = path.join(root, "templates", "app");
  try {
    const entries = await fs.readdir(templatesDir, { withFileTypes: true });
    return entries.filter((e) => e.isDirectory()).map((d) => ({
      type: "local",
      id: `local:${d.name}`,
      name: d.name,
      title: `Local: ${d.name}`,
      path: path.join(templatesDir, d.name),
    }));
  } catch (e) {
    return [];
  }
}

// Validate index.json shape with minimal but strict checks.
// Use Ajv against templates/index.schema.json for validation
let _ajvValidate = null;
function initAjvValidator() {
  if (_ajvValidate) return _ajvValidate;
  try {
    const schemaPath = path.join(repoRootFromBinDir(), 'templates', 'index.schema.json');
    const raw = fsSync.readFileSync(schemaPath, 'utf8');
    const schema = JSON.parse(raw);
    const ajv = new Ajv({ allErrors: true });
    _ajvValidate = ajv.compile(schema);
    return _ajvValidate;
  } catch (err) {
    console.warn('Failed to initialize Ajv validator for templates/index.schema.json:', String(err));
    // fallback to permissive validator
    _ajvValidate = (d) => true;
    _ajvValidate.errors = null;
    return _ajvValidate;
  }
}

function validateIndex(doc) {
  const validate = initAjvValidator();
  const ok = validate(doc);
  if (ok) return [];
  return (validate.errors || []).map((e) => `${e.instancePath || ''} ${e.message}`);
}

async function loadTemplatesIndex(root) {
  // Prefer central index at templates/index.json
  const idxPath = path.join(root, "templates", "index.json");
  try {
    const raw = await fs.readFile(idxPath, "utf8");
    const doc = JSON.parse(raw);
    const vErr = validateIndex(doc);
    if (vErr.length > 0) {
      console.error('templates/index.json failed validation:');
      for (const e of vErr) console.error('  -', e);
      process.exit(2);
    }
    // map entries to our internal shape
    const mapped = doc.templates.map((t) => {
      const src = t.source || {};
      if (!t || typeof t !== 'object' || !t.title || !src || !src.type) {
        console.warn('loadTemplatesIndex: skipping invalid template entry', t && t.id);
        return null;
      }
      if (src.type === "local") {
        // resolve relative path to absolute
        const abs = path.resolve(root, src.path);
        const id = t.id || `local:${path.basename(src.path)}`;
        return {
          type: "local",
          id,
          name: path.basename(src.path),
          title: t.title || `Local: ${path.basename(src.path)}`,
          description: t.description,
          tags: Array.isArray(t.tags) ? t.tags : [],
          postCreate: t.postCreate,
          path: abs,
        };
      }
      if (src.type === 'git') {
        if (!src.repo) {
          console.warn('loadTemplatesIndex: git entry missing repo field, skipping', t.id || src.repo);
          return null;
        }
        return { type: 'git', id: t.id || src.repo, name: t.id || src.repo, title: t.title || src.repo, description: t.description, tags: t.tags || [], source: src, postCreate: t.postCreate };
      }
      // other source types (package) could be represented differently
      return null;
    }).filter(Boolean);
    return mapped;
  } catch (e) {
    return null;
  }
}

async function fetchRemoteIndex(remoteUrl, root, opts = {}) {
  const timeout = opts.timeout || 3000;
  const cacheDir = path.join(os.homedir(), '.cache', 'create-next-rich-tpl');
  const cacheFile = path.join(cacheDir, 'index.json');
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    const res = await fetch(remoteUrl, { signal: controller.signal });
    clearTimeout(id);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const doc = await res.json();
    // validate strict schema
    const vErr = validateIndex(doc);
    if (vErr.length > 0) {
      console.error('Remote templates index failed validation:');
      for (const e of vErr) console.error('  -', e);
      process.exit(2);
    }
    if (doc && Array.isArray(doc.templates)) {
      await fs.mkdir(cacheDir, { recursive: true });
      await fs.writeFile(cacheFile, JSON.stringify(doc, null, 2), 'utf8');
      // map similar to loadTemplatesIndex
      const mapped = doc.templates.map((t) => {
        const src = t.source || {};
        if (!t || typeof t !== 'object' || !t.title || !src || !src.type) {
          console.warn('fetchRemoteIndex: skipping invalid template entry', t && t.id);
          return null;
        }
        if (src.type === 'local') {
          const abs = path.resolve(root, src.path);
          return { type: 'local', id: t.id || abs, name: path.basename(src.path), title: t.title || path.basename(src.path), description: t.description, tags: t.tags || [], postCreate: t.postCreate, path: abs };
        }
        if (src.type === 'git') {
          if (!src.repo) {
            console.warn('fetchRemoteIndex: git entry missing repo field, skipping', t.id || src.repo);
            return null;
          }
          return { type: 'git', id: t.id || src.repo, name: t.id || src.repo, title: t.title || src.repo, description: t.description, tags: t.tags || [], source: src, postCreate: t.postCreate };
        }
        return null;
      }).filter(Boolean);
      return mapped;
    }
  } catch (err) {
    console.error('fetchRemoteIndex: failed to fetch remote index:', String(err));
    // try cache
    try {
      const raw = await fs.readFile(cacheFile, 'utf8');
      const doc = JSON.parse(raw);
      const vErr = validateIndex(doc);
      if (vErr.length > 0) {
        console.error('Cached templates index failed validation:');
        for (const e of vErr) console.error('  -', e);
        process.exit(2);
      }
      if (doc && Array.isArray(doc.templates)) {
        const mapped = doc.templates.map((t) => {
          const src = t.source || {};
          if (!t || typeof t !== 'object' || !t.title || !src || !src.type) {
            console.warn('fetchRemoteIndex(cache): skipping invalid template entry', t && t.id);
            return null;
          }
          if (src.type === 'local') {
            const abs = path.resolve(root, src.path);
            return { type: 'local', id: t.id || abs, name: path.basename(src.path), title: t.title || path.basename(src.path), description: t.description, tags: t.tags || [], postCreate: t.postCreate, path: abs };
          }
          if (src.type === 'git') {
            if (!src.repo) {
              console.warn('fetchRemoteIndex(cache): git entry missing repo field, skipping', t.id || src.repo);
              return null;
            }
            return { type: 'git', id: t.id || src.repo, name: t.id || src.repo, title: t.title || src.repo, description: t.description, tags: t.tags || [], source: src, postCreate: t.postCreate };
          }
          return null;
        }).filter(Boolean);
        return mapped;
      }
    } catch (e) {
      return null;
    }
  }
  return null;
}

async function cloneGitTemplateToTemp(source) {
  // source: { repo: 'owner/repo', path: 'templates/...', ref?: 'main' }
  const tmp = path.join(os.tmpdir(), `create-next-rich-tpl-${Date.now()}`);
  await fs.mkdir(tmp, { recursive: true });
  try {
    const degit = (await import('degit')).default;
    // degit supports targets like 'owner/repo', 'owner/repo/path', and '#ref' suffix
    // build target robustly: prefer repo + (path) + (#ref)
    let target = source.repo.replace(/\.git$/, '');
    if (source.path) {
      target = `${target}/${source.path.replace(/^\/+/, '')}`;
    }
    if (source.ref) {
      target = `${target}#${source.ref}`;
    }
    target = target.replace(/\\/g, '/');

    // clone with a timeout wrapper
    const emitter = degit(target, { cache: false });
    const clonePromise = emitter.clone(tmp);
  const timeoutMs = source.timeout || 60000;
    const p = Promise.race([
      clonePromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('degit clone timeout')), timeoutMs)),
    ]);
    await p;
    // register for cleanup
    registerTmp(tmp);
    // If a hash is provided on the source, compute and verify
    try {
      if (source.hash) {
        const actual = await computeDirSha256(tmp, { skip: ['node_modules', '.git'] });
        if (actual !== source.hash) {
          throw new Error(`template hash mismatch: expected ${source.hash} got ${actual}`);
        }
      }
    } catch (err) {
      // cleanup and rethrow
      try { await fs.rm(tmp, { recursive: true, force: true }); } catch (e) {}
      _tmpDirs.delete(tmp);
      throw err;
    }
    return tmp;
  } catch (err) {
    throw err;
  }
}

async function findCreatePackages(root) {
  const packagesDir = path.join(root, "packages");
  const results = [];
  // determine current package name to avoid listing ourselves
  let currentPkgName = null;
  try {
    const curRaw = await fs.readFile(path.join(__dirname, "..", "package.json"), "utf8");
    currentPkgName = JSON.parse(curRaw).name;
  } catch (e) {
    // ignore
  }
  try {
    const entries = await fs.readdir(packagesDir, { withFileTypes: true });
    for (const e of entries) {
      if (!e.isDirectory()) continue;
      const pkgPath = path.join(packagesDir, e.name);
      try {
        const pjRaw = await fs.readFile(path.join(pkgPath, "package.json"), "utf8");
        const pj = JSON.parse(pjRaw);
        // Only include packages that are explicitly create-* (and skip this central package itself)
        if (pj.name && pj.name.startsWith("create-") && pj.name !== currentPkgName) {
          // attempt to resolve the CLI bin path
          let binPath = null;
          if (typeof pj.bin === "string") binPath = path.join(pkgPath, pj.bin);
          else if (typeof pj.bin === "object") {
            // pick first bin entry
            const first = Object.values(pj.bin)[0];
            binPath = path.join(pkgPath, first);
          }

          results.push({
            type: "package",
            id: `pkg:${pj.name || e.name}`,
            name: pj.name || e.name,
            title: `Package: ${pj.name || e.name}`,
            path: pkgPath,
            bin: binPath,
          });
        }
      } catch (err) {
        // ignore
      }
    }
  } catch (err) {
    // ignore
  }
  return results;
}

let inquirer;
let chalk;

// simple arg parsing for non-interactive use
const argv = process.argv.slice(2);
const flags = {};
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--yes' || a === '-y') flags.yes = true;
  else if (a === '--verbose' || a === '-v') flags.verbose = true;
  else if (a === '--template' && argv[i+1]) { flags.template = argv[++i]; }
  else if (a === '--name' && argv[i+1]) { flags.name = argv[++i]; }
  else if (a === '--timeout' && argv[i+1]) { flags.timeout = parseInt(argv[++i], 10); }
  else if (a === '--accept-postcreate' || a === '-a') flags.acceptPostCreate = true;
}

// function debugLog(...args) {
//   if (flags.verbose || process.env.DEBUG) console.debug('[debug]', ...args);
// }

// compute a deterministic sha256 of directory contents (sorted paths)
async function computeDirSha256(dir, options = {}) {
  const skip = options.skip || ['node_modules', '.git'];
  const files = [];
  async function walk(d) {
    const entries = await fs.readdir(d, { withFileTypes: true });
    for (const e of entries) {
      if (skip.includes(e.name)) continue;
      const p = path.join(d, e.name);
      if (e.isDirectory()) await walk(p);
      else if (e.isSymbolicLink()) continue;
      else files.push(p);
    }
  }
  await walk(dir);
  files.sort();
  const hash = crypto.createHash('sha256');
  for (const f of files) {
    const rel = path.relative(dir, f).replace(/\\/g, '/');
    hash.update(rel + '\0');
    const buf = await fs.readFile(f);
    hash.update(buf);
    hash.update('\0');
  }
  return hash.digest('hex');
}

async function main() {
  const repoRoot = repoRootFromBinDir();
  // remote index URL (env or package.json config)
  // Behavior: when running inside the repository prefer the repo's `templates/index.json` (no remote fetch).
  // When running via dlx/npx (no repo templates present), fall back to the installed package's package.json config.
  let remoteIndexUrl = process.env.CREATE_TEMPLATES_INDEX_URL;
  const repoIndexPath = path.join(repoRoot, 'templates', 'index.json');
  // If repo has index.json, prefer it: don't set remoteIndexUrl so loadTemplatesIndex will read it.
  try {
    if (!remoteIndexUrl && fsSync.existsSync(repoIndexPath)) {
      remoteIndexUrl = undefined; // explicit: use local index
    } else if (!remoteIndexUrl) {
      // no repo index, try the installed package (useful for dlx)
      try {
        const ownPkgRaw = await fs.readFile(path.join(__dirname, '..', 'package.json'), 'utf8');
        const ownPkg = JSON.parse(ownPkgRaw);
        if (ownPkg && ownPkg.config && ownPkg.config.templatesIndexUrl) remoteIndexUrl = ownPkg.config.templatesIndexUrl;
      } catch (e) {
        // ignore
      }
      // finally try repo root package.json as a last resort
      if (!remoteIndexUrl) {
        try {
          const rootPkgRaw = await fs.readFile(path.join(repoRoot, 'package.json'), 'utf8');
          const rootPkg = JSON.parse(rootPkgRaw);
          if (rootPkg && rootPkg.config && rootPkg.config.templatesIndexUrl) remoteIndexUrl = rootPkg.config.templatesIndexUrl;
        } catch (e) {
          // ignore
        }
      }
    }
  } catch (e) {
    // if fsSync.existsSync fails for some reason, fall back to previous behavior
    try {
      const ownPkgRaw = await fs.readFile(path.join(__dirname, '..', 'package.json'), 'utf8');
      const ownPkg = JSON.parse(ownPkgRaw);
      if (ownPkg && ownPkg.config && ownPkg.config.templatesIndexUrl) remoteIndexUrl = ownPkg.config.templatesIndexUrl;
    } catch (e2) {}
  }

  // try remote fetch if configured, then local index, then filesystem
  let indexed = null;
  if (remoteIndexUrl) {
    indexed = await fetchRemoteIndex(remoteIndexUrl, repoRoot, { timeout: flags.timeout || 3000 });
  }
  if (!indexed) indexed = await loadTemplatesIndex(repoRoot);
  const local = Array.isArray(indexed) && indexed.length > 0 ? indexed : await findLocalTemplates(repoRoot);
  const pkgs = await findCreatePackages(repoRoot);
  const items = [...local, ...pkgs];

  if (items.length === 0) {
    console.log("No templates or create-* packages found in this repository.");
    process.exit(0);
  }

  ({ inquirer, chalk } = await ensureInquirerAndChalk());

  const choices = items.map((it) => ({ name: it.title, value: it }));
  let choice = null;
  let projectName = null;

  // non-interactive: allow flags.template and flags.name
  if (flags.template && flags.name) {
    projectName = flags.name;
    // find matching template by id or name
    choice = items.find((it) => it.id === flags.template || it.name === flags.template || it.title === flags.template);
    if (!choice) {
      console.error('Template specified by --template not found:', flags.template);
      process.exit(2);
    }
  } else {
    const answers = await inquirer.prompt([
      { type: "list", name: "choice", message: "Select a template:", choices },
      { type: "input", name: "projectName", message: "Enter project name:", default: "my-nextjs-app" },
    ]);
    choice = answers.choice;
    projectName = answers.projectName;
  }

  console.log(chalk.blue(`\nCreating '${projectName}' with '${choice.title}'...\n`));

  

  if (choice.type === "local") {
    const dest = path.resolve(process.cwd(), projectName);
    try {
  await sharedCopy(choice.path, dest);
      console.log(chalk.green(`Project created at: ${dest}`));
    } catch (err) {
      console.error(chalk.red("Failed to copy template:"), err);
      process.exit(1);
    }
    // post-create hook (opt-in)
    if (choice.postCreate) {
      let runIt = false;
      if (flags.acceptPostCreate) runIt = true;
      else if (flags.yes) runIt = false; // --yes no longer auto-runs postCreate; use --accept-postcreate
      else {
        const promptAnswer = await inquirer.prompt([
          { type: 'confirm', name: 'runPost', message: `This template provides a post-create script (${choice.postCreate}). Run it now?`, default: false }
        ]);
        runIt = promptAnswer.runPost;
      }
      if (runIt) {
        console.log(chalk.blue(`Running post-create script: ${choice.postCreate}`));
        try {
          await runPostCreateScript(dest, choice.postCreate, []);
        } catch (err) {
          console.error(chalk.red('post-create script failed:'), err);
        }
      }
    }
  } else if (choice.type === "package") {
    if (!choice.bin) {
      console.error(chalk.red("Selected package has no bin to execute."));
      process.exit(1);
    }
    // call node <bin> <projectName>
    const nodeExe = process.execPath;
    const result = spawnSync(nodeExe, [choice.bin, projectName], { stdio: "inherit" });
    process.exit(result.status || 0);
  } else if (choice.type === 'git') {
    // clone git-specified template (via degit) to temp, then copy
    const dest = path.resolve(process.cwd(), projectName);
    let tmp = null;
    try {
        // if CLI-level timeout present, prefer it when source.timeout not set
        if (flags.timeout && choice.source && !choice.source.timeout) choice.source.timeout = flags.timeout;
        tmp = await cloneGitTemplateToTemp(choice.source);
      // tmp now contains repo contents (possibly whole repo) - if source.path was provided degit should have checked it out
      await sharedCopy(tmp, dest);
      console.log(chalk.green(`Project created at: ${dest}`));
      // post-create hook for git-sourced templates
      if (choice.postCreate) {
        let runIt = false;
        if (flags.acceptPostCreate) runIt = true;
        else if (flags.yes) runIt = false;
        else {
          const promptAnswer = await inquirer.prompt([
            { type: 'confirm', name: 'runPost', message: `This template provides a post-create script (${choice.postCreate}). Run it now?`, default: false }
          ]);
          runIt = promptAnswer.runPost;
        }
        if (runIt) {
          console.log(chalk.blue(`Running post-create script: ${choice.postCreate}`));
          try {
            await runPostCreateScript(dest, choice.postCreate, []);
          } catch (err) {
            console.error(chalk.red('post-create script failed:'), err);
          }
        }
      }
    } catch (err) {
      console.error(chalk.red('Failed to fetch/copy git template:'), err);
      await cleanupTmpDirs();
      process.exit(1);
    } finally {
      // remove only the tmp we used
      if (tmp) {
        try {
          await fs.rm(tmp, { recursive: true, force: true });
          _tmpDirs.delete(tmp);
        } catch (e) {}
      }
    }
  }
}

main();
