/** After shots: customer timeline and overview card arranger. */
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

async function closeCovers() {
  const hide = page.getByRole("button", { name: "Hide filters" });
  if (await hide.count()) await hide.first().click({ force: true });
  const close = page.getByRole("button", { name: "Close form" });
  if (await close.count()) await close.first().click({ force: true });
}

async function shot(name, width, mode) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (overflow > 1) throw new Error(`${name} overflow ${overflow}`);
  await page.screenshot({ path: path.join(out, `${name}.png`) });
  console.log("saved", name, mode, width);
}

await page.setViewportSize({ width: 1440, height: 900 });
await page.goto(`${base}/crmv4/customers/${id}`, { waitUntil: "domcontentloaded" });
await theme("light");
await page.waitForSelector("[data-line='1'] li[data-kind='deposit']", { timeout: 30000 });
const line = await page.locator("[data-line='1']").innerText();
if (!line.includes("Deposit") || !line.includes("TRY is") && !line.includes("currency on the row")) throw new Error(line.slice(0, 240));
if (!/US\$|TRY/.test(line)) throw new Error(`money missing ${line.slice(0, 240)}`);
await page.locator("[data-line='1']").scrollIntoViewIfNeeded();
await shot("crmv4-r26-after-line", 1440, "light");
await theme("dark");
await shot("crmv4-r26-after-line-dark", 1440, "dark");
await page.getByRole("button", { name: /^Deposit / }).click();
await page.getByRole("button", { name: /^Withdrawal / }).click();
await page.getByRole("button", { name: /^Position / }).click();
await page.getByRole("button", { name: /^Ticket / }).click();
await page.getByRole("button", { name: /^Call / }).click();
const notesOnly = await page.locator("[data-line='1']").innerText();
if (notesOnly.includes("US$")) throw new Error("deposit still visible");

await page.setViewportSize({ width: 375, height: 812 });
await page.goto(`${base}/crmv4/customers/${id}`, { waitUntil: "domcontentloaded" });
await theme("light");
await page.waitForSelector("[data-line='1'] li[data-kind='withdrawal']", { timeout: 30000 });
await closeCovers();
await page.locator("[data-line='1']").scrollIntoViewIfNeeded();
await shot("crmv4-r26-after-line-phone", 375, "light");
await theme("dark");
await shot("crmv4-r26-after-line-phone-dark", 375, "dark");

await page.setViewportSize({ width: 1440, height: 900 });
await page.goto(`${base}/crmv4`, { waitUntil: "domcontentloaded" });
await theme("light");
await page.waitForSelector("[data-arrange='1']", { timeout: 30000 });
await page.locator("[data-arrange='1']").scrollIntoViewIfNeeded();
await page.getByRole("checkbox", { name: "Show Alerts" }).click();
await page.getByRole("button", { name: "Move up Rates" }).click();
const stored = await page.evaluate(() => window.localStorage.getItem("crmv4-overview-layout"));
if (!stored?.includes("alerts") || !stored.includes("fx")) throw new Error(stored || "missing layout");
const parsed = JSON.parse(stored);
if (parsed.order[0] !== "fx") throw new Error(`order ${parsed.order.slice(0, 3)}`);
if (!parsed.hidden.includes("alerts")) throw new Error(`hidden ${parsed.hidden}`);
await page.waitForFunction(() => !document.querySelector("[data-card='alerts']"));
await shot("crmv4-r26-after-arrange", 1440, "light");
await theme("dark");
await shot("crmv4-r26-after-arrange-dark", 1440, "dark");

await page.setViewportSize({ width: 375, height: 812 });
await page.goto(`${base}/crmv4`, { waitUntil: "domcontentloaded" });
await theme("light");
await page.waitForSelector("[data-arrange='1']");
await page.locator("[data-arrange='1']").scrollIntoViewIfNeeded();
await shot("crmv4-r26-after-arrange-phone", 375, "light");
await theme("dark");
await shot("crmv4-r26-after-arrange-phone-dark", 375, "dark");
await page.getByRole("button", { name: "Reset this arrangement" }).click();
const reset = JSON.parse(await page.evaluate(() => window.localStorage.getItem("crmv4-overview-layout") || "{}"));
if (reset.hidden?.length) throw new Error("reset left hidden cards");
if (reset.order?.[0] !== "alerts") throw new Error(`reset order ${reset.order?.[0]}`);

const real = errors.filter((line) => !/favicon|Download the React DevTools/.test(line));
if (real.length) throw new Error(real[0].slice(0, 500));
await browser.close();
