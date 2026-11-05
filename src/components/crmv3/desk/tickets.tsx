"use client";

import { useEffect, useState } from "react";
import { approvalBody, approvalEndpoint } from "@/lib/crmv2/payload";
import type { CrmV3CopyKey } from "@/lib/crmv3/copy";
import { readJson, writeJson } from "@/lib/crmv3/bridge";
import { useEscape } from "@/lib/crmv3/focus";
import {
  DUE_KEY,
  ROLE_KEY,
  SLA_KEY,
  VIEW_KEY,
  csvMatrix,
  deskRole,
  filterTickets,
  formatAge,
  introducers,
  readViews,
  saveView,
  slaClock,
  ticketMove,
  type TicketFilter,
  type TicketView,
} from "@/lib/crmv3/inbox-sla";
import { auditExport, downloadCsv, money, sendJson, useJson, when, type Tx } from "../kit";
import { useV3 } from "./store";

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

const MARK: Record<string, CrmV3CopyKey> = {
  none: "inNone",
  ok: "inOk",
  due: "inDue",
  breached: "inBreached",
};

function typingTarget(target: EventTarget | null): boolean {
  const node = target as HTMLElement | null;
  return Boolean(node && (node.tagName === "INPUT" || node.tagName === "TEXTAREA" || node.tagName === "SELECT" || node.isContentEditable));
}

export function TicketInbox({ tx, locale }: { tx: Tx; locale: string }) {
  const v3 = useV3();
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
    const storedLimit = Number(readJson(SLA_KEY, 24));
    setLimit(Number.isFinite(storedLimit) && storedLimit > 0 ? storedLimit : 24);
    const storedDue = Number(readJson(DUE_KEY, 4));
    setDue(Number.isFinite(storedDue) && storedDue > 0 ? storedDue : 4);
    setViews(readViews(readJson(VIEW_KEY, [])));
    setViewer(deskRole(readJson(ROLE_KEY, "desk")) === "viewer");
    const onRole = () => setViewer(deskRole(readJson(ROLE_KEY, "desk")) === "viewer");
    window.addEventListener("crmv3:desk-role", onRole);
    const timer = window.setInterval(() => setNow(Date.now()), 60000);
    return () => {
      window.removeEventListener("crmv3:desk-role", onRole);
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
      if (typingTarget(event.target)) return;
      if (event.key === "j") setCursor((index) => ticketMove(index, shown.length, 1));
      if (event.key === "k") setCursor((index) => ticketMove(index, shown.length, -1));
      if (event.key === "Enter" && shown[cursor]) setOpenId(shown[cursor].id);
      if (event.key === "Escape") setOpenId("");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shown, cursor]);

  function setPreview(next: "desk" | "viewer") {
    writeJson(ROLE_KEY, next);
    setViewer(next === "viewer");
    window.dispatchEvent(new Event("crmv3:desk-role"));
  }

  async function confirmAction() {
    if (!pending || busy || viewer) return;
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
    <section className="c3-inbox" aria-label={v3("inTitle")} data-ticket-inbox="">
      <h2 className="c3-title">{v3("inTitle")}</h2>
      <p className="c3-muted">{v3("inHint")}</p>
      <p className="c3-muted">{v3("inKeys")}</p>
      <div className="c3-row">
        <button type="button" className="c3-chip" data-on={viewer ? "1" : "0"} aria-pressed={viewer} onClick={() => setPreview(viewer ? "desk" : "viewer")}>{v3("inViewerChip")}</button>
      </div>
      {viewer && <p className="c3-muted">{v3("inViewer")}</p>}
      <div className="c3-row">
        <label className="c3-lab"><span>{v3("inLimit")}</span>
          <input className="c3-field" inputMode="numeric" aria-label={v3("inLimit")} value={String(limit)} onChange={(event) => {
            const next = Math.max(1, Number(event.target.value) || 24);
            setLimit(next);
            writeJson(SLA_KEY, next);
          }} />
        </label>
        <label className="c3-lab"><span>{v3("inDueWindow")}</span>
          <input className="c3-field" inputMode="numeric" aria-label={v3("inDueWindow")} value={String(due)} onChange={(event) => {
            const next = Math.max(1, Number(event.target.value) || 4);
            setDue(next);
            writeJson(DUE_KEY, next);
          }} />
        </label>
      </div>
      <div className="c3-row" role="group" aria-label={v3("inAllStatus")}>
        {["", "PENDING", "APPROVED", "REJECTED"].map((status) => (
          <button key={status || "all"} type="button" className="c3-chip" data-on={filter.status === status ? "1" : "0"} onClick={() => setFilter({ ...filter, status })}>{status || v3("inAllStatus")}</button>
        ))}
        <button type="button" className="c3-chip" data-on={filter.sla === "due" ? "1" : "0"} onClick={() => setFilter({ ...filter, sla: filter.sla === "due" ? "" : "due" })}>{v3("inDue")}</button>
        <button type="button" className="c3-chip" data-on={filter.sla === "breached" ? "1" : "0"} onClick={() => setFilter({ ...filter, sla: filter.sla === "breached" ? "" : "breached" })}>{v3("inBreached")}</button>
      </div>
      <div className="c3-row" role="group" aria-label={v3("inKind")}>
        <button type="button" className="c3-chip" data-on={filter.kind ? "0" : "1"} onClick={() => setFilter({ ...filter, kind: "" })}>{v3("inAllKinds")}</button>
        {kinds.map((kind) => (
          <button key={kind} type="button" className="c3-chip" data-on={filter.kind === kind ? "1" : "0"} onClick={() => setFilter({ ...filter, kind })}>{kind}</button>
        ))}
      </div>
      <div className="c3-row">
        <span className="c3-muted">{v3("inViews")}</span>
        {views.map((view) => (
          <button key={view.id} type="button" className="c3-chip" onClick={() => setFilter({ status: view.status, kind: view.kind, sla: view.sla })}>{view.name}</button>
        ))}
        <input className="c3-field" aria-label={v3("inViewName")} value={viewName} onChange={(event) => setViewName(event.target.value)} />
        <button type="button" className="c3-btn" onClick={() => {
          const name = viewName.trim();
          if (!name) return;
          const next = saveView(views, { id: String(Date.now()), name, ...filter });
          setViews(next);
          writeJson(VIEW_KEY, next);
          setViewName("");
        }}>{v3("inSaveView")}</button>
      </div>
      <p className="c3-muted">{v3("inViewHint")} · {shown.length}</p>
      {data.loading && !rows.length && <p className="c3-muted">{tx("loading")}</p>}
      {!data.loading && !shown.length && <p className="c3-empty">{v3("inEmpty")}</p>}
      <ol className="c3-ticket-list">
        {shown.map((row, index) => {
          const clock = slaClock(row.openedAt, row.closedAt, now, limit, due);
          return (
            <li key={`${row.kind}-${row.id}`}>
              <button type="button" className="c3-ticket-row" data-on={current?.id === row.id ? "1" : "0"} data-sla={clock.mark} onClick={() => { setCursor(index); setOpenId(row.id); }}>
                <strong>{row.customer || "—"}</strong>
                <span>{row.kind} · {row.currency ? money(row.amount, row.currency, locale) : "—"}</span>
                <span className="c3-sla" data-sla={clock.mark}>{v3(MARK[clock.mark])}</span>
                <span className="c3-muted">{v3("inOpened")} {formatAge(clock.hours)}</span>
              </button>
            </li>
          );
        })}
      </ol>
      {detail && (
        <article className="c3-ticket-detail" data-ticket-detail="">
          <h3 className="c3-title">{v3("inDetail")}</h3>
          <p>{detail.customer || "—"} · {detail.kind} · {detail.status || "—"}</p>
          <p>{detail.currency ? money(detail.amount, detail.currency, locale) : "—"}</p>
          <p className="c3-muted">{v3("inOpened")} {formatAge(slaClock(detail.openedAt, detail.closedAt, now, limit, due).hours)} · {when(detail.openedAt, locale)}</p>
          <p className="c3-muted">{detail.closedAt ? `${v3("inReply")} ${formatAge(slaClock(detail.openedAt, detail.closedAt, now, limit, due).replyHours || 0)}` : v3("inNoReply")}</p>
          {!viewer && detail.status === "PENDING" && (
            <div className="c3-row">
              <button type="button" className="c3-btn" onClick={() => setPending({ id: detail.id, kind: detail.kind, action: "approve" })}>{v3("inApprove")}</button>
              <button type="button" className="c3-btn" onClick={() => setPending({ id: detail.id, kind: detail.kind, action: "reject" })}>{v3("inReject")}</button>
            </div>
          )}
        </article>
      )}
      {pending && (
        <section className="c3-ticket-confirm" role="dialog" aria-label={v3("inConfirm")} data-confirm={pending.action}>
          <h3 className="c3-title">{pending.action === "approve" ? v3("inApprove") : v3("inReject")}</h3>
          <p className="c3-muted">{v3("inConfirmLead")}</p>
          <label className="c3-lab"><span>{v3("inReason")}</span>
            <textarea className="c3-field" rows={2} aria-label={v3("inReason")} aria-required={false} value={reason} onChange={(event) => setReason(event.target.value)} />
          </label>
          <div className="c3-row">
            <button type="button" className="c3-btn c3-btn-hot" disabled={busy} onClick={() => void confirmAction()}>{v3("inConfirm")}</button>
            <button type="button" className="c3-btn" onClick={() => setPending(null)}>{v3("inCancel")}</button>
          </div>
        </section>
      )}
      {msg && <p className="c3-muted" aria-live="polite">{msg}</p>}
    </section>
  );
}

type User = { id: string; affiliateA?: string | null };
type Deposit = { amount?: number | null; currency?: string | null; userId?: string | null; user?: { id?: string | null } | null };

export function AffiliateDesk({ base, locale }: { base: string; locale: string }) {
  const v3 = useV3();
  // The table view leaves introducer names off the row. This page needs those names.
  const people = useJson<{ users?: User[] }>("/api/admin/users?take=80&role=TRADER");
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
    <section className="c3-aff" aria-label={v3("afTitle")} data-affiliates="">
      <h2 className="c3-title">{v3("afTitle")}</h2>
      <p className="c3-muted">{v3("afHint")}</p>
      <p className="c3-muted">{v3("afCustomers")} {users.length}</p>
      {!people.loading && !rows.length && <p className="c3-empty">{v3("afEmpty")}</p>}
      <div className="c3-aff-grid">
        {rows.map((row) => (
          <article key={row.name || "none"} className="c3-aff-card" data-introducer={row.name || "none"}>
            <h3 className="c3-title">{row.name || v3("afNone")}</h3>
            <p>{v3("afCustomers")} {row.customers}</p>
            <p>{v3("afFunded")} {row.withDeposit}</p>
            <p className="c3-muted">{v3("afRate")} {row.customers ? `${Math.round((row.withDeposit / row.customers) * 100)}%` : "—"}</p>
            {!row.sums.length && <p className="c3-muted">{v3("afNoCash")}</p>}
            <ul>
              {row.sums.map((sum) => (
                <li key={sum.currency}>{sum.currency} · {sum.count} · {money(sum.amount, sum.currency, locale)}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
      <p className="c3-muted">{v3("afCsvHint")}</p>
      <button type="button" className="c3-btn" onClick={() => void exportIntroducers(base, rows, currencies)}>{v3("afCsv")}</button>
    </section>
  );
}

async function exportIntroducers(base: string, rows: ReturnType<typeof introducers>, currencies: string[]) {
  const ok = await auditExport("introducers", rows.length, `${base}/affiliates`);
  if (!ok) return;
  downloadCsv("introducers.csv", ["name", "customers", "withDeposit", ...currencies], csvMatrix(rows, currencies));
}
