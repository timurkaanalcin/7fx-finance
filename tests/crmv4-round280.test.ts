/**
 * Backstaff sights, invalid-reason plates, and the segment salon.
 * Run: TZ=UTC npx tsx tests/crmv4-round280.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND280_COPY } from "../src/lib/crmv4/copy-round280";
import {
  ROUND280_FEATURES,
  activeChip,
  activeFinish,
  activeKnot,
  activeMast,
  activeShade,
  addBackstaff,
  addBackstaffView,
  briskBackstaff,
  bulkBackstaffLog,
  busiestKeeper,
  cycleShade,
  dipKnot,
  dropBackstaffView,
  evenChip,
  fairKeeper,
  finishOf,
  houseFinish,
  idleBackstaff,
  keenMast,
  lateBackstaff,
  leadingReason,
  liftKnot,
  lowerChip,
  mastBand,
  mastGap,
  mastOf,
  moveBackstaffFocus,
  neighborBackstaffCount,
  overdueBackstaff,
  raiseChip,
  readBackstaffViews,
  restingBackstaff,
  shadeOf,
  backstaffChip,
  backstaffCsv,
  backstaffKnot,
  stillMast,
  suggestFinish,
  suggestKnot,
  suggestMast,
  reasonCap,
  reasonEcho,
  reasonHue,
  reasonKnown,
  reasonLane,
  reasonLanesCsv,
  reasonLeap,
  reasonNotch,
  reasonRowsCsv,
  reasonSlash,
  reasonStamp,
  reasonState,
  reasonStep,
  reasonTail,
  reasonTwin,
  reasonVowel,
  reasonWide,
  reasonWords,
  type ReasonRow,
  type BackstaffSight,
} from "../src/lib/crmv4/round280";

function card(partial: Partial<BackstaffSight> & { id: string; title: string }): BackstaffSight {
  return {
    note: "",
    helmsman: "",
    mast: "",
    knot: null,
    finish: "",
    shade: "",
    chip: 1,
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
  assert.equal(ROUND280_FEATURES.length, 25);
  assert.equal(mastOf(" limb "), "limb");
  assert.equal(mastOf("paris"), "");
  assert.equal(backstaffKnot("30"), 30);
  assert.equal(backstaffKnot(60), 60);
  assert.equal(backstaffKnot("90"), 90);
  assert.equal(backstaffKnot("10"), null);
  assert.equal(backstaffKnot("12"), null);
  assert.equal(backstaffChip("1"), 1);
  assert.equal(backstaffChip(4), 4);
  assert.equal(backstaffChip("7"), 7);
  assert.equal(backstaffChip("2"), null);
  assert.equal(backstaffChip("5"), null);
  assert.equal(backstaffChip("3"), null);
  assert.equal(finishOf("ivory"), "IVORY");
  assert.equal(finishOf("graphite"), "GRAPHITE");
  assert.equal(finishOf("champagne"), "CHAMPAGNE");
  assert.equal(finishOf("gilt"), "");
  assert.equal(shadeOf("pearl"), "pearl");
  assert.equal(shadeOf("ink"), "ink");
  assert.equal(shadeOf("brass"), "brass");
  assert.equal(shadeOf("mist"), "");
  assert.equal(keenMast("vane"), true);
  assert.equal(keenMast("SIGHT"), true);
  assert.equal(keenMast("limb"), false);
  assert.equal(stillMast("limb"), true);
  assert.equal(stillMast("arc"), true);
  assert.equal(stillMast("vane"), false);
  assert.equal(mastBand("limb"), "dawn");
  assert.equal(mastBand("arc"), "noon");
  assert.equal(mastBand("vane"), "dusk");
  assert.equal(mastBand("sight"), "night");
  assert.equal(mastBand(""), "");
  assert.equal(mastGap("limb", "arc"), 1);
  assert.equal(mastGap("arc", "limb"), -1);
  assert.equal(mastGap("", "limb"), null);
  assert.equal(houseFinish("graphite"), true);
  assert.equal(houseFinish("CHAMPAGNE"), true);
  assert.equal(houseFinish("ivory"), false);
  assert.equal(evenChip(4), true);
  assert.equal(evenChip("4"), true);
  assert.equal(evenChip(1), false);
  assert.equal(evenChip(7), false);
  assert.equal(activeMast("keen"), "keen");
  assert.equal(activeMast("vane"), "vane");
  assert.equal(activeMast("paris"), "all");
  assert.equal(activeKnot("30"), "30");
  assert.equal(activeKnot("9"), "all");
  assert.equal(activeShade("ink", ["pearl", "ink", "brass"]), "ink");
  assert.equal(activeShade("mist", ["pearl", "ink", "brass"]), "all");
  assert.equal(activeChip("4"), "4");
  assert.equal(activeChip("2"), "all");
  assert.equal(activeFinish("graphite"), "graphite");
  assert.equal(moveBackstaffFocus(0, 4, 1), 1);
  assert.equal(moveBackstaffFocus(0, 4, -1), 3);
  assert.equal(suggestFinish([]), "GRAPHITE");
  assert.equal(suggestKnot([], 6), 30);
  assert.equal(suggestKnot([], 10), 60);
  assert.equal(suggestKnot([], 18), 90);
  assert.equal(suggestMast(8), "limb");
  assert.equal(suggestMast(12), "vane");

  const saved = addBackstaff([], { id: "a", title: "North", note: "keep", helmsman: "Ada", mast: "vane", finish: "graphite", shade: "pearl", knot: 30, chip: 1, tags: "a b c" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].mast, "vane");
  assert.equal(saved[0].finish, "GRAPHITE");
  assert.equal(saved[0].shade, "pearl");
  assert.equal(saved[0].knot, 30);
  assert.equal(saved[0].chip, 1);
  assert.deepEqual(saved[0].tags, ["a", "b"]);
  assert.equal(saved[0].audit, "save");
  assert.equal(addBackstaff(saved, { id: "b", title: "North" }).length, 1);
  const lifted = liftKnot(saved, "a");
  assert.equal(lifted[0].knot, 60);
  assert.equal(liftKnot(liftKnot(lifted, "a"), "a")[0].knot, 90);
  assert.equal(dipKnot(lifted, "a")[0].knot, 30);
  assert.equal(raiseChip(saved, "a")[0].chip, 4);
  assert.equal(lowerChip(raiseChip(saved, "a"), "a")[0].chip, 1);
  assert.equal(cycleShade(saved, "a")[0].shade, "ink");
  assert.equal(overdueBackstaff(saved[0]), true);
  assert.equal(overdueBackstaff({ ...saved[0], logged: true }), false);
  assert.equal(idleBackstaff(saved[0]), false);
  assert.equal(idleBackstaff({ ...saved[0], mast: "limb" }), true);
  assert.equal(briskBackstaff({ ...saved[0], chip: 7, shade: "brass" }), true);
  assert.equal(restingBackstaff({ ...saved[0], knot: 90, shade: "ink", mast: "sight" }), true);
  assert.equal(lateBackstaff({ ...saved[0], mast: "limb" }, "sight"), true);
  assert.equal(lateBackstaff({ ...saved[0], mast: "arc" }, "vane"), false);
  assert.equal(fairKeeper(saved, "Bea,Ada"), "Bea");
  assert.equal(busiestKeeper(saved), "Ada");
  assert.equal(neighborBackstaffCount([saved[0], { ...saved[0], id: "b", title: "South", chip: 4 }]), 2);
  const logged = bulkBackstaffLog(saved, ["a"]);
  assert.equal(logged[0].logged, true);
  const views = addBackstaffView([], { id: "v", name: "Keen", tray: "deck", mast: "keen", knot: "30", chip: "1", shade: "pearl", finish: "graphite" });
  assert.equal(views[0].mast, "keen");
  assert.equal(dropBackstaffView(views, "v").length, 0);
  assert.equal(readBackstaffViews(views).length, 1);
  assert.match(backstaffCsv(saved, "sight"), /North,Ada,vane,GRAPHITE,pearl,30,1/);

  const rows: ReasonRow[] = [
    { id: "1", label: "Ada", note: { leadInvalidReason: "INV_DUPLICATE" } },
    { id: "2", label: "Bea", note: { leadInvalidReason: "INV_WRONG_GEO" } },
    { id: "3", label: "Cy", note: { leadInvalidReason: "INV_WRONG_NUMBER" } },
    { id: "4", label: "Dee", note: { leadInvalidReason: "INV_UNDERAGE" } },
    { id: "5", label: "Eve", note: { leadInvalidReason: "INV_NOT_IN_WH" } },
    { id: "6", label: "Fay", note: { leadInvalidReason: "INV_NO_DOCS" } },
    { id: "7", label: "Gus", note: { leadInvalidReason: "" } },
    { id: "8", label: "Blocked", note: { leadInvalidReason: "INV_DUPLICATE", balance: 1 } },
  ];
  assert.equal(reasonState(rows[0].note), "set");
  assert.equal(reasonState(rows[6].note), "clear");
  assert.equal(reasonState(rows[7].note), "");
  assert.equal(reasonLane(rows[0].note), "duplicate");
  assert.equal(reasonLane(rows[1].note), "geo");
  assert.equal(reasonLane(rows[2].note), "number");
  assert.equal(reasonLane(rows[3].note), "age");
  assert.equal(reasonLane(rows[4].note), "hours");
  assert.equal(reasonLane(rows[5].note), "papers");
  assert.equal(reasonHue(rows[0].note), "champagne");
  assert.equal(reasonHue(rows[1].note), "graphite");
  assert.equal(reasonHue(rows[2].note), "ivory");
  assert.equal(reasonStamp(rows[0].note), "ATE");
  assert.equal(reasonStamp(rows[1].note), "GEO");
  assert.equal(reasonKnown(rows[0].note), true);
  assert.equal(reasonKnown({ leadInvalidReason: "Atlas" }), false);
  assert.equal(reasonEcho({ leadInvalidReason: "aba" }), true);
  assert.equal(reasonLeap(rows[0].note), true);
  assert.equal(reasonLeap(rows[1].note), false);
  assert.equal(reasonTwin({ leadInvalidReason: "letter" }), true);
  assert.equal(reasonWide({ leadInvalidReason: "ab_cd" }), true);
  assert.equal(reasonNotch({ leadInvalidReason: "ab-cd" }), true);
  assert.equal(reasonSlash({ leadInvalidReason: "ab/cd" }), true);
  assert.equal(reasonCap({ leadInvalidReason: "Tr" }), true);
  assert.equal(reasonTail({ leadInvalidReason: "idea" }), false);
  assert.equal(reasonVowel({ leadInvalidReason: "Atlas" }), true);
  assert.equal(reasonWords({ leadInvalidReason: "London VIP" }), 2);
  assert.equal(reasonStep(rows[0].note), 12);
  assert.equal(leadingReason(rows), "duplicate");
  assert.match(reasonLanesCsv(rows), /duplicate,1/);
  assert.match(reasonRowsCsv(rows, ["1"]), /Ada,INV_DUPLICATE,ATE,duplicate,champagne/);

  const locales = ["en", "tr", "de", "ru", "ar"] as const;
  const keys = Object.keys(ROUND280_COPY.en).sort();
  for (const locale of locales) assert.deepEqual(Object.keys(ROUND280_COPY[locale]).sort(), keys);
  assert.equal(crmv4Text("tr", "bstTitle"), ROUND280_COPY.tr.bstTitle);
  assert.equal(crmv4Text("de", "lirTitle"), ROUND280_COPY.de.lirTitle);
  assert.equal(crmv4Text("ru", "bstSub"), ROUND280_COPY.ru.bstSub);
  assert.equal(crmv4Text("ar", "lirSub"), ROUND280_COPY.ar.lirSub);
  assert.equal(crmv4Text("en", "bstLogo"), "7FX");
  assert.equal(crmv4Text("en", "bstTitle"), "Backstaff sights");
  assert.equal(crmv4Text("en", "lirTitle"), "Reason plates");
  assert.equal(crmv4Text("en", "segSalonKicker"), "Segment salon");
  assert.notEqual(ROUND280_COPY.tr.bstTitle, ROUND280_COPY.en.bstTitle);
  assert.equal(crmv4Text("en", "kamTitle"), "Kamal sights");

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-backstaff/);
  assert.match(css, /\.c4-reasonplate-index/);
  assert.match(css, /\.c4-backstaff-column/);
  assert.match(css, /\.c4-reasonplate-column/);
  assert.match(css, /\.c4-seg-salon/);
  assert.match(css, /\.c4-seg-salon-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round280.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /leadInvalidReason:/);
  assert.match(viewFile, /backstaffCsv/);
  assert.match(viewFile, /reasonRowsCsv/);
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
  assert.match(viewFile, /c4-reasonplate-search/);
  assert.match(viewFile, /backstaffTimeline/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "bst"/);
  assert.match(app, /view === "lir"/);
  const salon = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round48.tsx"), "utf8");
  assert.match(salon, /c4-seg-salon/);
  assert.match(salon, /c4-seg-salon-mast/);
  assert.match(salon, /c4-seg-salon-card/);
  assert.match(salon, /data-logo="mono"/);
  assert.match(salon, /segSalonKicker/);
  assert.match(salon, /segSalonLead/);
  const board = salon.slice(salon.indexOf("export function SegmentBoard"));
  assert.equal(board.includes("sendJson"), false);
  assert.equal(board.includes("fetch("), false);
  const used = new Set(viewFile.match(/v4\("([a-zA-Z0-9]+)"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of Array.from(used)) assert.ok(key in ROUND280_COPY.en, key);
  const named = viewFile.match(/"(bst|lir)[a-zA-Z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of named) assert.ok(key in ROUND280_COPY.en, key);
  const bill = salon.match(/v4\("(segSalon[a-zA-Z0-9]+)"\)/g)?.map((item) => item.slice(4, -2)) || [];
  for (const key of bill) assert.ok(key in ROUND280_COPY.en, key);
  console.log("crmv4 round280 tests passed");
}

main();
