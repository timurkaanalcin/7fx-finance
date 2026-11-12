"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import {
  MODE_KEY,
  PIN_KEY,
  TIP_KEY,
  addTip,
  heatCells,
  hideTip,
  pinId,
  readIds,
  readMode,
  readTips,
  removeTip,
  toggleId,
  toggleTipPin,
  visibleTips,
  type DeskTip,
  type HeatMode,
  type HeatPerson,
} from "@/lib/crmv4/round64";
import { crmv4Href } from "@/lib/crmv4/sections";
import { useEscape } from "./round40";
import { useJson, type Tx } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

export function HeatStrip({ v4, tx, base = "/izcrm/crmv4" }: { v4: V4; tx: Tx; base?: string }) {
  const data = useJson<{ users?: HeatPerson[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [mode, setMode] = useState<HeatMode>("country");
  const [query, setQuery] = useState("");
  const [pins, setPins] = useState<string[]>([]);
  useEffect(() => {
    setMode(readMode(readJson(MODE_KEY, "country")));
    setPins(readIds(readJson(PIN_KEY, [])));
  }, []);
  const loaded = data.data?.users || [];
  const cells = heatCells(loaded, mode, query, pins);
  const hottest = cells.reduce((max, cell) => Math.max(max, cell.count), 0);

  function storeMode(next: HeatMode) {
    setMode(next);
    writeJson(MODE_KEY, next);
  }

  function storePins(next: string[]) {
    setPins(next);
    writeJson(PIN_KEY, next);
  }

  return (
    <section className="c4-heat-strip c4-heat-quay" aria-label={v4("htTitle")} data-heat-strip="1" data-desk="quay">
      <header className="c4-pay-head c4-heat-quay-mast">
        <p className="c4-heat-quay-plate" data-logo="mono">7FX</p>
        <div>
          <p className="c4-pay-kicker c4-heat-quay-kicker">{v4("htSub")}</p>
          <h2 className="c4-title c4-heat-quay-title">{v4("htTitle")}</h2>
        </div>
        <ol className="c4-heat-quay-index" aria-label={v4("htTitle")}>
          <li data-tone="gold">{v4("htCountry")}</li>
          <li data-tone="ink">{v4("htDesk")}</li>
          <li data-tone="wool">{loaded.length}</li>
        </ol>
        <p className="c4-heat-quay-links">
          <Link href={crmv4Href(base, "brt")}>{v4("brtTitle")}</Link>
          <Link href={crmv4Href(base, "bdg")}>{v4("bdgTitle")}</Link>
        </p>
      </header>
      <p className="c4-meta c4-heat-quay-lead">{v4("htHint")}</p>
      <label className="c4-lab">
        <span>{v4("htSearch")}</span>
        <input className="c4-field c4-heat-quay-search" aria-label={v4("htSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c4-row" role="group" aria-label={v4("htCountry")}>
        <button type="button" className="c4-chip" data-on={mode === "country" ? "1" : "0"} aria-pressed={mode === "country"} onClick={() => storeMode("country")}>{v4("htCountry")}</button>
        <button type="button" className="c4-chip" data-on={mode === "desk" ? "1" : "0"} aria-pressed={mode === "desk"} onClick={() => storeMode("desk")}>{v4("htDesk")}</button>
      </div>
      {data.loading && !loaded.length && <p className="c4-meta">{v4("htLoading")}</p>}
      {data.error && <p className="c4-meta">{v4("htFailed")} {tx("failed")}</p>}
      {!data.loading && !data.error && !loaded.length && <p className="c4-pay-empty c4-heat-quay-empty">{v4("htNone")}</p>}
      {!data.loading && !data.error && loaded.length > 0 && !cells.length && <p className="c4-pay-empty c4-heat-quay-empty">{v4("htEmpty")}</p>}
      <ul className="c4-heat-cells c4-heat-quay-cells">
        {cells.map((cell) => {
          const id = pinId(mode, cell.key);
          const pinned = pins.includes(id);
          const label = cell.key || (mode === "desk" ? v4("htNoDesk") : v4("htNoCountry"));
          return (
            <li key={id} className="c4-heat-cell c4-heat-quay-cell" data-pinned={pinned ? "1" : "0"} data-hot={cell.count === hottest && cell.count > 0 ? "1" : "0"} data-group={cell.key || "none"}>
              <div className="c4-row c4-between">
                <strong>{label}</strong>
                <span className="c4-heat-count">{cell.count}</span>
              </div>
              <p className="c4-meta">{v4("htNames")} {cell.names.join(", ") || "—"}</p>
              <button type="button" className="c4-btn" data-heat-pin="" onClick={() => storePins(toggleId(pins, id))}>{pinned ? v4("htUnpin") : v4("htPin")}</button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function CheatSheet({ v4 }: { v4: V4 }) {
  const [tips, setTips] = useState<DeskTip[]>([]);
  const [query, setQuery] = useState("");
  const [keys, setKeys] = useState("");
  const [body, setBody] = useState("");
  const [hidden, setHidden] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  useEscape(Boolean(removing), () => setRemoving(null));
  useEffect(() => { setTips(readTips(readJson(TIP_KEY, []))); }, []);
  const shown = visibleTips(tips, query, hidden);

  function store(next: DeskTip[]) {
    setTips(next);
    writeJson(TIP_KEY, next);
  }

  return (
    <section className="c4-cheat-pad" aria-label={v4("csTitle")} data-cheat-pad="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-pay-kicker">{v4("csSub")}</p>
          <h2 className="c4-title">{v4("csTitle")}</h2>
        </div>
        <p className="c4-meta">{shown.length}</p>
      </header>
      <p className="c4-meta">{v4("csHint")}</p>
      <p className="c4-meta">{v4("csLocal")}</p>
      <label className="c4-lab">
        <span>{v4("csSearch")}</span>
        <input className="c4-field" aria-label={v4("csSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c4-row" role="group" aria-label={v4("csOpen")}>
        <button type="button" className="c4-chip" data-on={hidden ? "0" : "1"} aria-pressed={!hidden} onClick={() => setHidden(false)}>{v4("csOpen")}</button>
        <button type="button" className="c4-chip" data-on={hidden ? "1" : "0"} aria-pressed={hidden} onClick={() => setHidden(true)}>{v4("csHidden")}</button>
      </div>
      <form className="c4-row" onSubmit={(event) => {
        event.preventDefault();
        const next = addTip(tips, { id: `tip-${Date.now()}`, keys, body, at: new Date().toISOString() });
        if (next.length === tips.length && next.every((tip, index) => tip.id === tips[index]?.id)) return;
        store(next);
        setKeys("");
        setBody("");
        setHidden(false);
      }}>
        <label className="c4-lab">
          <span>{v4("csKeys")}</span>
          <input className="c4-field" aria-label={v4("csKeys")} value={keys} onChange={(event) => setKeys(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("csBody")}</span>
          <input className="c4-field" aria-label={v4("csBody")} value={body} onChange={(event) => setBody(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn">{v4("csAdd")}</button>
      </form>
      <p className="c4-meta">{v4("csBlank")}</p>
      {!shown.length && <p className="c4-pay-empty">{v4("csEmpty")}</p>}
      <ul className="c4-cheat-list">
        {shown.map((tip) => (
          <li key={tip.id} className="c4-cheat-card" data-pinned={tip.pinned ? "1" : "0"} data-hidden={tip.hidden ? "1" : "0"}>
            {tip.keys && <p className="c4-cheat-keys">{tip.keys}</p>}
            <p>{tip.body}</p>
            <div className="c4-row">
              <button type="button" className="c4-btn" onClick={() => store(toggleTipPin(tips, tip.id))}>{tip.pinned ? v4("csUnpin") : v4("csPin")}</button>
              <button type="button" className="c4-btn" onClick={() => store(hideTip(tips, tip.id, !tip.hidden))}>{tip.hidden ? v4("csShow") : v4("csHide")}</button>
              <button type="button" className="c4-btn" onClick={() => setRemoving(tip.id)}>{v4("csRemove")}</button>
            </div>
          </li>
        ))}
      </ul>
      {removing && (
        <div className="c4-pay-confirm" role="dialog" aria-modal="true" data-confirm="">
          <p>{v4("csRemoveLead")}</p>
          <div className="c4-row">
            <button type="button" className="c4-btn c4-btn-hot" onClick={() => { store(removeTip(tips, removing)); setRemoving(null); }}>{v4("csRemove")}</button>
            <button type="button" className="c4-btn" onClick={() => setRemoving(null)}>{v4("csCancel")}</button>
          </div>
        </div>
      )}
    </section>
  );
}
