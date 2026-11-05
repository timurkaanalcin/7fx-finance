"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import {
  METHOD_KEY,
  SNOOZE_KEY,
  activeMethod,
  clearSnoozes,
  methodLines,
  methodText,
  namedMethods,
  readHiddenMethods,
  readSnoozes,
  snoozeCustomer,
  toggleMethod,
  visibleDeposits,
  visibleMethods,
  visiblePeople,
  wakeCustomer,
  type Method,
  type MethodRow,
  type Person,
  type Snooze,
} from "@/lib/crmv4/round104";
import { crmv4Href } from "@/lib/crmv4/sections";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

type Deposit = {
  id: string;
  method?: Method;
  userId?: string | null;
  user?: { id?: string | null; name?: string | null; email?: string | null } | null;
};

type GlanceRow = MethodRow & { id: string };

export function SnoozeList({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [snoozes, setSnoozes] = useState<Snooze[]>([]);
  const [note, setNote] = useState("");
  const [query, setQuery] = useState("");
  const [snoozed, setSnoozed] = useState(false);
  const rows = (data.data?.users || []).map((row) => ({
    id: String(row.id || "").trim(),
    name: row.name,
    email: row.email,
  })).filter((row) => row.id);
  const present = rows.map((row) => row.id);
  const presentKey = present.join("\n");
  useEffect(() => {
    if (data.loading || data.error) return;
    const next = readSnoozes(readJson(SNOOZE_KEY, []), presentKey ? presentKey.split("\n") : []);
    setSnoozes(next);
    writeJson(SNOOZE_KEY, next);
  }, [data.loading, data.error, presentKey]);
  const shown = visiblePeople(rows, snoozes, query, snoozed);
  const notes = new Map(snoozes.map((item) => [item.id, item.note]));

  function store(next: Snooze[]) {
    setSnoozes(next);
    writeJson(SNOOZE_KEY, next);
  }

  return (
    <section className="c4-snooze-list" aria-label={v4("nqTitle")} data-snooze-list="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-pay-kicker">{v4("nqSub")}</p>
          <h2 className="c4-title">{v4("nqTitle")}</h2>
        </div>
        <p className="c4-meta">{snoozes.length}</p>
      </header>
      <p className="c4-meta">{v4("nqHint")}</p>
      <p className="c4-meta">{v4("nqLocal")}</p>
      <p className="c4-meta">{v4("nqBlank")}</p>
      <label className="c4-lab">
        <span>{v4("nqNote")}</span>
        <input className="c4-field" aria-label={v4("nqNote")} value={note} maxLength={80} onChange={(event) => setNote(event.target.value)} />
      </label>
      {snoozes.length > 0 && <button type="button" className="c4-btn" onClick={() => store(clearSnoozes())}>{v4("nqClear")}</button>}
      <label className="c4-lab">
        <span>{v4("nqSearch")}</span>
        <input className="c4-field" aria-label={v4("nqSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c4-row" role="group" aria-label={v4("nqShown")}>
        <button type="button" className="c4-chip" data-on={snoozed ? "0" : "1"} aria-pressed={!snoozed} onClick={() => setSnoozed(false)}>{v4("nqShown")}</button>
        <button type="button" className="c4-chip" data-on={snoozed ? "1" : "0"} aria-pressed={snoozed} onClick={() => setSnoozed(true)}>{v4("nqHidden")}</button>
      </div>
      {data.loading && !rows.length && <p className="c4-meta">{v4("nqLoading")}</p>}
      {data.error && <p className="c4-meta">{v4("nqFailed")}</p>}
      {!data.loading && !data.error && !rows.length && <p className="c4-pay-empty">{v4("nqNone")}</p>}
      {!shown.length && rows.length > 0 && <p className="c4-pay-empty">{v4("nqEmpty")}</p>}
      <ul className="c4-snooze-rows">
        {shown.map((row) => {
          const saved = notes.get(row.id);
          return (
            <li key={row.id} data-customer={row.id} data-snoozed={saved !== undefined ? "1" : "0"}>
              <p>{row.name || row.email || row.id}</p>
              <p className="c4-meta">{row.email || ""}</p>
              {saved ? <p className="c4-meta">{saved}</p> : null}
              <div className="c4-row">
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{v4("nqOpen")}</Link>
                {saved !== undefined ? (
                  <button type="button" className="c4-btn" onClick={() => store(wakeCustomer(snoozes, row.id, present))}>{v4("nqWake")}</button>
                ) : (
                  <button type="button" className="c4-btn" onClick={() => store(snoozeCustomer(snoozes, row.id, note, present))}>{v4("nqSnooze")}</button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function DepositMethod({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ requests?: Deposit[] }>("/api/admin/deposits?take=40");
  const [hiddenMethods, setHiddenMethods] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [blank, setBlank] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [query, setQuery] = useState("");
  const rows = (data.data?.requests || []).map((row): GlanceRow | null => {
    const id = String(row.id || "").trim();
    if (!id) return null;
    return {
      id,
      method: row.method,
      label: String(row.user?.name || row.user?.email || "").trim(),
    };
  }).filter((row): row is GlanceRow => Boolean(row));
  const lines = methodLines(rows);
  const present = namedMethods(rows);
  const presentKey = present.join("\n");
  const blankCount = lines.find((line) => !line.method)?.count || 0;
  useEffect(() => {
    if (data.loading || data.error) return;
    const next = readHiddenMethods(readJson(METHOD_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHiddenMethods(next);
    writeJson(METHOD_KEY, next);
  }, [data.loading, data.error, presentKey]);
  const chips = visibleMethods(present, hiddenMethods, showHidden);
  const method = activeMethod(selected, chips);
  const shown = visibleDeposits(rows, method, blank, query);

  function store(next: string[], clear: string) {
    setHiddenMethods(next);
    writeJson(METHOD_KEY, next);
    if (clear && activeMethod(selected, [clear])) setSelected("");
  }

  return (
    <section className="c4-dep-method" aria-label={v4("mgTitle")} data-dep-method="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-pay-kicker">{v4("mgSub")}</p>
          <h2 className="c4-title">{v4("mgTitle")}</h2>
        </div>
        <p className="c4-meta">{chips.length}</p>
      </header>
      <p className="c4-meta">{v4("mgHint")}</p>
      <p className="c4-meta">{v4("mgLocal")}</p>
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "depboard")}>{v4("mgBoard")}</Link>
      </p>
      {data.loading && !rows.length && <p className="c4-meta">{v4("mgLoading")}</p>}
      {data.error && <p className="c4-meta">{v4("mgFailed")}</p>}
      {!data.loading && !data.error && !rows.length && <p className="c4-pay-empty">{v4("mgNone")}</p>}
      {blankCount > 0 && (
        <button type="button" className="c4-mg-blank" data-on={blank ? "1" : "0"} aria-pressed={blank} onClick={() => { setBlank((value) => !value); setSelected(""); }}>
          <span>{v4("mgBlank")}</span>
          <span className="c4-meta">{blankCount}</span>
        </button>
      )}
      <div className="c4-row" role="group" aria-label={v4("mgShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("mgShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("mgHidden")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("mgTitle")}>
        <button type="button" className="c4-chip" data-on={!method && !blank ? "1" : "0"} aria-pressed={!method && !blank} onClick={() => { setSelected(""); setBlank(false); }}>{v4("mgAll")}</button>
        {chips.map((item) => {
          const count = lines.find((line) => line.method === item)?.count || 0;
          return (
            <span key={item} className="c4-mg-pair" data-method={item}>
              <button type="button" className="c4-chip" data-on={method === item ? "1" : "0"} aria-pressed={method === item} onClick={() => { setBlank(false); setSelected(method === item ? "" : item); }}>{item} {count}</button>
              <button type="button" className="c4-btn" onClick={() => store(toggleMethod(hiddenMethods, item, present), showHidden ? "" : item)}>{showHidden ? v4("mgShow") : v4("mgHide")}</button>
            </span>
          );
        })}
      </div>
      <label className="c4-lab">
        <span>{v4("mgSearch")}</span>
        <input className="c4-field" aria-label={v4("mgSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c4-pay-empty">{v4("mgEmpty")}</p>}
      <ul className="c4-mg-rows">
        {shown.map((row) => {
          const name = methodText(row.method);
          return (
            <li key={row.id} data-method={name || "blank"}>
              <p>{row.label || row.id}</p>
              <p className="c4-meta">{name || v4("mgBlank")}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
