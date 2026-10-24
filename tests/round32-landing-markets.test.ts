/**
 * Below-the-fold terminal loop and the markets quote table.
 * Run: npx tsx tests/round32-landing-markets.test.ts
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
  assert.match(loop, /id="screen"/);
  assert.match(loop, /loading="lazy"/);
  assert.match(loop, /terminal-poster\.webp/);
  assert.match(loop, /IntersectionObserver/);
  assert.match(loop, /prefers-reduced-motion/);
  assert.match(loop, /<canvas/);
  assert.equal(loop.includes("terminal-demo"), false);
  assert.equal(loop.includes("fetchpriority"), false);

  const page = read("src/components/landing/LandingPage.tsx");
  assert.match(page, /TerminalLoop/);
  const screenAt = page.indexOf("<TerminalLoop");
  const platformAt = page.indexOf('id="platform"');
  const heroAt = page.indexOf('id="hero-title"');
  assert.ok(heroAt > 0 && screenAt > heroAt && platformAt > screenAt);

  const stage = read("src/components/landing/ProductStage.tsx");
  assert.equal(stage.includes("terminal-demo"), false);
  assert.equal(stage.includes("<video"), false);

  const css = read("src/components/landing/landing.css");
  assert.match(css, /\.fx-screen-stage/);
  assert.match(css, /aspect-ratio:\s*16\s*\/\s*9/);
  assert.equal(/font-weight:\s*700/.test(css), false);
  assert.equal(/font-weight:\s*600/.test(css), false);

  const markets = read("src/app/(public)/markets/page.tsx");
  assert.match(markets, /MarketsLiveTable/);
  assert.match(markets, /marketingMetadata/);
  assert.equal(markets.includes("localizeMarketingMeta"), false);

  const table = read("src/components/public/MarketsLiveTable.tsx");
  assert.match(table, /\/api\/market\/quote\?symbols=/);
  assert.match(table, /fx-quote-scroll/);
  assert.match(table, /IntersectionObserver/);
  assert.equal(table.includes("[..."), false);

  const base = read("src/app/base.css");
  assert.match(base, /\.fx-quote-scroll[\s\S]*overflow-x:\s*auto/);
  assert.match(base, /min-width:\s*520px/);
  assert.match(base, /position:\s*sticky/);

  const en = read("src/lib/i18n/dictionaries/en.ts");
  assert.match(en, /"landing\.screen\.title": "The trading screen"/);
  assert.match(en, /"markets\.table\.bid": "Bid"/);

  const login = read("src/components/auth/LoginForm.tsx");
  assert.match(login, /id="fx-login-identifier"[\s\S]*?readOnly=\{loading\}/);
  const cookie = read("src/lib/session-cookie.ts");
  assert.match(cookie, /return Array\.from\(domains\)/);
  assert.equal(cookie.includes("[...domains]"), false);

  console.log("round32 tests passed");
}

main();
