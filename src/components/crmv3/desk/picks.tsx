"use client";

import { useEffect, useState } from "react";
import { SALE_STATUSES } from "@/lib/membership";
import type { CrmV3CopyKey } from "@/lib/crmv3/copy";
import { readCanned, type CannedReply } from "@/lib/crmv3/deposit";
import { readJson, writeJson } from "@/lib/crmv3/bridge";
import { useEscape } from "@/lib/crmv3/focus";
import {
  PICK_KEY,
  addPicks,
  assignBody,
  canSend,
  csvLine,
  listTarget,
  matchMessages,
  readPicks,
  sideOf,
  stageBody,
  tally,
  type Outcome,
} from "@/lib/crmv3/picks";
import { auditExport, downloadCsv, sendJson, useJson, when, type Tx } from "../kit";
import { useV3 } from "./store";

const CANNED_KEY = "crmv3-inbox-canned";

type Person = {
  id: string;
  name?: string | null;
  email?: string | null;
  country?: string | null;
  saleStatus?: string | null;
  balance?: number | null;
  currency?: string | null;
  account?: { balance?: number | null; currency?: string | null } | null;
};

type Kind = "assign" | "stage" | "export" | "list";

const LEAD: Record<Kind, CrmV3CopyKey> = {
  assign: "bkAssignLead",
  stage: "bkStageLead",
  export: "bkExportLead",
  list: "bkListLead",
};

export function BulkDock({ rows, selected, lists, tx, onReload, onClear }: {
  rows: Person[];
  selected: string[];
  lists: { id: string; name: string }[];
  tx: Tx;
  onReload: () => void;
  onClear: () => void;
}) {
  const v3 = useV3();
  const staff = useJson<{ workers?: { id: string; name?: string | null }[] }>(selected.length ? "/api/admin/workers?take=100" : null);
  const [kind, setKind] = useState<Kind | null>(null);
  const [agent, setAgent] = useState("");
  const [sale, setSale] = useState("");
  const [listId, setListId] = useState("");
  const [listName, setListName] = useState("");
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<Outcome[]>([]);
  const [resultKind, setResultKind] = useState<Kind | null>(null);
  useEscape(Boolean(kind), () => { if (!busy) setKind(null); });
  const picked = selected.map((id) => rows.find((row) => row.id === id) || { id, name: id });
  if (!selected.length) return null;
  const workers = staff.data?.workers || [];
  const counts = tally(results);

  async function runAssign() {
    const body = assignBody(agent);
    if (!body || busy) return;
    setBusy(true);
    const outcomes: Outcome[] = [];
    for (const row of picked) {
      const res = await sendJson(`/api/admin/users/${encodeURIComponent(row.id)}`, "PATCH", { assigneeId: body.assigneeId });
      outcomes.push({ id: row.id, name: row.name || row.email || row.id, ok: res.ok, error: res.error || "" });
    }
    setResults(outcomes);
    setResultKind("assign");
    setKind(null);
    setBusy(false);
    if (outcomes.some((row) => row.ok)) onReload();
  }

  async function runStage() {
    const body = stageBody(sale);
    if (!body || busy) return;
    setBusy(true);
    const outcomes: Outcome[] = [];
    for (const row of picked) {
      const res = await sendJson(`/api/admin/users/${encodeURIComponent(row.id)}`, "PATCH", { saleStatus: body.saleStatus });
      outcomes.push({ id: row.id, name: row.name || row.email || row.id, ok: res.ok, error: res.error || "" });
    }
    setResults(outcomes);
    setResultKind("stage");
    setKind(null);
    setBusy(false);
    if (outcomes.some((row) => row.ok)) onReload();
  }

  async function runExport() {
    if (busy) return;
    setBusy(true);
    const ok = await auditExport("customers-page", picked.length, "/crmv3/customers");
    const outcomes: Outcome[] = picked.map((row) => ({
      id: row.id,
      name: row.name || row.email || row.id,
      ok,
      error: ok ? "" : tx("failed"),
    }));
    if (ok) {
      downloadCsv(
        "customers.csv",
        ["name", "email", "country", "sale", "balance", "currency"],
        picked.map((row) => csvLine({
          name: row.name,
          email: row.email,
          country: row.country,
          saleStatus: row.saleStatus,
          balance: row.balance ?? row.account?.balance,
          currency: row.currency || row.account?.currency,
        })),
      );
    }
    setResults(outcomes);
    setResultKind("export");
    setKind(null);
    setBusy(false);
  }

  function runList() {
    const target = listTarget(listId, listName);
    if (!target) return;
    const map = addPicks(readPicks(readJson(PICK_KEY, {})), target, picked.map((row) => row.id));
    writeJson(PICK_KEY, map);
    setResults(picked.map((row) => ({ id: row.id, name: row.name || row.email || row.id, ok: true, error: "" })));
    setResultKind("list");
    setKind(null);
    setListName("");
  }

  function confirm() {
    if (kind === "assign") void runAssign();
    else if (kind === "stage") void runStage();
    else if (kind === "export") void runExport();
    else if (kind === "list") runList();
  }

  const ready = kind === "export"
    || (kind === "assign" && Boolean(assignBody(agent)))
    || (kind === "stage" && Boolean(stageBody(sale)))
    || (kind === "list" && Boolean(listTarget(listId, listName)));

  return (
    <section className="c3-pick-dock" data-bulk="" aria-label={v3("bkTitle")}>
      <header>
        <h3 className="c3-title">{v3("bkTitle")}</h3>
        <p className="c3-muted">{v3("bkHint")}</p>
        <p className="c3-muted" data-selected={selected.length}>{selected.length}</p>
      </header>
      <div className="c3-row">
        <button type="button" className="c3-btn" onClick={() => setKind("assign")}>{v3("bkAssign")}</button>
        <button type="button" className="c3-btn" onClick={() => setKind("stage")}>{v3("bkStage")}</button>
        <button type="button" className="c3-btn" onClick={() => setKind("export")}>{v3("bkExport")}</button>
        <button type="button" className="c3-btn" onClick={() => setKind("list")}>{v3("bkList")}</button>
        <button type="button" className="c3-btn" onClick={onClear}>{v3("bkClear")}</button>
      </div>
      {kind && (
        <div className="c3-pick-confirm" role="dialog" aria-label={v3("bkConfirm")} data-confirm={kind}>
          <p data-count={selected.length}>{selected.length}</p>
          <p className="c3-muted">{v3(LEAD[kind])}</p>
          {kind === "assign" && (
            <label className="c3-lab">
              <span>{v3("bkStaff")}</span>
              <select className="c3-select" aria-label={v3("bkStaff")} value={agent} onChange={(event) => setAgent(event.target.value)}>
                <option value="" />
                {workers.map((worker) => <option key={worker.id} value={worker.id}>{worker.name || worker.id}</option>)}
              </select>
              {!workers.length && <span className="c3-muted">{v3("bkNoStaff")}</span>}
            </label>
          )}
          {kind === "stage" && (
            <label className="c3-lab">
              <span>{v3("bkStageWord")}</span>
              <select className="c3-select" aria-label={v3("bkStageWord")} value={sale} onChange={(event) => setSale(event.target.value)}>
                <option value="" />
                {SALE_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
            </label>
          )}
          {kind === "list" && (
            <>
              <label className="c3-lab">
                <span>{v3("bkPickList")}</span>
                <select className="c3-select" aria-label={v3("bkPickList")} value={listId} onChange={(event) => setListId(event.target.value)}>
                  <option value="" />
                  {lists.map((list) => <option key={list.id} value={list.id}>{list.name}</option>)}
                </select>
              </label>
              <label className="c3-lab">
                <span>{v3("bkListName")}</span>
                <input className="c3-field" aria-label={v3("bkListName")} value={listName} onChange={(event) => setListName(event.target.value)} />
              </label>
            </>
          )}
          <div className="c3-row">
            <button type="button" className="c3-btn c3-btn-hot" disabled={!ready || busy} onClick={confirm}>{v3("bkConfirm")}</button>
            <button type="button" className="c3-btn" onClick={() => setKind(null)}>{v3("bkCancel")}</button>
          </div>
        </div>
      )}
      {results.length > 0 && (
        <div data-results={resultKind || ""}>
          <h4 className="c3-title">{v3("bkResults")}</h4>
          <p className="c3-muted">{v3("bkSaved")} {counts.ok} · {v3("bkFailed")} {counts.failed}</p>
          <ul className="c3-pick-results">
            {results.map((row) => (
              <li key={row.id} data-ok={row.ok ? "1" : "0"}>
                <span>{row.name}</span>
                <span className="c3-muted">{row.ok ? (resultKind === "export" ? v3("bkIncluded") : resultKind === "list" ? v3("bkStored") : v3("bkSaved")) : `${v3("bkFailed")}${row.error ? ` · ${row.error}` : ""}`}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

type ChatMessage = { id: string; body?: string | null; workerId?: string | null; automatic?: boolean | null; createdAt?: string | null };

const WHO: Record<"auto" | "staff" | "customer", CrmV3CopyKey> = {
  auto: "inboxAutomatic",
  staff: "inboxStaff",
  customer: "inboxCustomer",
};

export function RecordThread({ userId, tx, locale }: { userId: string; tx: Tx; locale: string }) {
  const v3 = useV3();
  const data = useJson<{ threads?: { messages?: ChatMessage[] }[] }>(userId ? `/api/admin/chat?userId=${encodeURIComponent(userId)}&take=40` : null);
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [canned, setCanned] = useState<CannedReply[]>([]);
  useEffect(() => { setCanned(readCanned(readJson(CANNED_KEY, []))); }, [userId]);
  const loaded = data.data?.threads?.[0]?.messages || [];
  const shown = matchMessages(loaded, query);

  async function send() {
    const message = draft.trim();
    if (!canSend(message) || busy) return;
    setBusy(true);
    try {
      const res = await sendJson("/api/admin/chat", "POST", { userId, message });
      setMsg(res.ok ? tx("replySent") : res.error || tx("failed"));
      if (res.ok) {
        setDraft("");
        data.reload();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="c3-thread" data-thread="" aria-label={v3("thTitle")}>
      <header>
        <h3 className="c3-title">{v3("thTitle")}</h3>
        <p className="c3-muted">{v3("thHint")}</p>
        <p className="c3-muted" data-loaded={loaded.length}>{v3("thLoaded")} {loaded.length} · {v3("thShowing")} {shown.length}</p>
      </header>
      <input className="c3-field" aria-label={v3("thSearch")} placeholder={v3("thSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      {!loaded.length && <p className="c3-muted">{v3("thEmpty")}</p>}
      {loaded.length > 0 && !shown.length && <p className="c3-muted">{v3("thNone")}</p>}
      <ol className="c3-thread-list">
        {shown.map((item) => {
          const who = sideOf(item);
          return (
            <li key={item.id} className="c3-thread-line" data-who={who}>
              <strong>{v3(WHO[who])}</strong>
              <p>{item.body}</p>
              <span className="c3-muted">{when(item.createdAt, locale)}</span>
            </li>
          );
        })}
      </ol>
      <h4 className="c3-title">{v3("inboxCanned")}</h4>
      {!canned.length && <p className="c3-muted">{v3("thNoCanned")}</p>}
      <div className="c3-row">
        {canned.map((item) => (
          <button key={item.id} type="button" className="c3-chip" onClick={() => setDraft(item.body)}>{item.title}</button>
        ))}
      </div>
      <label className="c3-lab">
        <span>{v3("thDraft")}</span>
        <textarea
          className="c3-field"
          rows={3}
          aria-label={v3("thDraft")}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.stopPropagation();
          }}
        />
      </label>
      <button type="button" className="c3-btn c3-btn-hot" data-send="" disabled={!canSend(draft) || busy} onClick={() => void send()}>{v3("inboxSend")}</button>
      {msg && <p className="c3-muted" aria-live="polite">{msg}</p>}
    </section>
  );
}
