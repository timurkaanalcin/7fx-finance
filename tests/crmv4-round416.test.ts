/**
 * Futtock courses, coaming retention plates, the ivory note carling, and the graphite audit hawse.
 * Run: TZ=UTC npx tsx tests/crmv4-round416.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND416_COPY } from "../src/lib/crmv4/copy-round416";
import { ROUND415_FEATURES } from "../src/lib/crmv4/round415";
import {
  ROUND416_FEATURES,
  activeBed,
  activeDepth,
  activeHour,
  activeProfile,
  addFuttock,
  addFuttockView,
  briskFuttock,
  depthCount,
  dropFuttockView,
  fairHand,
  fullDepth,
  idleFuttock,
  ivoryQuiet,
  lateFuttock,
  leadingCoaming,
  leadingCoamingHue,
  midDepth,
  moveFuttockFocus,
  overdueFuttock,
  coamingBlank,
  coamingCopy,
  coamingDark,
  coamingDigit,
  coamingDim,
  coamingEven,
  coamingFade,
  coamingFar,
  coamingHue,
  coamingLanesCsv,
  coamingLength,
  coamingLetter,
  coamingLit,
  coamingNear,
  coamingOpen,
  coamingRowsCsv,
  coamingSlice,
  coamingUpper,
  profileBand,
  profileCool,
  profileGap,
  profilePoint,
  profileWarm,
  readFuttockViews,
  reminderFuttockList,
  restingFuttock,
  futtockBed,
  futtockHour,
  futtockTimeline,
  suggestProfile,
  suggestFuttockBed,
  suggestFuttockHour,
  type Futtock,
  type CoamingRow,
} from "../src/lib/crmv4/round416";

function course(partial: Partial<Futtock> & { id: string; title: string }): Futtock {
  return {
    note: "",
    hand: "",
    profile: "",
    hour: null,
    bed: "",
    depth: 3,
    tags: [],
    raised: false,
    pressed: false,
    shelved: false,
    pinned: false,
    audit: "",
    ...partial,
  };
}

function main() {
  assert.equal(ROUND416_FEATURES.length, 25);
  assert.equal(new Set(ROUND416_FEATURES).size, 25);
  for (const feature of ROUND416_FEATURES) assert.equal((ROUND415_FEATURES as readonly string[]).includes(feature), false, feature);
  const libDir = path.join(__dirname, "../src/lib/crmv4");
  for (const feature of ROUND416_FEATURES) {
    const needle = `"${feature}"`;
    for (const file of fs.readdirSync(libDir)) {
      if (!file.endsWith(".ts") || file === "round416.ts") continue;
      const body = fs.readFileSync(path.join(libDir, file), "utf8");
      assert.equal(body.includes(needle), false, `${feature} in ${file}`);
    }
  }

  assert.equal(profilePoint(" futtock "), "futtock");
  assert.equal(profilePoint("jasper"), "");
  assert.equal(futtockHour("3"), 3);
  assert.equal(futtockHour(6), 6);
  assert.equal(futtockHour(12), 12);
  assert.equal(futtockHour(24), 24);
  assert.equal(futtockHour("1"), null);
  assert.equal(futtockHour("2"), null);
  assert.equal(depthCount("1"), 1);
  assert.equal(depthCount(3), 3);
  assert.equal(depthCount("9"), 9);
  assert.equal(depthCount("2"), null);
  assert.equal(depthCount("4"), null);
  assert.equal(futtockBed("ivory"), "IVORY");
  assert.equal(futtockBed("graphite"), "GRAPHITE");
  assert.equal(futtockBed("gilt"), "GILT");
  assert.equal(futtockBed("gold"), "");
  assert.equal(profileWarm("futtock"), true);
  assert.equal(profileWarm("TOPTIMBER"), true);
  assert.equal(profileWarm("knighthead"), false);
  assert.equal(profileCool("knighthead"), true);
  assert.equal(profileCool("cathead"), true);
  assert.equal(profileCool("futtock"), false);
  assert.equal(profileBand("futtock"), "first");
  assert.equal(profileBand("toptimber"), "second");
  assert.equal(profileBand("knighthead"), "third");
  assert.equal(profileBand("cathead"), "fourth");
  assert.equal(profileGap("futtock", "cathead"), 3);
  assert.equal(profileGap("cathead", "futtock"), -3);
  assert.equal(profileGap("jasper", "futtock"), null);
  assert.equal(ivoryQuiet("ivory"), true);
  assert.equal(ivoryQuiet("GRAPHITE"), false);
  assert.equal(midDepth(3), true);
  assert.equal(midDepth(1), false);
  assert.equal(fullDepth(9), true);
  assert.equal(fullDepth(3), false);
  assert.equal(activeProfile("warm"), "warm");
  assert.equal(activeProfile("cool"), "cool");
  assert.equal(activeProfile("cathead"), "cathead");
  assert.equal(activeProfile("nope"), "all");
  assert.equal(activeHour("12"), "12");
  assert.equal(activeHour("1"), "all");
  assert.equal(activeDepth("9"), "9");
  assert.equal(activeDepth("2"), "all");
  assert.equal(activeBed("ivory", ["IVORY", "GRAPHITE"]), "IVORY");
  assert.equal(activeBed("gilt", ["IVORY"]), "all");
  assert.equal(moveFuttockFocus(0, 4, -1), 3);
  assert.equal(suggestProfile(1), "futtock");
  assert.equal(suggestProfile(4), "toptimber");
  assert.equal(suggestProfile(8), "knighthead");
  assert.equal(suggestProfile(14), "cathead");
  assert.equal(suggestFuttockHour([], 1), 3);
  assert.equal(suggestFuttockHour([], 4), 6);
  assert.equal(suggestFuttockHour([], 8), 12);
  assert.equal(suggestFuttockHour([], 14), 24);
  const saved = [
    course({ id: "a", title: "Ada", hour: 24 }),
    course({ id: "b", title: "Bea", hour: 6 }),
    course({ id: "c", title: "Cid", hour: 12 }),
  ];
  assert.equal(suggestFuttockHour(saved, 24), 3);
  assert.equal(suggestFuttockBed([course({ id: "g", title: "Gilt", bed: "GILT" })]), "IVORY");
  assert.equal(fairHand([course({ id: "h", title: "Held", hand: "Nia" })], "Nia, Omar"), "Omar");

  const late = course({ id: "l", title: "Late", profile: "futtock" });
  const overdue = course({ id: "o", title: "Over", profile: "cathead", depth: 1 });
  const idle = course({ id: "i", title: "Idle", hour: 3, depth: 1, bed: "" });
  const brisk = course({ id: "b2", title: "Brisk", bed: "IVORY", hour: 24, depth: 9 });
  const resting = course({ id: "r", title: "Rest", profile: "knighthead", bed: "GRAPHITE", hour: 6 });
  assert.equal(lateFuttock(late, "cathead"), true);
  assert.equal(lateFuttock(late, "futtock"), false);
  assert.equal(overdueFuttock(overdue), true);
  assert.equal(overdueFuttock({ ...overdue, raised: true }), false);
  assert.equal(idleFuttock(idle), true);
  assert.equal(briskFuttock(brisk), true);
  assert.equal(restingFuttock(resting), true);
  assert.deepEqual(reminderFuttockList([overdue, late]), ["Over"]);
  const added = addFuttock([], { title: "New course", profile: "toptimber", hour: 6, depth: 3, bed: "ivory", tags: "f t z" });
  assert.equal(added.length, 1);
  assert.equal(added[0].profile, "toptimber");
  assert.equal(added[0].hour, 6);
  assert.equal(added[0].depth, 3);
  assert.equal(added[0].bed, "IVORY");
  assert.deepEqual(added[0].tags, ["f", "t"]);
  assert.equal(addFuttock(added, { title: "New course" }).length, 1);
  const view = { id: "v", name: "Warm", rack: "base" as const, query: "", hand: "", bed: "", profile: "warm", hour: "", depth: "" };
  assert.equal(addFuttockView([], view).length, 1);
  assert.equal(dropFuttockView(addFuttockView([], view), "v").length, 0);
  assert.equal(readFuttockViews([{ ...view, name: "" }]).length, 0);
  const line = futtockTimeline([course({ id: "t", title: "Tide", hour: 6 })]);
  assert.equal(line[0].hour, 6);
  assert.deepEqual(line[0].titles, ["Tide"]);

  assert.equal(coamingLit("ACTIVE"), true);
  assert.equal(coamingLit("KEPT"), true);
  assert.equal(coamingLit("warm"), true);
  assert.equal(coamingLit("HELD"), true);
  assert.equal(coamingLit("YES"), true);
  assert.equal(coamingHue("ACTIVE"), "gilt");
  assert.equal(coamingFar("A"), true);
  assert.equal(coamingLit(true), true);
  assert.equal(coamingLit(false), false);
  assert.equal(coamingLit("RET-A"), true);
  assert.equal(coamingNear("RET-AB"), true);
  assert.equal(coamingNear("ABCDE"), true);
  assert.equal(coamingNear("AB"), false);
  assert.equal(coamingFar("A"), true);
  assert.equal(coamingFar("AB"), true);
  assert.equal(coamingFar("ABC"), false);
  assert.equal(coamingFade("A".repeat(12)), true);
  assert.equal(coamingFade("RET-" + "A".repeat(8)), true);
  assert.equal(coamingFade("A".repeat(8)), false);
  assert.equal(coamingDim("WAIT"), true);
  assert.equal(coamingDim("COOL"), true);
  assert.equal(coamingDim("ABC"), true);
  assert.equal(coamingDark("OFF"), true);
  assert.equal(coamingDark(false), false);
  assert.equal(coamingDark("LOST"), true);
  assert.equal(coamingBlank("UNSET"), true);
  assert.equal(coamingBlank("NONE"), true);
  assert.equal(coamingOpen(""), true);
  assert.equal(coamingHue("OFF"), "ash");
  assert.equal(coamingHue("WAIT"), "pearl");
  assert.equal(coamingLength("ABCDE"), 5);
  assert.equal(coamingEven("AB"), true);
  assert.equal(coamingDigit("12night"), true);
  assert.equal(coamingLetter("ACTIVE"), true);
  assert.equal(coamingUpper("ISTANBUL"), true);
  assert.equal(coamingUpper("VIP"), false);
  assert.equal(coamingLit("ABCDEFGH"), false);
  assert.equal(coamingDim("ABCDEFGH"), true);
  assert.equal(coamingCopy("ACTIVE"), "ACTIVE");
  assert.equal(coamingLit({ balance: 1 }), false);
  assert.equal(coamingLit({ retentionStatus: "ACTIVE" }), true);
  assert.equal(coamingLit(coamingSlice({ retentionStatus: true, balance: 9 })), true);
  const rows: CoamingRow[] = [
    { id: "1", label: "Ada", code: "ACTIVE" },
    { id: "2", label: "Bea", code: "PENDING" },
  ];
  assert.equal(leadingCoaming(rows), "live");
  assert.equal(leadingCoamingHue(rows), "gilt");
  assert.match(coamingLanesCsv(rows), /live,1/);
  assert.match(coamingRowsCsv(rows, ["1"]), /Ada,ACTIVE/);
  assert.match(coamingRowsCsv(rows, ["1"]), /,1$/m);
  assert.match(coamingRowsCsv(rows, ["1"]), /^name,retention,lane,hue,reviewed/m);

  assert.equal(crmv4Text("en", "ftkTitle"), ROUND416_COPY.en.ftkTitle);
  assert.equal(crmv4Text("tr", "cmgTitle"), ROUND416_COPY.tr.cmgTitle);
  assert.equal(crmv4Text("de", "ftkHint"), ROUND416_COPY.de.ftkHint);
  assert.equal(crmv4Text("ru", "nclCarlingKicker"), ROUND416_COPY.ru.nclCarlingKicker);
  assert.equal(crmv4Text("ar", "ahwHawseLead"), ROUND416_COPY.ar.ahwHawseLead);
  const keys = Object.keys(ROUND416_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND416_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-ftk416/);
  assert.match(css, /\.c4-cmg416/);
  assert.match(css, /\.c4-ftk416-column/);
  assert.match(css, /\.c4-cmg416-column/);
  assert.match(css, /\.c4-note-carling/);
  assert.match(css, /\.c4-audit-hawse/);
  assert.match(css, /\.c4-note-carling-mast/);
  assert.match(css, /\.c4-audit-hawse-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round416.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.equal(viewFile.includes("totpSecret"), false);
  assert.match(viewFile, /coamingSlice/);
  assert.match(viewFile, /futtockCsv/);
  assert.match(viewFile, /coamingRowsCsv/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "x"/);
  assert.match(viewFile, /event\.key === "a"/);
  assert.match(viewFile, /event\.key === "c"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=24&meta=0/);
  assert.match(viewFile, /data-ftk416/);
  assert.match(viewFile, /data-cmg416/);
  assert.match(viewFile, /data-retention/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestFuttockBed/);
  assert.match(viewFile, /c4-cmg416-search/);
  assert.match(viewFile, /futtockTimeline/);
  assert.match(viewFile, /c4-ftk416-notices/);
  assert.match(viewFile, /from "@\/lib\/crmv4\/round416"/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "ftk"/);
  assert.match(app, /view === "cmg"/);
  const notes = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round9.tsx"), "utf8");
  const audit = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round10.tsx"), "utf8");
  assert.match(notes, /c4-note-carling/);
  assert.match(notes, /c4-note-carling-mast/);
  assert.match(notes, /data-logo="mono"/);
  assert.match(notes, /nclCarlingKicker/);
  assert.match(notes, /nclCarlingLead/);
  assert.match(notes, /data-note-carling/);
  assert.match(audit, /c4-audit-hawse/);
  assert.match(audit, /c4-audit-hawse-mast/);
  assert.match(audit, /ahwHawseKicker/);
  assert.match(audit, /ahwHawseLead/);
  assert.match(audit, /data-audit-hawse/);
  const namedKeys = `${viewFile}\n${notes}\n${audit}`.match(/"(ftk|cmg|nclCarling|ahwHawse)[A-Z][A-Za-z0-9]*"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND416_COPY.en[key as keyof typeof ROUND416_COPY.en], "string", key);
  console.log("crmv4 round416 tests passed");
}

main();
