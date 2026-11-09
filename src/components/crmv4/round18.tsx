"use client";

import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import {
  behindTarget,
  buildBoard,
  callCounts,
  callPace,
  fundedShare,
  gapTo,
  hideIdle,
  metricValue,
  progressTo,
  rankBoard,
  searchBoard,
  type AgentStat,
  type PerfMetric,
  type PerfTarget,
} from "@/lib/crmv4/round18";
import { ticketAssignee } from "./round3";
import { downloadCsv, useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;
const TARGET_KEY = "crmv4-agent-targets";
const CALL_KEY = "crmv4-call-log";
const METRICS: PerfMetric[] = ["assigned", "funded", "calls", "tickets"];
const LABEL: Record<PerfMetric, CrmV4CopyKey> = {
  assigned: "metricAssigned",
  funded: "metricFunded",
  calls: "metricCalls",
  tickets: "metricTickets",
};
const EMPTY: PerfTarget = { assigned: 0, funded: 0, calls: 0, tickets: 0 };

export function PerfBoard({ v4 }: { v4: V4 }) {
  const workers = useJson<{ workers?: { id: string; name?: string | null; email?: string | null }[] }>("/api/admin/workers?take=30");
  const customers = useJson<{ users?: { id: string; assigneeName?: string | null; ftd?: boolean | null }[] }>("/api/admin/users?take=80&meta=0&role=TRADER");
  const tickets = useJson<{ tickets?: { id: string }[] }>("/api/admin/tickets");
  const [targets, setTargets] = useState<Record<string, PerfTarget>>({});
  const [calls, setCalls] = useState<Record<string, number>>({});
  const [metric, setMetric] = useState<PerfMetric>("assigned");
  const [highFirst, setHighFirst] = useState(true);
  const [query, setQuery] = useState("");
  const [idle, setIdle] = useState(false);
  const [behind, setBehind] = useState(false);
  useEffect(() => {
    setTargets(readJson(TARGET_KEY, {}));
    setCalls(callCounts(readJson<Record<string, unknown[]>>(CALL_KEY, {})));
  }, []);
  const names = (tickets.data?.tickets || []).map((row) => ticketAssignee(row.id)).filter(Boolean);
  const board = behindTarget(
    hideIdle(
      searchBoard(
        rankBoard(buildBoard({
          workers: workers.data?.workers || [],
          customers: customers.data?.users || [],
          calls,
          ticketNames: names,
        }), metric, highFirst),
        query,
      ),
      idle,
    ),
    targets,
    metric,
    behind,
  );

  function setTarget(id: string, value: number) {
    const next = { ...targets, [id]: { ...(targets[id] || EMPTY), [metric]: value } };
    setTargets(next);
    writeJson(TARGET_KEY, next);
  }

  return (
    <section className="c4-perf-luxe" aria-label={v4("perfBoard")}>
      <div className="c4-fin-hero">
        <div className="c4-fin-metric"><span>{v4("perfBoard")}</span><strong>{board.length}</strong></div>
        <div className="c4-fin-metric"><span>{v4(LABEL[metric])}</span><strong>{board.reduce((sum, row) => sum + metricValue(row, metric), 0)}</strong></div>
      </div>
      <p className="c4-muted c4-pad">{v4("perfHint")}</p>
      <div className="c4-row c4-pad">
        {METRICS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={metric === item ? "1" : "0"} onClick={() => setMetric(item)}>{v4(LABEL[item])}</button>
        ))}
        <button type="button" className="c4-chip" data-on={highFirst ? "1" : "0"} onClick={() => setHighFirst((on) => !on)}>{v4("perfRank")}</button>
        <button type="button" className="c4-chip" data-on={idle ? "1" : "0"} onClick={() => setIdle((on) => !on)}>{v4("hideIdle")}</button>
        <button type="button" className="c4-chip" data-on={behind ? "1" : "0"} onClick={() => setBehind((on) => !on)}>{v4("behindOnly")}</button>
        <input className="c4-field" aria-label={v4("perfSearch")} placeholder={v4("perfSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
        <button type="button" className="c4-btn" onClick={() => downloadCsv("team-board.csv", ["rank", "name", "assigned", "funded", "calls", "tickets"], board.map((row, index) => [String(index + 1), row.name, String(row.assigned), String(row.funded), String(row.calls), String(row.tickets)]))}>{v4("perfCsv")}</button>
      </div>
      <div className="c4-desk c4-table-wrap">
        <table className="c4-table">
          <thead>
            <tr>
              <th>{v4("perfRank")}</th>
              <th>{v4("perfBoard")}</th>
              {METRICS.map((item) => <th key={item}>{v4(LABEL[item])}</th>)}
              <th>{v4("perfTarget")}</th>
              <th>{v4("perfProgress")}</th>
              <th>{v4("perfGap")}</th>
              <th>{v4("callPace")}</th>
              <th>{v4("fundedShare")}</th>
            </tr>
          </thead>
          <tbody>
            {board.map((row, index) => <PerfLine key={row.id} row={row} rank={index + 1} metric={metric} target={targets[row.id] || EMPTY} v4={v4} onTarget={setTarget} />)}
          </tbody>
        </table>
      </div>
      <ul className="c4-perf-cards">
        {board.map((row, index) => <PerfLine key={row.id} row={row} rank={index + 1} metric={metric} target={targets[row.id] || EMPTY} v4={v4} onTarget={setTarget} card />)}
      </ul>
      {!board.length && <p className="c4-empty-gold">{v4("perfBoard")}</p>}
    </section>
  );
}

function PerfLine({ row, rank, metric, target, v4, onTarget, card }: {
  row: AgentStat;
  rank: number;
  metric: PerfMetric;
  target: PerfTarget;
  v4: V4;
  onTarget: (id: string, value: number) => void;
  card?: boolean;
}) {
  const value = metricValue(row, metric);
  const progress = progressTo(value, target[metric]);
  const gap = gapTo(value, target[metric]);
  const pace = callPace(row);
  const share = fundedShare(row);
  const targetField = (
    <label className="c4-lab">
      <span>{v4("perfTarget")}</span>
      <input className="c4-field" inputMode="numeric" aria-label={v4("perfTarget")} value={target[metric] ? String(target[metric]) : ""} onChange={(event) => onTarget(row.id, Number(event.target.value) || 0)} />
    </label>
  );
  if (card) {
    return (
      <li className="c4-perf-card" data-top={rank === 1 ? "1" : "0"}>
        <strong data-rank={rank <= 3 ? "1" : "0"}>{rank}</strong>
        <span>{row.name}</span>
        <span>{v4("metricAssigned")} {row.assigned}</span>
        <span>{v4("metricFunded")} {row.funded}</span>
        <span>{v4("metricCalls")} {row.calls}</span>
        <span>{v4("metricTickets")} {row.tickets}</span>
        {targetField}
        <span>{v4("perfProgress")} {progress == null ? "—" : `${progress}%`}</span>
        <span>{v4("perfGap")} {gap == null ? "—" : gap}</span>
        <span>{v4("callPace")} {pace == null ? "—" : pace}</span>
        <span>{v4("fundedShare")} {share == null ? "—" : `${share}%`}</span>
      </li>
    );
  }
  return (
    <tr className="c4-perf-row" data-top={rank === 1 ? "1" : "0"}>
      <td><strong data-rank={rank <= 3 ? "1" : "0"}>{rank}</strong></td>
      <td>{row.name}</td>
      <td>{row.assigned}</td>
      <td>{row.funded}</td>
      <td>{row.calls}</td>
      <td>{row.tickets}</td>
      <td>{targetField}</td>
      <td>{progress == null ? "—" : `${progress}%`}</td>
      <td>{gap == null ? "—" : gap}</td>
      <td>{pace == null ? "—" : pace}</td>
      <td>{share == null ? "—" : `${share}%`}</td>
    </tr>
  );
}

export function DeskFoot({ section, name, v4, onHelp }: { section: string; name: string; v4: V4; onHelp: () => void }) {
  const [clock, setClock] = useState("");
  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    tick();
    const timer = window.setInterval(tick, 30000);
    return () => window.clearInterval(timer);
  }, []);
  return (
    <footer className="c4-foot c4-foot-luxe c4-foot-crest">
      <p className="c4-foot-plate" data-logo="mono">7FX</p>
      <span className="c4-foot-rule" aria-hidden="true" />
      <span>{v4("footer")}</span>
      <span>{v4("footSection")} {section || "—"}</span>
      <span>{v4("footSigned")} {name || "—"}</span>
      <time dateTime={clock}>{v4("footClock")} {clock || "—"}</time>
      <button type="button" className="c4-btn" onClick={onHelp}>{v4("openHelp")}</button>
    </footer>
  );
}

export function HelpSheet({ open, onClose, v4, closeLabel }: { open: boolean; onClose: () => void; v4: V4; closeLabel: string }) {
  if (!open) return null;
  const rows: [string, CrmV4CopyKey][] = [
    ["Ctrl/Cmd K", "helpPalette"],
    ["?", "helpQuestion"],
    ["g o c f p s m l e k", "helpGo"],
    ["j / k", "helpMove"],
    ["x", "helpPick"],
    ["Enter", "helpEnter"],
  ];
  return (
    <div className="c4-palette-back" role="presentation" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={v4("openHelp")} className="c4-palette c4-help-luxe" onClick={(event) => event.stopPropagation()}>
        <h2 className="c4-title">{v4("openHelp")}</h2>
        <ul className="c4-shortcut-list">
          {rows.map(([key, label]) => (
            <li key={key}><kbd>{key}</kbd><span>{v4(label)}</span></li>
          ))}
        </ul>
        <button type="button" className="c4-btn" onClick={onClose}>{closeLabel}</button>
      </div>
    </div>
  );
}
