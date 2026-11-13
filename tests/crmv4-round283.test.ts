/**
 * Reflecting circles, phone plates, and the record folio.
 * Run: TZ=UTC npx tsx tests/crmv4-round283.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND283_COPY } from "../src/lib/crmv4/copy-round283";
import {
  ROUND283_FEATURES,
  activeCircle,
  activeDegree,
  activeFinish,
  activeInk,
  activeStop,
  addReflecting,
  briskReflecting,
  circleBand,
  circleGap,
  circleOf,
  dipDegree,
  dropReflectingView,
  evenStop,
  fairKeeper,
  finishOf,
  houseFinish,
  idleReflecting,
  inkOf,
  keenCircle,
  lateReflecting,
  leadingPhone,
  liftDegree,
  moveReflectFocus,
  overdueReflecting,
  phoneCap,
  phoneDash,
  phoneEcho,
  phoneEven,
  phoneGroups,
  phoneHue,
  phoneKnown,
  phoneLane,
  phoneLanesCsv,
  phoneLeap,
  phoneOdd,
  phoneParen,
  phoneRowsCsv,
  phoneSpace,
  phoneState,
  phoneStep,
  phoneTail,
  phoneTwin,
  phoneWide,
  readReflectingViews,
  reflectingDegree,
  reflectingStop,
  restingReflecting,
  stillCircle,
  suggestCircle,
  suggestDegree,
  suggestFinish,
  type PhoneRow,
  type ReflectingSight,
} from "../src/lib/crmv4/round283";

function card(partial: Partial<ReflectingSight> & { id: string; title: string }): ReflectingSight {
  return {
    note: "",
    keeper: "",
    circle: "",
    degree: null,
    finish: "",
    ink: "",
    stop: 2,
    tags: [],
    logged: false,
    locked: false,
    stowed: false,
    flagged: false,
    audit: "",
    ...partial,
  };
}

function main() {
  assert.equal(ROUND283_FEATURES.length, 25);
  assert.equal(circleOf(" vernier "), "vernier");
  assert.equal(circleOf("paris"), "");
  assert.equal(reflectingDegree("30"), 30);
  assert.equal(reflectingDegree(60), 60);
  assert.equal(reflectingDegree("90"), 90);
  assert.equal(reflectingDegree("15"), null);
  assert.equal(reflectingDegree("45"), null);
  assert.equal(reflectingStop("2"), 2);
  assert.equal(reflectingStop(6), 6);
  assert.equal(reflectingStop("12"), 12);
  assert.equal(reflectingStop("4"), null);
  assert.equal(reflectingStop("8"), null);
  assert.equal(finishOf("ivory"), "IVORY");
  assert.equal(finishOf("graphite"), "GRAPHITE");
  assert.equal(finishOf("champagne"), "CHAMPAGNE");
  assert.equal(finishOf("gilt"), "");
  assert.equal(inkOf("pearl"), "pearl");
  assert.equal(inkOf("bronze"), "bronze");
  assert.equal(inkOf("pitch"), "pitch");
  assert.equal(inkOf("soot"), "");
  assert.equal(keenCircle("vernier"), true);
  assert.equal(keenCircle("ALIDADE"), true);
  assert.equal(keenCircle("mirror"), false);
  assert.equal(stillCircle("mirror"), true);
  assert.equal(stillCircle("index"), true);
  assert.equal(stillCircle("vernier"), false);
  assert.equal(circleBand("mirror"), "dawn");
  assert.equal(circleBand("vernier"), "noon");
  assert.equal(circleBand("index"), "dusk");
  assert.equal(circleBand("alidade"), "night");
  assert.equal(circleBand(""), "");
  assert.equal(circleGap("mirror", "vernier"), 1);
  assert.equal(circleGap("vernier", "mirror"), -1);
  assert.equal(circleGap("", "mirror"), null);
  assert.equal(houseFinish("graphite"), true);
  assert.equal(houseFinish("CHAMPAGNE"), true);
  assert.equal(houseFinish("ivory"), false);
  assert.equal(evenStop(6), true);
  assert.equal(evenStop("6"), true);
  assert.equal(evenStop(2), false);
  assert.equal(evenStop(12), false);
  assert.equal(activeCircle("keen"), "keen");
  assert.equal(activeCircle("vernier"), "vernier");
  assert.equal(activeCircle("paris"), "all");
  assert.equal(activeDegree("30"), "30");
  assert.equal(activeDegree("9"), "all");
  assert.equal(activeInk("bronze", ["pearl", "bronze", "pitch"]), "bronze");
  assert.equal(activeInk("mist", ["pearl", "bronze", "pitch"]), "all");
  assert.equal(activeStop("6"), "6");
  assert.equal(activeStop("4"), "all");
  assert.equal(activeFinish("graphite"), "graphite");
  assert.equal(moveReflectFocus(0, 4, 1), 1);
  assert.equal(moveReflectFocus(0, 4, -1), 3);
  assert.equal(suggestFinish([]), "IVORY");
  assert.equal(suggestDegree([], 5), 30);
  assert.equal(suggestDegree([], 10), 60);
  assert.equal(suggestDegree([], 20), 90);
  assert.equal(suggestCircle(8), "mirror");
  assert.equal(suggestCircle(11), "alidade");
  assert.equal(fairKeeper([card({ id: "1", title: "North", keeper: "Ada" })], "Ada,Bea"), "Bea");

  const saved = addReflecting([], { id: "1", title: "North", circle: "vernier", degree: 30, ink: "bronze", stop: 12, keeper: "Ada" });
  assert.equal(saved[0].audit, "save");
  assert.equal(overdueReflecting(saved[0]), true);
  assert.equal(briskReflecting(saved[0]), true);
  assert.equal(liftDegree(saved, "1")[0].degree, 60);
  assert.equal(dipDegree([{ ...saved[0], degree: null }], "1")[0].degree, 90);
  const quiet = card({ id: "2", title: "West", circle: "mirror", ink: "pearl", stop: 2 });
  assert.equal(idleReflecting(quiet), true);
  assert.equal(lateReflecting(quiet, "alidade"), true);
  const rest = card({ id: "3", title: "East", circle: "alidade", ink: "pitch", degree: 90, stop: 6 });
  assert.equal(restingReflecting(rest), true);
  const views = readReflectingViews([{ id: "v1", name: "Morning", tray: "case", circle: "keen", degree: "30", stop: "6", ink: "pitch", finish: "ivory" }]);
  assert.equal(views[0].tray, "case");
  assert.equal(dropReflectingView(views, "v1").length, 0);

  assert.equal(phoneLane("+905551112233"), "house");
  assert.equal(phoneLane("+331234567890"), "plus");
  assert.equal(phoneLane("0555 111 2230"), "trunk");
  assert.equal(phoneLane("1234567890123"), "long");
  assert.equal(phoneLane("5551212"), "desk");
  assert.equal(phoneLane("12345"), "short");
  assert.equal(phoneHue("+905551112233"), "graphite");
  assert.equal(phoneHue("5551212"), "ivory");
  assert.equal(phoneHue("+4412345678"), "champagne");
  assert.equal(phoneKnown("+49 30 123456"), true);
  assert.equal(phoneKnown("+33 1 234567"), false);
  assert.equal(phoneGroups("0555 111 2230"), 3);
  assert.equal(phoneGroups("+90555"), 1);
  assert.equal(phoneStep("1234567890"), 10);
  assert.equal(phoneLeap("1234567890"), true);
  assert.equal(phoneWide("123456789012"), true);
  assert.equal(phoneDash("+90-555-0101"), true);
  assert.equal(phoneSpace("0555 111 2230"), true);
  assert.equal(phoneParen("(555) 1212"), true);
  assert.equal(phoneTwin("112"), true);
  assert.equal(phoneEcho("0555 111 2230"), true);
  assert.equal(phoneTail("0555 111 2230"), true);
  assert.equal(phoneCap("+90"), true);
  assert.equal(phoneEven("+905551112233"), true);
  assert.equal(phoneOdd("12345"), true);
  assert.equal(phoneState({ phone: "+90", amount: 3 }), "");
  assert.equal(phoneState(""), "clear");
  assert.equal(phoneState({ city: "x" }), "");
  const rows: PhoneRow[] = [
    { id: "1", label: "Ada", note: "+905551112233" },
    { id: "2", label: "Bea", note: "12345" },
  ];
  assert.equal(leadingPhone(rows), "house");
  assert.match(phoneLanesCsv(rows), /house,1/);
  assert.match(phoneLanesCsv(rows), /short,1/);
  assert.match(phoneRowsCsv(rows, ["1"]), /Ada,\+905551112233,33,house,graphite/);

  const locales = ["en", "tr", "de", "ru", "ar"] as const;
  const keys = Object.keys(ROUND283_COPY.en).sort();
  for (const locale of locales) assert.deepEqual(Object.keys(ROUND283_COPY[locale]).sort(), keys);
  assert.equal(crmv4Text("tr", "rfcTitle"), ROUND283_COPY.tr.rfcTitle);
  assert.equal(crmv4Text("de", "phnTitle"), ROUND283_COPY.de.phnTitle);
  assert.equal(crmv4Text("ru", "rfcSub"), ROUND283_COPY.ru.rfcSub);
  assert.equal(crmv4Text("ar", "phnSub"), ROUND283_COPY.ar.phnSub);
  assert.equal(crmv4Text("en", "rfcLogo"), "7FX");
  assert.equal(crmv4Text("en", "rfcTitle"), "Reflecting circles");
  assert.equal(crmv4Text("en", "phnTitle"), "Phone plates");
  assert.equal(crmv4Text("en", "recFolKicker"), "Record folio");
  assert.equal(crmv4Text("en", "lstFolKicker"), "List folio");
  assert.notEqual(ROUND283_COPY.tr.rfcTitle, ROUND283_COPY.en.rfcTitle);
  assert.equal(crmv4Text("en", "lngTitle"), "Language plates");

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-reflect/);
  assert.match(css, /\.c4-phoneplate-index/);
  assert.match(css, /\.c4-reflect-column/);
  assert.match(css, /\.c4-phoneplate-column/);
  assert.match(css, /\.c4-record-folio/);
  assert.match(css, /\.c4-record-folio-mast/);
  assert.match(css, /\.c4-list-folio/);
  assert.match(css, /\.c4-list-folio-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round283.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /phone:/);
  assert.match(viewFile, /reflectingCsv/);
  assert.match(viewFile, /phoneRowsCsv/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "x"/);
  assert.match(viewFile, /event\.key === "j"/);
  assert.match(viewFile, /event\.key === "n"/);
  assert.match(viewFile, /event\.key === "l"/);
  assert.match(viewFile, /event\.key === "g"/);
  assert.match(viewFile, /event\.key === "h"/);
  assert.match(viewFile, /event\.key === "w"/);
  assert.match(viewFile, /event\.key === "b"/);
  assert.match(viewFile, /event\.key === "p"/);
  assert.match(viewFile, /event\.key === "u"/);
  assert.match(viewFile, /event\.key === "y"/);
  assert.match(viewFile, /event\.key === "m"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=24&meta=0&role=TRADER/);
  assert.match(viewFile, /data-cards/);
  assert.match(viewFile, /data-plates/);
  assert.match(viewFile, /data-names/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestFinish/);
  assert.match(viewFile, /c4-phoneplate-search/);
  assert.match(viewFile, /reflectingTimeline/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "rfc"/);
  assert.match(app, /view === "phn"/);
  const record = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round31.tsx"), "utf8");
  assert.match(record, /c4-record-folio/);
  assert.match(record, /c4-record-folio-mast/);
  assert.match(record, /c4-record-folio-chip/);
  assert.match(record, /c4-list-folio/);
  assert.match(record, /c4-list-folio-mast/);
  assert.match(record, /c4-list-folio-empty/);
  assert.match(record, /data-logo="mono"/);
  assert.match(record, /recFolKicker/);
  assert.match(record, /recFolLead/);
  assert.match(record, /lstFolKicker/);
  assert.match(record, /lstFolLead/);
  const head = record.slice(record.indexOf("export function RecordHead"));
  assert.equal(head.includes("sendJson"), false);
  assert.equal(head.includes("fetch("), false);
  const used = new Set(viewFile.match(/v4\("([a-zA-Z0-9]+)"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of Array.from(used)) assert.ok(key in ROUND283_COPY.en, key);
  const named = viewFile.match(/"(rfc|phn)[a-zA-Z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of named) assert.ok(key in ROUND283_COPY.en, key);
  const folio = record.match(/v4\("((?:recFol|lstFol)[a-zA-Z0-9]+)"\)/g)?.map((item) => item.slice(4, -2)) || [];
  for (const key of folio) assert.ok(key in ROUND283_COPY.en, key);
  console.log("crmv4 round283 tests passed");
}

main();
