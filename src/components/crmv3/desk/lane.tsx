"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readJson, writeJson } from "@/lib/crmv3/bridge";
import type { CrmV3CopyKey } from "@/lib/crmv3/copy";
import { WINDOW_KEY, type DocRow } from "@/lib/crmv3/expiry";
import {
  DOC_BOARD,
  DOC_LIST,
  HIDE_KEY,
  LANE_KEY,
  addLane,
  moveLane,
  pulseCounts,
  readKinds,
  readLane,
  setLaneHidden,
  toggleKind,
  toggleLanePin,
  visibleKinds,
  visibleLane,
  windowDays,
  type LaneItem,
  type PulseKind,
} from "@/lib/crmv3/lane";
import { crmv3Href } from "@/lib/crmv3/sections";
import { useJson, type Tx } from "../kit";
import { useV3 } from "./store";

type Person = { id: string; name?: string | null; email?: string | null };

const KIND_KEY: Record<PulseKind, CrmV3CopyKey> = {
  expired: "xpExpired",
  soon: "xpSoon",
};

export function PriorityLane({ base }: { base: string }) {
  const v3 = useV3();
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [items, setItems] = useState<LaneItem[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [hidden, setHidden] = useState(false);
  const loaded = data.data?.users || [];
  const names: Record<string, string> = {};
  for (const person of loaded) names[person.id] = String(person.name || person.email || person.id);
  useEffect(() => {
    if (data.loading || data.error) return;
    const known = (data.data?.users || []).map((person) => person.id);
    const next = readLane(readJson(LANE_KEY, []), known);
    setItems(next);
    if (known.length) writeJson(LANE_KEY, next);
  }, [data.loading, data.error, data.data]);
  const shown = visibleLane(items, hidden);

  function store(next: LaneItem[]) {
    setItems(next);
    writeJson(LANE_KEY, next);
  }

  return (
    <section className="c3-lane-pad" aria-label={v3("lnTitle")} data-lane-pad="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("lnSub")}</p>
          <h2 className="c3-title">{v3("lnTitle")}</h2>
        </div>
        <p className="c3-muted">{shown.length}</p>
      </header>
      <p className="c3-muted">{v3("lnHint")}</p>
      <p className="c3-muted">{v3("lnLocal")}</p>
      {!data.loading && !data.error && !loaded.length && <p className="c3-empty">{v3("lnNone")}</p>}
      <div className="c3-row">
        <label className="c3-lab">
          <span>{v3("lnCustomer")}</span>
          <select className="c3-select" aria-label={v3("lnCustomer")} value={customerId} onChange={(event) => setCustomerId(event.target.value)}>
            <option value="">{v3("lnCustomer")}</option>
            {loaded.map((person) => <option key={person.id} value={person.id}>{person.name || person.email || person.id}</option>)}
          </select>
        </label>
        <button type="button" className="c3-btn" onClick={() => {
          const next = addLane(items, customerId, loaded.map((person) => person.id));
          if (next.length === items.length) return;
          store(next);
          setCustomerId("");
        }}>{v3("lnAdd")}</button>
      </div>
      <p className="c3-muted">{v3("lnBlank")}</p>
      <div className="c3-row" role="group" aria-label={v3("lnShown")}>
        <button type="button" className="c3-chip" data-on={hidden ? "0" : "1"} aria-pressed={!hidden} onClick={() => setHidden(false)}>{v3("lnShown")}</button>
        <button type="button" className="c3-chip" data-on={hidden ? "1" : "0"} aria-pressed={hidden} onClick={() => setHidden(true)}>{v3("lnHidden")}</button>
      </div>
      {!shown.length && <p className="c3-empty">{v3("lnEmpty")}</p>}
      <ol className="c3-lane-list">
        {shown.map((item, index) => (
          <li key={item.id} className="c3-lane-card" data-pinned={item.pinned ? "1" : "0"}>
            <p>{index + 1}. {names[item.id] || item.id}</p>
            <div className="c3-row">
              <Link className="c3-btn" href={crmv3Href(base, `customers/${item.id}`)}>{v3("lnOpen")}</Link>
              {!item.hidden && <button type="button" className="c3-btn" data-lane-up="" onClick={() => store(moveLane(items, item.id, -1))}>{v3("lnUp")}</button>}
              {!item.hidden && <button type="button" className="c3-btn" data-lane-down="" onClick={() => store(moveLane(items, item.id, 1))}>{v3("lnDown")}</button>}
              <button type="button" className="c3-btn" onClick={() => store(toggleLanePin(items, item.id))}>{item.pinned ? v3("lnUnpin") : v3("lnPin")}</button>
              <button type="button" className="c3-btn" onClick={() => store(setLaneHidden(items, item.id, !item.hidden))}>{item.hidden ? v3("lnShow") : v3("lnHide")}</button>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function DocPulse({ base, tx }: { base: string; tx: Tx }) {
  const v3 = useV3();
  const data = useJson<{ documents?: DocRow[] }>(DOC_LIST);
  const [hidden, setHidden] = useState<PulseKind[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [span, setSpan] = useState<30 | 90>(30);
  useEffect(() => {
    setHidden(readKinds(readJson(HIDE_KEY, [])));
    setSpan(windowDays(readJson(WINDOW_KEY, 30)));
  }, []);
  const kinds = visibleKinds(hidden, showHidden);
  const ready = !data.loading && !data.error;
  const counts = ready ? pulseCounts(data.data?.documents || [], Date.now(), span) : null;

  function store(next: PulseKind[]) {
    setHidden(next);
    writeJson(HIDE_KEY, next);
  }

  return (
    <section className="c3-docpulse" aria-label={v3("xpTitle")} data-docpulse="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("xpSub")}</p>
          <h2 className="c3-title">{v3("xpTitle")}</h2>
        </div>
        <p className="c3-muted">{v3("xpWindow")} {span} {v3("xpDays")}</p>
      </header>
      <p className="c3-muted">{v3("xpHint")}</p>
      <div className="c3-row" role="group" aria-label={v3("xpShown")}>
        <button type="button" className="c3-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v3("xpShown")}</button>
        <button type="button" className="c3-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v3("xpHidden")}</button>
      </div>
      {data.loading && !data.data && <p className="c3-muted">{v3("xpLoading")}</p>}
      {data.error && <p className="c3-muted">{v3("xpFailed")} {tx("failed")}</p>}
      {!kinds.length && <p className="c3-empty">{v3("xpEmpty")}</p>}
      <ul className="c3-docpulse-list">
        {kinds.map((kind) => (
          <li key={kind} className="c3-docpulse-card" data-kind={kind}>
            <p className="c3-muted">{v3(KIND_KEY[kind])}</p>
            {counts && <p className="c3-docpulse-count">{counts[kind]}</p>}
            <div className="c3-row">
              <Link className="c3-btn" href={crmv3Href(base, DOC_BOARD)}>{v3("xpOpen")}</Link>
              <button type="button" className="c3-btn" data-docpulse-hide="" onClick={() => store(toggleKind(hidden, kind))}>{showHidden ? v3("xpShow") : v3("xpHide")}</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
