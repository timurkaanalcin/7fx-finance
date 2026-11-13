/**
 * Quadrant sights, language plates, the cohort gallery, and the accent salon.
 * Run: TZ=UTC npx tsx tests/crmv4-round282.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND282_COPY } from "../src/lib/crmv4/copy-round282";
import {
  ROUND282_FEATURES,
  activeArc,
  activeFinish,
  activeInk,
  activeNotch,
  activeSpan,
  addQuadrant,
  arcBand,
  arcGap,
  arcOf,
  briskQuadrant,
  dipSpan,
  dropQuadrantView,
  evenNotch,
  fairKeeper,
  finishOf,
  houseFinish,
  idleQuadrant,
  inkOf,
  keenArc,
  languageDash,
  languageEcho,
  languageHue,
  languageKnown,
  languageLane,
  languageLanesCsv,
  languageLeap,
  languageRowsCsv,
  languageState,
  languageStep,
  languageTail,
  languageTwin,
  languageVowel,
  languageWide,
  languageWords,
  lateQuadrant,
  leadingLanguage,
  liftSpan,
  moveQuadrantFocus,
  overdueQuadrant,
  quadrantNotch,
  quadrantSpan,
  readQuadrantViews,
  restingQuadrant,
  stillArc,
  suggestArc,
  suggestFinish,
  suggestSpan,
  type LanguageRow,
  type QuadrantSight,
} from "../src/lib/crmv4/round282";

function card(partial: Partial<QuadrantSight> & { id: string; title: string }): QuadrantSight {
  return {
    note: "",
    keeper: "",
    arc: "",
    span: null,
    finish: "",
    ink: "",
    notch: 1,
    tags: [],
    logged: false,
    locked: false,
    stowed: false,
    flagged: false,
    audit: "",
    ...partial,
  };
}

function main() {
  assert.equal(ROUND282_FEATURES.length, 25);
  assert.equal(arcOf(" vane "), "vane");
  assert.equal(arcOf("paris"), "");
  assert.equal(quadrantSpan("20"), 20);
  assert.equal(quadrantSpan(40), 40);
  assert.equal(quadrantSpan("80"), 80);
  assert.equal(quadrantSpan("15"), null);
  assert.equal(quadrantSpan("10"), null);
  assert.equal(quadrantNotch("1"), 1);
  assert.equal(quadrantNotch(4), 4);
  assert.equal(quadrantNotch("8"), 8);
  assert.equal(quadrantNotch("2"), null);
  assert.equal(quadrantNotch("6"), null);
  assert.equal(finishOf("ivory"), "IVORY");
  assert.equal(finishOf("graphite"), "GRAPHITE");
  assert.equal(finishOf("champagne"), "CHAMPAGNE");
  assert.equal(finishOf("gilt"), "");
  assert.equal(inkOf("soot"), "soot");
  assert.equal(inkOf("gilt"), "gilt");
  assert.equal(inkOf("slate"), "slate");
  assert.equal(inkOf("pearl"), "");
  assert.equal(keenArc("vane"), true);
  assert.equal(keenArc("HORIZON"), true);
  assert.equal(keenArc("limb"), false);
  assert.equal(stillArc("limb"), true);
  assert.equal(stillArc("shade"), true);
  assert.equal(stillArc("vane"), false);
  assert.equal(arcBand("limb"), "noon");
  assert.equal(arcBand("vane"), "rise");
  assert.equal(arcBand("shade"), "set");
  assert.equal(arcBand("horizon"), "night");
  assert.equal(arcBand(""), "");
  assert.equal(arcGap("limb", "vane"), 1);
  assert.equal(arcGap("vane", "limb"), -1);
  assert.equal(arcGap("", "limb"), null);
  assert.equal(houseFinish("graphite"), true);
  assert.equal(houseFinish("CHAMPAGNE"), true);
  assert.equal(houseFinish("ivory"), false);
  assert.equal(evenNotch(4), true);
  assert.equal(evenNotch("4"), true);
  assert.equal(evenNotch(1), false);
  assert.equal(evenNotch(8), false);
  assert.equal(activeArc("keen"), "keen");
  assert.equal(activeArc("vane"), "vane");
  assert.equal(activeArc("paris"), "all");
  assert.equal(activeSpan("20"), "20");
  assert.equal(activeSpan("9"), "all");
  assert.equal(activeInk("gilt", ["soot", "gilt", "slate"]), "gilt");
  assert.equal(activeInk("mist", ["soot", "gilt", "slate"]), "all");
  assert.equal(activeNotch("4"), "4");
  assert.equal(activeNotch("2"), "all");
  assert.equal(activeFinish("graphite"), "graphite");
  assert.equal(moveQuadrantFocus(0, 4, 1), 1);
  assert.equal(moveQuadrantFocus(0, 4, -1), 3);
  assert.equal(suggestFinish([]), "IVORY");
  assert.equal(suggestSpan([], 5), 20);
  assert.equal(suggestSpan([], 10), 40);
  assert.equal(suggestSpan([], 20), 80);
  assert.equal(suggestArc(8), "limb");
  assert.equal(suggestArc(11), "horizon");
  assert.equal(fairKeeper([card({ id: "1", title: "North", keeper: "Ada" })], "Ada,Bea"), "Bea");

  const saved = addQuadrant([], { id: "1", title: "North", arc: "vane", span: 20, ink: "gilt", notch: 8, keeper: "Ada" });
  assert.equal(saved[0].audit, "save");
  assert.equal(overdueQuadrant(saved[0]), true);
  assert.equal(briskQuadrant(saved[0]), true);
  assert.equal(liftSpan(saved, "1")[0].span, 40);
  assert.equal(dipSpan([{ ...saved[0], span: null }], "1")[0].span, 80);
  const quiet = card({ id: "2", title: "West", arc: "limb", ink: "soot", notch: 1 });
  assert.equal(idleQuadrant(quiet), true);
  assert.equal(lateQuadrant(quiet, "horizon"), true);
  const rest = card({ id: "3", title: "East", arc: "horizon", ink: "slate", span: 80, notch: 4 });
  assert.equal(restingQuadrant(rest), true);
  const views = readQuadrantViews([{ id: "v1", name: "Morning", tray: "case", arc: "keen", span: "20", notch: "4", ink: "slate", finish: "ivory" }]);
  assert.equal(views[0].tray, "case");
  assert.equal(dropQuadrantView(views, "v1").length, 0);

  assert.equal(languageLane("en-GB"), "region");
  assert.equal(languageLane("EN"), "house");
  assert.equal(languageLane("dutch"), "long");
  assert.equal(languageLane("tur"), "trio");
  assert.equal(languageLane("it"), "open");
  assert.equal(languageLane("fr"), "pair");
  assert.equal(languageLane("mark"), "mark");
  assert.equal(languageHue("en-GB"), "ivory");
  assert.equal(languageHue("EN"), "champagne");
  assert.equal(languageKnown("FR"), true);
  assert.equal(languageKnown("dutch"), false);
  assert.equal(languageWords("en-GB"), 2);
  assert.equal(languageWords("EN"), 1);
  assert.equal(languageStep("dutch"), 5);
  assert.equal(languageLeap("dutch"), true);
  assert.equal(languageWide("deutsch"), true);
  assert.equal(languageDash("en-GB"), true);
  assert.equal(languageTwin("letter"), true);
  assert.equal(languageEcho("aa"), true);
  assert.equal(languageVowel("it"), true);
  assert.equal(languageTail("en"), true);
  assert.equal(languageState({ language: "en", amount: 3 }), "");
  assert.equal(languageState(""), "clear");
  assert.equal(languageState({ city: "x" }), "");
  const rows: LanguageRow[] = [
    { id: "1", label: "Ada", note: "EN" },
    { id: "2", label: "Bea", note: "fr" },
  ];
  assert.equal(leadingLanguage(rows), "house");
  assert.match(languageLanesCsv(rows), /house,1/);
  assert.match(languageLanesCsv(rows), /pair,1/);
  assert.match(languageRowsCsv(rows, ["1"]), /Ada,EN,EN,house,champagne/);

  const locales = ["en", "tr", "de", "ru", "ar"] as const;
  const keys = Object.keys(ROUND282_COPY.en).sort();
  for (const locale of locales) assert.deepEqual(Object.keys(ROUND282_COPY[locale]).sort(), keys);
  assert.equal(crmv4Text("tr", "qdrTitle"), ROUND282_COPY.tr.qdrTitle);
  assert.equal(crmv4Text("de", "lngTitle"), ROUND282_COPY.de.lngTitle);
  assert.equal(crmv4Text("ru", "qdrSub"), ROUND282_COPY.ru.qdrSub);
  assert.equal(crmv4Text("ar", "lngSub"), ROUND282_COPY.ar.lngSub);
  assert.equal(crmv4Text("en", "qdrLogo"), "7FX");
  assert.equal(crmv4Text("en", "qdrTitle"), "Quadrant sights");
  assert.equal(crmv4Text("en", "lngTitle"), "Language plates");
  assert.equal(crmv4Text("en", "cohGalKicker"), "Cohort gallery");
  assert.equal(crmv4Text("en", "accSalonKicker"), "Accent salon");
  assert.notEqual(ROUND282_COPY.tr.qdrTitle, ROUND282_COPY.en.qdrTitle);
  assert.equal(crmv4Text("en", "nocTitle"), "Nocturnal sights");

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-quadrant/);
  assert.match(css, /\.c4-languageplate-index/);
  assert.match(css, /\.c4-quadrant-column/);
  assert.match(css, /\.c4-languageplate-column/);
  assert.match(css, /\.c4-cohort-gallery/);
  assert.match(css, /\.c4-cohort-gallery-mast/);
  assert.match(css, /\.c4-accent-salon/);
  assert.match(css, /\.c4-accent-salon-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round282.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /language:/);
  assert.match(viewFile, /quadrantCsv/);
  assert.match(viewFile, /languageRowsCsv/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "x"/);
  assert.match(viewFile, /event\.key === "j"/);
  assert.match(viewFile, /event\.key === "n"/);
  assert.match(viewFile, /event\.key === "l"/);
  assert.match(viewFile, /event\.key === "g"/);
  assert.match(viewFile, /event\.key === "h"/);
  assert.match(viewFile, /event\.key === "w"/);
  assert.match(viewFile, /event\.key === "b"/);
  assert.match(viewFile, /event\.key === "p"/);
  assert.match(viewFile, /event\.key === "u"/);
  assert.match(viewFile, /event\.key === "y"/);
  assert.match(viewFile, /event\.key === "m"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=24&meta=0&role=TRADER/);
  assert.match(viewFile, /data-cards/);
  assert.match(viewFile, /data-plates/);
  assert.match(viewFile, /data-names/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestFinish/);
  assert.match(viewFile, /c4-languageplate-search/);
  assert.match(viewFile, /quadrantTimeline/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "qdr"/);
  assert.match(app, /view === "lng"/);
  const cohort = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round24.tsx"), "utf8");
  assert.match(cohort, /c4-cohort-gallery/);
  assert.match(cohort, /c4-cohort-gallery-mast/);
  assert.match(cohort, /c4-cohort-gallery-card/);
  assert.match(cohort, /data-logo="mono"/);
  assert.match(cohort, /cohGalKicker/);
  assert.match(cohort, /cohGalLead/);
  const board = cohort.slice(cohort.indexOf("export function CohortBoard"));
  assert.equal(board.includes("sendJson"), false);
  assert.equal(board.includes("fetch("), false);
  const accent = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round57.tsx"), "utf8");
  assert.match(accent, /c4-accent-salon/);
  assert.match(accent, /c4-accent-salon-mast/);
  assert.match(accent, /c4-accent-salon-preview/);
  assert.match(accent, /accSalonKicker/);
  assert.match(accent, /accSalonLead/);
  const used = new Set(viewFile.match(/v4\("([a-zA-Z0-9]+)"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of Array.from(used)) assert.ok(key in ROUND282_COPY.en, key);
  const named = viewFile.match(/"(qdr|lng)[a-zA-Z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of named) assert.ok(key in ROUND282_COPY.en, key);
  const gallery = cohort.match(/v4\("(cohGal[a-zA-Z0-9]+)"\)/g)?.map((item) => item.slice(4, -2)) || [];
  for (const key of gallery) assert.ok(key in ROUND282_COPY.en, key);
  const salon = accent.match(/v4\("(accSalon[a-zA-Z0-9]+)"\)/g)?.map((item) => item.slice(4, -2)) || [];
  for (const key of salon) assert.ok(key in ROUND282_COPY.en, key);
  console.log("crmv4 round282 tests passed");
}

main();
