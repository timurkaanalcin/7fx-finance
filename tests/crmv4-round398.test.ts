/**
 * Plinth courses, dado message plates, the graphite glossary keystone, and the ivory what's-new patera.
 * Run: TZ=UTC npx tsx tests/crmv4-round398.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND398_COPY } from "../src/lib/crmv4/copy-round398";
import { ROUND397_FEATURES } from "../src/lib/crmv4/round397";
import {
  ROUND398_FEATURES,
  activeBed,
  activeDepth,
  activeHour,
  activeProfile,
  addPlinth,
  addPlinthView,
  dadoBlank,
  dadoCopy,
  dadoDark,
  dadoDigit,
  dadoDim,
  dadoEven,
  dadoFade,
  dadoFar,
  dadoHue,
  dadoLanesCsv,
  dadoLength,
  dadoLetter,
  dadoLit,
  dadoNear,
  dadoOpen,
  dadoRowsCsv,
  dadoUpper,
  briskPlinth,
  depthCount,
  dropPlinthView,
  fairHand,
  fullDepth,
  champagneQuiet,
  idlePlinth,
  latePlinth,
  leadingDado,
  leadingDadoHue,
  midDepth,
  movePlinthFocus,
  plinthBed,
  plinthHour,
  plinthTimeline,
  overduePlinth,
  profileBand,
  profileCool,
  profileGap,
  profilePoint,
  profileWarm,
  readPlinthViews,
  reminderPlinthList,
  restingPlinth,
  suggestPlinthBed,
  suggestPlinthHour,
  suggestProfile,
  type Plinth,
  type DadoRow,
} from "../src/lib/crmv4/round398";

function course(partial: Partial<Plinth> & { id: string; title: string }): Plinth {
  return {
    note: "",
    hand: "",
    profile: "",
    hour: null,
    bed: "",
    depth: 2,
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
  assert.equal(ROUND398_FEATURES.length, 25);
  assert.equal(new Set(ROUND398_FEATURES).size, 25);
  for (const feature of ROUND398_FEATURES) assert.equal((ROUND397_FEATURES as readonly string[]).includes(feature), false, feature);
  const libDir = path.join(__dirname, "../src/lib/crmv4");
  for (const feature of ROUND398_FEATURES) {
    const needle = `"${feature}"`;
    for (const file of fs.readdirSync(libDir)) {
      if (!file.endsWith(".ts") || file === "round398.ts") continue;
      const body = fs.readFileSync(path.join(libDir, file), "utf8");
      assert.equal(body.includes(needle), false, `${feature} in ${file}`);
    }
  }

  assert.equal(profilePoint(" plinth "), "plinth");
  assert.equal(profilePoint("jasper"), "");
  assert.equal(plinthHour("4"), 4);
  assert.equal(plinthHour(8), 8);
  assert.equal(plinthHour(12), 12);
  assert.equal(plinthHour(18), 18);
  assert.equal(plinthHour("3"), null);
  assert.equal(plinthHour("6"), null);
  assert.equal(depthCount("2"), 2);
  assert.equal(depthCount(5), 5);
  assert.equal(depthCount("9"), 9);
  assert.equal(depthCount("1"), null);
  assert.equal(depthCount("4"), null);
  assert.equal(plinthBed("ivory"), "IVORY");
  assert.equal(plinthBed("graphite"), "GRAPHITE");
  assert.equal(plinthBed("champagne"), "CHAMPAGNE");
  assert.equal(plinthBed("gold"), "");
  assert.equal(profileWarm("plinth"), true);
  assert.equal(profileWarm("STEREOBATE"), true);
  assert.equal(profileWarm("podium"), false);
  assert.equal(profileCool("podium"), true);
  assert.equal(profileCool("crepidoma"), true);
  assert.equal(profileCool("plinth"), false);
  assert.equal(profileBand("plinth"), "first");
  assert.equal(profileBand("stereobate"), "second");
  assert.equal(profileBand("podium"), "third");
  assert.equal(profileBand("crepidoma"), "fourth");
  assert.equal(profileGap("plinth", "crepidoma"), 3);
  assert.equal(profileGap("crepidoma", "stereobate"), -2);
  assert.equal(profileGap("gold", "crepidoma"), null);
  assert.equal(champagneQuiet("champagne"), true);
  assert.equal(champagneQuiet("ivory"), false);
  assert.equal(champagneQuiet("graphite"), false);
  assert.equal(midDepth(5), true);
  assert.equal(midDepth(2), false);
  assert.equal(fullDepth(9), true);
  assert.equal(fullDepth(5), false);
  assert.equal(activeProfile("warm"), "warm");
  assert.equal(activeProfile("cool"), "cool");
  assert.equal(activeProfile("nope"), "all");
  assert.equal(activeHour(8), "8");
  assert.equal(activeHour(6), "all");
  assert.equal(activeBed("ivory", ["IVORY", "GRAPHITE", "CHAMPAGNE"]), "IVORY");
  assert.equal(activeDepth(9), "9");
  assert.equal(activeDepth(2), "2");
  assert.equal(activeDepth(1), "all");
  assert.equal(movePlinthFocus(0, 4, -1), 3);
  assert.equal(suggestProfile(2), "plinth");
  assert.equal(suggestProfile(8), "stereobate");
  assert.equal(suggestProfile(13), "podium");
  assert.equal(suggestProfile(20), "crepidoma");
  assert.equal(suggestPlinthHour([], 2), 4);
  assert.equal(suggestPlinthHour([], 7), 4);
  assert.equal(suggestPlinthHour([], 8), 8);
  assert.equal(suggestPlinthHour([], 13), 12);
  assert.equal(suggestPlinthHour([], 20), 18);
  const base = [
    course({ id: "a", title: "Ada", bed: "IVORY", profile: "plinth", hour: 4, hand: "Nia" }),
    course({ id: "b", title: "Bea", bed: "IVORY", profile: "crepidoma", hour: 8, hand: "Nia" }),
  ];
  assert.equal(suggestPlinthBed(base), "GRAPHITE");
  assert.equal(suggestPlinthHour(base, 4), 12);
  assert.equal(fairHand(base, "Nia,Omar"), "Omar");

  const saved = addPlinth([], { title: "  Course  ", profile: "podium", hour: 18, bed: "graphite", depth: 9, tags: "p d p x" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].profile, "podium");
  assert.equal(saved[0].hour, 18);
  assert.equal(saved[0].bed, "GRAPHITE");
  assert.equal(saved[0].depth, 9);
  assert.deepEqual(saved[0].tags, ["p", "d"]);
  assert.equal(saved[0].audit, "save");
  assert.equal(addPlinth(saved, { title: "Course" }).length, 1);

  const views = addPlinthView([], { id: "v1", name: "Quiet", rack: "base", query: "", hand: "", bed: "graphite", profile: "warm", hour: "4", depth: "5" });
  assert.equal(readPlinthViews(views)[0].bed, "GRAPHITE");
  assert.equal(readPlinthViews(views)[0].profile, "warm");
  assert.equal(readPlinthViews(views)[0].rack, "base");
  assert.equal(dropPlinthView(views, "v1").length, 0);

  const late = course({ id: "l", title: "Late", profile: "plinth" });
  const idle = course({ id: "i", title: "Idle", hour: 4 });
  const brisk = course({ id: "r", title: "Brisk", bed: "CHAMPAGNE", hour: 18, depth: 9 });
  const rest = course({ id: "s", title: "Rest", profile: "podium", bed: "IVORY", hour: 8 });
  const due = course({ id: "d", title: "Due", profile: "crepidoma", depth: 2 });
  assert.equal(latePlinth(late, "crepidoma"), true);
  assert.equal(latePlinth(late, "plinth"), false);
  assert.equal(idlePlinth(idle), true);
  assert.equal(briskPlinth(brisk), true);
  assert.equal(restingPlinth(rest), true);
  assert.equal(overduePlinth(due), true);
  assert.deepEqual(reminderPlinthList([due, late]), ["Due"]);
  const timeline = plinthTimeline([course({ id: "t", title: "Ten", hour: 8 })]);
  assert.equal(timeline[0].hour, 8);
  assert.deepEqual(timeline[0].titles, ["Ten"]);

  assert.equal(dadoLit("BLOCK"), true);
  assert.equal(dadoLit(true), true);
  assert.equal(dadoNear("100"), true);
  assert.equal(dadoNear("1"), false);
  assert.equal(dadoFar("abcde"), true);
  assert.equal(dadoFar("50"), true);
  assert.equal(dadoFade("A".repeat(20)), true);
  assert.equal(dadoFade("100000"), true);
  assert.equal(dadoDim("HOLD"), true);
  assert.equal(dadoDim("WAIT"), true);
  assert.equal(dadoDark("SHUT"), true);
  assert.equal(dadoDark(false), true);
  assert.equal(dadoBlank("NONE"), true);
  assert.equal(dadoOpen(""), true);
  assert.equal(dadoHue("BLOCK"), "gilt");
  assert.equal(dadoHue("SHUT"), "ash");
  assert.equal(dadoHue("HOLD"), "pearl");
  assert.equal(dadoLength("LIVE"), 4);
  assert.equal(dadoEven("LIVE"), true);
  assert.equal(dadoDigit("12night"), true);
  assert.equal(dadoLetter("BLOCK"), true);
  assert.equal(dadoUpper("ISTANBUL"), true);
  assert.equal(dadoUpper("BLOCK"), false);
  assert.equal(dadoLit("ABCDEFGH"), false);
  assert.equal(dadoDim("ABCDEFGH"), true);
  assert.equal(dadoLit("block.note"), true);
  assert.equal(dadoLit("a.b"), false);
  assert.equal(dadoLit("clh0abc123def456"), false);
  assert.equal(dadoCopy("BLOCK"), "BLOCK");
  assert.equal(dadoLit({ balance: 1 }), false);
  assert.equal(dadoLit({ loginBlockedMessage: "BLOCK" }), true);
  const rows: DadoRow[] = [
    { id: "1", label: "Ada", code: "BLOCK" },
    { id: "2", label: "Bea", code: "HOLD" },
  ];
  assert.equal(leadingDado(rows), "note");
  assert.equal(leadingDadoHue(rows), "gilt");
  assert.match(dadoLanesCsv(rows), /note,1/);
  assert.match(dadoRowsCsv(rows, ["1"]), /Ada,BLOCK/);
  assert.match(dadoRowsCsv(rows, ["1"]), /,1$/m);
  assert.match(dadoRowsCsv(rows, ["1"]), /^name,message,lane,hue,reviewed/m);

  assert.equal(crmv4Text("en", "phcTitle"), ROUND398_COPY.en.phcTitle);
  assert.equal(crmv4Text("tr", "dadTitle"), ROUND398_COPY.tr.dadTitle);
  assert.equal(crmv4Text("de", "phcHint"), ROUND398_COPY.de.phcHint);
  assert.equal(crmv4Text("ru", "glossaryKeystoneKicker"), ROUND398_COPY.ru.glossaryKeystoneKicker);
  assert.equal(crmv4Text("ar", "whatsPateraLead"), ROUND398_COPY.ar.whatsPateraLead);
  const keys = Object.keys(ROUND398_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND398_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-plinth/);
  assert.match(css, /\.c4-dado/);
  assert.match(css, /\.c4-plinth-column/);
  assert.match(css, /\.c4-dado-column/);
  assert.match(css, /\.c4-glossary-keystone/);
  assert.match(css, /\.c4-whats-patera/);
  assert.match(css, /\.c4-glossary-keystone-mast/);
  assert.match(css, /\.c4-whats-patera-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round398.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /row\.loginBlockedMessage/);
  assert.match(viewFile, /plinthCsv/);
  assert.match(viewFile, /dadoRowsCsv/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "x"/);
  assert.match(viewFile, /event\.key === "a"/);
  assert.match(viewFile, /event\.key === "c"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=24&meta=0/);
  assert.match(viewFile, /data-plinth/);
  assert.match(viewFile, /data-dado/);
  assert.match(viewFile, /data-desk/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestPlinthBed/);
  assert.match(viewFile, /c4-dado-search/);
  assert.match(viewFile, /plinthTimeline/);
  assert.match(viewFile, /c4-plinth-notices/);
  assert.match(viewFile, /from "@\/lib\/crmv4\/round398"/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "phc"/);
  assert.match(app, /view === "dad"/);
  const panels = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round11.tsx"), "utf8");
  assert.match(panels, /c4-glossary-keystone/);
  assert.match(panels, /c4-glossary-keystone-mast/);
  assert.match(panels, /data-logo="mono"/);
  assert.match(panels, /glossaryKeystoneKicker/);
  assert.match(panels, /glossaryKeystoneLead/);
  assert.match(panels, /data-glossary-keystone/);
  assert.match(panels, /c4-whats-patera/);
  assert.match(panels, /c4-whats-patera-mast/);
  assert.match(panels, /whatsPateraKicker/);
  assert.match(panels, /whatsPateraLead/);
  assert.match(panels, /data-whats-patera/);
  const namedKeys = `${viewFile}\n${panels}`.match(/"(phc|dad|glossaryKeystone|whatsPatera)[A-Z][A-Za-z0-9]*"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND398_COPY.en[key as keyof typeof ROUND398_COPY.en], "string", key);
  console.log("crmv4 round398 tests passed");
}

main();
