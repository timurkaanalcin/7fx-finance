/**
 * CRM inbox ordering, unread counts, and viewer-locale timestamps.
 * Run: npx tsx tests/crm-inbox.test.ts
 */
import assert from "node:assert/strict";
import {
  compareByLatestCustomer,
  formatChatStamp,
  isCustomerMessage,
  unreadCustomerCount,
  viewerIntlLocale,
} from "../src/lib/crm-inbox";

const t = (createdAt: string, workerName: string | null = null, extra?: { workerId?: string; automatic?: boolean }) => ({
  createdAt,
  workerName,
  ...extra,
});

function main() {
  const staff = t("2026-10-24T22:54:00.000Z", "7FX Admin");
  const customerOld = t("2026-10-24T19:55:00.000Z");
  const customerNew = t("2026-10-24T22:30:00.000Z");
  const auto = t("2026-10-24T22:40:00.000Z", "7FX", { workerId: "system", automatic: true });

  assert.equal(isCustomerMessage(customerNew), true);
  assert.equal(isCustomerMessage(staff), false);
  assert.equal(isCustomerMessage(auto), false);

  const demo = { lastAt: staff.createdAt, messages: [customerOld, staff] };
  const mehmet = { lastAt: customerNew.createdAt, messages: [t("2026-10-24T22:15:00.000Z"), customerNew] };
  const elena = {
    lastAt: "2026-10-24T21:25:00.000Z",
    messages: [t("2026-10-24T20:55:00.000Z"), t("2026-10-24T21:25:00.000Z", "7FX Admin")],
  };
  const sorted = [demo, elena, mehmet].sort(compareByLatestCustomer);
  assert.deepEqual(
    sorted.map((row) => row.lastAt),
    [customerNew.createdAt, elena.lastAt, staff.createdAt]
  );

  assert.equal(unreadCustomerCount(mehmet.messages), 2);
  assert.equal(unreadCustomerCount(demo.messages), 0);
  assert.equal(unreadCustomerCount([...mehmet.messages, auto]), 2);
  assert.equal(unreadCustomerCount(mehmet.messages, "2026-10-24T22:15:00.000Z"), 1);
  assert.equal(unreadCustomerCount(mehmet.messages, customerNew.createdAt), 0);

  assert.equal(viewerIntlLocale("tr", "en-US"), "tr-TR");
  assert.equal(viewerIntlLocale("en", "en-US"), "en-US");
  assert.equal(viewerIntlLocale("tr", "tr-TR"), "tr-TR");

  const stamp = formatChatStamp("2026-10-23T15:04:00.000Z", "tr-TR", Date.parse("2026-10-24T12:00:00.000Z"));
  assert.match(stamp, /Eki|23/);
  assert.doesNotMatch(stamp, /Oct/);
  const today = formatChatStamp("2026-10-24T09:05:00.000Z", "tr-TR", Date.parse("2026-10-24T12:00:00.000Z"));
  assert.match(today, /09:05|9:05/);

  const chat = require("node:fs").readFileSync(new URL("../src/app/(admin)/izcrm/chat/page.tsx", import.meta.url), "utf8");
  assert.match(chat, /m\.workerName \|\| "7FX Support"/);
  assert.equal(chat.includes("isSystemAutoReply"), false);
  assert.match(chat, /compareByLatestCustomer/);
  assert.match(chat, /data-unread=/);

  console.log("crm-inbox tests passed");
}

main();
