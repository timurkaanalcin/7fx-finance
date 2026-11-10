"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  MARK_KEY,
  MARK_REVIEW_KEY,
  SIT_DENSITY_KEY,
  SIT_KEY,
  SIT_VIEW_KEY,
  activeCityBand,
  activeCityTone,
  activeCloth,
  activeHost,
  activeMinute,
  activeRank,
  activeRoom,
  activeSpan,
  activeStance,
  addSitting,
  addSittingTag,
  addSittingView,
  bulkCityReview,
  bulkSittingClose,
  bulkSittingCloth,
  bulkSittingPin,
  bulkSittingTag,
  busiestHost,
  catalogCity,
  catalogCityCount,
  citiesCsv,
  cityBand,
  cityBandArg,
  cityBands,
  cityCopy,
  cityRowsCsv,
  cityShare,
  cityState,
  cityTone,
  cityToneArg,
  clashMinuteCount,
  clothArg,
  clothCounts,
  cycleStance,
  densityOf,
  dropSittingView,
  editSitting,
  editSittingNote,
  fairHost,
  hostArg,
  houseRoom,
  lateSitting,
  leadingCity,
  leadingCityTone,
  minuteArg,
  minuteGap,
  moveFocus,
  nextSitting,
  openCityCount,
  presentCities,
  rankArg,
  rankClashCount,
  readHiddenCities,
  readReviewedCities,
  readSittingViews,
  readSittings,
  reminderSittings,
  resetSittings,
  setSittingClose,
  setSittingHold,
  setSittingPause,
  setSittingPin,
  sharedCityCount,
  sittingCopy,
  sittingCounts,
  sittingHosts,
  sittingRooms,
  sittingShare,
  sittingTimeline,
  sittingsCsv,
  soonSitting,
  sortMode,
  sortSittings,
  spanArg,
  stanceArg,
  suggestCloth,
  suggestHost,
  suggestSpan,
  roomArg,
  toggleCity,
  toggleCityReview,
  usedMinutes,
  visibleCityBands,
  visibleCityCustomers,
  visibleSittings,
  wideCityCount,
  type CityRow,
  type CityShape,
  type SitCloth,
  type SitDensity,
  type SitSort,
  type SitStance,
  type SitTray,
  type SitView,
  type Sitting,
} from "@/lib/crmv4/round193";
import { useJson } from "./kit";
import { storedRole } from "./round5";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  city?: string | null;
};

type GlanceRow = CityRow & { id: string };

const CLOTHS = ["linen", "wool", "silk", "velvet"] as const;
const BANDS = ["lane", "town", "metro"] as const;

function clothName(v4: V4, cloth: SitCloth | string): string {
  if (cloth === "linen") return v4("stbLinen");
  if (cloth === "wool") return v4("stbWool");
  if (cloth === "silk") return v4("stbSilk");
  if (cloth === "velvet") return v4("stbVelvet");
  return v4("stbBlankCloth");
}

function stanceName(v4: V4, stance: SitStance | string): string {
  if (stance === "wait") return v4("stbWait");
  if (stance === "seat") return v4("stbSeat");
  if (stance === "done") return v4("stbDone");
  return v4("stbBlankStance");
}

function rankName(v4: V4, rank: number | null): string {
  if (rank === 2) return v4("stbRank2");
  if (rank === 4) return v4("stbRank4");
  if (rank === 8) return v4("stbRank8");
  return v4("stbBlankRank");
}

function spanName(v4: V4, span: number | null): string {
  if (span === 15) return v4("stbSpan15");
  if (span === 30) return v4("stbSpan30");
  if (span === 60) return v4("stbSpan60");
  return v4("stbBlankSpan");
}

function bandName(v4: V4, name: string): string {
  if (name === "lane") return v4("cmkLane");
  if (name === "town") return v4("cmkTown");
  if (name === "metro") return v4("cmkMetro");
  if (name === "blank") return v4("cmkClear");
  return v4("cmkUnmarked");
}

function toneName(v4: V4, name: string): string {
  if (name === "open") return v4("cmkOpenTone");
  if (name === "shut") return v4("cmkShut");
  return v4("cmkUnmarked");
}

function auditName(v4: V4, audit: string): string {
  const key = {
    save: "stbAuditSave",
    edit: "stbAuditEdit",
    stance: "stbAuditStance",
    pin: "stbAuditPin",
    unpin: "stbAuditUnpin",
    hold: "stbAuditHold",
    lift: "stbAuditLift",
    close: "stbAuditClose",
    reopen: "stbAuditReopen",
    cloth: "stbAuditCloth",
    tag: "stbAuditTag",
    pause: "stbAuditPause",
  }[audit];
  return key ? v4(key as CrmV4CopyKey) : "";
}

function gapLabel(v4: V4, minute: number | null, desk: string): string {
  const gap = minuteGap(minute, desk);
  if (gap === null) return "";
  if (gap > 0) return `${v4("stbPast")} ${gap}`;
  if (gap < 0) return `${v4("stbAhead")} ${Math.abs(gap)}`;
  return v4("stbDue");
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

export function SittingBook({ v4 }: { v4: V4 }) {
  const [cards, setCards] = useState<Sitting[]>([]);
  const [views, setViews] = useState<SitView[]>([]);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [host, setHost] = useState("");
  const [minute, setMinute] = useState("");
  const [cloth, setCloth] = useState("");
  const [room, setRoom] = useState("");
  const [stance, setStance] = useState("");
  const [rank, setRank] = useState("");
  const [spanValue, setSpanValue] = useState("");
  const [tag, setTag] = useState("");
  const [roster, setRoster] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<SitTray>("open");
  const [hostFilter, setHostFilter] = useState("all");
  const [clothFilter, setClothFilter] = useState("all");
  const [roomFilter, setRoomFilter] = useState("all");
  const [stanceFilter, setStanceFilter] = useState("all");
  const [minuteFilter, setMinuteFilter] = useState("all");
  const [rankFilter, setRankFilter] = useState("all");
  const [spanFilter, setSpanFilter] = useState("all");
  const [waitOnly, setWaitOnly] = useState(false);
  const [peakOnly, setPeakOnly] = useState(false);
  const [quietOnly, setQuietOnly] = useState(false);
  const [houseOnly, setHouseOnly] = useState(false);
  const [awakeOnly, setAwakeOnly] = useState(false);
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const [order, setOrder] = useState<SitSort>("minute");
  const [density, setDensity] = useState<SitDensity>("roomy");
  const [copied, setCopied] = useState("");
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [desk, setDesk] = useState("");
  const [moveCloth, setMoveCloth] = useState("velvet");
  const [picked, setPicked] = useState<string[]>([]);
  const [focus, setFocus] = useState(0);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  useEffect(() => {
    const next = readSittings(readJson(SIT_KEY, []));
    const saved = readSittingViews(readJson(SIT_VIEW_KEY, []));
    setCards(next);
    setViews(saved);
    setDensity(densityOf(readJson(SIT_DENSITY_KEY, "roomy")));
    writeJson(SIT_KEY, next);
    writeJson(SIT_VIEW_KEY, saved);
    setRole(storedRole());
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);
  function store(next: Sitting[]) {
    const saved = readSittings(next);
    setCards(saved);
    writeJson(SIT_KEY, saved);
    setPicked((ids) => ids.filter((id) => saved.some((card) => card.id === id)));
  }
  function storeViews(next: SitView[]) {
    const saved = readSittingViews(next);
    setViews(saved);
    writeJson(SIT_VIEW_KEY, saved);
  }
  function storeDensity(next: SitDensity) {
    setDensity(next);
    writeJson(SIT_DENSITY_KEY, next);
  }
  const hosts = sittingHosts(cards);
  const rooms = sittingRooms(cards);
  const bars = clothCounts(cards);
  const hostOn = activeHost(hostFilter, hosts);
  const clothOn = activeCloth(clothFilter, CLOTHS);
  const roomOn = activeRoom(roomFilter, rooms);
  const stanceOn = activeStance(stanceFilter, ["wait", "seat", "done"]);
  const minuteOn = activeMinute(minuteFilter);
  const rankOn = activeRank(rankFilter);
  const spanOn = activeSpan(spanFilter);
  const pickedMinute = minuteArg(minuteOn);
  const shown = sortSittings(visibleSittings(
    cards,
    tray,
    query,
    hostArg(hostOn),
    clothArg(clothOn),
    roomArg(roomOn),
    stanceArg(stanceOn),
    pickedMinute.exact,
    pickedMinute.pick,
    rankArg(rankOn),
    spanArg(spanOn),
    waitOnly,
    peakOnly,
    houseOnly,
    quietOnly,
    awakeOnly,
  ), order);
  const timeline = sittingTimeline(cards, query);
  const counts = sittingCounts(cards, desk);
  const clashes = clashMinuteCount(cards);
  const ranks = rankClashCount(cards);
  const nextId = nextSitting(cards, desk);
  const nextCard = cards.find((card) => card.id === nextId);
  const suggestedCloth = suggestCloth(cards);
  const suggestedHost = suggestHost(cards);
  const suggestedSpan = suggestSpan(cards);
  const fair = fairHost(cards, roster);
  const busy = busiestHost(cards);
  const reminders = reminderSittings(cards, desk);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const focusAt = shown.length ? moveFocus(focus, shown.length, 0) : 0;
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey || typingTarget(event)) return;
      if (event.key === "n" || event.key === "N") {
        event.preventDefault();
        titleRef.current?.focus();
        return;
      }
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocus((index) => moveFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => moveFocus(index, shown.length, -1));
        return;
      }
      if (event.key !== "/") return;
      event.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shown.length]);
  function clearDraft() {
    setTitle("");
    setNote("");
    setHost("");
    setMinute("");
    setCloth("");
    setRoom("");
    setStance("");
    setRank("");
    setSpanValue("");
    setTag("");
    setQuery("");
    setEditing("");
  }
  return (
    <section className="c4-stb" aria-label={v4("stbTitle")} data-sittings="1" data-role={role} data-density={density}>
      <header className="c4-stb-mast">
        <div>
          <p className="c4-stb-kicker">{v4("stbSub")}</p>
          <h2 className="c4-title">{v4("stbTitle")}</h2>
        </div>
        <p className="c4-stb-plate" data-logo="mono">{v4("stbLogo")}</p>
      </header>
      <p className="c4-stb-rules">{v4("stbHint")}</p>
      <p className="c4-meta">{v4("stbLocal")}</p>
      <p className="c4-meta">{v4("stbNew")} {v4("stbSlash")} {v4("stbEscape")} {v4("stbKeys")}</p>
      {viewer && <p className="c4-stb-notice" data-viewer="1">{v4("stbViewer")}</p>}
      {counts.peak > 0 && (
        <p className="c4-stb-notice" role="status">
          {v4("stbNotice")} · {counts.peak}
          <button type="button" className="c4-btn" onClick={() => setPeakOnly((on) => !on)}>{peakOnly ? v4("stbNoticeAll") : v4("stbNoticePeak")}</button>
        </p>
      )}
      <dl className="c4-stb-kpi" aria-label={v4("stbKpi")}>
        <div><dt>{v4("stbOpen")}</dt><dd>{counts.open}</dd></div>
        <div><dt>{v4("stbHeld")}</dt><dd>{counts.held}</dd></div>
        <div><dt>{v4("stbClosed")}</dt><dd>{counts.closed}</dd></div>
        <div><dt>{v4("stbPinned")}</dt><dd>{counts.pinned}</dd></div>
        <div><dt>{v4("stbPeak")}</dt><dd>{counts.peak}</dd></div>
        <div><dt>{v4("stbLate")}</dt><dd>{counts.late}</dd></div>
        <div><dt>{v4("stbSoon")}</dt><dd>{counts.soon}</dd></div>
        <div><dt>{v4("stbPaused")}</dt><dd>{counts.paused}</dd></div>
        <div><dt>{v4("stbHouseShare")}</dt><dd>{sittingShare(counts.house, cards.length)}%</dd></div>
      </dl>
      <div className="c4-stb-chart" aria-label={v4("stbCloths")}>
        {bars.map((bar) => (
          <div key={bar.cloth} className="c4-stb-col">
            <div className="c4-stb-track" aria-hidden="true"><i style={{ height: `${Math.round((bar.count / maxBar) * 100)}%` }} /></div>
            <button type="button" className="c4-btn" onClick={() => setClothFilter(bar.cloth)}>{clothName(v4, bar.cloth)} · {bar.count}</button>
          </div>
        ))}
        {!bars.length && <p className="c4-empty-gold">{v4("stbEmpty")}</p>}
      </div>
      <p className="c4-meta">{v4("stbSuggestCloth")} · {clothName(v4, suggestedCloth)} · {v4("stbSuggestHost")} · {suggestedHost || v4("stbBlankHost")} · {v4("stbSuggestSpan")} · {spanName(v4, suggestedSpan)}</p>
      <p className="c4-meta">{v4("stbMinuteUse")} · {usedMinutes(cards)} · {clashes ? `${v4("stbClash")} · ${clashes}` : v4("stbClashNone")} · {ranks ? `${v4("stbRankClash")} · ${ranks}` : v4("stbRankClashNone")}</p>
      <p className="c4-meta">{nextCard ? `${v4("stbNext")} · ${nextCard.title}` : v4("stbNextNone")} · {busy ? `${v4("stbBusiest")} · ${busy}` : v4("stbBusiestNone")} · {reminders.length ? `${v4("stbReminders")} · ${reminders.length}` : v4("stbReminderNone")}</p>
      <form className="c4-stb-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        store(addSitting(cards, {
          id: `s${Date.now().toString(36)}`,
          title,
          note,
          host,
          minute,
          cloth,
          room,
          stance,
          rank,
          span: spanValue,
          tags: tag,
        }));
        setTitle("");
        setNote("");
      }}>
        <label className="c4-lab"><span>{v4("stbLine")}</span>
          <input ref={titleRef} className="c4-field" aria-label={v4("stbLine")} value={title} disabled={viewer} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("stbNote")}</span>
          <input className="c4-field" aria-label={v4("stbNote")} value={note} disabled={viewer} onChange={(event) => setNote(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("stbHost")}</span>
          <input className="c4-field" aria-label={v4("stbHost")} value={host} disabled={viewer} onChange={(event) => setHost(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("stbMinute")}</span>
          <input className="c4-field" aria-label={v4("stbMinute")} value={minute} disabled={viewer} onChange={(event) => setMinute(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("stbCloth")}</span>
          <select className="c4-field" aria-label={v4("stbCloth")} value={cloth} disabled={viewer} onChange={(event) => setCloth(event.target.value)}>
            <option value="">{v4("stbBlankCloth")}</option>
            {CLOTHS.map((item) => <option key={item} value={item}>{clothName(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("stbRoom")}</span>
          <input className="c4-field" aria-label={v4("stbRoom")} value={room} disabled={viewer} onChange={(event) => setRoom(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("stbStance")}</span>
          <select className="c4-field" aria-label={v4("stbStance")} value={stance} disabled={viewer} onChange={(event) => setStance(event.target.value)}>
            <option value="">{v4("stbBlankStance")}</option>
            <option value="wait">{v4("stbWait")}</option>
            <option value="seat">{v4("stbSeat")}</option>
            <option value="done">{v4("stbDone")}</option>
          </select>
        </label>
        <label className="c4-lab"><span>{v4("stbRank")}</span>
          <input className="c4-field" aria-label={v4("stbRank")} value={rank} disabled={viewer} onChange={(event) => setRank(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("stbSpan")}</span>
          <input className="c4-field" aria-label={v4("stbSpan")} value={spanValue} disabled={viewer} onChange={(event) => setSpanValue(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("stbTag")}</span>
          <input className="c4-field" aria-label={v4("stbTag")} value={tag} disabled={viewer} onChange={(event) => setTag(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("stbRoster")}</span>
          <input className="c4-field" aria-label={v4("stbRoster")} value={roster} disabled={viewer} onChange={(event) => setRoster(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("stbAdd")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => setCloth(suggestedCloth)}>{v4("stbUseCloth")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !suggestedHost} onClick={() => setHost(suggestedHost)}>{v4("stbUseHost")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => setSpanValue(String(suggestedSpan))}>{v4("stbUseSpan")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !fair} onClick={() => setHost(fair)}>{v4("stbAssign")}</button>
      </form>
      <p className="c4-meta">{v4("stbBlank")} {v4("stbMinuteBlank")}</p>
      <div className="c4-stb-filters">
        <label className="c4-lab"><span>{v4("stbSearch")}</span>
          <input ref={searchRef} className="c4-field" aria-label={v4("stbSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            clearDraft();
          }} />
        </label>
        <label className="c4-lab"><span>{v4("stbMinute")}</span>
          <input className="c4-field" aria-label={v4("stbDeskMinute")} value={desk} onChange={(event) => setDesk(event.target.value)} />
        </label>
      </div>
      <div className="c4-row">
        {(["open", "held", "closed"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} aria-pressed={tray === item} onClick={() => setTray(item)}>
            {item === "open" ? v4("stbTrayOpen") : item === "held" ? v4("stbTrayHeld") : v4("stbTrayClosed")}
          </button>
        ))}
        <button type="button" className="c4-chip" data-on={waitOnly ? "1" : "0"} aria-pressed={waitOnly} onClick={() => setWaitOnly((on) => !on)}>{v4("stbWait")}</button>
        <button type="button" className="c4-chip" data-on={houseOnly ? "1" : "0"} aria-pressed={houseOnly} onClick={() => setHouseOnly((on) => !on)}>{v4("stbHouse")}</button>
        <button type="button" className="c4-chip" data-on={quietOnly ? "1" : "0"} aria-pressed={quietOnly} onClick={() => setQuietOnly((on) => !on)}>{v4("stbQuiet")}</button>
        <button type="button" className="c4-chip" data-on={awakeOnly ? "1" : "0"} aria-pressed={awakeOnly} onClick={() => setAwakeOnly((on) => !on)}>{v4("stbAwake")}</button>
        <button type="button" className="c4-chip" data-on={board === "cards" ? "1" : "0"} aria-pressed={board === "cards"} onClick={() => setBoard("cards")}>{v4("stbCards")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} aria-pressed={board === "timeline"} onClick={() => setBoard("timeline")}>{v4("stbTimeline")}</button>
        <button type="button" className="c4-chip" data-on={order === "minute" ? "1" : "0"} aria-pressed={order === "minute"} onClick={() => setOrder(sortMode(order === "minute" ? "title" : "minute"))}>{order === "minute" ? v4("stbSortMinute") : v4("stbSortTitle")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} aria-pressed={density === "tight"} onClick={() => storeDensity(densityOf(density === "tight" ? "roomy" : "tight"))}>{density === "tight" ? v4("stbTight") : v4("stbRoomy")}</button>
      </div>
      <div className="c4-stb-filters">
        <label className="c4-lab"><span>{v4("stbHost")}</span>
          <select className="c4-field" aria-label={v4("stbHost")} value={hostOn} onChange={(event) => setHostFilter(event.target.value)}>
            <option value="all">{v4("stbAll")}</option>
            <option value="blank">{v4("stbBlankHost")}</option>
            {hosts.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("stbCloth")}</span>
          <select className="c4-field" aria-label={v4("stbCloth")} value={clothOn} onChange={(event) => setClothFilter(event.target.value)}>
            <option value="all">{v4("stbAll")}</option>
            <option value="blank">{v4("stbBlankCloth")}</option>
            {CLOTHS.map((item) => <option key={item} value={item}>{clothName(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("stbRoom")}</span>
          <select className="c4-field" aria-label={v4("stbRoom")} value={roomOn} onChange={(event) => setRoomFilter(event.target.value)}>
            <option value="all">{v4("stbAll")}</option>
            <option value="blank">{v4("stbBlankRoom")}</option>
            {rooms.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("stbStance")}</span>
          <select className="c4-field" aria-label={v4("stbStance")} value={stanceOn} onChange={(event) => setStanceFilter(event.target.value)}>
            <option value="all">{v4("stbAll")}</option>
            <option value="blank">{v4("stbBlankStance")}</option>
            <option value="wait">{v4("stbWait")}</option>
            <option value="seat">{v4("stbSeat")}</option>
            <option value="done">{v4("stbDone")}</option>
          </select>
        </label>
        <label className="c4-lab"><span>{v4("stbMinute")}</span>
          <select className="c4-field" aria-label={v4("stbMinute")} value={minuteOn} onChange={(event) => setMinuteFilter(event.target.value)}>
            <option value="all">{v4("stbAll")}</option>
            <option value="blank">{v4("stbBlankMinute")}</option>
            <option value="dawn">{v4("stbDawn")}</option>
            <option value="day">{v4("stbDay")}</option>
            <option value="night">{v4("stbNight")}</option>
            <option value="peak">{v4("stbPeak")}</option>
            <option value="quiet">{v4("stbQuiet")}</option>
          </select>
        </label>
        <label className="c4-lab"><span>{v4("stbRank")}</span>
          <select className="c4-field" aria-label={v4("stbRank")} value={rankOn} onChange={(event) => setRankFilter(event.target.value)}>
            <option value="all">{v4("stbAll")}</option>
            <option value="blank">{v4("stbBlankRank")}</option>
            <option value="2">{v4("stbRank2")}</option>
            <option value="4">{v4("stbRank4")}</option>
            <option value="8">{v4("stbRank8")}</option>
          </select>
        </label>
        <label className="c4-lab"><span>{v4("stbSpan")}</span>
          <select className="c4-field" aria-label={v4("stbSpan")} value={spanOn} onChange={(event) => setSpanFilter(event.target.value)}>
            <option value="all">{v4("stbAll")}</option>
            <option value="blank">{v4("stbBlankSpan")}</option>
            <option value="15">{v4("stbSpan15")}</option>
            <option value="30">{v4("stbSpan30")}</option>
            <option value="60">{v4("stbSpan60")}</option>
          </select>
        </label>
      </div>
      <form className="c4-row" onSubmit={(event) => {
        event.preventDefault();
        if (viewer || !viewName.trim()) return;
        storeViews(addSittingView(views, {
          id: `v${Date.now().toString(36)}`,
          name: viewName,
          tray,
          query,
          host: hostOn,
          cloth: clothOn,
          room: roomOn,
          stance: stanceOn,
          minute: minuteOn,
          rank: rankOn,
          span: spanOn,
        }));
        setViewName("");
      }}>
        <label className="c4-lab"><span>{v4("stbViews")}</span>
          <input className="c4-field" aria-label={v4("stbViews")} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("stbSaveView")}</button>
      </form>
      {!!views.length && (
        <ul className="c4-stb-views">
          {views.map((view) => (
            <li key={view.id}>
              <button type="button" className="c4-btn" onClick={() => {
                setTray(view.tray);
                setQuery(view.query);
                setHostFilter(view.host);
                setClothFilter(view.cloth);
                setRoomFilter(view.room);
                setStanceFilter(view.stance);
                setMinuteFilter(view.minute);
                setRankFilter(view.rank);
                setSpanFilter(view.span);
              }}>{view.name}</button>
              <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropSittingView(views, view.id))}>{v4("stbDropView")}</button>
            </li>
          ))}
        </ul>
      )}
      <div className="c4-row">
        <button type="button" className="c4-btn" onClick={() => setPicked(shown.map((card) => card.id))}>{v4("stbPickAll")}</button>
        <button type="button" className="c4-btn" onClick={() => setPicked([])}>{v4("stbPickNone")}</button>
        <p className="c4-meta">{v4("stbPicked")} · {picked.length}</p>
        <label className="c4-lab"><span>{v4("stbBulkCloth")}</span>
          <select className="c4-field" aria-label={v4("stbBulkCloth")} value={moveCloth} disabled={viewer} onChange={(event) => setMoveCloth(event.target.value)}>
            {CLOTHS.map((item) => <option key={item} value={item}>{clothName(v4, item)}</option>)}
          </select>
        </label>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkSittingCloth(cards, picked, moveCloth))}>{v4("stbBulkCloth")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkSittingPin(cards, picked, true))}>{v4("stbBulkPin")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkSittingClose(cards, picked, true))}>{v4("stbBulkClose")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length || !tag} onClick={() => store(bulkSittingTag(cards, picked, tag))}>{v4("stbBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("sitting-book.csv", sittingsCsv(cards, desk))}>{v4("stbCsv")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(resetSittings())}>{v4("stbReset")}</button>
      </div>
      {board === "timeline" ? (
        <ol className="c4-stb-timeline">
          {timeline.map((card) => (
            <li key={card.id}>
              <strong>{card.minute}</strong> {card.title}
              <span className="c4-meta"> {gapLabel(v4, card.minute, desk)}</span>
            </li>
          ))}
          {!timeline.length && <li className="c4-empty-gold">{v4("stbEmpty")}</li>}
        </ol>
      ) : (
        <ul className="c4-stb-cards">
          {shown.map((card, index) => {
            const openEdit = editing === card.id;
            const gap = gapLabel(v4, card.minute, desk);
            const late = lateSitting(card, desk);
            const soon = soonSitting(card);
            return (
              <li key={card.id} data-late={late ? "1" : "0"} data-soon={soon ? "1" : "0"} data-house={houseRoom(card.room) ? "1" : "0"} data-cloth={card.cloth || "blank"} data-focus={index === focusAt ? "1" : "0"} tabIndex={index === focusAt ? 0 : -1}>
                <label className="c4-row">
                  <input type="checkbox" checked={picked.includes(card.id)} aria-label={card.title} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                  {openEdit ? (
                    <span className="c4-stack">
                      <input className="c4-field" aria-label={v4("stbLine")} value={draft} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <input className="c4-field" aria-label={v4("stbNote")} value={noteDraft} disabled={viewer} onChange={(event) => setNoteDraft(event.target.value)} />
                    </span>
                  ) : (
                    <span><strong>{card.title}</strong> <span className="c4-meta">{card.note}</span></span>
                  )}
                </label>
                <p className="c4-meta">{card.host || v4("stbBlankHost")} · {card.minute ?? v4("stbBlankMinute")} · {clothName(v4, card.cloth)} · {card.room || v4("stbBlankRoom")} · {stanceName(v4, card.stance)} · {rankName(v4, card.rank)} · {spanName(v4, card.span)} · {card.tags.join(" ") || v4("stbBlankTag")} · {gap} {auditName(v4, card.audit)}</p>
                <div className="c4-row">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSittingPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("stbUnpin") : v4("stbPin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSittingHold(cards, card.id, !card.held))}>{card.held ? v4("stbLift") : v4("stbHold")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSittingClose(cards, card.id, !card.closed))}>{card.closed ? v4("stbReopen") : v4("stbClose")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cycleStance(cards, card.id))}>{v4("stbStanceUp")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSittingPause(cards, card.id, card.pause === 0 ? 15 : card.pause === 15 ? 30 : 0))}>{card.pause ? `${v4("stbPause")} ${card.pause}` : v4("stbPauseOff")}</button>
                  <button type="button" className="c4-btn" disabled={viewer || !tag} onClick={() => store(addSittingTag(cards, card.id, tag))}>{v4("stbTag")}</button>
                  {openEdit ? (
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => {
                      store(editSittingNote(editSitting(cards, card.id, draft), card.id, noteDraft));
                      setEditing("");
                    }}>{v4("stbEdit")}</button>
                  ) : (
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => {
                      setEditing(card.id);
                      setDraft(card.title);
                      setNoteDraft(card.note);
                    }}>{v4("stbEdit")}</button>
                  )}
                  <button type="button" className="c4-btn" onClick={() => {
                    void navigator.clipboard?.writeText(sittingCopy(card, desk));
                    setCopied(card.id);
                  }}>{copied === card.id ? v4("stbCopied") : v4("stbCopy")}</button>
                </div>
              </li>
            );
          })}
          {!shown.length && <li className="c4-empty-gold">{v4("stbEmpty")}</li>}
        </ul>
      )}
      <p className="c4-meta">{v4("stbRules")}</p>
    </section>
  );
}

export function CityMarks({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [query, setQuery] = useState("");
  const [band, setBand] = useState("all");
  const [tone, setTone] = useState("all");
  const [shape, setShape] = useState<CityShape>("all");
  const [review, setReview] = useState<"all" | "reviewed" | "open">("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [copied, setCopied] = useState("");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = useMemo<GlanceRow[]>(() => (data.data?.users || []).map((user) => ({
    id: user.id,
    label: user.name || user.id,
    note: { city: user.city ?? null },
  })), [data.data?.users]);
  useEffect(() => {
    setRole(storedRole());
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);
  useEffect(() => {
    const present = presentCities(rows);
    const ids = rows.map((row) => row.id);
    const nextHidden = readHiddenCities(readJson(MARK_KEY, []), present);
    const nextReviewed = readReviewedCities(readJson(MARK_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(MARK_KEY, nextHidden);
    writeJson(MARK_REVIEW_KEY, nextReviewed);
  }, [rows]);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey || typingTarget(event)) return;
      if (event.key === "n" || event.key === "N" || event.key === "/") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const present = presentCities(rows);
  const bands = visibleCityBands(present, hidden, showHidden);
  const bandOn = activeCityBand(band, present);
  const toneOn = activeCityTone(tone);
  const shown = visibleCityCustomers(rows, cityBandArg(bandOn), cityToneArg(toneOn), query, review, reviewed, shape)
    .filter((row) => {
      const state = cityState(row.note);
      const token = state === "set" ? cityBand(row.note) : state === "clear" ? "blank" : "";
      if (!token) return true;
      return bands.includes(token);
    });
  const lead = leadingCity(rows);
  const toneLead = leadingCityTone(rows);
  const shared = sharedCityCount(rows);
  const catalog = catalogCityCount(rows);
  const bars = cityBands(rows).filter((line) => line.band);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const ids = rows.map((row) => row.id);
  function storeHidden(next: string[]) {
    setHidden(next);
    writeJson(MARK_KEY, next);
  }
  function storeReviewed(next: string[]) {
    const saved = readReviewedCities(next, ids);
    setReviewed(saved);
    writeJson(MARK_REVIEW_KEY, saved);
  }
  return (
    <section className="c4-cmk" aria-label={v4("cmkTitle")} data-cities="1" data-role={role} data-catalog={catalog ? "1" : "0"}>
      <header className="c4-cmk-mast">
        <div>
          <p className="c4-cmk-kicker">{v4("cmkSub")}</p>
          <h2 className="c4-title">{v4("cmkTitle")}</h2>
        </div>
        <p className="c4-cmk-plate" data-logo="mono">{v4("cmkLogo")}</p>
      </header>
      <p className="c4-cmk-rules">{v4("cmkHint")}</p>
      <p className="c4-meta">{v4("cmkKept")} {v4("cmkEscape")}</p>
      {viewer && <p className="c4-cmk-notice" data-viewer="1">{v4("cmkViewer")}</p>}
      {data.error && <p className="c4-empty-gold" role="alert">{v4("cmkFailed")}</p>}
      {data.loading && <p className="c4-meta">{v4("cmkLoading")}</p>}
      {shared > 0 && <p className="c4-cmk-notice" role="status">{v4("cmkNotice")} · {shared}</p>}
      <dl className="c4-cmk-kpi" aria-label={v4("cmkKpi")}>
        <div><dt>{v4("cmkSet")}</dt><dd>{rows.filter((row) => cityState(row.note) === "set").length}</dd></div>
        <div><dt>{v4("cmkCatalog")}</dt><dd>{catalog}</dd></div>
        <div><dt>{v4("cmkWide")}</dt><dd>{wideCityCount(rows)}</dd></div>
        <div><dt>{v4("cmkOpenCount")}</dt><dd>{openCityCount(rows)}</dd></div>
        <div><dt>{v4("cmkShare")}</dt><dd>{cityShare(catalog, rows.length)}%</dd></div>
        <div><dt>{v4("cmkShared")}</dt><dd>{shared}</dd></div>
      </dl>
      <div className="c4-cmk-chart" aria-label={v4("cmkBands")}>
        {bars.map((bar) => (
          <div key={bar.band} className="c4-cmk-col">
            <div className="c4-cmk-track" aria-hidden="true"><i style={{ height: `${Math.round((bar.count / maxBar) * 100)}%` }} /></div>
            <button type="button" className="c4-btn" onClick={() => setBand(bar.band)}>{bandName(v4, bar.band)} · {bar.count}</button>
          </div>
        ))}
        {!bars.length && <p className="c4-empty-gold">{v4("cmkEmpty")}</p>}
      </div>
      <p className="c4-meta">{lead ? `${v4("cmkLeading")} · ${bandName(v4, lead)}` : v4("cmkLeadingNone")} · {toneLead ? `${v4("cmkToneLead")} · ${toneName(v4, toneLead)}` : v4("cmkToneNone")} · {shared ? `${v4("cmkShared")} · ${shared}` : v4("cmkSharedNone")}</p>
      <div className="c4-cmk-filters">
        <label className="c4-lab"><span>{v4("cmkSearch")}</span>
          <input ref={searchRef} className="c4-field" aria-label={v4("cmkSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            setQuery("");
          }} />
        </label>
        <label className="c4-lab"><span>{v4("cmkBands")}</span>
          <select className="c4-field" aria-label={v4("cmkBands")} value={bandOn} onChange={(event) => setBand(event.target.value)}>
            <option value="all">{v4("cmkAll")}</option>
            <option value="blank">{v4("cmkClear")}</option>
            {BANDS.map((item) => <option key={item} value={item}>{bandName(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("cmkTone")}</span>
          <select className="c4-field" aria-label={v4("cmkTone")} value={toneOn} onChange={(event) => setTone(event.target.value)}>
            <option value="all">{v4("cmkAll")}</option>
            <option value="open">{v4("cmkOpenTone")}</option>
            <option value="shut">{v4("cmkShut")}</option>
          </select>
        </label>
      </div>
      <div className="c4-row">
        {(["all", "catalog", "metro", "open"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} aria-pressed={shape === item} onClick={() => setShape(item)}>
            {item === "all" ? v4("cmkAllShapes") : item === "catalog" ? v4("cmkCatalog") : item === "metro" ? v4("cmkMetro") : v4("cmkOpenTone")}
          </button>
        ))}
        {(["all", "reviewed", "open"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} aria-pressed={review === item} onClick={() => setReview(item)}>
            {item === "all" ? v4("cmkAllReview") : item === "reviewed" ? v4("cmkReviewed") : v4("cmkOpenReview")}
          </button>
        ))}
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden((on) => !on)}>{showHidden ? v4("cmkShown") : v4("cmkHidden")}</button>
      </div>
      <ul className="c4-cmk-bands" aria-label={v4("cmkBands")}>
        {present.map((item) => (
          <li key={item}>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeHidden(toggleCity(hidden, item, present))}>{bandName(v4, item)} · {hidden.includes(item) ? v4("cmkShow") : v4("cmkHide")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-row">
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkCityReview(reviewed, shown.map((row) => row.id), ids, true))}>{v4("cmkBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkCityReview(reviewed, shown.map((row) => row.id), ids, false))}>{v4("cmkBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("city-marks.csv", citiesCsv(rows))}>{v4("cmkCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("city-mark-rows.csv", cityRowsCsv(shown, reviewed))}>{v4("cmkRowCsv")}</button>
        <Link className="c4-btn" href={crmv4Href(base, "customers")}>{v4("cmkCustomers")}</Link>
      </div>
      <ul className="c4-cmk-rows">
        {shown.map((row) => {
          const code = cityCopy(row.note);
          const marked = reviewed.includes(row.id);
          return (
            <li key={row.id} data-band={cityBand(row.note) || "blank"} data-tone={cityTone(row.note) || "blank"} data-catalog={catalogCity(row.note) ? "1" : "0"} data-reviewed={marked ? "1" : "0"}>
              <strong>{row.label}</strong>
              <p className="c4-meta">{code || v4("cmkClear")} · {bandName(v4, cityBand(row.note) || (cityState(row.note) === "clear" ? "blank" : ""))} · {toneName(v4, cityTone(row.note))} {catalogCity(row.note) ? `· ${v4("cmkCatalogMark")}` : ""}</p>
              <div className="c4-row">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleCityReview(reviewed, row.id, ids))}>{marked ? v4("cmkReviewed") : v4("cmkReview")}</button>
                <button type="button" className="c4-btn" disabled={!code} onClick={() => {
                  if (!code) return;
                  void navigator.clipboard?.writeText(code);
                  setCopied(row.id);
                }}>{copied === row.id ? v4("cmkCopied") : v4("cmkCopy")}</button>
              </div>
            </li>
          );
        })}
        {!data.loading && !shown.length && <li className="c4-empty-gold">{v4("cmkEmpty")}</li>}
      </ul>
      <p className="c4-meta">{v4("cmkRules")}</p>
    </section>
  );
}
