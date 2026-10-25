/**
 * PWA manifest, iOS install copy, trade safe-area, 16px inputs, offline fallback.
 * Run: npx tsx tests/round40-pwa.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "..");

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function dictValue(rel: string, key: string): string {
  const src = read(rel);
  const re = new RegExp(`"${key.replace(/\./g, "\\.")}":\\s*"((?:[^"\\\\]|\\\\.)*)"`);
  const match = src.match(re);
  assert.ok(match, `${rel} missing ${key}`);
  return match[1];
}

function main() {
  const manifest = JSON.parse(read("public/site.webmanifest")) as {
    theme_color: string;
    background_color: string;
    icons: { src: string; purpose: string; sizes: string }[];
  };
  assert.equal(manifest.theme_color, "#07090d");
  assert.equal(manifest.background_color, "#07090d");
  const maskable = manifest.icons.filter((icon) => icon.purpose === "maskable");
  const any = manifest.icons.filter((icon) => icon.purpose === "any");
  assert.ok(maskable.length >= 2);
  assert.ok(any.some((icon) => icon.sizes === "192x192"));
  assert.ok(any.some((icon) => icon.sizes === "512x512"));
  for (const icon of manifest.icons) {
    assert.ok(fs.existsSync(path.join(ROOT, "public", icon.src.replace(/^\//, ""))), icon.src);
  }
  assert.match(read("src/app/layout.tsx"), /themeColor: "#07090d"/);
  assert.match(read("public/icons/v3/icon.svg"), /#07090d/);
  assert.match(read("public/icons/v3/icon-maskable.svg"), /scale\(0\.62\)/);

  const enLead = dictValue("src/lib/i18n/dictionaries/en.ts", "landing.ios.lead");
  const trLead = dictValue("src/lib/i18n/dictionaries/tr.ts", "landing.ios.lead");
  assert.equal(enLead.includes("Progressive Web App"), false);
  assert.equal(trLead.includes("Progressive Web App"), false);
  assert.match(enLead, /Home Screen/);
  assert.match(trLead, /Ana Ekran/);
  assert.notEqual(enLead, trLead);
  assert.match(dictValue("src/lib/i18n/dictionaries/en.ts", "landing.ios.step1Body"), /iPhone/);
  assert.match(dictValue("src/lib/i18n/dictionaries/tr.ts", "landing.ios.step1Body"), /iPhone/);
  const ios = read("src/components/landing/IosInstallPage.tsx");
  assert.match(ios, /t\("landing\.ios\.lead"\)/);
  assert.match(ios, /fx-ios-share/);
  assert.match(read("src/app/base.css"), /\.fx-ios \{[\s\S]*safe-area-inset-top/);

  const luxe = read("src/app/mobile-luxe.css");
  const tradeBar = luxe.slice(luxe.indexOf(".fx-desk-tradebar {"), luxe.indexOf(".fx-desk-tradebar button"));
  assert.match(tradeBar, /safe-area-inset-left/);
  assert.match(tradeBar, /safe-area-inset-right/);
  const nav = luxe.slice(luxe.indexOf(".fx-desk-mobile-nav {"), luxe.indexOf(".fx-desk-seg {"));
  assert.match(nav, /safe-area-inset-bottom/);
  assert.match(nav, /safe-area-inset-left/);
  assert.match(luxe, /font-size: 16px !important/);
  assert.match(read("src/app/globals.css"), /font-size: 16px !important/);
  assert.match(read("src/app/base.css"), /font-size: 16px !important/);

  const offline = read("public/offline.html");
  assert.match(offline, /You're offline/);
  assert.match(offline, /Çevrimdışısınız/);
  assert.match(offline, /Try again/);
  assert.match(offline, /Yeniden dene/);
  assert.equal(offline.includes("<link"), false);
  assert.match(offline, /theme-color" content="#07090d"/);

  const sw = read("public/sw.js");
  assert.match(sw, /OFFLINE_URL = "\/offline.html"/);
  assert.match(sw, /fetch\(url\.href, \{ cache: "no-store"/);
  assert.match(sw, /\.catch\(async \(\) => \{/);
  assert.equal(sw.includes("caches.put"), false);
  assert.match(sw, /2026-10-25-v5-network/);

  const shell = read("src/components/trading/TerminalShell.tsx");
  assert.match(
    shell,
    /disabled=\{user\.tradingEnabled === false \|\| !!user\.mustChangePassword(?: \|\| !!user\.impersonatedBy)?\}/
  );
  const login = read("src/components/auth/LoginForm.tsx");
  assert.match(login, /id="fx-login-identifier"[\s\S]{0,400}readOnly=\{loading\}/);
  assert.equal(login.slice(login.indexOf('id="fx-login-identifier"'), login.indexOf('id="fx-login-identifier"') + 420).includes("disabled={loading}"), false);
  assert.match(read("src/lib/session-cookie.ts"), /return Array\.from\(domains\)/);

  console.log("round40 ok: theme #07090d, iOS copy, safe-area, 16px inputs, offline page");
}

main();
