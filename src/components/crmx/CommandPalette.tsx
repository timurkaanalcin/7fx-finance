"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { filterRows, queryString } from "@/lib/crmx/filters";
import { classicLinks, flatCrmxNav } from "@/lib/crmx/nav";
import { useI18n } from "@/lib/i18n/context";
import { crmxGet } from "./api";

type Hit = { key: string; href: string; title: string; sub: string; group: string };

type TraderHit = { id?: string; name?: string; email?: string; accountLoginId?: string | null };
type MoneyHit = { id?: string; amount?: number; currency?: string; status?: string; user?: { id?: string; name?: string; email?: string } };
type TicketHit = { id?: string; kind?: string; customer?: string; customerId?: string; amount?: number; currency?: string; status?: string };

export default function CommandPalette({ onClose, readOnly }: { onClose: () => void; readOnly: boolean }) {
  const { t } = useI18n();
  const router = useRouter();
  const titleId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const [remote, setRemote] = useState<Hit[]>([]);
  const [cursor, setCursor] = useState(0);

  const pages = useMemo<Hit[]>(() => {
    const local: Hit[] = [];
    for (const item of flatCrmxNav()) {
      local.push({ key: item.href, href: item.href, title: t(item.labelKey), sub: item.href, group: t("crmx.palette.pages") });
    }
    for (const link of classicLinks()) {
      local.push({ key: link.href, href: link.href, title: t(link.labelKey), sub: link.href, group: t("crmx.group.classic") });
    }
    return filterRows(local, q, (row) => [row.title, row.sub, row.group]);
  }, [q, t]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const query = q.trim();
    if (query.length < 2 || readOnly) {
      setRemote([]);
      return;
    }
    const ctrl = new AbortController();
    const handle = window.setTimeout(() => {
      void (async () => {
        const qs = queryString({ q: query, take: 5, meta: 0 });
        const hits: Hit[] = [];
        try {
          const traders = await crmxGet<{ users?: TraderHit[] }>(`/api/admin/users${queryString({ q: query, take: 6, meta: 0, view: "picker" })}`);
          for (const user of traders.users || []) {
            if (!user.id) continue;
            hits.push({
              key: `t-${user.id}`,
              href: `/crmx/traders/${user.id}`,
              title: user.name || user.email || user.id,
              sub: user.email || user.accountLoginId || "",
              group: t("crm.nav.traders"),
            });
          }
        } catch {
          /* search is best-effort */
        }
        if (ctrl.signal.aborted) return;
        try {
          const deposits = await crmxGet<{ requests?: MoneyHit[] }>(`/api/admin/deposits${qs}`);
          for (const row of deposits.requests || []) {
            if (!row.id) continue;
            hits.push({
              key: `d-${row.id}`,
              href: `/crmx/deposits?id=${encodeURIComponent(row.id)}`,
              title: row.user?.name || row.id,
              sub: `${row.amount ?? ""} ${row.currency || ""} ${row.status || ""}`.trim(),
              group: t("crmx.nav.deposits"),
            });
          }
        } catch {
          /* ignore */
        }
        try {
          const withdrawals = await crmxGet<{ requests?: MoneyHit[] }>(`/api/admin/withdrawals${qs}`);
          for (const row of withdrawals.requests || []) {
            if (!row.id) continue;
            hits.push({
              key: `w-${row.id}`,
              href: `/crmx/withdrawals?id=${encodeURIComponent(row.id)}`,
              title: row.user?.name || row.id,
              sub: `${row.amount ?? ""} ${row.currency || ""} ${row.status || ""}`.trim(),
              group: t("crmx.nav.withdrawals"),
            });
          }
        } catch {
          /* ignore */
        }
        try {
          const tickets = await crmxGet<{ tickets?: TicketHit[] }>(`/api/admin/tickets${queryString({ q: query, take: 6 })}`);
          for (const row of tickets.tickets || []) {
            if (!row.id) continue;
            hits.push({
              key: `k-${row.kind || ""}-${row.id}`,
              href: `/crmx/tickets?id=${encodeURIComponent(row.id)}`,
              title: row.customer || row.id,
              sub: `${row.kind || ""} ${row.amount ?? ""} ${row.currency || ""}`.trim(),
              group: t("crm.nav.tickets"),
            });
          }
        } catch {
          /* ignore */
        }
        if (!ctrl.signal.aborted) setRemote(hits);
      })();
    }, 180);
    return () => {
      ctrl.abort();
      window.clearTimeout(handle);
    };
  }, [q, readOnly, t]);

  const hits = pages.concat(remote);

  useEffect(() => {
    setCursor(0);
  }, [q, remote.length]);

  function go(hit: Hit | undefined) {
    if (!hit) return;
    router.push(hit.href);
    onClose();
  }

  const groups: { name: string; items: Hit[] }[] = [];
  for (const hit of hits) {
    const last = groups[groups.length - 1];
    if (!last || last.name !== hit.group) groups.push({ name: hit.group, items: [hit] });
    else last.items.push(hit);
  }

  let index = -1;

  return (
    <div className="crmx-pal" onMouseDown={onClose}>
      <div
        className="crmx-pal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2 id={titleId} className="sr-only" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden" }}>
          {t("crmx.search")}
        </h2>
        <input
          ref={inputRef}
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder={t("crmx.search")}
          aria-label={t("crmx.search")}
          onKeyDown={(event) => {
            if (event.key === "Escape") onClose();
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setCursor((n) => Math.min(hits.length - 1, n + 1));
            }
            if (event.key === "ArrowUp") {
              event.preventDefault();
              setCursor((n) => Math.max(0, n - 1));
            }
            if (event.key === "Enter") {
              event.preventDefault();
              go(hits[cursor]);
            }
          }}
        />
        <div className="crmx-pal-list" role="listbox" aria-label={t("crmx.search")}>
          {hits.length === 0 ? <p className="crmx-empty">{t("crmx.palette.empty")}</p> : null}
          {groups.map((group) => (
            <div key={group.name}>
              <div className="crmx-pal-group">{group.name}</div>
              {group.items.map((hit) => {
                index += 1;
                const active = index === cursor;
                const itemIndex = index;
                return (
                  <button
                    key={hit.key}
                    type="button"
                    role="option"
                    aria-selected={active}
                    className={`crmx-hit${active ? " is-active" : ""}`}
                    onMouseEnter={() => setCursor(itemIndex)}
                    onClick={() => go(hit)}
                  >
                    {hit.title}
                    <small>{hit.sub}</small>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
