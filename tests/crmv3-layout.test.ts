/**
 * CRM v3 sizing: 4px grid, 8px rhythm, 40px controls, 44px targets, safe areas.
 * Viewport coverage is encoded as min-width queries. Overflow stays clipped.
 * Run: npx tsx tests/crmv3-layout.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "..");
const css = fs.readFileSync(path.join(ROOT, "src/components/crmv3/crmv3.css"), "utf8");
const globals = fs.readFileSync(path.join(ROOT, "src/app/globals.css"), "utf8");

function main() {
  assert.match(globals, /\.fx-crm,\s*\n\.fx-crm-root,\s*\n\[data-crmv2-root\] \{\s*\n\s*--chrome-pad:\s*10px;/);
  assert.match(globals, /\[data-crmv3-root\] \{\s*\n\s*--chrome-pad:\s*10px;/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.match(css, /--c3-1:\s*4px/);
  assert.match(css, /--c3-2:\s*8px/);
  assert.match(css, /--c3-3:\s*16px/);
  assert.match(css, /--c3-control:\s*40px/);
  assert.match(css, /--c3-touch:\s*44px/);
  assert.match(css, /min-height:\s*var\(--c3-control\)/);
  assert.match(css, /min-height:\s*var\(--c3-touch\)/);
  assert.match(css, /safe-area-inset-top/);
  assert.match(css, /safe-area-inset-bottom/);
  assert.match(css, /safe-area-inset-left/);
  assert.match(css, /safe-area-inset-right/);
  assert.match(css, /overflow-x:\s*clip/);
  assert.match(css, /\[data-theme="light"\]/);
  assert.match(css, /--c3-pos:/);
  assert.match(css, /--c3-neg:/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);

  const header = css.slice(css.indexOf(".c3-header {"), css.indexOf(".c3-logo {"));
  assert.match(header, /safe-area-inset-top/);
  assert.match(header, /var\(--chrome-pad\)/);
  const tabs = css.slice(css.indexOf(".c3-tabs {"), css.indexOf(".c3-tab {"));
  assert.match(tabs, /safe-area-inset-bottom/);
  assert.match(tabs, /var\(--chrome-pad\)/);

  for (const width of [360, 390, 414, 430, 768, 820, 1024]) {
    assert.match(css, new RegExp(`@media \\(min-width: ${width}px\\)`), String(width));
  }
  assert.match(css, /@media \(max-width: 359px\)/);
  assert.match(css, /orientation:\s*landscape/);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);

  console.log("crmv3-layout tests passed");
}

main();
