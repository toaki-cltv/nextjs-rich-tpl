import fs from "fs/promises";
import path from "path";

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
  // Very small helper: run a local node script inside the package dir
  const scriptPath = path.join(pkgDir, scriptRelPath);
  try {
    // dynamic import to run script
    const mod = await import(pathToFileURL(scriptPath).href);
    if (typeof mod.default === "function") {
      await mod.default(...args);
    }
  } catch (err) {
    console.error("Failed to run postCreate script:", err);
  }
}

import { pathToFileURL } from "url";
