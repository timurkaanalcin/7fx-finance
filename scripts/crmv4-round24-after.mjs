/** After shots: onboarding checklist, registration-week cohort, staff profile. */
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

async function uncover() {
  const hide = page.getByRole("button", { name: "Hide filters" });
  if (await hide.count()) await hide.first().click({ force: true });
  const close = page.getByRole("button", { name: "Close form" });
  if (await close.count()) {
    await close.first().click({ force: true });
    await page.waitForTimeout(200);
  }
}

async function shot(name, width, mode) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (overflow > 1) throw new Error(`${name} overflow ${overflow}`);
  await page.screenshot({ path: path.join(out, `${name}.png`) });
  console.log("saved", name, mode, width, "overflow", overflow);
}

async function openAt(url, width, mode) {
  await page.setViewportSize({ width, height: width < 500 ? 812 : 900 });
  await page.goto(`${base}${url}`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("[data-crmv4-root]", { timeout: 30000 });
  await theme(mode);
}

await openAt(`/crmv4/customers/${id}`, 1440, "light");
await page.waitForFunction(() => (document.querySelector(".c4-onboard-luxe")?.textContent || "").includes("28 Oct"), null, { timeout: 30000 });
const onboard = await page.locator(".c4-onboard-luxe").innerText();
if (!onboard.includes("Registered") || !onboard.includes("No date on the loaded row")) {
  throw new Error(`onboard text missing: ${onboard.slice(0, 240)}`);
}
await page.locator(".c4-onboard-luxe").scrollIntoViewIfNeeded();
await page.waitForTimeout(300);
await shot("crmv4-r24-after-onboard", 1440, "light");
await theme("dark");
await shot("crmv4-r24-after-onboard-dark", 1440, "dark");

await openAt(`/crmv4/customers/${id}`, 375, "light");
await page.waitForFunction(() => (document.querySelector(".c4-onboard-luxe")?.textContent || "").includes("28 Oct"), null, { timeout: 30000 });
await uncover();
await page.locator(".c4-onboard-luxe").scrollIntoViewIfNeeded();
await page.waitForTimeout(250);
await shot("crmv4-r24-after-onboard-phone", 375, "light");
await theme("dark");
await shot("crmv4-r24-after-onboard-phone-dark", 375, "dark");

await openAt("/crmv4/customers", 1440, "light");
await page.waitForSelector(".c4-cohort-list li", { timeout: 30000 });
await uncover();
const cohort = await page.locator(".c4-cohort-luxe").innerText();
if (!/20\d\d-W\d\d/.test(cohort)) throw new Error(`cohort week missing: ${cohort.slice(0, 240)}`);
await page.locator(".c4-cohort-luxe").scrollIntoViewIfNeeded();
await page.waitForTimeout(250);
await shot("crmv4-r24-after-cohort", 1440, "light");
await theme("dark");
await shot("crmv4-r24-after-cohort-dark", 1440, "dark");

await openAt("/crmv4/customers", 375, "light");
await page.waitForSelector(".c4-cohort-list li");
await uncover();
await page.locator(".c4-cohort-luxe").scrollIntoViewIfNeeded();
await page.waitForTimeout(250);
await shot("crmv4-r24-after-cohort-phone", 375, "light");
await theme("dark");
await shot("crmv4-r24-after-cohort-phone-dark", 375, "dark");

await openAt("/crmv4/me", 1440, "light");
await page.waitForSelector("[data-staff='1']");
const sign = await page.locator(".c4-staff-sign").innerText();
if (!sign.includes("Sign-in name") || sign.trim().endsWith("—")) throw new Error(`sign-in name missing: ${sign}`);
await page.getByLabel("Name shown here").fill("Desk Ivory");
await page.getByLabel("Customer filters").fill("saleStatus=NEW");
await page.getByLabel("Work starts").fill("09:30");
await page.getByLabel("Work ends").fill("17:30");
await page.getByRole("button", { name: "Dense rows" }).click();
const stored = await page.evaluate(() => ({
  prefs: window.localStorage.getItem("crmv4-staff-prefs"),
  density: window.localStorage.getItem("crmv4-density"),
}));
if (!stored.prefs?.includes("Desk Ivory") || !stored.prefs.includes("saleStatus=NEW")) throw new Error(`prefs ${stored.prefs}`);
if (stored.density !== "compact") throw new Error(`density ${stored.density}`);
const shown = await page.locator(".c4-staff-name").innerText();
if (shown !== "Desk Ivory") throw new Error(`shown ${shown}`);
await page.evaluate(() => {
  const panel = document.querySelector(".c4-panel");
  if (panel) panel.scrollTop = 0;
});
await page.waitForTimeout(250);
await shot("crmv4-r24-after-profile", 1440, "light");
await page.getByRole("button", { name: "Dark theme" }).click();
await page.waitForFunction(() => document.querySelector("[data-crmv4-root]")?.getAttribute("data-theme") === "dark");
await shot("crmv4-r24-after-profile-dark", 1440, "dark");

await openAt("/crmv4/me", 375, "light");
await page.waitForSelector(".c4-staff-name");
await page.locator(".c4-staff-luxe").scrollIntoViewIfNeeded();
await page.waitForTimeout(200);
await shot("crmv4-r24-after-profile-phone", 375, "light");
await theme("dark");
await shot("crmv4-r24-after-profile-phone-dark", 375, "dark");

const openFilters = await page.getByRole("link", { name: "Open customers with these filters" }).getAttribute("href");
if (!openFilters?.includes("saleStatus=NEW")) throw new Error(`filters href ${openFilters}`);
await page.getByRole("button", { name: "Reset these preferences" }).click();
const reset = await page.evaluate(() => window.localStorage.getItem("crmv4-staff-prefs"));
if (reset?.includes("Desk Ivory")) throw new Error(`reset left name ${reset}`);
console.log("errors", errors.filter((line) => !/favicon|Download the React DevTools/.test(line)).slice(0, 8));
await browser.close();
