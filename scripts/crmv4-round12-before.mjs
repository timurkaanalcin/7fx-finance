/** Signed-in before shots of the customer profile. */
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
await page.goto(`${base}/crmv4/customers`, { waitUntil: "domcontentloaded" });
await page.waitForSelector("a[href*='/crmv4/customers/']", { timeout: 30000 });
const href = await page.locator("a[href*='/crmv4/customers/']").first().getAttribute("href");
await page.goto(`${base}${href}`, { waitUntil: "domcontentloaded" });
await page.waitForSelector(".c4-strip", { timeout: 30000 });
await page.waitForTimeout(500);
await page.screenshot({ path: path.join(out, "crmv4-r12-before-profile.png") });
console.log("saved desktop", href);
await page.setViewportSize({ width: 375, height: 812 });
await page.waitForTimeout(300);
await page.screenshot({ path: path.join(out, "crmv4-r12-before-phone.png") });
console.log("saved phone");
await browser.close();
