"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import {
  ROOM_KEY,
  TRADE_SIDE_KEY,
  activeSide,
  addNote,
  namedSides,
  readHiddenSides,
  readNotes,
  resetNotes,
  setNoteHidden,
  sideLines,
  sideText,
  toggleNotePin,
  toggleSide,
  visibleNotes,
  visibleSides,
  visibleTrades,
  type Note,
  type SideRow,
} from "@/lib/crmv4/round125";
import { crmv4Href } from "@/lib/crmv4/sections";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

type TradeRow = {
  id: string;
  side?: string | null;
  symbol?: string | null;
  traderName?: string | null;
  user?: { name?: string | null; email?: string | null } | null;
};

type GlanceRow = SideRow & { id: string; kind: "order" | "position" };

function tradeLabel(row: TradeRow): string {
  return String(row.traderName || row.user?.name || row.user?.email || row.symbol || row.id || "").trim();
}

export function RoomNotes({ v4 }: { v4: V4 }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [text, setText] = useState("");
  const [floor, setFloor] = useState("");
  const [query, setQuery] = useState("");
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const next = readNotes(readJson(ROOM_KEY, []));
    setNotes(next);
    writeJson(ROOM_KEY, next);
  }, []);
  const shown = visibleNotes(notes, hidden, query);

  function store(next: Note[]) {
    setNotes(next);
    writeJson(ROOM_KEY, next);
  }

  return (
    <section className="c4-room" aria-label={v4("rmnTitle")} data-room="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-rmn-logo" data-logo="mono">{v4("rmnLogo")}</p>
          <p className="c4-pay-kicker">{v4("rmnSub")}</p>
          <h2 className="c4-title">{v4("rmnTitle")}</h2>
        </div>
        <p className="c4-meta">{shown.length}</p>
      </header>
      <p className="c4-meta">{v4("rmnHint")}</p>
      <p className="c4-meta">{v4("rmnLocal")}</p>
      <p className="c4-meta">{v4("rmnBlank")}</p>
      <p className="c4-meta">{v4("rmnFloorBlank")}</p>
      <form className="c4-row" onSubmit={(event) => {
        event.preventDefault();
        const next = addNote(notes, { id: `rmn-${notes.length}-${text.trim().slice(0, 8) || "note"}`, text, floor });
        if (next.length === notes.length) return;
        store(next);
        setText("");
        setFloor("");
      }}>
        <label className="c4-lab">
          <span>{v4("rmnText")}</span>
          <input className="c4-field" aria-label={v4("rmnText")} value={text} maxLength={120} onChange={(event) => setText(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("rmnFloor")}</span>
          <input className="c4-field" aria-label={v4("rmnFloor")} value={floor} maxLength={40} onChange={(event) => setFloor(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn">{v4("rmnAdd")}</button>
        <button type="button" className="c4-btn" onClick={() => store(resetNotes())}>{v4("rmnReset")}</button>
      </form>
      <label className="c4-lab">
        <span>{v4("rmnSearch")}</span>
        <input className="c4-field" aria-label={v4("rmnSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c4-row" role="group" aria-label={v4("rmnTitle")}>
        <button type="button" className="c4-chip" data-on={hidden ? "0" : "1"} aria-pressed={!hidden} onClick={() => setHidden(false)}>{v4("rmnOpen")}</button>
        <button type="button" className="c4-chip" data-on={hidden ? "1" : "0"} aria-pressed={hidden} onClick={() => setHidden(true)}>{v4("rmnHidden")}</button>
      </div>
      {!shown.length && <p className="c4-pay-empty">{v4("rmnEmpty")}</p>}
      <ul className="c4-rmn-rows">
        {shown.map((note) => (
          <li key={note.id} data-pinned={note.pinned ? "1" : "0"}>
            <p>{note.text}</p>
            {note.floor ? <p className="c4-meta">{note.floor}</p> : null}
            <div className="c4-row">
              <button type="button" className="c4-btn" onClick={() => store(toggleNotePin(notes, note.id))}>{note.pinned ? v4("rmnUnpin") : v4("rmnPin")}</button>
              <button type="button" className="c4-btn" onClick={() => store(setNoteHidden(notes, note.id, !note.hidden))}>{note.hidden ? v4("rmnShow") : v4("rmnHide")}</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function TradeSides({ base, v4 }: { base: string; v4: V4 }) {
  const orders = useJson<{ orders?: TradeRow[] }>("/api/admin/positions?tab=orders&take=40");
  const positions = useJson<{ positions?: TradeRow[] }>("/api/admin/positions?status=CLOSED&take=40");
  const [hiddenSides, setHiddenSides] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [blank, setBlank] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [query, setQuery] = useState("");
  const rows: GlanceRow[] = [
    ...(orders.data?.orders || []).map((row) => ({
      id: `order:${String(row.id || "")}`,
      label: tradeLabel(row),
      side: row.side,
      kind: "order" as const,
    })),
    ...(positions.data?.positions || []).map((row) => ({
      id: `position:${String(row.id || "")}`,
      label: tradeLabel(row),
      side: row.side,
      kind: "position" as const,
    })),
  ].filter((row) => row.id !== "order:" && row.id !== "position:");
  const lines = sideLines(rows);
  const present = namedSides(rows);
  const presentKey = present.join("\n");
  const blankCount = lines.find((line) => !line.side)?.count || 0;
  const loading = (orders.loading && !orders.data) || (positions.loading && !positions.data);
  const failed = Boolean(orders.error || positions.error);
  useEffect(() => {
    if (loading || (failed && !rows.length)) return;
    const next = readHiddenSides(readJson(TRADE_SIDE_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHiddenSides(next);
    writeJson(TRADE_SIDE_KEY, next);
  }, [loading, failed, presentKey, rows.length]);
  const chips = visibleSides(present, hiddenSides, showHidden);
  const side = activeSide(selected, chips);
  const shown = visibleTrades(rows, side, blank, query);

  function store(next: string[], clear: string) {
    setHiddenSides(next);
    writeJson(TRADE_SIDE_KEY, next);
    if (clear && activeSide(selected, [clear])) setSelected("");
  }

  return (
    <section className="c4-trade-side" aria-label={v4("sdgTitle")} data-trade-side="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-pay-kicker">{v4("sdgSub")}</p>
          <h2 className="c4-title">{v4("sdgTitle")}</h2>
        </div>
        <p className="c4-meta">{v4("sdgRows")} {rows.length}</p>
      </header>
      <p className="c4-meta">{v4("sdgHint")}</p>
      <p className="c4-meta">{v4("sdgLocal")}</p>
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "blotter")}>{v4("sdgBoard")}</Link>
      </p>
      {loading && !rows.length && <p className="c4-meta">{v4("sdgLoading")}</p>}
      {failed && !rows.length && <p className="c4-meta">{v4("sdgFailed")}</p>}
      {!loading && !failed && !rows.length && <p className="c4-pay-empty">{v4("sdgNone")}</p>}
      {blankCount > 0 && (
        <button type="button" className="c4-sdg-blank" data-on={blank ? "1" : "0"} aria-pressed={blank} onClick={() => { setBlank((value) => !value); setSelected(""); }}>
          <span>{v4("sdgBlank")}</span>
          <span className="c4-meta">{blankCount}</span>
        </button>
      )}
      <div className="c4-row" role="group" aria-label={v4("sdgShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("sdgShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("sdgHidden")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("sdgTitle")}>
        <button type="button" className="c4-chip" data-on={!side && !blank ? "1" : "0"} aria-pressed={!side && !blank} onClick={() => { setSelected(""); setBlank(false); }}>{v4("sdgAll")}</button>
        {chips.map((item) => {
          const count = lines.find((line) => line.side === item)?.count || 0;
          return (
            <span key={item} className="c4-sdg-pair" data-side={item}>
              <button type="button" className="c4-chip" data-on={side === item ? "1" : "0"} aria-pressed={side === item} onClick={() => { setBlank(false); setSelected(side === item ? "" : item); }}>{item} {count}</button>
              <button type="button" className="c4-btn" onClick={() => store(toggleSide(hiddenSides, item, present), showHidden ? "" : item)}>{showHidden ? v4("sdgShow") : v4("sdgHide")}</button>
            </span>
          );
        })}
      </div>
      <label className="c4-lab">
        <span>{v4("sdgSearch")}</span>
        <input className="c4-field" aria-label={v4("sdgSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c4-pay-empty">{v4("sdgEmpty")}</p>}
      <ul className="c4-sdg-rows">
        {shown.map((row) => {
          const name = sideText(row.side);
          return (
            <li key={row.id} data-side={name || "blank"} data-kind={row.kind}>
              <p>{row.label || row.id}</p>
              <p className="c4-meta">{name || v4("sdgBlank")}</p>
              <p className="c4-meta">{row.kind === "position" ? v4("sdgPosition") : v4("sdgOrder")}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
