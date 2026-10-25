/**
 * Deploy doc names the merge order and environment variables, and the signed-out
 * smoke skip path runs without calling pass() as a string.
 * Run: npx tsx tests/round63-deploy-doc.test.ts
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const ROOT = path.resolve(__dirname, "..");

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

const ORDER = [
  "#46", "#49", "#53", "#54", "#55", "#57", "#58", "#59", "#60", "#61", "#62", "#63",
  "#64", "#65", "#66", "#67", "#68", "#69", "#70", "#71", "#72", "#73", "#74", "#75",
  "#76", "#77", "#78", "#79", "#80", "#81", "#82", "#83", "#84", "#85", "#86", "#87",
  "#88", "#89", "#90", "#52", "#56", "#48",
];

function main() {
  const pkg = JSON.parse(read("package.json"));
  assert.equal(pkg.dependencies.next, "14.2.35");
  assert.equal(pkg.dependencies.prisma, "5.22.0");
  assert.equal(pkg.devDependencies.prisma, undefined);

  const doc = read("docs/DEPLOY.md");
  const block = doc.match(/<!-- merge-order:start -->([\s\S]*?)<!-- merge-order:end -->/);
  assert.ok(block, "merge-order block");
  const lines = block[1].split("\n").map((line) => line.trim()).filter(Boolean);
  assert.deepEqual(lines, ORDER);
  assert.match(doc, /VAPID_PUBLIC_KEY/);
  assert.match(doc, /VAPID_PRIVATE_KEY/);
  assert.match(doc, /VAPID_SUBJECT/);
  assert.match(doc, /npx web-push generate-vapid-keys/);
  assert.match(doc, /npm run smoke -- --base-url https:\/\/7fx\.customer\.org\.tr --crm-url https:\/\/crm7fx\.customer\.org\.tr/);
  assert.match(doc, /vercel alias set <previous-deployment-url-or-id> 7fx\.customer\.org\.tr/);
  assert.match(doc, /b0d34d3/);
  assert.match(doc, /ERR_CERT_COMMON_NAME_INVALID/);
  assert.match(doc, /pass is not a function/);
  assert.match(doc, /SMOKE_USER/);
  assert.match(doc, /SMOKE_PASS/);
  assert.match(doc, /CRON_SECRET/);
  assert.match(doc, /SOURCE_ACCOUNT_API/);
  assert.equal(doc.includes("Trade123"), false);
  assert.equal(doc.includes("Admin123"), false);
  assert.equal(doc.includes("BEGIN PRIVATE"), false);
  assert.equal(doc.includes("BEGIN EC"), false);
  assert.equal(/mysql:\/\//.test(doc), false);
  assert.equal(doc.includes("deskflow"), false);

  const script = read("scripts/smoke.mjs");
  const isolated = script.replace(
    /main\(\)\.catch[\s\S]*$/,
    `
const logs = [];
console.log = (...args) => { logs.push(args.join(" ")); };
delete process.env.SMOKE_USER;
delete process.env.SMOKE_PASS;
await signedIn({ async newContext() { throw new Error("should not open a browser"); } }, "http://127.0.0.1:9");
if (!logs.some((line) => line.includes("ok   signed-in checks skipped"))) {
  console.error(logs.join("\\n"));
  process.exit(2);
}
`
  );
  const file = path.join(os.tmpdir(), "round63-smoke-skip.mjs");
  fs.writeFileSync(file, isolated);
  const skip = spawnSync(process.execPath, [file], {
    cwd: ROOT,
    encoding: "utf8",
    env: { ...process.env, SMOKE_USER: "", SMOKE_PASS: "" },
  });
  fs.unlinkSync(file);
  assert.equal(skip.status, 0, skip.stderr || skip.stdout);

  console.log("round63 deploy doc tests passed");
}

main();
