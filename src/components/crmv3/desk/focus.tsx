"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readJson, writeJson } from "@/lib/crmv3/bridge";
import type { CrmV3CopyKey } from "@/lib/crmv3/copy";
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
} from "@/lib/crmv3/deskfocus";
import { crmv3Href } from "@/lib/crmv3/sections";
import { useJson } from "../kit";
import { useV3 } from "./store";

const PANEL_LABEL: Record<FocusPanel, CrmV3CopyKey> = {
  sections: "fmSections",
  rail: "fmRail",
  tools: "fmTools",
};

const KIND_LABEL: Record<QueueKind, CrmV3CopyKey> = {
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

export function FocusDesk() {
  const v3 = useV3();
  const [hidden, setHidden] = useState<FocusPanel[]>([]);
  const [query, setQuery] = useState("");
  const [showHidden, setShowHidden] = useState(false);
  useEffect(() => { setHidden(readFocus(readJson(FOCUS_KEY, []))); }, []);
  const names: Record<string, string> = {};
  for (const id of FOCUS_PANELS) names[id] = v3(PANEL_LABEL[id]);
  const shown = visiblePanels(hidden, query, showHidden, names);

  function store(next: FocusPanel[]) {
    setHidden(next);
    writeJson(FOCUS_KEY, next);
    window.dispatchEvent(new CustomEvent("crmv3:desk-focus", { detail: next }));
  }

  return (
    <section className="c3-focus-desk" aria-label={v3("fmTitle")} data-focus-desk="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("fmSub")}</p>
          <h2 className="c3-title">{v3("fmTitle")}</h2>
        </div>
        <p className="c3-muted">{shown.length}</p>
      </header>
      <p className="c3-muted">{v3("fmHint")}</p>
      <p className="c3-muted">{v3("fmLocal")}</p>
      <p className="c3-muted">{v3("fmLogo")}</p>
      <p className="c3-muted">{v3("fmPad")}</p>
      <label className="c3-lab">
        <span>{v3("fmSearch")}</span>
        <input className="c3-field" aria-label={v3("fmSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c3-row" role="group" aria-label={v3("fmShown")}>
        <button type="button" className="c3-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v3("fmShown")}</button>
        <button type="button" className="c3-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v3("fmHidden")}</button>
        <button type="button" className="c3-btn" onClick={() => store([])}>{v3("fmAll")}</button>
      </div>
      {!shown.length && <p className="c3-empty">{v3("fmEmpty")}</p>}
      <ul className="c3-focus-list">
        {shown.map((id) => (
          <li key={id} className="c3-focus-card" data-panel={id} data-hidden={hidden.includes(id) ? "1" : "0"}>
            <p>{names[id]}</p>
            <button type="button" className="c3-btn" onClick={() => store(togglePanel(hidden, id))}>{hidden.includes(id) ? v3("fmShow") : v3("fmHide")}</button>
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

export function SupportPulse({ base }: { base: string }) {
  const v3 = useV3();
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
    <section className="c3-queue-pulse" aria-label={v3("qpTitle")} data-queue-pulse="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("qpSub")}</p>
          <h2 className="c3-title">{v3("qpTitle")}</h2>
        </div>
        <p className="c3-muted">{chips.length}</p>
      </header>
      <p className="c3-muted">{v3("qpHint")}</p>
      <p className="c3-muted">{v3("qpLocal")}</p>
      <p className="c3-row">
        <Link className="c3-btn" href={crmv3Href(base, "support")}>{v3("qpBoard")}</Link>
      </p>
      {data.loading && !tickets.length && <p className="c3-muted">{v3("qpLoading")}</p>}
      {data.error && <p className="c3-muted">{v3("qpFailed")}</p>}
      {!data.loading && !data.error && !tickets.length && <p className="c3-empty">{v3("qpNone")}</p>}
      {!data.loading && !present.length && tickets.length > 0 && <p className="c3-empty">{v3("qpEmpty")}</p>}
      <p className="c3-muted" data-queue-split="">{v3("qpOpen")} {split.open} · {v3("qpWaiting")} {split.waiting}</p>
      {others.length > 0 && (
        <ul className="c3-queue-other">
          {others.map((line) => (
            <li key={line.status} data-status={line.status}>
              <span>{v3("qpOther")}</span>
              <span>{line.status}</span>
              <span className="c3-muted">{line.count}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="c3-row" role="group" aria-label={v3("qpShown")}>
        <button type="button" className="c3-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v3("qpShown")}</button>
        <button type="button" className="c3-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v3("qpHidden")}</button>
      </div>
      <div className="c3-row" role="group" aria-label={v3("qpTitle")}>
        <button type="button" className="c3-chip" data-on={kind ? "0" : "1"} aria-pressed={!kind} onClick={() => setSelected("")}>{v3("qpAll")}</button>
        {chips.map((item) => (
          <span key={item} className="c3-queue-pair" data-kind={item}>
            <button type="button" className="c3-chip" data-on={kind === item ? "1" : "0"} aria-pressed={kind === item} onClick={() => setSelected(kind === item ? "" : item)}>{v3(KIND_LABEL[item])}</button>
            <button type="button" className="c3-btn" onClick={() => store(toggleQueue(hiddenKinds, item), showHidden ? "" : item)}>{showHidden ? v3("qpShow") : v3("qpHide")}</button>
          </span>
        ))}
      </div>
      <label className="c3-lab">
        <span>{v3("qpSearch")}</span>
        <input className="c3-field" aria-label={v3("qpSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!shown.length && tickets.length > 0 && (kind || present.length > 0) && <p className="c3-empty">{v3("qpEmpty")}</p>}
      <ul className="c3-queue-rows">
        {shown.map((row) => (
          <li key={row.id} data-status={String(row.status || "").trim().toUpperCase()}>
            <p>{row.label}</p>
            <p className="c3-muted">{String(row.status || "").trim().toUpperCase()}</p>
            {row.userId && <Link className="c3-btn" href={crmv3Href(base, `customers/${row.userId}`)}>{v3("qpCustomer")}</Link>}
          </li>
        ))}
      </ul>
    </section>
  );
}
