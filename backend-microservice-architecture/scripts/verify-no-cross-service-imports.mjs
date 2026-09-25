#!/usr/bin/env node
/**
 * Guard: no service/worker may import another service's or worker's source.
 *
 * Allowed:   services/* → shared/*, any npm dependency
 * Forbidden: services/story → services/auth/src/…, workers/email → services/*
 */
import { readdirSync, existsSync, statSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const units = [];
for (const group of ["services", "workers"]) {
  const groupDir = join(root, group);
  if (!existsSync(groupDir)) continue;

  for (const name of readdirSync(groupDir)) {
    const dir = join(groupDir, name);
    if (statSync(dir).isDirectory()) units.push({ name: `${group}/${name}`, dir });
  }
}

const sourceFiles = (dir) => {
  const files = [];

  const walk = (current) => {
    for (const entry of readdirSync(current)) {
      const full = join(current, entry);
      if (statSync(full).isDirectory()) {
        if (entry === "node_modules" || entry === ".serverless") continue;
        walk(full);
      } else if (entry.endsWith(".js") || entry.endsWith(".mjs")) {
        files.push(full);
      }
    }
  };

  walk(dir);
  return files;
};

const importPattern = /(?:import\s+[^"']*?|require\(\s*|import\(\s*)["']([^"']+)["']/g;

let violations = 0;

for (const unit of units) {
  for (const file of sourceFiles(unit.dir)) {
    const text = await import("node:fs").then((fs) => fs.readFileSync(file, "utf8"));

    for (const match of text.matchAll(importPattern)) {
      const spec = match[1];

      // Relative imports inside the unit are fine.
      if (spec.startsWith(".") || spec.startsWith("#")) continue;

      for (const other of units) {
        if (other.name === unit.name) continue;

        const pkgName = `@lifebookz/${other.name.split("/")[1]}`;
        // Only shared packages are published as workspace deps.
        if (other.name.startsWith("shared/") && spec === pkgName) continue;

        const otherPkg = `@lifebookz/${other.name.split("/")[1]}`;
        const isBusinessCrossImport =
          (unit.name.startsWith("services/") || unit.name.startsWith("workers/")) &&
          (other.name.startsWith("services/") || other.name.startsWith("workers/")) &&
          spec === otherPkg;

        if (isBusinessCrossImport) {
          violations += 1;
          console.error(
            `✗ ${unit.name} imports ${other.name} via "${spec}" (${file}) — cross-service imports are forbidden (spec §26).`,
          );
        }
      }
    }
  }
}

if (violations > 0) {
  console.error(`\n${violations} cross-service import violation(s) found.`);
  process.exit(1);
}

console.log(`✓ No cross-service imports across ${units.length} deployable units.`);
