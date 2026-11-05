"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readJson, writeJson } from "@/lib/crmv3/bridge";
import { CRM_V3_SECTIONS, crmv3Href } from "@/lib/crmv3/sections";
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
} from "@/lib/crmv3/bookmarkboard";
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

export function BookmarkBoard({ base }: { base: string }) {
  const v3 = useV3();
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
    <section className="c3-bookmark-board" aria-label={v3("bqTitle")} data-bookmark-board="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("bqSub")}</p>
          <h2 className="c3-title">{v3("bqTitle")}</h2>
        </div>
        <p className="c3-muted">{shown.length}</p>
      </header>
      <p className="c3-muted">{v3("bqHint")}</p>
      <p className="c3-muted">{v3("bqLocal")}</p>
      <form className="c3-row" onSubmit={(event) => {
        event.preventDefault();
        const next = addBookmark(bookmarks, { id: `bq-${Date.now()}`, label, section, at: new Date().toISOString() });
        if (next.length === bookmarks.length) return;
        store(next);
        setLabel("");
      }}>
        <label className="c3-lab">
          <span>{v3("bqLabel")}</span>
          <input className="c3-field" aria-label={v3("bqLabel")} value={label} maxLength={40} onChange={(event) => setLabel(event.target.value)} />
        </label>
        <label className="c3-lab">
          <span>{v3("bqSection")}</span>
          <select className="c3-field" aria-label={v3("bqSection")} value={section} onChange={(event) => setSection(event.target.value)}>
            {CRM_V3_SECTIONS.map((item) => <option key={item.id} value={item.id}>{item.id}</option>)}
          </select>
        </label>
        <button type="submit" className="c3-btn">{v3("bqAdd")}</button>
      </form>
      <p className="c3-muted">{v3("bqBlank")}</p>
      <label className="c3-lab">
        <span>{v3("bqSearch")}</span>
        <input className="c3-field" aria-label={v3("bqSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c3-row" role="group" aria-label={v3("bqShown")}>
        <button type="button" className="c3-chip" data-on={hidden ? "0" : "1"} aria-pressed={!hidden} onClick={() => setHidden(false)}>{v3("bqShown")}</button>
        <button type="button" className="c3-chip" data-on={hidden ? "1" : "0"} aria-pressed={hidden} onClick={() => setHidden(true)}>{v3("bqHidden")}</button>
      </div>
      {!shown.length && <p className="c3-empty">{v3("bqEmpty")}</p>}
      <ul className="c3-bookmark-list">
        {shown.map((item) => (
          <li key={item.id} className="c3-bookmark-card" data-pinned={item.pinned ? "1" : "0"} data-section={item.section}>
            <p>{item.label}</p>
            <p className="c3-muted">{item.section}</p>
            <div className="c3-row">
              <Link className="c3-btn" href={crmv3Href(base, sectionPath(item.section))}>{v3("bqOpen")}</Link>
              <button type="button" className="c3-btn" onClick={() => store(toggleBookmarkPin(bookmarks, item.id))}>{item.pinned ? v3("bqUnpin") : v3("bqPin")}</button>
              <button type="button" className="c3-btn" onClick={() => store(setBookmarkHidden(bookmarks, item.id, !item.hidden))}>{item.hidden ? v3("bqShow") : v3("bqHide")}</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function WithdrawalStatus({ base }: { base: string }) {
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
    <section className="c3-wd-glance" aria-label={v3("wxTitle")} data-wd-glance="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("wxSub")}</p>
          <h2 className="c3-title">{v3("wxTitle")}</h2>
        </div>
        <p className="c3-muted">{chips.length}</p>
      </header>
      <p className="c3-muted">{v3("wxHint")}</p>
      <p className="c3-muted">{v3("wxLocal")}</p>
      <p className="c3-row">
        <Link className="c3-btn" href={crmv3Href(base, "withdraw")}>{v3("wxBoard")}</Link>
      </p>
      {data.loading && !rows.length && <p className="c3-muted">{v3("wxLoading")}</p>}
      {data.error && <p className="c3-muted">{v3("wxFailed")}</p>}
      {!data.loading && !data.error && !rows.length && <p className="c3-empty">{v3("wxNone")}</p>}
      {blankCount > 0 && (
        <button type="button" className="c3-wdg-blank" data-on={blank ? "1" : "0"} aria-pressed={blank} onClick={() => { setBlank((value) => !value); setSelected(""); }}>
          <span>{v3("wxBlank")}</span>
          <span className="c3-muted">{blankCount}</span>
        </button>
      )}
      <div className="c3-row" role="group" aria-label={v3("wxShown")}>
        <button type="button" className="c3-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v3("wxShown")}</button>
        <button type="button" className="c3-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v3("wxHidden")}</button>
      </div>
      <div className="c3-row" role="group" aria-label={v3("wxTitle")}>
        <button type="button" className="c3-chip" data-on={!status && !blank ? "1" : "0"} aria-pressed={!status && !blank} onClick={() => { setSelected(""); setBlank(false); }}>{v3("wxAll")}</button>
        {chips.map((item) => {
          const count = lines.find((line) => line.status === item)?.count || 0;
          return (
            <span key={item} className="c3-wdg-pair" data-status={item}>
              <button type="button" className="c3-chip" data-on={status === item ? "1" : "0"} aria-pressed={status === item} onClick={() => { setBlank(false); setSelected(status === item ? "" : item); }}>{item} {count}</button>
              <button type="button" className="c3-btn" onClick={() => store(toggleStatus(hiddenStatuses, item, present), showHidden ? "" : item)}>{showHidden ? v3("wxShow") : v3("wxHide")}</button>
            </span>
          );
        })}
      </div>
      <label className="c3-lab">
        <span>{v3("wxSearch")}</span>
        <input className="c3-field" aria-label={v3("wxSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c3-empty">{v3("wxEmpty")}</p>}
      <ul className="c3-wdg-rows">
        {shown.map((row) => {
          const name = statusText(row.status);
          return (
            <li key={row.id} data-status={name || "blank"}>
              <p>{row.label || row.id}</p>
              <p className="c3-muted">{name || v3("wxBlank")}</p>
              {row.userId && <Link className="c3-btn" href={crmv3Href(base, `customers/${row.userId}`)}>{v3("wxCustomer")}</Link>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
