/**
 * Open/closed page windows. Run: npx tsx tests/position-pages.test.ts
 */
import assert from "node:assert/strict";
import { PUBLIC_DEFAULT_LOCALE } from "../src/lib/i18n/locales";
import {
  CLOSED_PAGE,
  CLOSED_REFRESH_CAP,
  closedRefreshTake,
  concatUniqueById,
  engineOnOpenPage,
  pageSkip,
} from "../src/lib/position-pages";

function main() {
  assert.equal(PUBLIC_DEFAULT_LOCALE, "en");
  assert.equal(engineOnOpenPage(0), true);
  assert.equal(engineOnOpenPage(200), false);
  assert.equal(pageSkip(null), 0);
  assert.equal(pageSkip("-4"), 0);
  assert.equal(pageSkip("50.9"), 50);
  assert.equal(pageSkip("999999999"), 100_000);

  assert.equal(closedRefreshTake(null), CLOSED_PAGE);
  assert.equal(closedRefreshTake("10"), CLOSED_PAGE);
  assert.equal(closedRefreshTake("80"), 80);
  assert.equal(closedRefreshTake("5000"), CLOSED_REFRESH_CAP);

  const rows = concatUniqueById([
    [{ id: "a" }, { id: "b" }],
    [{ id: "b" }, { id: "c" }],
  ]);
  assert.deepEqual(rows.map((row) => row.id), ["a", "b", "c"]);

  console.log("position-pages tests passed");
}

main();
