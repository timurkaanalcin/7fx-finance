"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import {
  CCY_HIDE_KEY,
  NOTE_KEY,
  activeCurrency,
  addNote,
  currencyCode,
  currencyLines,
  namedCurrencies,
  readHiddenCurrencies,
  readNotes,
  resetNotes,
  setNoteHidden,
  toggleCurrency,
  toggleNotePin,
  visibleCurrencies,
  visibleDeposits,
  visibleNotes,
  type CashRow,
  type Note,
} from "@/lib/crmv4/round112";
import { crmv4Href } from "@/lib/crmv4/sections";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

type Deposit = {
  id: string;
  currency?: string | null;
  status?: string | null;
  user?: { name?: string | null; email?: string | null } | null;
};

type GlanceRow = CashRow & { id: string; status: string };

export function HandoffPolish({ base, v4 }: { base: string; v4: V4 }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const next = readNotes(readJson(NOTE_KEY, []));
    setNotes(next);
    writeJson(NOTE_KEY, next);
  }, []);
  const shown = visibleNotes(notes, hidden, query);

  function store(next: Note[]) {
    setNotes(next);
    writeJson(NOTE_KEY, next);
  }

  return (
    <section className="c4-handoff-polish" aria-label={v4("hpTitle")} data-handoff-polish="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-hp-logo" data-logo="mono">{v4("hpLogo")}</p>
          <p className="c4-pay-kicker">{v4("hpSub")}</p>
          <h2 className="c4-title">{v4("hpTitle")}</h2>
        </div>
        <p className="c4-meta">{shown.length}</p>
      </header>
      <p className="c4-meta">{v4("hpHint")}</p>
      <p className="c4-meta">{v4("hpLocal")}</p>
      <p className="c4-meta">{v4("hpBlank")}</p>
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "handoff")}>{v4("hpBoard")}</Link>
      </p>
      <form className="c4-row" onSubmit={(event) => {
        event.preventDefault();
        const next = addNote(notes, { id: `hp-${notes.length}-${text.trim().slice(0, 8) || "note"}`, text });
        if (next.length === notes.length) return;
        store(next);
        setText("");
      }}>
        <label className="c4-lab">
          <span>{v4("hpText")}</span>
          <input className="c4-field" aria-label={v4("hpText")} value={text} maxLength={120} onChange={(event) => setText(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn">{v4("hpAdd")}</button>
        <button type="button" className="c4-btn" onClick={() => store(resetNotes())}>{v4("hpReset")}</button>
      </form>
      <label className="c4-lab">
        <span>{v4("hpSearch")}</span>
        <input className="c4-field" aria-label={v4("hpSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c4-row" role="group" aria-label={v4("hpTitle")}>
        <button type="button" className="c4-chip" data-on={hidden ? "0" : "1"} aria-pressed={!hidden} onClick={() => setHidden(false)}>{v4("hpOpen")}</button>
        <button type="button" className="c4-chip" data-on={hidden ? "1" : "0"} aria-pressed={hidden} onClick={() => setHidden(true)}>{v4("hpHidden")}</button>
      </div>
      {!shown.length && <p className="c4-pay-empty">{v4("hpEmpty")}</p>}
      <ul className="c4-hp-rows">
        {shown.map((note) => (
          <li key={note.id} data-pinned={note.pinned ? "1" : "0"}>
            <p>{note.text}</p>
            <div className="c4-row">
              <button type="button" className="c4-btn" onClick={() => store(toggleNotePin(notes, note.id))}>{note.pinned ? v4("hpUnpin") : v4("hpPin")}</button>
              <button type="button" className="c4-btn" onClick={() => store(setNoteHidden(notes, note.id, !note.hidden))}>{note.hidden ? v4("hpShow") : v4("hpHide")}</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function DepositCurrencies({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ requests?: Deposit[] }>("/api/admin/deposits?take=40");
  const [hiddenCurrencies, setHiddenCurrencies] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [blank, setBlank] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [query, setQuery] = useState("");
  const rows = (data.data?.requests || []).map((row): GlanceRow => ({
    id: String(row.id || ""),
    label: `${row.user?.name || ""} ${row.user?.email || ""} ${row.status || ""}`.trim(),
    status: String(row.status || "").trim(),
    currency: row.currency,
  }));
  const lines = currencyLines(rows);
  const present = namedCurrencies(rows);
  const presentKey = present.join("\n");
  const blankCount = lines.find((line) => !line.currency)?.count || 0;
  const loading = data.loading && !data.data;
  const failed = Boolean(data.error);
  useEffect(() => {
    if (loading || failed) return;
    const next = readHiddenCurrencies(readJson(CCY_HIDE_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHiddenCurrencies(next);
    writeJson(CCY_HIDE_KEY, next);
  }, [loading, failed, presentKey]);
  const chips = visibleCurrencies(present, hiddenCurrencies, showHidden);
  const currency = activeCurrency(selected, chips);
  const shown = visibleDeposits(rows, currency, blank, query);

  function store(next: string[], clear: string) {
    setHiddenCurrencies(next);
    writeJson(CCY_HIDE_KEY, next);
    if (clear && activeCurrency(selected, [clear])) setSelected("");
  }

  return (
    <section className="c4-ccy-glance" aria-label={v4("qcTitle")} data-ccy-glance="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-pay-kicker">{v4("qcSub")}</p>
          <h2 className="c4-title">{v4("qcTitle")}</h2>
        </div>
        <p className="c4-meta">{chips.length}</p>
      </header>
      <p className="c4-meta">{v4("qcHint")}</p>
      <p className="c4-meta">{v4("qcLocal")}</p>
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "deposit")}>{v4("qcBoard")}</Link>
      </p>
      {loading && !rows.length && <p className="c4-meta">{v4("qcLoading")}</p>}
      {failed && !rows.length && <p className="c4-meta">{v4("qcFailed")}</p>}
      {!loading && !failed && !rows.length && <p className="c4-pay-empty">{v4("qcNone")}</p>}
      {blankCount > 0 && (
        <button type="button" className="c4-qc-blank" data-on={blank ? "1" : "0"} aria-pressed={blank} onClick={() => { setBlank((value) => !value); setSelected(""); }}>
          <span>{v4("qcBlank")}</span>
          <span className="c4-meta">{blankCount}</span>
        </button>
      )}
      <div className="c4-row" role="group" aria-label={v4("qcShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("qcShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("qcHidden")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("qcTitle")}>
        <button type="button" className="c4-chip" data-on={!currency && !blank ? "1" : "0"} aria-pressed={!currency && !blank} onClick={() => { setSelected(""); setBlank(false); }}>{v4("qcAll")}</button>
        {chips.map((item) => {
          const count = lines.find((line) => line.currency === item)?.count || 0;
          return (
            <span key={item} className="c4-qc-pair" data-currency={item}>
              <button type="button" className="c4-chip" data-on={currency === item ? "1" : "0"} aria-pressed={currency === item} onClick={() => { setBlank(false); setSelected(currency === item ? "" : item); }}>{item} {count}</button>
              <button type="button" className="c4-btn" onClick={() => store(toggleCurrency(hiddenCurrencies, item, present), showHidden ? "" : item)}>{showHidden ? v4("qcShow") : v4("qcHide")}</button>
            </span>
          );
        })}
      </div>
      <label className="c4-lab">
        <span>{v4("qcSearch")}</span>
        <input className="c4-field" aria-label={v4("qcSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c4-pay-empty">{v4("qcEmpty")}</p>}
      <ul className="c4-qc-rows">
        {shown.map((row) => {
          const code = currencyCode(row.currency);
          return (
            <li key={row.id} data-currency={code || "blank"}>
              <p>{row.label || row.id}</p>
              <p className="c4-meta">{code || v4("qcBlank")}</p>
              {row.status ? <p className="c4-meta">{row.status}</p> : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
