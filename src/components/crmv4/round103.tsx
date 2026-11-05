"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { CRM_V4_SECTIONS, crmv4Href } from "@/lib/crmv4/sections";
import {
  BOOK_KEY,
  WD_GLANCE_KEY,
  activeStatus,
  addBookmark,
  namedStatuses,
  readBookmarks,
  readHiddenStatuses,
  sectionPath,
  setBookmarkHidden,
  statusLines,
  statusText,
  toggleBookmarkPin,
  toggleStatus,
  visibleBookmarks,
  visibleStatuses,
  visibleWithdrawals,
  type Bookmark,
  type StatusRow,
} from "@/lib/crmv4/round103";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

type Withdrawal = {
  id: string;
  status?: string | null;
  userId?: string | null;
  user?: { id?: string | null; name?: string | null; email?: string | null } | null;
};

type GlanceRow = StatusRow & { id: string; userId: string };

export function BookmarkBoard({ base, v4 }: { base: string; v4: V4 }) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [label, setLabel] = useState("");
  const [section, setSection] = useState("customers");
  const [query, setQuery] = useState("");
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const next = readBookmarks(readJson(BOOK_KEY, []));
    setBookmarks(next);
    writeJson(BOOK_KEY, next);
  }, []);
  const shown = visibleBookmarks(bookmarks, query, hidden);

  function store(next: Bookmark[]) {
    setBookmarks(next);
    writeJson(BOOK_KEY, next);
  }

  return (
    <section className="c4-bookmark-board" aria-label={v4("bqTitle")} data-bookmark-board="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-pay-kicker">{v4("bqSub")}</p>
          <h2 className="c4-title">{v4("bqTitle")}</h2>
        </div>
        <p className="c4-meta">{shown.length}</p>
      </header>
      <p className="c4-meta">{v4("bqHint")}</p>
      <p className="c4-meta">{v4("bqLocal")}</p>
      <form className="c4-row" onSubmit={(event) => {
        event.preventDefault();
        const next = addBookmark(bookmarks, { id: `bq-${Date.now()}`, label, section, at: new Date().toISOString() });
        if (next.length === bookmarks.length) return;
        store(next);
        setLabel("");
      }}>
        <label className="c4-lab">
          <span>{v4("bqLabel")}</span>
          <input className="c4-field" aria-label={v4("bqLabel")} value={label} maxLength={40} onChange={(event) => setLabel(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("bqSection")}</span>
          <select className="c4-field" aria-label={v4("bqSection")} value={section} onChange={(event) => setSection(event.target.value)}>
            {CRM_V4_SECTIONS.map((item) => <option key={item.id} value={item.id}>{item.id}</option>)}
          </select>
        </label>
        <button type="submit" className="c4-btn">{v4("bqAdd")}</button>
      </form>
      <p className="c4-meta">{v4("bqBlank")}</p>
      <label className="c4-lab">
        <span>{v4("bqSearch")}</span>
        <input className="c4-field" aria-label={v4("bqSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c4-row" role="group" aria-label={v4("bqShown")}>
        <button type="button" className="c4-chip" data-on={hidden ? "0" : "1"} aria-pressed={!hidden} onClick={() => setHidden(false)}>{v4("bqShown")}</button>
        <button type="button" className="c4-chip" data-on={hidden ? "1" : "0"} aria-pressed={hidden} onClick={() => setHidden(true)}>{v4("bqHidden")}</button>
      </div>
      {!shown.length && <p className="c4-pay-empty">{v4("bqEmpty")}</p>}
      <ul className="c4-bookmark-list">
        {shown.map((item) => (
          <li key={item.id} className="c4-bookmark-card" data-pinned={item.pinned ? "1" : "0"} data-section={item.section}>
            <p>{item.label}</p>
            <p className="c4-meta">{item.section}</p>
            <div className="c4-row">
              <Link className="c4-btn" href={crmv4Href(base, sectionPath(item.section))}>{v4("bqOpen")}</Link>
              <button type="button" className="c4-btn" onClick={() => store(toggleBookmarkPin(bookmarks, item.id))}>{item.pinned ? v4("bqUnpin") : v4("bqPin")}</button>
              <button type="button" className="c4-btn" onClick={() => store(setBookmarkHidden(bookmarks, item.id, !item.hidden))}>{item.hidden ? v4("bqShow") : v4("bqHide")}</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function WithdrawalStatus({ base, v4 }: { base: string; v4: V4 }) {
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
      label: String(row.user?.name || row.user?.email || "").trim(),
      userId: String(row.user?.id || row.userId || "").trim(),
    };
  }).filter((row): row is GlanceRow => Boolean(row));
  const lines = statusLines(rows);
  const present = namedStatuses(rows);
  const presentKey = present.join("\n");
  const blankCount = lines.find((line) => !line.status)?.count || 0;
  useEffect(() => {
    if (data.loading || data.error) return;
    const next = readHiddenStatuses(readJson(WD_GLANCE_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHiddenStatuses(next);
    writeJson(WD_GLANCE_KEY, next);
  }, [data.loading, data.error, presentKey]);
  const chips = visibleStatuses(present, hiddenStatuses, showHidden);
  const status = activeStatus(selected, chips);
  const shown = visibleWithdrawals(rows, status, blank, query);

  function store(next: string[], clear: string) {
    setHiddenStatuses(next);
    writeJson(WD_GLANCE_KEY, next);
    if (clear && activeStatus(selected, [clear])) setSelected("");
  }

  return (
    <section className="c4-wd-glance" aria-label={v4("wxTitle")} data-wd-glance="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-pay-kicker">{v4("wxSub")}</p>
          <h2 className="c4-title">{v4("wxTitle")}</h2>
        </div>
        <p className="c4-meta">{chips.length}</p>
      </header>
      <p className="c4-meta">{v4("wxHint")}</p>
      <p className="c4-meta">{v4("wxLocal")}</p>
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "withdraw")}>{v4("wxBoard")}</Link>
      </p>
      {data.loading && !rows.length && <p className="c4-meta">{v4("wxLoading")}</p>}
      {data.error && <p className="c4-meta">{v4("wxFailed")}</p>}
      {!data.loading && !data.error && !rows.length && <p className="c4-pay-empty">{v4("wxNone")}</p>}
      {blankCount > 0 && (
        <button type="button" className="c4-wdg-blank" data-on={blank ? "1" : "0"} aria-pressed={blank} onClick={() => { setBlank((value) => !value); setSelected(""); }}>
          <span>{v4("wxBlank")}</span>
          <span className="c4-meta">{blankCount}</span>
        </button>
      )}
      <div className="c4-row" role="group" aria-label={v4("wxShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("wxShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("wxHidden")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("wxTitle")}>
        <button type="button" className="c4-chip" data-on={!status && !blank ? "1" : "0"} aria-pressed={!status && !blank} onClick={() => { setSelected(""); setBlank(false); }}>{v4("wxAll")}</button>
        {chips.map((item) => {
          const count = lines.find((line) => line.status === item)?.count || 0;
          return (
            <span key={item} className="c4-wdg-pair" data-status={item}>
              <button type="button" className="c4-chip" data-on={status === item ? "1" : "0"} aria-pressed={status === item} onClick={() => { setBlank(false); setSelected(status === item ? "" : item); }}>{item} {count}</button>
              <button type="button" className="c4-btn" onClick={() => store(toggleStatus(hiddenStatuses, item, present), showHidden ? "" : item)}>{showHidden ? v4("wxShow") : v4("wxHide")}</button>
            </span>
          );
        })}
      </div>
      <label className="c4-lab">
        <span>{v4("wxSearch")}</span>
        <input className="c4-field" aria-label={v4("wxSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c4-pay-empty">{v4("wxEmpty")}</p>}
      <ul className="c4-wdg-rows">
        {shown.map((row) => {
          const name = statusText(row.status);
          return (
            <li key={row.id} data-status={name || "blank"}>
              <p>{row.label || row.id}</p>
              <p className="c4-meta">{name || v4("wxBlank")}</p>
              {row.userId && <Link className="c4-btn" href={crmv4Href(base, `customers/${row.userId}`)}>{v4("wxCustomer")}</Link>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
