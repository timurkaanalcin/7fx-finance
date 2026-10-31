/** After shots: ticket inbox and introducer stats. Confirms stay closed. */
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
  if (req.method() === "GET" || req.url().includes("/api/auth/")) return;
  if (req.method() === "POST" || req.method() === "PATCH") sent.push(`${req.method()} ${req.url()}`);
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
await page.goto(`${base}/crmv4/support`, { waitUntil: "domcontentloaded" });
await theme("light");
await page.waitForSelector("[data-ticket-inbox]");
await page.waitForSelector(".c4-ticket-row");
await show("[data-ticket-inbox]");
await shot("crmv4-r44b-after-tickets-light");
await theme("dark");
await show("[data-ticket-inbox]");
await shot("crmv4-r44b-after-tickets-dark");
await page.setViewportSize({ width: 375, height: 812 });
await theme("light");
await show("[data-ticket-inbox]");
await shot("crmv4-r44b-after-tickets-phone");
await page.setViewportSize({ width: 1440, height: 900 });
await page.goto(`${base}/crmv4/affiliates`, { waitUntil: "domcontentloaded" });
await theme("light");
await page.waitForSelector("[data-affiliates]");
await page.waitForFunction(() => /Loaded customers [1-9]/.test(document.querySelector("[data-affiliates]")?.textContent || ""));
await shot("crmv4-r44b-after-affiliates-light");
await theme("dark");
await shot("crmv4-r44b-after-affiliates-dark");
await page.setViewportSize({ width: 375, height: 812 });
await theme("light");
await shot("crmv4-r44b-after-affiliates-phone");
if (sent.length) throw new Error(sent.join("\n"));
await browser.close();
console.log("after done");
