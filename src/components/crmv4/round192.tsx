"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  DIAL_KEY,
  DIAL_REVIEW_KEY,
  HOLD_DENSITY_KEY,
  HOLD_KEY,
  HOLD_VIEW_KEY,
  activeBay,
  activeDialBand,
  activeDialTone,
  activeHour,
  activeKeeper,
  activePosture,
  activeRibbon,
  activeWeight,
  activeWindow,
  addHold,
  addHoldTag,
  addHoldView,
  bayArg,
  bulkDialReview,
  bulkHoldClose,
  bulkHoldPin,
  bulkHoldRibbon,
  bulkHoldTag,
  busiestKeeper,
  catalogDial,
  catalogDialCount,
  clashHourCount,
  cyclePosture,
  densityOf,
  dialBand,
  dialBandArg,
  dialBands,
  dialCopy,
  dialRowsCsv,
  dialShare,
  dialState,
  dialTone,
  dialToneArg,
  dialsCsv,
  dropHoldTag,
  dropHoldView,
  editHold,
  editHoldNote,
  fairKeeper,
  holdBays,
  holdCopy,
  holdCounts,
  holdKeepers,
  holdShare,
  holdTimeline,
  holdsCsv,
  hourArg,
  hourGap,
  houseBay,
  keeperArg,
  lateHold,
  leadingDial,
  leadingDialTone,
  moveFocus,
  nextHold,
  openDialCount,
  postureArg,
  sharedDialCount,
  presentDials,
  readHiddenDials,
  readHoldViews,
  readHolds,
  readReviewedDials,
  reminderHolds,
  resetHolds,
  ribbonArg,
  ribbonCounts,
  setHoldClose,
  setHoldPark,
  setHoldPin,
  setHoldSnooze,
  soonHold,
  sortHolds,
  sortMode,
  suggestKeeper,
  suggestRibbon,
  suggestWindow,
  toggleDial,
  toggleDialReview,
  usedHours,
  visibleDialBands,
  visibleDialCustomers,
  visibleHolds,
  weightArg,
  weightClashCount,
  wideDialCount,
  windowArg,
  type DialRow,
  type DialShape,
  type Hold,
  type HoldDensity,
  type HoldPosture,
  type HoldRibbon,
  type HoldSort,
  type HoldTray,
  type HoldView,
} from "@/lib/crmv4/round192";
import { useJson } from "./kit";
import { storedRole } from "./round5";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  phone?: string | null;
};

type GlanceRow = DialRow & { id: string };

const RIBBONS = ["silk", "wool", "velvet", "satin"] as const;
const BANDS = ["slip", "card", "folio"] as const;

function ribbonName(v4: V4, ribbon: HoldRibbon | string): string {
  if (ribbon === "silk") return v4("qhdSilk");
  if (ribbon === "wool") return v4("qhdWool");
  if (ribbon === "velvet") return v4("qhdVelvet");
  if (ribbon === "satin") return v4("qhdSatin");
  return v4("qhdBlankRibbon");
}

function postureName(v4: V4, posture: HoldPosture | string): string {
  if (posture === "queue") return v4("qhdQueue");
  if (posture === "watch") return v4("qhdWatch");
  if (posture === "release") return v4("qhdRelease");
  return v4("qhdBlankPosture");
}

function weightName(v4: V4, weight: number | null): string {
  if (weight === 1) return v4("qhdWeight1");
  if (weight === 3) return v4("qhdWeight3");
  if (weight === 5) return v4("qhdWeight5");
  return v4("qhdBlankWeight");
}

function windowName(v4: V4, window: number | null): string {
  if (window === 1) return v4("qhdWindow1");
  if (window === 3) return v4("qhdWindow3");
  if (window === 7) return v4("qhdWindow7");
  return v4("qhdBlankWindow");
}

function bandName(v4: V4, name: string): string {
  if (name === "slip") return v4("dlnSlip");
  if (name === "card") return v4("dlnCard");
  if (name === "folio") return v4("dlnFolio");
  if (name === "blank") return v4("dlnClear");
  return v4("dlnUnmarked");
}

function toneName(v4: V4, name: string): string {
  if (name === "open") return v4("dlnOpenTone");
  if (name === "shut") return v4("dlnShut");
  return v4("dlnUnmarked");
}

function auditName(v4: V4, audit: string): string {
  const key = {
    save: "qhdAuditSave",
    edit: "qhdAuditEdit",
    posture: "qhdAuditPosture",
    pin: "qhdAuditPin",
    unpin: "qhdAuditUnpin",
    park: "qhdAuditPark",
    lift: "qhdAuditLift",
    close: "qhdAuditClose",
    reopen: "qhdAuditReopen",
    ribbon: "qhdAuditRibbon",
    tag: "qhdAuditTag",
    snooze: "qhdAuditSnooze",
  }[audit];
  return key ? v4(key as CrmV4CopyKey) : "";
}

function gapLabel(v4: V4, hour: number | null, desk: string): string {
  const gap = hourGap(hour, desk);
  if (gap === null) return "";
  if (gap > 0) return `${v4("qhdPast")} ${gap}`;
  if (gap < 0) return `${v4("qhdAhead")} ${Math.abs(gap)}`;
  return v4("qhdDue");
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

export function QuietHolds({ v4 }: { v4: V4 }) {
  const [cards, setCards] = useState<Hold[]>([]);
  const [views, setViews] = useState<HoldView[]>([]);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [keeper, setKeeper] = useState("");
  const [hour, setHour] = useState("");
  const [ribbon, setRibbon] = useState("");
  const [bay, setBay] = useState("");
  const [posture, setPosture] = useState("");
  const [weight, setWeight] = useState("");
  const [span, setSpan] = useState("");
  const [tag, setTag] = useState("");
  const [roster, setRoster] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<HoldTray>("open");
  const [keeperFilter, setKeeperFilter] = useState("all");
  const [ribbonFilter, setRibbonFilter] = useState("all");
  const [bayFilter, setBayFilter] = useState("all");
  const [postureFilter, setPostureFilter] = useState("all");
  const [hourFilter, setHourFilter] = useState("all");
  const [weightFilter, setWeightFilter] = useState("all");
  const [windowFilter, setWindowFilter] = useState("all");
  const [queueOnly, setQueueOnly] = useState(false);
  const [peakOnly, setPeakOnly] = useState(false);
  const [quietOnly, setQuietOnly] = useState(false);
  const [houseOnly, setHouseOnly] = useState(false);
  const [awakeOnly, setAwakeOnly] = useState(false);
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const [order, setOrder] = useState<HoldSort>("hour");
  const [density, setDensity] = useState<HoldDensity>("roomy");
  const [copied, setCopied] = useState("");
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [desk, setDesk] = useState("");
  const [moveRibbon, setMoveRibbon] = useState("satin");
  const [picked, setPicked] = useState<string[]>([]);
  const [focus, setFocus] = useState(0);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  useEffect(() => {
    const next = readHolds(readJson(HOLD_KEY, []));
    const saved = readHoldViews(readJson(HOLD_VIEW_KEY, []));
    setCards(next);
    setViews(saved);
    setDensity(densityOf(readJson(HOLD_DENSITY_KEY, "roomy")));
    writeJson(HOLD_KEY, next);
    writeJson(HOLD_VIEW_KEY, saved);
    setRole(storedRole());
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);
  function store(next: Hold[]) {
    const saved = readHolds(next);
    setCards(saved);
    writeJson(HOLD_KEY, saved);
    setPicked((ids) => ids.filter((id) => saved.some((card) => card.id === id)));
  }
  function storeViews(next: HoldView[]) {
    const saved = readHoldViews(next);
    setViews(saved);
    writeJson(HOLD_VIEW_KEY, saved);
  }
  function storeDensity(next: HoldDensity) {
    setDensity(next);
    writeJson(HOLD_DENSITY_KEY, next);
  }
  const keepers = holdKeepers(cards);
  const bays = holdBays(cards);
  const bars = ribbonCounts(cards);
  const keeperOn = activeKeeper(keeperFilter, keepers);
  const ribbonOn = activeRibbon(ribbonFilter, RIBBONS);
  const bayOn = activeBay(bayFilter, bays);
  const postureOn = activePosture(postureFilter, ["queue", "watch", "release"]);
  const hourOn = activeHour(hourFilter);
  const weightOn = activeWeight(weightFilter);
  const windowOn = activeWindow(windowFilter);
  const pickedHour = hourArg(hourOn);
  const shown = sortHolds(visibleHolds(
    cards,
    tray,
    query,
    keeperArg(keeperOn),
    ribbonArg(ribbonOn),
    bayArg(bayOn),
    postureArg(postureOn),
    pickedHour.exact,
    pickedHour.pick,
    weightArg(weightOn),
    windowArg(windowOn),
    queueOnly,
    peakOnly,
    houseOnly,
    quietOnly,
    awakeOnly,
  ), order);
  const timeline = holdTimeline(cards, query);
  const counts = holdCounts(cards, desk);
  const clashes = clashHourCount(cards);
  const weights = weightClashCount(cards);
  const nextId = nextHold(cards, desk);
  const nextCard = cards.find((card) => card.id === nextId);
  const suggestedRibbon = suggestRibbon(cards);
  const suggestedKeeper = suggestKeeper(cards);
  const suggestedWindow = suggestWindow(cards);
  const fair = fairKeeper(cards, roster);
  const busy = busiestKeeper(cards);
  const reminders = reminderHolds(cards, desk);
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
    setKeeper("");
    setHour("");
    setRibbon("");
    setBay("");
    setPosture("");
    setWeight("");
    setSpan("");
    setTag("");
    setQuery("");
    setEditing("");
  }
  return (
    <section className="c4-qhd" aria-label={v4("qhdTitle")} data-holds="1" data-role={role} data-density={density}>
      <header className="c4-qhd-mast">
        <div>
          <p className="c4-qhd-kicker">{v4("qhdSub")}</p>
          <h2 className="c4-title">{v4("qhdTitle")}</h2>
        </div>
        <p className="c4-qhd-plate" data-logo="mono">{v4("qhdLogo")}</p>
      </header>
      <p className="c4-qhd-rules">{v4("qhdHint")}</p>
      <p className="c4-meta">{v4("qhdLocal")}</p>
      <p className="c4-meta">{v4("qhdNew")} {v4("qhdSlash")} {v4("qhdEscape")} {v4("qhdKeys")}</p>
      {viewer && <p className="c4-qhd-notice" data-viewer="1">{v4("qhdViewer")}</p>}
      {counts.peak > 0 && (
        <p className="c4-qhd-notice" role="status">
          {v4("qhdNotice")} · {counts.peak}
          <button type="button" className="c4-btn" onClick={() => setPeakOnly((on) => !on)}>{peakOnly ? v4("qhdNoticeAll") : v4("qhdNoticePeak")}</button>
        </p>
      )}
      <dl className="c4-qhd-kpi" aria-label={v4("qhdKpi")}>
        <div><dt>{v4("qhdOpen")}</dt><dd>{counts.open}</dd></div>
        <div><dt>{v4("qhdParked")}</dt><dd>{counts.parked}</dd></div>
        <div><dt>{v4("qhdClosed")}</dt><dd>{counts.closed}</dd></div>
        <div><dt>{v4("qhdPinned")}</dt><dd>{counts.pinned}</dd></div>
        <div><dt>{v4("qhdPeak")}</dt><dd>{counts.peak}</dd></div>
        <div><dt>{v4("qhdLate")}</dt><dd>{counts.late}</dd></div>
        <div><dt>{v4("qhdSoon")}</dt><dd>{counts.soon}</dd></div>
        <div><dt>{v4("qhdSnoozed")}</dt><dd>{counts.snoozed}</dd></div>
        <div><dt>{v4("qhdHouseShare")}</dt><dd>{holdShare(counts.house, cards.length)}%</dd></div>
      </dl>
      <div className="c4-qhd-chart" aria-label={v4("qhdRibbons")}>
        {bars.map((bar) => (
          <div key={bar.ribbon} className="c4-qhd-col">
            <div className="c4-qhd-track" aria-hidden="true"><i style={{ height: `${Math.round((bar.count / maxBar) * 100)}%` }} /></div>
            <button type="button" className="c4-btn" onClick={() => setRibbonFilter(bar.ribbon)}>{ribbonName(v4, bar.ribbon)} · {bar.count}</button>
          </div>
        ))}
        {!bars.length && <p className="c4-empty-gold">{v4("qhdEmpty")}</p>}
      </div>
      <p className="c4-meta">{v4("qhdSuggestRibbon")} · {ribbonName(v4, suggestedRibbon)} · {v4("qhdSuggestKeeper")} · {suggestedKeeper || v4("qhdBlankKeeper")} · {v4("qhdSuggestWindow")} · {windowName(v4, suggestedWindow)}</p>
      <p className="c4-meta">{v4("qhdHourUse")} · {usedHours(cards)} · {clashes ? `${v4("qhdClash")} · ${clashes}` : v4("qhdClashNone")} · {weights ? `${v4("qhdWeightClash")} · ${weights}` : v4("qhdWeightClashNone")}</p>
      <p className="c4-meta">{nextCard ? `${v4("qhdNext")} · ${nextCard.title}` : v4("qhdNextNone")} · {busy ? `${v4("qhdBusiest")} · ${busy}` : v4("qhdBusiestNone")} · {reminders.length ? `${v4("qhdReminders")} · ${reminders.length}` : v4("qhdReminderNone")}</p>
      <form className="c4-qhd-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        store(addHold(cards, {
          id: `h${Date.now().toString(36)}`,
          title,
          note,
          keeper,
          hour,
          ribbon,
          bay,
          posture,
          weight,
          window: span,
          tags: tag,
        }));
        setTitle("");
        setNote("");
      }}>
        <label className="c4-lab"><span>{v4("qhdLine")}</span>
          <input ref={titleRef} className="c4-field" aria-label={v4("qhdLine")} value={title} disabled={viewer} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("qhdNote")}</span>
          <input className="c4-field" aria-label={v4("qhdNote")} value={note} disabled={viewer} onChange={(event) => setNote(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("qhdKeeper")}</span>
          <input className="c4-field" aria-label={v4("qhdKeeper")} value={keeper} disabled={viewer} onChange={(event) => setKeeper(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("qhdHour")}</span>
          <input className="c4-field" aria-label={v4("qhdHour")} value={hour} disabled={viewer} onChange={(event) => setHour(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("qhdRibbon")}</span>
          <select className="c4-field" aria-label={v4("qhdRibbon")} value={ribbon} disabled={viewer} onChange={(event) => setRibbon(event.target.value)}>
            <option value="">{v4("qhdBlankRibbon")}</option>
            {RIBBONS.map((item) => <option key={item} value={item}>{ribbonName(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("qhdBay")}</span>
          <input className="c4-field" aria-label={v4("qhdBay")} value={bay} disabled={viewer} onChange={(event) => setBay(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("qhdPosture")}</span>
          <select className="c4-field" aria-label={v4("qhdPosture")} value={posture} disabled={viewer} onChange={(event) => setPosture(event.target.value)}>
            <option value="">{v4("qhdBlankPosture")}</option>
            <option value="queue">{v4("qhdQueue")}</option>
            <option value="watch">{v4("qhdWatch")}</option>
            <option value="release">{v4("qhdRelease")}</option>
          </select>
        </label>
        <label className="c4-lab"><span>{v4("qhdWeight")}</span>
          <input className="c4-field" aria-label={v4("qhdWeight")} value={weight} disabled={viewer} onChange={(event) => setWeight(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("qhdWindow")}</span>
          <input className="c4-field" aria-label={v4("qhdWindow")} value={span} disabled={viewer} onChange={(event) => setSpan(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("qhdTag")}</span>
          <input className="c4-field" aria-label={v4("qhdTag")} value={tag} disabled={viewer} onChange={(event) => setTag(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("qhdRoster")}</span>
          <input className="c4-field" aria-label={v4("qhdRoster")} value={roster} disabled={viewer} onChange={(event) => setRoster(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("qhdAdd")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => setRibbon(suggestedRibbon)}>{v4("qhdUseRibbon")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !suggestedKeeper} onClick={() => setKeeper(suggestedKeeper)}>{v4("qhdUseKeeper")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => setSpan(String(suggestedWindow))}>{v4("qhdUseWindow")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !fair} onClick={() => setKeeper(fair)}>{v4("qhdAssign")}</button>
      </form>
      <p className="c4-meta">{v4("qhdBlank")} {v4("qhdHourBlank")}</p>
      <div className="c4-qhd-filters">
        <label className="c4-lab"><span>{v4("qhdSearch")}</span>
          <input ref={searchRef} className="c4-field" aria-label={v4("qhdSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            clearDraft();
          }} />
        </label>
        <label className="c4-lab"><span>{v4("qhdHour")}</span>
          <input className="c4-field" aria-label={v4("qhdDeskHour")} value={desk} onChange={(event) => setDesk(event.target.value)} />
        </label>
      </div>
      <div className="c4-row">
        {(["open", "parked", "closed"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} aria-pressed={tray === item} onClick={() => setTray(item)}>
            {item === "open" ? v4("qhdTrayOpen") : item === "parked" ? v4("qhdTrayParked") : v4("qhdTrayClosed")}
          </button>
        ))}
        <button type="button" className="c4-chip" data-on={queueOnly ? "1" : "0"} aria-pressed={queueOnly} onClick={() => setQueueOnly((on) => !on)}>{v4("qhdQueue")}</button>
        <button type="button" className="c4-chip" data-on={houseOnly ? "1" : "0"} aria-pressed={houseOnly} onClick={() => setHouseOnly((on) => !on)}>{v4("qhdHouse")}</button>
        <button type="button" className="c4-chip" data-on={quietOnly ? "1" : "0"} aria-pressed={quietOnly} onClick={() => setQuietOnly((on) => !on)}>{v4("qhdQuiet")}</button>
        <button type="button" className="c4-chip" data-on={awakeOnly ? "1" : "0"} aria-pressed={awakeOnly} onClick={() => setAwakeOnly((on) => !on)}>{v4("qhdAwake")}</button>
        <button type="button" className="c4-chip" data-on={board === "cards" ? "1" : "0"} aria-pressed={board === "cards"} onClick={() => setBoard("cards")}>{v4("qhdCards")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} aria-pressed={board === "timeline"} onClick={() => setBoard("timeline")}>{v4("qhdTimeline")}</button>
        <button type="button" className="c4-chip" data-on={order === "hour" ? "1" : "0"} aria-pressed={order === "hour"} onClick={() => setOrder(sortMode(order === "hour" ? "title" : "hour"))}>{order === "hour" ? v4("qhdSortHour") : v4("qhdSortTitle")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} aria-pressed={density === "tight"} onClick={() => storeDensity(densityOf(density === "tight" ? "roomy" : "tight"))}>{density === "tight" ? v4("qhdTight") : v4("qhdRoomy")}</button>
      </div>
      <div className="c4-qhd-filters">
        <label className="c4-lab"><span>{v4("qhdKeeper")}</span>
          <select className="c4-field" aria-label={v4("qhdKeeper")} value={keeperOn} onChange={(event) => setKeeperFilter(event.target.value)}>
            <option value="all">{v4("qhdAll")}</option>
            <option value="blank">{v4("qhdBlankKeeper")}</option>
            {keepers.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("qhdRibbon")}</span>
          <select className="c4-field" aria-label={v4("qhdRibbon")} value={ribbonOn} onChange={(event) => setRibbonFilter(event.target.value)}>
            <option value="all">{v4("qhdAll")}</option>
            <option value="blank">{v4("qhdBlankRibbon")}</option>
            {RIBBONS.map((item) => <option key={item} value={item}>{ribbonName(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("qhdBay")}</span>
          <select className="c4-field" aria-label={v4("qhdBay")} value={bayOn} onChange={(event) => setBayFilter(event.target.value)}>
            <option value="all">{v4("qhdAll")}</option>
            <option value="blank">{v4("qhdBlankBay")}</option>
            {bays.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("qhdPosture")}</span>
          <select className="c4-field" aria-label={v4("qhdPosture")} value={postureOn} onChange={(event) => setPostureFilter(event.target.value)}>
            <option value="all">{v4("qhdAll")}</option>
            <option value="blank">{v4("qhdBlankPosture")}</option>
            <option value="queue">{v4("qhdQueue")}</option>
            <option value="watch">{v4("qhdWatch")}</option>
            <option value="release">{v4("qhdRelease")}</option>
          </select>
        </label>
        <label className="c4-lab"><span>{v4("qhdHour")}</span>
          <select className="c4-field" aria-label={v4("qhdHour")} value={hourOn} onChange={(event) => setHourFilter(event.target.value)}>
            <option value="all">{v4("qhdAll")}</option>
            <option value="blank">{v4("qhdBlankHour")}</option>
            <option value="dawn">{v4("qhdDawn")}</option>
            <option value="day">{v4("qhdDay")}</option>
            <option value="night">{v4("qhdNight")}</option>
            <option value="peak">{v4("qhdPeak")}</option>
            <option value="quiet">{v4("qhdQuiet")}</option>
          </select>
        </label>
        <label className="c4-lab"><span>{v4("qhdWeight")}</span>
          <select className="c4-field" aria-label={v4("qhdWeight")} value={weightOn} onChange={(event) => setWeightFilter(event.target.value)}>
            <option value="all">{v4("qhdAll")}</option>
            <option value="blank">{v4("qhdBlankWeight")}</option>
            <option value="1">{v4("qhdWeight1")}</option>
            <option value="3">{v4("qhdWeight3")}</option>
            <option value="5">{v4("qhdWeight5")}</option>
          </select>
        </label>
        <label className="c4-lab"><span>{v4("qhdWindow")}</span>
          <select className="c4-field" aria-label={v4("qhdWindow")} value={windowOn} onChange={(event) => setWindowFilter(event.target.value)}>
            <option value="all">{v4("qhdAll")}</option>
            <option value="blank">{v4("qhdBlankWindow")}</option>
            <option value="1">{v4("qhdWindow1")}</option>
            <option value="3">{v4("qhdWindow3")}</option>
            <option value="7">{v4("qhdWindow7")}</option>
          </select>
        </label>
      </div>
      <form className="c4-row" onSubmit={(event) => {
        event.preventDefault();
        if (viewer || !viewName.trim()) return;
        storeViews(addHoldView(views, {
          id: `v${Date.now().toString(36)}`,
          name: viewName,
          tray,
          query,
          keeper: keeperOn,
          ribbon: ribbonOn,
          bay: bayOn,
          posture: postureOn,
          hour: hourOn,
          weight: weightOn,
          window: windowOn,
        }));
        setViewName("");
      }}>
        <label className="c4-lab"><span>{v4("qhdViews")}</span>
          <input className="c4-field" aria-label={v4("qhdViews")} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("qhdSaveView")}</button>
      </form>
      {!!views.length && (
        <ul className="c4-qhd-views">
          {views.map((view) => (
            <li key={view.id}>
              <button type="button" className="c4-btn" onClick={() => {
                setTray(view.tray);
                setQuery(view.query);
                setKeeperFilter(view.keeper);
                setRibbonFilter(view.ribbon);
                setBayFilter(view.bay);
                setPostureFilter(view.posture);
                setHourFilter(view.hour);
                setWeightFilter(view.weight);
                setWindowFilter(view.window);
              }}>{view.name}</button>
              <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropHoldView(views, view.id))}>{v4("qhdDropView")}</button>
            </li>
          ))}
        </ul>
      )}
      <div className="c4-row">
        <button type="button" className="c4-btn" onClick={() => setPicked(shown.map((card) => card.id))}>{v4("qhdPickAll")}</button>
        <button type="button" className="c4-btn" onClick={() => setPicked([])}>{v4("qhdPickNone")}</button>
        <p className="c4-meta">{v4("qhdPicked")} · {picked.length}</p>
        <label className="c4-lab"><span>{v4("qhdBulkRibbon")}</span>
          <select className="c4-field" aria-label={v4("qhdBulkRibbon")} value={moveRibbon} disabled={viewer} onChange={(event) => setMoveRibbon(event.target.value)}>
            {RIBBONS.map((item) => <option key={item} value={item}>{ribbonName(v4, item)}</option>)}
          </select>
        </label>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkHoldRibbon(cards, picked, moveRibbon))}>{v4("qhdBulkRibbon")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkHoldPin(cards, picked, true))}>{v4("qhdBulkPin")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkHoldClose(cards, picked, true))}>{v4("qhdBulkClose")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length || !tag} onClick={() => store(bulkHoldTag(cards, picked, tag))}>{v4("qhdBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("quiet-holds.csv", holdsCsv(cards, desk))}>{v4("qhdCsv")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(resetHolds())}>{v4("qhdReset")}</button>
      </div>
      {board === "timeline" ? (
        <ol className="c4-qhd-timeline">
          {timeline.map((card) => (
            <li key={card.id}>
              <strong>{card.hour}</strong> {card.title}
              <span className="c4-meta"> {gapLabel(v4, card.hour, desk)}</span>
            </li>
          ))}
          {!timeline.length && <li className="c4-empty-gold">{v4("qhdEmpty")}</li>}
        </ol>
      ) : (
        <ul className="c4-qhd-cards">
          {shown.map((card, index) => {
            const openEdit = editing === card.id;
            const gap = gapLabel(v4, card.hour, desk);
            const late = lateHold(card, desk);
            const soon = soonHold(card);
            return (
              <li key={card.id} data-late={late ? "1" : "0"} data-soon={soon ? "1" : "0"} data-house={houseBay(card.bay) ? "1" : "0"} data-ribbon={card.ribbon || "blank"} data-focus={index === focusAt ? "1" : "0"} tabIndex={index === focusAt ? 0 : -1}>
                <label className="c4-row">
                  <input type="checkbox" checked={picked.includes(card.id)} aria-label={card.title} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                  {openEdit ? (
                    <span className="c4-stack">
                      <input className="c4-field" aria-label={v4("qhdLine")} value={draft} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <input className="c4-field" aria-label={v4("qhdNote")} value={noteDraft} disabled={viewer} onChange={(event) => setNoteDraft(event.target.value)} />
                    </span>
                  ) : <strong>{card.title}</strong>}
                </label>
                <p className="c4-meta">{card.keeper || v4("qhdBlankKeeper")} · {card.hour ?? v4("qhdBlankHour")} · {ribbonName(v4, card.ribbon)} · {card.bay || v4("qhdBlankBay")} · {postureName(v4, card.posture)} · {weightName(v4, card.weight)} · {windowName(v4, card.window)} · {card.snooze ? `${v4("qhdSnooze")} ${card.snooze}` : v4("qhdSnoozeOff")}</p>
                {!!card.tags.length && !openEdit && <p className="c4-meta">{card.tags.join(" · ")}</p>}
                {card.note && !openEdit && <p>{card.note}</p>}
                <p className="c4-meta">{gap} {auditName(v4, card.audit)}</p>
                <div className="c4-row">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setHoldPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("qhdUnpin") : v4("qhdPin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setHoldPark(cards, card.id, !card.parked))}>{card.parked ? v4("qhdLift") : v4("qhdPark")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setHoldClose(cards, card.id, !card.closed))}>{card.closed ? v4("qhdReopen") : v4("qhdClose")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cyclePosture(cards, card.id))}>{v4("qhdPostureUp")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setHoldSnooze(cards, card.id, card.snooze === 0 ? 2 : card.snooze === 2 ? 6 : 0))}>{card.snooze === 0 ? v4("qhdSnooze2") : card.snooze === 2 ? v4("qhdSnooze6") : v4("qhdSnoozeOff")}</button>
                  <button type="button" className="c4-btn" disabled={viewer || !tag} onClick={() => store(card.tags.includes(tag.toLowerCase()) ? dropHoldTag(cards, card.id, tag) : addHoldTag(cards, card.id, tag))}>{v4("qhdTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => {
                    if (openEdit) {
                      store(editHoldNote(editHold(cards, card.id, draft), card.id, noteDraft));
                      setEditing("");
                      return;
                    }
                    setEditing(card.id);
                    setDraft(card.title);
                    setNoteDraft(card.note);
                  }}>{openEdit ? v4("qhdAdd") : v4("qhdEdit")}</button>
                  <button type="button" className="c4-btn" onClick={() => {
                    void navigator.clipboard?.writeText(holdCopy(card));
                    setCopied(card.id);
                  }}>{copied === card.id ? v4("qhdCopied") : v4("qhdCopy")}</button>
                </div>
              </li>
            );
          })}
          {!shown.length && <li className="c4-empty-gold">{v4("qhdEmpty")}</li>}
        </ul>
      )}
      <p className="c4-meta">{v4("qhdRules")}</p>
    </section>
  );
}

export function DialLanes({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [band, setBand] = useState("all");
  const [tone, setTone] = useState("all");
  const [shape, setShape] = useState<DialShape>("all");
  const [review, setReview] = useState<"all" | "reviewed" | "open">("all");
  const [query, setQuery] = useState("");
  const [showHidden, setShowHidden] = useState(false);
  const [copied, setCopied] = useState("");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = useMemo<GlanceRow[]>(() => (data.data?.users || []).map((user) => ({
    id: user.id,
    label: user.name || user.id,
    note: { phone: user.phone ?? null },
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
    const present = presentDials(rows);
    const ids = rows.map((row) => row.id);
    const nextHidden = readHiddenDials(readJson(DIAL_KEY, []), present);
    const nextReviewed = readReviewedDials(readJson(DIAL_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(DIAL_KEY, nextHidden);
    writeJson(DIAL_REVIEW_KEY, nextReviewed);
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
  const present = presentDials(rows);
  const bands = visibleDialBands(present, hidden, showHidden);
  const bandOn = activeDialBand(band, present);
  const toneOn = activeDialTone(tone);
  const shown = visibleDialCustomers(rows, dialBandArg(bandOn), dialToneArg(toneOn), query, review, reviewed, shape)
    .filter((row) => {
      const state = dialState(row.note);
      const token = state === "set" ? dialBand(row.note) : state === "clear" ? "blank" : "";
      if (!token) return true;
      return bands.includes(token);
    });
  const lead = leadingDial(rows);
  const toneLead = leadingDialTone(rows);
  const shared = sharedDialCount(rows);
  const catalog = catalogDialCount(rows);
  const bars = dialBands(rows).filter((line) => line.band);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const ids = rows.map((row) => row.id);
  function storeHidden(next: string[]) {
    setHidden(next);
    writeJson(DIAL_KEY, next);
  }
  function storeReviewed(next: string[]) {
    const saved = readReviewedDials(next, ids);
    setReviewed(saved);
    writeJson(DIAL_REVIEW_KEY, saved);
  }
  return (
    <section className="c4-dln" aria-label={v4("dlnTitle")} data-dials="1" data-role={role} data-catalog={catalog ? "1" : "0"}>
      <header className="c4-dln-mast">
        <div>
          <p className="c4-dln-kicker">{v4("dlnSub")}</p>
          <h2 className="c4-title">{v4("dlnTitle")}</h2>
        </div>
        <p className="c4-dln-plate" data-logo="mono">{v4("dlnLogo")}</p>
      </header>
      <p className="c4-dln-rules">{v4("dlnHint")}</p>
      <p className="c4-meta">{v4("dlnKept")} {v4("dlnEscape")}</p>
      {viewer && <p className="c4-dln-notice" data-viewer="1">{v4("dlnViewer")}</p>}
      {data.error && <p className="c4-empty-gold" role="alert">{v4("dlnFailed")}</p>}
      {data.loading && <p className="c4-meta">{v4("dlnLoading")}</p>}
      {shared > 0 && <p className="c4-dln-notice" role="status">{v4("dlnNotice")} · {shared}</p>}
      <dl className="c4-dln-kpi" aria-label={v4("dlnKpi")}>
        <div><dt>{v4("dlnSet")}</dt><dd>{rows.filter((row) => dialState(row.note) === "set").length}</dd></div>
        <div><dt>{v4("dlnCatalog")}</dt><dd>{catalog}</dd></div>
        <div><dt>{v4("dlnWide")}</dt><dd>{wideDialCount(rows)}</dd></div>
        <div><dt>{v4("dlnOpenCount")}</dt><dd>{openDialCount(rows)}</dd></div>
        <div><dt>{v4("dlnShare")}</dt><dd>{dialShare(catalog, rows.length)}%</dd></div>
        <div><dt>{v4("dlnShared")}</dt><dd>{shared}</dd></div>
      </dl>
      <div className="c4-dln-chart" aria-label={v4("dlnBands")}>
        {bars.map((bar) => (
          <div key={bar.band} className="c4-dln-col">
            <div className="c4-dln-track" aria-hidden="true"><i style={{ height: `${Math.round((bar.count / maxBar) * 100)}%` }} /></div>
            <button type="button" className="c4-btn" onClick={() => setBand(bar.band)}>{bandName(v4, bar.band)} · {bar.count}</button>
          </div>
        ))}
        {!bars.length && <p className="c4-empty-gold">{v4("dlnEmpty")}</p>}
      </div>
      <p className="c4-meta">{lead ? `${v4("dlnLeading")} · ${bandName(v4, lead)}` : v4("dlnLeadingNone")} · {toneLead ? `${v4("dlnToneLead")} · ${toneName(v4, toneLead)}` : v4("dlnToneNone")} · {shared ? `${v4("dlnShared")} · ${shared}` : v4("dlnSharedNone")}</p>
      <div className="c4-dln-filters">
        <label className="c4-lab"><span>{v4("dlnSearch")}</span>
          <input ref={searchRef} className="c4-field" aria-label={v4("dlnSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            setQuery("");
          }} />
        </label>
        <label className="c4-lab"><span>{v4("dlnBands")}</span>
          <select className="c4-field" aria-label={v4("dlnBands")} value={bandOn} onChange={(event) => setBand(event.target.value)}>
            <option value="all">{v4("dlnAll")}</option>
            <option value="blank">{v4("dlnClear")}</option>
            {BANDS.map((item) => <option key={item} value={item}>{bandName(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("dlnTone")}</span>
          <select className="c4-field" aria-label={v4("dlnTone")} value={toneOn} onChange={(event) => setTone(event.target.value)}>
            <option value="all">{v4("dlnAll")}</option>
            <option value="open">{v4("dlnOpenTone")}</option>
            <option value="shut">{v4("dlnShut")}</option>
          </select>
        </label>
      </div>
      <div className="c4-row">
        {(["all", "catalog", "wide", "open"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} aria-pressed={shape === item} onClick={() => setShape(item)}>
            {item === "all" ? v4("dlnAllShapes") : item === "catalog" ? v4("dlnCatalog") : item === "wide" ? v4("dlnWide") : v4("dlnOpenTone")}
          </button>
        ))}
        {(["all", "reviewed", "open"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} aria-pressed={review === item} onClick={() => setReview(item)}>
            {item === "all" ? v4("dlnAllReview") : item === "reviewed" ? v4("dlnReviewed") : v4("dlnOpenReview")}
          </button>
        ))}
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden((on) => !on)}>{showHidden ? v4("dlnShown") : v4("dlnHidden")}</button>
      </div>
      <ul className="c4-dln-bands" aria-label={v4("dlnBands")}>
        {present.map((item) => (
          <li key={item}>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeHidden(toggleDial(hidden, item, present))}>{bandName(v4, item)} · {hidden.includes(item) ? v4("dlnShow") : v4("dlnHide")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-row">
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkDialReview(reviewed, shown.map((row) => row.id), ids, true))}>{v4("dlnBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkDialReview(reviewed, shown.map((row) => row.id), ids, false))}>{v4("dlnBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("dial-lanes.csv", dialsCsv(rows))}>{v4("dlnCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("dial-lane-rows.csv", dialRowsCsv(shown, reviewed))}>{v4("dlnRowCsv")}</button>
        <Link className="c4-btn" href={crmv4Href(base, "customers")}>{v4("dlnCustomers")}</Link>
      </div>
      <ul className="c4-dln-rows">
        {shown.map((row) => {
          const code = dialCopy(row.note);
          const marked = reviewed.includes(row.id);
          return (
            <li key={row.id} data-band={dialBand(row.note) || "blank"} data-tone={dialTone(row.note) || "blank"} data-catalog={catalogDial(row.note) ? "1" : "0"} data-reviewed={marked ? "1" : "0"}>
              <strong>{row.label}</strong>
              <p className="c4-meta">{code || v4("dlnClear")} · {bandName(v4, dialBand(row.note) || (dialState(row.note) === "clear" ? "blank" : ""))} · {toneName(v4, dialTone(row.note))} {catalogDial(row.note) ? `· ${v4("dlnCatalogMark")}` : ""}</p>
              <div className="c4-row">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleDialReview(reviewed, row.id, ids))}>{marked ? v4("dlnReviewed") : v4("dlnReview")}</button>
                <button type="button" className="c4-btn" disabled={!code} onClick={() => {
                  if (!code) return;
                  void navigator.clipboard?.writeText(code);
                  setCopied(row.id);
                }}>{copied === row.id ? v4("dlnCopied") : v4("dlnCopy")}</button>
              </div>
            </li>
          );
        })}
        {!data.loading && !shown.length && <li className="c4-empty-gold">{v4("dlnEmpty")}</li>}
      </ul>
      <p className="c4-meta">{v4("dlnRules")}</p>
    </section>
  );
}
