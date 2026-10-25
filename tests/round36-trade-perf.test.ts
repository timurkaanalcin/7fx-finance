/**
 * /trade performance: chart library stays off the first paint, unchanged ticks do not replace price state.
 * Run: npx tsx tests/round36-trade-perf.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "..");

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function main() {
  const chart = read("src/components/trading/TradingChart.tsx");
  assert.match(chart, /import type \{[\s\S]*IChartApi[\s\S]*\} from "lightweight-charts"/);
  assert.equal(/import \{[^}]*createChart/.test(chart), false);
  assert.match(chart, /import\("\.\/chart-engine"\)/);
  assert.match(read("src/components/trading/chart-engine.ts"), /createChart[\s\S]*from "lightweight-charts"/);
  assert.match(chart, /requestIdleCallback/);
  assert.match(chart, /IntersectionObserver/);
  assert.match(chart, /onClick=\{\(\) => onTimeframe\(tf\.id\)\}/);

  const shell = read("src/components/trading/TerminalShell.tsx");
  assert.match(shell, /markQuotesSeen\(\)/);
  assert.match(shell, /return changed \? next : prev/);
  assert.match(shell, /postTrade\("\/api\/positions\/close"/);

  const watch = read("src/components/trading/Watchlist.tsx");
  assert.match(watch, /const WatchRow = memo\(/);
  assert.match(watch, /data-fx-watchlist-search=""/);
  assert.equal(watch.includes("font-semibold"), false);

  const panels = read("src/components/trading/BottomPanels.tsx");
  assert.match(panels, /const OpenTradeRow = memo\(/);
  assert.match(panels, /OpenCardView/);
  assert.match(panels, /fx-blotter-closed/);

  const login = read("src/components/auth/LoginForm.tsx");
  assert.match(login, /id="fx-login-identifier"[\s\S]*?readOnly=\{loading\}/);
  assert.match(login, /id="fx-login-password"[\s\S]*?readOnly=\{loading\}/);
  const cookie = read("src/lib/session-cookie.ts");
  assert.match(cookie, /return Array\.from\(domains\)/);
  assert.equal(cookie.includes("[...domains]"), false);

  const profile = read("src/app/(terminal)/profile/page.tsx");
  assert.match(profile, /min-w-0 flex-1 truncate text-sm font-medium/);

  console.log("round36 tests passed");
}

main();
