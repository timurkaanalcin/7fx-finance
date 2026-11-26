/**
 * Damascene ribbons, caption plates, the ivory inbox prothesis, and the graphite goals bema.
 * Run: TZ=UTC npx tsx tests/crmv4-round373.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND373_COPY } from "../src/lib/crmv4/copy-round373";
import { ROUND372_FEATURES } from "../src/lib/crmv4/round372";
import {
  ROUND373_FEATURES,
  activeFinish,
  activeWatch,
  activeSla,
  activeBead,
  addRibbon,
  briskRibbon,
  dropRibbonView,
  fairWatcher,
  capHome,
  capDesk,
  capBrief,
  capDigit,
  capEven,
  capFirst,
  capRoute,
  capHue,
  capJoin,
  capReturned,
  capLane,
  capLanesCsv,
  capLength,
  capLower,
  capAway,
  capHold,
  capOpen,
  capPlain,
  capLong,
  capRowsCsv,
  capSoon,
  capSpace,
  capState,
  capUpper,
  capVowel,
  fullBead,
  idleRibbon,
  lateRibbon,
  leadingCap,
  leadingCapHue,
  moveRibbonFocus,
  ribbonBand,
  ribbonSla,
  ribbonGap,
  ribbonInner,
  ribbonWatch,
  ribbonOuter,
  ribbonBead,
  ribbonFinish,
  ribbonTimeline,
  overdueRibbon,
  pairBead,
  quietAsh,
  readRibbonViews,
  reminderRibbonCards,
  restingRibbon,
  suggestFinish,
  suggestWatch,
  suggestSla,
  type CapRow,
  type Ribbon,
} from "../src/lib/crmv4/round373";

function rule(partial: Partial<Ribbon> & { id: string; title: string }): Ribbon {
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
  assert.equal(ROUND373_FEATURES.length, 25);
  assert.equal(ROUND373_FEATURES.includes("caption-plates"), true);
  assert.equal(ROUND373_FEATURES.includes("ribbon-minute-sla"), true);
  assert.equal(ROUND373_FEATURES.includes("fair-watcher"), true);
  assert.equal(ROUND373_FEATURES.includes("ribbon-vault"), true);
  assert.equal(ROUND373_FEATURES.includes("ribbon-reminders"), true);
  assert.equal(ROUND373_FEATURES.includes("damascene-search"), true);
  assert.equal(ROUND373_FEATURES.includes("ribbon-timeline"), true);
  for (const feature of ROUND373_FEATURES) assert.equal((ROUND372_FEATURES as readonly string[]).includes(feature), false, feature);
  assert.equal(ribbonWatch(" dawn "), "dawn");
  assert.equal(ribbonWatch("brass"), "");
  assert.equal(ribbonSla("15"), 15);
  assert.equal(ribbonSla(30), 30);
  assert.equal(ribbonSla(45), 45);
  assert.equal(ribbonSla(90), 90);
  assert.equal(ribbonSla("4"), null);
  assert.equal(ribbonSla("8"), null);
  assert.equal(ribbonBead("2"), 2);
  assert.equal(ribbonBead(4), 4);
  assert.equal(ribbonBead("8"), 8);
  assert.equal(ribbonBead("3"), null);
  assert.equal(ribbonBead("6"), null);
  assert.equal(ribbonFinish("gilt"), "GILT");
  assert.equal(ribbonFinish("ash"), "ASH");
  assert.equal(ribbonFinish("mist"), "MIST");
  assert.equal(ribbonFinish("glaze"), "");
  assert.equal(ribbonInner("dawn"), true);
  assert.equal(ribbonInner("NOON"), true);
  assert.equal(ribbonInner("dusk"), false);
  assert.equal(ribbonOuter("dusk"), true);
  assert.equal(ribbonOuter("night"), true);
  assert.equal(ribbonOuter("dawn"), false);
  assert.equal(ribbonBand("dawn"), "morning");
  assert.equal(ribbonBand("noon"), "midday");
  assert.equal(ribbonBand("dusk"), "evening");
  assert.equal(ribbonBand("night"), "late");
  assert.equal(ribbonGap("dawn", "night"), 3);
  assert.equal(quietAsh("ash"), true);
  assert.equal(quietAsh("mist"), false);
  assert.equal(quietAsh("gilt"), false);
  assert.equal(pairBead(4), true);
  assert.equal(pairBead(2), false);
  assert.equal(fullBead(8), true);
  assert.equal(fullBead(4), false);
  assert.equal(activeWatch("inner"), "inner");
  assert.equal(activeSla("15"), "15");
  assert.equal(activeSla("4"), "all");
  assert.equal(activeBead("8"), "8");
  assert.equal(activeBead("3"), "all");
  assert.equal(activeFinish("gilt", ["GILT"]), "GILT");
  assert.equal(suggestWatch(4), "dawn");
  assert.equal(suggestWatch(10), "noon");
  assert.equal(suggestWatch(14), "dusk");
  assert.equal(suggestWatch(20), "night");
  assert.equal(suggestSla([], 1), 15);
  assert.equal(suggestSla([], 5), 30);
  assert.equal(suggestSla([], 10), 45);
  assert.equal(suggestSla([], 18), 90);
  assert.equal(suggestFinish([]), "MIST");
  assert.equal(moveRibbonFocus(0, 3, 1), 1);
  assert.equal(moveRibbonFocus(0, 3, -1), 2);

  const saved = addRibbon([], { id: "d1", title: "Dawn wire", watcher: "Ada", watch: "dawn", sla: 15, finish: "gilt", bead: 2, tags: "d m x" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].finish, "GILT");
  assert.equal(saved[0].tags.join(""), "dm");
  assert.equal(saved[0].audit, "save");
  assert.equal(addRibbon(saved, { title: "Dawn wire" }).length, 1);
  const night = rule({ id: "n1", title: "Night wire", watch: "night", bead: 2 });
  assert.equal(overdueRibbon(night), true);
  assert.equal(reminderRibbonCards([night])[0], "Night wire");
  assert.equal(idleRibbon(rule({ id: "i1", title: "Idle", sla: 15, bead: 2 })), true);
  assert.equal(briskRibbon(rule({ id: "b1", title: "Brisk", finish: "GILT", sla: 90, bead: 8 })), true);
  assert.equal(restingRibbon(rule({ id: "r1", title: "Rest", watch: "night", finish: "MIST", sla: 30 })), true);
  assert.equal(lateRibbon(rule({ id: "l1", title: "Late", watch: "dawn" }), "night"), true);
  assert.equal(lateRibbon(rule({ id: "l2", title: "Held", watch: "dawn", raised: true }), "night"), false);
  assert.equal(fairWatcher([rule({ id: "a", title: "A", watcher: "Ada" }), rule({ id: "b", title: "B", watcher: "Bea", raised: true })], "Ada,Bea"), "Bea");
  const timeline = ribbonTimeline([rule({ id: "t", title: "Fifteen", sla: 15 })]);
  assert.equal(timeline[0].sla, 15);
  assert.equal(timeline[0].titles[0], "Fifteen");
  const views = readRibbonViews([{ id: "v1", name: "Night bench", tray: "vault", query: "wire", watcher: "Ada", finish: "ASH", watch: "outer", sla: "90", bead: "8" }]);
  assert.equal(views[0].tray, "vault");
  assert.equal(views[0].watch, "outer");
  assert.equal(dropRibbonView(views, "v1").length, 0);

  const now = Date.parse("2026-11-26T12:00:00Z");
  assert.equal(capLane("HOME", now), "hall");
  assert.equal(capLane("resident", now), "hall");
  assert.equal(capLane(true, now), "hall");
  assert.equal(capLane(false, now), "plain");
  assert.equal(capLane("CHECK", now), "desk");
  assert.equal(capLane("LATER", now), "hold");
  assert.equal(capLane("MISSING", now), "guest");
  assert.equal(capLane("BOTH", now), "join");
  assert.equal(capLane("TR+DE", now), "join");
  assert.equal(capLane("quiet lane", now), "vacant");
  assert.equal(capLane("scope:tr", now), "route");
  assert.equal(capLane("TR", now), "brief");
  assert.equal(capLane("12north", now), "stamp");
  assert.equal(capLane("AUSTRALIA", now), "long");
  assert.equal(capLane("Italy", now), "vowel");
  assert.equal(capLane("Spain", now), "plain");
  assert.equal(capLane("2026-11-26T08:00:00Z", now), "hall");
  assert.equal(capLane("2026-11-25T08:00:00Z", now), "desk");
  assert.equal(capLane("2026-11-22T08:00:00Z", now), "hold");
  assert.equal(capLane("2026-11-01T08:00:00Z", now), "guest");
  assert.equal(capLane({ lastCountryName: "HOME" }, now), "hall");
  assert.equal(capLane({ name: "Ada" }, now), "");
  assert.equal(capLane({ lastCountryName: "HOME", amount: 1 }, now), "");
  assert.equal(capState(""), "clear");
  assert.equal(capState("TR"), "set");
  assert.equal(capHue("HOME", now), "champagne");
  assert.equal(capHue("CHECK", now), "graphite");
  assert.equal(capHue("TR", now), "ivory");
  assert.equal(capHome("HOME", now), true);
  assert.equal(capDesk("CHECK", now), true);
  assert.equal(capHold("LATER", now), true);
  assert.equal(capReturned("MISSING", now), true);
  assert.equal(capAway("hidden", now), true);
  assert.equal(capJoin("TR+DE", now), true);
  assert.equal(capRoute("scope:tr", now), true);
  assert.equal(capBrief("TR", now), true);
  assert.equal(capLong("AUSTRALIA", now), true);
  assert.equal(capPlain("Spain", now), true);
  assert.equal(capOpen(""), true);
  assert.equal(capSoon("TR", now), true);
  assert.equal(capSoon("SPAIN", now), true);
  assert.equal(capLength("TR"), 2);
  assert.equal(capEven("TR"), true);
  assert.equal(capDigit("12north"), true);
  assert.equal(capVowel("Italy"), true);
  assert.equal(capLower("spain"), true);
  assert.equal(capUpper("SPAIN"), true);
  assert.equal(capUpper("TR"), false);
  assert.equal(capFirst("Spain"), true);
  assert.equal(capSpace("new spain"), true);
  const rows: CapRow[] = [
    { id: "1", label: "Ada", code: "HOME" },
    { id: "2", label: "Bea", code: "TR" },
  ];
  assert.equal(leadingCap(rows), "hall");
  assert.equal(leadingCapHue(rows), "champagne");
  assert.match(capLanesCsv(rows), /hall,1/);
  assert.match(capRowsCsv(rows, ["1"]), /Ada,HOME/);
  assert.match(capRowsCsv(rows, ["1"]), /,1$/m);

  assert.equal(crmv4Text("en", "dmcTitle"), ROUND373_COPY.en.dmcTitle);
  assert.equal(crmv4Text("tr", "capTitle"), ROUND373_COPY.tr.capTitle);
  assert.equal(crmv4Text("de", "dmcHint"), ROUND373_COPY.de.dmcHint);
  assert.equal(crmv4Text("ru", "ibProthesisKicker"), ROUND373_COPY.ru.ibProthesisKicker);
  assert.equal(crmv4Text("ar", "glBemaLead"), ROUND373_COPY.ar.glBemaLead);
  const keys = Object.keys(ROUND373_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND373_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-damascene/);
  assert.match(css, /\.c4-capplate/);
  assert.match(css, /\.c4-damascene-column/);
  assert.match(css, /\.c4-capplate-column/);
  assert.match(css, /\.c4-inbox-prothesis/);
  assert.match(css, /\.c4-goals-bema/);
  assert.match(css, /\.c4-inbox-prothesis-mast/);
  assert.match(css, /\.c4-goals-bema-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round373.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /lastCountryName:/);
  assert.match(viewFile, /ribbonCsv/);
  assert.match(viewFile, /capRowsCsv/);
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
  assert.match(viewFile, /suggestFinish/);
  assert.match(viewFile, /c4-capplate-search/);
  assert.match(viewFile, /ribbonTimeline/);
  assert.match(viewFile, /c4-damascene-notices/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "dmc"/);
  assert.match(app, /view === "cap"/);
  const inbox = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round29.tsx"), "utf8");
  const goals = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round25.tsx"), "utf8");
  assert.match(inbox, /c4-inbox-prothesis/);
  assert.match(inbox, /c4-inbox-prothesis-mast/);
  assert.match(inbox, /data-logo="mono"/);
  assert.match(inbox, /ibProthesisKicker/);
  assert.match(inbox, /ibProthesisLead/);
  assert.match(inbox, /data-inbox-prothesis/);
  assert.match(inbox, /aria-required=\{false\}/);
  assert.match(goals, /c4-goals-bema/);
  assert.match(goals, /c4-goals-bema-mast/);
  assert.match(goals, /data-logo="mono"/);
  assert.match(goals, /glBemaKicker/);
  assert.match(goals, /glBemaLead/);
  assert.match(goals, /data-goals-bema/);
  assert.match(goals, /aria-required=\{false\}/);
  const namedKeys = `${viewFile}\n${inbox}\n${goals}`.match(/"(dmc|cap|ibProthesis|glBema)[A-Za-z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND373_COPY.en[key as keyof typeof ROUND373_COPY.en], "string", key);
  console.log("crmv4 round373 tests passed");
}

main();
