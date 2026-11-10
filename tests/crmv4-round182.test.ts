/**
 * Night chimes and referral tokens.
 * Run: TZ=UTC npx tsx tests/crmv4-round182.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND182_COPY } from "../src/lib/crmv4/copy-round182";
import {
  activeReach,
  activeWeight,
  addChime,
  addChimeView,
  bulkChimeGlaze,
  bulkTokenReview,
  chimeMark,
  chimesCsv,
  cycleBell,
  dotToken,
  editChime,
  editChimeNote,
  homeMark,
  lateChime,
  leadingToken,
  leadingTokenDepth,
  nextChime,
  oddTokenCount,
  peakWatch,
  plusToken,
  plusTokenCount,
  quietWatch,
  readChimes,
  readReviewedTokens,
  reachOf,
  soonChime,
  suggestGlaze,
  suggestReach,
  suggestRinger,
  toggleTokenReview,
  tokenBand,
  tokenDepth,
  tokenRowsCsv,
  tokenState,
  tokenWords,
  tokensCsv,
  usedWatches,
  visibleTokenCustomers,
  visibleChimes,
  watchGap,
  watchOf,
  weightOf,
} from "../src/lib/crmv4/round182";

function main() {
  assert.equal(chimeMark("  en "), "EN");
  assert.equal(chimeMark("gb"), "GB");
  assert.equal(chimeMark("ae"), "AE");
  assert.equal(chimeMark("   "), "");
  assert.equal(chimeMark("G"), "");
  assert.equal(chimeMark("GBR"), "");
  assert.equal(chimeMark("G1"), "");
  assert.equal(chimeMark("z".repeat(20)), "");

  assert.equal(watchOf("01"), 1);
  assert.equal(watchOf("08"), 8);
  assert.equal(watchOf("8"), 8);
  assert.equal(watchOf("00"), null);
  assert.equal(watchOf("09"), null);
  assert.equal(watchOf("9"), null);
  assert.equal(watchOf(""), null);
  assert.equal(watchOf("3.0"), null);
  assert.equal(weightOf("2"), 2);
  assert.equal(weightOf(4), 4);
  assert.equal(weightOf(8), 8);
  assert.equal(weightOf("0"), null);
  assert.equal(weightOf("1"), null);
  assert.equal(weightOf("02"), null);
  assert.equal(reachOf("3"), 3);
  assert.equal(reachOf(15), 15);
  assert.equal(reachOf(9), 9);
  assert.equal(reachOf("0"), null);
  assert.equal(reachOf("4"), null);
  assert.equal(reachOf("03"), null);
  assert.equal(peakWatch(3), true);
  assert.equal(peakWatch(7), true);
  assert.equal(peakWatch(2), false);
  assert.equal(quietWatch(2), true);
  assert.equal(quietWatch(4), true);
  assert.equal(quietWatch(8), true);
  assert.equal(quietWatch(3), false);
  assert.equal(quietWatch(7), false);
  assert.equal(watchGap(5, 1), -4);
  assert.equal(watchGap(1, 5), 4);
  assert.equal(watchGap(2, 2), 0);
  assert.equal(watchGap(1, 6), -3);
  assert.equal(watchGap(6, 1), 3);
  assert.equal(watchGap(null, 2), null);
  assert.equal(watchGap(2, ""), null);
  assert.equal(watchGap(2, 9), null);

  const saved = addChime([], { id: "a", title: "Chime Ada", note: "mist scan", setter: "Nia", bay: "08", dye: "mist", mark: "gb", foil: "pearl", weight: "8", reach: "3" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].bay, 8);
  assert.equal(saved[0].weight, 8);
  assert.equal(saved[0].reach, 3);
  assert.equal(saved[0].mark, "GB");
  assert.equal(saved[0].note, "mist scan");
  assert.equal(saved[0].audit, "save");
  assert.equal(homeMark(saved[0].mark), true);
  assert.equal(homeMark("EN"), false);
  assert.equal(homeMark("TR"), false);
  assert.equal(soonChime(saved[0]), true);
  assert.equal(addChime(saved, { id: "b", title: "Chime Ada" }).length, 1);
  assert.equal(addChime(saved, { id: "a", title: "Other" }).length, 1);
  assert.equal(addChime(saved, { id: "c", title: "   " }).length, 1);
  const capped = Array.from({ length: 10 }, (_, index) => ({ id: `n${index}`, title: `Line ${index}` })).reduce((cards, card) => addChime(cards, card), [] as ReturnType<typeof addChime>);
  assert.equal(capped.length, 8);
  assert.equal(capped.some((card) => card.title === "Line 0"), false);
  assert.equal(capped[0].title, "Line 9");

  const cycled = cycleBell(saved, "a");
  assert.equal(cycled[0].foil, "copper");
  assert.equal(cycled[0].audit, "foil");
  assert.equal(cycleBell(cycled, "a")[0].foil, "ink");
  assert.equal(cycleBell(cycleBell(cycled, "a"), "a")[0].foil, "pearl");
  const blankTone = addChime([], { id: "z", title: "Blank bell" });
  assert.equal(cycleBell(blankTone, "z")[0].foil, "pearl");

  const edited = editChime(saved, "a", "Chime Bea");
  assert.equal(edited[0].title, "Chime Bea");
  assert.equal(edited[0].audit, "edit");
  assert.equal(editChime(edited, "a", "  ")[0].title, "Chime Bea");
  const noted = editChimeNote(edited, "a", "second look");
  assert.equal(noted[0].note, "second look");
  assert.equal(editChimeNote(noted, "a", "  ")[0].note, "second look");
  const pair = addChime(noted, { id: "b", title: "Keep" });
  assert.equal(editChime(pair, "a", "Keep").find((card) => card.id === "a")?.title, "Chime Bea");

  const early = addChime([], { id: "a", title: "Early", bay: "1", dye: "mist", reach: "15", setter: "Nia", weight: "8" });
  const mid = addChime(early, { id: "m", title: "Mid", bay: "4", dye: "brass", reach: "9", setter: "Ada", weight: "2" });
  const open = addChime(mid, { id: "b", title: "Later", bay: "8", foil: "ink" });
  assert.equal(lateChime(open.find((card) => card.title === "Early") as (typeof open)[number], 4), true);
  assert.equal(lateChime(open.find((card) => card.title === "Early") as (typeof open)[number], 2), false);
  const earlyCard = open.find((card) => card.title === "Early") as (typeof open)[number];
  assert.equal(lateChime({ ...earlyCard, filed: true }, 4), false);
  assert.equal(nextChime(open, 2), open.find((card) => card.title === "Mid")?.id);
  assert.equal(nextChime(open, 6), open.find((card) => card.title === "Early")?.id);
  assert.equal(suggestGlaze([]), "mist");
  assert.equal(suggestGlaze(open), "coal");
  assert.equal(suggestRinger(open), "Ada");
  assert.equal(suggestReach([]), 9);
  assert.equal(suggestReach(open), 3);
  assert.equal(usedWatches(open), 3);
  assert.equal(bulkChimeGlaze(open, ["b"], "coal").find((card) => card.id === "b")?.dye, "coal");
  assert.equal(bulkChimeGlaze(open, ["b"], "coal").find((card) => card.id === "b")?.audit, "dye");
  const shown = visibleChimes(open, "open", "early", null, null, null, null, null, null, null, null, false, false, false);
  assert.equal(shown.length, 1);
  assert.equal(shown[0].title, "Early");
  const sheet = chimesCsv(saved, 2);
  assert.equal(sheet.startsWith("title,setter,bay,dye,mark,foil,weight,reach,band,pinned,muted,filed,gap,late,soon,home,note,audit"), true);
  assert.equal(sheet.includes("amount"), false);
  assert.equal(sheet.includes("Chime Ada"), true);
  assert.equal(activeWeight("02"), "all");
  assert.equal(activeWeight("2"), "2");
  assert.equal(activeReach("03"), "all");
  assert.equal(activeReach("3"), "3");
  assert.equal(activeReach("15"), "15");
  const views = Array.from({ length: 7 }, (_, index) => ({
    id: `v${index}`,
    name: `View ${index}`,
    tray: "open" as const,
    query: "",
    setter: "all",
    dye: "all",
    mark: "all",
    foil: "all",
    bay: "all",
    weight: "all",
    reach: "all",
  })).reduce((list, view) => addChimeView(list, view), [] as ReturnType<typeof addChimeView>);
  assert.equal(views.length, 5);
  assert.equal(readChimes(saved)[0].title, "Chime Ada");

  const rows = [
    { id: "ada", label: "Ada", note: "K" },
    { id: "ann", label: "Ann", note: "North Wing" },
    { id: "bea", label: "Bea", note: "" },
    { id: "cy", label: "Cy", note: { referralCodeUsed: null } },
    { id: "dee", label: "Dee", note: { referralCodeUsed: "TR", saleStatus: "x" } },
    { id: "eve", label: "Eve", note: "7#" },
    { id: "usa", label: "Usa", note: "US" },
    { id: "rail", label: "Rail", note: "north_wing" },
    { id: "seam", label: "Seam", note: "Saint-Jean" },
    { id: "dot", label: "Dot", note: "ab.cd" },
    { id: "plus", label: "Plus", note: "+44" },
  ];
  assert.equal(tokenState(rows[0].note), "set");
  assert.equal(tokenBand(rows[0].note), "chip");
  assert.equal(tokenDepth(rows[0].note), "bare");
  assert.equal(tokenWords(rows[0].note), 1);
  assert.equal(dotToken(rows[0].note), false);
  assert.equal(tokenBand(rows[1].note), "plaque");
  assert.equal(tokenDepth(rows[1].note), "pair");
  assert.equal(tokenWords(rows[1].note), 2);
  assert.equal(tokenBand("a".repeat(40)), "banner");
  assert.equal(tokenDepth("a".repeat(40)), "bare");
  assert.equal(tokenDepth("Saint-Jean"), "dash");
  assert.equal(tokenDepth("north_wing"), "tick");
  assert.equal(tokenState(""), "clear");
  assert.equal(tokenState({ referralCodeUsed: null }), "clear");
  assert.equal(tokenState({ referralCodeUsed: "TR", saleStatus: "x" }), "");
  assert.equal(tokenState({ affiliateC: "TR" }), "");
  assert.equal(tokenState({ city: "TR" }), "");
  assert.equal(tokenState(12), "");
  assert.equal(dotToken("ab.cd"), true);
  assert.equal(tokenDepth("ab.cd"), "tick");
  assert.equal(tokenBand("ab.cd"), "tag");
  assert.equal(tokenBand(rows[5].note), "chip");
  assert.equal(tokenDepth(rows[5].note), "numeral");
  assert.equal(tokenBand(rows[6].note), "chip");
  assert.equal(plusToken("+44"), true);
  assert.equal(plusToken("44"), false);
  assert.equal(plusTokenCount(rows), 1);
  assert.equal(oddTokenCount(rows), 1);
  assert.equal(leadingToken(rows), "chip");
  assert.equal(leadingTokenDepth(rows), "bare");
  assert.equal(visibleTokenCustomers(rows, "chip", null, "", "all", [], "all").length, 4);
  assert.equal(visibleTokenCustomers(rows, null, null, "ann", "all", [], "dot").length, 0);
  assert.equal(visibleTokenCustomers(rows, null, null, "", "all", [], "plus").length, 1);
  assert.deepEqual(readReviewedTokens(["ada", "gone"], ["ada"]), ["ada"]);
  assert.deepEqual(bulkTokenReview(["ada"], ["ann"], ["ada", "ann"], true), ["ada", "ann"]);
  assert.equal(toggleTokenReview(["ada"], "ada", ["ada", "ann"]).includes("ada"), false);
  const names = tokensCsv(rows);
  assert.equal(names.startsWith("kind,mark,count"), true);
  assert.equal(tokensCsv([]), "kind,mark,count\nshape,odd,0\nshape,plus,0");
  assert.equal(names.includes("amount"), false);
  assert.equal(names.includes(",chip,"), true);
  const queue = tokenRowsCsv(rows, ["ada"]);
  assert.equal(queue.startsWith("name,band,depth,words,dot,reviewed"), true);
  assert.equal(queue.includes("amount"), false);
  assert.equal(queue.includes(",1"), true);

  const copy = Object.keys(ROUND182_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND182_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "nchTitle"), "Night chimes");
  assert.equal(crmv4Text("tr", "rftTitle"), ROUND182_COPY.tr.rftTitle);
  assert.equal(crmv4Text("de", "nchSetter"), ROUND182_COPY.de.nchSetter);
  assert.equal(crmv4Text("ru", "rftUnmarked"), ROUND182_COPY.ru.rftUnmarked);
  assert.equal(crmv4Text("ar", "nchNotice"), ROUND182_COPY.ar.nchNotice);
  assert.notEqual(ROUND182_COPY.tr.nchTitle, ROUND182_COPY.en.nchTitle);
  assert.notEqual(ROUND182_COPY.de.rftTitle, ROUND182_COPY.en.rftTitle);
  assert.notEqual(ROUND182_COPY.ru.nchSearch, ROUND182_COPY.en.nchSearch);
  assert.notEqual(ROUND182_COPY.ar.rftSearch, ROUND182_COPY.en.rftSearch);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-nch/);
  assert.match(css, /\.c4-rft/);
  assert.match(css, /\.c4-goals-night/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /#d4bc86/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round182.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.equal(viewFile.includes("saleStatus"), false);
  assert.equal(viewFile.includes("retentionStatus"), false);
  assert.equal(viewFile.includes("potentialStatus"), false);
  assert.equal(viewFile.includes("documentsStatus"), false);
  assert.equal(viewFile.includes("accountType"), false);
  assert.equal(viewFile.includes("validationStatus"), false);
  assert.equal(viewFile.includes("registrationDate"), false);
  assert.equal(viewFile.includes("birthDate"), false);
  assert.equal(viewFile.includes("lastContactAt"), false);
  assert.match(viewFile, /referralCodeUsed/);
  assert.match(viewFile, /chimesCsv/);
  assert.match(viewFile, /tokensCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "n"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(viewFile, /data-chimes/);
  assert.match(viewFile, /data-tokens/);
  assert.match(viewFile, /data-plus/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /customers/);
  assert.match(viewFile, /suggestGlaze/);
  const goals = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round25.tsx"), "utf8");
  assert.match(goals, /c4-goals-night/);
  assert.match(goals, /data-logo="mono"/);
  assert.match(goals, /data-pace/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "chime"/);
  assert.match(app, /view === "rftok"/);
  assert.match(app, /NightChimes/);
  assert.match(app, /ReferralTokens/);
  console.log("crmv4 round182 tests passed");
}

main();
