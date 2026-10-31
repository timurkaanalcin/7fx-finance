/** Before shots: lead pipeline and help, round 40 desk. */
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

await page.goto(`${base}/crmv4/customers`, { waitUntil: "domcontentloaded" });
await theme("light");
await page.getByRole("button", { name: "Pipeline" }).click();
await page.waitForSelector(".c4-kanban");
await page.waitForTimeout(500);
await shot("crmv4-r41-before-board-light");
await theme("dark");
await shot("crmv4-r41-before-board-dark");

await page.getByRole("button", { name: "Help", exact: true }).click();
await page.waitForSelector("[aria-label='Help']");
await shot("crmv4-r41-before-help-dark");
await page.keyboard.press("Escape");
await theme("light");
await page.getByRole("button", { name: "Help", exact: true }).click();
await page.waitForSelector("[aria-label='Help']");
await shot("crmv4-r41-before-help-light");

await page.setViewportSize({ width: 375, height: 812 });
await page.goto(`${base}/crmv4/customers`, { waitUntil: "domcontentloaded" });
await theme("light");
const hide = page.getByRole("button", { name: /Hide filters|Filters/ });
if (await hide.count()) {
  const open = await page.locator(".c4-filter-sheet").getAttribute("data-open").catch(() => null);
  if (open === "1") await hide.first().click();
  await page.waitForTimeout(200);
}
await page.getByRole("button", { name: "Pipeline" }).click();
await page.waitForSelector(".c4-kanban");
await shot("crmv4-r41-before-board-phone");
await page.keyboard.press("?");
await page.waitForTimeout(300);
await shot("crmv4-r41-before-keys-phone");
await browser.close();
console.log("round 41 before done");
