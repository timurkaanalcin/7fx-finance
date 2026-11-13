/**
 * Lectern leaves and cameo plates.
 * Run: TZ=UTC npx tsx tests/crmv4-round251.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND251_COPY } from "../src/lib/crmv4/copy-round251";
import {
  ROUND251_FEATURES,
  activeFolio,
  activeInk,
  activeMargin,
  activePace,
  activeQuire,
  addLeafView,
  addLecternLeaf,
  bulkLeafPin,
  busiestReader,
  cameoBound,
  cameoHue,
  cameoJoin,
  cameoLane,
  cameoLanesCsv,
  cameoNotch,
  cameoRowsCsv,
  cameoStamp,
  cameoState,
  cameoStep,
  cameoWide,
  cyclePace,
  dropLeafView,
  fairReader,
  folioBand,
  folioGap,
  folioOf,
  houseInk,
  idleLeaf,
  inkOf,
  lateLeaf,
  leadingCameo,
  leafCsv,
  leafTimeline,
  lengthenMargin,
  lowerQuire,
  marginOf,
  moveLeafFocus,
  neighborLeafCount,
  overdueLeaf,
  paceOf,
  peakFolio,
  quietFolio,
  quireOf,
  raiseQuire,
  readLeafViews,
  restingLeaf,
  rushLeaf,
  shortenMargin,
  suggestInk,
  suggestMargin,
} from "../src/lib/crmv4/round251";

function main() {
  assert.equal(ROUND251_FEATURES.length, 25);
  assert.equal(folioOf(" margin "), "margin");
  assert.equal(folioOf("paris"), "");
  assert.equal(marginOf("12"), 12);
  assert.equal(marginOf(24), 24);
  assert.equal(marginOf("36"), 36);
  assert.equal(marginOf("10"), null);
  assert.equal(quireOf("1"), 1);
  assert.equal(quireOf(3), 3);
  assert.equal(quireOf("5"), 5);
  assert.equal(quireOf("7"), 7);
  assert.equal(quireOf("2"), null);
  assert.equal(inkOf("iron"), "IRON");
  assert.equal(inkOf("oak"), "OAK");
  assert.equal(inkOf("soot"), "SOOT");
  assert.equal(inkOf("linen"), "");
  assert.equal(paceOf("calm"), "calm");
  assert.equal(paceOf("even"), "even");
  assert.equal(paceOf("brisk"), "brisk");
  assert.equal(paceOf("warm"), "");
  assert.equal(peakFolio("preface"), true);
  assert.equal(peakFolio("COLOPHON"), true);
  assert.equal(peakFolio("margin"), false);
  assert.equal(quietFolio("errata"), true);
  assert.equal(quietFolio("preface"), false);
  assert.equal(folioBand("preface"), "early");
  assert.equal(folioBand("margin"), "mid");
  assert.equal(folioBand("errata"), "late");
  assert.equal(folioBand(""), "");
  assert.equal(folioGap("chapter", "margin"), 1);
  assert.equal(folioGap("margin", "chapter"), -1);
  assert.equal(folioGap("", "chapter"), null);
  assert.equal(houseInk("iron"), true);
  assert.equal(houseInk("OAK"), true);
  assert.equal(houseInk("soot"), false);
  assert.equal(activeFolio("peak"), "peak");
  assert.equal(activeFolio("margin"), "margin");
  assert.equal(activeFolio("paris"), "all");
  assert.equal(activeMargin("12"), "12");
  assert.equal(activeMargin("10"), "all");
  assert.equal(activePace("brisk", ["calm", "even", "brisk"]), "brisk");
  assert.equal(activePace("loud", ["calm", "even", "brisk"]), "all");
  assert.equal(activeQuire("5"), "5");
  assert.equal(activeQuire("2"), "all");
  assert.equal(activeInk("oak"), "oak");
  assert.equal(activeInk("silk"), "all");
  assert.equal(moveLeafFocus(0, 3, 1), 1);
  assert.equal(moveLeafFocus(0, 3, -1), 2);
  assert.equal(suggestInk([]), "IRON");
  assert.equal(suggestMargin([], 4), 12);
  assert.equal(suggestMargin([], 12), 24);
  assert.equal(suggestMargin([], 19), 36);
  assert.equal(fairReader([], "Ada, Bea"), "Ada");

  const first = addLecternLeaf([], {
    id: "a",
    title: "  North leaf ",
    note: "",
    reader: "Ada",
    folio: "preface",
    ink: "iron",
    pace: "calm",
    margin: 12,
    quire: 1,
    tags: "x x y",
  });
  assert.equal(first.length, 1);
  assert.equal(first[0].title, "North leaf");
  assert.equal(first[0].note, "");
  assert.equal(first[0].ink, "IRON");
  assert.equal(first[0].tags.join(""), "xy");
  assert.equal(first[0].audit, "save");
  assert.equal(overdueLeaf(first[0]), true);
  assert.equal(addLecternLeaf(first, { id: "a", title: "Other" }).length, 1);
  assert.equal(addLecternLeaf(first, { id: "b", title: "North leaf" }).length, 1);
  assert.equal(addLecternLeaf(first, { id: "b", title: "   " }).length, 1);

  const pinned = bulkLeafPin(first, ["a"]);
  assert.equal(overdueLeaf(pinned[0]), false);
  const quiet = addLecternLeaf(pinned, { id: "q", title: "Margin rest", reader: "Bea", folio: "margin", pace: "calm", quire: 1 });
  assert.equal(idleLeaf(quiet[0]), true);
  assert.equal(lateLeaf(quiet[0], "colophon"), true);
  const rushed = addLecternLeaf([], { id: "r", title: "Preface rush", folio: "preface", pace: "brisk", quire: 5 });
  assert.equal(rushLeaf(rushed[0]), true);
  const rested = addLecternLeaf([], { id: "s", title: "Index rest", folio: "index", pace: "even", margin: 36 });
  assert.equal(restingLeaf(rested[0]), true);
  assert.equal(lengthenMargin(rested, "s")[0].margin, 36);
  assert.equal(lengthenMargin([{ ...rested[0], margin: null }], "s")[0].margin, 12);
  assert.equal(shortenMargin(first, "a")[0].margin, 12);
  assert.equal(shortenMargin([{ ...first[0], margin: null }], "a")[0].margin, 36);
  assert.equal(cyclePace(first, "a")[0].pace, "even");
  assert.equal(raiseQuire(first, "a")[0].quire, 3);
  assert.equal(lowerQuire(first, "a")[0].quire, 7);
  assert.equal(busiestReader(quiet), "Bea");
  assert.equal(neighborLeafCount(quiet) >= 0, true);
  assert.match(leafCsv(first, "colophon"), /North leaf/);
  assert.match(leafTimeline(first).map((lane) => lane.quire).join(","), /1/);

  const views = addLeafView([], { id: "v", name: "Peak", tray: "open", folio: "peak", margin: "12", ink: "iron", pace: "calm", quire: "1" });
  assert.equal(views[0].folio, "peak");
  assert.equal(dropLeafView(views, "v").length, 0);
  assert.equal(readLeafViews([{ id: "v", name: "Peak", tray: "nope" }])[0].tray, "open");

  assert.equal(cameoState("WARM"), "set");
  assert.equal(cameoStamp("WARM"), "WM4");
  assert.equal(cameoLane("WARM"), "plain");
  assert.equal(cameoHue("WARM"), "ink");
  assert.equal(cameoStep("WARM"), 4);
  assert.equal(cameoJoin("WARM"), false);
  assert.equal(cameoJoin("AABB"), true);
  assert.equal(cameoBound("NEW"), true);
  assert.equal(cameoWide("WARM"), false);
  assert.equal(cameoLane("OK"), "open");
  assert.equal(cameoStamp("OK"), "OK2");
  assert.equal(cameoLane("NEW"), "short");
  assert.equal(cameoBound("NEW"), true);
  assert.equal(cameoHue("NEW"), "ash");
  assert.equal(cameoLane("12"), "figure");
  assert.equal(cameoHue("12"), "bronze");
  assert.equal(cameoLane("AA_OK"), "break");
  assert.equal(cameoNotch("AA_OK"), true);
  assert.equal(cameoLane("AABB"), "pair");
  assert.equal(cameoStamp("AABB"), "AB4");
  assert.equal(cameoJoin("AABB"), true);
  assert.equal(cameoWide("SALEHOLDING"), true);
  assert.equal(cameoLane("SALEHOLDING"), "scroll");
  assert.equal(cameoStamp("SALEHOLDING"), "SG11");
  assert.equal(cameoBound("SALEHOLDING"), true);
  assert.equal(cameoState("X"), "clear");
  assert.equal(cameoState({ saleStatus: "WARM", balance: 1 }), "");
  assert.equal(cameoState({ code: "WARM" }), "");

  const book = [
    { id: "1", label: "Ada", note: "AABB" },
    { id: "2", label: "Bea", note: "AABB" },
    { id: "3", label: "Cem", note: "WARM" },
  ];
  assert.equal(leadingCameo(book), "pair");
  assert.match(cameoLanesCsv(book), /pair,2/);
  assert.match(cameoRowsCsv(book, ["1"]), /AABB,AB4,pair,ivory,2,1,0,0,0,0,0,0,1,0,0,0,1/);
  assert.match(cameoRowsCsv(book, ["1"]), /WARM,WM4,plain,ink,4,0,0,0,0,0,0,0,0,0,0,1,0/);

  const keys = Object.keys(ROUND251_COPY.en);
  assert.ok(keys.length >= 140);
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND251_COPY[locale]).sort(), keys.slice().sort());
    for (const key of keys) {
      assert.equal(typeof ROUND251_COPY[locale][key as keyof typeof ROUND251_COPY.en], "string");
      assert.ok(ROUND251_COPY[locale][key as keyof typeof ROUND251_COPY.en].length > 0);
    }
  }
  assert.equal(crmv4Text("tr", "lctTitle"), ROUND251_COPY.tr.lctTitle);
  assert.equal(crmv4Text("de", "cmoTitle"), ROUND251_COPY.de.cmoTitle);
  assert.equal(crmv4Text("ru", "lctSub"), ROUND251_COPY.ru.lctSub);
  assert.equal(crmv4Text("ar", "cmoSub"), ROUND251_COPY.ar.cmoSub);
  assert.equal(crmv4Text("en", "lctLogo"), "7FX");
  assert.equal(crmv4Text("en", "lctTitle"), "Lectern leaves");
  assert.notEqual(ROUND251_COPY.tr.lctTitle, ROUND251_COPY.en.lctTitle);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-lct/);
  assert.match(css, /\.c4-cmo-index/);
  assert.match(css, /\.c4-compare-vitrine/);
  assert.match(css, /\.c4-vip-vitrine/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round251.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /saleStatus/);
  assert.match(viewFile, /leafCsv/);
  assert.match(viewFile, /cameoRowsCsv/);
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
  assert.match(viewFile, /data-leaves/);
  assert.match(viewFile, /data-cameos/);
  assert.match(viewFile, /data-traders/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestInk/);
  assert.match(viewFile, /c4-cmo-search/);
  assert.match(viewFile, /leafTimeline/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "lct"/);
  assert.match(app, /view === "cmo"/);
  const compare = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round66.tsx"), "utf8");
  const vip = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round70.tsx"), "utf8");
  assert.match(compare, /c4-compare-vitrine/);
  assert.match(compare, /data-logo="mono"/);
  assert.match(vip, /c4-vip-vitrine/);
  assert.match(vip, /data-logo="mono"/);
  const used = new Set(viewFile.match(/v4\("([a-zA-Z]+)"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of Array.from(used)) assert.ok(key in ROUND251_COPY.en, key);
  const audit = viewFile.match(/"(lctAudit[a-zA-Z]+)"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of audit) assert.ok(key in ROUND251_COPY.en, key);
  const salon = `${compare}\n${vip}`.match(/"((?:mc|vw)Salon[a-zA-Z]+)"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of salon) assert.ok(key in ROUND251_COPY.en, key);
  console.log("crmv4 round251 tests passed");
}

main();
