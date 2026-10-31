/** After shots: chat, the KYC viewer, and my day. */
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const css = fs.readFileSync(path.join(ROOT, "src/components/crmv4/crmv4.css"), "utf8");
const logo = pathToFileURL(path.join(ROOT, "public/7fx-logo.png")).href;
const out = "/opt/cursor/artifacts/screenshots";
fs.mkdirSync(out, { recursive: true });

const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/>
<style>${css} html,body{margin:0;height:100%;background:#f4f0e8}.fx-logo-ink{filter:brightness(0)}
[data-crmv4-root] .shot{display:none !important}
[data-crmv4-root][data-screen="chat"] .shot-chat,
[data-crmv4-root][data-screen="kyc"] .shot-kyc,
[data-crmv4-root][data-screen="day"] .shot-day{display:block !important}
</style></head><body>
<div data-crmv4-root data-theme="light" data-accent="champagne" data-screen="chat" class="c4-app">
  <header class="c4-top"><a class="c4-brand"><img alt="7FX" class="c4-logo fx-logo-ink" src="${logo}"/></a></header>
  <div class="c4-frame"><div class="c4-panel">
    <div class="c4-pagehead"><div><h1 class="c4-page-title">Support</h1></div></div>
    <main class="c4-stage">
      <section class="shot shot-chat c4-split c4-chat-luxe">
        <section class="c4-card"><div class="c4-card-h"><h2 class="c4-title">Chat</h2></div><p class="c4-pad">Ada Demir</p></section>
        <section class="c4-card"><div class="c4-card-h"><h2 class="c4-title">Ada</h2></div><p class="c4-pad">Hello</p><p class="c4-muted c4-pad">Customer</p></section>
      </section>
      <section class="shot shot-kyc c4-kyc-luxe"><div class="c4-viewer"><div class="c4-row c4-pad"><button class="c4-btn" type="button">Rotate</button><button class="c4-btn" type="button">Zoom</button></div><img alt="" class="c4-zoom" src="${logo}"/></div><div class="c4-row c4-pad"><button class="c4-btn c4-btn-hot" type="button">Approve</button><button class="c4-btn" type="button">Reject</button></div></section>
      <section class="shot shot-day c4-myday"><div class="c4-card-h"><h2 class="c4-title">My day · Ada</h2><button class="c4-btn" type="button">End of day</button></div><div class="c4-row c4-pad"><div class="c4-ring"><span>40%</span></div><p>Work streak 3</p></div></section>
    </main><footer class="c4-foot">7FX · All rights reserved</footer>
  </div></div>
</div></body></html>`;

const browser = await chromium.launch({ headless: true });
const shots = [
  { name: "crmv4-r9-after-chat", screen: "chat", width: 1440, height: 900 },
  { name: "crmv4-r9-after-kyc", screen: "kyc", width: 1440, height: 900 },
  { name: "crmv4-r9-after-day", screen: "day", width: 1440, height: 900 },
  { name: "crmv4-r9-after-chat-phone", screen: "chat", width: 375, height: 812 },
  { name: "crmv4-r9-after-day-phone", screen: "day", width: 375, height: 812 },
];
for (const shot of shots) {
  const page = await browser.newPage({ viewport: { width: shot.width, height: shot.height } });
  await page.setContent(html, { waitUntil: "load" });
  await page.evaluate((name) => { document.querySelector("[data-crmv4-root]").dataset.screen = name; }, shot.screen);
  await page.screenshot({ path: path.join(out, `${shot.name}.png`) });
  await page.close();
  console.log("saved", shot.name);
}
await browser.close();
