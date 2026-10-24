/**
 * Account metric strip: full figures, lighter labels, login stays readOnly.
 * Run: npx tsx tests/round28-metrics.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "..");

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function main() {
  const top = read("src/components/trading/TopBar.tsx");
  assert.match(top, /data-fx-account-metrics|AccountMetricStrip/);
  assert.equal(top.includes("text-[8px]"), false);
  assert.equal(top.includes("min-w-[64px]"), false);
  assert.equal(top.includes("hidden md:flex"), false);
  assert.match(top, /term\.top\.free/);
  assert.match(top, /term\.margin\.level/);

  const strip = read("src/components/trading/AccountMetrics.tsx");
  assert.match(strip, /fx-account-metric__value/);
  assert.match(strip, /data-fx-account-metric/);

  const css = read("src/app/globals.css");
  assert.match(css, /\.fx-account-metric__value[\s\S]*font-weight:\s*500/);
  assert.match(css, /\.fx-account-metric__label[\s\S]*font-weight:\s*400/);
  assert.match(css, /\.fx-account-metric__value[\s\S]*text-align:\s*right/);
  assert.match(css, /\.fx-account-metric__value[\s\S]*tabular-nums/);
  assert.match(css, /grid-template-columns:\s*1fr 1fr/);
  assert.match(css, /width:\s*max-content/);

  const profile = read("src/app/(terminal)/profile/page.tsx");
  assert.match(profile, /AccountMetricStrip/);
  assert.match(profile, /metricsFromStoredAccount/);
  const api = read("src/app/api/profile/route.ts");
  assert.match(api, /freeMargin: m\.freeMargin/);
  assert.match(api, /margin: m\.margin/);

  const metrics = read("src/lib/trade-metrics.ts");
  assert.match(metrics, /const profitLoss = equity - balance/);
  assert.match(metrics, /const marginLevel = margin > 0 \? \(equity \/ margin\) \* 100 : 0/);

  const login = read("src/components/auth/LoginForm.tsx");
  const idAt = login.indexOf('id="fx-login-identifier"');
  const pwAt = login.indexOf('id="fx-login-password"');
  const idBlock = login.slice(idAt, pwAt);
  const pwBlock = login.slice(pwAt, login.indexOf("{error &&", pwAt));
  assert.match(idBlock, /readOnly=\{loading\}/);
  assert.match(pwBlock, /readOnly=\{loading\}/);
  assert.equal(idBlock.includes("disabled={loading}"), false);
  assert.equal(pwBlock.includes("disabled={loading}"), false);

  assert.equal(read("src/lib/i18n/dictionaries/en.ts").includes('"term.top.free": "Free margin"'), true);

  console.log("round28 metrics tests passed");
}

main();
