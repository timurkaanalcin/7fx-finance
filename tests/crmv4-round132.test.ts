/**
 * Porter slips and validation statuses.
 * Run: npx tsx tests/crmv4-round132.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND132_COPY } from "../src/lib/crmv4/copy-round132";
import { crmv4Text } from "../src/lib/crmv4/copy";
import {
  activeValidation,
  addSlip,
  leadingValidation,
  namedValidations,
  readHiddenValidations,
  readSlips,
  resetSlips,
  setSlipCalled,
  setSlipHidden,
  slipCopy,
  slipText,
  slipsCsv,
  toggleSlipPin,
  toggleValidation,
  validationLines,
  validationShare,
  validationText,
  visibleCustomers,
  visibleSlips,
  visibleValidations,
  wingLabel,
} from "../src/lib/crmv4/round132";

function main() {
  assert.equal(slipText("  Keys\nB  "), "Keys B");
  assert.equal(slipText("   "), "");
  assert.equal(slipText("x".repeat(140)).length, 100);
  assert.equal(wingLabel("  East  "), "East");
  assert.equal(wingLabel("   "), "");
  assert.equal(wingLabel("y".repeat(40)).length, 12);
  assert.deepEqual(readSlips([{ id: "", text: "Ada" }, { id: "1", text: "  " }, { id: "2", text: "Hold the bag", wing: "  ", pinned: 1, called: 1 }, "nope"]), [
    { id: "2", text: "Hold the bag", wing: "", pinned: false, called: false, hidden: false },
  ]);
  const saved = addSlip([], { id: "a", text: " Hold the bag ", wing: " East " });
  assert.deepEqual(saved, [{ id: "a", text: "Hold the bag", wing: "East", pinned: false, called: false, hidden: false }]);
  assert.equal(addSlip(saved, { id: "b", text: "  " }).length, 1);
  assert.equal(addSlip(saved, { id: "c", text: "Hold the bag" }).length, 1);
  assert.equal(addSlip(saved, { id: "a", text: "Other bag" }).length, 1);
  const pinned = toggleSlipPin(saved, "a");
  assert.equal(pinned[0].pinned, true);
  const called = setSlipCalled(pinned, "a", true);
  assert.equal(called[0].called, true);
  const hidden = setSlipHidden(called, "a", true);
  assert.equal(hidden[0].hidden, true);
  assert.deepEqual(visibleSlips(pinned, "open", "bag").map((slip) => slip.id), ["a"]);
  assert.deepEqual(visibleSlips(pinned, "open", "east"), []);
  assert.deepEqual(visibleSlips(called, "open", ""), []);
  assert.deepEqual(visibleSlips(called, "called", "").map((slip) => slip.id), ["a"]);
  assert.deepEqual(visibleSlips(hidden, "called", ""), []);
  assert.deepEqual(visibleSlips(hidden, "hidden", "").map((slip) => slip.id), ["a"]);
  assert.equal(slipCopy("  Hold the bag "), "Hold the bag");
  assert.equal(slipCopy("   "), "");
  assert.deepEqual(resetSlips(), []);
  const many = Array.from({ length: 40 }, (_, index) => ({ id: `n${index}`, text: `Slip ${index}`, wing: "" }));
  assert.equal(readSlips(many).length, 36);
  assert.equal(slipsCsv([{ id: "", text: "skip" }, { id: "a", text: 'Hold "the" bag', wing: "Bay, 2", pinned: true, called: false, hidden: false }]), 'text,wing,pinned,called,hidden\n"Hold ""the"" bag","Bay, 2",1,0,0');
  assert.equal(slipsCsv([]), "text,wing,pinned,called,hidden");
  assert.equal(slipsCsv(saved).includes("amount"), false);

  assert.equal(validationText(" VERIFIED "), "VERIFIED");
  assert.equal(validationText({ validation: " PENDING " }), "PENDING");
  assert.equal(validationText(""), "");
  assert.equal(validationText(1 as never), "");
  assert.equal(validationText({ saleStatus: "NEW" }), "");
  assert.equal(validationText({ retentionStatus: "ACTIVE" }), "");
  assert.equal(validationText({ potentialStatus: "HIGH" }), "");
  assert.equal(validationText({ documentsStatus: "APPROVED" }), "");
  assert.equal(validationText({ accountType: "VIP" }), "");
  assert.equal(validationText({ role: "TRADER" }), "");
  assert.equal(validationText({ timezone: "UTC" }), "");
  assert.equal(validationText({ language: "en" }), "");
  const rows = [
    { id: "u1", label: "Ada", validation: "VERIFIED" },
    { id: "u2", label: "Bea", validation: { validation: "PENDING" } },
    { id: "u3", label: "Cid", validation: "VERIFIED" },
    { id: "u4", label: "Dot", validation: "" },
    { id: "u5", label: "Eve", validation: { saleStatus: "NEW" } as never },
  ];
  assert.deepEqual(validationLines(rows), [
    { validation: "", count: 2 },
    { validation: "PENDING", count: 1 },
    { validation: "VERIFIED", count: 2 },
  ]);
  assert.deepEqual(namedValidations(rows), ["PENDING", "VERIFIED"]);
  assert.equal(validationShare(2, 5), 40);
  assert.equal(validationShare(0, 5), 0);
  assert.equal(validationShare(1, 0), 0);
  assert.equal(leadingValidation(rows), "VERIFIED");
  assert.equal(leadingValidation([{ validation: "" }]), "");
  assert.deepEqual(visibleCustomers(rows, "VERIFIED", false, "ada").map((row) => row.id), ["u1"]);
  assert.deepEqual(visibleCustomers(rows, "", true, "").map((row) => row.id), ["u4", "u5"]);
  assert.deepEqual(visibleCustomers(rows, "VERIFIED", false, "100"), []);
  assert.deepEqual(readHiddenValidations(["VERIFIED", "OLD", ""], ["VERIFIED", "PENDING"]), ["VERIFIED"]);
  assert.deepEqual(toggleValidation(["VERIFIED"], "OLD", ["VERIFIED"]), ["VERIFIED"]);
  assert.deepEqual(visibleValidations(["VERIFIED", "PENDING"], ["PENDING"], false), ["VERIFIED"]);
  assert.equal(activeValidation("PENDING", ["VERIFIED"]), "");
  assert.equal(validationLines(rows).every((line) => !("amount" in line) && !("currency" in line)), true);

  const copy = Object.keys(ROUND132_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND132_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "prtTitle"), "Porter slips");
  assert.equal(crmv4Text("tr", "vldTitle"), ROUND132_COPY.tr.vldTitle);
  assert.equal(crmv4Text("de", "prtWing"), ROUND132_COPY.de.prtWing);
  assert.equal(crmv4Text("ru", "vldBlank"), ROUND132_COPY.ru.vldBlank);
  assert.equal(crmv4Text("ar", "vldBoard"), ROUND132_COPY.ar.vldBoard);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-porter/);
  assert.match(css, /\.c4-validation/);
  assert.match(css, /\.c4-pagehead-folio/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round132.tsx"), "utf8");
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("setInterval"), false);
  assert.equal(view.includes("fetch("), false);
  assert.equal(view.includes("amount"), false);
  assert.equal(view.includes("currency"), false);
  assert.equal(view.includes("balance"), false);
  assert.equal(view.includes("saleStatus"), false);
  assert.equal(view.includes("retentionStatus"), false);
  assert.equal(view.includes("potentialStatus"), false);
  assert.equal(view.includes("documentsStatus"), false);
  assert.equal(view.includes("accountType"), false);
  assert.match(view, /validationStatus/);
  assert.match(view, /slipsCsv/);
  assert.match(view, /Escape/);
  assert.match(view, /event\.key !== "\/"/);
  assert.match(view, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(view, /data-porter/);
  assert.match(view, /data-validation/);
  assert.match(view, /data-logo="mono"/);
  assert.match(view, /customers/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "porter"/);
  assert.match(app, /view === "valstat"/);
  assert.match(app, /c4-pagehead-folio/);
  assert.match(app, /data-logo="mono"/);
  console.log("crmv4 round132 tests passed");
}

main();
