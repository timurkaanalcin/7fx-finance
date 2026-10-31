/** After shots: risk review and the day timeline. Six images. */
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
  if (req.method() === "GET" || url.includes("/api/auth/")) return;
  if (url.includes("/api/admin/documents") || url.includes("/api/admin/users/")) sent.push(`${req.method()} ${url}`);
});
const login = await page.request.post(`${base}/api/auth/login`, {
  form: { email: "admin@7fx.local", password: "Admin123!", nav: "1" },
  maxRedirects: 0,
});
if (login.status() >= 400) throw new Error(await login.text());
await page.addInitScript(() => {
  window.localStorage.setItem("crmv4-tour-done", "1");
  window.localStorage.setItem("crmv4-risk-thresholds", JSON.stringify({ USD: 1, TRY: 1 }));
  window.localStorage.setItem("crmv4-risk-count", "2");
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
await page.goto(`${base}/crmv4/risk`, { waitUntil: "domcontentloaded" });
await theme("light");
await page.waitForSelector("[data-risk]");
await page.waitForFunction(() => /Loaded [1-9]/.test(document.querySelector("[data-risk]")?.textContent || ""));
await shot("crmv4-r44-after-risk-light");
await theme("dark");
await shot("crmv4-r44-after-risk-dark");
await page.setViewportSize({ width: 375, height: 812 });
await theme("light");
await shot("crmv4-r44-after-risk-phone");
await page.setViewportSize({ width: 1440, height: 900 });
await page.goto(`${base}/crmv4/customers/cmvvx5ksn000f7a6gqlnaxj8u?part=activity`, { waitUntil: "domcontentloaded" });
await theme("light");
await page.waitForSelector("[data-timeline]");
const closeForm = page.getByRole("button", { name: "Close form" });
if (await closeForm.count()) await closeForm.first().click();
await page.evaluate(() => {
  const node = document.querySelector("[data-timeline]");
  const panel = document.querySelector(".c4-panel");
  if (!node || !panel) return;
  const top = node.getBoundingClientRect().top - panel.getBoundingClientRect().top + panel.scrollTop;
  panel.scrollTop = Math.max(0, top - 8);
});
await page.waitForTimeout(200);
await shot("crmv4-r44-after-timeline-light");
await theme("dark");
await page.evaluate(() => {
  const node = document.querySelector("[data-timeline]");
  const panel = document.querySelector(".c4-panel");
  if (!node || !panel) return;
  const top = node.getBoundingClientRect().top - panel.getBoundingClientRect().top + panel.scrollTop;
  panel.scrollTop = Math.max(0, top - 8);
});
await shot("crmv4-r44-after-timeline-dark");
await page.setViewportSize({ width: 375, height: 812 });
await theme("light");
if (await closeForm.count()) await closeForm.first().click();
await page.evaluate(() => {
  const node = document.querySelector("[data-timeline]");
  const panel = document.querySelector(".c4-panel");
  if (!node || !panel) return;
  const top = node.getBoundingClientRect().top - panel.getBoundingClientRect().top + panel.scrollTop;
  panel.scrollTop = Math.max(0, top - 8);
});
await shot("crmv4-r44-after-timeline-phone");
if (sent.length) throw new Error(sent.join("\n"));
await browser.close();
console.log("round 44 after done");
