"use client";

import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import {
  currencyMix,
  docCounts,
  groupByAuthor,
  largestPendingId,
  noteDuplicate,
  orderNotes,
  pendingCount,
  queueAgeHours,
  sameCustomer,
  type MoneyLite,
} from "@/lib/crmv4/round15";
import { downloadCsv } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;
const LOOK_KEY = "crmv4-fin-look";
const CHECK_KEY = "crmv4-fin-checks";
const REASON_KEY = "crmv4-fin-reason";
const MARK_KEY = "crmv4-note-marks";
const CHASE_KEY = "crmv4-doc-chase";
const DOCTAG_KEY = "crmv4-doc-tags";

export function readLastReason(): string {
  return readJson<string>(REASON_KEY, "");
}

export function rememberReason(value: string) {
  writeJson(REASON_KEY, value);
}

export function FinanceChrome({ rows, v4, band, oldest, onBand, onOldest }: {
  rows: MoneyLite[];
  v4: V4;
  band: "" | "small" | "large";
  oldest: boolean;
  onBand: (band: "" | "small" | "large") => void;
  onOldest: () => void;
}) {
  const open = rows.filter((row) => String(row.status || "").toUpperCase() === "PENDING");
  const mix = currencyMix(open);
  return (
    <section className="c4-fin-hero" aria-label={v4("queueHero")}>
      <div className="c4-fin-metric"><span>{v4("queueHero")}</span><strong>{pendingCount(rows)}</strong></div>
      <div className="c4-fin-metric"><span>{v4("pageNet")}</span><strong>{mix.map((row) => `${row.currency} ${row.total}`).join(" · ") || "—"}</strong></div>
      <div className="c4-row">
        <button type="button" className="c4-chip" data-on={oldest ? "1" : "0"} onClick={onOldest}>{v4("oldestFirst")}</button>
        <button type="button" className="c4-chip" data-on={band === "" ? "1" : "0"} onClick={() => onBand("")}>{v4("amountBand")}</button>
        <button type="button" className="c4-chip" data-on={band === "small" ? "1" : "0"} onClick={() => onBand("small")}>{v4("bandSmall")}</button>
        <button type="button" className="c4-chip" data-on={band === "large" ? "1" : "0"} onClick={() => onBand("large")}>{v4("bandLarge")}</button>
        <button type="button" className="c4-btn" onClick={() => window.print()}>{v4("printQueue")}</button>
      </div>
      <div className="c4-row" aria-label={v4("currencyMix")}>
        {mix.map((row) => <span key={row.currency} className="c4-chip">{row.currency} {row.count}</span>)}
      </div>
    </section>
  );
}

export function useSecondLook() {
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => { setIds(readJson(LOOK_KEY, [])); }, []);
  function toggle(id: string) {
    const next = ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id];
    setIds(next);
    writeJson(LOOK_KEY, next);
  }
  return { ids, toggle };
}

export function ReviewChecks({ id, v4 }: { id: string; v4: V4 }) {
  const [checks, setChecks] = useState({ amount: false, name: false, method: false });
  useEffect(() => {
    const all = readJson<Record<string, { amount?: boolean; name?: boolean; method?: boolean }>>(CHECK_KEY, {});
    const row = all[id] || {};
    setChecks({ amount: Boolean(row.amount), name: Boolean(row.name), method: Boolean(row.method) });
  }, [id]);
  function set(key: "amount" | "name" | "method", on: boolean) {
    const next = { ...checks, [key]: on };
    setChecks(next);
    const all = readJson<Record<string, typeof next>>(CHECK_KEY, {});
    all[id] = next;
    writeJson(CHECK_KEY, all);
  }
  return (
    <div className="c4-row" aria-label={v4("reviewChecks")}>
      <label className="c4-chip" data-on={checks.amount ? "1" : "0"}><input type="checkbox" checked={checks.amount} onChange={(event) => set("amount", event.target.checked)} />{v4("checkAmount")}</label>
      <label className="c4-chip" data-on={checks.name ? "1" : "0"}><input type="checkbox" checked={checks.name} onChange={(event) => set("name", event.target.checked)} />{v4("checkName")}</label>
      <label className="c4-chip" data-on={checks.method ? "1" : "0"}><input type="checkbox" checked={checks.method} onChange={(event) => set("method", event.target.checked)} />{v4("checkMethod")}</label>
    </div>
  );
}

export function queueMarks(rows: MoneyLite[]) {
  return { dupes: sameCustomer(rows), largest: largestPendingId(rows) };
}

export function NoteDesk({ notes, v4, tx, locale, save, onSubmit }: {
  notes: { id: string; body?: string | null; authorName?: string | null; createdAt?: string | null }[];
  v4: V4;
  save: string;
  tx: (key: "noteSaved" | "failed") => string;
  locale: string;
  onSubmit: (body: string) => Promise<boolean>;
}) {
  const [text, setText] = useState("");
  const [newest, setNewest] = useState(true);
  const [grouped, setGrouped] = useState(false);
  const [marks, setMarks] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState("");
  useEffect(() => { setMarks(readJson(MARK_KEY, {})); }, []);
  const ordered = orderNotes(notes, newest);
  const dup = noteDuplicate(text, notes);
  const groups = groupByAuthor(ordered);
  return (
    <div className="c4-note-desk">
      <div className="c4-row">
        <button type="button" className="c4-chip" data-on={newest ? "1" : "0"} onClick={() => setNewest((on) => !on)}>{v4("noteOrder")}</button>
        <button type="button" className="c4-chip" data-on={grouped ? "1" : "0"} onClick={() => setGrouped((on) => !on)}>{v4("byAuthor")}</button>
        <button type="button" className="c4-btn" onClick={() => downloadCsv("notes.csv", ["author", "body", "at"], notes.map((row) => [String(row.authorName || ""), String(row.body || ""), String(row.createdAt || "")]))}>{v4("noteCsv")}</button>
      </div>
      <form className="c4-form" onSubmit={async (event) => {
        event.preventDefault();
        if (!text.trim() || dup) return;
        const ok = await onSubmit(text.trim());
        setMsg(ok ? tx("noteSaved") : tx("failed"));
        if (ok) setText("");
      }}>
        <textarea className="c4-field" rows={3} aria-label={v4("noteCount")} value={text} onChange={(event) => setText(event.target.value)} />
        <p className="c4-muted">{v4("noteCount")} {text.length}{dup ? ` · ${v4("dupNote")}` : ""}</p>
        <button type="submit" className="c4-btn c4-btn-hot" disabled={dup || !text.trim()}>{save}</button>
      </form>
      {(grouped ? groups.flatMap((group) => group.rows.map((row) => ({ ...row, author: group.author }))) : ordered.map((row) => ({ ...row, author: row.authorName || "—" }))).map((row) => (
        <NoteLine key={row.id} row={row} mark={marks[row.id] || ""} v4={v4} locale={locale} onMark={(tone) => {
          const next = { ...marks, [row.id]: tone };
          setMarks(next);
          writeJson(MARK_KEY, next);
        }} />
      ))}
      {msg && <p className="c4-muted">{msg}</p>}
    </div>
  );
}

function NoteLine({ row, mark, v4, locale, onMark }: { row: { id: string; body?: string | null; authorName?: string | null; createdAt?: string | null }; mark: string; v4: V4; locale: string; onMark: (tone: string) => void }) {
  return (
    <p className="c4-note-line" data-mark={mark || "0"}>
      <span>{row.body}</span>
      <span className="c4-muted">{row.authorName || "—"} · {row.createdAt ? new Date(row.createdAt).toLocaleString(locale) : ""}</span>
      <button type="button" className="c4-btn" aria-label={v4("noteMark")} onClick={() => onMark(mark === "gold" ? "" : "gold")}>{v4("noteMark")}</button>
    </p>
  );
}

export function DocDesk({ rows, v4 }: { rows: { id: string; status?: string | null; docType?: string | null; name?: string | null }[]; v4: V4 }) {
  const counts = docCounts(rows);
  const [type, setType] = useState("");
  const [chase, setChase] = useState<Record<string, string>>({});
  const [tags, setTags] = useState<Record<string, string>>({});
  useEffect(() => {
    setChase(readJson(CHASE_KEY, {}));
    setTags(readJson(DOCTAG_KEY, {}));
  }, []);
  const types: string[] = [];
  for (const row of rows) {
    const name = String(row.docType || "");
    if (name && !types.includes(name)) types.push(name);
  }
  const shown = type ? rows.filter((row) => row.docType === type) : rows;
  return (
    <div className="c4-doc-desk">
      <div className="c4-fin-hero" aria-label={v4("docCounts")}>
        <div className="c4-fin-metric"><span>{v4("docCounts")}</span><strong>{counts.pending}</strong></div>
        <div className="c4-fin-metric"><span>OK</span><strong>{counts.approved}</strong></div>
        <div className="c4-fin-metric"><span>{v4("docTypeFilter")}</span><strong>{counts.rejected}</strong></div>
      </div>
      <div className="c4-row">
        <button type="button" className="c4-chip" data-on={type === "" ? "1" : "0"} onClick={() => setType("")}>{v4("docTypeFilter")}</button>
        {types.map((item) => <button key={item} type="button" className="c4-chip" data-on={type === item ? "1" : "0"} onClick={() => setType(item)}>{item}</button>)}
      </div>
      {shown.map((row) => (
        <div key={row.id} className="c4-doc-line">
          <span>{row.name || row.id}</span>
          <input className="c4-field" type="date" aria-label={v4("chaseBy")} value={chase[row.id] || ""} onChange={(event) => {
            const next = { ...chase, [row.id]: event.target.value };
            setChase(next);
            writeJson(CHASE_KEY, next);
          }} />
          <input className="c4-field" aria-label={v4("docTag")} value={tags[row.id] || ""} onChange={(event) => {
            const next = { ...tags, [row.id]: event.target.value };
            setTags(next);
            writeJson(DOCTAG_KEY, next);
          }} />
        </div>
      ))}
      {!shown.length && <p className="c4-empty-gold">{v4("emptyDocs")}</p>}
    </div>
  );
}

export { queueAgeHours };
