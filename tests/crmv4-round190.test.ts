/**
 * Callback windows and invite rings.
 * Run: TZ=UTC npx tsx tests/crmv4-round190.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND190_COPY } from "../src/lib/crmv4/copy-round190";
import {
  activeHour,
  activeRank,
  activeWait,
  addCallback,
  addCallbackView,
  bulkCallbackTone,
  callbackTag,
  callbacksCsv,
  catalogInvite,
  catalogInviteCount,
  cyclePace,
  editCallback,
  editCallbackNote,
  evenInvite,
  evenInviteCount,
  fairOwner,
  homeTag,
  hourGap,
  hourOf,
  inviteBand,
  inviteRowsCsv,
  inviteState,
  invitesCsv,
  lateCallback,
  nextCallback,
  peakHour,
  quietHour,
  rankOf,
  readCallbacks,
  sharedInviteCount,
  soonCallback,
  suggestOwner,
  suggestTone,
  suggestWait,
  usedHours,
  visibleCallbacks,
  visibleInviteCustomers,
  waitDays,
  wideInvite,
  wideInviteCount,
} from "../src/lib/crmv4/round190";

function main() {
  assert.equal(callbackTag("  ada "), "ADA");
  assert.equal(callbackTag("bea"), "BEA");
  assert.equal(callbackTag("cya"), "CYA");
  assert.equal(callbackTag("   "), "");
  assert.equal(callbackTag("AD"), "");
  assert.equal(callbackTag("ADA1"), "");
  assert.equal(hourOf("0"), 0);
  assert.equal(hourOf(0), 0);
  assert.equal(hourOf("23"), 23);
  assert.equal(hourOf("9"), 9);
  assert.equal(hourOf("00"), null);
  assert.equal(hourOf("08"), null);
  assert.equal(hourOf("24"), null);
  assert.equal(hourOf(""), null);
  assert.equal(rankOf("1"), 1);
  assert.equal(rankOf(4), 4);
  assert.equal(rankOf("0"), null);
  assert.equal(rankOf("3"), null);
  assert.equal(rankOf("01"), null);
  assert.equal(waitDays("1"), 1);
  assert.equal(waitDays(7), 7);
  assert.equal(waitDays("0"), null);
  assert.equal(waitDays("03"), null);
  assert.equal(waitDays("2"), null);
  assert.equal(peakHour(9), true);
  assert.equal(peakHour(15), true);
  assert.equal(peakHour(0), false);
  assert.equal(quietHour(7), true);
  assert.equal(quietHour(21), true);
  assert.equal(quietHour(9), false);
  assert.equal(quietHour(15), false);
  assert.equal(hourGap(23, 0), 1);
  assert.equal(hourGap(0, 23), -1);
  assert.equal(hourGap(0, 12), 12);
  assert.equal(hourGap(12, 0), -12);
  assert.equal(hourGap(8, 13), 5);
  assert.equal(hourGap(null, 2), null);
  assert.equal(hourGap(2, ""), null);
  assert.equal(hourGap(2, 24), null);

  const saved = addCallback([], { id: "a", title: "Window Ada", note: "oak call", owner: "Nia", hour: "6", tone: "paper", tag: "ada", pace: "slow", rank: "4", wait: "1" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].hour, 6);
  assert.equal(saved[0].rank, 4);
  assert.equal(saved[0].wait, 1);
  assert.equal(saved[0].tag, "ADA");
  assert.equal(saved[0].note, "oak call");
  assert.equal(saved[0].audit, "save");
  assert.equal(homeTag(saved[0].tag), true);
  assert.equal(homeTag("US"), false);
  assert.equal(homeTag("ADA1"), false);
  assert.equal(soonCallback(saved[0]), true);
  assert.equal(addCallback(saved, { id: "b", title: "Window Ada" }).length, 1);
  assert.equal(addCallback(saved, { id: "a", title: "Other" }).length, 1);
  assert.equal(addCallback(saved, { id: "c", title: "   " }).length, 1);
  const capped = Array.from({ length: 12 }, (_, index) => ({ id: `n${index}`, title: `Line ${index}` })).reduce((cards, card) => addCallback(cards, card), [] as ReturnType<typeof addCallback>);
  assert.equal(capped.length, 8);
  assert.equal(capped.some((card) => card.title === "Line 0"), false);
  assert.equal(capped[0].title, "Line 11");

  const cycled = cyclePace(saved, "a");
  assert.equal(cycled[0].pace, "even");
  assert.equal(cycled[0].audit, "pace");
  assert.equal(cyclePace(cycled, "a")[0].pace, "brisk");
  assert.equal(cyclePace(cyclePace(cycled, "a"), "a")[0].pace, "slow");
  const blankPace = addCallback([], { id: "z", title: "Blank pace" });
  assert.equal(cyclePace(blankPace, "z")[0].pace, "slow");

  const edited = editCallback(saved, "a", "Window Bea");
  assert.equal(edited[0].title, "Window Bea");
  assert.equal(edited[0].audit, "edit");
  assert.equal(editCallback(edited, "a", "  ")[0].title, "Window Bea");
  const noted = editCallbackNote(edited, "a", "second look");
  assert.equal(noted[0].note, "second look");
  assert.equal(editCallbackNote(noted, "a", "  ")[0].note, "second look");
  const pair = addCallback(noted, { id: "b", title: "Window" });
  assert.equal(editCallback(pair, "a", "Window").find((card) => card.id === "a")?.title, "Window Bea");

  const early = addCallback([], { id: "a", title: "Early", hour: "8", tone: "gold", wait: "1", owner: "Nia", rank: "1" });
  const mid = addCallback(early, { id: "m", title: "Mid", hour: "15", tone: "ink", wait: "7", owner: "Ada", rank: "4", pace: "slow" });
  const open = addCallback(mid, { id: "b", title: "Later", hour: "21", pace: "brisk" });
  assert.equal(lateCallback(open.find((card) => card.title === "Early") as (typeof open)[number], 13), true);
  assert.equal(lateCallback(open.find((card) => card.title === "Early") as (typeof open)[number], 12), false);
  const earlyCard = open.find((card) => card.title === "Early") as (typeof open)[number];
  assert.equal(lateCallback({ ...earlyCard, done: true }, 13), false);
  assert.equal(nextCallback(open, 15), open.find((card) => card.title === "Mid")?.id);
  assert.equal(nextCallback(open, 16), open.find((card) => card.title === "Early")?.id);
  assert.equal(nextCallback(open, 21), open.find((card) => card.title === "Early")?.id);
  assert.equal(suggestTone([]), "gold");
  assert.equal(suggestTone(open), "paper");
  assert.equal(suggestOwner(open), "Ada");
  assert.equal(suggestWait([]), 3);
  assert.equal(suggestWait(open), 3);
  assert.equal(fairOwner(open, "Nia, Bea"), "Bea");
  assert.equal(fairOwner(open, ""), "Ada");
  assert.equal(usedHours(open), 3);
  assert.equal(bulkCallbackTone(open, ["b"], "mist").find((card) => card.id === "b")?.tone, "mist");
  assert.equal(activeHour("night"), "night");
  assert.equal(activeHour("24"), "all");
  assert.equal(activeHour("0"), "0");
  assert.equal(activeRank("4"), "4");
  assert.equal(activeWait("7"), "7");
  const shown = visibleCallbacks(open, "open", "mid", null, null, null, null, null, null, null, null, false, false, false, false);
  assert.equal(shown.length, 1);
  assert.equal(shown[0].title, "Mid");
  const quiet = visibleCallbacks(open, "open", "", null, null, null, null, null, null, null, null, false, false, false, true);
  assert.equal(quiet.length, 1);
  assert.equal(quiet[0].title, "Later");
  const views = addCallbackView([], { id: "v", name: "Night", tray: "open", query: "", owner: "all", tone: "all", tag: "all", pace: "all", hour: "night", rank: "all", wait: "all" });
  assert.equal(views.length, 1);
  assert.equal(views[0].hour, "night");
  const csv = callbacksCsv(open, 13);
  assert.equal(csv.startsWith("title,owner,hour"), true);
  assert.equal(csv.includes("amount"), false);
  assert.equal(readCallbacks([{ id: "", title: "Nope" }]).length, 0);

  const seed = "7fxa";
  const stem = "desk2";
  const branch = "ivory88";
  const crown = "champagn9";
  assert.equal(inviteBand(seed), "seed");
  assert.equal(inviteBand(stem), "stem");
  assert.equal(inviteBand(branch), "branch");
  assert.equal(inviteBand(crown), "crown");
  assert.equal(catalogInvite(seed), true);
  assert.equal(catalogInvite("gold"), false);
  assert.equal(catalogInvite("champagne"), false);
  assert.equal(wideInvite(crown), true);
  assert.equal(wideInvite(seed), false);
  assert.equal(evenInvite(seed), true);
  assert.equal(evenInvite(stem), false);
  const rows = [
    { id: "ada", label: "Ada", note: { referralCodeUsed: seed } },
    { id: "bea", label: "Bea", note: { referralCodeUsed: seed } },
    { id: "cy", label: "Cy", note: { referralCodeUsed: null } },
    { id: "dee", label: "Dee", note: { referralCodeUsed: stem, balance: 1 } },
    { id: "eve", label: "Eve", note: { referralCodeUsed: crown } },
    { id: "fay", label: "Fay", note: { referralCodeUsed: branch } },
  ];
  assert.equal(inviteState(seed), "set");
  assert.equal(inviteState({ referralCodeUsed: null }), "clear");
  assert.equal(inviteState({ referralCodeUsed: stem, balance: 1 }), "");
  assert.equal(inviteState("not-a-code"), "");
  assert.equal(inviteState(""), "clear");
  assert.equal(inviteState("desk24"), "");
  assert.equal(catalogInviteCount(rows), 4);
  assert.equal(wideInviteCount(rows), 2);
  assert.equal(evenInviteCount(rows), 2);
  assert.equal(sharedInviteCount(rows), 1);
  assert.equal(visibleInviteCustomers(rows, "seed", null, "", "all", [], "all").length, 2);
  assert.equal(visibleInviteCustomers(rows, null, null, "gus", "all", [], "all").length, 0);
  const bands = invitesCsv(rows);
  assert.equal(bands.startsWith("kind,mark,count"), true);
  assert.equal(bands.includes("amount"), false);
  assert.equal(bands.includes("catalog"), true);
  const queue = inviteRowsCsv(rows, ["ada"]);
  assert.equal(queue.includes("Ada"), true);
  assert.equal(queue.split("\n")[1].endsWith(",1"), true);

  assert.equal(crmv4Text("en", "cbkTitle"), ROUND190_COPY.en.cbkTitle);
  assert.equal(crmv4Text("tr", "irgTitle"), ROUND190_COPY.tr.irgTitle);
  assert.equal(crmv4Text("de", "cbkSearch"), ROUND190_COPY.de.cbkSearch);
  assert.equal(crmv4Text("ru", "irgHint"), ROUND190_COPY.ru.irgHint);
  assert.equal(crmv4Text("ar", "cbkNotice"), ROUND190_COPY.ar.cbkNotice);
  assert.notEqual(ROUND190_COPY.tr.cbkTitle, ROUND190_COPY.en.cbkTitle);
  assert.notEqual(ROUND190_COPY.de.irgTitle, ROUND190_COPY.en.irgTitle);
  assert.notEqual(ROUND190_COPY.ru.cbkSearch, ROUND190_COPY.en.cbkSearch);
  assert.notEqual(ROUND190_COPY.ar.irgSearch, ROUND190_COPY.en.irgSearch);
  const keys = Object.keys(ROUND190_COPY.en);
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND190_COPY[locale]), keys);
  }

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-cbw/);
  assert.match(css, /\.c4-irg/);
  assert.match(css, /\.c4-mkt-salon/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /#d4bc86/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round190.tsx"), "utf8");
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
  assert.equal(viewFile.includes("accountType"), false);
  assert.equal(viewFile.includes("validationStatus"), false);
  assert.equal(viewFile.includes("registrationDate"), false);
  assert.equal(viewFile.includes("birthDate"), false);
  assert.equal(viewFile.includes("lastContactAt"), false);
  assert.equal(viewFile.includes("assigneeId"), false);
  assert.match(viewFile, /referralCodeUsed/);
  assert.match(viewFile, /callbacksCsv/);
  assert.match(viewFile, /invitesCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "n"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(viewFile, /data-windows/);
  assert.match(viewFile, /data-rings/);
  assert.match(viewFile, /data-catalog/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /customers/);
  assert.match(viewFile, /suggestTone/);
  const marketing = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/views/Marketing.tsx"), "utf8");
  assert.match(marketing, /c4-mkt-salon/);
  assert.match(marketing, /data-logo="mono"/);
  assert.match(marketing, /c4-mkt-salon-mast/);
  assert.match(marketing, /c4-mkt-folio/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "cwin"/);
  assert.match(app, /view === "iring"/);
  assert.match(app, /CallbackWindows/);
  assert.match(app, /InviteRings/);
  console.log("crmv4 round190 tests passed");
}

main();
