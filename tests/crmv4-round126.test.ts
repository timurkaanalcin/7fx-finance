/**
 * Break notes and affiliate channels.
 * Run: npx tsx tests/crmv4-round126.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND126_COPY } from "../src/lib/crmv4/copy-round126";
import { crmv4Text } from "../src/lib/crmv4/copy";
import {
  CHANNEL_FIELDS,
  activeChannel,
  addNote,
  channelLines,
  channelText,
  cornerLabel,
  namedChannels,
  noteText,
  readHiddenChannels,
  readNotes,
  resetNotes,
  setNoteHidden,
  toggleChannel,
  toggleNotePin,
  visibleChannels,
  visibleNotes,
  visibleTraders,
} from "../src/lib/crmv4/round126";

function main() {
  assert.equal(noteText("  Coffee\nA  "), "Coffee A");
  assert.equal(noteText("   "), "");
  assert.equal(noteText("x".repeat(140)).length, 120);
  assert.equal(cornerLabel("  Table 4  "), "Table 4");
  assert.equal(cornerLabel("   "), "");
  assert.equal(cornerLabel("y".repeat(50)).length, 40);
  assert.deepEqual(readNotes([{ id: "", text: "Ada" }, { id: "1", text: "  " }, { id: "2", text: "Break", corner: "  ", pinned: 1 }, "nope"]), [
    { id: "2", text: "Break", corner: "", pinned: false, hidden: false },
  ]);
  const saved = addNote([], { id: "a", text: " Quiet corner ", corner: " Table 4 " });
  assert.deepEqual(saved, [{ id: "a", text: "Quiet corner", corner: "Table 4", pinned: false, hidden: false }]);
  assert.equal(addNote(saved, { id: "b", text: "  " }).length, 1);
  assert.equal(addNote(saved, { id: "c", text: "Quiet corner" }).length, 1);
  assert.equal(addNote(saved, { id: "a", text: "Other table" }).length, 1);
  const pinned = toggleNotePin(saved, "a");
  assert.equal(pinned[0].pinned, true);
  const hidden = setNoteHidden(pinned, "a", true);
  assert.equal(hidden[0].hidden, true);
  assert.deepEqual(visibleNotes(pinned, false, "quiet").map((note) => note.id), ["a"]);
  assert.deepEqual(visibleNotes(pinned, false, "table"), []);
  assert.deepEqual(visibleNotes(hidden, false, ""), []);
  assert.deepEqual(visibleNotes(hidden, true, "").map((note) => note.id), ["a"]);
  assert.deepEqual(resetNotes(), []);
  const many = Array.from({ length: 41 }, (_, index) => ({ id: `n${index}`, text: `Note ${index}`, corner: "" }));
  assert.equal(readNotes(many).length, 40);

  assert.equal(channelText(" WEB "), "WEB");
  assert.equal(channelText({ channel: "  Ads " }), "Ads");
  assert.equal(channelText({ channel: "  ", campaign: "Spring" }), "Spring");
  assert.equal(channelText({ campaign: " Organic " }), "Organic");
  assert.equal(channelText(""), "");
  assert.equal(channelText(1 as never), "");
  assert.equal(channelText({ affiliateA: "AFF-100" } as never), "");
  assert.deepEqual(CHANNEL_FIELDS.includes("campaign" as never), true);
  assert.deepEqual(CHANNEL_FIELDS.includes("affiliateA" as never), false);
  const rows = [
    { id: "u1", label: "Ada", channel: { campaign: "WEB" } },
    { id: "u2", label: "Bea", channel: { channel: "DESK" } },
    { id: "u3", label: "Cid", channel: { campaign: "WEB" } },
    { id: "u4", label: "Dot", channel: "" },
    { id: "u5", label: "Eve", channel: { affiliateA: "AFF" } as never },
  ];
  assert.deepEqual(channelLines(rows), [
    { channel: "", count: 2 },
    { channel: "DESK", count: 1 },
    { channel: "WEB", count: 2 },
  ]);
  assert.deepEqual(namedChannels(rows), ["DESK", "WEB"]);
  assert.deepEqual(visibleTraders(rows, "WEB", false, "ada").map((row) => row.id), ["u1"]);
  assert.deepEqual(visibleTraders(rows, "", true, "").map((row) => row.id), ["u4", "u5"]);
  assert.deepEqual(visibleTraders(rows, "WEB", false, "100"), []);
  assert.deepEqual(readHiddenChannels(["WEB", "NEW", ""], ["WEB", "DESK"]), ["WEB"]);
  assert.deepEqual(toggleChannel(["WEB"], "NEW", ["WEB"]), ["WEB"]);
  assert.deepEqual(visibleChannels(["WEB", "DESK"], ["DESK"], false), ["WEB"]);
  assert.equal(activeChannel("DESK", ["WEB"]), "");
  assert.equal(channelLines(rows).every((line) => !("amount" in line) && !("currency" in line)), true);

  const copy = Object.keys(ROUND126_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND126_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "brkTitle"), "Break notes");
  assert.equal(crmv4Text("tr", "acgTitle"), ROUND126_COPY.tr.acgTitle);
  assert.equal(crmv4Text("de", "brkCorner"), ROUND126_COPY.de.brkCorner);
  assert.equal(crmv4Text("ru", "acgBlank"), ROUND126_COPY.ru.acgBlank);
  assert.equal(crmv4Text("ar", "acgBoard"), ROUND126_COPY.ar.acgBoard);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-break/);
  assert.match(css, /\.c4-aff-chan/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round126.tsx"), "utf8");
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("setInterval"), false);
  assert.equal(view.includes("fetch("), false);
  assert.equal(view.includes("amount"), false);
  assert.equal(view.includes("currency"), false);
  assert.equal(view.includes("affiliateA"), false);
  assert.match(view, /campaign/);
  assert.match(view, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(view, /data-break/);
  assert.match(view, /data-aff-chan/);
  assert.match(view, /data-logo="mono"/);
  assert.match(view, /affiliates/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "breakroom"/);
  assert.match(app, /view === "affchan"/);
  console.log("crmv4 round126 tests passed");
}

main();
