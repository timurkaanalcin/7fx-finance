/** Signed-in layout pass for every CRM v4 tab. */
import { chromium } from "playwright";

const base = "http://127.0.0.1:3000";
const pages = ["", "customers", "finance", "positions", "support", "marketing", "logs", "settings", "control"];
const widths = [1440, 1280, 1024, 768, 375];
const heights = { 1440: 900, 1280: 800, 1024: 768, 768: 900, 375: 812 };
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const errors = [];
page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text().slice(0, 180)); });
page.on("pageerror", (err) => errors.push(String(err).slice(0, 180)));
const login = await page.request.post(`${base}/api/auth/login`, {
  form: { email: "admin@7fx.local", password: "Admin123!", nav: "1" },
  maxRedirects: 0,
});
if (login.status() >= 400) throw new Error(await login.text());
await page.addInitScript(() => window.localStorage.setItem("crmv4-tour-done", "1"));

const issues = [];
for (const mode of ["light", "dark"]) {
  for (const width of widths) {
    await page.setViewportSize({ width, height: heights[width] });
    for (const path of pages) {
      errors.length = 0;
      await page.goto(`${base}/crmv4${path ? `/${path}` : ""}`, { waitUntil: "domcontentloaded" });
      await page.evaluate((theme) => {
        window.localStorage.setItem("crmv4-theme-mode", theme);
        window.dispatchEvent(new CustomEvent("crmv4:theme-mode", { detail: theme }));
      }, mode);
      await page.waitForSelector("[data-crmv4-root]", { timeout: 30000 });
      await page.waitForTimeout(250);
      const report = await page.evaluate(() => {
        const root = document.documentElement;
        const overflow = root.scrollWidth - root.clientWidth;
        const unnamed = Array.from(document.querySelectorAll("button, a")).filter((node) => {
          const text = (node.textContent || "").trim();
          const label = node.getAttribute("aria-label") || node.getAttribute("title") || "";
          return !text && !label;
        }).length;
        return { overflow, unnamed };
      });
      if (report.overflow > 1 || report.unnamed > 0 || errors.length) {
        issues.push({ mode, width, path: path || "overview", overflow: report.overflow, unnamed: report.unnamed, errors: errors.slice(0, 2) });
      }
    }
    if (width < 1024) {
      errors.length = 0;
      const more = page.getByRole("button", { name: /More|Daha|Mehr|Ещё|المزيد/i });
      if (await more.count()) {
        await more.first().click();
        await page.waitForTimeout(200);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        if (overflow > 1) issues.push({ mode, width, path: "more", overflow, unnamed: 0, errors: [] });
        await page.keyboard.press("Escape");
      }
    }
  }
}
console.log(JSON.stringify(issues, null, 2));
console.log("issue count", issues.length);
await browser.close();
