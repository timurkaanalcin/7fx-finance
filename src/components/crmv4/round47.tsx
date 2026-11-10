"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import type { FeedItem } from "@/lib/crmv4/round17";
import {
  filterFlags,
  filterKind,
  findDay,
  frequentFlags,
  groupDays,
  kycFlags,
  largeFlags,
  pendingDoc,
  readCount,
  readNotes,
  readThresholds,
  setThreshold,
  writeNote,
  type CashRow,
  type RiskFlag,
  type RiskKind,
} from "@/lib/crmv4/round47";
import { crmv4Href } from "@/lib/crmv4/sections";
import { storedRole } from "./round5";
import { useEscape } from "./round40";
import { money, sendJson, useJson, when, type Tx } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const THRESHOLD_KEY = "crmv4-risk-thresholds";
const COUNT_KEY = "crmv4-risk-count";
const NOTE_KEY = "crmv4-risk-notes";

const KIND_LABEL: Record<RiskKind, CrmV4CopyKey> = {
  large: "rkLarge",
  frequent: "rkFrequent",
  kyc: "rkKyc",
};

const TYPE_LABEL: Record<string, CrmV4CopyKey> = {
  note: "tlNote",
  call: "tlCall",
  status: "tlStatus",
  money: "tlMoney",
};

type CashPayload = {
  id: string;
  amount?: number | null;
  currency?: string | null;
  userId?: string | null;
  user?: { id?: string | null; name?: string | null } | null;
};

type Person = { id: string; name?: string | null; documentsStatus?: string | null };
type Doc = { id: string; traderId?: string | null; status?: string | null; name?: string | null };

function asCash(rows: CashPayload[] | undefined): CashRow[] {
  return (rows || []).map((row) => ({
    id: row.id,
    amount: row.amount,
    currency: row.currency,
    userId: String(row.user?.id || row.userId || ""),
    name: String(row.user?.name || ""),
  }));
}

export function RiskDesk({ base, v4, tx, locale }: { base: string; v4: V4; tx: Tx; locale: string }) {
  const deposits = useJson<{ requests?: CashPayload[] }>("/api/admin/deposits?status=ALL&take=40");
  const withdrawals = useJson<{ requests?: CashPayload[] }>("/api/admin/withdrawals?status=ALL&take=40");
  const people = useJson<{ users?: Person[] }>("/api/admin/users?take=80&meta=0&role=TRADER");
  const docs = useJson<{ documents?: Doc[] }>("/api/admin/documents?status=PENDING&take=40");
  const [thresholds, setThresholds] = useState<Record<string, number>>({});
  const [currency, setCurrency] = useState("");
  const [amount, setAmount] = useState("");
  const [count, setCount] = useState(3);
  const [countDraft, setCountDraft] = useState("3");
  const [notes, setNotes] = useState<Record<string, { body: string; at: string }>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [noteMsg, setNoteMsg] = useState("");
  const [kind, setKind] = useState<"" | RiskKind>("");
  const [query, setQuery] = useState("");
  const [viewer, setViewer] = useState(false);
  const [pending, setPending] = useState<{ name: string; docId: string } | null>(null);
  const [status, setStatus] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  useEscape(Boolean(pending), () => setPending(null));
  useEffect(() => {
    const stored = readThresholds(readJson(THRESHOLD_KEY, {}));
    setThresholds(stored);
    setCount(readCount(readJson(COUNT_KEY, 3)));
    setCountDraft(String(readCount(readJson(COUNT_KEY, 3))));
    setNotes(readNotes(readJson(NOTE_KEY, {})));
    setViewer(storedRole() === "viewer");
    const onRole = () => setViewer(storedRole() === "viewer");
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);
  const depositRows = asCash(deposits.data?.requests);
  const withdrawalRows = asCash(withdrawals.data?.requests);
  const currencies: string[] = [];
  for (const row of depositRows) {
    const code = String(row.currency || "").trim().toUpperCase();
    if (code && !currencies.includes(code)) currencies.push(code);
  }
  currencies.sort();
  const flags: RiskFlag[] = [
    ...largeFlags(depositRows, thresholds),
    ...frequentFlags(withdrawalRows, count),
    ...kycFlags(people.data?.users || [], depositRows),
  ];
  const shown = filterFlags(flags, kind, query);
  const loadedDocs = docs.data?.documents || [];

  function saveThreshold() {
    const next = setThreshold(thresholds, currency, Number(amount));
    setThresholds(next);
    writeJson(THRESHOLD_KEY, next);
  }

  function clearThreshold() {
    const next = setThreshold(thresholds, currency, 0);
    setThresholds(next);
    writeJson(THRESHOLD_KEY, next);
    setAmount("");
  }

  function saveCount() {
    const next = readCount(countDraft);
    setCount(next);
    setCountDraft(String(next));
    writeJson(COUNT_KEY, next);
  }

  function saveNote(id: string) {
    const next = writeNote(notes, id, drafts[id] ?? notes[id]?.body ?? "", new Date().toISOString());
    setNotes(next);
    writeJson(NOTE_KEY, next);
    setNoteMsg(v4("rkNoteSaved"));
  }

  async function confirmReview() {
    if (!pending || busy || viewer) return;
    setBusy(true);
    try {
      const note = reason.trim();
      const res = await sendJson("/api/admin/documents", "POST", {
        action: "review",
        id: pending.docId,
        status,
        ...(note ? { note } : {}),
      });
      setMsg(res.ok ? tx("saved") : res.error || tx("failed"));
      if (res.ok) {
        setPending(null);
        setReason("");
        docs.reload();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="c4-risk-desk c4-risk-salon" aria-label={v4("rkTitle")} data-risk="1">
      <header className="c4-pay-head c4-risk-salon-mast">
        <div>
          <p className="c4-pay-kicker c4-risk-salon-kicker">{v4("rkSub")}</p>
          <h2 className="c4-title c4-risk-salon-title">{v4("rkTitle")}</h2>
        </div>
        <p className="c4-risk-salon-plate" data-logo="mono">7FX</p>
      </header>
      <p className="c4-meta">{v4("rkHint")}</p>
      {viewer && <p className="c4-meta">{v4("rkViewer")}</p>}
      <div className="c4-pay-kpis c4-risk-salon-kpis" aria-label={v4("rkLoaded")}>
        {(["large", "frequent", "kyc"] as const).map((item) => (
          <article key={item} className="c4-pay-kpi c4-risk-salon-kpi" data-kind={item}>
            <span className="c4-meta">{v4(KIND_LABEL[item])}</span>
            <strong>{flags.filter((flag) => flag.kind === item).length}</strong>
          </article>
        ))}
      </div>
      <div className="c4-risk-tools c4-risk-salon-tools">
        <label className="c4-lab">
          <span>{v4("rkCurrency")}</span>
          <select className="c4-select" aria-label={v4("rkCurrency")} value={currency} onChange={(event) => setCurrency(event.target.value)}>
            <option value="">{v4("rkCurrency")}</option>
            {currencies.map((code) => <option key={code} value={code}>{code}{thresholds[code] != null ? ` · ${thresholds[code]}` : ""}</option>)}
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("rkThreshold")}</span>
          <input className="c4-field" inputMode="decimal" aria-label={v4("rkThreshold")} value={amount} onChange={(event) => setAmount(event.target.value)} />
        </label>
        <button type="button" className="c4-btn" onClick={saveThreshold}>{v4("rkSaveThreshold")}</button>
        <button type="button" className="c4-btn" onClick={clearThreshold}>{v4("rkClearThreshold")}</button>
      </div>
      <p className="c4-meta">{v4("rkThresholdHint")}</p>
      <div className="c4-risk-tools c4-risk-salon-tools">
        <label className="c4-lab">
          <span>{v4("rkCount")}</span>
          <input className="c4-field" inputMode="numeric" aria-label={v4("rkCount")} value={countDraft} onChange={(event) => setCountDraft(event.target.value)} />
        </label>
        <button type="button" className="c4-btn" onClick={saveCount}>{v4("rkSaveCount")}</button>
      </div>
      <p className="c4-meta">{v4("rkCountHint")}</p>
      <div className="c4-row" role="group" aria-label={v4("rkAll")}>
        <button type="button" className="c4-chip" data-on={kind ? "0" : "1"} onClick={() => setKind("")}>{v4("rkAll")}</button>
        {(["large", "frequent", "kyc"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={kind === item ? "1" : "0"} onClick={() => setKind(item)}>{v4(KIND_LABEL[item])}</button>
        ))}
      </div>
      <label className="c4-lab">
        <span>{v4("rkSearch")}</span>
        <input className="c4-field" aria-label={v4("rkSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!shown.length && <p className="c4-pay-empty">{kind === "large" ? v4("rkLargeEmpty") : kind === "frequent" ? v4("rkFrequentEmpty") : kind === "kyc" ? v4("rkKycEmpty") : v4("rkEmpty")}</p>}
      <ol className="c4-risk-list c4-risk-salon-list">
        {shown.map((flag) => {
          const noteKey = `${flag.kind}:${flag.id}`;
          const doc = flag.kind === "kyc" ? pendingDoc(loadedDocs, flag.id) : null;
          const userId = flag.kind === "large" ? depositRows.find((row) => row.id === flag.id)?.userId || "" : flag.id;
          return (
            <li key={noteKey} className="c4-risk-card c4-risk-salon-card" data-kind={flag.kind}>
              <div className="c4-risk-card-top">
                <strong>{flag.name}</strong>
                <span className="c4-status-pill" data-status={flag.kind === "kyc" ? "PENDING" : "APPROVED"}>{v4(KIND_LABEL[flag.kind])}</span>
              </div>
              <ul className="c4-risk-sums">
                {flag.sums.map((sum) => (
                  <li key={sum.currency}>{money(sum.amount, sum.currency, locale)} · {sum.count}</li>
                ))}
              </ul>
              {flag.kind !== "kyc" && <p className="c4-meta">{v4("rkNoStatus")}</p>}
              {flag.kind === "kyc" && !doc && <p className="c4-meta">{v4("rkNoDoc")}</p>}
              {flag.kind === "kyc" && doc && !viewer && (
                <button type="button" className="c4-btn" onClick={() => { setStatus("APPROVED"); setPending({ name: flag.name, docId: doc.id }); }}>{v4("rkReview")}</button>
              )}
              {userId && <Link className="c4-btn" href={crmv4Href(base, `customers/${userId}`)}>{v4("rkPerson")}</Link>}
              <label className="c4-lab">
                <span>{v4("rkNote")}</span>
                <input className="c4-field" aria-label={v4("rkNote")} value={drafts[noteKey] ?? notes[noteKey]?.body ?? ""} onChange={(event) => setDrafts({ ...drafts, [noteKey]: event.target.value })} />
              </label>
              <button type="button" className="c4-btn" onClick={() => saveNote(noteKey)}>{v4("rkSaveNote")}</button>
            </li>
          );
        })}
      </ol>
      {noteMsg && <p className="c4-meta">{noteMsg}</p>}
      {pending && (
        <div className="c4-pay-confirm" role="dialog" aria-modal="true" data-confirm="">
          <p>{v4("rkConfirmLead")}</p>
          <p><strong>{pending.name}</strong></p>
          <label className="c4-lab">
            <span>{v4("rkReview")}</span>
            <select className="c4-select" aria-label={v4("rkReview")} value={status} onChange={(event) => setStatus(event.target.value === "REJECTED" ? "REJECTED" : "APPROVED")}>
              <option value="APPROVED">APPROVED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </label>
          <label className="c4-lab">
            <span>{v4("rkReason")}</span>
            <input className="c4-field" aria-label={v4("rkReason")} aria-required={false} value={reason} onChange={(event) => setReason(event.target.value)} />
          </label>
          <p className="c4-meta">{v4("rkReasonHint")}</p>
          <div className="c4-row">
            <button type="button" className="c4-btn c4-btn-hot" disabled={busy} onClick={() => void confirmReview()}>{v4("rkConfirm")}</button>
            <button type="button" className="c4-btn" onClick={() => setPending(null)}>{v4("rkCancel")}</button>
          </div>
        </div>
      )}
      {msg && <p className="c4-meta">{msg}</p>}
    </section>
  );
}

export function RecordTimeline({
  items,
  v4,
  locale,
  pins,
  onPin,
}: {
  items: FeedItem[];
  v4: V4;
  locale: string;
  pins: string[];
  onPin: (id: string) => void;
}) {
  const [kind, setKind] = useState("");
  const [jump, setJump] = useState("");
  const [miss, setMiss] = useState(false);
  const shown = filterKind(items, kind);
  const groups = groupDays(shown);
  function go() {
    const day = findDay(groups.map((group) => group.day).filter(Boolean), jump);
    if (!day) {
      setMiss(true);
      return;
    }
    setMiss(false);
    document.getElementById(`c4-day-${day}`)?.scrollIntoView({ block: "nearest" });
  }
  return (
    <section className="c4-dayline c4-dayline-salon" aria-label={v4("tlShowing")} data-dayline="1">
      <header className="c4-dayline-salon-mast">
        <div>
          <p className="c4-dayline-salon-kicker">{v4("tlHint")}</p>
          <h2 className="c4-title c4-dayline-salon-title">{v4("tlShowing")}</h2>
        </div>
        <p className="c4-dayline-salon-plate" data-logo="mono">7FX</p>
      </header>
      <p className="c4-meta c4-dayline-salon-hint">{v4("tlHint")}</p>
      <p className="c4-meta">{v4("tlShowing")} {shown.length}</p>
      <div className="c4-row" role="group" aria-label={v4("tlAll")}>
        <button type="button" className="c4-chip" data-on={kind ? "0" : "1"} onClick={() => setKind("")}>{v4("tlAll")}</button>
        {(["note", "call", "status", "money"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={kind === item ? "1" : "0"} onClick={() => setKind(item)}>{v4(TYPE_LABEL[item])}</button>
        ))}
      </div>
      <div className="c4-risk-tools c4-dayline-salon-tools">
        <label className="c4-lab">
          <span>{v4("tlJump")}</span>
          <input className="c4-field" type="date" aria-label={v4("tlJump")} value={jump} onChange={(event) => { setJump(event.target.value); setMiss(false); }} />
        </label>
        <button type="button" className="c4-btn" onClick={go}>{v4("tlGo")}</button>
      </div>
      {miss && <p className="c4-meta">{v4("tlMissing")}</p>}
      {!groups.length && <p className="c4-pay-empty">{v4("tlEmpty")}</p>}
      {groups.map((group) => (
        <section key={group.day || "none"} className="c4-day-group c4-dayline-salon-day" id={group.day ? `c4-day-${group.day}` : undefined}>
          <h3 className="c4-title">{group.day || v4("tlUndated")}</h3>
          <ol>
            {group.items.map((item) => (
              <li key={item.id} className="c4-day-item" data-kind={item.kind}>
                <span className="c4-type-icon" data-kind={item.kind} aria-hidden="true" />
                <div className="c4-day-copy">
                  <strong>{v4(TYPE_LABEL[item.kind] || "tlStatus")}</strong>
                  <p>{item.title || "—"}</p>
                  <p className="c4-meta">{item.detail}{item.at ? ` · ${when(item.at, locale)}` : ""}</p>
                </div>
                <button type="button" className="c4-btn" aria-pressed={pins.includes(item.id)} onClick={() => onPin(item.id)}>{v4("pinItem")}</button>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </section>
  );
}
