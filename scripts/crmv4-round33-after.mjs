/** After shots: the read-only book and the follow-up agenda. */
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
const posts = [];
page.on("pageerror", (err) => errors.push(String(err)));
page.on("request", (req) => { if (req.method() === "POST" || req.method() === "PATCH") posts.push(req.url()); });
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
  const text = document.querySelector("[data-book='1']")?.innerText || "";
  return text.includes("does not open, close, or change a trade") && text.includes("No loaded position");
}, null, { timeout: 30000 });
const close = await page.locator("[data-book='1']").getByRole("button", { name: /close position/i }).count();
if (close) throw new Error("book has a trade action");
await page.locator("[data-book='1']").scrollIntoViewIfNeeded();
await shot("crmv4-r33-after-book");
await theme("dark");
await shot("crmv4-r33-after-book-dark");

await page.setViewportSize({ width: 375, height: 812 });
await page.goto(`${base}/crmv4/customers/${id}`, { waitUntil: "domcontentloaded" });
await theme("light");
const form = page.getByRole("button", { name: "Close form" });
if (await form.count()) await form.click();
await page.waitForSelector("[data-book='1']");
await page.locator("[data-book='1']").scrollIntoViewIfNeeded();
await shot("crmv4-r33-after-book-phone");
await theme("dark");
await shot("crmv4-r33-after-book-phone-dark");

await page.setViewportSize({ width: 1440, height: 900 });
posts.length = 0;
await page.goto(`${base}/crmv4/agenda`, { waitUntil: "domcontentloaded" });
await theme("light");
await page.waitForFunction(() => {
  const text = document.querySelector("[data-agenda='1']")?.innerText || "";
  return text.includes("Mehmet") && text.includes("Overdue") && text.includes("Nobody is paged");
}, null, { timeout: 30000 });
const mehmet = page.locator("[data-agenda='1'] li", { hasText: "Mehmet" }).first();
await mehmet.locator("input[type='date']").fill("2026-11-01");
await page.waitForFunction(() => (document.querySelector("[data-agenda='1']")?.innerText || "").includes("This browser"));
if (posts.some((url) => url.includes("/retention") || url.includes("/positions"))) throw new Error(posts.join(" "));
await page.locator(".c4-panel").evaluate((node) => { node.scrollTop = 0; });
await shot("crmv4-r33-after-agenda");
await theme("dark");
await shot("crmv4-r33-after-agenda-dark");

await page.setViewportSize({ width: 375, height: 812 });
await page.goto(`${base}/crmv4/agenda`, { waitUntil: "domcontentloaded" });
await theme("light");
await page.waitForSelector("text=Mehmet");
await page.locator("[data-agenda='1']").scrollIntoViewIfNeeded();
await shot("crmv4-r33-after-agenda-phone");
if (errors.length) throw new Error(errors[0].slice(0, 300));
await browser.close();
