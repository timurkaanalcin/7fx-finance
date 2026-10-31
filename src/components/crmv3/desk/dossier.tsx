"use client";

import Link from "next/link";
import { sumsByCurrency } from "@/lib/crmv3/review";
import { clipText, followMark, latestActivity, type ActEvent, type ActNote } from "@/lib/crmv3/dossier";
import { crmv3Href } from "@/lib/crmv3/sections";
import { money, useJson, when, type Tx } from "../kit";
import { useV3 } from "./store";

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

export function Dossier({ base, user, notes, events, tx, locale }: {
  base: string;
  user: Person;
  notes: ActNote[];
  events: ActEvent[];
  tx: Tx;
  locale: string;
}) {
  const v3 = useV3();
  const deposits = useJson<{ requests?: Cash[] }>(user.email ? `/api/admin/deposits?take=40&q=${encodeURIComponent(user.email)}` : null);
  const withdrawals = useJson<{ requests?: Cash[] }>(user.email ? `/api/admin/withdrawals?take=40&q=${encodeURIComponent(user.email)}` : null);
  const mine = (rows: Cash[]) => rows.filter((row) => String(row.user?.id || row.userId || "") === user.id);
  const dep = sumsByCurrency(mine(deposits.data?.requests || []).map((row, index) => ({ id: row.id || String(index), amount: row.amount, currency: row.currency })));
  const wd = sumsByCurrency(mine(withdrawals.data?.requests || []).map((row, index) => ({ id: row.id || String(index), amount: row.amount, currency: row.currency })));
  const currency = user.currency || user.account?.currency || "";
  const latest = latestActivity(notes, events);
  const today = new Date().toISOString().slice(0, 10);
  const follow = followMark(user.retentionFollowUpAt, today);
  const followWord = follow === "overdue" ? v3("dosOverdue") : follow === "today" ? v3("dosToday") : follow === "later" ? v3("dosLater") : "";
  return (
    <section className="c3-dossier" aria-label={v3("dosTitle")} data-dossier="1">
      <h2 className="c3-title">{v3("dosTitle")}</h2>
      <p className="c3-muted">{v3("dosHint")}</p>
      <div className="c3-dos-grid">
        <article>
          <h3 className="c3-title">{v3("dosSummary")}</h3>
          <p>{user.name || "—"}</p>
          <p className="c3-muted">{user.country || "—"} · {user.desk || "—"}</p>
          <p>{v3("dosStage")} · {user.saleStatus || "—"}</p>
          <p>{v3("dosRetention")} · {user.retentionStatus || "—"}</p>
          <p>{user.active === false ? tx("chipFrozen") : tx("chipActive")}</p>
          <p className="c3-muted">{v3("dosAssignee")} · {user.assigneeName || "—"}</p>
          <p className="c3-muted">{v3("dosRegistered")} · {when(user.createdAt, locale)}</p>
          <p className="c3-muted">{v3("dosFlag")} · {user.ftd ? tx("yes") : tx("no")}</p>
        </article>
        <article>
          <h3 className="c3-title">{v3("dosKyc")}</h3>
          <p>{user.documentsStatus || "NONE"}</p>
          <Link className="c3-btn" href={crmv3Href(base, `customers/${user.id}`, { part: "files" })}>{v3("dosOpenFiles")}</Link>
        </article>
        <article>
          <h3 className="c3-title">{v3("dosMoney")}</h3>
          <p>{v3("dosBalance")} · {money(user.balance ?? user.account?.balance, currency, locale)}</p>
          <p>{v3("dosEquity")} · {money(user.equity ?? user.account?.equity, currency, locale)}</p>
          <h4 className="c3-title">{v3("dosDeposits")}</h4>
          {!dep.length && <p className="c3-muted">{v3("dosNone")}</p>}
          <ul>{dep.map((row) => <li key={row.currency}>{money(row.amount, row.currency, locale)} · {row.count}</li>)}</ul>
          <h4 className="c3-title">{v3("dosWithdrawals")}</h4>
          {!wd.length && <p className="c3-muted">{v3("dosNone")}</p>}
          <ul>{wd.map((row) => <li key={row.currency}>{money(row.amount, row.currency, locale)} · {row.count}</li>)}</ul>
          <Link className="c3-btn" href={crmv3Href(base, `customers/${user.id}`, { part: "money" })}>{v3("dosOpenMoney")}</Link>
        </article>
        <article>
          <h3 className="c3-title">{v3("dosActivity")}</h3>
          {!latest && <p>{v3("dosNoActivity")}</p>}
          {latest && (
            <>
              <p>{latest.kind === "note" ? v3("dosNote") : v3("dosEvent")}</p>
              <p>{clipText(latest.text) || "—"}</p>
              <p className="c3-muted">{when(latest.at, locale)}</p>
            </>
          )}
          <Link className="c3-btn" href={crmv3Href(base, `customers/${user.id}`, { part: "notes" })}>{v3("dosOpenNotes")}</Link>
        </article>
        <article data-flag={follow}>
          <h3 className="c3-title">{v3("dosFollow")}</h3>
          {follow === "none" && <p>{v3("dosNoFollow")}</p>}
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
