/**
 * Alcove slips and passport stamps.
 * Run: TZ=UTC npx tsx tests/crmv4-round239.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND239_COPY } from "../src/lib/crmv4/copy-round239";
import {
  activeBay,
  activeSpan,
  activeTempo,
  activeWeight,
  addAlcove,
  addAlcoveTag,
  addAlcoveView,
  adjacentAlcoveCount,
  alcoveTimeline,
  alcovesCsv,
  bayBand,
  bayGap,
  bayOf,
  clothOf,
  coolingAlcove,
  cycleTempo,
  fairSteward,
  houseCloth,
  joinedStamp,
  lateAlcove,
  leadingStamp,
  moveAlcoveFocus,
  peakBay,
  quietBay,
  readAlcoveViews,
  setAlcoveSeal,
  setAlcoveWeight,
  sharedStampCount,
  snoozeAlcove,
  spanOf,
  stampLane,
  stampMark,
  stampRowsCsv,
  stampState,
  stampStep,
  stampTone,
  stampsCsv,
  suggestCloth,
  suggestSpan,
  weightOf,
  wideStamp,
} from "../src/lib/crmv4/round239";

function main() {
  assert.equal(clothOf("  linen "), "LINEN");
  assert.equal(clothOf("wool"), "WOOL");
  assert.equal(clothOf("velvet"), "VELVET");
  assert.equal(clothOf("silk"), "");
  assert.equal(bayOf("2"), 2);
  assert.equal(bayOf(6), 6);
  assert.equal(bayOf("0"), null);
  assert.equal(bayOf("7"), null);
  assert.equal(spanOf("4"), 4);
  assert.equal(spanOf(12), 12);
  assert.equal(spanOf("24"), 24);
  assert.equal(spanOf("10"), null);
  assert.equal(weightOf("1"), 1);
  assert.equal(weightOf(3), 3);
  assert.equal(weightOf("6"), 6);
  assert.equal(weightOf("2"), null);
  assert.equal(peakBay(2), true);
  assert.equal(peakBay(5), true);
  assert.equal(peakBay(6), false);
  assert.equal(quietBay(6), true);
  assert.equal(quietBay(2), false);
  assert.equal(bayBand(2), "early");
  assert.equal(bayBand(3), "mid");
  assert.equal(bayBand(4), "mid");
  assert.equal(bayBand(5), "late");
  assert.equal(bayBand(6), "late");
  assert.equal(bayGap(1, 5), 4);
  assert.equal(bayGap(5, 1), -4);
  assert.equal(bayGap(null, 4), null);
  assert.equal(houseCloth("wool"), true);
  assert.equal(houseCloth("VELVET"), true);
  assert.equal(houseCloth("linen"), false);
  assert.equal(activeBay("peak"), "peak");
  assert.equal(activeBay("6"), "6");
  assert.equal(activeBay("7"), "all");
  assert.equal(activeSpan("24"), "24");
  assert.equal(activeSpan("10"), "all");
  assert.equal(activeTempo("walk", ["still", "walk", "rush"]), "walk");
  assert.equal(activeTempo("still", ["still", "walk", "rush"]), "still");
  assert.equal(activeWeight("3"), "3");
  assert.equal(activeWeight("2"), "all");
  assert.equal(moveAlcoveFocus(0, 3, 1), 1);
  assert.equal(moveAlcoveFocus(0, 3, -1), 2);
  assert.equal(suggestCloth([]), "VELVET");
  assert.equal(suggestSpan([]), 12);
  assert.equal(fairSteward([], "Ada, Bea"), "Ada");

  const first = addAlcove([], {
    id: "a",
    title: "  North alcove ",
    note: "quiet",
    steward: "Ada",
    bay: "2",
    cloth: "linen",
    tempo: "still",
    span: "4",
    tags: "a b c d e",
    weight: "3",
  });
  assert.equal(first.length, 1);
  assert.equal(first[0].title, "North alcove");
  assert.equal(first[0].cloth, "LINEN");
  assert.equal(first[0].bay, 2);
  assert.equal(first[0].span, 4);
  assert.deepEqual(first[0].tags, ["a", "b", "c", "d"]);
  assert.equal(first[0].weight, 3);
  assert.equal(first[0].seal, false);
  assert.equal(first[0].audit, "save");
  assert.equal(addAlcove(first, { id: "b", title: "   " }).length, 1);
  const raised = setAlcoveWeight(first, "a", "6");
  assert.equal(raised[0].weight, 6);
  assert.equal(raised[0].audit, "weight");
  const sealed = setAlcoveSeal(first, "a", true);
  assert.equal(sealed[0].seal, true);
  assert.equal(sealed[0].audit, "seal");
  const snoozed = snoozeAlcove(first, "a");
  assert.equal(snoozed[0].span, 12);
  assert.equal(snoozeAlcove(snoozed, "a")[0].span, 24);
  assert.equal(snoozeAlcove(snoozeAlcove(snoozed, "a"), "a")[0].span, 24);
  const paced = cycleTempo(first, "a");
  assert.equal(paced[0].tempo, "walk");
  const tagged = addAlcoveTag(first, "a", "a");
  assert.deepEqual(tagged[0].tags, ["a", "b", "c", "d"]);
  const views = addAlcoveView([], {
    id: "v",
    name: "Peak",
    tray: "open",
    query: "",
    steward: "all",
    cloth: "all",
    tempo: "all",
    bay: "peak",
    span: "all",
    weight: "all",
  });
  assert.equal(readAlcoveViews(views).length, 1);
  const late = addAlcove(addAlcove([], { id: "a", title: "Late bay", bay: "1", weight: "1" }), { id: "b", title: "Near bay", bay: "4", weight: "1" });
  assert.equal(lateAlcove(late.find((card) => card.id === "a")!, 5), true);
  assert.equal(lateAlcove(late.find((card) => card.id === "b")!, 5), false);
  const cooling = addAlcove([], { id: "c", title: "Cooling bay", bay: "6", tempo: "rush", weight: "1" });
  assert.equal(coolingAlcove(cooling[0]), true);
  assert.equal(coolingAlcove({ ...cooling[0], tempo: "walk" }), false);
  assert.equal(coolingAlcove({ ...cooling[0], bay: 2 }), false);
  const far = addAlcove(addAlcove([], { id: "n1", title: "Far bay", bay: "1", weight: "1" }), { id: "n2", title: "Fourth bay", bay: "4", weight: "1" });
  assert.equal(adjacentAlcoveCount(far), 2);
  const close = addAlcove(addAlcove([], { id: "n3", title: "Near bay two", bay: "1", weight: "1" }), { id: "n4", title: "Third bay", bay: "3", weight: "1" });
  assert.equal(adjacentAlcoveCount(close), 0);
  assert.equal(alcoveTimeline(far).map((lane) => lane.bay).join(","), "1,4");
  assert.match(alcovesCsv(first, 5), /North alcove,Ada,2,LINEN,still,4,3,a b c d,0,0,0,0,3,0,0,0,0,0,0,quiet,save/);

  assert.equal(stampState("hello"), "set");
  assert.equal(stampState({ name: "  " }), "clear");
  assert.equal(stampState({ name: "Ada", state: "APPROVED", kind: "PASSPORT", deposits: 4 }), "");
  assert.equal(stampMark({ name: "North desk" }), "ND");
  assert.equal(stampMark({ name: "One two three" }), "OT");
  assert.equal(stampLane({ name: "Desk 4", state: "APPROVED" }), "cipher");
  assert.equal(stampLane({ name: "Ada Lane", state: "APPROVED" }), "wax");
  assert.equal(stampLane({ name: "Ada Lane", state: "PENDING" }), "queue");
  assert.equal(stampLane({ name: "Ada Lane", state: "REJECTED" }), "gate");
  assert.equal(stampLane({ name: "Ada Lane", state: "HOLD" }), "vault");
  assert.equal(stampLane({ name: "Ada Lane", state: "" }), "hall");
  assert.equal(stampTone({ name: "Ada", kind: "PASSPORT" }), "gilt");
  assert.equal(stampTone({ name: "Ada", kind: "ID" }), "gilt");
  assert.equal(stampTone({ name: "Ada", kind: "ADDRESS" }), "linen");
  assert.equal(stampTone({ name: "Ada", kind: "SELFIE" }), "pale");
  assert.equal(stampTone({ name: "Ada", kind: "OTHER" }), "ash");
  assert.equal(stampTone({ name: "Ada", kind: "" }), "haze");
  assert.equal(joinedStamp({ name: "North/desk" }), true);
  assert.equal(joinedStamp({ name: "North&desk" }), false);
  assert.equal(wideStamp({ name: "Ada Lane" }), false);
  assert.equal(wideStamp({ name: "North window" }), true);
  assert.equal(stampStep(""), 0);
  assert.equal(stampStep("Ada"), 1);
  assert.equal(stampStep("North desk"), 2);
  assert.equal(stampStep("One two three"), 2);
  const book = [
    { id: "1", label: "North window", note: { name: "North window", state: "", kind: "" } },
    { id: "2", label: "Ada Lane", note: { name: "Ada Lane", state: "APPROVED", kind: "PASSPORT" } },
    { id: "3", label: "Desk four", note: { name: "Desk 4", state: "PENDING", kind: "" } },
  ];
  assert.equal(leadingStamp(book), "cipher");
  assert.equal(sharedStampCount(book), 0);
  const paired = [
    book[0],
    { id: "4", label: "North wind", note: { name: "North wind", state: "" } },
  ];
  assert.equal(sharedStampCount(paired), 2);
  assert.match(stampsCsv(book), /cipher,1/);
  assert.match(stampRowsCsv(book, ["2"]), /Ada Lane,AL,wax,gilt,2,0,0,0,0,0,1,0,0,1/);

  const keys = Object.keys(ROUND239_COPY.en);
  assert.ok(keys.length >= 120);
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND239_COPY[locale]).sort(), keys.slice().sort());
    for (const key of keys) {
      assert.equal(typeof ROUND239_COPY[locale][key as keyof typeof ROUND239_COPY.en], "string");
      assert.ok(ROUND239_COPY[locale][key as keyof typeof ROUND239_COPY.en].length > 0);
    }
  }
  assert.equal(crmv4Text("tr", "alvTitle"), ROUND239_COPY.tr.alvTitle);
  assert.equal(crmv4Text("de", "pspTitle"), ROUND239_COPY.de.pspTitle);
  assert.equal(crmv4Text("ru", "alvSub"), ROUND239_COPY.ru.alvSub);
  assert.equal(crmv4Text("ar", "pspSub"), ROUND239_COPY.ar.pspSub);
  assert.equal(crmv4Text("en", "alvLogo"), "7FX");

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-alv/);
  assert.match(css, /\.c4-psp-index/);
  assert.match(css, /\.c4-digest-salon/);
  assert.match(css, /\.c4-glass-salon/);
  assert.match(css, /\.c4-digest-salon-search/);
  assert.match(css, /\.c4-glass-salon-index/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round239.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /status/);
  assert.match(viewFile, /docType/);
  assert.match(viewFile, /title/);
  assert.match(viewFile, /alcovesCsv/);
  assert.match(viewFile, /stampsCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "t"/);
  assert.match(viewFile, /event\.key === "j"/);
  assert.match(viewFile, /event\.key === "u"/);
  assert.match(viewFile, /event\.key === "s"/);
  assert.match(viewFile, /event\.key === "g"/);
  assert.match(viewFile, /event\.key === "h"/);
  assert.match(viewFile, /event\.key === "w"/);
  assert.match(viewFile, /event\.key === "d"/);
  assert.match(viewFile, /event\.key === "r"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/documents\?take=24/);
  assert.match(viewFile, /data-alcoves/);
  assert.match(viewFile, /data-stamps/);
  assert.match(viewFile, /data-documents/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestCloth/);
  assert.match(viewFile, /c4-psp-search/);
  assert.match(viewFile, /alcoveTimeline/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "alv"/);
  assert.match(app, /view === "psp"/);
  assert.match(app, /AlcoveSlips/);
  assert.match(app, /PassportStamps/);
  const digest = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round65.tsx"), "utf8");
  assert.match(digest, /c4-digest-salon/);
  assert.match(digest, /c4-digest-salon-index/);
  assert.match(digest, /c4-digest-salon-links/);
  assert.match(digest, /c4-digest-salon-search/);
  assert.match(digest, /data-desk="salon"/);
  assert.match(digest, /data-logo="mono"/);
  assert.match(digest, /c4-glass-salon/);
  assert.match(digest, /c4-glass-salon-mast/);
  assert.match(digest, /data-digest-desk/);
  assert.match(digest, /data-glass-strip/);
  assert.match(digest, /data-confirm/);
  assert.match(digest, /digestCsv/);
  const used = new Set(viewFile.match(/v4\("([a-zA-Z0-9]+)"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of Array.from(used)) assert.ok(key in ROUND239_COPY.en, key);
  const audit = viewFile.match(/"(alvAudit[a-zA-Z]+)"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of audit) assert.ok(key in ROUND239_COPY.en, key);
  const digestUsed = new Set(digest.match(/v4\("(alv|psp)[a-zA-Z0-9]+"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of Array.from(digestUsed)) assert.ok(key in ROUND239_COPY.en, key);
  console.log("crmv4 round239 tests passed");
}

main();
