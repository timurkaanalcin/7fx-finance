/**
 * Mobile widths: 44px taps, scrolling tables, safe-area headers.
 * Run: npx tsx tests/round57-mobile.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "..");

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function main() {
  const globals = read("src/app/globals.css");
  const deskTable = globals.slice(globals.indexOf("/* Tables scroll inside the blotter"));
  assert.match(deskTable, /\.fx-desk table \{[^}]*max-width:\s*none/);
  assert.equal(/\.fx-desk table \{[^}]*max-width:\s*100%/.test(deskTable), false);
  assert.match(globals, /\.fx-crm-root \{[^}]*safe-area-inset-top/);
  assert.match(globals, /\.fx-crm-root \{[^}]*safe-area-inset-bottom/);
  assert.match(globals, /\.fx-profile > header \{[^}]*safe-area-inset-top/);
  assert.match(globals, /\.fx-profile > header \{[^}]*height:\s*auto/);
  assert.match(globals, /\.fx-crm main \.overflow-x-auto > table \{[^}]*width:\s*max-content/);
  assert.match(globals, /\.fx-lang-select \{[^}]*min-height:\s*44px/);
  assert.match(globals, /\.fx-crm header button[\s\S]{0,240}min-height:\s*44px/);
  assert.match(globals, /\.fx-desk \{[^}]*safe-area-inset-top/);

  const base = read("src/app/base.css");
  assert.match(base, /\.fx-quote-scroll \{[^}]*overflow-x:\s*auto/);
  assert.match(base, /\.fx-doc \{[^}]*safe-area-inset-top/);
  assert.match(base, /\.fx-lang-select \{[^}]*min-height:\s*44px/);
  const baseDesk = base.slice(base.indexOf("/* Tables scroll inside the blotter"));
  assert.match(baseDesk, /\.fx-desk table \{[^}]*max-width:\s*none/);

  const landing = read("src/components/landing/landing.css");
  assert.match(landing, /\.fx-landing \.fx-nav \{[^}]*safe-area-inset-top/);
  assert.match(landing, /\.fx-landing \.fx-footer a \{[^}]*min-height:\s*44px/);
  assert.match(landing, /\.fx-landing \.fx-mid-cta-title \{[^}]*font-weight:\s*300/);
  assert.match(landing, /\.fx-chip \{[^}]*min-height:\s*44px/);

  const auth = read("src/app/(auth)/auth-mobile.css");
  assert.match(auth, /\.fx-auth-page \{[^}]*overflow-x:\s*clip/);
  assert.match(auth, /\.fx-auth-page \{[^}]*safe-area-inset-left/);
  assert.match(auth, /\.fx-auth-reveal \{[^}]*min-height:\s*44px/);

  for (const rel of [
    "src/app/(terminal)/assistant/page.tsx",
    "src/app/(terminal)/membership/page.tsx",
    "src/app/(terminal)/documents/page.tsx",
  ]) {
    const src = read(rel);
    assert.match(src, /minHeight: "calc\(3rem \+ env\(safe-area-inset-top\)\)"/, rel);
    assert.equal(src.includes(" h-12 "), false, rel);
  }

  assert.match(read("src/components/theme/ThemeToggle.tsx"), /min-h-11 min-w-11/);
  assert.match(read("src/components/i18n/LanguageSwitcher.tsx"), /font-medium/);
  assert.equal(read("src/components/i18n/LanguageSwitcher.tsx").includes("font-semibold"), false);

  const login = read("src/components/auth/LoginForm.tsx");
  assert.match(login, /id="fx-login-identifier"[\s\S]*?readOnly=\{loading\}/);
  assert.match(login, /id="fx-login-password"[\s\S]*?readOnly=\{loading\}/);
  const cookie = read("src/lib/session-cookie.ts");
  assert.match(cookie, /return Array\.from\(domains\)/);
  assert.equal(cookie.includes("[...domains]"), false);

  const pkg = JSON.parse(read("package.json"));
  assert.equal(pkg.dependencies.next, "14.2.35");
  assert.equal(pkg.dependencies.prisma, "5.22.0");

  console.log("round57 mobile tests passed");
}

main();
