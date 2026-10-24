/**
 * Round 24: silent list caps report another page, and public SEO routes are indexable.
 * Run: npx tsx tests/round24.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { PUBLIC_DEFAULT_LOCALE } from "../src/lib/i18n/locales";
import { ASSET_PAGES, MARKETING_COPY } from "../src/lib/public-pages";
import { isMarketingPath, MARKETING_PATHS, shouldNoindex } from "../src/lib/seo-hosts";

const ROOT = path.resolve(__dirname, "..");

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function main() {
  assert.equal(PUBLIC_DEFAULT_LOCALE, "en");

  const positions = read("src/app/api/positions/route.ts");
  assert.match(positions, /take:\s*OPEN_PAGE\s*\+\s*1/);
  assert.equal(positions.includes("take: 200"), false);
  assert.match(positions, /hasMore/);
  assert.equal((positions.match(/processPendingOrders/g) || []).length, 2);
  assert.equal((positions.match(/checkSlTp/g) || []).length, 2);

  const workers = read("src/app/api/admin/workers/route.ts");
  assert.match(workers, /WORKER_UNPAGED_CAP/);
  assert.match(workers, /WORKER_DESK_CAP \+ 1/);
  assert.match(workers, /desksPartial/);
  assert.match(workers, /workersPartial/);
  assert.equal(workers.includes("take: 500"), false);

  const retention = read("src/app/api/admin/retention/[id]/route.ts");
  assert.match(retention, /NOTES_PAGE \+ 1/);
  assert.match(retention, /REMINDERS_PAGE \+ 1/);
  assert.match(retention, /notesHasMore/);
  assert.match(retention, /remindersHasMore/);
  assert.equal(retention.includes("take: 50"), false);
  assert.equal(retention.includes("take: 20"), false);
  assert.match(read("src/components/crm/RetentionPanel.tsx"), /crm\.ret\.notesMore/);

  const clients = read("src/app/api/admin/clients/route.ts");
  assert.match(clients, /CLIENT_PICKER_CAP \+ 1/);
  assert.match(clients, /clientsPartial/);
  assert.equal(clients.includes("take: 20"), false);
  assert.match(read("src/components/crm/ClientPicker.tsx"), /crm\.clients\.partial/);

  const presence = read("src/app/api/admin/users/[id]/presence/route.ts");
  assert.match(presence, /PRESENCE_EVENT_PAGE \+ 1/);
  assert.match(presence, /eventsHasMore/);
  assert.equal(presence.includes("take: 50"), false);
  assert.match(read("src/components/crm/Presence.tsx"), /presence\?skip=/);

  for (const pathName of ["/markets", "/markets/crypto", "/markets/forex", "/markets/commodities", "/markets/indices", "/markets/stocks", "/platform", "/faq"]) {
    assert.ok(isMarketingPath(pathName), pathName);
    assert.ok((MARKETING_PATHS as readonly string[]).includes(pathName), pathName);
    assert.equal(shouldNoindex("7fx.customer.org.tr", pathName), false, pathName);
    assert.equal(shouldNoindex("127.0.0.1", pathName), true, pathName);
    assert.ok(MARKETING_COPY[pathName]?.title, pathName);
    assert.equal(/[çğıöşüÇĞİÖŞÜıİ]/.test(MARKETING_COPY[pathName].title + MARKETING_COPY[pathName].description), false, pathName);
  }
  assert.equal(shouldNoindex("7fx.customer.org.tr", "/login"), true);
  assert.equal(shouldNoindex("7fx.customer.org.tr", "/trade"), true);
  assert.equal(ASSET_PAGES.length, 5);
  assert.match(read("src/app/sitemap.ts"), /MARKETING_PATHS/);
  assert.match(read("src/components/landing/LiveMarkets.tsx"), /Paint quotes before the candle history/);
  assert.equal(read("src/app/globals.css").includes("opacity: 0.45"), false);

  console.log("round24 tests passed");
}

main();
