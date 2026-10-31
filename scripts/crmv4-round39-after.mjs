/** After shots: system settings and the phone bar at four widths. */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const out = "/opt/cursor/artifacts/screenshots";
fs.mkdirSync(out, { recursive: true });
const base = "http://127.0.0.1:3000";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
const writes = [];
page.on("pageerror", (err) => errors.push(String(err)));
page.on("request", (req) => {
  if ((req.method() === "POST" || req.method() === "PATCH" || req.method() === "PUT") && !req.url().includes("/api/auth/login")) writes.push(`${req.method()} ${req.url()}`);
});
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
  if (overflow > 1) throw new Error(`${name} overflow ${overflow}`);
  const text = await page.locator("body").innerText();
  if (text.includes("[object Object]")) throw new Error(`${name} object`);
  await page.screenshot({ path: path.join(out, `${name}.png`) });
  console.log("saved", name);
}

writes.length = 0;
await page.goto(`${base}/crmv4/settings?area=methods`, { waitUntil: "domcontentloaded" });
await theme("light");
await page.waitForFunction(() => {
  const text = document.querySelector("[data-sys='1']")?.innerText || "";
  return text.includes("Loaded system") && text.includes("Loaded rows");
}, null, { timeout: 20000 });
await shot("crmv4-r39-after-methods");
const before = writes.length;
const pick = page.locator("[data-sys='1']").getByLabel("Loaded method");
if (await pick.count()) {
  const value = await pick.locator("option").nth(1).getAttribute("value");
  if (value) await pick.selectOption(value);
  await page.waitForTimeout(200);
  if (writes.length !== before) throw new Error("method pick wrote");
}
await theme("dark");
await shot("crmv4-r39-after-methods-dark");
await page.goto(`${base}/crmv4/settings?area=currencies`, { waitUntil: "domcontentloaded" });
await theme("light");
await page.waitForFunction(() => /USD|TRY|EUR/.test(document.querySelector("[data-sys='1']")?.innerText || ""), null, { timeout: 20000 });
await shot("crmv4-r39-after-currencies");
await page.goto(`${base}/crmv4/settings?area=desks`, { waitUntil: "domcontentloaded" });
await theme("light");
await page.waitForFunction(() => (document.querySelector("[data-sys='1']")?.innerText || "").includes("Loaded rows"), null, { timeout: 20000 });
await shot("crmv4-r39-after-desks");

const people = await (await page.request.get(`${base}/api/admin/users?take=5&meta=0&role=TRADER`)).json();
const id = people.users?.[0]?.id;
for (const width of [360, 375, 390, 430]) {
  await page.setViewportSize({ width, height: 812 });
  await page.goto(`${base}/crmv4/customers`, { waitUntil: "domcontentloaded" });
  await theme("light");
  await page.waitForSelector(".c4-tabs");
  const tab = await page.locator(".c4-tab").first().evaluate((node) => node.getBoundingClientRect().height);
  if (tab < 44) throw new Error(`${width} tab ${tab}`);
  const sheet = await page.locator(".c4-filter-sheet").getAttribute("data-open");
  if (sheet !== "0") throw new Error(`${width} filters ${sheet}`);
  await shot(`crmv4-r39-after-phone-${width}`);
}
await page.setViewportSize({ width: 375, height: 812 });
await page.goto(`${base}/crmv4/customers/${id}`, { waitUntil: "domcontentloaded" });
await theme("light");
await page.waitForSelector(".c4-record-foot");
const foot = await page.locator(".c4-record-foot .c4-btn").first().evaluate((node) => node.getBoundingClientRect().height);
if (foot < 44) throw new Error(`foot ${foot}`);
await shot("crmv4-r39-after-record-phone");
await theme("dark");
await shot("crmv4-r39-after-record-phone-dark");
await page.setViewportSize({ width: 360, height: 780 });
await shot("crmv4-r39-after-record-360");
await page.setViewportSize({ width: 390, height: 844 });
await shot("crmv4-r39-after-record-390");
await page.setViewportSize({ width: 430, height: 932 });
await shot("crmv4-r39-after-record-430");

if (errors.length) throw new Error(errors[0].slice(0, 400));
if (writes.length) throw new Error(writes.join("\n"));
await browser.close();
console.log("after done");
