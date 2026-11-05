"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readJson, writeJson } from "@/lib/crmv3/bridge";
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
} from "@/lib/crmv3/links";
import { crmv3Href } from "@/lib/crmv3/sections";
import { useJson } from "../kit";
import { useV3 } from "./store";

const TICKETS = "/api/admin/tickets?take=40";

type Ticket = {
  id: string;
  priority?: unknown;
  customer?: string | null;
  customerId?: string | null;
};

type GlanceRow = PriorityRow & { id: string; userId: string };

export function QuickLinks() {
  const v3 = useV3();
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
    <section className="c3-quick-links" aria-label={v3("qkTitle")} data-quick-links="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("qkSub")}</p>
          <h2 className="c3-title">{v3("qkTitle")}</h2>
        </div>
        <p className="c3-muted">{shown.length}</p>
      </header>
      <p className="c3-muted">{v3("qkHint")}</p>
      <p className="c3-muted">{v3("qkLocal")}</p>
      <form className="c3-row" onSubmit={(event) => {
        event.preventDefault();
        const next = addLink(links, { id: `qk-${Date.now()}`, name, url, at: new Date().toISOString() });
        if (next.length === links.length) return;
        store(next);
        setName("");
        setUrl("");
      }}>
        <label className="c3-lab">
          <span>{v3("qkName")}</span>
          <input className="c3-field" aria-label={v3("qkName")} value={name} maxLength={80} onChange={(event) => setName(event.target.value)} />
        </label>
        <label className="c3-lab">
          <span>{v3("qkUrl")}</span>
          <input className="c3-field" aria-label={v3("qkUrl")} value={url} inputMode="url" onChange={(event) => setUrl(event.target.value)} />
        </label>
        <button type="submit" className="c3-btn">{v3("qkAdd")}</button>
      </form>
      <p className="c3-muted">{v3("qkBlank")}</p>
      <p className="c3-muted">{v3("qkHttp")}</p>
      <label className="c3-lab">
        <span>{v3("qkSearch")}</span>
        <input className="c3-field" aria-label={v3("qkSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c3-row" role="group" aria-label={v3("qkShown")}>
        <button type="button" className="c3-chip" data-on={hidden ? "0" : "1"} aria-pressed={!hidden} onClick={() => setHidden(false)}>{v3("qkShown")}</button>
        <button type="button" className="c3-chip" data-on={hidden ? "1" : "0"} aria-pressed={hidden} onClick={() => setHidden(true)}>{v3("qkHidden")}</button>
      </div>
      {!shown.length && <p className="c3-empty">{v3("qkEmpty")}</p>}
      <ul className="c3-link-list">
        {shown.map((link) => (
          <li key={link.id} className="c3-link-card" data-pinned={link.pinned ? "1" : "0"}>
            <p>{link.name}</p>
            <p className="c3-muted">{link.url}</p>
            <div className="c3-row">
              <a className="c3-btn" href={link.url} target="_blank" rel="noreferrer">{v3("qkOpen")}</a>
              <button type="button" className="c3-btn" onClick={() => store(toggleLinkPin(links, link.id))}>{link.pinned ? v3("qkUnpin") : v3("qkPin")}</button>
              <button type="button" className="c3-btn" onClick={() => store(setLinkHidden(links, link.id, !link.hidden))}>{link.hidden ? v3("qkShow") : v3("qkHide")}</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function PriorityGlance({ base }: { base: string }) {
  const v3 = useV3();
  const data = useJson<{ tickets?: Ticket[] }>(TICKETS);
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
    <section className="c3-priority-glance" aria-label={v3("pgTitle")} data-priority-glance="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("pgSub")}</p>
          <h2 className="c3-title">{v3("pgTitle")}</h2>
        </div>
        <p className="c3-muted">{chips.length}</p>
      </header>
      <p className="c3-muted">{v3("pgHint")}</p>
      <p className="c3-muted">{v3("pgLocal")}</p>
      <p className="c3-row">
        <Link className="c3-btn" href={crmv3Href(base, "support")}>{v3("pgBoard")}</Link>
      </p>
      {data.loading && !rows.length && <p className="c3-muted">{v3("pgLoading")}</p>}
      {data.error && <p className="c3-muted">{v3("pgFailed")}</p>}
      {!data.loading && !data.error && !rows.length && <p className="c3-empty">{v3("pgNone")}</p>}
      {blankCount > 0 && (
        <button type="button" className="c3-priority-blank" data-on={blank ? "1" : "0"} aria-pressed={blank} onClick={() => { setBlank((value) => !value); setSelected(""); }}>
          <span>{v3("pgBlank")}</span>
          <span className="c3-muted">{blankCount}</span>
        </button>
      )}
      <div className="c3-row" role="group" aria-label={v3("pgShown")}>
        <button type="button" className="c3-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v3("pgShown")}</button>
        <button type="button" className="c3-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v3("pgHidden")}</button>
      </div>
      <div className="c3-row" role="group" aria-label={v3("pgTitle")}>
        <button type="button" className="c3-chip" data-on={!priority && !blank ? "1" : "0"} aria-pressed={!priority && !blank} onClick={() => { setSelected(""); setBlank(false); }}>{v3("pgAll")}</button>
        {chips.map((item) => (
          <span key={item} className="c3-priority-pair" data-priority={item}>
            <button type="button" className="c3-chip" data-on={priority === item ? "1" : "0"} aria-pressed={priority === item} onClick={() => { setBlank(false); setSelected(priority === item ? "" : item); }}>{item}</button>
            <button type="button" className="c3-btn" onClick={() => store(togglePriority(hiddenPriorities, item, present), showHidden ? "" : item)}>{showHidden ? v3("pgShow") : v3("pgHide")}</button>
          </span>
        ))}
      </div>
      <label className="c3-lab">
        <span>{v3("pgSearch")}</span>
        <input className="c3-field" aria-label={v3("pgSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c3-empty">{v3("pgEmpty")}</p>}
      <ul className="c3-priority-rows">
        {shown.map((row) => {
          const name = priorityText(row.priority);
          return (
            <li key={row.id} data-priority={name || "blank"}>
              <p>{row.label || row.id}</p>
              <p className="c3-muted">{name || v3("pgBlank")}</p>
              {row.userId && <Link className="c3-btn" href={crmv3Href(base, `customers/${row.userId}`)}>{v3("pgCustomer")}</Link>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
