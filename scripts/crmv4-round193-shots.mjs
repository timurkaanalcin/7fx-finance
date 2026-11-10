/** Before/after shots for the round 193 inbox reading room and sitting book. */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const out = "/opt/cursor/artifacts";
fs.mkdirSync(out, { recursive: true });
const css = fs.readFileSync(new URL("../src/components/crmv4/crmv4.css", import.meta.url), "utf8");

const thread = `
  <ol class="c4-inbox-thread">
    <li data-who="customer"><strong>Customer</strong><span>The passport scan is on the file. Can the desk look today?</span><span class="c4-muted">09:14</span></li>
    <li data-who="staff"><strong>Staff</strong><span>Opened. Name and photo match. Expiry is still ahead.</span><span class="c4-muted">09:16</span></li>
    <li data-who="auto"><strong>Automatic</strong><span>A canned reply is ready. The reason stays optional.</span><span class="c4-muted">09:16</span></li>
  </ol>`;

function inbox(mode) {
  const klass = mode === "after" ? "c4-inbox-luxe c4-inbox-gallery" : "c4-inbox-luxe";
  const head = mode === "after"
    ? `<header class="c4-inbox-gallery-mast"><div><p class="c4-inbox-gallery-kicker">Threads waiting on the desk</p><h2 class="c4-title c4-inbox-gallery-title">Inbox</h2></div><p class="c4-inbox-gallery-plate" data-logo="mono">7FX</p></header>`
    : `<h2 class="c4-title">Inbox</h2><p class="c4-muted">Threads waiting on the desk</p>`;
  const split = mode === "after" ? "c4-kyc-split c4-inbox-gallery-split" : "c4-kyc-split";
  return `<section class="${klass}" data-inbox="1">
    ${head}
    <div class="${split}">
      <div>
        <label class="c4-lab"><span>Search</span><input class="c4-field" value="Ada" aria-label="Search" /></label>
        <ul class="c4-kyc-queue">
          <li><button type="button" class="c4-btn" data-on="1" data-mark="unread">Ada North · Unread</button></li>
          <li><button type="button" class="c4-btn" data-mark="waiting">Bea South · Waiting</button></li>
          <li><button type="button" class="c4-btn">Noa West · Read</button></li>
        </ul>
        <p class="c4-empty-gold">No further thread in this view.</p>
      </div>
      <div class="c4-kyc-stage">
        <h3 class="c4-title">Ada North</h3>
        ${thread}
        <div class="c4-line-filters"><button type="button" class="c4-chip" data-on="1">Passport check</button><button type="button" class="c4-chip">Call back</button></div>
        <button type="button" class="c4-btn c4-btn-hot">Send</button>
      </div>
    </div>
  </section>`;
}

const sittings = `
  <section class="c4-stb" data-sittings="1" data-role="desk" data-density="roomy">
    <header class="c4-stb-mast">
      <div><p class="c4-stb-kicker">Appointment desk</p><h2 class="c4-title">Sitting book</h2></div>
      <p class="c4-stb-plate" data-logo="mono">7FX</p>
    </header>
    <p class="c4-stb-notice" role="status">Peak minutes on the open desk · 1 <button type="button" class="c4-btn">Peak minutes only</button></p>
    <dl class="c4-stb-kpi">
      <div><dt>Open</dt><dd>2</dd></div>
      <div><dt>Held</dt><dd>0</dd></div>
      <div><dt>Late</dt><dd>1</dd></div>
      <div><dt>Soon</dt><dd>1</dd></div>
      <div><dt>House share</dt><dd>100%</dd></div>
    </dl>
    <div class="c4-stb-chart">
      <div class="c4-stb-col"><div class="c4-stb-track"><i style="height:100%"></i></div><button type="button" class="c4-btn">Linen · 2</button></div>
      <div class="c4-stb-col"><div class="c4-stb-track"><i style="height:8%"></i></div><button type="button" class="c4-btn">Velvet · 0</button></div>
    </div>
    <ul class="c4-stb-cards">
      <li data-late="1" data-house="1" data-cloth="linen" data-focus="1"><strong>Ada morning sitting</strong><p class="c4-meta">Nia · 6 · Linen · PAR · Wait · High · Fifteen · oak</p></li>
      <li data-soon="1" data-house="1" data-cloth="linen"><strong>Bea noon sitting</strong><p class="c4-meta">Ada · 12 · Linen · LON · Seat · High · Thirty</p></li>
    </ul>
  </section>`;

function page(theme, body, mobile) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head>
    <body style="margin:0;background:${theme === "dark" ? "#12100e" : "#f4f0e8"};">
    <div data-crmv4-root data-theme="${theme}" style="height:auto;display:block;background:${theme === "dark" ? "#12100e" : "#f4f0e8"};">
      <div style="display:${mobile ? "block" : "grid"};grid-template-columns:minmax(0,1fr) 92px;align-items:start;">
        <div>${body}</div>
        ${mobile ? "" : `<aside class="c4-rail" style="width:92px;min-height:780px;"></aside>`}
      </div>
    </div></body></html>`;
}

const shots = [
  ["crmv4-r193-before-inbox.png", "light", inbox("before"), false],
  ["crmv4-r193-after-inbox.png", "light", inbox("after"), false],
  ["crmv4-r193-after-inbox-dark.png", "dark", inbox("after"), false],
  ["crmv4-r193-after-inbox-mobile.png", "light", inbox("after"), true],
  ["crmv4-r193-after-sittings.png", "light", sittings, false],
];

const browser = await chromium.launch({ executablePath: "/usr/local/bin/google-chrome", args: ["--no-sandbox"] });
const pageObj = await browser.newPage({ viewport: { width: 1280, height: 860 }, deviceScaleFactor: 1 });
for (const [name, theme, body, mobile] of shots) {
  if (mobile) await pageObj.setViewportSize({ width: 390, height: 844 });
  else await pageObj.setViewportSize({ width: 1280, height: 860 });
  await pageObj.setContent(page(theme, body, mobile), { waitUntil: "load" });
  await pageObj.screenshot({ path: path.join(out, name) });
}
await browser.close();
console.log("shots", shots.map((shot) => shot[0]).join(" "));
