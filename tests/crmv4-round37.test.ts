/**
 * CRM v4 round 37 helpers.
 * Run: npx tsx tests/crmv4-round37.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND37_COPY } from "../src/lib/crmv4/copy-round37";
import { auditLines, checkDone, docTimeline, docTypes, filterAudit, groupAudit, normalizeChecks } from "../src/lib/crmv4/round37";

function main() {
  assert.deepEqual(docTimeline({ id: "1", createdAt: "2026-10-01T00:00:00Z" }).map((step) => step.key), ["received"]);
  assert.deepEqual(
    docTimeline({ id: "1", createdAt: "2026-10-01T00:00:00Z", reviewedAt: "2026-10-02T00:00:00Z" }).map((step) => step.key),
    ["received", "reviewed"],
  );
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

  const copy = Object.keys(ROUND37_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND37_COPY[locale]).sort(), copy);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-kyc-gallery/);
  assert.match(css, /\.c4-audit-time/);
  assert.match(css, /#7a5e30/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round37.tsx"), "utf8");
  assert.match(view, /crmv4-kyc-check/);
  assert.match(view, /action: "review"/);
  assert.equal(view.includes("source=audit"), true);
  const login = fs.readFileSync(path.join(__dirname, "../src/app/(auth)/login/page.tsx"), "utf8");
  assert.match(login, /searchParams\?\.desk === "crmv4"/);
  console.log("crmv4 round37 tests passed");
}
main();
