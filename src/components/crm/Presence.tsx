"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fmtCrmDate } from "@/lib/crm-format";
import { useCrmLabels } from "@/lib/i18n/crm-labels";
import { countryFlag, presenceState, type PresenceInfo, type PresenceState } from "@/lib/presence-shared";

const DOT: Record<PresenceState, string> = {
  online: "bg-emerald-500",
  recent: "bg-amber-400",
  offline: "bg-neutral-300",
  never: "bg-neutral-200",
};
const TEXT: Record<PresenceState, string> = {
  online: "text-emerald-700",
  recent: "text-amber-700",
  offline: "text-neutral-500",
  never: "text-neutral-400",
};
const CHIP: Record<PresenceState, string> = {
  online: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  recent: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  offline: "bg-neutral-100 text-neutral-600",
  never: "bg-neutral-100 text-neutral-400",
};

/** Localized "5 min ago" via Intl.RelativeTimeFormat (no AM/PM anywhere). */
export function useRelativeTime() {
  const { locale } = useCrmLabels();
  return useCallback(
    (iso: string | null | undefined, now: number) => {
      if (!iso) return "";
      const t = new Date(iso).getTime();
      if (!Number.isFinite(t)) return "";
      const sec = Math.round((t - now) / 1000);
      let rtf: Intl.RelativeTimeFormat;
      try {
        rtf = new Intl.RelativeTimeFormat(locale || "en", { numeric: "auto", style: "short" });
      } catch {
        rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto", style: "short" });
      }
      const abs = Math.abs(sec);
      if (abs < 45) return rtf.format(0, "second");
      if (abs < 3600) return rtf.format(Math.round(sec / 60), "minute");
      if (abs < 86400) return rtf.format(Math.round(sec / 3600), "hour");
      if (abs < 86400 * 30) return rtf.format(Math.round(sec / 86400), "day");
      if (abs < 86400 * 365) return rtf.format(Math.round(sec / (86400 * 30)), "month");
      return rtf.format(Math.round(sec / (86400 * 365)), "year");
    },
    [locale]
  );
}

export function usePresenceLabel() {
  const { i18n } = useCrmLabels();
  return (s: PresenceState) => i18n(`crm.presence.${s}`);
}

export function locationText(p: {
  city?: string | null;
  region?: string | null;
  countryName?: string | null;
  country?: string | null;
}): string {
  const parts: string[] = [];
  if (p.city) parts.push(p.city);
  if (p.region && p.region !== p.city) parts.push(p.region);
  const c = p.countryName || p.country;
  if (c) parts.push(c);
  return parts.join(", ");
}

/** Flag + city/country, compact. */
export function LocationLabel({
  country,
  countryName,
  region,
  city,
  className = "",
}: {
  country?: string | null;
  countryName?: string | null;
  region?: string | null;
  city?: string | null;
  className?: string;
}) {
  const { i18n } = useCrmLabels();
  const text = locationText({ city, region, countryName, country });
  if (!text) return <span className={`text-neutral-400 ${className}`}>{i18n("crm.presence.noLocation")}</span>;
  const flag = countryFlag(country);
  return (
    <span className={className} title={text}>
      {flag && <span className="mr-1">{flag}</span>}
      <span>{city ? `${city}, ${countryName || country || ""}`.replace(/, $/, "") : countryName || country}</span>
    </span>
  );
}

export function deviceText(
  i18n: (k: string, f?: string) => string,
  p: { device?: string | null; browser?: string | null; os?: string | null }
): string {
  const parts: string[] = [];
  if (p.device) parts.push(i18n(`crm.presence.device.${p.device}`, p.device));
  if (p.browser) parts.push(p.browser);
  if (p.os) parts.push(p.os);
  return parts.join(" · ");
}

/** Green / amber / gray dot with label and relative "last seen". */
export function PresenceCell({ lastSeenAt, now }: { lastSeenAt: string | null; now: number }) {
  const label = usePresenceLabel();
  const rel = useRelativeTime();
  const st = presenceState(lastSeenAt, now);
  return (
    <div className="whitespace-nowrap" title={lastSeenAt ? fmtCrmDate(lastSeenAt) : undefined}>
      <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${TEXT[st]}`}>
        <span className={`relative inline-block h-2 w-2 rounded-full ${DOT[st]}`}>
          {st === "online" && (
            <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400 opacity-60" />
          )}
        </span>
        {label(st)}
      </span>
      {st !== "online" && st !== "never" && (
        <div className="text-[10px] text-neutral-400">{rel(lastSeenAt, now)}</div>
      )}
    </div>
  );
}

export function PresenceChip({ lastSeenAt, now }: { lastSeenAt: string | null; now: number }) {
  const label = usePresenceLabel();
  const st = presenceState(lastSeenAt, now);
  return (
    <span className={`inline-flex items-center gap-1.5 rounded px-1.5 py-0.5 text-[10px] font-semibold ${CHIP[st]}`}>
      <span className={`inline-block h-1.5 w-1.5 rounded-full ${DOT[st]}`} />
      {label(st)}
    </span>
  );
}

type LoginEventRow = {
  id: string;
  at: string;
  success: boolean;
  method: string;
  reason: string | null;
  actorName: string | null;
  ip: string | null;
  country: string | null;
  countryName: string | null;
  region: string | null;
  city: string | null;
  device: string | null;
  browser: string | null;
  os: string | null;
  userAgent: string | null;
};

type PresencePayload = {
  presence: PresenceInfo & { lastLoginAt: string | null; lastUserAgent: string | null };
  events: LoginEventRow[];
  serverTime: string;
};

/** Polls the admin presence endpoint; skips while the tab is hidden. */
export function useTraderPresence(userId: string, intervalMs = 20000) {
  const [data, setData] = useState<PresencePayload | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const skew = useRef(0);

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      const r = await fetch(`/api/admin/users/${userId}/presence`, { cache: "no-store" });
      if (!r.ok) return;
      const d = (await r.json()) as PresencePayload;
      const st = new Date(d.serverTime).getTime();
      if (Number.isFinite(st)) skew.current = st - Date.now();
      setData(d);
      setNow(Date.now() + skew.current);
    } catch {
      /* ignore */
    }
  }, [userId]);

  useEffect(() => {
    load();
    const poll = window.setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, intervalMs);
    const tick = window.setInterval(() => setNow(Date.now() + skew.current), 15000);
    return () => {
      window.clearInterval(poll);
      window.clearInterval(tick);
    };
  }, [load, intervalMs]);

  return { data, now, reload: load };
}

/** Header strip on trader detail: online state · last seen · location · IP · device. */
export function TraderPresenceHeader({ userId }: { userId: string }) {
  const { i18n } = useCrmLabels();
  const rel = useRelativeTime();
  const { data, now } = useTraderPresence(userId, 20000);
  if (!data) return null;
  const p = data.presence;
  const st = presenceState(p.lastSeenAt, now);
  const loc = locationText({ city: p.lastCity, region: p.lastRegion, countryName: p.lastCountryName, country: p.lastCountry });
  const dev = deviceText(i18n, { device: p.lastDevice, browser: p.lastBrowser, os: p.lastOs });
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-[#e5e5e5] bg-white px-2.5 py-1 text-[11px] text-neutral-600">
      <PresenceChip lastSeenAt={p.lastSeenAt} now={now} />
      <span title={p.lastSeenAt ? fmtCrmDate(p.lastSeenAt) : undefined}>
        <span className="text-neutral-400">{i18n("crm.presence.lastSeen")}:</span>{" "}
        {p.lastSeenAt ? (
          <>
            <span className="tabular-nums">{fmtCrmDate(p.lastSeenAt)}</span>
            {st !== "online" && <span className="text-neutral-400"> ({rel(p.lastSeenAt, now)})</span>}
          </>
        ) : (
          "—"
        )}
      </span>
      <span>
        <span className="text-neutral-400">{i18n("crm.presence.location")}:</span>{" "}
        {loc ? (
          <>
            {countryFlag(p.lastCountry) && <span className="mr-1">{countryFlag(p.lastCountry)}</span>}
            {loc}
          </>
        ) : (
          <span className="text-neutral-400">{i18n("crm.presence.noLocation")}</span>
        )}
        {p.lastIp && <span className="ml-1 font-mono text-[10px] text-neutral-500">({p.lastIp})</span>}
      </span>
      {dev && (
        <span title={p.lastUserAgent || undefined}>
          <span className="text-neutral-400">{i18n("crm.presence.device")}:</span> {dev}
        </span>
      )}
    </div>
  );
}

/** "Giriş geçmişi" table — last 50 sign-in events. */
export function LoginHistory({ userId }: { userId: string }) {
  const { i18n } = useCrmLabels();
  const { data } = useTraderPresence(userId, 30000);
  const events = data?.events || [];
  return (
    <section className="mb-4 rounded-lg border border-[#e5e5e5] bg-white">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#e5e5e5] px-3 py-2">
        <div>
          <h2 className="text-sm font-medium text-neutral-700">{i18n("crm.login.title")}</h2>
          <p className="text-[11px] text-neutral-400">{i18n("crm.login.subtitle")}</p>
        </div>
        <p className="text-[10px] text-neutral-400">{i18n("crm.presence.impersonationNote")}</p>
      </div>
      <div className="max-h-[420px] overflow-auto">
        <table className="w-full text-left text-xs">
          <thead className="sticky top-0 bg-white text-neutral-500">
            <tr>
              <th className="px-3 py-2">{i18n("crm.ui.date")}</th>
              <th className="px-3 py-2">IP</th>
              <th className="px-3 py-2">{i18n("crm.login.location")}</th>
              <th className="px-3 py-2">{i18n("crm.login.browser")}</th>
              <th className="px-3 py-2">{i18n("crm.ui.method")}</th>
              <th className="px-3 py-2">{i18n("crm.login.result")}</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id} className="border-t border-[#f0f0f0] align-top">
                <td className="whitespace-nowrap px-3 py-1.5 tabular-nums">{fmtCrmDate(e.at)}</td>
                <td className="px-3 py-1.5 font-mono text-[10px] text-neutral-600">{e.ip || "—"}</td>
                <td className="px-3 py-1.5">
                  <LocationLabel country={e.country} countryName={e.countryName} region={e.region} city={e.city} />
                </td>
                <td className="px-3 py-1.5 text-neutral-600" title={e.userAgent || undefined}>
                  {deviceText(i18n, e) || "—"}
                </td>
                <td className="px-3 py-1.5">
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] ${
                      e.method === "impersonation" ? "bg-violet-50 text-violet-700" : "bg-neutral-100 text-neutral-600"
                    }`}
                  >
                    {i18n(`crm.login.method.${e.method}`, e.method)}
                  </span>
                  {e.actorName && <div className="mt-0.5 text-[10px] text-neutral-400">{e.actorName}</div>}
                </td>
                <td className="px-3 py-1.5">
                  {e.success ? (
                    <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                      {i18n("crm.login.success")}
                    </span>
                  ) : (
                    <span className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-red-600">
                      {i18n("crm.login.failed")}
                      {e.reason && <> · {i18n(`crm.login.reason.${e.reason}`, e.reason)}</>}
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {data && events.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-neutral-400">
                  {i18n("crm.login.empty")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
