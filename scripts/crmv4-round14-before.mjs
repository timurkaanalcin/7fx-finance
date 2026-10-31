/** Signed-in before shots: tasks and tickets. */
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

async function shot(name, url, width, height, selector) {
  await page.setViewportSize({ width, height });
  await page.goto(`${base}${url}`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(selector, { timeout: 30000 });
  const target = page.locator(selector).nth(0);
  await target.evaluate((node) => node.scrollIntoView({ block: "center" }));
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(out, `${name}.png`) });
  console.log("saved", name);
}

await shot("crmv4-r14-before-tasks", "/crmv4", 1440, 900, ".c4-tasks-luxe");
await shot("crmv4-r14-before-tickets", "/crmv4/support", 1440, 900, "h1.c4-page-title");
await shot("crmv4-r14-before-tasks-phone", "/crmv4", 375, 812, ".c4-tasks-luxe");
await shot("crmv4-r14-before-tickets-phone", "/crmv4/support", 375, 812, "h1.c4-page-title");
await browser.close();
