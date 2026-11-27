/** Before/after shots for the ivory method pintle, graphite asset breasthook, washboard courses, and gudgeon plates. */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const out = "/opt/cursor/artifacts";
fs.mkdirSync(out, { recursive: true });
const css = fs.readFileSync(new URL("../src/components/crmv4/crmv4.css", import.meta.url), "utf8");

const before = `
  <section class="c4-card" aria-label="Methods">
    <h3 class="c4-title">Methods</h3>
    <ul>
      <li class="c4-ops-row"><span>North quay · IBAN</span><button type="button" class="c4-btn">Enabled</button></li>
      <li class="c4-ops-row"><span>Cold wallet · CRYPTO</span><button type="button" class="c4-btn">Disabled</button></li>
    </ul>
    <form class="c4-form c4-ops-form" aria-label="Create method">
      <label class="c4-lab"><span>Type</span><select class="c4-select"><option>IBAN</option></select></label>
      <label class="c4-lab"><span>Label</span><input class="c4-field" value="North quay" /></label>
      <label class="c4-lab"><span>Bank</span><input class="c4-field" value="Quay bank" /></label>
      <button type="button" class="c4-btn c4-btn-hot">Add method</button>
    </form>
  </section>
  <section class="c4-card" aria-label="Assets">
    <h3 class="c4-title">Assets</h3>
    <input class="c4-field" value="EUR" aria-label="Search" />
    <ul>
      <li class="c4-ops-row"><span>EURUSD · Euro · FX</span><button type="button" class="c4-btn">Enabled</button></li>
      <li class="c4-ops-row"><span>XAUUSD · Gold · Metal</span><button type="button" class="c4-btn">Disabled</button></li>
    </ul>
  </section>`;

const after = `
  <section class="c4-method-pintle" data-method-pintle="1" aria-label="Methods">
    <header class="c4-method-pintle-mast">
      <p class="c4-method-pintle-seal" data-logo="mono">7FX</p>
      <div>
        <p class="c4-method-pintle-kicker">Ivory method pintle</p>
        <h3 class="c4-title">Methods</h3>
        <p class="c4-method-pintle-lead">The payment method form sits on an ivory pintle. Graphite holds the fields. Champagne marks the pin.</p>
      </div>
    </header>
    <ol class="c4-method-pintle-index" aria-label="Methods">
      <li data-tone="gold">2</li>
      <li data-tone="ink">Type</li>
      <li data-tone="ivory">Label</li>
    </ol>
    <ul>
      <li class="c4-ops-row" data-live="on"><span>North quay · IBAN</span><button type="button" class="c4-btn">Enabled</button></li>
      <li class="c4-ops-row" data-live="off"><span>Cold wallet · CRYPTO</span><button type="button" class="c4-btn">Disabled</button></li>
    </ul>
    <form class="c4-form c4-ops-form" aria-label="Create method">
      <label class="c4-lab"><span>Type</span><select class="c4-select"><option>IBAN</option></select></label>
      <label class="c4-lab"><span>Label</span><input class="c4-field" value="North quay" /></label>
      <label class="c4-lab"><span>Bank</span><input class="c4-field" value="Quay bank" /></label>
      <button type="button" class="c4-btn c4-btn-hot">Add method</button>
    </form>
  </section>
  <section class="c4-asset-breasthook" data-asset-breasthook="1" aria-label="Assets">
    <header class="c4-asset-breasthook-mast">
      <p class="c4-asset-breasthook-seal" data-logo="mono">7FX</p>
      <div>
        <p class="c4-asset-breasthook-kicker">Graphite asset breasthook</p>
        <h3 class="c4-title">Assets</h3>
        <p class="c4-asset-breasthook-lead">The asset list opens on graphite. Ivory type stays readable. Champagne rings the breasthook.</p>
      </div>
    </header>
    <ol class="c4-asset-breasthook-index" aria-label="Assets">
      <li data-tone="gold">2</li>
      <li data-tone="ink">Symbol</li>
      <li data-tone="ivory">Enabled</li>
    </ol>
    <input class="c4-field" value="EUR" aria-label="Search" />
    <ul>
      <li class="c4-ops-row" data-live="on"><span>EURUSD · Euro · FX</span><button type="button" class="c4-btn">Enabled</button></li>
      <li class="c4-ops-row" data-live="off"><span>XAUUSD · Gold · Metal</span><button type="button" class="c4-btn">Disabled</button></li>
    </ul>
  </section>
  <section class="c4-wsb419" aria-label="Washboard courses" data-wsb419="1" data-role="desk" data-density="open">
    <header class="c4-wsb419-mast">
      <p class="c4-wsb419-seal" data-logo="mono">7FX</p>
      <div>
        <p class="c4-wsb419-kicker">Flush planks on the yard</p>
        <h2 class="c4-title">Washboard courses</h2>
      </div>
      <p class="c4-wsb419-count">2</p>
    </header>
    <p class="c4-wsb419-hint">Courses stay in this browser. Ivory is the quiet ground.</p>
    <ol class="c4-wsb419-index" aria-label="Reminders">
      <li data-tone="gold">Overdue 1</li>
      <li>Warm 1</li>
      <li>Quiet 1</li>
    </ol>
    <div class="c4-wsb419-chart" aria-label="Chart">
      <button type="button" class="c4-wsb419-column" data-on="1"><i style="width:80%"></i><strong>1</strong><span>Washboard</span></button>
      <button type="button" class="c4-wsb419-column"><i style="width:40%"></i><strong>0</strong><span>Bobstay</span></button>
      <button type="button" class="c4-wsb419-column"><i style="width:40%"></i><strong>0</strong><span>Jibboom</span></button>
      <button type="button" class="c4-wsb419-column"><i style="width:70%"></i><strong>1</strong><span>Skeg</span></button>
    </div>
  </section>
  <section class="c4-gdg419" aria-label="Gudgeon seen plates" data-gdg419="1" data-role="desk" data-seen="1">
    <header class="c4-gdg419-mast">
      <p class="c4-gdg419-seal" data-logo="mono">7FX</p>
      <div>
        <p class="c4-gdg419-kicker">Last seen time already on the account</p>
        <h2 class="c4-title">Gudgeon seen plates</h2>
      </div>
      <p class="c4-gdg419-count">2</p>
    </header>
    <p class="c4-gdg419-hint">Plates read the last seen time already stored. Money fields are not read.</p>
    <div class="c4-gdg419-chart" aria-label="Chart">
      <button type="button" class="c4-gdg419-column" data-on="1"><i style="width:90%"></i><strong>1</strong><span>Live</span></button>
      <button type="button" class="c4-gdg419-column"><i style="width:50%"></i><strong>1</strong><span>Hold</span></button>
    </div>
  </section>`;

function page(theme, mode) {
  const body = mode === "after" ? after : before;
  const ground = theme === "dark" ? "#12100e" : "#f4f0e8";
  return `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body style="margin:0;background:${ground};">
    <div data-crmv4-root data-theme="${theme}" style="height:auto;display:block;background:${ground};padding:12px 16px 28px;">
      ${body}
    </div>
  </body></html>`;
}

const browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/google-chrome", args: ["--no-sandbox"] });
const shots = [
  ["crmv4-r419-before-light", "light", "before", 1280, 900],
  ["crmv4-r419-after-light", "light", "after", 1280, 1800],
  ["crmv4-r419-before-dark", "dark", "before", 1280, 900],
  ["crmv4-r419-after-dark", "dark", "after", 1280, 1800],
  ["crmv4-r419-before-mobile", "light", "before", 390, 1100],
  ["crmv4-r419-after-mobile", "light", "after", 390, 2200],
];
for (const [name, theme, mode, width, height] of shots) {
  const pageObj = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  await pageObj.setContent(page(theme, mode), { waitUntil: "load" });
  const file = path.join(out, `${name}.png`);
  await pageObj.screenshot({ path: file, fullPage: true });
  await pageObj.close();
  console.log(file);
}
await browser.close();
