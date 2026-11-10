"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  FTD_KEY,
  GILT_KEY,
  GILT_VIEW_KEY,
  activeFtd,
  activeInitial,
  activeLane,
  activeMinute,
  activeOwner,
  activePace,
  activeSpan,
  activeTag,
  addGilt,
  addGiltView,
  bandCounts,
  bandOf,
  bulkGiltClosed,
  bulkGiltLane,
  bulkGiltPinned,
  clashGiltCount,
  dropGiltView,
  editGilt,
  fdmShare,
  ftdArg,
  ftdLines,
  ftdOf,
  ftdsCsv,
  giltClashIds,
  giltCopy,
  giltCounts,
  giltGap,
  giltLanes,
  giltOwners,
  giltPaces,
  giltShare,
  giltTags,
  giltTimeline,
  giltsCsv,
  halfOf,
  initialArg,
  initialLines,
  initialOf,
  laneArg,
  laneOf,
  leadingInitial,
  leadingMark,
  minuteArg,
  namedInitials,
  namedMarks,
  namedSpans,
  nextGilt,
  ownerArg,
  ownerLoad,
  paceArg,
  paceOf,
  presentMarks,
  readGiltViews,
  readGilts,
  readHiddenMarks,
  resetGilts,
  setGiltClosed,
  setGiltParked,
  setGiltPinned,
  spanArg,
  spanLines,
  spanOf,
  stepGiltPace,
  suggestLane,
  tagArg,
  toggleMark,
  visibleFtdCustomers,
  visibleGilts,
  visibleMarks,
  type FtdMark,
  type FtdRow,
  type GiltCard,
  type GiltLane,
  type GiltPace,
  type GiltTray,
  type GiltView,
  type NameSpan,
} from "@/lib/crmv4/round164";
import { useJson } from "./kit";
import { storedRole } from "./round5";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  ftd?: boolean | null;
};

type GlanceRow = FtdRow & { id: string };

const BANDS = ["dawn", "morn", "dusk"] as const;

function laneName(v4: V4, lane: GiltLane | string): string {
  if (lane === "north") return v4("gltLaneNorth");
  if (lane === "south") return v4("gltLaneSouth");
  if (lane === "east") return v4("gltLaneEast");
  if (lane === "west") return v4("gltLaneWest");
  return v4("gltBlankLane");
}

function paceName(v4: V4, pace: GiltPace): string {
  if (pace === "wait") return v4("gltWait");
  if (pace === "work") return v4("gltWork");
  if (pace === "rush") return v4("gltRush");
  return v4("gltBlankPace");
}

function bandName(v4: V4, name: string): string {
  if (name === "dawn") return v4("gltDawn");
  if (name === "morn") return v4("gltMorn");
  if (name === "dusk") return v4("gltDusk");
  if (name === "short") return v4("gltShort");
  if (name === "long") return v4("gltLong");
  if (/^(?:0|15|30|45|60)$/.test(name)) return name;
  return v4("gltBlankMinute");
}

function markName(v4: V4, name: string): string {
  if (name === "funded") return v4("fdmFunded");
  if (name === "open") return v4("fdmOpen");
  return v4("fdmUnmarked");
}

function spanName(v4: V4, name: string): string {
  if (name === "short") return v4("fdmShort");
  if (name === "mid") return v4("fdmMid");
  if (name === "long") return v4("fdmLong");
  return v4("fdmUnmarked");
}

function auditName(v4: V4, audit: string): string {
  const key = {
    save: "gltAuditSave",
    edit: "gltAuditEdit",
    raise: "gltAuditRaise",
    lower: "gltAuditLower",
    pin: "gltAuditPin",
    unpin: "gltAuditUnpin",
    park: "gltAuditPark",
    release: "gltAuditRelease",
    close: "gltAuditClose",
    reopen: "gltAuditReopen",
    lane: "gltAuditLane",
  }[audit];
  return key ? v4(key as CrmV4CopyKey) : "";
}

function minuteLabel(minute: number | null): string {
  return minute === null ? "—" : String(minute);
}

function gapLabel(v4: V4, minute: number | null, desk: string): string {
  const gap = giltGap(minute, desk);
  if (gap === null) return "";
  if (gap > 0) return `${v4("gltPast")} ${gap}`;
  if (gap < 0) return `${v4("gltAhead")} ${Math.abs(gap)}`;
  return v4("gltDue");
}

function download(name: string, body: string) {
  const blob = new Blob([body], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

function typingTarget(event: KeyboardEvent): boolean {
  const tagName = (event.target as HTMLElement | null)?.tagName;
  return tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT";
}

function marks(pace: string): number {
  if (pace === "rush") return 3;
  if (pace === "work") return 2;
  if (pace === "wait") return 1;
  return 0;
}

function sameCards(left: readonly GiltCard[], right: readonly GiltCard[]): boolean {
  return left.length === right.length && left.every((card, index) => card.id === right[index]?.id && card.text === right[index]?.text && card.audit === right[index]?.audit);
}

export function GiltAssignments({ v4 }: { v4: V4 }) {
  const [cards, setCards] = useState<GiltCard[]>([]);
  const [views, setViews] = useState<GiltView[]>([]);
  const [text, setText] = useState("");
  const [owner, setOwner] = useState("");
  const [minute, setMinute] = useState("");
  const [lane, setLane] = useState("");
  const [tag, setTag] = useState("");
  const [pace, setPace] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<GiltTray>("queue");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [laneFilter, setLaneFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [paceFilter, setPaceFilter] = useState("all");
  const [minuteFilter, setMinuteFilter] = useState("all");
  const [rushOnly, setRushOnly] = useState(false);
  const [lateOnly, setLateOnly] = useState(false);
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const [copied, setCopied] = useState("");
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [desk, setDesk] = useState("");
  const [moveLane, setMoveLane] = useState("north");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  useEffect(() => {
    const next = readGilts(readJson(GILT_KEY, []));
    const saved = readGiltViews(readJson(GILT_VIEW_KEY, []));
    setCards(next);
    setViews(saved);
    writeJson(GILT_KEY, next);
    writeJson(GILT_VIEW_KEY, saved);
    setRole(storedRole());
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey || typingTarget(event)) return;
      if (event.key === "g" || event.key === "G") {
        event.preventDefault();
        textRef.current?.focus();
        return;
      }
      if (event.key !== "/") return;
      event.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const owners = giltOwners(cards);
  const lanes = giltLanes(cards);
  const tagsOn = giltTags(cards);
  const paces = giltPaces(cards);
  const bars = bandCounts(cards);
  const ownerOn = activeOwner(ownerFilter, owners);
  const laneOn = activeLane(laneFilter, lanes);
  const tagOn = activeTag(tagFilter, tagsOn);
  const paceOn = activePace(paceFilter, paces);
  const minuteOn = activeMinute(minuteFilter);
  const picked = minuteArg(minuteOn);
  const shown = visibleGilts(
    cards,
    tray,
    query,
    ownerArg(ownerOn),
    laneArg(laneOn),
    tagArg(tagOn),
    paceArg(paceOn),
    picked.exact,
    picked.pick,
    rushOnly,
    lateOnly,
    desk,
  );
  const timeline = giltTimeline(cards, query);
  const counts = giltCounts(cards, desk);
  const clashes = clashGiltCount(cards);
  const total = cards.length;
  const nextId = nextGilt(cards, desk);
  const nextCard = cards.find((card) => card.id === nextId);
  const widest = Math.max(1, ...bars);
  const pinned = cards.filter((card) => card.pinned);
  const load = ownerLoad(cards, owner);
  const suggested = suggestLane(cards);

  function store(next: GiltCard[]) {
    setCards(next);
    writeJson(GILT_KEY, next);
  }

  function storeViews(next: GiltView[]) {
    setViews(next);
    writeJson(GILT_VIEW_KEY, next);
  }

  function clearDraft() {
    setText("");
    setOwner("");
    setMinute("");
    setLane("");
    setTag("");
    setPace("");
  }

  function copyCard(card: GiltCard) {
    const body = giltCopy(card.text);
    if (!body) return;
    if (navigator.clipboard?.writeText) void navigator.clipboard.writeText(body);
    setCopied(card.id);
  }

  function applyView(view: GiltView) {
    setTray(view.tray);
    setQuery(view.query);
    setOwnerFilter(activeOwner(view.owner, giltOwners(cards)));
    setLaneFilter(activeLane(view.lane, giltLanes(cards)));
    setTagFilter(activeTag(view.tag, giltTags(cards)));
    setPaceFilter(activePace(view.pace, giltPaces(cards)));
    setMinuteFilter(activeMinute(view.minute));
    setBoard("cards");
    setRushOnly(false);
    setLateOnly(false);
  }

  return (
    <section className="c4-glt" aria-label={v4("gltTitle")} data-gilts="1" data-role={role}>
      <header className="c4-glt-head">
        <p className="c4-glt-plate" data-logo="mono">{v4("gltLogo")}</p>
        <div>
          <p className="c4-glt-kicker">{v4("gltSub")}</p>
          <h2 className="c4-title">{v4("gltTitle")}</h2>
        </div>
        <p className="c4-glt-count">{shown.length}</p>
      </header>
      <details className="c4-glt-rules">
        <summary>{v4("gltRules")}</summary>
        <p className="c4-meta">{v4("gltHint")}</p>
        <p className="c4-meta">{v4("gltLocal")}</p>
        <p className="c4-meta">{v4("gltBlank")}</p>
        <p className="c4-meta">{v4("gltOwnerBlank")}</p>
        <p className="c4-meta">{v4("gltMinuteBlank")}</p>
        <p className="c4-meta">{v4("gltLaneBlank")}</p>
        <p className="c4-meta">{v4("gltTagBlank")}</p>
        <p className="c4-meta">{v4("gltPaceBlank")}</p>
        <p className="c4-meta">{v4("gltEscape")}</p>
        <p className="c4-meta">{v4("gltSlash")}</p>
        <p className="c4-meta">{v4("gltNew")}</p>
      </details>
      {viewer ? <p className="c4-glt-notice" role="status">{v4("gltViewer")}</p> : null}
      <p className="c4-glt-notice" role="status">
        <span>{v4("gltNotice")}</span>
        <span className="c4-glt-count">{counts.late}</span>
        <button type="button" className="c4-btn" aria-pressed={lateOnly} onClick={() => { setLateOnly((value) => !value); setTray("queue"); setBoard("cards"); }}>
          {lateOnly ? v4("gltNoticeAll") : v4("gltNoticeOpen")}
        </button>
      </p>
      <p className="c4-glt-notice" role="status">
        <span>{v4("gltClashNotice")}</span>
        <span className="c4-glt-count">{clashes}</span>
      </p>
      <p className="c4-glt-suggest" role="status">
        <span>{v4("gltSuggest")}</span>
        <strong>{laneName(v4, suggested)}</strong>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => setLane(suggested)}>{v4("gltUseLane")}</button>
      </p>
      {pinned.length > 0 && (
        <ul className="c4-glt-pins" aria-label={v4("gltPinned")}>
          {pinned.map((card) => (
            <li key={card.id}>
              <button type="button" className="c4-chip" onClick={() => { setQuery(card.text); setBoard("cards"); }}>{card.text}</button>
            </li>
          ))}
        </ul>
      )}
      <section className="c4-glt-kpi" aria-label={v4("gltKpi")}>
        {(["queue", "parked", "closed", "pinned"] as const).map((key) => {
          const count = counts[key];
          const share = giltShare(count, total);
          const label = key === "queue" ? v4("gltQueue") : key === "parked" ? v4("gltParked") : key === "closed" ? v4("gltClosed") : v4("gltPinned");
          return (
            <p key={key} className="c4-glt-meter" data-tray={key}>
              <span>{label}</span>
              <strong>{count}</strong>
              <span>{v4("gltShare")} {share}%</span>
              <span className="c4-glt-track" aria-hidden="true"><i style={{ width: `${share}%` }} /></span>
            </p>
          );
        })}
      </section>
      <section className="c4-glt-chart" aria-label={v4("gltChart")}>
        <p className="c4-glt-kicker">{v4("gltChart")}</p>
        {BANDS.map((name, index) => {
          const count = bars[index] || 0;
          const width = Math.max(8, Math.round((count / widest) * 100));
          return (
            <button key={name} type="button" className="c4-glt-col" data-on={minuteOn === name ? "1" : "0"} aria-pressed={minuteOn === name} onClick={() => setMinuteFilter(minuteOn === name ? "all" : name)}>
              <span>{bandName(v4, name)}</span>
              <span className="c4-glt-bar" aria-hidden="true"><i style={{ width: `${width}%` }} /></span>
              <span>{count}</span>
            </button>
          );
        })}
      </section>
      <form className="c4-glt-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addGilt(cards, { id: `glt-${Date.now()}`, text, owner, minute, lane, tag, pace });
        if (sameCards(next, cards)) return;
        store(next);
        clearDraft();
      }}>
        <label className="c4-lab">
          <span>{v4("gltText")}</span>
          <input ref={textRef} className="c4-field" aria-label={v4("gltText")} value={text} disabled={viewer} onChange={(event) => setText(event.target.value)} onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            clearDraft();
          }} />
        </label>
        <label className="c4-lab">
          <span>{v4("gltOwner")}</span>
          <input className="c4-field" aria-label={v4("gltOwner")} value={owner} disabled={viewer} onChange={(event) => setOwner(event.target.value)} />
        </label>
        <p className="c4-meta" role="status">{v4("gltLoad")} {load}</p>
        <label className="c4-lab">
          <span>{v4("gltMinute")}</span>
          <input className="c4-field" inputMode="numeric" aria-label={v4("gltMinute")} value={minute} disabled={viewer} onChange={(event) => setMinute(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("gltLane")}</span>
          <select className="c4-select" aria-label={v4("gltLane")} value={lane} disabled={viewer} onChange={(event) => setLane(event.target.value)}>
            <option value="">{v4("gltBlankLane")}</option>
            <option value="north">{v4("gltLaneNorth")}</option>
            <option value="south">{v4("gltLaneSouth")}</option>
            <option value="east">{v4("gltLaneEast")}</option>
            <option value="west">{v4("gltLaneWest")}</option>
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("gltTag")}</span>
          <input className="c4-field" aria-label={v4("gltTag")} value={tag} disabled={viewer} onChange={(event) => setTag(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("gltPace")}</span>
          <select className="c4-select" aria-label={v4("gltPace")} value={pace} disabled={viewer} onChange={(event) => setPace(event.target.value)}>
            <option value="">{v4("gltBlankPace")}</option>
            <option value="wait">{v4("gltWait")}</option>
            <option value="work">{v4("gltWork")}</option>
            <option value="rush">{v4("gltRush")}</option>
          </select>
        </label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("gltAdd")}</button>
      </form>
      <div className="c4-row" role="group" aria-label={v4("gltTitle")}>
        <button type="button" className="c4-chip" data-on={tray === "queue" ? "1" : "0"} aria-pressed={tray === "queue"} onClick={() => setTray("queue")}>{v4("gltQueue")}</button>
        <button type="button" className="c4-chip" data-on={tray === "parked" ? "1" : "0"} aria-pressed={tray === "parked"} onClick={() => setTray("parked")}>{v4("gltParked")}</button>
        <button type="button" className="c4-chip" data-on={tray === "closed" ? "1" : "0"} aria-pressed={tray === "closed"} onClick={() => setTray("closed")}>{v4("gltClosed")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} aria-pressed={board === "timeline"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("gltTimeline")}</button>
        <button type="button" className="c4-chip" data-on={rushOnly ? "1" : "0"} aria-pressed={rushOnly} onClick={() => setRushOnly((value) => !value)}>{v4("gltRushOnly")}</button>
        <button type="button" className="c4-btn" onClick={() => download("gilt-assignments.csv", giltsCsv(cards, desk))}>{v4("gltCsv")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkGiltPinned(cards, shown.map((card) => card.id), true))}>{v4("gltBulkPin")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkGiltClosed(cards, shown.map((card) => card.id), true))}>{v4("gltBulkClose")}</button>
        <label className="c4-lab">
          <span>{v4("gltBulkLane")}</span>
          <select className="c4-select" aria-label={v4("gltBulkLane")} value={moveLane} disabled={viewer} onChange={(event) => setMoveLane(event.target.value)}>
            <option value="north">{v4("gltLaneNorth")}</option>
            <option value="south">{v4("gltLaneSouth")}</option>
            <option value="east">{v4("gltLaneEast")}</option>
            <option value="west">{v4("gltLaneWest")}</option>
          </select>
        </label>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkGiltLane(cards, shown.map((card) => card.id), moveLane))}>{v4("gltBulkLane")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => { store(resetGilts()); setEditing(""); }}>{v4("gltReset")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("gltMinutes")}>
        <button type="button" className="c4-chip" data-on={minuteOn === "all" ? "1" : "0"} aria-pressed={minuteOn === "all"} onClick={() => setMinuteFilter("all")}>{v4("gltAllMinutes")}</button>
        <button type="button" className="c4-chip" data-on={minuteOn === "blank" ? "1" : "0"} aria-pressed={minuteOn === "blank"} onClick={() => setMinuteFilter("blank")}>{v4("gltBlankMinute")}</button>
        <button type="button" className="c4-chip" data-on={minuteOn === "short" ? "1" : "0"} aria-pressed={minuteOn === "short"} onClick={() => setMinuteFilter("short")}>{v4("gltShort")}</button>
        <button type="button" className="c4-chip" data-on={minuteOn === "long" ? "1" : "0"} aria-pressed={minuteOn === "long"} onClick={() => setMinuteFilter("long")}>{v4("gltLong")}</button>
        {["0", "30", "60"].map((slot) => (
          <button key={slot} type="button" className="c4-chip" data-on={minuteOn === slot ? "1" : "0"} aria-pressed={minuteOn === slot} onClick={() => setMinuteFilter(minuteOn === slot ? "all" : slot)}>{slot}</button>
        ))}
      </div>
      <label className="c4-lab">
        <span>{v4("gltSearch")}</span>
        <input ref={searchRef} className="c4-field" aria-label={v4("gltSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          setQuery("");
        }} />
      </label>
      <div className="c4-glt-next">
        <label className="c4-lab">
          <span>{v4("gltDesk")}</span>
          <input className="c4-field" inputMode="numeric" aria-label={v4("gltDesk")} value={desk} onChange={(event) => setDesk(event.target.value)} />
        </label>
        <p className="c4-meta">
          <span>{v4("gltNext")}</span>
          {" "}
          {nextCard ? nextCard.text : v4("gltNextEmpty")}
        </p>
      </div>
      <div className="c4-row">
        <label className="c4-lab">
          <span>{v4("gltOwners")}</span>
          <select className="c4-select" aria-label={v4("gltOwners")} value={ownerOn} onChange={(event) => setOwnerFilter(event.target.value)}>
            <option value="all">{v4("gltAllOwners")}</option>
            <option value="blank">{v4("gltBlankOwner")}</option>
            {owners.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("gltLanes")}</span>
          <select className="c4-select" aria-label={v4("gltLanes")} value={laneOn} onChange={(event) => setLaneFilter(event.target.value)}>
            <option value="all">{v4("gltAllLanes")}</option>
            <option value="blank">{v4("gltBlankLane")}</option>
            {lanes.map((item) => <option key={item} value={item}>{laneName(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("gltTags")}</span>
          <select className="c4-select" aria-label={v4("gltTags")} value={tagOn} onChange={(event) => setTagFilter(event.target.value)}>
            <option value="all">{v4("gltAllTags")}</option>
            <option value="blank">{v4("gltBlankTag")}</option>
            {tagsOn.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("gltPaces")}</span>
          <select className="c4-select" aria-label={v4("gltPaces")} value={paceOn} onChange={(event) => setPaceFilter(event.target.value)}>
            <option value="all">{v4("gltAllPaces")}</option>
            <option value="blank">{v4("gltBlankPace")}</option>
            {paces.map((item) => <option key={item} value={item}>{paceName(v4, item)}</option>)}
          </select>
        </label>
      </div>
      <form className="c4-glt-view" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addGiltView(views, {
          id: `view-${Date.now()}`,
          name: viewName,
          tray,
          query,
          owner: ownerOn,
          lane: laneOn,
          tag: tagOn,
          pace: paceOn,
          minute: minuteOn,
        });
        if (next.length === views.length) return;
        storeViews(next);
        setViewName("");
      }}>
        <label className="c4-lab">
          <span>{v4("gltViewName")}</span>
          <input className="c4-field" aria-label={v4("gltViewName")} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("gltSaveView")}</button>
      </form>
      <section aria-label={v4("gltViews")}>
        <p className="c4-glt-kicker">{v4("gltViews")}</p>
        {!views.length && <p className="c4-glt-empty">{v4("gltViewEmpty")}</p>}
        <ul className="c4-glt-views">
          {views.map((view) => (
            <li key={view.id}>
              <button type="button" className="c4-btn" onClick={() => applyView(view)}>{view.name}</button>
              <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropGiltView(views, view.id))}>{v4("gltDropView")}</button>
            </li>
          ))}
        </ul>
      </section>
      {board === "cards" && !shown.length && <p className="c4-glt-empty">{v4("gltEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-glt-rows">
          {shown.map((card) => {
            const clashesOn = giltClashIds(cards, card.id);
            const gap = gapLabel(v4, card.minute, desk);
            const half = halfOf(card.minute);
            const editingCard = editing === card.id;
            return (
              <li key={card.id} data-pace={card.pace || "blank"} data-lane={card.lane || "blank"} data-band={bandOf(card.minute)}>
                <span className="c4-glt-mark" aria-hidden="true">{minuteLabel(card.minute)}</span>
                <span className="c4-glt-marks" aria-hidden="true">
                  {[0, 1, 2].map((index) => <i key={index} data-on={index < marks(card.pace) ? "1" : "0"} />)}
                </span>
                <div>
                  {editingCard ? (
                    <form className="c4-row" onSubmit={(event) => {
                      event.preventDefault();
                      if (viewer) return;
                      store(editGilt(cards, card.id, draft));
                      setEditing("");
                    }}>
                      <input className="c4-field" aria-label={v4("gltEdit")} value={draft} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("gltSaveEdit")}</button>
                    </form>
                  ) : <p>{card.text}</p>}
                  <p className="c4-meta">
                    {card.owner || v4("gltBlankOwner")}
                    {" · "}
                    {minuteLabel(card.minute)}
                    {" · "}
                    {laneName(v4, laneOf(card.lane))}
                    {" · "}
                    {card.tag || v4("gltBlankTag")}
                    {" · "}
                    {paceName(v4, paceOf(card.pace))}
                    {half === "blank" ? "" : ` · ${half === "short" ? v4("gltShort") : v4("gltLong")}`}
                    {gap ? ` · ${gap}` : ""}
                    {auditName(v4, card.audit) ? ` · ${v4("gltAudit")} ${auditName(v4, card.audit)}` : ""}
                    {" · "}
                    {clashesOn.length ? `${v4("gltClash")} ${clashesOn.length}` : v4("gltClashNone")}
                  </p>
                </div>
                <div className="c4-row">
                  <button type="button" className="c4-btn" onClick={() => copyCard(card)}>{copied === card.id ? v4("gltCopied") : v4("gltCopy")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.text); }}>{v4("gltEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(stepGiltPace(cards, card.id, 1))}>{v4("gltRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(stepGiltPace(cards, card.id, -1))}>{v4("gltLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.pinned} onClick={() => store(setGiltPinned(cards, card.id, !card.pinned))}>{card.pinned ? v4("gltUnpin") : v4("gltPin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.parked} onClick={() => store(setGiltParked(cards, card.id, !card.parked))}>{card.parked ? v4("gltRelease") : v4("gltPark")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.closed} onClick={() => store(setGiltClosed(cards, card.id, !card.closed))}>{card.closed ? v4("gltReopen") : v4("gltClose")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {board === "timeline" && (
        <ol className="c4-glt-time">
          {timeline.map((card) => (
            <li key={card.id} data-band={bandOf(card.minute)}>
              <span className="c4-glt-clock">{minuteLabel(card.minute)}</span>
              <p>{card.text}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export function FirstMarks({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [hiddenMarks, setHiddenMarks] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [initial, setInitial] = useState("all");
  const [span, setSpan] = useState("all");
  const [showHidden, setShowHidden] = useState(false);
  const [query, setQuery] = useState("");
  const rows = useMemo(() => (data.data?.users || []).map((row): GlanceRow | null => {
    const id = String(row.id || "").trim();
    if (!id) return null;
    return {
      id,
      label: String(row.name || "").trim(),
      ftd: row.ftd,
    };
  }).filter((row): row is GlanceRow => Boolean(row)), [data.data?.users]);
  const marksOn = ftdLines(rows);
  const initials = initialLines(rows);
  const spans = spanLines(rows);
  const present = presentMarks(rows);
  const presentKey = present.join("\n");
  const markNames = namedMarks(rows);
  const initialNames = namedInitials(rows);
  const spanNames = namedSpans(rows);
  const leadMark = leadingMark(rows);
  const leadInitial = leadingInitial(rows);
  const loading = data.loading && !data.data;
  const failed = Boolean(data.error);
  useEffect(() => {
    if (loading || failed) return;
    const next = readHiddenMarks(readJson(FTD_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHiddenMarks(next);
    writeJson(FTD_KEY, next);
  }, [loading, failed, presentKey]);
  const chips = visibleMarks(present, hiddenMarks, showHidden);
  const initialOn = activeInitial(initial, initialNames);
  const spanOn = activeSpan(span, spanNames);
  const markOn = selected ? activeFtd(selected, markNames) : "all";
  const shown = visibleFtdCustomers(
    rows,
    selected ? ftdArg(markOn === "all" && selected === "blank" ? "blank" : markOn) : null,
    initialArg(initialOn),
    spanArg(spanOn),
    query,
  );
  const widest = Math.max(1, ...marksOn.map((line) => line.count));
  const openCount = marksOn.find((line) => line.mark === "open")?.count || 0;

  function store(next: string[], clear: string) {
    setHiddenMarks(next);
    writeJson(FTD_KEY, next);
    if (clear && selected === clear) setSelected("");
  }

  return (
    <section className="c4-fdm" aria-label={v4("fdmTitle")} data-fdms="1">
      <header className="c4-fdm-head">
        <div>
          <p className="c4-glt-kicker">{v4("fdmSub")}</p>
          <h2 className="c4-title">{v4("fdmTitle")}</h2>
        </div>
        <p className="c4-glt-count">{v4("fdmRows")} {rows.length}</p>
      </header>
      <details className="c4-glt-rules">
        <summary>{v4("fdmRules")}</summary>
        <p className="c4-meta">{v4("fdmHint")}</p>
        <p className="c4-meta">{v4("fdmLocal")}</p>
        <p className="c4-meta">{v4("fdmEscape")}</p>
      </details>
      <p className="c4-glt-notice" role="status">
        <span>{v4("fdmOpenNotice")}</span>
        <span className="c4-glt-count">{openCount}</span>
      </p>
      {leadMark ? <p className="c4-fdm-lead"><span>{v4("fdmLeadMark")}</span> {markName(v4, leadMark)}</p> : null}
      {leadInitial ? <p className="c4-fdm-lead"><span>{v4("fdmLeadInitial")}</span> {leadInitial}</p> : null}
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "customers")}>{v4("fdmBoard")}</Link>
        <button type="button" className="c4-btn" onClick={() => download("first-marks.csv", ftdsCsv(rows))}>{v4("fdmCsv")}</button>
      </p>
      {loading && !rows.length && <p className="c4-meta">{v4("fdmLoading")}</p>}
      {failed && !rows.length && <p className="c4-meta">{v4("fdmFailed")}</p>}
      {!loading && !failed && !rows.length && <p className="c4-glt-empty">{v4("fdmNone")}</p>}
      {marksOn.length > 0 && (
        <section className="c4-fdm-chart" aria-label={v4("fdmAllMarks")}>
          {marksOn.map((line) => {
            const share = fdmShare(line.count, rows.length);
            const width = Math.max(8, Math.round((line.count / widest) * 100));
            const name = line.mark || "blank";
            return (
              <p key={name} className="c4-fdm-col" data-mark={name}>
                <span>{markName(v4, line.mark)}</span>
                <span className="c4-glt-track" aria-hidden="true"><i style={{ width: `${width}%` }} /></span>
                <span>{line.count}</span>
                <span>{v4("fdmShare")} {share}%</span>
              </p>
            );
          })}
        </section>
      )}
      <div className="c4-row" role="group" aria-label={v4("fdmShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("fdmShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("fdmHidden")}</button>
      </div>
      <div className="c4-fdm-bands" role="group" aria-label={v4("fdmAllMarks")}>
        <button type="button" className="c4-fdm-band" data-on={!selected ? "1" : "0"} aria-pressed={!selected} onClick={() => setSelected("")}>
          <span>{v4("fdmAllMarks")}</span>
          <span className="c4-glt-count">{rows.length}</span>
        </button>
        {chips.map((item) => {
          const count = rows.filter((row) => (ftdOf(row.ftd) || "blank") === item).length;
          const share = fdmShare(count, rows.length);
          return (
            <span key={item} className="c4-fdm-pair">
              <button type="button" className="c4-fdm-band" data-on={selected === item ? "1" : "0"} aria-pressed={selected === item} onClick={() => setSelected(selected === item ? "" : item)}>
                <span>{markName(v4, item === "blank" ? "" : item)}</span>
                <span className="c4-glt-count">{count}</span>
                <span>{v4("fdmShare")} {share}%</span>
              </button>
              <button type="button" className="c4-btn" onClick={() => store(toggleMark(hiddenMarks, item, present), showHidden ? "" : item)}>{showHidden ? v4("fdmShow") : v4("fdmHide")}</button>
            </span>
          );
        })}
      </div>
      <div className="c4-row" role="group" aria-label={v4("fdmInitials")}>
        <button type="button" className="c4-chip" data-on={initialOn === "all" ? "1" : "0"} aria-pressed={initialOn === "all"} onClick={() => setInitial("all")}>{v4("fdmAllInitials")}</button>
        {initials.filter((line) => line.initial).map((line) => (
          <button key={line.initial} type="button" className="c4-chip" data-on={initialOn === line.initial ? "1" : "0"} aria-pressed={initialOn === line.initial} onClick={() => setInitial(initialOn === line.initial ? "all" : line.initial)}>
            {line.initial} {line.count}
          </button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("fdmSpans")}>
        <button type="button" className="c4-chip" data-on={spanOn === "all" ? "1" : "0"} aria-pressed={spanOn === "all"} onClick={() => setSpan("all")}>{v4("fdmAllSpans")}</button>
        {spans.filter((line) => line.span).map((line) => (
          <button key={line.span} type="button" className="c4-chip" data-on={spanOn === line.span ? "1" : "0"} aria-pressed={spanOn === line.span} onClick={() => setSpan(spanOn === line.span ? "all" : line.span)}>
            {spanName(v4, line.span)} {line.count}
          </button>
        ))}
      </div>
      <label className="c4-lab">
        <span>{v4("fdmSearch")}</span>
        <input className="c4-field" aria-label={v4("fdmSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          setQuery("");
        }} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c4-glt-empty">{v4("fdmEmpty")}</p>}
      <ul className="c4-fdm-rows">
        {shown.map((row) => {
          const mark = ftdOf(row.ftd) as FtdMark;
          const letter = initialOf(row.label);
          const length = spanOf(row.label) as NameSpan;
          return (
            <li key={row.id} data-mark={mark || "blank"} data-initial={letter || "blank"} data-span={length || "blank"}>
              <span className="c4-fdm-face" aria-hidden="true">{letter || "—"}</span>
              <p>{row.label || row.id}</p>
              <p className="c4-meta">
                {markName(v4, mark)}
                {" · "}
                {letter || v4("fdmUnmarked")}
                {" · "}
                {spanName(v4, length)}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
