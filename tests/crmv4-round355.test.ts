/**
 * Guilloche rules, birth plates, the ivory density exedra, and the graphite country tholos.
 * Run: TZ=UTC npx tsx tests/crmv4-round355.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND355_COPY } from "../src/lib/crmv4/copy-round355";
import {
  ROUND355_FEATURES,
  activeFinish,
  activeMode,
  activeHour,
  activeHammer,
  addGuilloche,
  briskGuilloche,
  dropGuillocheView,
  fairKeeper,
  expHome,
  expBrief,
  expCapital,
  expDigit,
  expEven,
  expFirst,
  expRoute,
  expHue,
  expJoin,
  expCitizen,
  expLane,
  expLanesCsv,
  expLength,
  expLower,
  expGuest,
  expAway,
  expOpen,
  expPlain,
  expLong,
  expRowsCsv,
  expSoon,
  expSpace,
  expState,
  expUpper,
  expVowel,
  expDesk,
  fullHammer,
  idleGuilloche,
  lateGuilloche,
  leadingExp,
  moveGuillocheFocus,
  guillocheBand,
  guillocheHour,
  guillocheGap,
  guillocheInner,
  guillocheMode,
  guillocheOuter,
  guillocheHammer,
  guillocheFilm,
  guillocheTimeline,
  overdueGuilloche,
  pairHammer,
  quietFinish,
  readGuillocheViews,
  reminderGuilloches,
  restingGuilloche,
  suggestFinish,
  suggestMode,
  suggestHour,
  type ExpRow,
  type Guilloche,
} from "../src/lib/crmv4/round355";

function rule(partial: Partial<Guilloche> & { id: string; title: string }): Guilloche {
  return {
    note: "",
    setter: "",
    piece: "",
    drop: null,
    film: "",
    lock: 3,
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
  assert.equal(ROUND355_FEATURES.length, 25);
  assert.equal(ROUND355_FEATURES.includes("expiry-plate"), true);
  assert.equal(ROUND355_FEATURES.includes("guilloche-pin-sla"), true);
  assert.equal(ROUND355_FEATURES.includes("fair-turner"), true);
  assert.equal(ROUND355_FEATURES.includes("barley-archive"), true);
  assert.equal(ROUND355_FEATURES.includes("barley-reminders"), true);
  assert.equal(ROUND355_FEATURES.includes("guilloche-search"), true);
  assert.equal(ROUND355_FEATURES.includes("barley-timeline"), true);
  assert.equal(guillocheMode(" barley "), "barley");
  assert.equal(guillocheMode("brass"), "");
  assert.equal(guillocheHour("4"), 4);
  assert.equal(guillocheHour(8), 8);
  assert.equal(guillocheHour(16), 16);
  assert.equal(guillocheHour(32), 32);
  assert.equal(guillocheHour("6"), null);
  assert.equal(guillocheHour("12"), null);
  assert.equal(guillocheHammer("2"), 2);
  assert.equal(guillocheHammer(4), 4);
  assert.equal(guillocheHammer("8"), 8);
  assert.equal(guillocheHammer("1"), null);
  assert.equal(guillocheHammer("3"), null);
  assert.equal(guillocheFilm("gilt"), "GILT");
  assert.equal(guillocheFilm("ivory"), "IVORY");
  assert.equal(guillocheFilm("graphite"), "GRAPHITE");
  assert.equal(guillocheFilm("hot"), "");
  assert.equal(guillocheInner("barley"), true);
  assert.equal(guillocheInner("BASKET"), true);
  assert.equal(guillocheInner("hobnail"), false);
  assert.equal(guillocheOuter("hobnail"), true);
  assert.equal(guillocheOuter("rose"), true);
  assert.equal(guillocheOuter("barley"), false);
  assert.equal(guillocheBand("barley"), "grain");
  assert.equal(guillocheBand("basket"), "weave");
  assert.equal(guillocheBand("hobnail"), "nail");
  assert.equal(guillocheBand("rose"), "bloom");
  assert.equal(guillocheGap("barley", "rose"), 3);
  assert.equal(quietFinish("ivory"), true);
  assert.equal(quietFinish("gilt"), false);
  assert.equal(pairHammer(4), true);
  assert.equal(pairHammer(2), false);
  assert.equal(fullHammer(8), true);
  assert.equal(fullHammer(4), false);
  assert.equal(activeMode("inner"), "inner");
  assert.equal(activeHour("16"), "16");
  assert.equal(activeHour("7"), "all");
  assert.equal(activeHammer("8"), "8");
  assert.equal(activeHammer("3"), "all");
  assert.equal(activeFinish("gilt", ["GILT"]), "GILT");
  assert.equal(suggestMode(4), "barley");
  assert.equal(suggestMode(10), "rose");
  assert.equal(suggestHour([], 3), 4);
  assert.equal(suggestHour([], 8), 8);
  assert.equal(suggestHour([], 14), 16);
  assert.equal(suggestHour([], 20), 32);
  assert.equal(suggestFinish([]), "IVORY");
  assert.equal(moveGuillocheFocus(0, 3, 1), 1);
  assert.equal(moveGuillocheFocus(0, 3, -1), 2);
  const late = rule({ id: "a", title: "Ada", piece: "barley" });
  const due = rule({ id: "b", title: "Bea", piece: "hobnail", lock: 2 });
  const quiet = rule({ id: "c", title: "Cara", drop: 4, lock: 2 });
  const cell = rule({ id: "d", title: "Dora", film: "GILT", drop: 32, lock: 8 });
  const fax = rule({ id: "e", title: "Eve", piece: "rose", film: "IVORY", drop: 8 });
  assert.equal(lateGuilloche(late, "rose"), true);
  assert.equal(lateGuilloche(late, "barley"), false);
  assert.equal(overdueGuilloche(due), true);
  assert.equal(idleGuilloche(quiet), true);
  assert.equal(briskGuilloche(cell), true);
  assert.equal(restingGuilloche(fax), true);
  assert.deepEqual(reminderGuilloches([due, late]), ["Bea"]);
  assert.equal(fairKeeper([rule({ id: "1", title: "One", setter: "Ada" }), rule({ id: "2", title: "Two", setter: "Bea" }), rule({ id: "3", title: "Three", setter: "Ada" })], "Ada,Bea"), "Bea");
  const cards = [rule({ id: "1", title: "North", drop: 16 }), rule({ id: "2", title: "East", drop: 8 })];
  assert.match(guillocheTimeline(cards).map((mail) => mail.drop).join(","), /16/);
  const saved = addGuilloche([], { title: "Ada", piece: "basket", drop: "8", film: "gilt", lock: "4", tags: "g u x" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].piece, "basket");
  assert.equal(saved[0].drop, 8);
  assert.equal(saved[0].lock, 4);
  assert.deepEqual(saved[0].tags, ["g", "u"]);
  assert.equal(addGuilloche(saved, { title: "Ada" }).length, 1);
  assert.equal(addGuilloche([], { title: "Eve" })[0].lock, 2);
  assert.equal(dropGuillocheView([{ id: "v", name: "Morning", tray: "board", query: "", setter: "", film: "all", piece: "all", drop: "all", lock: "all" }], "v").length, 0);
  assert.equal(readGuillocheViews([{ id: "v", name: "Morning", tray: "peg" }])[0].tray, "peg");

  assert.equal(expHome("LIVE"), true);
  assert.equal(expHome("ACTIVE"), true);
  assert.equal(expHome("NO_EXPIRY"), true);
  assert.equal(expAway("OPEN"), true);
  assert.equal(expGuest("LOCK"), true);
  assert.equal(expGuest("FROZEN"), true);
  assert.equal(expCitizen("GONE"), true);
  assert.equal(expCitizen("LAPSED"), true);
  assert.equal(expDesk("SOON"), true);
  assert.equal(expDesk("DUE"), true);
  assert.equal(expHome({ birthDate: true }), true);
  assert.equal(expPlain({ birthDate: false }), false);
  assert.equal(expAway({ birthDate: false }), true);
  assert.equal(expPlain({ birthDate: "Letter" }), true);
  assert.equal(expHome({ birthDate: "Letter" }), false);
  assert.equal(expBrief({ birthDate: "YEAR" }), true);
  assert.equal(expJoin("LIVE&SOON"), true);
  assert.equal(expJoin("ANNA NOAH"), false);
  assert.equal(expRoute("LIVE#SOON"), true);
  assert.equal(expRoute("LIVEHOLD"), false);
  assert.equal(expBrief("YEAR"), true);
  assert.equal(expBrief("LIVE"), false);
  assert.equal(expLong("SixteenCharsLong"), true);
  assert.equal(expLong("20261120T073000Z"), false);
  assert.equal(expLane("ACTIVE"), "home");
  assert.equal(expLane("SOON"), "desk");
  assert.equal(expLane("LOCK"), "hold");
  assert.equal(expLane("GONE"), "guest");
  assert.equal(expLane("Letter"), "plain");
  assert.equal(expLane("20261120T073000Z"), "stamp");
  assert.equal(expLane("Amsterdam"), "vowel");
  assert.equal(expOpen(""), true);
  assert.equal(expOpen({ birthDate: "" }), true);
  assert.equal(expState({ name: "Ada" }), "");
  assert.equal(expState({ birthDate: "Paris", balance: 1 }), "");
  assert.equal(expHue("LIVE"), "champagne");
  assert.equal(expHue("LIVE&SOON"), "graphite");
  assert.equal(expHue("LOCK"), "champagne");
  assert.equal(expHue("SOON"), "graphite");
  assert.equal(expSoon("YEAR"), true);
  assert.equal(expSoon("LIVE"), false);
  assert.equal(expSoon("ROOMSXXX"), true);
  assert.equal(expHue("Letter"), "ivory");
  assert.equal(expLength("yes"), 3);
  assert.equal(expEven("ab"), true);
  assert.equal(expFirst("Paris"), true);
  assert.equal(expSpace("needs review"), true);
  assert.equal(expVowel("Amsterdam"), true);
  assert.equal(expDigit("Room4"), true);
  assert.equal(expCapital("PARIS"), true);
  assert.equal(expLower("paris"), true);
  assert.equal(expUpper("ACTIVE"), true);
  assert.equal(expUpper("LIVE"), false);
  assert.equal(expUpper("SOON"), false);
  const marks: ExpRow[] = [
    { id: "1", label: "Ada", code: "LIVE" },
    { id: "2", label: "Bea", code: "LIVE" },
    { id: "3", label: "Cara", code: "Madrid" },
  ];
  assert.equal(leadingExp(marks), "home");
  assert.match(expLanesCsv(marks), /home,2/);
  assert.match(expRowsCsv(marks, ["1"]), /Ada,LIVE/);
  assert.equal(crmv4Text("tr", "gllTitle"), ROUND355_COPY.tr.gllTitle);
  assert.equal(crmv4Text("de", "expTitle"), ROUND355_COPY.de.expTitle);
  assert.equal(crmv4Text("ru", "rdExedraKicker"), ROUND355_COPY.ru.rdExedraKicker);
  assert.equal(crmv4Text("ar", "icTholosLead"), ROUND355_COPY.ar.icTholosLead);
  const keys = Object.keys(ROUND355_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND355_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-guilloche/);
  assert.match(css, /\.c4-expplate/);
  assert.match(css, /\.c4-guilloche-column/);
  assert.match(css, /\.c4-expplate-column/);
  assert.match(css, /\.c4-row-exedra/);
  assert.match(css, /\.c4-ib-tholos/);
  assert.match(css, /\.c4-rd-exedra-mast/);
  assert.match(css, /\.c4-ic-tholos-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round355.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /birthDate:/);
  assert.match(viewFile, /guillocheCsv/);
  assert.match(viewFile, /expRowsCsv/);
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
  assert.match(viewFile, /c4-expplate-search/);
  assert.match(viewFile, /guillocheTimeline/);
  assert.match(viewFile, /c4-guilloche-notices/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "gll"/);
  assert.match(app, /view === "exp"/);
  const tags = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round109.tsx"), "utf8");
  assert.match(tags, /c4-row-exedra/);
  assert.match(tags, /c4-rd-exedra-mast/);
  assert.match(tags, /data-logo="mono"/);
  assert.match(tags, /rdExedraKicker/);
  assert.match(tags, /rdExedraLead/);
  assert.match(tags, /data-row-exedra/);
  const gallery = tags.slice(tags.indexOf("export function RowDensityDesk"), tags.indexOf("export function IbCountry"));
  assert.equal(gallery.includes("amount"), false);
  assert.equal(gallery.includes("price"), false);
  assert.match(tags, /c4-ib-tholos/);
  assert.match(tags, /c4-ic-tholos-mast/);
  assert.match(tags, /icTholosKicker/);
  assert.match(tags, /icTholosLead/);
  assert.match(tags, /data-ib-tholos/);
  const porch = tags.slice(tags.indexOf("export function IbCountry"));
  assert.equal(porch.includes("currency"), false);
  assert.equal(porch.includes("profit"), false);
  const namedKeys = `${viewFile}\n${tags}`.match(/"(gll|exp|rdExedra|icTholos)[A-Za-z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND355_COPY.en[key as keyof typeof ROUND355_COPY.en], "string", key);
  console.log("crmv4 round355 tests passed");
}

main();
