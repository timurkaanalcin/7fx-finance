/**
 * CRM v3 round 45: ticket inbox SLA and introducer stats.
 * Run: npx tsx tests/crmv3-round45.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { INBOX_AR, INBOX_DE, INBOX_EN, INBOX_RU, INBOX_TR } from "../src/lib/crmv3/copy-inbox";
import { catalogLocalesComplete, keyTitle } from "../src/lib/crmv3/insights";
import { NAV_SECTIONS } from "../src/lib/crmv3/nav";
import {
  ROLE_KEY,
  VIEW_KEY,
  csvMatrix,
  deskRole,
  filterTickets,
  introducers,
  readViews,
  saveView,
  slaClock,
  ticketMove,
} from "../src/lib/crmv3/inbox-sla";
import { CRM_V3_MORE, CRM_V3_SECTIONS } from "../src/lib/crmv3/sections";

const ROOT = path.resolve(__dirname, "..");

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
  const none = stats.find((row) => row.name === "");
  assert.equal(ada?.customers, 2);
  assert.equal(ada?.withDeposit, 2);
  assert.equal(none?.customers, 1);
  assert.equal(none?.withDeposit, 0);
  assert.equal(ada?.sums.find((row) => row.currency === "TRY")?.amount, 15);
  assert.equal(ada?.sums.find((row) => row.currency === "USD")?.amount, 3);
  const matrix = csvMatrix(stats, ["TRY", "USD"]);
  assert.equal(matrix.some((line) => line.includes("15")), true);
  assert.equal(matrix.some((line) => line.join("|").includes("18")), false);
  assert.equal(ticketMove(0, 3, -1), 0);
  assert.equal(ticketMove(2, 3, 1), 2);
  assert.equal(deskRole("viewer"), "viewer");
  assert.equal(deskRole("desk"), "desk");
  assert.equal(ROLE_KEY.startsWith("crmv3-"), true);
  assert.equal(VIEW_KEY.startsWith("crmv3-"), true);

  const copy = Object.keys(INBOX_EN).sort();
  assert.deepEqual(Object.keys(INBOX_TR).sort(), copy);
  assert.deepEqual(Object.keys(INBOX_DE).sort(), copy);
  assert.deepEqual(Object.keys(INBOX_RU).sort(), copy);
  assert.deepEqual(Object.keys(INBOX_AR).sort(), copy);
  assert.notEqual(INBOX_TR.inTitle, INBOX_EN.inTitle);
  assert.notEqual(INBOX_DE.afTitle, INBOX_EN.afTitle);
  assert.notEqual(INBOX_RU.inDue, INBOX_EN.inDue);
  assert.notEqual(INBOX_AR.afNone, INBOX_EN.afNone);
  assert.equal(catalogLocalesComplete(), true);
  assert.equal(keyTitle("crmv3-ticket-views", "tr"), "Talep görünümleri");
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "affiliates"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("affiliates"), true);
  assert.equal(NAV_SECTIONS.some((group) => (group.ids as readonly string[]).includes("affiliates")), true);

  const css = fs.readFileSync(path.join(ROOT, "src/components/crmv3/crmv3.css"), "utf8");
  assert.match(css, /\.c3-inbox/);
  assert.match(css, /\.c3-aff/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(ROOT, "src/components/crmv3/desk/tickets.tsx"), "utf8");
  assert.match(view, /approvalBody/);
  assert.match(view, /data-confirm/);
  assert.match(view, /aria-required=\{false\}/);
  const lib = fs.readFileSync(path.join(ROOT, "src/lib/crmv3/inbox-sla.ts"), "utf8");
  assert.match(lib, /crmv3-ticket-views/);
  assert.match(lib, /crmv3-desk-role/);
  assert.equal(lib.includes("crmv4"), false);
  const desk = view.slice(view.indexOf("export function AffiliateDesk"));
  assert.equal(desk.includes("sendJson"), false);
  const app = fs.readFileSync(path.join(ROOT, "src/components/crmv3/CrmV3App.tsx"), "utf8");
  assert.match(app, /view === "affiliates"/);
  const support = fs.readFileSync(path.join(ROOT, "src/components/crmv3/views/Support.tsx"), "utf8");
  assert.match(support, /TicketInbox/);
  const tree = fs.readdirSync(path.join(ROOT, "src/components/crmv3"), { recursive: true }) as string[];
  for (const file of tree) {
    if (!String(file).endsWith(".tsx") && !String(file).endsWith(".ts")) continue;
    const src = fs.readFileSync(path.join(ROOT, "src/components/crmv3", String(file)), "utf8");
    assert.equal(src.includes("crmv4"), false, String(file));
  }
  console.log("crmv3 round45 tests passed");
}

main();
