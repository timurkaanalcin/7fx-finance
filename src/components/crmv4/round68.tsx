"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
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
} from "@/lib/crmv4/round68";
import { crmv4Href } from "@/lib/crmv4/sections";
import { useEscape } from "./round40";
import { money, useJson, type Tx } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

function moneyText(currency: string, amount: number, locale: string, none: string): string {
  if (currency.length === 3) return money(amount, currency, locale);
  return `${amount.toFixed(2)} ${none}`;
}

export function DupeStrip({ base, v4, locale, tx }: { base: string; v4: V4; locale: string; tx: Tx }) {
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
    <section className="c4-dupe-strip c4-dupe-salon" aria-label={v4("dpTitle")} data-dupe-strip="1" data-desk="salon">
      <header className="c4-pay-head c4-dupe-salon-mast">
        <p className="c4-dupe-salon-seal" data-logo="mono">7FX</p>
        <div>
          <p className="c4-pay-kicker c4-dupe-salon-kicker">{v4("dpSub")}</p>
          <h2 className="c4-title c4-dupe-salon-title">{v4("dpTitle")}</h2>
        </div>
        <p className="c4-meta c4-dupe-salon-count">{v4("dpCount")} {groups.length}</p>
        <ol className="c4-dupe-salon-index" aria-label={v4("dpTitle")}>
          <li data-tone="gold">{v4("dpSalonChampagne")}</li>
          <li data-tone="ink">{v4("dpSalonGraphite")}</li>
          <li data-tone="ivory">{v4("dpSalonIvory")}</li>
        </ol>
      </header>
      <p className="c4-meta c4-dupe-salon-lead">{v4("dpSalonLead")}</p>
      <p className="c4-meta">{v4("dpHint")}</p>
      <label className="c4-lab">
        <span>{v4("dpSearch")}</span>
        <input className="c4-field c4-dupe-salon-search" aria-label={v4("dpSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c4-row" role="group" aria-label={v4("dpAll")}>
        <button type="button" className="c4-chip" data-on={showDismissed ? "0" : "1"} aria-pressed={!showDismissed} onClick={() => setShowDismissed(false)}>{v4("dpAll")}</button>
        <button type="button" className="c4-chip" data-on={showDismissed ? "1" : "0"} aria-pressed={showDismissed} onClick={() => setShowDismissed(true)}>{v4("dpDismissed")}</button>
      </div>
      {data.loading && !loaded.length && <p className="c4-meta">{v4("dpLoading")}</p>}
      {data.error && <p className="c4-meta">{v4("dpFailed")} {tx("failed")}</p>}
      {!data.loading && !data.error && !loaded.length && <p className="c4-pay-empty c4-dupe-salon-empty">{v4("dpNone")}</p>}
      {!data.loading && !data.error && loaded.length > 0 && !groups.length && <p className="c4-pay-empty c4-dupe-salon-empty">{v4("dpEmpty")}</p>}
      <ul className="c4-dupe-list c4-dupe-salon-list">
        {groups.map((group) => (
          <li key={group.id} className="c4-dupe-card c4-dupe-salon-card" data-kind={group.kind}>
            <div className="c4-row c4-between">
              <strong>{group.kind === "email" ? v4("dpEmail") : v4("dpPhone")} {group.value}</strong>
              <span className="c4-dupe-count">{group.people.length}</span>
            </div>
            <ul className="c4-dupe-lines">
              {group.lines.map((line) => (
                <li key={line.currency || "none"} data-currency={line.currency || "none"}>
                  <span>{moneyText(line.currency, line.amount, locale, v4("dpNoCurrency"))}</span>
                  <span className="c4-meta">{line.count}</span>
                </li>
              ))}
            </ul>
            <ul className="c4-dupe-people">
              {group.people.map((person) => (
                <li key={person.id}>
                  <Link className="c4-btn" href={crmv4Href(base, `customers/${person.id}`)}>{v4("dpOpen")} {person.name || person.email || person.id}</Link>
                </li>
              ))}
            </ul>
            <button type="button" className="c4-btn" data-dupe-dismiss="" onClick={() => store(toggleId(dismissed, group.id))}>{showDismissed ? v4("dpShow") : v4("dpDismiss")}</button>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function MeetingPrep({ v4, tx }: { v4: V4; tx: Tx }) {
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
    <section className="c4-prep-pad" aria-label={v4("mpTitle")} data-prep-pad="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-pay-kicker">{v4("mpSub")}</p>
          <h2 className="c4-title">{v4("mpTitle")}</h2>
        </div>
        <p className="c4-meta">{shown.length}</p>
      </header>
      <p className="c4-meta">{v4("mpHint")}</p>
      <p className="c4-meta">{v4("mpLocal")}</p>
      {data.loading && !loaded.length && <p className="c4-meta">{tx("loading")}</p>}
      {data.error && <p className="c4-meta">{tx("failed")}</p>}
      {!data.loading && !data.error && !loaded.length && <p className="c4-pay-empty">{v4("mpNone")}</p>}
      <label className="c4-lab">
        <span>{v4("mpCustomer")}</span>
        <select className="c4-select" aria-label={v4("mpCustomer")} value={customerId} onChange={(event) => setCustomerId(event.target.value)}>
          <option value="">{v4("mpCustomer")}</option>
          {loaded.map((person) => (
            <option key={person.id} value={person.id}>{person.name || person.email || person.id}</option>
          ))}
        </select>
      </label>
      <label className="c4-lab">
        <span>{v4("mpSearch")}</span>
        <input className="c4-field" aria-label={v4("mpSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <form className="c4-row" onSubmit={(event) => {
        event.preventDefault();
        const next = addBullet(bullets, { id: `bullet-${Date.now()}`, customerId, body, at: new Date().toISOString() });
        if (next.length === bullets.length) return;
        store(next);
        setBody("");
      }}>
        <label className="c4-lab">
          <span>{v4("mpBody")}</span>
          <input className="c4-field" aria-label={v4("mpBody")} value={body} onChange={(event) => setBody(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn">{v4("mpAdd")}</button>
      </form>
      <p className="c4-meta">{v4("mpBlank")}</p>
      {customerId && !shown.length && <p className="c4-pay-empty">{v4("mpEmpty")}</p>}
      <ul className="c4-prep-list">
        {shown.map((bullet) => (
          <li key={bullet.id} className="c4-prep-card" data-pinned={bullet.pinned ? "1" : "0"}>
            <p>{bullet.body}</p>
            <button type="button" className="c4-btn" onClick={() => store(toggleBulletPin(bullets, bullet.id))}>{bullet.pinned ? v4("mpUnpin") : v4("mpPin")}</button>
          </li>
        ))}
      </ul>
      {customerId && (
        <button type="button" className="c4-btn" onClick={() => setClearing(true)}>{v4("mpClear")}</button>
      )}
      {clearing && (
        <div className="c4-pay-confirm" role="dialog" aria-modal="true" data-confirm="">
          <p>{v4("mpClearLead")}</p>
          <div className="c4-row">
            <button type="button" className="c4-btn c4-btn-hot" onClick={() => { store(clearCustomer(bullets, customerId)); setClearing(false); }}>{v4("mpClear")}</button>
            <button type="button" className="c4-btn" onClick={() => setClearing(false)}>{v4("mpCancel")}</button>
          </div>
        </div>
      )}
    </section>
  );
}
