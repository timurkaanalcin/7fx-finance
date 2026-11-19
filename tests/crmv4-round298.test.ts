/**
 * Groma crosses, zone plates, the ivory country cloister, and the graphite tongue nave.
 * Run: TZ=UTC npx tsx tests/crmv4-round298.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND298_COPY } from "../src/lib/crmv4/copy-round298";
import {
  ROUND298_FEATURES,
  activeArm,
  activeCord,
  activeFinish,
  activeSpan,
  addGroma,
  armGap,
  briskGroma,
  dropGromaView,
  fairGromaRodman,
  fullCord,
  gromaArm,
  gromaBand,
  gromaCord,
  gromaFinish,
  gromaSpan,
  houseFinish,
  idleGroma,
  innerArm,
  lateGroma,
  leadingZone,
  liftSpan,
  lowerSpan,
  moveGromaFocus,
  outerArm,
  overdueGroma,
  pairCord,
  readGromaViews,
  restingGroma,
  suggestArm,
  suggestGromaFinish,
  suggestSpan,
  zoneCapital,
  zoneDigit,
  zoneEven,
  zoneFirst,
  zoneHouse,
  zoneHue,
  zoneJoin,
  zoneLane,
  zoneLanesCsv,
  zoneLength,
  zoneNest,
  zoneRegion,
  zoneRowsCsv,
  zoneSoon,
  zoneSpace,
  zoneState,
  zoneTail,
  zoneVowel,
  type Groma,
  type ZoneRow,
} from "../src/lib/crmv4/round298";

function cross(partial: Partial<Groma> & { id: string; title: string }): Groma {
  return {
    note: "",
    rodman: "",
    arm: "",
    span: null,
    finish: "",
    cord: 2,
    tags: [],
    squared: false,
    chested: false,
    crypt: false,
    flagged: false,
    audit: "",
    ...partial,
  };
}

function main() {
  assert.equal(ROUND298_FEATURES.length, 25);
  assert.equal(ROUND298_FEATURES.includes("zone"), true);
  assert.equal(ROUND298_FEATURES.includes("span"), true);
  assert.equal(ROUND298_FEATURES.includes("fair-rodman"), true);
  assert.equal(gromaArm(" cardo "), "cardo");
  assert.equal(gromaArm("brass"), "");
  assert.equal(gromaSpan("4"), 4);
  assert.equal(gromaSpan(8), 8);
  assert.equal(gromaSpan("12"), 12);
  assert.equal(gromaSpan("16"), 16);
  assert.equal(gromaSpan("6"), null);
  assert.equal(gromaCord("2"), 2);
  assert.equal(gromaCord(4), 4);
  assert.equal(gromaCord("6"), 6);
  assert.equal(gromaCord("3"), null);
  assert.equal(gromaFinish("ivory"), "IVORY");
  assert.equal(gromaFinish("graphite"), "GRAPHITE");
  assert.equal(gromaFinish("champagne"), "CHAMPAGNE");
  assert.equal(gromaFinish("hot"), "");
  assert.equal(innerArm("cardo"), true);
  assert.equal(innerArm("DECUMANUS"), true);
  assert.equal(innerArm("bias"), false);
  assert.equal(outerArm("skew"), true);
  assert.equal(outerArm("bias"), true);
  assert.equal(outerArm("cardo"), false);
  assert.equal(gromaBand("cardo"), "meridian");
  assert.equal(gromaBand("decumanus"), "street");
  assert.equal(gromaBand("bias"), "slant");
  assert.equal(gromaBand("skew"), "oblique");
  assert.equal(gromaBand(""), "");
  assert.equal(armGap("cardo", "skew"), 3);
  assert.equal(armGap("bias", "nope"), null);
  assert.equal(houseFinish("graphite"), true);
  assert.equal(houseFinish("ivory"), false);
  assert.equal(pairCord(4), true);
  assert.equal(pairCord(2), false);
  assert.equal(fullCord("6"), true);
  assert.equal(fullCord(4), false);
  assert.equal(activeArm("inner"), "inner");
  assert.equal(activeArm("skew"), "skew");
  assert.equal(activeArm("gold"), "all");
  assert.equal(activeSpan("16"), "16");
  assert.equal(activeSpan("6"), "all");
  assert.equal(activeCord("2"), "2");
  assert.equal(activeCord("3"), "all");
  assert.equal(activeFinish("champagne", ["CHAMPAGNE"]), "CHAMPAGNE");
  assert.equal(activeFinish("hot", ["CHAMPAGNE"]), "all");
  assert.equal(moveGromaFocus(0, 3, -1), 2);
  assert.equal(moveGromaFocus(0, 0, 1), 0);

  const cards = [
    cross({ id: "a", title: "Ada", arm: "bias", cord: 2, rodman: "Ned" }),
    cross({ id: "b", title: "Bea", arm: "cardo", finish: "CHAMPAGNE", span: 16, cord: 6, rodman: "Ned" }),
    cross({ id: "c", title: "Cara", arm: "skew", finish: "IVORY", span: 8, rodman: "Ida" }),
  ];
  assert.equal(overdueGroma(cards[0]), true);
  assert.equal(briskGroma(cards[1]), true);
  assert.equal(restingGroma(cards[2]), true);
  assert.equal(idleGroma(cross({ id: "i", title: "Idle", span: 4, cord: 2 })), true);
  assert.equal(lateGroma(cards[1], "skew"), true);
  assert.equal(lateGroma(cards[1], "cardo"), false);
  assert.equal(suggestGromaFinish([]), "IVORY");
  assert.equal(suggestGromaFinish(cards), "GRAPHITE");
  assert.equal(suggestGromaFinish([
    ...cards,
    cross({ id: "d", title: "Dora", finish: "IVORY" }),
    cross({ id: "e", title: "Eve", finish: "IVORY" }),
    cross({ id: "f", title: "Fay", finish: "GRAPHITE" }),
    cross({ id: "g", title: "Gia", finish: "GRAPHITE" }),
  ]), "CHAMPAGNE");
  assert.equal(suggestSpan([], 3), 4);
  assert.equal(suggestSpan([], 9), 8);
  assert.equal(suggestSpan([], 14), 12);
  assert.equal(suggestSpan([], 20), 16);
  assert.equal(suggestSpan([cross({ id: "w", title: "Wide", span: 16 })], 3), 4);
  assert.equal(suggestSpan([
    cross({ id: "p", title: "P", span: 4 }),
    cross({ id: "q", title: "Q", span: 4 }),
    cross({ id: "r", title: "R", span: 8 }),
    cross({ id: "s", title: "S", span: 8 }),
    cross({ id: "t", title: "T", span: 12 }),
    cross({ id: "u", title: "U", span: 12 }),
    cross({ id: "v", title: "V", span: 16 }),
  ], 3), 16);
  assert.equal(suggestArm(8), "cardo");
  assert.equal(suggestArm(11), "skew");
  assert.equal(fairGromaRodman(cards, "Ned,Ida"), "Ida");
  const added = addGroma(cards, { title: "Dora", arm: "decumanus", span: "8", cord: "4", tags: "a b t" });
  assert.equal(added.length, 4);
  assert.equal(added[3].audit, "save");
  assert.deepEqual(added[3].tags, ["a", "b"]);
  assert.equal(addGroma(cards, { title: "Ada" }).length, 3);
  const lifted = liftSpan(cards, "a");
  assert.equal(lifted[0].span, 4);
  assert.equal(lowerSpan(lifted, "a")[0].span, 16);
  assert.equal(dropGromaView([{ id: "v", name: "Desk", tray: "yard", query: "", rodman: "", finish: "all", arm: "all", span: "all", cord: "all" }], "v").length, 0);
  assert.equal(readGromaViews([{ id: "", name: "x" }]).length, 0);

  assert.equal(zoneLane("UTC"), "mark");
  assert.equal(zoneLane("Asia/Aden"), "spark");
  assert.equal(zoneLane("America/New_York"), "join");
  assert.equal(zoneLane("America/Argentina/Buenos_Aires"), "nest");
  assert.equal(zoneLane("Europe/Istanbul"), "house");
  assert.equal(zoneLane("Europe/Berlin"), "post");
  assert.equal(zoneLane(""), "");
  assert.equal(zoneState(""), "clear");
  assert.equal(zoneState({ city: "x" }), "");
  assert.equal(zoneState({ timezone: "Europe/Berlin", amount: 3 }), "");
  assert.equal(zoneState({ timezone: "Europe/Berlin" }), "set");
  assert.equal(zoneHue("UTC"), "champagne");
  assert.equal(zoneHue("Europe/Berlin"), "ivory");
  assert.equal(zoneHue("America/New_York"), "graphite");
  assert.equal(zoneSoon("UTC"), true);
  assert.equal(zoneSoon("Asia/Aden"), true);
  assert.equal(zoneSoon("Europe/Berlin"), false);
  assert.equal(zoneLength("Europe/Berlin"), 6);
  assert.equal(zoneLength(""), null);
  assert.equal(zoneEven("Asia/Aden"), true);
  assert.equal(zoneEven("UTC"), false);
  assert.equal(zoneFirst("Europe/Berlin"), true);
  assert.equal(zoneFirst("Etc/3Berlin"), false);
  assert.equal(zoneTail("Etc/GMT+3"), true);
  assert.equal(zoneTail("Europe/Berlin"), false);
  assert.equal(zoneCapital("Europe/Berlin"), true);
  assert.equal(zoneCapital("europe/berlin"), false);
  assert.equal(zoneSpace("Europe/New York"), true);
  assert.equal(zoneVowel("Europe/Istanbul"), true);
  assert.equal(zoneVowel("Europe/Berlin"), false);
  assert.equal(zoneDigit("Etc/GMT+3"), true);
  assert.equal(zoneHouse("Europe/Istanbul"), true);
  assert.equal(zoneJoin("America/New_York"), true);
  assert.equal(zoneNest("America/Argentina/Buenos_Aires"), true);
  assert.equal(zoneRegion("Europe/Berlin"), "Europe");
  const rows: ZoneRow[] = [
    { id: "1", label: "Ada", handle: "UTC" },
    { id: "2", label: "Bea", handle: "Europe/Berlin" },
  ];
  assert.equal(leadingZone(rows), "mark");
  assert.match(zoneLanesCsv(rows), /mark,1/);
  assert.match(zoneLanesCsv(rows), /post,1/);
  assert.match(zoneRowsCsv(rows, ["1"]), /Ada,UTC/);

  const locales = ["en", "tr", "de", "ru", "ar"] as const;
  const keys = Object.keys(ROUND298_COPY.en).sort();
  for (const locale of locales) assert.deepEqual(Object.keys(ROUND298_COPY[locale]).sort(), keys);
  assert.equal(crmv4Text("tr", "grmTitle"), ROUND298_COPY.tr.grmTitle);
  assert.equal(crmv4Text("de", "znpTitle"), ROUND298_COPY.de.znpTitle);
  assert.equal(crmv4Text("ru", "grmSub"), ROUND298_COPY.ru.grmSub);
  assert.equal(crmv4Text("ar", "znpSub"), ROUND298_COPY.ar.znpSub);
  assert.equal(crmv4Text("en", "grmLogo"), "7FX");
  assert.equal(crmv4Text("en", "znpLogo"), "7FX");
  assert.equal(crmv4Text("en", "grmTitle"), "Groma crosses");
  assert.equal(crmv4Text("en", "znpTitle"), "Zone plates");
  assert.equal(crmv4Text("en", "cyCloisterKicker"), "Ivory country cloister");
  assert.equal(crmv4Text("en", "lgNaveKicker"), "Graphite tongue nave");
  assert.notEqual(ROUND298_COPY.tr.grmTitle, ROUND298_COPY.en.grmTitle);
  assert.notEqual(ROUND298_COPY.ar.znpTitle, ROUND298_COPY.en.znpTitle);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-groma/);
  assert.match(css, /\.c4-zone-index/);
  assert.match(css, /\.c4-groma-column/);
  assert.match(css, /\.c4-zone-column/);
  assert.match(css, /\.c4-country-cloister/);
  assert.match(css, /\.c4-tongue-nave-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round298.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /timezone:/);
  assert.match(viewFile, /gromaCsv/);
  assert.match(viewFile, /zoneRowsCsv/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "x"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=24&meta=0&role=TRADER/);
  assert.match(viewFile, /data-cards/);
  assert.match(viewFile, /data-plates/);
  assert.match(viewFile, /data-names/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestGromaFinish/);
  assert.match(viewFile, /c4-zone-search/);
  assert.match(viewFile, /gromaTimeline/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "grm"/);
  assert.match(app, /view === "znp"/);
  const country = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round89.tsx"), "utf8");
  assert.match(country, /c4-country-cloister/);
  assert.match(country, /c4-country-cloister-mast/);
  assert.match(country, /data-logo="mono"/);
  assert.match(country, /cyCloisterKicker/);
  assert.match(country, /cyCloisterLead/);
  assert.match(country, /data-country-glance/);
  assert.equal(country.includes("amount"), false);
  assert.equal(country.includes("profit"), false);
  const nave = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round99.tsx"), "utf8");
  assert.match(nave, /c4-tongue-nave/);
  assert.match(nave, /c4-tongue-nave-mast/);
  assert.match(nave, /lgNaveKicker/);
  assert.match(nave, /lgNaveLead/);
  assert.match(nave, /data-lang-glance/);
  assert.equal(nave.includes("amount"), false);
  assert.equal(nave.includes("profit"), false);
  const named = `${viewFile}\n${country}\n${nave}`.match(/"(grm|znp|cyCloister|lgNave)[a-zA-Z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of named) assert.equal(typeof ROUND298_COPY.en[key as keyof typeof ROUND298_COPY.en], "string", key);
  console.log("crmv4 round298 tests passed");
}

main();
