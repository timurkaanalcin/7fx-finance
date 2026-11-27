/**
 * Acroterion finials, antefix tiles, the graphite aging corona, and the ivory SLA mutule.
 * Run: TZ=UTC npx tsx tests/crmv4-round393.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND393_COPY } from "../src/lib/crmv4/copy-round393";
import { ROUND392_FEATURES } from "../src/lib/crmv4/round392";
import {
  ROUND393_FEATURES,
  activeBed,
  activeDepth,
  activeHour,
  activeProfile,
  addAcroterion,
  addAcroterionView,
  antefixBlank,
  antefixCopy,
  antefixDark,
  antefixDigit,
  antefixDim,
  antefixEven,
  antefixFade,
  antefixFar,
  antefixHue,
  antefixLanesCsv,
  antefixLength,
  antefixLetter,
  antefixLit,
  antefixNear,
  antefixOpen,
  antefixRowsCsv,
  antefixUpper,
  briskAcroterion,
  depthCount,
  dropAcroterionView,
  fairHand,
  fullDepth,
  graphiteQuiet,
  idleAcroterion,
  lateAcroterion,
  leadingAntefix,
  leadingAntefixHue,
  midDepth,
  moveAcroterionFocus,
  acroterionBed,
  acroterionHour,
  acroterionTimeline,
  overdueAcroterion,
  profileBand,
  profileCool,
  profileGap,
  profilePoint,
  profileWarm,
  readAcroterionViews,
  reminderAcroterionList,
  restingAcroterion,
  suggestAcroterionBed,
  suggestAcroterionHour,
  suggestProfile,
  type Acroterion,
  type AntefixRow,
} from "../src/lib/crmv4/round393";

function finial(partial: Partial<Acroterion> & { id: string; title: string }): Acroterion {
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
  assert.equal(ROUND393_FEATURES.length, 25);
  assert.equal(new Set(ROUND393_FEATURES).size, 25);
  for (const feature of ROUND393_FEATURES) assert.equal((ROUND392_FEATURES as readonly string[]).includes(feature), false, feature);
  const libDir = path.join(__dirname, "../src/lib/crmv4");
  for (const feature of ROUND393_FEATURES) {
    const needle = `"${feature}"`;
    for (const file of fs.readdirSync(libDir)) {
      if (!file.endsWith(".ts") || file === "round393.ts") continue;
      const body = fs.readFileSync(path.join(libDir, file), "utf8");
      assert.equal(body.includes(needle), false, `${feature} in ${file}`);
    }
  }

  assert.equal(profilePoint(" finial "), "finial");
  assert.equal(profilePoint("jasper"), "");
  assert.equal(acroterionHour("3"), 3);
  assert.equal(acroterionHour(7), 7);
  assert.equal(acroterionHour(11), 11);
  assert.equal(acroterionHour(15), 15);
  assert.equal(acroterionHour("2"), null);
  assert.equal(acroterionHour("6"), null);
  assert.equal(depthCount("1"), 1);
  assert.equal(depthCount(4), 4);
  assert.equal(depthCount("7"), 7);
  assert.equal(depthCount("2"), null);
  assert.equal(depthCount("8"), null);
  assert.equal(acroterionBed("ivory"), "IVORY");
  assert.equal(acroterionBed("graphite"), "GRAPHITE");
  assert.equal(acroterionBed("champagne"), "CHAMPAGNE");
  assert.equal(acroterionBed("gold"), "");
  assert.equal(profileWarm("acroterion"), true);
  assert.equal(profileWarm("PALMETTE"), true);
  assert.equal(profileWarm("finial"), false);
  assert.equal(profileCool("anthemion"), true);
  assert.equal(profileCool("finial"), true);
  assert.equal(profileCool("acroterion"), false);
  assert.equal(profileBand("acroterion"), "first");
  assert.equal(profileBand("palmette"), "second");
  assert.equal(profileBand("anthemion"), "third");
  assert.equal(profileBand("finial"), "fourth");
  assert.equal(profileGap("acroterion", "finial"), 3);
  assert.equal(profileGap("finial", "palmette"), -2);
  assert.equal(profileGap("gold", "finial"), null);
  assert.equal(graphiteQuiet("graphite"), true);
  assert.equal(graphiteQuiet("ivory"), false);
  assert.equal(midDepth(4), true);
  assert.equal(midDepth(1), false);
  assert.equal(fullDepth(7), true);
  assert.equal(fullDepth(4), false);
  assert.equal(activeProfile("warm"), "warm");
  assert.equal(activeProfile("cool"), "cool");
  assert.equal(activeProfile("nope"), "all");
  assert.equal(activeHour(7), "7");
  assert.equal(activeHour(4), "all");
  assert.equal(activeBed("ivory", ["IVORY", "GRAPHITE", "CHAMPAGNE"]), "IVORY");
  assert.equal(activeDepth(7), "7");
  assert.equal(activeDepth(1), "1");
  assert.equal(activeDepth(2), "all");
  assert.equal(moveAcroterionFocus(0, 4, -1), 3);
  assert.equal(suggestProfile(2), "acroterion");
  assert.equal(suggestProfile(8), "palmette");
  assert.equal(suggestProfile(12), "anthemion");
  assert.equal(suggestProfile(20), "finial");
  assert.equal(suggestAcroterionHour([], 2), 3);
  assert.equal(suggestAcroterionHour([], 6), 3);
  assert.equal(suggestAcroterionHour([], 8), 7);
  assert.equal(suggestAcroterionHour([], 12), 11);
  assert.equal(suggestAcroterionHour([], 20), 15);
  const ridge = [
    finial({ id: "a", title: "Ada", bed: "IVORY", profile: "acroterion", hour: 3, hand: "Nia" }),
    finial({ id: "b", title: "Bea", bed: "IVORY", profile: "finial", hour: 7, hand: "Nia" }),
  ];
  assert.equal(suggestAcroterionBed(ridge), "GRAPHITE");
  assert.equal(suggestAcroterionHour(ridge, 3), 11);
  assert.equal(fairHand(ridge, "Nia,Omar"), "Omar");

  const saved = addAcroterion([], { title: "  Corso  ", profile: "anthemion", hour: 15, bed: "ivory", depth: 7, tags: "a f a x" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].profile, "anthemion");
  assert.equal(saved[0].hour, 15);
  assert.equal(saved[0].bed, "IVORY");
  assert.equal(saved[0].depth, 7);
  assert.deepEqual(saved[0].tags, ["a", "f"]);
  assert.equal(saved[0].audit, "save");
  assert.equal(addAcroterion(saved, { title: "Corso" }).length, 1);

  const views = addAcroterionView([], { id: "v1", name: "Quiet", rack: "yard", query: "", hand: "", bed: "ivory", profile: "warm", hour: "3", depth: "4" });
  assert.equal(readAcroterionViews(views)[0].bed, "IVORY");
  assert.equal(readAcroterionViews(views)[0].profile, "warm");
  assert.equal(dropAcroterionView(views, "v1").length, 0);

  const late = finial({ id: "l", title: "Late", profile: "acroterion" });
  const idle = finial({ id: "i", title: "Idle", hour: 3 });
  const brisk = finial({ id: "r", title: "Brisk", bed: "CHAMPAGNE", hour: 15, depth: 7 });
  const rest = finial({ id: "s", title: "Rest", profile: "anthemion", bed: "GRAPHITE", hour: 7 });
  const due = finial({ id: "d", title: "Due", profile: "finial", depth: 1 });
  assert.equal(lateAcroterion(late, "finial"), true);
  assert.equal(lateAcroterion(late, "acroterion"), false);
  assert.equal(idleAcroterion(idle), true);
  assert.equal(briskAcroterion(brisk), true);
  assert.equal(restingAcroterion(rest), true);
  assert.equal(overdueAcroterion(due), true);
  assert.deepEqual(reminderAcroterionList([due, late]), ["Due"]);
  const timeline = acroterionTimeline([finial({ id: "t", title: "Ten", hour: 7 })]);
  assert.equal(timeline[0].hour, 7);
  assert.deepEqual(timeline[0].titles, ["Ten"]);

  const now = Date.parse("2026-11-26T12:00:00Z");
  assert.equal(antefixLit("OPEN", now), true);
  assert.equal(antefixLit(true, now), true);
  assert.equal(antefixNear("NEAR", now), true);
  assert.equal(antefixNear("FRESH", now), true);
  assert.equal(antefixNear("WEEK", now), false);
  assert.equal(antefixNear("2026-11-27T08:00:00Z", now), true);
  assert.equal(antefixFar("2026-11-28T08:00:00Z", now), true);
  assert.equal(antefixFade("AGED", now), true);
  assert.equal(antefixFade("2026-11-23T08:00:00Z", now), true);
  assert.equal(antefixDark("MISS", now), true);
  assert.equal(antefixDark(false, now), true);
  assert.equal(antefixDark("2026-11-22T08:00:00Z", now), true);
  assert.equal(antefixDim("HOLD", now), true);
  assert.equal(antefixDim("WAIT", now), true);
  assert.equal(antefixDim("REST", now), true);
  assert.equal(antefixBlank("NONE", now), true);
  assert.equal(antefixOpen(""), true);
  assert.equal(antefixHue("OPEN", now), "gilt");
  assert.equal(antefixHue("MISS", now), "ash");
  assert.equal(antefixHue("HOLD", now), "pearl");
  assert.equal(antefixLength("OPEN"), 4);
  assert.equal(antefixEven("OPEN"), true);
  assert.equal(antefixDigit("12night"), true);
  assert.equal(antefixLetter("OPEN"), true);
  assert.equal(antefixUpper("ISTANBUL"), true);
  assert.equal(antefixUpper("OPEN"), false);
  assert.equal(antefixFar("ABCDEFGH", now), true);
  assert.equal(antefixLit("9desk", now), true);
  assert.equal(antefixCopy("OPEN"), "OPEN");
  assert.equal(antefixLit({ balance: 1 }, now), false);
  assert.equal(antefixLit({ registrationDate: "OPEN" }, now), true);
  const rows: AntefixRow[] = [
    { id: "1", label: "Ada", code: "OPEN" },
    { id: "2", label: "Bea", code: "HOLD" },
  ];
  assert.equal(leadingAntefix(rows, now), "due");
  assert.equal(leadingAntefixHue(rows, now), "gilt");
  assert.match(antefixLanesCsv(rows, now), /due,1/);
  assert.match(antefixRowsCsv(rows, ["1"], now), /Ada,OPEN/);
  assert.match(antefixRowsCsv(rows, ["1"], now), /,1$/m);
  assert.match(antefixRowsCsv(rows, ["1"], now), /^name,registrationDate,lane,hue,reviewed/m);

  assert.equal(crmv4Text("en", "afnTitle"), ROUND393_COPY.en.afnTitle);
  assert.equal(crmv4Text("tr", "atxTitle"), ROUND393_COPY.tr.atxTitle);
  assert.equal(crmv4Text("de", "afnHint"), ROUND393_COPY.de.afnHint);
  assert.equal(crmv4Text("ru", "agingCoronaKicker"), ROUND393_COPY.ru.agingCoronaKicker);
  assert.equal(crmv4Text("ar", "slaMutuleLead"), ROUND393_COPY.ar.slaMutuleLead);
  const keys = Object.keys(ROUND393_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND393_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-acroterion/);
  assert.match(css, /\.c4-antefix/);
  assert.match(css, /\.c4-acroterion-column/);
  assert.match(css, /\.c4-antefix-column/);
  assert.match(css, /\.c4-aging-corona/);
  assert.match(css, /\.c4-sla-mutule/);
  assert.match(css, /\.c4-aging-corona-mast/);
  assert.match(css, /\.c4-sla-mutule-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round393.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /row\.registrationDate/);
  assert.match(viewFile, /acroterionCsv/);
  assert.match(viewFile, /antefixRowsCsv/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "x"/);
  assert.match(viewFile, /event\.key === "a"/);
  assert.match(viewFile, /event\.key === "c"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=24&meta=0/);
  assert.match(viewFile, /data-acroterion/);
  assert.match(viewFile, /data-antefix/);
  assert.match(viewFile, /data-registered/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestAcroterionBed/);
  assert.match(viewFile, /c4-antefix-search/);
  assert.match(viewFile, /acroterionTimeline/);
  assert.match(viewFile, /c4-acroterion-notices/);
  assert.match(viewFile, /from "@\/lib\/crmv4\/round393"/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "afn"/);
  assert.match(app, /view === "atx"/);
  const desks = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round6.tsx"), "utf8");
  assert.match(desks, /c4-aging-corona/);
  assert.match(desks, /c4-aging-corona-mast/);
  assert.match(desks, /data-logo="mono"/);
  assert.match(desks, /agingCoronaKicker/);
  assert.match(desks, /agingCoronaLead/);
  assert.match(desks, /data-aging-corona/);
  assert.match(desks, /c4-sla-mutule/);
  assert.match(desks, /c4-sla-mutule-mast/);
  assert.match(desks, /slaMutuleKicker/);
  assert.match(desks, /slaMutuleLead/);
  assert.match(desks, /data-sla-mutule/);
  const namedKeys = `${viewFile}\n${desks}`.match(/"(afn|atx|agingCorona|slaMutule)[A-Z][A-Za-z0-9]*"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND393_COPY.en[key as keyof typeof ROUND393_COPY.en], "string", key);
  console.log("crmv4 round393 tests passed");
}

main();
