/**
 * Mullion courses, transom device plates, the ivory handoff rebate, and the graphite remind cusp.
 * Run: TZ=UTC npx tsx tests/crmv4-round406.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND406_COPY } from "../src/lib/crmv4/copy-round406";
import { ROUND405_FEATURES } from "../src/lib/crmv4/round405";
import {
  ROUND406_FEATURES,
  activeBed,
  activeDepth,
  activeHour,
  activeProfile,
  addMullion,
  addMullionView,
  briskMullion,
  depthCount,
  dropMullionView,
  fairHand,
  fullDepth,
  idleMullion,
  graphiteQuiet,
  lateMullion,
  leadingTransom,
  leadingTransomHue,
  midDepth,
  moveMullionFocus,
  overdueMullion,
  transomBlank,
  transomCopy,
  transomDark,
  transomDigit,
  transomDim,
  transomEven,
  transomFade,
  transomFar,
  transomHue,
  transomLanesCsv,
  transomLength,
  transomLetter,
  transomLit,
  transomNear,
  transomOpen,
  transomRowsCsv,
  transomSlice,
  transomUpper,
  profileBand,
  profileCool,
  profileGap,
  profilePoint,
  profileWarm,
  readMullionViews,
  reminderMullionList,
  restingMullion,
  mullionBed,
  mullionHour,
  mullionTimeline,
  suggestProfile,
  suggestMullionBed,
  suggestMullionHour,
  type Mullion,
  type TransomRow,
} from "../src/lib/crmv4/round406";

function course(partial: Partial<Mullion> & { id: string; title: string }): Mullion {
  return {
    note: "",
    hand: "",
    profile: "",
    hour: null,
    bed: "",
    depth: 2,
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
  assert.equal(ROUND406_FEATURES.length, 25);
  assert.equal(new Set(ROUND406_FEATURES).size, 25);
  for (const feature of ROUND406_FEATURES) assert.equal((ROUND405_FEATURES as readonly string[]).includes(feature), false, feature);
  const libDir = path.join(__dirname, "../src/lib/crmv4");
  for (const feature of ROUND406_FEATURES) {
    const needle = `"${feature}"`;
    for (const file of fs.readdirSync(libDir)) {
      if (!file.endsWith(".ts") || file === "round406.ts") continue;
      const body = fs.readFileSync(path.join(libDir, file), "utf8");
      assert.equal(body.includes(needle), false, `${feature} in ${file}`);
    }
  }

  assert.equal(profilePoint(" mullion "), "mullion");
  assert.equal(profilePoint("jasper"), "");
  assert.equal(mullionHour("2"), 2);
  assert.equal(mullionHour(4), 4);
  assert.equal(mullionHour(8), 8);
  assert.equal(mullionHour(16), 16);
  assert.equal(mullionHour("3"), null);
  assert.equal(mullionHour("6"), null);
  assert.equal(depthCount("2"), 2);
  assert.equal(depthCount(4), 4);
  assert.equal(depthCount("8"), 8);
  assert.equal(depthCount("3"), null);
  assert.equal(depthCount("6"), null);
  assert.equal(mullionBed("ivory"), "IVORY");
  assert.equal(mullionBed("graphite"), "GRAPHITE");
  assert.equal(mullionBed("gilt"), "GILT");
  assert.equal(mullionBed("gold"), "");
  assert.equal(profileWarm("mullion"), true);
  assert.equal(profileWarm("JAMB"), true);
  assert.equal(profileWarm("lintel"), false);
  assert.equal(profileCool("lintel"), true);
  assert.equal(profileCool("sill"), true);
  assert.equal(profileCool("mullion"), false);
  assert.equal(profileBand("mullion"), "first");
  assert.equal(profileBand("jamb"), "second");
  assert.equal(profileBand("lintel"), "third");
  assert.equal(profileBand("sill"), "fourth");
  assert.equal(profileGap("mullion", "sill"), 3);
  assert.equal(profileGap("sill", "mullion"), -3);
  assert.equal(profileGap("jasper", "mullion"), null);
  assert.equal(graphiteQuiet("graphite"), true);
  assert.equal(graphiteQuiet("IVORY"), false);
  assert.equal(midDepth(4), true);
  assert.equal(midDepth(2), false);
  assert.equal(fullDepth(8), true);
  assert.equal(fullDepth(4), false);
  assert.equal(activeProfile("warm"), "warm");
  assert.equal(activeProfile("cool"), "cool");
  assert.equal(activeProfile("sill"), "sill");
  assert.equal(activeProfile("nope"), "all");
  assert.equal(activeHour("16"), "16");
  assert.equal(activeHour("3"), "all");
  assert.equal(activeDepth("8"), "8");
  assert.equal(activeDepth("1"), "all");
  assert.equal(activeBed("ivory", ["IVORY", "GRAPHITE"]), "IVORY");
  assert.equal(activeBed("gilt", ["IVORY"]), "all");
  assert.equal(moveMullionFocus(0, 4, -1), 3);
  assert.equal(suggestProfile(2), "mullion");
  assert.equal(suggestProfile(7), "jamb");
  assert.equal(suggestProfile(10), "lintel");
  assert.equal(suggestProfile(18), "sill");
  assert.equal(suggestMullionHour([], 2), 2);
  assert.equal(suggestMullionHour([], 7), 4);
  assert.equal(suggestMullionHour([], 10), 8);
  assert.equal(suggestMullionHour([], 18), 16);
  const saved = [
    course({ id: "a", title: "Ada", hour: 16 }),
    course({ id: "b", title: "Bea", hour: 4 }),
    course({ id: "c", title: "Cid", hour: 8 }),
  ];
  assert.equal(suggestMullionHour(saved, 20), 2);
  assert.equal(suggestMullionBed([course({ id: "g", title: "Gilt", bed: "GILT" })]), "GRAPHITE");
  assert.equal(fairHand([course({ id: "h", title: "Held", hand: "Nia" })], "Nia, Omar"), "Omar");

  const late = course({ id: "l", title: "Late", profile: "mullion" });
  const overdue = course({ id: "o", title: "Over", profile: "sill", depth: 2 });
  const idle = course({ id: "i", title: "Idle", hour: 2, depth: 2, bed: "" });
  const brisk = course({ id: "b2", title: "Brisk", bed: "GRAPHITE", hour: 16, depth: 8 });
  const resting = course({ id: "r", title: "Rest", profile: "lintel", bed: "IVORY", hour: 4 });
  assert.equal(lateMullion(late, "sill"), true);
  assert.equal(lateMullion(late, "mullion"), false);
  assert.equal(overdueMullion(overdue), true);
  assert.equal(overdueMullion({ ...overdue, raised: true }), false);
  assert.equal(idleMullion(idle), true);
  assert.equal(briskMullion(brisk), true);
  assert.equal(restingMullion(resting), true);
  assert.deepEqual(reminderMullionList([overdue, late]), ["Over"]);
  const added = addMullion([], { title: "New course", profile: "jamb", hour: 4, depth: 4, bed: "ivory", tags: "m u x" });
  assert.equal(added.length, 1);
  assert.equal(added[0].profile, "jamb");
  assert.equal(added[0].hour, 4);
  assert.equal(added[0].depth, 4);
  assert.equal(added[0].bed, "IVORY");
  assert.deepEqual(added[0].tags, ["m", "u"]);
  assert.equal(addMullion(added, { title: "New course" }).length, 1);
  const view = { id: "v", name: "Warm", rack: "base" as const, query: "", hand: "", bed: "", profile: "warm", hour: "", depth: "" };
  assert.equal(addMullionView([], view).length, 1);
  assert.equal(dropMullionView(addMullionView([], view), "v").length, 0);
  assert.equal(readMullionViews([{ ...view, name: "" }]).length, 0);
  const line = mullionTimeline([course({ id: "t", title: "Tide", hour: 4 })]);
  assert.equal(line[0].hour, 4);
  assert.deepEqual(line[0].titles, ["Tide"]);

  assert.equal(transomLit("IOS"), true);
  assert.equal(transomLit(true), true);
  assert.equal(transomLit(false), false);
  assert.equal(transomLit("ANDROID"), true);
  assert.equal(transomLit("LINUX"), true);
  assert.equal(transomLit("OPEN"), false);
  assert.equal(transomNear("ABCD"), true);
  assert.equal(transomNear("MACS"), true);
  assert.equal(transomNear("ABCDE"), false);
  assert.equal(transomFar("A"), true);
  assert.equal(transomFar("AB"), true);
  assert.equal(transomFar("ABC"), false);
  assert.equal(transomFar("ABCD"), false);
  assert.equal(transomFade("A".repeat(12)), true);
  assert.equal(transomFade("A".repeat(8)), false);
  assert.equal(transomDim("DOCK"), true);
  assert.equal(transomDim("IDLE"), true);
  assert.equal(transomDark("LOCK"), true);
  assert.equal(transomDark(false), true);
  assert.equal(transomBlank("NONE"), true);
  assert.equal(transomOpen(""), true);
  assert.equal(transomHue("IOS"), "gilt");
  assert.equal(transomHue("LOCK"), "ash");
  assert.equal(transomHue("DOCK"), "pearl");
  assert.equal(transomLength("ABCD"), 4);
  assert.equal(transomEven("ABCD"), true);
  assert.equal(transomDigit("12night"), true);
  assert.equal(transomLetter("READY"), true);
  assert.equal(transomUpper("ISTANBUL"), true);
  assert.equal(transomUpper("OPEN"), false);
  assert.equal(transomLit("ABCDEFGH"), false);
  assert.equal(transomDim("ABCDEFGH"), true);
  assert.equal(transomCopy("READY"), "READY");
  assert.equal(transomLit({ balance: 1 }), false);
  assert.equal(transomLit({ lastDevice: "IOS" }), true);
  assert.equal(transomLit(transomSlice({ lastDevice: true, balance: 9 })), true);
  const rows: TransomRow[] = [
    { id: "1", label: "Ada", code: "IOS" },
    { id: "2", label: "Bea", code: "DOCK" },
  ];
  assert.equal(leadingTransom(rows), "live");
  assert.equal(leadingTransomHue(rows), "gilt");
  assert.match(transomLanesCsv(rows), /live,1/);
  assert.match(transomRowsCsv(rows, ["1"]), /Ada,IOS/);
  assert.match(transomRowsCsv(rows, ["1"]), /,1$/m);
  assert.match(transomRowsCsv(rows, ["1"]), /^name,mark,lane,hue,reviewed/m);

  assert.equal(crmv4Text("en", "mulTitle"), ROUND406_COPY.en.mulTitle);
  assert.equal(crmv4Text("tr", "trmTitle"), ROUND406_COPY.tr.trmTitle);
  assert.equal(crmv4Text("de", "mulHint"), ROUND406_COPY.de.mulHint);
  assert.equal(crmv4Text("ru", "handoffRebateKicker"), ROUND406_COPY.ru.handoffRebateKicker);
  assert.equal(crmv4Text("ar", "remindCuspLead"), ROUND406_COPY.ar.remindCuspLead);
  const keys = Object.keys(ROUND406_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND406_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-mullion/);
  assert.match(css, /\.c4-transom/);
  assert.match(css, /\.c4-mullion-column/);
  assert.match(css, /\.c4-transom-column/);
  assert.match(css, /\.c4-handoff-rebate/);
  assert.match(css, /\.c4-remind-cusp/);
  assert.match(css, /\.c4-handoff-rebate-mast/);
  assert.match(css, /\.c4-remind-cusp-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round406.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.equal(viewFile.includes("totpSecret"), false);
  assert.match(viewFile, /transomSlice/);
  assert.match(viewFile, /mullionCsv/);
  assert.match(viewFile, /transomRowsCsv/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "x"/);
  assert.match(viewFile, /event\.key === "a"/);
  assert.match(viewFile, /event\.key === "c"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=24&meta=0/);
  assert.match(viewFile, /data-mullion/);
  assert.match(viewFile, /data-transom/);
  assert.match(viewFile, /data-desk/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestMullionBed/);
  assert.match(viewFile, /c4-transom-search/);
  assert.match(viewFile, /mullionTimeline/);
  assert.match(viewFile, /c4-mullion-notices/);
  assert.match(viewFile, /from "@\/lib\/crmv4\/round406"/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "mul"/);
  assert.match(app, /view === "trm"/);
  const panels = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round11.tsx"), "utf8");
  assert.match(panels, /c4-handoff-rebate/);
  assert.match(panels, /c4-handoff-rebate-mast/);
  assert.match(panels, /data-logo="mono"/);
  assert.match(panels, /handoffRebateKicker/);
  assert.match(panels, /handoffRebateLead/);
  assert.match(panels, /data-handoff-rebate/);
  assert.match(panels, /c4-remind-cusp/);
  assert.match(panels, /c4-remind-cusp-mast/);
  assert.match(panels, /remindCuspKicker/);
  assert.match(panels, /remindCuspLead/);
  assert.match(panels, /data-remind-cusp/);
  const namedKeys = `${viewFile}\n${panels}`.match(/"(mul|trm|handoffRebate|remindCusp)[A-Z][A-Za-z0-9]*"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND406_COPY.en[key as keyof typeof ROUND406_COPY.en], "string", key);
  console.log("crmv4 round406 tests passed");
}

main();
