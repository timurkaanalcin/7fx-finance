/** Before/after shots for the ivory source impluvium and the graphite status lararium. */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const out = "/opt/cursor/artifacts";
fs.mkdirSync(out, { recursive: true });
const css = fs.readFileSync(new URL("../src/components/crmv4/crmv4.css", import.meta.url), "utf8");

const before = `
  <section class="c4-card" aria-label="Sources">
    <div class="c4-card-h"><h3 class="c4-title">Sources</h3></div>
    <p class="c4-pad">web · 8</p>
    <p class="c4-pad">partner · 3</p>
    <p class="c4-pad">desk · 1</p>
  </section>
  <section class="c4-card" aria-label="Status changed">
    <div class="c4-card-h"><h3 class="c4-title">Status changed</h3></div>
    <p class="c4-pad">Ada · new → call</p>
    <p class="c4-pad">Bea · call → funded</p>
  </section>`;

const after = `
  <section class="c4-source-impluvium" aria-label="Sources" data-source-impluvium="1">
    <header class="c4-source-impluvium-mast">
      <p class="c4-source-impluvium-seal" data-logo="mono">7FX</p>
      <div>
        <p class="c4-source-impluvium-kicker">Ivory source impluvium</p>
        <h3 class="c4-title">Sources</h3>
        <p class="c4-source-impluvium-lead">Source counts sit on ivory. Graphite holds the tally. Champagne rules the impluvium lip.</p>
      </div>
      <p class="c4-source-impluvium-count">3</p>
    </header>
    <ul class="c4-source-impluvium-rows">
      <li><span>web</span><strong>8</strong></li>
      <li><span>partner</span><strong>3</strong></li>
      <li><span>desk</span><strong>1</strong></li>
    </ul>
  </section>
  <section class="c4-status-lararium" aria-label="Status changed" data-status-lararium="1">
    <header class="c4-status-lararium-mast">
      <p class="c4-status-lararium-seal" data-logo="mono">7FX</p>
      <div>
        <p class="c4-status-lararium-kicker">Graphite status lararium</p>
        <h3 class="c4-title">Status changed</h3>
        <p class="c4-status-lararium-lead">Status changes sit on graphite. Ivory type stays readable. Champagne rules the lararium niche.</p>
      </div>
      <p class="c4-status-lararium-count">2</p>
    </header>
    <ul class="c4-status-lararium-rows">
      <li><span>Ada</span><span>new → call</span></li>
      <li><span>Bea</span><span>call → funded</span></li>
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
  ["crmv4-r410-before-light", "light", "before", 1280, 720],
  ["crmv4-r410-after-light", "light", "after", 1280, 860],
  ["crmv4-r410-before-dark", "dark", "before", 1280, 720],
  ["crmv4-r410-after-dark", "dark", "after", 1280, 860],
  ["crmv4-r410-after-mobile", "light", "after", 390, 980],
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
