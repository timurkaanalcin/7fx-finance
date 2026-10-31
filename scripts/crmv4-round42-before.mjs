/** Before shots: customer bulk bar and record, round 41. */
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
async function show(selector) {
  await page.evaluate((sel) => {
    const node = document.querySelector(sel);
    const panel = document.querySelector(".c4-panel");
    if (!node || !panel) return;
    const top = node.getBoundingClientRect().top - panel.getBoundingClientRect().top + panel.scrollTop;
    panel.scrollTop = Math.max(0, top - 8);
  }, selector);
}

await page.goto(`${base}/crmv4/customers`, { waitUntil: "domcontentloaded" });
await theme("light");
await page.waitForSelector(".c4-lead-card");
await page.getByRole("button", { name: "Invert selection" }).click();
await page.waitForSelector(".c4-bulk");
await show(".c4-bulk");
await shot("crmv4-r42-before-bulk-light");
await theme("dark");
await show(".c4-bulk");
await shot("crmv4-r42-before-bulk-dark");

const people = await (await page.request.get(`${base}/api/admin/users?take=20&meta=0&role=TRADER`)).json();
const person = (people.users || []).find((row) => String(row.name || "").includes("Mehmet")) || (people.users || [])[0];
await page.goto(`${base}/crmv4/customers/${person.id}`, { waitUntil: "domcontentloaded" });
await theme("light");
await page.waitForTimeout(600);
await shot("crmv4-r42-before-record-light");
await page.goto(`${base}/crmv4/inbox`, { waitUntil: "domcontentloaded" });
await theme("light");
await page.waitForTimeout(700);
await shot("crmv4-r42-before-inbox-light");

await page.setViewportSize({ width: 375, height: 812 });
await page.goto(`${base}/crmv4/customers`, { waitUntil: "domcontentloaded" });
await theme("light");
const hide = page.getByRole("button", { name: /Hide filters|Filters/ });
if (await hide.count()) {
  const open = await page.locator(".c4-filter-sheet").getAttribute("data-open").catch(() => null);
  if (open === "1") await hide.first().click();
}
await page.waitForSelector(".c4-lead-card");
await page.getByRole("button", { name: "Invert selection" }).click();
await page.waitForSelector(".c4-bulk");
await show(".c4-bulk");
await shot("crmv4-r42-before-bulk-phone");
await page.goto(`${base}/crmv4/customers/${person.id}`, { waitUntil: "domcontentloaded" });
await theme("dark");
await page.waitForTimeout(500);
await shot("crmv4-r42-before-record-phone");
await browser.close();
console.log("round 42 before done", person.id);
