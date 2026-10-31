/** Before shots: phone cards, the right rail, and search. */
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
[data-crmv4-root][data-screen="cards"] .shot-cards,
[data-crmv4-root][data-screen="rail"] .shot-rail,
[data-crmv4-root][data-screen="search"] .shot-search{display:block !important}
[data-crmv4-root][data-screen="cards"] .c4-desk{display:none !important}
[data-crmv4-root][data-screen="cards"] .c4-mob-list{display:block !important}
</style></head><body>
<div data-crmv4-root data-theme="light" data-screen="cards" class="c4-app">
  <header class="c4-top"><a class="c4-brand"><img alt="7FX" class="c4-logo fx-logo-ink" src="${logo}"/></a>
    <form class="c4-page-search" role="search"><input class="c4-field" value="" placeholder="Search"/></form>
  </header>
  <div class="c4-frame"><div class="c4-panel">
    <div class="c4-pagehead"><div><h1 class="c4-page-title">Customers</h1><p class="c4-page-sub">Accounts</p></div></div>
    <main class="c4-stage">
      <ul class="c4-mob-list shot shot-cards">
        <li class="c4-person"><div>Ada Demir</div><div class="c4-muted">ada@desk.example</div><div>1,200</div></li>
        <li class="c4-person"><div>Leo Hart</div><div class="c4-muted">leo@mail.test</div><div>80</div></li>
      </ul>
      <div class="shot shot-search">
        <div class="c4-palette" style="position:relative"><input class="c4-field" placeholder="Search customers, tickets, deposits"/><ul><li>Ada Demir</li></ul></div>
      </div>
      <div class="shot shot-rail"></div>
    </main><footer class="c4-foot">7FX · All rights reserved</footer>
  </div></div>
  <aside class="c4-rail"><button class="c4-rail-btn" type="button"><span class="c4-avatar">A</span><span>Admin</span></button><button class="c4-rail-btn" type="button"><span>Alerts</span></button><button class="c4-rail-btn" type="button"><span>Notes</span></button></aside>
  <nav class="c4-tabs"><a class="c4-tab" data-on="1">Customers</a></nav>
</div></body></html>`;

const browser = await chromium.launch({ headless: true });
const shots = [
  { name: "crmv4-r6-before-cards", screen: "cards", width: 375, height: 812 },
  { name: "crmv4-r6-before-rail", screen: "rail", width: 1440, height: 900 },
  { name: "crmv4-r6-before-search", screen: "search", width: 1440, height: 900 },
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
