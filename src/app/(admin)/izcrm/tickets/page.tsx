"use client";

import Link from "next/link";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StatusBadge } from "@/components/crm/StubPage";
import { ConfirmDialog, CrmFormGrid, ReflectBox, type CrmColumn } from "@/components/crm/CrmRecordTable";
import ClientPicker, { type ClientOption } from "@/components/crm/ClientPicker";
import { useCrmLabels } from "@/lib/i18n/crm-labels";
import { fmtCrmDate, fmtCrmMoney, fromDatetimeLocalValue, toDatetimeLocalValue } from "@/lib/crm-format";
import { ACCOUNT_CURRENCIES } from "@/lib/membership";
import { crmJson, dayEndIso, dayStartIso } from "@/lib/crm-api";

type Ticket = {
  id: string;
  kind: "DEPOSIT" | "MARGIN" | "WITHDRAW";
  amount: number | null;
  currency: string;
  status: string;
  method: string;
  customer: string;
  customerId: string;
  customerEmail: string;
  tradingAccountId: string | null;
  country: string | null;
  openedAt: string;
  closedAt: string | null;
  approvalReason?: string | null;
  eventScenario?: string | null;
  accountLoginId?: string | null;
  methodId?: string;
  type?: string;
  note?: string | null;
  adminNote?: string | null;
  details?: string | null;
  riskAcknowledged?: boolean;
  riskAcknowledgedAt?: string | null;
};

type Method = { id: string; label: string; type: string; active: boolean };
type KindKey = "DEPOSIT" | "WITHDRAW" | "MARGIN_ADD" | "MARGIN_RESET";
type Entity = "deposit" | "withdrawal" | "balanceRequest";
type Draft = Record<string, string>;

const KIND_KEYS: KindKey[] = ["DEPOSIT", "WITHDRAW", "MARGIN_ADD", "MARGIN_RESET"];
const STATUSES = ["PENDING", "APPROVED", "REJECTED"];
/** Kind filter values understood by /api/admin/tickets, mapped to Ticket.kind. */
const KIND_FILTERS: { value: string; kind: Ticket["kind"] }[] = [
  { value: "deposit", kind: "DEPOSIT" },
  { value: "margin", kind: "MARGIN" },
  { value: "withdraw", kind: "WITHDRAW" },
];

function csvCell(v: unknown): string {
  const s = v == null ? "" : String(v);
  return /[",\r\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function kindKeyOf(t: Ticket): KindKey {
  if (t.kind === "DEPOSIT") return "DEPOSIT";
  if (t.kind === "WITHDRAW") return "WITHDRAW";
  return t.type === "RESET" ? "MARGIN_RESET" : "MARGIN_ADD";
}
function entityOf(k: KindKey | Ticket["kind"]): Entity {
  if (k === "DEPOSIT") return "deposit";
  if (k === "WITHDRAW") return "withdrawal";
  return "balanceRequest";
}

function ticketDraft(t: Ticket): Draft {
  return {
    kindKey: kindKeyOf(t),
    clientId: t.customerId,
    amount: t.amount != null ? String(t.amount) : "",
    currency: t.currency || "USD",
    methodId: t.methodId || "",
    wmethod: t.kind === "WITHDRAW" ? t.method : "BANK",
    details: t.details || "",
    status: t.status,
    createdAt: toDatetimeLocalValue(t.openedAt),
    reviewedAt: toDatetimeLocalValue(t.closedAt),
    note: t.note || "",
    adminNote: t.adminNote || "",
    approvalReason: t.approvalReason || "",
    eventScenario: t.eventScenario || "",
  };
}

/** Build the records-API body for the draft's (target) kind. */
function draftBody(d: Draft, orig: Draft | null): Record<string, unknown> {
  const k = d.kindKey as KindKey;
  const b: Record<string, unknown> = {
    status: d.status,
    adminNote: d.adminNote,
    approvalReason: d.approvalReason,
    eventScenario: d.eventScenario,
  };
  if (k === "MARGIN_RESET" || k === "MARGIN_ADD") {
    b.type = k === "MARGIN_RESET" ? "RESET" : "ADD";
    b.amount = d.amount.trim() === "" ? "" : d.amount.replace(",", ".");
  } else {
    b.amount = d.amount.replace(",", ".");
    b.currency = d.currency;
    b.note = d.note;
    if (k === "DEPOSIT") {
      if (d.methodId) b.methodId = d.methodId;
    } else {
      b.method = d.wmethod || "BANK";
      b.details = d.details;
    }
  }
  // Dates: only send when changed (keeps reviewedAt auto-stamping on status change).
  for (const key of ["createdAt", "reviewedAt"]) {
    if (!orig || d[key] !== orig[key]) b[key] = d[key] ? fromDatetimeLocalValue(d[key]) : "";
  }
  return b;
}

export default function TicketsPage() {
  const { i18n, code } = useCrmLabels();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [status, setStatus] = useState("PENDING");
  const [kind, setKind] = useState("all");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [approveTarget, setApproveTarget] = useState<Ticket | null>(null);
  const [reason, setReason] = useState("");
  const [scenario, setScenario] = useState("");
  const [scenarioBusy, setScenarioBusy] = useState(false);
  const [dialogErr, setDialogErr] = useState("");
  const [openRecord, setOpenRecord] = useState<string | null>(null);
  const [methods, setMethods] = useState<Method[]>([]);
  const [q, setQ] = useState("");
  const [qDebounced, setQDebounced] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  // Per-kind counts from the last load WITHOUT a kind filter, so chips stay stable
  // while a kind chip is active (the API filters by kind server-side).
  const [baseCounts, setBaseCounts] = useState<{ total: number; byKind: Record<string, number> } | null>(null);
  // inline edit
  const [editKey, setEditKey] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>({});
  const [origDraft, setOrigDraft] = useState<Draft | null>(null);
  const [editApply, setEditApply] = useState(false);
  const [editErr, setEditErr] = useState("");
  // add
  const [adding, setAdding] = useState(false);
  const [newDraft, setNewDraft] = useState<Draft>({});
  const [newApply, setNewApply] = useState(false);
  const [newErr, setNewErr] = useState("");
  // delete
  const [deleteTarget, setDeleteTarget] = useState<Ticket | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [moreBusy, setMoreBusy] = useState(false);
  const ticketsRef = useRef<Ticket[]>([]);
  const cursorsRef = useRef({ deposit: 0, margin: 0, withdraw: 0 });

  useEffect(() => {
    const t = setTimeout(() => setQDebounced(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  const load = useCallback(async (mode: "replace" | "more" = "replace") => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (kind !== "all") params.set("kind", kind);
    if (qDebounced) params.set("q", qDebounced);
    const f = dayStartIso(from);
    const tt = dayEndIso(to);
    if (f) params.set("from", f);
    if (tt) params.set("to", tt);
    const cursors = mode === "more" ? cursorsRef.current : { deposit: 0, margin: 0, withdraw: 0 };
    params.set("take", "50");
    params.set("depSkip", String(cursors.deposit));
    params.set("marginSkip", String(cursors.margin));
    params.set("wdSkip", String(cursors.withdraw));
    if (mode === "more") setMoreBusy(true);
    else setLoading(true);
    try {
      const res = await fetch(`/api/admin/tickets?${params}`);
      if (!res.ok) return;
      const data = await res.json();
      const incoming: Ticket[] = data.tickets || [];
      const seen = new Set(ticketsRef.current.map((row) => `${row.kind}:${row.id}`));
      const list = mode === "more" ? ticketsRef.current.concat(incoming.filter((row) => !seen.has(`${row.kind}:${row.id}`))) : incoming;
      ticketsRef.current = list;
      setTickets(list);
      setMethods(data.methods || []);
      if (data.cursors) cursorsRef.current = data.cursors;
      setHasMore(Boolean(data.hasMore));
      if (mode === "replace" && data.counts) {
        const byKind = {
          DEPOSIT: Number(data.counts.DEPOSIT) || 0,
          MARGIN: Number(data.counts.MARGIN) || 0,
          WITHDRAW: Number(data.counts.WITHDRAW) || 0,
        };
        setBaseCounts({ total: byKind.DEPOSIT + byKind.MARGIN + byKind.WITHDRAW, byKind });
      }
    } finally {
      if (mode === "more") setMoreBusy(false);
      else setLoading(false);
    }
  }, [status, kind, qDebounced, from, to]);

  const kindChips = useMemo(() => {
    const base = baseCounts || { total: tickets.length, byKind: {} as Record<string, number> };
    return {
      total: base.total,
      list: KIND_FILTERS.map((f) => ({
        ...f,
        n: base.byKind[f.kind] || 0,
      })),
    };
  }, [baseCounts, tickets.length]);

  /** Amount totals of the shown rows, per kind + currency (rows without amount skipped). */
  const totals = useMemo(() => {
    const m = new Map<string, { kind: Ticket["kind"]; currency: string; sum: number; n: number }>();
    for (const t of tickets) {
      if (t.amount == null) continue;
      const key = `${t.kind}|${t.currency || "USD"}`;
      const cur = m.get(key) || { kind: t.kind, currency: t.currency || "USD", sum: 0, n: 0 };
      cur.sum += Number(t.amount) || 0;
      cur.n += 1;
      m.set(key, cur);
    }
    return Array.from(m.values());
  }, [tickets]);

  function downloadCsv() {
    const header = [
      i18n("crm.ui.type"),
      i18n("crm.ui.amount"),
      i18n("crm.ui.currency"),
      i18n("crm.ui.client"),
      "E-mail",
      i18n("crm.ui.account"),
      i18n("crm.ui.method"),
      i18n("crm.ui.status"),
      i18n("crm.ui.opened"),
      i18n("crm.edit.reviewedAt"),
      i18n("crm.edit.approvalReason"),
    ];
    const lines = [header.map(csvCell).join(",")];
    for (const t of tickets) {
      lines.push(
        [
          code("crm.kind", t.kind),
          t.amount ?? "",
          t.amount != null ? t.currency || "" : "",
          t.customer,
          t.customerEmail,
          t.accountLoginId || t.tradingAccountId || "",
          methodLabel(t),
          code("crm.status", t.status),
          t.openedAt || "",
          t.closedAt || "",
          t.approvalReason || "",
        ]
          .map(csvCell)
          .join(","),
      );
    }
    const blob = new Blob(["\uFEFF" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tickets-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  useEffect(() => {
    load();
  }, [load]);

  function openApprove(ticket: Ticket) {
    setApproveTarget(ticket);
    setReason("");
    setScenario("");
    setDialogErr("");
  }

  async function prepareScenario() {
    if (!approveTarget) return;
    setScenarioBusy(true);
    setDialogErr("");
    try {
      const res = await fetch("/api/admin/deposits/scenario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: approveTarget.id,
          kind: approveTarget.kind,
          reason,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setDialogErr(data.error || i18n("crm.tickets.scenarioFailed"));
        return;
      }
      setScenario(String(data.scenario || ""));
    } finally {
      setScenarioBusy(false);
    }
  }

  async function act(
    ticket: Ticket,
    action: "approve" | "reject",
    extra?: { approvalReason?: string; eventScenario?: string }
  ) {
    setBusy(true);
    setMsg("");
    try {
      const url =
        ticket.kind === "DEPOSIT"
          ? "/api/admin/deposits"
          : ticket.kind === "WITHDRAW"
            ? "/api/admin/withdrawals"
            : "/api/admin/balance-requests";
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: ticket.id, action, ...extra }),
      });
      const data = await res.json();
      if (!res.ok) {
        const err = data.error || i18n("crm.ui.actionFailed");
        if (action === "approve") setDialogErr(err);
        else setMsg(err);
        return false;
      }
      setMsg(action === "approve" ? i18n("crm.tickets.approvedMsg") : i18n("crm.dep.rejected"));
      await load();
      return true;
    } finally {
      setBusy(false);
    }
  }

  async function confirmApprove() {
    if (!approveTarget) return;
    if (!reason.trim()) {
      setDialogErr(i18n("crm.tickets.reasonRequired"));
      return;
    }
    const ok = await act(approveTarget, "approve", {
      approvalReason: reason.trim(),
      eventScenario: scenario.trim(),
    });
    if (ok) {
      setApproveTarget(null);
      setReason("");
      setScenario("");
    }
  }


  const ticketKey = (t: Ticket) => `${t.kind}-${t.id}`;

  function startEdit(t: Ticket) {
    const d = ticketDraft(t);
    setEditKey(ticketKey(t));
    setDraft(d);
    setOrigDraft(d);
    setEditApply(false);
    setEditErr("");
    setMsg("");
    setErr("");
  }

  function validate(d: Draft): string | null {
    if (!d.clientId) return `${i18n("crm.ui.client")}: ${i18n("crm.edit.required")}`;
    const k = d.kindKey as KindKey;
    if (k !== "MARGIN_RESET") {
      const n = Number(String(d.amount).replace(",", "."));
      if (!Number.isFinite(n) || n <= 0) return `${i18n("crm.ui.amount")}: > 0`;
    }
    if (k === "DEPOSIT" && !d.methodId) return `${i18n("crm.ui.method")}: ${i18n("crm.edit.required")}`;
    return null;
  }

  async function saveEdit(t: Ticket) {
    const v = validate(draft);
    if (v) {
      setEditErr(v);
      return;
    }
    setBusy(true);
    setEditErr("");
    try {
      const entity = entityOf(t.kind);
      const target = entityOf(draft.kindKey as KindKey);
      const body: Record<string, unknown> = {
        entity,
        id: t.id,
        applyToBalance: editApply,
        ...draftBody(draft, origDraft),
      };
      if (target !== entity) body.convertTo = target;
      if (draft.clientId !== t.customerId) body.moveToUserId = draft.clientId;
      const r = await crmJson(`/api/admin/users/${t.customerId}/records`, "PATCH", body);
      if (!r.ok) {
        setEditErr(r.error || i18n("crm.ui.saveFailed"));
        return;
      }
      setEditKey(null);
      setMsg(i18n("crm.ui.saved"));
      await load();
    } finally {
      setBusy(false);
    }
  }

  function openAdd() {
    setAdding(true);
    setNewApply(false);
    setNewErr("");
    setNewDraft({
      kindKey: "DEPOSIT",
      clientId: "",
      amount: "",
      currency: "USD",
      methodId: methods.find((m) => m.active)?.id || methods[0]?.id || "",
      wmethod: "BANK",
      details: "",
      status: "PENDING",
      createdAt: "",
      reviewedAt: "",
      note: "",
      adminNote: "",
      approvalReason: "",
      eventScenario: "",
    });
  }

  async function saveNew() {
    const v = validate(newDraft);
    if (v) {
      setNewErr(v);
      return;
    }
    setBusy(true);
    setNewErr("");
    try {
      const body = { entity: entityOf(newDraft.kindKey as KindKey), applyToBalance: newApply, ...draftBody(newDraft, null) };
      if (!newDraft.createdAt) delete (body as Record<string, unknown>).createdAt;
      if (!newDraft.reviewedAt) delete (body as Record<string, unknown>).reviewedAt;
      const r = await crmJson(`/api/admin/users/${newDraft.clientId}/records`, "POST", body);
      if (!r.ok) {
        setNewErr(r.error || i18n("crm.ui.saveFailed"));
        return;
      }
      setAdding(false);
      setMsg(i18n("crm.edit.created"));
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete(applyToBalance: boolean) {
    const t = deleteTarget;
    if (!t) return;
    setBusy(true);
    setErr("");
    try {
      const r = await crmJson(`/api/admin/users/${t.customerId}/records`, "DELETE", {
        entity: entityOf(t.kind),
        id: t.id,
        applyToBalance,
      });
      if (!r.ok) {
        setErr(r.error || i18n("crm.ui.saveFailed"));
        return;
      }
      setMsg(i18n("crm.edit.deleted"));
      await load();
    } finally {
      setBusy(false);
      setDeleteTarget(null);
    }
  }

  const methodOpts = useMemo(
    () => methods.map((m) => ({ value: m.id, label: `${m.label} (${m.type})${m.active ? "" : " ✕"}` })),
    [methods]
  );

  /** Fields shown for the draft's kind (same component for edit row + add form). */
  function formColumns(d: Draft, withClient: boolean, row?: Ticket): CrmColumn[] {
    const k = d.kindKey as KindKey;
    const cols: CrmColumn[] = [
      {
        key: "kindKey",
        label: "crm.ui.type",
        type: "select",
        required: true,
        options: KIND_KEYS.map((x) => ({ value: x, label: i18n(`crm.tickets.kind.${x}`) })),
      },
    ];
    if (withClient) {
      cols.push({
        key: "clientId",
        label: "crm.ui.client",
        required: true,
        editor: (value, onChange) => (
          <ClientPicker
            value={value}
            initialLabel={row && value === row.customerId ? `${row.customer} · ${row.customerEmail}` : undefined}
            onChange={(id, c: ClientOption | null) => {
              onChange(id);
              if (!row && c?.currency) setNewDraft((nd) => ({ ...nd, currency: c.currency || nd.currency }));
            }}
          />
        ),
      });
    }
    cols.push({
      key: "amount",
      label: k === "MARGIN_RESET" ? "crm.tickets.amountOptional" : "crm.ui.amount",
      type: "money",
      required: k !== "MARGIN_RESET",
    });
    if (k === "DEPOSIT" || k === "WITHDRAW") {
      cols.push({
        key: "currency",
        label: "crm.ui.currency",
        type: "select",
        required: true,
        options: ACCOUNT_CURRENCIES.map((c) => ({ value: c, label: c })),
      });
    }
    if (k === "DEPOSIT") {
      cols.push({ key: "methodId", label: "crm.ui.method", type: "select", required: true, options: methodOpts });
    }
    if (k === "WITHDRAW") {
      cols.push({
        key: "wmethod",
        label: "crm.ui.method",
        type: "select",
        required: true,
        options: ["BANK", "CRYPTO"].map((m) => ({ value: m, label: code("crm.edit.wmethod", m) })),
      });
      cols.push({ key: "details", label: "crm.edit.details" });
    }
    cols.push(
      {
        key: "status",
        label: "crm.ui.status",
        type: "select",
        required: true,
        options: STATUSES.map((x) => ({ value: x, label: code("crm.status", x) })),
      },
      { key: "createdAt", label: "crm.ui.opened", type: "datetime" },
      { key: "reviewedAt", label: "crm.edit.reviewedAt", type: "datetime" }
    );
    if (k === "DEPOSIT" || k === "WITHDRAW") cols.push({ key: "note", label: "crm.edit.clientNote", type: "textarea" });
    cols.push(
      { key: "adminNote", label: "crm.edit.adminNote", type: "textarea" },
      { key: "approvalReason", label: "crm.edit.approvalReason", type: "textarea" },
      { key: "eventScenario", label: "crm.edit.eventScenario", type: "textarea" }
    );
    return cols;
  }

  function methodLabel(t: Ticket) {
    if (t.kind === "WITHDRAW") return code("crm.edit.wmethod", t.method);
    if (t.kind === "MARGIN") return code("crm.kind", t.type || t.method);
    return t.method;
  }

  return (
    <div>
      <h1 className="mb-3 text-lg font-semibold">{i18n("crm.tickets.title")}</h1>
      <p className="mb-3 text-[11px] text-neutral-500">{i18n("crm.tickets.intro")}</p>
      <div className="mb-3 flex flex-wrap gap-2 text-xs">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded border border-neutral-300 bg-[#ffffff] px-2 py-1.5"
        >
          <option value="">{i18n("crm.ui.allStatuses")}</option>
          <option value="PENDING">{code("crm.status", "PENDING")}</option>
          <option value="APPROVED">{code("crm.status", "APPROVED")}</option>
          <option value="REJECTED">{code("crm.status", "REJECTED")}</option>
        </select>
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value)}
          className="rounded border border-neutral-300 bg-[#ffffff] px-2 py-1.5"
        >
          <option value="all">{i18n("crm.ui.allTypes")}</option>
          <option value="deposit">{code("crm.kind", "DEPOSIT")}</option>
          <option value="margin">{code("crm.kind", "MARGIN")}</option>
          <option value="withdraw">{code("crm.kind", "WITHDRAW")}</option>
        </select>
        <div className="relative">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setQ("");
            }}
            placeholder={i18n("crm.edit.searchClient")}
            className="w-52 rounded border border-neutral-300 bg-white px-2 py-1.5 pr-6"
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label={i18n("crm.ui.clearField")}
              title={i18n("crm.ui.clearField")}
              className="absolute right-1 top-1/2 -translate-y-1/2 px-1 text-neutral-400 hover:text-neutral-700"
            >
              ×
            </button>
          )}
        </div>
        <label className="flex items-center gap-1 text-neutral-500">
          {i18n("crm.ui.from")}
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded border border-neutral-300 bg-white px-2 py-1" />
        </label>
        <label className="flex items-center gap-1 text-neutral-500">
          {i18n("crm.ui.to")}
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded border border-neutral-300 bg-white px-2 py-1" />
        </label>
        <button
          type="button"
          onClick={() => {
            setStatus("PENDING");
            setKind("all");
            setQ("");
            setFrom("");
            setTo("");
          }}
          className="rounded border border-neutral-300 bg-white px-2 py-1.5 hover:bg-neutral-50"
        >
          {i18n("crm.ui.clear")}
        </button>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded border border-neutral-300 bg-white px-2 py-1.5 hover:bg-neutral-50"
        >
          {loading ? i18n("crm.ui.loading") : i18n("crm.ui.refresh")}
        </button>
        <button
          type="button"
          onClick={downloadCsv}
          disabled={tickets.length === 0}
          title="Gösterilen satırları CSV indir · Download shown rows as CSV"
          className="rounded border border-neutral-300 bg-white px-2 py-1.5 font-medium text-neutral-700 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          CSV
        </button>
        <button
          type="button"
          onClick={openAdd}
          className="rounded border border-[#111111] bg-white px-2.5 py-1.5 font-semibold text-[#111111] hover:bg-neutral-50"
        >
          + {i18n("crm.edit.newRecord")}
        </button>
        <Link href="/izcrm/deposits" className="rounded bg-neutral-100 px-2 py-1.5 hover:bg-neutral-200">
          {i18n("crm.tickets.legacyDeposits")}
        </Link>
        <Link href="/izcrm/withdrawals" className="rounded bg-neutral-100 px-2 py-1.5 hover:bg-neutral-200">
          {i18n("crm.edit.withdrawals")}
        </Link>
        <Link
          href="/izcrm/balance-requests"
          className="rounded bg-neutral-100 px-2 py-1.5 hover:bg-neutral-200"
        >
          {i18n("crm.tickets.legacyMargin")}
        </Link>
      </div>
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        {[{ value: "all", label: i18n("crm.ui.all"), n: kindChips.total }, ...kindChips.list.map((c) => ({ value: c.value, label: code("crm.kind", c.kind), n: c.n }))].map((c) => {
          const active = kind === c.value;
          return (
            <button
              key={c.value}
              type="button"
              aria-pressed={active}
              onClick={() => setKind(c.value)}
              className={`rounded-full border px-2.5 py-0.5 text-[11px] transition ${
                active ? "border-black bg-black text-white" : "border-neutral-300 bg-white text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              {c.label}
              <span className="ml-1 tabular-nums opacity-70">{c.n}</span>
            </button>
          );
        })}
      </div>
      <div className="mb-3 flex flex-wrap gap-3 text-[11px] text-neutral-600">
        <span>
          {tickets.length} {i18n("crm.ui.records")}
        </span>
        {totals.map((t) => (
          <span key={`${t.kind}|${t.currency}`} className="tabular-nums" title={`${t.n}`}>
            {code("crm.kind", t.kind)} {t.currency}: <b>{fmtCrmMoney(t.sum, 2)}</b>
            <span className="ml-0.5 text-neutral-400">({t.n})</span>
          </span>
        ))}
      </div>
      <p className="mb-3 rounded border border-amber-200 bg-amber-50 p-2 text-[11px] text-amber-900">
        {i18n("crm.edit.balanceRule")} {i18n("crm.tickets.kindChangeHint")}
      </p>
      {adding && (
        <div className="mb-3 rounded-xl border border-[#e5e5e5] bg-white p-3">
          <div className="mb-2 text-xs font-semibold">{i18n("crm.tickets.newTitle")}</div>
          <CrmFormGrid columns={formColumns(newDraft, true)} draft={newDraft} setDraft={setNewDraft} />
          {newErr && <p className="mt-2 text-[11px] text-red-600">{newErr}</p>}
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={saveNew}
              className="rounded bg-black px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-neutral-800 disabled:opacity-50"
            >
              {i18n("crm.ui.save")}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setAdding(false)}
              className="rounded border border-neutral-300 px-3 py-1.5 text-[11px]"
            >
              {i18n("crm.ui.cancel")}
            </button>
            <ReflectBox checked={newApply} onChange={setNewApply} />
          </div>
          <p className="mt-1 text-[10px] text-neutral-500">{i18n("crm.edit.reflectHint")}</p>
        </div>
      )}
      {msg && <p className="mb-2 text-xs text-emerald-700">{msg}</p>}
      {err && <p className="mb-2 text-xs text-red-600">{err}</p>}
      <div className="overflow-x-auto rounded-lg border border-neutral-200">
        <table className="w-full text-left text-[11px]">
          <thead className="bg-[#ffffff] text-neutral-500">
            <tr>
              <th className="px-2 py-2">{i18n("crm.ui.type")}</th>
              <th className="px-2 py-2">{i18n("crm.ui.amount")}</th>
              <th className="px-2 py-2">{i18n("crm.ui.client")}</th>
              <th className="px-2 py-2">{i18n("crm.ui.account")}</th>
              <th className="px-2 py-2">{i18n("crm.ui.method")}</th>
              <th className="px-2 py-2">{i18n("crm.ui.status")}</th>
              <th className="px-2 py-2">{i18n("crm.ui.opened")}</th>
              <th className="px-2 py-2">{i18n("crm.ui.action")}</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => {
              const rowKey = ticketKey(ticket);
              const isEdit = editKey === rowKey;
              const hasRecord = Boolean(ticket.approvalReason || ticket.eventScenario || ticket.riskAcknowledged);
              return (
                <Fragment key={rowKey}>
                  <tr className={`border-t border-neutral-200 ${isEdit ? "bg-amber-50/70" : ""}`}>
                    <td className="px-2 py-1.5">
                      <span
                        className={`whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                          ticket.kind === "DEPOSIT"
                            ? "bg-sky-50 text-sky-700"
                            : ticket.kind === "WITHDRAW"
                              ? "bg-violet-50 text-violet-700"
                              : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {code("crm.kind", ticket.kind)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-2 py-1.5 tabular-nums">
                      {ticket.amount != null
                        ? `${fmtCrmMoney(ticket.amount, 2)} ${ticket.currency}`
                        : methodLabel(ticket)}
                    </td>
                    <td className="px-2 py-1.5">
                      <Link href={`/izcrm/traders/${ticket.customerId}`} className="text-sky-700 hover:underline">
                        {ticket.customer}
                      </Link>
                      <div className="text-[9px] text-neutral-500">{ticket.customerEmail}</div>
                    </td>
                    <td className="px-2 py-1.5 font-mono text-[9px] text-neutral-500">
                      {ticket.accountLoginId || (ticket.tradingAccountId || "—").slice(0, 12)}
                    </td>
                    <td className="px-2 py-1.5">
                      {methodLabel(ticket)}
                      {ticket.kind === "MARGIN" && ticket.type === "ADD" && (
                        <div
                          title={ticket.riskAcknowledgedAt ? fmtCrmDate(ticket.riskAcknowledgedAt) : undefined}
                          className={`mt-0.5 inline-block whitespace-nowrap rounded px-1 py-0.5 text-[9px] font-semibold ${
                            ticket.riskAcknowledged ? "bg-emerald-50 text-emerald-700" : "bg-neutral-100 text-neutral-500"
                          }`}
                        >
                          {ticket.riskAcknowledged ? `✓ ${i18n("crm.bal.riskAck")}` : i18n("crm.bal.riskAckNo")}
                        </div>
                      )}
                    </td>
                    <td className="px-2 py-1.5">
                      <StatusBadge status={ticket.status} />
                      {hasRecord && (
                        <button
                          type="button"
                          onClick={() => setOpenRecord(openRecord === rowKey ? null : rowKey)}
                          className="ml-1 rounded border border-neutral-300 bg-white px-1 py-0.5 text-[9px] text-neutral-700 hover:bg-neutral-100"
                        >
                          {openRecord === rowKey ? i18n("crm.tickets.hideRecord") : i18n("crm.tickets.record")}
                        </button>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-2 py-1.5 text-neutral-500">
                      {fmtCrmDate(ticket.openedAt)}
                      {ticket.closedAt && (
                        <div className="text-[9px] text-neutral-400">
                          {i18n("crm.edit.reviewedAt")}: {fmtCrmDate(ticket.closedAt)}
                        </div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-2 py-1.5">
                      <div className="flex flex-wrap gap-1">
                        {isEdit ? (
                          <>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => saveEdit(ticket)}
                              className="rounded bg-black px-2 py-0.5 text-[10px] font-semibold text-white disabled:opacity-50"
                            >
                              {i18n("crm.ui.save")}
                            </button>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => setEditKey(null)}
                              className="rounded border border-neutral-300 px-2 py-0.5 text-[10px]"
                            >
                              {i18n("crm.ui.cancel")}
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => startEdit(ticket)}
                              className="rounded border border-[#111111] bg-white px-2 py-0.5 text-[10px] font-semibold text-[#111111] hover:bg-neutral-50"
                            >
                              {i18n("crm.ui.edit")}
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(ticket)}
                              className="rounded border border-red-300 bg-white px-2 py-0.5 text-[10px] font-semibold text-red-600 hover:bg-red-50"
                            >
                              {i18n("crm.ui.delete")}
                            </button>
                          </>
                        )}
                      </div>
                      {ticket.status === "PENDING" && !isEdit && (
                        <div className="mt-1 flex gap-1">
                          <button
                            disabled={busy}
                            onClick={() => openApprove(ticket)}
                            className="rounded bg-emerald-600/80 px-2 py-0.5 text-white hover:bg-emerald-500"
                          >
                            {i18n("crm.ui.approve")}
                          </button>
                          <button
                            disabled={busy}
                            onClick={() => act(ticket, "reject")}
                            className="rounded bg-red-600/80 px-2 py-0.5 text-white hover:bg-red-500"
                          >
                            {i18n("crm.ui.reject")}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                  {isEdit && (
                    <tr className="border-t border-amber-100 bg-amber-50/70">
                      <td colSpan={8} className="px-3 py-3">
                        <CrmFormGrid columns={formColumns(draft, true, ticket)} draft={draft} setDraft={setDraft} row={ticket as unknown as Record<string, unknown>} />
                        {editErr && <p className="mt-2 text-[11px] text-red-600">{editErr}</p>}
                        <div className="mt-2 flex flex-wrap items-center gap-3">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => saveEdit(ticket)}
                            className="rounded bg-black px-3 py-1.5 text-[11px] font-semibold text-white disabled:opacity-50"
                          >
                            {i18n("crm.ui.save")}
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => setEditKey(null)}
                            className="rounded border border-neutral-300 px-3 py-1.5 text-[11px]"
                          >
                            {i18n("crm.ui.cancel")}
                          </button>
                          <ReflectBox checked={editApply} onChange={setEditApply} />
                          <span className="text-[10px] text-neutral-500">{i18n("crm.edit.reassignHint")}</span>
                        </div>
                      </td>
                    </tr>
                  )}
                  {openRecord === rowKey && hasRecord && (
                    <tr className="border-t border-neutral-100 bg-white">
                      <td colSpan={8} className="px-3 py-2 text-[11px] text-neutral-800">
                        {ticket.kind === "MARGIN" && ticket.riskAcknowledged && (
                          <div className="mb-2 rounded border border-emerald-200 bg-emerald-50 px-2 py-1 text-emerald-800">
                            <div className="font-medium">
                              ✓ {i18n("crm.bal.riskAck")}
                              {ticket.riskAcknowledgedAt ? ` — ${fmtCrmDate(ticket.riskAcknowledgedAt)}` : ""}
                            </div>
                            <div className="text-[10px]">{i18n("crm.bal.riskAckText")}</div>
                          </div>
                        )}
                        <div className="mb-1 font-medium">{i18n("crm.tickets.approveReason")}</div>
                        <p className="mb-2 whitespace-pre-wrap">{ticket.approvalReason || "—"}</p>
                        <div className="mb-1 font-medium">{i18n("crm.tickets.eventScenario")}</div>
                        <p className="whitespace-pre-wrap">{ticket.eventScenario || "—"}</p>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {tickets.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-neutral-500">
                  {i18n("crm.ui.noTickets")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {hasMore && (
        <button
          type="button"
          disabled={moreBusy}
          onClick={() => void load("more")}
          className="mt-3 w-full rounded-lg border border-[#e5e5e5] bg-white px-3 py-2 text-sm font-medium hover:bg-[#f7f7f7] disabled:opacity-50"
        >
          {moreBusy ? i18n("crm.ui.loading") : i18n("crm.ui.loadMore")}
        </button>
      )}

      <ConfirmDialog
        open={deleteTarget != null}
        title={i18n("crm.edit.confirmTitle")}
        message={i18n("crm.edit.confirmDelete")}
        confirmLabel={i18n("crm.edit.yesDelete")}
        danger
        balanceAware
        busy={busy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {approveTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-lg rounded-lg border border-neutral-200 bg-white p-4 text-neutral-900 shadow-lg">
            <h2 className="mb-1 text-sm font-semibold">{i18n("crm.tickets.approveTitle")}</h2>
            <p className="mb-3 text-[11px] text-neutral-500">
              {approveTarget.customer} · {approveTarget.customerEmail} ·{" "}
              {approveTarget.amount != null
                ? `${fmtCrmMoney(approveTarget.amount, 2)} ${approveTarget.currency}`
                : methodLabel(approveTarget)}
            </p>
            <label className="mb-1 block text-[11px] font-medium">
              {i18n("crm.tickets.approveReason")}
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder={i18n("crm.tickets.approveReasonPh")}
              className="mb-3 w-full rounded border border-neutral-300 bg-white px-2 py-1.5 text-xs"
            />
            <div className="mb-1 flex items-center gap-2">
              <label className="text-[11px] font-medium">{i18n("crm.tickets.eventScenario")}</label>
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[9px] text-emerald-800">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {i18n("crm.tickets.scenarioReady")}
              </span>
              <button
                type="button"
                onClick={prepareScenario}
                disabled={scenarioBusy}
                className="ml-auto rounded border border-neutral-300 bg-white px-2 py-0.5 text-[11px] hover:bg-neutral-100 disabled:opacity-60"
              >
                {scenarioBusy ? i18n("crm.tickets.preparing") : i18n("crm.tickets.prepareScenario")}
              </button>
            </div>
            <textarea
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
              rows={7}
              placeholder={i18n("crm.tickets.scenarioPh")}
              className="mb-3 w-full rounded border border-neutral-300 bg-white px-2 py-1.5 text-xs"
            />
            {dialogErr && <p className="mb-2 text-[11px] text-red-600">{dialogErr}</p>}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setApproveTarget(null)}
                className="rounded border border-neutral-300 bg-white px-3 py-1.5 text-xs hover:bg-neutral-100"
              >
                {i18n("crm.tickets.cancel")}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={confirmApprove}
                className="rounded bg-emerald-600 px-3 py-1.5 text-xs text-white hover:bg-emerald-500 disabled:opacity-60"
              >
                {i18n("crm.tickets.confirmApprove")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
