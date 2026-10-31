"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CrmV3CopyKey } from "@/lib/crmv3/copy";
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
} from "@/lib/crmv3/notices";
import { crmv3Href } from "@/lib/crmv3/sections";
import { downloadCsv, money, State, useJson, when, type Tx } from "../kit";
import { useV3 } from "./store";

type Cash = { id: string; amount?: number | null; currency?: string | null; createdAt?: string | null; status?: string | null; user?: { name?: string | null } | null };
type Person = SegCustomer & { account?: { currency?: string | null } | null };
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
    threads: (chat.data?.threads || []).map((row) => ({ ...row, messages: row.messages ? [...row.messages].reverse() : row.messages })),
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

const KINDS = ["all", "deposit", "withdrawal", "kyc", "chat"] as const;

export function NoticeDesk({ base, locale, tx, notices }: { base: string; locale: string; tx: Tx; notices: ReturnType<typeof useNotices> }) {
  const v3 = useV3();
  const [kind, setKind] = useState<(typeof KINDS)[number]>("all");
  const [onlyUnread, setOnlyUnread] = useState(false);
  const rows = notices.events.filter((row) => {
    if (kind !== "all" && row.kind !== kind) return false;
    if (onlyUnread && notices.read.includes(row.id)) return false;
    return true;
  });
  const href: Record<NoticeKind, string> = {
    deposit: crmv3Href(base, "deposit"),
    withdrawal: crmv3Href(base, "withdraw"),
    kyc: crmv3Href(base, "kyc"),
    chat: crmv3Href(base, "inbox"),
  };
  const label: Record<NoticeKind, CrmV3CopyKey> = {
    deposit: "noticeDeposit",
    withdrawal: "noticeWithdrawal",
    kyc: "noticeKyc",
    chat: "noticeChat",
  };
  return (
    <section className="c3-note-desk" aria-label={v3("noticeTitle")} data-notes-desk="1">
      <h2 className="c3-title">{v3("noticeTitle")}</h2>
      <p className="c3-muted">{v3("noticeHint")}</p>
      <p className="c3-muted">{v3("noticeCount")} · {notices.unread}</p>
      <State loading={notices.loading} error={notices.error} empty={false} tx={tx} onRetry={notices.reload} />
      {!notices.loading && !notices.error && notices.events.length === 0 && <p className="c3-empty-card" role="status">{v3("noticeEmpty")}</p>}
      {!notices.loading && !notices.error && notices.events.length > 0 && (
        <>
          <div className="c3-tools">
            {KINDS.map((item) => (
              <button key={item} type="button" className="c3-chip" data-on={kind === item ? "1" : "0"} onClick={() => setKind(item)}>
                {v3(item === "all" ? "noticeAll" : label[item])}
              </button>
            ))}
            <button type="button" className="c3-chip" data-on={onlyUnread ? "1" : "0"} onClick={() => setOnlyUnread((value) => !value)}>{v3("noticeUnread")}</button>
            <button type="button" className="c3-btn" onClick={() => notices.markAll(rows.map((row) => row.id))}>{v3("noticeMarkAll")}</button>
          </div>
          {!rows.length && <p className="c3-empty-card" role="status">{v3("noticeEmpty")}</p>}
          <ul className="c3-notice-rows">
            {rows.map((row) => (
              <NoticeRow key={row.id} row={row} read={notices.read.includes(row.id)} href={href[row.kind]} kind={v3(label[row.kind])} locale={locale} onRead={() => notices.mark(row.id)} />
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

function NoticeRow({ row, read, href, kind, locale, onRead }: { row: Notice; read: boolean; href: string; kind: string; locale: string; onRead: () => void }) {
  const v3 = useV3();
  return (
    <li data-read={read ? "1" : "0"}>
      <div className="c3-row c3-between">
        <strong>{kind}</strong>
        <span>{row.name || "—"}</span>
      </div>
      {row.currency ? <p>{money(row.amount, row.currency, locale)}</p> : null}
      {row.at && <p className="c3-muted">{when(row.at, locale)}</p>}
      <div className="c3-row">
        <Link href={href} className="c3-btn">{kind}</Link>
        {!read && <button type="button" className="c3-btn" onClick={onRead}>{v3("noticeMark")}</button>}
      </div>
    </li>
  );
}

export function SegmentDesk({ tx }: { tx: Tx }) {
  const v3 = useV3();
  const people = useJson<{ users?: Person[] }>("/api/admin/users?take=80&meta=0&role=TRADER");
  const [pick, setPick] = useState<SegPick>(EMPTY_PICK);
  const loaded = (people.data?.users || []).map((row) => ({
    ...row,
    currency: row.currency || row.account?.currency || "",
  }));
  const rows = segmentRows(loaded, pick);
  const counts = currencyCounts(rows);
  function set<K extends keyof SegPick>(key: K, value: SegPick[K]) {
    setPick((current) => ({ ...current, [key]: value }));
  }
  return (
    <section className="c3-seg-desk" aria-label={v3("segTitle")} data-seg="1">
      <h2 className="c3-title">{v3("segTitle")}</h2>
      <p className="c3-muted">{v3("segHint")}</p>
      <State loading={people.loading} error={people.error} empty={false} tx={tx} onRetry={people.reload} />
      {!people.loading && !people.error && loaded.length === 0 && <p className="c3-empty-card" role="status">{v3("segNone")}</p>}
      {!people.loading && !people.error && loaded.length > 0 && (
        <>
          <div className="c3-ledger-filters">
            <Select label={v3("segCountry")} value={pick.country} any={v3("segAny")} options={uniqueValues(loaded, "country")} onChange={(value) => set("country", value)} />
            <Select label={v3("segStage")} value={pick.stage} any={v3("segAny")} options={uniqueValues(loaded, "saleStatus")} onChange={(value) => set("stage", value)} />
            <Select label={v3("segKyc")} value={pick.kyc} any={v3("segAny")} options={uniqueValues(loaded, "documentsStatus")} onChange={(value) => set("kyc", value)} />
            <label className="c3-lab">
              <span>{v3("segDeposit")}</span>
              <select className="c3-select" aria-label={v3("segDeposit")} value={pick.deposit} onChange={(event) => set("deposit", event.target.value as SegPick["deposit"])}>
                <option value="">{v3("segAny")}</option>
                <option value="yes">{v3("segYes")}</option>
                <option value="no">{v3("segNo")}</option>
              </select>
            </label>
            <Select label={v3("segCurrency")} value={pick.currency} any={v3("segAny")} options={uniqueValues(loaded, "currency")} onChange={(value) => set("currency", value)} />
          </div>
          <p>{v3("segCount")} · {rows.length}</p>
          <h3 className="c3-title">{v3("segByCurrency")}</h3>
          <ul className="c3-seg-counts">
            {counts.map((row) => <li key={row.currency}>{row.currency} · {row.count}</li>)}
          </ul>
          {!rows.length && <p className="c3-empty-card" role="status">{v3("segEmpty")}</p>}
          <ul className="c3-seg-people">
            {rows.map((row) => (
              <li key={row.id}>
                <strong>{row.name || row.id}</strong>
                <span>{row.country || "—"} · {row.saleStatus || "—"} · {row.documentsStatus || "NONE"}</span>
                <span>{row.ftd ? v3("segYes") : v3("segNo")} · {row.currency || "—"}</span>
              </li>
            ))}
          </ul>
          <button type="button" className="c3-btn" onClick={() => downloadCsv("segment-loaded.csv", [v3("barProfile"), v3("segCountry"), v3("segStage"), v3("segKyc"), v3("segDeposit"), v3("segCurrency")], segmentLines(rows))}>{v3("segExport")}</button>
        </>
      )}
    </section>
  );
}

function Select({ label, value, any, options, onChange }: { label: string; value: string; any: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="c3-lab">
      <span>{label}</span>
      <select className="c3-select" aria-label={label} value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">{any}</option>
        {options.map((item) => <option key={item} value={item}>{item}</option>)}
      </select>
    </label>
  );
}
