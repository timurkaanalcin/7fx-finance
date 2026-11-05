"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readJson, writeJson } from "@/lib/crmv3/bridge";
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
} from "@/lib/crmv3/drafts";
import { crmv3Href } from "@/lib/crmv3/sections";
import { useJson } from "../kit";
import { useV3 } from "./store";

const DOCS = "/api/admin/documents?take=40";

type DocumentRow = {
  id: string;
  name?: string | null;
  docType?: string | null;
  trader?: string | null;
  traderId?: string | null;
};

type GlanceRow = MixRow & { id: string; userId: string };

export function DraftStash() {
  const v3 = useV3();
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
    <section className="c3-draft-stash" aria-label={v3("dfTitle")} data-draft-stash="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("dfSub")}</p>
          <h2 className="c3-title">{v3("dfTitle")}</h2>
        </div>
        <p className="c3-muted">{shown.length}</p>
      </header>
      <p className="c3-muted">{v3("dfHint")}</p>
      <p className="c3-muted">{v3("dfLocal")}</p>
      <form className="c3-row" onSubmit={(event) => {
        event.preventDefault();
        const next = addDraft(drafts, { id: `df-${Date.now()}`, text, at: new Date().toISOString() });
        if (next.length === drafts.length) return;
        store(next);
        setText("");
      }}>
        <label className="c3-lab">
          <span>{v3("dfText")}</span>
          <input className="c3-field" aria-label={v3("dfText")} value={text} maxLength={80} onChange={(event) => setText(event.target.value)} />
        </label>
        <button type="submit" className="c3-btn">{v3("dfAdd")}</button>
      </form>
      <p className="c3-muted">{v3("dfBlank")}</p>
      <label className="c3-lab">
        <span>{v3("dfSearch")}</span>
        <input className="c3-field" aria-label={v3("dfSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c3-row" role="group" aria-label={v3("dfShown")}>
        <button type="button" className="c3-chip" data-on={hidden ? "0" : "1"} aria-pressed={!hidden} onClick={() => setHidden(false)}>{v3("dfShown")}</button>
        <button type="button" className="c3-chip" data-on={hidden ? "1" : "0"} aria-pressed={hidden} onClick={() => setHidden(true)}>{v3("dfHidden")}</button>
      </div>
      {!shown.length && <p className="c3-empty">{v3("dfEmpty")}</p>}
      <ul className="c3-draft-list">
        {shown.map((draft) => (
          <li key={draft.id} className="c3-draft-card" data-pinned={draft.pinned ? "1" : "0"}>
            <p>{draft.text}</p>
            <div className="c3-row">
              <button type="button" className="c3-btn" onClick={() => store(toggleDraftPin(drafts, draft.id))}>{draft.pinned ? v3("dfUnpin") : v3("dfPin")}</button>
              <button type="button" className="c3-btn" onClick={() => store(setDraftHidden(drafts, draft.id, !draft.hidden))}>{draft.hidden ? v3("dfShow") : v3("dfHide")}</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function DocTypeMix({ base }: { base: string }) {
  const v3 = useV3();
  const data = useJson<{ documents?: DocumentRow[] }>(DOCS);
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
    <section className="c3-doc-mix" aria-label={v3("kmTitle")} data-doc-mix="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("kmSub")}</p>
          <h2 className="c3-title">{v3("kmTitle")}</h2>
        </div>
        <p className="c3-muted">{chips.length}</p>
      </header>
      <p className="c3-muted">{v3("kmHint")}</p>
      <p className="c3-muted">{v3("kmLocal")}</p>
      <p className="c3-row">
        <Link className="c3-btn" href={crmv3Href(base, "kyc")}>{v3("kmBoard")}</Link>
      </p>
      {data.loading && !rows.length && <p className="c3-muted">{v3("kmLoading")}</p>}
      {data.error && <p className="c3-muted">{v3("kmFailed")}</p>}
      {!data.loading && !data.error && !rows.length && <p className="c3-empty">{v3("kmNone")}</p>}
      {blankCount > 0 && (
        <button type="button" className="c3-mix-blank" data-on={blank ? "1" : "0"} aria-pressed={blank} onClick={() => { setBlank((value) => !value); setSelected(""); }}>
          <span>{v3("kmBlank")}</span>
          <span className="c3-muted">{blankCount}</span>
        </button>
      )}
      <div className="c3-row" role="group" aria-label={v3("kmShown")}>
        <button type="button" className="c3-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v3("kmShown")}</button>
        <button type="button" className="c3-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v3("kmHidden")}</button>
      </div>
      <div className="c3-row" role="group" aria-label={v3("kmTitle")}>
        <button type="button" className="c3-chip" data-on={!type && !blank ? "1" : "0"} aria-pressed={!type && !blank} onClick={() => { setSelected(""); setBlank(false); }}>{v3("kmAll")}</button>
        {chips.map((item) => {
          const count = lines.find((line) => line.type === item)?.count || 0;
          return (
            <span key={item} className="c3-mix-pair" data-type={item}>
              <button type="button" className="c3-chip" data-on={type === item ? "1" : "0"} aria-pressed={type === item} onClick={() => { setBlank(false); setSelected(type === item ? "" : item); }}>{item} {count}</button>
              <button type="button" className="c3-btn" onClick={() => store(toggleMix(hiddenTypes, item, present), showHidden ? "" : item)}>{showHidden ? v3("kmShow") : v3("kmHide")}</button>
            </span>
          );
        })}
      </div>
      <label className="c3-lab">
        <span>{v3("kmSearch")}</span>
        <input className="c3-field" aria-label={v3("kmSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c3-empty">{v3("kmEmpty")}</p>}
      <ul className="c3-mix-rows">
        {shown.map((row) => {
          const name = mixType(row.docType);
          return (
            <li key={row.id} data-type={name || "blank"}>
              <p>{row.label || row.id}</p>
              <p className="c3-muted">{name || v3("kmBlank")}</p>
              {row.userId && <Link className="c3-btn" href={crmv3Href(base, `customers/${row.userId}`)}>{v3("kmCustomer")}</Link>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
