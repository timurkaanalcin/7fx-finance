"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SALE_STATUSES } from "@/lib/membership";
import type { CrmV3CopyKey } from "@/lib/crmv3/copy";
import { readJson, writeJson } from "@/lib/crmv3/bridge";
import { useEscape } from "@/lib/crmv3/focus";
import {
  COLUMN_KEY,
  DENSE_FIELDS,
  DONE_KEY,
  allIds,
  cell,
  dayItems,
  dayWindow,
  filterRows,
  isOverdue,
  itemsOn,
  readColumns,
  readIds,
  shiftDay,
  toggleColumn,
  toggleDone,
  toggleId,
  utcToday,
  type DayItem,
  type DenseField,
  type DenseRow,
} from "@/lib/crmv3/dense";
import { ROLE_KEY, deskRole } from "@/lib/crmv3/inbox-sla";
import { crmv3Href } from "@/lib/crmv3/sections";
import { sendJson, useJson, type Tx } from "../kit";
import { useV3 } from "./store";

const FIELD_LABEL: Record<DenseField, CrmV3CopyKey> = {
  email: "dnEmail",
  country: "dnCountry",
  desk: "dnDesk",
  saleStatus: "dnStage",
  documentsStatus: "dnKyc",
  currency: "dnCurrency",
};

type Result = { id: string; name: string; ok: boolean; error: string };

export function DenseList({ base, tx }: { base: string; tx: Tx }) {
  const v3 = useV3();
  const data = useJson<{ users?: DenseRow[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [columns, setColumns] = useState<DenseField[]>(["email", "country", "desk"]);
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [stage, setStage] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [viewer, setViewer] = useState(false);
  useEscape(confirming && !busy, () => setConfirming(false));
  useEffect(() => {
    setColumns(readColumns(readJson(COLUMN_KEY, [])));
    setViewer(deskRole(readJson(ROLE_KEY, "desk")) === "viewer");
    const onRole = () => setViewer(deskRole(readJson(ROLE_KEY, "desk")) === "viewer");
    window.addEventListener("crmv3:desk-role", onRole);
    return () => window.removeEventListener("crmv3:desk-role", onRole);
  }, []);
  const rows = data.data?.users || [];
  const shown = filterRows(rows, query);

  function choose(key: DenseField) {
    const next = toggleColumn(columns, key);
    setColumns(next);
    writeJson(COLUMN_KEY, next);
  }

  async function run() {
    if (!stage || busy || viewer || !picked.length) return;
    setBusy(true);
    const out: Result[] = [];
    try {
      for (const id of picked) {
        const row = rows.find((item) => item.id === id);
        const res = await sendJson(`/api/admin/users/${encodeURIComponent(id)}`, "PATCH", { saleStatus: stage });
        out.push({ id, name: row?.name || row?.email || id, ok: res.ok, error: res.error || "" });
      }
      setResults(out);
      setConfirming(false);
      setPicked([]);
      data.reload();
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="c3-dense" aria-label={v3("dnTitle")} data-dense="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("dnSub")}</p>
          <h2 className="c3-title">{v3("dnTitle")}</h2>
        </div>
      </header>
      <p className="c3-muted">{v3("dnHint")}</p>
      <div className="c3-row">
        <button type="button" className="c3-chip" data-on={viewer ? "1" : "0"} aria-pressed={viewer} onClick={() => {
          const next = viewer ? "desk" : "viewer";
          writeJson(ROLE_KEY, next);
          setViewer(next === "viewer");
          window.dispatchEvent(new Event("crmv3:desk-role"));
        }}>{v3("inViewerChip")}</button>
      </div>
      {viewer && <p className="c3-muted">{v3("dnViewer")}</p>}
      <label className="c3-lab">
        <span>{v3("dnSearch")}</span>
        <input className="c3-field" aria-label={v3("dnSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c3-row" role="group" aria-label={v3("dnColumns")}>
        <span className="c3-muted">{v3("dnColumns")}</span>
        {DENSE_FIELDS.map((key) => (
          <button key={key} type="button" className="c3-chip" data-on={columns.includes(key) ? "1" : "0"} aria-pressed={columns.includes(key)} onClick={() => choose(key)}>{v3(FIELD_LABEL[key])}</button>
        ))}
      </div>
      <div className="c3-row">
        <button type="button" className="c3-btn" onClick={() => setPicked(allIds(shown, true))}>{v3("dnAll")}</button>
        <button type="button" className="c3-btn" onClick={() => setPicked([])}>{v3("dnClear")}</button>
        <span className="c3-muted">{v3("dnSelected")} {picked.length}</span>
        {!viewer && (
          <>
            <label className="c3-lab">
              <span>{v3("dnStageWord")}</span>
              <select className="c3-select" aria-label={v3("dnStageWord")} aria-required={false} value={stage} onChange={(event) => setStage(event.target.value)}>
                <option value="">{v3("dnNeedStage")}</option>
                {SALE_STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <button type="button" className="c3-btn" disabled={!picked.length || !stage} onClick={() => setConfirming(true)}>{v3("dnApply")}</button>
          </>
        )}
      </div>
      {data.loading && !rows.length && <p className="c3-muted">{v3("dnLoading")}</p>}
      {data.error && <p className="c3-muted">{tx("failed")}</p>}
      {!data.loading && !shown.length && <p className="c3-empty">{v3("dnEmpty")}</p>}
      <div className="c3-dense-wrap">
        <table className="c3-dense-table">
          <thead>
            <tr>
              <th scope="col">{v3("dnSelect")}</th>
              <th scope="col">{v3("dnName")}</th>
              {columns.map((key) => <th key={key} scope="col">{v3(FIELD_LABEL[key])}</th>)}
            </tr>
          </thead>
          <tbody>
            {shown.map((row) => (
              <tr key={row.id} data-on={picked.includes(row.id) ? "1" : "0"}>
                <td>
                  <input type="checkbox" aria-label={v3("dnSelect")} checked={picked.includes(row.id)} onChange={() => setPicked(toggleId(picked, row.id))} />
                </td>
                <td><Link href={crmv3Href(base, `customers/${row.id}`)}>{row.name || "—"}</Link></td>
                {columns.map((key) => <td key={key} data-label={v3(FIELD_LABEL[key])}>{cell(row, key) || "—"}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {confirming && (
        <div className="c3-pay-confirm" role="dialog" aria-modal="true" data-confirm="">
          <p>{v3("dnConfirmLead")}</p>
          <p><strong>{picked.length}</strong> · {stage}</p>
          <div className="c3-row">
            <button type="button" className="c3-btn c3-btn-hot" disabled={busy || !stage} onClick={() => void run()}>{v3("dnConfirm")}</button>
            <button type="button" className="c3-btn" onClick={() => setConfirming(false)}>{v3("dnCancel")}</button>
          </div>
        </div>
      )}
      {results.length > 0 && (
        <ul className="c3-dense-results" aria-label={v3("dnResults")}>
          {results.map((row) => (
            <li key={row.id} data-ok={row.ok ? "1" : "0"}>{row.name} · {row.ok ? v3("dnOk") : `${v3("dnFailed")} ${row.error}`}</li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function DayStrip({ base, locale }: { base: string; locale: string }) {
  const v3 = useV3();
  const people = useJson<{ users?: { id: string; name?: string | null; retentionFollowUpAt?: string | null }[] }>("/api/admin/users?take=80&meta=0&role=TRADER");
  const calendar = useJson<{ reminders?: { id: string; body?: string | null; remindAt?: string | null }[] }>("/api/admin/calendar?take=80");
  const [cursor, setCursor] = useState(() => utcToday(Date.now()));
  const [done, setDone] = useState<string[]>([]);
  const today = utcToday(Date.now());
  useEffect(() => { setDone(readIds(readJson(DONE_KEY, []))); }, []);
  const items = dayItems(
    (people.data?.users || []).map((row) => ({ id: row.id, name: row.name, at: row.retentionFollowUpAt })),
    (calendar.data?.reminders || []).map((row) => ({ id: row.id, name: row.body, at: row.remindAt })),
  );
  const days = dayWindow(cursor, 7);
  function mark(id: string) {
    const next = toggleDone(done, id);
    setDone(next);
    writeJson(DONE_KEY, next);
  }
  return (
    <section className="c3-daystrip" aria-label={v3("dyTitle")} data-daystrip="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{today}</p>
          <h2 className="c3-title">{v3("dyTitle")}</h2>
        </div>
      </header>
      <p className="c3-muted">{v3("dyHint")}</p>
      <div className="c3-row">
        <button type="button" className="c3-btn" onClick={() => setCursor(shiftDay(cursor, -7))}>{v3("dyPrev")}</button>
        <button type="button" className="c3-btn" onClick={() => setCursor(today)}>{v3("dyToday")}</button>
        <button type="button" className="c3-btn" onClick={() => setCursor(shiftDay(cursor, 7))}>{v3("dyNext")}</button>
      </div>
      <div className="c3-daystrip-row">
        {days.map((day) => {
          const mine = itemsOn(items, day);
          const late = isOverdue(day, today);
          return (
            <article key={day} className="c3-day-card" data-today={day === today ? "1" : "0"} data-overdue={late ? "1" : "0"}>
              <h3 className="c3-title">{new Date(`${day}T00:00:00Z`).toLocaleDateString(locale || "en", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" })}</h3>
              {late && <p className="c3-muted">{v3("dyOverdue")}</p>}
              {!mine.length && <p className="c3-muted">{v3("dyEmpty")}</p>}
              <ul>
                {mine.map((item) => (
                  <DayLine key={item.id} base={base} item={item} done={done.includes(item.id)} onDone={() => mark(item.id)} />
                ))}
              </ul>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function DayLine({ base, item, done, onDone }: { base: string; item: DayItem; done: boolean; onDone: () => void }) {
  const v3 = useV3();
  const followId = item.kind === "follow" ? item.id.slice("follow:".length) : "";
  return (
    <li data-done={done ? "1" : "0"} data-kind={item.kind}>
      <span className="c3-muted">{item.kind === "follow" ? v3("dyFollow") : v3("dyTask")}</span>
      {followId ? <Link href={crmv3Href(base, `customers/${followId}`)}>{item.name}</Link> : <span>{item.name}</span>}
      <button type="button" className="c3-btn" aria-pressed={done} onClick={onDone}>{done ? v3("dyUndo") : v3("dyDone")}</button>
    </li>
  );
}
