"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import {
  COL_KEY,
  LIST_COLS,
  TASK_KEY,
  addTask,
  deleteTask,
  insertMention,
  mentionOpen,
  mentionQuery,
  paintMentions,
  readCols,
  readTasks,
  setDense,
  toggleCol,
  toggleTask,
  type ListCol,
  type Task,
} from "@/lib/crmv4/round34";
import { notePinned, toggleNotePin } from "./round5";
import { crmv4Href } from "@/lib/crmv4/sections";
import { money, sendJson, useJson, when, type Tx, type UserRow } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const LABEL: Record<ListCol, CrmV4CopyKey> = {
  customer: "luxCustomer",
  country: "luxCountry",
  desk: "luxDesk",
  sale: "luxSale",
  retention: "luxRetention",
  balance: "luxBalance",
  status: "luxStatus",
};

function cell(col: ListCol, row: UserRow, locale: string, tx: Tx): string {
  if (col === "customer") return row.name || "—";
  if (col === "country") return row.country || "—";
  if (col === "desk") return row.desk || "—";
  if (col === "sale") return row.saleStatus || "—";
  if (col === "retention") return row.retentionStatus || "—";
  if (col === "balance") return money(row.balance ?? row.account?.balance, row.currency || row.account?.currency, locale);
  return row.active === false ? tx("chipFrozen") : tx("chipActive");
}

export function LuxList({ base, rows, tx, locale, v4 }: { base: string; rows: UserRow[]; tx: Tx; locale: string; v4: V4 }) {
  const [pref, setPref] = useState(readCols(null));
  useEffect(() => { setPref(readCols(readJson(COL_KEY, null))); }, []);
  function save(next: typeof pref) {
    setPref(next);
    writeJson(COL_KEY, next);
  }
  return (
    <section className="c4-lux-list" aria-label={v4("luxTitle")} data-lux="1" data-dense={pref.dense ? "1" : "0"}>
      <h2 className="c4-title">{v4("luxTitle")}</h2>
      <p className="c4-muted">{v4("luxHint")}</p>
      <div className="c4-line-filters">
        <span className="c4-muted">{v4("luxCols")}</span>
        {LIST_COLS.map((col) => (
          <label key={col} className="c4-chip" data-on={pref.columns.includes(col) ? "1" : "0"}>
            <input type="checkbox" checked={pref.columns.includes(col)} aria-label={v4(LABEL[col])} onChange={() => save(toggleCol(pref, col))} />
            {v4(LABEL[col])}
          </label>
        ))}
        <button type="button" className="c4-btn" aria-pressed={pref.dense} onClick={() => save(setDense(pref, !pref.dense))}>{pref.dense ? v4("luxDense") : v4("luxRoomy")}</button>
      </div>
      {!rows.length && <p className="c4-empty-gold">{v4("luxEmpty")}</p>}
      <div className="c4-lux-desk">
        <table className="c4-table">
          <thead>
            <tr>{pref.columns.map((col) => <th key={col}>{v4(LABEL[col])}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                {pref.columns.map((col) => (
                  <td key={col}>
                    {col === "customer" ? <Link href={crmv4Href(base, `customers/${row.id}`)}>{cell(col, row, locale, tx)}</Link> : cell(col, row, locale, tx)}
                    {col === "customer" && <div className="c4-muted">{row.email || ""}</div>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="c4-lux-cards">
        {rows.map((row) => (
          <li key={row.id}>
            <Link href={crmv4Href(base, `customers/${row.id}`)}>{row.name || "—"}</Link>
            {pref.columns.filter((col) => col !== "customer").map((col) => (
              <p key={col}><span className="c4-muted">{v4(LABEL[col])}</span> {cell(col, row, locale, tx)}</p>
            ))}
          </li>
        ))}
      </ul>
    </section>
  );
}

type NoteRow = { id: string; body?: string; authorName?: string | null; createdAt?: string };

export function NoteStudio({ id, notes, tx, locale, v4, onSaved }: { id: string; notes: NoteRow[]; tx: Tx; locale: string; v4: V4; onSaved?: () => void }) {
  const staff = useJson<{ workers?: { id: string; name?: string | null }[] }>("/api/admin/workers?take=40");
  const names = (staff.data?.workers || []).map((row) => String(row.name || "").trim()).filter(Boolean);
  const [draft, setDraft] = useState("");
  const [msg, setMsg] = useState("");
  const [tick, setTick] = useState(0);
  const [tasks, setTasks] = useState<Record<string, Task[]>>({});
  const [task, setTask] = useState("");
  useEffect(() => { setTasks(readTasks(readJson(TASK_KEY, {}))); }, []);
  const query = mentionQuery(draft);
  const picks = mentionOpen(draft) ? names.filter((name) => name.toLowerCase().includes(query.toLowerCase())).slice(0, 6) : [];
  const ordered = [...notes].sort((a, b) => Number(notePinned(b.id)) - Number(notePinned(a.id)));
  const mine = tasks[id] || [];
  function saveTasks(next: Record<string, Task[]>) {
    setTasks(next);
    writeJson(TASK_KEY, next);
  }
  return (
    <section className="c4-note-studio" aria-label={v4("noteTitle")} data-notes="1">
      <h2 className="c4-title">{v4("noteTitle")}</h2>
      <p className="c4-muted">{v4("noteHint")}</p>
      <label className="c4-lab"><span>{v4("noteDraft")}</span>
        <textarea className="c4-field" rows={4} aria-label={v4("noteDraft")} value={draft} onChange={(event) => setDraft(event.target.value)} />
      </label>
      {picks.length > 0 && (
        <div className="c4-line-filters" aria-label={v4("noteMention")}>
          {picks.map((name) => (
            <button key={name} type="button" className="c4-chip" onClick={() => setDraft(insertMention(draft, name))}>@{name}</button>
          ))}
        </div>
      )}
      <p className="c4-muted">{v4("noteMentionHint")}</p>
      <button type="button" className="c4-btn c4-btn-hot" disabled={!draft.trim()} onClick={async () => {
        const body = draft.trim();
        if (!body) return;
        const res = await sendJson(`/api/admin/users/${encodeURIComponent(id)}`, "PATCH", { addNote: body });
        setMsg(res.ok ? tx("noteSaved") : res.error || tx("failed"));
        if (res.ok) {
          setDraft("");
          onSaved?.();
        }
      }}>{v4("noteSave")}</button>
      {msg && <p className="c4-muted">{msg}</p>}
      {!ordered.length && <p className="c4-empty-gold">{v4("noteEmpty")}</p>}
      <ul className="c4-note-rows" data-pins={tick}>
        {ordered.map((row) => {
          const pinned = notePinned(row.id);
          return (
            <li key={row.id} data-pinned={pinned ? "1" : "0"}>
              <p>{paintMentions(row.body || "", names).map((part, index) => part.mention ? <mark key={index}>{part.text}</mark> : <span key={index}>{part.text}</span>)}</p>
              <span className="c4-muted">{row.authorName || "—"} · {when(row.createdAt, locale)}{pinned ? ` · ${v4("notePinned")}` : ""}</span>
              <button type="button" className="c4-btn" onClick={() => { toggleNotePin(row.id); setTick((n) => n + 1); }}>{pinned ? v4("noteUnpin") : v4("notePin")}</button>
            </li>
          );
        })}
      </ul>
      <h3 className="c4-title">{v4("taskTitle")}</h3>
      <p className="c4-muted">{v4("taskHint")}</p>
      {!mine.length && <p className="c4-empty-gold">{v4("taskEmpty")}</p>}
      <ul className="c4-task-rows">
        {mine.map((item) => (
          <li key={item.id} data-done={item.done ? "1" : "0"}>
            <label className="c4-row">
              <input type="checkbox" checked={item.done} aria-label={item.text} onChange={() => saveTasks(toggleTask(tasks, id, item.id))} />
              <span>{item.text}</span>
            </label>
            <span className="c4-muted">{item.done ? v4("taskDone") : v4("taskOpen")}</span>
            <button type="button" className="c4-btn" onClick={() => saveTasks(deleteTask(tasks, id, item.id))}>{v4("taskDelete")}</button>
          </li>
        ))}
      </ul>
      <label className="c4-lab"><span>{v4("taskText")}</span><input className="c4-field" aria-label={v4("taskText")} value={task} onChange={(event) => setTask(event.target.value)} /></label>
      <button type="button" className="c4-btn" onClick={() => { const next = addTask(tasks, id, task); if (next !== tasks) { saveTasks(next); setTask(""); } }}>{v4("taskAdd")}</button>
    </section>
  );
}
