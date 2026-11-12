/**
 * Dentil tiles and voussoir marks.
 * Run: TZ=UTC npx tsx tests/crmv4-round225.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND225_COPY } from "../src/lib/crmv4/copy-round225";
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
} from "../src/lib/crmv4/round225";

function main() {
  assert.equal(pigmentOf("  slate "), "SLATE");
  assert.equal(pigmentOf("ivory"), "IVORY");
  assert.equal(pigmentOf("honey"), "HONEY");
  assert.equal(pigmentOf("   "), "");
  assert.equal(pigmentOf("graphite"), "");
  assert.equal(spanOf("1"), 1);
  assert.equal(spanOf(5), 5);
  assert.equal(spanOf("5"), 5);
  assert.equal(spanOf("0"), null);
  assert.equal(spanOf(0), null);
  assert.equal(spanOf("6"), null);
  assert.equal(spanOf("05"), null);
  assert.equal(spanOf(""), null);
  assert.equal(spanOf(1.5), null);
  assert.equal(bellOf("4"), 4);
  assert.equal(bellOf(12), 12);
  assert.equal(bellOf("24"), 24);
  assert.equal(bellOf("6"), null);
  assert.equal(bellOf("04"), null);
  assert.equal(weightOf("1"), 1);
  assert.equal(weightOf(3), 3);
  assert.equal(weightOf("5"), 5);
  assert.equal(weightOf("2"), null);
  assert.equal(weightOf("0"), null);
  assert.equal(peakSpan(2), true);
  assert.equal(peakSpan(4), true);
  assert.equal(peakSpan(3), false);
  assert.equal(quietSpan(5), true);
  assert.equal(quietSpan(2), false);
  assert.equal(spanGap(1, 4), 3);
  assert.equal(spanGap(5, 1), -4);
  assert.equal(spanGap(null, 3), null);
  assert.equal(spanGap(1, 0), null);
  assert.equal(housePigment("slate"), true);
  assert.equal(housePigment("HONEY"), true);
  assert.equal(housePigment("ivory"), false);
  assert.equal(activeSpan("peak"), "peak");
  assert.equal(activeSpan("5"), "5");
  assert.equal(activeSpan("9"), "all");
  assert.equal(activeBell("12"), "12");
  assert.equal(activeBell("6"), "all");
  assert.equal(activeCadence("rush", ["still", "walk", "rush"]), "rush");
  assert.equal(activeCadence("surge", ["still", "walk", "rush"]), "all");
  assert.equal(densityOf("tight"), "tight");
  assert.equal(densityOf("roomy"), "airy");
  assert.equal(moveFocus(0, 3, 1), 1);
  assert.equal(moveFocus(0, 3, -1), 2);
  assert.equal(suggestPigment([]), "SLATE");
  assert.equal(suggestBell([]), 12);
  assert.equal(fairKeeper([], "Ada, Bea"), "Ada");

  const first = addCard([], {
    id: "a",
    title: "  North dentil ",
    note: "quiet",
    keeper: "Ada",
    span: "1",
    pigment: "slate",
    cadence: "still",
    bell: "4",
    tags: "x y z q",
    weight: "3",
  });
  assert.equal(first.length, 1);
  assert.equal(first[0].title, "North dentil");
  assert.equal(first[0].pigment, "SLATE");
  assert.equal(first[0].span, 1);
  assert.equal(first[0].bell, 4);
  assert.deepEqual(first[0].tags, ["x", "y"]);
  assert.equal(first[0].weight, 3);
  assert.equal(first[0].proof, false);
  assert.equal(first[0].audit, "save");
  assert.equal(addCard(first, { id: "b", title: "   " }).length, 1);
  assert.equal(addCard(first, { id: "a", title: "Other" }).length, 1);
  const raised = setCardWeight(first, "a", "5");
  assert.equal(raised[0].weight, 5);
  assert.equal(raised[0].audit, "weight");
  const proved = setCardProof(first, "a", true);
  assert.equal(proved[0].proof, true);
  assert.equal(proved[0].audit, "proof");
  const snoozed = snoozeCard(first, "a");
  assert.equal(snoozed[0].bell, 12);
  const walked = cycleCadence(first, "a");
  assert.equal(walked[0].cadence, "walk");
  const tagged = addCardTag(first, "a", "x");
  assert.deepEqual(tagged[0].tags, ["x", "y"]);
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
  const late = addCard([{ ...first[0], weight: 1 }], { id: "b", title: "Late bay", span: "1", weight: "1" });
  assert.equal(lateCard(late.find((card) => card.id === "a")!, 5), true);
  assert.equal(lateCard(late.find((card) => card.id === "b")!, 3), false);
  const cooling = addCard([], { id: "c", title: "Cooling tile", span: "1", cadence: "rush", weight: "1" });
  assert.equal(coolingCard(cooling[0]), true);
  assert.equal(coolingCard({ ...cooling[0], cadence: "still" }), false);
  assert.equal(coolingCard({ ...cooling[0], span: 2 }), false);

  assert.equal(quoinState("hello"), "set");
  assert.equal(quoinState({ title: "  " }), "clear");
  assert.equal(quoinState({ type: "NOTE", title: "A", createdAt: "2026-01-05T06:00:00.000Z", profit: 1 }), "");
  assert.equal(markOf({ type: "NOTE", title: "Morning note", createdAt: "2026-01-05T06:00:00.000Z" }), "MOR");
  assert.equal(quoinLane({ type: "NOTE", title: "Morning note", createdAt: "2026-01-05T06:00:00.000Z" }), "springer");
  assert.equal(quoinLane({ type: "CALL", title: "Desk call", createdAt: "2026-01-07T14:00:00.000Z" }), "crown");
  assert.equal(quoinLane({ type: "CHAT", title: "Night chat", createdAt: "2026-01-09T21:00:00.000Z" }), "haunch");
  assert.equal(quoinLane("Room 4?"), "crown");
  assert.equal(quoinLane("Hello!"), "springer");
  assert.equal(quoinLane("Hello:there"), "haunch");
  assert.equal(quoinLane("Room 4"), "springer");
  assert.equal(quoinTone({ type: "NOTE", title: "Morning note", createdAt: "2026-01-05T06:00:00.000Z" }), "dawn");
  assert.equal(quoinTone({ type: "CALL", title: "Desk call", createdAt: "2026-01-07T14:00:00.000Z" }), "noon");
  assert.equal(quoinTone({ type: "CHAT", title: "Night chat", createdAt: "2026-01-09T21:00:00.000Z" }), "dusk");
  assert.equal(quoinTone({ type: "NOTE", title: "Hello" }), "hush");
  assert.equal(quoinTone({ type: "ODD", title: "Hello" }), "mist");
  assert.equal(coursedQuoin({ type: "NOTE", title: "A", createdAt: "2026-01-05T06:00:00.000Z" }), true);
  assert.equal(coursedQuoin({ type: "CALL", title: "A", createdAt: "2026-01-07T14:00:00.000Z" }), false);
  assert.equal(coursedQuoin({ type: "CHAT", title: "A", createdAt: "2026-01-09T21:00:00.000Z" }), true);
  assert.equal(wideQuoin("Brief"), false);
  assert.equal(wideQuoin("A very long desk title"), true);
  assert.equal(quoinStep(""), 0);
  assert.equal(quoinStep("ABC"), 1);
  assert.equal(quoinStep("Desk call"), 2);
  assert.equal(quoinStep("One two three"), 2);
  assert.equal(quoinStep("A very long desk title"), 3);
  const book = [
    { id: "1", label: "Morning note", note: { type: "NOTE", title: "Morning note", createdAt: "2026-01-05T06:00:00.000Z" } },
    { id: "2", label: "Morning extra", note: { type: "CALL", title: "Morning extra", createdAt: "2026-01-07T14:00:00.000Z" } },
    { id: "3", label: "Night chat", note: { type: "CHAT", title: "Night chat", createdAt: "2026-01-09T21:00:00.000Z" } },
  ];
  assert.equal(leadingQuoin(book), "springer");
  assert.equal(sharedMarkCount(book), 2);
  const paired = [
    book[0],
    { id: "4", label: "Evening note", note: { type: "NOTE", title: "Evening note", createdAt: "2026-01-06T08:00:00.000Z" } },
  ];
  assert.equal(sharedMarkCount(paired), 0);
  assert.match(quoinsCsv(book), /crown,1/);
  assert.match(quoinRowsCsv(book, ["2"]), /Morning extra,MOR,crown,noon,2,0,1,0,0,1/);
  assert.match(cardsCsv(first, 5), /North dentil,Ada,1,SLATE,still,4,3,x y,0,0,0,0,4,0,0,1,0,0,0,quiet,save/);

  const keys = Object.keys(ROUND225_COPY.en);
  assert.ok(keys.length >= 120);
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND225_COPY[locale]).sort(), keys.slice().sort());
    for (const key of keys) {
      assert.equal(typeof ROUND225_COPY[locale][key as keyof typeof ROUND225_COPY.en], "string");
      assert.ok(ROUND225_COPY[locale][key as keyof typeof ROUND225_COPY.en].length > 0);
    }
  }
  assert.equal(crmv4Text("tr", "dntTitle"), ROUND225_COPY.tr.dntTitle);
  assert.equal(crmv4Text("de", "vousTitle"), ROUND225_COPY.de.vousTitle);
  assert.equal(crmv4Text("ru", "dntSub"), ROUND225_COPY.ru.dntSub);
  assert.equal(crmv4Text("ar", "vousSub"), ROUND225_COPY.ar.vousSub);
  assert.equal(crmv4Text("en", "dntLogo"), "7FX");

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-dnt/);
  assert.match(css, /\.c4-vous-index/);
  assert.match(css, /\.c4-fin-strongroom/);
  assert.match(css, /\.c4-fin-strongroom-index/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round225.tsx"), "utf8");
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
  assert.match(viewFile, /event\.key === "t"/);
  assert.match(viewFile, /event\.key === "j"/);
  assert.match(viewFile, /event\.key === "f"/);
  assert.match(viewFile, /event\.key === "w"/);
  assert.match(viewFile, /event\.key === "m"/);
  assert.match(viewFile, /event\.key === "u"/);
  assert.match(viewFile, /event\.key === "s"/);
  assert.match(viewFile, /event\.key === "g"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/communications\?take=40/);
  assert.match(viewFile, /data-tiles/);
  assert.match(viewFile, /data-voussoirs/);
  assert.match(viewFile, /data-keyed/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /logs/);
  assert.match(viewFile, /suggestPigment/);
  assert.match(viewFile, /c4-vous-time/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "dntl"/);
  assert.match(app, /view === "vous"/);
  assert.match(app, /DentilTiles/);
  assert.match(app, /VoussoirMarks/);
  const finance = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/views/Finance.tsx"), "utf8");
  assert.match(finance, /c4-fin-strongroom/);
  assert.match(finance, /c4-fin-strongroom-index/);
  assert.match(finance, /data-logo="mono"/);
  assert.match(finance, /data-desk="strongroom"/);
  assert.match(finance, /c4-fin-nave/);
  assert.match(finance, /aria-required=\{false\}/);
  const used = new Set(viewFile.match(/v4\("([a-zA-Z0-9]+)"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of Array.from(used)) assert.ok(key in ROUND225_COPY.en, key);
  const audit = viewFile.match(/"(dntAudit[a-zA-Z]+)"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of audit) assert.ok(key in ROUND225_COPY.en, key);
  console.log("crmv4 round225 tests passed");
}

main();
