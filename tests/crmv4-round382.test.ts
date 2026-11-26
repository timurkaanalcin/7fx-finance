/**
 * Verdaccio veils, bole grounds, the ivory SMS palimpsest, and the graphite win-back intarsia.
 * Run: TZ=UTC npx tsx tests/crmv4-round382.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND382_COPY } from "../src/lib/crmv4/copy-round382";
import { ROUND381_FEATURES } from "../src/lib/crmv4/round381";
import {
  ROUND382_FEATURES,
  activeDay,
  activeFilm,
  activeGround,
  activePigment,
  addVeil,
  addVeilView,
  bolBare,
  bolBrief,
  bolCool,
  bolCopy,
  bolDigit,
  bolEven,
  bolFirst,
  bolHeld,
  bolHue,
  bolHush,
  bolKeep,
  bolLane,
  bolLanesCsv,
  bolLength,
  bolLongLane,
  bolLost,
  bolLower,
  bolOpen,
  bolPair,
  bolRoute,
  bolRowsCsv,
  bolShort,
  bolSoon,
  bolSpace,
  bolTallyLane,
  bolUpper,
  bolVowel,
  bolVowelLane,
  briskVeil,
  dropVeilView,
  fairPainter,
  filmCount,
  fullFilm,
  graphiteQuiet,
  idleVeil,
  lateVeil,
  leadingBol,
  leadingBolHue,
  midFilm,
  moveVeilFocus,
  overdueVeil,
  pigmentBand,
  pigmentCool,
  pigmentGap,
  pigmentPoint,
  pigmentWarm,
  readVeilViews,
  reminderVeils,
  restingVeil,
  suggestPigment,
  suggestVeilDay,
  suggestVeilGround,
  veilDay,
  veilGround,
  veilTimeline,
  type BolRow,
  type Veil,
} from "../src/lib/crmv4/round382";

function rule(partial: Partial<Veil> & { id: string; title: string }): Veil {
  return {
    note: "",
    hand: "",
    tool: "",
    depth: null,
    ground: "",
    coat: 1,
    tags: [],
    raised: false,
    trayed: false,
    stored: false,
    starred: false,
    audit: "",
    ...partial,
  };
}

function main() {
  assert.equal(ROUND382_FEATURES.length, 25);
  assert.equal(new Set(ROUND382_FEATURES).size, 25);
  for (const feature of ROUND382_FEATURES) assert.equal((ROUND381_FEATURES as readonly string[]).includes(feature), false, feature);
  const libDir = path.join(__dirname, "../src/lib/crmv4");
  for (const feature of ROUND382_FEATURES) {
    const needle = `"${feature}"`;
    for (const file of fs.readdirSync(libDir)) {
      if (!file.endsWith(".ts") || file === "round382.ts") continue;
      const body = fs.readFileSync(path.join(libDir, file), "utf8");
      assert.equal(body.includes(needle), false, `${feature} in ${file}`);
    }
  }
  assert.equal(pigmentPoint(" ochre "), "ochre");
  assert.equal(pigmentPoint("brass"), "");
  assert.equal(veilDay("3"), 3);
  assert.equal(veilDay(5), 5);
  assert.equal(veilDay(8), 8);
  assert.equal(veilDay(13), 13);
  assert.equal(veilDay("15"), null);
  assert.equal(veilDay("12"), null);
  assert.equal(filmCount("1"), 1);
  assert.equal(filmCount(3), 3);
  assert.equal(filmCount("5"), 5);
  assert.equal(filmCount("2"), null);
  assert.equal(filmCount("4"), null);
  assert.equal(veilGround("ivory"), "IVORY");
  assert.equal(veilGround("graphite"), "GRAPHITE");
  assert.equal(veilGround("champagne"), "CHAMPAGNE");
  assert.equal(veilGround("gold"), "");
  assert.equal(pigmentWarm("ochre"), true);
  assert.equal(pigmentWarm("VINE"), true);
  assert.equal(pigmentWarm("bone"), false);
  assert.equal(pigmentCool("bone"), true);
  assert.equal(pigmentCool("lamp"), true);
  assert.equal(pigmentCool("ochre"), false);
  assert.equal(pigmentBand("ochre"), "first");
  assert.equal(pigmentBand("vine"), "second");
  assert.equal(pigmentBand("bone"), "third");
  assert.equal(pigmentBand("lamp"), "fourth");
  assert.equal(pigmentGap("ochre", "lamp"), 3);
  assert.equal(graphiteQuiet("graphite"), true);
  assert.equal(graphiteQuiet("ivory"), false);
  assert.equal(graphiteQuiet("champagne"), false);
  assert.equal(midFilm(3), true);
  assert.equal(midFilm(1), false);
  assert.equal(fullFilm(5), true);
  assert.equal(fullFilm(3), false);
  assert.equal(activePigment("warm"), "warm");
  assert.equal(activeDay("8"), "8");
  assert.equal(activeDay("12"), "all");
  assert.equal(activeFilm("5"), "5");
  assert.equal(activeFilm("9"), "all");
  assert.equal(activeGround("ivory", ["IVORY"]), "IVORY");
  assert.equal(suggestPigment(4), "ochre");
  assert.equal(suggestPigment(10), "vine");
  assert.equal(suggestPigment(14), "bone");
  assert.equal(suggestPigment(20), "lamp");
  assert.equal(suggestVeilDay([], 1), 3);
  assert.equal(suggestVeilDay([], 6), 5);
  assert.equal(suggestVeilDay([], 11), 5);
  assert.equal(suggestVeilDay([], 14), 8);
  assert.equal(suggestVeilDay([], 19), 13);
  assert.equal(suggestVeilGround([]), "IVORY");
  assert.equal(moveVeilFocus(0, 3, 1), 1);
  assert.equal(moveVeilFocus(0, 3, -1), 2);

  const saved = addVeil([], { id: "g1", title: "Ochre veil", hand: "Ada", tool: "ochre", depth: 3, ground: "ivory", coat: 1, tags: "v d x" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].ground, "IVORY");
  assert.equal(saved[0].tags.join(""), "vd");
  assert.equal(saved[0].audit, "save");
  assert.equal(saved[0].coat, 1);
  assert.equal(addVeil(saved, { title: "Ochre veil" }).length, 1);
  const lamp = rule({ id: "n1", title: "Lamp veil", tool: "lamp", coat: 1 });
  assert.equal(overdueVeil(lamp), true);
  assert.equal(reminderVeils([lamp])[0], "Lamp veil");
  assert.equal(idleVeil(rule({ id: "i1", title: "Idle", depth: 3, coat: 1 })), true);
  assert.equal(briskVeil(rule({ id: "b1", title: "Brisk", ground: "CHAMPAGNE", depth: 13, coat: 5 })), true);
  assert.equal(restingVeil(rule({ id: "r1", title: "Rest", tool: "lamp", ground: "IVORY", depth: 5 })), true);
  assert.equal(lateVeil(rule({ id: "l1", title: "Late", tool: "ochre" }), "lamp"), true);
  assert.equal(lateVeil(rule({ id: "l2", title: "Held", tool: "ochre", raised: true }), "lamp"), false);
  assert.equal(fairPainter([rule({ id: "a", title: "A", hand: "Ada" }), rule({ id: "b", title: "B", hand: "Bea", raised: true })], "Ada,Bea"), "Bea");
  const timeline = veilTimeline([rule({ id: "t", title: "Ten", depth: 3 })]);
  assert.equal(timeline[0].depth, 3);
  assert.equal(timeline[0].titles[0], "Ten");
  const views = readVeilViews([{ id: "v1", name: "Lamp deck", tray: "store", query: "veil", hand: "Ada", ground: "GRAPHITE", tool: "cool", depth: "13", coat: "5" }]);
  assert.equal(views[0].tray, "store");
  assert.equal(views[0].tool, "cool");
  assert.equal(views[0].depth, "13");
  assert.equal(views[0].coat, "5");
  assert.equal(dropVeilView(views, "v1").length, 0);
  assert.equal(addVeilView(views, views[0]).length, 1);

  const now = Date.parse("2026-11-26T12:00:00Z");
  assert.equal(bolLane("KEEP", now), "firm");
  assert.equal(bolLane("please keep the desk", now), "firm");
  assert.equal(bolLane(true, now), "firm");
  assert.equal(bolLane(false, now), "plain");
  assert.equal(bolLane("COOL", now), "bench");
  assert.equal(bolLane("SOON", now), "wait");
  assert.equal(bolLane("COLD", now), "gone");
  assert.equal(bolLane("PAIR", now), "twin");
  assert.equal(bolLane("TR^90", now), "twin");
  assert.equal(bolLane("^9055", now), "firm");
  assert.equal(bolLane("still keeper", now), "hush");
  assert.equal(bolLane("ext|12", now), "route");
  assert.equal(bolLane("ABCD", now), "short");
  assert.equal(bolLane("12night", now), "tally");
  assert.equal(bolLane("5551112", now), "bench");
  assert.equal(bolLane("55511122", now), "tally");
  assert.equal(bolLane("AUSTRALIAXXXXXX", now), "vowel");
  assert.equal(bolLane("AUSTRALIAXXXXXXX", now), "long");
  assert.equal(bolLane("Orange", now), "vowel");
  assert.equal(bolLane("Spain", now), "plain");
  assert.equal(bolLane("Desk", now), "firm");
  assert.equal(bolLane("2026-11-26T08:00:00Z", now), "firm");
  assert.equal(bolLane("2026-11-25T08:00:00Z", now), "bench");
  assert.equal(bolLane("2026-11-22T00:00:00Z", now), "wait");
  assert.equal(bolLane("2026-11-01T08:00:00Z", now), "gone");
  assert.equal(bolLane({ retentionStatus: "KEEP" }, now), "firm");
  assert.equal(bolLane({ name: "Ada" }, now), "");
  assert.equal(bolLane({ retentionStatus: "KEEP", amount: 1 }, now), "");
  assert.equal(bolHue("KEEP", now), "gilt");
  assert.equal(bolHue("COOL", now), "ink");
  assert.equal(bolHue("ABCD", now), "pearl");
  assert.equal(bolKeep("KEEP", now), true);
  assert.equal(bolHush("still keeper", now), true);
  assert.equal(bolSoon("SOON", now), true);
  assert.equal(bolLost("COLD", now), true);
  assert.equal(bolCool("COOL", now), true);
  assert.equal(bolPair("TR^90", now), true);
  assert.equal(bolRoute("ext|12", now), true);
  assert.equal(bolShort("ABCD", now), true);
  assert.equal(bolLongLane("AUSTRALIAXXXXXXX", now), true);
  assert.equal(bolTallyLane("12night", now), true);
  assert.equal(bolVowelLane("Orange", now), true);
  assert.equal(bolBare("Spain", now), true);
  assert.equal(bolOpen(""), true);
  assert.equal(bolBrief("ABCD", now), true);
  assert.equal(bolBrief("KEEP", now), false);
  assert.equal(bolLength("ABCD"), 4);
  assert.equal(bolEven("KEEP"), true);
  assert.equal(bolDigit("12night"), true);
  assert.equal(bolVowel("Orange"), true);
  assert.equal(bolLower("spain"), true);
  assert.equal(bolUpper("AUSTRALIA"), true);
  assert.equal(bolUpper("AUSTRIA"), false);
  assert.equal(bolUpper("SPAIN"), false);
  assert.equal(bolUpper("TR"), false);
  assert.equal(bolFirst("Spain"), true);
  assert.equal(bolSpace("new spain"), true);
  assert.equal(bolHeld("AUSTRALIAXXXXXXX"), true);
  assert.equal(bolCopy("KEEP"), "KEEP");
  const rows: BolRow[] = [
    { id: "1", label: "Ada", code: "KEEP" },
    { id: "2", label: "Bea", code: "ABCD" },
  ];
  assert.equal(leadingBol(rows), "firm");
  assert.equal(leadingBolHue(rows), "gilt");
  assert.match(bolLanesCsv(rows), /firm,1/);
  assert.match(bolRowsCsv(rows, ["1"]), /Ada,KEEP/);
  assert.match(bolRowsCsv(rows, ["1"]), /,1$/m);

  assert.equal(crmv4Text("en", "vrdTitle"), ROUND382_COPY.en.vrdTitle);
  assert.equal(crmv4Text("tr", "bolTitle"), ROUND382_COPY.tr.bolTitle);
  assert.equal(crmv4Text("de", "vrdHint"), ROUND382_COPY.de.vrdHint);
  assert.equal(crmv4Text("ru", "winIntarsiaKicker"), ROUND382_COPY.ru.winIntarsiaKicker);
  assert.equal(crmv4Text("ar", "smsPalimpsestLead"), ROUND382_COPY.ar.smsPalimpsestLead);
  const keys = Object.keys(ROUND382_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND382_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-verdaccio/);
  assert.match(css, /\.c4-bole/);
  assert.match(css, /\.c4-verdaccio-column/);
  assert.match(css, /\.c4-bole-column/);
  assert.match(css, /\.c4-sms-palimpsest/);
  assert.match(css, /\.c4-win-intarsia/);
  assert.match(css, /\.c4-sms-palimpsest-mast/);
  assert.match(css, /\.c4-win-intarsia-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round382.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("babevel"), false);
  assert.match(viewFile, /retentionStatus:/);
  assert.match(viewFile, /veilCsv/);
  assert.match(viewFile, /bolRowsCsv/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "x"/);
  assert.match(viewFile, /event\.key === "a"/);
  assert.match(viewFile, /event\.key === "c"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=24&meta=0/);
  assert.match(viewFile, /data-cards/);
  assert.match(viewFile, /data-plates/);
  assert.match(viewFile, /data-names/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestVeilGround/);
  assert.match(viewFile, /c4-bole-search/);
  assert.match(viewFile, /veilTimeline/);
  assert.match(viewFile, /c4-verdaccio-notices/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "vrd"/);
  assert.match(app, /view === "bol"/);
  const desk = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round13.tsx"), "utf8");
  assert.match(desk, /c4-sms-palimpsest/);
  assert.match(desk, /c4-sms-palimpsest-mast/);
  assert.match(desk, /data-logo="mono"/);
  assert.match(desk, /smsPalimpsestKicker/);
  assert.match(desk, /smsPalimpsestLead/);
  assert.match(desk, /data-sms-palimpsest/);
  assert.match(desk, /c4-win-intarsia/);
  assert.match(desk, /c4-win-intarsia-mast/);
  assert.match(desk, /winIntarsiaKicker/);
  assert.match(desk, /winIntarsiaLead/);
  assert.match(desk, /data-win-intarsia/);
  const namedKeys = `${viewFile}\n${desk}`.match(/"(vrd|bol|smsPalimpsest|winIntarsia)[A-Za-z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND382_COPY.en[key as keyof typeof ROUND382_COPY.en], "string", key);
  console.log("crmv4 round382 tests passed");
}

main();
