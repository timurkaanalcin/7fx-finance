/**
 * Register and login field helpers: validation copy, password hint, phone format.
 * Run: npx tsx tests/auth-fields.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  composePhone,
  defaultPhoneCountry,
  digitsOnly,
  emailOk,
  formatNational,
  loginErrorKey,
  passwordHintKey,
  passwordStrength,
  phoneTooShort,
  registerErrorKey,
} from "../src/lib/auth-fields";
import { en } from "../src/lib/i18n/dictionaries/en";
import { tr } from "../src/lib/i18n/dictionaries/tr";

function read(rel: string): string {
  return fs.readFileSync(new URL(`../${rel}`, import.meta.url), "utf8");
}

function main() {
  assert.equal(emailOk("a@b.co"), true);
  assert.equal(emailOk("not-an-email"), false);
  assert.equal(passwordStrength(""), "empty");
  assert.equal(passwordStrength("short"), "short");
  assert.equal(passwordStrength("password"), "ok");
  assert.equal(passwordStrength("Password1"), "strong");
  assert.equal(passwordHintKey("short"), "auth.passwordHint.short");

  assert.equal(defaultPhoneCountry("tr"), "TR");
  assert.equal(defaultPhoneCountry("en"), "US");
  assert.equal(digitsOnly("555-abc-12"), "55512");
  assert.equal(formatNational("5551234567", [3, 3, 2, 2]), "555 123 45 67");
  assert.equal(composePhone("TR", "5551234567"), "+90 555 123 45 67");
  assert.equal(composePhone("US", "2025550143"), "+1 202 555 0143");
  assert.equal(composePhone("US", ""), "");
  assert.equal(phoneTooShort("12345"), true);
  assert.equal(phoneTooShort("1234567"), false);
  assert.equal(phoneTooShort(""), false);

  assert.equal(registerErrorKey("This email is already registered"), "auth.emailTaken");
  assert.equal(registerErrorKey("Referral code zorunludur. / Referral code is required."), "auth.referralRequired");
  assert.equal(registerErrorKey("Prisma timeout"), "auth.registerFailed");
  assert.equal(loginErrorKey("Invalid credentials"), "auth.badCredentials");
  assert.equal(loginErrorKey("stack trace here"), "auth.signInError");

  for (const dict of [en, tr]) {
    for (const key of [
      "auth.passwordHint.empty",
      "auth.passwordHint.short",
      "auth.passwordHint.ok",
      "auth.passwordHint.strong",
      "auth.emailTaken",
      "auth.badCredentials",
      "auth.signInError",
      "auth.country.TR",
      "auth.phoneShort",
    ]) {
      assert.equal(typeof dict[key], "string", key);
      assert.ok(dict[key].length > 0, key);
    }
  }
  assert.match(en["auth.passwordHint.short"], /8/);
  assert.match(tr["auth.passwordHint.short"], /8/);
  assert.doesNotMatch(en["auth.badCredentials"], /\d{3,}/);

  const login = read("src/components/auth/LoginForm.tsx");
  const pwAt = login.indexOf('id="fx-login-password"');
  const idAt = login.indexOf('id="fx-login-identifier"');
  assert.ok(idAt > 0 && pwAt > idAt);
  const pwField = login.slice(pwAt, pwAt + 420);
  assert.match(pwField, /readOnly=\{loading\}/);
  assert.equal(pwField.includes("disabled={loading}"), false);
  const pwBlock = login.slice(pwAt, login.indexOf("{error &&", pwAt));
  assert.equal(pwBlock.includes("disabled={loading}"), false);
  assert.match(login, /method="post"/);
  assert.match(login, /action="\/api\/auth\/login"/);
  assert.match(login, /name="password"/);
  assert.match(login, /<PasswordToggle/);

  const bits = read("src/components/auth/AuthBits.tsx");
  assert.match(bits, /data-fx-password-toggle/);
  assert.match(bits, /data-fx-pw-strength/);
  assert.match(bits, /type="button"/);

  const form = read("src/components/auth/RegisterForm.tsx");
  assert.match(form, /fetch\("\/api\/auth\/register"/);
  assert.match(
    form,
    /email,\s*password,\s*firstName,\s*lastName,\s*phone: phone \|\| undefined,\s*jobTitle: jobTitle \|\| null,\s*referralCode: referralCode\.trim\(\)/
  );
  assert.match(form, /id="fx-reg-email"[\s\S]*?disabled=\{loading\}/);
  assert.match(form, /<PasswordToggle/);
  assert.match(form, /<PasswordMeter/);
  assert.match(form, /fx-reg-country/);
  assert.match(form, /text-base/);
  assert.equal(form.includes("text-[15px]"), false);

  const css = read("src/app/(auth)/auth-mobile.css");
  assert.match(css, /\.fx-auth-input,\s*\n\.fx-auth-page \.fx-auth-panel select\.fx-auth-input \{\s*\n\s*font-size: 16px;/);
  assert.doesNotMatch(css.slice(0, css.indexOf("@media")), /font-weight:\s*600|font-weight:\s*700/);

  console.log("auth-fields tests passed");
}

main();
