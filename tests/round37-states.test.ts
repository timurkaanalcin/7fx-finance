/**
 * Loading skeletons, friendly English errors, and platform 404/500.
 * Run: npx tsx tests/round37-states.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "..");

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function main() {
  const missing = read("src/app/not-found.tsx");
  assert.match(read("src/components/system/PlatformStatus.tsx"), /data-fx-status=\{code\}/);
  assert.match(missing, /code="404"/);
  assert.match(missing, /This page is not on the desk/);
  assert.match(missing, /Open terminal/);

  const fallback = read("src/components/system/ErrorFallback.tsx");
  assert.match(fallback, /code="500"/);
  assert.match(fallback, /Try again/);
  assert.match(fallback, /This screen did not load/);
  assert.equal(fallback.includes("fontWeight: 600"), false);
  assert.equal(fallback.includes("fontWeight: 700"), false);

  const shell = read("src/components/trading/TerminalShell.tsx");
  assert.match(shell, /data-fx-trade-skeleton|TradeSkeleton/);
  assert.match(shell, /WatchlistSkeleton/);
  assert.match(shell, /BlotterSkeleton/);
  assert.match(shell, /data-fx-price-error/);
  assert.match(shell, /data-fx-symbols-error/);
  assert.match(shell, /term\.err\.priceLive/);
  assert.equal(shell.includes("if (user?.impersonatedBy) return;"), false);
  assert.equal(shell.includes("Market data warning:"), false);
  assert.match(shell, /postTrade\("\/api\/positions\/close"/);

  const profile = read("src/app/(terminal)/profile/page.tsx");
  assert.match(profile, /data-fx-profile-skeleton|ProfileSkeleton/);
  assert.match(profile, /data-fx-profile-error/);
  assert.match(profile, /data-fx-wd-empty/);
  assert.match(profile, /min-w-0 flex-1 truncate text-sm font-medium/);
  assert.match(profile, /friendlyError\(data\.error, t\("term\.profile\.saveFailed"\)\)/);

  const crm = read("src/app/(admin)/izcrm/layout.tsx");
  assert.match(crm, /CrmShellSkeleton/);
  assert.equal(crm.includes("BrandLoader"), false);

  const dash = read("src/app/(admin)/izcrm/page.tsx");
  assert.match(dash, /DashSkeleton/);
  assert.match(dash, /crm\.ui\.tryAgain/);

  const traders = read("src/app/(admin)/izcrm/traders/page.tsx");
  assert.match(traders, /data-fx-traders-skeleton/);
  assert.match(traders, /crm\.ui\.tryAgain/);

  const detail = read("src/app/(admin)/izcrm/traders/[id]/page.tsx");
  assert.match(detail, /TraderSkeleton/);
  assert.match(detail, /crm\.ui\.traderMissing/);

  const friendly = read("src/components/system/friendly-error.ts");
  assert.match(friendly, /user yok/);

  const login = read("src/components/auth/LoginForm.tsx");
  assert.match(login, /id="fx-login-identifier"[\s\S]*?readOnly=\{loading\}/);
  assert.match(login, /id="fx-login-password"[\s\S]*?readOnly=\{loading\}/);
  const cookie = read("src/lib/session-cookie.ts");
  assert.match(cookie, /return Array\.from\(domains\)/);
  assert.equal(cookie.includes("[...domains]"), false);
  const top = read("src/components/trading/TopBar.tsx");
  assert.equal(top.includes("depositDisabled"), false);

  const css = read("src/app/globals.css");
  assert.match(css, /\.fx-skel/);
  assert.match(css, /\.fx-blotter-empty/);

  console.log("round37 tests passed");
}

main();
