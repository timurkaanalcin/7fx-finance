"use client";

import { useEffect, useState } from "react";
import { readJson, writeJson } from "@/lib/crmv3/bridge";
import { useEscape } from "@/lib/crmv3/focus";
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
} from "@/lib/crmv3/heatmap";
import { useJson, type Tx } from "../kit";
import { useV3 } from "./store";

export function HeatStrip({ tx }: { tx: Tx }) {
  const v3 = useV3();
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
    <section className="c3-heat-strip" aria-label={v3("htTitle")} data-heat-strip="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("htSub")}</p>
          <h2 className="c3-title">{v3("htTitle")}</h2>
        </div>
        <p className="c3-muted">{v3("htCount")} {loaded.length}</p>
      </header>
      <p className="c3-muted">{v3("htHint")}</p>
      <label className="c3-lab">
        <span>{v3("htSearch")}</span>
        <input className="c3-field" aria-label={v3("htSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c3-row" role="group" aria-label={v3("htCountry")}>
        <button type="button" className="c3-chip" data-on={mode === "country" ? "1" : "0"} aria-pressed={mode === "country"} onClick={() => storeMode("country")}>{v3("htCountry")}</button>
        <button type="button" className="c3-chip" data-on={mode === "desk" ? "1" : "0"} aria-pressed={mode === "desk"} onClick={() => storeMode("desk")}>{v3("htDesk")}</button>
      </div>
      {data.loading && !loaded.length && <p className="c3-muted">{v3("htLoading")}</p>}
      {data.error && <p className="c3-muted">{v3("htFailed")} {tx("failed")}</p>}
      {!data.loading && !data.error && !loaded.length && <p className="c3-empty">{v3("htNone")}</p>}
      {!data.loading && !data.error && loaded.length > 0 && !cells.length && <p className="c3-empty">{v3("htEmpty")}</p>}
      <ul className="c3-heat-cells">
        {cells.map((cell) => {
          const id = pinId(mode, cell.key);
          const pinned = pins.includes(id);
          const label = cell.key || (mode === "desk" ? v3("htNoDesk") : v3("htNoCountry"));
          return (
            <li key={id} className="c3-heat-cell" data-pinned={pinned ? "1" : "0"} data-hot={cell.count === hottest && cell.count > 0 ? "1" : "0"} data-group={cell.key || "none"}>
              <div className="c3-row c3-between">
                <strong>{label}</strong>
                <span className="c3-heat-count">{cell.count}</span>
              </div>
              <p className="c3-muted">{v3("htNames")} {cell.names.join(", ") || "—"}</p>
              <button type="button" className="c3-btn" data-heat-pin="" onClick={() => storePins(toggleId(pins, id))}>{pinned ? v3("htUnpin") : v3("htPin")}</button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function CheatSheet() {
  const v3 = useV3();
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

  function add() {
    const next = addTip(tips, { id: `tip-${Date.now()}`, keys, body, at: new Date().toISOString() });
    if (next.length === tips.length && next.every((tip, index) => tip.id === tips[index]?.id)) return;
    store(next);
    setKeys("");
    setBody("");
    setHidden(false);
  }

  return (
    <section className="c3-cheat-pad" aria-label={v3("csTitle")} data-cheat-pad="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("csSub")}</p>
          <h2 className="c3-title">{v3("csTitle")}</h2>
        </div>
        <p className="c3-muted">{shown.length}</p>
      </header>
      <p className="c3-muted">{v3("csHint")}</p>
      <p className="c3-muted">{v3("csLocal")}</p>
      <label className="c3-lab">
        <span>{v3("csSearch")}</span>
        <input className="c3-field" aria-label={v3("csSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c3-row" role="group" aria-label={v3("csOpen")}>
        <button type="button" className="c3-chip" data-on={hidden ? "0" : "1"} aria-pressed={!hidden} onClick={() => setHidden(false)}>{v3("csOpen")}</button>
        <button type="button" className="c3-chip" data-on={hidden ? "1" : "0"} aria-pressed={hidden} onClick={() => setHidden(true)}>{v3("csHidden")}</button>
      </div>
      <div className="c3-row">
        <label className="c3-lab">
          <span>{v3("csKeys")}</span>
          <input className="c3-field" aria-label={v3("csKeys")} value={keys} onChange={(event) => setKeys(event.target.value)} />
        </label>
        <label className="c3-lab">
          <span>{v3("csBody")}</span>
          <input className="c3-field" aria-label={v3("csBody")} value={body} onChange={(event) => setBody(event.target.value)} />
        </label>
        <button type="button" className="c3-btn" onClick={add}>{v3("csAdd")}</button>
      </div>
      <p className="c3-muted">{v3("csBlank")}</p>
      {!shown.length && <p className="c3-empty">{v3("csEmpty")}</p>}
      <ul className="c3-cheat-list">
        {shown.map((tip) => (
          <li key={tip.id} className="c3-cheat-card" data-pinned={tip.pinned ? "1" : "0"} data-hidden={tip.hidden ? "1" : "0"}>
            {tip.keys && <p className="c3-cheat-keys">{tip.keys}</p>}
            <p>{tip.body}</p>
            <div className="c3-row">
              <button type="button" className="c3-btn" onClick={() => store(toggleTipPin(tips, tip.id))}>{tip.pinned ? v3("csUnpin") : v3("csPin")}</button>
              <button type="button" className="c3-btn" onClick={() => store(hideTip(tips, tip.id, !tip.hidden))}>{tip.hidden ? v3("csShow") : v3("csHide")}</button>
              <button type="button" className="c3-btn" onClick={() => setRemoving(tip.id)}>{v3("csRemove")}</button>
            </div>
          </li>
        ))}
      </ul>
      {removing && (
        <div className="c3-pay-confirm" role="dialog" aria-modal="true" data-confirm="">
          <p>{v3("csRemoveLead")}</p>
          <div className="c3-row">
            <button type="button" className="c3-btn c3-btn-hot" onClick={() => { store(removeTip(tips, removing)); setRemoving(null); }}>{v3("csRemove")}</button>
            <button type="button" className="c3-btn" onClick={() => setRemoving(null)}>{v3("csCancel")}</button>
          </div>
        </div>
      )}
    </section>
  );
}
