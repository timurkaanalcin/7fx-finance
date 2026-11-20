/**
 * Escape wheel rules, device plates, the ivory needle laconicum, and the graphite cloth unctorium.
 * Run: TZ=UTC npx tsx tests/crmv4-round340.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND340_COPY } from "../src/lib/crmv4/copy-round340";
import {
  ROUND340_FEATURES,
  activeFinish,
  activePiece,
  activeLock,
  activeDrop,
  addEscape,
  briskEscape,
  dropEscapeView,
  fairSetter,
  devicePalm,
  devicePip,
  deviceCapital,
  deviceDigit,
  deviceEven,
  deviceFirst,
  deviceGap,
  deviceHue,
  deviceJoin,
  deviceLane,
  deviceLanesCsv,
  deviceLength,
  deviceMini,
  deviceLower,
  deviceKios,
  deviceSlab,
  deviceOpen,
  devicePlain,
  deviceStrap,
  deviceRowsCsv,
  deviceSoon,
  deviceSpace,
  deviceState,
  deviceUpper,
  deviceVowel,
  fullLock,
  idleEscape,
  lateEscape,
  leadingDevice,
  moveEscapeFocus,
  escapeBand,
  escapeDrop,
  escapeFilm,
  escapeGap,
  escapeInner,
  escapePiece,
  escapeOuter,
  escapeLock,
  escapeTimeline,
  overdueEscape,
  pairLock,
  quietFinish,
  readEscapeViews,
  reminderEscapeWheels,
  restingEscape,
  suggestFinish,
  suggestPiece,
  suggestDrop,
  type DeviceRow,
  type EscapeWheel,
} from "../src/lib/crmv4/round340";

function rule(partial: Partial<EscapeWheel> & { id: string; title: string }): EscapeWheel {
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
  assert.equal(ROUND340_FEATURES.length, 25);
  assert.equal(ROUND340_FEATURES.includes("device-plate"), true);
  assert.equal(ROUND340_FEATURES.includes("drop-sla"), true);
  assert.equal(ROUND340_FEATURES.includes("fair-setter"), true);
  assert.equal(ROUND340_FEATURES.includes("vault-file"), true);
  assert.equal(ROUND340_FEATURES.includes("tooth-notices"), true);
  assert.equal(ROUND340_FEATURES.includes("escapewheel-search"), true);
  assert.equal(ROUND340_FEATURES.includes("drop-timeline"), true);
  assert.equal(escapePiece(" tooth "), "tooth");
  assert.equal(escapePiece("brass"), "");
  assert.equal(escapeDrop("3"), 3);
  assert.equal(escapeDrop(9), 9);
  assert.equal(escapeDrop(18), 18);
  assert.equal(escapeDrop(27), 27);
  assert.equal(escapeDrop("4"), null);
  assert.equal(escapeDrop("12"), null);
  assert.equal(escapeLock("3"), 3);
  assert.equal(escapeLock(6), 6);
  assert.equal(escapeLock("9"), 9);
  assert.equal(escapeLock("4"), null);
  assert.equal(escapeLock("7"), null);
  assert.equal(escapeFilm("gilt"), "GILT");
  assert.equal(escapeFilm("ivory"), "IVORY");
  assert.equal(escapeFilm("graphite"), "GRAPHITE");
  assert.equal(escapeFilm("hot"), "");
  assert.equal(escapeInner("tooth"), true);
  assert.equal(escapeInner("PINION"), true);
  assert.equal(escapeInner("arbor"), false);
  assert.equal(escapeOuter("arbor"), true);
  assert.equal(escapeOuter("stone"), true);
  assert.equal(escapeOuter("tooth"), false);
  assert.equal(escapeBand("tooth"), "point");
  assert.equal(escapeBand("pinion"), "leaf");
  assert.equal(escapeBand("arbor"), "axle");
  assert.equal(escapeBand("stone"), "chaton");
  assert.equal(escapeGap("tooth", "stone"), 3);
  assert.equal(quietFinish("ivory"), true);
  assert.equal(quietFinish("gilt"), false);
  assert.equal(pairLock(6), true);
  assert.equal(pairLock(3), false);
  assert.equal(fullLock(9), true);
  assert.equal(fullLock(6), false);
  assert.equal(activePiece("inner"), "inner");
  assert.equal(activeDrop("9"), "9");
  assert.equal(activeDrop("8"), "all");
  assert.equal(activeLock("9"), "9");
  assert.equal(activeLock("7"), "all");
  assert.equal(activeFinish("gilt", ["GILT"]), "GILT");
  assert.equal(suggestPiece(6), "tooth");
  assert.equal(suggestPiece(10), "stone");
  assert.equal(suggestDrop([], 3), 3);
  assert.equal(suggestDrop([], 8), 9);
  assert.equal(suggestDrop([], 14), 18);
  assert.equal(suggestDrop([], 20), 27);
  assert.equal(suggestFinish([]), "IVORY");
  assert.equal(moveEscapeFocus(0, 3, 1), 1);
  assert.equal(moveEscapeFocus(0, 3, -1), 2);
  const late = rule({ id: "a", title: "Ada", piece: "tooth" });
  const due = rule({ id: "b", title: "Bea", piece: "arbor", lock: 3 });
  const quiet = rule({ id: "c", title: "Cara", drop: 3, lock: 3 });
  const cell = rule({ id: "d", title: "Dora", film: "GILT", drop: 27, lock: 9 });
  const fax = rule({ id: "e", title: "Eve", piece: "stone", film: "IVORY", drop: 9 });
  assert.equal(lateEscape(late, "stone"), true);
  assert.equal(lateEscape(late, "tooth"), false);
  assert.equal(overdueEscape(due), true);
  assert.equal(idleEscape(quiet), true);
  assert.equal(briskEscape(cell), true);
  assert.equal(restingEscape(fax), true);
  assert.deepEqual(reminderEscapeWheels([due, late]), ["Bea"]);
  assert.equal(fairSetter([rule({ id: "1", title: "One", setter: "Ada" }), rule({ id: "2", title: "Two", setter: "Bea" }), rule({ id: "3", title: "Three", setter: "Ada" })], "Ada,Bea"), "Bea");
  const cards = [rule({ id: "1", title: "North", drop: 27 }), rule({ id: "2", title: "East", drop: 9 })];
  assert.match(escapeTimeline(cards).map((lane) => lane.drop).join(","), /27/);
  const saved = addEscape([], { title: "Ada", piece: "pinion", drop: "9", film: "gilt", lock: "6", tags: "p t x" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].piece, "pinion");
  assert.equal(saved[0].drop, 9);
  assert.equal(saved[0].lock, 6);
  assert.deepEqual(saved[0].tags, ["p", "t"]);
  assert.equal(addEscape(saved, { title: "Ada" }).length, 1);
  assert.equal(addEscape([], { title: "Eve" })[0].lock, 3);
  assert.equal(dropEscapeView([{ id: "v", name: "Morning", tray: "board", query: "", setter: "", film: "all", piece: "all", drop: "all", lock: "all" }], "v").length, 0);
  assert.equal(readEscapeViews([{ id: "v", name: "Morning", tray: "peg" }])[0].tray, "peg");

  assert.equal(devicePalm("palm"), true);
  assert.equal(devicePalm("PALM"), true);
  assert.equal(deviceSlab("SLAB"), true);
  assert.equal(deviceMini("MINI"), true);
  assert.equal(deviceKios("KIOS"), true);
  assert.equal(devicePalm({ lastDevice: true }), true);
  assert.equal(devicePlain({ lastDevice: false }), true);
  assert.equal(deviceSlab({ lastDevice: false }), false);
  assert.equal(devicePlain({ lastDevice: "Letter" }), true);
  assert.equal(devicePalm({ lastDevice: "Letter" }), false);
  assert.equal(devicePip({ lastDevice: "Ada" }), true);
  assert.equal(deviceJoin("ANNA&NOAH"), true);
  assert.equal(deviceJoin("ANNA NOAH"), false);
  assert.equal(deviceGap("LEO:MAX"), true);
  assert.equal(deviceGap("LIVEHOLD"), false);
  assert.equal(devicePip("Ada"), true);
  assert.equal(devicePip("PALM"), false);
  assert.equal(deviceStrap("Abcdefghijklmnopqr"), true);
  assert.equal(deviceStrap("Amsterdam"), false);
  assert.equal(deviceLane("PALM"), "palm");
  assert.equal(deviceLane("Ada"), "pip");
  assert.equal(deviceLane("Letter"), "plain");
  assert.equal(deviceLane("10language"), "mark");
  assert.equal(deviceLane("Amsterdam"), "vowel");
  assert.equal(deviceOpen(""), true);
  assert.equal(deviceOpen({ lastDevice: "" }), true);
  assert.equal(deviceState({ name: "Ada" }), "");
  assert.equal(deviceState({ lastDevice: "Paris", balance: 1 }), "");
  assert.equal(deviceHue("PALM"), "champagne");
  assert.equal(deviceHue("ANNA&NOAH"), "graphite");
  assert.equal(deviceHue("MINI"), "champagne");
  assert.equal(deviceSoon("Ada"), true);
  assert.equal(deviceSoon("PALM"), false);
  assert.equal(deviceSoon("Device"), true);
  assert.equal(deviceSoon("Leonard"), false);
  assert.equal(deviceSoon("Amsterdam"), false);
  assert.equal(deviceHue("Letter"), "ivory");
  assert.equal(deviceLength("turk"), 4);
  assert.equal(deviceEven("turk"), true);
  assert.equal(deviceFirst("Paris"), true);
  assert.equal(deviceSpace("needs review"), true);
  assert.equal(deviceVowel("Amsterdam"), true);
  assert.equal(deviceDigit("Room4"), true);
  assert.equal(deviceCapital("PARIS"), true);
  assert.equal(deviceLower("paris"), true);
  assert.equal(deviceUpper("LEONARD"), true);
  assert.equal(deviceUpper("PALM"), false);
  assert.equal(deviceUpper("SLAB"), false);
  const marks: DeviceRow[] = [
    { id: "1", label: "Ada", code: "PALM" },
    { id: "2", label: "Bea", code: "PALM" },
    { id: "3", label: "Cara", code: "Paris" },
  ];
  assert.equal(leadingDevice(marks), "palm");
  assert.match(deviceLanesCsv(marks), /palm,2/);
  assert.match(deviceRowsCsv(marks, ["1"]), /Ada,PALM/);
  assert.equal(crmv4Text("tr", "ewlTitle"), ROUND340_COPY.tr.ewlTitle);
  assert.equal(crmv4Text("de", "dvpTitle"), ROUND340_COPY.de.dvpTitle);
  assert.equal(crmv4Text("ru", "bstLaconicumKicker"), ROUND340_COPY.ru.bstLaconicumKicker);
  assert.equal(crmv4Text("ar", "cclUnctoriumLead"), ROUND340_COPY.ar.cclUnctoriumLead);
  const keys = Object.keys(ROUND340_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND340_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-escapewheel/);
  assert.match(css, /\.c4-device/);
  assert.match(css, /\.c4-escapewheel-column/);
  assert.match(css, /\.c4-device-column/);
  assert.match(css, /\.c4-bst-laconicum/);
  assert.match(css, /\.c4-ccl-unctorium/);
  assert.match(css, /\.c4-bst-laconicum-mast/);
  assert.match(css, /\.c4-ccl-unctorium-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round340.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /lastDevice:/);
  assert.match(viewFile, /escapeCsv/);
  assert.match(viewFile, /deviceRowsCsv/);
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
  assert.match(viewFile, /c4-device-search/);
  assert.match(viewFile, /escapeTimeline/);
  assert.match(viewFile, /c4-escapewheel-notices/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "ewl"/);
  assert.match(app, /view === "dvp"/);
  const host = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round160.tsx"), "utf8");
  assert.match(host, /c4-bst-laconicum/);
  assert.match(host, /c4-bst-laconicum-mast/);
  assert.match(host, /data-logo="mono"/);
  assert.match(host, /bstLaconicumKicker/);
  assert.match(host, /bstLaconicumLead/);
  assert.match(host, /data-stitches/);
  assert.equal(host.includes("amount"), false);
  assert.match(host, /c4-ccl-unctorium/);
  assert.match(host, /c4-ccl-unctorium-mast/);
  assert.match(host, /cclUnctoriumKicker/);
  assert.match(host, /cclUnctoriumLead/);
  assert.match(host, /data-cloths/);
  assert.equal(host.includes("currency"), false);
  assert.equal(host.includes("saleStatus"), false);
  const namedKeys = `${viewFile}\n${host}`.match(/"(osc|fnm|bstLaconicum|cclUnctorium)[A-Za-z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND340_COPY.en[key as keyof typeof ROUND340_COPY.en], "string", key);
  console.log("crmv4 round340 tests passed");
}

main();
