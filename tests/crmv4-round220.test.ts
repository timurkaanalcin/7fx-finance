/**
 * Loggia slips and city crests.
 * Run: TZ=UTC npx tsx tests/crmv4-round220.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND220_COPY } from "../src/lib/crmv4/copy-round220";
import {
  activeBay,
  activeBell,
  activeTempo,
  addSlip,
  addSlipTag,
  addSlipView,
  bayGap,
  bayOf,
  bellOf,
  catalogCity,
  catalogCityCount,
  cityLane,
  cityRowsCsv,
  cityState,
  cityStep,
  cityTone,
  crestOf,
  crestsCsv,
  cycleTempo,
  densityOf,
  fairSteward,
  houseWeave,
  lateSlip,
  leadingCity,
  moveFocus,
  peakBay,
  quietBay,
  rankOf,
  readSlipViews,
  setSlipRank,
  sharedCrestCount,
  snoozeSlip,
  suggestBell,
  suggestWeave,
  weaveOf,
  wideCity,
  windowSlips,
  slipsCsv,
} from "../src/lib/crmv4/round220";

function main() {
  assert.equal(weaveOf("  linen "), "LINEN");
  assert.equal(weaveOf("graphite"), "GRAPHITE");
  assert.equal(weaveOf("champagne"), "CHAMPAGNE");
  assert.equal(weaveOf("   "), "");
  assert.equal(weaveOf("oak"), "");
  assert.equal(bayOf("1"), 1);
  assert.equal(bayOf(6), 6);
  assert.equal(bayOf("6"), 6);
  assert.equal(bayOf("0"), null);
  assert.equal(bayOf(0), null);
  assert.equal(bayOf("7"), null);
  assert.equal(bayOf("06"), null);
  assert.equal(bayOf(""), null);
  assert.equal(bayOf(1.5), null);
  assert.equal(bellOf("10"), 10);
  assert.equal(bellOf(20), 20);
  assert.equal(bellOf("60"), 60);
  assert.equal(bellOf("9"), null);
  assert.equal(bellOf("010"), null);
  assert.equal(rankOf("1"), 1);
  assert.equal(rankOf(3), 3);
  assert.equal(rankOf("5"), 5);
  assert.equal(rankOf("0"), null);
  assert.equal(rankOf("2"), null);
  assert.equal(peakBay(2), true);
  assert.equal(peakBay(5), true);
  assert.equal(peakBay(4), false);
  assert.equal(quietBay(6), true);
  assert.equal(quietBay(1), false);
  assert.equal(bayGap(1, 6), 5);
  assert.equal(bayGap(6, 1), -5);
  assert.equal(bayGap(null, 3), null);
  assert.equal(bayGap(1, 0), null);
  assert.equal(houseWeave("linen"), true);
  assert.equal(houseWeave("CHAMPAGNE"), true);
  assert.equal(houseWeave("graphite"), false);
  assert.equal(activeBay("peak"), "peak");
  assert.equal(activeBay("6"), "6");
  assert.equal(activeBay("7"), "all");
  assert.equal(activeBell("20"), "20");
  assert.equal(activeBell("9"), "all");
  assert.equal(activeTempo("flare", ["hush", "glide", "flare"]), "flare");
  assert.equal(activeTempo("nope", ["hush", "glide", "flare"]), "all");
  assert.equal(densityOf("close"), "close");
  assert.equal(densityOf("nope"), "roomy");
  assert.equal(moveFocus(0, 3, 1), 1);
  assert.equal(moveFocus(0, 3, -1), 2);
  assert.equal(suggestWeave([]), "LINEN");
  assert.equal(suggestBell([]), 20);

  const first = addSlip([], {
    id: "a",
    title: "  North arch ",
    note: "quiet",
    steward: "Ada",
    bay: "1",
    weave: "linen",
    tempo: "hush",
    bell: "10",
    tags: "a b c d z",
    rank: "3",
  });
  assert.equal(first.length, 1);
  assert.equal(first[0].title, "North arch");
  assert.equal(first[0].weave, "LINEN");
  assert.equal(first[0].bay, 1);
  assert.equal(first[0].bell, 10);
  assert.deepEqual(first[0].tags, ["a", "b", "c", "d"]);
  assert.equal(first[0].rank, 3);
  assert.equal(addSlip(first, { id: "a", title: "Other" }).length, 1);
  assert.equal(addSlip(first, { id: "b", title: "  " }).length, 1);
  const tagged = addSlipTag(first, "a", "a");
  assert.deepEqual(tagged[0].tags, ["a", "b", "c", "d"]);
  const raised = setSlipRank(first, "a", 1);
  assert.equal(raised[0].rank, 1);
  assert.equal(raised[0].audit, "rank");
  const snoozed = snoozeSlip(addSlip([], { id: "s", title: "Bell", bell: 10 }), "s");
  assert.equal(snoozed[0].bell, 20);
  assert.equal(snoozeSlip(snoozed, "s")[0].bell, 60);
  const cycled = cycleTempo(addSlip([], { id: "t", title: "Tempo", tempo: "hush" }), "t");
  assert.equal(cycled[0].tempo, "glide");
  const late = addSlip([], { id: "l", title: "Late bay", bay: 1, rank: 1 });
  assert.equal(lateSlip(late[0], 4), true);
  assert.equal(lateSlip(late[0], 2), false);
  assert.equal(windowSlips(late, 2).length, 1);
  assert.equal(fairSteward(first, "Bea,Ada"), "Bea");
  const views = addSlipView([], {
    id: "v",
    name: "Peak court",
    tray: "open",
    query: "arch",
    steward: "all",
    weave: "linen",
    tempo: "all",
    bay: "peak",
    bell: "10",
    rank: "1",
  });
  assert.equal(readSlipViews(views)[0].weave, "LINEN");
  assert.equal(readSlipViews(views)[0].bay, "peak");
  assert.match(slipsCsv(first, 4), /North arch,Ada,1,LINEN,hush,10,3,a b c d/);

  assert.equal(crestOf("  Paris "), "PAR");
  assert.equal(cityLane("paris"), "court");
  assert.equal(cityLane("saint-malo"), "square");
  assert.equal(cityLane("lyon"), "boulevard");
  assert.equal(cityLane(""), "");
  assert.equal(cityTone("vienna"), "gold");
  assert.equal(cityTone("los angeles"), "ivory");
  assert.equal(cityTone("new york"), "mist");
  assert.equal(cityTone("lyon"), "ink");
  assert.equal(cityState(""), "clear");
  assert.equal(cityState(null), "clear");
  assert.equal(cityState({ lastCity: "Milan" }), "set");
  assert.equal(cityState({ lastCity: "Milan", email: "1" }), "");
  assert.equal(catalogCity("London"), true);
  assert.equal(catalogCity("Cairo"), true);
  assert.equal(catalogCity("lyon"), false);
  assert.equal(wideCity("lyon"), false);
  assert.equal(wideCity("los angeles"), true);
  assert.equal(cityStep(""), 0);
  assert.equal(cityStep("lyon"), 1);
  assert.equal(cityStep("new york"), 2);
  assert.equal(cityStep("saint-malo"), 3);
  const people = [
    { id: "1", label: "Ada", note: "paris" },
    { id: "2", label: "Bea", note: "parma" },
    { id: "3", label: "Cy", note: "los angeles" },
  ];
  assert.equal(leadingCity(people), "boulevard");
  assert.equal(sharedCrestCount(people), 2);
  assert.equal(catalogCityCount(people), 1);
  assert.match(crestsCsv(people), /court,1/);
  assert.match(cityRowsCsv(people, ["2"]), /Bea,PAR,boulevard,ink,1,0,0,1/);

  const keys = Object.keys(ROUND220_COPY.en);
  assert.ok(keys.length >= 120);
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND220_COPY[locale]).sort(), keys.slice().sort());
    for (const key of keys) {
      assert.equal(typeof ROUND220_COPY[locale][key as keyof typeof ROUND220_COPY.en], "string");
      assert.ok(ROUND220_COPY[locale][key as keyof typeof ROUND220_COPY.en].length > 0);
    }
  }
  assert.equal(crmv4Text("tr", "lgsTitle"), ROUND220_COPY.tr.lgsTitle);
  assert.equal(crmv4Text("de", "ctcrTitle"), ROUND220_COPY.de.ctcrTitle);
  assert.equal(crmv4Text("ru", "lgsSub"), ROUND220_COPY.ru.lgsSub);
  assert.equal(crmv4Text("ar", "ctySub"), ROUND220_COPY.ar.ctySub);
  assert.equal(crmv4Text("en", "lgsLogo"), "7FX");

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-lgs/);
  assert.match(css, /\.c4-cty-index/);
  assert.match(css, /\.c4-cust-loggia/);
  assert.match(css, /\.c4-cty-time/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round220.tsx"), "utf8");
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
  assert.equal(viewFile.includes("validationStatus"), false);
  assert.equal(viewFile.includes("registrationDate"), false);
  assert.equal(viewFile.includes("birthDate"), false);
  assert.equal(viewFile.includes("lastContactAt"), false);
  assert.equal(viewFile.includes("assigneeId"), false);
  assert.equal(viewFile.includes("lastBrowser"), false);
  assert.equal(viewFile.includes("isResident"), false);
  assert.equal(viewFile.includes("phone"), false);
  assert.equal(viewFile.includes("email"), false);
  assert.equal(viewFile.includes("tradingGroup"), false);
  assert.match(viewFile, /lastCity/);
  assert.match(viewFile, /slipsCsv/);
  assert.match(viewFile, /crestsCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "n"/);
  assert.match(viewFile, /event\.key === "j"/);
  assert.match(viewFile, /event\.key === "p"/);
  assert.match(viewFile, /event\.key === "b"/);
  assert.match(viewFile, /event\.key === "f"/);
  assert.match(viewFile, /event\.key === "y"/);
  assert.match(viewFile, /event\.key === "h"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(viewFile, /data-slips/);
  assert.match(viewFile, /data-crests/);
  assert.match(viewFile, /data-catalog/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /customers/);
  assert.match(viewFile, /suggestWeave/);
  assert.match(viewFile, /c4-cty-time/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "lgsl"/);
  assert.match(app, /view === "ctcr"/);
  assert.match(app, /LoggiaSlips/);
  assert.match(app, /CityCrests/);
  assert.match(app, /c4-pagehead-loggia/);
  assert.match(app, /c4-rail-loggia/);
  const customers = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/views/Customers.tsx"), "utf8");
  assert.match(customers, /c4-cust-loggia/);
  assert.match(customers, /c4-cust-loggia-index/);
  assert.match(customers, /data-logo="mono"/);
  const used = new Set(viewFile.match(/v4\("([a-zA-Z0-9]+)"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of used) assert.ok(key in ROUND220_COPY.en, key);
  console.log("crmv4 round220 tests passed");
}

main();
