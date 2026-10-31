/**
 * CRM v3 customer timeline and overview arrangement.
 * Display and browser layout only. Nothing is sent.
 * Run: npx tsx tests/crmv3-line.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  OVERVIEW_CARDS,
  buildLine,
  currencySums,
  dayGroups,
  defaultLayout,
  filterLine,
  kindCounts,
  moveCard,
  readLayout,
  toggleHidden,
  visibleCards,
} from "../src/lib/crmv3/line";

const ROOT = path.resolve(__dirname, "..");

function main() {
  const items = buildLine({
    deposits: [
      { id: "d1", createdAt: "2026-10-02T10:00:00.000Z", amount: 10, currency: "usd", status: "APPROVED", method: { label: "Wire" } },
      { id: "d2", createdAt: "2026-10-02T12:00:00.000Z", amount: 5, currency: "TRY", status: "PENDING", method: "Card" },
    ],
    withdrawals: [{ id: "w1", createdAt: "2026-10-01T09:00:00.000Z", amount: 3, currency: "USD", status: "APPROVED", method: "BANK" }],
    positions: [{ id: "p1", openedAt: "2026-10-03T08:00:00.000Z", symbol: "EURUSD", side: "BUY", volume: 1, status: "OPEN", profit: 2 }],
    tickets: [
      { id: "d1", openedAt: "2026-10-02T10:00:00.000Z", kind: "DEPOSIT", amount: 10, currency: "USD", status: "APPROVED" },
      { id: "t1", openedAt: "", kind: "MARGIN", amount: 1, currency: "USD", status: "PENDING" },
    ],
    notes: [{ id: "n1", body: "hello desk", createdAt: "2026-10-03T09:00:00.000Z", authorName: "Ada" }],
    calls: [{ id: "c1", at: "2026-10-03T11:00:00.000Z", outcome: "reached", minutes: 4, note: "callback" }],
  });
  assert.equal(items[0].kind, "call");
  assert.equal(items.find((row) => row.kind === "deposit" && row.title === "Wire")?.currency, "USD");
  assert.equal(items.some((row) => row.id === "ticket-d1"), false);
  assert.equal(items.some((row) => row.id === "ticket-t1"), true);
  const groups = dayGroups(items);
  assert.equal(groups[0].day, "2026-10-03");
  assert.equal(groups[groups.length - 1].day, "");
  assert.equal(kindCounts(items).deposit, 2);
  const filtered = filterLine(items, ["note"], "desk");
  assert.equal(filtered.length, 1);
  const sums = currencySums(filterLine(items, ["deposit", "withdrawal"], ""), "deposit");
  assert.deepEqual(sums, [
    { currency: "TRY", amount: 5 },
    { currency: "USD", amount: 10 },
  ]);

  const layout = readLayout({ order: ["fx", "nope", "fx"], hidden: ["rules", "missing"] });
  assert.equal(layout.order[0], "fx");
  assert.equal(layout.order.length, OVERVIEW_CARDS.length);
  assert.deepEqual(layout.hidden, ["rules"]);
  const hidden = toggleHidden(layout, "fx");
  assert.equal(visibleCards(hidden).includes("rules"), false);
  assert.equal(visibleCards(hidden).includes("fx"), false);
  const start = defaultLayout();
  const moved = moveCard(start, "fx", -1);
  assert.equal(moved.order[0], "fx");
  assert.equal(moveCard(start, "rules", -1), start);

  const css = fs.readFileSync(path.join(ROOT, "src/components/crmv3/crmv3.css"), "utf8");
  assert.match(css, /\.c3-line-day/);
  assert.equal(css.includes("overflow-x: auto"), false);
  const page = fs.readFileSync(path.join(ROOT, "src/components/crmv3/desk/line.tsx"), "utf8");
  assert.match(page, /crmv3-overview-layout/);
  assert.match(page, /crmv3-call-log/);
  assert.equal(page.includes("crmv4-"), false);

  console.log("crmv3 line tests passed");
}

main();
