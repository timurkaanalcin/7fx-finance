/** Before/after shots for the round 157 conservatory salon. */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const out = "/opt/cursor/artifacts";
fs.mkdirSync(out, { recursive: true });
const css = fs.readFileSync(new URL("../src/components/crmv4/crmv4.css", import.meta.url), "utf8");

const chain = "c4-pagehead c4-pagehead-folio c4-pagehead-crest c4-pagehead-atelier c4-pagehead-salon c4-pagehead-gallery c4-pagehead-library c4-pagehead-press c4-pagehead-ribbon c4-pagehead-playbill c4-pagehead-interlude c4-pagehead-slip c4-pagehead-vellum c4-pagehead-quire c4-pagehead-promise c4-pagehead-briefing c4-pagehead-dispatch c4-pagehead-loom c4-pagehead-kiln c4-pagehead-proof c4-pagehead-docket c4-pagehead-quay";
const rail = "c4-rail c4-rail-luxe c4-rail-folio c4-rail-crest c4-rail-salon c4-rail-gallery c4-rail-library c4-rail-press c4-rail-ribbon c4-rail-playbill c4-rail-interlude c4-rail-slip c4-rail-vellum c4-rail-quire c4-rail-promise c4-rail-briefing c4-rail-dispatch c4-rail-loom c4-rail-kiln c4-rail-proof c4-rail-docket c4-rail-quay";

const head = (mode) => `
  <div class="${chain}${mode === "after" ? " c4-pagehead-bench" : ""}">
    <div class="c4-crest-band">
      <p class="c4-folio-plate" data-logo="mono" aria-hidden="true">7FX</p>
      <span class="c4-crest-mark" aria-hidden="true"></span>
    </div>
    <div class="c4-crest-copy">
      <h1 class="c4-page-title">${mode === "after" ? "Conservatory benches" : "Quay slips"}</h1>
      <p class="c4-page-sub">${mode === "after" ? "Review desk" : "Harbor desk"}</p>
    </div>
    <form class="c4-page-search c4-search-luxe c4-crest-search" role="search">
      <input class="c4-field" aria-label="Search" placeholder="Search" value="" />
    </form>
  </div>`;

const beforeDesk = `
  <section class="c4-quy" data-quays="1" data-role="desk">
    <header class="c4-quy-head">
      <p class="c4-quy-plate" data-logo="mono">7FX</p>
      <div><p class="c4-quy-kicker">Harbor desk</p><h2 class="c4-title">Quay slips</h2></div>
      <p class="c4-quy-count">2</p>
    </header>
    <p class="c4-quy-notice" role="status"><span>Ebb quays past the berth</span><span class="c4-quy-count">1</span><button type="button" class="c4-btn">Show late</button></p>
    <section class="c4-quy-kpi" aria-label="Quay mix">
      <p class="c4-quy-meter" data-tray="open"><span>Open quays</span><strong>2</strong><span>Share 100%</span><span class="c4-quy-track"><i style="width:100%"></i></span></p>
      <p class="c4-quy-meter" data-tray="held"><span>Held quays</span><strong>0</strong><span>Share 0%</span><span class="c4-quy-track"><i style="width:0%"></i></span></p>
      <p class="c4-quy-meter" data-tray="stowed"><span>Stowed quays</span><strong>0</strong><span>Share 0%</span><span class="c4-quy-track"><i style="width:0%"></i></span></p>
      <p class="c4-quy-meter" data-tray="pinned"><span>Pinned quays</span><strong>1</strong><span>Share 50%</span><span class="c4-quy-track"><i style="width:50%"></i></span></p>
    </section>
    <ul class="c4-quy-rows">
      <li data-tide="ebb" data-timber="oak"><span class="c4-quy-folio">8</span><div><p>Hold the Ada oak packet</p><p class="c4-meta">Nia · 8 · Oak · Ebb</p></div></li>
      <li data-tide="slack" data-timber="teak"><span class="c4-quy-folio">9</span><div><p>Stow the Bea teak slip</p><p class="c4-meta">No mate · 9 · Teak · Slack</p></div></li>
    </ul>
  </section>`;

const afterDesk = `
  <section class="c4-bnk" data-benches="1" data-role="desk">
    <header class="c4-bnk-head">
      <p class="c4-bnk-plate" data-logo="mono">7FX</p>
      <div><p class="c4-bnk-kicker">Review desk</p><h2 class="c4-title">Conservatory benches</h2></div>
      <p class="c4-bnk-count">2</p>
    </header>
    <p class="c4-bnk-notice" role="status"><span>Shade benches past the bench</span><span class="c4-bnk-count">1</span><button type="button" class="c4-btn">Show late</button></p>
    <p class="c4-bnk-notice" role="status"><span>Benches that share a bloom and a ribbon</span><span class="c4-bnk-count">0</span></p>
    <section class="c4-bnk-kpi" aria-label="Bench mix">
      <p class="c4-bnk-meter" data-tray="open"><span>Open benches</span><strong>2</strong><span>Share 100%</span><span class="c4-bnk-track"><i style="width:100%"></i></span></p>
      <p class="c4-bnk-meter" data-tray="rested"><span>Rested benches</span><strong>0</strong><span>Share 0%</span><span class="c4-bnk-track"><i style="width:0%"></i></span></p>
      <p class="c4-bnk-meter" data-tray="pressed"><span>Pressed benches</span><strong>0</strong><span>Share 0%</span><span class="c4-bnk-track"><i style="width:0%"></i></span></p>
      <p class="c4-bnk-meter" data-tray="pinned"><span>Pinned benches</span><strong>1</strong><span>Share 50%</span><span class="c4-bnk-track"><i style="width:50%"></i></span></p>
    </section>
    <section class="c4-bnk-chart" aria-label="Court chart">
      <p class="c4-bnk-kicker">Court chart</p>
      <button type="button" class="c4-bnk-col" data-on="1"><span>North</span><span class="c4-bnk-bar"><i style="width:100%"></i></span><span>2</span></button>
      <button type="button" class="c4-bnk-col" data-on="0"><span>East</span><span class="c4-bnk-bar"><i style="width:8%"></i></span><span>0</span></button>
      <button type="button" class="c4-bnk-col" data-on="0"><span>South</span><span class="c4-bnk-bar"><i style="width:8%"></i></span><span>0</span></button>
      <button type="button" class="c4-bnk-col" data-on="0"><span>West</span><span class="c4-bnk-bar"><i style="width:8%"></i></span><span>0</span></button>
    </section>
    <ul class="c4-bnk-rows">
      <li data-light="shade" data-bloom="rose" data-court="north"><span class="c4-bnk-folio">4</span><span class="c4-bnk-marks"><i data-on="1"></i><i data-on="0"></i><i data-on="0"></i></span><div><p>Review the Ada rose packet</p><p class="c4-meta">Nia · 4 · Rose · VIP · Shade · Near · Past 4</p></div></li>
      <li data-light="dappled" data-bloom="lily" data-court="east"><span class="c4-bnk-folio">8</span><span class="c4-bnk-marks"><i data-on="1"></i><i data-on="1"></i><i data-on="0"></i></span><div><p>Press the Bea lily slip</p><p class="c4-meta">No gardener · 8 · Lily · Dappled · Due now</p></div></li>
    </ul>
  </section>
  <section class="c4-plt" data-plates="1">
    <header class="c4-plt-head">
      <div><p class="c4-bnk-kicker">Loaded rows</p><h2 class="c4-title">Country plates</h2></div>
      <p class="c4-bnk-count">Rows 4</p>
    </header>
    <p class="c4-plt-lead"><span>Leading shelf</span> Alpha</p>
    <section class="c4-plt-chart" aria-label="All shelves">
      <p class="c4-plt-col" data-shelf="alpha"><span>Alpha</span><span class="c4-bnk-track"><i style="width:100%"></i></span><span>2</span><span>Share 50%</span></p>
      <p class="c4-plt-col" data-shelf="beta"><span>Beta</span><span class="c4-bnk-track"><i style="width:50%"></i></span><span>1</span><span>Share 25%</span></p>
    </section>
    <ul class="c4-plt-rows">
      <li data-shelf="alpha" data-fold="plain" data-span="short"><span class="c4-plt-face">A</span><p>Ada North</p><p class="c4-meta">France · Alpha · Short · Plain fold</p></li>
      <li data-shelf="beta" data-fold="plain" data-span="mid"><span class="c4-plt-face">B</span><p>Bea South</p><p class="c4-meta">Germany · Beta · Mid · Plain fold</p></li>
    </ul>
  </section>`;

function page(theme, mode, mobile) {
  const railClass = mode === "after" ? " c4-rail-bench" : "";
  const body = mode === "after" ? afterDesk : beforeDesk;
  return `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body style="margin:0;background:${theme === "dark" ? "#12100e" : "#f4f0e8"};">
    <div data-crmv4-root data-theme="${theme}" style="height:auto;display:block;background:${theme === "dark" ? "#12100e" : "#f4f0e8"};">
      <div style="display:${mobile ? "block" : "grid"};grid-template-columns:minmax(0,1fr) 92px;align-items:start;">
        <div>${head(mode)}${body}</div>
        ${mobile ? "" : `<aside class="${rail}${railClass}" style="width:92px;min-height:1100px;" aria-label="Admin">
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
  ["crmv4-r157-before-light", "light", "before", false, 1440, 980],
  ["crmv4-r157-after-light", "light", "after", false, 1440, 1680],
  ["crmv4-r157-before-dark", "dark", "before", false, 1440, 980],
  ["crmv4-r157-after-dark", "dark", "after", false, 1440, 1680],
  ["crmv4-r157-after-mobile", "light", "after", true, 390, 1600],
];
for (const [name, theme, mode, mobile, width, height] of shots) {
  const pageObj = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  await pageObj.setContent(page(theme, mode, mobile), { waitUntil: "load" });
  const file = path.join(out, `${name}.png`);
  await pageObj.screenshot({ path: file, fullPage: true });
  await pageObj.close();
  console.log(file);
}
await browser.close();
