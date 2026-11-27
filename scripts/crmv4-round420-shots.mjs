/** Before/after shots for the ivory rates marlinspike, the graphite lead turnbuckle, gunwale courses, and fairlead plates. */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const out = "/opt/cursor/artifacts";
fs.mkdirSync(out, { recursive: true });
const css = fs.readFileSync(new URL("../src/components/crmv4/crmv4.css", import.meta.url), "utf8");

const before = `
  <section class="c4-card" aria-label="Rates">
    <h3 class="c4-title">Rates</h3>
    <form class="c4-form c4-form-2 c4-ops-form" aria-label="Rates">
      <label class="c4-lab"><span>Spread</span><input class="c4-field" value="1.2" /></label>
      <label class="c4-lab"><span>Commission</span><input class="c4-field" value="7" /></label>
      <label class="c4-lab"><span>Leverage</span><input class="c4-field" value="100" /></label>
      <label class="c4-lab"><span>Margin call</span><input class="c4-field" value="50" /></label>
      <button type="button" class="c4-btn c4-btn-hot">Save rates</button>
    </form>
  </section>
  <section class="c4-card" aria-label="Lead mapping">
    <h3 class="c4-title">Lead mapping</h3>
    <p class="c4-muted">Valid, invalid, and potential stay in their own lists.</p>
    <h3 class="c4-title">Valid</h3>
    <div class="c4-row">
      <label class="c4-chip" data-on="1"><input type="checkbox" checked /> NEW</label>
      <label class="c4-chip" data-on="0"><input type="checkbox" /> CALL_BACK</label>
    </div>
    <button type="button" class="c4-btn c4-btn-hot">Save map</button>
  </section>`;

const after = `
  <section class="c4-rate-marlinspike" data-rate-marlinspike="1" aria-label="Rates">
    <header class="c4-rate-marlinspike-mast">
      <p class="c4-rate-marlinspike-seal" data-logo="mono">7FX</p>
      <div>
        <p class="c4-rate-marlinspike-kicker">Ivory rates marlinspike</p>
        <h3 class="c4-title">Rates</h3>
        <p class="c4-rate-marlinspike-lead">The rates form sits on an ivory marlinspike. Graphite holds the fields. Champagne marks the pin.</p>
      </div>
    </header>
    <ol class="c4-rate-marlinspike-index" aria-label="Rates">
      <li data-tone="gold">7</li>
      <li data-tone="ink">Spread</li>
      <li data-tone="ivory">Leverage</li>
    </ol>
    <form class="c4-form c4-form-2 c4-ops-form" aria-label="Rates">
      <label class="c4-lab"><span>Spread</span><input class="c4-field" value="1.2" /></label>
      <label class="c4-lab"><span>Commission</span><input class="c4-field" value="7" /></label>
      <label class="c4-lab"><span>Leverage</span><input class="c4-field" value="100" /></label>
      <label class="c4-lab"><span>Margin call</span><input class="c4-field" value="50" /></label>
      <button type="button" class="c4-btn c4-btn-hot">Save rates</button>
    </form>
  </section>
  <section class="c4-lead-turnbuckle" data-lead-turnbuckle="1" aria-label="Lead mapping">
    <header class="c4-lead-turnbuckle-mast">
      <p class="c4-lead-turnbuckle-seal" data-logo="mono">7FX</p>
      <div>
        <p class="c4-lead-turnbuckle-kicker">Graphite lead turnbuckle</p>
        <h3 class="c4-title">Lead mapping</h3>
        <p class="c4-lead-turnbuckle-lead">Lead status mapping opens on graphite. Ivory type stays readable. Champagne rings the turnbuckle.</p>
      </div>
    </header>
    <ol class="c4-lead-turnbuckle-index" aria-label="Lead mapping">
      <li data-tone="gold">1</li>
      <li data-tone="ink">Valid</li>
      <li data-tone="ivory">Invalid</li>
    </ol>
    <p class="c4-muted">Valid, invalid, and potential stay in their own lists.</p>
    <h3 class="c4-title">Valid</h3>
    <div class="c4-row">
      <label class="c4-chip" data-on="1"><input type="checkbox" checked /> NEW</label>
      <label class="c4-chip" data-on="0"><input type="checkbox" /> CALL_BACK</label>
    </div>
    <button type="button" class="c4-btn c4-btn-hot">Save map</button>
  </section>
  <section class="c4-gnw420" aria-label="Gunwale courses" data-gnw420="1" data-role="desk" data-density="open">
    <header class="c4-gnw420-mast">
      <p class="c4-gnw420-seal" data-logo="mono">7FX</p>
      <div>
        <p class="c4-gnw420-kicker">Flush planks on the yard</p>
        <h2 class="c4-title">Gunwale courses</h2>
      </div>
      <p class="c4-gnw420-count">2</p>
    </header>
    <p class="c4-gnw420-hint">Courses stay in this browser. Orders are gunwale, bulwark, stanchion, and capstan. Ivory is the quiet ground.</p>
    <ol class="c4-gnw420-index" aria-label="Reminders">
      <li data-tone="gold">Overdue 1</li>
      <li>Warm 1</li>
      <li>Quiet 1</li>
    </ol>
    <div class="c4-gnw420-chart" aria-label="Chart">
      <button type="button" class="c4-gnw420-column" data-on="1"><i style="width:80%"></i><strong>1</strong><span>Gunwale</span></button>
      <button type="button" class="c4-gnw420-column"><i style="width:40%"></i><strong>0</strong><span>Bulwark</span></button>
      <button type="button" class="c4-gnw420-column"><i style="width:40%"></i><strong>0</strong><span>Stanchion</span></button>
      <button type="button" class="c4-gnw420-column"><i style="width:70%"></i><strong>1</strong><span>Capstan</span></button>
    </div>
  </section>
  <section class="c4-frl420" aria-label="Fairlead mail plates" data-frl420="1" data-role="desk" data-mail="1">
    <header class="c4-frl420-mast">
      <p class="c4-frl420-seal" data-logo="mono">7FX</p>
      <div>
        <p class="c4-frl420-kicker">Desk mailbox already stored</p>
        <h2 class="c4-title">Fairlead mail plates</h2>
      </div>
      <p class="c4-frl420-count">2</p>
    </header>
    <p class="c4-frl420-hint">Plates read the desk default email already stored. Money fields are not read.</p>
    <div class="c4-frl420-chart" aria-label="Chart">
      <button type="button" class="c4-frl420-column" data-on="1"><i style="width:90%"></i><strong>1</strong><span>Live</span></button>
      <button type="button" class="c4-frl420-column"><i style="width:50%"></i><strong>1</strong><span>Hold</span></button>
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
  ["crmv4-r420-before-light", "light", "before", 1280, 900],
  ["crmv4-r420-after-light", "light", "after", 1280, 1800],
  ["crmv4-r420-before-dark", "dark", "before", 1280, 900],
  ["crmv4-r420-after-dark", "dark", "after", 1280, 1800],
  ["crmv4-r420-before-mobile", "light", "before", 390, 1100],
  ["crmv4-r420-after-mobile", "light", "after", 390, 2200],
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
