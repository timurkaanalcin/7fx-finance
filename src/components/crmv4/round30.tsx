"use client";

import Link from "next/link";
import { useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { NAV_SECTIONS, activeGroup, filterSection, matchedCount, sectionPath, type NavSectionId } from "@/lib/crmv4/round30";
import { crmv4Href } from "@/lib/crmv4/sections";

export type V4 = (key: CrmV4CopyKey) => string;

const GROUP_KEY: Record<NavSectionId, CrmV4CopyKey> = {
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
  v4,
  query,
  onPick,
}: {
  base: string;
  view: string;
  names: Record<string, string>;
  v4: V4;
  query: string;
  onPick?: () => void;
}) {
  const here = activeGroup(view);
  const total = matchedCount(names, query);
  return (
    <div className="c4-nav-groups">
      {query.trim() && total === 0 && <p className="c4-muted">{v4("railNone")}</p>}
      {NAV_SECTIONS.map((group) => {
        const ids = filterSection(group.ids, names, query);
        if (query.trim() && !ids.length) return null;
        return (
          <section key={group.id} data-on={here === group.id ? "1" : "0"} aria-label={v4(GROUP_KEY[group.id])}>
            <h3 className="c4-title">
              <span className="c4-rail-name">{v4(GROUP_KEY[group.id])}</span>
              <span className="c4-muted"> {group.ids.length}</span>
            </h3>
            {ids.map((id) => (
              <Link
                key={id}
                href={crmv4Href(base, sectionPath(id))}
                data-on={view === id ? "1" : "0"}
                aria-current={view === id ? "page" : undefined}
                aria-label={names[id] || id}
                className="c4-rail-link"
                onClick={onPick}
              >
                <span className="c4-rail-mark" aria-hidden="true">{(names[id] || id).slice(0, 1)}</span>
                <span className="c4-rail-name">{names[id] || id}</span>
              </Link>
            ))}
          </section>
        );
      })}
    </div>
  );
}

export function PageRail({
  base,
  view,
  names,
  folded,
  query,
  v4,
  onQuery,
  onToggle,
}: {
  base: string;
  view: string;
  names: Record<string, string>;
  folded: boolean;
  query: string;
  v4: V4;
  onQuery: (value: string) => void;
  onToggle: () => void;
}) {
  return (
    <nav className="c4-page-rail" aria-label={v4("railNav")}>
      <button
        type="button"
        className="c4-rail-fold"
        aria-pressed={folded}
        aria-expanded={!folded}
        aria-label={folded ? v4("railExpand") : v4("railFold")}
        onClick={onToggle}
      >
        <span className="c4-rail-mark" aria-hidden="true">{folded ? "+" : "–"}</span>
        <span className="c4-rail-name">{folded ? v4("railExpandShort") : v4("railFoldShort")}</span>
      </button>
      <p className="c4-rail-here"><span className="c4-muted">{v4("railHere")}</span> {names[view] || "—"}</p>
      <p className="c4-muted c4-rail-note">{v4("railStored")}</p>
      <label className="c4-lab c4-rail-find">
        <span>{v4("railFind")}</span>
        <input className="c4-field" aria-label={v4("railFind")} value={query} onChange={(event) => onQuery(event.target.value)} />
      </label>
      <GroupedLinks base={base} view={view} names={names} v4={v4} query={query} />
    </nav>
  );
}

export function GroupedMenu({
  base,
  view,
  names,
  v4,
  onPick,
}: {
  base: string;
  view: string;
  names: Record<string, string>;
  v4: V4;
  onPick?: () => void;
}) {
  const [query, setQuery] = useState("");
  return (
    <div className="c4-grouped-menu">
      <p className="c4-rail-here"><span className="c4-muted">{v4("railHere")}</span> {names[view] || "—"}</p>
      <label className="c4-lab">
        <span>{v4("railFind")}</span>
        <input className="c4-field" aria-label={v4("railFind")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <GroupedLinks base={base} view={view} names={names} v4={v4} query={query} onPick={onPick} />
    </div>
  );
}
