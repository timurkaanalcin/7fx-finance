"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readJson, writeJson } from "@/lib/crmv3/bridge";
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
} from "@/lib/crmv3/pack";
import { crmv3Href } from "@/lib/crmv3/sections";
import { money, useJson } from "../kit";
import { useV3 } from "./store";

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

const USER_LIST = "/api/admin/users?take=40&meta=0&role=TRADER";
const DEPOSIT_LIST = "/api/admin/deposits?take=40";
const WITHDRAW_LIST = "/api/admin/withdrawals?take=40";

function moneyText(currency: string, amount: number, locale: string): string {
  if (currency.length === 3) return money(amount, currency, locale);
  return "";
}

export function CallPack({ base }: { base: string }) {
  const v3 = useV3();
  const data = useJson<{ users?: Person[] }>(USER_LIST);
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
    <section className="c3-call-pack" aria-label={v3("cpTitle")} data-call-pack="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("cpSub")}</p>
          <h2 className="c3-title">{v3("cpTitle")}</h2>
        </div>
        <p className="c3-muted">{shown.length}</p>
      </header>
      <p className="c3-muted">{v3("cpHint")}</p>
      <p className="c3-muted">{v3("cpLocal")}</p>
      {data.error && <p className="c3-muted">{v3("cpFailed")}</p>}
      {!data.loading && !data.error && !loaded.length && <p className="c3-empty">{v3("cpNone")}</p>}
      <form className="c3-row" onSubmit={(event) => {
        event.preventDefault();
        const next = addNote(items, { id: `cp-${Date.now()}-${customerId}`, customerId, body, when, at: new Date().toISOString() }, loaded.map((person) => person.id));
        if (next.length === items.length) return;
        store(next);
        setBody("");
        setWhen("");
        setCustomerId("");
      }}>
        <label className="c3-lab">
          <span>{v3("cpCustomer")}</span>
          <select className="c3-select" aria-label={v3("cpCustomer")} value={customerId} onChange={(event) => setCustomerId(event.target.value)}>
            <option value="">{v3("cpCustomer")}</option>
            {loaded.map((person) => <option key={person.id} value={person.id}>{person.name || person.email || person.id}</option>)}
          </select>
        </label>
        <label className="c3-lab">
          <span>{v3("cpNote")}</span>
          <input className="c3-field" aria-label={v3("cpNote")} value={body} onChange={(event) => setBody(event.target.value)} />
        </label>
        <label className="c3-lab">
          <span>{v3("cpWhen")}</span>
          <input className="c3-field" aria-label={v3("cpWhen")} value={when} onChange={(event) => setWhen(event.target.value)} />
        </label>
        <button type="submit" className="c3-btn">{v3("cpAdd")}</button>
      </form>
      <p className="c3-muted">{v3("cpBlank")}</p>
      <label className="c3-lab">
        <span>{v3("cpSearch")}</span>
        <input className="c3-field" aria-label={v3("cpSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c3-row" role="group" aria-label={v3("cpShown")}>
        <button type="button" className="c3-chip" data-on={hidden ? "0" : "1"} aria-pressed={!hidden} onClick={() => setHidden(false)}>{v3("cpShown")}</button>
        <button type="button" className="c3-chip" data-on={hidden ? "1" : "0"} aria-pressed={hidden} onClick={() => setHidden(true)}>{v3("cpHidden")}</button>
      </div>
      {!shown.length && <p className="c3-empty">{v3("cpEmpty")}</p>}
      <ul className="c3-call-list">
        {shown.map((item) => (
          <li key={item.id} className="c3-call-card" data-pinned={item.pinned ? "1" : "0"}>
            <p>{names[item.customerId] || item.customerId}</p>
            <p>{item.body}</p>
            {item.when && <p className="c3-muted">{item.when}</p>}
            <div className="c3-row">
              <Link className="c3-btn" href={crmv3Href(base, `customers/${item.customerId}`)}>{v3("cpOpen")}</Link>
              <button type="button" className="c3-btn" onClick={() => store(toggleNotePin(items, item.id))}>{item.pinned ? v3("cpUnpin") : v3("cpPin")}</button>
              <button type="button" className="c3-btn" onClick={() => store(setNoteHidden(items, item.id, !item.hidden))}>{item.hidden ? v3("cpShow") : v3("cpHide")}</button>
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

export function CurrencyChips({ base, locale }: { base: string; locale: string }) {
  const v3 = useV3();
  const users = useJson<{ users?: Person[] }>(USER_LIST);
  const deposits = useJson<{ requests?: Cash[] }>(DEPOSIT_LIST);
  const withdrawals = useJson<{ requests?: Cash[] }>(WITHDRAW_LIST);
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
    <section className="c3-currency-chips" aria-label={v3("ccTitle")} data-currency-chips="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("ccSub")}</p>
          <h2 className="c3-title">{v3("ccTitle")}</h2>
        </div>
        <p className="c3-muted">{chips.length}</p>
      </header>
      <p className="c3-muted">{v3("ccHint")}</p>
      <p className="c3-muted">{v3("ccLocal")}</p>
      {loading && !present.length && <p className="c3-muted">{v3("ccLoading")}</p>}
      {failed && <p className="c3-muted">{v3("ccFailed")}</p>}
      {!loading && !present.length && <p className="c3-empty">{v3("ccNone")}</p>}
      <div className="c3-row" role="group" aria-label={v3("ccShown")}>
        <button type="button" className="c3-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v3("ccShown")}</button>
        <button type="button" className="c3-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v3("ccHidden")}</button>
      </div>
      <div className="c3-row" role="group" aria-label={v3("ccTitle")}>
        <button type="button" className="c3-chip" data-on={code ? "0" : "1"} aria-pressed={!code} onClick={() => setSelected("")}>{v3("ccAll")}</button>
        {chips.map((item) => (
          <span key={item} className="c3-currency-pair" data-currency={item}>
            <button type="button" className="c3-chip" data-on={code === item ? "1" : "0"} aria-pressed={code === item} onClick={() => setSelected(code === item ? "" : item)}>{item}</button>
            <button type="button" className="c3-btn" onClick={() => store(toggleCode(hiddenCodes, item, present), showHidden ? "" : item)}>{showHidden ? v3("ccShow") : v3("ccHide")}</button>
          </span>
        ))}
      </div>
      <label className="c3-lab">
        <span>{v3("ccSearch")}</span>
        <input className="c3-field" aria-label={v3("ccSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c3-currency-board">
        <MoneyList base={base} locale={locale} title={v3("ccBalances")} rows={balances} code={code} query={query} />
        <MoneyList base={base} locale={locale} title={v3("ccDeposits")} rows={depositRows} code={code} query={query} />
        <MoneyList base={base} locale={locale} title={v3("ccWithdrawals")} rows={withdrawalRows} code={code} query={query} />
      </div>
    </section>
  );
}

function MoneyList({ base, locale, title, rows, code, query }: { base: string; locale: string; title: string; rows: MoneyRow[]; code: string; query: string }) {
  const v3 = useV3();
  const shown = visibleMoney(rows, code, query);
  const lines = currencyLines(shown);
  const total = code ? singleTotal(shown, code) : null;
  return (
    <section className="c3-currency-card" aria-label={title} data-currency={code || "all"}>
      <header className="c3-row c3-between">
        <h3>{title}</h3>
        <p className="c3-muted">{v3("ccCount")} {shown.length}</p>
      </header>
      {!shown.length && <p className="c3-empty">{code ? v3("ccEmpty") : v3("ccNone")}</p>}
      {total && (
        <p className="c3-currency-total" data-currency={total.currency}>
          {v3("ccTotal")} {moneyText(total.currency, total.amount, locale)}
        </p>
      )}
      {!code && lines.length > 0 && (
        <ul className="c3-currency-lines">
          {lines.map((line) => (
            <li key={line.currency || "none"} data-currency={line.currency || "none"}>
              <span>{line.currency || v3("ccNoCurrency")}</span>
              <span>{line.currency ? moneyText(line.currency, line.amount, locale) : v3("ccNoCurrency")}</span>
              <span className="c3-muted">{line.count}</span>
            </li>
          ))}
        </ul>
      )}
      <ul className="c3-currency-rows">
        {shown.map((row) => {
          const coded = currencyCode(row.currency);
          const figure = coded && row.amount != null
            ? moneyText(coded, row.amount, locale)
            : row.amount != null
              ? `${row.amount.toFixed(2)} ${v3("ccNoCurrency")}`
              : v3("ccNoCurrency");
          return (
            <li key={row.id} data-currency={coded || "none"}>
              <p>{row.label}</p>
              <p className="c3-muted">{figure}</p>
              {row.userId && <Link className="c3-btn" href={crmv3Href(base, `customers/${row.userId}`)}>{v3("cpOpen")}</Link>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
