/**
 * Session note and withdrawal statuses.
 * Run: npx tsx tests/crmv4-round95.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND95_COPY } from "../src/lib/crmv4/copy-round95";
import { crmv4Text } from "../src/lib/crmv4/copy";
import {
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
} from "../src/lib/crmv4/round95";

function main() {
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

  const copy = Object.keys(ROUND95_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND95_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "syTitle"), "Session note");
  assert.equal(crmv4Text("tr", "wzTitle"), ROUND95_COPY.tr.wzTitle);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-session-note/);
  assert.match(css, /\.c4-wd-status/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round95.tsx"), "utf8");
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("setInterval"), false);
  assert.equal(view.includes("amount"), false);
  assert.match(view, /\/api\/admin\/withdrawals\?take=40/);
  assert.match(view, /data-session-note/);
  assert.match(view, /data-wd-status/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "sessionnote"/);
  assert.match(app, /view === "wdstatus"/);
  console.log("crmv4 round95 tests passed");
}

main();
