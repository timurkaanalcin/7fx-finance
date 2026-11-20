/**
 * Azurage grain rules, agent plates, the ivory staff propylaea, and the graphite method sekos.
 * Run: TZ=UTC npx tsx tests/crmv4-round359.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND359_COPY } from "../src/lib/crmv4/copy-round359";
import {
  ROUND359_FEATURES,
  activeFinish,
  activeMode,
  activeHour,
  activeHammer,
  addAzurage,
  briskAzurage,
  dropAzurageView,
  fairKeeper,
  agtHome,
  agtBrief,
  agtCapital,
  agtDigit,
  agtEven,
  agtFirst,
  agtRoute,
  agtHue,
  agtJoin,
  agtCitizen,
  agtLane,
  agtLanesCsv,
  agtLength,
  agtLower,
  agtGuest,
  agtAway,
  agtOpen,
  agtPlain,
  agtLong,
  agtRowsCsv,
  agtSoon,
  agtSpace,
  agtState,
  agtUpper,
  agtVowel,
  agtDesk,
  fullHammer,
  idleAzurage,
  lateAzurage,
  leadingSel,
  moveAzurageFocus,
  azurageBand,
  azurageHour,
  azurageGap,
  azurageInner,
  azurageMode,
  azurageOuter,
  azurageHammer,
  azurageFilm,
  azurageTimeline,
  overdueAzurage,
  pairHammer,
  quietFinish,
  readAzurageViews,
  reminderAzurages,
  restingAzurage,
  suggestFinish,
  suggestMode,
  suggestHour,
  type AgtRow,
  type Azurage,
} from "../src/lib/crmv4/round359";

function rule(partial: Partial<Azurage> & { id: string; title: string }): Azurage {
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
  assert.equal(ROUND359_FEATURES.length, 25);
  assert.equal(ROUND359_FEATURES.includes("agent-plate"), true);
  assert.equal(ROUND359_FEATURES.includes("azurage-pin-sla"), true);
  assert.equal(ROUND359_FEATURES.includes("fair-grainer"), true);
  assert.equal(ROUND359_FEATURES.includes("grain-archive"), true);
  assert.equal(ROUND359_FEATURES.includes("grain-reminders"), true);
  assert.equal(ROUND359_FEATURES.includes("azurage-search"), true);
  assert.equal(ROUND359_FEATURES.includes("grain-timeline"), true);
  assert.equal(azurageMode(" grain "), "grain");
  assert.equal(azurageMode("brass"), "");
  assert.equal(azurageHour("8"), 8);
  assert.equal(azurageHour(16), 16);
  assert.equal(azurageHour(32), 32);
  assert.equal(azurageHour(64), 64);
  assert.equal(azurageHour("6"), null);
  assert.equal(azurageHour("10"), null);
  assert.equal(azurageHammer("3"), 3);
  assert.equal(azurageHammer(6), 6);
  assert.equal(azurageHammer("12"), 12);
  assert.equal(azurageHammer("1"), null);
  assert.equal(azurageHammer("4"), null);
  assert.equal(azurageFilm("gilt"), "GILT");
  assert.equal(azurageFilm("ivory"), "IVORY");
  assert.equal(azurageFilm("graphite"), "GRAPHITE");
  assert.equal(azurageFilm("hot"), "");
  assert.equal(azurageInner("grain"), true);
  assert.equal(azurageInner("CLOUD"), true);
  assert.equal(azurageInner("sun"), false);
  assert.equal(azurageOuter("sun"), true);
  assert.equal(azurageOuter("frost"), true);
  assert.equal(azurageOuter("grain"), false);
  assert.equal(azurageBand("grain"), "circle");
  assert.equal(azurageBand("cloud"), "mist");
  assert.equal(azurageBand("sun"), "beam");
  assert.equal(azurageBand("frost"), "rime");
  assert.equal(azurageGap("grain", "frost"), 3);
  assert.equal(quietFinish("ivory"), true);
  assert.equal(quietFinish("gilt"), false);
  assert.equal(pairHammer(6), true);
  assert.equal(pairHammer(3), false);
  assert.equal(fullHammer(12), true);
  assert.equal(fullHammer(6), false);
  assert.equal(activeMode("inner"), "inner");
  assert.equal(activeHour("32"), "32");
  assert.equal(activeHour("7"), "all");
  assert.equal(activeHammer("12"), "12");
  assert.equal(activeHammer("5"), "all");
  assert.equal(activeFinish("gilt", ["GILT"]), "GILT");
  assert.equal(suggestMode(4), "grain");
  assert.equal(suggestMode(10), "frost");
  assert.equal(suggestHour([], 3), 8);
  assert.equal(suggestHour([], 8), 16);
  assert.equal(suggestHour([], 14), 32);
  assert.equal(suggestHour([], 20), 64);
  assert.equal(suggestFinish([]), "IVORY");
  assert.equal(moveAzurageFocus(0, 3, 1), 1);
  assert.equal(moveAzurageFocus(0, 3, -1), 2);
  const late = rule({ id: "a", title: "Ada", piece: "grain" });
  const due = rule({ id: "b", title: "Bea", piece: "sun", lock: 3 });
  const quiet = rule({ id: "c", title: "Cara", drop: 8, lock: 3 });
  const cell = rule({ id: "d", title: "Dora", film: "GILT", drop: 64, lock: 12 });
  const fax = rule({ id: "e", title: "Eve", piece: "frost", film: "IVORY", drop: 16 });
  assert.equal(lateAzurage(late, "frost"), true);
  assert.equal(lateAzurage(late, "grain"), false);
  assert.equal(overdueAzurage(due), true);
  assert.equal(idleAzurage(quiet), true);
  assert.equal(briskAzurage(cell), true);
  assert.equal(restingAzurage(fax), true);
  assert.deepEqual(reminderAzurages([due, late]), ["Bea"]);
  assert.equal(fairKeeper([rule({ id: "1", title: "One", setter: "Ada" }), rule({ id: "2", title: "Two", setter: "Bea" }), rule({ id: "3", title: "Three", setter: "Ada" })], "Ada,Bea"), "Bea");
  const cards = [rule({ id: "1", title: "North", drop: 32 }), rule({ id: "2", title: "East", drop: 16 })];
  assert.match(azurageTimeline(cards).map((mail) => mail.drop).join(","), /32/);
  const saved = addAzurage([], { title: "Ada", piece: "cloud", drop: "16", film: "gilt", lock: "6", tags: "g s x" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].piece, "cloud");
  assert.equal(saved[0].drop, 16);
  assert.equal(saved[0].lock, 6);
  assert.deepEqual(saved[0].tags, ["g", "s"]);
  assert.equal(addAzurage(saved, { title: "Ada" }).length, 1);
  assert.equal(addAzurage([], { title: "Eve" })[0].lock, 3);
  assert.equal(dropAzurageView([{ id: "v", name: "Morning", tray: "board", query: "", setter: "", film: "all", piece: "all", drop: "all", lock: "all" }], "v").length, 0);
  assert.equal(readAzurageViews([{ id: "v", name: "Morning", tray: "peg" }])[0].tray, "peg");

  const now = Date.parse("2026-11-20T12:00:00.000Z");
  assert.equal(agtHome("IN", now), true);
  assert.equal(agtHome("LIVE", now), true);
  assert.equal(agtHome("2026-11-20T01:00:00.000Z", now), true);
  assert.equal(agtAway("OFF", now), true);
  assert.equal(agtGuest("2026-10-25T12:00:00.000Z", now), true);
  assert.equal(agtCitizen("2025-01-01T00:00:00.000Z", now), true);
  assert.equal(agtDesk("2026-11-15T12:00:00.000Z", now), true);
  assert.equal(agtHome({ lastUserAgent: true }, now), true);
  assert.equal(agtHome({ lastUserAgent: "2026-11-20T08:00:00.000Z" }, now), true);
  assert.equal(agtPlain({ lastUserAgent: false }, now), false);
  assert.equal(agtAway({ lastUserAgent: false }, now), true);
  assert.equal(agtPlain({ lastUserAgent: "Coppery" }, now), true);
  assert.equal(agtHome({ lastUserAgent: "Coppery" }, now), false);
  assert.equal(agtBrief({ lastUserAgent: "MARKER" }, now), true);
  assert.equal(agtJoin("IN&OUT", now), true);
  assert.equal(agtJoin("ANNA NOAH", now), false);
  assert.equal(agtRoute("IN:OUT", now), true);
  assert.equal(agtRoute("SETHOLD", now), false);
  assert.equal(agtBrief("MARKER", now), true);
  assert.equal(agtBrief("IN", now), false);
  assert.equal(agtLong("TwentyCharacterLongX", now), true);
  assert.equal(agtLong("20261120T073000ZZ", now), false);
  assert.equal(agtLane("IN", now), "hall");
  assert.equal(agtLane("2026-11-15T12:00:00.000Z", now), "desk");
  assert.equal(agtLane("2026-10-25T12:00:00.000Z", now), "hold");
  assert.equal(agtLane("2025-01-01T00:00:00.000Z", now), "guest");
  assert.equal(agtLane("Coppery", now), "plain");
  assert.equal(agtLane("20261120T073000Z", now), "stamp");
  assert.equal(agtLane("Amsterdam", now), "vowel");
  assert.equal(agtLane("Googlebot/2.1", now), "vacant");
  assert.equal(agtLane("Mozilla/5.0 (Linux; Android 10; Mobile) Chrome/120.0", now), "hall");
  assert.equal(agtLane("Mozilla/5.0 (Windows NT 10.0) Chrome/120.0.0.0", now), "route");
  assert.equal(agtOpen(""), true);
  assert.equal(agtOpen({ lastUserAgent: "" }), true);
  assert.equal(agtState({ name: "Ada" }), "");
  assert.equal(agtState({ lastUserAgent: "Paris", balance: 1 }), "");
  assert.equal(agtHue("IN", now), "champagne");
  assert.equal(agtHue("IN&OUT", now), "graphite");
  assert.equal(agtHue("2026-10-25T12:00:00.000Z", now), "champagne");
  assert.equal(agtHue("2026-11-15T12:00:00.000Z", now), "graphite");
  assert.equal(agtSoon("MARKER", now), true);
  assert.equal(agtSoon("IN", now), false);
  assert.equal(agtSoon("EIGHTCHR", now), true);
  assert.equal(agtHue("Coppery", now), "ivory");
  assert.equal(agtLength("yes"), 3);
  assert.equal(agtEven("ab"), true);
  assert.equal(agtFirst("Paris"), true);
  assert.equal(agtSpace("needs review"), true);
  assert.equal(agtVowel("Amsterdam"), true);
  assert.equal(agtDigit("Room4"), true);
  assert.equal(agtCapital("PARIS"), true);
  assert.equal(agtLower("paris"), true);
  assert.equal(agtUpper("SEALEDXX"), true);
  assert.equal(agtUpper("HOT"), false);
  assert.equal(agtUpper("WARM"), false);
  const marks: AgtRow[] = [
    { id: "1", label: "Ada", code: "IN" },
    { id: "2", label: "Bea", code: "IN" },
    { id: "3", label: "Cara", code: "Paris" },
  ];
  assert.equal(leadingSel(marks), "hall");
  assert.match(agtLanesCsv(marks), /hall,2/);
  assert.match(agtRowsCsv(marks, ["1"]), /Ada,IN/);
  assert.equal(crmv4Text("tr", "azrTitle"), ROUND359_COPY.tr.azrTitle);
  assert.equal(crmv4Text("de", "agtTitle"), ROUND359_COPY.de.agtTitle);
  assert.equal(crmv4Text("ru", "spPropylaeaKicker"), ROUND359_COPY.ru.spPropylaeaKicker);
  assert.equal(crmv4Text("ar", "wgSekosLead"), ROUND359_COPY.ar.wgSekosLead);
  const keys = Object.keys(ROUND359_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND359_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-azurage/);
  assert.match(css, /\.c4-agtplate/);
  assert.match(css, /\.c4-azurage-column/);
  assert.match(css, /\.c4-agtplate-column/);
  assert.match(css, /\.c4-staff-propylaea/);
  assert.match(css, /\.c4-wd-sekos/);
  assert.match(css, /\.c4-sp-propylaea-mast/);
  assert.match(css, /\.c4-wg-sekos-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round359.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /lastUserAgent:/);
  assert.match(viewFile, /azurageCsv/);
  assert.match(viewFile, /agtRowsCsv/);
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
  assert.match(viewFile, /c4-agtplate-search/);
  assert.match(viewFile, /azurageTimeline/);
  assert.match(viewFile, /c4-azurage-notices/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "azr"/);
  assert.match(app, /view === "agt"/);
  const tags = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round113.tsx"), "utf8");
  assert.match(tags, /c4-staff-propylaea/);
  assert.match(tags, /c4-sp-propylaea-mast/);
  assert.match(tags, /data-logo="mono"/);
  assert.match(tags, /spPropylaeaKicker/);
  assert.match(tags, /spPropylaeaLead/);
  assert.match(tags, /data-staff-propylaea/);
  const gallery = tags.slice(tags.indexOf("export function StaffPolish"), tags.indexOf("export function WithdrawalMethods"));
  assert.equal(gallery.includes("amount"), false);
  assert.equal(gallery.includes("price"), false);
  assert.match(tags, /c4-wd-sekos/);
  assert.match(tags, /c4-wg-sekos-mast/);
  assert.match(tags, /wgSekosKicker/);
  assert.match(tags, /wgSekosLead/);
  assert.match(tags, /data-wd-sekos/);
  const porch = tags.slice(tags.indexOf("export function WithdrawalMethods"));
  assert.equal(porch.includes("amount"), false);
  assert.equal(porch.includes("profit"), false);
  assert.match(porch, /methodText/);
  const namedKeys = `${viewFile}\n${tags}`.match(/"(azr|agt|spPropylaea|wgSekos)[A-Za-z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND359_COPY.en[key as keyof typeof ROUND359_COPY.en], "string", key);
  console.log("crmv4 round359 tests passed");
}

main();
