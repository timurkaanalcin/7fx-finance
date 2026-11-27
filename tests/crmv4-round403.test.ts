/**
 * Bucrane courses, meander shield plates, the ivory pinned tondo, and the graphite churn festoon.
 * Run: TZ=UTC npx tsx tests/crmv4-round403.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND403_COPY } from "../src/lib/crmv4/copy-round403";
import { ROUND402_FEATURES } from "../src/lib/crmv4/round402";
import {
  ROUND403_FEATURES,
  activeBed,
  activeDepth,
  activeHour,
  activeProfile,
  addBucrane,
  addBucraneView,
  briskBucrane,
  depthCount,
  dropBucraneView,
  fairHand,
  fullDepth,
  idleBucrane,
  ivoryQuiet,
  lateBucrane,
  leadingMeander,
  leadingMeanderHue,
  midDepth,
  moveBucraneFocus,
  overdueBucrane,
  meanderBlank,
  meanderCopy,
  meanderDark,
  meanderDigit,
  meanderDim,
  meanderEven,
  meanderFade,
  meanderFar,
  meanderHue,
  meanderLanesCsv,
  meanderLength,
  meanderLetter,
  meanderLit,
  meanderNear,
  meanderOpen,
  meanderRowsCsv,
  meanderSlice,
  meanderUpper,
  profileBand,
  profileCool,
  profileGap,
  profilePoint,
  profileWarm,
  readBucraneViews,
  reminderBucraneList,
  restingBucrane,
  bucraneBed,
  bucraneHour,
  bucraneTimeline,
  suggestProfile,
  suggestBucraneBed,
  suggestBucraneHour,
  type Bucrane,
  type MeanderRow,
} from "../src/lib/crmv4/round403";

function course(partial: Partial<Bucrane> & { id: string; title: string }): Bucrane {
  return {
    note: "",
    hand: "",
    profile: "",
    hour: null,
    bed: "",
    depth: 5,
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
  assert.equal(ROUND403_FEATURES.length, 25);
  assert.equal(new Set(ROUND403_FEATURES).size, 25);
  for (const feature of ROUND403_FEATURES) assert.equal((ROUND402_FEATURES as readonly string[]).includes(feature), false, feature);
  const libDir = path.join(__dirname, "../src/lib/crmv4");
  for (const feature of ROUND403_FEATURES) {
    const needle = `"${feature}"`;
    for (const file of fs.readdirSync(libDir)) {
      if (!file.endsWith(".ts") || file === "round403.ts") continue;
      const body = fs.readFileSync(path.join(libDir, file), "utf8");
      assert.equal(body.includes(needle), false, `${feature} in ${file}`);
    }
  }

  assert.equal(profilePoint(" bucrane "), "bucrane");
  assert.equal(profilePoint("jasper"), "");
  assert.equal(bucraneHour("5"), 5);
  assert.equal(bucraneHour(9), 9);
  assert.equal(bucraneHour(13), 13);
  assert.equal(bucraneHour(18), 18);
  assert.equal(bucraneHour("4"), null);
  assert.equal(bucraneHour("12"), null);
  assert.equal(depthCount("5"), 5);
  assert.equal(depthCount(9), 9);
  assert.equal(depthCount("13"), 13);
  assert.equal(depthCount("4"), null);
  assert.equal(depthCount("8"), null);
  assert.equal(bucraneBed("ivory"), "IVORY");
  assert.equal(bucraneBed("graphite"), "GRAPHITE");
  assert.equal(bucraneBed("gilt"), "GILT");
  assert.equal(bucraneBed("gold"), "");
  assert.equal(profileWarm("bucrane"), true);
  assert.equal(profileWarm("GARLAND"), true);
  assert.equal(profileWarm("festoon"), false);
  assert.equal(profileCool("festoon"), true);
  assert.equal(profileCool("swag"), true);
  assert.equal(profileCool("bucrane"), false);
  assert.equal(profileBand("bucrane"), "first");
  assert.equal(profileBand("garland"), "second");
  assert.equal(profileBand("festoon"), "third");
  assert.equal(profileBand("swag"), "fourth");
  assert.equal(profileGap("bucrane", "swag"), 3);
  assert.equal(profileGap("swag", "bucrane"), -3);
  assert.equal(profileGap("jasper", "bucrane"), null);
  assert.equal(ivoryQuiet("ivory"), true);
  assert.equal(ivoryQuiet("GILT"), false);
  assert.equal(midDepth(9), true);
  assert.equal(midDepth(5), false);
  assert.equal(fullDepth(13), true);
  assert.equal(fullDepth(9), false);
  assert.equal(activeProfile("warm"), "warm");
  assert.equal(activeProfile("cool"), "cool");
  assert.equal(activeProfile("swag"), "swag");
  assert.equal(activeProfile("nope"), "all");
  assert.equal(activeHour("18"), "18");
  assert.equal(activeHour("3"), "all");
  assert.equal(activeDepth("13"), "13");
  assert.equal(activeDepth("1"), "all");
  assert.equal(activeBed("ivory", ["IVORY", "GRAPHITE"]), "IVORY");
  assert.equal(activeBed("gilt", ["IVORY"]), "all");
  assert.equal(moveBucraneFocus(0, 4, -1), 3);
  assert.equal(suggestProfile(2), "bucrane");
  assert.equal(suggestProfile(10), "garland");
  assert.equal(suggestProfile(14), "festoon");
  assert.equal(suggestProfile(18), "swag");
  assert.equal(suggestBucraneHour([], 3), 5);
  assert.equal(suggestBucraneHour([], 10), 9);
  assert.equal(suggestBucraneHour([], 14), 13);
  assert.equal(suggestBucraneHour([], 20), 18);
  const saved = [
    course({ id: "a", title: "Ada", hour: 18 }),
    course({ id: "b", title: "Bea", hour: 9 }),
    course({ id: "c", title: "Cid", hour: 13 }),
  ];
  assert.equal(suggestBucraneHour(saved, 20), 5);
  assert.equal(suggestBucraneBed([course({ id: "g", title: "Gilt", bed: "GILT" })]), "IVORY");
  assert.equal(fairHand([course({ id: "h", title: "Held", hand: "Nia" })], "Nia, Omar"), "Omar");

  const late = course({ id: "l", title: "Late", profile: "bucrane" });
  const overdue = course({ id: "o", title: "Over", profile: "swag", depth: 5 });
  const idle = course({ id: "i", title: "Idle", hour: 5, depth: 5, bed: "" });
  const brisk = course({ id: "b2", title: "Brisk", bed: "IVORY", hour: 18, depth: 13 });
  const resting = course({ id: "r", title: "Rest", profile: "festoon", bed: "GRAPHITE", hour: 9 });
  assert.equal(lateBucrane(late, "swag"), true);
  assert.equal(lateBucrane(late, "bucrane"), false);
  assert.equal(overdueBucrane(overdue), true);
  assert.equal(overdueBucrane({ ...overdue, raised: true }), false);
  assert.equal(idleBucrane(idle), true);
  assert.equal(briskBucrane(brisk), true);
  assert.equal(restingBucrane(resting), true);
  assert.deepEqual(reminderBucraneList([overdue, late]), ["Over"]);
  const added = addBucrane([], { title: "New course", profile: "garland", hour: 9, depth: 9, bed: "ivory", tags: "b g x" });
  assert.equal(added.length, 1);
  assert.equal(added[0].profile, "garland");
  assert.equal(added[0].hour, 9);
  assert.equal(added[0].depth, 9);
  assert.equal(added[0].bed, "IVORY");
  assert.deepEqual(added[0].tags, ["b", "g"]);
  assert.equal(addBucrane(added, { title: "New course" }).length, 1);
  const view = { id: "v", name: "Warm", rack: "base" as const, query: "", hand: "", bed: "", profile: "warm", hour: "", depth: "" };
  assert.equal(addBucraneView([], view).length, 1);
  assert.equal(dropBucraneView(addBucraneView([], view), "v").length, 0);
  assert.equal(readBucraneViews([{ ...view, name: "" }]).length, 0);
  const line = bucraneTimeline([course({ id: "t", title: "Tide", hour: 9 })]);
  assert.equal(line[0].hour, 9);
  assert.deepEqual(line[0].titles, ["Tide"]);

  assert.equal(meanderLit("LIVE"), true);
  assert.equal(meanderLit(true), true);
  assert.equal(meanderLit(false), false);
  assert.equal(meanderLit("SET"), true);
  assert.equal(meanderLit("ON"), true);
  assert.equal(meanderNear("ABCD"), true);
  assert.equal(meanderNear("ABC"), false);
  assert.equal(meanderFar("A"), true);
  assert.equal(meanderFar("AB"), true);
  assert.equal(meanderFar("ABCD"), false);
  assert.equal(meanderFade("A".repeat(12)), true);
  assert.equal(meanderFade("LIVE"), false);
  assert.equal(meanderDim("HOLD"), true);
  assert.equal(meanderDim("WAIT"), true);
  assert.equal(meanderDark("SHUT"), true);
  assert.equal(meanderDark(false), true);
  assert.equal(meanderBlank("NONE"), true);
  assert.equal(meanderOpen(""), true);
  assert.equal(meanderHue("LIVE"), "gilt");
  assert.equal(meanderHue("SHUT"), "ash");
  assert.equal(meanderHue("HOLD"), "pearl");
  assert.equal(meanderLength("OPEN"), 4);
  assert.equal(meanderEven("OPEN"), true);
  assert.equal(meanderDigit("12night"), true);
  assert.equal(meanderLetter("LIVE"), true);
  assert.equal(meanderUpper("ISTANBUL"), true);
  assert.equal(meanderUpper("OPEN"), false);
  assert.equal(meanderLit("ABCDEFGH"), false);
  assert.equal(meanderDim("ABCDEFGH"), true);
  assert.equal(meanderCopy("LIVE"), "LIVE");
  assert.equal(meanderLit({ balance: 1 }), false);
  assert.equal(meanderLit({ totpEnabled: "LIVE" }), true);
  assert.equal(meanderLit(meanderSlice({ totpEnabled: true, balance: 9 })), true);
  const rows: MeanderRow[] = [
    { id: "1", label: "Ada", code: "LIVE" },
    { id: "2", label: "Bea", code: "HOLD" },
  ];
  assert.equal(leadingMeander(rows), "live");
  assert.equal(leadingMeanderHue(rows), "gilt");
  assert.match(meanderLanesCsv(rows), /live,1/);
  assert.match(meanderRowsCsv(rows, ["1"]), /Ada,LIVE/);
  assert.match(meanderRowsCsv(rows, ["1"]), /,1$/m);
  assert.match(meanderRowsCsv(rows, ["1"]), /^name,mark,lane,hue,reviewed/m);

  assert.equal(crmv4Text("en", "bcrTitle"), ROUND403_COPY.en.bcrTitle);
  assert.equal(crmv4Text("tr", "mndTitle"), ROUND403_COPY.tr.mndTitle);
  assert.equal(crmv4Text("de", "bcrHint"), ROUND403_COPY.de.bcrHint);
  assert.equal(crmv4Text("ru", "pinnedTondoKicker"), ROUND403_COPY.ru.pinnedTondoKicker);
  assert.equal(crmv4Text("ar", "churnFestoonLead"), ROUND403_COPY.ar.churnFestoonLead);
  const keys = Object.keys(ROUND403_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND403_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-bucrane/);
  assert.match(css, /\.c4-meander/);
  assert.match(css, /\.c4-bucrane-column/);
  assert.match(css, /\.c4-meander-column/);
  assert.match(css, /\.c4-pinned-tondo/);
  assert.match(css, /\.c4-churn-festoon/);
  assert.match(css, /\.c4-pinned-tondo-mast/);
  assert.match(css, /\.c4-churn-festoon-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round403.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.equal(viewFile.includes("totpSecret"), false);
  assert.match(viewFile, /meanderSlice/);
  assert.match(viewFile, /bucraneCsv/);
  assert.match(viewFile, /meanderRowsCsv/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "x"/);
  assert.match(viewFile, /event\.key === "a"/);
  assert.match(viewFile, /event\.key === "c"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=24&meta=0/);
  assert.match(viewFile, /data-bucrane/);
  assert.match(viewFile, /data-meander/);
  assert.match(viewFile, /data-desk/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestBucraneBed/);
  assert.match(viewFile, /c4-meander-search/);
  assert.match(viewFile, /bucraneTimeline/);
  assert.match(viewFile, /c4-bucrane-notices/);
  assert.match(viewFile, /from "@\/lib\/crmv4\/round403"/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "bcr"/);
  assert.match(app, /view === "mnd"/);
  const panels = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round11.tsx"), "utf8");
  assert.match(panels, /c4-pinned-tondo/);
  assert.match(panels, /c4-pinned-tondo-mast/);
  assert.match(panels, /data-logo="mono"/);
  assert.match(panels, /pinnedTondoKicker/);
  assert.match(panels, /pinnedTondoLead/);
  assert.match(panels, /data-pinned-tondo/);
  assert.match(panels, /c4-churn-festoon/);
  assert.match(panels, /c4-churn-festoon-mast/);
  assert.match(panels, /churnFestoonKicker/);
  assert.match(panels, /churnFestoonLead/);
  assert.match(panels, /data-churn-festoon/);
  const namedKeys = `${viewFile}\n${panels}`.match(/"(bcr|mnd|pinnedTondo|churnFestoon)[A-Z][A-Za-z0-9]*"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND403_COPY.en[key as keyof typeof ROUND403_COPY.en], "string", key);
  console.log("crmv4 round403 tests passed");
}

main();
