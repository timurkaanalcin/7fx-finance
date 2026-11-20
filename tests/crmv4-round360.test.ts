/**
 * Flinqué foil rules, method keeper plates, the ivory meeting peribolos, and the graphite order dromos.
 * Run: TZ=UTC npx tsx tests/crmv4-round360.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND360_COPY } from "../src/lib/crmv4/copy-round360";
import {
  ROUND360_FEATURES,
  activeFinish,
  activeMode,
  activeHour,
  activeHammer,
  addFlinque,
  briskFlinque,
  dropFlinqueView,
  fairKeeper,
  mkpHome,
  mkpBrief,
  mkpCapital,
  mkpDigit,
  mkpEven,
  mkpFirst,
  mkpRoute,
  mkpHue,
  mkpJoin,
  mkpCitizen,
  mkpLane,
  mkpLanesCsv,
  mkpLength,
  mkpLower,
  mkpGuest,
  mkpAway,
  mkpOpen,
  mkpPlain,
  mkpLong,
  mkpRowsCsv,
  mkpSoon,
  mkpSpace,
  mkpState,
  mkpUpper,
  mkpVowel,
  mkpDesk,
  fullHammer,
  idleFlinque,
  lateFlinque,
  leadingSel,
  moveFlinqueFocus,
  flinqueBand,
  flinqueHour,
  flinqueGap,
  flinqueInner,
  flinqueMode,
  flinqueOuter,
  flinqueHammer,
  flinqueFilm,
  flinqueTimeline,
  overdueFlinque,
  pairHammer,
  quietFinish,
  readFlinqueViews,
  reminderFlinques,
  restingFlinque,
  suggestFinish,
  suggestMode,
  suggestHour,
  type MkpRow,
  type Flinque,
} from "../src/lib/crmv4/round360";

function rule(partial: Partial<Flinque> & { id: string; title: string }): Flinque {
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
  assert.equal(ROUND360_FEATURES.length, 25);
  assert.equal(ROUND360_FEATURES.includes("method-keeper-plate"), true);
  assert.equal(ROUND360_FEATURES.includes("flinque-pin-sla"), true);
  assert.equal(ROUND360_FEATURES.includes("fair-enameller"), true);
  assert.equal(ROUND360_FEATURES.includes("foil-archive"), true);
  assert.equal(ROUND360_FEATURES.includes("foil-reminders"), true);
  assert.equal(ROUND360_FEATURES.includes("flinque-search"), true);
  assert.equal(ROUND360_FEATURES.includes("foil-timeline"), true);
  assert.equal(flinqueMode(" foil "), "foil");
  assert.equal(flinqueMode("brass"), "");
  assert.equal(flinqueHour("4"), 4);
  assert.equal(flinqueHour(9), 9);
  assert.equal(flinqueHour(18), 18);
  assert.equal(flinqueHour(36), 36);
  assert.equal(flinqueHour("6"), null);
  assert.equal(flinqueHour("10"), null);
  assert.equal(flinqueHammer("2"), 2);
  assert.equal(flinqueHammer(4), 4);
  assert.equal(flinqueHammer("8"), 8);
  assert.equal(flinqueHammer("1"), null);
  assert.equal(flinqueHammer("3"), null);
  assert.equal(flinqueFilm("gilt"), "GILT");
  assert.equal(flinqueFilm("ivory"), "IVORY");
  assert.equal(flinqueFilm("graphite"), "GRAPHITE");
  assert.equal(flinqueFilm("hot"), "");
  assert.equal(flinqueInner("foil"), true);
  assert.equal(flinqueInner("WAVE"), true);
  assert.equal(flinqueInner("scale"), false);
  assert.equal(flinqueOuter("scale"), true);
  assert.equal(flinqueOuter("lace"), true);
  assert.equal(flinqueOuter("foil"), false);
  assert.equal(flinqueBand("foil"), "leaf");
  assert.equal(flinqueBand("wave"), "ripple");
  assert.equal(flinqueBand("scale"), "tile");
  assert.equal(flinqueBand("lace"), "net");
  assert.equal(flinqueGap("foil", "lace"), 3);
  assert.equal(quietFinish("ivory"), true);
  assert.equal(quietFinish("gilt"), false);
  assert.equal(pairHammer(4), true);
  assert.equal(pairHammer(2), false);
  assert.equal(fullHammer(8), true);
  assert.equal(fullHammer(4), false);
  assert.equal(activeMode("inner"), "inner");
  assert.equal(activeHour("18"), "18");
  assert.equal(activeHour("7"), "all");
  assert.equal(activeHammer("8"), "8");
  assert.equal(activeHammer("5"), "all");
  assert.equal(activeFinish("gilt", ["GILT"]), "GILT");
  assert.equal(suggestMode(4), "foil");
  assert.equal(suggestMode(10), "lace");
  assert.equal(suggestHour([], 3), 4);
  assert.equal(suggestHour([], 8), 9);
  assert.equal(suggestHour([], 14), 18);
  assert.equal(suggestHour([], 20), 36);
  assert.equal(suggestFinish([]), "IVORY");
  assert.equal(moveFlinqueFocus(0, 3, 1), 1);
  assert.equal(moveFlinqueFocus(0, 3, -1), 2);
  const late = rule({ id: "a", title: "Ada", piece: "foil" });
  const due = rule({ id: "b", title: "Bea", piece: "scale", lock: 2 });
  const quiet = rule({ id: "c", title: "Cara", drop: 4, lock: 2 });
  const cell = rule({ id: "d", title: "Dora", film: "GILT", drop: 36, lock: 8 });
  const fax = rule({ id: "e", title: "Eve", piece: "lace", film: "IVORY", drop: 9 });
  assert.equal(lateFlinque(late, "lace"), true);
  assert.equal(lateFlinque(late, "foil"), false);
  assert.equal(overdueFlinque(due), true);
  assert.equal(idleFlinque(quiet), true);
  assert.equal(briskFlinque(cell), true);
  assert.equal(restingFlinque(fax), true);
  assert.deepEqual(reminderFlinques([due, late]), ["Bea"]);
  assert.equal(fairKeeper([rule({ id: "1", title: "One", setter: "Ada" }), rule({ id: "2", title: "Two", setter: "Bea" }), rule({ id: "3", title: "Three", setter: "Ada" })], "Ada,Bea"), "Bea");
  const cards = [rule({ id: "1", title: "North", drop: 18 }), rule({ id: "2", title: "East", drop: 9 })];
  assert.match(flinqueTimeline(cards).map((mail) => mail.drop).join(","), /18/);
  const saved = addFlinque([], { title: "Ada", piece: "wave", drop: "9", film: "gilt", lock: "4", tags: "f q x" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].piece, "wave");
  assert.equal(saved[0].drop, 9);
  assert.equal(saved[0].lock, 4);
  assert.deepEqual(saved[0].tags, ["f", "q"]);
  assert.equal(addFlinque(saved, { title: "Ada" }).length, 1);
  assert.equal(addFlinque([], { title: "Eve" })[0].lock, 2);
  assert.equal(dropFlinqueView([{ id: "v", name: "Morning", tray: "board", query: "", setter: "", film: "all", piece: "all", drop: "all", lock: "all" }], "v").length, 0);
  assert.equal(readFlinqueViews([{ id: "v", name: "Morning", tray: "peg" }])[0].tray, "peg");

  const now = Date.parse("2026-11-20T12:00:00.000Z");
  assert.equal(mkpHome("YES", now), true);
  assert.equal(mkpHome("KEEP", now), true);
  assert.equal(mkpHome("2026-11-20T01:00:00.000Z", now), true);
  assert.equal(mkpAway("NO", now), true);
  assert.equal(mkpGuest("2026-11-10T12:00:00.000Z", now), true);
  assert.equal(mkpCitizen("2025-01-01T00:00:00.000Z", now), true);
  assert.equal(mkpDesk("2026-11-18T12:00:00.000Z", now), true);
  assert.equal(mkpHome({ canManageMethods: true }, now), true);
  assert.equal(mkpHome({ canManageMethods: "2026-11-20T08:00:00.000Z" }, now), true);
  assert.equal(mkpPlain({ canManageMethods: false }, now), false);
  assert.equal(mkpAway({ canManageMethods: false }, now), true);
  assert.equal(mkpPlain({ canManageMethods: "Coppery" }, now), true);
  assert.equal(mkpHome({ canManageMethods: "Coppery" }, now), false);
  assert.equal(mkpBrief({ canManageMethods: "MARKS" }, now), true);
  assert.equal(mkpJoin("YES+NO", now), true);
  assert.equal(mkpJoin("ANNA NOAH", now), false);
  assert.equal(mkpRoute("KEEP|DESK", now), true);
  assert.equal(mkpRoute("SETHOLD", now), false);
  assert.equal(mkpBrief("MARKS", now), true);
  assert.equal(mkpBrief("YES", now), false);
  assert.equal(mkpLong("SixteenCharsLongX", now), true);
  assert.equal(mkpLong("20261120T073000ZZ", now), false);
  assert.equal(mkpLane("YES", now), "hall");
  assert.equal(mkpLane("2026-11-18T12:00:00.000Z", now), "desk");
  assert.equal(mkpLane("2026-11-10T12:00:00.000Z", now), "hold");
  assert.equal(mkpLane("2025-01-01T00:00:00.000Z", now), "guest");
  assert.equal(mkpLane("Coppery", now), "plain");
  assert.equal(mkpLane("20261120T073000Z", now), "stamp");
  assert.equal(mkpLane("Amsterdam", now), "vowel");
  assert.equal(mkpLane("robot-script", now), "vacant");
  assert.equal(mkpLane("alpha/beta/gamma/delta", now), "route");
  assert.equal(mkpLane("grant desk extra", now), "hall");
  assert.equal(mkpOpen(""), true);
  assert.equal(mkpOpen({ canManageMethods: "" }), true);
  assert.equal(mkpState({ name: "Ada" }), "");
  assert.equal(mkpState({ canManageMethods: "Paris", balance: 1 }), "");
  assert.equal(mkpHue("YES", now), "champagne");
  assert.equal(mkpHue("YES+NO", now), "graphite");
  assert.equal(mkpHue("2026-11-10T12:00:00.000Z", now), "champagne");
  assert.equal(mkpHue("2026-11-18T12:00:00.000Z", now), "graphite");
  assert.equal(mkpSoon("MARKS", now), true);
  assert.equal(mkpSoon("YES", now), false);
  assert.equal(mkpSoon("SEVENCH", now), true);
  assert.equal(mkpHue("Coppery", now), "ivory");
  assert.equal(mkpLength("yes"), 3);
  assert.equal(mkpEven("ab"), true);
  assert.equal(mkpFirst("Paris"), true);
  assert.equal(mkpSpace("needs review"), true);
  assert.equal(mkpVowel("Amsterdam"), true);
  assert.equal(mkpDigit("Room4"), true);
  assert.equal(mkpCapital("PARIS"), true);
  assert.equal(mkpLower("paris"), true);
  assert.equal(mkpUpper("SEALEDXX"), true);
  assert.equal(mkpUpper("HOT"), false);
  assert.equal(mkpUpper("WARM"), false);
  const marks: MkpRow[] = [
    { id: "1", label: "Ada", code: "YES" },
    { id: "2", label: "Bea", code: "YES" },
    { id: "3", label: "Cara", code: "Coppery" },
  ];
  assert.equal(leadingSel(marks), "hall");
  assert.match(mkpLanesCsv(marks), /hall,2/);
  assert.match(mkpRowsCsv(marks, ["1"]), /Ada,YES/);
  assert.equal(crmv4Text("tr", "flqTitle"), ROUND360_COPY.tr.flqTitle);
  assert.equal(crmv4Text("de", "mkpTitle"), ROUND360_COPY.de.mkpTitle);
  assert.equal(crmv4Text("ru", "mnPeribolosKicker"), ROUND360_COPY.ru.mnPeribolosKicker);
  assert.equal(crmv4Text("ar", "jqDromosLead"), ROUND360_COPY.ar.jqDromosLead);
  const keys = Object.keys(ROUND360_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND360_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-flinque/);
  assert.match(css, /\.c4-mkpplate/);
  assert.match(css, /\.c4-flinque-column/);
  assert.match(css, /\.c4-mkpplate-column/);
  assert.match(css, /\.c4-meet-peribolos/);
  assert.match(css, /\.c4-order-dromos/);
  assert.match(css, /\.c4-mn-peribolos-mast/);
  assert.match(css, /\.c4-jq-dromos-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round360.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /canManageMethods:/);
  assert.match(viewFile, /flinqueCsv/);
  assert.match(viewFile, /mkpRowsCsv/);
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
  assert.match(viewFile, /c4-mkpplate-search/);
  assert.match(viewFile, /flinqueTimeline/);
  assert.match(viewFile, /c4-flinque-notices/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "flq"/);
  assert.match(app, /view === "mkp"/);
  const tags = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round114.tsx"), "utf8");
  assert.match(tags, /c4-meet-peribolos/);
  assert.match(tags, /c4-mn-peribolos-mast/);
  assert.match(tags, /data-logo="mono"/);
  assert.match(tags, /mnPeribolosKicker/);
  assert.match(tags, /mnPeribolosLead/);
  assert.match(tags, /data-meet-peribolos/);
  const gallery = tags.slice(tags.indexOf("export function MeetingNotes"), tags.indexOf("export function OrderStatuses"));
  assert.equal(gallery.includes("amount"), false);
  assert.equal(gallery.includes("price"), false);
  assert.match(tags, /c4-order-dromos/);
  assert.match(tags, /c4-jq-dromos-mast/);
  assert.match(tags, /jqDromosKicker/);
  assert.match(tags, /jqDromosLead/);
  assert.match(tags, /data-order-dromos/);
  const porch = tags.slice(tags.indexOf("export function OrderStatuses"));
  assert.equal(porch.includes("amount"), false);
  assert.equal(porch.includes("profit"), false);
  assert.match(porch, /statusText/);
  const namedKeys = `${viewFile}\n${tags}`.match(/"(flq|mkp|mnPeribolos|jqDromos)[A-Za-z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND360_COPY.en[key as keyof typeof ROUND360_COPY.en], "string", key);
  console.log("crmv4 round360 tests passed");
}

main();
