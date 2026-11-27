/**
 * Dentil courses, fascia bands, the graphite staff peristyle, and the ivory campaign propylaeum.
 * Run: TZ=UTC npx tsx tests/crmv4-round391.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND391_COPY } from "../src/lib/crmv4/copy-round391";
import { ROUND390_FEATURES } from "../src/lib/crmv4/round390";
import {
  ROUND391_FEATURES,
  activeBed,
  activeDepth,
  activeHour,
  activeProfile,
  addDentil,
  addDentilView,
  briskDentil,
  dropDentilView,
  fairHand,
  fasciaBlank,
  fasciaCopy,
  fasciaDark,
  fasciaDigit,
  fasciaDim,
  fasciaEven,
  fasciaFade,
  fasciaFar,
  fasciaHue,
  fasciaLanesCsv,
  fasciaLength,
  fasciaLetter,
  fasciaLit,
  fasciaNear,
  fasciaOpen,
  fasciaRowsCsv,
  fasciaUpper,
  fullDepth,
  graphiteQuiet,
  idleDentil,
  lateDentil,
  leadingFascia,
  leadingFasciaHue,
  midDepth,
  moveDentilFocus,
  dentilBed,
  dentilHour,
  dentilTimeline,
  depthCount,
  overdueDentil,
  profileBand,
  profileCool,
  profileGap,
  profilePoint,
  profileWarm,
  readDentilViews,
  reminderDentilList,
  restingDentil,
  suggestDentilBed,
  suggestDentilHour,
  suggestProfile,
  type Dentil,
  type FasciaRow,
} from "../src/lib/crmv4/round391";

function course(partial: Partial<Dentil> & { id: string; title: string }): Dentil {
  return {
    note: "",
    hand: "",
    profile: "",
    hour: null,
    bed: "",
    depth: 1,
    tags: [],
    raised: false,
    kilned: false,
    lofted: false,
    pinned: false,
    audit: "",
    ...partial,
  };
}

function main() {
  assert.equal(ROUND391_FEATURES.length, 25);
  assert.equal(new Set(ROUND391_FEATURES).size, 25);
  for (const feature of ROUND391_FEATURES) assert.equal((ROUND390_FEATURES as readonly string[]).includes(feature), false, feature);
  const libDir = path.join(__dirname, "../src/lib/crmv4");
  for (const feature of ROUND391_FEATURES) {
    const needle = `"${feature}"`;
    for (const file of fs.readdirSync(libDir)) {
      if (!file.endsWith(".ts") || file === "round391.ts") continue;
      const body = fs.readFileSync(path.join(libDir, file), "utf8");
      assert.equal(body.includes(needle), false, `${feature} in ${file}`);
    }
  }

  assert.equal(profilePoint(" bead "), "bead");
  assert.equal(profilePoint("jasper"), "");
  assert.equal(dentilHour("1"), 1);
  assert.equal(dentilHour(5), 5);
  assert.equal(dentilHour(9), 9);
  assert.equal(dentilHour(13), 13);
  assert.equal(dentilHour("4"), null);
  assert.equal(dentilHour("8"), null);
  assert.equal(depthCount("1"), 1);
  assert.equal(depthCount(3), 3);
  assert.equal(depthCount("5"), 5);
  assert.equal(depthCount("2"), null);
  assert.equal(depthCount("6"), null);
  assert.equal(dentilBed("ivory"), "IVORY");
  assert.equal(dentilBed("graphite"), "GRAPHITE");
  assert.equal(dentilBed("champagne"), "CHAMPAGNE");
  assert.equal(dentilBed("gold"), "");
  assert.equal(profileWarm("dentil"), true);
  assert.equal(profileWarm("REEL"), true);
  assert.equal(profileWarm("bead"), false);
  assert.equal(profileCool("fillet"), true);
  assert.equal(profileCool("bead"), true);
  assert.equal(profileCool("dentil"), false);
  assert.equal(profileBand("dentil"), "first");
  assert.equal(profileBand("reel"), "second");
  assert.equal(profileBand("fillet"), "third");
  assert.equal(profileBand("bead"), "fourth");
  assert.equal(profileGap("dentil", "bead"), 3);
  assert.equal(profileGap("bead", "reel"), -2);
  assert.equal(profileGap("gold", "bead"), null);
  assert.equal(graphiteQuiet("graphite"), true);
  assert.equal(graphiteQuiet("ivory"), false);
  assert.equal(midDepth(3), true);
  assert.equal(midDepth(1), false);
  assert.equal(fullDepth(5), true);
  assert.equal(fullDepth(3), false);
  assert.equal(activeProfile("warm"), "warm");
  assert.equal(activeProfile("cool"), "cool");
  assert.equal(activeProfile("nope"), "all");
  assert.equal(activeHour(5), "5");
  assert.equal(activeHour(4), "all");
  assert.equal(activeBed("ivory", ["IVORY", "GRAPHITE", "CHAMPAGNE"]), "IVORY");
  assert.equal(activeDepth(5), "5");
  assert.equal(activeDepth(1), "1");
  assert.equal(activeDepth(2), "all");
  assert.equal(moveDentilFocus(0, 4, -1), 3);
  assert.equal(suggestProfile(2), "dentil");
  assert.equal(suggestProfile(6), "reel");
  assert.equal(suggestProfile(10), "fillet");
  assert.equal(suggestProfile(20), "bead");
  assert.equal(suggestDentilHour([], 2), 1);
  assert.equal(suggestDentilHour([], 6), 5);
  assert.equal(suggestDentilHour([], 10), 9);
  assert.equal(suggestDentilHour([], 20), 13);
  const shop = [
    course({ id: "a", title: "Ada", bed: "IVORY", profile: "dentil", hour: 1, hand: "Nia" }),
    course({ id: "b", title: "Bea", bed: "IVORY", profile: "bead", hour: 5, hand: "Nia" }),
  ];
  assert.equal(suggestDentilBed(shop), "GRAPHITE");
  assert.equal(suggestDentilHour(shop, 2), 9);
  assert.equal(fairHand(shop, "Nia,Omar"), "Omar");

  const saved = addDentil([], { title: "  Corso  ", profile: "fillet", hour: 13, bed: "ivory", depth: 5, tags: "r s r x" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].profile, "fillet");
  assert.equal(saved[0].hour, 13);
  assert.equal(saved[0].bed, "IVORY");
  assert.equal(saved[0].depth, 5);
  assert.deepEqual(saved[0].tags, ["r", "s"]);
  assert.equal(saved[0].audit, "save");
  assert.equal(addDentil(saved, { title: "Corso" }).length, 1);

  const views = addDentilView([], { id: "v1", name: "Quiet", rack: "bench", query: "", hand: "", bed: "ivory", profile: "warm", hour: "1", depth: "3" });
  assert.equal(readDentilViews(views)[0].bed, "IVORY");
  assert.equal(readDentilViews(views)[0].profile, "warm");
  assert.equal(dropDentilView(views, "v1").length, 0);

  const late = course({ id: "l", title: "Late", profile: "dentil" });
  const idle = course({ id: "i", title: "Idle", hour: 1 });
  const brisk = course({ id: "r", title: "Brisk", bed: "GRAPHITE", hour: 13, depth: 5 });
  const rest = course({ id: "s", title: "Rest", profile: "fillet", bed: "IVORY", hour: 5 });
  const due = course({ id: "d", title: "Due", profile: "bead", depth: 1 });
  assert.equal(lateDentil(late, "bead"), true);
  assert.equal(lateDentil(late, "dentil"), false);
  assert.equal(idleDentil(idle), true);
  assert.equal(briskDentil(brisk), true);
  assert.equal(restingDentil(rest), true);
  assert.equal(overdueDentil(due), true);
  assert.deepEqual(reminderDentilList([due, late]), ["Due"]);
  const timeline = dentilTimeline([course({ id: "t", title: "Ten", hour: 5 })]);
  assert.equal(timeline[0].hour, 5);
  assert.deepEqual(timeline[0].titles, ["Ten"]);

  const now = Date.parse("2026-11-26T12:00:00Z");
  assert.equal(fasciaLit("DESK", now), true);
  assert.equal(fasciaLit(true, now), true);
  assert.equal(fasciaNear("NEXT", now), true);
  assert.equal(fasciaNear("FRESH", now), true);
  assert.equal(fasciaNear("2026-11-28T08:00:00Z", now), true);
  assert.equal(fasciaFar("2026-11-29T08:00:00Z", now), true);
  assert.equal(fasciaFade("OLD", now), true);
  assert.equal(fasciaFade("2026-11-23T08:00:00Z", now), true);
  assert.equal(fasciaDark("LOST", now), true);
  assert.equal(fasciaDark(false, now), true);
  assert.equal(fasciaDark("2026-11-21T08:00:00Z", now), true);
  assert.equal(fasciaDim("WAIT", now), true);
  assert.equal(fasciaBlank("NONE", now), true);
  assert.equal(fasciaOpen(""), true);
  assert.equal(fasciaHue("DESK", now), "gilt");
  assert.equal(fasciaHue("LOST", now), "ash");
  assert.equal(fasciaHue("PARK", now), "pearl");
  assert.equal(fasciaLength("DESK"), 4);
  assert.equal(fasciaEven("DESK"), true);
  assert.equal(fasciaDigit("12night"), true);
  assert.equal(fasciaLetter("DESK"), true);
  assert.equal(fasciaUpper("ISTANBUL"), true);
  assert.equal(fasciaUpper("DESK"), false);
  assert.equal(fasciaFar("ABCDEFGHIJKL", now), true);
  assert.equal(fasciaLit("9desk", now), true);
  assert.equal(fasciaCopy("DESK"), "DESK");
  assert.equal(fasciaLit({ balance: 1 }, now), false);
  assert.equal(fasciaLit({ username: "CALL" }, now), true);
  const rows: FasciaRow[] = [
    { id: "1", label: "Ada", code: "DESK" },
    { id: "2", label: "Bea", code: "PARK" },
  ];
  assert.equal(leadingFascia(rows, now), "due");
  assert.equal(leadingFasciaHue(rows, now), "gilt");
  assert.match(fasciaLanesCsv(rows, now), /due,1/);
  assert.match(fasciaRowsCsv(rows, ["1"], now), /Ada,DESK/);
  assert.match(fasciaRowsCsv(rows, ["1"], now), /,1$/m);
  assert.match(fasciaRowsCsv(rows, ["1"], now), /^name,username,lane,hue,reviewed/m);

  assert.equal(crmv4Text("en", "dcsTitle"), ROUND391_COPY.en.dcsTitle);
  assert.equal(crmv4Text("tr", "fasTitle"), ROUND391_COPY.tr.fasTitle);
  assert.equal(crmv4Text("de", "dcsHint"), ROUND391_COPY.de.dcsHint);
  assert.equal(crmv4Text("ru", "staffPeristyleKicker"), ROUND391_COPY.ru.staffPeristyleKicker);
  assert.equal(crmv4Text("ar", "campaignPropylaeumLead"), ROUND391_COPY.ar.campaignPropylaeumLead);
  const keys = Object.keys(ROUND391_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND391_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-dentil/);
  assert.match(css, /\.c4-fascia/);
  assert.match(css, /\.c4-dentil-column/);
  assert.match(css, /\.c4-fascia-column/);
  assert.match(css, /\.c4-staff-peristyle/);
  assert.match(css, /\.c4-campaign-propylaeum/);
  assert.match(css, /\.c4-staff-peristyle-mast/);
  assert.match(css, /\.c4-campaign-propylaeum-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round391.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /row\.username/);
  assert.match(viewFile, /dentilCsv/);
  assert.match(viewFile, /fasciaRowsCsv/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "x"/);
  assert.match(viewFile, /event\.key === "a"/);
  assert.match(viewFile, /event\.key === "c"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=24&meta=0/);
  assert.match(viewFile, /data-dentil/);
  assert.match(viewFile, /data-fascia/);
  assert.match(viewFile, /data-names/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestDentilBed/);
  assert.match(viewFile, /c4-fascia-search/);
  assert.match(viewFile, /dentilTimeline/);
  assert.match(viewFile, /c4-dentil-notices/);
  assert.match(viewFile, /from "@\/lib\/crmv4\/round391"/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "dcs"/);
  assert.match(app, /view === "fas"/);
  const desk = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round4.tsx"), "utf8");
  const mix = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round3.tsx"), "utf8");
  assert.match(desk, /c4-staff-peristyle/);
  assert.match(desk, /c4-staff-peristyle-mast/);
  assert.match(desk, /data-logo="mono"/);
  assert.match(desk, /staffPeristyleKicker/);
  assert.match(desk, /staffPeristyleLead/);
  assert.match(desk, /data-staff-peristyle/);
  assert.match(mix, /c4-campaign-propylaeum/);
  assert.match(mix, /c4-campaign-propylaeum-mast/);
  assert.match(mix, /campaignPropylaeumKicker/);
  assert.match(mix, /campaignPropylaeumLead/);
  assert.match(mix, /data-campaign-propylaeum/);
  const namedKeys = `${viewFile}\n${desk}\n${mix}`.match(/"(dcs|fas|staffPeristyle|campaignPropylaeum)[A-Z][A-Za-z0-9]*"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND391_COPY.en[key as keyof typeof ROUND391_COPY.en], "string", key);
  console.log("crmv4 round391 tests passed");
}

main();
