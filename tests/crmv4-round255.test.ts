/**
 * Warrant slips and broker crests.
 * Run: TZ=UTC npx tsx tests/crmv4-round255.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND255_COPY } from "../src/lib/crmv4/copy-round255";
import {
  ROUND255_FEATURES,
  activeHour,
  activeInk,
  activeTempo,
  activeWarrantRank,
  activeWarrantSpan,
  addWarrant,
  addWarrantView,
  bulkWarrantPin,
  busiestClerk,
  crestEcho,
  crestHue,
  crestLane,
  crestLanesCsv,
  crestNotch,
  crestRowsCsv,
  crestSpoken,
  crestStamp,
  crestState,
  crestStep,
  crestWide,
  cycleTempo,
  dropWarrantView,
  fairClerk,
  hourBand,
  hourGap,
  hourOf,
  houseInk,
  idleWarrant,
  inkOf,
  lateWarrant,
  leadingCrest,
  lengthenHour,
  lowerWarrantRank,
  moveWarrantFocus,
  neighborWarrantCount,
  overdueWarrant,
  peakHour,
  quietHour,
  raiseWarrantRank,
  readWarrantViews,
  restingWarrant,
  rushWarrant,
  shortenHour,
  suggestHour,
  suggestInk,
  tempoOf,
  warrantCsv,
  warrantSpanOf,
  warrantRankOf,
  warrantTimeline,
} from "../src/lib/crmv4/round255";

function main() {
  assert.equal(ROUND255_FEATURES.length, 25);
  assert.equal(hourOf(" dawn "), "dawn");
  assert.equal(hourOf("paris"), "");
  assert.equal(warrantSpanOf("15"), 15);
  assert.equal(warrantSpanOf(30), 30);
  assert.equal(warrantSpanOf("60"), 60);
  assert.equal(warrantSpanOf("20"), null);
  assert.equal(warrantRankOf("1"), 1);
  assert.equal(warrantRankOf(3), 3);
  assert.equal(warrantRankOf("5"), 5);
  assert.equal(warrantRankOf("7"), 7);
  assert.equal(warrantRankOf("2"), null);
  assert.equal(inkOf("soot"), "SOOT");
  assert.equal(inkOf("oak"), "OAK");
  assert.equal(inkOf("gilt"), "GILT");
  assert.equal(inkOf("linen"), "");
  assert.equal(tempoOf("still"), "still");
  assert.equal(tempoOf("steady"), "steady");
  assert.equal(tempoOf("brisk"), "brisk");
  assert.equal(tempoOf("walk"), "");
  assert.equal(peakHour("dawn"), true);
  assert.equal(peakHour("NOON"), true);
  assert.equal(peakHour("vespers"), false);
  assert.equal(quietHour("afternoon"), true);
  assert.equal(quietHour("night"), true);
  assert.equal(quietHour("dawn"), false);
  assert.equal(hourBand("dawn"), "early");
  assert.equal(hourBand("noon"), "mid");
  assert.equal(hourBand("vespers"), "late");
  assert.equal(hourBand(""), "");
  assert.equal(hourGap("dawn", "forenoon"), 1);
  assert.equal(hourGap("forenoon", "dawn"), -1);
  assert.equal(hourGap("", "dawn"), null);
  assert.equal(houseInk("soot"), true);
  assert.equal(houseInk("OAK"), true);
  assert.equal(houseInk("gilt"), false);
  assert.equal(activeHour("peak"), "peak");
  assert.equal(activeHour("dawn"), "dawn");
  assert.equal(activeHour("paris"), "all");
  assert.equal(activeWarrantSpan("15"), "15");
  assert.equal(activeWarrantSpan("20"), "all");
  assert.equal(activeTempo("steady", ["still", "steady", "brisk"]), "steady");
  assert.equal(activeTempo("walk", ["still", "steady", "brisk"]), "all");
  assert.equal(activeWarrantRank("5"), "5");
  assert.equal(activeWarrantRank("2"), "all");
  assert.equal(activeInk("oak"), "oak");
  assert.equal(activeInk("linen"), "all");
  assert.equal(moveWarrantFocus(0, 3, 1), 1);
  assert.equal(moveWarrantFocus(0, 3, -1), 2);
  assert.equal(suggestInk([]), "SOOT");
  assert.equal(suggestHour([], 4), 15);
  assert.equal(suggestHour([], 12), 30);
  assert.equal(suggestHour([], 19), 60);
  assert.equal(fairClerk([], "Ada, Bea"), "Ada");

  const first = addWarrant([], {
    id: "a",
    title: "  North warrant ",
    note: "",
    courier: "Ada",
    watch: "dawn",
    cloth: "soot",
    pace: "still",
    span: 15,
    rank: 1,
    tags: "e e f",
  });
  assert.equal(first.length, 1);
  assert.equal(first[0].title, "North warrant");
  assert.equal(first[0].note, "");
  assert.equal(first[0].cloth, "SOOT");
  assert.equal(first[0].tags.join(""), "ef");
  assert.equal(first[0].audit, "save");
  assert.equal(overdueWarrant(first[0]), true);
  assert.equal(addWarrant(first, { id: "a", title: "Other" }).length, 1);
  assert.equal(addWarrant(first, { id: "b", title: "North warrant" }).length, 1);
  assert.equal(addWarrant(first, { id: "b", title: "   " }).length, 1);

  const pinned = bulkWarrantPin(first, ["a"]);
  assert.equal(overdueWarrant(pinned[0]), false);
  assert.equal(fairClerk(pinned, "Ada, Bea"), "Ada");
  const quiet = addWarrant(pinned, { id: "q", title: "Night rest", courier: "Bea", watch: "afternoon", pace: "still", rank: 1 });
  assert.equal(idleWarrant(quiet[0]), true);
  assert.equal(lateWarrant(quiet[0], "vespers"), false);
  const behind = addWarrant([], { id: "z", title: "Dawn late", watch: "dawn", rank: 1 });
  assert.equal(lateWarrant(behind[0], "night"), true);
  assert.equal(lateWarrant({ ...behind[0], rank: 3 }, "night"), false);
  const rushed = addWarrant([], { id: "r", title: "Dawn rush", watch: "dawn", pace: "brisk", rank: 7 });
  assert.equal(rushWarrant(rushed[0]), true);
  const rested = addWarrant([], { id: "s", title: "Noon rest", watch: "forenoon", pace: "steady", span: 60 });
  assert.equal(restingWarrant(rested[0]), true);
  assert.equal(lengthenHour(rested, "s")[0].span, 60);
  assert.equal(lengthenHour([{ ...rested[0], span: null }], "s")[0].span, 15);
  assert.equal(lengthenHour(first, "a")[0].span, 30);
  assert.equal(shortenHour(first, "a")[0].span, 15);
  assert.equal(shortenHour([{ ...first[0], span: null }], "a")[0].span, 60);
  assert.equal(cycleTempo(first, "a")[0].pace, "steady");
  assert.equal(raiseWarrantRank(first, "a")[0].rank, 3);
  assert.equal(lowerWarrantRank(first, "a")[0].rank, 1);
  assert.equal(lowerWarrantRank([{ ...first[0], rank: 7 }], "a")[0].rank, 5);
  assert.equal(busiestClerk(quiet), "Bea");
  assert.equal(neighborWarrantCount(quiet) >= 0, true);
  assert.match(warrantCsv(first, "night"), /North warrant/);
  assert.match(warrantTimeline(first).map((lane) => lane.rank).join(","), /1/);

  const giltBook = addWarrant(addWarrant([], { id: "y1", title: "Gilt one", cloth: "gilt", watch: "forenoon" }), { id: "y2", title: "Gilt two", cloth: "gilt", watch: "noon" });
  assert.equal(suggestInk(giltBook), "GILT");
  assert.equal(suggestHour(rested, 4), 60);

  const views = addWarrantView([], { id: "v", name: "Peak", tray: "open", watch: "peak", span: "15", cloth: "soot", pace: "still", rank: "1" });
  assert.equal(views[0].watch, "peak");
  assert.equal(dropWarrantView(views, "v").length, 0);
  assert.equal(readWarrantViews([{ id: "v", name: "Peak", tray: "nope" }])[0].tray, "open");

  assert.equal(crestState("7FX"), "set");
  assert.equal(crestLane("7FX"), "house");
  assert.equal(crestStamp("7FX"), "FX2");
  assert.equal(crestHue("7FX"), "graphite");
  assert.equal(crestState("HOUSE"), "set");
  assert.equal(crestLane("HOUSE"), "house");
  assert.equal(crestStamp("HOUSE"), "HO5");
  assert.equal(crestLane("DESK"), "house");
  assert.equal(crestLane("en"), "code");
  assert.equal(crestStamp("en"), "EN2");
  assert.equal(crestHue("en"), "graphite");
  assert.equal(crestSpoken("en"), false);
  assert.equal(crestEcho("aa"), true);
  assert.equal(crestLane("aa"), "code");
  assert.equal(crestState("English"), "set");
  assert.equal(crestLane("English"), "plain");
  assert.equal(crestStamp("English"), "EN7");
  assert.equal(crestHue("English"), "graphite");
  assert.equal(crestSpoken("English"), false);
  assert.equal(crestWide("English"), false);
  assert.equal(crestLane("en-US"), "split");
  assert.equal(crestNotch("en-US"), false);
  assert.equal(crestLane("A.B"), "mark");
  assert.equal(crestNotch("A.B"), true);
  assert.equal(crestLane("Brazilian Portuguese"), "pair");
  assert.equal(crestLane("North Desk Team"), "phrase");
  assert.equal(crestLane("pt_BR"), "split");
  assert.equal(crestLane("zh9"), "cipher");
  assert.equal(crestLane("Constantine"), "plain");
  assert.equal(crestStep("Constantine"), 6);
  assert.equal(crestWide("Portuguese"), true);
  assert.equal(crestLane("Portuguese"), "plain");
  assert.equal(crestHue("Miriam"), "ink");
  assert.equal(crestLane("Miriam"), "plain");
  assert.equal(crestEcho("Miriam"), true);
  assert.equal(crestState("X"), "clear");
  assert.equal(crestState({ brokerName: "HOUSE", balance: 1 }), "");
  assert.equal(crestState({ code: "HOUSE" }), "");

  const book = [
    { id: "1", label: "Ada", note: "HOUSE" },
    { id: "2", label: "Bea", note: "HOUSE" },
    { id: "3", label: "Cem", note: "Miriam" },
  ];
  assert.equal(leadingCrest(book), "house");
  assert.match(crestLanesCsv(book), /house,2/);
  assert.match(crestRowsCsv(book, ["1"]), /HOUSE,HO5,house,graphite/);
  assert.match(crestRowsCsv(book, ["1"]), /Miriam,MI6,plain,ink/);

  const keys = Object.keys(ROUND255_COPY.en);
  assert.ok(keys.length >= 160);
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND255_COPY[locale]).sort(), keys.slice().sort());
    for (const key of keys) {
      assert.equal(typeof ROUND255_COPY[locale][key as keyof typeof ROUND255_COPY.en], "string");
      assert.ok(ROUND255_COPY[locale][key as keyof typeof ROUND255_COPY.en].length > 0);
    }
  }
  assert.equal(crmv4Text("tr", "wnsTitle"), ROUND255_COPY.tr.wnsTitle);
  assert.equal(crmv4Text("de", "bkcTitle"), ROUND255_COPY.de.bkcTitle);
  assert.equal(crmv4Text("ru", "wnsSub"), ROUND255_COPY.ru.wnsSub);
  assert.equal(crmv4Text("ar", "bkcSub"), ROUND255_COPY.ar.bkcSub);
  assert.equal(crmv4Text("en", "wnsLogo"), "7FX");
  assert.equal(crmv4Text("en", "wnsTitle"), "Warrant slips");
  assert.notEqual(ROUND255_COPY.tr.wnsTitle, ROUND255_COPY.en.wnsTitle);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-wns/);
  assert.match(css, /\.c4-bkc-index/);
  assert.match(css, /\.c4-kyc-salon/);
  assert.match(css, /\.c4-staff-salon/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round255.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /brokerName/);
  assert.match(viewFile, /warrantCsv/);
  assert.match(viewFile, /crestRowsCsv/);
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
  assert.match(viewFile, /data-cards/);
  assert.match(viewFile, /data-crests/);
  assert.match(viewFile, /data-traders/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestInk/);
  assert.match(viewFile, /c4-bkc-search/);
  assert.match(viewFile, /warrantTimeline/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "wns"/);
  assert.match(app, /view === "bkc"/);
  const glance = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round80.tsx"), "utf8");
  const roster = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round35.tsx"), "utf8");
  assert.match(glance, /c4-kyc-salon/);
  assert.match(glance, /data-logo="mono"/);
  assert.match(roster, /c4-staff-salon/);
  assert.match(roster, /data-logo="mono"/);
  const used = new Set(viewFile.match(/v4\("([a-zA-Z]+)"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of Array.from(used)) assert.ok(key in ROUND255_COPY.en, key);
  const audit = viewFile.match(/"(wnsAudit[a-zA-Z]+)"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of audit) assert.ok(key in ROUND255_COPY.en, key);
  const salon = `${glance}\n${roster}`.match(/"((?:kg|st)Salon[a-zA-Z]+)"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of salon) assert.ok(key in ROUND255_COPY.en, key);
  console.log("crmv4 round255 tests passed");
}

main();
