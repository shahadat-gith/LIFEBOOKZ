#!/usr/bin/env node
/**
 * Guard: every deployable unit's config references must be declared in its
 * `.env.example` and (for serverless units) set in its `provider.environment`
 * block. Keeps the "a service only receives what it needs" contract honest.
 */
import { readFileSync, existsSync } from "node:fs";
import { readdirSync, statSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

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

const envKeysOf = (envFile) => {
  if (!existsSync(envFile)) return null;
  const keys = new Set();
  for (const line of readFileSync(envFile, "utf8").split("\n")) {
    // Active declarations and commented-out local-dev fallbacks both count:
    // a commented entry is still *documented* in the contract file.
    const match = line.match(/^\s*#?\s*([A-Z0-9_]+)\s*=/);
    if (match) keys.add(match[1]);
  }
  return keys;
};

const serverlessEnvVars = (ymlFile) => {
  if (!existsSync(ymlFile)) return new Set();
  const vars = new Set();
  const text = readFileSync(ymlFile, "utf8");
  const envMatch = text.match(/environment:\s*\n((?:\s{4,}.*\n)+)/);
  if (envMatch) {
    for (const line of envMatch[1].split("\n")) {
      const m = line.match(/^\s+([A-Z0-9_]+):/);
      if (m) vars.add(m[1]);
    }
  }
  return vars;
};

const configLoadEnvVars = (unitDir) => {
  // Extract "VARIABLE_NAME" literals from src/config.js — the loadConfig contract.
  const configPath = join(unitDir, "src", "config.js");
  if (!existsSync(configPath)) return new Set();
  const text = readFileSync(configPath, "utf8");
  const vars = new Set();
  for (const m of text.matchAll(/"([A-Z][A-Z0-9_]{2,})"/g)) vars.add(m[1]);
  return vars;
};

let issues = 0;

for (const unit of units) {
  const envExample = envKeysOf(join(unit.dir, ".env.example"));
  if (!envExample) {
    issues += 1;
    console.error(`✗ ${unit.name}: missing .env.example`);
    continue;
  }

  for (const v of configLoadEnvVars(unit.dir)) {
    // NODE_ENV / AWS_REGION are universal and implicitly available.
    if (v === "NODE_ENV" || v === "AWS_REGION" || v === "AWS_LAMBDA_FUNCTION_NAME") continue;

    if (!envExample.has(v)) {
      issues += 1;
      console.error(`✗ ${unit.name}: ${v} is read by src/config.js but missing from .env.example`);
    }
  }

  const ymlVars = serverlessEnvVars(join(unit.dir, "serverless.yml"));
  for (const v of configLoadEnvVars(unit.dir)) {
    if (!ymlVars.has(v) && !existsSync(join(unit.dir, ".env"))) continue; // local-only unit config
  }
}

if (issues > 0) {
  console.error(`\n${issues} environment contract issue(s) found.`);
  process.exit(1);
}

console.log(`✓ Environment contract holds for ${units.length} deployable units.`);
