"use client";

import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { convert, currencyMix, largestCurrency, withMids, type FxPair } from "@/lib/crmv4/round22";
import { sendJson, useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;
type Tx = (key: "name" | "email" | "password" | "save" | "saved" | "failed" | "loading") => string;
const CALL_KEY = "crmv4-call-log";
const CODES = ["USD", "TRY", "EUR", "GBP", "JPY"];

export function FxDesk({ v4, locale }: { v4: V4; locale: string }) {
  const people = useJson<{ users?: { currency?: string | null; balance?: number | null }[] }>("/api/admin/users?take=80&meta=0&role=TRADER");
  const cash = useJson<{ requests?: { currency?: string | null; amount?: number | null }[] }>("/api/admin/deposits?take=80");
  const [pairs, setPairs] = useState<FxPair[]>(withMids([]));
  const [at, setAt] = useState("");
  const [amount, setAmount] = useState("100");
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("TRY");
  useEffect(() => {
    let live = true;
    void fetch("/api/market/quote?symbols=USDTRY,EURUSD,GBPUSD,USDJPY", { cache: "no-store" })
      .then((res) => res.ok ? res.json() : null)
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
    <section className="c4-fx-desk" aria-label={v4("fxDesk")}>
      <div className="c4-fin-hero">
        <div className="c4-fin-metric"><span>{v4("fxDesk")}</span><strong>{pairs.filter((row) => row.mid != null).length}</strong></div>
        <div className="c4-fin-metric"><span>{v4("fxAge")}</span><strong>{at || "—"}</strong></div>
      </div>
      <p className="c4-muted c4-pad">{v4("fxHint")}</p>
      <ul className="c4-fx-quotes">
        {pairs.map((row) => (
          <li key={row.symbol}><span>{row.symbol}</span><strong>{row.mid == null ? v4("fxMissing") : row.mid}</strong></li>
        ))}
      </ul>
      <div className="c4-row c4-pad">
        <label className="c4-lab"><span>{v4("fxAmount")}</span><input className="c4-field" inputMode="decimal" aria-label={v4("fxAmount")} value={amount} onChange={(event) => setAmount(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("fxFrom")}</span>
          <select className="c4-select" aria-label={v4("fxFrom")} value={from} onChange={(event) => setFrom(event.target.value)}>
            {CODES.map((code) => <option key={code}>{code}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("fxTo")}</span>
          <select className="c4-select" aria-label={v4("fxTo")} value={to} onChange={(event) => setTo(event.target.value)}>
            {CODES.map((code) => <option key={code}>{code}</option>)}
          </select>
        </label>
        <p>{v4("fxResult")} {shown == null ? v4("fxMissing") : shown}</p>
      </div>
      <Mix title={v4("fxMixBal")} rows={balances} v4={v4} />
      <Mix title={v4("fxMixCash")} rows={deposits} v4={v4} />
    </section>
  );
}

function Mix({ title, rows, v4 }: { title: string; rows: { currency: string; count: number; total: number }[]; v4: V4 }) {
  const top = largestCurrency(rows);
  return (
    <div className="c4-pad">
      <h3 className="c4-title">{title}</h3>
      {!rows.length && <p className="c4-muted">—</p>}
      <ul className="c4-fx-mix">
        {rows.map((row) => (
          <li key={row.currency} data-top={row.currency === top ? "1" : "0"}>
            <strong>{row.currency}</strong>
            <span>{row.count}</span>
            <span>{Math.round(row.total)}</span>
            {row.currency === top && <span className="c4-status" data-tone="ok">{v4("fxLargest")}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function QuickSheet({ open, onClose, onSearch, v4, tx, closeLabel }: {
  open: boolean;
  onClose: () => void;
  onSearch: () => void;
  v4: V4;
  tx: Tx;
  closeLabel: string;
}) {
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
    <div className="c4-palette-back" role="presentation" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={v4("quickPlus")} className="c4-palette c4-quick-luxe" onClick={(event) => event.stopPropagation()}>
        <h2 className="c4-title">{v4("quickPlus")}</h2>
        <p className="c4-muted">{v4("quickHint")}</p>
        <div className="c4-row">
          {(["customer", "note", "reminder", "call"] as const).map((item) => (
            <button key={item} type="button" className="c4-chip" data-on={kind === item ? "1" : "0"} onClick={() => { setKind(item); setMsg(""); }}>
              {v4(item === "customer" ? "quickCustomer" : item === "note" ? "quickNote" : item === "reminder" ? "quickReminder" : "quickCall")}
            </button>
          ))}
          <button type="button" className="c4-btn" onClick={() => { onClose(); onSearch(); }}>{v4("quickSearch")}</button>
        </div>
        <p className="c4-muted">{local ? v4("quickLocal") : v4("quickSends")}</p>
        <form className="c4-form" onSubmit={async (event) => {
          event.preventDefault();
          if (kind === "customer") {
            const res = await sendJson("/api/admin/users", "POST", { name, email, password, role: "TRADER" });
            setMsg(res.ok ? v4("quickSaved") : res.error || tx("failed"));
            if (res.ok) { setName(""); setEmail(""); setPassword(""); }
            return;
          }
          if (kind === "call") {
            if (!userId.trim()) { setMsg(v4("quickNeedId")); return; }
            const all = readJson<Record<string, { id: string; at: string; outcome: string; minutes: number; next: string; note: string }[]>>(CALL_KEY, {});
            const row = { id: String(Date.now()), at: new Date().toISOString(), outcome: "reached", minutes: 0, next: "", note: body.trim() };
            all[userId.trim()] = [row, ...(all[userId.trim()] || [])].slice(0, 40);
            writeJson(CALL_KEY, all);
            window.dispatchEvent(new Event("crmv4:call-log"));
            setMsg(v4("quickSaved"));
            setBody("");
            return;
          }
          if (kind === "note") {
            if (!userId.trim() || !body.trim()) { setMsg(v4("quickNeedId")); return; }
            const res = await sendJson(`/api/admin/users/${encodeURIComponent(userId.trim())}`, "PATCH", { addNote: body.trim() });
            setMsg(res.ok ? v4("quickSaved") : res.error || tx("failed"));
            if (res.ok) setBody("");
            return;
          }
          if (!body.trim()) return;
          const res = await sendJson("/api/admin/calendar", "POST", { body: body.trim(), remindAt: new Date(Date.now() + 3600000).toISOString(), userId: userId.trim() || undefined });
          setMsg(res.ok ? v4("quickSaved") : res.error || tx("failed"));
          if (res.ok) setBody("");
        }}>
          {kind === "customer" && (
            <>
              <label className="c4-lab"><span>{tx("name")}</span><input className="c4-field" required value={name} onChange={(event) => setName(event.target.value)} /></label>
              <label className="c4-lab"><span>{tx("email")}</span><input className="c4-field" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
              <label className="c4-lab"><span>{tx("password")}</span><input className="c4-field" type="password" required minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} /></label>
            </>
          )}
          {kind !== "customer" && (
            <label className="c4-lab"><span>{v4("quickNeedId")}</span><input className="c4-field" aria-label={v4("quickNeedId")} value={userId} onChange={(event) => setUserId(event.target.value)} /></label>
          )}
          {kind !== "customer" && (
            <label className="c4-lab"><span>{kind === "call" ? v4("quickCall") : tx("save")}</span><textarea className="c4-field" rows={3} value={body} onChange={(event) => setBody(event.target.value)} /></label>
          )}
          <button type="submit" className="c4-btn c4-btn-hot">{tx("save")}</button>
        </form>
        {msg && <p className="c4-muted" role="status">{msg}</p>}
        <button type="button" className="c4-btn" onClick={onClose}>{closeLabel}</button>
      </div>
    </div>
  );
}
