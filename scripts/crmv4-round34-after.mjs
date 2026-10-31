/** After shots: the luxury customer list and the notes studio. */
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

await page.goto(`${base}/crmv4/customers`, { waitUntil: "domcontentloaded" });
await theme("light");
await page.waitForFunction(() => (document.querySelector("[data-lux='1']")?.innerText || "").includes("Mehmet"), null, { timeout: 30000 });
await page.locator("[data-lux='1']").getByRole("checkbox", { name: "Desk", exact: true }).uncheck();
const stored = await page.evaluate(() => window.localStorage.getItem("crmv4-columns"));
if (!stored || stored.includes("\"desk\"")) throw new Error(stored || "columns missing");
await page.getByRole("button", { name: "Dense rows" }).click();
const roomy = await page.evaluate(() => window.localStorage.getItem("crmv4-columns"));
if (!roomy?.includes("\"dense\":false")) throw new Error(roomy || "density missing");
const sticky = await page.evaluate(() => getComputedStyle(document.querySelector(".c4-lux-desk thead th")).position);
if (sticky !== "sticky") throw new Error(sticky);
await page.locator(".c4-panel").evaluate((node) => { node.scrollTop = 0; });
await shot("crmv4-r34-after-list");
await theme("dark");
await shot("crmv4-r34-after-list-dark");

await page.setViewportSize({ width: 375, height: 812 });
await page.goto(`${base}/crmv4/customers`, { waitUntil: "domcontentloaded" });
await theme("light");
await page.waitForSelector("[data-lux='1']");
const cards = await page.evaluate(() => getComputedStyle(document.querySelector(".c4-lux-cards")).display);
const desk = await page.evaluate(() => getComputedStyle(document.querySelector(".c4-lux-desk")).display);
if (cards === "none" || desk !== "none") throw new Error(`cards ${cards} desk ${desk}`);
await page.locator("[data-lux='1']").scrollIntoViewIfNeeded();
await shot("crmv4-r34-after-list-phone");
await theme("dark");
await shot("crmv4-r34-after-list-phone-dark");

await page.setViewportSize({ width: 1440, height: 900 });
writes.length = 0;
await page.goto(`${base}/crmv4/customers/${id}?part=notes`, { waitUntil: "domcontentloaded" });
await theme("light");
await page.waitForSelector("[data-notes='1']", { timeout: 30000 });
await page.locator("[data-notes='1']").getByRole("textbox", { name: "Note", exact: true }).fill("Hello @");
await page.waitForTimeout(400);
const beforeSave = writes.length;
await page.getByRole("textbox", { name: "Task" }).fill("Call about the file");
await page.getByRole("button", { name: "Add task" }).click();
const tasks = await page.evaluate(() => window.localStorage.getItem("crmv4-tasks"));
if (!tasks?.includes("Call about the file")) throw new Error(tasks || "task missing");
if (writes.length !== beforeSave) throw new Error(writes.join(" "));
await page.getByRole("checkbox", { name: "Call about the file" }).check();
await page.locator("[data-notes='1']").scrollIntoViewIfNeeded();
await shot("crmv4-r34-after-notes");
await theme("dark");
await shot("crmv4-r34-after-notes-dark");

await page.setViewportSize({ width: 375, height: 812 });
await page.goto(`${base}/crmv4/customers/${id}?part=notes`, { waitUntil: "domcontentloaded" });
await theme("light");
const form = page.getByRole("button", { name: "Close form" });
if (await form.count()) await form.click({ force: true });
await page.waitForSelector("[data-notes='1']");
await page.evaluate(() => document.querySelector("[data-notes='1']")?.scrollIntoView({ block: "start" }));
await shot("crmv4-r34-after-notes-phone");
if (errors.length) throw new Error(errors[0].slice(0, 300));
await browser.close();
