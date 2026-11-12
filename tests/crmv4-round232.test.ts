/**
 * Duty slips and profile crests.
 * Run: TZ=UTC npx tsx tests/crmv4-round232.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND232_COPY } from "../src/lib/crmv4/copy-round232";
import {
  activeBay,
  activeGait,
  activeInk,
  activeLeaf,
  activeSpine,
  addDuty,
  addDutyTag,
  addDutyView,
  adjacentDutyCount,
  bayGap,
  bayOf,
  coolingDuty,
  crestLane,
  crestMark,
  crestRowsCsv,
  crestState,
  crestStep,
  crestTone,
  crestsCsv,
  cycleGait,
  dutiesCsv,
  dutyDensity,
  fairDutyClerk,
  houseInk,
  inkOf,
  lateDuty,
  leafOf,
  leadingCrest,
  moveDutyFocus,
  peakBay,
  quietBay,
  readDutyViews,
  setDutySeal,
  setDutySpine,
  sharedCrestCount,
  snoozeDuty,
  spineOf,
  stitchedCrest,
  suggestInk,
  suggestLeaf,
  wideCrest,
} from "../src/lib/crmv4/round232";

function main() {
  assert.equal(inkOf("  graphite "), "GRAPHITE");
  assert.equal(inkOf("ivory"), "IVORY");
  assert.equal(inkOf("champagne"), "CHAMPAGNE");
  assert.equal(inkOf("slate"), "");
  assert.equal(bayOf("2"), 2);
  assert.equal(bayOf(6), 6);
  assert.equal(bayOf("0"), null);
  assert.equal(bayOf("7"), null);
  assert.equal(leafOf("15"), 15);
  assert.equal(leafOf(30), 30);
  assert.equal(leafOf("60"), 60);
  assert.equal(leafOf("10"), null);
  assert.equal(leafOf("40"), null);
  assert.equal(spineOf("2"), 2);
  assert.equal(spineOf(4), 4);
  assert.equal(spineOf("8"), 8);
  assert.equal(spineOf("3"), null);
  assert.equal(spineOf("6"), null);
  assert.equal(peakBay(2), true);
  assert.equal(peakBay(5), true);
  assert.equal(peakBay(1), false);
  assert.equal(quietBay(3), true);
  assert.equal(quietBay(6), false);
  assert.equal(bayGap(1, 3), 2);
  assert.equal(bayGap(3, 1), -2);
  assert.equal(bayGap(null, 3), null);
  assert.equal(houseInk("graphite"), true);
  assert.equal(houseInk("IVORY"), true);
  assert.equal(houseInk("champagne"), false);
  assert.equal(activeBay("peak"), "peak");
  assert.equal(activeBay("3"), "3");
  assert.equal(activeBay("7"), "all");
  assert.equal(activeLeaf("30"), "30");
  assert.equal(activeLeaf("10"), "all");
  assert.equal(activeGait("steady", ["calm", "steady", "rush"]), "steady");
  assert.equal(activeGait("walk", ["calm", "steady", "rush"]), "all");
  assert.equal(activeSpine("4"), "4");
  assert.equal(activeSpine("3"), "all");
  assert.equal(activeInk("ivory", ["IVORY"]), "IVORY");
  assert.equal(dutyDensity("tight"), "tight");
  assert.equal(dutyDensity("roomy"), "airy");
  assert.equal(moveDutyFocus(0, 3, 1), 1);
  assert.equal(moveDutyFocus(0, 3, -1), 2);
  assert.equal(suggestInk([]), "IVORY");
  assert.equal(suggestLeaf([]), 30);
  assert.equal(fairDutyClerk([], "Ada, Bea"), "Ada");

  const first = addDuty([], {
    id: "a",
    title: "  North slip ",
    note: "quiet",
    clerk: "Ada",
    bay: "2",
    ink: "ivory",
    gait: "calm",
    leaf: "15",
    tags: "w x y z q",
    spine: "4",
  });
  assert.equal(first.length, 1);
  assert.equal(first[0].title, "North slip");
  assert.equal(first[0].ink, "IVORY");
  assert.equal(first[0].bay, 2);
  assert.equal(first[0].leaf, 15);
  assert.deepEqual(first[0].tags, ["w", "x", "y", "z"]);
  assert.equal(first[0].spine, 4);
  assert.equal(first[0].seal, false);
  assert.equal(first[0].audit, "save");
  assert.equal(addDuty(first, { id: "b", title: "   " }).length, 1);
  const raised = setDutySpine(first, "a", "8");
  assert.equal(raised[0].spine, 8);
  assert.equal(raised[0].audit, "spine");
  const sealed = setDutySeal(first, "a", true);
  assert.equal(sealed[0].seal, true);
  assert.equal(sealed[0].audit, "seal");
  const snoozed = snoozeDuty(first, "a");
  assert.equal(snoozed[0].leaf, 60);
  const paced = cycleGait(first, "a");
  assert.equal(paced[0].gait, "steady");
  const tagged = addDutyTag(first, "a", "w");
  assert.deepEqual(tagged[0].tags, ["w", "x", "y", "z"]);
  const views = addDutyView([], {
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
  assert.equal(readDutyViews(views).length, 1);
  const late = addDuty(addDuty([], { id: "a", title: "Late slot", bay: "1", spine: "2" }), { id: "b", title: "Near slot", bay: "2", spine: "2" });
  assert.equal(lateDuty(late.find((panel) => panel.id === "a")!, 3), true);
  assert.equal(lateDuty(late.find((panel) => panel.id === "b")!, 3), false);
  const cooling = addDuty([], { id: "c", title: "Cooling hall", bay: "3", gait: "steady", spine: "2" });
  assert.equal(coolingDuty(cooling[0]), true);
  assert.equal(coolingDuty({ ...cooling[0], gait: "rush" }), false);
  assert.equal(coolingDuty({ ...cooling[0], bay: 2 }), false);
  const far = addDuty(addDuty([], { id: "n1", title: "Far slot", bay: "1", spine: "2" }), { id: "n2", title: "Fourth slot", bay: "4", spine: "2" });
  assert.equal(adjacentDutyCount(far), 2);
  const close = addDuty(addDuty([], { id: "n3", title: "Near slot two", bay: "1", spine: "2" }), { id: "n4", title: "Second slot", bay: "2", spine: "2" });
  assert.equal(adjacentDutyCount(close), 0);

  assert.equal(crestState("hello"), "set");
  assert.equal(crestState({ name: "  " }), "clear");
  assert.equal(crestState({ name: "Ada", desk: "North", language: "TR", role: "ADMIN", deposits: 4 }), "");
  assert.equal(crestMark({ name: "North desk" }), "ND");
  assert.equal(crestMark({ name: "One two three" }), "OT");
  assert.equal(crestLane({ name: "Desk 4", desk: "Alpha", language: "TR" }), "cipher");
  assert.equal(crestLane({ name: "Ada Lane", desk: "Alpha", language: "TR" }), "ribbon");
  assert.equal(crestLane({ name: "Ada Lane", desk: "Alpha", language: "Turkish" }), "studio");
  assert.equal(crestLane({ name: "Ada Lane", desk: "London", language: "" }), "gallery");
  assert.equal(crestLane({ name: "Ada Lane", desk: "Zurich", language: "" }), "foyer");
  assert.equal(crestTone({ name: "Ada", role: "ADMIN" }), "gilt");
  assert.equal(crestTone({ name: "Ada", role: "TRADER" }), "linen");
  assert.equal(crestTone({ name: "Ada", role: "AGENT" }), "pale");
  assert.equal(crestTone({ name: "Ada", role: "VIEWER" }), "ash");
  assert.equal(crestTone({ name: "Ada", role: "STAFF" }), "haze");
  assert.equal(stitchedCrest({ name: "North+desk" }), true);
  assert.equal(stitchedCrest({ name: "North&desk" }), false);
  assert.equal(wideCrest({ name: "Ada" }), false);
  assert.equal(wideCrest({ name: "North desk" }), true);
  assert.equal(crestStep(""), 0);
  assert.equal(crestStep("Ada"), 1);
  assert.equal(crestStep("North desk"), 2);
  assert.equal(crestStep("One two three"), 2);
  const book = [
    { id: "1", label: "North desk", note: { name: "North desk", desk: "Zurich", language: "" } },
    { id: "2", label: "Ada Lane", note: { name: "Ada Lane", desk: "Alpha", language: "TR", role: "ADMIN" } },
    { id: "3", label: "Desk 4", note: { name: "Desk 4", desk: "Alpha", language: "TR" } },
  ];
  assert.equal(leadingCrest(book), "ribbon");
  assert.equal(sharedCrestCount(book), 0);
  const paired = [
    book[0],
    { id: "4", label: "North door", note: { name: "North door", desk: "Zurich" } },
  ];
  assert.equal(sharedCrestCount(paired), 2);
  assert.match(crestsCsv(book), /cipher,1/);
  assert.match(crestRowsCsv(book, ["2"]), /Ada Lane,AL,ribbon,gilt,2,0,0,0,0,0,1,0,1/);
  assert.match(dutiesCsv(first, 3), /North slip,Ada,2,IVORY,calm,15,4,w x y z,0,0,0,0,1,0,0,1,0,0,0,quiet,save/);

  const keys = Object.keys(ROUND232_COPY.en);
  assert.ok(keys.length >= 120);
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND232_COPY[locale]).sort(), keys.slice().sort());
    for (const key of keys) {
      assert.equal(typeof ROUND232_COPY[locale][key as keyof typeof ROUND232_COPY.en], "string");
      assert.ok(ROUND232_COPY[locale][key as keyof typeof ROUND232_COPY.en].length > 0);
    }
  }
  assert.equal(crmv4Text("tr", "dtyTitle"), ROUND232_COPY.tr.dtyTitle);
  assert.equal(crmv4Text("de", "pcrTitle"), ROUND232_COPY.de.pcrTitle);
  assert.equal(crmv4Text("ru", "dtySub"), ROUND232_COPY.ru.dtySub);
  assert.equal(crmv4Text("ar", "pcrSub"), ROUND232_COPY.ar.pcrSub);
  assert.equal(crmv4Text("en", "dtyLogo"), "7FX");

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-dty/);
  assert.match(css, /\.c4-pcr-index/);
  assert.match(css, /\.c4-settings-parlor/);
  assert.match(css, /\.c4-settings-parlor-card/);
  assert.match(css, /\.c4-settings-parlor-search/);
  assert.match(css, /\.c4-settings-parlor-empty/);
  assert.match(css, /\.c4-staff-salon/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round232.tsx"), "utf8");
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
  assert.match(viewFile, /dutiesCsv/);
  assert.match(viewFile, /crestsCsv/);
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
  assert.match(viewFile, /data-duties/);
  assert.match(viewFile, /data-crests/);
  assert.match(viewFile, /data-keyed/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestInk/);
  assert.match(viewFile, /c4-pcr-search/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "dty"/);
  assert.match(app, /view === "pcr"/);
  assert.match(app, /DutySlips/);
  assert.match(app, /ProfileCrests/);
  const settings = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/views/Settings.tsx"), "utf8");
  assert.match(settings, /c4-settings-parlor/);
  assert.match(settings, /c4-settings-parlor-card/);
  assert.match(settings, /c4-settings-parlor-search/);
  assert.match(settings, /c4-settings-parlor-empty/);
  assert.match(settings, /data-desk="parlor"/);
  assert.match(settings, /data-logo="mono"/);
  assert.match(settings, /dty/);
  assert.match(settings, /pcr/);
  assert.match(settings, /aria-required=\{false\}/);
  const staff = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round24.tsx"), "utf8");
  assert.match(staff, /c4-staff-salon/);
  assert.match(staff, /data-desk="salon"/);
  assert.match(staff, /data-logo="mono"/);
  const used = new Set(viewFile.match(/v4\("([a-zA-Z0-9]+)"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of Array.from(used)) assert.ok(key in ROUND232_COPY.en, key);
  const audit = viewFile.match(/"(dtyAudit[a-zA-Z]+)"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of audit) assert.ok(key in ROUND232_COPY.en, key);
  console.log("crmv4 round232 tests passed");
}

main();
