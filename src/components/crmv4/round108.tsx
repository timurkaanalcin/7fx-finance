"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import {
  FOLLOW_KEY,
  TICKET_STATUS_KEY,
  activeStatus,
  addFollow,
  clearFollow,
  clearFollows,
  moveFollow,
  namedStatuses,
  readFollows,
  readHiddenStatuses,
  setFollowDone,
  statusLines,
  statusText,
  toggleStatus,
  visibleFollows,
  visibleStatuses,
  visibleTickets,
  type Follow,
  type StatusRow,
} from "@/lib/crmv4/round108";
import { crmv4Href } from "@/lib/crmv4/sections";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = { id: string; name?: string | null; email?: string | null };

type Ticket = {
  id: string;
  status?: string | null;
  customer?: string | null;
  customerEmail?: string | null;
  customerId?: string | null;
};

type GlanceRow = StatusRow & { id: string; userId: string };

export function FollowQueue({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [follows, setFollows] = useState<Follow[]>([]);
  const [customer, setCustomer] = useState("");
  const [note, setNote] = useState("");
  const [query, setQuery] = useState("");
  const [done, setDone] = useState(false);
  const people = (data.data?.users || []).map((row) => ({
    id: String(row.id || "").trim(),
    name: row.name,
    email: row.email,
  })).filter((row) => row.id);
  const present = people.map((row) => row.id);
  const presentKey = present.join("\n");
  useEffect(() => {
    if (data.loading || data.error) return;
    const next = readFollows(readJson(FOLLOW_KEY, []), presentKey ? presentKey.split("\n") : []);
    setFollows(next);
    writeJson(FOLLOW_KEY, next);
  }, [data.loading, data.error, presentKey]);
  const shown = visibleFollows(people, follows, query, done);

  function store(next: Follow[]) {
    setFollows(next);
    writeJson(FOLLOW_KEY, next);
  }

  return (
    <section className="c4-follow-queue" aria-label={v4("ffTitle")} data-follow-queue="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-pay-kicker">{v4("ffSub")}</p>
          <h2 className="c4-title">{v4("ffTitle")}</h2>
        </div>
        <p className="c4-meta">{follows.filter((item) => !item.done).length}</p>
      </header>
      <p className="c4-meta">{v4("ffHint")}</p>
      <p className="c4-meta">{v4("ffLocal")}</p>
      <p className="c4-meta">{v4("ffBlank")}</p>
      <form className="c4-row" onSubmit={(event) => {
        event.preventDefault();
        const next = addFollow(follows, { id: customer, note }, present);
        if (next.length === follows.length) return;
        store(next);
        setNote("");
      }}>
        <label className="c4-lab">
          <span>{v4("ffCustomer")}</span>
          <select className="c4-field" aria-label={v4("ffCustomer")} value={customer} onChange={(event) => setCustomer(event.target.value)}>
            <option value="">{v4("ffCustomer")}</option>
            {people.map((row) => <option key={row.id} value={row.id}>{row.name || row.email || row.id}</option>)}
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("ffNote")}</span>
          <input className="c4-field" aria-label={v4("ffNote")} value={note} maxLength={80} onChange={(event) => setNote(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn">{v4("ffAdd")}</button>
      </form>
      {follows.length > 0 && <button type="button" className="c4-btn" onClick={() => store(clearFollows())}>{v4("ffClearAll")}</button>}
      <label className="c4-lab">
        <span>{v4("ffSearch")}</span>
        <input className="c4-field" aria-label={v4("ffSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c4-row" role="group" aria-label={v4("ffShown")}>
        <button type="button" className="c4-chip" data-on={done ? "0" : "1"} aria-pressed={!done} onClick={() => setDone(false)}>{v4("ffShown")}</button>
        <button type="button" className="c4-chip" data-on={done ? "1" : "0"} aria-pressed={done} onClick={() => setDone(true)}>{v4("ffHidden")}</button>
      </div>
      {data.loading && !people.length && <p className="c4-meta">{v4("ffLoading")}</p>}
      {data.error && <p className="c4-meta">{v4("ffFailed")}</p>}
      {!data.loading && !data.error && !people.length && <p className="c4-pay-empty">{v4("ffNone")}</p>}
      {!shown.length && people.length > 0 && <p className="c4-pay-empty">{v4("ffEmpty")}</p>}
      <ul className="c4-follow-rows">
        {shown.map((row, index) => (
          <li key={row.id} data-customer={row.id} data-done={done ? "1" : "0"} data-order={row.order}>
            <p>{row.name || row.email || row.id}</p>
            {row.note ? <p className="c4-meta">{row.note}</p> : null}
            <div className="c4-row">
              <button type="button" className="c4-btn" disabled={index === 0} onClick={() => store(moveFollow(follows, row.id, -1, present))}>{v4("ffUp")}</button>
              <button type="button" className="c4-btn" disabled={index === shown.length - 1} onClick={() => store(moveFollow(follows, row.id, 1, present))}>{v4("ffDown")}</button>
              <button type="button" className="c4-btn" onClick={() => store(setFollowDone(follows, row.id, !done, present))}>{done ? v4("ffUndo") : v4("ffDone")}</button>
              <button type="button" className="c4-btn" onClick={() => store(clearFollow(follows, row.id, present))}>{v4("ffClear")}</button>
              <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{v4("ffOpen")}</Link>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function TicketStatus({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ tickets?: Ticket[] }>("/api/admin/tickets?take=40");
  const [hiddenStatuses, setHiddenStatuses] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [blank, setBlank] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [query, setQuery] = useState("");
  const rows = (data.data?.tickets || []).map((row): GlanceRow | null => {
    const id = String(row.id || "").trim();
    if (!id) return null;
    return {
      id,
      status: row.status,
      label: String(row.customer || row.customerEmail || "").trim(),
      userId: String(row.customerId || "").trim(),
    };
  }).filter((row): row is GlanceRow => Boolean(row));
  const lines = statusLines(rows);
  const present = namedStatuses(rows);
  const presentKey = present.join("\n");
  const blankCount = lines.find((line) => !line.status)?.count || 0;
  useEffect(() => {
    if (data.loading || data.error) return;
    const next = readHiddenStatuses(readJson(TICKET_STATUS_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHiddenStatuses(next);
    writeJson(TICKET_STATUS_KEY, next);
  }, [data.loading, data.error, presentKey]);
  const chips = visibleStatuses(present, hiddenStatuses, showHidden);
  const status = activeStatus(selected, chips);
  const shown = visibleTickets(rows, status, blank, query);

  function store(next: string[], clear: string) {
    setHiddenStatuses(next);
    writeJson(TICKET_STATUS_KEY, next);
    if (clear && activeStatus(selected, [clear])) setSelected("");
  }

  return (
    <section className="c4-ticket-glance" aria-label={v4("tzTitle")} data-ticket-glance="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-pay-kicker">{v4("tzSub")}</p>
          <h2 className="c4-title">{v4("tzTitle")}</h2>
        </div>
        <p className="c4-meta">{chips.length}</p>
      </header>
      <p className="c4-meta">{v4("tzHint")}</p>
      <p className="c4-meta">{v4("tzLocal")}</p>
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "support")}>{v4("tzBoard")}</Link>
      </p>
      {data.loading && !rows.length && <p className="c4-meta">{v4("tzLoading")}</p>}
      {data.error && <p className="c4-meta">{v4("tzFailed")}</p>}
      {!data.loading && !data.error && !rows.length && <p className="c4-pay-empty">{v4("tzNone")}</p>}
      {blankCount > 0 && (
        <button type="button" className="c4-tz-blank" data-on={blank ? "1" : "0"} aria-pressed={blank} onClick={() => { setBlank((value) => !value); setSelected(""); }}>
          <span>{v4("tzBlank")}</span>
          <span className="c4-meta">{blankCount}</span>
        </button>
      )}
      <div className="c4-row" role="group" aria-label={v4("tzShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("tzShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("tzHidden")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("tzTitle")}>
        <button type="button" className="c4-chip" data-on={!status && !blank ? "1" : "0"} aria-pressed={!status && !blank} onClick={() => { setSelected(""); setBlank(false); }}>{v4("tzAll")}</button>
        {chips.map((item) => {
          const count = lines.find((line) => line.status === item)?.count || 0;
          return (
            <span key={item} className="c4-tz-pair" data-status={item}>
              <button type="button" className="c4-chip" data-on={status === item ? "1" : "0"} aria-pressed={status === item} onClick={() => { setBlank(false); setSelected(status === item ? "" : item); }}>{item} {count}</button>
              <button type="button" className="c4-btn" onClick={() => store(toggleStatus(hiddenStatuses, item, present), showHidden ? "" : item)}>{showHidden ? v4("tzShow") : v4("tzHide")}</button>
            </span>
          );
        })}
      </div>
      <label className="c4-lab">
        <span>{v4("tzSearch")}</span>
        <input className="c4-field" aria-label={v4("tzSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c4-pay-empty">{v4("tzEmpty")}</p>}
      <ul className="c4-tz-rows">
        {shown.map((row) => {
          const name = statusText(row.status);
          return (
            <li key={row.id} data-status={name || "blank"}>
              <p>{row.label || row.id}</p>
              <p className="c4-meta">{name || v4("tzBlank")}</p>
              {row.userId && <Link className="c4-btn" href={crmv4Href(base, `customers/${row.userId}`)}>{v4("tzCustomer")}</Link>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
