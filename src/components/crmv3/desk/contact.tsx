"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readJson, writeJson } from "@/lib/crmv3/bridge";
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
} from "@/lib/crmv3/contact";
import { crmv3Href } from "@/lib/crmv3/sections";
import { useJson } from "../kit";
import { useV3 } from "./store";

const PEOPLE = "/api/admin/users?take=40&meta=0&role=TRADER";

type Person = {
  id: string;
  name?: string | null;
  email?: string | null;
  balance?: number | null;
  currency?: string | null;
  account?: { balance?: number | null; currency?: string | null } | null;
};

type GlanceRow = BalanceRow & { id: string };

const KIND_LABEL: Record<Kind, "bzZero" | "bzNonzero"> = { zero: "bzZero", nonzero: "bzNonzero" };

export function ContactChips() {
  const v3 = useV3();
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
    <section className="c3-contact-chips" aria-label={v3("ctTitle")} data-contact-chips="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("ctSub")}</p>
          <h2 className="c3-title">{v3("ctTitle")}</h2>
        </div>
        <p className="c3-muted">{shown.length}</p>
      </header>
      <p className="c3-muted">{v3("ctHint")}</p>
      <p className="c3-muted">{v3("ctLocal")}</p>
      <form className="c3-row" onSubmit={(event) => {
        event.preventDefault();
        const next = addContact(contacts, { id: `ct-${Date.now()}`, label, at: new Date().toISOString() });
        if (next.length === contacts.length) return;
        store(next);
        setLabel("");
      }}>
        <label className="c3-lab">
          <span>{v3("ctLabel")}</span>
          <input className="c3-field" aria-label={v3("ctLabel")} value={label} maxLength={40} onChange={(event) => setLabel(event.target.value)} />
        </label>
        <button type="submit" className="c3-btn">{v3("ctAdd")}</button>
      </form>
      <p className="c3-muted">{v3("ctBlank")}</p>
      <label className="c3-lab">
        <span>{v3("ctSearch")}</span>
        <input className="c3-field" aria-label={v3("ctSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c3-row" role="group" aria-label={v3("ctShown")}>
        <button type="button" className="c3-chip" data-on={hidden ? "0" : "1"} aria-pressed={!hidden} onClick={() => setHidden(false)}>{v3("ctShown")}</button>
        <button type="button" className="c3-chip" data-on={hidden ? "1" : "0"} aria-pressed={hidden} onClick={() => setHidden(true)}>{v3("ctHidden")}</button>
      </div>
      {!shown.length && <p className="c3-empty">{v3("ctEmpty")}</p>}
      <ul className="c3-contact-list">
        {shown.map((contact) => (
          <li key={contact.id} className="c3-contact-card" data-pinned={contact.pinned ? "1" : "0"}>
            <p>{contact.label}</p>
            <div className="c3-row">
              <button type="button" className="c3-btn" onClick={() => store(toggleContactPin(contacts, contact.id))}>{contact.pinned ? v3("ctUnpin") : v3("ctPin")}</button>
              <button type="button" className="c3-btn" onClick={() => store(setContactHidden(contacts, contact.id, !contact.hidden))}>{contact.hidden ? v3("ctShow") : v3("ctHide")}</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ZeroGlance({ base }: { base: string }) {
  const v3 = useV3();
  const data = useJson<{ users?: Person[] }>(PEOPLE);
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
    <section className="c3-zero-glance" aria-label={v3("bzTitle")} data-zero-glance="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("bzSub")}</p>
          <h2 className="c3-title">{v3("bzTitle")}</h2>
        </div>
        <p className="c3-muted">{chips.length}</p>
      </header>
      <p className="c3-muted">{v3("bzHint")}</p>
      <p className="c3-muted">{v3("bzLocal")}</p>
      <p className="c3-row">
        <Link className="c3-btn" href={crmv3Href(base, "curchips")}>{v3("bzBoard")}</Link>
      </p>
      {data.loading && !rows.length && <p className="c3-muted">{v3("bzLoading")}</p>}
      {data.error && <p className="c3-muted">{v3("bzFailed")}</p>}
      {!data.loading && !data.error && !rows.length && <p className="c3-empty">{v3("bzNone")}</p>}
      {missingCount > 0 && (
        <button type="button" className="c3-zero-blank" data-on={missing ? "1" : "0"} aria-pressed={missing} onClick={() => { setMissing((value) => !value); setSelected(""); }}>
          <span>{v3("bzMissing")}</span>
          <span className="c3-muted">{missingCount}</span>
        </button>
      )}
      <div className="c3-row" role="group" aria-label={v3("bzShown")}>
        <button type="button" className="c3-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v3("bzShown")}</button>
        <button type="button" className="c3-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v3("bzHidden")}</button>
      </div>
      <div className="c3-row" role="group" aria-label={v3("bzTitle")}>
        <button type="button" className="c3-chip" data-on={!kind && !missing ? "1" : "0"} aria-pressed={!kind && !missing} onClick={() => { setSelected(""); setMissing(false); }}>{v3("bzAll")}</button>
        {chips.map((item) => (
          <span key={item} className="c3-zero-pair" data-kind={item}>
            <button type="button" className="c3-chip" data-on={kind === item ? "1" : "0"} aria-pressed={kind === item} onClick={() => { setMissing(false); setSelected(kind === item ? "" : item); }}>{v3(KIND_LABEL[item])}</button>
            <button type="button" className="c3-btn" onClick={() => store(toggleKind(hiddenKinds, item, present), showHidden ? "" : item)}>{showHidden ? v3("bzShow") : v3("bzHide")}</button>
          </span>
        ))}
      </div>
      <label className="c3-lab">
        <span>{v3("bzSearch")}</span>
        <input className="c3-field" aria-label={v3("bzSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c3-empty">{v3("bzEmpty")}</p>}
      <ul className="c3-zero-rows">
        {shown.map((row) => {
          const got = amountKind(loadedAmount(row));
          const currency = loadedCurrency(row);
          return (
            <li key={row.id} data-kind={got || "missing"}>
              <p>{row.label || row.id}</p>
              <p className="c3-muted">{got ? v3(KIND_LABEL[got]) : v3("bzMissing")}{currency ? ` · ${currency}` : ""}</p>
              <Link className="c3-btn" href={crmv3Href(base, `customers/${row.id}`)}>{v3("bzCustomer")}</Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
