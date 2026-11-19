/**
 * Navicula dials, haven plates, the ivory symbol oratory, and the graphite ticket gallery.
 * Run: TZ=UTC npx tsx tests/crmv4-round301.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND301_COPY } from "../src/lib/crmv4/copy-round301";
import {
  ROUND301_FEATURES,
  activeHour,
  activeLatitude,
  activeStation,
  activeWood,
  addNavicula,
  briskNav,
  dropNavView,
  fairPilot,
  fullHour,
  havenCapital,
  havenCoast,
  havenDigit,
  havenEven,
  havenFirst,
  havenHue,
  havenLane,
  havenLanesCsv,
  havenLength,
  havenLower,
  havenMark,
  havenPair,
  havenRowsCsv,
  havenShort,
  havenSpace,
  havenState,
  havenTail,
  havenUnion,
  havenUpper,
  havenVowel,
  houseWood,
  idleNav,
  lateNav,
  leadingHaven,
  moveNavFocus,
  navBand,
  navGap,
  navHour,
  navInner,
  navLatitude,
  navOuter,
  navStation,
  navWood,
  overdueNav,
  pairHour,
  readNavViews,
  restingNav,
  suggestLatitude,
  suggestStation,
  suggestWood,
  type HavenRow,
  type Navicula,
} from "../src/lib/crmv4/round301";

function dial(partial: Partial<Navicula> & { id: string; title: string }): Navicula {
  return {
    note: "",
    pilot: "",
    station: "",
    latitude: null,
    wood: "",
    hour: 3,
    tags: [],
    laid: false,
    locked: false,
    held: false,
    starred: false,
    audit: "",
    ...partial,
  };
}

function main() {
  assert.equal(ROUND301_FEATURES.length, 25);
  assert.equal(ROUND301_FEATURES.includes("haven"), true);
  assert.equal(ROUND301_FEATURES.includes("latitude"), true);
  assert.equal(ROUND301_FEATURES.includes("fair-pilot"), true);
  assert.equal(navStation(" prow "), "prow");
  assert.equal(navStation("brass"), "");
  assert.equal(navLatitude("15"), 15);
  assert.equal(navLatitude(30), 30);
  assert.equal(navLatitude("45"), 45);
  assert.equal(navLatitude("60"), 60);
  assert.equal(navLatitude("8"), null);
  assert.equal(navHour("3"), 3);
  assert.equal(navHour(6), 6);
  assert.equal(navHour("9"), 9);
  assert.equal(navHour("4"), null);
  assert.equal(navWood("oak"), "OAK");
  assert.equal(navWood("ash"), "ASH");
  assert.equal(navWood("yew"), "YEW");
  assert.equal(navWood("hot"), "");
  assert.equal(navInner("prow"), true);
  assert.equal(navInner("HULL"), true);
  assert.equal(navInner("mast"), false);
  assert.equal(navOuter("stern"), true);
  assert.equal(navOuter("mast"), true);
  assert.equal(navOuter("prow"), false);
  assert.equal(navBand("prow"), "bow");
  assert.equal(navBand("hull"), "keel");
  assert.equal(navBand("mast"), "spar");
  assert.equal(navBand("stern"), "wake");
  assert.equal(navBand(""), "");
  assert.equal(navGap("prow", "stern"), 3);
  assert.equal(navGap("mast", "nope"), null);
  assert.equal(houseWood("oak"), true);
  assert.equal(houseWood("ash"), false);
  assert.equal(pairHour(6), true);
  assert.equal(pairHour(3), false);
  assert.equal(fullHour("9"), true);
  assert.equal(fullHour(6), false);
  assert.equal(activeStation("inner"), "inner");
  assert.equal(activeStation("stern"), "stern");
  assert.equal(activeStation("gold"), "all");
  assert.equal(activeLatitude("60"), "60");
  assert.equal(activeLatitude("8"), "all");
  assert.equal(activeHour("3"), "3");
  assert.equal(activeHour("4"), "all");
  assert.equal(activeWood("yew", ["YEW"]), "YEW");
  assert.equal(activeWood("hot", ["YEW"]), "all");
  assert.equal(moveNavFocus(0, 3, -1), 2);
  assert.equal(moveNavFocus(0, 0, 1), 0);

  const cards = [
    dial({ id: "a", title: "Ada", station: "mast", hour: 3, pilot: "Ned" }),
    dial({ id: "b", title: "Bea", station: "prow", wood: "YEW", latitude: 60, hour: 9, pilot: "Ned" }),
    dial({ id: "c", title: "Cara", station: "stern", wood: "OAK", latitude: 30, pilot: "Ida" }),
  ];
  assert.equal(overdueNav(cards[0]), true);
  assert.equal(briskNav(cards[1]), true);
  assert.equal(restingNav(cards[2]), true);
  assert.equal(idleNav(dial({ id: "i", title: "Idle", latitude: 15, hour: 3 })), true);
  assert.equal(lateNav(cards[1], "stern"), true);
  assert.equal(lateNav(cards[1], "prow"), false);
  assert.equal(suggestWood([]), "YEW");
  assert.equal(suggestWood(cards), "ASH");
  assert.equal(suggestLatitude([], 7), 15);
  assert.equal(suggestLatitude([], 10), 30);
  assert.equal(suggestLatitude([], 15), 45);
  assert.equal(suggestLatitude([], 20), 60);
  assert.equal(suggestStation(9), "prow");
  assert.equal(suggestStation(12), "stern");
  assert.equal(fairPilot(cards, "Ida, Ned"), "Ida");
  const saved = addNavicula([], { id: "n1", title: "Noon", station: "hull", wood: "ash", latitude: "30", hour: "6", tags: "a b c" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].wood, "ASH");
  assert.equal(saved[0].hour, 6);
  assert.deepEqual(saved[0].tags, ["a", "b"]);
  assert.equal(addNavicula(saved, { title: "Noon" }).length, 1);
  const views = readNavViews([{ id: "v1", name: "Morning", tray: "locker", query: "noon", pilot: "Ned", wood: "ASH", station: "inner", latitude: "30", hour: "6" }]);
  assert.equal(views[0].tray, "locker");
  assert.equal(views[0].station, "inner");
  assert.equal(dropNavView(views, "v1").length, 0);

  assert.equal(havenState("Spain"), "set");
  assert.equal(havenState(""), "clear");
  assert.equal(havenState({ name: "Ada" }), "");
  assert.equal(havenState({ balance: 1, lastCountryName: "Spain" }), "");
  assert.equal(havenLane("United Kingdom"), "union");
  assert.equal(havenLane("Guinea-Bissau"), "mark");
  assert.equal(havenLane("South Africa"), "pair");
  assert.equal(havenLane("Spain"), "short");
  assert.equal(havenLane("Liechtenstein"), "long");
  assert.equal(havenLane("Australia"), "vowel");
  assert.equal(havenLane("Germany"), "coast");
  assert.equal(havenLane("Portugal"), "post");
  assert.equal(havenHue("Spain"), "champagne");
  assert.equal(havenHue("Guinea-Bissau"), "graphite");
  assert.equal(havenHue("United Kingdom"), "ivory");
  assert.equal(havenUnion("United Kingdom"), true);
  assert.equal(havenMark("Guinea-Bissau"), true);
  assert.equal(havenPair("South Africa"), true);
  assert.equal(havenShort("Spain"), true);
  assert.equal(havenCoast("Germany"), true);
  assert.equal(havenLength("Spain"), 5);
  assert.equal(havenEven("Spain"), false);
  assert.equal(havenFirst("Spain"), true);
  assert.equal(havenSpace("South Africa"), true);
  assert.equal(havenVowel("Australia"), true);
  assert.equal(havenDigit("Region 2"), true);
  assert.equal(havenCapital("Spain"), true);
  assert.equal(havenLower("spain"), true);
  assert.equal(havenUpper("SPAIN"), true);
  assert.equal(havenTail("Room 4"), true);
  const havens: HavenRow[] = [
    { id: "1", label: "Ada", haven: "United Kingdom" },
    { id: "2", label: "Bea", haven: "United Kingdom" },
    { id: "3", label: "Cara", haven: "Spain" },
  ];
  assert.equal(leadingHaven(havens), "union");
  assert.match(havenLanesCsv(havens), /union,2/);
  assert.match(havenRowsCsv(havens, ["1"]), /Ada,United Kingdom/);
  assert.equal(crmv4Text("tr", "nvcTitle"), ROUND301_COPY.tr.nvcTitle);
  assert.equal(crmv4Text("de", "hvnTitle"), ROUND301_COPY.de.hvnTitle);
  assert.equal(crmv4Text("ru", "ymOratoryKicker"), ROUND301_COPY.ru.ymOratoryKicker);
  assert.equal(crmv4Text("ar", "tzGalleryLead"), ROUND301_COPY.ar.tzGalleryLead);
  const keys = Object.keys(ROUND301_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND301_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-navicula/);
  assert.match(css, /\.c4-haven/);
  assert.match(css, /\.c4-navicula-column/);
  assert.match(css, /\.c4-haven-column/);
  assert.match(css, /\.c4-symbol-oratory/);
  assert.match(css, /\.c4-ticket-gallery/);
  assert.match(css, /\.c4-symbol-oratory-mast/);
  assert.match(css, /\.c4-ticket-gallery-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round301.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /lastCountryName:/);
  assert.match(viewFile, /navCsv/);
  assert.match(viewFile, /havenRowsCsv/);
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
  assert.match(viewFile, /suggestWood/);
  assert.match(viewFile, /c4-haven-search/);
  assert.match(viewFile, /navTimeline/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "nvc"/);
  assert.match(app, /view === "hvn"/);
  const oratory = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round97.tsx"), "utf8");
  assert.match(oratory, /c4-symbol-oratory/);
  assert.match(oratory, /c4-symbol-oratory-mast/);
  assert.match(oratory, /data-logo="mono"/);
  assert.match(oratory, /ymOratoryKicker/);
  assert.match(oratory, /ymOratoryLead/);
  assert.match(oratory, /data-symbol-glance/);
  assert.equal(oratory.includes("amount"), false);
  assert.equal(oratory.includes("price"), false);
  const gallery = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round108.tsx"), "utf8");
  assert.match(gallery, /c4-ticket-gallery/);
  assert.match(gallery, /c4-ticket-gallery-mast/);
  assert.match(gallery, /tzGalleryKicker/);
  assert.match(gallery, /tzGalleryLead/);
  assert.match(gallery, /data-ticket-glance/);
  assert.equal(gallery.includes("amount"), false);
  const namedKeys = `${viewFile}\n${oratory}\n${gallery}`.match(/"(nvc|hvn|ymOratory|tzGallery)[a-zA-Z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND301_COPY.en[key as keyof typeof ROUND301_COPY.en], "string", key);
  console.log("crmv4 round301 tests passed");
}

main();
