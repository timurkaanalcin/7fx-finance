/** Before/after shots for the round 156 harbor ledger. */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const out = "/opt/cursor/artifacts";
fs.mkdirSync(out, { recursive: true });
const css = fs.readFileSync(new URL("../src/components/crmv4/crmv4.css", import.meta.url), "utf8");

const chain = "c4-pagehead c4-pagehead-folio c4-pagehead-crest c4-pagehead-atelier c4-pagehead-salon c4-pagehead-gallery c4-pagehead-library c4-pagehead-press c4-pagehead-ribbon c4-pagehead-playbill c4-pagehead-interlude c4-pagehead-slip c4-pagehead-vellum c4-pagehead-quire c4-pagehead-promise c4-pagehead-briefing c4-pagehead-dispatch c4-pagehead-loom c4-pagehead-kiln c4-pagehead-proof c4-pagehead-docket";
const rail = "c4-rail c4-rail-luxe c4-rail-folio c4-rail-crest c4-rail-salon c4-rail-gallery c4-rail-library c4-rail-press c4-rail-ribbon c4-rail-playbill c4-rail-interlude c4-rail-slip c4-rail-vellum c4-rail-quire c4-rail-promise c4-rail-briefing c4-rail-dispatch c4-rail-loom c4-rail-kiln c4-rail-proof c4-rail-docket";

const head = (mode) => `
  <div class="${chain}${mode === "after" ? " c4-pagehead-quay" : ""}">
    <div class="c4-crest-band">
      <p class="c4-folio-plate" data-logo="mono" aria-hidden="true">7FX</p>
      <span class="c4-crest-mark" aria-hidden="true"></span>
    </div>
    <div class="c4-crest-copy">
      <h1 class="c4-page-title">${mode === "after" ? "Quay slips" : "Docket slips"}</h1>
      <p class="c4-page-sub">${mode === "after" ? "Harbor desk" : "Document review"}</p>
    </div>
    <form class="c4-page-search c4-search-luxe c4-crest-search" role="search">
      <input class="c4-field" aria-label="Search" placeholder="Search" value="" />
    </form>
  </div>`;

const beforeDesk = `
  <section class="c4-dkt" data-dockets="1">
    <header class="c4-dkt-head">
      <p class="c4-dkt-plate" data-logo="mono">7FX</p>
      <div><p class="c4-dkt-kicker">Document review</p><h2 class="c4-title">Docket slips</h2></div>
      <p class="c4-dkt-count">2</p>
    </header>
    <section class="c4-dkt-kpi" aria-label="Docket mix">
      <p class="c4-dkt-meter" data-tray="open"><span>Open dockets</span><strong>2</strong><span>Share 100%</span><span class="c4-dkt-track"><i style="width:100%"></i></span></p>
      <p class="c4-dkt-meter" data-tray="parked"><span>Parked dockets</span><strong>0</strong><span>Share 0%</span><span class="c4-dkt-track"><i style="width:0%"></i></span></p>
      <p class="c4-dkt-meter" data-tray="filed"><span>Filed dockets</span><strong>0</strong><span>Share 0%</span><span class="c4-dkt-track"><i style="width:0%"></i></span></p>
      <p class="c4-dkt-meter" data-tray="pinned"><span>Pinned dockets</span><strong>1</strong><span>Share 50%</span><span class="c4-dkt-track"><i style="width:50%"></i></span></p>
    </section>
    <ul class="c4-dkt-rows">
      <li data-wax="soft" data-cloth="linen"><span class="c4-dkt-folio">8</span><div><p>Review the Ada linen packet</p><p class="c4-meta">Nia · 8 · Linen · Soft</p></div></li>
      <li data-wax="firm" data-cloth="silk"><span class="c4-dkt-folio">9</span><div><p>Park the Bea silk slip</p><p class="c4-meta">No clerk · 9 · Silk · Firm</p></div></li>
    </ul>
  </section>`;

const afterDesk = `
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
    <section class="c4-quy-chart" aria-label="Watch chart">
      <p class="c4-quy-kicker">Watch chart</p>
      <button type="button" class="c4-quy-col" data-on="1"><span>Cove</span><span class="c4-quy-bar"><i style="width:100%"></i></span><span>2</span></button>
      <button type="button" class="c4-quy-col" data-on="0"><span>Bay</span><span class="c4-quy-bar"><i style="width:8%"></i></span><span>0</span></button>
      <button type="button" class="c4-quy-col" data-on="0"><span>Gulf</span><span class="c4-quy-bar"><i style="width:8%"></i></span><span>0</span></button>
      <button type="button" class="c4-quy-col" data-on="0"><span>Sea</span><span class="c4-quy-bar"><i style="width:8%"></i></span><span>0</span></button>
    </section>
    <ul class="c4-quy-rows">
      <li data-tide="ebb" data-timber="oak" data-watch="cove"><span class="c4-quy-folio">8</span><span class="c4-quy-marks"><i data-on="1"></i><i data-on="0"></i><i data-on="0"></i></span><div><p>Hold the Ada oak packet</p><p class="c4-meta">Nia · 8 · Oak · VIP · Ebb · Inner · Past 1</p></div></li>
      <li data-tide="slack" data-timber="teak" data-watch="cove"><span class="c4-quy-folio">9</span><span class="c4-quy-marks"><i data-on="1"></i><i data-on="1"></i><i data-on="0"></i></span><div><p>Stow the Bea teak slip</p><p class="c4-meta">No mate · 9 · Teak · Slack · Due now</p></div></li>
    </ul>
  </section>
  <section class="c4-zbl" data-belts="1">
    <header class="c4-zbl-head">
      <div><p class="c4-quy-kicker">Loaded rows</p><h2 class="c4-title">Timezone belts</h2></div>
      <p class="c4-quy-count">Rows 4</p>
    </header>
    <p class="c4-zbl-lead"><span>Leading belt</span> Europe</p>
    <section class="c4-zbl-chart" aria-label="All belts">
      <p class="c4-zbl-col" data-belt="europe"><span>Europe</span><span class="c4-quy-track"><i style="width:100%"></i></span><span>2</span><span>Share 50%</span></p>
      <p class="c4-zbl-col" data-belt="asia"><span>Asia</span><span class="c4-quy-track"><i style="width:50%"></i></span><span>1</span><span>Share 25%</span></p>
    </section>
    <ul class="c4-zbl-rows">
      <li data-belt="europe" data-fold="split" data-span="mid"><span class="c4-zbl-face">E</span><p>Ada North</p><p class="c4-meta">Europe/Istanbul · Europe · Mid · Split fold</p></li>
      <li data-belt="asia" data-fold="split" data-span="short"><span class="c4-zbl-face">A</span><p>Bea South</p><p class="c4-meta">Asia/Tokyo · Asia · Short · Split fold</p></li>
    </ul>
  </section>`;

function page(theme, mode, mobile) {
  const railClass = mode === "after" ? " c4-rail-quay" : "";
  const body = mode === "after" ? afterDesk : beforeDesk;
  return `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body style="margin:0;background:${theme === "dark" ? "#12100e" : "#f4f0e8"};">
    <div data-crmv4-root data-theme="${theme}" style="height:auto;display:block;background:${theme === "dark" ? "#12100e" : "#f4f0e8"};">
      <div style="display:${mobile ? "block" : "grid"};grid-template-columns:minmax(0,1fr) 92px;align-items:start;">
        <div>${head(mode)}${body}</div>
        ${mobile ? "" : `<aside class="${rail}${railClass}" style="width:92px;min-height:980px;" aria-label="Admin">
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
  ["crmv4-r156-before-light", "light", "before", false, 1440, 980],
  ["crmv4-r156-after-light", "light", "after", false, 1440, 1500],
  ["crmv4-r156-before-dark", "dark", "before", false, 1440, 980],
  ["crmv4-r156-after-dark", "dark", "after", false, 1440, 1500],
  ["crmv4-r156-after-mobile", "light", "after", true, 390, 1400],
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
