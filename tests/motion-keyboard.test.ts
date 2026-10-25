/**
 * Reduced motion for loops, tickers, and toasts, plus terminal keyboard focus.
 * Run: npx tsx tests/motion-keyboard.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "..");

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function main() {
  const loop = read("src/components/landing/TerminalLoop.tsx");
  assert.match(loop, /prefers-reduced-motion/);
  assert.match(loop, /if \(!near \|\| reduce\) return/);
  assert.match(loop, /data-fx-reduced=/);

  const markets = read("src/components/landing/LiveMarkets.tsx");
  assert.match(markets, /prefers-reduced-motion/);
  assert.match(markets, /if \(!reduce\)/);

  const landing = read("src/components/landing/landing.css");
  assert.match(landing, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.fx-ticker-track/);

  for (const rel of ["src/app/globals.css", "src/app/base.css"]) {
    const css = read(rel);
    assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.ticker-track/);
    assert.match(css, /\.fx-toast/);
    assert.match(css, /outline-none:focus-visible/);
  }
  const globals = read("src/app/globals.css");
  assert.match(globals, /\.fx-px-flash-up/);
  assert.match(globals, /\.fx-crm input:focus-visible/);

  const feed = read("src/components/trading/FeedStatus.tsx");
  assert.match(feed, /prefersReducedMotion\(\)/);
  assert.match(feed, /fx-toast/);
  const alerts = read("src/components/trading/PriceAlerts.tsx");
  assert.match(alerts, /prefersReducedMotion\(\)/);
  assert.match(alerts, /fx-toast/);

  const watch = read("src/components/trading/Watchlist.tsx");
  assert.match(watch, /ArrowDown/);
  assert.match(watch, /data-fx-watch-row=\{symbol\}/);
  assert.match(watch, /tabIndex=\{active \? 0 : -1\}/);
  assert.equal(watch.includes("font-semibold"), false);

  const ticket = read("src/components/trading/OrderTicket.tsx");
  const volumeAt = ticket.indexOf('data-fx-ticket-volume=""');
  const downAt = ticket.indexOf('aria-label={t("term.ot.volDown")}');
  assert.ok(volumeAt > 0 && downAt > volumeAt);
  assert.match(ticket, /useDialogFocus\(Boolean\(modal\)/);
  assert.match(ticket, /ArrowUp/);

  const deposit = read("src/components/trading/DepositModal.tsx");
  assert.match(deposit, /useDialogFocus\(open, onClose, panelRef\)/);
  assert.match(deposit, /methodId: selected\.id, amount: amt, note: note \|\| undefined/);

  for (const rel of [
    "src/components/trading/ShortcutsHelp.tsx",
    "src/components/trading/TradingCalculator.tsx",
    "src/components/trading/AccountStatement.tsx",
    "src/components/trading/TradeNote.tsx",
    "src/components/trading/MarginCallModal.tsx",
    "src/components/trading/ForcePasswordModal.tsx",
  ]) {
    assert.match(read(rel), /useDialogFocus\(/, rel);
  }
  const margin = read("src/components/trading/MarginCallModal.tsx");
  assert.match(margin, /PENDING/);
  const force = read("src/components/trading/ForcePasswordModal.tsx");
  assert.match(force, /useDialogFocus\(true, \(\) => \{\}, panelRef, "input"\)/);
  assert.equal(force.includes("onClose"), false);

  const login = read("src/components/auth/LoginForm.tsx");
  assert.match(login, /id="fx-login-password"[\s\S]*?readOnly=\{loading\}/);
  const cookie = read("src/lib/session-cookie.ts");
  assert.match(cookie, /return Array\.from\(domains\)/);
  assert.equal(cookie.includes("[...domains]"), false);

  console.log("motion-keyboard tests passed");
}

main();
