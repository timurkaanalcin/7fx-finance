/** Before shots: reports center. Kept to two so the round stays within ten images. */
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
async function theme(mode) {
  await page.evaluate((value) => {
    window.localStorage.setItem("crmv4-theme-mode", value);
    window.dispatchEvent(new Event("crmv4:theme-mode"));
  }, mode);
  await page.waitForFunction((value) => document.querySelector("[data-crmv4-root]")?.getAttribute("data-theme") === value, mode);
}
async function shot(name) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  console.log(name, "overflow", overflow);
  await page.screenshot({ path: path.join(out, `${name}.png`) });
}
await page.goto(`${base}/crmv4/reports`, { waitUntil: "domcontentloaded" });
await theme("light");
await page.waitForSelector("[data-reports]");
await page.waitForTimeout(800);
await shot("crmv4-r43-before-reports-light");
await page.setViewportSize({ width: 375, height: 812 });
await theme("light");
await shot("crmv4-r43-before-reports-phone");
await browser.close();
console.log("round 43 before done");
