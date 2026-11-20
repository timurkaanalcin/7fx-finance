/**
 * Keyless rules, role plates, the ivory perch cenaculum, and the graphite watch sacellum.
 * Run: TZ=UTC npx tsx tests/crmv4-round338.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND338_COPY } from "../src/lib/crmv4/copy-round338";
import {
  ROUND338_FEATURES,
  activeFinish,
  activePart,
  activeSpring,
  activeTurn,
  addKeyless,
  roleplateBead,
  roleplateCapital,
  roleplateOwner,
  roleplateDigit,
  roleplateEven,
  roleplateFirst,
  roleplateGap,
  roleplateAdmin,
  roleplateHue,
  roleplateJoin,
  roleplateLane,
  roleplateLanesCsv,
  roleplateLength,
  roleplateLower,
  roleplateOpen,
  roleplatePlain,
  roleplateRibbon,
  roleplateRowsCsv,
  roleplateSoon,
  roleplateSpace,
  roleplateState,
  roleplateAudit,
  roleplateUpper,
  roleplateTrader,
  roleplateVowel,
  keylessBand,
  keylessBeat,
  keylessFilm,
  keylessGap,
  keylessInner,
  keylessLimb,
  keylessOuter,
  keylessRate,
  keylessTimeline,
  briskKeyless,
  dropKeylessView,
  fairWinder,
  fullSpring,
  idleKeyless,
  lateKeyless,
  leadingRoleplate,
  moveKeylessFocus,
  overdueKeyless,
  pairSpring,
  quietFinish,
  readKeylessViews,
  reminderKeylessRules,
  restingKeyless,
  suggestFinish,
  suggestPart,
  suggestTurn,
  type RoleplateRow,
  type Keyless,
} from "../src/lib/crmv4/round338";

function rule(partial: Partial<Keyless> & { id: string; title: string }): Keyless {
  return {
    note: "",
    winder: "",
    limb: "",
    beat: null,
    film: "",
    rate: 3,
    tags: [],
    poised: false,
    pegged: false,
    coffered: false,
    starred: false,
    audit: "",
    ...partial,
  };
}

function main() {
  assert.equal(ROUND338_FEATURES.length, 25);
  assert.equal(ROUND338_FEATURES.includes("role-plate"), true);
  assert.equal(ROUND338_FEATURES.includes("depth-sla"), true);
  assert.equal(ROUND338_FEATURES.includes("fair-winder"), true);
  assert.equal(ROUND338_FEATURES.includes("casket-file"), true);
  assert.equal(ROUND338_FEATURES.includes("stem-notices"), true);
  assert.equal(ROUND338_FEATURES.includes("keyless-search"), true);
  assert.equal(ROUND338_FEATURES.includes("wind-timeline"), true);
  assert.equal(keylessLimb(" stem "), "stem");
  assert.equal(keylessLimb("brass"), "");
  assert.equal(keylessBeat("4"), 4);
  assert.equal(keylessBeat(12), 12);
  assert.equal(keylessBeat(20), 20);
  assert.equal(keylessBeat(28), 28);
  assert.equal(keylessBeat("3"), null);
  assert.equal(keylessBeat("6"), null);
  assert.equal(keylessRate("3"), 3);
  assert.equal(keylessRate(6), 6);
  assert.equal(keylessRate("9"), 9);
  assert.equal(keylessRate("1"), null);
  assert.equal(keylessRate("4"), null);
  assert.equal(keylessFilm("gilt"), "GILT");
  assert.equal(keylessFilm("ivory"), "IVORY");
  assert.equal(keylessFilm("graphite"), "GRAPHITE");
  assert.equal(keylessFilm("hot"), "");
  assert.equal(keylessInner("stem"), true);
  assert.equal(keylessInner("CLUTCH"), true);
  assert.equal(keylessInner("castle"), false);
  assert.equal(keylessOuter("castle"), true);
  assert.equal(keylessOuter("yoke"), true);
  assert.equal(keylessOuter("stem"), false);
  assert.equal(keylessBand("stem"), "shaft");
  assert.equal(keylessBand("clutch"), "slide");
  assert.equal(keylessBand("castle"), "wheel");
  assert.equal(keylessBand("yoke"), "bar");
  assert.equal(keylessGap("stem", "yoke"), 3);
  assert.equal(quietFinish("ivory"), true);
  assert.equal(quietFinish("gilt"), false);
  assert.equal(pairSpring(6), true);
  assert.equal(pairSpring(3), false);
  assert.equal(fullSpring(9), true);
  assert.equal(fullSpring(6), false);
  assert.equal(activePart("inner"), "inner");
  assert.equal(activeTurn("12"), "12");
  assert.equal(activeTurn("8"), "all");
  assert.equal(activeSpring("9"), "9");
  assert.equal(activeSpring("7"), "all");
  assert.equal(activeTurn("6"), "all");
  assert.equal(activeSpring("4"), "all");
  assert.equal(activeFinish("gilt", ["GILT"]), "GILT");
  assert.equal(suggestPart(6), "stem");
  assert.equal(suggestPart(10), "yoke");
  assert.equal(suggestTurn([], 3), 4);
  assert.equal(suggestTurn([], 8), 12);
  assert.equal(suggestTurn([], 14), 20);
  assert.equal(suggestTurn([], 20), 28);
  assert.equal(suggestFinish([]), "IVORY");
  assert.equal(moveKeylessFocus(0, 3, 1), 1);
  assert.equal(moveKeylessFocus(0, 3, -1), 2);
  const late = rule({ id: "a", title: "Ada", limb: "stem" });
  const due = rule({ id: "b", title: "Bea", limb: "castle", rate: 3 });
  const quiet = rule({ id: "c", title: "Cara", beat: 4, rate: 3 });
  const cell = rule({ id: "d", title: "Dora", film: "GILT", beat: 28, rate: 9 });
  const fax = rule({ id: "e", title: "Eve", limb: "yoke", film: "IVORY", beat: 12 });
  assert.equal(lateKeyless(late, "yoke"), true);
  assert.equal(lateKeyless(late, "stem"), false);
  assert.equal(overdueKeyless(due), true);
  assert.equal(idleKeyless(quiet), true);
  assert.equal(briskKeyless(cell), true);
  assert.equal(restingKeyless(fax), true);
  assert.deepEqual(reminderKeylessRules([due, late]), ["Bea"]);
  assert.equal(fairWinder([rule({ id: "1", title: "One", winder: "Ada" }), rule({ id: "2", title: "Two", winder: "Bea" }), rule({ id: "3", title: "Three", winder: "Ada" })], "Ada,Bea"), "Bea");
  const cards = [rule({ id: "1", title: "North", beat: 28 }), rule({ id: "2", title: "East", beat: 10 })];
  assert.match(keylessTimeline(cards).map((lane) => lane.beat).join(","), /28/);
  const saved = addKeyless([], { title: "Ada", limb: "clutch", beat: "12", film: "gilt", rate: "6", tags: "a b x" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].limb, "clutch");
  assert.equal(saved[0].beat, 12);
  assert.equal(saved[0].rate, 6);
  assert.deepEqual(saved[0].tags, ["a", "b"]);
  assert.equal(addKeyless(saved, { title: "Ada" }).length, 1);
  assert.equal(addKeyless([], { title: "Eve" })[0].rate, 3);
  assert.equal(dropKeylessView([{ id: "v", name: "Morning", tray: "board", query: "", winder: "", film: "all", limb: "all", beat: "all", rate: "all" }], "v").length, 0);
  assert.equal(readKeylessViews([{ id: "v", name: "Morning", tray: "peg" }])[0].tray, "peg");

  assert.equal(roleplateTrader("trader"), true);
  assert.equal(roleplateTrader("TRADER"), true);
  assert.equal(roleplateAdmin("ADMIN"), true);
  assert.equal(roleplateOwner("OWNER"), true);
  assert.equal(roleplateAudit("AUDIT"), true);
  assert.equal(roleplateTrader({ role: true }), true);
  assert.equal(roleplatePlain({ role: false }), true);
  assert.equal(roleplateAdmin({ role: false }), false);
  assert.equal(roleplatePlain({ role: "Letter" }), true);
  assert.equal(roleplateTrader({ role: "Letter" }), false);
  assert.equal(roleplateBead({ role: "lead" }), true);
  assert.equal(roleplateJoin("TRADER+ADMIN"), true);
  assert.equal(roleplateJoin("TRADER ADMIN"), false);
  assert.equal(roleplateGap("OWNER;AUDIT"), true);
  assert.equal(roleplateGap("LIVEHOLD"), false);
  assert.equal(roleplateBead("Bead"), true);
  assert.equal(roleplateBead("TRADER"), false);
  assert.equal(roleplateRibbon("Abcdefghijklmnop"), true);
  assert.equal(roleplateRibbon("Amsterdam"), false);
  assert.equal(roleplateLane("TRADER"), "trader");
  assert.equal(roleplateLane("Bead"), "bead");
  assert.equal(roleplateLane("Beadname"), "plain");
  assert.equal(roleplateLane("Letter"), "plain");
  assert.equal(roleplateLane("10language"), "mark");
  assert.equal(roleplateLane("Amsterdam"), "vowel");
  assert.equal(roleplateOpen(""), true);
  assert.equal(roleplateOpen({ role: "" }), true);
  assert.equal(roleplateState({ name: "Ada" }), "");
  assert.equal(roleplateState({ role: "Paris", balance: 1 }), "");
  assert.equal(roleplateHue("TRADER"), "champagne");
  assert.equal(roleplateHue("TRADER+ADMIN"), "graphite");
  assert.equal(roleplateHue("OWNER"), "champagne");
  assert.equal(roleplateSoon("Bead"), true);
  assert.equal(roleplateSoon("TRADER"), false);
  assert.equal(roleplateSoon("Amsterdam"), true);
  assert.equal(roleplateHue("Letter"), "ivory");
  assert.equal(roleplateLength("turk"), 4);
  assert.equal(roleplateEven("turk"), true);
  assert.equal(roleplateFirst("Paris"), true);
  assert.equal(roleplateSpace("needs review"), true);
  assert.equal(roleplateVowel("Amsterdam"), true);
  assert.equal(roleplateDigit("Room4"), true);
  assert.equal(roleplateCapital("PARIS"), true);
  assert.equal(roleplateLower("paris"), true);
  assert.equal(roleplateUpper("PEARLS"), true);
  assert.equal(roleplateUpper("TURK"), false);
  assert.equal(roleplateUpper("TRADER"), true);
  assert.equal(roleplateUpper("ADMIN"), false);
  const marks: RoleplateRow[] = [
    { id: "1", label: "Ada", code: "TRADER" },
    { id: "2", label: "Bea", code: "TRADER" },
    { id: "3", label: "Cara", code: "Paris" },
  ];
  assert.equal(leadingRoleplate(marks), "trader");
  assert.match(roleplateLanesCsv(marks), /trader,2/);
  assert.match(roleplateRowsCsv(marks, ["1"]), /Ada,TRADER/);
  assert.equal(crmv4Text("tr", "klwTitle"), ROUND338_COPY.tr.klwTitle);
  assert.equal(crmv4Text("de", "rlpTitle"), ROUND338_COPY.de.rlpTitle);
  assert.equal(crmv4Text("ru", "avpCenaculumKicker"), ROUND338_COPY.ru.avpCenaculumKicker);
  assert.equal(crmv4Text("ar", "pswSacellumLead"), ROUND338_COPY.ar.pswSacellumLead);
  const keys = Object.keys(ROUND338_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND338_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-keyless/);
  assert.match(css, /\.c4-roleplate/);
  assert.match(css, /\.c4-keyless-column/);
  assert.match(css, /\.c4-roleplate-column/);
  assert.match(css, /\.c4-avp-cenaculum/);
  assert.match(css, /\.c4-psw-sacellum/);
  assert.match(css, /\.c4-avp-cenaculum-mast/);
  assert.match(css, /\.c4-psw-sacellum-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round338.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /role:/);
  assert.match(viewFile, /keylessCsv/);
  assert.match(viewFile, /roleplateRowsCsv/);
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
  assert.match(viewFile, /c4-roleplate-search/);
  assert.match(viewFile, /keylessTimeline/);
  assert.match(viewFile, /c4-keyless-notices/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "klw"/);
  assert.match(app, /view === "rlp"/);
  const host = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round158.tsx"), "utf8");
  assert.match(host, /c4-avp-cenaculum/);
  assert.match(host, /c4-avp-cenaculum-mast/);
  assert.match(host, /data-logo="mono"/);
  assert.match(host, /avpCenaculumKicker/);
  assert.match(host, /avpCenaculumLead/);
  assert.match(host, /data-perches/);
  assert.equal(host.includes("amount"), false);
  assert.match(host, /c4-psw-sacellum/);
  assert.match(host, /c4-psw-sacellum-mast/);
  assert.match(host, /pswSacellumKicker/);
  assert.match(host, /pswSacellumLead/);
  assert.match(host, /data-watches/);
  assert.equal(host.includes("currency"), false);
  assert.equal(host.includes("saleStatus"), false);
  const namedKeys = `${viewFile}\n${host}`.match(/"(klw|rlp|avpCenaculum|pswSacellum)[A-Za-z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND338_COPY.en[key as keyof typeof ROUND338_COPY.en], "string", key);
  console.log("crmv4 round338 tests passed");
}

main();
