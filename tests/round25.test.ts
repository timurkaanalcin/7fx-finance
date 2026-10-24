/**
 * Round 25: read-only trade header snapshot, candle gzip, public fx_lang copy.
 * Run: npx tsx tests/round25.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { gunzipSync } from "node:zlib";
import { publicLocaleFromCookie } from "../src/lib/i18n/locales";
import { maybeGzipJson } from "../src/lib/json-gzip";
import { MARKETING_COPY } from "../src/lib/public-pages";
import { localizeMarketingMeta, metaFor, publicBundle } from "../src/lib/public-doc-copy";
import { marketingMetadata } from "../src/lib/seo";
import { metricsFromStoredAccount } from "../src/lib/trade-metrics";

const ROOT = path.resolve(__dirname, "..");

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function main() {
  const flat = metricsFromStoredAccount({
    balance: 1000,
    equity: 1000,
    margin: 0,
    freeMargin: 1000,
    leverage: 100,
    currency: "USD",
    credit: 0,
    bonus: 0,
  });
  assert.equal(flat.profitLoss, 0);
  assert.equal(flat.marginLevel, 0);
  assert.equal(flat.marginCall, false);

  const floating = metricsFromStoredAccount({
    balance: 1000,
    equity: 1040,
    margin: 200,
    freeMargin: 840,
    leverage: 100,
    currency: "USD",
  });
  assert.equal(floating.profitLoss, 40);
  assert.equal(floating.marginLevel, 520);
  assert.equal(floating.marginCall, false);

  const called = metricsFromStoredAccount({
    balance: 100,
    equity: 40,
    margin: 50,
    freeMargin: -10,
    leverage: 100,
    currency: "USD",
  });
  assert.equal(called.profitLoss, -60);
  assert.equal(called.marginLevel, 80);
  assert.equal(called.marginCall, true);

  const snapshot = read("src/lib/trade-snapshot.ts");
  assert.equal(snapshot.includes("refreshAccountMetrics"), false);
  assert.equal(snapshot.includes("touchPresence"), false);
  assert.equal(snapshot.includes("ensureDemoSeed"), false);
  assert.match(snapshot, /metricsFromStoredAccount/);
  assert.match(read("src/app/(terminal)/trade/page.tsx"), /readTradeSnapshot/);

  const shell = read("src/components/trading/TerminalShell.tsx");
  assert.equal(shell.includes("if (!ready || !user)"), false);
  assert.match(shell, /initialUser/);
  assert.match(shell, /chart-poster\.avif/);
  assert.match(shell, /fetchPriority="high"/);
  assert.match(shell, /if \(!ready\) return/);

  const candles = read("src/app/api/candles/route.ts");
  assert.match(candles, /maybeGzipJson/);
  assert.match(candles, /Content-Encoding/);
  const big = { candles: Array.from({ length: 40 }, (_, i) => ({ t: i, o: 1, h: 2, l: 0.5, c: 1.2 })) };
  const gzipped = maybeGzipJson("gzip, deflate, br", big);
  assert.equal(gzipped.encoding, "gzip");
  assert.equal(gunzipSync(gzipped.body).toString("utf8"), gzipped.json);
  const plain = maybeGzipJson(null, big);
  assert.equal(plain.encoding, null);
  const tiny = maybeGzipJson("gzip", { ok: true });
  assert.equal(tiny.encoding, null);

  const css = read("src/app/mobile-luxe.css");
  assert.match(css, /\.fx-desk \.text-\\\[8px\\\]/);
  assert.match(css, /font-size: 12px !important/);
  assert.equal(css.includes("font-size: 11.5px"), false);

  assert.equal(publicLocaleFromCookie(null), "en");
  assert.equal(publicLocaleFromCookie(""), "en");
  assert.equal(publicLocaleFromCookie("tr"), "tr");
  const en = publicBundle("en");
  const tr = publicBundle("tr");
  assert.equal(en.markets.title, "Markets");
  assert.notEqual(tr.markets.title, en.markets.title);
  assert.equal(/[çğıöşüÇĞİÖŞÜıİ]/.test(en.markets.lede + en.faq.lede + en.platform.lede), false);
  assert.equal(metaFor("en", "/markets").title, MARKETING_COPY["/markets"].title);
  assert.notEqual(metaFor("tr", "/faq").title, metaFor("en", "/faq").title);
  assert.equal(metaFor("de", "/nope").title, metaFor("en", "/nope").title);
  const base = marketingMetadata("7fx.customer.org.tr", "/markets");
  assert.equal(localizeMarketingMeta(base, "en", "x", "y"), base);
  const trMeta = localizeMarketingMeta(base, "tr", metaFor("tr", "/markets").title, metaFor("tr", "/markets").description);
  assert.equal(trMeta.openGraph && !Array.isArray(trMeta.openGraph) ? trMeta.openGraph.locale : "", "tr_TR");

  const manifest = JSON.parse(read("public/logos/manifest.json")) as Record<string, string>;
  for (const symbol of ["CVX", "NVDA", "XOM", "AAPL", "XAUUSD", "BTCUSD", "ETHUSD"]) {
    assert.match(manifest[symbol], /\.webp$/);
    assert.ok(fs.existsSync(path.join(ROOT, "public", manifest[symbol].replace(/^\//, ""))), symbol);
  }
  const desktop = fs.statSync(path.join(ROOT, "public/landing/terminal-desktop.avif")).size;
  assert.ok(desktop < 25000, `terminal-desktop.avif is ${desktop} bytes`);
  assert.ok(fs.existsSync(path.join(ROOT, "public/icons/v3/icon-64.png")));
  assert.match(read("src/components/trading/TopBar.tsx"), /icon-64\.png/);
  assert.equal(read("src/components/trading/TopBar.tsx").includes("icon-192.png"), false);

  console.log("round25 tests passed");
}

main();
