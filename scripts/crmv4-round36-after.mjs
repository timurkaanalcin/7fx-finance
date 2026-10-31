/** After shots: finance ledger, desk sign-in, empty and error cards. */
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
  console.log("saved", name, "overflow", overflow);
}
async function showLedger() {
  await page.locator("[data-ledger='1']").evaluate((node) => {
    let parent = node.parentElement;
    while (parent) {
      const style = getComputedStyle(parent);
      if (/(auto|scroll)/.test(style.overflowY) && parent.scrollHeight > parent.clientHeight + 8) {
        const top = node.getBoundingClientRect().top - parent.getBoundingClientRect().top + parent.scrollTop;
        parent.scrollTop = Math.max(0, top - 8);
        return;
      }
      parent = parent.parentElement;
    }
    node.scrollIntoView({ block: "start" });
  });
  await page.waitForTimeout(250);
}

const people = await page.request.get(`${base}/api/admin/users?take=20&meta=0&role=TRADER`);
const body = await people.json();
const mehmet = (body.users || []).find((row) => String(row.name || "").includes("Mehmet"));
if (!mehmet) throw new Error("no mehmet");
console.log("assignee", mehmet.assigneeId, mehmet.assigneeName);

writes.length = 0;
await page.goto(`${base}/crmv4/customers/${mehmet.id}?part=money`, { waitUntil: "domcontentloaded" });
await theme("light");
await page.waitForFunction(() => {
  const text = document.querySelector("[data-ledger='1']")?.innerText || "";
  return text.includes("Loaded money") && text.includes("Deposit totals") && /TRY|US\$/.test(text);
}, null, { timeout: 30000 });
await showLedger();
await page.locator("[data-ledger='1']").screenshot({ path: path.join(out, "crmv4-r36-after-money-card.png") });
await shot("crmv4-r36-after-money");
const beforeWrites = writes.length;
await page.locator("[data-ledger='1']").getByRole("button", { name: "Withdrawals" }).click();
await page.waitForTimeout(200);
if (writes.length !== beforeWrites) throw new Error(`filter wrote ${writes.slice(beforeWrites).join(" ")}`);
await page.locator("[data-ledger='1']").getByLabel("From").fill("1999-01-01");
await page.locator("[data-ledger='1']").getByLabel("To").fill("1999-01-02");
await page.waitForFunction(() => (document.querySelector("[data-ledger='1']")?.innerText || "").includes("No loaded row"));
if (writes.length !== beforeWrites) throw new Error("date filter wrote");
await showLedger();
await shot("crmv4-r36-after-money-empty");
await page.locator("[data-ledger='1']").getByLabel("From").fill("");
await page.locator("[data-ledger='1']").getByLabel("To").fill("");
await page.locator("[data-ledger='1']").getByRole("button", { name: "Both" }).click();
await page.waitForFunction(() => /TRY|US\$/.test(document.querySelector("[data-ledger='1']")?.innerText || ""));
await theme("dark");
await showLedger();
await shot("crmv4-r36-after-money-dark");

await page.setViewportSize({ width: 375, height: 812 });
await page.goto(`${base}/crmv4/customers/${mehmet.id}?part=money`, { waitUntil: "domcontentloaded" });
await theme("light");
await page.waitForSelector("[data-ledger='1']");
await page.waitForFunction(() => /TRY|US\$|None in this window/.test(document.querySelector("[data-ledger='1']")?.innerText || ""));
await showLedger();
await page.locator("[data-ledger='1']").screenshot({ path: path.join(out, "crmv4-r36-after-money-phone-card.png") });
await shot("crmv4-r36-after-money-phone");
await theme("dark");
await showLedger();
await shot("crmv4-r36-after-money-phone-dark");

await page.setViewportSize({ width: 1440, height: 900 });
await page.route("**/api/admin/users/**", (route) => {
  const url = route.request().url();
  if (url.includes("view=tickets")) return route.abort();
  return route.continue();
});
await page.goto(`${base}/crmv4/customers/${mehmet.id}?part=money`, { waitUntil: "domcontentloaded" });
await theme("light");
await page.waitForSelector("[data-error='1']", { timeout: 20000 });
await page.locator("[data-error='1']").evaluate((node) => node.scrollIntoView({ block: "center" }));
await shot("crmv4-r36-after-error");
await page.unroute("**/api/admin/users/**");
await page.locator("[data-error='1']").getByRole("button", { name: "Try again" }).click();
await page.waitForFunction(() => {
  const text = document.querySelector("[data-ledger='1']")?.innerText || "";
  return text.includes("Deposit totals");
}, null, { timeout: 20000 });
console.log("retry restored the ledger");

await page.goto(`${base}/crmv4/roster`, { waitUntil: "domcontentloaded" });
await theme("light");
await page.waitForFunction(() => (document.querySelector("[data-staff='1']")?.innerText || "").includes("7FX Admin"), null, { timeout: 20000 });
await page.locator("[data-staff='1']").evaluate((node) => node.scrollIntoView({ block: "start" }));
await shot("crmv4-r36-after-roster");

const guest = await browser.newContext();
const door = await guest.newPage();
async function doorShot(name) {
  const overflow = await door.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (overflow > 1) throw new Error(`${name} overflow ${overflow}`);
  const text = await door.locator("body").innerText();
  if (text.includes("[object Object]")) throw new Error(`${name} object`);
  await door.screenshot({ path: path.join(out, `${name}.png`) });
  console.log("saved", name, "overflow", overflow);
}
await door.setViewportSize({ width: 1440, height: 900 });
await door.goto(`${base}/login?desk=crmv4`, { waitUntil: "domcontentloaded" });
await door.waitForSelector("[data-signin='1']");
await door.waitForFunction(() => (document.querySelector("[data-signin='1']")?.innerText || "").includes("Sign in to the desk"));
await doorShot("crmv4-r36-after-login");
await door.getByRole("button", { name: "Theme" }).click();
await door.waitForFunction(() => document.querySelector("[data-signin='1']")?.getAttribute("data-theme") === "dark");
await doorShot("crmv4-r36-after-login-dark");
await door.setViewportSize({ width: 375, height: 812 });
await doorShot("crmv4-r36-after-login-phone-dark");
await door.getByRole("button", { name: "Theme" }).click();
await door.waitForFunction(() => document.querySelector("[data-signin='1']")?.getAttribute("data-theme") === "light");
await doorShot("crmv4-r36-after-login-phone");
await door.setViewportSize({ width: 1440, height: 900 });
await door.goto(`${base}/login`, { waitUntil: "domcontentloaded" });
await door.waitForFunction(() => document.body.innerText.includes("Return to your account"));
if (await door.locator("[data-signin='1']").count()) throw new Error("public login picked up the desk shell");
await doorShot("crmv4-r36-after-login-public");
await guest.close();

if (errors.length) throw new Error(errors[0].slice(0, 400));
if (writes.length) throw new Error(writes.join("\n"));
await browser.close();
console.log("after done");
