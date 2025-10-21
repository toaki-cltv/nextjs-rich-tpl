#!/usr/bin/env node

import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { promises as fs } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ANSI color codes
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

// Progress bar
function createProgressBar(current, total, width = 30) {
  const percentage = Math.floor((current / total) * 100);
  const filled = Math.floor((current / total) * width);
  const empty = width - filled;
  const bar = "█".repeat(filled) + "░".repeat(empty);
  return `${colors.cyan}[${bar}]${colors.reset} ${percentage}% (${current}/${total})`;
}

console.log(
  `${colors.bright}${colors.blue}🧹 Cleaning up unnecessary files...${colors.reset}\n`,
);

/**
 * Recursively find directories with specific names
 * @param {string} dir - Directory to search
 * @param {string[]} targetDirs - Directory names to find
 * @param {string[]} foundDirs - Array to store found directories
 */
async function findDirectories(dir, targetDirs, foundDirs = []) {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        if (targetDirs.includes(entry.name)) {
          foundDirs.push(fullPath);
        } else {
          await findDirectories(fullPath, targetDirs, foundDirs);
        }
      }
    }
  } catch (error) {
    // Ignore permission errors and continue
    if (error.code !== "EACCES" && error.code !== "EPERM") {
      // Silently skip
    }
  }

  return foundDirs;
}

/**
 * Delete directories with progress
 * @param {string[]} directories - Directories to delete
 * @param {string} label - Label for the operation
 */
async function deleteDirectoriesWithProgress(directories, label) {
  const total = directories.length;
  let deleted = 0;

  for (const dir of directories) {
    const relativePath = dir.replace(__dirname, ".");
    process.stdout.write(
      `\r${colors.yellow}⏳ ${label}${colors.reset} ${createProgressBar(deleted, total)} ${colors.dim}${relativePath}${colors.reset}          `,
    );

    try {
      await fs.rm(dir, { recursive: true, force: true });
      deleted++;
    } catch (error) {
      // Continue on error
    }
  }

  process.stdout.write(
    `\r${colors.green}✓ ${label}${colors.reset} ${createProgressBar(total, total)}          \n`,
  );
}

/**
 * Delete specific files in the root directory
 * @param {string[]} files - File names to delete
 */
async function cleanRootFiles(files) {
  let deletedFiles = [];

  for (const file of files) {
    const filePath = join(__dirname, file);
    try {
      await fs.access(filePath);
      deletedFiles.push(file);
    } catch (error) {
      // File doesn't exist, skip
    }
  }

  const total = deletedFiles.length;
  let deleted = 0;

  for (const file of deletedFiles) {
    const filePath = join(__dirname, file);
    process.stdout.write(
      `\r${colors.yellow}⏳ Removing lock files${colors.reset} ${createProgressBar(deleted, total)} ${colors.dim}${file}${colors.reset}          `,
    );

    try {
      await fs.unlink(filePath);
      deleted++;
    } catch (error) {
      // Continue on error
    }
  }

  if (total > 0) {
    process.stdout.write(
      `\r${colors.green}✓ Removed lock files${colors.reset} ${createProgressBar(total, total)}          \n`,
    );
  } else {
    console.log(`${colors.dim}ℹ No lock files found${colors.reset}`);
  }

  return deleted;
}

// Main execution
(async () => {
  try {
    // Step 1: Find directories
    console.log(
      `${colors.bright}📂 Step 1/3: Scanning for build artifacts...${colors.reset}`,
    );
    const targetDirs = [".next", "node_modules", ".translations"];
    const foundDirs = await findDirectories(__dirname, targetDirs);

    if (foundDirs.length === 0) {
      console.log(
        `${colors.dim}   ℹ No directories found to clean${colors.reset}\n`,
      );
    } else {
      console.log(
        `${colors.bright}   Found ${foundDirs.length} director${foundDirs.length === 1 ? "y" : "ies"} to remove${colors.reset}\n`,
      );

      // Show what will be deleted
      const grouped = targetDirs.reduce((acc, name) => {
        acc[name] = foundDirs.filter((dir) => dir.endsWith(name)).length;
        return acc;
      }, {});

      for (const [name, count] of Object.entries(grouped)) {
        if (count > 0) {
          console.log(
            `   ${colors.magenta}▸${colors.reset} ${name}: ${colors.cyan}${count}${colors.reset}`,
          );
        }
      }
      console.log();
    }

    // Step 2: Delete directories
    if (foundDirs.length > 0) {
      console.log(
        `${colors.bright}�️  Step 2/3: Removing directories...${colors.reset}`,
      );
      await deleteDirectoriesWithProgress(foundDirs, "Removing directories");
      console.log();
    }

    // Step 3: Clean root files
    console.log(
      `${colors.bright}📄 Step 3/3: Cleaning lock files...${colors.reset}`,
    );
    await cleanRootFiles(["package-lock.json", "yarn.lock", "pnpm-lock.yaml"]);

    console.log(
      `\n${colors.bright}${colors.green}✅ Cleanup completed successfully!${colors.reset}`,
    );
  } catch (error) {
    console.error(
      `\n${colors.red}❌ Error during cleanup:${colors.reset}`,
      error,
    );
    process.exit(1);
  }
})();
