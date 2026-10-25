/**
 * Signed-in screens: 44px taps, scrolling dialogs, keyboard inset.
 * Run: npx tsx tests/round58-signed-in.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "..");

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function main() {
  const globals = read("src/app/globals.css");
  const signed = globals.slice(globals.lastIndexOf("Signed-in screens"));
  assert.match(signed, /--fx-kb:\s*0px/);
  assert.match(signed, /\.fx-lx-overlay \{[^}]*overflow:\s*hidden/);
  assert.match(signed, /\.fx-order-sheet[\s\S]*?--fx-kb/);
  assert.match(signed, /\.fx-lx-modal[\s\S]*?overflow-y:\s*auto/);
  assert.match(signed, /\.fx-chart-desktop-actions button \{[^}]*min-height:\s*44px/);
  assert.match(signed, /\.fx-profile \.fx-lx-overlay > div\[role="dialog"\][\s\S]*?--fx-kb/);
  assert.match(signed, /\.fx-crm \.fixed\.inset-0:not\(\[aria-hidden\]\) > form[\s\S]*?overflow-y:\s*auto/);
  assert.match(signed, /\.fx-crm main button[\s\S]*?min-height:\s*44px/);
  assert.match(signed, /\.fx-desk :is\(button, a, select\)[\s\S]*?min-height:\s*44px/);
  assert.match(signed, /\.fx-profile :is\(button, a\)/);
  assert.match(signed, /\.fx-crm main :is\(button, a\)[\s\S]*?min-width:\s*44px/);
  assert.equal(/font-weight:\s*(650|700|800|900)/.test(globals), false);

  const luxe = read("src/app/mobile-luxe.css");
  assert.match(luxe, /max-height:\s*calc\(100dvh - 24px - var\(--fx-kb, 0px\)\)/);
  assert.equal(/font-weight:\s*700/.test(luxe), false);

  const layout = read("src/app/layout.tsx");
  assert.match(layout, /interactiveWidget:\s*"resizes-content"/);
  assert.match(layout, /KeyboardInset/);
  assert.match(read("src/components/system/KeyboardInset.tsx"), /--fx-kb/);
  assert.match(read("src/components/system/KeyboardInset.tsx"), /scrollIntoView/);

  const rail = read("src/components/trading/ToolRail.tsx");
  assert.match(rail, /w-14/);
  assert.match(rail, /h-11 w-11/);
  assert.equal(rail.includes("font-bold"), false);
  assert.match(read("src/components/trading/PriceAlerts.tsx"), /h-11 w-11/);
  assert.match(read("src/components/trading/TradingCalculator.tsx"), /min-h-11/);
  assert.match(read("src/components/trading/TradingCalculator.tsx"), /text-base/);

  const login = read("src/components/auth/LoginForm.tsx");
  assert.match(login, /id="fx-login-identifier"[\s\S]*?readOnly=\{loading\}/);
  assert.match(login, /id="fx-login-password"[\s\S]*?readOnly=\{loading\}/);
  const cookie = read("src/lib/session-cookie.ts");
  assert.match(cookie, /return Array\.from\(domains\)/);
  assert.equal(cookie.includes("[...domains]"), false);

  const pkg = JSON.parse(read("package.json"));
  assert.equal(pkg.dependencies.next, "14.2.35");
  assert.equal(pkg.dependencies.prisma, "5.22.0");

  console.log("round58 signed-in tests passed");
}

main();
