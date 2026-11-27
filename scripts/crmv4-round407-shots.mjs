/** Before/after shots for the ivory rate rail and the graphite statement folio. */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const out = "/opt/cursor/artifacts";
fs.mkdirSync(out, { recursive: true });
const css = fs.readFileSync(new URL("../src/components/crmv4/crmv4.css", import.meta.url), "utf8");

const before = `
  <section class="c4-fx-desk" aria-label="Rate desk">
    <div class="c4-fin-hero">
      <div class="c4-fin-metric"><span>Rate desk</span><strong>3</strong></div>
      <div class="c4-fin-metric"><span>Age</span><strong>09:40</strong></div>
    </div>
    <p class="c4-muted c4-pad">Live mids, with a manual fallback.</p>
    <ul class="c4-fx-quotes">
      <li><span>USDTRY</span><strong>40</strong></li>
      <li><span>EURUSD</span><strong>1.1</strong></li>
      <li><span>GBPUSD</span><strong>—</strong></li>
    </ul>
    <div class="c4-row c4-pad">
      <label class="c4-lab"><span>Amount</span><input class="c4-field" value="100" /></label>
      <p>Result 4000</p>
    </div>
  </section>
  <section class="c4-statement-sheet" aria-label="Statement">
    <div class="c4-fin-hero">
      <div class="c4-fin-metric"><span>Statement</span><strong>Ada</strong></div>
      <div class="c4-fin-metric"><span>Deposits</span><strong>2</strong></div>
      <div class="c4-fin-metric"><span>Withdrawals</span><strong>1</strong></div>
    </div>
    <p class="c4-muted c4-pad">Printable account statement.</p>
    <div class="c4-statement-body">
      <p>ada@desk.test · TR · Istanbul</p>
      <p>USD 1200 · USD 1180</p>
      <p>Pending 1 · Approved 2</p>
    </div>
  </section>`;

const after = `
  <section class="c4-fx-desk c4-fx-arch" data-fx-arch="1" aria-label="Rate desk">
    <header class="c4-fx-arch-mast">
      <p class="c4-fx-arch-seal" data-logo="mono">7FX</p>
      <div>
        <p class="c4-fx-arch-kicker">Ivory rate rail</p>
        <h2 class="c4-title">Rate desk</h2>
        <p class="c4-fx-arch-lead">The rate desk sits on ivory. Graphite holds the figures. Champagne rules the quote rail.</p>
      </div>
    </header>
    <div class="c4-fin-hero">
      <div class="c4-fin-metric"><span>Rate desk</span><strong>3</strong></div>
      <div class="c4-fin-metric"><span>Age</span><strong>09:40</strong></div>
    </div>
    <p class="c4-fx-arch-lead">Live mids, with a manual fallback.</p>
    <ul class="c4-fx-quotes">
      <li><span>USDTRY</span><strong>40</strong></li>
      <li><span>EURUSD</span><strong>1.1</strong></li>
      <li><span>GBPUSD</span><strong>—</strong></li>
    </ul>
    <div class="c4-row c4-pad">
      <label class="c4-lab"><span>Amount</span><input class="c4-field" value="100" /></label>
      <button type="button" class="c4-btn">Convert</button>
      <p>Result 4000</p>
    </div>
  </section>
  <section class="c4-statement-sheet c4-statement-arch" data-statement-arch="1" aria-label="Statement">
    <header class="c4-statement-arch-mast">
      <p class="c4-statement-arch-seal" data-logo="mono">7FX</p>
      <div>
        <p class="c4-statement-arch-kicker">Graphite statement folio</p>
        <h2 class="c4-title">Statement</h2>
        <p class="c4-statement-arch-lead">The statement sits on graphite. Ivory type stays readable. Champagne rules the folio edge.</p>
      </div>
    </header>
    <div class="c4-fin-hero">
      <div class="c4-fin-metric"><span>Statement</span><strong>Ada</strong></div>
      <div class="c4-fin-metric"><span>Deposits</span><strong>2</strong></div>
      <div class="c4-fin-metric"><span>Withdrawals</span><strong>1</strong></div>
    </div>
    <div class="c4-statement-body">
      <p>ada@desk.test · TR · Istanbul</p>
      <p>USD 1200 · USD 1180</p>
      <p>Pending 1 · Approved 2</p>
    </div>
    <button type="button" class="c4-btn">Print</button>
  </section>`;

function page(theme, mode) {
  const body = mode === "after" ? after : before;
  const ground = theme === "dark" ? "#12100e" : "#f4f0e8";
  return `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body style="margin:0;background:${ground};">
    <div data-crmv4-root data-theme="${theme}" style="height:auto;display:block;background:${ground};padding:12px 0 28px;">
      ${body}
    </div>
  </body></html>`;
}

const browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/google-chrome", args: ["--no-sandbox"] });
const shots = [
  ["crmv4-r407-before-light", "light", "before", 1280, 980],
  ["crmv4-r407-after-light", "light", "after", 1280, 1280],
  ["crmv4-r407-before-dark", "dark", "before", 1280, 980],
  ["crmv4-r407-after-dark", "dark", "after", 1280, 1280],
  ["crmv4-r407-after-mobile", "light", "after", 390, 1400],
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
