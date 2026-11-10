/** Before/after shots for the round 151 courier folio. */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const out = "/opt/cursor/artifacts";
fs.mkdirSync(out, { recursive: true });
const css = fs.readFileSync(new URL("../src/components/crmv4/crmv4.css", import.meta.url), "utf8");

const head = (mode) => `
  <div class="c4-pagehead c4-pagehead-folio c4-pagehead-crest c4-pagehead-atelier c4-pagehead-salon c4-pagehead-gallery c4-pagehead-library c4-pagehead-press c4-pagehead-ribbon c4-pagehead-playbill c4-pagehead-interlude c4-pagehead-slip c4-pagehead-vellum c4-pagehead-quire c4-pagehead-promise c4-pagehead-briefing${mode === "after" ? " c4-pagehead-dispatch" : ""}">
    <div class="c4-crest-band">
      <p class="c4-folio-plate" data-logo="mono" aria-hidden="true">7FX</p>
      <span class="c4-crest-mark" aria-hidden="true"></span>
    </div>
    <div class="c4-crest-copy">
      <h1 class="c4-page-title">${mode === "after" ? "Dispatch slips" : "Shift briefings"}</h1>
      <p class="c4-page-sub">${mode === "after" ? "This desk" : "This desk"}</p>
    </div>
    <form class="c4-page-search c4-search-luxe c4-crest-search" role="search">
      <input class="c4-field" aria-label="Search" placeholder="Search" value="" />
    </form>
  </div>`;

const beforeDesk = `
  <section class="c4-brf" data-briefing="1">
    <header class="c4-brf-head">
      <p class="c4-brf-plate" data-logo="mono">7FX</p>
      <div><p class="c4-pay-kicker">This desk</p><h2 class="c4-title">Shift briefings</h2></div>
      <p class="c4-brf-count">2</p>
    </header>
    <section class="c4-brf-kpi" aria-label="Briefing mix">
      <p class="c4-brf-meter" data-tray="open"><span>Open briefings</span><span>2</span><span>Share 100%</span><span class="c4-brf-track"><i style="width:100%"></i></span></p>
      <p class="c4-brf-meter" data-tray="parked"><span>Parked briefings</span><span>0</span><span>Share 0%</span><span class="c4-brf-track"><i style="width:0%"></i></span></p>
      <p class="c4-brf-meter" data-tray="sealed"><span>Sealed briefings</span><span>0</span><span>Share 0%</span><span class="c4-brf-track"><i style="width:0%"></i></span></p>
      <p class="c4-brf-meter" data-tray="pinned"><span>Pinned briefings</span><span>1</span><span>Share 50%</span><span class="c4-brf-track"><i style="width:50%"></i></span></p>
    </section>
    <ul class="c4-brf-rows">
      <li data-tone="sharp"><span class="c4-brf-clock">1</span><div><p>Call Ada before the salon opens</p><p class="c4-meta">Nia · Salon · VIP · Sharp</p></div></li>
      <li data-tone="even"><span class="c4-brf-clock">4</span><div><p>Leave the floor note for Bea</p><p class="c4-meta">No steward · Line · Even</p></div></li>
    </ul>
  </section>`;

const afterDesk = `
  <section class="c4-dsp" data-dispatch="1" data-role="desk">
    <header class="c4-dsp-head">
      <p class="c4-dsp-plate" data-logo="mono">7FX</p>
      <div><p class="c4-dsp-kicker">This desk</p><h2 class="c4-title">Dispatch slips</h2></div>
      <p class="c4-dsp-count">2</p>
    </header>
    <p class="c4-dsp-notice" role="status"><span>Late open slips</span><span class="c4-dsp-count">1</span><button type="button" class="c4-btn">Show late</button></p>
    <section class="c4-dsp-kpi" aria-label="Slip mix">
      <p class="c4-dsp-meter" data-tray="open"><span>Open slips</span><strong>2</strong><span>Share 100%</span><span class="c4-dsp-track"><i style="width:100%"></i></span></p>
      <p class="c4-dsp-meter" data-tray="held"><span>Held slips</span><strong>0</strong><span>Share 0%</span><span class="c4-dsp-track"><i style="width:0%"></i></span></p>
      <p class="c4-dsp-meter" data-tray="filed"><span>Filed slips</span><strong>0</strong><span>Share 0%</span><span class="c4-dsp-track"><i style="width:0%"></i></span></p>
      <p class="c4-dsp-meter" data-tray="pinned"><span>Pinned slips</span><strong>1</strong><span>Share 50%</span><span class="c4-dsp-track"><i style="width:50%"></i></span></p>
    </section>
    <section class="c4-dsp-chart" aria-label="Daypart chart">
      <p class="c4-dsp-kicker">Daypart chart</p>
      <button type="button" class="c4-dsp-col" data-on="0"><span class="c4-dsp-bar"><i style="height:8%"></i></span><span>Night</span><span>0</span></button>
      <button type="button" class="c4-dsp-col" data-on="1"><span class="c4-dsp-bar"><i style="height:100%"></i></span><span>Morning</span><span>1</span></button>
      <button type="button" class="c4-dsp-col" data-on="0"><span class="c4-dsp-bar"><i style="height:8%"></i></span><span>Afternoon</span><span>0</span></button>
      <button type="button" class="c4-dsp-col" data-on="0"><span class="c4-dsp-bar"><i style="height:100%"></i></span><span>Evening</span><span>1</span></button>
    </section>
    <ul class="c4-dsp-rows">
      <li data-pace="gallop" data-lane="north" data-hour="morning"><span class="c4-dsp-clock">8</span><div><p>Send the north packet to Ada</p><p class="c4-meta">Nia · North · VIP · Gallop · Past 1</p></div></li>
      <li data-pace="walk" data-lane="west" data-hour="evening"><span class="c4-dsp-clock">18</span><div><p>Hold the west wax for Bea</p><p class="c4-meta">No courier · West · Walk · Left 9</p></div></li>
    </ul>
  </section>`;

function page(theme, mode, mobile) {
  const railClass = mode === "after" ? " c4-rail-dispatch" : "";
  return `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body style="margin:0;background:${theme === "dark" ? "#12100e" : "#f4f0e8"};">
    <div data-crmv4-root data-theme="${theme}" style="height:auto;display:block;background:${theme === "dark" ? "#12100e" : "#f4f0e8"};">
      <div style="display:${mobile ? "block" : "grid"};grid-template-columns:minmax(0,1fr) 92px;align-items:start;">
        <div>${head(mode)}${mode === "after" ? afterDesk : beforeDesk}</div>
        ${mobile ? "" : `<aside class="c4-rail c4-rail-luxe c4-rail-folio c4-rail-crest c4-rail-salon c4-rail-gallery c4-rail-library c4-rail-press c4-rail-ribbon c4-rail-playbill c4-rail-interlude c4-rail-slip c4-rail-vellum c4-rail-quire c4-rail-promise c4-rail-briefing${railClass}" style="width:92px;min-height:640px;" aria-label="Admin">
          <p class="c4-rail-plate" data-logo="mono">7FX</p>
          <button type="button" class="c4-rail-btn"><span>Desk</span></button>
          <button type="button" class="c4-rail-btn"><span>Notes</span></button>
          <button type="button" class="c4-rail-btn"><span>EN</span></button>
        </aside>`}
      </div>
    </div>
  </body></html>`;
}

const browser = await chromium.launch({ headless: true });
const shots = [
  ["crmv4-r151-before-light", "light", "before", false, 1440, 980],
  ["crmv4-r151-after-light", "light", "after", false, 1440, 1180],
  ["crmv4-r151-before-dark", "dark", "before", false, 1440, 980],
  ["crmv4-r151-after-dark", "dark", "after", false, 1440, 1180],
  ["crmv4-r151-after-mobile", "light", "after", true, 390, 1100],
];
for (const [name, theme, mode, mobile, width, height] of shots) {
  const pageObj = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  await pageObj.setContent(page(theme, mode, mobile), { waitUntil: "load" });
  const file = path.join(out, `${name}.png`);
  await pageObj.screenshot({ path: file, fullPage: true });
  const box = await pageObj.evaluate(() => ({
    w: document.documentElement.scrollWidth,
    c: document.documentElement.clientWidth,
  }));
  console.log(name, box);
  await pageObj.close();
}
await browser.close();
