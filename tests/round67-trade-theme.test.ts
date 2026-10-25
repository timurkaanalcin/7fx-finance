/**
 * Trade desk follows the day/night theme, the account strip stays fully
 * visible, and a missing live quote shows the last daily close.
 * Run: npx tsx tests/round67-trade-theme.test.ts
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
  assert.match(css, /\.fx-blotter th:last-child[\s\S]*position:\s*sticky/);
  assert.match(css, /\.fx-blotter th:last-child,\s*\.fx-blotter td:last-child\s*\{[^}]*background:\s*#0a0a0a/);
  assert.match(css, /\.fx-blotter td\[colspan\]\s*\{[^}]*position:\s*static/);
  assert.match(css, /\.fx-blotter td\[colspan\]\s*\{[^}]*background:\s*transparent/);
  assert.match(
    css,
    /html\[data-fx-theme="light"\] \.fx-desk \.fx-blotter thead th:last-child\s*\{[^}]*background:\s*var\(--lx-elev\)/
  );
  assert.match(css, /\.fx-account-metrics\s*\{[^}]*flex-wrap:\s*wrap/);
  assert.match(css, /max-height:\s*520px\)[\s\S]*flex-wrap:\s*nowrap/);
  assert.equal(/font-weight:\s*650/.test(css), false);
  assert.equal(/font-weight:\s*700/.test(css), false);

  const watch = read("src/components/trading/Watchlist.tsx");
  assert.match(watch, /\/api\/market\/ohlc\?symbol=/);
  assert.match(watch, /timeframe=1D/);
  assert.match(watch, /data-fx-watch-quote=\{live \? "live" : showLast \? "last" : "empty"\}/);
  assert.match(watch, /t\("term\.watch\.closed"\)/);
  assert.equal(watch.includes("setPrices"), false);
  assert.equal(watch.includes("basePrice"), false);
  assert.equal(/\[\.\.\.\s*(queued|inflight|failed)/.test(watch), false);
  assert.match(watch, /font-normal uppercase tracking-wide text-desk-muted/);

  const locales = ["en", "tr", "de", "ru", "ar"] as const;
  const closed: Record<(typeof locales)[number], string> = {
    en: "closed",
    tr: "kapalı",
    de: "geschlossen",
    ru: "закрыт",
    ar: "مغلق",
  };
  for (const loc of locales) {
    const src = read(`src/lib/i18n/dictionaries/${loc}.ts`);
    assert.match(src, new RegExp(`"term\\.watch\\.closed": "${closed[loc]}"`));
    assert.match(src, /"term\.watch\.closedHint": "/);
  }

  const login = read("src/components/auth/LoginForm.tsx");
  assert.match(login, /id="fx-login-identifier"[\s\S]*?readOnly=\{loading\}/);
  assert.match(login, /id="fx-login-password"[\s\S]*?readOnly=\{loading\}/);
  assert.equal(read("src/lib/price-engine.ts").includes("term.watch.closed"), false);

  console.log("round67 trade theme ok");
}

main();
