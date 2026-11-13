"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import {
  SIDE_KEY,
  SNOOZE_KEY,
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
} from "@/lib/crmv4/round81";
import { crmv4Href } from "@/lib/crmv4/sections";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const LISTS = {
  users: "/api/admin/users?take=40&meta=0&role=TRADER",
  orders: "/api/admin/positions?tab=orders&take=40",
} as const;

const KIND_LABEL: Record<SideKind, CrmV4CopyKey> = {
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
  return `${new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(new Date(iso))} UTC`;
}

export function SnoozeStrip({ base, v4, locale }: { base: string; v4: V4; locale: string }) {
  const data = useJson<{ users?: Person[] }>(LISTS.users);
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
    const next = readSnoozes(readJson(SNOOZE_KEY, []), known);
    setItems(next);
    if (known.length) writeJson(SNOOZE_KEY, next);
  }, [data.loading, data.error, knownKey]);
  const shown = visibleFollows(loaded, items, nowMs, query, snoozed);
  const byId = new Map(items.map((item) => [item.id, item]));

  function store(next: Snooze[]) {
    setItems(next);
    writeJson(SNOOZE_KEY, next);
    setNowMs(Date.now());
  }

  return (
    <section className="c4-snooze-strip c4-snooze-court" aria-label={v4("szTitle")} data-snooze-strip="1" data-desk="court">
      <header className="c4-snooze-court-mast">
        <p className="c4-snooze-court-seal" data-logo="mono">7FX</p>
        <div>
          <p className="c4-snooze-court-kicker">{v4("szCourtKicker")}</p>
          <h2 className="c4-title c4-snooze-court-title">{v4("szTitle")}</h2>
          <p className="c4-snooze-court-lead">{v4("szCourtLead")}</p>
        </div>
        <p className="c4-snooze-court-count">{shown.length}</p>
      </header>
      <ol className="c4-snooze-court-index" aria-label={v4("szTitle")}>
        <li data-tone="gold">{v4("szSnoozed")}</li>
        <li data-tone="ink">{v4("szOpen")}</li>
        <li data-tone="ivory">{v4("szFollow")}</li>
      </ol>
      <p className="c4-meta">{v4("szHint")}</p>
      <p className="c4-meta">{v4("szLocal")}</p>
      {data.error && <p className="c4-meta">{v4("szFailed")}</p>}
      {!data.loading && !data.error && !loaded.length && <p className="c4-pay-empty">{v4("szNone")}</p>}
      <form className="c4-row" onSubmit={(event) => {
        event.preventDefault();
        const next = setSnooze(items, customerId, until, loaded.map((row) => row.id), new Date().toISOString());
        if (next.length === items.length && next.every((item, index) => item.until === items[index]?.until && item.id === items[index]?.id)) return;
        store(next);
        setUntil("");
        setCustomerId("");
      }}>
        <label className="c4-lab">
          <span>{v4("szCustomer")}</span>
          <select className="c4-select" aria-label={v4("szCustomer")} value={customerId} onChange={(event) => setCustomerId(event.target.value)}>
            <option value="">{v4("szCustomer")}</option>
            {loaded.map((row) => <option key={row.id} value={row.id}>{row.name || row.id}</option>)}
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("szUntil")}</span>
          <input className="c4-field" type="datetime-local" aria-label={v4("szUntil")} value={until} onChange={(event) => setUntil(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn">{v4("szAdd")}</button>
      </form>
      <p className="c4-meta">{v4("szBlank")}</p>
      <label className="c4-lab">
        <span>{v4("szSearch")}</span>
        <input className="c4-field" aria-label={v4("szSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c4-row" role="group" aria-label={v4("szOpen")}>
        <button type="button" className="c4-chip" data-on={snoozed ? "0" : "1"} aria-pressed={!snoozed} onClick={() => setSnoozed(false)}>{v4("szOpen")}</button>
        <button type="button" className="c4-chip" data-on={snoozed ? "1" : "0"} aria-pressed={snoozed} onClick={() => setSnoozed(true)}>{v4("szSnoozed")}</button>
      </div>
      {!shown.length && <p className="c4-pay-empty c4-snooze-court-empty">{v4("szEmpty")}</p>}
      <ul className="c4-snooze-list c4-snooze-court-list">
        {shown.map((row) => {
          const mark = byId.get(row.id);
          return (
            <li key={row.id} className="c4-snooze-card c4-snooze-court-card" data-snoozed={snoozeActive(mark, nowMs) ? "1" : "0"}>
              <p>{row.name || row.id}</p>
              <p className="c4-meta">{v4("szFollow")} {utcText(row.at, locale)}</p>
              {mark && snoozeActive(mark, nowMs) && <p className="c4-meta">{v4("szUntil")} {utcText(mark.until, locale)}</p>}
              <div className="c4-row">
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{v4("szCustomerOpen")}</Link>
                {mark && <button type="button" className="c4-btn" onClick={() => store(clearSnooze(items, row.id))}>{v4("szClear")}</button>}
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

export function SideGlance({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ orders?: Order[] }>(LISTS.orders);
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
    <section className="c4-side-glance" aria-label={v4("sdTitle")} data-side-glance="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-pay-kicker">{v4("sdSub")}</p>
          <h2 className="c4-title">{v4("sdTitle")}</h2>
        </div>
        <p className="c4-meta">{chips.length}</p>
      </header>
      <p className="c4-meta">{v4("sdHint")}</p>
      <p className="c4-meta">{v4("sdLocal")}</p>
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "blotter")}>{v4("sdOpen")}</Link>
      </p>
      {data.loading && !orders.length && <p className="c4-meta">{v4("sdLoading")}</p>}
      {data.error && <p className="c4-meta">{v4("sdFailed")}</p>}
      {!data.loading && !data.error && !orders.length && <p className="c4-pay-empty">{v4("sdNone")}</p>}
      {!data.loading && !present.length && orders.length > 0 && <p className="c4-pay-empty">{v4("sdEmpty")}</p>}
      <p className="c4-meta" data-side-split="">{v4("sdBuy")} {split.buy} · {v4("sdSell")} {split.sell}</p>
      {others.length > 0 && (
        <ul className="c4-side-other">
          {others.map((line) => (
            <li key={line.side} data-side={line.side}>
              <span>{v4("sdOther")}</span>
              <span>{line.side}</span>
              <span className="c4-meta">{line.count}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="c4-row" role="group" aria-label={v4("sdShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("sdShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("sdHidden")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("sdTitle")}>
        <button type="button" className="c4-chip" data-on={kind ? "0" : "1"} aria-pressed={!kind} onClick={() => setSelected("")}>{v4("sdAll")}</button>
        {chips.map((item) => (
          <span key={item} className="c4-side-pair" data-kind={item}>
            <button type="button" className="c4-chip" data-on={kind === item ? "1" : "0"} aria-pressed={kind === item} onClick={() => setSelected(kind === item ? "" : item)}>{v4(KIND_LABEL[item])}</button>
            <button type="button" className="c4-btn" onClick={() => store(toggleSide(hiddenSides, item), showHidden ? "" : item)}>{showHidden ? v4("sdShow") : v4("sdHide")}</button>
          </span>
        ))}
      </div>
      <label className="c4-lab">
        <span>{v4("sdSearch")}</span>
        <input className="c4-field" aria-label={v4("sdSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!shown.length && orders.length > 0 && <p className="c4-pay-empty">{v4("sdEmpty")}</p>}
      <ul className="c4-side-rows">
        {shown.map((row) => (
          <li key={row.id} data-side={String(row.side || "").trim().toUpperCase()}>
            <p>{row.label}</p>
            <p className="c4-meta">{String(row.side || "").trim().toUpperCase()}</p>
            {row.userId && <Link className="c4-btn" href={crmv4Href(base, `customers/${row.userId}`)}>{v4("sdCustomer")}</Link>}
          </li>
        ))}
      </ul>
    </section>
  );
}
