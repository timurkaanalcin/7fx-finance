"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
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
} from "@/lib/crmv4/round70";
import type { DigestItem } from "@/lib/crmv4/round65";
import { crmv4Href } from "@/lib/crmv4/sections";
import { useEscape } from "./round40";
import { money, useJson, type Tx } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const FIELD_KEY: Record<VipField, CrmV4CopyKey> = {
  balance: "vwBalance",
  lastLogin: "vwLogin",
  lastContact: "vwContact",
};

function moneyText(currency: string, amount: number, locale: string, none: string): string {
  if (currency.length === 3) return money(amount, currency, locale);
  return `${amount.toFixed(2)} ${none}`;
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

export function VipWatch({ base, v4, locale, tx }: { base: string; v4: V4; locale: string; tx: Tx }) {
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
    <section className="c4-vip-strip" aria-label={v4("vwTitle")} data-vip-strip="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-pay-kicker">{v4("vwSub")}</p>
          <h2 className="c4-title">{v4("vwTitle")}</h2>
        </div>
        <p className="c4-meta">{v4("vwCount")} {shown.length}</p>
      </header>
      <p className="c4-meta">{v4("vwHint")}</p>
      <div className="c4-row" role="group" aria-label={v4("vwField")}>
        {VIP_FIELDS.map((field) => (
          <button key={field} type="button" className="c4-chip" data-on={rule.field === field ? "1" : "0"} aria-pressed={rule.field === field} onClick={() => storeRule({ ...rule, field })}>
            {v4(FIELD_KEY[field])}
          </button>
        ))}
      </div>
      <div className="c4-row">
        <label className="c4-lab">
          <span>{rule.field === "balance" ? v4("vwAmount") : v4("vwDays")}</span>
          <input
            className="c4-field"
            type="number"
            min={0}
            aria-label={rule.field === "balance" ? v4("vwAmount") : v4("vwDays")}
            value={ready ? String(rule.amount) : ""}
            onChange={(event) => storeRule({ ...rule, amount: Number(event.target.value) })}
          />
        </label>
        {rule.field === "balance" && (
          <label className="c4-lab">
            <span>{v4("vwCurrency")}</span>
            <select className="c4-select" aria-label={v4("vwCurrency")} value={rule.currency} onChange={(event) => storeRule({ ...rule, currency: event.target.value })}>
              <option value="">{v4("vwCurrency")}</option>
              {currencies.map((currency) => <option key={currency} value={currency}>{currency}</option>)}
              {rule.currency && !currencies.includes(rule.currency) && <option value={rule.currency}>{rule.currency}</option>}
            </select>
          </label>
        )}
      </div>
      {rule.field === "balance" && !rule.currency && <p className="c4-meta">{v4("vwPickCurrency")}</p>}
      <label className="c4-lab">
        <span>{v4("vwSearch")}</span>
        <input className="c4-field" aria-label={v4("vwSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {lines.length > 0 && (
        <ul className="c4-vip-lines" aria-label={v4("vwLines")}>
          {lines.map((line) => (
            <li key={line.currency || "none"} data-currency={line.currency || "none"}>
              <span>{moneyText(line.currency, line.amount, locale, v4("vwNoCurrency"))}</span>
              <span className="c4-meta">{line.count}</span>
            </li>
          ))}
        </ul>
      )}
      {data.loading && !loaded.length && <p className="c4-meta">{v4("vwLoading")}</p>}
      {data.error && <p className="c4-meta">{v4("vwFailed")} {tx("failed")}</p>}
      {!data.loading && !data.error && !loaded.length && <p className="c4-pay-empty">{v4("vwNone")}</p>}
      {!data.loading && !data.error && loaded.length > 0 && !shown.length && <p className="c4-pay-empty">{v4("vwEmpty")}</p>}
      <ul className="c4-vip-list">
        {shown.map((person) => {
          const currency = String(person.currency || "").trim().toUpperCase();
          const amount = Number(person.balance);
          return (
            <li key={person.id} className="c4-vip-card" data-pinned={pinned.includes(person.id) ? "1" : "0"}>
              <strong>{person.name || person.email || person.id}</strong>
              <p data-currency={currency || "none"}>{moneyText(currency, Number.isFinite(amount) ? amount : 0, locale, v4("vwNoCurrency"))}</p>
              <div className="c4-row">
                <Link className="c4-btn" href={crmv4Href(base, `customers/${person.id}`)}>{v4("vwOpen")}</Link>
                <button type="button" className="c4-btn" data-vip-pin="" onClick={() => storePins(toggleId(pinned, person.id))}>{pinned.includes(person.id) ? v4("vwUnpin") : v4("vwPin")}</button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function HandoffPacket({ v4 }: { v4: V4 }) {
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
    <section className="c4-packet-pad" aria-label={v4("pkTitle")} data-packet-pad="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-pay-kicker">{v4("pkSub")}</p>
          <h2 className="c4-title">{v4("pkTitle")}</h2>
        </div>
        <p className="c4-meta">{v4("pkChosen")} {chosen.length}</p>
      </header>
      <p className="c4-meta">{v4("pkHint")}</p>
      <p className="c4-meta">{v4("pkLocal")}</p>
      <label className="c4-lab">
        <span>{v4("pkSearch")}</span>
        <input className="c4-field" aria-label={v4("pkSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!items.length && <p className="c4-pay-empty">{v4("pkEmpty")}</p>}
      <ul className="c4-packet-list">
        {shown.map((item) => {
          const on = packet.ids.includes(item.id);
          return (
            <li key={item.id} className="c4-packet-card" data-on={on ? "1" : "0"}>
              <p className="c4-meta">{item.source} · {item.kind}</p>
              <p>{item.label}</p>
              <button type="button" className="c4-btn" data-packet-pick="" aria-pressed={on} onClick={() => store(togglePacketId(packet, item.id))}>{on ? v4("pkDrop") : v4("pkTake")}</button>
            </li>
          );
        })}
      </ul>
      <label className="c4-lab">
        <span>{v4("pkNote")}</span>
        <input className="c4-field" aria-label={v4("pkNote")} value={packet.note} onChange={(event) => store(withNote(packet, event.target.value))} />
      </label>
      <p className="c4-meta">{v4("pkBlank")}</p>
      {!chosen.length && !packet.note && <p className="c4-pay-empty">{v4("pkNone")}</p>}
      <div className="c4-row">
        <button
          type="button"
          className="c4-btn"
          data-packet-export=""
          onClick={() => {
            if (!canExport(chosen, packet.note)) return;
            saveFile("handoff-packet.csv", packetCsv(chosen, packet.note));
          }}
        >
          {v4("pkExport")}
        </button>
        <button type="button" className="c4-btn" onClick={() => setClearing(true)}>{v4("pkClear")}</button>
      </div>
      {clearing && (
        <div className="c4-pay-confirm" role="dialog" aria-modal="true" data-confirm="">
          <p>{v4("pkClearLead")}</p>
          <div className="c4-row">
            <button type="button" className="c4-btn c4-btn-hot" onClick={() => { store({ ids: [], note: "" }); setClearing(false); }}>{v4("pkClear")}</button>
            <button type="button" className="c4-btn" onClick={() => setClearing(false)}>{v4("pkCancel")}</button>
          </div>
        </div>
      )}
    </section>
  );
}
