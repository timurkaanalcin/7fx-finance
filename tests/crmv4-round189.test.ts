/**
 * Gallery hooks and language lanes.
 * Run: TZ=UTC npx tsx tests/crmv4-round189.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND189_COPY } from "../src/lib/crmv4/copy-round189";
import {
  activeBay,
  activeGrade,
  activePause,
  addHook,
  addHookView,
  bulkHookCloth,
  catalogTongue,
  catalogTongueCount,
  cycleTempo,
  editHook,
  editHookNote,
  evenTongue,
  evenTongueCount,
  fairReviewer,
  homeSeal,
  hookSeal,
  bayGap,
  bayOf,
  gradeOf,
  lateHook,
  nextHook,
  pauseDays,
  peakBay,
  quietBay,
  readHooks,
  sharedTongueCount,
  soonHook,
  suggestCloth,
  suggestPause,
  suggestReviewer,
  tongueBand,
  tongueRowsCsv,
  tongueState,
  tonguesCsv,
  usedBays,
  visibleHooks,
  visibleTongueCustomers,
  wideTongue,
  wideTongueCount,
  hooksCsv,
} from "../src/lib/crmv4/round189";

function main() {
  assert.equal(hookSeal("  tr1 "), "TR1");
  assert.equal(hookSeal("de2"), "DE2");
  assert.equal(hookSeal("ae3"), "AE3");
  assert.equal(hookSeal("   "), "");
  assert.equal(hookSeal("TR"), "");
  assert.equal(hookSeal("TR12"), "");
  assert.equal(bayOf("1"), 1);
  assert.equal(bayOf("12"), 12);
  assert.equal(bayOf("9"), 9);
  assert.equal(bayOf("01"), null);
  assert.equal(bayOf("0"), null);
  assert.equal(bayOf("13"), null);
  assert.equal(bayOf(""), null);
  assert.equal(gradeOf("1"), 1);
  assert.equal(gradeOf(3), 3);
  assert.equal(gradeOf("0"), null);
  assert.equal(gradeOf("4"), null);
  assert.equal(gradeOf("01"), null);
  assert.equal(pauseDays("2"), 2);
  assert.equal(pauseDays(10), 10);
  assert.equal(pauseDays("0"), null);
  assert.equal(pauseDays("02"), null);
  assert.equal(pauseDays("1"), null);
  assert.equal(peakBay(3), true);
  assert.equal(peakBay(9), true);
  assert.equal(peakBay(1), false);
  assert.equal(quietBay(6), true);
  assert.equal(quietBay(12), true);
  assert.equal(quietBay(3), false);
  assert.equal(quietBay(9), false);
  assert.equal(bayGap(12, 1), 1);
  assert.equal(bayGap(1, 12), -1);
  assert.equal(bayGap(1, 7), 6);
  assert.equal(bayGap(1, 8), -5);
  assert.equal(bayGap(null, 2), null);
  assert.equal(bayGap(2, ""), null);
  assert.equal(bayGap(2, 13), null);

  const saved = addHook([], { id: "a", title: "Hook Ada", note: "oak page", reviewer: "Nia", bay: "6", cloth: "ivory", seal: "tr1", tempo: "calm", grade: "3", pause: "2" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].bay, 6);
  assert.equal(saved[0].grade, 3);
  assert.equal(saved[0].pause, 2);
  assert.equal(saved[0].seal, "TR1");
  assert.equal(saved[0].note, "oak page");
  assert.equal(saved[0].audit, "save");
  assert.equal(homeSeal(saved[0].seal), true);
  assert.equal(homeSeal("US"), false);
  assert.equal(homeSeal("TR12"), false);
  assert.equal(soonHook(saved[0]), true);
  assert.equal(addHook(saved, { id: "b", title: "Hook Ada" }).length, 1);
  assert.equal(addHook(saved, { id: "a", title: "Other" }).length, 1);
  assert.equal(addHook(saved, { id: "c", title: "   " }).length, 1);
  const capped = Array.from({ length: 12 }, (_, index) => ({ id: `n${index}`, title: `Line ${index}` })).reduce((cards, card) => addHook(cards, card), [] as ReturnType<typeof addHook>);
  assert.equal(capped.length, 8);
  assert.equal(capped.some((card) => card.title === "Line 0"), false);
  assert.equal(capped[0].title, "Line 11");

  const cycled = cycleTempo(saved, "a");
  assert.equal(cycled[0].tempo, "steady");
  assert.equal(cycled[0].audit, "tempo");
  assert.equal(cycleTempo(cycled, "a")[0].tempo, "swift");
  assert.equal(cycleTempo(cycleTempo(cycled, "a"), "a")[0].tempo, "calm");
  const blankTempo = addHook([], { id: "z", title: "Blank tempo" });
  assert.equal(cycleTempo(blankTempo, "z")[0].tempo, "calm");

  const edited = editHook(saved, "a", "Hook Bea");
  assert.equal(edited[0].title, "Hook Bea");
  assert.equal(edited[0].audit, "edit");
  assert.equal(editHook(edited, "a", "  ")[0].title, "Hook Bea");
  const noted = editHookNote(edited, "a", "second look");
  assert.equal(noted[0].note, "second look");
  assert.equal(editHookNote(noted, "a", "  ")[0].note, "second look");
  const pair = addHook(noted, { id: "b", title: "Hook" });
  assert.equal(editHook(pair, "a", "Hook").find((card) => card.id === "a")?.title, "Hook Bea");

  const early = addHook([], { id: "a", title: "Early", bay: "1", cloth: "champagne", pause: "2", reviewer: "Nia", grade: "1" });
  const mid = addHook(early, { id: "m", title: "Mid", bay: "6", cloth: "ink", pause: "10", reviewer: "Ada", grade: "3", tempo: "calm" });
  const open = addHook(mid, { id: "b", title: "Later", bay: "10", tempo: "swift" });
  assert.equal(lateHook(open.find((card) => card.title === "Early") as (typeof open)[number], 6), true);
  assert.equal(lateHook(open.find((card) => card.title === "Early") as (typeof open)[number], 4), false);
  const earlyCard = open.find((card) => card.title === "Early") as (typeof open)[number];
  assert.equal(lateHook({ ...earlyCard, done: true }, 6), false);
  assert.equal(nextHook(open, 6), open.find((card) => card.title === "Mid")?.id);
  assert.equal(nextHook(open, 11), open.find((card) => card.title === "Early")?.id);
  assert.equal(suggestCloth([]), "champagne");
  assert.equal(suggestCloth(open), "ivory");
  assert.equal(suggestReviewer(open), "Ada");
  assert.equal(suggestPause([]), 5);
  assert.equal(suggestPause(open), 5);
  assert.equal(fairReviewer(open, "Nia, Bea"), "Bea");
  assert.equal(fairReviewer(open, ""), "Ada");
  assert.equal(usedBays(open), 3);
  assert.equal(bulkHookCloth(open, ["b"], "graphite").find((card) => card.id === "b")?.cloth, "graphite");
  assert.equal(activeBay("first"), "first");
  assert.equal(activeBay("13"), "all");
  assert.equal(activeGrade("3"), "3");
  assert.equal(activePause("10"), "10");
  const shown = visibleHooks(open, "open", "mid", null, null, null, null, null, null, null, null, false, false, false);
  assert.equal(shown.length, 1);
  assert.equal(shown[0].title, "Mid");
  const views = addHookView([], { id: "v", name: "First", tray: "open", query: "", reviewer: "all", cloth: "all", seal: "all", tempo: "all", bay: "first", grade: "all", pause: "all" });
  assert.equal(views.length, 1);
  assert.equal(views[0].bay, "first");
  const csv = hooksCsv(open, 6);
  assert.equal(csv.startsWith("title,reviewer,bay"), true);
  assert.equal(csv.includes("amount"), false);
  assert.equal(readHooks([{ id: "", title: "Nope" }]).length, 0);

  const root = "en";
  const slip = "en-us";
  const roll = "zh-hant";
  const card = "en-usa";
  assert.equal(tongueBand(root), "root");
  assert.equal(tongueBand(slip), "slip");
  assert.equal(tongueBand(card), "card");
  assert.equal(tongueBand(roll), "roll");
  assert.equal(catalogTongue(root), true);
  assert.equal(catalogTongue(roll), false);
  assert.equal(wideTongue(roll), true);
  assert.equal(evenTongue(root), true);
  assert.equal(evenTongue(slip), false);
  const rows = [
    { id: "ada", label: "Ada", note: { language: root } },
    { id: "bea", label: "Bea", note: { language: root } },
    { id: "cy", label: "Cy", note: { language: null } },
    { id: "dee", label: "Dee", note: { language: slip, balance: 1 } },
    { id: "eve", label: "Eve", note: { language: roll } },
    { id: "fay", label: "Fay", note: { language: card } },
  ];
  assert.equal(tongueState(root), "set");
  assert.equal(tongueState({ language: null }), "clear");
  assert.equal(tongueState({ language: slip, balance: 1 }), "");
  assert.equal(tongueState("not-a-language"), "");
  assert.equal(tongueState(""), "clear");
  assert.equal(catalogTongueCount(rows), 2);
  assert.equal(wideTongueCount(rows), 2);
  assert.equal(evenTongueCount(rows), 3);
  assert.equal(sharedTongueCount(rows), 1);
  assert.equal(visibleTongueCustomers(rows, "root", null, "", "all", [], "all").length, 2);
  assert.equal(visibleTongueCustomers(rows, null, null, "gus", "all", [], "all").length, 0);
  const bands = tonguesCsv(rows);
  assert.equal(bands.startsWith("kind,mark,count"), true);
  assert.equal(bands.includes("amount"), false);
  assert.equal(bands.includes("catalog"), true);
  const queue = tongueRowsCsv(rows, ["ada"]);
  assert.equal(queue.includes("Ada"), true);
  assert.equal(queue.split("\n")[1].endsWith(",1"), true);

  assert.equal(crmv4Text("en", "ghkTitle"), ROUND189_COPY.en.ghkTitle);
  assert.equal(crmv4Text("tr", "llnTitle"), ROUND189_COPY.tr.llnTitle);
  assert.equal(crmv4Text("de", "ghkSearch"), ROUND189_COPY.de.ghkSearch);
  assert.equal(crmv4Text("ru", "llnHint"), ROUND189_COPY.ru.llnHint);
  assert.equal(crmv4Text("ar", "ghkNotice"), ROUND189_COPY.ar.ghkNotice);
  assert.notEqual(ROUND189_COPY.tr.ghkTitle, ROUND189_COPY.en.ghkTitle);
  assert.notEqual(ROUND189_COPY.de.llnTitle, ROUND189_COPY.en.llnTitle);
  assert.notEqual(ROUND189_COPY.ru.ghkSearch, ROUND189_COPY.en.ghkSearch);
  assert.notEqual(ROUND189_COPY.ar.llnSearch, ROUND189_COPY.en.llnSearch);
  const keys = Object.keys(ROUND189_COPY.en);
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND189_COPY[locale]), keys);
  }

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-ghk/);
  assert.match(css, /\.c4-lng/);
  assert.match(css, /\.c4-cust-parlor/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /#d4bc86/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round189.tsx"), "utf8");
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
  assert.equal(viewFile.includes("assigneeId"), false);
  assert.match(viewFile, /language/);
  assert.match(viewFile, /hooksCsv/);
  assert.match(viewFile, /tonguesCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "n"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(viewFile, /data-hooks/);
  assert.match(viewFile, /data-lanes/);
  assert.match(viewFile, /data-catalog/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /customers/);
  assert.match(viewFile, /suggestCloth/);
  const customers = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/views/Customers.tsx"), "utf8");
  assert.match(customers, /c4-cust-parlor/);
  assert.match(customers, /data-logo="mono"/);
  assert.match(customers, /c4-cust-parlor-mast/);
  assert.match(customers, /c4-cust-ladder/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "ghook"/);
  assert.match(app, /view === "llane"/);
  assert.match(app, /GalleryHooks/);
  assert.match(app, /LanguageLanes/);
  console.log("crmv4 round189 tests passed");
}

main();
