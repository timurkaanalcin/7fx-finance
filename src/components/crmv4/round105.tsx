"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
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
} from "@/lib/crmv4/round105";
import { crmv4Href } from "@/lib/crmv4/sections";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

type Ticket = {
  id: string;
  priority?: string | null;
  customer?: string | null;
  customerEmail?: string | null;
  customerId?: string | null;
};

type GlanceRow = PriorityRow & { id: string; userId: string };

export function CheckPolish({ v4 }: { v4: V4 }) {
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
    <section className="c4-check-polish" aria-label={v4("hkTitle")} data-check-polish="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-pay-kicker">{v4("hkSub")}</p>
          <h2 className="c4-title">{v4("hkTitle")}</h2>
        </div>
        <p className="c4-meta">{shown.length}</p>
      </header>
      <p className="c4-meta">{v4("hkHint")}</p>
      <p className="c4-meta">{v4("hkLocal")}</p>
      <form className="c4-row" onSubmit={(event) => {
        event.preventDefault();
        const next = addItem(items, { id: `hk-${Date.now()}`, text, at: new Date().toISOString() });
        if (next.length === items.length) return;
        store(next);
        setText("");
      }}>
        <label className="c4-lab">
          <span>{v4("hkText")}</span>
          <input className="c4-field" aria-label={v4("hkText")} value={text} maxLength={40} onChange={(event) => setText(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn">{v4("hkAdd")}</button>
      </form>
      <p className="c4-meta">{v4("hkBlank")}</p>
      <label className="c4-lab">
        <span>{v4("hkSearch")}</span>
        <input className="c4-field" aria-label={v4("hkSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c4-row" role="group" aria-label={v4("hkShown")}>
        <button type="button" className="c4-chip" data-on={hidden ? "0" : "1"} aria-pressed={!hidden} onClick={() => setHidden(false)}>{v4("hkShown")}</button>
        <button type="button" className="c4-chip" data-on={hidden ? "1" : "0"} aria-pressed={hidden} onClick={() => setHidden(true)}>{v4("hkHidden")}</button>
      </div>
      {!shown.length && <p className="c4-pay-empty">{v4("hkEmpty")}</p>}
      <ul className="c4-check-list">
        {shown.map((item) => (
          <li key={item.id} className="c4-check-card" data-done={item.done ? "1" : "0"} data-pinned={item.pinned ? "1" : "0"}>
            <p>{item.text}</p>
            <div className="c4-row">
              <button type="button" className="c4-btn" onClick={() => store(setItemDone(items, item.id, !item.done))}>{item.done ? v4("hkUndo") : v4("hkDone")}</button>
              <button type="button" className="c4-btn" onClick={() => store(toggleItemPin(items, item.id))}>{item.pinned ? v4("hkUnpin") : v4("hkPin")}</button>
              <button type="button" className="c4-btn" onClick={() => store(setItemHidden(items, item.id, !item.hidden))}>{item.hidden ? v4("hkShow") : v4("hkHide")}</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function CasePriority({ base, v4 }: { base: string; v4: V4 }) {
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
    <section className="c4-case-priority" aria-label={v4("zqTitle")} data-case-priority="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-pay-kicker">{v4("zqSub")}</p>
          <h2 className="c4-title">{v4("zqTitle")}</h2>
        </div>
        <p className="c4-meta">{chips.length}</p>
      </header>
      <p className="c4-meta">{v4("zqHint")}</p>
      <p className="c4-meta">{v4("zqLocal")}</p>
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "support")}>{v4("zqBoard")}</Link>
      </p>
      {data.loading && !rows.length && <p className="c4-meta">{v4("zqLoading")}</p>}
      {data.error && <p className="c4-meta">{v4("zqFailed")}</p>}
      {!data.loading && !data.error && !rows.length && <p className="c4-pay-empty">{v4("zqNone")}</p>}
      {blankCount > 0 && (
        <button type="button" className="c4-zq-blank" data-on={blank ? "1" : "0"} aria-pressed={blank} onClick={() => { setBlank((value) => !value); setSelected(""); }}>
          <span>{v4("zqBlank")}</span>
          <span className="c4-meta">{blankCount}</span>
        </button>
      )}
      <div className="c4-row" role="group" aria-label={v4("zqShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("zqShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("zqHidden")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("zqTitle")}>
        <button type="button" className="c4-chip" data-on={!priority && !blank ? "1" : "0"} aria-pressed={!priority && !blank} onClick={() => { setSelected(""); setBlank(false); }}>{v4("zqAll")}</button>
        {chips.map((item) => {
          const count = lines.find((line) => line.priority === item)?.count || 0;
          return (
            <span key={item} className="c4-zq-pair" data-priority={item}>
              <button type="button" className="c4-chip" data-on={priority === item ? "1" : "0"} aria-pressed={priority === item} onClick={() => { setBlank(false); setSelected(priority === item ? "" : item); }}>{item} {count}</button>
              <button type="button" className="c4-btn" onClick={() => store(togglePriority(hiddenPriorities, item, present), showHidden ? "" : item)}>{showHidden ? v4("zqShow") : v4("zqHide")}</button>
            </span>
          );
        })}
      </div>
      <label className="c4-lab">
        <span>{v4("zqSearch")}</span>
        <input className="c4-field" aria-label={v4("zqSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c4-pay-empty">{v4("zqEmpty")}</p>}
      <ul className="c4-zq-rows">
        {shown.map((row) => {
          const name = priorityText(row.priority);
          return (
            <li key={row.id} data-priority={name || "blank"}>
              <p>{row.label || row.id}</p>
              <p className="c4-meta">{name || v4("zqBlank")}</p>
              {row.userId && <Link className="c4-btn" href={crmv4Href(base, `customers/${row.userId}`)}>{v4("zqCustomer")}</Link>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
