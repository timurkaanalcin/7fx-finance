/** Before/after shots for the ivory quay navalia and the graphite belt praetorium. */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const out = "/opt/cursor/artifacts";
fs.mkdirSync(out, { recursive: true });
const css = fs.readFileSync(new URL("../src/components/crmv4/crmv4.css", import.meta.url), "utf8");

const before = `
  <section class="c4-quy" data-quays="1" data-role="desk">
    <header class="c4-quy-head">
      <p class="c4-quy-plate" data-logo="mono">7FX</p>
      <div><p class="c4-quy-kicker">Quay desk</p><h2 class="c4-title">Quay slips</h2></div>
      <p class="c4-quy-count">2</p>
    </header>
    <ul class="c4-quy-rows">
      <li data-tide="flood"><span class="c4-quy-folio">4</span><div><p>Hold the Ada berth</p><p class="c4-meta">Nia · Oak · Flood</p></div></li>
      <li data-tide="ebb"><span class="c4-quy-folio">9</span><div><p>Stow the Bea slip</p><p class="c4-meta">No mate · Teak · Ebb</p></div></li>
    </ul>
  </section>
  <section class="c4-zbl" data-belts="1">
    <header class="c4-zbl-head">
      <div><p class="c4-quy-kicker">Loaded rows</p><h2 class="c4-title">Timezone belts</h2></div>
      <p class="c4-quy-count">Rows 3</p>
    </header>
    <ul class="c4-zbl-rows">
      <li><span class="c4-zbl-face">E</span><p>Ada North</p><p class="c4-meta">Europe · Short</p></li>
      <li><span class="c4-zbl-face">A</span><p>Bea West</p><p class="c4-meta">Americas · Wide</p></li>
    </ul>
  </section>`;

const after = `
  <section class="c4-quy c4-quy-navalia" data-quays="1" data-role="desk" data-desk="navalia">
    <header class="c4-quy-head c4-quy-navalia-mast">
      <p class="c4-quy-plate c4-quy-navalia-seal" data-logo="mono">7FX</p>
      <div>
        <p class="c4-quy-kicker c4-quy-navalia-kicker">Ivory quay navalia</p>
        <h2 class="c4-title c4-quy-navalia-title">Quay slips</h2>
        <p class="c4-quy-navalia-lead">Quay slips rest in an ivory navalia. Graphite holds the shed. Champagne marks the slip in view.</p>
      </div>
      <p class="c4-quy-count c4-quy-navalia-count">2</p>
    </header>
    <ol class="c4-quy-navalia-index" aria-label="Ivory quay navalia">
      <li data-tone="gold">Open 2</li>
      <li data-tone="ink">Held 1</li>
      <li data-tone="ivory">Stowed 0</li>
    </ol>
    <ul class="c4-quy-rows">
      <li class="c4-quy-navalia-card" data-tide="flood"><span class="c4-quy-folio">4</span><div><p>Hold the Ada berth</p><p class="c4-meta">Nia · Oak · Flood · Inner</p></div><button type="button" class="c4-btn">Pin</button></li>
      <li class="c4-quy-navalia-card" data-tide="ebb"><span class="c4-quy-folio">9</span><div><p>Stow the Bea slip</p><p class="c4-meta">No mate · Teak · Ebb · Outer</p></div><button type="button" class="c4-btn">Hold</button></li>
    </ul>
  </section>
  <section class="c4-zbl c4-zbl-praetorium" data-belts="1" data-desk="praetorium">
    <header class="c4-zbl-head c4-zbl-praetorium-mast">
      <p class="c4-zbl-praetorium-seal" data-logo="mono">7FX</p>
      <div>
        <p class="c4-quy-kicker c4-zbl-praetorium-kicker">Graphite belt praetorium</p>
        <h2 class="c4-title c4-zbl-praetorium-title">Timezone belts</h2>
        <p class="c4-zbl-praetorium-lead">Timezone belts stand in a graphite praetorium. Ivory holds each belt. Champagne marks the belt in view.</p>
      </div>
      <p class="c4-quy-count c4-zbl-praetorium-count">Rows 3</p>
    </header>
    <ol class="c4-zbl-praetorium-index" aria-label="Graphite belt praetorium">
      <li data-tone="gold">3</li>
      <li data-tone="ink">Europe</li>
      <li data-tone="ivory">2</li>
    </ol>
    <ul class="c4-zbl-rows">
      <li class="c4-zbl-praetorium-card"><span class="c4-zbl-face">E</span><div><p>Ada North</p><p class="c4-meta">Europe · Short · Ivory</p></div></li>
      <li class="c4-zbl-praetorium-card"><span class="c4-zbl-face">A</span><div><p>Bea West</p><p class="c4-meta">Americas · Wide · Graphite</p></div></li>
    </ul>
  </section>`;

function page(theme, mode) {
  const body = mode === "after" ? after : before;
  return `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body style="margin:0;background:${theme === "dark" ? "#12100e" : "#f4f0e8"};">
    <div data-crmv4-root data-theme="${theme}" style="height:auto;display:block;background:${theme === "dark" ? "#12100e" : "#f4f0e8"};padding:12px 0 28px;">
      ${body}
    </div>
  </body></html>`;
}

const browser = await chromium.launch({ headless: true });
const shots = [
  ["crmv4-r336-before-light", "light", "before", 1280, 980],
  ["crmv4-r336-after-light", "light", "after", 1280, 1280],
  ["crmv4-r336-before-dark", "dark", "before", 1280, 980],
  ["crmv4-r336-after-dark", "dark", "after", 1280, 1280],
  ["crmv4-r336-after-mobile", "light", "after", 390, 1400],
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
