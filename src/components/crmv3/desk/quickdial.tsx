"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readJson, writeJson } from "@/lib/crmv3/bridge";
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
} from "@/lib/crmv3/quickdial";
import { crmv3Href } from "@/lib/crmv3/sections";
import { useV3 } from "./store";
import { useJson } from "../kit";


type Ticket = {
  id: string;
  customer?: string | null;
  assignee?: unknown;
  assigneeName?: string | null;
  owner?: unknown;
};

type GlanceRow = AssignRow & { id: string };

export function QuickDial() {
  const v3 = useV3();
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
    <section className="c3-quick-dial" aria-label={v3("qdTitle")} data-quick-dial="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-qd-logo" data-logo="mono">{v3("qdLogo")}</p>
          <p className="c3-pay-kicker">{v3("qdSub")}</p>
          <h2 className="c3-title">{v3("qdTitle")}</h2>
        </div>
        <p className="c3-meta">{shown.length}</p>
      </header>
      <p className="c3-meta">{v3("qdHint")}</p>
      <p className="c3-meta">{v3("qdLocal")}</p>
      <p className="c3-meta">{v3("qdBlank")}</p>
      <p className="c3-meta">{v3("qdPhoneBlank")}</p>
      <form className="c3-row" onSubmit={(event) => {
        event.preventDefault();
        const next = addDial(dials, { id: `qd-${dials.length}-${label.trim().slice(0, 8) || "dial"}`, label, phone });
        if (next.length === dials.length) return;
        store(next);
        setLabel("");
        setPhone("");
      }}>
        <label className="c3-lab">
          <span>{v3("qdLabel")}</span>
          <input className="c3-field" aria-label={v3("qdLabel")} value={label} maxLength={80} onChange={(event) => setLabel(event.target.value)} />
        </label>
        <label className="c3-lab">
          <span>{v3("qdPhone")}</span>
          <input className="c3-field" aria-label={v3("qdPhone")} value={phone} maxLength={40} onChange={(event) => setPhone(event.target.value)} />
        </label>
        <button type="submit" className="c3-btn">{v3("qdAdd")}</button>
        <button type="button" className="c3-btn" onClick={() => store(resetDials())}>{v3("qdReset")}</button>
      </form>
      <label className="c3-lab">
        <span>{v3("qdSearch")}</span>
        <input className="c3-field" aria-label={v3("qdSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="c3-row" role="group" aria-label={v3("qdTitle")}>
        <button type="button" className="c3-chip" data-on={hidden ? "0" : "1"} aria-pressed={!hidden} onClick={() => setHidden(false)}>{v3("qdOpen")}</button>
        <button type="button" className="c3-chip" data-on={hidden ? "1" : "0"} aria-pressed={hidden} onClick={() => setHidden(true)}>{v3("qdHidden")}</button>
      </div>
      {!shown.length && <p className="c3-pay-empty">{v3("qdEmpty")}</p>}
      <ul className="c3-qd-rows">
        {shown.map((dial) => (
          <li key={dial.id} data-pinned={dial.pinned ? "1" : "0"}>
            <p>{dial.label}</p>
            {dial.phone ? <p className="c3-meta">{dial.phone}</p> : null}
            <div className="c3-row">
              <button type="button" className="c3-btn" onClick={() => store(toggleDialPin(dials, dial.id))}>{dial.pinned ? v3("qdUnpin") : v3("qdPin")}</button>
              <button type="button" className="c3-btn" onClick={() => store(setDialHidden(dials, dial.id, !dial.hidden))}>{dial.hidden ? v3("qdShow") : v3("qdHide")}</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function TicketAssignees({ base }: { base: string }) {
  const v3 = useV3();
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
    <section className="c3-ticket-assign" aria-label={v3("taTitle")} data-ticket-assign="1">
      <header className="c3-pay-head">
        <div>
          <p className="c3-pay-kicker">{v3("taSub")}</p>
          <h2 className="c3-title">{v3("taTitle")}</h2>
        </div>
        <p className="c3-meta">{chips.length}</p>
      </header>
      <p className="c3-meta">{v3("taHint")}</p>
      <p className="c3-meta">{v3("taLocal")}</p>
      <p className="c3-row">
        <Link className="c3-btn" href={crmv3Href(base, "support")}>{v3("taBoard")}</Link>
      </p>
      {loading && !rows.length && <p className="c3-meta">{v3("taLoading")}</p>}
      {failed && !rows.length && <p className="c3-meta">{v3("taFailed")}</p>}
      {!loading && !failed && !rows.length && <p className="c3-pay-empty">{v3("taNone")}</p>}
      {blankCount > 0 && (
        <button type="button" className="c3-ta-blank" data-on={blank ? "1" : "0"} aria-pressed={blank} onClick={() => { setBlank((value) => !value); setSelected(""); }}>
          <span>{v3("taBlank")}</span>
          <span className="c3-meta">{blankCount}</span>
        </button>
      )}
      <div className="c3-row" role="group" aria-label={v3("taShown")}>
        <button type="button" className="c3-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v3("taShown")}</button>
        <button type="button" className="c3-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v3("taHidden")}</button>
      </div>
      <div className="c3-row" role="group" aria-label={v3("taTitle")}>
        <button type="button" className="c3-chip" data-on={!assignee && !blank ? "1" : "0"} aria-pressed={!assignee && !blank} onClick={() => { setSelected(""); setBlank(false); }}>{v3("taAll")}</button>
        {chips.map((item) => {
          const count = lines.find((line) => line.assignee === item)?.count || 0;
          return (
            <span key={item} className="c3-ta-pair" data-assignee={item}>
              <button type="button" className="c3-chip" data-on={assignee === item ? "1" : "0"} aria-pressed={assignee === item} onClick={() => { setBlank(false); setSelected(assignee === item ? "" : item); }}>{item} {count}</button>
              <button type="button" className="c3-btn" onClick={() => store(toggleAssignee(hiddenAssignees, item, present), showHidden ? "" : item)}>{showHidden ? v3("taShow") : v3("taHide")}</button>
            </span>
          );
        })}
      </div>
      <label className="c3-lab">
        <span>{v3("taSearch")}</span>
        <input className="c3-field" aria-label={v3("taSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c3-pay-empty">{v3("taEmpty")}</p>}
      <ul className="c3-ta-rows">
        {shown.map((row) => {
          const name = assigneeText(row.assignee);
          return (
            <li key={row.id} data-assignee={name || "blank"}>
              <p>{row.label || row.id}</p>
              <p className="c3-meta">{name || v3("taBlank")}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
