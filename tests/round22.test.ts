/**
 * Round 22: auth document titles follow fx_lang, a missing cookie does not
 * repaint this visit, calendar trader search and worker cap, activity pages.
 * Run: npx tsx tests/round22.test.ts
 */
import "./preload-dicts";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { translate } from "../src/lib/i18n/dictionaries";
import { PUBLIC_DEFAULT_LOCALE, publicLocaleFromCookie } from "../src/lib/i18n/locales";

const ROOT = path.resolve(__dirname, "..");

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function main() {
  assert.equal(PUBLIC_DEFAULT_LOCALE, "en");
  assert.equal(publicLocaleFromCookie(undefined), "en");
  assert.equal(publicLocaleFromCookie("en"), "en");
  assert.equal(translate("en", "auth.meta.loginTitle"), "Sign In · 7FX");
  assert.equal(translate("en", "auth.meta.registerTitle"), "Register · 7FX");
  assert.equal(translate("en", "auth.meta.loginDesc"), "Securely sign in to your 7FX account");
  assert.ok(translate("tr", "auth.meta.loginTitle").includes("Giriş"));
  assert.equal(translate("de", "auth.meta.registerTitle").includes("Registrieren"), true);
  assert.equal(translate("ru", "auth.meta.loginTitle").includes("Вход"), true);
  assert.equal(translate("ar", "auth.meta.registerTitle").includes("تسجيل"), true);

  const login = read("src/app/(auth)/login/page.tsx");
  const register = read("src/app/(auth)/register/page.tsx");
  assert.equal(login.includes("generateMetadata"), true);
  assert.equal(register.includes("generateMetadata"), true);
  assert.equal(login.includes("publicAuthMetadata"), true);
  assert.equal(register.includes("publicAuthMetadata"), true);
  assert.equal(login.includes('title: "Sign In · 7FX"'), false);
  assert.equal(register.includes('title: "Register · 7FX"'), false);
  assert.equal(login.includes("fx_crm_lang"), false);

  const meta = read("src/lib/i18n/public-meta.ts");
  assert.equal(meta.includes("publicLocaleFromCookie"), true);
  assert.equal(meta.includes('cookies().get("fx_lang")'), true);
  assert.equal(meta.includes("fx_crm_lang"), false);

  const layout = read("src/app/layout.tsx");
  assert.equal(layout.includes("hasLocaleCookie"), true);
  assert.equal(layout.includes("publicLocaleFromCookie"), true);
  assert.equal(layout.includes("fx_crm_lang"), false);

  const provider = read("src/lib/i18n/context.tsx");
  assert.equal(provider.includes("hasLocaleCookie === false"), true);
  assert.equal(provider.includes("writeStored(scope, stored)"), true);
  assert.equal(provider.includes("setLocaleState(ssr)"), true);
  const guard = provider.indexOf("hasLocaleCookie === false");
  const load = provider.indexOf("loadLocaleDict(next)", guard);
  assert.ok(guard > 0 && load > guard);

  const calendar = read("src/app/api/admin/calendar/route.ts");
  assert.equal(calendar.includes('lookup") === "traders"'), true);
  assert.equal(calendar.includes("traderQ"), true);
  assert.equal(calendar.includes("workersPartial"), true);
  assert.equal(calendar.includes("WORKER_LOOKUP_CAP"), true);
  assert.equal(calendar.includes("take: 200"), false);
  const page = read("src/app/(admin)/izcrm/calendar/page.tsx");
  assert.equal(page.includes("lookup=traders"), true);
  assert.equal(page.includes("pinnedTrader"), true);

  const users = read("src/app/api/admin/users/[id]/route.ts");
  assert.equal(users.includes("activityHasMore"), true);
  assert.equal(users.includes('profilePart === "activity"'), true);
  assert.equal(users.includes("take: page.take + 1"), true);
  assert.equal(users.includes("take: first.take + 1"), true);
  assert.equal(/clientActivityEvent\.findMany\([\s\S]*?take:\s*50\b/.test(users), false);
  assert.equal(users.includes("take: 100"), false);
  const trader = read("src/app/(admin)/izcrm/traders/[id]/page.tsx");
  assert.equal(trader.includes("part=activity"), true);
  assert.equal(trader.includes("activityHasMore"), true);

  console.log("round22 tests passed");
}

main();
