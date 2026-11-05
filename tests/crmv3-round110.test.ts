/**
 * CSV column presets and audit UTC days.
 * Run: npx tsx tests/crmv3-round110.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { XV_AR, XV_DE, XV_EN, XV_RU, XV_TR } from "../src/lib/crmv3/copy-csvpresets";
import { crmv3Text } from "../src/lib/crmv3/copy";
import { keyTitle } from "../src/lib/crmv3/insights";
import { AUDIT_DAY_KEY, CSV_ACTIVE_KEY, CSV_PRESET_KEY } from "../src/lib/crmv3/csvpresets";
import { LIST_COLS } from "../src/lib/crmv3/table";
import { CRM_V3_MORE, CRM_V3_SECTIONS } from "../src/lib/crmv3/sections";
import { NAV_SECTIONS } from "../src/lib/crmv3/nav";
import {
  activeDay,
  activePresetColumns,
  columnText,
  csvLines,
  dayLines,
  keepColumns,
  namedDays,
  readHiddenDays,
  readPresets,
  resetColumns,
  tableColumns,
  toggleDay,
  upsertPreset,
  utcDay,
  visibleAudits,
  visibleDays,
} from "../src/lib/crmv3/csvpresets";

function main() {
  assert.equal(CSV_PRESET_KEY, "crmv3-csv-presets");
  assert.equal(CSV_ACTIVE_KEY, "crmv3-csv-columns");
  assert.equal(AUDIT_DAY_KEY, "crmv3-audit-day-hide");
  assert.deepEqual(tableColumns(null), ["customer", "country", "desk", "balance", "status"]);
  assert.deepEqual(tableColumns({ columns: ["sale", "nope", "sale", ""] }), ["sale"]);
  assert.deepEqual(LIST_COLS.includes("email" as never), false);
  const visible = ["customer", "country", "desk", "balance", "status"];
  assert.deepEqual(keepColumns(["balance", "email", "phone", "equity", "customer", "customer", " "], visible), ["customer", "balance"]);
  assert.deepEqual(keepColumns(["score"], visible), []);
  assert.deepEqual(resetColumns(visible), visible);
  assert.deepEqual(activePresetColumns(["email", ""], visible), visible);
  assert.deepEqual(activePresetColumns(["balance", "nope"], visible), ["balance"]);
  assert.deepEqual(readPresets([
    { name: " ", columns: ["customer"] },
    { name: "Desk", columns: ["email", "desk"] },
    { id: "Desk", name: "Again", columns: ["country"] },
    { id: "later", name: "Later", columns: ["phone"] },
  ], visible), [
    { id: "Desk", name: "Desk", columns: ["desk"] },
  ]);
  assert.deepEqual(upsertPreset([], "  ", ["customer"], visible), []);
  assert.deepEqual(upsertPreset([], "Names", ["email", "customer"], visible), [{ id: "names", name: "Names", columns: ["customer"] }]);

  const person = { id: "u1", name: "Ada", email: "ada@desk.test", country: "TR", balance: 10, currency: "TRY", active: true, account: { balance: 99, currency: "USD" } };
  assert.equal(columnText("customer", person), "Ada ada@desk.test");
  assert.equal(columnText("balance", person), "10 TRY");
  assert.equal(columnText("balance", { id: "u2", balance: 4 }), "4");
  assert.equal(columnText("balance", { id: "u3", currency: "USD" }), "");
  assert.equal(columnText("status", { id: "u4", active: false }), "frozen");
  assert.equal(columnText("status", { id: "u5", active: true }), "active");
  const lines = csvLines([person, { id: "u2", balance: 4, currency: "EUR" }], ["balance"]);
  assert.deepEqual(lines, [["10 TRY"], ["4 EUR"]]);
  assert.equal(lines.flat().join(" ").includes("+"), false);

  assert.equal(utcDay("2026-11-06T01:30:00+03:00"), "2026-11-05");
  assert.equal(utcDay("2026-11-05T23:30:00.000Z"), "2026-11-05");
  assert.equal(utcDay(""), "");
  assert.equal(utcDay("not-a-date"), "");
  assert.equal(utcDay(null), "");
  const audits = [
    { id: "a1", at: "2026-11-05T23:30:00.000Z", action: "LOGIN", actor: "Ada", target: "u1" },
    { id: "a2", at: "2026-11-06T01:30:00+03:00", action: "NOTE", actor: "Bea", target: "u2" },
    { id: "a3", at: "2026-11-04T00:00:00.000Z", action: "LOGIN", actor: "Cid", target: "u3" },
    { id: "a4", at: "", action: "BLANK", actor: "Dot", target: "u4" },
    { id: "a5", at: "yesterday", action: "BAD", actor: "Eve", target: "u5" },
  ];
  assert.deepEqual(dayLines(audits), [
    { day: "", count: 2 },
    { day: "2026-11-05", count: 2 },
    { day: "2026-11-04", count: 1 },
  ]);
  assert.deepEqual(namedDays(audits), ["2026-11-05", "2026-11-04"]);
  assert.deepEqual(visibleAudits(audits, "2026-11-05", false, "login").map((row) => row.id), ["a1"]);
  assert.deepEqual(visibleAudits(audits, "", true, "").map((row) => row.id), ["a4", "a5"]);
  assert.deepEqual(readHiddenDays(["2026-11-05", "2026-01-01", ""], ["2026-11-05", "2026-11-04"]), ["2026-11-05"]);
  assert.deepEqual(toggleDay(["2026-11-05"], "2026-01-01", ["2026-11-05"]), ["2026-11-05"]);
  assert.deepEqual(visibleDays(["2026-11-05", "2026-11-04"], ["2026-11-04"], false), ["2026-11-05"]);
  assert.equal(activeDay("2026-11-04", ["2026-11-05"]), "");

  const copy = Object.keys(XV_EN).sort();
  for (const table of [XV_TR, XV_DE, XV_RU, XV_AR]) assert.deepEqual(Object.keys(table).sort(), copy);
  assert.equal(crmv3Text("en", "xvTitle"), "CSV columns");
  assert.equal(crmv3Text("tr", "uyTitle"), XV_TR.uyTitle);
  assert.equal(keyTitle("crmv3-csv-presets", "de"), "CSV-Spalten");
  assert.equal(keyTitle("crmv3-audit-day-hide", "ar"), "أيام السجل");
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "csvpresets"), true);
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "auditdays"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("csvpresets"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("auditdays"), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "desk" && (group.ids as readonly string[]).includes("csvpresets")), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "compliance" && (group.ids as readonly string[]).includes("auditdays")), true);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv3/crmv3.css"), "utf8");
  assert.match(css, /\.c3-csv-presets/);
  assert.match(css, /\.c3-audit-days/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv3/desk/csvpresets.tsx"), "utf8");
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("setInterval"), false);
  assert.equal(view.includes("auditExport"), false);
  assert.equal(view.includes("fetch("), false);
  assert.equal(view.includes('?? "USD"'), false);
  assert.equal(view.includes("email"), false);
  assert.match(view, /\/api\/admin\/users\?view=table&take=40&meta=0&role=TRADER/);
  assert.match(view, /\/api\/admin\/control\?part=logs&source=audit&level=all&take=40/);
  assert.match(view, /data-csv-presets/);
  assert.match(view, /data-audit-days/);
  assert.match(view, /data-logo="mono"/);
  assert.match(view, /history/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv3/CrmV3App.tsx"), "utf8");
  assert.match(app, /view === "csvpresets"/);
  assert.match(app, /view === "auditdays"/);
  console.log("crmv3 round110 tests passed");
}

main();
