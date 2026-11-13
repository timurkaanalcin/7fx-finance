/** Before/after shots for the round 263 cellar press on inbox and KYC, plus the new desks. */
import fs from "node:fs";
import { chromium } from "playwright";

const out = "/opt/cursor/artifacts";
fs.mkdirSync(out, { recursive: true });
const css = fs.readFileSync(new URL("../src/components/crmv4/crmv4.css", import.meta.url), "utf8");

const before = `
  <section class="c4-inbox-luxe c4-inbox-gallery" data-inbox="1">
    <header class="c4-inbox-gallery-mast">
      <div>
        <p class="c4-inbox-gallery-kicker">Threads on the desk</p>
        <h2 class="c4-title c4-inbox-gallery-title">Inbox</h2>
      </div>
      <p class="c4-inbox-gallery-plate" data-logo="mono">7FX</p>
    </header>
    <div class="c4-kyc-split c4-inbox-gallery-split">
      <div>
        <ul class="c4-kyc-queue">
          <li><button type="button" class="c4-btn" data-on="1" data-mark="unread">Ada · Unread</button></li>
          <li><button type="button" class="c4-btn" data-mark="waiting">Bea · Waiting</button></li>
          <li><button type="button" class="c4-btn">Cem · Read</button></li>
        </ul>
      </div>
      <div class="c4-kyc-stage">
        <h3 class="c4-title">Ada</h3>
        <ol class="c4-inbox-thread">
          <li data-who="customer"><strong>Customer</strong><span>The letter arrived this morning.</span><span class="c4-muted">09:12</span></li>
          <li data-who="staff"><strong>Staff</strong><span>I have it on the desk.</span><span class="c4-muted">09:18</span></li>
          <li data-who="auto"><strong>Automatic</strong><span>A quiet note was filed.</span><span class="c4-muted">09:19</span></li>
        </ol>
      </div>
    </div>
  </section>
  <section class="c4-kyc-luxe c4-kyc-folio c4-kyc-scriptorium" data-kyc="1">
    <header class="c4-kyc-mast">
      <div>
        <p class="c4-kyc-scriptorium-kicker">Documents</p>
        <p class="c4-kyc-kicker">KYC</p>
        <h2 class="c4-title">KYC desk</h2>
      </div>
      <ol class="c4-kyc-scriptorium-index">
        <li data-tone="gold">Queue</li>
        <li data-tone="ink">Approve</li>
        <li data-tone="ivory">Reject</li>
      </ol>
      <p class="c4-kyc-plate" data-logo="mono">7FX</p>
    </header>
    <p class="c4-muted c4-kyc-hint">A reason stays optional.</p>
    <div class="c4-kyc-split">
      <div>
        <ul class="c4-kyc-queue">
          <li><button type="button" class="c4-btn" data-on="1">Ada · 2</button></li>
          <li><button type="button" class="c4-btn">Bea · 1</button></li>
        </ul>
      </div>
      <div class="c4-kyc-stage">
        <h3 class="c4-title">Passport</h3>
        <p class="c4-kyc-empty">No file on this page</p>
        <label class="c4-lab"><span>Reason</span><input class="c4-field" aria-required="false" value="" /></label>
        <div class="c4-row">
          <button type="button" class="c4-btn c4-btn-hot">Approve</button>
          <button type="button" class="c4-btn">Reject</button>
        </div>
      </div>
    </div>
  </section>`;

const after = `
  <section class="c4-inbox-luxe c4-inbox-gallery c4-inbox-cellar" data-inbox="1" data-desk="cellar">
    <header class="c4-inbox-gallery-mast">
      <div>
        <p class="c4-inbox-gallery-kicker">Threads on the desk</p>
        <h2 class="c4-title c4-inbox-gallery-title">Inbox</h2>
      </div>
      <p class="c4-inbox-gallery-plate" data-logo="mono">7FX</p>
    </header>
    <div class="c4-kyc-split c4-inbox-gallery-split">
      <div>
        <ul class="c4-kyc-queue">
          <li><button type="button" class="c4-btn" data-on="1" data-mark="unread">Ada · Unread</button></li>
          <li><button type="button" class="c4-btn" data-mark="waiting">Bea · Waiting</button></li>
          <li><button type="button" class="c4-btn">Cem · Read</button></li>
        </ul>
      </div>
      <div class="c4-kyc-stage">
        <h3 class="c4-title">Ada</h3>
        <ol class="c4-inbox-thread">
          <li data-who="customer"><strong>Customer</strong><span>The letter arrived this morning.</span><span class="c4-muted">09:12</span></li>
          <li data-who="staff"><strong>Staff</strong><span>I have it on the desk.</span><span class="c4-muted">09:18</span></li>
          <li data-who="auto"><strong>Automatic</strong><span>A quiet note was filed.</span><span class="c4-muted">09:19</span></li>
        </ol>
      </div>
    </div>
  </section>
  <section class="c4-kyc-luxe c4-kyc-folio c4-kyc-scriptorium c4-kyc-cellar" data-kyc="1" data-desk="cellar">
    <header class="c4-kyc-mast">
      <div>
        <p class="c4-kyc-scriptorium-kicker">Documents</p>
        <p class="c4-kyc-kicker">KYC</p>
        <h2 class="c4-title">KYC desk</h2>
      </div>
      <ol class="c4-kyc-scriptorium-index">
        <li data-tone="gold">Queue</li>
        <li data-tone="ink">Approve</li>
        <li data-tone="ivory">Reject</li>
      </ol>
      <p class="c4-kyc-plate" data-logo="mono">7FX</p>
    </header>
    <p class="c4-muted c4-kyc-hint">A reason stays optional.</p>
    <div class="c4-kyc-split">
      <div>
        <h3 class="c4-title">Queue</h3>
        <ul class="c4-kyc-queue">
          <li><button type="button" class="c4-btn" data-on="1">Ada · 2</button></li>
          <li><button type="button" class="c4-btn">Bea · 1</button></li>
        </ul>
      </div>
      <div class="c4-kyc-stage" data-ready="0">
        <h3 class="c4-title">Passport</h3>
        <p class="c4-kyc-empty">No file on this page</p>
        <label class="c4-lab"><span>Reason</span><input class="c4-field" aria-required="false" value="" /></label>
        <p class="c4-muted">The approval reason stays optional.</p>
        <div class="c4-row">
          <button type="button" class="c4-btn c4-btn-hot">Approve</button>
          <button type="button" class="c4-btn">Reject</button>
        </div>
      </div>
    </div>
  </section>
  <section class="c4-bty" data-cards="1" data-desk="buttery" data-role="desk" data-density="roomy">
    <header class="c4-bty-mast">
      <p class="c4-bty-seal" data-logo="mono">7FX</p>
      <div class="c4-bty-mast-copy">
        <p class="c4-bty-kicker">A cellar follow-up on the desk</p>
        <h2 class="c4-title">Buttery slips</h2>
      </div>
    </header>
    <p class="c4-bty-notice" role="status">Overdue in the open cellar 1</p>
    <ol class="c4-bty-ledger">
      <li><span>Open</span><strong>3</strong></li>
      <li><span>Pause</span><strong>0</strong></li>
      <li><span>Sealed</span><strong>0</strong></li>
      <li><span>Pinned</span><strong>1</strong></li>
      <li><span>Peak</span><strong>1</strong></li>
      <li><span>Quiet</span><strong>2</strong></li>
      <li><span>Soon</span><strong>1</strong></li>
      <li><span>Overdue</span><strong>1</strong></li>
    </ol>
    <ol class="c4-bty-board">
      <li class="c4-bty-label" data-on="1" data-overdue="1" data-peak="1" data-house="1">
        <div class="c4-bty-monogram">N</div>
        <div></div>
        <div><strong>North vault</strong><p class="c4-bty-meta">Ada · Vault · Flint · Still · 15 · Rank 1</p></div>
      </li>
      <li class="c4-bty-label" data-quiet="1" data-idle="1">
        <div class="c4-bty-monogram">B</div>
        <div></div>
        <div><strong>Bin rest</strong><p class="c4-bty-meta">Bea · Bin · Green · Still · Rank 1</p></div>
      </li>
    </ol>
  </section>
  <section class="c4-prv" data-plates="1" data-traders="3" data-role="desk">
    <header class="c4-prv-mast">
      <p class="c4-prv-seal" data-logo="mono">7FX</p>
      <div>
        <p class="c4-prv-kicker">Invalid-lead source already stored</p>
        <h2 class="c4-title">Provenance plates</h2>
      </div>
    </header>
    <ol class="c4-prv-index">
      <li data-tone="gold">Champagne</li>
      <li data-tone="ink">Graphite</li>
      <li data-tone="ivory">Ivory</li>
    </ol>
    <ul class="c4-prv-kpis">
      <li><span>Leading lane</span><strong>By hand</strong></li>
      <li><span>Leading hue</span><strong>Champagne</strong></li>
      <li><span>Known code</span><strong>2</strong></li>
      <li><span>Hand share</span><strong>33%</strong></li>
    </ul>
    <ol class="c4-prv-board">
      <li class="c4-prv-card" data-lane="hand" data-hue="champagne"><p class="c4-prv-stamp">MANU</p><div></div><div><strong>Ada</strong><p class="c4-prv-meta">By hand · Champagne · Letter count 6</p></div></li>
      <li class="c4-prv-card" data-lane="clock" data-hue="graphite"><p class="c4-prv-stamp">AUTO</p><div></div><div><strong>Bea</strong><p class="c4-prv-meta">Automatic · Graphite · Letter count 4</p></div></li>
      <li class="c4-prv-card" data-lane="mark" data-hue="ivory"><p class="c4-prv-stamp">STAF</p><div></div><div><strong>Cem</strong><p class="c4-prv-meta">Plain word · Ivory · Letter count 5</p></div></li>
    </ol>
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
  ["crm-round263-cellar-before-light.png", "light", before, false],
  ["crm-round263-cellar-after-light.png", "light", after, false],
  ["crm-round263-cellar-after-dark.png", "dark", after, false],
  ["crm-round263-cellar-after-mobile.png", "light", after, true],
];

const browser = await chromium.launch({ headless: true });
for (const [name, theme, body, mobile] of shots) {
  const pageObj = await browser.newPage({ viewport: mobile ? { width: 390, height: 1600 } : { width: 1280, height: 1800 } });
  await pageObj.setContent(page(theme, body, mobile), { waitUntil: "load" });
  await pageObj.screenshot({ path: `${out}/${name}`, fullPage: true });
  await pageObj.close();
}
await browser.close();
console.log("shots written", shots.map((row) => row[0]).join(", "));
