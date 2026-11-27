/** Before/after shots for the ivory call scupper, graphite quick deadeye, spirketing courses, and limber plates. */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const out = "/opt/cursor/artifacts";
fs.mkdirSync(out, { recursive: true });
const css = fs.readFileSync(new URL("../src/components/crmv4/crmv4.css", import.meta.url), "utf8");

const before = `
  <form class="c4-form c4-pad" aria-label="Call outcome">
    <h3 class="c4-title">Call outcome</h3>
    <input class="c4-field" aria-label="User" placeholder="User" value="ada" />
    <select class="c4-select" aria-label="Call outcome"><option>Reached</option></select>
    <input class="c4-field" aria-label="Description" value="Asked for the packet" />
    <button type="button" class="c4-btn c4-btn-hot">Add communication</button>
  </form>
  <div class="c4-quick-create">
    <button type="button" class="c4-btn c4-btn-hot">Quick create</button>
    <form class="c4-card c4-pad">
      <label class="c4-lab"><span>Quick create</span>
        <select class="c4-select" aria-label="Quick create"><option>reminder</option></select>
      </label>
      <input class="c4-field" aria-label="User" placeholder="User" />
      <input class="c4-field" aria-label="Description" value="Call back at four" />
      <button type="button" class="c4-btn">Save</button>
    </form>
  </div>`;

const after = `
  <section class="c4-spk417" aria-label="Spirketing courses" data-spk417="1" data-role="desk" data-density="open">
    <header class="c4-spk417-mast">
      <p class="c4-spk417-seal" data-logo="mono">7FX</p>
      <div>
        <p class="c4-spk417-kicker">Shoulder courses on the yard</p>
        <h2 class="c4-title">Spirketing courses</h2>
      </div>
      <p class="c4-spk417-count">2</p>
    </header>
    <p class="c4-spk417-hint">Courses stay in this browser. Graphite is the quiet ground.</p>
    <ol class="c4-spk417-index" aria-label="Reminders">
      <li data-tone="gold">Overdue 1</li>
      <li>Warm 1</li>
      <li>Quiet 1</li>
    </ol>
    <div class="c4-spk417-chart" aria-label="Chart">
      <button type="button" class="c4-spk417-column" data-on="1"><i style="width:80%"></i><strong>1</strong><span>Spirketing</span></button>
      <button type="button" class="c4-spk417-column"><i style="width:40%"></i><strong>0</strong><span>Deadwood</span></button>
      <button type="button" class="c4-spk417-column"><i style="width:40%"></i><strong>0</strong><span>Breastwork</span></button>
      <button type="button" class="c4-spk417-column"><i style="width:70%"></i><strong>1</strong><span>Taffrail</span></button>
    </div>
    <ul class="c4-spk417-list">
      <li class="c4-spk417-card" data-quiet="1" data-overdue="0">
        <div>
          <p>Packet course</p>
          <p class="c4-spk417-meta">Spirketing · Graphite · 16 · 4 · Nia · s</p>
        </div>
        <div class="c4-spk417-actions">
          <button type="button" class="c4-btn">Edit</button>
          <button type="button" class="c4-btn">Pin</button>
        </div>
      </li>
    </ul>
  </section>
  <section class="c4-lmb417" aria-label="Limber affiliate plates" data-lmb417="1" data-role="desk" data-affiliate="1">
    <header class="c4-lmb417-mast">
      <p class="c4-lmb417-seal" data-logo="mono">7FX</p>
      <div>
        <p class="c4-lmb417-kicker">Affiliate code already on the account</p>
        <h2 class="c4-title">Limber affiliate plates</h2>
      </div>
      <p class="c4-lmb417-count">2</p>
    </header>
    <p class="c4-lmb417-hint">Plates read the affiliate code already stored. Money fields are not read.</p>
    <div class="c4-lmb417-chart" aria-label="Chart">
      <button type="button" class="c4-lmb417-column" data-on="1"><i style="width:90%"></i><strong>1</strong><span>Live</span></button>
      <button type="button" class="c4-lmb417-column"><i style="width:50%"></i><strong>1</strong><span>Hold</span></button>
      <button type="button" class="c4-lmb417-column"><i style="width:24%"></i><strong>0</strong><span>Code</span></button>
    </div>
    <ul class="c4-lmb417-list">
      <li class="c4-lmb417-card" data-mail="live" data-hue="gilt">
        <div>
          <p>Ada</p>
          <p class="c4-lmb417-meta">PAID · PAID · 4 · Live · Gilt</p>
        </div>
        <div class="c4-lmb417-actions">
          <button type="button" class="c4-btn">Review</button>
          <button type="button" class="c4-btn">Copy</button>
        </div>
      </li>
    </ul>
  </section>
  <form class="c4-call-scupper" data-call-scupper="1" aria-label="Call outcome">
    <header class="c4-call-scupper-mast">
      <p class="c4-call-scupper-seal" data-logo="mono">7FX</p>
      <div>
        <p class="c4-call-scupper-kicker">Ivory call scupper</p>
        <h3 class="c4-title">Call outcome</h3>
        <p class="c4-call-scupper-lead">The call form sits in an ivory scupper. Graphite holds the fields. Champagne marks the lip.</p>
      </div>
    </header>
    <input class="c4-field" aria-label="User" value="ada" />
    <select class="c4-select" aria-label="Call outcome"><option>Reached</option></select>
    <input class="c4-field" aria-label="Description" value="Asked for the packet" />
    <button type="button" class="c4-btn c4-btn-hot">Add communication</button>
  </form>
  <div class="c4-quick-deadeye" data-quick-deadeye="1">
    <header class="c4-quick-deadeye-mast">
      <p class="c4-quick-deadeye-seal" data-logo="mono">7FX</p>
      <div>
        <p class="c4-quick-deadeye-kicker">Graphite quick deadeye</p>
        <h3 class="c4-title">Quick create</h3>
        <p class="c4-quick-deadeye-lead">Quick create opens on graphite. Ivory type stays readable. Champagne rings the deadeye.</p>
      </div>
    </header>
    <button type="button" class="c4-btn c4-btn-hot">Quick create</button>
    <form class="c4-quick-deadeye-form">
      <label class="c4-lab"><span>Quick create</span>
        <select class="c4-select" aria-label="Quick create"><option>reminder</option></select>
      </label>
      <input class="c4-field" aria-label="User" placeholder="User" />
      <input class="c4-field" aria-label="Description" value="Call back at four" />
      <button type="button" class="c4-btn">Save</button>
    </form>
  </div>`;

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
  ["crmv4-r417-before-light", "light", "before", 1280, 720],
  ["crmv4-r417-after-light", "light", "after", 1280, 1400],
  ["crmv4-r417-before-dark", "dark", "before", 1280, 720],
  ["crmv4-r417-after-dark", "dark", "after", 1280, 1400],
  ["crmv4-r417-after-mobile", "light", "after", 390, 1600],
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
