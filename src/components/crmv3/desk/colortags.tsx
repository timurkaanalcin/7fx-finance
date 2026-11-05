"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readJson, writeJson } from "@/lib/crmv3/bridge";
import { SWATCH } from "@/lib/crmv3/palette";
import {
  ASSIGN_KEY,
  PALETTE,
  SIDE_KEY,
  TAG_KEY,
  activeSide,
  addTag,
  assignTag,
  clearAssignment,
  namedSides,
  readAssignments,
  readHiddenSides,
  readTags,
  setTagHidden,
  sideLines,
  sideText,
  toggleSide,
  toggleTagPin,
  visibleOrders,
  visibleSides,
  visibleTags,
  type Assignment,
  type ColorTag,
  type SideRow,
} from "@/lib/crmv3/colortags";
import { crmv3Href } from "@/lib/crmv3/sections";
import { useJson } from "../kit";
import { useV3 } from "./store";

type Person = { id: string; name?: string | null; email?: string | null };

type Order = {
  id: string;
  side?: string | null;
  symbol?: string | null;
};

type GlanceRow = SideRow & { id: string };

export function ColorTags({ base }: { base: string }) {
  const v3 = useV3();
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [tags, setTags] = useState<ColorTag[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [text, setText] = useState("");
  const [color, setColor] = useState<string>(PALETTE[0]);
  const [customer, setCustomer] = useState("");
  const [query, setQuery] = useState("");
  const [hidden, setHidden] = useState(false);
  const people = (data.data?.users || []).map((row) => ({
    id: String(row.id || "").trim(),
    name: String(row.name || row.email || "").trim(),
  })).filter((row) => row.id);
  const present = people.map((row) => row.id);
  const presentKey = present.join("\n");
  const tagKey = tags.map((tag) => tag.id).join("\n");
  useEffect(() => {
    const next = readTags(readJson(TAG_KEY, []));
    setTags(next);
    writeJson(TAG_KEY, next);
  }, []);
  useEffect(() => {
    if (data.loading || data.error) return;
    const next = readAssignments(readJson(ASSIGN_KEY, []), presentKey ? presentKey.split("\n") : [], tagKey ? tagKey.split("\n") : []);
    setAssignments(next);
    writeJson(ASSIGN_KEY, next);
  }, [data.loading, data.error, presentKey, tagKey]);
  const shown = visibleTags(tags, query, hidden);
  const names = new Map(people.map((row) => [row.id, row.name || row.id]));

  function storeTags(next: ColorTag[]) {
    setTags(next);
    writeJson(TAG_KEY, next);
    const kept = readAssignments(assignments, present, next.map((tag) => tag.id));
    setAssignments(kept);
    writeJson(ASSIGN_KEY, kept);
  }

  function storeAssignments(next: Assignment[]) {
    setAssignments(next);
    writeJson(ASSIGN_KEY, next);
  }

  return (
    <section className="c3-color-tags" aria-label={v3("qaTitle")} data-color-tags="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-pay-kicker">{v3("qaSub")}</p>
          <h2 className="c3-title">{v3("qaTitle")}</h2>
        </div>
        <p className="c3-meta">{shown.length}</p>
      </header>
      <p className="c3-meta">{v3("qaHint")}</p>
      <p className="c3-meta">{v3("qaLocal")}</p>
      <form className="c3-row" onSubmit={(event) => {
        event.preventDefault();
        const next = addTag(tags, { id: `qa-${Date.now()}`, text, color, at: new Date().toISOString() });
        if (next.length === tags.length) return;
        storeTags(next);
        setText("");
      }}>
        <label className="c3-lab">
          <span>{v3("qaText")}</span>
          <input className="c3-field" aria-label={v3("qaText")} value={text} maxLength={40} onChange={(event) => setText(event.target.value)} />
        </label>
        <label className="c3-lab">
          <span>{v3("qaColor")}</span>
          <select className="c3-field" aria-label={v3("qaColor")} value={color} onChange={(event) => setColor(event.target.value)}>
            {PALETTE.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <button type="submit" className="c3-btn">{v3("qaAdd")}</button>
      </form>
      <p className="c3-meta">{v3("qaBlank")}</p>
      <label className="c3-lab">
        <span>{v3("qaCustomer")}</span>
        <select className="c3-field" aria-label={v3("qaCustomer")} value={customer} onChange={(event) => setCustomer(event.target.value)}>
          <option value="">{v3("qaCustomer")}</option>
          {people.map((row) => <option key={row.id} value={row.id}>{row.name || row.id}</option>)}
        </select>
      </label>
      <label className="c3-lab">
        <span>{v3("qaSearch")}</span>
        <input className="c3-field" aria-label={v3("qaSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c3-row" role="group" aria-label={v3("qaShown")}>
        <button type="button" className="c3-chip" data-on={hidden ? "0" : "1"} aria-pressed={!hidden} onClick={() => setHidden(false)}>{v3("qaShown")}</button>
        <button type="button" className="c3-chip" data-on={hidden ? "1" : "0"} aria-pressed={hidden} onClick={() => setHidden(true)}>{v3("qaHidden")}</button>
      </div>
      {data.loading && !people.length && <p className="c3-meta">{v3("qaLoading")}</p>}
      {data.error && <p className="c3-meta">{v3("qaFailed")}</p>}
      {!data.loading && !data.error && !people.length && <p className="c3-pay-empty">{v3("qaNone")}</p>}
      {!shown.length && <p className="c3-pay-empty">{v3("qaEmpty")}</p>}
      <ul className="c3-tag-list">
        {shown.map((tag) => (
          <li key={tag.id} className="c3-tag-card" data-pinned={tag.pinned ? "1" : "0"} data-color={tag.color}>
            <p><span className="c3-tag-swatch" style={{ background: SWATCH[tag.color] }} />{tag.text}</p>
            <p className="c3-meta">{tag.color}</p>
            <div className="c3-row">
              <button type="button" className="c3-btn" onClick={() => storeAssignments(assignTag(assignments, customer, tag.id, present, tags.map((item) => item.id)))}>{v3("qaAssign")}</button>
              <button type="button" className="c3-btn" onClick={() => storeTags(toggleTagPin(tags, tag.id))}>{tag.pinned ? v3("qaUnpin") : v3("qaPin")}</button>
              <button type="button" className="c3-btn" onClick={() => storeTags(setTagHidden(tags, tag.id, !tag.hidden))}>{tag.hidden ? v3("qaShow") : v3("qaHide")}</button>
            </div>
          </li>
        ))}
      </ul>
      <ul className="c3-tag-people">
        {assignments.map((item) => {
          const tag = tags.find((entry) => entry.id === item.tagId);
          return (
            <li key={item.id} data-customer={item.id}>
              <p>{names.get(item.id) || item.id}</p>
              <p className="c3-meta">{tag?.text || ""}</p>
              <div className="c3-row">
                <Link className="c3-btn" href={crmv3Href(base, `customers/${item.id}`)}>{v3("qaOpen")}</Link>
                <button type="button" className="c3-btn" onClick={() => storeAssignments(clearAssignment(assignments, item.id, present, tags.map((entry) => entry.id)))}>{v3("qaClear")}</button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function TradeSide({ base }: { base: string }) {
  const v3 = useV3();
  const data = useJson<{ orders?: Order[] }>("/api/admin/positions?tab=orders&take=40");
  const [hiddenSides, setHiddenSides] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [blank, setBlank] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [query, setQuery] = useState("");
  const rows = (data.data?.orders || []).map((row): GlanceRow | null => {
    const id = String(row.id || "").trim();
    if (!id) return null;
    return { id, side: row.side, label: String(row.symbol || "").trim() };
  }).filter((row): row is GlanceRow => Boolean(row));
  const lines = sideLines(rows);
  const present = namedSides(rows);
  const presentKey = present.join("\n");
  const blankCount = lines.find((line) => !line.side)?.count || 0;
  useEffect(() => {
    if (data.loading || data.error) return;
    const next = readHiddenSides(readJson(SIDE_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHiddenSides(next);
    writeJson(SIDE_KEY, next);
  }, [data.loading, data.error, presentKey]);
  const chips = visibleSides(present, hiddenSides, showHidden);
  const side = activeSide(selected, chips);
  const shown = visibleOrders(rows, side, blank, query);

  function store(next: string[], clear: string) {
    setHiddenSides(next);
    writeJson(SIDE_KEY, next);
    if (clear && activeSide(selected, [clear])) setSelected("");
  }

  return (
    <section className="c3-trade-side" aria-label={v3("ysTitle")} data-trade-side="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-pay-kicker">{v3("ysSub")}</p>
          <h2 className="c3-title">{v3("ysTitle")}</h2>
        </div>
        <p className="c3-meta">{chips.length}</p>
      </header>
      <p className="c3-meta">{v3("ysHint")}</p>
      <p className="c3-meta">{v3("ysLocal")}</p>
      <p className="c3-row">
        <Link className="c3-btn" href={crmv3Href(base, "blotter")}>{v3("ysBoard")}</Link>
      </p>
      {data.loading && !rows.length && <p className="c3-meta">{v3("ysLoading")}</p>}
      {data.error && <p className="c3-meta">{v3("ysFailed")}</p>}
      {!data.loading && !data.error && !rows.length && <p className="c3-pay-empty">{v3("ysNone")}</p>}
      {blankCount > 0 && (
        <button type="button" className="c3-ys-blank" data-on={blank ? "1" : "0"} aria-pressed={blank} onClick={() => { setBlank((value) => !value); setSelected(""); }}>
          <span>{v3("ysBlank")}</span>
          <span className="c3-meta">{blankCount}</span>
        </button>
      )}
      <div className="c3-row" role="group" aria-label={v3("ysShown")}>
        <button type="button" className="c3-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v3("ysShown")}</button>
        <button type="button" className="c3-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v3("ysHidden")}</button>
      </div>
      <div className="c3-row" role="group" aria-label={v3("ysTitle")}>
        <button type="button" className="c3-chip" data-on={!side && !blank ? "1" : "0"} aria-pressed={!side && !blank} onClick={() => { setSelected(""); setBlank(false); }}>{v3("ysAll")}</button>
        {chips.map((item) => {
          const count = lines.find((line) => line.side === item)?.count || 0;
          return (
            <span key={item} className="c3-ys-pair" data-side={item}>
              <button type="button" className="c3-chip" data-on={side === item ? "1" : "0"} aria-pressed={side === item} onClick={() => { setBlank(false); setSelected(side === item ? "" : item); }}>{item} {count}</button>
              <button type="button" className="c3-btn" onClick={() => store(toggleSide(hiddenSides, item, present), showHidden ? "" : item)}>{showHidden ? v3("ysShow") : v3("ysHide")}</button>
            </span>
          );
        })}
      </div>
      <label className="c3-lab">
        <span>{v3("ysSearch")}</span>
        <input className="c3-field" aria-label={v3("ysSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c3-pay-empty">{v3("ysEmpty")}</p>}
      <ul className="c3-ys-rows">
        {shown.map((row) => {
          const name = sideText(row.side);
          return (
            <li key={row.id} data-side={name || "blank"}>
              <p>{row.label || row.id}</p>
              <p className="c3-meta">{name || v3("ysBlank")}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
