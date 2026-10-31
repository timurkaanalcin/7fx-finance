/**
 * CRM v3 round 33: read-only book and follow-up agenda.
 * Run: npx tsx tests/crmv3-round33.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { bookStatus, cardsOn, filterBook, followCards, loadedPnl, overdueCards, setBrowserFollow, symbolSummary, weekDays } from "../src/lib/crmv3/book";
import { BOOK_AR, BOOK_DE, BOOK_EN, BOOK_RU, BOOK_TR } from "../src/lib/crmv3/copy-book";
import { NAV_SECTIONS } from "../src/lib/crmv3/nav";
import { CRM_V3_SECTIONS } from "../src/lib/crmv3/sections";

const ROOT = path.resolve(__dirname, "..");

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
  const copy = Object.keys(BOOK_EN).sort();
  assert.deepEqual(Object.keys(BOOK_TR).sort(), copy);
  assert.deepEqual(Object.keys(BOOK_DE).sort(), copy);
  assert.deepEqual(Object.keys(BOOK_RU).sort(), copy);
  assert.deepEqual(Object.keys(BOOK_AR).sort(), copy);
  const ids = NAV_SECTIONS.flatMap((group) => [...group.ids]);
  assert.equal(ids.includes("agenda"), true);
  assert.deepEqual(ids.slice().sort(), CRM_V3_SECTIONS.map((item) => item.id).slice().sort());
  const css = fs.readFileSync(path.join(ROOT, "src/components/crmv3/crmv3.css"), "utf8");
  assert.match(css, /\.c3-book/);
  assert.match(css, /\.c3-agenda/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const page = fs.readFileSync(path.join(ROOT, "src/components/crmv3/desk/book.tsx"), "utf8");
  assert.match(page, /crmv3-lead-follow|FOLLOW_KEY/);
  assert.equal(page.includes("/api/admin/positions"), false);
  assert.equal(page.includes("closePosition"), false);
  assert.equal(page.includes("applyToBalance"), false);
  const lib = fs.readFileSync(path.join(ROOT, "src/lib/crmv3/book.ts"), "utf8");
  assert.match(lib, /crmv3-lead-follow/);
  assert.equal(lib.includes("crmv4"), false);
  const app = fs.readFileSync(path.join(ROOT, "src/components/crmv3/CrmV3App.tsx"), "utf8");
  assert.match(app, /view === "agenda"/);
  const tree = fs.readdirSync(path.join(ROOT, "src/components/crmv3"), { recursive: true }) as string[];
  for (const file of tree) {
    if (!String(file).endsWith(".tsx") && !String(file).endsWith(".ts")) continue;
    const src = fs.readFileSync(path.join(ROOT, "src/components/crmv3", String(file)), "utf8");
    assert.equal(src.includes("crmv4"), false, String(file));
  }
  console.log("crmv3 round33 tests passed");
}

main();
