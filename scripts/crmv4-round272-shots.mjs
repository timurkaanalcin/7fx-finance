/** Before/after shots for the round 272 calendar almanac and license charter. */
import fs from "node:fs";
import { chromium } from "playwright";

const out = "/opt/cursor/artifacts";
fs.mkdirSync(out, { recursive: true });
const css = fs.readFileSync(new URL("../src/components/crmv4/crmv4.css", import.meta.url), "utf8");

const before = `
  <div class="c4-stack c4-ops-workshop c4-ops-sextant" data-ops="sextant">
    <header class="c4-ops-mast c4-ops-sextant-mast">
      <p class="c4-ops-sextant-seal" data-logo="mono">7FX</p>
      <div class="c4-ops-sextant-copy">
        <p class="c4-ops-sextant-kicker">Sextant</p>
        <h2 class="c4-ops-title">Calendar</h2>
        <p class="c4-ops-sextant-lead">Rooms of the house, read through a sextant.</p>
      </div>
    </header>
    <div class="c4-card">
      <h3 class="c4-card-title">Calendar</h3>
      <ul>
        <li class="c4-ops-row" data-live="on"><span>Call Mira about the file · Desk North · 13 Nov 09:00</span><button type="button" class="c4-btn">Delete</button></li>
        <li class="c4-ops-row" data-live="on"><span>Send the welcome note · Ada · 13 Nov 11:30</span><button type="button" class="c4-btn">Delete</button></li>
        <li class="c4-ops-row" data-live="on"><span>Review the missing page · Bea · 14 Nov 16:00</span><button type="button" class="c4-btn">Delete</button></li>
      </ul>
      <form class="c4-form c4-ops-form">
        <label class="c4-lab"><span>Reminder</span><input class="c4-field" value="Call Mira" /></label>
        <label class="c4-lab"><span>Remind at</span><input class="c4-field" value="2026-11-13T09:00" /></label>
        <button type="button" class="c4-btn c4-btn-hot">Save</button>
      </form>
    </div>
    <div class="c4-card">
      <h3 class="c4-card-title">Licenses</h3>
      <ul>
        <li class="c4-ops-row" data-live="on"><span>FCA · 123456 · 7FX Ltd</span><button type="button" class="c4-btn">Delete</button></li>
        <li class="c4-ops-row" data-live="on"><span>CySEC · 789012 · 7FX EU</span><button type="button" class="c4-btn">Delete</button></li>
      </ul>
    </div>
  </div>`;

const after = `
  <section class="c4-cal-almanac" aria-label="Calendar">
    <header class="c4-cal-almanac-mast">
      <p class="c4-cal-almanac-seal" data-logo="mono">7FX</p>
      <div>
        <p class="c4-cal-almanac-kicker">Almanac</p>
        <h3 class="c4-cal-almanac-title">Calendar</h3>
        <p class="c4-cal-almanac-lead">Reminders sit on an ivory spine with a champagne rule. The sextant shell stays above.</p>
      </div>
      <ol class="c4-cal-almanac-index" aria-label="Calendar">
        <li data-tone="gold">3</li>
        <li data-tone="ink">Reminder</li>
        <li data-tone="ivory">Remind at</li>
      </ol>
    </header>
    <ol class="c4-cal-almanac-list">
      <li class="c4-cal-almanac-card" data-live="on"><p class="c4-cal-almanac-when">13 Nov 09:00</p><div><p class="c4-cal-almanac-body">Call Mira about the file</p><p class="c4-cal-almanac-who">Desk North</p></div><button type="button" class="c4-btn">Delete</button></li>
      <li class="c4-cal-almanac-card" data-live="on"><p class="c4-cal-almanac-when">13 Nov 11:30</p><div><p class="c4-cal-almanac-body">Send the welcome note</p><p class="c4-cal-almanac-who">Ada</p></div><button type="button" class="c4-btn">Delete</button></li>
      <li class="c4-cal-almanac-card" data-live="on"><p class="c4-cal-almanac-when">14 Nov 16:00</p><div><p class="c4-cal-almanac-body">Review the missing page</p><p class="c4-cal-almanac-who">Bea</p></div><button type="button" class="c4-btn">Delete</button></li>
    </ol>
    <form class="c4-form c4-cal-almanac-form">
      <label class="c4-lab"><span>Reminder</span><input class="c4-field" value="Call Mira" /></label>
      <label class="c4-lab"><span>Remind at</span><input class="c4-field" value="2026-11-13T09:00" /></label>
      <label class="c4-lab"><span>User id (optional)</span><input class="c4-field" aria-required="false" /></label>
      <button type="button" class="c4-btn c4-btn-hot">Save</button>
    </form>
  </section>
  <section class="c4-lic-charter" aria-label="Licenses">
    <header class="c4-lic-charter-mast">
      <p class="c4-lic-charter-seal" data-logo="mono">7FX</p>
      <div>
        <p class="c4-lic-charter-kicker">Charter</p>
        <h3 class="c4-lic-charter-title">Licenses</h3>
        <p class="c4-lic-charter-lead">Licenses read as graphite cards with a champagne rule.</p>
      </div>
      <ol class="c4-lic-charter-index">
        <li data-tone="gold">2</li>
        <li data-tone="ink">Regulator</li>
        <li data-tone="ivory">Entity</li>
      </ol>
    </header>
    <ol class="c4-lic-charter-board">
      <li class="c4-lic-charter-card" data-live="on"><p class="c4-lic-charter-mark">FC</p><div><p class="c4-lic-charter-name">FCA</p><p class="c4-lic-charter-meta">123456 · 7FX Ltd</p></div><button type="button" class="c4-btn">Delete</button></li>
      <li class="c4-lic-charter-card" data-live="on"><p class="c4-lic-charter-mark">CY</p><div><p class="c4-lic-charter-name">CySEC</p><p class="c4-lic-charter-meta">789012 · 7FX EU</p></div><button type="button" class="c4-btn">Delete</button></li>
    </ol>
  </section>
  <section class="c4-pendulum" data-cards="1" data-desk="pendulum" data-role="desk">
    <header class="c4-pendulum-mast">
      <p class="c4-pendulum-seal" data-logo="mono"><span>7FX</span><i></i></p>
      <div><p class="c4-pendulum-kicker">A tempo book kept in this browser</p><h2 class="c4-title">Pendulum bobs</h2></div>
      <ol class="c4-pendulum-hands"><li>Left</li><li>Both</li><li>Right</li></ol>
    </header>
    <p class="c4-pendulum-notice" role="status">Overdue on the open staff 1</p>
    <ol class="c4-pendulum-ledger">
      <li><span>Swing</span><strong>3</strong></li>
      <li><span>Rest</span><strong>0</strong></li>
      <li><span>Cased</span><strong>1</strong></li>
      <li><span>Overdue</span><strong>1</strong></li>
    </ol>
    <ol class="c4-pendulum-staff">
      <li data-tempo="largo"><strong>1</strong><i style="height:48px"></i><span>Largo</span></li>
      <li data-tempo="andante"><strong>0</strong><i style="height:6px"></i><span>Andante</span></li>
      <li data-tempo="allegro"><strong>2</strong><i style="height:96px"></i><span>Allegro</span></li>
      <li data-tempo="presto"><strong>0</strong><i style="height:6px"></i><span>Presto</span></li>
    </ol>
    <ol class="c4-pendulum-board">
      <li class="c4-pendulum-bob" data-on="1" data-overdue="1"><div class="c4-pendulum-ring" style="background:conic-gradient(#c6a15b 42%, #efe6d6 42% 100%)"><span>A</span></div><div></div><div><strong>Allegro bob</strong><p class="c4-pendulum-meta">Nia · Allegro · Ivory · Left · 40 · Weight 1</p></div></li>
      <li class="c4-pendulum-bob" data-idle="1"><div class="c4-pendulum-ring" style="background:conic-gradient(#c6a15b 0%, #efe6d6 0% 100%)"><span>L</span></div><div></div><div><strong>Largo left</strong><p class="c4-pendulum-meta">Sol · Largo · Graphite · Left · Weight 1</p></div></li>
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
  ["crm-round272-almanac-before-light.png", "light", before, false],
  ["crm-round272-almanac-after-light.png", "light", after, false],
  ["crm-round272-almanac-after-dark.png", "dark", after, false],
  ["crm-round272-almanac-after-mobile.png", "light", after, true],
];

const browser = await chromium.launch({ headless: true });
for (const [name, theme, body, mobile] of shots) {
  const pageObj = await browser.newPage({ viewport: mobile ? { width: 390, height: 1800 } : { width: 1280, height: 2000 } });
  await pageObj.setContent(page(theme, body, mobile), { waitUntil: "load" });
  await pageObj.screenshot({ path: `${out}/${name}`, fullPage: true });
  await pageObj.close();
}
await browser.close();
console.log("shots written", shots.map((row) => row[0]).join(", "));
