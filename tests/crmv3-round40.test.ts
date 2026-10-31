/**
 * CRM v3 round 40: dossier and keyboard close.
 * Run: npx tsx tests/crmv3-round40.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { DOSSIER_AR, DOSSIER_DE, DOSSIER_EN, DOSSIER_RU, DOSSIER_TR } from "../src/lib/crmv3/copy-dossier";
import { clipText, followMark, latestActivity } from "../src/lib/crmv3/dossier";

const ROOT = path.resolve(__dirname, "..");

function main() {
  const latest = latestActivity(
    [{ createdAt: "2026-10-27T10:00:00Z", body: "Call about the file" }],
    [{ createdAt: "2026-10-30T10:00:00Z", kind: "PAGE", path: "/trade" }],
  );
  assert.equal(latest?.kind, "event");
  assert.equal(latest?.text, "PAGE · /trade");
  assert.equal(followMark("2026-10-27T10:00:00Z", "2026-10-31"), "overdue");
  assert.equal(followMark("2026-10-31T10:00:00Z", "2026-10-31"), "today");
  assert.equal(followMark("2026-11-02T10:00:00Z", "2026-10-31"), "later");
  assert.equal(followMark("", "2026-10-31"), "none");
  assert.equal(clipText("a".repeat(90)).endsWith("…"), true);
  assert.equal(clipText("short"), "short");

  const copy = Object.keys(DOSSIER_EN).sort();
  assert.deepEqual(Object.keys(DOSSIER_TR).sort(), copy);
  assert.deepEqual(Object.keys(DOSSIER_DE).sort(), copy);
  assert.deepEqual(Object.keys(DOSSIER_RU).sort(), copy);
  assert.deepEqual(Object.keys(DOSSIER_AR).sort(), copy);

  const lib = fs.readFileSync(path.join(ROOT, "src/lib/crmv3/dossier.ts"), "utf8");
  assert.equal(lib.includes("crmv4"), false);
  const focus = fs.readFileSync(path.join(ROOT, "src/lib/crmv3/focus.ts"), "utf8");
  assert.match(focus, /Escape/);
  const page = fs.readFileSync(path.join(ROOT, "src/components/crmv3/desk/dossier.tsx"), "utf8");
  assert.match(page, /data-dossier="1"/);
  assert.equal(page.includes("sendJson"), false);
  assert.equal(page.includes("crmv4"), false);
  const sheet = fs.readFileSync(path.join(ROOT, "src/components/crmv3/kit.tsx"), "utf8");
  assert.match(sheet, /Escape/);
  assert.match(sheet, /trapFocus/);
  assert.match(sheet, /closeBtn/);
  const phone = fs.readFileSync(path.join(ROOT, "src/components/crmv3/desk/system.tsx"), "utf8");
  assert.match(phone, /useEscape/);
  const css = fs.readFileSync(path.join(ROOT, "src/components/crmv3/crmv3.css"), "utf8");
  assert.match(css, /\.c3-dossier/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const customers = fs.readFileSync(path.join(ROOT, "src/components/crmv3/views/Customers.tsx"), "utf8");
  assert.match(customers, /Dossier/);
  const tree = fs.readdirSync(path.join(ROOT, "src/components/crmv3"), { recursive: true }) as string[];
  for (const file of tree) {
    if (!String(file).endsWith(".tsx") && !String(file).endsWith(".ts")) continue;
    const src = fs.readFileSync(path.join(ROOT, "src/components/crmv3", String(file)), "utf8");
    assert.equal(src.includes("crmv4"), false, String(file));
  }
  console.log("crmv3 round40 tests passed");
}

main();
