"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readJson, writeJson } from "@/lib/crmv3/bridge";
import type { DigestItem } from "@/lib/crmv3/digest";
import { useEscape } from "@/lib/crmv3/focus";
import { crmv3Href } from "@/lib/crmv3/sections";
import {
  PACKET_KEY,
  PIN_KEY,
  RULE_KEY,
  VIP_FIELDS,
  canExport,
  chosenItems,
  currencyLines,
  loadedCurrencies,
  openItems,
  packetCsv,
  packetSources,
  readIds,
  readPacket,
  readRule,
  toggleId,
  togglePacketId,
  visibleItems,
  watchPeople,
  withNote,
  type Packet,
  type Person,
  type VipField,
  type VipRule,
} from "@/lib/crmv3/vip";
import type { CrmV3CopyKey } from "@/lib/crmv3/copy";
import { useJson, type Tx } from "../kit";
import { useV3 } from "./store";

const FIELD_KEY: Record<VipField, CrmV3CopyKey> = {
  balance: "vwBalance",
  lastLogin: "vwLogin",
  lastContact: "vwContact",
};

function amountText(amount: number, locale: string): string {
  return amount.toLocaleString(locale || "en", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function lineText(currency: string, amount: number, locale: string, none: string): string {
  if (currency.length === 3) return `${currency} ${amountText(amount, locale)}`;
  return `${amountText(amount, locale)} ${none}`;
}

function saveFile(name: string, body: string) {
  const blob = new Blob([body], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

export function VipWatch({ base, locale, tx }: { base: string; locale: string; tx: Tx }) {
  const v3 = useV3();
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [rule, setRule] = useState<VipRule>({ field: "balance", amount: 0, currency: "" });
  const [query, setQuery] = useState("");
  const [pinned, setPinned] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setRule(readRule(readJson(RULE_KEY, null)));
    setPinned(readIds(readJson(PIN_KEY, [])));
    setReady(true);
  }, []);
  const loaded = data.data?.users || [];
  const shown = watchPeople(loaded, rule, query, pinned);
  const lines = currencyLines(shown);
  const currencies = loadedCurrencies(loaded);

  function storeRule(next: VipRule) {
    const saved = readRule(next);
    setRule(saved);
    writeJson(RULE_KEY, saved);
  }

  function storePins(next: string[]) {
    setPinned(next);
    writeJson(PIN_KEY, next);
  }

  return (
    <section className="c3-vip-strip" aria-label={v3("vwTitle")} data-vip-strip="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("vwSub")}</p>
          <h2 className="c3-title">{v3("vwTitle")}</h2>
        </div>
        <p className="c3-muted">{v3("vwCount")} {shown.length}</p>
      </header>
      <p className="c3-muted">{v3("vwHint")}</p>
      <div className="c3-row" role="group" aria-label={v3("vwField")}>
        {VIP_FIELDS.map((field) => (
          <button key={field} type="button" className="c3-chip" data-on={rule.field === field ? "1" : "0"} aria-pressed={rule.field === field} onClick={() => storeRule({ ...rule, field })}>
            {v3(FIELD_KEY[field])}
          </button>
        ))}
      </div>
      <div className="c3-row">
        <label className="c3-lab">
          <span>{rule.field === "balance" ? v3("vwAmount") : v3("vwDays")}</span>
          <input
            className="c3-field"
            type="number"
            min={0}
            aria-label={rule.field === "balance" ? v3("vwAmount") : v3("vwDays")}
            value={ready ? String(rule.amount) : ""}
            onChange={(event) => storeRule({ ...rule, amount: Number(event.target.value) })}
          />
        </label>
        {rule.field === "balance" && (
          <label className="c3-lab">
            <span>{v3("vwCurrency")}</span>
            <select className="c3-select" aria-label={v3("vwCurrency")} value={rule.currency} onChange={(event) => storeRule({ ...rule, currency: event.target.value })}>
              <option value="">{v3("vwCurrency")}</option>
              {currencies.map((currency) => <option key={currency} value={currency}>{currency}</option>)}
              {rule.currency && !currencies.includes(rule.currency) && <option value={rule.currency}>{rule.currency}</option>}
            </select>
          </label>
        )}
      </div>
      {rule.field === "balance" && !rule.currency && <p className="c3-muted">{v3("vwPickCurrency")}</p>}
      <label className="c3-lab">
        <span>{v3("vwSearch")}</span>
        <input className="c3-field" aria-label={v3("vwSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {lines.length > 0 && (
        <ul className="c3-vip-lines" aria-label={v3("vwLines")}>
          {lines.map((line) => (
            <li key={line.currency || "none"} data-currency={line.currency || "none"}>
              <span>{lineText(line.currency, line.amount, locale, v3("vwNoCurrency"))}</span>
              <span className="c3-muted">{line.count}</span>
            </li>
          ))}
        </ul>
      )}
      {data.loading && !loaded.length && <p className="c3-muted">{v3("vwLoading")}</p>}
      {data.error && <p className="c3-muted">{v3("vwFailed")} {tx("failed")}</p>}
      {!data.loading && !data.error && !loaded.length && <p className="c3-empty">{v3("vwNone")}</p>}
      {!data.loading && !data.error && loaded.length > 0 && !shown.length && <p className="c3-empty">{v3("vwEmpty")}</p>}
      <ul className="c3-vip-list">
        {shown.map((person) => {
          const currency = String(person.currency || "").trim().toUpperCase();
          const amount = Number(person.balance);
          return (
            <li key={person.id} className="c3-vip-card" data-pinned={pinned.includes(person.id) ? "1" : "0"}>
              <strong>{person.name || person.email || person.id}</strong>
              <p data-currency={currency || "none"}>{lineText(currency, Number.isFinite(amount) ? amount : 0, locale, v3("vwNoCurrency"))}</p>
              <div className="c3-row">
                <Link className="c3-btn" href={crmv3Href(base, `customers/${person.id}`)}>{v3("vwOpen")}</Link>
                <button type="button" className="c3-btn" data-vip-pin="" onClick={() => storePins(toggleId(pinned, person.id))}>{pinned.includes(person.id) ? v3("vwUnpin") : v3("vwPin")}</button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function HandoffPacket() {
  const v3 = useV3();
  const [items, setItems] = useState<DigestItem[]>([]);
  const [packet, setPacket] = useState<Packet>({ ids: [], note: "" });
  const [query, setQuery] = useState("");
  const [clearing, setClearing] = useState(false);
  useEscape(clearing, () => setClearing(false));
  useEffect(() => {
    const bag: Record<string, unknown> = {};
    for (const key of packetSources()) bag[key] = readJson(key, null);
    setItems(openItems(bag));
    setPacket(readPacket(readJson(PACKET_KEY, null)));
  }, []);
  const shown = visibleItems(items, query);
  const chosen = chosenItems(items, packet);

  function store(next: Packet) {
    setPacket(next);
    writeJson(PACKET_KEY, next);
  }

  return (
    <section className="c3-packet-pad" aria-label={v3("pkTitle")} data-packet-pad="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("pkSub")}</p>
          <h2 className="c3-title">{v3("pkTitle")}</h2>
        </div>
        <p className="c3-muted">{v3("pkChosen")} {chosen.length}</p>
      </header>
      <p className="c3-muted">{v3("pkHint")}</p>
      <p className="c3-muted">{v3("pkLocal")}</p>
      <label className="c3-lab">
        <span>{v3("pkSearch")}</span>
        <input className="c3-field" aria-label={v3("pkSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!items.length && <p className="c3-empty">{v3("pkEmpty")}</p>}
      <ul className="c3-packet-list">
        {shown.map((item) => {
          const on = packet.ids.includes(item.id);
          return (
            <li key={item.id} className="c3-packet-card" data-on={on ? "1" : "0"}>
              <p className="c3-muted">{item.source} · {item.kind}</p>
              <p>{item.label}</p>
              <button type="button" className="c3-btn" data-packet-pick="" aria-pressed={on} onClick={() => store(togglePacketId(packet, item.id))}>{on ? v3("pkDrop") : v3("pkTake")}</button>
            </li>
          );
        })}
      </ul>
      <label className="c3-lab">
        <span>{v3("pkNote")}</span>
        <input className="c3-field" aria-label={v3("pkNote")} value={packet.note} onChange={(event) => store(withNote(packet, event.target.value))} />
      </label>
      <p className="c3-muted">{v3("pkBlank")}</p>
      {!chosen.length && !packet.note && <p className="c3-empty">{v3("pkNone")}</p>}
      <div className="c3-row">
        <button
          type="button"
          className="c3-btn"
          data-packet-export=""
          onClick={() => {
            if (!canExport(chosen, packet.note)) return;
            saveFile("handoff-packet.csv", packetCsv(chosen, packet.note));
          }}
        >
          {v3("pkExport")}
        </button>
        <button type="button" className="c3-btn" onClick={() => setClearing(true)}>{v3("pkClear")}</button>
      </div>
      {clearing && (
        <div className="c3-pay-confirm" role="dialog" aria-modal="true" data-confirm="">
          <p>{v3("pkClearLead")}</p>
          <div className="c3-row">
            <button type="button" className="c3-btn c3-btn-hot" onClick={() => { store({ ids: [], note: "" }); setClearing(false); }}>{v3("pkClear")}</button>
            <button type="button" className="c3-btn" onClick={() => setClearing(false)}>{v3("pkCancel")}</button>
          </div>
        </div>
      )}
    </section>
  );
}
