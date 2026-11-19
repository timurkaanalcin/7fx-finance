"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import {
  FOCUS_CUSTOMER_KEY,
  ORDER_TYPE_KEY,
  activeType,
  clearFocus,
  namedTypes,
  orderType,
  readFocus,
  readHiddenTypes,
  setFocus,
  toggleType,
  typeLines,
  visibleOrders,
  visiblePeople,
  visibleTypes,
  type Person,
  type TypeRow,
} from "@/lib/crmv4/round102";
import { crmv4Href } from "@/lib/crmv4/sections";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

type Order = {
  id: string;
  type?: string | null;
  symbol?: string | null;
  user?: { name?: string | null; email?: string | null } | null;
};

type GlanceRow = TypeRow & { id: string };

export function FocusCustomer({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [focus, setFocused] = useState("");
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
    const next = readFocus(readJson(FOCUS_CUSTOMER_KEY, ""), presentKey ? presentKey.split("\n") : []);
    setFocused(next);
    writeJson(FOCUS_CUSTOMER_KEY, next);
  }, [data.loading, data.error, presentKey]);
  const shown = visiblePeople(rows, query);
  const person = rows.find((row) => row.id === focus);

  function store(next: string) {
    setFocused(next);
    writeJson(FOCUS_CUSTOMER_KEY, next);
  }

  return (
    <section className="c4-focus-customer c4-focus-oriel" aria-label={v4("fcTitle")} data-focus-customer="1" data-desk="oriel" data-focused={focus ? "1" : "0"}>
      <header className="c4-focus-oriel-mast">
        <p className="c4-focus-oriel-seal" data-logo="mono">7FX</p>
        <div>
          <p className="c4-focus-oriel-kicker">{v4("fcOrielKicker")}</p>
          <h2 className="c4-title c4-focus-oriel-title">{v4("fcTitle")}</h2>
          <p className="c4-focus-oriel-lead">{v4("fcOrielLead")}</p>
        </div>
        <p className="c4-focus-oriel-count">{focus ? 1 : 0}</p>
      </header>
      <ol className="c4-focus-oriel-index" aria-label={v4("fcTitle")}>
        <li data-tone="gold">{v4("fcOrielFocused")}</li>
        <li data-tone="ink">{v4("fcOrielListed")}</li>
        <li data-tone="ivory">{v4("fcOrielOpen")}</li>
      </ol>
      <div className="c4-focus-oriel-chart" aria-label={v4("fcTitle")}>
        <button type="button" className="c4-focus-oriel-column" data-on={focus ? "1" : "0"} onClick={() => store(clearFocus())}>
          <i style={{ height: focus ? "72px" : "18px" }} />
          <strong>{focus ? 1 : 0}</strong>
          <span>{v4("fcOrielFocused")}</span>
        </button>
        <button type="button" className="c4-focus-oriel-column" data-on={shown.length ? "1" : "0"} onClick={() => setQuery("")}>
          <i style={{ height: `${Math.max(18, Math.min(88, shown.length * 14))}px` }} />
          <strong>{shown.length}</strong>
          <span>{v4("fcOrielListed")}</span>
        </button>
        <button type="button" className="c4-focus-oriel-column" data-on={person ? "1" : "0"} onClick={() => { if (person) store(clearFocus()); }}>
          <i style={{ height: person ? "48px" : "18px" }} />
          <strong>{rows.length}</strong>
          <span>{v4("fcOrielOpen")}</span>
        </button>
      </div>
      <p className="c4-meta c4-focus-oriel-hint">{v4("fcHint")}</p>
      <p className="c4-meta">{v4("fcLocal")}</p>
      {person ? (
        <div className="c4-focus-card" data-focus={person.id}>
          <p>{person.name || person.email || person.id}</p>
          <p className="c4-meta">{v4("fcFocused")}</p>
          <div className="c4-row">
            <Link className="c4-btn" href={crmv4Href(base, `customers/${person.id}`)}>{v4("fcOpen")}</Link>
            <button type="button" className="c4-btn" onClick={() => store(clearFocus())}>{v4("fcClear")}</button>
          </div>
        </div>
      ) : <p className="c4-pay-empty">{v4("fcMissing")}</p>}
      <label className="c4-lab">
        <span>{v4("fcSearch")}</span>
        <input className="c4-field" aria-label={v4("fcSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {data.loading && !rows.length && <p className="c4-meta">{v4("fcLoading")}</p>}
      {data.error && <p className="c4-meta">{v4("fcFailed")}</p>}
      {!data.loading && !data.error && !rows.length && <p className="c4-pay-empty">{v4("fcNone")}</p>}
      {!shown.length && rows.length > 0 && <p className="c4-pay-empty">{v4("fcEmpty")}</p>}
      <ul className="c4-focus-list c4-focus-oriel-list">
        {shown.map((row) => (
          <li key={row.id} className="c4-focus-oriel-card" data-customer={row.id} data-on={row.id === focus ? "1" : "0"}>
            <p>{row.name || row.email || row.id}</p>
            <p className="c4-meta">{row.email || ""}</p>
            <button type="button" className="c4-btn" disabled={row.id === focus} onClick={() => store(setFocus(focus, row.id, present))}>{row.id === focus ? v4("fcFocused") : v4("fcFocus")}</button>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function OrderTypeGlance({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ orders?: Order[] }>("/api/admin/positions?tab=orders&take=40");
  const [hiddenTypes, setHiddenTypes] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [blank, setBlank] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [query, setQuery] = useState("");
  const rows = (data.data?.orders || []).map((row): GlanceRow | null => {
    const id = String(row.id || "").trim();
    if (!id) return null;
    return {
      id,
      type: row.type,
      label: String(row.symbol || row.user?.name || row.user?.email || "").trim(),
    };
  }).filter((row): row is GlanceRow => Boolean(row));
  const lines = typeLines(rows);
  const present = namedTypes(rows);
  const presentKey = present.join("\n");
  const blankCount = lines.find((line) => !line.type)?.count || 0;
  useEffect(() => {
    if (data.loading || data.error) return;
    const next = readHiddenTypes(readJson(ORDER_TYPE_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHiddenTypes(next);
    writeJson(ORDER_TYPE_KEY, next);
  }, [data.loading, data.error, presentKey]);
  const chips = visibleTypes(present, hiddenTypes, showHidden);
  const type = activeType(selected, chips);
  const shown = visibleOrders(rows, type, blank, query);

  function store(next: string[], clear: string) {
    setHiddenTypes(next);
    writeJson(ORDER_TYPE_KEY, next);
    if (clear && activeType(selected, [clear])) setSelected("");
  }

  const peak = Math.max(1, ...lines.map((line) => line.count));
  return (
    <section className="c4-order-type c4-type-aisle" aria-label={v4("oyTitle")} data-order-type="1" data-desk="aisle">
      <header className="c4-type-aisle-mast">
        <p className="c4-type-aisle-seal" data-logo="mono">7FX</p>
        <div>
          <p className="c4-type-aisle-kicker">{v4("oyAisleKicker")}</p>
          <h2 className="c4-title c4-type-aisle-title">{v4("oyTitle")}</h2>
          <p className="c4-type-aisle-lead">{v4("oyAisleLead")}</p>
        </div>
        <p className="c4-type-aisle-count">{chips.length}</p>
      </header>
      <ol className="c4-type-aisle-index" aria-label={v4("oyTitle")}>
        <li data-tone="gold">{v4("oyAisleShown")}</li>
        <li data-tone="ink">{v4("oyAisleHidden")}</li>
        <li data-tone="ivory">{v4("oyAisleBlank")}</li>
      </ol>
      <div className="c4-type-aisle-chart" aria-label={v4("oyTitle")}>
        {lines.filter((line) => line.type).map((line) => (
          <button key={line.type} type="button" className="c4-type-aisle-column" data-on={type === line.type ? "1" : "0"} data-type={line.type} onClick={() => { setBlank(false); setSelected(type === line.type ? "" : line.type); }}>
            <i style={{ height: `${Math.max(18, Math.round((line.count / peak) * 88))}px` }} />
            <strong>{line.count}</strong>
            <span>{line.type}</span>
          </button>
        ))}
        {blankCount > 0 && (
          <button type="button" className="c4-type-aisle-column" data-on={blank ? "1" : "0"} data-type="blank" onClick={() => { setBlank((value) => !value); setSelected(""); }}>
            <i style={{ height: `${Math.max(18, Math.round((blankCount / peak) * 88))}px` }} />
            <strong>{blankCount}</strong>
            <span>{v4("oyAisleBlank")}</span>
          </button>
        )}
      </div>
      <p className="c4-meta c4-type-aisle-hint">{v4("oyHint")}</p>
      <p className="c4-meta">{v4("oyLocal")}</p>
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "blotter")}>{v4("oyBoard")}</Link>
      </p>
      {data.loading && !rows.length && <p className="c4-meta">{v4("oyLoading")}</p>}
      {data.error && <p className="c4-meta">{v4("oyFailed")}</p>}
      {!data.loading && !data.error && !rows.length && <p className="c4-pay-empty">{v4("oyNone")}</p>}
      {blankCount > 0 && (
        <button type="button" className="c4-oy-blank" data-on={blank ? "1" : "0"} aria-pressed={blank} onClick={() => { setBlank((value) => !value); setSelected(""); }}>
          <span>{v4("oyBlank")}</span>
          <span className="c4-meta">{blankCount}</span>
        </button>
      )}
      <div className="c4-row" role="group" aria-label={v4("oyShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("oyShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("oyHidden")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("oyTitle")}>
        <button type="button" className="c4-chip" data-on={!type && !blank ? "1" : "0"} aria-pressed={!type && !blank} onClick={() => { setSelected(""); setBlank(false); }}>{v4("oyAll")}</button>
        {chips.map((item) => {
          const count = lines.find((line) => line.type === item)?.count || 0;
          return (
            <span key={item} className="c4-oy-pair" data-type={item}>
              <button type="button" className="c4-chip" data-on={type === item ? "1" : "0"} aria-pressed={type === item} onClick={() => { setBlank(false); setSelected(type === item ? "" : item); }}>{item} {count}</button>
              <button type="button" className="c4-btn" onClick={() => store(toggleType(hiddenTypes, item, present), showHidden ? "" : item)}>{showHidden ? v4("oyShow") : v4("oyHide")}</button>
            </span>
          );
        })}
      </div>
      <label className="c4-lab">
        <span>{v4("oySearch")}</span>
        <input className="c4-field" aria-label={v4("oySearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c4-pay-empty">{v4("oyEmpty")}</p>}
      <ul className="c4-oy-rows c4-type-aisle-list">
        {shown.map((row) => {
          const name = orderType(row.type);
          return (
            <li key={row.id} className="c4-type-aisle-card" data-type={name || "blank"} data-on={type && type === name ? "1" : "0"}>
              <p>{row.label || row.id}</p>
              <p className="c4-meta">{name || v4("oyBlank")}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
