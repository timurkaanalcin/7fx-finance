/**
 * Vestibule slips and mailbox plates.
 * Run: TZ=UTC npx tsx tests/crmv4-round259.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND259_COPY } from "../src/lib/crmv4/copy-round259";
import {
  ROUND259_FEATURES,
  activeCloth,
  activeGait,
  activePlace,
  activeRank,
  activeWait,
  addVest,
  addVestView,
  bulkVestPin,
  busiestPorter,
  clothOf,
  cycleGait,
  dropVestView,
  fairPorter,
  gaitOf,
  houseCloth,
  idleVest,
  lateVest,
  leadingPlate,
  lengthenWait,
  lowerRank,
  moveVestFocus,
  neighborVestCount,
  overdueVest,
  placeBand,
  placeGap,
  placeOf,
  plateEcho,
  plateHue,
  plateLane,
  plateLanesCsv,
  plateLeap,
  plateNotch,
  platePlus,
  plateRowsCsv,
  plateSpoken,
  plateStamp,
  plateState,
  plateStep,
  plateWide,
  quietPlace,
  raiseRank,
  rankOf,
  readVestViews,
  restingVest,
  rushVest,
  shortenWait,
  suggestCloth,
  suggestWait,
  vestCsv,
  vestTimeline,
  waitOf,
  peakPlace,
} from "../src/lib/crmv4/round259";

function main() {
  assert.equal(ROUND259_FEATURES.length, 25);
  assert.equal(placeOf(" court "), "court");
  assert.equal(placeOf("paris"), "");
  assert.equal(waitOf("3"), 3);
  assert.equal(waitOf(9), 9);
  assert.equal(waitOf("21"), 21);
  assert.equal(waitOf("6"), null);
  assert.equal(rankOf("1"), 1);
  assert.equal(rankOf(3), 3);
  assert.equal(rankOf("5"), 5);
  assert.equal(rankOf("7"), 7);
  assert.equal(rankOf("2"), null);
  assert.equal(clothOf("wool"), "WOOL");
  assert.equal(clothOf("silk"), "SILK");
  assert.equal(clothOf("linen"), "LINEN");
  assert.equal(clothOf("clay"), "");
  assert.equal(gaitOf("still"), "still");
  assert.equal(gaitOf("walk"), "walk");
  assert.equal(gaitOf("rush"), "rush");
  assert.equal(gaitOf("hush"), "");
  assert.equal(peakPlace("court"), true);
  assert.equal(peakPlace("STAIR"), true);
  assert.equal(peakPlace("porch"), false);
  assert.equal(quietPlace("porch"), true);
  assert.equal(quietPlace("loft"), true);
  assert.equal(quietPlace("court"), false);
  assert.equal(placeBand("porch"), "early");
  assert.equal(placeBand("court"), "early");
  assert.equal(placeBand("stair"), "mid");
  assert.equal(placeBand("loft"), "late");
  assert.equal(placeBand(""), "");
  assert.equal(placeGap("porch", "court"), 1);
  assert.equal(placeGap("court", "porch"), -1);
  assert.equal(placeGap("", "porch"), null);
  assert.equal(houseCloth("wool"), true);
  assert.equal(houseCloth("SILK"), true);
  assert.equal(houseCloth("linen"), false);
  assert.equal(activePlace("peak"), "peak");
  assert.equal(activePlace("court"), "court");
  assert.equal(activePlace("paris"), "all");
  assert.equal(activeWait("9"), "9");
  assert.equal(activeWait("6"), "all");
  assert.equal(activeGait("walk", ["still", "walk", "rush"]), "walk");
  assert.equal(activeGait("hush", ["still", "walk", "rush"]), "all");
  assert.equal(activeRank("5"), "5");
  assert.equal(activeRank("2"), "all");
  assert.equal(activeCloth("silk"), "silk");
  assert.equal(activeCloth("clay"), "all");
  assert.equal(moveVestFocus(0, 3, 1), 1);
  assert.equal(moveVestFocus(0, 3, -1), 2);
  assert.equal(suggestCloth([]), "WOOL");
  assert.equal(suggestWait([], 4), 3);
  assert.equal(suggestWait([], 12), 9);
  assert.equal(suggestWait([], 19), 21);
  assert.equal(fairPorter([], "Ada, Bea"), "Ada");

  const first = addVest([], {
    id: "a",
    title: "  North door ",
    note: "",
    porter: "Ada",
    place: "court",
    cloth: "wool",
    gait: "still",
    wait: 3,
    rank: 1,
    tags: "x x y",
  });
  assert.equal(first.length, 1);
  assert.equal(first[0].title, "North door");
  assert.equal(first[0].note, "");
  assert.equal(first[0].cloth, "WOOL");
  assert.equal(first[0].tags.join(""), "xy");
  assert.equal(first[0].audit, "save");
  assert.equal(overdueVest(first[0]), true);
  assert.equal(addVest(first, { id: "a", title: "Other" }).length, 1);
  assert.equal(addVest(first, { id: "b", title: "North door" }).length, 1);
  assert.equal(addVest(first, { id: "b", title: "   " }).length, 1);

  const pinned = bulkVestPin(first, ["a"]);
  assert.equal(overdueVest(pinned[0]), false);
  assert.equal(fairPorter(pinned, "Ada, Bea"), "Ada");
  const quiet = addVest(pinned, { id: "q", title: "Porch rest", porter: "Bea", place: "porch", gait: "still", rank: 1 });
  assert.equal(idleVest(quiet[0]), true);
  assert.equal(lateVest(quiet[0], "court"), false);
  const behind = addVest([], { id: "z", title: "Porch late", place: "porch", rank: 1 });
  assert.equal(lateVest(behind[0], "loft"), true);
  assert.equal(lateVest({ ...behind[0], rank: 3 }, "loft"), false);
  const rushed = addVest([], { id: "r", title: "Court rush", place: "court", gait: "rush", rank: 7 });
  assert.equal(rushVest(rushed[0]), true);
  const rested = addVest([], { id: "s", title: "Loft walk", place: "loft", gait: "walk", wait: 21 });
  assert.equal(restingVest(rested[0]), true);
  assert.equal(lengthenWait(rested, "s")[0].wait, 21);
  assert.equal(lengthenWait([{ ...rested[0], wait: null }], "s")[0].wait, 3);
  assert.equal(lengthenWait(first, "a")[0].wait, 9);
  assert.equal(shortenWait(first, "a")[0].wait, 3);
  assert.equal(shortenWait([{ ...first[0], wait: null }], "a")[0].wait, 21);
  assert.equal(cycleGait(first, "a")[0].gait, "walk");
  assert.equal(raiseRank(first, "a")[0].rank, 3);
  assert.equal(lowerRank(first, "a")[0].rank, 1);
  assert.equal(lowerRank([{ ...first[0], rank: 7 }], "a")[0].rank, 5);
  assert.equal(busiestPorter(quiet), "Bea");
  assert.equal(neighborVestCount(quiet) >= 0, true);
  assert.match(vestCsv(first, "loft"), /North door/);
  assert.match(vestTimeline(first).map((lane) => lane.rank).join(","), /1/);

  const linenBook = addVest(addVest([], { id: "y1", title: "Linen one", cloth: "linen", place: "porch" }), { id: "y2", title: "Linen two", cloth: "linen", place: "court" });
  assert.equal(suggestCloth(linenBook), "LINEN");
  assert.equal(suggestWait(rested, 4), 21);

  const views = addVestView([], { id: "v", name: "Peak", tray: "door", place: "peak", wait: "3", cloth: "wool", gait: "still", rank: "1" });
  assert.equal(views[0].place, "peak");
  assert.equal(dropVestView(views, "v").length, 0);
  assert.equal(readVestViews([{ id: "v", name: "Peak", tray: "nope" }])[0].tray, "door");

  assert.equal(plateState("ada@house.com"), "set");
  assert.equal(plateLane("ada@house.com"), "brief");
  assert.equal(plateStamp("ada@house.com"), "ada");
  assert.equal(plateHue("ada@house.com"), "ivory");
  assert.equal(plateHue("beatrice@iris.net"), "graphite");
  assert.equal(plateHue("abba@rose.org"), "champagne");
  assert.equal(plateStep("beatrice@iris.net"), 8);
  assert.equal(plateLeap("beatrice@iris.net"), true);
  assert.equal(plateSpoken("beatrice@iris.net"), true);
  assert.equal(plateSpoken("ada@house.com"), false);
  assert.equal(plateNotch("a1@house.com"), true);
  assert.equal(plateNotch("ada@house.com"), false);
  assert.equal(plateEcho("abba@rose.org"), true);
  assert.equal(plateEcho("adam@house.com"), false);
  assert.equal(platePlus("ada+desk@house.com"), true);
  assert.equal(platePlus("ada@house.com"), false);
  assert.equal(plateLane("ada+desk@house.com"), "desk");
  assert.equal(plateWide("verylonglocalpart@post.mail.co"), true);
  assert.equal(plateWide("ada@house.com"), false);
  assert.equal(plateLane("verylonglocalpart@post.mail.co"), "long");
  assert.equal(plateLane("northporter@rose.org"), "hall");
  assert.equal(plateState("ada@house"), "clear");
  assert.equal(plateState(""), "clear");
  assert.equal(plateState("paris"), "clear");
  assert.equal(plateState({ email: "ada@house.com", balance: 1 }), "");
  assert.equal(plateState({ code: "HOUSE" }), "");
  assert.equal(plateLane({ email: "beatrice@iris.net" }), "desk");

  const book = [
    { id: "1", label: "Ada", note: "ada@house.com" },
    { id: "2", label: "Bea", note: "beatrice@iris.net" },
    { id: "3", label: "Cem", note: "northporter@rose.org" },
  ];
  assert.equal(leadingPlate(book), "brief");
  assert.match(plateLanesCsv(book), /brief,1/);
  assert.match(plateRowsCsv(book, ["1"]), /ada@house.com,ada,brief,ivory/);
  assert.match(plateRowsCsv(book, ["1"]), /beatrice@iris.net,beat,desk,graphite/);
  assert.match(plateRowsCsv(book, ["1"]), /northporter@rose.org,nort,hall,champagne/);

  const keys = Object.keys(ROUND259_COPY.en);
  assert.ok(keys.length >= 160);
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND259_COPY[locale]).sort(), keys.slice().sort());
    for (const key of keys) {
      assert.equal(typeof ROUND259_COPY[locale][key as keyof typeof ROUND259_COPY.en], "string");
      assert.ok(ROUND259_COPY[locale][key as keyof typeof ROUND259_COPY.en].length > 0);
    }
  }
  assert.equal(crmv4Text("tr", "vslTitle"), ROUND259_COPY.tr.vslTitle);
  assert.equal(crmv4Text("de", "mbpTitle"), ROUND259_COPY.de.mbpTitle);
  assert.equal(crmv4Text("ru", "vslSub"), ROUND259_COPY.ru.vslSub);
  assert.equal(crmv4Text("ar", "mbpSub"), ROUND259_COPY.ar.mbpSub);
  assert.equal(crmv4Text("en", "vslLogo"), "7FX");
  assert.equal(crmv4Text("en", "vslTitle"), "Vestibule slips");
  assert.notEqual(ROUND259_COPY.tr.vslTitle, ROUND259_COPY.en.vslTitle);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-vsl/);
  assert.match(css, /\.c4-mbp-index/);
  assert.match(css, /\.c4-payout-vestibule/);
  assert.match(css, /\.c4-handoff-vestibule/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round259.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /email/);
  assert.match(viewFile, /vestCsv/);
  assert.match(viewFile, /plateRowsCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "x"/);
  assert.match(viewFile, /event\.key === "j"/);
  assert.match(viewFile, /event\.key === "r"/);
  assert.match(viewFile, /event\.key === "l"/);
  assert.match(viewFile, /event\.key === "g"/);
  assert.match(viewFile, /event\.key === "h"/);
  assert.match(viewFile, /event\.key === "w"/);
  assert.match(viewFile, /event\.key === "b"/);
  assert.match(viewFile, /event\.key === "p"/);
  assert.match(viewFile, /event\.key === "u"/);
  assert.match(viewFile, /event\.key === "y"/);
  assert.match(viewFile, /event\.key === "m"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=24&meta=0&role=TRADER/);
  assert.match(viewFile, /data-cards/);
  assert.match(viewFile, /data-plates/);
  assert.match(viewFile, /data-traders/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestCloth/);
  assert.match(viewFile, /c4-mbp-search/);
  assert.match(viewFile, /vestTimeline/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "vsl"/);
  assert.match(app, /view === "mbp"/);
  const board = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round55.tsx"), "utf8");
  assert.match(board, /c4-payout-vestibule/);
  assert.match(board, /c4-handoff-vestibule/);
  assert.match(board, /data-logo="mono"/);
  assert.match(board, /aria-required=\{false\}/);
  const used = new Set(viewFile.match(/v4\("([a-zA-Z]+)"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of Array.from(used)) assert.ok(key in ROUND259_COPY.en, key);
  const audit = viewFile.match(/"(vslAudit[a-zA-Z]+)"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of audit) assert.ok(key in ROUND259_COPY.en, key);
  const salon = board.match(/"((?:pbVest|shVest)[a-zA-Z]+)"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of salon) assert.ok(key in ROUND259_COPY.en, key);
  console.log("crmv4 round259 tests passed");
}

main();
