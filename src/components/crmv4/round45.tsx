"use client";

import { useEffect, useState } from "react";
import { approvalBody, approvalEndpoint } from "@/lib/crmv2/payload";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { formatAge } from "@/lib/crmv4/round1";
import {
  csvMatrix,
  filterTickets,
  introducers,
  readViews,
  saveView,
  slaClock,
  ticketMove,
  type TicketFilter,
  type TicketView,
} from "@/lib/crmv4/round45";
import { setSlaLimit, slaLimit } from "./round1";
import { storedRole } from "./round5";
import { auditExport, downloadCsv, money, sendJson, useJson, when, type Tx } from "./kit";
import { useEscape } from "./round40";

export type V4 = (key: CrmV4CopyKey) => string;

const VIEW_KEY = "crmv4-ticket-views";
const DUE_KEY = "crmv4-ticket-due";

type Ticket = {
  id: string;
  kind: string;
  amount?: number | null;
  currency?: string | null;
  status?: string | null;
  customer?: string | null;
  openedAt?: string | null;
  closedAt?: string | null;
};

const MARK: Record<string, CrmV4CopyKey> = {
  none: "inNone",
  ok: "inOk",
  due: "inDue",
  breached: "inBreached",
};

export function TicketInbox({ v4, tx, locale }: { v4: V4; tx: Tx; locale: string }) {
  const data = useJson<{ tickets?: Ticket[] }>("/api/admin/tickets?status=");
  const [filter, setFilter] = useState<TicketFilter>({ status: "", kind: "", sla: "" });
  const [limit, setLimit] = useState(24);
  const [due, setDue] = useState(4);
  const [views, setViews] = useState<TicketView[]>([]);
  const [viewName, setViewName] = useState("");
  const [cursor, setCursor] = useState(0);
  const [openId, setOpenId] = useState("");
  const [pending, setPending] = useState<{ id: string; kind: string; action: "approve" | "reject" } | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [viewer, setViewer] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  useEscape(Boolean(pending) || Boolean(openId), () => {
    if (pending) setPending(null);
    else setOpenId("");
  });
  useEffect(() => {
    setLimit(slaLimit());
    const storedDue = Number(readJson(DUE_KEY, 4));
    setDue(Number.isFinite(storedDue) && storedDue > 0 ? storedDue : 4);
    setViews(readViews(readJson(VIEW_KEY, [])));
    setViewer(storedRole() === "viewer");
    const onRole = () => setViewer(storedRole() === "viewer");
    window.addEventListener("crmv4:role", onRole);
    const timer = window.setInterval(() => setNow(Date.now()), 60000);
    return () => {
      window.removeEventListener("crmv4:role", onRole);
      window.clearInterval(timer);
    };
  }, []);
  const rows = data.data?.tickets || [];
  const shown = filterTickets(rows, filter, now, limit, due);
  const kinds: string[] = [];
  for (const row of rows) if (row.kind && !kinds.includes(row.kind)) kinds.push(row.kind);
  kinds.sort();
  const current = shown[cursor] || null;
  const detail = shown.find((row) => row.id === openId) || null;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = Boolean(target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable));
      if (typing) return;
      if (event.key === "j") setCursor((index) => ticketMove(index, shown.length, 1));
      if (event.key === "k") setCursor((index) => ticketMove(index, shown.length, -1));
      if (event.key === "Enter" && shown[cursor]) setOpenId(shown[cursor].id);
      if (event.key === "Escape") setOpenId("");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shown, cursor]);

  async function confirmAction() {
    if (!pending || busy) return;
    setBusy(true);
    try {
      const res = await sendJson(approvalEndpoint(pending.kind), "POST", approvalBody(pending.id, pending.action, reason));
      setMsg(res.ok ? tx("saved") : res.error || tx("failed"));
      if (res.ok) {
        setPending(null);
        setReason("");
        data.reload();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="c4-inbox-desk" aria-label={v4("inTitle")} data-ticket-inbox="">
      <h2 className="c4-title">{v4("inTitle")}</h2>
      <p className="c4-meta">{v4("inHint")}</p>
      <p className="c4-meta">{v4("inKeys")}</p>
      {viewer && <p className="c4-meta">{v4("inViewer")}</p>}
      <div className="c4-row">
        <label className="c4-lab"><span>{v4("inLimit")}</span>
          <input className="c4-field" inputMode="numeric" aria-label={v4("inLimit")} value={String(limit)} onChange={(event) => {
            const next = Math.max(1, Number(event.target.value) || 24);
            setLimit(next);
            setSlaLimit(next);
          }} />
        </label>
        <label className="c4-lab"><span>{v4("inDueWindow")}</span>
          <input className="c4-field" inputMode="numeric" aria-label={v4("inDueWindow")} value={String(due)} onChange={(event) => {
            const next = Math.max(1, Number(event.target.value) || 4);
            setDue(next);
            writeJson(DUE_KEY, next);
          }} />
        </label>
      </div>
      <div className="c4-row" aria-label={v4("inAllStatus")}>
        {["", "PENDING", "APPROVED", "REJECTED"].map((status) => (
          <button key={status || "all"} type="button" className="c4-chip" data-on={filter.status === status ? "1" : "0"} onClick={() => setFilter({ ...filter, status })}>{status || v4("inAllStatus")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={filter.sla === "due" ? "1" : "0"} onClick={() => setFilter({ ...filter, sla: filter.sla === "due" ? "" : "due" })}>{v4("inDue")}</button>
        <button type="button" className="c4-chip" data-on={filter.sla === "breached" ? "1" : "0"} onClick={() => setFilter({ ...filter, sla: filter.sla === "breached" ? "" : "breached" })}>{v4("inBreached")}</button>
      </div>
      <div className="c4-row" aria-label={v4("inKind")}>
        <button type="button" className="c4-chip" data-on={filter.kind ? "0" : "1"} onClick={() => setFilter({ ...filter, kind: "" })}>{v4("inAllKinds")}</button>
        {kinds.map((kind) => (
          <button key={kind} type="button" className="c4-chip" data-on={filter.kind === kind ? "1" : "0"} onClick={() => setFilter({ ...filter, kind })}>{kind}</button>
        ))}
      </div>
      <div className="c4-row">
        <span className="c4-meta">{v4("inViews")}</span>
        {views.map((view) => (
          <button key={view.id} type="button" className="c4-chip" onClick={() => setFilter({ status: view.status, kind: view.kind, sla: view.sla })}>{view.name}</button>
        ))}
        <input className="c4-field" aria-label={v4("inViewName")} value={viewName} onChange={(event) => setViewName(event.target.value)} />
        <button type="button" className="c4-btn" onClick={() => {
          const name = viewName.trim();
          if (!name) return;
          const next = saveView(views, { id: String(Date.now()), name, ...filter });
          setViews(next);
          writeJson(VIEW_KEY, next);
          setViewName("");
        }}>{v4("inSaveView")}</button>
      </div>
      <p className="c4-meta">{v4("inViewHint")} · {shown.length}</p>
      {!data.loading && !shown.length && <p className="c4-meta">{v4("inEmpty")}</p>}
      <ol className="c4-ticket-list">
        {shown.map((row, index) => {
          const clock = slaClock(row.openedAt, row.closedAt, now, limit, due);
          return (
            <li key={`${row.kind}-${row.id}`}>
              <button type="button" className="c4-ticket-row" data-on={current?.id === row.id ? "1" : "0"} data-sla={clock.mark} onClick={() => { setCursor(index); setOpenId(row.id); }}>
                <strong>{row.customer || "—"}</strong>
                <span>{row.kind} · {row.currency ? money(row.amount, row.currency, locale) : "—"}</span>
                <span className="c4-sla-pill" data-sla={clock.mark}>{v4(MARK[clock.mark])}</span>
                <span className="c4-meta">{v4("inOpened")} {formatAge(clock.hours)}</span>
              </button>
            </li>
          );
        })}
      </ol>
      {detail && (
        <article className="c4-ticket-detail" data-ticket-detail="">
          <h3 className="c4-title">{v4("inDetail")}</h3>
          <p>{detail.customer || "—"} · {detail.kind} · {detail.status || "—"}</p>
          <p>{detail.currency ? money(detail.amount, detail.currency, locale) : "—"}</p>
          <p className="c4-meta">{v4("inOpened")} {formatAge(slaClock(detail.openedAt, detail.closedAt, now, limit, due).hours)} · {when(detail.openedAt, locale)}</p>
          <p className="c4-meta">{detail.closedAt ? `${v4("inReply")} ${formatAge(slaClock(detail.openedAt, detail.closedAt, now, limit, due).replyHours || 0)}` : v4("inNoReply")}</p>
          {!viewer && detail.status === "PENDING" && (
            <div className="c4-row">
              <button type="button" className="c4-btn" onClick={() => setPending({ id: detail.id, kind: detail.kind, action: "approve" })}>{v4("inApprove")}</button>
              <button type="button" className="c4-btn" onClick={() => setPending({ id: detail.id, kind: detail.kind, action: "reject" })}>{v4("inReject")}</button>
            </div>
          )}
        </article>
      )}
      {pending && (
        <section className="c4-ticket-confirm" role="dialog" aria-label={v4("inConfirm")} data-confirm={pending.action}>
          <h3 className="c4-title">{pending.action === "approve" ? v4("inApprove") : v4("inReject")}</h3>
          <p className="c4-meta">{v4("inConfirmLead")}</p>
          <label className="c4-lab"><span>{v4("inReason")}</span>
            <textarea className="c4-field" rows={2} aria-label={v4("inReason")} value={reason} onChange={(event) => setReason(event.target.value)} />
          </label>
          <div className="c4-row">
            <button type="button" className="c4-btn c4-btn-hot" disabled={busy} onClick={() => void confirmAction()}>{v4("inConfirm")}</button>
            <button type="button" className="c4-btn" onClick={() => setPending(null)}>{v4("inCancel")}</button>
          </div>
        </section>
      )}
      {msg && <p className="c4-meta" aria-live="polite">{msg}</p>}
    </section>
  );
}

type User = { id: string; affiliateA?: string | null };
type Deposit = { amount?: number | null; currency?: string | null; userId?: string | null; user?: { id?: string | null } | null };

export function AffiliateDesk({ v4, locale }: { v4: V4; locale: string }) {
  const people = useJson<{ users?: User[] }>("/api/admin/users?view=table&take=80&meta=0&role=TRADER");
  const deposits = useJson<{ requests?: Deposit[] }>("/api/admin/deposits?take=80");
  const users = people.data?.users || [];
  const cash = (deposits.data?.requests || []).map((row) => ({
    userId: String(row.user?.id || row.userId || ""),
    amount: row.amount,
    currency: row.currency,
  }));
  const rows = introducers(users, cash);
  const currencies: string[] = [];
  for (const row of rows) for (const sum of row.sums) if (!currencies.includes(sum.currency)) currencies.push(sum.currency);
  currencies.sort();
  return (
    <section className="c4-aff-desk c4-aff-salon" aria-label={v4("afTitle")} data-affiliates="">
      <header className="c4-aff-salon-mast">
        <div>
          <p className="c4-aff-salon-kicker">{v4("afHint")}</p>
          <h2 className="c4-title c4-aff-salon-title">{v4("afTitle")}</h2>
        </div>
        <p className="c4-aff-salon-plate" data-logo="mono">7FX</p>
      </header>
      <p className="c4-meta">{v4("afCustomers")} {users.length}</p>
      {!rows.length && <p className="c4-meta">{v4("afEmpty")}</p>}
      <div className="c4-aff-grid">
        {rows.map((row) => (
          <article key={row.name || "none"} className="c4-aff-card c4-aff-salon-card" data-introducer={row.name || "none"}>
            <h3 className="c4-title">{row.name || v4("afNone")}</h3>
            <p>{v4("afCustomers")} {row.customers}</p>
            <p>{v4("afFunded")} {row.withDeposit}</p>
            <p className="c4-meta">{v4("afRate")} {row.customers ? `${Math.round((row.withDeposit / row.customers) * 100)}%` : "—"}</p>
            {!row.sums.length && <p className="c4-meta">{v4("afNoCash")}</p>}
            <ul>
              {row.sums.map((sum) => (
                <li key={sum.currency}>{sum.currency} · {sum.count} · {money(sum.amount, sum.currency, locale)}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
      <p className="c4-meta">{v4("afCsvHint")}</p>
      <button type="button" className="c4-btn" onClick={() => void exportIntroducers(rows, currencies)}>{v4("afCsv")}</button>
    </section>
  );
}

async function exportIntroducers(rows: ReturnType<typeof introducers>, currencies: string[]) {
  const ok = await auditExport("introducers", rows.length, "/crmv4/affiliates");
  if (!ok) return;
  downloadCsv("introducers.csv", ["name", "customers", "withDeposit", ...currencies], csvMatrix(rows, currencies));
}
