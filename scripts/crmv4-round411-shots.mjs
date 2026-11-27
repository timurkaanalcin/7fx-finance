/** Before/after shots for the ivory commission pelta and the graphite import clipeus. */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const out = "/opt/cursor/artifacts";
fs.mkdirSync(out, { recursive: true });
const css = fs.readFileSync(new URL("../src/components/crmv4/crmv4.css", import.meta.url), "utf8");

const before = `
  <section class="c4-card" aria-label="Commission">
    <div class="c4-card-h"><h3 class="c4-title">Commission</h3></div>
    <p class="c4-pad">Rate</p>
    <p class="c4-pad">10</p>
    <p class="c4-pad">1,250.00 USD</p>
  </section>
  <section class="c4-card" aria-label="Import preview">
    <div class="c4-card-h"><h3 class="c4-title">Import preview</h3></div>
    <p class="c4-pad">1. ada@desk.test</p>
    <p class="c4-pad">2. bea@desk.test · duplicate</p>
  </section>`;

const after = `
  <section class="c4-commission-pelta" aria-label="Commission" data-commission-pelta="1">
    <header class="c4-commission-pelta-mast">
      <p class="c4-commission-pelta-seal" data-logo="mono">7FX</p>
      <div>
        <p class="c4-commission-pelta-kicker">Ivory commission pelta</p>
        <h3 class="c4-title">Commission</h3>
        <p class="c4-commission-pelta-lead">The commission rate sits on ivory. Graphite holds the figure. Champagne rules the pelta lip.</p>
      </div>
      <p class="c4-commission-pelta-count">10</p>
    </header>
    <label class="c4-lab c4-commission-pelta-rate"><span>Rate</span><input class="c4-field" value="10" aria-label="Rate" /></label>
    <p class="c4-commission-pelta-figure">1,250.00 USD</p>
  </section>
  <section class="c4-import-clipeus" aria-label="Import preview" data-import-clipeus="1">
    <header class="c4-import-clipeus-mast">
      <p class="c4-import-clipeus-seal" data-logo="mono">7FX</p>
      <div>
        <p class="c4-import-clipeus-kicker">Graphite import clipeus</p>
        <h3 class="c4-title">Import preview</h3>
        <p class="c4-import-clipeus-lead">Import rows sit on graphite. Ivory type stays readable. Champagne rules the clipeus rim.</p>
      </div>
      <p class="c4-import-clipeus-count">2</p>
    </header>
    <textarea class="c4-field" rows="3" aria-label="Import preview">email,name,phone,country</textarea>
    <ul class="c4-import-clipeus-rows">
      <li><span>1. ada@desk.test</span><span></span></li>
      <li><span>2. bea@desk.test</span><span>duplicate</span></li>
    </ul>
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
  ["crmv4-r411-before-light", "light", "before", 1280, 720],
  ["crmv4-r411-after-light", "light", "after", 1280, 980],
  ["crmv4-r411-before-dark", "dark", "before", 1280, 720],
  ["crmv4-r411-after-dark", "dark", "after", 1280, 980],
  ["crmv4-r411-after-mobile", "light", "after", 390, 1100],
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
