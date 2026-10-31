/** After shots: statement and payment methods. */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const out = "/opt/cursor/artifacts/screenshots";
fs.mkdirSync(out, { recursive: true });
const base = "http://127.0.0.1:3000";
const id = "cmvvx5ksn000f7a6gqlnaxj8u";
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
  const closeForm = page.getByRole("button", { name: "Close form" });
  if (width < 500 && await closeForm.count()) await closeForm.first().click();
  await page.locator(ready).first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  await page.screenshot({ path: path.join(out, `${name}.png`) });
  console.log("saved", name, overflow);
}

await shot("crmv4-r21-after-statement", `/crmv4/customers/${id}`, 1440, 900, "light", ".c4-statement-sheet");
await shot("crmv4-r21-after-statement-dark", `/crmv4/customers/${id}`, 1440, 900, "dark", ".c4-statement-sheet");
await shot("crmv4-r21-after-statement-phone", `/crmv4/customers/${id}`, 375, 812, "light", ".c4-statement-sheet");
await shot("crmv4-r21-after-methods", "/crmv4/finance", 1440, 900, "light", ".c4-pay-luxe");
await shot("crmv4-r21-after-methods-phone", "/crmv4/finance", 375, 812, "dark", ".c4-pay-card");
console.log("errors", errors.slice(0, 3));
await browser.close();
