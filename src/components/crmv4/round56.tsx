"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SALE_STATUSES } from "@/lib/membership";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
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
} from "@/lib/crmv4/round56";
import { crmv4Href } from "@/lib/crmv4/sections";
import { storedRole } from "./round5";
import { useEscape } from "./round40";
import { sendJson, useJson, type Tx } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const KIND_LABEL: Record<AlertKind, CrmV4CopyKey> = {
  info: "qfKindInfo",
  chat: "qfKindChat",
  handoff: "qfKindHandoff",
  ticket: "qfKindTicket",
  payout: "qfKindPayout",
};

export function LeadBoard({ base, v4, tx }: { base: string; v4: V4; tx: Tx }) {
  const data = useJson<{ users?: LeadRow[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [stage, setStage] = useState("");
  const [query, setQuery] = useState("");
  const [watch, setWatch] = useState<string[]>([]);
  const [choice, setChoice] = useState<Record<string, string>>({});
  const [pending, setPending] = useState<{ id: string; name: string; stage: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [viewer, setViewer] = useState(false);
  useEscape(Boolean(pending), () => setPending(null));
  useEffect(() => {
    setWatch(readIds(readJson(WATCH_KEY, [])));
    setViewer(storedRole() === "viewer");
    const onRole = () => setViewer(storedRole() === "viewer");
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
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
      setMsg(`${pending.name} · ${res.ok ? v4("ldSaved") : `${v4("ldNotSaved")} ${res.error || ""}`}`);
      if (res.ok) {
        setPending(null);
        data.reload();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="c4-pipe-desk c4-lead-chapter" aria-label={v4("ldTitle")} data-lead-board="1" data-viewer={viewer ? "1" : "0"} data-desk="chapter">
      <header className="c4-lead-chapter-mast">
        <p className="c4-lead-chapter-seal" data-logo="mono">7FX</p>
        <div>
          <p className="c4-lead-chapter-kicker">{v4("ldSub")}</p>
          <h2 className="c4-title c4-lead-chapter-title">{v4("ldTitle")}</h2>
        </div>
        <p className="c4-lead-chapter-count">{v4("ldCount")} {shown.length}</p>
      </header>
      <p className="c4-lead-chapter-links">
        <Link href={crmv4Href(base, "vcd")}>{v4("vcdTitle")}</Link>
        <Link href={crmv4Href(base, "smk")}>{v4("smkTitle")}</Link>
      </p>
      <p className="c4-meta c4-lead-chapter-rule">{v4("ldHint")}</p>
      {viewer && <p className="c4-meta">{v4("ldViewer")}</p>}
      <label className="c4-lab">
        <span>{v4("ldSearch")}</span>
        <input className="c4-field c4-lead-chapter-search" aria-label={v4("ldSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c4-row" role="group" aria-label={v4("ldAll")}>
        <button type="button" className="c4-chip" data-on={stage ? "0" : "1"} aria-pressed={!stage} onClick={() => setStage("")}>{v4("ldAll")}</button>
        <button type="button" className="c4-chip" data-on={stage === "none" ? "1" : "0"} aria-pressed={stage === "none"} onClick={() => setStage("none")}>{v4("ldNoStage")}</button>
        {stages.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={stage === item ? "1" : "0"} aria-pressed={stage === item} onClick={() => setStage(item)}>{item}</button>
        ))}
      </div>
      {data.loading && !loaded.length && <p className="c4-meta">{v4("ldLoading")}</p>}
      {data.error && <p className="c4-meta">{v4("ldFailed")} {tx("failed")}</p>}
      {!data.loading && !data.error && !loaded.length && <p className="c4-pay-empty c4-lead-chapter-empty">{v4("ldNone")}</p>}
      {!data.loading && !data.error && loaded.length > 0 && !shown.length && <p className="c4-pay-empty c4-lead-chapter-empty">{v4("ldEmpty")}</p>}
      <ul className="c4-pipe-cards">
        {shown.map((row) => {
          const current = stageOf(row);
          const picked = choice[row.id] || "";
          const partner = affiliateOf(row);
          const money = currencyOf(row);
          return (
            <li key={row.id} className="c4-pipe-card" data-watch={watch.includes(row.id) ? "1" : "0"}>
              <div className="c4-row c4-between">
                <strong>{row.name || "—"}</strong>
                <span className="c4-pipe-stage">{current || v4("ldNoStage")}</span>
              </div>
              <p className="c4-meta">{row.email || "—"}</p>
              <p className="c4-meta">{v4("ldAffiliate")} {partner || v4("ldNoAffiliate")}</p>
              <p className="c4-meta">{v4("ldCurrency")} {money || "—"}</p>
              <div className="c4-row">
                <button type="button" className="c4-btn" data-lead-watch="" aria-pressed={watch.includes(row.id)} onClick={() => storeWatch(toggleId(watch, row.id))}>{watch.includes(row.id) ? v4("ldUnpin") : v4("ldPin")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{v4("ldOpen")}</Link>
              </div>
              {!viewer && (
                <div className="c4-row">
                  <label className="c4-lab">
                    <span>{v4("ldStage")}</span>
                    <select className="c4-select" aria-label={v4("ldStage")} value={picked} onChange={(event) => setChoice({ ...choice, [row.id]: event.target.value })}>
                      <option value="">{v4("ldNeedStage")}</option>
                      {SALE_STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}
                    </select>
                  </label>
                  <button type="button" className="c4-btn" disabled={!picked} onClick={() => setPending({ id: row.id, name: row.name || row.email || row.id, stage: picked })}>{v4("ldSet")}</button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {pending && (
        <div className="c4-pay-confirm" role="dialog" aria-modal="true" data-confirm="">
          <p>{v4("ldConfirmLead")}</p>
          <p><strong>{pending.name}</strong> · {pending.stage}</p>
          <div className="c4-row">
            <button type="button" className="c4-btn c4-btn-hot" disabled={busy || !pending.stage} onClick={() => void confirm()}>{v4("ldConfirm")}</button>
            <button type="button" className="c4-btn" onClick={() => setPending(null)}>{v4("ldCancel")}</button>
          </div>
        </div>
      )}
      {msg && <p className="c4-meta">{msg}</p>}
    </section>
  );
}

export function QuietDesk({ v4 }: { v4: V4 }) {
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
    window.dispatchEvent(new CustomEvent("crmv4:focus", { detail: next }));
  }
  function storeQuiet(next: { start: string; end: string }) {
    setQuiet(next);
    writeJson(QUIET_KEY, next);
  }

  return (
    <section className="c4-quiet-desk" aria-label={v4("qfTitle")} data-quiet-desk="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-pay-kicker">{v4("qfSub")}</p>
          <h2 className="c4-title">{v4("qfTitle")}</h2>
        </div>
        <p className="c4-meta">{sample && !inQuiet(now, quiet.start, quiet.end) ? v4("qfListening") : v4("qfQuiet")}</p>
      </header>
      <p className="c4-meta">{v4("qfHint")}</p>
      <p className="c4-meta">{v4("qfLocal")}</p>
      <div className="c4-row" role="group" aria-label={v4("qfMute")}>
        <span className="c4-meta">{v4("qfMute")}</span>
        {ALERT_KINDS.map((kind) => (
          <button key={kind} type="button" className="c4-chip" data-on={muted.includes(kind) ? "1" : "0"} aria-pressed={muted.includes(kind)} onClick={() => storeMute(toggleMute(muted, kind))}>{v4(KIND_LABEL[kind])}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("qfFocus")}>
        <button type="button" className="c4-chip" data-on={focus ? "1" : "0"} aria-pressed={focus} onClick={() => storeFocus(!focus)}>{focus ? v4("qfFocusOn") : v4("qfFocusOff")}</button>
      </div>
      <div className="c4-row">
        <label className="c4-lab">
          <span>{v4("qfStart")}</span>
          <input className="c4-field" type="time" aria-label={v4("qfStart")} value={quiet.start} onChange={(event) => storeQuiet({ ...quiet, start: event.target.value })} />
        </label>
        <label className="c4-lab">
          <span>{v4("qfEnd")}</span>
          <input className="c4-field" type="time" aria-label={v4("qfEnd")} value={quiet.end} onChange={(event) => storeQuiet({ ...quiet, end: event.target.value })} />
        </label>
      </div>
      <p className="c4-meta">{v4("qfSame")}</p>
      <ul className="c4-quiet-kinds">
        {ALERT_KINDS.map((kind) => {
          const on = shouldAlert({ kind, muted, focus, start: quiet.start, end: quiet.end, nowMin: now });
          return <li key={kind} data-on={on ? "1" : "0"}>{v4(KIND_LABEL[kind])} · {on ? v4("qfListening") : v4("qfQuiet")}</li>;
        })}
      </ul>
    </section>
  );
}
