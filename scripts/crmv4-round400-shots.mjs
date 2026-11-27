/** Before/after shots for the graphite city scotia and the ivory shift torus. */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const out = "/opt/cursor/artifacts";
fs.mkdirSync(out, { recursive: true });
const css = fs.readFileSync(new URL("../src/components/crmv4/crmv4.css", import.meta.url), "utf8");

const before = `
  <section class="c4-card">
    <div class="c4-card-h"><h3 class="c4-title">Cities</h3></div>
    <div class="c4-row c4-pad"><span>Istanbul</span><span>12</span></div>
    <div class="c4-row c4-pad"><span>Ankara</span><span>4</span></div>
  </section>
  <section class="c4-card">
    <div class="c4-card-h"><h3 class="c4-title">Shift board</h3></div>
    <form class="c4-row c4-pad">
      <input class="c4-field" value="Nia" />
      <input class="c4-field" value="Friday" />
      <button type="button" class="c4-btn">Shift board</button>
    </form>
    <p class="c4-pad">Nia · Friday · 09:00–17:00</p>
    <p class="c4-pad">Omar · Monday · 09:00–17:00</p>
  </section>`;

const after = `
  <section class="c4-desk-city-scotia" data-desk-city-scotia="1" aria-label="Cities">
    <header class="c4-desk-city-scotia-mast">
      <p class="c4-desk-city-scotia-seal" data-logo="mono">7FX</p>
      <div>
        <p class="c4-desk-city-scotia-kicker">Graphite city scotia</p>
        <h3 class="c4-title">Cities</h3>
        <p class="c4-desk-city-scotia-lead">Cities sit in a graphite scotia. Ivory holds each name. Champagne marks the count.</p>
      </div>
      <p class="c4-desk-city-scotia-count">2</p>
    </header>
    <ul class="c4-desk-city-scotia-rows">
      <li><span>Istanbul</span><strong>12</strong></li>
      <li><span>Ankara</span><strong>4</strong></li>
    </ul>
  </section>
  <section class="c4-desk-shift-torus" data-desk-shift-torus="1" aria-label="Shift board">
    <header class="c4-desk-shift-torus-mast">
      <p class="c4-desk-shift-torus-seal" data-logo="mono">7FX</p>
      <div>
        <p class="c4-desk-shift-torus-kicker">Ivory shift torus</p>
        <h3 class="c4-title">Shift board</h3>
        <p class="c4-desk-shift-torus-lead">The shift board sits in an ivory torus. Graphite holds the type. Champagne rings the seal.</p>
      </div>
      <p class="c4-desk-shift-torus-count">2</p>
    </header>
    <form class="c4-row c4-pad c4-desk-shift-torus-fields">
      <input class="c4-field" value="Nia" />
      <input class="c4-field" value="Friday" />
      <button type="button" class="c4-btn">Shift board</button>
    </form>
    <ul class="c4-desk-shift-torus-rows">
      <li><i aria-hidden="true"></i>Nia · Friday · 09:00–17:00</li>
      <li><i aria-hidden="true"></i>Omar · Monday · 09:00–17:00</li>
    </ul>
  </section>`;

function page(theme, mode) {
  const body = mode === "after" ? after : before;
  const ground = theme === "dark" ? "#12100e" : "#f4f0e8";
  return `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body style="margin:0;background:${ground};">
    <div data-crmv4-root data-theme="${theme}" style="height:auto;display:block;background:${ground};padding:12px 0 28px;">
      ${body}
    </div>
  </body></html>`;
}

const browser = await chromium.launch({ headless: true });
const shots = [
  ["crmv4-r400-before-light", "light", "before", 1280, 860],
  ["crmv4-r400-after-light", "light", "after", 1280, 1100],
  ["crmv4-r400-before-dark", "dark", "before", 1280, 860],
  ["crmv4-r400-after-dark", "dark", "after", 1280, 1100],
  ["crmv4-r400-after-mobile", "light", "after", 390, 1280],
];
for (const [name, theme, mode, width, height] of shots) {
  const pageObj = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  await pageObj.setContent(page(theme, mode), { waitUntil: "load" });
  const file = path.join(out, `${name}.png`);
  await pageObj.screenshot({ path: file, fullPage: true });
  await pageObj.close();
  console.log(file);
}
await browser.close();
