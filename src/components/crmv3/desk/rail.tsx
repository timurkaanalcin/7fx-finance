"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readJson, writeJson } from "@/lib/crmv3/bridge";
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
} from "@/lib/crmv3/pinrail";
import { CRM_V3_SECTIONS, crmv3Href } from "@/lib/crmv3/sections";
import { useJson } from "../kit";
import { useV3 } from "./store";

const DEPOSITS = "/api/admin/deposits?take=40";

type Deposit = {
  id: string;
  status?: string | null;
  userId?: string | null;
  user?: { id?: string | null; name?: string | null; email?: string | null } | null;
};

type GlanceRow = StatusRow & { id: string; userId: string };

export function PinRail({ base }: { base: string }) {
  const v3 = useV3();
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
    <section className="c3-pin-rail" aria-label={v3("rlTitle")} data-pin-rail="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("rlSub")}</p>
          <h2 className="c3-title">{v3("rlTitle")}</h2>
        </div>
        <p className="c3-muted">{shown.length}</p>
      </header>
      <p className="c3-muted">{v3("rlHint")}</p>
      <p className="c3-muted">{v3("rlLocal")}</p>
      <form className="c3-row" onSubmit={(event) => {
        event.preventDefault();
        const next = addShortcut(shortcuts, { id: `rl-${Date.now()}`, name, section });
        if (next.length === shortcuts.length) return;
        store(next);
        setName("");
      }}>
        <label className="c3-lab">
          <span>{v3("rlName")}</span>
          <input className="c3-field" aria-label={v3("rlName")} value={name} maxLength={40} onChange={(event) => setName(event.target.value)} />
        </label>
        <label className="c3-lab">
          <span>{v3("rlSection")}</span>
          <select className="c3-field" aria-label={v3("rlSection")} value={section} onChange={(event) => {
            const next = sectionId(event.target.value);
            if (next) setSection(next);
          }}>
            {CRM_V3_SECTIONS.map((item) => <option key={item.id} value={item.id}>{item.id}</option>)}
          </select>
        </label>
        <button type="submit" className="c3-btn">{v3("rlAdd")}</button>
      </form>
      <p className="c3-muted">{v3("rlBlank")}</p>
      <p className="c3-muted">{v3("rlUnknown")}</p>
      <label className="c3-lab">
        <span>{v3("rlSearch")}</span>
        <input className="c3-field" aria-label={v3("rlSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c3-row" role="group" aria-label={v3("rlShown")}>
        <button type="button" className="c3-chip" data-on={hidden ? "0" : "1"} aria-pressed={!hidden} onClick={() => setHidden(false)}>{v3("rlShown")}</button>
        <button type="button" className="c3-chip" data-on={hidden ? "1" : "0"} aria-pressed={hidden} onClick={() => setHidden(true)}>{v3("rlHidden")}</button>
      </div>
      {!shown.length && <p className="c3-empty">{v3("rlEmpty")}</p>}
      <ol className="c3-rail-list">
        {shown.map((item) => (
          <li key={item.id} className="c3-rail-card" data-pinned={item.pinned ? "1" : "0"} data-section={item.section}>
            <p>{item.name}</p>
            <p className="c3-muted">{item.section}</p>
            <div className="c3-row">
              <Link className="c3-btn" href={crmv3Href(base, sectionPath(item.section))}>{v3("rlOpen")}</Link>
              <button type="button" className="c3-btn" onClick={() => store(moveShortcut(shortcuts, item.id, -1))}>{v3("rlUp")}</button>
              <button type="button" className="c3-btn" onClick={() => store(moveShortcut(shortcuts, item.id, 1))}>{v3("rlDown")}</button>
              <button type="button" className="c3-btn" onClick={() => store(toggleShortcutPin(shortcuts, item.id))}>{item.pinned ? v3("rlUnpin") : v3("rlPin")}</button>
              <button type="button" className="c3-btn" onClick={() => store(setShortcutHidden(shortcuts, item.id, !item.hidden))}>{item.hidden ? v3("rlShow") : v3("rlHide")}</button>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function DepStatusGlance({ base }: { base: string }) {
  const v3 = useV3();
  const data = useJson<{ requests?: Deposit[] }>(DEPOSITS);
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
    <section className="c3-dep-status" aria-label={v3("dzTitle")} data-dep-status="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("dzSub")}</p>
          <h2 className="c3-title">{v3("dzTitle")}</h2>
        </div>
        <p className="c3-muted">{chips.length}</p>
      </header>
      <p className="c3-muted">{v3("dzHint")}</p>
      <p className="c3-muted">{v3("dzLocal")}</p>
      <p className="c3-row">
        <Link className="c3-btn" href={crmv3Href(base, "depboard")}>{v3("dzBoard")}</Link>
      </p>
      {data.loading && !rows.length && <p className="c3-muted">{v3("dzLoading")}</p>}
      {data.error && <p className="c3-muted">{v3("dzFailed")}</p>}
      {!data.loading && !data.error && !rows.length && <p className="c3-empty">{v3("dzNone")}</p>}
      {blankCount > 0 && (
        <button type="button" className="c3-dep-blank" data-on={blank ? "1" : "0"} aria-pressed={blank} onClick={() => { setBlank((value) => !value); setSelected(""); }}>
          <span>{v3("dzBlank")}</span>
          <span className="c3-muted">{blankCount}</span>
        </button>
      )}
      <div className="c3-row" role="group" aria-label={v3("dzShown")}>
        <button type="button" className="c3-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v3("dzShown")}</button>
        <button type="button" className="c3-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v3("dzHidden")}</button>
      </div>
      <div className="c3-row" role="group" aria-label={v3("dzTitle")}>
        <button type="button" className="c3-chip" data-on={!status && !blank ? "1" : "0"} aria-pressed={!status && !blank} onClick={() => { setSelected(""); setBlank(false); }}>{v3("dzAll")}</button>
        {chips.map((item) => (
          <span key={item} className="c3-dep-pair" data-status={item}>
            <button type="button" className="c3-chip" data-on={status === item ? "1" : "0"} aria-pressed={status === item} onClick={() => { setBlank(false); setSelected(status === item ? "" : item); }}>{item}</button>
            <button type="button" className="c3-btn" onClick={() => store(toggleStatus(hiddenStatuses, item, present), showHidden ? "" : item)}>{showHidden ? v3("dzShow") : v3("dzHide")}</button>
          </span>
        ))}
      </div>
      <label className="c3-lab">
        <span>{v3("dzSearch")}</span>
        <input className="c3-field" aria-label={v3("dzSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c3-empty">{v3("dzEmpty")}</p>}
      <ul className="c3-dep-rows">
        {shown.map((row) => {
          const name = statusText(row.status);
          return (
            <li key={row.id} data-status={name || "blank"}>
              <p>{row.label || row.id}</p>
              <p className="c3-muted">{name || v3("dzBlank")}</p>
              {row.userId && <Link className="c3-btn" href={crmv3Href(base, `customers/${row.userId}`)}>{v3("dzCustomer")}</Link>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
