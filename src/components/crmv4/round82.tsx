"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import {
  FOCUS_KEY,
  FOCUS_PANELS,
  QUEUE_KEY,
  activeQueue,
  otherStatuses,
  presentQueues,
  queueSplit,
  readFocus,
  readHiddenQueues,
  togglePanel,
  toggleQueue,
  visiblePanels,
  visibleQueues,
  visibleTickets,
  type FocusPanel,
  type QueueKind,
  type QueueRow,
} from "@/lib/crmv4/round82";
import { crmv4Href } from "@/lib/crmv4/sections";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const PANEL_LABEL: Record<FocusPanel, CrmV4CopyKey> = {
  sections: "fmSections",
  rail: "fmRail",
  tools: "fmTools",
};

const KIND_LABEL: Record<QueueKind, CrmV4CopyKey> = {
  open: "qpOpen",
  waiting: "qpWaiting",
};

const TICKETS = "/api/admin/tickets?take=40";

type Ticket = {
  id: string;
  kind?: string | null;
  status?: string | null;
  customer?: string | null;
  customerId?: string | null;
};

type GlanceRow = QueueRow & { id: string; userId: string; kind: string };

export function FocusDesk({ v4 }: { v4: V4 }) {
  const [hidden, setHidden] = useState<FocusPanel[]>([]);
  const [query, setQuery] = useState("");
  const [showHidden, setShowHidden] = useState(false);
  useEffect(() => { setHidden(readFocus(readJson(FOCUS_KEY, []))); }, []);
  const names: Record<string, string> = {};
  for (const id of FOCUS_PANELS) names[id] = v4(PANEL_LABEL[id]);
  const shown = visiblePanels(hidden, query, showHidden, names);

  function store(next: FocusPanel[]) {
    setHidden(next);
    writeJson(FOCUS_KEY, next);
    window.dispatchEvent(new CustomEvent("crmv4:desk-focus", { detail: next }));
  }

  return (
    <section className="c4-focus-desk" aria-label={v4("fmTitle")} data-focus-desk="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-pay-kicker">{v4("fmSub")}</p>
          <h2 className="c4-title">{v4("fmTitle")}</h2>
        </div>
        <p className="c4-meta">{shown.length}</p>
      </header>
      <p className="c4-meta">{v4("fmHint")}</p>
      <p className="c4-meta">{v4("fmLocal")}</p>
      <p className="c4-meta">{v4("fmLogo")}</p>
      <p className="c4-meta">{v4("fmPad")}</p>
      <p className="c4-focus-logo" data-logo="mono" aria-hidden="true">7FX</p>
      <label className="c4-lab">
        <span>{v4("fmSearch")}</span>
        <input className="c4-field" aria-label={v4("fmSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c4-row" role="group" aria-label={v4("fmShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("fmShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("fmHidden")}</button>
        <button type="button" className="c4-btn" onClick={() => store([])}>{v4("fmAll")}</button>
      </div>
      {!shown.length && <p className="c4-pay-empty">{v4("fmEmpty")}</p>}
      <ul className="c4-focus-list">
        {shown.map((id) => (
          <li key={id} className="c4-focus-card" data-panel={id} data-hidden={hidden.includes(id) ? "1" : "0"}>
            <p>{names[id]}</p>
            <button type="button" className="c4-btn" onClick={() => store(togglePanel(hidden, id))}>{hidden.includes(id) ? v4("fmShow") : v4("fmHide")}</button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function asTicket(row: Ticket): GlanceRow | null {
  const id = String(row.id || "").trim();
  if (!id) return null;
  const customer = String(row.customer || "");
  const kind = String(row.kind || "");
  return {
    id,
    label: `${customer} ${kind}`.trim() || id,
    status: String(row.status || ""),
    userId: String(row.customerId || "").trim(),
    kind,
  };
}

export function SupportPulse({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ tickets?: Ticket[] }>(TICKETS);
  const [hiddenKinds, setHiddenKinds] = useState<QueueKind[]>([]);
  const [selected, setSelected] = useState("");
  const [showHidden, setShowHidden] = useState(false);
  const [query, setQuery] = useState("");
  const tickets = (data.data?.tickets || []).map(asTicket).filter((row): row is GlanceRow => Boolean(row));
  const present = presentQueues(tickets);
  const presentKey = present.join(",");
  useEffect(() => {
    if (data.loading || data.error) return;
    const next = readHiddenQueues(readJson(QUEUE_KEY, []));
    setHiddenKinds(next);
    writeJson(QUEUE_KEY, next);
  }, [data.loading, data.error, presentKey]);
  const openKinds = visibleQueues(present, hiddenKinds, false);
  const kind = activeQueue(selected, showHidden ? visibleQueues(present, hiddenKinds, true) : openKinds);
  const chips = visibleQueues(present, hiddenKinds, showHidden);
  const split = queueSplit(tickets);
  const others = otherStatuses(tickets);
  const shown = visibleTickets(tickets, kind, query);

  function store(next: QueueKind[], clear: string) {
    setHiddenKinds(next);
    writeJson(QUEUE_KEY, next);
    if (clear && activeQueue(selected, [clear])) setSelected("");
  }

  return (
    <section className="c4-queue-pulse c4-queue-hall" aria-label={v4("qpTitle")} data-queue-pulse="1" data-desk="hall">
      <header className="c4-queue-hall-mast">
        <p className="c4-queue-hall-seal" data-logo="mono">7FX</p>
        <div>
          <p className="c4-queue-hall-kicker">{v4("qpHallKicker")}</p>
          <h2 className="c4-title c4-queue-hall-title">{v4("qpTitle")}</h2>
          <p className="c4-queue-hall-lead">{v4("qpHallLead")}</p>
        </div>
        <p className="c4-queue-hall-count">{chips.length}</p>
      </header>
      <ol className="c4-queue-hall-index" aria-label={v4("qpTitle")}>
        <li data-tone="gold">{v4("qpOpen")}</li>
        <li data-tone="ink">{v4("qpWaiting")}</li>
        <li data-tone="ivory">{v4("qpAll")}</li>
      </ol>
      <p className="c4-meta">{v4("qpHint")}</p>
      <p className="c4-meta">{v4("qpLocal")}</p>
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "support")}>{v4("qpBoard")}</Link>
      </p>
      {data.loading && !tickets.length && <p className="c4-meta">{v4("qpLoading")}</p>}
      {data.error && <p className="c4-meta">{v4("qpFailed")}</p>}
      {!data.loading && !data.error && !tickets.length && <p className="c4-pay-empty">{v4("qpNone")}</p>}
      {!data.loading && !present.length && tickets.length > 0 && <p className="c4-pay-empty">{v4("qpEmpty")}</p>}
      <p className="c4-meta" data-queue-split="">{v4("qpOpen")} {split.open} · {v4("qpWaiting")} {split.waiting}</p>
      {others.length > 0 && (
        <ul className="c4-queue-other">
          {others.map((line) => (
            <li key={line.status} data-status={line.status}>
              <span>{v4("qpOther")}</span>
              <span>{line.status}</span>
              <span className="c4-meta">{line.count}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="c4-row" role="group" aria-label={v4("qpShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("qpShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("qpHidden")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("qpTitle")}>
        <button type="button" className="c4-chip" data-on={kind ? "0" : "1"} aria-pressed={!kind} onClick={() => setSelected("")}>{v4("qpAll")}</button>
        {chips.map((item) => (
          <span key={item} className="c4-queue-pair" data-kind={item}>
            <button type="button" className="c4-chip" data-on={kind === item ? "1" : "0"} aria-pressed={kind === item} onClick={() => setSelected(kind === item ? "" : item)}>{v4(KIND_LABEL[item])}</button>
            <button type="button" className="c4-btn" onClick={() => store(toggleQueue(hiddenKinds, item), showHidden ? "" : item)}>{showHidden ? v4("qpShow") : v4("qpHide")}</button>
          </span>
        ))}
      </div>
      <label className="c4-lab">
        <span>{v4("qpSearch")}</span>
        <input className="c4-field" aria-label={v4("qpSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!shown.length && tickets.length > 0 && (kind || present.length > 0) && <p className="c4-pay-empty c4-queue-hall-empty">{v4("qpEmpty")}</p>}
      <ul className="c4-queue-rows c4-queue-hall-rows">
        {shown.map((row) => (
          <li key={row.id} className="c4-queue-hall-card" data-status={String(row.status || "").trim().toUpperCase()}>
            <p>{row.label}</p>
            <p className="c4-meta">{String(row.status || "").trim().toUpperCase()}</p>
            {row.userId && <Link className="c4-btn" href={crmv4Href(base, `customers/${row.userId}`)}>{v4("qpCustomer")}</Link>}
          </li>
        ))}
      </ul>
    </section>
  );
}
