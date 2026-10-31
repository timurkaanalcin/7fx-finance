/**
 * Ticket inbox and introducer helpers.
 * Run: npx tsx tests/crmv4-round45.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND45_COPY } from "../src/lib/crmv4/copy-round45";
import { csvMatrix, filterTickets, introducers, readViews, saveView, slaClock, ticketMove } from "../src/lib/crmv4/round45";

function main() {
  const now = Date.parse("2026-10-31T12:00:00Z");
  const opened = "2026-10-31T00:00:00Z";
  const due = slaClock(opened, null, now, 24, 4);
  assert.equal(due.mark, "ok");
  assert.equal(due.replyHours, null);
  const soon = slaClock("2026-10-30T16:00:00Z", null, now, 24, 4);
  assert.equal(soon.mark, "due");
  const late = slaClock("2026-10-29T00:00:00Z", "2026-10-30T00:00:00Z", now, 24, 4);
  assert.equal(late.mark, "breached");
  assert.equal(late.replyHours != null && late.replyHours > 0, true);
  assert.equal(slaClock("", null, now, 24, 4).mark, "none");
  const rows = [
    { id: "a", status: "PENDING", kind: "DEPOSIT", openedAt: "2026-10-29T00:00:00Z", closedAt: null },
    { id: "b", status: "APPROVED", kind: "WITHDRAW", openedAt: opened, closedAt: null },
  ];
  assert.equal(filterTickets(rows, { status: "PENDING", kind: "", sla: "breached" }, now, 24, 4).length, 1);
  assert.equal(filterTickets(rows, { status: "", kind: "WITHDRAW", sla: "" }, now, 24, 4)[0].id, "b");
  const views = saveView(readViews([{ name: "Late", status: "PENDING", sla: "breached" }]), { id: "2", name: "Cash", status: "", kind: "DEPOSIT", sla: "" });
  assert.equal(views.length, 2);
  assert.equal(readViews("no").length, 0);
  const stats = introducers(
    [{ id: "1", affiliateA: "Ada" }, { id: "2", affiliateA: "Ada" }, { id: "3", affiliateA: "" }],
    [
      { userId: "1", amount: 10, currency: "TRY" },
      { userId: "1", amount: 3, currency: "USD" },
      { userId: "2", amount: 5, currency: "TRY" },
    ],
  );
  const ada = stats.find((row) => row.name === "Ada");
  assert.equal(ada?.customers, 2);
  assert.equal(ada?.withDeposit, 2);
  assert.equal(ada?.sums.find((row) => row.currency === "TRY")?.amount, 15);
  assert.equal(ada?.sums.find((row) => row.currency === "USD")?.amount, 3);
  const matrix = csvMatrix(stats, ["TRY", "USD"]);
  assert.equal(matrix[0].includes("15") || matrix.some((line) => line.includes("15")), true);
  assert.equal(matrix.some((line) => line.join("|").includes("18")), false);
  assert.equal(ticketMove(0, 3, -1), 0);
  assert.equal(ticketMove(2, 3, 1), 2);

  const copy = Object.keys(ROUND45_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND45_COPY[locale]).sort(), copy);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-inbox-desk/);
  assert.match(css, /\.c4-aff-desk/);
  assert.match(css, /#7a5e30/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round45.tsx"), "utf8");
  assert.match(view, /approvalBody/);
  assert.match(view, /data-confirm/);
  const desk = view.slice(view.indexOf("export function AffiliateDesk"));
  assert.equal(desk.includes("sendJson"), false);
  console.log("crmv4 round45 tests passed");
}

main();
