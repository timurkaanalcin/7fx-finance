/** Signed-in after shots: team board, footer, and shortcut help. */
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

async function shot(name, width, height, mode, ready) {
  await page.setViewportSize({ width, height });
  await page.goto(`${base}/crmv4`, { waitUntil: "domcontentloaded" });
  await theme(mode);
  await page.waitForSelector(ready, { timeout: 30000 });
  await page.locator(ready).first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  await page.screenshot({ path: path.join(out, `${name}.png`) });
  console.log("saved", name, overflow);
}

await shot("crmv4-r18-after-board", 1440, 900, "light", ".c4-perf-luxe");
await shot("crmv4-r18-after-board-dark", 1440, 900, "dark", ".c4-perf-luxe");
await shot("crmv4-r18-after-board-phone", 375, 812, "light", ".c4-perf-card");
await shot("crmv4-r18-after-foot", 1440, 900, "light", ".c4-foot-luxe");
await page.getByRole("button", { name: "Shortcuts" }).click();
await page.waitForSelector(".c4-help-luxe");
await page.screenshot({ path: path.join(out, "crmv4-r18-after-help.png") });
console.log("saved help");
await shot("crmv4-r18-after-board-phone-dark", 375, 812, "dark", ".c4-perf-card");
console.log("errors", errors.slice(0, 3));
await browser.close();
