"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readJson, writeJson } from "@/lib/crmv3/bridge";
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
} from "@/lib/crmv3/sessionnote";
import { crmv3Href } from "@/lib/crmv3/sections";
import { useJson } from "../kit";
import { useV3 } from "./store";

const WITHDRAWALS = "/api/admin/withdrawals?take=40";

type Withdrawal = {
  id: string;
  status?: string | null;
  userId?: string | null;
  user?: { id?: string | null; name?: string | null; email?: string | null } | null;
};

type GlanceRow = StatusRow & { id: string; userId: string };

export function SessionNote() {
  const v3 = useV3();
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
    <section className="c3-session-note" aria-label={v3("syTitle")} data-session-note="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("sySub")}</p>
          <h2 className="c3-title">{v3("syTitle")}</h2>
        </div>
        <p className="c3-muted">{saved ? 1 : 0}</p>
      </header>
      <p className="c3-muted">{v3("syHint")}</p>
      <p className="c3-muted">{v3("syLocal")}</p>
      {day && <p className="c3-muted" data-session-day="">{v3("syDay")} {day}</p>}
      <form className="c3-row" onSubmit={(event) => {
        event.preventDefault();
        const today = utcDay(Date.now());
        const next = saveSession(today, draft);
        if (!next) return;
        writeJson(NOTE_KEY, next);
        setDay(today);
        setSaved(next.text);
        setDraft(next.text);
      }}>
        <label className="c3-lab">
          <span>{v3("syText")}</span>
          <input className="c3-field" aria-label={v3("syText")} value={draft} maxLength={240} onChange={(event) => setDraft(event.target.value)} />
        </label>
        <button type="submit" className="c3-btn">{v3("sySave")}</button>
        <button type="button" className="c3-btn" onClick={() => {
          writeJson(NOTE_KEY, null);
          setSaved("");
          setDraft("");
        }}>{v3("syClear")}</button>
      </form>
      <p className="c3-muted">{v3("syBlank")}</p>
      {!saved && <p className="c3-empty">{v3("syEmpty")}</p>}
      {saved && <p className="c3-session-card" data-session-saved="">{saved}</p>}
    </section>
  );
}

export function WithdrawalGlance({ base }: { base: string }) {
  const v3 = useV3();
  const data = useJson<{ requests?: Withdrawal[] }>(WITHDRAWALS);
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
    <section className="c3-wd-status" aria-label={v3("wzTitle")} data-wd-status="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("wzSub")}</p>
          <h2 className="c3-title">{v3("wzTitle")}</h2>
        </div>
        <p className="c3-muted">{chips.length}</p>
      </header>
      <p className="c3-muted">{v3("wzHint")}</p>
      <p className="c3-muted">{v3("wzLocal")}</p>
      <p className="c3-row">
        <Link className="c3-btn" href={crmv3Href(base, "withdraw")}>{v3("wzBoard")}</Link>
      </p>
      {data.loading && !rows.length && <p className="c3-muted">{v3("wzLoading")}</p>}
      {data.error && <p className="c3-muted">{v3("wzFailed")}</p>}
      {!data.loading && !data.error && !rows.length && <p className="c3-empty">{v3("wzNone")}</p>}
      {blankCount > 0 && (
        <button type="button" className="c3-wd-blank" data-on={blank ? "1" : "0"} aria-pressed={blank} onClick={() => { setBlank((value) => !value); setSelected(""); }}>
          <span>{v3("wzBlank")}</span>
          <span className="c3-muted">{blankCount}</span>
        </button>
      )}
      <div className="c3-row" role="group" aria-label={v3("wzShown")}>
        <button type="button" className="c3-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v3("wzShown")}</button>
        <button type="button" className="c3-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v3("wzHidden")}</button>
      </div>
      <div className="c3-row" role="group" aria-label={v3("wzTitle")}>
        <button type="button" className="c3-chip" data-on={!status && !blank ? "1" : "0"} aria-pressed={!status && !blank} onClick={() => { setSelected(""); setBlank(false); }}>{v3("wzAll")}</button>
        {chips.map((item) => (
          <span key={item} className="c3-wd-pair" data-status={item}>
            <button type="button" className="c3-chip" data-on={status === item ? "1" : "0"} aria-pressed={status === item} onClick={() => { setBlank(false); setSelected(status === item ? "" : item); }}>{item}</button>
            <button type="button" className="c3-btn" onClick={() => store(toggleStatus(hiddenStatuses, item, present), showHidden ? "" : item)}>{showHidden ? v3("wzShow") : v3("wzHide")}</button>
          </span>
        ))}
      </div>
      <label className="c3-lab">
        <span>{v3("wzSearch")}</span>
        <input className="c3-field" aria-label={v3("wzSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c3-empty">{v3("wzEmpty")}</p>}
      <ul className="c3-wd-rows">
        {shown.map((row) => {
          const name = statusText(row.status);
          return (
            <li key={row.id} data-status={name || "blank"}>
              <p>{row.label || row.id}</p>
              <p className="c3-muted">{name || v3("wzBlank")}</p>
              {row.userId && <Link className="c3-btn" href={crmv3Href(base, `customers/${row.userId}`)}>{v3("wzCustomer")}</Link>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
