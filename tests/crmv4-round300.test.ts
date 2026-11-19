/**
 * Circumferentor dials, notice plates, the ivory referral exedra, and the graphite reason tribune.
 * Run: TZ=UTC npx tsx tests/crmv4-round300.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND300_COPY } from "../src/lib/crmv4/copy-round300";
import {
  ROUND300_FEATURES,
  activeDegree,
  activeMetal,
  activePin,
  activeStation,
  addCircumferentor,
  briskCirc,
  circBand,
  circDegree,
  circMetal,
  circPin,
  circStation,
  dropCircView,
  fairCircBearer,
  fullPin,
  houseMetal,
  idleCirc,
  innerStation,
  lateCirc,
  leadingNotice,
  liftDegree,
  lowerDegree,
  moveCircFocus,
  noticeCapital,
  noticeDash,
  noticeDigit,
  noticeEven,
  noticeFirst,
  noticeHouse,
  noticeHue,
  noticeLane,
  noticeLanesCsv,
  noticeLength,
  noticePair,
  noticeQuery,
  noticeRowsCsv,
  noticeSoon,
  noticeSpace,
  noticeSpark,
  noticeState,
  noticeTail,
  noticeUpper,
  noticeVowel,
  outerStation,
  overdueCirc,
  pairPin,
  readCircViews,
  restingCirc,
  stationGap,
  suggestCircMetal,
  suggestDegree,
  suggestStation,
  type Circumferentor,
  type NoticeRow,
} from "../src/lib/crmv4/round300";

function dial(partial: Partial<Circumferentor> & { id: string; title: string }): Circumferentor {
  return {
    note: "",
    bearer: "",
    station: "",
    degree: null,
    metal: "",
    pin: 2,
    tags: [],
    set: false,
    sleeved: false,
    chested: false,
    flagged: false,
    audit: "",
    ...partial,
  };
}

function main() {
  assert.equal(ROUND300_FEATURES.length, 25);
  assert.equal(ROUND300_FEATURES.includes("notice"), true);
  assert.equal(ROUND300_FEATURES.includes("degree"), true);
  assert.equal(ROUND300_FEATURES.includes("fair-bearer"), true);
  assert.equal(circStation(" box "), "box");
  assert.equal(circStation("brass"), "");
  assert.equal(circDegree("7"), 7);
  assert.equal(circDegree(14), 14);
  assert.equal(circDegree("21"), 21);
  assert.equal(circDegree("28"), 28);
  assert.equal(circDegree("8"), null);
  assert.equal(circPin("2"), 2);
  assert.equal(circPin(4), 4);
  assert.equal(circPin("8"), 8);
  assert.equal(circPin("3"), null);
  assert.equal(circMetal("tin"), "TIN");
  assert.equal(circMetal("copper"), "COPPER");
  assert.equal(circMetal("gold"), "GOLD");
  assert.equal(circMetal("hot"), "");
  assert.equal(innerStation("box"), true);
  assert.equal(innerStation("NEEDLE"), true);
  assert.equal(innerStation("vane"), false);
  assert.equal(outerStation("clamp"), true);
  assert.equal(outerStation("vane"), true);
  assert.equal(outerStation("box"), false);
  assert.equal(circBand("box"), "case");
  assert.equal(circBand("needle"), "point");
  assert.equal(circBand("vane"), "slit");
  assert.equal(circBand("clamp"), "lock");
  assert.equal(circBand(""), "");
  assert.equal(stationGap("box", "clamp"), 3);
  assert.equal(stationGap("vane", "nope"), null);
  assert.equal(houseMetal("tin"), true);
  assert.equal(houseMetal("copper"), false);
  assert.equal(pairPin(4), true);
  assert.equal(pairPin(2), false);
  assert.equal(fullPin("8"), true);
  assert.equal(fullPin(4), false);
  assert.equal(activeStation("inner"), "inner");
  assert.equal(activeStation("clamp"), "clamp");
  assert.equal(activeStation("gold"), "all");
  assert.equal(activeDegree("28"), "28");
  assert.equal(activeDegree("8"), "all");
  assert.equal(activePin("2"), "2");
  assert.equal(activePin("3"), "all");
  assert.equal(activeMetal("gold", ["GOLD"]), "GOLD");
  assert.equal(activeMetal("hot", ["GOLD"]), "all");
  assert.equal(moveCircFocus(0, 3, -1), 2);
  assert.equal(moveCircFocus(0, 0, 1), 0);

  const cards = [
    dial({ id: "a", title: "Ada", station: "vane", pin: 2, bearer: "Ned" }),
    dial({ id: "b", title: "Bea", station: "box", metal: "GOLD", degree: 28, pin: 8, bearer: "Ned" }),
    dial({ id: "c", title: "Cara", station: "clamp", metal: "TIN", degree: 14, bearer: "Ida" }),
  ];
  assert.equal(overdueCirc(cards[0]), true);
  assert.equal(briskCirc(cards[1]), true);
  assert.equal(restingCirc(cards[2]), true);
  assert.equal(idleCirc(dial({ id: "i", title: "Idle", degree: 7, pin: 2 })), true);
  assert.equal(lateCirc(cards[1], "clamp"), true);
  assert.equal(lateCirc(cards[1], "box"), false);
  assert.equal(suggestCircMetal([]), "GOLD");
  assert.equal(suggestCircMetal(cards), "COPPER");
  assert.equal(suggestCircMetal([
    ...cards,
    dial({ id: "d", title: "Dora", metal: "TIN" }),
    dial({ id: "e", title: "Eve", metal: "COPPER" }),
    dial({ id: "f", title: "Fay", metal: "COPPER" }),
  ]), "GOLD");
  assert.equal(suggestDegree([], 3), 7);
  assert.equal(suggestDegree([], 9), 14);
  assert.equal(suggestDegree([], 14), 21);
  assert.equal(suggestDegree([], 20), 28);
  assert.equal(suggestDegree([dial({ id: "w", title: "Wide", degree: 28 })], 3), 21);
  assert.equal(suggestDegree([
    dial({ id: "p", title: "P", degree: 7 }),
    dial({ id: "q", title: "Q", degree: 7 }),
    dial({ id: "r", title: "R", degree: 14 }),
    dial({ id: "s", title: "S", degree: 14 }),
    dial({ id: "t", title: "T", degree: 21 }),
    dial({ id: "u", title: "U", degree: 21 }),
    dial({ id: "v", title: "V", degree: 28 }),
  ], 3), 28);
  assert.equal(suggestStation(8), "box");
  assert.equal(suggestStation(13), "clamp");
  assert.equal(fairCircBearer(cards, "Ned,Ida"), "Ida");
  const added = addCircumferentor(cards, { title: "Dora", station: "needle", degree: "14", pin: "4", tags: "a b t" });
  assert.equal(added.length, 4);
  assert.equal(added[3].audit, "save");
  assert.deepEqual(added[3].tags, ["a", "b"]);
  assert.equal(addCircumferentor(cards, { title: "Ada" }).length, 3);
  const lifted = liftDegree(cards, "a");
  assert.equal(lifted[0].degree, 7);
  assert.equal(lowerDegree(lifted, "a")[0].degree, 28);
  assert.equal(dropCircView([{ id: "v", name: "Desk", tray: "bench", query: "", bearer: "", metal: "all", station: "all", degree: "all", pin: "all" }], "v").length, 0);
  assert.equal(readCircViews([{ id: "", name: "x" }]).length, 0);

  assert.equal(noticeLane("Unix"), "seed");
  assert.equal(noticeLane("Hold the desk"), "house");
  assert.equal(noticeLane("re-check"), "dash");
  assert.equal(noticeLane("Call 2"), "pair");
  assert.equal(noticeLane("Hi there"), "spark");
  assert.equal(noticeLane("Hold?"), "query");
  assert.equal(noticeLane("A plain sentence of ordinary words without a mark"), "scroll");
  assert.equal(noticeLane(""), "");
  assert.equal(noticeState(""), "clear");
  assert.equal(noticeState({ city: "x" }), "");
  assert.equal(noticeState({ loginBlockedMessage: "Unix", amount: 3 }), "");
  assert.equal(noticeState({ loginBlockedMessage: "Unix" }), "set");
  assert.equal(noticeHue("Unix"), "champagne");
  assert.equal(noticeHue("Hold the desk"), "ivory");
  assert.equal(noticeHue("Call 2"), "graphite");
  assert.equal(noticeSoon("Unix"), true);
  assert.equal(noticeSoon("Hi there"), true);
  assert.equal(noticeSoon("Hold the desk"), false);
  assert.equal(noticeLength("Call 2"), 6);
  assert.equal(noticeLength(""), null);
  assert.equal(noticeEven("Unix"), true);
  assert.equal(noticeEven("Linux"), false);
  assert.equal(noticeFirst("Linux"), true);
  assert.equal(noticeFirst("2Call"), false);
  assert.equal(noticeTail("Note 4"), true);
  assert.equal(noticeTail("Linux"), false);
  assert.equal(noticeCapital("Linux"), true);
  assert.equal(noticeCapital("linux"), false);
  assert.equal(noticeSpace("Hi there"), true);
  assert.equal(noticeVowel("Unix"), true);
  assert.equal(noticeVowel("Linux"), false);
  assert.equal(noticeDigit("Call 2"), true);
  assert.equal(noticeHouse("Hold the desk"), true);
  assert.equal(noticeDash("re-check"), true);
  assert.equal(noticePair("Call 2"), true);
  assert.equal(noticeSpark("Hi there"), true);
  assert.equal(noticeQuery("Hold?"), true);
  assert.equal(noticeUpper("UNIX"), true);
  assert.equal(noticeUpper("Unix"), false);
  const rows: NoticeRow[] = [
    { id: "1", label: "Ada", notice: "Unix" },
    { id: "2", label: "Bea", notice: "A plain sentence of ordinary words without a mark" },
  ];
  assert.equal(leadingNotice(rows), "seed");
  assert.match(noticeLanesCsv(rows), /seed,1/);
  assert.match(noticeLanesCsv(rows), /scroll,1/);
  assert.match(noticeRowsCsv(rows, ["1"]), /Ada,Unix/);

  const locales = ["en", "tr", "de", "ru", "ar"] as const;
  const keys = Object.keys(ROUND300_COPY.en).sort();
  for (const locale of locales) assert.deepEqual(Object.keys(ROUND300_COPY[locale]).sort(), keys);
  assert.equal(crmv4Text("tr", "cfcTitle"), ROUND300_COPY.tr.cfcTitle);
  assert.equal(crmv4Text("de", "ntcTitle"), ROUND300_COPY.de.ntcTitle);
  assert.equal(crmv4Text("ru", "cfcSub"), ROUND300_COPY.ru.cfcSub);
  assert.equal(crmv4Text("ar", "ntcSub"), ROUND300_COPY.ar.ntcSub);
  assert.equal(crmv4Text("en", "cfcLogo"), "7FX");
  assert.equal(crmv4Text("en", "ntcLogo"), "7FX");
  assert.equal(crmv4Text("en", "cfcTitle"), "Circumferentor dials");
  assert.equal(crmv4Text("en", "ntcTitle"), "Notice plates");
  assert.equal(crmv4Text("en", "igExedraKicker"), "Ivory referral exedra");
  assert.equal(crmv4Text("en", "wrTribuneKicker"), "Graphite reason tribune");
  assert.notEqual(ROUND300_COPY.tr.cfcTitle, ROUND300_COPY.en.cfcTitle);
  assert.notEqual(ROUND300_COPY.ar.ntcTitle, ROUND300_COPY.en.ntcTitle);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-circ/);
  assert.match(css, /\.c4-notice-index/);
  assert.match(css, /\.c4-circ-column/);
  assert.match(css, /\.c4-notice-column/);
  assert.match(css, /\.c4-ib-exedra/);
  assert.match(css, /\.c4-reason-tribune-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round300.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /loginBlockedMessage:/);
  assert.match(viewFile, /circCsv/);
  assert.match(viewFile, /noticeRowsCsv/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "x"/);
  assert.match(viewFile, /event\.key === "a"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=24&meta=0&role=TRADER/);
  assert.match(viewFile, /data-cards/);
  assert.match(viewFile, /data-plates/);
  assert.match(viewFile, /data-names/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestCircMetal/);
  assert.match(viewFile, /c4-notice-search/);
  assert.match(viewFile, /circTimeline/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "cfc"/);
  assert.match(app, /view === "ntc"/);
  const exedra = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round83.tsx"), "utf8");
  assert.match(exedra, /c4-ib-exedra/);
  assert.match(exedra, /c4-ib-exedra-mast/);
  assert.match(exedra, /data-logo="mono"/);
  assert.match(exedra, /igExedraKicker/);
  assert.match(exedra, /igExedraLead/);
  assert.match(exedra, /data-ib-glance/);
  assert.equal(exedra.includes("amount"), false);
  assert.equal(exedra.includes("profit"), false);
  const tribune = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round85.tsx"), "utf8");
  assert.match(tribune, /c4-reason-tribune/);
  assert.match(tribune, /c4-reason-tribune-mast/);
  assert.match(tribune, /wrTribuneKicker/);
  assert.match(tribune, /wrTribuneLead/);
  assert.match(tribune, /data-reason-glance/);
  assert.equal(tribune.includes("amount"), false);
  assert.equal(tribune.includes("profit"), false);
  const named = `${viewFile}\n${exedra}\n${tribune}`.match(/"(cfc|ntc|igExedra|wrTribune)[a-zA-Z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of named) assert.equal(typeof ROUND300_COPY.en[key as keyof typeof ROUND300_COPY.en], "string", key);
  console.log("crmv4 round300 tests passed");
}

main();
