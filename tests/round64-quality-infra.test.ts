/**
 * CRM certificate mismatches are an infra warning, and inline ESLint disables say why.
 * Run: npx tsx tests/round64-quality-infra.test.ts
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

function walk(dir: string, out: string[] = []): string[] {
  for (const name of fs.readdirSync(dir)) {
    if (name === "node_modules" || name === ".next") continue;
    const abs = path.join(dir, name);
    const stat = fs.statSync(abs);
    if (stat.isDirectory()) walk(abs, out);
    else if (name.endsWith(".ts") || name.endsWith(".tsx")) out.push(abs);
  }
  return out;
}

function main() {
  const pkg = JSON.parse(read("package.json"));
  assert.equal(pkg.dependencies.next, "14.2.35");
  assert.equal(pkg.dependencies.prisma, "5.22.0");

  const doc = read("docs/DEPLOY.md");
  assert.match(doc, /94\.73\.150\.188/);
  assert.match(doc, /cpls12\.srvpanel\.com/);
  assert.match(doc, /infra CRM host cert\/DNS mismatch/);
  assert.equal(doc.includes("Trade123"), false);
  assert.equal(doc.includes("Admin123"), false);
  assert.equal(/mysql:\/\//.test(doc), false);

  const script = read("scripts/smoke.mjs");
  assert.match(script, /function infra\(/);
  assert.match(script, /function hostCoveredByCert\(/);
  assert.match(script, /function certMismatchMessage\(/);
  assert.match(script, /CRM host cert\/DNS mismatch/);
  assert.match(script, /SMOKE_IGNORE_HTTPS === "1"/);
  assert.equal(script.includes("[..."), false);
  assert.equal(script.includes("new Set"), false);
  assert.equal(script.includes("new Map"), false);

  for (const file of walk(path.join(ROOT, "src"))) {
    const lines = fs.readFileSync(file, "utf8").split("\n");
    lines.forEach((line, index) => {
      if (line.includes("eslint-disable") && !line.includes("--")) {
        assert.fail(`${path.relative(ROOT, file)}:${index + 1} eslint-disable has no reason`);
      }
    });
  }

  const positions = read("src/components/crm/EditablePositionsTable.tsx");
  assert.equal(positions.includes("draft!"), false);
  const blotter = read("src/components/trading/BottomPanels.tsx");
  assert.equal(blotter.includes("sort!"), false);
  const guard = read("src/components/security/ScreenshotGuard.tsx");
  assert.equal(guard.includes("origGetDisplay!"), false);

  const isolated = script.replace(
    /main\(\)\.catch[\s\S]*$/,
    `
const covered = hostCoveredByCert("crm7fx.customer.org.tr", {
  subject: { CN: "cpls12.srvpanel.com" },
  subjectaltname: "DNS:cpls12.srvpanel.com",
});
const same = hostCoveredByCert("crm7fx.customer.org.tr", {
  subject: { CN: "crm7fx.customer.org.tr" },
  subjectaltname: "",
});
const wild = hostCoveredByCert("crm7fx.customer.org.tr", {
  subject: { CN: "cpls12.srvpanel.com" },
  subjectaltname: "DNS:*.customer.org.tr",
});
const deep = hostCoveredByCert("a.b.customer.org.tr", {
  subject: { CN: "cpls12.srvpanel.com" },
  subjectaltname: "DNS:*.customer.org.tr",
});
const withIp = certMismatchMessage("crm7fx.customer.org.tr", "94.73.150.188", "cpls12.srvpanel.com");
const noIp = certMismatchMessage("crm7fx.customer.org.tr", "", "cpls12.srvpanel.com");
if (covered !== false || same !== true || wild !== true || deep !== false) process.exit(2);
if (!withIp.includes("resolved 94.73.150.188") || !withIp.includes("certificate CN cpls12.srvpanel.com")) process.exit(3);
if (noIp.includes("resolved")) process.exit(4);
console.log("infra classifier ok");
`
  );
  const file = path.join(os.tmpdir(), "round64-smoke-infra.mjs");
  fs.writeFileSync(file, isolated);
  const probe = spawnSync(process.execPath, [file], { cwd: ROOT, encoding: "utf8" });
  fs.unlinkSync(file);
  assert.equal(probe.status, 0, probe.stderr || probe.stdout);
  assert.match(probe.stdout, /infra classifier ok/);

  console.log("round64 quality infra tests passed");
}

main();
