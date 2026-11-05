"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readJson, writeJson } from "@/lib/crmv3/bridge";
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
} from "@/lib/crmv3/mutelist";
import { crmv3Href } from "@/lib/crmv3/sections";
import { useJson } from "../kit";
import { useV3 } from "./store";

const PEOPLE = "/api/admin/users?take=40&meta=0&role=TRADER";
const ORDERS = "/api/admin/positions?tab=orders&take=40";

type Order = {
  id: string;
  symbol?: string | null;
  userId?: string | null;
  traderName?: string | null;
  user?: { id?: string | null; name?: string | null; email?: string | null } | null;
};

type GlanceRow = SymbolRow & { id: string; userId: string };

export function MuteList({ base }: { base: string }) {
  const v3 = useV3();
  const data = useJson<{ users?: Person[] }>(PEOPLE);
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
    <section className="c3-mute-list" aria-label={v3("muTitle")} data-mute-list="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("muSub")}</p>
          <h2 className="c3-title">{v3("muTitle")}</h2>
        </div>
        <p className="c3-muted">{shown.length}</p>
      </header>
      <p className="c3-muted">{v3("muHint")}</p>
      <p className="c3-muted">{v3("muLocal")}</p>
      {data.loading && !rows.length && <p className="c3-muted">{v3("muLoading")}</p>}
      {data.error && <p className="c3-muted">{v3("muFailed")}</p>}
      {!data.loading && !data.error && !rows.length && <p className="c3-empty">{v3("muNone")}</p>}
      <label className="c3-lab">
        <span>{v3("muSearch")}</span>
        <input className="c3-field" aria-label={v3("muSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c3-row" role="group" aria-label={v3("muShown")}>
        <button type="button" className="c3-chip" data-on={showMuted ? "0" : "1"} aria-pressed={!showMuted} onClick={() => setShowMuted(false)}>{v3("muShown")}</button>
        <button type="button" className="c3-chip" data-on={showMuted ? "1" : "0"} aria-pressed={showMuted} onClick={() => setShowMuted(true)}>{v3("muMuted")}</button>
      </div>
      {!shown.length && rows.length > 0 && <p className="c3-empty">{v3("muEmpty")}</p>}
      <ul className="c3-mute-rows">
        {shown.map((row) => (
          <li key={row.id} data-muted={showMuted ? "1" : "0"}>
            <p>{row.name || row.email || row.id}</p>
            <div className="c3-row">
              <button type="button" className="c3-btn" onClick={() => store(showMuted ? unmuteId(muted, row.id, present) : muteId(muted, row.id, present))}>{showMuted ? v3("muUnmute") : v3("muMute")}</button>
              <Link className="c3-btn" href={crmv3Href(base, `customers/${row.id}`)}>{v3("muCustomer")}</Link>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function SymbolGlance({ base }: { base: string }) {
  const v3 = useV3();
  const data = useJson<{ orders?: Order[] }>(ORDERS);
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
    <section className="c3-symbol-glance" aria-label={v3("ymTitle")} data-symbol-glance="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("ymSub")}</p>
          <h2 className="c3-title">{v3("ymTitle")}</h2>
        </div>
        <p className="c3-muted">{chips.length}</p>
      </header>
      <p className="c3-muted">{v3("ymHint")}</p>
      <p className="c3-muted">{v3("ymLocal")}</p>
      <p className="c3-row">
        <Link className="c3-btn" href={crmv3Href(base, "blotter")}>{v3("ymBoard")}</Link>
      </p>
      {data.loading && !rows.length && <p className="c3-muted">{v3("ymLoading")}</p>}
      {data.error && <p className="c3-muted">{v3("ymFailed")}</p>}
      {!data.loading && !data.error && !rows.length && <p className="c3-empty">{v3("ymNone")}</p>}
      {blankCount > 0 && (
        <button type="button" className="c3-symbol-blank" data-on={blank ? "1" : "0"} aria-pressed={blank} onClick={() => { setBlank((value) => !value); setSelected(""); }}>
          <span>{v3("ymBlank")}</span>
          <span className="c3-muted">{blankCount}</span>
        </button>
      )}
      <div className="c3-row" role="group" aria-label={v3("ymShown")}>
        <button type="button" className="c3-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v3("ymShown")}</button>
        <button type="button" className="c3-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v3("ymHidden")}</button>
      </div>
      <div className="c3-row" role="group" aria-label={v3("ymTitle")}>
        <button type="button" className="c3-chip" data-on={!symbol && !blank ? "1" : "0"} aria-pressed={!symbol && !blank} onClick={() => { setSelected(""); setBlank(false); }}>{v3("ymAll")}</button>
        {chips.map((item) => (
          <span key={item} className="c3-symbol-pair" data-symbol={item}>
            <button type="button" className="c3-chip" data-on={symbol === item ? "1" : "0"} aria-pressed={symbol === item} onClick={() => { setBlank(false); setSelected(symbol === item ? "" : item); }}>{item}</button>
            <button type="button" className="c3-btn" onClick={() => store(toggleSymbol(hiddenSymbols, item, present), showHidden ? "" : item)}>{showHidden ? v3("ymShow") : v3("ymHide")}</button>
          </span>
        ))}
      </div>
      <label className="c3-lab">
        <span>{v3("ymSearch")}</span>
        <input className="c3-field" aria-label={v3("ymSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c3-empty">{v3("ymEmpty")}</p>}
      <ul className="c3-symbol-rows">
        {shown.map((row) => {
          const name = symbolText(row.symbol);
          return (
            <li key={row.id} data-symbol={name || "blank"}>
              <p>{row.label || row.id}</p>
              <p className="c3-muted">{name || v3("ymBlank")}</p>
              {row.userId && <Link className="c3-btn" href={crmv3Href(base, `customers/${row.userId}`)}>{v3("ymCustomer")}</Link>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
