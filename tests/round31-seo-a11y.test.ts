/**
 * English document metadata, robots aligned with the sitemap, image sizes,
 * and contrast/focus/labels on landing, login, and trade.
 * Run: npx tsx tests/round31-seo-a11y.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "..");

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function main() {
  for (const rel of [
    "src/app/(public)/faq/page.tsx",
    "src/app/(public)/markets/page.tsx",
    "src/app/(public)/platform/page.tsx",
    "src/app/(public)/markets/[asset]/page.tsx",
  ]) {
    const page = read(rel);
    assert.equal(page.includes("localizeMarketingMeta"), false, rel);
    assert.equal(page.includes("marketingMetadata"), true, rel);
  }

  const auth = read("src/lib/i18n/public-meta.ts");
  assert.equal(auth.includes("privateEnglishMetadata"), true);
  assert.equal(auth.includes('from "./dictionaries/en"'), true);
  assert.equal(auth.includes("publicLocaleFromCookie"), false);
  assert.match(auth, /openGraph|privateEnglishMetadata/);

  const trade = read("src/app/(terminal)/trade/page.tsx");
  assert.match(trade, /Trade · 7FX/);
  assert.match(trade, /privateEnglishMetadata/);
  assert.equal(trade.includes("readTradeSnapshot"), true);

  const robots = read("src/app/robots.ts");
  assert.match(robots, /"\/markets"/);
  assert.match(robots, /"\/platform"/);
  assert.match(robots, /"\/faq"/);
  assert.match(robots, /"\/fx-css"/);
  assert.match(robots, /"\/fx-landing-css"/);
  assert.equal(robots.includes('"$"'), false);
  assert.equal(robots.includes("/$"), false);
  assert.match(read("src/app/sitemap.ts"), /MARKETING_PATHS/);

  const top = read("src/components/trading/TopBar.tsx");
  assert.match(top, /alt="7FX"/);
  assert.match(top, /width=\{28\}/);
  assert.match(top, /height=\{28\}/);
  assert.match(top, /icon-64\.png/);

  const base = read("src/app/base.css");
  assert.equal(base.includes("rgba(244, 247, 251, 0.38)"), false);
  assert.match(base, /rgba\(244, 247, 251, 0\.72\)/);
  assert.match(base, /\.fx-auth-page label/);
  assert.match(base, /select:focus-visible/);

  const landing = read("src/components/landing/landing.css");
  assert.match(landing, /select:focus-visible/);
  assert.match(landing, /input:focus-visible/);
  const phone = read("src/components/landing/PhonePreview.tsx");
  assert.equal(phone.includes('text-[#2a2a2a]'), false);
  assert.equal(phone.includes('stroke="#111111"'), false);
  assert.match(phone, /width=\{24\}/);

  const ticket = read("src/components/trading/OrderTicket.tsx");
  assert.match(ticket, /aria-label=\{t\("term\.col\.volume"\)\}/);
  assert.match(ticket, /aria-label=\{t\("term\.ot\.volDown"\)\}/);
  assert.match(ticket, /aria-label=\{t\("term\.ot\.volUp"\)\}/);
  assert.match(ticket, /aria-label=\{t\("term\.ot\.stopLoss"\)\}/);
  assert.match(ticket, /aria-label=\{t\("term\.ot\.takeProfit"\)\}/);
  assert.match(read("src/lib/i18n/dictionaries/en.ts"), /"term\.ot\.volDown": "Decrease volume"/);

  const login = read("src/components/auth/LoginForm.tsx");
  assert.match(login, /id="fx-login-identifier"[\s\S]*?readOnly=\{loading\}/);
  assert.match(login, /id="fx-login-password"[\s\S]*?readOnly=\{loading\}/);

  const cookie = read("src/lib/session-cookie.ts");
  assert.match(cookie, /Array\.from\(domains\)/);
  assert.equal(cookie.includes("[...domains]"), false);

  const desk = read("src/app/globals.css");
  assert.match(desk, /\.fx-desk :focus-visible/);
  assert.equal(desk.includes("#787b86"), false);
  assert.match(read("tailwind.config.ts"), /muted: "#a7b0c0"/);

  console.log("round31 tests passed");
}

main();
