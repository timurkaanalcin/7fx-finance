"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import {
  CONTACT_KEY,
  ZERO_KEY,
  activeKind,
  addContact,
  amountKind,
  kindLines,
  loadedAmount,
  loadedCurrency,
  namedKinds,
  readContacts,
  readHiddenKinds,
  setContactHidden,
  toggleContactPin,
  toggleKind,
  visibleBalances,
  visibleContacts,
  visibleKinds,
  type BalanceRow,
  type Contact,
  type Kind,
} from "@/lib/crmv4/round91";
import { crmv4Href } from "@/lib/crmv4/sections";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  email?: string | null;
  balance?: number | null;
  currency?: string | null;
  account?: { balance?: number | null; currency?: string | null } | null;
};

type GlanceRow = BalanceRow & { id: string };

const KIND_LABEL: Record<Kind, CrmV4CopyKey> = { zero: "bzZero", nonzero: "bzNonzero" };

export function ContactChips({ v4 }: { v4: V4 }) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [label, setLabel] = useState("");
  const [query, setQuery] = useState("");
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const next = readContacts(readJson(CONTACT_KEY, []));
    setContacts(next);
    writeJson(CONTACT_KEY, next);
  }, []);
  const shown = visibleContacts(contacts, query, hidden);

  function store(next: Contact[]) {
    setContacts(next);
    writeJson(CONTACT_KEY, next);
  }

  return (
    <section className="c4-contact-chips" aria-label={v4("ctTitle")} data-contact-chips="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-pay-kicker">{v4("ctSub")}</p>
          <h2 className="c4-title">{v4("ctTitle")}</h2>
        </div>
        <p className="c4-meta">{shown.length}</p>
      </header>
      <p className="c4-meta">{v4("ctHint")}</p>
      <p className="c4-meta">{v4("ctLocal")}</p>
      <form className="c4-row" onSubmit={(event) => {
        event.preventDefault();
        const next = addContact(contacts, { id: `ct-${Date.now()}`, label, at: new Date().toISOString() });
        if (next.length === contacts.length) return;
        store(next);
        setLabel("");
      }}>
        <label className="c4-lab">
          <span>{v4("ctLabel")}</span>
          <input className="c4-field" aria-label={v4("ctLabel")} value={label} maxLength={40} onChange={(event) => setLabel(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn">{v4("ctAdd")}</button>
      </form>
      <p className="c4-meta">{v4("ctBlank")}</p>
      <label className="c4-lab">
        <span>{v4("ctSearch")}</span>
        <input className="c4-field" aria-label={v4("ctSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c4-row" role="group" aria-label={v4("ctShown")}>
        <button type="button" className="c4-chip" data-on={hidden ? "0" : "1"} aria-pressed={!hidden} onClick={() => setHidden(false)}>{v4("ctShown")}</button>
        <button type="button" className="c4-chip" data-on={hidden ? "1" : "0"} aria-pressed={hidden} onClick={() => setHidden(true)}>{v4("ctHidden")}</button>
      </div>
      {!shown.length && <p className="c4-pay-empty">{v4("ctEmpty")}</p>}
      <ul className="c4-contact-list">
        {shown.map((contact) => (
          <li key={contact.id} className="c4-contact-card" data-pinned={contact.pinned ? "1" : "0"}>
            <p>{contact.label}</p>
            <div className="c4-row">
              <button type="button" className="c4-btn" onClick={() => store(toggleContactPin(contacts, contact.id))}>{contact.pinned ? v4("ctUnpin") : v4("ctPin")}</button>
              <button type="button" className="c4-btn" onClick={() => store(setContactHidden(contacts, contact.id, !contact.hidden))}>{contact.hidden ? v4("ctShow") : v4("ctHide")}</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ZeroGlance({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [hiddenKinds, setHiddenKinds] = useState<Kind[]>([]);
  const [selected, setSelected] = useState("");
  const [missing, setMissing] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [query, setQuery] = useState("");
  const rows = (data.data?.users || []).map((row): GlanceRow | null => {
    const id = String(row.id || "").trim();
    if (!id) return null;
    return {
      id,
      balance: row.balance,
      account: row.account,
      currency: row.currency || row.account?.currency || "",
      label: String(row.name || row.email || ""),
    };
  }).filter((row): row is GlanceRow => Boolean(row));
  const lines = kindLines(rows);
  const present = namedKinds(rows);
  const presentKey = present.join("\n");
  const missingCount = lines.find((line) => !line.kind)?.count || 0;
  useEffect(() => {
    if (data.loading || data.error) return;
    const next = readHiddenKinds(readJson(ZERO_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHiddenKinds(next);
    writeJson(ZERO_KEY, next);
  }, [data.loading, data.error, presentKey]);
  const chips = visibleKinds(present, hiddenKinds, showHidden);
  const kind = activeKind(selected, chips);
  const shown = visibleBalances(rows, kind, missing, query);

  function store(next: Kind[], clear: string) {
    setHiddenKinds(next);
    writeJson(ZERO_KEY, next);
    if (clear && activeKind(selected, [clear])) setSelected("");
  }

  return (
    <section className="c4-zero-glance" aria-label={v4("bzTitle")} data-zero-glance="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-pay-kicker">{v4("bzSub")}</p>
          <h2 className="c4-title">{v4("bzTitle")}</h2>
        </div>
        <p className="c4-meta">{chips.length}</p>
      </header>
      <p className="c4-meta">{v4("bzHint")}</p>
      <p className="c4-meta">{v4("bzLocal")}</p>
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "curchips")}>{v4("bzBoard")}</Link>
      </p>
      {data.loading && !rows.length && <p className="c4-meta">{v4("bzLoading")}</p>}
      {data.error && <p className="c4-meta">{v4("bzFailed")}</p>}
      {!data.loading && !data.error && !rows.length && <p className="c4-pay-empty">{v4("bzNone")}</p>}
      {missingCount > 0 && (
        <button type="button" className="c4-zero-blank" data-on={missing ? "1" : "0"} aria-pressed={missing} onClick={() => { setMissing((value) => !value); setSelected(""); }}>
          <span>{v4("bzMissing")}</span>
          <span className="c4-meta">{missingCount}</span>
        </button>
      )}
      <div className="c4-row" role="group" aria-label={v4("bzShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("bzShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("bzHidden")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("bzTitle")}>
        <button type="button" className="c4-chip" data-on={!kind && !missing ? "1" : "0"} aria-pressed={!kind && !missing} onClick={() => { setSelected(""); setMissing(false); }}>{v4("bzAll")}</button>
        {chips.map((item) => (
          <span key={item} className="c4-zero-pair" data-kind={item}>
            <button type="button" className="c4-chip" data-on={kind === item ? "1" : "0"} aria-pressed={kind === item} onClick={() => { setMissing(false); setSelected(kind === item ? "" : item); }}>{v4(KIND_LABEL[item])}</button>
            <button type="button" className="c4-btn" onClick={() => store(toggleKind(hiddenKinds, item, present), showHidden ? "" : item)}>{showHidden ? v4("bzShow") : v4("bzHide")}</button>
          </span>
        ))}
      </div>
      <label className="c4-lab">
        <span>{v4("bzSearch")}</span>
        <input className="c4-field" aria-label={v4("bzSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c4-pay-empty">{v4("bzEmpty")}</p>}
      <ul className="c4-zero-rows">
        {shown.map((row) => {
          const got = amountKind(loadedAmount(row));
          const currency = loadedCurrency(row);
          return (
            <li key={row.id} data-kind={got || "missing"}>
              <p>{row.label || row.id}</p>
              <p className="c4-meta">{got ? v4(KIND_LABEL[got]) : v4("bzMissing")}{currency ? ` · ${currency}` : ""}</p>
              <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{v4("bzCustomer")}</Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
