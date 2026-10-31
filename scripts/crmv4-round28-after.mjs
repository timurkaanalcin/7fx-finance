/** After shots: withdrawal review and the grouped search. */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const out = "/opt/cursor/artifacts/screenshots";
fs.mkdirSync(out, { recursive: true });
const base = "http://127.0.0.1:3000";
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

async function theme(mode) {
  await page.evaluate((value) => {
    window.localStorage.setItem("crmv4-theme-mode", value);
    window.dispatchEvent(new Event("crmv4:theme-mode"));
  }, mode);
  await page.waitForFunction((value) => document.querySelector("[data-crmv4-root]")?.getAttribute("data-theme") === value, mode);
}

async function shot(name, width, mode) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (overflow > 1) throw new Error(`${name} overflow ${overflow}`);
  await page.screenshot({ path: path.join(out, `${name}.png`) });
  console.log("saved", name, mode, width);
}

await page.setViewportSize({ width: 1440, height: 900 });
await page.goto(`${base}/crmv4/withdraw`, { waitUntil: "domcontentloaded" });
await theme("light");
await page.waitForFunction(() => {
  const text = document.querySelector("[data-wd='1']")?.innerText || "";
  return text.includes("Mehmet") && /US\$|USD/.test(text) && text.includes("not added");
}, null, { timeout: 30000 });
await page.getByRole("checkbox", { name: "KYC status read" }).check();
const stored = await page.evaluate(() => window.localStorage.getItem("crmv4-wd-review"));
if (!stored?.includes("\"kyc\":true")) throw new Error(stored || "checklist missing");
await page.evaluate(() => { const panel = document.querySelector(".c4-panel"); if (panel) panel.scrollTop = 0; });
await shot("crmv4-r28-after-wd", 1440, "light");
await theme("dark");
await shot("crmv4-r28-after-wd-dark", 1440, "dark");

await page.setViewportSize({ width: 375, height: 812 });
await page.goto(`${base}/crmv4/withdraw`, { waitUntil: "domcontentloaded" });
await theme("light");
await page.waitForSelector("[data-wd='1'] button");
await page.locator("[data-wd='1']").scrollIntoViewIfNeeded();
await shot("crmv4-r28-after-wd-phone", 375, "light");
await theme("dark");
await shot("crmv4-r28-after-wd-phone-dark", 375, "dark");

await page.setViewportSize({ width: 1440, height: 900 });
await page.goto(`${base}/crmv4`, { waitUntil: "domcontentloaded" });
await theme("light");
await page.waitForSelector("[data-crmv4-root]");
await page.keyboard.press("Control+KeyK");
if (!(await page.locator(".c4-find-luxe").count())) {
  await page.getByRole("button", { name: "Quick search" }).click({ force: true });
}
await page.waitForSelector(".c4-find-luxe");
await page.locator(".c4-find-luxe input").fill("meh");
await page.waitForSelector(".c4-find-luxe [aria-label='Customers']", { timeout: 15000 });
await page.keyboard.press("ArrowDown");
const active = await page.locator(".c4-find-list li[data-on='1']").innerText();
if (!active) throw new Error("no active result");
await shot("crmv4-r28-after-find", 1440, "light");
await theme("dark");
await shot("crmv4-r28-after-find-dark", 1440, "dark");
await page.keyboard.press("Enter");
await page.waitForURL(/\/crmv4\//);
const recent = await page.evaluate(() => window.localStorage.getItem("crmv4-palette-recent"));
if (!recent?.toLowerCase().includes("meh")) throw new Error(recent || "recent missing");

await page.setViewportSize({ width: 375, height: 812 });
await page.goto(`${base}/crmv4`, { waitUntil: "domcontentloaded" });
await theme("light");
await page.waitForSelector("[data-crmv4-root]");
await page.getByRole("button", { name: "Quick search" }).click({ force: true });
await page.waitForSelector(".c4-find-luxe");
await shot("crmv4-r28-after-find-phone", 375, "light");
await theme("dark");
await shot("crmv4-r28-after-find-phone-dark", 375, "dark");
await page.keyboard.press("Escape");

await page.setViewportSize({ width: 1440, height: 900 });
await page.goto(`${base}/crmv4/withdraw`, { waitUntil: "domcontentloaded" });
await theme("light");
await page.waitForSelector("text=Mehmet");
await page.getByRole("button", { name: "Reject" }).click();
await page.waitForFunction(() => (document.querySelector("[data-wd='1']")?.innerText || "").includes("No pending withdrawal"), null, { timeout: 15000 });

const real = errors.filter((line) => !/favicon|Download the React DevTools/.test(line));
if (real.length) throw new Error(real[0].slice(0, 500));
await browser.close();
