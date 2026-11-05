"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SALE_STATUSES } from "@/lib/membership";
import type { CrmV3CopyKey } from "@/lib/crmv3/copy";
import { readJson, writeJson } from "@/lib/crmv3/bridge";
import { useEscape } from "@/lib/crmv3/focus";
import { ROLE_KEY, deskRole } from "@/lib/crmv3/inbox-sla";
import {
  ALERT_KINDS,
  FOCUS_FLAG,
  MUTE_KEY,
  QUIET_KEY,
  WATCH_KEY,
  affiliateOf,
  currencyOf,
  filterLeads,
  inQuiet,
  nowMinutes,
  readFocusFlag,
  readIds,
  readMute,
  readQuiet,
  shouldAlert,
  sortLeads,
  stageBody,
  stageOf,
  stagesOn,
  toggleId,
  toggleMute,
  type AlertKind,
  type LeadRow,
} from "@/lib/crmv3/leads";
import { crmv3Href } from "@/lib/crmv3/sections";
import { sendJson, useJson, type Tx } from "../kit";
import { useV3 } from "./store";

const KIND_LABEL: Record<AlertKind, CrmV3CopyKey> = {
  info: "qfKindInfo",
  chat: "qfKindChat",
  handoff: "qfKindHandoff",
  ticket: "qfKindTicket",
  payout: "qfKindPayout",
};

export function LeadBoard({ base, tx }: { base: string; tx: Tx }) {
  const v3 = useV3();
  const data = useJson<{ users?: LeadRow[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [stage, setStage] = useState("");
  const [query, setQuery] = useState("");
  const [watch, setWatch] = useState<string[]>([]);
  const [choice, setChoice] = useState<Record<string, string>>({});
  const [pending, setPending] = useState<{ id: string; name: string; stage: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [viewer, setViewer] = useState(false);
  useEscape(Boolean(pending) && !busy, () => setPending(null));
  useEffect(() => {
    setWatch(readIds(readJson(WATCH_KEY, [])));
    setViewer(deskRole(readJson(ROLE_KEY, "desk")) === "viewer");
    const onRole = () => setViewer(deskRole(readJson(ROLE_KEY, "desk")) === "viewer");
    window.addEventListener("crmv3:desk-role", onRole);
    return () => window.removeEventListener("crmv3:desk-role", onRole);
  }, []);
  const loaded = data.data?.users || [];
  const shown = sortLeads(filterLeads(loaded, stage, query), watch);
  const stages = stagesOn(loaded);

  function storeWatch(next: string[]) {
    setWatch(next);
    writeJson(WATCH_KEY, next);
  }

  async function confirm() {
    if (!pending || busy || viewer) return;
    const body = stageBody(pending.stage);
    if (!body) return;
    setBusy(true);
    try {
      const res = await sendJson(`/api/admin/users/${encodeURIComponent(pending.id)}`, "PATCH", body);
      setMsg(`${pending.name} · ${res.ok ? v3("ldSaved") : `${v3("ldNotSaved")} ${res.error || ""}`}`);
      if (res.ok) {
        setPending(null);
        data.reload();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="c3-pipe-desk" aria-label={v3("ldTitle")} data-lead-board="1" data-viewer={viewer ? "1" : "0"}>
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("ldSub")}</p>
          <h2 className="c3-title">{v3("ldTitle")}</h2>
        </div>
        <p className="c3-muted">{v3("ldCount")} {shown.length}</p>
      </header>
      <p className="c3-muted">{v3("ldHint")}</p>
      <div className="c3-row">
        <button type="button" className="c3-chip" data-on={viewer ? "1" : "0"} aria-pressed={viewer} onClick={() => {
          const next = viewer ? "desk" : "viewer";
          writeJson(ROLE_KEY, next);
          setViewer(next === "viewer");
          window.dispatchEvent(new Event("crmv3:desk-role"));
        }}>{v3("inViewerChip")}</button>
      </div>
      {viewer && <p className="c3-muted">{v3("ldViewer")}</p>}
      <label className="c3-lab">
        <span>{v3("ldSearch")}</span>
        <input className="c3-field" aria-label={v3("ldSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c3-row" role="group" aria-label={v3("ldAll")}>
        <button type="button" className="c3-chip" data-on={stage ? "0" : "1"} aria-pressed={!stage} onClick={() => setStage("")}>{v3("ldAll")}</button>
        <button type="button" className="c3-chip" data-on={stage === "none" ? "1" : "0"} aria-pressed={stage === "none"} onClick={() => setStage("none")}>{v3("ldNoStage")}</button>
        {stages.map((item) => (
          <button key={item} type="button" className="c3-chip" data-on={stage === item ? "1" : "0"} aria-pressed={stage === item} onClick={() => setStage(item)}>{item}</button>
        ))}
      </div>
      {data.loading && !loaded.length && <p className="c3-muted">{v3("ldLoading")}</p>}
      {data.error && <p className="c3-muted">{v3("ldFailed")} {tx("failed")}</p>}
      {!data.loading && !data.error && !loaded.length && <p className="c3-empty">{v3("ldNone")}</p>}
      {!data.loading && !data.error && loaded.length > 0 && !shown.length && <p className="c3-empty">{v3("ldEmpty")}</p>}
      <ul className="c3-pipe-cards">
        {shown.map((row) => {
          const current = stageOf(row);
          const picked = choice[row.id] || "";
          const partner = affiliateOf(row);
          const money = currencyOf(row);
          return (
            <li key={row.id} className="c3-pipe-card" data-watch={watch.includes(row.id) ? "1" : "0"}>
              <div className="c3-row c3-between">
                <strong>{row.name || "—"}</strong>
                <span className="c3-pipe-stage">{current || v3("ldNoStage")}</span>
              </div>
              <p className="c3-muted">{row.email || "—"}</p>
              <p className="c3-muted">{v3("ldAffiliate")} {partner || v3("ldNoAffiliate")}</p>
              <p className="c3-muted">{v3("ldCurrency")} {money || "—"}</p>
              <div className="c3-row">
                <button type="button" className="c3-btn" data-lead-watch="" aria-pressed={watch.includes(row.id)} onClick={() => storeWatch(toggleId(watch, row.id))}>{watch.includes(row.id) ? v3("ldUnpin") : v3("ldPin")}</button>
                <Link className="c3-btn" href={crmv3Href(base, `customers/${row.id}`)}>{v3("ldOpen")}</Link>
              </div>
              {!viewer && (
                <div className="c3-row">
                  <label className="c3-lab">
                    <span>{v3("ldStage")}</span>
                    <select className="c3-select" aria-label={v3("ldStage")} aria-required={false} value={picked} onChange={(event) => setChoice({ ...choice, [row.id]: event.target.value })}>
                      <option value="">{v3("ldNeedStage")}</option>
                      {SALE_STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}
                    </select>
                  </label>
                  <button type="button" className="c3-btn" disabled={!picked} onClick={() => setPending({ id: row.id, name: row.name || row.email || row.id, stage: picked })}>{v3("ldSet")}</button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {pending && (
        <div className="c3-pay-confirm" role="dialog" aria-modal="true" data-confirm="">
          <p>{v3("ldConfirmLead")}</p>
          <p><strong>{pending.name}</strong> · {pending.stage}</p>
          <div className="c3-row">
            <button type="button" className="c3-btn c3-btn-hot" disabled={busy || !pending.stage} onClick={() => void confirm()}>{v3("ldConfirm")}</button>
            <button type="button" className="c3-btn" onClick={() => setPending(null)}>{v3("ldCancel")}</button>
          </div>
        </div>
      )}
      {msg && <p className="c3-muted">{msg}</p>}
    </section>
  );
}

export function QuietDesk() {
  const v3 = useV3();
  const [muted, setMuted] = useState<string[]>([]);
  const [focus, setFocus] = useState(false);
  const [quiet, setQuiet] = useState({ start: "", end: "" });
  useEffect(() => {
    setMuted(readMute(readJson(MUTE_KEY, [])));
    setFocus(readFocusFlag(readJson(FOCUS_FLAG, false)));
    setQuiet(readQuiet(readJson(QUIET_KEY, {})));
  }, []);
  const now = nowMinutes(new Date());
  const sample = shouldAlert({ kind: "info", muted, focus, start: quiet.start, end: quiet.end, nowMin: now });

  function storeMute(next: string[]) {
    setMuted(next);
    writeJson(MUTE_KEY, next);
  }
  function storeFocus(next: boolean) {
    setFocus(next);
    writeJson(FOCUS_FLAG, next);
    window.dispatchEvent(new CustomEvent("crmv3:focus", { detail: next }));
  }
  function storeQuiet(next: { start: string; end: string }) {
    setQuiet(next);
    writeJson(QUIET_KEY, next);
  }

  return (
    <section className="c3-quiet-desk" aria-label={v3("qfTitle")} data-quiet-desk="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("qfSub")}</p>
          <h2 className="c3-title">{v3("qfTitle")}</h2>
        </div>
        <p className="c3-muted">{sample && !inQuiet(now, quiet.start, quiet.end) ? v3("qfListening") : v3("qfQuiet")}</p>
      </header>
      <p className="c3-muted">{v3("qfHint")}</p>
      <p className="c3-muted">{v3("qfLocal")}</p>
      <div className="c3-row" role="group" aria-label={v3("qfMute")}>
        <span className="c3-muted">{v3("qfMute")}</span>
        {ALERT_KINDS.map((kind) => (
          <button key={kind} type="button" className="c3-chip" data-on={muted.includes(kind) ? "1" : "0"} aria-pressed={muted.includes(kind)} onClick={() => storeMute(toggleMute(muted, kind))}>{v3(KIND_LABEL[kind])}</button>
        ))}
      </div>
      <div className="c3-row" role="group" aria-label={v3("qfFocus")}>
        <button type="button" className="c3-chip" data-on={focus ? "1" : "0"} aria-pressed={focus} onClick={() => storeFocus(!focus)}>{focus ? v3("qfFocusOn") : v3("qfFocusOff")}</button>
      </div>
      <div className="c3-row">
        <label className="c3-lab">
          <span>{v3("qfStart")}</span>
          <input className="c3-field" type="time" aria-label={v3("qfStart")} value={quiet.start} onChange={(event) => storeQuiet({ ...quiet, start: event.target.value })} />
        </label>
        <label className="c3-lab">
          <span>{v3("qfEnd")}</span>
          <input className="c3-field" type="time" aria-label={v3("qfEnd")} value={quiet.end} onChange={(event) => storeQuiet({ ...quiet, end: event.target.value })} />
        </label>
      </div>
      <p className="c3-muted">{v3("qfSame")}</p>
      <ul className="c3-quiet-kinds">
        {ALERT_KINDS.map((kind) => {
          const on = shouldAlert({ kind, muted, focus, start: quiet.start, end: quiet.end, nowMin: now });
          return <li key={kind} data-on={on ? "1" : "0"}>{v3(KIND_LABEL[kind])} · {on ? v3("qfListening") : v3("qfQuiet")}</li>;
        })}
      </ul>
    </section>
  );
}
