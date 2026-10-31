"use client";

import { type FormEvent, useState } from "react";
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
} from "@/lib/crmv3/bridge";
import type { CrmV3CopyKey } from "@/lib/crmv3/copy";
import { downloadCsv, useJson, when } from "../kit";
import { useLocal, useV3 } from "./store";

const CALL_KEY = "crmv3-call-log";
const PIN_KEY = "crmv3-feed-pins";

const KIND_LABEL: Record<FeedKind, CrmV3CopyKey> = {
  note: "feedNotes",
  call: "feedCalls",
  status: "feedStatus",
  money: "feedMoney",
};

function todayStamp() {
  return new Date().toISOString().slice(0, 10);
}

export function ContactFeed({ id, notes, events, locale }: {
  id: string;
  notes: { id: string; body?: string | null; authorName?: string | null; createdAt?: string | null }[];
  events: { id: string; kind?: string | null; path?: string | null; createdAt?: string | null }[];
  locale: string;
}) {
  const v3 = useV3();
  const money = useJson<{ transactions?: { id: string; type?: string; amount?: number; currency?: string; createdAt?: string; comment?: string }[] }>(`/api/admin/transactions?userId=${encodeURIComponent(id)}&limit=20`);
  const [allCalls, setAllCalls] = useLocal<Record<string, CallLog[]>>(CALL_KEY, {});
  const [pins, setPins] = useLocal<string[]>(PIN_KEY, []);
  const [kind, setKind] = useState<"" | FeedKind>("");
  const [query, setQuery] = useState("");
  const [outcome, setOutcome] = useState("reached");
  const [minutes, setMinutes] = useState("");
  const [next, setNext] = useState("");
  const [note, setNote] = useState("");
  const calls = allCalls[id] || [];
  const items = mergeFeed({ notes, events, calls, money: money.data?.transactions || [] });
  const shown = pinFirst(filterFeed(items, kind, query), pins);
  const today = todayStamp();
  const latest = lastContact(items);

  function saveCall(event: FormEvent) {
    event.preventDefault();
    const row: CallLog = {
      id: `${id}-${Date.now()}`,
      at: new Date().toISOString(),
      outcome,
      minutes: Number(minutes) || 0,
      next,
      note: note.trim(),
    };
    setAllCalls((prev) => ({ ...prev, [id]: [row, ...(prev[id] || [])].slice(0, 40) }));
    setMinutes("");
    setNext("");
    setNote("");
  }

  function togglePin(itemId: string) {
    setPins(pins.includes(itemId) ? pins.filter((item) => item !== itemId) : [...pins, itemId]);
  }

  return (
    <section className="c3-stack" aria-label={v3("feedTitle")}>
      <div className="c3-kpis">
        <div className="c3-kpi"><p className="c3-kpi-label">{v3("callsLogged")}</p><p className="c3-kpi-value">{callCount(items)}</p></div>
        <div className="c3-kpi"><p className="c3-kpi-label">{v3("lastContact")}</p><p className="c3-kpi-value">{latest ? when(latest, locale) : "—"}</p></div>
      </div>
      <p className="c3-muted">{v3("feedHint")}</p>
      <form className="c3-form c3-form-2" onSubmit={saveCall}>
        <p className="c3-kicker c3-span">{v3("logCall")}</p>
        <label className="c3-lab">
          <span>{v3("outcomeWord")}</span>
          <select className="c3-select" aria-label={v3("outcomeWord")} value={outcome} onChange={(event) => setOutcome(event.target.value)}>
            <option value="reached">{v3("callReached")}</option>
            <option value="no">{v3("callNoAnswer")}</option>
            <option value="busy">{v3("callBusy")}</option>
            <option value="back">{v3("callCallback")}</option>
          </select>
        </label>
        <label className="c3-lab">
          <span>{v3("callMinutes")}</span>
          <input className="c3-field" inputMode="numeric" aria-label={v3("callMinutes")} value={minutes} onChange={(event) => setMinutes(event.target.value)} />
        </label>
        <label className="c3-lab">
          <span>{v3("callNext")}</span>
          <input className="c3-field" type="date" aria-label={v3("callNext")} value={next} onChange={(event) => setNext(event.target.value)} />
        </label>
        <label className="c3-lab">
          <span>{v3("callNote")}</span>
          <input className="c3-field" aria-label={v3("callNote")} value={note} onChange={(event) => setNote(event.target.value)} />
        </label>
        <p className="c3-muted c3-span">{v3("nothingSent")}</p>
        <button type="submit" className="c3-btn c3-btn-hot">{v3("logCall")}</button>
      </form>
      <div className="c3-tools">
        <button type="button" className="c3-chip" data-on={kind === "" ? "1" : "0"} onClick={() => setKind("")}>{v3("feedAll")}</button>
        {(Object.keys(KIND_LABEL) as FeedKind[]).map((item) => (
          <button key={item} type="button" className="c3-chip" data-on={kind === item ? "1" : "0"} onClick={() => setKind(item)}>{v3(KIND_LABEL[item])}</button>
        ))}
        <input className="c3-field" aria-label={v3("feedSearch")} placeholder={v3("feedSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
        <button type="button" className="c3-btn" onClick={() => downloadCsv("contact-history.csv", ["kind", "at", "title", "detail"], shown.map((item) => [item.kind, item.at, item.title, item.detail]))}>{v3("feedCsv")}</button>
      </div>
      <p className="c3-muted">{v3("exportLocal")}</p>
      {(["today", "earlier"] as const).map((bucket) => {
        const group = shown.filter((item) => dayBucket(item.at, today) === bucket);
        if (!group.length) return null;
        return (
          <div key={bucket}>
            <h3 className="c3-title c3-pad">{v3(bucket === "today" ? "feedToday" : "feedEarlier")}</h3>
            <ol className="c3-stack">
              {group.map((item) => (
                <li key={item.id} className="c3-feed" data-kind={item.kind}>
                  <div className="c3-row c3-between">
                    <strong>{v3(KIND_LABEL[item.kind])}</strong>
                    <button type="button" className="c3-btn" data-on={pins.includes(item.id) ? "1" : "0"} onClick={() => togglePin(item.id)}>{v3("pinItem")}</button>
                  </div>
                  <div>{item.title || "—"}</div>
                  <div className="c3-muted">{item.detail}</div>
                  <div className="c3-muted">{when(item.at, locale)}</div>
                </li>
              ))}
            </ol>
          </div>
        );
      })}
      {!shown.length && <p className="c3-empty">{v3("feedEmpty")}</p>}
    </section>
  );
}

export type EntryFields = { name: string; email: string; phone: string; country: string };

export function EntryQuality({ fields, initial, password }: {
  fields: EntryFields;
  initial?: EntryFields;
  password?: string;
}) {
  const v3 = useV3();
  const missing = missingFields(fields);
  const score = formScore(fields);
  const dirty = initial ? !sameEntry(fields, initial) : Boolean(fields.name || fields.email || fields.phone || fields.country);
  const hint = password == null ? "" : passwordHint(password);
  return (
    <section aria-label={v3("formQuality")}>
      <div className="c3-meter" aria-hidden><span style={{ width: `${score}%` }} /></div>
      <p className="c3-muted">{v3("formQuality")} {score}%</p>
      {missing.length > 0 && <p className="c3-muted">{v3("missingFields")}: {missing.join(", ")}</p>}
      {fields.email && !emailOk(fields.email) && <p className="c3-muted">{v3("emailCheck")}</p>}
      {phoneShort(fields.phone) && <p className="c3-muted">{v3("phoneCheck")}</p>}
      {dirty && <p className="c3-muted">{v3("dirtyForm")}</p>}
      {hint === "short" && <p className="c3-muted">{v3("passwordHint")}</p>}
      <p className="c3-muted">{v3("countryHint")}</p>
    </section>
  );
}

export function applySplit(name: string, first: HTMLInputElement | null, last: HTMLInputElement | null) {
  const parts = splitName(name);
  if (first && !first.value) first.value = parts.first;
  if (last && !last.value && parts.last) last.value = parts.last;
}

export { emailOk, phoneShort, sameEntry };
