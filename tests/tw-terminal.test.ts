/**
 * /tw uses the same session gate as /trade, lightweight-charts, and i18n.
 * Run: npx tsx tests/tw-terminal.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { NextRequest } from "next/server";
import { middleware } from "../src/middleware";
import { isPrivateHtmlPath } from "../src/lib/seo-hosts";
import { sma, ema, bollinger } from "../src/components/tw/indicators";
import { emailHtml } from "../src/lib/email-brand";

const ROOT = path.resolve(__dirname, "..");

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function main() {
  const anon = middleware(
    new NextRequest("http://127.0.0.1:3000/tw", {
      headers: {
        "x-forwarded-host": "7fx.customer.org.tr",
        "x-forwarded-proto": "https",
        host: "127.0.0.1:3000",
      },
    })
  );
  assert.equal(anon.headers.get("location"), "https://7fx.customer.org.tr/login");

  const signed = middleware(
    new NextRequest("http://127.0.0.1:3000/tw", {
      headers: {
        "x-forwarded-host": "7fx.customer.org.tr",
        "x-forwarded-proto": "https",
        host: "127.0.0.1:3000",
        cookie: "7fx_session=present",
      },
    })
  );
  assert.equal(signed.headers.get("location"), null);
  assert.equal(signed.headers.get("cache-control"), "private, no-store");
  assert.equal(isPrivateHtmlPath("/tw"), true);

  const page = read("src/app/(terminal)/tw/page.tsx");
  const term = read("src/components/tw/TwTerminal.tsx");
  const chart = read("src/components/tw/TwChart.tsx");
  assert.match(page, /TwTerminal/);
  assert.match(term, /\/api\/market\/ohlc/);
  assert.match(term, /\/api\/market\/quote/);
  assert.match(term, /\/api\/positions\?status=OPEN/);
  assert.match(term, /\/api\/orders\?status=PENDING/);
  assert.match(term, /\/api\/positions\/close/);
  assert.match(term, /\/api\/orders\/cancel/);
  assert.match(chart, /from "lightweight-charts"/);
  assert.match(chart, /HistogramSeries/);
  assert.match(chart, /attributionLogo: false/);
  assert.match(chart, /tw\.chartsCredit/);
  assert.equal(chart.includes("TradingView"), false);
  assert.equal(term.includes("TradingView"), false);
  assert.match(read("src/components/landing/LandingPage.tsx"), /Lightweight Charts/);
  assert.equal(read("src/components/landing/LandingPage.tsx").includes("TradingView"), false);

  const closes = [1, 2, 3, 4, 5, 6, 7];
  const avg = sma(closes, 3);
  assert.equal(avg[1], null);
  assert.equal(avg[2], 2);
  assert.equal(avg[6], 6);
  const smooth = ema(closes, 3);
  assert.equal(smooth[2], 2);
  assert.ok((smooth[6] || 0) > 4);
  const bands = bollinger(closes, 3, 2);
  assert.ok((bands.upper[2] || 0) > (bands.lower[2] || 0));

  const html = emailHtml({ subject: "Hello", body: "Line\n<b>", logoUrl: "/email/7fx-logo.png" });
  assert.match(html, /7fx-logo\.png/);
  assert.match(html, /alt="7FX"/);
  assert.equal(html.includes("<b>"), false);
  assert.match(html, /<br\/>/);

  const icon = fs.readFileSync(path.join(ROOT, "public/icons/v3/icon-512.png"));
  assert.ok(icon.length > 1000);
  assert.match(read("public/icons/v3/icon.svg"), /#000000/);
  assert.match(read("public/icons/v3/icon.svg"), /#ffffff/);
  assert.equal(read("public/icons/v3/icon.svg").includes("#68F848"), false);
  assert.match(read("public/icons/v3/icon-maskable.svg"), /scale\(0\.62\)/);
  assert.equal(read("public/7fx-logo.png").includes("68F848"), false);

  console.log("tw terminal tests passed");
}

main();
