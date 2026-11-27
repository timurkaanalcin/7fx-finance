/**
 * Washboard courses, gudgeon seen plates, the ivory method pintle, and the graphite asset breasthook.
 * Run: TZ=UTC npx tsx tests/crmv4-round419.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND419_COPY } from "../src/lib/crmv4/copy-round419";
import { ROUND418_FEATURES } from "../src/lib/crmv4/round418";
import {
  ROUND419_FEATURES,
  activeBed,
  activeDepth,
  activeHour,
  activeProfile,
  addWashboard,
  addWashboardView,
  briskWashboard,
  depthCount,
  dropWashboardView,
  fairHand,
  fullDepth,
  idleWashboard,
  ivoryQuiet,
  lateWashboard,
  leadingGudgeon,
  leadingGudgeonHue,
  midDepth,
  moveWashboardFocus,
  overdueWashboard,
  gudgeonBlank,
  gudgeonCopy,
  gudgeonDark,
  gudgeonDigit,
  gudgeonDim,
  gudgeonEven,
  gudgeonFade,
  gudgeonFar,
  gudgeonHue,
  gudgeonLanesCsv,
  gudgeonLength,
  gudgeonLetter,
  gudgeonLit,
  gudgeonNear,
  gudgeonOpen,
  gudgeonRowsCsv,
  gudgeonSlice,
  gudgeonUpper,
  profileBand,
  profileCool,
  profileGap,
  profilePoint,
  profileWarm,
  readWashboardViews,
  reminderWashboardList,
  restingWashboard,
  washboardBed,
  washboardHour,
  washboardTimeline,
  suggestProfile,
  suggestWashboardBed,
  suggestWashboardHour,
  type Washboard,
  type GudgeonRow,
} from "../src/lib/crmv4/round419";

function course(partial: Partial<Washboard> & { id: string; title: string }): Washboard {
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
  assert.equal(ROUND419_FEATURES.length, 25);
  assert.equal(new Set(ROUND419_FEATURES).size, 25);
  for (const feature of ROUND419_FEATURES) assert.equal((ROUND418_FEATURES as readonly string[]).includes(feature), false, feature);
  const libDir = path.join(__dirname, "../src/lib/crmv4");
  for (const feature of ROUND419_FEATURES) {
    const needle = `"${feature}"`;
    for (const file of fs.readdirSync(libDir)) {
      if (!file.endsWith(".ts") || file === "round419.ts") continue;
      const body = fs.readFileSync(path.join(libDir, file), "utf8");
      assert.equal(body.includes(needle), false, `${feature} in ${file}`);
    }
  }

  assert.equal(profilePoint(" washboard "), "washboard");
  assert.equal(profilePoint("jasper"), "");
  assert.equal(washboardHour("3"), 3);
  assert.equal(washboardHour(6), 6);
  assert.equal(washboardHour(12), 12);
  assert.equal(washboardHour(24), 24);
  assert.equal(washboardHour("1"), null);
  assert.equal(washboardHour("4"), null);
  assert.equal(depthCount("1"), 1);
  assert.equal(depthCount(3), 3);
  assert.equal(depthCount("6"), 6);
  assert.equal(depthCount("2"), null);
  assert.equal(depthCount("4"), null);
  assert.equal(washboardBed("ivory"), "IVORY");
  assert.equal(washboardBed("graphite"), "GRAPHITE");
  assert.equal(washboardBed("gilt"), "GILT");
  assert.equal(washboardBed("gold"), "");
  assert.equal(profileWarm("washboard"), true);
  assert.equal(profileWarm("BOBSTAY"), true);
  assert.equal(profileWarm("jibboom"), false);
  assert.equal(profileCool("jibboom"), true);
  assert.equal(profileCool("skeg"), true);
  assert.equal(profileCool("washboard"), false);
  assert.equal(profileBand("washboard"), "first");
  assert.equal(profileBand("bobstay"), "second");
  assert.equal(profileBand("jibboom"), "third");
  assert.equal(profileBand("skeg"), "fourth");
  assert.equal(profileGap("washboard", "skeg"), 3);
  assert.equal(profileGap("skeg", "washboard"), -3);
  assert.equal(profileGap("jasper", "washboard"), null);
  assert.equal(ivoryQuiet("ivory"), true);
  assert.equal(ivoryQuiet("GRAPHITE"), false);
  assert.equal(midDepth(3), true);
  assert.equal(midDepth(1), false);
  assert.equal(fullDepth(6), true);
  assert.equal(fullDepth(3), false);
  assert.equal(activeProfile("warm"), "warm");
  assert.equal(activeProfile("cool"), "cool");
  assert.equal(activeProfile("skeg"), "skeg");
  assert.equal(activeProfile("nope"), "all");
  assert.equal(activeHour("12"), "12");
  assert.equal(activeHour("1"), "all");
  assert.equal(activeDepth("6"), "6");
  assert.equal(activeDepth("2"), "all");
  assert.equal(activeBed("ivory", ["IVORY", "GRAPHITE"]), "IVORY");
  assert.equal(activeBed("gilt", ["IVORY"]), "all");
  assert.equal(moveWashboardFocus(0, 4, -1), 3);
  assert.equal(suggestProfile(1), "washboard");
  assert.equal(suggestProfile(5), "bobstay");
  assert.equal(suggestProfile(10), "jibboom");
  assert.equal(suggestProfile(20), "skeg");
  assert.equal(suggestWashboardHour([], 1), 3);
  assert.equal(suggestWashboardHour([], 5), 6);
  assert.equal(suggestWashboardHour([], 10), 12);
  assert.equal(suggestWashboardHour([], 20), 24);
  const saved = [
    course({ id: "a", title: "Ada", hour: 24 }),
    course({ id: "b", title: "Bea", hour: 6 }),
    course({ id: "c", title: "Cid", hour: 12 }),
  ];
  assert.equal(suggestWashboardHour(saved, 24), 3);
  assert.equal(suggestWashboardBed([course({ id: "g", title: "Gilt", bed: "GILT" })]), "IVORY");
  assert.equal(fairHand([course({ id: "h", title: "Held", hand: "Nia" })], "Nia, Omar"), "Omar");

  const late = course({ id: "l", title: "Late", profile: "washboard" });
  const overdue = course({ id: "o", title: "Over", profile: "skeg", depth: 1 });
  const idle = course({ id: "i", title: "Idle", hour: 3, depth: 1, bed: "" });
  const brisk = course({ id: "b2", title: "Brisk", bed: "IVORY", hour: 24, depth: 6 });
  const resting = course({ id: "r", title: "Rest", profile: "jibboom", bed: "GILT", hour: 6 });
  assert.equal(lateWashboard(late, "skeg"), true);
  assert.equal(lateWashboard(late, "washboard"), false);
  assert.equal(overdueWashboard(overdue), true);
  assert.equal(overdueWashboard({ ...overdue, raised: true }), false);
  assert.equal(idleWashboard(idle), true);
  assert.equal(briskWashboard(brisk), true);
  assert.equal(restingWashboard(resting), true);
  assert.deepEqual(reminderWashboardList([overdue, late]), ["Over"]);
  const added = addWashboard([], { title: "New course", profile: "bobstay", hour: 6, depth: 3, bed: "ivory", tags: "c v z" });
  assert.equal(added.length, 1);
  assert.equal(added[0].profile, "bobstay");
  assert.equal(added[0].hour, 6);
  assert.equal(added[0].depth, 3);
  assert.equal(added[0].bed, "IVORY");
  assert.deepEqual(added[0].tags, ["c", "v"]);
  assert.equal(addWashboard(added, { title: "New course" }).length, 1);
  const view = { id: "v", name: "Warm", rack: "base" as const, query: "", hand: "", bed: "", profile: "warm", hour: "", depth: "" };
  assert.equal(addWashboardView([], view).length, 1);
  assert.equal(dropWashboardView(addWashboardView([], view), "v").length, 0);
  assert.equal(readWashboardViews([{ ...view, name: "" }]).length, 0);
  const line = washboardTimeline([course({ id: "t", title: "Tide", hour: 6 })]);
  assert.equal(line[0].hour, 6);
  assert.deepEqual(line[0].titles, ["Tide"]);

  assert.equal(gudgeonLit("NOW"), true);
  assert.equal(gudgeonLit("OPEN"), true);
  assert.equal(gudgeonLit("live"), true);
  assert.equal(gudgeonLit("GOLD"), true);
  assert.equal(gudgeonLit("ON"), true);
  assert.equal(gudgeonHue("NOW"), "gilt");
  assert.equal(gudgeonFar("A"), true);
  assert.equal(gudgeonLit(true), true);
  assert.equal(gudgeonLit(false), false);
  assert.equal(gudgeonLit("AT-A"), true);
  assert.equal(gudgeonNear("AT-ABCD"), true);
  assert.equal(gudgeonNear("ABCD"), true);
  assert.equal(gudgeonNear("AB"), false);
  assert.equal(gudgeonFar("AB"), false);
  assert.equal(gudgeonFade("A".repeat(14)), true);
  assert.equal(gudgeonFade("AT-" + "A".repeat(11)), true);
  assert.equal(gudgeonFade("A".repeat(8)), false);
  assert.equal(gudgeonDim("STAY"), true);
  assert.equal(gudgeonDim("SOFT"), true);
  assert.equal(gudgeonDim("ABC"), true);
  assert.equal(gudgeonDark("BAN"), true);
  assert.equal(gudgeonDark(false), false);
  assert.equal(gudgeonDark("DROP"), true);
  assert.equal(gudgeonBlank("CLEAR"), true);
  assert.equal(gudgeonBlank("NULL"), true);
  assert.equal(gudgeonOpen(""), true);
  assert.equal(gudgeonHue("BAN"), "ash");
  assert.equal(gudgeonHue("STAY"), "pearl");
  assert.equal(gudgeonLength("ABCD"), 4);
  assert.equal(gudgeonEven("AB"), true);
  assert.equal(gudgeonDigit("12night"), true);
  assert.equal(gudgeonLetter("NOW"), true);
  assert.equal(gudgeonUpper("ISTANBUL"), true);
  assert.equal(gudgeonUpper("VIP"), false);
  assert.equal(gudgeonLit("ABCDEFGH"), false);
  assert.equal(gudgeonDim("ABCDEFGH"), true);
  assert.equal(gudgeonCopy("NOW"), "NOW");
  assert.equal(gudgeonLit({ balance: 1 }), false);
  assert.equal(gudgeonLit({ lastSeenAt: "NOW" }), true);
  assert.equal(gudgeonLit(gudgeonSlice({ lastSeenAt: true, balance: 9 })), true);
  const rows: GudgeonRow[] = [
    { id: "1", label: "Ada", code: "NOW" },
    { id: "2", label: "Bea", code: "QUEUE" },
  ];
  assert.equal(leadingGudgeon(rows), "live");
  assert.equal(leadingGudgeonHue(rows), "gilt");
  assert.match(gudgeonLanesCsv(rows), /live,1/);
  assert.match(gudgeonRowsCsv(rows, ["1"]), /Ada,NOW/);
  assert.match(gudgeonRowsCsv(rows, ["1"]), /,1$/m);
  assert.match(gudgeonRowsCsv(rows, ["1"]), /^name,seen,lane,hue,reviewed/m);

  assert.equal(crmv4Text("en", "wsbTitle"), ROUND419_COPY.en.wsbTitle);
  assert.equal(crmv4Text("tr", "gdgTitle"), ROUND419_COPY.tr.gdgTitle);
  assert.equal(crmv4Text("de", "wsbHint"), ROUND419_COPY.de.wsbHint);
  assert.equal(crmv4Text("ru", "iplPintleKicker"), ROUND419_COPY.ru.iplPintleKicker);
  assert.equal(crmv4Text("ar", "gbhBreasthookLead"), ROUND419_COPY.ar.gbhBreasthookLead);
  const keys = Object.keys(ROUND419_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND419_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-wsb419/);
  assert.match(css, /\.c4-gdg419/);
  assert.match(css, /\.c4-wsb419-column/);
  assert.match(css, /\.c4-gdg419-column/);
  assert.match(css, /\.c4-method-pintle/);
  assert.match(css, /\.c4-asset-breasthook/);
  assert.match(css, /\.c4-method-pintle-mast/);
  assert.match(css, /\.c4-asset-breasthook-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round419.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.equal(viewFile.includes("totpSecret"), false);
  assert.match(viewFile, /gudgeonSlice/);
  assert.match(viewFile, /washboardCsv/);
  assert.match(viewFile, /gudgeonRowsCsv/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "x"/);
  assert.match(viewFile, /event\.key === "a"/);
  assert.match(viewFile, /event\.key === "c"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=24&meta=0/);
  assert.match(viewFile, /data-wsb419/);
  assert.match(viewFile, /data-gdg419/);
  assert.match(viewFile, /data-seen/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestWashboardBed/);
  assert.match(viewFile, /c4-gdg419-search/);
  assert.match(viewFile, /washboardTimeline/);
  assert.match(viewFile, /c4-wsb419-notices/);
  assert.match(viewFile, /from "@\/lib\/crmv4\/round419"/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "wsb"/);
  assert.match(app, /view === "gdg"/);
  const ops = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/views/Ops.tsx"), "utf8");
  assert.match(ops, /c4-method-pintle/);
  assert.match(ops, /MethodPintleHead/);
  assert.match(ops, /data-method-pintle/);
  assert.match(ops, /c4-asset-breasthook/);
  assert.match(ops, /AssetBreasthookHead/);
  assert.match(ops, /data-asset-breasthook/);
  assert.match(viewFile, /c4-method-pintle-mast/);
  assert.match(viewFile, /c4-asset-breasthook-mast/);
  assert.match(viewFile, /iplPintleKicker/);
  assert.match(viewFile, /iplPintleLead/);
  assert.match(viewFile, /gbhBreasthookKicker/);
  assert.match(viewFile, /gbhBreasthookLead/);
  assert.match(viewFile, /data-logo="mono"/);
  const namedKeys = `${viewFile}\n${ops}`.match(/"(wsb|gdg|ipl|gbh)[A-Z][A-Za-z0-9]*"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND419_COPY.en[key as keyof typeof ROUND419_COPY.en], "string", key);
  console.log("crmv4 round419 tests passed");
}

main();
