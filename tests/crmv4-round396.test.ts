/**
 * Triglyph courses, regula timezone plates, the graphite reply cymatium, and the ivory domain listel.
 * Run: TZ=UTC npx tsx tests/crmv4-round396.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND396_COPY } from "../src/lib/crmv4/copy-round396";
import { ROUND395_FEATURES } from "../src/lib/crmv4/round395";
import {
  ROUND396_FEATURES,
  activeBed,
  activeDepth,
  activeHour,
  activeProfile,
  addTriglyph,
  addTriglyphView,
  regulaBlank,
  regulaCopy,
  regulaDigit,
  regulaDark,
  regulaDim,
  regulaEven,
  regulaFar,
  regulaFade,
  regulaHue,
  regulaLanesCsv,
  regulaLength,
  regulaLetter,
  regulaLit,
  regulaNear,
  regulaOpen,
  regulaRowsCsv,
  regulaUpper,
  briskTriglyph,
  depthCount,
  dropTriglyphView,
  fairHand,
  fullDepth,
  champagneQuiet,
  idleTriglyph,
  lateTriglyph,
  leadingRegula,
  leadingRegulaHue,
  midDepth,
  moveTriglyphFocus,
  triglyphBed,
  triglyphHour,
  triglyphTimeline,
  overdueTriglyph,
  profileBand,
  profileCool,
  profileGap,
  profilePoint,
  profileWarm,
  readTriglyphViews,
  reminderTriglyphList,
  restingTriglyph,
  suggestTriglyphBed,
  suggestTriglyphHour,
  suggestProfile,
  type Triglyph,
  type RegulaRow,
} from "../src/lib/crmv4/round396";

function course(partial: Partial<Triglyph> & { id: string; title: string }): Triglyph {
  return {
    note: "",
    hand: "",
    profile: "",
    hour: null,
    bed: "",
    depth: 2,
    tags: [],
    raised: false,
    pressed: false,
    shelved: false,
    pinned: false,
    audit: "",
    ...partial,
  };
}

function main() {
  assert.equal(ROUND396_FEATURES.length, 25);
  assert.equal(new Set(ROUND396_FEATURES).size, 25);
  for (const feature of ROUND396_FEATURES) assert.equal((ROUND395_FEATURES as readonly string[]).includes(feature), false, feature);
  const libDir = path.join(__dirname, "../src/lib/crmv4");
  for (const feature of ROUND396_FEATURES) {
    const needle = `"${feature}"`;
    for (const file of fs.readdirSync(libDir)) {
      if (!file.endsWith(".ts") || file === "round396.ts") continue;
      const body = fs.readFileSync(path.join(libDir, file), "utf8");
      assert.equal(body.includes(needle), false, `${feature} in ${file}`);
    }
  }

  assert.equal(profilePoint(" triglyph "), "triglyph");
  assert.equal(profilePoint("jasper"), "");
  assert.equal(triglyphHour("2"), 2);
  assert.equal(triglyphHour(5), 5);
  assert.equal(triglyphHour(9), 9);
  assert.equal(triglyphHour(13), 13);
  assert.equal(triglyphHour("4"), null);
  assert.equal(triglyphHour("8"), null);
  assert.equal(depthCount("2"), 2);
  assert.equal(depthCount(5), 5);
  assert.equal(depthCount("8"), 8);
  assert.equal(depthCount("3"), null);
  assert.equal(depthCount("6"), null);
  assert.equal(triglyphBed("ivory"), "IVORY");
  assert.equal(triglyphBed("graphite"), "GRAPHITE");
  assert.equal(triglyphBed("champagne"), "CHAMPAGNE");
  assert.equal(triglyphBed("gold"), "");
  assert.equal(profileWarm("triglyph"), true);
  assert.equal(profileWarm("CHANNEL"), true);
  assert.equal(profileWarm("flute"), false);
  assert.equal(profileCool("flute"), true);
  assert.equal(profileCool("drip"), true);
  assert.equal(profileCool("triglyph"), false);
  assert.equal(profileBand("triglyph"), "first");
  assert.equal(profileBand("channel"), "second");
  assert.equal(profileBand("flute"), "third");
  assert.equal(profileBand("drip"), "fourth");
  assert.equal(profileGap("triglyph", "drip"), 3);
  assert.equal(profileGap("drip", "channel"), -2);
  assert.equal(profileGap("gold", "drip"), null);
  assert.equal(champagneQuiet("champagne"), true);
  assert.equal(champagneQuiet("ivory"), false);
  assert.equal(midDepth(5), true);
  assert.equal(midDepth(2), false);
  assert.equal(fullDepth(8), true);
  assert.equal(fullDepth(5), false);
  assert.equal(activeProfile("warm"), "warm");
  assert.equal(activeProfile("cool"), "cool");
  assert.equal(activeProfile("nope"), "all");
  assert.equal(activeHour(5), "5");
  assert.equal(activeHour(4), "all");
  assert.equal(activeBed("ivory", ["IVORY", "GRAPHITE", "CHAMPAGNE"]), "IVORY");
  assert.equal(activeDepth(8), "8");
  assert.equal(activeDepth(2), "2");
  assert.equal(activeDepth(1), "all");
  assert.equal(moveTriglyphFocus(0, 4, -1), 3);
  assert.equal(suggestProfile(2), "triglyph");
  assert.equal(suggestProfile(7), "channel");
  assert.equal(suggestProfile(12), "flute");
  assert.equal(suggestProfile(20), "drip");
  assert.equal(suggestTriglyphHour([], 2), 2);
  assert.equal(suggestTriglyphHour([], 6), 5);
  assert.equal(suggestTriglyphHour([], 8), 5);
  assert.equal(suggestTriglyphHour([], 12), 9);
  assert.equal(suggestTriglyphHour([], 20), 13);
  const cornice = [
    course({ id: "a", title: "Ada", bed: "IVORY", profile: "triglyph", hour: 2, hand: "Nia" }),
    course({ id: "b", title: "Bea", bed: "IVORY", profile: "drip", hour: 5, hand: "Nia" }),
  ];
  assert.equal(suggestTriglyphBed(cornice), "GRAPHITE");
  assert.equal(suggestTriglyphHour(cornice, 3), 9);
  assert.equal(fairHand(cornice, "Nia,Omar"), "Omar");

  const saved = addTriglyph([], { title: "  Corso  ", profile: "flute", hour: 13, bed: "ivory", depth: 8, tags: "t g t x" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].profile, "flute");
  assert.equal(saved[0].hour, 13);
  assert.equal(saved[0].bed, "IVORY");
  assert.equal(saved[0].depth, 8);
  assert.deepEqual(saved[0].tags, ["t", "g"]);
  assert.equal(saved[0].audit, "save");
  assert.equal(addTriglyph(saved, { title: "Corso" }).length, 1);

  const views = addTriglyphView([], { id: "v1", name: "Quiet", rack: "yard", query: "", hand: "", bed: "ivory", profile: "warm", hour: "2", depth: "5" });
  assert.equal(readTriglyphViews(views)[0].bed, "IVORY");
  assert.equal(readTriglyphViews(views)[0].profile, "warm");
  assert.equal(dropTriglyphView(views, "v1").length, 0);

  const late = course({ id: "l", title: "Late", profile: "triglyph" });
  const idle = course({ id: "i", title: "Idle", hour: 2 });
  const brisk = course({ id: "r", title: "Brisk", bed: "IVORY", hour: 13, depth: 8 });
  const rest = course({ id: "s", title: "Rest", profile: "flute", bed: "IVORY", hour: 5 });
  const due = course({ id: "d", title: "Due", profile: "drip", depth: 2 });
  assert.equal(lateTriglyph(late, "drip"), true);
  assert.equal(lateTriglyph(late, "triglyph"), false);
  assert.equal(idleTriglyph(idle), true);
  assert.equal(briskTriglyph(brisk), true);
  assert.equal(restingTriglyph(rest), true);
  assert.equal(overdueTriglyph(due), true);
  assert.deepEqual(reminderTriglyphList([due, late]), ["Due"]);
  const timeline = triglyphTimeline([course({ id: "t", title: "Ten", hour: 5 })]);
  assert.equal(timeline[0].hour, 5);
  assert.deepEqual(timeline[0].titles, ["Ten"]);

  assert.equal(regulaLit("ZONE"), true);
  assert.equal(regulaLit(true), true);
  assert.equal(regulaNear("1000"), true);
  assert.equal(regulaNear("100"), false);
  assert.equal(regulaFar("ab"), true);
  assert.equal(regulaFar("50"), true);
  assert.equal(regulaFade("A".repeat(16)), true);
  assert.equal(regulaFade("1000000"), true);
  assert.equal(regulaDim("HOLD"), true);
  assert.equal(regulaDim("WAIT"), true);
  assert.equal(regulaDark("SHUT"), true);
  assert.equal(regulaDark(false), true);
  assert.equal(regulaBlank("NONE"), true);
  assert.equal(regulaOpen(""), true);
  assert.equal(regulaHue("ZONE"), "gilt");
  assert.equal(regulaHue("SHUT"), "ash");
  assert.equal(regulaHue("HOLD"), "pearl");
  assert.equal(regulaLength("LIVE"), 4);
  assert.equal(regulaEven("LIVE"), true);
  assert.equal(regulaDigit("12night"), true);
  assert.equal(regulaLetter("ZONE"), true);
  assert.equal(regulaUpper("ISTANBUL"), true);
  assert.equal(regulaUpper("ZONE"), false);
  assert.equal(regulaLit("ABCDEFGH"), false);
  assert.equal(regulaDim("ABCDEFGH"), true);
  assert.equal(regulaLit("Europe/Istanbul"), true);
  assert.equal(regulaLit("clh0abc123def456"), false);
  assert.equal(regulaCopy("ZONE"), "ZONE");
  assert.equal(regulaLit({ balance: 1 }), false);
  assert.equal(regulaLit({ timezone: "ZONE" }), true);
  const rows: RegulaRow[] = [
    { id: "1", label: "Ada", code: "ZONE" },
    { id: "2", label: "Bea", code: "HOLD" },
  ];
  assert.equal(leadingRegula(rows), "link");
  assert.equal(leadingRegulaHue(rows), "gilt");
  assert.match(regulaLanesCsv(rows), /link,1/);
  assert.match(regulaRowsCsv(rows, ["1"]), /Ada,ZONE/);
  assert.match(regulaRowsCsv(rows, ["1"]), /,1$/m);
  assert.match(regulaRowsCsv(rows, ["1"]), /^name,timezone,lane,hue,reviewed/m);

  assert.equal(crmv4Text("en", "tglTitle"), ROUND396_COPY.en.tglTitle);
  assert.equal(crmv4Text("tr", "rglTitle"), ROUND396_COPY.tr.rglTitle);
  assert.equal(crmv4Text("de", "tglHint"), ROUND396_COPY.de.tglHint);
  assert.equal(crmv4Text("ru", "replyCymatiumKicker"), ROUND396_COPY.ru.replyCymatiumKicker);
  assert.equal(crmv4Text("ar", "domainListelLead"), ROUND396_COPY.ar.domainListelLead);
  const keys = Object.keys(ROUND396_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND396_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-triglyph/);
  assert.match(css, /\.c4-regula/);
  assert.match(css, /\.c4-triglyph-column/);
  assert.match(css, /\.c4-regula-column/);
  assert.match(css, /\.c4-reply-cymatium/);
  assert.match(css, /\.c4-domain-listel/);
  assert.match(css, /\.c4-reply-cymatium-mast/);
  assert.match(css, /\.c4-domain-listel-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round396.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /row\.timezone/);
  assert.match(viewFile, /triglyphCsv/);
  assert.match(viewFile, /regulaRowsCsv/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "x"/);
  assert.match(viewFile, /event\.key === "a"/);
  assert.match(viewFile, /event\.key === "c"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=24&meta=0/);
  assert.match(viewFile, /data-triglyph/);
  assert.match(viewFile, /data-regula/);
  assert.match(viewFile, /data-timezone/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestTriglyphBed/);
  assert.match(viewFile, /c4-regula-search/);
  assert.match(viewFile, /triglyphTimeline/);
  assert.match(viewFile, /c4-triglyph-notices/);
  assert.match(viewFile, /from "@\/lib\/crmv4\/round396"/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "tgl"/);
  assert.match(app, /view === "rgl"/);
  const reply = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round9.tsx"), "utf8");
  const domains = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round6.tsx"), "utf8");
  assert.match(reply, /c4-reply-cymatium/);
  assert.match(reply, /c4-reply-cymatium-mast/);
  assert.match(reply, /data-logo="mono"/);
  assert.match(reply, /replyCymatiumKicker/);
  assert.match(reply, /replyCymatiumLead/);
  assert.match(reply, /data-reply-cymatium/);
  assert.match(domains, /c4-domain-listel/);
  assert.match(domains, /c4-domain-listel-mast/);
  assert.match(domains, /domainListelKicker/);
  assert.match(domains, /domainListelLead/);
  assert.match(domains, /data-domain-listel/);
  const namedKeys = `${viewFile}\n${reply}\n${domains}`.match(/"(tgl|rgl|replyCymatium|domainListel)[A-Z][A-Za-z0-9]*"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND396_COPY.en[key as keyof typeof ROUND396_COPY.en], "string", key);
  console.log("crmv4 round396 tests passed");
}

main();
