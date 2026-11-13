"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { sumsByCurrency } from "@/lib/crmv4/round27";
import { riskScore } from "@/lib/crmv4/round6";
import {
  LIST_KEY,
  addList,
  countList,
  deleteList,
  emptyRules,
  initialsOf,
  listIsOpen,
  matchList,
  moveList,
  readLists,
  renameList,
  type ListRow,
  type ListRules,
  type SmartList,
} from "@/lib/crmv4/round31";
import { crmv4Href } from "@/lib/crmv4/sections";
import { money, useJson, type Tx } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  country?: string | null;
  desk?: string | null;
  active?: boolean;
  documentsStatus?: string | null;
  saleStatus?: string | null;
  retentionStatus?: string | null;
  balance?: number | null;
  equity?: number | null;
  currency?: string | null;
  ftd?: boolean | null;
  account?: { balance?: number; equity?: number; currency?: string } | null;
};

type CashRow = { id: string; amount?: number | null; currency?: string | null; userId?: string | null; user?: { id?: string | null } | null };

export function useLists(): [SmartList[], (next: SmartList[]) => void] {
  const [lists, setLists] = useState<SmartList[]>([]);
  useEffect(() => {
    const read = () => setLists(readLists(readJson(LIST_KEY, [])));
    read();
    window.addEventListener("crmv4:smart-lists", read);
    return () => window.removeEventListener("crmv4:smart-lists", read);
  }, []);
  function save(next: SmartList[]) {
    setLists(next);
    writeJson(LIST_KEY, next);
    window.dispatchEvent(new Event("crmv4:smart-lists"));
  }
  return [lists, save];
}

export function RecordHead({
  base,
  user,
  locale,
  tx,
  v4,
  quickMsg,
  onView,
  onLink,
  onCopy,
}: {
  base: string;
  user: Person;
  locale: string;
  tx: Tx;
  v4: V4;
  quickMsg: string;
  onView: () => void;
  onLink: () => void;
  onCopy: () => void;
}) {
  const email = user.email || "";
  const deposits = useJson<{ requests?: CashRow[] }>(email ? `/api/admin/deposits?take=40&q=${encodeURIComponent(email)}` : null);
  const withdrawals = useJson<{ requests?: CashRow[] }>(email ? `/api/admin/withdrawals?take=40&q=${encodeURIComponent(email)}` : null);
  const mine = (rows: CashRow[]) => rows.filter((row) => String(row.user?.id || row.userId || "") === user.id);
  const depSums = sumsByCurrency(mine(deposits.data?.requests || []));
  const wdSums = sumsByCurrency(mine(withdrawals.data?.requests || []));
  const currency = user.currency || user.account?.currency || "";
  const balance = user.balance ?? user.account?.balance;
  const equity = user.equity ?? user.account?.equity;
  const reading = riskScore({
    active: user.active,
    documentsStatus: user.documentsStatus,
    balance: balance ?? undefined,
    equity: equity ?? undefined,
    ftd: Boolean(user.ftd),
  });
  const name = user.name || "—";
  return (
    <header className="c4-record-head c4-record-folio" aria-label={v4("recHead")} data-record="1" data-folio="1">
      <div className="c4-record-folio-mast">
        <p className="c4-record-folio-seal" data-logo="mono">7FX</p>
        <div>
          <p className="c4-record-folio-kicker">{v4("recFolKicker")}</p>
          <p className="c4-record-folio-lead">{v4("recFolLead")}</p>
        </div>
        <ol className="c4-record-folio-index" aria-label={v4("recFolKicker")}>
          <li data-tone="ivory">{v4("recFolIvory")}</li>
          <li data-tone="ink">{v4("recFolGraphite")}</li>
          <li data-tone="gold">{v4("recFolChampagne")}</li>
        </ol>
      </div>
      <div className="c4-record-id">
        <span className="c4-record-mark" aria-hidden="true">{initialsOf(user.name || "")}</span>
        <div>
          <h2>{name}</h2>
          <p className="c4-muted">{email || "—"}{user.phone ? ` · ${user.phone}` : ""}</p>
          <p className="c4-muted">{user.country || "—"} · {user.desk || "—"}</p>
          <p className="c4-muted">{v4("customerId")} {user.id}</p>
        </div>
      </div>
      <div className="c4-record-chips c4-record-folio-chips">
        <span className="c4-status c4-record-folio-chip" data-tone={String(user.documentsStatus || "").toUpperCase() === "APPROVED" ? "ok" : "muted"}>{v4("recKyc")} {user.documentsStatus || v4("recNoKyc")}</span>
        <span className="c4-status c4-record-folio-chip" data-tone="info">{v4("recStage")} {user.saleStatus || v4("recNoStage")}</span>
        <span className="c4-status c4-record-folio-chip" data-tone="muted">{v4("recRetention")} {user.retentionStatus || v4("recNoRetention")}</span>
        <span className="c4-status c4-record-folio-chip" data-tone="warn">{v4("recReading")} {reading}</span>
        <span className="c4-status c4-record-folio-chip" data-tone={user.active === false ? "bad" : "ok"}>{user.active === false ? tx("chipFrozen") : tx("chipActive")}</span>
        <p className="c4-muted">{v4("recReadingHint")}</p>
      </div>
      <div className="c4-record-figs c4-record-folio-figs">
        <p><span className="c4-muted">{v4("recBalance")}</span> {money(balance, currency, locale)}</p>
        <p><span className="c4-muted">{v4("recEquity")}</span> {money(equity, currency, locale)}</p>
        <p className="c4-muted">{v4("recSplit")}</p>
        <h3 className="c4-title">{v4("recDeposits")}</h3>
        {!depSums.length && <p>{v4("recNone")}</p>}
        <ul>{depSums.map((row) => <li key={row.currency}>{money(row.amount, row.currency, locale)} · {row.count}</li>)}</ul>
        <h3 className="c4-title">{v4("recWithdrawals")}</h3>
        {!wdSums.length && <p>{v4("recNone")}</p>}
        <ul>{wdSums.map((row) => <li key={row.currency}>{money(row.amount, row.currency, locale)} · {row.count}</li>)}</ul>
      </div>
      <div className="c4-record-acts">
        <p className="c4-muted">{v4("recHint")}</p>
        <div className="c4-line-filters">
          <Link className="c4-chip" href={crmv4Href(base, `customers/${user.id}`, { part: "notes" })}>{v4("recNotes")}</Link>
          <Link className="c4-chip" href={crmv4Href(base, `customers/${user.id}`, { part: "money" })}>{v4("recMoney")}</Link>
          <Link className="c4-chip" href={crmv4Href(base, `customers/${user.id}`, { part: "files" })}>{v4("recFiles")}</Link>
          <Link className="c4-chip" href={crmv4Href(base, "deposit")}>{v4("depDesk")}</Link>
          <Link className="c4-chip" href={crmv4Href(base, "withdraw")}>{v4("wdDesk")}</Link>
          <Link className="c4-chip" href={crmv4Href(base, "kyc")}>{v4("kycDesk")}</Link>
          <Link className="c4-chip" href={crmv4Href(base, "inbox")}>{v4("inboxTitle")}</Link>
          <button type="button" className="c4-btn" onClick={onView}>{tx("viewAs")}</button>
          <button type="button" className="c4-btn" onClick={onLink}>{tx("loginLink")}</button>
          <button type="button" className="c4-btn" onClick={onCopy}>{v4("copyId")}</button>
        </div>
        {quickMsg && <p className="c4-muted">{quickMsg}</p>}
      </div>
    </header>
  );
}

export function SmartRail({ base, v4, onPick }: { base: string; v4: V4; onPick?: () => void }) {
  const [lists] = useLists();
  const data = useJson<{ users?: ListRow[] }>("/api/admin/users?view=table&take=80&skip=0&meta=0&role=TRADER");
  const rows = data.data?.users || [];
  return (
    <div className="c4-smart-rail c4-list-folio">
      <header className="c4-list-folio-mast">
        <p className="c4-list-folio-seal" data-logo="mono">7FX</p>
        <div>
          <p className="c4-list-folio-kicker">{v4("lstFolKicker")}</p>
          <p className="c4-list-folio-lead">{v4("lstFolLead")}</p>
        </div>
      </header>
      <ol className="c4-list-folio-index" aria-label={v4("lstFolKicker")}>
        <li data-tone="ivory">{v4("lstFolIvory")}</li>
        <li data-tone="ink">{v4("lstFolGraphite")}</li>
        <li data-tone="gold">{v4("lstFolChampagne")}</li>
      </ol>
      <p className="c4-rail-name c4-muted">{v4("listTitle")}</p>
      {!lists.length && <p className="c4-list-folio-empty">{v4("listEmpty")}</p>}
      <ul>
        {lists.map((item) => {
          const count = data.data ? countList(rows, item.rules) : null;
          return (
            <li key={item.id}>
              <Link className="c4-rail-link" href={crmv4Href(base, "customers", { list: item.id })} aria-label={`${item.name} ${count ?? ""}`} onClick={onPick}>
                <span className="c4-rail-mark" aria-hidden="true">{item.name.slice(0, 1)}</span>
                <span className="c4-rail-name">{item.name}{count == null ? "" : ` · ${count}`}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      <p className="c4-rail-name c4-muted">{v4("listHint")}</p>
    </div>
  );
}

export function ListDesk({ v4, activeId }: { v4: V4; activeId: string }) {
  const [lists, save] = useLists();
  const [name, setName] = useState("");
  const [rules, setRules] = useState<ListRules>(emptyRules());
  const [rename, setRename] = useState("");
  const active = lists.find((item) => item.id === activeId);
  function setRule<K extends keyof ListRules>(key: K, value: ListRules[K]) {
    setRules((current) => ({ ...current, [key]: value }));
  }
  return (
    <section className="c4-list-desk c4-list-folio-desk" aria-label={v4("listTitle")} data-lists="1">
      <header className="c4-list-folio-desk-mast">
        <p className="c4-list-folio-seal" data-logo="mono">7FX</p>
        <div>
          <p className="c4-list-folio-kicker">{v4("lstFolKicker")}</p>
          <h3 className="c4-title">{v4("listTitle")}</h3>
        </div>
      </header>
      <p className="c4-muted">{v4("listHint")}</p>
      {activeId && !active && <p>{v4("listMissing")}</p>}
      {active && <p>{v4("listShowing")} {active.name}{listIsOpen(active.rules) ? ` · ${v4("listOpen")}` : ""}</p>}
      {!lists.length && <p className="c4-empty-gold">{v4("listEmpty")}</p>}
      <ul className="c4-list-rows">
        {lists.map((item) => (
          <li key={item.id} data-on={item.id === activeId ? "1" : "0"}>
            {rename === item.id ? (
              <input
                className="c4-field"
                aria-label={v4("listRename")}
                defaultValue={item.name}
                onBlur={(event) => { save(renameList(lists, item.id, event.target.value)); setRename(""); }}
              />
            ) : <Link href={`?list=${encodeURIComponent(item.id)}`}>{item.name}</Link>}
            <button type="button" className="c4-btn" aria-label={v4("listRename")} onClick={() => setRename(item.id)}>{v4("listRename")}</button>
            <button type="button" className="c4-btn" aria-label={v4("listUp")} onClick={() => save(moveList(lists, item.id, -1))}>{v4("listUp")}</button>
            <button type="button" className="c4-btn" aria-label={v4("listDown")} onClick={() => save(moveList(lists, item.id, 1))}>{v4("listDown")}</button>
            <button type="button" className="c4-btn" aria-label={v4("listDelete")} onClick={() => save(deleteList(lists, item.id))}>{v4("listDelete")}</button>
          </li>
        ))}
      </ul>
      <label className="c4-lab"><span>{v4("listName")}</span><input className="c4-field" aria-label={v4("listName")} value={name} onChange={(event) => setName(event.target.value)} /></label>
      <label className="c4-lab"><span>{v4("listKyc")}</span><input className="c4-field" aria-label={v4("listKyc")} value={rules.kyc} onChange={(event) => setRule("kyc", event.target.value)} /></label>
      <label className="c4-lab"><span>{v4("listStage")}</span><input className="c4-field" aria-label={v4("listStage")} value={rules.stage} onChange={(event) => setRule("stage", event.target.value)} /></label>
      <label className="c4-lab"><span>{v4("listCountry")}</span><input className="c4-field" aria-label={v4("listCountry")} value={rules.country} onChange={(event) => setRule("country", event.target.value)} /></label>
      <label className="c4-lab"><span>{v4("listFtd")}</span>
        <select className="c4-field" aria-label={v4("listFtd")} value={rules.ftd} onChange={(event) => setRule("ftd", event.target.value as ListRules["ftd"])}>
          <option value="">{v4("listAny")}</option>
          <option value="yes">{v4("listYes")}</option>
          <option value="no">{v4("listNo")}</option>
        </select>
      </label>
      <button type="button" className="c4-btn c4-btn-hot" onClick={() => {
        const next = addList(lists, name, rules);
        if (next === lists) return;
        save(next);
        setName("");
        setRules(emptyRules());
      }}>{v4("listSave")}</button>
    </section>
  );
}

export function applyList<T extends { documentsStatus?: string | null; saleStatus?: string | null; country?: string | null; ftd?: boolean | null }>(rows: T[], lists: SmartList[], id: string): T[] {
  const list = lists.find((item) => item.id === id);
  if (!list) return rows;
  return rows.filter((row) => matchList(row, list.rules));
}
