"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  GATE_KEY,
  MARQ_KEY,
  MARQ_VIEW_KEY,
  activeDomain,
  activeGate,
  activeHost,
  activeHour,
  activeOwner,
  activeRoom,
  activeTag,
  activeWeight,
  addMarq,
  addMarqView,
  bandCounts,
  bandOf,
  bulkMarqDone,
  bulkMarqPinned,
  bulkMarqRoom,
  clashMarqCount,
  domainArg,
  domainLines,
  domainOf,
  dropMarqView,
  editMarq,
  gateArg,
  gateLines,
  gateOf,
  gatesCsv,
  hostArg,
  hostLines,
  hostSpanOf,
  hourArg,
  leadingDomain,
  leadingGate,
  marqClashIds,
  marqCopy,
  marqCounts,
  marqGap,
  marqOwners,
  marqRooms,
  marqShare,
  marqTags,
  marqTimeline,
  marqWeights,
  marqsCsv,
  namedDomains,
  namedGates,
  namedHosts,
  nextMarq,
  ownerArg,
  ownerLoad,
  presentGates,
  reachOf,
  readHiddenGates,
  readMarqViews,
  readMarqs,
  resetMarqs,
  roomArg,
  roomOf,
  setMarqDone,
  setMarqHeld,
  setMarqPinned,
  stepMarqWeight,
  suggestRoom,
  tagArg,
  tgnShare,
  toggleGate,
  visibleGateCustomers,
  visibleGates,
  visibleMarqs,
  weightArg,
  weightOf,
  type GateMark,
  type GateRow,
  type HostSpan,
  type MarqCard,
  type MarqRoom,
  type MarqTray,
  type MarqView,
  type MarqWeight,
} from "@/lib/crmv4/round165";
import { useJson } from "./kit";
import { storedRole } from "./round5";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  email?: string | null;
  tradingEnabled?: boolean | null;
};

type GlanceRow = GateRow & { id: string };

const BANDS = ["brief", "half", "full"] as const;

function roomName(v4: V4, room: MarqRoom | string): string {
  if (room === "atelier") return v4("mrqRoomAtelier");
  if (room === "salon") return v4("mrqRoomSalon");
  if (room === "gallery") return v4("mrqRoomGallery");
  if (room === "vault") return v4("mrqRoomVault");
  return v4("mrqBlankRoom");
}

function weightName(v4: V4, weight: MarqWeight): string {
  if (weight === "light") return v4("mrqLight");
  if (weight === "firm") return v4("mrqFirm");
  if (weight === "heavy") return v4("mrqHeavy");
  return v4("mrqBlankWeight");
}

function bandName(v4: V4, name: string): string {
  if (name === "brief") return v4("mrqBrief");
  if (name === "half") return v4("mrqHalf");
  if (name === "full") return v4("mrqFull");
  if (name === "slim") return v4("mrqSlim");
  if (name === "wide") return v4("mrqWide");
  if (/^(?:1|2|4|8|16)$/.test(name)) return name;
  return v4("mrqBlankHour");
}

function gateName(v4: V4, name: string): string {
  if (name === "enabled") return v4("tgnEnabled");
  if (name === "locked") return v4("tgnLocked");
  return v4("tgnUnmarked");
}

function spanName(v4: V4, name: string): string {
  if (name === "short") return v4("tgnShort");
  if (name === "mid") return v4("tgnMid");
  if (name === "long") return v4("tgnLong");
  return v4("tgnUnmarked");
}

function auditName(v4: V4, audit: string): string {
  const key = {
    save: "mrqAuditSave",
    edit: "mrqAuditEdit",
    raise: "mrqAuditRaise",
    lower: "mrqAuditLower",
    pin: "mrqAuditPin",
    unpin: "mrqAuditUnpin",
    hold: "mrqAuditHold",
    release: "mrqAuditRelease",
    done: "mrqAuditDone",
    reopen: "mrqAuditReopen",
    room: "mrqAuditRoom",
  }[audit];
  return key ? v4(key as CrmV4CopyKey) : "";
}

function hourLabel(hour: number | null): string {
  return hour === null ? "—" : String(hour);
}

function gapLabel(v4: V4, hour: number | null, desk: string): string {
  const gap = marqGap(hour, desk);
  if (gap === null) return "";
  if (gap > 0) return `${v4("mrqPast")} ${gap}`;
  if (gap < 0) return `${v4("mrqAhead")} ${Math.abs(gap)}`;
  return v4("mrqDue");
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

function marks(weight: string): number {
  if (weight === "heavy") return 3;
  if (weight === "firm") return 2;
  if (weight === "light") return 1;
  return 0;
}

function sameCards(left: readonly MarqCard[], right: readonly MarqCard[]): boolean {
  return left.length === right.length && left.every((card, index) => card.id === right[index]?.id && card.text === right[index]?.text && card.audit === right[index]?.audit);
}

export function MarquetryTasks({ v4 }: { v4: V4 }) {
  const [cards, setCards] = useState<MarqCard[]>([]);
  const [views, setViews] = useState<MarqView[]>([]);
  const [text, setText] = useState("");
  const [owner, setOwner] = useState("");
  const [hour, setHour] = useState("");
  const [room, setRoom] = useState("");
  const [tag, setTag] = useState("");
  const [weight, setWeight] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<MarqTray>("open");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [roomFilter, setRoomFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [weightFilter, setWeightFilter] = useState("all");
  const [hourFilter, setHourFilter] = useState("all");
  const [heavyOnly, setHeavyOnly] = useState(false);
  const [lateOnly, setLateOnly] = useState(false);
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const [copied, setCopied] = useState("");
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [desk, setDesk] = useState("");
  const [moveRoom, setMoveRoom] = useState("atelier");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  useEffect(() => {
    const next = readMarqs(readJson(MARQ_KEY, []));
    const saved = readMarqViews(readJson(MARQ_VIEW_KEY, []));
    setCards(next);
    setViews(saved);
    writeJson(MARQ_KEY, next);
    writeJson(MARQ_VIEW_KEY, saved);
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
      if (event.key === "m" || event.key === "M") {
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
  const owners = marqOwners(cards);
  const rooms = marqRooms(cards);
  const tagsOn = marqTags(cards);
  const weights = marqWeights(cards);
  const bars = bandCounts(cards);
  const ownerOn = activeOwner(ownerFilter, owners);
  const roomOn = activeRoom(roomFilter, rooms);
  const tagOn = activeTag(tagFilter, tagsOn);
  const weightOn = activeWeight(weightFilter, weights);
  const hourOn = activeHour(hourFilter);
  const picked = hourArg(hourOn);
  const shown = visibleMarqs(
    cards,
    tray,
    query,
    ownerArg(ownerOn),
    roomArg(roomOn),
    tagArg(tagOn),
    weightArg(weightOn),
    picked.exact,
    picked.pick,
    heavyOnly,
    lateOnly,
    desk,
  );
  const timeline = marqTimeline(cards, query);
  const counts = marqCounts(cards, desk);
  const clashes = clashMarqCount(cards);
  const total = cards.length;
  const nextId = nextMarq(cards, desk);
  const nextCard = cards.find((card) => card.id === nextId);
  const widest = Math.max(1, ...bars);
  const pinned = cards.filter((card) => card.pinned);
  const load = ownerLoad(cards, owner);
  const suggested = suggestRoom(cards);

  function store(next: MarqCard[]) {
    setCards(next);
    writeJson(MARQ_KEY, next);
  }

  function storeViews(next: MarqView[]) {
    setViews(next);
    writeJson(MARQ_VIEW_KEY, next);
  }

  function clearDraft() {
    setText("");
    setOwner("");
    setHour("");
    setRoom("");
    setTag("");
    setWeight("");
  }

  function copyCard(card: MarqCard) {
    const body = marqCopy(card.text);
    if (!body) return;
    if (navigator.clipboard?.writeText) void navigator.clipboard.writeText(body);
    setCopied(card.id);
  }

  function applyView(view: MarqView) {
    setTray(view.tray);
    setQuery(view.query);
    setOwnerFilter(activeOwner(view.owner, marqOwners(cards)));
    setRoomFilter(activeRoom(view.room, marqRooms(cards)));
    setTagFilter(activeTag(view.tag, marqTags(cards)));
    setWeightFilter(activeWeight(view.weight, marqWeights(cards)));
    setHourFilter(activeHour(view.hour));
    setBoard("cards");
    setHeavyOnly(false);
    setLateOnly(false);
  }

  return (
    <section className="c4-mrq" aria-label={v4("mrqTitle")} data-marqs="1" data-role={role}>
      <header className="c4-mrq-head">
        <p className="c4-mrq-plate" data-logo="mono">{v4("mrqLogo")}</p>
        <div>
          <p className="c4-mrq-kicker">{v4("mrqSub")}</p>
          <h2 className="c4-title">{v4("mrqTitle")}</h2>
        </div>
        <p className="c4-mrq-count">{shown.length}</p>
      </header>
      <details className="c4-mrq-rules">
        <summary>{v4("mrqRules")}</summary>
        <p className="c4-meta">{v4("mrqHint")}</p>
        <p className="c4-meta">{v4("mrqLocal")}</p>
        <p className="c4-meta">{v4("mrqBlank")}</p>
        <p className="c4-meta">{v4("mrqOwnerBlank")}</p>
        <p className="c4-meta">{v4("mrqHourBlank")}</p>
        <p className="c4-meta">{v4("mrqRoomBlank")}</p>
        <p className="c4-meta">{v4("mrqTagBlank")}</p>
        <p className="c4-meta">{v4("mrqWeightBlank")}</p>
        <p className="c4-meta">{v4("mrqEscape")}</p>
        <p className="c4-meta">{v4("mrqSlash")}</p>
        <p className="c4-meta">{v4("mrqNew")}</p>
      </details>
      {viewer ? <p className="c4-mrq-notice" role="status">{v4("mrqViewer")}</p> : null}
      <p className="c4-mrq-notice" role="status">
        <span>{v4("mrqNotice")}</span>
        <span className="c4-mrq-count">{counts.late}</span>
        <button type="button" className="c4-btn" aria-pressed={lateOnly} onClick={() => { setLateOnly((value) => !value); setTray("open"); setBoard("cards"); }}>
          {lateOnly ? v4("mrqNoticeAll") : v4("mrqNoticeOpen")}
        </button>
      </p>
      <p className="c4-mrq-notice" role="status">
        <span>{v4("mrqClashNotice")}</span>
        <span className="c4-mrq-count">{clashes}</span>
      </p>
      <p className="c4-mrq-suggest" role="status">
        <span>{v4("mrqSuggest")}</span>
        <strong>{roomName(v4, suggested)}</strong>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => setRoom(suggested)}>{v4("mrqUseRoom")}</button>
      </p>
      {pinned.length > 0 && (
        <ul className="c4-mrq-pins" aria-label={v4("mrqPinned")}>
          {pinned.map((card) => (
            <li key={card.id}>
              <button type="button" className="c4-chip" onClick={() => { setQuery(card.text); setBoard("cards"); }}>{card.text}</button>
            </li>
          ))}
        </ul>
      )}
      <section className="c4-mrq-kpi" aria-label={v4("mrqKpi")}>
        {(["open", "held", "done", "pinned"] as const).map((key) => {
          const count = counts[key];
          const share = marqShare(count, total);
          const label = key === "open" ? v4("mrqOpen") : key === "held" ? v4("mrqHeld") : key === "done" ? v4("mrqFinished") : v4("mrqPinned");
          return (
            <p key={key} className="c4-mrq-meter" data-tray={key}>
              <span>{label}</span>
              <strong>{count}</strong>
              <span>{v4("mrqShare")} {share}%</span>
              <span className="c4-mrq-track" aria-hidden="true"><i style={{ width: `${share}%` }} /></span>
            </p>
          );
        })}
      </section>
      <section className="c4-mrq-chart" aria-label={v4("mrqChart")}>
        <p className="c4-mrq-kicker">{v4("mrqChart")}</p>
        {BANDS.map((name, index) => {
          const count = bars[index] || 0;
          const width = Math.max(8, Math.round((count / widest) * 100));
          return (
            <button key={name} type="button" className="c4-mrq-col" data-on={hourOn === name ? "1" : "0"} aria-pressed={hourOn === name} onClick={() => setHourFilter(hourOn === name ? "all" : name)}>
              <span>{bandName(v4, name)}</span>
              <span className="c4-mrq-bar" aria-hidden="true"><i style={{ width: `${width}%` }} /></span>
              <span>{count}</span>
            </button>
          );
        })}
      </section>
      <form className="c4-mrq-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addMarq(cards, { id: `mrq-${Date.now()}`, text, owner, hour, room, tag, weight });
        if (sameCards(next, cards)) return;
        store(next);
        clearDraft();
      }}>
        <label className="c4-lab">
          <span>{v4("mrqText")}</span>
          <input ref={textRef} className="c4-field" aria-label={v4("mrqText")} value={text} disabled={viewer} onChange={(event) => setText(event.target.value)} onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            clearDraft();
          }} />
        </label>
        <label className="c4-lab">
          <span>{v4("mrqOwner")}</span>
          <input className="c4-field" aria-label={v4("mrqOwner")} value={owner} disabled={viewer} onChange={(event) => setOwner(event.target.value)} />
        </label>
        <p className="c4-meta" role="status">{v4("mrqLoad")} {load}</p>
        <label className="c4-lab">
          <span>{v4("mrqHour")}</span>
          <input className="c4-field" inputMode="numeric" aria-label={v4("mrqHour")} value={hour} disabled={viewer} onChange={(event) => setHour(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("mrqRoom")}</span>
          <select className="c4-select" aria-label={v4("mrqRoom")} value={room} disabled={viewer} onChange={(event) => setRoom(event.target.value)}>
            <option value="">{v4("mrqBlankRoom")}</option>
            <option value="atelier">{v4("mrqRoomAtelier")}</option>
            <option value="salon">{v4("mrqRoomSalon")}</option>
            <option value="gallery">{v4("mrqRoomGallery")}</option>
            <option value="vault">{v4("mrqRoomVault")}</option>
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("mrqTag")}</span>
          <input className="c4-field" aria-label={v4("mrqTag")} value={tag} disabled={viewer} onChange={(event) => setTag(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("mrqWeight")}</span>
          <select className="c4-select" aria-label={v4("mrqWeight")} value={weight} disabled={viewer} onChange={(event) => setWeight(event.target.value)}>
            <option value="">{v4("mrqBlankWeight")}</option>
            <option value="light">{v4("mrqLight")}</option>
            <option value="firm">{v4("mrqFirm")}</option>
            <option value="heavy">{v4("mrqHeavy")}</option>
          </select>
        </label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("mrqAdd")}</button>
      </form>
      <div className="c4-row" role="group" aria-label={v4("mrqTitle")}>
        <button type="button" className="c4-chip" data-on={tray === "open" ? "1" : "0"} aria-pressed={tray === "open"} onClick={() => setTray("open")}>{v4("mrqOpen")}</button>
        <button type="button" className="c4-chip" data-on={tray === "held" ? "1" : "0"} aria-pressed={tray === "held"} onClick={() => setTray("held")}>{v4("mrqHeld")}</button>
        <button type="button" className="c4-chip" data-on={tray === "done" ? "1" : "0"} aria-pressed={tray === "done"} onClick={() => setTray("done")}>{v4("mrqFinished")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} aria-pressed={board === "timeline"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("mrqTimeline")}</button>
        <button type="button" className="c4-chip" data-on={heavyOnly ? "1" : "0"} aria-pressed={heavyOnly} onClick={() => setHeavyOnly((value) => !value)}>{v4("mrqHeavyOnly")}</button>
        <button type="button" className="c4-btn" onClick={() => download("marquetry-tasks.csv", marqsCsv(cards, desk))}>{v4("mrqCsv")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkMarqPinned(cards, shown.map((card) => card.id), true))}>{v4("mrqBulkPin")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkMarqDone(cards, shown.map((card) => card.id), true))}>{v4("mrqBulkDone")}</button>
        <label className="c4-lab">
          <span>{v4("mrqBulkRoom")}</span>
          <select className="c4-select" aria-label={v4("mrqBulkRoom")} value={moveRoom} disabled={viewer} onChange={(event) => setMoveRoom(event.target.value)}>
            <option value="atelier">{v4("mrqRoomAtelier")}</option>
            <option value="salon">{v4("mrqRoomSalon")}</option>
            <option value="gallery">{v4("mrqRoomGallery")}</option>
            <option value="vault">{v4("mrqRoomVault")}</option>
          </select>
        </label>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkMarqRoom(cards, shown.map((card) => card.id), moveRoom))}>{v4("mrqBulkRoom")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => { store(resetMarqs()); setEditing(""); }}>{v4("mrqReset")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("mrqHours")}>
        <button type="button" className="c4-chip" data-on={hourOn === "all" ? "1" : "0"} aria-pressed={hourOn === "all"} onClick={() => setHourFilter("all")}>{v4("mrqAllHours")}</button>
        <button type="button" className="c4-chip" data-on={hourOn === "blank" ? "1" : "0"} aria-pressed={hourOn === "blank"} onClick={() => setHourFilter("blank")}>{v4("mrqBlankHour")}</button>
        <button type="button" className="c4-chip" data-on={hourOn === "slim" ? "1" : "0"} aria-pressed={hourOn === "slim"} onClick={() => setHourFilter("slim")}>{v4("mrqSlim")}</button>
        <button type="button" className="c4-chip" data-on={hourOn === "wide" ? "1" : "0"} aria-pressed={hourOn === "wide"} onClick={() => setHourFilter("wide")}>{v4("mrqWide")}</button>
        {["1", "4", "16"].map((slot) => (
          <button key={slot} type="button" className="c4-chip" data-on={hourOn === slot ? "1" : "0"} aria-pressed={hourOn === slot} onClick={() => setHourFilter(hourOn === slot ? "all" : slot)}>{slot}</button>
        ))}
      </div>
      <label className="c4-lab">
        <span>{v4("mrqSearch")}</span>
        <input ref={searchRef} className="c4-field" aria-label={v4("mrqSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          setQuery("");
        }} />
      </label>
      <div className="c4-mrq-next">
        <label className="c4-lab">
          <span>{v4("mrqDesk")}</span>
          <input className="c4-field" inputMode="numeric" aria-label={v4("mrqDesk")} value={desk} onChange={(event) => setDesk(event.target.value)} />
        </label>
        <p className="c4-meta">
          <span>{v4("mrqNext")}</span>
          {" "}
          {nextCard ? nextCard.text : v4("mrqNextEmpty")}
        </p>
      </div>
      <div className="c4-row">
        <label className="c4-lab">
          <span>{v4("mrqOwners")}</span>
          <select className="c4-select" aria-label={v4("mrqOwners")} value={ownerOn} onChange={(event) => setOwnerFilter(event.target.value)}>
            <option value="all">{v4("mrqAllOwners")}</option>
            <option value="blank">{v4("mrqBlankOwner")}</option>
            {owners.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("mrqRooms")}</span>
          <select className="c4-select" aria-label={v4("mrqRooms")} value={roomOn} onChange={(event) => setRoomFilter(event.target.value)}>
            <option value="all">{v4("mrqAllRooms")}</option>
            <option value="blank">{v4("mrqBlankRoom")}</option>
            {rooms.map((item) => <option key={item} value={item}>{roomName(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("mrqTags")}</span>
          <select className="c4-select" aria-label={v4("mrqTags")} value={tagOn} onChange={(event) => setTagFilter(event.target.value)}>
            <option value="all">{v4("mrqAllTags")}</option>
            <option value="blank">{v4("mrqBlankTag")}</option>
            {tagsOn.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("mrqWeights")}</span>
          <select className="c4-select" aria-label={v4("mrqWeights")} value={weightOn} onChange={(event) => setWeightFilter(event.target.value)}>
            <option value="all">{v4("mrqAllWeights")}</option>
            <option value="blank">{v4("mrqBlankWeight")}</option>
            {weights.map((item) => <option key={item} value={item}>{weightName(v4, item)}</option>)}
          </select>
        </label>
      </div>
      <form className="c4-mrq-view" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addMarqView(views, {
          id: `view-${Date.now()}`,
          name: viewName,
          tray,
          query,
          owner: ownerOn,
          room: roomOn,
          tag: tagOn,
          weight: weightOn,
          hour: hourOn,
        });
        if (next.length === views.length) return;
        storeViews(next);
        setViewName("");
      }}>
        <label className="c4-lab">
          <span>{v4("mrqViewName")}</span>
          <input className="c4-field" aria-label={v4("mrqViewName")} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("mrqSaveView")}</button>
      </form>
      <section aria-label={v4("mrqViews")}>
        <p className="c4-mrq-kicker">{v4("mrqViews")}</p>
        {!views.length && <p className="c4-mrq-empty">{v4("mrqViewEmpty")}</p>}
        <ul className="c4-mrq-views">
          {views.map((view) => (
            <li key={view.id}>
              <button type="button" className="c4-btn" onClick={() => applyView(view)}>{view.name}</button>
              <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropMarqView(views, view.id))}>{v4("mrqDropView")}</button>
            </li>
          ))}
        </ul>
      </section>
      {board === "cards" && !shown.length && <p className="c4-mrq-empty">{v4("mrqEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-mrq-rows">
          {shown.map((card) => {
            const clashesOn = marqClashIds(cards, card.id);
            const gap = gapLabel(v4, card.hour, desk);
            const reach = reachOf(card.hour);
            const editingCard = editing === card.id;
            return (
              <li key={card.id} data-weight={card.weight || "blank"} data-room={card.room || "blank"} data-band={bandOf(card.hour)}>
                <span className="c4-mrq-mark" aria-hidden="true">{hourLabel(card.hour)}</span>
                <span className="c4-mrq-marks" aria-hidden="true">
                  {[0, 1, 2].map((index) => <i key={index} data-on={index < marks(card.weight) ? "1" : "0"} />)}
                </span>
                <div>
                  {editingCard ? (
                    <form className="c4-row" onSubmit={(event) => {
                      event.preventDefault();
                      if (viewer) return;
                      store(editMarq(cards, card.id, draft));
                      setEditing("");
                    }}>
                      <input className="c4-field" aria-label={v4("mrqEdit")} value={draft} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("mrqSaveEdit")}</button>
                    </form>
                  ) : <p>{card.text}</p>}
                  <p className="c4-meta">
                    {card.owner || v4("mrqBlankOwner")}
                    {" · "}
                    {hourLabel(card.hour)}
                    {" · "}
                    {roomName(v4, roomOf(card.room))}
                    {" · "}
                    {card.tag || v4("mrqBlankTag")}
                    {" · "}
                    {weightName(v4, weightOf(card.weight))}
                    {reach === "blank" ? "" : ` · ${reach === "slim" ? v4("mrqSlim") : v4("mrqWide")}`}
                    {gap ? ` · ${gap}` : ""}
                    {auditName(v4, card.audit) ? ` · ${v4("mrqAudit")} ${auditName(v4, card.audit)}` : ""}
                    {" · "}
                    {clashesOn.length ? `${v4("mrqClash")} ${clashesOn.length}` : v4("mrqClashNone")}
                  </p>
                </div>
                <div className="c4-row">
                  <button type="button" className="c4-btn" onClick={() => copyCard(card)}>{copied === card.id ? v4("mrqCopied") : v4("mrqCopy")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.text); }}>{v4("mrqEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(stepMarqWeight(cards, card.id, 1))}>{v4("mrqRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(stepMarqWeight(cards, card.id, -1))}>{v4("mrqLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.pinned} onClick={() => store(setMarqPinned(cards, card.id, !card.pinned))}>{card.pinned ? v4("mrqUnpin") : v4("mrqPin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.held} onClick={() => store(setMarqHeld(cards, card.id, !card.held))}>{card.held ? v4("mrqRelease") : v4("mrqHold")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.done} onClick={() => store(setMarqDone(cards, card.id, !card.done))}>{card.done ? v4("mrqReopen") : v4("mrqDone")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {board === "timeline" && (
        <ol className="c4-mrq-time">
          {timeline.map((card) => (
            <li key={card.id} data-band={bandOf(card.hour)}>
              <span className="c4-mrq-clock">{hourLabel(card.hour)}</span>
              <p>{card.text}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export function TradeGates({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [hiddenGates, setHiddenGates] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [domain, setDomain] = useState("all");
  const [span, setSpan] = useState("all");
  const [showHidden, setShowHidden] = useState(false);
  const [query, setQuery] = useState("");
  const rows = useMemo(() => (data.data?.users || []).map((row): GlanceRow | null => {
    const id = String(row.id || "").trim();
    if (!id) return null;
    return {
      id,
      label: String(row.name || "").trim(),
      email: row.email,
      gate: row.tradingEnabled,
    };
  }).filter((row): row is GlanceRow => Boolean(row)), [data.data?.users]);
  const gatesOn = gateLines(rows);
  const domains = domainLines(rows);
  const spans = hostLines(rows);
  const present = presentGates(rows);
  const presentKey = present.join("\n");
  const gateNames = namedGates(rows);
  const domainNames = namedDomains(rows);
  const spanNames = namedHosts(rows);
  const leadGate = leadingGate(rows);
  const leadDomain = leadingDomain(rows);
  const loading = data.loading && !data.data;
  const failed = Boolean(data.error);
  useEffect(() => {
    if (loading || failed) return;
    const next = readHiddenGates(readJson(GATE_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHiddenGates(next);
    writeJson(GATE_KEY, next);
  }, [loading, failed, presentKey]);
  const chips = visibleGates(present, hiddenGates, showHidden);
  const domainOn = activeDomain(domain, domainNames);
  const spanOn = activeHost(span, spanNames);
  const gateOn = selected ? activeGate(selected, gateNames) : "all";
  const shown = visibleGateCustomers(
    rows,
    selected ? gateArg(gateOn === "all" && selected === "blank" ? "blank" : gateOn) : null,
    domainArg(domainOn),
    hostArg(spanOn),
    query,
  );
  const widest = Math.max(1, ...gatesOn.map((line) => line.count));
  const lockedCount = gatesOn.find((line) => line.gate === "locked")?.count || 0;

  function store(next: string[], clear: string) {
    setHiddenGates(next);
    writeJson(GATE_KEY, next);
    if (clear && selected === clear) setSelected("");
  }

  return (
    <section className="c4-tgn" aria-label={v4("tgnTitle")} data-gates="1">
      <header className="c4-tgn-head">
        <div>
          <p className="c4-mrq-kicker">{v4("tgnSub")}</p>
          <h2 className="c4-title">{v4("tgnTitle")}</h2>
        </div>
        <p className="c4-mrq-count">{v4("tgnRows")} {rows.length}</p>
      </header>
      <details className="c4-mrq-rules">
        <summary>{v4("tgnRules")}</summary>
        <p className="c4-meta">{v4("tgnHint")}</p>
        <p className="c4-meta">{v4("tgnLocal")}</p>
        <p className="c4-meta">{v4("tgnEscape")}</p>
      </details>
      <p className="c4-mrq-notice" role="status">
        <span>{v4("tgnLockedNotice")}</span>
        <span className="c4-mrq-count">{lockedCount}</span>
      </p>
      {leadGate ? <p className="c4-tgn-lead"><span>{v4("tgnLeadGate")}</span> {gateName(v4, leadGate)}</p> : null}
      {leadDomain ? <p className="c4-tgn-lead"><span>{v4("tgnLeadDomain")}</span> {leadDomain}</p> : null}
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "customers")}>{v4("tgnBoard")}</Link>
        <button type="button" className="c4-btn" onClick={() => download("trade-gates.csv", gatesCsv(rows))}>{v4("tgnCsv")}</button>
      </p>
      {loading && !rows.length && <p className="c4-meta">{v4("tgnLoading")}</p>}
      {failed && !rows.length && <p className="c4-meta">{v4("tgnFailed")}</p>}
      {!loading && !failed && !rows.length && <p className="c4-mrq-empty">{v4("tgnNone")}</p>}
      {gatesOn.length > 0 && (
        <section className="c4-tgn-chart" aria-label={v4("tgnAllGates")}>
          {gatesOn.map((line) => {
            const share = tgnShare(line.count, rows.length);
            const width = Math.max(8, Math.round((line.count / widest) * 100));
            const name = line.gate || "blank";
            return (
              <p key={name} className="c4-tgn-col" data-gate={name}>
                <span>{gateName(v4, line.gate)}</span>
                <span className="c4-mrq-track" aria-hidden="true"><i style={{ width: `${width}%` }} /></span>
                <span>{line.count}</span>
                <span>{v4("tgnShare")} {share}%</span>
              </p>
            );
          })}
        </section>
      )}
      <div className="c4-row" role="group" aria-label={v4("tgnShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("tgnShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("tgnHidden")}</button>
      </div>
      <div className="c4-tgn-bands" role="group" aria-label={v4("tgnAllGates")}>
        <button type="button" className="c4-tgn-band" data-on={!selected ? "1" : "0"} aria-pressed={!selected} onClick={() => setSelected("")}>
          <span>{v4("tgnAllGates")}</span>
          <span className="c4-mrq-count">{rows.length}</span>
        </button>
        {chips.map((item) => {
          const count = rows.filter((row) => (gateOf(row.gate) || "blank") === item).length;
          const share = tgnShare(count, rows.length);
          return (
            <span key={item} className="c4-tgn-pair">
              <button type="button" className="c4-tgn-band" data-on={selected === item ? "1" : "0"} aria-pressed={selected === item} onClick={() => setSelected(selected === item ? "" : item)}>
                <span>{gateName(v4, item === "blank" ? "" : item)}</span>
                <span className="c4-mrq-count">{count}</span>
                <span>{v4("tgnShare")} {share}%</span>
              </button>
              <button type="button" className="c4-btn" onClick={() => store(toggleGate(hiddenGates, item, present), showHidden ? "" : item)}>{showHidden ? v4("tgnShow") : v4("tgnHide")}</button>
            </span>
          );
        })}
      </div>
      <div className="c4-row" role="group" aria-label={v4("tgnDomains")}>
        <button type="button" className="c4-chip" data-on={domainOn === "all" ? "1" : "0"} aria-pressed={domainOn === "all"} onClick={() => setDomain("all")}>{v4("tgnAllDomains")}</button>
        {domains.filter((line) => line.domain).map((line) => (
          <button key={line.domain} type="button" className="c4-chip" data-on={domainOn === line.domain ? "1" : "0"} aria-pressed={domainOn === line.domain} onClick={() => setDomain(domainOn === line.domain ? "all" : line.domain)}>
            {line.domain} {line.count}
          </button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("tgnSpans")}>
        <button type="button" className="c4-chip" data-on={spanOn === "all" ? "1" : "0"} aria-pressed={spanOn === "all"} onClick={() => setSpan("all")}>{v4("tgnAllSpans")}</button>
        {spans.filter((line) => line.span).map((line) => (
          <button key={line.span} type="button" className="c4-chip" data-on={spanOn === line.span ? "1" : "0"} aria-pressed={spanOn === line.span} onClick={() => setSpan(spanOn === line.span ? "all" : line.span)}>
            {spanName(v4, line.span)} {line.count}
          </button>
        ))}
      </div>
      <label className="c4-lab">
        <span>{v4("tgnSearch")}</span>
        <input className="c4-field" aria-label={v4("tgnSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          setQuery("");
        }} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c4-mrq-empty">{v4("tgnEmpty")}</p>}
      <ul className="c4-tgn-rows">
        {shown.map((row) => {
          const gate = gateOf(row.gate) as GateMark;
          const letter = domainOf(row.email);
          const length = hostSpanOf(row.email) as HostSpan;
          return (
            <li key={row.id} data-gate={gate || "blank"} data-domain={letter || "blank"} data-span={length || "blank"}>
              <span className="c4-tgn-face" aria-hidden="true">{letter || "—"}</span>
              <p>{row.label || row.id}</p>
              <p className="c4-meta">
                {gateName(v4, gate)}
                {" · "}
                {letter || v4("tgnUnmarked")}
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
