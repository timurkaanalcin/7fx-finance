"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readJson, writeJson } from "@/lib/crmv3/bridge";
import type { CrmV3CopyKey } from "@/lib/crmv3/copy";
import { FOCUS_KEY, FOCUS_PANELS, type FocusPanel } from "@/lib/crmv3/deskfocus";
import {
  KYC_STATUS_KEY,
  VIEW_KEY,
  activeStatus,
  addView,
  clearView,
  hiddenPanels,
  namedStatuses,
  readHiddenStatuses,
  readViews,
  statusLines,
  statusText,
  toggleStatus,
  visibleDocs,
  visibleStatuses,
  visibleViews,
  type DeskView,
  type StatusRow,
} from "@/lib/crmv3/savedviews";
import { crmv3Href } from "@/lib/crmv3/sections";
import { useJson } from "../kit";
import { useV3 } from "./store";

const PANEL_LABEL: Record<FocusPanel, CrmV3CopyKey> = {
  sections: "dvSections",
  rail: "dvRail",
  tools: "dvTools",
};

type DocumentRow = {
  id: string;
  name?: string | null;
  status?: string | null;
  trader?: string | null;
  traderId?: string | null;
};

type GlanceRow = StatusRow & { id: string; userId: string };

export function SavedViews() {
  const v3 = useV3();
  const [views, setViews] = useState<DeskView[]>([]);
  const [name, setName] = useState("");
  const [panels, setPanels] = useState<FocusPanel[]>([...FOCUS_PANELS]);
  const [filter, setFilter] = useState("");
  const [marked, setMarked] = useState(false);
  const [query, setQuery] = useState("");
  useEffect(() => {
    const next = readViews(readJson(VIEW_KEY, []));
    setViews(next);
    writeJson(VIEW_KEY, next);
  }, []);
  const shown = visibleViews(views, query);

  function store(next: DeskView[]) {
    setViews(next);
    writeJson(VIEW_KEY, next);
  }

  function toggle(id: FocusPanel) {
    setPanels((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function apply(view: DeskView) {
    const hidden = hiddenPanels(view);
    writeJson(FOCUS_KEY, hidden);
    window.dispatchEvent(new CustomEvent("crmv3:desk-focus", { detail: hidden }));
    setPanels(view.panels);
    setFilter(view.filters.q || "");
    setMarked(view.filters.marked === "1");
  }

  return (
    <section className="c3-saved-views" aria-label={v3("dvTitle")} data-saved-views="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-pay-kicker">{v3("dvSub")}</p>
          <h2 className="c3-title">{v3("dvTitle")}</h2>
        </div>
        <p className="c3-meta">{shown.length}</p>
      </header>
      <p className="c3-meta">{v3("dvHint")}</p>
      <p className="c3-meta">{v3("dvLocal")}</p>
      <form className="c3-row" onSubmit={(event) => {
        event.preventDefault();
        const next = addView(views, {
          id: `dv-${Date.now()}`,
          name,
          panels,
          filters: { q: filter, marked: marked ? "1" : "" },
          at: new Date().toISOString(),
        });
        if (next.length === views.length) return;
        store(next);
        setName("");
      }}>
        <label className="c3-lab">
          <span>{v3("dvName")}</span>
          <input className="c3-field" aria-label={v3("dvName")} value={name} maxLength={40} onChange={(event) => setName(event.target.value)} />
        </label>
        <button type="submit" className="c3-btn">{v3("dvAdd")}</button>
      </form>
      <p className="c3-meta">{v3("dvBlank")}</p>
      <div className="c3-row" role="group" aria-label={v3("dvTitle")}>
        {FOCUS_PANELS.map((id) => (
          <button key={id} type="button" className="c3-chip" data-on={panels.includes(id) ? "1" : "0"} aria-pressed={panels.includes(id)} onClick={() => toggle(id)}>{v3(PANEL_LABEL[id])}</button>
        ))}
        <button type="button" className="c3-chip" data-on={marked ? "1" : "0"} aria-pressed={marked} onClick={() => setMarked((value) => !value)}>{v3("dvMarked")}</button>
      </div>
      <label className="c3-lab">
        <span>{v3("dvFilter")}</span>
        <input className="c3-field" aria-label={v3("dvFilter")} value={filter} onChange={(event) => setFilter(event.target.value)} />
      </label>
      <label className="c3-lab">
        <span>{v3("dvSearch")}</span>
        <input className="c3-field" aria-label={v3("dvSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!shown.length && <p className="c3-pay-empty">{v3("dvEmpty")}</p>}
      <ul className="c3-view-list">
        {shown.map((view) => (
          <li key={view.id} className="c3-view-card" data-view={view.id}>
            <p>{view.name}</p>
            <p className="c3-meta">{view.panels.join(" ") || v3("dvNone")}</p>
            <p className="c3-meta">{`${view.filters.q || ""} ${view.filters.marked ? v3("dvMarked") : ""}`.trim() || v3("dvNone")}</p>
            <div className="c3-row">
              <button type="button" className="c3-btn" onClick={() => apply(view)}>{v3("dvApply")}</button>
              <button type="button" className="c3-btn" onClick={() => store(clearView(views, view.id))}>{v3("dvClear")}</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function KycStatus({ base }: { base: string }) {
  const v3 = useV3();
  const data = useJson<{ documents?: DocumentRow[] }>("/api/admin/documents?take=40");
  const [hiddenStatuses, setHiddenStatuses] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [blank, setBlank] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [query, setQuery] = useState("");
  const rows = (data.data?.documents || []).map((row): GlanceRow | null => {
    const id = String(row.id || "").trim();
    if (!id) return null;
    return {
      id,
      status: row.status,
      label: String(row.name || row.trader || "").trim(),
      userId: String(row.traderId || "").trim(),
    };
  }).filter((row): row is GlanceRow => Boolean(row));
  const lines = statusLines(rows);
  const present = namedStatuses(rows);
  const presentKey = present.join("\n");
  const blankCount = lines.find((line) => !line.status)?.count || 0;
  useEffect(() => {
    if (data.loading || data.error) return;
    const next = readHiddenStatuses(readJson(KYC_STATUS_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHiddenStatuses(next);
    writeJson(KYC_STATUS_KEY, next);
  }, [data.loading, data.error, presentKey]);
  const chips = visibleStatuses(present, hiddenStatuses, showHidden);
  const status = activeStatus(selected, chips);
  const shown = visibleDocs(rows, status, blank, query);

  function store(next: string[], clear: string) {
    setHiddenStatuses(next);
    writeJson(KYC_STATUS_KEY, next);
    if (clear && activeStatus(selected, [clear])) setSelected("");
  }

  return (
    <section className="c3-kyc-status" aria-label={v3("kyTitle")} data-kyc-status="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-pay-kicker">{v3("kySub")}</p>
          <h2 className="c3-title">{v3("kyTitle")}</h2>
        </div>
        <p className="c3-meta">{chips.length}</p>
      </header>
      <p className="c3-meta">{v3("kyHint")}</p>
      <p className="c3-meta">{v3("kyLocal")}</p>
      <p className="c3-row">
        <Link className="c3-btn" href={crmv3Href(base, "kyc")}>{v3("kyBoard")}</Link>
      </p>
      {data.loading && !rows.length && <p className="c3-meta">{v3("kyLoading")}</p>}
      {data.error && <p className="c3-meta">{v3("kyFailed")}</p>}
      {!data.loading && !data.error && !rows.length && <p className="c3-pay-empty">{v3("kyNone")}</p>}
      {blankCount > 0 && (
        <button type="button" className="c3-ky-blank" data-on={blank ? "1" : "0"} aria-pressed={blank} onClick={() => { setBlank((value) => !value); setSelected(""); }}>
          <span>{v3("kyBlank")}</span>
          <span className="c3-meta">{blankCount}</span>
        </button>
      )}
      <div className="c3-row" role="group" aria-label={v3("kyShown")}>
        <button type="button" className="c3-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v3("kyShown")}</button>
        <button type="button" className="c3-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v3("kyHidden")}</button>
      </div>
      <div className="c3-row" role="group" aria-label={v3("kyTitle")}>
        <button type="button" className="c3-chip" data-on={!status && !blank ? "1" : "0"} aria-pressed={!status && !blank} onClick={() => { setSelected(""); setBlank(false); }}>{v3("kyAll")}</button>
        {chips.map((item) => {
          const count = lines.find((line) => line.status === item)?.count || 0;
          return (
            <span key={item} className="c3-ky-pair" data-status={item}>
              <button type="button" className="c3-chip" data-on={status === item ? "1" : "0"} aria-pressed={status === item} onClick={() => { setBlank(false); setSelected(status === item ? "" : item); }}>{item} {count}</button>
              <button type="button" className="c3-btn" onClick={() => store(toggleStatus(hiddenStatuses, item, present), showHidden ? "" : item)}>{showHidden ? v3("kyShow") : v3("kyHide")}</button>
            </span>
          );
        })}
      </div>
      <label className="c3-lab">
        <span>{v3("kySearch")}</span>
        <input className="c3-field" aria-label={v3("kySearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c3-pay-empty">{v3("kyEmpty")}</p>}
      <ul className="c3-ky-rows">
        {shown.map((row) => {
          const name = statusText(row.status);
          return (
            <li key={row.id} data-status={name || "blank"}>
              <p>{row.label || row.id}</p>
              <p className="c3-meta">{name || v3("kyBlank")}</p>
              {row.userId && <Link className="c3-btn" href={crmv3Href(base, `customers/${row.userId}`)}>{v3("kyCustomer")}</Link>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
