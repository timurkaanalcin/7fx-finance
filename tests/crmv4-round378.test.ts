/**
 * Cartouche rules, grisaille phones, the ivory key-facts predella, and the graphite section lambrequin.
 * Run: TZ=UTC npx tsx tests/crmv4-round378.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND378_COPY } from "../src/lib/crmv4/copy-round378";
import { ROUND377_FEATURES } from "../src/lib/crmv4/round377";
import {
  ROUND378_FEATURES,
  activeFilm,
  activeHand,
  activeRib,
  activeSpan,
  addCartouche,
  briskCartouche,
  cartoucheTimeline,
  dropCartoucheView,
  fairCarver,
  fullRib,
  graphiteQuiet,
  gsaBare,
  gsaBrief,
  gsaDesk,
  gsaDigit,
  gsaEven,
  gsaFirst,
  gsaHue,
  gsaLane,
  gsaLanesCsv,
  gsaLater,
  gsaLength,
  gsaLine,
  gsaLower,
  gsaOpen,
  gsaPair,
  gsaReturn,
  gsaRowsCsv,
  gsaScope,
  gsaShut,
  gsaSoon,
  gsaSpace,
  gsaSpanLane,
  gsaUpper,
  gsaVowel,
  gsaVowelLane,
  handBand,
  handCool,
  handFilm,
  handGap,
  handPoint,
  handRib,
  handSpan,
  handWarm,
  idleCartouche,
  lateCartouche,
  leadingGsa,
  leadingGsaHue,
  moveCartoucheFocus,
  overdueCartouche,
  pairRib,
  readCartoucheViews,
  reminderCartouches,
  restingCartouche,
  suggestFilm,
  suggestHand,
  suggestSpan,
  type Cartouche,
  type GsaRow,
} from "../src/lib/crmv4/round378";

function rule(partial: Partial<Cartouche> & { id: string; title: string }): Cartouche {
  return {
    note: "",
    carver: "",
    hand: "",
    sla: null,
    film: "",
    rib: 3,
    tags: [],
    raised: false,
    clipped: false,
    coffered: false,
    starred: false,
    audit: "",
    ...partial,
  };
}

function main() {
  assert.equal(ROUND378_FEATURES.length, 25);
  assert.equal(new Set(ROUND378_FEATURES).size, 25);
  for (const feature of ROUND378_FEATURES) assert.equal((ROUND377_FEATURES as readonly string[]).includes(feature), false, feature);
  assert.equal(handPoint(" pomme "), "pomme");
  assert.equal(handPoint("brass"), "");
  assert.equal(handSpan("10"), 10);
  assert.equal(handSpan(20), 20);
  assert.equal(handSpan(40), 40);
  assert.equal(handSpan(80), 80);
  assert.equal(handSpan("15"), null);
  assert.equal(handSpan("4"), null);
  assert.equal(handRib("3"), 3);
  assert.equal(handRib(5), 5);
  assert.equal(handRib("7"), 7);
  assert.equal(handRib("4"), null);
  assert.equal(handRib("8"), null);
  assert.equal(handFilm("ivory"), "IVORY");
  assert.equal(handFilm("graphite"), "GRAPHITE");
  assert.equal(handFilm("champagne"), "CHAMPAGNE");
  assert.equal(handFilm("gold"), "");
  assert.equal(handWarm("pomme"), true);
  assert.equal(handWarm("LANCE"), true);
  assert.equal(handWarm("feuille"), false);
  assert.equal(handCool("feuille"), true);
  assert.equal(handCool("alpha"), true);
  assert.equal(handCool("pomme"), false);
  assert.equal(handBand("pomme"), "first");
  assert.equal(handBand("lance"), "second");
  assert.equal(handBand("feuille"), "third");
  assert.equal(handBand("alpha"), "fourth");
  assert.equal(handGap("pomme", "alpha"), 3);
  assert.equal(graphiteQuiet("graphite"), true);
  assert.equal(graphiteQuiet("ivory"), false);
  assert.equal(graphiteQuiet("champagne"), false);
  assert.equal(pairRib(5), true);
  assert.equal(pairRib(3), false);
  assert.equal(fullRib(7), true);
  assert.equal(fullRib(5), false);
  assert.equal(activeHand("warm"), "warm");
  assert.equal(activeSpan("10"), "10");
  assert.equal(activeSpan("4"), "all");
  assert.equal(activeRib("7"), "7");
  assert.equal(activeRib("4"), "all");
  assert.equal(activeFilm("ivory", ["IVORY"]), "IVORY");
  assert.equal(suggestHand(4), "pomme");
  assert.equal(suggestHand(10), "lance");
  assert.equal(suggestHand(14), "feuille");
  assert.equal(suggestHand(20), "alpha");
  assert.equal(suggestSpan([], 1), 10);
  assert.equal(suggestSpan([], 6), 20);
  assert.equal(suggestSpan([], 11), 20);
  assert.equal(suggestSpan([], 16), 40);
  assert.equal(suggestSpan([], 19), 80);
  assert.equal(suggestFilm([]), "IVORY");
  assert.equal(moveCartoucheFocus(0, 3, 1), 1);
  assert.equal(moveCartoucheFocus(0, 3, -1), 2);

  const saved = addCartouche([], { id: "g1", title: "Pomme cartouche", carver: "Ada", hand: "pomme", sla: 10, film: "ivory", rib: 3, tags: "c d x" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].film, "IVORY");
  assert.equal(saved[0].tags.join(""), "cd");
  assert.equal(saved[0].audit, "save");
  assert.equal(addCartouche(saved, { title: "Pomme cartouche" }).length, 1);
  const alpha = rule({ id: "n1", title: "Alpha cartouche", hand: "alpha", rib: 3 });
  assert.equal(overdueCartouche(alpha), true);
  assert.equal(reminderCartouches([alpha])[0], "Alpha cartouche");
  assert.equal(idleCartouche(rule({ id: "i1", title: "Idle", sla: 10, rib: 3 })), true);
  assert.equal(briskCartouche(rule({ id: "b1", title: "Brisk", film: "CHAMPAGNE", sla: 80, rib: 7 })), true);
  assert.equal(restingCartouche(rule({ id: "r1", title: "Rest", hand: "alpha", film: "IVORY", sla: 20 })), true);
  assert.equal(lateCartouche(rule({ id: "l1", title: "Late", hand: "pomme" }), "alpha"), true);
  assert.equal(lateCartouche(rule({ id: "l2", title: "Held", hand: "pomme", raised: true }), "alpha"), false);
  assert.equal(fairCarver([rule({ id: "a", title: "A", carver: "Ada" }), rule({ id: "b", title: "B", carver: "Bea", raised: true })], "Ada,Bea"), "Bea");
  const timeline = cartoucheTimeline([rule({ id: "t", title: "Ten", sla: 10 })]);
  assert.equal(timeline[0].sla, 10);
  assert.equal(timeline[0].titles[0], "Ten");
  const views = readCartoucheViews([{ id: "v1", name: "Alpha deck", tray: "coffer", query: "cartouche", carver: "Ada", film: "GRAPHITE", hand: "cool", sla: "80", rib: "7" }]);
  assert.equal(views[0].tray, "coffer");
  assert.equal(views[0].hand, "cool");
  assert.equal(dropCartoucheView(views, "v1").length, 0);

  const now = Date.parse("2026-11-26T12:00:00Z");
  assert.equal(gsaLane("CALL", now), "line");
  assert.equal(gsaLane("please ring the desk", now), "line");
  assert.equal(gsaLane(true, now), "line");
  assert.equal(gsaLane(false, now), "bare");
  assert.equal(gsaLane("WAIT", now), "desk");
  assert.equal(gsaLane("LATER", now), "later");
  assert.equal(gsaLane("BAD", now), "return");
  assert.equal(gsaLane("TWIN", now), "pair");
  assert.equal(gsaLane("TR+90", now), "pair");
  assert.equal(gsaLane("hidden phone", now), "shut");
  assert.equal(gsaLane("ext:12", now), "scope");
  assert.equal(gsaLane("ABCDEF", now), "brief");
  assert.equal(gsaLane("12night", now), "digit");
  assert.equal(gsaLane("5551112233", now), "desk");
  assert.equal(gsaLane("+905551112233", now), "line");
  assert.equal(gsaLane("AUSTRALIAXXXXXXX", now), "span");
  assert.equal(gsaLane("Italy", now), "openv");
  assert.equal(gsaLane("Spain", now), "bare");
  assert.equal(gsaLane("2026-11-26T08:00:00Z", now), "line");
  assert.equal(gsaLane("2026-11-25T08:00:00Z", now), "desk");
  assert.equal(gsaLane("2026-11-20T00:00:00Z", now), "later");
  assert.equal(gsaLane("2026-11-01T08:00:00Z", now), "return");
  assert.equal(gsaLane({ phone: "READY" }, now), "line");
  assert.equal(gsaLane({ name: "Ada" }, now), "");
  assert.equal(gsaLane({ phone: "READY", amount: 1 }, now), "");
  assert.equal(gsaHue("CALL", now), "champagne");
  assert.equal(gsaHue("WAIT", now), "graphite");
  assert.equal(gsaHue("ABCDEF", now), "ivory");
  assert.equal(gsaLine("CALL", now), true);
  assert.equal(gsaDesk("WAIT", now), true);
  assert.equal(gsaLater("LATER", now), true);
  assert.equal(gsaReturn("BAD", now), true);
  assert.equal(gsaShut("sealed", now), true);
  assert.equal(gsaPair("TR+90", now), true);
  assert.equal(gsaScope("ext:12", now), true);
  assert.equal(gsaBrief("ABCDEF", now), true);
  assert.equal(gsaSpanLane("AUSTRALIAXXXXXXX", now), true);
  assert.equal(gsaBare("Spain", now), true);
  assert.equal(gsaOpen(""), true);
  assert.equal(gsaSoon("ABCDEF", now), true);
  assert.equal(gsaSoon("WESTX", now), false);
  assert.equal(gsaLength("ABCDEF"), 6);
  assert.equal(gsaEven("CALL"), true);
  assert.equal(gsaDigit("12night"), true);
  assert.equal(gsaVowel("Italy"), true);
  assert.equal(gsaVowelLane("Italy", now), true);
  assert.equal(gsaLower("spain"), true);
  assert.equal(gsaUpper("SPAIN"), true);
  assert.equal(gsaUpper("TR"), false);
  assert.equal(gsaFirst("Spain"), true);
  assert.equal(gsaSpace("new spain"), true);
  const rows: GsaRow[] = [
    { id: "1", label: "Ada", code: "CALL" },
    { id: "2", label: "Bea", code: "ABCDEF" },
  ];
  assert.equal(leadingGsa(rows), "line");
  assert.equal(leadingGsaHue(rows), "champagne");
  assert.match(gsaLanesCsv(rows), /line,1/);
  assert.match(gsaRowsCsv(rows, ["1"]), /Ada,CALL/);
  assert.match(gsaRowsCsv(rows, ["1"]), /,1$/m);

  assert.equal(crmv4Text("en", "crtTitle"), ROUND378_COPY.en.crtTitle);
  assert.equal(crmv4Text("tr", "gsaTitle"), ROUND378_COPY.tr.gsaTitle);
  assert.equal(crmv4Text("de", "crtHint"), ROUND378_COPY.de.crtHint);
  assert.equal(crmv4Text("ru", "kfPredellaKicker"), ROUND378_COPY.ru.kfPredellaKicker);
  assert.equal(crmv4Text("ar", "mnLambrequinLead"), ROUND378_COPY.ar.mnLambrequinLead);
  const keys = Object.keys(ROUND378_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND378_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-cartouche/);
  assert.match(css, /\.c4-grisaille/);
  assert.match(css, /\.c4-cartouche-column/);
  assert.match(css, /\.c4-grisaille-column/);
  assert.match(css, /\.c4-facts-predella/);
  assert.match(css, /\.c4-mini-lambrequin/);
  assert.match(css, /\.c4-facts-predella-mast/);
  assert.match(css, /\.c4-mini-lambrequin-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round378.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /phone:/);
  assert.match(viewFile, /cartoucheCsv/);
  assert.match(viewFile, /gsaRowsCsv/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "x"/);
  assert.match(viewFile, /event\.key === "a"/);
  assert.match(viewFile, /event\.key === "c"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=24&meta=0/);
  assert.match(viewFile, /data-cards/);
  assert.match(viewFile, /data-plates/);
  assert.match(viewFile, /data-names/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestFilm/);
  assert.match(viewFile, /c4-grisaille-search/);
  assert.match(viewFile, /cartoucheTimeline/);
  assert.match(viewFile, /c4-cartouche-notices/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "crt"/);
  assert.match(app, /view === "gsa"/);
  const desk = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round12.tsx"), "utf8");
  assert.match(desk, /c4-facts-predella/);
  assert.match(desk, /c4-facts-predella-mast/);
  assert.match(desk, /data-logo="mono"/);
  assert.match(desk, /kfPredellaKicker/);
  assert.match(desk, /kfPredellaLead/);
  assert.match(desk, /data-facts-predella/);
  assert.match(desk, /c4-mini-lambrequin/);
  assert.match(desk, /c4-mini-lambrequin-mast/);
  assert.match(desk, /mnLambrequinKicker/);
  assert.match(desk, /mnLambrequinLead/);
  assert.match(desk, /data-mini-lambrequin/);
  const namedKeys = `${viewFile}\n${desk}`.match(/"(crt|gsa|kfPredella|mnLambrequin)[A-Za-z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND378_COPY.en[key as keyof typeof ROUND378_COPY.en], "string", key);
  console.log("crmv4 round378 tests passed");
}

main();
