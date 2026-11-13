/**
 * Sextant sights and office plates.
 * Run: TZ=UTC npx tsx tests/crmv4-round266.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND266_COPY } from "../src/lib/crmv4/copy-round266";
import {
  ROUND266_FEATURES,
  activeSextantMag,
  activeSextantAlt,
  activeLimb,
  activeMetal,
  activeSight,
  addSextant,
  addSextantView,
  briskSight,
  bulkSextantPin,
  busiestSextantPilot,
  sextantCsv,
  sextantMag,
  sextantTimeline,
  sextantAlt,
  limbBand,
  limbGap,
  limbOf,
  cycleSight,
  dropSextantView,
  fairSextantPilot,
  metalOf,
  houseMetal,
  idleSight,
  lateSight,
  leadingOffice,
  lengthenSextant,
  lowerSextant,
  moveSextantFocus,
  neighborSextantCount,
  overdueSight,
  peakLimb,
  sightOf,
  quietLimb,
  raiseSextant,
  readSextantViews,
  restingSight,
  shortenSextant,
  officeCap,
  officeEcho,
  officeHue,
  officeKnown,
  officeLane,
  officeLanesCsv,
  officeLeap,
  officeNotch,
  officeRowsCsv,
  officeSlash,
  officeStamp,
  officeState,
  officeStep,
  officeTail,
  officeTwin,
  officeWide,
  suggestSextantAlt,
  suggestLimb,
  suggestMetal,
} from "../src/lib/crmv4/round266";

function main() {
  assert.equal(ROUND266_FEATURES.length, 25);
  assert.equal(limbOf(" index "), "index");
  assert.equal(limbOf("paris"), "");
  assert.equal(sextantAlt("15"), 15);
  assert.equal(sextantAlt(30), 30);
  assert.equal(sextantAlt("45"), 45);
  assert.equal(sextantAlt("12"), null);
  assert.equal(sextantMag("1"), 1);
  assert.equal(sextantMag(3), 3);
  assert.equal(sextantMag("5"), 5);
  assert.equal(sextantMag("7"), 7);
  assert.equal(sextantMag("2"), null);
  assert.equal(sextantMag("4"), null);
  assert.equal(metalOf("brass"), "BRASS");
  assert.equal(metalOf("steel"), "STEEL");
  assert.equal(metalOf("gilt"), "GILT");
  assert.equal(metalOf("flax"), "");
  assert.equal(sightOf("rise"), "rise");
  assert.equal(sightOf("hold"), "hold");
  assert.equal(sightOf("set"), "set");
  assert.equal(sightOf("draw"), "");
  assert.equal(peakLimb("arc"), true);
  assert.equal(peakLimb("INDEX"), true);
  assert.equal(peakLimb("limb"), false);
  assert.equal(quietLimb("limb"), true);
  assert.equal(quietLimb("horizon"), true);
  assert.equal(quietLimb("arc"), false);
  assert.equal(limbBand("arc"), "early");
  assert.equal(limbBand("limb"), "early");
  assert.equal(limbBand("index"), "mid");
  assert.equal(limbBand("horizon"), "late");
  assert.equal(limbBand(""), "");
  assert.equal(limbGap("arc", "limb"), 1);
  assert.equal(limbGap("limb", "arc"), -1);
  assert.equal(limbGap("", "arc"), null);
  assert.equal(houseMetal("brass"), true);
  assert.equal(houseMetal("GILT"), true);
  assert.equal(houseMetal("steel"), false);
  assert.equal(activeLimb("peak"), "peak");
  assert.equal(activeLimb("arc"), "arc");
  assert.equal(activeLimb("paris"), "all");
  assert.equal(activeSextantAlt("30"), "30");
  assert.equal(activeSextantAlt("9"), "all");
  assert.equal(activeSight("hold", ["rise", "hold", "set"]), "hold");
  assert.equal(activeSight("gale", ["rise", "hold", "set"]), "all");
  assert.equal(activeSextantMag("3"), "3");
  assert.equal(activeSextantMag("2"), "all");
  assert.equal(activeMetal("steel"), "steel");
  assert.equal(activeMetal("mint"), "all");
  assert.equal(moveSextantFocus(0, 3, 1), 1);
  assert.equal(moveSextantFocus(0, 3, -1), 2);
  assert.equal(suggestMetal([]), "BRASS");
  assert.equal(suggestSextantAlt([], 4), 15);
  assert.equal(suggestSextantAlt([], 8), 30);
  assert.equal(suggestSextantAlt([], 16), 45);
  assert.equal(suggestLimb(4), "arc");
  assert.equal(suggestLimb(12), "index");
  assert.equal(fairSextantPilot([], "Nia, Sol"), "Nia");

  const first = addSextant([], {
    id: "a",
    title: "  North sight ",
    note: "",
    weaver: "Nia",
    frame: "arc",
    dye: "brass",
    shuttle: "rise",
    wait: 15,
    rank: 1,
    tags: "x x y",
  });
  assert.equal(first.length, 1);
  assert.equal(first[0].title, "North sight");
  assert.equal(first[0].note, "");
  assert.equal(first[0].dye, "BRASS");
  assert.equal(first[0].tags.join(""), "xy");
  assert.equal(first[0].audit, "save");
  assert.equal(overdueSight(first[0]), true);
  assert.equal(addSextant(first, { id: "a", title: "Other" }).length, 1);
  assert.equal(addSextant(first, { id: "b", title: "North sight" }).length, 1);
  assert.equal(addSextant(first, { id: "b", title: "   " }).length, 1);

  const pinned = bulkSextantPin(first, ["a"]);
  assert.equal(overdueSight(pinned[0]), false);
  assert.equal(fairSextantPilot(pinned, "Nia, Sol"), "Nia");
  const quiet = addSextant(pinned, { id: "q", title: "Limb rest", weaver: "Sol", frame: "limb", shuttle: "rise", rank: 1 });
  assert.equal(idleSight(quiet[0]), true);
  assert.equal(lateSight(quiet[0], "arc"), false);
  assert.equal(lateSight(quiet[0], "index"), false);
  const behind = addSextant([], { id: "z", title: "Limb late", frame: "limb", rank: 1 });
  assert.equal(lateSight(behind[0], "horizon"), true);
  assert.equal(lateSight({ ...behind[0], rank: 3 }, "horizon"), false);
  const rushed = addSextant([], { id: "r", title: "Arc spark", frame: "arc", shuttle: "hold", rank: 7 });
  assert.equal(briskSight(rushed[0]), true);
  const rested = addSextant([], { id: "s", title: "Horizon set", frame: "horizon", shuttle: "set", wait: 45 });
  assert.equal(restingSight(rested[0]), true);
  assert.equal(lengthenSextant(rested, "s")[0].wait, 45);
  assert.equal(lengthenSextant([{ ...rested[0], wait: null }], "s")[0].wait, 15);
  assert.equal(lengthenSextant(first, "a")[0].wait, 30);
  assert.equal(shortenSextant(first, "a")[0].wait, 15);
  assert.equal(shortenSextant([{ ...first[0], wait: null }], "a")[0].wait, 45);
  assert.equal(cycleSight(first, "a")[0].shuttle, "hold");
  assert.equal(raiseSextant(first, "a")[0].rank, 3);
  assert.equal(lowerSextant(first, "a")[0].rank, 1);
  assert.equal(lowerSextant([{ ...first[0], rank: 7 }], "a")[0].rank, 5);
  assert.equal(busiestSextantPilot(quiet), "Sol");
  assert.equal(neighborSextantCount(quiet) >= 0, true);
  assert.match(sextantCsv(first, "horizon"), /North sight/);
  assert.match(sextantTimeline(first).map((lane) => lane.rank).join(","), /1/);

  const metalBook = addSextant(addSextant([], { id: "y1", title: "Steel one", dye: "steel", frame: "limb" }), { id: "y2", title: "Steel two", dye: "steel", frame: "arc" });
  assert.equal(suggestMetal(metalBook), "STEEL");
  assert.equal(suggestSextantAlt(rested, 4), 45);

  const views = addSextantView([], { id: "v", name: "Peak", tray: "open", frame: "peak", wait: "15", dye: "brass", shuttle: "rise", rank: "1" });
  assert.equal(views[0].frame, "peak");
  assert.equal(dropSextantView(views, "v").length, 0);
  assert.equal(readSextantViews([{ id: "v", name: "Peak", tray: "nope" }])[0].tray, "open");

  assert.equal(officeState("HQ"), "set");
  assert.equal(officeLane("HQ"), "hall");
  assert.equal(officeStamp("HQ"), "HQ");
  assert.equal(officeHue("HQ"), "champagne");
  assert.equal(officeStep("HQ"), 2);
  assert.equal(officeLeap("HQ"), false);
  assert.equal(officeKnown("HQ"), true);
  assert.equal(officeTail("HQ"), false);
  assert.equal(officeLane("FLOOR"), "wing");
  assert.equal(officeStamp("FLOOR"), "FL");
  assert.equal(officeHue("FLOOR"), "graphite");
  assert.equal(officeTail("FLOOR"), false);
  assert.equal(officeKnown("floor"), true);
  assert.equal(officeLeap("FLOOR"), false);
  assert.equal(officeLane("DESK"), "bay");
  assert.equal(officeStamp("DESK"), "DE");
  assert.equal(officeHue("DESK"), "champagne");
  assert.equal(officeKnown("DESK"), false);
  assert.equal(officeLeap("DESK"), true);
  assert.equal(officeLeap("FLOORX"), false);
  assert.equal(officeNotch("PRE-SET"), true);
  assert.equal(officeLane("PRE-SET"), "yard");
  assert.equal(officeHue("PRE-SET"), "champagne");
  assert.equal(officeSlash("A/B"), true);
  assert.equal(officeLane("A/B"), "yard");
  assert.equal(officeWide("PRE_SET"), true);
  assert.equal(officeTwin("BOOK"), true);
  assert.equal(officeEcho("RADAR"), true);
  assert.equal(officeCap("Office"), true);
  assert.equal(officeCap("hq"), false);
  assert.equal(officeLane("hq"), "hall");
  assert.equal(officeState("12"), "clear");
  assert.equal(officeState(""), "clear");
  assert.equal(officeState({ office: "HQ", balance: 1 }), "");
  assert.equal(officeState({ title: "HQ" }), "");
  assert.equal(officeLane({ name: "FLOOR" }), "wing");

  const book = [
    { id: "1", label: "Ada", note: "HQ" },
    { id: "2", label: "Bea", note: "FLOOR" },
    { id: "3", label: "Cem", note: "DESK" },
  ];
  assert.equal(leadingOffice(book), "hall");
  assert.match(officeLanesCsv(book), /hall,1/);
  assert.match(officeRowsCsv(book, ["1"]), /HQ,HQ,hall,champagne/);
  assert.match(officeRowsCsv(book, ["1"]), /FLOOR,FL,wing,graphite/);
  assert.match(officeRowsCsv(book, ["1"]), /DESK,DE,bay,champagne/);

  const keys = Object.keys(ROUND266_COPY.en);
  assert.ok(keys.length >= 150);
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND266_COPY[locale]).sort(), keys.slice().sort());
    for (const key of keys) {
      assert.equal(typeof ROUND266_COPY[locale][key as keyof typeof ROUND266_COPY.en], "string");
      assert.ok(ROUND266_COPY[locale][key as keyof typeof ROUND266_COPY.en].length > 0);
    }
  }
  assert.equal(crmv4Text("tr", "sxtTitle"), ROUND266_COPY.tr.sxtTitle);
  assert.equal(crmv4Text("de", "ofcTitle"), ROUND266_COPY.de.ofcTitle);
  assert.equal(crmv4Text("ru", "sxtSub"), ROUND266_COPY.ru.sxtSub);
  assert.equal(crmv4Text("ar", "ofcSub"), ROUND266_COPY.ar.ofcSub);
  assert.equal(crmv4Text("en", "sxtLogo"), "7FX");
  assert.equal(crmv4Text("en", "sxtTitle"), "Sextant sights");
  assert.notEqual(ROUND266_COPY.tr.sxtTitle, ROUND266_COPY.en.sxtTitle);
  assert.equal(crmv4Text("en", "lomTitle"), "Loom spools");

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-sextant/);
  assert.match(css, /\.c4-office-index/);
  assert.match(css, /\.c4-sextant-ledger|\.c4-sextant-board/);
  assert.match(css, /\.c4-office-bar/);
  assert.match(css, /\.c4-ops-sextant/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round266.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /office:/);
  assert.match(viewFile, /sextantCsv/);
  assert.match(viewFile, /officeRowsCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "x"/);
  assert.match(viewFile, /event\.key === "j"/);
  assert.match(viewFile, /event\.key === "r"/);
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
  assert.match(viewFile, /\/api\/admin\/desks\?take=24/);
  assert.match(viewFile, /data-cards/);
  assert.match(viewFile, /data-plates/);
  assert.match(viewFile, /data-desks/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestMetal/);
  assert.match(viewFile, /c4-office-search/);
  assert.match(viewFile, /sextantTimeline/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "sxt"/);
  assert.match(app, /view === "ofc"/);
  const ops = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/views/Ops.tsx"), "utf8");
  assert.match(ops, /c4-ops-sextant/);
  assert.match(ops, /sxtOpsLead/);
  assert.match(ops, /roomHit/);
  const used = new Set(viewFile.match(/v4\("([a-zA-Z]+)"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of Array.from(used)) assert.ok(key in ROUND266_COPY.en, key);
  const audit = viewFile.match(/"(sxtAudit[a-zA-Z]+)"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of audit) assert.ok(key in ROUND266_COPY.en, key);
  const opsUsed = new Set(ops.match(/v4\("([a-zA-Z]+)"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of Array.from(opsUsed)) assert.ok(key in ROUND266_COPY.en, key);
  console.log("crmv4 round266 tests passed");
}

main();
