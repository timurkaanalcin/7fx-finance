/**
 * Burin cuts, colophon keepers, the ivory margin mensa, and the graphite month quaternion.
 * Run: TZ=UTC npx tsx tests/crmv4-round380.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND380_COPY } from "../src/lib/crmv4/copy-round380";
import { ROUND379_FEATURES } from "../src/lib/crmv4/round379";
import {
  ROUND380_FEATURES,
  activeGlaze,
  activeGraver,
  activeRib,
  activeSpan,
  addBurin,
  briskBurin,
  burinTimeline,
  colBare,
  colBrief,
  colDesk,
  colDigit,
  colEven,
  colFirst,
  colHue,
  colLane,
  colLanesCsv,
  colLater,
  colLength,
  colLine,
  colLower,
  colOpen,
  colPair,
  colReturn,
  colRowsCsv,
  colScope,
  colShut,
  colSoon,
  colSpace,
  colSpanLane,
  colUpper,
  colVowel,
  colVowelLane,
  dropBurinView,
  fairHand,
  fullRib,
  graverBand,
  graverCool,
  graverGap,
  graverGlaze,
  graverPoint,
  graverSpan,
  graverWarm,
  idleBurin,
  lateBurin,
  leadingCol,
  leadingColHue,
  moveBurinFocus,
  overdueBurin,
  pairRib,
  pearlQuiet,
  readBurinViews,
  reminderBurins,
  restingBurin,
  ribCount,
  suggestGlaze,
  suggestGraver,
  suggestSpan,
  type Burin,
  type ColRow,
} from "../src/lib/crmv4/round380";

function rule(partial: Partial<Burin> & { id: string; title: string }): Burin {
  return {
    note: "",
    hand: "",
    graver: "",
    sla: null,
    glaze: "",
    rib: 3,
    tags: [],
    raised: false,
    vised: false,
    foliod: false,
    starred: false,
    audit: "",
    ...partial,
  };
}

function main() {
  assert.equal(ROUND380_FEATURES.length, 25);
  assert.equal(new Set(ROUND380_FEATURES).size, 25);
  for (const feature of ROUND380_FEATURES) assert.equal((ROUND379_FEATURES as readonly string[]).includes(feature), false, feature);
  assert.equal(graverPoint(" graver "), "graver");
  assert.equal(graverPoint("brass"), "");
  assert.equal(graverSpan("12"), 12);
  assert.equal(graverSpan(24), 24);
  assert.equal(graverSpan(48), 48);
  assert.equal(graverSpan(96), 96);
  assert.equal(graverSpan("15"), null);
  assert.equal(graverSpan("8"), null);
  assert.equal(ribCount("3"), 3);
  assert.equal(ribCount(5), 5);
  assert.equal(ribCount("7"), 7);
  assert.equal(ribCount("2"), null);
  assert.equal(ribCount("6"), null);
  assert.equal(graverGlaze("pearl"), "PEARL");
  assert.equal(graverGlaze("ink"), "INK");
  assert.equal(graverGlaze("gilt"), "GILT");
  assert.equal(graverGlaze("gold"), "");
  assert.equal(graverWarm("graver"), true);
  assert.equal(graverWarm("HATCH"), true);
  assert.equal(graverWarm("burr"), false);
  assert.equal(graverCool("burr"), true);
  assert.equal(graverCool("dry"), true);
  assert.equal(graverCool("graver"), false);
  assert.equal(graverBand("graver"), "first");
  assert.equal(graverBand("hatch"), "second");
  assert.equal(graverBand("burr"), "third");
  assert.equal(graverBand("dry"), "fourth");
  assert.equal(graverGap("graver", "dry"), 3);
  assert.equal(pearlQuiet("pearl"), true);
  assert.equal(pearlQuiet("ink"), false);
  assert.equal(pearlQuiet("gilt"), false);
  assert.equal(pairRib(5), true);
  assert.equal(pairRib(3), false);
  assert.equal(fullRib(7), true);
  assert.equal(fullRib(5), false);
  assert.equal(activeGraver("warm"), "warm");
  assert.equal(activeSpan("12"), "12");
  assert.equal(activeSpan("8"), "all");
  assert.equal(activeRib("7"), "7");
  assert.equal(activeRib("9"), "all");
  assert.equal(activeGlaze("pearl", ["PEARL"]), "PEARL");
  assert.equal(suggestGraver(4), "graver");
  assert.equal(suggestGraver(10), "hatch");
  assert.equal(suggestGraver(14), "burr");
  assert.equal(suggestGraver(20), "dry");
  assert.equal(suggestSpan([], 1), 12);
  assert.equal(suggestSpan([], 6), 24);
  assert.equal(suggestSpan([], 11), 48);
  assert.equal(suggestSpan([], 16), 48);
  assert.equal(suggestSpan([], 19), 96);
  assert.equal(suggestGlaze([]), "PEARL");
  assert.equal(moveBurinFocus(0, 3, 1), 1);
  assert.equal(moveBurinFocus(0, 3, -1), 2);

  const saved = addBurin([], { id: "g1", title: "Graver burin", hand: "Ada", graver: "graver", sla: 12, glaze: "pearl", rib: 3, tags: "g h x" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].glaze, "PEARL");
  assert.equal(saved[0].tags.join(""), "gh");
  assert.equal(saved[0].audit, "save");
  assert.equal(addBurin(saved, { title: "Graver burin" }).length, 1);
  const dry = rule({ id: "n1", title: "Dry burin", graver: "dry", rib: 3 });
  assert.equal(overdueBurin(dry), true);
  assert.equal(reminderBurins([dry])[0], "Dry burin");
  assert.equal(idleBurin(rule({ id: "i1", title: "Idle", sla: 12, rib: 3 })), true);
  assert.equal(briskBurin(rule({ id: "b1", title: "Brisk", glaze: "GILT", sla: 96, rib: 7 })), true);
  assert.equal(restingBurin(rule({ id: "r1", title: "Rest", graver: "dry", glaze: "PEARL", sla: 24 })), true);
  assert.equal(lateBurin(rule({ id: "l1", title: "Late", graver: "graver" }), "dry"), true);
  assert.equal(lateBurin(rule({ id: "l2", title: "Held", graver: "graver", raised: true }), "dry"), false);
  assert.equal(fairHand([rule({ id: "a", title: "A", hand: "Ada" }), rule({ id: "b", title: "B", hand: "Bea", raised: true })], "Ada,Bea"), "Bea");
  const timeline = burinTimeline([rule({ id: "t", title: "Ten", sla: 12 })]);
  assert.equal(timeline[0].sla, 12);
  assert.equal(timeline[0].titles[0], "Ten");
  const views = readBurinViews([{ id: "v1", name: "Dry deck", tray: "folio", query: "burin", hand: "Ada", glaze: "INK", graver: "cool", sla: "96", rib: "7" }]);
  assert.equal(views[0].tray, "folio");
  assert.equal(views[0].graver, "cool");
  assert.equal(dropBurinView(views, "v1").length, 0);

  const now = Date.parse("2026-11-26T12:00:00Z");
  assert.equal(colLane("LEAD", now), "mark");
  assert.equal(colLane("please keep the desk", now), "mark");
  assert.equal(colLane(true, now), "mark");
  assert.equal(colLane(false, now), "bare");
  assert.equal(colLane("QUEUE", now), "desk");
  assert.equal(colLane("SOON", now), "later");
  assert.equal(colLane("LEFT", now), "return");
  assert.equal(colLane("DUAL", now), "pair");
  assert.equal(colLane("TR+90", now), "pair");
  assert.equal(colLane("hidden keeper", now), "shut");
  assert.equal(colLane("ext:12", now), "scope");
  assert.equal(colLane("ABCD", now), "brief");
  assert.equal(colLane("12night", now), "digit");
  assert.equal(colLane("55511122", now), "desk");
  assert.equal(colLane("+90555", now), "mark");
  assert.equal(colLane("AUSTRALIAXXXX", now), "span");
  assert.equal(colLane("Orange", now), "openv");
  assert.equal(colLane("Spain", now), "bare");
  assert.equal(colLane("2026-11-26T08:00:00Z", now), "mark");
  assert.equal(colLane("2026-11-25T08:00:00Z", now), "desk");
  assert.equal(colLane("2026-11-22T00:00:00Z", now), "later");
  assert.equal(colLane("2026-11-01T08:00:00Z", now), "return");
  assert.equal(colLane({ assigneeName: "LEAD" }, now), "mark");
  assert.equal(colLane({ name: "Ada" }, now), "");
  assert.equal(colLane({ assigneeName: "LEAD", amount: 1 }, now), "");
  assert.equal(colHue("LEAD", now), "gilt");
  assert.equal(colHue("QUEUE", now), "ink");
  assert.equal(colHue("ABCDEF", now), "pearl");
  assert.equal(colLine("LEAD", now), true);
  assert.equal(colDesk("QUEUE", now), true);
  assert.equal(colLater("SOON", now), true);
  assert.equal(colReturn("LEFT", now), true);
  assert.equal(colShut("sealed", now), true);
  assert.equal(colPair("TR+90", now), true);
  assert.equal(colScope("ext:12", now), true);
  assert.equal(colBrief("ABCD", now), true);
  assert.equal(colSpanLane("AUSTRALIAXXXX", now), true);
  assert.equal(colBare("Spain", now), true);
  assert.equal(colOpen(""), true);
  assert.equal(colSoon("ABCD", now), true);
  assert.equal(colSoon("SPAIN", now), false);
  assert.equal(colLength("ABCD"), 4);
  assert.equal(colEven("LEAD"), true);
  assert.equal(colDigit("12night"), true);
  assert.equal(colVowel("Orange"), true);
  assert.equal(colVowelLane("Orange", now), true);
  assert.equal(colLower("spain"), true);
  assert.equal(colUpper("SPAIN"), true);
  assert.equal(colUpper("TR"), false);
  assert.equal(colFirst("Spain"), true);
  assert.equal(colSpace("new spain"), true);
  const rows: ColRow[] = [
    { id: "1", label: "Ada", code: "LEAD" },
    { id: "2", label: "Bea", code: "ABCD" },
  ];
  assert.equal(leadingCol(rows), "mark");
  assert.equal(leadingColHue(rows), "gilt");
  assert.match(colLanesCsv(rows), /mark,1/);
  assert.match(colRowsCsv(rows, ["1"]), /Ada,LEAD/);
  assert.match(colRowsCsv(rows, ["1"]), /,1$/m);

  assert.equal(crmv4Text("en", "burTitle"), ROUND380_COPY.en.burTitle);
  assert.equal(crmv4Text("tr", "colTitle"), ROUND380_COPY.tr.colTitle);
  assert.equal(crmv4Text("de", "burHint"), ROUND380_COPY.de.burHint);
  assert.equal(crmv4Text("ru", "mgMensaKicker"), ROUND380_COPY.ru.mgMensaKicker);
  assert.equal(crmv4Text("ar", "msQuaternionLead"), ROUND380_COPY.ar.msQuaternionLead);
  const keys = Object.keys(ROUND380_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND380_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-burin/);
  assert.match(css, /\.c4-colophon/);
  assert.match(css, /\.c4-burin-column/);
  assert.match(css, /\.c4-colophon-column/);
  assert.match(css, /\.c4-margin-mensa/);
  assert.match(css, /\.c4-month-quaternion/);
  assert.match(css, /\.c4-margin-mensa-mast/);
  assert.match(css, /\.c4-month-quaternion-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round380.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("babevel"), false);
  assert.match(viewFile, /assigneeName:/);
  assert.match(viewFile, /burinCsv/);
  assert.match(viewFile, /colRowsCsv/);
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
  assert.match(viewFile, /suggestGlaze/);
  assert.match(viewFile, /c4-colophon-search/);
  assert.match(viewFile, /burinTimeline/);
  assert.match(viewFile, /c4-burin-notices/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "brn"/);
  assert.match(app, /view === "col"/);
  const desk = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round12.tsx"), "utf8");
  assert.match(desk, /c4-margin-mensa/);
  assert.match(desk, /c4-margin-mensa-mast/);
  assert.match(desk, /data-logo="mono"/);
  assert.match(desk, /mgMensaKicker/);
  assert.match(desk, /mgMensaLead/);
  assert.match(desk, /data-margin-mensa/);
  assert.match(desk, /c4-month-quaternion/);
  assert.match(desk, /c4-month-quaternion-mast/);
  assert.match(desk, /msQuaternionKicker/);
  assert.match(desk, /msQuaternionLead/);
  assert.match(desk, /data-month-quaternion/);
  const namedKeys = `${viewFile}\n${desk}`.match(/"(bur|col|mgMensa|msQuaternion)[A-Za-z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND380_COPY.en[key as keyof typeof ROUND380_COPY.en], "string", key);
  console.log("crmv4 round380 tests passed");
}

main();
