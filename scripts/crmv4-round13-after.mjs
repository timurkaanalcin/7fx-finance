/** Signed-in after shots of Marketing and Affiliates. */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const out = "/opt/cursor/artifacts/screenshots";
fs.mkdirSync(out, { recursive: true });
const base = "http://127.0.0.1:3000";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()); });
page.on("pageerror", (err) => errors.push(String(err)));
const login = await page.request.post(`${base}/api/auth/login`, {
  form: { email: "admin@7fx.local", password: "Admin123!", nav: "1" },
  maxRedirects: 0,
});
if (login.status() >= 400) throw new Error(await login.text());
await page.addInitScript(() => window.localStorage.setItem("crmv4-tour-done", "1"));

async function open(theme) {
  await page.goto(`${base}/crmv4/marketing`, { waitUntil: "domcontentloaded" });
  await page.evaluate((mode) => {
    window.localStorage.setItem("crmv4-theme-mode", mode);
    window.dispatchEvent(new CustomEvent("crmv4:theme-mode", { detail: mode }));
  }, theme);
  await page.waitForSelector(".c4-mkt-hero", { timeout: 30000 });
  await page.waitForSelector(".c4-mkt-table >> text=facebook_ads", { timeout: 20000 });
}

await page.setViewportSize({ width: 1440, height: 900 });
await open("light");
await page.waitForTimeout(400);
const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
await page.screenshot({ path: path.join(out, "crmv4-r13-after-marketing.png") });
await page.locator(".c4-aff-board").scrollIntoViewIfNeeded();
await page.waitForTimeout(300);
await page.screenshot({ path: path.join(out, "crmv4-r13-after-affiliates.png") });
await open("dark");
await page.screenshot({ path: path.join(out, "crmv4-r13-after-marketing-dark.png") });
await page.setViewportSize({ width: 375, height: 812 });
await open("light");
await page.screenshot({ path: path.join(out, "crmv4-r13-after-phone.png") });
console.log("overflow", overflow, "errors", errors.slice(0, 4));
await browser.close();
