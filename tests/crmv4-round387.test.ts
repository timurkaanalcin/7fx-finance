/**
 * Cosmati bands, presence lamps, the graphite note quire, and the ivory week gazette.
 * Run: TZ=UTC npx tsx tests/crmv4-round387.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND387_COPY } from "../src/lib/crmv4/copy-round387";
import { ROUND386_FEATURES } from "../src/lib/crmv4/round386";
import {
  ROUND387_FEATURES,
  activeCourse,
  activeGround,
  activeHour,
  activeStone,
  addCosmati,
  addCosmatiView,
  briskCosmati,
  courseCount,
  dropCosmatiView,
  fairHand,
  fullCourse,
  idleCosmati,
  ivoryQuiet,
  lampBlank,
  lampCopy,
  lampDark,
  lampDigit,
  lampEven,
  lampFade,
  lampFar,
  lampDim,
  lampHue,
  lampLanesCsv,
  lampLength,
  lampLetter,
  lampLit,
  lampNear,
  lampOpen,
  lampRowsCsv,
  lampUpper,
  lateCosmati,
  leadingLamp,
  leadingLampHue,
  midCourse,
  moveCosmatiFocus,
  overdueCosmati,
  readCosmatiViews,
  reminderCosmatiList,
  restingCosmati,
  stoneBand,
  stoneCool,
  stoneGap,
  stonePoint,
  stoneWarm,
  suggestCosmatiGround,
  suggestCosmatiHour,
  suggestStone,
  cosmatiGround,
  cosmatiHour,
  cosmatiTimeline,
  type Cosmati,
  type LampRow,
} from "../src/lib/crmv4/round387";

function band(partial: Partial<Cosmati> & { id: string; title: string }): Cosmati {
  return {
    note: "",
    hand: "",
    stone: "",
    hour: null,
    ground: "",
    course: 1,
    tags: [],
    raised: false,
    trayed: false,
    vaulted: false,
    pinned: false,
    audit: "",
    ...partial,
  };
}

function main() {
  assert.equal(ROUND387_FEATURES.length, 25);
  assert.equal(new Set(ROUND387_FEATURES).size, 25);
  for (const feature of ROUND387_FEATURES) assert.equal((ROUND386_FEATURES as readonly string[]).includes(feature), false, feature);
  const libDir = path.join(__dirname, "../src/lib/crmv4");
  for (const feature of ROUND387_FEATURES) {
    const needle = `"${feature}"`;
    for (const file of fs.readdirSync(libDir)) {
      if (!file.endsWith(".ts") || file === "round387.ts") continue;
      const body = fs.readFileSync(path.join(libDir, file), "utf8");
      assert.equal(body.includes(needle), false, `${feature} in ${file}`);
    }
  }

  assert.equal(stonePoint(" porphyry "), "porphyry");
  assert.equal(stonePoint("jasper"), "");
  assert.equal(cosmatiHour("6"), 6);
  assert.equal(cosmatiHour(9), 9);
  assert.equal(cosmatiHour(12), 12);
  assert.equal(cosmatiHour(15), 15);
  assert.equal(cosmatiHour("4"), null);
  assert.equal(cosmatiHour("8"), null);
  assert.equal(courseCount("1"), 1);
  assert.equal(courseCount(3), 3);
  assert.equal(courseCount("5"), 5);
  assert.equal(courseCount("2"), null);
  assert.equal(courseCount("4"), null);
  assert.equal(cosmatiGround("ivory"), "IVORY");
  assert.equal(cosmatiGround("graphite"), "GRAPHITE");
  assert.equal(cosmatiGround("champagne"), "CHAMPAGNE");
  assert.equal(cosmatiGround("gold"), "");
  assert.equal(stoneWarm("porphyry"), true);
  assert.equal(stoneWarm("MARBLE"), true);
  assert.equal(stoneWarm("slate"), false);
  assert.equal(stoneCool("serpent"), true);
  assert.equal(stoneCool("slate"), true);
  assert.equal(stoneCool("marble"), false);
  assert.equal(stoneBand("porphyry"), "first");
  assert.equal(stoneBand("marble"), "second");
  assert.equal(stoneBand("serpent"), "third");
  assert.equal(stoneBand("slate"), "fourth");
  assert.equal(stoneGap("porphyry", "slate"), 3);
  assert.equal(stoneGap("slate", "marble"), -2);
  assert.equal(stoneGap("gold", "slate"), null);
  assert.equal(ivoryQuiet("ivory"), true);
  assert.equal(ivoryQuiet("graphite"), false);
  assert.equal(midCourse(3), true);
  assert.equal(midCourse(1), false);
  assert.equal(fullCourse(5), true);
  assert.equal(fullCourse(4), false);
  assert.equal(activeStone("warm"), "warm");
  assert.equal(activeStone("cool"), "cool");
  assert.equal(activeStone("nope"), "all");
  assert.equal(activeHour(9), "9");
  assert.equal(activeHour(4), "all");
  assert.equal(activeGround("ivory", ["IVORY", "GRAPHITE", "CHAMPAGNE"]), "IVORY");
  assert.equal(activeCourse(5), "5");
  assert.equal(activeCourse(2), "all");
  assert.equal(moveCosmatiFocus(0, 4, -1), 3);
  assert.equal(suggestStone(6), "porphyry");
  assert.equal(suggestStone(10), "marble");
  assert.equal(suggestStone(14), "serpent");
  assert.equal(suggestStone(20), "slate");
  assert.equal(suggestCosmatiHour([], 2), 6);
  assert.equal(suggestCosmatiHour([], 8), 9);
  assert.equal(suggestCosmatiHour([], 14), 12);
  assert.equal(suggestCosmatiHour([], 20), 15);
  const bench = [
    band({ id: "a", title: "Ada", ground: "IVORY", stone: "porphyry", hour: 6, hand: "Nia" }),
    band({ id: "b", title: "Bea", ground: "IVORY", stone: "slate", hour: 9, hand: "Nia" }),
  ];
  assert.equal(suggestCosmatiGround(bench), "GRAPHITE");
  assert.equal(suggestCosmatiHour(bench, 2), 12);
  assert.equal(fairHand(bench, "Nia,Omar"), "Omar");

  const saved = addCosmati([], { title: "  Corso  ", stone: "serpent", hour: 15, ground: "champagne", course: 5, tags: "p s p x" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].stone, "serpent");
  assert.equal(saved[0].hour, 15);
  assert.equal(saved[0].ground, "CHAMPAGNE");
  assert.equal(saved[0].course, 5);
  assert.deepEqual(saved[0].tags, ["p", "s"]);
  assert.equal(saved[0].audit, "save");
  assert.equal(addCosmati(saved, { title: "Corso" }).length, 1);

  const views = addCosmatiView([], { id: "v1", name: "Quiet", rack: "bench", query: "", hand: "", ground: "ivory", stone: "warm", hour: "6", course: "3" });
  assert.equal(readCosmatiViews(views)[0].ground, "IVORY");
  assert.equal(readCosmatiViews(views)[0].stone, "warm");
  assert.equal(dropCosmatiView(views, "v1").length, 0);

  const late = band({ id: "l", title: "Late", stone: "porphyry" });
  const idle = band({ id: "i", title: "Idle", hour: 6 });
  const brisk = band({ id: "r", title: "Brisk", ground: "CHAMPAGNE", hour: 15, course: 5 });
  const rest = band({ id: "s", title: "Rest", stone: "serpent", ground: "IVORY", hour: 9 });
  const due = band({ id: "d", title: "Due", stone: "slate", course: 1 });
  assert.equal(lateCosmati(late, "slate"), true);
  assert.equal(lateCosmati(late, "porphyry"), false);
  assert.equal(idleCosmati(idle), true);
  assert.equal(briskCosmati(brisk), true);
  assert.equal(restingCosmati(rest), true);
  assert.equal(overdueCosmati(due), true);
  assert.deepEqual(reminderCosmatiList([due, late]), ["Due"]);
  const timeline = cosmatiTimeline([band({ id: "t", title: "Ten", hour: 9 })]);
  assert.equal(timeline[0].hour, 9);
  assert.deepEqual(timeline[0].titles, ["Ten"]);

  const now = Date.parse("2026-11-26T12:00:00Z");
  assert.equal(lampLit("LIVE", now), true);
  assert.equal(lampLit(true, now), true);
  assert.equal(lampNear("NEXT", now), true);
  assert.equal(lampFar("2026-12-10T08:00:00Z", now), true);
  assert.equal(lampFade("LATE", now), true);
  assert.equal(lampDark("OFF", now), true);
  assert.equal(lampDark(false, now), true);
  assert.equal(lampDim("PAUSE", now), true);
  assert.equal(lampBlank("NONE", now), true);
  assert.equal(lampOpen(""), true);
  assert.equal(lampHue("LIVE", now), "gilt");
  assert.equal(lampHue("OFF", now), "ink");
  assert.equal(lampHue("PAUSE", now), "pearl");
  assert.equal(lampLength("LIVE"), 4);
  assert.equal(lampEven("LIVE"), true);
  assert.equal(lampDigit("12night"), true);
  assert.equal(lampLetter("LIVE"), true);
  assert.equal(lampUpper("AUSTRALIA"), true);
  assert.equal(lampUpper("LIVE"), false);
  assert.equal(lampCopy("LIVE"), "LIVE");
  assert.equal(lampLit({ balance: 1 }, now), false);
  const rows: LampRow[] = [
    { id: "1", label: "Ada", code: "LIVE" },
    { id: "2", label: "Bea", code: "PAUSE" },
  ];
  assert.equal(leadingLamp(rows, now), "due");
  assert.equal(leadingLampHue(rows, now), "gilt");
  assert.match(lampLanesCsv(rows, now), /due,1/);
  assert.match(lampRowsCsv(rows, ["1"], now), /Ada,LIVE/);
  assert.match(lampRowsCsv(rows, ["1"], now), /,1$/m);

  assert.equal(crmv4Text("en", "csmTitle"), ROUND387_COPY.en.csmTitle);
  assert.equal(crmv4Text("tr", "plmTitle"), ROUND387_COPY.tr.plmTitle);
  assert.equal(crmv4Text("de", "csmHint"), ROUND387_COPY.de.csmHint);
  assert.equal(crmv4Text("ru", "noteQuireKicker"), ROUND387_COPY.ru.noteQuireKicker);
  assert.equal(crmv4Text("ar", "digestGazetteLead"), ROUND387_COPY.ar.digestGazetteLead);
  const keys = Object.keys(ROUND387_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND387_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-cosmati/);
  assert.match(css, /\.c4-presence/);
  assert.match(css, /\.c4-cosmati-column/);
  assert.match(css, /\.c4-presence-column/);
  assert.match(css, /\.c4-note-quire/);
  assert.match(css, /\.c4-digest-gazette/);
  assert.match(css, /\.c4-note-quire-mast/);
  assert.match(css, /\.c4-digest-gazette-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round387.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /active:/);
  assert.match(viewFile, /cosmatiCsv/);
  assert.match(viewFile, /lampRowsCsv/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "x"/);
  assert.match(viewFile, /event\.key === "a"/);
  assert.match(viewFile, /event\.key === "c"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=24&meta=0/);
  assert.match(viewFile, /data-cosmati/);
  assert.match(viewFile, /data-presence/);
  assert.match(viewFile, /data-names/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestCosmatiGround/);
  assert.match(viewFile, /c4-presence-search/);
  assert.match(viewFile, /cosmatiTimeline/);
  assert.match(viewFile, /c4-cosmati-notices/);
  assert.match(viewFile, /from "@\/lib\/crmv4\/round387"/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "csm"/);
  assert.match(app, /view === "plm"/);
  const desk = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round13.tsx"), "utf8");
  assert.match(desk, /c4-note-quire/);
  assert.match(desk, /c4-note-quire-mast/);
  assert.match(desk, /data-logo="mono"/);
  assert.match(desk, /noteQuireKicker/);
  assert.match(desk, /noteQuireLead/);
  assert.match(desk, /data-note-quire/);
  assert.match(desk, /c4-digest-gazette/);
  assert.match(desk, /c4-digest-gazette-mast/);
  assert.match(desk, /digestGazetteKicker/);
  assert.match(desk, /digestGazetteLead/);
  assert.match(desk, /data-digest-gazette/);
  const namedKeys = `${viewFile}\n${desk}`.match(/"(csm|plm|noteQuire|digestGazette)[A-Za-z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND387_COPY.en[key as keyof typeof ROUND387_COPY.en], "string", key);
  console.log("crmv4 round387 tests passed");
}

main();
