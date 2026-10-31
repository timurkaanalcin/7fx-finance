"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { sumsByCurrency } from "@/lib/crmv4/round27";
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
} from "@/lib/crmv4/round35";
import { crmv4Href } from "@/lib/crmv4/sections";
import { money, useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

type Cash = { amount?: number | null; currency?: string | null; status?: string | null };

export function TodayHero({ base, name, v4, locale }: { base: string; name: string; v4: V4; locale: string }) {
  const deposits = useJson<{ requests?: Cash[] }>("/api/admin/deposits?status=PENDING&take=40");
  const withdrawals = useJson<{ requests?: Cash[] }>("/api/admin/withdrawals?status=PENDING&take=40");
  const people = useJson<{ users?: { documentsStatus?: string | null; retentionFollowUpAt?: string | null }[] }>("/api/admin/users?take=80&meta=0&role=TRADER");
  const chat = useJson<{ threads?: { messages?: { workerId?: string | null; automatic?: boolean | null }[]; presence?: { adminLastReadAt?: string | null } | null }[] }>("/api/admin/chat?take=30");
  const today = new Date().toISOString().slice(0, 10);
  const users = people.data?.users || [];
  const depRows = deposits.data?.requests || [];
  const wdRows = withdrawals.data?.requests || [];
  const counts = [
    { key: "heroDeposits" as const, n: pendingCount(depRows), href: crmv4Href(base, "deposit") },
    { key: "heroWithdrawals" as const, n: pendingCount(wdRows), href: crmv4Href(base, "withdraw") },
    { key: "heroKyc" as const, n: kycOpen(users), href: crmv4Href(base, "kyc") },
    { key: "heroFollow" as const, n: overdueFollows(users, today), href: crmv4Href(base, "agenda") },
    { key: "heroUnread" as const, n: unreadThreads(chat.data?.threads || []), href: crmv4Href(base, "inbox") },
  ];
  const depMoney = sumsByCurrency(depRows.filter((row) => !row.status || String(row.status).toUpperCase() === "PENDING").map((row, index) => ({ id: String(index), amount: row.amount, currency: row.currency })));
  const wdMoney = sumsByCurrency(wdRows.filter((row) => !row.status || String(row.status).toUpperCase() === "PENDING").map((row, index) => ({ id: String(index), amount: row.amount, currency: row.currency })));
  return (
    <section className="c4-today-hero" aria-label={v4("heroTitle")} data-hero="1">
      <p className="c4-muted">{name || "—"}</p>
      <h2 className="c4-title">{v4("heroTitle")}</h2>
      <p className="c4-muted">{v4("heroHint")}</p>
      <div className="c4-today-counts">
        {counts.map((item) => (
          <Link key={item.key} href={item.href}>
            <span>{v4(item.key)}</span>
            <strong>{item.n}</strong>
          </Link>
        ))}
      </div>
      <h3 className="c4-title">{v4("heroMoney")}</h3>
      <div className="c4-today-money">
        <div>
          <h4>{v4("heroDeposits")}</h4>
          {!depMoney.length && <p>{v4("heroNone")}</p>}
          <ul>{depMoney.map((row) => <li key={row.currency}>{money(row.amount, row.currency, locale)} · {row.count}</li>)}</ul>
        </div>
        <div>
          <h4>{v4("heroWithdrawals")}</h4>
          {!wdMoney.length && <p>{v4("heroNone")}</p>}
          <ul>{wdMoney.map((row) => <li key={row.currency}>{money(row.amount, row.currency, locale)} · {row.count}</li>)}</ul>
        </div>
      </div>
    </section>
  );
}

export function DeskStaff({ v4 }: { v4: V4 }) {
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
    <section className="c4-staff-luxe" aria-label={v4("staffTitle")} data-staff="1">
      <h2 className="c4-title">{v4("staffTitle")}</h2>
      <p className="c4-muted">{v4("staffHint")}</p>
      <p>{v4("staffUnassigned")} · {unassignedCount(customers, staff)}</p>
      <div className="c4-line-filters">
        {(["all", "busy", "clear"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={mode === item ? "1" : "0"} onClick={() => pick(item)}>
            {v4(item === "all" ? "staffAll" : item === "busy" ? "staffBusy" : "staffClear")}
          </button>
        ))}
      </div>
      <label className="c4-lab"><span>{v4("staffSearch")}</span><input className="c4-field" aria-label={v4("staffSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
      {!cards.length && <p className="c4-empty-gold">{v4("staffEmpty")}</p>}
      {groups.map((group) => (
        <section key={group.desk || "none"}>
          <h3 className="c4-title">{group.desk || v4("staffNoDesk")}</h3>
          <ul className="c4-staff-cards">
            {group.cards.map((card) => (
              <li key={card.id}>
                <strong>{card.name}</strong>
                <span>{v4("staffAssigned")} {card.assigned}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </section>
  );
}
