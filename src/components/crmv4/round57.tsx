"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
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
} from "@/lib/crmv4/round57";
import { crmv4Href } from "@/lib/crmv4/sections";
import { storedRole } from "./round5";
import { useEscape } from "./round40";
import { sendJson, useJson, when, type Tx } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const GOLD_LABEL: Record<GoldLevel, CrmV4CopyKey> = { soft: "acSoft", desk: "acDesk", deep: "acDeep" };

type Pending = { userId: string; name: string; action: "assign" | "close"; staffId: string };

export function TriageBoard({ base, v4, locale, tx }: { base: string; v4: V4; locale: string; tx: Tx }) {
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
  useEscape(Boolean(pending), () => setPending(null));
  useEffect(() => {
    setPins(readIds(readJson(PIN_KEY, [])));
    setSnooze(readSnooze(readJson(SNOOZE_KEY, {})));
    setViewer(storedRole() === "viewer");
    const onRole = () => setViewer(storedRole() === "viewer");
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
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
        setMsg(`${pending.name} · ${res.ok ? v4("trSaved") : `${v4("trNotSaved")} ${res.error || ""}`}`);
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
      setMsg(`${pending.name} · ${ok ? v4("trSaved") : `${v4("trNotSaved")} ${read.error || noted.error || ""}`}`);
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
    <section className="c4-triage-desk" aria-label={v4("trTitle")} data-triage="1" data-viewer={viewer ? "1" : "0"}>
      <header className="c4-pay-head">
        <div>
          <p className="c4-pay-kicker">{v4("trSub")}</p>
          <h2 className="c4-title">{v4("trTitle")}</h2>
        </div>
        <p className="c4-meta">{v4("trCount")} {shown.length}</p>
      </header>
      <p className="c4-meta">{v4("trHint")}</p>
      {viewer && <p className="c4-meta">{v4("trViewer")}</p>}
      <label className="c4-lab">
        <span>{v4("trSearch")}</span>
        <input className="c4-field" aria-label={v4("trSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c4-row" role="group" aria-label={v4("trAll")}>
        <button type="button" className="c4-chip" data-on={!unreadOnly && !showSnoozed ? "1" : "0"} aria-pressed={!unreadOnly && !showSnoozed} onClick={() => { setUnreadOnly(false); setShowSnoozed(false); }}>{v4("trAll")}</button>
        <button type="button" className="c4-chip" data-on={unreadOnly ? "1" : "0"} aria-pressed={unreadOnly} onClick={() => { setUnreadOnly(true); setShowSnoozed(false); }}>{v4("trUnread")}</button>
        <button type="button" className="c4-chip" data-on={showSnoozed ? "1" : "0"} aria-pressed={showSnoozed} onClick={() => { setShowSnoozed(true); setUnreadOnly(false); }}>{v4("trSnoozed")}</button>
      </div>
      {data.loading && !loaded.length && <p className="c4-meta">{v4("trLoading")}</p>}
      {data.error && <p className="c4-meta">{v4("trFailed")} {tx("failed")}</p>}
      {!data.loading && !data.error && !loaded.length && <p className="c4-pay-empty">{v4("trNone")}</p>}
      {!data.loading && !data.error && loaded.length > 0 && !shown.length && <p className="c4-pay-empty">{v4("trEmpty")}</p>}
      <ul className="c4-triage-cards">
        {shown.map((row) => {
          const id = threadId(row);
          const unread = isUnread(row);
          const last = lastMessage(row);
          const pinned = pins.includes(id);
          const sleeping = isSnoozed(snooze[id], now);
          return (
            <li key={id} className="c4-triage-card" data-pinned={pinned ? "1" : "0"} data-unread={unread ? "1" : "0"}>
              <div className="c4-row c4-between">
                <strong>{row.trader || "—"}</strong>
                {unread && <span className="c4-triage-unread">{v4("trUnread")}</span>}
              </div>
              <p className="c4-meta">{row.desk || "—"} · {when(row.lastAt || last?.createdAt, locale)}</p>
              <p>{last?.body || v4("trNoMessage")}</p>
              <p className="c4-meta">{row.profile?.assigneeName || "—"}</p>
              <div className="c4-row">
                <button type="button" className="c4-btn" aria-pressed={pinned} onClick={() => storePins(toggleId(pins, id))}>{pinned ? v4("trUnpin") : v4("trPin")}</button>
                {sleeping ? (
                  <button type="button" className="c4-btn" onClick={() => storeSnooze(clearSnooze(snooze, id))}>{v4("trUnsnooze")}</button>
                ) : (
                  <button type="button" className="c4-btn" onClick={() => { const next = withSnooze(snooze, id, snoozeUntil(Date.now())); setNow(Date.now()); storeSnooze(next); }}>{v4("trSnooze")}</button>
                )}
                <Link className="c4-btn" href={crmv4Href(base, "thread")}>{v4("trOpen")}</Link>
              </div>
              {!viewer && (
                <div className="c4-row">
                  <label className="c4-lab">
                    <span>{v4("trStaff")}</span>
                    <select className="c4-select" aria-label={v4("trStaff")} value={staffPick[id] || ""} onChange={(event) => setStaffPick({ ...staffPick, [id]: event.target.value })}>
                      <option value="">{v4("trNeedStaff")}</option>
                      {(staff.data?.workers || []).map((person) => <option key={person.id} value={person.id}>{person.name || person.email || person.id}</option>)}
                    </select>
                  </label>
                  <button type="button" className="c4-btn" disabled={!staffPick[id]} onClick={() => { setNote(""); setPending({ userId: id, name: row.trader || id, action: "assign", staffId: staffPick[id] }); }}>{v4("trAssign")}</button>
                  <button type="button" className="c4-btn" onClick={() => { setNote(""); setPending({ userId: id, name: row.trader || id, action: "close", staffId: "" }); }}>{v4("trClose")}</button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {pending && (
        <div className="c4-pay-confirm" role="dialog" aria-modal="true" data-confirm="">
          <p>{v4("trConfirmLead")}</p>
          <p><strong>{pending.name}</strong> · {pending.action === "assign" ? v4("trAssign") : v4("trClose")}</p>
          <label className="c4-lab">
            <span>{v4("trNote")}</span>
            <input className="c4-field" aria-label={v4("trNote")} aria-required={false} value={note} onChange={(event) => setNote(event.target.value)} />
          </label>
          <p className="c4-meta">{v4("trNoteOptional")}</p>
          <div className="c4-row">
            <button type="button" className="c4-btn c4-btn-hot" disabled={busy || (pending.action === "assign" && !pending.staffId)} onClick={() => void confirm()}>{v4("trConfirm")}</button>
            <button type="button" className="c4-btn" onClick={() => setPending(null)}>{v4("trCancel")}</button>
          </div>
        </div>
      )}
      {msg && <p className="c4-meta">{msg}</p>}
    </section>
  );
}

export function AccentStrip({ v4 }: { v4: V4 }) {
  const [gold, setGold] = useState<GoldLevel>("desk");
  const [chrome, setChrome] = useState<ChromeMode>("roomy");
  useEffect(() => {
    setGold(readGold(readJson(GOLD_KEY, "desk")));
    setChrome(readChrome(readJson(CHROME_KEY, "roomy")));
  }, []);

  function pickGold(next: GoldLevel) {
    setGold(next);
    writeJson(GOLD_KEY, next);
    window.dispatchEvent(new CustomEvent("crmv4:gold", { detail: next }));
  }
  function pickChrome(next: ChromeMode) {
    setChrome(next);
    writeJson(CHROME_KEY, next);
    window.dispatchEvent(new CustomEvent("crmv4:chrome", { detail: next }));
  }

  return (
    <section className="c4-accent-strip" aria-label={v4("acTitle")} data-accent-strip="1" data-gold={gold} data-chrome={chrome}>
      <header className="c4-pay-head">
        <div>
          <p className="c4-pay-kicker">{v4("acSub")}</p>
          <h2 className="c4-title">{v4("acTitle")}</h2>
        </div>
      </header>
      <p className="c4-meta">{v4("acHint")}</p>
      <p className="c4-meta">{v4("acLocal")}</p>
      <div className="c4-row" role="group" aria-label={v4("acGold")}>
        <span className="c4-meta">{v4("acGold")}</span>
        {GOLD_LEVELS.map((level) => (
          <button key={level} type="button" className="c4-swatch" data-gold={level} data-on={gold === level ? "1" : "0"} aria-pressed={gold === level} onClick={() => pickGold(level)}>{v4(GOLD_LABEL[level])}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("acChrome")}>
        <span className="c4-meta">{v4("acChrome")}</span>
        <button type="button" className="c4-chip" data-on={chrome === "roomy" ? "1" : "0"} aria-pressed={chrome === "roomy"} onClick={() => pickChrome("roomy")}>{v4("acRoomy")}</button>
        <button type="button" className="c4-chip" data-on={chrome === "dense" ? "1" : "0"} aria-pressed={chrome === "dense"} onClick={() => pickChrome("dense")}>{v4("acDense")}</button>
      </div>
      <p className="c4-meta">{v4("acPreview")}</p>
      <div className="c4-accent-preview" data-gold={gold}>
        <span data-gold="soft" />
        <span data-gold="desk" />
        <span data-gold="deep" />
      </div>
    </section>
  );
}
