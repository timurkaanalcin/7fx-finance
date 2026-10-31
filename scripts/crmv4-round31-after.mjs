/** After shots: the customer record header and named lists. */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const out = "/opt/cursor/artifacts/screenshots";
fs.mkdirSync(out, { recursive: true });
const base = "http://127.0.0.1:3000";
const id = fs.readFileSync("/tmp/crmv4-customer-id.txt", "utf8").trim();
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

await page.goto(`${base}/crmv4/customers/${id}`, { waitUntil: "domcontentloaded" });
await theme("light");
await page.waitForFunction(() => {
  const text = document.querySelector("[data-record='1']")?.innerText || "";
  return text.includes("Desk reading") && text.includes("not added") && text.includes("Balance");
}, null, { timeout: 30000 });
await page.locator(".c4-panel").evaluate((node) => { node.scrollTop = 500; });
await page.waitForTimeout(200);
const stuck = await page.evaluate(() => {
  const head = document.querySelector("[data-record='1']");
  const panel = document.querySelector(".c4-panel");
  if (!head || !panel) return false;
  return head.getBoundingClientRect().top <= panel.getBoundingClientRect().top + 2;
});
if (!stuck) throw new Error("header did not stick");
await page.locator(".c4-panel").evaluate((node) => { node.scrollTop = 0; });
await shot("crmv4-r31-after-record");
await theme("dark");
await shot("crmv4-r31-after-record-dark");

await page.setViewportSize({ width: 375, height: 812 });
await page.goto(`${base}/crmv4/customers/${id}`, { waitUntil: "domcontentloaded" });
await theme("light");
await page.waitForSelector("[data-record='1']");
await page.locator("[data-record='1']").scrollIntoViewIfNeeded();
await shot("crmv4-r31-after-record-phone");
await theme("dark");
await shot("crmv4-r31-after-record-phone-dark");

await page.setViewportSize({ width: 1440, height: 900 });
await page.goto(`${base}/crmv4/customers`, { waitUntil: "domcontentloaded" });
await theme("light");
await page.waitForSelector("[data-lists='1']");
await page.getByRole("textbox", { name: "List name" }).fill("Turkey first");
await page.getByRole("textbox", { name: "Country on the row" }).fill("TR");
await page.getByRole("button", { name: "Save list" }).click();
await page.waitForFunction(() => (document.querySelector(".c4-page-rail .c4-smart-rail")?.innerText || "").includes("Turkey first"));
const stored = await page.evaluate(() => window.localStorage.getItem("crmv4-smart-lists"));
if (!stored?.includes("Turkey first")) throw new Error(stored || "list missing");
await page.getByRole("button", { name: "Rename" }).click();
await page.getByRole("textbox", { name: "Rename" }).fill("TR loaded");
await page.getByRole("textbox", { name: "Rename" }).blur();
await page.getByRole("textbox", { name: "List name" }).fill("Open book");
await page.getByRole("button", { name: "Save list" }).click();
await page.getByRole("button", { name: "Move down" }).first().click();
await page.waitForFunction(() => {
  const text = document.querySelector(".c4-page-rail .c4-smart-rail")?.innerText || "";
  return /TR loaded · \d+/.test(text) && text.includes("Open book");
});
await shot("crmv4-r31-after-lists");
await theme("dark");
await shot("crmv4-r31-after-lists-dark");
await page.getByRole("link", { name: /TR loaded/ }).first().click();
await page.waitForFunction(() => (document.querySelector("[data-lists='1']")?.innerText || "").includes("Showing the loaded rows"));
await page.setViewportSize({ width: 375, height: 812 });
await page.getByRole("button", { name: "More" }).click();
await page.waitForFunction(() => (document.querySelector(".c4-more-luxe")?.innerText || "").includes("TR loaded"));
await shot("crmv4-r31-after-lists-phone");
if (errors.length) throw new Error(errors[0].slice(0, 300));
await browser.close();
