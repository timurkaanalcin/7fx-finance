"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readJson, writeJson } from "@/lib/crmv3/bridge";
import type { CrmV3CopyKey } from "@/lib/crmv3/copy";
import { useEscape } from "@/lib/crmv3/focus";
import { crmv3Href } from "@/lib/crmv3/sections";
import {
  EXCEPTION_STATUSES,
  PIN_KEY,
  VAULT_KEY,
  addHint,
  filterExceptions,
  readHints,
  readIds,
  removeHint,
  sortExceptions,
  toggleHintPin,
  toggleId,
  visibleHints,
  type OrderRow,
  type VaultHint,
} from "@/lib/crmv3/rejects";
import { useJson, when, type Tx } from "../kit";
import { useV3 } from "./store";

const STATUS_LABEL: Record<string, CrmV3CopyKey> = {
  REJECTED: "rjRejected",
  CANCELLED: "rjCancelled",
};

function priceText(row: OrderRow): string {
  const price = row.price;
  if (price == null || !Number.isFinite(Number(price))) return "—";
  return String(price);
}

export function RejectBoard({ base, locale, tx }: { base: string; locale: string; tx: Tx }) {
  const v3 = useV3();
  const data = useJson<{ orders?: OrderRow[] }>("/api/admin/positions?tab=orders&take=40");
  const [status, setStatus] = useState("");
  const [query, setQuery] = useState("");
  const [pins, setPins] = useState<string[]>([]);
  useEffect(() => { setPins(readIds(readJson(PIN_KEY, []))); }, []);
  const loaded = data.data?.orders || [];
  const shown = sortExceptions(filterExceptions(loaded, status, query), pins);

  function storePins(next: string[]) {
    setPins(next);
    writeJson(PIN_KEY, next);
  }

  return (
    <section className="c3-reject-desk" aria-label={v3("rjTitle")} data-reject-desk="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("rjSub")}</p>
          <h2 className="c3-title">{v3("rjTitle")}</h2>
        </div>
        <p className="c3-muted">{v3("rjCount")} {shown.length}</p>
      </header>
      <p className="c3-muted">{v3("rjHint")}</p>
      <p className="c3-muted">{v3("rjView")}</p>
      <label className="c3-lab">
        <span>{v3("rjSearch")}</span>
        <input className="c3-field" aria-label={v3("rjSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c3-row" role="group" aria-label={v3("rjAll")}>
        <button type="button" className="c3-chip" data-on={status ? "0" : "1"} aria-pressed={!status} onClick={() => setStatus("")}>{v3("rjAll")}</button>
        {EXCEPTION_STATUSES.map((item) => (
          <button key={item} type="button" className="c3-chip" data-on={status === item ? "1" : "0"} aria-pressed={status === item} onClick={() => setStatus(item)}>{v3(STATUS_LABEL[item])}</button>
        ))}
      </div>
      {data.loading && !loaded.length && <p className="c3-muted">{v3("rjLoading")}</p>}
      {data.error && <p className="c3-muted">{v3("rjFailed")} {tx("failed")}</p>}
      {!data.loading && !data.error && !filterExceptions(loaded, "", "").length && <p className="c3-empty">{v3("rjNone")}</p>}
      {!data.loading && !data.error && filterExceptions(loaded, "", "").length > 0 && !shown.length && <p className="c3-empty">{v3("rjEmpty")}</p>}
      <ul className="c3-reject-cards">
        {shown.map((row) => {
          const current = String(row.status || "").trim().toUpperCase();
          const name = row.traderName || row.user?.name || "—";
          const userId = row.user?.id || row.userId;
          const pinned = pins.includes(row.id);
          return (
            <li key={row.id} className="c3-reject-card" data-status={current || "none"} data-pinned={pinned ? "1" : "0"}>
              <div className="c3-row c3-between">
                <strong>{row.symbol || "—"}</strong>
                <span className="c3-reject-status" data-status={current || "none"}>{STATUS_LABEL[current] ? v3(STATUS_LABEL[current]) : current || "—"}</span>
              </div>
              <p className="c3-muted">{name} · {row.side || "—"} · {row.type || "—"}</p>
              <p className="c3-muted">{v3("rjVolume")} {row.volume ?? "—"} · {v3("rjPrice")} {priceText(row)} · {when(row.createdAt, locale)}</p>
              <p className="c3-muted">{v3("rjNoReason")}</p>
              <div className="c3-row">
                <button type="button" className="c3-btn" data-reject-pin="" onClick={() => storePins(toggleId(pins, row.id))}>{pinned ? v3("rjUnpin") : v3("rjPin")}</button>
                {userId && <Link className="c3-btn" href={crmv3Href(base, `customers/${userId}`)}>{v3("rjOpen")}</Link>}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function VaultPad() {
  const v3 = useV3();
  const [hints, setHints] = useState<VaultHint[]>([]);
  const [query, setQuery] = useState("");
  const [label, setLabel] = useState("");
  const [login, setLogin] = useState("");
  const [warn, setWarn] = useState("");
  const [removing, setRemoving] = useState<string | null>(null);
  useEscape(Boolean(removing), () => setRemoving(null));
  useEffect(() => { setHints(readHints(readJson(VAULT_KEY, []))); }, []);
  const shown = visibleHints(hints, query);

  function store(next: VaultHint[]) {
    setHints(next);
    writeJson(VAULT_KEY, next);
  }

  function add() {
    const next = addHint(hints, { id: `hint-${Date.now()}`, label, login, at: new Date().toISOString() });
    if (next === null) {
      setWarn(v3("vhSecret"));
      return;
    }
    if (next.length === hints.length && next.every((hint, index) => hint.id === hints[index]?.id)) return;
    store(next);
    setLabel("");
    setLogin("");
    setWarn("");
  }

  return (
    <section className="c3-vault-pad" aria-label={v3("vhTitle")} data-vault-pad="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("vhSub")}</p>
          <h2 className="c3-title">{v3("vhTitle")}</h2>
        </div>
        <p className="c3-muted">{shown.length}</p>
      </header>
      <p className="c3-muted">{v3("vhHint")}</p>
      <p className="c3-muted">{v3("vhLocal")}</p>
      <label className="c3-lab">
        <span>{v3("vhSearch")}</span>
        <input className="c3-field" aria-label={v3("vhSearch")} autoComplete="off" value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c3-row">
        <label className="c3-lab">
          <span>{v3("vhItem")}</span>
          <input className="c3-field" aria-label={v3("vhItem")} autoComplete="off" value={label} onChange={(event) => setLabel(event.target.value)} />
        </label>
        <label className="c3-lab">
          <span>{v3("vhLogin")}</span>
          <input className="c3-field" aria-label={v3("vhLogin")} autoComplete="off" value={login} onChange={(event) => setLogin(event.target.value)} />
        </label>
        <button type="button" className="c3-btn" onClick={add}>{v3("vhAdd")}</button>
      </div>
      <p className="c3-muted">{v3("vhBlank")}</p>
      {warn && <p className="c3-muted" data-vault-warn="">{warn}</p>}
      {!shown.length && <p className="c3-empty">{v3("vhEmpty")}</p>}
      <ul className="c3-vault-list">
        {shown.map((hint) => (
          <li key={hint.id} className="c3-vault-card" data-pinned={hint.pinned ? "1" : "0"}>
            <strong>{hint.label}</strong>
            {hint.login && <p className="c3-muted">{v3("vhLogin")} {hint.login}</p>}
            <div className="c3-row">
              <button type="button" className="c3-btn" onClick={() => store(toggleHintPin(hints, hint.id))}>{hint.pinned ? v3("vhUnpin") : v3("vhPin")}</button>
              <button type="button" className="c3-btn" onClick={() => setRemoving(hint.id)}>{v3("vhRemove")}</button>
            </div>
          </li>
        ))}
      </ul>
      {removing && (
        <div className="c3-pay-confirm" role="dialog" aria-modal="true" data-confirm="">
          <p>{v3("vhRemoveLead")}</p>
          <div className="c3-row">
            <button type="button" className="c3-btn c3-btn-hot" onClick={() => { store(removeHint(hints, removing)); setRemoving(null); }}>{v3("vhRemove")}</button>
            <button type="button" className="c3-btn" onClick={() => setRemoving(null)}>{v3("vhCancel")}</button>
          </div>
        </div>
      )}
    </section>
  );
}
