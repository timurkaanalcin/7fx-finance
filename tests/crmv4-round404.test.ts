/**
 * Cymatium courses, fleuron referral plates, the ivory similar caulicole, and the graphite word calyx.
 * Run: TZ=UTC npx tsx tests/crmv4-round404.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND404_COPY } from "../src/lib/crmv4/copy-round404";
import { ROUND403_FEATURES } from "../src/lib/crmv4/round403";
import {
  ROUND404_FEATURES,
  activeBed,
  activeDepth,
  activeHour,
  activeProfile,
  addCymatium,
  addCymatiumView,
  briskCymatium,
  depthCount,
  dropCymatiumView,
  fairHand,
  fullDepth,
  idleCymatium,
  graphiteQuiet,
  lateCymatium,
  leadingFleuron,
  leadingFleuronHue,
  midDepth,
  moveCymatiumFocus,
  overdueCymatium,
  fleuronBlank,
  fleuronCopy,
  fleuronDark,
  fleuronDigit,
  fleuronDim,
  fleuronEven,
  fleuronFade,
  fleuronFar,
  fleuronHue,
  fleuronLanesCsv,
  fleuronLength,
  fleuronLetter,
  fleuronLit,
  fleuronNear,
  fleuronOpen,
  fleuronRowsCsv,
  fleuronSlice,
  fleuronUpper,
  profileBand,
  profileCool,
  profileGap,
  profilePoint,
  profileWarm,
  readCymatiumViews,
  reminderCymatiumList,
  restingCymatium,
  cymatiumBed,
  cymatiumHour,
  cymatiumTimeline,
  suggestProfile,
  suggestCymatiumBed,
  suggestCymatiumHour,
  type Cymatium,
  type FleuronRow,
} from "../src/lib/crmv4/round404";

function course(partial: Partial<Cymatium> & { id: string; title: string }): Cymatium {
  return {
    note: "",
    hand: "",
    profile: "",
    hour: null,
    bed: "",
    depth: 4,
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
  assert.equal(ROUND404_FEATURES.length, 25);
  assert.equal(new Set(ROUND404_FEATURES).size, 25);
  for (const feature of ROUND404_FEATURES) assert.equal((ROUND403_FEATURES as readonly string[]).includes(feature), false, feature);
  const libDir = path.join(__dirname, "../src/lib/crmv4");
  for (const feature of ROUND404_FEATURES) {
    const needle = `"${feature}"`;
    for (const file of fs.readdirSync(libDir)) {
      if (!file.endsWith(".ts") || file === "round404.ts") continue;
      const body = fs.readFileSync(path.join(libDir, file), "utf8");
      assert.equal(body.includes(needle), false, `${feature} in ${file}`);
    }
  }

  assert.equal(profilePoint(" cymatium "), "cymatium");
  assert.equal(profilePoint("jasper"), "");
  assert.equal(cymatiumHour("4"), 4);
  assert.equal(cymatiumHour(8), 8);
  assert.equal(cymatiumHour(12), 12);
  assert.equal(cymatiumHour(16), 16);
  assert.equal(cymatiumHour("5"), null);
  assert.equal(cymatiumHour("9"), null);
  assert.equal(depthCount("4"), 4);
  assert.equal(depthCount(8), 8);
  assert.equal(depthCount("12"), 12);
  assert.equal(depthCount("5"), null);
  assert.equal(depthCount("9"), null);
  assert.equal(cymatiumBed("ivory"), "IVORY");
  assert.equal(cymatiumBed("graphite"), "GRAPHITE");
  assert.equal(cymatiumBed("gilt"), "GILT");
  assert.equal(cymatiumBed("gold"), "");
  assert.equal(profileWarm("cymatium"), true);
  assert.equal(profileWarm("LISTEL"), true);
  assert.equal(profileWarm("soffit"), false);
  assert.equal(profileCool("soffit"), true);
  assert.equal(profileCool("archivolt"), true);
  assert.equal(profileCool("cymatium"), false);
  assert.equal(profileBand("cymatium"), "first");
  assert.equal(profileBand("listel"), "second");
  assert.equal(profileBand("soffit"), "third");
  assert.equal(profileBand("archivolt"), "fourth");
  assert.equal(profileGap("cymatium", "archivolt"), 3);
  assert.equal(profileGap("archivolt", "cymatium"), -3);
  assert.equal(profileGap("jasper", "cymatium"), null);
  assert.equal(graphiteQuiet("graphite"), true);
  assert.equal(graphiteQuiet("IVORY"), false);
  assert.equal(midDepth(8), true);
  assert.equal(midDepth(4), false);
  assert.equal(fullDepth(12), true);
  assert.equal(fullDepth(8), false);
  assert.equal(activeProfile("warm"), "warm");
  assert.equal(activeProfile("cool"), "cool");
  assert.equal(activeProfile("archivolt"), "archivolt");
  assert.equal(activeProfile("nope"), "all");
  assert.equal(activeHour("16"), "16");
  assert.equal(activeHour("3"), "all");
  assert.equal(activeDepth("12"), "12");
  assert.equal(activeDepth("1"), "all");
  assert.equal(activeBed("ivory", ["IVORY", "GRAPHITE"]), "IVORY");
  assert.equal(activeBed("gilt", ["IVORY"]), "all");
  assert.equal(moveCymatiumFocus(0, 4, -1), 3);
  assert.equal(suggestProfile(2), "cymatium");
  assert.equal(suggestProfile(10), "listel");
  assert.equal(suggestProfile(14), "soffit");
  assert.equal(suggestProfile(18), "archivolt");
  assert.equal(suggestCymatiumHour([], 3), 4);
  assert.equal(suggestCymatiumHour([], 10), 8);
  assert.equal(suggestCymatiumHour([], 14), 12);
  assert.equal(suggestCymatiumHour([], 20), 16);
  const saved = [
    course({ id: "a", title: "Ada", hour: 16 }),
    course({ id: "b", title: "Bea", hour: 8 }),
    course({ id: "c", title: "Cid", hour: 12 }),
  ];
  assert.equal(suggestCymatiumHour(saved, 20), 4);
  assert.equal(suggestCymatiumBed([course({ id: "g", title: "Gilt", bed: "GILT" })]), "GRAPHITE");
  assert.equal(fairHand([course({ id: "h", title: "Held", hand: "Nia" })], "Nia, Omar"), "Omar");

  const late = course({ id: "l", title: "Late", profile: "cymatium" });
  const overdue = course({ id: "o", title: "Over", profile: "archivolt", depth: 4 });
  const idle = course({ id: "i", title: "Idle", hour: 4, depth: 4, bed: "" });
  const brisk = course({ id: "b2", title: "Brisk", bed: "GRAPHITE", hour: 16, depth: 12 });
  const resting = course({ id: "r", title: "Rest", profile: "soffit", bed: "IVORY", hour: 8 });
  assert.equal(lateCymatium(late, "archivolt"), true);
  assert.equal(lateCymatium(late, "cymatium"), false);
  assert.equal(overdueCymatium(overdue), true);
  assert.equal(overdueCymatium({ ...overdue, raised: true }), false);
  assert.equal(idleCymatium(idle), true);
  assert.equal(briskCymatium(brisk), true);
  assert.equal(restingCymatium(resting), true);
  assert.deepEqual(reminderCymatiumList([overdue, late]), ["Over"]);
  const added = addCymatium([], { title: "New course", profile: "listel", hour: 8, depth: 8, bed: "ivory", tags: "c f x" });
  assert.equal(added.length, 1);
  assert.equal(added[0].profile, "listel");
  assert.equal(added[0].hour, 8);
  assert.equal(added[0].depth, 8);
  assert.equal(added[0].bed, "IVORY");
  assert.deepEqual(added[0].tags, ["c", "f"]);
  assert.equal(addCymatium(added, { title: "New course" }).length, 1);
  const view = { id: "v", name: "Warm", rack: "base" as const, query: "", hand: "", bed: "", profile: "warm", hour: "", depth: "" };
  assert.equal(addCymatiumView([], view).length, 1);
  assert.equal(dropCymatiumView(addCymatiumView([], view), "v").length, 0);
  assert.equal(readCymatiumViews([{ ...view, name: "" }]).length, 0);
  const line = cymatiumTimeline([course({ id: "t", title: "Tide", hour: 8 })]);
  assert.equal(line[0].hour, 8);
  assert.deepEqual(line[0].titles, ["Tide"]);

  assert.equal(fleuronLit("READY"), true);
  assert.equal(fleuronLit(true), true);
  assert.equal(fleuronLit(false), false);
  assert.equal(fleuronLit("OPEN"), true);
  assert.equal(fleuronLit("YES"), true);
  assert.equal(fleuronLit("LIVE"), false);
  assert.equal(fleuronNear("ABCD"), true);
  assert.equal(fleuronNear("LIVE"), true);
  assert.equal(fleuronNear("ABC"), false);
  assert.equal(fleuronFar("A"), true);
  assert.equal(fleuronFar("AB"), true);
  assert.equal(fleuronFar("ABCD"), false);
  assert.equal(fleuronFade("A".repeat(10)), true);
  assert.equal(fleuronFade("READY"), false);
  assert.equal(fleuronDim("HOLD"), true);
  assert.equal(fleuronDim("WAIT"), true);
  assert.equal(fleuronDark("SHUT"), true);
  assert.equal(fleuronDark(false), true);
  assert.equal(fleuronBlank("NONE"), true);
  assert.equal(fleuronOpen(""), true);
  assert.equal(fleuronHue("READY"), "gilt");
  assert.equal(fleuronHue("SHUT"), "ash");
  assert.equal(fleuronHue("HOLD"), "pearl");
  assert.equal(fleuronLength("OPEN"), 4);
  assert.equal(fleuronEven("OPEN"), true);
  assert.equal(fleuronDigit("12night"), true);
  assert.equal(fleuronLetter("READY"), true);
  assert.equal(fleuronUpper("ISTANBUL"), true);
  assert.equal(fleuronUpper("OPEN"), false);
  assert.equal(fleuronLit("ABCDEFGH"), false);
  assert.equal(fleuronDim("ABCDEFGH"), true);
  assert.equal(fleuronCopy("READY"), "READY");
  assert.equal(fleuronLit({ balance: 1 }), false);
  assert.equal(fleuronLit({ referralCodeUsed: "READY" }), true);
  assert.equal(fleuronLit(fleuronSlice({ referralCodeUsed: true, balance: 9 })), true);
  const rows: FleuronRow[] = [
    { id: "1", label: "Ada", code: "READY" },
    { id: "2", label: "Bea", code: "HOLD" },
  ];
  assert.equal(leadingFleuron(rows), "live");
  assert.equal(leadingFleuronHue(rows), "gilt");
  assert.match(fleuronLanesCsv(rows), /live,1/);
  assert.match(fleuronRowsCsv(rows, ["1"]), /Ada,READY/);
  assert.match(fleuronRowsCsv(rows, ["1"]), /,1$/m);
  assert.match(fleuronRowsCsv(rows, ["1"]), /^name,mark,lane,hue,reviewed/m);

  assert.equal(crmv4Text("en", "cymTitle"), ROUND404_COPY.en.cymTitle);
  assert.equal(crmv4Text("tr", "flrTitle"), ROUND404_COPY.tr.flrTitle);
  assert.equal(crmv4Text("de", "cymHint"), ROUND404_COPY.de.cymHint);
  assert.equal(crmv4Text("ru", "similarCaulicoleKicker"), ROUND404_COPY.ru.similarCaulicoleKicker);
  assert.equal(crmv4Text("ar", "wordCalyxLead"), ROUND404_COPY.ar.wordCalyxLead);
  const keys = Object.keys(ROUND404_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND404_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-cymatium/);
  assert.match(css, /\.c4-fleuron/);
  assert.match(css, /\.c4-cymatium-column/);
  assert.match(css, /\.c4-fleuron-column/);
  assert.match(css, /\.c4-similar-caulicole/);
  assert.match(css, /\.c4-word-calyx/);
  assert.match(css, /\.c4-similar-caulicole-mast/);
  assert.match(css, /\.c4-word-calyx-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round404.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.equal(viewFile.includes("totpSecret"), false);
  assert.match(viewFile, /fleuronSlice/);
  assert.match(viewFile, /cymatiumCsv/);
  assert.match(viewFile, /fleuronRowsCsv/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "x"/);
  assert.match(viewFile, /event\.key === "a"/);
  assert.match(viewFile, /event\.key === "c"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=24&meta=0/);
  assert.match(viewFile, /data-cymatium/);
  assert.match(viewFile, /data-fleuron/);
  assert.match(viewFile, /data-desk/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestCymatiumBed/);
  assert.match(viewFile, /c4-fleuron-search/);
  assert.match(viewFile, /cymatiumTimeline/);
  assert.match(viewFile, /c4-cymatium-notices/);
  assert.match(viewFile, /from "@\/lib\/crmv4\/round404"/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "cym"/);
  assert.match(app, /view === "flr"/);
  const panels = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round11.tsx"), "utf8");
  assert.match(panels, /c4-similar-caulicole/);
  assert.match(panels, /c4-similar-caulicole-mast/);
  assert.match(panels, /data-logo="mono"/);
  assert.match(panels, /similarCaulicoleKicker/);
  assert.match(panels, /similarCaulicoleLead/);
  assert.match(panels, /data-similar-caulicole/);
  assert.match(panels, /c4-word-calyx/);
  assert.match(panels, /c4-word-calyx-mast/);
  assert.match(panels, /wordCalyxKicker/);
  assert.match(panels, /wordCalyxLead/);
  assert.match(panels, /data-word-calyx/);
  const namedKeys = `${viewFile}\n${panels}`.match(/"(cym|flr|similarCaulicole|wordCalyx)[A-Z][A-Za-z0-9]*"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND404_COPY.en[key as keyof typeof ROUND404_COPY.en], "string", key);
  console.log("crmv4 round404 tests passed");
}

main();
