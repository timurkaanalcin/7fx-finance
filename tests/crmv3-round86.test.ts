/**
 * CRM v3 UTC marks and deposit channel glance.
 * Run: npx tsx tests/crmv3-round86.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { UM_AR, UM_DE, UM_EN, UM_RU, UM_TR } from "../src/lib/crmv3/copy-utc";
import { crmv3Text } from "../src/lib/crmv3/copy";
import { catalogLocalesComplete, keyTitle } from "../src/lib/crmv3/insights";
import { NAV_SECTIONS } from "../src/lib/crmv3/nav";
import { CRM_V3_MORE, CRM_V3_SECTIONS } from "../src/lib/crmv3/sections";
import {
  CHANNEL_KEY,
  MARK_KEY,
  activeChannel,
  addMark,
  channelLines,
  channelText,
  namedChannels,
  readHiddenChannels,
  readMarks,
  todayUtc,
  toggleChannel,
  utcDay,
  visibleChannels,
  visibleDeposits,
  visibleMarks,
} from "../src/lib/crmv3/utcmark";

const ROOT = path.resolve(__dirname, "..");

function main() {
  assert.equal(MARK_KEY, "crmv3-utc-marks");
  assert.equal(CHANNEL_KEY, "crmv3-channel-hide");
  assert.equal(utcDay(""), "");
  assert.equal(utcDay("2026-02-31"), "");
  assert.equal(utcDay("2026-11-05"), "2026-11-05");
  assert.equal(todayUtc(Date.parse("2026-11-05T23:30:00Z")), "2026-11-05");
  assert.equal(addMark([], { id: "1", day: "", at: "t" }).length, 0);
  assert.equal(addMark([], { id: "1", day: "2026-02-31", at: "t" }).length, 0);
  const saved = addMark([], { id: "1", day: "2026-11-05", at: "2026-11-05T10:00:00Z" });
  assert.equal(saved[0].day, "2026-11-05");
  assert.equal(addMark(saved, { id: "2", day: "2026-11-05", at: "t" }).length, 1);
  const later = addMark(saved, { id: "2", day: "2026-11-01", at: "2026-11-01T10:00:00Z" });
  const pinned = later.map((mark) => (mark.id === "2" ? { ...mark, pinned: true } : mark));
  assert.equal(visibleMarks(pinned, "", false)[0].id, "2");
  assert.equal(visibleMarks(pinned, "2026-11-05", false)[0].day, "2026-11-05");
  assert.equal(visibleMarks(pinned.map((mark) => ({ ...mark, hidden: mark.day === "2026-11-05" })), "", true)[0].day, "2026-11-05");
  assert.deepEqual(readMarks([{ id: "9", day: "" }, { id: "1", day: "2026-11-05" }, { id: "3", day: "2026-11-05" }]).map((mark) => mark.id), ["1"]);

  const rows = [
    { id: "a", label: "Ada", method: { label: " Wire ", type: "BANK" } },
    { id: "b", label: "Bea", method: { label: "Wire", type: "BANK" } },
    { id: "c", label: "Cid", method: { label: "", type: "CRYPTO" } },
    { id: "d", label: "Dot", method: null },
    { id: "e", label: "Eve", method: { label: "  ", type: "  " } },
  ];
  assert.equal(channelText({ label: " Wire ", type: "BANK" }), "Wire");
  assert.equal(channelText({ label: "", type: "CRYPTO" }), "CRYPTO");
  assert.equal(channelText(null), "");
  assert.deepEqual(channelLines(rows), [
    { channel: "", count: 2 },
    { channel: "CRYPTO", count: 1 },
    { channel: "Wire", count: 2 },
  ]);
  assert.deepEqual(namedChannels(rows), ["CRYPTO", "Wire"]);
  assert.deepEqual(visibleDeposits(rows, "Wire", false, "ada").map((row) => row.id), ["a"]);
  assert.deepEqual(visibleDeposits(rows, "", true, "").map((row) => row.id), ["d", "e"]);
  assert.equal(visibleDeposits(rows, "CRYPTO", false, "").some((row) => row.id === "d"), false);
  assert.deepEqual(readHiddenChannels(["Wire", "Invented", ""], ["Wire", "CRYPTO"]), ["Wire"]);
  assert.deepEqual(toggleChannel(["Wire"], "CRYPTO", ["Wire", "CRYPTO"]), ["Wire", "CRYPTO"]);
  assert.deepEqual(visibleChannels(["Wire", "CRYPTO"], ["CRYPTO"], false), ["Wire"]);
  assert.equal(activeChannel("CRYPTO", ["Wire"]), "");

  const copy = Object.keys(UM_EN).sort();
  assert.deepEqual(Object.keys(UM_TR).sort(), copy);
  assert.deepEqual(Object.keys(UM_DE).sort(), copy);
  assert.deepEqual(Object.keys(UM_RU).sort(), copy);
  assert.deepEqual(Object.keys(UM_AR).sort(), copy);
  assert.notEqual(UM_TR.cdTitle, UM_EN.cdTitle);
  assert.notEqual(UM_DE.dcHint, UM_EN.dcHint);
  assert.notEqual(UM_RU.dcBlank, UM_EN.dcBlank);
  assert.notEqual(UM_AR.cdToday, UM_EN.cdToday);
  assert.equal(crmv3Text("en", "cdTitle"), "UTC marks");
  assert.equal(crmv3Text("tr", "dcTitle"), UM_TR.dcTitle);
  assert.equal(catalogLocalesComplete(), true);
  assert.equal(keyTitle("crmv3-utc-marks", "de"), "UTC-Marken");
  assert.equal(keyTitle("crmv3-channel-hide", "tr"), "Kanal bakışı");
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "utcmark"), true);
  assert.equal(CRM_V3_SECTIONS.some((item) => item.id === "depchannel"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("utcmark"), true);
  assert.equal((CRM_V3_MORE as readonly string[]).includes("depchannel"), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "desk" && (group.ids as readonly string[]).includes("utcmark")), true);
  assert.equal(NAV_SECTIONS.some((group) => group.id === "money" && (group.ids as readonly string[]).includes("depchannel")), true);

  const css = fs.readFileSync(path.join(ROOT, "src/components/crmv3/crmv3.css"), "utf8");
  assert.match(css, /\.c3-utc-marks/);
  assert.match(css, /\.c3-channel-glance/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(ROOT, "src/components/crmv3/desk/utc.tsx"), "utf8");
  assert.equal(view.includes("crmv4"), false);
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("setInterval"), false);
  assert.equal(view.includes("amount"), false);
  assert.match(view, /\/api\/admin\/deposits\?take=40/);
  assert.match(view, /data-utc-marks/);
  assert.match(view, /data-today-utc/);
  assert.match(view, /data-channel-glance/);
  assert.match(view, /MARK_KEY/);
  assert.match(view, /CHANNEL_KEY/);
  const jump = view.slice(view.indexOf("function jumpToday"), view.indexOf("return ("));
  assert.equal(jump.includes("addMark"), false);
  const app = fs.readFileSync(path.join(ROOT, "src/components/crmv3/CrmV3App.tsx"), "utf8");
  assert.match(app, /view === "utcmark"/);
  assert.match(app, /view === "depchannel"/);
  assert.equal(app.includes("/api/notifications"), false);
  console.log("crmv3 round86 tests passed");
}

main();
