/**
 * CRM English default and complete Turkish for traders, chat, deposits, withdrawals, and settings.
 * Run: npx tsx tests/round39-crm-i18n.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "..");

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function crmRow(key: string): string[] | undefined {
  const src = read("src/lib/i18n/dictionaries/crm-ui.ts");
  const re = new RegExp(`\\["${key.replace(/\./g, "\\.")}",\\s*"((?:[^"\\\\]|\\\\.)*)",\\s*"((?:[^"\\\\]|\\\\.)*)"`);
  const match = src.match(re);
  return match ? [match[1], match[2]] : undefined;
}

function main() {
  const locales = read("src/lib/i18n/locales.ts");
  assert.match(locales, /CRM_DEFAULT_LOCALE: Locale = "en"/);
  assert.match(locales, /PUBLIC_DEFAULT_LOCALE: Locale = "en"/);

  const keys = [
    "crm.ui.csvDownload",
    "crm.ui.copyAccountId",
    "crm.ui.staffRole",
    "crm.ui.screenshotTitle",
    "crm.ui.screenshotBody",
    "crm.chat.greetingBody",
    "crm.set.totpTitle",
    "crm.set.totpBody",
    "crm.set.totpStatus",
    "crm.set.totpEnabled",
    "crm.set.totpDisabled",
    "crm.set.totpStart",
    "crm.set.totpSetupFail",
    "crm.set.totpQr",
    "crm.set.totpSecret",
    "crm.set.totpCodePh",
    "crm.set.totpInvalid",
    "crm.set.totpConfirm",
    "crm.set.totpOn",
    "crm.set.totpDisablePh",
    "crm.set.totpDisable",
    "crm.set.totpOff",
    "crm.set.totpFail",
  ];
  for (const key of keys) {
    const row = crmRow(key);
    assert.ok(row, `missing ${key}`);
    assert.notEqual(row[0], row[1], `${key} Turkish still matches English`);
  }
  assert.equal(crmRow("crm.set.totpTitle")?.[1], "İki adımlı doğrulama (TOTP)");
  assert.match(crmRow("crm.chat.greetingBody")?.[1] || "", /Canlı Destek/);

  const automatic = crmRow("crm.chat.automatic");
  if (automatic) {
    assert.notEqual(automatic[0], automatic[1], "crm.chat.automatic Turkish still matches English");
  }

  const traders = read("src/app/(admin)/izcrm/traders/page.tsx");
  assert.match(traders, /className="fx-crm-table /);
  assert.match(traders, /i18n\("crm\.ui\.csvDownload"\)/);
  assert.match(traders, /i18n\("crm\.ui\.copyAccountId"\)/);
  assert.match(traders, /fetch\("\/api\/auth\/me(?:\?scope=admin)?", \{ credentials: "include" \}\)/);
  assert.match(traders, /\{i18n\("crm\.ui\.detail"\)\}/);
  assert.match(traders, /colSpan=\{13\}/);

  const detail = read("src/app/(admin)/izcrm/traders/[id]/page.tsx");
  assert.match(detail, /i18n\("crm\.ui\.staffRole"\)/);
  assert.match(detail, /i18n\("crm\.ui\.screenshotTitle"\)/);
  assert.match(detail, /JSON\.stringify\(\{\s*userId\b/);
  assert.match(
    detail,
    /session \? fetch\("\/api\/auth\/me(?:\?scope=admin)?", \{ credentials: "include" \}\) : Promise\.resolve\(null\)/
  );

  const chat = read("src/app/(admin)/izcrm/chat/page.tsx");
  assert.match(chat, /m\.workerName \|\| "7FX Support"/);
  assert.equal(chat.includes("GREETING_7FX"), false);
  assert.equal((chat.match(/i18n\("crm\.chat\.greetingBody"\)/g) || []).length, 2);

  const settings = read("src/app/(admin)/izcrm/settings/page.tsx");
  assert.match(settings, /i18n\("crm\.set\.totpTitle"\)/);
  assert.match(settings, /fetch\("\/api\/admin\/2fa\/confirm"/);
  assert.match(settings, /JSON\.stringify\(\{ code: totpCode \}\)/);
  assert.equal(settings.includes("Two-factor authentication"), false);
  assert.equal(settings.includes("Start setup"), false);
  assert.match(read("src/lib/i18n/crm-labels.tsx"), /const i18n = useCallback\(/);
  assert.match(settings, /\}, \[i18n\]\);/);

  for (const rel of ["src/app/(admin)/izcrm/deposits/page.tsx", "src/app/(admin)/izcrm/withdrawals/page.tsx"]) {
    const src = read(rel);
    assert.match(src, /className="fx-crm-table /);
    assert.match(src, /className="fx-crm-num /);
    assert.match(src, /LOCALE_META\[locale\]\.htmlLang/);
    assert.equal(src.includes('toLocaleTimeString("tr-TR")'), false);
    assert.match(src, /JSON\.stringify\(\{ id, action \}\)/);
  }

  const css = read("src/app/globals.css");
  const tableCss = css.slice(css.indexOf(".fx-crm .fx-crm-table {"), css.indexOf(".fx-crm .crm-pl-pos"));
  assert.match(tableCss, /font-weight: 400/);
  assert.match(tableCss, /font-weight: 500/);
  assert.match(tableCss, /font-variant-numeric: tabular-nums/);
  assert.match(tableCss, /min-width: 1440px/);
  assert.match(tableCss, /min-width: 1920px/);
  assert.equal(/font-weight:\s*600|font-weight:\s*700/.test(tableCss), false);

  const login = read("src/components/auth/LoginForm.tsx");
  for (const id of ["fx-login-identifier", "fx-login-password"]) {
    const at = login.indexOf(`id="${id}"`);
    assert.ok(at > 0, id);
    const field = login.slice(at, at + 420);
    assert.match(field, /readOnly=\{loading\}/);
    assert.equal(field.includes("disabled={loading}"), false, id);
  }
  const cookie = read("src/lib/session-cookie.ts");
  assert.match(cookie, /return Array\.from\(domains\)/);
  assert.equal(cookie.includes("[...domains]"), false);

  console.log(`round39 ok: ${keys.length} CRM keys, English default, tables 1440/1920`);
}

main();
