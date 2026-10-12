import { SignJWT, jwtVerify } from "jose";
import { getAuthSecret } from "@/lib/auth";

export const ATT_MAX_BYTES = 8 * 1024 * 1024;
export const ATT_VIEWABLE = ["image/png", "image/jpeg", "image/webp", "image/gif", "application/pdf"];
export const ATT_MARKER_RE = /\[\[att:([a-z0-9]{10,40})\]\]/gi;
const TTL_SEC = 60;

export async function signAttachmentToken(attId: string, userId: string) {
  return new SignJWT({ purpose: "chat-att-view", attId, userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${TTL_SEC}s`)
    .sign(getAuthSecret());
}

export async function verifyAttachmentToken(token: string, attId: string, userId: string) {
  try {
    const { payload } = await jwtVerify(token, getAuthSecret());
    return payload.purpose === "chat-att-view" && payload.attId === attId && payload.userId === userId;
  } catch {
    return false;
  }
}

export const NO_STORE = {
  "Cache-Control": "no-store, no-cache, must-revalidate, private, max-age=0",
  Pragma: "no-cache",
  "X-Content-Type-Options": "nosniff",
};
