/**
 * Download official-ish logos for the built-in symbol catalog into public/logos/.
 * Sources: spothq crypto icons, FMP/IEX stock images, flagcdn FX flags,
 *          simple self-drawn SVGs for commodities/indices when needed.
 */
import fs from "fs";
import path from "path";
import https from "https";
import http from "http";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "public", "logos");

function loadSymbols() {
  const t = fs.readFileSync(path.join(ROOT, "src/lib/symbols.ts"), "utf8");
  const re =
    /\{\s*symbol:\s*"([^"]+)"[\s\S]*?class:\s*"(STOCK|FX|CRYPTO|INDEX|COMMODITY)"[\s\S]*?yahoo:\s*"([^"]+)"/g;
  const list = [];
  let m;
  while ((m = re.exec(t))) {
    list.push({ symbol: m[1], class: m[2], yahoo: m[3] });
  }
  return list;
}

function get(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith("https") ? https : http;
    const req = lib.get(
      url,
      {
        headers: {
          "User-Agent": "7FX-logo-fetcher/1.0",
          Accept: "image/*,*/*",
        },
        timeout: 20000,
      },
      (res) => {
        if (
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location &&
          redirects < 5
        ) {
          const next = new URL(res.headers.location, url).href;
          res.resume();
          return resolve(get(next, redirects + 1));
        }
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const buf = Buffer.concat(chunks);
          resolve({ status: res.statusCode || 0, buf, ctype: res.headers["content-type"] || "" });
        });
      }
    );
    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("timeout"));
    });
  });
}

function isImage(buf, ctype) {
  if (!buf || buf.length < 32) return false;
  if (ctype.includes("text/html") || ctype.includes("application/json")) return false;
  // PNG / JPEG / GIF / WebP / SVG
  if (buf[0] === 0x89 && buf[1] === 0x50) return true;
  if (buf[0] === 0xff && buf[1] === 0xd8) return true;
  if (buf[0] === 0x47 && buf[1] === 0x49) return true;
  if (buf[0] === 0x52 && buf[1] === 0x49) return true; // RIFF/webp
  const head = buf.slice(0, 200).toString("utf8").trimStart();
  if (head.startsWith("<svg") || head.startsWith("<?xml")) return true;
  return false;
}

function extFor(buf, ctype) {
  if (buf[0] === 0x89) return "png";
  if (buf[0] === 0xff) return "jpg";
  if (buf[0] === 0x47) return "gif";
  if (ctype.includes("svg") || buf.slice(0, 100).toString().includes("<svg")) return "svg";
  if (buf[0] === 0x52) return "webp";
  return "png";
}

const CRYPTO_ALIAS = {
  pol: "matic",
  inch: "1inch",
  render: "rndr",
  matic: "matic",
  doge: "doge",
  shib: "shib",
  pepe: "pepe",
  bonk: "bonk",
  floki: "floki",
  wif: "wif",
  ton: "ton",
  sui: "sui",
  arb: "arb",
  op: "op",
  apt: "apt",
  sei: "sei",
  tia: "tia",
  inj: "inj",
  tao: "tao",
  fet: "fet",
  near: "near",
  atom: "atom",
  link: "link",
  uni: "uni",
  aave: "aave",
  mkr: "mkr",
  ldo: "ldo",
  crv: "crv",
  snx: "snx",
  sand: "sand",
  mana: "mana",
  axs: "axs",
  imx: "imx",
  stx: "stx",
  rune: "rune",
  egld: "egld",
  fil: "fil",
  icp: "icp",
  etc: "etc",
  bch: "bch",
  xlm: "xlm",
  algo: "algo",
  vet: "vet",
  theta: "theta",
  eos: "eos",
  xmr: "xmr",
  zec: "zec",
  dash: "dash",
  kas: "kas",
  pyth: "pyth",
  ena: "ena",
  ondo: "ondo",
  strk: "strk",
  blur: "blur",
  gala: "gala",
  flow: "flow",
  chz: "chz",
  xtz: "xtz",
  iota: "iota",
  ens: "ens",
  qnt: "qnt",
  kava: "kava",
  zil: "zil",
  sushi: "sushi",
  dydx: "dydx",
  ape: "ape",
  cfx: "cfx",
  rose: "rose",
  mina: "mina",
  ksm: "ksm",
  neo: "neo",
  cake: "cake",
  ar: "ar",
  ordi: "ordi",
  jto: "jto",
  ray: "ray",
  pendle: "pendle",
  ethfi: "ethfi",
  eigen: "eigen",
  jasmy: "jasmy",
  yfi: "yfi",
  bat: "bat",
  zrx: "zrx",
  ankr: "ankr",
  flr: "flr",
  xdc: "xdc",
  bsv: "bsv",
  leo: "leo",
  nexo: "nexo",
  gt: "gt",
  not: "not",
  lpt: "lpt",
  ssv: "ssv",
  rpl: "rpl",
  cvx: "cvx",
  super: "super",
  zeta: "zeta",
  alt: "alt",
  manta: "manta",
  hnt: "hnt",
  one: "one",
  hot: "hot",
  gmt: "gmt",
  mnt: "mnt",
  okb: "okb",
  cro: "cro",
  twt: "twt",
  w: "w",
  virtual: "virtual",
  hbar: "hbar",
  grt: "grt",
};

function cryptoSlug(symbol) {
  const base = symbol.replace(/USD$/i, "").replace(/USDT$/i, "").toLowerCase();
  return CRYPTO_ALIAS[base] || base;
}

const FX_CCY_TO_FLAG = {
  EUR: "eu",
  GBP: "gb",
  USD: "us",
  JPY: "jp",
  AUD: "au",
  NZD: "nz",
  CAD: "ca",
  CHF: "ch",
  TRY: "tr",
  SEK: "se",
  NOK: "no",
  DKK: "dk",
  PLN: "pl",
  HUF: "hu",
  CZK: "cz",
  ZAR: "za",
  MXN: "mx",
  SGD: "sg",
  HKD: "hk",
  CNH: "cn",
  CNY: "cn",
};

function fxFlagCode(symbol) {
  // Prefer quote currency for majors like EURUSD → show EUR (base)
  const base = symbol.slice(0, 3).toUpperCase();
  return FX_CCY_TO_FLAG[base] || "un";
}

const STOCK_DOMAIN = {
  AAPL: "apple.com",
  MSFT: "microsoft.com",
  GOOGL: "abc.xyz",
  AMZN: "amazon.com",
  NVDA: "nvidia.com",
  META: "meta.com",
  TSLA: "tesla.com",
  JPM: "jpmorganchase.com",
  V: "visa.com",
  JNJ: "jnj.com",
  WMT: "walmart.com",
  NFLX: "netflix.com",
  AMD: "amd.com",
  INTC: "intel.com",
  BAC: "bankofamerica.com",
  XOM: "exxonmobil.com",
  CVX: "chevron.com",
  COP: "conocophillips.com",
  EOG: "eogresources.com",
  OXY: "oxy.com",
  SLB: "slb.com",
  MPC: "marathonpetroleum.com",
  PSX: "phillips66.com",
  VLO: "valero.com",
  BP: "bp.com",
  SHEL: "shell.com",
  TTE: "totalenergies.com",
  EQNR: "equinor.com",
  KO: "coca-cola.com",
  DIS: "thewaltdisneycompany.com",
  THYAO: "turkishairlines.com",
  GARAN: "garantibbva.com.tr",
  AKBNK: "akbank.com",
  EREGL: "erdemir.com.tr",
  BIMAS: "bim.com.tr",
  ASELS: "aselsan.com.tr",
  SISE: "sisecam.com.tr",
};

function commoditySvg(kind) {
  const colors = {
    gold: "#D4AF37",
    silver: "#C0C0C0",
    oil: "#1a1a1a",
    gas: "#3B82F6",
    metal: "#B87333",
    agri: "#65A30D",
    soft: "#92400E",
  };
  const c = colors[kind] || "#64748b";
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
  <circle cx="64" cy="64" r="60" fill="${c}"/>
  <circle cx="64" cy="64" r="40" fill="none" stroke="#fff" stroke-width="6" opacity="0.85"/>
  <circle cx="64" cy="64" r="18" fill="#fff" opacity="0.9"/>
</svg>`;
}

function indexSvg(label) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
  <rect width="128" height="128" rx="28" fill="#0f172a"/>
  <text x="64" y="76" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="36" font-weight="700" fill="#fff">${label}</text>
</svg>`;
}

const COMMODITY_KIND = {
  XAUUSD: "gold",
  XAGUSD: "silver",
  XPTUSD: "metal",
  XPDUSD: "metal",
  WTIUSD: "oil",
  UKOIL: "oil",
  NATGAS: "gas",
  COPPER: "metal",
  ALUMINUM: "metal",
  CORN: "agri",
  WHEAT: "agri",
  SOYBEAN: "agri",
  COFFEE: "soft",
  SUGAR: "soft",
  COCOA: "soft",
  COTTON: "soft",
  HEATOIL: "oil",
  GASOLINE: "oil",
  RICE: "agri",
};

async function tryUrls(urls) {
  for (const url of urls) {
    try {
      const { status, buf, ctype } = await get(url);
      if (status >= 200 && status < 300 && isImage(buf, ctype)) {
        return { buf, ext: extFor(buf, ctype), url };
      }
    } catch {
      /* next */
    }
  }
  return null;
}

async function fetchOne(sym) {
  const dir = path.join(OUT, sym.class.toLowerCase());
  fs.mkdirSync(dir, { recursive: true });
  const base = path.join(dir, sym.symbol);

  if (sym.class === "CRYPTO") {
    const slug = cryptoSlug(sym.symbol);
    const hit = await tryUrls([
      `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${slug}.png`,
      `https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/${slug}.png`,
      `https://assets.coincap.io/assets/icons/${slug}@2x.png`,
      `https://assets.coincap.io/assets/icons/${slug.replace(/[^a-z0-9]/g, "")}@2x.png`,
    ]);
    if (hit) {
      fs.writeFileSync(`${base}.${hit.ext}`, hit.buf);
      return { ok: true, source: hit.url };
    }
    return { ok: false };
  }

  if (sym.class === "STOCK") {
    const yahoo = sym.yahoo; // AAPL or THYAO.IS
    const ticker = yahoo.includes(".") ? yahoo.split(".")[0] : yahoo;
    const domain = STOCK_DOMAIN[sym.symbol];
    const urls = [
      `https://financialmodelingprep.com/image-stock/${encodeURIComponent(yahoo)}.png`,
      `https://financialmodelingprep.com/image-stock/${encodeURIComponent(ticker)}.png`,
      `https://storage.googleapis.com/iex/api/logos/${encodeURIComponent(ticker)}.png`,
    ];
    if (domain) {
      // google favicon as last resort for company domain (often official-ish mark)
      urls.push(`https://www.google.com/s2/favicons?domain=${domain}&sz=128`);
    }
    const hit = await tryUrls(urls);
    if (hit) {
      fs.writeFileSync(`${base}.${hit.ext}`, hit.buf);
      return { ok: true, source: hit.url };
    }
    return { ok: false };
  }

  if (sym.class === "FX") {
    const code = fxFlagCode(sym.symbol);
    const hit = await tryUrls([
      `https://flagcdn.com/w160/${code}.png`,
      `https://flagcdn.com/w80/${code}.png`,
    ]);
    if (hit) {
      fs.writeFileSync(`${base}.${hit.ext}`, hit.buf);
      return { ok: true, source: hit.url };
    }
    return { ok: false };
  }

  if (sym.class === "COMMODITY") {
    const kind = COMMODITY_KIND[sym.symbol] || "metal";
    // Prefer metal icons from crypto set when they exist
    const cryptoTry =
      kind === "gold"
        ? await tryUrls([
            "https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/paxg.png",
          ])
        : null;
    if (cryptoTry) {
      fs.writeFileSync(`${base}.${cryptoTry.ext}`, cryptoTry.buf);
      return { ok: true, source: cryptoTry.url };
    }
    fs.writeFileSync(`${base}.svg`, commoditySvg(kind));
    return { ok: true, source: "generated-svg" };
  }

  if (sym.class === "INDEX") {
    const label =
      sym.symbol === "US30" ? "30" : sym.symbol === "NAS100" ? "100" : sym.symbol === "GER40" ? "40" : "?";
    fs.writeFileSync(`${base}.svg`, indexSvg(label));
    return { ok: true, source: "generated-svg" };
  }

  return { ok: false };
}

/** Keep public/logos/manifest.json aligned with files on disk (SymbolIcon reads it). */
function writeManifest() {
  const map = {};
  for (const cls of ["stock", "fx", "crypto", "commodity", "index"]) {
    const dir = path.join(OUT, cls);
    if (!fs.existsSync(dir)) continue;
    for (const fn of fs.readdirSync(dir)) {
      if (fn.startsWith(".")) continue;
      const sym = path.parse(fn).name;
      map[sym] = `/logos/${cls}/${fn}`;
    }
  }
  const ordered = Object.fromEntries(Object.keys(map).sort().map((k) => [k, map[k]]));
  fs.writeFileSync(path.join(OUT, "manifest.json"), JSON.stringify(ordered, null, 2) + "\n");
  return Object.keys(ordered).length;
}

async function main() {
  const symbols = loadSymbols();
  console.log(`Fetching logos for ${symbols.length} symbols…`);
  const report = { ok: [], fail: [], byClass: {} };
  // concurrency 8
  let i = 0;
  async function worker() {
    while (i < symbols.length) {
      const idx = i++;
      const sym = symbols[idx];
      const r = await fetchOne(sym);
      report.byClass[sym.class] = report.byClass[sym.class] || { ok: 0, fail: 0 };
      if (r.ok) {
        report.ok.push(sym.symbol);
        report.byClass[sym.class].ok++;
        process.stdout.write(".");
      } else {
        report.fail.push(sym.symbol);
        report.byClass[sym.class].fail++;
        process.stdout.write("x");
      }
    }
  }
  await Promise.all(Array.from({ length: 8 }, () => worker()));
  console.log("\n");
  const outPath = path.join(OUT, "coverage.json");
  fs.writeFileSync(
    outPath,
    JSON.stringify(
      {
        total: symbols.length,
        withLogo: report.ok.length,
        missing: report.fail,
        byClass: report.byClass,
        generatedAt: new Date().toISOString(),
      },
      null,
      2
    )
  );
  console.log(`OK ${report.ok.length}/${symbols.length}`);
  console.log("Missing:", report.fail.join(", ") || "(none)");
  console.log("byClass", report.byClass);
  console.log(`manifest entries: ${writeManifest()}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
