/** Before shots: withdrawal queue and the current command palette. */
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

async function shot(name) {
  await page.screenshot({ path: path.join(out, `${name}.png`) });
  console.log("saved", name);
}

await page.goto(`${base}/crmv4/finance?tab=withdrawals`, { waitUntil: "domcontentloaded" });
await page.waitForSelector("h1.c4-page-title, h2", { timeout: 30000 });
await page.waitForTimeout(500);
await shot("crmv4-r28-before-withdrawals");
await page.keyboard.press("Control+k");
await page.waitForTimeout(300);
await shot("crmv4-r28-before-palette");
await page.setViewportSize({ width: 375, height: 812 });
await page.goto(`${base}/crmv4/finance?tab=withdrawals`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(400);
await shot("crmv4-r28-before-withdrawals-phone");
await browser.close();
