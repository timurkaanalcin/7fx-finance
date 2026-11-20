/**
 * Regulator rules, country plates, the ivory reminder hestiatorion, and the graphite follow parodos.
 * Run: TZ=UTC npx tsx tests/crmv4-round352.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND352_COPY } from "../src/lib/crmv4/copy-round352";
import {
  ROUND352_FEATURES,
  activeFinish,
  activeMode,
  activeHour,
  activeHammer,
  addRegulator,
  briskRegulator,
  dropRegulatorView,
  fairKeeper,
  lcoHome,
  lcoBrief,
  lcoCapital,
  lcoDigit,
  lcoEven,
  lcoFirst,
  lcoRoute,
  lcoHue,
  lcoJoin,
  lcoCitizen,
  lcoLane,
  lcoLanesCsv,
  lcoLength,
  lcoLower,
  lcoGuest,
  lcoAway,
  lcoOpen,
  lcoPlain,
  lcoLong,
  lcoRowsCsv,
  lcoSoon,
  lcoSpace,
  lcoState,
  lcoUpper,
  lcoVowel,
  lcoDesk,
  fullHammer,
  idleRegulator,
  lateRegulator,
  leadingLco,
  moveRegulatorFocus,
  regulatorBand,
  regulatorHour,
  regulatorGap,
  regulatorInner,
  regulatorMode,
  regulatorOuter,
  regulatorHammer,
  regulatorFilm,
  regulatorTimeline,
  overdueRegulator,
  pairHammer,
  quietFinish,
  readRegulatorViews,
  reminderRegulators,
  restingRegulator,
  suggestFinish,
  suggestMode,
  suggestHour,
  type LcoRow,
  type Regulator,
} from "../src/lib/crmv4/round352";

function rule(partial: Partial<Regulator> & { id: string; title: string }): Regulator {
  return {
    note: "",
    setter: "",
    piece: "",
    drop: null,
    film: "",
    lock: 1,
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
  assert.equal(ROUND352_FEATURES.length, 25);
  assert.equal(ROUND352_FEATURES.includes("country-plate"), true);
  assert.equal(ROUND352_FEATURES.includes("regulator-pin-sla"), true);
  assert.equal(ROUND352_FEATURES.includes("calm-keeper"), true);
  assert.equal(ROUND352_FEATURES.includes("dial-archive"), true);
  assert.equal(ROUND352_FEATURES.includes("dial-reminders"), true);
  assert.equal(ROUND352_FEATURES.includes("regulator-search"), true);
  assert.equal(ROUND352_FEATURES.includes("dial-timeline"), true);
  assert.equal(regulatorMode(" pinion "), "pinion");
  assert.equal(regulatorMode("brass"), "");
  assert.equal(regulatorHour("6"), 6);
  assert.equal(regulatorHour(12), 12);
  assert.equal(regulatorHour(24), 24);
  assert.equal(regulatorHour(48), 48);
  assert.equal(regulatorHour("5"), null);
  assert.equal(regulatorHour("8"), null);
  assert.equal(regulatorHammer("1"), 1);
  assert.equal(regulatorHammer(3), 3);
  assert.equal(regulatorHammer("6"), 6);
  assert.equal(regulatorHammer("2"), null);
  assert.equal(regulatorHammer("4"), null);
  assert.equal(regulatorFilm("gilt"), "GILT");
  assert.equal(regulatorFilm("ivory"), "IVORY");
  assert.equal(regulatorFilm("graphite"), "GRAPHITE");
  assert.equal(regulatorFilm("hot"), "");
  assert.equal(regulatorInner("pinion"), true);
  assert.equal(regulatorInner("ARBOR"), true);
  assert.equal(regulatorInner("sweep"), false);
  assert.equal(regulatorOuter("sweep"), true);
  assert.equal(regulatorOuter("window"), true);
  assert.equal(regulatorOuter("pinion"), false);
  assert.equal(regulatorBand("pinion"), "hand");
  assert.equal(regulatorBand("arbor"), "arc");
  assert.equal(regulatorBand("sweep"), "fly");
  assert.equal(regulatorBand("window"), "date");
  assert.equal(regulatorGap("pinion", "window"), 3);
  assert.equal(quietFinish("ivory"), true);
  assert.equal(quietFinish("gilt"), false);
  assert.equal(pairHammer(3), true);
  assert.equal(pairHammer(1), false);
  assert.equal(fullHammer(6), true);
  assert.equal(fullHammer(3), false);
  assert.equal(activeMode("inner"), "inner");
  assert.equal(activeHour("24"), "24");
  assert.equal(activeHour("7"), "all");
  assert.equal(activeHammer("6"), "6");
  assert.equal(activeHammer("2"), "all");
  assert.equal(activeFinish("gilt", ["GILT"]), "GILT");
  assert.equal(suggestMode(4), "pinion");
  assert.equal(suggestMode(10), "window");
  assert.equal(suggestHour([], 3), 6);
  assert.equal(suggestHour([], 8), 12);
  assert.equal(suggestHour([], 14), 24);
  assert.equal(suggestHour([], 20), 48);
  assert.equal(suggestFinish([]), "IVORY");
  assert.equal(moveRegulatorFocus(0, 3, 1), 1);
  assert.equal(moveRegulatorFocus(0, 3, -1), 2);
  const late = rule({ id: "a", title: "Ada", piece: "pinion" });
  const due = rule({ id: "b", title: "Bea", piece: "sweep", lock: 1 });
  const quiet = rule({ id: "c", title: "Cara", drop: 6, lock: 1 });
  const cell = rule({ id: "d", title: "Dora", film: "GILT", drop: 48, lock: 6 });
  const fax = rule({ id: "e", title: "Eve", piece: "window", film: "IVORY", drop: 12 });
  assert.equal(lateRegulator(late, "window"), true);
  assert.equal(lateRegulator(late, "pinion"), false);
  assert.equal(overdueRegulator(due), true);
  assert.equal(idleRegulator(quiet), true);
  assert.equal(briskRegulator(cell), true);
  assert.equal(restingRegulator(fax), true);
  assert.deepEqual(reminderRegulators([due, late]), ["Bea"]);
  assert.equal(fairKeeper([rule({ id: "1", title: "One", setter: "Ada" }), rule({ id: "2", title: "Two", setter: "Bea" }), rule({ id: "3", title: "Three", setter: "Ada" })], "Ada,Bea"), "Bea");
  const cards = [rule({ id: "1", title: "North", drop: 24 }), rule({ id: "2", title: "East", drop: 12 })];
  assert.match(regulatorTimeline(cards).map((mail) => mail.drop).join(","), /24/);
  const saved = addRegulator([], { title: "Ada", piece: "arbor", drop: "12", film: "gilt", lock: "3", tags: "h s x" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].piece, "arbor");
  assert.equal(saved[0].drop, 12);
  assert.equal(saved[0].lock, 3);
  assert.deepEqual(saved[0].tags, ["h", "s"]);
  assert.equal(addRegulator(saved, { title: "Ada" }).length, 1);
  assert.equal(addRegulator([], { title: "Eve" })[0].lock, 1);
  assert.equal(dropRegulatorView([{ id: "v", name: "Morning", tray: "board", query: "", setter: "", film: "all", piece: "all", drop: "all", lock: "all" }], "v").length, 0);
  assert.equal(readRegulatorViews([{ id: "v", name: "Morning", tray: "peg" }])[0].tray, "peg");

  assert.equal(lcoHome("TR"), true);
  assert.equal(lcoHome("TUR"), true);
  assert.equal(lcoHome("COUNTRY_TR"), true);
  assert.equal(lcoAway("OPEN"), true);
  assert.equal(lcoGuest("RU"), true);
  assert.equal(lcoGuest("RUS"), true);
  assert.equal(lcoCitizen("AE"), true);
  assert.equal(lcoCitizen("UAE"), true);
  assert.equal(lcoDesk("DE"), true);
  assert.equal(lcoDesk("GER"), true);
  assert.equal(lcoHome({ lastCountry: true }), true);
  assert.equal(lcoPlain({ lastCountry: false }), false);
  assert.equal(lcoAway({ lastCountry: false }), true);
  assert.equal(lcoPlain({ lastCountry: "Letter" }), true);
  assert.equal(lcoHome({ lastCountry: "Letter" }), false);
  assert.equal(lcoBrief({ lastCountry: "USA" }), true);
  assert.equal(lcoJoin("TR+DE"), true);
  assert.equal(lcoJoin("ANNA NOAH"), false);
  assert.equal(lcoRoute("TR/DE"), true);
  assert.equal(lcoRoute("LIVEHOLD"), false);
  assert.equal(lcoBrief("ABC"), true);
  assert.equal(lcoBrief("TR"), false);
  assert.equal(lcoLong("FourteenChars"), true);
  assert.equal(lcoLong("20261120T0730Z"), false);
  assert.equal(lcoLane("TR"), "home");
  assert.equal(lcoLane("TUR"), "home");
  assert.equal(lcoLane("DE"), "desk");
  assert.equal(lcoLane("RU"), "hold");
  assert.equal(lcoLane("AE"), "guest");
  assert.equal(lcoLane("Letter"), "plain");
  assert.equal(lcoLane("20261120T0730Z"), "stamp");
  assert.equal(lcoLane("Amsterdam"), "vowel");
  assert.equal(lcoOpen(""), true);
  assert.equal(lcoOpen({ lastCountry: "" }), true);
  assert.equal(lcoState({ name: "Ada" }), "");
  assert.equal(lcoState({ lastCountry: "Paris", balance: 1 }), "");
  assert.equal(lcoHue("TR"), "champagne");
  assert.equal(lcoHue("TR+DE"), "graphite");
  assert.equal(lcoHue("RU"), "champagne");
  assert.equal(lcoHue("DE"), "graphite");
  assert.equal(lcoSoon("ABCD"), true);
  assert.equal(lcoSoon("TR"), false);
  assert.equal(lcoSoon("ROME"), true);
  assert.equal(lcoHue("Letter"), "ivory");
  assert.equal(lcoLength("yes"), 3);
  assert.equal(lcoEven("ab"), true);
  assert.equal(lcoFirst("Paris"), true);
  assert.equal(lcoSpace("needs review"), true);
  assert.equal(lcoVowel("Amsterdam"), true);
  assert.equal(lcoDigit("Room4"), true);
  assert.equal(lcoCapital("PARIS"), true);
  assert.equal(lcoLower("paris"), true);
  assert.equal(lcoUpper("AMSTERDAM"), true);
  assert.equal(lcoUpper("TR"), false);
  assert.equal(lcoUpper("TURKEY"), true);
  const marks: LcoRow[] = [
    { id: "1", label: "Ada", code: "TR" },
    { id: "2", label: "Bea", code: "TR" },
    { id: "3", label: "Cara", code: "Madrid" },
  ];
  assert.equal(leadingLco(marks), "home");
  assert.match(lcoLanesCsv(marks), /home,2/);
  assert.match(lcoRowsCsv(marks, ["1"]), /Ada,TR/);
  assert.equal(crmv4Text("tr", "rgrTitle"), ROUND352_COPY.tr.rgrTitle);
  assert.equal(crmv4Text("de", "lcoTitle"), ROUND352_COPY.de.lcoTitle);
  assert.equal(crmv4Text("ru", "rmHestiatorionKicker"), ROUND352_COPY.ru.rmHestiatorionKicker);
  assert.equal(crmv4Text("ar", "ffParodosLead"), ROUND352_COPY.ar.ffParodosLead);
  const keys = Object.keys(ROUND352_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND352_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-regulator/);
  assert.match(css, /\.c4-lcoplate/);
  assert.match(css, /\.c4-regulator-column/);
  assert.match(css, /\.c4-lcoplate-column/);
  assert.match(css, /\.c4-reminder-hestiatorion/);
  assert.match(css, /\.c4-follow-parodos/);
  assert.match(css, /\.c4-rm-hestiatorion-mast/);
  assert.match(css, /\.c4-ff-parodos-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round352.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /lastCountry:/);
  assert.match(viewFile, /regulatorCsv/);
  assert.match(viewFile, /lcoRowsCsv/);
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
  assert.match(viewFile, /c4-lcoplate-search/);
  assert.match(viewFile, /regulatorTimeline/);
  assert.match(viewFile, /c4-regulator-notices/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "rgr"/);
  assert.match(app, /view === "lco"/);
  const reminders = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round92.tsx"), "utf8");
  const follows = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round108.tsx"), "utf8");
  const host = `${reminders}\n${follows}`;
  assert.match(host, /c4-reminder-hestiatorion/);
  assert.match(host, /c4-rm-hestiatorion-mast/);
  assert.match(host, /data-logo="mono"/);
  assert.match(host, /rmHestiatorionKicker/);
  assert.match(host, /rmHestiatorionLead/);
  assert.match(host, /data-reminder-chips/);
  const hall = reminders.slice(reminders.indexOf("export function ReminderChips"), reminders.indexOf("export function SourceGlance"));
  assert.equal(hall.includes("amount"), false);
  assert.equal(hall.includes("balance"), false);
  assert.match(host, /c4-follow-parodos/);
  assert.match(host, /c4-ff-parodos-mast/);
  assert.match(host, /ffParodosKicker/);
  assert.match(host, /ffParodosLead/);
  assert.match(host, /data-follow-queue/);
  const passage = follows.slice(follows.indexOf("export function FollowQueue"), follows.indexOf("export function TicketStatus"));
  assert.equal(passage.includes("currency"), false);
  assert.equal(passage.includes("profit"), false);
  const namedKeys = `${viewFile}\n${host}`.match(/"(rgr|lco|rmHestiatorion|ffParodos)[A-Za-z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND352_COPY.en[key as keyof typeof ROUND352_COPY.en], "string", key);
  console.log("crmv4 round352 tests passed");
}

main();
