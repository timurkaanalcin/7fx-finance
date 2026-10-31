/** After shots: alert rules and customer compare. */
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

async function shot(name, width, mode) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  await page.screenshot({ path: path.join(out, `${name}.png`) });
  console.log("saved", name, overflow, mode, width);
}

await page.setViewportSize({ width: 1440, height: 900 });
await page.goto(`${base}/crmv4`, { waitUntil: "domcontentloaded" });
await theme("light");
await page.waitForSelector(".c4-alert-luxe", { timeout: 30000 });
await page.locator(".c4-alert-luxe").scrollIntoViewIfNeeded();
await page.waitForTimeout(700);
await shot("crmv4-r23-after-alerts", 1440, "light");
await theme("dark");
await page.waitForTimeout(250);
await shot("crmv4-r23-after-alerts-dark", 1440, "dark");

await page.setViewportSize({ width: 1440, height: 900 });
await page.goto(`${base}/crmv4/customers`, { waitUntil: "domcontentloaded" });
await theme("light");
await page.waitForSelector("table.c4-table tbody input[type='checkbox']");
await page.locator("table.c4-table tbody input[type='checkbox']").nth(0).dispatchEvent("click");
await page.locator("table.c4-table tbody input[type='checkbox']").nth(1).dispatchEvent("click");
await page.waitForSelector(".c4-compare-luxe");
await page.locator(".c4-compare-luxe").scrollIntoViewIfNeeded();
await page.waitForTimeout(500);
await shot("crmv4-r23-after-compare", 1440, "light");

await page.setViewportSize({ width: 375, height: 812 });
await page.goto(`${base}/crmv4/customers`, { waitUntil: "domcontentloaded" });
await theme("light");
const boxes = page.locator("table.c4-table tbody input[type='checkbox']");
await boxes.nth(0).dispatchEvent("click");
await boxes.nth(1).dispatchEvent("click");
await page.waitForSelector(".c4-compare-card");
const hide = page.getByRole("button", { name: "Hide filters" });
if (await hide.count()) await hide.first().click({ force: true });
await page.locator(".c4-compare-card").first().scrollIntoViewIfNeeded();
await page.waitForTimeout(400);
await shot("crmv4-r23-after-compare-phone", 375, "light");
console.log("errors", errors.slice(0, 3));
await browser.close();
