/**
 * Mezzanine rails and symbol crests.
 * Run: TZ=UTC npx tsx tests/crmv4-round222.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND222_COPY } from "../src/lib/crmv4/copy-round222";
import {
  activeBay,
  activeBell,
  activeTempo,
  addRail,
  addRailTag,
  addRailView,
  bayGap,
  bayOf,
  bellOf,
  catalogCrest,
  catalogCrestCount,
  crestLane,
  crestRowsCsv,
  crestState,
  crestStep,
  crestTone,
  crestsCsv,
  cycleTempo,
  densityOf,
  fairWatcher,
  finishOf,
  houseFinish,
  lateRail,
  leadingCrest,
  markOf,
  moveFocus,
  peakBay,
  quietBay,
  readRailViews,
  setRailWeight,
  sharedMarkCount,
  snoozeRail,
  suggestBell,
  suggestFinish,
  weightOf,
  wideCrest,
  railsCsv,
} from "../src/lib/crmv4/round222";

function main() {
  assert.equal(finishOf("  linen "), "LINEN");
  assert.equal(finishOf("graphite"), "GRAPHITE");
  assert.equal(finishOf("champagne"), "CHAMPAGNE");
  assert.equal(finishOf("   "), "");
  assert.equal(finishOf("ivory"), "");
  assert.equal(bayOf("1"), 1);
  assert.equal(bayOf(6), 6);
  assert.equal(bayOf("6"), 6);
  assert.equal(bayOf("0"), null);
  assert.equal(bayOf(0), null);
  assert.equal(bayOf("7"), null);
  assert.equal(bayOf("06"), null);
  assert.equal(bayOf(""), null);
  assert.equal(bayOf(1.5), null);
  assert.equal(bellOf("20"), 20);
  assert.equal(bellOf(40), 40);
  assert.equal(bellOf("60"), 60);
  assert.equal(bellOf("15"), null);
  assert.equal(bellOf("020"), null);
  assert.equal(weightOf("2"), 2);
  assert.equal(weightOf(4), 4);
  assert.equal(weightOf("8"), 8);
  assert.equal(weightOf("1"), null);
  assert.equal(weightOf("3"), null);
  assert.equal(peakBay(2), true);
  assert.equal(peakBay(5), true);
  assert.equal(peakBay(3), false);
  assert.equal(quietBay(6), true);
  assert.equal(quietBay(2), false);
  assert.equal(bayGap(1, 4), 3);
  assert.equal(bayGap(6, 1), -5);
  assert.equal(bayGap(null, 3), null);
  assert.equal(bayGap(1, 0), null);
  assert.equal(houseFinish("linen"), true);
  assert.equal(houseFinish("CHAMPAGNE"), true);
  assert.equal(houseFinish("graphite"), false);
  assert.equal(activeBay("peak"), "peak");
  assert.equal(activeBay("6"), "6");
  assert.equal(activeBay("9"), "all");
  assert.equal(activeBell("40"), "40");
  assert.equal(activeBell("15"), "all");
  assert.equal(activeTempo("flare", ["hush", "live", "flare"]), "flare");
  assert.equal(activeTempo("rush", ["hush", "live", "flare"]), "all");
  assert.equal(densityOf("tight"), "tight");
  assert.equal(densityOf("roomy"), "airy");
  assert.equal(moveFocus(0, 3, 1), 1);
  assert.equal(moveFocus(0, 3, -1), 2);
  assert.equal(suggestFinish([]), "LINEN");
  assert.equal(suggestBell([]), 40);

  const first = addRail([], {
    id: "a",
    title: "  North bay ",
    note: "quiet",
    watcher: "Ada",
    bay: "1",
    finish: "linen",
    tempo: "hush",
    bell: "20",
    tags: "a b c d z",
    weight: "4",
  });
  assert.equal(first.length, 1);
  assert.equal(first[0].title, "North bay");
  assert.equal(first[0].finish, "LINEN");
  assert.equal(first[0].bay, 1);
  assert.equal(first[0].bell, 20);
  assert.deepEqual(first[0].tags, ["a", "b", "c"]);
  assert.equal(first[0].weight, 4);
  assert.equal(first[0].audit, "save");
  assert.equal(addRail(first, { id: "b", title: "   " }).length, 1);
  assert.equal(addRail(first, { id: "a", title: "Other" }).length, 1);
  const raised = setRailWeight(first, "a", "8");
  assert.equal(raised[0].weight, 8);
  assert.equal(raised[0].audit, "weight");
  const snoozed = snoozeRail(first, "a");
  assert.equal(snoozed[0].bell, 40);
  const flared = cycleTempo(first, "a");
  assert.equal(flared[0].tempo, "live");
  const tagged = addRailTag(first, "a", "b");
  assert.deepEqual(tagged[0].tags, ["a", "b", "c"]);
  const views = addRailView([], {
    id: "v",
    name: "Peak",
    tray: "open",
    query: "",
    watcher: "all",
    finish: "all",
    tempo: "all",
    bay: "peak",
    bell: "all",
    weight: "all",
  });
  assert.equal(readRailViews(views).length, 1);
  const late = addRail(first, { id: "b", title: "Late bay", bay: "1", weight: "2" });
  assert.equal(lateRail(late[0], 4), true);
  assert.equal(lateRail(late.find((rail) => rail.id === "a")!, 4), false);

  assert.equal(crestState("eurusd"), "set");
  assert.equal(crestState({ symbol: "  " }), "clear");
  assert.equal(crestState({ symbol: "EURUSD", profit: 1 }), "");
  assert.equal(crestState({ symbol: "EURUSD", side: "BUY", status: "OPEN" }), "set");
  assert.equal(markOf({ symbol: "EURUSD", side: "BUY", status: "OPEN" }), "EUR");
  assert.equal(crestLane({ symbol: "EURUSD", side: "LONG", status: "OPEN" }), "core");
  assert.equal(crestLane({ symbol: "BRN.F", side: "SELL", status: "OPEN" }), "wing");
  assert.equal(crestLane({ symbol: "COFFEE", side: "FLAT", status: "CLOSED" }), "loft");
  assert.equal(crestTone({ symbol: "EURUSD", side: "BUY", status: "OPEN" }), "long");
  assert.equal(crestTone({ symbol: "EURUSD", side: "SHORT", status: "OPEN" }), "short");
  assert.equal(crestTone({ symbol: "EURUSD", side: "FLAT", status: "OPEN" }), "flat");
  assert.equal(crestTone({ symbol: "EURUSD", side: "ODD", status: "OPEN" }), "mist");
  assert.equal(catalogCrest({ symbol: "XAUUSD", side: "BUY", status: "OPEN" }), true);
  assert.equal(catalogCrest({ symbol: "COFFEE", side: "BUY", status: "OPEN" }), false);
  assert.equal(wideCrest({ symbol: "NAS100", side: "BUY", status: "OPEN" }), false);
  assert.equal(wideCrest({ symbol: "EURUSD.", side: "BUY", status: "OPEN" }), true);
  assert.equal(crestStep(""), 0);
  assert.equal(crestStep("ABC"), 1);
  assert.equal(crestStep("EURUSD"), 2);
  assert.equal(crestStep("NAS100X"), 3);
  const book = [
    { id: "1", label: "EURUSD", note: { symbol: "EURUSD", side: "BUY", status: "OPEN" } },
    { id: "2", label: "BRN.F", note: { symbol: "BRN.F", side: "SELL", status: "OPEN" } },
    { id: "3", label: "XAUUSD", note: { symbol: "XAUUSD", side: "LONG", status: "CLOSED" } },
  ];
  assert.equal(leadingCrest(book), "core");
  assert.equal(sharedMarkCount([{ id: "1", label: "A", note: "EURUSD" }, { id: "2", label: "B", note: "EURGBP" }]), 2);
  assert.equal(catalogCrestCount(book), 2);
  assert.match(crestsCsv(book), /core,2/);
  assert.match(crestRowsCsv(book, ["2"]), /BRN.F,BRN,wing,short,2,0,0,1,0,1/);
  assert.match(railsCsv(first, 3), /North bay,Ada,1,LINEN,hush,20,4,a b c,0,0,0,2,0,0,1,0,0/);

  const keys = Object.keys(ROUND222_COPY.en);
  assert.ok(keys.length >= 120);
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND222_COPY[locale]).sort(), keys.slice().sort());
    for (const key of keys) {
      assert.equal(typeof ROUND222_COPY[locale][key as keyof typeof ROUND222_COPY.en], "string");
      assert.ok(ROUND222_COPY[locale][key as keyof typeof ROUND222_COPY.en].length > 0);
    }
  }
  assert.equal(crmv4Text("tr", "mzrTitle"), ROUND222_COPY.tr.mzrTitle);
  assert.equal(crmv4Text("de", "sycTitle"), ROUND222_COPY.de.sycTitle);
  assert.equal(crmv4Text("ru", "mzrSub"), ROUND222_COPY.ru.mzrSub);
  assert.equal(crmv4Text("ar", "sycSub"), ROUND222_COPY.ar.sycSub);
  assert.equal(crmv4Text("en", "mzrLogo"), "7FX");
  assert.equal(fairWatcher([], "Ada, Bea"), "Ada");

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-mzr/);
  assert.match(css, /\.c4-syc-index/);
  assert.match(css, /\.c4-book-mezzanine/);
  assert.match(css, /\.c4-syc-time/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round222.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /symbol/);
  assert.match(viewFile, /side/);
  assert.match(viewFile, /status/);
  assert.match(viewFile, /railsCsv/);
  assert.match(viewFile, /crestsCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "n"/);
  assert.match(viewFile, /event\.key === "j"/);
  assert.match(viewFile, /event\.key === "p"/);
  assert.match(viewFile, /event\.key === "g"/);
  assert.match(viewFile, /event\.key === "r"/);
  assert.match(viewFile, /event\.key === "y"/);
  assert.match(viewFile, /event\.key === "h"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/positions\?status=OPEN&take=40/);
  assert.match(viewFile, /data-rails/);
  assert.match(viewFile, /data-crests/);
  assert.match(viewFile, /data-catalog/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /positions/);
  assert.match(viewFile, /suggestFinish/);
  assert.match(viewFile, /c4-syc-time/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "mzrl"/);
  assert.match(app, /view === "syct"/);
  assert.match(app, /MezzanineRails/);
  assert.match(app, /SymbolCrests/);
  assert.match(app, /c4-pagehead-mezzanine/);
  assert.match(app, /c4-rail-mezzanine/);
  const positions = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/views/Positions.tsx"), "utf8");
  assert.match(positions, /c4-book-mezzanine/);
  assert.match(positions, /c4-book-mezzanine-index/);
  assert.match(positions, /data-logo="mono"/);
  assert.match(positions, /data-book="mezzanine"/);
  const used = new Set(viewFile.match(/v4\("([a-zA-Z0-9]+)"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of used) assert.ok(key in ROUND222_COPY.en, key);
  console.log("crmv4 round222 tests passed");
}

main();
