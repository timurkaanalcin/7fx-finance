/**
 * First-run checklist dismissal is a local flag, and the new hints
 * only point at profile, deposit, and markets.
 * Run: npx tsx tests/round71-onboarding.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { TRADE_CHECKLIST_KEY, checklistDismissed } from "../src/lib/trade-checklist";

const ROOT = path.resolve(__dirname, "..");

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function main() {
  assert.equal(TRADE_CHECKLIST_KEY, "fx-trade-checklist-dismissed");
  assert.equal(checklistDismissed(null), false);
  assert.equal(checklistDismissed(undefined), false);
  assert.equal(checklistDismissed(""), false);
  assert.equal(checklistDismissed("0"), false);
  assert.equal(checklistDismissed("true"), false);
  assert.equal(checklistDismissed("1"), true);

  const checklist = read("src/components/trading/TradeChecklist.tsx");
  assert.match(checklist, /data-fx-checklist=""/);
  assert.match(checklist, /data-fx-checklist-dismiss=""/);
  assert.match(checklist, /data-fx-checklist-profile=""/);
  assert.match(checklist, /data-fx-checklist-deposit=""/);
  assert.match(checklist, /data-fx-checklist-ticket=""/);
  assert.match(checklist, /localStorage\.setItem\(TRADE_CHECKLIST_KEY, "1"\)/);
  assert.match(checklist, /href="\/profile"/);
  assert.equal(checklist.includes("font-semibold"), false);
  assert.equal(checklist.includes("font-bold"), false);
  assert.equal(checklist.includes("/api/"), false);
  assert.equal(checklist.includes("fetch("), false);

  const shell = read("src/components/trading/TerminalShell.tsx");
  assert.match(shell, /<TradeChecklist/);
  assert.match(shell, /onPreviewTicket=\{\(\) => openOrder\("BUY"\)\}/);
  assert.match(shell, /onBrowseMarkets=\{browseMarkets\}/);
  assert.match(shell, /function browseMarkets\(\)/);
  assert.equal(shell.includes("browseMarkets();"), false);

  const blotter = read("src/components/trading/BottomPanels.tsx");
  assert.match(blotter, /data-fx-empty-markets=""/);
  assert.match(blotter, /term\.onboard\.marketsHint/);
  assert.match(blotter, /term\.emptyOpen/);

  const profile = read("src/app/(terminal)/profile/page.tsx");
  assert.match(profile, /data-fx-wallet-empty=""/);
  assert.match(profile, /data-fx-wd-deposit-hint=""/);
  assert.match(profile, /term\.onboard\.walletHint/);
  assert.match(profile, /data-fx-wd-empty=""/);
  assert.match(profile, /className="ml-auto rounded-md bg-\[#2a2a2a\] px-2\.5 py-1\.5 text-xs hover:bg-\[#1f1f1f\]"/);

  const keys = [
    "term.onboard.title",
    "term.onboard.lead",
    "term.onboard.profile",
    "term.onboard.deposit",
    "term.onboard.ticket",
    "term.onboard.dismiss",
    "term.onboard.marketsHint",
    "term.onboard.walletHint",
  ];
  for (const loc of ["en", "tr", "de", "ru", "ar"]) {
    const src = read(`src/lib/i18n/dictionaries/${loc}.ts`);
    for (const key of keys) assert.match(src, new RegExp(`"${key}":`));
  }
  const en = read("src/lib/i18n/dictionaries/en.ts");
  assert.match(en, /"term\.onboard\.title": "First steps"/);
  assert.match(en, /"term\.onboard\.deposit": "Make a deposit"/);
  assert.match(en, /"term\.onboard\.ticket": "Look at the order ticket"/);
  assert.match(en, /"term\.onboard\.marketsHint": "Browse markets"/);
  assert.match(read("src/lib/i18n/dictionaries/tr.ts"), /"term\.onboard\.deposit": "Yatırma yap"/);
  assert.match(read("src/lib/i18n/dictionaries/de.ts"), /"term\.onboard\.deposit": "Eine Einzahlung machen"/);
  assert.match(read("src/lib/i18n/dictionaries/ru.ts"), /"term\.onboard\.deposit": "Сделать депозит"/);
  assert.match(read("src/lib/i18n/dictionaries/ar.ts"), /"term\.onboard\.deposit": "قم بإيداع"/);

  const login = read("src/components/auth/LoginForm.tsx");
  assert.match(login, /id="fx-login-identifier"[\s\S]*?readOnly=\{loading\}/);
  assert.match(login, /id="fx-login-password"[\s\S]*?readOnly=\{loading\}/);
  const source = read("tests/source-account-optional.test.ts");
  assert.match(source, /Kaynak hesap/);
  assert.match(source, /doesNotMatch\(dict, \/Source account: required\|Kaynak hesap: zorunlu\/\)/);

  console.log("round71 tests passed");
}

main();
