/**
 * Coffer panels and rosette marks.
 * Run: TZ=UTC npx tsx tests/crmv4-round227.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND227_COPY } from "../src/lib/crmv4/copy-round227";
import {
  activeBay,
  activeGait,
  activeRib,
  activeSpan,
  addCoffer,
  addCofferTag,
  addCofferView,
  bayGap,
  bayOf,
  coolingCoffer,
  cycleGait,
  fairClerk,
  houseInk,
  inkOf,
  lateCoffer,
  leadingRosette,
  moveCofferFocus,
  peakBay,
  quietBay,
  readCofferViews,
  ribOf,
  rosetteLane,
  rosetteMark,
  rosetteRowsCsv,
  rosetteState,
  rosetteStep,
  rosetteTone,
  rosettesCsv,
  rowDensity,
  setCofferGilt,
  setCofferRib,
  sharedRosetteCount,
  snoozeCoffer,
  spanOf,
  stitchedRosette,
  suggestInk,
  suggestSpan,
  wideRosette,
  coffersCsv,
} from "../src/lib/crmv4/round227";

function main() {
  assert.equal(inkOf("  graphite "), "GRAPHITE");
  assert.equal(inkOf("ivory"), "IVORY");
  assert.equal(inkOf("champagne"), "CHAMPAGNE");
  assert.equal(inkOf("   "), "");
  assert.equal(inkOf("slate"), "");
  assert.equal(bayOf("1"), 1);
  assert.equal(bayOf(8), 8);
  assert.equal(bayOf("8"), 8);
  assert.equal(bayOf("0"), null);
  assert.equal(bayOf(0), null);
  assert.equal(bayOf("9"), null);
  assert.equal(bayOf("08"), null);
  assert.equal(bayOf(""), null);
  assert.equal(bayOf(1.5), null);
  assert.equal(spanOf("4"), 4);
  assert.equal(spanOf(12), 12);
  assert.equal(spanOf("24"), 24);
  assert.equal(spanOf("3"), null);
  assert.equal(spanOf("04"), null);
  assert.equal(ribOf("1"), 1);
  assert.equal(ribOf(3), 3);
  assert.equal(ribOf("5"), 5);
  assert.equal(ribOf("2"), null);
  assert.equal(ribOf("0"), null);
  assert.equal(peakBay(2), true);
  assert.equal(peakBay(7), true);
  assert.equal(peakBay(3), false);
  assert.equal(quietBay(8), true);
  assert.equal(quietBay(7), false);
  assert.equal(bayGap(1, 8), 7);
  assert.equal(bayGap(8, 1), -7);
  assert.equal(bayGap(null, 3), null);
  assert.equal(bayGap(1, 0), null);
  assert.equal(houseInk("graphite"), true);
  assert.equal(houseInk("CHAMPAGNE"), true);
  assert.equal(houseInk("ivory"), false);
  assert.equal(activeBay("peak"), "peak");
  assert.equal(activeBay("8"), "8");
  assert.equal(activeBay("9"), "all");
  assert.equal(activeSpan("12"), "12");
  assert.equal(activeSpan("8"), "all");
  assert.equal(activeGait("stride", ["hush", "stride", "rush"]), "stride");
  assert.equal(activeGait("glide", ["hush", "stride", "rush"]), "all");
  assert.equal(activeRib("3"), "3");
  assert.equal(activeRib("2"), "all");
  assert.equal(rowDensity("tight"), "tight");
  assert.equal(rowDensity("roomy"), "airy");
  assert.equal(moveCofferFocus(0, 3, 1), 1);
  assert.equal(moveCofferFocus(0, 3, -1), 2);
  assert.equal(suggestInk([]), "GRAPHITE");
  assert.equal(suggestSpan([]), 12);
  assert.equal(fairClerk([], "Ada, Bea"), "Ada");

  const first = addCoffer([], {
    id: "a",
    title: "  North coffer ",
    note: "quiet",
    clerk: "Ada",
    bay: "1",
    ink: "graphite",
    gait: "hush",
    span: "4",
    tags: "d e f q",
    rib: "3",
  });
  assert.equal(first.length, 1);
  assert.equal(first[0].title, "North coffer");
  assert.equal(first[0].ink, "GRAPHITE");
  assert.equal(first[0].bay, 1);
  assert.equal(first[0].span, 4);
  assert.deepEqual(first[0].tags, ["d", "e"]);
  assert.equal(first[0].rib, 3);
  assert.equal(first[0].gilt, false);
  assert.equal(first[0].audit, "save");
  assert.equal(addCoffer(first, { id: "b", title: "   " }).length, 1);
  assert.equal(addCoffer(first, { id: "a", title: "Other" }).length, 1);
  const raised = setCofferRib(first, "a", "5");
  assert.equal(raised[0].rib, 5);
  assert.equal(raised[0].audit, "rib");
  const gilt = setCofferGilt(first, "a", true);
  assert.equal(gilt[0].gilt, true);
  assert.equal(gilt[0].audit, "gilt");
  const snoozed = snoozeCoffer(first, "a");
  assert.equal(snoozed[0].span, 12);
  const strode = cycleGait(first, "a");
  assert.equal(strode[0].gait, "stride");
  const tagged = addCofferTag(first, "a", "d");
  assert.deepEqual(tagged[0].tags, ["d", "e"]);
  const views = addCofferView([], {
    id: "v",
    name: "Peak",
    tray: "open",
    query: "",
    clerk: "all",
    ink: "all",
    gait: "all",
    bay: "peak",
    span: "all",
    rib: "all",
  });
  assert.equal(readCofferViews(views).length, 1);
  const late = addCoffer([{ ...first[0], rib: 1 }], { id: "b", title: "Late bay", bay: "1", rib: "1" });
  assert.equal(lateCoffer(late.find((panel) => panel.id === "a")!, 8), true);
  assert.equal(lateCoffer(late.find((panel) => panel.id === "b")!, 4), false);
  const cooling = addCoffer([], { id: "c", title: "Cooling hall", bay: "8", gait: "rush", rib: "1" });
  assert.equal(coolingCoffer(cooling[0]), true);
  assert.equal(coolingCoffer({ ...cooling[0], gait: "hush" }), false);
  assert.equal(coolingCoffer({ ...cooling[0], bay: 7 }), false);

  assert.equal(rosetteState("hello"), "set");
  assert.equal(rosetteState({ trader: "  " }), "clear");
  assert.equal(rosetteState({ trader: "Ada", type: "CALL", worker: "Bea", deposits: 4 }), "");
  assert.equal(rosetteMark({ trader: "North desk", type: "NOTE" }), "NOR");
  assert.equal(rosetteLane({ trader: "Ada", type: "CALL" }), "bell");
  assert.equal(rosetteLane({ trader: "North", type: "NOTE" }), "margin");
  assert.equal(rosetteLane({ trader: "Desk 4", type: "CHAT" }), "cipher");
  assert.equal(rosetteLane({ trader: "A1", type: "NOTE" }), "cipher");
  assert.equal(rosetteTone({ trader: "Ada", type: "CALL", worker: "Bea" }), "bright");
  assert.equal(rosetteTone({ trader: "Ada", type: "CALL" }), "dim");
  assert.equal(rosetteTone({ trader: "Ada", type: "NOTE", worker: "Bea" }), "even");
  assert.equal(rosetteTone({ trader: "Ada" }), "mist");
  assert.equal(rosetteTone({ trader: "Ada", type: "CHAT" }), "hush");
  assert.equal(stitchedRosette({ trader: "North-desk", type: "NOTE" }), true);
  assert.equal(stitchedRosette({ trader: "Ada", type: "NOTE" }), false);
  assert.equal(wideRosette("Ada"), false);
  assert.equal(wideRosette("North desk"), true);
  assert.equal(rosetteStep(""), 0);
  assert.equal(rosetteStep("Ada"), 1);
  assert.equal(rosetteStep("North desk"), 2);
  assert.equal(rosetteStep("One two three"), 3);
  const book = [
    { id: "1", label: "North desk", note: { trader: "North desk", type: "NOTE" } },
    { id: "2", label: "Ada Lane", note: { trader: "Ada Lane", type: "CALL", worker: "Bea" } },
    { id: "3", label: "Desk 4", note: { trader: "Desk 4", type: "CHAT" } },
  ];
  assert.equal(leadingRosette(book), "margin");
  assert.equal(sharedRosetteCount(book), 0);
  const paired = [
    book[0],
    { id: "4", label: "North extra", note: { trader: "North extra", type: "NOTE" } },
  ];
  assert.equal(sharedRosetteCount(paired), 2);
  assert.match(rosettesCsv(book), /margin,1/);
  assert.match(rosetteRowsCsv(book, ["2"]), /Ada Lane,ADA,bell,bright,2,0,0,0,1,0,0,1/);
  assert.match(coffersCsv(first, 8), /North coffer,Ada,1,GRAPHITE,hush,4,3,d e,0,0,0,0,7,0,0,1,0,0,0,quiet,save/);

  const keys = Object.keys(ROUND227_COPY.en);
  assert.ok(keys.length >= 120);
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND227_COPY[locale]).sort(), keys.slice().sort());
    for (const key of keys) {
      assert.equal(typeof ROUND227_COPY[locale][key as keyof typeof ROUND227_COPY.en], "string");
      assert.ok(ROUND227_COPY[locale][key as keyof typeof ROUND227_COPY.en].length > 0);
    }
  }
  assert.equal(crmv4Text("tr", "cffTitle"), ROUND227_COPY.tr.cffTitle);
  assert.equal(crmv4Text("de", "rstTitle"), ROUND227_COPY.de.rstTitle);
  assert.equal(crmv4Text("ru", "cffSub"), ROUND227_COPY.ru.cffSub);
  assert.equal(crmv4Text("ar", "rstSub"), ROUND227_COPY.ar.rstSub);
  assert.equal(crmv4Text("en", "cffLogo"), "7FX");

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-cff/);
  assert.match(css, /\.c4-rst-index/);
  assert.match(css, /\.c4-logs-coffer/);
  assert.match(css, /\.c4-logs-coffer-index/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round227.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /type/);
  assert.match(viewFile, /trader/);
  assert.match(viewFile, /worker/);
  assert.match(viewFile, /coffersCsv/);
  assert.match(viewFile, /rosettesCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "t"/);
  assert.match(viewFile, /event\.key === "j"/);
  assert.match(viewFile, /event\.key === "p"/);
  assert.match(viewFile, /event\.key === "n"/);
  assert.match(viewFile, /event\.key === "r"/);
  assert.match(viewFile, /event\.key === "h"/);
  assert.match(viewFile, /event\.key === "g"/);
  assert.match(viewFile, /event\.key === "b"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/communications\?take=40/);
  assert.match(viewFile, /data-coffers/);
  assert.match(viewFile, /data-rosettes/);
  assert.match(viewFile, /data-keyed/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /logs/);
  assert.match(viewFile, /suggestInk/);
  assert.match(viewFile, /c4-rst-time/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "coff"/);
  assert.match(app, /view === "rsst"/);
  assert.match(app, /CofferPanels/);
  assert.match(app, /RosetteMarks/);
  const logs = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/views/Logs.tsx"), "utf8");
  assert.match(logs, /c4-logs-coffer/);
  assert.match(logs, /c4-logs-coffer-index/);
  assert.match(logs, /c4-logs-narthex/);
  assert.match(logs, /c4-logs-ambulatory/);
  assert.match(logs, /c4-logs-transept/);
  assert.match(logs, /data-logo="mono"/);
  assert.match(logs, /data-desk="coffer"/);
  const used = new Set(viewFile.match(/v4\("([a-zA-Z0-9]+)"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of Array.from(used)) assert.ok(key in ROUND227_COPY.en, key);
  const audit = viewFile.match(/"(cffAudit[a-zA-Z]+)"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of audit) assert.ok(key in ROUND227_COPY.en, key);
  console.log("crmv4 round227 tests passed");
}

main();
