/**
 * CRM v4 round 33 helpers.
 * Run: npx tsx tests/crmv4-round33.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND33_COPY } from "../src/lib/crmv4/copy-round33";
import { bookStatus, cardsOn, filterBook, followCards, loadedPnl, overdueCards, setBrowserFollow, symbolSummary, weekDays } from "../src/lib/crmv4/round33";

function main() {
  const rows = [
    { id: "1", symbol: "EURUSD", side: "BUY", volume: 0.2, status: "OPEN", profit: 12, openedAt: "2026-10-01T00:00:00Z" },
    { id: "2", symbol: "EURUSD", side: "SELL", volume: 0.1, status: "CLOSED", profit: 4, closeProfit: -3, closedAt: "2026-10-02T00:00:00Z" },
    { id: "3", symbol: "XAUUSD", side: "BUY", volume: 1, status: "OPEN", profit: 8 },
  ];
  assert.equal(bookStatus(rows[1]), "closed");
  assert.equal(loadedPnl(rows[1]), -3);
  assert.equal(filterBook(rows, "open", "eur").length, 1);
  const summary = symbolSummary(rows);
  assert.equal(summary.find((row) => row.symbol === "EURUSD")?.pnl, 9);
  assert.equal(summary.find((row) => row.symbol === "XAUUSD")?.pnl, 8);
  assert.notEqual(summary[0].pnl, (summary[0].pnl || 0) + (summary[1].pnl || 0));
  const days = weekDays("2026-10-31");
  assert.equal(days[0], "2026-10-26");
  assert.equal(days[6], "2026-11-01");
  const cards = followCards(
    [{ id: "m", name: "Mehmet", at: "2026-10-27T10:00:00.000Z" }],
    { m: "2026-11-02" },
    { m: "Mehmet" },
  );
  assert.equal(cards.length, 2);
  assert.equal(overdueCards(cards, "2026-10-31").length, 1);
  assert.equal(cardsOn(cards, "2026-11-02")[0].source, "browser");
  const next = setBrowserFollow({ m: "2026-11-02" }, "m", "");
  assert.equal("m" in next, false);
  const copy = Object.keys(ROUND33_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND33_COPY[locale]).sort(), copy);
  const page = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round33.tsx"), "utf8");
  assert.match(page, /crmv4-lead-follow/);
  assert.equal(page.includes("/api/admin/positions"), false);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-book-luxe/);
  assert.match(css, /\.c4-agenda-luxe/);
  assert.match(css, /--c4-accent-ink:\s*#7a5e30/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  console.log("crmv4 round33 tests passed");
}

main();
