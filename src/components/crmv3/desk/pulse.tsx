"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readJson, writeJson } from "@/lib/crmv3/bridge";
import type { CrmV3CopyKey } from "@/lib/crmv3/copy";
import {
  HIDE_KEY,
  PULSE_BOARDS,
  PULSE_LISTS,
  SWATCH_KEY,
  SWATCHES,
  addTag,
  pendingCount,
  readKinds,
  readTags,
  routePath,
  setTagHidden,
  toggleKind,
  toggleTagPin,
  visibleKinds,
  visibleTags,
  type PulseKind,
  type QueueRow,
  type RouteTag,
  type Swatch,
} from "@/lib/crmv3/pulse";
import { CRM_V3_SECTIONS, crmv3Href } from "@/lib/crmv3/sections";
import { useJson, type Tx } from "../kit";
import { useV3 } from "./store";

const KIND_KEY: Record<PulseKind, CrmV3CopyKey> = {
  deposits: "puDeposits",
  withdrawals: "puWithdrawals",
  documents: "puDocuments",
};

const COLOR_KEY: Record<Swatch, CrmV3CopyKey> = {
  ivory: "swIvory",
  champagne: "swChampagne",
  graphite: "swGraphite",
  ink: "swInk",
  paper: "swPaper",
};

type ListState = { data: { requests?: QueueRow[]; documents?: QueueRow[] } | null; error: string; loading: boolean };

function rowsOf(kind: PulseKind, state: ListState): QueueRow[] {
  if (kind === "documents") return state.data?.documents || [];
  return state.data?.requests || [];
}

export function QueuePulse({ base, tx }: { base: string; tx: Tx }) {
  const v3 = useV3();
  const deposits = useJson<{ requests?: QueueRow[] }>(PULSE_LISTS.deposits);
  const withdrawals = useJson<{ requests?: QueueRow[] }>(PULSE_LISTS.withdrawals);
  const documents = useJson<{ documents?: QueueRow[] }>(PULSE_LISTS.documents);
  const lists: Record<PulseKind, ListState> = { deposits, withdrawals, documents };
  const [hidden, setHidden] = useState<PulseKind[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  useEffect(() => { setHidden(readKinds(readJson(HIDE_KEY, []))); }, []);
  const kinds = visibleKinds(hidden, showHidden);

  function store(next: PulseKind[]) {
    setHidden(next);
    writeJson(HIDE_KEY, next);
  }

  return (
    <section className="c3-pulse-strip" aria-label={v3("puTitle")} data-pulse-strip="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("puSub")}</p>
          <h2 className="c3-title">{v3("puTitle")}</h2>
        </div>
      </header>
      <p className="c3-muted">{v3("puHint")}</p>
      <div className="c3-row" role="group" aria-label={v3("puShown")}>
        <button type="button" className="c3-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v3("puShown")}</button>
        <button type="button" className="c3-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v3("puHidden")}</button>
      </div>
      {!kinds.length && <p className="c3-empty">{v3("puEmpty")}</p>}
      <ul className="c3-pulse-list">
        {kinds.map((kind) => {
          const state = lists[kind];
          const ready = !state.loading && !state.error;
          const count = ready ? pendingCount(rowsOf(kind, state)) : null;
          return (
            <li key={kind} className="c3-pulse-card" data-kind={kind}>
              <p className="c3-muted">{v3(KIND_KEY[kind])}</p>
              {state.loading && !state.data && <p className="c3-muted">{v3("puLoading")}</p>}
              {state.error && <p className="c3-muted">{v3("puFailed")} {tx("failed")}</p>}
              {count != null && <p className="c3-pulse-count">{count}</p>}
              <div className="c3-row">
                <Link className="c3-btn" href={crmv3Href(base, PULSE_BOARDS[kind])}>{v3("puOpen")}</Link>
                <button type="button" className="c3-btn" data-pulse-hide="" onClick={() => store(toggleKind(hidden, kind))}>{showHidden ? v3("puShow") : v3("puHide")}</button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function RouteSwatches({ base }: { base: string }) {
  const v3 = useV3();
  const [tags, setTags] = useState<RouteTag[]>([]);
  const [label, setLabel] = useState("");
  const [color, setColor] = useState<Swatch>("champagne");
  const [route, setRoute] = useState("overview");
  const [query, setQuery] = useState("");
  const [hidden, setHidden] = useState(false);
  useEffect(() => { setTags(readTags(readJson(SWATCH_KEY, []))); }, []);
  const shown = visibleTags(tags, query, hidden);

  function store(next: RouteTag[]) {
    setTags(next);
    writeJson(SWATCH_KEY, next);
  }

  return (
    <section className="c3-swatch-pad" aria-label={v3("swTitle")} data-swatch-pad="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("swSub")}</p>
          <h2 className="c3-title">{v3("swTitle")}</h2>
        </div>
        <p className="c3-muted">{shown.length}</p>
      </header>
      <p className="c3-muted">{v3("swHint")}</p>
      <p className="c3-muted">{v3("swLocal")}</p>
      <div className="c3-swatch-form">
        <label className="c3-lab">
          <span>{v3("swLabel")}</span>
          <input className="c3-field" aria-label={v3("swLabel")} value={label} onChange={(event) => setLabel(event.target.value)} />
        </label>
        <div className="c3-row" role="group" aria-label={v3("swColor")}>
          {SWATCHES.map((item) => (
            <button key={item} type="button" className="c3-swatch" data-color={item} data-on={color === item ? "1" : "0"} aria-pressed={color === item} onClick={() => setColor(item)}>
              <span className="c3-swatch-dot" data-color={item} />
              {v3(COLOR_KEY[item])}
            </button>
          ))}
        </div>
        <label className="c3-lab">
          <span>{v3("swRoute")}</span>
          <select className="c3-select" aria-label={v3("swRoute")} value={route} onChange={(event) => setRoute(event.target.value)}>
            {CRM_V3_SECTIONS.map((item) => <option key={item.id} value={item.id}>{item.id}</option>)}
          </select>
        </label>
        <button type="button" className="c3-btn" onClick={() => {
          const next = addTag(tags, { id: `tag-${Date.now()}`, label, color, route, at: new Date().toISOString() });
          if (next.length === tags.length) return;
          store(next);
          setLabel("");
        }}>{v3("swAdd")}</button>
      </div>
      <p className="c3-muted">{v3("swBlank")}</p>
      <label className="c3-lab">
        <span>{v3("swSearch")}</span>
        <input className="c3-field" aria-label={v3("swSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c3-row" role="group" aria-label={v3("swAll")}>
        <button type="button" className="c3-chip" data-on={hidden ? "0" : "1"} aria-pressed={!hidden} onClick={() => setHidden(false)}>{v3("swAll")}</button>
        <button type="button" className="c3-chip" data-on={hidden ? "1" : "0"} aria-pressed={hidden} onClick={() => setHidden(true)}>{v3("swHidden")}</button>
      </div>
      {!shown.length && <p className="c3-empty">{v3("swEmpty")}</p>}
      <ul className="c3-swatch-list">
        {shown.map((tag) => (
          <li key={tag.id} className="c3-swatch-card" data-color={tag.color} data-pinned={tag.pinned ? "1" : "0"}>
            <p><span className="c3-swatch-dot" data-color={tag.color} /> {tag.label}</p>
            <p className="c3-muted">{v3(COLOR_KEY[tag.color])} · {tag.route}</p>
            <div className="c3-row">
              <Link className="c3-btn" href={crmv3Href(base, routePath(tag.route))}>{v3("swOpen")}</Link>
              <button type="button" className="c3-btn" onClick={() => store(toggleTagPin(tags, tag.id))}>{tag.pinned ? v3("swUnpin") : v3("swPin")}</button>
              <button type="button" className="c3-btn" onClick={() => store(setTagHidden(tags, tag.id, !tag.hidden))}>{tag.hidden ? v3("swShow") : v3("swHide")}</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
