/**
 * Opening auto-reply: once per conversation, again only after 30 minutes idle
 * with no staff reply inside the active opening.
 * Run: npx tsx tests/support-autoreply.test.ts
 */
import assert from "node:assert/strict";
import {
  AUTO_REPLY_AR,
  AUTO_REPLY_DE,
  AUTO_REPLY_EN,
  AUTO_REPLY_IDLE_MS,
  AUTO_REPLY_RU,
  AUTO_REPLY_TR,
  LIVE_SUPPORT_NOTIFY_TITLE,
  supportReplyTitle,
  SYSTEM_WORKER_ID,
  SYSTEM_WORKER_NAME,
  autoReplyText,
  liveSupportNotifyBody,
  shouldSendOpeningAutoReply,
  type ChatStamp,
} from "../src/lib/support-autoreply";

const NOW = new Date("2026-10-24T12:00:00.000Z");

function at(minutesAgo: number, workerId: string | null, workerName: string | null = null): ChatStamp {
  return {
    createdAt: new Date(NOW.getTime() - minutesAgo * 60 * 1000),
    workerId,
    workerName,
  };
}

function main() {
  assert.equal(AUTO_REPLY_TR, "Tarafınıza en kısa süre içerisinde müşteri temsilcisi tarafından yanıt verilecektir.\n\n7FX");
  assert.equal(AUTO_REPLY_EN, "A customer representative will reply to you as soon as possible.\n\n7FX");
  assert.equal(autoReplyText("tr"), AUTO_REPLY_TR);
  assert.equal(autoReplyText("tr-TR"), AUTO_REPLY_TR);
  assert.equal(autoReplyText("TR"), AUTO_REPLY_TR);
  assert.equal(autoReplyText("en"), AUTO_REPLY_EN);
  assert.equal(autoReplyText(null), AUTO_REPLY_EN);
  assert.equal(autoReplyText("ru"), AUTO_REPLY_RU);
  assert.equal(autoReplyText("ru-RU"), AUTO_REPLY_RU);
  assert.equal(autoReplyText("de"), AUTO_REPLY_DE);
  assert.equal(autoReplyText("ar"), AUTO_REPLY_AR);
  assert.equal(autoReplyText(""), AUTO_REPLY_EN);
  assert.equal(autoReplyText("fr"), AUTO_REPLY_EN);
  assert.equal(supportReplyTitle("tr"), "Destek ekibinden yeni mesaj");
  assert.equal(supportReplyTitle(null), "New message from support");
  assert.equal(supportReplyTitle("de"), "Neue Nachricht vom Support");

  assert.equal(LIVE_SUPPORT_NOTIFY_TITLE, "Live support: new message");
  assert.equal(SYSTEM_WORKER_NAME, "7FX");
  assert.equal(SYSTEM_WORKER_ID, "system");
  assert.equal(AUTO_REPLY_IDLE_MS, 30 * 60 * 1000);

  const long = "x".repeat(120);
  assert.equal(
    liveSupportNotifyBody("Mehmet Yılmaz", "usr_1", long),
    `Mehmet Yılmaz (usr_1): ${"x".repeat(80)}`
  );
  assert.equal(liveSupportNotifyBody("", "usr_1", "  hello   there "), "usr_1: hello there");
  assert.equal(liveSupportNotifyBody(null, "usr_1", ""), "usr_1");

  assert.equal(shouldSendOpeningAutoReply([], NOW), true, "first customer message");

  assert.equal(
    shouldSendOpeningAutoReply([at(2, null), at(2, SYSTEM_WORKER_ID, SYSTEM_WORKER_NAME)], NOW),
    false,
    "same opening already has the automatic reply"
  );

  assert.equal(
    shouldSendOpeningAutoReply([at(5, null)], NOW),
    true,
    "follow-up before any acknowledgment still sends once"
  );

  assert.equal(
    shouldSendOpeningAutoReply([at(10, null), at(9, "admin_1", "Ayşe")], NOW),
    false,
    "human already replied in this opening"
  );

  assert.equal(
    shouldSendOpeningAutoReply(
      [at(40, null), at(39, SYSTEM_WORKER_ID, SYSTEM_WORKER_NAME)],
      NOW
    ),
    true,
    "idle 30+ minutes with no staff reply starts a new opening"
  );

  assert.equal(
    shouldSendOpeningAutoReply([at(45, "admin_1", "Ayşe")], NOW),
    true,
    "staff reply older than 30 minutes does not cover the new opening"
  );

  assert.equal(
    shouldSendOpeningAutoReply([at(20, "ai", "7FX Asistan")], NOW),
    true,
    "legacy AI reply is not a human staff reply"
  );

  console.log("support-autoreply tests passed");
}

main();
