/**
 * CRM v4 round 26 helpers.
 * Run: npx tsx tests/crmv4-round26.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND26_COPY } from "../src/lib/crmv4/copy-round26";
import {
  OVERVIEW_CARDS,
  buildLine,
  currencySums,
  dayGroups,
  defaultLayout,
  filterLine,
  moveCard,
  readLayout,
  toggleHidden,
  visibleCards,
} from "../src/lib/crmv4/round26";

function main() {
  const items = buildLine({
    deposits: [
      { id: "d1", createdAt: "2026-10-28T09:00:00Z", amount: 250, currency: "USD", status: "APPROVED", method: { label: "Bank" } },
      { id: "d2", createdAt: "2026-10-31T08:00:00Z", amount: 400, currency: "TRY", status: "PENDING", method: "Card" },
    ],
    withdrawals: [
      { id: "w1", createdAt: "2026-10-29T09:00:00Z", amount: 120, currency: "USD", status: "APPROVED", method: "Wire" },
    ],
    positions: [
      { id: "p1", openedAt: "2026-10-30T10:00:00Z", symbol: "EURUSD", side: "BUY", volume: 0.1, status: "OPEN", profit: 12 },
    ],
    tickets: [
      { id: "d1", openedAt: "2026-10-28T09:00:00Z", kind: "DEPOSIT", amount: 250, currency: "USD", status: "APPROVED" },
      { id: "m1", openedAt: "2026-10-27T09:00:00Z", kind: "MARGIN", amount: 50, currency: "USD", status: "PENDING" },
    ],
    notes: [{ id: "n1", body: "Called back", createdAt: "2026-10-31T07:00:00Z", authorName: "Ada" }],
    calls: [{ id: "c1", at: "2026-10-31T06:00:00Z", outcome: "reached", note: "local only", minutes: 3 }],
  });
  assert.equal(items.filter((row) => row.kind === "ticket").length, 1);
  assert.equal(items[0].kind, "deposit");
  assert.equal(items[0].currency, "TRY");
  assert.equal(items.find((row) => row.kind === "deposit" && row.currency === "USD")?.title, "Bank");
  assert.equal(items.find((row) => row.kind === "position")?.currency, "");
  assert.equal(items.find((row) => row.kind === "position")?.amount, null);
  const sums = currencySums(items, "deposit");
  assert.deepEqual(sums, [
    { currency: "TRY", amount: 400 },
    { currency: "USD", amount: 250 },
  ]);
  assert.equal(currencySums(items, "deposit").some((row) => row.currency === "USDTRY"), false);
  const days = dayGroups(filterLine(items, ["deposit", "note", "call"], ""));
  assert.equal(days[0].day, "2026-10-31");
  assert.equal(days[0].items.length, 3);
  assert.equal(filterLine(items, ["call"], "local").length, 1);
  assert.equal(filterLine(items, [], "").length, 0);
  const layout = readLayout({ order: ["recent", "alerts", "nope"], hidden: ["fx"] });
  assert.equal(layout.order[0], "recent");
  assert.equal(layout.order[1], "alerts");
  assert.equal(layout.order.includes("fx"), true);
  assert.equal(layout.order.length, OVERVIEW_CARDS.length);
  assert.deepEqual(layout.hidden, ["fx"]);
  const hidden = toggleHidden(layout, "alerts");
  assert.equal(visibleCards(hidden).includes("alerts"), false);
  assert.equal(visibleCards(hidden).includes("fx"), false);
  const moved = moveCard(defaultLayout(), "fx", -1);
  assert.equal(moved.order[0], "fx");
  assert.equal(moveCard(defaultLayout(), "alerts", -1).order[0], "alerts");
  const keys = Object.keys(ROUND26_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND26_COPY[locale]).sort(), keys);
  }
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-line-luxe/);
  assert.match(css, /\.c4-arrange-luxe/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const page = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round26.tsx"), "utf8");
  assert.match(page, /crmv4-overview-layout/);
  assert.equal(page.includes("crmv4-widgets"), false);
  console.log("crmv4 round26 tests passed");
}

main();
