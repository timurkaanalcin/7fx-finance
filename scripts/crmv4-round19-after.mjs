/** Signed-in after shots: risk watch and the finance list tools. */
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

async function shot(name, url, width, height, mode, ready) {
  await page.setViewportSize({ width, height });
  await page.goto(`${base}${url}`, { waitUntil: "domcontentloaded" });
  await theme(mode);
  await page.waitForSelector(ready, { timeout: 30000 });
  if (ready === ".c4-watch-luxe") await page.waitForSelector(".c4-watch-luxe a", { timeout: 30000 });
  await page.locator(ready).first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  await page.screenshot({ path: path.join(out, `${name}.png`) });
  console.log("saved", name, overflow);
}

await shot("crmv4-r19-after-watch", "/crmv4", 1440, 900, "light", ".c4-watch-luxe");
await shot("crmv4-r19-after-watch-dark", "/crmv4", 1440, 900, "dark", ".c4-watch-luxe");
await shot("crmv4-r19-after-watch-phone", "/crmv4", 375, 812, "light", ".c4-watch-card");
await shot("crmv4-r19-after-finance", "/crmv4/finance", 1440, 900, "light", ".c4-list-bar");
await shot("crmv4-r19-after-finance-phone", "/crmv4/finance", 375, 812, "dark", ".c4-list-bar");
console.log("errors", errors.slice(0, 3));
await browser.close();
