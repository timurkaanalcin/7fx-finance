"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CrmV3CopyKey } from "@/lib/crmv3/copy";
import { filterFeed, mergeFeed, readJson, writeJson, type CallLog, type FeedKind } from "@/lib/crmv3/bridge";
import { useEscape } from "@/lib/crmv3/focus";
import { ROLE_KEY, deskRole } from "@/lib/crmv3/inbox-sla";
import {
  filterFlags,
  findDay,
  frequentPeople,
  groupDays,
  kycWithDeposits,
  largeDeposits,
  pendingDoc,
  readCount,
  readNotes,
  readThresholds,
  setThreshold,
  writeNote,
  type CashRow,
  type ReviewNote,
  type RiskKind,
} from "@/lib/crmv3/risk";
import { crmv3Href } from "@/lib/crmv3/sections";
import { money, sendJson, useJson, when, type Tx } from "../kit";
import { useV3 } from "./store";

type V3 = (key: CrmV3CopyKey) => string;

const THRESHOLD_KEY = "crmv3-risk-thresholds";
const COUNT_KEY = "crmv3-risk-count";
const NOTE_KEY = "crmv3-risk-notes";
const CALL_KEY = "crmv3-call-log";
const PIN_KEY = "crmv3-feed-pins";

const KIND_LABEL: Record<FeedKind, CrmV3CopyKey> = {
  note: "tlNote",
  call: "tlCall",
  status: "tlStatus",
  money: "tlMoney",
};

const FLAG_LABEL: Record<RiskKind, CrmV3CopyKey> = {
  large: "rkLarge",
  frequent: "rkFrequent",
  kyc: "rkKyc",
};

type Deposit = { id: string; amount?: number | null; currency?: string | null; userId?: string | null; user?: { id?: string | null; name?: string | null } | null };
type Person = { id: string; name?: string | null; documentsStatus?: string | null };
type Doc = { id: string; traderId?: string | null; name?: string | null; status?: string | null };

function asCash(rows: Deposit[]): CashRow[] {
  return rows.map((row) => ({
    id: row.id,
    amount: row.amount,
    currency: row.currency,
    userId: String(row.user?.id || row.userId || ""),
    name: row.user?.name || "",
  }));
}

export function RiskDesk({ base, tx, locale }: { base: string; tx: Tx; locale: string }) {
  const v3 = useV3();
  const deposits = useJson<{ requests?: Deposit[] }>("/api/admin/deposits?take=80");
  const withdrawals = useJson<{ requests?: Deposit[] }>("/api/admin/withdrawals?take=80");
  // The table view omits document status, which these flags need.
  const people = useJson<{ users?: Person[] }>("/api/admin/users?take=80&meta=0&role=TRADER");
  const docs = useJson<{ documents?: Doc[] }>("/api/admin/documents?status=PENDING&take=40");
  const [thresholds, setThresholds] = useState<Record<string, number>>({});
  const [code, setCode] = useState("");
  const [limit, setLimit] = useState("");
  const [count, setCount] = useState(3);
  const [countDraft, setCountDraft] = useState("3");
  const [notes, setNotes] = useState<Record<string, ReviewNote>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState("");
  const [kind, setKind] = useState<"" | RiskKind>("");
  const [query, setQuery] = useState("");
  const [viewer, setViewer] = useState(false);
  const [pending, setPending] = useState<{ docId: string; name: string; status: "APPROVED" | "REJECTED" } | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  useEscape(Boolean(pending), () => { if (!busy) setPending(null); });
  useEffect(() => {
    const stored = readThresholds(readJson(THRESHOLD_KEY, {}));
    setThresholds(stored);
    const nextCount = readCount(readJson(COUNT_KEY, 3));
    setCount(nextCount);
    setCountDraft(String(nextCount));
    setNotes(readNotes(readJson(NOTE_KEY, {})));
    setViewer(deskRole(readJson(ROLE_KEY, "desk")) === "viewer");
    const onRole = () => setViewer(deskRole(readJson(ROLE_KEY, "desk")) === "viewer");
    window.addEventListener("crmv3:desk-role", onRole);
    return () => window.removeEventListener("crmv3:desk-role", onRole);
  }, []);
  const depositRows = asCash(deposits.data?.requests || []);
  const withdrawalRows = asCash(withdrawals.data?.requests || []);
  const users = people.data?.users || [];
  const pendingDocs = docs.data?.documents || [];
  const currencies: string[] = [];
  for (const row of depositRows) {
    const currency = String(row.currency || "").trim().toUpperCase();
    if (currency && !currencies.includes(currency)) currencies.push(currency);
  }
  currencies.sort();
  const large = largeDeposits(depositRows, thresholds);
  const frequent = frequentPeople(withdrawalRows, count);
  const kyc = kycWithDeposits(users, depositRows);
  const flags = [
    ...large.map((row) => ({ kind: "large" as const, id: row.id, name: String(row.name || row.userId || row.id) })),
    ...frequent.map((row) => ({ kind: "frequent" as const, id: row.userId, name: row.name })),
    ...kyc.map((row) => ({ kind: "kyc" as const, id: row.id, name: row.name })),
  ];
  const shownIds = new Set(filterFlags(flags, kind, query).map((flag) => `${flag.kind}:${flag.id}`));
  const largeShown = large.filter((row) => shownIds.has(`large:${row.id}`));
  const frequentShown = frequent.filter((row) => shownIds.has(`frequent:${row.userId}`));
  const kycShown = kyc.filter((row) => shownIds.has(`kyc:${row.id}`));
  const filtering = Boolean(kind || query.trim());

  function saveNote(id: string) {
    const next = writeNote(notes, id, drafts[id] ?? notes[id]?.body ?? "", new Date().toISOString());
    setNotes(next);
    writeJson(NOTE_KEY, next);
    setSaved(id);
  }

  async function confirmReview() {
    if (!pending || busy || viewer) return;
    setBusy(true);
    try {
      const note = reason.trim();
      const res = await sendJson("/api/admin/documents", "POST", {
        action: "review",
        id: pending.docId,
        status: pending.status,
        ...(note ? { note } : {}),
      });
      setMsg(res.ok ? tx("docReviewed") : res.error || tx("failed"));
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
    <section className="c3-risk" aria-label={v3("rkTitle")} data-risk="">
      <h2 className="c3-title">{v3("rkTitle")}</h2>
      <p className="c3-muted">{v3("rkHint")}</p>
      <p className="c3-muted">{v3("rkLoaded")} {depositRows.length} · {withdrawalRows.length} · {users.length}</p>
      <div className="c3-row">
        <button type="button" className="c3-chip" data-on={viewer ? "1" : "0"} aria-pressed={viewer} onClick={() => {
          const next = viewer ? "desk" : "viewer";
          writeJson(ROLE_KEY, next);
          setViewer(!viewer);
          window.dispatchEvent(new Event("crmv3:desk-role"));
        }}>{v3("inViewerChip")}</button>
      </div>
      {viewer && <p className="c3-muted">{v3("rkViewer")}</p>}
      <div className="c3-row" role="group" aria-label={v3("rkAll")}>
        <button type="button" className="c3-chip" data-on={kind ? "0" : "1"} onClick={() => setKind("")}>{v3("rkAll")}</button>
        {(["large", "frequent", "kyc"] as const).map((item) => (
          <button key={item} type="button" className="c3-chip" data-on={kind === item ? "1" : "0"} onClick={() => setKind(item)}>{v3(FLAG_LABEL[item])} {flags.filter((flag) => flag.kind === item).length}</button>
        ))}
      </div>
      <label className="c3-lab">
        <span>{v3("rkSearch")}</span>
        <input className="c3-field" aria-label={v3("rkSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {filtering && !shownIds.size && <p className="c3-empty">{kind === "large" ? v3("rkLargeEmpty") : kind === "frequent" ? v3("rkFrequentEmpty") : kind === "kyc" ? v3("rkKycEmpty") : v3("rkEmpty")}</p>}
      <article className="c3-risk-card">
        <h3 className="c3-title">{v3("rkThreshold")}</h3>
        <p className="c3-muted">{v3("rkThresholdHint")}</p>
        <div className="c3-row">
          <select className="c3-select" aria-label={v3("rkCurrency")} value={code} onChange={(event) => { setCode(event.target.value); setLimit(thresholds[event.target.value] ? String(thresholds[event.target.value]) : ""); }}>
            <option value="" />
            {currencies.map((item) => <option key={item} value={item}>{item}{thresholds[item] ? ` · ${thresholds[item]}` : ""}</option>)}
          </select>
          <input className="c3-field" inputMode="decimal" aria-label={v3("rkThreshold")} value={limit} onChange={(event) => setLimit(event.target.value)} />
          <button type="button" className="c3-btn" onClick={() => {
            const next = setThreshold(thresholds, code, Number(limit));
            setThresholds(next);
            writeJson(THRESHOLD_KEY, next);
          }}>{v3("rkSaveThreshold")}</button>
          <button type="button" className="c3-btn" onClick={() => {
            const next = setThreshold(thresholds, code, 0);
            setThresholds(next);
            writeJson(THRESHOLD_KEY, next);
            setLimit("");
          }}>{v3("rkClearThreshold")}</button>
        </div>
      </article>
      <article className="c3-risk-card">
        <h3 className="c3-title">{v3("rkCount")}</h3>
        <p className="c3-muted">{v3("rkCountHint")}</p>
        <div className="c3-row">
          <input className="c3-field" inputMode="numeric" aria-label={v3("rkCount")} value={countDraft} onChange={(event) => setCountDraft(event.target.value)} />
          <button type="button" className="c3-btn" onClick={() => {
            const next = readCount(countDraft);
            setCount(next);
            setCountDraft(String(next));
            writeJson(COUNT_KEY, next);
          }}>{v3("rkSaveCount")}</button>
        </div>
      </article>
      {(!filtering || largeShown.length > 0) && <article className="c3-risk-card" data-risk-block="large">
        <h3 className="c3-title">{v3("rkLarge")} <span className="c3-count">{large.length}</span></h3>
        {!filtering && !large.length && <p className="c3-muted">{v3("rkLargeEmpty")}</p>}
        {largeShown.map((row) => (
          <Flag
            key={row.id}
            id={`large-${row.id}`}
            title={`${row.name || row.userId || row.id}`}
            detail={`${money(row.amount, String(row.currency || "").toUpperCase(), locale)} · ${v3("rkThreshold")} ${thresholds[String(row.currency || "").toUpperCase()] ?? ""}`}
            href={row.userId ? crmv3Href(base, `customers/${row.userId}`) : ""}
            note={drafts[`large-${row.id}`] ?? notes[`large-${row.id}`]?.body ?? ""}
            saved={saved === `large-${row.id}`}
            v3={v3}
            onNote={(value) => setDrafts((current) => ({ ...current, [`large-${row.id}`]: value }))}
            onSave={() => saveNote(`large-${row.id}`)}
          />
        ))}
      </article>}
      {(!filtering || frequentShown.length > 0) && <article className="c3-risk-card" data-risk-block="frequent">
        <h3 className="c3-title">{v3("rkFrequent")} <span className="c3-count">{frequent.length}</span></h3>
        {!filtering && !frequent.length && <p className="c3-muted">{v3("rkFrequentEmpty")}</p>}
        {frequentShown.map((row) => (
          <Flag
            key={row.userId}
            id={`frequent-${row.userId}`}
            title={row.name}
            detail={`${row.count} · ${row.sums.map((item) => `${item.currency} ${money(item.amount, item.currency, locale)}`).join(" · ")}`}
            href={crmv3Href(base, `customers/${row.userId}`)}
            note={drafts[`frequent-${row.userId}`] ?? notes[`frequent-${row.userId}`]?.body ?? ""}
            saved={saved === `frequent-${row.userId}`}
            v3={v3}
            onNote={(value) => setDrafts((current) => ({ ...current, [`frequent-${row.userId}`]: value }))}
            onSave={() => saveNote(`frequent-${row.userId}`)}
          />
        ))}
      </article>}
      {(!filtering || kycShown.length > 0) && <article className="c3-risk-card" data-risk-block="kyc">
        <h3 className="c3-title">{v3("rkKyc")} <span className="c3-count">{kyc.length}</span></h3>
        {!filtering && !kyc.length && <p className="c3-muted">{v3("rkKycEmpty")}</p>}
        {kycShown.map((row) => {
          const doc = pendingDoc(pendingDocs, row.id);
          return (
            <Flag
              key={row.id}
              id={`kyc-${row.id}`}
              title={row.name}
              detail={row.sums.map((item) => `${item.currency} ${money(item.amount, item.currency, locale)}`).join(" · ") || "—"}
              href={crmv3Href(base, `customers/${row.id}`)}
              note={drafts[`kyc-${row.id}`] ?? notes[`kyc-${row.id}`]?.body ?? ""}
              saved={saved === `kyc-${row.id}`}
              v3={v3}
              onNote={(value) => setDrafts((current) => ({ ...current, [`kyc-${row.id}`]: value }))}
              onSave={() => saveNote(`kyc-${row.id}`)}
              review={doc && !viewer ? () => setPending({ docId: doc.id, name: row.name, status: "APPROVED" }) : undefined}
              noDoc={!doc}
              held={Boolean(doc && viewer)}
            />
          );
        })}
      </article>}
      {pending && (
        <section className="c3-risk-confirm" role="dialog" aria-label={v3("rkConfirmTitle")} data-confirm="review">
          <h3 className="c3-title">{v3("rkConfirmTitle")}</h3>
          <p>{pending.name}</p>
          <p className="c3-muted">{v3("rkConfirmLead")}</p>
          <label className="c3-lab">
            <span>{v3("rkStatus")}</span>
            <select className="c3-select" aria-label={v3("rkStatus")} value={pending.status} onChange={(event) => setPending({ ...pending, status: event.target.value === "REJECTED" ? "REJECTED" : "APPROVED" })}>
              <option value="APPROVED">APPROVED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </label>
          <label className="c3-lab">
            <span>{v3("rkReason")}</span>
            <input className="c3-field" aria-label={v3("rkReason")} aria-required={false} value={reason} onChange={(event) => setReason(event.target.value)} />
          </label>
          <p className="c3-muted">{v3("rkReasonHint")}</p>
          <div className="c3-row">
            <button type="button" className="c3-btn c3-btn-hot" disabled={busy} onClick={() => void confirmReview()}>{v3("rkConfirm")}</button>
            <button type="button" className="c3-btn" onClick={() => setPending(null)}>{v3("rkCancel")}</button>
          </div>
        </section>
      )}
      {msg && <p className="c3-muted" aria-live="polite">{msg}</p>}
    </section>
  );
}

function Flag({ id, title, detail, href, note, saved, v3, onNote, onSave, review, noDoc, held }: {
  id: string;
  title: string;
  detail: string;
  href: string;
  note: string;
  saved: boolean;
  v3: V3;
  onNote: (value: string) => void;
  onSave: () => void;
  review?: () => void;
  noDoc?: boolean;
  held?: boolean;
}) {
  return (
    <div className="c3-risk-flag" data-flag={id}>
      <div className="c3-row c3-between">
        {href ? <Link href={href}>{title || "—"}</Link> : <strong>{title || "—"}</strong>}
        <span className="c3-muted">{detail}</span>
      </div>
      <label className="c3-lab">
        <span>{v3("rkNote")}</span>
        <textarea className="c3-field" rows={2} aria-label={v3("rkNote")} value={note} onChange={(event) => onNote(event.target.value)} />
      </label>
      <div className="c3-row">
        <button type="button" className="c3-btn" onClick={onSave}>{v3("rkSaveNote")}</button>
        {review && <button type="button" className="c3-btn" onClick={review}>{v3("rkReview")}</button>}
      </div>
      {saved && <p className="c3-muted">{v3("rkNoteSaved")}</p>}
      {noDoc && <p className="c3-muted">{v3("rkNoDoc")}</p>}
      {!review && !noDoc && !held && <p className="c3-muted">{v3("rkNoStatus")}</p>}
    </div>
  );
}

export function DayTimeline({ id, notes, events, locale }: {
  id: string;
  notes: { id: string; body?: string | null; authorName?: string | null; createdAt?: string | null }[];
  events: { id: string; kind?: string | null; path?: string | null; createdAt?: string | null }[];
  locale: string;
}) {
  const v3 = useV3();
  const cash = useJson<{ transactions?: { id: string; type?: string; amount?: number; currency?: string; createdAt?: string; comment?: string }[] }>(`/api/admin/transactions?userId=${encodeURIComponent(id)}&limit=20`);
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [pins, setPins] = useState<string[]>([]);
  const [kind, setKind] = useState<"" | FeedKind>("");
  const [jump, setJump] = useState("");
  const [missing, setMissing] = useState(false);
  const [outcome, setOutcome] = useState("reached");
  const [minutes, setMinutes] = useState("");
  const [nextAt, setNextAt] = useState("");
  const [note, setNote] = useState("");
  useEffect(() => {
    const all = readJson<Record<string, CallLog[]>>(CALL_KEY, {});
    setCalls(all[id] || []);
    setPins(readJson<string[]>(PIN_KEY, []));
  }, [id]);
  const items = mergeFeed({ notes, events, calls, money: cash.data?.transactions || [] });
  const shown = filterFeed(items, kind, "");
  const groups = groupDays(shown);
  const pinned = shown.filter((item) => pins.includes(item.id));

  function saveCall() {
    const text = note.trim();
    if (!text && !minutes && !nextAt) return;
    const row: CallLog = { id: String(Date.now()), at: new Date().toISOString(), outcome, minutes: Number(minutes) || 0, next: nextAt, note: text };
    const all = readJson<Record<string, CallLog[]>>(CALL_KEY, {});
    const nextRows = [row, ...(all[id] || [])].slice(0, 40);
    all[id] = nextRows;
    writeJson(CALL_KEY, all);
    setCalls(nextRows);
    setMinutes("");
    setNextAt("");
    setNote("");
  }

  function goToDay() {
    const hit = findDay(groups.map((group) => group.day), jump);
    setMissing(!hit);
    if (!hit) return;
    const node = document.getElementById(`c3-tl-${hit}`);
    const panel = document.querySelector(".c3-main");
    if (!node || !panel) return;
    const top = node.getBoundingClientRect().top - panel.getBoundingClientRect().top + panel.scrollTop;
    panel.scrollTop = Math.max(0, top - 8);
  }

  return (
    <section className="c3-timeline" aria-label={v3("tlTitle")} data-timeline="">
      <h2 className="c3-title">{v3("tlTitle")}</h2>
      <p className="c3-muted">{v3("tlHint")}</p>
      <p className="c3-muted" data-shown={shown.length}>{v3("tlShowing")} {shown.length} · {v3("rkLoaded")} {items.length}</p>
      <div className="c3-row">
        <button type="button" className="c3-chip" data-on={kind === "" ? "1" : "0"} onClick={() => setKind("")}>{v3("tlAll")}</button>
        {(["note", "call", "status", "money"] as const).map((item) => (
          <button key={item} type="button" className="c3-chip" data-on={kind === item ? "1" : "0"} onClick={() => setKind(item)}>{v3(KIND_LABEL[item])}</button>
        ))}
      </div>
      <div className="c3-row">
        <input className="c3-field" type="date" aria-label={v3("tlJump")} value={jump} onChange={(event) => { setJump(event.target.value); setMissing(false); }} />
        <button type="button" className="c3-btn" onClick={goToDay}>{v3("tlGo")}</button>
      </div>
      {missing && <p className="c3-muted">{v3("tlMissing")}</p>}
      {!shown.length && <p className="c3-muted">{v3("tlEmpty")}</p>}
      {pinned.length > 0 && (
        <ul className="c3-tl-list">
          {pinned.map((item) => <FeedLine key={`pin-${item.id}`} item={item} v3={v3} locale={locale} pinned onPin={() => toggleFeedPin(pins, item.id, setPins)} />)}
        </ul>
      )}
      {groups.map((group) => (
        <section key={group.day || "none"} id={group.day ? `c3-tl-${group.day}` : undefined} className="c3-tl-group" data-day={group.day || "none"}>
          <h3 className="c3-title">{group.day || v3("tlUndated")}</h3>
          <ol className="c3-tl-list">
            {group.items.map((item) => (
              <FeedLine key={item.id} item={item} v3={v3} locale={locale} pinned={pins.includes(item.id)} onPin={() => toggleFeedPin(pins, item.id, setPins)} />
            ))}
          </ol>
        </section>
      ))}
      <div className="c3-risk-card">
        <h3 className="c3-title">{v3("logCall")}</h3>
        <p className="c3-muted">{v3("nothingSent")}</p>
        <label className="c3-lab">
          <span>{v3("logCall")}</span>
          <select className="c3-select" aria-label={v3("logCall")} value={outcome} onChange={(event) => setOutcome(event.target.value)}>
            <option value="reached">{v3("callReached")}</option>
            <option value="noAnswer">{v3("callNoAnswer")}</option>
            <option value="busy">{v3("callBusy")}</option>
            <option value="callback">{v3("callCallback")}</option>
          </select>
        </label>
        <label className="c3-lab"><span>{v3("callMinutes")}</span><input className="c3-field" inputMode="numeric" aria-label={v3("callMinutes")} value={minutes} onChange={(event) => setMinutes(event.target.value)} /></label>
        <label className="c3-lab"><span>{v3("callNext")}</span><input className="c3-field" type="date" aria-label={v3("callNext")} value={nextAt} onChange={(event) => setNextAt(event.target.value)} /></label>
        <label className="c3-lab"><span>{v3("feedNotes")}</span><input className="c3-field" aria-label={v3("feedNotes")} value={note} onChange={(event) => setNote(event.target.value)} /></label>
        <button type="button" className="c3-btn" onClick={saveCall}>{v3("logCall")}</button>
      </div>
    </section>
  );
}

function toggleFeedPin(pins: string[], id: string, setPins: (next: string[]) => void) {
  const next = pins.includes(id) ? pins.filter((item) => item !== id) : [id, ...pins].slice(0, 20);
  setPins(next);
  writeJson(PIN_KEY, next);
}

function FeedLine({ item, v3, locale, pinned, onPin }: {
  item: { id: string; kind: FeedKind; at: string; title: string; detail: string };
  v3: V3;
  locale: string;
  pinned: boolean;
  onPin: () => void;
}) {
  return (
    <li className="c3-feed-line" data-kind={item.kind} data-pin={pinned ? "1" : "0"}>
      <span className="c3-type-mark" data-kind={item.kind} aria-hidden="true" />
      <div>
        <strong>{v3(KIND_LABEL[item.kind])}</strong>
        <p>{item.title || "—"}</p>
        {item.detail && <p className="c3-muted">{item.detail}</p>}
        <p className="c3-muted">{item.at ? when(item.at, locale) : v3("tlUndated")}</p>
      </div>
      <button type="button" className="c3-btn" aria-pressed={pinned} onClick={onPin}>{v3("pinItem")}</button>
    </li>
  );
}
