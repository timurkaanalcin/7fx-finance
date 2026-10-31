"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { sumsByCurrency } from "@/lib/crmv3/review";
import {
  LOAD_KEY,
  filterLoad,
  groupByDesk,
  kycOpen,
  overdueFollows,
  pendingCount,
  readLoad,
  staffCards,
  unassignedCount,
  unreadThreads,
  type WorkFilter,
} from "@/lib/crmv3/today";
import { crmv3Href } from "@/lib/crmv3/sections";
import { money, useJson } from "../kit";
import { useV3 } from "./store";

type Cash = { amount?: number | null; currency?: string | null; status?: string | null };
type Thread = { messages?: { workerId?: string | null; automatic?: boolean | null }[]; presence?: { adminLastReadAt?: string | null } | null };

export function TodayHero({ base, name, locale }: { base: string; name: string; locale: string }) {
  const v3 = useV3();
  const deposits = useJson<{ requests?: Cash[] }>("/api/admin/deposits?status=PENDING&take=40");
  const withdrawals = useJson<{ requests?: Cash[] }>("/api/admin/withdrawals?status=PENDING&take=40");
  const people = useJson<{ users?: { documentsStatus?: string | null; retentionFollowUpAt?: string | null }[] }>("/api/admin/users?take=80&meta=0&role=TRADER");
  const chat = useJson<{ threads?: Thread[] }>("/api/admin/chat?take=30");
  const today = new Date().toISOString().slice(0, 10);
  const users = people.data?.users || [];
  const depRows = deposits.data?.requests || [];
  const wdRows = withdrawals.data?.requests || [];
  const threads = (chat.data?.threads || []).map((row) => ({ ...row, messages: row.messages ? [...row.messages].reverse() : row.messages }));
  const counts = [
    { key: "heroDeposits" as const, n: pendingCount(depRows), href: crmv3Href(base, "deposit") },
    { key: "heroWithdrawals" as const, n: pendingCount(wdRows), href: crmv3Href(base, "withdraw") },
    { key: "heroKyc" as const, n: kycOpen(users), href: crmv3Href(base, "kyc") },
    { key: "heroFollow" as const, n: overdueFollows(users, today), href: crmv3Href(base, "agenda") },
    { key: "heroUnread" as const, n: unreadThreads(threads), href: crmv3Href(base, "inbox") },
  ];
  const pending = (row: Cash) => !row.status || String(row.status).toUpperCase() === "PENDING";
  const depMoney = sumsByCurrency(depRows.filter(pending).map((row, index) => ({ id: String(index), amount: row.amount, currency: row.currency })));
  const wdMoney = sumsByCurrency(wdRows.filter(pending).map((row, index) => ({ id: String(index), amount: row.amount, currency: row.currency })));
  return (
    <section className="c3-today" aria-label={v3("heroTitle")} data-hero="1">
      <p className="c3-muted">{name || "—"}</p>
      <h2 className="c3-title">{v3("heroTitle")}</h2>
      <p className="c3-muted">{v3("heroHint")}</p>
      <div className="c3-today-counts">
        {counts.map((item) => (
          <Link key={item.key} href={item.href}>
            <span>{v3(item.key)}</span>
            <strong>{item.n}</strong>
          </Link>
        ))}
      </div>
      <h3 className="c3-title">{v3("heroMoney")}</h3>
      <div className="c3-today-money">
        <div>
          <h4 className="c3-title">{v3("heroDeposits")}</h4>
          {!depMoney.length && <p className="c3-muted">{v3("heroNone")}</p>}
          <ul>{depMoney.map((row) => <li key={row.currency}>{money(row.amount, row.currency, locale)} · {row.count}</li>)}</ul>
        </div>
        <div>
          <h4 className="c3-title">{v3("heroWithdrawals")}</h4>
          {!wdMoney.length && <p className="c3-muted">{v3("heroNone")}</p>}
          <ul>{wdMoney.map((row) => <li key={row.currency}>{money(row.amount, row.currency, locale)} · {row.count}</li>)}</ul>
        </div>
      </div>
    </section>
  );
}

export function DeskStaff() {
  const v3 = useV3();
  const workers = useJson<{ workers?: { id: string; name?: string | null; desk?: string | null }[] }>("/api/admin/workers?take=40");
  const people = useJson<{ users?: { assigneeName?: string | null }[] }>("/api/admin/users?take=80&meta=0&role=TRADER");
  const [mode, setMode] = useState<WorkFilter>("all");
  const [query, setQuery] = useState("");
  useEffect(() => { setMode(readLoad(window.localStorage.getItem(LOAD_KEY))); }, []);
  const staff = workers.data?.workers || [];
  const customers = people.data?.users || [];
  const cards = filterLoad(staffCards(staff, customers), mode).filter((card) => !query.trim() || card.name.toLowerCase().includes(query.trim().toLowerCase()));
  const groups = groupByDesk(cards);
  function pick(next: WorkFilter) {
    setMode(next);
    window.localStorage.setItem(LOAD_KEY, next);
  }
  return (
    <section className="c3-staff" aria-label={v3("staffTitle")} data-staff="1">
      <h2 className="c3-title">{v3("staffTitle")}</h2>
      <p className="c3-muted">{v3("staffHint")}</p>
      <p>{v3("staffUnassigned")} · {unassignedCount(customers, staff)}</p>
      <div className="c3-tools">
        {(["all", "busy", "clear"] as const).map((item) => (
          <button key={item} type="button" className="c3-chip" data-on={mode === item ? "1" : "0"} onClick={() => pick(item)}>
            {v3(item === "all" ? "staffAll" : item === "busy" ? "staffBusy" : "staffClear")}
          </button>
        ))}
      </div>
      <label className="c3-lab"><span>{v3("staffSearch")}</span><input className="c3-field" aria-label={v3("staffSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
      {!workers.loading && !cards.length && <p className="c3-muted">{v3("staffEmpty")}</p>}
      {groups.map((group) => (
        <section key={group.desk || "none"}>
          <h3 className="c3-title">{group.desk || v3("staffNoDesk")}</h3>
          <ul className="c3-staff-cards">
            {group.cards.map((card) => (
              <li key={card.id}>
                <strong>{card.name}</strong>
                <span>{v3("staffAssigned")} {card.assigned}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </section>
  );
}
