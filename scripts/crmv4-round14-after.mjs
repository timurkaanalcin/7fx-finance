/** Signed-in after shots: tasks and tickets. */
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
  await page.evaluate((name) => {
    window.localStorage.setItem("crmv4-theme-mode", name);
    window.dispatchEvent(new CustomEvent("crmv4:theme-mode", { detail: name }));
  }, mode);
}

async function shot(name, url, width, height, selector, mode) {
  await page.setViewportSize({ width, height });
  await page.goto(`${base}${url}`, { waitUntil: "domcontentloaded" });
  await theme(mode);
  await page.waitForSelector(selector, { timeout: 30000 });
  if (url === "/crmv4") await page.waitForSelector("text=Istanbul", { timeout: 20000 });
  await page.locator(selector).nth(0).evaluate((node) => node.scrollIntoView({ block: "start" }));
  await page.waitForTimeout(400);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  await page.screenshot({ path: path.join(out, `${name}.png`) });
  console.log("saved", name, "overflow", overflow);
}

await shot("crmv4-r14-after-tasks", "/crmv4", 1440, 900, "#c4-tasks", "light");
await shot("crmv4-r14-after-tasks-dark", "/crmv4", 1440, 900, "#c4-tasks", "dark");
await shot("crmv4-r14-after-tickets", "/crmv4/support", 1440, 900, ".c4-ticket-board", "light");
await shot("crmv4-r14-after-tickets-dark", "/crmv4/support", 1440, 900, ".c4-ticket-board", "dark");
await shot("crmv4-r14-after-tasks-phone", "/crmv4", 375, 812, "#c4-tasks", "light");
await shot("crmv4-r14-after-tickets-phone", "/crmv4/support", 375, 812, ".c4-ticket-board", "light");
console.log("errors", errors.slice(0, 4));
await browser.close();
