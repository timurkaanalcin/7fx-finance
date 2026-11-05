"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readJson, writeJson } from "@/lib/crmv3/bridge";
import type { CrmV3CopyKey } from "@/lib/crmv3/copy";
import { OVERVIEW_CARDS, type OverviewCard, type OverviewLayout } from "@/lib/crmv3/line";
import { commissionRows, type Cash, type Person } from "@/lib/crmv3/introducer";
import {
  IB_STATUS_KEY,
  LOCK_KEY,
  activeStatus,
  changeLayout,
  lockDesk,
  matchingPanels,
  movePanel,
  namedStatuses,
  readHiddenStatuses,
  readLock,
  shownLayout,
  statusLines,
  statusText,
  togglePanel,
  toggleStatus,
  unlockDesk,
  visibleIntroducers,
  visibleStatuses,
  type DeskLock,
  type StatusRow,
} from "@/lib/crmv3/desklock";
import { crmv3Href } from "@/lib/crmv3/sections";
import { useJson } from "../kit";
import { loadLayout, storeLayout } from "./line";
import { useV3 } from "./store";

const USERS = "/api/admin/users?take=40&meta=0&role=TRADER";
const DEPOSITS = "/api/admin/deposits?take=40";

const PANEL_LABEL: Record<OverviewCard, CrmV3CopyKey> = {
  rules: "alertCenter",
  fx: "fxDesk",
  goal: "deskGoal",
  funnel: "funnelLeads",
  tasks: "myDay",
  churn: "churnRisk",
  pins: "pinnedList",
  cities: "countryHeat",
  book: "deskBoard",
  workload: "workloadWord",
  heat: "hourHeat",
  watch: "watchTitle",
  team: "teamBoard",
};

type GlanceRow = StatusRow & { id: string; userId: string };

function publish(lock: DeskLock, layout: OverviewLayout) {
  writeJson(LOCK_KEY, lock);
  storeLayout(shownLayout(lock, layout));
  window.dispatchEvent(new Event("crmv3:layout-lock"));
}

export function LayoutLock() {
  const v3 = useV3();
  const [lock, setLock] = useState<DeskLock>({ locked: false, order: [...OVERVIEW_CARDS], hidden: [] });
  const [layout, setLayout] = useState<OverviewLayout>({ order: [...OVERVIEW_CARDS], hidden: [] });
  const [query, setQuery] = useState("");
  useEffect(() => {
    const savedLock = readLock(readJson(LOCK_KEY, null));
    const saved = loadLayout();
    const next = shownLayout(savedLock, saved);
    setLock(savedLock);
    setLayout(next);
    writeJson(LOCK_KEY, savedLock);
  }, []);
  const names = Object.fromEntries(layout.order.map((id) => [id, v3(PANEL_LABEL[id])])) as Record<string, string>;
  const shown = matchingPanels(layout, query, names);
  const visibleCount = layout.order.filter((id) => !layout.hidden.includes(id)).length;

  function edit(next: OverviewLayout) {
    const applied = changeLayout(lock, next);
    setLayout(applied);
    if (!lock.locked) publish(lock, applied);
  }

  return (
    <section className="c3-layout-lock" aria-label={v3("lxTitle")} data-layout-lock="1" data-locked={lock.locked ? "1" : "0"}>
      <header className="c3-pay-head">
        <div>
          <p className="c3-lock-logo" data-logo="mono">{v3("lxLogo")}</p>
          <p className="c3-kicker">{v3("lxSub")}</p>
          <h2 className="c3-title">{v3("lxTitle")}</h2>
        </div>
        <p className="c3-muted">{visibleCount}</p>
      </header>
      <p className="c3-muted">{v3("lxHint")}</p>
      <p className="c3-muted">{v3("lxLocal")}</p>
      <p className="c3-muted">{lock.locked ? v3("lxLocked") : v3("lxOpen")}</p>
      {lock.locked && <p className="c3-muted">{v3("lxFrozen")}</p>}
      <div className="c3-row">
        {lock.locked ? (
          <button type="button" className="c3-btn" onClick={() => {
            const next = unlockDesk(lock);
            setLock(next);
            publish(next, layout);
          }}>{v3("lxUnlock")}</button>
        ) : (
          <button type="button" className="c3-btn" onClick={() => {
            const next = lockDesk(layout);
            setLock(next);
            setLayout(shownLayout(next, layout));
            publish(next, layout);
          }}>{v3("lxLock")}</button>
        )}
      </div>
      <p className="c3-muted">{v3("lxVisible")} {visibleCount}</p>
      <label className="c3-lab">
        <span>{v3("lxSearch")}</span>
        <input className="c3-field" aria-label={v3("lxSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!shown.length && <p className="c3-empty">{v3("lxEmpty")}</p>}
      <ul className="c3-lock-list">
        {shown.map((id) => {
          const on = !layout.hidden.includes(id);
          const index = layout.order.indexOf(id);
          const name = v3(PANEL_LABEL[id]);
          return (
            <li key={id} className="c3-lock-card" data-panel={id} data-on={on ? "1" : "0"}>
              <p>{name}</p>
              <p className="c3-muted">{on ? v3("lxShown") : v3("lxHidden")}</p>
              <div className="c3-row">
                <button type="button" className="c3-btn" disabled={lock.locked || index <= 0} onClick={() => edit(movePanel(layout, id, -1))}>{v3("lxUp")}</button>
                <button type="button" className="c3-btn" disabled={lock.locked || index < 0 || index >= layout.order.length - 1} onClick={() => edit(movePanel(layout, id, 1))}>{v3("lxDown")}</button>
                <button type="button" className="c3-btn" disabled={lock.locked} onClick={() => edit(togglePanel(layout, id))}>{on ? v3("lxHidden") : v3("lxShown")}</button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function IbStatusGlance({ base }: { base: string }) {
  const v3 = useV3();
  const people = useJson<{ users?: Person[] }>(USERS);
  const deposits = useJson<{ requests?: Cash[] }>(DEPOSITS);
  const [hiddenStatuses, setHiddenStatuses] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [blank, setBlank] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [query, setQuery] = useState("");
  const rows = commissionRows(people.data?.users || [], deposits.data?.requests || []).map((row): GlanceRow => ({
    id: row.id,
    status: row.status,
    label: `${row.affiliate} ${row.name}`.trim(),
    userId: row.userId,
  }));
  const lines = statusLines(rows);
  const present = namedStatuses(rows);
  const presentKey = present.join("\n");
  const blankCount = lines.find((line) => !line.status)?.count || 0;
  const loading = (people.loading && !people.data) || (deposits.loading && !deposits.data);
  const failed = Boolean(people.error || deposits.error);
  useEffect(() => {
    if (loading || failed) return;
    const next = readHiddenStatuses(readJson(IB_STATUS_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHiddenStatuses(next);
    writeJson(IB_STATUS_KEY, next);
  }, [loading, failed, presentKey]);
  const chips = visibleStatuses(present, hiddenStatuses, showHidden);
  const status = activeStatus(selected, chips);
  const shown = visibleIntroducers(rows, status, blank, query);

  function store(next: string[], clear: string) {
    setHiddenStatuses(next);
    writeJson(IB_STATUS_KEY, next);
    if (clear && activeStatus(selected, [clear])) setSelected("");
  }

  return (
    <section className="c3-ib-status" aria-label={v3("bxTitle")} data-ib-status="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("bxSub")}</p>
          <h2 className="c3-title">{v3("bxTitle")}</h2>
        </div>
        <p className="c3-muted">{chips.length}</p>
      </header>
      <p className="c3-muted">{v3("bxHint")}</p>
      <p className="c3-muted">{v3("bxLocal")}</p>
      <p className="c3-row">
        <Link className="c3-btn" href={crmv3Href(base, "ibpay")}>{v3("bxBoard")}</Link>
      </p>
      {loading && !rows.length && <p className="c3-muted">{v3("bxLoading")}</p>}
      {failed && !rows.length && <p className="c3-muted">{v3("bxFailed")}</p>}
      {!loading && !failed && !rows.length && <p className="c3-empty">{v3("bxNone")}</p>}
      {blankCount > 0 && (
        <button type="button" className="c3-ib-blank" data-on={blank ? "1" : "0"} aria-pressed={blank} onClick={() => { setBlank((value) => !value); setSelected(""); }}>
          <span>{v3("bxBlank")}</span>
          <span className="c3-muted">{blankCount}</span>
        </button>
      )}
      <div className="c3-row" role="group" aria-label={v3("bxShown")}>
        <button type="button" className="c3-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v3("bxShown")}</button>
        <button type="button" className="c3-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v3("bxHidden")}</button>
      </div>
      <div className="c3-row" role="group" aria-label={v3("bxTitle")}>
        <button type="button" className="c3-chip" data-on={!status && !blank ? "1" : "0"} aria-pressed={!status && !blank} onClick={() => { setSelected(""); setBlank(false); }}>{v3("bxAll")}</button>
        {chips.map((item) => {
          const count = lines.find((line) => line.status === item)?.count || 0;
          return (
            <span key={item} className="c3-ib-pair" data-status={item}>
              <button type="button" className="c3-chip" data-on={status === item ? "1" : "0"} aria-pressed={status === item} onClick={() => { setBlank(false); setSelected(status === item ? "" : item); }}>{item} {count}</button>
              <button type="button" className="c3-btn" onClick={() => store(toggleStatus(hiddenStatuses, item, present), showHidden ? "" : item)}>{showHidden ? v3("bxShow") : v3("bxHide")}</button>
            </span>
          );
        })}
      </div>
      <label className="c3-lab">
        <span>{v3("bxSearch")}</span>
        <input className="c3-field" aria-label={v3("bxSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c3-empty">{v3("bxEmpty")}</p>}
      <ul className="c3-ib-rows">
        {shown.map((row) => {
          const name = statusText(row.status);
          return (
            <li key={row.id} data-status={name || "blank"}>
              <p>{row.label || row.id}</p>
              <p className="c3-muted">{name || v3("bxBlank")}</p>
              <Link className="c3-btn" href={crmv3Href(base, `customers/${row.userId}`)}>{v3("bxCustomer")}</Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
