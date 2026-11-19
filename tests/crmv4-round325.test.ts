/**
 * Grasshopper rules, volvelle plates, the ivory interlude schola, and the graphite vintage piscina.
 * Run: TZ=UTC npx tsx tests/crmv4-round325.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND325_COPY } from "../src/lib/crmv4/copy-round325";
import {
  ROUND325_FEATURES,
  activeArc,
  activeDrop,
  activeInk,
  activePart,
  addGrasshopper,
  briskGrasshopper,
  dropGrasshopperView,
  grasshopperArc,
  grasshopperBand,
  grasshopperDrop,
  grasshopperGap,
  grasshopperInk,
  grasshopperInner,
  grasshopperOuter,
  grasshopperPart,
  grasshopperTimeline,
  fairSmith,
  fullArc,
  idleGrasshopper,
  lateGrasshopper,
  leadingVolvelle,
  moveGrasshopperFocus,
  overdueGrasshopper,
  pairArc,
  quietInk,
  readGrasshopperViews,
  reminderGrasshopperRules,
  restingGrasshopper,
  suggestDrop,
  suggestInk,
  suggestPart,
  volvelleBanner,
  volvelleBrief,
  volvelleCapital,
  volvelleCardinal,
  volvelleCoast,
  volvelleDigit,
  volvelleEven,
  volvelleFigure,
  volvelleFirst,
  volvelleHue,
  volvelleHyphen,
  volvelleLane,
  volvelleLanesCsv,
  volvelleLength,
  volvelleLower,
  volvelleOpen,
  volvelleRowsCsv,
  volvelleSpace,
  volvelleSplit,
  volvelleState,
  volvelleTail,
  volvelleTwin,
  volvelleUpper,
  volvelleVowel,
  type Grasshopper,
  type VolvelleRow,
} from "../src/lib/crmv4/round325";

function rule(partial: Partial<Grasshopper> & { id: string; title: string }): Grasshopper {
  return {
    note: "",
    smith: "",
    part: "",
    drop: null,
    ink: "",
    arc: 5,
    tags: [],
    sprung: false,
    cocked: false,
    cased: false,
    starred: false,
    audit: "",
    ...partial,
  };
}

function main() {
  assert.equal(ROUND325_FEATURES.length, 25);
  assert.equal(ROUND325_FEATURES.includes("desk-volvelle"), true);
  assert.equal(ROUND325_FEATURES.includes("span-sla"), true);
  assert.equal(ROUND325_FEATURES.includes("fair-smith"), true);
  assert.equal(ROUND325_FEATURES.includes("case"), true);
  assert.equal(ROUND325_FEATURES.includes("notice-center"), true);
  assert.equal(ROUND325_FEATURES.includes("quick-search"), true);
  assert.equal(ROUND325_FEATURES.includes("beat-timeline"), true);
  assert.equal(grasshopperPart(" pallet "), "pallet");
  assert.equal(grasshopperPart("brass"), "");
  assert.equal(grasshopperDrop("4"), 4);
  assert.equal(grasshopperDrop(8), 8);
  assert.equal(grasshopperDrop(12), 12);
  assert.equal(grasshopperDrop(16), 16);
  assert.equal(grasshopperDrop("2"), null);
  assert.equal(grasshopperDrop("6"), null);
  assert.equal(grasshopperArc("5"), 5);
  assert.equal(grasshopperArc(10), 10);
  assert.equal(grasshopperArc("15"), 15);
  assert.equal(grasshopperArc("4"), null);
  assert.equal(grasshopperArc("12"), null);
  assert.equal(grasshopperInk("gilt"), "GILT");
  assert.equal(grasshopperInk("ivory"), "IVORY");
  assert.equal(grasshopperInk("graphite"), "GRAPHITE");
  assert.equal(grasshopperInk("hot"), "");
  assert.equal(grasshopperInner("pallet"), true);
  assert.equal(grasshopperInner("ARBOR"), true);
  assert.equal(grasshopperInner("tooth"), false);
  assert.equal(grasshopperOuter("tooth"), true);
  assert.equal(grasshopperOuter("cheek"), true);
  assert.equal(grasshopperOuter("pallet"), false);
  assert.equal(grasshopperBand("pallet"), "arm");
  assert.equal(grasshopperBand("arbor"), "shaft");
  assert.equal(grasshopperBand("tooth"), "cog");
  assert.equal(grasshopperBand("cheek"), "jaw");
  assert.equal(grasshopperBand(""), "");
  assert.equal(grasshopperGap("pallet", "cheek"), 3);
  assert.equal(grasshopperGap("tooth", "nope"), null);
  assert.equal(quietInk("ivory"), true);
  assert.equal(quietInk("graphite"), true);
  assert.equal(quietInk("gilt"), false);
  assert.equal(pairArc(10), true);
  assert.equal(pairArc(5), false);
  assert.equal(fullArc("15"), true);
  assert.equal(fullArc(10), false);
  assert.equal(activePart("inner"), "inner");
  assert.equal(activePart("tooth"), "tooth");
  assert.equal(activePart("gold"), "all");
  assert.equal(activeDrop("16"), "16");
  assert.equal(activeDrop("4"), "4");
  assert.equal(activeDrop("2"), "all");
  assert.equal(activeArc("5"), "5");
  assert.equal(activeArc("4"), "all");
  assert.equal(activeInk("graphite", ["GRAPHITE"]), "GRAPHITE");
  assert.equal(activeInk("hot", ["GRAPHITE"]), "all");
  assert.equal(moveGrasshopperFocus(0, 3, -1), 2);
  assert.equal(moveGrasshopperFocus(0, 0, 1), 0);

  const cards = [
    rule({ id: "a", title: "Ada", part: "tooth", arc: 5, smith: "Ned" }),
    rule({ id: "b", title: "Bea", part: "pallet", ink: "GRAPHITE", drop: 16, arc: 15, smith: "Ned" }),
    rule({ id: "c", title: "Cara", part: "cheek", ink: "GRAPHITE", drop: 8, smith: "Ida" }),
  ];
  assert.equal(overdueGrasshopper(cards[0]), true);
  assert.equal(briskGrasshopper(rule({ id: "g", title: "Gilt", ink: "GILT", drop: 16, arc: 15 })), true);
  assert.equal(briskGrasshopper(cards[1]), false);
  assert.equal(restingGrasshopper(rule({ id: "r", title: "Rest", part: "cheek", ink: "IVORY", drop: 8 })), true);
  assert.equal(restingGrasshopper(cards[2]), false);
  assert.equal(idleGrasshopper(rule({ id: "i", title: "Idle", drop: 4, arc: 5 })), true);
  assert.equal(lateGrasshopper(cards[1], "cheek"), true);
  assert.equal(lateGrasshopper(cards[1], "pallet"), false);
  assert.deepEqual(reminderGrasshopperRules(cards), ["Ada", "Cara"]);
  assert.equal(suggestInk([]), "IVORY");
  assert.equal(suggestInk(cards), "IVORY");
  assert.equal(suggestInk([rule({ id: "v", title: "Ivory", ink: "IVORY" })]), "GILT");
  assert.equal(suggestDrop([], 4), 4);
  assert.equal(suggestDrop([], 8), 8);
  assert.equal(suggestDrop([], 14), 12);
  assert.equal(suggestDrop([], 20), 16);
  assert.equal(suggestDrop(cards, 6), 4);
  assert.equal(suggestPart(4), "pallet");
  assert.equal(suggestPart(14), "cheek");
  assert.equal(fairSmith(cards, "Ida,Ned"), "Ida");
  const saved = addGrasshopper([], { title: "Dora", part: "tooth", ink: "ivory", drop: "8", arc: "10", tags: "g h z" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].ink, "IVORY");
  assert.equal(saved[0].drop, 8);
  assert.equal(saved[0].arc, 10);
  assert.equal(saved[0].tags.join(""), "gh");
  assert.equal(saved[0].audit, "save");
  assert.equal(addGrasshopper(saved, { title: "Dora" }).length, 1);
  assert.equal(addGrasshopper([], { title: "Eve" })[0].arc, 5);
  assert.equal(dropGrasshopperView([{ id: "v", name: "Morning", tray: "bench", query: "", smith: "", ink: "all", part: "all", drop: "all", arc: "all" }], "v").length, 0);
  assert.equal(readGrasshopperViews([{ id: "v", name: "Morning", tray: "cock" }])[0].tray, "cock");

  assert.equal(volvelleCardinal("AM"), true);
  assert.equal(volvelleCardinal({ desk: true }), true);
  assert.equal(volvelleSplit({ desk: false }), true);
  assert.equal(volvelleCardinal({ desk: "coast" }), false);
  assert.equal(volvelleHyphen("re-check"), true);
  assert.equal(volvelleHyphen("re/check"), false);
  assert.equal(volvelleSplit("needs review"), true);
  assert.equal(volvelleBrief("NET"), true);
  assert.equal(volvelleBrief("US"), false);
  assert.equal(volvelleBanner("VeryLongDeskNameXX"), true);
  assert.equal(volvelleBanner("Netherlands"), false);
  assert.equal(volvelleLane("US"), "coast");
  assert.equal(volvelleLane("NET"), "brief");
  assert.equal(volvelleFigure("10.1.1.1"), true);
  assert.equal(volvelleLane("10.1.1.1"), "figure");
  assert.equal(volvelleTwin("Letter"), true);
  assert.equal(volvelleLane("Amsterdam"), "coast");
  assert.equal(volvelleLane("Paris"), "coast");
  assert.equal(volvelleCoast("Paris"), true);
  assert.equal(volvelleOpen(""), true);
  assert.equal(volvelleOpen({ desk: "" }), true);
  assert.equal(volvelleState({ name: "Ada" }), "");
  assert.equal(volvelleState({ desk: "Paris", balance: 1 }), "");
  assert.equal(volvelleHue("AM"), "champagne");
  assert.equal(volvelleHue("needs review"), "graphite");
  assert.equal(volvelleHue("Letter"), "ivory");
  assert.equal(volvelleLength("hold"), 4);
  assert.equal(volvelleEven("hold"), true);
  assert.equal(volvelleFirst("Paris"), true);
  assert.equal(volvelleSpace("needs review"), true);
  assert.equal(volvelleVowel("Amsterdam"), true);
  assert.equal(volvelleDigit("Room4"), true);
  assert.equal(volvelleCapital("PARIS"), true);
  assert.equal(volvelleLower("paris"), true);
  assert.equal(volvelleUpper("RETENTION"), true);
  assert.equal(volvelleUpper("NET"), false);
  assert.equal(volvelleTail("Room4"), true);
  const marks: VolvelleRow[] = [
    { id: "1", label: "Ada", code: "AM" },
    { id: "2", label: "Bea", code: "PM" },
    { id: "3", label: "Cara", code: "Paris" },
  ];
  assert.equal(leadingVolvelle(marks), "cardinal");
  assert.match(volvelleLanesCsv(marks), /cardinal,2/);
  assert.match(volvelleRowsCsv(marks, ["1"]), /Ada,AM/);
  assert.match(grasshopperTimeline(cards).map((lane) => lane.drop).join(","), /16|8/);
  assert.equal(crmv4Text("tr", "ghpTitle"), ROUND325_COPY.tr.ghpTitle);
  assert.equal(crmv4Text("de", "vvlTitle"), ROUND325_COPY.de.vvlTitle);
  assert.equal(crmv4Text("ru", "itlScholaKicker"), ROUND325_COPY.ru.itlScholaKicker);
  assert.equal(crmv4Text("ar", "vntPiscinaLead"), ROUND325_COPY.ar.vntPiscinaLead);
  const keys = Object.keys(ROUND325_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND325_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-grasshopper/);
  assert.match(css, /\.c4-volvelle/);
  assert.match(css, /\.c4-grasshopper-column/);
  assert.match(css, /\.c4-volvelle-column/);
  assert.match(css, /\.c4-itl-schola/);
  assert.match(css, /\.c4-vnt-piscina/);
  assert.match(css, /\.c4-itl-schola-mast/);
  assert.match(css, /\.c4-vnt-piscina-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round325.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /desk/);
  assert.match(viewFile, /grasshopperCsv/);
  assert.match(viewFile, /volvelleRowsCsv/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "x"/);
  assert.match(viewFile, /event\.key === "a"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=24&meta=0&role=TRADER/);
  assert.match(viewFile, /data-cards/);
  assert.match(viewFile, /data-plates/);
  assert.match(viewFile, /data-names/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestInk/);
  assert.match(viewFile, /c4-volvelle-search/);
  assert.match(viewFile, /grasshopperTimeline/);
  assert.match(viewFile, /c4-grasshopper-notices/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "ghp"/);
  assert.match(app, /view === "vvl"/);
  const host = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round145.tsx"), "utf8");
  assert.match(host, /c4-itl-schola/);
  assert.match(host, /c4-itl-schola-mast/);
  assert.match(host, /data-logo="mono"/);
  assert.match(host, /itlScholaKicker/);
  assert.match(host, /itlScholaLead/);
  assert.match(host, /data-interlude/);
  assert.equal(host.includes("amount"), false);
  assert.match(host, /c4-vnt-piscina/);
  assert.match(host, /c4-vnt-piscina-mast/);
  assert.match(host, /vntPiscinaKicker/);
  assert.match(host, /vntPiscinaLead/);
  assert.match(host, /data-vintage/);
  assert.equal(host.includes("currency"), false);
  assert.equal(host.includes("saleStatus"), false);
  const namedKeys = `${viewFile}\n${host}`.match(/"(ghp|vvl|itlSchola|vntPiscina)[A-Za-z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND325_COPY.en[key as keyof typeof ROUND325_COPY.en], "string", key);
  console.log("crmv4 round325 tests passed");
}

main();
