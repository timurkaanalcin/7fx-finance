"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
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
} from "@/lib/crmv4/round72";
import { CRM_V4_SECTIONS, crmv4Href } from "@/lib/crmv4/sections";
import { useJson, type Tx } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const KIND_KEY: Record<PulseKind, CrmV4CopyKey> = {
  deposits: "puDeposits",
  withdrawals: "puWithdrawals",
  documents: "puDocuments",
};

const COLOR_KEY: Record<Swatch, CrmV4CopyKey> = {
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

export function QueuePulse({ base, v4, tx }: { base: string; v4: V4; tx: Tx }) {
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
    <section className="c4-pulse-strip" aria-label={v4("puTitle")} data-pulse-strip="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-pay-kicker">{v4("puSub")}</p>
          <h2 className="c4-title">{v4("puTitle")}</h2>
        </div>
      </header>
      <p className="c4-meta">{v4("puHint")}</p>
      <div className="c4-row" role="group" aria-label={v4("puShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("puShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("puHidden")}</button>
      </div>
      {!kinds.length && <p className="c4-pay-empty">{v4("puEmpty")}</p>}
      <ul className="c4-pulse-list">
        {kinds.map((kind) => {
          const state = lists[kind];
          const ready = !state.loading && !state.error;
          const count = ready ? pendingCount(rowsOf(kind, state)) : null;
          return (
            <li key={kind} className="c4-pulse-card" data-kind={kind}>
              <p className="c4-meta">{v4(KIND_KEY[kind])}</p>
              {state.loading && !state.data && <p className="c4-meta">{v4("puLoading")}</p>}
              {state.error && <p className="c4-meta">{v4("puFailed")} {tx("failed")}</p>}
              {count != null && <p className="c4-pulse-count">{count}</p>}
              <div className="c4-row">
                <Link className="c4-btn" href={crmv4Href(base, PULSE_BOARDS[kind])}>{v4("puOpen")}</Link>
                <button type="button" className="c4-btn" data-pulse-hide="" onClick={() => store(toggleKind(hidden, kind))}>{showHidden ? v4("puShow") : v4("puHide")}</button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function RouteSwatches({ base, v4 }: { base: string; v4: V4 }) {
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
    <section className="c4-swatch-pad" aria-label={v4("swTitle")} data-swatch-pad="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-pay-kicker">{v4("swSub")}</p>
          <h2 className="c4-title">{v4("swTitle")}</h2>
        </div>
        <p className="c4-meta">{shown.length}</p>
      </header>
      <p className="c4-meta">{v4("swHint")}</p>
      <p className="c4-meta">{v4("swLocal")}</p>
      <form className="c4-swatch-form" onSubmit={(event) => {
        event.preventDefault();
        const next = addTag(tags, { id: `tag-${Date.now()}`, label, color, route, at: new Date().toISOString() });
        if (next.length === tags.length) return;
        store(next);
        setLabel("");
      }}>
        <label className="c4-lab">
          <span>{v4("swLabel")}</span>
          <input className="c4-field" aria-label={v4("swLabel")} value={label} onChange={(event) => setLabel(event.target.value)} />
        </label>
        <div className="c4-row" role="group" aria-label={v4("swColor")}>
          {SWATCHES.map((item) => (
            <button key={item} type="button" className="c4-swatch" data-color={item} data-on={color === item ? "1" : "0"} aria-pressed={color === item} onClick={() => setColor(item)}>
              <span className="c4-swatch-dot" data-color={item} />
              {v4(COLOR_KEY[item])}
            </button>
          ))}
        </div>
        <label className="c4-lab">
          <span>{v4("swRoute")}</span>
          <select className="c4-select" aria-label={v4("swRoute")} value={route} onChange={(event) => setRoute(event.target.value)}>
            {CRM_V4_SECTIONS.map((item) => <option key={item.id} value={item.id}>{item.id}</option>)}
          </select>
        </label>
        <button type="submit" className="c4-btn">{v4("swAdd")}</button>
      </form>
      <p className="c4-meta">{v4("swBlank")}</p>
      <label className="c4-lab">
        <span>{v4("swSearch")}</span>
        <input className="c4-field" aria-label={v4("swSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c4-row" role="group" aria-label={v4("swAll")}>
        <button type="button" className="c4-chip" data-on={hidden ? "0" : "1"} aria-pressed={!hidden} onClick={() => setHidden(false)}>{v4("swAll")}</button>
        <button type="button" className="c4-chip" data-on={hidden ? "1" : "0"} aria-pressed={hidden} onClick={() => setHidden(true)}>{v4("swHidden")}</button>
      </div>
      {!shown.length && <p className="c4-pay-empty">{v4("swEmpty")}</p>}
      <ul className="c4-swatch-list">
        {shown.map((tag) => (
          <li key={tag.id} className="c4-swatch-card" data-color={tag.color} data-pinned={tag.pinned ? "1" : "0"}>
            <p><span className="c4-swatch-dot" data-color={tag.color} /> {tag.label}</p>
            <p className="c4-meta">{v4(COLOR_KEY[tag.color])} · {tag.route}</p>
            <div className="c4-row">
              <Link className="c4-btn" href={crmv4Href(base, routePath(tag.route))}>{v4("swOpen")}</Link>
              <button type="button" className="c4-btn" onClick={() => store(toggleTagPin(tags, tag.id))}>{tag.pinned ? v4("swUnpin") : v4("swPin")}</button>
              <button type="button" className="c4-btn" onClick={() => store(setTagHidden(tags, tag.id, !tag.hidden))}>{tag.hidden ? v4("swShow") : v4("swHide")}</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
