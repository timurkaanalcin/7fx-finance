"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readJson, writeJson } from "@/lib/crmv3/bridge";
import {
  FOLLOW_KEY,
  bookStatus,
  cardsOn,
  filterBook,
  followCards,
  loadedPnl,
  overdueCards,
  setBrowserFollow,
  shiftDay,
  symbolSummary,
  weekDays,
  type BookFilter,
  type BookRow,
  type FollowCard,
} from "@/lib/crmv3/book";
import { crmv3Href } from "@/lib/crmv3/sections";
import { Status, useJson, when } from "../kit";
import { DayStrip } from "./dense";
import { useV3, type V3 } from "./store";

function pnlText(value: number | null, locale: string): string {
  if (value == null) return "—";
  return value.toLocaleString(locale, { maximumFractionDigits: 2 });
}

function sizeText(value: number | null | undefined): string {
  const n = Number(value);
  return Number.isFinite(n) ? String(n) : "—";
}

export function TradeBook({ id, locale }: { id: string; locale: string }) {
  const v3 = useV3();
  const data = useJson<{ positions?: BookRow[] }>(`/api/admin/users/${encodeURIComponent(id)}?view=positions&take=40`);
  const [status, setStatus] = useState<BookFilter>("all");
  const [symbol, setSymbol] = useState("");
  const rows = filterBook(data.data?.positions || [], status, symbol);
  const summary = symbolSummary(rows);
  return (
    <section className="c3-book" aria-label={v3("bookTitle")} data-book="1">
      <h2 className="c3-title">{v3("bookTitle")}</h2>
      <p className="c3-muted">{v3("bookSub")}</p>
      <p className="c3-muted">{v3("bookHint")}</p>
      <div className="c3-tools">
        {(["all", "open", "closed"] as const).map((item) => (
          <button key={item} type="button" className="c3-chip" data-on={status === item ? "1" : "0"} onClick={() => setStatus(item)}>
            {v3(item === "all" ? "bookAll" : item === "open" ? "bookOpen" : "bookClosed")}
          </button>
        ))}
        <input className="c3-field" aria-label={v3("bookFilter")} value={symbol} onChange={(event) => setSymbol(event.target.value)} />
      </div>
      {!data.loading && !rows.length && <p className="c3-muted">{v3("bookEmpty")}</p>}
      <h3 className="c3-title">{v3("bookSummary")}</h3>
      <p className="c3-muted">{v3("bookSummaryHint")}</p>
      <ul className="c3-book-sum">
        {summary.map((row) => <li key={row.symbol}>{row.symbol} · {row.count} · {v3("bookPnl")} {pnlText(row.pnl, locale)}</li>)}
      </ul>
      <ul className="c3-book-rows">
        {rows.map((row) => (
          <li key={row.id}>
            <strong>{row.symbol || "—"}</strong>
            <span>{v3("bookSide")} {row.side || "—"}</span>
            <span>{v3("bookSize")} {sizeText(row.volume)}</span>
            <span>{bookStatus(row) === "closed" ? v3("bookClosed") : v3("bookOpen")}</span>
            <span>{v3("bookOpened")} {when(row.openedAt, locale)}</span>
            <span>{v3("bookClosedAt")} {row.closedAt ? when(row.closedAt, locale) : v3("bookStill")}</span>
            <span>{v3("bookPnl")} {pnlText(loadedPnl(row), locale)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function AgendaPage({ base, locale }: { base: string; locale: string }) {
  const v3 = useV3();
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
    <div className="c3-stack">
    <DayStrip base={base} locale={locale} />
    <section className="c3-agenda" aria-label={v3("agTitle")} data-agenda="1">
      <h2 className="c3-title">{v3("agTitle")}</h2>
      <p className="c3-muted">{v3("agHint")}</p>
      <div className="c3-tools">
        <button type="button" className="c3-chip" data-on={mode === "day" ? "1" : "0"} onClick={() => setMode("day")}>{v3("agDay")}</button>
        <button type="button" className="c3-chip" data-on={mode === "week" ? "1" : "0"} onClick={() => setMode("week")}>{v3("agWeek")}</button>
        <button type="button" className="c3-btn" onClick={() => setCursor(shiftDay(cursor, mode === "week" ? -7 : -1))}>{v3("agPrev")}</button>
        <button type="button" className="c3-btn" onClick={() => setCursor(today)}>{today}</button>
        <button type="button" className="c3-btn" onClick={() => setCursor(shiftDay(cursor, mode === "week" ? 7 : 1))}>{v3("agNext")}</button>
      </div>
      <label className="c3-lab"><span>{v3("agSearch")}</span><input className="c3-field" aria-label={v3("agSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
      <h3 className="c3-title">{v3("agOverdue")}</h3>
      {!late.length && <p className="c3-muted">{v3("agNone")}</p>}
      <ul className="c3-agenda-lane">{late.map((card) => <FollowItem key={`${card.source}-${card.id}-${card.day}`} base={base} card={card} v3={v3} onSave={save} />)}</ul>
      <div className="c3-agenda-grid" data-mode={mode}>
        {days.map((day) => {
          const items = cardsOn(cards, day);
          return (
            <section key={day} data-today={day === today ? "1" : "0"}>
              <h3 className="c3-title">{new Date(`${day}T00:00:00Z`).toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" })}</h3>
              {!items.length && <p className="c3-muted">{v3("agEmpty")}</p>}
              <ul>{items.map((card) => <FollowItem key={`${card.source}-${card.id}`} base={base} card={card} v3={v3} onSave={save} />)}</ul>
            </section>
          );
        })}
      </div>
    </section>
    </div>
  );
}

function FollowItem({ base, card, v3, onSave }: { base: string; card: FollowCard; v3: V3; onSave: (id: string, day: string) => void }) {
  return (
    <li>
      <Link href={crmv3Href(base, `customers/${card.id}`)}>{card.name}</Link>
      <Status tone={card.source === "loaded" ? "info" : "muted"}>{card.source === "loaded" ? v3("agLoaded") : v3("agBrowser")}</Status>
      <span>{card.day}</span>
      <label className="c3-lab">
        <span>{v3("agSave")}</span>
        <input className="c3-field" type="date" aria-label={`${v3("agSave")} ${card.name}`} defaultValue={card.source === "browser" ? card.day : ""} onChange={(event) => onSave(card.id, event.target.value)} />
      </label>
    </li>
  );
}
