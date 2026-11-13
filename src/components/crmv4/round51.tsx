"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SALE_STATUSES } from "@/lib/membership";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import {
  DENSE_FIELDS,
  allIds,
  cell,
  DONE_KEY,
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
} from "@/lib/crmv4/round51";
import { crmv4Href } from "@/lib/crmv4/sections";
import { storedRole } from "./round5";
import { useEscape } from "./round40";
import { sendJson, useJson, type Tx } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const COLUMN_KEY = "crmv4-dense-columns";

const FIELD_LABEL: Record<DenseField, CrmV4CopyKey> = {
  email: "dnEmail",
  country: "dnCountry",
  desk: "dnDesk",
  saleStatus: "dnStage",
  documentsStatus: "dnKyc",
  currency: "dnCurrency",
};

type Result = { id: string; name: string; ok: boolean; error: string };

export function DenseList({ base, v4, tx }: { base: string; v4: V4; tx: Tx }) {
  const data = useJson<{ users?: DenseRow[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [columns, setColumns] = useState<DenseField[]>(["email", "country", "desk"]);
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [stage, setStage] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [viewer, setViewer] = useState(false);
  useEscape(confirming, () => setConfirming(false));
  useEffect(() => {
    setColumns(readColumns(readJson(COLUMN_KEY, [])));
    setViewer(storedRole() === "viewer");
    const onRole = () => setViewer(storedRole() === "viewer");
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
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
    <section className="c4-dense-desk c4-dense-press" aria-label={v4("dnTitle")} data-dense="1" data-desk="press">
      <header className="c4-pay-head c4-dense-press-mast">
        <p className="c4-dense-press-seal" data-logo="mono">7FX</p>
        <div>
          <p className="c4-pay-kicker c4-dense-press-kicker">{v4("dnSub")}</p>
          <h2 className="c4-title c4-dense-press-title">{v4("dnTitle")}</h2>
        </div>
        <ol className="c4-dense-press-index" aria-label={v4("dnTitle")}>
          <li data-tone="gold">{v4("dnPressChampagne")}</li>
          <li data-tone="ink">{v4("dnPressGraphite")}</li>
          <li data-tone="ivory">{v4("dnPressIvory")}</li>
        </ol>
      </header>
      <p className="c4-meta c4-dense-press-lead">{v4("dnPressLead")}</p>
      <p className="c4-meta">{v4("dnHint")}</p>
      {viewer && <p className="c4-meta">{v4("dnViewer")}</p>}
      <label className="c4-lab">
        <span>{v4("dnSearch")}</span>
        <input className="c4-field" aria-label={v4("dnSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c4-row" role="group" aria-label={v4("dnColumns")}>
        <span className="c4-meta">{v4("dnColumns")}</span>
        {DENSE_FIELDS.map((key) => (
          <button key={key} type="button" className="c4-chip" data-on={columns.includes(key) ? "1" : "0"} aria-pressed={columns.includes(key)} onClick={() => choose(key)}>{v4(FIELD_LABEL[key])}</button>
        ))}
      </div>
      <div className="c4-row">
        <button type="button" className="c4-btn" onClick={() => setPicked(allIds(shown, true))}>{v4("dnAll")}</button>
        <button type="button" className="c4-btn" onClick={() => setPicked([])}>{v4("dnClear")}</button>
        <span className="c4-meta">{v4("dnSelected")} {picked.length}</span>
        {!viewer && (
          <>
            <label className="c4-lab">
              <span>{v4("dnStageWord")}</span>
              <select className="c4-select" aria-label={v4("dnStageWord")} value={stage} onChange={(event) => setStage(event.target.value)}>
                <option value="">{v4("dnNeedStage")}</option>
                {SALE_STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <button type="button" className="c4-btn" disabled={!picked.length || !stage} onClick={() => setConfirming(true)}>{v4("dnApply")}</button>
          </>
        )}
      </div>
      {data.loading && !rows.length && <p className="c4-meta">{v4("dnLoading")}</p>}
      {data.error && <p className="c4-meta">{tx("failed")}</p>}
      {!data.loading && !shown.length && <p className="c4-pay-empty">{v4("dnEmpty")}</p>}
      <div className="c4-dense-wrap">
        <table className="c4-dense-table">
          <thead>
            <tr>
              <th scope="col">{v4("dnSelect")}</th>
              <th scope="col">{v4("dnName")}</th>
              {columns.map((key) => <th key={key} scope="col">{v4(FIELD_LABEL[key])}</th>)}
            </tr>
          </thead>
          <tbody>
            {shown.map((row) => (
              <tr key={row.id} data-on={picked.includes(row.id) ? "1" : "0"}>
                <td>
                  <input type="checkbox" aria-label={v4("dnSelect")} checked={picked.includes(row.id)} onChange={() => setPicked(toggleId(picked, row.id))} />
                </td>
                <td><Link href={crmv4Href(base, `customers/${row.id}`)}>{row.name || "—"}</Link></td>
                {columns.map((key) => <td key={key}>{cell(row, key) || "—"}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {confirming && (
        <div className="c4-pay-confirm" role="dialog" aria-modal="true" data-confirm="">
          <p>{v4("dnConfirmLead")}</p>
          <p><strong>{picked.length}</strong> · {stage}</p>
          <div className="c4-row">
            <button type="button" className="c4-btn c4-btn-hot" disabled={busy || !stage} onClick={() => void run()}>{v4("dnConfirm")}</button>
            <button type="button" className="c4-btn" onClick={() => setConfirming(false)}>{v4("dnCancel")}</button>
          </div>
        </div>
      )}
      {results.length > 0 && (
        <ul className="c4-dense-results" aria-label={v4("dnResults")}>
          {results.map((row) => (
            <li key={row.id} data-ok={row.ok ? "1" : "0"}>{row.name} · {row.ok ? v4("dnOk") : `${v4("dnFailed")} ${row.error}`}</li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function DayStrip({ base, v4, locale }: { base: string; v4: V4; locale: string }) {
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
    <section className="c4-daystrip c4-daystrip-gallery" aria-label={v4("dyTitle")} data-daystrip="1">
      <header className="c4-daystrip-gallery-mast">
        <div>
          <p className="c4-daystrip-gallery-kicker">{today}</p>
          <h2 className="c4-title c4-daystrip-gallery-title">{v4("dyTitle")}</h2>
        </div>
        <p className="c4-daystrip-gallery-plate" data-logo="mono">7FX</p>
      </header>
      <p className="c4-meta c4-daystrip-gallery-hint">{v4("dyHint")}</p>
      <div className="c4-row c4-daystrip-gallery-tools">
        <button type="button" className="c4-btn" onClick={() => setCursor(shiftDay(cursor, -7))}>{v4("dyPrev")}</button>
        <button type="button" className="c4-btn" onClick={() => setCursor(today)}>{v4("dyToday")}</button>
        <button type="button" className="c4-btn" onClick={() => setCursor(shiftDay(cursor, 7))}>{v4("dyNext")}</button>
      </div>
      <div className="c4-daystrip-row c4-daystrip-gallery-row">
        {days.map((day) => {
          const mine = itemsOn(items, day);
          const late = isOverdue(day, today);
          return (
            <article key={day} className="c4-day-card" data-today={day === today ? "1" : "0"} data-overdue={late ? "1" : "0"}>
              <h3 className="c4-title">{new Date(`${day}T00:00:00Z`).toLocaleDateString(locale || "en", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" })}</h3>
              {late && <p className="c4-meta">{v4("dyOverdue")}</p>}
              {!mine.length && <p className="c4-meta">{v4("dyEmpty")}</p>}
              <ul>
                {mine.map((item) => (
                  <DayLine key={item.id} base={base} item={item} done={done.includes(item.id)} v4={v4} onDone={() => mark(item.id)} />
                ))}
              </ul>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function DayLine({ base, item, done, v4, onDone }: { base: string; item: DayItem; done: boolean; v4: V4; onDone: () => void }) {
  const followId = item.kind === "follow" ? item.id.slice("follow:".length) : "";
  return (
    <li data-done={done ? "1" : "0"} data-kind={item.kind}>
      <span className="c4-meta">{item.kind === "follow" ? v4("dyFollow") : v4("dyTask")}</span>
      {followId ? <Link href={crmv4Href(base, `customers/${followId}`)}>{item.name}</Link> : <span>{item.name}</span>}
      <button type="button" className="c4-btn" aria-pressed={done} onClick={onDone}>{done ? v4("dyUndo") : v4("dyDone")}</button>
    </li>
  );
}
