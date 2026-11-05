"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
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
} from "@/lib/crmv4/round60";
import { crmv4Href } from "@/lib/crmv4/sections";
import { useEscape } from "./round40";
import { money, useJson, type Tx } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const KYC_LABEL: Record<string, CrmV4CopyKey> = {
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

export function HealthStrip({ base, v4, locale, tx }: { base: string; v4: V4; locale: string; tx: Tx }) {
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
    <section className="c4-health-strip" aria-label={v4("hlTitle")} data-health-strip="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-pay-kicker">{v4("hlSub")}</p>
          <h2 className="c4-title">{v4("hlTitle")}</h2>
        </div>
        <p className="c4-meta">{v4("hlCount")} {shown.length}</p>
      </header>
      <p className="c4-meta">{v4("hlHint")}</p>
      <label className="c4-lab">
        <span>{v4("hlSearch")}</span>
        <input className="c4-field" aria-label={v4("hlSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c4-row" role="group" aria-label={v4("hlScore")}>
        <button type="button" className="c4-chip" data-on={score ? "0" : "1"} aria-pressed={!score} onClick={() => setScore("")}>{v4("hlAll")}</button>
        {SCORES.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={score === item ? "1" : "0"} aria-pressed={score === item} onClick={() => setScore(item)}>{v4("hlScore")} {item}</button>
        ))}
      </div>
      <div className="c4-health-totals" aria-label={v4("hlTotals")}>
        <p className="c4-meta">{v4("hlTotals")}</p>
        <ul>
          {totals.map((line) => (
            <li key={line.currency || "none"} data-currency={line.currency || "none"}>
              <strong>{line.currency.length === 3 ? money(line.amount, line.currency, locale) : line.amount.toFixed(2)}</strong>
              {line.currency.length !== 3 && <span>{v4("hlNoCurrency")}</span>}
              <span className="c4-meta">{line.count}</span>
            </li>
          ))}
        </ul>
      </div>
      {data.loading && !loaded.length && <p className="c4-meta">{v4("hlLoading")}</p>}
      {data.error && <p className="c4-meta">{v4("hlFailed")} {tx("failed")}</p>}
      {!data.loading && !data.error && !loaded.length && <p className="c4-pay-empty">{v4("hlNone")}</p>}
      {!data.loading && !data.error && loaded.length > 0 && !shown.length && <p className="c4-pay-empty">{v4("hlEmpty")}</p>}
      <ul className="c4-health-cards">
        {shown.map((row) => {
          const mark = healthMark(row);
          const watched = pins.includes(row.id);
          const kyc = KYC_LABEL[mark.kyc];
          return (
            <li key={row.id} className="c4-health-card" data-score={mark.score} data-watched={watched ? "1" : "0"}>
              <div className="c4-row c4-between">
                <strong>{row.name || row.email || "—"}</strong>
                <span className="c4-health-score">{v4("hlScore")} {mark.score}/{mark.max}</span>
              </div>
              <p>{balanceText(row, locale, v4("hlNoCurrency"))}</p>
              <p className="c4-meta">{row.desk || "—"}</p>
              <ul className="c4-health-marks">
                <li>{v4("hlKyc")} {kyc ? v4(kyc) : mark.kyc || v4("hlOpenKyc")}</li>
                <li>{v4("hlDeposit")} {mark.deposit ? v4("hlYes") : v4("hlNo")}</li>
                <li>{v4("hlActivity")} {mark.activity === "recent" ? v4("hlRecent") : mark.activity === "quiet" ? v4("hlQuiet") : v4("hlNoActivity")}</li>
              </ul>
              <div className="c4-row">
                <button type="button" className="c4-btn" data-health-watch="" onClick={() => storePins(toggleId(pins, row.id))}>{watched ? v4("hlUnwatch") : v4("hlWatch")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{v4("hlOpen")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function ScratchBoard({ v4 }: { v4: V4 }) {
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

  return (
    <section className="c4-scratch-board" aria-label={v4("sbTitle")} data-scratch-board="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-pay-kicker">{v4("sbSub")}</p>
          <h2 className="c4-title">{v4("sbTitle")}</h2>
        </div>
        <p className="c4-meta">{shown.length}</p>
      </header>
      <p className="c4-meta">{v4("sbHint")}</p>
      <p className="c4-meta">{v4("sbLocal")}</p>
      <label className="c4-lab">
        <span>{v4("sbSearch")}</span>
        <input className="c4-field" aria-label={v4("sbSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c4-row" role="group" aria-label={v4("sbOpen")}>
        <button type="button" className="c4-chip" data-on={archived ? "0" : "1"} aria-pressed={!archived} onClick={() => setArchived(false)}>{v4("sbOpen")}</button>
        <button type="button" className="c4-chip" data-on={archived ? "1" : "0"} aria-pressed={archived} onClick={() => setArchived(true)}>{v4("sbArchived")}</button>
      </div>
      <form className="c4-row" onSubmit={(event) => {
        event.preventDefault();
        const next = addNote(notes, { id: `scratch-${Date.now()}`, body, at: new Date().toISOString() });
        if (next.length === notes.length && next.every((note, index) => note.id === notes[index]?.id)) return;
        store(next);
        setBody("");
        setArchived(false);
      }}>
        <label className="c4-lab">
          <span>{v4("sbBody")}</span>
          <input className="c4-field" aria-label={v4("sbBody")} value={body} onChange={(event) => setBody(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn">{v4("sbAdd")}</button>
      </form>
      <p className="c4-meta">{v4("sbBlank")}</p>
      {!shown.length && <p className="c4-pay-empty">{v4("sbEmpty")}</p>}
      <ul className="c4-scratch-notes">
        {shown.map((note) => (
          <li key={note.id} className="c4-scratch-note" data-pinned={note.pinned ? "1" : "0"} data-archived={note.archived ? "1" : "0"}>
            <p>{note.body}</p>
            <div className="c4-row">
              <button type="button" className="c4-btn" onClick={() => store(togglePin(notes, note.id))}>{note.pinned ? v4("sbUnpin") : v4("sbPin")}</button>
              <button type="button" className="c4-btn" onClick={() => store(archiveNote(notes, note.id, !note.archived))}>{note.archived ? v4("sbRestore") : v4("sbArchive")}</button>
              <button type="button" className="c4-btn" onClick={() => setRemoving(note.id)}>{v4("sbRemove")}</button>
            </div>
          </li>
        ))}
      </ul>
      {removing && (
        <div className="c4-pay-confirm" role="dialog" aria-modal="true" data-confirm="">
          <p>{v4("sbRemoveLead")}</p>
          <div className="c4-row">
            <button type="button" className="c4-btn c4-btn-hot" onClick={() => { store(removeNote(notes, removing)); setRemoving(null); }}>{v4("sbRemove")}</button>
            <button type="button" className="c4-btn" onClick={() => setRemoving(null)}>{v4("sbCancel")}</button>
          </div>
        </div>
      )}
    </section>
  );
}
