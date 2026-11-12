/**
 * Carrel slips and login seals.
 * Run: TZ=UTC npx tsx tests/crmv4-round248.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND248_COPY } from "../src/lib/crmv4/copy-round248";
import {
  activeCloth,
  activeRoom,
  activeShelf,
  activeStay,
  activeTone,
  addCarrelSlip,
  addCarrelView,
  carrelCsv,
  carrelTimeline,
  clothOf,
  cycleTone,
  fairKeeper,
  houseCloth,
  idleSlip,
  lateSlip,
  leadingSeal,
  lengthenStay,
  lowerShelf,
  moveCarrelFocus,
  neighborSlipCount,
  peakRoom,
  quietRoom,
  raiseShelf,
  readCarrelViews,
  roomBand,
  roomGap,
  roomOf,
  sealBound,
  sealHue,
  sealJoin,
  sealLane,
  sealLanesCsv,
  sealNotch,
  sealRowsCsv,
  sealStamp,
  sealState,
  sealStep,
  sealWide,
  setSlipRibbon,
  setSlipShelf,
  shelfOf,
  shortenStay,
  stayOf,
  suggestCloth,
  suggestStay,
  toneOf,
} from "../src/lib/crmv4/round248";

function main() {
  assert.equal(roomOf(" Nook "), "nook");
  assert.equal(roomOf("paris"), "");
  assert.equal(stayOf("15"), 15);
  assert.equal(stayOf(30), 30);
  assert.equal(stayOf("45"), 45);
  assert.equal(stayOf("10"), null);
  assert.equal(shelfOf("2"), 2);
  assert.equal(shelfOf(4), 4);
  assert.equal(shelfOf("6"), 6);
  assert.equal(shelfOf("8"), 8);
  assert.equal(shelfOf("3"), null);
  assert.equal(clothOf("linen"), "LINEN");
  assert.equal(clothOf("velvet"), "VELVET");
  assert.equal(clothOf("wool"), "WOOL");
  assert.equal(clothOf("silk"), "");
  assert.equal(toneOf("hush"), "hush");
  assert.equal(toneOf("warm"), "warm");
  assert.equal(toneOf("bright"), "bright");
  assert.equal(toneOf("loud"), "");
  assert.equal(peakRoom("bay"), true);
  assert.equal(peakRoom("CROWN"), true);
  assert.equal(peakRoom("nook"), false);
  assert.equal(quietRoom("stack"), true);
  assert.equal(quietRoom("bay"), false);
  assert.equal(roomBand("bay"), "early");
  assert.equal(roomBand("ledge"), "mid");
  assert.equal(roomBand("mezz"), "late");
  assert.equal(roomBand(""), "");
  assert.equal(roomGap("nook", "ledge"), 1);
  assert.equal(roomGap("ledge", "nook"), -1);
  assert.equal(roomGap("", "nook"), null);
  assert.equal(houseCloth("linen"), true);
  assert.equal(houseCloth("WOOL"), true);
  assert.equal(houseCloth("velvet"), false);
  assert.equal(activeRoom("peak"), "peak");
  assert.equal(activeRoom("nook"), "nook");
  assert.equal(activeRoom("paris"), "all");
  assert.equal(activeStay("15"), "15");
  assert.equal(activeStay("10"), "all");
  assert.equal(activeTone("warm", ["hush", "warm", "bright"]), "warm");
  assert.equal(activeTone("loud", ["hush", "warm", "bright"]), "all");
  assert.equal(activeShelf("4"), "4");
  assert.equal(activeShelf("3"), "all");
  assert.equal(activeCloth("velvet"), "velvet");
  assert.equal(activeCloth("silk"), "all");
  assert.equal(moveCarrelFocus(0, 3, 1), 1);
  assert.equal(moveCarrelFocus(0, 3, -1), 2);
  assert.equal(suggestCloth([]), "LINEN");
  assert.equal(suggestStay([], 4), 15);
  assert.equal(suggestStay([], 12), 30);
  assert.equal(suggestStay([], 19), 45);
  assert.equal(fairKeeper([], "Ada, Bea"), "Ada");

  const first = addCarrelSlip([], {
    id: "a",
    title: "  North carrel ",
    note: "quiet",
    keeper: "Ada",
    room: "nook",
    cloth: "linen",
    tone: "warm",
    stay: "15",
    shelf: "4",
    tags: "x y",
  });
  assert.equal(first[0].title, "North carrel");
  assert.equal(first[0].cloth, "LINEN");
  assert.equal(first[0].stay, 15);
  assert.equal(first[0].shelf, 4);
  assert.deepEqual(first[0].tags, ["x", "y"]);
  assert.equal(lateSlip(first[0], "ledge"), true);
  assert.equal(idleSlip(first[0]), false);
  const toned = cycleTone(first, "a");
  assert.equal(toned[0].tone, "bright");
  const raised = raiseShelf(first, "a");
  assert.equal(raised[0].shelf, 6);
  const lowered = lowerShelf(raised, "a");
  assert.equal(lowered[0].shelf, 4);
  const longer = lengthenStay(first, "a");
  assert.equal(longer[0].stay, 30);
  const shorter = shortenStay(longer, "a");
  assert.equal(shorter[0].stay, 15);
  const ribbon = setSlipRibbon(first, "a", true);
  assert.equal(ribbon[0].ribbon, true);
  assert.equal(setSlipShelf(first, "a", 3)[0].shelf, 4);
  assert.equal(carrelTimeline(first).map((lane) => lane.shelf).join(","), "4");
  assert.match(carrelCsv(first, "ledge"), /North carrel,Ada,nook,LINEN,warm,15,4,x y,0,0,0,0,1,1,0,0,0,1,early,0,0,0,save,quiet/);
  const views = addCarrelView([], {
    id: "v",
    name: " Peak ",
    tray: "open",
    query: "north",
    keeper: "Ada",
    cloth: "linen",
    tone: "warm",
    room: "peak",
    stay: "15",
    shelf: "4",
  });
  assert.equal(readCarrelViews(views)[0].room, "peak");
  assert.equal(neighborSlipCount(first), 0);

  assert.equal(sealState("12345678"), "set");
  assert.equal(sealState("  "), "clear");
  assert.equal(sealState("12345"), "clear");
  assert.equal(sealState({ login: "12345678", balance: 4 }), "");
  assert.equal(sealStamp("12345678"), "128");
  assert.equal(sealStamp("10000001"), "108");
  assert.equal(sealLane("11234567"), "twin");
  assert.equal(sealLane("10234567"), "zero");
  assert.equal(sealLane("23456789"), "low");
  assert.equal(sealLane("78912345"), "high");
  assert.equal(sealLane("456789"), "short");
  assert.equal(sealLane("4567891234567891"), "full");
  assert.equal(sealLane("456789124"), "even");
  assert.equal(sealLane("456789123"), "plain");
  assert.equal(sealHue("12345670"), "gilt");
  assert.equal(sealHue("12345671"), "slate");
  assert.equal(sealHue("12345672"), "sand");
  assert.equal(sealHue("12345673"), "clay");
  assert.equal(sealHue("12345674"), "soot");
  assert.equal(sealHue("12345675"), "pearl");
  assert.equal(sealHue("12345676"), "mist");
  assert.equal(sealBound("12345678"), true);
  assert.equal(sealBound("72345678"), true);
  assert.equal(sealBound("42345678"), false);
  assert.equal(sealWide("123456789012"), true);
  assert.equal(sealWide("12345678"), false);
  assert.equal(sealNotch("10234567"), true);
  assert.equal(sealNotch("12345678"), false);
  assert.equal(sealStep("12345678"), 6);
  assert.equal(sealStep(""), 0);
  assert.equal(sealJoin("11123456"), true);
  assert.equal(sealJoin("11234567"), false);

  const book = [
    { id: "1", label: "Ada", note: "11234567" },
    { id: "2", label: "Bea", note: "11234567" },
    { id: "3", label: "Cem", note: "23456789" },
  ];
  assert.equal(leadingSeal(book), "twin");
  assert.match(sealLanesCsv(book), /twin,2/);
  assert.match(sealRowsCsv(book, ["1"]), /11234567,118,twin,mist,6,0,0,0,1,1,0,0,0,0,0,0,0,1/);

  const keys = Object.keys(ROUND248_COPY.en);
  assert.ok(keys.length >= 120);
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND248_COPY[locale]).sort(), keys.slice().sort());
    for (const key of keys) {
      assert.equal(typeof ROUND248_COPY[locale][key as keyof typeof ROUND248_COPY.en], "string");
      assert.ok(ROUND248_COPY[locale][key as keyof typeof ROUND248_COPY.en].length > 0);
    }
  }
  assert.equal(crmv4Text("tr", "crlTitle"), ROUND248_COPY.tr.crlTitle);
  assert.equal(crmv4Text("de", "lgsTitle"), ROUND248_COPY.de.lgsTitle);
  assert.equal(crmv4Text("ru", "crlSub"), ROUND248_COPY.ru.crlSub);
  assert.equal(crmv4Text("ar", "lgsSub"), ROUND248_COPY.ar.lgsSub);
  assert.equal(crmv4Text("en", "crlLogo"), "7FX");
  assert.equal(crmv4Text("en", "crlTitle"), "Carrel slips");

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-crl/);
  assert.match(css, /\.c4-lgs-index/);
  assert.match(css, /\.c4-quiet-salon/);
  assert.match(css, /\.c4-scratch-salon/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round248.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /accountLoginId/);
  assert.match(viewFile, /title/);
  assert.match(viewFile, /carrelCsv/);
  assert.match(viewFile, /sealRowsCsv/);
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
  assert.match(viewFile, /data-seals/);
  assert.match(viewFile, /data-traders/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestCloth/);
  assert.match(viewFile, /c4-lgs-search/);
  assert.match(viewFile, /carrelTimeline/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "crl"/);
  assert.match(app, /view === "lgs"/);
  assert.match(app, /CarrelSlips/);
  assert.match(app, /LoginSeals/);
  const quiet = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round56.tsx"), "utf8");
  assert.match(quiet, /c4-quiet-salon/);
  assert.match(quiet, /data-logo="mono"/);
  const scratch = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round60.tsx"), "utf8");
  assert.match(scratch, /c4-scratch-salon/);
  assert.match(scratch, /data-logo="mono"/);
  const used = new Set(viewFile.match(/v4\("([a-zA-Z0-9]+)"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of Array.from(used)) assert.ok(key in ROUND248_COPY.en, key);
  const audit = viewFile.match(/"(crlAudit[a-zA-Z]+)"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of audit) assert.ok(key in ROUND248_COPY.en, key);
  console.log("crmv4 round248 tests passed");
}

main();
