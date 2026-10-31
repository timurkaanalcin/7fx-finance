/** Signed-in after shots: lead board and bulk bar. */
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

async function shot(name, width, height, mode, pick) {
  await page.setViewportSize({ width, height });
  await page.goto(`${base}/crmv4/customers`, { waitUntil: "domcontentloaded" });
  await page.evaluate((theme) => {
    window.localStorage.setItem("crmv4-theme-mode", theme);
    window.dispatchEvent(new CustomEvent("crmv4:theme-mode", { detail: theme }));
  }, mode);
  await page.waitForSelector(".c4-lead-board", { timeout: 30000 });
  const hide = page.getByRole("button", { name: /Hide filters/i });
  if (await hide.count()) await hide.first().click({ force: true });
  if (width < 500) await page.locator(".c4-lead-col").first().scrollIntoViewIfNeeded();
  if (pick) {
    await page.waitForSelector("table.c4-table tbody input[type='checkbox']");
    const box = page.locator("table.c4-table tbody input[type='checkbox']").nth(1);
    await box.dispatchEvent("click");
    await page.locator(".c4-lead-bulk").first().scrollIntoViewIfNeeded();
  }
  await page.waitForTimeout(400);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  await page.screenshot({ path: path.join(out, `${name}.png`) });
  console.log("saved", name, overflow);
}

await shot("crmv4-r16-after-board", 1440, 900, "light", false);
await shot("crmv4-r16-after-board-dark", 1440, 900, "dark", false);
await shot("crmv4-r16-after-board-phone", 375, 812, "light", false);
await shot("crmv4-r16-after-bulk", 1440, 900, "light", true);
console.log("errors", errors.slice(0, 3));
await browser.close();
