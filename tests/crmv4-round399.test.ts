/**
 * Orthostate courses, apophyge region plates, the graphite announce crocket, and the ivory greeting quatrefoil.
 * Run: TZ=UTC npx tsx tests/crmv4-round399.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND399_COPY } from "../src/lib/crmv4/copy-round399";
import { ROUND398_FEATURES } from "../src/lib/crmv4/round398";
import {
  ROUND399_FEATURES,
  activeBed,
  activeDepth,
  activeHour,
  activeProfile,
  addOrthostate,
  addOrthostateView,
  apophygeBlank,
  apophygeCopy,
  apophygeDark,
  apophygeDigit,
  apophygeDim,
  apophygeEven,
  apophygeFade,
  apophygeFar,
  apophygeHue,
  apophygeLanesCsv,
  apophygeLength,
  apophygeLetter,
  apophygeLit,
  apophygeNear,
  apophygeOpen,
  apophygeRowsCsv,
  apophygeUpper,
  briskOrthostate,
  depthCount,
  dropOrthostateView,
  fairHand,
  fullDepth,
  giltQuiet,
  idleOrthostate,
  lateOrthostate,
  leadingApophyge,
  leadingApophygeHue,
  midDepth,
  moveOrthostateFocus,
  orthostateBed,
  orthostateHour,
  orthostateTimeline,
  overdueOrthostate,
  profileBand,
  profileCool,
  profileGap,
  profilePoint,
  profileWarm,
  readOrthostateViews,
  reminderOrthostateList,
  restingOrthostate,
  suggestOrthostateBed,
  suggestOrthostateHour,
  suggestProfile,
  type Orthostate,
  type ApophygeRow,
} from "../src/lib/crmv4/round399";

function course(partial: Partial<Orthostate> & { id: string; title: string }): Orthostate {
  return {
    note: "",
    hand: "",
    profile: "",
    hour: null,
    bed: "",
    depth: 1,
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
  assert.equal(ROUND399_FEATURES.length, 25);
  assert.equal(new Set(ROUND399_FEATURES).size, 25);
  for (const feature of ROUND399_FEATURES) assert.equal((ROUND398_FEATURES as readonly string[]).includes(feature), false, feature);
  const libDir = path.join(__dirname, "../src/lib/crmv4");
  for (const feature of ROUND399_FEATURES) {
    const needle = `"${feature}"`;
    for (const file of fs.readdirSync(libDir)) {
      if (!file.endsWith(".ts") || file === "round399.ts") continue;
      const body = fs.readFileSync(path.join(libDir, file), "utf8");
      assert.equal(body.includes(needle), false, `${feature} in ${file}`);
    }
  }

  assert.equal(profilePoint(" orthostate "), "orthostate");
  assert.equal(profilePoint("jasper"), "");
  assert.equal(orthostateHour("3"), 3);
  assert.equal(orthostateHour(6), 6);
  assert.equal(orthostateHour(9), 9);
  assert.equal(orthostateHour(15), 15);
  assert.equal(orthostateHour("4"), null);
  assert.equal(orthostateHour("8"), null);
  assert.equal(depthCount("1"), 1);
  assert.equal(depthCount(4), 4);
  assert.equal(depthCount("7"), 7);
  assert.equal(depthCount("2"), null);
  assert.equal(depthCount("5"), null);
  assert.equal(orthostateBed("ivory"), "IVORY");
  assert.equal(orthostateBed("graphite"), "GRAPHITE");
  assert.equal(orthostateBed("gilt"), "GILT");
  assert.equal(orthostateBed("gold"), "");
  assert.equal(profileWarm("orthostate"), true);
  assert.equal(profileWarm("ENTASIS"), true);
  assert.equal(profileWarm("arris"), false);
  assert.equal(profileCool("arris"), true);
  assert.equal(profileCool("fluting"), true);
  assert.equal(profileCool("orthostate"), false);
  assert.equal(profileBand("orthostate"), "first");
  assert.equal(profileBand("entasis"), "second");
  assert.equal(profileBand("arris"), "third");
  assert.equal(profileBand("fluting"), "fourth");
  assert.equal(profileGap("orthostate", "fluting"), 3);
  assert.equal(profileGap("fluting", "entasis"), -2);
  assert.equal(profileGap("gold", "fluting"), null);
  assert.equal(giltQuiet("gilt"), true);
  assert.equal(giltQuiet("ivory"), false);
  assert.equal(giltQuiet("graphite"), false);
  assert.equal(midDepth(4), true);
  assert.equal(midDepth(1), false);
  assert.equal(fullDepth(7), true);
  assert.equal(fullDepth(4), false);
  assert.equal(activeProfile("warm"), "warm");
  assert.equal(activeProfile("cool"), "cool");
  assert.equal(activeProfile("nope"), "all");
  assert.equal(activeHour(6), "6");
  assert.equal(activeHour(8), "all");
  assert.equal(activeBed("ivory", ["IVORY", "GRAPHITE", "GILT"]), "IVORY");
  assert.equal(activeDepth(7), "7");
  assert.equal(activeDepth(1), "1");
  assert.equal(activeDepth(2), "all");
  assert.equal(moveOrthostateFocus(0, 4, -1), 3);
  assert.equal(suggestProfile(2), "orthostate");
  assert.equal(suggestProfile(6), "entasis");
  assert.equal(suggestProfile(10), "arris");
  assert.equal(suggestProfile(15), "fluting");
  assert.equal(suggestOrthostateHour([], 2), 3);
  assert.equal(suggestOrthostateHour([], 5), 3);
  assert.equal(suggestOrthostateHour([], 6), 6);
  assert.equal(suggestOrthostateHour([], 10), 9);
  assert.equal(suggestOrthostateHour([], 16), 15);
  const base = [
    course({ id: "a", title: "Ada", bed: "IVORY", profile: "orthostate", hour: 3, hand: "Nia" }),
    course({ id: "b", title: "Bea", bed: "IVORY", profile: "fluting", hour: 6, hand: "Nia" }),
  ];
  assert.equal(suggestOrthostateBed(base), "GRAPHITE");
  assert.equal(suggestOrthostateHour(base, 4), 9);
  assert.equal(fairHand(base, "Nia,Omar"), "Omar");

  const saved = addOrthostate([], { title: "  Course  ", profile: "arris", hour: 15, bed: "graphite", depth: 7, tags: "o a o x" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].profile, "arris");
  assert.equal(saved[0].hour, 15);
  assert.equal(saved[0].bed, "GRAPHITE");
  assert.equal(saved[0].depth, 7);
  assert.deepEqual(saved[0].tags, ["o", "a"]);
  assert.equal(saved[0].audit, "save");
  assert.equal(addOrthostate(saved, { title: "Course" }).length, 1);

  const views = addOrthostateView([], { id: "v1", name: "Quiet", rack: "base", query: "", hand: "", bed: "graphite", profile: "warm", hour: "3", depth: "4" });
  assert.equal(readOrthostateViews(views)[0].bed, "GRAPHITE");
  assert.equal(readOrthostateViews(views)[0].profile, "warm");
  assert.equal(readOrthostateViews(views)[0].rack, "base");
  assert.equal(dropOrthostateView(views, "v1").length, 0);

  const late = course({ id: "l", title: "Late", profile: "orthostate" });
  const idle = course({ id: "i", title: "Idle", hour: 3 });
  const brisk = course({ id: "r", title: "Brisk", bed: "GILT", hour: 15, depth: 7 });
  const rest = course({ id: "s", title: "Rest", profile: "arris", bed: "IVORY", hour: 6 });
  const due = course({ id: "d", title: "Due", profile: "fluting", depth: 1 });
  assert.equal(lateOrthostate(late, "fluting"), true);
  assert.equal(lateOrthostate(late, "orthostate"), false);
  assert.equal(idleOrthostate(idle), true);
  assert.equal(briskOrthostate(brisk), true);
  assert.equal(restingOrthostate(rest), true);
  assert.equal(overdueOrthostate(due), true);
  assert.deepEqual(reminderOrthostateList([due, late]), ["Due"]);
  const timeline = orthostateTimeline([course({ id: "t", title: "Ten", hour: 6 })]);
  assert.equal(timeline[0].hour, 6);
  assert.deepEqual(timeline[0].titles, ["Ten"]);

  assert.equal(apophygeLit("BELT"), true);
  assert.equal(apophygeLit(true), true);
  assert.equal(apophygeNear("100"), true);
  assert.equal(apophygeNear("1"), false);
  assert.equal(apophygeFar("ab"), true);
  assert.equal(apophygeFar("50"), false);
  assert.equal(apophygeFade("A".repeat(16)), true);
  assert.equal(apophygeFade("10000"), true);
  assert.equal(apophygeDim("HOLD"), true);
  assert.equal(apophygeDim("WAIT"), true);
  assert.equal(apophygeDark("SHUT"), true);
  assert.equal(apophygeDark(false), true);
  assert.equal(apophygeBlank("NONE"), true);
  assert.equal(apophygeOpen(""), true);
  assert.equal(apophygeHue("BELT"), "gilt");
  assert.equal(apophygeHue("SHUT"), "ash");
  assert.equal(apophygeHue("HOLD"), "pearl");
  assert.equal(apophygeLength("LIVE"), 4);
  assert.equal(apophygeEven("LIVE"), true);
  assert.equal(apophygeDigit("12night"), true);
  assert.equal(apophygeLetter("BELT"), true);
  assert.equal(apophygeUpper("ISTANBUL"), true);
  assert.equal(apophygeUpper("BELT"), false);
  assert.equal(apophygeLit("ABCDEFGH"), false);
  assert.equal(apophygeDim("ABCDEFGH"), true);
  assert.equal(apophygeLit("belt-note"), true);
  assert.equal(apophygeLit("a-b"), false);
  assert.equal(apophygeLit("clh0abc123def456"), false);
  assert.equal(apophygeCopy("BELT"), "BELT");
  assert.equal(apophygeLit({ balance: 1 }), false);
  assert.equal(apophygeLit({ lastRegion: "BELT" }), true);
  const rows: ApophygeRow[] = [
    { id: "1", label: "Ada", code: "BELT" },
    { id: "2", label: "Bea", code: "HOLD" },
  ];
  assert.equal(leadingApophyge(rows), "belt");
  assert.equal(leadingApophygeHue(rows), "gilt");
  assert.match(apophygeLanesCsv(rows), /belt,1/);
  assert.match(apophygeRowsCsv(rows, ["1"]), /Ada,BELT/);
  assert.match(apophygeRowsCsv(rows, ["1"]), /,1$/m);
  assert.match(apophygeRowsCsv(rows, ["1"]), /^name,region,lane,hue,reviewed/m);

  assert.equal(crmv4Text("en", "ortTitle"), ROUND399_COPY.en.ortTitle);
  assert.equal(crmv4Text("tr", "apoTitle"), ROUND399_COPY.tr.apoTitle);
  assert.equal(crmv4Text("de", "ortHint"), ROUND399_COPY.de.ortHint);
  assert.equal(crmv4Text("ru", "announceCrocketKicker"), ROUND399_COPY.ru.announceCrocketKicker);
  assert.equal(crmv4Text("ar", "greetingQuatrefoilLead"), ROUND399_COPY.ar.greetingQuatrefoilLead);
  const keys = Object.keys(ROUND399_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND399_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-orthostate/);
  assert.match(css, /\.c4-apophyge/);
  assert.match(css, /\.c4-orthostate-column/);
  assert.match(css, /\.c4-apophyge-column/);
  assert.match(css, /\.c4-announce-crocket/);
  assert.match(css, /\.c4-greeting-quatrefoil/);
  assert.match(css, /\.c4-announce-crocket-mast/);
  assert.match(css, /\.c4-greeting-quatrefoil-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round399.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /row\.lastRegion/);
  assert.match(viewFile, /orthostateCsv/);
  assert.match(viewFile, /apophygeRowsCsv/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "x"/);
  assert.match(viewFile, /event\.key === "a"/);
  assert.match(viewFile, /event\.key === "c"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=24&meta=0/);
  assert.match(viewFile, /data-orthostate/);
  assert.match(viewFile, /data-apophyge/);
  assert.match(viewFile, /data-desk/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestOrthostateBed/);
  assert.match(viewFile, /c4-apophyge-search/);
  assert.match(viewFile, /orthostateTimeline/);
  assert.match(viewFile, /c4-orthostate-notices/);
  assert.match(viewFile, /from "@\/lib\/crmv4\/round399"/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "ort"/);
  assert.match(app, /view === "apo"/);
  const panels = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round11.tsx"), "utf8");
  assert.match(panels, /c4-announce-crocket/);
  assert.match(panels, /c4-announce-crocket-mast/);
  assert.match(panels, /data-logo="mono"/);
  assert.match(panels, /announceCrocketKicker/);
  assert.match(panels, /announceCrocketLead/);
  assert.match(panels, /data-announce-crocket/);
  assert.match(panels, /c4-greeting-quatrefoil/);
  assert.match(panels, /c4-greeting-quatrefoil-mast/);
  assert.match(panels, /greetingQuatrefoilKicker/);
  assert.match(panels, /greetingQuatrefoilLead/);
  assert.match(panels, /data-greeting-quatrefoil/);
  assert.match(panels, /c4-glossary-keystone/);
  assert.match(panels, /c4-whats-patera/);
  const namedKeys = `${viewFile}\n${panels}`.match(/"(ort|apo|announceCrocket|greetingQuatrefoil)[A-Z][A-Za-z0-9]*"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND399_COPY.en[key as keyof typeof ROUND399_COPY.en], "string", key);
  console.log("crmv4 round399 tests passed");
}

main();
