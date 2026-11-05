"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import {
  PAD_KEY,
  STATUS_KEY,
  activeStatus,
  addPad,
  namedStatuses,
  readHiddenStatuses,
  readPads,
  setPadHidden,
  statusLines,
  statusText,
  togglePadPin,
  toggleStatus,
  visibleOrders,
  visiblePads,
  visibleStatuses,
  type Pad,
  type StatusRow,
} from "@/lib/crmv4/round90";
import { crmv4Href } from "@/lib/crmv4/sections";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

type Order = {
  id: string;
  symbol?: string | null;
  status?: string | null;
  userId?: string | null;
  traderName?: string | null;
  user?: { id?: string | null; name?: string | null; email?: string | null } | null;
};

type GlanceRow = StatusRow & { id: string; userId: string };

export function ScratchPads({ v4 }: { v4: V4 }) {
  const [pads, setPads] = useState<Pad[]>([]);
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const next = readPads(readJson(PAD_KEY, []));
    setPads(next);
    writeJson(PAD_KEY, next);
  }, []);
  const shown = visiblePads(pads, query, hidden);

  function store(next: Pad[]) {
    setPads(next);
    writeJson(PAD_KEY, next);
  }

  return (
    <section className="c4-scratch-pads" aria-label={v4("npTitle")} data-scratch-pads="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-pay-kicker">{v4("npSub")}</p>
          <h2 className="c4-title">{v4("npTitle")}</h2>
        </div>
        <p className="c4-meta">{shown.length}</p>
      </header>
      <p className="c4-meta">{v4("npHint")}</p>
      <p className="c4-meta">{v4("npLocal")}</p>
      <form className="c4-row" onSubmit={(event) => {
        event.preventDefault();
        const next = addPad(pads, { id: `np-${Date.now()}`, text, at: new Date().toISOString() });
        if (next.length === pads.length) return;
        store(next);
        setText("");
      }}>
        <label className="c4-lab">
          <span>{v4("npText")}</span>
          <textarea className="c4-field c4-pad-note" aria-label={v4("npText")} value={text} maxLength={2000} rows={4} onChange={(event) => setText(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn">{v4("npAdd")}</button>
      </form>
      <p className="c4-meta">{v4("npBlank")}</p>
      <label className="c4-lab">
        <span>{v4("npSearch")}</span>
        <input className="c4-field" aria-label={v4("npSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c4-row" role="group" aria-label={v4("npShown")}>
        <button type="button" className="c4-chip" data-on={hidden ? "0" : "1"} aria-pressed={!hidden} onClick={() => setHidden(false)}>{v4("npShown")}</button>
        <button type="button" className="c4-chip" data-on={hidden ? "1" : "0"} aria-pressed={hidden} onClick={() => setHidden(true)}>{v4("npHidden")}</button>
      </div>
      {!shown.length && <p className="c4-pay-empty">{v4("npEmpty")}</p>}
      <ul className="c4-pad-list">
        {shown.map((pad) => (
          <li key={pad.id} className="c4-pad-card" data-pinned={pad.pinned ? "1" : "0"}>
            <p className="c4-pad-text">{pad.text}</p>
            <div className="c4-row">
              <button type="button" className="c4-btn" onClick={() => store(togglePadPin(pads, pad.id))}>{pad.pinned ? v4("npUnpin") : v4("npPin")}</button>
              <button type="button" className="c4-btn" onClick={() => store(setPadHidden(pads, pad.id, !pad.hidden))}>{pad.hidden ? v4("npShow") : v4("npHide")}</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function OrderGlance({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ orders?: Order[] }>("/api/admin/positions?tab=orders&take=40");
  const [hiddenStatuses, setHiddenStatuses] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [blank, setBlank] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [query, setQuery] = useState("");
  const rows = (data.data?.orders || []).map((row): GlanceRow | null => {
    const id = String(row.id || "").trim();
    if (!id) return null;
    return {
      id,
      status: row.status,
      label: `${row.symbol || ""} ${row.traderName || row.user?.name || row.user?.email || ""}`.trim(),
      userId: String(row.user?.id || row.userId || "").trim(),
    };
  }).filter((row): row is GlanceRow => Boolean(row));
  const lines = statusLines(rows);
  const present = namedStatuses(rows);
  const presentKey = present.join("\n");
  const blankCount = lines.find((line) => !line.status)?.count || 0;
  useEffect(() => {
    if (data.loading || data.error) return;
    const next = readHiddenStatuses(readJson(STATUS_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHiddenStatuses(next);
    writeJson(STATUS_KEY, next);
  }, [data.loading, data.error, presentKey]);
  const chips = visibleStatuses(present, hiddenStatuses, showHidden);
  const status = activeStatus(selected, chips);
  const shown = visibleOrders(rows, status, blank, query);

  function store(next: string[], clear: string) {
    setHiddenStatuses(next);
    writeJson(STATUS_KEY, next);
    if (clear && activeStatus(selected, [clear])) setSelected("");
  }

  return (
    <section className="c4-order-glance" aria-label={v4("ogTitle")} data-order-glance="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-pay-kicker">{v4("ogSub")}</p>
          <h2 className="c4-title">{v4("ogTitle")}</h2>
        </div>
        <p className="c4-meta">{chips.length}</p>
      </header>
      <p className="c4-meta">{v4("ogHint")}</p>
      <p className="c4-meta">{v4("ogLocal")}</p>
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "blotter")}>{v4("ogBoard")}</Link>
      </p>
      {data.loading && !rows.length && <p className="c4-meta">{v4("ogLoading")}</p>}
      {data.error && <p className="c4-meta">{v4("ogFailed")}</p>}
      {!data.loading && !data.error && !rows.length && <p className="c4-pay-empty">{v4("ogNone")}</p>}
      {blankCount > 0 && (
        <button type="button" className="c4-order-blank" data-on={blank ? "1" : "0"} aria-pressed={blank} onClick={() => { setBlank((value) => !value); setSelected(""); }}>
          <span>{v4("ogBlank")}</span>
          <span className="c4-meta">{blankCount}</span>
        </button>
      )}
      <div className="c4-row" role="group" aria-label={v4("ogShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("ogShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("ogHidden")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("ogTitle")}>
        <button type="button" className="c4-chip" data-on={!status && !blank ? "1" : "0"} aria-pressed={!status && !blank} onClick={() => { setSelected(""); setBlank(false); }}>{v4("ogAll")}</button>
        {chips.map((item) => (
          <span key={item} className="c4-order-pair" data-status={item}>
            <button type="button" className="c4-chip" data-on={status === item ? "1" : "0"} aria-pressed={status === item} onClick={() => { setBlank(false); setSelected(status === item ? "" : item); }}>{item}</button>
            <button type="button" className="c4-btn" onClick={() => store(toggleStatus(hiddenStatuses, item, present), showHidden ? "" : item)}>{showHidden ? v4("ogShow") : v4("ogHide")}</button>
          </span>
        ))}
      </div>
      <label className="c4-lab">
        <span>{v4("ogSearch")}</span>
        <input className="c4-field" aria-label={v4("ogSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c4-pay-empty">{v4("ogEmpty")}</p>}
      <ul className="c4-order-rows">
        {shown.map((row) => {
          const name = statusText(row.status);
          return (
            <li key={row.id} data-status={name || "blank"}>
              <p>{row.label || row.id}</p>
              <p className="c4-meta">{name || v4("ogBlank")}</p>
              {row.userId && <Link className="c4-btn" href={crmv4Href(base, `customers/${row.userId}`)}>{v4("ogCustomer")}</Link>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
