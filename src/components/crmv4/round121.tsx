"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import {
  DEP_METHOD_KEY,
  VISITOR_KEY,
  activeMethod,
  addNote,
  methodLines,
  methodText,
  namedMethods,
  readHiddenMethods,
  readNotes,
  resetNotes,
  setNoteHidden,
  toggleMethod,
  toggleNotePin,
  visibleDeposits,
  visibleMethods,
  visibleNotes,
  type MethodRow,
  type Note,
} from "@/lib/crmv4/round121";
import { crmv4Href } from "@/lib/crmv4/sections";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

type Deposit = {
  id: string;
  method?: { label?: string | null; type?: string | null; network?: string | null } | null;
  user?: { name?: string | null; email?: string | null } | null;
};

type GlanceRow = MethodRow & { id: string };

export function VisitorNotes({ v4 }: { v4: V4 }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [text, setText] = useState("");
  const [badge, setBadge] = useState("");
  const [query, setQuery] = useState("");
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const next = readNotes(readJson(VISITOR_KEY, []));
    setNotes(next);
    writeJson(VISITOR_KEY, next);
  }, []);
  const shown = visibleNotes(notes, hidden, query);

  function store(next: Note[]) {
    setNotes(next);
    writeJson(VISITOR_KEY, next);
  }

  return (
    <section className="c4-visitor" aria-label={v4("bdgTitle")} data-visitor="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-bdg-logo" data-logo="mono">{v4("bdgLogo")}</p>
          <p className="c4-pay-kicker">{v4("bdgSub")}</p>
          <h2 className="c4-title">{v4("bdgTitle")}</h2>
        </div>
        <p className="c4-meta">{shown.length}</p>
      </header>
      <p className="c4-meta">{v4("bdgHint")}</p>
      <p className="c4-meta">{v4("bdgLocal")}</p>
      <p className="c4-meta">{v4("bdgBlank")}</p>
      <p className="c4-meta">{v4("bdgBadgeBlank")}</p>
      <form className="c4-row" onSubmit={(event) => {
        event.preventDefault();
        const next = addNote(notes, { id: `bdg-${notes.length}-${text.trim().slice(0, 8) || "note"}`, text, badge });
        if (next.length === notes.length) return;
        store(next);
        setText("");
        setBadge("");
      }}>
        <label className="c4-lab">
          <span>{v4("bdgText")}</span>
          <input className="c4-field" aria-label={v4("bdgText")} value={text} maxLength={120} onChange={(event) => setText(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("bdgBadge")}</span>
          <input className="c4-field" aria-label={v4("bdgBadge")} value={badge} maxLength={40} onChange={(event) => setBadge(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn">{v4("bdgAdd")}</button>
        <button type="button" className="c4-btn" onClick={() => store(resetNotes())}>{v4("bdgReset")}</button>
      </form>
      <label className="c4-lab">
        <span>{v4("bdgSearch")}</span>
        <input className="c4-field" aria-label={v4("bdgSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c4-row" role="group" aria-label={v4("bdgTitle")}>
        <button type="button" className="c4-chip" data-on={hidden ? "0" : "1"} aria-pressed={!hidden} onClick={() => setHidden(false)}>{v4("bdgOpen")}</button>
        <button type="button" className="c4-chip" data-on={hidden ? "1" : "0"} aria-pressed={hidden} onClick={() => setHidden(true)}>{v4("bdgHidden")}</button>
      </div>
      {!shown.length && <p className="c4-pay-empty">{v4("bdgEmpty")}</p>}
      <ul className="c4-bdg-rows">
        {shown.map((note) => (
          <li key={note.id} data-pinned={note.pinned ? "1" : "0"}>
            <p>{note.text}</p>
            {note.badge ? <p className="c4-meta">{note.badge}</p> : null}
            <div className="c4-row">
              <button type="button" className="c4-btn" onClick={() => store(toggleNotePin(notes, note.id))}>{note.pinned ? v4("bdgUnpin") : v4("bdgPin")}</button>
              <button type="button" className="c4-btn" onClick={() => store(setNoteHidden(notes, note.id, !note.hidden))}>{note.hidden ? v4("bdgShow") : v4("bdgHide")}</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function DepositMethods({ base, v4 }: { base: string; v4: V4 }) {
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
      label: String(row.user?.name || row.user?.email || "").trim(),
      method: {
        label: row.method?.label,
        type: row.method?.type,
        network: row.method?.network,
      },
    };
  }).filter((row): row is GlanceRow => Boolean(row));
  const lines = methodLines(rows);
  const present = namedMethods(rows);
  const presentKey = present.join("\n");
  const blankCount = lines.find((line) => !line.method)?.count || 0;
  const loading = data.loading && !data.data;
  const failed = Boolean(data.error);
  useEffect(() => {
    if (loading || failed) return;
    const next = readHiddenMethods(readJson(DEP_METHOD_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHiddenMethods(next);
    writeJson(DEP_METHOD_KEY, next);
  }, [loading, failed, presentKey]);
  const chips = visibleMethods(present, hiddenMethods, showHidden);
  const method = activeMethod(selected, chips);
  const shown = visibleDeposits(rows, method, blank, query);

  function store(next: string[], clear: string) {
    setHiddenMethods(next);
    writeJson(DEP_METHOD_KEY, next);
    if (clear && activeMethod(selected, [clear])) setSelected("");
  }

  return (
    <section className="c4-dep-glance" aria-label={v4("dmgTitle")} data-dep-glance="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-pay-kicker">{v4("dmgSub")}</p>
          <h2 className="c4-title">{v4("dmgTitle")}</h2>
        </div>
        <p className="c4-meta">{v4("dmgRows")} {rows.length}</p>
      </header>
      <p className="c4-meta">{v4("dmgHint")}</p>
      <p className="c4-meta">{v4("dmgLocal")}</p>
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "deposit")}>{v4("dmgBoard")}</Link>
      </p>
      {loading && !rows.length && <p className="c4-meta">{v4("dmgLoading")}</p>}
      {failed && !rows.length && <p className="c4-meta">{v4("dmgFailed")}</p>}
      {!loading && !failed && !rows.length && <p className="c4-pay-empty">{v4("dmgNone")}</p>}
      {blankCount > 0 && (
        <button type="button" className="c4-dmg-blank" data-on={blank ? "1" : "0"} aria-pressed={blank} onClick={() => { setBlank((value) => !value); setSelected(""); }}>
          <span>{v4("dmgBlank")}</span>
          <span className="c4-meta">{blankCount}</span>
        </button>
      )}
      <div className="c4-row" role="group" aria-label={v4("dmgShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("dmgShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("dmgHidden")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("dmgTitle")}>
        <button type="button" className="c4-chip" data-on={!method && !blank ? "1" : "0"} aria-pressed={!method && !blank} onClick={() => { setSelected(""); setBlank(false); }}>{v4("dmgAll")}</button>
        {chips.map((item) => {
          const count = lines.find((line) => line.method === item)?.count || 0;
          return (
            <span key={item} className="c4-dmg-pair" data-method={item}>
              <button type="button" className="c4-chip" data-on={method === item ? "1" : "0"} aria-pressed={method === item} onClick={() => { setBlank(false); setSelected(method === item ? "" : item); }}>{item} {count}</button>
              <button type="button" className="c4-btn" onClick={() => store(toggleMethod(hiddenMethods, item, present), showHidden ? "" : item)}>{showHidden ? v4("dmgShow") : v4("dmgHide")}</button>
            </span>
          );
        })}
      </div>
      <label className="c4-lab">
        <span>{v4("dmgSearch")}</span>
        <input className="c4-field" aria-label={v4("dmgSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c4-pay-empty">{v4("dmgEmpty")}</p>}
      <ul className="c4-dmg-rows">
        {shown.map((row) => {
          const name = methodText(row.method);
          return (
            <li key={row.id} data-method={name || "blank"}>
              <p>{row.label || row.id}</p>
              <p className="c4-meta">{name || v4("dmgBlank")}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
