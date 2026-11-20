/**
 * Soleil sunburst rules, visit plates, the ivory handoff epinaos, and the graphite currency pteroma.
 * Run: TZ=UTC npx tsx tests/crmv4-round358.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND358_COPY } from "../src/lib/crmv4/copy-round358";
import {
  ROUND358_FEATURES,
  activeFinish,
  activeMode,
  activeHour,
  activeHammer,
  addGeneva,
  briskGeneva,
  dropGenevaView,
  fairKeeper,
  vstHome,
  vstBrief,
  vstCapital,
  vstDigit,
  vstEven,
  vstFirst,
  vstRoute,
  vstHue,
  vstJoin,
  vstCitizen,
  vstLane,
  vstLanesCsv,
  vstLength,
  vstLower,
  vstGuest,
  vstAway,
  vstOpen,
  vstPlain,
  vstLong,
  vstRowsCsv,
  vstSoon,
  vstSpace,
  vstState,
  vstUpper,
  vstVowel,
  vstDesk,
  fullHammer,
  idleGeneva,
  lateGeneva,
  leadingSel,
  moveGenevaFocus,
  soleilBand,
  soleilHour,
  soleilGap,
  soleilInner,
  soleilMode,
  soleilOuter,
  soleilHammer,
  soleilFilm,
  soleilTimeline,
  overdueGeneva,
  pairHammer,
  quietFinish,
  readGenevaViews,
  reminderGenevas,
  restingGeneva,
  suggestFinish,
  suggestMode,
  suggestHour,
  type VstRow,
  type Soleil,
} from "../src/lib/crmv4/round358";

function rule(partial: Partial<Soleil> & { id: string; title: string }): Soleil {
  return {
    note: "",
    setter: "",
    piece: "",
    drop: null,
    film: "",
    lock: 4,
    tags: [],
    raised: false,
    pinned: false,
    coffered: false,
    starred: false,
    audit: "",
    ...partial,
  };
}

function main() {
  assert.equal(ROUND358_FEATURES.length, 25);
  assert.equal(ROUND358_FEATURES.includes("visit-plate"), true);
  assert.equal(ROUND358_FEATURES.includes("soleil-pin-sla"), true);
  assert.equal(ROUND358_FEATURES.includes("fair-burster"), true);
  assert.equal(ROUND358_FEATURES.includes("ray-archive"), true);
  assert.equal(ROUND358_FEATURES.includes("ray-reminders"), true);
  assert.equal(ROUND358_FEATURES.includes("soleil-search"), true);
  assert.equal(ROUND358_FEATURES.includes("ray-timeline"), true);
  assert.equal(soleilMode(" radial "), "radial");
  assert.equal(soleilMode("brass"), "");
  assert.equal(soleilHour("6"), 6);
  assert.equal(soleilHour(12), 12);
  assert.equal(soleilHour(24), 24);
  assert.equal(soleilHour(48), 48);
  assert.equal(soleilHour("5"), null);
  assert.equal(soleilHour("10"), null);
  assert.equal(soleilHammer("4"), 4);
  assert.equal(soleilHammer(8), 8);
  assert.equal(soleilHammer("16"), 16);
  assert.equal(soleilHammer("1"), null);
  assert.equal(soleilHammer("3"), null);
  assert.equal(soleilFilm("gilt"), "GILT");
  assert.equal(soleilFilm("ivory"), "IVORY");
  assert.equal(soleilFilm("graphite"), "GRAPHITE");
  assert.equal(soleilFilm("hot"), "");
  assert.equal(soleilInner("radial"), true);
  assert.equal(soleilInner("BASKET"), true);
  assert.equal(soleilInner("flame"), false);
  assert.equal(soleilOuter("flame"), true);
  assert.equal(soleilOuter("sector"), true);
  assert.equal(soleilOuter("radial"), false);
  assert.equal(soleilBand("radial"), "ray");
  assert.equal(soleilBand("basket"), "weave");
  assert.equal(soleilBand("flame"), "tongue");
  assert.equal(soleilBand("sector"), "wedge");
  assert.equal(soleilGap("radial", "sector"), 3);
  assert.equal(quietFinish("ivory"), true);
  assert.equal(quietFinish("gilt"), false);
  assert.equal(pairHammer(8), true);
  assert.equal(pairHammer(4), false);
  assert.equal(fullHammer(16), true);
  assert.equal(fullHammer(8), false);
  assert.equal(activeMode("inner"), "inner");
  assert.equal(activeHour("24"), "24");
  assert.equal(activeHour("7"), "all");
  assert.equal(activeHammer("16"), "16");
  assert.equal(activeHammer("5"), "all");
  assert.equal(activeFinish("gilt", ["GILT"]), "GILT");
  assert.equal(suggestMode(4), "radial");
  assert.equal(suggestMode(10), "sector");
  assert.equal(suggestHour([], 3), 6);
  assert.equal(suggestHour([], 8), 12);
  assert.equal(suggestHour([], 14), 24);
  assert.equal(suggestHour([], 20), 48);
  assert.equal(suggestFinish([]), "IVORY");
  assert.equal(moveGenevaFocus(0, 3, 1), 1);
  assert.equal(moveGenevaFocus(0, 3, -1), 2);
  const late = rule({ id: "a", title: "Ada", piece: "radial" });
  const due = rule({ id: "b", title: "Bea", piece: "flame", lock: 4 });
  const quiet = rule({ id: "c", title: "Cara", drop: 6, lock: 4 });
  const cell = rule({ id: "d", title: "Dora", film: "GILT", drop: 48, lock: 16 });
  const fax = rule({ id: "e", title: "Eve", piece: "sector", film: "IVORY", drop: 12 });
  assert.equal(lateGeneva(late, "sector"), true);
  assert.equal(lateGeneva(late, "radial"), false);
  assert.equal(overdueGeneva(due), true);
  assert.equal(idleGeneva(quiet), true);
  assert.equal(briskGeneva(cell), true);
  assert.equal(restingGeneva(fax), true);
  assert.deepEqual(reminderGenevas([due, late]), ["Bea"]);
  assert.equal(fairKeeper([rule({ id: "1", title: "One", setter: "Ada" }), rule({ id: "2", title: "Two", setter: "Bea" }), rule({ id: "3", title: "Three", setter: "Ada" })], "Ada,Bea"), "Bea");
  const cards = [rule({ id: "1", title: "North", drop: 24 }), rule({ id: "2", title: "East", drop: 12 })];
  assert.match(soleilTimeline(cards).map((mail) => mail.drop).join(","), /24/);
  const saved = addGeneva([], { title: "Ada", piece: "basket", drop: "12", film: "gilt", lock: "8", tags: "r f x" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].piece, "basket");
  assert.equal(saved[0].drop, 12);
  assert.equal(saved[0].lock, 8);
  assert.deepEqual(saved[0].tags, ["r", "f"]);
  assert.equal(addGeneva(saved, { title: "Ada" }).length, 1);
  assert.equal(addGeneva([], { title: "Eve" })[0].lock, 4);
  assert.equal(dropGenevaView([{ id: "v", name: "Morning", tray: "board", query: "", setter: "", film: "all", piece: "all", drop: "all", lock: "all" }], "v").length, 0);
  assert.equal(readGenevaViews([{ id: "v", name: "Morning", tray: "peg" }])[0].tray, "peg");

  const now = Date.parse("2026-11-20T12:00:00.000Z");
  assert.equal(vstHome("IN", now), true);
  assert.equal(vstHome("LIVE", now), true);
  assert.equal(vstHome("2026-11-20T01:00:00.000Z", now), true);
  assert.equal(vstAway("OFF", now), true);
  assert.equal(vstGuest("2026-10-25T12:00:00.000Z", now), true);
  assert.equal(vstCitizen("2025-01-01T00:00:00.000Z", now), true);
  assert.equal(vstDesk("2026-11-15T12:00:00.000Z", now), true);
  assert.equal(vstHome({ lastLoginAt: true }, now), true);
  assert.equal(vstHome({ lastLoginAt: "2026-11-20T08:00:00.000Z" }, now), true);
  assert.equal(vstPlain({ lastLoginAt: false }, now), false);
  assert.equal(vstAway({ lastLoginAt: false }, now), true);
  assert.equal(vstPlain({ lastLoginAt: "Coppery" }, now), true);
  assert.equal(vstHome({ lastLoginAt: "Coppery" }, now), false);
  assert.equal(vstBrief({ lastLoginAt: "MARKER" }, now), true);
  assert.equal(vstJoin("IN&OUT", now), true);
  assert.equal(vstJoin("ANNA NOAH", now), false);
  assert.equal(vstRoute("IN:OUT", now), true);
  assert.equal(vstRoute("SETHOLD", now), false);
  assert.equal(vstBrief("MARKER", now), true);
  assert.equal(vstBrief("IN", now), false);
  assert.equal(vstLong("TwentyCharacterLongX", now), true);
  assert.equal(vstLong("20261120T073000ZZ", now), false);
  assert.equal(vstLane("IN", now), "hall");
  assert.equal(vstLane("2026-11-15T12:00:00.000Z", now), "desk");
  assert.equal(vstLane("2026-10-25T12:00:00.000Z", now), "hold");
  assert.equal(vstLane("2025-01-01T00:00:00.000Z", now), "guest");
  assert.equal(vstLane("Coppery", now), "plain");
  assert.equal(vstLane("20261120T073000Z", now), "stamp");
  assert.equal(vstLane("Amsterdam", now), "vowel");
  assert.equal(vstOpen(""), true);
  assert.equal(vstOpen({ lastLoginAt: "" }), true);
  assert.equal(vstState({ name: "Ada" }), "");
  assert.equal(vstState({ lastLoginAt: "Paris", balance: 1 }), "");
  assert.equal(vstHue("IN", now), "champagne");
  assert.equal(vstHue("IN&OUT", now), "graphite");
  assert.equal(vstHue("2026-10-25T12:00:00.000Z", now), "champagne");
  assert.equal(vstHue("2026-11-15T12:00:00.000Z", now), "graphite");
  assert.equal(vstSoon("MARKER", now), true);
  assert.equal(vstSoon("IN", now), false);
  assert.equal(vstSoon("EIGHTCHR", now), true);
  assert.equal(vstHue("Coppery", now), "ivory");
  assert.equal(vstLength("yes"), 3);
  assert.equal(vstEven("ab"), true);
  assert.equal(vstFirst("Paris"), true);
  assert.equal(vstSpace("needs review"), true);
  assert.equal(vstVowel("Amsterdam"), true);
  assert.equal(vstDigit("Room4"), true);
  assert.equal(vstCapital("PARIS"), true);
  assert.equal(vstLower("paris"), true);
  assert.equal(vstUpper("SEALEDXX"), true);
  assert.equal(vstUpper("HOT"), false);
  assert.equal(vstUpper("WARM"), false);
  const marks: VstRow[] = [
    { id: "1", label: "Ada", code: "IN" },
    { id: "2", label: "Bea", code: "IN" },
    { id: "3", label: "Cara", code: "Paris" },
  ];
  assert.equal(leadingSel(marks), "hall");
  assert.match(vstLanesCsv(marks), /hall,2/);
  assert.match(vstRowsCsv(marks, ["1"]), /Ada,IN/);
  assert.equal(crmv4Text("tr", "sbrTitle"), ROUND358_COPY.tr.sbrTitle);
  assert.equal(crmv4Text("de", "vstTitle"), ROUND358_COPY.de.vstTitle);
  assert.equal(crmv4Text("ru", "hpEpinaosKicker"), ROUND358_COPY.ru.hpEpinaosKicker);
  assert.equal(crmv4Text("ar", "qcPteromaLead"), ROUND358_COPY.ar.qcPteromaLead);
  const keys = Object.keys(ROUND358_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND358_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-soleil/);
  assert.match(css, /\.c4-vstplate/);
  assert.match(css, /\.c4-soleil-column/);
  assert.match(css, /\.c4-vstplate-column/);
  assert.match(css, /\.c4-handoff-epinaos/);
  assert.match(css, /\.c4-ccy-pteroma/);
  assert.match(css, /\.c4-hp-epinaos-mast/);
  assert.match(css, /\.c4-qc-pteroma-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round358.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /lastLoginAt:/);
  assert.match(viewFile, /soleilCsv/);
  assert.match(viewFile, /vstRowsCsv/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "x"/);
  assert.match(viewFile, /event\.key === "a"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=24&meta=0/);
  assert.match(viewFile, /data-cards/);
  assert.match(viewFile, /data-plates/);
  assert.match(viewFile, /data-names/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestFinish/);
  assert.match(viewFile, /c4-vstplate-search/);
  assert.match(viewFile, /soleilTimeline/);
  assert.match(viewFile, /c4-soleil-notices/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "sbr"/);
  assert.match(app, /view === "vst"/);
  const tags = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round112.tsx"), "utf8");
  assert.match(tags, /c4-handoff-epinaos/);
  assert.match(tags, /c4-hp-epinaos-mast/);
  assert.match(tags, /data-logo="mono"/);
  assert.match(tags, /hpEpinaosKicker/);
  assert.match(tags, /hpEpinaosLead/);
  assert.match(tags, /data-handoff-epinaos/);
  const gallery = tags.slice(tags.indexOf("export function HandoffPolish"), tags.indexOf("export function DepositCurrencies"));
  assert.equal(gallery.includes("amount"), false);
  assert.equal(gallery.includes("price"), false);
  assert.match(tags, /c4-ccy-pteroma/);
  assert.match(tags, /c4-qc-pteroma-mast/);
  assert.match(tags, /qcPteromaKicker/);
  assert.match(tags, /qcPteromaLead/);
  assert.match(tags, /data-ccy-pteroma/);
  const porch = tags.slice(tags.indexOf("export function DepositCurrencies"));
  assert.equal(porch.includes("amount"), false);
  assert.equal(porch.includes("profit"), false);
  assert.match(porch, /currencyCode/);
  const namedKeys = `${viewFile}\n${tags}`.match(/"(sbr|vst|hpEpinaos|qcPteroma)[A-Za-z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND358_COPY.en[key as keyof typeof ROUND358_COPY.en], "string", key);
  console.log("crmv4 round358 tests passed");
}

main();
