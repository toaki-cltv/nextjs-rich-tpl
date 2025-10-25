import fs from "fs/promises";
import path from "path";
import { spawnSync } from "child_process";
import fsSync from 'fs';
import cliProgress from 'cli-progress';
import chalk from 'chalk';

export async function copyRecursive(src, dest, options = {}) {
  const { skip = ["node_modules", ".git"], showProgress = true } = options;
  async function gatherFiles(d) {
    const files = [];
    async function walk(cur) {
      const entries = await fs.readdir(cur, { withFileTypes: true });
      for (const e of entries) {
        if (skip.includes(e.name)) continue;
        const p = path.join(cur, e.name);
        if (e.isDirectory()) await walk(p);
        else if (e.isSymbolicLink()) continue;
        else files.push(p);
      }
    }
    await walk(d);
    return files;
  }

  const stat = await fs.stat(src);
  if (!stat.isDirectory()) {
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.copyFile(src, dest);
    return;
  }

  const allFiles = await gatherFiles(src);
  const bar = showProgress && allFiles.length > 0 ? new cliProgress.SingleBar({
    format: 'Copying [{bar}] {percentage}% | {value}/{total} files',
  }, cliProgress.Presets.shades_classic) : null;

  if (bar) bar.start(allFiles.length, 0);

  await fs.mkdir(dest, { recursive: true });
  let copied = 0;
  for (const f of allFiles) {
    const rel = path.relative(src, f);
    const out = path.join(dest, rel);
    await fs.mkdir(path.dirname(out), { recursive: true });
    await fs.copyFile(f, out);
    copied++;
    if (bar) bar.update(copied);
  }

  if (bar) bar.stop();
}

export async function ensureInquirerAndChalk() {
  let inquirer;
  let chalk;
  try {
    inquirer = (await import("inquirer")).default;
  } catch (e) {
    console.error("Please install 'inquirer' in this workspace to use interactive selection (pnpm i -w inquirer)");
    process.exit(1);
  }
  try {
    chalk = (await import("chalk")).default;
  } catch (e) {
    chalk = { blue: (s) => s, green: (s) => s, red: (s) => s };
  }
  return { inquirer, chalk };
}

export async function runPostCreateScript(pkgDir, scriptRelPath, args = []) {
  // If scriptRelPath points to a JS file, run it with node. Otherwise, attempt `npm run <scriptRelPath>`.
  const scriptPath = path.join(pkgDir, scriptRelPath);
  try {
    // prefer file execution when present
    try {
      const st = await fs.stat(scriptPath);
      if (st.isFile()) {
        const nodeExe = process.execPath;
        const r = spawnSync(nodeExe, [scriptPath, ...args], { stdio: 'inherit', cwd: pkgDir });
        if (r.status !== 0) {
          throw new Error(`postCreate script exited with ${r.status}`);
        }
        return;
      }
    } catch (e) {
      // file not found -> fallthrough to npm script
    }

    // Decide preferred package runner: prefer pnpm if available in PATH, else npm
    const runnersTried = [];
    function hasRunner(cmd) {
      try {
        const s = spawnSync(cmd, ['--version'], { stdio: 'ignore' });
        return s.status === 0;
      } catch (e) {
        return false;
      }
    }

    const preferPnpm = hasRunner('pnpm');
    const runnerOrder = preferPnpm ? ['pnpm', 'npm'] : ['npm', 'pnpm'];
    for (const runTool of runnerOrder) {
      try {
        const r = spawnSync(runTool, ['run', scriptRelPath, '--silent'], { stdio: 'inherit', cwd: pkgDir });
        runnersTried.push({ tool: runTool, code: r.status });
        if (r.status === 0) return;
      } catch (e) {
        runnersTried.push({ tool: runTool, code: 'err', err: String(e) });
      }
    }
    throw new Error(`postCreate script failed; attempts: ${JSON.stringify(runnersTried)}`);
  } catch (err) {
    console.error("Failed to run postCreate script:", err);
    throw err;
  }
}
