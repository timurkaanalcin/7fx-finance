/**
 * CRM v3 document gallery and audit history.
 * Run: npx tsx tests/crmv3-round50.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { PAPER_AR, PAPER_DE, PAPER_EN, PAPER_RU, PAPER_TR } from "../src/lib/crmv3/copy-papers";
import { catalogLocalesComplete, keyTitle } from "../src/lib/crmv3/insights";
import { NAV_SECTIONS } from "../src/lib/crmv3/nav";
import {
  CHECK_KEYS,
  EMPTY_CHECKS,
  GALLERY_KEY,
  checkCount,
  docTypes,
  filterAudit,
  filterDocs,
  findDay,
  groupAudit,
  historyCsv,
  moneyLines,
  moneyOf,
  personOf,
  readChecks,
  setCheck,
} from "../src/lib/crmv3/papers";
import { CRM_V3_MORE, CRM_V3_SECTIONS } from "../src/lib/crmv3/sections";

const ROOT = path.resolve(__dirname, "..");

function main() {
  const docs = [
    { id: "d1", name: "Passport", docType: "ID", trader: "Ada", traderEmail: "ada@desk.test", traderId: "u1" },
    { id: "d2", name: "Bill", docType: "ADDRESS", trader: "Bea", traderEmail: "bea@desk.test", traderId: "u2" },
  ];
  assert.deepEqual(docTypes(docs), ["ADDRESS", "ID"]);
  assert.equal(filterDocs(docs, "ID", "ada").length, 1);
  assert.equal(filterDocs(docs, "", "missing").length, 0);
  assert.equal(personOf([{ id: "u1", name: "Ada", documentsStatus: "PENDING" }], "u1")?.name, "Ada");
  assert.equal(personOf([{ id: "u1", name: "Ada" }], "u9"), null);
  const checks = setCheck(readChecks({}), "d1", "name", true);
  assert.equal(checkCount(checks.d1), 1);
  assert.equal(checkCount(EMPTY_CHECKS), 0);
  assert.equal(setCheck(checks, "d1", "name", false).d1.name, false);
  assert.equal(CHECK_KEYS.length, 4);
  assert.equal(GALLERY_KEY, "crmv3-gallery-checks");

  const rows = [
    { id: "1", at: "2026-11-05T01:00:00Z", action: "DEPOSIT", actor: "Ada", target: "t1", level: "info", detail: JSON.stringify({ meta: { amount: 10, currency: "TRY" } }) },
    { id: "2", at: "2026-11-05T02:00:00Z", action: "DEPOSIT", actor: "Bea", target: "t2", level: "info", detail: JSON.stringify({ amount: 5, currency: "USD" }) },
    { id: "3", at: "2026-11-04T02:00:00Z", action: "REJECT", actor: "Ada", target: "t3", level: "warn", detail: "" },
    { id: "4", at: "", action: "NOTE", actor: "Cem", target: "", level: "info", detail: "{}" },
  ];
  const lines = moneyLines(filterAudit(rows, "info"));
  assert.equal(lines.find((row) => row.currency === "TRY")?.amount, 10);
  assert.equal(lines.find((row) => row.currency === "USD")?.amount, 5);
  assert.equal(lines.some((row) => row.amount === 15), false);
  assert.equal(moneyOf("not-json"), null);
  assert.equal(moneyOf(JSON.stringify({ amount: 4 })), null);
  const groups = groupAudit(rows);
  assert.equal(groups[0].day, "2026-11-05");
  assert.equal(groups[groups.length - 1].day, "");
  assert.equal(findDay(groups.map((group) => group.day), "2026-11-04"), "2026-11-04");
  assert.equal(findDay(groups.map((group) => group.day), "2026-01-01"), "");
  const csv = historyCsv(rows);
  assert.equal(csv[0][5], "TRY");
  assert.equal(csv[0][6], "10");
  assert.equal(csv.some((line) => line.join(",").includes("15")), false);

  const copy = Object.keys(PAPER_EN).sort();
  assert.deepEqual(Object.keys(PAPER_TR).sort(), copy);
  assert.deepEqual(Object.keys(PAPER_DE).sort(), copy);
  assert.deepEqual(Object.keys(PAPER_RU).sort(), copy);
  assert.deepEqual(Object.keys(PAPER_AR).sort(), copy);
  assert.notEqual(PAPER_TR.glTitle, PAPER_EN.glTitle);
  assert.notEqual(PAPER_DE.hsHint, PAPER_EN.hsHint);
  assert.notEqual(PAPER_RU.glViewer, PAPER_EN.glViewer);
  assert.notEqual(PAPER_AR.hsEmpty, PAPER_EN.hsEmpty);
  assert.equal(catalogLocalesComplete(), true);
  assert.equal(keyTitle("crmv3-gallery-checks", "en"), "Document checklist");
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "gallery"), true);
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "history"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("gallery"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("history"), true);
  assert.equal(NAV_SECTIONS.some((group) => (group.ids as readonly string[]).includes("gallery")), true);
  assert.equal(NAV_SECTIONS.some((group) => (group.ids as readonly string[]).includes("history")), true);

  const css = fs.readFileSync(path.join(ROOT, "src/components/crmv3/crmv3.css"), "utf8");
  assert.match(css, /\.c3-paper-grid/);
  assert.match(css, /\.c3-paper-checks/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(ROOT, "src/components/crmv3/desk/papers.tsx"), "utf8");
  assert.match(view, /data-confirm/);
  assert.match(view, /aria-required=\{false\}/);
  assert.match(view, /action: "review"/);
  assert.equal(view.includes("crmv4"), false);
  const history = view.slice(view.indexOf("export function HistoryDesk"));
  assert.match(history, /exportCsv/);
  assert.equal(history.includes("sendJson"), false);
  const app = fs.readFileSync(path.join(ROOT, "src/components/crmv3/CrmV3App.tsx"), "utf8");
  assert.match(app, /view === "gallery"/);
  assert.match(app, /view === "history"/);
  console.log("crmv3 round50 tests passed");
}

main();
