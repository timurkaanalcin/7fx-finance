"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import {
  DRAFT_KEY,
  MIX_KEY,
  activeMix,
  addDraft,
  mixLines,
  mixType,
  namedMix,
  readDrafts,
  readHiddenMix,
  setDraftHidden,
  toggleDraftPin,
  toggleMix,
  visibleDocs,
  visibleDrafts,
  visibleMix,
  type Draft,
  type MixRow,
} from "@/lib/crmv4/round101";
import { crmv4Href } from "@/lib/crmv4/sections";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

type DocumentRow = {
  id: string;
  name?: string | null;
  docType?: string | null;
  trader?: string | null;
  traderId?: string | null;
};

type GlanceRow = MixRow & { id: string; userId: string };

export function DraftStash({ v4 }: { v4: V4 }) {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const next = readDrafts(readJson(DRAFT_KEY, []));
    setDrafts(next);
    writeJson(DRAFT_KEY, next);
  }, []);
  const shown = visibleDrafts(drafts, query, hidden);

  function store(next: Draft[]) {
    setDrafts(next);
    writeJson(DRAFT_KEY, next);
  }

  return (
    <section className="c4-draft-stash" aria-label={v4("dfTitle")} data-draft-stash="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-pay-kicker">{v4("dfSub")}</p>
          <h2 className="c4-title">{v4("dfTitle")}</h2>
        </div>
        <p className="c4-meta">{shown.length}</p>
      </header>
      <p className="c4-meta">{v4("dfHint")}</p>
      <p className="c4-meta">{v4("dfLocal")}</p>
      <form className="c4-row" onSubmit={(event) => {
        event.preventDefault();
        const next = addDraft(drafts, { id: `df-${Date.now()}`, text, at: new Date().toISOString() });
        if (next.length === drafts.length) return;
        store(next);
        setText("");
      }}>
        <label className="c4-lab">
          <span>{v4("dfText")}</span>
          <input className="c4-field" aria-label={v4("dfText")} value={text} maxLength={80} onChange={(event) => setText(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn">{v4("dfAdd")}</button>
      </form>
      <p className="c4-meta">{v4("dfBlank")}</p>
      <label className="c4-lab">
        <span>{v4("dfSearch")}</span>
        <input className="c4-field" aria-label={v4("dfSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c4-row" role="group" aria-label={v4("dfShown")}>
        <button type="button" className="c4-chip" data-on={hidden ? "0" : "1"} aria-pressed={!hidden} onClick={() => setHidden(false)}>{v4("dfShown")}</button>
        <button type="button" className="c4-chip" data-on={hidden ? "1" : "0"} aria-pressed={hidden} onClick={() => setHidden(true)}>{v4("dfHidden")}</button>
      </div>
      {!shown.length && <p className="c4-pay-empty">{v4("dfEmpty")}</p>}
      <ul className="c4-draft-list">
        {shown.map((draft) => (
          <li key={draft.id} className="c4-draft-card" data-pinned={draft.pinned ? "1" : "0"}>
            <p>{draft.text}</p>
            <div className="c4-row">
              <button type="button" className="c4-btn" onClick={() => store(toggleDraftPin(drafts, draft.id))}>{draft.pinned ? v4("dfUnpin") : v4("dfPin")}</button>
              <button type="button" className="c4-btn" onClick={() => store(setDraftHidden(drafts, draft.id, !draft.hidden))}>{draft.hidden ? v4("dfShow") : v4("dfHide")}</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function DocTypeMix({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ documents?: DocumentRow[] }>("/api/admin/documents?take=40");
  const [hiddenTypes, setHiddenTypes] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [blank, setBlank] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [query, setQuery] = useState("");
  const rows = (data.data?.documents || []).map((row): GlanceRow | null => {
    const id = String(row.id || "").trim();
    if (!id) return null;
    return {
      id,
      docType: row.docType,
      label: String(row.name || row.trader || "").trim(),
      userId: String(row.traderId || "").trim(),
    };
  }).filter((row): row is GlanceRow => Boolean(row));
  const lines = mixLines(rows);
  const present = namedMix(rows);
  const presentKey = present.join("\n");
  const blankCount = lines.find((line) => !line.type)?.count || 0;
  useEffect(() => {
    if (data.loading || data.error) return;
    const next = readHiddenMix(readJson(MIX_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHiddenTypes(next);
    writeJson(MIX_KEY, next);
  }, [data.loading, data.error, presentKey]);
  const chips = visibleMix(present, hiddenTypes, showHidden);
  const type = activeMix(selected, chips);
  const shown = visibleDocs(rows, type, blank, query);

  function store(next: string[], clear: string) {
    setHiddenTypes(next);
    writeJson(MIX_KEY, next);
    if (clear && activeMix(selected, [clear])) setSelected("");
  }

  return (
    <section className="c4-doc-mix" aria-label={v4("kmTitle")} data-doc-mix="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-pay-kicker">{v4("kmSub")}</p>
          <h2 className="c4-title">{v4("kmTitle")}</h2>
        </div>
        <p className="c4-meta">{chips.length}</p>
      </header>
      <p className="c4-meta">{v4("kmHint")}</p>
      <p className="c4-meta">{v4("kmLocal")}</p>
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "kyc")}>{v4("kmBoard")}</Link>
      </p>
      {data.loading && !rows.length && <p className="c4-meta">{v4("kmLoading")}</p>}
      {data.error && <p className="c4-meta">{v4("kmFailed")}</p>}
      {!data.loading && !data.error && !rows.length && <p className="c4-pay-empty">{v4("kmNone")}</p>}
      {blankCount > 0 && (
        <button type="button" className="c4-mix-blank" data-on={blank ? "1" : "0"} aria-pressed={blank} onClick={() => { setBlank((value) => !value); setSelected(""); }}>
          <span>{v4("kmBlank")}</span>
          <span className="c4-meta">{blankCount}</span>
        </button>
      )}
      <div className="c4-row" role="group" aria-label={v4("kmShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("kmShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("kmHidden")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("kmTitle")}>
        <button type="button" className="c4-chip" data-on={!type && !blank ? "1" : "0"} aria-pressed={!type && !blank} onClick={() => { setSelected(""); setBlank(false); }}>{v4("kmAll")}</button>
        {chips.map((item) => {
          const count = lines.find((line) => line.type === item)?.count || 0;
          return (
            <span key={item} className="c4-mix-pair" data-type={item}>
              <button type="button" className="c4-chip" data-on={type === item ? "1" : "0"} aria-pressed={type === item} onClick={() => { setBlank(false); setSelected(type === item ? "" : item); }}>{item} {count}</button>
              <button type="button" className="c4-btn" onClick={() => store(toggleMix(hiddenTypes, item, present), showHidden ? "" : item)}>{showHidden ? v4("kmShow") : v4("kmHide")}</button>
            </span>
          );
        })}
      </div>
      <label className="c4-lab">
        <span>{v4("kmSearch")}</span>
        <input className="c4-field" aria-label={v4("kmSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c4-pay-empty">{v4("kmEmpty")}</p>}
      <ul className="c4-mix-rows">
        {shown.map((row) => {
          const name = mixType(row.docType);
          return (
            <li key={row.id} data-type={name || "blank"}>
              <p>{row.label || row.id}</p>
              <p className="c4-meta">{name || v4("kmBlank")}</p>
              {row.userId && <Link className="c4-btn" href={crmv4Href(base, `customers/${row.userId}`)}>{v4("kmCustomer")}</Link>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
