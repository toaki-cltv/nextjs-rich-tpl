#!/usr/bin/env node
import fs from "fs/promises";
import path from "path";
import Ajv from "ajv";

async function run() {
  const repoRoot = path.resolve(new URL(import.meta.url).pathname, "..", "..");
  const schemaPath = path.join(
    repoRoot,
    "packages",
    "create-next-rich-tpl",
    "bin",
    "index.schema.json"
  );
  const remoteUrl =
    process.env.REMOTE_INDEX_URL ||
    process.env.CREATE_TEMPLATES_INDEX_URL ||
    `https://raw.githubusercontent.com/${
      process.env.GITHUB_REPOSITORY || ""
    }/main/templates/index.json`;
  if (
    !remoteUrl ||
    (remoteUrl.endsWith("/templates/index.json") &&
      remoteUrl.includes("githubusercontent") &&
      remoteUrl.includes("//raw.githubusercontent.com/") &&
      remoteUrl.indexOf("${") !== -1)
  ) {
    // fallback: try local index
  }
  try {
    const schRaw = await fs.readFile(schemaPath, "utf8");
    const schema = JSON.parse(schRaw);
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(remoteUrl, { signal: controller.signal });
    clearTimeout(id);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const doc = await res.json();
    const ajv = new Ajv({ allErrors: true });
    const validate = ajv.compile(schema);
    const ok = validate(doc);
    if (!ok) {
      console.error("Remote index validation failed:");
      for (const e of validate.errors || [])
        console.error("-", e.instancePath, e.message);
      process.exit(2);
    }
    console.log(
      "Remote index validated successfully against templates/index.schema.json"
    );
  } catch (err) {
    console.error("validate-index failed:", String(err));
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) run();
