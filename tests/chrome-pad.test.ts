/**
 * 0.15cm chrome inset is one 6px token on headers and footers, added on top of safe areas.
 * Run: npx tsx tests/chrome-pad.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "..");

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function main() {
  for (const rel of ["src/app/globals.css", "src/app/base.css"]) {
    assert.match(read(rel), /--chrome-pad:\s*6px/, rel);
  }

  const landing = read("src/components/landing/landing.css");
  const nav = landing.slice(landing.indexOf(".fx-landing .fx-nav {"), landing.indexOf(".fx-landing .fx-nav > .fx-shell"));
  assert.match(nav, /safe-area-inset-top/);
  assert.match(nav, /var\(--chrome-pad,\s*6px\)/);
  assert.match(nav, /margin-bottom:\s*var\(--chrome-pad,\s*6px\)/);
  const foot = landing.slice(landing.indexOf(".fx-landing .fx-footer {"), landing.indexOf(".fx-landing .fx-footer-grid"));
  assert.match(foot, /safe-area-inset-bottom/);
  assert.match(foot, /var\(--chrome-pad,\s*6px\)/);

  const auth = read("src/app/(auth)/auth-mobile.css");
  assert.match(auth, /\.fx-auth-page \{[^}]*safe-area-inset-left/);
  assert.match(auth, /\.fx-auth-page header \{[^}]*var\(--chrome-pad,\s*6px\)/);

  const globals = read("src/app/globals.css");
  assert.match(globals, /\.fx-crm-topbar[\s\S]*padding:\s*var\(--chrome-pad\)/);
  assert.match(globals, /\.fx-crm-tabbar \{[^}]*padding-bottom:\s*calc\(env\(safe-area-inset-bottom, 0px\) \+ var\(--chrome-pad\)\)/);
  assert.match(globals, /\[data-crmv2-root\] header \{[^}]*safe-area-inset-top/);
  assert.match(globals, /\[data-crmv2-root\] > nav \{[^}]*safe-area-inset-bottom/);
  assert.match(globals, /\.tw-toolbar \{[^}]*safe-area-inset-top/);
  assert.match(globals, /\.tw-tabs \{[^}]*safe-area-inset-bottom/);
  assert.match(globals, /\.fx-profile > header \{[^}]*height:\s*auto/);
  assert.match(globals, /\.fx-profile > header \{[^}]*safe-area-inset-top/);

  const luxe = read("src/app/mobile-luxe.css");
  const tradeBar = luxe.slice(luxe.indexOf(".fx-desk-tradebar {"), luxe.indexOf(".fx-desk-tradebar button"));
  assert.match(tradeBar, /safe-area-inset-left/);
  assert.match(tradeBar, /safe-area-inset-right/);
  assert.match(tradeBar, /var\(--chrome-pad,\s*6px\)/);
  const mobileNav = luxe.slice(luxe.indexOf(".fx-desk-mobile-nav {"), luxe.indexOf(".fx-desk-seg {"));
  assert.match(mobileNav, /safe-area-inset-bottom/);
  assert.match(mobileNav, /safe-area-inset-left/);
  assert.match(mobileNav, /var\(--chrome-pad,\s*6px\)/);

  console.log("chrome-pad tests passed");
}

main();
