/** Before shots: top bar and the phone plus button. */
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
await page.goto(`${base}/crmv4`, { waitUntil: "domcontentloaded" });
await page.waitForSelector(".c4-top");
await page.waitForTimeout(400);
await page.screenshot({ path: path.join(out, "crmv4-r22-before-top.png") });
await page.setViewportSize({ width: 375, height: 812 });
await page.waitForTimeout(300);
await page.screenshot({ path: path.join(out, "crmv4-r22-before-fab.png") });
console.log("saved before");
await browser.close();
