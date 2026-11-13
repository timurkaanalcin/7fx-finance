/**
 * Quire slips and postmark lanes.
 * Run: TZ=UTC npx tsx tests/crmv4-round246.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND246_COPY } from "../src/lib/crmv4/copy-round246";
import {
  activeFolio,
  activeInk,
  activeRoom,
  activeStage,
  activeWait,
  addQuireSlip,
  addQuireView,
  cycleStage,
  fairReader,
  folioOf,
  houseInk,
  idleSlip,
  inkOf,
  lateSlip,
  leadingPostmark,
  lengthenWait,
  lowerFolio,
  moveQuireFocus,
  neighborSlipCount,
  peakRoom,
  postmarkBound,
  postmarkHue,
  postmarkJoin,
  postmarkLane,
  postmarkLanesCsv,
  postmarkNotch,
  postmarkRowsCsv,
  postmarkStamp,
  postmarkState,
  postmarkStep,
  postmarkWide,
  quietRoom,
  quireCsv,
  quireTimeline,
  raiseFolio,
  readQuireViews,
  roomBand,
  roomGap,
  roomOf,
  setSlipFolio,
  setSlipRibbon,
  shortenWait,
  stageOf,
  suggestInk,
  suggestWait,
  waitOf,
} from "../src/lib/crmv4/round246";

function main() {
  assert.equal(roomOf(" Folio "), "folio");
  assert.equal(roomOf("paris"), "");
  assert.equal(waitOf("15"), 15);
  assert.equal(waitOf(30), 30);
  assert.equal(waitOf("45"), 45);
  assert.equal(waitOf("12"), null);
  assert.equal(folioOf("2"), 2);
  assert.equal(folioOf(4), 4);
  assert.equal(folioOf("6"), 6);
  assert.equal(folioOf("8"), 8);
  assert.equal(folioOf("1"), null);
  assert.equal(inkOf("iron"), "IRON");
  assert.equal(inkOf("oak"), "OAK");
  assert.equal(inkOf("soot"), "SOOT");
  assert.equal(inkOf("silk"), "");
  assert.equal(stageOf("draft"), "draft");
  assert.equal(stageOf("fair"), "fair");
  assert.equal(stageOf("sealed"), "sealed");
  assert.equal(stageOf("three"), "");
  assert.equal(peakRoom("folio"), true);
  assert.equal(peakRoom("COLOPHON"), true);
  assert.equal(peakRoom("margin"), false);
  assert.equal(quietRoom("margin"), true);
  assert.equal(quietRoom("folio"), false);
  assert.equal(roomBand("folio"), "early");
  assert.equal(roomBand("vellum"), "mid");
  assert.equal(roomBand("margin"), "late");
  assert.equal(roomBand(""), "");
  assert.equal(roomGap("quire", "vellum"), 1);
  assert.equal(roomGap("vellum", "quire"), -1);
  assert.equal(roomGap("", "quire"), null);
  assert.equal(houseInk("iron"), true);
  assert.equal(houseInk("SOOT"), true);
  assert.equal(houseInk("oak"), false);
  assert.equal(activeRoom("peak"), "peak");
  assert.equal(activeRoom("quire"), "quire");
  assert.equal(activeRoom("paris"), "all");
  assert.equal(activeWait("15"), "15");
  assert.equal(activeWait("12"), "all");
  assert.equal(activeStage("fair", ["draft", "fair", "sealed"]), "fair");
  assert.equal(activeStage("hush", ["draft", "fair", "sealed"]), "all");
  assert.equal(activeFolio("4"), "4");
  assert.equal(activeFolio("5"), "all");
  assert.equal(activeInk("oak"), "oak");
  assert.equal(activeInk("silk"), "all");
  assert.equal(moveQuireFocus(0, 3, 1), 1);
  assert.equal(moveQuireFocus(0, 3, -1), 2);
  assert.equal(suggestInk([]), "IRON");
  assert.equal(suggestWait([], 4), 15);
  assert.equal(suggestWait([], 12), 30);
  assert.equal(suggestWait([], 19), 45);
  assert.equal(fairReader([], "Ada, Bea"), "Ada");

  const first = addQuireSlip([], {
    id: "a",
    title: "  North quire ",
    note: "quiet",
    reader: "Ada",
    room: "quire",
    ink: "iron",
    stage: "fair",
    wait: "15",
    folio: "4",
    tags: "a b",
  });
  assert.equal(first[0].title, "North quire");
  assert.equal(first[0].ink, "IRON");
  assert.equal(first[0].wait, 15);
  assert.equal(first[0].folio, 4);
  assert.deepEqual(first[0].tags, ["a", "b"]);
  assert.equal(lateSlip(first[0], "vellum"), true);
  assert.equal(idleSlip(first[0]), false);
  const staged = cycleStage(first, "a");
  assert.equal(staged[0].stage, "sealed");
  const raised = raiseFolio(first, "a");
  assert.equal(raised[0].folio, 6);
  const lowered = lowerFolio(raised, "a");
  assert.equal(lowered[0].folio, 4);
  const longer = lengthenWait(first, "a");
  assert.equal(longer[0].wait, 30);
  const shorter = shortenWait(longer, "a");
  assert.equal(shorter[0].wait, 15);
  const ribbon = setSlipRibbon(first, "a", true);
  assert.equal(ribbon[0].ribbon, true);
  assert.equal(setSlipFolio(first, "a", 9)[0].folio, 4);
  assert.equal(quireTimeline(first).map((lane) => lane.folio).join(","), "4");
  assert.match(quireCsv(first, "vellum"), /North quire,Ada,quire,IRON,fair,15,4,a b,0,0,0,0,1,1,0,0,0,1,early,0,0,0,save,quiet/);
  const views = addQuireView([], {
    id: "v",
    name: " Peak ",
    tray: "open",
    query: "north",
    reader: "Ada",
    ink: "iron",
    stage: "fair",
    room: "peak",
    wait: "15",
    folio: "4",
  });
  assert.equal(readQuireViews(views)[0].room, "peak");
  assert.equal(neighborSlipCount(first), 0);

  assert.equal(postmarkState("+90 532 111 22 33"), "set");
  assert.equal(postmarkState("  "), "clear");
  assert.equal(postmarkState("12345"), "clear");
  assert.equal(postmarkState({ phone: "+90 532 111 22 33", balance: 4 }), "");
  assert.equal(postmarkStamp("+90 532 111 22 33"), "9012");
  assert.equal(postmarkStamp("5551234567"), "5510");
  assert.equal(postmarkLane("+90 532 111 22 33"), "plus");
  assert.equal(postmarkLane("(212) 555-0199"), "paren");
  assert.equal(postmarkLane("212-555-0199"), "dash");
  assert.equal(postmarkLane("212 555 0199"), "space");
  assert.equal(postmarkLane("5551234"), "short");
  assert.equal(postmarkLane("5551234567"), "local");
  assert.equal(postmarkLane("9053211122334"), "intl");
  assert.equal(postmarkLane("90532111223"), "long");
  assert.equal(postmarkHue("+90 532 111 22 33"), "slate");
  assert.equal(postmarkHue("5551234567"), "clay");
  assert.equal(postmarkHue("5551234560"), "gilt");
  assert.equal(postmarkHue("+90 532 111 22 38"), "soot");
  assert.equal(postmarkHue("+90 532 111 22 33 x2"), "pearl");
  assert.equal(postmarkHue("*905321"), "mist");
  assert.equal(postmarkBound("+90 532 111 22 33"), true);
  assert.equal(postmarkBound("442071234567"), true);
  assert.equal(postmarkBound("5551234567"), false);
  assert.equal(postmarkWide("+90 532 111 22 33"), true);
  assert.equal(postmarkWide("5551234567"), false);
  assert.equal(postmarkNotch("212-555-0199"), true);
  assert.equal(postmarkNotch("+90 532 111 22 33"), false);
  assert.equal(postmarkJoin("+90 532 111 22 33"), true);
  assert.equal(postmarkJoin("5551234567"), false);
  assert.equal(postmarkStep("+90 532 111 22 33"), 6);
  assert.equal(postmarkStep(""), 0);

  const book = [
    { id: "1", label: "Ada", note: "+90 532 111 22 33" },
    { id: "2", label: "Bea", note: "+90 532 111 22 33" },
    { id: "3", label: "Cem", note: "5551234567" },
  ];
  assert.equal(leadingPostmark(book), "plus");
  assert.match(postmarkLanesCsv(book), /plus,2/);
  assert.match(postmarkRowsCsv(book, ["1"]), /\+90 532 111 22 33,9012,plus,slate,6,1,1,0,1,1,0,0,0,0,0,0,0,1/);

  const keys = Object.keys(ROUND246_COPY.en);
  assert.ok(keys.length >= 120);
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND246_COPY[locale]).sort(), keys.slice().sort());
    for (const key of keys) {
      assert.equal(typeof ROUND246_COPY[locale][key as keyof typeof ROUND246_COPY.en], "string");
      assert.ok(ROUND246_COPY[locale][key as keyof typeof ROUND246_COPY.en].length > 0);
    }
  }
  assert.equal(crmv4Text("tr", "qslTitle"), ROUND246_COPY.tr.qslTitle);
  assert.equal(crmv4Text("de", "pmkTitle"), ROUND246_COPY.de.pmkTitle);
  assert.equal(crmv4Text("ru", "qslSub"), ROUND246_COPY.ru.qslSub);
  assert.equal(crmv4Text("ar", "pmkSub"), ROUND246_COPY.ar.pmkSub);
  assert.equal(crmv4Text("en", "qslLogo"), "7FX");
  assert.equal(crmv4Text("en", "qreTitle"), "Quire leaves");

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-qsl/);
  assert.match(css, /\.c4-pmk-index/);
  assert.match(css, /\.c4-script-salon/);
  assert.match(css, /\.c4-eod-salon/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round246.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /phone/);
  assert.match(viewFile, /title/);
  assert.match(viewFile, /quireCsv/);
  assert.match(viewFile, /postmarkRowsCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "t"/);
  assert.match(viewFile, /event\.key === "j"/);
  assert.match(viewFile, /event\.key === "u"/);
  assert.match(viewFile, /event\.key === "s"/);
  assert.match(viewFile, /event\.key === "f"/);
  assert.match(viewFile, /event\.key === "h"/);
  assert.match(viewFile, /event\.key === "w"/);
  assert.match(viewFile, /event\.key === "d"/);
  assert.match(viewFile, /event\.key === "p"/);
  assert.match(viewFile, /event\.key === "b"/);
  assert.match(viewFile, /event\.key === "n"/);
  assert.match(viewFile, /event\.key === "m"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=24&meta=0&role=TRADER/);
  assert.match(viewFile, /data-slips/);
  assert.match(viewFile, /data-marks/);
  assert.match(viewFile, /data-traders/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestInk/);
  assert.match(viewFile, /c4-pmk-search/);
  assert.match(viewFile, /quireTimeline/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "qsl"/);
  assert.match(app, /view === "pmk"/);
  assert.match(app, /QuireSlips/);
  assert.match(app, /PostmarkLanes/);
  const scripts = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round67.tsx"), "utf8");
  assert.match(scripts, /c4-script-salon/);
  assert.match(scripts, /data-logo="mono"/);
  const eod = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round66.tsx"), "utf8");
  assert.match(eod, /c4-eod-salon/);
  assert.match(eod, /data-logo="mono"/);
  const used = new Set(viewFile.match(/v4\("([a-zA-Z0-9]+)"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of Array.from(used)) assert.ok(key in ROUND246_COPY.en, key);
  const audit = viewFile.match(/"(qslAudit[a-zA-Z]+)"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of audit) assert.ok(key in ROUND246_COPY.en, key);
  console.log("crmv4 round246 tests passed");
}

main();
