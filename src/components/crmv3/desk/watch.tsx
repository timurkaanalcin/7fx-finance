"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readJson, writeJson } from "@/lib/crmv3/bridge";
import type { CrmV3CopyKey } from "@/lib/crmv3/copy";
import {
  MAIL_DENSITIES,
  MAIL_KEY,
  RISK_KEY,
  addWatch,
  readDensity,
  readWatch,
  setWatchHidden,
  toggleWatchPin,
  visibleWatch,
  type MailDensity,
  type Watch,
} from "@/lib/crmv3/risklist";
import { crmv3Href } from "@/lib/crmv3/sections";
import { useJson } from "../kit";
import { useV3 } from "./store";

type Person = { id: string; name?: string | null; email?: string | null };

const DENSITY_LABEL: Record<MailDensity, CrmV3CopyKey> = {
  compact: "mdCompact",
  desk: "mdDesk",
  roomy: "mdRoomy",
};

export function RiskWatch({ base }: { base: string }) {
  const v3 = useV3();
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
    const next = readWatch(readJson(RISK_KEY, []), known);
    setItems(next);
    if (known.length) writeJson(RISK_KEY, next);
  }, [data.loading, data.error, data.data]);
  const shown = visibleWatch(items, query, hidden);

  function store(next: Watch[]) {
    setItems(next);
    writeJson(RISK_KEY, next);
  }

  return (
    <section className="c3-risk-watch" aria-label={v3("rwTitle")} data-risk-watch="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("rwSub")}</p>
          <h2 className="c3-title">{v3("rwTitle")}</h2>
        </div>
        <p className="c3-muted">{shown.length}</p>
      </header>
      <p className="c3-muted">{v3("rwHint")}</p>
      <p className="c3-muted">{v3("rwLocal")}</p>
      {!data.loading && !data.error && !loaded.length && <p className="c3-empty">{v3("rwNone")}</p>}
      <form className="c3-row" onSubmit={(event) => {
        event.preventDefault();
        const next = addWatch(items, { id: customerId, reason, at: new Date().toISOString() }, loaded.map((person) => person.id));
        if (next.length === items.length) return;
        store(next);
        setReason("");
        setCustomerId("");
      }}>
        <label className="c3-lab">
          <span>{v3("rwCustomer")}</span>
          <select className="c3-select" aria-label={v3("rwCustomer")} value={customerId} onChange={(event) => setCustomerId(event.target.value)}>
            <option value="">{v3("rwCustomer")}</option>
            {loaded.map((person) => <option key={person.id} value={person.id}>{person.name || person.email || person.id}</option>)}
          </select>
        </label>
        <label className="c3-lab">
          <span>{v3("rwReason")}</span>
          <input className="c3-field" aria-label={v3("rwReason")} value={reason} onChange={(event) => setReason(event.target.value)} />
        </label>
        <button type="submit" className="c3-btn">{v3("rwAdd")}</button>
      </form>
      <p className="c3-muted">{v3("rwBlank")}</p>
      <label className="c3-lab">
        <span>{v3("rwSearch")}</span>
        <input className="c3-field" aria-label={v3("rwSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c3-row" role="group" aria-label={v3("rwShown")}>
        <button type="button" className="c3-chip" data-on={hidden ? "0" : "1"} aria-pressed={!hidden} onClick={() => setHidden(false)}>{v3("rwShown")}</button>
        <button type="button" className="c3-chip" data-on={hidden ? "1" : "0"} aria-pressed={hidden} onClick={() => setHidden(true)}>{v3("rwHidden")}</button>
      </div>
      {!shown.length && <p className="c3-empty">{v3("rwEmpty")}</p>}
      <ul className="c3-risk-list">
        {shown.map((item) => (
          <li key={item.id} className="c3-risk-card" data-pinned={item.pinned ? "1" : "0"}>
            <p>{names[item.id] || item.id}</p>
            {item.reason && <p className="c3-muted">{item.reason}</p>}
            <div className="c3-row">
              <Link className="c3-btn" href={crmv3Href(base, `customers/${item.id}`)}>{v3("rwOpen")}</Link>
              <button type="button" className="c3-btn" onClick={() => store(toggleWatchPin(items, item.id))}>{item.pinned ? v3("rwUnpin") : v3("rwPin")}</button>
              <button type="button" className="c3-btn" onClick={() => store(setWatchHidden(items, item.id, !item.hidden))}>{item.hidden ? v3("rwShow") : v3("rwHide")}</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function MailDensityStrip() {
  const v3 = useV3();
  const [density, setDensity] = useState<MailDensity>("desk");
  useEffect(() => { setDensity(readDensity(readJson(MAIL_KEY, "desk"))); }, []);

  function choose(next: MailDensity) {
    setDensity(next);
    writeJson(MAIL_KEY, next);
    window.dispatchEvent(new CustomEvent("crmv3:mail", { detail: next }));
  }

  return (
    <section className="c3-mail-density" aria-label={v3("mdTitle")} data-mail-density="1" data-mail={density}>
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("mdSub")}</p>
          <h2 className="c3-title">{v3("mdTitle")}</h2>
        </div>
      </header>
      <p className="c3-muted">{v3("mdHint")}</p>
      <p className="c3-muted">{v3("mdLocal")}</p>
      <p className="c3-muted">{v3("mdPad")}</p>
      <div className="c3-row" role="group" aria-label={v3("mdTitle")}>
        {MAIL_DENSITIES.map((item) => (
          <button key={item} type="button" className="c3-chip" data-mail={item} data-on={density === item ? "1" : "0"} aria-pressed={density === item} onClick={() => choose(item)}>
            {v3(DENSITY_LABEL[item])}
          </button>
        ))}
      </div>
      <p className="c3-muted">{v3("mdPreview")}</p>
      <ul className="c3-mail-preview" data-mail-preview="">
        <li>{v3("mdSample")}</li>
        <li>{v3("mdSample")}</li>
      </ul>
    </section>
  );
}
