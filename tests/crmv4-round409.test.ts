/**
 * Hypotrachelion courses, canalis operating-system plates, the ivory agent quirk, and the graphite arrange pedestal.
 * Run: TZ=UTC npx tsx tests/crmv4-round409.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND409_COPY } from "../src/lib/crmv4/copy-round409";
import { ROUND408_FEATURES } from "../src/lib/crmv4/round408";
import {
  ROUND409_FEATURES,
  activeBed,
  activeDepth,
  activeHour,
  activeProfile,
  addHypotrachelion,
  addHypotrachelionView,
  briskHypotrachelion,
  depthCount,
  dropHypotrachelionView,
  fairHand,
  fullDepth,
  idleHypotrachelion,
  graphiteQuiet,
  lateHypotrachelion,
  leadingCanalis,
  leadingCanalisHue,
  midDepth,
  moveHypotrachelionFocus,
  overdueHypotrachelion,
  canalisBlank,
  canalisCopy,
  canalisDark,
  canalisDigit,
  canalisDim,
  canalisEven,
  canalisFade,
  canalisFar,
  canalisHue,
  canalisLanesCsv,
  canalisLength,
  canalisLetter,
  canalisLit,
  canalisNear,
  canalisOpen,
  canalisRowsCsv,
  canalisSlice,
  canalisUpper,
  profileBand,
  profileCool,
  profileGap,
  profilePoint,
  profileWarm,
  readHypotrachelionViews,
  reminderHypotrachelionList,
  restingHypotrachelion,
  hypotrachelionBed,
  hypotrachelionHour,
  hypotrachelionTimeline,
  suggestProfile,
  suggestHypotrachelionBed,
  suggestHypotrachelionHour,
  type Hypotrachelion,
  type CanalisRow,
} from "../src/lib/crmv4/round409";

function course(partial: Partial<Hypotrachelion> & { id: string; title: string }): Hypotrachelion {
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
  assert.equal(ROUND409_FEATURES.length, 25);
  assert.equal(new Set(ROUND409_FEATURES).size, 25);
  for (const feature of ROUND409_FEATURES) assert.equal((ROUND408_FEATURES as readonly string[]).includes(feature), false, feature);
  const libDir = path.join(__dirname, "../src/lib/crmv4");
  for (const feature of ROUND409_FEATURES) {
    const needle = `"${feature}"`;
    for (const file of fs.readdirSync(libDir)) {
      if (!file.endsWith(".ts") || file === "round409.ts") continue;
      const body = fs.readFileSync(path.join(libDir, file), "utf8");
      assert.equal(body.includes(needle), false, `${feature} in ${file}`);
    }
  }

  assert.equal(profilePoint(" hypotrachelion "), "hypotrachelion");
  assert.equal(profilePoint("jasper"), "");
  assert.equal(hypotrachelionHour("3"), 3);
  assert.equal(hypotrachelionHour(6), 6);
  assert.equal(hypotrachelionHour(9), 9);
  assert.equal(hypotrachelionHour(15), 15);
  assert.equal(hypotrachelionHour("1"), null);
  assert.equal(hypotrachelionHour("4"), null);
  assert.equal(depthCount("3"), 3);
  assert.equal(depthCount(5), 5);
  assert.equal(depthCount("9"), 9);
  assert.equal(depthCount("1"), null);
  assert.equal(depthCount("2"), null);
  assert.equal(hypotrachelionBed("ivory"), "IVORY");
  assert.equal(hypotrachelionBed("graphite"), "GRAPHITE");
  assert.equal(hypotrachelionBed("gilt"), "GILT");
  assert.equal(hypotrachelionBed("gold"), "");
  assert.equal(profileWarm("hypotrachelion"), true);
  assert.equal(profileWarm("QUIRK"), true);
  assert.equal(profileWarm("pedestal"), false);
  assert.equal(profileCool("pedestal"), true);
  assert.equal(profileCool("canalis"), true);
  assert.equal(profileCool("hypotrachelion"), false);
  assert.equal(profileBand("hypotrachelion"), "first");
  assert.equal(profileBand("quirk"), "second");
  assert.equal(profileBand("pedestal"), "third");
  assert.equal(profileBand("canalis"), "fourth");
  assert.equal(profileGap("hypotrachelion", "canalis"), 3);
  assert.equal(profileGap("canalis", "hypotrachelion"), -3);
  assert.equal(profileGap("jasper", "hypotrachelion"), null);
  assert.equal(graphiteQuiet("graphite"), true);
  assert.equal(graphiteQuiet("IVORY"), false);
  assert.equal(midDepth(5), true);
  assert.equal(midDepth(3), false);
  assert.equal(fullDepth(9), true);
  assert.equal(fullDepth(5), false);
  assert.equal(activeProfile("warm"), "warm");
  assert.equal(activeProfile("cool"), "cool");
  assert.equal(activeProfile("canalis"), "canalis");
  assert.equal(activeProfile("nope"), "all");
  assert.equal(activeHour("9"), "9");
  assert.equal(activeHour("2"), "all");
  assert.equal(activeDepth("9"), "9");
  assert.equal(activeDepth("1"), "all");
  assert.equal(activeBed("ivory", ["IVORY", "GRAPHITE"]), "IVORY");
  assert.equal(activeBed("gilt", ["IVORY"]), "all");
  assert.equal(moveHypotrachelionFocus(0, 4, -1), 3);
  assert.equal(suggestProfile(1), "hypotrachelion");
  assert.equal(suggestProfile(3), "quirk");
  assert.equal(suggestProfile(6), "pedestal");
  assert.equal(suggestProfile(10), "canalis");
  assert.equal(suggestHypotrachelionHour([], 1), 3);
  assert.equal(suggestHypotrachelionHour([], 3), 6);
  assert.equal(suggestHypotrachelionHour([], 6), 9);
  assert.equal(suggestHypotrachelionHour([], 10), 15);
  const saved = [
    course({ id: "a", title: "Ada", hour: 15 }),
    course({ id: "b", title: "Bea", hour: 6 }),
    course({ id: "c", title: "Cid", hour: 9 }),
  ];
  assert.equal(suggestHypotrachelionHour(saved, 15), 3);
  assert.equal(suggestHypotrachelionBed([course({ id: "g", title: "Gilt", bed: "GILT" })]), "GRAPHITE");
  assert.equal(fairHand([course({ id: "h", title: "Held", hand: "Nia" })], "Nia, Omar"), "Omar");

  const late = course({ id: "l", title: "Late", profile: "hypotrachelion" });
  const overdue = course({ id: "o", title: "Over", profile: "canalis", depth: 3 });
  const idle = course({ id: "i", title: "Idle", hour: 3, depth: 3, bed: "" });
  const brisk = course({ id: "b2", title: "Brisk", bed: "GRAPHITE", hour: 15, depth: 9 });
  const resting = course({ id: "r", title: "Rest", profile: "pedestal", bed: "IVORY", hour: 6 });
  assert.equal(lateHypotrachelion(late, "canalis"), true);
  assert.equal(lateHypotrachelion(late, "hypotrachelion"), false);
  assert.equal(overdueHypotrachelion(overdue), true);
  assert.equal(overdueHypotrachelion({ ...overdue, raised: true }), false);
  assert.equal(idleHypotrachelion(idle), true);
  assert.equal(briskHypotrachelion(brisk), true);
  assert.equal(restingHypotrachelion(resting), true);
  assert.deepEqual(reminderHypotrachelionList([overdue, late]), ["Over"]);
  const added = addHypotrachelion([], { title: "New course", profile: "quirk", hour: 6, depth: 5, bed: "ivory", tags: "h q z" });
  assert.equal(added.length, 1);
  assert.equal(added[0].profile, "quirk");
  assert.equal(added[0].hour, 6);
  assert.equal(added[0].depth, 5);
  assert.equal(added[0].bed, "IVORY");
  assert.deepEqual(added[0].tags, ["h", "q"]);
  assert.equal(addHypotrachelion(added, { title: "New course" }).length, 1);
  const view = { id: "v", name: "Warm", rack: "base" as const, query: "", hand: "", bed: "", profile: "warm", hour: "", depth: "" };
  assert.equal(addHypotrachelionView([], view).length, 1);
  assert.equal(dropHypotrachelionView(addHypotrachelionView([], view), "v").length, 0);
  assert.equal(readHypotrachelionViews([{ ...view, name: "" }]).length, 0);
  const line = hypotrachelionTimeline([course({ id: "t", title: "Tide", hour: 6 })]);
  assert.equal(line[0].hour, 6);
  assert.deepEqual(line[0].titles, ["Tide"]);

  assert.equal(canalisLit("IOS"), true);
  assert.equal(canalisLit(true), true);
  assert.equal(canalisLit(false), false);
  assert.equal(canalisLit("OS-AB"), true);
  assert.equal(canalisLit("OS-ABCDEFGHIJ"), false);
  assert.equal(canalisNear("WIN"), true);
  assert.equal(canalisNear("OS-ABC"), true);
  assert.equal(canalisNear("AB"), false);
  assert.equal(canalisFar("A"), true);
  assert.equal(canalisFar("AB"), false);
  assert.equal(canalisFar("ABC"), false);
  assert.equal(canalisFade("A".repeat(18)), true);
  assert.equal(canalisFade("OS-ABCDEFGHI"), true);
  assert.equal(canalisFade("A".repeat(8)), false);
  assert.equal(canalisDim("WAIT"), true);
  assert.equal(canalisDim("REST"), true);
  assert.equal(canalisDark("OFF"), true);
  assert.equal(canalisDark(false), true);
  assert.equal(canalisBlank("NONE"), true);
  assert.equal(canalisOpen(""), true);
  assert.equal(canalisHue("IOS"), "gilt");
  assert.equal(canalisHue("OFF"), "ash");
  assert.equal(canalisHue("WAIT"), "pearl");
  assert.equal(canalisLength("ABCD"), 4);
  assert.equal(canalisEven("AB"), true);
  assert.equal(canalisDigit("12night"), true);
  assert.equal(canalisLetter("READY"), true);
  assert.equal(canalisUpper("ISTANBUL"), true);
  assert.equal(canalisUpper("IOS"), false);
  assert.equal(canalisLit("ABCDEFGH"), false);
  assert.equal(canalisDim("ABCDEFGH"), true);
  assert.equal(canalisCopy("READY"), "READY");
  assert.equal(canalisLit({ balance: 1 }), false);
  assert.equal(canalisLit({ lastOs: "IOS" }), true);
  assert.equal(canalisLit(canalisSlice({ lastOs: true, balance: 9 })), true);
  const rows: CanalisRow[] = [
    { id: "1", label: "Ada", code: "IOS" },
    { id: "2", label: "Bea", code: "WAIT" },
  ];
  assert.equal(leadingCanalis(rows), "live");
  assert.equal(leadingCanalisHue(rows), "gilt");
  assert.match(canalisLanesCsv(rows), /live,1/);
  assert.match(canalisRowsCsv(rows, ["1"]), /Ada,IOS/);
  assert.match(canalisRowsCsv(rows, ["1"]), /,1$/m);
  assert.match(canalisRowsCsv(rows, ["1"]), /^name,os,lane,hue,reviewed/m);

  assert.equal(crmv4Text("en", "htrTitle"), ROUND409_COPY.en.htrTitle);
  assert.equal(crmv4Text("tr", "cnlTitle"), ROUND409_COPY.tr.cnlTitle);
  assert.equal(crmv4Text("de", "htrHint"), ROUND409_COPY.de.htrHint);
  assert.equal(crmv4Text("ru", "perfQuirkKicker"), ROUND409_COPY.ru.perfQuirkKicker);
  assert.equal(crmv4Text("ar", "arrangePedestalLead"), ROUND409_COPY.ar.arrangePedestalLead);
  const keys = Object.keys(ROUND409_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND409_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-hypotrachelion/);
  assert.match(css, /\.c4-canalis/);
  assert.match(css, /\.c4-hypotrachelion-column/);
  assert.match(css, /\.c4-canalis-column/);
  assert.match(css, /\.c4-perf-quirk/);
  assert.match(css, /\.c4-arrange-pedestal/);
  assert.match(css, /\.c4-perf-quirk-mast/);
  assert.match(css, /\.c4-arrange-pedestal-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round409.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.equal(viewFile.includes("totpSecret"), false);
  assert.match(viewFile, /canalisSlice/);
  assert.match(viewFile, /hypotrachelionCsv/);
  assert.match(viewFile, /canalisRowsCsv/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "x"/);
  assert.match(viewFile, /event\.key === "a"/);
  assert.match(viewFile, /event\.key === "c"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=24&meta=0/);
  assert.match(viewFile, /data-hypotrachelion/);
  assert.match(viewFile, /data-canalis/);
  assert.match(viewFile, /data-os/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestHypotrachelionBed/);
  assert.match(viewFile, /c4-canalis-search/);
  assert.match(viewFile, /hypotrachelionTimeline/);
  assert.match(viewFile, /c4-hypotrachelion-notices/);
  assert.match(viewFile, /from "@\/lib\/crmv4\/round409"/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "htr"/);
  assert.match(app, /view === "cnl"/);
  const perf = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round18.tsx"), "utf8");
  const arrange = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round26.tsx"), "utf8");
  assert.match(perf, /c4-perf-quirk/);
  assert.match(perf, /c4-perf-quirk-mast/);
  assert.match(perf, /data-logo="mono"/);
  assert.match(perf, /perfQuirkKicker/);
  assert.match(perf, /perfQuirkLead/);
  assert.match(perf, /data-perf-quirk/);
  assert.match(arrange, /c4-arrange-pedestal/);
  assert.match(arrange, /c4-arrange-pedestal-mast/);
  assert.match(arrange, /data-logo="mono"/);
  assert.match(arrange, /arrangePedestalKicker/);
  assert.match(arrange, /arrangePedestalLead/);
  assert.match(arrange, /data-arrange-pedestal/);
  const namedKeys = `${viewFile}\n${perf}\n${arrange}`.match(/"(htr|cnl|perfQuirk|arrangePedestal)[A-Z][A-Za-z0-9]*"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND409_COPY.en[key as keyof typeof ROUND409_COPY.en], "string", key);
  console.log("crmv4 round409 tests passed");
}

main();
