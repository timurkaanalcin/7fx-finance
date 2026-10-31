/**
 * Trade account summary: hero equity, 0.00% margin level, mobile compact toggle.
 * Run: npx tsx tests/account-hero.test.ts
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
  assert.match(top, /fmtNum\(ml, 2\)\}%/);
  assert.doesNotMatch(top, /value: a \? fmtPct\(ml\)/);

  const strip = read("src/components/trading/AccountMetrics.tsx");
  assert.match(strip, /fx-acct__hero/);
  assert.match(strip, /fx-acct__num/);
  assert.match(strip, /fx-account-metric__value/);
  assert.match(strip, /data-fx-account-metric/);
  assert.match(strip, /fx-acct-compact/);
  assert.match(strip, /term\.acct\.show/);
  assert.match(strip, /term\.acct\.hide/);
  assert.match(strip, /localStorage/);

  const css = read("src/styles/account-hero.css");
  assert.match(css, /overflow-x:\s*clip/);
  assert.match(css, /font-weight:\s*300/);
  assert.match(css, /grid-template-columns:\s*minmax\(0, 1fr\) minmax\(0, 1fr\)/);
  assert.match(css, /html\[data-fx-theme="light"\]/);
  assert.match(css, /html\[data-fx-theme="dark"\]|\.fx-acct__hero/);
  assert.equal(/font-weight:\s*700/.test(css), false);
  assert.match(css, /@media \(min-width: 768px\)/);
  assert.match(read("src/app/(terminal)/layout.tsx"), /account-hero\.css/);

  for (const loc of ["en", "tr", "de", "ru", "ar"]) {
    const dict = read(`src/lib/i18n/dictionaries/${loc}.ts`);
    assert.match(dict, /"term\.acct\.show"/, loc);
    assert.match(dict, /"term\.acct\.hide"/, loc);
  }

  const v2 = read("src/app/crmv2/[[...section]]/page.tsx");
  assert.match(v2, /luxury\.css/);
  assert.match(v2, /crmv2\.css/);
  assert.ok(v2.indexOf("luxury.css") < v2.indexOf("crmv2.css"));
  const v3 = read("src/app/crmv3/[[...section]]/page.tsx");
  assert.match(v3, /luxury\.css/);
  assert.match(v3, /crmv3\.css/);
  assert.match(read("src/components/crmv3/crmv3.css"), /--fx-btn-h/);
  assert.match(read("src/components/crmv2/CrmV2App.tsx"), /data-theme=\{theme\}/);
  assert.match(read("src/components/crmv2/CrmV2App.tsx"), /cv-field cv-search/);
  assert.equal(read("src/components/crmv2/CrmV2App.tsx").includes("<<<<<<<"), false);

  console.log("account-hero tests passed");
}

main();
