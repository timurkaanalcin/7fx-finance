/**
 * Sgraffito slips, sinopia cartoons, the ivory document cartellino, and the graphite channel abacus.
 * Run: TZ=UTC npx tsx tests/crmv4-round381.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND381_COPY } from "../src/lib/crmv4/copy-round381";
import { ROUND380_FEATURES } from "../src/lib/crmv4/round380";
import {
  ROUND381_FEATURES,
  activeCoat,
  activeDepth,
  activeGround,
  activeTool,
  addSlip,
  briskSlip,
  coatCount,
  dropSlipView,
  fairPlasterer,
  fullCoat,
  idleSlip,
  ivoryQuiet,
  lateSlip,
  leadingSnp,
  leadingSnpHue,
  moveSlipFocus,
  overdueSlip,
  pairCoat,
  plasterDepth,
  plasterGround,
  readSlipViews,
  reminderSlips,
  restingSlip,
  slipTimeline,
  snpBench,
  snpDigit,
  snpEven,
  snpFirm,
  snpFirst,
  snpGone,
  snpHue,
  snpHush,
  snpLane,
  snpLanesCsv,
  snpLength,
  snpLongLane,
  snpLower,
  snpOpen,
  snpPlain,
  snpRoute,
  snpRowsCsv,
  snpShort,
  snpSoon,
  snpSpace,
  snpTallyLane,
  snpTwin,
  snpUpper,
  snpVowel,
  snpVowelLane,
  snpWait,
  suggestDepth,
  suggestGround,
  suggestTool,
  toolBand,
  toolCool,
  toolGap,
  toolPoint,
  toolWarm,
  type Slip,
  type SnpRow,
} from "../src/lib/crmv4/round381";

function rule(partial: Partial<Slip> & { id: string; title: string }): Slip {
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
  assert.equal(ROUND381_FEATURES.length, 25);
  assert.equal(new Set(ROUND381_FEATURES).size, 25);
  for (const feature of ROUND381_FEATURES) assert.equal((ROUND380_FEATURES as readonly string[]).includes(feature), false, feature);
  const libDir = path.join(__dirname, "../src/lib/crmv4");
  for (const feature of ROUND381_FEATURES) {
    const needle = `"${feature}"`;
    for (const file of fs.readdirSync(libDir)) {
      if (!file.endsWith(".ts") || file === "round381.ts") continue;
      const body = fs.readFileSync(path.join(libDir, file), "utf8");
      assert.equal(body.includes(needle), false, `${feature} in ${file}`);
    }
  }
  assert.equal(toolPoint(" stylus "), "stylus");
  assert.equal(toolPoint("brass"), "");
  assert.equal(plasterDepth("8"), 8);
  assert.equal(plasterDepth(16), 16);
  assert.equal(plasterDepth(32), 32);
  assert.equal(plasterDepth(64), 64);
  assert.equal(plasterDepth("15"), null);
  assert.equal(plasterDepth("12"), null);
  assert.equal(coatCount("2"), 2);
  assert.equal(coatCount(4), 4);
  assert.equal(coatCount("6"), 6);
  assert.equal(coatCount("3"), null);
  assert.equal(coatCount("5"), null);
  assert.equal(plasterGround("ivory"), "IVORY");
  assert.equal(plasterGround("graphite"), "GRAPHITE");
  assert.equal(plasterGround("champagne"), "CHAMPAGNE");
  assert.equal(plasterGround("gold"), "");
  assert.equal(toolWarm("stylus"), true);
  assert.equal(toolWarm("KNIFE"), true);
  assert.equal(toolWarm("brush"), false);
  assert.equal(toolCool("brush"), true);
  assert.equal(toolCool("comb"), true);
  assert.equal(toolCool("stylus"), false);
  assert.equal(toolBand("stylus"), "first");
  assert.equal(toolBand("knife"), "second");
  assert.equal(toolBand("comb"), "third");
  assert.equal(toolBand("brush"), "fourth");
  assert.equal(toolGap("stylus", "brush"), 3);
  assert.equal(ivoryQuiet("ivory"), true);
  assert.equal(ivoryQuiet("graphite"), false);
  assert.equal(ivoryQuiet("champagne"), false);
  assert.equal(pairCoat(4), true);
  assert.equal(pairCoat(2), false);
  assert.equal(fullCoat(6), true);
  assert.equal(fullCoat(4), false);
  assert.equal(activeTool("warm"), "warm");
  assert.equal(activeDepth("8"), "8");
  assert.equal(activeDepth("12"), "all");
  assert.equal(activeCoat("6"), "6");
  assert.equal(activeCoat("9"), "all");
  assert.equal(activeGround("ivory", ["IVORY"]), "IVORY");
  assert.equal(suggestTool(4), "stylus");
  assert.equal(suggestTool(10), "knife");
  assert.equal(suggestTool(14), "comb");
  assert.equal(suggestTool(20), "brush");
  assert.equal(suggestDepth([], 1), 8);
  assert.equal(suggestDepth([], 6), 16);
  assert.equal(suggestDepth([], 11), 16);
  assert.equal(suggestDepth([], 14), 32);
  assert.equal(suggestDepth([], 19), 64);
  assert.equal(suggestGround([]), "IVORY");
  assert.equal(moveSlipFocus(0, 3, 1), 1);
  assert.equal(moveSlipFocus(0, 3, -1), 2);

  const saved = addSlip([], { id: "g1", title: "Stylus slip", hand: "Ada", tool: "stylus", depth: 8, ground: "ivory", coat: 2, tags: "s k x" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].ground, "IVORY");
  assert.equal(saved[0].tags.join(""), "sk");
  assert.equal(saved[0].audit, "save");
  assert.equal(addSlip(saved, { title: "Stylus slip" }).length, 1);
  const brush = rule({ id: "n1", title: "Brush slip", tool: "brush", coat: 2 });
  assert.equal(overdueSlip(brush), true);
  assert.equal(reminderSlips([brush])[0], "Brush slip");
  assert.equal(idleSlip(rule({ id: "i1", title: "Idle", depth: 8, coat: 2 })), true);
  assert.equal(briskSlip(rule({ id: "b1", title: "Brisk", ground: "CHAMPAGNE", depth: 64, coat: 6 })), true);
  assert.equal(restingSlip(rule({ id: "r1", title: "Rest", tool: "brush", ground: "IVORY", depth: 16 })), true);
  assert.equal(lateSlip(rule({ id: "l1", title: "Late", tool: "stylus" }), "brush"), true);
  assert.equal(lateSlip(rule({ id: "l2", title: "Held", tool: "stylus", raised: true }), "brush"), false);
  assert.equal(fairPlasterer([rule({ id: "a", title: "A", hand: "Ada" }), rule({ id: "b", title: "B", hand: "Bea", raised: true })], "Ada,Bea"), "Bea");
  const timeline = slipTimeline([rule({ id: "t", title: "Ten", depth: 8 })]);
  assert.equal(timeline[0].depth, 8);
  assert.equal(timeline[0].titles[0], "Ten");
  const views = readSlipViews([{ id: "v1", name: "Brush deck", tray: "store", query: "slip", hand: "Ada", ground: "GRAPHITE", tool: "cool", depth: "64", coat: "6" }]);
  assert.equal(views[0].tray, "store");
  assert.equal(views[0].tool, "cool");
  assert.equal(dropSlipView(views, "v1").length, 0);

  const now = Date.parse("2026-11-26T12:00:00Z");
  assert.equal(snpLane("FIRM", now), "firm");
  assert.equal(snpLane("please keep the floor", now), "firm");
  assert.equal(snpLane(true, now), "firm");
  assert.equal(snpLane(false, now), "plain");
  assert.equal(snpLane("BENCH", now), "bench");
  assert.equal(snpLane("WAIT", now), "wait");
  assert.equal(snpLane("AWAY", now), "gone");
  assert.equal(snpLane("TWIN", now), "twin");
  assert.equal(snpLane("TR#90", now), "twin");
  assert.equal(snpLane("#90555", now), "firm");
  assert.equal(snpLane("quiet keeper", now), "hush");
  assert.equal(snpLane("ext/12", now), "route");
  assert.equal(snpLane("ABCDE", now), "short");
  assert.equal(snpLane("12night", now), "tally");
  assert.equal(snpLane("55511122", now), "bench");
  assert.equal(snpLane("555111222", now), "tally");
  assert.equal(snpLane("AUSTRALIAXXXX", now), "vowel");
  assert.equal(snpLane("AUSTRALIAXXXXX", now), "long");
  assert.equal(snpLane("Orange", now), "vowel");
  assert.equal(snpLane("Spain", now), "short");
  assert.equal(snpLane("Desk", now), "plain");
  assert.equal(snpLane("2026-11-26T08:00:00Z", now), "firm");
  assert.equal(snpLane("2026-11-25T08:00:00Z", now), "bench");
  assert.equal(snpLane("2026-11-22T00:00:00Z", now), "wait");
  assert.equal(snpLane("2026-11-01T08:00:00Z", now), "gone");
  assert.equal(snpLane({ assigneeName: "FIRM" }, now), "firm");
  assert.equal(snpLane({ name: "Ada" }, now), "");
  assert.equal(snpLane({ assigneeName: "FIRM", amount: 1 }, now), "");
  assert.equal(snpHue("FIRM", now), "gilt");
  assert.equal(snpHue("BENCH", now), "ink");
  assert.equal(snpHue("ABCDE", now), "pearl");
  assert.equal(snpFirm("FIRM", now), true);
  assert.equal(snpHush("quiet keeper", now), true);
  assert.equal(snpWait("WAIT", now), true);
  assert.equal(snpGone("AWAY", now), true);
  assert.equal(snpBench("BENCH", now), true);
  assert.equal(snpTwin("TR#90", now), true);
  assert.equal(snpRoute("ext/12", now), true);
  assert.equal(snpShort("ABCDE", now), true);
  assert.equal(snpLongLane("AUSTRALIAXXXXX", now), true);
  assert.equal(snpTallyLane("12night", now), true);
  assert.equal(snpVowelLane("Orange", now), true);
  assert.equal(snpPlain("Desk", now), true);
  assert.equal(snpOpen(""), true);
  assert.equal(snpSoon("ABCDE", now), true);
  assert.equal(snpSoon("FIRM", now), false);
  assert.equal(snpLength("ABCDE"), 5);
  assert.equal(snpEven("FIRM"), true);
  assert.equal(snpDigit("12night"), true);
  assert.equal(snpVowel("Orange"), true);
  assert.equal(snpLower("spain"), true);
  assert.equal(snpUpper("AUSTRIA"), true);
  assert.equal(snpUpper("SPAIN"), false);
  assert.equal(snpUpper("TR"), false);
  assert.equal(snpFirst("Spain"), true);
  assert.equal(snpSpace("new spain"), true);
  const rows: SnpRow[] = [
    { id: "1", label: "Ada", code: "FIRM" },
    { id: "2", label: "Bea", code: "ABCDE" },
  ];
  assert.equal(leadingSnp(rows), "firm");
  assert.equal(leadingSnpHue(rows), "gilt");
  assert.match(snpLanesCsv(rows), /firm,1/);
  assert.match(snpRowsCsv(rows, ["1"]), /Ada,FIRM/);
  assert.match(snpRowsCsv(rows, ["1"]), /,1$/m);

  assert.equal(crmv4Text("en", "sgfTitle"), ROUND381_COPY.en.sgfTitle);
  assert.equal(crmv4Text("tr", "snpTitle"), ROUND381_COPY.tr.snpTitle);
  assert.equal(crmv4Text("de", "sgfHint"), ROUND381_COPY.de.sgfHint);
  assert.equal(crmv4Text("ru", "daCartellinoKicker"), ROUND381_COPY.ru.daCartellinoKicker);
  assert.equal(crmv4Text("ar", "chAbacusLead"), ROUND381_COPY.ar.chAbacusLead);
  const keys = Object.keys(ROUND381_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND381_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-sgraffito/);
  assert.match(css, /\.c4-sinopia/);
  assert.match(css, /\.c4-sgraffito-column/);
  assert.match(css, /\.c4-sinopia-column/);
  assert.match(css, /\.c4-doc-cartellino/);
  assert.match(css, /\.c4-channel-abacus/);
  assert.match(css, /\.c4-doc-cartellino-mast/);
  assert.match(css, /\.c4-channel-abacus-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round381.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("babevel"), false);
  assert.match(viewFile, /assigneeName:/);
  assert.match(viewFile, /slipCsv/);
  assert.match(viewFile, /snpRowsCsv/);
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
  assert.match(viewFile, /suggestGround/);
  assert.match(viewFile, /c4-sinopia-search/);
  assert.match(viewFile, /slipTimeline/);
  assert.match(viewFile, /c4-sgraffito-notices/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "sgf"/);
  assert.match(app, /view === "snp"/);
  const desk = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round12.tsx"), "utf8");
  assert.match(desk, /c4-doc-cartellino/);
  assert.match(desk, /c4-doc-cartellino-mast/);
  assert.match(desk, /data-logo="mono"/);
  assert.match(desk, /daCartellinoKicker/);
  assert.match(desk, /daCartellinoLead/);
  assert.match(desk, /data-doc-cartellino/);
  assert.match(desk, /c4-channel-abacus/);
  assert.match(desk, /c4-channel-abacus-mast/);
  assert.match(desk, /chAbacusKicker/);
  assert.match(desk, /chAbacusLead/);
  assert.match(desk, /data-channel-abacus/);
  const namedKeys = `${viewFile}\n${desk}`.match(/"(sgf|snp|daCartellino|chAbacus)[A-Za-z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND381_COPY.en[key as keyof typeof ROUND381_COPY.en], "string", key);
  console.log("crmv4 round381 tests passed");
}

main();
