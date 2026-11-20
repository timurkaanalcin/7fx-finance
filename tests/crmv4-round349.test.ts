/**
 * Tachymeter rules, affiliate plates, the ivory chip puteal, and the graphite preset crepidoma.
 * Run: TZ=UTC npx tsx tests/crmv4-round349.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND349_COPY } from "../src/lib/crmv4/copy-round349";
import {
  ROUND349_FEATURES,
  activeFinish,
  activeMode,
  activeHour,
  activeHammer,
  addTachymeter,
  briskTachymeter,
  dropTachymeterView,
  fairKeeper,
  affiliateHome,
  affiliateBrief,
  affiliateCapital,
  affiliateDigit,
  affiliateEven,
  affiliateFirst,
  affiliateGap,
  affiliateHue,
  affiliateJoin,
  affiliateCitizen,
  affiliateLane,
  affiliateLanesCsv,
  affiliateLength,
  affiliateLower,
  affiliateGuest,
  affiliateAway,
  affiliateOpen,
  affiliatePlain,
  affiliateLong,
  affiliateRowsCsv,
  affiliateSoon,
  affiliateSpace,
  affiliateState,
  affiliateUpper,
  affiliateVowel,
  fullHammer,
  idleTachymeter,
  lateTachymeter,
  leadingAffiliate,
  moveTachymeterFocus,
  tachymeterBand,
  tachymeterHour,
  tachymeterGap,
  tachymeterInner,
  tachymeterMode,
  tachymeterOuter,
  tachymeterHammer,
  tachymeterFilm,
  tachymeterTimeline,
  overdueTachymeter,
  pairHammer,
  quietFinish,
  readTachymeterViews,
  reminderTachymeters,
  restingTachymeter,
  suggestFinish,
  suggestMode,
  suggestHour,
  type AffiliateRow,
  type Tachymeter,
} from "../src/lib/crmv4/round349";

function rule(partial: Partial<Tachymeter> & { id: string; title: string }): Tachymeter {
  return {
    note: "",
    setter: "",
    piece: "",
    drop: null,
    film: "",
    lock: 4,
    tags: [],
    raised: false,
    pinned: false,
    coffered: false,
    starred: false,
    audit: "",
    ...partial,
  };
}

function main() {
  assert.equal(ROUND349_FEATURES.length, 25);
  assert.equal(ROUND349_FEATURES.includes("affiliate-plate"), true);
  assert.equal(ROUND349_FEATURES.includes("tachymeter-pin-sla"), true);
  assert.equal(ROUND349_FEATURES.includes("fair-reader"), true);
  assert.equal(ROUND349_FEATURES.includes("scale-archive"), true);
  assert.equal(ROUND349_FEATURES.includes("scale-reminders"), true);
  assert.equal(ROUND349_FEATURES.includes("tachymeter-search"), true);
  assert.equal(ROUND349_FEATURES.includes("scale-timeline"), true);
  assert.equal(tachymeterMode(" scale "), "scale");
  assert.equal(tachymeterMode("brass"), "");
  assert.equal(tachymeterHour("5"), 5);
  assert.equal(tachymeterHour(15), 15);
  assert.equal(tachymeterHour(30), 30);
  assert.equal(tachymeterHour(60), 60);
  assert.equal(tachymeterHour("4"), null);
  assert.equal(tachymeterHour("8"), null);
  assert.equal(tachymeterHammer("2"), 2);
  assert.equal(tachymeterHammer(4), 4);
  assert.equal(tachymeterHammer("8"), 8);
  assert.equal(tachymeterHammer("3"), null);
  assert.equal(tachymeterHammer("6"), null);
  assert.equal(tachymeterFilm("gilt"), "GILT");
  assert.equal(tachymeterFilm("ivory"), "IVORY");
  assert.equal(tachymeterFilm("graphite"), "GRAPHITE");
  assert.equal(tachymeterFilm("hot"), "");
  assert.equal(tachymeterInner("scale"), true);
  assert.equal(tachymeterInner("SPIRAL"), true);
  assert.equal(tachymeterInner("pulse"), false);
  assert.equal(tachymeterOuter("pulse"), true);
  assert.equal(tachymeterOuter("mile"), true);
  assert.equal(tachymeterOuter("scale"), false);
  assert.equal(tachymeterBand("scale"), "bezel");
  assert.equal(tachymeterBand("spiral"), "coil");
  assert.equal(tachymeterBand("pulse"), "beat");
  assert.equal(tachymeterBand("mile"), "post");
  assert.equal(tachymeterGap("scale", "mile"), 3);
  assert.equal(quietFinish("ivory"), true);
  assert.equal(quietFinish("gilt"), false);
  assert.equal(pairHammer(4), true);
  assert.equal(pairHammer(2), false);
  assert.equal(fullHammer(8), true);
  assert.equal(fullHammer(4), false);
  assert.equal(activeMode("inner"), "inner");
  assert.equal(activeHour("30"), "30");
  assert.equal(activeHour("4"), "all");
  assert.equal(activeHammer("8"), "8");
  assert.equal(activeHammer("3"), "all");
  assert.equal(activeFinish("gilt", ["GILT"]), "GILT");
  assert.equal(suggestMode(6), "scale");
  assert.equal(suggestMode(14), "mile");
  assert.equal(suggestHour([], 4), 5);
  assert.equal(suggestHour([], 8), 15);
  assert.equal(suggestHour([], 14), 30);
  assert.equal(suggestHour([], 20), 60);
  assert.equal(suggestFinish([]), "IVORY");
  assert.equal(moveTachymeterFocus(0, 3, 1), 1);
  assert.equal(moveTachymeterFocus(0, 3, -1), 2);
  const late = rule({ id: "a", title: "Ada", piece: "scale" });
  const due = rule({ id: "b", title: "Bea", piece: "pulse", lock: 2 });
  const quiet = rule({ id: "c", title: "Cara", drop: 5, lock: 2 });
  const cell = rule({ id: "d", title: "Dora", film: "GILT", drop: 60, lock: 8 });
  const fax = rule({ id: "e", title: "Eve", piece: "mile", film: "IVORY", drop: 15 });
  assert.equal(lateTachymeter(late, "mile"), true);
  assert.equal(lateTachymeter(late, "scale"), false);
  assert.equal(overdueTachymeter(due), true);
  assert.equal(idleTachymeter(quiet), true);
  assert.equal(briskTachymeter(cell), true);
  assert.equal(restingTachymeter(fax), true);
  assert.deepEqual(reminderTachymeters([due, late]), ["Bea"]);
  assert.equal(fairKeeper([rule({ id: "1", title: "One", setter: "Ada" }), rule({ id: "2", title: "Two", setter: "Bea" }), rule({ id: "3", title: "Three", setter: "Ada" })], "Ada,Bea"), "Bea");
  const cards = [rule({ id: "1", title: "North", drop: 30 }), rule({ id: "2", title: "East", drop: 15 })];
  assert.match(tachymeterTimeline(cards).map((mail) => mail.drop).join(","), /30/);
  const saved = addTachymeter([], { title: "Ada", piece: "spiral", drop: "15", film: "gilt", lock: "4", tags: "s p x" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].piece, "spiral");
  assert.equal(saved[0].drop, 15);
  assert.equal(saved[0].lock, 4);
  assert.deepEqual(saved[0].tags, ["s", "p"]);
  assert.equal(addTachymeter(saved, { title: "Ada" }).length, 1);
  assert.equal(addTachymeter([], { title: "Eve" })[0].lock, 2);
  assert.equal(dropTachymeterView([{ id: "v", name: "Morning", tray: "board", query: "", setter: "", film: "all", piece: "all", drop: "all", lock: "all" }], "v").length, 0);
  assert.equal(readTachymeterViews([{ id: "v", name: "Morning", tray: "peg" }])[0].tray, "peg");

  const stamp = "2026-11-20T07:30:00.000Z";
  assert.equal(affiliateHome("web"), true);
  assert.equal(affiliateHome("WEB"), true);
  assert.equal(affiliateAway("DESK"), true);
  assert.equal(affiliateGuest("MAIL"), true);
  assert.equal(affiliateCitizen("FAIR"), true);
  assert.equal(affiliateHome({ affiliateC: true }), true);
  assert.equal(affiliatePlain({ affiliateC: false }), true);
  assert.equal(affiliateAway({ affiliateC: false }), false);
  assert.equal(affiliatePlain({ affiliateC: "Letter" }), true);
  assert.equal(affiliateHome({ affiliateC: "Letter" }), false);
  assert.equal(affiliateBrief({ affiliateC: "ABCD" }), true);
  assert.equal(affiliateJoin("Desk/West"), true);
  assert.equal(affiliateJoin("ANNA NOAH"), false);
  assert.equal(affiliateGap("US-East"), true);
  assert.equal(affiliateGap("LIVEHOLD"), false);
  assert.equal(affiliateBrief("ABCD"), true);
  assert.equal(affiliateBrief("WEB"), false);
  assert.equal(affiliateLong("TwelveCharsX"), true);
  assert.equal(affiliateLong(stamp), false);
  assert.equal(affiliateLane("WEB"), "web");
  assert.equal(affiliateLane("Fair"), "fair");
  assert.equal(affiliateLane("Letter"), "plain");
  assert.equal(affiliateLane("20261120T0730Z"), "mark");
  assert.equal(affiliateLane("Europe"), "vowel");
  assert.equal(affiliateOpen(""), true);
  assert.equal(affiliateOpen({ affiliateC: "" }), true);
  assert.equal(affiliateState({ name: "Ada" }), "");
  assert.equal(affiliateState({ affiliateC: "Paris", balance: 1 }), "");
  assert.equal(affiliateHue("WEB"), "champagne");
  assert.equal(affiliateHue("Desk/West"), "graphite");
  assert.equal(affiliateHue("MAIL"), "champagne");
  assert.equal(affiliateSoon("ABCDEFG"), true);
  assert.equal(affiliateSoon("WEB"), false);
  assert.equal(affiliateSoon("Europe"), false);
  assert.equal(affiliateHue("Letter"), "ivory");
  assert.equal(affiliateLength("yes"), 3);
  assert.equal(affiliateEven("ab"), true);
  assert.equal(affiliateFirst("Paris"), true);
  assert.equal(affiliateSpace("needs review"), true);
  assert.equal(affiliateVowel("Amsterdam"), true);
  assert.equal(affiliateDigit("Room4"), true);
  assert.equal(affiliateCapital("PARIS"), true);
  assert.equal(affiliateLower("paris"), true);
  assert.equal(affiliateUpper("BERLIN"), true);
  assert.equal(affiliateUpper("PARIS"), false);
  assert.equal(affiliateUpper("WEB"), false);
  const marks: AffiliateRow[] = [
    { id: "1", label: "Ada", code: "WEB" },
    { id: "2", label: "Bea", code: "WEB" },
    { id: "3", label: "Cara", code: "Madrid" },
  ];
  assert.equal(leadingAffiliate(marks), "web");
  assert.match(affiliateLanesCsv(marks), /web,2/);
  assert.match(affiliateRowsCsv(marks, ["1"]), /Ada,WEB/);
  assert.equal(crmv4Text("tr", "tchTitle"), ROUND349_COPY.tr.tchTitle);
  assert.equal(crmv4Text("de", "afcTitle"), ROUND349_COPY.de.afcTitle);
  assert.equal(crmv4Text("ru", "ctPutealKicker"), ROUND349_COPY.ru.ctPutealKicker);
  assert.equal(crmv4Text("ar", "fpCrepidomaLead"), ROUND349_COPY.ar.fpCrepidomaLead);
  const keys = Object.keys(ROUND349_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND349_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-tachymeter/);
  assert.match(css, /\.c4-afcplate/);
  assert.match(css, /\.c4-tachymeter-column/);
  assert.match(css, /\.c4-afcplate-column/);
  assert.match(css, /\.c4-chip-puteal/);
  assert.match(css, /\.c4-preset-crepidoma/);
  assert.match(css, /\.c4-ct-puteal-mast/);
  assert.match(css, /\.c4-fp-crepidoma-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round349.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /affiliateC:/);
  assert.match(viewFile, /tachymeterCsv/);
  assert.match(viewFile, /affiliateRowsCsv/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "x"/);
  assert.match(viewFile, /event\.key === "a"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=24&meta=0/);
  assert.match(viewFile, /data-cards/);
  assert.match(viewFile, /data-plates/);
  assert.match(viewFile, /data-names/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestFinish/);
  assert.match(viewFile, /c4-afcplate-search/);
  assert.match(viewFile, /tachymeterTimeline/);
  assert.match(viewFile, /c4-tachymeter-notices/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "tch"/);
  assert.match(app, /view === "afc"/);
  const chips = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round91.tsx"), "utf8");
  const presets = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round94.tsx"), "utf8");
  const host = `${chips}\n${presets}`;
  assert.match(host, /c4-chip-puteal/);
  assert.match(host, /c4-ct-puteal-mast/);
  assert.match(host, /data-logo="mono"/);
  assert.match(host, /ctPutealKicker/);
  assert.match(host, /ctPutealLead/);
  assert.match(host, /data-contact-chips/);
  const puteal = chips.slice(chips.indexOf("export function ContactChips"), chips.indexOf("export function ZeroGlance"));
  assert.equal(puteal.includes("amount"), false);
  assert.equal(puteal.includes("balance"), false);
  assert.match(host, /c4-preset-crepidoma/);
  assert.match(host, /c4-fp-crepidoma-mast/);
  assert.match(host, /fpCrepidomaKicker/);
  assert.match(host, /fpCrepidomaLead/);
  assert.match(host, /data-filter-presets/);
  assert.equal(presets.includes("currency"), false);
  assert.equal(presets.includes("profit"), false);
  const namedKeys = `${viewFile}\n${host}`.match(/"(tch|afc|ctPuteal|fpCrepidoma)[A-Za-z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND349_COPY.en[key as keyof typeof ROUND349_COPY.en], "string", key);
  console.log("crmv4 round349 tests passed");
}

main();
