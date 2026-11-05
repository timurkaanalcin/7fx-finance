"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readJson, writeJson } from "@/lib/crmv3/bridge";
import type { CrmV3CopyKey } from "@/lib/crmv3/copy";
import {
  PANELS,
  PANEL_KEY,
  SNOOZE_KEY,
  WINDOWS,
  WINDOW_KEY,
  clearSnooze,
  dateSource,
  docStatus,
  dueState,
  loadedDate,
  readPanel,
  readSnooze,
  readWindow,
  reviewPlan,
  snoozeUntil,
  visibleDocs,
  withSnooze,
  type DocRow,
  type DocWindow,
  type PanelDensity,
} from "@/lib/crmv3/expiry";
import { useEscape } from "@/lib/crmv3/focus";
import { ROLE_KEY, deskRole } from "@/lib/crmv3/inbox-sla";
import { crmv3Href } from "@/lib/crmv3/sections";
import { sendJson, useJson, when, type Tx } from "../kit";
import { useV3 } from "./store";

const DUE_LABEL: Record<string, CrmV3CopyKey> = {
  due: "exDue",
  fresh: "exFresh",
  none: "exNoDate",
};

const SOURCE_LABEL: Record<string, CrmV3CopyKey> = {
  reviewed: "exReviewed",
  created: "exCreated",
  none: "exNoDate",
};

export function ExpiryWatch({ base, locale, tx }: { base: string; locale: string; tx: Tx }) {
  const v3 = useV3();
  const data = useJson<{ documents?: DocRow[] }>("/api/admin/documents?take=40");
  const [query, setQuery] = useState("");
  const [onlyDue, setOnlyDue] = useState(false);
  const [showSnoozed, setShowSnoozed] = useState(false);
  const [windowDays, setWindowDays] = useState<DocWindow>(30);
  const [snooze, setSnooze] = useState<Record<string, string>>({});
  const [now, setNow] = useState(() => Date.now());
  const [pending, setPending] = useState<{ id: string; name: string; action: "APPROVED" | "REJECTED" } | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [viewer, setViewer] = useState(false);
  useEscape(Boolean(pending) && !busy, () => setPending(null));
  useEffect(() => {
    setWindowDays(readWindow(readJson(WINDOW_KEY, 30)));
    setSnooze(readSnooze(readJson(SNOOZE_KEY, {})));
    setViewer(deskRole(readJson(ROLE_KEY, "desk")) === "viewer");
    const onRole = () => setViewer(deskRole(readJson(ROLE_KEY, "desk")) === "viewer");
    window.addEventListener("crmv3:desk-role", onRole);
    return () => window.removeEventListener("crmv3:desk-role", onRole);
  }, []);
  const loaded = data.data?.documents || [];
  const shown = visibleDocs(loaded, query, onlyDue, snooze, showSnoozed, now, windowDays);

  function storeWindow(next: DocWindow) {
    setWindowDays(next);
    writeJson(WINDOW_KEY, next);
  }

  function storeSnooze(next: Record<string, string>) {
    setSnooze(next);
    setNow(Date.now());
    writeJson(SNOOZE_KEY, next);
  }

  async function confirm() {
    if (!pending || busy || viewer) return;
    const body = reviewPlan(pending.id, pending.action, note);
    if (!body) return;
    setBusy(true);
    try {
      const res = await sendJson("/api/admin/documents", "POST", body);
      setMsg(`${pending.name} · ${res.ok ? tx("saved") : res.error || tx("failed")}`);
      if (res.ok) {
        setPending(null);
        setNote("");
        data.reload();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="c3-expiry-desk" aria-label={v3("exTitle")} data-expiry-desk="1" data-viewer={viewer ? "1" : "0"}>
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("exSub")}</p>
          <h2 className="c3-title">{v3("exTitle")}</h2>
        </div>
        <p className="c3-muted">{v3("exCount")} {shown.length}</p>
      </header>
      <p className="c3-muted">{v3("exHint")}</p>
      <p className="c3-muted">{v3("exLocal")}</p>
      <div className="c3-row">
        <button type="button" className="c3-chip" data-on={viewer ? "1" : "0"} aria-pressed={viewer} onClick={() => {
          const next = viewer ? "desk" : "viewer";
          writeJson(ROLE_KEY, next);
          setViewer(next === "viewer");
          window.dispatchEvent(new Event("crmv3:desk-role"));
        }}>{v3("inViewerChip")}</button>
      </div>
      {viewer && <p className="c3-muted">{v3("exViewer")}</p>}
      <label className="c3-lab">
        <span>{v3("exSearch")}</span>
        <input className="c3-field" aria-label={v3("exSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c3-row" role="group" aria-label={v3("exAll")}>
        <button type="button" className="c3-chip" data-on={!onlyDue && !showSnoozed ? "1" : "0"} aria-pressed={!onlyDue && !showSnoozed} onClick={() => { setOnlyDue(false); setShowSnoozed(false); }}>{v3("exAll")}</button>
        <button type="button" className="c3-chip" data-on={onlyDue ? "1" : "0"} aria-pressed={onlyDue} onClick={() => { setOnlyDue(true); setShowSnoozed(false); }}>{v3("exDue")}</button>
        <button type="button" className="c3-chip" data-on={showSnoozed ? "1" : "0"} aria-pressed={showSnoozed} onClick={() => { setShowSnoozed(true); setOnlyDue(false); }}>{v3("exSnoozed")}</button>
        {WINDOWS.map((days) => (
          <button key={days} type="button" className="c3-chip" data-on={windowDays === days ? "1" : "0"} aria-pressed={windowDays === days} onClick={() => storeWindow(days)}>{v3("exWindow")} {days} {v3("exDays")}</button>
        ))}
      </div>
      {data.loading && !loaded.length && <p className="c3-muted">{v3("exLoading")}</p>}
      {data.error && <p className="c3-muted">{v3("exFailed")} {tx("failed")}</p>}
      {!data.loading && !data.error && !loaded.length && <p className="c3-empty">{v3("exNone")}</p>}
      {!data.loading && !data.error && loaded.length > 0 && !shown.length && <p className="c3-empty">{v3("exEmpty")}</p>}
      <ul className="c3-expiry-cards">
        {shown.map((row) => {
          const due = dueState(row, now, windowDays);
          const source = dateSource(row);
          const at = loadedDate(row);
          const pendingRow = docStatus(row) === "PENDING";
          return (
            <li key={row.id} className="c3-expiry-card" data-due={due} data-source={source}>
              <div className="c3-row c3-between">
                <strong>{row.name || row.docType || "—"}</strong>
                <span className="c3-expiry-due" data-due={due}>{v3(DUE_LABEL[due])}</span>
              </div>
              <p className="c3-muted">{row.trader || "—"} · {row.docType || "—"} · {row.status || "—"}</p>
              <p className="c3-muted">{v3(SOURCE_LABEL[source])} {at ? when(at, locale) : "—"}</p>
              <div className="c3-row">
                {row.traderId && <Link className="c3-btn" href={crmv3Href(base, `customers/${row.traderId}`)}>{v3("exOpen")}</Link>}
                {showSnoozed ? (
                  <button type="button" className="c3-btn" onClick={() => storeSnooze(clearSnooze(snooze, row.id))}>{v3("exShow")}</button>
                ) : (
                  <button type="button" className="c3-btn" onClick={() => storeSnooze(withSnooze(snooze, row.id, snoozeUntil(Date.now())))}>{v3("exSnooze")}</button>
                )}
                {!viewer && pendingRow && (
                  <>
                    <button type="button" className="c3-btn" onClick={() => { setNote(""); setPending({ id: row.id, name: row.name || row.id, action: "APPROVED" }); }}>{v3("exApprove")}</button>
                    <button type="button" className="c3-btn" onClick={() => { setNote(""); setPending({ id: row.id, name: row.name || row.id, action: "REJECTED" }); }}>{v3("exReject")}</button>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {pending && (
        <div className="c3-pay-confirm" role="dialog" aria-modal="true" data-confirm="">
          <p>{v3("exConfirmLead")}</p>
          <p><strong>{pending.name}</strong> · {pending.action === "APPROVED" ? v3("exApprove") : v3("exReject")}</p>
          <label className="c3-lab">
            <span>{v3("exNote")}</span>
            <input className="c3-field" aria-label={v3("exNote")} aria-required={false} value={note} onChange={(event) => setNote(event.target.value)} />
          </label>
          <p className="c3-muted">{v3("exNoteOptional")}</p>
          <div className="c3-row">
            <button type="button" className="c3-btn c3-btn-hot" disabled={busy} onClick={() => void confirm()}>{v3("exConfirm")}</button>
            <button type="button" className="c3-btn" onClick={() => setPending(null)}>{v3("exCancel")}</button>
          </div>
        </div>
      )}
      {msg && <p className="c3-muted">{msg}</p>}
    </section>
  );
}

export function PanelDensityStrip() {
  const v3 = useV3();
  const [panel, setPanel] = useState<PanelDensity>("desk");
  useEffect(() => { setPanel(readPanel(readJson(PANEL_KEY, "desk"))); }, []);
  const label: Record<PanelDensity, CrmV3CopyKey> = { roomy: "lyRoomy", desk: "lyDesk", compact: "lyCompact" };

  function choose(next: PanelDensity) {
    setPanel(next);
    writeJson(PANEL_KEY, next);
    window.dispatchEvent(new CustomEvent("crmv3:panel", { detail: next }));
  }

  return (
    <section className="c3-panel-strip" aria-label={v3("lyTitle")} data-panel-strip="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("lySub")}</p>
          <h2 className="c3-title">{v3("lyTitle")}</h2>
        </div>
      </header>
      <p className="c3-muted">{v3("lyHint")}</p>
      <p className="c3-muted">{v3("lyLocal")} · {v3("lyPad")}</p>
      <div className="c3-row" role="group" aria-label={v3("lySub")}>
        {PANELS.map((item) => (
          <button key={item} type="button" className="c3-chip" data-panel={item} data-on={panel === item ? "1" : "0"} aria-pressed={panel === item} onClick={() => choose(item)}>{v3(label[item])}</button>
        ))}
      </div>
      <p className="c3-muted">{v3("lyPreview")}</p>
      <div className="c3-panel-preview" data-panel={panel}>
        {PANELS.map((item) => (
          <span key={item} data-panel={item} data-on={panel === item ? "1" : "0"}>{v3(label[item])}</span>
        ))}
      </div>
    </section>
  );
}
