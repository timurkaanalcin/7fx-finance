"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CrmV3CopyKey } from "@/lib/crmv3/copy";
import { readJson, writeJson } from "@/lib/crmv3/bridge";
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
} from "@/lib/crmv3/blotter";
import { crmv3Href } from "@/lib/crmv3/sections";
import { useJson, type Tx } from "../kit";
import { useV3 } from "./store";

function sideText(side: string, v3: (key: CrmV3CopyKey) => string): string {
  if (side === "BUY") return v3("blBuy");
  if (side === "SELL") return v3("blSell");
  return side || "—";
}

function statusText(row: BlotterRow, v3: (key: CrmV3CopyKey) => string): string {
  if (isFill(row)) return v3("blFills");
  if (isOpenOrder(row)) return v3("blOpen");
  return String(row.status || "—");
}

export function TradeBlotter({ base, locale, tx }: { base: string; locale: string; tx: Tx }) {
  const v3 = useV3();
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
    <section className="c3-blotter" aria-label={v3("blTitle")} data-blotter="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("blSub")}</p>
          <h2 className="c3-title">{v3("blTitle")}</h2>
        </div>
        <p className="c3-muted">{v3("blCount")} {shown.length}</p>
      </header>
      <p className="c3-muted">{v3("blHint")}</p>
      <label className="c3-lab">
        <span>{v3("blSearch")}</span>
        <input className="c3-field" aria-label={v3("blSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c3-row" role="group" aria-label={v3("blBoth")}>
        <button type="button" className="c3-chip" data-on={kind === "" ? "1" : "0"} aria-pressed={kind === ""} onClick={() => setKind("")}>{v3("blBoth")}</button>
        <button type="button" className="c3-chip" data-on={kind === "fill" ? "1" : "0"} aria-pressed={kind === "fill"} onClick={() => setKind("fill")}>{v3("blFills")}</button>
        <button type="button" className="c3-chip" data-on={kind === "open" ? "1" : "0"} aria-pressed={kind === "open"} onClick={() => setKind("open")}>{v3("blOpen")}</button>
        <button type="button" className="c3-chip" data-on={kind === "all" ? "1" : "0"} aria-pressed={kind === "all"} onClick={() => setKind("all")}>{v3("blAll")}</button>
      </div>
      <div className="c3-blotter-pnl" aria-label={v3("blPnl")}>
        <p className="c3-muted">{v3("blPnl")}</p>
        {!closed.loading && !lines.length && <p className="c3-empty">{v3("blPnlEmpty")}</p>}
        <ul>
          {lines.map((line) => (
            <li key={line.currency || "none"} data-currency={line.currency || "none"}>
              <span>{line.currency || v3("blNoCurrency")}</span>
              <strong>{line.profit.toLocaleString(locale || "en", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
              <span className="c3-muted">{line.count}</span>
            </li>
          ))}
        </ul>
      </div>
      {loading && !loaded.length && <p className="c3-muted">{v3("blLoading")}</p>}
      {failed && <p className="c3-muted">{v3("blFailed")} {tx("failed")}</p>}
      {!orders.loading && !orders.error && !loaded.length && <p className="c3-empty">{v3("blNone")}</p>}
      {!orders.loading && !orders.error && loaded.length > 0 && !shown.length && <p className="c3-empty">{v3("blEmpty")}</p>}
      <div className="c3-blotter-wrap">
        <table className="c3-blotter-table">
          <thead>
            <tr>
              <th scope="col">{v3("blSymbol")}</th>
              <th scope="col">{v3("blSide")}</th>
              <th scope="col">{v3("blType")}</th>
              <th scope="col">{v3("blStatus")}</th>
              <th scope="col">{v3("blVolume")}</th>
              <th scope="col">{v3("blPrice")}</th>
              <th scope="col">{v3("blCustomer")}</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((row) => {
              const side = sideLabel(row.side);
              return (
                <tr key={row.id}>
                  <td data-label={v3("blSymbol")}>{row.symbol || "—"}</td>
                  <td data-label={v3("blSide")}><span className="c3-side" data-side={side || "none"}>{sideText(side, v3)}</span></td>
                  <td data-label={v3("blType")}>{row.type || "—"}</td>
                  <td data-label={v3("blStatus")}>{statusText(row, v3)}</td>
                  <td data-label={v3("blVolume")}>{row.volume ?? "—"}</td>
                  <td data-label={v3("blPrice")}>{rowPrice(row) || "—"}</td>
                  <td data-label={v3("blCustomer")}>
                    {row.userId ? (
                      <Link href={crmv3Href(base, `customers/${row.userId}`)}>{row.traderName || v3("blOpenCustomer")}</Link>
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

export function DeskPad({ base, tx }: { base: string; tx: Tx }) {
  const v3 = useV3();
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

  function add() {
    const next = addNote(notes, { id: `pad-${Date.now()}`, customerId: person, body: draft, at: new Date().toISOString() });
    if (next.length === notes.length && next.every((note, index) => note.id === notes[index]?.id)) return;
    store(next);
    setDraft("");
  }

  return (
    <section className="c3-desk-pad" aria-label={v3("pdTitle")} data-desk-pad="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("pdSub")}</p>
          <h2 className="c3-title">{v3("pdTitle")}</h2>
        </div>
        <p className="c3-muted">{shown.length}</p>
      </header>
      <p className="c3-muted">{v3("pdHint")}</p>
      <label className="c3-lab">
        <span>{v3("pdSearch")}</span>
        <input className="c3-field" aria-label={v3("pdSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c3-row" role="group" aria-label={v3("pdActive")}>
        <button type="button" className="c3-chip" data-on={archived ? "0" : "1"} aria-pressed={!archived} onClick={() => setArchived(false)}>{v3("pdActive")}</button>
        <button type="button" className="c3-chip" data-on={archived ? "1" : "0"} aria-pressed={archived} onClick={() => setArchived(true)}>{v3("pdArchived")}</button>
      </div>
      <div className="c3-row">
        <label className="c3-lab">
          <span>{v3("pdCustomer")}</span>
          <select className="c3-select" aria-label={v3("pdCustomer")} aria-required={false} value={person} onChange={(event) => setPerson(event.target.value)}>
            <option value="">{v3("pdCustomer")}</option>
            {loaded.map((row) => <option key={row.id} value={row.id}>{row.name || row.email || row.id}</option>)}
          </select>
        </label>
        <label className="c3-lab">
          <span>{v3("pdBody")}</span>
          <input className="c3-field" aria-label={v3("pdBody")} value={draft} onChange={(event) => setDraft(event.target.value)} />
        </label>
        <button type="button" className="c3-btn" onClick={add}>{v3("pdAdd")}</button>
        <span className="c3-muted">{v3("pdLocal")}</span>
      </div>
      {data.loading && !loaded.length && <p className="c3-muted">{v3("pdLoading")}</p>}
      {data.error && <p className="c3-muted">{v3("pdFailed")} {tx("failed")}</p>}
      {!data.loading && !data.error && !loaded.length && <p className="c3-empty">{v3("pdNoCustomers")}</p>}
      {!data.loading && !data.error && loaded.length > 0 && !shown.length && !query && !archived && <p className="c3-empty">{v3("pdNone")}</p>}
      {!data.loading && !data.error && loaded.length > 0 && !shown.length && (query || archived) && <p className="c3-empty">{v3("pdEmpty")}</p>}
      <ul className="c3-pad-notes">
        {shown.map((note) => (
          <li key={note.id} className="c3-pad-note" data-pinned={note.pinned ? "1" : "0"} data-archived={note.archived ? "1" : "0"}>
            <p>{note.body}</p>
            <p className="c3-muted">{names.get(note.customerId) || "—"}</p>
            <div className="c3-row">
              <button type="button" className="c3-btn" aria-pressed={note.pinned} onClick={() => store(togglePin(notes, note.id))}>{note.pinned ? v3("pdUnpin") : v3("pdPin")}</button>
              <button type="button" className="c3-btn" onClick={() => store(toggleArchive(notes, note.id))}>{note.archived ? v3("pdRestore") : v3("pdArchive")}</button>
              <button type="button" className="c3-btn" onClick={() => store(removeNote(notes, note.id))}>{v3("pdRemove")}</button>
              <Link className="c3-btn" href={crmv3Href(base, `customers/${note.customerId}`)}>{v3("pdOpen")}</Link>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
