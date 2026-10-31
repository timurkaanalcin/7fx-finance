/** Before shots: KYC desk and the activity feed. Two images. */
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
await page.goto(`${base}/crmv4/kyc`, { waitUntil: "domcontentloaded" });
await theme("light");
await page.waitForSelector("[data-kyc]");
await page.waitForTimeout(600);
await shot("crmv4-r44-before-kyc-light");
const people = await (await page.request.get(`${base}/api/admin/users?take=20&meta=0&role=TRADER`)).json();
const person = (people.users || []).find((row) => String(row.name || "").includes("Mehmet")) || (people.users || [])[0];
await page.goto(`${base}/crmv4/customers/${person.id}?part=activity`, { waitUntil: "domcontentloaded" });
await theme("light");
await page.waitForSelector(".c4-feed-luxe");
await page.waitForTimeout(500);
await shot("crmv4-r44-before-feed-light");
await browser.close();
console.log("round 44 before done", person.id);
