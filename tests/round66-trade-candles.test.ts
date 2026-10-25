/**
 * Shared candle painter for the landing hero and the signed-in trade chart.
 * Run: npx tsx tests/round66-trade-candles.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { easeRightEdge, type PaintBar } from "../src/components/charts/price-paint";

const ROOT = path.resolve(__dirname, "..");

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function bar(o: number, h: number, l: number, c: number): PaintBar {
  return { o, h, l, c };
}

function main() {
  const pkg = JSON.parse(read("package.json"));
  assert.equal(pkg.dependencies.next, "14.2.35");
  assert.equal(pkg.dependencies.prisma, "5.22.0");

  const paint = read("src/components/charts/price-paint.ts");
  const overlay = read("src/components/trading/chart-paint.ts");
  const markets = read("src/components/landing/LiveMarkets.tsx");
  const chart = read("src/components/trading/TradingChart.tsx");

  assert.match(markets, /from "@\/components\/charts\/price-paint"/);
  assert.match(markets, /paintCandles\(canvas, bars, pulse\)/);
  assert.equal(markets.includes("function drawCandles"), false);
  assert.equal(markets.includes("function drawSeries"), false);
  assert.equal(/\[\.\.\.\s*(seen|extraCharts|listeners)/.test(markets), false);

  assert.match(chart, /import type \{[\s\S]*IChartApi[\s\S]*\} from "lightweight-charts"/);
  assert.match(chart, /import\("\.\/chart-engine"\)/);
  assert.match(chart, /onClick=\{\(\) => onTimeframe\(tf\.id\)\}/);
  assert.match(chart, /paintChartOverlay/);
  assert.match(chart, /aria-pressed=\{chartType === "candle"\}/);
  assert.match(chart, /aria-pressed=\{chartType === "line"\}/);
  assert.match(chart, /HIDDEN_CANDLE/);
  assert.equal(chart.includes("font-bold"), false);
  assert.equal(/import \{[^}]*createChart/.test(chart), false);
  assert.equal(/\[\.\.\.(new Set|new Map|[a-zA-Z]*Set|[a-zA-Z]*Map)\]/.test(paint + overlay), false);

  assert.match(overlay, /easeRightEdge/);
  assert.match(overlay, /strokeCandles/);
  assert.match(overlay, /priceToCoordinate/);
  assert.match(overlay, /import type \{[\s\S]*?\} from "lightweight-charts"/);
  assert.equal(overlay.replace(/import type \{[\s\S]*?\} from "lightweight-charts"/, "").includes("lightweight-charts"), false);

  const p = 1.12;
  const calm: PaintBar[] = [];
  for (let i = 0; i < 30; i += 1) {
    const c = 100 + Math.sin(i / 3) * 2;
    calm.push(bar(c - 0.4, c + 0.8, c - 0.9, c));
  }
  assert.equal(easeRightEdge(calm), calm);

  const plateau: PaintBar[] = [];
  for (let i = 0; i < 12; i += 1) plateau.push(bar(p, p + 0.0001, p - 0.0001, p));
  for (let i = 0; i < 6; i += 1) plateau.push(bar(p, p, p, p));
  plateau[11] = bar(p, p + 0.01, p, p);
  const eased = easeRightEdge(plateau);
  assert.equal(eased[11].o, p);
  assert.equal(eased[11].c, p);
  assert.ok(eased[11].h < p + 0.005);
  assert.ok(eased[11].h > p);
  assert.equal(eased[0], plateau[0]);

  const step: PaintBar[] = [];
  for (let i = 0; i < 16; i += 1) step.push(bar(p, p, p, p));
  step[10] = bar(p + 0.01, p + 0.01, p, p);
  const stepped = easeRightEdge(step);
  assert.equal(stepped[10].c, p);
  assert.ok(stepped[10].o < p + 0.004);
  assert.ok(stepped[10].o > p);
  for (let i = 0; i < eased.length; i += 1) {
    assert.equal(eased[i].o, plateau[i].o);
    assert.equal(eased[i].c, plateau[i].c);
  }

  const login = read("src/components/auth/LoginForm.tsx");
  assert.match(login, /id="fx-login-identifier"[\s\S]*?readOnly=\{loading\}/);
  assert.match(login, /id="fx-login-password"[\s\S]*?readOnly=\{loading\}/);

  for (const loc of ["en", "tr", "de", "ru", "ar"]) {
    const src = read(`src/lib/i18n/dictionaries/${loc}.ts`);
    assert.match(src, /"term\.chart\.candle"/);
    assert.match(src, /"term\.chart\.line"/);
    assert.match(src, /"term\.chart\.timeframe"/);
  }

  console.log("round66 trade candle tests passed");
}

main();
