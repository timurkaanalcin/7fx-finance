/** Signed-in after shots of the executive home. */
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

async function shot(name, width, height, theme) {
  await page.setViewportSize({ width, height });
  await page.goto(`${base}/crmv4`, { waitUntil: "domcontentloaded" });
  await page.evaluate((mode) => {
    window.localStorage.setItem("crmv4-theme-mode", mode);
    window.dispatchEvent(new CustomEvent("crmv4:theme-mode", { detail: mode }));
  }, theme);
  await page.waitForSelector(".c4-exec-hero", { timeout: 30000 });
  await page.waitForFunction(() => {
    const node = document.querySelector(".c4-exec-metric strong");
    return Boolean(node && /\d/.test(node.textContent || ""));
  }, { timeout: 20000 });
  await page.waitForTimeout(400);
  const boxes = await page.evaluate(() => {
    const box = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { y: Math.round(r.y), bottom: Math.round(r.bottom), h: Math.round(r.height) };
    };
    return {
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      hero: box(".c4-exec-hero"),
      tour: box(".c4-tour"),
      tabs: box(".c4-tabs"),
      fab: box(".c4-fab"),
    };
  });
  await page.screenshot({ path: path.join(out, `${name}.png`) });
  console.log(name, JSON.stringify(boxes));
}

await shot("crmv4-r11-after-home", 1440, 900, "light");
await shot("crmv4-r11-after-home-dark", 1440, 900, "dark");
await shot("crmv4-r11-after-phone", 375, 812, "light");

const sections = ["", "customers", "finance", "positions", "support", "marketing", "settings", "logs", "control"];
for (const width of [375, 768, 1440, 1920]) {
  await page.setViewportSize({ width, height: 900 });
  for (const section of sections) {
    const before = errors.length;
    await page.goto(`${base}/crmv4${section ? `/${section}` : ""}`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("[data-crmv4-root]");
    await page.waitForTimeout(400);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    const fresh = errors.slice(before);
    if (overflow > 1 || fresh.length) console.log("issue", width, section || "overview", overflow, fresh[0]?.slice(0, 160) || "");
  }
}
console.log("console errors", errors.length);
await browser.close();
