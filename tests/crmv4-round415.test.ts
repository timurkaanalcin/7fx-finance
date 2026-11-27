/**
 * Keelson courses, hachure document plates, the ivory profile selvedge, and the graphite document deckle.
 * Run: TZ=UTC npx tsx tests/crmv4-round415.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND415_COPY } from "../src/lib/crmv4/copy-round415";
import { ROUND414_FEATURES } from "../src/lib/crmv4/round414";
import {
  ROUND415_FEATURES,
  activeBed,
  activeDepth,
  activeHour,
  activeProfile,
  addKeelson,
  addKeelsonView,
  briskKeelson,
  depthCount,
  dropKeelsonView,
  fairHand,
  fullDepth,
  idleKeelson,
  ivoryQuiet,
  lateKeelson,
  leadingHachure,
  leadingHachureHue,
  midDepth,
  moveKeelsonFocus,
  overdueKeelson,
  hachureBlank,
  hachureCopy,
  hachureDark,
  hachureDigit,
  hachureDim,
  hachureEven,
  hachureFade,
  hachureFar,
  hachureHue,
  hachureLanesCsv,
  hachureLength,
  hachureLetter,
  hachureLit,
  hachureNear,
  hachureOpen,
  hachureRowsCsv,
  hachureSlice,
  hachureUpper,
  profileBand,
  profileCool,
  profileGap,
  profilePoint,
  profileWarm,
  readKeelsonViews,
  reminderKeelsonList,
  restingKeelson,
  keelsonBed,
  keelsonHour,
  keelsonTimeline,
  suggestProfile,
  suggestKeelsonBed,
  suggestKeelsonHour,
  type Keelson,
  type HachureRow,
} from "../src/lib/crmv4/round415";

function course(partial: Partial<Keelson> & { id: string; title: string }): Keelson {
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
  assert.equal(ROUND415_FEATURES.length, 25);
  assert.equal(new Set(ROUND415_FEATURES).size, 25);
  for (const feature of ROUND415_FEATURES) assert.equal((ROUND414_FEATURES as readonly string[]).includes(feature), false, feature);
  const libDir = path.join(__dirname, "../src/lib/crmv4");
  for (const feature of ROUND415_FEATURES) {
    const needle = `"${feature}"`;
    for (const file of fs.readdirSync(libDir)) {
      if (!file.endsWith(".ts") || file === "round415.ts") continue;
      const body = fs.readFileSync(path.join(libDir, file), "utf8");
      assert.equal(body.includes(needle), false, `${feature} in ${file}`);
    }
  }

  assert.equal(profilePoint(" keelson "), "keelson");
  assert.equal(profilePoint("jasper"), "");
  assert.equal(keelsonHour("2"), 2);
  assert.equal(keelsonHour(5), 5);
  assert.equal(keelsonHour(10), 10);
  assert.equal(keelsonHour(20), 20);
  assert.equal(keelsonHour("1"), null);
  assert.equal(keelsonHour("3"), null);
  assert.equal(depthCount("2"), 2);
  assert.equal(depthCount(4), 4);
  assert.equal(depthCount("8"), 8);
  assert.equal(depthCount("1"), null);
  assert.equal(depthCount("3"), null);
  assert.equal(keelsonBed("ivory"), "IVORY");
  assert.equal(keelsonBed("graphite"), "GRAPHITE");
  assert.equal(keelsonBed("gilt"), "GILT");
  assert.equal(keelsonBed("gold"), "");
  assert.equal(profileWarm("keelson"), true);
  assert.equal(profileWarm("GARBOARD"), true);
  assert.equal(profileWarm("strake"), false);
  assert.equal(profileCool("strake"), true);
  assert.equal(profileCool("ribband"), true);
  assert.equal(profileCool("keelson"), false);
  assert.equal(profileBand("keelson"), "first");
  assert.equal(profileBand("garboard"), "second");
  assert.equal(profileBand("strake"), "third");
  assert.equal(profileBand("ribband"), "fourth");
  assert.equal(profileGap("keelson", "ribband"), 3);
  assert.equal(profileGap("ribband", "keelson"), -3);
  assert.equal(profileGap("jasper", "keelson"), null);
  assert.equal(ivoryQuiet("ivory"), true);
  assert.equal(ivoryQuiet("GRAPHITE"), false);
  assert.equal(midDepth(4), true);
  assert.equal(midDepth(2), false);
  assert.equal(fullDepth(8), true);
  assert.equal(fullDepth(4), false);
  assert.equal(activeProfile("warm"), "warm");
  assert.equal(activeProfile("cool"), "cool");
  assert.equal(activeProfile("ribband"), "ribband");
  assert.equal(activeProfile("nope"), "all");
  assert.equal(activeHour("10"), "10");
  assert.equal(activeHour("1"), "all");
  assert.equal(activeDepth("8"), "8");
  assert.equal(activeDepth("1"), "all");
  assert.equal(activeBed("ivory", ["IVORY", "GRAPHITE"]), "IVORY");
  assert.equal(activeBed("gilt", ["IVORY"]), "all");
  assert.equal(moveKeelsonFocus(0, 4, -1), 3);
  assert.equal(suggestProfile(1), "keelson");
  assert.equal(suggestProfile(3), "garboard");
  assert.equal(suggestProfile(6), "strake");
  assert.equal(suggestProfile(12), "ribband");
  assert.equal(suggestKeelsonHour([], 1), 2);
  assert.equal(suggestKeelsonHour([], 3), 5);
  assert.equal(suggestKeelsonHour([], 6), 10);
  assert.equal(suggestKeelsonHour([], 12), 20);
  const saved = [
    course({ id: "a", title: "Ada", hour: 20 }),
    course({ id: "b", title: "Bea", hour: 5 }),
    course({ id: "c", title: "Cid", hour: 10 }),
  ];
  assert.equal(suggestKeelsonHour(saved, 20), 2);
  assert.equal(suggestKeelsonBed([course({ id: "g", title: "Gilt", bed: "GILT" })]), "IVORY");
  assert.equal(fairHand([course({ id: "h", title: "Held", hand: "Nia" })], "Nia, Omar"), "Omar");

  const late = course({ id: "l", title: "Late", profile: "keelson" });
  const overdue = course({ id: "o", title: "Over", profile: "ribband", depth: 2 });
  const idle = course({ id: "i", title: "Idle", hour: 2, depth: 2, bed: "" });
  const brisk = course({ id: "b2", title: "Brisk", bed: "IVORY", hour: 20, depth: 8 });
  const resting = course({ id: "r", title: "Rest", profile: "strake", bed: "GRAPHITE", hour: 5 });
  assert.equal(lateKeelson(late, "ribband"), true);
  assert.equal(lateKeelson(late, "keelson"), false);
  assert.equal(overdueKeelson(overdue), true);
  assert.equal(overdueKeelson({ ...overdue, raised: true }), false);
  assert.equal(idleKeelson(idle), true);
  assert.equal(briskKeelson(brisk), true);
  assert.equal(restingKeelson(resting), true);
  assert.deepEqual(reminderKeelsonList([overdue, late]), ["Over"]);
  const added = addKeelson([], { title: "New course", profile: "garboard", hour: 5, depth: 4, bed: "ivory", tags: "k s z" });
  assert.equal(added.length, 1);
  assert.equal(added[0].profile, "garboard");
  assert.equal(added[0].hour, 5);
  assert.equal(added[0].depth, 4);
  assert.equal(added[0].bed, "IVORY");
  assert.deepEqual(added[0].tags, ["k", "s"]);
  assert.equal(addKeelson(added, { title: "New course" }).length, 1);
  const view = { id: "v", name: "Warm", rack: "base" as const, query: "", hand: "", bed: "", profile: "warm", hour: "", depth: "" };
  assert.equal(addKeelsonView([], view).length, 1);
  assert.equal(dropKeelsonView(addKeelsonView([], view), "v").length, 0);
  assert.equal(readKeelsonViews([{ ...view, name: "" }]).length, 0);
  const line = keelsonTimeline([course({ id: "t", title: "Tide", hour: 5 })]);
  assert.equal(line[0].hour, 5);
  assert.deepEqual(line[0].titles, ["Tide"]);

  assert.equal(hachureLit("APPROVED"), true);
  assert.equal(hachureLit("COMPLETE"), true);
  assert.equal(hachureLit("ready"), true);
  assert.equal(hachureLit("FILED"), true);
  assert.equal(hachureLit("YES"), true);
  assert.equal(hachureHue("APPROVED"), "gilt");
  assert.equal(hachureFar("A"), true);
  assert.equal(hachureLit(true), true);
  assert.equal(hachureLit(false), false);
  assert.equal(hachureLit("DOC-AB"), true);
  assert.equal(hachureNear("DOC-ABC"), true);
  assert.equal(hachureNear("ABCD"), true);
  assert.equal(hachureNear("AB"), false);
  assert.equal(hachureFar("A"), true);
  assert.equal(hachureFar("AB"), false);
  assert.equal(hachureFade("A".repeat(16)), true);
  assert.equal(hachureFade("DOC-" + "A".repeat(10)), true);
  assert.equal(hachureFade("A".repeat(8)), false);
  assert.equal(hachureDim("WAIT"), true);
  assert.equal(hachureDim("MISSING"), true);
  assert.equal(hachureDim("AB"), true);
  assert.equal(hachureDark("OFF"), true);
  assert.equal(hachureDark(false), false);
  assert.equal(hachureDark("REJECTED"), true);
  assert.equal(hachureBlank("UNFILED"), true);
  assert.equal(hachureBlank("NONE"), true);
  assert.equal(hachureOpen(""), true);
  assert.equal(hachureHue("OFF"), "ash");
  assert.equal(hachureHue("WAIT"), "pearl");
  assert.equal(hachureLength("ABCD"), 4);
  assert.equal(hachureEven("AB"), true);
  assert.equal(hachureDigit("12night"), true);
  assert.equal(hachureLetter("READY"), true);
  assert.equal(hachureUpper("ISTANBUL"), true);
  assert.equal(hachureUpper("VIP"), false);
  assert.equal(hachureLit("ABCDEFGH"), false);
  assert.equal(hachureDim("ABCDEFGH"), true);
  assert.equal(hachureCopy("READY"), "READY");
  assert.equal(hachureLit({ balance: 1 }), false);
  assert.equal(hachureLit({ documentsStatus: "APPROVED" }), true);
  assert.equal(hachureLit(hachureSlice({ documentsStatus: true, balance: 9 })), true);
  const rows: HachureRow[] = [
    { id: "1", label: "Ada", code: "APPROVED" },
    { id: "2", label: "Bea", code: "PENDING" },
  ];
  assert.equal(leadingHachure(rows), "live");
  assert.equal(leadingHachureHue(rows), "gilt");
  assert.match(hachureLanesCsv(rows), /live,1/);
  assert.match(hachureRowsCsv(rows, ["1"]), /Ada,APPROVED/);
  assert.match(hachureRowsCsv(rows, ["1"]), /,1$/m);
  assert.match(hachureRowsCsv(rows, ["1"]), /^name,documents,lane,hue,reviewed/m);

  assert.equal(crmv4Text("en", "klsTitle"), ROUND415_COPY.en.klsTitle);
  assert.equal(crmv4Text("tr", "hchTitle"), ROUND415_COPY.tr.hchTitle);
  assert.equal(crmv4Text("de", "klsHint"), ROUND415_COPY.de.klsHint);
  assert.equal(crmv4Text("ru", "slvSelvedgeKicker"), ROUND415_COPY.ru.slvSelvedgeKicker);
  assert.equal(crmv4Text("ar", "dkDeckleLead"), ROUND415_COPY.ar.dkDeckleLead);
  const keys = Object.keys(ROUND415_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND415_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-kln415/);
  assert.match(css, /\.c4-hcr415/);
  assert.match(css, /\.c4-kln415-column/);
  assert.match(css, /\.c4-hcr415-column/);
  assert.match(css, /\.c4-profile-selvedge/);
  assert.match(css, /\.c4-gallery-deckle/);
  assert.match(css, /\.c4-profile-selvedge-mast/);
  assert.match(css, /\.c4-gallery-deckle-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round415.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.equal(viewFile.includes("totpSecret"), false);
  assert.match(viewFile, /hachureSlice/);
  assert.match(viewFile, /keelsonCsv/);
  assert.match(viewFile, /hachureRowsCsv/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "x"/);
  assert.match(viewFile, /event\.key === "a"/);
  assert.match(viewFile, /event\.key === "c"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=24&meta=0/);
  assert.match(viewFile, /data-kln415/);
  assert.match(viewFile, /data-hcr415/);
  assert.match(viewFile, /data-documents/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestKeelsonBed/);
  assert.match(viewFile, /c4-hcr415-search/);
  assert.match(viewFile, /keelsonTimeline/);
  assert.match(viewFile, /c4-kln415-notices/);
  assert.match(viewFile, /from "@\/lib\/crmv4\/round415"/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "kln"/);
  assert.match(app, /view === "hcr"/);
  const profile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round7.tsx"), "utf8");
  const gallery = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round6.tsx"), "utf8");
  assert.match(profile, /c4-profile-selvedge/);
  assert.match(profile, /c4-profile-selvedge-mast/);
  assert.match(profile, /data-logo="mono"/);
  assert.match(profile, /slvSelvedgeKicker/);
  assert.match(profile, /slvSelvedgeLead/);
  assert.match(profile, /data-profile-selvedge/);
  assert.match(gallery, /c4-gallery-deckle/);
  assert.match(gallery, /c4-gallery-deckle-mast/);
  assert.match(gallery, /dkDeckleKicker/);
  assert.match(gallery, /dkDeckleLead/);
  assert.match(gallery, /data-gallery-deckle/);
  const namedKeys = `${viewFile}\n${profile}\n${gallery}`.match(/"(kls|hch|slvSelvedge|dkDeckle)[A-Z][A-Za-z0-9]*"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND415_COPY.en[key as keyof typeof ROUND415_COPY.en], "string", key);
  console.log("crmv4 round415 tests passed");
}

main();
