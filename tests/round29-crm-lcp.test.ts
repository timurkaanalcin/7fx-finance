/**
 * CRM phone/wide layout and public CSS split.
 * Run: npx tsx tests/round29-crm-lcp.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "..");

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function main() {
  const root = read("src/app/layout.tsx");
  assert.equal(root.includes("mobile-luxe.css"), false);
  assert.equal(root.includes("globals.css"), false);

  const terminal = read("src/app/(terminal)/layout.tsx");
  assert.match(terminal, /mobile-luxe\.css/);
  assert.match(terminal, /globals\.css/);

  const admin = read("src/app/(admin)/izcrm/layout.tsx");
  assert.match(admin, /globals\.css/);

  const pub = read("src/app/(public)/layout.tsx");
  assert.match(pub, /base\.css/);
  assert.match(pub, /DeferredSheets/);
  assert.match(pub, /landing/);
  const publicCss = read("src/app/public.css");
  assert.match(publicCss, /@config/);
  assert.match(publicCss, /tailwind\.public\.config/);
  assert.match(publicCss, /fx-public-utilities-marker/);
  const home = read("src/app/(public)/page.tsx");
  assert.equal(home.includes("landing.css"), false);
  const entry = read("src/app/fx-css/page.tsx");
  assert.match(entry, /public\.css/);
  assert.equal(entry.includes("landing.css"), false);
  const landingEntry = read("src/app/fx-landing-css/page.tsx");
  assert.match(landingEntry, /landing\.css/);

  const authLayout = read("src/app/(auth)/layout.tsx");
  assert.match(authLayout, /auth-mobile\.css/);
  assert.match(authLayout, /base\.css/);
  assert.match(authLayout, /DeferredSheets/);
  const authCss = read("src/app/(auth)/auth-mobile.css");
  assert.match(authCss, /min-height:\s*50px/);
  assert.match(authCss, /font-size:\s*16px/);
  assert.match(authCss, /safe-area-inset-top/);

  const pkg = read("package.json");
  assert.equal(pkg.includes("critters"), false);

  const crm = read("src/app/(admin)/izcrm/layout.tsx");
  assert.match(crm, /fx-crm-mobile-nav/);
  assert.match(crm, /fx-crm-actions/);

  const css = read("src/app/globals.css");
  assert.match(css, /\.fx-crm-mobile-nav[\s\S]*max-width:\s*100%/);
  assert.match(css, /\.fx-crm main \.overflow-x-auto > table[\s\S]*width:\s*max-content/);
  assert.match(css, /grid-template-columns:\s*1fr;/);
  assert.match(css, /min-height:\s*44px/);
  assert.match(css, /max-width:\s*760px/);

  const login = read("src/components/auth/LoginForm.tsx");
  assert.match(login, /id="fx-login-identifier"[\s\S]*?readOnly=\{loading\}/);
  assert.match(login, /id="fx-login-password"[\s\S]*?readOnly=\{loading\}/);
  assert.equal(/id="fx-login-(identifier|password)"[\s\S]{0,240}disabled=\{loading\}/.test(login), false);

  const cookie = read("src/lib/session-cookie.ts");
  assert.match(cookie, /return Array\.from\(domains\)/);
  assert.equal(cookie.includes("[...domains]"), false);

  console.log("round29 crm/lcp tests passed");
}

main();
