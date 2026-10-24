/** Pure CRM inbox helpers. No schema, no ledger. */

export type InboxMsg = {
  createdAt: string;
  workerName?: string | null;
  workerId?: string | null;
  automatic?: boolean | null;
};

const INTL_TAGS: Record<string, string> = {
  en: "en-GB",
  tr: "tr-TR",
  de: "de-DE",
  ru: "ru-RU",
  ar: "ar",
};

/** CRM language, or the browser tag when it is the same language. */
export function viewerIntlLocale(crmLocale: string, navigatorLanguage?: string | null): string {
  const crm = (crmLocale || "en").toLowerCase().split("-")[0];
  const nav = (navigatorLanguage || "").trim();
  const base = nav.toLowerCase().split("-")[0];
  if (nav && base === crm) return nav;
  return INTL_TAGS[crm] || crm || "en-GB";
}

function isAutomatic(m: InboxMsg): boolean {
  return m.automatic === true || m.workerId === "system" || m.workerId === "ai";
}

/** Customer text. Automatic 7FX acknowledgements and staff bubbles are not customer messages. */
export function isCustomerMessage(m: InboxMsg): boolean {
  if (isAutomatic(m)) return false;
  if (m.workerName || m.workerId) return false;
  return true;
}

export function latestCustomerAt(messages: readonly InboxMsg[]): number {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (!isCustomerMessage(messages[i])) continue;
    const t = new Date(messages[i].createdAt).getTime();
    if (Number.isFinite(t)) return t;
  }
  return 0;
}

/**
 * Unread customer messages. With no seen cursor, only the trailing run
 * (messages since the last staff reply). With a cursor, customer messages after it.
 */
export function unreadCustomerCount(messages: readonly InboxMsg[], seenIso?: string | null): number {
  const seen = seenIso ? new Date(seenIso).getTime() : NaN;
  if (!Number.isFinite(seen)) {
    let n = 0;
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (isCustomerMessage(m)) n++;
      else if (isAutomatic(m)) continue;
      else break;
    }
    return n;
  }
  let n = 0;
  for (const m of messages) {
    if (!isCustomerMessage(m)) continue;
    const t = new Date(m.createdAt).getTime();
    if (Number.isFinite(t) && t > seen) n++;
  }
  return n;
}

/** Newest customer message first. Threads with none fall back to last activity. */
export function compareByLatestCustomer(
  a: { messages: readonly InboxMsg[]; lastAt: string },
  b: { messages: readonly InboxMsg[]; lastAt: string }
): number {
  const ca = latestCustomerAt(a.messages);
  const cb = latestCustomerAt(b.messages);
  if (ca !== cb) return cb - ca;
  const fa = new Date(a.lastAt).getTime() || 0;
  const fb = new Date(b.lastAt).getTime() || 0;
  return fb - fa;
}

/** Clock for today, short date plus clock otherwise, in the viewer's locale. */
export function formatChatStamp(iso: string, locale: string, now = Date.now()): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "—";
  const today = new Date(now);
  const sameDay =
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();
  if (sameDay) {
    return d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleString(locale, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
