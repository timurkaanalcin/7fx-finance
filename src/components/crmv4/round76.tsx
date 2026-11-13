"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { WINDOW_KEY, type DocRow } from "@/lib/crmv4/round62";
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
} from "@/lib/crmv4/round76";
import { crmv4Href } from "@/lib/crmv4/sections";
import { useJson, type Tx } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = { id: string; name?: string | null; email?: string | null };

const KIND_KEY: Record<PulseKind, CrmV4CopyKey> = {
  expired: "xpExpired",
  soon: "xpSoon",
};

export function PriorityLane({ base, v4 }: { base: string; v4: V4 }) {
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
    <section className="c4-lane-pad c4-lane-folio" aria-label={v4("lnTitle")} data-lane-pad="1" data-desk="folio">
      <header className="c4-lane-folio-mast">
        <p className="c4-lane-folio-seal" data-logo="mono">7FX</p>
        <div className="c4-lane-folio-copy">
          <p className="c4-lane-folio-kicker">{v4("clnFolioKicker")}</p>
          <h2 className="c4-title c4-lane-folio-title">{v4("lnTitle")}</h2>
          <p className="c4-lane-folio-lead">{v4("clnFolioLead")}</p>
        </div>
        <p className="c4-lane-folio-count">{shown.length}</p>
      </header>
      <ol className="c4-lane-folio-index" aria-label={v4("lnTitle")}>
        <li data-tone="gold">{v4("ptnChampagne")}</li>
        <li data-tone="ink">{v4("ptnGraphite")}</li>
        <li data-tone="ivory">{v4("ptnIvory")}</li>
      </ol>
      <p className="c4-lane-folio-links">
        <Link href={crmv4Href(base, "ptn")}>{v4("ptnTitle")}</Link>
        <Link href={crmv4Href(base, "swatches")}>{v4("swTitle")}</Link>
      </p>
      <p className="c4-meta">{v4("lnHint")}</p>
      <p className="c4-meta">{v4("lnLocal")}</p>
      {!data.loading && !data.error && !loaded.length && <p className="c4-pay-empty c4-lane-folio-empty">{v4("lnNone")}</p>}
      <form className="c4-row" onSubmit={(event) => {
        event.preventDefault();
        const next = addLane(items, customerId, loaded.map((person) => person.id));
        if (next.length === items.length) return;
        store(next);
        setCustomerId("");
      }}>
        <label className="c4-lab">
          <span>{v4("lnCustomer")}</span>
          <select className="c4-select" aria-label={v4("lnCustomer")} value={customerId} onChange={(event) => setCustomerId(event.target.value)}>
            <option value="">{v4("lnCustomer")}</option>
            {loaded.map((person) => <option key={person.id} value={person.id}>{person.name || person.email || person.id}</option>)}
          </select>
        </label>
        <button type="submit" className="c4-btn">{v4("lnAdd")}</button>
      </form>
      <p className="c4-meta">{v4("lnBlank")}</p>
      <div className="c4-row" role="group" aria-label={v4("lnShown")}>
        <button type="button" className="c4-chip" data-on={hidden ? "0" : "1"} aria-pressed={!hidden} onClick={() => setHidden(false)}>{v4("lnShown")}</button>
        <button type="button" className="c4-chip" data-on={hidden ? "1" : "0"} aria-pressed={hidden} onClick={() => setHidden(true)}>{v4("lnHidden")}</button>
      </div>
      {!shown.length && <p className="c4-pay-empty c4-lane-folio-empty">{v4("lnEmpty")}</p>}
      <ol className="c4-lane-list c4-lane-folio-list">
        {shown.map((item, index) => (
          <li key={item.id} className="c4-lane-card" data-pinned={item.pinned ? "1" : "0"}>
            <p>{index + 1}. {names[item.id] || item.id}</p>
            <div className="c4-row">
              <Link className="c4-btn" href={crmv4Href(base, `customers/${item.id}`)}>{v4("lnOpen")}</Link>
              {!item.hidden && <button type="button" className="c4-btn" data-lane-up="" onClick={() => store(moveLane(items, item.id, -1))}>{v4("lnUp")}</button>}
              {!item.hidden && <button type="button" className="c4-btn" data-lane-down="" onClick={() => store(moveLane(items, item.id, 1))}>{v4("lnDown")}</button>}
              <button type="button" className="c4-btn" onClick={() => store(toggleLanePin(items, item.id))}>{item.pinned ? v4("lnUnpin") : v4("lnPin")}</button>
              <button type="button" className="c4-btn" onClick={() => store(setLaneHidden(items, item.id, !item.hidden))}>{item.hidden ? v4("lnShow") : v4("lnHide")}</button>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function DocPulse({ base, v4, tx }: { base: string; v4: V4; tx: Tx }) {
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
    <section className="c4-docpulse c4-proof-loft" aria-label={v4("xpTitle")} data-docpulse="1" data-desk="loft">
      <header className="c4-proof-loft-mast">
        <p className="c4-proof-loft-seal" data-logo="mono">7FX</p>
        <div>
          <p className="c4-proof-loft-kicker">{v4("xpLoftKicker")}</p>
          <p className="c4-pay-kicker">{v4("xpSub")}</p>
          <h2 className="c4-title c4-proof-loft-title">{v4("xpTitle")}</h2>
          <p className="c4-proof-loft-lead">{v4("xpLoftLead")}</p>
        </div>
        <p className="c4-proof-loft-count">{v4("xpWindow")} {span} {v4("xpDays")}</p>
      </header>
      <ol className="c4-proof-loft-index" aria-label={v4("xpTitle")}>
        <li data-tone="gold">{v4("xpLoftGold")}</li>
        <li data-tone="ink">{v4("xpLoftInk")}</li>
        <li data-tone="ivory">{v4("xpLoftIvory")}</li>
      </ol>
      <p className="c4-meta c4-proof-loft-hint">{v4("xpHint")}</p>
      <div className="c4-row c4-proof-loft-tools" role="group" aria-label={v4("xpShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("xpShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("xpHidden")}</button>
      </div>
      {data.loading && !data.data && <p className="c4-meta">{v4("xpLoading")}</p>}
      {data.error && <p className="c4-meta">{v4("xpFailed")} {tx("failed")}</p>}
      {!kinds.length && <p className="c4-pay-empty c4-proof-loft-empty">{v4("xpEmpty")}</p>}
      <ul className="c4-docpulse-list c4-proof-loft-list">
        {kinds.map((kind) => (
          <li key={kind} className="c4-docpulse-card c4-proof-loft-card" data-kind={kind}>
            <span className="c4-proof-loft-pip" data-kind={kind} aria-hidden="true" />
            <p className="c4-proof-loft-kind">{v4(KIND_KEY[kind])}</p>
            {counts && <p className="c4-docpulse-count c4-proof-loft-figure">{counts[kind]}</p>}
            <div className="c4-row">
              <Link className="c4-btn" href={crmv4Href(base, DOC_BOARD)}>{v4("xpOpen")}</Link>
              <button type="button" className="c4-btn" data-docpulse-hide="" onClick={() => store(toggleKind(hidden, kind))}>{showHidden ? v4("xpShow") : v4("xpHide")}</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
