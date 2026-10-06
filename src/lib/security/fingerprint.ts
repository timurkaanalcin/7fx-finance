import { createHash } from "crypto";

export function clientIpFromHeaders(h: { get: (n: string) => string | null }): string {
  const xf = h.get("x-forwarded-for") || h.get("x-real-ip") || "";
  const first = xf.split(",")[0].trim();
  return first || "0.0.0.0";
}

export function hashFingerprint(parts: string[]): string {
  return createHash("sha256").update(parts.filter(Boolean).join("|")).digest("hex").slice(0, 32);
}

export function deviceFingerprint(ip: string, ua: string): { ipHash: string; uaHash: string; bind: string } {
  const ipHash = hashFingerprint([ip]);
  const uaHash = hashFingerprint([(ua || "").slice(0, 300)]);
  return { ipHash, uaHash, bind: hashFingerprint([ipHash, uaHash]) };
}
