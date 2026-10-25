/**
 * Post-deploy smoke script stays read-only and takes its target from --base-url.
 * Run: npx tsx tests/round62-smoke.test.ts
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "..");

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function main() {
  const pkg = JSON.parse(read("package.json"));
  assert.equal(pkg.scripts.smoke, "node scripts/smoke.mjs");
  assert.equal(pkg.dependencies.next, "14.2.35");
  assert.equal(pkg.dependencies.prisma, "5.22.0");
  assert.equal(typeof pkg.devDependencies.playwright, "string");

  const script = read("scripts/smoke.mjs");
  assert.match(script, /--base-url/);
  assert.match(script, /SMOKE_USER/);
  assert.match(script, /SMOKE_PASS/);
  assert.match(script, /#fx-login-identifier/);
  assert.match(script, /#fx-login-password/);
  assert.match(script, /readOnly/);
  assert.match(script, /disabled/);
  assert.match(script, /\/markets/);
  assert.match(script, /\/faq/);
  assert.match(script, /\/trade/);
  assert.match(script, /\/api\/cron\/engine/);
  assert.match(script, /status === 401/);
  assert.match(script, /frame-ancestors 'none'/);
  assert.match(script, /x-frame-options/);
  assert.match(script, /crm7fx\.localhost/);
  assert.match(script, /crm7fx\.customer\.org\.tr/);
  assert.match(script, /Those details do not match an account\./);
  assert.match(script, /Trade global markets from one account/);
  assert.match(script, /aria-label="رجوع"/);
  assert.match(script, /matrix\(-1/);
  assert.equal(script.includes("Trade123"), false);
  assert.equal(script.includes("Admin123"), false);
  assert.equal(script.includes("trader@deskflow.local"), false);
  assert.equal(script.includes("admin@7fx.local"), false);
  assert.equal(script.includes("[..."), false);
  assert.equal(script.includes("new Set"), false);
  assert.equal(script.includes("new Map"), false);
  assert.equal(script.includes("/api/orders"), false);
  assert.equal(script.includes("/api/positions"), false);
  assert.equal(script.includes("changePassword"), false);

  const login = read("src/components/auth/LoginForm.tsx");
  assert.match(login, /id="fx-login-identifier"[\s\S]*?readOnly=\{loading\}/);
  assert.match(login, /id="fx-login-password"[\s\S]*?readOnly=\{loading\}/);
  assert.equal(/id="fx-login-identifier"[\s\S]{0,500}disabled=\{loading\}/.test(login), false);
  assert.equal(/id="fx-login-password"[\s\S]{0,500}disabled=\{loading\}/.test(login), false);
  assert.match(read("src/lib/session-cookie.ts"), /return Array\.from\(domains\)/);
  assert.equal(read("src/lib/session-cookie.ts").includes("[...domains]"), false);

  const missing = spawnSync(process.execPath, ["scripts/smoke.mjs"], { cwd: ROOT, encoding: "utf8" });
  assert.notEqual(missing.status, 0);
  assert.match(missing.stderr, /--base-url/);

  const help = spawnSync(process.execPath, ["scripts/smoke.mjs", "--help"], { cwd: ROOT, encoding: "utf8" });
  assert.equal(help.status, 0);
  assert.match(help.stderr, /SMOKE_USER/);

  console.log("round62 smoke tests passed");
}

main();
