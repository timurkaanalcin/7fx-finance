"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import {
  MUTE_KEY,
  SYMBOL_KEY,
  activeSymbol,
  muteId,
  namedSymbols,
  readHiddenSymbols,
  readMuted,
  symbolLines,
  symbolText,
  toggleSymbol,
  unmuteId,
  visibleOrders,
  visiblePeople,
  visibleSymbols,
  type Person,
  type SymbolRow,
} from "@/lib/crmv4/round97";
import { crmv4Href } from "@/lib/crmv4/sections";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

type Order = {
  id: string;
  symbol?: string | null;
  userId?: string | null;
  traderName?: string | null;
  user?: { id?: string | null; name?: string | null; email?: string | null } | null;
};

type GlanceRow = SymbolRow & { id: string; userId: string };

export function MuteList({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [muted, setMuted] = useState<string[]>([]);
  const [showMuted, setShowMuted] = useState(false);
  const [query, setQuery] = useState("");
  const rows = (data.data?.users || []).map((row) => ({
    id: String(row.id || "").trim(),
    name: row.name,
    email: row.email,
  })).filter((row) => row.id);
  const present = rows.map((row) => row.id);
  const presentKey = present.join("\n");
  useEffect(() => {
    if (data.loading || data.error) return;
    const next = readMuted(readJson(MUTE_KEY, []), presentKey ? presentKey.split("\n") : []);
    setMuted(next);
    writeJson(MUTE_KEY, next);
  }, [data.loading, data.error, presentKey]);
  const shown = visiblePeople(rows, muted, query, showMuted);

  function store(next: string[]) {
    setMuted(next);
    writeJson(MUTE_KEY, next);
  }

  return (
    <section className="c4-mute-list" aria-label={v4("muTitle")} data-mute-list="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-pay-kicker">{v4("muSub")}</p>
          <h2 className="c4-title">{v4("muTitle")}</h2>
        </div>
        <p className="c4-meta">{shown.length}</p>
      </header>
      <p className="c4-meta">{v4("muHint")}</p>
      <p className="c4-meta">{v4("muLocal")}</p>
      {data.loading && !rows.length && <p className="c4-meta">{v4("muLoading")}</p>}
      {data.error && <p className="c4-meta">{v4("muFailed")}</p>}
      {!data.loading && !data.error && !rows.length && <p className="c4-pay-empty">{v4("muNone")}</p>}
      <label className="c4-lab">
        <span>{v4("muSearch")}</span>
        <input className="c4-field" aria-label={v4("muSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c4-row" role="group" aria-label={v4("muShown")}>
        <button type="button" className="c4-chip" data-on={showMuted ? "0" : "1"} aria-pressed={!showMuted} onClick={() => setShowMuted(false)}>{v4("muShown")}</button>
        <button type="button" className="c4-chip" data-on={showMuted ? "1" : "0"} aria-pressed={showMuted} onClick={() => setShowMuted(true)}>{v4("muMuted")}</button>
      </div>
      {!shown.length && rows.length > 0 && <p className="c4-pay-empty">{v4("muEmpty")}</p>}
      <ul className="c4-mute-rows">
        {shown.map((row) => (
          <li key={row.id} data-muted={showMuted ? "1" : "0"}>
            <p>{row.name || row.email || row.id}</p>
            <div className="c4-row">
              <button type="button" className="c4-btn" onClick={() => store(showMuted ? unmuteId(muted, row.id, present) : muteId(muted, row.id, present))}>{showMuted ? v4("muUnmute") : v4("muMute")}</button>
              <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{v4("muCustomer")}</Link>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function SymbolGlance({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ orders?: Order[] }>("/api/admin/positions?tab=orders&take=40");
  const [hiddenSymbols, setHiddenSymbols] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [blank, setBlank] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [query, setQuery] = useState("");
  const rows = (data.data?.orders || []).map((row): GlanceRow | null => {
    const id = String(row.id || "").trim();
    if (!id) return null;
    return {
      id,
      symbol: row.symbol,
      label: `${row.symbol || ""} ${row.traderName || row.user?.name || row.user?.email || ""}`.trim(),
      userId: String(row.user?.id || row.userId || "").trim(),
    };
  }).filter((row): row is GlanceRow => Boolean(row));
  const lines = symbolLines(rows);
  const present = namedSymbols(rows);
  const presentKey = present.join("\n");
  const blankCount = lines.find((line) => !line.symbol)?.count || 0;
  useEffect(() => {
    if (data.loading || data.error) return;
    const next = readHiddenSymbols(readJson(SYMBOL_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHiddenSymbols(next);
    writeJson(SYMBOL_KEY, next);
  }, [data.loading, data.error, presentKey]);
  const chips = visibleSymbols(present, hiddenSymbols, showHidden);
  const symbol = activeSymbol(selected, chips);
  const shown = visibleOrders(rows, symbol, blank, query);

  function store(next: string[], clear: string) {
    setHiddenSymbols(next);
    writeJson(SYMBOL_KEY, next);
    if (clear && activeSymbol(selected, [clear])) setSelected("");
  }

  return (
    <section className="c4-symbol-glance" aria-label={v4("ymTitle")} data-symbol-glance="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-pay-kicker">{v4("ymSub")}</p>
          <h2 className="c4-title">{v4("ymTitle")}</h2>
        </div>
        <p className="c4-meta">{chips.length}</p>
      </header>
      <p className="c4-meta">{v4("ymHint")}</p>
      <p className="c4-meta">{v4("ymLocal")}</p>
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "blotter")}>{v4("ymBoard")}</Link>
      </p>
      {data.loading && !rows.length && <p className="c4-meta">{v4("ymLoading")}</p>}
      {data.error && <p className="c4-meta">{v4("ymFailed")}</p>}
      {!data.loading && !data.error && !rows.length && <p className="c4-pay-empty">{v4("ymNone")}</p>}
      {blankCount > 0 && (
        <button type="button" className="c4-symbol-blank" data-on={blank ? "1" : "0"} aria-pressed={blank} onClick={() => { setBlank((value) => !value); setSelected(""); }}>
          <span>{v4("ymBlank")}</span>
          <span className="c4-meta">{blankCount}</span>
        </button>
      )}
      <div className="c4-row" role="group" aria-label={v4("ymShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("ymShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("ymHidden")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("ymTitle")}>
        <button type="button" className="c4-chip" data-on={!symbol && !blank ? "1" : "0"} aria-pressed={!symbol && !blank} onClick={() => { setSelected(""); setBlank(false); }}>{v4("ymAll")}</button>
        {chips.map((item) => (
          <span key={item} className="c4-symbol-pair" data-symbol={item}>
            <button type="button" className="c4-chip" data-on={symbol === item ? "1" : "0"} aria-pressed={symbol === item} onClick={() => { setBlank(false); setSelected(symbol === item ? "" : item); }}>{item}</button>
            <button type="button" className="c4-btn" onClick={() => store(toggleSymbol(hiddenSymbols, item, present), showHidden ? "" : item)}>{showHidden ? v4("ymShow") : v4("ymHide")}</button>
          </span>
        ))}
      </div>
      <label className="c4-lab">
        <span>{v4("ymSearch")}</span>
        <input className="c4-field" aria-label={v4("ymSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c4-pay-empty">{v4("ymEmpty")}</p>}
      <ul className="c4-symbol-rows">
        {shown.map((row) => {
          const name = symbolText(row.symbol);
          return (
            <li key={row.id} data-symbol={name || "blank"}>
              <p>{row.label || row.id}</p>
              <p className="c4-meta">{name || v4("ymBlank")}</p>
              {row.userId && <Link className="c4-btn" href={crmv4Href(base, `customers/${row.userId}`)}>{v4("ymCustomer")}</Link>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
