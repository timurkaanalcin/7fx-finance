/**
 * Kamal sights, desk-watch plates, and the week watch bill.
 * Run: TZ=UTC npx tsx tests/crmv4-round279.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND279_COPY } from "../src/lib/crmv4/copy-round279";
import {
  ROUND279_FEATURES,
  activeChip,
  activeFinish,
  activeKnot,
  activeMast,
  activeShade,
  addKamal,
  addKamalView,
  briskKamal,
  bulkKamalLog,
  busiestKeeper,
  cycleShade,
  deskCap,
  deskEcho,
  deskHue,
  deskKnown,
  deskLane,
  deskLanesCsv,
  deskLeap,
  deskNotch,
  deskRowsCsv,
  deskSlash,
  deskStamp,
  deskState,
  deskStep,
  deskTail,
  deskTwin,
  deskVowel,
  deskWide,
  deskWords,
  dipKnot,
  dropKamalView,
  evenChip,
  fairKeeper,
  finishOf,
  houseFinish,
  idleKamal,
  keenMast,
  lateKamal,
  leadingDesk,
  liftKnot,
  lowerChip,
  mastBand,
  mastGap,
  mastOf,
  moveKamalFocus,
  neighborKamalCount,
  overdueKamal,
  raiseChip,
  readKamalViews,
  restingKamal,
  shadeOf,
  kamalChip,
  kamalCsv,
  kamalKnot,
  stillMast,
  suggestFinish,
  suggestKnot,
  suggestMast,
  type DeskRow,
  type KamalSight,
} from "../src/lib/crmv4/round279";

function card(partial: Partial<KamalSight> & { id: string; title: string }): KamalSight {
  return {
    note: "",
    helmsman: "",
    mast: "",
    knot: null,
    finish: "",
    shade: "",
    chip: 2,
    tags: [],
    logged: false,
    locked: false,
    stowed: false,
    flagged: false,
    audit: "",
    ...partial,
  };
}

function main() {
  assert.equal(ROUND279_FEATURES.length, 25);
  assert.equal(mastOf(" fore "), "fore");
  assert.equal(mastOf("paris"), "");
  assert.equal(kamalKnot("5"), 5);
  assert.equal(kamalKnot(15), 15);
  assert.equal(kamalKnot("45"), 45);
  assert.equal(kamalKnot("10"), null);
  assert.equal(kamalKnot("12"), null);
  assert.equal(kamalChip("2"), 2);
  assert.equal(kamalChip(5), 5);
  assert.equal(kamalChip("8"), 8);
  assert.equal(kamalChip("1"), null);
  assert.equal(kamalChip("4"), null);
  assert.equal(kamalChip("3"), null);
  assert.equal(finishOf("ivory"), "IVORY");
  assert.equal(finishOf("graphite"), "GRAPHITE");
  assert.equal(finishOf("champagne"), "CHAMPAGNE");
  assert.equal(finishOf("gilt"), "");
  assert.equal(shadeOf("sand"), "sand");
  assert.equal(shadeOf("soot"), "soot");
  assert.equal(shadeOf("gilt"), "gilt");
  assert.equal(shadeOf("mist"), "");
  assert.equal(keenMast("mizzen"), true);
  assert.equal(keenMast("JIGGER"), true);
  assert.equal(keenMast("fore"), false);
  assert.equal(stillMast("fore"), true);
  assert.equal(stillMast("main"), true);
  assert.equal(stillMast("mizzen"), false);
  assert.equal(mastBand("fore"), "dawn");
  assert.equal(mastBand("main"), "noon");
  assert.equal(mastBand("mizzen"), "dusk");
  assert.equal(mastBand("jigger"), "night");
  assert.equal(mastBand(""), "");
  assert.equal(mastGap("fore", "main"), 1);
  assert.equal(mastGap("main", "fore"), -1);
  assert.equal(mastGap("", "fore"), null);
  assert.equal(houseFinish("graphite"), true);
  assert.equal(houseFinish("CHAMPAGNE"), true);
  assert.equal(houseFinish("ivory"), false);
  assert.equal(evenChip(2), true);
  assert.equal(evenChip("8"), true);
  assert.equal(evenChip(5), false);
  assert.equal(activeMast("keen"), "keen");
  assert.equal(activeMast("mizzen"), "mizzen");
  assert.equal(activeMast("paris"), "all");
  assert.equal(activeKnot("15"), "15");
  assert.equal(activeKnot("9"), "all");
  assert.equal(activeShade("soot", ["sand", "soot", "gilt"]), "soot");
  assert.equal(activeShade("mist", ["sand", "soot", "gilt"]), "all");
  assert.equal(activeChip("5"), "5");
  assert.equal(activeChip("4"), "all");
  assert.equal(activeFinish("graphite"), "graphite");
  assert.equal(moveKamalFocus(0, 4, 1), 1);
  assert.equal(moveKamalFocus(0, 4, -1), 3);
  assert.equal(suggestFinish([]), "GRAPHITE");
  assert.equal(suggestKnot([], 6), 5);
  assert.equal(suggestKnot([], 10), 15);
  assert.equal(suggestKnot([], 18), 45);
  assert.equal(suggestMast(8), "fore");
  assert.equal(suggestMast(12), "mizzen");

  const saved = addKamal([], { id: "a", title: "North", note: "keep", helmsman: "Ada", mast: "mizzen", finish: "graphite", shade: "sand", knot: 5, chip: 2, tags: "a b c" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].mast, "mizzen");
  assert.equal(saved[0].finish, "GRAPHITE");
  assert.equal(saved[0].shade, "sand");
  assert.equal(saved[0].knot, 5);
  assert.equal(saved[0].chip, 2);
  assert.deepEqual(saved[0].tags, ["a", "b"]);
  assert.equal(saved[0].audit, "save");
  assert.equal(addKamal(saved, { id: "b", title: "North" }).length, 1);
  const lifted = liftKnot(saved, "a");
  assert.equal(lifted[0].knot, 15);
  assert.equal(liftKnot(liftKnot(lifted, "a"), "a")[0].knot, 45);
  assert.equal(dipKnot(lifted, "a")[0].knot, 5);
  assert.equal(raiseChip(saved, "a")[0].chip, 5);
  assert.equal(lowerChip(raiseChip(saved, "a"), "a")[0].chip, 2);
  assert.equal(cycleShade(saved, "a")[0].shade, "soot");
  assert.equal(overdueKamal(saved[0]), true);
  assert.equal(overdueKamal({ ...saved[0], logged: true }), false);
  assert.equal(idleKamal(saved[0]), false);
  assert.equal(idleKamal({ ...saved[0], mast: "fore" }), true);
  assert.equal(briskKamal({ ...saved[0], chip: 8, shade: "gilt" }), true);
  assert.equal(restingKamal({ ...saved[0], knot: 45, shade: "soot", mast: "jigger" }), true);
  assert.equal(lateKamal({ ...saved[0], mast: "fore" }, "mizzen"), true);
  assert.equal(lateKamal({ ...saved[0], mast: "main" }, "mizzen"), false);
  assert.equal(fairKeeper(saved, "Bea,Ada"), "Bea");
  assert.equal(busiestKeeper(saved), "Ada");
  assert.equal(neighborKamalCount([saved[0], { ...saved[0], id: "b", title: "South", chip: 5 }]), 2);
  const logged = bulkKamalLog(saved, ["a"]);
  assert.equal(logged[0].logged, true);
  const views = addKamalView([], { id: "v", name: "Keen", tray: "deck", mast: "keen", knot: "5", chip: "2", shade: "sand", finish: "graphite" });
  assert.equal(views[0].mast, "keen");
  assert.equal(dropKamalView(views, "v").length, 0);
  assert.equal(readKamalViews(views).length, 1);
  assert.match(kamalCsv(saved, "jigger"), /North,Ada,mizzen,GRAPHITE,sand,5,2/);

  const rows: DeskRow[] = [
    { id: "1", label: "Ada desk", note: { desk: "sales" } },
    { id: "2", label: "Bea", note: { desk: "Atlas" } },
    { id: "3", label: "Cy", note: { desk: "Desk2" } },
    { id: "4", label: "Dee", note: { desk: "Night-watch" } },
    { id: "5", label: "Eve", note: { desk: "London VIP" } },
    { id: "6", label: "Fay", note: { desk: "Paris" } },
    { id: "7", label: "Gus", note: { desk: "" } },
    { id: "8", label: "Blocked", note: { desk: "sales", balance: 1 } },
  ];
  assert.equal(deskState(rows[0].note), "set");
  assert.equal(deskState(rows[6].note), "clear");
  assert.equal(deskState(rows[7].note), "");
  assert.equal(deskLane(rows[0].note), "house");
  assert.equal(deskLane(rows[1].note), "gallery");
  assert.equal(deskLane(rows[2].note), "watch");
  assert.equal(deskLane(rows[3].note), "berth");
  assert.equal(deskLane(rows[4].note), "span");
  assert.equal(deskLane(rows[5].note), "plain");
  assert.equal(deskHue(rows[0].note), "champagne");
  assert.equal(deskHue(rows[1].note), "graphite");
  assert.equal(deskHue(rows[2].note), "ivory");
  assert.equal(deskHue(rows[5].note), "champagne");
  assert.equal(deskStamp(rows[0].note), "LES");
  assert.equal(deskStamp(rows[1].note), "LAS");
  assert.equal(deskKnown(rows[0].note), true);
  assert.equal(deskKnown(rows[5].note), false);
  assert.equal(deskEcho({ desk: "aba" }), true);
  assert.equal(deskLeap({ desk: "porter" }), true);
  assert.equal(deskTwin({ desk: "letter" }), true);
  assert.equal(deskWide({ desk: "ab_cd" }), true);
  assert.equal(deskNotch({ desk: "ab-cd" }), true);
  assert.equal(deskSlash({ desk: "ab/cd" }), true);
  assert.equal(deskCap({ desk: "Tr" }), true);
  assert.equal(deskTail({ desk: "idea" }), false);
  assert.equal(deskVowel({ desk: "Atlas" }), true);
  assert.equal(deskWords({ desk: "London VIP" }), 2);
  assert.equal(deskStep(rows[0].note), 5);
  assert.equal(leadingDesk(rows), "gallery");
  assert.match(deskLanesCsv(rows), /house,1/);
  assert.match(deskRowsCsv(rows, ["1"]), /Ada desk,sales,LES,house,champagne/);

  const locales = ["en", "tr", "de", "ru", "ar"] as const;
  const keys = Object.keys(ROUND279_COPY.en).sort();
  for (const locale of locales) assert.deepEqual(Object.keys(ROUND279_COPY[locale]).sort(), keys);
  assert.equal(crmv4Text("tr", "kamTitle"), ROUND279_COPY.tr.kamTitle);
  assert.equal(crmv4Text("de", "dwbTitle"), ROUND279_COPY.de.dwbTitle);
  assert.equal(crmv4Text("ru", "kamSub"), ROUND279_COPY.ru.kamSub);
  assert.equal(crmv4Text("ar", "dwbSub"), ROUND279_COPY.ar.dwbSub);
  assert.equal(crmv4Text("en", "kamLogo"), "7FX");
  assert.equal(crmv4Text("en", "kamTitle"), "Kamal sights");
  assert.equal(crmv4Text("en", "dwbTitle"), "Desk watch");
  assert.equal(crmv4Text("en", "wkBillKicker"), "Watch bill");
  assert.notEqual(ROUND279_COPY.tr.kamTitle, ROUND279_COPY.en.kamTitle);
  assert.equal(crmv4Text("en", "crsTitle"), "Cross-staff sights");

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-kamal/);
  assert.match(css, /\.c4-deskwatch-index/);
  assert.match(css, /\.c4-kamal-column/);
  assert.match(css, /\.c4-deskwatch-column/);
  assert.match(css, /\.c4-week-bill/);
  assert.match(css, /\.c4-week-bill-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round279.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /desk:/);
  assert.match(viewFile, /kamalCsv/);
  assert.match(viewFile, /deskRowsCsv/);
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
  assert.match(viewFile, /c4-deskwatch-search/);
  assert.match(viewFile, /kamalTimeline/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "kam"/);
  assert.match(app, /view === "dwb"/);
  const week = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round73.tsx"), "utf8");
  assert.match(week, /c4-week-bill/);
  assert.match(week, /c4-week-bill-mast/);
  assert.match(week, /c4-week-salon/);
  assert.match(week, /data-logo="mono"/);
  assert.match(week, /wkBillKicker/);
  assert.match(week, /wkBillLead/);
  const used = new Set(viewFile.match(/v4\("([a-zA-Z0-9]+)"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of Array.from(used)) assert.ok(key in ROUND279_COPY.en, key);
  const named = viewFile.match(/"(kam|dwb)[a-zA-Z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of named) assert.ok(key in ROUND279_COPY.en, key);
  const bill = week.match(/v4\("(wkBill[a-zA-Z0-9]+)"\)/g)?.map((item) => item.slice(4, -2)) || [];
  for (const key of bill) assert.ok(key in ROUND279_COPY.en, key);
  console.log("crmv4 round279 tests passed");
}

main();
