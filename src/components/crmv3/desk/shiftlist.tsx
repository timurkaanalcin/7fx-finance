"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readJson, writeJson } from "@/lib/crmv3/bridge";
import type { CrmV3CopyKey } from "@/lib/crmv3/copy";
import { crmv3Href } from "@/lib/crmv3/sections";
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
} from "@/lib/crmv3/shiftlist";
import { useJson, type Tx } from "../kit";
import { useV3 } from "./store";

const KIND_KEY: Record<GlanceKind, CrmV3CopyKey> = {
  deposits: "gcDeposits",
  withdrawals: "gcWithdrawals",
  trades: "gcTrades",
};

type ListState = { data: { requests?: QueueRow[]; orders?: QueueRow[] } | null; error: string; loading: boolean };

function rowsOf(kind: GlanceKind, state: ListState): QueueRow[] {
  if (kind === "trades") return state.data?.orders || [];
  return state.data?.requests || [];
}

export function ShiftCheck() {
  const v3 = useV3();
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
    <section className="c3-shift-check" aria-label={v3("sfTitle")} data-shift-check="1" data-day={list.day}>
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("sfSub")}</p>
          <h2 className="c3-title">{v3("sfTitle")}</h2>
        </div>
        <p className="c3-muted">{v3("sfProgress")} {done}/{list.steps.length}</p>
      </header>
      <p className="c3-muted">{v3("sfHint")}</p>
      <p className="c3-muted">{v3("sfLocal")} · {list.day}</p>
      <div className="c3-row">
        <label className="c3-lab">
          <span>{v3("sfLabel")}</span>
          <input className="c3-field" aria-label={v3("sfLabel")} value={label} onChange={(event) => setLabel(event.target.value)} />
        </label>
        <button type="button" className="c3-btn" onClick={() => {
          const next = addStep(list, { id: `step-${Date.now()}`, label });
          if (next === list) return;
          store(next);
          setLabel("");
        }}>{v3("sfAdd")}</button>
      </div>
      <p className="c3-muted">{v3("sfBlank")}</p>
      <label className="c3-lab">
        <span>{v3("sfSearch")}</span>
        <input className="c3-field" aria-label={v3("sfSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!shown.length && <p className="c3-empty">{v3("sfEmpty")}</p>}
      <ul className="c3-shift-list">
        {shown.map((step) => (
          <li key={step.id} className="c3-shift-card" data-done={step.done ? "1" : "0"}>
            <p>{step.label}</p>
            <button type="button" className="c3-btn" data-shift-done="" aria-pressed={step.done} onClick={() => store(toggleStep(list, step.id))}>{step.done ? v3("sfUndo") : v3("sfDone")}</button>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function LedgerGlance({ base, tx }: { base: string; tx: Tx }) {
  const v3 = useV3();
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
    <section className="c3-glance-strip" aria-label={v3("gcTitle")} data-glance-strip="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("gcSub")}</p>
          <h2 className="c3-title">{v3("gcTitle")}</h2>
        </div>
      </header>
      <p className="c3-muted">{v3("gcHint")}</p>
      <div className="c3-row" role="group" aria-label={v3("gcShown")}>
        <button type="button" className="c3-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v3("gcShown")}</button>
        <button type="button" className="c3-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v3("gcHidden")}</button>
      </div>
      {!kinds.length && <p className="c3-empty">{v3("gcEmpty")}</p>}
      <ul className="c3-glance-list">
        {kinds.map((kind) => {
          const state = lists[kind];
          const ready = !state.loading && !state.error;
          const split = ready ? splitCounts(rowsOf(kind, state), kind) : null;
          return (
            <li key={kind} className="c3-glance-card" data-kind={kind}>
              <p className="c3-muted">{v3(KIND_KEY[kind])}</p>
              {state.loading && !state.data && <p className="c3-muted">{v3("gcLoading")}</p>}
              {state.error && <p className="c3-muted">{v3("gcFailed")} {tx("failed")}</p>}
              {split && (
                <p className="c3-glance-count">
                  <span>{v3("gcPending")} {split.pending}</span>
                  <span>{v3("gcSettled")} {split.settled}</span>
                </p>
              )}
              <div className="c3-row">
                <Link className="c3-btn" href={crmv3Href(base, GLANCE_BOARDS[kind])}>{v3("gcOpen")}</Link>
                <button type="button" className="c3-btn" data-glance-hide="" onClick={() => store(toggleKind(hidden, kind))}>{showHidden ? v3("gcShow") : v3("gcHide")}</button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
