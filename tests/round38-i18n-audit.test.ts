/**
 * Public English default and a complete Turkish dictionary for landing, auth, trade, and profile.
 * Run: npx tsx tests/round38-i18n-audit.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "..");

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function dict(rel: string): Map<string, string> {
  const out = new Map<string, string>();
  const re = /"((?:[^"\\]|\\.)+)":\s*(?:"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)')/g;
  const src = read(rel);
  let match: RegExpExecArray | null;
  while ((match = re.exec(src))) out.set(match[1], match[2] ?? match[3]);
  return out;
}

function main() {
  const locales = read("src/lib/i18n/locales.ts");
  assert.match(locales, /PUBLIC_DEFAULT_LOCALE: Locale = "en"/);

  const en = dict("src/lib/i18n/dictionaries/en.ts");
  const tr = dict("src/lib/i18n/dictionaries/tr.ts");
  const missing = Array.from(en.keys()).filter((key) => !tr.has(key));
  assert.deepEqual(missing, [], `Turkish dictionary is missing ${missing.length} English keys`);

  const translated = [
    "landing.nav.faq",
    "landing.live.badge",
    "landing.live.terminal",
    "landing.screen.badge",
    "landing.screen.title",
    "landing.screen.body",
    "landing.screen.caption",
    "landing.screen.poster",
    "landing.screen.reduced",
    "markets.table.symbol",
    "markets.table.bid",
    "markets.table.ask",
    "markets.table.change",
    "markets.table.caption",
    "markets.table.loading",
    "markets.table.live",
    "markets.table.unavailable",
    "term.err.priceLive",
    "term.ot.volDown",
    "term.ot.volUp",
    "term.profile.loadFail",
    "term.profile.wdEmpty",
    "term.profile.siteLang",
    "term.col.close",
    "term.loadingTerminal",
    "term.profile.loading",
    "term.ot.riskReward",
  ];
  for (const key of translated) {
    assert.notEqual(tr.get(key), en.get(key), `${key} is still the English sentence`);
  }
  assert.equal(tr.get("landing.screen.title"), "İşlem ekranı");
  assert.equal(tr.get("term.profile.wdEmpty"), "Henüz çekim talebi yok.");
  assert.equal(tr.get("markets.table.bid"), "Alış");

  const shell = read("src/components/trading/TerminalShell.tsx");
  assert.equal(shell.includes("We couldn't load the symbol list."), false);
  assert.match(shell, /t\("term\.symbolsError"\)/);

  const top = read("src/components/trading/TopBar.tsx");
  assert.match(top, /t\("common\.terminal"\)/);

  const blotter = read("src/components/trading/BottomPanels.tsx");
  for (const phrase of [">Open<", ">Current<", ">Close<", ">Price<", ">Stop Loss<", ">Take Profit<", ">Pip<", 'placeholder="SL"', 'placeholder="TP"', "} lot", "} pip", '|| "Error"']) {
    assert.equal(blotter.includes(phrase), false, `BottomPanels still has ${phrase}`);
  }
  assert.match(blotter, /t\("term\.col\.open"\)/);
  assert.match(blotter, /t\("term\.col\.close"\)/);
  assert.match(blotter, /t\("term\.ot\.stopLoss"\)/);
  assert.match(blotter, /orderTypeLabel\(o\.type, t\)/);

  const profile = read("src/app/(terminal)/profile/page.tsx");
  assert.equal(profile.includes("Account ID:"), false);
  assert.equal(profile.includes("Site language:"), false);
  assert.match(profile, /t\("term\.profile\.accountId"\)/);
  assert.match(profile, /t\("term\.profile\.siteLang"\)/);
  assert.match(profile, /t\("term\.wd\.approved"\)/);
  assert.match(profile, /min-w-0 flex-1 truncate text-sm font-medium/);

  assert.equal(read("src/components/trading/PriceAlerts.tsx").includes('aria-label="Dismiss"'), false);
  assert.equal(read("src/components/trading/TradeSkeleton.tsx").includes("Loading terminal"), false);
  assert.match(read("src/components/trading/TradeSkeleton.tsx"), /t\("term\.loadingTerminal"\)/);
  assert.equal(read("src/components/profile/ProfileSkeleton.tsx").includes("Loading account"), false);
  assert.equal(read("src/components/trading/OrderTicket.tsx").includes("Risk / Reward"), false);
  assert.match(read("src/components/trading/OrderTicket.tsx"), /t\("term\.ot\.riskReward"\)/);

  const login = read("src/components/auth/LoginForm.tsx");
  assert.match(login, /id="fx-login-identifier"[\s\S]*?readOnly=\{loading\}/);
  assert.match(login, /id="fx-login-password"[\s\S]*?readOnly=\{loading\}/);
  const cookie = read("src/lib/session-cookie.ts");
  assert.match(cookie, /return Array\.from\(domains\)/);
  assert.equal(cookie.includes("[...domains]"), false);

  console.log(`round38 i18n audit passed (${en.size} en keys, ${tr.size} tr keys, ${translated.length} Turkish sentences checked)`);
}

main();
