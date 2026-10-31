/** After shots and interaction checks for the lead board and help. */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const out = "/opt/cursor/artifacts/screenshots";
fs.mkdirSync(out, { recursive: true });
const base = "http://127.0.0.1:3000";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const patches = [];
page.on("request", (req) => {
  if (req.method() === "PATCH") patches.push(req.url());
});
const login = await page.request.post(`${base}/api/auth/login`, {
  form: { email: "admin@7fx.local", password: "Admin123!", nav: "1" },
  maxRedirects: 0,
});
if (login.status() >= 400) throw new Error(await login.text());
await page.addInitScript(() => {
  window.localStorage.setItem("crmv4-tour-done", "1");
  window.localStorage.removeItem("crmv4-board-tips");
  window.localStorage.removeItem("crmv4-board-stages");
  window.localStorage.removeItem("crmv4-board-density");
});

async function theme(mode) {
  await page.evaluate((value) => {
    window.localStorage.setItem("crmv4-theme-mode", value);
    window.dispatchEvent(new Event("crmv4:theme-mode"));
  }, mode);
  await page.waitForFunction((value) => document.querySelector("[data-crmv4-root]")?.getAttribute("data-theme") === value, mode);
}

async function shot(name) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  console.log(name, "overflow", overflow);
  if (overflow > 1) throw new Error(`${name} overflow ${overflow}`);
  await page.screenshot({ path: path.join(out, `${name}.png`) });
}

async function showBoard() {
  await page.evaluate(() => {
    const board = document.querySelector("[data-board]");
    const panel = document.querySelector(".c4-panel");
    if (!board || !panel) return;
    const top = board.getBoundingClientRect().top - panel.getBoundingClientRect().top + panel.scrollTop;
    panel.scrollTop = Math.max(0, top - 8);
  });
}

await page.goto(`${base}/crmv4/customers`, { waitUntil: "domcontentloaded" });
await theme("light");
await page.getByRole("button", { name: "Pipeline" }).click();
await page.waitForSelector("[data-card]");
await page.waitForSelector("[data-tip='confirm']");
await showBoard();
await shot("crmv4-r41-after-board-light");
await page.getByRole("button", { name: "Card density" }).click();
await page.waitForSelector("[data-board][data-density='compact']");
await page.locator(".c4-board .c4-chip", { hasText: "CALLBACK" }).click();
await page.waitForSelector("[data-stage='CALLBACK']", { state: "detached" });
await page.getByRole("button", { name: "All stages" }).click();
await page.waitForSelector("[data-stage='CALLBACK']");
await page.locator("[data-tip='board']").getByRole("button", { name: "Dismiss" }).click();
await page.waitForSelector("[data-tip='board']", { state: "detached" });
const card = page.locator("[data-card]").first();
const select = card.locator("select");
const value = await select.inputValue();
const options = await select.locator("option").evaluateAll((nodes) => nodes.map((node) => node.value));
const next = options.find((item) => item !== value);
await select.selectOption(next);
await card.getByRole("button", { name: "Review stage" }).click();
await page.waitForSelector("[data-confirm='1']");
await showBoard();
await shot("crmv4-r41-after-confirm-light");
await page.getByRole("button", { name: "Cancel" }).click();
await page.waitForSelector("[data-confirm='1']", { state: "detached" });
await theme("dark");
await showBoard();
await shot("crmv4-r41-after-board-dark");

await page.getByRole("button", { name: "Help", exact: true }).click();
await page.waitForSelector("[data-help-drawer]");
await page.locator("[data-help-q]").fill("balances");
await page.waitForFunction(() => document.querySelectorAll("[data-topic]").length === 1);
await shot("crmv4-r41-after-help-dark");
await theme("light");
await shot("crmv4-r41-after-help-light");
await page.getByRole("button", { name: "Shortcut sheet" }).click();
await page.waitForSelector("[data-shortcuts]");
await shot("crmv4-r41-after-keys-light");
await page.keyboard.press("Escape");
await page.waitForSelector("[data-shortcuts]", { state: "detached" });

await page.setViewportSize({ width: 375, height: 812 });
await page.goto(`${base}/crmv4/customers`, { waitUntil: "domcontentloaded" });
await theme("light");
const hide = page.getByRole("button", { name: /Hide filters|Filters/ });
if (await hide.count()) {
  const open = await page.locator(".c4-filter-sheet").getAttribute("data-open").catch(() => null);
  if (open === "1") await hide.first().click();
}
await page.getByRole("button", { name: "Pipeline" }).click();
await page.waitForSelector("[data-card]");
await page.waitForFunction(() => Number(document.querySelector("[data-loaded]")?.getAttribute("data-loaded") || 0) > 0);
await page.evaluate(() => {
  const cols = document.querySelector(".c4-board-cols");
  const panel = document.querySelector(".c4-panel");
  const card = document.querySelector(".c4-board-card");
  if (cols && panel) {
    const top = cols.getBoundingClientRect().top - panel.getBoundingClientRect().top + panel.scrollTop;
    panel.scrollTop = Math.max(0, top - 12);
  }
  if (cols && card) {
    const left = card.getBoundingClientRect().left - cols.getBoundingClientRect().left + cols.scrollLeft;
    cols.scrollLeft = Math.max(0, left - 8);
  }
});
await shot("crmv4-r41-after-board-phone");
await theme("dark");
await page.evaluate(() => {
  const cols = document.querySelector(".c4-board-cols");
  const card = document.querySelector(".c4-board-card");
  if (!cols || !card) return;
  const left = card.getBoundingClientRect().left - cols.getBoundingClientRect().left + cols.scrollLeft;
  cols.scrollLeft = Math.max(0, left - 8);
});
await shot("crmv4-r41-after-board-phone-dark");
await page.keyboard.press("?");
await page.waitForSelector("[data-shortcuts]");
await shot("crmv4-r41-after-keys-phone");
await page.getByRole("button", { name: "Help", exact: true }).click();
await page.waitForSelector("[data-help-drawer]");
await theme("light");
await shot("crmv4-r41-after-help-phone");
if (patches.length) throw new Error(`unexpected PATCH ${patches.join(" ")}`);
await browser.close();
console.log("round 41 after done");
