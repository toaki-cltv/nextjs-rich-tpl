import fs from "fs/promises";
import path from "path";
import { spawnSync } from "child_process";

export async function copyRecursive(src, dest, options = {}) {
  const { skip = ["node_modules", ".git"] } = options;
  const stat = await fs.stat(src);
  if (stat.isDirectory()) {
    await fs.mkdir(dest, { recursive: true });
    const entries = await fs.readdir(src, { withFileTypes: true });
    for (const entry of entries) {
      if (skip.includes(entry.name)) continue;
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      if (entry.isDirectory()) await copyRecursive(srcPath, destPath, options);
      else if (entry.isSymbolicLink()) continue;
      else await fs.copyFile(srcPath, destPath);
    }
  } else {
    await fs.copyFile(src, dest);
  }
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
