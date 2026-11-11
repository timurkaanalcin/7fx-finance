/**
 * Gallery mounts and device plates.
 * Run: TZ=UTC npx tsx tests/crmv4-round207.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND207_COPY } from "../src/lib/crmv4/copy-round207";
import {
  activeBay,
  activeCord,
  activeStay,
  addMount,
  addMountTag,
  addMountView,
  adjacentMountCount,
  bayGap,
  bayOf,
  bulkMountCloth,
  bulkMountGlaze,
  busiestSteward,
  catalogDevice,
  catalogDeviceCount,
  clashBayCount,
  clothOf,
  cordClashCount,
  cordOf,
  cycleGlaze,
  densityOf,
  deviceBand,
  deviceOf,
  deviceRowsCsv,
  deviceState,
  deviceTone,
  devicesCsv,
  editMount,
  fairSteward,
  giltDeviceCount,
  giltLoad,
  giltOf,
  houseCloth,
  lateMount,
  lateShare,
  leadingDevice,
  leadingDeviceTone,
  mountsCsv,
  moveFocus,
  nextMount,
  pairStewardCount,
  peakBay,
  quietBay,
  readMountViews,
  setMountGilt,
  sharedDeviceCount,
  soonMount,
  stayOf,
  suggestCloth,
  suggestStay,
  suggestSteward,
  usedBays,
  visibleDeviceCustomers,
  visibleMounts,
  wideDeviceCount,
  windowMounts,
} from "../src/lib/crmv4/round207";

function main() {
  assert.equal(clothOf("  champagne "), "CHAMPAGNE");
  assert.equal(clothOf("ivory"), "IVORY");
  assert.equal(clothOf("graphite"), "GRAPHITE");
  assert.equal(clothOf("   "), "");
  assert.equal(clothOf("ink"), "");
  assert.equal(bayOf("1"), 1);
  assert.equal(bayOf(8), 8);
  assert.equal(bayOf("8"), 8);
  assert.equal(bayOf("0"), null);
  assert.equal(bayOf(0), null);
  assert.equal(bayOf("9"), null);
  assert.equal(bayOf("08"), null);
  assert.equal(bayOf(""), null);
  assert.equal(bayOf(1.5), null);
  assert.equal(cordOf("2"), 2);
  assert.equal(cordOf(5), 5);
  assert.equal(cordOf("8"), 8);
  assert.equal(cordOf("3"), null);
  assert.equal(cordOf("02"), null);
  assert.equal(stayOf("12"), 12);
  assert.equal(stayOf(24), 24);
  assert.equal(stayOf("48"), 48);
  assert.equal(stayOf("10"), null);
  assert.equal(stayOf("012"), null);
  assert.equal(giltOf("0"), 0);
  assert.equal(giltOf(3), 3);
  assert.equal(giltOf("9"), 9);
  assert.equal(giltOf("4"), null);
  assert.equal(peakBay(3), true);
  assert.equal(peakBay(6), true);
  assert.equal(peakBay(4), false);
  assert.equal(quietBay(2), true);
  assert.equal(quietBay(8), true);
  assert.equal(quietBay(1), false);
  assert.equal(bayGap(1, 8), 7);
  assert.equal(bayGap(8, 1), -7);
  assert.equal(bayGap(null, 3), null);
  assert.equal(bayGap(1, 0), null);
  assert.equal(activeBay("peak"), "peak");
  assert.equal(activeBay("8"), "8");
  assert.equal(activeBay("9"), "all");
  assert.equal(activeCord("5"), "5");
  assert.equal(activeCord("3"), "all");
  assert.equal(activeStay("blank"), "blank");
  assert.equal(activeStay("10"), "all");
  assert.equal(densityOf("tight"), "tight");
  assert.equal(densityOf("nope"), "roomy");
  assert.equal(moveFocus(0, 3, 1), 1);
  assert.equal(moveFocus(0, 3, -1), 2);
  assert.equal(moveFocus(2, 3, 1), 0);
  assert.equal(moveFocus(1, 0, 1), 0);

  const saved = addMount([], { id: "a", title: "Ada frame", note: "gold leaf", steward: "Nia", bay: "1", cloth: "champagne", glaze: "matte", cord: "8", stay: "12", tags: "a, b, c, d, g", gilt: "0" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].bay, 1);
  assert.equal(saved[0].cord, 8);
  assert.equal(saved[0].stay, 12);
  assert.equal(saved[0].cloth, "CHAMPAGNE");
  assert.equal(saved[0].glaze, "matte");
  assert.equal(saved[0].note, "gold leaf");
  assert.deepEqual(saved[0].tags, ["a", "b", "c"]);
  assert.equal(saved[0].audit, "save");
  assert.equal(houseCloth(saved[0].cloth), true);
  assert.equal(houseCloth("GRAPHITE"), false);
  assert.equal(soonMount(saved[0]), true);
  assert.equal(lateMount(saved[0], "3"), true);
  assert.equal(lateMount(saved[0], "2"), false);
  assert.equal(lateMount(saved[0], "1"), false);
  assert.equal(addMount(saved, { id: "b", title: "Ada frame" }).length, 1);
  assert.equal(addMount(saved, { id: "a", title: "Other" }).length, 1);
  assert.equal(addMount(saved, { id: "c", title: "   " }).length, 1);
  const capped = Array.from({ length: 10 }, (_, index) => ({ id: `n${index}`, title: `Line ${index}` })).reduce((mounts, mount) => addMount(mounts, mount), [] as ReturnType<typeof addMount>);
  assert.equal(capped.length, 7);
  assert.equal(capped.some((mount) => mount.title === "Line 0"), false);
  assert.equal(capped.some((mount) => mount.title === "Line 9"), true);

  const edited = editMount(saved, "a", "Ada leaf");
  assert.equal(edited[0].title, "Ada leaf");
  assert.equal(edited[0].audit, "edit");
  assert.equal(editMount(saved, "a", "   ")[0].title, "Ada frame");
  const glazed = cycleGlaze(saved, "a");
  assert.equal(glazed[0].glaze, "gloss");
  assert.equal(glazed[0].audit, "glaze");
  assert.deepEqual(addMountTag(saved, "a", "f")[0].tags, ["a", "b", "c"]);
  const room = addMount([], { id: "t", title: "Tag frame", tags: "a" });
  assert.deepEqual(addMountTag(room, "t", "b")[0].tags, ["a", "b"]);
  assert.deepEqual(addMountTag(room, "t", "g")[0].tags, ["a"]);
  assert.equal(addMountTag(addMountTag(addMountTag(room, "t", "b"), "t", "c"), "t", "d")[0].tags.length, 3);
  const gilt = setMountGilt(saved, "a", 3);
  assert.equal(gilt[0].gilt, 3);
  assert.equal(gilt[0].audit, "gilt");
  assert.equal(soonMount(gilt[0]), false);
  assert.equal(suggestCloth([]), "CHAMPAGNE");
  assert.equal(suggestStay([]), 24);
  assert.equal(suggestSteward(saved), "Nia");
  assert.equal(fairSteward(saved, "Bea, Nia"), "Bea");
  assert.equal(busiestSteward(saved), "Nia");
  assert.equal(usedBays(saved), 1);

  const pair = addMount(addMount([], { id: "a", title: "A", steward: "Nia", bay: "2", cloth: "ivory", glaze: "matte" }), { id: "b", title: "B", steward: "Nia", bay: "3", cloth: "ivory", gilt: "3" });
  assert.equal(adjacentMountCount(pair), 2);
  assert.equal(pairStewardCount(pair), 2);
  assert.equal(giltLoad(pair), 3);
  assert.equal(clashBayCount(pair), 0);
  const clash = addMount(pair, { id: "c", title: "C", steward: "Bea", bay: "2", cloth: "ivory", cord: "5" });
  const withCord = addMount(clash, { id: "d", title: "D", bay: "6", cloth: "graphite", cord: "5" });
  assert.equal(clashBayCount(clash), 2);
  assert.equal(cordClashCount(withCord), 2);
  assert.equal(nextMount(pair, "3"), "a");
  assert.equal(windowMounts(saved, "1").length, 1);
  assert.equal(windowMounts(saved, "4").length, 0);
  const shown = visibleMounts(saved, "open", "ada", null, null, null, null, null, null, null, false, false, false, false, false);
  assert.equal(shown.length, 1);
  assert.equal(visibleMounts(saved, "open", "", null, "CHAMPAGNE", null, null, null, null, null, false, false, true, false, false).length, 1);
  assert.equal(visibleMounts(saved, "held", "", null, null, null, null, null, null, null, false, false, false, false, false).length, 0);
  const moved = bulkMountCloth(saved, ["a"], "graphite");
  assert.equal(moved[0].cloth, "GRAPHITE");
  assert.equal(moved[0].audit, "cloth");
  const bulkGlaze = bulkMountGlaze(saved, ["a"], "satin");
  assert.equal(bulkGlaze[0].glaze, "satin");
  assert.equal(nextMount(bulkGlaze, "1"), "");
  assert.equal(lateShare(saved, "3") > 0, true);

  const views = addMountView([], { id: "v1", name: "Peak wall", tray: "open", query: "ada", steward: "Nia", cloth: "CHAMPAGNE", glaze: "matte", bay: "peak", cord: "8", stay: "12" });
  assert.equal(readMountViews(views).length, 1);
  assert.equal(readMountViews(views)[0].bay, "peak");
  const viewCap = Array.from({ length: 8 }, (_, index) => ({ id: `v${index}`, name: `View ${index}`, tray: "open" as const, query: "", steward: "all", cloth: "all", glaze: "all", bay: "all", cord: "all", stay: "all" })).reduce((rows, view) => addMountView(rows, view), [] as ReturnType<typeof addMountView>);
  assert.equal(viewCap.length, 5);
  const sheet = mountsCsv(saved, "3");
  assert.match(sheet, /title,steward,bay,cloth,glaze,cord,stay/);
  assert.match(sheet, /Ada frame,Nia,1,CHAMPAGNE,matte,8,12/);

  assert.equal(deviceOf("iPhone 14"), "I1");
  assert.equal(deviceOf("Pixel 8"), "P8");
  assert.equal(deviceOf("Desk 7FX"), "D7");
  assert.equal(deviceOf("Tablet"), "TT");
  assert.equal(deviceOf("Mac"), "MC");
  assert.equal(deviceOf(""), "");
  assert.equal(deviceBand("iPhone 14"), "palm");
  assert.equal(deviceBand("Pixel 8"), "pocket");
  assert.equal(deviceBand("Galaxy S"), "pocket");
  assert.equal(deviceBand("Desk 7FX"), "desk");
  assert.equal(deviceBand("Tablet"), "plain");
  assert.equal(deviceTone("iPhone 14"), "gilt");
  assert.equal(deviceTone("Pixel 8"), "ink");
  assert.equal(deviceTone("Desk 7FX"), "ivory");
  assert.equal(deviceTone("Tablet"), "plain");
  assert.equal(catalogDevice("iPhone 14"), true);
  assert.equal(catalogDevice("Tablet"), false);
  assert.equal(deviceState({ balance: 1, lastDevice: "iPhone 14" }), "");
  assert.equal(deviceState({ lastDevice: null }), "clear");
  assert.equal(deviceState({ lastDevice: "iPhone 14" }), "set");
  assert.equal(deviceState({ email: "ada@7fx.com" }), "");
  const rows = [
    { id: "1", label: "Ada", note: "iPhone 14" },
    { id: "2", label: "Bea", note: "Pixel 8" },
    { id: "3", label: "Cal", note: "Desk 7FX" },
    { id: "4", label: "Eve", note: { lastDevice: null } },
    { id: "5", label: "Fay", note: { balance: 1 } },
    { id: "6", label: "Gus", note: "Samsung Galaxy Ultra" },
  ];
  assert.equal(catalogDeviceCount(rows), 3);
  assert.equal(wideDeviceCount(rows), 1);
  assert.equal(giltDeviceCount(rows), 1);
  assert.equal(sharedDeviceCount([{ id: "1", note: "iPhone 14" }, { id: "2", note: "iPhone 12" }]), 2);
  assert.equal(leadingDevice(rows), "pocket");
  assert.equal(leadingDeviceTone([{ id: "a", note: "iPhone 14" }, { id: "b", note: "iPad Air" }]), "gilt");
  const giltOnly = visibleDeviceCustomers(rows, null, null, "", "all", [], "gilt");
  assert.equal(giltOnly.length, 1);
  const catalogOnly = visibleDeviceCustomers(rows, "palm", null, "ada", "all", [], "catalog");
  assert.equal(catalogOnly.length, 1);
  assert.equal(catalogOnly[0].id, "1");
  const countSheet = devicesCsv(rows);
  assert.match(countSheet, /band,palm,1/);
  assert.match(countSheet, /catalog,catalog,3/);
  assert.match(countSheet, /wide,wide,1/);
  const rowSheet = deviceRowsCsv(rows, ["1"]);
  assert.match(rowSheet, /Ada,I1,palm,gilt,1,0,1/);
  assert.match(rowSheet, /Eve,,blank,,0,0,0/);
  assert.match(rowSheet, /Fay,,,,0,0,0/);

  const keys = Object.keys(ROUND207_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND207_COPY[locale]).sort(), keys);
    for (const key of keys) {
      assert.equal(typeof ROUND207_COPY[locale][key as keyof typeof ROUND207_COPY.en], "string");
      assert.ok(ROUND207_COPY[locale][key as keyof typeof ROUND207_COPY.en].length > 0);
    }
  }
  assert.equal(crmv4Text("tr", "glmTitle"), ROUND207_COPY.tr.glmTitle);
  assert.equal(crmv4Text("de", "dvpTitle"), ROUND207_COPY.de.dvpTitle);
  assert.equal(crmv4Text("ru", "glmSub"), ROUND207_COPY.ru.glmSub);
  assert.equal(crmv4Text("ar", "dvpSub"), ROUND207_COPY.ar.dvpSub);
  assert.equal(crmv4Text("en", "glmLogo"), "7FX");

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-glm/);
  assert.match(css, /\.c4-dvp-index/);
  assert.match(css, /\.c4-mkt-mount/);
  assert.match(css, /\.c4-pagehead-mount/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /#d4bc86/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round207.tsx"), "utf8");
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
  assert.match(viewFile, /lastDevice/);
  assert.match(viewFile, /mountsCsv/);
  assert.match(viewFile, /devicesCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "n"/);
  assert.match(viewFile, /event\.key === "j"/);
  assert.match(viewFile, /event\.key === "p"/);
  assert.match(viewFile, /event\.key === "m"/);
  assert.match(viewFile, /event\.key === "b"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(viewFile, /data-mounts/);
  assert.match(viewFile, /data-devices/);
  assert.match(viewFile, /data-catalog/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /customers/);
  assert.match(viewFile, /suggestCloth/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "glmt"/);
  assert.match(app, /view === "dvpl"/);
  assert.match(app, /GalleryMounts/);
  assert.match(app, /DevicePlates/);
  assert.match(app, /c4-pagehead-mount/);
  assert.match(app, /c4-rail-mount/);
  const marketing = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/views/Marketing.tsx"), "utf8");
  assert.match(marketing, /c4-mkt-mount/);
  console.log("crmv4 round207 tests passed");
}

main();
