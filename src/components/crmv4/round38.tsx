"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import {
  EMPTY_PICK,
  READ_KEY,
  buildNotices,
  currencyCounts,
  readIds,
  segmentLines,
  segmentRows,
  unreadCount,
  uniqueValues,
  withRead,
  type Notice,
  type NoticeKind,
  type SegCustomer,
  type SegPick,
} from "@/lib/crmv4/round38";
import { crmv4Href } from "@/lib/crmv4/sections";
import { downloadCsv, money, State, useJson, when, type Tx } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

type Cash = { id: string; amount?: number | null; currency?: string | null; createdAt?: string | null; status?: string | null; user?: { name?: string | null } | null };
type Person = { id: string; name?: string | null; documentsStatus?: string | null; country?: string | null; saleStatus?: string | null; ftd?: boolean | null; currency?: string | null };
type Thread = { traderId?: string | null; trader?: string | null; lastAt?: string | null; messages?: { workerId?: string | null; automatic?: boolean | null }[]; presence?: { adminLastReadAt?: string | null } | null };

export function useNotices() {
  const deposits = useJson<{ requests?: Cash[] }>("/api/admin/deposits?status=PENDING&take=40");
  const withdrawals = useJson<{ requests?: Cash[] }>("/api/admin/withdrawals?status=PENDING&take=40");
  const people = useJson<{ users?: Person[] }>("/api/admin/users?take=80&meta=0&role=TRADER");
  const chat = useJson<{ threads?: Thread[] }>("/api/admin/chat?take=30");
  const [read, setRead] = useState<string[]>([]);
  useEffect(() => { setRead(readIds(window.localStorage.getItem(READ_KEY))); }, []);
  const events = buildNotices({
    deposits: deposits.data?.requests || [],
    withdrawals: withdrawals.data?.requests || [],
    people: people.data?.users || [],
    threads: chat.data?.threads || [],
  });
  const loading = deposits.loading || withdrawals.loading || people.loading || chat.loading;
  const error = deposits.error || withdrawals.error || people.error || chat.error;
  function persist(next: string[]) {
    setRead(next);
    window.localStorage.setItem(READ_KEY, JSON.stringify(next));
  }
  return {
    events,
    read,
    unread: unreadCount(events, read),
    loading,
    error,
    reload: () => { deposits.reload(); withdrawals.reload(); people.reload(); chat.reload(); },
    mark: (id: string) => persist(withRead(read, id)),
    markAll: (ids: string[]) => {
      let next = read;
      for (const id of ids) next = withRead(next, id);
      persist(next);
    },
  };
}

export function DeskBar({ base, name, theme, onTheme, onNotes, unread, v4, tx }: { base: string; name: string; theme: "light" | "dark"; onTheme: () => void; onNotes: () => void; unread: number; v4: V4; tx: Tx }) {
  return (
    <div className="c4-desk-bar" data-bar="1">
      <form action={crmv4Href(base, "customers")} role="search" className="c4-desk-search">
        <input name="q" className="c4-field" aria-label={v4("barSearch")} placeholder={v4("barSearch")} />
      </form>
      <button type="button" className="c4-btn" onClick={onTheme}>{theme === "dark" ? tx("themeLight") : tx("themeDark")}</button>
      <Link href={crmv4Href(base, "me")} className="c4-desk-profile">{name || v4("barProfile")}</Link>
      <button type="button" className="c4-btn" aria-label={tx("notifications")} onClick={onNotes}>
        {tx("notifications")}
        {unread > 0 && <span className="c4-count">{unread}</span>}
      </button>
    </div>
  );
}

const KINDS = ["all", "deposit", "withdrawal", "kyc", "chat"] as const;

export function NoticeDesk({ base, v4, locale, tx, notices }: { base: string; v4: V4; locale: string; tx: Tx; notices: ReturnType<typeof useNotices> }) {
  const [kind, setKind] = useState<(typeof KINDS)[number]>("all");
  const [onlyUnread, setOnlyUnread] = useState(false);
  const rows = notices.events.filter((row) => {
    if (kind !== "all" && row.kind !== kind) return false;
    if (onlyUnread && notices.read.includes(row.id)) return false;
    return true;
  });
  const href: Record<NoticeKind, string> = {
    deposit: crmv4Href(base, "deposit"),
    withdrawal: crmv4Href(base, "withdraw"),
    kyc: crmv4Href(base, "kyc"),
    chat: crmv4Href(base, "inbox"),
  };
  const label: Record<NoticeKind, CrmV4CopyKey> = {
    deposit: "noteDeposit",
    withdrawal: "noteWithdrawal",
    kyc: "noteKyc",
    chat: "noteChat",
  };
  return (
    <section className="c4-note-desk" aria-label={v4("noteTitle")} data-notes-desk="1">
      <h2 className="c4-title">{v4("noteTitle")}</h2>
      <p className="c4-muted">{v4("noteHint")}</p>
      <p className="c4-muted">{v4("noteCount")} · {notices.unread}</p>
      <State loading={notices.loading} error={notices.error} empty={!notices.loading && !notices.error && notices.events.length === 0} tx={tx} onRetry={notices.reload} hint={v4("noteEmpty")} />
      {!notices.loading && !notices.error && notices.events.length > 0 && (
        <>
          <div className="c4-line-filters">
            {KINDS.map((item) => (
              <button key={item} type="button" className="c4-chip" data-on={kind === item ? "1" : "0"} onClick={() => setKind(item)}>
                {v4(item === "all" ? "noteAll" : label[item])}
              </button>
            ))}
            <button type="button" className="c4-chip" data-on={onlyUnread ? "1" : "0"} onClick={() => setOnlyUnread((value) => !value)}>{v4("noteUnread")}</button>
            <button type="button" className="c4-btn" onClick={() => notices.markAll(rows.map((row) => row.id))}>{v4("noteMarkAll")}</button>
          </div>
          {!rows.length && <p className="c4-empty c4-empty-card">{v4("noteEmpty")}</p>}
          <ul>
            {rows.map((row) => (
              <NoticeRow key={row.id} row={row} read={notices.read.includes(row.id)} href={href[row.kind]} kind={v4(label[row.kind])} v4={v4} locale={locale} onRead={() => notices.mark(row.id)} />
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

function NoticeRow({ row, read, href, kind, v4, locale, onRead }: { row: Notice; read: boolean; href: string; kind: string; v4: V4; locale: string; onRead: () => void }) {
  return (
    <li data-read={read ? "1" : "0"}>
      <div className="c4-row c4-between">
        <strong>{kind}</strong>
        <span>{row.name || "—"}</span>
      </div>
      {row.currency ? <p>{money(row.amount, row.currency, locale)}</p> : null}
      {row.at && <p className="c4-muted">{when(row.at, locale)}</p>}
      <div className="c4-row">
        <Link href={href} className="c4-btn">{kind}</Link>
        {!read && <button type="button" className="c4-btn" onClick={onRead}>{v4("noteMark")}</button>}
      </div>
    </li>
  );
}

export function SegmentDesk({ v4, tx }: { v4: V4; tx: Tx }) {
  const people = useJson<{ users?: SegCustomer[] }>("/api/admin/users?take=80&meta=0&role=TRADER");
  const [pick, setPick] = useState<SegPick>(EMPTY_PICK);
  const loaded = people.data?.users || [];
  const rows = segmentRows(loaded, pick);
  const counts = currencyCounts(rows);
  function set<K extends keyof SegPick>(key: K, value: SegPick[K]) {
    setPick((current) => ({ ...current, [key]: value }));
  }
  return (
    <section className="c4-seg-desk" aria-label={v4("segTitle")} data-seg="1">
      <h2 className="c4-title">{v4("segTitle")}</h2>
      <p className="c4-muted">{v4("segHint")}</p>
      <State loading={people.loading} error={people.error} empty={!people.loading && !people.error && loaded.length === 0} tx={tx} onRetry={people.reload} hint={v4("segNone")} />
      {!people.loading && !people.error && loaded.length > 0 && (
        <>
          <div className="c4-ledger-filters">
            <Select label={v4("segCountry")} value={pick.country} any={v4("segAny")} options={uniqueValues(loaded, "country")} onChange={(value) => set("country", value)} />
            <Select label={v4("segStage")} value={pick.stage} any={v4("segAny")} options={uniqueValues(loaded, "saleStatus")} onChange={(value) => set("stage", value)} />
            <Select label={v4("segKyc")} value={pick.kyc} any={v4("segAny")} options={uniqueValues(loaded, "documentsStatus")} onChange={(value) => set("kyc", value)} />
            <label className="c4-lab">
              <span>{v4("segDeposit")}</span>
              <select className="c4-select" aria-label={v4("segDeposit")} value={pick.deposit} onChange={(event) => set("deposit", event.target.value as SegPick["deposit"])}>
                <option value="">{v4("segAny")}</option>
                <option value="yes">{v4("segYes")}</option>
                <option value="no">{v4("segNo")}</option>
              </select>
            </label>
            <Select label={v4("segCurrency")} value={pick.currency} any={v4("segAny")} options={uniqueValues(loaded, "currency")} onChange={(value) => set("currency", value)} />
          </div>
          <p>{v4("segCount")} · {rows.length}</p>
          <h3 className="c4-title">{v4("segByCurrency")}</h3>
          <ul className="c4-seg-counts">
            {counts.map((row) => <li key={row.currency}>{row.currency} · {row.count}</li>)}
          </ul>
          {!rows.length && <p className="c4-empty c4-empty-card">{v4("segEmpty")}</p>}
          <ul className="c4-seg-people">
            {rows.map((row) => (
              <li key={row.id}>
                <strong>{row.name || row.id}</strong>
                <span>{row.country || "—"} · {row.saleStatus || "—"} · {row.documentsStatus || "NONE"}</span>
                <span>{row.ftd ? v4("segYes") : v4("segNo")} · {row.currency || "—"}</span>
              </li>
            ))}
          </ul>
          <button type="button" className="c4-btn" onClick={() => downloadCsv("segment-loaded.csv", [v4("barProfile"), v4("segCountry"), v4("segStage"), v4("segKyc"), v4("segDeposit"), v4("segCurrency")], segmentLines(rows))}>{v4("segExport")}</button>
        </>
      )}
    </section>
  );
}

function Select({ label, value, any, options, onChange }: { label: string; value: string; any: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="c4-lab">
      <span>{label}</span>
      <select className="c4-select" aria-label={label} value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">{any}</option>
        {options.map((item) => <option key={item} value={item}>{item}</option>)}
      </select>
    </label>
  );
}
