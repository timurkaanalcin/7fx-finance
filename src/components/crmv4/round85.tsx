"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import {
  REASON_KEY,
  VOICE_KEY,
  activeReason,
  addSnippet,
  namedReasons,
  readHiddenReasons,
  readSnippets,
  reasonLines,
  reasonText,
  setSnippetHidden,
  toggleReason,
  toggleSnippetPin,
  visibleReasons,
  visibleSnippets,
  visibleWithdrawals,
  type ReasonRow,
  type Snippet,
} from "@/lib/crmv4/round85";
import { crmv4Href } from "@/lib/crmv4/sections";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

type Withdrawal = {
  id: string;
  note?: string | null;
  userId?: string | null;
  user?: { id?: string | null; name?: string | null; email?: string | null } | null;
};

type GlanceRow = ReasonRow & { id: string; userId: string };

export function VoiceTray({ v4 }: { v4: V4 }) {
  const [items, setItems] = useState<Snippet[]>([]);
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");
  const [hidden, setHidden] = useState(false);
  const [copied, setCopied] = useState("");
  useEffect(() => {
    const next = readSnippets(readJson(VOICE_KEY, []));
    setItems(next);
    writeJson(VOICE_KEY, next);
  }, []);
  const shown = visibleSnippets(items, query, hidden);

  function store(next: Snippet[]) {
    setItems(next);
    writeJson(VOICE_KEY, next);
  }

  async function copyText(snippet: Snippet) {
    const body = snippet.text;
    if (!body) return;
      try {
      await navigator.clipboard.writeText(body);
      setCopied(snippet.id);
    } catch {
      setCopied("fail");
    }
  }

  return (
    <section className="c4-voice-tray c4-voice-folio" aria-label={v4("vsTitle")} data-voice-tray="1" data-desk="folio">
      <header className="c4-voice-folio-mast">
        <p className="c4-voice-folio-seal" data-logo="mono">7FX</p>
        <div>
          <p className="c4-voice-folio-kicker">{v4("vsFolioKicker")}</p>
          <h2 className="c4-title c4-voice-folio-title">{v4("vsTitle")}</h2>
          <p className="c4-voice-folio-lead">{v4("vsFolioLead")}</p>
        </div>
        <p className="c4-voice-folio-count">{shown.length}</p>
      </header>
      <ol className="c4-voice-folio-index" aria-label={v4("vsTitle")}>
        <li data-tone="gold">{v4("vsFolioGold")}</li>
        <li data-tone="ink">{v4("vsFolioInk")}</li>
        <li data-tone="ivory">{v4("vsFolioIvory")}</li>
      </ol>
      <p className="c4-voice-folio-hint">{v4("vsHint")}</p>
      <p className="c4-meta">{v4("vsLocal")}</p>
      <form className="c4-row" onSubmit={(event) => {
        event.preventDefault();
        const next = addSnippet(items, { id: `vs-${Date.now()}`, text, at: new Date().toISOString() });
        if (next.length === items.length) return;
        store(next);
        setText("");
      }}>
        <label className="c4-lab">
          <span>{v4("vsText")}</span>
          <input className="c4-field" aria-label={v4("vsText")} value={text} onChange={(event) => setText(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn">{v4("vsAdd")}</button>
      </form>
      <p className="c4-meta">{v4("vsBlank")}</p>
      <label className="c4-lab">
        <span>{v4("vsSearch")}</span>
        <input className="c4-field" aria-label={v4("vsSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c4-row" role="group" aria-label={v4("vsShown")}>
        <button type="button" className="c4-chip" data-on={hidden ? "0" : "1"} aria-pressed={!hidden} onClick={() => setHidden(false)}>{v4("vsShown")}</button>
        <button type="button" className="c4-chip" data-on={hidden ? "1" : "0"} aria-pressed={hidden} onClick={() => setHidden(true)}>{v4("vsHidden")}</button>
      </div>
      {copied === "fail" && <p className="c4-meta">{v4("vsNotCopied")}</p>}
      {!shown.length && <p className="c4-pay-empty">{v4("vsEmpty")}</p>}
      <ul className="c4-voice-list c4-voice-folio-list">
        {shown.map((item) => (
          <li key={item.id} className="c4-voice-card c4-voice-folio-card" data-pinned={item.pinned ? "1" : "0"}>
            <p>{item.text}</p>
            {copied === item.id && <p className="c4-meta">{v4("vsCopied")}</p>}
            <div className="c4-row">
              <button type="button" className="c4-btn" onClick={() => void copyText(item)}>{v4("vsCopy")}</button>
              <button type="button" className="c4-btn" onClick={() => store(toggleSnippetPin(items, item.id))}>{item.pinned ? v4("vsUnpin") : v4("vsPin")}</button>
              <button type="button" className="c4-btn" onClick={() => store(setSnippetHidden(items, item.id, !item.hidden))}>{item.hidden ? v4("vsShow") : v4("vsHide")}</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ReasonGlance({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ requests?: Withdrawal[] }>("/api/admin/withdrawals?take=40");
  const [hiddenReasons, setHiddenReasons] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [blank, setBlank] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [query, setQuery] = useState("");
  const rows = (data.data?.requests || []).map((row): GlanceRow | null => {
    const id = String(row.id || "").trim();
    if (!id) return null;
    const name = String(row.user?.name || row.user?.email || "");
    return {
      id,
      note: row.note,
      label: name,
      userId: String(row.user?.id || row.userId || "").trim(),
    };
  }).filter((row): row is GlanceRow => Boolean(row));
  const lines = reasonLines(rows);
  const present = namedReasons(rows);
  const presentKey = present.join("\n");
  const blankCount = lines.find((line) => !line.reason)?.count || 0;
  useEffect(() => {
    if (data.loading || data.error) return;
    const next = readHiddenReasons(readJson(REASON_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHiddenReasons(next);
    writeJson(REASON_KEY, next);
  }, [data.loading, data.error, presentKey]);
  const chips = visibleReasons(present, hiddenReasons, showHidden);
  const reason = activeReason(selected, chips);
  const shown = visibleWithdrawals(rows, reason, blank, query);

  function store(next: string[], clear: string) {
    setHiddenReasons(next);
    writeJson(REASON_KEY, next);
    if (clear && activeReason(selected, [clear])) setSelected("");
  }

  return (
    <section className="c4-reason-glance" aria-label={v4("wrTitle")} data-reason-glance="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-pay-kicker">{v4("wrSub")}</p>
          <h2 className="c4-title">{v4("wrTitle")}</h2>
        </div>
        <p className="c4-meta">{chips.length}</p>
      </header>
      <p className="c4-meta">{v4("wrHint")}</p>
      <p className="c4-meta">{v4("wrLocal")}</p>
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "payboard")}>{v4("wrBoard")}</Link>
      </p>
      {data.loading && !rows.length && <p className="c4-meta">{v4("wrLoading")}</p>}
      {data.error && <p className="c4-meta">{v4("wrFailed")}</p>}
      {!data.loading && !data.error && !rows.length && <p className="c4-pay-empty">{v4("wrNone")}</p>}
      {blankCount > 0 && (
        <button type="button" className="c4-reason-blank" data-on={blank ? "1" : "0"} aria-pressed={blank} onClick={() => { setBlank((value) => !value); setSelected(""); }}>
          <span>{v4("wrBlank")}</span>
          <span className="c4-meta">{blankCount}</span>
        </button>
      )}
      <div className="c4-row" role="group" aria-label={v4("wrShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("wrShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("wrHidden")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("wrTitle")}>
        <button type="button" className="c4-chip" data-on={!reason && !blank ? "1" : "0"} aria-pressed={!reason && !blank} onClick={() => { setSelected(""); setBlank(false); }}>{v4("wrAll")}</button>
        {chips.map((item) => (
          <span key={item} className="c4-reason-pair" data-reason={item}>
            <button type="button" className="c4-chip" data-on={reason === item ? "1" : "0"} aria-pressed={reason === item} onClick={() => { setBlank(false); setSelected(reason === item ? "" : item); }}>{item}</button>
            <button type="button" className="c4-btn" onClick={() => store(toggleReason(hiddenReasons, item, present), showHidden ? "" : item)}>{showHidden ? v4("wrShow") : v4("wrHide")}</button>
          </span>
        ))}
      </div>
      <label className="c4-lab">
        <span>{v4("wrSearch")}</span>
        <input className="c4-field" aria-label={v4("wrSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c4-pay-empty">{v4("wrEmpty")}</p>}
      <ul className="c4-reason-rows">
        {shown.map((row) => {
          const note = reasonText(row.note);
          return (
            <li key={row.id} data-reason={note || "blank"}>
              <p>{row.label || row.id}</p>
              <p className="c4-meta">{note || v4("wrBlank")}</p>
              {row.userId && <Link className="c4-btn" href={crmv4Href(base, `customers/${row.userId}`)}>{v4("wrCustomer")}</Link>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
