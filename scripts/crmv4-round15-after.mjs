/** Signed-in after shots: finance queue and notes/documents. */
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

async function shot(name, url, width, height, mode, ready) {
  await page.setViewportSize({ width, height });
  await page.goto(`${base}${url}`, { waitUntil: "domcontentloaded" });
  await page.evaluate((theme) => {
    window.localStorage.setItem("crmv4-theme-mode", theme);
    window.dispatchEvent(new CustomEvent("crmv4:theme-mode", { detail: theme }));
  }, mode);
  await page.waitForSelector(ready, { timeout: 30000 });
  await page.locator(ready).nth(0).evaluate((node) => node.scrollIntoView({ block: "start" }));
  await page.waitForTimeout(400);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  await page.screenshot({ path: path.join(out, `${name}.png`) });
  console.log("saved", name, overflow);
}

await shot("crmv4-r15-after-finance", "/crmv4/finance", 1440, 900, "light", ".c4-fin-hero");
await shot("crmv4-r15-after-finance-dark", "/crmv4/finance", 1440, 900, "dark", ".c4-fin-hero");
await shot("crmv4-r15-after-finance-phone", "/crmv4/finance", 375, 812, "light", ".c4-fin-hero");
await shot("crmv4-r15-after-notes", `/crmv4/customers/${id}?part=notes`, 1440, 900, "light", ".c4-note-desk");
await shot("crmv4-r15-after-notes-dark", `/crmv4/customers/${id}?part=notes`, 1440, 900, "dark", ".c4-note-desk");
await shot("crmv4-r15-after-docs-phone", `/crmv4/customers/${id}?part=files`, 375, 812, "light", ".c4-doc-desk");
console.log("errors", errors.slice(0, 4));
await browser.close();
