"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readJson, writeJson } from "@/lib/crmv3/bridge";
import {
  COL_KEY,
  LIST_COLS,
  PIN_KEY,
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
  togglePinList,
  toggleTask,
  type ListCol,
  type Task,
} from "@/lib/crmv3/table";
import { crmv3Href } from "@/lib/crmv3/sections";
import { money, sendJson, useJson, when, type Tx, type UserRow } from "../kit";
import { useV3 } from "./store";

const LABEL: Record<ListCol, "luxCustomer" | "luxCountry" | "luxDesk" | "luxSale" | "luxRetention" | "luxBalance" | "luxStatus"> = {
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

export function DenseList({ base, rows, tx, locale }: { base: string; rows: UserRow[]; tx: Tx; locale: string }) {
  const v3 = useV3();
  const [pref, setPref] = useState(readCols(null));
  useEffect(() => { setPref(readCols(readJson(COL_KEY, null))); }, []);
  function save(next: typeof pref) {
    setPref(next);
    writeJson(COL_KEY, next);
  }
  return (
    <section className="c3-lux" aria-label={v3("luxTitle")} data-lux="1" data-dense={pref.dense ? "1" : "0"}>
      <h2 className="c3-title">{v3("luxTitle")}</h2>
      <p className="c3-muted">{v3("luxHint")}</p>
      <div className="c3-tools">
        <span className="c3-muted">{v3("luxCols")}</span>
        {LIST_COLS.map((col) => (
          <label key={col} className="c3-chip" data-on={pref.columns.includes(col) ? "1" : "0"}>
            <input type="checkbox" checked={pref.columns.includes(col)} aria-label={v3(LABEL[col])} onChange={() => save(toggleCol(pref, col))} />
            {v3(LABEL[col])}
          </label>
        ))}
        <button type="button" className="c3-btn" aria-pressed={pref.dense} onClick={() => save(setDense(pref, !pref.dense))}>{pref.dense ? v3("luxDense") : v3("luxRoomy")}</button>
      </div>
      {!rows.length && <p className="c3-muted">{v3("luxEmpty")}</p>}
      <div className="c3-lux-desk">
        <table className="c3-table">
          <thead>
            <tr>{pref.columns.map((col) => <th key={col}>{v3(LABEL[col])}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                {pref.columns.map((col) => (
                  <td key={col}>
                    {col === "customer" ? <Link href={crmv3Href(base, `customers/${row.id}`)}>{cell(col, row, locale, tx)}</Link> : cell(col, row, locale, tx)}
                    {col === "customer" && <div className="c3-muted">{row.email || ""}</div>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="c3-lux-cards">
        {rows.map((row) => (
          <li key={row.id}>
            <Link href={crmv3Href(base, `customers/${row.id}`)}>{row.name || "—"}</Link>
            {pref.columns.filter((col) => col !== "customer").map((col) => (
              <p key={col}><span className="c3-muted">{v3(LABEL[col])}</span> {cell(col, row, locale, tx)}</p>
            ))}
          </li>
        ))}
      </ul>
    </section>
  );
}

type NoteRow = { id: string; body?: string; authorName?: string | null; createdAt?: string };

export function NoteStudio({ id, notes, tx, locale, onSaved }: { id: string; notes: NoteRow[]; tx: Tx; locale: string; onSaved?: () => void }) {
  const v3 = useV3();
  const staff = useJson<{ workers?: { id: string; name?: string | null }[] }>("/api/admin/workers?take=40");
  const names = (staff.data?.workers || []).map((row) => String(row.name || "").trim()).filter(Boolean);
  const [draft, setDraft] = useState("");
  const [msg, setMsg] = useState("");
  const [tick, setTick] = useState(0);
  const [pins, setPins] = useState<string[]>([]);
  const [tasks, setTasks] = useState<Record<string, Task[]>>({});
  const [task, setTask] = useState("");
  useEffect(() => {
    setTasks(readTasks(readJson(TASK_KEY, {})));
    setPins(readJson<string[]>(PIN_KEY, []));
  }, []);
  const query = mentionQuery(draft);
  const picks = mentionOpen(draft) ? names.filter((name) => name.toLowerCase().includes(query.toLowerCase())).slice(0, 6) : [];
  const ordered = [...notes].sort((a, b) => Number(pins.includes(b.id)) - Number(pins.includes(a.id)));
  const mine = tasks[id] || [];
  function saveTasks(next: Record<string, Task[]>) {
    setTasks(next);
    writeJson(TASK_KEY, next);
  }
  function flipPin(noteId: string) {
    const next = togglePinList(pins, noteId);
    setPins(next);
    writeJson(PIN_KEY, next);
    setTick((n) => n + 1);
  }
  return (
    <section className="c3-note-studio" aria-label={v3("noteTitle")} data-notes="1">
      <h2 className="c3-title">{v3("noteTitle")}</h2>
      <p className="c3-muted">{v3("noteHint")}</p>
      <label className="c3-lab"><span>{v3("noteDraft")}</span>
        <textarea className="c3-field" rows={4} aria-label={v3("noteDraft")} value={draft} onChange={(event) => setDraft(event.target.value)} />
      </label>
      {picks.length > 0 && (
        <div className="c3-tools" aria-label={v3("noteMention")}>
          {picks.map((name) => (
            <button key={name} type="button" className="c3-chip" onClick={() => setDraft(insertMention(draft, name))}>@{name}</button>
          ))}
        </div>
      )}
      <p className="c3-muted">{v3("noteMentionHint")}</p>
      <button type="button" className="c3-btn c3-btn-hot" disabled={!draft.trim()} onClick={async () => {
        const body = draft.trim();
        if (!body) return;
        const res = await sendJson(`/api/admin/users/${encodeURIComponent(id)}`, "PATCH", { addNote: body });
        setMsg(res.ok ? tx("noteSaved") : res.error || tx("failed"));
        if (res.ok) {
          setDraft("");
          onSaved?.();
        }
      }}>{v3("noteSave")}</button>
      {msg && <p className="c3-muted" role="status">{msg}</p>}
      {!ordered.length && <p className="c3-muted">{v3("noteEmpty")}</p>}
      <ul className="c3-note-rows" data-pins={tick}>
        {ordered.map((row) => {
          const pinned = pins.includes(row.id);
          return (
            <li key={row.id} data-pinned={pinned ? "1" : "0"}>
              <p>{paintMentions(row.body || "", names).map((part, index) => part.mention ? <mark key={index}>{part.text}</mark> : <span key={index}>{part.text}</span>)}</p>
              <span className="c3-muted">{row.authorName || "—"} · {when(row.createdAt, locale)}{pinned ? ` · ${v3("notePinned")}` : ""}</span>
              <button type="button" className="c3-btn" onClick={() => flipPin(row.id)}>{pinned ? v3("noteUnpin") : v3("notePin")}</button>
            </li>
          );
        })}
      </ul>
      <h3 className="c3-title">{v3("taskTitle")}</h3>
      <p className="c3-muted">{v3("taskHint")}</p>
      {!mine.length && <p className="c3-muted">{v3("taskEmpty")}</p>}
      <ul className="c3-task-rows">
        {mine.map((item) => (
          <li key={item.id} data-done={item.done ? "1" : "0"}>
            <label className="c3-row">
              <input type="checkbox" checked={item.done} aria-label={item.text} onChange={() => saveTasks(toggleTask(tasks, id, item.id))} />
              <span>{item.text}</span>
            </label>
            <span className="c3-muted">{item.done ? v3("taskDone") : v3("taskOpen")}</span>
            <button type="button" className="c3-btn" onClick={() => saveTasks(deleteTask(tasks, id, item.id))}>{v3("taskDelete")}</button>
          </li>
        ))}
      </ul>
      <label className="c3-lab"><span>{v3("taskText")}</span><input className="c3-field" aria-label={v3("taskText")} value={task} onChange={(event) => setTask(event.target.value)} /></label>
      <button type="button" className="c3-btn" onClick={() => { const next = addTask(tasks, id, task); if (next !== tasks) { saveTasks(next); setTask(""); } }}>{v3("taskAdd")}</button>
    </section>
  );
}
