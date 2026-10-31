/** Before shots: current money tab, shared login, and an empty desk state. */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const out = "/opt/cursor/artifacts/screenshots";
fs.mkdirSync(out, { recursive: true });
const base = "http://127.0.0.1:3000";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on("pageerror", (err) => console.log("pageerror", String(err).slice(0, 200)));
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

const people = await page.request.get(`${base}/api/admin/users?take=20&meta=0&role=TRADER`);
const body = await people.json();
const mehmet = (body.users || []).find((row) => String(row.name || "").includes("Mehmet")) || body.users?.[0];
if (!mehmet) throw new Error("no trader");
console.log("customer", mehmet.id, mehmet.name);

await page.goto(`${base}/crmv4/customers/${mehmet.id}?part=money`, { waitUntil: "domcontentloaded" });
await theme("light");
await page.waitForTimeout(1200);
const close = page.getByRole("button", { name: "Close form" });
if (await close.count()) await close.click();
await page.waitForTimeout(400);
await shot("crmv4-r36-before-money");
await theme("dark");
await shot("crmv4-r36-before-money-dark");

await page.setViewportSize({ width: 375, height: 812 });
await page.goto(`${base}/crmv4/customers/${mehmet.id}?part=money`, { waitUntil: "domcontentloaded" });
await theme("light");
await page.waitForTimeout(800);
const closePhone = page.getByRole("button", { name: "Close form" });
if (await closePhone.count()) await closePhone.click();
await page.waitForTimeout(300);
await shot("crmv4-r36-before-money-phone");
await theme("dark");
await shot("crmv4-r36-before-money-phone-dark");

await page.setViewportSize({ width: 1440, height: 900 });
await page.context().clearCookies();
await page.goto(`${base}/login`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(400);
await shot("crmv4-r36-before-login");
await page.setViewportSize({ width: 375, height: 812 });
await shot("crmv4-r36-before-login-phone");

await browser.close();
console.log("before done");
