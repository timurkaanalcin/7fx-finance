/**
 * Aisle niches and escutcheon marks.
 * Run: TZ=UTC npx tsx tests/crmv4-round229.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND229_COPY } from "../src/lib/crmv4/copy-round229";
import {
  activeGait,
  activeBay,
  activeStay,
  activeLamp,
  addNiche,
  addNicheTag,
  addNicheView,
  escutcheonLane,
  escutcheonMark,
  escutcheonRowsCsv,
  escutcheonState,
  escutcheonStep,
  escutcheonTone,
  escutcheonsCsv,
  adjacentNicheCount,
  coolingNiche,
  cycleGait,
  nichesCsv,
  fairUsher,
  houseCloth,
  lateNiche,
  leadingEscutcheon,
  moveNicheFocus,
  clothOf,
  readNicheViews,
  rowDensity,
  setNicheCrest,
  setNicheStay,
  sharedEscutcheonCount,
  bayGap,
  bayOf,
  snoozeNiche,
  stayOf,
  stitchedEscutcheon,
  suggestCloth,
  suggestLamp,
  wideEscutcheon,
  lampOf,
  peakBay,
  quietBay,
} from "../src/lib/crmv4/round229";

function main() {
  assert.equal(clothOf("  ivory "), "IVORY");
  assert.equal(clothOf("graphite"), "GRAPHITE");
  assert.equal(clothOf("champagne"), "CHAMPAGNE");
  assert.equal(clothOf("   "), "");
  assert.equal(clothOf("slate"), "");
  assert.equal(bayOf("1"), 1);
  assert.equal(bayOf(7), 7);
  assert.equal(bayOf("7"), 7);
  assert.equal(bayOf("0"), null);
  assert.equal(bayOf(0), null);
  assert.equal(bayOf("8"), null);
  assert.equal(bayOf("07"), null);
  assert.equal(bayOf(""), null);
  assert.equal(bayOf(1.5), null);
  assert.equal(lampOf("5"), 5);
  assert.equal(lampOf(15), 15);
  assert.equal(lampOf("45"), 45);
  assert.equal(lampOf("4"), null);
  assert.equal(lampOf("05"), null);
  assert.equal(stayOf("2"), 2);
  assert.equal(stayOf(4), 4);
  assert.equal(stayOf("8"), 8);
  assert.equal(stayOf("1"), null);
  assert.equal(stayOf("0"), null);
  assert.equal(peakBay(3), true);
  assert.equal(peakBay(6), true);
  assert.equal(peakBay(2), false);
  assert.equal(quietBay(1), true);
  assert.equal(quietBay(7), false);
  assert.equal(bayGap(1, 7), 6);
  assert.equal(bayGap(7, 1), -6);
  assert.equal(bayGap(null, 3), null);
  assert.equal(bayGap(1, 0), null);
  assert.equal(houseCloth("ivory"), true);
  assert.equal(houseCloth("CHAMPAGNE"), true);
  assert.equal(houseCloth("graphite"), false);
  assert.equal(activeBay("peak"), "peak");
  assert.equal(activeBay("7"), "7");
  assert.equal(activeBay("8"), "all");
  assert.equal(activeLamp("15"), "15");
  assert.equal(activeLamp("12"), "all");
  assert.equal(activeGait("walk", ["still", "walk", "flare"]), "walk");
  assert.equal(activeGait("glide", ["still", "walk", "flare"]), "all");
  assert.equal(activeStay("4"), "4");
  assert.equal(activeStay("1"), "all");
  assert.equal(rowDensity("tight"), "tight");
  assert.equal(rowDensity("roomy"), "airy");
  assert.equal(moveNicheFocus(0, 3, 1), 1);
  assert.equal(moveNicheFocus(0, 3, -1), 2);
  assert.equal(suggestCloth([]), "IVORY");
  assert.equal(suggestLamp([]), 15);
  assert.equal(fairUsher([], "Ada, Bea"), "Ada");

  const first = addNiche([], {
    id: "a",
    title: "  North niche ",
    note: "quiet",
    usher: "Ada",
    bay: "1",
    cloth: "ivory",
    gait: "still",
    lamp: "5",
    tags: "a b c d",
    stay: "4",
  });
  assert.equal(first.length, 1);
  assert.equal(first[0].title, "North niche");
  assert.equal(first[0].cloth, "IVORY");
  assert.equal(first[0].bay, 1);
  assert.equal(first[0].lamp, 5);
  assert.deepEqual(first[0].tags, ["a", "b", "c"]);
  assert.equal(first[0].stay, 4);
  assert.equal(first[0].crest, false);
  assert.equal(first[0].audit, "save");
  assert.equal(addNiche(first, { id: "b", title: "   " }).length, 1);
  assert.equal(addNiche(first, { id: "a", title: "Other" }).length, 1);
  const raised = setNicheStay(first, "a", "8");
  assert.equal(raised[0].stay, 8);
  assert.equal(raised[0].audit, "stay");
  const crest = setNicheCrest(first, "a", true);
  assert.equal(crest[0].crest, true);
  assert.equal(crest[0].audit, "crest");
  const snoozed = snoozeNiche(first, "a");
  assert.equal(snoozed[0].lamp, 15);
  const walked = cycleGait(first, "a");
  assert.equal(walked[0].gait, "walk");
  const tagged = addNicheTag(first, "a", "a");
  assert.deepEqual(tagged[0].tags, ["a", "b", "c"]);
  const views = addNicheView([], {
    id: "v",
    name: "Peak",
    tray: "open",
    query: "",
    usher: "all",
    cloth: "all",
    gait: "all",
    bay: "peak",
    lamp: "all",
    stay: "all",
  });
  assert.equal(readNicheViews(views).length, 1);
  const late = addNiche([{ ...first[0], stay: 2 }], { id: "b", title: "Late bay", bay: "1", stay: "2" });
  assert.equal(lateNiche(late.find((panel) => panel.id === "a")!, 7), true);
  assert.equal(lateNiche(late.find((panel) => panel.id === "b")!, 3), false);
  const cooling = addNiche([], { id: "c", title: "Cooling hall", bay: "1", gait: "walk", stay: "2" });
  assert.equal(coolingNiche(cooling[0]), true);
  assert.equal(coolingNiche({ ...cooling[0], gait: "flare" }), false);
  assert.equal(coolingNiche({ ...cooling[0], bay: 2 }), false);
  const far = addNiche(addNiche([], { id: "n1", title: "Far bay", bay: "1", stay: "2" }), { id: "n2", title: "Fifth bay", bay: "5", stay: "2" });
  assert.equal(adjacentNicheCount(far), 2);
  const close = addNiche(addNiche([], { id: "n3", title: "Near bay", bay: "1", stay: "2" }), { id: "n4", title: "Third bay", bay: "3", stay: "2" });
  assert.equal(adjacentNicheCount(close), 0);

  assert.equal(escutcheonState("hello"), "set");
  assert.equal(escutcheonState({ customer: "  " }), "clear");
  assert.equal(escutcheonState({ customer: "Ada", kind: "DEPOSIT", status: "APPROVED", deposits: 4 }), "");
  assert.equal(escutcheonMark({ customer: "North desk", kind: "WITHDRAW" }), "ND");
  assert.equal(escutcheonLane({ customer: "Ada", kind: "DEPOSIT" }), "bell");
  assert.equal(escutcheonLane({ customer: "North", kind: "WITHDRAW" }), "margin");
  assert.equal(escutcheonLane({ customer: "Desk 4", kind: "MARGIN" }), "cipher");
  assert.equal(escutcheonLane({ customer: "Margin hall", kind: "KYC" }), "quill");
  assert.equal(escutcheonTone({ customer: "Ada", kind: "DEPOSIT", status: "APPROVED" }), "bright");
  assert.equal(escutcheonTone({ customer: "Ada", kind: "DEPOSIT", status: "PENDING" }), "dim");
  assert.equal(escutcheonTone({ customer: "Ada", kind: "WITHDRAW", status: "APPROVED" }), "even");
  assert.equal(escutcheonTone({ customer: "Ada", kind: "WITHDRAW", status: "REJECTED" }), "hush");
  assert.equal(escutcheonTone({ customer: "Ada" }), "mist");
  assert.equal(stitchedEscutcheon({ customer: "North/desk", kind: "WITHDRAW" }), true);
  assert.equal(stitchedEscutcheon({ customer: "North-desk", kind: "WITHDRAW" }), false);
  assert.equal(wideEscutcheon({ customer: "Ada" }), false);
  assert.equal(wideEscutcheon({ customer: "North desk hall" }), true);
  assert.equal(escutcheonStep(""), 0);
  assert.equal(escutcheonStep("Ada"), 1);
  assert.equal(escutcheonStep("North desk"), 2);
  assert.equal(escutcheonStep("One two three"), 3);
  const book = [
    { id: "1", label: "North desk", note: { customer: "North desk", kind: "WITHDRAW" } },
    { id: "2", label: "Ada Lane", note: { customer: "Ada Lane", kind: "DEPOSIT", status: "APPROVED" } },
    { id: "3", label: "Desk 4", note: { customer: "Desk 4", kind: "MARGIN" } },
  ];
  assert.equal(leadingEscutcheon(book), "margin");
  assert.equal(sharedEscutcheonCount(book), 0);
  const paired = [
    book[0],
    { id: "4", label: "North door", note: { customer: "North door", kind: "WITHDRAW" } },
  ];
  assert.equal(sharedEscutcheonCount(paired), 2);
  assert.match(escutcheonsCsv(book), /margin,1/);
  assert.match(escutcheonRowsCsv(book, ["2"]), /Ada Lane,AL,bell,bright,2,0,0,0,1,0,0,1/);
  assert.match(nichesCsv(first, 7), /North niche,Ada,1,IVORY,still,5,4,a b c,0,0,0,0,6,0,0,1,0,0,0,quiet,save/);

  const keys = Object.keys(ROUND229_COPY.en);
  assert.ok(keys.length >= 120);
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND229_COPY[locale]).sort(), keys.slice().sort());
    for (const key of keys) {
      assert.equal(typeof ROUND229_COPY[locale][key as keyof typeof ROUND229_COPY.en], "string");
      assert.ok(ROUND229_COPY[locale][key as keyof typeof ROUND229_COPY.en].length > 0);
    }
  }
  assert.equal(crmv4Text("tr", "ainTitle"), ROUND229_COPY.tr.ainTitle);
  assert.equal(crmv4Text("de", "escTitle"), ROUND229_COPY.de.escTitle);
  assert.equal(crmv4Text("ru", "ainSub"), ROUND229_COPY.ru.ainSub);
  assert.equal(crmv4Text("ar", "escSub"), ROUND229_COPY.ar.escSub);
  assert.equal(crmv4Text("en", "ainLogo"), "7FX");

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-ain/);
  assert.match(css, /\.c4-esc-index/);
  assert.match(css, /\.c4-aff-aisle/);
  assert.match(css, /\.c4-aff-aisle-card/);
  assert.match(css, /\.c4-aff-aisle-search/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round229.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /kind/);
  assert.match(viewFile, /customer/);
  assert.match(viewFile, /status/);
  assert.match(viewFile, /nichesCsv/);
  assert.match(viewFile, /escutcheonsCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "t"/);
  assert.match(viewFile, /event\.key === "j"/);
  assert.match(viewFile, /event\.key === "u"/);
  assert.match(viewFile, /event\.key === "m"/);
  assert.match(viewFile, /event\.key === "w"/);
  assert.match(viewFile, /event\.key === "y"/);
  assert.match(viewFile, /event\.key === "s"/);
  assert.match(viewFile, /event\.key === "d"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?view=table&take=40&meta=0&role=TRADER/);
  assert.match(viewFile, /\/api\/admin\/documents\?status=PENDING&take=20/);
  assert.match(viewFile, /data-niches/);
  assert.match(viewFile, /data-escutcheons/);
  assert.match(viewFile, /data-keyed/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /affiliates/);
  assert.match(viewFile, /suggestCloth/);
  assert.match(viewFile, /c4-esc-time/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "aisl"/);
  assert.match(app, /view === "esct"/);
  assert.match(app, /AisleNiches/);
  assert.match(app, /EscutcheonMarks/);
  const aisle = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round45.tsx"), "utf8");
  assert.match(aisle, /c4-aff-aisle/);
  assert.match(aisle, /c4-aff-aisle-card/);
  assert.match(aisle, /c4-aff-aisle-search/);
  assert.match(aisle, /data-desk="aisle"/);
  assert.match(aisle, /data-logo="mono"/);
  assert.match(aisle, /aisl/);
  assert.match(aisle, /esct/);
  assert.match(aisle, /aria-required=\{false\}/);
  const used = new Set(viewFile.match(/v4\("([a-zA-Z0-9]+)"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of Array.from(used)) assert.ok(key in ROUND229_COPY.en, key);
  const audit = viewFile.match(/"(ainAudit[a-zA-Z]+)"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of audit) assert.ok(key in ROUND229_COPY.en, key);
  console.log("crmv4 round229 tests passed");
}

main();
