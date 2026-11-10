/** Before/after shots for the round 186 support parlor. */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const out = "/opt/cursor/artifacts";
fs.mkdirSync(out, { recursive: true });
const css = fs.readFileSync(new URL("../src/components/crmv4/crmv4.css", import.meta.url), "utf8");

const tickets = `
  <article class="c4-ticket c4-ticket-luxe" data-status="PENDING" tabindex="0">
    <div class="c4-row c4-between"><strong>Ada North</strong><span class="c4-status" data-tone="warn">PENDING</span></div>
    <p class="c4-muted c4-meta">WITHDRAWAL · desk</p>
    <p>Waiting on the night desk. Reason stays optional.</p>
  </article>
  <article class="c4-ticket c4-ticket-luxe" data-status="APPROVED" tabindex="0">
    <div class="c4-row c4-between"><strong>Bea South</strong><span class="c4-status" data-tone="ok">APPROVED</span></div>
    <p class="c4-muted c4-meta">DEPOSIT · floor</p>
    <p>Cleared for the morning book.</p>
  </article>
  <article class="c4-ticket c4-ticket-luxe" data-status="REJECTED" tabindex="0">
    <div class="c4-row c4-between"><strong>Cy West</strong><span class="c4-status" data-tone="bad">REJECTED</span></div>
    <p class="c4-muted c4-meta">KYC · files</p>
    <p>Returned to the customer.</p>
  </article>
  <p class="c4-empty-gold">No further tickets in this view.</p>`;

function support(mode) {
  const klass = mode === "after"
    ? "c4-stack c4-support-lacquer c4-support-gilt c4-support-parlor"
    : "c4-stack c4-support-lacquer c4-support-gilt";
  const mast = mode === "after" ? `
    <header class="c4-support-mast">
      <div>
        <p class="c4-support-kicker">Tickets and files</p>
        <h2 class="c4-support-title">Support</h2>
      </div>
      <p class="c4-support-plate" data-logo="mono">7FX</p>
    </header>` : `<p class="c4-muted">Tickets and files</p>`;
  return `<div class="${klass}">${mast}
    <div class="c4-row">
      <button type="button" class="c4-chip" data-on="1">Tickets</button>
      <button type="button" class="c4-chip">Chat</button>
      <button type="button" class="c4-chip">KYC</button>
      <button type="button" class="c4-chip">Files</button>
    </div>
    <div class="c4-stack">${tickets}</div>
  </div>`;
}

const slate = `
  <section class="c4-slt" data-slates="1" data-role="desk">
    <header class="c4-slt-mast">
      <div><p class="c4-slt-kicker">Night desk</p><h2 class="c4-title">Slate watches</h2></div>
      <p class="c4-slt-plate" data-logo="mono">7FX</p>
    </header>
    <dl class="c4-slt-kpi">
      <div><dt>Open</dt><dd>2</dd></div>
      <div><dt>Held</dt><dd>0</dd></div>
      <div><dt>Late</dt><dd>1</dd></div>
      <div><dt>Home share</dt><dd>50%</dd></div>
    </dl>
    <div class="c4-slt-chart">
      <div class="c4-slt-col" data-on="1"><span class="c4-slt-swatch" data-tint="pearl"></span><div class="c4-slt-track"><i style="height:100%"></i></div><button type="button" class="c4-btn">Pearl · 2</button></div>
      <div class="c4-slt-col"><span class="c4-slt-swatch" data-tint="soot"></span><div class="c4-slt-track"><i style="height:8%"></i></div><button type="button" class="c4-btn">Soot · 0</button></div>
      <div class="c4-slt-col"><span class="c4-slt-swatch" data-tint="gilt"></span><div class="c4-slt-track"><i style="height:8%"></i></div><button type="button" class="c4-btn">Gilt · 0</button></div>
      <div class="c4-slt-col"><span class="c4-slt-swatch" data-tint="mist"></span><div class="c4-slt-track"><i style="height:8%"></i></div><button type="button" class="c4-btn">Mist · 0</button></div>
    </div>
    <ul class="c4-slt-cards">
      <li data-tint="pearl" data-late="1" data-home="1"><strong>Hold the Ada pearl watch</strong><p class="c4-meta">Nia · 0 · Pearl · TR · Hush · Weight 8 · 10 min</p></li>
      <li data-tint="pearl" data-soon="1"><strong>Walk the Bea mist slate</strong><p class="c4-meta">Ada · 12 · Pearl · Walk · 30 min</p></li>
    </ul>
  </section>`;

function page(theme, body, mobile) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body style="margin:0;background:${theme === "dark" ? "#12100e" : "#f4f0e8"};">
    <div data-crmv4-root data-theme="${theme}" style="height:auto;display:block;background:${theme === "dark" ? "#12100e" : "#f4f0e8"};">
      <div style="display:${mobile ? "block" : "grid"};grid-template-columns:minmax(0,1fr) 92px;align-items:start;">
        <div>${body}</div>
        ${mobile ? "" : `<aside class="c4-rail" style="width:92px;min-height:900px;" aria-label="Admin">
          <p class="c4-rail-plate" data-logo="mono">7FX</p>
          <button type="button" class="c4-rail-btn"><span>Desk</span></button>
        </aside>`}
      </div>
    </div>
  </body></html>`;
}

const browser = await chromium.launch({ headless: true });
const shots = [
  ["crm-round186-support-before-light", "light", support("before"), false, 1440, 980],
  ["crm-round186-support-after-light", "light", support("after"), false, 1440, 1100],
  ["crm-round186-support-before-dark", "dark", support("before"), false, 1440, 980],
  ["crm-round186-support-after-dark", "dark", support("after"), false, 1440, 1100],
  ["crm-round186-support-after-mobile", "light", support("after"), true, 390, 1200],
  ["crm-round186-slate-after-light", "light", slate, false, 1440, 1100],
];
for (const [name, theme, body, mobile, width, height] of shots) {
  const pageObj = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  await pageObj.setContent(page(theme, body, mobile), { waitUntil: "load" });
  const file = path.join(out, `${name}.png`);
  await pageObj.screenshot({ path: file, fullPage: true });
  await pageObj.close();
  console.log(file);
}
await browser.close();
