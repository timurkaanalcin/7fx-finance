"use client";

import { type FormEvent, useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import {
  callCount,
  dayBucket,
  emailOk,
  filterFeed,
  formScore,
  lastContact,
  mergeFeed,
  missingFields,
  passwordHint,
  phoneShort,
  pinFirst,
  sameEntry,
  splitName,
  type CallLog,
  type FeedKind,
} from "@/lib/crmv4/round17";
import { downloadCsv, useJson, when } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;
const CALL_KEY = "crmv4-call-log";
const PIN_KEY = "crmv4-feed-pins";

const KIND_LABEL: Record<FeedKind, CrmV4CopyKey> = {
  note: "feedNotes",
  call: "feedCalls",
  status: "feedStatus",
  money: "feedMoney",
};

function todayStamp() {
  return new Date().toISOString().slice(0, 10);
}

export function ContactFeed({ id, notes, events, v4, locale }: {
  id: string;
  notes: { id: string; body?: string | null; authorName?: string | null; createdAt?: string | null }[];
  events: { id: string; kind?: string | null; path?: string | null; createdAt?: string | null }[];
  v4: V4;
  locale: string;
}) {
  const money = useJson<{ transactions?: { id: string; type?: string; amount?: number; currency?: string; createdAt?: string; comment?: string }[] }>(`/api/admin/transactions?userId=${encodeURIComponent(id)}&limit=20`);
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [pins, setPins] = useState<string[]>([]);
  const [kind, setKind] = useState<"" | FeedKind>("");
  const [query, setQuery] = useState("");
  const [outcome, setOutcome] = useState("reached");
  const [minutes, setMinutes] = useState("");
  const [next, setNext] = useState("");
  const [note, setNote] = useState("");
  useEffect(() => {
    const all = readJson<Record<string, CallLog[]>>(CALL_KEY, {});
    setCalls(all[id] || []);
    setPins(readJson<string[]>(PIN_KEY, []));
  }, [id]);
  const items = mergeFeed({ notes, events, calls, money: money.data?.transactions || [] });
  const shown = pinFirst(filterFeed(items, kind, query), pins);
  const today = todayStamp();
  const latest = lastContact(items);

  function saveCall(event: FormEvent) {
    event.preventDefault();
    const row: CallLog = {
      id: String(Date.now()),
      at: new Date().toISOString(),
      outcome,
      minutes: Number(minutes) || 0,
      next,
      note: note.trim(),
    };
    const all = readJson<Record<string, CallLog[]>>(CALL_KEY, {});
    const nextRows = [row, ...(all[id] || [])].slice(0, 40);
    all[id] = nextRows;
    writeJson(CALL_KEY, all);
    window.dispatchEvent(new Event("crmv4:call-log"));
    setCalls(nextRows);
    setMinutes("");
    setNext("");
    setNote("");
  }

  function togglePin(itemId: string) {
    const nextPins = pins.includes(itemId) ? pins.filter((item) => item !== itemId) : [itemId, ...pins].slice(0, 20);
    setPins(nextPins);
    writeJson(PIN_KEY, nextPins);
  }

  return (
    <section className="c4-feed-luxe" aria-label={v4("feedTitle")}>
      <div className="c4-fin-hero">
        <div className="c4-fin-metric"><span>{v4("feedTitle")}</span><strong>{shown.length}</strong></div>
        <div className="c4-fin-metric"><span>{v4("callsLogged")}</span><strong>{callCount(items)}</strong></div>
        <div className="c4-fin-metric"><span>{v4("lastContact")}</span><strong>{latest ? when(latest, locale) : "—"}</strong></div>
      </div>
      <p className="c4-muted c4-pad">{v4("feedHint")}</p>
      <form className="c4-form c4-pad" onSubmit={saveCall}>
        <h3 className="c4-title">{v4("logCall")}</h3>
        <p className="c4-muted">{v4("nothingSent")}</p>
        <label className="c4-lab">
          <span>{v4("logCall")}</span>
          <select className="c4-select" aria-label={v4("logCall")} value={outcome} onChange={(event) => setOutcome(event.target.value)}>
            <option value="reached">{v4("callReached")}</option>
            <option value="noAnswer">{v4("callNoAnswer")}</option>
            <option value="busy">{v4("callBusy")}</option>
            <option value="callback">{v4("callCallback")}</option>
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("callMinutes")}</span>
          <input className="c4-field" inputMode="numeric" aria-label={v4("callMinutes")} value={minutes} onChange={(event) => setMinutes(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("callNext")}</span>
          <input className="c4-field" type="date" aria-label={v4("callNext")} value={next} onChange={(event) => setNext(event.target.value)} />
        </label>
        <input className="c4-field" aria-label={v4("feedNotes")} value={note} onChange={(event) => setNote(event.target.value)} />
        <button type="submit" className="c4-btn c4-btn-hot">{v4("logCall")}</button>
      </form>
      <div className="c4-row c4-pad">
        <button type="button" className="c4-chip" data-on={kind === "" ? "1" : "0"} onClick={() => setKind("")}>{v4("feedAll")}</button>
        {(["note", "call", "status", "money"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={kind === item ? "1" : "0"} onClick={() => setKind(item)}>{v4(KIND_LABEL[item])}</button>
        ))}
        <input className="c4-field" aria-label={v4("feedSearch")} placeholder={v4("feedSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
        <button type="button" className="c4-btn" onClick={() => downloadCsv("contact-history.csv", ["kind", "at", "title", "detail"], shown.map((row) => [row.kind, row.at, row.title, row.detail]))}>{v4("feedCsv")}</button>
      </div>
      <ol className="c4-feed">
        {shown.map((item) => (
          <li key={item.id} className="c4-feed-item" data-kind={item.kind} data-pin={pins.includes(item.id) ? "1" : "0"}>
            <span className="c4-muted">{dayBucket(item.at, today) === "today" ? v4("feedToday") : v4("feedEarlier")}</span>
            <strong>{v4(KIND_LABEL[item.kind])}</strong>
            <p>{item.title || "—"}</p>
            <p className="c4-muted">{item.detail} · {when(item.at, locale)}</p>
            <button type="button" className="c4-btn" aria-pressed={pins.includes(item.id)} onClick={() => togglePin(item.id)}>{v4("pinItem")}</button>
          </li>
        ))}
      </ol>
      {!shown.length && <p className="c4-empty-gold">{v4("feedTitle")}</p>}
    </section>
  );
}

export type EntryFields = { name: string; email: string; phone: string; country: string };

export function EntryQuality({ fields, initial, password, v4 }: {
  fields: EntryFields;
  initial?: EntryFields;
  password?: string;
  v4: V4;
}) {
  const missing = missingFields(fields);
  const score = formScore(fields);
  const dirty = initial ? !sameEntry(fields, initial) : Boolean(fields.name || fields.email);
  const hint = password == null ? "" : passwordHint(password);
  return (
    <section className="c4-quality" aria-label={v4("formQuality")}>
      <div className="c4-fin-metric"><span>{v4("formQuality")}</span><strong>{score}%</strong></div>
      {missing.length > 0 && <p className="c4-muted">{v4("missingFields")}: {missing.join(", ")}</p>}
      {fields.email && !emailOk(fields.email) && <p className="c4-muted">{v4("emailCheck")}</p>}
      {phoneShort(fields.phone) && <p className="c4-muted">{v4("phoneCheck")}</p>}
      {dirty && <p className="c4-muted">{v4("dirtyForm")}</p>}
      {hint === "short" && <p className="c4-muted">{v4("passwordHint")}</p>}
      <p className="c4-muted">{v4("countryHint")}</p>
    </section>
  );
}

export function applySplit(name: string, first: HTMLInputElement | null, last: HTMLInputElement | null) {
  const parts = splitName(name);
  if (first && !first.value) first.value = parts.first;
  if (last && !last.value && parts.last) last.value = parts.last;
}

export { emailOk };
