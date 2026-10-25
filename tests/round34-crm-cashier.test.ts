/**
 * CRM home, trader detail, and cashier screens share one card and tabular figures.
 * Run: npx tsx tests/round34-crm-cashier.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "..");

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function main() {
  const dash = read("src/app/(admin)/izcrm/page.tsx");
  assert.match(dash, /className="fx-dash"/);
  assert.match(dash, /fx-dash-kpi/);
  assert.match(dash, /fx-dash-kpis/);
  assert.match(dash, /fx-dash-num/);
  assert.match(dash, /i18n\("crm\.ui\.all"\)/);
  assert.equal(dash.includes(">All<"), false);

  const leads = read("src/components/crm/LeadDashboard.tsx");
  assert.match(leads, /fx-lead-kpis/);
  assert.match(leads, /fx-dash-kpi/);
  assert.match(leads, /highDepositCut/);

  const trader = read("src/app/(admin)/izcrm/traders/[id]/page.tsx");
  assert.match(trader, /className="fx-trader text-\[#111111\]"/);
  assert.match(trader, /fx-trader-head/);
  assert.match(trader, /fx-trader-metrics/);
  assert.match(trader, /fx-trader-fields/);
  assert.match(trader, /fmtCrmMoney\(user\.balance, 2\)/);
  assert.match(trader, /fmtCrmMoney\(user\.equity, 2\)/);
  assert.match(trader, /const floating = Number\(user\.equity\) - Number\(user\.balance\)/);

  const css = read("src/app/globals.css");
  assert.match(css, /\.fx-crm \.fx-dash-v \{[\s\S]*font-weight: 400;/);
  assert.match(css, /font-variant-numeric: tabular-nums/);
  assert.match(css, /grid-template-columns: repeat\(6, minmax\(0, 1fr\)\)/);
  assert.match(css, /grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);

  const deposit = read("src/components/trading/DepositModal.tsx");
  assert.match(deposit, /fx-cashier/);
  assert.match(deposit, /fx-cashier-split/);
  assert.match(deposit, /tabular-nums/);
  assert.match(deposit, /JSON\.stringify\(\{ methodId: selected\.id, amount: amt, note: note \|\| undefined \}\)/);

  const profile = read("src/app/(terminal)/profile/page.tsx");
  assert.match(profile, /id="para-cekme"[\s\S]*fx-cashier/);
  assert.match(profile, /fx-wd-fields/);
  assert.match(profile, /onSubmit=\{onWithdraw\}/);
  assert.match(profile, /tabular-nums/);

  const login = read("src/components/auth/LoginForm.tsx");
  assert.match(login, /id="fx-login-identifier"[\s\S]*?readOnly=\{loading\}/);
  const cookie = read("src/lib/session-cookie.ts");
  assert.match(cookie, /return Array\.from\(domains\)/);
  assert.equal(cookie.includes("[...domains]"), false);

  console.log("round34 tests passed");
}

main();
