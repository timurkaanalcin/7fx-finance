"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import {
  LOG_KEY,
  PIN_KEY,
  SOURCE_FIELDS,
  addNote,
  isSourceField,
  mixCount,
  readIds,
  readNotes,
  setArchived,
  sourceGroups,
  toggleId,
  toggleNotePin,
  visibleNotes,
  type Note,
  type NoteKind,
  type Person,
  type SourceField,
} from "@/lib/crmv4/round69";
import { crmv4Href } from "@/lib/crmv4/sections";
import { useEscape } from "./round40";
import { useJson, type Tx } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const FIELD_KEY: Record<SourceField, CrmV4CopyKey> = {
  affiliateA: "sxA",
  affiliateB: "sxB",
  affiliateC: "sxC",
  referralCodeUsed: "sxReferral",
  campaign: "sxCampaign",
};

export function SourceMix({ base, v4, tx }: { base: string; v4: V4; tx: Tx }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [field, setField] = useState<SourceField>("affiliateA");
  const [query, setQuery] = useState("");
  const [pinned, setPinned] = useState<string[]>([]);
  useEffect(() => { setPinned(readIds(readJson(PIN_KEY, []))); }, []);
  const loaded = data.data?.users || [];
  const groups = sourceGroups(loaded, field, query, pinned);

  function store(next: string[]) {
    setPinned(next);
    writeJson(PIN_KEY, next);
  }

  return (
    <section className="c4-source-mix c4-source-salon" aria-label={v4("sxTitle")} data-source-mix="1" data-desk="salon">
      <header className="c4-pay-head c4-source-salon-mast">
        <p className="c4-source-salon-seal" data-logo="mono">7FX</p>
        <div>
          <p className="c4-pay-kicker c4-source-salon-kicker">{v4("sxSub")}</p>
          <h2 className="c4-title c4-source-salon-title">{v4("sxTitle")}</h2>
        </div>
        <p className="c4-meta c4-source-salon-count">{v4("sxTotal")} {mixCount(groups)}</p>
        <ol className="c4-source-salon-index" aria-label={v4("sxTitle")}>
          <li data-tone="gold">{v4("sxSalonChampagne")}</li>
          <li data-tone="ink">{v4("sxSalonGraphite")}</li>
          <li data-tone="ivory">{v4("sxSalonIvory")}</li>
        </ol>
      </header>
      <p className="c4-meta c4-source-salon-lead">{v4("sxSalonLead")}</p>
      <p className="c4-meta">{v4("sxHint")}</p>
      <div className="c4-row" role="group" aria-label={v4("sxTitle")}>
        {SOURCE_FIELDS.map((item) => (
          <button
            key={item}
            type="button"
            className="c4-chip"
            data-on={field === item ? "1" : "0"}
            aria-pressed={field === item}
            onClick={() => setField(item)}
          >
            {v4(FIELD_KEY[item])}
          </button>
        ))}
      </div>
      <label className="c4-lab">
        <span>{v4("sxSearch")}</span>
        <input className="c4-field c4-source-salon-search" aria-label={v4("sxSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {data.loading && !loaded.length && <p className="c4-meta">{v4("sxLoading")}</p>}
      {data.error && <p className="c4-meta">{v4("sxFailed")} {tx("failed")}</p>}
      {!data.loading && !data.error && !loaded.length && <p className="c4-pay-empty c4-source-salon-empty">{v4("sxNone")}</p>}
      {!data.loading && !data.error && loaded.length > 0 && !groups.length && <p className="c4-pay-empty c4-source-salon-empty">{v4("sxEmpty")}</p>}
      <ul className="c4-source-list c4-source-salon-list">
        {groups.map((group) => (
          <li key={group.id} className="c4-source-card c4-source-salon-card" data-pinned={pinned.includes(group.id) ? "1" : "0"} data-blank={group.value ? "0" : "1"}>
            <div className="c4-row c4-between">
              <strong>{group.value || v4("sxBlank")}</strong>
              <span className="c4-source-count">{group.count}</span>
            </div>
            <p className="c4-meta">{v4("sxCount")} · {v4(FIELD_KEY[isSourceField(group.field) ? group.field : "affiliateA"])}</p>
            <ul className="c4-source-people">
              {group.people.map((person) => (
                <li key={person.id}>
                  <Link className="c4-btn" href={crmv4Href(base, `customers/${person.id}`)}>{v4("sxOpen")} {person.name}</Link>
                </li>
              ))}
            </ul>
            <button type="button" className="c4-btn" data-source-pin="" onClick={() => store(toggleId(pinned, group.id))}>
              {pinned.includes(group.id) ? v4("sxUnpin") : v4("sxPin")}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function WinLog({ v4, tx }: { v4: V4; tx: Tx }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [notes, setNotes] = useState<Note[]>([]);
  const [kind, setKind] = useState<NoteKind>("win");
  const [filter, setFilter] = useState<"" | NoteKind>("");
  const [archived, setArchivedView] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [query, setQuery] = useState("");
  const [body, setBody] = useState("");
  const [pending, setPending] = useState("");
  useEscape(Boolean(pending), () => setPending(""));
  useEffect(() => { setNotes(readNotes(readJson(LOG_KEY, []))); }, []);
  const loaded = data.data?.users || [];
  const names: Record<string, string> = {};
  for (const person of loaded) names[person.id] = String(person.name || person.email || person.id);
  const shown = visibleNotes(notes, filter, query, archived, names);

  function store(next: Note[]) {
    setNotes(next);
    writeJson(LOG_KEY, next);
  }

  return (
    <section className="c4-win-log" aria-label={v4("wnTitle")} data-win-log="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-pay-kicker">{v4("wnSub")}</p>
          <h2 className="c4-title">{v4("wnTitle")}</h2>
        </div>
        <p className="c4-meta">{shown.length}</p>
      </header>
      <p className="c4-meta">{v4("wnHint")}</p>
      <p className="c4-meta">{v4("wnLocal")}</p>
      {data.loading && !loaded.length && <p className="c4-meta">{tx("loading")}</p>}
      {data.error && <p className="c4-meta">{tx("failed")}</p>}
      <div className="c4-row" role="group" aria-label={v4("wnKind")}>
        <button type="button" className="c4-chip" data-on={kind === "win" ? "1" : "0"} aria-pressed={kind === "win"} onClick={() => setKind("win")}>{v4("wnWin")}</button>
        <button type="button" className="c4-chip" data-on={kind === "loss" ? "1" : "0"} aria-pressed={kind === "loss"} onClick={() => setKind("loss")}>{v4("wnLoss")}</button>
      </div>
      <label className="c4-lab">
        <span>{v4("wnCustomer")}</span>
        <select className="c4-select" aria-label={v4("wnCustomer")} value={customerId} onChange={(event) => setCustomerId(event.target.value)}>
          <option value="">{v4("wnUnlinked")}</option>
          {loaded.map((person) => (
            <option key={person.id} value={person.id}>{person.name || person.email || person.id}</option>
          ))}
        </select>
      </label>
      <form className="c4-row" onSubmit={(event) => {
        event.preventDefault();
        const next = addNote(notes, { id: `note-${Date.now()}`, kind, body, customerId, at: new Date().toISOString() });
        if (next.length === notes.length) return;
        store(next);
        setBody("");
      }}>
        <label className="c4-lab">
          <span>{v4("wnBody")}</span>
          <input className="c4-field" aria-label={v4("wnBody")} value={body} onChange={(event) => setBody(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn">{v4("wnAdd")}</button>
      </form>
      <p className="c4-meta">{v4("wnBlank")}</p>
      <label className="c4-lab">
        <span>{v4("wnSearch")}</span>
        <input className="c4-field" aria-label={v4("wnSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c4-row" role="group" aria-label={v4("wnAll")}>
        <button type="button" className="c4-chip" data-on={filter === "" ? "1" : "0"} aria-pressed={filter === ""} onClick={() => setFilter("")}>{v4("wnAll")}</button>
        <button type="button" className="c4-chip" data-on={filter === "win" ? "1" : "0"} aria-pressed={filter === "win"} onClick={() => setFilter("win")}>{v4("wnWin")}</button>
        <button type="button" className="c4-chip" data-on={filter === "loss" ? "1" : "0"} aria-pressed={filter === "loss"} onClick={() => setFilter("loss")}>{v4("wnLoss")}</button>
        <button type="button" className="c4-chip" data-on={archived ? "0" : "1"} aria-pressed={!archived} onClick={() => setArchivedView(false)}>{v4("wnOpen")}</button>
        <button type="button" className="c4-chip" data-on={archived ? "1" : "0"} aria-pressed={archived} onClick={() => setArchivedView(true)}>{v4("wnArchived")}</button>
      </div>
      {!shown.length && <p className="c4-pay-empty">{v4("wnEmpty")}</p>}
      <ul className="c4-win-list">
        {shown.map((note) => (
          <li key={note.id} className="c4-win-card" data-kind={note.kind} data-pinned={note.pinned ? "1" : "0"}>
            <p className="c4-meta">{note.kind === "win" ? v4("wnWin") : v4("wnLoss")}</p>
            <p>{note.body}</p>
            <p className="c4-meta">{v4("wnLinked")} {note.customerId ? (names[note.customerId] || note.customerId) : v4("wnUnlinked")}</p>
            <div className="c4-row">
              <button type="button" className="c4-btn" onClick={() => store(toggleNotePin(notes, note.id))}>{note.pinned ? v4("wnUnpin") : v4("wnPin")}</button>
              {note.archived ? (
                <button type="button" className="c4-btn" onClick={() => store(setArchived(notes, note.id, false))}>{v4("wnRestore")}</button>
              ) : (
                <button type="button" className="c4-btn" data-win-archive="" onClick={() => setPending(note.id)}>{v4("wnArchive")}</button>
              )}
            </div>
          </li>
        ))}
      </ul>
      {pending && (
        <div className="c4-pay-confirm" role="dialog" aria-modal="true" data-confirm="">
          <p>{v4("wnArchiveLead")}</p>
          <div className="c4-row">
            <button type="button" className="c4-btn c4-btn-hot" onClick={() => { store(setArchived(notes, pending, true)); setPending(""); }}>{v4("wnArchive")}</button>
            <button type="button" className="c4-btn" onClick={() => setPending("")}>{v4("wnCancel")}</button>
          </div>
        </div>
      )}
    </section>
  );
}
