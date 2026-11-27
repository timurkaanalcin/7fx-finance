/**
 * Taenia courses, corona grant plates, the ivory quality billet, and the graphite backlog chevron.
 * Run: TZ=UTC npx tsx tests/crmv4-round401.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND401_COPY } from "../src/lib/crmv4/copy-round401";
import { ROUND400_FEATURES } from "../src/lib/crmv4/round400";
import {
  ROUND401_FEATURES,
  activeBed,
  activeDepth,
  activeHour,
  activeProfile,
  addTaenia,
  addTaeniaView,
  briskTaenia,
  coronaBlank,
  coronaCopy,
  coronaDark,
  coronaDigit,
  coronaDim,
  coronaEven,
  coronaFade,
  coronaFar,
  coronaHue,
  coronaLanesCsv,
  coronaLength,
  coronaLetter,
  coronaLit,
  coronaNear,
  coronaOpen,
  coronaRowsCsv,
  coronaUpper,
  depthCount,
  dropTaeniaView,
  fairHand,
  fullDepth,
  giltQuiet,
  idleTaenia,
  lateTaenia,
  leadingCorona,
  leadingCoronaHue,
  midDepth,
  moveTaeniaFocus,
  overdueTaenia,
  profileBand,
  profileCool,
  profileGap,
  profilePoint,
  profileWarm,
  readTaeniaViews,
  reminderTaeniaList,
  restingTaenia,
  suggestProfile,
  suggestTaeniaBed,
  suggestTaeniaHour,
  taeniaBed,
  taeniaHour,
  taeniaTimeline,
  type CoronaRow,
  type Taenia,
} from "../src/lib/crmv4/round401";

function course(partial: Partial<Taenia> & { id: string; title: string }): Taenia {
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
  assert.equal(ROUND401_FEATURES.length, 25);
  assert.equal(new Set(ROUND401_FEATURES).size, 25);
  for (const feature of ROUND401_FEATURES) assert.equal((ROUND400_FEATURES as readonly string[]).includes(feature), false, feature);
  const libDir = path.join(__dirname, "../src/lib/crmv4");
  for (const feature of ROUND401_FEATURES) {
    const needle = `"${feature}"`;
    for (const file of fs.readdirSync(libDir)) {
      if (!file.endsWith(".ts") || file === "round401.ts") continue;
      const body = fs.readFileSync(path.join(libDir, file), "utf8");
      assert.equal(body.includes(needle), false, `${feature} in ${file}`);
    }
  }

  assert.equal(profilePoint(" taenia "), "taenia");
  assert.equal(profilePoint("jasper"), "");
  assert.equal(taeniaHour("3"), 3);
  assert.equal(taeniaHour(6), 6);
  assert.equal(taeniaHour(9), 9);
  assert.equal(taeniaHour(12), 12);
  assert.equal(taeniaHour("2"), null);
  assert.equal(taeniaHour("8"), null);
  assert.equal(depthCount("3"), 3);
  assert.equal(depthCount(6), 6);
  assert.equal(depthCount("9"), 9);
  assert.equal(depthCount("1"), null);
  assert.equal(depthCount("4"), null);
  assert.equal(taeniaBed("ivory"), "IVORY");
  assert.equal(taeniaBed("graphite"), "GRAPHITE");
  assert.equal(taeniaBed("gilt"), "GILT");
  assert.equal(taeniaBed("gold"), "");
  assert.equal(profileWarm("taenia"), true);
  assert.equal(profileWarm("MUTULE"), true);
  assert.equal(profileWarm("astragal"), false);
  assert.equal(profileCool("astragal"), true);
  assert.equal(profileCool("annulet"), true);
  assert.equal(profileCool("taenia"), false);
  assert.equal(profileBand("taenia"), "first");
  assert.equal(profileBand("mutule"), "second");
  assert.equal(profileBand("astragal"), "third");
  assert.equal(profileBand("annulet"), "fourth");
  assert.equal(profileGap("taenia", "annulet"), 3);
  assert.equal(profileGap("annulet", "mutule"), -2);
  assert.equal(profileGap("gold", "annulet"), null);
  assert.equal(giltQuiet("gilt"), true);
  assert.equal(giltQuiet("ivory"), false);
  assert.equal(giltQuiet("graphite"), false);
  assert.equal(midDepth(6), true);
  assert.equal(midDepth(3), false);
  assert.equal(fullDepth(9), true);
  assert.equal(fullDepth(6), false);
  assert.equal(activeProfile("warm"), "warm");
  assert.equal(activeProfile("cool"), "cool");
  assert.equal(activeProfile("nope"), "all");
  assert.equal(activeHour(6), "6");
  assert.equal(activeHour(5), "all");
  assert.equal(activeBed("ivory", ["IVORY", "GRAPHITE", "GILT"]), "IVORY");
  assert.equal(activeDepth(9), "9");
  assert.equal(activeDepth(3), "3");
  assert.equal(activeDepth(1), "all");
  assert.equal(moveTaeniaFocus(0, 4, -1), 3);
  assert.equal(suggestProfile(2), "taenia");
  assert.equal(suggestProfile(6), "mutule");
  assert.equal(suggestProfile(10), "astragal");
  assert.equal(suggestProfile(15), "annulet");
  assert.equal(suggestTaeniaHour([], 2), 3);
  assert.equal(suggestTaeniaHour([], 6), 6);
  assert.equal(suggestTaeniaHour([], 7), 6);
  assert.equal(suggestTaeniaHour([], 10), 9);
  assert.equal(suggestTaeniaHour([], 16), 12);
  const base = [
    course({ id: "a", title: "Ada", bed: "IVORY", profile: "taenia", hour: 3, hand: "Nia" }),
    course({ id: "b", title: "Bea", bed: "IVORY", profile: "annulet", hour: 6, hand: "Nia" }),
  ];
  assert.equal(suggestTaeniaBed(base), "GRAPHITE");
  assert.equal(suggestTaeniaHour(base, 4), 9);
  assert.equal(fairHand(base, "Nia,Omar"), "Omar");

  const saved = addTaenia([], { title: "  Course  ", profile: "astragal", hour: 12, bed: "graphite", depth: 9, tags: "t a t x" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].profile, "astragal");
  assert.equal(saved[0].hour, 12);
  assert.equal(saved[0].bed, "GRAPHITE");
  assert.equal(saved[0].depth, 9);
  assert.deepEqual(saved[0].tags, ["t", "a"]);
  assert.equal(saved[0].audit, "save");
  assert.equal(addTaenia(saved, { title: "Course" }).length, 1);

  const views = addTaeniaView([], { id: "v1", name: "Quiet", rack: "base", query: "", hand: "", bed: "graphite", profile: "warm", hour: "3", depth: "6" });
  assert.equal(readTaeniaViews(views)[0].bed, "GRAPHITE");
  assert.equal(readTaeniaViews(views)[0].profile, "warm");
  assert.equal(readTaeniaViews(views)[0].rack, "base");
  assert.equal(dropTaeniaView(views, "v1").length, 0);

  const late = course({ id: "l", title: "Late", profile: "taenia" });
  const idle = course({ id: "i", title: "Idle", hour: 3 });
  const brisk = course({ id: "r", title: "Brisk", bed: "GILT", hour: 12, depth: 9 });
  const rest = course({ id: "s", title: "Rest", profile: "astragal", bed: "IVORY", hour: 6 });
  const due = course({ id: "d", title: "Due", profile: "annulet", depth: 3 });
  assert.equal(lateTaenia(late, "annulet"), true);
  assert.equal(lateTaenia(late, "taenia"), false);
  assert.equal(idleTaenia(idle), true);
  assert.equal(briskTaenia(brisk), true);
  assert.equal(restingTaenia(rest), true);
  assert.equal(overdueTaenia(due), true);
  assert.deepEqual(reminderTaeniaList([due, late]), ["Due"]);
  const timeline = taeniaTimeline([course({ id: "t", title: "Ten", hour: 6 })]);
  assert.equal(timeline[0].hour, 6);
  assert.deepEqual(timeline[0].titles, ["Ten"]);

  assert.equal(coronaLit("GRANT"), true);
  assert.equal(coronaLit(true), true);
  assert.equal(coronaNear("AB"), true);
  assert.equal(coronaNear("A"), false);
  assert.equal(coronaFar("A"), true);
  assert.equal(coronaFar("AB"), false);
  assert.equal(coronaFade("A".repeat(12)), true);
  assert.equal(coronaFade("GRANT"), false);
  assert.equal(coronaDim("HOLD"), true);
  assert.equal(coronaDim("WAIT"), true);
  assert.equal(coronaDark("SHUT"), true);
  assert.equal(coronaDark(false), true);
  assert.equal(coronaBlank("NONE"), true);
  assert.equal(coronaOpen(""), true);
  assert.equal(coronaHue("GRANT"), "gilt");
  assert.equal(coronaHue("SHUT"), "ash");
  assert.equal(coronaHue("HOLD"), "pearl");
  assert.equal(coronaLength("OPEN"), 4);
  assert.equal(coronaEven("OPEN"), true);
  assert.equal(coronaDigit("12night"), true);
  assert.equal(coronaLetter("GRANT"), true);
  assert.equal(coronaUpper("ISTANBUL"), true);
  assert.equal(coronaUpper("OPEN"), false);
  assert.equal(coronaLit("ABCDEFGH"), false);
  assert.equal(coronaDim("ABCDEFGH"), true);
  assert.equal(coronaCopy("GRANT"), "GRANT");
  assert.equal(coronaLit({ balance: 1 }), false);
  assert.equal(coronaLit({ canApproveDeposits: "GRANT" }), true);
  const rows: CoronaRow[] = [
    { id: "1", label: "Ada", code: "GRANT" },
    { id: "2", label: "Bea", code: "HOLD" },
  ];
  assert.equal(leadingCorona(rows), "grant");
  assert.equal(leadingCoronaHue(rows), "gilt");
  assert.match(coronaLanesCsv(rows), /grant,1/);
  assert.match(coronaRowsCsv(rows, ["1"]), /Ada,GRANT/);
  assert.match(coronaRowsCsv(rows, ["1"]), /,1$/m);
  assert.match(coronaRowsCsv(rows, ["1"]), /^name,grant,lane,hue,reviewed/m);

  assert.equal(crmv4Text("en", "taeTitle"), ROUND401_COPY.en.taeTitle);
  assert.equal(crmv4Text("tr", "crnTitle"), ROUND401_COPY.tr.crnTitle);
  assert.equal(crmv4Text("de", "taeHint"), ROUND401_COPY.de.taeHint);
  assert.equal(crmv4Text("ru", "qualityBilletKicker"), ROUND401_COPY.ru.qualityBilletKicker);
  assert.equal(crmv4Text("ar", "backlogChevronLead"), ROUND401_COPY.ar.backlogChevronLead);
  const keys = Object.keys(ROUND401_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND401_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-taenia/);
  assert.match(css, /\.c4-corona/);
  assert.match(css, /\.c4-taenia-column/);
  assert.match(css, /\.c4-corona-column/);
  assert.match(css, /\.c4-quality-billet/);
  assert.match(css, /\.c4-backlog-chevron/);
  assert.match(css, /\.c4-quality-billet-mast/);
  assert.match(css, /\.c4-backlog-chevron-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round401.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /row\.canApproveDeposits/);
  assert.match(viewFile, /taeniaCsv/);
  assert.match(viewFile, /coronaRowsCsv/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "x"/);
  assert.match(viewFile, /event\.key === "a"/);
  assert.match(viewFile, /event\.key === "c"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=24&meta=0/);
  assert.match(viewFile, /data-taenia/);
  assert.match(viewFile, /data-corona/);
  assert.match(viewFile, /data-desk/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestTaeniaBed/);
  assert.match(viewFile, /c4-corona-search/);
  assert.match(viewFile, /taeniaTimeline/);
  assert.match(viewFile, /c4-taenia-notices/);
  assert.match(viewFile, /from "@\/lib\/crmv4\/round401"/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "tae"/);
  assert.match(app, /view === "crn"/);
  const panels = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round11.tsx"), "utf8");
  assert.match(panels, /c4-quality-billet/);
  assert.match(panels, /c4-quality-billet-mast/);
  assert.match(panels, /data-logo="mono"/);
  assert.match(panels, /qualityBilletKicker/);
  assert.match(panels, /qualityBilletLead/);
  assert.match(panels, /data-quality-billet/);
  assert.match(panels, /c4-backlog-chevron/);
  assert.match(panels, /c4-backlog-chevron-mast/);
  assert.match(panels, /backlogChevronKicker/);
  assert.match(panels, /backlogChevronLead/);
  assert.match(panels, /data-backlog-chevron/);
  const namedKeys = `${viewFile}\n${panels}`.match(/"(tae|crn|qualityBillet|backlogChevron)[A-Z][A-Za-z0-9]*"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND401_COPY.en[key as keyof typeof ROUND401_COPY.en], "string", key);
  console.log("crmv4 round401 tests passed");
}

main();
