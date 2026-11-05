"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readJson, writeJson } from "@/lib/crmv3/bridge";
import {
  CHECK_KEY,
  PRIORITY_KEY,
  activePriority,
  addItem,
  namedPriorities,
  priorityLines,
  priorityText,
  readHiddenPriorities,
  readItems,
  setItemDone,
  setItemHidden,
  toggleItemPin,
  togglePriority,
  visibleCases,
  visibleItems,
  visiblePriorities,
  type CheckItem,
  type PriorityRow,
} from "@/lib/crmv3/checkpolish";
import { crmv3Href } from "@/lib/crmv3/sections";
import { useJson } from "../kit";
import { useV3 } from "./store";

const TICKETS = "/api/admin/tickets?take=40";

type Ticket = {
  id: string;
  priority?: string | null;
  customer?: string | null;
  customerEmail?: string | null;
  customerId?: string | null;
};

type GlanceRow = PriorityRow & { id: string; userId: string };

export function CheckPolish() {
  const v3 = useV3();
  const [items, setItems] = useState<CheckItem[]>([]);
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const next = readItems(readJson(CHECK_KEY, []));
    setItems(next);
    writeJson(CHECK_KEY, next);
  }, []);
  const shown = visibleItems(items, query, hidden);

  function store(next: CheckItem[]) {
    setItems(next);
    writeJson(CHECK_KEY, next);
  }

  return (
    <section className="c3-check-polish" aria-label={v3("hkTitle")} data-check-polish="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("hkSub")}</p>
          <h2 className="c3-title">{v3("hkTitle")}</h2>
        </div>
        <p className="c3-muted">{shown.length}</p>
      </header>
      <p className="c3-muted">{v3("hkHint")}</p>
      <p className="c3-muted">{v3("hkLocal")}</p>
      <form className="c3-row" onSubmit={(event) => {
        event.preventDefault();
        const next = addItem(items, { id: `hk-${Date.now()}`, text, at: new Date().toISOString() });
        if (next.length === items.length) return;
        store(next);
        setText("");
      }}>
        <label className="c3-lab">
          <span>{v3("hkText")}</span>
          <input className="c3-field" aria-label={v3("hkText")} value={text} maxLength={40} onChange={(event) => setText(event.target.value)} />
        </label>
        <button type="submit" className="c3-btn">{v3("hkAdd")}</button>
      </form>
      <p className="c3-muted">{v3("hkBlank")}</p>
      <label className="c3-lab">
        <span>{v3("hkSearch")}</span>
        <input className="c3-field" aria-label={v3("hkSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c3-row" role="group" aria-label={v3("hkShown")}>
        <button type="button" className="c3-chip" data-on={hidden ? "0" : "1"} aria-pressed={!hidden} onClick={() => setHidden(false)}>{v3("hkShown")}</button>
        <button type="button" className="c3-chip" data-on={hidden ? "1" : "0"} aria-pressed={hidden} onClick={() => setHidden(true)}>{v3("hkHidden")}</button>
      </div>
      {!shown.length && <p className="c3-empty">{v3("hkEmpty")}</p>}
      <ul className="c3-check-list">
        {shown.map((item) => (
          <li key={item.id} className="c3-check-card" data-done={item.done ? "1" : "0"} data-pinned={item.pinned ? "1" : "0"}>
            <p>{item.text}</p>
            <div className="c3-row">
              <button type="button" className="c3-btn" onClick={() => store(setItemDone(items, item.id, !item.done))}>{item.done ? v3("hkUndo") : v3("hkDone")}</button>
              <button type="button" className="c3-btn" onClick={() => store(toggleItemPin(items, item.id))}>{item.pinned ? v3("hkUnpin") : v3("hkPin")}</button>
              <button type="button" className="c3-btn" onClick={() => store(setItemHidden(items, item.id, !item.hidden))}>{item.hidden ? v3("hkShow") : v3("hkHide")}</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function CasePriority({ base }: { base: string }) {
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
      label: String(row.customer || row.customerEmail || "").trim(),
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
  const shown = visibleCases(rows, priority, blank, query);

  function store(next: string[], clear: string) {
    setHiddenPriorities(next);
    writeJson(PRIORITY_KEY, next);
    if (clear && activePriority(selected, [clear])) setSelected("");
  }

  return (
    <section className="c3-case-priority" aria-label={v3("zqTitle")} data-case-priority="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-kicker">{v3("zqSub")}</p>
          <h2 className="c3-title">{v3("zqTitle")}</h2>
        </div>
        <p className="c3-muted">{chips.length}</p>
      </header>
      <p className="c3-muted">{v3("zqHint")}</p>
      <p className="c3-muted">{v3("zqLocal")}</p>
      <p className="c3-row">
        <Link className="c3-btn" href={crmv3Href(base, "support")}>{v3("zqBoard")}</Link>
      </p>
      {data.loading && !rows.length && <p className="c3-muted">{v3("zqLoading")}</p>}
      {data.error && <p className="c3-muted">{v3("zqFailed")}</p>}
      {!data.loading && !data.error && !rows.length && <p className="c3-empty">{v3("zqNone")}</p>}
      {blankCount > 0 && (
        <button type="button" className="c3-zq-blank" data-on={blank ? "1" : "0"} aria-pressed={blank} onClick={() => { setBlank((value) => !value); setSelected(""); }}>
          <span>{v3("zqBlank")}</span>
          <span className="c3-muted">{blankCount}</span>
        </button>
      )}
      <div className="c3-row" role="group" aria-label={v3("zqShown")}>
        <button type="button" className="c3-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v3("zqShown")}</button>
        <button type="button" className="c3-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v3("zqHidden")}</button>
      </div>
      <div className="c3-row" role="group" aria-label={v3("zqTitle")}>
        <button type="button" className="c3-chip" data-on={!priority && !blank ? "1" : "0"} aria-pressed={!priority && !blank} onClick={() => { setSelected(""); setBlank(false); }}>{v3("zqAll")}</button>
        {chips.map((item) => {
          const count = lines.find((line) => line.priority === item)?.count || 0;
          return (
            <span key={item} className="c3-zq-pair" data-priority={item}>
              <button type="button" className="c3-chip" data-on={priority === item ? "1" : "0"} aria-pressed={priority === item} onClick={() => { setBlank(false); setSelected(priority === item ? "" : item); }}>{item} {count}</button>
              <button type="button" className="c3-btn" onClick={() => store(togglePriority(hiddenPriorities, item, present), showHidden ? "" : item)}>{showHidden ? v3("zqShow") : v3("zqHide")}</button>
            </span>
          );
        })}
      </div>
      <label className="c3-lab">
        <span>{v3("zqSearch")}</span>
        <input className="c3-field" aria-label={v3("zqSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c3-empty">{v3("zqEmpty")}</p>}
      <ul className="c3-zq-rows">
        {shown.map((row) => {
          const name = priorityText(row.priority);
          return (
            <li key={row.id} data-priority={name || "blank"}>
              <p>{row.label || row.id}</p>
              <p className="c3-muted">{name || v3("zqBlank")}</p>
              {row.userId && <Link className="c3-btn" href={crmv3Href(base, `customers/${row.userId}`)}>{v3("zqCustomer")}</Link>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
