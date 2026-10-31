/** After shots: desk bar, notices, and segments. */
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
  if ((req.method() === "POST" || req.method() === "PATCH") && !req.url().includes("/api/auth/login")) writes.push(`${req.method()} ${req.url()}`);
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

writes.length = 0;
await page.goto(`${base}/crmv4`, { waitUntil: "domcontentloaded" });
await theme("light");
await page.waitForSelector("[data-bar='1']");
await page.locator("[data-bar='1']").getByRole("button", { name: "Notifications" }).click();
await page.waitForFunction(() => {
  const text = document.querySelector("[data-notes-desk='1']")?.innerText || "";
  return text.includes("Loaded notices") && /TRY|US\$|KYC|Deposits/.test(text);
}, null, { timeout: 20000 });
await shot("crmv4-r38-after-notes");
const before = writes.length;
await page.locator("[data-notes-desk='1']").getByRole("button", { name: "Mark read here" }).first().click();
const saved = await page.evaluate(() => window.localStorage.getItem("crmv4-notif-read"));
if (!saved || saved === "[]") throw new Error(saved || "read missing");
if (writes.length !== before) throw new Error(`mark wrote ${writes.slice(before).join(" ")}`);
await page.getByRole("button", { name: "Close", exact: true }).click();
await shot("crmv4-r38-after-top");
await theme("dark");
await shot("crmv4-r38-after-top-dark");
await page.setViewportSize({ width: 375, height: 812 });
await theme("light");
await page.waitForSelector("[data-bar='1']");
await shot("crmv4-r38-after-top-phone");
await theme("dark");
await shot("crmv4-r38-after-top-phone-dark");

await page.setViewportSize({ width: 1440, height: 900 });
await page.goto(`${base}/crmv4/marketing`, { waitUntil: "domcontentloaded" });
await theme("light");
await page.waitForFunction(() => {
  const text = document.querySelector("[data-seg='1']")?.innerText || "";
  return text.includes("Customers in this segment") && /Mehmet|TR|USD|TRY/.test(text);
}, null, { timeout: 20000 });
await page.locator("[data-seg='1']").evaluate((node) => {
  const panel = node.closest(".c4-panel");
  if (!panel) return;
  const top = node.getBoundingClientRect().top - panel.getBoundingClientRect().top + panel.scrollTop;
  panel.scrollTop = Math.max(0, top - 8);
});
await shot("crmv4-r38-after-seg");
const segWrites = writes.length;
await page.locator("[data-seg='1']").getByLabel("Country").selectOption({ label: "TR" }).catch(async () => {
  await page.locator("[data-seg='1']").getByLabel("Country").selectOption("TR");
});
await page.waitForTimeout(200);
if (writes.length !== segWrites) throw new Error("segment filter wrote");
await page.locator("[data-seg='1']").getByRole("button", { name: "Export this segment" }).click();
await page.waitForTimeout(200);
if (writes.length !== segWrites) throw new Error(`export wrote ${writes.slice(segWrites).join(" ")}`);
await shot("crmv4-r38-after-seg-filtered");
await theme("dark");
await shot("crmv4-r38-after-seg-dark");
await page.setViewportSize({ width: 375, height: 812 });
await theme("light");
await page.locator("[data-seg='1']").evaluate((node) => node.scrollIntoView({ block: "start" }));
await shot("crmv4-r38-after-seg-phone");
await theme("dark");
await shot("crmv4-r38-after-seg-phone-dark");

if (errors.length) throw new Error(errors[0].slice(0, 400));
await browser.close();
console.log("after done");
