/**
 * UTC marks and deposit channels.
 * Run: npx tsx tests/crmv4-round86.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND86_COPY } from "../src/lib/crmv4/copy-round86";
import { crmv4Text } from "../src/lib/crmv4/copy";
import {
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
} from "../src/lib/crmv4/round86";

function main() {
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

  const copy = Object.keys(ROUND86_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND86_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "cdTitle"), "UTC marks");
  assert.equal(crmv4Text("tr", "dcTitle"), ROUND86_COPY.tr.dcTitle);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-utc-marks/);
  assert.match(css, /\.c4-channel-glance/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round86.tsx"), "utf8");
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("setInterval"), false);
  assert.equal(view.includes("amount"), false);
  assert.match(view, /\/api\/admin\/deposits\?take=40/);
  assert.match(view, /data-utc-marks/);
  assert.match(view, /data-channel-glance/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "utcmark"/);
  assert.match(app, /view === "depchannel"/);
  console.log("crmv4 round86 tests passed");
}

main();
