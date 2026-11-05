"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import {
  ASSIGN_KEY,
  PALETTE,
  PALETTE_KEY,
  SWATCH,
  activeAssignee,
  addTag,
  assignLines,
  assigneeText,
  namedAssignees,
  paletteColor,
  readHiddenAssignees,
  readTags,
  setTagHidden,
  toggleAssignee,
  toggleTagPin,
  visibleAssignees,
  visibleTags,
  visibleTickets,
  type AssignRow,
  type DeskTag,
  type PaletteColor,
} from "@/lib/crmv4/round93";
import { crmv4Href } from "@/lib/crmv4/sections";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const COLOR_LABEL: Record<PaletteColor, CrmV4CopyKey> = {
  ivory: "plIvory",
  graphite: "plGraphite",
  champagne: "plChampagne",
  ink: "plInk",
  paper: "plPaper",
  moss: "plMoss",
  clay: "plClay",
  slate: "plSlate",
};

type Ticket = {
  id: string;
  customer?: string | null;
  customerId?: string | null;
  assignee?: unknown;
  assigneeName?: string | null;
  owner?: unknown;
};

type GlanceRow = AssignRow & { id: string; userId: string };

export function TagPalette({ v4 }: { v4: V4 }) {
  const [tags, setTags] = useState<DeskTag[]>([]);
  const [name, setName] = useState("");
  const [color, setColor] = useState<PaletteColor>("champagne");
  const [query, setQuery] = useState("");
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const next = readTags(readJson(PALETTE_KEY, []));
    setTags(next);
    writeJson(PALETTE_KEY, next);
  }, []);
  const shown = visibleTags(tags, query, hidden);

  function store(next: DeskTag[]) {
    setTags(next);
    writeJson(PALETTE_KEY, next);
  }

  return (
    <section className="c4-tag-palette" aria-label={v4("plTitle")} data-tag-palette="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-pay-kicker">{v4("plSub")}</p>
          <h2 className="c4-title">{v4("plTitle")}</h2>
        </div>
        <p className="c4-meta">{shown.length}</p>
      </header>
      <p className="c4-meta">{v4("plHint")}</p>
      <p className="c4-meta">{v4("plLocal")}</p>
      <form className="c4-row" onSubmit={(event) => {
        event.preventDefault();
        const next = addTag(tags, { id: `pl-${Date.now()}`, name, color, at: new Date().toISOString() });
        if (next.length === tags.length) return;
        store(next);
        setName("");
      }}>
        <label className="c4-lab">
          <span>{v4("plName")}</span>
          <input className="c4-field" aria-label={v4("plName")} value={name} maxLength={40} onChange={(event) => setName(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("plColor")}</span>
          <select className="c4-field" aria-label={v4("plColor")} value={color} onChange={(event) => {
            const next = paletteColor(event.target.value);
            if (next) setColor(next);
          }}>
            {PALETTE.map((item) => <option key={item} value={item}>{v4(COLOR_LABEL[item])}</option>)}
          </select>
        </label>
        <button type="submit" className="c4-btn">{v4("plAdd")}</button>
      </form>
      <p className="c4-meta">{v4("plBlank")}</p>
      <p className="c4-meta">{v4("plUnknown")}</p>
      <label className="c4-lab">
        <span>{v4("plSearch")}</span>
        <input className="c4-field" aria-label={v4("plSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c4-row" role="group" aria-label={v4("plShown")}>
        <button type="button" className="c4-chip" data-on={hidden ? "0" : "1"} aria-pressed={!hidden} onClick={() => setHidden(false)}>{v4("plShown")}</button>
        <button type="button" className="c4-chip" data-on={hidden ? "1" : "0"} aria-pressed={hidden} onClick={() => setHidden(true)}>{v4("plHidden")}</button>
      </div>
      {!shown.length && <p className="c4-pay-empty">{v4("plEmpty")}</p>}
      <ul className="c4-palette-list">
        {shown.map((tag) => (
          <li key={tag.id} className="c4-palette-card" data-pinned={tag.pinned ? "1" : "0"} data-color={tag.color}>
            <p><span className="c4-swatch" style={{ background: SWATCH[tag.color] }} aria-hidden /> {tag.name}</p>
            <p className="c4-meta">{v4(COLOR_LABEL[tag.color])}</p>
            <div className="c4-row">
              <button type="button" className="c4-btn" onClick={() => store(toggleTagPin(tags, tag.id))}>{tag.pinned ? v4("plUnpin") : v4("plPin")}</button>
              <button type="button" className="c4-btn" onClick={() => store(setTagHidden(tags, tag.id, !tag.hidden))}>{tag.hidden ? v4("plShow") : v4("plHide")}</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function AssigneeGlance({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ tickets?: Ticket[] }>("/api/admin/tickets?take=40");
  const [hiddenAssignees, setHiddenAssignees] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [blank, setBlank] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [query, setQuery] = useState("");
  const rows = (data.data?.tickets || []).map((row): GlanceRow | null => {
    const id = String(row.id || "").trim();
    if (!id) return null;
    return {
      id,
      assignee: { assigneeName: row.assigneeName, assignee: row.assignee, owner: row.owner },
      label: String(row.customer || ""),
      userId: String(row.customerId || "").trim(),
    };
  }).filter((row): row is GlanceRow => Boolean(row));
  const lines = assignLines(rows);
  const present = namedAssignees(rows);
  const presentKey = present.join("\n");
  const blankCount = lines.find((line) => !line.assignee)?.count || 0;
  useEffect(() => {
    if (data.loading || data.error) return;
    const next = readHiddenAssignees(readJson(ASSIGN_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHiddenAssignees(next);
    writeJson(ASSIGN_KEY, next);
  }, [data.loading, data.error, presentKey]);
  const chips = visibleAssignees(present, hiddenAssignees, showHidden);
  const assignee = activeAssignee(selected, chips);
  const shown = visibleTickets(rows, assignee, blank, query);

  function store(next: string[], clear: string) {
    setHiddenAssignees(next);
    writeJson(ASSIGN_KEY, next);
    if (clear && activeAssignee(selected, [clear])) setSelected("");
  }

  return (
    <section className="c4-assignee-glance" aria-label={v4("gnTitle")} data-assignee-glance="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-pay-kicker">{v4("gnSub")}</p>
          <h2 className="c4-title">{v4("gnTitle")}</h2>
        </div>
        <p className="c4-meta">{chips.length}</p>
      </header>
      <p className="c4-meta">{v4("gnHint")}</p>
      <p className="c4-meta">{v4("gnLocal")}</p>
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "support")}>{v4("gnBoard")}</Link>
      </p>
      {data.loading && !rows.length && <p className="c4-meta">{v4("gnLoading")}</p>}
      {data.error && <p className="c4-meta">{v4("gnFailed")}</p>}
      {!data.loading && !data.error && !rows.length && <p className="c4-pay-empty">{v4("gnNone")}</p>}
      {blankCount > 0 && (
        <button type="button" className="c4-assignee-blank" data-on={blank ? "1" : "0"} aria-pressed={blank} onClick={() => { setBlank((value) => !value); setSelected(""); }}>
          <span>{v4("gnBlank")}</span>
          <span className="c4-meta">{blankCount}</span>
        </button>
      )}
      <div className="c4-row" role="group" aria-label={v4("gnShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("gnShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("gnHidden")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("gnTitle")}>
        <button type="button" className="c4-chip" data-on={!assignee && !blank ? "1" : "0"} aria-pressed={!assignee && !blank} onClick={() => { setSelected(""); setBlank(false); }}>{v4("gnAll")}</button>
        {chips.map((item) => (
          <span key={item} className="c4-assignee-pair" data-assignee={item}>
            <button type="button" className="c4-chip" data-on={assignee === item ? "1" : "0"} aria-pressed={assignee === item} onClick={() => { setBlank(false); setSelected(assignee === item ? "" : item); }}>{item}</button>
            <button type="button" className="c4-btn" onClick={() => store(toggleAssignee(hiddenAssignees, item, present), showHidden ? "" : item)}>{showHidden ? v4("gnShow") : v4("gnHide")}</button>
          </span>
        ))}
      </div>
      <label className="c4-lab">
        <span>{v4("gnSearch")}</span>
        <input className="c4-field" aria-label={v4("gnSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c4-pay-empty">{v4("gnEmpty")}</p>}
      <ul className="c4-assignee-rows">
        {shown.map((row) => {
          const name = assigneeText(row.assignee);
          return (
            <li key={row.id} data-assignee={name || "blank"}>
              <p>{row.label || row.id}</p>
              <p className="c4-meta">{name || v4("gnBlank")}</p>
              {row.userId && <Link className="c4-btn" href={crmv4Href(base, `customers/${row.userId}`)}>{v4("gnCustomer")}</Link>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
