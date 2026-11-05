"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import {
  NOTE_KEY,
  WD_STATUS_KEY,
  activeStatus,
  namedStatuses,
  readHiddenStatuses,
  readSession,
  saveSession,
  statusLines,
  statusText,
  toggleStatus,
  utcDay,
  visibleStatuses,
  visibleWithdrawals,
  type StatusRow,
} from "@/lib/crmv4/round95";
import { crmv4Href } from "@/lib/crmv4/sections";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

type Withdrawal = {
  id: string;
  status?: string | null;
  userId?: string | null;
  user?: { id?: string | null; name?: string | null; email?: string | null } | null;
};

type GlanceRow = StatusRow & { id: string; userId: string };

export function SessionNote({ v4 }: { v4: V4 }) {
  const [day, setDay] = useState("");
  const [saved, setSaved] = useState("");
  const [draft, setDraft] = useState("");
  useEffect(() => {
    const today = utcDay(Date.now());
    const stored = readJson<unknown>(NOTE_KEY, null);
    const text = readSession(stored, today);
    if (!text && stored) writeJson(NOTE_KEY, null);
    setDay(today);
    setSaved(text);
    setDraft(text);
  }, []);

  return (
    <section className="c4-session-note" aria-label={v4("syTitle")} data-session-note="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-pay-kicker">{v4("sySub")}</p>
          <h2 className="c4-title">{v4("syTitle")}</h2>
        </div>
        <p className="c4-meta">{saved ? 1 : 0}</p>
      </header>
      <p className="c4-meta">{v4("syHint")}</p>
      <p className="c4-meta">{v4("syLocal")}</p>
      {day && <p className="c4-meta" data-session-day="">{v4("syDay")} {day}</p>}
      <form className="c4-row" onSubmit={(event) => {
        event.preventDefault();
        const today = utcDay(Date.now());
        const next = saveSession(today, draft);
        if (!next) return;
        writeJson(NOTE_KEY, next);
        setDay(today);
        setSaved(next.text);
        setDraft(next.text);
      }}>
        <label className="c4-lab">
          <span>{v4("syText")}</span>
          <input className="c4-field" aria-label={v4("syText")} value={draft} maxLength={240} onChange={(event) => setDraft(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn">{v4("sySave")}</button>
        <button type="button" className="c4-btn" onClick={() => {
          writeJson(NOTE_KEY, null);
          setSaved("");
          setDraft("");
        }}>{v4("syClear")}</button>
      </form>
      <p className="c4-meta">{v4("syBlank")}</p>
      {!saved && <p className="c4-pay-empty">{v4("syEmpty")}</p>}
      {saved && <p className="c4-session-card" data-session-saved="">{saved}</p>}
    </section>
  );
}

export function WithdrawalGlance({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ requests?: Withdrawal[] }>("/api/admin/withdrawals?take=40");
  const [hiddenStatuses, setHiddenStatuses] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [blank, setBlank] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [query, setQuery] = useState("");
  const rows = (data.data?.requests || []).map((row): GlanceRow | null => {
    const id = String(row.id || "").trim();
    if (!id) return null;
    return {
      id,
      status: row.status,
      label: String(row.user?.name || row.user?.email || ""),
      userId: String(row.user?.id || row.userId || "").trim(),
    };
  }).filter((row): row is GlanceRow => Boolean(row));
  const lines = statusLines(rows);
  const present = namedStatuses(rows);
  const presentKey = present.join("\n");
  const blankCount = lines.find((line) => !line.status)?.count || 0;
  useEffect(() => {
    if (data.loading || data.error) return;
    const next = readHiddenStatuses(readJson(WD_STATUS_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHiddenStatuses(next);
    writeJson(WD_STATUS_KEY, next);
  }, [data.loading, data.error, presentKey]);
  const chips = visibleStatuses(present, hiddenStatuses, showHidden);
  const status = activeStatus(selected, chips);
  const shown = visibleWithdrawals(rows, status, blank, query);

  function store(next: string[], clear: string) {
    setHiddenStatuses(next);
    writeJson(WD_STATUS_KEY, next);
    if (clear && activeStatus(selected, [clear])) setSelected("");
  }

  return (
    <section className="c4-wd-status" aria-label={v4("wzTitle")} data-wd-status="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-pay-kicker">{v4("wzSub")}</p>
          <h2 className="c4-title">{v4("wzTitle")}</h2>
        </div>
        <p className="c4-meta">{chips.length}</p>
      </header>
      <p className="c4-meta">{v4("wzHint")}</p>
      <p className="c4-meta">{v4("wzLocal")}</p>
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "withdraw")}>{v4("wzBoard")}</Link>
      </p>
      {data.loading && !rows.length && <p className="c4-meta">{v4("wzLoading")}</p>}
      {data.error && <p className="c4-meta">{v4("wzFailed")}</p>}
      {!data.loading && !data.error && !rows.length && <p className="c4-pay-empty">{v4("wzNone")}</p>}
      {blankCount > 0 && (
        <button type="button" className="c4-wd-blank" data-on={blank ? "1" : "0"} aria-pressed={blank} onClick={() => { setBlank((value) => !value); setSelected(""); }}>
          <span>{v4("wzBlank")}</span>
          <span className="c4-meta">{blankCount}</span>
        </button>
      )}
      <div className="c4-row" role="group" aria-label={v4("wzShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("wzShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("wzHidden")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("wzTitle")}>
        <button type="button" className="c4-chip" data-on={!status && !blank ? "1" : "0"} aria-pressed={!status && !blank} onClick={() => { setSelected(""); setBlank(false); }}>{v4("wzAll")}</button>
        {chips.map((item) => (
          <span key={item} className="c4-wd-pair" data-status={item}>
            <button type="button" className="c4-chip" data-on={status === item ? "1" : "0"} aria-pressed={status === item} onClick={() => { setBlank(false); setSelected(status === item ? "" : item); }}>{item}</button>
            <button type="button" className="c4-btn" onClick={() => store(toggleStatus(hiddenStatuses, item, present), showHidden ? "" : item)}>{showHidden ? v4("wzShow") : v4("wzHide")}</button>
          </span>
        ))}
      </div>
      <label className="c4-lab">
        <span>{v4("wzSearch")}</span>
        <input className="c4-field" aria-label={v4("wzSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c4-pay-empty">{v4("wzEmpty")}</p>}
      <ul className="c4-wd-rows">
        {shown.map((row) => {
          const name = statusText(row.status);
          return (
            <li key={row.id} data-status={name || "blank"}>
              <p>{row.label || row.id}</p>
              <p className="c4-meta">{name || v4("wzBlank")}</p>
              {row.userId && <Link className="c4-btn" href={crmv4Href(base, `customers/${row.userId}`)}>{v4("wzCustomer")}</Link>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
