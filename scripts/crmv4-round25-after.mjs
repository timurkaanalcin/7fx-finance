/** After shots: goals and forecast, breadcrumbs, recent history. */
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
  console.log("saved", name, mode, width, "overflow", overflow);
}

await page.setViewportSize({ width: 1440, height: 900 });
await page.goto(`${base}/crmv4/customers/${id}`, { waitUntil: "domcontentloaded" });
await theme("light");
await page.waitForSelector(".c4-recent-row a[data-kind='customer']", { timeout: 30000 });
const customerCrumb = await page.locator(".c4-crumbs").innerText();
if (!customerCrumb.includes("Mehmet")) throw new Error(`crumb ${customerCrumb}`);

await page.goto(`${base}/crmv4/finance`, { waitUntil: "domcontentloaded" });
await theme("light");
await page.waitForSelector(".c4-fin-row .c4-btn");
await page.locator(".c4-fin-row .c4-btn").first().click();
await page.waitForSelector(".c4-recent-row a[data-kind='finance']", { timeout: 15000 });

await page.goto(`${base}/crmv4/goals`, { waitUntil: "domcontentloaded" });
await theme("light");
await page.waitForFunction(() => {
  const text = document.querySelector("[data-goals='1']")?.innerText || "";
  return /(?:US)?\$[1-9]/.test(text);
}, null, { timeout: 30000 });
const goals = await page.locator("[data-goals='1']").innerText();
if (!goals.includes("Estimate")) throw new Error("estimate label missing");
if (!goals.includes("TRY is not added into USD")) throw new Error("currency split missing");
if (goals.includes("USDTRY")) throw new Error("mixed pair shown");
await page.getByLabel("Target First deposits").fill("10");
await page.getByLabel("Target USD").fill("5000");
await page.getByLabel("Target TRY").fill("1000");
await page.waitForTimeout(200);
const stored = await page.evaluate(() => window.localStorage.getItem("crmv4-month-targets"));
if (!stored?.includes("5000") || stored.includes("USDTRY")) throw new Error(`targets ${stored}`);
await page.locator("[data-deposits]").scrollIntoViewIfNeeded();
await page.waitForTimeout(200);
await shot("crmv4-r25-after-goals", 1440, "light");
await theme("dark");
await shot("crmv4-r25-after-goals-dark", 1440, "dark");

await page.setViewportSize({ width: 375, height: 812 });
await page.goto(`${base}/crmv4/goals`, { waitUntil: "domcontentloaded" });
await theme("light");
await page.waitForSelector("[data-goals='1']");
await page.evaluate(() => { const panel = document.querySelector(".c4-panel"); if (panel) panel.scrollTop = 0; });
await shot("crmv4-r25-after-goals-phone", 375, "light");
await theme("dark");
await shot("crmv4-r25-after-goals-phone-dark", 375, "dark");

await page.setViewportSize({ width: 1440, height: 900 });
await page.goto(`${base}/crmv4`, { waitUntil: "domcontentloaded" });
await theme("light");
await page.waitForSelector(".c4-recent-row a[data-kind='customer']");
await page.waitForSelector(".c4-recent-row a[data-kind='finance']");
const resume = page.locator(".c4-resume").getByRole("button", { name: "Close" });
if (await resume.count()) await resume.click();
await shot("crmv4-r25-after-trail", 1440, "light");
await theme("dark");
await shot("crmv4-r25-after-trail-dark", 1440, "dark");

await page.setViewportSize({ width: 375, height: 812 });
await page.goto(`${base}/crmv4`, { waitUntil: "domcontentloaded" });
await theme("light");
await page.waitForSelector(".c4-recent-row");
await shot("crmv4-r25-after-trail-phone", 375, "light");
await theme("dark");
await shot("crmv4-r25-after-trail-phone-dark", 375, "dark");

await page.locator(".c4-recent-row a[data-kind='customer']").click();
await page.waitForURL(/customers\//);
const real = errors.filter((line) => !/favicon|Download the React DevTools/.test(line));
if (real.length) throw new Error(real[0].slice(0, 400));
await browser.close();
