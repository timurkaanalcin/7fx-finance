/**
 * Giornata patches, silence dials, the graphite country gazetteer, and the ivory hour reliquary.
 * Run: TZ=UTC npx tsx tests/crmv4-round388.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND388_COPY } from "../src/lib/crmv4/copy-round388";
import { ROUND387_FEATURES } from "../src/lib/crmv4/round387";
import {
  ROUND388_FEATURES,
  activeCourse,
  activeGround,
  activeHour,
  activePigment,
  addGiornata,
  addGiornataView,
  briskGiornata,
  champagneQuiet,
  courseCount,
  dialBlank,
  dialCopy,
  dialDark,
  dialDigit,
  dialDim,
  dialEven,
  dialFade,
  dialFar,
  dialHue,
  dialLanesCsv,
  dialLength,
  dialLetter,
  dialLit,
  dialNear,
  dialOpen,
  dialRowsCsv,
  dialUpper,
  dropGiornataView,
  fairHand,
  fullCourse,
  giornataGround,
  giornataHour,
  giornataTimeline,
  idleGiornata,
  lateGiornata,
  leadingDial,
  leadingDialHue,
  midCourse,
  moveGiornataFocus,
  overdueGiornata,
  pigmentBand,
  pigmentCool,
  pigmentGap,
  pigmentPoint,
  pigmentWarm,
  readGiornataViews,
  reminderGiornataList,
  restingGiornata,
  suggestGiornataGround,
  suggestGiornataHour,
  suggestPigment,
  type DialRow,
  type Giornata,
} from "../src/lib/crmv4/round388";

function patch(partial: Partial<Giornata> & { id: string; title: string }): Giornata {
  return {
    note: "",
    hand: "",
    pigment: "",
    hour: null,
    ground: "",
    course: 2,
    tags: [],
    raised: false,
    scaffolded: false,
    archived: false,
    pinned: false,
    audit: "",
    ...partial,
  };
}

function main() {
  assert.equal(ROUND388_FEATURES.length, 25);
  assert.equal(new Set(ROUND388_FEATURES).size, 25);
  for (const feature of ROUND388_FEATURES) assert.equal((ROUND387_FEATURES as readonly string[]).includes(feature), false, feature);
  const libDir = path.join(__dirname, "../src/lib/crmv4");
  for (const feature of ROUND388_FEATURES) {
    const needle = `"${feature}"`;
    for (const file of fs.readdirSync(libDir)) {
      if (!file.endsWith(".ts") || file === "round388.ts") continue;
      const body = fs.readFileSync(path.join(libDir, file), "utf8");
      assert.equal(body.includes(needle), false, `${feature} in ${file}`);
    }
  }

  assert.equal(pigmentPoint(" lime "), "lime");
  assert.equal(pigmentPoint("jasper"), "");
  assert.equal(giornataHour("3"), 3);
  assert.equal(giornataHour(7), 7);
  assert.equal(giornataHour(11), 11);
  assert.equal(giornataHour(14), 14);
  assert.equal(giornataHour("6"), null);
  assert.equal(giornataHour("9"), null);
  assert.equal(courseCount("2"), 2);
  assert.equal(courseCount(4), 4);
  assert.equal(courseCount("8"), 8);
  assert.equal(courseCount("1"), null);
  assert.equal(courseCount("5"), null);
  assert.equal(giornataGround("ivory"), "IVORY");
  assert.equal(giornataGround("graphite"), "GRAPHITE");
  assert.equal(giornataGround("champagne"), "CHAMPAGNE");
  assert.equal(giornataGround("gold"), "");
  assert.equal(pigmentWarm("lime"), true);
  assert.equal(pigmentWarm("SAND"), true);
  assert.equal(pigmentWarm("soot"), false);
  assert.equal(pigmentCool("umber"), true);
  assert.equal(pigmentCool("soot"), true);
  assert.equal(pigmentCool("sand"), false);
  assert.equal(pigmentBand("lime"), "first");
  assert.equal(pigmentBand("sand"), "second");
  assert.equal(pigmentBand("umber"), "third");
  assert.equal(pigmentBand("soot"), "fourth");
  assert.equal(pigmentGap("lime", "soot"), 3);
  assert.equal(pigmentGap("soot", "sand"), -2);
  assert.equal(pigmentGap("gold", "soot"), null);
  assert.equal(champagneQuiet("champagne"), true);
  assert.equal(champagneQuiet("ivory"), false);
  assert.equal(midCourse(4), true);
  assert.equal(midCourse(2), false);
  assert.equal(fullCourse(8), true);
  assert.equal(fullCourse(4), false);
  assert.equal(activePigment("warm"), "warm");
  assert.equal(activePigment("cool"), "cool");
  assert.equal(activePigment("nope"), "all");
  assert.equal(activeHour(7), "7");
  assert.equal(activeHour(6), "all");
  assert.equal(activeGround("ivory", ["IVORY", "GRAPHITE", "CHAMPAGNE"]), "IVORY");
  assert.equal(activeCourse(8), "8");
  assert.equal(activeCourse(2), "2");
  assert.equal(activeCourse(1), "all");
  assert.equal(moveGiornataFocus(0, 4, -1), 3);
  assert.equal(suggestPigment(2), "lime");
  assert.equal(suggestPigment(6), "sand");
  assert.equal(suggestPigment(12), "umber");
  assert.equal(suggestPigment(20), "soot");
  assert.equal(suggestGiornataHour([], 2), 3);
  assert.equal(suggestGiornataHour([], 8), 7);
  assert.equal(suggestGiornataHour([], 14), 11);
  assert.equal(suggestGiornataHour([], 20), 14);
  const wall = [
    patch({ id: "a", title: "Ada", ground: "IVORY", pigment: "lime", hour: 3, hand: "Nia" }),
    patch({ id: "b", title: "Bea", ground: "IVORY", pigment: "soot", hour: 7, hand: "Nia" }),
  ];
  assert.equal(suggestGiornataGround(wall), "CHAMPAGNE");
  assert.equal(suggestGiornataHour(wall, 2), 11);
  assert.equal(fairHand(wall, "Nia,Omar"), "Omar");

  const saved = addGiornata([], { title: "  Corso  ", pigment: "umber", hour: 14, ground: "champagne", course: 8, tags: "a b a x" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].pigment, "umber");
  assert.equal(saved[0].hour, 14);
  assert.equal(saved[0].ground, "CHAMPAGNE");
  assert.equal(saved[0].course, 8);
  assert.deepEqual(saved[0].tags, ["a", "b"]);
  assert.equal(saved[0].audit, "save");
  assert.equal(addGiornata(saved, { title: "Corso" }).length, 1);

  const views = addGiornataView([], { id: "v1", name: "Quiet", rack: "wall", query: "", hand: "", ground: "ivory", pigment: "warm", hour: "3", course: "4" });
  assert.equal(readGiornataViews(views)[0].ground, "IVORY");
  assert.equal(readGiornataViews(views)[0].pigment, "warm");
  assert.equal(dropGiornataView(views, "v1").length, 0);

  const late = patch({ id: "l", title: "Late", pigment: "lime" });
  const idle = patch({ id: "i", title: "Idle", hour: 3 });
  const brisk = patch({ id: "r", title: "Brisk", ground: "GRAPHITE", hour: 14, course: 8 });
  const rest = patch({ id: "s", title: "Rest", pigment: "umber", ground: "IVORY", hour: 7 });
  const due = patch({ id: "d", title: "Due", pigment: "soot", course: 2 });
  assert.equal(lateGiornata(late, "soot"), true);
  assert.equal(lateGiornata(late, "lime"), false);
  assert.equal(idleGiornata(idle), true);
  assert.equal(briskGiornata(brisk), true);
  assert.equal(restingGiornata(rest), true);
  assert.equal(overdueGiornata(due), true);
  assert.deepEqual(reminderGiornataList([due, late]), ["Due"]);
  const timeline = giornataTimeline([patch({ id: "t", title: "Ten", hour: 7 })]);
  assert.equal(timeline[0].hour, 7);
  assert.deepEqual(timeline[0].titles, ["Ten"]);

  const now = Date.parse("2026-11-26T12:00:00Z");
  assert.equal(dialLit("NOW", now), true);
  assert.equal(dialLit(true, now), true);
  assert.equal(dialNear("LATER", now), true);
  assert.equal(dialNear("2026-11-27T08:00:00Z", now), true);
  assert.equal(dialFar("2026-11-28T08:00:00Z", now), true);
  assert.equal(dialFade("STALE", now), true);
  assert.equal(dialFade("2026-11-22T08:00:00Z", now), true);
  assert.equal(dialDark("GONE", now), true);
  assert.equal(dialDark(false, now), true);
  assert.equal(dialDark("2026-11-19T08:00:00Z", now), true);
  assert.equal(dialDim("QUEUE", now), true);
  assert.equal(dialBlank("EMPTY", now), true);
  assert.equal(dialOpen(""), true);
  assert.equal(dialHue("NOW", now), "brass");
  assert.equal(dialHue("GONE", now), "pitch");
  assert.equal(dialHue("QUEUE", now), "mist");
  assert.equal(dialLength("NOW"), 3);
  assert.equal(dialEven("HERE"), true);
  assert.equal(dialDigit("12night"), true);
  assert.equal(dialLetter("NOW"), true);
  assert.equal(dialUpper("AUSTRALIA"), true);
  assert.equal(dialUpper("NOW"), false);
  assert.equal(dialCopy("NOW"), "NOW");
  assert.equal(dialLit({ balance: 1 }, now), false);
  const rows: DialRow[] = [
    { id: "1", label: "Ada", code: "NOW" },
    { id: "2", label: "Bea", code: "QUEUE" },
  ];
  assert.equal(leadingDial(rows, now), "due");
  assert.equal(leadingDialHue(rows, now), "brass");
  assert.match(dialLanesCsv(rows, now), /due,1/);
  assert.match(dialRowsCsv(rows, ["1"], now), /Ada,NOW/);
  assert.match(dialRowsCsv(rows, ["1"], now), /,1$/m);

  assert.equal(crmv4Text("en", "gioTitle"), ROUND388_COPY.en.gioTitle);
  assert.equal(crmv4Text("tr", "sldTitle"), ROUND388_COPY.tr.sldTitle);
  assert.equal(crmv4Text("de", "gioHint"), ROUND388_COPY.de.gioHint);
  assert.equal(crmv4Text("ru", "countryGazetteerKicker"), ROUND388_COPY.ru.countryGazetteerKicker);
  assert.equal(crmv4Text("ar", "hourReliquaryLead"), ROUND388_COPY.ar.hourReliquaryLead);
  const keys = Object.keys(ROUND388_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND388_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-giornata/);
  assert.match(css, /\.c4-silence/);
  assert.match(css, /\.c4-giornata-column/);
  assert.match(css, /\.c4-silence-column/);
  assert.match(css, /\.c4-country-gazetteer/);
  assert.match(css, /\.c4-hour-reliquary/);
  assert.match(css, /\.c4-country-gazetteer-mast/);
  assert.match(css, /\.c4-hour-reliquary-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round388.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /row\.lastContactAt/);
  assert.match(viewFile, /giornataCsv/);
  assert.match(viewFile, /dialRowsCsv/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "x"/);
  assert.match(viewFile, /event\.key === "a"/);
  assert.match(viewFile, /event\.key === "c"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=24&meta=0/);
  assert.match(viewFile, /data-giornata/);
  assert.match(viewFile, /data-silence/);
  assert.match(viewFile, /data-names/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestGiornataGround/);
  assert.match(viewFile, /c4-silence-search/);
  assert.match(viewFile, /giornataTimeline/);
  assert.match(viewFile, /c4-giornata-notices/);
  assert.match(viewFile, /from "@\/lib\/crmv4\/round388"/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "gio"/);
  assert.match(app, /view === "sld"/);
  const desk = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round4.tsx"), "utf8");
  assert.match(desk, /c4-country-gazetteer/);
  assert.match(desk, /c4-country-gazetteer-mast/);
  assert.match(desk, /data-logo="mono"/);
  assert.match(desk, /countryGazetteerKicker/);
  assert.match(desk, /countryGazetteerLead/);
  assert.match(desk, /data-country-gazetteer/);
  assert.match(desk, /c4-hour-reliquary/);
  assert.match(desk, /c4-hour-reliquary-mast/);
  assert.match(desk, /hourReliquaryKicker/);
  assert.match(desk, /hourReliquaryLead/);
  assert.match(desk, /data-hour-reliquary/);
  const namedKeys = `${viewFile}\n${desk}`.match(/"(gio|sld|countryGazetteer|hourReliquary)[A-Za-z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND388_COPY.en[key as keyof typeof ROUND388_COPY.en], "string", key);
  console.log("crmv4 round388 tests passed");
}

main();
