"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readJson, writeJson } from "@/lib/crmv3/bridge";
import { useEscape } from "@/lib/crmv3/focus";
import { crmv3Href } from "@/lib/crmv3/sections";
import {
  DISMISS_KEY,
  PREP_KEY,
  addBullet,
  clearCustomer,
  duplicateGroups,
  readBullets,
  readIds,
  toggleBulletPin,
  toggleId,
  visibleBullets,
  type Bullet,
  type Person,
} from "@/lib/crmv3/dupes";
import { useJson, type Tx } from "../kit";
import { useV3 } from "./store";

function amountText(amount: number, locale: string): string {
  return amount.toLocaleString(locale || "en", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function lineText(currency: string, amount: number, locale: string, none: string): string {
  if (currency.length === 3) return `${currency} ${amountText(amount, locale)}`;
  return `${amountText(amount, locale)} ${none}`;
}

export function DupeStrip({ base, locale, tx }: { base: string; locale: string; tx: Tx }) {
  const v3 = useV3();
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [query, setQuery] = useState("");
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [showDismissed, setShowDismissed] = useState(false);
  useEffect(() => { setDismissed(readIds(readJson(DISMISS_KEY, []))); }, []);
  const loaded = data.data?.users || [];
  const groups = duplicateGroups(loaded, query, dismissed, showDismissed);

  function store(next: string[]) {
    setDismissed(next);
    writeJson(DISMISS_KEY, next);
  }

  return (
    <section className="c3-dupe-strip" aria-label={v3("dpTitle")} data-dupe-strip="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("dpSub")}</p>
          <h2 className="c3-title">{v3("dpTitle")}</h2>
        </div>
        <p className="c3-muted">{v3("dpCount")} {groups.length}</p>
      </header>
      <p className="c3-muted">{v3("dpHint")}</p>
      <label className="c3-lab">
        <span>{v3("dpSearch")}</span>
        <input className="c3-field" aria-label={v3("dpSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c3-row" role="group" aria-label={v3("dpAll")}>
        <button type="button" className="c3-chip" data-on={showDismissed ? "0" : "1"} aria-pressed={!showDismissed} onClick={() => setShowDismissed(false)}>{v3("dpAll")}</button>
        <button type="button" className="c3-chip" data-on={showDismissed ? "1" : "0"} aria-pressed={showDismissed} onClick={() => setShowDismissed(true)}>{v3("dpDismissed")}</button>
      </div>
      {data.loading && !loaded.length && <p className="c3-muted">{v3("dpLoading")}</p>}
      {data.error && <p className="c3-muted">{v3("dpFailed")} {tx("failed")}</p>}
      {!data.loading && !data.error && !loaded.length && <p className="c3-empty">{v3("dpNone")}</p>}
      {!data.loading && !data.error && loaded.length > 0 && !groups.length && <p className="c3-empty">{v3("dpEmpty")}</p>}
      <ul className="c3-dupe-list">
        {groups.map((group) => (
          <li key={group.id} className="c3-dupe-card" data-kind={group.kind}>
            <div className="c3-dupe-top">
              <strong>{group.kind === "email" ? v3("dpEmail") : v3("dpPhone")} {group.value}</strong>
              <span className="c3-dupe-count">{group.people.length}</span>
            </div>
            <p className="c3-muted">{v3("dpTotals")}</p>
            <ul className="c3-dupe-lines">
              {group.lines.map((line) => (
                <li key={line.currency || "none"} data-currency={line.currency || "none"}>
                  <span>{lineText(line.currency, line.amount, locale, v3("dpNoCurrency"))}</span>
                  <span className="c3-muted">{line.count}</span>
                </li>
              ))}
            </ul>
            <ul className="c3-dupe-people">
              {group.people.map((person) => (
                <li key={person.id}>
                  <Link className="c3-btn" href={crmv3Href(base, `customers/${person.id}`)}>{v3("dpOpen")} {person.name || person.email || person.id}</Link>
                </li>
              ))}
            </ul>
            <button type="button" className="c3-btn" data-dupe-dismiss="" onClick={() => store(toggleId(dismissed, group.id))}>{showDismissed ? v3("dpShow") : v3("dpDismiss")}</button>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function MeetingPrep({ tx }: { tx: Tx }) {
  const v3 = useV3();
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [query, setQuery] = useState("");
  const [body, setBody] = useState("");
  const [clearing, setClearing] = useState(false);
  useEscape(clearing, () => setClearing(false));
  useEffect(() => { setBullets(readBullets(readJson(PREP_KEY, []))); }, []);
  const loaded = data.data?.users || [];
  const shown = visibleBullets(bullets, customerId, query);

  function store(next: Bullet[]) {
    setBullets(next);
    writeJson(PREP_KEY, next);
  }

  return (
    <section className="c3-prep-pad" aria-label={v3("mpTitle")} data-prep-pad="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("mpSub")}</p>
          <h2 className="c3-title">{v3("mpTitle")}</h2>
        </div>
        <p className="c3-muted">{shown.length}</p>
      </header>
      <p className="c3-muted">{v3("mpHint")}</p>
      <p className="c3-muted">{v3("mpLocal")}</p>
      {data.loading && !loaded.length && <p className="c3-muted">{tx("loading")}</p>}
      {data.error && <p className="c3-muted">{tx("failed")}</p>}
      {!data.loading && !data.error && !loaded.length && <p className="c3-empty">{v3("mpNone")}</p>}
      <label className="c3-lab">
        <span>{v3("mpCustomer")}</span>
        <select className="c3-select" aria-label={v3("mpCustomer")} value={customerId} onChange={(event) => setCustomerId(event.target.value)}>
          <option value="">{v3("mpCustomer")}</option>
          {loaded.map((person) => (
            <option key={person.id} value={person.id}>{person.name || person.email || person.id}</option>
          ))}
        </select>
      </label>
      <label className="c3-lab">
        <span>{v3("mpSearch")}</span>
        <input className="c3-field" aria-label={v3("mpSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c3-row">
        <label className="c3-lab">
          <span>{v3("mpBody")}</span>
          <input className="c3-field" aria-label={v3("mpBody")} value={body} onChange={(event) => setBody(event.target.value)} />
        </label>
        <button type="button" className="c3-btn" onClick={() => {
          const next = addBullet(bullets, { id: `bullet-${Date.now()}`, customerId, body, at: new Date().toISOString() });
          if (next.length === bullets.length) return;
          store(next);
          setBody("");
        }}>{v3("mpAdd")}</button>
      </div>
      <p className="c3-muted">{v3("mpBlank")}</p>
      {customerId && !shown.length && <p className="c3-empty">{v3("mpEmpty")}</p>}
      <ul className="c3-prep-list">
        {shown.map((bullet) => (
          <li key={bullet.id} className="c3-prep-card" data-pinned={bullet.pinned ? "1" : "0"}>
            <p>{bullet.body}</p>
            <button type="button" className="c3-btn" onClick={() => store(toggleBulletPin(bullets, bullet.id))}>{bullet.pinned ? v3("mpUnpin") : v3("mpPin")}</button>
          </li>
        ))}
      </ul>
      {customerId && (
        <button type="button" className="c3-btn" onClick={() => setClearing(true)}>{v3("mpClear")}</button>
      )}
      {clearing && (
        <div className="c3-pay-confirm" role="dialog" aria-modal="true" data-confirm="">
          <p>{v3("mpClearLead")}</p>
          <div className="c3-row">
            <button type="button" className="c3-btn c3-btn-hot" onClick={() => { store(clearCustomer(bullets, customerId)); setClearing(false); }}>{v3("mpClear")}</button>
            <button type="button" className="c3-btn" onClick={() => setClearing(false)}>{v3("mpCancel")}</button>
          </div>
        </div>
      )}
    </section>
  );
}
