/**
 * English public render must not contain Turkish copy.
 * Run: npx tsx tests/public-en-render.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { en } from "../src/lib/i18n/dictionaries/en";
import { translate } from "../src/lib/i18n/dictionaries";

const ROOT = path.resolve(__dirname, "..");
const TR_CHARS = /[çğıöşüÇĞİÖŞÜıİ₺]/;
const PHRASES = [
  "ana sayfa",
  "main sayfa",
  "emir ve bakiye",
  "bakiyesi",
  "lisanslar",
  "sponsorlar",
  "lisans no",
  "resmi kayıt",
  "uygulamayı",
  "tıklayınız",
  "ana ekrana",
  "panelde",
  "her yerden",
  "3 aktif",
  "euro / dolar",
  "iphone ve ipad",
  "7/24",
  "1,8%",
  "2.341,20",
  "34,12",
  "82,40",
  "favori",
  "bildirim",
  "marj",
  "serbest",
  "kullanım",
  "tekrar",
  "bekliyor",
  "al / sat",
];

const PUBLIC_FILES = [
  "src/components/landing",
  "src/components/auth",
  "src/components/InstallBanner.tsx",
  "src/components/push/PushPromptBanner.tsx",
  "src/components/system/ErrorFallback.tsx",
  "src/app/page.tsx",
  "src/app/layout.tsx",
  "src/app/error.tsx",
  "src/app/global-error.tsx",
  "src/app/(auth)",
  "src/app/ios",
  "src/lib/seo.ts",
  "public/site.webmanifest",
];

const TERMINAL_FILES = [
  "src/components/trading",
  "src/components/notifications/NotificationBell.tsx",
  "src/app/(terminal)",
];

function hits(text: string): string[] {
  const found: string[] = [];
  const chars = text.match(TR_CHARS);
  if (chars) found.push(`char:${chars[0]}`);
  const lower = text.toLowerCase();
  for (const phrase of PHRASES) {
    if (lower.includes(phrase)) found.push(phrase);
  }
  if (/>\s*AL\s*</.test(text) || /["'`]AL["'`]/.test(text)) found.push("AL");
  if (/>\s*SAT\s*</.test(text) || /["'`]SAT["'`]/.test(text)) found.push("SAT");
  if (/>\s*Al\s*</.test(text)) found.push("Al");
  if (/>\s*Sat\s*</.test(text)) found.push("Sat");
  return found;
}

function stripForEnglishRender(src: string): string {
  const noComments = src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
  return noComments
    .replace(/\b(?:tr|de|ru|ar)\s*:\s*\{[^{}]*\}/g, "")
    .replace(/\b(?:tr|de|ru|ar)\s*:\s*"(?:\\.|[^"\\])*"/g, "")
    .replace(/\b(?:tr|de|ru|ar)\s*:\s*'(?:\\.|[^'\\])*'/g, "");
}

function walk(rel: string): string[] {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) return [];
  const stat = fs.statSync(abs);
  if (stat.isFile()) return [abs];
  const out: string[] = [];
  for (const name of fs.readdirSync(abs)) {
    if (name === "node_modules") continue;
    out.push(...walk(path.join(rel, name)));
  }
  return out;
}

function main() {
  assert.ok(hits("Güvenlik").includes("char:ü"), "detector must flag Güvenlik");
  assert.deepEqual(hits("7FX home"), []);
  assert.ok(hits("Main sayfa").includes("main sayfa"));
  assert.ok(hits(">AL<").includes("AL"));
  assert.deepEqual(hits(stripForEnglishRender('tr: { t: "Güvenlik ve ana sayfa" }, en: { t: "Security" }')), []);
  assert.deepEqual(hits(stripForEnglishRender('({tr:"İndir",en:"Download"})')), []);
  assert.ok(hits('?? "İndir"').length > 0);

  const dictHits: string[] = [];
  for (const [key, value] of Object.entries(en)) {
    const found = hits(value);
    if (found.length) dictHits.push(`${key} => ${value} [${found.join(", ")}]`);
  }
  assert.deepEqual(dictHits, []);

  const fileHits: string[] = [];
  const usedKeys = new Set<string>();
  for (const rel of PUBLIC_FILES.concat(TERMINAL_FILES)) {
    for (const file of walk(rel)) {
      if (!/\.(tsx|ts|json|webmanifest)$/.test(file)) continue;
      const raw = fs.readFileSync(file, "utf8");
      const rendered = stripForEnglishRender(raw);
      const found = hits(rendered);
      if (found.length) fileHits.push(`${path.relative(ROOT, file)} [${found.join(", ")}]`);
      const keyRe = /\bt\(\s*["']([^"']+)["']/g;
      let keyMatch: RegExpExecArray | null;
      while ((keyMatch = keyRe.exec(raw))) usedKeys.add(keyMatch[1]);
    }
  }
  assert.deepEqual(fileHits, []);

  const keyHits: string[] = [];
  for (const key of Array.from(usedKeys)) {
    const value = translate("en", key);
    const found = hits(value);
    if (found.length) keyHits.push(`${key} => ${value} [${found.join(", ")}]`);
  }
  assert.deepEqual(keyHits, []);

  assert.equal(translate("en", "landing.nav.security"), "Security");
  assert.equal(translate("en", "landing.nav.infra"), "Infrastructure");
  assert.equal(translate("en", "landing.homeAria"), "7FX home");
  assert.equal(translate("en", "landing.stat.terminal.d"), "Price, order and balance together");
  assert.equal(translate("en", "install.title"), "Tap to download the app");
  assert.equal(translate("en", "install.action"), "Install");
  assert.equal(translate("en", "landing.licenses.title"), "Licenses");
  assert.equal(translate("en", "landing.sponsors.title"), "Sponsors");
  assert.equal(translate("en", "landing.phone.balance"), "Portfolio balance");
  assert.equal(translate("en", "term.buy"), "Buy");
  assert.equal(translate("en", "term.sell"), "Sell");
  assert.ok(translate("tr", "landing.nav.security").includes("Güvenlik"));
  assert.equal(translate("tr", "install.action"), "Yükle");

  console.log("public-en-render tests passed");
}

main();
