/** Before/after shots for the ivory country cloister and the graphite tongue nave. */
import fs from "node:fs";
import { chromium } from "playwright";

const out = "/opt/cursor/artifacts";
fs.mkdirSync(out, { recursive: true });
const css = fs.readFileSync(new URL("../src/components/crmv4/crmv4.css", import.meta.url), "utf8");

const before = `
  <section class="c4-country-glance" aria-label="Country glance" data-country-glance="1">
    <header class="c4-pay-head">
      <div>
        <p class="c4-pay-kicker">Loaded countries</p>
        <h2 class="c4-title">Country glance</h2>
      </div>
      <p class="c4-meta">2</p>
    </header>
    <p class="c4-meta">Countries already stored on the traders.</p>
    <ul class="c4-country-rows">
      <li data-country="TR"><p>Ada</p><p class="c4-meta">TR</p></li>
      <li data-country="DE"><p>Bea</p><p class="c4-meta">DE</p></li>
    </ul>
  </section>
  <section class="c4-lang-glance" aria-label="Language glance" data-lang-glance="1">
    <header class="c4-pay-head">
      <div>
        <p class="c4-pay-kicker">Loaded languages</p>
        <h2 class="c4-title">Language glance</h2>
      </div>
      <p class="c4-meta">2</p>
    </header>
    <p class="c4-meta">Languages already stored on the traders.</p>
    <ul class="c4-lang-rows">
      <li data-language="en"><p>Ada</p><p class="c4-meta">en</p></li>
      <li data-language="tr"><p>Bea</p><p class="c4-meta">tr</p></li>
    </ul>
  </section>`;

const after = `
  <section class="c4-country-glance c4-country-cloister" aria-label="Country glance" data-country-glance="1" data-desk="cloister">
    <header class="c4-country-cloister-mast">
      <p class="c4-country-cloister-seal" data-logo="mono">7FX</p>
      <div>
        <p class="c4-country-cloister-kicker">Ivory country cloister</p>
        <h2 class="c4-title c4-country-cloister-title">Country glance</h2>
        <p class="c4-country-cloister-lead">Countries rest in an ivory cloister. Graphite names the row. Champagne marks the country in view.</p>
      </div>
      <p class="c4-country-cloister-count">2</p>
    </header>
    <ol class="c4-country-cloister-index" aria-label="Country glance">
      <li data-tone="gold">Named</li>
      <li data-tone="ink">Blank</li>
      <li data-tone="ivory">Open</li>
    </ol>
    <p class="c4-meta c4-country-cloister-hint">Countries already stored on the traders.</p>
    <div class="c4-country-cloister-chart" aria-label="Country glance">
      <button type="button" class="c4-country-cloister-column" data-on="1" data-country="TR"><i style="height:88px"></i><strong>2</strong><span>TR</span></button>
      <button type="button" class="c4-country-cloister-column" data-on="0" data-country="DE"><i style="height:44px"></i><strong>1</strong><span>DE</span></button>
      <button type="button" class="c4-country-cloister-column" data-on="0" data-country="blank"><i style="height:18px"></i><strong>0</strong><span>Blank</span></button>
    </div>
    <ul class="c4-country-rows c4-country-cloister-list">
      <li class="c4-country-cloister-card" data-country="TR" data-on="1"><p>Ada</p><p class="c4-meta">TR</p><button type="button" class="c4-btn">Customer</button></li>
      <li class="c4-country-cloister-card" data-country="DE"><p>Bea</p><p class="c4-meta">DE</p></li>
    </ul>
  </section>
  <section class="c4-lang-glance c4-tongue-nave" aria-label="Language glance" data-lang-glance="1" data-desk="nave">
    <header class="c4-tongue-nave-mast">
      <p class="c4-tongue-nave-seal" data-logo="mono">7FX</p>
      <div>
        <p class="c4-tongue-nave-kicker">Graphite tongue nave</p>
        <h2 class="c4-title c4-tongue-nave-title">Language glance</h2>
        <p class="c4-tongue-nave-lead">Languages stand in a graphite nave. Ivory holds the row. Champagne marks the tongue in view.</p>
      </div>
      <p class="c4-tongue-nave-count">2</p>
    </header>
    <ol class="c4-tongue-nave-index" aria-label="Language glance">
      <li data-tone="gold">Named</li>
      <li data-tone="ink">Blank</li>
      <li data-tone="ivory">Quiet</li>
    </ol>
    <p class="c4-meta c4-tongue-nave-hint">Languages already stored on the traders.</p>
    <div class="c4-tongue-nave-chart" aria-label="Language glance">
      <button type="button" class="c4-tongue-nave-column" data-on="1" data-language="en"><i style="height:88px"></i><strong>2</strong><span>en</span></button>
      <button type="button" class="c4-tongue-nave-column" data-on="0" data-language="tr"><i style="height:44px"></i><strong>1</strong><span>tr</span></button>
      <button type="button" class="c4-tongue-nave-column" data-on="0" data-language="blank"><i style="height:18px"></i><strong>0</strong><span>Blank</span></button>
    </div>
    <ul class="c4-lang-rows c4-tongue-nave-list">
      <li class="c4-tongue-nave-card" data-language="en" data-on="1"><p>Ada</p><p class="c4-meta">en</p></li>
      <li class="c4-tongue-nave-card" data-language="tr"><p>Bea</p><p class="c4-meta">tr</p></li>
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
  ["crm-round298-cloister-before-light.png", "light", before, false],
  ["crm-round298-cloister-after-light.png", "light", after, false],
  ["crm-round298-cloister-after-dark.png", "dark", after, false],
  ["crm-round298-cloister-after-mobile.png", "light", after, true],
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
