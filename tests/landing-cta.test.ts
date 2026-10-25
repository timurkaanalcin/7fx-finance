/**
 * Landing conversion copy: primary CTA, neutral trust strip, risk disclaimer, fast hero.
 * Run: npx tsx tests/landing-cta.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import { en } from "../src/lib/i18n/dictionaries/en";
import { tr } from "../src/lib/i18n/dictionaries/tr";
import { de } from "../src/lib/i18n/dictionaries/de";
import { ru } from "../src/lib/i18n/dictionaries/ru";
import { ar } from "../src/lib/i18n/dictionaries/ar";

function read(rel: string): string {
  return fs.readFileSync(new URL(`../${rel}`, import.meta.url), "utf8");
}

const STRIP = [
  "landing.trust.symbols",
  "landing.trust.access",
  "landing.trust.ssl",
  "landing.trust.pwa",
] as const;

const LOCALES = { en, tr, de, ru, ar };

function main() {
  const banned = /\d|licen[cs]e|award|regulated|ING|40\+|24\/7|7\/24|broker/i;
  for (const [name, dict] of Object.entries(LOCALES)) {
    for (const key of STRIP) {
      const value = dict[key];
      assert.equal(typeof value, "string", `${name} ${key}`);
      assert.doesNotMatch(value, banned, `${name} ${key} => ${value}`);
    }
    const risk = dict["landing.footer.risk"];
    assert.equal(typeof risk, "string", `${name} risk`);
    assert.match(risk, /risk|Risiko|риск|خطر|riski/i, `${name} risk => ${risk}`);
    assert.doesNotMatch(risk, /\d/, `${name} risk must not invent a figure`);
    assert.equal(typeof dict["landing.signIn"], "string");
    assert.equal(typeof dict["landing.openAccount"], "string");
    assert.doesNotMatch(dict["landing.securityTitle"], /licen|lizen|лиценз|ترخيص|lisans/i);
  }

  assert.equal(en["landing.signIn"], "Sign in");
  assert.equal(en["landing.openAccount"], "Open account");
  assert.equal(tr["landing.signIn"], "Giriş yap");
  assert.equal(tr["landing.openAccount"], "Hesap aç");
  assert.match(en["landing.footer.risk"], /not a regulatory license/i);
  assert.match(tr["landing.footer.risk"], /lisans/);
  assert.doesNotMatch(en["landing.aboutP1"], /broker/i);
  assert.doesNotMatch(en["landing.ctaBody"], /\d|minutes/i);

  const page = read("src/components/landing/LandingPage.tsx");
  const heroStart = page.indexOf('aria-labelledby="hero-title"');
  const hero = page.slice(heroStart, page.indexOf("</section>", heroStart));
  assert.match(hero, /className="fx-h1/);
  assert.ok(hero.indexOf('data-fx-cta="open"') < hero.indexOf('data-fx-cta="sign-in"'));
  assert.match(hero, /landing\.openAccount/);
  assert.match(hero, /landing\.signIn/);
  assert.match(page, /data-fx-trust=""/);
  assert.match(page, /data-fx-feature=""/);
  assert.match(page, /data-fx-risk=""/);
  assert.match(page, /landing\.footer\.risk/);
  for (const key of STRIP) assert.match(page, new RegExp(key.replace(".", "\\.")));
  const sticky = page.slice(page.indexOf("fx-sticky-cta"));
  assert.ok(sticky.indexOf('data-fx-cta="open"') < sticky.indexOf('data-fx-cta="sign-in"'));

  const layout = read("src/app/(public)/layout.tsx");
  assert.match(layout, /\.fx-landing \.fx-h1\{[^}]*font-weight:400/);
  assert.match(layout, /fx-chart-slot\{min-height:460px\}/);

  const css = read("src/components/landing/landing.css");
  assert.doesNotMatch(css, /font-weight:\s*600/);
  assert.doesNotMatch(css, /font-weight:\s*700/);
  assert.match(css, /\.fx-btn-primary \{[^}]*font-weight:\s*500/);
  assert.match(css, /\.fx-risk \{[^}]*font-weight:\s*400/);

  console.log("landing-cta tests passed");
}

main();
