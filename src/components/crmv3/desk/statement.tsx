"use client";

import { useEffect, useState } from "react";
import {
  approvalShare,
  byCurrency,
  inDates,
  methodStats,
  noteSummary,
  statusCounts,
  type MoneyLite,
} from "@/lib/crmv3/statement";
import { convert, currencyMix, largestCurrency, withMids, type FxPair } from "@/lib/crmv3/fx";
import { methodName } from "@/lib/crmv3/bridge";
import { readJson, writeJson } from "@/lib/crmv3/bridge";
import { money, sendJson, useJson, when, type Tx } from "../kit";
import { useV3 } from "./store";

type Cash = { id: string; amount?: number | null; currency?: string | null; status?: string | null; createdAt?: string | null; userId?: string | null; user?: { id?: string | null } | null };
type Note = { body?: string | null; createdAt?: string | null };

function mine(rows: Cash[], id: string) {
  return rows.filter((row) => String(row.user?.id || row.userId || "") === id);
}

export function StatementSheet({ id, name, email, country, desk, balance, equity, sale, notes, locale }: {
  id: string;
  name: string;
  email: string;
  country: string;
  desk: string;
  balance: string;
  equity: string;
  sale: string;
  notes: Note[];
  locale: string;
}) {
  const v3 = useV3();
  const deposits = useJson<{ requests?: Cash[] }>(email ? `/api/admin/deposits?take=80&q=${encodeURIComponent(email)}` : null);
  const withdrawals = useJson<{ requests?: Cash[] }>(email ? `/api/admin/withdrawals?take=80&q=${encodeURIComponent(email)}` : null);
  const book = useJson<{ positions?: { id: string; symbol?: string | null; side?: string | null; volume?: number | null; status?: string | null }[] }>(`/api/admin/users/${encodeURIComponent(id)}?view=positions&take=20`);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [hideEmpty, setHideEmpty] = useState(false);
  const [msg, setMsg] = useState("");
  const deps = mine(deposits.data?.requests || [], id).filter((row) => inDates(row.createdAt, from, to));
  const wds = mine(withdrawals.data?.requests || [], id).filter((row) => inDates(row.createdAt, from, to));
  const positions = book.data?.positions || [];
  const note = noteSummary(notes);
  const depCounts = statusCounts(deps);
  const wdCounts = statusCounts(wds);
  const printed = new Date().toLocaleString(locale);

  function show(count: number) {
    return !hideEmpty || count > 0;
  }

  function printSheet() {
    const root = document.querySelector("[data-crmv3-root]");
    root?.setAttribute("data-print", "statement");
    const clear = () => root?.removeAttribute("data-print");
    window.addEventListener("afterprint", clear, { once: true });
    window.print();
  }

  const summary = [name, email, balance, equity, `${v3("statementDeposits")} ${deps.length}`, `${v3("statementWithdrawals")} ${wds.length}`, `${v3("statementPositions")} ${positions.length}`, `${v3("statementNotes")} ${note.count}`].join("\n");

  return (
    <section className="c3-card" aria-label={v3("statementSheet")}>
      <div className="c3-kpis">
        <div className="c3-kpi"><p className="c3-kpi-label">{v3("statementSheet")}</p><p className="c3-kpi-value">{name || "—"}</p></div>
        <div className="c3-kpi"><p className="c3-kpi-label">{v3("statementDeposits")}</p><p className="c3-kpi-value">{deps.length}</p></div>
        <div className="c3-kpi"><p className="c3-kpi-label">{v3("statementWithdrawals")}</p><p className="c3-kpi-value">{wds.length}</p></div>
        <div className="c3-kpi"><p className="c3-kpi-label">{v3("statementPositions")}</p><p className="c3-kpi-value">{positions.length}</p></div>
      </div>
      <p className="c3-muted c3-pad">{v3("statementHint")}</p>
      <div className="c3-tools c3-statement-tools">
        <label className="c3-lab"><span>{v3("statementFrom")}</span><input className="c3-field" type="date" aria-label={v3("statementFrom")} value={from} onChange={(event) => setFrom(event.target.value)} /></label>
        <label className="c3-lab"><span>{v3("statementTo")}</span><input className="c3-field" type="date" aria-label={v3("statementTo")} value={to} onChange={(event) => setTo(event.target.value)} /></label>
        <button type="button" className="c3-chip" data-on={hideEmpty ? "1" : "0"} onClick={() => setHideEmpty((on) => !on)}>{v3("statementHideEmpty")}</button>
        <button type="button" className="c3-btn" onClick={() => { void navigator.clipboard.writeText(summary); setMsg(v3("statementCopied")); }}>{v3("statementCopy")}</button>
        <button type="button" className="c3-btn c3-btn-hot" onClick={printSheet}>{v3("statementPrint")}</button>
      </div>
      <div className="c3-pad c3-stack">
        <p>{email} · {country} · {desk} · {sale}</p>
        <p>{balance} · {equity}</p>
        <p className="c3-muted">{v3("statementPrinted")} {printed}</p>
        <p>{v3("statementPending")} {depCounts.pending + wdCounts.pending} · {v3("statementApproved")} {depCounts.approved + wdCounts.approved}</p>
        <p>{byCurrency([...deps, ...wds]).map((row) => `${row.currency} ${row.total}`).join(" · ") || "—"}</p>
        {show(deps.length) && <CashList title={v3("statementDeposits")} rows={deps} locale={locale} />}
        {show(wds.length) && <CashList title={v3("statementWithdrawals")} rows={wds} locale={locale} />}
        {show(positions.length) && (
          <div>
            <h3 className="c3-title">{v3("statementPositions")}</h3>
            <ul>{positions.map((row) => <li key={row.id}>{row.symbol || "—"} · {row.side || "—"} · {row.volume ?? "—"} · {row.status || "—"}</li>)}</ul>
          </div>
        )}
        <p>{v3("statementNotes")} {note.count}</p>
        {note.latest && <p>{v3("statementLatest")} {note.latest}</p>}
      </div>
      {msg && <p className="c3-muted c3-pad" role="status">{msg}</p>}
    </section>
  );
}

function CashList({ title, rows, locale }: { title: string; rows: Cash[]; locale: string }) {
  return (
    <div>
      <h3 className="c3-title">{title}</h3>
      <ul>
        {rows.map((row) => (
          <li key={row.id}>{when(row.createdAt, locale)} · {money(row.amount, row.currency, locale)} · {row.status || "—"}</li>
        ))}
      </ul>
    </div>
  );
}

export function PayMethods({ rows }: { rows: { amount?: number | null; currency?: string | null; status?: string | null; createdAt?: string | null; method?: unknown }[] }) {
  const v3 = useV3();
  const [highFirst, setHighFirst] = useState(true);
  const prepared: MoneyLite[] = rows.map((row) => ({ ...row, method: methodName(row.method) }));
  const stats = methodStats(prepared);
  const shown = highFirst ? stats : [...stats].reverse();
  const top = stats[0]?.method || "";
  return (
    <section className="c3-card" aria-label={v3("payMethods")}>
      <div className="c3-kpis">
        <div className="c3-kpi"><p className="c3-kpi-label">{v3("payMethods")}</p><p className="c3-kpi-value">{stats.length}</p></div>
        <div className="c3-kpi"><p className="c3-kpi-label">{v3("payCount")}</p><p className="c3-kpi-value">{stats.reduce((sum, row) => sum + row.count, 0)}</p></div>
      </div>
      <p className="c3-muted c3-pad">{v3("payHint")}</p>
      <div className="c3-tools">
        <button type="button" className="c3-chip" data-on={highFirst ? "1" : "0"} onClick={() => setHighFirst((on) => !on)}>{v3("paySort")}</button>
      </div>
      {!shown.length && <p className="c3-empty" role="status">{v3("payEmpty")}</p>}
      <ul>
        {shown.map((row) => {
          const share = approvalShare(row.approved, row.count);
          return (
            <li key={row.method} className="c3-feed" data-kind={row.method === top ? "call" : "note"}>
              <strong>{row.method}</strong>
              {row.method === top && <span className="c3-status" data-tone="ok">{v3("payLargest")}</span>}
              <p className="c3-muted">{v3("payCount")} {row.count} · {row.byCurrency.map((item) => `${item.currency} ${item.total}`).join(" · ") || "—"}</p>
              <p className="c3-muted">{v3("payApproval")} {share == null ? "—" : `${share}%`} · {v3("payPending")} {row.pending} · {v3("payAge")} {row.avgAgeHours == null ? "—" : `${row.avgAgeHours}h`}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

const CODES = ["USD", "TRY", "EUR", "GBP", "JPY"];

export function FxDesk({ locale }: { locale: string }) {
  const v3 = useV3();
  const people = useJson<{ users?: { currency?: string | null; balance?: number | null }[] }>("/api/admin/users?view=table&take=80&meta=0&role=TRADER");
  const cash = useJson<{ requests?: { currency?: string | null; amount?: number | null }[] }>("/api/admin/deposits?take=80");
  const [pairs, setPairs] = useState<FxPair[]>(withMids([]));
  const [at, setAt] = useState("");
  const [amount, setAmount] = useState("100");
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("TRY");
  useEffect(() => {
    let live = true;
    void fetch("/api/market/quote?symbols=USDTRY,EURUSD,GBPUSD,USDJPY", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((body: { prices?: { symbol?: string; mid?: number; bid?: number }[]; ts?: number } | null) => {
        if (!live || !body) return;
        setPairs(withMids(body.prices || []));
        if (body.ts) setAt(new Date(body.ts).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" }));
      })
      .catch(() => { if (live) setPairs(withMids([])); });
    return () => { live = false; };
  }, [locale]);
  const value = Number(amount);
  const shown = Number.isFinite(value) ? convert(value, from, to, pairs) : null;
  const balances = currencyMix((people.data?.users || []).map((row) => ({ currency: row.currency, amount: row.balance })));
  const deposits = currencyMix(cash.data?.requests || []);
  return (
    <section className="c3-card" aria-label={v3("fxDesk")}>
      <div className="c3-kpis">
        <div className="c3-kpi"><p className="c3-kpi-label">{v3("fxDesk")}</p><p className="c3-kpi-value">{pairs.filter((row) => row.mid != null).length}</p></div>
        <div className="c3-kpi"><p className="c3-kpi-label">{v3("fxAge")}</p><p className="c3-kpi-value">{at || "—"}</p></div>
      </div>
      <p className="c3-muted c3-pad">{v3("fxHint")}</p>
      <ul className="c3-fx-quotes">
        {pairs.map((row) => (
          <li key={row.symbol}><span>{row.symbol}</span><strong>{row.mid == null ? v3("fxMissing") : row.mid}</strong></li>
        ))}
      </ul>
      <div className="c3-tools">
        <label className="c3-lab"><span>{v3("fxAmount")}</span><input className="c3-field" inputMode="decimal" aria-label={v3("fxAmount")} value={amount} onChange={(event) => setAmount(event.target.value)} /></label>
        <label className="c3-lab"><span>{v3("fxFrom")}</span>
          <select className="c3-select" aria-label={v3("fxFrom")} value={from} onChange={(event) => setFrom(event.target.value)}>{CODES.map((code) => <option key={code}>{code}</option>)}</select>
        </label>
        <label className="c3-lab"><span>{v3("fxTo")}</span>
          <select className="c3-select" aria-label={v3("fxTo")} value={to} onChange={(event) => setTo(event.target.value)}>{CODES.map((code) => <option key={code}>{code}</option>)}</select>
        </label>
        <p>{v3("fxResult")} {shown == null ? v3("fxMissing") : shown}</p>
      </div>
      <Mix title={v3("fxMixBal")} rows={balances} mark={v3("fxLargest")} />
      <Mix title={v3("fxMixCash")} rows={deposits} mark={v3("fxLargest")} />
    </section>
  );
}

function Mix({ title, rows, mark }: { title: string; rows: { currency: string; count: number; total: number }[]; mark: string }) {
  const top = largestCurrency(rows);
  return (
    <div className="c3-pad">
      <h3 className="c3-title">{title}</h3>
      {!rows.length && <p className="c3-muted">—</p>}
      <ul>
        {rows.map((row) => (
          <li key={row.currency} className="c3-row">
            <strong>{row.currency}</strong>
            <span>{row.count}</span>
            <span>{Math.round(row.total)}</span>
            {row.currency === top && <span className="c3-status" data-tone="ok">{mark}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function QuickSheet({ open, onClose, onSearch, tx }: {
  open: boolean;
  onClose: () => void;
  onSearch: () => void;
  tx: Tx;
}) {
  const v3 = useV3();
  const [kind, setKind] = useState<"customer" | "note" | "reminder" | "call">("customer");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userId, setUserId] = useState("");
  const [body, setBody] = useState("");
  const [msg, setMsg] = useState("");
  if (!open) return null;
  const local = kind === "call";
  return (
    <div className="c3-sheet-back" role="presentation" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={v3("quickPlus")} className="c3-sheet" onClick={(event) => event.stopPropagation()}>
        <h2 className="c3-title">{v3("quickPlus")}</h2>
        <p className="c3-muted">{v3("quickHint")}</p>
        <div className="c3-tools">
          {(["customer", "note", "reminder", "call"] as const).map((item) => (
            <button key={item} type="button" className="c3-chip" data-on={kind === item ? "1" : "0"} onClick={() => { setKind(item); setMsg(""); }}>
              {v3(item === "customer" ? "quickCustomer" : item === "note" ? "quickNote" : item === "reminder" ? "quickReminder" : "quickCall")}
            </button>
          ))}
          <button type="button" className="c3-btn" onClick={() => { onClose(); onSearch(); }}>{v3("quickSearch")}</button>
        </div>
        <p className="c3-muted">{local ? v3("quickLocal") : v3("quickSends")}</p>
        <form className="c3-form" onSubmit={async (event) => {
          event.preventDefault();
          if (kind === "customer") {
            const res = await sendJson("/api/admin/users", "POST", { name, email, password, role: "TRADER" });
            setMsg(res.ok ? v3("quickSaved") : res.error || tx("failed"));
            if (res.ok) { setName(""); setEmail(""); setPassword(""); }
            return;
          }
          if (kind === "call") {
            if (!userId.trim()) { setMsg(v3("quickNeedId")); return; }
            const all = readJson<Record<string, { id: string; at: string; outcome: string; minutes: number; next: string; note: string }[]>>("crmv3-call-log", {});
            const row = { id: String(Date.now()), at: new Date().toISOString(), outcome: "reached", minutes: 0, next: "", note: body.trim() };
            all[userId.trim()] = [row, ...(all[userId.trim()] || [])].slice(0, 40);
            writeJson("crmv3-call-log", all);
            setMsg(v3("quickSaved"));
            setBody("");
            return;
          }
          if (kind === "note") {
            if (!userId.trim() || !body.trim()) { setMsg(v3("quickNeedId")); return; }
            const res = await sendJson(`/api/admin/users/${encodeURIComponent(userId.trim())}`, "PATCH", { addNote: body.trim() });
            setMsg(res.ok ? v3("quickSaved") : res.error || tx("failed"));
            if (res.ok) setBody("");
            return;
          }
          if (!body.trim()) return;
          const res = await sendJson("/api/admin/calendar", "POST", { body: body.trim(), remindAt: new Date(Date.now() + 3600000).toISOString(), userId: userId.trim() || undefined });
          setMsg(res.ok ? v3("quickSaved") : res.error || tx("failed"));
          if (res.ok) setBody("");
        }}>
          {kind === "customer" && (
            <>
              <label className="c3-lab"><span>{tx("name")}</span><input className="c3-field" required aria-label={tx("name")} value={name} onChange={(event) => setName(event.target.value)} /></label>
              <label className="c3-lab"><span>{tx("email")}</span><input className="c3-field" type="email" required aria-label={tx("email")} value={email} onChange={(event) => setEmail(event.target.value)} /></label>
              <label className="c3-lab"><span>{tx("password")}</span><input className="c3-field" type="password" required minLength={6} aria-label={tx("password")} value={password} onChange={(event) => setPassword(event.target.value)} /></label>
            </>
          )}
          {kind !== "customer" && (
            <label className="c3-lab"><span>{v3("quickNeedId")}</span><input className="c3-field" aria-label={v3("quickNeedId")} value={userId} onChange={(event) => setUserId(event.target.value)} /></label>
          )}
          {kind !== "customer" && (
            <label className="c3-lab"><span>{kind === "call" ? v3("quickCall") : tx("save")}</span><textarea className="c3-field" rows={3} value={body} onChange={(event) => setBody(event.target.value)} /></label>
          )}
          <button type="submit" className="c3-btn c3-btn-hot">{tx("save")}</button>
        </form>
        {msg && <p className="c3-muted" role="status">{msg}</p>}
        <button type="button" className="c3-btn" onClick={onClose}>{tx("close")}</button>
      </div>
    </div>
  );
}
