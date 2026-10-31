/** After shots: insights home and the saved-key hub. */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const out = "/opt/cursor/artifacts/screenshots";
fs.mkdirSync(out, { recursive: true });
const base = "http://127.0.0.1:3000";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
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

await page.goto(`${base}/crmv4/insights`, { waitUntil: "domcontentloaded" });
await theme("light");
await page.waitForFunction(() => {
  const text = document.querySelector("[data-insights='1']")?.innerText || "";
  return text.includes("Funnel") && text.includes("Same numbers") && text.includes("not the whole book");
}, null, { timeout: 30000 });
const chart = await page.locator("[role='img']").count();
if (!chart) throw new Error("chart missing");
await page.getByRole("button", { name: "7 Days" }).click();
await page.locator(".c4-panel").evaluate((node) => { node.scrollTop = 0; });
await shot("crmv4-r32-after-insights");
await theme("dark");
await shot("crmv4-r32-after-insights-dark");

await page.setViewportSize({ width: 375, height: 812 });
await page.goto(`${base}/crmv4/insights`, { waitUntil: "domcontentloaded" });
await theme("light");
await page.waitForSelector("[data-insights='1']");
await page.locator("[data-insights='1']").scrollIntoViewIfNeeded();
await shot("crmv4-r32-after-insights-phone");
await theme("dark");
await shot("crmv4-r32-after-insights-phone-dark");

await page.setViewportSize({ width: 1440, height: 900 });
await page.goto(`${base}/crmv4/prefs`, { waitUntil: "domcontentloaded" });
await theme("light");
await page.evaluate(() => window.localStorage.setItem("crmv4-theme-mode", "light"));
await page.reload({ waitUntil: "domcontentloaded" });
await page.evaluate(() => window.localStorage.setItem("crmv4-scratch-notes", "desk note"));
await page.reload({ waitUntil: "domcontentloaded" });
await theme("light");
await page.waitForFunction(() => (document.querySelector("[data-prefs='1']")?.innerText || "").includes("Theme"));
await page.getByRole("button", { name: "View" }).first().click();
await page.waitForSelector(".c4-pref-view");
await shot("crmv4-r32-after-prefs");
await theme("dark");
await shot("crmv4-r32-after-prefs-dark");
page.once("dialog", (dialog) => dialog.accept());
const scratch = page.locator("[data-prefs='1'] li", { hasText: "crmv4-scratch-notes" });
await scratch.getByRole("button", { name: "Reset" }).click();
await page.waitForFunction(() => !(document.querySelector("[data-prefs='1']")?.innerText || "").includes("crmv4-scratch-notes"));

await page.setViewportSize({ width: 375, height: 812 });
await page.goto(`${base}/crmv4/prefs`, { waitUntil: "domcontentloaded" });
await theme("light");
await page.waitForSelector("[data-prefs='1']");
await page.locator("[data-prefs='1']").scrollIntoViewIfNeeded();
await shot("crmv4-r32-after-prefs-phone");
if (errors.length) throw new Error(errors[0].slice(0, 300));
await browser.close();
