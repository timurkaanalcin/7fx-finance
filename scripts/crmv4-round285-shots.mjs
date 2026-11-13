/** Before/after shots for the round 285 task atelier. */
import fs from "node:fs";
import { chromium } from "playwright";

const out = "/opt/cursor/artifacts";
fs.mkdirSync(out, { recursive: true });
const css = fs.readFileSync(new URL("../src/components/crmv4/crmv4.css", import.meta.url), "utf8");

const before = `
  <section class="c4-task-desk" id="c4-tasks" aria-label="Due today">
    <div class="c4-task-hero">
      <div>
        <p class="c4-exec-kicker">7FX</p>
        <h3 class="c4-title">Due today</h3>
      </div>
      <strong>3</strong>
      <button type="button" class="c4-chip" data-on="1">Due today</button>
    </div>
    <p class="c4-muted c4-pad">Keys · d · Due today</p>
    <form class="c4-row c4-pad">
      <input class="c4-field" aria-label="Template" placeholder="Call about the file" />
      <button type="button" class="c4-btn">Template</button>
    </form>
    <form class="c4-row c4-pad">
      <select class="c4-select" aria-label="Repeat"><option>day</option><option>week</option></select>
      <button type="button" class="c4-btn">Repeat</button>
    </form>
    <ul class="c4-task-list">
      <li class="c4-task-row" tabindex="0">
        <div class="c4-row c4-between"><span>Call Amina about the file</span><span class="c4-muted">13 Nov 2026, 16:00</span></div>
        <div class="c4-row"><button type="button" class="c4-btn">Snooze 15m</button><button type="button" class="c4-btn">Tomorrow</button></div>
      </li>
      <li class="c4-task-row" tabindex="0">
        <div class="c4-row c4-between"><span>Send the quiet-week note</span><span class="c4-muted">13 Nov 2026, 18:30</span></div>
        <div class="c4-row"><button type="button" class="c4-btn">Snooze 15m</button><button type="button" class="c4-btn">Tomorrow</button></div>
      </li>
      <li class="c4-task-row" tabindex="0">
        <div class="c4-row c4-between"><span>Prep the north desk handoff</span><span class="c4-muted">14 Nov 2026, 09:00</span></div>
        <div class="c4-row"><button type="button" class="c4-btn">Snooze 15m</button><button type="button" class="c4-btn">Tomorrow</button></div>
      </li>
    </ul>
  </section>`;

const after = `
  <section class="c4-task-desk c4-task-atelier" id="c4-tasks" aria-label="Due today" data-atelier="1">
    <header class="c4-task-atelier-mast">
      <p class="c4-task-atelier-seal" data-logo="mono">7FX</p>
      <div>
        <p class="c4-task-atelier-kicker">Task atelier</p>
        <h3 class="c4-title">Due today</h3>
      </div>
      <strong class="c4-task-atelier-count" aria-live="polite">3</strong>
    </header>
    <p class="c4-task-atelier-lead">Due work sits on ivory plates. Graphite holds the count. Champagne marks what is still open.</p>
    <ol class="c4-task-atelier-index" aria-label="Due today">
      <li data-tone="gold">Due today</li>
      <li data-tone="ink">Snooze 15m</li>
      <li data-tone="ivory">Repeat</li>
    </ol>
    <div class="c4-task-hero">
      <button type="button" class="c4-chip" data-on="1">Due today</button>
    </div>
    <p class="c4-muted c4-pad">Keys · d · Due today</p>
    <form class="c4-row c4-pad c4-task-atelier-form">
      <input class="c4-field" aria-label="Template" placeholder="Call about the file" />
      <button type="button" class="c4-btn">Template</button>
    </form>
    <form class="c4-row c4-pad c4-task-atelier-form">
      <select class="c4-select" aria-label="Repeat"><option>day</option><option>week</option></select>
      <button type="button" class="c4-btn">Repeat</button>
    </form>
    <ul class="c4-task-list">
      <li class="c4-task-row c4-task-atelier-row" tabindex="0">
        <div class="c4-row c4-between"><span>Call Amina about the file</span><span class="c4-muted">13 Nov 2026, 16:00</span></div>
        <div class="c4-row"><button type="button" class="c4-btn">Snooze 15m</button><button type="button" class="c4-btn">Tomorrow</button></div>
      </li>
      <li class="c4-task-row c4-task-atelier-row" tabindex="0">
        <div class="c4-row c4-between"><span>Send the quiet-week note</span><span class="c4-muted">13 Nov 2026, 18:30</span></div>
        <div class="c4-row"><button type="button" class="c4-btn">Snooze 15m</button><button type="button" class="c4-btn">Tomorrow</button></div>
      </li>
      <li class="c4-task-row c4-task-atelier-row" tabindex="0">
        <div class="c4-row c4-between"><span>Prep the north desk handoff</span><span class="c4-muted">14 Nov 2026, 09:00</span></div>
        <div class="c4-row"><button type="button" class="c4-btn">Snooze 15m</button><button type="button" class="c4-btn">Tomorrow</button></div>
      </li>
    </ul>
  </section>
  <section class="c4-traverse" data-cards="1" data-desk="deck" data-role="desk" data-density="air">
    <header class="c4-traverse-mast">
      <p class="c4-traverse-seal" data-logo="mono">7FX</p>
      <div>
        <p class="c4-traverse-kicker">A course book kept in this browser</p>
        <h2 class="c4-title">Traverse pegs</h2>
      </div>
      <ol class="c4-traverse-index"><li data-tone="gold">Brass</li><li data-tone="ink">Silk</li><li data-tone="ivory">Hemp</li></ol>
    </header>
    <p class="c4-traverse-notice" role="status">Overdue pegs 1</p>
    <ol class="c4-traverse-dials">
      <li><span>Deck</span><strong>2</strong></li>
      <li><span>Locker</span><strong>0</strong></li>
      <li><span>Hold</span><strong>1</strong></li>
      <li><span>Overdue</span><strong>1</strong></li>
    </ol>
    <div class="c4-traverse-chart">
      <div class="c4-traverse-column" data-course="north"><i style="height:72%"></i><strong>1</strong><span>North</span></div>
      <div class="c4-traverse-column" data-course="east"><i style="height:18%"></i><strong>0</strong><span>East</span></div>
      <div class="c4-traverse-column" data-on="1" data-course="south"><i style="height:96%"></i><strong>2</strong><span>South</span></div>
      <div class="c4-traverse-column" data-course="west"><i style="height:36%"></i><strong>0</strong><span>West</span></div>
    </div>
    <ol class="c4-traverse-board">
      <li class="c4-traverse-card" data-on="1" data-overdue="1" data-lee="1">
        <ol class="c4-traverse-ticks" aria-hidden="true"><li data-on="1"></li><li></li><li></li></ol>
        <div><strong>Lee watch</strong><p class="c4-traverse-meta">Nia · South · Ivory · Hemp · 2 · Peg 1</p></div>
      </li>
      <li class="c4-traverse-card" data-house="1" data-weather="1">
        <ol class="c4-traverse-ticks" aria-hidden="true"><li></li><li></li><li data-on="1"></li></ol>
        <div><strong>North brass</strong><p class="c4-traverse-meta">Sol · North · Champagne · Brass · 8 · Peg 4</p></div>
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
  ["crm-round285-task-before-light.png", "light", before, false],
  ["crm-round285-task-after-light.png", "light", after, false],
  ["crm-round285-task-after-dark.png", "dark", after, false],
  ["crm-round285-task-after-mobile.png", "light", after, true],
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
