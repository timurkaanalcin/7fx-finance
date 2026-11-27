/**
 * Euthynteria courses, geison address plates, the graphite city scotia, and the ivory shift torus.
 * Run: TZ=UTC npx tsx tests/crmv4-round400.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND400_COPY } from "../src/lib/crmv4/copy-round400";
import { ROUND399_FEATURES } from "../src/lib/crmv4/round399";
import {
  ROUND400_FEATURES,
  activeBed,
  activeDepth,
  activeHour,
  activeProfile,
  addEuthynteria,
  addEuthynteriaView,
  geisonBlank,
  geisonCopy,
  geisonDark,
  geisonDigit,
  geisonDim,
  geisonEven,
  geisonFade,
  geisonFar,
  geisonHue,
  geisonLanesCsv,
  geisonLength,
  geisonLetter,
  geisonLit,
  geisonNear,
  geisonOpen,
  geisonRowsCsv,
  geisonUpper,
  briskEuthynteria,
  depthCount,
  dropEuthynteriaView,
  fairHand,
  fullDepth,
  giltQuiet,
  idleEuthynteria,
  lateEuthynteria,
  leadingGeison,
  leadingGeisonHue,
  midDepth,
  moveEuthynteriaFocus,
  euthynteriaBed,
  euthynteriaHour,
  euthynteriaTimeline,
  overdueEuthynteria,
  profileBand,
  profileCool,
  profileGap,
  profilePoint,
  profileWarm,
  readEuthynteriaViews,
  reminderEuthynteriaList,
  restingEuthynteria,
  suggestEuthynteriaBed,
  suggestEuthynteriaHour,
  suggestProfile,
  type Euthynteria,
  type GeisonRow,
} from "../src/lib/crmv4/round400";

function course(partial: Partial<Euthynteria> & { id: string; title: string }): Euthynteria {
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
  assert.equal(ROUND400_FEATURES.length, 25);
  assert.equal(new Set(ROUND400_FEATURES).size, 25);
  for (const feature of ROUND400_FEATURES) assert.equal((ROUND399_FEATURES as readonly string[]).includes(feature), false, feature);
  const libDir = path.join(__dirname, "../src/lib/crmv4");
  for (const feature of ROUND400_FEATURES) {
    const needle = `"${feature}"`;
    for (const file of fs.readdirSync(libDir)) {
      if (!file.endsWith(".ts") || file === "round400.ts") continue;
      const body = fs.readFileSync(path.join(libDir, file), "utf8");
      assert.equal(body.includes(needle), false, `${feature} in ${file}`);
    }
  }

  assert.equal(profilePoint(" euthynteria "), "euthynteria");
  assert.equal(profilePoint("jasper"), "");
  assert.equal(euthynteriaHour("2"), 2);
  assert.equal(euthynteriaHour(5), 5);
  assert.equal(euthynteriaHour(8), 8);
  assert.equal(euthynteriaHour(14), 14);
  assert.equal(euthynteriaHour("3"), null);
  assert.equal(euthynteriaHour("9"), null);
  assert.equal(depthCount("2"), 2);
  assert.equal(depthCount(5), 5);
  assert.equal(depthCount("8"), 8);
  assert.equal(depthCount("1"), null);
  assert.equal(depthCount("4"), null);
  assert.equal(euthynteriaBed("ivory"), "IVORY");
  assert.equal(euthynteriaBed("graphite"), "GRAPHITE");
  assert.equal(euthynteriaBed("gilt"), "GILT");
  assert.equal(euthynteriaBed("gold"), "");
  assert.equal(profileWarm("euthynteria"), true);
  assert.equal(profileWarm("TOICHOBATE"), true);
  assert.equal(profileWarm("anta"), false);
  assert.equal(profileCool("anta"), true);
  assert.equal(profileCool("respond"), true);
  assert.equal(profileCool("euthynteria"), false);
  assert.equal(profileBand("euthynteria"), "first");
  assert.equal(profileBand("toichobate"), "second");
  assert.equal(profileBand("anta"), "third");
  assert.equal(profileBand("respond"), "fourth");
  assert.equal(profileGap("euthynteria", "respond"), 3);
  assert.equal(profileGap("respond", "toichobate"), -2);
  assert.equal(profileGap("gold", "respond"), null);
  assert.equal(giltQuiet("gilt"), true);
  assert.equal(giltQuiet("ivory"), false);
  assert.equal(giltQuiet("graphite"), false);
  assert.equal(midDepth(5), true);
  assert.equal(midDepth(2), false);
  assert.equal(fullDepth(8), true);
  assert.equal(fullDepth(5), false);
  assert.equal(activeProfile("warm"), "warm");
  assert.equal(activeProfile("cool"), "cool");
  assert.equal(activeProfile("nope"), "all");
  assert.equal(activeHour(5), "5");
  assert.equal(activeHour(6), "all");
  assert.equal(activeBed("ivory", ["IVORY", "GRAPHITE", "GILT"]), "IVORY");
  assert.equal(activeDepth(8), "8");
  assert.equal(activeDepth(2), "2");
  assert.equal(activeDepth(1), "all");
  assert.equal(moveEuthynteriaFocus(0, 4, -1), 3);
  assert.equal(suggestProfile(2), "euthynteria");
  assert.equal(suggestProfile(6), "toichobate");
  assert.equal(suggestProfile(10), "anta");
  assert.equal(suggestProfile(15), "respond");
  assert.equal(suggestEuthynteriaHour([], 2), 2);
  assert.equal(suggestEuthynteriaHour([], 5), 5);
  assert.equal(suggestEuthynteriaHour([], 6), 5);
  assert.equal(suggestEuthynteriaHour([], 10), 8);
  assert.equal(suggestEuthynteriaHour([], 16), 14);
  const base = [
    course({ id: "a", title: "Ada", bed: "IVORY", profile: "euthynteria", hour: 2, hand: "Nia" }),
    course({ id: "b", title: "Bea", bed: "IVORY", profile: "respond", hour: 5, hand: "Nia" }),
  ];
  assert.equal(suggestEuthynteriaBed(base), "GRAPHITE");
  assert.equal(suggestEuthynteriaHour(base, 4), 8);
  assert.equal(fairHand(base, "Nia,Omar"), "Omar");

  const saved = addEuthynteria([], { title: "  Course  ", profile: "anta", hour: 14, bed: "graphite", depth: 8, tags: "n r n x" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].profile, "anta");
  assert.equal(saved[0].hour, 14);
  assert.equal(saved[0].bed, "GRAPHITE");
  assert.equal(saved[0].depth, 8);
  assert.deepEqual(saved[0].tags, ["n", "r"]);
  assert.equal(saved[0].audit, "save");
  assert.equal(addEuthynteria(saved, { title: "Course" }).length, 1);

  const views = addEuthynteriaView([], { id: "v1", name: "Quiet", rack: "base", query: "", hand: "", bed: "graphite", profile: "warm", hour: "2", depth: "5" });
  assert.equal(readEuthynteriaViews(views)[0].bed, "GRAPHITE");
  assert.equal(readEuthynteriaViews(views)[0].profile, "warm");
  assert.equal(readEuthynteriaViews(views)[0].rack, "base");
  assert.equal(dropEuthynteriaView(views, "v1").length, 0);

  const late = course({ id: "l", title: "Late", profile: "euthynteria" });
  const idle = course({ id: "i", title: "Idle", hour: 2 });
  const brisk = course({ id: "r", title: "Brisk", bed: "GILT", hour: 14, depth: 8 });
  const rest = course({ id: "s", title: "Rest", profile: "anta", bed: "IVORY", hour: 5 });
  const due = course({ id: "d", title: "Due", profile: "respond", depth: 2 });
  assert.equal(lateEuthynteria(late, "respond"), true);
  assert.equal(lateEuthynteria(late, "euthynteria"), false);
  assert.equal(idleEuthynteria(idle), true);
  assert.equal(briskEuthynteria(brisk), true);
  assert.equal(restingEuthynteria(rest), true);
  assert.equal(overdueEuthynteria(due), true);
  assert.deepEqual(reminderEuthynteriaList([due, late]), ["Due"]);
  const timeline = euthynteriaTimeline([course({ id: "t", title: "Ten", hour: 5 })]);
  assert.equal(timeline[0].hour, 5);
  assert.deepEqual(timeline[0].titles, ["Ten"]);

  assert.equal(geisonLit("ROUTE"), true);
  assert.equal(geisonLit(true), true);
  assert.equal(geisonNear("10"), true);
  assert.equal(geisonNear("1"), false);
  assert.equal(geisonFar("ab"), true);
  assert.equal(geisonFar("50"), false);
  assert.equal(geisonFade("A".repeat(18)), true);
  assert.equal(geisonFade("1000"), true);
  assert.equal(geisonDim("HOLD"), true);
  assert.equal(geisonDim("WAIT"), true);
  assert.equal(geisonDark("SHUT"), true);
  assert.equal(geisonDark(false), true);
  assert.equal(geisonBlank("NONE"), true);
  assert.equal(geisonOpen(""), true);
  assert.equal(geisonHue("ROUTE"), "gilt");
  assert.equal(geisonHue("SHUT"), "ash");
  assert.equal(geisonHue("HOLD"), "pearl");
  assert.equal(geisonLength("LIVE"), 4);
  assert.equal(geisonEven("LIVE"), true);
  assert.equal(geisonDigit("12night"), true);
  assert.equal(geisonLetter("ROUTE"), true);
  assert.equal(geisonUpper("ISTANBUL"), true);
  assert.equal(geisonUpper("LIVE"), false);
  assert.equal(geisonLit("ABCDEFGH"), false);
  assert.equal(geisonDim("ABCDEFGH"), true);
  assert.equal(geisonLit("10.0.0.1"), true);
  assert.equal(geisonLit("1.2.3"), false);
  assert.equal(geisonLit("abcdefghijklmnopqr"), false);
  assert.equal(geisonCopy("ROUTE"), "ROUTE");
  assert.equal(geisonLit({ balance: 1 }), false);
  assert.equal(geisonLit({ lastIp: "ROUTE" }), true);
  const rows: GeisonRow[] = [
    { id: "1", label: "Ada", code: "ROUTE" },
    { id: "2", label: "Bea", code: "HOLD" },
  ];
  assert.equal(leadingGeison(rows), "route");
  assert.equal(leadingGeisonHue(rows), "gilt");
  assert.match(geisonLanesCsv(rows), /route,1/);
  assert.match(geisonRowsCsv(rows, ["1"]), /Ada,ROUTE/);
  assert.match(geisonRowsCsv(rows, ["1"]), /,1$/m);
  assert.match(geisonRowsCsv(rows, ["1"]), /^name,address,lane,hue,reviewed/m);

  assert.equal(crmv4Text("en", "eutTitle"), ROUND400_COPY.en.eutTitle);
  assert.equal(crmv4Text("tr", "geoTitle"), ROUND400_COPY.tr.geoTitle);
  assert.equal(crmv4Text("de", "eutHint"), ROUND400_COPY.de.eutHint);
  assert.equal(crmv4Text("ru", "cityScotiaKicker"), ROUND400_COPY.ru.cityScotiaKicker);
  assert.equal(crmv4Text("ar", "shiftTorusLead"), ROUND400_COPY.ar.shiftTorusLead);
  const keys = Object.keys(ROUND400_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND400_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-euthynteria/);
  assert.match(css, /\.c4-geison/);
  assert.match(css, /\.c4-euthynteria-column/);
  assert.match(css, /\.c4-geison-column/);
  assert.match(css, /\.c4-desk-city-scotia/);
  assert.match(css, /\.c4-desk-shift-torus/);
  assert.match(css, /\.c4-desk-city-scotia-mast/);
  assert.match(css, /\.c4-desk-shift-torus-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round400.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /row\.lastIp/);
  assert.match(viewFile, /euthynteriaCsv/);
  assert.match(viewFile, /geisonRowsCsv/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "x"/);
  assert.match(viewFile, /event\.key === "a"/);
  assert.match(viewFile, /event\.key === "c"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=24&meta=0/);
  assert.match(viewFile, /data-euthynteria/);
  assert.match(viewFile, /data-geison/);
  assert.match(viewFile, /data-desk/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestEuthynteriaBed/);
  assert.match(viewFile, /c4-geison-search/);
  assert.match(viewFile, /euthynteriaTimeline/);
  assert.match(viewFile, /c4-euthynteria-notices/);
  assert.match(viewFile, /from "@\/lib\/crmv4\/round400"/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "eut"/);
  assert.match(app, /view === "geo"/);
  const panels = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round11.tsx"), "utf8");
  assert.match(panels, /c4-desk-city-scotia/);
  assert.match(panels, /c4-desk-city-scotia-mast/);
  assert.match(panels, /data-logo="mono"/);
  assert.match(panels, /cityScotiaKicker/);
  assert.match(panels, /cityScotiaLead/);
  assert.match(panels, /data-desk-city-scotia/);
  assert.match(panels, /c4-desk-shift-torus/);
  assert.match(panels, /c4-desk-shift-torus-mast/);
  assert.match(panels, /shiftTorusKicker/);
  assert.match(panels, /shiftTorusLead/);
  assert.match(panels, /data-desk-shift-torus/);
  const namedKeys = `${viewFile}\n${panels}`.match(/"(eut|geo|cityScotia|shiftTorus)[A-Z][A-Za-z0-9]*"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND400_COPY.en[key as keyof typeof ROUND400_COPY.en], "string", key);
  console.log("crmv4 round400 tests passed");
}

main();
