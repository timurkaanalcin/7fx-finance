/**
 * Pastiglia bosses, cera slips, the graphite workload cloister, and the ivory smart-list ambulatory.
 * Run: TZ=UTC npx tsx tests/crmv4-round389.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND389_COPY } from "../src/lib/crmv4/copy-round389";
import { ROUND388_FEATURES } from "../src/lib/crmv4/round388";
import {
  ROUND389_FEATURES,
  activeGround,
  activeHour,
  activeLift,
  activeMaterial,
  addPastiglia,
  addPastigliaView,
  briskPastiglia,
  dropPastigliaView,
  fairHand,
  fullLift,
  idlePastiglia,
  ivoryQuiet,
  latePastiglia,
  leadingSlip,
  leadingSlipHue,
  liftCount,
  materialBand,
  materialCool,
  materialGap,
  materialPoint,
  materialWarm,
  midLift,
  movePastigliaFocus,
  overduePastiglia,
  pastigliaGround,
  pastigliaHour,
  pastigliaTimeline,
  readPastigliaViews,
  reminderPastigliaList,
  restingPastiglia,
  slipBlank,
  slipCopy,
  slipDark,
  slipDigit,
  slipDim,
  slipEven,
  slipFade,
  slipFar,
  slipHue,
  slipLanesCsv,
  slipLength,
  slipLetter,
  slipLit,
  slipNear,
  slipOpen,
  slipRowsCsv,
  slipUpper,
  suggestMaterial,
  suggestPastigliaGround,
  suggestPastigliaHour,
  type Pastiglia,
  type SlipRow,
} from "../src/lib/crmv4/round389";

function boss(partial: Partial<Pastiglia> & { id: string; title: string }): Pastiglia {
  return {
    note: "",
    hand: "",
    material: "",
    hour: null,
    ground: "",
    lift: 1,
    tags: [],
    raised: false,
    moulded: false,
    chested: false,
    pinned: false,
    audit: "",
    ...partial,
  };
}

function main() {
  assert.equal(ROUND389_FEATURES.length, 25);
  assert.equal(new Set(ROUND389_FEATURES).size, 25);
  for (const feature of ROUND389_FEATURES) assert.equal((ROUND388_FEATURES as readonly string[]).includes(feature), false, feature);
  const libDir = path.join(__dirname, "../src/lib/crmv4");
  for (const feature of ROUND389_FEATURES) {
    const needle = `"${feature}"`;
    for (const file of fs.readdirSync(libDir)) {
      if (!file.endsWith(".ts") || file === "round389.ts") continue;
      const body = fs.readFileSync(path.join(libDir, file), "utf8");
      assert.equal(body.includes(needle), false, `${feature} in ${file}`);
    }
  }

  assert.equal(materialPoint(" gilt "), "gilt");
  assert.equal(materialPoint("jasper"), "");
  assert.equal(pastigliaHour("4"), 4);
  assert.equal(pastigliaHour(8), 8);
  assert.equal(pastigliaHour(12), 12);
  assert.equal(pastigliaHour(16), 16);
  assert.equal(pastigliaHour("3"), null);
  assert.equal(pastigliaHour("7"), null);
  assert.equal(liftCount("1"), 1);
  assert.equal(liftCount(3), 3);
  assert.equal(liftCount("6"), 6);
  assert.equal(liftCount("2"), null);
  assert.equal(liftCount("8"), null);
  assert.equal(pastigliaGround("ivory"), "IVORY");
  assert.equal(pastigliaGround("graphite"), "GRAPHITE");
  assert.equal(pastigliaGround("champagne"), "CHAMPAGNE");
  assert.equal(pastigliaGround("gold"), "");
  assert.equal(materialWarm("gesso"), true);
  assert.equal(materialWarm("CHALK"), true);
  assert.equal(materialWarm("gilt"), false);
  assert.equal(materialCool("bole"), true);
  assert.equal(materialCool("gilt"), true);
  assert.equal(materialCool("chalk"), false);
  assert.equal(materialBand("gesso"), "first");
  assert.equal(materialBand("chalk"), "second");
  assert.equal(materialBand("bole"), "third");
  assert.equal(materialBand("gilt"), "fourth");
  assert.equal(materialGap("gesso", "gilt"), 3);
  assert.equal(materialGap("gilt", "chalk"), -2);
  assert.equal(materialGap("gold", "gilt"), null);
  assert.equal(ivoryQuiet("ivory"), true);
  assert.equal(ivoryQuiet("champagne"), false);
  assert.equal(midLift(3), true);
  assert.equal(midLift(1), false);
  assert.equal(fullLift(6), true);
  assert.equal(fullLift(3), false);
  assert.equal(activeMaterial("warm"), "warm");
  assert.equal(activeMaterial("cool"), "cool");
  assert.equal(activeMaterial("nope"), "all");
  assert.equal(activeHour(8), "8");
  assert.equal(activeHour(6), "all");
  assert.equal(activeGround("ivory", ["IVORY", "GRAPHITE", "CHAMPAGNE"]), "IVORY");
  assert.equal(activeLift(6), "6");
  assert.equal(activeLift(1), "1");
  assert.equal(activeLift(2), "all");
  assert.equal(movePastigliaFocus(0, 4, -1), 3);
  assert.equal(suggestMaterial(2), "gesso");
  assert.equal(suggestMaterial(8), "chalk");
  assert.equal(suggestMaterial(14), "bole");
  assert.equal(suggestMaterial(20), "gilt");
  assert.equal(suggestPastigliaHour([], 2), 4);
  assert.equal(suggestPastigliaHour([], 8), 8);
  assert.equal(suggestPastigliaHour([], 14), 12);
  assert.equal(suggestPastigliaHour([], 20), 16);
  const panel = [
    boss({ id: "a", title: "Ada", ground: "IVORY", material: "gesso", hour: 4, hand: "Nia" }),
    boss({ id: "b", title: "Bea", ground: "IVORY", material: "gilt", hour: 8, hand: "Nia" }),
  ];
  assert.equal(suggestPastigliaGround(panel), "GRAPHITE");
  assert.equal(suggestPastigliaHour(panel, 2), 12);
  assert.equal(fairHand(panel, "Nia,Omar"), "Omar");

  const saved = addPastiglia([], { title: "  Corso  ", material: "bole", hour: 16, ground: "ivory", lift: 6, tags: "p q p x" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].material, "bole");
  assert.equal(saved[0].hour, 16);
  assert.equal(saved[0].ground, "IVORY");
  assert.equal(saved[0].lift, 6);
  assert.deepEqual(saved[0].tags, ["p", "q"]);
  assert.equal(saved[0].audit, "save");
  assert.equal(addPastiglia(saved, { title: "Corso" }).length, 1);

  const views = addPastigliaView([], { id: "v1", name: "Quiet", rack: "panel", query: "", hand: "", ground: "ivory", material: "warm", hour: "4", lift: "3" });
  assert.equal(readPastigliaViews(views)[0].ground, "IVORY");
  assert.equal(readPastigliaViews(views)[0].material, "warm");
  assert.equal(dropPastigliaView(views, "v1").length, 0);

  const late = boss({ id: "l", title: "Late", material: "gesso" });
  const idle = boss({ id: "i", title: "Idle", hour: 4 });
  const brisk = boss({ id: "r", title: "Brisk", ground: "GRAPHITE", hour: 16, lift: 6 });
  const rest = boss({ id: "s", title: "Rest", material: "bole", ground: "IVORY", hour: 8 });
  const due = boss({ id: "d", title: "Due", material: "gilt", lift: 1 });
  assert.equal(latePastiglia(late, "gilt"), true);
  assert.equal(latePastiglia(late, "gesso"), false);
  assert.equal(idlePastiglia(idle), true);
  assert.equal(briskPastiglia(brisk), true);
  assert.equal(restingPastiglia(rest), true);
  assert.equal(overduePastiglia(due), true);
  assert.deepEqual(reminderPastigliaList([due, late]), ["Due"]);
  const timeline = pastigliaTimeline([boss({ id: "t", title: "Ten", hour: 8 })]);
  assert.equal(timeline[0].hour, 8);
  assert.deepEqual(timeline[0].titles, ["Ten"]);

  const now = Date.parse("2026-11-26T12:00:00Z");
  assert.equal(slipLit("HOME", now), true);
  assert.equal(slipLit(true, now), true);
  assert.equal(slipNear("NEXT", now), true);
  assert.equal(slipNear("2026-11-28T08:00:00Z", now), true);
  assert.equal(slipFar("2026-11-29T08:00:00Z", now), true);
  assert.equal(slipFade("OLD", now), true);
  assert.equal(slipFade("2026-11-23T08:00:00Z", now), true);
  assert.equal(slipDark("LOST", now), true);
  assert.equal(slipDark(false, now), true);
  assert.equal(slipDark("2026-11-21T08:00:00Z", now), true);
  assert.equal(slipDim("PARK", now), true);
  assert.equal(slipBlank("NONE", now), true);
  assert.equal(slipOpen(""), true);
  assert.equal(slipHue("HOME", now), "gilt");
  assert.equal(slipHue("LOST", now), "ash");
  assert.equal(slipHue("PARK", now), "pearl");
  assert.equal(slipLength("HOME"), 4);
  assert.equal(slipEven("DESK"), true);
  assert.equal(slipDigit("12night"), true);
  assert.equal(slipLetter("HOME"), true);
  assert.equal(slipUpper("ISTANBUL"), true);
  assert.equal(slipUpper("HOME"), false);
  assert.equal(slipCopy("HOME"), "HOME");
  assert.equal(slipLit({ balance: 1 }, now), false);
  const rows: SlipRow[] = [
    { id: "1", label: "Ada", code: "HOME" },
    { id: "2", label: "Bea", code: "PARK" },
  ];
  assert.equal(leadingSlip(rows, now), "due");
  assert.equal(leadingSlipHue(rows, now), "gilt");
  assert.match(slipLanesCsv(rows, now), /due,1/);
  assert.match(slipRowsCsv(rows, ["1"], now), /Ada,HOME/);
  assert.match(slipRowsCsv(rows, ["1"], now), /,1$/m);

  assert.equal(crmv4Text("en", "psgTitle"), ROUND389_COPY.en.psgTitle);
  assert.equal(crmv4Text("tr", "ceraTitle"), ROUND389_COPY.tr.ceraTitle);
  assert.equal(crmv4Text("de", "psgHint"), ROUND389_COPY.de.psgHint);
  assert.equal(crmv4Text("ru", "workloadCloisterKicker"), ROUND389_COPY.ru.workloadCloisterKicker);
  assert.equal(crmv4Text("ar", "smartAmbulatoryLead"), ROUND389_COPY.ar.smartAmbulatoryLead);
  const keys = Object.keys(ROUND389_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND389_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-pastiglia/);
  assert.match(css, /\.c4-cera/);
  assert.match(css, /\.c4-pastiglia-column/);
  assert.match(css, /\.c4-cera-column/);
  assert.match(css, /\.c4-workload-cloister/);
  assert.match(css, /\.c4-smart-ambulatory/);
  assert.match(css, /\.c4-workload-cloister-mast/);
  assert.match(css, /\.c4-smart-ambulatory-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round389.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /row\.city/);
  assert.match(viewFile, /pastigliaCsv/);
  assert.match(viewFile, /slipRowsCsv/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "x"/);
  assert.match(viewFile, /event\.key === "a"/);
  assert.match(viewFile, /event\.key === "c"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=24&meta=0/);
  assert.match(viewFile, /data-pastiglia/);
  assert.match(viewFile, /data-cera/);
  assert.match(viewFile, /data-names/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestPastigliaGround/);
  assert.match(viewFile, /c4-cera-search/);
  assert.match(viewFile, /pastigliaTimeline/);
  assert.match(viewFile, /c4-pastiglia-notices/);
  assert.match(viewFile, /from "@\/lib\/crmv4\/round389"/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "psg"/);
  assert.match(app, /view === "csl"/);
  const desk = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round4.tsx"), "utf8");
  assert.match(desk, /c4-workload-cloister/);
  assert.match(desk, /c4-workload-cloister-mast/);
  assert.match(desk, /data-logo="mono"/);
  assert.match(desk, /workloadCloisterKicker/);
  assert.match(desk, /workloadCloisterLead/);
  assert.match(desk, /data-workload-cloister/);
  assert.match(desk, /c4-smart-ambulatory/);
  assert.match(desk, /c4-smart-ambulatory-mast/);
  assert.match(desk, /smartAmbulatoryKicker/);
  assert.match(desk, /smartAmbulatoryLead/);
  assert.match(desk, /data-smart-ambulatory/);
  const namedKeys = `${viewFile}\n${desk}`.match(/"(psg|cera|workloadCloister|smartAmbulatory)[A-Za-z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND389_COPY.en[key as keyof typeof ROUND389_COPY.en], "string", key);
  console.log("crmv4 round389 tests passed");
}

main();
