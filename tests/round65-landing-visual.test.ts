/**
 * Landing visuals stay off the home page chunk and use the public quote feed.
 * Run: npx tsx tests/round65-landing-visual.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "..");

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

const KEYS = [
  "landing.desk.bid",
  "landing.desk.ask",
  "landing.desk.buy",
  "landing.desk.sell",
  "landing.desk.watch",
  "landing.desk.ticket",
  "landing.desk.spread",
  "landing.desk.note",
];

function main() {
  const pkg = JSON.parse(read("package.json"));
  assert.equal(pkg.dependencies.next, "14.2.35");
  assert.equal(pkg.dependencies.prisma, "5.22.0");

  const page = read("src/components/landing/LandingPage.tsx");
  assert.match(page, /dynamic\(\(\) => import\("@\/components\/landing\/HeroAtmosphere"\)/);
  assert.match(page, /ssr:\s*false/);
  assert.match(page, /FeatureDeck/);
  assert.match(page, /data-fx-feature=""/);
  assert.equal(page.includes('from "@/components/landing/LiveMarkets"'), false);
  assert.match(page, /<BrandLogo priority/);

  const atmo = read("src/components/landing/HeroAtmosphere.tsx");
  assert.match(atmo, /prefers-reduced-motion/);
  assert.match(atmo, /IntersectionObserver/);
  assert.match(atmo, /<canvas/);

  const markets = read("src/components/landing/LiveMarkets.tsx");
  assert.match(markets, /export function FeatureDeck/);
  assert.match(markets, /export function TerminalDesk/);
  assert.match(markets, /\/api\/market\/quote\?live=1/);
  assert.equal(markets.includes("/api/orders"), false);
  assert.equal(/\[\.\.\.\s*(seen|extraCharts|listeners)/.test(markets), false);

  const loop = read("src/components/landing/TerminalLoop.tsx");
  assert.match(loop, /TerminalDesk/);
  assert.match(loop, /loading="lazy"/);
  assert.match(loop, /<canvas/);
  assert.match(loop, /if \(!near \|\| reduce\) return/);
  assert.equal(loop.includes("<video"), false);
  assert.equal(loop.includes("/api/orders"), false);
  assert.equal(loop.includes("terminal-demo"), false);

  const css = read("src/components/landing/landing.css");
  assert.match(css, /\.fx-hero-atmo/);
  assert.match(css, /\.fx-desk-mock/);
  assert.match(css, /aspect-ratio:\s*16\s*\/\s*9/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.fx-ticker-track/);
  assert.equal(/font-weight:\s*600/.test(css), false);
  assert.equal(/font-weight:\s*700/.test(css), false);

  const stage = read("src/components/landing/ProductStage.tsx");
  assert.equal(stage.includes("<video"), false);

  for (const loc of ["en", "tr", "de", "ru", "ar"]) {
    const src = read(`src/lib/i18n/dictionaries/${loc}.ts`);
    for (const key of KEYS) {
      assert.match(src, new RegExp(`"${key.split(".").join("\\.")}"`));
    }
  }

  const login = read("src/components/auth/LoginForm.tsx");
  assert.match(login, /id="fx-login-identifier"[\s\S]*?readOnly=\{loading\}/);
  assert.match(login, /id="fx-login-password"[\s\S]*?readOnly=\{loading\}/);

  console.log("round65 tests passed");
}

main();
