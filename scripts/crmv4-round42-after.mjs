/** After shots: bulk bar and record thread. Confirms are opened and cancelled. */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const out = "/opt/cursor/artifacts/screenshots";
fs.mkdirSync(out, { recursive: true });
const base = "http://127.0.0.1:3000";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const sent = [];
page.on("request", (req) => {
  const url = req.url();
  if (req.method() === "PATCH" && url.includes("/api/admin/users/")) sent.push(url);
  if (req.method() === "POST" && url.includes("/api/admin/chat")) sent.push(url);
  if (req.method() === "POST" && url.includes("/api/admin/export-audit")) sent.push(url);
});
const login = await page.request.post(`${base}/api/auth/login`, {
  form: { email: "admin@7fx.local", password: "Admin123!", nav: "1" },
  maxRedirects: 0,
});
if (login.status() >= 400) throw new Error(await login.text());
await page.addInitScript(() => {
  window.localStorage.setItem("crmv4-tour-done", "1");
  window.localStorage.setItem("crmv4-inbox-canned", JSON.stringify([{ id: "hi", title: "Hello", body: "Hello from the desk" }]));
});

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
  if (overflow > 1) throw new Error(`${name} overflow ${overflow}`);
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
await page.waitForSelector(".c4-lux-desk tbody input[type=checkbox]");
await page.locator(".c4-lux-desk tbody input[type=checkbox]").nth(0).check();
await page.locator(".c4-lux-desk tbody input[type=checkbox]").nth(1).check();
await page.waitForSelector("[data-bulk]");
await page.getByRole("button", { name: "Change stage" }).click();
await page.waitForSelector("[data-confirm='stage']");
await show("[data-bulk]");
await shot("crmv4-r42-after-bulk-light");
await page.getByRole("button", { name: "Cancel" }).click();
await page.getByRole("button", { name: "Assign" }).click();
await page.waitForSelector("[data-confirm='assign']");
await theme("dark");
await show("[data-bulk]");
await shot("crmv4-r42-after-bulk-dark");
await page.getByRole("button", { name: "Cancel" }).click();

const people = await (await page.request.get(`${base}/api/admin/users?take=20&meta=0&role=TRADER`)).json();
const person = (people.users || []).find((row) => String(row.name || "").includes("Mehmet")) || (people.users || [])[0];
await page.goto(`${base}/crmv4/customers/${person.id}`, { waitUntil: "domcontentloaded" });
await theme("light");
await page.waitForSelector("[data-thread]");
await page.waitForFunction(() => Number(document.querySelector("[data-thread] [data-loaded]")?.getAttribute("data-loaded") || 0) > 0);
await page.getByRole("button", { name: "Hello" }).click();
await page.waitForFunction(() => document.querySelector("[data-thread] textarea")?.value === "Hello from the desk");
const enabled = await page.locator("[data-send]").isEnabled();
if (!enabled) throw new Error("send stayed disabled");
await show("[data-thread]");
await shot("crmv4-r42-after-thread-light");
await theme("dark");
await show("[data-thread]");
await shot("crmv4-r42-after-thread-dark");

await page.setViewportSize({ width: 375, height: 812 });
await page.goto(`${base}/crmv4/customers`, { waitUntil: "domcontentloaded" });
await theme("light");
const hide = page.getByRole("button", { name: /Hide filters|Filters/ });
if (await hide.count()) {
  const open = await page.locator(".c4-filter-sheet").getAttribute("data-open").catch(() => null);
  if (open === "1") await hide.first().click();
}
await page.waitForSelector(".c4-lux-cards input[type=checkbox]");
await page.locator(".c4-lux-cards input[type=checkbox]").nth(0).check();
await page.locator(".c4-lux-cards input[type=checkbox]").nth(1).check();
await page.waitForSelector("[data-bulk]");
await page.getByRole("button", { name: "Export CSV" }).click();
await page.waitForSelector("[data-confirm='export']");
await show("[data-bulk]");
await shot("crmv4-r42-after-bulk-phone");
await theme("dark");
await show("[data-bulk]");
await shot("crmv4-r42-after-bulk-phone-dark");
await page.goto(`${base}/crmv4/customers/${person.id}`, { waitUntil: "domcontentloaded" });
await theme("light");
await page.waitForSelector("[data-thread]");
const closeForm = page.getByRole("button", { name: "Close form" });
if (await closeForm.count()) await closeForm.first().click();
await page.waitForFunction(() => Number(document.querySelector("[data-thread] [data-loaded]")?.getAttribute("data-loaded") || 0) > 0);
await show("[data-thread]");
await shot("crmv4-r42-after-thread-phone");
await theme("dark");
await show("[data-thread]");
await shot("crmv4-r42-after-thread-phone-dark");
if (sent.length) throw new Error(`unexpected request ${sent.join(" ")}`);
await browser.close();
console.log("round 42 after done", person.id);
