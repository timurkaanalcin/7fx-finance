"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import {
  DEP_STATUS_KEY,
  RAIL_KEY,
  activeStatus,
  addShortcut,
  moveShortcut,
  namedStatuses,
  readHiddenStatuses,
  readShortcuts,
  sectionId,
  sectionPath,
  setShortcutHidden,
  statusLines,
  statusText,
  toggleShortcutPin,
  toggleStatus,
  visibleDeposits,
  visibleShortcuts,
  visibleStatuses,
  type Shortcut,
  type StatusRow,
} from "@/lib/crmv4/round96";
import { CRM_V4_SECTIONS, crmv4Href } from "@/lib/crmv4/sections";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

type Deposit = {
  id: string;
  status?: string | null;
  userId?: string | null;
  user?: { id?: string | null; name?: string | null; email?: string | null } | null;
};

type GlanceRow = StatusRow & { id: string; userId: string };

export function PinRail({ base, v4 }: { base: string; v4: V4 }) {
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
  const [name, setName] = useState("");
  const [section, setSection] = useState("customers");
  const [query, setQuery] = useState("");
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const next = readShortcuts(readJson(RAIL_KEY, []));
    setShortcuts(next);
    writeJson(RAIL_KEY, next);
  }, []);
  const shown = visibleShortcuts(shortcuts, query, hidden);

  function store(next: Shortcut[]) {
    setShortcuts(next);
    writeJson(RAIL_KEY, next);
  }

  return (
    <section className="c4-pin-rail" aria-label={v4("rlTitle")} data-pin-rail="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-pay-kicker">{v4("rlSub")}</p>
          <h2 className="c4-title">{v4("rlTitle")}</h2>
        </div>
        <p className="c4-meta">{shown.length}</p>
      </header>
      <p className="c4-meta">{v4("rlHint")}</p>
      <p className="c4-meta">{v4("rlLocal")}</p>
      <form className="c4-row" onSubmit={(event) => {
        event.preventDefault();
        const next = addShortcut(shortcuts, { id: `rl-${Date.now()}`, name, section });
        if (next.length === shortcuts.length) return;
        store(next);
        setName("");
      }}>
        <label className="c4-lab">
          <span>{v4("rlName")}</span>
          <input className="c4-field" aria-label={v4("rlName")} value={name} maxLength={40} onChange={(event) => setName(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("rlSection")}</span>
          <select className="c4-field" aria-label={v4("rlSection")} value={section} onChange={(event) => {
            const next = sectionId(event.target.value);
            if (next) setSection(next);
          }}>
            {CRM_V4_SECTIONS.map((item) => <option key={item.id} value={item.id}>{item.id}</option>)}
          </select>
        </label>
        <button type="submit" className="c4-btn">{v4("rlAdd")}</button>
      </form>
      <p className="c4-meta">{v4("rlBlank")}</p>
      <p className="c4-meta">{v4("rlUnknown")}</p>
      <label className="c4-lab">
        <span>{v4("rlSearch")}</span>
        <input className="c4-field" aria-label={v4("rlSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c4-row" role="group" aria-label={v4("rlShown")}>
        <button type="button" className="c4-chip" data-on={hidden ? "0" : "1"} aria-pressed={!hidden} onClick={() => setHidden(false)}>{v4("rlShown")}</button>
        <button type="button" className="c4-chip" data-on={hidden ? "1" : "0"} aria-pressed={hidden} onClick={() => setHidden(true)}>{v4("rlHidden")}</button>
      </div>
      {!shown.length && <p className="c4-pay-empty">{v4("rlEmpty")}</p>}
      <ol className="c4-rail-list">
        {shown.map((item) => (
          <li key={item.id} className="c4-rail-card" data-pinned={item.pinned ? "1" : "0"} data-section={item.section}>
            <p>{item.name}</p>
            <p className="c4-meta">{item.section}</p>
            <div className="c4-row">
              <Link className="c4-btn" href={crmv4Href(base, sectionPath(item.section))}>{v4("rlOpen")}</Link>
              <button type="button" className="c4-btn" onClick={() => store(moveShortcut(shortcuts, item.id, -1))}>{v4("rlUp")}</button>
              <button type="button" className="c4-btn" onClick={() => store(moveShortcut(shortcuts, item.id, 1))}>{v4("rlDown")}</button>
              <button type="button" className="c4-btn" onClick={() => store(toggleShortcutPin(shortcuts, item.id))}>{item.pinned ? v4("rlUnpin") : v4("rlPin")}</button>
              <button type="button" className="c4-btn" onClick={() => store(setShortcutHidden(shortcuts, item.id, !item.hidden))}>{item.hidden ? v4("rlShow") : v4("rlHide")}</button>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function DepStatusGlance({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ requests?: Deposit[] }>("/api/admin/deposits?take=40");
  const [hiddenStatuses, setHiddenStatuses] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [blank, setBlank] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [query, setQuery] = useState("");
  const rows = (data.data?.requests || []).map((row): GlanceRow | null => {
    const id = String(row.id || "").trim();
    if (!id) return null;
    return {
      id,
      status: row.status,
      label: String(row.user?.name || row.user?.email || ""),
      userId: String(row.user?.id || row.userId || "").trim(),
    };
  }).filter((row): row is GlanceRow => Boolean(row));
  const lines = statusLines(rows);
  const present = namedStatuses(rows);
  const presentKey = present.join("\n");
  const blankCount = lines.find((line) => !line.status)?.count || 0;
  useEffect(() => {
    if (data.loading || data.error) return;
    const next = readHiddenStatuses(readJson(DEP_STATUS_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHiddenStatuses(next);
    writeJson(DEP_STATUS_KEY, next);
  }, [data.loading, data.error, presentKey]);
  const chips = visibleStatuses(present, hiddenStatuses, showHidden);
  const status = activeStatus(selected, chips);
  const shown = visibleDeposits(rows, status, blank, query);

  function store(next: string[], clear: string) {
    setHiddenStatuses(next);
    writeJson(DEP_STATUS_KEY, next);
    if (clear && activeStatus(selected, [clear])) setSelected("");
  }

  return (
    <section className="c4-dep-status" aria-label={v4("dzTitle")} data-dep-status="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-pay-kicker">{v4("dzSub")}</p>
          <h2 className="c4-title">{v4("dzTitle")}</h2>
        </div>
        <p className="c4-meta">{chips.length}</p>
      </header>
      <p className="c4-meta">{v4("dzHint")}</p>
      <p className="c4-meta">{v4("dzLocal")}</p>
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "depboard")}>{v4("dzBoard")}</Link>
      </p>
      {data.loading && !rows.length && <p className="c4-meta">{v4("dzLoading")}</p>}
      {data.error && <p className="c4-meta">{v4("dzFailed")}</p>}
      {!data.loading && !data.error && !rows.length && <p className="c4-pay-empty">{v4("dzNone")}</p>}
      {blankCount > 0 && (
        <button type="button" className="c4-dep-blank" data-on={blank ? "1" : "0"} aria-pressed={blank} onClick={() => { setBlank((value) => !value); setSelected(""); }}>
          <span>{v4("dzBlank")}</span>
          <span className="c4-meta">{blankCount}</span>
        </button>
      )}
      <div className="c4-row" role="group" aria-label={v4("dzShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("dzShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("dzHidden")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("dzTitle")}>
        <button type="button" className="c4-chip" data-on={!status && !blank ? "1" : "0"} aria-pressed={!status && !blank} onClick={() => { setSelected(""); setBlank(false); }}>{v4("dzAll")}</button>
        {chips.map((item) => (
          <span key={item} className="c4-dep-pair" data-status={item}>
            <button type="button" className="c4-chip" data-on={status === item ? "1" : "0"} aria-pressed={status === item} onClick={() => { setBlank(false); setSelected(status === item ? "" : item); }}>{item}</button>
            <button type="button" className="c4-btn" onClick={() => store(toggleStatus(hiddenStatuses, item, present), showHidden ? "" : item)}>{showHidden ? v4("dzShow") : v4("dzHide")}</button>
          </span>
        ))}
      </div>
      <label className="c4-lab">
        <span>{v4("dzSearch")}</span>
        <input className="c4-field" aria-label={v4("dzSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c4-pay-empty">{v4("dzEmpty")}</p>}
      <ul className="c4-dep-rows">
        {shown.map((row) => {
          const name = statusText(row.status);
          return (
            <li key={row.id} data-status={name || "blank"}>
              <p>{row.label || row.id}</p>
              <p className="c4-meta">{name || v4("dzBlank")}</p>
              {row.userId && <Link className="c4-btn" href={crmv4Href(base, `customers/${row.userId}`)}>{v4("dzCustomer")}</Link>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
