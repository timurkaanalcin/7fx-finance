/** After shots: today's loaded work and the staff desks. */
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
  if ((req.method() === "POST" || req.method() === "PATCH") && !req.url().includes("/api/auth/login")) writes.push(req.url());
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

await page.goto(`${base}/crmv4`, { waitUntil: "domcontentloaded" });
await theme("light");
await page.waitForFunction(() => {
  const text = document.querySelector("[data-hero='1']")?.innerText || "";
  return text.includes("Pending deposits") && /TRY|US\$/.test(text) && text.includes("not added together");
}, null, { timeout: 30000 });
await page.locator(".c4-panel").evaluate((node) => { node.scrollTop = 0; });
await shot("crmv4-r35-after-home");
await theme("dark");
await shot("crmv4-r35-after-home-dark");

await page.setViewportSize({ width: 375, height: 812 });
await page.goto(`${base}/crmv4`, { waitUntil: "domcontentloaded" });
await theme("light");
await page.waitForSelector("[data-hero='1']");
await page.locator("[data-hero='1']").scrollIntoViewIfNeeded();
await shot("crmv4-r35-after-home-phone");
await theme("dark");
await shot("crmv4-r35-after-home-phone-dark");

await page.setViewportSize({ width: 1440, height: 900 });
writes.length = 0;
await page.goto(`${base}/crmv4/roster`, { waitUntil: "domcontentloaded" });
await theme("light");
await page.waitForFunction(() => (document.querySelector("[data-staff='1']")?.innerText || "").includes("Loaded customers"), null, { timeout: 30000 });
await page.getByRole("button", { name: "Has customers" }).click();
const saved = await page.evaluate(() => window.localStorage.getItem("crmv4-staff-load"));
if (saved !== "busy") throw new Error(saved || "filter missing");
if (writes.length) throw new Error(writes.join(" "));
await page.locator(".c4-panel").evaluate((node) => { node.scrollTop = 0; });
await shot("crmv4-r35-after-staff");
await theme("dark");
await shot("crmv4-r35-after-staff-dark");

await page.setViewportSize({ width: 375, height: 812 });
await page.goto(`${base}/crmv4/roster`, { waitUntil: "domcontentloaded" });
await theme("light");
await page.waitForSelector("[data-staff='1']");
await page.locator("[data-staff='1']").scrollIntoViewIfNeeded();
await shot("crmv4-r35-after-staff-phone");
if (errors.length) throw new Error(errors[0].slice(0, 300));
await browser.close();
