/**
 * Echinus capitals, abacus leverage slabs, the graphite score fleuron, and the ivory day socle.
 * Run: TZ=UTC npx tsx tests/crmv4-round395.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND395_COPY } from "../src/lib/crmv4/copy-round395";
import { ROUND394_FEATURES } from "../src/lib/crmv4/round394";
import {
  ROUND395_FEATURES,
  activeBed,
  activeDepth,
  activeHour,
  activeProfile,
  addEchinus,
  addEchinusView,
  abacusBlank,
  abacusCopy,
  abacusDigit,
  abacusDark,
  abacusDim,
  abacusEven,
  abacusFar,
  abacusFade,
  abacusHue,
  abacusLanesCsv,
  abacusLength,
  abacusLetter,
  abacusLit,
  abacusNear,
  abacusOpen,
  abacusRowsCsv,
  abacusUpper,
  briskEchinus,
  depthCount,
  dropEchinusView,
  fairHand,
  fullDepth,
  graphiteQuiet,
  idleEchinus,
  lateEchinus,
  leadingAbacus,
  leadingAbacusHue,
  midDepth,
  moveEchinusFocus,
  echinusBed,
  echinusHour,
  echinusTimeline,
  overdueEchinus,
  profileBand,
  profileCool,
  profileGap,
  profilePoint,
  profileWarm,
  readEchinusViews,
  reminderEchinusList,
  restingEchinus,
  suggestEchinusBed,
  suggestEchinusHour,
  suggestProfile,
  type Echinus,
  type AbacusRow,
} from "../src/lib/crmv4/round395";

function course(partial: Partial<Echinus> & { id: string; title: string }): Echinus {
  return {
    note: "",
    hand: "",
    profile: "",
    hour: null,
    bed: "",
    depth: 3,
    tags: [],
    raised: false,
    pressed: false,
    shelved: false,
    pinned: false,
    audit: "",
    ...partial,
  };
}

function main() {
  assert.equal(ROUND395_FEATURES.length, 25);
  assert.equal(new Set(ROUND395_FEATURES).size, 25);
  for (const feature of ROUND395_FEATURES) assert.equal((ROUND394_FEATURES as readonly string[]).includes(feature), false, feature);
  const libDir = path.join(__dirname, "../src/lib/crmv4");
  for (const feature of ROUND395_FEATURES) {
    const needle = `"${feature}"`;
    for (const file of fs.readdirSync(libDir)) {
      if (!file.endsWith(".ts") || file === "round395.ts") continue;
      const body = fs.readFileSync(path.join(libDir, file), "utf8");
      assert.equal(body.includes(needle), false, `${feature} in ${file}`);
    }
  }

  assert.equal(profilePoint(" echinus "), "echinus");
  assert.equal(profilePoint("jasper"), "");
  assert.equal(echinusHour("1"), 1);
  assert.equal(echinusHour(4), 4);
  assert.equal(echinusHour(8), 8);
  assert.equal(echinusHour(12), 12);
  assert.equal(echinusHour("3"), null);
  assert.equal(echinusHour("6"), null);
  assert.equal(depthCount("3"), 3);
  assert.equal(depthCount(6), 6);
  assert.equal(depthCount("9"), 9);
  assert.equal(depthCount("2"), null);
  assert.equal(depthCount("5"), null);
  assert.equal(echinusBed("ivory"), "IVORY");
  assert.equal(echinusBed("graphite"), "GRAPHITE");
  assert.equal(echinusBed("champagne"), "CHAMPAGNE");
  assert.equal(echinusBed("gold"), "");
  assert.equal(profileWarm("echinus"), true);
  assert.equal(profileWarm("NECKING"), true);
  assert.equal(profileWarm("helix"), false);
  assert.equal(profileCool("helix"), true);
  assert.equal(profileCool("volute"), true);
  assert.equal(profileCool("echinus"), false);
  assert.equal(profileBand("echinus"), "first");
  assert.equal(profileBand("necking"), "second");
  assert.equal(profileBand("helix"), "third");
  assert.equal(profileBand("volute"), "fourth");
  assert.equal(profileGap("echinus", "volute"), 3);
  assert.equal(profileGap("volute", "necking"), -2);
  assert.equal(profileGap("gold", "volute"), null);
  assert.equal(graphiteQuiet("graphite"), true);
  assert.equal(graphiteQuiet("ivory"), false);
  assert.equal(midDepth(6), true);
  assert.equal(midDepth(3), false);
  assert.equal(fullDepth(9), true);
  assert.equal(fullDepth(6), false);
  assert.equal(activeProfile("warm"), "warm");
  assert.equal(activeProfile("cool"), "cool");
  assert.equal(activeProfile("nope"), "all");
  assert.equal(activeHour(4), "4");
  assert.equal(activeHour(2), "all");
  assert.equal(activeBed("ivory", ["IVORY", "GRAPHITE", "CHAMPAGNE"]), "IVORY");
  assert.equal(activeDepth(9), "9");
  assert.equal(activeDepth(3), "3");
  assert.equal(activeDepth(1), "all");
  assert.equal(moveEchinusFocus(0, 4, -1), 3);
  assert.equal(suggestProfile(2), "echinus");
  assert.equal(suggestProfile(7), "necking");
  assert.equal(suggestProfile(12), "helix");
  assert.equal(suggestProfile(20), "volute");
  assert.equal(suggestEchinusHour([], 2), 1);
  assert.equal(suggestEchinusHour([], 6), 4);
  assert.equal(suggestEchinusHour([], 8), 4);
  assert.equal(suggestEchinusHour([], 12), 8);
  assert.equal(suggestEchinusHour([], 20), 12);
  const cornice = [
    course({ id: "a", title: "Ada", bed: "IVORY", profile: "echinus", hour: 1, hand: "Nia" }),
    course({ id: "b", title: "Bea", bed: "IVORY", profile: "volute", hour: 4, hand: "Nia" }),
  ];
  assert.equal(suggestEchinusBed(cornice), "GRAPHITE");
  assert.equal(suggestEchinusHour(cornice, 3), 8);
  assert.equal(fairHand(cornice, "Nia,Omar"), "Omar");

  const saved = addEchinus([], { title: "  Corso  ", profile: "helix", hour: 12, bed: "ivory", depth: 9, tags: "e n e x" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].profile, "helix");
  assert.equal(saved[0].hour, 12);
  assert.equal(saved[0].bed, "IVORY");
  assert.equal(saved[0].depth, 9);
  assert.deepEqual(saved[0].tags, ["e", "n"]);
  assert.equal(saved[0].audit, "save");
  assert.equal(addEchinus(saved, { title: "Corso" }).length, 1);

  const views = addEchinusView([], { id: "v1", name: "Quiet", rack: "yard", query: "", hand: "", bed: "ivory", profile: "warm", hour: "1", depth: "6" });
  assert.equal(readEchinusViews(views)[0].bed, "IVORY");
  assert.equal(readEchinusViews(views)[0].profile, "warm");
  assert.equal(dropEchinusView(views, "v1").length, 0);

  const late = course({ id: "l", title: "Late", profile: "echinus" });
  const idle = course({ id: "i", title: "Idle", hour: 1 });
  const brisk = course({ id: "r", title: "Brisk", bed: "CHAMPAGNE", hour: 12, depth: 9 });
  const rest = course({ id: "s", title: "Rest", profile: "helix", bed: "GRAPHITE", hour: 4 });
  const due = course({ id: "d", title: "Due", profile: "volute", depth: 3 });
  assert.equal(lateEchinus(late, "volute"), true);
  assert.equal(lateEchinus(late, "echinus"), false);
  assert.equal(idleEchinus(idle), true);
  assert.equal(briskEchinus(brisk), true);
  assert.equal(restingEchinus(rest), true);
  assert.equal(overdueEchinus(due), true);
  assert.deepEqual(reminderEchinusList([due, late]), ["Due"]);
  const timeline = echinusTimeline([course({ id: "t", title: "Ten", hour: 4 })]);
  assert.equal(timeline[0].hour, 4);
  assert.deepEqual(timeline[0].titles, ["Ten"]);

  assert.equal(abacusLit("SET"), true);
  assert.equal(abacusLit(true), true);
  assert.equal(abacusNear("100"), true);
  assert.equal(abacusNear("50"), false);
  assert.equal(abacusFar("ab"), true);
  assert.equal(abacusFar("50"), true);
  assert.equal(abacusFade("A".repeat(12)), true);
  assert.equal(abacusFade("1000"), true);
  assert.equal(abacusDim("HOLD"), true);
  assert.equal(abacusDim("WAIT"), true);
  assert.equal(abacusDark("SHUT"), true);
  assert.equal(abacusDark(false), true);
  assert.equal(abacusBlank("NONE"), true);
  assert.equal(abacusOpen(""), true);
  assert.equal(abacusHue("SET"), "gilt");
  assert.equal(abacusHue("SHUT"), "ash");
  assert.equal(abacusHue("HOLD"), "pearl");
  assert.equal(abacusLength("LIVE"), 4);
  assert.equal(abacusEven("LIVE"), true);
  assert.equal(abacusDigit("12night"), true);
  assert.equal(abacusLetter("SET"), true);
  assert.equal(abacusUpper("ISTANBUL"), true);
  assert.equal(abacusUpper("SET"), false);
  assert.equal(abacusLit("ABCDEFGH"), true);
  assert.equal(abacusLit("clh0abc123def456"), false);
  assert.equal(abacusCopy("SET"), "SET");
  assert.equal(abacusLit({ balance: 1 }), false);
  assert.equal(abacusLit({ leverage: "SET" }), true);
  const rows: AbacusRow[] = [
    { id: "1", label: "Ada", code: "SET" },
    { id: "2", label: "Bea", code: "HOLD" },
  ];
  assert.equal(leadingAbacus(rows), "link");
  assert.equal(leadingAbacusHue(rows), "gilt");
  assert.match(abacusLanesCsv(rows), /link,1/);
  assert.match(abacusRowsCsv(rows, ["1"]), /Ada,SET/);
  assert.match(abacusRowsCsv(rows, ["1"]), /,1$/m);
  assert.match(abacusRowsCsv(rows, ["1"]), /^name,leverage,lane,hue,reviewed/m);

  assert.equal(crmv4Text("en", "echTitle"), ROUND395_COPY.en.echTitle);
  assert.equal(crmv4Text("tr", "abcTitle"), ROUND395_COPY.tr.abcTitle);
  assert.equal(crmv4Text("de", "echHint"), ROUND395_COPY.de.echHint);
  assert.equal(crmv4Text("ru", "csatFleuronKicker"), ROUND395_COPY.ru.csatFleuronKicker);
  assert.equal(crmv4Text("ar", "daySocleLead"), ROUND395_COPY.ar.daySocleLead);
  const keys = Object.keys(ROUND395_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND395_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-echinus/);
  assert.match(css, /\.c4-abacus/);
  assert.match(css, /\.c4-echinus-column/);
  assert.match(css, /\.c4-abacus-column/);
  assert.match(css, /\.c4-csat-fleuron/);
  assert.match(css, /\.c4-day-socle/);
  assert.match(css, /\.c4-csat-fleuron-mast/);
  assert.match(css, /\.c4-day-socle-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round395.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /row\.leverage/);
  assert.match(viewFile, /echinusCsv/);
  assert.match(viewFile, /abacusRowsCsv/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "x"/);
  assert.match(viewFile, /event\.key === "a"/);
  assert.match(viewFile, /event\.key === "c"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=24&meta=0/);
  assert.match(viewFile, /data-echinus/);
  assert.match(viewFile, /data-abacus/);
  assert.match(viewFile, /data-leverage/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestEchinusBed/);
  assert.match(viewFile, /c4-abacus-search/);
  assert.match(viewFile, /echinusTimeline/);
  assert.match(viewFile, /c4-echinus-notices/);
  assert.match(viewFile, /from "@\/lib\/crmv4\/round395"/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "ech"/);
  assert.match(app, /view === "abc"/);
  const score = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round9.tsx"), "utf8");
  assert.match(score, /c4-csat-fleuron/);
  assert.match(score, /c4-csat-fleuron-mast/);
  assert.match(score, /data-logo="mono"/);
  assert.match(score, /csatFleuronKicker/);
  assert.match(score, /csatFleuronLead/);
  assert.match(score, /data-csat-fleuron/);
  assert.match(score, /c4-day-socle/);
  assert.match(score, /c4-day-socle-mast/);
  assert.match(score, /daySocleKicker/);
  assert.match(score, /daySocleLead/);
  assert.match(score, /data-day-socle/);
  const namedKeys = `${viewFile}\n${score}`.match(/"(ech|abc|csatFleuron|daySocle)[A-Z][A-Za-z0-9]*"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND395_COPY.en[key as keyof typeof ROUND395_COPY.en], "string", key);
  console.log("crmv4 round395 tests passed");
}

main();
