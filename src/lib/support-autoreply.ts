/**
 * Once-per-opening live-support acknowledgment.
 * Pure helpers only — safe to import from client components.
 *
 * A conversation opening is the first customer message, or the next customer
 * message after the thread has been idle for 30 minutes. The automatic reply
 * is posted once per opening. It is not repeated on every follow-up while the
 * thread is still active, and a human staff reply inside the active opening
 * suppresses it ("no staff reply").
 */

export const AUTO_REPLY_IDLE_MS = 30 * 60 * 1000;

/** CRM sender label. */
export const SYSTEM_WORKER_NAME = "7FX";
/** Distinguishes the automatic reply from a human agent (workerId = admin id). */
export const SYSTEM_WORKER_ID = "system";

export const AUTO_REPLY_TR =
  "Tarafınıza en kısa süre içerisinde müşteri temsilcisi tarafından yanıt verilecektir.\n\n7FX";

export const AUTO_REPLY_EN =
  "A customer representative will reply to you as soon as possible.\n\n7FX";

export const AUTO_REPLY_DE =
  "Ein Kundenbetreuer antwortet Ihnen so bald wie möglich.\n\n7FX";

export const AUTO_REPLY_RU =
  "Представитель службы поддержки ответит вам в ближайшее время.\n\n7FX";

export const AUTO_REPLY_AR =
  "سيرد عليك ممثل خدمة العملاء في أقرب وقت.\n\n7FX";

export const LIVE_SUPPORT_NOTIFY_TITLE = "Live support: new message";

/** Customer push title when a human agent sends a chat message. English if the account language is unset. */
export const SUPPORT_REPLY_TITLE: Record<string, string> = {
  en: "New message from support",
  tr: "Destek ekibinden yeni mesaj",
  de: "Neue Nachricht vom Support",
  ru: "Новое сообщение от поддержки",
  ar: "رسالة جديدة من الدعم",
};

const NON_HUMAN_WORKER_IDS = new Set([SYSTEM_WORKER_ID, "ai"]);

export type ChatStamp = {
  createdAt: Date;
  workerId?: string | null;
  workerName?: string | null;
};

const AUTO_REPLY_BY_LANG: Record<string, string> = {
  tr: AUTO_REPLY_TR,
  de: AUTO_REPLY_DE,
  ru: AUTO_REPLY_RU,
  ar: AUTO_REPLY_AR,
  en: AUTO_REPLY_EN,
};

/** Account language. Unset or unknown languages stay English. */
export function autoReplyText(language: string | null | undefined): string {
  const base = String(language || "")
    .trim()
    .toLowerCase()
    .split("-")[0];
  return AUTO_REPLY_BY_LANG[base] || AUTO_REPLY_EN;
}

export function supportReplyTitle(language: string | null | undefined): string {
  const base = String(language || "")
    .trim()
    .toLowerCase()
    .split("-")[0];
  return SUPPORT_REPLY_TITLE[base] || SUPPORT_REPLY_TITLE.en;
}

export function isSystemAutoReply(m: { workerId?: string | null; automatic?: boolean | null }): boolean {
  return m.automatic === true || m.workerId === SYSTEM_WORKER_ID;
}

/** A human CRM agent, not the customer and not the automatic/AI sender. */
export function isHumanStaffMessage(m: ChatStamp): boolean {
  if (isSystemAutoReply(m)) return false;
  if (m.workerId && NON_HUMAN_WORKER_IDS.has(m.workerId)) return false;
  if (m.workerId) return true;
  if (m.workerName && m.workerName !== "7FX Asistan") return true;
  return false;
}

/**
 * `prior` is the thread before the customer message being handled (oldest or newest order).
 * `now` is when that customer message arrived.
 */
export function shouldSendOpeningAutoReply(prior: ChatStamp[], now: Date): boolean {
  if (prior.length === 0) return true;
  const sorted = [...prior].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  const last = sorted[sorted.length - 1];
  const idle = now.getTime() - last.createdAt.getTime() >= AUTO_REPLY_IDLE_MS;
  if (idle) return true;

  let start = 0;
  for (let i = 1; i < sorted.length; i++) {
    const gap = sorted[i].createdAt.getTime() - sorted[i - 1].createdAt.getTime();
    if (gap >= AUTO_REPLY_IDLE_MS) start = i;
  }
  const opening = sorted.slice(start);
  if (opening.some((m) => isSystemAutoReply(m))) return false;
  if (opening.some((m) => isHumanStaffMessage(m))) return false;
  return true;
}

/** Push / in-app body: customer name or id, plus the first ~80 characters of the message. */
export function liveSupportNotifyBody(
  name: string | null | undefined,
  userId: string,
  message: string
): string {
  const who = (name || "").trim() || userId;
  const label = who === userId ? userId : `${who} (${userId})`;
  const preview = message.replace(/\s+/g, " ").trim().slice(0, 80);
  return preview ? `${label}: ${preview}` : label;
}
