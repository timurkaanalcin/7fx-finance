/**
 * Focus rings, icon names, dialog traps, 40px taps, and contrast on /trade and /izcrm.
 * Run: npx tsx tests/round73-a11y-mobile.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { contrastRatio, passesTextContrast, passesUiContrast } from "../src/lib/a11y-contrast";

const ROOT = path.resolve(__dirname, "..");

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function main() {
  assert.equal(passesTextContrast("#111111", "#ffffff"), true);
  assert.equal(passesTextContrast("#333333", "#ffffff"), true);
  assert.equal(passesTextContrast("#333333", "#faf8f3"), true);
  assert.equal(passesTextContrast("#a7b0c0", "#000000"), true);
  assert.equal(passesTextContrast("#a7b0c0", "#0a0a0a"), true);
  assert.equal(passesTextContrast("#a7b0c0", "#141414"), true);
  assert.equal(passesTextContrast("#54565c", "#faf8f3"), true);
  assert.equal(passesTextContrast("#6b5326", "#faf8f3"), true);
  assert.equal(passesTextContrast("#a3a3a3", "#ffffff"), false);
  assert.equal(passesTextContrast("#f5a524", "#faf8f3"), false);
  assert.ok(contrastRatio("#f4f7fb", "#0a0a0a") >= 3);
  assert.ok(contrastRatio("#15161a", "#ffffff") >= 3);
  assert.ok(contrastRatio("#15161a", "#faf8f3") >= 3);
  assert.equal(passesUiContrast("#15161a", "#0a0a0a"), false);
  assert.equal(passesUiContrast("#f4f7fb", "#ffffff"), false);

  const css = read("src/app/globals.css");
  assert.match(css, /\.fx-desk :focus-visible/);
  assert.match(css, /outline: 2px solid #f4f7fb/);
  assert.match(css, /box-shadow: 0 0 0 4px #15161a/);
  assert.match(css, /html\[data-fx-theme="light"\] \.fx-desk :focus-visible[\s\S]*outline-color: #15161a/);
  assert.match(css, /html\[data-fx-theme="light"\] \.fx-desk :focus-visible[\s\S]*box-shadow: 0 0 0 4px #f4f7fb/);
  assert.match(css, /\.fx-crm input:focus-visible/);
  assert.match(css, /html\[data-fx-theme="dark"\] \.fx-crm button:focus-visible[\s\S]*outline: 2px solid #f4f7fb !important/);
  assert.match(css, /\.fx-crm :is\(\.text-neutral-400, \.text-neutral-500\) \{\s*color: #333333;/);
  assert.match(css, /html\[data-fx-theme="dark"\] \.fx-crm :is\(input, textarea\)::placeholder \{\s*color: #a7b0c0 !important;/);
  assert.match(css, /html\[data-fx-theme="light"\] :is\(\.fx-desk, \.fx-lx-overlay\) \.text-desk-warn \{\s*color: #6b5326 !important;/);
  assert.match(css, /@media \(max-width: 480px\)[\s\S]*min-height: 40px !important;[\s\S]*min-width: 40px !important;/);
  assert.equal(/font-weight:\s*700/.test(css), false);
  assert.equal(/font-weight:\s*650/.test(css), false);

  const quick = read("src/components/trading/BottomPanels.tsx");
  assert.match(quick, /aria-label=\{title\}/);
  const layout = read("src/app/(admin)/izcrm/layout.tsx");
  assert.match(layout, /aria-label=\{t\("crm\.palette\.title"\)\}/);
  assert.match(layout, /aria-expanded=\{Boolean\(openGroups\[g\.id\]\)\}/);
  const chat = read("src/app/(admin)/izcrm/chat/page.tsx");
  assert.match(chat, /aria-label=\{e\}/);
  assert.match(chat, /useDialogFocus\(createOpen, \(\) => setCreateOpen\(false\), createDialogRef, "select"\)/);

  for (const rel of [
    "src/components/crm/CrmCommandPalette.tsx",
    "src/components/crm/CrmRecordTable.tsx",
    "src/components/crm/AccountPermissionsPanel.tsx",
    "src/components/chat/CannedReplies.tsx",
    "src/app/(admin)/izcrm/chat/page.tsx",
  ]) {
    assert.match(read(rel), /useDialogFocus\(/, rel);
  }
  assert.match(read("src/components/crm/CrmCommandPalette.tsx"), /useDialogFocus\(open, \(\) => setOpen\(false\), dialogRef, "input"\)/);
  assert.match(read("src/components/a11y/useDialogFocus.ts"), /e\.stopPropagation\(\)/);
  assert.match(read("src/components/a11y/useDialogFocus.ts"), /listFocusable/);

  const login = read("src/components/auth/LoginForm.tsx");
  assert.match(login, /id="fx-login-identifier"[\s\S]*?readOnly=\{loading\}/);
  assert.match(login, /id="fx-login-password"[\s\S]*?readOnly=\{loading\}/);
  const source = read("tests/source-account-optional.test.ts");
  assert.match(source, /doesNotMatch\(dict, \/Source account: required\|Kaynak hesap: zorunlu\/\)/);

  console.log("round73 a11y mobile tests passed");
}

main();
