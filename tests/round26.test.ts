/**
 * Round 26: display font preload, small trade poster, public language menu, OHLC gzip.
 * Run: npx tsx tests/round26.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { publicBundle } from "../src/lib/public-doc-copy";

const ROOT = path.resolve(__dirname, "..");

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function main() {
  const fonts = read("src/lib/fonts.ts");
  assert.equal(fonts.includes("Sora"), false);
  assert.match(fonts, /variable:\s*"--font-inter"/);
  assert.match(fonts, /variable:\s*"--font-inter-ext"/);
  const latinAt = fonts.indexOf('subsets: ["latin"]');
  const extAt = fonts.indexOf('subsets: ["latin-ext"]');
  assert.ok(latinAt > 0 && extAt > latinAt);
  assert.match(fonts.slice(latinAt, extAt), /preload:\s*true/);
  assert.match(fonts.slice(extAt), /preload:\s*false/);
  assert.match(read("src/app/globals.css"), /var\(--font-inter\), var\(--font-inter-ext\)/);
  assert.equal(read("src/app/globals.css").includes("--font-sora"), false);

  const ohlc = read("src/app/api/market/ohlc/route.ts");
  assert.match(ohlc, /maybeGzipJson/);
  assert.match(ohlc, /Content-Encoding/);
  assert.match(ohlc, /candles/);

  const doc = read("src/components/public/PublicDoc.tsx");
  assert.match(doc, /PublicLanguageMenu/);
  assert.match(read("src/components/public/PublicLanguageMenu.tsx"), /fx_lang=/);
  assert.equal(publicBundle("en").nav.language, "Language");
  assert.equal(publicBundle("tr").nav.language, "Dil");
  assert.notEqual(publicBundle("de").nav.language, "Language");
  assert.equal(/[çğıöşüÇĞİÖŞÜıİ]/.test(publicBundle("en").nav.language), false);

  const poster = fs.statSync(path.join(ROOT, "public/landing/chart-poster.avif")).size;
  assert.ok(poster < 9000, `chart poster is ${poster} bytes`);
  assert.match(read("src/app/(terminal)/trade/page.tsx"), /chart-poster\.avif/);
  const shell = read("src/components/trading/TerminalShell.tsx");
  assert.match(shell, /min-h-\[44vh\] w-full/);
  assert.match(shell, /min-w-\[4\.75rem\]/);
  assert.match(shell, /min-width: 768px/);
  assert.match(shell, /deskWide &&/);
  const chart = read("src/components/trading/TradingChart.tsx");
  assert.match(chart, /data-fx-chart-quote=""/);
  assert.match(chart, /min-h-\[18px\] flex-nowrap/);
  assert.match(chart, /min-w-\[4\.25rem\]/);

  console.log("round26 tests passed");
}

main();
