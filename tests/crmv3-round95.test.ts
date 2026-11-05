/**
 * CRM v3 session note and withdrawal status glance.
 * Run: npx tsx tests/crmv3-round95.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { SY_AR, SY_DE, SY_EN, SY_RU, SY_TR } from "../src/lib/crmv3/copy-session";
import { crmv3Text } from "../src/lib/crmv3/copy";
import { catalogLocalesComplete, keyTitle } from "../src/lib/crmv3/insights";
import { NAV_SECTIONS } from "../src/lib/crmv3/nav";
import { CRM_V3_MORE, CRM_V3_SECTIONS } from "../src/lib/crmv3/sections";
import {
  NOTE_KEY,
  WD_STATUS_KEY,
  activeStatus,
  namedStatuses,
  noteText,
  readHiddenStatuses,
  readSession,
  saveSession,
  statusLines,
  statusText,
  toggleStatus,
  utcDay,
  visibleStatuses,
  visibleWithdrawals,
} from "../src/lib/crmv3/sessionnote";

const ROOT = path.resolve(__dirname, "..");

function main() {
  assert.equal(NOTE_KEY, "crmv3-session-note");
  assert.equal(WD_STATUS_KEY, "crmv3-wd-status-hide");
  assert.equal(utcDay(Date.parse("2026-11-05T23:30:00Z")), "2026-11-05");
  assert.equal(noteText("  \n "), "");
  assert.equal(noteText(" Desk\nquiet "), "Desk quiet");
  assert.equal(noteText("x".repeat(300)).length, 240);
  assert.equal(saveSession("2026-11-05", "   "), null);
  assert.deepEqual(saveSession("2026-11-05", "Desk quiet"), { day: "2026-11-05", text: "Desk quiet" });
  assert.equal(readSession({ day: "2026-11-04", text: "Yesterday" }, "2026-11-05"), "");
  assert.equal(readSession({ day: "2026-11-05", text: "Desk quiet" }, "2026-11-05"), "Desk quiet");
  assert.equal(readSession({ day: "2026-11-05", text: "   " }, "2026-11-05"), "");

  const rows = [
    { id: "a", label: "Ada", status: " PENDING " },
    { id: "b", label: "Bea", status: "PENDING" },
    { id: "c", label: "Cid", status: { status: "APPROVED" } },
    { id: "d", label: "Dot", status: null },
    { id: "e", label: "Eve" },
  ];
  assert.equal(statusText(" PENDING "), "PENDING");
  assert.equal(statusText(undefined), "");
  assert.deepEqual(statusLines(rows), [
    { status: "", count: 2 },
    { status: "APPROVED", count: 1 },
    { status: "PENDING", count: 2 },
  ]);
  assert.deepEqual(namedStatuses(rows), ["APPROVED", "PENDING"]);
  assert.equal(namedStatuses([{ status: null }]).includes("REJECTED"), false);
  assert.deepEqual(visibleWithdrawals(rows, "PENDING", false, "ada").map((row) => row.id), ["a"]);
  assert.deepEqual(visibleWithdrawals(rows, "", true, "").map((row) => row.id), ["d", "e"]);
  assert.equal(visibleWithdrawals(rows, "APPROVED", false, "").some((row) => row.id === "d"), false);
  assert.deepEqual(readHiddenStatuses(["PENDING", "Invented", ""], ["PENDING", "APPROVED"]), ["PENDING"]);
  assert.deepEqual(toggleStatus(["PENDING"], "APPROVED", ["PENDING", "APPROVED"]), ["PENDING", "APPROVED"]);
  assert.deepEqual(visibleStatuses(["PENDING", "APPROVED"], ["APPROVED"], false), ["PENDING"]);
  assert.equal(activeStatus("APPROVED", ["PENDING"]), "");

  const copy = Object.keys(SY_EN).sort();
  assert.deepEqual(Object.keys(SY_TR).sort(), copy);
  assert.deepEqual(Object.keys(SY_DE).sort(), copy);
  assert.deepEqual(Object.keys(SY_RU).sort(), copy);
  assert.deepEqual(Object.keys(SY_AR).sort(), copy);
  assert.notEqual(SY_TR.syTitle, SY_EN.syTitle);
  assert.notEqual(SY_DE.wzHint, SY_EN.wzHint);
  assert.notEqual(SY_RU.wzBlank, SY_EN.wzBlank);
  assert.notEqual(SY_AR.syBlank, SY_EN.syBlank);
  assert.equal(crmv3Text("en", "syTitle"), "Session note");
  assert.equal(crmv3Text("tr", "wzTitle"), SY_TR.wzTitle);
  assert.equal(catalogLocalesComplete(), true);
  assert.equal(keyTitle("crmv3-session-note", "de"), "Sitzungsnotiz");
  assert.equal(keyTitle("crmv3-wd-status-hide", "tr"), "Durum bakışı");
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "sessionnote"), true);
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "wdstatus"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("sessionnote"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("wdstatus"), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "desk" && (group.ids as readonly string[]).includes("sessionnote")), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "money" && (group.ids as readonly string[]).includes("wdstatus")), true);

  const css = fs.readFileSync(path.join(ROOT, "src/components/crmv3/crmv3.css"), "utf8");
  assert.match(css, /\.c3-session-note/);
  assert.match(css, /\.c3-wd-status/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(ROOT, "src/components/crmv3/desk/session.tsx"), "utf8");
  assert.equal(view.includes("crmv4"), false);
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("setInterval"), false);
  assert.equal(view.includes("amount"), false);
  assert.match(view, /\/api\/admin\/withdrawals\?take=40/);
  assert.match(view, /data-session-note/);
  assert.match(view, /data-wd-status/);
  assert.match(view, /NOTE_KEY/);
  assert.match(view, /WD_STATUS_KEY/);
  const app = fs.readFileSync(path.join(ROOT, "src/components/crmv3/CrmV3App.tsx"), "utf8");
  assert.match(app, /view === "sessionnote"/);
  assert.match(app, /view === "wdstatus"/);
  assert.equal(app.includes("/api/notifications"), false);
  console.log("crmv3 round95 tests passed");
}

main();
