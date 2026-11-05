"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import {
  PANELS,
  PANEL_KEY,
  SNOOZE_KEY,
  WINDOWS,
  WINDOW_KEY,
  clearSnooze,
  dateSource,
  withSnooze,
  docStatus,
  dueState,
  loadedDate,
  readPanel,
  readSnooze,
  readWindow,
  reviewPlan,
  snoozeUntil,
  visibleDocs,
  type DocRow,
  type DocWindow,
  type PanelDensity,
} from "@/lib/crmv4/round62";
import { crmv4Href } from "@/lib/crmv4/sections";
import { storedRole } from "./round5";
import { useEscape } from "./round40";
import { sendJson, useJson, when, type Tx } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const DUE_LABEL: Record<string, CrmV4CopyKey> = {
  due: "exDue",
  fresh: "exFresh",
  none: "exNoDate",
};

const SOURCE_LABEL: Record<string, CrmV4CopyKey> = {
  reviewed: "exReviewed",
  created: "exCreated",
  none: "exNoDate",
};

export function ExpiryWatch({ base, v4, locale, tx }: { base: string; v4: V4; locale: string; tx: Tx }) {
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
  useEscape(Boolean(pending), () => setPending(null));
  useEffect(() => {
    setWindowDays(readWindow(readJson(WINDOW_KEY, 30)));
    setSnooze(readSnooze(readJson(SNOOZE_KEY, {})));
    setViewer(storedRole() === "viewer");
    const onRole = () => setViewer(storedRole() === "viewer");
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
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
    <section className="c4-expiry-desk" aria-label={v4("exTitle")} data-expiry-desk="1" data-viewer={viewer ? "1" : "0"}>
      <header className="c4-pay-head">
        <div>
          <p className="c4-pay-kicker">{v4("exSub")}</p>
          <h2 className="c4-title">{v4("exTitle")}</h2>
        </div>
        <p className="c4-meta">{v4("exCount")} {shown.length}</p>
      </header>
      <p className="c4-meta">{v4("exHint")}</p>
      <p className="c4-meta">{v4("exLocal")}</p>
      {viewer && <p className="c4-meta">{v4("exViewer")}</p>}
      <label className="c4-lab">
        <span>{v4("exSearch")}</span>
        <input className="c4-field" aria-label={v4("exSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c4-row" role="group" aria-label={v4("exAll")}>
        <button type="button" className="c4-chip" data-on={!onlyDue && !showSnoozed ? "1" : "0"} aria-pressed={!onlyDue && !showSnoozed} onClick={() => { setOnlyDue(false); setShowSnoozed(false); }}>{v4("exAll")}</button>
        <button type="button" className="c4-chip" data-on={onlyDue ? "1" : "0"} aria-pressed={onlyDue} onClick={() => { setOnlyDue(true); setShowSnoozed(false); }}>{v4("exDue")}</button>
        <button type="button" className="c4-chip" data-on={showSnoozed ? "1" : "0"} aria-pressed={showSnoozed} onClick={() => { setShowSnoozed(true); setOnlyDue(false); }}>{v4("exSnoozed")}</button>
        {WINDOWS.map((days) => (
          <button key={days} type="button" className="c4-chip" data-on={windowDays === days ? "1" : "0"} aria-pressed={windowDays === days} onClick={() => storeWindow(days)}>{v4("exWindow")} {days} {v4("exDays")}</button>
        ))}
      </div>
      {data.loading && !loaded.length && <p className="c4-meta">{v4("exLoading")}</p>}
      {data.error && <p className="c4-meta">{v4("exFailed")} {tx("failed")}</p>}
      {!data.loading && !data.error && !loaded.length && <p className="c4-pay-empty">{v4("exNone")}</p>}
      {!data.loading && !data.error && loaded.length > 0 && !shown.length && <p className="c4-pay-empty">{v4("exEmpty")}</p>}
      <ul className="c4-expiry-cards">
        {shown.map((row) => {
          const due = dueState(row, now, windowDays);
          const source = dateSource(row);
          const at = loadedDate(row);
          const pendingRow = docStatus(row) === "PENDING";
          return (
            <li key={row.id} className="c4-expiry-card" data-due={due} data-source={source}>
              <div className="c4-row c4-between">
                <strong>{row.name || row.docType || "—"}</strong>
                <span className="c4-expiry-due" data-due={due}>{v4(DUE_LABEL[due])}</span>
              </div>
              <p className="c4-meta">{row.trader || "—"} · {row.docType || "—"} · {row.status || "—"}</p>
              <p className="c4-meta">{v4(SOURCE_LABEL[source])} {at ? when(at, locale) : "—"}</p>
              <div className="c4-row">
                {row.traderId && <Link className="c4-btn" href={crmv4Href(base, `customers/${row.traderId}`)}>{v4("exOpen")}</Link>}
                {showSnoozed ? (
                  <button type="button" className="c4-btn" onClick={() => storeSnooze(clearSnooze(snooze, row.id))}>{v4("exShow")}</button>
                ) : (
                  <button type="button" className="c4-btn" onClick={() => storeSnooze(withSnooze(snooze, row.id, snoozeUntil(Date.now())))}>{v4("exSnooze")}</button>
                )}
                {!viewer && pendingRow && (
                  <>
                    <button type="button" className="c4-btn" onClick={() => { setNote(""); setPending({ id: row.id, name: row.name || row.id, action: "APPROVED" }); }}>{v4("exApprove")}</button>
                    <button type="button" className="c4-btn" onClick={() => { setNote(""); setPending({ id: row.id, name: row.name || row.id, action: "REJECTED" }); }}>{v4("exReject")}</button>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {pending && (
        <div className="c4-pay-confirm" role="dialog" aria-modal="true" data-confirm="">
          <p>{v4("exConfirmLead")}</p>
          <p><strong>{pending.name}</strong> · {pending.action === "APPROVED" ? v4("exApprove") : v4("exReject")}</p>
          <label className="c4-lab">
            <span>{v4("exNote")}</span>
            <input className="c4-field" aria-label={v4("exNote")} aria-required={false} value={note} onChange={(event) => setNote(event.target.value)} />
          </label>
          <p className="c4-meta">{v4("exNoteOptional")}</p>
          <div className="c4-row">
            <button type="button" className="c4-btn c4-btn-hot" disabled={busy} onClick={() => void confirm()}>{v4("exConfirm")}</button>
            <button type="button" className="c4-btn" onClick={() => setPending(null)}>{v4("exCancel")}</button>
          </div>
        </div>
      )}
      {msg && <p className="c4-meta">{msg}</p>}
    </section>
  );
}

export function PanelDensityStrip({ v4 }: { v4: V4 }) {
  const [panel, setPanel] = useState<PanelDensity>("desk");
  useEffect(() => { setPanel(readPanel(readJson(PANEL_KEY, "desk"))); }, []);
  const label: Record<PanelDensity, CrmV4CopyKey> = { roomy: "lyRoomy", desk: "lyDesk", compact: "lyCompact" };

  function choose(next: PanelDensity) {
    setPanel(next);
    writeJson(PANEL_KEY, next);
    window.dispatchEvent(new CustomEvent("crmv4:panel", { detail: next }));
  }

  return (
    <section className="c4-panel-strip" aria-label={v4("lyTitle")} data-panel-strip="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-pay-kicker">{v4("lySub")}</p>
          <h2 className="c4-title">{v4("lyTitle")}</h2>
        </div>
      </header>
      <p className="c4-meta">{v4("lyHint")}</p>
      <p className="c4-meta">{v4("lyLocal")} · {v4("lyPad")}</p>
      <div className="c4-row" role="group" aria-label={v4("lySub")}>
        {PANELS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-panel={item} data-on={panel === item ? "1" : "0"} aria-pressed={panel === item} onClick={() => choose(item)}>{v4(label[item])}</button>
        ))}
      </div>
      <p className="c4-meta">{v4("lyPreview")}</p>
      <div className="c4-panel-preview" data-panel={panel}>
        {PANELS.map((item) => (
          <span key={item} data-panel={item} data-on={panel === item ? "1" : "0"}>{v4(label[item])}</span>
        ))}
      </div>
    </section>
  );
}
