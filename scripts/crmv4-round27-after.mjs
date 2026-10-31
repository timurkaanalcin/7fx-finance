/** After shots: document review and the reports center. */
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
await page.goto(`${base}/crmv4/kyc`, { waitUntil: "domcontentloaded" });
await theme("light");
await page.waitForSelector("[data-kyc='1'] .c4-kyc-queue button", { timeout: 30000 });
const desk = await page.locator("[data-kyc='1']").innerText();
if (!desk.includes("No file on the loaded row")) throw new Error("missing empty preview");
if (!desk.includes("does not approve")) throw new Error("missing checklist honesty");
await page.getByRole("checkbox", { name: "Name matches" }).check();
const stored = await page.evaluate(() => window.localStorage.getItem("crmv4-doc-review"));
if (!stored?.includes("\"name\":true")) throw new Error(stored || "checklist missing");
await page.locator("[data-kyc='1']").scrollIntoViewIfNeeded();
await page.evaluate(() => { const panel = document.querySelector(".c4-panel"); if (panel) panel.scrollTop = 0; });
await shot("crmv4-r27-after-kyc", 1440, "light");
await theme("dark");
await shot("crmv4-r27-after-kyc-dark", 1440, "dark");

await page.setViewportSize({ width: 375, height: 812 });
await page.goto(`${base}/crmv4/kyc`, { waitUntil: "domcontentloaded" });
await theme("light");
await page.waitForSelector("[data-kyc='1'] .c4-kyc-queue button");
await page.locator("[data-kyc='1']").scrollIntoViewIfNeeded();
await shot("crmv4-r27-after-kyc-phone", 375, "light");
await theme("dark");
await shot("crmv4-r27-after-kyc-phone-dark", 375, "dark");

await page.setViewportSize({ width: 1440, height: 900 });
await page.goto(`${base}/crmv4/kyc`, { waitUntil: "domcontentloaded" });
await theme("light");
const proof = page.getByText("Proof of address");
if (await proof.count()) {
  await page.getByRole("button", { name: "Approve" }).click();
  await page.waitForFunction(() => !(document.querySelector("[data-kyc='1']")?.innerText || "").includes("Proof of address"), null, { timeout: 15000 });
}

await page.goto(`${base}/crmv4/reports`, { waitUntil: "domcontentloaded" });
await theme("light");
await page.waitForFunction(() => /US\$|TRY/.test(document.querySelector("[data-reports='1']")?.innerText || ""), null, { timeout: 30000 });
const report = await page.locator("[data-reports='1']").innerText();
if (!report.includes("Currencies stay apart")) throw new Error("reports hint missing");
await page.getByRole("button", { name: "TRY", exact: true }).click();
const filtered = await page.locator("[data-report='deposits']").innerText();
if (filtered.includes("US$")) throw new Error(`mixed deposit view ${filtered.slice(0, 200)}`);
if (!filtered.includes("TRY")) throw new Error("TRY total missing");
await page.locator("[data-reports='1']").scrollIntoViewIfNeeded();
await page.evaluate(() => { const panel = document.querySelector(".c4-panel"); if (panel) panel.scrollTop = 0; });
await shot("crmv4-r27-after-reports", 1440, "light");
await theme("dark");
await shot("crmv4-r27-after-reports-dark", 1440, "dark");

await page.setViewportSize({ width: 375, height: 812 });
await page.goto(`${base}/crmv4/reports`, { waitUntil: "domcontentloaded" });
await theme("light");
await page.waitForFunction(() => (document.querySelector("[data-report='customers']")?.innerText || "").includes("@"), null, { timeout: 30000 });
await page.locator("[data-reports='1']").scrollIntoViewIfNeeded();
await shot("crmv4-r27-after-reports-phone", 375, "light");
await theme("dark");
await shot("crmv4-r27-after-reports-phone-dark", 375, "dark");

const real = errors.filter((line) => !/favicon|Download the React DevTools/.test(line));
if (real.length) throw new Error(real[0].slice(0, 500));
await browser.close();
