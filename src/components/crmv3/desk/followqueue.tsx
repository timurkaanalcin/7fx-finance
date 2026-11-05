"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readJson, writeJson } from "@/lib/crmv3/bridge";
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
} from "@/lib/crmv3/followqueue";
import { crmv3Href } from "@/lib/crmv3/sections";
import { useJson } from "../kit";
import { useV3 } from "./store";

type Person = { id: string; name?: string | null; email?: string | null };

type Ticket = {
  id: string;
  status?: string | null;
  customer?: string | null;
  customerEmail?: string | null;
  customerId?: string | null;
};

type GlanceRow = StatusRow & { id: string; userId: string };

export function FollowQueue({ base }: { base: string }) {
  const v3 = useV3();
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
    <section className="c3-follow-queue" aria-label={v3("ffTitle")} data-follow-queue="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-pay-kicker">{v3("ffSub")}</p>
          <h2 className="c3-title">{v3("ffTitle")}</h2>
        </div>
        <p className="c3-meta">{follows.filter((item) => !item.done).length}</p>
      </header>
      <p className="c3-meta">{v3("ffHint")}</p>
      <p className="c3-meta">{v3("ffLocal")}</p>
      <p className="c3-meta">{v3("ffBlank")}</p>
      <form className="c3-row" onSubmit={(event) => {
        event.preventDefault();
        const next = addFollow(follows, { id: customer, note }, present);
        if (next.length === follows.length) return;
        store(next);
        setNote("");
      }}>
        <label className="c3-lab">
          <span>{v3("ffCustomer")}</span>
          <select className="c3-field" aria-label={v3("ffCustomer")} value={customer} onChange={(event) => setCustomer(event.target.value)}>
            <option value="">{v3("ffCustomer")}</option>
            {people.map((row) => <option key={row.id} value={row.id}>{row.name || row.email || row.id}</option>)}
          </select>
        </label>
        <label className="c3-lab">
          <span>{v3("ffNote")}</span>
          <input className="c3-field" aria-label={v3("ffNote")} value={note} maxLength={80} onChange={(event) => setNote(event.target.value)} />
        </label>
        <button type="submit" className="c3-btn">{v3("ffAdd")}</button>
      </form>
      {follows.length > 0 && <button type="button" className="c3-btn" onClick={() => store(clearFollows())}>{v3("ffClearAll")}</button>}
      <label className="c3-lab">
        <span>{v3("ffSearch")}</span>
        <input className="c3-field" aria-label={v3("ffSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c3-row" role="group" aria-label={v3("ffShown")}>
        <button type="button" className="c3-chip" data-on={done ? "0" : "1"} aria-pressed={!done} onClick={() => setDone(false)}>{v3("ffShown")}</button>
        <button type="button" className="c3-chip" data-on={done ? "1" : "0"} aria-pressed={done} onClick={() => setDone(true)}>{v3("ffHidden")}</button>
      </div>
      {data.loading && !people.length && <p className="c3-meta">{v3("ffLoading")}</p>}
      {data.error && <p className="c3-meta">{v3("ffFailed")}</p>}
      {!data.loading && !data.error && !people.length && <p className="c3-pay-empty">{v3("ffNone")}</p>}
      {!shown.length && people.length > 0 && <p className="c3-pay-empty">{v3("ffEmpty")}</p>}
      <ul className="c3-follow-rows">
        {shown.map((row, index) => (
          <li key={row.id} data-customer={row.id} data-done={done ? "1" : "0"} data-order={row.order}>
            <p>{row.name || row.email || row.id}</p>
            {row.note ? <p className="c3-meta">{row.note}</p> : null}
            <div className="c3-row">
              <button type="button" className="c3-btn" disabled={index === 0} onClick={() => store(moveFollow(follows, row.id, -1, present))}>{v3("ffUp")}</button>
              <button type="button" className="c3-btn" disabled={index === shown.length - 1} onClick={() => store(moveFollow(follows, row.id, 1, present))}>{v3("ffDown")}</button>
              <button type="button" className="c3-btn" onClick={() => store(setFollowDone(follows, row.id, !done, present))}>{done ? v3("ffUndo") : v3("ffDone")}</button>
              <button type="button" className="c3-btn" onClick={() => store(clearFollow(follows, row.id, present))}>{v3("ffClear")}</button>
              <Link className="c3-btn" href={crmv3Href(base, `customers/${row.id}`)}>{v3("ffOpen")}</Link>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function TicketStatus({ base }: { base: string }) {
  const v3 = useV3();
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
    <section className="c3-ticket-glance" aria-label={v3("tzTitle")} data-ticket-glance="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-pay-kicker">{v3("tzSub")}</p>
          <h2 className="c3-title">{v3("tzTitle")}</h2>
        </div>
        <p className="c3-meta">{chips.length}</p>
      </header>
      <p className="c3-meta">{v3("tzHint")}</p>
      <p className="c3-meta">{v3("tzLocal")}</p>
      <p className="c3-row">
        <Link className="c3-btn" href={crmv3Href(base, "support")}>{v3("tzBoard")}</Link>
      </p>
      {data.loading && !rows.length && <p className="c3-meta">{v3("tzLoading")}</p>}
      {data.error && <p className="c3-meta">{v3("tzFailed")}</p>}
      {!data.loading && !data.error && !rows.length && <p className="c3-pay-empty">{v3("tzNone")}</p>}
      {blankCount > 0 && (
        <button type="button" className="c3-tz-blank" data-on={blank ? "1" : "0"} aria-pressed={blank} onClick={() => { setBlank((value) => !value); setSelected(""); }}>
          <span>{v3("tzBlank")}</span>
          <span className="c3-meta">{blankCount}</span>
        </button>
      )}
      <div className="c3-row" role="group" aria-label={v3("tzShown")}>
        <button type="button" className="c3-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v3("tzShown")}</button>
        <button type="button" className="c3-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v3("tzHidden")}</button>
      </div>
      <div className="c3-row" role="group" aria-label={v3("tzTitle")}>
        <button type="button" className="c3-chip" data-on={!status && !blank ? "1" : "0"} aria-pressed={!status && !blank} onClick={() => { setSelected(""); setBlank(false); }}>{v3("tzAll")}</button>
        {chips.map((item) => {
          const count = lines.find((line) => line.status === item)?.count || 0;
          return (
            <span key={item} className="c3-tz-pair" data-status={item}>
              <button type="button" className="c3-chip" data-on={status === item ? "1" : "0"} aria-pressed={status === item} onClick={() => { setBlank(false); setSelected(status === item ? "" : item); }}>{item} {count}</button>
              <button type="button" className="c3-btn" onClick={() => store(toggleStatus(hiddenStatuses, item, present), showHidden ? "" : item)}>{showHidden ? v3("tzShow") : v3("tzHide")}</button>
            </span>
          );
        })}
      </div>
      <label className="c3-lab">
        <span>{v3("tzSearch")}</span>
        <input className="c3-field" aria-label={v3("tzSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c3-pay-empty">{v3("tzEmpty")}</p>}
      <ul className="c3-tz-rows">
        {shown.map((row) => {
          const name = statusText(row.status);
          return (
            <li key={row.id} data-status={name || "blank"}>
              <p>{row.label || row.id}</p>
              <p className="c3-meta">{name || v3("tzBlank")}</p>
              {row.userId && <Link className="c3-btn" href={crmv3Href(base, `customers/${row.userId}`)}>{v3("tzCustomer")}</Link>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
