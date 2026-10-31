"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { crmv3Href } from "@/lib/crmv3/sections";
import {
  behindTarget,
  buildBoard,
  callCounts,
  callPace,
  fundedShare,
  gapTo,
  hideIdle,
  progressTo,
  rankBoard,
  searchBoard,
  type PerfMetric,
  type PerfTarget,
} from "@/lib/crmv3/perf";
import {
  applyView,
  dormantThenActive,
  largeDeposits,
  manyWithdrawals,
  missingKyc,
  rapidDeposits,
  toggleColumn,
  visibleHits,
  type ListView,
  type WatchKind,
} from "@/lib/crmv3/watch";
import { importableKeys, keyCount, packKeys } from "@/lib/crmv3/local-pack";
import { Card, downloadCsv, useJson } from "../kit";
import { readLocal, useLocal, useV3 } from "./store";

const TARGET_KEY = "crmv3-agent-targets";
const EMPTY: PerfTarget = { assigned: 0, funded: 0, calls: 0, tickets: 0 };

export function TeamBoard({ base }: { base: string }) {
  const v3 = useV3();
  const workers = useJson<{ workers?: { id: string; name?: string; email?: string }[] }>("/api/admin/workers?take=80");
  const users = useJson<{ users?: { id: string; assigneeName?: string | null; ftd?: boolean | null }[] }>("/api/admin/users?view=table&take=40&meta=0&role=TRADER");
  const [targets, setTargets] = useLocal<Record<string, PerfTarget>>(TARGET_KEY, {});
  const [metric, setMetric] = useState<PerfMetric>("assigned");
  const [query, setQuery] = useState("");
  const [idle, setIdle] = useState(false);
  const [behind, setBehind] = useState(false);
  const calls = callCounts(readLocal<Record<string, unknown[]>>("crmv3-call-log", {}));
  const assign = readLocal<Record<string, string>>("crmv3-ticket-assign", {});
  const ticketNames = Object.values(assign);
  const board = buildBoard({
    workers: workers.data?.workers || [],
    customers: users.data?.users || [],
    calls,
    ticketNames,
  });
  const rows = behindTarget(hideIdle(searchBoard(rankBoard(board, metric, true), query), idle), targets, metric, behind);

  function setTarget(id: string, value: number) {
    const current = targets[id] || EMPTY;
    setTargets({ ...targets, [id]: { ...current, [metric]: value } });
  }

  return (
    <Card title={v3("teamBoard")}>
      <p className="c3-muted c3-pad">{v3("teamCaption")}</p>
      <div className="c3-tools">
        {(["assigned", "funded", "calls", "tickets"] as const).map((item) => (
          <button key={item} type="button" className="c3-chip" data-on={metric === item ? "1" : "0"} onClick={() => setMetric(item)}>
            {v3(item === "assigned" ? "teamAssigned" : item === "funded" ? "teamFunded" : item === "calls" ? "teamCalls" : "teamTickets")}
          </button>
        ))}
        <input className="c3-field" aria-label={v3("teamFind")} placeholder={v3("teamFind")} value={query} onChange={(event) => setQuery(event.target.value)} />
        <button type="button" className="c3-chip" data-on={idle ? "1" : "0"} onClick={() => setIdle((on) => !on)}>{v3("teamHideIdle")}</button>
        <button type="button" className="c3-chip" data-on={behind ? "1" : "0"} onClick={() => setBehind((on) => !on)}>{v3("teamBehind")}</button>
        <button type="button" className="c3-btn" onClick={() => downloadCsv("team-board.csv", ["rank", "name", "assigned", "funded", "calls", "tickets"], rows.map((row, index) => [String(index + 1), row.name, String(row.assigned), String(row.funded), String(row.calls), String(row.tickets)]))}>{v3("teamCsv")}</button>
      </div>
      <div className="c3-desk c3-table-wrap">
        <table className="c3-table c3-sticky">
          <thead>
            <tr>
              <th>{v3("teamRank")}</th>
              <th>{v3("teamBoard")}</th>
              <th>{v3("teamAssigned")}</th>
              <th>{v3("teamFunded")}</th>
              <th>{v3("teamCalls")}</th>
              <th>{v3("teamTickets")}</th>
              <th>{v3("teamTarget")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const value = row[metric];
              const target = (targets[row.id] || EMPTY)[metric];
              const progress = progressTo(value, target);
              return (
                <tr key={row.id} data-first={index === 0 ? "1" : "0"}>
                  <td>{index + 1}{index === 0 ? ` · ${v3("teamFirst")}` : ""}</td>
                  <td>{row.name}<div className="c3-muted">{v3("teamPace")} {callPace(row) ?? "—"} · {v3("teamShare")} {fundedShare(row) ?? "—"}%</div></td>
                  <td>{row.assigned}</td>
                  <td>{row.funded}</td>
                  <td>{row.calls}</td>
                  <td>{row.tickets}</td>
                  <td>
                    <input className="c3-field" inputMode="numeric" aria-label={v3("teamTarget")} value={target ? String(target) : ""} onChange={(event) => setTarget(row.id, Math.max(0, Number(event.target.value) || 0))} />
                    <div className="c3-muted">{v3("teamProgress")} {progress == null ? "—" : `${progress}%`} · {v3("teamGap")} {gapTo(value, target) ?? "—"}</div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <ul className="c3-mob-list">
        {rows.map((row, index) => {
          const value = row[metric];
          const target = (targets[row.id] || EMPTY)[metric];
          return (
            <li key={row.id} className="c3-feed" data-kind={index === 0 ? "call" : "note"}>
              <strong>{index + 1}. {row.name}</strong>
              <p className="c3-muted">{v3("teamAssigned")} {row.assigned} · {v3("teamFunded")} {row.funded} · {v3("teamCalls")} {row.calls} · {v3("teamTickets")} {row.tickets}</p>
              <p className="c3-muted">{v3("teamPace")} {callPace(row) ?? "—"} · {v3("teamShare")} {fundedShare(row) ?? "—"}%</p>
              <label className="c3-lab">
                <span>{v3("teamTarget")}</span>
                <input className="c3-field" inputMode="numeric" aria-label={v3("teamTarget")} value={target ? String(target) : ""} onChange={(event) => setTarget(row.id, Math.max(0, Number(event.target.value) || 0))} />
              </label>
              <p className="c3-muted">{v3("teamProgress")} {progressTo(value, target) ?? "—"} · {v3("teamGap")} {gapTo(value, target) ?? "—"}</p>
            </li>
          );
        })}
      </ul>
      <p className="c3-pad"><Link href={crmv3Href(base, "customers")}>{v3("goCustomers")}</Link></p>
    </Card>
  );
}

type MoneyRow = { id: string; amount?: number | null; createdAt?: string | null; userId?: string | null; user?: { id?: string | null; name?: string | null; email?: string | null } | null };

export function RiskWatch({ base }: { base: string }) {
  const v3 = useV3();
  const users = useJson<{ users?: { id: string; name?: string | null; email?: string | null; documentsStatus?: string | null; createdAt?: string | null }[] }>("/api/admin/users?view=table&take=40&meta=0&role=TRADER");
  const deposits = useJson<{ requests?: MoneyRow[] }>("/api/admin/deposits?take=40");
  const withdrawals = useJson<{ requests?: MoneyRow[] }>("/api/admin/withdrawals?take=40");
  const [threshold, setThreshold] = useLocal<number>("crmv3-risk-threshold", 1000);
  const [flags, setFlags] = useLocal<string[]>("crmv3-risk-flags", []);
  const [hidden, setHidden] = useLocal<string[]>("crmv3-risk-hide", []);
  const [kind, setKind] = useState<"" | WatchKind>("");
  const [query, setQuery] = useState("");
  const people = users.data?.users || [];
  const deps = deposits.data?.requests || [];
  const outs = withdrawals.data?.requests || [];
  const hits = [
    ...missingKyc(people),
    ...largeDeposits(deps, threshold),
    ...rapidDeposits(deps),
    ...manyWithdrawals(outs),
    ...dormantThenActive(people, deps),
  ];
  const shown = visibleHits(hits, hidden, kind, query);
  const labels: Record<WatchKind, "watchKyc" | "watchLarge" | "watchRapid" | "watchWithdraw" | "watchQuiet"> = {
    kyc: "watchKyc",
    large: "watchLarge",
    rapid: "watchRapid",
    withdrawals: "watchWithdraw",
    dormant: "watchQuiet",
  };
  return (
    <Card title={v3("watchTitle")}>
      <p className="c3-muted c3-pad">{v3("watchCaption")}</p>
      <div className="c3-kpis">
        <div className="c3-kpi"><p className="c3-kpi-label">{v3("rowsShowing")}</p><p className="c3-kpi-value">{shown.length}</p></div>
        <div className="c3-kpi"><p className="c3-kpi-label">{v3("watchKyc")}</p><p className="c3-kpi-value">{shown.filter((row) => row.kind === "kyc").length}</p></div>
      </div>
      <div className="c3-tools">
        <button type="button" className="c3-chip" data-on={kind === "" ? "1" : "0"} onClick={() => setKind("")}>{v3("typeAll")}</button>
        {(Object.keys(labels) as WatchKind[]).map((item) => (
          <button key={item} type="button" className="c3-chip" data-on={kind === item ? "1" : "0"} onClick={() => setKind(item)}>{v3(labels[item])}</button>
        ))}
        <label className="c3-lab">
          <span>{v3("watchThreshold")}</span>
          <input className="c3-field" inputMode="numeric" aria-label={v3("watchThreshold")} value={String(threshold)} onChange={(event) => setThreshold(Math.max(0, Number(event.target.value) || 0))} />
        </label>
        <input className="c3-field" aria-label={v3("watchSearch")} placeholder={v3("watchSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
        <button type="button" className="c3-btn" onClick={() => downloadCsv("risk-watch.csv", ["name", "rule", "detail", "amount"], shown.map((row) => [row.name, row.kind, row.detail, String(row.amount)]))}>{v3("watchCsv")}</button>
      </div>
      <ul>
        {shown.map((row) => (
          <li key={row.id} className="c3-feed" data-kind="status">
            <div className="c3-row c3-between">
              <Link href={crmv3Href(base, `customers/${row.userId}`)}>{row.name}</Link>
              <span className="c3-status" data-tone="warn">{v3(labels[row.kind])}</span>
            </div>
            <p className="c3-muted">{row.detail}{row.amount ? ` · ${row.amount}` : ""}{flags.includes(row.id) ? ` · ${v3("watchFlag")}` : ""}</p>
            <div className="c3-row">
              <button type="button" className="c3-btn" onClick={() => setFlags(flags.includes(row.id) ? flags.filter((id) => id !== row.id) : [...flags, row.id])}>{flags.includes(row.id) ? v3("watchClear") : v3("watchFlag")}</button>
              <button type="button" className="c3-btn" onClick={() => setHidden([...hidden, row.id])}>{v3("watchHide")}</button>
            </div>
          </li>
        ))}
      </ul>
      {!shown.length && <p className="c3-empty" role="status">{v3("stateEmpty")}</p>}
    </Card>
  );
}

export function useListTools(id: string, defaults: string[]) {
  const [state, setState] = useLocal<{ columns: string[]; dense: boolean }>(`crmv3-list-state:${id}`, { columns: defaults, dense: false });
  const [views, setViews] = useLocal<ListView[]>(`crmv3-list-views:${id}`, []);
  const columns = state.columns.filter((item) => defaults.includes(item));
  const shown = columns.length ? columns : defaults;
  return {
    columns: shown,
    dense: state.dense,
    views,
    toggle(key: string) {
      setState({ ...state, columns: toggleColumn(shown, key, defaults) });
    },
    setDense(dense: boolean) {
      setState({ ...state, dense });
    },
    save(name: string) {
      const view: ListView = { id: String(Date.now()), name, columns: shown, dense: state.dense };
      setViews([...views, view]);
    },
    apply(view: ListView) {
      setState(applyView(view, defaults));
    },
    remove(viewId: string) {
      setViews(views.filter((view) => view.id !== viewId));
    },
    reset() {
      setState({ columns: defaults, dense: false });
    },
  };
}

export function ListBar({ id, defaults, labels, onChange }: { id: string; defaults: string[]; labels: Record<string, string>; onChange?: (columns: string[], dense: boolean) => void }) {
  const v3 = useV3();
  const tools = useListTools(id, defaults);
  const changeRef = useRef(onChange);
  changeRef.current = onChange;
  const columnsRef = useRef(tools.columns);
  const denseRef = useRef(tools.dense);
  columnsRef.current = tools.columns;
  denseRef.current = tools.dense;
  const signature = `${tools.columns.join(",")}|${tools.dense ? "1" : "0"}`;
  useEffect(() => { changeRef.current?.(columnsRef.current, denseRef.current); }, [signature]);
  const [name, setName] = useState("");
  return (
    <div className="c3-listbar">
      <div className="c3-tools" aria-label={v3("colChooser")}>
        {defaults.map((key) => (
          <button key={key} type="button" className="c3-chip" data-on={tools.columns.includes(key) ? "1" : "0"} onClick={() => tools.toggle(key)}>{labels[key] || key}</button>
        ))}
        <button type="button" className="c3-chip" data-on={tools.dense ? "1" : "0"} onClick={() => tools.setDense(!tools.dense)}>{v3("denseRows")}</button>
        <button type="button" className="c3-btn" onClick={tools.reset}>{v3("resetCols")}</button>
      </div>
      <form className="c3-tools" onSubmit={(event) => { event.preventDefault(); if (!name.trim()) return; tools.save(name.trim()); setName(""); }}>
        <input className="c3-field" aria-label={v3("viewName")} placeholder={v3("viewName")} value={name} onChange={(event) => setName(event.target.value)} />
        <button type="submit" className="c3-btn">{v3("saveView")}</button>
        {tools.views.map((view) => (
          <span key={view.id} className="c3-row">
            <button type="button" className="c3-btn" onClick={() => tools.apply(view)}>{v3("applyView")} {view.name}</button>
            <button type="button" className="c3-btn" onClick={() => tools.remove(view.id)}>{v3("deleteView")}</button>
          </span>
        ))}
      </form>
    </div>
  );
}

export function LocalData() {
  const v3 = useV3();
  const [count, setCount] = useState(0);
  const [msg, setMsg] = useState("");
  useEffect(() => {
    const keys = Object.keys(window.localStorage);
    setCount(keyCount(keys));
  }, [msg]);
  return (
    <Card title={v3("localKeys")}>
      <div className="c3-form c3-pad">
        <p className="c3-muted">{v3("localStay")}</p>
        <p className="c3-muted">{v3("localShare")}</p>
        <p>{v3("localCount")} {count}</p>
        <div className="c3-row">
          <button type="button" className="c3-btn" onClick={() => {
            const entries = Object.keys(window.localStorage).map((key) => [key, window.localStorage.getItem(key) || ""] as [string, string]);
            const pack = packKeys(entries, new Date().toISOString());
            const blob = new Blob([JSON.stringify(pack, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "crmv3-local.json";
            a.click();
            URL.revokeObjectURL(url);
            setMsg(v3("localExport"));
          }}>{v3("localExport")}</button>
          <label className="c3-btn">
            {v3("localImport")}
            <input type="file" accept="application/json" className="c3-sr" onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              let payload: unknown = null;
              try { payload = JSON.parse(await file.text()); } catch { payload = null; }
              const keys = importableKeys(payload);
              if (!keys) { setMsg(v3("localBad")); return; }
              for (const [key, value] of Object.entries(keys)) window.localStorage.setItem(key, value);
              setMsg(v3("localImport"));
            }} />
          </label>
          <button type="button" className="c3-btn" onClick={() => {
            if (!window.confirm(v3("localConfirm"))) return;
            for (const key of Object.keys(window.localStorage)) {
              if (key.startsWith("crmv3-")) window.localStorage.removeItem(key);
            }
            window.location.reload();
          }}>{v3("localReset")}</button>
        </div>
        {msg && <p className="c3-muted" role="status">{msg}</p>}
      </div>
    </Card>
  );
}

export function DeskFooter({ section, name, onHelp }: { section: string; name: string; onHelp: () => void }) {
  const v3 = useV3();
  const [now, setNow] = useState("");
  useEffect(() => {
    const tick = () => setNow(new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" }).format(new Date()));
    tick();
    const timer = window.setInterval(tick, 30000);
    return () => window.clearInterval(timer);
  }, []);
  return (
    <footer className="c3-foot">
      <span>{v3("footSection")} {section}</span>
      <span>{name}</span>
      <span>{v3("footTime")} {now}</span>
      <button type="button" className="c3-btn" onClick={onHelp}>{v3("footShortcuts")}</button>
    </footer>
  );
}

export function shortcutRows(v3: (key: "keySearch" | "keyHelp" | "keyGo") => string) {
  return [
    ["Ctrl/Cmd K", v3("keySearch")],
    ["?", v3("keyHelp")],
    ["g o", v3("keyGo")],
    ["g c", "customers"],
    ["g f", "finance"],
    ["g p", "positions"],
    ["g s", "support"],
    ["g m", "marketing"],
    ["g l", "logs"],
    ["g e", "settings"],
    ["g k", "control"],
  ] as const;
}
