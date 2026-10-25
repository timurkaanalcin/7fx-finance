/**
 * Landing desk feel and trade ticket/blotter layout.
 * Run: npx tsx tests/round30-landing-ticket.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "..");

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function main() {
  const locales = read("src/lib/i18n/locales.ts");
  assert.match(locales, /PUBLIC_DEFAULT_LOCALE:\s*Locale\s*=\s*"en"/);

  const landing = read("src/components/landing/landing.css");
  assert.match(landing, /font-weight:\s*300/);
  assert.match(landing, /\.fx-h1[\s\S]*font-weight:\s*400/);
  assert.match(landing, /\.fx-terminal-bar/);
  assert.match(landing, /\.fx-spark-row/);
  assert.match(landing, /\.fx-chip-row[\s\S]*overflow-x:\s*auto/);
  assert.equal(landing.includes("--font-sora"), false);
  assert.equal(/font-weight:\s*700/.test(landing), false);
  assert.equal(/font-weight:\s*600/.test(landing), false);

  const markets = read("src/components/landing/LiveMarkets.tsx");
  assert.match(markets, /fx-terminal-bar/);
  assert.match(markets, /SPARK_SYMS/);
  assert.match(markets, /Array\.from\(extraCharts\)/);
  assert.equal(markets.includes("[...extraCharts]"), false);

  const critical = read("src/app/(public)/layout.tsx");
  assert.match(critical, /font-weight:400/);
  assert.match(critical, /fx-chart-slot\{min-height:460px\}/);
  assert.match(critical, /DeferredSheets/);
  const home = read("src/app/(public)/page.tsx");
  assert.equal(home.includes("landing.css"), false);

  const entry = read("src/app/fx-css/page.tsx");
  assert.equal(entry.includes("import"), false);

  const css = read("src/app/globals.css");
  assert.match(css, /\.fx-order-sheet[\s\S]*max-width:\s*420px/);
  assert.match(css, /\.fx-blotter table[\s\S]*width:\s*max-content/);
  assert.match(css, /\.fx-blotter th:last-child[\s\S]*position:\s*sticky/);
  assert.match(css, /\.fx-pos-levels[\s\S]*minmax\(0,\s*1fr\)/);

  const ticket = read("src/components/trading/OrderTicket.tsx");
  assert.match(ticket, /fx-order-sheet/);
  assert.match(ticket, /fx-order-symbol-name/);
  const panels = read("src/components/trading/BottomPanels.tsx");
  assert.match(panels, /fx-blotter/);
  assert.match(panels, /fx-pos-card/);
  assert.equal(panels.includes("truncate font-medium tabular-nums text-desk-muted"), false);

  const shell = read("src/components/trading/TerminalShell.tsx");
  assert.match(shell, /fx-desk-row/);
  assert.match(shell, /fx-desk-history/);

  const login = read("src/components/auth/LoginForm.tsx");
  assert.match(login, /id="fx-login-identifier"[\s\S]*?readOnly=\{loading\}/);
  assert.match(login, /id="fx-login-password"[\s\S]*?readOnly=\{loading\}/);
  const cookie = read("src/lib/session-cookie.ts");
  assert.match(cookie, /return Array\.from\(domains\)/);
  assert.equal(cookie.includes("[...domains]"), false);

  console.log("round30 landing/ticket tests passed");
}

main();
