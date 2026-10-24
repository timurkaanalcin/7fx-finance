/**
 * Site type scale: one variable sans, lighter headings, 12px mobile floor.
 * Run: npx tsx tests/type-scale.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "..");

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function main() {
  const fonts = read("src/lib/fonts.ts");
  assert.equal(fonts.includes("Sora"), false);
  assert.match(fonts, /variable:\s*"--font-inter"/);
  assert.match(fonts, /preload:\s*true/);
  const extAt = fonts.indexOf('subsets: ["latin-ext"]');
  const latinAt = fonts.indexOf('subsets: ["latin"]');
  assert.ok(latinAt > 0 && extAt > latinAt);
  assert.match(fonts.slice(latinAt, extAt), /preload:\s*true/);
  assert.match(fonts.slice(extAt), /preload:\s*false/);

  const tw = read("tailwind.config.ts");
  for (const step of ["12px", "13px", "14px", "16px", "20px", "24px", "32px", "44px", "56px"]) {
    assert.ok(tw.includes(`"${step}"`) || tw.includes(`'${step}'`) || tw.includes(step), step);
  }
  assert.match(tw, /semibold:\s*"500"/);
  assert.match(tw, /bold:\s*"600"/);
  assert.match(tw, /black:\s*"600"/);
  assert.match(tw, /tight:\s*"-0\.02em"/);

  const css = read("src/app/globals.css");
  assert.equal(/font-weight:\s*(650|700|800|900)/.test(css), false);
  assert.match(css, /letter-spacing:\s*-0\.02em/);
  assert.match(css, /--fx-fs-56:\s*56px/);
  assert.match(css, /font-weight:\s*300/);
  assert.equal(css.includes("--font-sora"), false);
  assert.match(css, /font-variant-numeric:\s*tabular-nums/);

  const mobile = read("src/app/mobile-luxe.css");
  assert.match(mobile, /font-size: 12px !important/);
  assert.equal(mobile.includes("font-size: 11px"), false);
  assert.equal(/font-weight:\s*700/.test(mobile), false);

  const layout = read("src/app/layout.tsx");
  assert.equal(layout.includes("sora"), false);
  const shell = read("src/components/trading/TerminalShell.tsx");
  assert.match(shell, /min-width: 768px/);
  assert.match(shell, /min-height: 560px/);
  assert.match(shell, /deskWide &&/);
  assert.match(css, /fx-doc-title/);
  assert.match(css, /min\(1280px/);
  assert.match(css, /fx-watchlist/);
  const lang = read("src/components/i18n/LanguageSwitcher.tsx");
  assert.equal(lang.includes("0.65"), false);
  assert.match(lang, /fx-lang-select/);

  console.log("type-scale tests passed");
}

main();
