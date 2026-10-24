/**
 * Round 27: phone desk gate, login readOnly, ticker image count, Inter latin preload.
 * Run: npx tsx tests/round27-sizing.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "..");

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function main() {
  const login = read("src/components/auth/LoginForm.tsx");
  const idAt = login.indexOf('id="fx-login-identifier"');
  const pwAt = login.indexOf('id="fx-login-password"');
  assert.ok(idAt > 0 && pwAt > idAt);
  const idBlock = login.slice(idAt, pwAt);
  const pwBlock = login.slice(pwAt, login.indexOf("{error &&", pwAt));
  assert.match(idBlock, /readOnly=\{loading\}/);
  assert.match(pwBlock, /readOnly=\{loading\}/);
  assert.equal(idBlock.includes("disabled={loading}"), false);
  assert.equal(pwBlock.includes("disabled={loading}"), false);

  const shell = read("src/components/trading/TerminalShell.tsx");
  assert.match(shell, /min-width: 768px\) and \(min-height: 560px\)/);
  assert.match(shell, /decoding="async"/);
  assert.match(shell, /min-h-\[44vh\] w-full/);

  const css = read("src/app/globals.css");
  assert.match(css, /\.fx-chart-chrome[\s\S]*position:\s*relative !important/);
  assert.match(css, /--ticker-shift/);

  const ticker = read("src/components/trading/FooterTicker.tsx");
  assert.equal(ticker.includes("[...symbols, ...symbols]"), false);
  assert.match(ticker, /symbols\.slice\(0,\s*16\)/);

  const fonts = read("src/lib/fonts.ts");
  assert.equal(fonts.includes("Sora"), false);
  assert.match(fonts, /variable:\s*"--font-inter"/);
  assert.match(fonts.slice(fonts.indexOf('subsets: ["latin"]'), fonts.indexOf('subsets: ["latin-ext"]')), /preload:\s*true/);
  assert.match(fonts, /variable:\s*"--font-inter-ext"/);
  assert.match(fonts.slice(fonts.indexOf("--font-inter-ext")), /preload:\s*false/);

  console.log("round27 sizing tests passed");
}

main();
