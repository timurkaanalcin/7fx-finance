"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import {
  CHIP_KEY,
  PACK_KEY,
  activeCode,
  addNote,
  currencyCode,
  currencyCodes,
  currencyLines,
  readHidden,
  readNotes,
  setNoteHidden,
  singleTotal,
  toggleCode,
  toggleNotePin,
  visibleCodes,
  visibleMoney,
  visibleNotes,
  type AmountRow,
  type Note,
} from "@/lib/crmv4/round79";
import { crmv4Href } from "@/lib/crmv4/sections";
import { money, useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  email?: string | null;
  balance?: number | null;
  currency?: string | null;
  account?: { balance?: number | null; currency?: string | null } | null;
};

type Cash = {
  id: string;
  amount?: number | null;
  currency?: string | null;
  user?: { id?: string | null; name?: string | null; email?: string | null } | null;
};

type MoneyRow = AmountRow & { id: string; userId: string; label: string };

const LISTS = {
  users: "/api/admin/users?take=40&meta=0&role=TRADER",
  deposits: "/api/admin/deposits?take=40",
  withdrawals: "/api/admin/withdrawals?take=40",
} as const;

function moneyText(currency: string, amount: number, locale: string): string {
  if (currency.length === 3) return money(amount, currency, locale);
  return "";
}

export function CallPack({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>(LISTS.users);
  const [items, setItems] = useState<Note[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [body, setBody] = useState("");
  const [when, setWhen] = useState("");
  const [query, setQuery] = useState("");
  const [hidden, setHidden] = useState(false);
  const loaded = data.data?.users || [];
  const names: Record<string, string> = {};
  for (const person of loaded) names[person.id] = String(person.name || person.email || person.id);
  useEffect(() => {
    if (data.loading || data.error) return;
    const known = (data.data?.users || []).map((person) => person.id);
    const next = readNotes(readJson(PACK_KEY, []), known);
    setItems(next);
    if (known.length) writeJson(PACK_KEY, next);
  }, [data.loading, data.error, data.data]);
  const shown = visibleNotes(items, query, hidden, names);

  function store(next: Note[]) {
    setItems(next);
    writeJson(PACK_KEY, next);
  }

  return (
    <section className="c4-call-pack" aria-label={v4("cpTitle")} data-call-pack="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-pay-kicker">{v4("cpSub")}</p>
          <h2 className="c4-title">{v4("cpTitle")}</h2>
        </div>
        <p className="c4-meta">{shown.length}</p>
      </header>
      <p className="c4-meta">{v4("cpHint")}</p>
      <p className="c4-meta">{v4("cpLocal")}</p>
      {data.error && <p className="c4-meta">{v4("cpFailed")}</p>}
      {!data.loading && !data.error && !loaded.length && <p className="c4-pay-empty">{v4("cpNone")}</p>}
      <form className="c4-row" onSubmit={(event) => {
        event.preventDefault();
        const next = addNote(items, { id: `cp-${Date.now()}-${customerId}`, customerId, body, when, at: new Date().toISOString() }, loaded.map((person) => person.id));
        if (next.length === items.length) return;
        store(next);
        setBody("");
        setWhen("");
        setCustomerId("");
      }}>
        <label className="c4-lab">
          <span>{v4("cpCustomer")}</span>
          <select className="c4-select" aria-label={v4("cpCustomer")} value={customerId} onChange={(event) => setCustomerId(event.target.value)}>
            <option value="">{v4("cpCustomer")}</option>
            {loaded.map((person) => <option key={person.id} value={person.id}>{person.name || person.email || person.id}</option>)}
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("cpNote")}</span>
          <input className="c4-field" aria-label={v4("cpNote")} value={body} onChange={(event) => setBody(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("cpWhen")}</span>
          <input className="c4-field" aria-label={v4("cpWhen")} value={when} onChange={(event) => setWhen(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn">{v4("cpAdd")}</button>
      </form>
      <p className="c4-meta">{v4("cpBlank")}</p>
      <label className="c4-lab">
        <span>{v4("cpSearch")}</span>
        <input className="c4-field" aria-label={v4("cpSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c4-row" role="group" aria-label={v4("cpShown")}>
        <button type="button" className="c4-chip" data-on={hidden ? "0" : "1"} aria-pressed={!hidden} onClick={() => setHidden(false)}>{v4("cpShown")}</button>
        <button type="button" className="c4-chip" data-on={hidden ? "1" : "0"} aria-pressed={hidden} onClick={() => setHidden(true)}>{v4("cpHidden")}</button>
      </div>
      {!shown.length && <p className="c4-pay-empty">{v4("cpEmpty")}</p>}
      <ul className="c4-call-list">
        {shown.map((item) => (
          <li key={item.id} className="c4-call-card" data-pinned={item.pinned ? "1" : "0"}>
            <p>{names[item.customerId] || item.customerId}</p>
            <p>{item.body}</p>
            {item.when && <p className="c4-meta">{item.when}</p>}
            <div className="c4-row">
              <Link className="c4-btn" href={crmv4Href(base, `customers/${item.customerId}`)}>{v4("cpOpen")}</Link>
              <button type="button" className="c4-btn" onClick={() => store(toggleNotePin(items, item.id))}>{item.pinned ? v4("cpUnpin") : v4("cpPin")}</button>
              <button type="button" className="c4-btn" onClick={() => store(setNoteHidden(items, item.id, !item.hidden))}>{item.hidden ? v4("cpShow") : v4("cpHide")}</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function asMoney(row: { id?: string | null; amount?: number | null; currency?: string | null; label: string; userId: string }): MoneyRow | null {
  const id = String(row.id || "").trim();
  if (!id) return null;
  const amount = Number(row.amount);
  return {
    id,
    userId: String(row.userId || "").trim(),
    label: row.label,
    amount: Number.isFinite(amount) ? amount : null,
    currency: String(row.currency || ""),
  };
}

export function CurrencyChips({ base, v4, locale }: { base: string; v4: V4; locale: string }) {
  const users = useJson<{ users?: Person[] }>(LISTS.users);
  const deposits = useJson<{ requests?: Cash[] }>(LISTS.deposits);
  const withdrawals = useJson<{ requests?: Cash[] }>(LISTS.withdrawals);
  const [hiddenCodes, setHiddenCodes] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [showHidden, setShowHidden] = useState(false);
  const [query, setQuery] = useState("");
  const balances = (users.data?.users || []).map((person) => asMoney({
    id: person.id,
    amount: person.balance ?? person.account?.balance,
    currency: person.currency || person.account?.currency,
    label: String(person.name || person.email || person.id),
    userId: person.id,
  })).filter((row): row is MoneyRow => Boolean(row));
  const depositRows = (deposits.data?.requests || []).map((row) => asMoney({
    id: row.id,
    amount: row.amount,
    currency: row.currency,
    label: String(row.user?.name || row.user?.email || row.id),
    userId: String(row.user?.id || ""),
  })).filter((row): row is MoneyRow => Boolean(row));
  const withdrawalRows = (withdrawals.data?.requests || []).map((row) => asMoney({
    id: row.id,
    amount: row.amount,
    currency: row.currency,
    label: String(row.user?.name || row.user?.email || row.id),
    userId: String(row.user?.id || ""),
  })).filter((row): row is MoneyRow => Boolean(row));
  const present = currencyCodes([...balances, ...depositRows, ...withdrawalRows]);
  const presentKey = present.join(",");
  const loading = users.loading || deposits.loading || withdrawals.loading;
  const failed = Boolean(users.error || deposits.error || withdrawals.error);
  useEffect(() => {
    if (loading || (users.error && deposits.error && withdrawals.error)) return;
    const next = readHidden(readJson(CHIP_KEY, []), presentKey ? presentKey.split(",") : []);
    setHiddenCodes(next);
    writeJson(CHIP_KEY, next);
  }, [loading, users.error, deposits.error, withdrawals.error, presentKey]);
  const openCodes = visibleCodes(present, hiddenCodes, false);
  const code = activeCode(selected, showHidden ? visibleCodes(present, hiddenCodes, true) : openCodes);
  const chips = visibleCodes(present, hiddenCodes, showHidden);

  function store(next: string[], clear: string) {
    setHiddenCodes(next);
    writeJson(CHIP_KEY, next);
    if (clear && currencyCode(clear) === activeCode(selected, [clear])) setSelected("");
  }

  return (
    <section className="c4-currency-chips" aria-label={v4("ccTitle")} data-currency-chips="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-pay-kicker">{v4("ccSub")}</p>
          <h2 className="c4-title">{v4("ccTitle")}</h2>
        </div>
        <p className="c4-meta">{chips.length}</p>
      </header>
      <p className="c4-meta">{v4("ccHint")}</p>
      <p className="c4-meta">{v4("ccLocal")}</p>
      {loading && !present.length && <p className="c4-meta">{v4("ccLoading")}</p>}
      {failed && <p className="c4-meta">{v4("ccFailed")}</p>}
      {!loading && !present.length && <p className="c4-pay-empty">{v4("ccNone")}</p>}
      <div className="c4-row" role="group" aria-label={v4("ccShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("ccShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("ccHidden")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("ccTitle")}>
        <button type="button" className="c4-chip" data-on={code ? "0" : "1"} aria-pressed={!code} onClick={() => setSelected("")}>{v4("ccAll")}</button>
        {chips.map((item) => (
          <span key={item} className="c4-currency-pair" data-currency={item}>
            <button type="button" className="c4-chip" data-on={code === item ? "1" : "0"} aria-pressed={code === item} onClick={() => setSelected(code === item ? "" : item)}>{item}</button>
            <button type="button" className="c4-btn" onClick={() => store(toggleCode(hiddenCodes, item, present), showHidden ? "" : item)}>{showHidden ? v4("ccShow") : v4("ccHide")}</button>
          </span>
        ))}
      </div>
      <label className="c4-lab">
        <span>{v4("ccSearch")}</span>
        <input className="c4-field" aria-label={v4("ccSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c4-currency-board">
        <MoneyList base={base} v4={v4} locale={locale} title={v4("ccBalances")} rows={balances} code={code} query={query} />
        <MoneyList base={base} v4={v4} locale={locale} title={v4("ccDeposits")} rows={depositRows} code={code} query={query} />
        <MoneyList base={base} v4={v4} locale={locale} title={v4("ccWithdrawals")} rows={withdrawalRows} code={code} query={query} />
      </div>
    </section>
  );
}

function MoneyList({ base, v4, locale, title, rows, code, query }: { base: string; v4: V4; locale: string; title: string; rows: MoneyRow[]; code: string; query: string }) {
  const shown = visibleMoney(rows, code, query);
  const lines = currencyLines(shown);
  const total = code ? singleTotal(shown, code) : null;
  return (
    <section className="c4-currency-card" aria-label={title} data-currency={code || "all"}>
      <header className="c4-row c4-between">
        <h3>{title}</h3>
        <p className="c4-meta">{v4("ccCount")} {shown.length}</p>
      </header>
      {!shown.length && <p className="c4-pay-empty">{code ? v4("ccEmpty") : v4("ccNone")}</p>}
      {total && (
        <p className="c4-currency-total" data-currency={total.currency}>
          {v4("ccTotal")} {moneyText(total.currency, total.amount, locale)}
        </p>
      )}
      {!code && lines.length > 0 && (
        <ul className="c4-currency-lines">
          {lines.map((line) => (
            <li key={line.currency || "none"} data-currency={line.currency || "none"}>
              <span>{line.currency || v4("ccNoCurrency")}</span>
              <span>{line.currency ? moneyText(line.currency, line.amount, locale) : v4("ccNoCurrency")}</span>
              <span className="c4-meta">{line.count}</span>
            </li>
          ))}
        </ul>
      )}
      <ul className="c4-currency-rows">
        {shown.map((row) => {
          const coded = currencyCode(row.currency);
          const figure = coded && row.amount != null
            ? moneyText(coded, row.amount, locale)
            : row.amount != null
              ? `${row.amount.toFixed(2)} ${v4("ccNoCurrency")}`
              : v4("ccNoCurrency");
          return (
            <li key={row.id} data-currency={coded || "none"}>
              <p>{row.label}</p>
              <p className="c4-meta">{figure}</p>
              {row.userId && <Link className="c4-btn" href={crmv4Href(base, `customers/${row.userId}`)}>{v4("cpOpen")}</Link>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
