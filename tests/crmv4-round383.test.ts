/**
 * Mezzotint plates, maculature proofs, the ivory mail lacquer, and the graphite referral boulle.
 * Run: TZ=UTC npx tsx tests/crmv4-round383.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND383_COPY } from "../src/lib/crmv4/copy-round383";
import { ROUND382_FEATURES } from "../src/lib/crmv4/round382";
import {
  ROUND383_FEATURES,
  activeDay,
  activeFilm,
  activeGround,
  activeRocker,
  addPlate,
  addPlateView,
  briskPlate,
  dropPlateView,
  fairHand,
  filmCount,
  fullFilm,
  graphiteQuiet,
  idlePlate,
  latePlate,
  leadingMac,
  leadingMacHue,
  macBare,
  macBrief,
  macCool,
  macCopy,
  macDigit,
  macEven,
  macFirst,
  macHeld,
  macHue,
  macHush,
  macKeep,
  macLane,
  macLanesCsv,
  macLength,
  macLongLane,
  macLost,
  macLower,
  macOpen,
  macPair,
  macRoute,
  macRowsCsv,
  macShort,
  macSoon,
  macSpace,
  macTallyLane,
  macUpper,
  macVowel,
  macVowelLane,
  midFilm,
  movePlateFocus,
  overduePlate,
  plateDay,
  plateGround,
  plateTimeline,
  readPlateViews,
  reminderPlates,
  restingPlate,
  rockerBand,
  rockerCool,
  rockerGap,
  rockerPoint,
  rockerWarm,
  suggestPlateDay,
  suggestPlateGround,
  suggestRocker,
  type MacRow,
  type Plate,
} from "../src/lib/crmv4/round383";

function rule(partial: Partial<Plate> & { id: string; title: string }): Plate {
  return {
    note: "",
    hand: "",
    tool: "",
    depth: null,
    ground: "",
    coat: 2,
    tags: [],
    raised: false,
    trayed: false,
    stored: false,
    starred: false,
    audit: "",
    ...partial,
  };
}

function main() {
  assert.equal(ROUND383_FEATURES.length, 25);
  assert.equal(new Set(ROUND383_FEATURES).size, 25);
  for (const feature of ROUND383_FEATURES) assert.equal((ROUND382_FEATURES as readonly string[]).includes(feature), false, feature);
  const libDir = path.join(__dirname, "../src/lib/crmv4");
  for (const feature of ROUND383_FEATURES) {
    const needle = `"${feature}"`;
    for (const file of fs.readdirSync(libDir)) {
      if (!file.endsWith(".ts") || file === "round383.ts") continue;
      const body = fs.readFileSync(path.join(libDir, file), "utf8");
      assert.equal(body.includes(needle), false, `${feature} in ${file}`);
    }
  }
  assert.equal(rockerPoint(" rocker "), "rocker");
  assert.equal(rockerPoint("brass"), "");
  assert.equal(plateDay("4"), 4);
  assert.equal(plateDay(6), 6);
  assert.equal(plateDay(9), 9);
  assert.equal(plateDay(15), 15);
  assert.equal(plateDay("8"), null);
  assert.equal(plateDay("13"), null);
  assert.equal(filmCount("2"), 2);
  assert.equal(filmCount(4), 4);
  assert.equal(filmCount("6"), 6);
  assert.equal(filmCount("1"), null);
  assert.equal(filmCount("3"), null);
  assert.equal(plateGround("ivory"), "IVORY");
  assert.equal(plateGround("graphite"), "GRAPHITE");
  assert.equal(plateGround("champagne"), "CHAMPAGNE");
  assert.equal(plateGround("gold"), "");
  assert.equal(rockerWarm("rocker"), true);
  assert.equal(rockerWarm("ROULETTE"), true);
  assert.equal(rockerWarm("burnisher"), false);
  assert.equal(rockerCool("burnisher"), true);
  assert.equal(rockerCool("scraper"), true);
  assert.equal(rockerCool("rocker"), false);
  assert.equal(rockerBand("rocker"), "first");
  assert.equal(rockerBand("roulette"), "second");
  assert.equal(rockerBand("burnisher"), "third");
  assert.equal(rockerBand("scraper"), "fourth");
  assert.equal(rockerGap("rocker", "scraper"), 3);
  assert.equal(graphiteQuiet("champagne"), true);
  assert.equal(graphiteQuiet("ivory"), false);
  assert.equal(graphiteQuiet("graphite"), false);
  assert.equal(midFilm(4), true);
  assert.equal(midFilm(2), false);
  assert.equal(fullFilm(6), true);
  assert.equal(fullFilm(4), false);
  assert.equal(activeRocker("warm"), "warm");
  assert.equal(activeDay("4"), "4");
  assert.equal(activeDay("8"), "all");
  assert.equal(activeFilm("6"), "6");
  assert.equal(activeFilm("9"), "all");
  assert.equal(activeGround("ivory", ["IVORY"]), "IVORY");
  assert.equal(suggestRocker(4), "rocker");
  assert.equal(suggestRocker(10), "roulette");
  assert.equal(suggestRocker(14), "burnisher");
  assert.equal(suggestRocker(20), "scraper");
  assert.equal(suggestPlateDay([], 1), 4);
  assert.equal(suggestPlateDay([], 6), 6);
  assert.equal(suggestPlateDay([], 11), 6);
  assert.equal(suggestPlateDay([], 14), 9);
  assert.equal(suggestPlateDay([], 19), 15);
  assert.equal(suggestPlateGround([]), "IVORY");
  assert.equal(movePlateFocus(0, 3, 1), 1);
  assert.equal(movePlateFocus(0, 3, -1), 2);

  const saved = addPlate([], { id: "g1", title: "Rocker plate", hand: "Ada", tool: "rocker", depth: 4, ground: "ivory", coat: 2, tags: "m z x" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].ground, "IVORY");
  assert.equal(saved[0].tags.join(""), "mz");
  assert.equal(saved[0].audit, "save");
  assert.equal(saved[0].coat, 2);
  assert.equal(addPlate(saved, { title: "Rocker plate" }).length, 1);
  const scraper = rule({ id: "n1", title: "Scraper plate", tool: "scraper", coat: 2 });
  assert.equal(overduePlate(scraper), true);
  assert.equal(reminderPlates([scraper])[0], "Scraper plate");
  assert.equal(idlePlate(rule({ id: "i1", title: "Idle", depth: 4, coat: 2 })), true);
  assert.equal(briskPlate(rule({ id: "b1", title: "Brisk", ground: "CHAMPAGNE", depth: 15, coat: 6 })), true);
  assert.equal(restingPlate(rule({ id: "r1", title: "Rest", tool: "scraper", ground: "IVORY", depth: 6 })), true);
  assert.equal(latePlate(rule({ id: "l1", title: "Late", tool: "rocker" }), "scraper"), true);
  assert.equal(latePlate(rule({ id: "l2", title: "Held", tool: "rocker", raised: true }), "scraper"), false);
  assert.equal(fairHand([rule({ id: "a", title: "A", hand: "Ada" }), rule({ id: "b", title: "B", hand: "Bea", raised: true })], "Ada,Bea"), "Bea");
  const timeline = plateTimeline([rule({ id: "t", title: "Ten", depth: 4 })]);
  assert.equal(timeline[0].depth, 4);
  assert.equal(timeline[0].titles[0], "Ten");
  const views = readPlateViews([{ id: "v1", name: "Scraper deck", tray: "store", query: "plate", hand: "Ada", ground: "CHAMPAGNE", tool: "cool", depth: "15", coat: "6" }]);
  assert.equal(views[0].tray, "store");
  assert.equal(views[0].tool, "cool");
  assert.equal(views[0].depth, "15");
  assert.equal(views[0].coat, "6");
  assert.equal(dropPlateView(views, "v1").length, 0);
  assert.equal(addPlateView(views, views[0]).length, 1);

  const now = Date.parse("2026-11-26T12:00:00Z");
  assert.equal(macLane("HOLD", now), "firm");
  assert.equal(macLane("please hold the plate", now), "firm");
  assert.equal(macLane(true, now), "firm");
  assert.equal(macLane(false, now), "plain");
  assert.equal(macLane("MIST", now), "bench");
  assert.equal(macLane("LATER", now), "wait");
  assert.equal(macLane("FADED", now), "gone");
  assert.equal(macLane("MATE", now), "twin");
  assert.equal(macLane("TR^90", now), "twin");
  assert.equal(macLane("^9055", now), "firm");
  assert.equal(macLane("^90", now), "twin");
  assert.equal(macLane("still proof", now), "hush");
  assert.equal(macLane("ext|12", now), "route");
  assert.equal(macLane("ABCDE", now), "short");
  assert.equal(macLane("12night", now), "tally");
  assert.equal(macLane("5551112", now), "bench");
  assert.equal(macLane("555111222", now), "tally");
  assert.equal(macLane("Orange", now), "vowel");
  assert.equal(macLane("Copper", now), "plain");
  assert.equal(macLane("plate", now), "firm");
  assert.equal(macLane("COPPERPLATEXXXXXXX", now), "long");
  assert.equal(macLane("2026-11-26T08:00:00Z", now), "firm");
  assert.equal(macLane("2026-11-25T18:00:00Z", now), "bench");
  assert.equal(macLane("2026-11-24T00:00:00Z", now), "wait");
  assert.equal(macLane("2026-11-01T08:00:00Z", now), "gone");
  assert.equal(macLane({ retentionStatus: "HOLD" }, now), "firm");
  assert.equal(macLane({ name: "Ada" }, now), "");
  assert.equal(macLane({ retentionStatus: "HOLD", amount: 1 }, now), "");
  assert.equal(macHue("HOLD", now), "gilt");
  assert.equal(macHue("MIST", now), "ink");
  assert.equal(macHue("ABCDE", now), "pearl");
  assert.equal(macKeep("HOLD", now), true);
  assert.equal(macHush("still proof", now), true);
  assert.equal(macSoon("LATER", now), true);
  assert.equal(macLost("FADED", now), true);
  assert.equal(macCool("MIST", now), true);
  assert.equal(macPair("TR^90", now), true);
  assert.equal(macRoute("ext|12", now), true);
  assert.equal(macShort("ABCDE", now), true);
  assert.equal(macLongLane("COPPERPLATEXXXXXXX", now), true);
  assert.equal(macTallyLane("12night", now), true);
  assert.equal(macVowelLane("Orange", now), true);
  assert.equal(macBare("Copper", now), true);
  assert.equal(macOpen(""), true);
  assert.equal(macBrief("ABCDE", now), true);
  assert.equal(macBrief("HOLD", now), false);
  assert.equal(macLength("ABCDE"), 5);
  assert.equal(macEven("HOLD"), true);
  assert.equal(macDigit("12night"), true);
  assert.equal(macVowel("Orange"), true);
  assert.equal(macLower("spain"), true);
  assert.equal(macUpper("COPPERPLATE"), true);
  assert.equal(macUpper("AUSTRALIA"), false);
  assert.equal(macUpper("SPAIN"), false);
  assert.equal(macUpper("TR"), false);
  assert.equal(macFirst("Spain"), true);
  assert.equal(macSpace("new spain"), true);
  assert.equal(macHeld("COPPERPLATEXXXXXXX"), true);
  assert.equal(macCopy("HOLD"), "HOLD");
  const rows: MacRow[] = [
    { id: "1", label: "Ada", code: "HOLD" },
    { id: "2", label: "Bea", code: "ABCDE" },
  ];
  assert.equal(leadingMac(rows), "firm");
  assert.equal(leadingMacHue(rows), "gilt");
  assert.match(macLanesCsv(rows), /firm,1/);
  assert.match(macRowsCsv(rows, ["1"]), /Ada,HOLD/);
  assert.match(macRowsCsv(rows, ["1"]), /,1$/m);

  assert.equal(crmv4Text("en", "mztTitle"), ROUND383_COPY.en.mztTitle);
  assert.equal(crmv4Text("tr", "macTitle"), ROUND383_COPY.tr.macTitle);
  assert.equal(crmv4Text("de", "mztHint"), ROUND383_COPY.de.mztHint);
  assert.equal(crmv4Text("ru", "referralBoulleKicker"), ROUND383_COPY.ru.referralBoulleKicker);
  assert.equal(crmv4Text("ar", "mailLacquerLead"), ROUND383_COPY.ar.mailLacquerLead);
  const keys = Object.keys(ROUND383_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND383_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-mezzotint/);
  assert.match(css, /\.c4-maculature/);
  assert.match(css, /\.c4-mezzotint-column/);
  assert.match(css, /\.c4-maculature-column/);
  assert.match(css, /\.c4-mail-lacquer/);
  assert.match(css, /\.c4-referral-boulle/);
  assert.match(css, /\.c4-mail-lacquer-mast/);
  assert.match(css, /\.c4-referral-boulle-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round383.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("babevel"), false);
  assert.match(viewFile, /retentionStatus:/);
  assert.match(viewFile, /plateCsv/);
  assert.match(viewFile, /macRowsCsv/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "x"/);
  assert.match(viewFile, /event\.key === "a"/);
  assert.match(viewFile, /event\.key === "c"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=24&meta=0/);
  assert.match(viewFile, /data-cards/);
  assert.match(viewFile, /data-proofs/);
  assert.match(viewFile, /data-names/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestPlateGround/);
  assert.match(viewFile, /c4-maculature-search/);
  assert.match(viewFile, /plateTimeline/);
  assert.match(viewFile, /c4-mezzotint-notices/);
  assert.match(viewFile, /from "@\/lib\/crmv4\/round383"/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "mzt"/);
  assert.match(app, /view === "mac"/);
  const desk = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round13.tsx"), "utf8");
  assert.match(desk, /c4-mail-lacquer/);
  assert.match(desk, /c4-mail-lacquer-mast/);
  assert.match(desk, /data-logo="mono"/);
  assert.match(desk, /mailLacquerKicker/);
  assert.match(desk, /mailLacquerLead/);
  assert.match(desk, /data-mail-lacquer/);
  assert.match(desk, /c4-referral-boulle/);
  assert.match(desk, /c4-referral-boulle-mast/);
  assert.match(desk, /referralBoulleKicker/);
  assert.match(desk, /referralBoulleLead/);
  assert.match(desk, /data-referral-boulle/);
  const namedKeys = `${viewFile}\n${desk}`.match(/"(mzt|mac|mailLacquer|referralBoulle)[A-Za-z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND383_COPY.en[key as keyof typeof ROUND383_COPY.en], "string", key);
  console.log("crmv4 round383 tests passed");
}

main();
