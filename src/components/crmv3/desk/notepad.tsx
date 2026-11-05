"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readJson, writeJson } from "@/lib/crmv3/bridge";
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
} from "@/lib/crmv3/notepad";
import { crmv3Href } from "@/lib/crmv3/sections";
import { useJson } from "../kit";
import { useV3 } from "./store";

const ORDERS = "/api/admin/positions?tab=orders&take=40";

type Order = {
  id: string;
  symbol?: string | null;
  status?: string | null;
  userId?: string | null;
  user?: { id?: string | null; name?: string | null; email?: string | null } | null;
};

type GlanceRow = StatusRow & { id: string; userId: string };

export function ScratchPads() {
  const v3 = useV3();
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
    <section className="c3-scratch-pads" aria-label={v3("npTitle")} data-scratch-pads="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("npSub")}</p>
          <h2 className="c3-title">{v3("npTitle")}</h2>
        </div>
        <p className="c3-muted">{shown.length}</p>
      </header>
      <p className="c3-muted">{v3("npHint")}</p>
      <p className="c3-muted">{v3("npLocal")}</p>
      <form className="c3-row" onSubmit={(event) => {
        event.preventDefault();
        const next = addPad(pads, { id: `np-${Date.now()}`, text, at: new Date().toISOString() });
        if (next.length === pads.length) return;
        store(next);
        setText("");
      }}>
        <label className="c3-lab">
          <span>{v3("npText")}</span>
          <textarea className="c3-field c3-pad-note" aria-label={v3("npText")} value={text} maxLength={2000} rows={4} onChange={(event) => setText(event.target.value)} />
        </label>
        <button type="submit" className="c3-btn">{v3("npAdd")}</button>
      </form>
      <p className="c3-muted">{v3("npBlank")}</p>
      <label className="c3-lab">
        <span>{v3("npSearch")}</span>
        <input className="c3-field" aria-label={v3("npSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c3-row" role="group" aria-label={v3("npShown")}>
        <button type="button" className="c3-chip" data-on={hidden ? "0" : "1"} aria-pressed={!hidden} onClick={() => setHidden(false)}>{v3("npShown")}</button>
        <button type="button" className="c3-chip" data-on={hidden ? "1" : "0"} aria-pressed={hidden} onClick={() => setHidden(true)}>{v3("npHidden")}</button>
      </div>
      {!shown.length && <p className="c3-empty">{v3("npEmpty")}</p>}
      <ul className="c3-pad-list">
        {shown.map((pad) => (
          <li key={pad.id} className="c3-pad-card" data-pinned={pad.pinned ? "1" : "0"}>
            <p className="c3-pad-text">{pad.text}</p>
            <div className="c3-row">
              <button type="button" className="c3-btn" onClick={() => store(togglePadPin(pads, pad.id))}>{pad.pinned ? v3("npUnpin") : v3("npPin")}</button>
              <button type="button" className="c3-btn" onClick={() => store(setPadHidden(pads, pad.id, !pad.hidden))}>{pad.hidden ? v3("npShow") : v3("npHide")}</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function OrderGlance({ base }: { base: string }) {
  const v3 = useV3();
  const data = useJson<{ orders?: Order[] }>(ORDERS);
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
      label: `${row.symbol || ""} ${row.user?.name || row.user?.email || ""}`.trim(),
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
    <section className="c3-order-glance" aria-label={v3("ogTitle")} data-order-glance="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("ogSub")}</p>
          <h2 className="c3-title">{v3("ogTitle")}</h2>
        </div>
        <p className="c3-muted">{chips.length}</p>
      </header>
      <p className="c3-muted">{v3("ogHint")}</p>
      <p className="c3-muted">{v3("ogLocal")}</p>
      <p className="c3-row">
        <Link className="c3-btn" href={crmv3Href(base, "blotter")}>{v3("ogBoard")}</Link>
      </p>
      {data.loading && !rows.length && <p className="c3-muted">{v3("ogLoading")}</p>}
      {data.error && <p className="c3-muted">{v3("ogFailed")}</p>}
      {!data.loading && !data.error && !rows.length && <p className="c3-empty">{v3("ogNone")}</p>}
      {blankCount > 0 && (
        <button type="button" className="c3-order-blank" data-on={blank ? "1" : "0"} aria-pressed={blank} onClick={() => { setBlank((value) => !value); setSelected(""); }}>
          <span>{v3("ogBlank")}</span>
          <span className="c3-muted">{blankCount}</span>
        </button>
      )}
      <div className="c3-row" role="group" aria-label={v3("ogShown")}>
        <button type="button" className="c3-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v3("ogShown")}</button>
        <button type="button" className="c3-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v3("ogHidden")}</button>
      </div>
      <div className="c3-row" role="group" aria-label={v3("ogTitle")}>
        <button type="button" className="c3-chip" data-on={!status && !blank ? "1" : "0"} aria-pressed={!status && !blank} onClick={() => { setSelected(""); setBlank(false); }}>{v3("ogAll")}</button>
        {chips.map((item) => (
          <span key={item} className="c3-order-pair" data-status={item}>
            <button type="button" className="c3-chip" data-on={status === item ? "1" : "0"} aria-pressed={status === item} onClick={() => { setBlank(false); setSelected(status === item ? "" : item); }}>{item}</button>
            <button type="button" className="c3-btn" onClick={() => store(toggleStatus(hiddenStatuses, item, present), showHidden ? "" : item)}>{showHidden ? v3("ogShow") : v3("ogHide")}</button>
          </span>
        ))}
      </div>
      <label className="c3-lab">
        <span>{v3("ogSearch")}</span>
        <input className="c3-field" aria-label={v3("ogSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c3-empty">{v3("ogEmpty")}</p>}
      <ul className="c3-order-rows">
        {shown.map((row) => {
          const name = statusText(row.status);
          return (
            <li key={row.id} data-status={name || "blank"}>
              <p>{row.label || row.id}</p>
              <p className="c3-muted">{name || v3("ogBlank")}</p>
              {row.userId && <Link className="c3-btn" href={crmv3Href(base, `customers/${row.userId}`)}>{v3("ogCustomer")}</Link>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
