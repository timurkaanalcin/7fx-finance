import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { geolocateIp, isPrivateIp } from "@/lib/geoip";
import { parseUserAgent } from "@/lib/user-agent";

/** Server-side presence + sign-in audit. All functions are best-effort and never throw. */

export const PRESENCE_WRITE_INTERVAL_MS = 60 * 1000;

export type RequestMeta = {
  ip: string | null;
  userAgent: string | null;
};

type HeaderGetter = { get(name: string): string | null };

/** Client IP behind Railway's edge: X-Forwarded-For leftmost public entry, then CF / real-ip fallbacks. */
export function clientIpFromHeaders(h: HeaderGetter): string | null {
  const candidates: string[] = [];
  const xff = h.get("x-forwarded-for");
  if (xff) candidates.push(...xff.split(",").map((s) => s.trim()));
  for (const k of ["cf-connecting-ip", "x-real-ip", "fastly-client-ip", "true-client-ip"]) {
    const v = h.get(k);
    if (v) candidates.push(v.trim());
  }
  const norm = candidates
    .map((c) => c.replace(/^\[|\]$/g, "").replace(/^::ffff:/i, ""))
    // strip :port on IPv4
    .map((c) => (/^\d+\.\d+\.\d+\.\d+:\d+$/.test(c) ? c.split(":")[0] : c))
    .filter((c) => c && c.length <= 64 && /^[0-9a-fA-F:.]+$/.test(c));
  return norm.find((c) => !isPrivateIp(c)) || norm[0] || null;
}

export function requestMetaFrom(h: HeaderGetter): RequestMeta {
  const ua = h.get("user-agent");
  return { ip: clientIpFromHeaders(h), userAgent: ua ? ua.slice(0, 512) : null };
}

/** Read meta from the current request (Route Handlers / Server Components). */
export function currentRequestMeta(): RequestMeta | null {
  try {
    return requestMetaFrom(headers());
  } catch {
    return null;
  }
}

const lastWrite = new Map<string, number>();

/** Update User.lastSeenAt/IP/UA (+ location when the IP changed). Throttled to 1 write / 60s / user.
 *  Callers must NOT call this for admin-impersonated sessions. */
export async function touchPresence(
  user: { id: string; lastSeenAt?: Date | null; lastIp?: string | null; lastCountry?: string | null },
  meta?: RequestMeta | null,
  opts: { force?: boolean } = {}
): Promise<void> {
  try {
    const now = Date.now();
    if (!opts.force) {
      const mem = lastWrite.get(user.id) || 0;
      const db = user.lastSeenAt ? new Date(user.lastSeenAt).getTime() : 0;
      if (now - Math.max(mem, db) < PRESENCE_WRITE_INTERVAL_MS) return;
    }
    lastWrite.set(user.id, now);
    if (lastWrite.size > 20000) lastWrite.clear();

    const m = meta ?? currentRequestMeta();
    const ua = parseUserAgent(m?.userAgent);
    const data: Record<string, unknown> = { lastSeenAt: new Date(now) };
    if (m?.ip) data.lastIp = m.ip;
    if (m?.userAgent) {
      data.lastUserAgent = m.userAgent;
      data.lastDevice = ua.device;
      data.lastBrowser = ua.browser;
      data.lastOs = ua.os;
    }
    const ipChanged = !!m?.ip && (m.ip !== user.lastIp || !user.lastCountry);
    await prisma.user.update({ where: { id: user.id }, data });

    if (ipChanged && m?.ip) {
      const ip = m.ip;
      // Location lookup runs after the write so requests are never blocked by it.
      void geolocateIp(ip).then(async (g) => {
        if (!g.country && !g.city) return;
        await prisma.user.updateMany({
          where: { id: user.id, lastIp: ip },
          data: {
            lastCountry: g.country,
            lastCountryName: g.countryName,
            lastRegion: g.region,
            lastCity: g.city,
          },
        });
      }).catch((e) => console.error("[presence] geo update", e));
    }
  } catch (e) {
    console.error("[presence] touch failed", e);
  }
}

/** Fire-and-forget wrapper used from requireUser(). */
export function touchPresenceInBackground(
  user: { id: string; lastSeenAt?: Date | null; lastIp?: string | null; lastCountry?: string | null }
) {
  const now = Date.now();
  const mem = lastWrite.get(user.id) || 0;
  const db = user.lastSeenAt ? new Date(user.lastSeenAt).getTime() : 0;
  if (now - Math.max(mem, db) < PRESENCE_WRITE_INTERVAL_MS) return;
  // Capture headers synchronously (request scope) before going async.
  const meta = currentRequestMeta();
  void touchPresence(user, meta);
}

export type LoginMethod = "password" | "auto-login" | "impersonation" | "register";

/** Record a sign-in attempt. Creates the row immediately, fills location asynchronously. */
export async function recordLoginEvent(opts: {
  userId: string;
  success: boolean;
  method: LoginMethod;
  reason?: string | null;
  actorId?: string | null;
  meta?: RequestMeta | null;
}): Promise<void> {
  try {
    const m = opts.meta ?? currentRequestMeta();
    const ua = parseUserAgent(m?.userAgent);
    const ev = await prisma.loginEvent.create({
      data: {
        userId: opts.userId,
        success: opts.success,
        method: opts.method,
        reason: opts.reason ? opts.reason.slice(0, 64) : null,
        actorId: opts.actorId || null,
        ip: m?.ip || null,
        userAgent: m?.userAgent || null,
        device: m?.userAgent ? ua.device : null,
        browser: ua.browser,
        os: ua.os,
      },
      select: { id: true },
    });
    if (m?.ip) {
      void geolocateIp(m.ip)
        .then(async (g) => {
          if (!g.country && !g.city) return;
          await prisma.loginEvent.update({
            where: { id: ev.id },
            data: { country: g.country, countryName: g.countryName, region: g.region, city: g.city },
          });
        })
        .catch((e) => console.error("[presence] login geo", e));
    }
  } catch (e) {
    console.error("[presence] login event failed", e);
  }
}

/** Mark a client sign-in as presence (forces a write, refreshes location). */
export async function markClientSignIn(
  user: { id: string; lastIp?: string | null; lastCountry?: string | null },
  meta?: RequestMeta | null
) {
  await touchPresence({ ...user, lastSeenAt: null }, meta ?? currentRequestMeta(), { force: true });
}
