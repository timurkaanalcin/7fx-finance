"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { methodName } from "@/lib/crmv4/round15";
import {
  WD_CHECKS,
  emptyWdChecks,
  groupHits,
  matchWithdrawals,
  moveIndex,
  pageHits,
  pendingOnly,
  pushRecent,
  readWdChecks,
  sameCurrency,
  setWdCheck,
  wdDone,
  type PendingWithdrawal,
  type SearchGroup,
  type SearchHit,
  type WdCheck,
  type WdChecks,
} from "@/lib/crmv4/round28";
import { crmv4Href } from "@/lib/crmv4/sections";
import { approvalBody, approvalEndpoint } from "@/lib/crmv2/payload";
import { money, sendJson, useJson, when, type Tx } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;
const CHECK_KEY = "crmv4-wd-review";
const RECENT_KEY = "crmv4-palette-recent";

const CHECK_LABEL: Record<WdCheck, CrmV4CopyKey> = {
  kyc: "wdCheckKyc",
  balance: "wdCheckBalance",
  deposits: "wdCheckDeposits",
  positions: "wdCheckPositions",
};

const GROUP_LABEL: Record<SearchGroup, CrmV4CopyKey> = {
  customer: "findCustomers",
  ticket: "findTickets",
  finance: "findFinance",
  page: "findPages",
};

export function WithdrawDesk({ base, v4, tx, locale }: { base: string; v4: V4; tx: Tx; locale: string }) {
  const queue = useJson<{ requests?: PendingWithdrawal[] }>("/api/admin/withdrawals?status=PENDING&take=40");
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState("");
  const [checks, setChecks] = useState<Record<string, WdChecks>>({});
  const [reason, setReason] = useState("");
  const [msg, setMsg] = useState("");
  useEffect(() => { setChecks(readWdChecks(readJson(CHECK_KEY, {}))); }, []);
  const rows = matchWithdrawals(pendingOnly(queue.data?.requests || []), query);
  const row = rows.find((item) => item.id === picked) || rows[0];
  const userId = String(row?.user?.id || "");
  const email = String(row?.user?.email || "");
  const profile = useJson<{ user?: { balance?: number | null; currency?: string | null; documentsStatus?: string | null; name?: string | null } }>(userId ? `/api/admin/users/${encodeURIComponent(userId)}?view=profile` : null);
  const deposits = useJson<{ requests?: { id: string; amount?: number | null; currency?: string | null; createdAt?: string | null; userId?: string | null; user?: { id?: string | null } | null }[] }>(email ? `/api/admin/deposits?take=20&q=${encodeURIComponent(email)}` : null);
  const book = useJson<{ positions?: { id: string; symbol?: string | null; side?: string | null; status?: string | null }[] }>(userId ? `/api/admin/users/${encodeURIComponent(userId)}?view=positions&take=20` : null);
  const person = profile.data?.user;
  const mine = (deposits.data?.requests || []).filter((item) => String(item.user?.id || item.userId || "") === userId).slice(0, 5);
  const positions = book.data?.positions || [];
  const box = row ? checks[row.id] || emptyWdChecks() : emptyWdChecks();
  const split = row && person ? !sameCurrency(row.currency, person.currency) : false;
  function saveCheck(item: WdCheck, on: boolean) {
    if (!row) return;
    const next = setWdCheck(checks, row.id, item, on);
    setChecks(next);
    writeJson(CHECK_KEY, next);
  }
  async function review(action: "approve" | "reject") {
    if (!row) return;
    const res = await sendJson(approvalEndpoint("WITHDRAW"), "POST", approvalBody(row.id, action, reason));
    setMsg(res.ok ? tx("saved") : res.error || tx("failed"));
    if (res.ok) {
      setReason("");
      queue.reload();
    }
  }
  return (
    <section className="c4-wd-luxe" aria-label={v4("wdDesk")} data-wd="1">
      <h2 className="c4-title">{v4("wdDesk")}</h2>
      <p className="c4-muted">{v4("wdHint")}</p>
      <div className="c4-kyc-split">
        <div>
          <h3 className="c4-title">{v4("wdQueue")}</h3>
          <label className="c4-lab"><span>{v4("wdSearch")}</span><input className="c4-field" aria-label={v4("wdSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
          {!rows.length && <p className="c4-empty-gold">{v4("wdEmpty")}</p>}
          <ul className="c4-kyc-queue">
            {rows.map((item) => (
              <li key={item.id}>
                <button type="button" className="c4-btn" data-on={row?.id === item.id ? "1" : "0"} onClick={() => setPicked(item.id)}>
                  {item.user?.name || "—"} · {money(item.amount, item.currency, locale)}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="c4-kyc-stage">
          {row && (
            <>
              <h3 className="c4-title">{row.user?.name || "—"}</h3>
              <p className="c4-muted">{row.user?.email || "—"} · {methodName(row.method)} · {when(row.createdAt, locale)}</p>
              <p><span className="c4-muted">{v4("wdKyc")}</span> {person?.documentsStatus || "—"}</p>
              <p><span className="c4-muted">{v4("wdBalance")}</span> {person ? money(person.balance, person.currency, locale) : "—"}</p>
              <p><span className="c4-muted">{tx("amount")}</span> {money(row.amount, row.currency, locale)}</p>
              {split && <p className="c4-muted">{v4("wdSplit")}</p>}
              <h4 className="c4-title">{v4("wdDeposits")}</h4>
              {!mine.length && <p className="c4-muted">{v4("wdNoDeposit")}</p>}
              <ul className="c4-wd-list">
                {mine.map((item) => <li key={item.id}>{money(item.amount, item.currency, locale)} · {when(item.createdAt, locale)}</li>)}
              </ul>
              <h4 className="c4-title">{v4("wdPositions")}</h4>
              {!positions.length && <p className="c4-muted">{v4("wdNoPosition")}</p>}
              <ul className="c4-wd-list">
                {positions.slice(0, 5).map((item) => <li key={item.id}>{item.symbol || "—"} {item.side || ""} · {item.status || "—"}</li>)}
              </ul>
              {userId && <Link className="c4-btn" href={crmv4Href(base, `customers/${userId}`)}>{row.user?.name || userId}</Link>}
              <fieldset className="c4-kyc-checks">
                <legend className="c4-muted">{v4("wdCheckHint")} {wdDone(box)}/{WD_CHECKS.length}</legend>
                {WD_CHECKS.map((item) => (
                  <label key={item} className="c4-row">
                    <input type="checkbox" checked={box[item]} aria-label={v4(CHECK_LABEL[item])} onChange={(event) => saveCheck(item, event.target.checked)} />
                    <span>{v4(CHECK_LABEL[item])}</span>
                  </label>
                ))}
              </fieldset>
              <label className="c4-lab">
                <span>{v4("wdReason")}</span>
                <input className="c4-field" aria-label={v4("wdReason")} aria-required={false} value={reason} onChange={(event) => setReason(event.target.value)} />
              </label>
              <p className="c4-muted">{v4("wdReasonHint")}</p>
              <div className="c4-row">
                <button type="button" className="c4-btn c4-btn-hot" onClick={() => void review("approve")}>{v4("wdApprove")}</button>
                <button type="button" className="c4-btn" onClick={() => void review("reject")}>{v4("wdReject")}</button>
              </div>
              {msg && <p className="c4-muted">{msg}</p>}
            </>
          )}
        </div>
      </div>
    </section>
  );
}

export function DeskSearch({ base, open, onClose, v4, locale }: { base: string; open: boolean; onClose: () => void; v4: V4; locale: string }) {
  const [q, setQ] = useState("");
  const [recent, setRecent] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const query = q.trim();
  const users = useJson<{ users?: { id: string; name?: string | null; email?: string | null }[] }>(open && query.length >= 2 ? `/api/admin/users?view=table&take=6&meta=0&role=TRADER&q=${encodeURIComponent(query)}` : null);
  const tickets = useJson<{ tickets?: { id: string; customer?: string | null; kind?: string | null; currency?: string | null; amount?: number | null }[] }>(open && query.length >= 2 ? `/api/admin/tickets?q=${encodeURIComponent(query)}&take=6` : null);
  const deposits = useJson<{ requests?: { id: string; amount?: number | null; currency?: string | null; user?: { name?: string | null } | null }[] }>(open && query.length >= 2 ? `/api/admin/deposits?take=6&q=${encodeURIComponent(query)}` : null);
  const withdrawals = useJson<{ requests?: { id: string; amount?: number | null; currency?: string | null; user?: { name?: string | null } | null }[] }>(open && query.length >= 2 ? `/api/admin/withdrawals?take=6&q=${encodeURIComponent(query)}` : null);
  useEffect(() => {
    if (!open) return;
    setRecent(readJson<string[]>(RECENT_KEY, []));
    input.current?.focus();
  }, [open]);
  const pages = useMemo(() => [
    { id: "overview", label: v4("subOverview"), href: crmv4Href(base, "") },
    { id: "customers", label: v4("subCustomers"), href: crmv4Href(base, "customers") },
    { id: "finance", label: v4("financeNav"), href: crmv4Href(base, "finance") },
    { id: "kyc", label: v4("kycDesk"), href: crmv4Href(base, "kyc") },
    { id: "withdraw", label: v4("wdDesk"), href: crmv4Href(base, "withdraw") },
    { id: "reports", label: v4("reportsTitle"), href: crmv4Href(base, "reports") },
    { id: "goals", label: v4("goalsTitle"), href: crmv4Href(base, "goals") },
    { id: "support", label: v4("subSupport"), href: crmv4Href(base, "support") },
  ], [base, v4]);
  const hits = useMemo(() => {
    const people: SearchHit[] = (users.data?.users || []).map((row) => ({ group: "customer", id: row.id, label: row.name || row.email || row.id, detail: row.email || "", href: crmv4Href(base, `customers/${row.id}`) }));
    const ticketHits: SearchHit[] = (tickets.data?.tickets || []).slice(0, 6).map((row) => ({ group: "ticket", id: row.id, label: row.customer || row.id, detail: `${row.kind || ""}${row.currency ? ` ${row.currency}` : ""}`, href: crmv4Href(base, "support", { open: row.id }) }));
    const moneyHits: SearchHit[] = [
      ...(deposits.data?.requests || []).map((row) => ({ group: "finance" as const, id: `d-${row.id}`, label: row.user?.name || row.id, detail: money(row.amount, row.currency, locale), href: crmv4Href(base, "finance", { open: row.id }) })),
      ...(withdrawals.data?.requests || []).map((row) => ({ group: "finance" as const, id: `w-${row.id}`, label: row.user?.name || row.id, detail: money(row.amount, row.currency, locale), href: crmv4Href(base, "finance", { tab: "withdrawals", open: row.id }) })),
    ];
    return [...people, ...ticketHits, ...moneyHits, ...pageHits(query, pages)];
  }, [users.data, tickets.data, deposits.data, withdrawals.data, base, pages, query, locale]);
  const groups = groupHits(query.length >= 2 ? hits : pageHits("", pages));
  const flat = groups.flatMap((group) => group.items);
  const active = flat[Math.min(index, Math.max(0, flat.length - 1))];
  function remember(text: string) {
    const next = pushRecent(readJson<string[]>(RECENT_KEY, []), text);
    writeJson(RECENT_KEY, next);
    setRecent(next);
  }
  function choose(hit: SearchHit) {
    if (query.length >= 2) remember(query);
    onClose();
    window.location.assign(hit.href);
  }
  if (!open) return null;
  return (
    <div className="c4-palette-back" role="presentation" onClick={onClose}>
      <div className="c4-find-luxe" role="dialog" aria-modal="true" aria-label={v4("findTitle")} onClick={(event) => event.stopPropagation()}>
        <input
          ref={input}
          className="c4-field"
          value={q}
          placeholder={v4("findHint")}
          aria-label={v4("findTitle")}
          aria-activedescendant={active ? `find-${active.id}` : undefined}
          onChange={(event) => { setQ(event.target.value); setIndex(0); }}
          onKeyDown={(event) => {
            if (event.key === "Escape") onClose();
            if (event.key === "ArrowDown") { event.preventDefault(); setIndex((current) => moveIndex(current, 1, flat.length)); }
            if (event.key === "ArrowUp") { event.preventDefault(); setIndex((current) => moveIndex(current, -1, flat.length)); }
            if (event.key === "Enter" && active) { event.preventDefault(); choose(active); }
          }}
        />
        {query.length < 2 && (
          <div>
            <p className="c4-muted">{v4("findRecent")}</p>
            {!recent.length && <p className="c4-muted">{v4("findRecentEmpty")}</p>}
            <div className="c4-line-filters">
              {recent.map((item) => <button key={item} type="button" className="c4-chip" onClick={() => { setQ(item); setIndex(0); }}>{item}</button>)}
              {recent.length > 0 && <button type="button" className="c4-btn" onClick={() => { writeJson(RECENT_KEY, []); setRecent([]); }}>{v4("findClear")}</button>}
            </div>
          </div>
        )}
        {!flat.length && <p className="c4-muted">{v4("findEmpty")}</p>}
        {groups.map((group) => (
          <section key={group.group} aria-label={v4(GROUP_LABEL[group.group])}>
            <h3 className="c4-title">{v4(GROUP_LABEL[group.group])}</h3>
            <ul className="c4-find-list" role="listbox">
              {group.items.map((hit) => (
                <li key={`${hit.group}-${hit.id}`} id={`find-${hit.id}`} role="option" aria-selected={active?.id === hit.id} data-on={active?.id === hit.id ? "1" : "0"}>
                  <button type="button" className="c4-btn" onClick={() => choose(hit)}>{hit.label}{hit.detail ? ` · ${hit.detail}` : ""}</button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
