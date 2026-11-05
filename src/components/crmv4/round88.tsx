"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import {
  LINK_KEY,
  PRIORITY_KEY,
  activePriority,
  addLink,
  namedPriorities,
  priorityLines,
  priorityText,
  readHiddenPriorities,
  readLinks,
  setLinkHidden,
  toggleLinkPin,
  togglePriority,
  visibleLinks,
  visiblePriorities,
  visibleTickets,
  type Link as DeskLink,
  type PriorityRow,
} from "@/lib/crmv4/round88";
import { crmv4Href } from "@/lib/crmv4/sections";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

type Ticket = {
  id: string;
  priority?: unknown;
  customer?: string | null;
  customerId?: string | null;
};

type GlanceRow = PriorityRow & { id: string; userId: string };

export function QuickLinks({ v4 }: { v4: V4 }) {
  const [links, setLinks] = useState<DeskLink[]>([]);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [query, setQuery] = useState("");
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const next = readLinks(readJson(LINK_KEY, []));
    setLinks(next);
    writeJson(LINK_KEY, next);
  }, []);
  const shown = visibleLinks(links, query, hidden);

  function store(next: DeskLink[]) {
    setLinks(next);
    writeJson(LINK_KEY, next);
  }

  return (
    <section className="c4-quick-links" aria-label={v4("qkTitle")} data-quick-links="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-pay-kicker">{v4("qkSub")}</p>
          <h2 className="c4-title">{v4("qkTitle")}</h2>
        </div>
        <p className="c4-meta">{shown.length}</p>
      </header>
      <p className="c4-meta">{v4("qkHint")}</p>
      <p className="c4-meta">{v4("qkLocal")}</p>
      <form className="c4-row" onSubmit={(event) => {
        event.preventDefault();
        const next = addLink(links, { id: `qk-${Date.now()}`, name, url, at: new Date().toISOString() });
        if (next.length === links.length) return;
        store(next);
        setName("");
        setUrl("");
      }}>
        <label className="c4-lab">
          <span>{v4("qkName")}</span>
          <input className="c4-field" aria-label={v4("qkName")} value={name} maxLength={80} onChange={(event) => setName(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("qkUrl")}</span>
          <input className="c4-field" aria-label={v4("qkUrl")} value={url} inputMode="url" onChange={(event) => setUrl(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn">{v4("qkAdd")}</button>
      </form>
      <p className="c4-meta">{v4("qkBlank")}</p>
      <p className="c4-meta">{v4("qkHttp")}</p>
      <label className="c4-lab">
        <span>{v4("qkSearch")}</span>
        <input className="c4-field" aria-label={v4("qkSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c4-row" role="group" aria-label={v4("qkShown")}>
        <button type="button" className="c4-chip" data-on={hidden ? "0" : "1"} aria-pressed={!hidden} onClick={() => setHidden(false)}>{v4("qkShown")}</button>
        <button type="button" className="c4-chip" data-on={hidden ? "1" : "0"} aria-pressed={hidden} onClick={() => setHidden(true)}>{v4("qkHidden")}</button>
      </div>
      {!shown.length && <p className="c4-pay-empty">{v4("qkEmpty")}</p>}
      <ul className="c4-link-list">
        {shown.map((link) => (
          <li key={link.id} className="c4-link-card" data-pinned={link.pinned ? "1" : "0"}>
            <p>{link.name}</p>
            <p className="c4-meta">{link.url}</p>
            <div className="c4-row">
              <a className="c4-btn" href={link.url} target="_blank" rel="noreferrer">{v4("qkOpen")}</a>
              <button type="button" className="c4-btn" onClick={() => store(toggleLinkPin(links, link.id))}>{link.pinned ? v4("qkUnpin") : v4("qkPin")}</button>
              <button type="button" className="c4-btn" onClick={() => store(setLinkHidden(links, link.id, !link.hidden))}>{link.hidden ? v4("qkShow") : v4("qkHide")}</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function PriorityGlance({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ tickets?: Ticket[] }>("/api/admin/tickets?take=40");
  const [hiddenPriorities, setHiddenPriorities] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [blank, setBlank] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [query, setQuery] = useState("");
  const rows = (data.data?.tickets || []).map((row): GlanceRow | null => {
    const id = String(row.id || "").trim();
    if (!id) return null;
    return {
      id,
      priority: row.priority,
      label: String(row.customer || ""),
      userId: String(row.customerId || "").trim(),
    };
  }).filter((row): row is GlanceRow => Boolean(row));
  const lines = priorityLines(rows);
  const present = namedPriorities(rows);
  const presentKey = present.join("\n");
  const blankCount = lines.find((line) => !line.priority)?.count || 0;
  useEffect(() => {
    if (data.loading || data.error) return;
    const next = readHiddenPriorities(readJson(PRIORITY_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHiddenPriorities(next);
    writeJson(PRIORITY_KEY, next);
  }, [data.loading, data.error, presentKey]);
  const chips = visiblePriorities(present, hiddenPriorities, showHidden);
  const priority = activePriority(selected, chips);
  const shown = visibleTickets(rows, priority, blank, query);

  function store(next: string[], clear: string) {
    setHiddenPriorities(next);
    writeJson(PRIORITY_KEY, next);
    if (clear && activePriority(selected, [clear])) setSelected("");
  }

  return (
    <section className="c4-priority-glance" aria-label={v4("pgTitle")} data-priority-glance="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-pay-kicker">{v4("pgSub")}</p>
          <h2 className="c4-title">{v4("pgTitle")}</h2>
        </div>
        <p className="c4-meta">{chips.length}</p>
      </header>
      <p className="c4-meta">{v4("pgHint")}</p>
      <p className="c4-meta">{v4("pgLocal")}</p>
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "support")}>{v4("pgBoard")}</Link>
      </p>
      {data.loading && !rows.length && <p className="c4-meta">{v4("pgLoading")}</p>}
      {data.error && <p className="c4-meta">{v4("pgFailed")}</p>}
      {!data.loading && !data.error && !rows.length && <p className="c4-pay-empty">{v4("pgNone")}</p>}
      {blankCount > 0 && (
        <button type="button" className="c4-priority-blank" data-on={blank ? "1" : "0"} aria-pressed={blank} onClick={() => { setBlank((value) => !value); setSelected(""); }}>
          <span>{v4("pgBlank")}</span>
          <span className="c4-meta">{blankCount}</span>
        </button>
      )}
      <div className="c4-row" role="group" aria-label={v4("pgShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("pgShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("pgHidden")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("pgTitle")}>
        <button type="button" className="c4-chip" data-on={!priority && !blank ? "1" : "0"} aria-pressed={!priority && !blank} onClick={() => { setSelected(""); setBlank(false); }}>{v4("pgAll")}</button>
        {chips.map((item) => (
          <span key={item} className="c4-priority-pair" data-priority={item}>
            <button type="button" className="c4-chip" data-on={priority === item ? "1" : "0"} aria-pressed={priority === item} onClick={() => { setBlank(false); setSelected(priority === item ? "" : item); }}>{item}</button>
            <button type="button" className="c4-btn" onClick={() => store(togglePriority(hiddenPriorities, item, present), showHidden ? "" : item)}>{showHidden ? v4("pgShow") : v4("pgHide")}</button>
          </span>
        ))}
      </div>
      <label className="c4-lab">
        <span>{v4("pgSearch")}</span>
        <input className="c4-field" aria-label={v4("pgSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c4-pay-empty">{v4("pgEmpty")}</p>}
      <ul className="c4-priority-rows">
        {shown.map((row) => {
          const name = priorityText(row.priority);
          return (
            <li key={row.id} data-priority={name || "blank"}>
              <p>{row.label || row.id}</p>
              <p className="c4-meta">{name || v4("pgBlank")}</p>
              {row.userId && <Link className="c4-btn" href={crmv4Href(base, `customers/${row.userId}`)}>{v4("pgCustomer")}</Link>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
