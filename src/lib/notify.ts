import webpush from "web-push";
import { prisma } from "@/lib/prisma";

let vapidReady: boolean | null = null;
function ensureVapid(): boolean {
  if (vapidReady !== null) return vapidReady;
  const pub = process.env.VAPID_PUBLIC_KEY, priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return (vapidReady = false);
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:support@7fx.customer.org.tr", pub, priv);
  return (vapidReady = true);
}

export type NotifyInput = { kind: string; title: string; body: string; href?: string | null };

/** In-app notification + best-effort Web Push for each recipient. Never throws. */
export async function notifyUsers(userIds: string[], n: NotifyInput) {
  const ids = Array.from(new Set(userIds.filter(Boolean)));
  if (!ids.length) return;
  const body = n.body.slice(0, 300);
  try {
    await prisma.notification.createMany({
      data: ids.map((userId) => ({ userId, kind: n.kind, title: n.title.slice(0, 190), body, href: n.href ?? null })),
    });
  } catch (e) {
    console.error("[notify] db", e);
  }
  if (!ensureVapid()) return;
  try {
    const subs = await prisma.pushSubscription.findMany({ where: { userId: { in: ids } } });
    const payload = JSON.stringify({ title: n.title, body, href: n.href || "/" });
    await Promise.all(
      subs.map(async (s) => {
        try {
          await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 3600 });
        } catch (err: unknown) {
          const code = (err as { statusCode?: number }).statusCode;
          if (code === 404 || code === 410) await prisma.pushSubscription.delete({ where: { id: s.id } }).catch(() => {});
        }
      })
    );
  } catch (e) {
    console.error("[notify] push", e);
  }
}

export async function notifyAgents(n: NotifyInput) {
  const agents = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true } }).catch(() => []);
  await notifyUsers(agents.map((a) => a.id), n);
}
