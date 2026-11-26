/**
 * Ciselé strokes, intaglio logins, the pearl split-list socle, and the ink fold archivolt.
 * Run: TZ=UTC npx tsx tests/crmv4-round379.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND379_COPY } from "../src/lib/crmv4/copy-round379";
import { ROUND378_FEATURES } from "../src/lib/crmv4/round378";
import {
  ROUND379_FEATURES,
  activeGlaze,
  activeStroke,
  activeBead,
  activeSpan,
  addCisele,
  briskCisele,
  ciseleTimeline,
  dropCiseleView,
  fairChisel,
  fullBead,
  inkQuiet,
  itgBare,
  itgBrief,
  itgDesk,
  itgDigit,
  itgEven,
  itgFirst,
  itgHue,
  itgLane,
  itgLanesCsv,
  itgLater,
  itgLength,
  itgLine,
  itgLower,
  itgOpen,
  itgPair,
  itgReturn,
  itgRowsCsv,
  itgScope,
  itgShut,
  itgSoon,
  itgSpace,
  itgSpanLane,
  itgUpper,
  itgVowel,
  itgVowelLane,
  strokeBand,
  strokeCool,
  strokeGlaze,
  strokeGap,
  strokePoint,
  strokeBead,
  strokeSpan,
  strokeWarm,
  idleCisele,
  lateCisele,
  leadingItg,
  leadingItgHue,
  moveCiseleFocus,
  overdueCisele,
  pairBead,
  readCiseleViews,
  reminderCiseles,
  restingCisele,
  suggestGlaze,
  suggestStroke,
  suggestSpan,
  type Cisele,
  type ItgRow,
} from "../src/lib/crmv4/round379";

function rule(partial: Partial<Cisele> & { id: string; title: string }): Cisele {
  return {
    note: "",
    chisel: "",
    stroke: "",
    sla: null,
    glaze: "",
    bead: 3,
    tags: [],
    raised: false,
    clamped: false,
    chested: false,
    starred: false,
    audit: "",
    ...partial,
  };
}

function main() {
  assert.equal(ROUND379_FEATURES.length, 25);
  assert.equal(new Set(ROUND379_FEATURES).size, 25);
  for (const feature of ROUND379_FEATURES) assert.equal((ROUND378_FEATURES as readonly string[]).includes(feature), false, feature);
  assert.equal(strokePoint(" trace "), "trace");
  assert.equal(strokePoint("brass"), "");
  assert.equal(strokeSpan("8"), 8);
  assert.equal(strokeSpan(16), 16);
  assert.equal(strokeSpan(32), 32);
  assert.equal(strokeSpan(64), 64);
  assert.equal(strokeSpan("15"), null);
  assert.equal(strokeSpan("4"), null);
  assert.equal(strokeBead("2"), 2);
  assert.equal(strokeBead(4), 4);
  assert.equal(strokeBead("6"), 6);
  assert.equal(strokeBead("3"), null);
  assert.equal(strokeBead("8"), null);
  assert.equal(strokeGlaze("pearl"), "PEARL");
  assert.equal(strokeGlaze("ink"), "INK");
  assert.equal(strokeGlaze("gilt"), "GILT");
  assert.equal(strokeGlaze("gold"), "");
  assert.equal(strokeWarm("trace"), true);
  assert.equal(strokeWarm("BEVEL"), true);
  assert.equal(strokeWarm("point"), false);
  assert.equal(strokeCool("point"), true);
  assert.equal(strokeCool("flare"), true);
  assert.equal(strokeCool("trace"), false);
  assert.equal(strokeBand("trace"), "first");
  assert.equal(strokeBand("bevel"), "second");
  assert.equal(strokeBand("point"), "third");
  assert.equal(strokeBand("flare"), "fourth");
  assert.equal(strokeGap("trace", "flare"), 3);
  assert.equal(inkQuiet("ink"), true);
  assert.equal(inkQuiet("pearl"), false);
  assert.equal(inkQuiet("gilt"), false);
  assert.equal(pairBead(4), true);
  assert.equal(pairBead(2), false);
  assert.equal(fullBead(6), true);
  assert.equal(fullBead(4), false);
  assert.equal(activeStroke("warm"), "warm");
  assert.equal(activeSpan("8"), "8");
  assert.equal(activeSpan("4"), "all");
  assert.equal(activeBead("6"), "6");
  assert.equal(activeBead("9"), "all");
  assert.equal(activeGlaze("pearl", ["PEARL"]), "PEARL");
  assert.equal(suggestStroke(4), "trace");
  assert.equal(suggestStroke(10), "bevel");
  assert.equal(suggestStroke(14), "point");
  assert.equal(suggestStroke(20), "flare");
  assert.equal(suggestSpan([], 1), 8);
  assert.equal(suggestSpan([], 6), 16);
  assert.equal(suggestSpan([], 11), 32);
  assert.equal(suggestSpan([], 16), 32);
  assert.equal(suggestSpan([], 19), 64);
  assert.equal(suggestGlaze([]), "PEARL");
  assert.equal(moveCiseleFocus(0, 3, 1), 1);
  assert.equal(moveCiseleFocus(0, 3, -1), 2);

  const saved = addCisele([], { id: "g1", title: "Trace cisele", chisel: "Ada", stroke: "trace", sla: 8, glaze: "pearl", bead: 2, tags: "e f x" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].glaze, "PEARL");
  assert.equal(saved[0].tags.join(""), "ef");
  assert.equal(saved[0].audit, "save");
  assert.equal(addCisele(saved, { title: "Trace cisele" }).length, 1);
  const flare = rule({ id: "n1", title: "Flare cisele", stroke: "flare", bead: 2 });
  assert.equal(overdueCisele(flare), true);
  assert.equal(reminderCiseles([flare])[0], "Flare cisele");
  assert.equal(idleCisele(rule({ id: "i1", title: "Idle", sla: 8, bead: 2 })), true);
  assert.equal(briskCisele(rule({ id: "b1", title: "Brisk", glaze: "GILT", sla: 64, bead: 6 })), true);
  assert.equal(restingCisele(rule({ id: "r1", title: "Rest", stroke: "flare", glaze: "PEARL", sla: 16 })), true);
  assert.equal(lateCisele(rule({ id: "l1", title: "Late", stroke: "trace" }), "flare"), true);
  assert.equal(lateCisele(rule({ id: "l2", title: "Held", stroke: "trace", raised: true }), "flare"), false);
  assert.equal(fairChisel([rule({ id: "a", title: "A", chisel: "Ada" }), rule({ id: "b", title: "B", chisel: "Bea", raised: true })], "Ada,Bea"), "Bea");
  const timeline = ciseleTimeline([rule({ id: "t", title: "Ten", sla: 8 })]);
  assert.equal(timeline[0].sla, 8);
  assert.equal(timeline[0].titles[0], "Ten");
  const views = readCiseleViews([{ id: "v1", name: "Flare deck", tray: "chest", query: "cisele", chisel: "Ada", glaze: "INK", stroke: "cool", sla: "64", bead: "6" }]);
  assert.equal(views[0].tray, "chest");
  assert.equal(views[0].stroke, "cool");
  assert.equal(dropCiseleView(views, "v1").length, 0);

  const now = Date.parse("2026-11-26T12:00:00Z");
  assert.equal(itgLane("MARK", now), "mark");
  assert.equal(itgLane("please login the desk", now), "mark");
  assert.equal(itgLane(true, now), "mark");
  assert.equal(itgLane(false, now), "bare");
  assert.equal(itgLane("WAIT", now), "desk");
  assert.equal(itgLane("LATER", now), "later");
  assert.equal(itgLane("BAD", now), "return");
  assert.equal(itgLane("TWIN", now), "pair");
  assert.equal(itgLane("TR+90", now), "pair");
  assert.equal(itgLane("hidden login", now), "shut");
  assert.equal(itgLane("ext:12", now), "scope");
  assert.equal(itgLane("ABCDE", now), "brief");
  assert.equal(itgLane("12night", now), "digit");
  assert.equal(itgLane("5551112233", now), "desk");
  assert.equal(itgLane("+905551112233", now), "mark");
  assert.equal(itgLane("AUSTRALIAXXXXXXX", now), "span");
  assert.equal(itgLane("Orange", now), "openv");
  assert.equal(itgLane("West", now), "bare");
  assert.equal(itgLane("2026-11-26T08:00:00Z", now), "mark");
  assert.equal(itgLane("2026-11-25T08:00:00Z", now), "desk");
  assert.equal(itgLane("2026-11-20T00:00:00Z", now), "later");
  assert.equal(itgLane("2026-11-01T08:00:00Z", now), "return");
  assert.equal(itgLane({ accountLoginId: "READY" }, now), "mark");
  assert.equal(itgLane({ name: "Ada" }, now), "");
  assert.equal(itgLane({ accountLoginId: "READY", amount: 1 }, now), "");
  assert.equal(itgHue("MARK", now), "gilt");
  assert.equal(itgHue("WAIT", now), "ink");
  assert.equal(itgHue("ABCDEF", now), "pearl");
  assert.equal(itgLine("MARK", now), true);
  assert.equal(itgDesk("WAIT", now), true);
  assert.equal(itgLater("LATER", now), true);
  assert.equal(itgReturn("BAD", now), true);
  assert.equal(itgShut("sealed", now), true);
  assert.equal(itgPair("TR+90", now), true);
  assert.equal(itgScope("ext:12", now), true);
  assert.equal(itgBrief("ABCDE", now), true);
  assert.equal(itgSpanLane("AUSTRALIAXXXXXXX", now), true);
  assert.equal(itgBare("West", now), true);
  assert.equal(itgOpen(""), true);
  assert.equal(itgSoon("ABCDE", now), true);
  assert.equal(itgSoon("WEST", now), false);
  assert.equal(itgLength("ABCDE"), 5);
  assert.equal(itgEven("MARK"), true);
  assert.equal(itgDigit("12night"), true);
  assert.equal(itgVowel("Orange"), true);
  assert.equal(itgVowelLane("Orange", now), true);
  assert.equal(itgLower("spain"), true);
  assert.equal(itgUpper("SPAIN"), true);
  assert.equal(itgUpper("TR"), false);
  assert.equal(itgFirst("Spain"), true);
  assert.equal(itgSpace("new spain"), true);
  const rows: ItgRow[] = [
    { id: "1", label: "Ada", code: "MARK" },
    { id: "2", label: "Bea", code: "ABCDE" },
  ];
  assert.equal(leadingItg(rows), "mark");
  assert.equal(leadingItgHue(rows), "gilt");
  assert.match(itgLanesCsv(rows), /mark,1/);
  assert.match(itgRowsCsv(rows, ["1"]), /Ada,MARK/);
  assert.match(itgRowsCsv(rows, ["1"]), /,1$/m);

  assert.equal(crmv4Text("en", "cisTitle"), ROUND379_COPY.en.cisTitle);
  assert.equal(crmv4Text("tr", "itgTitle"), ROUND379_COPY.tr.itgTitle);
  assert.equal(crmv4Text("de", "cisHint"), ROUND379_COPY.de.cisHint);
  assert.equal(crmv4Text("ru", "slSocleKicker"), ROUND379_COPY.ru.slSocleKicker);
  assert.equal(crmv4Text("ar", "faArchivoltLead"), ROUND379_COPY.ar.faArchivoltLead);
  const keys = Object.keys(ROUND379_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND379_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-cisele/);
  assert.match(css, /\.c4-intaglio/);
  assert.match(css, /\.c4-cisele-column/);
  assert.match(css, /\.c4-intaglio-column/);
  assert.match(css, /\.c4-split-socle/);
  assert.match(css, /\.c4-fold-archivolt/);
  assert.match(css, /\.c4-split-socle-mast/);
  assert.match(css, /\.c4-fold-archivolt-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round379.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("babevel"), false);
  assert.match(viewFile, /accountLoginId:/);
  assert.match(viewFile, /ciseleCsv/);
  assert.match(viewFile, /itgRowsCsv/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "x"/);
  assert.match(viewFile, /event\.key === "a"/);
  assert.match(viewFile, /event\.key === "c"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=24&meta=0/);
  assert.match(viewFile, /data-cards/);
  assert.match(viewFile, /data-plates/);
  assert.match(viewFile, /data-names/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestGlaze/);
  assert.match(viewFile, /c4-intaglio-search/);
  assert.match(viewFile, /ciseleTimeline/);
  assert.match(viewFile, /c4-cisele-notices/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "cis"/);
  assert.match(app, /view === "itg"/);
  const desk = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round12.tsx"), "utf8");
  assert.match(desk, /c4-split-socle/);
  assert.match(desk, /c4-split-socle-mast/);
  assert.match(desk, /data-logo="mono"/);
  assert.match(desk, /slSocleKicker/);
  assert.match(desk, /slSocleLead/);
  assert.match(desk, /data-split-socle/);
  assert.match(desk, /c4-fold-archivolt/);
  assert.match(desk, /c4-fold-archivolt-mast/);
  assert.match(desk, /faArchivoltKicker/);
  assert.match(desk, /faArchivoltLead/);
  assert.match(desk, /data-fold-archivolt/);
  const namedKeys = `${viewFile}\n${desk}`.match(/"(cis|itg|slSocle|faArchivolt)[A-Za-z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND379_COPY.en[key as keyof typeof ROUND379_COPY.en], "string", key);
  console.log("crmv4 round379 tests passed");
}

main();
