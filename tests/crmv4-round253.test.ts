/**
 * Trestle cards and group seals.
 * Run: TZ=UTC npx tsx tests/crmv4-round253.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND253_COPY } from "../src/lib/crmv4/copy-round253";
import {
  ROUND253_FEATURES,
  activeBay,
  activeGait,
  activeRank,
  activeSpan,
  activeTimber,
  addTrestle,
  addTrestleView,
  bayBand,
  bayGap,
  bayOf,
  bulkTrestlePin,
  busiestJoiner,
  cycleGait,
  dropTrestleView,
  fairJoiner,
  gaitOf,
  houseTimber,
  idleTrestle,
  lateTrestle,
  leadingSeal,
  lengthenSpan,
  lowerRank,
  moveTrestleFocus,
  neighborTrestleCount,
  overdueTrestle,
  peakBay,
  quietBay,
  raiseRank,
  rankOf,
  readTrestleViews,
  restingTrestle,
  rushTrestle,
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
  shortenSpan,
  spanOf,
  suggestSpan,
  suggestTimber,
  timberOf,
  trestleCsv,
  trestleTimeline,
} from "../src/lib/crmv4/round253";

function main() {
  assert.equal(ROUND253_FEATURES.length, 25);
  assert.equal(bayOf(" dawn "), "dawn");
  assert.equal(bayOf("paris"), "");
  assert.equal(spanOf("15"), 15);
  assert.equal(spanOf(45), 45);
  assert.equal(spanOf("90"), 90);
  assert.equal(spanOf("30"), null);
  assert.equal(rankOf("1"), 1);
  assert.equal(rankOf(3), 3);
  assert.equal(rankOf("5"), 5);
  assert.equal(rankOf("9"), 9);
  assert.equal(rankOf("2"), null);
  assert.equal(timberOf("oak"), "OAK");
  assert.equal(timberOf("ash"), "ASH");
  assert.equal(timberOf("yew"), "YEW");
  assert.equal(timberOf("pine"), "");
  assert.equal(gaitOf("stroll"), "stroll");
  assert.equal(gaitOf("stride"), "stride");
  assert.equal(gaitOf("sprint"), "sprint");
  assert.equal(gaitOf("warm"), "");
  assert.equal(peakBay("dawn"), true);
  assert.equal(peakBay("VIGIL"), true);
  assert.equal(peakBay("noon"), false);
  assert.equal(quietBay("night"), true);
  assert.equal(quietBay("rest"), true);
  assert.equal(quietBay("dawn"), false);
  assert.equal(bayBand("dawn"), "early");
  assert.equal(bayBand("dusk"), "mid");
  assert.equal(bayBand("vigil"), "late");
  assert.equal(bayBand(""), "");
  assert.equal(bayGap("dawn", "noon"), 1);
  assert.equal(bayGap("noon", "dawn"), -1);
  assert.equal(bayGap("", "dawn"), null);
  assert.equal(houseTimber("oak"), true);
  assert.equal(houseTimber("ASH"), true);
  assert.equal(houseTimber("yew"), false);
  assert.equal(activeBay("peak"), "peak");
  assert.equal(activeBay("dawn"), "dawn");
  assert.equal(activeBay("paris"), "all");
  assert.equal(activeSpan("15"), "15");
  assert.equal(activeSpan("30"), "all");
  assert.equal(activeGait("stride", ["stroll", "stride", "sprint"]), "stride");
  assert.equal(activeGait("warm", ["stroll", "stride", "sprint"]), "all");
  assert.equal(activeRank("5"), "5");
  assert.equal(activeRank("2"), "all");
  assert.equal(activeTimber("ash"), "ash");
  assert.equal(activeTimber("pine"), "all");
  assert.equal(moveTrestleFocus(0, 3, 1), 1);
  assert.equal(moveTrestleFocus(0, 3, -1), 2);
  assert.equal(suggestTimber([]), "OAK");
  assert.equal(suggestSpan([], 4), 15);
  assert.equal(suggestSpan([], 12), 45);
  assert.equal(suggestSpan([], 19), 90);
  assert.equal(fairJoiner([], "Ada, Bea"), "Ada");

  const first = addTrestle([], {
    id: "a",
    title: "  North trestle ",
    note: "",
    joiner: "Ada",
    bay: "dawn",
    timber: "oak",
    gait: "stroll",
    span: 15,
    rank: 1,
    tags: "m m n",
  });
  assert.equal(first.length, 1);
  assert.equal(first[0].title, "North trestle");
  assert.equal(first[0].note, "");
  assert.equal(first[0].timber, "OAK");
  assert.equal(first[0].tags.join(""), "mn");
  assert.equal(first[0].audit, "save");
  assert.equal(overdueTrestle(first[0]), true);
  assert.equal(addTrestle(first, { id: "a", title: "Other" }).length, 1);
  assert.equal(addTrestle(first, { id: "b", title: "North trestle" }).length, 1);
  assert.equal(addTrestle(first, { id: "b", title: "   " }).length, 1);

  const pinned = bulkTrestlePin(first, ["a"]);
  assert.equal(overdueTrestle(pinned[0]), false);
  const quiet = addTrestle(pinned, { id: "q", title: "Night rest", joiner: "Bea", bay: "night", gait: "stroll", rank: 1 });
  assert.equal(idleTrestle(quiet[0]), true);
  assert.equal(lateTrestle(quiet[0], "rest"), false);
  const behind = addTrestle([], { id: "z", title: "Dawn late", bay: "dawn", rank: 1 });
  assert.equal(lateTrestle(behind[0], "rest"), true);
  assert.equal(lateTrestle({ ...behind[0], rank: 3 }, "rest"), false);
  const rushed = addTrestle([], { id: "r", title: "Dawn rush", bay: "dawn", gait: "sprint", rank: 9 });
  assert.equal(rushTrestle(rushed[0]), true);
  const rested = addTrestle([], { id: "s", title: "Noon rest", bay: "noon", gait: "stride", span: 90 });
  assert.equal(restingTrestle(rested[0]), true);
  assert.equal(lengthenSpan(rested, "s")[0].span, 90);
  assert.equal(lengthenSpan([{ ...rested[0], span: null }], "s")[0].span, 15);
  assert.equal(lengthenSpan(first, "a")[0].span, 45);
  assert.equal(shortenSpan(first, "a")[0].span, 15);
  assert.equal(shortenSpan([{ ...first[0], span: null }], "a")[0].span, 90);
  assert.equal(cycleGait(first, "a")[0].gait, "stride");
  assert.equal(raiseRank(first, "a")[0].rank, 3);
  assert.equal(lowerRank(first, "a")[0].rank, 1);
  assert.equal(lowerRank([{ ...first[0], rank: 9 }], "a")[0].rank, 5);
  assert.equal(busiestJoiner(quiet), "Bea");
  assert.equal(neighborTrestleCount(quiet) >= 0, true);
  assert.match(trestleCsv(first, "rest"), /North trestle/);
  assert.match(trestleTimeline(first).map((lane) => lane.rank).join(","), /1/);

  const yewBook = addTrestle(addTrestle([], { id: "y1", title: "Yew one", timber: "yew", bay: "noon" }), { id: "y2", title: "Yew two", timber: "yew", bay: "dusk" });
  assert.equal(suggestTimber(yewBook), "YEW");
  assert.equal(suggestSpan(rested, 4), 90);

  const views = addTrestleView([], { id: "v", name: "Peak", tray: "open", bay: "peak", span: "15", timber: "oak", gait: "stroll", rank: "1" });
  assert.equal(views[0].bay, "peak");
  assert.equal(dropTrestleView(views, "v").length, 0);
  assert.equal(readTrestleViews([{ id: "v", name: "Peak", tray: "nope" }])[0].tray, "open");

  assert.equal(sealState("VIP"), "set");
  assert.equal(sealLane("VIP"), "house");
  assert.equal(sealStamp("VIP"), "VP3");
  assert.equal(sealHue("VIP"), "ash");
  assert.equal(sealJoin("AA"), true);
  assert.equal(sealLane("AA"), "brief");
  assert.equal(sealState("Ada Group"), "set");
  assert.equal(sealLane("Ada Group"), "duo");
  assert.equal(sealStamp("Ada Group"), "AP8");
  assert.equal(sealHue("Ada Group"), "ivory");
  assert.equal(sealStep("Ada Group"), 7);
  assert.equal(sealBound("Ada Group"), true);
  assert.equal(sealWide("Ada Group"), false);
  assert.equal(sealNotch("Ada Group"), false);
  assert.equal(sealLane("Ada Group Desk"), "bench");
  assert.equal(sealWide("Ada Group Desk"), true);
  assert.equal(sealLane("North-Desk"), "split");
  assert.equal(sealNotch("North-Desk"), true);
  assert.equal(sealLane("Bo"), "brief");
  assert.equal(sealLane("ConstantinePaul"), "long");
  assert.equal(sealStep("ConstantinePaul"), 8);
  assert.equal(sealHue("Miriam"), "ink");
  assert.equal(sealLane("Miriam"), "plain");
  assert.equal(sealLane("VIP100"), "mark");
  assert.equal(sealState("X"), "clear");
  assert.equal(sealState({ tradingGroup: "VIP", balance: 1 }), "");
  assert.equal(sealState({ code: "VIP" }), "");

  const book = [
    { id: "1", label: "Ada", note: "Ada Group" },
    { id: "2", label: "Bea", note: "Ada Group" },
    { id: "3", label: "Cem", note: "Miriam" },
  ];
  assert.equal(leadingSeal(book), "duo");
  assert.match(sealLanesCsv(book), /duo,2/);
  assert.match(sealRowsCsv(book, ["1"]), /Ada Group,AP8,duo,ivory,7,0,0,0,1,0,0,1,0,0,0,0,0,1/);
  assert.match(sealRowsCsv(book, ["1"]), /Miriam,MM6,plain,ink,4,0,0,0,1,0,0,0,0,0,0,0,1,0/);

  const keys = Object.keys(ROUND253_COPY.en);
  assert.ok(keys.length >= 140);
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND253_COPY[locale]).sort(), keys.slice().sort());
    for (const key of keys) {
      assert.equal(typeof ROUND253_COPY[locale][key as keyof typeof ROUND253_COPY.en], "string");
      assert.ok(ROUND253_COPY[locale][key as keyof typeof ROUND253_COPY.en].length > 0);
    }
  }
  assert.equal(crmv4Text("tr", "trsTitle"), ROUND253_COPY.tr.trsTitle);
  assert.equal(crmv4Text("de", "tgsTitle"), ROUND253_COPY.de.tgsTitle);
  assert.equal(crmv4Text("ru", "trsSub"), ROUND253_COPY.ru.trsSub);
  assert.equal(crmv4Text("ar", "tgsSub"), ROUND253_COPY.ar.tgsSub);
  assert.equal(crmv4Text("en", "trsLogo"), "7FX");
  assert.equal(crmv4Text("en", "trsTitle"), "Trestle cards");
  assert.notEqual(ROUND253_COPY.tr.trsTitle, ROUND253_COPY.en.trsTitle);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-trs/);
  assert.match(css, /\.c4-tgs-index/);
  assert.match(css, /\.c4-jump-forge/);
  assert.match(css, /\.c4-expiry-forge/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round253.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /tradingGroup/);
  assert.match(viewFile, /trestleCsv/);
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
  assert.match(viewFile, /data-cards/);
  assert.match(viewFile, /data-seals/);
  assert.match(viewFile, /data-traders/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestTimber/);
  assert.match(viewFile, /c4-tgs-search/);
  assert.match(viewFile, /trestleTimeline/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "trs"/);
  assert.match(app, /view === "tgs"/);
  const jumps = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round61.tsx"), "utf8");
  const expiry = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round62.tsx"), "utf8");
  assert.match(jumps, /c4-jump-forge/);
  assert.match(jumps, /data-logo="mono"/);
  assert.match(expiry, /c4-expiry-forge/);
  assert.match(expiry, /data-logo="mono"/);
  const used = new Set(viewFile.match(/v4\("([a-zA-Z]+)"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of Array.from(used)) assert.ok(key in ROUND253_COPY.en, key);
  const audit = viewFile.match(/"(trsAudit[a-zA-Z]+)"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of audit) assert.ok(key in ROUND253_COPY.en, key);
  const forge = `${jumps}\n${expiry}`.match(/"((?:jp|ex)Forge[a-zA-Z]+)"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of forge) assert.ok(key in ROUND253_COPY.en, key);
  console.log("crmv4 round253 tests passed");
}

main();
