/** Before/after shots for the ivory referral exedra and the graphite reason tribune. */
import fs from "node:fs";
import { chromium } from "playwright";

const out = "/opt/cursor/artifacts";
fs.mkdirSync(out, { recursive: true });
const css = fs.readFileSync(new URL("../src/components/crmv4/crmv4.css", import.meta.url), "utf8");

const before = `
  <section class="c4-ib-glance" aria-label="Referral glance" data-ib-glance="1">
    <header class="c4-pay-head">
      <div>
        <p class="c4-pay-kicker">Loaded referrals</p>
        <h2 class="c4-title">Referral glance</h2>
      </div>
      <p class="c4-meta">2</p>
    </header>
    <p class="c4-meta">Referrals already stored on the traders.</p>
    <ul class="c4-ib-rows">
      <li data-status="ACTIVE"><p>Ada</p><p class="c4-meta">ACTIVE</p></li>
      <li data-status="PENDING"><p>Bea</p><p class="c4-meta">PENDING</p></li>
    </ul>
  </section>
  <section class="c4-reason-glance" aria-label="Reason glance" data-reason-glance="1">
    <header class="c4-pay-head">
      <div>
        <p class="c4-pay-kicker">Loaded reasons</p>
        <h2 class="c4-title">Reason glance</h2>
      </div>
      <p class="c4-meta">2</p>
    </header>
    <p class="c4-meta">Reasons already stored on the requests.</p>
    <ul class="c4-reason-rows">
      <li data-reason="Review"><p>Ada</p><p class="c4-meta">Review</p></li>
      <li data-reason="Hold"><p>Bea</p><p class="c4-meta">Hold</p></li>
    </ul>
  </section>`;

const after = `
  <section class="c4-ib-glance c4-ib-exedra" aria-label="Referral glance" data-ib-glance="1" data-desk="exedra">
    <header class="c4-ib-exedra-mast">
      <p class="c4-ib-exedra-seal" data-logo="mono">7FX</p>
      <div>
        <p class="c4-ib-exedra-kicker">Ivory referral exedra</p>
        <h2 class="c4-title c4-ib-exedra-title">Referral glance</h2>
        <p class="c4-ib-exedra-lead">Referrals sit in an ivory exedra. Graphite holds the row. Champagne marks the status in view.</p>
      </div>
      <p class="c4-ib-exedra-count">2</p>
    </header>
    <ol class="c4-ib-exedra-index" aria-label="Referral glance">
      <li data-tone="gold">Active</li>
      <li data-tone="ink">Quiet</li>
      <li data-tone="ivory">Other</li>
    </ol>
    <p class="c4-meta c4-ib-exedra-hint">Referrals already stored on the traders.</p>
    <div class="c4-ib-exedra-chart" aria-label="Referral glance">
      <button type="button" class="c4-ib-exedra-column" data-on="1" data-kind="active"><i style="height:88px"></i><strong>2</strong><span>Active</span></button>
      <button type="button" class="c4-ib-exedra-column" data-on="0" data-kind="pending"><i style="height:44px"></i><strong>1</strong><span>Pending</span></button>
    </div>
    <ul class="c4-ib-rows c4-ib-exedra-list">
      <li class="c4-ib-exedra-card" data-status="ACTIVE" data-on="1"><p>Ada</p><p class="c4-meta">ACTIVE</p><button type="button" class="c4-btn">Customer</button></li>
      <li class="c4-ib-exedra-card" data-status="PENDING"><p>Bea</p><p class="c4-meta">PENDING</p></li>
    </ul>
  </section>
  <section class="c4-reason-glance c4-reason-tribune" aria-label="Reason glance" data-reason-glance="1" data-desk="tribune">
    <header class="c4-reason-tribune-mast">
      <p class="c4-reason-tribune-seal" data-logo="mono">7FX</p>
      <div>
        <p class="c4-reason-tribune-kicker">Graphite reason tribune</p>
        <h2 class="c4-title c4-reason-tribune-title">Reason glance</h2>
        <p class="c4-reason-tribune-lead">Reasons stand on a graphite tribune. Ivory holds the row. Champagne marks the reason in view.</p>
      </div>
      <p class="c4-reason-tribune-count">2</p>
    </header>
    <ol class="c4-reason-tribune-index" aria-label="Reason glance">
      <li data-tone="gold">Named</li>
      <li data-tone="ink">Blank</li>
      <li data-tone="ivory">Quiet</li>
    </ol>
    <p class="c4-meta c4-reason-tribune-hint">Reasons already stored on the requests.</p>
    <div class="c4-reason-tribune-chart" aria-label="Reason glance">
      <button type="button" class="c4-reason-tribune-column" data-on="1" data-reason="Review"><i style="height:88px"></i><strong>2</strong><span>Review</span></button>
      <button type="button" class="c4-reason-tribune-column" data-on="0" data-reason="Hold"><i style="height:44px"></i><strong>1</strong><span>Hold</span></button>
      <button type="button" class="c4-reason-tribune-column" data-on="0" data-reason="blank"><i style="height:18px"></i><strong>0</strong><span>Blank</span></button>
    </div>
    <ul class="c4-reason-rows c4-reason-tribune-list">
      <li class="c4-reason-tribune-card" data-reason="Review" data-on="1"><p>Ada</p><p class="c4-meta">Review</p></li>
      <li class="c4-reason-tribune-card" data-reason="Hold"><p>Bea</p><p class="c4-meta">Hold</p></li>
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
  ["crm-round300-exedra-before-light.png", "light", before, false],
  ["crm-round300-exedra-after-light.png", "light", after, false],
  ["crm-round300-exedra-after-dark.png", "dark", after, false],
  ["crm-round300-exedra-after-mobile.png", "light", after, true],
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
