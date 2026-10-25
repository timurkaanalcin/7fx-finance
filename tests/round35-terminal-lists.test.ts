/**
 * Chart toolbar, watchlist, and history tables: thin type, tabular figures, phone targets.
 * Run: npx tsx tests/round35-terminal-lists.test.ts
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
  assert.match(chart, /onClick=\{\(\) => onTimeframe\(tf\.id\)\}/);
  assert.match(chart, /tabular-nums[\s\S]{0,120}data-fx-chart-quote=""/);
  assert.match(chart, /fx-chart-tools/);
  assert.match(chart, /fx-tap-compact shrink-0[\s\S]{0,80}font-normal/);
  assert.equal(chart.includes("font-bold"), false);

  const watch = read("src/components/trading/Watchlist.tsx");
  assert.match(watch, /data-fx-watchlist-search=""/);
  assert.match(watch, /data-fx-watch-clear=""/);
  assert.match(watch, /data-fx-watch-sort=\{sortMode\}/);
  assert.match(watch, /fx-watch-filter/);
  assert.match(watch, /fx-watch-row/);
  assert.match(watch, /tabular-nums/);
  assert.equal(watch.includes("font-semibold"), false);

  const panels = read("src/components/trading/BottomPanels.tsx");
  assert.match(panels, /fx-blotter-open/);
  assert.match(panels, /fx-blotter-closed/);
  assert.match(panels, /fx-blotter-pending/);
  assert.match(panels, /fx-blotter-tab/);
  assert.match(panels, /fx-blotter-chip/);
  assert.match(panels, /tab === "open" \? "hidden md:block"/);
  assert.match(panels, /onClosePosition/);
  assert.match(panels, /onReopenTrade/);
  assert.match(panels, /onCancelOrder/);

  const css = read("src/app/globals.css");
  assert.match(css, /\.fx-blotter table[\s\S]*width:\s*max-content/);
  assert.match(css, /\.fx-blotter th:last-child[\s\S]*position:\s*sticky/);
  assert.match(css, /\.fx-blotter-closed td:nth-child\(n \+ 5\)[\s\S]*text-align:\s*right/);
  assert.match(css, /font-variant-numeric:\s*tabular-nums/);
  assert.match(
    css,
    /@media \(max-width: 767px\) \{[\s\S]*\.fx-desk \.fx-chart-tools button[\s\S]*\.fx-desk \.fx-watchlist \[data-fx-watch-clear\][\s\S]*min-width:\s*40px/
  );
  assert.match(css, /min-height:\s*40px/);
  assert.match(css, /max-height:\s*176px/);

  const login = read("src/components/auth/LoginForm.tsx");
  assert.match(login, /id="fx-login-identifier"[\s\S]*?readOnly=\{loading\}/);
  assert.match(login, /id="fx-login-password"[\s\S]*?readOnly=\{loading\}/);
  const cookie = read("src/lib/session-cookie.ts");
  assert.match(cookie, /return Array\.from\(domains\)/);
  assert.equal(cookie.includes("[...domains]"), false);

  const profile = read("src/app/(terminal)/profile/page.tsx");
  assert.match(profile, /min-w-0 flex-1 truncate text-sm font-medium/);
  const top = read("src/components/trading/TopBar.tsx");
  assert.equal(top.includes("depositDisabled"), false);

  console.log("round35 tests passed");
}

main();
