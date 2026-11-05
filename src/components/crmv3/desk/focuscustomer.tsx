"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readJson, writeJson } from "@/lib/crmv3/bridge";
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
} from "@/lib/crmv3/focuscustomer";
import { crmv3Href } from "@/lib/crmv3/sections";
import { useJson } from "../kit";
import { useV3 } from "./store";

const USERS = "/api/admin/users?take=40&meta=0&role=TRADER";
const ORDERS = "/api/admin/positions?tab=orders&take=40";

type Order = {
  id: string;
  type?: string | null;
  symbol?: string | null;
  user?: { name?: string | null; email?: string | null } | null;
};

type GlanceRow = TypeRow & { id: string };

export function FocusCustomer({ base }: { base: string }) {
  const v3 = useV3();
  const data = useJson<{ users?: Person[] }>(USERS);
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
    <section className="c3-focus-customer" aria-label={v3("fcTitle")} data-focus-customer="1" data-focused={focus ? "1" : "0"}>
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("fcSub")}</p>
          <h2 className="c3-title">{v3("fcTitle")}</h2>
        </div>
        <p className="c3-muted">{focus ? 1 : 0}</p>
      </header>
      <p className="c3-muted">{v3("fcHint")}</p>
      <p className="c3-muted">{v3("fcLocal")}</p>
      {person ? (
        <div className="c3-focus-card" data-focus={person.id}>
          <p>{person.name || person.email || person.id}</p>
          <p className="c3-muted">{v3("fcFocused")}</p>
          <div className="c3-row">
            <Link className="c3-btn" href={crmv3Href(base, `customers/${person.id}`)}>{v3("fcOpen")}</Link>
            <button type="button" className="c3-btn" onClick={() => store(clearFocus())}>{v3("fcClear")}</button>
          </div>
        </div>
      ) : <p className="c3-empty">{v3("fcMissing")}</p>}
      <label className="c3-lab">
        <span>{v3("fcSearch")}</span>
        <input className="c3-field" aria-label={v3("fcSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {data.loading && !rows.length && <p className="c3-muted">{v3("fcLoading")}</p>}
      {data.error && <p className="c3-muted">{v3("fcFailed")}</p>}
      {!data.loading && !data.error && !rows.length && <p className="c3-empty">{v3("fcNone")}</p>}
      {!shown.length && rows.length > 0 && <p className="c3-empty">{v3("fcEmpty")}</p>}
      <ul className="c3-focus-list">
        {shown.map((row) => (
          <li key={row.id} data-customer={row.id} data-on={row.id === focus ? "1" : "0"}>
            <p>{row.name || row.email || row.id}</p>
            <p className="c3-muted">{row.email || ""}</p>
            <button type="button" className="c3-btn" disabled={row.id === focus} onClick={() => store(setFocus(focus, row.id, present))}>{row.id === focus ? v3("fcFocused") : v3("fcFocus")}</button>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function OrderTypeGlance({ base }: { base: string }) {
  const v3 = useV3();
  const data = useJson<{ orders?: Order[] }>(ORDERS);
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

  return (
    <section className="c3-order-type" aria-label={v3("oyTitle")} data-order-type="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("oySub")}</p>
          <h2 className="c3-title">{v3("oyTitle")}</h2>
        </div>
        <p className="c3-muted">{chips.length}</p>
      </header>
      <p className="c3-muted">{v3("oyHint")}</p>
      <p className="c3-muted">{v3("oyLocal")}</p>
      <p className="c3-row">
        <Link className="c3-btn" href={crmv3Href(base, "blotter")}>{v3("oyBoard")}</Link>
      </p>
      {data.loading && !rows.length && <p className="c3-muted">{v3("oyLoading")}</p>}
      {data.error && <p className="c3-muted">{v3("oyFailed")}</p>}
      {!data.loading && !data.error && !rows.length && <p className="c3-empty">{v3("oyNone")}</p>}
      {blankCount > 0 && (
        <button type="button" className="c3-oy-blank" data-on={blank ? "1" : "0"} aria-pressed={blank} onClick={() => { setBlank((value) => !value); setSelected(""); }}>
          <span>{v3("oyBlank")}</span>
          <span className="c3-muted">{blankCount}</span>
        </button>
      )}
      <div className="c3-row" role="group" aria-label={v3("oyShown")}>
        <button type="button" className="c3-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v3("oyShown")}</button>
        <button type="button" className="c3-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v3("oyHidden")}</button>
      </div>
      <div className="c3-row" role="group" aria-label={v3("oyTitle")}>
        <button type="button" className="c3-chip" data-on={!type && !blank ? "1" : "0"} aria-pressed={!type && !blank} onClick={() => { setSelected(""); setBlank(false); }}>{v3("oyAll")}</button>
        {chips.map((item) => {
          const count = lines.find((line) => line.type === item)?.count || 0;
          return (
            <span key={item} className="c3-oy-pair" data-type={item}>
              <button type="button" className="c3-chip" data-on={type === item ? "1" : "0"} aria-pressed={type === item} onClick={() => { setBlank(false); setSelected(type === item ? "" : item); }}>{item} {count}</button>
              <button type="button" className="c3-btn" onClick={() => store(toggleType(hiddenTypes, item, present), showHidden ? "" : item)}>{showHidden ? v3("oyShow") : v3("oyHide")}</button>
            </span>
          );
        })}
      </div>
      <label className="c3-lab">
        <span>{v3("oySearch")}</span>
        <input className="c3-field" aria-label={v3("oySearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c3-empty">{v3("oyEmpty")}</p>}
      <ul className="c3-oy-rows">
        {shown.map((row) => {
          const name = orderType(row.type);
          return (
            <li key={row.id} data-type={name || "blank"}>
              <p>{row.label || row.id}</p>
              <p className="c3-muted">{name || v3("oyBlank")}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
