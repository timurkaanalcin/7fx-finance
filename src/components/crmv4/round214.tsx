"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  CRB_DENSITY_KEY,
  CRB_KEY,
  CRB_VIEW_KEY,
  RSD_KEY,
  RSD_REVIEW_KEY,
  activeBay,
  activeClerk,
  activeDust,
  activeSeal,
  activeSealLane,
  activeSealTone,
  activeSpan,
  activeTimber,
  addChest,
  addChestMark,
  addChestView,
  adjacentChestCount,
  bayArg,
  bayGap,
  baySpan,
  bulkChestClose,
  bulkChestMark,
  bulkChestPin,
  bulkChestSeal,
  bulkChestTimber,
  bulkSealReview,
  busiestClerk,
  catalogSeal,
  catalogSealCount,
  chestClerks,
  chestCopy,
  chestCounts,
  chestLedger,
  chestShare,
  chestTimbers,
  chestsCsv,
  clashBayCount,
  clerkArg,
  cycleSeal,
  densityOf,
  dropChestView,
  dustArg,
  dustLoad,
  editChest,
  editChestNote,
  fairClerk,
  giltSealCount,
  holdFocused,
  houseTimber,
  lateChest,
  lateShare,
  leadingSeal,
  leadingSealTone,
  lockLoad,
  matchedChests,
  moveFocus,
  nextChest,
  pairClerkCount,
  peakBay,
  pinFocused,
  quietBay,
  quietHouseCount,
  readChestViews,
  readChests,
  readHiddenSeals,
  readReviewedSeals,
  reminderChests,
  resetChests,
  sealCopy,
  sealLane,
  sealArg,
  sealLaneArg,
  sealLanes,
  sealOf,
  sealRowsCsv,
  sealShare,
  sealState,
  sealTone,
  sealToneArg,
  sealsCsv,
  setChestClose,
  setChestDust,
  setChestHold,
  setChestPin,
  sharedSealCount,
  sharedTimberCount,
  snoozeChest,
  snoozeFocused,
  soonChest,
  sortChests,
  sortMode,
  spanArg,
  spanClashCount,
  suggestClerk,
  suggestSpan,
  suggestTimber,
  timberArg,
  wideSealCount,
  toggleSeal,
  toggleSealReview,
  usedBays,
  visibleChests,
  visibleSealCustomers,
  visibleSealLanes,
  windowChests,
  presentSeals,
  type ChestDensity,
  type ChestSort,
  type ChestTray,
  type ChestView,
  type CryptChest,
  type SealRow,
  type SealShape,
} from "@/lib/crmv4/round214";
import { useJson } from "./kit";
import { storedRole } from "./round5";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  isResident?: boolean | null;
};

type GlanceRow = SealRow & { id: string };

const TIMBERS = ["oak", "ash", "yew"] as const;
const SEALS = ["wax", "cord", "lock"] as const;
const LANES = ["house", "court"] as const;

function timberLabel(v4: V4, timber: string): string {
  if (timber === "oak" || timber === "OAK") return v4("crbOak");
  if (timber === "ash" || timber === "ASH") return v4("crbAsh");
  if (timber === "yew" || timber === "YEW") return v4("crbYew");
  return v4("crbBlankTimber");
}

function sealLabel(v4: V4, seal: string): string {
  if (seal === "wax") return v4("crbWax");
  if (seal === "cord") return v4("crbCord");
  if (seal === "lock") return v4("crbLock");
  return v4("crbBlankSeal");
}

function spanLabel(v4: V4, span: number | null): string {
  if (span === 6) return v4("crbSpan6");
  if (span === 12) return v4("crbSpan12");
  if (span === 24) return v4("crbSpan24");
  return v4("crbBlankSpan");
}

function laneLabel(v4: V4, name: string): string {
  if (name === "house") return v4("rsdHouse");
  if (name === "court") return v4("rsdCourt");
  if (name === "blank") return v4("rsdClear");
  return v4("rsdUnmarked");
}

function toneLabel(v4: V4, name: string): string {
  if (name === "gilt") return v4("rsdGilt");
  if (name === "ivory") return v4("rsdIvory");
  return v4("rsdUnmarked");
}

function auditLabel(v4: V4, audit: string): string {
  const key = {
    save: "crbAuditSave",
    edit: "crbAuditEdit",
    seal: "crbAuditSeal",
    pin: "crbAuditPin",
    unpin: "crbAuditUnpin",
    hold: "crbAuditHold",
    lift: "crbAuditLift",
    close: "crbAuditClose",
    open: "crbAuditOpen",
    timber: "crbAuditTimber",
    mark: "crbAuditMark",
    dust: "crbAuditDust",
    span: "crbAuditSpan",
  }[audit];
  return key ? v4(key as CrmV4CopyKey) : "";
}

function gapLabel(v4: V4, bay: number | null, desk: string): string {
  const gap = bayGap(bay, desk);
  if (gap === null) return "";
  if (gap > 0) return `${v4("crbPast")} ${gap}`;
  if (gap < 0) return `${v4("crbAhead")} ${Math.abs(gap)}`;
  return v4("crbDue");
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

export function CryptChests({ v4 }: { v4: V4 }) {
  const [chests, setChests] = useState<CryptChest[]>([]);
  const [views, setViews] = useState<ChestView[]>([]);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [clerk, setClerk] = useState("");
  const [bay, setBay] = useState("");
  const [timber, setTimber] = useState("");
  const [seal, setSeal] = useState("");
  const [spanValue, setSpanValue] = useState("");
  const [mark, setMark] = useState("");
  const [roster, setRoster] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<ChestTray>("open");
  const [clerkFilter, setClerkFilter] = useState("all");
  const [timberFilter, setTimberFilter] = useState("all");
  const [sealFilter, setSealFilter] = useState("all");
  const [bayFilter, setBayFilter] = useState("all");
  const [spanFilter, setSpanFilter] = useState("all");
  const [dustFilter, setDustFilter] = useState("all");
  const [lockOnly, setLockOnly] = useState(false);
  const [peakOnly, setPeakOnly] = useState(false);
  const [quietOnly, setQuietOnly] = useState(false);
  const [houseOnly, setHouseOnly] = useState(false);
  const [dryOnly, setDryOnly] = useState(false);
  const [board, setBoard] = useState<"gallery" | "ledger">("gallery");
  const [order, setOrder] = useState<ChestSort>("bay");
  const [density, setDensity] = useState<ChestDensity>("tall");
  const [copied, setCopied] = useState("");
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [deskBay, setDeskBay] = useState("");
  const [moveTimber, setMoveTimber] = useState("oak");
  const [picked, setPicked] = useState<string[]>([]);
  const [focus, setFocus] = useState(0);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const pinRef = useRef<() => void>(() => {});
  const spanRef = useRef<() => void>(() => {});
  const holdRef = useRef<() => void>(() => {});
  const viewer = role === "viewer";
  useEffect(() => {
    const next = readChests(readJson(CRB_KEY, []));
    const saved = readChestViews(readJson(CRB_VIEW_KEY, []));
    setChests(next);
    setViews(saved);
    setDensity(densityOf(readJson(CRB_DENSITY_KEY, "tall")));
    writeJson(CRB_KEY, next);
    writeJson(CRB_VIEW_KEY, saved);
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);
  function store(next: CryptChest[]) {
    const saved = readChests(next);
    setChests(saved);
    writeJson(CRB_KEY, saved);
    setPicked((ids) => ids.filter((id) => saved.some((chest) => chest.id === id)));
  }
  function storeViews(next: ChestView[]) {
    const saved = readChestViews(next);
    setViews(saved);
    writeJson(CRB_VIEW_KEY, saved);
  }
  function storeDensity(next: ChestDensity) {
    setDensity(next);
    writeJson(CRB_DENSITY_KEY, next);
  }
  const clerks = chestClerks(chests);
  const timbers = chestTimbers(chests);
  const bars = TIMBERS.map((item) => ({ timber: item.toUpperCase(), count: chests.filter((chest) => chest.timber === item.toUpperCase()).length })).filter((row) => row.count > 0);
  const clerkOn = activeClerk(clerkFilter, clerks);
  const timberOn = activeTimber(timberFilter, timbers);
  const sealOn = activeSeal(sealFilter, ["wax", "cord", "lock"]);
  const bayOn = activeBay(bayFilter);
  const spanOn = activeSpan(spanFilter);
  const dustOn = activeDust(dustFilter);
  const pickedBay = bayArg(bayOn);
  const shown = sortChests(visibleChests(
    chests,
    tray,
    query,
    clerkArg(clerkOn),
    timberArg(timberOn),
    sealArg(sealOn),
    pickedBay.exact,
    pickedBay.pick,
    spanArg(spanOn),
    dustArg(dustOn),
    lockOnly,
    peakOnly,
    houseOnly,
    quietOnly,
    dryOnly,
  ), order);
  const ledger = chestLedger(chests, query);
  const counts = chestCounts(chests, deskBay);
  const clashes = clashBayCount(chests);
  const spans = spanClashCount(chests);
  const neighbors = adjacentChestCount(chests);
  const nextId = nextChest(chests, deskBay);
  const nextRow = chests.find((chest) => chest.id === nextId);
  const suggestedTimber = suggestTimber(chests);
  const suggestedClerk = suggestClerk(chests);
  const suggestedSpan = suggestSpan(chests);
  const fair = fairClerk(chests, roster);
  const busy = busiestClerk(chests);
  const reminders = reminderChests(chests, deskBay);
  const windowRows = windowChests(chests, deskBay);
  const share = lateShare(chests, deskBay);
  const matched = matchedChests(chests, deskBay);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  pinRef.current = () => {
    if (viewer) return;
    const ids = (board === "ledger" ? ledger : shown).map((chest) => chest.id);
    store(pinFocused(chests, ids, focus));
  };
  spanRef.current = () => {
    if (viewer) return;
    const ids = (board === "ledger" ? ledger : shown).map((chest) => chest.id);
    store(snoozeFocused(chests, ids, focus));
  };
  holdRef.current = () => {
    if (viewer) return;
    const ids = (board === "ledger" ? ledger : shown).map((chest) => chest.id);
    store(holdFocused(chests, ids, focus));
  };
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
      if (event.key === "p" || event.key === "P") {
        event.preventDefault();
        pinRef.current();
        return;
      }
      if (event.key === "s" || event.key === "S") {
        event.preventDefault();
        spanRef.current();
        return;
      }
      if (event.key === "h" || event.key === "H") {
        event.preventDefault();
        holdRef.current();
        return;
      }
      if (event.key === "b" || event.key === "B") {
        event.preventDefault();
        setBoard((current) => (current === "gallery" ? "ledger" : "gallery"));
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
    setBay("");
    setTimber("");
    setSeal("");
    setSpanValue("");
    setMark("");
    setQuery("");
    setEditing("");
  }
  function applyView(view: ChestView) {
    setTray(view.tray);
    setQuery(view.query);
    setClerkFilter(view.clerk);
    setTimberFilter(view.timber);
    setSealFilter(view.seal);
    setBayFilter(view.bay);
    setSpanFilter(view.span);
    setDustFilter(view.dust);
  }
  const rows = board === "ledger" ? ledger : shown;
  return (
    <section className="c4-crb" aria-label={v4("crbTitle")} data-chests="1" data-role={role} data-density={density}>
      <div className="c4-crb-sheet">
        <header className="c4-crb-mast">
          <p className="c4-crb-spine">{v4("crbSpine")}</p>
          <div>
            <p className="c4-crb-kicker">{v4("crbSub")}</p>
            <h2 className="c4-title">{v4("crbTitle")}</h2>
          </div>
          <p className="c4-crb-plate" data-logo="mono">{v4("crbLogo")}</p>
        </header>
        <div className="c4-crb-body">
          <p className="c4-crb-rules">{v4("crbHint")}</p>
          <p className="c4-meta">{v4("crbLocal")}</p>
          <p className="c4-meta">{v4("crbNew")} {v4("crbSlash")} {v4("crbEscape")} {v4("crbKeys")} {v4("crbPinKey")} {v4("crbSpanKey")} {v4("crbHoldKey")} {v4("crbBoardKey")}</p>
          {viewer && <p className="c4-crb-notice" data-viewer="1">{v4("crbViewer")}</p>}
          {counts.peak > 0 && (
            <p className="c4-crb-notice" role="status">
              {v4("crbNotice")} · {counts.peak}
              <button type="button" className="c4-btn" onClick={() => setPeakOnly((on) => !on)}>{peakOnly ? v4("crbNoticeAll") : v4("crbNoticePeak")}</button>
            </p>
          )}
          {counts.late > 0 && <p className="c4-crb-notice" role="status" data-late="1">{v4("crbLateNotice")} · {counts.late}</p>}
          <ol className="c4-crb-ledger" aria-label={v4("crbKpi")}>
            <li><span>{v4("crbOpen")}</span><strong>{counts.open}</strong></li>
            <li><span>{v4("crbHeld")}</span><strong>{counts.held}</strong></li>
            <li><span>{v4("crbClosed")}</span><strong>{counts.closed}</strong></li>
            <li><span>{v4("crbPinned")}</span><strong>{counts.pinned}</strong></li>
            <li><span>{v4("crbPeak")}</span><strong>{counts.peak}</strong></li>
            <li><span>{v4("crbLate")}</span><strong>{counts.late}</strong></li>
            <li><span>{v4("crbSoon")}</span><strong>{counts.soon}</strong></li>
            <li><span>{v4("crbDust")}</span><strong>{counts.dust}</strong></li>
            <li><span>{v4("crbMatched")}</span><strong>{matched}</strong></li>
            <li><span>{v4("crbHouseShare")}</span><strong>{chestShare(counts.house, chests.length)}%</strong></li>
            <li><span>{v4("crbLateShare")}</span><strong>{share}%</strong></li>
          </ol>
          <div className="c4-crb-sla" aria-label={v4("crbLateShare")}>
            <span>{v4("crbLateShare")}</span>
            <div className="c4-crb-track" aria-hidden="true"><i style={{ width: `${share}%` }} /></div>
          </div>
          <div className="c4-crb-rail" aria-label={v4("crbTimbers")}>
            {bars.map((bar) => (
              <div key={bar.timber} className="c4-crb-meter" data-timber={bar.timber.toLowerCase()}>
                <button type="button" className="c4-btn" onClick={() => setTimberFilter(bar.timber)}>{timberLabel(v4, bar.timber)} · {bar.count}</button>
                <div className="c4-crb-track" aria-hidden="true"><i style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} /></div>
              </div>
            ))}
            {!bars.length && <p className="c4-crb-empty">{v4("crbEmpty")}</p>}
          </div>
          <div className="c4-crb-suggest">
            <p>{v4("crbSuggestTimber")} · {timberLabel(v4, suggestedTimber)}</p>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => setTimber(suggestedTimber.toLowerCase())}>{v4("crbUseTimber")}</button>
            <p>{v4("crbSuggestClerk")} · {suggestedClerk || v4("crbBlankClerk")}</p>
            <button type="button" className="c4-btn" disabled={viewer || !suggestedClerk} onClick={() => setClerk(suggestedClerk)}>{v4("crbUseClerk")}</button>
            <p>{v4("crbSuggestSpan")} · {spanLabel(v4, suggestedSpan)}</p>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => setSpanValue(String(suggestedSpan))}>{v4("crbUseSpan")}</button>
            <p>{v4("crbAssign")} · {fair || v4("crbBlankClerk")}</p>
            <button type="button" className="c4-btn" disabled={viewer || !fair} onClick={() => setClerk(fair)}>{v4("crbAssign")}</button>
          </div>
          <p className="c4-meta">{v4("crbBays")} · {usedBays(chests)}</p>
          <p className="c4-meta">{clashes ? `${v4("crbClash")} · ${clashes}` : v4("crbClashNone")}</p>
          <p className="c4-meta">{spans ? `${v4("crbSpanClash")} · ${spans}` : v4("crbSpanClashNone")}</p>
          <p className="c4-meta">{neighbors ? `${v4("crbAdjacent")} · ${neighbors}` : v4("crbAdjacentNone")}</p>
          <p className="c4-meta">{pairClerkCount(chests) ? `${v4("crbPairs")} · ${pairClerkCount(chests)}` : v4("crbPairsNone")}</p>
          <p className="c4-meta">{sharedTimberCount(chests) ? `${v4("crbSharedTimber")} · ${sharedTimberCount(chests)}` : v4("crbSharedTimberNone")}</p>
          <p className="c4-meta">{`${v4("crbDustLoad")} · ${dustLoad(chests)}`}</p>
          <p className="c4-meta">{`${v4("crbQuietHouse")} · ${quietHouseCount(chests)}`}</p>
          <p className="c4-meta">{`${v4("crbLockLoad")} · ${lockLoad(chests)}`}</p>
          <p className="c4-meta">{`${v4("crbBaySpan")} · ${baySpan(chests)}`}</p>
          <p className="c4-meta">{nextRow ? `${v4("crbNext")} · ${nextRow.title}` : v4("crbNextNone")}</p>
          <p className="c4-meta">{busy ? `${v4("crbBusiest")} · ${busy}` : v4("crbBusiestNone")}</p>
          <div className="c4-crb-reminders" aria-label={v4("crbReminders")}>
            {reminders.length ? reminders.map((chest) => <span key={chest.id}>{chest.title}</span>) : <span>{v4("crbReminderNone")}</span>}
          </div>
          <div className="c4-crb-window" aria-label={v4("crbWindow")}>
            {windowRows.length ? windowRows.map((chest) => <span key={chest.id}>{chest.title}</span>) : <span>{v4("crbWindowNone")}</span>}
          </div>
          <label className="c4-lab">{v4("crbSearch")}<input ref={searchRef} className="c4-field" aria-label={v4("crbSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
          <div className="c4-crb-filters" role="group" aria-label={v4("crbSearch")}>
            {(["open", "held", "closed"] as const).map((item) => (
              <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{item === "open" ? v4("crbOpenTray") : item === "held" ? v4("crbHeldTray") : v4("crbClosedTray")}</button>
            ))}
            <button type="button" className="c4-chip" data-on={clerkOn === "all" ? "1" : "0"} onClick={() => setClerkFilter("all")}>{v4("crbAll")}</button>
            <button type="button" className="c4-chip" data-on={clerkOn === "blank" ? "1" : "0"} onClick={() => setClerkFilter("blank")}>{v4("crbBlankClerk")}</button>
            {clerks.map((name) => (
              <button key={name} type="button" className="c4-chip" data-on={clerkOn === name ? "1" : "0"} onClick={() => setClerkFilter(name)}>{name}</button>
            ))}
            <button type="button" className="c4-chip" data-on={timberOn === "all" ? "1" : "0"} onClick={() => setTimberFilter("all")}>{v4("crbTimber")}</button>
            <button type="button" className="c4-chip" data-on={timberOn === "blank" ? "1" : "0"} onClick={() => setTimberFilter("blank")}>{v4("crbBlankTimber")}</button>
            {TIMBERS.map((item) => (
              <button key={item} type="button" className="c4-chip" data-on={timberOn === item.toUpperCase() ? "1" : "0"} onClick={() => setTimberFilter(item)}>{timberLabel(v4, item)}</button>
            ))}
            <button type="button" className="c4-chip" data-on={sealOn === "all" ? "1" : "0"} onClick={() => setSealFilter("all")}>{v4("crbSeal")}</button>
            {SEALS.map((item) => (
              <button key={item} type="button" className="c4-chip" data-on={sealOn === item ? "1" : "0"} onClick={() => setSealFilter(item)}>{sealLabel(v4, item)}</button>
            ))}
            {["all", "blank", "early", "mid", "late", "peak", "quiet", "1", "6"].map((item) => (
              <button key={item} type="button" className="c4-chip" data-on={bayOn === item ? "1" : "0"} onClick={() => setBayFilter(item)}>{item === "all" ? v4("crbBay") : item === "blank" ? v4("crbBlankBay") : item === "early" ? v4("crbEarly") : item === "mid" ? v4("crbMid") : item === "late" ? v4("crbLateBay") : item === "peak" ? v4("crbPeak") : item === "quiet" ? v4("crbQuiet") : item}</button>
            ))}
            {["all", "blank", "6", "12", "24"].map((item) => (
              <button key={`s${item}`} type="button" className="c4-chip" data-on={spanOn === item ? "1" : "0"} onClick={() => setSpanFilter(item)}>{item === "all" ? v4("crbSpan") : item === "blank" ? v4("crbBlankSpan") : spanLabel(v4, Number(item))}</button>
            ))}
            {["all", "blank", "0", "3", "9"].map((item) => (
              <button key={`d${item}`} type="button" className="c4-chip" data-on={dustOn === item ? "1" : "0"} onClick={() => setDustFilter(item)}>{item === "all" ? v4("crbDust") : item === "blank" ? v4("crbBlankDust") : item}</button>
            ))}
            <button type="button" className="c4-chip" data-on={lockOnly ? "1" : "0"} onClick={() => setLockOnly((on) => !on)}>{v4("crbLockOnly")}</button>
            <button type="button" className="c4-chip" data-on={peakOnly ? "1" : "0"} onClick={() => setPeakOnly((on) => !on)}>{v4("crbPeakOnly")}</button>
            <button type="button" className="c4-chip" data-on={houseOnly ? "1" : "0"} onClick={() => setHouseOnly((on) => !on)}>{v4("crbHouseOnly")}</button>
            <button type="button" className="c4-chip" data-on={quietOnly ? "1" : "0"} onClick={() => setQuietOnly((on) => !on)}>{v4("crbQuietOnly")}</button>
            <button type="button" className="c4-chip" data-on={dryOnly ? "1" : "0"} onClick={() => setDryOnly((on) => !on)}>{v4("crbDryOnly")}</button>
            <button type="button" className="c4-chip" data-on={order === "bay" ? "1" : "0"} onClick={() => setOrder(sortMode("bay"))}>{v4("crbSortBay")}</button>
            <button type="button" className="c4-chip" data-on={order === "clerk" ? "1" : "0"} onClick={() => setOrder(sortMode("clerk"))}>{v4("crbSortClerk")}</button>
            <button type="button" className="c4-chip" data-on={density === "tall" ? "1" : "0"} onClick={() => storeDensity("tall")}>{v4("crbTall")}</button>
            <button type="button" className="c4-chip" data-on={density === "low" ? "1" : "0"} onClick={() => storeDensity("low")}>{v4("crbLow")}</button>
            <button type="button" className="c4-chip" data-on={board === "gallery" ? "1" : "0"} onClick={() => setBoard("gallery")}>{v4("crbGallery")}</button>
            <button type="button" className="c4-chip" data-on={board === "ledger" ? "1" : "0"} onClick={() => setBoard("ledger")}>{v4("crbLedger")}</button>
          </div>
          <form className="c4-crb-form" onSubmit={(event) => {
            event.preventDefault();
            if (viewer) return;
            store(addChest(chests, { id: `crb-${Date.now()}`, title, note, clerk, bay, timber, seal, span: spanValue, marks: mark }));
            clearDraft();
          }}>
            <label className="c4-lab">{v4("crbLine")}<input ref={titleRef} className="c4-field" aria-label={v4("crbLine")} value={title} onChange={(event) => setTitle(event.target.value)} /></label>
            <label className="c4-lab">{v4("crbNote")}<input className="c4-field" aria-label={v4("crbNote")} value={note} onChange={(event) => setNote(event.target.value)} /></label>
            <label className="c4-lab">{v4("crbClerk")}<input className="c4-field" aria-label={v4("crbClerk")} value={clerk} onChange={(event) => setClerk(event.target.value)} /></label>
            <label className="c4-lab">{v4("crbBay")}<input className="c4-field" aria-label={v4("crbBay")} value={bay} onChange={(event) => setBay(event.target.value)} /></label>
            <label className="c4-lab">{v4("crbTimber")}<input className="c4-field" aria-label={v4("crbTimber")} value={timber} onChange={(event) => setTimber(event.target.value)} /></label>
            <label className="c4-lab">{v4("crbSeal")}<input className="c4-field" aria-label={v4("crbSeal")} value={seal} onChange={(event) => setSeal(event.target.value)} /></label>
            <label className="c4-lab">{v4("crbSpan")}<input className="c4-field" aria-label={v4("crbSpan")} value={spanValue} onChange={(event) => setSpanValue(event.target.value)} /></label>
            <label className="c4-lab">{v4("crbMark")}<input className="c4-field" aria-label={v4("crbMark")} value={mark} onChange={(event) => setMark(event.target.value)} /></label>
            <button type="submit" className="c4-btn" disabled={viewer}>{v4("crbSave")}</button>
          </form>
          <label className="c4-lab">{v4("crbDeskBay")}<input className="c4-field" aria-label={v4("crbDeskBay")} value={deskBay} onChange={(event) => setDeskBay(event.target.value)} /></label>
          <label className="c4-lab">{v4("crbRoster")}<input className="c4-field" aria-label={v4("crbRoster")} value={roster} onChange={(event) => setRoster(event.target.value)} /></label>
          <div className="c4-crb-views">
            <label className="c4-lab">{v4("crbViewName")}<input className="c4-field" aria-label={v4("crbViewName")} value={viewName} onChange={(event) => setViewName(event.target.value)} /></label>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => {
              const name = viewName.trim();
              if (!name) return;
              storeViews(addChestView(views, { id: `view-${Date.now()}`, name, tray, query, clerk: clerkOn, timber: timberOn, seal: sealOn, bay: bayOn, span: spanOn, dust: dustOn }));
              setViewName("");
            }}>{v4("crbSaveView")}</button>
            {views.map((view) => (
              <span key={view.id}>
                <button type="button" className="c4-btn" onClick={() => applyView(view)}>{view.name}</button>
                <button type="button" className="c4-btn" disabled={viewer} aria-label={v4("crbDropView")} onClick={() => storeViews(dropChestView(views, view.id))}>×</button>
              </span>
            ))}
          </div>
          <div className="c4-crb-bulk">
            <label className="c4-lab">{v4("crbBulkTimber")}<input className="c4-field" aria-label={v4("crbBulkTimber")} value={moveTimber} onChange={(event) => setMoveTimber(event.target.value)} /></label>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkChestTimber(chests, picked, moveTimber))}>{v4("crbBulkTimber")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkChestPin(chests, picked, true))}>{v4("crbBulkPin")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkChestClose(chests, picked, true))}>{v4("crbBulkClose")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkChestMark(chests, picked, mark))}>{v4("crbBulkMark")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkChestSeal(chests, picked, seal))}>{v4("crbBulkSeal")}</button>
            <button type="button" className="c4-btn" onClick={() => download("crypt-chests.csv", chestsCsv(chests, deskBay))}>{v4("crbCsv")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(resetChests())}>{v4("crbReset")}</button>
          </div>
          {!rows.length && <p className="c4-crb-empty">{v4("crbEmpty")}</p>}
          <ol className={board === "ledger" ? "c4-crb-time" : "c4-crb-book"}>
            {rows.map((chest, index) => (
              <li key={chest.id} data-focus={focus === index ? "1" : "0"} data-late={lateChest(chest, deskBay) ? "1" : "0"} data-soon={soonChest(chest) ? "1" : "0"} data-peak={peakBay(chest.bay) ? "1" : "0"} data-quiet={quietBay(chest.bay) ? "1" : "0"} data-house={houseTimber(chest.timber) ? "1" : "0"} data-pinned={chest.pinned ? "1" : "0"} data-dust={chest.dust ? "1" : "0"}>
                <label className="c4-check"><input type="checkbox" checked={picked.includes(chest.id)} onChange={() => setPicked((ids) => ids.includes(chest.id) ? ids.filter((id) => id !== chest.id) : [...ids, chest.id])} /><span>{chest.bay ?? "—"}</span></label>
                <div>
                  {editing === chest.id ? (
                    <div className="c4-row">
                      <input className="c4-field" aria-label={v4("crbLine")} value={draft} onChange={(event) => setDraft(event.target.value)} />
                      <input className="c4-field" aria-label={v4("crbNote")} value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} />
                      <button type="button" className="c4-btn" disabled={viewer} onClick={() => { store(editChestNote(editChest(chests, chest.id, draft), chest.id, noteDraft)); setEditing(""); }}>{v4("crbSave")}</button>
                    </div>
                  ) : (
                    <>
                      <strong>{chest.title}</strong>
                      <span className="c4-meta">{chest.clerk || v4("crbBlankClerk")} · {timberLabel(v4, chest.timber)} · {sealLabel(v4, chest.seal)} · {spanLabel(v4, chest.span)} · {gapLabel(v4, chest.bay, deskBay)}</span>
                      {chest.note && <p>{chest.note}</p>}
                      {!!chest.marks.length && <p className="c4-meta">{chest.marks.join(" ")}</p>}
                      {chest.audit && <p className="c4-meta">{auditLabel(v4, chest.audit)}</p>}
                    </>
                  )}
                  <div className="c4-row">
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setChestPin(chests, chest.id, !chest.pinned))}>{chest.pinned ? v4("crbUnpin") : v4("crbPin")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setChestHold(chests, chest.id, !chest.held))}>{chest.held ? v4("crbLift") : v4("crbHold")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cycleSeal(chests, chest.id))}>{v4("crbSeal")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addChestMark(chests, chest.id, mark))}>{v4("crbMark")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setChestClose(chests, chest.id, !chest.closed))}>{chest.closed ? v4("crbReopen") : v4("crbClose")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setChestDust(chests, chest.id, chest.dust ? 0 : 3))}>{chest.dust ? v4("crbDustOff") : v4("crbDustOn")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(snoozeChest(chests, chest.id))}>{v4("crbSnooze")}</button>
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(chest.id); setDraft(chest.title); setNoteDraft(chest.note); }}>{v4("crbEdit")}</button>
                    <button type="button" className="c4-btn" onClick={() => { const line = chestCopy(chest, deskBay); void navigator.clipboard?.writeText(line); setCopied(chest.id); }}>{copied === chest.id ? v4("crbCopied") : v4("crbCopy")}</button>
                  </div>
                </div>
              </li>
            ))}
          </ol>
          <p className="c4-crb-rules">{v4("crbRules")}</p>
        </div>
      </div>
    </section>
  );
}

export function ResidencySeals({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [query, setQuery] = useState("");
  const [lane, setLane] = useState("all");
  const [tone, setTone] = useState("all");
  const [shape, setShape] = useState<SealShape>("all");
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
    note: { isResident: user.isResident ?? null },
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
    const present = presentSeals(rows);
    const ids = rows.map((row) => row.id);
    const nextHidden = readHiddenSeals(readJson(RSD_KEY, []), present);
    const nextReviewed = readReviewedSeals(readJson(RSD_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(RSD_KEY, nextHidden);
    writeJson(RSD_REVIEW_KEY, nextReviewed);
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
  const present = presentSeals(rows);
  const lanes = visibleSealLanes(present, hidden, showHidden);
  const laneOn = activeSealLane(lane, present);
  const toneOn = activeSealTone(tone);
  const shown = visibleSealCustomers(rows, sealLaneArg(laneOn), sealToneArg(toneOn), query, review, reviewed, shape)
    .filter((row) => {
      const state = sealState(row.note);
      const token = state === "set" ? sealLane(row.note) : state === "clear" ? "blank" : "";
      if (!token) return true;
      return lanes.includes(token);
    });
  const lead = leadingSeal(rows);
  const toneLead = leadingSealTone(rows);
  const shared = sharedSealCount(rows);
  const catalog = catalogSealCount(rows);
  const bars = sealLanes(rows).filter((line) => line.lane);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const ids = rows.map((row) => row.id);
  function storeHidden(next: string[]) {
    setHidden(next);
    writeJson(RSD_KEY, next);
  }
  function storeReviewed(next: string[]) {
    const saved = readReviewedSeals(next, ids);
    setReviewed(saved);
    writeJson(RSD_REVIEW_KEY, saved);
  }
  return (
    <section className="c4-rsd" aria-label={v4("rsdTitle")} data-seals="1" data-role={role} data-catalog={catalog ? "1" : "0"}>
      <div className="c4-rsd-sheet">
        <header className="c4-rsd-mast">
          <div>
            <p className="c4-rsd-kicker">{v4("rsdSub")}</p>
            <h2 className="c4-title">{v4("rsdTitle")}</h2>
          </div>
          <p className="c4-rsd-plate" data-logo="mono">{v4("rsdLogo")}</p>
        </header>
        <p className="c4-rsd-rules">{v4("rsdHint")}</p>
        <p className="c4-meta">{v4("rsdKept")} {v4("rsdEscape")}</p>
        {viewer && <p className="c4-rsd-notice" data-viewer="1">{v4("rsdViewer")}</p>}
        {data.error && <p className="c4-rsd-empty" role="alert">{v4("rsdFailed")}</p>}
        {data.loading && <p className="c4-meta">{v4("rsdLoading")}</p>}
        {shared > 0 && <p className="c4-rsd-notice" role="status">{v4("rsdNotice")} · {shared}</p>}
        <ol className="c4-rsd-ledger" aria-label={v4("rsdKpi")}>
          <li><span>{v4("rsdSet")}</span><strong>{rows.filter((row) => sealState(row.note) === "set").length}</strong></li>
          <li><span>{v4("rsdCatalog")}</span><strong>{catalog}</strong></li>
          <li><span>{v4("rsdWide")}</span><strong>{wideSealCount(rows)}</strong></li>
          <li><span>{v4("rsdGiltCount")}</span><strong>{giltSealCount(rows)}</strong></li>
          <li><span>{v4("rsdShare")}</span><strong>{sealShare(catalog, rows.length)}%</strong></li>
          <li><span>{v4("rsdShared")}</span><strong>{shared}</strong></li>
        </ol>
        <div className="c4-rsd-rail" aria-label={v4("rsdLanes")}>
          {bars.map((bar) => (
            <div key={bar.lane} className="c4-rsd-meter">
              <button type="button" className="c4-btn" onClick={() => setLane(bar.lane)}>{laneLabel(v4, bar.lane)} · {bar.count}</button>
              <div className="c4-rsd-track" aria-hidden="true"><i style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} /></div>
            </div>
          ))}
          {!bars.length && <p className="c4-rsd-empty">{v4("rsdEmpty")}</p>}
        </div>
        <div className="c4-rsd-suggest">
          <p>{v4("rsdLeading")} · {lead ? laneLabel(v4, lead) : v4("rsdLeadingNone")}</p>
          <p>{v4("rsdToneLead")} · {toneLead ? toneLabel(v4, toneLead) : v4("rsdToneNone")}</p>
          <p>{shared ? `${v4("rsdShared")} · ${shared}` : v4("rsdSharedNone")}</p>
        </div>
        <label className="c4-lab">{v4("rsdSearch")}<input ref={searchRef} className="c4-field" aria-label={v4("rsdSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <div className="c4-rsd-filters">
          <button type="button" className="c4-chip" data-on={laneOn === "all" ? "1" : "0"} onClick={() => setLane("all")}>{v4("rsdAll")}</button>
          <button type="button" className="c4-chip" data-on={laneOn === "blank" ? "1" : "0"} onClick={() => setLane("blank")}>{v4("rsdClear")}</button>
          {LANES.map((item) => (
            <button key={item} type="button" className="c4-chip" data-on={laneOn === item ? "1" : "0"} onClick={() => setLane(item)}>{laneLabel(v4, item)}</button>
          ))}
          <button type="button" className="c4-chip" data-on={toneOn === "all" ? "1" : "0"} onClick={() => setTone("all")}>{v4("rsdTone")}</button>
          <button type="button" className="c4-chip" data-on={toneOn === "gilt" ? "1" : "0"} onClick={() => setTone("gilt")}>{v4("rsdGilt")}</button>
          <button type="button" className="c4-chip" data-on={toneOn === "ivory" ? "1" : "0"} onClick={() => setTone("ivory")}>{v4("rsdIvory")}</button>
          {(["all", "catalog", "wide", "gilt"] as const).map((item) => (
            <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{item === "all" ? v4("rsdAllShapes") : item === "catalog" ? v4("rsdCatalog") : item === "wide" ? v4("rsdWide") : v4("rsdGilt")}</button>
          ))}
          <button type="button" className="c4-chip" data-on={review === "all" ? "1" : "0"} onClick={() => setReview("all")}>{v4("rsdAllReview")}</button>
          <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} onClick={() => setReview("reviewed")}>{v4("rsdReviewed")}</button>
          <button type="button" className="c4-chip" data-on={review === "open" ? "1" : "0"} onClick={() => setReview("open")}>{v4("rsdOpenReview")}</button>
          <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((on) => !on)}>{showHidden ? v4("rsdShown") : v4("rsdHidden")}</button>
        </div>
        <div className="c4-rsd-bands">
          {present.map((item) => (
            <button key={item} type="button" className="c4-btn" disabled={viewer} onClick={() => storeHidden(toggleSeal(hidden, item))}>
              {laneLabel(v4, item)} · {hidden.includes(item) ? v4("rsdShow") : v4("rsdHide")}
            </button>
          ))}
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkSealReview(reviewed, shown.map((row) => row.id), true))}>{v4("rsdBulkReview")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkSealReview(reviewed, ids, false))}>{v4("rsdBulkClear")}</button>
          <button type="button" className="c4-btn" onClick={() => download("residency-seals.csv", sealsCsv(rows))}>{v4("rsdCsv")}</button>
          <button type="button" className="c4-btn" onClick={() => download("residency-seal-rows.csv", sealRowsCsv(rows, reviewed))}>{v4("rsdRowCsv")}</button>
          <Link className="c4-btn" href={crmv4Href(base, "customers")}>{v4("rsdCustomers")}</Link>
        </div>
        {!shown.length && <p className="c4-rsd-empty">{v4("rsdEmpty")}</p>}
        <ul className="c4-rsd-index">
          {shown.map((row) => {
            const state = sealState(row.note);
            const mark = sealOf(row.note);
            return (
              <li key={row.id} data-state={state || "blank"} data-lane={state === "set" ? sealLane(row.note) : "blank"} data-tone={sealTone(row.note) || "blank"} data-catalog={catalogSeal(row.note) ? "1" : "0"} data-reviewed={reviewed.includes(row.id) ? "1" : "0"}>
                <p className="c4-rsd-mark" data-logo="mono">{mark || "—"}</p>
                <div>
                  <strong>{row.label || row.id}</strong>
                  <span className="c4-meta">{laneLabel(v4, state === "set" ? sealLane(row.note) : state === "clear" ? "blank" : "")} · {toneLabel(v4, sealTone(row.note))}</span>
                  {catalogSeal(row.note) && <span className="c4-meta">{v4("rsdCatalogMark")}</span>}
                  <div className="c4-row">
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleSealReview(reviewed, row.id))}>{v4("rsdReview")}</button>
                    <button type="button" className="c4-btn" onClick={() => { const line = sealCopy(row.note); void navigator.clipboard?.writeText(line); setCopied(row.id); }}>{copied === row.id ? v4("rsdCopied") : v4("rsdCopy")}</button>
                    <Link className="c4-btn" href={crmv4Href(base, `customers/${row.id}`)}>{row.label || row.id}</Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        <p className="c4-rsd-rules">{v4("rsdRules")}</p>
      </div>
    </section>
  );
}
