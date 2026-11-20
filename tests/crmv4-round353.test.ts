/**
 * Fusee rules, broker plates, the ivory tag pinakotheke, and the graphite side stoa.
 * Run: TZ=UTC npx tsx tests/crmv4-round353.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND353_COPY } from "../src/lib/crmv4/copy-round353";
import {
  ROUND353_FEATURES,
  activeFinish,
  activeMode,
  activeHour,
  activeHammer,
  addFusee,
  briskFusee,
  dropFuseeView,
  fairKeeper,
  hbkHome,
  hbkBrief,
  hbkCapital,
  hbkDigit,
  hbkEven,
  hbkFirst,
  hbkRoute,
  hbkHue,
  hbkJoin,
  hbkCitizen,
  hbkLane,
  hbkLanesCsv,
  hbkLength,
  hbkLower,
  hbkGuest,
  hbkAway,
  hbkOpen,
  hbkPlain,
  hbkLong,
  hbkRowsCsv,
  hbkSoon,
  hbkSpace,
  hbkState,
  hbkUpper,
  hbkVowel,
  hbkDesk,
  fullHammer,
  idleFusee,
  lateFusee,
  leadingBrk,
  moveFuseeFocus,
  fuseeBand,
  fuseeHour,
  fuseeGap,
  fuseeInner,
  fuseeMode,
  fuseeOuter,
  fuseeHammer,
  fuseeFilm,
  fuseeTimeline,
  overdueFusee,
  pairHammer,
  quietFinish,
  readFuseeViews,
  reminderFusees,
  restingFusee,
  suggestFinish,
  suggestMode,
  suggestHour,
  type BrkRow,
  type Fusee,
} from "../src/lib/crmv4/round353";

function rule(partial: Partial<Fusee> & { id: string; title: string }): Fusee {
  return {
    note: "",
    setter: "",
    piece: "",
    drop: null,
    film: "",
    lock: 2,
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
  assert.equal(ROUND353_FEATURES.length, 25);
  assert.equal(ROUND353_FEATURES.includes("broker-plate"), true);
  assert.equal(ROUND353_FEATURES.includes("fusee-pin-sla"), true);
  assert.equal(ROUND353_FEATURES.includes("fair-warden"), true);
  assert.equal(ROUND353_FEATURES.includes("cone-archive"), true);
  assert.equal(ROUND353_FEATURES.includes("cone-reminders"), true);
  assert.equal(ROUND353_FEATURES.includes("fusee-search"), true);
  assert.equal(ROUND353_FEATURES.includes("cone-timeline"), true);
  assert.equal(fuseeMode(" cone "), "cone");
  assert.equal(fuseeMode("brass"), "");
  assert.equal(fuseeHour("4"), 4);
  assert.equal(fuseeHour(8), 8);
  assert.equal(fuseeHour(16), 16);
  assert.equal(fuseeHour(32), 32);
  assert.equal(fuseeHour("6"), null);
  assert.equal(fuseeHour("12"), null);
  assert.equal(fuseeHammer("2"), 2);
  assert.equal(fuseeHammer(4), 4);
  assert.equal(fuseeHammer("8"), 8);
  assert.equal(fuseeHammer("1"), null);
  assert.equal(fuseeHammer("3"), null);
  assert.equal(fuseeFilm("gilt"), "GILT");
  assert.equal(fuseeFilm("ivory"), "IVORY");
  assert.equal(fuseeFilm("graphite"), "GRAPHITE");
  assert.equal(fuseeFilm("hot"), "");
  assert.equal(fuseeInner("cone"), true);
  assert.equal(fuseeInner("CHAIN"), true);
  assert.equal(fuseeInner("snail"), false);
  assert.equal(fuseeOuter("snail"), true);
  assert.equal(fuseeOuter("stop"), true);
  assert.equal(fuseeOuter("cone"), false);
  assert.equal(fuseeBand("cone"), "taper");
  assert.equal(fuseeBand("chain"), "link");
  assert.equal(fuseeBand("snail"), "cam");
  assert.equal(fuseeBand("stop"), "hook");
  assert.equal(fuseeGap("cone", "stop"), 3);
  assert.equal(quietFinish("ivory"), true);
  assert.equal(quietFinish("gilt"), false);
  assert.equal(pairHammer(4), true);
  assert.equal(pairHammer(2), false);
  assert.equal(fullHammer(8), true);
  assert.equal(fullHammer(4), false);
  assert.equal(activeMode("inner"), "inner");
  assert.equal(activeHour("16"), "16");
  assert.equal(activeHour("7"), "all");
  assert.equal(activeHammer("8"), "8");
  assert.equal(activeHammer("3"), "all");
  assert.equal(activeFinish("gilt", ["GILT"]), "GILT");
  assert.equal(suggestMode(4), "cone");
  assert.equal(suggestMode(10), "stop");
  assert.equal(suggestHour([], 3), 4);
  assert.equal(suggestHour([], 8), 8);
  assert.equal(suggestHour([], 14), 16);
  assert.equal(suggestHour([], 20), 32);
  assert.equal(suggestFinish([]), "IVORY");
  assert.equal(moveFuseeFocus(0, 3, 1), 1);
  assert.equal(moveFuseeFocus(0, 3, -1), 2);
  const late = rule({ id: "a", title: "Ada", piece: "cone" });
  const due = rule({ id: "b", title: "Bea", piece: "snail", lock: 2 });
  const quiet = rule({ id: "c", title: "Cara", drop: 4, lock: 2 });
  const cell = rule({ id: "d", title: "Dora", film: "GILT", drop: 32, lock: 8 });
  const fax = rule({ id: "e", title: "Eve", piece: "stop", film: "IVORY", drop: 8 });
  assert.equal(lateFusee(late, "stop"), true);
  assert.equal(lateFusee(late, "cone"), false);
  assert.equal(overdueFusee(due), true);
  assert.equal(idleFusee(quiet), true);
  assert.equal(briskFusee(cell), true);
  assert.equal(restingFusee(fax), true);
  assert.deepEqual(reminderFusees([due, late]), ["Bea"]);
  assert.equal(fairKeeper([rule({ id: "1", title: "One", setter: "Ada" }), rule({ id: "2", title: "Two", setter: "Bea" }), rule({ id: "3", title: "Three", setter: "Ada" })], "Ada,Bea"), "Bea");
  const cards = [rule({ id: "1", title: "North", drop: 16 }), rule({ id: "2", title: "East", drop: 8 })];
  assert.match(fuseeTimeline(cards).map((mail) => mail.drop).join(","), /16/);
  const saved = addFusee([], { title: "Ada", piece: "chain", drop: "8", film: "gilt", lock: "4", tags: "c n x" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].piece, "chain");
  assert.equal(saved[0].drop, 8);
  assert.equal(saved[0].lock, 4);
  assert.deepEqual(saved[0].tags, ["c", "n"]);
  assert.equal(addFusee(saved, { title: "Ada" }).length, 1);
  assert.equal(addFusee([], { title: "Eve" })[0].lock, 2);
  assert.equal(dropFuseeView([{ id: "v", name: "Morning", tray: "board", query: "", setter: "", film: "all", piece: "all", drop: "all", lock: "all" }], "v").length, 0);
  assert.equal(readFuseeViews([{ id: "v", name: "Morning", tray: "peg" }])[0].tray, "peg");

  assert.equal(hbkHome("SAX"), true);
  assert.equal(hbkHome("SAXO"), true);
  assert.equal(hbkHome("BROKER_SAX"), true);
  assert.equal(hbkAway("OPEN"), true);
  assert.equal(hbkGuest("FXC"), true);
  assert.equal(hbkGuest("FXCM"), true);
  assert.equal(hbkCitizen("ADX"), true);
  assert.equal(hbkCitizen("ADMIRAL"), true);
  assert.equal(hbkDesk("ICM"), true);
  assert.equal(hbkDesk("BROKER_ICM"), true);
  assert.equal(hbkHome({ brokerName: true }), true);
  assert.equal(hbkPlain({ brokerName: false }), false);
  assert.equal(hbkAway({ brokerName: false }), true);
  assert.equal(hbkPlain({ brokerName: "Letter" }), true);
  assert.equal(hbkHome({ brokerName: "Letter" }), false);
  assert.equal(hbkBrief({ brokerName: "NOTE" }), true);
  assert.equal(hbkJoin("SAX&ICM"), true);
  assert.equal(hbkJoin("ANNA NOAH"), false);
  assert.equal(hbkRoute("SAX|ICM"), true);
  assert.equal(hbkRoute("LIVEHOLD"), false);
  assert.equal(hbkBrief("NOTE"), true);
  assert.equal(hbkBrief("SAX"), false);
  assert.equal(hbkLong("SixteenCharacter"), true);
  assert.equal(hbkLong("20261120T0730Z"), false);
  assert.equal(hbkLane("SAX"), "home");
  assert.equal(hbkLane("SAXO"), "home");
  assert.equal(hbkLane("ICM"), "desk");
  assert.equal(hbkLane("FXC"), "hold");
  assert.equal(hbkLane("ADX"), "guest");
  assert.equal(hbkLane("Letter"), "plain");
  assert.equal(hbkLane("20261120T0730Z"), "stamp");
  assert.equal(hbkLane("Amsterdam"), "vowel");
  assert.equal(hbkOpen(""), true);
  assert.equal(hbkOpen({ brokerName: "" }), true);
  assert.equal(hbkState({ name: "Ada" }), "");
  assert.equal(hbkState({ brokerName: "Paris", balance: 1 }), "");
  assert.equal(hbkHue("SAX"), "champagne");
  assert.equal(hbkHue("SAX&ICM"), "graphite");
  assert.equal(hbkHue("FXC"), "champagne");
  assert.equal(hbkHue("ICM"), "graphite");
  assert.equal(hbkSoon("NOTE"), true);
  assert.equal(hbkSoon("SAX"), false);
  assert.equal(hbkSoon("ROOMS"), true);
  assert.equal(hbkHue("Letter"), "ivory");
  assert.equal(hbkLength("yes"), 3);
  assert.equal(hbkEven("ab"), true);
  assert.equal(hbkFirst("Paris"), true);
  assert.equal(hbkSpace("needs review"), true);
  assert.equal(hbkVowel("Amsterdam"), true);
  assert.equal(hbkDigit("Room4"), true);
  assert.equal(hbkCapital("PARIS"), true);
  assert.equal(hbkLower("paris"), true);
  assert.equal(hbkUpper("ADMIRAL"), true);
  assert.equal(hbkUpper("SAX"), false);
  assert.equal(hbkUpper("SAXO"), false);
  const marks: BrkRow[] = [
    { id: "1", label: "Ada", code: "SAX" },
    { id: "2", label: "Bea", code: "SAX" },
    { id: "3", label: "Cara", code: "Madrid" },
  ];
  assert.equal(leadingBrk(marks), "home");
  assert.match(hbkLanesCsv(marks), /home,2/);
  assert.match(hbkRowsCsv(marks, ["1"]), /Ada,SAX/);
  assert.equal(crmv4Text("tr", "fusTitle"), ROUND353_COPY.tr.fusTitle);
  assert.equal(crmv4Text("de", "hbkTitle"), ROUND353_COPY.de.hbkTitle);
  assert.equal(crmv4Text("ru", "qaPinakothekeKicker"), ROUND353_COPY.ru.qaPinakothekeKicker);
  assert.equal(crmv4Text("ar", "ysStoaLead"), ROUND353_COPY.ar.ysStoaLead);
  const keys = Object.keys(ROUND353_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND353_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-fusee/);
  assert.match(css, /\.c4-hbkplate/);
  assert.match(css, /\.c4-fusee-column/);
  assert.match(css, /\.c4-hbkplate-column/);
  assert.match(css, /\.c4-color-pinakotheke/);
  assert.match(css, /\.c4-trade-stoa/);
  assert.match(css, /\.c4-qa-pinakotheke-mast/);
  assert.match(css, /\.c4-ys-stoa-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round353.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /brokerName:/);
  assert.match(viewFile, /fuseeCsv/);
  assert.match(viewFile, /hbkRowsCsv/);
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
  assert.match(viewFile, /c4-hbkplate-search/);
  assert.match(viewFile, /fuseeTimeline/);
  assert.match(viewFile, /c4-fusee-notices/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "fus"/);
  assert.match(app, /view === "hbk"/);
  const tags = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round106.tsx"), "utf8");
  assert.match(tags, /c4-color-pinakotheke/);
  assert.match(tags, /c4-qa-pinakotheke-mast/);
  assert.match(tags, /data-logo="mono"/);
  assert.match(tags, /qaPinakothekeKicker/);
  assert.match(tags, /qaPinakothekeLead/);
  assert.match(tags, /data-tag-gallery/);
  const gallery = tags.slice(tags.indexOf("export function ColorTags"), tags.indexOf("export function TradeSide"));
  assert.equal(gallery.includes("amount"), false);
  assert.equal(gallery.includes("price"), false);
  assert.match(tags, /c4-trade-stoa/);
  assert.match(tags, /c4-ys-stoa-mast/);
  assert.match(tags, /ysStoaKicker/);
  assert.match(tags, /ysStoaLead/);
  assert.match(tags, /data-trade-colonnade/);
  const colonnade = tags.slice(tags.indexOf("export function TradeSide"));
  assert.equal(colonnade.includes("currency"), false);
  assert.equal(colonnade.includes("profit"), false);
  const namedKeys = `${viewFile}\n${tags}`.match(/"(fus|hbk|qaPinakotheke|ysStoa)[A-Za-z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND353_COPY.en[key as keyof typeof ROUND353_COPY.en], "string", key);
  console.log("crmv4 round353 tests passed");
}

main();
