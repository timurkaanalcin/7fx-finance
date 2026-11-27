/**
 * Sima courses, metope panels, the graphite completeness annulet, and the ivory position ovolo.
 * Run: TZ=UTC npx tsx tests/crmv4-round394.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND394_COPY } from "../src/lib/crmv4/copy-round394";
import { ROUND393_FEATURES } from "../src/lib/crmv4/round393";
import {
  ROUND394_FEATURES,
  activeBed,
  activeDepth,
  activeHour,
  activeProfile,
  addSima,
  addSimaView,
  metopeBlank,
  metopeCopy,
  metopeDigit,
  metopeDark,
  metopeDim,
  metopeEven,
  metopeFar,
  metopeFade,
  metopeHue,
  metopeLanesCsv,
  metopeLength,
  metopeLetter,
  metopeLit,
  metopeNear,
  metopeOpen,
  metopeRowsCsv,
  metopeUpper,
  briskSima,
  depthCount,
  dropSimaView,
  fairHand,
  fullDepth,
  ivoryQuiet,
  idleSima,
  lateSima,
  leadingMetope,
  leadingMetopeHue,
  midDepth,
  moveSimaFocus,
  simaBed,
  simaHour,
  simaTimeline,
  overdueSima,
  profileBand,
  profileCool,
  profileGap,
  profilePoint,
  profileWarm,
  readSimaViews,
  reminderSimaList,
  restingSima,
  suggestSimaBed,
  suggestSimaHour,
  suggestProfile,
  type Sima,
  type MetopeRow,
} from "../src/lib/crmv4/round394";

function course(partial: Partial<Sima> & { id: string; title: string }): Sima {
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
  assert.equal(ROUND394_FEATURES.length, 25);
  assert.equal(new Set(ROUND394_FEATURES).size, 25);
  for (const feature of ROUND394_FEATURES) assert.equal((ROUND393_FEATURES as readonly string[]).includes(feature), false, feature);
  const libDir = path.join(__dirname, "../src/lib/crmv4");
  for (const feature of ROUND394_FEATURES) {
    const needle = `"${feature}"`;
    for (const file of fs.readdirSync(libDir)) {
      if (!file.endsWith(".ts") || file === "round394.ts") continue;
      const body = fs.readFileSync(path.join(libDir, file), "utf8");
      assert.equal(body.includes(needle), false, `${feature} in ${file}`);
    }
  }

  assert.equal(profilePoint(" sima "), "sima");
  assert.equal(profilePoint("jasper"), "");
  assert.equal(simaHour("2"), 2);
  assert.equal(simaHour(6), 6);
  assert.equal(simaHour(10), 10);
  assert.equal(simaHour(14), 14);
  assert.equal(simaHour("3"), null);
  assert.equal(simaHour("7"), null);
  assert.equal(depthCount("2"), 2);
  assert.equal(depthCount(5), 5);
  assert.equal(depthCount("8"), 8);
  assert.equal(depthCount("1"), null);
  assert.equal(depthCount("4"), null);
  assert.equal(simaBed("ivory"), "IVORY");
  assert.equal(simaBed("graphite"), "GRAPHITE");
  assert.equal(simaBed("champagne"), "CHAMPAGNE");
  assert.equal(simaBed("gold"), "");
  assert.equal(profileWarm("sima"), true);
  assert.equal(profileWarm("CYMA"), true);
  assert.equal(profileWarm("torus"), false);
  assert.equal(profileCool("scotia"), true);
  assert.equal(profileCool("torus"), true);
  assert.equal(profileCool("sima"), false);
  assert.equal(profileBand("sima"), "first");
  assert.equal(profileBand("cyma"), "second");
  assert.equal(profileBand("scotia"), "third");
  assert.equal(profileBand("torus"), "fourth");
  assert.equal(profileGap("sima", "torus"), 3);
  assert.equal(profileGap("torus", "cyma"), -2);
  assert.equal(profileGap("gold", "torus"), null);
  assert.equal(ivoryQuiet("ivory"), true);
  assert.equal(ivoryQuiet("graphite"), false);
  assert.equal(midDepth(5), true);
  assert.equal(midDepth(2), false);
  assert.equal(fullDepth(8), true);
  assert.equal(fullDepth(5), false);
  assert.equal(activeProfile("warm"), "warm");
  assert.equal(activeProfile("cool"), "cool");
  assert.equal(activeProfile("nope"), "all");
  assert.equal(activeHour(6), "6");
  assert.equal(activeHour(4), "all");
  assert.equal(activeBed("ivory", ["IVORY", "GRAPHITE", "CHAMPAGNE"]), "IVORY");
  assert.equal(activeDepth(8), "8");
  assert.equal(activeDepth(2), "2");
  assert.equal(activeDepth(1), "all");
  assert.equal(moveSimaFocus(0, 4, -1), 3);
  assert.equal(suggestProfile(2), "sima");
  assert.equal(suggestProfile(8), "cyma");
  assert.equal(suggestProfile(12), "scotia");
  assert.equal(suggestProfile(20), "torus");
  assert.equal(suggestSimaHour([], 2), 2);
  assert.equal(suggestSimaHour([], 6), 6);
  assert.equal(suggestSimaHour([], 8), 6);
  assert.equal(suggestSimaHour([], 12), 10);
  assert.equal(suggestSimaHour([], 20), 14);
  const cornice = [
    course({ id: "a", title: "Ada", bed: "IVORY", profile: "sima", hour: 2, hand: "Nia" }),
    course({ id: "b", title: "Bea", bed: "IVORY", profile: "torus", hour: 6, hand: "Nia" }),
  ];
  assert.equal(suggestSimaBed(cornice), "GRAPHITE");
  assert.equal(suggestSimaHour(cornice, 3), 10);
  assert.equal(fairHand(cornice, "Nia,Omar"), "Omar");

  const saved = addSima([], { title: "  Corso  ", profile: "scotia", hour: 14, bed: "ivory", depth: 8, tags: "s m s x" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].profile, "scotia");
  assert.equal(saved[0].hour, 14);
  assert.equal(saved[0].bed, "IVORY");
  assert.equal(saved[0].depth, 8);
  assert.deepEqual(saved[0].tags, ["s", "m"]);
  assert.equal(saved[0].audit, "save");
  assert.equal(addSima(saved, { title: "Corso" }).length, 1);

  const views = addSimaView([], { id: "v1", name: "Quiet", rack: "yard", query: "", hand: "", bed: "ivory", profile: "warm", hour: "2", depth: "5" });
  assert.equal(readSimaViews(views)[0].bed, "IVORY");
  assert.equal(readSimaViews(views)[0].profile, "warm");
  assert.equal(dropSimaView(views, "v1").length, 0);

  const late = course({ id: "l", title: "Late", profile: "sima" });
  const idle = course({ id: "i", title: "Idle", hour: 2 });
  const brisk = course({ id: "r", title: "Brisk", bed: "CHAMPAGNE", hour: 14, depth: 8 });
  const rest = course({ id: "s", title: "Rest", profile: "scotia", bed: "GRAPHITE", hour: 6 });
  const due = course({ id: "d", title: "Due", profile: "torus", depth: 2 });
  assert.equal(lateSima(late, "torus"), true);
  assert.equal(lateSima(late, "sima"), false);
  assert.equal(idleSima(idle), true);
  assert.equal(briskSima(brisk), true);
  assert.equal(restingSima(rest), true);
  assert.equal(overdueSima(due), true);
  assert.deepEqual(reminderSimaList([due, late]), ["Due"]);
  const timeline = simaTimeline([course({ id: "t", title: "Ten", hour: 6 })]);
  assert.equal(timeline[0].hour, 6);
  assert.deepEqual(timeline[0].titles, ["Ten"]);

  assert.equal(metopeLit("LINK"), true);
  assert.equal(metopeLit(true), true);
  assert.equal(metopeNear("9desk"), true);
  assert.equal(metopeFar("ab"), true);
  assert.equal(metopeFade("A".repeat(25)), true);
  assert.equal(metopeDim("HOLD"), true);
  assert.equal(metopeDim("WAIT"), true);
  assert.equal(metopeDark("MISS"), true);
  assert.equal(metopeDark(false), true);
  assert.equal(metopeBlank("NONE"), true);
  assert.equal(metopeOpen(""), true);
  assert.equal(metopeHue("LINK"), "gilt");
  assert.equal(metopeHue("SHUT"), "ash");
  assert.equal(metopeHue("HOLD"), "pearl");
  assert.equal(metopeLength("LINK"), 4);
  assert.equal(metopeEven("LINK"), true);
  assert.equal(metopeDigit("12night"), true);
  assert.equal(metopeLetter("LINK"), true);
  assert.equal(metopeUpper("ISTANBUL"), true);
  assert.equal(metopeUpper("LINK"), false);
  assert.equal(metopeLit("ABCDEFGH"), true);
  assert.equal(metopeLit("clh0abc123def456"), true);
  assert.equal(metopeCopy("LINK"), "LINK");
  assert.equal(metopeLit({ balance: 1 }), false);
  assert.equal(metopeLit({ tradingAccountId: "LINK" }), true);
  const rows: MetopeRow[] = [
    { id: "1", label: "Ada", code: "LINK" },
    { id: "2", label: "Bea", code: "HOLD" },
  ];
  assert.equal(leadingMetope(rows), "link");
  assert.equal(leadingMetopeHue(rows), "gilt");
  assert.match(metopeLanesCsv(rows), /link,1/);
  assert.match(metopeRowsCsv(rows, ["1"]), /Ada,LINK/);
  assert.match(metopeRowsCsv(rows, ["1"]), /,1$/m);
  assert.match(metopeRowsCsv(rows, ["1"]), /^name,tradingAccountId,lane,hue,reviewed/m);

  assert.equal(crmv4Text("en", "smaTitle"), ROUND394_COPY.en.smaTitle);
  assert.equal(crmv4Text("tr", "mtpTitle"), ROUND394_COPY.tr.mtpTitle);
  assert.equal(crmv4Text("de", "smaHint"), ROUND394_COPY.de.smaHint);
  assert.equal(crmv4Text("ru", "completeAnnuletKicker"), ROUND394_COPY.ru.completeAnnuletKicker);
  assert.equal(crmv4Text("ar", "positionOvoloLead"), ROUND394_COPY.ar.positionOvoloLead);
  const keys = Object.keys(ROUND394_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND394_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-sima/);
  assert.match(css, /\.c4-metope/);
  assert.match(css, /\.c4-sima-column/);
  assert.match(css, /\.c4-metope-column/);
  assert.match(css, /\.c4-complete-annulet/);
  assert.match(css, /\.c4-position-ovolo/);
  assert.match(css, /\.c4-complete-annulet-mast/);
  assert.match(css, /\.c4-position-ovolo-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round394.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /row\.tradingAccountId/);
  assert.match(viewFile, /simaCsv/);
  assert.match(viewFile, /metopeRowsCsv/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "x"/);
  assert.match(viewFile, /event\.key === "a"/);
  assert.match(viewFile, /event\.key === "c"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=24&meta=0/);
  assert.match(viewFile, /data-sima/);
  assert.match(viewFile, /data-metope/);
  assert.match(viewFile, /data-account/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestSimaBed/);
  assert.match(viewFile, /c4-metope-search/);
  assert.match(viewFile, /simaTimeline/);
  assert.match(viewFile, /c4-sima-notices/);
  assert.match(viewFile, /from "@\/lib\/crmv4\/round394"/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "sma"/);
  assert.match(app, /view === "mtp"/);
  const meter = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round7.tsx"), "utf8");
  const age = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round8.tsx"), "utf8");
  assert.match(meter, /c4-complete-annulet/);
  assert.match(meter, /c4-complete-annulet-mast/);
  assert.match(meter, /data-logo="mono"/);
  assert.match(meter, /completeAnnuletKicker/);
  assert.match(meter, /completeAnnuletLead/);
  assert.match(meter, /data-complete-annulet/);
  assert.match(age, /c4-position-ovolo/);
  assert.match(age, /c4-position-ovolo-mast/);
  assert.match(age, /positionOvoloKicker/);
  assert.match(age, /positionOvoloLead/);
  assert.match(age, /data-position-ovolo/);
  const namedKeys = `${viewFile}\n${meter}\n${age}`.match(/"(sma|mtp|completeAnnulet|positionOvolo)[A-Z][A-Za-z0-9]*"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND394_COPY.en[key as keyof typeof ROUND394_COPY.en], "string", key);
  console.log("crmv4 round394 tests passed");
}

main();
