/** After shots: reports and My day. Six images, plus two before, stay under ten. */
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
  if (req.method() !== "GET" && req.url().includes("/api/") && !req.url().includes("/api/auth/")) sent.push(`${req.method()} ${req.url()}`);
});
const login = await page.request.post(`${base}/api/auth/login`, {
  form: { email: "admin@7fx.local", password: "Admin123!", nav: "1" },
  maxRedirects: 0,
});
if (login.status() >= 400) throw new Error(await login.text());
await page.addInitScript(() => {
  window.localStorage.setItem("crmv4-tour-done", "1");
  window.localStorage.setItem("crmv4-tasks", JSON.stringify({ local: [{ id: "call", text: "Call the loaded file", done: false }] }));
  window.localStorage.setItem("crmv4-smart-lists", JSON.stringify([{ id: "hot", name: "Turkey desk", rules: { kyc: "", stage: "", country: "TR", ftd: "" } }]));
  window.localStorage.setItem("crmv4-list-pins", JSON.stringify(["hot"]));
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
await page.goto(`${base}/crmv4/reports`, { waitUntil: "domcontentloaded" });
await theme("light");
await page.waitForSelector("[data-report='deposits']");
await page.waitForFunction(() => {
  const text = document.querySelector("[data-report='deposits']")?.textContent || "";
  return /Rows [1-9]/.test(text);
});
await shot("crmv4-r43-after-reports-light");
await theme("dark");
await shot("crmv4-r43-after-reports-dark");
await page.setViewportSize({ width: 375, height: 812 });
await theme("light");
await page.evaluate(() => {
  const node = document.querySelector("[data-report='deposits']");
  const panel = document.querySelector(".c4-panel");
  if (!node || !panel) return;
  const top = node.getBoundingClientRect().top - panel.getBoundingClientRect().top + panel.scrollTop;
  panel.scrollTop = Math.max(0, top - 8);
});
await shot("crmv4-r43-after-reports-phone");
await page.setViewportSize({ width: 1440, height: 900 });
await page.goto(`${base}/crmv4/day`, { waitUntil: "domcontentloaded" });
await theme("light");
await page.waitForSelector("[data-day-block='lists']");
await page.waitForFunction(() => /Loaded customers [1-9]/.test(document.querySelector("[data-day]")?.textContent || ""));
await page.getByRole("button", { name: "Unpin" }).waitFor();
await shot("crmv4-r43-after-day-light");
await theme("dark");
await shot("crmv4-r43-after-day-dark");
await page.setViewportSize({ width: 375, height: 812 });
await theme("light");
await shot("crmv4-r43-after-day-phone");
const posts = sent.filter((row) => row.startsWith("POST") || row.startsWith("PATCH") || row.startsWith("PUT") || row.startsWith("DELETE"));
if (posts.length) throw new Error(posts.join("\n"));
await browser.close();
console.log("round 43 after done");
