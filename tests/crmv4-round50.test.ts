/**
 * Document gallery and audit history.
 * Run: npx tsx tests/crmv4-round50.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND50_COPY } from "../src/lib/crmv4/copy-round50";
import {
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
  EMPTY_CHECKS,
} from "../src/lib/crmv4/round50";

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

  const copy = Object.keys(ROUND50_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND50_COPY[locale]).sort(), copy);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-gallery-desk/);
  assert.match(css, /\.c4-history-desk/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round50.tsx"), "utf8");
  assert.match(view, /data-confirm/);
  assert.match(view, /aria-required=\{false\}/);
  assert.match(view, /action: "review"/);
  const history = view.slice(view.indexOf("export function HistoryDesk"));
  assert.match(history, /exportCsv/);
  assert.equal(history.includes("sendJson"), false);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "gallery"/);
  assert.match(app, /view === "history"/);
  console.log("crmv4 round50 tests passed");
}

main();
