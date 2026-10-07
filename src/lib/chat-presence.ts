import { prisma } from "@/lib/prisma";
import {
  IN_CHAT_TTL_MS,
  TYPING_TTL_MS,
} from "@/lib/chat-presence-shared";

export {
  IN_CHAT_TTL_MS,
  TYPING_TTL_MS,
  serializeChatPresence,
  messageReadByPeer,
  type ChatPresenceSnapshot,
} from "@/lib/chat-presence-shared";

export async function upsertChatPresence(
  userId: string,
  patch: {
    customerTyping?: boolean;
    adminTyping?: boolean;
    customerInChat?: boolean;
    adminInChat?: boolean;
    markCustomerRead?: boolean;
    markAdminRead?: boolean;
  }
) {
  const now = Date.now();
  const data: Record<string, Date | null> = {};

  if (patch.customerTyping === true) data.customerTypingUntil = new Date(now + TYPING_TTL_MS);
  if (patch.customerTyping === false) data.customerTypingUntil = null;
  if (patch.adminTyping === true) data.adminTypingUntil = new Date(now + TYPING_TTL_MS);
  if (patch.adminTyping === false) data.adminTypingUntil = null;

  if (patch.customerInChat === true) data.customerInChatUntil = new Date(now + IN_CHAT_TTL_MS);
  if (patch.customerInChat === false) data.customerInChatUntil = null;
  if (patch.adminInChat === true) data.adminInChatUntil = new Date(now + IN_CHAT_TTL_MS);
  if (patch.adminInChat === false) data.adminInChatUntil = null;

  if (patch.markCustomerRead) data.customerLastReadAt = new Date(now);
  if (patch.markAdminRead) data.adminLastReadAt = new Date(now);

  if (Object.keys(data).length === 0) {
    return prisma.chatThreadState.findUnique({ where: { userId } });
  }

  return prisma.chatThreadState.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  });
}
