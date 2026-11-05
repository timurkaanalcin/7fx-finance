"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readJson, writeJson } from "@/lib/crmv3/bridge";
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
} from "@/lib/crmv3/confroom";
import { crmv3Href } from "@/lib/crmv3/sections";
import { useV3 } from "./store";
import { useJson } from "../kit";

type TradeRow = {
  id: string;
  side?: string | null;
  symbol?: string | null;
  traderName?: string | null;
  user?: { name?: string | null; email?: string | null } | null;
};

type GlanceRow = SideRow & { id: string; kind: "order" | "closed" };

function tradeLabel(row: TradeRow): string {
  return String(row.traderName || row.user?.name || row.user?.email || row.symbol || row.id || "").trim();
}

export function RoomNotes() {
  const v3 = useV3();
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
    <section className="c3-room" aria-label={v3("rmnTitle")} data-room="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-rmn-logo" data-logo="mono">{v3("rmnLogo")}</p>
          <p className="c3-pay-kicker">{v3("rmnSub")}</p>
          <h2 className="c3-title">{v3("rmnTitle")}</h2>
        </div>
        <p className="c3-meta">{shown.length}</p>
      </header>
      <p className="c3-meta">{v3("rmnHint")}</p>
      <p className="c3-meta">{v3("rmnLocal")}</p>
      <p className="c3-meta">{v3("rmnBlank")}</p>
      <p className="c3-meta">{v3("rmnFloorBlank")}</p>
      <form className="c3-row" onSubmit={(event) => {
        event.preventDefault();
        const next = addNote(notes, { id: `rmn-${notes.length}-${text.trim().slice(0, 8) || "note"}`, text, floor });
        if (next.length === notes.length) return;
        store(next);
        setText("");
        setFloor("");
      }}>
        <label className="c3-lab">
          <span>{v3("rmnText")}</span>
          <input className="c3-field" aria-label={v3("rmnText")} value={text} maxLength={120} onChange={(event) => setText(event.target.value)} />
        </label>
        <label className="c3-lab">
          <span>{v3("rmnFloor")}</span>
          <input className="c3-field" aria-label={v3("rmnFloor")} value={floor} maxLength={40} onChange={(event) => setFloor(event.target.value)} />
        </label>
        <button type="submit" className="c3-btn">{v3("rmnAdd")}</button>
        <button type="button" className="c3-btn" onClick={() => store(resetNotes())}>{v3("rmnReset")}</button>
      </form>
      <label className="c3-lab">
        <span>{v3("rmnSearch")}</span>
        <input className="c3-field" aria-label={v3("rmnSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c3-row" role="group" aria-label={v3("rmnTitle")}>
        <button type="button" className="c3-chip" data-on={hidden ? "0" : "1"} aria-pressed={!hidden} onClick={() => setHidden(false)}>{v3("rmnOpen")}</button>
        <button type="button" className="c3-chip" data-on={hidden ? "1" : "0"} aria-pressed={hidden} onClick={() => setHidden(true)}>{v3("rmnHidden")}</button>
      </div>
      {!shown.length && <p className="c3-pay-empty">{v3("rmnEmpty")}</p>}
      <ul className="c3-rmn-rows">
        {shown.map((note) => (
          <li key={note.id} data-pinned={note.pinned ? "1" : "0"}>
            <p>{note.text}</p>
            {note.floor ? <p className="c3-meta">{note.floor}</p> : null}
            <div className="c3-row">
              <button type="button" className="c3-btn" onClick={() => store(toggleNotePin(notes, note.id))}>{note.pinned ? v3("rmnUnpin") : v3("rmnPin")}</button>
              <button type="button" className="c3-btn" onClick={() => store(setNoteHidden(notes, note.id, !note.hidden))}>{note.hidden ? v3("rmnShow") : v3("rmnHide")}</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function TradeSides({ base }: { base: string }) {
  const v3 = useV3();
  const orders = useJson<{ orders?: TradeRow[] }>("/api/admin/positions?tab=orders&take=40");
  const closed = useJson<{ positions?: TradeRow[] }>("/api/admin/positions?status=CLOSED&take=40");
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
    ...(closed.data?.positions || []).map((row) => ({
      id: `closed:${String(row.id || "")}`,
      label: tradeLabel(row),
      side: row.side,
      kind: "closed" as const,
    })),
  ].filter((row) => row.id !== "order:" && row.id !== "closed:");
  const lines = sideLines(rows);
  const present = namedSides(rows);
  const presentKey = present.join("\n");
  const blankCount = lines.find((line) => !line.side)?.count || 0;
  const loading = (orders.loading && !orders.data) || (closed.loading && !closed.data);
  const failed = Boolean(orders.error || closed.error);
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
    <section className="c3-side-sg" aria-label={v3("sdgTitle")} data-trade-side="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-pay-kicker">{v3("sdgSub")}</p>
          <h2 className="c3-title">{v3("sdgTitle")}</h2>
        </div>
        <p className="c3-meta">{v3("sdgRows")} {rows.length}</p>
      </header>
      <p className="c3-meta">{v3("sdgHint")}</p>
      <p className="c3-meta">{v3("sdgLocal")}</p>
      <p className="c3-row">
        <Link className="c3-btn" href={crmv3Href(base, "blotter")}>{v3("sdgBoard")}</Link>
      </p>
      {loading && !rows.length && <p className="c3-meta">{v3("sdgLoading")}</p>}
      {failed && !rows.length && <p className="c3-meta">{v3("sdgFailed")}</p>}
      {!loading && !failed && !rows.length && <p className="c3-pay-empty">{v3("sdgNone")}</p>}
      {blankCount > 0 && (
        <button type="button" className="c3-sdg-blank" data-on={blank ? "1" : "0"} aria-pressed={blank} onClick={() => { setBlank((value) => !value); setSelected(""); }}>
          <span>{v3("sdgBlank")}</span>
          <span className="c3-meta">{blankCount}</span>
        </button>
      )}
      <div className="c3-row" role="group" aria-label={v3("sdgShown")}>
        <button type="button" className="c3-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v3("sdgShown")}</button>
        <button type="button" className="c3-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v3("sdgHidden")}</button>
      </div>
      <div className="c3-row" role="group" aria-label={v3("sdgTitle")}>
        <button type="button" className="c3-chip" data-on={!side && !blank ? "1" : "0"} aria-pressed={!side && !blank} onClick={() => { setSelected(""); setBlank(false); }}>{v3("sdgAll")}</button>
        {chips.map((item) => {
          const count = lines.find((line) => line.side === item)?.count || 0;
          return (
            <span key={item} className="c3-sdg-pair" data-side={item}>
              <button type="button" className="c3-chip" data-on={side === item ? "1" : "0"} aria-pressed={side === item} onClick={() => { setBlank(false); setSelected(side === item ? "" : item); }}>{item} {count}</button>
              <button type="button" className="c3-btn" onClick={() => store(toggleSide(hiddenSides, item, present), showHidden ? "" : item)}>{showHidden ? v3("sdgShow") : v3("sdgHide")}</button>
            </span>
          );
        })}
      </div>
      <label className="c3-lab">
        <span>{v3("sdgSearch")}</span>
        <input className="c3-field" aria-label={v3("sdgSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c3-pay-empty">{v3("sdgEmpty")}</p>}
      <ul className="c3-sdg-rows">
        {shown.map((row) => {
          const name = sideText(row.side);
          return (
            <li key={row.id} data-side={name || "blank"} data-kind={row.kind}>
              <p>{row.label || row.id}</p>
              <p className="c3-meta">{name || v3("sdgBlank")}</p>
              <p className="c3-meta">{row.kind === "closed" ? v3("sdgPosition") : v3("sdgOrder")}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
