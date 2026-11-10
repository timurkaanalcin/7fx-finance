/**
 * Oriel hours and trial lamps.
 * Run: TZ=UTC npx tsx tests/crmv4-round168.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND168_COPY } from "../src/lib/crmv4/copy-round168";
import {
  activeHour,
  activeTrial,
  addOriel,
  addOrielView,
  bulkOrielBay,
  caseOf,
  cycleOrielTempo,
  dayHour,
  editOriel,
  editOrielNote,
  hourOf,
  leadingCase,
  leadingTrial,
  nextOriel,
  orielGap,
  orielLine,
  orielMark,
  orielsCsv,
  quietHour,
  readOriels,
  spanOf,
  suggestBay,
  trialOf,
  trialsCsv,
  visibleOriels,
  visibleTrialCustomers,
  watchOf,
  widthOf,
} from "../src/lib/crmv4/round168";

function main() {
  assert.equal(orielLine("  Sit\nAda  "), "Sit Ada");
  assert.equal(orielLine("   "), "");
  assert.equal(orielLine("x".repeat(80)).length, 40);
  assert.equal(orielMark("  KYC  "), "KYC");
  assert.equal(orielMark("   "), "");
  assert.equal(orielMark("z".repeat(20)).length, 3);

  assert.equal(hourOf("08"), 8);
  assert.equal(hourOf("00"), 0);
  assert.equal(hourOf("8"), 8);
  assert.equal(hourOf(23), 23);
  assert.equal(hourOf("24"), null);
  assert.equal(hourOf(-1), null);
  assert.equal(hourOf(""), null);
  assert.equal(hourOf("3.0"), null);
  assert.equal(spanOf("01"), 1);
  assert.equal(spanOf(4), 4);
  assert.equal(spanOf("0"), null);
  assert.equal(spanOf("5"), null);
  assert.equal(watchOf(0), "dawn");
  assert.equal(watchOf(7), "dawn");
  assert.equal(watchOf(8), "noon");
  assert.equal(watchOf(15), "noon");
  assert.equal(watchOf(16), "eve");
  assert.equal(watchOf(23), "eve");
  assert.equal(watchOf(null), "blank");
  assert.equal(quietHour(0), true);
  assert.equal(quietHour(5), true);
  assert.equal(quietHour(6), false);
  assert.equal(quietHour(22), true);
  assert.equal(quietHour(23), true);
  assert.equal(quietHour(21), false);
  assert.equal(dayHour(6), true);
  assert.equal(dayHour(21), true);
  assert.equal(dayHour(22), false);
  assert.equal(orielGap(22, 1), 3);
  assert.equal(orielGap(1, 22), -3);
  assert.equal(orielGap(2, 2), 0);
  assert.equal(orielGap(10, 22), 12);
  assert.equal(orielGap(10, 23), -11);
  assert.equal(orielGap(null, 2), null);
  assert.equal(orielGap(2, ""), null);
  assert.equal(orielGap(2, 24), null);

  const saved = addOriel([], { id: "a", title: "Sit Ada", note: "passport scan", host: "Nia", hour: "08", bay: "garden", mark: "A1", tempo: "hush", span: "01" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].hour, 8);
  assert.equal(saved[0].span, 1);
  assert.equal(saved[0].note, "passport scan");
  assert.equal(saved[0].audit, "save");
  assert.equal(addOriel(saved, { id: "b", title: "Sit Ada" }).length, 1);
  assert.equal(addOriel(saved, { id: "a", title: "Other" }).length, 1);
  assert.equal(addOriel(saved, { id: "c", title: "   " }).length, 1);
  const capped = Array.from({ length: 12 }, (_, index) => ({ id: `n${index}`, title: `Line ${index}` })).reduce((cards, card) => addOriel(cards, card), [] as ReturnType<typeof addOriel>);
  assert.equal(capped.length, 10);

  const cycled = cycleOrielTempo(saved, "a");
  assert.equal(cycled[0].tempo, "even");
  assert.equal(cycled[0].audit, "tempo");
  assert.equal(cycleOrielTempo(cycled, "a")[0].tempo, "brisk");
  assert.equal(cycleOrielTempo(cycleOrielTempo(cycled, "a"), "a")[0].tempo, "hush");
  const blankTempo = addOriel([], { id: "z", title: "Blank tempo" });
  assert.equal(cycleOrielTempo(blankTempo, "z")[0].tempo, "hush");

  const edited = editOriel(saved, "a", "Sit Bea");
  assert.equal(edited[0].title, "Sit Bea");
  assert.equal(edited[0].audit, "edit");
  assert.equal(editOriel(edited, "a", "  ")[0].title, "Sit Bea");
  const noted = editOrielNote(edited, "a", "second look");
  assert.equal(noted[0].note, "second look");
  assert.equal(editOrielNote(noted, "a", "  ")[0].note, "second look");
  const pair = addOriel(noted, { id: "b", title: "Keep" });
  assert.equal(editOriel(pair, "a", "Keep").find((card) => card.id === "a")?.title, "Sit Bea");

  const moved = bulkOrielBay(pair, ["a"], "gallery");
  assert.equal(moved.find((card) => card.id === "a")?.bay, "gallery");
  assert.equal(moved.find((card) => card.id === "a")?.audit, "bay");
  assert.equal(bulkOrielBay(moved, ["a"], "gallery").find((card) => card.id === "a")?.audit, "bay");
  assert.equal(bulkOrielBay(moved, ["a"], "attic").find((card) => card.id === "a")?.bay, "gallery");

  const mixed = [
    ...addOriel([], { id: "live", title: "Live", note: "passport scan", host: "Nia", hour: 2, bay: "garden", mark: "A1", tempo: "hush", span: 1 }),
  ];
  assert.equal(visibleOriels(mixed, "open", "passport", null, null, null, null, null, null, null, false, false).length, 1);
  assert.equal(visibleOriels(mixed, "open", "nia", null, null, null, null, null, null, null, false, false).length, 0);
  const held = mixed.map((card) => (card.id === "live" ? { ...card, held: true } : card));
  const filed = mixed.map((card) => ({ ...card, done: true, held: true }));
  assert.equal(visibleOriels(mixed, "open", "", null, null, null, null, null, null, null, false, false).length, 1);
  assert.equal(visibleOriels(held, "held", "", null, null, null, null, null, null, null, false, false).length, 1);
  assert.equal(visibleOriels(held, "open", "", null, null, null, null, null, null, null, false, false).length, 0);
  assert.equal(visibleOriels(filed, "done", "", null, null, null, null, null, null, null, false, false).length, 1);
  assert.equal(visibleOriels(filed, "held", "", null, null, null, null, null, null, null, false, false).length, 0);
  assert.equal(suggestBay([]), "garden");
  assert.equal(suggestBay(mixed), "gallery");
  assert.equal(nextOriel(mixed, 2), "live");
  assert.equal(nextOriel(mixed.map((card) => ({ ...card, tempo: "brisk" })), 2), "");
  assert.equal(nextOriel(mixed, 9), "live");
  const csv = orielsCsv(mixed, 8);
  assert.equal(csv.startsWith("title,host,hour,bay,mark,tempo,span,watch,pinned,held,done,gap,note,audit"), true);
  assert.equal(csv.includes("amount"), false);
  assert.equal(readOriels(mixed)[0].hour, 2);
  const views = addOrielView([], { id: "v", name: "Dawn", tray: "open", query: "ada", host: "all", bay: "garden", mark: "all", tempo: "all", hour: "dawn", span: "1" });
  assert.equal(views.length, 1);
  assert.equal(views[0].hour, "dawn");
  assert.equal(views[0].span, "1");
  assert.equal(activeHour("24"), "all");
  assert.equal(activeHour("08"), "8");

  assert.equal(trialOf(true), "trial");
  assert.equal(trialOf(false), "live");
  assert.equal(trialOf("yes"), "trial");
  assert.equal(trialOf("no"), "live");
  assert.equal(trialOf("trial"), "trial");
  assert.equal(trialOf("live"), "live");
  assert.equal(trialOf(null), "");
  assert.equal(trialOf({ isTest: true }), "trial");
  assert.equal(trialOf({ loginEnabled: true, isTest: true }), "");
  assert.equal(trialOf({ tradingEnabled: false }), "");
  assert.equal(caseOf("TR"), "upper");
  assert.equal(caseOf("tr"), "lower");
  assert.equal(caseOf("Turkey"), "mixed");
  assert.equal(caseOf("  "), "");
  assert.equal(widthOf("TR"), "code");
  assert.equal(widthOf("U K"), "code");
  assert.equal(widthOf("Turkey"), "name");
  assert.equal(widthOf("T"), "");
  assert.equal(widthOf("TR-1"), "");
  const rows = [
    { trial: true, country: "TR", label: "Ada" },
    { trial: true, country: "DE", label: "Ann" },
    { trial: false, country: "Turkey", label: "Beatrice" },
    { trial: null, country: "united kingdom", label: "Annabelle Marie" },
  ];
  assert.equal(leadingTrial(rows), "trial");
  assert.equal(leadingTrial([{ trial: true }, { trial: false }]), "trial");
  assert.equal(leadingCase([{ country: "TR" }, { country: "DE" }]), "upper");
  assert.equal(leadingCase(rows), "upper");
  assert.equal(visibleTrialCustomers(rows, "live", null, null, "").length, 1);
  assert.equal(visibleTrialCustomers(rows, null, "mixed", "name", "").length, 1);
  assert.equal(visibleTrialCustomers(rows, null, null, null, "bea").length, 1);
  assert.equal(visibleTrialCustomers(rows, null, null, null, "555").length, 0);
  const names = trialsCsv(rows);
  assert.equal(names.startsWith("kind,trial,count"), true);
  assert.equal(trialsCsv([]), "kind,trial,count");
  assert.equal(names.includes("amount"), false);
  assert.equal(names.includes(",trial,"), true);
  assert.equal(activeTrial("gone", ["trial"]), "all");

  const copy = Object.keys(ROUND168_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND168_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "orlTitle"), "Oriel hours");
  assert.equal(crmv4Text("tr", "trlTitle"), ROUND168_COPY.tr.trlTitle);
  assert.equal(crmv4Text("de", "orlHost"), ROUND168_COPY.de.orlHost);
  assert.equal(crmv4Text("ru", "trlUnmarked"), ROUND168_COPY.ru.trlUnmarked);
  assert.equal(crmv4Text("ar", "orlNotice"), ROUND168_COPY.ar.orlNotice);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-orl/);
  assert.match(css, /\.c4-trl/);
  assert.match(css, /\.c4-cust-oriel/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /#d4bc86/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round168.tsx"), "utf8");
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
  assert.match(viewFile, /isTest/);
  assert.match(viewFile, /orielsCsv/);
  assert.match(viewFile, /trialsCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "o"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(viewFile, /data-oriels/);
  assert.match(viewFile, /data-trials/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /customers/);
  assert.match(viewFile, /suggestBay/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "oriel"/);
  assert.match(app, /view === "trial"/);
  const customers = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/views/Customers.tsx"), "utf8");
  assert.match(customers, /c4-cust-oriel/);
  console.log("crmv4 round168 tests passed");
}

main();
