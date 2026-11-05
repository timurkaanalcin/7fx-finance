"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import {
  ASSIGN_HIDE_KEY,
  DIAL_KEY,
  activeAssignee,
  addDial,
  assignLines,
  assigneeText,
  namedAssignees,
  readDials,
  readHiddenAssignees,
  resetDials,
  setDialHidden,
  toggleAssignee,
  toggleDialPin,
  visibleAssignees,
  visibleDials,
  visibleTickets,
  type AssignRow,
  type Dial,
} from "@/lib/crmv4/round115";
import { crmv4Href } from "@/lib/crmv4/sections";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

type Ticket = {
  id: string;
  customer?: string | null;
  assignee?: unknown;
  assigneeName?: string | null;
  owner?: unknown;
};

type GlanceRow = AssignRow & { id: string };

export function QuickDial({ v4 }: { v4: V4 }) {
  const [dials, setDials] = useState<Dial[]>([]);
  const [label, setLabel] = useState("");
  const [phone, setPhone] = useState("");
  const [query, setQuery] = useState("");
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const next = readDials(readJson(DIAL_KEY, []));
    setDials(next);
    writeJson(DIAL_KEY, next);
  }, []);
  const shown = visibleDials(dials, hidden, query);

  function store(next: Dial[]) {
    setDials(next);
    writeJson(DIAL_KEY, next);
  }

  return (
    <section className="c4-quick-dial" aria-label={v4("qdTitle")} data-quick-dial="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-qd-logo" data-logo="mono">{v4("qdLogo")}</p>
          <p className="c4-pay-kicker">{v4("qdSub")}</p>
          <h2 className="c4-title">{v4("qdTitle")}</h2>
        </div>
        <p className="c4-meta">{shown.length}</p>
      </header>
      <p className="c4-meta">{v4("qdHint")}</p>
      <p className="c4-meta">{v4("qdLocal")}</p>
      <p className="c4-meta">{v4("qdBlank")}</p>
      <p className="c4-meta">{v4("qdPhoneBlank")}</p>
      <form className="c4-row" onSubmit={(event) => {
        event.preventDefault();
        const next = addDial(dials, { id: `qd-${dials.length}-${label.trim().slice(0, 8) || "dial"}`, label, phone });
        if (next.length === dials.length) return;
        store(next);
        setLabel("");
        setPhone("");
      }}>
        <label className="c4-lab">
          <span>{v4("qdLabel")}</span>
          <input className="c4-field" aria-label={v4("qdLabel")} value={label} maxLength={80} onChange={(event) => setLabel(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("qdPhone")}</span>
          <input className="c4-field" aria-label={v4("qdPhone")} value={phone} maxLength={40} onChange={(event) => setPhone(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn">{v4("qdAdd")}</button>
        <button type="button" className="c4-btn" onClick={() => store(resetDials())}>{v4("qdReset")}</button>
      </form>
      <label className="c4-lab">
        <span>{v4("qdSearch")}</span>
        <input className="c4-field" aria-label={v4("qdSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c4-row" role="group" aria-label={v4("qdTitle")}>
        <button type="button" className="c4-chip" data-on={hidden ? "0" : "1"} aria-pressed={!hidden} onClick={() => setHidden(false)}>{v4("qdOpen")}</button>
        <button type="button" className="c4-chip" data-on={hidden ? "1" : "0"} aria-pressed={hidden} onClick={() => setHidden(true)}>{v4("qdHidden")}</button>
      </div>
      {!shown.length && <p className="c4-pay-empty">{v4("qdEmpty")}</p>}
      <ul className="c4-qd-rows">
        {shown.map((dial) => (
          <li key={dial.id} data-pinned={dial.pinned ? "1" : "0"}>
            <p>{dial.label}</p>
            {dial.phone ? <p className="c4-meta">{dial.phone}</p> : null}
            <div className="c4-row">
              <button type="button" className="c4-btn" onClick={() => store(toggleDialPin(dials, dial.id))}>{dial.pinned ? v4("qdUnpin") : v4("qdPin")}</button>
              <button type="button" className="c4-btn" onClick={() => store(setDialHidden(dials, dial.id, !dial.hidden))}>{dial.hidden ? v4("qdShow") : v4("qdHide")}</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function TicketAssignees({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ tickets?: Ticket[] }>("/api/admin/tickets?take=40");
  const [hiddenAssignees, setHiddenAssignees] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [blank, setBlank] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [query, setQuery] = useState("");
  const rows = (data.data?.tickets || []).map((row): GlanceRow => ({
    id: String(row.id || ""),
    label: String(row.customer || "").trim(),
    assignee: { assigneeName: row.assigneeName, assignee: row.assignee, owner: row.owner },
  })).filter((row) => row.id);
  const lines = assignLines(rows);
  const present = namedAssignees(rows);
  const presentKey = present.join("\n");
  const blankCount = lines.find((line) => !line.assignee)?.count || 0;
  const loading = data.loading && !data.data;
  const failed = Boolean(data.error);
  useEffect(() => {
    if (loading || failed) return;
    const next = readHiddenAssignees(readJson(ASSIGN_HIDE_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHiddenAssignees(next);
    writeJson(ASSIGN_HIDE_KEY, next);
  }, [loading, failed, presentKey]);
  const chips = visibleAssignees(present, hiddenAssignees, showHidden);
  const assignee = activeAssignee(selected, chips);
  const shown = visibleTickets(rows, assignee, blank, query);

  function store(next: string[], clear: string) {
    setHiddenAssignees(next);
    writeJson(ASSIGN_HIDE_KEY, next);
    if (clear && activeAssignee(selected, [clear])) setSelected("");
  }

  return (
    <section className="c4-ticket-assign" aria-label={v4("taTitle")} data-ticket-assign="1">
      <header className="c4-pay-head">
        <div>
          <p className="c4-pay-kicker">{v4("taSub")}</p>
          <h2 className="c4-title">{v4("taTitle")}</h2>
        </div>
        <p className="c4-meta">{chips.length}</p>
      </header>
      <p className="c4-meta">{v4("taHint")}</p>
      <p className="c4-meta">{v4("taLocal")}</p>
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "support")}>{v4("taBoard")}</Link>
      </p>
      {loading && !rows.length && <p className="c4-meta">{v4("taLoading")}</p>}
      {failed && !rows.length && <p className="c4-meta">{v4("taFailed")}</p>}
      {!loading && !failed && !rows.length && <p className="c4-pay-empty">{v4("taNone")}</p>}
      {blankCount > 0 && (
        <button type="button" className="c4-ta-blank" data-on={blank ? "1" : "0"} aria-pressed={blank} onClick={() => { setBlank((value) => !value); setSelected(""); }}>
          <span>{v4("taBlank")}</span>
          <span className="c4-meta">{blankCount}</span>
        </button>
      )}
      <div className="c4-row" role="group" aria-label={v4("taShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("taShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("taHidden")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("taTitle")}>
        <button type="button" className="c4-chip" data-on={!assignee && !blank ? "1" : "0"} aria-pressed={!assignee && !blank} onClick={() => { setSelected(""); setBlank(false); }}>{v4("taAll")}</button>
        {chips.map((item) => {
          const count = lines.find((line) => line.assignee === item)?.count || 0;
          return (
            <span key={item} className="c4-ta-pair" data-assignee={item}>
              <button type="button" className="c4-chip" data-on={assignee === item ? "1" : "0"} aria-pressed={assignee === item} onClick={() => { setBlank(false); setSelected(assignee === item ? "" : item); }}>{item} {count}</button>
              <button type="button" className="c4-btn" onClick={() => store(toggleAssignee(hiddenAssignees, item, present), showHidden ? "" : item)}>{showHidden ? v4("taShow") : v4("taHide")}</button>
            </span>
          );
        })}
      </div>
      <label className="c4-lab">
        <span>{v4("taSearch")}</span>
        <input className="c4-field" aria-label={v4("taSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c4-pay-empty">{v4("taEmpty")}</p>}
      <ul className="c4-ta-rows">
        {shown.map((row) => {
          const name = assigneeText(row.assignee);
          return (
            <li key={row.id} data-assignee={name || "blank"}>
              <p>{row.label || row.id}</p>
              <p className="c4-meta">{name || v4("taBlank")}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
