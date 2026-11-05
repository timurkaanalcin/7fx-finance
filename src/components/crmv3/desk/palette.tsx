"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readJson, writeJson } from "@/lib/crmv3/bridge";
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
} from "@/lib/crmv3/palette";
import { crmv3Href } from "@/lib/crmv3/sections";
import { useJson } from "../kit";
import { useV3 } from "./store";

const TICKETS = "/api/admin/tickets?take=40";

const COLOR_LABEL: Record<PaletteColor, "plIvory" | "plGraphite" | "plChampagne" | "plInk" | "plPaper" | "plMoss" | "plClay" | "plSlate"> = {
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

export function TagPalette() {
  const v3 = useV3();
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
    <section className="c3-tag-palette" aria-label={v3("plTitle")} data-tag-palette="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("plSub")}</p>
          <h2 className="c3-title">{v3("plTitle")}</h2>
        </div>
        <p className="c3-muted">{shown.length}</p>
      </header>
      <p className="c3-muted">{v3("plHint")}</p>
      <p className="c3-muted">{v3("plLocal")}</p>
      <form className="c3-row" onSubmit={(event) => {
        event.preventDefault();
        const next = addTag(tags, { id: `pl-${Date.now()}`, name, color, at: new Date().toISOString() });
        if (next.length === tags.length) return;
        store(next);
        setName("");
      }}>
        <label className="c3-lab">
          <span>{v3("plName")}</span>
          <input className="c3-field" aria-label={v3("plName")} value={name} maxLength={40} onChange={(event) => setName(event.target.value)} />
        </label>
        <label className="c3-lab">
          <span>{v3("plColor")}</span>
          <select className="c3-field" aria-label={v3("plColor")} value={color} onChange={(event) => {
            const next = paletteColor(event.target.value);
            if (next) setColor(next);
          }}>
            {PALETTE.map((item) => <option key={item} value={item}>{v3(COLOR_LABEL[item])}</option>)}
          </select>
        </label>
        <button type="submit" className="c3-btn">{v3("plAdd")}</button>
      </form>
      <p className="c3-muted">{v3("plBlank")}</p>
      <p className="c3-muted">{v3("plUnknown")}</p>
      <label className="c3-lab">
        <span>{v3("plSearch")}</span>
        <input className="c3-field" aria-label={v3("plSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c3-row" role="group" aria-label={v3("plShown")}>
        <button type="button" className="c3-chip" data-on={hidden ? "0" : "1"} aria-pressed={!hidden} onClick={() => setHidden(false)}>{v3("plShown")}</button>
        <button type="button" className="c3-chip" data-on={hidden ? "1" : "0"} aria-pressed={hidden} onClick={() => setHidden(true)}>{v3("plHidden")}</button>
      </div>
      {!shown.length && <p className="c3-empty">{v3("plEmpty")}</p>}
      <ul className="c3-palette-list">
        {shown.map((tag) => (
          <li key={tag.id} className="c3-palette-card" data-pinned={tag.pinned ? "1" : "0"} data-color={tag.color}>
            <p><span className="c3-swatch" style={{ background: SWATCH[tag.color] }} aria-hidden /> {tag.name}</p>
            <p className="c3-muted">{v3(COLOR_LABEL[tag.color])}</p>
            <div className="c3-row">
              <button type="button" className="c3-btn" onClick={() => store(toggleTagPin(tags, tag.id))}>{tag.pinned ? v3("plUnpin") : v3("plPin")}</button>
              <button type="button" className="c3-btn" onClick={() => store(setTagHidden(tags, tag.id, !tag.hidden))}>{tag.hidden ? v3("plShow") : v3("plHide")}</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function AssigneeGlance({ base }: { base: string }) {
  const v3 = useV3();
  const data = useJson<{ tickets?: Ticket[] }>(TICKETS);
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
    <section className="c3-assignee-glance" aria-label={v3("gnTitle")} data-assignee-glance="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("gnSub")}</p>
          <h2 className="c3-title">{v3("gnTitle")}</h2>
        </div>
        <p className="c3-muted">{chips.length}</p>
      </header>
      <p className="c3-muted">{v3("gnHint")}</p>
      <p className="c3-muted">{v3("gnLocal")}</p>
      <p className="c3-row">
        <Link className="c3-btn" href={crmv3Href(base, "support")}>{v3("gnBoard")}</Link>
      </p>
      {data.loading && !rows.length && <p className="c3-muted">{v3("gnLoading")}</p>}
      {data.error && <p className="c3-muted">{v3("gnFailed")}</p>}
      {!data.loading && !data.error && !rows.length && <p className="c3-empty">{v3("gnNone")}</p>}
      {blankCount > 0 && (
        <button type="button" className="c3-assignee-blank" data-on={blank ? "1" : "0"} aria-pressed={blank} onClick={() => { setBlank((value) => !value); setSelected(""); }}>
          <span>{v3("gnBlank")}</span>
          <span className="c3-muted">{blankCount}</span>
        </button>
      )}
      <div className="c3-row" role="group" aria-label={v3("gnShown")}>
        <button type="button" className="c3-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v3("gnShown")}</button>
        <button type="button" className="c3-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v3("gnHidden")}</button>
      </div>
      <div className="c3-row" role="group" aria-label={v3("gnTitle")}>
        <button type="button" className="c3-chip" data-on={!assignee && !blank ? "1" : "0"} aria-pressed={!assignee && !blank} onClick={() => { setSelected(""); setBlank(false); }}>{v3("gnAll")}</button>
        {chips.map((item) => (
          <span key={item} className="c3-assignee-pair" data-assignee={item}>
            <button type="button" className="c3-chip" data-on={assignee === item ? "1" : "0"} aria-pressed={assignee === item} onClick={() => { setBlank(false); setSelected(assignee === item ? "" : item); }}>{item}</button>
            <button type="button" className="c3-btn" onClick={() => store(toggleAssignee(hiddenAssignees, item, present), showHidden ? "" : item)}>{showHidden ? v3("gnShow") : v3("gnHide")}</button>
          </span>
        ))}
      </div>
      <label className="c3-lab">
        <span>{v3("gnSearch")}</span>
        <input className="c3-field" aria-label={v3("gnSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c3-empty">{v3("gnEmpty")}</p>}
      <ul className="c3-assignee-rows">
        {shown.map((row) => {
          const name = assigneeText(row.assignee);
          return (
            <li key={row.id} data-assignee={name || "blank"}>
              <p>{row.label || row.id}</p>
              <p className="c3-muted">{name || v3("gnBlank")}</p>
              {row.userId && <Link className="c3-btn" href={crmv3Href(base, `customers/${row.userId}`)}>{v3("gnCustomer")}</Link>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
