/** Before/after shots for the round 155 ivory gallery folio. */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const out = "/opt/cursor/artifacts";
fs.mkdirSync(out, { recursive: true });
const css = fs.readFileSync(new URL("../src/components/crmv4/crmv4.css", import.meta.url), "utf8");

const chain = "c4-pagehead c4-pagehead-folio c4-pagehead-crest c4-pagehead-atelier c4-pagehead-salon c4-pagehead-gallery c4-pagehead-library c4-pagehead-press c4-pagehead-ribbon c4-pagehead-playbill c4-pagehead-interlude c4-pagehead-slip c4-pagehead-vellum c4-pagehead-quire c4-pagehead-promise c4-pagehead-briefing c4-pagehead-dispatch c4-pagehead-loom c4-pagehead-kiln c4-pagehead-proof";
const rail = "c4-rail c4-rail-luxe c4-rail-folio c4-rail-crest c4-rail-salon c4-rail-gallery c4-rail-library c4-rail-press c4-rail-ribbon c4-rail-playbill c4-rail-interlude c4-rail-slip c4-rail-vellum c4-rail-quire c4-rail-promise c4-rail-briefing c4-rail-dispatch c4-rail-loom c4-rail-kiln c4-rail-proof";

const head = (mode) => `
  <div class="${chain}${mode === "after" ? " c4-pagehead-docket" : ""}">
    <div class="c4-crest-band">
      <p class="c4-folio-plate" data-logo="mono" aria-hidden="true">7FX</p>
      <span class="c4-crest-mark" aria-hidden="true"></span>
    </div>
    <div class="c4-crest-copy">
      <h1 class="c4-page-title">${mode === "after" ? "Docket slips" : "Press proofs"}</h1>
      <p class="c4-page-sub">Document review</p>
    </div>
    <form class="c4-page-search c4-search-luxe c4-crest-search" role="search">
      <input class="c4-field" aria-label="Search" placeholder="Search" value="" />
    </form>
  </div>`;

const beforeDesk = `
  <section class="c4-prf" data-proofs="1">
    <header class="c4-prf-head">
      <p class="c4-prf-plate" data-logo="mono">7FX</p>
      <div><p class="c4-prf-kicker">Document review</p><h2 class="c4-title">Press proofs</h2></div>
      <p class="c4-prf-count">2</p>
    </header>
    <section class="c4-prf-kpi" aria-label="Proof mix">
      <p class="c4-prf-meter" data-tray="open"><span>Open proofs</span><strong>2</strong><span>Share 100%</span><span class="c4-prf-track"><i style="width:100%"></i></span></p>
      <p class="c4-prf-meter" data-tray="held"><span>Held proofs</span><strong>0</strong><span>Share 0%</span><span class="c4-prf-track"><i style="width:0%"></i></span></p>
      <p class="c4-prf-meter" data-tray="bound"><span>Bound proofs</span><strong>0</strong><span>Share 0%</span><span class="c4-prf-track"><i style="width:0%"></i></span></p>
      <p class="c4-prf-meter" data-tray="pinned"><span>Pinned proofs</span><strong>1</strong><span>Share 50%</span><span class="c4-prf-track"><i style="width:50%"></i></span></p>
    </section>
    <ul class="c4-prf-rows">
      <li data-ink="pale"><span class="c4-prf-folio">8</span><div><p>Check the Ada packet</p><p class="c4-meta">Nia · Rag · Pale</p></div></li>
      <li data-ink="set"><span class="c4-prf-folio">9</span><div><p>Hold the Bea sheet</p><p class="c4-meta">No reader · Laid · Set</p></div></li>
    </ul>
  </section>`;

const afterDesk = `
  <section class="c4-dkt" data-dockets="1" data-role="desk">
    <header class="c4-dkt-head">
      <p class="c4-dkt-plate" data-logo="mono">7FX</p>
      <div><p class="c4-dkt-kicker">Document review</p><h2 class="c4-title">Docket slips</h2></div>
      <p class="c4-dkt-count">2</p>
    </header>
    <p class="c4-dkt-notice" role="status"><span>Soft dockets past the number</span><span class="c4-dkt-count">1</span><button type="button" class="c4-btn">Show late</button></p>
    <section class="c4-dkt-kpi" aria-label="Docket mix">
      <p class="c4-dkt-meter" data-tray="open"><span>Open dockets</span><strong>2</strong><span>Share 100%</span><span class="c4-dkt-track"><i style="width:100%"></i></span></p>
      <p class="c4-dkt-meter" data-tray="parked"><span>Parked dockets</span><strong>0</strong><span>Share 0%</span><span class="c4-dkt-track"><i style="width:0%"></i></span></p>
      <p class="c4-dkt-meter" data-tray="filed"><span>Filed dockets</span><strong>0</strong><span>Share 0%</span><span class="c4-dkt-track"><i style="width:0%"></i></span></p>
      <p class="c4-dkt-meter" data-tray="pinned"><span>Pinned dockets</span><strong>1</strong><span>Share 50%</span><span class="c4-dkt-track"><i style="width:50%"></i></span></p>
    </section>
    <section class="c4-dkt-chart" aria-label="Watch chart">
      <p class="c4-dkt-kicker">Watch chart</p>
      <button type="button" class="c4-dkt-col" data-on="1"><span class="c4-dkt-bar"><i style="height:100%"></i></span><span>Dawn</span><span>2</span></button>
      <button type="button" class="c4-dkt-col" data-on="0"><span class="c4-dkt-bar"><i style="height:8%"></i></span><span>Noon</span><span>0</span></button>
      <button type="button" class="c4-dkt-col" data-on="0"><span class="c4-dkt-bar"><i style="height:8%"></i></span><span>Dusk</span><span>0</span></button>
      <button type="button" class="c4-dkt-col" data-on="0"><span class="c4-dkt-bar"><i style="height:8%"></i></span><span>Night</span><span>0</span></button>
    </section>
    <ul class="c4-dkt-rows">
      <li data-wax="soft" data-cloth="linen" data-watch="dawn"><span class="c4-dkt-folio">8</span><span class="c4-dkt-seals"><i data-on="1"></i><i data-on="0"></i><i data-on="0"></i></span><div><p>Review the Ada linen packet</p><p class="c4-meta">Nia · 8 · Linen · VIP · Soft · Inner · Past 1</p></div></li>
      <li data-wax="firm" data-cloth="silk" data-watch="dawn"><span class="c4-dkt-folio">9</span><span class="c4-dkt-seals"><i data-on="1"></i><i data-on="1"></i><i data-on="0"></i></span><div><p>Park the Bea silk slip</p><p class="c4-meta">No clerk · 9 · Silk · Firm · Due now</p></div></li>
    </ul>
  </section>`;

const family = `
  <section class="c4-fam" data-family="1">
    <header class="c4-fam-head">
      <div><p class="c4-dkt-kicker">Loaded rows</p><h2 class="c4-title">Family names</h2></div>
      <p class="c4-dkt-count">Rows 4</p>
    </header>
    <p class="c4-fam-lead"><span>Leading initial</span> A</p>
    <section class="c4-fam-chart" aria-label="All initials">
      <p class="c4-fam-col"><span class="c4-fam-mark">A</span><span>A</span><span class="c4-dkt-track"><i style="width:100%"></i></span><span>2</span><span>Share 50%</span></p>
      <p class="c4-fam-col"><span class="c4-fam-mark">V</span><span>V</span><span class="c4-dkt-track"><i style="width:50%"></i></span><span>1</span><span>Share 25%</span></p>
    </section>
    <ul class="c4-fam-rows">
      <li data-span="short" data-shape="plain"><span class="c4-fam-face">A</span><p>Ada North</p><p class="c4-meta">Ada · Short · Plain</p></li>
      <li data-span="mid" data-shape="stacked"><span class="c4-fam-face">V</span><p>Vincent West</p><p class="c4-meta">van Gogh · Mid · Stacked</p></li>
    </ul>
  </section>`;

function page(theme, mode, mobile) {
  const railClass = mode === "after" ? " c4-rail-docket" : "";
  const body = mode === "after" ? `${afterDesk}${family}` : beforeDesk;
  return `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body style="margin:0;background:${theme === "dark" ? "#12100e" : "#f4f0e8"};">
    <div data-crmv4-root data-theme="${theme}" style="height:auto;display:block;background:${theme === "dark" ? "#12100e" : "#f4f0e8"};">
      <div style="display:${mobile ? "block" : "grid"};grid-template-columns:minmax(0,1fr) 92px;align-items:start;">
        <div>${head(mode)}${body}</div>
        ${mobile ? "" : `<aside class="${rail}${railClass}" style="width:92px;min-height:860px;" aria-label="Admin">
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
  ["crmv4-r155-before-light", "light", "before", false, 1440, 980],
  ["crmv4-r155-after-light", "light", "after", false, 1440, 1400],
  ["crmv4-r155-before-dark", "dark", "before", false, 1440, 980],
  ["crmv4-r155-after-dark", "dark", "after", false, 1440, 1400],
  ["crmv4-r155-after-mobile", "light", "after", true, 390, 1280],
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
