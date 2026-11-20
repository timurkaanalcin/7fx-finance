/**
 * Perlage rules, lead source plates, the ivory view oikos, and the graphite status prodomos.
 * Run: TZ=UTC npx tsx tests/crmv4-round354.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND354_COPY } from "../src/lib/crmv4/copy-round354";
import {
  ROUND354_FEATURES,
  activeFinish,
  activeMode,
  activeHour,
  activeHammer,
  addPerlage,
  briskPerlage,
  dropPerlageView,
  fairKeeper,
  lsrHome,
  lsrBrief,
  lsrCapital,
  lsrDigit,
  lsrEven,
  lsrFirst,
  lsrRoute,
  lsrHue,
  lsrJoin,
  lsrCitizen,
  lsrLane,
  lsrLanesCsv,
  lsrLength,
  lsrLower,
  lsrGuest,
  lsrAway,
  lsrOpen,
  lsrPlain,
  lsrLong,
  lsrRowsCsv,
  lsrSoon,
  lsrSpace,
  lsrState,
  lsrUpper,
  lsrVowel,
  lsrDesk,
  fullHammer,
  idlePerlage,
  latePerlage,
  leadingLsr,
  movePerlageFocus,
  perlageBand,
  perlageHour,
  perlageGap,
  perlageInner,
  perlageMode,
  perlageOuter,
  perlageHammer,
  perlageFilm,
  perlageTimeline,
  overduePerlage,
  pairHammer,
  quietFinish,
  readPerlageViews,
  reminderPerlages,
  restingPerlage,
  suggestFinish,
  suggestMode,
  suggestHour,
  type LsrRow,
  type Perlage,
} from "../src/lib/crmv4/round354";

function rule(partial: Partial<Perlage> & { id: string; title: string }): Perlage {
  return {
    note: "",
    setter: "",
    piece: "",
    drop: null,
    film: "",
    lock: 3,
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
  assert.equal(ROUND354_FEATURES.length, 25);
  assert.equal(ROUND354_FEATURES.includes("source-plate"), true);
  assert.equal(ROUND354_FEATURES.includes("perlage-pin-sla"), true);
  assert.equal(ROUND354_FEATURES.includes("fair-grainer"), true);
  assert.equal(ROUND354_FEATURES.includes("cloud-archive"), true);
  assert.equal(ROUND354_FEATURES.includes("cloud-reminders"), true);
  assert.equal(ROUND354_FEATURES.includes("perlage-search"), true);
  assert.equal(ROUND354_FEATURES.includes("cloud-timeline"), true);
  assert.equal(perlageMode(" cloud "), "cloud");
  assert.equal(perlageMode("brass"), "");
  assert.equal(perlageHour("3"), 3);
  assert.equal(perlageHour(9), 9);
  assert.equal(perlageHour(18), 18);
  assert.equal(perlageHour(27), 27);
  assert.equal(perlageHour("6"), null);
  assert.equal(perlageHour("12"), null);
  assert.equal(perlageHammer("3"), 3);
  assert.equal(perlageHammer(6), 6);
  assert.equal(perlageHammer("9"), 9);
  assert.equal(perlageHammer("1"), null);
  assert.equal(perlageHammer("2"), null);
  assert.equal(perlageFilm("gilt"), "GILT");
  assert.equal(perlageFilm("ivory"), "IVORY");
  assert.equal(perlageFilm("graphite"), "GRAPHITE");
  assert.equal(perlageFilm("hot"), "");
  assert.equal(perlageInner("cloud"), true);
  assert.equal(perlageInner("WAVE"), true);
  assert.equal(perlageInner("sun"), false);
  assert.equal(perlageOuter("sun"), true);
  assert.equal(perlageOuter("ring"), true);
  assert.equal(perlageOuter("cloud"), false);
  assert.equal(perlageBand("cloud"), "mist");
  assert.equal(perlageBand("wave"), "tide");
  assert.equal(perlageBand("sun"), "ray");
  assert.equal(perlageBand("ring"), "hoop");
  assert.equal(perlageGap("cloud", "ring"), 3);
  assert.equal(quietFinish("ivory"), true);
  assert.equal(quietFinish("gilt"), false);
  assert.equal(pairHammer(6), true);
  assert.equal(pairHammer(3), false);
  assert.equal(fullHammer(9), true);
  assert.equal(fullHammer(6), false);
  assert.equal(activeMode("inner"), "inner");
  assert.equal(activeHour("18"), "18");
  assert.equal(activeHour("7"), "all");
  assert.equal(activeHammer("9"), "9");
  assert.equal(activeHammer("2"), "all");
  assert.equal(activeFinish("gilt", ["GILT"]), "GILT");
  assert.equal(suggestMode(4), "cloud");
  assert.equal(suggestMode(10), "ring");
  assert.equal(suggestHour([], 3), 3);
  assert.equal(suggestHour([], 8), 9);
  assert.equal(suggestHour([], 14), 18);
  assert.equal(suggestHour([], 20), 27);
  assert.equal(suggestFinish([]), "IVORY");
  assert.equal(movePerlageFocus(0, 3, 1), 1);
  assert.equal(movePerlageFocus(0, 3, -1), 2);
  const late = rule({ id: "a", title: "Ada", piece: "cloud" });
  const due = rule({ id: "b", title: "Bea", piece: "sun", lock: 3 });
  const quiet = rule({ id: "c", title: "Cara", drop: 3, lock: 3 });
  const cell = rule({ id: "d", title: "Dora", film: "GILT", drop: 27, lock: 9 });
  const fax = rule({ id: "e", title: "Eve", piece: "ring", film: "IVORY", drop: 9 });
  assert.equal(latePerlage(late, "ring"), true);
  assert.equal(latePerlage(late, "cloud"), false);
  assert.equal(overduePerlage(due), true);
  assert.equal(idlePerlage(quiet), true);
  assert.equal(briskPerlage(cell), true);
  assert.equal(restingPerlage(fax), true);
  assert.deepEqual(reminderPerlages([due, late]), ["Bea"]);
  assert.equal(fairKeeper([rule({ id: "1", title: "One", setter: "Ada" }), rule({ id: "2", title: "Two", setter: "Bea" }), rule({ id: "3", title: "Three", setter: "Ada" })], "Ada,Bea"), "Bea");
  const cards = [rule({ id: "1", title: "North", drop: 18 }), rule({ id: "2", title: "East", drop: 9 })];
  assert.match(perlageTimeline(cards).map((mail) => mail.drop).join(","), /18/);
  const saved = addPerlage([], { title: "Ada", piece: "wave", drop: "9", film: "gilt", lock: "6", tags: "p r x" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].piece, "wave");
  assert.equal(saved[0].drop, 9);
  assert.equal(saved[0].lock, 6);
  assert.deepEqual(saved[0].tags, ["p", "r"]);
  assert.equal(addPerlage(saved, { title: "Ada" }).length, 1);
  assert.equal(addPerlage([], { title: "Eve" })[0].lock, 3);
  assert.equal(dropPerlageView([{ id: "v", name: "Morning", tray: "board", query: "", setter: "", film: "all", piece: "all", drop: "all", lock: "all" }], "v").length, 0);
  assert.equal(readPerlageViews([{ id: "v", name: "Morning", tray: "peg" }])[0].tray, "peg");

  assert.equal(lsrHome("WEB"), true);
  assert.equal(lsrHome("WEBSITE"), true);
  assert.equal(lsrHome("LEAD_WEB"), true);
  assert.equal(lsrAway("OPEN"), true);
  assert.equal(lsrGuest("REF"), true);
  assert.equal(lsrGuest("REFERRAL"), true);
  assert.equal(lsrCitizen("ADS"), true);
  assert.equal(lsrCitizen("ADWORDS"), true);
  assert.equal(lsrDesk("APP"), true);
  assert.equal(lsrDesk("LEAD_APP"), true);
  assert.equal(lsrHome({ leadSource: true }), true);
  assert.equal(lsrPlain({ leadSource: false }), false);
  assert.equal(lsrAway({ leadSource: false }), true);
  assert.equal(lsrPlain({ leadSource: "Letter" }), true);
  assert.equal(lsrHome({ leadSource: "Letter" }), false);
  assert.equal(lsrBrief({ leadSource: "NOTES" }), true);
  assert.equal(lsrJoin("WEB+APP"), true);
  assert.equal(lsrJoin("ANNA NOAH"), false);
  assert.equal(lsrRoute("WEB:APP"), true);
  assert.equal(lsrRoute("LIVEHOLD"), false);
  assert.equal(lsrBrief("NOTES"), true);
  assert.equal(lsrBrief("WEB"), false);
  assert.equal(lsrLong("FourteenCharsX"), true);
  assert.equal(lsrLong("20261120T0730Z"), false);
  assert.equal(lsrLane("WEBSITE"), "home");
  assert.equal(lsrLane("APP"), "desk");
  assert.equal(lsrLane("REF"), "hold");
  assert.equal(lsrLane("ADS"), "guest");
  assert.equal(lsrLane("Letter"), "plain");
  assert.equal(lsrLane("20261120T0730Z"), "stamp");
  assert.equal(lsrLane("Amsterdam"), "vowel");
  assert.equal(lsrOpen(""), true);
  assert.equal(lsrOpen({ leadSource: "" }), true);
  assert.equal(lsrState({ name: "Ada" }), "");
  assert.equal(lsrState({ leadSource: "Paris", balance: 1 }), "");
  assert.equal(lsrHue("WEB"), "champagne");
  assert.equal(lsrHue("WEB+APP"), "graphite");
  assert.equal(lsrHue("REF"), "champagne");
  assert.equal(lsrHue("APP"), "graphite");
  assert.equal(lsrSoon("NOTES"), true);
  assert.equal(lsrSoon("WEB"), false);
  assert.equal(lsrSoon("ROOMSXX"), true);
  assert.equal(lsrHue("Letter"), "ivory");
  assert.equal(lsrLength("yes"), 3);
  assert.equal(lsrEven("ab"), true);
  assert.equal(lsrFirst("Paris"), true);
  assert.equal(lsrSpace("needs review"), true);
  assert.equal(lsrVowel("Amsterdam"), true);
  assert.equal(lsrDigit("Room4"), true);
  assert.equal(lsrCapital("PARIS"), true);
  assert.equal(lsrLower("paris"), true);
  assert.equal(lsrUpper("ADWORDS"), true);
  assert.equal(lsrUpper("WEB"), false);
  assert.equal(lsrUpper("APP"), false);
  const marks: LsrRow[] = [
    { id: "1", label: "Ada", code: "WEB" },
    { id: "2", label: "Bea", code: "WEB" },
    { id: "3", label: "Cara", code: "Madrid" },
  ];
  assert.equal(leadingLsr(marks), "home");
  assert.match(lsrLanesCsv(marks), /home,2/);
  assert.match(lsrRowsCsv(marks, ["1"]), /Ada,WEB/);
  assert.equal(crmv4Text("tr", "pglTitle"), ROUND354_COPY.tr.pglTitle);
  assert.equal(crmv4Text("de", "lsrTitle"), ROUND354_COPY.de.lsrTitle);
  assert.equal(crmv4Text("ru", "dvOikosKicker"), ROUND354_COPY.ru.dvOikosKicker);
  assert.equal(crmv4Text("ar", "kyProdomosLead"), ROUND354_COPY.ar.kyProdomosLead);
  const keys = Object.keys(ROUND354_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND354_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-perlage/);
  assert.match(css, /\.c4-lsrplate/);
  assert.match(css, /\.c4-perlage-column/);
  assert.match(css, /\.c4-lsrplate-column/);
  assert.match(css, /\.c4-saved-oikos/);
  assert.match(css, /\.c4-kyc-prodomos/);
  assert.match(css, /\.c4-dv-oikos-mast/);
  assert.match(css, /\.c4-ky-prodomos-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round354.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /leadSource:/);
  assert.match(viewFile, /perlageCsv/);
  assert.match(viewFile, /lsrRowsCsv/);
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
  assert.match(viewFile, /c4-lsrplate-search/);
  assert.match(viewFile, /perlageTimeline/);
  assert.match(viewFile, /c4-perlage-notices/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "pgl"/);
  assert.match(app, /view === "lsr"/);
  const tags = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round107.tsx"), "utf8");
  assert.match(tags, /c4-saved-oikos/);
  assert.match(tags, /c4-dv-oikos-mast/);
  assert.match(tags, /data-logo="mono"/);
  assert.match(tags, /dvOikosKicker/);
  assert.match(tags, /dvOikosLead/);
  assert.match(tags, /data-saved-oikos/);
  const gallery = tags.slice(tags.indexOf("export function SavedViews"), tags.indexOf("export function KycStatus"));
  assert.equal(gallery.includes("amount"), false);
  assert.equal(gallery.includes("price"), false);
  assert.match(tags, /c4-kyc-prodomos/);
  assert.match(tags, /c4-ky-prodomos-mast/);
  assert.match(tags, /kyProdomosKicker/);
  assert.match(tags, /kyProdomosLead/);
  assert.match(tags, /data-kyc-prodomos/);
  const porch = tags.slice(tags.indexOf("export function KycStatus"));
  assert.equal(porch.includes("currency"), false);
  assert.equal(porch.includes("profit"), false);
  const namedKeys = `${viewFile}\n${tags}`.match(/"(pgl|lsr|dvOikos|kyProdomos)[A-Za-z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND354_COPY.en[key as keyof typeof ROUND354_COPY.en], "string", key);
  console.log("crmv4 round354 tests passed");
}

main();
