/** After shots and a regression sweep for the grouped rail. */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const out = "/opt/cursor/artifacts/screenshots";
fs.mkdirSync(out, { recursive: true });
const base = "http://127.0.0.1:3000";
const pages = [
  "/crmv4",
  "/crmv4/customers",
  "/crmv4/finance",
  "/crmv4/finance?tab=withdrawals",
  "/crmv4/finance?tab=ledger",
  "/crmv4/positions",
  "/crmv4/support",
  "/crmv4/support?tab=chat",
  "/crmv4/marketing",
  "/crmv4/settings",
  "/crmv4/logs",
  "/crmv4/control",
  "/crmv4/me",
  "/crmv4/goals",
  "/crmv4/kyc",
  "/crmv4/reports",
  "/crmv4/withdraw",
  "/crmv4/deposit",
  "/crmv4/inbox",
];
const widths = [1440, 1024, 768, 390, 375];
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
const customers = await page.request.get(`${base}/api/admin/users?take=1`);
const body = await customers.json();
const userId = body.users?.[0]?.id || body.rows?.[0]?.id || "";

async function theme(mode) {
  await page.evaluate((value) => {
    window.localStorage.setItem("crmv4-theme-mode", value);
    window.dispatchEvent(new Event("crmv4:theme-mode"));
  }, mode);
  await page.waitForFunction((value) => document.querySelector("[data-crmv4-root]")?.getAttribute("data-theme") === value, mode);
}

const issues = [];
if (process.env.SKIP_SWEEP !== "1") for (const mode of ["light", "dark"]) {
  for (const width of widths) {
    await page.setViewportSize({ width, height: width < 500 ? 812 : 900 });
    const paths = userId ? [...pages, `/crmv4/customers/${userId}`] : pages;
    for (const url of paths) {
      errors.length = 0;
      await page.goto(`${base}${url}`, { waitUntil: "domcontentloaded" });
      await theme(mode);
      await page.waitForSelector("h1, h2", { timeout: 20000 }).catch(() => {});
      await page.waitForTimeout(120);
      const report = await page.evaluate(() => {
        const text = document.body.innerText || "";
        return {
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          object: text.includes("[object Object]"),
          bad: /\bNaN\b/.test(text),
        };
      });
      if (report.overflow > 1 || report.object || report.bad || errors.length) {
        issues.push({ mode, width, url, ...report, error: errors[0]?.slice(0, 160) || "" });
      }
    }
  }
}
if (issues.length) {
  console.log(JSON.stringify(issues.slice(0, 12), null, 2));
  throw new Error(`${issues.length} regression issues`);
}

await page.setViewportSize({ width: 1440, height: 900 });
await page.goto(`${base}/crmv4`, { waitUntil: "domcontentloaded" });
await page.evaluate(() => window.localStorage.removeItem("crmv4-rail-fold"));
await page.reload({ waitUntil: "domcontentloaded" });
await theme("light");
await page.waitForSelector("nav.c4-page-rail");
const first = await page.evaluate(() => document.querySelector("body")?.innerText?.startsWith("Skip") || document.querySelector(".c4-skip")?.textContent || "");
if (!String(first).toLowerCase().includes("skip") && !(await page.locator(".c4-skip").count())) throw new Error("skip link missing");
await page.getByRole("link", { name: "Deposit review" }).waitFor();
await page.screenshot({ path: path.join(out, "crmv4-r30-after-rail.png") });
await page.locator(".c4-gear").click();
await page.waitForFunction(() => document.querySelector(".c4-drop[data-open='1'] #c4-gear-menu"));
const gearText = (await page.locator("#c4-gear-menu").innerText()).toLowerCase();
for (const word of ["work", "money", "compliance", "insights", "desk"]) {
  if (!gearText.includes(word)) throw new Error(`gear missing ${word}`);
}
await page.keyboard.press("Escape");
await page.waitForFunction(() => document.querySelector(".c4-drop[data-open='1']") == null);
await page.getByRole("button", { name: "Collapse the section rail" }).click();
const fold = await page.evaluate(() => window.localStorage.getItem("crmv4-rail-fold"));
if (fold !== "1") throw new Error(fold || "fold missing");
const named = await page.getByRole("link", { name: "Deposit review" }).count();
if (!named) throw new Error("collapsed link lost its name");
await page.screenshot({ path: path.join(out, "crmv4-r30-after-rail-collapsed.png") });
await theme("dark");
await page.screenshot({ path: path.join(out, "crmv4-r30-after-rail-dark.png") });
await page.getByRole("button", { name: "Expand the section rail" }).click();
const finder = page.locator(".c4-page-rail").getByRole("textbox", { name: "Find a loaded page" });
await finder.fill("document");
await page.waitForFunction(() => (document.querySelector(".c4-page-rail")?.innerText || "").includes("Document review"));
const railText = await page.locator(".c4-page-rail").innerText();
if (/marketing/i.test(railText)) throw new Error("filter kept Marketing");
await page.screenshot({ path: path.join(out, "crmv4-r30-after-rail-filter.png") });

await page.setViewportSize({ width: 375, height: 812 });
await page.goto(`${base}/crmv4/deposit`, { waitUntil: "domcontentloaded" });
await theme("light");
await page.getByRole("button", { name: "More" }).click();
await page.waitForSelector(".c4-more-luxe");
const moreText = (await page.locator(".c4-more-luxe").innerText()).toLowerCase();
for (const word of ["work", "money", "compliance", "insights", "desk", "open page"]) {
  if (!moreText.includes(word)) throw new Error(`more missing ${word}`);
}
const dialog = page.getByRole("dialog");
await dialog.waitFor();
await page.keyboard.press("Tab");
const inside = await page.evaluate(() => {
  const dialog = document.querySelector("[role='dialog']");
  return Boolean(dialog && dialog.contains(document.activeElement));
});
if (!inside) throw new Error("focus left the more sheet");
await page.screenshot({ path: path.join(out, "crmv4-r30-after-more.png") });
await theme("dark");
await page.screenshot({ path: path.join(out, "crmv4-r30-after-more-dark.png") });
await page.keyboard.press("Escape");
await page.waitForSelector(".c4-more-luxe", { state: "detached" });

await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${base}/crmv4/reports`, { waitUntil: "domcontentloaded" });
await theme("light");
const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
if (overflow > 1) throw new Error(`390 reports ${overflow}`);
await page.screenshot({ path: path.join(out, "crmv4-r30-after-reports-390.png") });
console.log("round 30 after ok", userId || "no-customer");
await browser.close();
