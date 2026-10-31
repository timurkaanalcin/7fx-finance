/** Signed-in CRM v4 pass against the local dev database. */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const out = "/opt/cursor/artifacts/screenshots";
fs.mkdirSync(out, { recursive: true });
const base = "http://127.0.0.1:3000";
const sections = ["", "customers", "finance", "positions", "support", "marketing", "settings", "logs", "control"];
const widths = [375, 768, 1440, 1920];

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();
const errors = [];
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push({ url: page.url(), text: msg.text() });
});
page.on("pageerror", (err) => errors.push({ url: page.url(), text: String(err) }));

const login = await page.request.post(`${base}/api/auth/login`, {
  form: { email: "admin@7fx.local", password: "Admin123!", nav: "1" },
  maxRedirects: 0,
});
console.log("login", login.status(), login.headers().location || "");
if (login.status() >= 400) throw new Error(await login.text());

const findings = [];
for (const width of widths) {
  await page.setViewportSize({ width, height: 900 });
  for (const section of sections) {
    const pathName = section ? `/crmv4/${section}` : "/crmv4";
    const before = errors.length;
    await page.goto(`${base}${pathName}`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForSelector("[data-crmv4-root]", { timeout: 30000 });
    await page.waitForTimeout(800);
    const measure = await page.evaluate(() => {
      const root = document.querySelector("[data-crmv4-root]");
      const title = document.querySelector(".c4-page-title");
      const search = document.querySelector(".c4-page-search");
      const titleBox = title?.getBoundingClientRect();
      const searchBox = search?.getBoundingClientRect();
      const overlap = Boolean(titleBox && searchBox && titleBox.right > searchBox.left + 4 && titleBox.bottom > searchBox.top + 4 && titleBox.top < searchBox.bottom - 4);
      return {
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        rootOverflow: root ? root.scrollWidth - root.clientWidth : 0,
        title: title?.textContent || "",
        overlap,
        buttons: document.querySelectorAll("button").length,
      };
    });
    const fresh = errors.slice(before).map((row) => row.text);
    findings.push({ width, section: section || "overview", ...measure, errors: fresh });
    if (section === "" && (width === 1440 || width === 375)) {
      const name = width === 1440 ? "crmv4-r11-before-home" : "crmv4-r11-before-phone";
      await page.screenshot({ path: path.join(out, `${name}.png`), fullPage: false });
      console.log("saved", name);
    }
    console.log(width, section || "overview", measure.overflow, measure.rootOverflow, measure.overlap, fresh.length ? fresh[0].slice(0, 180) : "ok");
  }
}

fs.writeFileSync("/tmp/crmv4-r11-regress.json", JSON.stringify({ landed: page.url(), findings, errors }, null, 2));
await browser.close();
console.log("wrote /tmp/crmv4-r11-regress.json");
