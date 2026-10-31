/** Before shots: top bar and customer page, before goals and recent history. */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const out = "/opt/cursor/artifacts/screenshots";
fs.mkdirSync(out, { recursive: true });
const base = "http://127.0.0.1:3000";
const id = "cmvvx5ksn000f7a6gqlnaxj8u";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const login = await page.request.post(`${base}/api/auth/login`, {
  form: { email: "admin@7fx.local", password: "Admin123!", nav: "1" },
  maxRedirects: 0,
});
if (login.status() >= 400) throw new Error(await login.text());
await page.addInitScript(() => window.localStorage.setItem("crmv4-tour-done", "1"));

async function shot(name, url, width) {
  await page.setViewportSize({ width, height: width < 500 ? 812 : 900 });
  await page.goto(`${base}${url}`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("h1.c4-page-title, .c4-strip, h2", { timeout: 30000 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(out, `${name}.png`) });
  console.log("saved", name);
}

await shot("crmv4-r25-before-home", "/crmv4", 1440);
await shot("crmv4-r25-before-customer", `/crmv4/customers/${id}`, 1440);
await shot("crmv4-r25-before-home-phone", "/crmv4", 375);
await browser.close();
