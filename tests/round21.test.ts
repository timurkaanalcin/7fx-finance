/**
 * Round 21: fx_lang cookie paints the public locale, English stays the default,
 * and trader/desk/calendar lists report when a page is incomplete.
 * Run: npx tsx tests/round21.test.ts
 */
import "./preload-dicts";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { translate } from "../src/lib/i18n/dictionaries";
import { PUBLIC_DEFAULT_LOCALE, publicLocaleFromCookie } from "../src/lib/i18n/locales";

const ROOT = path.resolve(__dirname, "..");

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function main() {
  assert.equal(PUBLIC_DEFAULT_LOCALE, "en");
  assert.equal(publicLocaleFromCookie(undefined), "en");
  assert.equal(publicLocaleFromCookie(null), "en");
  assert.equal(publicLocaleFromCookie(""), "en");
  assert.equal(publicLocaleFromCookie("  "), "en");
  assert.equal(publicLocaleFromCookie("nope"), "en");
  assert.equal(publicLocaleFromCookie("tr"), "tr");
  assert.equal(publicLocaleFromCookie("DE-de"), "de");

  const layout = read("src/app/layout.tsx");
  assert.equal(layout.includes("publicLocaleFromCookie"), true);
  assert.equal(layout.includes('cookies().get("fx_lang")'), true);
  assert.equal(layout.includes('lang="en"'), false);
  assert.equal(layout.includes("fx_crm_lang"), false);

  assert.equal(translate("en", "term.err.priceFetch"), "Could not fetch price");
  assert.equal(translate("en", "term.trade.open"), "Open trade order");
  assert.equal(translate("en", "term.chart.liveBadge"), "LIVE");
  assert.equal(translate("en", "term.alert.offsets"), "Quick percent offsets from mid");
  assert.ok(/[çğıöşüÇĞİÖŞÜıİ]/.test(translate("tr", "term.err.priceConn")));
  assert.equal(translate("tr", "term.buy"), "AL");

  const shell = read("src/components/trading/TerminalShell.tsx");
  assert.equal(shell.includes("Could not fetch price"), false);
  assert.equal(shell.includes("Price connection error"), false);
  assert.equal(shell.includes('aria-label="Open trade order"'), false);

  const blotter = read("src/components/trading/BottomPanels.tsx");
  assert.equal(blotter.includes('? "Buy"'), false);
  assert.equal(blotter.includes('label="Order"'), false);

  const users = read("src/app/api/admin/users/[id]/route.ts");
  assert.equal(users.includes("positionsHasMore"), true);
  assert.equal(users.includes("communicationsHasMore"), true);
  assert.equal(users.includes("notesHasMore"), true);
  assert.equal(users.includes("take: 100"), false);

  const calendar = read("src/app/api/admin/calendar/route.ts");
  assert.equal(calendar.includes("tradersPartial"), true);
  assert.equal(calendar.includes("take: 200"), false);

  const desks = read("src/app/api/admin/desks/route.ts");
  assert.equal(desks.includes("hasMore"), true);
  assert.equal(desks.includes("crmPageWindow"), true);

  console.log("round21 tests passed");
}

main();
