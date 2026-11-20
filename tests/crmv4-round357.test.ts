/**
 * Geneva stripe rules, potential plates, the ivory reminder megaron, and the graphite risk prytaneion.
 * Run: TZ=UTC npx tsx tests/crmv4-round357.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND357_COPY } from "../src/lib/crmv4/copy-round357";
import {
  ROUND357_FEATURES,
  activeFinish,
  activeMode,
  activeHour,
  activeHammer,
  addGeneva,
  briskGeneva,
  dropGenevaView,
  fairKeeper,
  ptsHome,
  ptsBrief,
  ptsCapital,
  ptsDigit,
  ptsEven,
  ptsFirst,
  ptsRoute,
  ptsHue,
  ptsJoin,
  ptsCitizen,
  ptsLane,
  ptsLanesCsv,
  ptsLength,
  ptsLower,
  ptsGuest,
  ptsAway,
  ptsOpen,
  ptsPlain,
  ptsLong,
  ptsRowsCsv,
  ptsSoon,
  ptsSpace,
  ptsState,
  ptsUpper,
  ptsVowel,
  ptsDesk,
  fullHammer,
  idleGeneva,
  lateGeneva,
  leadingSel,
  moveGenevaFocus,
  genevaBand,
  genevaHour,
  genevaGap,
  genevaInner,
  genevaMode,
  genevaOuter,
  genevaHammer,
  genevaFilm,
  genevaTimeline,
  overdueGeneva,
  pairHammer,
  quietFinish,
  readGenevaViews,
  reminderGenevas,
  restingGeneva,
  suggestFinish,
  suggestMode,
  suggestHour,
  type PtsRow,
  type Geneva,
} from "../src/lib/crmv4/round357";

function rule(partial: Partial<Geneva> & { id: string; title: string }): Geneva {
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
  assert.equal(ROUND357_FEATURES.length, 25);
  assert.equal(ROUND357_FEATURES.includes("potential-plate"), true);
  assert.equal(ROUND357_FEATURES.includes("geneva-pin-sla"), true);
  assert.equal(ROUND357_FEATURES.includes("fair-striper"), true);
  assert.equal(ROUND357_FEATURES.includes("stripe-archive"), true);
  assert.equal(ROUND357_FEATURES.includes("stripe-reminders"), true);
  assert.equal(ROUND357_FEATURES.includes("geneva-search"), true);
  assert.equal(ROUND357_FEATURES.includes("stripe-timeline"), true);
  assert.equal(genevaMode(" straight "), "straight");
  assert.equal(genevaMode("brass"), "");
  assert.equal(genevaHour("6"), 6);
  assert.equal(genevaHour(12), 12);
  assert.equal(genevaHour(24), 24);
  assert.equal(genevaHour(48), 48);
  assert.equal(genevaHour("5"), null);
  assert.equal(genevaHour("10"), null);
  assert.equal(genevaHammer("4"), 4);
  assert.equal(genevaHammer(8), 8);
  assert.equal(genevaHammer("16"), 16);
  assert.equal(genevaHammer("1"), null);
  assert.equal(genevaHammer("3"), null);
  assert.equal(genevaFilm("gilt"), "GILT");
  assert.equal(genevaFilm("ivory"), "IVORY");
  assert.equal(genevaFilm("graphite"), "GRAPHITE");
  assert.equal(genevaFilm("hot"), "");
  assert.equal(genevaInner("straight"), true);
  assert.equal(genevaInner("CIRCULAR"), true);
  assert.equal(genevaInner("wavy"), false);
  assert.equal(genevaOuter("wavy"), true);
  assert.equal(genevaOuter("broken"), true);
  assert.equal(genevaOuter("straight"), false);
  assert.equal(genevaBand("straight"), "bar");
  assert.equal(genevaBand("circular"), "ring");
  assert.equal(genevaBand("wavy"), "wave");
  assert.equal(genevaBand("broken"), "break");
  assert.equal(genevaGap("straight", "broken"), 3);
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
  assert.equal(suggestMode(4), "straight");
  assert.equal(suggestMode(10), "broken");
  assert.equal(suggestHour([], 3), 6);
  assert.equal(suggestHour([], 8), 12);
  assert.equal(suggestHour([], 14), 24);
  assert.equal(suggestHour([], 20), 48);
  assert.equal(suggestFinish([]), "IVORY");
  assert.equal(moveGenevaFocus(0, 3, 1), 1);
  assert.equal(moveGenevaFocus(0, 3, -1), 2);
  const late = rule({ id: "a", title: "Ada", piece: "straight" });
  const due = rule({ id: "b", title: "Bea", piece: "wavy", lock: 4 });
  const quiet = rule({ id: "c", title: "Cara", drop: 6, lock: 4 });
  const cell = rule({ id: "d", title: "Dora", film: "GILT", drop: 48, lock: 16 });
  const fax = rule({ id: "e", title: "Eve", piece: "broken", film: "IVORY", drop: 12 });
  assert.equal(lateGeneva(late, "broken"), true);
  assert.equal(lateGeneva(late, "straight"), false);
  assert.equal(overdueGeneva(due), true);
  assert.equal(idleGeneva(quiet), true);
  assert.equal(briskGeneva(cell), true);
  assert.equal(restingGeneva(fax), true);
  assert.deepEqual(reminderGenevas([due, late]), ["Bea"]);
  assert.equal(fairKeeper([rule({ id: "1", title: "One", setter: "Ada" }), rule({ id: "2", title: "Two", setter: "Bea" }), rule({ id: "3", title: "Three", setter: "Ada" })], "Ada,Bea"), "Bea");
  const cards = [rule({ id: "1", title: "North", drop: 24 }), rule({ id: "2", title: "East", drop: 12 })];
  assert.match(genevaTimeline(cards).map((mail) => mail.drop).join(","), /24/);
  const saved = addGeneva([], { title: "Ada", piece: "circular", drop: "12", film: "gilt", lock: "8", tags: "s t x" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].piece, "circular");
  assert.equal(saved[0].drop, 12);
  assert.equal(saved[0].lock, 8);
  assert.deepEqual(saved[0].tags, ["s", "t"]);
  assert.equal(addGeneva(saved, { title: "Ada" }).length, 1);
  assert.equal(addGeneva([], { title: "Eve" })[0].lock, 4);
  assert.equal(dropGenevaView([{ id: "v", name: "Morning", tray: "board", query: "", setter: "", film: "all", piece: "all", drop: "all", lock: "all" }], "v").length, 0);
  assert.equal(readGenevaViews([{ id: "v", name: "Morning", tray: "peg" }])[0].tray, "peg");

  assert.equal(ptsHome("HOT"), true);
  assert.equal(ptsHome("KEEN"), true);
  assert.equal(ptsHome("PRIME"), true);
  assert.equal(ptsAway("OFF"), true);
  assert.equal(ptsGuest("COOL"), true);
  assert.equal(ptsGuest("CALM"), true);
  assert.equal(ptsCitizen("COLD"), true);
  assert.equal(ptsCitizen("LOST"), true);
  assert.equal(ptsDesk("WARM"), true);
  assert.equal(ptsDesk("SOFT"), true);
  assert.equal(ptsHome({ potentialStatus: true }), true);
  assert.equal(ptsPlain({ potentialStatus: false }), false);
  assert.equal(ptsAway({ potentialStatus: false }), true);
  assert.equal(ptsPlain({ potentialStatus: "Coppery" }), true);
  assert.equal(ptsHome({ potentialStatus: "Coppery" }), false);
  assert.equal(ptsBrief({ potentialStatus: "MARKER" }), true);
  assert.equal(ptsJoin("HOT&WARM"), true);
  assert.equal(ptsJoin("ANNA NOAH"), false);
  assert.equal(ptsRoute("HOT:WARM"), true);
  assert.equal(ptsRoute("SETHOLD"), false);
  assert.equal(ptsBrief("MARKER"), true);
  assert.equal(ptsBrief("HOT"), false);
  assert.equal(ptsLong("TwentyCharacterLongX"), true);
  assert.equal(ptsLong("20261120T073000ZZ"), false);
  assert.equal(ptsLane("KEEN"), "home");
  assert.equal(ptsLane("WARM"), "desk");
  assert.equal(ptsLane("COOL"), "hold");
  assert.equal(ptsLane("COLD"), "guest");
  assert.equal(ptsLane("Coppery"), "plain");
  assert.equal(ptsLane("20261120T073000Z"), "stamp");
  assert.equal(ptsLane("Amsterdam"), "vowel");
  assert.equal(ptsOpen(""), true);
  assert.equal(ptsOpen({ potentialStatus: "" }), true);
  assert.equal(ptsState({ name: "Ada" }), "");
  assert.equal(ptsState({ potentialStatus: "Paris", balance: 1 }), "");
  assert.equal(ptsHue("HOT"), "champagne");
  assert.equal(ptsHue("HOT&WARM"), "graphite");
  assert.equal(ptsHue("COOL"), "champagne");
  assert.equal(ptsHue("WARM"), "graphite");
  assert.equal(ptsSoon("MARKER"), true);
  assert.equal(ptsSoon("HOT"), false);
  assert.equal(ptsSoon("EIGHTCHR"), true);
  assert.equal(ptsHue("Coppery"), "ivory");
  assert.equal(ptsLength("yes"), 3);
  assert.equal(ptsEven("ab"), true);
  assert.equal(ptsFirst("Paris"), true);
  assert.equal(ptsSpace("needs review"), true);
  assert.equal(ptsVowel("Amsterdam"), true);
  assert.equal(ptsDigit("Room4"), true);
  assert.equal(ptsCapital("PARIS"), true);
  assert.equal(ptsLower("paris"), true);
  assert.equal(ptsUpper("SEALEDXX"), true);
  assert.equal(ptsUpper("HOT"), false);
  assert.equal(ptsUpper("WARM"), false);
  const marks: PtsRow[] = [
    { id: "1", label: "Ada", code: "HOT" },
    { id: "2", label: "Bea", code: "HOT" },
    { id: "3", label: "Cara", code: "Madrid" },
  ];
  assert.equal(leadingSel(marks), "home");
  assert.match(ptsLanesCsv(marks), /home,2/);
  assert.match(ptsRowsCsv(marks, ["1"]), /Ada,HOT/);
  assert.equal(crmv4Text("tr", "gvsTitle"), ROUND357_COPY.tr.gvsTitle);
  assert.equal(crmv4Text("de", "ptsTitle"), ROUND357_COPY.de.ptsTitle);
  assert.equal(crmv4Text("ru", "hcMegaronKicker"), ROUND357_COPY.ru.hcMegaronKicker);
  assert.equal(crmv4Text("ar", "vpPrytaneionLead"), ROUND357_COPY.ar.vpPrytaneionLead);
  const keys = Object.keys(ROUND357_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND357_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-geneva/);
  assert.match(css, /\.c4-ptsplate/);
  assert.match(css, /\.c4-geneva-column/);
  assert.match(css, /\.c4-ptsplate-column/);
  assert.match(css, /\.c4-remind-megaron/);
  assert.match(css, /\.c4-risk-prytaneion/);
  assert.match(css, /\.c4-hc-megaron-mast/);
  assert.match(css, /\.c4-vp-prytaneion-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round357.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /potentialStatus:/);
  assert.match(viewFile, /genevaCsv/);
  assert.match(viewFile, /ptsRowsCsv/);
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
  assert.match(viewFile, /c4-ptsplate-search/);
  assert.match(viewFile, /genevaTimeline/);
  assert.match(viewFile, /c4-geneva-notices/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "gvs"/);
  assert.match(app, /view === "pts"/);
  const tags = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round111.tsx"), "utf8");
  assert.match(tags, /c4-remind-megaron/);
  assert.match(tags, /c4-hc-megaron-mast/);
  assert.match(tags, /data-logo="mono"/);
  assert.match(tags, /hcMegaronKicker/);
  assert.match(tags, /hcMegaronLead/);
  assert.match(tags, /data-remind-megaron/);
  const gallery = tags.slice(tags.indexOf("export function ReminderPolish"), tags.indexOf("export function RiskGlance"));
  assert.equal(gallery.includes("amount"), false);
  assert.equal(gallery.includes("price"), false);
  assert.match(tags, /c4-risk-prytaneion/);
  assert.match(tags, /c4-vp-prytaneion-mast/);
  assert.match(tags, /vpPrytaneionKicker/);
  assert.match(tags, /vpPrytaneionLead/);
  assert.match(tags, /data-risk-prytaneion/);
  const porch = tags.slice(tags.indexOf("export function RiskGlance"));
  assert.equal(porch.includes("currency"), false);
  assert.equal(porch.includes("profit"), false);
  const namedKeys = `${viewFile}\n${tags}`.match(/"(gvs|pts|hcMegaron|vpPrytaneion)[A-Za-z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND357_COPY.en[key as keyof typeof ROUND357_COPY.en], "string", key);
  console.log("crmv4 round357 tests passed");
}

main();
