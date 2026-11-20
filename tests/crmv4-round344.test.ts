/**
 * Rattrapante rules, email plates, the ivory campaign porticus, and the graphite stage crypta.
 * Run: TZ=UTC npx tsx tests/crmv4-round344.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND344_COPY } from "../src/lib/crmv4/copy-round344";
import {
  ROUND344_FEATURES,
  activeFinish,
  activeMode,
  activeHour,
  activeHammer,
  addRattrapante,
  briskRattrapante,
  dropRattrapanteView,
  fairKeeper,
  emailHome,
  emailBrief,
  emailCapital,
  emailDigit,
  emailEven,
  emailFirst,
  emailGap,
  emailHue,
  emailJoin,
  emailCitizen,
  emailLane,
  emailLanesCsv,
  emailLength,
  emailLower,
  emailGuest,
  emailAway,
  emailOpen,
  emailPlain,
  emailLong,
  emailRowsCsv,
  emailSoon,
  emailSpace,
  emailState,
  emailUpper,
  emailVowel,
  fullHammer,
  idleRattrapante,
  lateRattrapante,
  leadingEmail,
  moveRattrapanteFocus,
  rattrapanteBand,
  rattrapanteHour,
  rattrapanteGap,
  rattrapanteInner,
  rattrapanteMode,
  rattrapanteOuter,
  rattrapanteHammer,
  rattrapanteFilm,
  rattrapanteTimeline,
  overdueRattrapante,
  pairHammer,
  quietFinish,
  readRattrapanteViews,
  reminderRattrapantes,
  restingRattrapante,
  suggestFinish,
  suggestMode,
  suggestHour,
  type EmailRow,
  type Rattrapante,
} from "../src/lib/crmv4/round344";

function rule(partial: Partial<Rattrapante> & { id: string; title: string }): Rattrapante {
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
  assert.equal(ROUND344_FEATURES.length, 25);
  assert.equal(ROUND344_FEATURES.includes("email-plate"), true);
  assert.equal(ROUND344_FEATURES.includes("split-sla"), true);
  assert.equal(ROUND344_FEATURES.includes("fair-hand"), true);
  assert.equal(ROUND344_FEATURES.includes("case-file"), true);
  assert.equal(ROUND344_FEATURES.includes("split-notices"), true);
  assert.equal(ROUND344_FEATURES.includes("rattrapante-search"), true);
  assert.equal(ROUND344_FEATURES.includes("split-timeline"), true);
  assert.equal(rattrapanteMode(" split "), "split");
  assert.equal(rattrapanteMode("brass"), "");
  assert.equal(rattrapanteHour("4"), 4);
  assert.equal(rattrapanteHour(8), 8);
  assert.equal(rattrapanteHour(12), 12);
  assert.equal(rattrapanteHour(16), 16);
  assert.equal(rattrapanteHour("5"), null);
  assert.equal(rattrapanteHour("7"), null);
  assert.equal(rattrapanteHammer("4"), 4);
  assert.equal(rattrapanteHammer(6), 6);
  assert.equal(rattrapanteHammer("8"), 8);
  assert.equal(rattrapanteHammer("3"), null);
  assert.equal(rattrapanteHammer("7"), null);
  assert.equal(rattrapanteFilm("gilt"), "GILT");
  assert.equal(rattrapanteFilm("ivory"), "IVORY");
  assert.equal(rattrapanteFilm("graphite"), "GRAPHITE");
  assert.equal(rattrapanteFilm("hot"), "");
  assert.equal(rattrapanteInner("split"), true);
  assert.equal(rattrapanteInner("FLYBACK"), true);
  assert.equal(rattrapanteInner("column"), false);
  assert.equal(rattrapanteOuter("column"), true);
  assert.equal(rattrapanteOuter("clutch"), true);
  assert.equal(rattrapanteOuter("split"), false);
  assert.equal(rattrapanteBand("split"), "hand");
  assert.equal(rattrapanteBand("flyback"), "reset");
  assert.equal(rattrapanteBand("column"), "wheel");
  assert.equal(rattrapanteBand("clutch"), "dog");
  assert.equal(rattrapanteGap("split", "clutch"), 3);
  assert.equal(quietFinish("ivory"), true);
  assert.equal(quietFinish("gilt"), false);
  assert.equal(pairHammer(6), true);
  assert.equal(pairHammer(4), false);
  assert.equal(fullHammer(8), true);
  assert.equal(fullHammer(6), false);
  assert.equal(activeMode("inner"), "inner");
  assert.equal(activeHour("8"), "8");
  assert.equal(activeHour("5"), "all");
  assert.equal(activeHammer("8"), "8");
  assert.equal(activeHammer("3"), "all");
  assert.equal(activeFinish("gilt", ["GILT"]), "GILT");
  assert.equal(suggestMode(6), "split");
  assert.equal(suggestMode(10), "clutch");
  assert.equal(suggestHour([], 4), 4);
  assert.equal(suggestHour([], 8), 8);
  assert.equal(suggestHour([], 14), 12);
  assert.equal(suggestHour([], 20), 16);
  assert.equal(suggestFinish([]), "IVORY");
  assert.equal(moveRattrapanteFocus(0, 3, 1), 1);
  assert.equal(moveRattrapanteFocus(0, 3, -1), 2);
  const late = rule({ id: "a", title: "Ada", piece: "split" });
  const due = rule({ id: "b", title: "Bea", piece: "column", lock: 4 });
  const quiet = rule({ id: "c", title: "Cara", drop: 4, lock: 4 });
  const cell = rule({ id: "d", title: "Dora", film: "GILT", drop: 16, lock: 8 });
  const fax = rule({ id: "e", title: "Eve", piece: "clutch", film: "IVORY", drop: 8 });
  assert.equal(lateRattrapante(late, "clutch"), true);
  assert.equal(lateRattrapante(late, "split"), false);
  assert.equal(overdueRattrapante(due), true);
  assert.equal(idleRattrapante(quiet), true);
  assert.equal(briskRattrapante(cell), true);
  assert.equal(restingRattrapante(fax), true);
  assert.deepEqual(reminderRattrapantes([due, late]), ["Bea"]);
  assert.equal(fairKeeper([rule({ id: "1", title: "One", setter: "Ada" }), rule({ id: "2", title: "Two", setter: "Bea" }), rule({ id: "3", title: "Three", setter: "Ada" })], "Ada,Bea"), "Bea");
  const cards = [rule({ id: "1", title: "North", drop: 12 }), rule({ id: "2", title: "East", drop: 6 })];
  assert.match(rattrapanteTimeline(cards).map((mail) => mail.drop).join(","), /12/);
  const saved = addRattrapante([], { title: "Ada", piece: "flyback", drop: "8", film: "gilt", lock: "6", tags: "s f x" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].piece, "flyback");
  assert.equal(saved[0].drop, 8);
  assert.equal(saved[0].lock, 6);
  assert.deepEqual(saved[0].tags, ["s", "f"]);
  assert.equal(addRattrapante(saved, { title: "Ada" }).length, 1);
  assert.equal(addRattrapante([], { title: "Eve" })[0].lock, 4);
  assert.equal(dropRattrapanteView([{ id: "v", name: "Morning", tray: "board", query: "", setter: "", film: "all", piece: "all", drop: "all", lock: "all" }], "v").length, 0);
  assert.equal(readRattrapanteViews([{ id: "v", name: "Morning", tray: "peg" }])[0].tray, "peg");

  assert.equal(emailHome("mail"), true);
  assert.equal(emailHome("MAIL"), true);
  assert.equal(emailAway("INBOX"), true);
  assert.equal(emailGuest("DESK"), true);
  assert.equal(emailCitizen("POST"), true);
  assert.equal(emailHome({ email: true }), true);
  assert.equal(emailPlain({ email: false }), true);
  assert.equal(emailAway({ email: false }), false);
  assert.equal(emailPlain({ email: "Letter" }), true);
  assert.equal(emailHome({ email: "Letter" }), false);
  assert.equal(emailBrief({ email: "Notes" }), true);
  assert.equal(emailJoin("MAIL&INBOX"), true);
  assert.equal(emailJoin("ANNA NOAH"), false);
  assert.equal(emailGap("U,S"), true);
  assert.equal(emailGap("LIVEHOLD"), false);
  assert.equal(emailBrief("Notes"), true);
  assert.equal(emailBrief("MAIL"), false);
  assert.equal(emailLong("Abcdefghijklmnop"), true);
  assert.equal(emailLong("Amsterdam"), false);
  assert.equal(emailLane("MAIL"), "mail");
  assert.equal(emailLane("Notes"), "brief");
  assert.equal(emailLane("Letter"), "plain");
  assert.equal(emailLane("10language"), "mark");
  assert.equal(emailLane("Amsterdam"), "vowel");
  assert.equal(emailOpen(""), true);
  assert.equal(emailOpen({ email: "" }), true);
  assert.equal(emailState({ name: "Ada" }), "");
  assert.equal(emailState({ email: "Paris", balance: 1 }), "");
  assert.equal(emailHue("MAIL"), "champagne");
  assert.equal(emailHue("MAIL&INBOX"), "graphite");
  assert.equal(emailHue("DESK"), "champagne");
  assert.equal(emailSoon("Notes"), true);
  assert.equal(emailSoon("MAIL"), false);
  assert.equal(emailSoon("Devices"), true);
  assert.equal(emailSoon("Company"), true);
  assert.equal(emailSoon("Amsterdam"), false);
  assert.equal(emailHue("Letter"), "ivory");
  assert.equal(emailLength("yes"), 3);
  assert.equal(emailEven("ab"), true);
  assert.equal(emailFirst("Paris"), true);
  assert.equal(emailSpace("needs review"), true);
  assert.equal(emailVowel("Amsterdam"), true);
  assert.equal(emailDigit("Room4"), true);
  assert.equal(emailCapital("PARIS"), true);
  assert.equal(emailLower("paris"), true);
  assert.equal(emailUpper("LEONARD"), true);
  assert.equal(emailUpper("INBOX"), true);
  assert.equal(emailUpper("MAIL"), false);
  assert.equal(emailUpper("NG"), false);
  const marks: EmailRow[] = [
    { id: "1", label: "Ada", code: "MAIL" },
    { id: "2", label: "Bea", code: "MAIL" },
    { id: "3", label: "Cara", code: "Madrid" },
  ];
  assert.equal(leadingEmail(marks), "mail");
  assert.match(emailLanesCsv(marks), /mail,2/);
  assert.match(emailRowsCsv(marks, ["1"]), /Ada,MAIL/);
  assert.equal(crmv4Text("tr", "rtpTitle"), ROUND344_COPY.tr.rtpTitle);
  assert.equal(crmv4Text("de", "mpxTitle"), ROUND344_COPY.de.mpxTitle);
  assert.equal(crmv4Text("ru", "atyCauponaKicker"), ROUND344_COPY.ru.atyCauponaKicker);
  assert.equal(crmv4Text("ar", "kflOfficinaLead"), ROUND344_COPY.ar.kflOfficinaLead);
  const keys = Object.keys(ROUND344_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND344_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-rattrapante/);
  assert.match(css, /\.c4-email/);
  assert.match(css, /\.c4-rattrapante-column/);
  assert.match(css, /\.c4-email-column/);
  assert.match(css, /\.c4-acct-type-caupona/);
  assert.match(css, /\.c4-kyc-file-officina/);
  assert.match(css, /\.c4-aty-caupona-mast/);
  assert.match(css, /\.c4-kfl-officina-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round344.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /email:/);
  assert.match(viewFile, /rattrapanteCsv/);
  assert.match(viewFile, /emailRowsCsv/);
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
  assert.match(viewFile, /c4-email-search/);
  assert.match(viewFile, /rattrapanteTimeline/);
  assert.match(viewFile, /c4-rattrapante-notices/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "rtp"/);
  assert.match(app, /view === "mpx"/);
  const host = `${fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round128.tsx"), "utf8")}\n${fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round129.tsx"), "utf8")}`;
  assert.match(host, /c4-acct-type-caupona/);
  assert.match(host, /c4-aty-caupona-mast/);
  assert.match(host, /data-logo="mono"/);
  assert.match(host, /atyCauponaKicker/);
  assert.match(host, /atyCauponaLead/);
  assert.match(host, /data-acct-type/);
  assert.equal(host.includes("amount"), false);
  assert.match(host, /c4-kyc-file-officina/);
  assert.match(host, /c4-kfl-officina-mast/);
  assert.match(host, /kflOfficinaKicker/);
  assert.match(host, /kflOfficinaLead/);
  assert.match(host, /data-kyc-file/);
  assert.equal(host.includes("currency"), false);
  assert.equal(host.includes("profit"), false);
  const namedKeys = `${viewFile}\n${host}`.match(/"(rtp|mpx|atyCaupona|kflOfficina)[A-Za-z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND344_COPY.en[key as keyof typeof ROUND344_COPY.en], "string", key);
  console.log("crmv4 round344 tests passed");
}

main();
