/** After shots: deposit review and the support inbox. */
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
await page.goto(`${base}/crmv4/deposit`, { waitUntil: "domcontentloaded" });
await theme("light");
await page.waitForFunction(() => {
  const text = document.querySelector("[data-dep='1']")?.innerText || "";
  return text.includes("Mehmet") && text.includes("TRY") && text.includes("Account balance US$") && text.includes("not added") && text.includes("No receipt");
}, null, { timeout: 30000 });
await page.getByRole("checkbox", { name: "Amount read" }).check();
const stored = await page.evaluate(() => window.localStorage.getItem("crmv4-dep-review"));
if (!stored?.includes("\"amount\":true")) throw new Error(stored || "checklist missing");
const reason = page.getByRole("textbox", { name: "Reason" });
const source = page.getByRole("textbox", { name: "Source account" });
if (await reason.getAttribute("aria-required") !== "false") throw new Error("reason required");
if (await source.getAttribute("aria-required") !== "false") throw new Error("source required");
await page.evaluate(() => { const panel = document.querySelector(".c4-panel"); if (panel) panel.scrollTop = 0; });
await shot("crmv4-r29-after-dep", 1440, "light");
await theme("dark");
await shot("crmv4-r29-after-dep-dark", 1440, "dark");

await page.setViewportSize({ width: 375, height: 812 });
await page.goto(`${base}/crmv4/deposit`, { waitUntil: "domcontentloaded" });
await theme("light");
await page.waitForSelector("text=Mehmet");
await page.locator("[data-dep='1']").scrollIntoViewIfNeeded();
await shot("crmv4-r29-after-dep-phone", 375, "light");
await theme("dark");
await shot("crmv4-r29-after-dep-phone-dark", 375, "dark");

await page.setViewportSize({ width: 1440, height: 900 });
await page.goto(`${base}/crmv4/inbox`, { waitUntil: "domcontentloaded" });
await theme("light");
await page.waitForSelector("[data-inbox='1'] .c4-kyc-queue button", { timeout: 30000 });
await page.getByRole("textbox", { name: "Canned replies" }).fill("Desk note");
await page.getByRole("textbox", { name: "Save this reply" }).fill("We have the request.");
await page.getByRole("button", { name: "Save this reply" }).click();
await page.getByRole("button", { name: "Desk note" }).click();
const draft = await page.getByRole("textbox", { name: "Reply", exact: true }).inputValue();
if (draft !== "We have the request.") throw new Error(draft);
const canned = await page.evaluate(() => window.localStorage.getItem("crmv4-inbox-canned"));
if (!canned?.includes("We have the request.")) throw new Error(canned || "canned missing");
await page.evaluate(() => { const panel = document.querySelector(".c4-panel"); if (panel) panel.scrollTop = 0; });
await shot("crmv4-r29-after-inbox", 1440, "light");
await theme("dark");
await shot("crmv4-r29-after-inbox-dark", 1440, "dark");
await page.getByRole("button", { name: "Send" }).click();
await page.waitForFunction(() => (document.querySelector("[data-inbox='1']")?.innerText || "").includes("We have the request."), null, { timeout: 15000 });

await page.setViewportSize({ width: 375, height: 812 });
await page.goto(`${base}/crmv4/inbox`, { waitUntil: "domcontentloaded" });
await theme("light");
await page.waitForSelector("[data-inbox='1'] .c4-kyc-queue button");
await page.locator("[data-inbox='1']").scrollIntoViewIfNeeded();
await shot("crmv4-r29-after-inbox-phone", 375, "light");
await theme("dark");
await shot("crmv4-r29-after-inbox-phone-dark", 375, "dark");

await page.setViewportSize({ width: 1440, height: 900 });
await page.goto(`${base}/crmv4/deposit`, { waitUntil: "domcontentloaded" });
await theme("light");
await page.getByRole("button", { name: /Demo Trader/ }).click();
await page.getByRole("button", { name: "Reject" }).click();
await page.waitForFunction(() => !(document.querySelector("[data-dep='1']")?.innerText || "").includes("Demo Trader"), null, { timeout: 15000 });

const real = errors.filter((line) => !/favicon|Download the React DevTools/.test(line));
if (real.length) throw new Error(real[0].slice(0, 500));
await browser.close();
