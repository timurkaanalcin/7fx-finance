/**
 * CRM v3 round 37: document gallery and the audit timeline.
 * Run: npx tsx tests/crmv3-round37.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { GALLERY_AR, GALLERY_DE, GALLERY_EN, GALLERY_RU, GALLERY_TR } from "../src/lib/crmv3/copy-gallery";
import { auditLines, checkDone, docTimeline, docTypes, filterAudit, groupAudit, normalizeChecks } from "../src/lib/crmv3/gallery";

const ROOT = path.resolve(__dirname, "..");

function main() {
  assert.deepEqual(docTimeline({ id: "1", createdAt: "2026-10-01T00:00:00Z" }).map((step) => step.key), ["received"]);
  assert.deepEqual(
    docTimeline({ id: "1", createdAt: "2026-10-01T00:00:00Z", reviewedAt: "2026-10-02T00:00:00Z" }).map((step) => step.key),
    ["received", "reviewed"],
  );
  assert.equal(docTimeline({ id: "1" }).length, 0);
  assert.equal(checkDone(normalizeChecks({ name: true, photo: false })), 1);
  assert.equal(checkDone(normalizeChecks(null)), 0);
  assert.deepEqual(docTypes([{ docType: "ID" }, { docType: "ID" }, { docType: " ADDRESS " }]), ["ID", "ADDRESS"]);

  const rows = [
    { id: "1", at: "2026-10-31T10:00:00Z", action: "LOGIN", actor: "Ada", target: "desk", level: "info" },
    { id: "2", at: "2026-10-31T08:00:00Z", action: "REJECT", actor: "Bo", target: "doc-1", level: "warn" },
    { id: "3", at: "2026-10-30T08:00:00Z", action: "NOTE", actor: "Ada", target: "lead", level: "info" },
  ];
  const filtered = filterAudit(rows, { actor: "ada", action: "", entity: "" });
  assert.deepEqual(filtered.map((row) => row.id), ["1", "3"]);
  const days = groupAudit(filtered);
  assert.equal(days[0].day, "2026-10-31");
  assert.equal(days[1].day, "2026-10-30");
  assert.equal(filterAudit(rows, { actor: "", action: "reject", entity: "doc" })[0].id, "2");
  assert.equal(auditLines(filtered).length, 2);

  const copy = Object.keys(GALLERY_EN).sort();
  assert.deepEqual(Object.keys(GALLERY_TR).sort(), copy);
  assert.deepEqual(Object.keys(GALLERY_DE).sort(), copy);
  assert.deepEqual(Object.keys(GALLERY_RU).sort(), copy);
  assert.deepEqual(Object.keys(GALLERY_AR).sort(), copy);

  const lib = fs.readFileSync(path.join(ROOT, "src/lib/crmv3/gallery.ts"), "utf8");
  assert.match(lib, /crmv3-kyc-check/);
  assert.equal(lib.includes("crmv4"), false);
  const page = fs.readFileSync(path.join(ROOT, "src/components/crmv3/desk/gallery.tsx"), "utf8");
  assert.match(page, /CHECK_KEY/);
  assert.match(page, /action: "review"/);
  assert.match(page, /source=audit/);
  assert.match(page, /galNoFile/);
  assert.equal(page.includes("PATCH"), false);
  assert.equal(page.includes("crmv4"), false);
  const css = fs.readFileSync(path.join(ROOT, "src/components/crmv3/crmv3.css"), "utf8");
  assert.match(css, /\.c3-gallery/);
  assert.match(css, /\.c3-audit/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const customers = fs.readFileSync(path.join(ROOT, "src/components/crmv3/views/Customers.tsx"), "utf8");
  assert.match(customers, /KycStudio/);
  const logs = fs.readFileSync(path.join(ROOT, "src/components/crmv3/views/Logs.tsx"), "utf8");
  assert.match(logs, /AuditTimeline/);
  const login = fs.readFileSync(path.join(ROOT, "src/app/(auth)/login/page.tsx"), "utf8");
  assert.equal(login.includes("crmv3-kyc-check"), false);
  const tree = fs.readdirSync(path.join(ROOT, "src/components/crmv3"), { recursive: true }) as string[];
  for (const file of tree) {
    if (!String(file).endsWith(".tsx") && !String(file).endsWith(".ts")) continue;
    const src = fs.readFileSync(path.join(ROOT, "src/components/crmv3", String(file)), "utf8");
    assert.equal(src.includes("crmv4"), false, String(file));
  }
  console.log("crmv3 round37 tests passed");
}

main();
