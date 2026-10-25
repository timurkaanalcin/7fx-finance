/**
 * Round 59: CRM copy and record tables are async chunks, trade rows skip
 * unrelated price ticks, and search filters are debounced.
 * Run: npx tsx tests/round59-client-perf.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { positionTickKey } from "../src/components/trading/tick-key";

const ROOT = path.resolve(__dirname, "..");

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function main() {
  const rows = [{ id: "1", symbol: "EURUSD", chartSymbol: null as string | null }];
  const same = { bid: 1.1, ask: 1.2, mid: 1.15 };
  const a = positionTickKey(rows, { EURUSD: same, GBPUSD: { bid: 1, ask: 1, mid: 1 } });
  const b = positionTickKey(rows, { EURUSD: same, GBPUSD: { bid: 9, ask: 9, mid: 9 } });
  assert.equal(a, b);
  const c = positionTickKey(rows, { EURUSD: { bid: 1.11, ask: 1.2, mid: 1.15 } });
  assert.notEqual(a, c);
  const charted = [{ id: "2", symbol: "CUSTOM", chartSymbol: "EURUSD" }];
  const d = positionTickKey(charted, { EURUSD: { bid: 1, ask: 2, mid: 1.5 } });
  const e = positionTickKey(charted, { EURUSD: { bid: 1, ask: 2, mid: 1.6 } });
  assert.notEqual(d, e);
  assert.equal(read("src/components/trading/tick-key.ts").includes("..."), false);

  const crm = read("src/components/i18n/CrmI18n.tsx");
  assert.equal(crm.includes('from "@/lib/i18n/dictionaries/tr"'), true);
  assert.equal(crm.includes("installDict"), true);
  assert.match(crm, /import\("@\/lib\/i18n\/dictionaries\/crm-ui"\)/);
  assert.equal(crm.includes('from "@/lib/i18n/dictionaries/crm-ui"'), false);

  const sync = read("src/components/trading/SymbolCatalogSync.tsx");
  assert.match(sync, /import\("@\/lib\/symbols"\)/);
  assert.equal(sync.includes('from "@/lib/symbols"'), false);

  const watch = read("src/components/trading/Watchlist.tsx");
  assert.match(watch, /setTimeout\(\(\) => setQFilter\(q\), 150\)/);
  assert.match(watch, /positionTickKey/);
  assert.match(watch, /openMembers/);

  const blotter = read("src/components/trading/BottomPanels.tsx");
  assert.match(blotter, /dynamic\(\(\) => import\("\.\/AccountStatement"\)\)/);
  assert.match(blotter, /dynamic\(\(\) => import\("\.\/PnlCalendar"\)\)/);
  assert.match(blotter, /setTimeout\(\(\) => setSymbolQuery\(symbolFilter\), 150\)/);
  assert.match(blotter, /setTimeout\(\(\) => setTextQuery\(textFilter\), 150\)/);
  assert.match(blotter, /statementReady &&/);

  const ticker = read("src/components/trading/FooterTicker.tsx");
  assert.match(ticker, /const TickQuote = memo\(/);
  assert.match(read("src/components/trading/MarketSessions.tsx"), /export default memo\(MarketSessions\)/);

  const lazy = read("src/components/crm/crm-record-lazy.tsx");
  assert.match(lazy, /import\("@\/components\/crm\/CrmRecordTable"\)/);
  for (const rel of [
    "src/app/(admin)/izcrm/transactions/page.tsx",
    "src/app/(admin)/izcrm/workers/page.tsx",
    "src/app/(admin)/izcrm/assets/page.tsx",
    "src/app/(admin)/izcrm/tickets/page.tsx",
  ]) {
    assert.match(read(rel), /crm-record-lazy/, rel);
  }
  assert.match(read("src/app/(admin)/izcrm/page.tsx"), /dynamic\(\(\) => import\("@\/components\/crm\/LeadDashboard"\)/);
  assert.match(read("src/app/(admin)/izcrm/positions/page.tsx"), /dynamic\(\(\) => import\("@\/components\/crm\/EditableOrdersTable"\)/);

  const login = read("src/components/auth/LoginForm.tsx");
  assert.match(login, /id="fx-login-identifier"[\s\S]*?readOnly=\{loading\}/);
  assert.match(login, /id="fx-login-password"[\s\S]*?readOnly=\{loading\}/);
  assert.match(read("src/lib/session-cookie.ts"), /return Array\.from\(domains\)/);
  assert.equal(read("src/lib/session-cookie.ts").includes("[...domains]"), false);

  const pkg = JSON.parse(read("package.json"));
  assert.equal(pkg.dependencies.next, "14.2.35");
  assert.equal(pkg.dependencies.prisma, "5.22.0");

  console.log("round59 client perf tests passed");
}

main();
