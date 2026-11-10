"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  FLW_DENSITY_KEY,
  FLW_KEY,
  FLW_VIEW_KEY,
  MONO_KEY,
  MONO_REVIEW_KEY,
  activeClerk,
  activeDay,
  activeMonoBand,
  activeMonoTone,
  activeRank,
  activeShelf,
  activeSpan,
  activeTone,
  addWarrant,
  addWarrantView,
  bulkMonoReview,
  bulkWarrantMark,
  bulkWarrantPin,
  bulkWarrantSeal,
  bulkWarrantShelf,
  busiestClerk,
  catalogMono,
  catalogMonoCount,
  clashDayCount,
  clerkArg,
  cycleRank,
  dayArg,
  dayGap,
  densityOf,
  dropWarrantView,
  editWarrant,
  editWarrantNote,
  fairClerk,
  giltMonoCount,
  houseShelf,
  lateWarrant,
  leadingMono,
  leadingMonoTone,
  monoBand,
  monoBandArg,
  monoBands,
  monoCopy,
  monoRowsCsv,
  monoShare,
  monoState,
  monoTone,
  monoToneArg,
  monogramOf,
  monogramsCsv,
  moveFocus,
  nextWarrant,
  pairMonoCount,
  presentMonos,
  pressDay,
  quietDay,
  rankArg,
  readHiddenMonos,
  readReviewedMonos,
  readWarrantViews,
  readWarrants,
  reminderWarrants,
  resetWarrants,
  setWarrantHold,
  setWarrantPin,
  setWarrantSeal,
  setWarrantWait,
  sharedMonoCount,
  shelfArg,
  soonWarrant,
  sortMode,
  sortWarrants,
  spanArg,
  suggestClerk,
  suggestShelf,
  suggestSpan,
  toneArg,
  toneClashCount,
  toggleMono,
  toggleMonoReview,
  usedDays,
  visibleMonoBands,
  visibleMonoCustomers,
  visibleWarrants,
  warrantClerks,
  warrantCopy,
  warrantCounts,
  warrantShare,
  warrantShelves,
  warrantTimeline,
  warrantsCsv,
  type FlwDensity,
  type FlwRank,
  type FlwShelf,
  type FlwSort,
  type FlwTray,
  type FlwView,
  type FolioWarrant,
  type MonoRow,
  type MonoShape,
} from "@/lib/crmv4/round199";
import { useJson } from "./kit";
import { storedRole } from "./round5";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  email?: string | null;
};

type GlanceRow = MonoRow & { id: string };

const SHELVES = ["vellum", "linen", "slate"] as const;
const BANDS = ["seed", "pair"] as const;

function shelfLabel(v4: V4, shelf: FlwShelf | string): string {
  if (shelf === "vellum" || shelf === "VELLUM") return v4("flwVellum");
  if (shelf === "linen" || shelf === "LINEN") return v4("flwLinen");
  if (shelf === "slate" || shelf === "SLATE") return v4("flwSlate");
  return v4("flwBlankShelf");
}

function rankLabel(v4: V4, rank: FlwRank | string): string {
  if (rank === "open") return v4("flwOpenRank");
  if (rank === "marked") return v4("flwMarked");
  if (rank === "filed") return v4("flwFiled");
  return v4("flwBlankRank");
}

function toneLabel(v4: V4, tone: number | null): string {
  if (tone === 2) return v4("flwTone2");
  if (tone === 4) return v4("flwTone4");
  if (tone === 8) return v4("flwTone8");
  return v4("flwBlankTone");
}

function spanLabel(v4: V4, span: number | null): string {
  if (span === 15) return v4("flwSpan15");
  if (span === 30) return v4("flwSpan30");
  if (span === 45) return v4("flwSpan45");
  return v4("flwBlankSpan");
}

function bandLabel(v4: V4, name: string): string {
  if (name === "seed") return v4("mngSeed");
  if (name === "pair") return v4("mngPair");
  if (name === "blank") return v4("mngClear");
  return v4("mngUnmarked");
}

function inkLabel(v4: V4, name: string): string {
  if (name === "gilt") return v4("mngGilt");
  if (name === "ink") return v4("mngInk");
  return v4("mngUnmarked");
}

function auditLabel(v4: V4, audit: string): string {
  const key = {
    save: "flwAuditSave",
    edit: "flwAuditEdit",
    rank: "flwAuditRank",
    pin: "flwAuditPin",
    unpin: "flwAuditUnpin",
    hold: "flwAuditHold",
    lift: "flwAuditLift",
    seal: "flwAuditSeal",
    unseal: "flwAuditUnseal",
    shelf: "flwAuditShelf",
    mark: "flwAuditMark",
    wait: "flwAuditWait",
  }[audit];
  return key ? v4(key as CrmV4CopyKey) : "";
}

function gapLabel(v4: V4, day: number | null, desk: string): string {
  const gap = dayGap(day, desk);
  if (gap === null) return "";
  if (gap > 0) return `${v4("flwPast")} ${gap}`;
  if (gap < 0) return `${v4("flwAhead")} ${Math.abs(gap)}`;
  return v4("flwDue");
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
  const node = event.target as HTMLElement | null;
  if (!node) return false;
  const tag = node.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || node.isContentEditable;
}

export function FolioWarrants({ v4 }: { v4: V4 }) {
  const [warrants, setWarrants] = useState<FolioWarrant[]>([]);
  const [views, setViews] = useState<FlwView[]>([]);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [clerk, setClerk] = useState("");
  const [day, setDay] = useState("");
  const [shelf, setShelf] = useState("");
  const [rank, setRank] = useState("");
  const [tone, setTone] = useState("");
  const [spanValue, setSpanValue] = useState("");
  const [mark, setMark] = useState("");
  const [roster, setRoster] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<FlwTray>("open");
  const [clerkFilter, setClerkFilter] = useState("all");
  const [shelfFilter, setShelfFilter] = useState("all");
  const [rankFilter, setRankFilter] = useState("all");
  const [dayFilter, setDayFilter] = useState("all");
  const [toneFilter, setToneFilter] = useState("all");
  const [spanFilter, setSpanFilter] = useState("all");
  const [markedOnly, setMarkedOnly] = useState(false);
  const [pressOnly, setPressOnly] = useState(false);
  const [quietOnly, setQuietOnly] = useState(false);
  const [houseOnly, setHouseOnly] = useState(false);
  const [awakeOnly, setAwakeOnly] = useState(false);
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const [order, setOrder] = useState<FlwSort>("day");
  const [density, setDensity] = useState<FlwDensity>("roomy");
  const [copied, setCopied] = useState("");
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [deskDay, setDeskDay] = useState("");
  const [moveShelf, setMoveShelf] = useState("linen");
  const [picked, setPicked] = useState<string[]>([]);
  const [focus, setFocus] = useState(0);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  useEffect(() => {
    const next = readWarrants(readJson(FLW_KEY, []));
    const saved = readWarrantViews(readJson(FLW_VIEW_KEY, []));
    setWarrants(next);
    setViews(saved);
    setDensity(densityOf(readJson(FLW_DENSITY_KEY, "roomy")));
    writeJson(FLW_KEY, next);
    writeJson(FLW_VIEW_KEY, saved);
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);
  function store(next: FolioWarrant[]) {
    const saved = readWarrants(next);
    setWarrants(saved);
    writeJson(FLW_KEY, saved);
    setPicked((ids) => ids.filter((id) => saved.some((warrant) => warrant.id === id)));
  }
  function storeViews(next: FlwView[]) {
    const saved = readWarrantViews(next);
    setViews(saved);
    writeJson(FLW_VIEW_KEY, saved);
  }
  function storeDensity(next: FlwDensity) {
    setDensity(next);
    writeJson(FLW_DENSITY_KEY, next);
  }
  const clerks = warrantClerks(warrants);
  const shelves = warrantShelves(warrants);
  const bars = SHELVES.map((item) => ({ shelf: item.toUpperCase(), count: warrants.filter((warrant) => warrant.shelf === item.toUpperCase()).length })).filter((row) => row.count > 0);
  const clerkOn = activeClerk(clerkFilter, clerks);
  const shelfOn = activeShelf(shelfFilter, shelves);
  const rankOn = activeRank(rankFilter, ["open", "marked", "filed"]);
  const dayOn = activeDay(dayFilter);
  const toneOn = activeTone(toneFilter);
  const spanOn = activeSpan(spanFilter);
  const pickedDay = dayArg(dayOn);
  const shown = sortWarrants(visibleWarrants(
    warrants,
    tray,
    query,
    clerkArg(clerkOn),
    shelfArg(shelfOn),
    rankArg(rankOn),
    pickedDay.exact,
    pickedDay.pick,
    toneArg(toneOn),
    spanArg(spanOn),
    markedOnly,
    pressOnly,
    houseOnly,
    quietOnly,
    awakeOnly,
  ), order);
  const timeline = warrantTimeline(warrants, query);
  const counts = warrantCounts(warrants, deskDay);
  const clashes = clashDayCount(warrants);
  const tones = toneClashCount(warrants);
  const nextId = nextWarrant(warrants, deskDay);
  const nextRow = warrants.find((warrant) => warrant.id === nextId);
  const suggestedShelf = suggestShelf(warrants);
  const suggestedClerk = suggestClerk(warrants);
  const suggestedSpan = suggestSpan(warrants);
  const fair = fairClerk(warrants, roster);
  const busy = busiestClerk(warrants);
  const reminders = reminderWarrants(warrants, deskDay);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const focusAt = shown.length ? moveFocus(focus, shown.length, 0) : 0;
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        clearDraft();
        return;
      }
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
    setClerk("");
    setDay("");
    setShelf("");
    setRank("");
    setTone("");
    setSpanValue("");
    setMark("");
    setQuery("");
    setEditing("");
  }
  function applyView(view: FlwView) {
    setTray(view.tray);
    setQuery(view.query);
    setClerkFilter(view.clerk);
    setShelfFilter(view.shelf);
    setRankFilter(view.rank);
    setDayFilter(view.day);
    setToneFilter(view.tone);
    setSpanFilter(view.span);
  }
  const rows = board === "timeline" ? timeline : shown;
  return (
    <section className="c4-flw" aria-label={v4("flwTitle")} data-folio="1" data-role={role} data-density={density}>
      <header className="c4-flw-mast">
        <div>
          <p className="c4-flw-kicker">{v4("flwSub")}</p>
          <h2 className="c4-title">{v4("flwTitle")}</h2>
        </div>
        <p className="c4-flw-plate" data-logo="mono">{v4("flwLogo")}</p>
      </header>
      <p className="c4-flw-rules">{v4("flwHint")}</p>
      <p className="c4-meta">{v4("flwLocal")}</p>
      <p className="c4-meta">{v4("flwNew")} {v4("flwSlash")} {v4("flwEscape")} {v4("flwKeys")}</p>
      {viewer && <p className="c4-flw-notice" data-viewer="1">{v4("flwViewer")}</p>}
      {counts.press > 0 && (
        <p className="c4-flw-notice" role="status">
          {v4("flwNotice")} · {counts.press}
          <button type="button" className="c4-btn" onClick={() => setPressOnly((on) => !on)}>{pressOnly ? v4("flwNoticeAll") : v4("flwNoticePress")}</button>
        </p>
      )}
      <dl className="c4-flw-kpi" aria-label={v4("flwKpi")}>
        <div><dt>{v4("flwOpen")}</dt><dd>{counts.open}</dd></div>
        <div><dt>{v4("flwHeld")}</dt><dd>{counts.held}</dd></div>
        <div><dt>{v4("flwSealed")}</dt><dd>{counts.sealed}</dd></div>
        <div><dt>{v4("flwPinned")}</dt><dd>{counts.pinned}</dd></div>
        <div><dt>{v4("flwPress")}</dt><dd>{counts.press}</dd></div>
        <div><dt>{v4("flwLate")}</dt><dd>{counts.late}</dd></div>
        <div><dt>{v4("flwSoon")}</dt><dd>{counts.soon}</dd></div>
        <div><dt>{v4("flwWait")}</dt><dd>{counts.wait}</dd></div>
        <div><dt>{v4("flwHouseShare")}</dt><dd>{warrantShare(counts.house, warrants.length)}%</dd></div>
      </dl>
      <div className="c4-flw-chart" aria-label={v4("flwShelves")}>
        {bars.map((bar) => (
          <div key={bar.shelf} className="c4-flw-col">
            <div className="c4-flw-track" aria-hidden="true"><i style={{ height: `${Math.round((bar.count / maxBar) * 100)}%` }} /></div>
            <button type="button" className="c4-btn" onClick={() => setShelfFilter(bar.shelf)}>{shelfLabel(v4, bar.shelf)} · {bar.count}</button>
          </div>
        ))}
        {!bars.length && <p className="c4-empty-gold">{v4("flwEmpty")}</p>}
      </div>
      <div className="c4-flw-suggest">
        <p>{v4("flwSuggestShelf")} · {shelfLabel(v4, suggestedShelf)}</p>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => setShelf(suggestedShelf.toLowerCase())}>{v4("flwUseShelf")}</button>
        <p>{v4("flwSuggestClerk")} · {suggestedClerk || v4("flwBlankClerk")}</p>
        <button type="button" className="c4-btn" disabled={viewer || !suggestedClerk} onClick={() => setClerk(suggestedClerk)}>{v4("flwUseClerk")}</button>
        <p>{v4("flwSuggestSpan")} · {spanLabel(v4, suggestedSpan)}</p>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => setSpanValue(String(suggestedSpan))}>{v4("flwUseSpan")}</button>
        <p>{v4("flwAssign")} · {fair || v4("flwBlankClerk")}</p>
        <button type="button" className="c4-btn" disabled={viewer || !fair} onClick={() => setClerk(fair)}>{v4("flwAssign")}</button>
        <p>{v4("flwDays")} · {usedDays(warrants)}</p>
        <p>{clashes ? `${v4("flwClash")} · ${clashes}` : v4("flwClashNone")}</p>
        <p>{tones ? `${v4("flwToneClash")} · ${tones}` : v4("flwToneClashNone")}</p>
        <p>{v4("flwNext")} · {nextRow ? nextRow.title : v4("flwNextNone")}</p>
        <p>{v4("flwBusiest")} · {busy || v4("flwBusiestNone")}</p>
        <p>{v4("flwReminders")} · {reminders.length ? reminders.map((warrant) => warrant.title).join(", ") : v4("flwReminderNone")}</p>
      </div>
      <form className="c4-flw-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addWarrant(warrants, {
          id: `w${Date.now().toString(36)}`,
          title,
          note,
          clerk,
          day,
          shelf,
          rank,
          tone,
          span: spanValue,
          marks: mark,
          wait: "0",
        });
        const added = next[0];
        if (added && (added.title !== warrants[0]?.title || next.length !== warrants.length)) {
          store(next);
          clearDraft();
        }
      }}>
        <label className="c4-lab">{v4("flwLine")}<input ref={titleRef} className="c4-field" aria-label={v4("flwLine")} value={title} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("flwNote")}<input className="c4-field" aria-label={v4("flwNote")} value={note} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("flwClerk")}<input className="c4-field" aria-label={v4("flwClerk")} value={clerk} onChange={(event) => setClerk(event.target.value)} /></label>
        <label className="c4-lab">{v4("flwDay")}<input className="c4-field" inputMode="numeric" aria-label={v4("flwDay")} value={day} onChange={(event) => setDay(event.target.value)} /></label>
        <label className="c4-lab">{v4("flwShelf")}
          <select className="c4-field" aria-label={v4("flwShelf")} value={shelf} onChange={(event) => setShelf(event.target.value)}>
            <option value="">{v4("flwBlankShelf")}</option>
            {SHELVES.map((item) => <option key={item} value={item}>{shelfLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab">{v4("flwRank")}
          <select className="c4-field" aria-label={v4("flwRank")} value={rank} onChange={(event) => setRank(event.target.value)}>
            <option value="">{v4("flwBlankRank")}</option>
            <option value="open">{v4("flwOpenRank")}</option>
            <option value="marked">{v4("flwMarked")}</option>
            <option value="filed">{v4("flwFiled")}</option>
          </select>
        </label>
        <label className="c4-lab">{v4("flwTone")}
          <select className="c4-field" aria-label={v4("flwTone")} value={tone} onChange={(event) => setTone(event.target.value)}>
            <option value="">{v4("flwBlankTone")}</option>
            <option value="2">{v4("flwTone2")}</option>
            <option value="4">{v4("flwTone4")}</option>
            <option value="8">{v4("flwTone8")}</option>
          </select>
        </label>
        <label className="c4-lab">{v4("flwSpan")}
          <select className="c4-field" aria-label={v4("flwSpan")} value={spanValue} onChange={(event) => setSpanValue(event.target.value)}>
            <option value="">{v4("flwBlankSpan")}</option>
            <option value="15">{v4("flwSpan15")}</option>
            <option value="30">{v4("flwSpan30")}</option>
            <option value="45">{v4("flwSpan45")}</option>
          </select>
        </label>
        <label className="c4-lab">{v4("flwMark")}<input className="c4-field" maxLength={1} aria-label={v4("flwMark")} value={mark} onChange={(event) => setMark(event.target.value)} /></label>
        <label className="c4-lab">{v4("flwRoster")}<input className="c4-field" aria-label={v4("flwRoster")} value={roster} onChange={(event) => setRoster(event.target.value)} /></label>
        <label className="c4-lab">{v4("flwDeskDay")}<input className="c4-field" inputMode="numeric" aria-label={v4("flwDeskDay")} value={deskDay} onChange={(event) => setDeskDay(event.target.value)} /></label>
        <button type="submit" className="c4-btn c4-btn-hot" disabled={viewer}>{v4("flwAdd")}</button>
      </form>
      <div className="c4-flw-views">
        <label className="c4-lab">{v4("flwViews")}<input className="c4-field" aria-label={v4("flwViews")} value={viewName} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => {
          const next = addWarrantView(views, { id: `v${Date.now().toString(36)}`, name: viewName, tray, query, clerk: clerkOn, shelf: shelfOn, rank: rankOn, day: dayOn, tone: toneOn, span: spanOn });
          storeViews(next);
          if (next.length !== views.length) setViewName("");
        }}>{v4("flwSaveView")}</button>
        {views.map((view) => (
          <span key={view.id}>
            <button type="button" className="c4-chip" onClick={() => applyView(view)}>{view.name}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropWarrantView(views, view.id))}>{v4("flwDropView")}</button>
          </span>
        ))}
      </div>
      <label className="c4-lab">{v4("flwSearch")}<input ref={searchRef} className="c4-field" aria-label={v4("flwSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
      <div className="c4-flw-filters" role="group" aria-label={v4("flwSearch")}>
        {(["open", "held", "sealed"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{item === "open" ? v4("flwOpen") : item === "held" ? v4("flwHeld") : v4("flwSealed")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={clerkOn === "all" ? "1" : "0"} onClick={() => setClerkFilter("all")}>{v4("flwAll")}</button>
        <button type="button" className="c4-chip" data-on={clerkOn === "blank" ? "1" : "0"} onClick={() => setClerkFilter("blank")}>{v4("flwBlankClerk")}</button>
        {clerks.map((name) => (
          <button key={name} type="button" className="c4-chip" data-on={clerkOn === name ? "1" : "0"} onClick={() => setClerkFilter(name)}>{name}</button>
        ))}
        {["blank", "early", "mid", "late", "press", "quiet"].map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={dayOn === item ? "1" : "0"} onClick={() => setDayFilter(item)}>
            {item === "blank" ? v4("flwBlankDay") : item === "early" ? v4("flwEarly") : item === "mid" ? v4("flwMid") : item === "late" ? v4("flwLate") : item === "press" ? v4("flwPress") : v4("flwQuiet")}
          </button>
        ))}
        <button type="button" className="c4-chip" data-on={markedOnly ? "1" : "0"} onClick={() => setMarkedOnly((on) => !on)}>{v4("flwMarkedOnly")}</button>
        <button type="button" className="c4-chip" data-on={houseOnly ? "1" : "0"} onClick={() => setHouseOnly((on) => !on)}>{v4("flwHouseOnly")}</button>
        <button type="button" className="c4-chip" data-on={quietOnly ? "1" : "0"} onClick={() => setQuietOnly((on) => !on)}>{v4("flwQuietOnly")}</button>
        <button type="button" className="c4-chip" data-on={awakeOnly ? "1" : "0"} onClick={() => setAwakeOnly((on) => !on)}>{v4("flwAwake")}</button>
        <button type="button" className="c4-chip" data-on={board === "cards" ? "1" : "0"} onClick={() => setBoard("cards")}>{v4("flwCards")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard("timeline")}>{v4("flwTimeline")}</button>
        <button type="button" className="c4-chip" data-on={order === "day" ? "1" : "0"} onClick={() => setOrder(sortMode("day"))}>{v4("flwSortDay")}</button>
        <button type="button" className="c4-chip" data-on={order === "title" ? "1" : "0"} onClick={() => setOrder(sortMode("title"))}>{v4("flwSortTitle")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "tight" ? "roomy" : "tight")}>{density === "tight" ? v4("flwRoomy") : v4("flwTight")}</button>
      </div>
      <div className="c4-flw-bulk">
        <button type="button" className="c4-btn" onClick={() => setPicked(rows.map((warrant) => warrant.id))}>{v4("flwPickAll")}</button>
        <button type="button" className="c4-btn" onClick={() => setPicked([])}>{v4("flwPickNone")}</button>
        <span>{v4("flwPicked")} · {picked.length}</span>
        <select className="c4-field" aria-label={v4("flwBulkShelf")} value={moveShelf} onChange={(event) => setMoveShelf(event.target.value)}>
          {SHELVES.map((item) => <option key={item} value={item}>{shelfLabel(v4, item)}</option>)}
        </select>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkWarrantShelf(warrants, picked, moveShelf))}>{v4("flwBulkShelf")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkWarrantPin(warrants, picked, true))}>{v4("flwBulkPin")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkWarrantSeal(warrants, picked, true))}>{v4("flwBulkSeal")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkWarrantMark(warrants, picked, mark || "a"))}>{v4("flwBulkMark")}</button>
        <button type="button" className="c4-btn" onClick={() => download("folio-warrants.csv", warrantsCsv(warrants, deskDay))}>{v4("flwCsv")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(resetWarrants())}>{v4("flwReset")}</button>
      </div>
      {!rows.length && <p className="c4-empty-gold">{v4("flwEmpty")}</p>}
      <ul className={board === "timeline" ? "c4-flw-time" : "c4-flw-cards"}>
        {rows.map((warrant, index) => (
          <li key={warrant.id} data-focus={index === focusAt ? "1" : "0"} data-late={lateWarrant(warrant, deskDay) ? "1" : "0"} data-soon={soonWarrant(warrant) ? "1" : "0"} data-house={houseShelf(warrant.shelf) ? "1" : "0"} data-press={pressDay(warrant.day) ? "1" : "0"} data-quiet={quietDay(warrant.day) ? "1" : "0"}>
            <label className="c4-row">
              <input type="checkbox" checked={picked.includes(warrant.id)} aria-label={warrant.title} onChange={(event) => setPicked((ids) => event.target.checked ? [...ids, warrant.id] : ids.filter((id) => id !== warrant.id))} />
              <strong>{warrant.title}</strong>
            </label>
            <p className="c4-meta">{warrant.clerk || v4("flwBlankClerk")} · {warrant.day ?? v4("flwBlankDay")} · {shelfLabel(v4, warrant.shelf)} · {rankLabel(v4, warrant.rank)} · {toneLabel(v4, warrant.tone)} · {spanLabel(v4, warrant.span)}</p>
            <p className="c4-meta">{warrant.marks.length ? warrant.marks.join(" ") : v4("flwBlankMark")} · {gapLabel(v4, warrant.day, deskDay)} · {auditLabel(v4, warrant.audit)}</p>
            {warrant.note && <p>{warrant.note}</p>}
            {editing === warrant.id && (
              <div className="c4-flw-edit">
                <input className="c4-field" aria-label={v4("flwLine")} value={draft} onChange={(event) => setDraft(event.target.value)} />
                <input className="c4-field" aria-label={v4("flwNote")} value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} />
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => { store(editWarrantNote(editWarrant(warrants, warrant.id, draft), warrant.id, noteDraft)); setEditing(""); }}>{v4("flwEdit")}</button>
              </div>
            )}
            <div className="c4-row">
              <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cycleRank(warrants, warrant.id))}>{v4("flwRankUp")}</button>
              <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setWarrantPin(warrants, warrant.id, !warrant.pinned))}>{warrant.pinned ? v4("flwUnpin") : v4("flwPin")}</button>
              <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setWarrantHold(warrants, warrant.id, !warrant.held))}>{warrant.held ? v4("flwLift") : v4("flwHold")}</button>
              <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setWarrantSeal(warrants, warrant.id, !warrant.sealed))}>{warrant.sealed ? v4("flwUnseal") : v4("flwSeal")}</button>
              <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setWarrantWait(warrants, warrant.id, warrant.wait ? 0 : 15))}>{warrant.wait ? v4("flwWaitOff") : v4("flwWaitOn")}</button>
              <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(warrant.id); setDraft(warrant.title); setNoteDraft(warrant.note); }}>{v4("flwEdit")}</button>
              <button type="button" className="c4-btn" onClick={() => { const line = warrantCopy(warrant, deskDay); void navigator.clipboard?.writeText(line); setCopied(warrant.id); }}>{copied === warrant.id ? v4("flwCopied") : v4("flwCopy")}</button>
            </div>
          </li>
        ))}
      </ul>
      <p className="c4-flw-rules">{v4("flwRules")}</p>
    </section>
  );
}

export function MailMonograms({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [query, setQuery] = useState("");
  const [band, setBand] = useState("all");
  const [tone, setTone] = useState("all");
  const [shape, setShape] = useState<MonoShape>("all");
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
    note: "email" in user ? { email: user.email ?? "" } : {},
  })), [data.data?.users]);
  useEffect(() => {
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);
  useEffect(() => {
    const present = presentMonos(rows);
    const ids = rows.map((row) => row.id);
    const nextHidden = readHiddenMonos(readJson(MONO_KEY, []), present);
    const nextReviewed = readReviewedMonos(readJson(MONO_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(MONO_KEY, nextHidden);
    writeJson(MONO_REVIEW_KEY, nextReviewed);
  }, [rows]);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setQuery("");
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey || typingTarget(event)) return;
      if (event.key === "n" || event.key === "N" || event.key === "/") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const present = presentMonos(rows);
  const bands = visibleMonoBands(present, hidden, showHidden);
  const bandOn = activeMonoBand(band, present);
  const toneOn = activeMonoTone(tone);
  const shown = visibleMonoCustomers(rows, monoBandArg(bandOn), monoToneArg(toneOn), query, review, reviewed, shape)
    .filter((row) => {
      const state = monoState(row.note);
      const token = state === "set" ? monoBand(row.note) : state === "clear" ? "blank" : "";
      if (!token) return true;
      return bands.includes(token);
    });
  const lead = leadingMono(rows);
  const toneLead = leadingMonoTone(rows);
  const shared = sharedMonoCount(rows);
  const catalog = catalogMonoCount(rows);
  const bars = monoBands(rows).filter((line) => line.band);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const ids = rows.map((row) => row.id);
  function storeHidden(next: string[]) {
    setHidden(next);
    writeJson(MONO_KEY, next);
  }
  function storeReviewed(next: string[]) {
    const saved = readReviewedMonos(next, ids);
    setReviewed(saved);
    writeJson(MONO_REVIEW_KEY, saved);
  }
  return (
    <section className="c4-mng" aria-label={v4("mngTitle")} data-monograms="1" data-role={role} data-catalog={catalog ? "1" : "0"}>
      <header className="c4-mng-mast">
        <div>
          <p className="c4-mng-kicker">{v4("mngSub")}</p>
          <h2 className="c4-title">{v4("mngTitle")}</h2>
        </div>
        <p className="c4-mng-plate" data-logo="mono">{v4("mngLogo")}</p>
      </header>
      <p className="c4-mng-rules">{v4("mngHint")}</p>
      <p className="c4-meta">{v4("mngKept")} {v4("mngEscape")}</p>
      {viewer && <p className="c4-mng-notice" data-viewer="1">{v4("mngViewer")}</p>}
      {data.error && <p className="c4-empty-gold" role="alert">{v4("mngFailed")}</p>}
      {data.loading && <p className="c4-meta">{v4("mngLoading")}</p>}
      {shared > 0 && <p className="c4-mng-notice" role="status">{v4("mngNotice")} · {shared}</p>}
      <dl className="c4-mng-kpi" aria-label={v4("mngKpi")}>
        <div><dt>{v4("mngSet")}</dt><dd>{rows.filter((row) => monoState(row.note) === "set").length}</dd></div>
        <div><dt>{v4("mngCatalog")}</dt><dd>{catalog}</dd></div>
        <div><dt>{v4("mngPairCount")}</dt><dd>{pairMonoCount(rows)}</dd></div>
        <div><dt>{v4("mngGiltCount")}</dt><dd>{giltMonoCount(rows)}</dd></div>
        <div><dt>{v4("mngShare")}</dt><dd>{monoShare(catalog, rows.length)}%</dd></div>
        <div><dt>{v4("mngShared")}</dt><dd>{shared}</dd></div>
      </dl>
      <div className="c4-mng-chart" aria-label={v4("mngBands")}>
        {bars.map((bar) => (
          <div key={bar.band} className="c4-mng-col">
            <div className="c4-mng-track" aria-hidden="true"><i style={{ height: `${Math.round((bar.count / maxBar) * 100)}%` }} /></div>
            <button type="button" className="c4-btn" onClick={() => setBand(bar.band)}>{bandLabel(v4, bar.band)} · {bar.count}</button>
          </div>
        ))}
        {!bars.length && <p className="c4-empty-gold">{v4("mngEmpty")}</p>}
      </div>
      <div className="c4-mng-suggest">
        <p>{v4("mngLeading")} · {lead ? bandLabel(v4, lead) : v4("mngLeadingNone")}</p>
        <p>{v4("mngToneLead")} · {toneLead ? inkLabel(v4, toneLead) : v4("mngToneNone")}</p>
        <p>{shared ? `${v4("mngShared")} · ${shared}` : v4("mngSharedNone")}</p>
      </div>
      <label className="c4-lab">{v4("mngSearch")}<input ref={searchRef} className="c4-field" aria-label={v4("mngSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
      <div className="c4-mng-filters">
        <button type="button" className="c4-chip" data-on={bandOn === "all" ? "1" : "0"} onClick={() => setBand("all")}>{v4("mngAll")}</button>
        <button type="button" className="c4-chip" data-on={bandOn === "blank" ? "1" : "0"} onClick={() => setBand("blank")}>{v4("mngClear")}</button>
        {BANDS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={bandOn === item ? "1" : "0"} onClick={() => setBand(item)}>{bandLabel(v4, item)}</button>
        ))}
        <button type="button" className="c4-chip" data-on={toneOn === "all" ? "1" : "0"} onClick={() => setTone("all")}>{v4("mngTone")}</button>
        <button type="button" className="c4-chip" data-on={toneOn === "gilt" ? "1" : "0"} onClick={() => setTone("gilt")}>{v4("mngGilt")}</button>
        <button type="button" className="c4-chip" data-on={toneOn === "ink" ? "1" : "0"} onClick={() => setTone("ink")}>{v4("mngInk")}</button>
        {(["all", "catalog", "pair", "gilt"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{item === "all" ? v4("mngAllShapes") : item === "catalog" ? v4("mngCatalog") : item === "pair" ? v4("mngPair") : v4("mngGilt")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={review === "all" ? "1" : "0"} onClick={() => setReview("all")}>{v4("mngAllReview")}</button>
        <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} onClick={() => setReview("reviewed")}>{v4("mngReviewed")}</button>
        <button type="button" className="c4-chip" data-on={review === "open" ? "1" : "0"} onClick={() => setReview("open")}>{v4("mngOpenReview")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((on) => !on)}>{showHidden ? v4("mngShown") : v4("mngHidden")}</button>
      </div>
      <div className="c4-mng-bands">
        {present.map((item) => (
          <button key={item} type="button" className="c4-btn" disabled={viewer} onClick={() => storeHidden(toggleMono(hidden, item))}>
            {bandLabel(v4, item)} · {hidden.includes(item) ? v4("mngShow") : v4("mngHide")}
          </button>
        ))}
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkMonoReview(reviewed, shown.map((row) => row.id), true))}>{v4("mngBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkMonoReview(reviewed, ids, false))}>{v4("mngBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("mail-monograms.csv", monogramsCsv(rows))}>{v4("mngCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("mail-monogram-rows.csv", monoRowsCsv(rows, reviewed))}>{v4("mngRowCsv")}</button>
        <Link className="c4-btn" href={crmv4Href(base, "customers")}>{v4("mngCustomers")}</Link>
      </div>
      {!shown.length && <p className="c4-empty-gold">{v4("mngEmpty")}</p>}
      <ul className="c4-mng-rows">
        {shown.map((row) => {
          const state = monoState(row.note);
          const mark = monogramOf(row.note);
          return (
            <li key={row.id} data-state={state || "blank"} data-band={state === "set" ? monoBand(row.note) : "blank"} data-tone={monoTone(row.note) || "blank"} data-catalog={catalogMono(row.note) ? "1" : "0"} data-reviewed={reviewed.includes(row.id) ? "1" : "0"}>
              <strong>{row.label || row.id}</strong>
              <span>{mark || (state === "clear" ? v4("mngClear") : v4("mngUnmarked"))}</span>
              <span className="c4-meta">{bandLabel(v4, state === "set" ? monoBand(row.note) : state === "clear" ? "blank" : "")} · {inkLabel(v4, monoTone(row.note))}</span>
              {catalogMono(row.note) && <span className="c4-meta">{v4("mngCatalogMark")}</span>}
              <div className="c4-row">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleMonoReview(reviewed, row.id))}>{v4("mngReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { const line = monoCopy(row.note); void navigator.clipboard?.writeText(line); setCopied(row.id); }}>{copied === row.id ? v4("mngCopied") : v4("mngCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{row.label || row.id}</Link>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="c4-mng-rules">{v4("mngRules")}</p>
    </section>
  );
}
