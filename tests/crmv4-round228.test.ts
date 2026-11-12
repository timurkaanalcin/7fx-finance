/**
 * Sacristy drawers and antiphon marks.
 * Run: TZ=UTC npx tsx tests/crmv4-round228.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND228_COPY } from "../src/lib/crmv4/copy-round228";
import {
  activePace,
  activeShelf,
  activeStay,
  activeWick,
  addDrawer,
  addDrawerTag,
  addDrawerView,
  antiphonLane,
  antiphonMark,
  antiphonRowsCsv,
  antiphonState,
  antiphonStep,
  antiphonTone,
  antiphonsCsv,
  coolingDrawer,
  cyclePace,
  drawersCsv,
  fairSexton,
  housePigment,
  lateDrawer,
  leadingAntiphon,
  moveDrawerFocus,
  pigmentOf,
  readDrawerViews,
  rowDensity,
  setDrawerBoss,
  setDrawerStay,
  sharedAntiphonCount,
  shelfGap,
  shelfOf,
  snoozeDrawer,
  stayOf,
  stitchedAntiphon,
  suggestPigment,
  suggestWick,
  wideAntiphon,
  wickOf,
  peakShelf,
  quietShelf,
} from "../src/lib/crmv4/round228";

function main() {
  assert.equal(pigmentOf("  ivory "), "IVORY");
  assert.equal(pigmentOf("graphite"), "GRAPHITE");
  assert.equal(pigmentOf("champagne"), "CHAMPAGNE");
  assert.equal(pigmentOf("   "), "");
  assert.equal(pigmentOf("slate"), "");
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
  assert.equal(stayOf("2"), 2);
  assert.equal(stayOf(4), 4);
  assert.equal(stayOf("8"), 8);
  assert.equal(stayOf("1"), null);
  assert.equal(stayOf("0"), null);
  assert.equal(peakShelf(3), true);
  assert.equal(peakShelf(6), true);
  assert.equal(peakShelf(2), false);
  assert.equal(quietShelf(1), true);
  assert.equal(quietShelf(7), false);
  assert.equal(shelfGap(1, 7), 6);
  assert.equal(shelfGap(7, 1), -6);
  assert.equal(shelfGap(null, 3), null);
  assert.equal(shelfGap(1, 0), null);
  assert.equal(housePigment("ivory"), true);
  assert.equal(housePigment("CHAMPAGNE"), true);
  assert.equal(housePigment("graphite"), false);
  assert.equal(activeShelf("peak"), "peak");
  assert.equal(activeShelf("7"), "7");
  assert.equal(activeShelf("8"), "all");
  assert.equal(activeWick("15"), "15");
  assert.equal(activeWick("12"), "all");
  assert.equal(activePace("walk", ["still", "walk", "flare"]), "walk");
  assert.equal(activePace("glide", ["still", "walk", "flare"]), "all");
  assert.equal(activeStay("4"), "4");
  assert.equal(activeStay("1"), "all");
  assert.equal(rowDensity("tight"), "tight");
  assert.equal(rowDensity("roomy"), "airy");
  assert.equal(moveDrawerFocus(0, 3, 1), 1);
  assert.equal(moveDrawerFocus(0, 3, -1), 2);
  assert.equal(suggestPigment([]), "IVORY");
  assert.equal(suggestWick([]), 15);
  assert.equal(fairSexton([], "Ada, Bea"), "Ada");

  const first = addDrawer([], {
    id: "a",
    title: "  North drawer ",
    note: "quiet",
    sexton: "Ada",
    shelf: "1",
    pigment: "ivory",
    pace: "still",
    wick: "5",
    tags: "a b c d",
    stay: "4",
  });
  assert.equal(first.length, 1);
  assert.equal(first[0].title, "North drawer");
  assert.equal(first[0].pigment, "IVORY");
  assert.equal(first[0].shelf, 1);
  assert.equal(first[0].wick, 5);
  assert.deepEqual(first[0].tags, ["a", "b", "c"]);
  assert.equal(first[0].stay, 4);
  assert.equal(first[0].boss, false);
  assert.equal(first[0].audit, "save");
  assert.equal(addDrawer(first, { id: "b", title: "   " }).length, 1);
  assert.equal(addDrawer(first, { id: "a", title: "Other" }).length, 1);
  const raised = setDrawerStay(first, "a", "8");
  assert.equal(raised[0].stay, 8);
  assert.equal(raised[0].audit, "stay");
  const boss = setDrawerBoss(first, "a", true);
  assert.equal(boss[0].boss, true);
  assert.equal(boss[0].audit, "boss");
  const snoozed = snoozeDrawer(first, "a");
  assert.equal(snoozed[0].wick, 15);
  const walked = cyclePace(first, "a");
  assert.equal(walked[0].pace, "walk");
  const tagged = addDrawerTag(first, "a", "a");
  assert.deepEqual(tagged[0].tags, ["a", "b", "c"]);
  const views = addDrawerView([], {
    id: "v",
    name: "Peak",
    tray: "open",
    query: "",
    sexton: "all",
    pigment: "all",
    pace: "all",
    shelf: "peak",
    wick: "all",
    stay: "all",
  });
  assert.equal(readDrawerViews(views).length, 1);
  const late = addDrawer([{ ...first[0], stay: 2 }], { id: "b", title: "Late shelf", shelf: "1", stay: "2" });
  assert.equal(lateDrawer(late.find((panel) => panel.id === "a")!, 7), true);
  assert.equal(lateDrawer(late.find((panel) => panel.id === "b")!, 3), false);
  const cooling = addDrawer([], { id: "c", title: "Cooling hall", shelf: "1", pace: "walk", stay: "2" });
  assert.equal(coolingDrawer(cooling[0]), true);
  assert.equal(coolingDrawer({ ...cooling[0], pace: "flare" }), false);
  assert.equal(coolingDrawer({ ...cooling[0], shelf: 2 }), false);

  assert.equal(antiphonState("hello"), "set");
  assert.equal(antiphonState({ customer: "  " }), "clear");
  assert.equal(antiphonState({ customer: "Ada", kind: "DEPOSIT", status: "APPROVED", deposits: 4 }), "");
  assert.equal(antiphonMark({ customer: "North desk", kind: "WITHDRAW" }), "ND");
  assert.equal(antiphonLane({ customer: "Ada", kind: "DEPOSIT" }), "bell");
  assert.equal(antiphonLane({ customer: "North", kind: "WITHDRAW" }), "margin");
  assert.equal(antiphonLane({ customer: "Desk 4", kind: "MARGIN" }), "cipher");
  assert.equal(antiphonLane({ customer: "Margin hall", kind: "KYC" }), "quill");
  assert.equal(antiphonTone({ customer: "Ada", kind: "DEPOSIT", status: "APPROVED" }), "bright");
  assert.equal(antiphonTone({ customer: "Ada", kind: "DEPOSIT", status: "PENDING" }), "dim");
  assert.equal(antiphonTone({ customer: "Ada", kind: "WITHDRAW", status: "APPROVED" }), "even");
  assert.equal(antiphonTone({ customer: "Ada", kind: "WITHDRAW", status: "REJECTED" }), "hush");
  assert.equal(antiphonTone({ customer: "Ada" }), "mist");
  assert.equal(stitchedAntiphon({ customer: "North/desk", kind: "WITHDRAW" }), true);
  assert.equal(stitchedAntiphon({ customer: "North-desk", kind: "WITHDRAW" }), false);
  assert.equal(wideAntiphon({ customer: "Ada" }), false);
  assert.equal(wideAntiphon({ customer: "North desk hall" }), true);
  assert.equal(antiphonStep(""), 0);
  assert.equal(antiphonStep("Ada"), 1);
  assert.equal(antiphonStep("North desk"), 2);
  assert.equal(antiphonStep("One two three"), 3);
  const book = [
    { id: "1", label: "North desk", note: { customer: "North desk", kind: "WITHDRAW" } },
    { id: "2", label: "Ada Lane", note: { customer: "Ada Lane", kind: "DEPOSIT", status: "APPROVED" } },
    { id: "3", label: "Desk 4", note: { customer: "Desk 4", kind: "MARGIN" } },
  ];
  assert.equal(leadingAntiphon(book), "margin");
  assert.equal(sharedAntiphonCount(book), 0);
  const paired = [
    book[0],
    { id: "4", label: "North door", note: { customer: "North door", kind: "WITHDRAW" } },
  ];
  assert.equal(sharedAntiphonCount(paired), 2);
  assert.match(antiphonsCsv(book), /margin,1/);
  assert.match(antiphonRowsCsv(book, ["2"]), /Ada Lane,AL,bell,bright,2,0,0,0,1,0,0,1/);
  assert.match(drawersCsv(first, 7), /North drawer,Ada,1,IVORY,still,5,4,a b c,0,0,0,0,6,0,0,1,0,0,0,quiet,save/);

  const keys = Object.keys(ROUND228_COPY.en);
  assert.ok(keys.length >= 120);
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND228_COPY[locale]).sort(), keys.slice().sort());
    for (const key of keys) {
      assert.equal(typeof ROUND228_COPY[locale][key as keyof typeof ROUND228_COPY.en], "string");
      assert.ok(ROUND228_COPY[locale][key as keyof typeof ROUND228_COPY.en].length > 0);
    }
  }
  assert.equal(crmv4Text("tr", "sdrTitle"), ROUND228_COPY.tr.sdrTitle);
  assert.equal(crmv4Text("de", "antTitle"), ROUND228_COPY.de.antTitle);
  assert.equal(crmv4Text("ru", "sdrSub"), ROUND228_COPY.ru.sdrSub);
  assert.equal(crmv4Text("ar", "antSub"), ROUND228_COPY.ar.antSub);
  assert.equal(crmv4Text("en", "sdrLogo"), "7FX");

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-sdr/);
  assert.match(css, /\.c4-ant-index/);
  assert.match(css, /\.c4-support-sacristy/);
  assert.match(css, /\.c4-support-sacristy-ticket/);
  assert.match(css, /\.c4-support-sacristy-docs/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round228.tsx"), "utf8");
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
  assert.match(viewFile, /antiphonsCsv/);
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
  assert.match(viewFile, /\/api\/admin\/tickets\?take=40/);
  assert.match(viewFile, /\/api\/admin\/documents\?status=PENDING&take=20/);
  assert.match(viewFile, /data-drawers/);
  assert.match(viewFile, /data-antiphons/);
  assert.match(viewFile, /data-keyed/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /support/);
  assert.match(viewFile, /suggestPigment/);
  assert.match(viewFile, /c4-ant-time/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "scdr"/);
  assert.match(app, /view === "antp"/);
  assert.match(app, /SacristyDrawers/);
  assert.match(app, /AntiphonMarks/);
  const support = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/views/Support.tsx"), "utf8");
  assert.match(support, /c4-support-sacristy/);
  assert.match(support, /c4-support-sacristy-ticket/);
  assert.match(support, /c4-support-sacristy-docs/);
  assert.match(support, /data-desk="sacristy"/);
  assert.match(support, /data-logo="mono"/);
  assert.match(support, /scdr/);
  assert.match(support, /antp/);
  assert.match(support, /aria-required=\{false\}/);
  const used = new Set(viewFile.match(/v4\("([a-zA-Z0-9]+)"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of Array.from(used)) assert.ok(key in ROUND228_COPY.en, key);
  const audit = viewFile.match(/"(sdrAudit[a-zA-Z]+)"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of audit) assert.ok(key in ROUND228_COPY.en, key);
  console.log("crmv4 round228 tests passed");
}

main();
