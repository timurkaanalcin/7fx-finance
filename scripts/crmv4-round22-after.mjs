/** After shots: currency desk and the create menu. */
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

async function theme(mode) {
  await page.evaluate((value) => {
    window.localStorage.setItem("crmv4-theme-mode", value);
    window.dispatchEvent(new CustomEvent("crmv4:theme-mode", { detail: value }));
  }, mode);
}

await page.goto(`${base}/crmv4`, { waitUntil: "domcontentloaded" });
await theme("light");
await page.waitForSelector(".c4-fx-desk", { timeout: 30000 });
await page.locator(".c4-fx-desk").scrollIntoViewIfNeeded();
await page.waitForTimeout(800);
const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
await page.screenshot({ path: path.join(out, "crmv4-r22-after-fx.png") });
await theme("dark");
await page.waitForTimeout(250);
await page.screenshot({ path: path.join(out, "crmv4-r22-after-fx-dark.png") });
await page.locator(".c4-rail .c4-plus").click();
await page.waitForSelector(".c4-quick-luxe");
await page.screenshot({ path: path.join(out, "crmv4-r22-after-plus.png") });
await page.setViewportSize({ width: 375, height: 812 });
await page.goto(`${base}/crmv4`, { waitUntil: "domcontentloaded" });
await theme("light");
await page.waitForSelector(".c4-fx-desk");
await page.waitForFunction(() => {
  const node = document.querySelector(".c4-fx-quotes strong");
  return Boolean(node && node.textContent && !node.textContent.includes("No quote"));
}, { timeout: 20000 });
await page.locator(".c4-fx-desk").scrollIntoViewIfNeeded();
await page.waitForTimeout(200);
await page.screenshot({ path: path.join(out, "crmv4-r22-after-fx-phone.png") });
await page.locator(".c4-fab-btn").click();
await page.waitForSelector(".c4-quick-luxe");
await page.screenshot({ path: path.join(out, "crmv4-r22-after-plus-phone.png") });
console.log("overflow", overflow, "errors", errors.slice(0, 2));
await browser.close();
