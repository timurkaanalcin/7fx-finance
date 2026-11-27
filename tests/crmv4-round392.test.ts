/**
 * Modillion brackets, gutta drops, the graphite journey astragal, and the ivory note taenia.
 * Run: TZ=UTC npx tsx tests/crmv4-round392.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND392_COPY } from "../src/lib/crmv4/copy-round392";
import { ROUND391_FEATURES } from "../src/lib/crmv4/round391";
import {
  ROUND392_FEATURES,
  activeBed,
  activeDepth,
  activeHour,
  activeProfile,
  addModillion,
  addModillionView,
  briskModillion,
  dropModillionView,
  fairHand,
  guttaBlank,
  guttaCopy,
  guttaDark,
  guttaDigit,
  guttaDim,
  guttaEven,
  guttaFade,
  guttaFar,
  guttaHue,
  guttaLanesCsv,
  guttaLength,
  guttaLetter,
  guttaLit,
  guttaNear,
  guttaOpen,
  guttaRowsCsv,
  guttaUpper,
  fullDepth,
  graphiteQuiet,
  idleModillion,
  lateModillion,
  leadingGutta,
  leadingGuttaHue,
  midDepth,
  moveModillionFocus,
  modillionBed,
  modillionHour,
  modillionTimeline,
  depthCount,
  overdueModillion,
  profileBand,
  profileCool,
  profileGap,
  profilePoint,
  profileWarm,
  readModillionViews,
  reminderModillionList,
  restingModillion,
  suggestModillionBed,
  suggestModillionHour,
  suggestProfile,
  type GuttaRow,
  type Modillion,
} from "../src/lib/crmv4/round392";

function bracket(partial: Partial<Modillion> & { id: string; title: string }): Modillion {
  return {
    note: "",
    hand: "",
    profile: "",
    hour: null,
    bed: "",
    depth: 2,
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
  assert.equal(ROUND392_FEATURES.length, 25);
  assert.equal(new Set(ROUND392_FEATURES).size, 25);
  for (const feature of ROUND392_FEATURES) assert.equal((ROUND391_FEATURES as readonly string[]).includes(feature), false, feature);
  const libDir = path.join(__dirname, "../src/lib/crmv4");
  for (const feature of ROUND392_FEATURES) {
    const needle = `"${feature}"`;
    for (const file of fs.readdirSync(libDir)) {
      if (!file.endsWith(".ts") || file === "round392.ts") continue;
      const body = fs.readFileSync(path.join(libDir, file), "utf8");
      assert.equal(body.includes(needle), false, `${feature} in ${file}`);
    }
  }

  assert.equal(profilePoint(" corbel "), "corbel");
  assert.equal(profilePoint("jasper"), "");
  assert.equal(modillionHour("2"), 2);
  assert.equal(modillionHour(6), 6);
  assert.equal(modillionHour(10), 10);
  assert.equal(modillionHour(14), 14);
  assert.equal(modillionHour("4"), null);
  assert.equal(modillionHour("8"), null);
  assert.equal(depthCount("2"), 2);
  assert.equal(depthCount(4), 4);
  assert.equal(depthCount("8"), 8);
  assert.equal(depthCount("1"), null);
  assert.equal(depthCount("6"), null);
  assert.equal(modillionBed("ivory"), "IVORY");
  assert.equal(modillionBed("graphite"), "GRAPHITE");
  assert.equal(modillionBed("champagne"), "CHAMPAGNE");
  assert.equal(modillionBed("gold"), "");
  assert.equal(profileWarm("modillion"), true);
  assert.equal(profileWarm("CONSOLE"), true);
  assert.equal(profileWarm("corbel"), false);
  assert.equal(profileCool("ancone"), true);
  assert.equal(profileCool("corbel"), true);
  assert.equal(profileCool("modillion"), false);
  assert.equal(profileBand("modillion"), "first");
  assert.equal(profileBand("console"), "second");
  assert.equal(profileBand("ancone"), "third");
  assert.equal(profileBand("corbel"), "fourth");
  assert.equal(profileGap("modillion", "corbel"), 3);
  assert.equal(profileGap("corbel", "console"), -2);
  assert.equal(profileGap("gold", "corbel"), null);
  assert.equal(graphiteQuiet("graphite"), true);
  assert.equal(graphiteQuiet("ivory"), false);
  assert.equal(midDepth(4), true);
  assert.equal(midDepth(2), false);
  assert.equal(fullDepth(8), true);
  assert.equal(fullDepth(4), false);
  assert.equal(activeProfile("warm"), "warm");
  assert.equal(activeProfile("cool"), "cool");
  assert.equal(activeProfile("nope"), "all");
  assert.equal(activeHour(6), "6");
  assert.equal(activeHour(4), "all");
  assert.equal(activeBed("ivory", ["IVORY", "GRAPHITE", "CHAMPAGNE"]), "IVORY");
  assert.equal(activeDepth(8), "8");
  assert.equal(activeDepth(2), "2");
  assert.equal(activeDepth(1), "all");
  assert.equal(moveModillionFocus(0, 4, -1), 3);
  assert.equal(suggestProfile(2), "modillion");
  assert.equal(suggestProfile(6), "console");
  assert.equal(suggestProfile(12), "ancone");
  assert.equal(suggestProfile(20), "corbel");
  assert.equal(suggestModillionHour([], 2), 2);
  assert.equal(suggestModillionHour([], 6), 6);
  assert.equal(suggestModillionHour([], 12), 10);
  assert.equal(suggestModillionHour([], 20), 14);
  const shop = [
    bracket({ id: "a", title: "Ada", bed: "IVORY", profile: "modillion", hour: 2, hand: "Nia" }),
    bracket({ id: "b", title: "Bea", bed: "IVORY", profile: "corbel", hour: 6, hand: "Nia" }),
  ];
  assert.equal(suggestModillionBed(shop), "GRAPHITE");
  assert.equal(suggestModillionHour(shop, 2), 10);
  assert.equal(fairHand(shop, "Nia,Omar"), "Omar");

  const saved = addModillion([], { title: "  Corso  ", profile: "ancone", hour: 14, bed: "ivory", depth: 8, tags: "m k m x" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].profile, "ancone");
  assert.equal(saved[0].hour, 14);
  assert.equal(saved[0].bed, "IVORY");
  assert.equal(saved[0].depth, 8);
  assert.deepEqual(saved[0].tags, ["m", "k"]);
  assert.equal(saved[0].audit, "save");
  assert.equal(addModillion(saved, { title: "Corso" }).length, 1);

  const views = addModillionView([], { id: "v1", name: "Quiet", rack: "yard", query: "", hand: "", bed: "ivory", profile: "warm", hour: "2", depth: "4" });
  assert.equal(readModillionViews(views)[0].bed, "IVORY");
  assert.equal(readModillionViews(views)[0].profile, "warm");
  assert.equal(dropModillionView(views, "v1").length, 0);

  const late = bracket({ id: "l", title: "Late", profile: "modillion" });
  const idle = bracket({ id: "i", title: "Idle", hour: 2 });
  const brisk = bracket({ id: "r", title: "Brisk", bed: "CHAMPAGNE", hour: 14, depth: 8 });
  const rest = bracket({ id: "s", title: "Rest", profile: "ancone", bed: "GRAPHITE", hour: 6 });
  const due = bracket({ id: "d", title: "Due", profile: "corbel", depth: 2 });
  assert.equal(lateModillion(late, "corbel"), true);
  assert.equal(lateModillion(late, "modillion"), false);
  assert.equal(idleModillion(idle), true);
  assert.equal(briskModillion(brisk), true);
  assert.equal(restingModillion(rest), true);
  assert.equal(overdueModillion(due), true);
  assert.deepEqual(reminderModillionList([due, late]), ["Due"]);
  const timeline = modillionTimeline([bracket({ id: "t", title: "Ten", hour: 6 })]);
  assert.equal(timeline[0].hour, 6);
  assert.deepEqual(timeline[0].titles, ["Ten"]);

  const now = Date.parse("2026-11-26T12:00:00Z");
  assert.equal(guttaLit("LIVE", now), true);
  assert.equal(guttaLit(true, now), true);
  assert.equal(guttaNear("NEAR", now), true);
  assert.equal(guttaNear("WEEK", now), true);
  assert.equal(guttaNear("2026-11-29T08:00:00Z", now), true);
  assert.equal(guttaFar("2026-11-30T08:00:00Z", now), true);
  assert.equal(guttaFade("AGED", now), true);
  assert.equal(guttaFade("2026-11-22T08:00:00Z", now), true);
  assert.equal(guttaDark("MISS", now), true);
  assert.equal(guttaDark(false, now), true);
  assert.equal(guttaDark("2026-11-20T08:00:00Z", now), true);
  assert.equal(guttaDim("HOLD", now), true);
  assert.equal(guttaBlank("NONE", now), true);
  assert.equal(guttaOpen(""), true);
  assert.equal(guttaHue("LIVE", now), "gilt");
  assert.equal(guttaHue("MISS", now), "ash");
  assert.equal(guttaHue("HOLD", now), "pearl");
  assert.equal(guttaLength("LIVE"), 4);
  assert.equal(guttaEven("LIVE"), true);
  assert.equal(guttaDigit("12night"), true);
  assert.equal(guttaLetter("LIVE"), true);
  assert.equal(guttaUpper("ISTANBUL"), true);
  assert.equal(guttaUpper("LIVE"), false);
  assert.equal(guttaFar("ABCDEFGHIJ", now), true);
  assert.equal(guttaLit("9desk", now), true);
  assert.equal(guttaCopy("LIVE"), "LIVE");
  assert.equal(guttaLit({ balance: 1 }, now), false);
  assert.equal(guttaLit({ firstName: "LIVE" }, now), true);
  const rows: GuttaRow[] = [
    { id: "1", label: "Ada", code: "LIVE" },
    { id: "2", label: "Bea", code: "HOLD" },
  ];
  assert.equal(leadingGutta(rows, now), "due");
  assert.equal(leadingGuttaHue(rows, now), "gilt");
  assert.match(guttaLanesCsv(rows, now), /due,1/);
  assert.match(guttaRowsCsv(rows, ["1"], now), /Ada,LIVE/);
  assert.match(guttaRowsCsv(rows, ["1"], now), /,1$/m);
  assert.match(guttaRowsCsv(rows, ["1"], now), /^name,firstName,lane,hue,reviewed/m);

  assert.equal(crmv4Text("en", "mdlTitle"), ROUND392_COPY.en.mdlTitle);
  assert.equal(crmv4Text("tr", "gutTitle"), ROUND392_COPY.tr.gutTitle);
  assert.equal(crmv4Text("de", "mdlHint"), ROUND392_COPY.de.mdlHint);
  assert.equal(crmv4Text("ru", "journeyAstragalKicker"), ROUND392_COPY.ru.journeyAstragalKicker);
  assert.equal(crmv4Text("ar", "noteTaeniaLead"), ROUND392_COPY.ar.noteTaeniaLead);
  const keys = Object.keys(ROUND392_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND392_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-modillion/);
  assert.match(css, /\.c4-gutta/);
  assert.match(css, /\.c4-modillion-column/);
  assert.match(css, /\.c4-gutta-column/);
  assert.match(css, /\.c4-journey-astragal/);
  assert.match(css, /\.c4-note-taenia/);
  assert.match(css, /\.c4-journey-astragal-mast/);
  assert.match(css, /\.c4-note-taenia-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round392.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /row\.firstName/);
  assert.match(viewFile, /modillionCsv/);
  assert.match(viewFile, /guttaRowsCsv/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "x"/);
  assert.match(viewFile, /event\.key === "a"/);
  assert.match(viewFile, /event\.key === "c"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=24&meta=0/);
  assert.match(viewFile, /data-modillion/);
  assert.match(viewFile, /data-gutta/);
  assert.match(viewFile, /data-given/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestModillionBed/);
  assert.match(viewFile, /c4-gutta-search/);
  assert.match(viewFile, /modillionTimeline/);
  assert.match(viewFile, /c4-modillion-notices/);
  assert.match(viewFile, /from "@\/lib\/crmv4\/round392"/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "mdl"/);
  assert.match(app, /view === "gut"/);
  const journey = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round5.tsx"), "utf8");
  const notes = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round3.tsx"), "utf8");
  assert.match(journey, /c4-journey-astragal/);
  assert.match(journey, /c4-journey-astragal-mast/);
  assert.match(journey, /data-logo="mono"/);
  assert.match(journey, /journeyAstragalKicker/);
  assert.match(journey, /journeyAstragalLead/);
  assert.match(journey, /data-journey-astragal/);
  assert.match(notes, /c4-note-taenia/);
  assert.match(notes, /c4-note-taenia-mast/);
  assert.match(notes, /noteTaeniaKicker/);
  assert.match(notes, /noteTaeniaLead/);
  assert.match(notes, /data-note-taenia/);
  const namedKeys = `${viewFile}\n${journey}\n${notes}`.match(/"(mdl|gut|journeyAstragal|noteTaenia)[A-Z][A-Za-z0-9]*"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND392_COPY.en[key as keyof typeof ROUND392_COPY.en], "string", key);
  console.log("crmv4 round392 tests passed");
}

main();
