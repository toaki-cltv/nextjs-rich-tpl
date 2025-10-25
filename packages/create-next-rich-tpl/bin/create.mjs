#!/usr/bin/env node

import { fileURLToPath } from "url";
import path from "path";
import fs from "fs/promises";
import { spawnSync } from "child_process";
import os from "os";

import { ensureInquirerAndChalk, copyRecursive as sharedCopy } from "./index.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function repoRootFromBinDir() {
  // bin -> package dir -> packages -> repo root
  return path.resolve(__dirname, "..", "..", "..");
}

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

async function loadTemplatesIndex(root) {
  // Prefer central index at templates/index.json
  const idxPath = path.join(root, "templates", "index.json");
  try {
    const raw = await fs.readFile(idxPath, "utf8");
    const doc = JSON.parse(raw);
    if (!doc || !Array.isArray(doc.templates)) return null;
    // map entries to our internal shape (only local types handled here)
    const mapped = doc.templates.map((t) => {
      const src = t.source || {};
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
          path: abs,
        };
      }
      // other source types (git/npm) could be represented as package-style entries
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
    // validate minimal schema
    if (doc && Array.isArray(doc.templates)) {
      await fs.mkdir(cacheDir, { recursive: true });
      await fs.writeFile(cacheFile, JSON.stringify(doc, null, 2), 'utf8');
      // map similar to loadTemplatesIndex
      const mapped = doc.templates.map((t) => {
        const src = t.source || {};
        if (src.type === 'local') {
          const abs = path.resolve(root, src.path);
          return { type: 'local', id: t.id || abs, name: path.basename(src.path), title: t.title || path.basename(src.path), description: t.description, tags: t.tags || [], path: abs };
        }
        if (src.type === 'git') {
          return { type: 'git', id: t.id || src.repo, name: t.id || src.repo, title: t.title || src.repo, description: t.description, tags: t.tags || [], source: src };
        }
        return null;
      }).filter(Boolean);
      return mapped;
    }
  } catch (err) {
    // try cache
    try {
      const raw = await fs.readFile(cacheFile, 'utf8');
      const doc = JSON.parse(raw);
      if (doc && Array.isArray(doc.templates)) {
        const mapped = doc.templates.map((t) => {
          const src = t.source || {};
          if (src.type === 'local') {
            const abs = path.resolve(root, src.path);
            return { type: 'local', id: t.id || abs, name: path.basename(src.path), title: t.title || path.basename(src.path), description: t.description, tags: t.tags || [], path: abs };
          }
          if (src.type === 'git') {
            return { type: 'git', id: t.id || src.repo, name: t.id || src.repo, title: t.title || src.repo, description: t.description, tags: t.tags || [], source: src };
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
  const target = `${source.repo}/tree/${source.ref || 'main'}/${source.path || ''}`.replace(/\\/g, '/');
    const emitter = degit(target, { cache: false });
    await emitter.clone(tmp);
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

async function main() {
  const repoRoot = repoRootFromBinDir();
  // remote index URL (env or package.json config)
  let remoteIndexUrl = process.env.CREATE_TEMPLATES_INDEX_URL;
  if (!remoteIndexUrl) {
    try {
      const rootPkgRaw = await fs.readFile(path.join(repoRoot, 'package.json'), 'utf8');
      const rootPkg = JSON.parse(rootPkgRaw);
      if (rootPkg && rootPkg.config && rootPkg.config.templatesIndexUrl) remoteIndexUrl = rootPkg.config.templatesIndexUrl;
    } catch (e) {
      // ignore
    }
  }

  // try remote fetch if configured, then local index, then filesystem
  let indexed = null;
  if (remoteIndexUrl) {
    indexed = await fetchRemoteIndex(remoteIndexUrl, repoRoot, { timeout: 3000 });
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

  const answers = await inquirer.prompt([
    { type: "list", name: "choice", message: "Select a template:", choices },
    { type: "input", name: "projectName", message: "Enter project name:", default: "my-nextjs-app" },
  ]);

  const { choice, projectName } = answers;

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
      const promptAnswer = await inquirer.prompt([
        { type: 'confirm', name: 'runPost', message: `This template provides a post-create script (${choice.postCreate}). Run it now?`, default: false }
      ]);
      if (promptAnswer.runPost) {
        const scriptPath = path.resolve(dest, choice.postCreate);
        console.log(chalk.blue(`Running post-create script: ${choice.postCreate}`));
        const r = spawnSync(process.execPath, [scriptPath], { stdio: 'inherit', cwd: dest });
        if (r.status !== 0) {
          console.error(chalk.red('post-create script failed with status', r.status));
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
  }
}

main();
