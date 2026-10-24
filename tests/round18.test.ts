/**
 * Merged ticket paging. Run: npx tsx tests/round18.test.ts
 */
import assert from "node:assert/strict";
import { PUBLIC_DEFAULT_LOCALE } from "../src/lib/i18n/locales";
import { mergeTicketWindow } from "../src/lib/ticket-page";

function row(kind: "DEPOSIT" | "MARGIN" | "WITHDRAW", id: string, openedAt: string) {
  return { kind, id, openedAt };
}

function main() {
  assert.equal(PUBLIC_DEFAULT_LOCALE, "en");

  const filled = mergeTicketWindow(
    [
      {
        kind: "DEPOSIT" as const,
        rows: [row("DEPOSIT", "d1", "2026-01-03T00:00:00Z"), row("DEPOSIT", "d2", "2026-01-02T00:00:00Z")],
        extra: true,
      },
      { kind: "MARGIN" as const, rows: [], extra: false },
      { kind: "WITHDRAW" as const, rows: [], extra: false },
    ],
    { deposit: 0, margin: 0, withdraw: 0 },
    2
  );
  assert.deepEqual(filled.tickets.map((ticket) => ticket.id), ["d1", "d2"]);
  assert.equal(filled.hasMore, true);
  assert.deepEqual(filled.cursors, { deposit: 2, margin: 0, withdraw: 0 });

  const mixed = mergeTicketWindow(
    [
      {
        kind: "DEPOSIT" as const,
        rows: [row("DEPOSIT", "d1", "2026-01-05T00:00:00Z"), row("DEPOSIT", "d2", "2026-01-01T00:00:00Z")],
        extra: false,
      },
      {
        kind: "MARGIN" as const,
        rows: [row("MARGIN", "m1", "2026-01-04T00:00:00Z")],
        extra: true,
      },
      {
        kind: "WITHDRAW" as const,
        rows: [row("WITHDRAW", "w1", "2026-01-03T00:00:00Z")],
        extra: false,
      },
    ],
    { deposit: 4, margin: 1, withdraw: 0 },
    2
  );
  assert.deepEqual(mixed.tickets.map((ticket) => ticket.id), ["d1", "m1"]);
  assert.equal(mixed.hasMore, true);
  assert.deepEqual(mixed.cursors, { deposit: 5, margin: 2, withdraw: 0 });

  const done = mergeTicketWindow(
    [
      { kind: "DEPOSIT" as const, rows: [row("DEPOSIT", "d9", "2026-01-01T00:00:00Z")], extra: false },
      { kind: "MARGIN" as const, rows: [], extra: false },
      { kind: "WITHDRAW" as const, rows: [row("WITHDRAW", "w9", "2026-01-02T00:00:00Z")], extra: false },
    ],
    { deposit: 10, margin: 0, withdraw: 3 },
    50
  );
  assert.deepEqual(done.tickets.map((ticket) => ticket.id), ["w9", "d9"]);
  assert.equal(done.hasMore, false);
  assert.deepEqual(done.cursors, { deposit: 11, margin: 0, withdraw: 4 });

  console.log("round18 ticket page tests passed");
}

main();
