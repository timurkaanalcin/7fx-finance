"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CrmV3CopyKey } from "@/lib/crmv3/copy";
import { readJson, writeJson } from "@/lib/crmv3/bridge";
import { useEscape } from "@/lib/crmv3/focus";
import { ROLE_KEY, deskRole } from "@/lib/crmv3/inbox-sla";
import { crmv3Href } from "@/lib/crmv3/sections";
import {
  CHROME_KEY,
  GOLD_KEY,
  GOLD_LEVELS,
  PIN_KEY,
  SNOOZE_KEY,
  assignBody,
  clearSnooze,
  closePlan,
  isSnoozed,
  isUnread,
  lastMessage,
  readChrome,
  readGold,
  readIds,
  readSnooze,
  snoozeUntil,
  sortThreads,
  threadId,
  toggleId,
  visibleThreads,
  withSnooze,
  type ChromeMode,
  type GoldLevel,
  type TriageThread,
} from "@/lib/crmv3/triage";
import { sendJson, useJson, when, type Tx } from "../kit";
import { useV3 } from "./store";

const GOLD_LABEL: Record<GoldLevel, CrmV3CopyKey> = { soft: "acSoft", desk: "acDesk", deep: "acDeep" };

type Pending = { userId: string; name: string; action: "assign" | "close"; staffId: string };

export function TriageBoard({ base, locale, tx }: { base: string; locale: string; tx: Tx }) {
  const v3 = useV3();
  const data = useJson<{ threads?: TriageThread[] }>("/api/admin/chat?take=30");
  const staff = useJson<{ workers?: { id: string; name?: string | null; email?: string | null }[] }>("/api/admin/workers?take=40");
  const [query, setQuery] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [showSnoozed, setShowSnoozed] = useState(false);
  const [pins, setPins] = useState<string[]>([]);
  const [snooze, setSnooze] = useState<Record<string, string>>({});
  const [now, setNow] = useState(() => Date.now());
  const [staffPick, setStaffPick] = useState<Record<string, string>>({});
  const [pending, setPending] = useState<Pending | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [viewer, setViewer] = useState(false);
  useEscape(Boolean(pending) && !busy, () => setPending(null));
  useEffect(() => {
    setPins(readIds(readJson(PIN_KEY, [])));
    setSnooze(readSnooze(readJson(SNOOZE_KEY, {})));
    setViewer(deskRole(readJson(ROLE_KEY, "desk")) === "viewer");
    const onRole = () => setViewer(deskRole(readJson(ROLE_KEY, "desk")) === "viewer");
    window.addEventListener("crmv3:desk-role", onRole);
    return () => window.removeEventListener("crmv3:desk-role", onRole);
  }, []);
  const loaded = data.data?.threads || [];
  const shown = sortThreads(visibleThreads(loaded, query, unreadOnly, snooze, showSnoozed, now), pins);

  function storePins(next: string[]) {
    setPins(next);
    writeJson(PIN_KEY, next);
  }
  function storeSnooze(next: Record<string, string>) {
    setSnooze(next);
    writeJson(SNOOZE_KEY, next);
  }

  async function confirm() {
    if (!pending || busy || viewer) return;
    setBusy(true);
    try {
      if (pending.action === "assign") {
        const body = assignBody(pending.staffId, note);
        if (!body) return;
        const res = await sendJson(`/api/admin/users/${encodeURIComponent(pending.userId)}`, "PATCH", body);
        setMsg(`${pending.name} · ${res.ok ? v3("trSaved") : `${v3("trNotSaved")} ${res.error || ""}`}`);
        if (res.ok) {
          setPending(null);
          setNote("");
          data.reload();
        }
        return;
      }
      const plan = closePlan(pending.userId, note);
      if (!plan) return;
      const read = await sendJson("/api/admin/chat/presence", "POST", plan.presence);
      const noted = plan.note ? await sendJson(`/api/admin/users/${encodeURIComponent(pending.userId)}`, "PATCH", plan.note) : { ok: true, error: "" };
      const ok = read.ok && noted.ok;
      setMsg(`${pending.name} · ${ok ? v3("trSaved") : `${v3("trNotSaved")} ${read.error || noted.error || ""}`}`);
      if (ok) {
        setPending(null);
        setNote("");
        data.reload();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="c3-triage-desk" aria-label={v3("trTitle")} data-triage="1" data-viewer={viewer ? "1" : "0"}>
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("trSub")}</p>
          <h2 className="c3-title">{v3("trTitle")}</h2>
        </div>
        <p className="c3-muted">{v3("trCount")} {shown.length}</p>
      </header>
      <p className="c3-muted">{v3("trHint")}</p>
      <div className="c3-row">
        <button type="button" className="c3-chip" data-on={viewer ? "1" : "0"} aria-pressed={viewer} onClick={() => {
          const next = viewer ? "desk" : "viewer";
          writeJson(ROLE_KEY, next);
          setViewer(next === "viewer");
          window.dispatchEvent(new Event("crmv3:desk-role"));
        }}>{v3("inViewerChip")}</button>
      </div>
      {viewer && <p className="c3-muted">{v3("trViewer")}</p>}
      <label className="c3-lab">
        <span>{v3("trSearch")}</span>
        <input className="c3-field" aria-label={v3("trSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c3-row" role="group" aria-label={v3("trAll")}>
        <button type="button" className="c3-chip" data-on={!unreadOnly && !showSnoozed ? "1" : "0"} aria-pressed={!unreadOnly && !showSnoozed} onClick={() => { setUnreadOnly(false); setShowSnoozed(false); }}>{v3("trAll")}</button>
        <button type="button" className="c3-chip" data-on={unreadOnly ? "1" : "0"} aria-pressed={unreadOnly} onClick={() => { setUnreadOnly(true); setShowSnoozed(false); }}>{v3("trUnread")}</button>
        <button type="button" className="c3-chip" data-on={showSnoozed ? "1" : "0"} aria-pressed={showSnoozed} onClick={() => { setShowSnoozed(true); setUnreadOnly(false); }}>{v3("trSnoozed")}</button>
      </div>
      {data.loading && !loaded.length && <p className="c3-muted">{v3("trLoading")}</p>}
      {data.error && <p className="c3-muted">{v3("trFailed")} {tx("failed")}</p>}
      {!data.loading && !data.error && !loaded.length && <p className="c3-empty">{v3("trNone")}</p>}
      {!data.loading && !data.error && loaded.length > 0 && !shown.length && <p className="c3-empty">{v3("trEmpty")}</p>}
      <ul className="c3-triage-cards">
        {shown.map((row) => {
          const id = threadId(row);
          const unread = isUnread(row);
          const last = lastMessage(row);
          const pinned = pins.includes(id);
          const sleeping = isSnoozed(snooze[id], now);
          return (
            <li key={id} className="c3-triage-card" data-pinned={pinned ? "1" : "0"} data-unread={unread ? "1" : "0"}>
              <div className="c3-row c3-between">
                <strong>{row.trader || "—"}</strong>
                {unread && <span className="c3-triage-unread">{v3("trUnread")}</span>}
              </div>
              <p className="c3-muted">{row.desk || "—"} · {when(row.lastAt || last?.createdAt, locale)}</p>
              <p>{last?.body || v3("trNoMessage")}</p>
              <p className="c3-muted">{row.profile?.assigneeName || "—"}</p>
              <div className="c3-row">
                <button type="button" className="c3-btn" aria-pressed={pinned} onClick={() => storePins(toggleId(pins, id))}>{pinned ? v3("trUnpin") : v3("trPin")}</button>
                {sleeping ? (
                  <button type="button" className="c3-btn" onClick={() => storeSnooze(clearSnooze(snooze, id))}>{v3("trUnsnooze")}</button>
                ) : (
                  <button type="button" className="c3-btn" onClick={() => { const next = withSnooze(snooze, id, snoozeUntil(Date.now())); setNow(Date.now()); storeSnooze(next); }}>{v3("trSnooze")}</button>
                )}
                <Link className="c3-btn" href={crmv3Href(base, "thread")}>{v3("trOpen")}</Link>
              </div>
              {!viewer && (
                <div className="c3-row">
                  <label className="c3-lab">
                    <span>{v3("trStaff")}</span>
                    <select className="c3-select" aria-label={v3("trStaff")} value={staffPick[id] || ""} onChange={(event) => setStaffPick({ ...staffPick, [id]: event.target.value })}>
                      <option value="">{v3("trNeedStaff")}</option>
                      {(staff.data?.workers || []).map((person) => <option key={person.id} value={person.id}>{person.name || person.email || person.id}</option>)}
                    </select>
                  </label>
                  <button type="button" className="c3-btn" disabled={!staffPick[id]} onClick={() => { setNote(""); setPending({ userId: id, name: row.trader || id, action: "assign", staffId: staffPick[id] }); }}>{v3("trAssign")}</button>
                  <button type="button" className="c3-btn" onClick={() => { setNote(""); setPending({ userId: id, name: row.trader || id, action: "close", staffId: "" }); }}>{v3("trClose")}</button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {pending && (
        <div className="c3-pay-confirm" role="dialog" aria-modal="true" data-confirm="">
          <p>{v3("trConfirmLead")}</p>
          <p><strong>{pending.name}</strong> · {pending.action === "assign" ? v3("trAssign") : v3("trClose")}</p>
          <label className="c3-lab">
            <span>{v3("trNote")}</span>
            <input className="c3-field" aria-label={v3("trNote")} aria-required={false} value={note} onChange={(event) => setNote(event.target.value)} />
          </label>
          <p className="c3-muted">{v3("trNoteOptional")}</p>
          <div className="c3-row">
            <button type="button" className="c3-btn c3-btn-hot" disabled={busy || (pending.action === "assign" && !pending.staffId)} onClick={() => void confirm()}>{v3("trConfirm")}</button>
            <button type="button" className="c3-btn" onClick={() => setPending(null)}>{v3("trCancel")}</button>
          </div>
        </div>
      )}
      {msg && <p className="c3-muted">{msg}</p>}
    </section>
  );
}

export function AccentStrip() {
  const v3 = useV3();
  const [gold, setGold] = useState<GoldLevel>("desk");
  const [chrome, setChrome] = useState<ChromeMode>("roomy");
  useEffect(() => {
    setGold(readGold(readJson(GOLD_KEY, "desk")));
    setChrome(readChrome(readJson(CHROME_KEY, "roomy")));
  }, []);

  function pickGold(next: GoldLevel) {
    setGold(next);
    writeJson(GOLD_KEY, next);
    window.dispatchEvent(new CustomEvent("crmv3:gold", { detail: next }));
  }
  function pickChrome(next: ChromeMode) {
    setChrome(next);
    writeJson(CHROME_KEY, next);
    window.dispatchEvent(new CustomEvent("crmv3:chrome", { detail: next }));
  }

  return (
    <section className="c3-accent-strip" aria-label={v3("acTitle")} data-accent-strip="1" data-gold={gold} data-chrome={chrome}>
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("acSub")}</p>
          <h2 className="c3-title">{v3("acTitle")}</h2>
        </div>
      </header>
      <p className="c3-muted">{v3("acHint")}</p>
      <p className="c3-muted">{v3("acLocal")}</p>
      <div className="c3-row" role="group" aria-label={v3("acGold")}>
        <span className="c3-muted">{v3("acGold")}</span>
        {GOLD_LEVELS.map((level) => (
          <button key={level} type="button" className="c3-swatch" data-gold={level} data-on={gold === level ? "1" : "0"} aria-pressed={gold === level} onClick={() => pickGold(level)}>{v3(GOLD_LABEL[level])}</button>
        ))}
      </div>
      <div className="c3-row" role="group" aria-label={v3("acChrome")}>
        <span className="c3-muted">{v3("acChrome")}</span>
        <button type="button" className="c3-chip" data-on={chrome === "roomy" ? "1" : "0"} aria-pressed={chrome === "roomy"} onClick={() => pickChrome("roomy")}>{v3("acRoomy")}</button>
        <button type="button" className="c3-chip" data-on={chrome === "dense" ? "1" : "0"} aria-pressed={chrome === "dense"} onClick={() => pickChrome("dense")}>{v3("acDense")}</button>
      </div>
      <p className="c3-muted">{v3("acPreview")}</p>
      <div className="c3-accent-preview" data-gold={gold}>
        <span data-gold="soft" />
        <span data-gold="desk" />
        <span data-gold="deep" />
      </div>
    </section>
  );
}
