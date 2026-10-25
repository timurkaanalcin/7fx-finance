/**
 * Empty lists, failed fetches, and 404/500 stay in the thin desk voice.
 * Run: npx tsx tests/round56-states.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "..");

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function main() {
  const status = read("src/components/system/PlatformStatus.tsx");
  assert.match(status, /fontWeight: 400/);
  assert.match(status, /fontWeight: 500/);
  assert.equal(status.includes("fontWeight: 600"), false);
  assert.equal(status.includes("fontWeight: 700"), false);
  assert.match(read("src/components/system/NotFoundStatus.tsx"), /code="404"/);
  assert.match(read("src/components/system/ErrorFallback.tsx"), /code="500"/);
  assert.match(read("src/components/system/ErrorFallback.tsx"), /gap\.err\.retry/);
  assert.match(read("src/lib/i18n/dictionaries/en.ts"), /"gap\.err\.retry": "Try again"/);

  for (const rel of [
    "src/app/(public)/loading.tsx",
    "src/app/(auth)/loading.tsx",
    "src/app/(terminal)/loading.tsx",
    "src/app/(admin)/izcrm/loading.tsx",
  ]) {
    assert.match(read(rel), /RouteSkeleton/);
  }
  assert.match(read("src/components/system/RouteSkeleton.tsx"), /data-fx-route-skeleton/);
  assert.match(read("src/components/system/RouteSkeleton.tsx"), /prefers-reduced-motion/);

  const states = read("src/lib/i18n/dictionaries/states-ui.ts");
  for (const key of ["state.retry", "state.loadFailed", "state.docsFailed", "state.supportFailed", "state.membershipEmpty"]) {
    assert.match(states, new RegExp(`"${key}"`));
  }
  assert.match(read("src/lib/i18n/dictionaries/index.ts"), /STATES_UI/);
  assert.match(read("src/lib/i18n/dictionaries/crm-ui.ts"), /crm\.lic\.empty/);
  assert.match(read("src/lib/i18n/dictionaries/crm-ui.ts"), /crm\.spon\.empty/);

  const docs = read("src/app/(terminal)/documents/page.tsx");
  assert.match(docs, /data-fx-desk-error|DeskRetry/);
  assert.match(docs, /state\.docsFailed/);
  assert.match(docs, /take: "50"/);
  assert.match(read("src/app/(terminal)/membership/page.tsx"), /state\.membershipFailed/);
  assert.match(read("src/app/(terminal)/membership/page.tsx"), /AI_T\.en/);
  assert.match(read("src/app/(terminal)/assistant/page.tsx"), /state\.assistantFailed/);
  assert.match(read("src/components/profile/LiveSupportPanel.tsx"), /data-fx-support-error/);
  assert.match(read("src/components/profile/LiveSupportPanel.tsx"), /profile\.support\.empty/);
  assert.match(read("src/components/public/MarketsLiveTable.tsx"), /data-fx-markets-retry/);

  const hook = read("src/components/crm/use-money-queue.ts");
  assert.match(hook, /setFailed\(true\)/);
  assert.equal(hook.includes('method: "POST"'), false);
  for (const rel of ["src/app/(admin)/izcrm/deposits/page.tsx", "src/app/(admin)/izcrm/withdrawals/page.tsx"]) {
    const src = read(rel);
    assert.match(src, /data-fx-list-error|ListPlaceholder/);
    assert.match(src, /JSON\.stringify\(\{ id, action \}\)/);
    assert.match(src, /crm\.ui\.noRecords/);
  }

  for (const rel of [
    "src/app/(admin)/izcrm/tickets/page.tsx",
    "src/app/(admin)/izcrm/balance-requests/page.tsx",
    "src/app/(admin)/izcrm/transactions/page.tsx",
    "src/app/(admin)/izcrm/trading-groups/page.tsx",
    "src/app/(admin)/izcrm/methods/page.tsx",
    "src/app/(admin)/izcrm/mail/page.tsx",
    "src/app/(admin)/izcrm/assets/page.tsx",
    "src/app/(admin)/izcrm/positions/page.tsx",
    "src/app/(admin)/izcrm/workers/page.tsx",
    "src/app/(admin)/izcrm/analytics/finance/page.tsx",
    "src/app/(admin)/izcrm/analytics/scoreboard/page.tsx",
    "src/app/(admin)/izcrm/analytics/report/page.tsx",
    "src/app/(admin)/izcrm/summary/page.tsx",
    "src/app/(admin)/izcrm/licenses/page.tsx",
    "src/app/(admin)/izcrm/sponsors/page.tsx",
  ]) {
    assert.match(read(rel), /ListPlaceholder/, rel);
  }
  assert.equal(read("src/app/(admin)/izcrm/licenses/page.tsx").includes("Henüz lisans yok"), false);
  assert.equal(read("src/app/(admin)/izcrm/sponsors/page.tsx").includes("Henüz sponsor yok"), false);

  const pkg = JSON.parse(read("package.json"));
  assert.equal(pkg.dependencies.next, "14.2.35");
  assert.equal(pkg.dependencies.prisma, "5.22.0");

  const login = read("src/components/auth/LoginForm.tsx");
  assert.match(login, /id="fx-login-identifier"[\s\S]*?readOnly=\{loading\}/);
  assert.match(login, /id="fx-login-password"[\s\S]*?readOnly=\{loading\}/);
  const cookie = read("src/lib/session-cookie.ts");
  assert.match(cookie, /return Array\.from\(domains\)/);
  assert.equal(cookie.includes("[...domains]"), false);

  console.log("round56 states tests passed");
}

main();
