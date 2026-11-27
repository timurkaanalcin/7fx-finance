/**
 * Caisson coffers, impost desk plates, the graphite anomaly spandrel, and the ivory affiliate chambranle.
 * Run: TZ=UTC npx tsx tests/crmv4-round397.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND397_COPY } from "../src/lib/crmv4/copy-round397";
import { ROUND396_FEATURES } from "../src/lib/crmv4/round396";
import {
  ROUND397_FEATURES,
  activeBed,
  activeDepth,
  activeHour,
  activeProfile,
  addCaisson,
  addCaissonView,
  impostBlank,
  impostCopy,
  impostDigit,
  impostDark,
  impostDim,
  impostEven,
  impostFar,
  impostFade,
  impostHue,
  impostLanesCsv,
  impostLength,
  impostLetter,
  impostLit,
  impostNear,
  impostOpen,
  impostRowsCsv,
  impostUpper,
  briskCaisson,
  depthCount,
  dropCaissonView,
  fairHand,
  fullDepth,
  graphiteQuiet,
  idleCaisson,
  lateCaisson,
  leadingImpost,
  leadingImpostHue,
  midDepth,
  moveCaissonFocus,
  caissonBed,
  caissonHour,
  caissonTimeline,
  overdueCaisson,
  profileBand,
  profileCool,
  profileGap,
  profilePoint,
  profileWarm,
  readCaissonViews,
  reminderCaissonList,
  restingCaisson,
  suggestCaissonBed,
  suggestCaissonHour,
  suggestProfile,
  type Caisson,
  type ImpostRow,
} from "../src/lib/crmv4/round397";

function coffer(partial: Partial<Caisson> & { id: string; title: string }): Caisson {
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
  assert.equal(ROUND397_FEATURES.length, 25);
  assert.equal(new Set(ROUND397_FEATURES).size, 25);
  for (const feature of ROUND397_FEATURES) assert.equal((ROUND396_FEATURES as readonly string[]).includes(feature), false, feature);
  const libDir = path.join(__dirname, "../src/lib/crmv4");
  for (const feature of ROUND397_FEATURES) {
    const needle = `"${feature}"`;
    for (const file of fs.readdirSync(libDir)) {
      if (!file.endsWith(".ts") || file === "round397.ts") continue;
      const body = fs.readFileSync(path.join(libDir, file), "utf8");
      assert.equal(body.includes(needle), false, `${feature} in ${file}`);
    }
  }

  assert.equal(profilePoint(" caisson "), "caisson");
  assert.equal(profilePoint("jasper"), "");
  assert.equal(caissonHour("3"), 3);
  assert.equal(caissonHour(6), 6);
  assert.equal(caissonHour(10), 10);
  assert.equal(caissonHour(16), 16);
  assert.equal(caissonHour("2"), null);
  assert.equal(caissonHour("5"), null);
  assert.equal(depthCount("1"), 1);
  assert.equal(depthCount(4), 4);
  assert.equal(depthCount("7"), 7);
  assert.equal(depthCount("2"), null);
  assert.equal(depthCount("5"), null);
  assert.equal(caissonBed("ivory"), "IVORY");
  assert.equal(caissonBed("graphite"), "GRAPHITE");
  assert.equal(caissonBed("champagne"), "CHAMPAGNE");
  assert.equal(caissonBed("gold"), "");
  assert.equal(profileWarm("caisson"), true);
  assert.equal(profileWarm("LACUNAR"), true);
  assert.equal(profileWarm("pane"), false);
  assert.equal(profileCool("pane"), true);
  assert.equal(profileCool("rib"), true);
  assert.equal(profileCool("caisson"), false);
  assert.equal(profileBand("caisson"), "first");
  assert.equal(profileBand("lacunar"), "second");
  assert.equal(profileBand("pane"), "third");
  assert.equal(profileBand("rib"), "fourth");
  assert.equal(profileGap("caisson", "rib"), 3);
  assert.equal(profileGap("rib", "lacunar"), -2);
  assert.equal(profileGap("gold", "rib"), null);
  assert.equal(graphiteQuiet("graphite"), true);
  assert.equal(graphiteQuiet("ivory"), false);
  assert.equal(graphiteQuiet("champagne"), false);
  assert.equal(midDepth(4), true);
  assert.equal(midDepth(1), false);
  assert.equal(fullDepth(7), true);
  assert.equal(fullDepth(4), false);
  assert.equal(activeProfile("warm"), "warm");
  assert.equal(activeProfile("cool"), "cool");
  assert.equal(activeProfile("nope"), "all");
  assert.equal(activeHour(6), "6");
  assert.equal(activeHour(5), "all");
  assert.equal(activeBed("ivory", ["IVORY", "GRAPHITE", "CHAMPAGNE"]), "IVORY");
  assert.equal(activeDepth(7), "7");
  assert.equal(activeDepth(1), "1");
  assert.equal(activeDepth(2), "all");
  assert.equal(moveCaissonFocus(0, 4, -1), 3);
  assert.equal(suggestProfile(2), "caisson");
  assert.equal(suggestProfile(8), "lacunar");
  assert.equal(suggestProfile(12), "pane");
  assert.equal(suggestProfile(20), "rib");
  assert.equal(suggestCaissonHour([], 2), 3);
  assert.equal(suggestCaissonHour([], 6), 3);
  assert.equal(suggestCaissonHour([], 8), 6);
  assert.equal(suggestCaissonHour([], 12), 10);
  assert.equal(suggestCaissonHour([], 20), 16);
  const ceiling = [
    coffer({ id: "a", title: "Ada", bed: "IVORY", profile: "caisson", hour: 3, hand: "Nia" }),
    coffer({ id: "b", title: "Bea", bed: "IVORY", profile: "rib", hour: 6, hand: "Nia" }),
  ];
  assert.equal(suggestCaissonBed(ceiling), "GRAPHITE");
  assert.equal(suggestCaissonHour(ceiling, 3), 10);
  assert.equal(fairHand(ceiling, "Nia,Omar"), "Omar");

  const saved = addCaisson([], { title: "  Coffer  ", profile: "pane", hour: 16, bed: "graphite", depth: 7, tags: "c n c x" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].profile, "pane");
  assert.equal(saved[0].hour, 16);
  assert.equal(saved[0].bed, "GRAPHITE");
  assert.equal(saved[0].depth, 7);
  assert.deepEqual(saved[0].tags, ["c", "n"]);
  assert.equal(saved[0].audit, "save");
  assert.equal(addCaisson(saved, { title: "Coffer" }).length, 1);

  const views = addCaissonView([], { id: "v1", name: "Quiet", rack: "yard", query: "", hand: "", bed: "graphite", profile: "warm", hour: "3", depth: "4" });
  assert.equal(readCaissonViews(views)[0].bed, "GRAPHITE");
  assert.equal(readCaissonViews(views)[0].profile, "warm");
  assert.equal(dropCaissonView(views, "v1").length, 0);

  const late = coffer({ id: "l", title: "Late", profile: "caisson" });
  const idle = coffer({ id: "i", title: "Idle", hour: 3 });
  const brisk = coffer({ id: "r", title: "Brisk", bed: "GRAPHITE", hour: 16, depth: 7 });
  const rest = coffer({ id: "s", title: "Rest", profile: "pane", bed: "IVORY", hour: 6 });
  const due = coffer({ id: "d", title: "Due", profile: "rib", depth: 1 });
  assert.equal(lateCaisson(late, "rib"), true);
  assert.equal(lateCaisson(late, "caisson"), false);
  assert.equal(idleCaisson(idle), true);
  assert.equal(briskCaisson(brisk), true);
  assert.equal(restingCaisson(rest), true);
  assert.equal(overdueCaisson(due), true);
  assert.deepEqual(reminderCaissonList([due, late]), ["Due"]);
  const timeline = caissonTimeline([coffer({ id: "t", title: "Ten", hour: 6 })]);
  assert.equal(timeline[0].hour, 6);
  assert.deepEqual(timeline[0].titles, ["Ten"]);

  assert.equal(impostLit("DESK"), true);
  assert.equal(impostLit(true), true);
  assert.equal(impostNear("1000"), true);
  assert.equal(impostNear("1"), false);
  assert.equal(impostFar("ab"), true);
  assert.equal(impostFar("50"), false);
  assert.equal(impostFade("A".repeat(14)), true);
  assert.equal(impostFade("10000"), true);
  assert.equal(impostDim("HOLD"), true);
  assert.equal(impostDim("WAIT"), true);
  assert.equal(impostDark("SHUT"), true);
  assert.equal(impostDark(false), true);
  assert.equal(impostBlank("NONE"), true);
  assert.equal(impostOpen(""), true);
  assert.equal(impostHue("DESK"), "gilt");
  assert.equal(impostHue("SHUT"), "ash");
  assert.equal(impostHue("HOLD"), "pearl");
  assert.equal(impostLength("LIVE"), 4);
  assert.equal(impostEven("LIVE"), true);
  assert.equal(impostDigit("12night"), true);
  assert.equal(impostLetter("DESK"), true);
  assert.equal(impostUpper("ISTANBUL"), true);
  assert.equal(impostUpper("DESK"), false);
  assert.equal(impostLit("ABCDEFGH"), false);
  assert.equal(impostDim("ABCDEFGH"), true);
  assert.equal(impostLit("lon-desk"), true);
  assert.equal(impostLit("a-b"), false);
  assert.equal(impostLit("clh0abc123def456"), false);
  assert.equal(impostCopy("DESK"), "DESK");
  assert.equal(impostLit({ balance: 1 }), false);
  assert.equal(impostLit({ desk: "DESK" }), true);
  const rows: ImpostRow[] = [
    { id: "1", label: "Ada", code: "DESK" },
    { id: "2", label: "Bea", code: "HOLD" },
  ];
  assert.equal(leadingImpost(rows), "bay");
  assert.equal(leadingImpostHue(rows), "gilt");
  assert.match(impostLanesCsv(rows), /bay,1/);
  assert.match(impostRowsCsv(rows, ["1"]), /Ada,DESK/);
  assert.match(impostRowsCsv(rows, ["1"]), /,1$/m);
  assert.match(impostRowsCsv(rows, ["1"]), /^name,desk,lane,hue,reviewed/m);

  assert.equal(crmv4Text("en", "csnTitle"), ROUND397_COPY.en.csnTitle);
  assert.equal(crmv4Text("tr", "impTitle"), ROUND397_COPY.tr.impTitle);
  assert.equal(crmv4Text("de", "csnHint"), ROUND397_COPY.de.csnHint);
  assert.equal(crmv4Text("ru", "anomalySpandrelKicker"), ROUND397_COPY.ru.anomalySpandrelKicker);
  assert.equal(crmv4Text("ar", "ibChambranleLead"), ROUND397_COPY.ar.ibChambranleLead);
  const keys = Object.keys(ROUND397_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND397_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-caisson/);
  assert.match(css, /\.c4-impost/);
  assert.match(css, /\.c4-caisson-column/);
  assert.match(css, /\.c4-impost-column/);
  assert.match(css, /\.c4-anomaly-spandrel/);
  assert.match(css, /\.c4-ib-chambranle/);
  assert.match(css, /\.c4-anomaly-spandrel-mast/);
  assert.match(css, /\.c4-ib-chambranle-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round397.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /row\.desk/);
  assert.match(viewFile, /caissonCsv/);
  assert.match(viewFile, /impostRowsCsv/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "x"/);
  assert.match(viewFile, /event\.key === "a"/);
  assert.match(viewFile, /event\.key === "c"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=24&meta=0/);
  assert.match(viewFile, /data-caisson/);
  assert.match(viewFile, /data-impost/);
  assert.match(viewFile, /data-desk/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestCaissonBed/);
  assert.match(viewFile, /c4-impost-search/);
  assert.match(viewFile, /caissonTimeline/);
  assert.match(viewFile, /c4-caisson-notices/);
  assert.match(viewFile, /from "@\/lib\/crmv4\/round397"/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "csn"/);
  assert.match(app, /view === "imp"/);
  const anomalies = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round10.tsx"), "utf8");
  assert.match(anomalies, /c4-anomaly-spandrel/);
  assert.match(anomalies, /c4-anomaly-spandrel-mast/);
  assert.match(anomalies, /data-logo="mono"/);
  assert.match(anomalies, /anomalySpandrelKicker/);
  assert.match(anomalies, /anomalySpandrelLead/);
  assert.match(anomalies, /data-anomaly-spandrel/);
  assert.match(anomalies, /c4-ib-chambranle/);
  assert.match(anomalies, /c4-ib-chambranle-mast/);
  assert.match(anomalies, /ibChambranleKicker/);
  assert.match(anomalies, /ibChambranleLead/);
  assert.match(anomalies, /data-ib-chambranle/);
  const namedKeys = `${viewFile}\n${anomalies}`.match(/"(csn|imp|anomalySpandrel|ibChambranle)[A-Z][A-Za-z0-9]*"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND397_COPY.en[key as keyof typeof ROUND397_COPY.en], "string", key);
  console.log("crmv4 round397 tests passed");
}

main();
