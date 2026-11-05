"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readJson, writeJson } from "@/lib/crmv3/bridge";
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
} from "@/lib/crmv3/snoozelist";
import { crmv3Href } from "@/lib/crmv3/sections";
import { useJson } from "../kit";
import { useV3 } from "./store";

const USERS = "/api/admin/users?take=40&meta=0&role=TRADER";
const DEPOSITS = "/api/admin/deposits?take=40";

type Deposit = {
  id: string;
  method?: Method;
  userId?: string | null;
  user?: { id?: string | null; name?: string | null; email?: string | null } | null;
};

type GlanceRow = MethodRow & { id: string };

export function SnoozeList({ base }: { base: string }) {
  const v3 = useV3();
  const data = useJson<{ users?: Person[] }>(USERS);
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
    <section className="c3-snooze-list" aria-label={v3("nqTitle")} data-snooze-list="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("nqSub")}</p>
          <h2 className="c3-title">{v3("nqTitle")}</h2>
        </div>
        <p className="c3-muted">{snoozes.length}</p>
      </header>
      <p className="c3-muted">{v3("nqHint")}</p>
      <p className="c3-muted">{v3("nqLocal")}</p>
      <p className="c3-muted">{v3("nqBlank")}</p>
      <label className="c3-lab">
        <span>{v3("nqNote")}</span>
        <input className="c3-field" aria-label={v3("nqNote")} value={note} maxLength={80} onChange={(event) => setNote(event.target.value)} />
      </label>
      {snoozes.length > 0 && <button type="button" className="c3-btn" onClick={() => store(clearSnoozes())}>{v3("nqClear")}</button>}
      <label className="c3-lab">
        <span>{v3("nqSearch")}</span>
        <input className="c3-field" aria-label={v3("nqSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c3-row" role="group" aria-label={v3("nqShown")}>
        <button type="button" className="c3-chip" data-on={snoozed ? "0" : "1"} aria-pressed={!snoozed} onClick={() => setSnoozed(false)}>{v3("nqShown")}</button>
        <button type="button" className="c3-chip" data-on={snoozed ? "1" : "0"} aria-pressed={snoozed} onClick={() => setSnoozed(true)}>{v3("nqHidden")}</button>
      </div>
      {data.loading && !rows.length && <p className="c3-muted">{v3("nqLoading")}</p>}
      {data.error && <p className="c3-muted">{v3("nqFailed")}</p>}
      {!data.loading && !data.error && !rows.length && <p className="c3-empty">{v3("nqNone")}</p>}
      {!shown.length && rows.length > 0 && <p className="c3-empty">{v3("nqEmpty")}</p>}
      <ul className="c3-snooze-rows">
        {shown.map((row) => {
          const saved = notes.get(row.id);
          return (
            <li key={row.id} data-customer={row.id} data-snoozed={saved !== undefined ? "1" : "0"}>
              <p>{row.name || row.email || row.id}</p>
              <p className="c3-muted">{row.email || ""}</p>
              {saved ? <p className="c3-muted">{saved}</p> : null}
              <div className="c3-row">
                <Link className="c3-btn" href={crmv3Href(base, `customers/${row.id}`)}>{v3("nqOpen")}</Link>
                {saved !== undefined ? (
                  <button type="button" className="c3-btn" onClick={() => store(wakeCustomer(snoozes, row.id, present))}>{v3("nqWake")}</button>
                ) : (
                  <button type="button" className="c3-btn" onClick={() => store(snoozeCustomer(snoozes, row.id, note, present))}>{v3("nqSnooze")}</button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function DepositMethod({ base }: { base: string }) {
  const v3 = useV3();
  const data = useJson<{ requests?: Deposit[] }>(DEPOSITS);
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
    <section className="c3-dep-method" aria-label={v3("mgTitle")} data-dep-method="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("mgSub")}</p>
          <h2 className="c3-title">{v3("mgTitle")}</h2>
        </div>
        <p className="c3-muted">{chips.length}</p>
      </header>
      <p className="c3-muted">{v3("mgHint")}</p>
      <p className="c3-muted">{v3("mgLocal")}</p>
      <p className="c3-row">
        <Link className="c3-btn" href={crmv3Href(base, "depboard")}>{v3("mgBoard")}</Link>
      </p>
      {data.loading && !rows.length && <p className="c3-muted">{v3("mgLoading")}</p>}
      {data.error && <p className="c3-muted">{v3("mgFailed")}</p>}
      {!data.loading && !data.error && !rows.length && <p className="c3-empty">{v3("mgNone")}</p>}
      {blankCount > 0 && (
        <button type="button" className="c3-mg-blank" data-on={blank ? "1" : "0"} aria-pressed={blank} onClick={() => { setBlank((value) => !value); setSelected(""); }}>
          <span>{v3("mgBlank")}</span>
          <span className="c3-muted">{blankCount}</span>
        </button>
      )}
      <div className="c3-row" role="group" aria-label={v3("mgShown")}>
        <button type="button" className="c3-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v3("mgShown")}</button>
        <button type="button" className="c3-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v3("mgHidden")}</button>
      </div>
      <div className="c3-row" role="group" aria-label={v3("mgTitle")}>
        <button type="button" className="c3-chip" data-on={!method && !blank ? "1" : "0"} aria-pressed={!method && !blank} onClick={() => { setSelected(""); setBlank(false); }}>{v3("mgAll")}</button>
        {chips.map((item) => {
          const count = lines.find((line) => line.method === item)?.count || 0;
          return (
            <span key={item} className="c3-mg-pair" data-method={item}>
              <button type="button" className="c3-chip" data-on={method === item ? "1" : "0"} aria-pressed={method === item} onClick={() => { setBlank(false); setSelected(method === item ? "" : item); }}>{item} {count}</button>
              <button type="button" className="c3-btn" onClick={() => store(toggleMethod(hiddenMethods, item, present), showHidden ? "" : item)}>{showHidden ? v3("mgShow") : v3("mgHide")}</button>
            </span>
          );
        })}
      </div>
      <label className="c3-lab">
        <span>{v3("mgSearch")}</span>
        <input className="c3-field" aria-label={v3("mgSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c3-empty">{v3("mgEmpty")}</p>}
      <ul className="c3-mg-rows">
        {shown.map((row) => {
          const name = methodText(row.method);
          return (
            <li key={row.id} data-method={name || "blank"}>
              <p>{row.label || row.id}</p>
              <p className="c3-muted">{name || v3("mgBlank")}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
