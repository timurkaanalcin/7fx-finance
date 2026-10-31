/** Signed-in before shots: home, footer, and shortcut help. */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const out = "/opt/cursor/artifacts/screenshots";
fs.mkdirSync(out, { recursive: true });
const base = "http://127.0.0.1:3000";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const login = await page.request.post(`${base}/api/auth/login`, {
  form: { email: "admin@7fx.local", password: "Admin123!", nav: "1" },
  maxRedirects: 0,
});
if (login.status() >= 400) throw new Error(await login.text());
await page.addInitScript(() => window.localStorage.setItem("crmv4-tour-done", "1"));

async function shot(name, width, height, scroll) {
  await page.setViewportSize({ width, height });
  await page.goto(`${base}/crmv4`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("h1.c4-page-title, .c4-strip, .c4-foot", { timeout: 30000 });
  await page.waitForTimeout(600);
  if (scroll) await page.locator(".c4-foot").scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(out, `${name}.png`) });
  console.log("saved", name);
}

await shot("crmv4-r18-before-home", 1440, 900, false);
await shot("crmv4-r18-before-foot", 1440, 900, true);
await page.keyboard.press("?");
await page.waitForTimeout(300);
await page.screenshot({ path: path.join(out, "crmv4-r18-before-help.png") });
console.log("saved help");
await shot("crmv4-r18-before-home-phone", 375, 812, false);
await browser.close();
