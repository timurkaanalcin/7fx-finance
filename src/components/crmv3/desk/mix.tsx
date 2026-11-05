"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readJson, writeJson } from "@/lib/crmv3/bridge";
import type { CrmV3CopyKey } from "@/lib/crmv3/copy";
import { useEscape } from "@/lib/crmv3/focus";
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
} from "@/lib/crmv3/mix";
import { crmv3Href } from "@/lib/crmv3/sections";
import { useJson, type Tx } from "../kit";
import { useV3 } from "./store";

const FIELD_KEY: Record<SourceField, CrmV3CopyKey> = {
  affiliateA: "sxA",
  affiliateB: "sxB",
  affiliateC: "sxC",
  referralCodeUsed: "sxReferral",
  campaign: "sxCampaign",
};

export function SourceMix({ base, tx }: { base: string; tx: Tx }) {
  const v3 = useV3();
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
    <section className="c3-source-mix" aria-label={v3("sxTitle")} data-source-mix="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("sxSub")}</p>
          <h2 className="c3-title">{v3("sxTitle")}</h2>
        </div>
        <p className="c3-muted">{v3("sxTotal")} {mixCount(groups)}</p>
      </header>
      <p className="c3-muted">{v3("sxHint")}</p>
      <div className="c3-row" role="group" aria-label={v3("sxTitle")}>
        {SOURCE_FIELDS.map((item) => (
          <button
            key={item}
            type="button"
            className="c3-chip"
            data-on={field === item ? "1" : "0"}
            aria-pressed={field === item}
            onClick={() => setField(item)}
          >
            {v3(FIELD_KEY[item])}
          </button>
        ))}
      </div>
      <label className="c3-lab">
        <span>{v3("sxSearch")}</span>
        <input className="c3-field" aria-label={v3("sxSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {data.loading && !loaded.length && <p className="c3-muted">{v3("sxLoading")}</p>}
      {data.error && <p className="c3-muted">{v3("sxFailed")} {tx("failed")}</p>}
      {!data.loading && !data.error && !loaded.length && <p className="c3-empty">{v3("sxNone")}</p>}
      {!data.loading && !data.error && loaded.length > 0 && !groups.length && <p className="c3-empty">{v3("sxEmpty")}</p>}
      <ul className="c3-source-list">
        {groups.map((group) => (
          <li key={group.id} className="c3-source-card" data-pinned={pinned.includes(group.id) ? "1" : "0"} data-blank={group.value ? "0" : "1"}>
            <div className="c3-source-top">
              <strong>{group.value || v3("sxBlank")}</strong>
              <span className="c3-source-count">{group.count}</span>
            </div>
            <p className="c3-muted">{v3("sxCount")} · {v3(FIELD_KEY[isSourceField(group.field) ? group.field : "affiliateA"])}</p>
            <ul className="c3-source-people">
              {group.people.map((person) => (
                <li key={person.id}>
                  <Link className="c3-btn" href={crmv3Href(base, `customers/${person.id}`)}>{v3("sxOpen")} {person.name}</Link>
                </li>
              ))}
            </ul>
            <button type="button" className="c3-btn" data-source-pin="" onClick={() => store(toggleId(pinned, group.id))}>
              {pinned.includes(group.id) ? v3("sxUnpin") : v3("sxPin")}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function WinLog({ tx }: { tx: Tx }) {
  const v3 = useV3();
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
    <section className="c3-win-log" aria-label={v3("wnTitle")} data-win-log="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("wnSub")}</p>
          <h2 className="c3-title">{v3("wnTitle")}</h2>
        </div>
        <p className="c3-muted">{shown.length}</p>
      </header>
      <p className="c3-muted">{v3("wnHint")}</p>
      <p className="c3-muted">{v3("wnLocal")}</p>
      {data.loading && !loaded.length && <p className="c3-muted">{tx("loading")}</p>}
      {data.error && <p className="c3-muted">{tx("failed")}</p>}
      <div className="c3-row" role="group" aria-label={v3("wnKind")}>
        <button type="button" className="c3-chip" data-on={kind === "win" ? "1" : "0"} aria-pressed={kind === "win"} onClick={() => setKind("win")}>{v3("wnWin")}</button>
        <button type="button" className="c3-chip" data-on={kind === "loss" ? "1" : "0"} aria-pressed={kind === "loss"} onClick={() => setKind("loss")}>{v3("wnLoss")}</button>
      </div>
      <label className="c3-lab">
        <span>{v3("wnCustomer")}</span>
        <select className="c3-select" aria-label={v3("wnCustomer")} value={customerId} onChange={(event) => setCustomerId(event.target.value)}>
          <option value="">{v3("wnUnlinked")}</option>
          {loaded.map((person) => (
            <option key={person.id} value={person.id}>{person.name || person.email || person.id}</option>
          ))}
        </select>
      </label>
      <div className="c3-row">
        <label className="c3-lab">
          <span>{v3("wnBody")}</span>
          <input className="c3-field" aria-label={v3("wnBody")} value={body} onChange={(event) => setBody(event.target.value)} />
        </label>
        <button type="button" className="c3-btn" onClick={() => {
          const next = addNote(notes, { id: `note-${Date.now()}`, kind, body, customerId, at: new Date().toISOString() });
          if (next.length === notes.length) return;
          store(next);
          setBody("");
        }}>{v3("wnAdd")}</button>
      </div>
      <p className="c3-muted">{v3("wnBlank")}</p>
      <label className="c3-lab">
        <span>{v3("wnSearch")}</span>
        <input className="c3-field" aria-label={v3("wnSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c3-row" role="group" aria-label={v3("wnAll")}>
        <button type="button" className="c3-chip" data-on={filter === "" ? "1" : "0"} aria-pressed={filter === ""} onClick={() => setFilter("")}>{v3("wnAll")}</button>
        <button type="button" className="c3-chip" data-on={filter === "win" ? "1" : "0"} aria-pressed={filter === "win"} onClick={() => setFilter("win")}>{v3("wnWin")}</button>
        <button type="button" className="c3-chip" data-on={filter === "loss" ? "1" : "0"} aria-pressed={filter === "loss"} onClick={() => setFilter("loss")}>{v3("wnLoss")}</button>
        <button type="button" className="c3-chip" data-on={archived ? "0" : "1"} aria-pressed={!archived} onClick={() => setArchivedView(false)}>{v3("wnOpen")}</button>
        <button type="button" className="c3-chip" data-on={archived ? "1" : "0"} aria-pressed={archived} onClick={() => setArchivedView(true)}>{v3("wnArchived")}</button>
      </div>
      {!shown.length && <p className="c3-empty">{v3("wnEmpty")}</p>}
      <ul className="c3-win-list">
        {shown.map((note) => (
          <li key={note.id} className="c3-win-card" data-kind={note.kind} data-pinned={note.pinned ? "1" : "0"}>
            <p className="c3-muted">{note.kind === "win" ? v3("wnWin") : v3("wnLoss")}</p>
            <p>{note.body}</p>
            <p className="c3-muted">{v3("wnLinked")} {note.customerId ? (names[note.customerId] || note.customerId) : v3("wnUnlinked")}</p>
            <div className="c3-row">
              <button type="button" className="c3-btn" onClick={() => store(toggleNotePin(notes, note.id))}>{note.pinned ? v3("wnUnpin") : v3("wnPin")}</button>
              {note.archived ? (
                <button type="button" className="c3-btn" onClick={() => store(setArchived(notes, note.id, false))}>{v3("wnRestore")}</button>
              ) : (
                <button type="button" className="c3-btn" data-win-archive="" onClick={() => setPending(note.id)}>{v3("wnArchive")}</button>
              )}
            </div>
          </li>
        ))}
      </ul>
      {pending && (
        <div className="c3-pay-confirm" role="dialog" aria-modal="true" data-confirm="">
          <p>{v3("wnArchiveLead")}</p>
          <div className="c3-row">
            <button type="button" className="c3-btn c3-btn-hot" onClick={() => { store(setArchived(notes, pending, true)); setPending(""); }}>{v3("wnArchive")}</button>
            <button type="button" className="c3-btn" onClick={() => setPending("")}>{v3("wnCancel")}</button>
          </div>
        </div>
      )}
    </section>
  );
}
