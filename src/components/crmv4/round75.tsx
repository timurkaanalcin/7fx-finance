"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import {
  GLANCE_BOARDS,
  GLANCE_LISTS,
  HIDE_KEY,
  LIST_KEY,
  addStep,
  readKinds,
  readShift,
  splitCounts,
  toggleKind,
  toggleStep,
  utcDay,
  visibleKinds,
  visibleSteps,
  type GlanceKind,
  type QueueRow,
  type ShiftList,
} from "@/lib/crmv4/round75";
import { crmv4Href } from "@/lib/crmv4/sections";
import { useJson, type Tx } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const KIND_KEY: Record<GlanceKind, CrmV4CopyKey> = {
  deposits: "gcDeposits",
  withdrawals: "gcWithdrawals",
  trades: "gcTrades",
};

type ListState = { data: { requests?: QueueRow[]; orders?: QueueRow[] } | null; error: string; loading: boolean };

function rowsOf(kind: GlanceKind, state: ListState): QueueRow[] {
  if (kind === "trades") return state.data?.orders || [];
  return state.data?.requests || [];
}

export function ShiftCheck({ v4 }: { v4: V4 }) {
  const today = utcDay();
  const [list, setList] = useState<ShiftList>({ day: today, steps: [] });
  const [label, setLabel] = useState("");
  const [query, setQuery] = useState("");
  useEffect(() => {
    const next = readShift(readJson(LIST_KEY, null), utcDay());
    setList(next);
    writeJson(LIST_KEY, next);
  }, []);
  const shown = visibleSteps(list.steps, query);
  const done = list.steps.filter((step) => step.done).length;

  function store(next: ShiftList) {
    setList(next);
    writeJson(LIST_KEY, next);
  }

  return (
    <section className="c4-shift-check" aria-label={v4("sfTitle")} data-shift-check="1" data-day={list.day}>
      <header className="c4-pay-head">
        <div>
          <p className="c4-pay-kicker">{v4("sfSub")}</p>
          <h2 className="c4-title">{v4("sfTitle")}</h2>
        </div>
        <p className="c4-meta">{v4("sfProgress")} {done}/{list.steps.length}</p>
      </header>
      <p className="c4-meta">{v4("sfHint")}</p>
      <p className="c4-meta">{v4("sfLocal")} · {list.day}</p>
      <form className="c4-row" onSubmit={(event) => {
        event.preventDefault();
        const next = addStep(list, { id: `step-${Date.now()}`, label });
        if (next === list) return;
        store(next);
        setLabel("");
      }}>
        <label className="c4-lab">
          <span>{v4("sfLabel")}</span>
          <input className="c4-field" aria-label={v4("sfLabel")} value={label} onChange={(event) => setLabel(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn">{v4("sfAdd")}</button>
      </form>
      <p className="c4-meta">{v4("sfBlank")}</p>
      <label className="c4-lab">
        <span>{v4("sfSearch")}</span>
        <input className="c4-field" aria-label={v4("sfSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!shown.length && <p className="c4-pay-empty">{v4("sfEmpty")}</p>}
      <ul className="c4-shift-list">
        {shown.map((step) => (
          <li key={step.id} className="c4-shift-card" data-done={step.done ? "1" : "0"}>
            <p>{step.label}</p>
            <button type="button" className="c4-btn" data-shift-done="" aria-pressed={step.done} onClick={() => store(toggleStep(list, step.id))}>{step.done ? v4("sfUndo") : v4("sfDone")}</button>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function LedgerGlance({ base, v4, tx }: { base: string; v4: V4; tx: Tx }) {
  const deposits = useJson<{ requests?: QueueRow[] }>(GLANCE_LISTS.deposits);
  const withdrawals = useJson<{ requests?: QueueRow[] }>(GLANCE_LISTS.withdrawals);
  const trades = useJson<{ orders?: QueueRow[] }>(GLANCE_LISTS.trades);
  const lists: Record<GlanceKind, ListState> = { deposits, withdrawals, trades };
  const [hidden, setHidden] = useState<GlanceKind[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  useEffect(() => { setHidden(readKinds(readJson(HIDE_KEY, []))); }, []);
  const kinds = visibleKinds(hidden, showHidden);

  function store(next: GlanceKind[]) {
    setHidden(next);
    writeJson(HIDE_KEY, next);
  }

  return (
    <section className="c4-glance-strip" aria-label={v4("gcTitle")} data-glance-strip="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-pay-kicker">{v4("gcSub")}</p>
          <h2 className="c4-title">{v4("gcTitle")}</h2>
        </div>
      </header>
      <p className="c4-meta">{v4("gcHint")}</p>
      <div className="c4-row" role="group" aria-label={v4("gcShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("gcShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("gcHidden")}</button>
      </div>
      {!kinds.length && <p className="c4-pay-empty">{v4("gcEmpty")}</p>}
      <ul className="c4-glance-list">
        {kinds.map((kind) => {
          const state = lists[kind];
          const ready = !state.loading && !state.error;
          const split = ready ? splitCounts(rowsOf(kind, state), kind) : null;
          return (
            <li key={kind} className="c4-glance-card" data-kind={kind}>
              <p className="c4-meta">{v4(KIND_KEY[kind])}</p>
              {state.loading && !state.data && <p className="c4-meta">{v4("gcLoading")}</p>}
              {state.error && <p className="c4-meta">{v4("gcFailed")} {tx("failed")}</p>}
              {split && (
                <p className="c4-glance-count">
                  <span>{v4("gcPending")} {split.pending}</span>
                  <span>{v4("gcSettled")} {split.settled}</span>
                </p>
              )}
              <div className="c4-row">
                <Link className="c4-btn" href={crmv4Href(base, GLANCE_BOARDS[kind])}>{v4("gcOpen")}</Link>
                <button type="button" className="c4-btn" data-glance-hide="" onClick={() => store(toggleKind(hidden, kind))}>{showHidden ? v4("gcShow") : v4("gcHide")}</button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
