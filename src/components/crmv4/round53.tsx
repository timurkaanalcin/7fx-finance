"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import {
  PAD_KEY,
  addNote,
  currencyLines,
  currencyMap,
  filterBlotter,
  isFill,
  isOpenOrder,
  readNotes,
  removeNote,
  rowPrice,
  sideLabel,
  toggleArchive,
  togglePin,
  visibleNotes,
  type BlotterRow,
  type DeskNote,
  type PadCustomer,
  type ProfitRow,
} from "@/lib/crmv4/round53";
import { crmv4Href } from "@/lib/crmv4/sections";
import { money, useJson, type Tx } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

function sideText(side: string, v4: V4): string {
  if (side === "BUY") return v4("blBuy");
  if (side === "SELL") return v4("blSell");
  return side || "—";
}

function statusText(row: BlotterRow, v4: V4): string {
  if (isFill(row)) return v4("blFills");
  if (isOpenOrder(row)) return v4("blOpen");
  return String(row.status || "—");
}

export function TradeBlotter({ base, v4, locale, tx }: { base: string; v4: V4; locale: string; tx: Tx }) {
  const orders = useJson<{ orders?: BlotterRow[] }>("/api/admin/positions?tab=orders&take=80");
  const closed = useJson<{ positions?: ProfitRow[] }>("/api/admin/positions?status=CLOSED&take=80");
  const people = useJson<{ users?: { id: string; currency?: string | null; account?: { currency?: string | null } | null }[] }>("/api/admin/users?take=80&meta=0&role=TRADER");
  const [kind, setKind] = useState<"" | "fill" | "open" | "all">("");
  const [query, setQuery] = useState("");
  const loaded = orders.data?.orders || [];
  const shown = filterBlotter(loaded, kind, query);
  const lines = currencyLines(closed.data?.positions || [], currencyMap(people.data?.users || []));
  const loading = (orders.loading && !loaded.length) || (closed.loading && !closed.data) || (people.loading && !people.data);
  const failed = orders.error || closed.error || people.error;

  return (
    <section className="c4-blotter" aria-label={v4("blTitle")} data-blotter="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-pay-kicker">{v4("blSub")}</p>
          <h2 className="c4-title">{v4("blTitle")}</h2>
        </div>
        <p className="c4-meta">{v4("blCount")} {shown.length}</p>
      </header>
      <p className="c4-meta">{v4("blHint")}</p>
      <label className="c4-lab">
        <span>{v4("blSearch")}</span>
        <input className="c4-field" aria-label={v4("blSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c4-row" role="group" aria-label={v4("blBoth")}>
        <button type="button" className="c4-chip" data-on={kind === "" ? "1" : "0"} aria-pressed={kind === ""} onClick={() => setKind("")}>{v4("blBoth")}</button>
        <button type="button" className="c4-chip" data-on={kind === "fill" ? "1" : "0"} aria-pressed={kind === "fill"} onClick={() => setKind("fill")}>{v4("blFills")}</button>
        <button type="button" className="c4-chip" data-on={kind === "open" ? "1" : "0"} aria-pressed={kind === "open"} onClick={() => setKind("open")}>{v4("blOpen")}</button>
        <button type="button" className="c4-chip" data-on={kind === "all" ? "1" : "0"} aria-pressed={kind === "all"} onClick={() => setKind("all")}>{v4("blAll")}</button>
      </div>
      <div className="c4-blotter-pnl" aria-label={v4("blPnl")}>
        <p className="c4-meta">{v4("blPnl")}</p>
        {!closed.loading && !lines.length && <p className="c4-pay-empty">{v4("blPnlEmpty")}</p>}
        <ul>
          {lines.map((line) => (
            <li key={line.currency || "none"} data-currency={line.currency || "none"}>
              <span>{line.currency || v4("blNoCurrency")}</span>
              <strong>{line.currency.length === 3 ? money(line.profit, line.currency, locale) : line.profit.toFixed(2)}</strong>
              <span className="c4-meta">{line.count}</span>
            </li>
          ))}
        </ul>
      </div>
      {loading && !loaded.length && <p className="c4-meta">{v4("blLoading")}</p>}
      {failed && <p className="c4-meta">{v4("blFailed")} {tx("failed")}</p>}
      {!orders.loading && !orders.error && !loaded.length && <p className="c4-pay-empty">{v4("blNone")}</p>}
      {!orders.loading && !orders.error && loaded.length > 0 && !shown.length && <p className="c4-pay-empty">{v4("blEmpty")}</p>}
      <div className="c4-blotter-wrap">
        <table className="c4-blotter-table">
          <thead>
            <tr>
              <th scope="col">{v4("blSymbol")}</th>
              <th scope="col">{v4("blSide")}</th>
              <th scope="col">{v4("blType")}</th>
              <th scope="col">{v4("blStatus")}</th>
              <th scope="col">{v4("blVolume")}</th>
              <th scope="col">{v4("blPrice")}</th>
              <th scope="col">{v4("blCustomer")}</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((row) => {
              const side = sideLabel(row.side);
              return (
                <tr key={row.id}>
                  <td>{row.symbol || "—"}</td>
                  <td><span className="c4-side" data-side={side || "none"}>{sideText(side, v4)}</span></td>
                  <td>{row.type || "—"}</td>
                  <td>{statusText(row, v4)}</td>
                  <td>{row.volume ?? "—"}</td>
                  <td>{rowPrice(row) || "—"}</td>
                  <td>
                    {row.userId ? (
                      <Link href={crmv4Href(base, `customers/${row.userId}`)}>{row.traderName || v4("blOpenCustomer")}</Link>
                    ) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function DeskPad({ base, v4, tx }: { base: string; v4: V4; tx: Tx }) {
  const data = useJson<{ users?: PadCustomer[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [notes, setNotes] = useState<DeskNote[]>([]);
  const [query, setQuery] = useState("");
  const [archived, setArchived] = useState(false);
  const [person, setPerson] = useState("");
  const [draft, setDraft] = useState("");
  useEffect(() => { setNotes(readNotes(readJson(PAD_KEY, []))); }, []);
  const loaded = data.data?.users || [];
  const shown = visibleNotes(notes, loaded, query, archived);
  const names = new Map(loaded.map((row) => [row.id, row.name || row.email || row.id]));

  function store(next: DeskNote[]) {
    setNotes(next);
    writeJson(PAD_KEY, next);
  }

  return (
    <section className="c4-desk-pad" aria-label={v4("pdTitle")} data-desk-pad="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-pay-kicker">{v4("pdSub")}</p>
          <h2 className="c4-title">{v4("pdTitle")}</h2>
        </div>
        <p className="c4-meta">{shown.length}</p>
      </header>
      <p className="c4-meta">{v4("pdHint")}</p>
      <label className="c4-lab">
        <span>{v4("pdSearch")}</span>
        <input className="c4-field" aria-label={v4("pdSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c4-row" role="group" aria-label={v4("pdActive")}>
        <button type="button" className="c4-chip" data-on={archived ? "0" : "1"} aria-pressed={!archived} onClick={() => setArchived(false)}>{v4("pdActive")}</button>
        <button type="button" className="c4-chip" data-on={archived ? "1" : "0"} aria-pressed={archived} onClick={() => setArchived(true)}>{v4("pdArchived")}</button>
      </div>
      <form className="c4-row" onSubmit={(event) => {
        event.preventDefault();
        const next = addNote(notes, { id: `pad-${Date.now()}`, customerId: person, body: draft, at: new Date().toISOString() });
        if (next.length === notes.length && next.every((note, index) => note.id === notes[index]?.id)) return;
        store(next);
        setDraft("");
      }}>
        <label className="c4-lab">
          <span>{v4("pdCustomer")}</span>
          <select className="c4-select" aria-label={v4("pdCustomer")} value={person} onChange={(event) => setPerson(event.target.value)}>
            <option value="">{v4("pdCustomer")}</option>
            {loaded.map((row) => <option key={row.id} value={row.id}>{row.name || row.email || row.id}</option>)}
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("pdBody")}</span>
          <input className="c4-field" aria-label={v4("pdBody")} value={draft} onChange={(event) => setDraft(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn">{v4("pdAdd")}</button>
        <span className="c4-meta">{v4("pdLocal")}</span>
      </form>
      {data.loading && !loaded.length && <p className="c4-meta">{v4("pdLoading")}</p>}
      {data.error && <p className="c4-meta">{v4("pdFailed")} {tx("failed")}</p>}
      {!data.loading && !data.error && !loaded.length && <p className="c4-pay-empty">{v4("pdNoCustomers")}</p>}
      {!data.loading && !data.error && loaded.length > 0 && !shown.length && !query && !archived && <p className="c4-pay-empty">{v4("pdNone")}</p>}
      {!data.loading && !data.error && loaded.length > 0 && !shown.length && (query || archived) && <p className="c4-pay-empty">{v4("pdEmpty")}</p>}
      <ul className="c4-pad-notes">
        {shown.map((note) => (
          <li key={note.id} className="c4-pad-note" data-pinned={note.pinned ? "1" : "0"} data-archived={note.archived ? "1" : "0"}>
            <p>{note.body}</p>
            <p className="c4-meta">{names.get(note.customerId) || "—"}</p>
            <div className="c4-row">
              <button type="button" className="c4-btn" aria-pressed={note.pinned} onClick={() => store(togglePin(notes, note.id))}>{note.pinned ? v4("pdUnpin") : v4("pdPin")}</button>
              <button type="button" className="c4-btn" onClick={() => store(toggleArchive(notes, note.id))}>{note.archived ? v4("pdRestore") : v4("pdArchive")}</button>
              <button type="button" className="c4-btn" onClick={() => store(removeNote(notes, note.id))}>{v4("pdRemove")}</button>
              <Link className="c4-btn" href={crmv4Href(base, `customers/${note.customerId}`)}>{v4("pdOpen")}</Link>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
