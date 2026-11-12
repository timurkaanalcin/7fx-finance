/**
 * Bell cords and dial seals.
 * Run: TZ=UTC npx tsx tests/crmv4-round217.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND217_COPY } from "../src/lib/crmv4/copy-round217";
import {
  activeHour,
  activePulls,
  activeStance,
  addCord,
  addCordTag,
  addCordView,
  adjacentCordCount,
  catalogSeal,
  catalogSealCount,
  cycleStance,
  densityOf,
  fairRinger,
  hourGap,
  hourOf,
  houseMetal,
  lateCord,
  leadingSeal,
  metalOf,
  moveFocus,
  peakHour,
  pitchOf,
  pullsOf,
  quietHour,
  readCordViews,
  sealLane,
  sealOf,
  sealRowsCsv,
  sealState,
  sealStep,
  sealTone,
  sealsCsv,
  setCordPitch,
  sharedSealCount,
  snoozeCord,
  suggestMetal,
  suggestPulls,
  wideSeal,
  windowCords,
  cordsCsv,
} from "../src/lib/crmv4/round217";

function main() {
  assert.equal(metalOf("  bronze "), "BRONZE");
  assert.equal(metalOf("brass"), "BRASS");
  assert.equal(metalOf("iron"), "IRON");
  assert.equal(metalOf("   "), "");
  assert.equal(metalOf("oak"), "");
  assert.equal(hourOf("1"), 1);
  assert.equal(hourOf(8), 8);
  assert.equal(hourOf("8"), 8);
  assert.equal(hourOf("0"), null);
  assert.equal(hourOf(0), null);
  assert.equal(hourOf("9"), null);
  assert.equal(hourOf("08"), null);
  assert.equal(hourOf(""), null);
  assert.equal(hourOf(1.5), null);
  assert.equal(pullsOf("2"), 2);
  assert.equal(pullsOf(4), 4);
  assert.equal(pullsOf("8"), 8);
  assert.equal(pullsOf("6"), null);
  assert.equal(pullsOf("08"), null);
  assert.equal(pitchOf("0"), 0);
  assert.equal(pitchOf(2), 2);
  assert.equal(pitchOf("4"), 4);
  assert.equal(pitchOf("1"), null);
  assert.equal(peakHour(3), true);
  assert.equal(peakHour(7), true);
  assert.equal(peakHour(4), false);
  assert.equal(quietHour(8), true);
  assert.equal(quietHour(1), false);
  assert.equal(hourGap(1, 8), 7);
  assert.equal(hourGap(8, 1), -7);
  assert.equal(hourGap(null, 3), null);
  assert.equal(hourGap(1, 0), null);
  assert.equal(houseMetal("bronze"), true);
  assert.equal(houseMetal("IRON"), true);
  assert.equal(houseMetal("brass"), false);
  assert.equal(activeHour("peak"), "peak");
  assert.equal(activeHour("8"), "8");
  assert.equal(activeHour("9"), "all");
  assert.equal(activePulls("4"), "4");
  assert.equal(activePulls("6"), "all");
  assert.equal(activeStance("mute", ["ring", "hush", "mute"]), "mute");
  assert.equal(activeStance("nope", ["ring", "hush", "mute"]), "all");
  assert.equal(densityOf("tight"), "tight");
  assert.equal(densityOf("nope"), "airy");
  assert.equal(moveFocus(0, 3, 1), 1);
  assert.equal(moveFocus(0, 3, -1), 2);
  assert.equal(suggestMetal([]), "BRONZE");
  assert.equal(suggestPulls([]), 4);

  const first = addCord([], {
    id: "a",
    title: "  North proof ",
    note: "quiet",
    ringer: "Ada",
    hour: "1",
    metal: "bronze",
    stance: "ring",
    pulls: "2",
    tags: "e f g h z",
    pitch: "2",
  });
  assert.equal(first.length, 1);
  assert.equal(first[0].title, "North proof");
  assert.equal(first[0].metal, "BRONZE");
  assert.equal(first[0].hour, 1);
  assert.equal(first[0].pulls, 2);
  assert.deepEqual(first[0].tags, ["e", "f"]);
  assert.equal(first[0].pitch, 2);
  assert.equal(first[0].audit, "save");
  assert.equal(addCord(first, { id: "a", title: "Other" }).length, 1);
  assert.equal(addCord(first, { id: "b", title: "North proof" }).length, 1);
  assert.equal(addCord(first, { id: "c", title: "   " }).length, 1);
  const rung = cycleStance([{ ...first[0], stance: "" }], "a");
  assert.equal(rung[0].stance, "ring");
  assert.equal(cycleStance(rung, "a")[0].stance, "hush");
  assert.equal(cycleStance(cycleStance(rung, "a"), "a")[0].stance, "mute");
  assert.equal(cycleStance(cycleStance(cycleStance(rung, "a"), "a"), "a")[0].stance, "ring");
  assert.equal(addCordTag(first, "a", "g").length, 1);
  assert.equal(addCordTag(first, "a", "g")[0].tags.length, 2);
  assert.equal(addCordTag(first, "a", "e")[0].tags.length, 2);
  assert.equal(addCordTag(first, "a", "a")[0].tags.length, 2);
  assert.equal(setCordPitch(first, "a", 0)[0].pitch, 0);
  assert.equal(setCordPitch(first, "a", 1)[0].pitch, 2);
  const snoozed = snoozeCord([{ ...first[0], pulls: null }], "a");
  assert.equal(snoozed[0].pulls, 2);
  assert.equal(snoozeCord(snoozed, "a")[0].pulls, 4);
  assert.equal(snoozeCord(snoozeCord(snoozed, "a"), "a")[0].pulls, 8);
  assert.equal(snoozeCord(snoozeCord(snoozeCord(snoozed, "a"), "a"), "a")[0].pulls, 8);

  const open = [{ ...first[0], pitch: 0, held: false, archived: false }];
  assert.equal(lateCord(open[0], 8), true);
  assert.equal(lateCord({ ...open[0], hour: 6 }, 8), false);
  assert.equal(lateCord({ ...open[0], hour: 5 }, 8), true);
  assert.equal(lateCord({ ...open[0], pitch: 2 }, 8), false);
  assert.equal(windowCords([{ ...open[0], hour: 6 }], 8).length, 1);
  assert.equal(windowCords([{ ...open[0], hour: 1 }], 8).length, 0);
  assert.equal(fairRinger(open, "Bea, Ada"), "Bea");
  const pair = addCord(addCord([], { id: "p", title: "One", hour: 1, metal: "iron" }), { id: "q", title: "Four", hour: 4, metal: "iron" });
  assert.equal(adjacentCordCount(pair), 2);

  const views = addCordView([], {
    id: "v1",
    name: "Peak",
    tray: "open",
    query: "",
    ringer: "all",
    metal: "BRONZE",
    stance: "ring",
    hour: "peak",
    pulls: "2",
    pitch: "0",
  });
  assert.equal(readCordViews(views)[0].hour, "peak");
  assert.equal(readCordViews(views)[0].metal, "BRONZE");

  const csv = cordsCsv(open, 8);
  assert.match(csv, /North proof,Ada,1,BRONZE/);
  assert.match(csv, /,7,/);

  assert.equal(sealOf("+90555"), "+90");
  assert.equal(sealOf("BELL"), "BEL");
  assert.equal(sealLane("+90555111"), "loft");
  assert.equal(sealLane("001234567"), "loft");
  assert.equal(sealLane("5551234"), "hall");
  assert.equal(sealLane("055512"), "yard");
  assert.equal(sealLane("55512"), "yard");
  assert.equal(sealTone("+90555"), "gilt");
  assert.equal(sealTone("5555"), "ivory");
  assert.equal(sealTone("555"), "ink");
  assert.equal(sealTone("BELL"), "mist");
  assert.equal(sealTone("B7"), "ink");
  assert.equal(sealState(""), "clear");
  assert.equal(sealState(null), "clear");
  assert.equal(sealState({ phone: "+90555" }), "set");
  assert.equal(sealState({ phone: "+90555", email: "a@b.c" }), "");
  assert.equal(catalogSeal("+90555"), true);
  assert.equal(catalogSeal("555"), true);
  assert.equal(catalogSeal("bell"), true);
  assert.equal(catalogSeal("5550"), false);
  assert.equal(wideSeal("DESK"), false);
  assert.equal(wideSeal("+901112223333"), true);
  assert.equal(sealStep(""), 0);
  assert.equal(sealStep("12"), 1);
  assert.equal(sealStep("BELL"), 2);
  assert.equal(sealStep("B7"), 3);
  const people = [
    { id: "1", label: "Ada", note: "+90555" },
    { id: "2", label: "Bea", note: "+901112223333" },
    { id: "3", label: "Cy", note: "5551234" },
  ];
  assert.equal(leadingSeal(people), "loft");
  assert.equal(sharedSealCount(people), 2);
  assert.equal(catalogSealCount(people), 1);
  assert.match(sealsCsv(people), /loft,2/);
  assert.match(sealRowsCsv(people, ["2"]), /Bea,\+90,loft,gilt,1,0,1,1/);

  const keys = Object.keys(ROUND217_COPY.en);
  assert.ok(keys.length >= 120);
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND217_COPY[locale]).sort(), keys.slice().sort());
    for (const key of keys) {
      assert.equal(typeof ROUND217_COPY[locale][key as keyof typeof ROUND217_COPY.en], "string");
      assert.ok(ROUND217_COPY[locale][key as keyof typeof ROUND217_COPY.en].length > 0);
    }
  }
  assert.equal(crmv4Text("tr", "blcTitle"), ROUND217_COPY.tr.blcTitle);
  assert.equal(crmv4Text("de", "dlsTitle"), ROUND217_COPY.de.dlsTitle);
  assert.equal(crmv4Text("ru", "blcSub"), ROUND217_COPY.ru.blcSub);
  assert.equal(crmv4Text("ar", "dlsSub"), ROUND217_COPY.ar.dlsSub);
  assert.equal(crmv4Text("en", "blcLogo"), "7FX");

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-blc/);
  assert.match(css, /\.c4-dls-index/);
  assert.match(css, /\.c4-settings-loft/);
  assert.match(css, /\.c4-dls-time/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round217.tsx"), "utf8");
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
  assert.equal(viewFile.includes("validationStatus"), false);
  assert.equal(viewFile.includes("registrationDate"), false);
  assert.equal(viewFile.includes("birthDate"), false);
  assert.equal(viewFile.includes("lastContactAt"), false);
  assert.equal(viewFile.includes("assigneeId"), false);
  assert.equal(viewFile.includes("lastBrowser"), false);
  assert.equal(viewFile.includes("isResident"), false);
  assert.match(viewFile, /phone/);
  assert.match(viewFile, /cordsCsv/);
  assert.match(viewFile, /sealsCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "n"/);
  assert.match(viewFile, /event\.key === "j"/);
  assert.match(viewFile, /event\.key === "p"/);
  assert.match(viewFile, /event\.key === "l"/);
  assert.match(viewFile, /event\.key === "s"/);
  assert.match(viewFile, /event\.key === "t"/);
  assert.match(viewFile, /event\.key === "h"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(viewFile, /data-cords/);
  assert.match(viewFile, /data-seals/);
  assert.match(viewFile, /data-catalog/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /customers/);
  assert.match(viewFile, /suggestMetal/);
  assert.match(viewFile, /c4-dls-time/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "blcd"/);
  assert.match(app, /view === "dlsl"/);
  assert.match(app, /BellCords/);
  assert.match(app, /DialSeals/);
  const settings = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/views/Settings.tsx"), "utf8");
  assert.match(settings, /c4-settings-loft/);
  assert.match(settings, /c4-settings-loft-index/);
  assert.match(settings, /data-logo="mono"/);
  const used = new Set(viewFile.match(/v4\("([a-zA-Z0-9]+)"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of used) assert.ok(key in ROUND217_COPY.en, key);
  console.log("crmv4 round217 tests passed");
}

main();
