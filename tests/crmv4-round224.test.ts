/**
 * Frieze cards and quoin marks.
 * Run: TZ=UTC npx tsx tests/crmv4-round224.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND224_COPY } from "../src/lib/crmv4/copy-round224";
import {
  activeBell,
  activeCadence,
  activeSpan,
  addCard,
  addCardTag,
  addCardView,
  bellOf,
  coolingCard,
  coursedQuoin,
  cycleCadence,
  densityOf,
  fairKeeper,
  housePigment,
  leadingQuoin,
  markOf,
  moveFocus,
  peakSpan,
  pigmentOf,
  quoinLane,
  quoinRowsCsv,
  quoinState,
  quoinStep,
  quoinTone,
  quoinsCsv,
  quietSpan,
  readCardViews,
  setCardProof,
  setCardWeight,
  sharedMarkCount,
  snoozeCard,
  spanGap,
  spanOf,
  suggestBell,
  suggestPigment,
  weightOf,
  wideQuoin,
  cardsCsv,
  lateCard,
} from "../src/lib/crmv4/round224";

function main() {
  assert.equal(pigmentOf("  graphite "), "GRAPHITE");
  assert.equal(pigmentOf("ivory"), "IVORY");
  assert.equal(pigmentOf("champagne"), "CHAMPAGNE");
  assert.equal(pigmentOf("   "), "");
  assert.equal(pigmentOf("gilt"), "");
  assert.equal(spanOf("1"), 1);
  assert.equal(spanOf(7), 7);
  assert.equal(spanOf("7"), 7);
  assert.equal(spanOf("0"), null);
  assert.equal(spanOf(0), null);
  assert.equal(spanOf("8"), null);
  assert.equal(spanOf("07"), null);
  assert.equal(spanOf(""), null);
  assert.equal(spanOf(1.5), null);
  assert.equal(bellOf("6"), 6);
  assert.equal(bellOf(18), 18);
  assert.equal(bellOf("36"), 36);
  assert.equal(bellOf("12"), null);
  assert.equal(bellOf("06"), null);
  assert.equal(weightOf("2"), 2);
  assert.equal(weightOf(4), 4);
  assert.equal(weightOf("8"), 8);
  assert.equal(weightOf("1"), null);
  assert.equal(weightOf("0"), null);
  assert.equal(peakSpan(3), true);
  assert.equal(peakSpan(6), true);
  assert.equal(peakSpan(4), false);
  assert.equal(quietSpan(7), true);
  assert.equal(quietSpan(3), false);
  assert.equal(spanGap(1, 5), 4);
  assert.equal(spanGap(7, 1), -6);
  assert.equal(spanGap(null, 3), null);
  assert.equal(spanGap(1, 0), null);
  assert.equal(housePigment("graphite"), true);
  assert.equal(housePigment("CHAMPAGNE"), true);
  assert.equal(housePigment("ivory"), false);
  assert.equal(activeSpan("peak"), "peak");
  assert.equal(activeSpan("7"), "7");
  assert.equal(activeSpan("9"), "all");
  assert.equal(activeBell("18"), "18");
  assert.equal(activeBell("12"), "all");
  assert.equal(activeCadence("surge", ["hush", "pulse", "surge"]), "surge");
  assert.equal(activeCadence("flare", ["hush", "pulse", "surge"]), "all");
  assert.equal(densityOf("tight"), "tight");
  assert.equal(densityOf("roomy"), "airy");
  assert.equal(moveFocus(0, 3, 1), 1);
  assert.equal(moveFocus(0, 3, -1), 2);
  assert.equal(suggestPigment([]), "CHAMPAGNE");
  assert.equal(suggestBell([]), 18);
  assert.equal(fairKeeper([], "Ada, Bea"), "Bea");

  const first = addCard([], {
    id: "a",
    title: "  North frieze ",
    note: "quiet",
    keeper: "Ada",
    span: "1",
    pigment: "graphite",
    cadence: "hush",
    bell: "6",
    tags: "a b c d z",
    weight: "4",
  });
  assert.equal(first.length, 1);
  assert.equal(first[0].title, "North frieze");
  assert.equal(first[0].pigment, "GRAPHITE");
  assert.equal(first[0].span, 1);
  assert.equal(first[0].bell, 6);
  assert.deepEqual(first[0].tags, ["a", "b", "c"]);
  assert.equal(first[0].weight, 4);
  assert.equal(first[0].proof, false);
  assert.equal(first[0].audit, "save");
  assert.equal(addCard(first, { id: "b", title: "   " }).length, 1);
  assert.equal(addCard(first, { id: "a", title: "Other" }).length, 1);
  const raised = setCardWeight(first, "a", "8");
  assert.equal(raised[0].weight, 8);
  assert.equal(raised[0].audit, "weight");
  const proved = setCardProof(first, "a", true);
  assert.equal(proved[0].proof, true);
  assert.equal(proved[0].audit, "proof");
  const snoozed = snoozeCard(first, "a");
  assert.equal(snoozed[0].bell, 18);
  const surged = cycleCadence(first, "a");
  assert.equal(surged[0].cadence, "pulse");
  const tagged = addCardTag(first, "a", "a");
  assert.deepEqual(tagged[0].tags, ["a", "b", "c"]);
  const views = addCardView([], {
    id: "v",
    name: "Peak",
    tray: "open",
    query: "",
    keeper: "all",
    pigment: "all",
    cadence: "all",
    span: "peak",
    bell: "all",
    weight: "all",
  });
  assert.equal(readCardViews(views).length, 1);
  const late = addCard([{ ...first[0], weight: 2 }], { id: "b", title: "Late span", span: "1", weight: "2" });
  assert.equal(lateCard(late.find((card) => card.id === "a")!, 5), true);
  assert.equal(lateCard(late.find((card) => card.id === "b")!, 3), false);
  const cooling = addCard([], { id: "c", title: "Cooling card", span: "2", cadence: "surge", weight: "2" });
  assert.equal(coolingCard(cooling[0]), true);
  assert.equal(coolingCard({ ...cooling[0], cadence: "hush" }), false);

  assert.equal(quoinState("hello"), "set");
  assert.equal(quoinState({ title: "  " }), "clear");
  assert.equal(quoinState({ type: "NOTE", title: "A", createdAt: "2026-01-05T06:00:00.000Z", profit: 1 }), "");
  assert.equal(markOf({ type: "NOTE", title: "Morning note", createdAt: "2026-01-05T06:00:00.000Z" }), "NOTE");
  assert.equal(quoinLane({ type: "NOTE", title: "Morning note", createdAt: "2026-01-05T06:00:00.000Z" }), "quoin");
  assert.equal(quoinLane({ type: "CALL", title: "Desk call", createdAt: "2026-01-07T14:00:00.000Z" }), "ashlar");
  assert.equal(quoinLane({ type: "CHAT", title: "Night chat", createdAt: "2026-01-09T21:00:00.000Z" }), "rubble");
  assert.equal(quoinLane("Room 4"), "quoin");
  assert.equal(quoinLane("Hello."), "ashlar");
  assert.equal(quoinLane("Hello;there"), "rubble");
  assert.equal(quoinTone({ type: "NOTE", title: "Morning note", createdAt: "2026-01-05T06:00:00.000Z" }), "stone");
  assert.equal(quoinTone({ type: "CALL", title: "Desk call", createdAt: "2026-01-07T14:00:00.000Z" }), "course");
  assert.equal(quoinTone({ type: "CHAT", title: "Night chat", createdAt: "2026-01-09T21:00:00.000Z" }), "settle");
  assert.equal(quoinTone({ type: "NOTE", title: "Hello" }), "hush");
  assert.equal(quoinTone({ type: "ODD", title: "Hello" }), "mist");
  assert.equal(coursedQuoin({ type: "NOTE", title: "A", createdAt: "2026-01-05T06:00:00.000Z" }), true);
  assert.equal(coursedQuoin({ type: "CHAT", title: "A", createdAt: "2026-01-09T21:00:00.000Z" }), false);
  assert.equal(wideQuoin("Short title"), false);
  assert.equal(wideQuoin("A very long desk title"), true);
  assert.equal(quoinStep(""), 0);
  assert.equal(quoinStep("ABC"), 1);
  assert.equal(quoinStep("Desk call"), 2);
  assert.equal(quoinStep("A very long desk title"), 3);
  const book = [
    { id: "1", label: "Morning note", note: { type: "NOTE", title: "Morning note", createdAt: "2026-01-05T06:00:00.000Z" } },
    { id: "2", label: "Morning extra", note: { type: "CALL", title: "Morning extra", createdAt: "2026-01-07T14:00:00.000Z" } },
    { id: "3", label: "Night chat", note: { type: "CHAT", title: "Night chat", createdAt: "2026-01-09T21:00:00.000Z" } },
  ];
  assert.equal(leadingQuoin(book), "rubble");
  assert.equal(sharedMarkCount(book), 0);
  const paired = [
    book[0],
    { id: "4", label: "Evening note", note: { type: "NOTE", title: "Evening note", createdAt: "2026-01-06T08:00:00.000Z" } },
  ];
  assert.equal(sharedMarkCount(paired), 2);
  assert.match(quoinsCsv(book), /quoin,1/);
  assert.match(quoinRowsCsv(book, ["2"]), /Morning extra,XTRA,ashlar,course,2,1,0,0,0,1/);
  assert.match(cardsCsv(first, 5), /North frieze,Ada,1,GRAPHITE,hush,6,4,a b c,0,0,0,0,4,0,0,1,0,0,0,quiet,save/);

  const keys = Object.keys(ROUND224_COPY.en);
  assert.ok(keys.length >= 120);
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND224_COPY[locale]).sort(), keys.slice().sort());
    for (const key of keys) {
      assert.equal(typeof ROUND224_COPY[locale][key as keyof typeof ROUND224_COPY.en], "string");
      assert.ok(ROUND224_COPY[locale][key as keyof typeof ROUND224_COPY.en].length > 0);
    }
  }
  assert.equal(crmv4Text("tr", "frzTitle"), ROUND224_COPY.tr.frzTitle);
  assert.equal(crmv4Text("de", "qmkTitle"), ROUND224_COPY.de.qmkTitle);
  assert.equal(crmv4Text("ru", "frzSub"), ROUND224_COPY.ru.frzSub);
  assert.equal(crmv4Text("ar", "qmkSub"), ROUND224_COPY.ar.qmkSub);
  assert.equal(crmv4Text("en", "frzLogo"), "7FX");

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-frz/);
  assert.match(css, /\.c4-qmk-index/);
  assert.match(css, /\.c4-control-portico/);
  assert.match(css, /\.c4-control-portico-index/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round224.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /type/);
  assert.match(viewFile, /title/);
  assert.match(viewFile, /createdAt/);
  assert.match(viewFile, /cardsCsv/);
  assert.match(viewFile, /quoinsCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "n"/);
  assert.match(viewFile, /event\.key === "j"/);
  assert.match(viewFile, /event\.key === "p"/);
  assert.match(viewFile, /event\.key === "b"/);
  assert.match(viewFile, /event\.key === "c"/);
  assert.match(viewFile, /event\.key === "h"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/communications\?take=40/);
  assert.match(viewFile, /data-cards/);
  assert.match(viewFile, /data-quoins/);
  assert.match(viewFile, /data-course/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /logs/);
  assert.match(viewFile, /suggestPigment/);
  assert.match(viewFile, /c4-qmk-time/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "frze"/);
  assert.match(app, /view === "qmks"/);
  assert.match(app, /FriezeCards/);
  assert.match(app, /QuoinMarks/);
  const control = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/views/Control.tsx"), "utf8");
  assert.match(control, /c4-control-portico/);
  assert.match(control, /c4-control-portico-index/);
  assert.match(control, /data-logo="mono"/);
  assert.match(control, /data-desk="portico"/);
  assert.match(control, /c4-control-atlas/);
  const used = new Set(viewFile.match(/v4\("([a-zA-Z0-9]+)"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of Array.from(used)) assert.ok(key in ROUND224_COPY.en, key);
  console.log("crmv4 round224 tests passed");
}

main();
