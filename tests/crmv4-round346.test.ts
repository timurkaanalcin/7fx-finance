/**
 * Foudroyante rules, contact plates, the ivory snooze propylaeum, and the graphite deposit bouleuterion.
 * Run: TZ=UTC npx tsx tests/crmv4-round346.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND346_COPY } from "../src/lib/crmv4/copy-round346";
import {
  ROUND346_FEATURES,
  activeFinish,
  activeMode,
  activeHour,
  activeHammer,
  addFoudroyante,
  briskFoudroyante,
  dropFoudroyanteView,
  fairKeeper,
  contactHome,
  contactBrief,
  contactCapital,
  contactDigit,
  contactEven,
  contactFirst,
  contactGap,
  contactHue,
  contactJoin,
  contactCitizen,
  contactLane,
  contactLanesCsv,
  contactLength,
  contactLower,
  contactGuest,
  contactAway,
  contactOpen,
  contactPlain,
  contactLong,
  contactRowsCsv,
  contactSoon,
  contactSpace,
  contactState,
  contactUpper,
  contactVowel,
  fullHammer,
  idleFoudroyante,
  lateFoudroyante,
  leadingContact,
  moveFoudroyanteFocus,
  foudroyanteBand,
  foudroyanteHour,
  foudroyanteGap,
  foudroyanteInner,
  foudroyanteMode,
  foudroyanteOuter,
  foudroyanteHammer,
  foudroyanteFilm,
  foudroyanteTimeline,
  overdueFoudroyante,
  pairHammer,
  quietFinish,
  readFoudroyanteViews,
  reminderFoudroyantes,
  restingFoudroyante,
  suggestFinish,
  suggestMode,
  suggestHour,
  type ContactRow,
  type Foudroyante,
} from "../src/lib/crmv4/round346";

function rule(partial: Partial<Foudroyante> & { id: string; title: string }): Foudroyante {
  return {
    note: "",
    setter: "",
    piece: "",
    drop: null,
    film: "",
    lock: 2,
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
  assert.equal(ROUND346_FEATURES.length, 25);
  assert.equal(ROUND346_FEATURES.includes("contact-plate"), true);
  assert.equal(ROUND346_FEATURES.includes("pin-sla"), true);
  assert.equal(ROUND346_FEATURES.includes("fair-setter"), true);
  assert.equal(ROUND346_FEATURES.includes("whip-file"), true);
  assert.equal(ROUND346_FEATURES.includes("whip-notices"), true);
  assert.equal(ROUND346_FEATURES.includes("foudroyante-search"), true);
  assert.equal(ROUND346_FEATURES.includes("whip-timeline"), true);
  assert.equal(foudroyanteMode(" whip "), "whip");
  assert.equal(foudroyanteMode("brass"), "");
  assert.equal(foudroyanteHour("2"), 2);
  assert.equal(foudroyanteHour(6), 6);
  assert.equal(foudroyanteHour(10), 10);
  assert.equal(foudroyanteHour(14), 14);
  assert.equal(foudroyanteHour("4"), null);
  assert.equal(foudroyanteHour("8"), null);
  assert.equal(foudroyanteHammer("1"), 1);
  assert.equal(foudroyanteHammer(4), 4);
  assert.equal(foudroyanteHammer("8"), 8);
  assert.equal(foudroyanteHammer("2"), null);
  assert.equal(foudroyanteHammer("3"), null);
  assert.equal(foudroyanteFilm("gilt"), "GILT");
  assert.equal(foudroyanteFilm("ivory"), "IVORY");
  assert.equal(foudroyanteFilm("graphite"), "GRAPHITE");
  assert.equal(foudroyanteFilm("hot"), "");
  assert.equal(foudroyanteInner("whip"), true);
  assert.equal(foudroyanteInner("ARBOR"), true);
  assert.equal(foudroyanteInner("pinion"), false);
  assert.equal(foudroyanteOuter("pinion"), true);
  assert.equal(foudroyanteOuter("bridge"), true);
  assert.equal(foudroyanteOuter("whip"), false);
  assert.equal(foudroyanteBand("whip"), "lash");
  assert.equal(foudroyanteBand("arbor"), "shaft");
  assert.equal(foudroyanteBand("pinion"), "leaf");
  assert.equal(foudroyanteBand("bridge"), "span");
  assert.equal(foudroyanteGap("whip", "bridge"), 3);
  assert.equal(quietFinish("ivory"), true);
  assert.equal(quietFinish("gilt"), false);
  assert.equal(pairHammer(4), true);
  assert.equal(pairHammer(1), false);
  assert.equal(fullHammer(8), true);
  assert.equal(fullHammer(4), false);
  assert.equal(activeMode("inner"), "inner");
  assert.equal(activeHour("10"), "10");
  assert.equal(activeHour("4"), "all");
  assert.equal(activeHammer("8"), "8");
  assert.equal(activeHammer("2"), "all");
  assert.equal(activeFinish("gilt", ["GILT"]), "GILT");
  assert.equal(suggestMode(6), "whip");
  assert.equal(suggestMode(14), "bridge");
  assert.equal(suggestHour([], 4), 2);
  assert.equal(suggestHour([], 8), 6);
  assert.equal(suggestHour([], 14), 10);
  assert.equal(suggestHour([], 20), 14);
  assert.equal(suggestFinish([]), "IVORY");
  assert.equal(moveFoudroyanteFocus(0, 3, 1), 1);
  assert.equal(moveFoudroyanteFocus(0, 3, -1), 2);
  const late = rule({ id: "a", title: "Ada", piece: "whip" });
  const due = rule({ id: "b", title: "Bea", piece: "pinion", lock: 1 });
  const quiet = rule({ id: "c", title: "Cara", drop: 2, lock: 1 });
  const cell = rule({ id: "d", title: "Dora", film: "GILT", drop: 14, lock: 8 });
  const fax = rule({ id: "e", title: "Eve", piece: "bridge", film: "IVORY", drop: 6 });
  assert.equal(lateFoudroyante(late, "bridge"), true);
  assert.equal(lateFoudroyante(late, "whip"), false);
  assert.equal(overdueFoudroyante(due), true);
  assert.equal(idleFoudroyante(quiet), true);
  assert.equal(briskFoudroyante(cell), true);
  assert.equal(restingFoudroyante(fax), true);
  assert.deepEqual(reminderFoudroyantes([due, late]), ["Bea"]);
  assert.equal(fairKeeper([rule({ id: "1", title: "One", setter: "Ada" }), rule({ id: "2", title: "Two", setter: "Bea" }), rule({ id: "3", title: "Three", setter: "Ada" })], "Ada,Bea"), "Bea");
  const cards = [rule({ id: "1", title: "North", drop: 10 }), rule({ id: "2", title: "East", drop: 6 })];
  assert.match(foudroyanteTimeline(cards).map((mail) => mail.drop).join(","), /10/);
  const saved = addFoudroyante([], { title: "Ada", piece: "arbor", drop: "6", film: "gilt", lock: "4", tags: "f d x" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].piece, "arbor");
  assert.equal(saved[0].drop, 6);
  assert.equal(saved[0].lock, 4);
  assert.deepEqual(saved[0].tags, ["f", "d"]);
  assert.equal(addFoudroyante(saved, { title: "Ada" }).length, 1);
  assert.equal(addFoudroyante([], { title: "Eve" })[0].lock, 1);
  assert.equal(dropFoudroyanteView([{ id: "v", name: "Morning", tray: "board", query: "", setter: "", film: "all", piece: "all", drop: "all", lock: "all" }], "v").length, 0);
  assert.equal(readFoudroyanteViews([{ id: "v", name: "Morning", tray: "peg" }])[0].tray, "peg");

  const stamp = "2026-11-20T07:30:00.000Z";
  assert.equal(contactHome("call"), true);
  assert.equal(contactHome("CALL"), true);
  assert.equal(contactAway("MAIL"), true);
  assert.equal(contactGuest("MEET"), true);
  assert.equal(contactCitizen("NOTE"), true);
  assert.equal(contactHome({ lastContactAt: true }), true);
  assert.equal(contactPlain({ lastContactAt: false }), true);
  assert.equal(contactAway({ lastContactAt: false }), false);
  assert.equal(contactPlain({ lastContactAt: "Letter" }), true);
  assert.equal(contactHome({ lastContactAt: "Letter" }), false);
  assert.equal(contactBrief({ lastContactAt: "2026-11-20" }), true);
  assert.equal(contactJoin("CALL+MAIL"), true);
  assert.equal(contactJoin("ANNA NOAH"), false);
  assert.equal(contactGap("U|S"), true);
  assert.equal(contactGap("LIVEHOLD"), false);
  assert.equal(contactBrief("2026-11-20"), true);
  assert.equal(contactBrief("CALL"), false);
  assert.equal(contactLong("Abcdefghijklmnopqrstuvwx"), true);
  assert.equal(contactLong(stamp), false);
  assert.equal(contactLane("CALL"), "call");
  assert.equal(contactLane("Note"), "note");
  assert.equal(contactLane("Letter"), "plain");
  assert.equal(contactLane(stamp), "mark");
  assert.equal(contactLane("Amsterdam"), "vowel");
  assert.equal(contactOpen(""), true);
  assert.equal(contactOpen({ lastContactAt: "" }), true);
  assert.equal(contactState({ name: "Ada" }), "");
  assert.equal(contactState({ lastContactAt: "Paris", balance: 1 }), "");
  assert.equal(contactHue("CALL"), "champagne");
  assert.equal(contactHue("CALL+MAIL"), "graphite");
  assert.equal(contactHue("MEET"), "champagne");
  assert.equal(contactSoon("2026-11-20"), true);
  assert.equal(contactSoon("CALL"), false);
  assert.equal(contactSoon("ABCDABCD"), true);
  assert.equal(contactSoon("Amsterdam"), false);
  assert.equal(contactHue("Letter"), "ivory");
  assert.equal(contactLength("yes"), 3);
  assert.equal(contactEven("ab"), true);
  assert.equal(contactFirst("Paris"), true);
  assert.equal(contactSpace("needs review"), true);
  assert.equal(contactVowel("Amsterdam"), true);
  assert.equal(contactDigit("Room4"), true);
  assert.equal(contactCapital("PARIS"), true);
  assert.equal(contactLower("paris"), true);
  assert.equal(contactUpper("LEONARD"), true);
  assert.equal(contactUpper("MAIL"), true);
  assert.equal(contactUpper("CALL"), true);
  assert.equal(contactUpper("NG"), false);
  const marks: ContactRow[] = [
    { id: "1", label: "Ada", code: "CALL" },
    { id: "2", label: "Bea", code: "CALL" },
    { id: "3", label: "Cara", code: "Madrid" },
  ];
  assert.equal(leadingContact(marks), "call");
  assert.match(contactLanesCsv(marks), /call,2/);
  assert.match(contactRowsCsv(marks, ["1"]), /Ada,CALL/);
  assert.equal(crmv4Text("tr", "fdxTitle"), ROUND346_COPY.tr.fdxTitle);
  assert.equal(crmv4Text("de", "ctxTitle"), ROUND346_COPY.de.ctxTitle);
  assert.equal(crmv4Text("ru", "nqPropylaeumKicker"), ROUND346_COPY.ru.nqPropylaeumKicker);
  assert.equal(crmv4Text("ar", "mgBouleuterionLead"), ROUND346_COPY.ar.mgBouleuterionLead);
  const keys = Object.keys(ROUND346_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND346_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-foudroyante/);
  assert.match(css, /\.c4-ctxplate/);
  assert.match(css, /\.c4-foudroyante-column/);
  assert.match(css, /\.c4-ctxplate-column/);
  assert.match(css, /\.c4-snooze-propylaeum/);
  assert.match(css, /\.c4-dep-bouleuterion/);
  assert.match(css, /\.c4-nq-propylaeum-mast/);
  assert.match(css, /\.c4-mg-bouleuterion-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round346.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /lastContactAt:/);
  assert.match(viewFile, /foudroyanteCsv/);
  assert.match(viewFile, /contactRowsCsv/);
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
  assert.match(viewFile, /c4-ctxplate-search/);
  assert.match(viewFile, /foudroyanteTimeline/);
  assert.match(viewFile, /c4-foudroyante-notices/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "fdx"/);
  assert.match(app, /view === "ctx"/);
  const host = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round104.tsx"), "utf8");
  assert.match(host, /c4-snooze-propylaeum/);
  assert.match(host, /c4-nq-propylaeum-mast/);
  assert.match(host, /data-logo="mono"/);
  assert.match(host, /nqPropylaeumKicker/);
  assert.match(host, /nqPropylaeumLead/);
  assert.match(host, /data-snooze-list/);
  assert.equal(host.includes("amount"), false);
  assert.match(host, /c4-dep-bouleuterion/);
  assert.match(host, /c4-mg-bouleuterion-mast/);
  assert.match(host, /mgBouleuterionKicker/);
  assert.match(host, /mgBouleuterionLead/);
  assert.match(host, /data-dep-method/);
  assert.equal(host.includes("currency"), false);
  assert.equal(host.includes("profit"), false);
  const namedKeys = `${viewFile}\n${host}`.match(/"(fdx|ctx|nqPropylaeum|mgBouleuterion)[A-Za-z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND346_COPY.en[key as keyof typeof ROUND346_COPY.en], "string", key);
  console.log("crmv4 round346 tests passed");
}

main();
