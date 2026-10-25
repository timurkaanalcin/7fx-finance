/**
 * Register and platform share the landing terminal still.
 * Run: npx tsx tests/round33-register-platform.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "..");

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function main() {
  const shell = read("src/components/auth/AuthShell.tsx");
  assert.match(shell, /isLogin \? "w-full max-w-\[440px\]" : "fx-auth-register w-full"/);
  assert.match(shell, /!isLogin \? <TerminalWindow \/> : null/);
  assert.equal(shell.includes("fetchpriority"), false);

  const login = read("src/app/(auth)/login/page.tsx");
  assert.equal(login.includes("TerminalWindow"), false);
  assert.match(login, /publicAuthMetadata/);
  const loginForm = read("src/components/auth/LoginForm.tsx");
  assert.match(loginForm, /id="fx-login-identifier"[\s\S]*?readOnly=\{loading\}/);
  assert.match(loginForm, /id="fx-login-password"[\s\S]*?readOnly=\{loading\}/);

  const register = read("src/app/(auth)/register/page.tsx");
  assert.match(register, /publicAuthMetadata\("auth\.meta\.registerTitle"/);
  assert.equal(register.includes("localizeMarketingMeta"), false);
  const form = read("src/components/auth/RegisterForm.tsx");
  assert.match(form, /fetch\("\/api\/auth\/register"/);
  assert.match(form, /email,\s*password,\s*firstName,\s*lastName,\s*phone: phone \|\| undefined,\s*jobTitle: jobTitle \|\| null,\s*referralCode: referralCode\.trim\(\)/);
  assert.match(form, /id="fx-reg-email"[\s\S]*?disabled=\{loading\}/);
  assert.match(form, /className="text-xl font-normal/);
  assert.match(form, /fx-auth-step/);

  const platform = read("src/app/(public)/platform/page.tsx");
  assert.match(platform, /marketingMetadata/);
  assert.match(platform, /rootClass="fx-platform"/);
  assert.match(platform, /<TerminalWindow \/>/);
  assert.equal(platform.includes("localizeMarketingMeta"), false);
  assert.match(platform, /page\.moneyBody/);

  const window = read("src/components/public/TerminalWindow.tsx");
  assert.match(window, /terminal-desktop\.webp/);
  assert.match(window, /width=\{640\}/);
  assert.match(window, /height=\{400\}/);
  assert.match(window, /loading="lazy"/);
  assert.equal(window.includes("fetchpriority"), false);
  assert.equal(window.includes("terminal-demo"), false);

  const css = read("src/app/base.css");
  assert.match(css, /\.fx-terminal-window[\s\S]*aspect-ratio:\s*16\s*\/\s*9/);
  assert.match(css, /\.fx-platform h1,\s*\n\.fx-platform h2 \{\s*\n\s*font-weight: 400;/);
  assert.match(css, /\.fx-auth-register h1/);
  assert.match(css, /grid-template-columns: minmax\(0, 440px\) minmax\(0, 1fr\)/);
  assert.equal(/font-weight:\s*700/.test(css.slice(css.indexOf(".fx-auth-wide"))), false);

  const copy = read("src/lib/public-doc-copy.ts");
  assert.match(
    copy,
    /Deposit and withdrawal requests are submitted from the signed-in account/
  );
  const en = read("src/lib/i18n/dictionaries/en.ts");
  assert.match(en, /"auth\.meta\.registerTitle": "Register · 7FX"/);
  assert.match(en, /"landing\.demo\.desktop": "Desktop terminal"/);

  const cookie = read("src/lib/session-cookie.ts");
  assert.match(cookie, /return Array\.from\(domains\)/);
  assert.equal(cookie.includes("[...domains]"), false);

  console.log("round33 tests passed");
}

main();
