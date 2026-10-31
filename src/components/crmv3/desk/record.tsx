"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { riskScore, readJson, writeJson } from "@/lib/crmv3/bridge";
import {
  LIST_KEY,
  addList,
  countList,
  deleteList,
  emptyRules,
  initialsOf,
  listIsOpen,
  moveList,
  readLists,
  renameList,
  type ListRow,
  type ListRules,
  type SmartList,
} from "@/lib/crmv3/lists";
import { sumsByCurrency } from "@/lib/crmv3/review";
import { crmv3Href } from "@/lib/crmv3/sections";
import { money, sendJson, Status, useJson, type Tx, type UserRow } from "../kit";
import { useV3, type V3 } from "./store";

type CashRow = { id: string; amount?: number | null; currency?: string | null; userId?: string | null; user?: { id?: string | null } | null };

export function useLists(): [SmartList[], (next: SmartList[]) => void, boolean] {
  const [lists, setLists] = useState<SmartList[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const read = () => setLists(readLists(readJson(LIST_KEY, [])));
    read();
    setReady(true);
    window.addEventListener("crmv3:smart-lists", read);
    return () => window.removeEventListener("crmv3:smart-lists", read);
  }, []);
  function save(next: SmartList[]) {
    setLists(next);
    writeJson(LIST_KEY, next);
    window.dispatchEvent(new Event("crmv3:smart-lists"));
  }
  return [lists, save, ready];
}

function accountMoney(value: unknown, currency: string, locale: string): string {
  if (currency.length === 3) return money(value, currency, locale);
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(n);
}

export function RecordHead({ base, user, locale, tx }: { base: string; user: UserRow; locale: string; tx: Tx }) {
  const v3 = useV3();
  const [msg, setMsg] = useState("");
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
    <header className="c3-record-head" aria-label={v3("recHead")} data-record="1">
      <div className="c3-record-id">
        <span className="c3-record-mark" aria-hidden="true">{initialsOf(user.name || "")}</span>
        <div>
          <h2 className="c3-title">{name}</h2>
          <p className="c3-muted">{email || "—"}{user.phone ? ` · ${user.phone}` : ""}</p>
          <p className="c3-muted">{user.country || "—"} · {user.desk || "—"}</p>
          <p className="c3-muted">{v3("recId")} {user.id}</p>
        </div>
      </div>
      <div className="c3-record-chips">
        <Status tone={String(user.documentsStatus || "").toUpperCase() === "APPROVED" ? "ok" : "muted"}>{v3("recKyc")} {user.documentsStatus || v3("recNoKyc")}</Status>
        <Status tone="info">{v3("recStage")} {user.saleStatus || v3("recNoStage")}</Status>
        <Status tone="muted">{v3("recRetention")} {user.retentionStatus || v3("recNoRetention")}</Status>
        <Status tone="warn">{v3("recReading")} {reading}</Status>
        <Status tone={user.active === false ? "bad" : "ok"}>{user.active === false ? tx("chipFrozen") : tx("chipActive")}</Status>
        <p className="c3-muted c3-meta">{v3("recReadingHint")}</p>
      </div>
      <div className="c3-record-figs">
        <p><span className="c3-muted">{v3("recBalance")}</span> {accountMoney(balance, currency, locale)}</p>
        <p><span className="c3-muted">{v3("recEquity")}</span> {accountMoney(equity, currency, locale)}</p>
        <p className="c3-muted c3-meta">{v3("recSplit")}</p>
        <h3 className="c3-title">{v3("recDeposits")}</h3>
        {!depSums.length && <p className="c3-muted">{v3("recNone")}</p>}
        <ul>{depSums.map((row) => <li key={row.currency}>{money(row.amount, row.currency, locale)} · {row.count}</li>)}</ul>
        <h3 className="c3-title">{v3("recWithdrawals")}</h3>
        {!wdSums.length && <p className="c3-muted">{v3("recNone")}</p>}
        <ul>{wdSums.map((row) => <li key={row.currency}>{money(row.amount, row.currency, locale)} · {row.count}</li>)}</ul>
      </div>
      <div className="c3-record-acts">
        <p className="c3-muted c3-meta">{v3("recHint")}</p>
        <div className="c3-record-acts-row">
          <Link className="c3-chip" href={crmv3Href(base, `customers/${user.id}`, { part: "notes" })}>{v3("recNotes")}</Link>
          <Link className="c3-chip" href={crmv3Href(base, `customers/${user.id}`, { part: "money" })}>{v3("recMoney")}</Link>
          <Link className="c3-chip" href={crmv3Href(base, `customers/${user.id}`, { part: "files" })}>{v3("recFiles")}</Link>
          <Link className="c3-chip" href={crmv3Href(base, "deposit")}>{v3("depDesk")}</Link>
          <Link className="c3-chip" href={crmv3Href(base, "withdraw")}>{v3("wdDesk")}</Link>
          <Link className="c3-chip" href={crmv3Href(base, "kyc")}>{v3("kycDesk")}</Link>
          <Link className="c3-chip" href={crmv3Href(base, "inbox")}>{v3("inboxTitle")}</Link>
          <button type="button" className="c3-btn" onClick={() => void openTerminal(user.id, tx, setMsg)}>{tx("viewAs")}</button>
          <button type="button" className="c3-btn" onClick={() => void makeLink(user.id, tx, setMsg)}>{tx("loginLink")}</button>
          <button type="button" className="c3-btn" onClick={() => void copyId(user.id, v3, setMsg)}>{v3("copyId")}</button>
        </div>
        {msg && <p className="c3-muted" role="status">{msg}</p>}
      </div>
    </header>
  );
}

async function openTerminal(id: string, tx: Tx, setMsg: (value: string) => void) {
  const res = await sendJson("/api/admin/impersonate", "POST", { userId: id, returnTo: `/izcrm/crmv3/customers/${id}` });
  if (!res.ok) {
    setMsg(res.error || tx("failed"));
    return;
  }
  window.location.href = String(res.data.redirect || "/trade");
}

async function makeLink(id: string, tx: Tx, setMsg: (value: string) => void) {
  const res = await sendJson(`/api/admin/users/${encodeURIComponent(id)}/login-link`, "POST", { expiresInMinutes: 60, forcePasswordReset: false });
  const url = String(res.data.url || "");
  if (!res.ok || !url) {
    setMsg(res.error || tx("linkFailed"));
    return;
  }
  try {
    await navigator.clipboard.writeText(url);
    setMsg(tx("linkReady"));
  } catch {
    setMsg(url);
  }
}

async function copyId(id: string, v3: V3, setMsg: (value: string) => void) {
  try {
    await navigator.clipboard.writeText(id);
    setMsg(v3("recCopied"));
  } catch {
    setMsg(id);
  }
}

export function SmartMenu({ base, v3, onPick, linkClass }: { base: string; v3: V3; onPick?: () => void; linkClass: string }) {
  const [lists] = useLists();
  const data = useJson<{ users?: ListRow[] }>("/api/admin/users?view=table&take=80&skip=0&meta=0&role=TRADER");
  const rows = data.data?.users || [];
  return (
    <div className="c3-smart-menu">
      <p className="c3-muted c3-meta c3-rail-name">{v3("listTitle")}</p>
      {!lists.length && <p className="c3-muted c3-meta c3-rail-name">{v3("listEmpty")}</p>}
      <ul>
        {lists.map((item) => {
          const count = data.data ? countList(rows, item.rules) : null;
          return (
            <li key={item.id}>
              <Link className={linkClass} href={crmv3Href(base, "customers", { list: item.id })} aria-label={`${item.name} ${count ?? ""}`} onClick={onPick}>
                <span className="c3-rail-mark" aria-hidden="true">{item.name.slice(0, 1)}</span>
                <span className="c3-rail-name">{item.name}{count == null ? "" : ` · ${count}`}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      <p className="c3-muted c3-meta c3-rail-name">{v3("listHint")}</p>
    </div>
  );
}

export function ListDesk({ base, v3, activeId }: { base: string; v3: V3; activeId: string }) {
  const [lists, save, ready] = useLists();
  const [name, setName] = useState("");
  const [rules, setRules] = useState<ListRules>(emptyRules());
  const [rename, setRename] = useState("");
  const active = lists.find((item) => item.id === activeId);
  function setRule<K extends keyof ListRules>(key: K, value: ListRules[K]) {
    setRules((current) => ({ ...current, [key]: value }));
  }
  return (
    <section className="c3-list-desk" aria-label={v3("listTitle")} data-lists="1">
      <h3 className="c3-title">{v3("listTitle")}</h3>
      <p className="c3-muted">{v3("listHint")}</p>
      {ready && activeId && !active && <p>{v3("listMissing")}</p>}
      {active && <p>{v3("listShowing")} {active.name}{listIsOpen(active.rules) ? ` · ${v3("listOpen")}` : ""}</p>}
      {!lists.length && <p className="c3-muted">{v3("listEmpty")}</p>}
      <ul className="c3-list-rows">
        {lists.map((item) => (
          <li key={item.id} data-on={item.id === activeId ? "1" : "0"}>
            {rename === item.id ? (
              <input
                className="c3-field"
                aria-label={v3("listRename")}
                defaultValue={item.name}
                onBlur={(event) => { save(renameList(lists, item.id, event.target.value)); setRename(""); }}
              />
            ) : <Link href={crmv3Href(base, "customers", { list: item.id })}>{item.name}</Link>}
            <button type="button" className="c3-btn" aria-label={v3("listRename")} onClick={() => setRename(item.id)}>{v3("listRename")}</button>
            <button type="button" className="c3-btn" aria-label={v3("listUp")} onClick={() => save(moveList(lists, item.id, -1))}>{v3("listUp")}</button>
            <button type="button" className="c3-btn" aria-label={v3("listDown")} onClick={() => save(moveList(lists, item.id, 1))}>{v3("listDown")}</button>
            <button type="button" className="c3-btn" aria-label={v3("listDelete")} onClick={() => save(deleteList(lists, item.id))}>{v3("listDelete")}</button>
          </li>
        ))}
      </ul>
      <label className="c3-lab"><span>{v3("listName")}</span><input className="c3-field" aria-label={v3("listName")} value={name} onChange={(event) => setName(event.target.value)} /></label>
      <label className="c3-lab"><span>{v3("listKyc")}</span><input className="c3-field" aria-label={v3("listKyc")} value={rules.kyc} onChange={(event) => setRule("kyc", event.target.value)} /></label>
      <label className="c3-lab"><span>{v3("listStage")}</span><input className="c3-field" aria-label={v3("listStage")} value={rules.stage} onChange={(event) => setRule("stage", event.target.value)} /></label>
      <label className="c3-lab"><span>{v3("listCountry")}</span><input className="c3-field" aria-label={v3("listCountry")} value={rules.country} onChange={(event) => setRule("country", event.target.value)} /></label>
      <label className="c3-lab"><span>{v3("listFtd")}</span>
        <select className="c3-select" aria-label={v3("listFtd")} value={rules.ftd} onChange={(event) => setRule("ftd", event.target.value as ListRules["ftd"])}>
          <option value="">{v3("listAny")}</option>
          <option value="yes">{v3("listYes")}</option>
          <option value="no">{v3("listNo")}</option>
        </select>
      </label>
      <button type="button" className="c3-btn c3-btn-hot" onClick={() => {
        const next = addList(lists, name, rules);
        if (next === lists) return;
        save(next);
        setName("");
        setRules(emptyRules());
      }}>{v3("listSave")}</button>
    </section>
  );
}
