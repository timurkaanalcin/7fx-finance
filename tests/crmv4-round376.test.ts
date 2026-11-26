/**
 * Paillon spangles, retention notes, the ivory alert consistorium, and the graphite watch catechumenon.
 * Run: TZ=UTC npx tsx tests/crmv4-round376.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND376_COPY } from "../src/lib/crmv4/copy-round376";
import { ROUND375_FEATURES } from "../src/lib/crmv4/round375";
import {
  ROUND376_FEATURES,
  activeFoil,
  activePane,
  activePoint,
  activeQuarter,
  addSpangle,
  briskSpangle,
  dropSpangleView,
  fairKeeper,
  fullPane,
  idleSpangle,
  lateSpangle,
  leadingRtn,
  leadingRtnHue,
  moveSpangleFocus,
  overdueSpangle,
  pairPane,
  quietSoot,
  readSpangleViews,
  reminderSpangles,
  restingSpangle,
  rtnBare,
  rtnBench,
  rtnCourt,
  rtnDigit,
  rtnEven,
  rtnFirst,
  rtnHue,
  rtnLane,
  rtnLanesCsv,
  rtnLength,
  rtnLower,
  rtnOpen,
  rtnPair,
  rtnReturn,
  rtnRowsCsv,
  rtnScope,
  rtnShort,
  rtnShut,
  rtnSoon,
  rtnSpace,
  rtnSpan,
  rtnUpper,
  rtnVowel,
  rtnWait,
  spangleBand,
  spangleCool,
  spangleDepth,
  spangleFinish,
  spangleGap,
  spanglePoint,
  spangleSla,
  spangleTimeline,
  spangleWarm,
  suggestFoil,
  suggestPoint,
  suggestQuarter,
  type RtnRow,
  type Spangle,
} from "../src/lib/crmv4/round376";

function rule(partial: Partial<Spangle> & { id: string; title: string }): Spangle {
  return {
    note: "",
    watcher: "",
    watch: "",
    sla: null,
    finish: "",
    bead: 3,
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
  assert.equal(ROUND376_FEATURES.length, 25);
  assert.equal(new Set(ROUND376_FEATURES).size, 25);
  for (const feature of ROUND376_FEATURES) assert.equal((ROUND375_FEATURES as readonly string[]).includes(feature), false, feature);
  assert.equal(spanglePoint(" dawn "), "dawn");
  assert.equal(spanglePoint("brass"), "");
  assert.equal(spangleSla("12"), 12);
  assert.equal(spangleSla(24), 24);
  assert.equal(spangleSla(36), 36);
  assert.equal(spangleSla(48), 48);
  assert.equal(spangleSla("15"), null);
  assert.equal(spangleSla("4"), null);
  assert.equal(spangleDepth("3"), 3);
  assert.equal(spangleDepth(6), 6);
  assert.equal(spangleDepth("9"), 9);
  assert.equal(spangleDepth("2"), null);
  assert.equal(spangleDepth("8"), null);
  assert.equal(spangleFinish("gold"), "GOLD");
  assert.equal(spangleFinish("ivory"), "IVORY");
  assert.equal(spangleFinish("ink"), "INK");
  assert.equal(spangleFinish("gilt"), "");
  assert.equal(spangleWarm("dawn"), true);
  assert.equal(spangleWarm("NOON"), true);
  assert.equal(spangleWarm("dusk"), false);
  assert.equal(spangleCool("dusk"), true);
  assert.equal(spangleCool("night"), true);
  assert.equal(spangleCool("dawn"), false);
  assert.equal(spangleBand("dawn"), "first");
  assert.equal(spangleBand("noon"), "second");
  assert.equal(spangleBand("dusk"), "third");
  assert.equal(spangleBand("night"), "fourth");
  assert.equal(spangleGap("dawn", "night"), 3);
  assert.equal(quietSoot("ink"), true);
  assert.equal(quietSoot("ivory"), false);
  assert.equal(quietSoot("gold"), false);
  assert.equal(pairPane(6), true);
  assert.equal(pairPane(3), false);
  assert.equal(fullPane(9), true);
  assert.equal(fullPane(6), false);
  assert.equal(activePoint("inner"), "inner");
  assert.equal(activeQuarter("12"), "12");
  assert.equal(activeQuarter("4"), "all");
  assert.equal(activePane("9"), "9");
  assert.equal(activePane("2"), "all");
  assert.equal(activeFoil("gold", ["GOLD"]), "GOLD");
  assert.equal(suggestPoint(4), "dawn");
  assert.equal(suggestPoint(10), "noon");
  assert.equal(suggestPoint(14), "dusk");
  assert.equal(suggestPoint(20), "night");
  assert.equal(suggestQuarter([], 1), 12);
  assert.equal(suggestQuarter([], 5), 24);
  assert.equal(suggestQuarter([], 10), 24);
  assert.equal(suggestQuarter([], 14), 36);
  assert.equal(suggestQuarter([], 18), 48);
  assert.equal(suggestFoil([]), "IVORY");
  assert.equal(moveSpangleFocus(0, 3, 1), 1);
  assert.equal(moveSpangleFocus(0, 3, -1), 2);

  const saved = addSpangle([], { id: "w1", title: "Dawn spangle", watcher: "Ada", watch: "dawn", sla: 12, finish: "gold", bead: 3, tags: "r s x" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].finish, "GOLD");
  assert.equal(saved[0].tags.join(""), "rs");
  assert.equal(saved[0].audit, "save");
  assert.equal(addSpangle(saved, { title: "Dawn spangle" }).length, 1);
  const night = rule({ id: "n1", title: "Night spangle", watch: "night", bead: 3 });
  assert.equal(overdueSpangle(night), true);
  assert.equal(reminderSpangles([night])[0], "Night spangle");
  assert.equal(idleSpangle(rule({ id: "i1", title: "Idle", sla: 12, bead: 3 })), true);
  assert.equal(briskSpangle(rule({ id: "b1", title: "Brisk", finish: "GOLD", sla: 48, bead: 9 })), true);
  assert.equal(restingSpangle(rule({ id: "r1", title: "Rest", watch: "night", finish: "IVORY", sla: 24 })), true);
  assert.equal(lateSpangle(rule({ id: "l1", title: "Late", watch: "dawn" }), "night"), true);
  assert.equal(lateSpangle(rule({ id: "l2", title: "Held", watch: "dawn", raised: true }), "night"), false);
  assert.equal(fairKeeper([rule({ id: "a", title: "A", watcher: "Ada" }), rule({ id: "b", title: "B", watcher: "Bea", raised: true })], "Ada,Bea"), "Bea");
  const timeline = spangleTimeline([rule({ id: "t", title: "Twelve", sla: 12 })]);
  assert.equal(timeline[0].sla, 12);
  assert.equal(timeline[0].titles[0], "Twelve");
  const views = readSpangleViews([{ id: "v1", name: "Night floor", tray: "vault", query: "spangle", watcher: "Ada", finish: "INK", watch: "outer", sla: "48", bead: "9" }]);
  assert.equal(views[0].tray, "vault");
  assert.equal(views[0].watch, "outer");
  assert.equal(dropSpangleView(views, "v1").length, 0);

  const now = Date.parse("2026-11-26T12:00:00Z");
  assert.equal(rtnLane("KEEP", now), "court");
  assert.equal(rtnLane("follow the desk", now), "court");
  assert.equal(rtnLane(true, now), "court");
  assert.equal(rtnLane(false, now), "bare");
  assert.equal(rtnLane("CALL", now), "bench");
  assert.equal(rtnLane("WEEK", now), "wait");
  assert.equal(rtnLane("LOST", now), "return");
  assert.equal(rtnLane("TWIN", now), "pair");
  assert.equal(rtnLane("TR+DE", now), "pair");
  assert.equal(rtnLane("quiet lane", now), "shut");
  assert.equal(rtnLane("scope:tr", now), "scope");
  assert.equal(rtnLane("TRY", now), "short");
  assert.equal(rtnLane("12night", now), "digit");
  assert.equal(rtnLane("AUSTRALIAX", now), "span");
  assert.equal(rtnLane("Italy", now), "openv");
  assert.equal(rtnLane("Spain", now), "bare");
  assert.equal(rtnLane("2026-11-26T08:00:00Z", now), "court");
  assert.equal(rtnLane("2026-11-25T08:00:00Z", now), "bench");
  assert.equal(rtnLane("2026-11-20T08:00:00Z", now), "wait");
  assert.equal(rtnLane("2026-11-01T08:00:00Z", now), "return");
  assert.equal(rtnLane({ retentionNote: "KEEP" }, now), "court");
  assert.equal(rtnLane({ name: "Ada" }, now), "");
  assert.equal(rtnLane({ retentionNote: "KEEP", amount: 1 }, now), "");
  assert.equal(rtnHue("KEEP", now), "champagne");
  assert.equal(rtnHue("CALL", now), "graphite");
  assert.equal(rtnHue("TRY", now), "ivory");
  assert.equal(rtnCourt("KEEP", now), true);
  assert.equal(rtnBench("CALL", now), true);
  assert.equal(rtnWait("WEEK", now), true);
  assert.equal(rtnReturn("LOST", now), true);
  assert.equal(rtnShut("sealed", now), true);
  assert.equal(rtnPair("TR+DE", now), true);
  assert.equal(rtnScope("scope:tr", now), true);
  assert.equal(rtnShort("TRY", now), true);
  assert.equal(rtnSpan("AUSTRALIAX", now), true);
  assert.equal(rtnBare("Spain", now), true);
  assert.equal(rtnOpen(""), true);
  assert.equal(rtnSoon("TRY", now), true);
  assert.equal(rtnSoon("WEST", now), false);
  assert.equal(rtnLength("TRY"), 3);
  assert.equal(rtnEven("TR"), true);
  assert.equal(rtnDigit("12night"), true);
  assert.equal(rtnVowel("Italy"), true);
  assert.equal(rtnLower("spain"), true);
  assert.equal(rtnUpper("SPAIN"), true);
  assert.equal(rtnUpper("TR"), false);
  assert.equal(rtnFirst("Spain"), true);
  assert.equal(rtnSpace("new spain"), true);
  const rows: RtnRow[] = [
    { id: "1", label: "Ada", code: "KEEP" },
    { id: "2", label: "Bea", code: "TRY" },
  ];
  assert.equal(leadingRtn(rows), "court");
  assert.equal(leadingRtnHue(rows), "champagne");
  assert.match(rtnLanesCsv(rows), /court,1/);
  assert.match(rtnRowsCsv(rows, ["1"]), /Ada,KEEP/);
  assert.match(rtnRowsCsv(rows, ["1"]), /,1$/m);

  assert.equal(crmv4Text("en", "plnTitle"), ROUND376_COPY.en.plnTitle);
  assert.equal(crmv4Text("tr", "rtnTitle"), ROUND376_COPY.tr.rtnTitle);
  assert.equal(crmv4Text("de", "plnHint"), ROUND376_COPY.de.plnHint);
  assert.equal(crmv4Text("ru", "alConsistoriumKicker"), ROUND376_COPY.ru.alConsistoriumKicker);
  assert.equal(crmv4Text("ar", "wtCatechumenonLead"), ROUND376_COPY.ar.wtCatechumenonLead);
  const keys = Object.keys(ROUND376_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND376_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-paillon/);
  assert.match(css, /\.c4-retainnote/);
  assert.match(css, /\.c4-paillon-column/);
  assert.match(css, /\.c4-retainnote-column/);
  assert.match(css, /\.c4-alert-consistorium/);
  assert.match(css, /\.c4-watch-catechumenon/);
  assert.match(css, /\.c4-alert-consistorium-mast/);
  assert.match(css, /\.c4-watch-catechumenon-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round376.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /retentionNote:/);
  assert.match(viewFile, /spangleCsv/);
  assert.match(viewFile, /rtnRowsCsv/);
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
  assert.match(viewFile, /c4-retainnote-search/);
  assert.match(viewFile, /spangleTimeline/);
  assert.match(viewFile, /c4-paillon-notices/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "pln"/);
  assert.match(app, /view === "rtn"/);
  const alerts = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round23.tsx"), "utf8");
  const watch = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round19.tsx"), "utf8");
  assert.match(alerts, /c4-alert-consistorium/);
  assert.match(alerts, /c4-alert-consistorium-mast/);
  assert.match(alerts, /data-logo="mono"/);
  assert.match(alerts, /alConsistoriumKicker/);
  assert.match(alerts, /alConsistoriumLead/);
  assert.match(alerts, /data-alert-consistorium/);
  assert.match(alerts, /aria-required=\{false\}/);
  assert.match(watch, /c4-watch-catechumenon/);
  assert.match(watch, /c4-watch-catechumenon-mast/);
  assert.match(watch, /data-logo="mono"/);
  assert.match(watch, /wtCatechumenonKicker/);
  assert.match(watch, /wtCatechumenonLead/);
  assert.match(watch, /data-watch-catechumenon/);
  assert.match(watch, /aria-required=\{false\}/);
  const namedKeys = `${viewFile}\n${alerts}\n${watch}`.match(/"(pln|rtn|alConsistorium|wtCatechumenon)[A-Za-z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND376_COPY.en[key as keyof typeof ROUND376_COPY.en], "string", key);
  console.log("crmv4 round376 tests passed");
}

main();
