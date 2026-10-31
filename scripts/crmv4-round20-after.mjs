/** After shots: More menu, settings data, and an empty list. */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const out = "/opt/cursor/artifacts/screenshots";
fs.mkdirSync(out, { recursive: true });
const base = "http://127.0.0.1:3000";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
const errors = [];
page.on("pageerror", (err) => errors.push(String(err)));
const login = await page.request.post(`${base}/api/auth/login`, {
  form: { email: "admin@7fx.local", password: "Admin123!", nav: "1" },
  maxRedirects: 0,
});
if (login.status() >= 400) throw new Error(await login.text());
await page.addInitScript(() => window.localStorage.setItem("crmv4-tour-done", "1"));

async function theme(mode) {
  await page.evaluate((value) => {
    window.localStorage.setItem("crmv4-theme-mode", value);
    window.dispatchEvent(new CustomEvent("crmv4:theme-mode", { detail: value }));
  }, mode);
}

await page.goto(`${base}/crmv4`, { waitUntil: "domcontentloaded" });
await theme("light");
await page.getByRole("button", { name: "More" }).click();
await page.waitForSelector(".c4-more-luxe");
await page.waitForTimeout(250);
const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
await page.screenshot({ path: path.join(out, "crmv4-r20-after-more.png") });
await theme("dark");
await page.waitForTimeout(200);
await page.screenshot({ path: path.join(out, "crmv4-r20-after-more-dark.png") });
await page.setViewportSize({ width: 1440, height: 900 });
await page.goto(`${base}/crmv4/settings`, { waitUntil: "domcontentloaded" });
await theme("light");
await page.waitForSelector(".c4-local-luxe");
await page.locator(".c4-local-luxe").scrollIntoViewIfNeeded();
await page.waitForTimeout(300);
await page.screenshot({ path: path.join(out, "crmv4-r20-after-settings.png") });
await page.goto(`${base}/crmv4/customers?q=zzzz-no-such-customer`, { waitUntil: "domcontentloaded" });
await page.waitForSelector(".c4-empty-luxe", { timeout: 30000 });
await page.locator(".c4-empty-luxe, .c4-empty-gold").first().scrollIntoViewIfNeeded();
await page.waitForTimeout(300);
await page.screenshot({ path: path.join(out, "crmv4-r20-after-empty.png") });
console.log("overflow", overflow, "errors", errors.length);
await browser.close();
