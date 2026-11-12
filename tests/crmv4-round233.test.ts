/**
 * Lintel watches and hour marks.
 * Run: TZ=UTC npx tsx tests/crmv4-round233.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND233_COPY } from "../src/lib/crmv4/copy-round233";
import {
  activeBay,
  activeGait,
  activeInk,
  activeLeaf,
  activeSpine,
  addLintel,
  addLintelTag,
  addLintelView,
  adjacentLintelCount,
  bayGap,
  bayOf,
  coolingLintel,
  cycleGait,
  fairLintelClerk,
  hourLane,
  hourMark,
  hourRowsCsv,
  hourState,
  hourStep,
  hourTone,
  hoursCsv,
  houseInk,
  inkOf,
  lateLintel,
  leafOf,
  leadingHour,
  lintelsCsv,
  moveLintelFocus,
  peakBay,
  quietBay,
  readLintelViews,
  setLintelSeal,
  setLintelSpine,
  sharedHourCount,
  snoozeLintel,
  spineOf,
  stitchedHour,
  suggestInk,
  suggestLeaf,
  wideHour,
} from "../src/lib/crmv4/round233";

function main() {
  assert.equal(inkOf("  linen "), "LINEN");
  assert.equal(inkOf("wool"), "WOOL");
  assert.equal(inkOf("silk"), "SILK");
  assert.equal(inkOf("slate"), "");
  assert.equal(bayOf("2"), 2);
  assert.equal(bayOf(7), 7);
  assert.equal(bayOf("0"), null);
  assert.equal(bayOf("8"), null);
  assert.equal(leafOf("12"), 12);
  assert.equal(leafOf(24), 24);
  assert.equal(leafOf("48"), 48);
  assert.equal(leafOf("15"), null);
  assert.equal(leafOf("30"), null);
  assert.equal(spineOf("1"), 1);
  assert.equal(spineOf(5), 5);
  assert.equal(spineOf("9"), 9);
  assert.equal(spineOf("2"), null);
  assert.equal(spineOf("4"), null);
  assert.equal(peakBay(1), true);
  assert.equal(peakBay(7), true);
  assert.equal(peakBay(2), false);
  assert.equal(quietBay(4), true);
  assert.equal(quietBay(3), false);
  assert.equal(bayGap(1, 4), 3);
  assert.equal(bayGap(4, 1), -3);
  assert.equal(bayGap(null, 4), null);
  assert.equal(houseInk("linen"), true);
  assert.equal(houseInk("WOOL"), true);
  assert.equal(houseInk("silk"), false);
  assert.equal(activeBay("peak"), "peak");
  assert.equal(activeBay("7"), "7");
  assert.equal(activeBay("8"), "all");
  assert.equal(activeLeaf("24"), "24");
  assert.equal(activeLeaf("15"), "all");
  assert.equal(activeGait("stride", ["linger", "stride", "dart"]), "stride");
  assert.equal(activeGait("walk", ["linger", "stride", "dart"]), "all");
  assert.equal(activeSpine("5"), "5");
  assert.equal(activeSpine("2"), "all");
  assert.equal(activeInk("wool", ["WOOL"]), "WOOL");
  assert.equal(moveLintelFocus(0, 3, 1), 1);
  assert.equal(moveLintelFocus(0, 3, -1), 2);
  assert.equal(suggestInk([]), "WOOL");
  assert.equal(suggestLeaf([]), 24);
  assert.equal(fairLintelClerk([], "Ada, Bea"), "Ada");

  const first = addLintel([], {
    id: "a",
    title: "  North watch ",
    note: "quiet",
    clerk: "Ada",
    bay: "2",
    ink: "wool",
    gait: "linger",
    leaf: "12",
    tags: "p q r s t",
    spine: "5",
  });
  assert.equal(first.length, 1);
  assert.equal(first[0].title, "North watch");
  assert.equal(first[0].ink, "WOOL");
  assert.equal(first[0].bay, 2);
  assert.equal(first[0].leaf, 12);
  assert.deepEqual(first[0].tags, ["p", "q", "r", "s"]);
  assert.equal(first[0].spine, 5);
  assert.equal(first[0].seal, false);
  assert.equal(first[0].audit, "save");
  assert.equal(addLintel(first, { id: "b", title: "   " }).length, 1);
  const raised = setLintelSpine(first, "a", "9");
  assert.equal(raised[0].spine, 9);
  assert.equal(raised[0].audit, "spine");
  const sealed = setLintelSeal(first, "a", true);
  assert.equal(sealed[0].seal, true);
  assert.equal(sealed[0].audit, "seal");
  const snoozed = snoozeLintel(first, "a");
  assert.equal(snoozed[0].leaf, 48);
  const paced = cycleGait(first, "a");
  assert.equal(paced[0].gait, "stride");
  const tagged = addLintelTag(first, "a", "p");
  assert.deepEqual(tagged[0].tags, ["p", "q", "r", "s"]);
  const views = addLintelView([], {
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
  assert.equal(readLintelViews(views).length, 1);
  const late = addLintel(addLintel([], { id: "a", title: "Late hook", bay: "1", spine: "1" }), { id: "b", title: "Near hook", bay: "2", spine: "1" });
  assert.equal(lateLintel(late.find((panel) => panel.id === "a")!, 4), true);
  assert.equal(lateLintel(late.find((panel) => panel.id === "b")!, 4), false);
  const cooling = addLintel([], { id: "c", title: "Cooling hook", bay: "4", gait: "stride", spine: "1" });
  assert.equal(coolingLintel(cooling[0]), true);
  assert.equal(coolingLintel({ ...cooling[0], gait: "dart" }), false);
  assert.equal(coolingLintel({ ...cooling[0], bay: 2 }), false);
  const far = addLintel(addLintel([], { id: "n1", title: "Far hook", bay: "1", spine: "1" }), { id: "n2", title: "Third hook", bay: "3", spine: "1" });
  assert.equal(adjacentLintelCount(far), 2);
  const close = addLintel(addLintel([], { id: "n3", title: "Near hook two", bay: "1", spine: "1" }), { id: "n4", title: "Second hook", bay: "2", spine: "1" });
  assert.equal(adjacentLintelCount(close), 0);

  assert.equal(hourState("hello"), "set");
  assert.equal(hourState({ name: "  " }), "clear");
  assert.equal(hourState({ name: "Ada", desk: "NEW", language: "TR", role: "ADMIN", deposits: 4 }), "");
  assert.equal(hourMark({ name: "North desk" }), "ND");
  assert.equal(hourMark({ name: "One two three" }), "OT");
  assert.equal(hourLane({ name: "Desk 4", desk: "CONTACTED", language: "TR" }), "digit");
  assert.equal(hourLane({ name: "Ada Lane", desk: "CONTACTED", language: "TR" }), "flag");
  assert.equal(hourLane({ name: "Ada Lane", desk: "CONTACTED", language: "Turkish" }), "porch");
  assert.equal(hourLane({ name: "Ada Lane", desk: "FUNDED", language: "" }), "choir");
  assert.equal(hourLane({ name: "Ada Lane", desk: "NEW", language: "" }), "nave");
  assert.equal(hourTone({ name: "Ada", role: "ADMIN" }), "gilt");
  assert.equal(hourTone({ name: "Ada", role: "TRADER" }), "wool");
  assert.equal(hourTone({ name: "Ada", role: "AGENT" }), "silk");
  assert.equal(hourTone({ name: "Ada", role: "VIEWER" }), "ash");
  assert.equal(hourTone({ name: "Ada", role: "STAFF" }), "haze");
  assert.equal(stitchedHour({ name: "North&desk" }), true);
  assert.equal(stitchedHour({ name: "North+desk" }), false);
  assert.equal(wideHour({ name: "Ada" }), false);
  assert.equal(wideHour({ name: "North desk" }), false);
  assert.equal(wideHour({ name: "Longmailboxx" }), true);
  assert.equal(hourStep(""), 0);
  assert.equal(hourStep("Ada"), 1);
  assert.equal(hourStep("North desk"), 2);
  assert.equal(hourStep("One two three"), 3);
  const book = [
    { id: "1", label: "North desk", note: { name: "North desk", desk: "NEW", language: "" } },
    { id: "2", label: "Ada Lane", note: { name: "Ada Lane", desk: "CONTACTED", language: "TR", role: "ADMIN" } },
    { id: "3", label: "Desk 4", note: { name: "Desk 4", desk: "CONTACTED", language: "TR" } },
  ];
  assert.equal(leadingHour(book), "nave");
  assert.equal(sharedHourCount(book), 0);
  const paired = [
    book[0],
    { id: "4", label: "North door", note: { name: "North door", desk: "NEW" } },
  ];
  assert.equal(sharedHourCount(paired), 2);
  assert.match(hoursCsv(book), /digit,1/);
  assert.match(hourRowsCsv(book, ["2"]), /Ada Lane,AL,flag,gilt,2,0,0,0,0,0,1,0,1/);
  assert.match(lintelsCsv(first, 3), /North watch,Ada,2,WOOL,linger,12,5,p q r s,0,0,0,0,1,0,0,1,0,0,0,quiet,save/);

  const keys = Object.keys(ROUND233_COPY.en);
  assert.ok(keys.length >= 120);
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND233_COPY[locale]).sort(), keys.slice().sort());
    for (const key of keys) {
      assert.equal(typeof ROUND233_COPY[locale][key as keyof typeof ROUND233_COPY.en], "string");
      assert.ok(ROUND233_COPY[locale][key as keyof typeof ROUND233_COPY.en].length > 0);
    }
  }
  assert.equal(crmv4Text("tr", "lnwTitle"), ROUND233_COPY.tr.lnwTitle);
  assert.equal(crmv4Text("de", "hmkTitle"), ROUND233_COPY.de.hmkTitle);
  assert.equal(crmv4Text("ru", "lnwSub"), ROUND233_COPY.ru.lnwSub);
  assert.equal(crmv4Text("ar", "hmkSub"), ROUND233_COPY.ar.hmkSub);
  assert.equal(crmv4Text("en", "lnwLogo"), "7FX");

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-lnw/);
  assert.match(css, /\.c4-hmk-index/);
  assert.match(css, /\.c4-day-oratory/);
  assert.match(css, /\.c4-day-oratory-card/);
  assert.match(css, /\.c4-day-oratory-empty/);
  assert.match(css, /\.c4-pref-oratory/);
  assert.match(css, /\.c4-pref-oratory-search/);
  assert.match(css, /\.c4-pref-oratory-empty/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round233.tsx"), "utf8");
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
  assert.match(viewFile, /role/);
  assert.match(viewFile, /language/);
  assert.match(viewFile, /email/);
  assert.match(viewFile, /saleStatus/);
  assert.match(viewFile, /lintelsCsv/);
  assert.match(viewFile, /hoursCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "t"/);
  assert.match(viewFile, /event\.key === "j"/);
  assert.match(viewFile, /event\.key === "u"/);
  assert.match(viewFile, /event\.key === "b"/);
  assert.match(viewFile, /event\.key === "p"/);
  assert.match(viewFile, /event\.key === "h"/);
  assert.match(viewFile, /event\.key === "g"/);
  assert.match(viewFile, /event\.key === "d"/);
  assert.match(viewFile, /event\.key === "r"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?view=table&take=40&meta=0/);
  assert.match(viewFile, /\/api\/admin\/tickets\?take=20/);
  assert.match(viewFile, /data-watches/);
  assert.match(viewFile, /data-hours/);
  assert.match(viewFile, /data-keyed/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestInk/);
  assert.match(viewFile, /c4-hmk-search/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "lnw"/);
  assert.match(app, /view === "hmk"/);
  assert.match(app, /LintelWatches/);
  assert.match(app, /HourMarks/);
  const day = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round43.tsx"), "utf8");
  assert.match(day, /c4-day-oratory/);
  assert.match(day, /c4-day-oratory-card/);
  assert.match(day, /c4-day-oratory-empty/);
  assert.match(day, /data-desk="oratory"/);
  assert.match(day, /data-logo="mono"/);
  assert.match(day, /lnw/);
  assert.match(day, /hmk/);
  const prefs = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round32.tsx"), "utf8");
  assert.match(prefs, /c4-pref-oratory/);
  assert.match(prefs, /c4-pref-oratory-search/);
  assert.match(prefs, /c4-pref-oratory-empty/);
  assert.match(prefs, /data-desk="oratory"/);
  assert.match(prefs, /data-logo="mono"/);
  const used = new Set(viewFile.match(/v4\("([a-zA-Z0-9]+)"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of Array.from(used)) assert.ok(key in ROUND233_COPY.en, key);
  const audit = viewFile.match(/"(lnwAudit[a-zA-Z]+)"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of audit) assert.ok(key in ROUND233_COPY.en, key);
  console.log("crmv4 round233 tests passed");
}

main();
