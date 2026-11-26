/**
 * Plique lanterns, frost marks, the ivory system laconicum, and the graphite lead sudatorium.
 * Run: TZ=UTC npx tsx tests/crmv4-round375.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND375_COPY } from "../src/lib/crmv4/copy-round375";
import { ROUND374_FEATURES } from "../src/lib/crmv4/round374";
import {
  ROUND375_FEATURES,
  activeFoil,
  activePoint,
  activeQuarter,
  activePane,
  addLantern,
  briskLantern,
  dropLanternView,
  fairKeeper,
  frsCourt,
  frsBench,
  frsShort,
  frsDigit,
  frsEven,
  frsFirst,
  frsScope,
  frsHue,
  frsPair,
  frsReturn,
  frsLane,
  frsLanesCsv,
  frsLength,
  frsLower,
  frsShut,
  frsWait,
  frsOpen,
  frsBare,
  frsSpan,
  frsRowsCsv,
  frsSoon,
  frsSpace,
  frsState,
  frsUpper,
  frsVowel,
  fullPane,
  idleLantern,
  lateLantern,
  leadingFrs,
  leadingFrsHue,
  moveLanternFocus,
  lanternBand,
  lanternSla,
  lanternGap,
  lanternWarm,
  lanternPoint,
  lanternCool,
  lanternDepth,
  lanternFinish,
  lanternTimeline,
  overdueLantern,
  pairPane,
  quietSoot,
  readLanternViews,
  reminderLanterns,
  restingLantern,
  suggestFoil,
  suggestPoint,
  suggestQuarter,
  type FrsRow,
  type Lantern,
} from "../src/lib/crmv4/round375";

function rule(partial: Partial<Lantern> & { id: string; title: string }): Lantern {
  return {
    note: "",
    watcher: "",
    watch: "",
    sla: null,
    finish: "",
    bead: 2,
    tags: [],
    raised: false,
    pinned: false,
    vaulted: false,
    starred: false,
    audit: "",
    ...partial,
  };
}

function main() {
  assert.equal(ROUND375_FEATURES.length, 25);
  assert.equal(ROUND375_FEATURES.includes("frost-marks"), true);
  assert.equal(ROUND375_FEATURES.includes("lantern-quarter-sla"), true);
  assert.equal(ROUND375_FEATURES.includes("least-open-keeper"), true);
  assert.equal(ROUND375_FEATURES.includes("lantern-casket"), true);
  assert.equal(ROUND375_FEATURES.includes("lantern-reminders"), true);
  assert.equal(ROUND375_FEATURES.includes("plique-search"), true);
  assert.equal(ROUND375_FEATURES.includes("lantern-timeline"), true);
  for (const feature of ROUND375_FEATURES) assert.equal((ROUND374_FEATURES as readonly string[]).includes(feature), false, feature);
  assert.equal(lanternPoint(" north "), "north");
  assert.equal(lanternPoint("brass"), "");
  assert.equal(lanternSla("15"), 15);
  assert.equal(lanternSla(30), 30);
  assert.equal(lanternSla(45), 45);
  assert.equal(lanternSla(90), 90);
  assert.equal(lanternSla("10"), null);
  assert.equal(lanternSla("4"), null);
  assert.equal(lanternDepth("2"), 2);
  assert.equal(lanternDepth(4), 4);
  assert.equal(lanternDepth("8"), 8);
  assert.equal(lanternDepth("3"), null);
  assert.equal(lanternDepth("6"), null);
  assert.equal(lanternFinish("gold"), "GOLD");
  assert.equal(lanternFinish("ivory"), "IVORY");
  assert.equal(lanternFinish("ink"), "INK");
  assert.equal(lanternFinish("gilt"), "");
  assert.equal(lanternWarm("north"), true);
  assert.equal(lanternWarm("EAST"), true);
  assert.equal(lanternWarm("south"), false);
  assert.equal(lanternCool("south"), true);
  assert.equal(lanternCool("west"), true);
  assert.equal(lanternCool("north"), false);
  assert.equal(lanternBand("north"), "morning");
  assert.equal(lanternBand("east"), "midday");
  assert.equal(lanternBand("south"), "evening");
  assert.equal(lanternBand("west"), "late");
  assert.equal(lanternGap("north", "west"), 3);
  assert.equal(quietSoot("ink"), true);
  assert.equal(quietSoot("ivory"), false);
  assert.equal(quietSoot("gold"), false);
  assert.equal(pairPane(4), true);
  assert.equal(pairPane(2), false);
  assert.equal(fullPane(8), true);
  assert.equal(fullPane(4), false);
  assert.equal(activePoint("inner"), "inner");
  assert.equal(activeQuarter("15"), "15");
  assert.equal(activeQuarter("4"), "all");
  assert.equal(activePane("8"), "8");
  assert.equal(activePane("3"), "all");
  assert.equal(activeFoil("gold", ["GOLD"]), "GOLD");
  assert.equal(suggestPoint(4), "north");
  assert.equal(suggestPoint(10), "east");
  assert.equal(suggestPoint(14), "south");
  assert.equal(suggestPoint(20), "west");
  assert.equal(suggestQuarter([], 1), 15);
  assert.equal(suggestQuarter([], 5), 30);
  assert.equal(suggestQuarter([], 10), 45);
  assert.equal(suggestQuarter([], 18), 90);
  assert.equal(suggestFoil([]), "IVORY");
  assert.equal(moveLanternFocus(0, 3, 1), 1);
  assert.equal(moveLanternFocus(0, 3, -1), 2);

  const saved = addLantern([], { id: "w1", title: "North lantern", watcher: "Ada", watch: "north", sla: 15, finish: "gold", bead: 2, tags: "p q x" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].finish, "GOLD");
  assert.equal(saved[0].tags.join(""), "pq");
  assert.equal(saved[0].audit, "save");
  assert.equal(addLantern(saved, { title: "North lantern" }).length, 1);
  const west = rule({ id: "n1", title: "West lantern", watch: "west", bead: 2 });
  assert.equal(overdueLantern(west), true);
  assert.equal(reminderLanterns([west])[0], "West lantern");
  assert.equal(idleLantern(rule({ id: "i1", title: "Idle", sla: 15, bead: 2 })), true);
  assert.equal(briskLantern(rule({ id: "b1", title: "Brisk", finish: "GOLD", sla: 90, bead: 8 })), true);
  assert.equal(restingLantern(rule({ id: "r1", title: "Rest", watch: "west", finish: "IVORY", sla: 30 })), true);
  assert.equal(lateLantern(rule({ id: "l1", title: "Late", watch: "north" }), "west"), true);
  assert.equal(lateLantern(rule({ id: "l2", title: "Held", watch: "north", raised: true }), "west"), false);
  assert.equal(fairKeeper([rule({ id: "a", title: "A", watcher: "Ada" }), rule({ id: "b", title: "B", watcher: "Bea", raised: true })], "Ada,Bea"), "Bea");
  const timeline = lanternTimeline([rule({ id: "t", title: "Fifteen", sla: 15 })]);
  assert.equal(timeline[0].sla, 15);
  assert.equal(timeline[0].titles[0], "Fifteen");
  const views = readLanternViews([{ id: "v1", name: "West floor", tray: "vault", query: "lantern", watcher: "Ada", finish: "INK", watch: "outer", sla: "90", bead: "8" }]);
  assert.equal(views[0].tray, "vault");
  assert.equal(views[0].watch, "outer");
  assert.equal(dropLanternView(views, "v1").length, 0);

  const now = Date.parse("2026-11-26T12:00:00Z");
  assert.equal(frsLane("HOME", now), "court");
  assert.equal(frsLane("resident mark", now), "court");
  assert.equal(frsLane(true, now), "court");
  assert.equal(frsLane(false, now), "bare");
  assert.equal(frsLane("VISIT", now), "bench");
  assert.equal(frsLane("LATER", now), "wait");
  assert.equal(frsLane("VOID", now), "return");
  assert.equal(frsLane("BOTH", now), "pair");
  assert.equal(frsLane("TR+DE", now), "pair");
  assert.equal(frsLane("hush lane", now), "shut");
  assert.equal(frsLane("scope:tr", now), "scope");
  assert.equal(frsLane("TR", now), "short");
  assert.equal(frsLane("12north", now), "digit");
  assert.equal(frsLane("AUSTRALIA", now), "span");
  assert.equal(frsLane("Italy", now), "openv");
  assert.equal(frsLane("Spain", now), "bare");
  assert.equal(frsLane("2026-11-26T08:00:00Z", now), "court");
  assert.equal(frsLane("2026-11-25T08:00:00Z", now), "bench");
  assert.equal(frsLane("2026-11-20T08:00:00Z", now), "wait");
  assert.equal(frsLane("2026-11-01T08:00:00Z", now), "return");
  assert.equal(frsLane({ registrationCountry: "HOME" }, now), "court");
  assert.equal(frsLane({ name: "Ada" }, now), "");
  assert.equal(frsLane({ registrationCountry: "HOME", amount: 1 }, now), "");
  assert.equal(frsState(""), "clear");
  assert.equal(frsState("TR"), "set");
  assert.equal(frsHue("HOME", now), "champagne");
  assert.equal(frsHue("VISIT", now), "graphite");
  assert.equal(frsHue("TR", now), "ivory");
  assert.equal(frsCourt("HOME", now), true);
  assert.equal(frsBench("VISIT", now), true);
  assert.equal(frsWait("LATER", now), true);
  assert.equal(frsReturn("VOID", now), true);
  assert.equal(frsShut("sealed", now), true);
  assert.equal(frsPair("TR+DE", now), true);
  assert.equal(frsScope("scope:tr", now), true);
  assert.equal(frsShort("TR", now), true);
  assert.equal(frsSpan("AUSTRALIA", now), true);
  assert.equal(frsBare("Spain", now), true);
  assert.equal(frsOpen(""), true);
  assert.equal(frsSoon("TR", now), true);
  assert.equal(frsSoon("WEST", now), true);
  assert.equal(frsLength("TR"), 2);
  assert.equal(frsEven("TR"), true);
  assert.equal(frsDigit("12north"), true);
  assert.equal(frsVowel("Italy"), true);
  assert.equal(frsLower("spain"), true);
  assert.equal(frsUpper("SPAINX"), true);
  assert.equal(frsUpper("TR"), false);
  assert.equal(frsFirst("Spain"), true);
  assert.equal(frsSpace("new spain"), true);
  const rows: FrsRow[] = [
    { id: "1", label: "Ada", code: "HOME" },
    { id: "2", label: "Bea", code: "TR" },
  ];
  assert.equal(leadingFrs(rows), "court");
  assert.equal(leadingFrsHue(rows), "champagne");
  assert.match(frsLanesCsv(rows), /court,1/);
  assert.match(frsRowsCsv(rows, ["1"]), /Ada,HOME/);
  assert.match(frsRowsCsv(rows, ["1"]), /,1$/m);

  assert.equal(crmv4Text("en", "plqTitle"), ROUND375_COPY.en.plqTitle);
  assert.equal(crmv4Text("tr", "frsTitle"), ROUND375_COPY.tr.frsTitle);
  assert.equal(crmv4Text("de", "plqHint"), ROUND375_COPY.de.plqHint);
  assert.equal(crmv4Text("ru", "syLaconicumKicker"), ROUND375_COPY.ru.syLaconicumKicker);
  assert.equal(crmv4Text("ar", "ldSudatoriumLead"), ROUND375_COPY.ar.ldSudatoriumLead);
  const keys = Object.keys(ROUND375_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND375_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-plique/);
  assert.match(css, /\.c4-frostmark/);
  assert.match(css, /\.c4-plique-column/);
  assert.match(css, /\.c4-frostmark-column/);
  assert.match(css, /\.c4-sys-laconicum/);
  assert.match(css, /\.c4-lead-sudatorium/);
  assert.match(css, /\.c4-sys-laconicum-mast/);
  assert.match(css, /\.c4-lead-sudatorium-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round375.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /registrationCountry:/);
  assert.match(viewFile, /lanternCsv/);
  assert.match(viewFile, /frsRowsCsv/);
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
  assert.match(viewFile, /suggestFoil/);
  assert.match(viewFile, /c4-frostmark-search/);
  assert.match(viewFile, /lanternTimeline/);
  assert.match(viewFile, /c4-plique-notices/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "plq"/);
  assert.match(app, /view === "frs"/);
  const system = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round39.tsx"), "utf8");
  const leads = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round16.tsx"), "utf8");
  assert.match(system, /c4-sys-laconicum/);
  assert.match(system, /c4-sys-laconicum-mast/);
  assert.match(system, /data-logo="mono"/);
  assert.match(system, /syLaconicumKicker/);
  assert.match(system, /syLaconicumLead/);
  assert.match(system, /data-sys-laconicum/);
  assert.match(system, /aria-required=\{false\}/);
  assert.match(leads, /c4-lead-sudatorium/);
  assert.match(leads, /c4-lead-sudatorium-mast/);
  assert.match(leads, /data-logo="mono"/);
  assert.match(leads, /ldSudatoriumKicker/);
  assert.match(leads, /ldSudatoriumLead/);
  assert.match(leads, /data-lead-sudatorium/);
  assert.match(leads, /aria-required=\{false\}/);
  const namedKeys = `${viewFile}\n${system}\n${leads}`.match(/"(plq|frs|syLaconicum|ldSudatorium)[A-Za-z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND375_COPY.en[key as keyof typeof ROUND375_COPY.en], "string", key);
  console.log("crmv4 round375 tests passed");
}

main();
