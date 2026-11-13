/**
 * Octant arcs and banner plates.
 * Run: TZ=UTC npx tsx tests/crmv4-round274.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND274_COPY } from "../src/lib/crmv4/copy-round274";
import {
  ROUND274_FEATURES,
  activeAltitude,
  activeShade,
  activeFinish,
  activeMirror,
  activeSight,
  addArc,
  addArcView,
  briskArc,
  bulkArcLatch,
  busiestKeeper,
  arcCsv,
  octantShade,
  octantAltitude,
  arcTimeline,
  sightBand,
  sightGap,
  sightOf,
  cycleMirror,
  dropArcView,
  fairKeeper,
  finishOf,
  houseFinish,
  idleArc,
  lateArc,
  leadingBanner,
  liftAltitude,
  lowerShade,
  moveOctantFocus,
  neighborShadeCount,
  overdueArc,
  keenSight,
  stillSight,
  raiseShade,
  readArcViews,
  restingArc,
  dipAltitude,
  suggestAltitude,
  suggestSight,
  suggestFinish,
  mirrorOf,
  bannerCap,
  bannerEcho,
  bannerHue,
  bannerKnown,
  bannerLane,
  bannerLanesCsv,
  bannerLeap,
  bannerNotch,
  bannerRowsCsv,
  bannerSlash,
  bannerStamp,
  bannerState,
  bannerStep,
  bannerTail,
  bannerTwin,
  bannerWide,
} from "../src/lib/crmv4/round274";

function main() {
  assert.equal(ROUND274_FEATURES.length, 25);
  assert.equal(sightOf(" harbor "), "harbor");
  assert.equal(sightOf("paris"), "");
  assert.equal(octantAltitude("10"), 10);
  assert.equal(octantAltitude(30), 30);
  assert.equal(octantAltitude("60"), 60);
  assert.equal(octantAltitude("20"), null);
  assert.equal(octantAltitude("15"), null);
  assert.equal(octantShade("1"), 1);
  assert.equal(octantShade(3), 3);
  assert.equal(octantShade("5"), 5);
  assert.equal(octantShade("9"), 9);
  assert.equal(octantShade("2"), null);
  assert.equal(octantShade("4"), null);
  assert.equal(octantShade("16"), null);
  assert.equal(finishOf("ivory"), "IVORY");
  assert.equal(finishOf("graphite"), "GRAPHITE");
  assert.equal(finishOf("champagne"), "CHAMPAGNE");
  assert.equal(finishOf("brass"), "");
  assert.equal(mirrorOf("index"), "index");
  assert.equal(mirrorOf("horizon"), "horizon");
  assert.equal(mirrorOf("shade"), "shade");
  assert.equal(mirrorOf("circle"), "");
  assert.equal(keenSight("reef"), true);
  assert.equal(keenSight("OFFING"), true);
  assert.equal(keenSight("harbor"), false);
  assert.equal(stillSight("harbor"), true);
  assert.equal(stillSight("headland"), true);
  assert.equal(stillSight("reef"), false);
  assert.equal(sightBand("harbor"), "dawn");
  assert.equal(sightBand("headland"), "noon");
  assert.equal(sightBand("reef"), "dusk");
  assert.equal(sightBand("offing"), "night");
  assert.equal(sightBand(""), "");
  assert.equal(sightGap("harbor", "headland"), 1);
  assert.equal(sightGap("headland", "harbor"), -1);
  assert.equal(sightGap("", "harbor"), null);
  assert.equal(houseFinish("ivory"), true);
  assert.equal(houseFinish("CHAMPAGNE"), true);
  assert.equal(houseFinish("graphite"), false);
  assert.equal(activeSight("keen"), "keen");
  assert.equal(activeSight("reef"), "reef");
  assert.equal(activeSight("paris"), "all");
  assert.equal(activeAltitude("30"), "30");
  assert.equal(activeAltitude("9"), "all");
  assert.equal(activeMirror("horizon", ["index", "horizon", "shade"]), "horizon");
  assert.equal(activeMirror("presto", ["index", "horizon", "shade"]), "all");
  assert.equal(activeShade("5"), "5");
  assert.equal(activeShade("2"), "all");
  assert.equal(activeFinish("ivory"), "ivory");
  assert.equal(moveOctantFocus(0, 4, -1), 3);

  const open = {
    id: "a",
    title: "Reef sight",
    note: "ridge",
    keeper: "Nia",
    sight: "reef",
    altitude: 10,
    finish: "IVORY",
    mirror: "index",
    shade: 1,
    tags: [],
    latched: false,
    locked: false,
    chested: false,
    flagged: false,
    audit: "save",
  };
  assert.equal(overdueArc(open), true);
  assert.equal(overdueArc({ ...open, latched: true }), false);
  assert.equal(overdueArc({ ...open, sight: "harbor" }), false);
  assert.equal(lateArc({ ...open, sight: "harbor", shade: 1 }, "offing"), true);
  assert.equal(lateArc({ ...open, sight: "harbor", shade: 1 }, "headland"), false);
  assert.equal(idleArc({ ...open, sight: "harbor", mirror: "index", shade: 1 }), true);
  assert.equal(briskArc({ ...open, shade: 9, mirror: "shade", sight: "offing" }), true);
  assert.equal(restingArc({ ...open, altitude: 60, mirror: "horizon", sight: "offing" }), true);
  assert.equal(suggestAltitude([], 5), 10);
  assert.equal(suggestAltitude([], 10), 30);
  assert.equal(suggestAltitude([], 18), 60);
  assert.equal(suggestAltitude([open], 18), 10);
  assert.equal(suggestSight(8), "harbor");
  assert.equal(suggestSight(9), "reef");
  assert.equal(suggestFinish([open]), "IVORY");
  assert.equal(fairKeeper([open, { ...open, id: "b", title: "Other", keeper: "Nia" }], "Ada,Nia"), "Ada");
  assert.equal(busiestKeeper([open]), "Nia");

  let book = addArc([], { id: "c1", title: "Ridge", keeper: "Ada", sight: "harbor", altitude: 10, finish: "ivory", mirror: "index", shade: 1, note: "optional" });
  book = addArc(book, { id: "c1", title: "Ridge again" });
  assert.equal(book.length, 1);
  book = liftAltitude(book, "c1");
  assert.equal(book[0].altitude, 30);
  book = dipAltitude(book, "c1");
  assert.equal(book[0].altitude, 10);
  book = raiseShade(book, "c1");
  assert.equal(book[0].shade, 3);
  book = lowerShade(book, "c1");
  assert.equal(book[0].shade, 1);
  book = cycleMirror(book, "c1");
  assert.equal(book[0].mirror, "horizon");
  book = bulkArcLatch(book, ["c1"]);
  assert.equal(book[0].latched, true);
  const views = addArcView([], { id: "v1", name: "Deck", tray: "deck", sight: "harbor", keeper: "Ada" });
  assert.equal(readArcViews(views)[0].sight, "harbor");
  assert.equal(dropArcView(views, "v1").length, 0);
  assert.match(arcCsv(book, "offing"), /Ridge,Ada,harbor/);
  assert.equal(arcTimeline(book).some((lane) => lane.shade === 1), true);
  assert.equal(neighborShadeCount(book), 0);

  assert.equal(bannerState("SPRING"), "set");
  assert.equal(bannerLane("SPRING"), "quay");
  assert.equal(bannerStamp("SPRING"), "SPR");
  assert.equal(bannerHue("SPRING"), "champagne");
  assert.equal(bannerKnown("spring"), true);
  assert.equal(bannerCap("SPRING"), true);
  assert.equal(bannerCap("spring"), false);
  assert.equal(bannerLeap("SPRING"), false);
  assert.equal(bannerTail("SPRING"), false);
  assert.equal(bannerLane("VIP"), "loft");
  assert.equal(bannerStamp("VIP"), "VIP");
  assert.equal(bannerHue("VIP"), "graphite");
  assert.equal(bannerKnown("VIP"), true);
  assert.equal(bannerLane("DEMO"), "closet");
  assert.equal(bannerHue("DEMO"), "ivory");
  assert.equal(bannerLeap("DEMO"), false);
  assert.equal(bannerTail("DEMO"), true);
  assert.equal(bannerLane("BRAND"), "hall");
  assert.equal(bannerHue("BRAND"), "ivory");
  assert.equal(bannerKnown("BRAND"), true);
  assert.equal(bannerLeap("BRAND"), true);
  assert.equal(bannerStep("BRAND"), 5);
  assert.equal(bannerWide("AT_RISK"), true);
  assert.equal(bannerLane("AT_RISK"), "pier");
  assert.equal(bannerKnown("AT_RISK"), false);
  assert.equal(bannerNotch("AT-RISK"), true);
  assert.equal(bannerSlash("A/B"), true);
  assert.equal(bannerTwin("Book"), true);
  assert.equal(bannerEcho("Radar"), true);
  assert.equal(bannerState("12"), "clear");
  assert.equal(bannerState(""), "clear");
  assert.equal(bannerState({ campaign: "SPRING", balance: 1 }), "");
  assert.equal(bannerState({ title: "SPRING" }), "");
  assert.equal(bannerLane({ code: "VIP" }), "loft");

  const plates = [
    { id: "1", label: "Ada", note: "SPRING" },
    { id: "2", label: "Bea", note: "VIP" },
    { id: "3", label: "Cal", note: "BRAND" },
  ];
  assert.equal(leadingBanner(plates), "quay");
  assert.match(bannerLanesCsv(plates), /quay,1/);
  assert.match(bannerRowsCsv(plates, ["1"]), /Ada,SPRING,SPR,quay,champagne/);
  assert.match(bannerRowsCsv(plates, ["1"]), /Bea,VIP,VIP,loft,graphite/);
  assert.match(bannerRowsCsv(plates, ["1"]), /Cal,BRAND,BRA,hall,ivory/);

  const keys = Object.keys(ROUND274_COPY.en);
  assert.ok(keys.length >= 150);
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND274_COPY[locale]).sort(), keys.slice().sort());
    for (const key of keys) {
      assert.equal(typeof ROUND274_COPY[locale][key as keyof typeof ROUND274_COPY.en], "string");
      assert.ok(ROUND274_COPY[locale][key as keyof typeof ROUND274_COPY.en].length > 0);
    }
  }
  assert.equal(crmv4Text("tr", "octTitle"), ROUND274_COPY.tr.octTitle);
  assert.equal(crmv4Text("de", "bnnTitle"), ROUND274_COPY.de.bnnTitle);
  assert.equal(crmv4Text("ru", "octSub"), ROUND274_COPY.ru.octSub);
  assert.equal(crmv4Text("ar", "bnnSub"), ROUND274_COPY.ar.bnnSub);
  assert.equal(crmv4Text("en", "octLogo"), "7FX");
  assert.equal(crmv4Text("en", "octTitle"), "Octant arcs");
  assert.equal(crmv4Text("en", "bnnTitle"), "Banner plates");
  assert.notEqual(ROUND274_COPY.tr.octTitle, ROUND274_COPY.en.octTitle);
  assert.equal(crmv4Text("en", "thdTitle"), "Theodolite circles");

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-octant/);
  assert.match(css, /\.c4-banner-index/);
  assert.match(css, /\.c4-octant-sightbar/);
  assert.match(css, /\.c4-banner-stake/);
  assert.match(css, /\.c4-mkt-gallery/);
  assert.match(css, /\.c4-mkt-brocade/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round274.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /campaign:/);
  assert.match(viewFile, /arcCsv/);
  assert.match(viewFile, /bannerRowsCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "x"/);
  assert.match(viewFile, /event\.key === "j"/);
  assert.match(viewFile, /event\.key === "n"/);
  assert.match(viewFile, /event\.key === "l"/);
  assert.match(viewFile, /event\.key === "g"/);
  assert.match(viewFile, /event\.key === "h"/);
  assert.match(viewFile, /event\.key === "w"/);
  assert.match(viewFile, /event\.key === "b"/);
  assert.match(viewFile, /event\.key === "p"/);
  assert.match(viewFile, /event\.key === "u"/);
  assert.match(viewFile, /event\.key === "y"/);
  assert.match(viewFile, /event\.key === "m"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=24&meta=0&role=TRADER/);
  assert.match(viewFile, /data-cards/);
  assert.match(viewFile, /data-plates/);
  assert.match(viewFile, /data-names/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestFinish/);
  assert.match(viewFile, /c4-banner-search/);
  assert.match(viewFile, /arcTimeline/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "oct"/);
  assert.match(app, /view === "bnn"/);
  const market = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/views/Marketing.tsx"), "utf8");
  assert.match(market, /c4-mkt-gallery/);
  assert.match(market, /c4-mkt-brocade/);
  assert.match(market, /mktGalleryKicker/);
  assert.match(market, /mktGalleryLead/);
  const used = new Set(viewFile.match(/v4\("([a-zA-Z]+)"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of Array.from(used)) assert.ok(key in ROUND274_COPY.en, key);
  const audit = viewFile.match(/"(octAudit[a-zA-Z]+)"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of audit) assert.ok(key in ROUND274_COPY.en, key);
  const marketUsed = new Set(market.match(/v4\("([a-zA-Z]+)"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of Array.from(marketUsed)) {
    if (key.startsWith("mktGallery")) assert.ok(key in ROUND274_COPY.en, key);
  }
  console.log("crmv4 round274 tests passed");
}

main();
