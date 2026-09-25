#!/usr/bin/env node
/**
 * Package every deployable unit with Serverless (`serverless package`) and
 * report the result. Used for local verification without AWS credentials —
 * packaging generates the CloudFormation template, which is exactly what
 * `serverless deploy` would send.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, statSync, join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const units = [];
for (const group of ["services", "workers"]) {
  const groupDir = join(root, group);
  if (!existsSync(groupDir)) continue;

  for (const name of readdirSync(groupDir)) {
    const dir = join(groupDir, name);
    if (statSync(dir).isDirectory() && existsSync(join(dir, "serverless.yml"))) units.push({ name, dir });
  }
}

let failures = 0;

for (const unit of units) {
  console.log(`\n▶ packaging ${unit.name} …`);
  const result = spawnSync("npx", ["serverless", "package"], {
    cwd: unit.dir,
    encoding: "utf8",
    shell: process.platform === "win32",
    env: { ...process.env, SLS_TELEMETRY_DISABLED: "1" },
  });

  const ok = result.status === 0;
  if (!ok) failures += 1;

  console.log(ok ? `✓ ${unit.name} packaged` : `✗ ${unit.name} FAILED`);
  if (!ok) {
    console.error((result.stderr || result.stdout || "").split("\n").slice(0, 30).join("\n"));
  }
}

console.log(failures === 0 ? `\nAll ${units.length} units packaged successfully.` : `\n${failures} unit(s) failed to package.`);
process.exit(failures === 0 ? 0 : 1);
