/** Before/after shots for the graphite announce crocket and the ivory greeting quatrefoil. */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const out = "/opt/cursor/artifacts";
fs.mkdirSync(out, { recursive: true });
const css = fs.readFileSync(new URL("../src/components/crmv4/crmv4.css", import.meta.url), "utf8");

const before = `
  <section class="c4-card">
    <div class="c4-card-h"><h3 class="c4-title">Announcements</h3></div>
    <form class="c4-row c4-pad">
      <input class="c4-field" value="Desk opens at nine" />
      <button type="button" class="c4-btn">Announcements</button>
    </form>
    <p class="c4-pad">Hold the Ada callback</p>
    <p class="c4-pad">Bea documents are ready</p>
  </section>
  <section class="c4-card">
    <div class="c4-card-h"><h3 class="c4-title">Greeting</h3></div>
    <div class="c4-row c4-pad">
      <input class="c4-field" value="Ada" />
      <input class="c4-field" value="Friday" />
    </div>
    <p class="c4-pad">Happy Friday, Ada.</p>
  </section>`;

const after = `
  <section class="c4-announce-crocket" data-announce-crocket="1" aria-label="Announcements">
    <header class="c4-announce-crocket-mast">
      <p class="c4-announce-crocket-seal" data-logo="mono">7FX</p>
      <div>
        <p class="c4-announce-crocket-kicker">Graphite announce crocket</p>
        <h3 class="c4-title">Announcements</h3>
        <p class="c4-announce-crocket-lead">Announcements stand under a graphite crocket. Ivory holds each line. Champagne marks the leaf.</p>
      </div>
      <p class="c4-announce-crocket-count">2</p>
    </header>
    <form class="c4-row c4-pad">
      <input class="c4-field" value="Desk opens at nine" />
      <button type="button" class="c4-btn">Announcements</button>
    </form>
    <ul class="c4-announce-crocket-rows">
      <li><i aria-hidden="true"></i>Hold the Ada callback</li>
      <li><i aria-hidden="true"></i>Bea documents are ready</li>
    </ul>
  </section>
  <section class="c4-greeting-quatrefoil" data-greeting-quatrefoil="1" aria-label="Greeting">
    <header class="c4-greeting-quatrefoil-mast">
      <p class="c4-greeting-quatrefoil-seal" data-logo="mono">7FX</p>
      <div>
        <p class="c4-greeting-quatrefoil-kicker">Ivory greeting quatrefoil</p>
        <h3 class="c4-title">Greeting</h3>
        <p class="c4-greeting-quatrefoil-lead">The greeting sits in an ivory quatrefoil. Graphite holds the type. Champagne rings the preview.</p>
      </div>
    </header>
    <div class="c4-row c4-pad c4-greeting-quatrefoil-fields">
      <input class="c4-field" value="Ada" />
      <input class="c4-field" value="Friday" />
    </div>
    <p class="c4-greeting-quatrefoil-preview">Happy Friday, Ada.</p>
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
  ["crmv4-r399-before-light", "light", "before", 1280, 860],
  ["crmv4-r399-after-light", "light", "after", 1280, 1100],
  ["crmv4-r399-before-dark", "dark", "before", 1280, 860],
  ["crmv4-r399-after-dark", "dark", "after", 1280, 1100],
  ["crmv4-r399-after-mobile", "light", "after", 390, 1280],
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
