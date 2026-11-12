/**
 * Belvedere steps and keeper seals.
 * Run: TZ=UTC npx tsx tests/crmv4-round221.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND221_COPY } from "../src/lib/crmv4/copy-round221";
import {
  activeChime,
  activePace,
  activeTread,
  addStep,
  addStepTag,
  addStepView,
  catalogKeeper,
  catalogKeeperCount,
  chimeOf,
  cyclePace,
  densityOf,
  fairKeeper,
  glazeOf,
  houseGlaze,
  keeperLane,
  keeperRowsCsv,
  keeperState,
  keeperStep,
  keeperTone,
  lateStep,
  leadingKeeper,
  liftOf,
  moveFocus,
  peakTread,
  quietTread,
  readStepViews,
  sealOf,
  sealsCsv,
  setStepLift,
  sharedSealCount,
  snoozeStep,
  suggestChime,
  suggestGlaze,
  treadGap,
  treadOf,
  wideKeeper,
  windowSteps,
  stepsCsv,
} from "../src/lib/crmv4/round221";

function main() {
  assert.equal(glazeOf("  ivory "), "IVORY");
  assert.equal(glazeOf("slate"), "SLATE");
  assert.equal(glazeOf("gold"), "GOLD");
  assert.equal(glazeOf("   "), "");
  assert.equal(glazeOf("linen"), "");
  assert.equal(treadOf("1"), 1);
  assert.equal(treadOf(8), 8);
  assert.equal(treadOf("8"), 8);
  assert.equal(treadOf("0"), null);
  assert.equal(treadOf(0), null);
  assert.equal(treadOf("9"), null);
  assert.equal(treadOf("08"), null);
  assert.equal(treadOf(""), null);
  assert.equal(treadOf(1.5), null);
  assert.equal(chimeOf("15"), 15);
  assert.equal(chimeOf(30), 30);
  assert.equal(chimeOf("45"), 45);
  assert.equal(chimeOf("10"), null);
  assert.equal(chimeOf("015"), null);
  assert.equal(liftOf("1"), 1);
  assert.equal(liftOf(3), 3);
  assert.equal(liftOf("5"), 5);
  assert.equal(liftOf("0"), null);
  assert.equal(liftOf("2"), null);
  assert.equal(peakTread(3), true);
  assert.equal(peakTread(7), true);
  assert.equal(peakTread(5), false);
  assert.equal(quietTread(8), true);
  assert.equal(quietTread(6), false);
  assert.equal(treadGap(1, 8), 7);
  assert.equal(treadGap(8, 1), -7);
  assert.equal(treadGap(null, 3), null);
  assert.equal(treadGap(1, 0), null);
  assert.equal(houseGlaze("ivory"), true);
  assert.equal(houseGlaze("GOLD"), true);
  assert.equal(houseGlaze("slate"), false);
  assert.equal(activeTread("peak"), "peak");
  assert.equal(activeTread("8"), "8");
  assert.equal(activeTread("9"), "all");
  assert.equal(activeChime("30"), "30");
  assert.equal(activeChime("10"), "all");
  assert.equal(activePace("rush", ["still", "walk", "rush"]), "rush");
  assert.equal(activePace("flare", ["still", "walk", "rush"]), "all");
  assert.equal(densityOf("close"), "close");
  assert.equal(densityOf("nope"), "roomy");
  assert.equal(moveFocus(0, 3, 1), 1);
  assert.equal(moveFocus(0, 3, -1), 2);
  assert.equal(suggestGlaze([]), "IVORY");
  assert.equal(suggestChime([]), 30);

  const first = addStep([], {
    id: "a",
    title: "  North arch ",
    note: "quiet",
    keeper: "Ada",
    tread: "1",
    glaze: "ivory",
    pace: "still",
    chime: "15",
    tags: "e f g h z",
    lift: "3",
  });
  assert.equal(first.length, 1);
  assert.equal(first[0].title, "North arch");
  assert.equal(first[0].glaze, "IVORY");
  assert.equal(first[0].tread, 1);
  assert.equal(first[0].chime, 15);
  assert.deepEqual(first[0].tags, ["e", "f", "g"]);
  assert.equal(first[0].lift, 3);
  assert.equal(addStep(first, { id: "a", title: "Other" }).length, 1);
  assert.equal(addStep(first, { id: "b", title: "  " }).length, 1);
  const tagged = addStepTag(first, "a", "e");
  assert.deepEqual(tagged[0].tags, ["e", "f", "g"]);
  const raised = setStepLift(first, "a", 1);
  assert.equal(raised[0].lift, 1);
  assert.equal(raised[0].audit, "lift");
  const snoozed = snoozeStep(addStep([], { id: "s", title: "Chime", chime: 15 }), "s");
  assert.equal(snoozed[0].chime, 30);
  assert.equal(snoozeStep(snoozed, "s")[0].chime, 45);
  const cycled = cyclePace(addStep([], { id: "t", title: "Pace", pace: "still" }), "t");
  assert.equal(cycled[0].pace, "walk");
  const late = addStep([], { id: "l", title: "Late tread", tread: 1, lift: 1 });
  assert.equal(lateStep(late[0], 5), true);
  assert.equal(lateStep(late[0], 3), false);
  assert.equal(windowSteps(late, 2).length, 1);
  assert.equal(fairKeeper(first, "Bea,Ada"), "Bea");
  const views = addStepView([], {
    id: "v",
    name: "Peak court",
    tray: "open",
    query: "arch",
    keeper: "all",
    glaze: "ivory",
    pace: "all",
    tread: "peak",
    chime: "15",
    lift: "1",
  });
  assert.equal(readStepViews(views)[0].glaze, "IVORY");
  assert.equal(readStepViews(views)[0].tread, "peak");
  assert.match(stepsCsv(first, 5), /North arch,Ada,1,IVORY,still,15,3,e f g/);

  assert.equal(sealOf("  Ada "), "AD");
  assert.equal(keeperLane("ada"), "hall");
  assert.equal(keeperLane("leif-west"), "wing");
  assert.equal(keeperLane("lyon"), "porch");
  assert.equal(keeperLane(""), "");
  assert.equal(keeperTone("ada"), "gold");
  assert.equal(keeperTone("alexandrina"), "ivory");
  assert.equal(keeperTone("noor khan"), "mist");
  assert.equal(keeperTone("lyon"), "ink");
  assert.equal(keeperState(""), "clear");
  assert.equal(keeperState(null), "clear");
  assert.equal(keeperState({ assigneeName: "Ada" }), "set");
  assert.equal(keeperState({ assigneeName: "Ada", email: "1" }), "");
  assert.equal(keeperState({ lastCity: "Milan" }), "");
  assert.equal(catalogKeeper("ada"), true);
  assert.equal(catalogKeeper("otto"), true);
  assert.equal(catalogKeeper("lyon"), false);
  assert.equal(wideKeeper("lyon"), false);
  assert.equal(wideKeeper("alexandrina"), true);
  assert.equal(keeperStep(""), 0);
  assert.equal(keeperStep("lyon"), 1);
  assert.equal(keeperStep("noor khan"), 2);
  assert.equal(keeperStep("leif-west"), 3);
  const people = [
    { id: "1", label: "Ada", note: "ada" },
    { id: "2", label: "Bea", note: "adam" },
    { id: "3", label: "Cy", note: "alexandrina" },
  ];
  assert.equal(leadingKeeper(people), "porch");
  assert.equal(sharedSealCount(people), 2);
  assert.equal(catalogKeeperCount(people), 1);
  assert.match(sealsCsv(people), /porch,2/);
  assert.match(keeperRowsCsv(people, ["2"]), /Bea,AD,porch,ink,1,0,0,1/);

  const keys = Object.keys(ROUND221_COPY.en);
  assert.ok(keys.length >= 120);
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND221_COPY[locale]).sort(), keys.slice().sort());
    for (const key of keys) {
      assert.equal(typeof ROUND221_COPY[locale][key as keyof typeof ROUND221_COPY.en], "string");
      assert.ok(ROUND221_COPY[locale][key as keyof typeof ROUND221_COPY.en].length > 0);
    }
  }
  assert.equal(crmv4Text("tr", "bvsTitle"), ROUND221_COPY.tr.bvsTitle);
  assert.equal(crmv4Text("de", "kpsTitle"), ROUND221_COPY.de.kpsTitle);
  assert.equal(crmv4Text("ru", "bvsSub"), ROUND221_COPY.ru.bvsSub);
  assert.equal(crmv4Text("ar", "kpsSub"), ROUND221_COPY.ar.kpsSub);
  assert.equal(crmv4Text("en", "bvsLogo"), "7FX");

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-bvs/);
  assert.match(css, /\.c4-kps-index/);
  assert.match(css, /\.c4-cust-belvedere/);
  assert.match(css, /\.c4-kps-time/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round221.tsx"), "utf8");
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
  assert.equal(viewFile.includes("phone"), false);
  assert.equal(viewFile.includes("email"), false);
  assert.equal(viewFile.includes("tradingGroup"), false);
  assert.match(viewFile, /assigneeName/);
  assert.match(viewFile, /stepsCsv/);
  assert.match(viewFile, /sealsCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "n"/);
  assert.match(viewFile, /event\.key === "j"/);
  assert.match(viewFile, /event\.key === "p"/);
  assert.match(viewFile, /event\.key === "b"/);
  assert.match(viewFile, /event\.key === "f"/);
  assert.match(viewFile, /event\.key === "y"/);
  assert.match(viewFile, /event\.key === "h"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(viewFile, /data-steps/);
  assert.match(viewFile, /data-seals/);
  assert.match(viewFile, /data-catalog/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /customers/);
  assert.match(viewFile, /suggestGlaze/);
  assert.match(viewFile, /c4-kps-time/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "bvst"/);
  assert.match(app, /view === "kpsl"/);
  assert.match(app, /BelvedereSteps/);
  assert.match(app, /KeeperSeals/);
  assert.match(app, /c4-pagehead-belvedere/);
  assert.match(app, /c4-rail-belvedere/);
  const customers = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/views/Customers.tsx"), "utf8");
  assert.match(customers, /c4-cust-belvedere/);
  assert.match(customers, /c4-cust-belvedere-index/);
  assert.match(customers, /data-logo="mono"/);
  const used = new Set(viewFile.match(/v4\("([a-zA-Z0-9]+)"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of used) assert.ok(key in ROUND221_COPY.en, key);
  console.log("crmv4 round221 tests passed");
}

main();
