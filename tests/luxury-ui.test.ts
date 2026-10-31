/**
 * Luxury chrome: shared tokens, one button scale, CRM toolbar.
 * Run: npx tsx tests/luxury-ui.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "..");

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function main() {
  const lux = read("src/styles/luxury.css");
  assert.match(lux, /--fx-lux-bg:\s*#0c0b0a/);
  assert.match(lux, /--fx-lux-gold:\s*#c6a56a/);
  assert.match(lux, /--fx-btn-h:\s*40px/);
  assert.match(lux, /--fx-btn-h-sm:\s*36px/);
  for (const name of ["primary", "secondary", "ghost", "icon", "danger", "pill"]) {
    assert.match(lux, new RegExp(`\\.fx-btn--${name}\\s*\\{`), name);
  }
  assert.match(lux, /\.fx-btn:focus-visible/);
  assert.match(lux, /\[data-crmv2-root\]/);
  assert.equal(/font-weight:\s*(650|700|800|900)/.test(lux), false);
  assert.match(lux, /--fx-lux-buy:\s*#1fb58f/);
  assert.match(lux, /--fx-lux-sell:\s*#ef5350/);

  const globals = read("src/app/globals.css");
  assert.match(globals, /:root \{[^}]*--chrome-pad:\s*6px/);
  assert.match(globals, /\.fx-crm,\s*\n\.fx-crm-root,\s*\n\[data-crmv2-root\] \{\s*\n\s*--chrome-pad:\s*10px;/);
  assert.match(globals, /\.fx-logo-theme \{\s*filter: brightness\(0\);/);
  assert.match(globals, /html\[data-fx-theme="dark"\] \.fx-logo-theme \{\s*filter: brightness\(0\) invert\(1\);/);

  const layout = read("src/app/(admin)/izcrm/layout.tsx");
  assert.match(layout, /luxury\.css/);
  assert.match(layout, /fx-toolbar/);
  assert.match(layout, /fx-userchip/);
  assert.match(layout, /fx-btn fx-btn--secondary fx-btn--sm/);
  assert.match(layout, /fx-btn--danger/);
  assert.match(layout, /<NotificationBell(\s[^>]*)?\s*\/>/);
  assert.match(layout, /<CrmShortcuts \/>/);

  for (const rel of [
    "src/app/(public)/layout.tsx",
    "src/app/(auth)/layout.tsx",
    "src/app/(terminal)/layout.tsx",
    "src/components/ui/FxButton.tsx",
  ]) {
    assert.match(read(rel), /fx-btn|luxury\.css/, rel);
  }

  const button = read("src/components/ui/FxButton.tsx");
  assert.match(button, /variant\?: Variant/);
  assert.match(button, /primary: "fx-btn fx-btn--primary"/);

  const landing = read("src/components/landing/landing.css");
  assert.match(landing, /\.fx-btn-primary \{[^}]*font-weight:\s*500/);
  assert.equal(/font-weight:\s*600/.test(landing), false);
  assert.match(landing, /#c6a56a/);
  assert.match(landing, /--fx-buy:\s*#1fb58f/);
  assert.match(landing, /--fx-sell:\s*#ef5350/);

  console.log("luxury-ui tests passed");
}

main();
