/**
 * Oriel sills and log hours.
 * Run: TZ=UTC npx tsx tests/crmv4-round223.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND223_COPY } from "../src/lib/crmv4/copy-round223";
import {
  activeChime,
  activeLight,
  activeMood,
  addSill,
  addSillTag,
  addSillView,
  catalogHour,
  catalogHourCount,
  chimeOf,
  cycleMood,
  densityOf,
  fairSteward,
  glazeOf,
  hourLane,
  hourRowsCsv,
  hourState,
  hourStep,
  hourTone,
  hoursCsv,
  houseGlaze,
  lateSill,
  leadingHour,
  lightGap,
  markOf,
  moveFocus,
  peakLight,
  quietLight,
  rankOf,
  readSillViews,
  setSillRank,
  sharedMarkCount,
  snoozeSill,
  suggestChime,
  suggestGlaze,
  wideHour,
  lightOf,
  sillsCsv,
} from "../src/lib/crmv4/round223";

function main() {
  assert.equal(glazeOf("  ivory "), "IVORY");
  assert.equal(glazeOf("ink"), "INK");
  assert.equal(glazeOf("gilt"), "GILT");
  assert.equal(glazeOf("   "), "");
  assert.equal(glazeOf("linen"), "");
  assert.equal(lightOf("1"), 1);
  assert.equal(lightOf(5), 5);
  assert.equal(lightOf("5"), 5);
  assert.equal(lightOf("0"), null);
  assert.equal(lightOf(0), null);
  assert.equal(lightOf("6"), null);
  assert.equal(lightOf("05"), null);
  assert.equal(lightOf(""), null);
  assert.equal(lightOf(1.5), null);
  assert.equal(chimeOf("12"), 12);
  assert.equal(chimeOf(24), 24);
  assert.equal(chimeOf("48"), 48);
  assert.equal(chimeOf("20"), null);
  assert.equal(chimeOf("012"), null);
  assert.equal(rankOf("1"), 1);
  assert.equal(rankOf(3), 3);
  assert.equal(rankOf("9"), 9);
  assert.equal(rankOf("2"), null);
  assert.equal(rankOf("0"), null);
  assert.equal(peakLight(2), true);
  assert.equal(peakLight(4), true);
  assert.equal(peakLight(3), false);
  assert.equal(quietLight(5), true);
  assert.equal(quietLight(2), false);
  assert.equal(lightGap(1, 4), 3);
  assert.equal(lightGap(5, 1), -4);
  assert.equal(lightGap(null, 3), null);
  assert.equal(lightGap(1, 0), null);
  assert.equal(houseGlaze("ivory"), true);
  assert.equal(houseGlaze("GILT"), true);
  assert.equal(houseGlaze("ink"), false);
  assert.equal(activeLight("peak"), "peak");
  assert.equal(activeLight("5"), "5");
  assert.equal(activeLight("9"), "all");
  assert.equal(activeChime("24"), "24");
  assert.equal(activeChime("20"), "all");
  assert.equal(activeMood("dusk", ["still", "warm", "dusk"]), "dusk");
  assert.equal(activeMood("flare", ["still", "warm", "dusk"]), "all");
  assert.equal(densityOf("tight"), "tight");
  assert.equal(densityOf("roomy"), "airy");
  assert.equal(moveFocus(0, 3, 1), 1);
  assert.equal(moveFocus(0, 3, -1), 2);
  assert.equal(suggestGlaze([]), "INK");
  assert.equal(suggestChime([]), 24);

  const first = addSill([], {
    id: "a",
    title: "  North oriel ",
    note: "quiet",
    steward: "Ada",
    light: "1",
    glaze: "ivory",
    mood: "still",
    chime: "12",
    tags: "d e f g z",
    rank: "3",
  });
  assert.equal(first.length, 1);
  assert.equal(first[0].title, "North oriel");
  assert.equal(first[0].glaze, "IVORY");
  assert.equal(first[0].light, 1);
  assert.equal(first[0].chime, 12);
  assert.deepEqual(first[0].tags, ["d", "e", "f"]);
  assert.equal(first[0].rank, 3);
  assert.equal(first[0].audit, "save");
  assert.equal(addSill(first, { id: "b", title: "   " }).length, 1);
  assert.equal(addSill(first, { id: "a", title: "Other" }).length, 1);
  const raised = setSillRank(first, "a", "9");
  assert.equal(raised[0].rank, 9);
  assert.equal(raised[0].audit, "rank");
  const snoozed = snoozeSill(first, "a");
  assert.equal(snoozed[0].chime, 24);
  const warmed = cycleMood(first, "a");
  assert.equal(warmed[0].mood, "warm");
  const tagged = addSillTag(first, "a", "d");
  assert.deepEqual(tagged[0].tags, ["d", "e", "f"]);
  const views = addSillView([], {
    id: "v",
    name: "Peak",
    tray: "open",
    query: "",
    steward: "all",
    glaze: "all",
    mood: "all",
    light: "peak",
    chime: "all",
    rank: "all",
  });
  assert.equal(readSillViews(views).length, 1);
  const late = addSill(first, { id: "b", title: "Late light", light: "1", rank: "1" });
  assert.equal(lateSill(late[0], 5), true);
  assert.equal(lateSill(late.find((sill) => sill.id === "b")!, 3), false);

  assert.equal(hourState("hello"), "set");
  assert.equal(hourState({ title: "  " }), "clear");
  assert.equal(hourState({ type: "NOTE", title: "A", createdAt: "2026-01-01T06:00:00.000Z", profit: 1 }), "");
  assert.equal(markOf({ type: "NOTE", title: "Morning note", createdAt: "2026-01-01T06:00:00.000Z" }), "MORN");
  assert.equal(hourLane({ type: "NOTE", title: "Morning note", createdAt: "2026-01-01T06:00:00.000Z" }), "folio");
  assert.equal(hourLane({ type: "CALL", title: "Desk call", createdAt: "2026-01-01T14:00:00.000Z" }), "bell");
  assert.equal(hourLane({ type: "CHAT", title: "Night chat", createdAt: "2026-01-01T21:00:00.000Z" }), "thread");
  assert.equal(hourLane("Hello?"), "thread");
  assert.equal(hourLane("Hello!"), "bell");
  assert.equal(hourLane("Hello"), "folio");
  assert.equal(hourTone({ type: "NOTE", title: "Morning note", createdAt: "2026-01-01T06:00:00.000Z" }), "dawn");
  assert.equal(hourTone({ type: "CALL", title: "Desk call", createdAt: "2026-01-01T14:00:00.000Z" }), "day");
  assert.equal(hourTone({ type: "CHAT", title: "Night chat", createdAt: "2026-01-01T21:00:00.000Z" }), "night");
  assert.equal(hourTone({ type: "NOTE", title: "Hello" }), "hush");
  assert.equal(hourTone({ type: "ODD", title: "Hello" }), "mist");
  assert.equal(catalogHour({ type: "NOTE", title: "A", createdAt: "2026-01-01T06:00:00.000Z" }), true);
  assert.equal(catalogHour({ type: "CHAT", title: "A", createdAt: "2026-01-01T21:00:00.000Z" }), false);
  assert.equal(wideHour("Short title"), false);
  assert.equal(wideHour("A very long desk title"), true);
  assert.equal(hourStep(""), 0);
  assert.equal(hourStep("ABC"), 1);
  assert.equal(hourStep("Desk call"), 2);
  assert.equal(hourStep("A very long desk title"), 3);
  const book = [
    { id: "1", label: "Morning note", note: { type: "NOTE", title: "Morning note", createdAt: "2026-01-01T06:00:00.000Z" } },
    { id: "2", label: "Morning extra", note: { type: "CALL", title: "Morning extra", createdAt: "2026-01-01T14:00:00.000Z" } },
    { id: "3", label: "Night chat", note: { type: "CHAT", title: "Night chat", createdAt: "2026-01-01T21:00:00.000Z" } },
  ];
  assert.equal(leadingHour(book), "bell");
  assert.equal(sharedMarkCount(book), 2);
  assert.equal(catalogHourCount(book), 2);
  assert.match(hoursCsv(book), /folio,1/);
  assert.match(hourRowsCsv(book, ["2"]), /Morning extra,MORN,bell,day,2,1,0,0,0,1/);
  assert.match(sillsCsv(first, 3), /North oriel,Ada,1,IVORY,still,12,3,d e f,0,0,0,2,0,0,1,0,0,quiet,save/);

  const keys = Object.keys(ROUND223_COPY.en);
  assert.ok(keys.length >= 120);
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND223_COPY[locale]).sort(), keys.slice().sort());
    for (const key of keys) {
      assert.equal(typeof ROUND223_COPY[locale][key as keyof typeof ROUND223_COPY.en], "string");
      assert.ok(ROUND223_COPY[locale][key as keyof typeof ROUND223_COPY.en].length > 0);
    }
  }
  assert.equal(crmv4Text("tr", "orsTitle"), ROUND223_COPY.tr.orsTitle);
  assert.equal(crmv4Text("de", "lghTitle"), ROUND223_COPY.de.lghTitle);
  assert.equal(crmv4Text("ru", "orsSub"), ROUND223_COPY.ru.orsSub);
  assert.equal(crmv4Text("ar", "lghSub"), ROUND223_COPY.ar.lghSub);
  assert.equal(crmv4Text("en", "orsLogo"), "7FX");
  assert.equal(fairSteward([], "Ada, Bea"), "Ada");

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-ors/);
  assert.match(css, /\.c4-lgh-index/);
  assert.match(css, /\.c4-exec-oriel/);
  assert.match(css, /\.c4-exec-oriel-time/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round223.tsx"), "utf8");
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
  assert.match(viewFile, /sillsCsv/);
  assert.match(viewFile, /hoursCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "n"/);
  assert.match(viewFile, /event\.key === "j"/);
  assert.match(viewFile, /event\.key === "p"/);
  assert.match(viewFile, /event\.key === "g"/);
  assert.match(viewFile, /event\.key === "r"/);
  assert.match(viewFile, /event\.key === "y"/);
  assert.match(viewFile, /event\.key === "h"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/communications\?take=40/);
  assert.match(viewFile, /data-sills/);
  assert.match(viewFile, /data-hours/);
  assert.match(viewFile, /data-catalog/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /logs/);
  assert.match(viewFile, /suggestGlaze/);
  assert.match(viewFile, /c4-lgh-time/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "orsl"/);
  assert.match(app, /view === "lghr"/);
  assert.match(app, /OrielSills/);
  assert.match(app, /LogHours/);
  const overview = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/views/Overview.tsx"), "utf8");
  assert.match(overview, /c4-exec-oriel/);
  assert.match(overview, /c4-exec-oriel-index/);
  assert.match(overview, /data-logo="mono"/);
  assert.match(overview, /data-desk="oriel"/);
  assert.match(overview, /c4-exec-salon/);
  const used = new Set(viewFile.match(/v4\("([a-zA-Z0-9]+)"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of Array.from(used)) assert.ok(key in ROUND223_COPY.en, key);
  console.log("crmv4 round223 tests passed");
}

main();
