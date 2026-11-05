"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CrmV3CopyKey } from "@/lib/crmv3/copy";
import { readJson, writeJson } from "@/lib/crmv3/bridge";
import {
  CANNED_KEY,
  DRAFT_KEY,
  countOnDay,
  dropCanned,
  filterMessages,
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
} from "@/lib/crmv3/thread";
import { crmv3Href } from "@/lib/crmv3/sections";
import { money, sendJson, useJson, when, type Tx } from "../kit";
import { useV3 } from "./store";

const WHO: Record<ThreadWho, CrmV3CopyKey> = {
  customer: "cvCustomer",
  staff: "cvStaff",
  auto: "cvAuto",
};

export function ThreadPanel({
  userId,
  name,
  messages,
  tx,
  locale,
  onSent,
}: {
  userId: string;
  name: string;
  messages: ThreadMessage[];
  tx: Tx;
  locale: string;
  onSent: () => void;
}) {
  const v3 = useV3();
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
    <section className="c3-thread" aria-label={v3("cvTitle")} data-thread="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("cvSub")}</p>
          <h2 className="c3-title">{name || v3("cvTitle")}</h2>
        </div>
      </header>
      <p className="c3-muted">{v3("cvHint")}</p>
      {!userId && <p className="c3-empty">{v3("cvNoThread")}</p>}
      {userId && (
        <>
          <label className="c3-lab">
            <span>{v3("cvSearch")}</span>
            <input className="c3-field" aria-label={v3("cvSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
          </label>
          {!shown.length && <p className="c3-empty">{v3("cvEmpty")}</p>}
          <ol className="c3-thread-list">
            {shown.map((item) => {
              const who = whoOf(item);
              return (
                <li key={item.id} className="c3-thread-line" data-who={who}>
                  <span className="c3-muted">{v3(WHO[who])}</span>
                  <p>{item.body || "—"}</p>
                  {item.createdAt && <span className="c3-muted">{when(item.createdAt, locale)}</span>}
                </li>
              );
            })}
          </ol>
          <p className="c3-muted">{v3("cvCannedHint")}</p>
          <div className="c3-row">
            {canned.map((item) => (
              <span key={item.id} className="c3-pay-view">
                <button type="button" className="c3-chip" onClick={() => keepDraft(item.body)}>{item.title}</button>
                <button type="button" className="c3-btn" onClick={() => keepCanned(dropCanned(canned, item.id))}>{v3("cvRemove")}</button>
              </span>
            ))}
          </div>
          <div className="c3-row">
            <label className="c3-lab">
              <span>{v3("cvCannedName")}</span>
              <input className="c3-field" aria-label={v3("cvCannedName")} value={title} onChange={(event) => setTitle(event.target.value)} />
            </label>
            <label className="c3-lab">
              <span>{v3("cvCannedBody")}</span>
              <input className="c3-field" aria-label={v3("cvCannedBody")} value={body} onChange={(event) => setBody(event.target.value)} />
            </label>
            <button type="button" className="c3-btn" onClick={() => {
              const next = saveCanned(canned, title, body);
              if (next.length === canned.length) return;
              keepCanned(next);
              setTitle("");
              setBody("");
            }}>{v3("cvSaveCanned")}</button>
          </div>
          <label className="c3-lab">
            <span>{v3("cvDraft")}</span>
            <textarea
              className="c3-field"
              rows={3}
              aria-label={v3("cvDraft")}
              value={draft}
              onChange={(event) => keepDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") event.preventDefault();
              }}
            />
          </label>
          <p className="c3-muted">{v3("cvEnter")}</p>
          <div className="c3-row">
            <button type="button" className="c3-btn c3-btn-hot" disabled={busy || !draft.trim()} onClick={() => void send()}>{v3("cvSend")}</button>
            <button type="button" className="c3-btn" onClick={() => keepDraft("")}>{v3("cvClear")}</button>
          </div>
          {msg && <p className="c3-muted">{msg}</p>}
        </>
      )}
    </section>
  );
}

type ChatThread = { traderId?: string | null; trader?: string | null; messages?: ThreadMessage[] };

export function ThreadDesk({ tx, locale }: { tx: Tx; locale: string }) {
  const v3 = useV3();
  const list = useJson<{ threads?: ChatThread[] }>("/api/admin/chat?take=30");
  const [picked, setPicked] = useState("");
  const [query, setQuery] = useState("");
  const threads = (list.data?.threads || []).filter((row) => String(row.trader || "").toLowerCase().includes(query.trim().toLowerCase()));
  const selected = threads.find((row) => row.traderId === picked) || threads[0];
  const userId = String(selected?.traderId || "");
  const thread = useJson<{ threads?: ChatThread[] }>(userId ? `/api/admin/chat?userId=${encodeURIComponent(userId)}&take=40` : null);
  const messages = thread.data?.threads?.[0]?.messages || selected?.messages || [];
  return (
    <div className="c3-thread-split">
      <section className="c3-thread-side" aria-label={v3("cvTitle")}>
        <label className="c3-lab">
          <span>{v3("cvSearch")}</span>
          <input className="c3-field" aria-label={v3("cvSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
        {!threads.length && <p className="c3-empty">{v3("cvNoThread")}</p>}
        <ul className="c3-thread-people">
          {threads.map((row) => (
            <li key={row.traderId || row.trader}>
              <button type="button" className="c3-btn" data-on={userId && userId === row.traderId ? "1" : "0"} onClick={() => setPicked(String(row.traderId || ""))}>{row.trader || row.traderId}</button>
            </li>
          ))}
        </ul>
      </section>
      <ThreadPanel
        userId={userId}
        name={String(thread.data?.threads?.[0]?.trader || selected?.trader || "")}
        messages={messages}
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

export function TodayStrip({ base, locale }: { base: string; locale: string }) {
  const v3 = useV3();
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
    { key: "deposits", label: v3("hmDeposits"), count: depositCount, sums: depositSums, href: crmv3Href(base, "funding") },
    { key: "withdrawals", label: v3("hmWithdrawals"), count: withdrawalCount, sums: withdrawalSums, href: crmv3Href(base, "payout") },
    { key: "tickets", label: v3("hmTickets"), count: ticketCount, sums: [] as { currency: string; count: number; amount: number }[], href: crmv3Href(base, "support") },
    { key: "follows", label: v3("hmFollows"), count: followCount, sums: [] as { currency: string; count: number; amount: number }[], href: crmv3Href(base, "agenda") },
  ];
  return (
    <section className="c3-today-strip" aria-label={v3("hmTitle")} data-today="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{day}</p>
          <h2 className="c3-title">{v3("hmTitle")}</h2>
        </div>
      </header>
      <p className="c3-muted">{v3("hmHint")}</p>
      <ul className="c3-today-grid">
        {cards.map((card) => (
          <li key={card.key} className="c3-today-card" data-empty={card.count === 0 ? "1" : "0"}>
            <span className="c3-muted">{card.label}</span>
            <strong>{card.count}</strong>
            {card.count === 0 && <p className="c3-muted">{v3("hmEmpty")}</p>}
            {card.sums.map((sum) => (
              <p key={sum.currency} className="c3-muted">{money(sum.amount, sum.currency, locale)} · {sum.count}</p>
            ))}
            <Link className="c3-btn" href={card.href}>{v3("hmOpen")}</Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
