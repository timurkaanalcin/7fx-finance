/** Before/after shots for the round 276 customer cabinet and pelorus bearings. */
import fs from "node:fs";
import { chromium } from "playwright";

const out = "/opt/cursor/artifacts";
fs.mkdirSync(out, { recursive: true });
const css = fs.readFileSync(new URL("../src/components/crmv4/crmv4.css", import.meta.url), "utf8");

const before = `
  <section class="c4-dossier" data-dossier="1">
    <h2 class="c4-title">Dossier</h2>
    <p class="c4-muted">One page for stage, files, money, and the latest note.</p>
    <div class="c4-dos-grid">
      <article>
        <h3 class="c4-title">Summary</h3>
        <p>Amina Hale</p>
        <p class="c4-muted">TR · North desk</p>
        <p>Stage · NEW</p>
        <p>Retention · WARM</p>
      </article>
      <article>
        <h3 class="c4-title">Files</h3>
        <p>PENDING</p>
        <a class="c4-btn" href="#files">Open files</a>
      </article>
      <article>
        <h3 class="c4-title">Money</h3>
        <p>Balance · 1,240.00 USD</p>
        <p>Equity · 1,240.00 USD</p>
        <a class="c4-btn" href="#money">Open money</a>
      </article>
      <article>
        <h3 class="c4-title">Activity</h3>
        <p>Note</p>
        <p>Called about the file</p>
      </article>
      <article>
        <h3 class="c4-title">Follow-up</h3>
        <p>31 Oct 2026</p>
        <p>Overdue</p>
      </article>
    </div>
  </section>`;

const after = `
  <section class="c4-dossier c4-dossier-cabinet" data-dossier="1" data-cabinet="1">
    <header class="c4-dossier-mast">
      <p class="c4-dossier-seal" data-logo="mono">7FX</p>
      <div>
        <p class="c4-dossier-kicker">Customer cabinet</p>
        <h2 class="c4-title c4-dossier-title">Dossier</h2>
      </div>
      <ol class="c4-dossier-index" aria-label="Dossier">
        <li data-tone="gold">Summary</li>
        <li data-tone="ink">Files</li>
        <li data-tone="ivory">Book</li>
        <li data-tone="mist">Pulse</li>
        <li data-tone="late">Follow</li>
      </ol>
    </header>
    <p class="c4-dossier-lead">The profile sits in an ivory cabinet. Champagne rules mark the live plates. A monochrome seal stays on the mast.</p>
    <p class="c4-dossier-links"><a href="#plr">Pelorus bearings</a><a href="#snd">Sounding plates</a></p>
    <div class="c4-dos-grid c4-dossier-plates">
      <article data-plate="summary">
        <h3 class="c4-title">Summary</h3>
        <p>Amina Hale</p>
        <p class="c4-muted">TR · North desk</p>
        <p>Stage · NEW</p>
        <p>Retention · WARM</p>
      </article>
      <article data-plate="files">
        <h3 class="c4-title">Files</h3>
        <p>PENDING</p>
        <a class="c4-btn" href="#files">Open files</a>
      </article>
      <article data-plate="book">
        <h3 class="c4-title">Money</h3>
        <p>Balance · 1,240.00 USD</p>
        <p>Equity · 1,240.00 USD</p>
        <a class="c4-btn" href="#money">Open money</a>
      </article>
      <article data-plate="pulse">
        <h3 class="c4-title">Activity</h3>
        <p>Note</p>
        <p>Called about the file</p>
      </article>
      <article data-plate="follow" data-tone="late">
        <h3 class="c4-title">Follow-up</h3>
        <p>31 Oct 2026</p>
        <p>Overdue</p>
      </article>
    </div>
  </section>
  <section class="c4-pelorus" data-cards="1" data-desk="pelorus" data-role="desk">
    <header class="c4-pelorus-mast">
      <p class="c4-pelorus-rose" data-logo="mono"><span>7FX</span><i></i><b></b></p>
      <div>
        <p class="c4-pelorus-kicker">A coastal sight book kept in this browser</p>
        <h2 class="c4-title">Pelorus bearings</h2>
      </div>
      <ol class="c4-pelorus-vanes"><li>Plain</li><li>Shaded</li><li>Mirrored</li></ol>
    </header>
    <p class="c4-pelorus-notice" role="status">Overdue on the open bridge 1</p>
    <ol class="c4-pelorus-dials">
      <li><span>Bridge</span><strong>3</strong></li>
      <li><span>Cabin</span><strong>0</strong></li>
      <li><span>Hold</span><strong>1</strong></li>
      <li><span>Overdue</span><strong>1</strong></li>
    </ol>
    <div class="c4-pelorus-chart">
      <div class="c4-pelorus-column" data-station="bow"><i style="height:48%"></i><strong>1</strong><span>Bow</span></div>
      <div class="c4-pelorus-column" data-station="beam"><i style="height:18%"></i><strong>0</strong><span>Beam</span></div>
      <div class="c4-pelorus-column" data-station="quarter"><i style="height:96%"></i><strong>2</strong><span>Quarter</span></div>
      <div class="c4-pelorus-column" data-station="stern"><i style="height:28%"></i><strong>0</strong><span>Stern</span></div>
    </div>
    <ol class="c4-pelorus-board">
      <li class="c4-pelorus-card" data-on="1" data-overdue="1" data-keen="1">
        <div class="c4-pelorus-face"><i style="transform:rotate(-90deg)"></i><span>0</span></div>
        <div><strong>Quarter left</strong><p class="c4-pelorus-meta">Nia · Quarter · Ivory · Plain · 0 · Ring 1</p></div>
      </li>
      <li class="c4-pelorus-card" data-sighted="1" data-house="1">
        <div class="c4-pelorus-face"><i style="transform:rotate(72deg)"></i><span>45</span></div>
        <div><strong>Bow sight</strong><p class="c4-pelorus-meta">Sol · Bow · Champagne · Shaded · 45 · Ring 3</p></div>
      </li>
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
  ["crm-round276-cabinet-before-light.png", "light", before, false],
  ["crm-round276-cabinet-after-light.png", "light", after, false],
  ["crm-round276-cabinet-after-dark.png", "dark", after, false],
  ["crm-round276-cabinet-after-mobile.png", "light", after, true],
];

const browser = await chromium.launch({ headless: true });
for (const [name, theme, body, mobile] of shots) {
  const pageObj = await browser.newPage({ viewport: mobile ? { width: 390, height: 1800 } : { width: 1280, height: 2200 } });
  await pageObj.setContent(page(theme, body, mobile), { waitUntil: "load" });
  await pageObj.screenshot({ path: `${out}/${name}`, fullPage: true });
  await pageObj.close();
}
await browser.close();
console.log("shots written", shots.map((row) => row[0]).join(", "));
