/** Before/after shots for the ivory sponsor thole, graphite import cleat, carvel courses, and becket plates. */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const out = "/opt/cursor/artifacts";
fs.mkdirSync(out, { recursive: true });
const css = fs.readFileSync(new URL("../src/components/crmv4/crmv4.css", import.meta.url), "utf8");

const before = `
  <form class="c4-form c4-ops-form" aria-label="Create sponsor">
    <h3 class="c4-title">Create sponsor</h3>
    <label class="c4-lab"><span>Name</span><input class="c4-field" value="North quay" /></label>
    <label class="c4-lab"><span>URL</span><input class="c4-field" value="https://north.example" /></label>
    <label class="c4-lab"><span>Logo</span><input type="file" /></label>
    <p class="c4-muted">PNG, JPEG, WEBP, or GIF.</p>
    <button type="button" class="c4-btn c4-btn-hot">Create sponsor</button>
  </form>
  <form class="c4-form c4-ops-form" aria-label="Import preview">
    <h3 class="c4-title">Import preview</h3>
    <p class="c4-muted">Confirm the file. Maximum rows apply.</p>
    <label class="c4-lab"><span>File</span><input type="file" /></label>
    <button type="button" class="c4-btn">Import preview</button>
  </form>`;

const after = `
  <section class="c4-crv418" aria-label="Carvel courses" data-crv418="1" data-role="desk" data-density="open">
    <header class="c4-crv418-mast">
      <p class="c4-crv418-seal" data-logo="mono">7FX</p>
      <div>
        <p class="c4-crv418-kicker">Flush planks on the yard</p>
        <h2 class="c4-title">Carvel courses</h2>
      </div>
      <p class="c4-crv418-count">2</p>
    </header>
    <p class="c4-crv418-hint">Courses stay in this browser. Ivory is the quiet ground.</p>
    <ol class="c4-crv418-index" aria-label="Reminders">
      <li data-tone="gold">Overdue 1</li>
      <li>Warm 1</li>
      <li>Quiet 1</li>
    </ol>
    <div class="c4-crv418-chart" aria-label="Chart">
      <button type="button" class="c4-crv418-column" data-on="1"><i style="width:80%"></i><strong>1</strong><span>Carvel</span></button>
      <button type="button" class="c4-crv418-column"><i style="width:40%"></i><strong>0</strong><span>Clinker</span></button>
      <button type="button" class="c4-crv418-column"><i style="width:40%"></i><strong>0</strong><span>Tumblehome</span></button>
      <button type="button" class="c4-crv418-column"><i style="width:70%"></i><strong>1</strong><span>Stemson</span></button>
    </div>
    <ul class="c4-crv418-list">
      <li class="c4-crv418-card" data-quiet="1" data-overdue="0">
        <div>
          <p>Packet course</p>
          <p class="c4-crv418-meta">Carvel · Ivory · 12 · 3 · Nia · c</p>
        </div>
        <div class="c4-crv418-actions">
          <button type="button" class="c4-btn">Edit</button>
          <button type="button" class="c4-btn">Pin</button>
        </div>
      </li>
    </ul>
  </section>
  <section class="c4-bkt418" aria-label="Becket seen plates" data-bkt418="1" data-role="desk" data-seen="1">
    <header class="c4-bkt418-mast">
      <p class="c4-bkt418-seal" data-logo="mono">7FX</p>
      <div>
        <p class="c4-bkt418-kicker">Last seen time already on the account</p>
        <h2 class="c4-title">Becket seen plates</h2>
      </div>
      <p class="c4-bkt418-count">2</p>
    </header>
    <p class="c4-bkt418-hint">Plates read the last seen time already stored. Money fields are not read.</p>
    <div class="c4-bkt418-chart" aria-label="Chart">
      <button type="button" class="c4-bkt418-column" data-on="1"><i style="width:90%"></i><strong>1</strong><span>Live</span></button>
      <button type="button" class="c4-bkt418-column"><i style="width:50%"></i><strong>1</strong><span>Hold</span></button>
      <button type="button" class="c4-bkt418-column"><i style="width:24%"></i><strong>0</strong><span>Code</span></button>
    </div>
    <ul class="c4-bkt418-list">
      <li class="c4-bkt418-card" data-mail="live" data-hue="gilt">
        <div>
          <p>Ada</p>
          <p class="c4-bkt418-meta">NOW · NOW · 3 · Live · Gilt</p>
        </div>
        <div class="c4-bkt418-actions">
          <button type="button" class="c4-btn">Review</button>
          <button type="button" class="c4-btn">Copy</button>
        </div>
      </li>
    </ul>
  </section>
  <form class="c4-sponsor-thole" data-sponsor-thole="1" aria-label="Create sponsor">
    <header class="c4-sponsor-thole-mast">
      <p class="c4-sponsor-thole-seal" data-logo="mono">7FX</p>
      <div>
        <p class="c4-sponsor-thole-kicker">Ivory sponsor thole</p>
        <h3 class="c4-title">Create sponsor</h3>
        <p class="c4-sponsor-thole-lead">The sponsor form sits in an ivory thole. Graphite holds the fields. Champagne marks the pin.</p>
      </div>
    </header>
    <label class="c4-lab"><span>Name</span><input class="c4-field" value="North quay" /></label>
    <label class="c4-lab"><span>URL</span><input class="c4-field" value="https://north.example" /></label>
    <button type="button" class="c4-btn c4-btn-hot">Create sponsor</button>
  </form>
  <form class="c4-import-cleat" data-import-cleat="1" aria-label="Import preview">
    <header class="c4-import-cleat-mast">
      <p class="c4-import-cleat-seal" data-logo="mono">7FX</p>
      <div>
        <p class="c4-import-cleat-kicker">Graphite import cleat</p>
        <h3 class="c4-title">Import preview</h3>
        <p class="c4-import-cleat-lead">Lead import opens on graphite. Ivory type stays readable. Champagne rings the cleat.</p>
      </div>
    </header>
    <label class="c4-lab"><span>File</span><input class="c4-field" value="leads.csv" /></label>
    <button type="button" class="c4-btn c4-btn-hot">Import preview</button>
  </form>`;

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
  ["crmv4-r418-before-light", "light", "before", 1280, 720],
  ["crmv4-r418-after-light", "light", "after", 1280, 1500],
  ["crmv4-r418-before-dark", "dark", "before", 1280, 720],
  ["crmv4-r418-after-dark", "dark", "after", 1280, 1500],
  ["crmv4-r418-after-mobile", "light", "after", 390, 1700],
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
