"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readJson, writeJson } from "@/lib/crmv3/bridge";
import type { CrmV3CopyKey } from "@/lib/crmv3/copy";
import {
  FOLLOW_KEY,
  SIDE_KEY,
  activeSide,
  clearSnooze,
  followRows,
  otherSides,
  presentSides,
  readHiddenSides,
  readSnoozes,
  setSnooze,
  sideSplit,
  snoozeActive,
  toggleSide,
  utcInstant,
  visibleFollows,
  visibleOrders,
  visibleSides,
  type SideKind,
  type SideRow,
  type Snooze,
} from "@/lib/crmv3/snooze";
import { crmv3Href } from "@/lib/crmv3/sections";
import { localeTag, useJson } from "../kit";
import { useV3 } from "./store";

const USER_LIST = "/api/admin/users?take=40&meta=0&role=TRADER";
const ORDER_LIST = "/api/admin/positions?tab=orders&take=40";

const KIND_LABEL: Record<SideKind, CrmV3CopyKey> = {
  buy: "sdBuy",
  sell: "sdSell",
};

type Person = { id: string; name?: string | null; email?: string | null; retentionFollowUpAt?: string | null };

type Order = {
  id: string;
  symbol?: string | null;
  side?: string | null;
  userId?: string | null;
  user?: { id?: string | null; name?: string | null; email?: string | null } | null;
};

type GlanceRow = SideRow & { id: string; userId: string };

function utcText(raw: string, locale: string): string {
  const iso = utcInstant(raw);
  if (!iso) return "";
  return `${new Intl.DateTimeFormat(localeTag(locale), { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(new Date(iso))} UTC`;
}

export function SnoozeStrip({ base, locale }: { base: string; locale: string }) {
  const v3 = useV3();
  const data = useJson<{ users?: Person[] }>(USER_LIST);
  const [items, setItems] = useState<Snooze[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [until, setUntil] = useState("");
  const [query, setQuery] = useState("");
  const [snoozed, setSnoozed] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const loaded = followRows((data.data?.users || []).map((person) => ({
    id: person.id,
    name: String(person.name || person.email || person.id),
    at: person.retentionFollowUpAt,
  })));
  const knownKey = loaded.map((row) => row.id).join(",");
  useEffect(() => {
    if (data.loading || data.error) return;
    const known = knownKey ? knownKey.split(",") : [];
    const next = readSnoozes(readJson(FOLLOW_KEY, []), known);
    setItems(next);
    if (known.length) writeJson(FOLLOW_KEY, next);
  }, [data.loading, data.error, knownKey]);
  const shown = visibleFollows(loaded, items, nowMs, query, snoozed);
  const byId = new Map(items.map((item) => [item.id, item]));

  function store(next: Snooze[]) {
    setItems(next);
    writeJson(FOLLOW_KEY, next);
    setNowMs(Date.now());
  }

  return (
    <section className="c3-snooze-strip" aria-label={v3("szTitle")} data-snooze-strip="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("szSub")}</p>
          <h2 className="c3-title">{v3("szTitle")}</h2>
        </div>
        <p className="c3-muted">{shown.length}</p>
      </header>
      <p className="c3-muted">{v3("szHint")}</p>
      <p className="c3-muted">{v3("szLocal")}</p>
      {data.error && <p className="c3-muted">{v3("szFailed")}</p>}
      {!data.loading && !data.error && !loaded.length && <p className="c3-empty">{v3("szNone")}</p>}
      <form className="c3-row" onSubmit={(event) => {
        event.preventDefault();
        const next = setSnooze(items, customerId, until, loaded.map((row) => row.id), new Date().toISOString());
        if (next.length === items.length && next.every((item, index) => item.until === items[index]?.until && item.id === items[index]?.id)) return;
        store(next);
        setUntil("");
        setCustomerId("");
      }}>
        <label className="c3-lab">
          <span>{v3("szCustomer")}</span>
          <select className="c3-select" aria-label={v3("szCustomer")} value={customerId} onChange={(event) => setCustomerId(event.target.value)}>
            <option value="">{v3("szCustomer")}</option>
            {loaded.map((row) => <option key={row.id} value={row.id}>{row.name || row.id}</option>)}
          </select>
        </label>
        <label className="c3-lab">
          <span>{v3("szUntil")}</span>
          <input className="c3-field" type="datetime-local" aria-label={v3("szUntil")} value={until} onChange={(event) => setUntil(event.target.value)} />
        </label>
        <button type="submit" className="c3-btn">{v3("szAdd")}</button>
      </form>
      <p className="c3-muted">{v3("szBlank")}</p>
      <label className="c3-lab">
        <span>{v3("szSearch")}</span>
        <input className="c3-field" aria-label={v3("szSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c3-row" role="group" aria-label={v3("szOpen")}>
        <button type="button" className="c3-chip" data-on={snoozed ? "0" : "1"} aria-pressed={!snoozed} onClick={() => setSnoozed(false)}>{v3("szOpen")}</button>
        <button type="button" className="c3-chip" data-on={snoozed ? "1" : "0"} aria-pressed={snoozed} onClick={() => setSnoozed(true)}>{v3("szSnoozed")}</button>
      </div>
      {!shown.length && <p className="c3-empty">{v3("szEmpty")}</p>}
      <ul className="c3-snooze-list">
        {shown.map((row) => {
          const mark = byId.get(row.id);
          return (
            <li key={row.id} className="c3-snooze-card" data-snoozed={snoozeActive(mark, nowMs) ? "1" : "0"}>
              <p>{row.name || row.id}</p>
              <p className="c3-muted">{v3("szFollow")} {utcText(row.at, locale)}</p>
              {mark && snoozeActive(mark, nowMs) && <p className="c3-muted">{v3("szUntil")} {utcText(mark.until, locale)}</p>}
              <div className="c3-row">
                <Link className="c3-btn" href={crmv3Href(base, `customers/${row.id}`)}>{v3("szCustomerOpen")}</Link>
                {mark && <button type="button" className="c3-btn" onClick={() => store(clearSnooze(items, row.id))}>{v3("szClear")}</button>}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function asOrder(row: Order): GlanceRow | null {
  const id = String(row.id || "").trim();
  if (!id) return null;
  const trader = String(row.user?.name || row.user?.email || "");
  const symbol = String(row.symbol || "");
  return {
    id,
    label: `${symbol} ${trader}`.trim() || id,
    side: String(row.side || ""),
    userId: String(row.user?.id || row.userId || "").trim(),
  };
}

export function SideGlance({ base }: { base: string }) {
  const v3 = useV3();
  const data = useJson<{ orders?: Order[] }>(ORDER_LIST);
  const [hiddenSides, setHiddenSides] = useState<SideKind[]>([]);
  const [selected, setSelected] = useState("");
  const [showHidden, setShowHidden] = useState(false);
  const [query, setQuery] = useState("");
  const orders = (data.data?.orders || []).map(asOrder).filter((row): row is GlanceRow => Boolean(row));
  const present = presentSides(orders);
  const presentKey = present.join(",");
  useEffect(() => {
    if (data.loading || data.error) return;
    const next = readHiddenSides(readJson(SIDE_KEY, []));
    setHiddenSides(next);
    writeJson(SIDE_KEY, next);
  }, [data.loading, data.error, presentKey]);
  const openSides = visibleSides(present, hiddenSides, false);
  const kind = activeSide(selected, showHidden ? visibleSides(present, hiddenSides, true) : openSides);
  const chips = visibleSides(present, hiddenSides, showHidden);
  const split = sideSplit(orders);
  const others = otherSides(orders);
  const shown = visibleOrders(orders, kind, query);

  function store(next: SideKind[], clear: string) {
    setHiddenSides(next);
    writeJson(SIDE_KEY, next);
    if (clear && activeSide(selected, [clear])) setSelected("");
  }

  return (
    <section className="c3-side-glance" aria-label={v3("sdTitle")} data-side-glance="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("sdSub")}</p>
          <h2 className="c3-title">{v3("sdTitle")}</h2>
        </div>
        <p className="c3-muted">{chips.length}</p>
      </header>
      <p className="c3-muted">{v3("sdHint")}</p>
      <p className="c3-muted">{v3("sdLocal")}</p>
      <p className="c3-row">
        <Link className="c3-btn" href={crmv3Href(base, "blotter")}>{v3("sdOpen")}</Link>
      </p>
      {data.loading && !orders.length && <p className="c3-muted">{v3("sdLoading")}</p>}
      {data.error && <p className="c3-muted">{v3("sdFailed")}</p>}
      {!data.loading && !data.error && !orders.length && <p className="c3-empty">{v3("sdNone")}</p>}
      {!data.loading && !present.length && orders.length > 0 && <p className="c3-empty">{v3("sdEmpty")}</p>}
      <p className="c3-muted" data-side-split="">{v3("sdBuy")} {split.buy} · {v3("sdSell")} {split.sell}</p>
      {others.length > 0 && (
        <ul className="c3-side-other">
          {others.map((line) => (
            <li key={line.side} data-side={line.side}>
              <span>{v3("sdOther")}</span>
              <span>{line.side}</span>
              <span className="c3-muted">{line.count}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="c3-row" role="group" aria-label={v3("sdShown")}>
        <button type="button" className="c3-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v3("sdShown")}</button>
        <button type="button" className="c3-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v3("sdHidden")}</button>
      </div>
      <div className="c3-row" role="group" aria-label={v3("sdTitle")}>
        <button type="button" className="c3-chip" data-on={kind ? "0" : "1"} aria-pressed={!kind} onClick={() => setSelected("")}>{v3("sdAll")}</button>
        {chips.map((item) => (
          <span key={item} className="c3-side-pair" data-kind={item}>
            <button type="button" className="c3-chip" data-on={kind === item ? "1" : "0"} aria-pressed={kind === item} onClick={() => setSelected(kind === item ? "" : item)}>{v3(KIND_LABEL[item])}</button>
            <button type="button" className="c3-btn" onClick={() => store(toggleSide(hiddenSides, item), showHidden ? "" : item)}>{showHidden ? v3("sdShow") : v3("sdHide")}</button>
          </span>
        ))}
      </div>
      <label className="c3-lab">
        <span>{v3("sdSearch")}</span>
        <input className="c3-field" aria-label={v3("sdSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!shown.length && orders.length > 0 && <p className="c3-empty">{v3("sdEmpty")}</p>}
      <ul className="c3-side-rows">
        {shown.map((row) => (
          <li key={row.id} data-side={String(row.side || "").trim().toUpperCase()}>
            <p>{row.label}</p>
            <p className="c3-muted">{String(row.side || "").trim().toUpperCase()}</p>
            {row.userId && <Link className="c3-btn" href={crmv3Href(base, `customers/${row.userId}`)}>{v3("sdCustomer")}</Link>}
          </li>
        ))}
      </ul>
    </section>
  );
}
