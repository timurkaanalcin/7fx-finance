/** Before/after shots for the ivory source ambulatory and the graphite desk triforium. */
import fs from "node:fs";
import { chromium } from "playwright";

const out = "/opt/cursor/artifacts";
fs.mkdirSync(out, { recursive: true });
const css = fs.readFileSync(new URL("../src/components/crmv4/crmv4.css", import.meta.url), "utf8");

const before = `
  <section class="c4-source-glance" aria-label="Source glance" data-source-glance="1">
    <header class="c4-pay-head">
      <div>
        <p class="c4-pay-kicker">Loaded sources</p>
        <h2 class="c4-title">Source glance</h2>
      </div>
      <p class="c4-meta">2</p>
    </header>
    <p class="c4-meta">Sources already stored on the traders.</p>
    <ul class="c4-source-rows">
      <li data-source="Web"><p>Ada</p><p class="c4-meta">Web</p></li>
      <li data-source="Desk"><p>Bea</p><p class="c4-meta">Desk</p></li>
    </ul>
  </section>
  <section class="c4-assignee-glance" aria-label="Assignee glance" data-assignee-glance="1">
    <header class="c4-pay-head">
      <div>
        <p class="c4-pay-kicker">Loaded assignees</p>
        <h2 class="c4-title">Assignee glance</h2>
      </div>
      <p class="c4-meta">2</p>
    </header>
    <p class="c4-meta">Assignees already stored on the tickets.</p>
    <ul class="c4-assignee-rows">
      <li data-assignee="Ned"><p>Ada</p><p class="c4-meta">Ned</p></li>
      <li data-assignee="Ida"><p>Bea</p><p class="c4-meta">Ida</p></li>
    </ul>
  </section>`;

const after = `
  <section class="c4-source-glance c4-source-ambulatory" aria-label="Source glance" data-source-glance="1" data-desk="ambulatory">
    <header class="c4-source-ambulatory-mast">
      <p class="c4-source-ambulatory-seal" data-logo="mono">7FX</p>
      <div>
        <p class="c4-source-ambulatory-kicker">Ivory source ambulatory</p>
        <h2 class="c4-title c4-source-ambulatory-title">Source glance</h2>
        <p class="c4-source-ambulatory-lead">Sources rest in an ivory ambulatory. Graphite names the row. Champagne marks the source in view.</p>
      </div>
      <p class="c4-source-ambulatory-count">2</p>
    </header>
    <ol class="c4-source-ambulatory-index" aria-label="Source glance">
      <li data-tone="gold">Named</li>
      <li data-tone="ink">Blank</li>
      <li data-tone="ivory">Open</li>
    </ol>
    <p class="c4-meta c4-source-ambulatory-hint">Sources already stored on the traders.</p>
    <div class="c4-source-ambulatory-chart" aria-label="Source glance">
      <button type="button" class="c4-source-ambulatory-column" data-on="1" data-source="Web"><i style="height:88px"></i><strong>2</strong><span>Web</span></button>
      <button type="button" class="c4-source-ambulatory-column" data-on="0" data-source="Desk"><i style="height:44px"></i><strong>1</strong><span>Desk</span></button>
      <button type="button" class="c4-source-ambulatory-column" data-on="0" data-source="blank"><i style="height:18px"></i><strong>0</strong><span>Blank</span></button>
    </div>
    <ul class="c4-source-rows c4-source-ambulatory-list">
      <li class="c4-source-ambulatory-card" data-source="Web" data-on="1"><p>Ada</p><p class="c4-meta">Web</p><button type="button" class="c4-btn">Customer</button></li>
      <li class="c4-source-ambulatory-card" data-source="Desk"><p>Bea</p><p class="c4-meta">Desk</p></li>
    </ul>
  </section>
  <section class="c4-assignee-glance c4-assignee-triforium" aria-label="Assignee glance" data-assignee-glance="1" data-desk="triforium">
    <header class="c4-assignee-triforium-mast">
      <p class="c4-assignee-triforium-seal" data-logo="mono">7FX</p>
      <div>
        <p class="c4-assignee-triforium-kicker">Graphite desk triforium</p>
        <h2 class="c4-title c4-assignee-triforium-title">Assignee glance</h2>
        <p class="c4-assignee-triforium-lead">Assignees stand in a graphite triforium. Ivory holds the row. Champagne marks the person in view.</p>
      </div>
      <p class="c4-assignee-triforium-count">2</p>
    </header>
    <ol class="c4-assignee-triforium-index" aria-label="Assignee glance">
      <li data-tone="gold">Named</li>
      <li data-tone="ink">Blank</li>
      <li data-tone="ivory">Quiet</li>
    </ol>
    <p class="c4-meta c4-assignee-triforium-hint">Assignees already stored on the tickets.</p>
    <div class="c4-assignee-triforium-chart" aria-label="Assignee glance">
      <button type="button" class="c4-assignee-triforium-column" data-on="1" data-assignee="Ned"><i style="height:88px"></i><strong>2</strong><span>Ned</span></button>
      <button type="button" class="c4-assignee-triforium-column" data-on="0" data-assignee="Ida"><i style="height:44px"></i><strong>1</strong><span>Ida</span></button>
      <button type="button" class="c4-assignee-triforium-column" data-on="0" data-assignee="blank"><i style="height:18px"></i><strong>0</strong><span>Blank</span></button>
    </div>
    <ul class="c4-assignee-rows c4-assignee-triforium-list">
      <li class="c4-assignee-triforium-card" data-assignee="Ned" data-on="1"><p>Ada</p><p class="c4-meta">Ned</p></li>
      <li class="c4-assignee-triforium-card" data-assignee="Ida"><p>Bea</p><p class="c4-meta">Ida</p></li>
    </ul>
  </section>`;

function page(theme, body, mobile) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head>
    <body style="margin:0;background:${theme === "dark" ? "#12100e" : "#f4f0e8"};">
    <div data-crmv4-root data-theme="${theme}" style="height:auto;display:block;background:${theme === "dark" ? "#12100e" : "#f4f0e8"};">
      <div style="display:${mobile ? "block" : "grid"};grid-template-columns:minmax(0,1fr) 92px;align-items:start;">
        <div>${body}</div>
        ${mobile ? "" : `<aside class="c4-rail" style="width:92px;min-height:100%;"></aside>`}
      </div>
    </div></body></html>`;
}

const shots = [
  ["crm-round299-ambulatory-before-light.png", "light", before, false],
  ["crm-round299-ambulatory-after-light.png", "light", after, false],
  ["crm-round299-ambulatory-after-dark.png", "dark", after, false],
  ["crm-round299-ambulatory-after-mobile.png", "light", after, true],
];

const browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/google-chrome" });
for (const [name, theme, body, mobile] of shots) {
  const pageObj = await browser.newPage({ viewport: mobile ? { width: 390, height: 1600 } : { width: 1280, height: 1100 } });
  await pageObj.setContent(page(theme, body, mobile), { waitUntil: "load" });
  await pageObj.screenshot({ path: `${out}/${name}`, fullPage: true });
  await pageObj.close();
}
await browser.close();
console.log("shots written", shots.map((row) => row[0]).join(", "));
