/**
 * Ormolu mounts, validation gauges, the ivory lead slip, and the graphite trend ledger.
 * Run: TZ=UTC npx tsx tests/crmv4-round386.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND386_COPY } from "../src/lib/crmv4/copy-round386";
import { ROUND385_FEATURES } from "../src/lib/crmv4/round385";
import {
  ROUND386_FEATURES,
  activeCoat,
  activeGround,
  activeHour,
  activeMetal,
  addOrmolu,
  addOrmoluView,
  briskOrmolu,
  coatCount,
  dropOrmoluView,
  fairHand,
  gaugeBlank,
  gaugeCopy,
  gaugeDigit,
  gaugeDue,
  gaugeEven,
  gaugeFar,
  gaugeHold,
  gaugeHue,
  gaugeLane,
  gaugeLanesCsv,
  gaugeLate,
  gaugeLength,
  gaugeLetter,
  gaugeMissed,
  gaugeOpen,
  gaugeRowsCsv,
  gaugeSoon,
  gaugeUpper,
  fullCoat,
  graphiteQuiet,
  idleOrmolu,
  lateOrmolu,
  leadingGauge,
  leadingGaugeHue,
  midCoat,
  moveOrmoluFocus,
  overdueOrmolu,
  readOrmoluViews,
  reminderOrmoluList,
  restingOrmolu,
  metalBand,
  metalCool,
  metalGap,
  metalPoint,
  metalWarm,
  suggestMetal,
  suggestOrmoluGround,
  suggestOrmoluHour,
  ormoluGround,
  ormoluHour,
  ormoluTimeline,
  type GaugeRow,
  type Ormolu,
} from "../src/lib/crmv4/round386";

function rule(partial: Partial<Ormolu> & { id: string; title: string }): Ormolu {
  return {
    note: "",
    hand: "",
    metal: "",
    hour: null,
    ground: "",
    coat: 1,
    tags: [],
    raised: false,
    trayed: false,
    vaulted: false,
    pinned: false,
    audit: "",
    ...partial,
  };
}

function main() {
  assert.equal(ROUND386_FEATURES.length, 25);
  assert.equal(new Set(ROUND386_FEATURES).size, 25);
  for (const feature of ROUND386_FEATURES) assert.equal((ROUND385_FEATURES as readonly string[]).includes(feature), false, feature);
  const libDir = path.join(__dirname, "../src/lib/crmv4");
  for (const feature of ROUND386_FEATURES) {
    const needle = `"${feature}"`;
    for (const file of fs.readdirSync(libDir)) {
      if (!file.endsWith(".ts") || file === "round386.ts") continue;
      const body = fs.readFileSync(path.join(libDir, file), "utf8");
      assert.equal(body.includes(needle), false, `${feature} in ${file}`);
    }
  }
  assert.equal(metalPoint(" bronze "), "bronze");
  assert.equal(metalPoint("brass"), "");
  assert.equal(ormoluHour("4"), 4);
  assert.equal(ormoluHour(8), 8);
  assert.equal(ormoluHour(12), 12);
  assert.equal(ormoluHour(16), 16);
  assert.equal(ormoluHour("5"), null);
  assert.equal(ormoluHour("7"), null);
  assert.equal(coatCount("1"), 1);
  assert.equal(coatCount(2), 2);
  assert.equal(coatCount("4"), 4);
  assert.equal(coatCount("3"), null);
  assert.equal(coatCount("7"), null);
  assert.equal(ormoluGround("ivory"), "IVORY");
  assert.equal(ormoluGround("graphite"), "GRAPHITE");
  assert.equal(ormoluGround("champagne"), "CHAMPAGNE");
  assert.equal(ormoluGround("gold"), "");
  assert.equal(metalWarm("bronze"), true);
  assert.equal(metalWarm("GILT"), true);
  assert.equal(metalWarm("iron"), false);
  assert.equal(metalCool("pewter"), true);
  assert.equal(metalCool("iron"), true);
  assert.equal(metalCool("bronze"), false);
  assert.equal(metalBand("bronze"), "first");
  assert.equal(metalBand("gilt"), "second");
  assert.equal(metalBand("pewter"), "third");
  assert.equal(metalBand("iron"), "fourth");
  assert.equal(metalGap("bronze", "iron"), 3);
  assert.equal(graphiteQuiet("graphite"), true);
  assert.equal(graphiteQuiet("ivory"), false);
  assert.equal(graphiteQuiet("champagne"), false);
  assert.equal(midCoat(2), true);
  assert.equal(midCoat(1), false);
  assert.equal(fullCoat(4), true);
  assert.equal(fullCoat(2), false);
  assert.equal(activeMetal("warm"), "warm");
  assert.equal(activeHour("4"), "4");
  assert.equal(activeHour("5"), "all");
  assert.equal(activeCoat("4"), "4");
  assert.equal(activeCoat("3"), "all");
  assert.equal(activeGround("graphite", ["GRAPHITE"]), "GRAPHITE");
  assert.equal(suggestMetal(4), "bronze");
  assert.equal(suggestMetal(8), "gilt");
  assert.equal(suggestMetal(14), "pewter");
  assert.equal(suggestMetal(20), "iron");
  assert.equal(suggestOrmoluHour([], 1), 4);
  assert.equal(suggestOrmoluHour([], 6), 8);
  assert.equal(suggestOrmoluHour([], 12), 12);
  assert.equal(suggestOrmoluHour([], 18), 16);
  assert.equal(suggestOrmoluGround([]), "IVORY");
  assert.equal(moveOrmoluFocus(0, 3, 1), 1);
  assert.equal(moveOrmoluFocus(0, 3, -1), 2);

  const saved = addOrmolu([], { id: "g1", title: "Gilt tile", hand: "Ada", metal: "gilt", hour: 8, ground: "graphite", coat: 2, tags: "b g x" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].ground, "GRAPHITE");
  assert.equal(saved[0].tags.join(""), "bg");
  assert.equal(saved[0].audit, "save");
  assert.equal(saved[0].coat, 2);
  assert.equal(addOrmolu(saved, { title: "Gilt tile" }).length, 1);
  const iron = rule({ id: "n1", title: "Iron tile", metal: "iron", coat: 1 });
  assert.equal(overdueOrmolu(iron), true);
  assert.equal(reminderOrmoluList([iron])[0], "Iron tile");
  assert.equal(idleOrmolu(rule({ id: "i1", title: "Idle", hour: 4, coat: 1 })), true);
  assert.equal(briskOrmolu(rule({ id: "b1", title: "Brisk", ground: "CHAMPAGNE", hour: 16, coat: 4 })), true);
  assert.equal(restingOrmolu(rule({ id: "r1", title: "Rest", metal: "pewter", ground: "IVORY", hour: 8 })), true);
  assert.equal(lateOrmolu(rule({ id: "l1", title: "Late", metal: "bronze" }), "iron"), true);
  assert.equal(lateOrmolu(rule({ id: "l2", title: "Held", metal: "bronze", raised: true }), "iron"), false);
  assert.equal(fairHand([rule({ id: "a", title: "A", hand: "Ada" }), rule({ id: "b", title: "B", hand: "Bea", raised: true })], "Ada,Bea"), "Bea");
  const timeline = ormoluTimeline([rule({ id: "t", title: "Ten", hour: 4 })]);
  assert.equal(timeline[0].hour, 4);
  assert.equal(timeline[0].titles[0], "Ten");
  const views = readOrmoluViews([{ id: "v1", name: "Pewter deck", rack: "vault", query: "tile", hand: "Ada", ground: "GRAPHITE", metal: "cool", hour: "16", coat: "4" }]);
  assert.equal(views[0].rack, "vault");
  assert.equal(views[0].metal, "cool");
  assert.equal(views[0].hour, "16");
  assert.equal(views[0].coat, "4");
  assert.equal(dropOrmoluView(views, "v1").length, 0);
  assert.equal(addOrmoluView(views, views[0]).length, 1);

  const now = Date.parse("2026-11-26T12:00:00Z");
  assert.equal(gaugeLane("PASS", now), "due");
  assert.equal(gaugeLane("NEXT", now), "soon");
  assert.equal(gaugeLane("HOLD", now), "hold");
  assert.equal(gaugeLane("LATE", now), "late");
  assert.equal(gaugeLane("REJECT", now), "missed");
  assert.equal(gaugeLane("OPEN", now), "blank");
  assert.equal(gaugeLane(true, now), "due");
  assert.equal(gaugeLane(false, now), "blank");
  assert.equal(gaugeLane("2026-11-26T08:00:00Z", now), "due");
  assert.equal(gaugeLane("2026-11-28T08:00:00Z", now), "soon");
  assert.equal(gaugeLane("2026-12-10T08:00:00Z", now), "far");
  assert.equal(gaugeLane("2026-11-25T18:00:00Z", now), "late");
  assert.equal(gaugeLane("2026-11-01T08:00:00Z", now), "missed");
  assert.equal(gaugeLane("Apricot", now), "soon");
  assert.equal(gaugeLane("12night", now), "late");
  assert.equal(gaugeLane("COPPERPLATEXXX", now), "far");
  assert.equal(gaugeLane({ validationStatus: "PASS" }, now), "due");
  assert.equal(gaugeLane({ name: "Ada" }, now), "");
  assert.equal(gaugeLane({ validationStatus: "PASS", amount: 1 }, now), "");
  assert.equal(gaugeHue("PASS", now), "gilt");
  assert.equal(gaugeHue("LATE", now), "ink");
  assert.equal(gaugeHue("HOLD", now), "pearl");
  assert.equal(gaugeDue("PASS", now), true);
  assert.equal(gaugeSoon("NEXT", now), true);
  assert.equal(gaugeFar("2026-12-10T08:00:00Z", now), true);
  assert.equal(gaugeLate("LATE", now), true);
  assert.equal(gaugeMissed("REJECT", now), true);
  assert.equal(gaugeHold("QUEUE", now), true);
  assert.equal(gaugeBlank("NONE", now), true);
  assert.equal(gaugeOpen(""), true);
  assert.equal(gaugeLength("PASS"), 4);
  assert.equal(gaugeEven("PASS"), true);
  assert.equal(gaugeDigit("12night"), true);
  assert.equal(gaugeLetter("PASS"), true);
  assert.equal(gaugeUpper("AUSTRALIA"), true);
  assert.equal(gaugeUpper("PASS"), false);
  assert.equal(gaugeCopy("PASS"), "PASS");
  const rows: GaugeRow[] = [
    { id: "1", label: "Ada", code: "PASS" },
    { id: "2", label: "Bea", code: "HOLD" },
  ];
  assert.equal(leadingGauge(rows, now), "due");
  assert.equal(leadingGaugeHue(rows, now), "gilt");
  assert.match(gaugeLanesCsv(rows, now), /due,1/);
  assert.match(gaugeRowsCsv(rows, ["1"], now), /Ada,PASS/);
  assert.match(gaugeRowsCsv(rows, ["1"], now), /,1$/m);

  assert.equal(crmv4Text("en", "mntTitle"), ROUND386_COPY.en.mntTitle);
  assert.equal(crmv4Text("tr", "ggeTitle"), ROUND386_COPY.tr.ggeTitle);
  assert.equal(crmv4Text("de", "mntHint"), ROUND386_COPY.de.mntHint);
  assert.equal(crmv4Text("ru", "trendLedgerKicker"), ROUND386_COPY.ru.trendLedgerKicker);
  assert.equal(crmv4Text("ar", "leadSlipLead"), ROUND386_COPY.ar.leadSlipLead);
  const keys = Object.keys(ROUND386_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND386_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-ormolu/);
  assert.match(css, /\.c4-valgauge/);
  assert.match(css, /\.c4-ormolu-column/);
  assert.match(css, /\.c4-valgauge-column/);
  assert.match(css, /\.c4-lead-slip/);
  assert.match(css, /\.c4-trend-ledger/);
  assert.match(css, /\.c4-lead-slip-mast/);
  assert.match(css, /\.c4-trend-ledger-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round386.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /validationStatus:/);
  assert.match(viewFile, /ormoluCsv/);
  assert.match(viewFile, /gaugeRowsCsv/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "x"/);
  assert.match(viewFile, /event\.key === "a"/);
  assert.match(viewFile, /event\.key === "c"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=24&meta=0/);
  assert.match(viewFile, /data-ormolu/);
  assert.match(viewFile, /data-gauge/);
  assert.match(viewFile, /data-names/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestOrmoluGround/);
  assert.match(viewFile, /c4-valgauge-search/);
  assert.match(viewFile, /ormoluTimeline/);
  assert.match(viewFile, /c4-ormolu-notices/);
  assert.match(viewFile, /from "@\/lib\/crmv4\/round386"/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "mnt"/);
  assert.match(app, /view === "gge"/);
  const desk = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round13.tsx"), "utf8");
  assert.match(desk, /c4-lead-slip/);
  assert.match(desk, /c4-lead-slip-mast/);
  assert.match(desk, /data-logo="mono"/);
  assert.match(desk, /leadSlipKicker/);
  assert.match(desk, /leadSlipLead/);
  assert.match(desk, /data-lead-slip/);
  assert.match(desk, /c4-trend-ledger/);
  assert.match(desk, /c4-trend-ledger-mast/);
  assert.match(desk, /trendLedgerKicker/);
  assert.match(desk, /trendLedgerLead/);
  assert.match(desk, /data-trend-ledger/);
  const namedKeys = `${viewFile}\n${desk}`.match(/"(mnt|gge|leadSlip|trendLedger)[A-Za-z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND386_COPY.en[key as keyof typeof ROUND386_COPY.en], "string", key);
  console.log("crmv4 round386 tests passed");
}

main();
