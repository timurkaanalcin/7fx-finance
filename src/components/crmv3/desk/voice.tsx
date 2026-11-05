"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readJson, writeJson } from "@/lib/crmv3/bridge";
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
} from "@/lib/crmv3/voice";
import { crmv3Href } from "@/lib/crmv3/sections";
import { useJson } from "../kit";
import { useV3 } from "./store";

const WITHDRAWALS = "/api/admin/withdrawals?take=40";

type Withdrawal = {
  id: string;
  note?: string | null;
  userId?: string | null;
  user?: { id?: string | null; name?: string | null; email?: string | null } | null;
};

type GlanceRow = ReasonRow & { id: string; userId: string };

export function VoiceTray() {
  const v3 = useV3();
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
    <section className="c3-voice-tray" aria-label={v3("vsTitle")} data-voice-tray="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("vsSub")}</p>
          <h2 className="c3-title">{v3("vsTitle")}</h2>
        </div>
        <p className="c3-muted">{shown.length}</p>
      </header>
      <p className="c3-muted">{v3("vsHint")}</p>
      <p className="c3-muted">{v3("vsLocal")}</p>
      <form className="c3-row" onSubmit={(event) => {
        event.preventDefault();
        const next = addSnippet(items, { id: `vs-${Date.now()}`, text, at: new Date().toISOString() });
        if (next.length === items.length) return;
        store(next);
        setText("");
      }}>
        <label className="c3-lab">
          <span>{v3("vsText")}</span>
          <input className="c3-field" aria-label={v3("vsText")} value={text} onChange={(event) => setText(event.target.value)} />
        </label>
        <button type="submit" className="c3-btn">{v3("vsAdd")}</button>
      </form>
      <p className="c3-muted">{v3("vsBlank")}</p>
      <label className="c3-lab">
        <span>{v3("vsSearch")}</span>
        <input className="c3-field" aria-label={v3("vsSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c3-row" role="group" aria-label={v3("vsShown")}>
        <button type="button" className="c3-chip" data-on={hidden ? "0" : "1"} aria-pressed={!hidden} onClick={() => setHidden(false)}>{v3("vsShown")}</button>
        <button type="button" className="c3-chip" data-on={hidden ? "1" : "0"} aria-pressed={hidden} onClick={() => setHidden(true)}>{v3("vsHidden")}</button>
      </div>
      {copied === "fail" && <p className="c3-muted">{v3("vsNotCopied")}</p>}
      {!shown.length && <p className="c3-empty">{v3("vsEmpty")}</p>}
      <ul className="c3-voice-list">
        {shown.map((item) => (
          <li key={item.id} className="c3-voice-card" data-pinned={item.pinned ? "1" : "0"}>
            <p>{item.text}</p>
            {copied === item.id && <p className="c3-muted">{v3("vsCopied")}</p>}
            <div className="c3-row">
              <button type="button" className="c3-btn" onClick={() => void copyText(item)}>{v3("vsCopy")}</button>
              <button type="button" className="c3-btn" onClick={() => store(toggleSnippetPin(items, item.id))}>{item.pinned ? v3("vsUnpin") : v3("vsPin")}</button>
              <button type="button" className="c3-btn" onClick={() => store(setSnippetHidden(items, item.id, !item.hidden))}>{item.hidden ? v3("vsShow") : v3("vsHide")}</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ReasonGlance({ base }: { base: string }) {
  const v3 = useV3();
  const data = useJson<{ requests?: Withdrawal[] }>(WITHDRAWALS);
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
    <section className="c3-reason-glance" aria-label={v3("wrTitle")} data-reason-glance="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("wrSub")}</p>
          <h2 className="c3-title">{v3("wrTitle")}</h2>
        </div>
        <p className="c3-muted">{chips.length}</p>
      </header>
      <p className="c3-muted">{v3("wrHint")}</p>
      <p className="c3-muted">{v3("wrLocal")}</p>
      <p className="c3-row">
        <Link className="c3-btn" href={crmv3Href(base, "payboard")}>{v3("wrBoard")}</Link>
      </p>
      {data.loading && !rows.length && <p className="c3-muted">{v3("wrLoading")}</p>}
      {data.error && <p className="c3-muted">{v3("wrFailed")}</p>}
      {!data.loading && !data.error && !rows.length && <p className="c3-empty">{v3("wrNone")}</p>}
      {blankCount > 0 && (
        <button type="button" className="c3-reason-blank" data-on={blank ? "1" : "0"} aria-pressed={blank} onClick={() => { setBlank((value) => !value); setSelected(""); }}>
          <span>{v3("wrBlank")}</span>
          <span className="c3-muted">{blankCount}</span>
        </button>
      )}
      <div className="c3-row" role="group" aria-label={v3("wrShown")}>
        <button type="button" className="c3-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v3("wrShown")}</button>
        <button type="button" className="c3-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v3("wrHidden")}</button>
      </div>
      <div className="c3-row" role="group" aria-label={v3("wrTitle")}>
        <button type="button" className="c3-chip" data-on={!reason && !blank ? "1" : "0"} aria-pressed={!reason && !blank} onClick={() => { setSelected(""); setBlank(false); }}>{v3("wrAll")}</button>
        {chips.map((item) => (
          <span key={item} className="c3-reason-pair" data-reason={item}>
            <button type="button" className="c3-chip" data-on={reason === item ? "1" : "0"} aria-pressed={reason === item} onClick={() => { setBlank(false); setSelected(reason === item ? "" : item); }}>{item}</button>
            <button type="button" className="c3-btn" onClick={() => store(toggleReason(hiddenReasons, item, present), showHidden ? "" : item)}>{showHidden ? v3("wrShow") : v3("wrHide")}</button>
          </span>
        ))}
      </div>
      <label className="c3-lab">
        <span>{v3("wrSearch")}</span>
        <input className="c3-field" aria-label={v3("wrSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c3-empty">{v3("wrEmpty")}</p>}
      <ul className="c3-reason-rows">
        {shown.map((row) => {
          const note = reasonText(row.note);
          return (
            <li key={row.id} data-reason={note || "blank"}>
              <p>{row.label || row.id}</p>
              <p className="c3-muted">{note || v3("wrBlank")}</p>
              {row.userId && <Link className="c3-btn" href={crmv3Href(base, `customers/${row.userId}`)}>{v3("wrCustomer")}</Link>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
