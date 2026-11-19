/** Before/after shots for the ivory link cloister and the graphite priority nave. */
import fs from "node:fs";
import { chromium } from "playwright";

const out = "/opt/cursor/artifacts";
fs.mkdirSync(out, { recursive: true });
const css = fs.readFileSync(new URL("../src/components/crmv4/crmv4.css", import.meta.url), "utf8");

const before = `
  <section class="c4-quick-links" aria-label="Quick links" data-quick-links="1">
    <header class="c4-pay-head">
      <div>
        <p class="c4-pay-kicker">Saved links</p>
        <h2 class="c4-title">Quick links</h2>
      </div>
      <p class="c4-meta">2</p>
    </header>
    <p class="c4-meta">Links the desk keeps in this browser.</p>
    <ul class="c4-link-list">
      <li class="c4-link-card" data-pinned="1"><p>Desk handbook</p><p class="c4-meta">https://desk.example/handbook</p><div class="c4-row"><button type="button" class="c4-btn">Open</button><button type="button" class="c4-btn">Unpin</button></div></li>
      <li class="c4-link-card" data-pinned="0"><p>Callback sheet</p><p class="c4-meta">https://desk.example/callbacks</p><div class="c4-row"><button type="button" class="c4-btn">Open</button><button type="button" class="c4-btn">Pin</button></div></li>
    </ul>
  </section>
  <section class="c4-priority-glance" aria-label="Priority glance" data-priority-glance="1">
    <header class="c4-pay-head">
      <div>
        <p class="c4-pay-kicker">Tickets by priority</p>
        <h2 class="c4-title">Priority glance</h2>
      </div>
      <p class="c4-meta">2</p>
    </header>
    <p class="c4-meta">Priorities already stored on the tickets.</p>
    <ul class="c4-priority-rows">
      <li data-priority="High"><p>Amina</p><p class="c4-meta">High</p><button type="button" class="c4-btn">Customer</button></li>
      <li data-priority="blank"><p>Nia</p><p class="c4-meta">Blank</p></li>
    </ul>
  </section>`;

const after = `
  <section class="c4-quick-links c4-link-cloister" aria-label="Quick links" data-quick-links="1" data-desk="cloister">
    <header class="c4-link-cloister-mast">
      <p class="c4-link-cloister-seal" data-logo="mono">7FX</p>
      <div>
        <p class="c4-link-cloister-kicker">Ivory link cloister</p>
        <h2 class="c4-title c4-link-cloister-title">Quick links</h2>
        <p class="c4-link-cloister-lead">Links rest in an ivory cloister. Graphite names the card. Champagne marks what is pinned.</p>
      </div>
      <p class="c4-link-cloister-count">2</p>
    </header>
    <ol class="c4-link-cloister-index" aria-label="Quick links">
      <li data-tone="gold">Pinned</li>
      <li data-tone="ink">Open</li>
      <li data-tone="ivory">Hidden</li>
    </ol>
    <p class="c4-link-cloister-hint">Links the desk keeps in this browser.</p>
    <ul class="c4-link-list c4-link-cloister-list">
      <li class="c4-link-card c4-link-cloister-card" data-pinned="1"><p>Desk handbook</p><p class="c4-meta">https://desk.example/handbook</p><div class="c4-row"><button type="button" class="c4-btn">Open</button><button type="button" class="c4-btn">Unpin</button></div></li>
      <li class="c4-link-card c4-link-cloister-card" data-pinned="0"><p>Callback sheet</p><p class="c4-meta">https://desk.example/callbacks</p><div class="c4-row"><button type="button" class="c4-btn">Open</button><button type="button" class="c4-btn">Pin</button></div></li>
    </ul>
  </section>
  <section class="c4-priority-glance c4-priority-nave" aria-label="Priority glance" data-priority-glance="1" data-desk="nave">
    <header class="c4-priority-nave-mast">
      <p class="c4-priority-nave-seal" data-logo="mono">7FX</p>
      <div>
        <p class="c4-priority-nave-kicker">Graphite priority nave</p>
        <h2 class="c4-title c4-priority-nave-title">Priority glance</h2>
        <p class="c4-priority-nave-lead">Priorities stand in a graphite nave. Ivory holds the row. Champagne marks the priority in view.</p>
      </div>
      <p class="c4-priority-nave-count">2</p>
    </header>
    <ol class="c4-priority-nave-index" aria-label="Priority glance">
      <li data-tone="gold">Chosen</li>
      <li data-tone="ink">Named</li>
      <li data-tone="ivory">Blank</li>
    </ol>
    <p class="c4-priority-nave-hint">Priorities already stored on the tickets.</p>
    <div class="c4-priority-nave-chart" aria-label="Priority glance">
      <button type="button" class="c4-priority-nave-column" data-on="1" data-priority="High"><i style="height:88px"></i><strong>2</strong><span>High</span></button>
      <button type="button" class="c4-priority-nave-column" data-on="0" data-priority="blank"><i style="height:44px"></i><strong>1</strong><span>Blank</span></button>
    </div>
    <ul class="c4-priority-rows c4-priority-nave-list">
      <li class="c4-priority-nave-card" data-priority="High" data-on="1"><p>Amina</p><p class="c4-meta">High</p><button type="button" class="c4-btn">Customer</button></li>
      <li class="c4-priority-nave-card" data-priority="blank"><p>Nia</p><p class="c4-meta">Blank</p></li>
    </ul>
  </section>`;

function page(theme, body, mobile) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head>
    <body style="margin:0;background:${theme === "dark" ? "#12100e" : "#f4f0e8"};">
    <div data-crmv4-root data-theme="${theme}" style="height:auto;display:block;background:${theme === "dark" ? "#12100e" : "#f4f0e8"};">
      <div style="display:${mobile ? "block" : "grid"};grid-template-columns:minmax(0,1fr) 92px;align-items:start;">
        <div>${body}</div>
        ${mobile ? "" : `<aside class="c4-rail" style="width:92px;min-height:900px;"></aside>`}
      </div>
    </div></body></html>`;
}

const shots = [
  ["crm-round295-cloister-before-light.png", "light", before, false],
  ["crm-round295-cloister-after-light.png", "light", after, false],
  ["crm-round295-cloister-after-dark.png", "dark", after, false],
  ["crm-round295-cloister-after-mobile.png", "light", after, true],
];

const browser = await chromium.launch({ headless: true });
for (const [name, theme, body, mobile] of shots) {
  const pageObj = await browser.newPage({ viewport: mobile ? { width: 390, height: 1800 } : { width: 1280, height: 1600 } });
  await pageObj.setContent(page(theme, body, mobile), { waitUntil: "load" });
  await pageObj.screenshot({ path: `${out}/${name}`, fullPage: true });
  await pageObj.close();
}
await browser.close();
console.log("shots written", shots.map((row) => row[0]).join(", "));
