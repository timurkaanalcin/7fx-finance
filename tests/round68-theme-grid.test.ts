/**
 * Account cards stay an even 4-column grid, and desk/CRM surfaces
 * follow the active theme tokens instead of a fixed black or white fill.
 * Run: npx tsx tests/round68-theme-grid.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "..");

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function main() {
  const pkg = JSON.parse(read("package.json"));
  assert.equal(pkg.dependencies.next, "14.2.35");
  assert.equal(pkg.dependencies.prisma, "5.22.0");

  const css = read("src/app/globals.css");
  assert.match(
    css,
    /@media \(min-width: 1024px\) and \(max-width: 1440px\) and \(min-height: 521px\)[\s\S]*grid-template-columns:\s*repeat\(4, minmax\(0, 1fr\)\)/
  );
  assert.match(css, /html\[data-fx-theme="dark"\] \.fx-crm \{[\s\S]*background: var\(--bg\) !important/);
  assert.match(css, /html\[data-fx-theme="dark"\] \.fx-crm :is\([\s\S]*\.bg-white/);
  assert.match(
    css,
    /html\[data-fx-theme="dark"\] \.fx-crm :is\(\s*\.fx-dash-kpi,[\s\S]*\.fx-dash-link,[\s\S]*background: var\(--bg-panel\)/
  );
  assert.match(css, /\.fx-crm \{[\s\S]*background: #ffffff !important/);
  assert.match(css, /html\[data-fx-theme="dark"\] :is\(\.fx-desk, \.fx-profile\) \.z-\\\[70\\\]\.bg-white/);
  assert.equal(/font-weight:\s*700/.test(css), false);

  const profile = read("src/app/(terminal)/profile/page.tsx");
  assert.match(profile, /fx-profile min-h-screen bg-desk-bg text-desk-text/);
  assert.match(profile, /fx-cashier rounded-xl border border-desk-border bg-desk-panel/);
  assert.match(profile, /className="ml-auto rounded-md bg-\[#2a2a2a\] px-2\.5 py-1\.5 text-xs hover:bg-\[#1f1f1f\]"/);
  assert.match(profile, /<span className="fx-rtl-flip"/);

  const support = read("src/components/profile/LiveSupportPanel.tsx");
  assert.match(support, /border-desk-border bg-desk-panel/);
  assert.match(support, /bg-desk-buy text-white/);
  assert.match(support, /bg-\[#1a1a1a\] text-slate-100 ring-1 ring-\[#2a2a2a\]/);

  const deposit = read("src/components/trading/DepositModal.tsx");
  assert.match(deposit, /fx-lx-modal fx-cashier[\s\S]*bg-desk-panel/);

  assert.match(read("src/components/trading/ForcePasswordModal.tsx"), /fx-lx-overlay fixed inset-0/);
  assert.match(read("src/components/trading/MarginCallModal.tsx"), /fx-lx-overlay fixed inset-0/);
  assert.match(read("src/components/trading/TradeNote.tsx"), /fx-lx-overlay fixed inset-0/);
  assert.match(read("src/components/i18n/LanguageSwitcher.tsx"), /border-desk-border bg-desk-panel text-desk-text/);
  assert.equal(read("src/components/i18n/LanguageSwitcher.tsx").includes("font-semibold"), false);

  const chart = read("src/components/trading/TradingChart.tsx");
  assert.match(chart, /const light = themeLightRef\.current/);
  assert.match(chart, /color: light \? "#ffffff" : "#000000"/);

  const login = read("src/components/auth/LoginForm.tsx");
  assert.match(login, /id="fx-login-identifier"[\s\S]*?readOnly=\{loading\}/);
  assert.match(login, /id="fx-login-password"[\s\S]*?readOnly=\{loading\}/);

  console.log("round68 theme grid ok");
}

main();
