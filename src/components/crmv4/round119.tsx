"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import {
  LOCKER_KEY,
  TRADE_SYMBOL_KEY,
  activeSymbol,
  addNote,
  namedSymbols,
  readHiddenSymbols,
  readNotes,
  resetNotes,
  setNoteHidden,
  symbolLines,
  symbolText,
  toggleNotePin,
  toggleSymbol,
  visibleNotes,
  visibleSymbols,
  visibleTrades,
  type Note,
  type SymbolRow,
} from "@/lib/crmv4/round119";
import { crmv4Href } from "@/lib/crmv4/sections";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

type OrderRow = {
  id: string;
  symbol?: string | null;
  traderName?: string | null;
  user?: { name?: string | null; email?: string | null } | null;
};

type PositionRow = OrderRow;

type GlanceRow = SymbolRow & { id: string; kind: "order" | "position" };

export function LockerNotes({ v4 }: { v4: V4 }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [text, setText] = useState("");
  const [tag, setTag] = useState("");
  const [query, setQuery] = useState("");
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const next = readNotes(readJson(LOCKER_KEY, []));
    setNotes(next);
    writeJson(LOCKER_KEY, next);
  }, []);
  const shown = visibleNotes(notes, hidden, query);

  function store(next: Note[]) {
    setNotes(next);
    writeJson(LOCKER_KEY, next);
  }

  return (
    <section className="c4-locker" aria-label={v4("lokTitle")} data-locker="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-lok-logo" data-logo="mono">{v4("lokLogo")}</p>
          <p className="c4-pay-kicker">{v4("lokSub")}</p>
          <h2 className="c4-title">{v4("lokTitle")}</h2>
        </div>
        <p className="c4-meta">{shown.length}</p>
      </header>
      <p className="c4-meta">{v4("lokHint")}</p>
      <p className="c4-meta">{v4("lokLocal")}</p>
      <p className="c4-meta">{v4("lokBlank")}</p>
      <p className="c4-meta">{v4("lokTagBlank")}</p>
      <form className="c4-row" onSubmit={(event) => {
        event.preventDefault();
        const next = addNote(notes, { id: `lok-${notes.length}-${text.trim().slice(0, 8) || "note"}`, text, tag });
        if (next.length === notes.length) return;
        store(next);
        setText("");
        setTag("");
      }}>
        <label className="c4-lab">
          <span>{v4("lokText")}</span>
          <input className="c4-field" aria-label={v4("lokText")} value={text} maxLength={120} onChange={(event) => setText(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("lokTag")}</span>
          <input className="c4-field" aria-label={v4("lokTag")} value={tag} maxLength={40} onChange={(event) => setTag(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn">{v4("lokAdd")}</button>
        <button type="button" className="c4-btn" onClick={() => store(resetNotes())}>{v4("lokReset")}</button>
      </form>
      <label className="c4-lab">
        <span>{v4("lokSearch")}</span>
        <input className="c4-field" aria-label={v4("lokSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c4-row" role="group" aria-label={v4("lokTitle")}>
        <button type="button" className="c4-chip" data-on={hidden ? "0" : "1"} aria-pressed={!hidden} onClick={() => setHidden(false)}>{v4("lokOpen")}</button>
        <button type="button" className="c4-chip" data-on={hidden ? "1" : "0"} aria-pressed={hidden} onClick={() => setHidden(true)}>{v4("lokHidden")}</button>
      </div>
      {!shown.length && <p className="c4-pay-empty">{v4("lokEmpty")}</p>}
      <ul className="c4-lok-rows">
        {shown.map((note) => (
          <li key={note.id} data-pinned={note.pinned ? "1" : "0"}>
            <p>{note.text}</p>
            {note.tag ? <p className="c4-meta">{note.tag}</p> : null}
            <div className="c4-row">
              <button type="button" className="c4-btn" onClick={() => store(toggleNotePin(notes, note.id))}>{note.pinned ? v4("lokUnpin") : v4("lokPin")}</button>
              <button type="button" className="c4-btn" onClick={() => store(setNoteHidden(notes, note.id, !note.hidden))}>{note.hidden ? v4("lokShow") : v4("lokHide")}</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function tradeLabel(row: OrderRow): string {
  return String(row.traderName || row.user?.name || row.user?.email || row.id || "").trim();
}

export function TradeSymbols({ base, v4 }: { base: string; v4: V4 }) {
  const orders = useJson<{ orders?: OrderRow[] }>("/api/admin/positions?tab=orders&take=40");
  const positions = useJson<{ positions?: PositionRow[] }>("/api/admin/positions?status=CLOSED&take=40");
  const [hiddenSymbols, setHiddenSymbols] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [blank, setBlank] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [query, setQuery] = useState("");
  const rows: GlanceRow[] = [
    ...(orders.data?.orders || []).map((row) => ({
      id: `order:${String(row.id || "")}`,
      label: tradeLabel(row),
      symbol: row.symbol,
      kind: "order" as const,
    })),
    ...(positions.data?.positions || []).map((row) => ({
      id: `position:${String(row.id || "")}`,
      label: tradeLabel(row),
      symbol: row.symbol,
      kind: "position" as const,
    })),
  ].filter((row) => row.id !== "order:" && row.id !== "position:");
  const lines = symbolLines(rows);
  const present = namedSymbols(rows);
  const presentKey = present.join("\n");
  const blankCount = lines.find((line) => !line.symbol)?.count || 0;
  const loading = (orders.loading && !orders.data) || (positions.loading && !positions.data);
  const failed = Boolean(orders.error || positions.error);
  useEffect(() => {
    if (loading || (failed && !rows.length)) return;
    const next = readHiddenSymbols(readJson(TRADE_SYMBOL_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHiddenSymbols(next);
    writeJson(TRADE_SYMBOL_KEY, next);
  }, [loading, failed, presentKey, rows.length]);
  const chips = visibleSymbols(present, hiddenSymbols, showHidden);
  const symbol = activeSymbol(selected, chips);
  const shown = visibleTrades(rows, symbol, blank, query);

  function store(next: string[], clear: string) {
    setHiddenSymbols(next);
    writeJson(TRADE_SYMBOL_KEY, next);
    if (clear && activeSymbol(selected, [clear])) setSelected("");
  }

  return (
    <section className="c4-trade-sym" aria-label={v4("tsyTitle")} data-trade-sym="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-pay-kicker">{v4("tsySub")}</p>
          <h2 className="c4-title">{v4("tsyTitle")}</h2>
        </div>
        <p className="c4-meta">{v4("tsyRows")} {rows.length}</p>
      </header>
      <p className="c4-meta">{v4("tsyHint")}</p>
      <p className="c4-meta">{v4("tsyLocal")}</p>
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "blotter")}>{v4("tsyBoard")}</Link>
      </p>
      {loading && !rows.length && <p className="c4-meta">{v4("tsyLoading")}</p>}
      {failed && !rows.length && <p className="c4-meta">{v4("tsyFailed")}</p>}
      {!loading && !failed && !rows.length && <p className="c4-pay-empty">{v4("tsyNone")}</p>}
      {blankCount > 0 && (
        <button type="button" className="c4-tsy-blank" data-on={blank ? "1" : "0"} aria-pressed={blank} onClick={() => { setBlank((value) => !value); setSelected(""); }}>
          <span>{v4("tsyBlank")}</span>
          <span className="c4-meta">{blankCount}</span>
        </button>
      )}
      <div className="c4-row" role="group" aria-label={v4("tsyShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("tsyShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("tsyHidden")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("tsyTitle")}>
        <button type="button" className="c4-chip" data-on={!symbol && !blank ? "1" : "0"} aria-pressed={!symbol && !blank} onClick={() => { setSelected(""); setBlank(false); }}>{v4("tsyAll")}</button>
        {chips.map((item) => {
          const count = lines.find((line) => line.symbol === item)?.count || 0;
          return (
            <span key={item} className="c4-tsy-pair" data-symbol={item}>
              <button type="button" className="c4-chip" data-on={symbol === item ? "1" : "0"} aria-pressed={symbol === item} onClick={() => { setBlank(false); setSelected(symbol === item ? "" : item); }}>{item} {count}</button>
              <button type="button" className="c4-btn" onClick={() => store(toggleSymbol(hiddenSymbols, item, present), showHidden ? "" : item)}>{showHidden ? v4("tsyShow") : v4("tsyHide")}</button>
            </span>
          );
        })}
      </div>
      <label className="c4-lab">
        <span>{v4("tsySearch")}</span>
        <input className="c4-field" aria-label={v4("tsySearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c4-pay-empty">{v4("tsyEmpty")}</p>}
      <ul className="c4-tsy-rows">
        {shown.map((row) => {
          const name = symbolText(row.symbol);
          return (
            <li key={row.id} data-symbol={name || "blank"} data-kind={row.kind}>
              <p>{row.label || row.id}</p>
              <p className="c4-meta">{name || v4("tsyBlank")}</p>
              <p className="c4-meta">{row.kind === "position" ? v4("tsyPosition") : v4("tsyOrder")}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
