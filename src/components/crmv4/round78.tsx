"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import {
  MAIL_DENSITIES,
  MAIL_KEY,
  WATCH_KEY,
  addWatch,
  readDensity,
  readWatch,
  setWatchHidden,
  toggleWatchPin,
  visibleWatch,
  type MailDensity,
  type Watch,
} from "@/lib/crmv4/round78";
import { crmv4Href } from "@/lib/crmv4/sections";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = { id: string; name?: string | null; email?: string | null };

const DENSITY_LABEL: Record<MailDensity, CrmV4CopyKey> = {
  compact: "mdCompact",
  desk: "mdDesk",
  roomy: "mdRoomy",
};

export function RiskWatch({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [items, setItems] = useState<Watch[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [reason, setReason] = useState("");
  const [query, setQuery] = useState("");
  const [hidden, setHidden] = useState(false);
  const loaded = data.data?.users || [];
  const names: Record<string, string> = {};
  for (const person of loaded) names[person.id] = String(person.name || person.email || person.id);
  useEffect(() => {
    if (data.loading || data.error) return;
    const known = (data.data?.users || []).map((person) => person.id);
    const next = readWatch(readJson(WATCH_KEY, []), known);
    setItems(next);
    if (known.length) writeJson(WATCH_KEY, next);
  }, [data.loading, data.error, data.data]);
  const shown = visibleWatch(items, query, hidden);

  function store(next: Watch[]) {
    setItems(next);
    writeJson(WATCH_KEY, next);
  }

  return (
    <section className="c4-risk-watch c4-slate-watch" aria-label={v4("rwTitle")} data-risk-watch="1" data-desk="slate">
      <header className="c4-slate-watch-mast">
        <p className="c4-slate-watch-seal" data-logo="mono">7FX</p>
        <div>
          <p className="c4-slate-watch-kicker">{v4("rwSlateKicker")}</p>
          <h2 className="c4-title c4-slate-watch-title">{v4("rwTitle")}</h2>
          <p className="c4-slate-watch-lead">{v4("rwSlateLead")}</p>
        </div>
        <p className="c4-slate-watch-count">{shown.length}</p>
      </header>
      <ol className="c4-slate-watch-index" aria-label={v4("rwTitle")}>
        <li data-tone="gold">{v4("rwPin")}</li>
        <li data-tone="ink">{v4("rwHidden")}</li>
        <li data-tone="ivory">{v4("rwShown")}</li>
      </ol>
      <p className="c4-meta">{v4("rwHint")}</p>
      <p className="c4-meta">{v4("rwLocal")}</p>
      {!data.loading && !data.error && !loaded.length && <p className="c4-pay-empty">{v4("rwNone")}</p>}
      <form className="c4-row" onSubmit={(event) => {
        event.preventDefault();
        const next = addWatch(items, { id: customerId, reason, at: new Date().toISOString() }, loaded.map((person) => person.id));
        if (next.length === items.length) return;
        store(next);
        setReason("");
        setCustomerId("");
      }}>
        <label className="c4-lab">
          <span>{v4("rwCustomer")}</span>
          <select className="c4-select" aria-label={v4("rwCustomer")} value={customerId} onChange={(event) => setCustomerId(event.target.value)}>
            <option value="">{v4("rwCustomer")}</option>
            {loaded.map((person) => <option key={person.id} value={person.id}>{person.name || person.email || person.id}</option>)}
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("rwReason")}</span>
          <input className="c4-field" aria-label={v4("rwReason")} aria-required={false} value={reason} onChange={(event) => setReason(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn">{v4("rwAdd")}</button>
      </form>
      <p className="c4-meta">{v4("rwBlank")}</p>
      <label className="c4-lab">
        <span>{v4("rwSearch")}</span>
        <input className="c4-field" aria-label={v4("rwSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c4-row" role="group" aria-label={v4("rwShown")}>
        <button type="button" className="c4-chip" data-on={hidden ? "0" : "1"} aria-pressed={!hidden} onClick={() => setHidden(false)}>{v4("rwShown")}</button>
        <button type="button" className="c4-chip" data-on={hidden ? "1" : "0"} aria-pressed={hidden} onClick={() => setHidden(true)}>{v4("rwHidden")}</button>
      </div>
      {!shown.length && <p className="c4-pay-empty">{v4("rwEmpty")}</p>}
      <ul className="c4-risk-list c4-slate-watch-list">
        {shown.map((item) => (
          <li key={item.id} className="c4-risk-card c4-slate-watch-card" data-pinned={item.pinned ? "1" : "0"}>
            <span className="c4-slate-watch-diamond" aria-hidden="true" />
            <p>{names[item.id] || item.id}</p>
            {item.reason && <p className="c4-meta">{item.reason}</p>}
            <div className="c4-row">
              <Link className="c4-btn" href={crmv4Href(base, `customers/${item.id}`)}>{v4("rwOpen")}</Link>
              <button type="button" className="c4-btn" onClick={() => store(toggleWatchPin(items, item.id))}>{item.pinned ? v4("rwUnpin") : v4("rwPin")}</button>
              <button type="button" className="c4-btn" onClick={() => store(setWatchHidden(items, item.id, !item.hidden))}>{item.hidden ? v4("rwShow") : v4("rwHide")}</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function MailDensityStrip({ v4 }: { v4: V4 }) {
  const [density, setDensity] = useState<MailDensity>("desk");
  useEffect(() => { setDensity(readDensity(readJson(MAIL_KEY, "desk"))); }, []);

  function choose(next: MailDensity) {
    setDensity(next);
    writeJson(MAIL_KEY, next);
    window.dispatchEvent(new CustomEvent("crmv4:mail", { detail: next }));
  }

  return (
    <section className="c4-mail-density c4-vellum-gauge" aria-label={v4("mdTitle")} data-mail-density="1" data-desk="vellum" data-mail={density}>
      <header className="c4-vellum-gauge-mast">
        <p className="c4-vellum-gauge-seal" data-logo="mono">7FX</p>
        <div>
          <p className="c4-vellum-gauge-kicker">{v4("mdVellumKicker")}</p>
          <h2 className="c4-title c4-vellum-gauge-title">{v4("mdTitle")}</h2>
          <p className="c4-vellum-gauge-lead">{v4("mdVellumLead")}</p>
        </div>
        <p className="c4-vellum-gauge-count" data-mail={density}>{v4(DENSITY_LABEL[density])}</p>
      </header>
      <ol className="c4-vellum-gauge-index" aria-label={v4("mdTitle")}>
        <li data-tone="gold">{v4("mdRoomy")}</li>
        <li data-tone="ink">{v4("mdDesk")}</li>
        <li data-tone="ivory">{v4("mdCompact")}</li>
      </ol>
      <p className="c4-meta">{v4("mdHint")}</p>
      <p className="c4-meta">{v4("mdLocal")}</p>
      <p className="c4-meta">{v4("mdPad")}</p>
      <div className="c4-row c4-vellum-gauge-rail" role="group" aria-label={v4("mdTitle")}>
        {MAIL_DENSITIES.map((item) => (
          <button key={item} type="button" className="c4-chip c4-vellum-gauge-chip" data-mail={item} data-on={density === item ? "1" : "0"} aria-pressed={density === item} onClick={() => choose(item)}>
            <span className="c4-vellum-gauge-tick" data-mail={item} aria-hidden="true" />
            {v4(DENSITY_LABEL[item])}
          </button>
        ))}
      </div>
      <p className="c4-meta">{v4("mdPreview")}</p>
      <ul className="c4-mail-preview c4-vellum-gauge-preview" data-mail-preview="" data-mail={density}>
        <li>{v4("mdSample")}</li>
        <li>{v4("mdSample")}</li>
      </ul>
    </section>
  );
}
