/**
 * Every supported locale must carry the English keys, with the same
 * {placeholder} and {{placeholder}} tokens in the same order.
 * English stays the source of truth. Run: npx tsx tests/i18n-locale-parity.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { AI_T } from "../src/components/ai/ai-i18n";
import { CRM_V2_COPY } from "../src/lib/crmv2/copy";
import { ar } from "../src/lib/i18n/dictionaries/ar";
import { CRM_UI } from "../src/lib/i18n/dictionaries/crm-ui";
import { de } from "../src/lib/i18n/dictionaries/de";
import { en } from "../src/lib/i18n/dictionaries/en";
import { FEED_UI } from "../src/lib/i18n/dictionaries/feed-ui";
import { ru } from "../src/lib/i18n/dictionaries/ru";
import { STATES_UI } from "../src/lib/i18n/dictionaries/states-ui";
import { tr } from "../src/lib/i18n/dictionaries/tr";
import { TW_UI } from "../src/lib/i18n/dictionaries/tw-ui";
import { LOCALES, type Locale } from "../src/lib/i18n/locales";
import { JOB_TITLE_KEYS, JOB_TITLE_UI, jobTitleLabel } from "../src/lib/job-titles";
import { INVALID_REASONS } from "../src/lib/lead-invalid-reasons";
import {
  loginDisabledFallbackMessage,
  mustChangePasswordMessage,
  tradingDisabledMessage,
  withdrawalsDisabledMessage,
} from "../src/lib/account-perms";
import { publicBundle } from "../src/lib/public-doc-copy";

const ROOT = path.resolve(__dirname, "..");
const OTHERS = LOCALES.filter((locale) => locale !== "en");

function tokens(value: string): string {
  return (value.match(/\{+[a-zA-Z_][a-zA-Z0-9_]*\}+/g) || []).join(",");
}

function assertDict(name: string, source: Record<string, string>, other: Record<string, string>, locale: string) {
  const missing = Object.keys(source).filter((key) => other[key] == null);
  assert.deepEqual(missing, [], `${name} ${locale} is missing ${missing.length} English keys: ${missing.slice(0, 12).join(", ")}`);
  for (const key of Object.keys(source)) {
    const want = tokens(source[key]);
    const got = tokens(String(other[key]));
    assert.equal(got, want, `${name} ${locale} ${key} placeholders en=[${want}] got=[${got}]`);
  }
}

function walk(value: unknown, trail: string, out: Map<string, string>) {
  if (typeof value === "string") {
    out.set(trail, value);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => walk(item, `${trail}[${index}]`, out));
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      walk(child, trail ? `${trail}.${key}` : key, out);
    }
  }
}

function flatKeys(src: string, locale: string): string[] {
  const match = src.match(new RegExp(`\\b${locale}\\s*:\\s*\\{([^{}]*)\\}`));
  if (!match) return [];
  return Array.from(match[1].matchAll(/(?:^|[{,])\s*([A-Za-z0-9_]+)\s*:/g)).map((item) => item[1]);
}

function main() {
  const publicDicts: Record<Locale, Record<string, string>> = { en, tr, de, ru, ar };
  for (const locale of OTHERS) assertDict("dictionary", en, publicDicts[locale], locale);

  for (const table of [FEED_UI, STATES_UI, TW_UI, CRM_UI, CRM_V2_COPY]) {
    for (const locale of OTHERS) assertDict("ui", table.en, table[locale], locale);
  }

  for (const locale of OTHERS) assertDict("ai", AI_T.en, AI_T[locale], locale);

  const enBundle = new Map<string, string>();
  walk(publicBundle("en"), "", enBundle);
  for (const locale of OTHERS) {
    const other = new Map<string, string>();
    walk(publicBundle(locale), "", other);
    const missing = Array.from(enBundle.keys()).filter((key) => !other.has(key));
    assert.deepEqual(missing, [], `public copy ${locale} missing ${missing.slice(0, 8).join(", ")}`);
    for (const pair of Array.from(enBundle.entries())) {
      const key = pair[0];
      const value = pair[1];
      assert.equal(tokens(other.get(key) || ""), tokens(value), `public copy ${locale} ${key}`);
    }
  }

  for (const row of INVALID_REASONS) {
    for (const locale of LOCALES) {
      const value = row[locale];
      assert.equal(typeof value, "string", `${row.code} ${locale}`);
      assert.ok(value.trim().length > 0, `${row.code} ${locale} empty`);
    }
  }

  for (const locale of LOCALES) {
    assert.ok(JOB_TITLE_UI[locale], `job title ui ${locale}`);
    assertDict("job-title-ui", JOB_TITLE_UI.en, JOB_TITLE_UI[locale], locale);
    for (const key of JOB_TITLE_KEYS) {
      const label = jobTitleLabel(key, locale);
      assert.notEqual(label, key, `${locale} ${key}`);
      assert.ok(label.trim().length > 0);
    }
  }

  for (const locale of OTHERS) {
    assert.notEqual(tradingDisabledMessage(locale), tradingDisabledMessage("en"));
    assert.notEqual(withdrawalsDisabledMessage(locale), withdrawalsDisabledMessage("en"));
    assert.notEqual(loginDisabledFallbackMessage(locale), loginDisabledFallbackMessage("en"));
    assert.notEqual(mustChangePasswordMessage(locale), mustChangePasswordMessage("en"));
  }

  for (const rel of [
    "src/components/push/PushPromptBanner.tsx",
    "src/app/(admin)/izcrm/uyelikler/page.tsx",
    "src/app/(admin)/izcrm/evrak/page.tsx",
    "src/app/(admin)/izcrm/analytics/affiliates/page.tsx",
  ]) {
    const src = fs.readFileSync(path.join(ROOT, rel), "utf8");
    const english = flatKeys(src, "en");
    assert.ok(english.length > 3, `${rel} English map`);
    for (const locale of OTHERS) {
      const keys = flatKeys(src, locale);
      const missing = english.filter((key) => !keys.includes(key));
      assert.deepEqual(missing, [], `${rel} ${locale} missing ${missing.join(", ")}`);
    }
  }

  console.log(
    `i18n locale parity passed (${Object.keys(en).length} public keys, ${Object.keys(CRM_UI.en).length} CRM keys, ${LOCALES.join("/")})`
  );
}

main();
