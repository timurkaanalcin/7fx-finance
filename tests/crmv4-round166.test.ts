/**
 * Cloakroom passes and login latches.
 * Run: TZ=UTC npx tsx tests/crmv4-round166.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND166_COPY } from "../src/lib/crmv4/copy-round166";
import {
  activeBell,
  activeLatch,
  addCloak,
  addCloakView,
  bellOf,
  bearerLoad,
  cloakCopy,
  cloakCounts,
  cloakGap,
  cloakLine,
  cloakShare,
  cloakStamp,
  cloakTimeline,
  cloaksCsv,
  clashCloakCount,
  cycleCloakTone,
  dayBell,
  dropCloakView,
  editCloak,
  latchOf,
  latchesCsv,
  leadingLatch,
  leadingSpan,
  nextCloak,
  phoneMarkOf,
  phoneSpanOf,
  quietBell,
  readCloaks,
  stampClashCount,
  suggestWing,
  visibleCloaks,
  visibleLatchCustomers,
  watchOf,
  bulkCloakWing,
} from "../src/lib/crmv4/round166";

function main() {
  assert.equal(cloakLine("  Hand\nAda  "), "Hand Ada");
  assert.equal(cloakLine("   "), "");
  assert.equal(cloakLine("x".repeat(80)).length, 48);
  assert.equal(cloakStamp("  VIP  "), "VIP");
  assert.equal(cloakStamp("   "), "");
  assert.equal(cloakStamp("z".repeat(20)).length, 6);

  assert.equal(bellOf("08"), 8);
  assert.equal(bellOf("00"), 0);
  assert.equal(bellOf("8"), 8);
  assert.equal(bellOf(23), 23);
  assert.equal(bellOf("24"), null);
  assert.equal(bellOf(-1), null);
  assert.equal(bellOf(""), null);
  assert.equal(bellOf("3.0"), null);
  assert.equal(watchOf(8), "morning");
  assert.equal(watchOf(12), "afternoon");
  assert.equal(watchOf(18), "night");
  assert.equal(watchOf(null), "blank");
  assert.equal(quietBell(22), true);
  assert.equal(quietBell(0), true);
  assert.equal(quietBell(5), true);
  assert.equal(quietBell(6), false);
  assert.equal(quietBell(18), false);
  assert.equal(dayBell(6), true);
  assert.equal(dayBell(21), true);
  assert.equal(dayBell(22), false);
  assert.equal(cloakGap(2, 8), 6);
  assert.equal(cloakGap(8, 2), -6);
  assert.equal(cloakGap(2, 2), 0);
  assert.equal(cloakGap(null, 2), null);
  assert.equal(cloakGap(2, ""), null);
  assert.equal(cloakGap(2, 24), null);

  const saved = addCloak([], { id: "a", line: "Call Ada", bearer: "Nia", bell: "08", wing: "north", stamp: "A1", tone: "calm" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].bell, 8);
  assert.equal(saved[0].audit, "save");
  assert.equal(addCloak(saved, { id: "b", line: "Call Ada" }).length, 1);
  assert.equal(addCloak(saved, { id: "a", line: "Other" }).length, 1);
  assert.equal(addCloak(saved, { id: "c", line: "   " }).length, 1);
  const capped = Array.from({ length: 13 }, (_, index) => ({ id: `n${index}`, line: `Line ${index}` })).reduce((cards, card) => addCloak(cards, card), [] as ReturnType<typeof addCloak>);
  assert.equal(capped.length, 12);

  const cycled = cycleCloakTone(saved, "a");
  assert.equal(cycled[0].tone, "keen");
  assert.equal(cycled[0].audit, "tone");
  assert.equal(cycleCloakTone(cycled, "a")[0].tone, "urgent");
  assert.equal(cycleCloakTone(cycleCloakTone(cycled, "a"), "a")[0].tone, "calm");
  const blankTone = addCloak([], { id: "z", line: "Blank tone" });
  assert.equal(cycleCloakTone(blankTone, "z")[0].tone, "calm");

  const edited = editCloak(saved, "a", "Call Bea");
  assert.equal(edited[0].line, "Call Bea");
  assert.equal(edited[0].audit, "edit");
  assert.equal(editCloak(edited, "a", "  ")[0].line, "Call Bea");
  const pair = addCloak(edited, { id: "b", line: "Keep" });
  assert.equal(editCloak(pair, "a", "Keep").find((card) => card.id === "a")?.line, "Call Bea");

  const moved = bulkCloakWing(pair, ["a"], "east");
  assert.equal(moved.find((card) => card.id === "a")?.wing, "east");
  assert.equal(moved.find((card) => card.id === "a")?.audit, "wing");
  assert.equal(bulkCloakWing(moved, ["a"], "east").find((card) => card.id === "a")?.audit, "wing");
  assert.equal(bulkCloakWing(moved, ["a"], "attic").find((card) => card.id === "a")?.wing, "east");

  const mixed = [
    ...addCloak([], { id: "live", line: "Live", bearer: "Nia", bell: 2, wing: "north", stamp: "A1", tone: "calm" }),
  ];
  const queued = mixed.map((card) => (card.id === "live" ? { ...card, queued: true } : card));
  const folded = mixed.map((card) => ({ ...card, folded: true, queued: true }));
  assert.equal(visibleCloaks(mixed, "live", "", null, null, null, null, null, null, false, false).length, 1);
  assert.equal(visibleCloaks(queued, "queued", "", null, null, null, null, null, null, false, false).length, 1);
  assert.equal(visibleCloaks(queued, "live", "", null, null, null, null, null, null, false, false).length, 0);
  assert.equal(visibleCloaks(folded, "folded", "", null, null, null, null, null, null, false, false).length, 1);
  assert.equal(cloakCounts(mixed).night, 1);
  assert.equal(cloakCounts(mixed).live, 1);
  assert.equal(cloakShare(1, 4), 25);
  assert.equal(cloakShare(0, 4), 0);
  assert.equal(cloakShare(1, 0), 0);
  const night = visibleCloaks(mixed, "live", "", null, null, null, null, null, null, false, true);
  assert.equal(night.length, 1);
  const day = addCloak(mixed, { id: "day", line: "Day", bell: 10, wing: "east", tone: "urgent" });
  assert.equal(visibleCloaks(day, "live", "", null, null, null, null, null, null, true, false).map((card) => card.id).join(","), "day");
  assert.equal(visibleCloaks(day, "live", "live", null, null, null, null, null, null, false, false).length, 1);
  assert.equal(cloakTimeline(day, "")[0].bell, 2);

  assert.equal(bearerLoad(day, "Nia"), 1);
  assert.equal(bearerLoad(day, ""), 0);
  assert.equal(suggestWing([]), "north");
  const eastHeavy = addCloak(addCloak([], { id: "e1", line: "East one", wing: "east" }), { id: "e2", line: "East two", wing: "east" });
  assert.equal(suggestWing(eastHeavy), "north");
  assert.equal(nextCloak(day, 1), "live");
  assert.equal(nextCloak(day, 9), "live");
  assert.equal(nextCloak(day, ""), "");
  const clash = addCloak(mixed, { id: "twin", line: "Twin", bell: 2, wing: "north", stamp: "A1" });
  assert.equal(clashCloakCount(clash), 2);
  assert.equal(stampClashCount(clash), 2);
  const bellOnly = addCloak(mixed, { id: "other", line: "Other stamp", bell: 2, wing: "north", stamp: "B2" });
  assert.equal(clashCloakCount(bellOnly), 2);
  assert.equal(stampClashCount(bellOnly), 0);
  assert.equal(clashCloakCount(mixed), 0);

  assert.equal(cloakCopy("  Call Ada "), "Call Ada");
  assert.equal(cloakCopy(" "), "");
  const csv = cloaksCsv(saved, 8);
  assert.equal(csv.startsWith("line,bearer,bell,wing,stamp,tone,watch,starred,queued,folded,gap,audit"), true);
  assert.equal(csv.includes("Call Ada"), true);
  assert.equal(csv.includes("amount"), false);
  assert.equal(activeBell("08"), "8");
  assert.equal(activeBell("quiet"), "quiet");
  assert.equal(activeBell("24"), "all");
  const view = addCloakView([], { id: "v", name: "Night desk", tray: "live", query: "", bearer: "all", wing: "north", stamp: "all", tone: "all", bell: "quiet" });
  assert.equal(view[0].bell, "quiet");
  assert.equal(dropCloakView(view, "v").length, 0);
  assert.equal(readCloaks([{ id: "", line: "x" }]).length, 0);

  assert.equal(latchOf(true), "open");
  assert.equal(latchOf(false), "shut");
  assert.equal(latchOf(" YES "), "open");
  assert.equal(latchOf("shut"), "shut");
  assert.equal(latchOf(""), "");
  assert.equal(latchOf(null), "");
  assert.equal(latchOf({ loginEnabled: false }), "shut");
  assert.equal(latchOf({ loginEnabled: true, phone: "+1" }), "");
  assert.equal(latchOf({ tradingEnabled: true }), "");
  assert.equal(latchOf({ withdrawalsEnabled: false }), "");
  assert.equal(phoneSpanOf(""), "");
  assert.equal(phoneSpanOf("12-34"), "short");
  assert.equal(phoneSpanOf("5551234"), "mid");
  assert.equal(phoneSpanOf("+90 555 123 4567"), "long");
  assert.equal(phoneMarkOf("+90 555"), "plus");
  assert.equal(phoneMarkOf("5551234"), "local");
  assert.equal(phoneMarkOf(""), "");
  const rows = [
    { latch: true, label: "Ada", phone: "+905551234567" },
    { latch: true, label: "Ann", phone: "+441234567890" },
    { latch: false, label: "Bea", phone: "5551234" },
    { latch: null, label: "Cio", phone: "" },
  ];
  assert.equal(leadingLatch(rows), "open");
  assert.equal(leadingLatch([{ latch: true }, { latch: false }]), "open");
  assert.equal(leadingSpan([{ phone: "5551234" }, { phone: "123456" }]), "short");
  assert.equal(leadingSpan(rows), "long");
  assert.equal(visibleLatchCustomers(rows, "shut", null, null, "").length, 1);
  assert.equal(visibleLatchCustomers(rows, null, "mid", "local", "").length, 1);
  assert.equal(visibleLatchCustomers(rows, null, null, null, "bea").length, 1);
  assert.equal(visibleLatchCustomers(rows, null, null, null, "555").length, 0);
  const names = latchesCsv(rows);
  assert.equal(names.startsWith("kind,latch,count"), true);
  assert.equal(latchesCsv([]), "kind,latch,count");
  assert.equal(names.includes("amount"), false);
  assert.equal(names.includes(",open,"), true);
  assert.equal(activeLatch("gone", ["open"]), "all");

  const copy = Object.keys(ROUND166_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND166_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "clkTitle"), "Cloakroom passes");
  assert.equal(crmv4Text("tr", "ltcTitle"), ROUND166_COPY.tr.ltcTitle);
  assert.equal(crmv4Text("de", "clkBearer"), ROUND166_COPY.de.clkBearer);
  assert.equal(crmv4Text("ru", "ltcUnmarked"), ROUND166_COPY.ru.ltcUnmarked);
  assert.equal(crmv4Text("ar", "clkNotice"), ROUND166_COPY.ar.clkNotice);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-clk/);
  assert.match(css, /\.c4-ltc/);
  assert.match(css, /\.c4-cust-cloak/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /#d4bc86/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round166.tsx"), "utf8");
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
  assert.match(viewFile, /loginEnabled/);
  assert.match(viewFile, /cloaksCsv/);
  assert.match(viewFile, /latchesCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "c"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(viewFile, /data-cloaks/);
  assert.match(viewFile, /data-latches/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /customers/);
  assert.match(viewFile, /suggestWing/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "cloak"/);
  assert.match(app, /view === "latch"/);
  const customers = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/views/Customers.tsx"), "utf8");
  assert.match(customers, /c4-cust-cloak/);
  console.log("crmv4 round166 tests passed");
}

main();
