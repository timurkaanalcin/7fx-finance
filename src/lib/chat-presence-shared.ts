/** Client-safe chat presence helpers (no Prisma). */

export const TYPING_TTL_MS = 4_000;
export const IN_CHAT_TTL_MS = 20_000;

export type ChatPresenceSnapshot = {
  customerTyping: boolean;
  adminTyping: boolean;
  customerInChat: boolean;
  adminInChat: boolean;
  customerLastReadAt: string | null;
  adminLastReadAt: string | null;
  lastSeenAt: string | null;
};

export function serializeChatPresence(
  state: {
    customerTypingUntil: Date | null;
    adminTypingUntil: Date | null;
    customerInChatUntil: Date | null;
    adminInChatUntil: Date | null;
    customerLastReadAt: Date | null;
    adminLastReadAt: Date | null;
  } | null,
  lastSeenAt: Date | null | undefined,
  now = Date.now()
): ChatPresenceSnapshot {
  const active = (until: Date | null | undefined) =>
    Boolean(until && until.getTime() > now);
  return {
    customerTyping: active(state?.customerTypingUntil),
    adminTyping: active(state?.adminTypingUntil),
    customerInChat: active(state?.customerInChatUntil),
    adminInChat: active(state?.adminInChatUntil),
    customerLastReadAt: state?.customerLastReadAt?.toISOString() ?? null,
    adminLastReadAt: state?.adminLastReadAt?.toISOString() ?? null,
    lastSeenAt: lastSeenAt ? new Date(lastSeenAt).toISOString() : null,
  };
}

export function messageReadByPeer(
  createdAt: string | Date,
  peerLastReadAt: string | null | undefined
): boolean {
  if (!peerLastReadAt) return false;
  const c = new Date(createdAt).getTime();
  const r = new Date(peerLastReadAt).getTime();
  return Number.isFinite(c) && Number.isFinite(r) && r >= c;
}
