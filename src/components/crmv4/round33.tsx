"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import {
  bookStatus,
  cardsOn,
  filterBook,
  followCards,
  loadedPnl,
  overdueCards,
  setBrowserFollow,
  symbolSummary,
  weekDays,
  type BookFilter,
  type BookRow,
  type FollowCard,
} from "@/lib/crmv4/round33";
import { crmv4Href } from "@/lib/crmv4/sections";
import { useJson, when } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;
const FOLLOW_KEY = "crmv4-lead-follow";

function pnlText(value: number | null, locale: string): string {
  if (value == null) return "—";
  return value.toLocaleString(locale, { maximumFractionDigits: 2 });
}

export function TradeBook({ id, v4, locale }: { id: string; v4: V4; locale: string }) {
  const data = useJson<{ positions?: BookRow[] }>(`/api/admin/users/${encodeURIComponent(id)}?view=positions&take=40`);
  const [status, setStatus] = useState<BookFilter>("all");
  const [symbol, setSymbol] = useState("");
  const rows = filterBook(data.data?.positions || [], status, symbol);
  const summary = symbolSummary(rows);
  return (
    <section className="c4-book-luxe" aria-label={v4("bookTitle")} data-book="1">
      <h2 className="c4-title">{v4("bookTitle")}</h2>
      <p className="c4-muted">{v4("bookHint")}</p>
      <div className="c4-line-filters">
        {(["all", "open", "closed"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={status === item ? "1" : "0"} onClick={() => setStatus(item)}>
            {v4(item === "all" ? "bookAll" : item === "open" ? "bookOpen" : "bookClosed")}
          </button>
        ))}
        <input className="c4-field" aria-label={v4("bookFilter")} value={symbol} onChange={(event) => setSymbol(event.target.value)} />
      </div>
      {!rows.length && <p className="c4-empty-gold">{v4("bookEmpty")}</p>}
      <h3 className="c4-title">{v4("bookSummary")}</h3>
      <p className="c4-muted">{v4("bookSummaryHint")}</p>
      <ul className="c4-book-sum">
        {summary.map((row) => <li key={row.symbol}>{row.symbol} · {row.count} · {v4("bookPnl")} {pnlText(row.pnl, locale)}</li>)}
      </ul>
      <ul className="c4-book-rows">
        {rows.map((row) => (
          <li key={row.id}>
            <strong>{row.symbol || "—"}</strong>
            <span>{v4("bookSide")} {row.side || "—"}</span>
            <span>{v4("bookSize")} {row.volume ?? "—"}</span>
            <span>{bookStatus(row) === "closed" ? v4("bookClosed") : v4("bookOpen")}</span>
            <span>{v4("bookOpened")} {when(row.openedAt, locale)}</span>
            <span>{v4("bookClosedAt")} {row.closedAt ? when(row.closedAt, locale) : v4("bookStill")}</span>
            <span>{v4("bookPnl")} {pnlText(loadedPnl(row), locale)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function shiftDay(day: string, by: number): string {
  const at = Date.parse(`${day}T00:00:00Z`);
  if (!Number.isFinite(at)) return day;
  return new Date(at + by * 86_400_000).toISOString().slice(0, 10);
}

export function AgendaPage({ base, v4, locale }: { base: string; v4: V4; locale: string }) {
  const people = useJson<{ users?: { id: string; name?: string | null; retentionFollowUpAt?: string | null }[] }>("/api/admin/users?take=80&meta=0&role=TRADER");
  const [browser, setBrowser] = useState<Record<string, string>>({});
  const [mode, setMode] = useState<"day" | "week">("week");
  const [cursor, setCursor] = useState(() => new Date().toISOString().slice(0, 10));
  const [query, setQuery] = useState("");
  useEffect(() => { setBrowser(readJson(FOLLOW_KEY, {})); }, []);
  const today = new Date().toISOString().slice(0, 10);
  const users = people.data?.users || [];
  const names: Record<string, string> = {};
  for (const row of users) names[row.id] = row.name || row.id;
  const cards = followCards(users.map((row) => ({ id: row.id, name: row.name, at: row.retentionFollowUpAt })), browser, names)
    .filter((card) => !query.trim() || card.name.toLowerCase().includes(query.trim().toLowerCase()));
  const late = overdueCards(cards, today);
  const days = mode === "week" ? weekDays(cursor) : [cursor];
  function save(id: string, day: string) {
    const next = setBrowserFollow(browser, id, day);
    setBrowser(next);
    writeJson(FOLLOW_KEY, next);
  }
  return (
    <section className="c4-agenda-luxe c4-agenda-gallery c4-agenda-refectory" aria-label={v4("agTitle")} data-agenda="1" data-desk="refectory">
      <header className="c4-agenda-gallery-mast">
        <div>
          <p className="c4-agenda-gallery-kicker">{v4("agHint")}</p>
          <h2 className="c4-title c4-agenda-gallery-title">{v4("agTitle")}</h2>
        </div>
        <p className="c4-agenda-gallery-plate" data-logo="mono">7FX</p>
        <p className="c4-agenda-refectory-links">
          <Link href={crmv4Href(base, "rsl")}>{v4("rfsTitle")}</Link>
          <Link href={crmv4Href(base, "dlg")}>{v4("dlgTitle")}</Link>
        </p>
      </header>
      <div className="c4-line-filters c4-agenda-gallery-tools">
        <button type="button" className="c4-chip" data-on={mode === "day" ? "1" : "0"} onClick={() => setMode("day")}>{v4("agDay")}</button>
        <button type="button" className="c4-chip" data-on={mode === "week" ? "1" : "0"} onClick={() => setMode("week")}>{v4("agWeek")}</button>
        <button type="button" className="c4-btn" onClick={() => setCursor(shiftDay(cursor, mode === "week" ? -7 : -1))}>{v4("agPrev")}</button>
        <button type="button" className="c4-btn" onClick={() => setCursor(today)}>{today}</button>
        <button type="button" className="c4-btn" onClick={() => setCursor(shiftDay(cursor, mode === "week" ? 7 : 1))}>{v4("agNext")}</button>
      </div>
      <label className="c4-lab"><span>{v4("agSearch")}</span><input className="c4-field c4-agenda-refectory-search" aria-label={v4("agSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
      <h3 className="c4-title c4-agenda-gallery-lane-title">{v4("agOverdue")}</h3>
      {!late.length && <p className="c4-empty-gold">{v4("agNone")}</p>}
      <ul className="c4-agenda-lane c4-agenda-gallery-lane">{late.map((card) => <FollowItem key={`${card.source}-${card.id}-${card.day}`} base={base} card={card} v4={v4} onSave={save} />)}</ul>
      <div className="c4-agenda-grid c4-agenda-gallery-grid" data-mode={mode}>
        {days.map((day) => {
          const items = cardsOn(cards, day);
          return (
            <section key={day} data-today={day === today ? "1" : "0"}>
              <h3 className="c4-title">{new Date(`${day}T00:00:00Z`).toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" })}</h3>
              {!items.length && <p className="c4-muted">{v4("agEmpty")}</p>}
              <ul>{items.map((card) => <FollowItem key={`${card.source}-${card.id}`} base={base} card={card} v4={v4} onSave={save} />)}</ul>
            </section>
          );
        })}
      </div>
    </section>
  );
}

function FollowItem({ base, card, v4, onSave }: { base: string; card: FollowCard; v4: V4; onSave: (id: string, day: string) => void }) {
  return (
    <li>
      <Link href={crmv4Href(base, `customers/${card.id}`)}>{card.name}</Link>
      <span className="c4-status" data-tone={card.source === "loaded" ? "info" : "muted"}>{card.source === "loaded" ? v4("agLoaded") : v4("agBrowser")}</span>
      <span>{card.day}</span>
      <label className="c4-lab">
        <span>{v4("agSave")}</span>
        <input className="c4-field" type="date" aria-label={`${v4("agSave")} ${card.name}`} defaultValue={card.source === "browser" ? card.day : ""} onChange={(event) => onSave(card.id, event.target.value)} />
      </label>
    </li>
  );
}
