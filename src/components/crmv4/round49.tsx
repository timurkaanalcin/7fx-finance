"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import {
  countOnDay,
  dropCanned,
  filterMessages,
  isOnDay,
  readCanned,
  readDrafts,
  saveCanned,
  sumsOnDay,
  utcDay,
  whoOf,
  writeDraft,
  type Canned,
  type ThreadMessage,
  type ThreadWho,
} from "@/lib/crmv4/round49";
import { crmv4Href } from "@/lib/crmv4/sections";
import { money, sendJson, useJson, when, type Tx } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const DRAFT_KEY = "crmv4-thread-drafts";
const CANNED_KEY = "crmv4-thread-canned";

const WHO: Record<ThreadWho, CrmV4CopyKey> = {
  customer: "cvCustomer",
  staff: "cvStaff",
  auto: "cvAuto",
};

export function ThreadPanel({
  userId,
  name,
  messages,
  v4,
  tx,
  locale,
  onSent,
}: {
  userId: string;
  name: string;
  messages: ThreadMessage[];
  v4: V4;
  tx: Tx;
  locale: string;
  onSent: () => void;
}) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [draft, setDraft] = useState("");
  const [canned, setCanned] = useState<Canned[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  useEffect(() => {
    const stored = readDrafts(readJson(DRAFT_KEY, {}));
    setDrafts(stored);
    setDraft(userId ? stored[userId] || "" : "");
    setCanned(readCanned(readJson(CANNED_KEY, [])));
    setQuery("");
  }, [userId]);
  const shown = filterMessages(messages, query);

  function keepDraft(text: string) {
    setDraft(text);
    if (!userId) return;
    const next = writeDraft(drafts, userId, text);
    setDrafts(next);
    writeJson(DRAFT_KEY, next);
  }

  function keepCanned(next: Canned[]) {
    setCanned(next);
    writeJson(CANNED_KEY, next);
  }

  async function send() {
    const message = draft.trim();
    if (!userId || !message || busy) return;
    setBusy(true);
    try {
      const res = await sendJson("/api/admin/chat", "POST", { userId, message });
      setMsg(res.ok ? tx("saved") : res.error || tx("failed"));
      if (res.ok) {
        keepDraft("");
        onSent();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="c4-thread-desk" aria-label={v4("cvTitle")} data-thread="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-pay-kicker">{v4("cvSub")}</p>
          <h2 className="c4-title">{name || v4("cvTitle")}</h2>
        </div>
      </header>
      <p className="c4-meta">{v4("cvHint")}</p>
      {!userId && <p className="c4-pay-empty">{v4("cvNoThread")}</p>}
      {userId && (
        <>
          <label className="c4-lab">
            <span>{v4("cvSearch")}</span>
            <input className="c4-field" aria-label={v4("cvSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
          </label>
          {!shown.length && <p className="c4-pay-empty">{v4("cvEmpty")}</p>}
          <ol className="c4-thread-list">
            {shown.map((item) => {
              const who = whoOf(item);
              return (
                <li key={item.id} className="c4-thread-line" data-who={who}>
                  <span className="c4-meta">{v4(WHO[who])}</span>
                  <p>{item.body || "—"}</p>
                  {item.createdAt && <span className="c4-meta">{when(item.createdAt, locale)}</span>}
                </li>
              );
            })}
          </ol>
          <p className="c4-meta">{v4("cvCannedHint")}</p>
          <div className="c4-row">
            {canned.map((item) => (
              <span key={item.id} className="c4-pay-view">
                <button type="button" className="c4-chip" onClick={() => keepDraft(item.body)}>{item.title}</button>
                <button type="button" className="c4-btn" onClick={() => keepCanned(dropCanned(canned, item.id))}>{v4("cvRemove")}</button>
              </span>
            ))}
          </div>
          <div className="c4-row">
            <label className="c4-lab">
              <span>{v4("cvCannedName")}</span>
              <input className="c4-field" aria-label={v4("cvCannedName")} value={title} onChange={(event) => setTitle(event.target.value)} />
            </label>
            <label className="c4-lab">
              <span>{v4("cvCannedBody")}</span>
              <input className="c4-field" aria-label={v4("cvCannedBody")} value={body} onChange={(event) => setBody(event.target.value)} />
            </label>
            <button type="button" className="c4-btn" onClick={() => {
              const next = saveCanned(canned, title, body);
              if (next.length === canned.length) return;
              keepCanned(next);
              setTitle("");
              setBody("");
            }}>{v4("cvSaveCanned")}</button>
          </div>
          <label className="c4-lab">
            <span>{v4("cvDraft")}</span>
            <textarea
              className="c4-field c4-thread-draft"
              rows={3}
              aria-label={v4("cvDraft")}
              value={draft}
              onChange={(event) => keepDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") event.preventDefault();
              }}
            />
          </label>
          <p className="c4-meta">{v4("cvEnter")}</p>
          <div className="c4-row">
            <button type="button" className="c4-btn c4-btn-hot" disabled={busy || !draft.trim()} onClick={() => void send()}>{v4("cvSend")}</button>
            <button type="button" className="c4-btn" onClick={() => keepDraft("")}>{v4("cvClear")}</button>
          </div>
          {msg && <p className="c4-meta">{msg}</p>}
        </>
      )}
    </section>
  );
}

type ChatThread = { traderId?: string | null; trader?: string | null; messages?: ThreadMessage[] };

export function ThreadDesk({ v4, tx, locale }: { v4: V4; tx: Tx; locale: string }) {
  const list = useJson<{ threads?: ChatThread[] }>("/api/admin/chat?take=30");
  const [picked, setPicked] = useState("");
  const [query, setQuery] = useState("");
  const threads = (list.data?.threads || []).filter((row) => String(row.trader || "").toLowerCase().includes(query.trim().toLowerCase()));
  const selected = threads.find((row) => row.traderId === picked) || threads[0];
  const userId = String(selected?.traderId || "");
  const thread = useJson<{ threads?: ChatThread[] }>(userId ? `/api/admin/chat?userId=${encodeURIComponent(userId)}&take=40` : null);
  const messages = thread.data?.threads?.[0]?.messages || selected?.messages || [];
  return (
    <div className="c4-thread-split">
      <section className="c4-thread-side" aria-label={v4("cvTitle")}>
        <label className="c4-lab">
          <span>{v4("cvSearch")}</span>
          <input className="c4-field" aria-label={v4("cvSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
        {!threads.length && <p className="c4-pay-empty">{v4("cvNoThread")}</p>}
        <ul className="c4-thread-people">
          {threads.map((row) => (
            <li key={row.traderId || row.trader}>
              <button type="button" className="c4-btn" data-on={userId && userId === row.traderId ? "1" : "0"} onClick={() => setPicked(String(row.traderId || ""))}>{row.trader || row.traderId}</button>
            </li>
          ))}
        </ul>
      </section>
      <ThreadPanel
        userId={userId}
        name={String(thread.data?.threads?.[0]?.trader || selected?.trader || "")}
        messages={messages}
        v4={v4}
        tx={tx}
        locale={locale}
        onSent={() => { thread.reload(); list.reload(); }}
      />
    </div>
  );
}

type Cash = { amount?: number | null; currency?: string | null; createdAt?: string | null };
type Ticket = { openedAt?: string | null };
type Reminder = { remindAt?: string | null };

export function TodayStrip({ base, v4, locale }: { base: string; v4: V4; locale: string }) {
  const deposits = useJson<{ requests?: Cash[] }>("/api/admin/deposits?status=ALL&take=40");
  const withdrawals = useJson<{ requests?: Cash[] }>("/api/admin/withdrawals?status=ALL&take=40");
  const tickets = useJson<{ tickets?: Ticket[] }>("/api/admin/tickets?status=&take=40");
  const calendar = useJson<{ reminders?: Reminder[] }>("/api/admin/calendar?take=80");
  const day = utcDay(Date.now());
  const depositRows = deposits.data?.requests || [];
  const withdrawalRows = withdrawals.data?.requests || [];
  const depositCount = countOnDay(depositRows.map((row) => ({ at: row.createdAt })), day);
  const withdrawalCount = countOnDay(withdrawalRows.map((row) => ({ at: row.createdAt })), day);
  const ticketCount = countOnDay((tickets.data?.tickets || []).map((row) => ({ at: row.openedAt })), day);
  const followCount = countOnDay((calendar.data?.reminders || []).map((row) => ({ at: row.remindAt })), day);
  const depositSums = sumsOnDay(depositRows, day);
  const withdrawalSums = sumsOnDay(withdrawalRows, day);
  const cards = [
    { key: "deposits", label: v4("hmDeposits"), count: depositCount, sums: depositSums, href: crmv4Href(base, "funding") },
    { key: "withdrawals", label: v4("hmWithdrawals"), count: withdrawalCount, sums: withdrawalSums, href: crmv4Href(base, "payout") },
    { key: "tickets", label: v4("hmTickets"), count: ticketCount, sums: [] as { currency: string; count: number; amount: number }[], href: crmv4Href(base, "support") },
    { key: "follows", label: v4("hmFollows"), count: followCount, sums: [] as { currency: string; count: number; amount: number }[], href: crmv4Href(base, "agenda") },
  ];
  return (
    <section className="c4-today-strip" aria-label={v4("hmTitle")} data-today="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-pay-kicker">{day}</p>
          <h2 className="c4-title">{v4("hmTitle")}</h2>
        </div>
      </header>
      <p className="c4-meta">{v4("hmHint")}</p>
      <ul className="c4-today-grid">
        {cards.map((card) => (
          <li key={card.key} className="c4-today-card" data-empty={card.count === 0 ? "1" : "0"}>
            <span className="c4-meta">{card.label}</span>
            <strong>{card.count}</strong>
            {card.count === 0 && <p className="c4-meta">{v4("hmEmpty")}</p>}
            {card.sums.map((sum) => (
              <p key={sum.currency} className="c4-meta">{money(sum.amount, sum.currency, locale)} · {sum.count}</p>
            ))}
            <Link className="c4-btn" href={card.href}>{v4("hmOpen")}</Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function loadedToday<T extends { at?: string | null }>(rows: readonly T[], nowMs: number): T[] {
  const day = utcDay(nowMs);
  return rows.filter((row) => isOnDay(row.at, day));
}
