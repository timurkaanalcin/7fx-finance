"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { OVERVIEW_CARDS, type OverviewCard, type OverviewLayout } from "@/lib/crmv4/round26";
import { loadLayout, storeLayout } from "./round26";
import { commissionRows, type Cash, type Person } from "@/lib/crmv4/round61";
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
} from "@/lib/crmv4/round100";
import { crmv4Href } from "@/lib/crmv4/sections";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const PANEL_LABEL: Record<OverviewCard, CrmV4CopyKey> = {
  alerts: "cardAlerts",
  fx: "cardFx",
  watch: "cardWatch",
  team: "cardTeam",
  pins: "cardPins",
  churn: "cardChurn",
  cities: "cardCities",
  book: "cardBook",
  quality: "cardQuality",
  close: "cardClose",
  backlog: "cardBacklog",
  approvals: "cardApprovals",
  glossary: "cardGlossary",
  news: "cardNews",
  mix: "cardMix",
  tasks: "cardTasks",
  stream: "cardStream",
  ib: "cardIb",
  roi: "cardRoi",
  campaigns: "cardCampaigns",
  agents: "cardAgents",
  heat: "cardHeat",
  workload: "cardWorkload",
  lists: "cardLists",
  queue: "cardQueue",
  merge: "cardMerge",
  staff: "cardStaff",
  insights: "cardInsights",
  create: "cardCreate",
  charts: "cardCharts",
  boards: "cardBoards",
  symbols: "cardSymbols",
  age: "cardAge",
  movers: "cardMovers",
  exposure: "cardExposure",
  recent: "cardRecent",
};

type GlanceRow = StatusRow & { id: string; userId: string };

function publish(lock: DeskLock, layout: OverviewLayout) {
  writeJson(LOCK_KEY, lock);
  storeLayout(shownLayout(lock, layout));
  window.dispatchEvent(new Event("crmv4:layout-lock"));
}

export function LayoutLock({ v4 }: { v4: V4 }) {
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
  const names = Object.fromEntries(layout.order.map((id) => [id, v4(PANEL_LABEL[id])])) as Record<string, string>;
  const shown = matchingPanels(layout, query, names);
  const visibleCount = layout.order.filter((id) => !layout.hidden.includes(id)).length;

  function edit(next: OverviewLayout) {
    const applied = changeLayout(lock, next);
    setLayout(applied);
    if (!lock.locked) publish(lock, applied);
  }

  return (
    <section className="c4-layout-lock" aria-label={v4("lxTitle")} data-layout-lock="1" data-locked={lock.locked ? "1" : "0"}>
      <header className="c4-pay-head">
        <div>
          <p className="c4-lock-logo" data-logo="mono">{v4("lxLogo")}</p>
          <p className="c4-pay-kicker">{v4("lxSub")}</p>
          <h2 className="c4-title">{v4("lxTitle")}</h2>
        </div>
        <p className="c4-meta">{visibleCount}</p>
      </header>
      <p className="c4-meta">{v4("lxHint")}</p>
      <p className="c4-meta">{v4("lxLocal")}</p>
      <p className="c4-meta">{lock.locked ? v4("lxLocked") : v4("lxOpen")}</p>
      {lock.locked && <p className="c4-meta">{v4("lxFrozen")}</p>}
      <div className="c4-row">
        {lock.locked ? (
          <button type="button" className="c4-btn" onClick={() => {
            const next = unlockDesk(lock);
            setLock(next);
            publish(next, layout);
          }}>{v4("lxUnlock")}</button>
        ) : (
          <button type="button" className="c4-btn" onClick={() => {
            const next = lockDesk(layout);
            setLock(next);
            setLayout(shownLayout(next, layout));
            publish(next, layout);
          }}>{v4("lxLock")}</button>
        )}
      </div>
      <p className="c4-meta">{v4("lxVisible")} {visibleCount}</p>
      <label className="c4-lab">
        <span>{v4("lxSearch")}</span>
        <input className="c4-field" aria-label={v4("lxSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!shown.length && <p className="c4-pay-empty">{v4("lxEmpty")}</p>}
      <ul className="c4-lock-list">
        {shown.map((id) => {
          const on = !layout.hidden.includes(id);
          const index = layout.order.indexOf(id);
          const name = v4(PANEL_LABEL[id]);
          return (
            <li key={id} className="c4-lock-card" data-panel={id} data-on={on ? "1" : "0"}>
              <p>{name}</p>
              <p className="c4-meta">{on ? v4("lxShown") : v4("lxHidden")}</p>
              <div className="c4-row">
                <button type="button" className="c4-btn" disabled={lock.locked || index <= 0} onClick={() => edit(movePanel(layout, id, -1))}>{v4("lxUp")}</button>
                <button type="button" className="c4-btn" disabled={lock.locked || index < 0 || index >= layout.order.length - 1} onClick={() => edit(movePanel(layout, id, 1))}>{v4("lxDown")}</button>
                <button type="button" className="c4-btn" disabled={lock.locked} onClick={() => edit(togglePanel(layout, id))}>{on ? v4("lxHidden") : v4("lxShown")}</button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function IbStatusGlance({ base, v4 }: { base: string; v4: V4 }) {
  const people = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const deposits = useJson<{ requests?: Cash[] }>("/api/admin/deposits?take=40");
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
    <section className="c4-ib-status" aria-label={v4("bxTitle")} data-ib-status="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-pay-kicker">{v4("bxSub")}</p>
          <h2 className="c4-title">{v4("bxTitle")}</h2>
        </div>
        <p className="c4-meta">{chips.length}</p>
      </header>
      <p className="c4-meta">{v4("bxHint")}</p>
      <p className="c4-meta">{v4("bxLocal")}</p>
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "ibpay")}>{v4("bxBoard")}</Link>
      </p>
      {loading && !rows.length && <p className="c4-meta">{v4("bxLoading")}</p>}
      {failed && !rows.length && <p className="c4-meta">{v4("bxFailed")}</p>}
      {!loading && !failed && !rows.length && <p className="c4-pay-empty">{v4("bxNone")}</p>}
      {blankCount > 0 && (
        <button type="button" className="c4-ib-blank" data-on={blank ? "1" : "0"} aria-pressed={blank} onClick={() => { setBlank((value) => !value); setSelected(""); }}>
          <span>{v4("bxBlank")}</span>
          <span className="c4-meta">{blankCount}</span>
        </button>
      )}
      <div className="c4-row" role="group" aria-label={v4("bxShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("bxShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("bxHidden")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("bxTitle")}>
        <button type="button" className="c4-chip" data-on={!status && !blank ? "1" : "0"} aria-pressed={!status && !blank} onClick={() => { setSelected(""); setBlank(false); }}>{v4("bxAll")}</button>
        {chips.map((item) => {
          const count = lines.find((line) => line.status === item)?.count || 0;
          return (
            <span key={item} className="c4-ib-pair" data-status={item}>
              <button type="button" className="c4-chip" data-on={status === item ? "1" : "0"} aria-pressed={status === item} onClick={() => { setBlank(false); setSelected(status === item ? "" : item); }}>{item} {count}</button>
              <button type="button" className="c4-btn" onClick={() => store(toggleStatus(hiddenStatuses, item, present), showHidden ? "" : item)}>{showHidden ? v4("bxShow") : v4("bxHide")}</button>
            </span>
          );
        })}
      </div>
      <label className="c4-lab">
        <span>{v4("bxSearch")}</span>
        <input className="c4-field" aria-label={v4("bxSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c4-pay-empty">{v4("bxEmpty")}</p>}
      <ul className="c4-ib-rows">
        {shown.map((row) => {
          const name = statusText(row.status);
          return (
            <li key={row.id} data-status={name || "blank"}>
              <p>{row.label || row.id}</p>
              <p className="c4-meta">{name || v4("bxBlank")}</p>
              <Link className="c4-btn" href={crmv4Href(base, `customers/${row.userId}`)}>{v4("bxCustomer")}</Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
