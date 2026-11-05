"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CrmV3CopyKey } from "@/lib/crmv3/copy";
import { readJson, writeJson } from "@/lib/crmv3/bridge";
import { useEscape } from "@/lib/crmv3/focus";
import {
  SCRATCH_KEY,
  WATCH_KEY,
  addNote,
  archiveNote,
  balanceTotals,
  healthMark,
  readIds,
  readNotes,
  removeNote,
  toggleId,
  togglePin,
  visibleHealth,
  visibleNotes,
  type HealthRow,
  type ScratchNote,
} from "@/lib/crmv3/health";
import { crmv3Href } from "@/lib/crmv3/sections";
import { money, useJson, type Tx } from "../kit";
import { useV3 } from "./store";

const KYC_LABEL: Record<string, CrmV3CopyKey> = {
  APPROVED: "hlApproved",
  PENDING: "hlPending",
  REJECTED: "hlRejected",
  NONE: "hlOpenKyc",
};

const SCORES = ["0", "1", "2", "3"] as const;

function balanceText(row: HealthRow, locale: string, none: string): string {
  const currency = String(row.currency || "").trim().toUpperCase();
  const amount = Number(row.balance);
  if (!Number.isFinite(amount)) return "—";
  if (currency.length === 3) return money(amount, currency, locale);
  return `${amount.toFixed(2)} ${none}`;
}

export function HealthStrip({ base, locale, tx }: { base: string; locale: string; tx: Tx }) {
  const v3 = useV3();
  const data = useJson<{ users?: HealthRow[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [query, setQuery] = useState("");
  const [score, setScore] = useState("");
  const [pins, setPins] = useState<string[]>([]);
  useEffect(() => { setPins(readIds(readJson(WATCH_KEY, []))); }, []);
  const loaded = data.data?.users || [];
  const shown = visibleHealth(loaded, query, score, pins);
  const totals = balanceTotals(shown);

  function storePins(next: string[]) {
    setPins(next);
    writeJson(WATCH_KEY, next);
  }

  return (
    <section className="c3-health-strip" aria-label={v3("hlTitle")} data-health-strip="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("hlSub")}</p>
          <h2 className="c3-title">{v3("hlTitle")}</h2>
        </div>
        <p className="c3-muted">{v3("hlCount")} {shown.length}</p>
      </header>
      <p className="c3-muted">{v3("hlHint")}</p>
      <label className="c3-lab">
        <span>{v3("hlSearch")}</span>
        <input className="c3-field" aria-label={v3("hlSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c3-row" role="group" aria-label={v3("hlScore")}>
        <button type="button" className="c3-chip" data-on={score ? "0" : "1"} aria-pressed={!score} onClick={() => setScore("")}>{v3("hlAll")}</button>
        {SCORES.map((item) => (
          <button key={item} type="button" className="c3-chip" data-on={score === item ? "1" : "0"} aria-pressed={score === item} onClick={() => setScore(item)}>{v3("hlScore")} {item}</button>
        ))}
      </div>
      <div className="c3-health-totals" aria-label={v3("hlTotals")}>
        <p className="c3-muted">{v3("hlTotals")}</p>
        <ul>
          {totals.map((line) => (
            <li key={line.currency || "none"} data-currency={line.currency || "none"}>
              <span>{line.currency || v3("hlNoCurrency")}</span>
              <strong>{line.amount.toLocaleString(locale || "en", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
              <span className="c3-muted">{line.count}</span>
            </li>
          ))}
        </ul>
      </div>
      {data.loading && !loaded.length && <p className="c3-muted">{v3("hlLoading")}</p>}
      {data.error && <p className="c3-muted">{v3("hlFailed")} {tx("failed")}</p>}
      {!data.loading && !data.error && !loaded.length && <p className="c3-empty">{v3("hlNone")}</p>}
      {!data.loading && !data.error && loaded.length > 0 && !shown.length && <p className="c3-empty">{v3("hlEmpty")}</p>}
      <ul className="c3-health-cards">
        {shown.map((row) => {
          const mark = healthMark(row);
          const watched = pins.includes(row.id);
          const kyc = KYC_LABEL[mark.kyc];
          return (
            <li key={row.id} className="c3-health-card" data-score={mark.score} data-watched={watched ? "1" : "0"}>
              <div className="c3-row c3-between">
                <strong>{row.name || row.email || "—"}</strong>
                <span className="c3-health-score">{v3("hlScore")} {mark.score}/{mark.max}</span>
              </div>
              <p>{balanceText(row, locale, v3("hlNoCurrency"))}</p>
              <p className="c3-muted">{row.desk || "—"}</p>
              <ul className="c3-health-marks">
                <li>{v3("hlKyc")} {kyc ? v3(kyc) : mark.kyc || v3("hlOpenKyc")}</li>
                <li>{v3("hlDeposit")} {mark.deposit ? v3("hlYes") : v3("hlNo")}</li>
                <li>{v3("hlActivity")} {mark.activity === "recent" ? v3("hlRecent") : mark.activity === "quiet" ? v3("hlQuiet") : v3("hlNoActivity")}</li>
              </ul>
              <div className="c3-row">
                <button type="button" className="c3-btn" data-health-watch="" onClick={() => storePins(toggleId(pins, row.id))}>{watched ? v3("hlUnwatch") : v3("hlWatch")}</button>
                <Link className="c3-btn" href={crmv3Href(base, `customers/${row.id}`)}>{v3("hlOpen")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function ScratchBoard() {
  const v3 = useV3();
  const [notes, setNotes] = useState<ScratchNote[]>([]);
  const [query, setQuery] = useState("");
  const [body, setBody] = useState("");
  const [archived, setArchived] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  useEscape(Boolean(removing), () => setRemoving(null));
  useEffect(() => { setNotes(readNotes(readJson(SCRATCH_KEY, []))); }, []);
  const shown = visibleNotes(notes, query, archived);

  function store(next: ScratchNote[]) {
    setNotes(next);
    writeJson(SCRATCH_KEY, next);
  }

  function add() {
    const next = addNote(notes, { id: `scratch-${Date.now()}`, body, at: new Date().toISOString() });
    if (next.length === notes.length && next.every((note, index) => note.id === notes[index]?.id)) return;
    store(next);
    setBody("");
    setArchived(false);
  }

  return (
    <section className="c3-scratch-board" aria-label={v3("sbTitle")} data-scratch-board="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("sbSub")}</p>
          <h2 className="c3-title">{v3("sbTitle")}</h2>
        </div>
        <p className="c3-muted">{shown.length}</p>
      </header>
      <p className="c3-muted">{v3("sbHint")}</p>
      <p className="c3-muted">{v3("sbLocal")}</p>
      <label className="c3-lab">
        <span>{v3("sbSearch")}</span>
        <input className="c3-field" aria-label={v3("sbSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c3-row" role="group" aria-label={v3("sbOpen")}>
        <button type="button" className="c3-chip" data-on={archived ? "0" : "1"} aria-pressed={!archived} onClick={() => setArchived(false)}>{v3("sbOpen")}</button>
        <button type="button" className="c3-chip" data-on={archived ? "1" : "0"} aria-pressed={archived} onClick={() => setArchived(true)}>{v3("sbArchived")}</button>
      </div>
      <div className="c3-row">
        <label className="c3-lab">
          <span>{v3("sbBody")}</span>
          <input className="c3-field" aria-label={v3("sbBody")} value={body} onChange={(event) => setBody(event.target.value)} />
        </label>
        <button type="button" className="c3-btn" onClick={add}>{v3("sbAdd")}</button>
      </div>
      <p className="c3-muted">{v3("sbBlank")}</p>
      {!shown.length && <p className="c3-empty">{v3("sbEmpty")}</p>}
      <ul className="c3-scratch-notes">
        {shown.map((note) => (
          <li key={note.id} className="c3-scratch-note" data-pinned={note.pinned ? "1" : "0"} data-archived={note.archived ? "1" : "0"}>
            <p>{note.body}</p>
            <div className="c3-row">
              <button type="button" className="c3-btn" onClick={() => store(togglePin(notes, note.id))}>{note.pinned ? v3("sbUnpin") : v3("sbPin")}</button>
              <button type="button" className="c3-btn" onClick={() => store(archiveNote(notes, note.id, !note.archived))}>{note.archived ? v3("sbRestore") : v3("sbArchive")}</button>
              <button type="button" className="c3-btn" onClick={() => setRemoving(note.id)}>{v3("sbRemove")}</button>
            </div>
          </li>
        ))}
      </ul>
      {removing && (
        <div className="c3-pay-confirm" role="dialog" aria-modal="true" data-confirm="">
          <p>{v3("sbRemoveLead")}</p>
          <div className="c3-row">
            <button type="button" className="c3-btn c3-btn-hot" onClick={() => { store(removeNote(notes, removing)); setRemoving(null); }}>{v3("sbRemove")}</button>
            <button type="button" className="c3-btn" onClick={() => setRemoving(null)}>{v3("sbCancel")}</button>
          </div>
        </div>
      )}
    </section>
  );
}
