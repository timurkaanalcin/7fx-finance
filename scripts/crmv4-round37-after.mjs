/** After shots: document gallery and the audit timeline. */
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
async function show(selector) {
  await page.locator(selector).evaluate((node) => {
    const head = document.querySelector(".c4-record-head");
    if (head) head.style.position = "static";
    const panel = node.closest(".c4-panel") || document.querySelector(".c4-panel");
    if (!panel) return;
    const top = node.getBoundingClientRect().top - panel.getBoundingClientRect().top + panel.scrollTop;
    panel.scrollTop = Math.max(0, top - 12);
  });
  await page.waitForTimeout(150);
}

const people = await (await page.request.get(`${base}/api/admin/users?take=20&meta=0&role=TRADER`)).json();
const mehmet = (people.users || []).find((row) => String(row.name || "").includes("Mehmet"));
writes.length = 0;
await page.goto(`${base}/crmv4/customers/${mehmet.id}?part=files`, { waitUntil: "domcontentloaded" });
await theme("light");
await page.waitForFunction(() => (document.querySelector("[data-kyc='1']")?.innerText || "").includes("ID Back"), null, { timeout: 20000 });
await show("[data-kyc='1']");
await shot("crmv4-r37-after-docs");
const before = writes.length;
const preview = page.locator("[data-kyc='1']").getByRole("button", { name: "Preview" });
if (await preview.count()) {
  await preview.first().click();
  await page.waitForTimeout(300);
  if (writes.length !== before) throw new Error(`preview wrote ${writes.slice(before).join(" ")}`);
  await shot("crmv4-r37-after-docs-preview");
  await page.getByRole("button", { name: "Close", exact: true }).click();
}
const box = page.locator("[data-kyc='1']").getByRole("checkbox", { name: "Name matches" });
if (await box.count()) {
  await box.check();
  const saved = await page.evaluate((id) => window.localStorage.getItem("crmv4-kyc-check" + id), mehmet.id);
  if (!saved || !saved.includes("\"name\":true")) throw new Error(saved || "checklist missing");
  if (writes.length !== before) throw new Error("checklist wrote a request");
}
await theme("dark");
await show("[data-kyc='1']");
await shot("crmv4-r37-after-docs-dark");
await page.setViewportSize({ width: 375, height: 812 });
await theme("light");
await page.waitForSelector("[data-kyc='1']");
await show("[data-kyc='1']");
await shot("crmv4-r37-after-docs-phone");
await theme("dark");
await show("[data-kyc='1']");
await shot("crmv4-r37-after-docs-phone-dark");

await page.setViewportSize({ width: 1440, height: 900 });
await page.goto(`${base}/crmv4/logs`, { waitUntil: "domcontentloaded" });
await theme("light");
await page.waitForFunction(() => {
  const text = (document.querySelector("[data-audit='1']")?.innerText || "").toLowerCase();
  return text.includes("loaded audit") && (text.includes("rows in this window") || text.includes("no loaded row"));
}, null, { timeout: 20000 });
await show("[data-audit='1']");
await shot("crmv4-r37-after-audit");
const auditWrites = writes.length;
const actor = page.locator("[data-audit='1']").getByLabel("Actor");
if (await actor.count()) {
await actor.fill("zzzz-none");
await page.waitForFunction(() => (document.querySelector("[data-audit='1']")?.innerText || "").includes("No loaded row for this filter") || (document.querySelector("[data-audit='1']")?.innerText || "").includes("Rows in this window · 0"));
if (writes.length !== auditWrites) throw new Error("filter wrote");
await page.locator("[data-audit='1']").getByLabel("Actor").fill("");
await page.locator("[data-audit='1']").getByRole("button", { name: "Export loaded rows" }).click();
await page.waitForTimeout(200);
if (writes.length !== auditWrites) throw new Error(`export wrote ${writes.slice(auditWrites).join(" ")}`);
}
await theme("dark");
await show("[data-audit='1']");
await shot("crmv4-r37-after-audit-dark");
await page.setViewportSize({ width: 375, height: 812 });
await theme("light");
await show("[data-audit='1']");
await shot("crmv4-r37-after-audit-phone");
await theme("dark");
await show("[data-audit='1']");
await shot("crmv4-r37-after-audit-phone-dark");

if (errors.length) throw new Error(errors[0].slice(0, 400));
await browser.close();
console.log("after done", "writes", writes.length);
