/**
 * Atrium slips and contact plates.
 * Run: TZ=UTC npx tsx tests/crmv4-round258.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND258_COPY } from "../src/lib/crmv4/copy-round258";
import {
  ROUND258_FEATURES,
  activeHour,
  activeManner,
  activePace,
  activeRank,
  activeSpan,
  addSlip,
  addSlipView,
  bulkSlipPin,
  busiestHost,
  cyclePace,
  dropSlipView,
  fairHost,
  hourBand,
  hourGap,
  hourOf,
  houseManner,
  idleSlip,
  lateSlip,
  leadingPlate,
  lengthenSpan,
  lowerRank,
  mannerOf,
  moveSlipFocus,
  neighborSlipCount,
  overdueSlip,
  paceOf,
  peakHour,
  plateEcho,
  plateHue,
  plateLane,
  plateLanesCsv,
  plateLeap,
  plateNotch,
  plateRowsCsv,
  plateSpoken,
  plateStamp,
  plateState,
  plateStep,
  plateWide,
  quietHour,
  raiseRank,
  rankOf,
  readSlipViews,
  restingSlip,
  rushSlip,
  shortenSpan,
  slipCsv,
  slipTimeline,
  spanOf,
  suggestManner,
  suggestSpan,
} from "../src/lib/crmv4/round258";

function main() {
  assert.equal(ROUND258_FEATURES.length, 25);
  assert.equal(hourOf(" dawn "), "dawn");
  assert.equal(hourOf("paris"), "");
  assert.equal(spanOf("2"), 2);
  assert.equal(spanOf(6), 6);
  assert.equal(spanOf("14"), 14);
  assert.equal(spanOf("21"), null);
  assert.equal(rankOf("2"), 2);
  assert.equal(rankOf(4), 4);
  assert.equal(rankOf("6"), 6);
  assert.equal(rankOf("8"), 8);
  assert.equal(rankOf("1"), null);
  assert.equal(mannerOf("bow"), "BOW");
  assert.equal(mannerOf("word"), "WORD");
  assert.equal(mannerOf("card"), "CARD");
  assert.equal(mannerOf("clay"), "");
  assert.equal(paceOf("hush"), "hush");
  assert.equal(paceOf("stroll"), "stroll");
  assert.equal(paceOf("sprint"), "sprint");
  assert.equal(paceOf("still"), "");
  assert.equal(peakHour("noon"), true);
  assert.equal(peakHour("DUSK"), true);
  assert.equal(peakHour("dawn"), false);
  assert.equal(quietHour("dawn"), true);
  assert.equal(quietHour("night"), true);
  assert.equal(quietHour("noon"), false);
  assert.equal(hourBand("dawn"), "early");
  assert.equal(hourBand("noon"), "early");
  assert.equal(hourBand("dusk"), "mid");
  assert.equal(hourBand("night"), "late");
  assert.equal(hourBand(""), "");
  assert.equal(hourGap("dawn", "noon"), 1);
  assert.equal(hourGap("noon", "dawn"), -1);
  assert.equal(hourGap("", "dawn"), null);
  assert.equal(houseManner("bow"), true);
  assert.equal(houseManner("WORD"), true);
  assert.equal(houseManner("card"), false);
  assert.equal(activeHour("peak"), "peak");
  assert.equal(activeHour("dawn"), "dawn");
  assert.equal(activeHour("paris"), "all");
  assert.equal(activeSpan("2"), "2");
  assert.equal(activeSpan("21"), "all");
  assert.equal(activePace("stroll", ["hush", "stroll", "sprint"]), "stroll");
  assert.equal(activePace("still", ["hush", "stroll", "sprint"]), "all");
  assert.equal(activeRank("6"), "6");
  assert.equal(activeRank("1"), "all");
  assert.equal(activeManner("word"), "word");
  assert.equal(activeManner("clay"), "all");
  assert.equal(moveSlipFocus(0, 3, 1), 1);
  assert.equal(moveSlipFocus(0, 3, -1), 2);
  assert.equal(suggestManner([]), "BOW");
  assert.equal(suggestSpan([], 4), 2);
  assert.equal(suggestSpan([], 12), 6);
  assert.equal(suggestSpan([], 19), 14);
  assert.equal(fairHost([], "Ada, Bea"), "Ada");

  const first = addSlip([], {
    id: "a",
    title: "  North atrium ",
    note: "",
    host: "Ada",
    hour: "noon",
    manner: "bow",
    pace: "hush",
    span: 2,
    rank: 2,
    tags: "a a b",
  });
  assert.equal(first.length, 1);
  assert.equal(first[0].title, "North atrium");
  assert.equal(first[0].note, "");
  assert.equal(first[0].manner, "BOW");
  assert.equal(first[0].tags.join(""), "ab");
  assert.equal(first[0].audit, "save");
  assert.equal(overdueSlip(first[0]), true);
  assert.equal(addSlip(first, { id: "a", title: "Other" }).length, 1);
  assert.equal(addSlip(first, { id: "b", title: "North atrium" }).length, 1);
  assert.equal(addSlip(first, { id: "b", title: "   " }).length, 1);

  const pinned = bulkSlipPin(first, ["a"]);
  assert.equal(overdueSlip(pinned[0]), false);
  assert.equal(fairHost(pinned, "Ada, Bea"), "Ada");
  const quiet = addSlip(pinned, { id: "q", title: "Dawn rest", host: "Bea", hour: "dawn", pace: "hush", rank: 2 });
  assert.equal(idleSlip(quiet[0]), true);
  assert.equal(lateSlip(quiet[0], "noon"), false);
  const behind = addSlip([], { id: "z", title: "Dawn late", hour: "dawn", rank: 2 });
  assert.equal(lateSlip(behind[0], "night"), true);
  assert.equal(lateSlip({ ...behind[0], rank: 4 }, "night"), false);
  const rushed = addSlip([], { id: "r", title: "Noon sprint", hour: "noon", pace: "sprint", rank: 8 });
  assert.equal(rushSlip(rushed[0]), true);
  const rested = addSlip([], { id: "s", title: "Night stroll", hour: "night", pace: "stroll", span: 14 });
  assert.equal(restingSlip(rested[0]), true);
  assert.equal(lengthenSpan(rested, "s")[0].span, 14);
  assert.equal(lengthenSpan([{ ...rested[0], span: null }], "s")[0].span, 2);
  assert.equal(lengthenSpan(first, "a")[0].span, 6);
  assert.equal(shortenSpan(first, "a")[0].span, 2);
  assert.equal(shortenSpan([{ ...first[0], span: null }], "a")[0].span, 14);
  assert.equal(cyclePace(first, "a")[0].pace, "stroll");
  assert.equal(raiseRank(first, "a")[0].rank, 4);
  assert.equal(lowerRank(first, "a")[0].rank, 2);
  assert.equal(lowerRank([{ ...first[0], rank: 8 }], "a")[0].rank, 6);
  assert.equal(busiestHost(quiet), "Bea");
  assert.equal(neighborSlipCount(quiet) >= 0, true);
  assert.match(slipCsv(first, "night"), /North atrium/);
  assert.match(slipTimeline(first).map((lane) => lane.rank).join(","), /2/);

  const cardBook = addSlip(addSlip([], { id: "y1", title: "Card one", manner: "card", hour: "dawn" }), { id: "y2", title: "Card two", manner: "card", hour: "noon" });
  assert.equal(suggestManner(cardBook), "CARD");
  assert.equal(suggestSpan(rested, 4), 14);

  const views = addSlipView([], { id: "v", name: "Peak", tray: "open", hour: "peak", span: "2", manner: "bow", pace: "hush", rank: "2" });
  assert.equal(views[0].hour, "peak");
  assert.equal(dropSlipView(views, "v").length, 0);
  assert.equal(readSlipViews([{ id: "v", name: "Peak", tray: "nope" }])[0].tray, "open");

  assert.equal(plateState("1990-03-15"), "set");
  assert.equal(plateLane("1990-03-15"), "hush");
  assert.equal(plateStamp("1990-03-15"), "0000");
  assert.equal(plateHue("1990-03-15"), "ivory");
  assert.equal(plateHue("1990-03-15T14:30:00Z"), "graphite");
  assert.equal(plateHue("1990-03-15T18:45:00Z"), "champagne");
  assert.equal(plateStep("1990-03-15T18:45:00Z"), 18);
  assert.equal(plateNotch("1990-03-15T14:15:00Z"), true);
  assert.equal(plateNotch("1990-03-15T14:45:00Z"), true);
  assert.equal(plateNotch("1990-03-15T14:30:00Z"), false);
  assert.equal(plateEcho("1990-03-15T09:05:00Z"), true);
  assert.equal(plateEcho("1990-03-15T09:55:00Z"), true);
  assert.equal(plateEcho("1990-03-15T14:30:00Z"), false);
  assert.equal(plateWide("1990-03-15T18:45:00Z"), true);
  assert.equal(plateWide("1990-03-15T14:30:00Z"), false);
  assert.equal(plateSpoken("1990-03-11"), true);
  assert.equal(plateSpoken("1990-03-17"), true);
  assert.equal(plateSpoken("1990-03-15"), false);
  assert.equal(plateLane("1990-03-15T04:00:00Z"), "hush");
  assert.equal(plateLane("1990-03-15T05:00:00Z"), "desk");
  assert.equal(plateLane("1990-03-15T12:00:00Z"), "hall");
  assert.equal(plateLane("1990-03-15T16:00:00Z"), "hall");
  assert.equal(plateLane("1990-03-15T17:00:00Z"), "lamp");
  assert.equal(plateLeap("2000-02-29"), true);
  assert.equal(plateLane("2000-02-29"), "hush");
  assert.equal(plateState("1900-02-29"), "clear");
  assert.equal(plateState("1990-02-31"), "clear");
  assert.equal(plateState(""), "clear");
  assert.equal(plateState("paris"), "clear");
  assert.equal(plateState({ lastContactAt: "1990-03-15", balance: 1 }), "");
  assert.equal(plateState({ code: "HOUSE" }), "");
  assert.equal(plateLane({ lastContactAt: "1990-03-15T14:30:00Z" }), "hall");

  const book = [
    { id: "1", label: "Ada", note: "1990-12-01T20:00:00Z" },
    { id: "2", label: "Bea", note: "1991-01-11T22:30:00Z" },
    { id: "3", label: "Cem", note: "1990-03-15T08:00:00Z" },
  ];
  assert.equal(leadingPlate(book), "lamp");
  assert.match(plateLanesCsv(book), /lamp,2/);
  assert.match(plateRowsCsv(book, ["1"]), /2000,lamp,ivory/);
  assert.match(plateRowsCsv(book, ["1"]), /2230,lamp,graphite/);
  assert.match(plateRowsCsv(book, ["1"]), /0800,desk,ivory/);

  const keys = Object.keys(ROUND258_COPY.en);
  assert.ok(keys.length >= 160);
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND258_COPY[locale]).sort(), keys.slice().sort());
    for (const key of keys) {
      assert.equal(typeof ROUND258_COPY[locale][key as keyof typeof ROUND258_COPY.en], "string");
      assert.ok(ROUND258_COPY[locale][key as keyof typeof ROUND258_COPY.en].length > 0);
    }
  }
  assert.equal(crmv4Text("tr", "grtTitle"), ROUND258_COPY.tr.grtTitle);
  assert.equal(crmv4Text("de", "lcpTitle"), ROUND258_COPY.de.lcpTitle);
  assert.equal(crmv4Text("ru", "grtSub"), ROUND258_COPY.ru.grtSub);
  assert.equal(crmv4Text("ar", "lcpSub"), ROUND258_COPY.ar.lcpSub);
  assert.equal(crmv4Text("en", "grtLogo"), "7FX");
  assert.equal(crmv4Text("en", "grtTitle"), "Atrium slips");
  assert.notEqual(ROUND258_COPY.tr.grtTitle, ROUND258_COPY.en.grtTitle);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-grt/);
  assert.match(css, /\.c4-lcp-index/);
  assert.match(css, /\.c4-tags-ribbon/);
  assert.match(css, /\.c4-thread-parlor/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round258.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /lastContactAt/);
  assert.match(viewFile, /slipCsv/);
  assert.match(viewFile, /plateRowsCsv/);
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
  assert.match(viewFile, /data-plates/);
  assert.match(viewFile, /data-traders/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestManner/);
  assert.match(viewFile, /c4-lcp-search/);
  assert.match(viewFile, /slipTimeline/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "grt"/);
  assert.match(app, /view === "lcp"/);
  const tags = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round52.tsx"), "utf8");
  const thread = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round49.tsx"), "utf8");
  assert.match(tags, /c4-tags-ribbon/);
  assert.match(tags, /data-logo="mono"/);
  assert.match(thread, /c4-thread-parlor/);
  assert.match(thread, /data-logo="mono"/);
  const used = new Set(viewFile.match(/v4\("([a-zA-Z]+)"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of Array.from(used)) assert.ok(key in ROUND258_COPY.en, key);
  const audit = viewFile.match(/"(grtAudit[a-zA-Z]+)"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of audit) assert.ok(key in ROUND258_COPY.en, key);
  const salon = `${tags}\n${thread}`.match(/"((?:tgRibbon|cvParlor)[a-zA-Z]+)"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of salon) assert.ok(key in ROUND258_COPY.en, key);
  console.log("crmv4 round258 tests passed");
}

main();
