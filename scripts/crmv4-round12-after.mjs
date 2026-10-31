/** Signed-in after shots of the split customer profile. */
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
await page.goto(`${base}/crmv4/customers`, { waitUntil: "domcontentloaded" });
await page.waitForSelector("a[href*='/crmv4/customers/']", { timeout: 30000 });
const href = await page.locator("a[href*='/crmv4/customers/']").first().getAttribute("href");

async function shot(name, width, height, theme) {
  await page.setViewportSize({ width, height });
  await page.goto(`${base}${href}`, { waitUntil: "domcontentloaded" });
  await page.evaluate((mode) => {
    window.localStorage.setItem("crmv4-theme-mode", mode);
    window.dispatchEvent(new CustomEvent("crmv4:theme-mode", { detail: mode }));
  }, theme);
  await page.waitForSelector(".c4-mini-nav", { timeout: 30000 });
  await page.waitForSelector(".c4-gauge", { timeout: 30000 });
  await page.locator(".c4-facts").scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  const measure = await page.evaluate(() => {
    const box = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
    };
    return {
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      list: box(".c4-profile-list"),
      gauge: box(".c4-gauge"),
      nav: box(".c4-mini-nav"),
    };
  });
  await page.screenshot({ path: path.join(out, `${name}.png`) });
  console.log(name, JSON.stringify(measure));
}

await shot("crmv4-r12-after-profile", 1440, 900, "light");
await shot("crmv4-r12-after-profile-dark", 1440, 900, "dark");
await shot("crmv4-r12-after-phone", 375, 812, "light");
console.log("errors", errors.slice(0, 5));
await browser.close();
