/**
 * Tympanum courses, embrasure browser plates, the ivory email cincture, and the graphite edit merlon.
 * Run: TZ=UTC npx tsx tests/crmv4-round405.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND405_COPY } from "../src/lib/crmv4/copy-round405";
import { ROUND404_FEATURES } from "../src/lib/crmv4/round404";
import {
  ROUND405_FEATURES,
  activeBed,
  activeDepth,
  activeHour,
  activeProfile,
  addTympanum,
  addTympanumView,
  briskTympanum,
  depthCount,
  dropTympanumView,
  fairHand,
  fullDepth,
  idleTympanum,
  graphiteQuiet,
  lateTympanum,
  leadingEmbrasure,
  leadingEmbrasureHue,
  midDepth,
  moveTympanumFocus,
  overdueTympanum,
  embrasureBlank,
  embrasureCopy,
  embrasureDark,
  embrasureDigit,
  embrasureDim,
  embrasureEven,
  embrasureFade,
  embrasureFar,
  embrasureHue,
  embrasureLanesCsv,
  embrasureLength,
  embrasureLetter,
  embrasureLit,
  embrasureNear,
  embrasureOpen,
  embrasureRowsCsv,
  embrasureSlice,
  embrasureUpper,
  profileBand,
  profileCool,
  profileGap,
  profilePoint,
  profileWarm,
  readTympanumViews,
  reminderTympanumList,
  restingTympanum,
  tympanumBed,
  tympanumHour,
  tympanumTimeline,
  suggestProfile,
  suggestTympanumBed,
  suggestTympanumHour,
  type Tympanum,
  type EmbrasureRow,
} from "../src/lib/crmv4/round405";

function course(partial: Partial<Tympanum> & { id: string; title: string }): Tympanum {
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
  assert.equal(ROUND405_FEATURES.length, 25);
  assert.equal(new Set(ROUND405_FEATURES).size, 25);
  for (const feature of ROUND405_FEATURES) assert.equal((ROUND404_FEATURES as readonly string[]).includes(feature), false, feature);
  const libDir = path.join(__dirname, "../src/lib/crmv4");
  for (const feature of ROUND405_FEATURES) {
    const needle = `"${feature}"`;
    for (const file of fs.readdirSync(libDir)) {
      if (!file.endsWith(".ts") || file === "round405.ts") continue;
      const body = fs.readFileSync(path.join(libDir, file), "utf8");
      assert.equal(body.includes(needle), false, `${feature} in ${file}`);
    }
  }

  assert.equal(profilePoint(" tympanum "), "tympanum");
  assert.equal(profilePoint("jasper"), "");
  assert.equal(tympanumHour("3"), 3);
  assert.equal(tympanumHour(6), 6);
  assert.equal(tympanumHour(9), 9);
  assert.equal(tympanumHour(15), 15);
  assert.equal(tympanumHour("4"), null);
  assert.equal(tympanumHour("8"), null);
  assert.equal(depthCount("3"), 3);
  assert.equal(depthCount(6), 6);
  assert.equal(depthCount("9"), 9);
  assert.equal(depthCount("4"), null);
  assert.equal(depthCount("8"), null);
  assert.equal(tympanumBed("ivory"), "IVORY");
  assert.equal(tympanumBed("graphite"), "GRAPHITE");
  assert.equal(tympanumBed("gilt"), "GILT");
  assert.equal(tympanumBed("gold"), "");
  assert.equal(profileWarm("tympanum"), true);
  assert.equal(profileWarm("LUNETTE"), true);
  assert.equal(profileWarm("gablet"), false);
  assert.equal(profileCool("gablet"), true);
  assert.equal(profileCool("raking"), true);
  assert.equal(profileCool("tympanum"), false);
  assert.equal(profileBand("tympanum"), "first");
  assert.equal(profileBand("lunette"), "second");
  assert.equal(profileBand("gablet"), "third");
  assert.equal(profileBand("raking"), "fourth");
  assert.equal(profileGap("tympanum", "raking"), 3);
  assert.equal(profileGap("raking", "tympanum"), -3);
  assert.equal(profileGap("jasper", "tympanum"), null);
  assert.equal(graphiteQuiet("graphite"), true);
  assert.equal(graphiteQuiet("IVORY"), false);
  assert.equal(midDepth(6), true);
  assert.equal(midDepth(3), false);
  assert.equal(fullDepth(9), true);
  assert.equal(fullDepth(6), false);
  assert.equal(activeProfile("warm"), "warm");
  assert.equal(activeProfile("cool"), "cool");
  assert.equal(activeProfile("raking"), "raking");
  assert.equal(activeProfile("nope"), "all");
  assert.equal(activeHour("15"), "15");
  assert.equal(activeHour("4"), "all");
  assert.equal(activeDepth("9"), "9");
  assert.equal(activeDepth("1"), "all");
  assert.equal(activeBed("ivory", ["IVORY", "GRAPHITE"]), "IVORY");
  assert.equal(activeBed("gilt", ["IVORY"]), "all");
  assert.equal(moveTympanumFocus(0, 4, -1), 3);
  assert.equal(suggestProfile(2), "tympanum");
  assert.equal(suggestProfile(7), "lunette");
  assert.equal(suggestProfile(10), "gablet");
  assert.equal(suggestProfile(18), "raking");
  assert.equal(suggestTympanumHour([], 3), 3);
  assert.equal(suggestTympanumHour([], 7), 6);
  assert.equal(suggestTympanumHour([], 10), 9);
  assert.equal(suggestTympanumHour([], 16), 15);
  const saved = [
    course({ id: "a", title: "Ada", hour: 15 }),
    course({ id: "b", title: "Bea", hour: 6 }),
    course({ id: "c", title: "Cid", hour: 9 }),
  ];
  assert.equal(suggestTympanumHour(saved, 20), 3);
  assert.equal(suggestTympanumBed([course({ id: "g", title: "Gilt", bed: "GILT" })]), "GRAPHITE");
  assert.equal(fairHand([course({ id: "h", title: "Held", hand: "Nia" })], "Nia, Omar"), "Omar");

  const late = course({ id: "l", title: "Late", profile: "tympanum" });
  const overdue = course({ id: "o", title: "Over", profile: "raking", depth: 3 });
  const idle = course({ id: "i", title: "Idle", hour: 3, depth: 3, bed: "" });
  const brisk = course({ id: "b2", title: "Brisk", bed: "GRAPHITE", hour: 15, depth: 9 });
  const resting = course({ id: "r", title: "Rest", profile: "gablet", bed: "IVORY", hour: 6 });
  assert.equal(lateTympanum(late, "raking"), true);
  assert.equal(lateTympanum(late, "tympanum"), false);
  assert.equal(overdueTympanum(overdue), true);
  assert.equal(overdueTympanum({ ...overdue, raised: true }), false);
  assert.equal(idleTympanum(idle), true);
  assert.equal(briskTympanum(brisk), true);
  assert.equal(restingTympanum(resting), true);
  assert.deepEqual(reminderTympanumList([overdue, late]), ["Over"]);
  const added = addTympanum([], { title: "New course", profile: "lunette", hour: 6, depth: 6, bed: "ivory", tags: "t y x" });
  assert.equal(added.length, 1);
  assert.equal(added[0].profile, "lunette");
  assert.equal(added[0].hour, 6);
  assert.equal(added[0].depth, 6);
  assert.equal(added[0].bed, "IVORY");
  assert.deepEqual(added[0].tags, ["t", "y"]);
  assert.equal(addTympanum(added, { title: "New course" }).length, 1);
  const view = { id: "v", name: "Warm", rack: "base" as const, query: "", hand: "", bed: "", profile: "warm", hour: "", depth: "" };
  assert.equal(addTympanumView([], view).length, 1);
  assert.equal(dropTympanumView(addTympanumView([], view), "v").length, 0);
  assert.equal(readTympanumViews([{ ...view, name: "" }]).length, 0);
  const line = tympanumTimeline([course({ id: "t", title: "Tide", hour: 6 })]);
  assert.equal(line[0].hour, 6);
  assert.deepEqual(line[0].titles, ["Tide"]);

  assert.equal(embrasureLit("READY"), true);
  assert.equal(embrasureLit(true), true);
  assert.equal(embrasureLit(false), false);
  assert.equal(embrasureLit("CHROME"), true);
  assert.equal(embrasureLit("EDGE"), true);
  assert.equal(embrasureLit("OPEN"), false);
  assert.equal(embrasureNear("ABCDE"), true);
  assert.equal(embrasureNear("OPERA"), true);
  assert.equal(embrasureNear("ABCD"), false);
  assert.equal(embrasureFar("A"), true);
  assert.equal(embrasureFar("AB"), true);
  assert.equal(embrasureFar("ABC"), true);
  assert.equal(embrasureFar("ABCD"), false);
  assert.equal(embrasureFade("A".repeat(12)), true);
  assert.equal(embrasureFade("A".repeat(10)), false);
  assert.equal(embrasureDim("HOLD"), true);
  assert.equal(embrasureDim("WAIT"), true);
  assert.equal(embrasureDark("SHUT"), true);
  assert.equal(embrasureDark(false), true);
  assert.equal(embrasureBlank("NONE"), true);
  assert.equal(embrasureOpen(""), true);
  assert.equal(embrasureHue("READY"), "gilt");
  assert.equal(embrasureHue("SHUT"), "ash");
  assert.equal(embrasureHue("HOLD"), "pearl");
  assert.equal(embrasureLength("OPERA"), 5);
  assert.equal(embrasureEven("OPERA"), false);
  assert.equal(embrasureDigit("12night"), true);
  assert.equal(embrasureLetter("READY"), true);
  assert.equal(embrasureUpper("ISTANBUL"), true);
  assert.equal(embrasureUpper("OPEN"), false);
  assert.equal(embrasureLit("ABCDEFGH"), false);
  assert.equal(embrasureDim("ABCDEFGH"), true);
  assert.equal(embrasureCopy("READY"), "READY");
  assert.equal(embrasureLit({ balance: 1 }), false);
  assert.equal(embrasureLit({ lastBrowser: "READY" }), true);
  assert.equal(embrasureLit(embrasureSlice({ lastBrowser: true, balance: 9 })), true);
  const rows: EmbrasureRow[] = [
    { id: "1", label: "Ada", code: "READY" },
    { id: "2", label: "Bea", code: "HOLD" },
  ];
  assert.equal(leadingEmbrasure(rows), "live");
  assert.equal(leadingEmbrasureHue(rows), "gilt");
  assert.match(embrasureLanesCsv(rows), /live,1/);
  assert.match(embrasureRowsCsv(rows, ["1"]), /Ada,READY/);
  assert.match(embrasureRowsCsv(rows, ["1"]), /,1$/m);
  assert.match(embrasureRowsCsv(rows, ["1"]), /^name,mark,lane,hue,reviewed/m);

  assert.equal(crmv4Text("en", "tpnTitle"), ROUND405_COPY.en.tpnTitle);
  assert.equal(crmv4Text("tr", "ebrTitle"), ROUND405_COPY.tr.ebrTitle);
  assert.equal(crmv4Text("de", "tpnHint"), ROUND405_COPY.de.tpnHint);
  assert.equal(crmv4Text("ru", "emailCinctureKicker"), ROUND405_COPY.ru.emailCinctureKicker);
  assert.equal(crmv4Text("ar", "editMerlonLead"), ROUND405_COPY.ar.editMerlonLead);
  const keys = Object.keys(ROUND405_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND405_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-tympanum/);
  assert.match(css, /\.c4-embrasure/);
  assert.match(css, /\.c4-tympanum-column/);
  assert.match(css, /\.c4-embrasure-column/);
  assert.match(css, /\.c4-email-cincture/);
  assert.match(css, /\.c4-edit-merlon/);
  assert.match(css, /\.c4-email-cincture-mast/);
  assert.match(css, /\.c4-edit-merlon-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round405.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.equal(viewFile.includes("totpSecret"), false);
  assert.match(viewFile, /embrasureSlice/);
  assert.match(viewFile, /tympanumCsv/);
  assert.match(viewFile, /embrasureRowsCsv/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "x"/);
  assert.match(viewFile, /event\.key === "a"/);
  assert.match(viewFile, /event\.key === "c"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=24&meta=0/);
  assert.match(viewFile, /data-tympanum/);
  assert.match(viewFile, /data-embrasure/);
  assert.match(viewFile, /data-desk/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestTympanumBed/);
  assert.match(viewFile, /c4-embrasure-search/);
  assert.match(viewFile, /tympanumTimeline/);
  assert.match(viewFile, /c4-tympanum-notices/);
  assert.match(viewFile, /from "@\/lib\/crmv4\/round405"/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "tpn"/);
  assert.match(app, /view === "ebr"/);
  const panels = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round11.tsx"), "utf8");
  assert.match(panels, /c4-email-cincture/);
  assert.match(panels, /c4-email-cincture-mast/);
  assert.match(panels, /data-logo="mono"/);
  assert.match(panels, /emailCinctureKicker/);
  assert.match(panels, /emailCinctureLead/);
  assert.match(panels, /data-email-cincture/);
  assert.match(panels, /c4-edit-merlon/);
  assert.match(panels, /c4-edit-merlon-mast/);
  assert.match(panels, /editMerlonKicker/);
  assert.match(panels, /editMerlonLead/);
  assert.match(panels, /data-edit-merlon/);
  const namedKeys = `${viewFile}\n${panels}`.match(/"(tpn|ebr|emailCincture|editMerlon)[A-Z][A-Za-z0-9]*"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND405_COPY.en[key as keyof typeof ROUND405_COPY.en], "string", key);
  console.log("crmv4 round405 tests passed");
}

main();
