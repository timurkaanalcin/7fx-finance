"use client";

import Link from "next/link";
import { useEffect } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { sumsByCurrency } from "@/lib/crmv4/round27";
import { clipText, followMark, latestActivity, type ActEvent, type ActNote } from "@/lib/crmv4/round40";
import { crmv4Href } from "@/lib/crmv4/sections";
import { money, useJson, when, type Tx } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

export function useEscape(active: boolean, onClose: () => void) {
  useEffect(() => {
    if (!active) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, onClose]);
}

type Cash = { id: string; amount?: number | null; currency?: string | null; user?: { id?: string | null } | null; userId?: string | null };
type Person = {
  id: string;
  email?: string | null;
  name?: string | null;
  country?: string | null;
  desk?: string | null;
  saleStatus?: string | null;
  retentionStatus?: string | null;
  documentsStatus?: string | null;
  assigneeName?: string | null;
  createdAt?: string | null;
  retentionFollowUpAt?: string | null;
  ftd?: boolean | null;
  active?: boolean | null;
  currency?: string | null;
  balance?: number | null;
  equity?: number | null;
  account?: { currency?: string | null; balance?: number | null; equity?: number | null } | null;
};

export function Dossier({ base, user, notes, events, v4, tx, locale }: {
  base: string;
  user: Person;
  notes: ActNote[];
  events: ActEvent[];
  v4: V4;
  tx: Tx;
  locale: string;
}) {
  const deposits = useJson<{ requests?: Cash[] }>(user.email ? `/api/admin/deposits?take=40&q=${encodeURIComponent(user.email)}` : null);
  const withdrawals = useJson<{ requests?: Cash[] }>(user.email ? `/api/admin/withdrawals?take=40&q=${encodeURIComponent(user.email)}` : null);
  const mine = (rows: Cash[]) => rows.filter((row) => String(row.user?.id || row.userId || "") === user.id);
  const dep = sumsByCurrency(mine(deposits.data?.requests || []).map((row, index) => ({ id: row.id || String(index), amount: row.amount, currency: row.currency })));
  const wd = sumsByCurrency(mine(withdrawals.data?.requests || []).map((row, index) => ({ id: row.id || String(index), amount: row.amount, currency: row.currency })));
  const currency = user.currency || user.account?.currency || "";
  const latest = latestActivity(notes, events);
  const today = new Date().toISOString().slice(0, 10);
  const follow = followMark(user.retentionFollowUpAt, today);
  const followWord = follow === "overdue" ? v4("dosOverdue") : follow === "today" ? v4("dosToday") : follow === "later" ? v4("dosLater") : "";
  return (
    <section className="c4-dossier" aria-label={v4("dosTitle")} data-dossier="1">
      <h2 className="c4-title">{v4("dosTitle")}</h2>
      <p className="c4-muted">{v4("dosHint")}</p>
      <div className="c4-dos-grid">
        <article>
          <h3 className="c4-title">{v4("dosSummary")}</h3>
          <p>{user.name || "—"}</p>
          <p className="c4-muted">{user.country || "—"} · {user.desk || "—"}</p>
          <p>{v4("dosStage")} · {user.saleStatus || "—"}</p>
          <p>{v4("dosRetention")} · {user.retentionStatus || "—"}</p>
          <p>{user.active === false ? tx("chipFrozen") : tx("chipActive")}</p>
          <p className="c4-muted">{v4("dosAssignee")} · {user.assigneeName || "—"}</p>
          <p className="c4-muted">{v4("dosRegistered")} · {when(user.createdAt, locale)}</p>
          <p className="c4-muted">{v4("dosFlag")} · {user.ftd ? tx("yes") : tx("no")}</p>
        </article>
        <article>
          <h3 className="c4-title">{v4("dosKyc")}</h3>
          <p>{user.documentsStatus || "NONE"}</p>
          <Link className="c4-btn" href={crmv4Href(base, `customers/${user.id}`, { part: "files" })}>{v4("dosOpenFiles")}</Link>
        </article>
        <article>
          <h3 className="c4-title">{v4("dosMoney")}</h3>
          <p>{v4("dosBalance")} · {money(user.balance ?? user.account?.balance, currency, locale)}</p>
          <p>{v4("dosEquity")} · {money(user.equity ?? user.account?.equity, currency, locale)}</p>
          <h4 className="c4-title">{v4("dosDeposits")}</h4>
          {!dep.length && <p>{v4("dosNone")}</p>}
          <ul>{dep.map((row) => <li key={row.currency}>{money(row.amount, row.currency, locale)} · {row.count}</li>)}</ul>
          <h4 className="c4-title">{v4("dosWithdrawals")}</h4>
          {!wd.length && <p>{v4("dosNone")}</p>}
          <ul>{wd.map((row) => <li key={row.currency}>{money(row.amount, row.currency, locale)} · {row.count}</li>)}</ul>
          <Link className="c4-btn" href={crmv4Href(base, `customers/${user.id}`, { part: "money" })}>{v4("dosOpenMoney")}</Link>
        </article>
        <article>
          <h3 className="c4-title">{v4("dosActivity")}</h3>
          {!latest && <p>{v4("dosNoActivity")}</p>}
          {latest && (
            <>
              <p>{latest.kind === "note" ? v4("dosNote") : v4("dosEvent")}</p>
              <p>{clipText(latest.text) || "—"}</p>
              <p className="c4-muted">{when(latest.at, locale)}</p>
            </>
          )}
          <Link className="c4-btn" href={crmv4Href(base, `customers/${user.id}`, { part: "notes" })}>{v4("dosOpenNotes")}</Link>
        </article>
        <article>
          <h3 className="c4-title">{v4("dosFollow")}</h3>
          {follow === "none" && <p>{v4("dosNoFollow")}</p>}
          {follow !== "none" && (
            <>
              <p>{when(user.retentionFollowUpAt, locale)}</p>
              <p>{followWord}</p>
            </>
          )}
        </article>
      </div>
    </section>
  );
}
