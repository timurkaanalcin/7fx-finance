/**
 * Scagliola slabs, vein combs, the ivory segment panel, and the graphite anniversary rail.
 * Run: TZ=UTC npx tsx tests/crmv4-round384.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND384_COPY } from "../src/lib/crmv4/copy-round384";
import { ROUND383_FEATURES } from "../src/lib/crmv4/round383";
import {
  ROUND384_FEATURES,
  activeDay,
  activeFilm,
  activeGround,
  activeSpatula,
  addSlab,
  addSlabView,
  briskSlab,
  dropSlabView,
  fairHand,
  filmCount,
  fullFilm,
  graphiteQuiet,
  idleSlab,
  lateSlab,
  leadingVen,
  leadingVenHue,
  venBare,
  venBrief,
  venCool,
  venCopy,
  venDigit,
  venEven,
  venFirst,
  venHeld,
  venHue,
  venHush,
  venKeep,
  venLane,
  venLanesCsv,
  venLength,
  venLongLane,
  venLost,
  venLower,
  venOpen,
  venPair,
  venRoute,
  venRowsCsv,
  venShort,
  venSoon,
  venSpace,
  venTallyLane,
  venUpper,
  venVowel,
  venVowelLane,
  midFilm,
  moveSlabFocus,
  overdueSlab,
  slabDay,
  slabGround,
  slabTimeline,
  readSlabViews,
  reminderSlabs,
  restingSlab,
  spatulaBand,
  spatulaCool,
  spatulaGap,
  spatulaPoint,
  spatulaWarm,
  suggestSlabDay,
  suggestSlabGround,
  suggestSpatula,
  type VenRow,
  type Slab,
} from "../src/lib/crmv4/round384";

function rule(partial: Partial<Slab> & { id: string; title: string }): Slab {
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
  assert.equal(ROUND384_FEATURES.length, 25);
  assert.equal(new Set(ROUND384_FEATURES).size, 25);
  for (const feature of ROUND384_FEATURES) assert.equal((ROUND383_FEATURES as readonly string[]).includes(feature), false, feature);
  const libDir = path.join(__dirname, "../src/lib/crmv4");
  for (const feature of ROUND384_FEATURES) {
    const needle = `"${feature}"`;
    for (const file of fs.readdirSync(libDir)) {
      if (!file.endsWith(".ts") || file === "round384.ts") continue;
      const body = fs.readFileSync(path.join(libDir, file), "utf8");
      assert.equal(body.includes(needle), false, `${feature} in ${file}`);
    }
  }
  assert.equal(spatulaPoint(" spatula "), "spatula");
  assert.equal(spatulaPoint("brass"), "");
  assert.equal(slabDay("5"), 5);
  assert.equal(slabDay(7), 7);
  assert.equal(slabDay(11), 11);
  assert.equal(slabDay(18), 18);
  assert.equal(slabDay("8"), null);
  assert.equal(slabDay("13"), null);
  assert.equal(filmCount("1"), 1);
  assert.equal(filmCount(3), 3);
  assert.equal(filmCount("7"), 7);
  assert.equal(filmCount("2"), null);
  assert.equal(filmCount("4"), null);
  assert.equal(slabGround("ivory"), "IVORY");
  assert.equal(slabGround("graphite"), "GRAPHITE");
  assert.equal(slabGround("champagne"), "CHAMPAGNE");
  assert.equal(slabGround("gold"), "");
  assert.equal(spatulaWarm("spatula"), true);
  assert.equal(spatulaWarm("FLOAT"), true);
  assert.equal(spatulaWarm("comb"), false);
  assert.equal(spatulaCool("comb"), true);
  assert.equal(spatulaCool("burnish"), true);
  assert.equal(spatulaCool("spatula"), false);
  assert.equal(spatulaBand("spatula"), "first");
  assert.equal(spatulaBand("float"), "second");
  assert.equal(spatulaBand("comb"), "third");
  assert.equal(spatulaBand("burnish"), "fourth");
  assert.equal(spatulaGap("spatula", "burnish"), 3);
  assert.equal(graphiteQuiet("graphite"), true);
  assert.equal(graphiteQuiet("ivory"), false);
  assert.equal(graphiteQuiet("champagne"), false);
  assert.equal(midFilm(3), true);
  assert.equal(midFilm(1), false);
  assert.equal(fullFilm(7), true);
  assert.equal(fullFilm(3), false);
  assert.equal(activeSpatula("warm"), "warm");
  assert.equal(activeDay("5"), "5");
  assert.equal(activeDay("8"), "all");
  assert.equal(activeFilm("7"), "7");
  assert.equal(activeFilm("9"), "all");
  assert.equal(activeGround("graphite", ["GRAPHITE"]), "GRAPHITE");
  assert.equal(suggestSpatula(4), "spatula");
  assert.equal(suggestSpatula(8), "float");
  assert.equal(suggestSpatula(14), "comb");
  assert.equal(suggestSpatula(20), "burnish");
  assert.equal(suggestSlabDay([], 1), 5);
  assert.equal(suggestSlabDay([], 6), 7);
  assert.equal(suggestSlabDay([], 12), 11);
  assert.equal(suggestSlabDay([], 18), 18);
  assert.equal(suggestSlabGround([]), "GRAPHITE");
  assert.equal(moveSlabFocus(0, 3, 1), 1);
  assert.equal(moveSlabFocus(0, 3, -1), 2);

  const saved = addSlab([], { id: "g1", title: "Float slab", hand: "Ada", tool: "float", depth: 7, ground: "graphite", coat: 3, tags: "s c x" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].ground, "GRAPHITE");
  assert.equal(saved[0].tags.join(""), "sc");
  assert.equal(saved[0].audit, "save");
  assert.equal(saved[0].coat, 3);
  assert.equal(addSlab(saved, { title: "Float slab" }).length, 1);
  const comb = rule({ id: "n1", title: "Comb slab", tool: "comb", coat: 1 });
  assert.equal(overdueSlab(comb), true);
  assert.equal(reminderSlabs([comb])[0], "Comb slab");
  assert.equal(idleSlab(rule({ id: "i1", title: "Idle", depth: 5, coat: 1 })), true);
  assert.equal(briskSlab(rule({ id: "b1", title: "Brisk", ground: "IVORY", depth: 18, coat: 7 })), true);
  assert.equal(restingSlab(rule({ id: "r1", title: "Rest", tool: "burnish", ground: "GRAPHITE", depth: 7 })), true);
  assert.equal(lateSlab(rule({ id: "l1", title: "Late", tool: "spatula" }), "burnish"), true);
  assert.equal(lateSlab(rule({ id: "l2", title: "Held", tool: "spatula", raised: true }), "burnish"), false);
  assert.equal(fairHand([rule({ id: "a", title: "A", hand: "Ada" }), rule({ id: "b", title: "B", hand: "Bea", raised: true })], "Ada,Bea"), "Bea");
  const timeline = slabTimeline([rule({ id: "t", title: "Ten", depth: 5 })]);
  assert.equal(timeline[0].depth, 5);
  assert.equal(timeline[0].titles[0], "Ten");
  const views = readSlabViews([{ id: "v1", name: "Comb deck", tray: "store", query: "slab", hand: "Ada", ground: "GRAPHITE", tool: "cool", depth: "18", coat: "7" }]);
  assert.equal(views[0].tray, "store");
  assert.equal(views[0].tool, "cool");
  assert.equal(views[0].depth, "18");
  assert.equal(views[0].coat, "7");
  assert.equal(dropSlabView(views, "v1").length, 0);
  assert.equal(addSlabView(views, views[0]).length, 1);

  const now = Date.parse("2026-11-26T12:00:00Z");
  assert.equal(venLane("SOLD", now), "firm");
  assert.equal(venLane("please hold the plate", now), "long");
  assert.equal(venLane(true, now), "firm");
  assert.equal(venLane(false, now), "plain");
  assert.equal(venLane("SOFT", now), "bench");
  assert.equal(venLane("NEXT", now), "wait");
  assert.equal(venLane("LOST", now), "gone");
  assert.equal(venLane("JOIN", now), "twin");
  assert.equal(venLane("TR^90", now), "twin");
  assert.equal(venLane("^9055", now), "firm");
  assert.equal(venLane("^90", now), "firm");
  assert.equal(venLane("^90555", now), "twin");
  assert.equal(venLane("sealed note", now), "hush");
  assert.equal(venLane("still proof", now), "plain");
  assert.equal(venLane("ext|12", now), "route");
  assert.equal(venLane("ABCDEF", now), "short");
  assert.equal(venLane("12night", now), "tally");
  assert.equal(venLane("1234", now), "bench");
  assert.equal(venLane("5551112", now), "tally");
  assert.equal(venLane("Apricot", now), "vowel");
  assert.equal(venLane("Graphite", now), "plain");
  assert.equal(venLane("Yellow", now), "short");
  assert.equal(venLane("sale desk", now), "firm");
  assert.equal(venLane("COPPERPLATEXXX", now), "long");
  assert.equal(venLane("2026-11-26T08:00:00Z", now), "firm");
  assert.equal(venLane("2026-11-25T06:00:00Z", now), "bench");
  assert.equal(venLane("2026-11-22T00:00:00Z", now), "wait");
  assert.equal(venLane("2026-11-01T08:00:00Z", now), "gone");
  assert.equal(venLane({ saleStatus: "SOLD" }, now), "firm");
  assert.equal(venLane({ name: "Ada" }, now), "");
  assert.equal(venLane({ saleStatus: "SOLD", amount: 1 }, now), "");
  assert.equal(venHue("SOLD", now), "gilt");
  assert.equal(venHue("SOFT", now), "ink");
  assert.equal(venHue("ABCDEF", now), "pearl");
  assert.equal(venKeep("SOLD", now), true);
  assert.equal(venHush("sealed note", now), true);
  assert.equal(venSoon("NEXT", now), true);
  assert.equal(venLost("LOST", now), true);
  assert.equal(venCool("SOFT", now), true);
  assert.equal(venPair("TR^90", now), true);
  assert.equal(venRoute("ext|12", now), true);
  assert.equal(venShort("ABCDEF", now), true);
  assert.equal(venLongLane("COPPERPLATEXXX", now), true);
  assert.equal(venTallyLane("12night", now), true);
  assert.equal(venVowelLane("Apricot", now), true);
  assert.equal(venBare("Graphite", now), true);
  assert.equal(venOpen(""), true);
  assert.equal(venBrief("ABCDEF", now), true);
  assert.equal(venBrief("SOLD", now), false);
  assert.equal(venLength("ABCDEF"), 6);
  assert.equal(venEven("SOLD"), true);
  assert.equal(venDigit("12night"), true);
  assert.equal(venVowel("Orange"), true);
  assert.equal(venVowel("Yellow"), false);
  assert.equal(venLower("spain"), true);
  assert.equal(venUpper("AUSTRALIA"), true);
  assert.equal(venUpper("SPAIN"), false);
  assert.equal(venUpper("TR"), false);
  assert.equal(venFirst("Spain"), true);
  assert.equal(venSpace("new spain"), true);
  assert.equal(venHeld("COPPERPLATEXXX"), true);
  assert.equal(venCopy("SOLD"), "SOLD");
  const rows: VenRow[] = [
    { id: "1", label: "Ada", code: "SOLD" },
    { id: "2", label: "Bea", code: "ABCDEF" },
  ];
  assert.equal(leadingVen(rows), "firm");
  assert.equal(leadingVenHue(rows), "gilt");
  assert.match(venLanesCsv(rows), /firm,1/);
  assert.match(venRowsCsv(rows, ["1"]), /Ada,SOLD/);
  assert.match(venRowsCsv(rows, ["1"]), /,1$/m);

  assert.equal(crmv4Text("en", "scgTitle"), ROUND384_COPY.en.scgTitle);
  assert.equal(crmv4Text("tr", "venTitle"), ROUND384_COPY.tr.venTitle);
  assert.equal(crmv4Text("de", "scgHint"), ROUND384_COPY.de.scgHint);
  assert.equal(crmv4Text("ru", "anniversaryRailKicker"), ROUND384_COPY.ru.anniversaryRailKicker);
  assert.equal(crmv4Text("ar", "segmentPanelLead"), ROUND384_COPY.ar.segmentPanelLead);
  const keys = Object.keys(ROUND384_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND384_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-scagliola/);
  assert.match(css, /\.c4-veincomb/);
  assert.match(css, /\.c4-scagliola-column/);
  assert.match(css, /\.c4-veincomb-column/);
  assert.match(css, /\.c4-segment-panel/);
  assert.match(css, /\.c4-anniversary-rail/);
  assert.match(css, /\.c4-segment-panel-mast/);
  assert.match(css, /\.c4-anniversary-rail-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round384.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("babevel"), false);
  assert.match(viewFile, /saleStatus:/);
  assert.match(viewFile, /slabCsv/);
  assert.match(viewFile, /venRowsCsv/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "x"/);
  assert.match(viewFile, /event\.key === "a"/);
  assert.match(viewFile, /event\.key === "c"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=24&meta=0/);
  assert.match(viewFile, /data-slabs/);
  assert.match(viewFile, /data-veins/);
  assert.match(viewFile, /data-names/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestSlabGround/);
  assert.match(viewFile, /c4-veincomb-search/);
  assert.match(viewFile, /slabTimeline/);
  assert.match(viewFile, /c4-scagliola-notices/);
  assert.match(viewFile, /from "@\/lib\/crmv4\/round384"/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "scg"/);
  assert.match(app, /view === "ven"/);
  const desk = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round13.tsx"), "utf8");
  assert.match(desk, /c4-segment-panel/);
  assert.match(desk, /c4-segment-panel-mast/);
  assert.match(desk, /data-logo="mono"/);
  assert.match(desk, /segmentPanelKicker/);
  assert.match(desk, /segmentPanelLead/);
  assert.match(desk, /data-segment-panel/);
  assert.match(desk, /c4-anniversary-rail/);
  assert.match(desk, /c4-anniversary-rail-mast/);
  assert.match(desk, /anniversaryRailKicker/);
  assert.match(desk, /anniversaryRailLead/);
  assert.match(desk, /data-anniversary-rail/);
  const namedKeys = `${viewFile}\n${desk}`.match(/"(scg|ven|segmentPanel|anniversaryRail)[A-Za-z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND384_COPY.en[key as keyof typeof ROUND384_COPY.en], "string", key);
  console.log("crmv4 round384 tests passed");
}

main();
