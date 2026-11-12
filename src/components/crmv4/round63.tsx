"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
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
} from "@/lib/crmv4/round63";
import { crmv4Href } from "@/lib/crmv4/sections";
import { useEscape } from "./round40";
import { useJson, when, type Tx } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const STATUS_LABEL: Record<string, CrmV4CopyKey> = {
  REJECTED: "rjRejected",
  CANCELLED: "rjCancelled",
};

function priceText(row: OrderRow): string {
  const price = row.price;
  if (price == null || !Number.isFinite(Number(price))) return "—";
  return String(price);
}

export function RejectBoard({ base, v4, locale, tx }: { base: string; v4: V4; locale: string; tx: Tx }) {
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
    <section className="c4-reject-desk" aria-label={v4("rjTitle")} data-reject-desk="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-pay-kicker">{v4("rjSub")}</p>
          <h2 className="c4-title">{v4("rjTitle")}</h2>
        </div>
        <p className="c4-meta">{v4("rjCount")} {shown.length}</p>
      </header>
      <p className="c4-meta">{v4("rjHint")}</p>
      <p className="c4-meta">{v4("rjView")}</p>
      <label className="c4-lab">
        <span>{v4("rjSearch")}</span>
        <input className="c4-field" aria-label={v4("rjSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c4-row" role="group" aria-label={v4("rjAll")}>
        <button type="button" className="c4-chip" data-on={status ? "0" : "1"} aria-pressed={!status} onClick={() => setStatus("")}>{v4("rjAll")}</button>
        {EXCEPTION_STATUSES.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={status === item ? "1" : "0"} aria-pressed={status === item} onClick={() => setStatus(item)}>{v4(STATUS_LABEL[item])}</button>
        ))}
      </div>
      {data.loading && !loaded.length && <p className="c4-meta">{v4("rjLoading")}</p>}
      {data.error && <p className="c4-meta">{v4("rjFailed")} {tx("failed")}</p>}
      {!data.loading && !data.error && !filterExceptions(loaded, "", "").length && <p className="c4-pay-empty">{v4("rjNone")}</p>}
      {!data.loading && !data.error && filterExceptions(loaded, "", "").length > 0 && !shown.length && <p className="c4-pay-empty">{v4("rjEmpty")}</p>}
      <ul className="c4-reject-cards">
        {shown.map((row) => {
          const current = String(row.status || "").trim().toUpperCase();
          const name = row.traderName || row.user?.name || "—";
          const userId = row.user?.id || row.userId;
          const pinned = pins.includes(row.id);
          return (
            <li key={row.id} className="c4-reject-card" data-status={current || "none"} data-pinned={pinned ? "1" : "0"}>
              <div className="c4-row c4-between">
                <strong>{row.symbol || "—"}</strong>
                <span className="c4-reject-status" data-status={current || "none"}>{STATUS_LABEL[current] ? v4(STATUS_LABEL[current]) : current || "—"}</span>
              </div>
              <p className="c4-meta">{name} · {row.side || "—"} · {row.type || "—"}</p>
              <p className="c4-meta">{v4("rjVolume")} {row.volume ?? "—"} · {v4("rjPrice")} {priceText(row)} · {when(row.createdAt, locale)}</p>
              <p className="c4-meta">{v4("rjNoReason")}</p>
              <div className="c4-row">
                <button type="button" className="c4-btn" data-reject-pin="" onClick={() => storePins(toggleId(pins, row.id))}>{pinned ? v4("rjUnpin") : v4("rjPin")}</button>
                {userId && <Link className="c4-btn" href={crmv4Href(base, `customers/${userId}`)}>{v4("rjOpen")}</Link>}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function VaultPad({ v4, base = "/izcrm/crmv4" }: { v4: V4; base?: string }) {
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

  return (
    <section className="c4-vault-pad c4-vault-quay" aria-label={v4("vhTitle")} data-vault-pad="1" data-desk="quay">
      <header className="c4-pay-head c4-vault-quay-mast">
        <p className="c4-vault-quay-plate" data-logo="mono">7FX</p>
        <div>
          <p className="c4-pay-kicker c4-vault-quay-kicker">{v4("vhSub")}</p>
          <h2 className="c4-title c4-vault-quay-title">{v4("vhTitle")}</h2>
        </div>
        <ol className="c4-vault-quay-index" aria-label={v4("vhTitle")}>
          <li data-tone="gold">{v4("vhSub")}</li>
          <li data-tone="ink">{v4("vhSearch")}</li>
          <li data-tone="wool">{shown.length}</li>
        </ol>
        <p className="c4-vault-quay-links">
          <Link href={crmv4Href(base, "brt")}>{v4("brtTitle")}</Link>
          <Link href={crmv4Href(base, "bdg")}>{v4("bdgTitle")}</Link>
        </p>
      </header>
      <p className="c4-meta">{v4("vhHint")}</p>
      <p className="c4-meta">{v4("vhLocal")}</p>
      <label className="c4-lab">
        <span>{v4("vhSearch")}</span>
        <input className="c4-field c4-vault-quay-search" aria-label={v4("vhSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <form className="c4-row" onSubmit={(event) => {
        event.preventDefault();
        const next = addHint(hints, { id: `hint-${Date.now()}`, label, login, at: new Date().toISOString() });
        if (next === null) {
          setWarn(v4("vhSecret"));
          return;
        }
        if (next.length === hints.length && next.every((hint, index) => hint.id === hints[index]?.id)) return;
        store(next);
        setLabel("");
        setLogin("");
        setWarn("");
      }}>
        <label className="c4-lab">
          <span>{v4("vhItem")}</span>
          <input className="c4-field" aria-label={v4("vhItem")} autoComplete="off" value={label} onChange={(event) => setLabel(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("vhLogin")}</span>
          <input className="c4-field" aria-label={v4("vhLogin")} autoComplete="off" value={login} onChange={(event) => setLogin(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn">{v4("vhAdd")}</button>
      </form>
      <p className="c4-meta">{v4("vhBlank")}</p>
      {warn && <p className="c4-meta" data-vault-warn="">{warn}</p>}
      {!shown.length && <p className="c4-pay-empty c4-vault-quay-empty">{v4("vhEmpty")}</p>}
      <ul className="c4-vault-list c4-vault-quay-list">
        {shown.map((hint) => (
          <li key={hint.id} className="c4-vault-card c4-vault-quay-card" data-pinned={hint.pinned ? "1" : "0"}>
            <strong>{hint.label}</strong>
            {hint.login && <p className="c4-meta">{v4("vhLogin")} {hint.login}</p>}
            <div className="c4-row">
              <button type="button" className="c4-btn" onClick={() => store(toggleHintPin(hints, hint.id))}>{hint.pinned ? v4("vhUnpin") : v4("vhPin")}</button>
              <button type="button" className="c4-btn" onClick={() => setRemoving(hint.id)}>{v4("vhRemove")}</button>
            </div>
          </li>
        ))}
      </ul>
      {removing && (
        <div className="c4-pay-confirm" role="dialog" aria-modal="true" data-confirm="">
          <p>{v4("vhRemoveLead")}</p>
          <div className="c4-row">
            <button type="button" className="c4-btn c4-btn-hot" onClick={() => { store(removeHint(hints, removing)); setRemoving(null); }}>{v4("vhRemove")}</button>
            <button type="button" className="c4-btn" onClick={() => setRemoving(null)}>{v4("vhCancel")}</button>
          </div>
        </div>
      )}
    </section>
  );
}
