"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { approvalBody, approvalEndpoint } from "@/lib/crmv2/payload";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { formatAge } from "@/lib/crmv4/round1";
import { methodName } from "@/lib/crmv4/round15";
import {
  ageHours,
  appendFunds,
  dropFundView,
  filterFunds,
  fundCurrency,
  fundQuery,
  listMove,
  minApplies,
  orderCards,
  pendingSums,
  readFundViews,
  readPins,
  samePerson,
  saveFundView,
  segmentCards,
  togglePin,
  uniqueText,
  type FundFilter,
  type FundRow,
  type FundSort,
  type FundStatus,
  type FundView,
  type SegAxis,
  type SegPerson,
} from "@/lib/crmv4/round48";
import { crmv4Href } from "@/lib/crmv4/sections";
import { storedRole } from "./round5";
import { useEscape } from "./round40";
import { money, sendJson, useJson, when, type Tx } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const VIEW_KEY = "crmv4-funding-views";
const PIN_KEY = "crmv4-segment-cards";

const STATUS_LABEL: Record<string, CrmV4CopyKey> = {
  PENDING: "fuPending",
  APPROVED: "fuApproved",
  REJECTED: "fuRejected",
};

const AXIS_LABEL: Record<SegAxis, CrmV4CopyKey> = {
  country: "sgCountry",
  saleStatus: "sgStage",
  documentsStatus: "sgKyc",
  currency: "sgCurrency",
};

function typing(target: EventTarget | null): boolean {
  const node = target as HTMLElement | null;
  return Boolean(node && (node.tagName === "INPUT" || node.tagName === "TEXTAREA" || node.tagName === "SELECT" || node.isContentEditable));
}

type RawDeposit = {
  id: string;
  amount?: number | null;
  currency?: string | null;
  status?: string | null;
  method?: unknown;
  createdAt?: string | null;
  user?: { id?: string | null; name?: string | null; email?: string | null } | null;
};

function asFunds(rows: RawDeposit[] | undefined): FundRow[] {
  return (rows || []).map((row) => {
    const method = methodName(row.method);
    return { ...row, method: method === "—" ? "" : method };
  });
}

export function FundingDesk({ base, v4, tx, locale }: { base: string; v4: V4; tx: Tx; locale: string }) {
  const [status, setStatus] = useState<FundStatus>("PENDING");
  const [skip, setSkip] = useState(0);
  const [rows, setRows] = useState<FundRow[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [nextSkip, setNextSkip] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);
  const [filter, setFilter] = useState<FundFilter>({ text: "", currency: "", method: "", min: null, sort: "new" });
  const [views, setViews] = useState<FundView[]>([]);
  const [viewName, setViewName] = useState("");
  const [cursor, setCursor] = useState(0);
  const [openId, setOpenId] = useState("");
  const [pending, setPending] = useState<{ id: string; name: string; amount: number | null | undefined; currency: string; action: "approve" | "reject" } | null>(null);
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
    setViews(readFundViews(readJson(VIEW_KEY, [])));
    setViewer(storedRole() === "viewer");
    const onRole = () => setViewer(storedRole() === "viewer");
    window.addEventListener("crmv4:role", onRole);
    const timer = window.setInterval(() => setNow(Date.now()), 60000);
    return () => {
      window.removeEventListener("crmv4:role", onRole);
      window.clearInterval(timer);
    };
  }, []);
  useEffect(() => {
    let live = true;
    setLoading(true);
    setError("");
    fetch(fundQuery(status, skip), { cache: "no-store" })
      .then(async (res) => {
        if (res.status === 401 || res.status === 403) {
          window.location.href = "/login?desk=crmv4";
          return null;
        }
        if (!res.ok) throw new Error(String(res.status));
        return res.json() as Promise<{ requests?: RawDeposit[]; hasMore?: boolean; nextSkip?: number }>;
      })
      .then((body) => {
        if (!live || !body) return;
        const incoming = asFunds(body.requests);
        setRows((prev) => (skip === 0 ? incoming : appendFunds(prev, incoming)));
        setHasMore(Boolean(body.hasMore));
        setNextSkip(typeof body.nextSkip === "number" ? body.nextSkip : 0);
      })
      .catch(() => { if (live) setError("load"); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [status, skip, tick]);

  const shown = filterFunds(rows, filter);
  const currencies = uniqueText(rows.map(fundCurrency));
  const methods = uniqueText(rows.map((row) => row.method));
  const sums = pendingSums(shown);
  const detail = shown.find((row) => row.id === openId) || null;
  const current = shown[cursor] || null;
  const email = String(detail?.user?.email || "");
  const userId = String(detail?.user?.id || "");
  const withdrawals = useJson<{ requests?: { id: string; amount?: number | null; currency?: string | null; createdAt?: string | null; userId?: string | null; user?: { id?: string | null } | null }[] }>(
    email ? `/api/admin/withdrawals?take=20&q=${encodeURIComponent(email)}` : null,
  );
  const beside = samePerson(
    (withdrawals.data?.requests || []).map((row) => ({ id: row.id, amount: row.amount, currency: row.currency, userId: String(row.user?.id || row.userId || "") })),
    userId,
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (typing(event.target) || pending) return;
      if (event.key === "j") setCursor((index) => listMove(index, shown.length, 1));
      if (event.key === "k") setCursor((index) => listMove(index, shown.length, -1));
      if (event.key === "Enter" && shown[cursor]) setOpenId(shown[cursor].id);
      if (event.key === "Escape") setOpenId("");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shown, cursor, pending]);

  function pickStatus(next: FundStatus) {
    setStatus(next);
    setSkip(0);
    setRows([]);
    setHasMore(false);
    setCursor(0);
    setOpenId("");
  }

  function storeViews(next: FundView[]) {
    setViews(next);
    writeJson(VIEW_KEY, next);
  }

  async function confirmAction() {
    if (!pending || busy || viewer) return;
    setBusy(true);
    try {
      const res = await sendJson(approvalEndpoint("DEPOSIT"), "POST", approvalBody(pending.id, pending.action, reason));
      setMsg(res.ok ? tx("saved") : res.error || tx("failed"));
      if (res.ok) {
        setPending(null);
        setReason("");
        setSkip(0);
        setRows([]);
        setTick((n) => n + 1);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="c4-fund-desk" aria-label={v4("fuTitle")} data-funding="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-pay-kicker">{v4("fuSub")}</p>
          <h2 className="c4-title">{v4("fuTitle")}</h2>
        </div>
        <Link className="c4-btn" href={crmv4Href(base, "deposit")}>{v4("fuChecklist")}</Link>
      </header>
      <p className="c4-meta">{v4("fuHint")}</p>
      <p className="c4-meta">{v4("fuKeys")}</p>
      {viewer && <p className="c4-meta">{v4("fuViewer")}</p>}
      <div className="c4-pay-kpis" aria-label={v4("fuSums")}>
        {sums.map((sum) => (
          <article key={sum.currency} className="c4-pay-kpi" data-status="PENDING">
            <span className="c4-meta">{v4("fuSums")} · {sum.currency}</span>
            <strong>{money(sum.amount, sum.currency, locale)}</strong>
            <span className="c4-meta">{sum.count}</span>
          </article>
        ))}
        {!sums.length && (
          <article className="c4-pay-kpi">
            <span className="c4-meta">{v4("fuSums")}</span>
            <strong>{v4("fuNoSum")}</strong>
          </article>
        )}
      </div>
      <div className="c4-row" role="group" aria-label={v4("fuStatusAll")}>
        {(["PENDING", "APPROVED", "REJECTED", ""] as FundStatus[]).map((item) => (
          <button key={item || "all"} type="button" className="c4-chip" data-on={status === item ? "1" : "0"} onClick={() => pickStatus(item)}>
            {item ? v4(STATUS_LABEL[item]) : v4("fuStatusAll")}
          </button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("fuCurrencyAll")}>
        <button type="button" className="c4-chip" data-on={filter.currency ? "0" : "1"} onClick={() => setFilter({ ...filter, currency: "" })}>{v4("fuCurrencyAll")}</button>
        {currencies.map((code) => (
          <button key={code} type="button" className="c4-chip" data-on={filter.currency === code ? "1" : "0"} onClick={() => setFilter({ ...filter, currency: code })}>{code}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("fuMethodAll")}>
        <button type="button" className="c4-chip" data-on={filter.method ? "0" : "1"} onClick={() => setFilter({ ...filter, method: "" })}>{v4("fuMethodAll")}</button>
        {methods.map((method) => (
          <button key={method} type="button" className="c4-chip" data-on={filter.method === method ? "1" : "0"} onClick={() => setFilter({ ...filter, method })}>{method}</button>
        ))}
      </div>
      <div className="c4-row">
        <label className="c4-lab">
          <span>{v4("fuSearch")}</span>
          <input className="c4-field" aria-label={v4("fuSearch")} value={filter.text} onChange={(event) => setFilter({ ...filter, text: event.target.value })} />
        </label>
        <label className="c4-lab">
          <span>{v4("fuMin")}</span>
          <input className="c4-field" inputMode="decimal" aria-label={v4("fuMin")} value={filter.min == null ? "" : String(filter.min)} onChange={(event) => {
            const raw = event.target.value.trim();
            const min = raw === "" ? null : Number(raw);
            setFilter({ ...filter, min: min != null && Number.isFinite(min) ? min : null });
          }} />
        </label>
        <button type="button" className="c4-btn" aria-pressed={filter.sort === "new"} onClick={() => setFilter({ ...filter, sort: "new" satisfies FundSort })}>{v4("fuSortNew")}</button>
        <button type="button" className="c4-btn" aria-pressed={filter.sort === "old"} onClick={() => setFilter({ ...filter, sort: "old" })}>{v4("fuSortOld")}</button>
      </div>
      {filter.min != null && !minApplies(filter.currency, filter.min) && <p className="c4-meta">{v4("fuMinHint")}</p>}
      <div className="c4-row">
        <span className="c4-meta">{v4("fuViews")}</span>
        {views.map((view) => (
          <span key={view.id} className="c4-pay-view">
            <button type="button" className="c4-chip" onClick={() => { pickStatus(view.status); setFilter({ text: "", currency: view.currency, method: view.method, min: view.min, sort: view.sort }); }}>{view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropFundView(views, view.id))}>{v4("fuRemove")}</button>
          </span>
        ))}
        <input className="c4-field" aria-label={v4("fuViewName")} value={viewName} onChange={(event) => setViewName(event.target.value)} />
        <button type="button" className="c4-btn" onClick={() => {
          const name = viewName.trim();
          if (!name) return;
          storeViews(saveFundView(views, { id: String(Date.now()), name, status, ...filter }));
          setViewName("");
        }}>{v4("fuSave")}</button>
      </div>
      <p className="c4-meta">{v4("fuViewHint")}</p>
      {loading && !rows.length && <p className="c4-meta">{v4("fuLoading")}</p>}
      {error && <p className="c4-meta">{tx("failed")}</p>}
      {!loading && !shown.length && <p className="c4-pay-empty">{v4("fuEmpty")}</p>}
      <ol className="c4-pay-list">
        {shown.map((row, index) => {
          const hours = ageHours(row.createdAt, now);
          const state = String(row.status || "").toUpperCase();
          return (
            <li key={row.id}>
              <button type="button" className="c4-pay-row" data-on={current?.id === row.id ? "1" : "0"} data-status={state} onClick={() => { setCursor(index); setOpenId(row.id); }}>
                <strong>{row.user?.name || "—"}</strong>
                <span>{fundCurrency(row) ? money(row.amount, fundCurrency(row), locale) : "—"}</span>
                <span className="c4-status-pill" data-status={state}>{STATUS_LABEL[state] ? v4(STATUS_LABEL[state]) : state || "—"}</span>
                <span className="c4-meta">{row.method || "—"}</span>
                <span className="c4-meta">{hours == null ? v4("fuNoTime") : `${v4("fuAge")} ${formatAge(hours)}`}</span>
              </button>
            </li>
          );
        })}
      </ol>
      {hasMore && <button type="button" className="c4-btn" onClick={() => setSkip(nextSkip)}>{v4("fuMore")}</button>}
      {detail && (
        <div className="c4-fund-split">
          <article className="c4-pay-detail" aria-label={v4("fuDetail")}>
            <h3 className="c4-title">{detail.user?.name || "—"}</h3>
            <p>{detail.user?.email || "—"} · {detail.method || "—"}</p>
            <p>{fundCurrency(detail) ? money(detail.amount, fundCurrency(detail), locale) : "—"}</p>
            <p className="c4-meta">{detail.createdAt ? when(detail.createdAt, locale) : v4("fuNoTime")}</p>
            <div className="c4-row">
              {userId && <Link className="c4-btn" href={crmv4Href(base, `customers/${userId}`)}>{v4("fuPerson")}</Link>}
              {!viewer && String(detail.status || "").toUpperCase() === "PENDING" && (
                <>
                  <button type="button" className="c4-btn c4-btn-hot" onClick={() => setPending({ id: detail.id, name: detail.user?.name || "—", amount: detail.amount, currency: fundCurrency(detail), action: "approve" })}>{v4("fuApprove")}</button>
                  <button type="button" className="c4-btn" onClick={() => setPending({ id: detail.id, name: detail.user?.name || "—", amount: detail.amount, currency: fundCurrency(detail), action: "reject" })}>{v4("fuReject")}</button>
                </>
              )}
            </div>
          </article>
          <aside className="c4-pay-detail" aria-label={v4("fuWithdrawals")}>
            <h3 className="c4-title">{v4("fuWithdrawals")}</h3>
            <p className="c4-meta">{v4("fuNotAdded")}</p>
            {!beside.length && <p className="c4-meta">{v4("fuNoWithdrawal")}</p>}
            <ul className="c4-risk-sums">
              {beside.map((row) => (
                <li key={row.id}>{fundCurrency(row) ? money(row.amount, fundCurrency(row), locale) : "—"}</li>
              ))}
            </ul>
          </aside>
        </div>
      )}
      {pending && (
        <div className="c4-pay-confirm" role="dialog" aria-modal="true" data-confirm="">
          <p>{v4("fuConfirmLead")}</p>
          <p><strong>{pending.name}</strong> · {pending.currency ? money(pending.amount, pending.currency, locale) : "—"} · {pending.action === "approve" ? v4("fuApprove") : v4("fuReject")}</p>
          <label className="c4-lab">
            <span>{v4("fuReason")}</span>
            <input className="c4-field" aria-label={v4("fuReason")} aria-required={false} value={reason} onChange={(event) => setReason(event.target.value)} />
          </label>
          <p className="c4-meta">{v4("fuReasonOptional")}</p>
          <div className="c4-row">
            <button type="button" className="c4-btn c4-btn-hot" disabled={busy} onClick={() => void confirmAction()}>{v4("fuConfirm")}</button>
            <button type="button" className="c4-btn" onClick={() => setPending(null)}>{v4("fuCancel")}</button>
          </div>
        </div>
      )}
      {msg && <p className="c4-meta">{msg}</p>}
    </section>
  );
}

export function SegmentBoard({ v4 }: { v4: V4 }) {
  const people = useJson<{ users?: SegPerson[] }>("/api/admin/users?take=80&meta=0&role=TRADER");
  const [axis, setAxis] = useState<SegAxis>("country");
  const [pins, setPins] = useState<string[]>([]);
  const [open, setOpen] = useState("");
  useEffect(() => { setPins(readPins(readJson(PIN_KEY, []))); }, []);
  const loaded = people.data?.users || [];
  const cards = orderCards(segmentCards(loaded, axis), pins);
  const names = new Map(loaded.map((row) => [row.id, String(row.name || row.id)]));
  const opened = cards.find((card) => card.id === open) || null;
  function pin(id: string) {
    const next = togglePin(pins, id);
    setPins(next);
    writeJson(PIN_KEY, next);
  }
  return (
    <section className="c4-seg-board" aria-label={v4("sgTitle")} data-segments="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-pay-kicker">{v4("sgPeople")}</p>
          <h2 className="c4-title">{v4("sgTitle")}</h2>
        </div>
        <strong className="c4-seg-count">{loaded.length}</strong>
      </header>
      <p className="c4-meta">{v4("sgHint")}</p>
      <div className="c4-row" role="group" aria-label={v4("sgTitle")}>
        {(Object.keys(AXIS_LABEL) as SegAxis[]).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={axis === item ? "1" : "0"} onClick={() => { setAxis(item); setOpen(""); }}>{v4(AXIS_LABEL[item])}</button>
        ))}
      </div>
      {!people.loading && !cards.length && <p className="c4-pay-empty">{v4("sgEmpty")}</p>}
      <ul className="c4-seg-grid">
        {cards.map((card) => (
          <li key={card.id} className="c4-seg-card" data-pin={pins.includes(card.id) ? "1" : "0"}>
            <p className="c4-meta">{card.label || v4("sgNone")}</p>
            <strong>{card.count}</strong>
            <div className="c4-row">
              <button type="button" className="c4-btn" aria-pressed={pins.includes(card.id)} onClick={() => pin(card.id)}>{pins.includes(card.id) ? v4("sgUnpin") : v4("sgPin")}</button>
              <button type="button" className="c4-btn" onClick={() => setOpen(open === card.id ? "" : card.id)}>{open === card.id ? v4("sgClose") : v4("sgOpen")}</button>
            </div>
          </li>
        ))}
      </ul>
      {opened && (
        <ul className="c4-seg-names" aria-label={opened.label || v4("sgNone")}>
          {opened.ids.map((id) => <li key={id}>{names.get(id) || id}</li>)}
        </ul>
      )}
    </section>
  );
}
