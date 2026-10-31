"use client";

import Link from "next/link";
import { useState } from "react";
import type { CrmV3CopyKey } from "@/lib/crmv3/copy";
import { NAV_SECTIONS, activeGroup, filterSection, listedIds, sectionPath, type NavSectionId } from "@/lib/crmv3/nav";
import { crmv3Href } from "@/lib/crmv3/sections";
import { SmartMenu } from "./record";

export type V3 = (key: CrmV3CopyKey) => string;

const GROUP_KEY: Record<NavSectionId, CrmV3CopyKey> = {
  work: "navWork",
  money: "navMoney",
  compliance: "navCompliance",
  insights: "navInsights",
  desk: "navDesk",
};

export function GroupedLinks({
  base,
  view,
  names,
  v3,
  query,
  allow,
  linkClass,
  onPick,
}: {
  base: string;
  view: string;
  names: Record<string, string>;
  v3: V3;
  query: string;
  allow?: readonly string[];
  linkClass: string;
  onPick?: () => void;
}) {
  const here = activeGroup(view);
  const blocks = NAV_SECTIONS.map((group) => {
    const ids = allow ? listedIds(group.ids, allow) : [...group.ids];
    return { id: group.id, total: ids.length, ids: filterSection(ids, names, query) };
  }).filter((group) => group.total > 0);
  const shown = blocks.reduce((sum, group) => sum + group.ids.length, 0);
  return (
    <div className="c3-rail-groups">
      {query.trim() && shown === 0 && <p className="c3-muted c3-meta">{v3("railNone")}</p>}
      {blocks.map((group) => {
        if (query.trim() && !group.ids.length) return null;
        return (
          <section key={group.id} className="c3-rail-group" data-on={here === group.id ? "1" : "0"} aria-label={v3(GROUP_KEY[group.id])}>
            <h3 className="c3-rail-label">
              <span className="c3-rail-name">{v3(GROUP_KEY[group.id])}</span>
              <span className="c3-muted"> {group.total}</span>
            </h3>
            {group.ids.map((id) => (
              <Link
                key={id}
                href={crmv3Href(base, sectionPath(id))}
                data-nav={id}
                data-on={view === id ? "1" : "0"}
                aria-current={view === id ? "page" : undefined}
                aria-label={names[id] || id}
                className={linkClass}
                onClick={onPick}
              >
                <span className="c3-rail-mark" aria-hidden="true">{(names[id] || id).slice(0, 1)}</span>
                <span className="c3-rail-name">{names[id] || id}</span>
              </Link>
            ))}
            {group.id === "work" && <SmartMenu base={base} v3={v3} onPick={onPick} linkClass={linkClass} />}
          </section>
        );
      })}
    </div>
  );
}

export function RailNav({
  base,
  view,
  names,
  folded,
  query,
  v3,
  onQuery,
  onToggle,
}: {
  base: string;
  view: string;
  names: Record<string, string>;
  folded: boolean;
  query: string;
  v3: V3;
  onQuery: (value: string) => void;
  onToggle: () => void;
}) {
  return (
    <nav className="c3-rail-nav" aria-label={v3("railNav")}>
      <button
        type="button"
        className="c3-btn c3-rail-fold"
        aria-pressed={folded}
        aria-expanded={!folded}
        aria-label={folded ? v3("railExpand") : v3("railFold")}
        onClick={onToggle}
      >
        <span className="c3-rail-mark" aria-hidden="true">{folded ? "+" : "–"}</span>
        <span className="c3-rail-name">{folded ? v3("railExpandShort") : v3("railFoldShort")}</span>
      </button>
      <p className="c3-rail-here c3-rail-name"><span className="c3-muted">{v3("railHere")}</span> {names[view] || "—"}</p>
      <p className="c3-muted c3-meta c3-rail-note c3-rail-name">{v3("railStored")}</p>
      <label className="c3-lab c3-rail-find">
        <span className="c3-rail-name">{v3("railFind")}</span>
        <input className="c3-field" aria-label={v3("railFind")} value={query} onChange={(event) => onQuery(event.target.value)} />
      </label>
      <GroupedLinks base={base} view={view} names={names} v3={v3} query={query} linkClass="c3-nav" />
    </nav>
  );
}

export function MoreNav({
  base,
  view,
  names,
  allow,
  v3,
  onPick,
}: {
  base: string;
  view: string;
  names: Record<string, string>;
  allow: readonly string[];
  v3: V3;
  onPick: () => void;
}) {
  const [query, setQuery] = useState("");
  return (
    <div className="c3-more-menu c3-stack">
      <p className="c3-rail-here"><span className="c3-muted">{v3("railHere")}</span> {names[view] || "—"}</p>
      <label className="c3-lab">
        <span>{v3("railFind")}</span>
        <input className="c3-field" aria-label={v3("railFind")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <GroupedLinks base={base} view={view} names={names} v3={v3} query={query} allow={allow} linkClass="c3-btn" onPick={onPick} />
    </div>
  );
}
