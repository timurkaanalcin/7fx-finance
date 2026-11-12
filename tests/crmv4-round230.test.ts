/**
 * Cabinet drawers and document watermarks.
 * Run: TZ=UTC npx tsx tests/crmv4-round230.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND230_COPY } from "../src/lib/crmv4/copy-round230";
import {
  activePace,
  activeShelf,
  activeRib,
  activeWick,
  addDrawer,
  addDrawerTag,
  addDrawerView,
  watermarkLane,
  watermarkMark,
  watermarkRowsCsv,
  watermarkState,
  watermarkStep,
  watermarkTone,
  watermarksCsv,
  adjacentDrawerCount,
  coolingDrawer,
  cyclePace,
  drawersCsv,
  fairClerk,
  houseWeave,
  lateDrawer,
  leadingWatermark,
  moveDrawerFocus,
  weaveOf,
  readDrawerViews,
  rowDensity,
  setDrawerSeal,
  setDrawerRib,
  sharedWatermarkCount,
  shelfGap,
  shelfOf,
  snoozeDrawer,
  ribOf,
  stitchedWatermark,
  suggestWeave,
  suggestWick,
  wideWatermark,
  wickOf,
  peakShelf,
  quietShelf,
} from "../src/lib/crmv4/round230";

function main() {
  assert.equal(weaveOf("  graphite "), "GRAPHITE");
  assert.equal(weaveOf("ivory"), "IVORY");
  assert.equal(weaveOf("champagne"), "CHAMPAGNE");
  assert.equal(weaveOf("   "), "");
  assert.equal(weaveOf("slate"), "");
  assert.equal(shelfOf("1"), 1);
  assert.equal(shelfOf(7), 7);
  assert.equal(shelfOf("7"), 7);
  assert.equal(shelfOf("0"), null);
  assert.equal(shelfOf(0), null);
  assert.equal(shelfOf("8"), null);
  assert.equal(shelfOf("07"), null);
  assert.equal(shelfOf(""), null);
  assert.equal(shelfOf(1.5), null);
  assert.equal(wickOf("5"), 5);
  assert.equal(wickOf(15), 15);
  assert.equal(wickOf("45"), 45);
  assert.equal(wickOf("4"), null);
  assert.equal(wickOf("05"), null);
  assert.equal(ribOf("2"), 2);
  assert.equal(ribOf(4), 4);
  assert.equal(ribOf("8"), 8);
  assert.equal(ribOf("1"), null);
  assert.equal(ribOf("0"), null);
  assert.equal(peakShelf(2), true);
  assert.equal(peakShelf(5), true);
  assert.equal(peakShelf(3), false);
  assert.equal(peakShelf(6), false);
  assert.equal(quietShelf(7), true);
  assert.equal(quietShelf(1), false);
  assert.equal(shelfGap(1, 7), 6);
  assert.equal(shelfGap(7, 1), -6);
  assert.equal(shelfGap(null, 3), null);
  assert.equal(shelfGap(1, 0), null);
  assert.equal(houseWeave("graphite"), true);
  assert.equal(houseWeave("IVORY"), true);
  assert.equal(houseWeave("champagne"), false);
  assert.equal(activeShelf("peak"), "peak");
  assert.equal(activeShelf("7"), "7");
  assert.equal(activeShelf("8"), "all");
  assert.equal(activeWick("15"), "15");
  assert.equal(activeWick("12"), "all");
  assert.equal(activePace("walk", ["still", "walk", "flare"]), "walk");
  assert.equal(activePace("glide", ["still", "walk", "flare"]), "all");
  assert.equal(activeRib("4"), "4");
  assert.equal(activeRib("1"), "all");
  assert.equal(rowDensity("tight"), "tight");
  assert.equal(rowDensity("roomy"), "airy");
  assert.equal(moveDrawerFocus(0, 3, 1), 1);
  assert.equal(moveDrawerFocus(0, 3, -1), 2);
  assert.equal(suggestWeave([]), "GRAPHITE");
  assert.equal(suggestWick([]), 45);
  assert.equal(fairClerk([], "Ada, Bea"), "Ada");

  const first = addDrawer([], {
    id: "a",
    title: "  North drawer ",
    note: "quiet",
    clerk: "Ada",
    shelf: "1",
    weave: "ivory",
    pace: "still",
    wick: "5",
    tags: "a b c d e",
    rib: "4",
  });
  assert.equal(first.length, 1);
  assert.equal(first[0].title, "North drawer");
  assert.equal(first[0].weave, "IVORY");
  assert.equal(first[0].shelf, 1);
  assert.equal(first[0].wick, 5);
  assert.deepEqual(first[0].tags, ["a", "b", "c", "d"]);
  assert.equal(first[0].rib, 4);
  assert.equal(first[0].seal, false);
  assert.equal(first[0].audit, "save");
  assert.equal(addDrawer(first, { id: "b", title: "   " }).length, 1);
  assert.equal(addDrawer(first, { id: "a", title: "Other" }).length, 1);
  const raised = setDrawerRib(first, "a", "8");
  assert.equal(raised[0].rib, 8);
  assert.equal(raised[0].audit, "rib");
  const sealed = setDrawerSeal(first, "a", true);
  assert.equal(sealed[0].seal, true);
  assert.equal(sealed[0].audit, "seal");
  const snoozed = snoozeDrawer(first, "a");
  assert.equal(snoozed[0].wick, 45);
  const walked = cyclePace(first, "a");
  assert.equal(walked[0].pace, "walk");
  const tagged = addDrawerTag(first, "a", "a");
  assert.deepEqual(tagged[0].tags, ["a", "b", "c", "d"]);
  const views = addDrawerView([], {
    id: "v",
    name: "Peak",
    tray: "open",
    query: "",
    clerk: "all",
    weave: "all",
    pace: "all",
    shelf: "peak",
    wick: "all",
    rib: "all",
  });
  assert.equal(readDrawerViews(views).length, 1);
  const late = addDrawer([{ ...first[0], rib: 2 }], { id: "b", title: "Late shelf", shelf: "1", rib: "2" });
  assert.equal(lateDrawer(late.find((panel) => panel.id === "a")!, 7), true);
  assert.equal(lateDrawer(late.find((panel) => panel.id === "b")!, 4), false);
  const cooling = addDrawer([], { id: "c", title: "Cooling hall", shelf: "7", pace: "flare", rib: "2" });
  assert.equal(coolingDrawer(cooling[0]), true);
  assert.equal(coolingDrawer({ ...cooling[0], pace: "walk" }), false);
  assert.equal(coolingDrawer({ ...cooling[0], shelf: 2 }), false);
  const far = addDrawer(addDrawer([], { id: "n1", title: "Far shelf", shelf: "1", rib: "2" }), { id: "n2", title: "Fourth shelf", shelf: "4", rib: "2" });
  assert.equal(adjacentDrawerCount(far), 2);
  const close = addDrawer(addDrawer([], { id: "n3", title: "Near shelf", shelf: "1", rib: "2" }), { id: "n4", title: "Third shelf", shelf: "3", rib: "2" });
  assert.equal(adjacentDrawerCount(close), 0);

  assert.equal(watermarkState("hello"), "set");
  assert.equal(watermarkState({ customer: "  " }), "clear");
  assert.equal(watermarkState({ customer: "Ada", kind: "DEPOSIT", status: "APPROVED", deposits: 4 }), "");
  assert.equal(watermarkMark({ customer: "North desk", kind: "WITHDRAW" }), "ND");
  assert.equal(watermarkMark({ customer: "One two three" }), "OT");
  assert.equal(watermarkLane({ customer: "Ada", kind: "DEPOSIT" }), "thread");
  assert.equal(watermarkLane({ customer: "North", kind: "WITHDRAW" }), "fold");
  assert.equal(watermarkLane({ customer: "Desk 4", kind: "MARGIN" }), "stamp");
  assert.equal(watermarkLane({ customer: "Margin hall", kind: "KYC" }), "ribbon");
  assert.equal(watermarkLane({ customer: "Plain hall" }), "plain");
  assert.equal(watermarkTone({ customer: "Ada", kind: "KYC", status: "APPROVED" }), "gilt");
  assert.equal(watermarkTone({ customer: "Ada", kind: "DEPOSIT", status: "PENDING" }), "pale");
  assert.equal(watermarkTone({ customer: "Ada", kind: "WITHDRAW", status: "REJECTED" }), "ash");
  assert.equal(watermarkTone({ customer: "Ada", kind: "DEPOSIT", status: "APPROVED" }), "linen");
  assert.equal(watermarkTone({ customer: "Ada" }), "haze");
  assert.equal(stitchedWatermark({ customer: "North&desk", kind: "WITHDRAW" }), true);
  assert.equal(stitchedWatermark({ customer: "North/desk", kind: "WITHDRAW" }), false);
  assert.equal(wideWatermark({ customer: "Ada" }), false);
  assert.equal(wideWatermark({ customer: "North desk hall" }), true);
  assert.equal(watermarkStep(""), 0);
  assert.equal(watermarkStep("Ada"), 1);
  assert.equal(watermarkStep("North desk"), 2);
  assert.equal(watermarkStep("One two three"), 2);
  const book = [
    { id: "1", label: "North desk", note: { customer: "North desk", kind: "WITHDRAW" } },
    { id: "2", label: "Ada Lane", note: { customer: "Ada Lane", kind: "DEPOSIT", status: "APPROVED" } },
    { id: "3", label: "Desk 4", note: { customer: "Desk 4", kind: "MARGIN" } },
  ];
  assert.equal(leadingWatermark(book), "thread");
  assert.equal(sharedWatermarkCount(book), 0);
  const paired = [
    book[0],
    { id: "4", label: "North door", note: { customer: "North door", kind: "WITHDRAW" } },
  ];
  assert.equal(sharedWatermarkCount(paired), 2);
  assert.match(watermarksCsv(book), /thread,1/);
  assert.match(watermarkRowsCsv(book, ["2"]), /Ada Lane,AL,thread,linen,2,0,0,0,1,0,0,0,1/);
  assert.match(drawersCsv(first, 7), /North drawer,Ada,1,IVORY,still,5,4,a b c d,0,0,0,0,6,0,0,1,0,0,0,quiet,save/);

  const keys = Object.keys(ROUND230_COPY.en);
  assert.ok(keys.length >= 120);
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND230_COPY[locale]).sort(), keys.slice().sort());
    for (const key of keys) {
      assert.equal(typeof ROUND230_COPY[locale][key as keyof typeof ROUND230_COPY.en], "string");
      assert.ok(ROUND230_COPY[locale][key as keyof typeof ROUND230_COPY.en].length > 0);
    }
  }
  assert.equal(crmv4Text("tr", "cabTitle"), ROUND230_COPY.tr.cabTitle);
  assert.equal(crmv4Text("de", "wmkTitle"), ROUND230_COPY.de.wmkTitle);
  assert.equal(crmv4Text("ru", "cabSub"), ROUND230_COPY.ru.cabSub);
  assert.equal(crmv4Text("ar", "wmkSub"), ROUND230_COPY.ar.wmkSub);
  assert.equal(crmv4Text("en", "cabLogo"), "7FX");

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-cab/);
  assert.match(css, /\.c4-wmk-index/);
  assert.match(css, /\.c4-gallery-cabinet/);
  assert.match(css, /\.c4-gallery-cabinet-card/);
  assert.match(css, /\.c4-gallery-cabinet-search/);
  assert.match(css, /\.c4-dep-watermark/);
  assert.match(css, /\.c4-dep-watermark-search/);
  assert.match(css, /\.c4-dep-watermark-card/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round230.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /kind/);
  assert.match(viewFile, /customer/);
  assert.match(viewFile, /status/);
  assert.match(viewFile, /drawersCsv/);
  assert.match(viewFile, /watermarksCsv/);
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
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?view=table&take=40&meta=0&role=TRADER/);
  assert.match(viewFile, /\/api\/admin\/documents\?status=PENDING&take=20/);
  assert.match(viewFile, /data-drawers/);
  assert.match(viewFile, /data-watermarks/);
  assert.match(viewFile, /data-keyed/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /gallery/);
  assert.match(viewFile, /suggestWeave/);
  assert.match(viewFile, /c4-wmk-time/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "cabn"/);
  assert.match(app, /view === "wmk"/);
  assert.match(app, /CabinetDrawers/);
  assert.match(app, /WatermarkMarks/);
  const gallery = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round50.tsx"), "utf8");
  assert.match(gallery, /c4-gallery-cabinet/);
  assert.match(gallery, /c4-gallery-cabinet-card/);
  assert.match(gallery, /c4-gallery-cabinet-search/);
  assert.match(gallery, /data-desk="cabinet"/);
  assert.match(gallery, /data-logo="mono"/);
  assert.match(gallery, /cabn/);
  assert.match(gallery, /wmk/);
  assert.match(gallery, /aria-required=\{false\}/);
  const deposit = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round29.tsx"), "utf8");
  assert.match(deposit, /c4-dep-watermark/);
  assert.match(deposit, /c4-dep-watermark-search/);
  assert.match(deposit, /c4-dep-watermark-card/);
  assert.match(deposit, /data-desk="watermark"/);
  assert.match(deposit, /data-logo="mono"/);
  assert.match(deposit, /cabn/);
  assert.match(deposit, /wmk/);
  assert.match(deposit, /aria-required=\{false\}/);
  assert.match(deposit, /depSource/);
  assert.match(deposit, /depReason/);
  const used = new Set(viewFile.match(/v4\("([a-zA-Z0-9]+)"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of Array.from(used)) assert.ok(key in ROUND230_COPY.en, key);
  const audit = viewFile.match(/"(cabAudit[a-zA-Z]+)"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of audit) assert.ok(key in ROUND230_COPY.en, key);
  console.log("crmv4 round230 tests passed");
}

main();
