/**
 * Report quires and trader margin marks.
 * Run: TZ=UTC npx tsx tests/crmv4-round231.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND231_COPY } from "../src/lib/crmv4/copy-round231";
import {
  activeBay,
  activeGait,
  activeInk,
  activeLeaf,
  activeSpine,
  addQuire,
  addQuireTag,
  addQuireView,
  adjacentQuireCount,
  bayGap,
  bayOf,
  coolingQuire,
  cycleGait,
  fairQuireClerk,
  houseInk,
  inkOf,
  lateQuire,
  leafOf,
  leadingMargin,
  marginLane,
  marginMark,
  marginRowsCsv,
  marginState,
  marginStep,
  marginTone,
  marginsCsv,
  moveQuireFocus,
  peakBay,
  quireDensity,
  quiresCsv,
  quietBay,
  readQuireViews,
  setQuireSeal,
  setQuireSpine,
  sharedMarginCount,
  snoozeQuire,
  spineOf,
  stitchedMargin,
  suggestInk,
  suggestLeaf,
  wideMargin,
} from "../src/lib/crmv4/round231";

function main() {
  assert.equal(inkOf("  graphite "), "GRAPHITE");
  assert.equal(inkOf("ivory"), "IVORY");
  assert.equal(inkOf("champagne"), "CHAMPAGNE");
  assert.equal(inkOf("   "), "");
  assert.equal(inkOf("slate"), "");
  assert.equal(bayOf("1"), 1);
  assert.equal(bayOf(6), 6);
  assert.equal(bayOf("6"), 6);
  assert.equal(bayOf("0"), null);
  assert.equal(bayOf(0), null);
  assert.equal(bayOf("7"), null);
  assert.equal(bayOf("06"), null);
  assert.equal(bayOf(""), null);
  assert.equal(bayOf(1.5), null);
  assert.equal(leafOf("10"), 10);
  assert.equal(leafOf(20), 20);
  assert.equal(leafOf("40"), 40);
  assert.equal(leafOf("15"), null);
  assert.equal(leafOf("010"), null);
  assert.equal(spineOf("3"), 3);
  assert.equal(spineOf(6), 6);
  assert.equal(spineOf("9"), 9);
  assert.equal(spineOf("2"), null);
  assert.equal(spineOf("0"), null);
  assert.equal(peakBay(1), true);
  assert.equal(peakBay(4), true);
  assert.equal(peakBay(2), false);
  assert.equal(peakBay(6), false);
  assert.equal(quietBay(6), true);
  assert.equal(quietBay(1), false);
  assert.equal(bayGap(1, 6), 5);
  assert.equal(bayGap(6, 1), -5);
  assert.equal(bayGap(null, 3), null);
  assert.equal(bayGap(1, 0), null);
  assert.equal(houseInk("ivory"), true);
  assert.equal(houseInk("CHAMPAGNE"), true);
  assert.equal(houseInk("graphite"), false);
  assert.equal(activeBay("peak"), "peak");
  assert.equal(activeBay("6"), "6");
  assert.equal(activeBay("7"), "all");
  assert.equal(activeLeaf("20"), "20");
  assert.equal(activeLeaf("15"), "all");
  assert.equal(activeGait("walk", ["still", "walk", "flare"]), "walk");
  assert.equal(activeGait("glide", ["still", "walk", "flare"]), "all");
  assert.equal(activeSpine("6"), "6");
  assert.equal(activeSpine("2"), "all");
  assert.equal(activeInk("ivory", ["IVORY"]), "IVORY");
  assert.equal(quireDensity("tight"), "tight");
  assert.equal(quireDensity("roomy"), "airy");
  assert.equal(moveQuireFocus(0, 3, 1), 1);
  assert.equal(moveQuireFocus(0, 3, -1), 2);
  assert.equal(suggestInk([]), "CHAMPAGNE");
  assert.equal(suggestLeaf([]), 20);
  assert.equal(fairQuireClerk([], "Ada, Bea"), "Ada");

  const first = addQuire([], {
    id: "a",
    title: "  North quire ",
    note: "quiet",
    clerk: "Ada",
    bay: "1",
    ink: "ivory",
    gait: "still",
    leaf: "10",
    tags: "a b c d e",
    spine: "6",
  });
  assert.equal(first.length, 1);
  assert.equal(first[0].title, "North quire");
  assert.equal(first[0].ink, "IVORY");
  assert.equal(first[0].bay, 1);
  assert.equal(first[0].leaf, 10);
  assert.deepEqual(first[0].tags, ["a", "b", "c", "d"]);
  assert.equal(first[0].spine, 6);
  assert.equal(first[0].seal, false);
  assert.equal(first[0].audit, "save");
  assert.equal(addQuire(first, { id: "b", title: "   " }).length, 1);
  assert.equal(addQuire(first, { id: "a", title: "Other" }).length, 1);
  const raised = setQuireSpine(first, "a", "9");
  assert.equal(raised[0].spine, 9);
  assert.equal(raised[0].audit, "spine");
  const sealed = setQuireSeal(first, "a", true);
  assert.equal(sealed[0].seal, true);
  assert.equal(sealed[0].audit, "seal");
  const snoozed = snoozeQuire(first, "a");
  assert.equal(snoozed[0].leaf, 40);
  const walked = cycleGait(first, "a");
  assert.equal(walked[0].gait, "walk");
  const tagged = addQuireTag(first, "a", "a");
  assert.deepEqual(tagged[0].tags, ["a", "b", "c", "d"]);
  const views = addQuireView([], {
    id: "v",
    name: "Peak",
    tray: "open",
    query: "",
    clerk: "all",
    ink: "all",
    gait: "all",
    bay: "peak",
    leaf: "all",
    spine: "all",
  });
  assert.equal(readQuireViews(views).length, 1);
  const late = addQuire(addQuire([], { id: "a", title: "Late bay", bay: "1", spine: "3" }), { id: "b", title: "Near bay", bay: "4", spine: "3" });
  assert.equal(lateQuire(late.find((panel) => panel.id === "a")!, 6), true);
  assert.equal(lateQuire(late.find((panel) => panel.id === "b")!, 6), false);
  const cooling = addQuire([], { id: "c", title: "Cooling hall", bay: "6", gait: "walk", spine: "3" });
  assert.equal(coolingQuire(cooling[0]), true);
  assert.equal(coolingQuire({ ...cooling[0], gait: "flare" }), false);
  assert.equal(coolingQuire({ ...cooling[0], bay: 2 }), false);
  const far = addQuire(addQuire([], { id: "n1", title: "Far bay", bay: "1", spine: "3" }), { id: "n2", title: "Third bay", bay: "3", spine: "3" });
  assert.equal(adjacentQuireCount(far), 2);
  const close = addQuire(addQuire([], { id: "n3", title: "Near bay two", bay: "1", spine: "3" }), { id: "n4", title: "Second bay", bay: "2", spine: "3" });
  assert.equal(adjacentQuireCount(close), 0);

  assert.equal(marginState("hello"), "set");
  assert.equal(marginState({ name: "  " }), "clear");
  assert.equal(marginState({ name: "Ada", desk: "North", country: "TR", papers: "APPROVED", deposits: 4 }), "");
  assert.equal(marginMark({ name: "North desk" }), "ND");
  assert.equal(marginMark({ name: "One two three" }), "OTT");
  assert.equal(marginLane({ name: "Desk 4", desk: "Alpha", country: "TR" }), "stamp");
  assert.equal(marginLane({ name: "Ada Lane", desk: "Alpha", country: "TR" }), "seal");
  assert.equal(marginLane({ name: "Ada Lane", desk: "Alpha", country: "Turkey" }), "atrium");
  assert.equal(marginLane({ name: "Ada Lane", desk: "London", country: "" }), "nave");
  assert.equal(marginLane({ name: "Ada Lane", desk: "Zurich", country: "" }), "porch");
  assert.equal(marginTone({ name: "Ada", papers: "APPROVED" }), "gilt");
  assert.equal(marginTone({ name: "Ada", papers: "PENDING" }), "pale");
  assert.equal(marginTone({ name: "Ada", papers: "REJECTED" }), "ash");
  assert.equal(marginTone({ name: "Ada", papers: "REVIEW" }), "linen");
  assert.equal(marginTone({ name: "Ada", papers: "NONE" }), "haze");
  assert.equal(stitchedMargin({ name: "North&desk" }), true);
  assert.equal(stitchedMargin({ name: "North/desk" }), false);
  assert.equal(wideMargin({ name: "Ada" }), false);
  assert.equal(wideMargin({ name: "North desk hall" }), true);
  assert.equal(marginStep(""), 0);
  assert.equal(marginStep("Ada"), 1);
  assert.equal(marginStep("North desk"), 2);
  assert.equal(marginStep("One two three"), 3);
  const book = [
    { id: "1", label: "North desk", note: { name: "North desk", desk: "Zurich", country: "" } },
    { id: "2", label: "Ada Lane", note: { name: "Ada Lane", desk: "Alpha", country: "TR", papers: "APPROVED" } },
    { id: "3", label: "Desk 4", note: { name: "Desk 4", desk: "Alpha", country: "TR" } },
  ];
  assert.equal(leadingMargin(book), "stamp");
  assert.equal(sharedMarginCount(book), 0);
  const paired = [
    book[0],
    { id: "4", label: "North door", note: { name: "North door", desk: "Zurich" } },
  ];
  assert.equal(sharedMarginCount(paired), 2);
  assert.match(marginsCsv(book), /porch,1/);
  assert.match(marginRowsCsv(book, ["2"]), /Ada Lane,AL,seal,gilt,2,0,0,0,0,0,1,0,1/);
  assert.match(quiresCsv(first, 6), /North quire,Ada,1,IVORY,still,10,6,a b c d,0,0,0,0,5,0,0,1,0,0,0,quiet,save/);

  const keys = Object.keys(ROUND231_COPY.en);
  assert.ok(keys.length >= 120);
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND231_COPY[locale]).sort(), keys.slice().sort());
    for (const key of keys) {
      assert.equal(typeof ROUND231_COPY[locale][key as keyof typeof ROUND231_COPY.en], "string");
      assert.ok(ROUND231_COPY[locale][key as keyof typeof ROUND231_COPY.en].length > 0);
    }
  }
  assert.equal(crmv4Text("tr", "qirTitle"), ROUND231_COPY.tr.qirTitle);
  assert.equal(crmv4Text("de", "rmgTitle"), ROUND231_COPY.de.rmgTitle);
  assert.equal(crmv4Text("ru", "qirSub"), ROUND231_COPY.ru.qirSub);
  assert.equal(crmv4Text("ar", "rmgSub"), ROUND231_COPY.ar.rmgSub);
  assert.equal(crmv4Text("en", "qirLogo"), "7FX");

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-qir/);
  assert.match(css, /\.c4-rmg-index/);
  assert.match(css, /\.c4-report-ledger/);
  assert.match(css, /\.c4-report-ledger-card/);
  assert.match(css, /\.c4-report-ledger-search/);
  assert.match(css, /\.c4-report-ledger-empty/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round231.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /name/);
  assert.match(viewFile, /desk/);
  assert.match(viewFile, /country/);
  assert.match(viewFile, /papers/);
  assert.match(viewFile, /quiresCsv/);
  assert.match(viewFile, /marginsCsv/);
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
  assert.match(viewFile, /event\.key === "r"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?view=table&take=40&meta=0&role=TRADER/);
  assert.match(viewFile, /\/api\/admin\/tickets\?take=20/);
  assert.match(viewFile, /data-quires/);
  assert.match(viewFile, /data-margins/);
  assert.match(viewFile, /data-keyed/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestInk/);
  assert.match(viewFile, /c4-rmg-search/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "qire"/);
  assert.match(app, /view === "rmgn"/);
  assert.match(app, /ReportQuires/);
  assert.match(app, /ReportMargins/);
  const reports = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round27.tsx"), "utf8");
  assert.match(reports, /c4-report-ledger/);
  assert.match(reports, /c4-report-ledger-card/);
  assert.match(reports, /c4-report-ledger-search/);
  assert.match(reports, /data-desk="ledger"/);
  assert.match(reports, /data-logo="mono"/);
  assert.match(reports, /qire/);
  assert.match(reports, /rmgn/);
  assert.match(reports, /aria-required=\{false\}/);
  const used = new Set(viewFile.match(/v4\("([a-zA-Z0-9]+)"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of Array.from(used)) assert.ok(key in ROUND231_COPY.en, key);
  const audit = viewFile.match(/"(qirAudit[a-zA-Z]+)"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of audit) assert.ok(key in ROUND231_COPY.en, key);
  console.log("crmv4 round231 tests passed");
}

main();
