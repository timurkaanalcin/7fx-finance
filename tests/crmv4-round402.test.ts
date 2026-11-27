/**
 * Rinceau courses, ovolo grant plates, the ivory daily-close plinth, and the graphite approval dart.
 * Run: TZ=UTC npx tsx tests/crmv4-round402.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND402_COPY } from "../src/lib/crmv4/copy-round402";
import { ROUND401_FEATURES } from "../src/lib/crmv4/round401";
import {
  ROUND402_FEATURES,
  activeBed,
  activeDepth,
  activeHour,
  activeProfile,
  addRinceau,
  addRinceauView,
  briskRinceau,
  depthCount,
  dropRinceauView,
  fairHand,
  fullDepth,
  graphiteQuiet,
  idleRinceau,
  lateRinceau,
  leadingOvolo,
  leadingOvoloHue,
  midDepth,
  moveRinceauFocus,
  overdueRinceau,
  ovoloBlank,
  ovoloCopy,
  ovoloDark,
  ovoloDigit,
  ovoloDim,
  ovoloEven,
  ovoloFade,
  ovoloFar,
  ovoloHue,
  ovoloLanesCsv,
  ovoloLength,
  ovoloLetter,
  ovoloLit,
  ovoloNear,
  ovoloOpen,
  ovoloRowsCsv,
  ovoloSlice,
  ovoloUpper,
  profileBand,
  profileCool,
  profileGap,
  profilePoint,
  profileWarm,
  readRinceauViews,
  reminderRinceauList,
  restingRinceau,
  rinceauBed,
  rinceauHour,
  rinceauTimeline,
  suggestProfile,
  suggestRinceauBed,
  suggestRinceauHour,
  type OvoloRow,
  type Rinceau,
} from "../src/lib/crmv4/round402";

function course(partial: Partial<Rinceau> & { id: string; title: string }): Rinceau {
  return {
    note: "",
    hand: "",
    profile: "",
    hour: null,
    bed: "",
    depth: 4,
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
  assert.equal(ROUND402_FEATURES.length, 25);
  assert.equal(new Set(ROUND402_FEATURES).size, 25);
  for (const feature of ROUND402_FEATURES) assert.equal((ROUND401_FEATURES as readonly string[]).includes(feature), false, feature);
  const libDir = path.join(__dirname, "../src/lib/crmv4");
  for (const feature of ROUND402_FEATURES) {
    const needle = `"${feature}"`;
    for (const file of fs.readdirSync(libDir)) {
      if (!file.endsWith(".ts") || file === "round402.ts") continue;
      const body = fs.readFileSync(path.join(libDir, file), "utf8");
      assert.equal(body.includes(needle), false, `${feature} in ${file}`);
    }
  }

  assert.equal(profilePoint(" rinceau "), "rinceau");
  assert.equal(profilePoint("jasper"), "");
  assert.equal(rinceauHour("4"), 4);
  assert.equal(rinceauHour(8), 8);
  assert.equal(rinceauHour(11), 11);
  assert.equal(rinceauHour(16), 16);
  assert.equal(rinceauHour("3"), null);
  assert.equal(rinceauHour("12"), null);
  assert.equal(depthCount("4"), 4);
  assert.equal(depthCount(8), 8);
  assert.equal(depthCount("11"), 11);
  assert.equal(depthCount("3"), null);
  assert.equal(depthCount("9"), null);
  assert.equal(rinceauBed("ivory"), "IVORY");
  assert.equal(rinceauBed("graphite"), "GRAPHITE");
  assert.equal(rinceauBed("gilt"), "GILT");
  assert.equal(rinceauBed("gold"), "");
  assert.equal(profileWarm("rinceau"), true);
  assert.equal(profileWarm("ACANTHUS"), true);
  assert.equal(profileWarm("waterleaf"), false);
  assert.equal(profileCool("waterleaf"), true);
  assert.equal(profileCool("rosette"), true);
  assert.equal(profileCool("rinceau"), false);
  assert.equal(profileBand("rinceau"), "first");
  assert.equal(profileBand("acanthus"), "second");
  assert.equal(profileBand("waterleaf"), "third");
  assert.equal(profileBand("rosette"), "fourth");
  assert.equal(profileGap("rinceau", "rosette"), 3);
  assert.equal(profileGap("rosette", "rinceau"), -3);
  assert.equal(profileGap("jasper", "rinceau"), null);
  assert.equal(graphiteQuiet("graphite"), true);
  assert.equal(graphiteQuiet("GILT"), false);
  assert.equal(midDepth(8), true);
  assert.equal(midDepth(4), false);
  assert.equal(fullDepth(11), true);
  assert.equal(fullDepth(8), false);
  assert.equal(activeProfile("warm"), "warm");
  assert.equal(activeProfile("cool"), "cool");
  assert.equal(activeProfile("rosette"), "rosette");
  assert.equal(activeProfile("nope"), "all");
  assert.equal(activeHour("16"), "16");
  assert.equal(activeHour("3"), "all");
  assert.equal(activeDepth("11"), "11");
  assert.equal(activeDepth("1"), "all");
  assert.equal(activeBed("ivory", ["IVORY", "GRAPHITE"]), "IVORY");
  assert.equal(activeBed("gilt", ["IVORY"]), "all");
  assert.equal(moveRinceauFocus(0, 4, -1), 3);
  assert.equal(suggestProfile(2), "rinceau");
  assert.equal(suggestProfile(9), "acanthus");
  assert.equal(suggestProfile(13), "waterleaf");
  assert.equal(suggestProfile(18), "rosette");
  assert.equal(suggestRinceauHour([], 3), 4);
  assert.equal(suggestRinceauHour([], 9), 8);
  assert.equal(suggestRinceauHour([], 14), 11);
  assert.equal(suggestRinceauHour([], 20), 16);
  const saved = [
    course({ id: "a", title: "Ada", hour: 16 }),
    course({ id: "b", title: "Bea", hour: 8 }),
    course({ id: "c", title: "Cid", hour: 11 }),
  ];
  assert.equal(suggestRinceauHour(saved, 20), 4);
  assert.equal(suggestRinceauBed([course({ id: "g", title: "Gilt", bed: "GILT" })]), "IVORY");
  assert.equal(fairHand([course({ id: "h", title: "Held", hand: "Nia" })], "Nia, Omar"), "Omar");

  const late = course({ id: "l", title: "Late", profile: "rinceau" });
  const overdue = course({ id: "o", title: "Over", profile: "rosette", depth: 4 });
  const idle = course({ id: "i", title: "Idle", hour: 4, depth: 4, bed: "" });
  const brisk = course({ id: "b2", title: "Brisk", bed: "GRAPHITE", hour: 16, depth: 11 });
  const resting = course({ id: "r", title: "Rest", profile: "waterleaf", bed: "IVORY", hour: 8 });
  assert.equal(lateRinceau(late, "rosette"), true);
  assert.equal(lateRinceau(late, "rinceau"), false);
  assert.equal(overdueRinceau(overdue), true);
  assert.equal(overdueRinceau({ ...overdue, raised: true }), false);
  assert.equal(idleRinceau(idle), true);
  assert.equal(briskRinceau(brisk), true);
  assert.equal(restingRinceau(resting), true);
  assert.deepEqual(reminderRinceauList([overdue, late]), ["Over"]);
  const added = addRinceau([], { title: "New course", profile: "acanthus", hour: 8, depth: 8, bed: "ivory", tags: "r w x" });
  assert.equal(added.length, 1);
  assert.equal(added[0].profile, "acanthus");
  assert.equal(added[0].hour, 8);
  assert.equal(added[0].depth, 8);
  assert.equal(added[0].bed, "IVORY");
  assert.deepEqual(added[0].tags, ["r", "w"]);
  assert.equal(addRinceau(added, { title: "New course" }).length, 1);
  const view = { id: "v", name: "Warm", rack: "base" as const, query: "", hand: "", bed: "", profile: "warm", hour: "", depth: "" };
  assert.equal(addRinceauView([], view).length, 1);
  assert.equal(dropRinceauView(addRinceauView([], view), "v").length, 0);
  assert.equal(readRinceauViews([{ ...view, name: "" }]).length, 0);
  const line = rinceauTimeline([course({ id: "t", title: "Tide", hour: 8 })]);
  assert.equal(line[0].hour, 8);
  assert.deepEqual(line[0].titles, ["Tide"]);

  assert.equal(ovoloLit("ALLOW"), true);
  assert.equal(ovoloLit(true), true);
  assert.equal(ovoloLit(false), false);
  assert.equal(ovoloNear("ABC"), true);
  assert.equal(ovoloNear("AB"), false);
  assert.equal(ovoloFar("A"), true);
  assert.equal(ovoloFar("ABC"), false);
  assert.equal(ovoloFade("A".repeat(10)), true);
  assert.equal(ovoloFade("ALLOW"), false);
  assert.equal(ovoloDim("HOLD"), true);
  assert.equal(ovoloDim("WAIT"), true);
  assert.equal(ovoloDark("SHUT"), true);
  assert.equal(ovoloDark(false), true);
  assert.equal(ovoloBlank("NONE"), true);
  assert.equal(ovoloOpen(""), true);
  assert.equal(ovoloHue("ALLOW"), "gilt");
  assert.equal(ovoloHue("SHUT"), "ash");
  assert.equal(ovoloHue("HOLD"), "pearl");
  assert.equal(ovoloLength("OPEN"), 4);
  assert.equal(ovoloEven("OPEN"), true);
  assert.equal(ovoloDigit("12night"), true);
  assert.equal(ovoloLetter("ALLOW"), true);
  assert.equal(ovoloUpper("ISTANBUL"), true);
  assert.equal(ovoloUpper("OPEN"), false);
  assert.equal(ovoloLit("ABCDEFGH"), false);
  assert.equal(ovoloDim("ABCDEFGH"), true);
  assert.equal(ovoloCopy("ALLOW"), "ALLOW");
  assert.equal(ovoloLit({ balance: 1 }), false);
  assert.equal(ovoloLit({ canAdjustBalance: "ALLOW" }), true);
  assert.equal(ovoloLit(ovoloSlice({ canAdjustBalance: true, balance: 9 })), true);
  const rows: OvoloRow[] = [
    { id: "1", label: "Ada", code: "ALLOW" },
    { id: "2", label: "Bea", code: "HOLD" },
  ];
  assert.equal(leadingOvolo(rows), "allow");
  assert.equal(leadingOvoloHue(rows), "gilt");
  assert.match(ovoloLanesCsv(rows), /allow,1/);
  assert.match(ovoloRowsCsv(rows, ["1"]), /Ada,ALLOW/);
  assert.match(ovoloRowsCsv(rows, ["1"]), /,1$/m);
  assert.match(ovoloRowsCsv(rows, ["1"]), /^name,mark,lane,hue,reviewed/m);

  assert.equal(crmv4Text("en", "rncTitle"), ROUND402_COPY.en.rncTitle);
  assert.equal(crmv4Text("tr", "ovlTitle"), ROUND402_COPY.tr.ovlTitle);
  assert.equal(crmv4Text("de", "rncHint"), ROUND402_COPY.de.rncHint);
  assert.equal(crmv4Text("ru", "closePlinthKicker"), ROUND402_COPY.ru.closePlinthKicker);
  assert.equal(crmv4Text("ar", "approvalDartLead"), ROUND402_COPY.ar.approvalDartLead);
  const keys = Object.keys(ROUND402_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND402_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-rinceau/);
  assert.match(css, /\.c4-ovolo/);
  assert.match(css, /\.c4-rinceau-column/);
  assert.match(css, /\.c4-ovolo-column/);
  assert.match(css, /\.c4-close-plinth/);
  assert.match(css, /\.c4-approval-dart/);
  assert.match(css, /\.c4-close-plinth-mast/);
  assert.match(css, /\.c4-approval-dart-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round402.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /ovoloSlice/);
  assert.match(viewFile, /rinceauCsv/);
  assert.match(viewFile, /ovoloRowsCsv/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "x"/);
  assert.match(viewFile, /event\.key === "a"/);
  assert.match(viewFile, /event\.key === "c"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=24&meta=0/);
  assert.match(viewFile, /data-rinceau/);
  assert.match(viewFile, /data-ovolo/);
  assert.match(viewFile, /data-desk/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestRinceauBed/);
  assert.match(viewFile, /c4-ovolo-search/);
  assert.match(viewFile, /rinceauTimeline/);
  assert.match(viewFile, /c4-rinceau-notices/);
  assert.match(viewFile, /from "@\/lib\/crmv4\/round402"/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "rnc"/);
  assert.match(app, /view === "ovl"/);
  const panels = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round11.tsx"), "utf8");
  assert.match(panels, /c4-close-plinth/);
  assert.match(panels, /c4-close-plinth-mast/);
  assert.match(panels, /data-logo="mono"/);
  assert.match(panels, /closePlinthKicker/);
  assert.match(panels, /closePlinthLead/);
  assert.match(panels, /data-close-plinth/);
  assert.match(panels, /c4-approval-dart/);
  assert.match(panels, /c4-approval-dart-mast/);
  assert.match(panels, /approvalDartKicker/);
  assert.match(panels, /approvalDartLead/);
  assert.match(panels, /data-approval-dart/);
  const namedKeys = `${viewFile}\n${panels}`.match(/"(rnc|ovl|closePlinth|approvalDart)[A-Z][A-Za-z0-9]*"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND402_COPY.en[key as keyof typeof ROUND402_COPY.en], "string", key);
  console.log("crmv4 round402 tests passed");
}

main();
