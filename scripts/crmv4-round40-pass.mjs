/** Regression pass for rounds 31-39 plus the dossier. */
import { chromium } from "playwright";

const base = "http://127.0.0.1:3000";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const errors = [];
const writes = [];
page.on("pageerror", (err) => errors.push(String(err).slice(0, 180)));
page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text().slice(0, 180)); });
page.on("request", (req) => {
  if ((req.method() === "POST" || req.method() === "PATCH" || req.method() === "PUT" || req.method() === "DELETE") && !req.url().includes("/api/auth/login")) {
    writes.push(`${req.method()} ${req.url()}`);
  }
});
const login = await page.request.post(`${base}/api/auth/login`, {
  form: { email: "admin@7fx.local", password: "Admin123!", nav: "1" },
  maxRedirects: 0,
});
if (login.status() >= 400) throw new Error(await login.text());
await page.addInitScript(() => window.localStorage.setItem("crmv4-tour-done", "1"));
const people = await (await page.request.get(`${base}/api/admin/users?take=20&meta=0&role=TRADER`)).json();
const id = (people.users || []).find((row) => String(row.name || "").includes("Mehmet")).id;
const paths = [
  "/crmv4",
  "/crmv4/customers",
  `/crmv4/customers/${id}`,
  `/crmv4/customers/${id}?part=money`,
  `/crmv4/customers/${id}?part=files`,
  "/crmv4/roster",
  "/crmv4/insights",
  "/crmv4/agenda",
  "/crmv4/marketing",
  "/crmv4/logs",
  "/crmv4/settings?area=methods",
  "/crmv4/settings?area=currencies",
  "/crmv4/settings?area=desks",
];
const widths = [360, 375, 768, 1024, 1440];
const problems = [];
for (const width of widths) {
  await page.setViewportSize({ width, height: width < 700 ? 800 : 900 });
  for (const mode of ["light", "dark"]) {
    for (const path of paths) {
      await page.goto(`${base}${path}`, { waitUntil: "domcontentloaded" });
      await page.evaluate((value) => {
        window.localStorage.setItem("crmv4-theme-mode", value);
        window.dispatchEvent(new Event("crmv4:theme-mode"));
      }, mode);
      await page.waitForTimeout(250);
      const found = await page.evaluate(() => {
        const text = document.body.innerText;
        const overflow = document.documentElement.scrollWidth - document.documentElement.clientWidth;
        return {
          overflow,
          object: text.includes("[object Object]"),
          nan: /\bNaN\b/.test(text),
        };
      });
      if (found.overflow > 1 || found.object || found.nan) problems.push(`${width} ${mode} ${path} ${JSON.stringify(found)}`);
    }
  }
}
await page.setViewportSize({ width: 1440, height: 900 });
await page.goto(`${base}/crmv4`, { waitUntil: "domcontentloaded" });
await page.locator("[data-bar='1']").getByRole("button", { name: "Notifications" }).click();
await page.waitForSelector("[data-notes-desk='1']");
await page.keyboard.press("Escape");
const notesGone = await page.locator("[data-notes-desk='1']").count();
if (notesGone) problems.push("escape notes");
await page.goto(`${base}/crmv4/customers`, { waitUntil: "domcontentloaded" });
await page.setViewportSize({ width: 375, height: 812 });
await page.getByRole("button", { name: "Filters" }).click().catch(() => {});
await page.keyboard.press("Escape");
await page.setViewportSize({ width: 1440, height: 900 });
await page.goto(`${base}/crmv4/customers/${id}?part=files`, { waitUntil: "domcontentloaded" });
await page.waitForFunction(() => (document.body.innerText || "").includes("Preview"), null, { timeout: 20000 });
await page.getByRole("button", { name: "Preview" }).first().click();
await page.keyboard.press("Escape");
const dialog = await page.getByRole("dialog").count();
if (dialog) problems.push("escape preview");
console.log("problems", problems.length);
for (const line of problems) console.log(line);
console.log("errors", errors.slice(0, 8));
console.log("writes", writes.slice(0, 8));
if (problems.length || errors.length || writes.length) process.exitCode = 1;
await browser.close();
