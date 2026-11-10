"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  STAMP_KEY,
  STAMP_REVIEW_KEY,
  WSL_DENSITY_KEY,
  WSL_KEY,
  WSL_VIEW_KEY,
  activeHour,
  activeHost,
  activePace,
  activeRank,
  activeSeat,
  activeSpan,
  activeStampBand,
  activeStampTone,
  addSlot,
  addSlotTag,
  addSlotView,
  bulkSlotClose,
  bulkSlotPin,
  bulkSlotSeat,
  bulkSlotTag,
  bulkStampReview,
  busiestHost,
  catalogStamp,
  catalogStampCount,
  clashHourCount,
  cyclePace,
  densityOf,
  dropSlotView,
  editSlot,
  editSlotNote,
  fairHost,
  firmStampCount,
  hostArg,
  hourArg,
  hourGap,
  houseSeat,
  lateSlot,
  leadingStamp,
  leadingStampTone,
  moveFocus,
  nextSlot,
  paceArg,
  peakHour,
  presentStamps,
  rankArg,
  rankClashCount,
  readHiddenStamps,
  readReviewedStamps,
  readSlotViews,
  readSlots,
  reminderSlots,
  resetSlots,
  rowStampCount,
  seatArg,
  setSlotClose,
  setSlotHold,
  setSlotHush,
  setSlotPin,
  sharedStampCount,
  slotCopy,
  slotCounts,
  slotHosts,
  slotSeats,
  slotShare,
  slotTimeline,
  slotsCsv,
  soonSlot,
  sortMode,
  sortSlots,
  spanArg,
  stampBand,
  stampBandArg,
  stampBands,
  stampCopy,
  stampRowsCsv,
  stampShare,
  stampState,
  stampTone,
  stampToneArg,
  stampsCsv,
  suggestHost,
  suggestSeat,
  suggestSpan,
  toggleStamp,
  toggleStampReview,
  usedHours,
  visibleSlots,
  visibleStampBands,
  visibleStampCustomers,
  type StampRow,
  type StampShape,
  type WaitSlot,
  type WslDensity,
  type WslPace,
  type WslSeat,
  type WslSort,
  type WslTray,
  type WslView,
} from "@/lib/crmv4/round197";
import { useJson } from "./kit";
import { storedRole } from "./round5";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  retentionNote?: string | null;
};

type GlanceRow = StampRow & { id: string };

const SEATS = ["one", "two", "arc"] as const;
const BANDS = ["chip", "pair", "row"] as const;

function seatLabel(v4: V4, seat: WslSeat | string): string {
  if (seat === "one" || seat === "ONE") return v4("wslOne");
  if (seat === "two" || seat === "TWO") return v4("wslTwo");
  if (seat === "arc" || seat === "ARC") return v4("wslArc");
  return v4("wslBlankSeat");
}

function paceLabel(v4: V4, pace: WslPace | string): string {
  if (pace === "call") return v4("wslCall");
  if (pace === "hold") return v4("wslHoldPace");
  if (pace === "done") return v4("wslDone");
  return v4("wslBlankPace");
}

function rankLabel(v4: V4, rank: number | null): string {
  if (rank === 1) return v4("wslRank1");
  if (rank === 2) return v4("wslRank2");
  if (rank === 4) return v4("wslRank4");
  return v4("wslBlankRank");
}

function spanLabel(v4: V4, span: number | null): string {
  if (span === 15) return v4("wslSpan15");
  if (span === 30) return v4("wslSpan30");
  if (span === 60) return v4("wslSpan60");
  return v4("wslBlankSpan");
}

function bandLabel(v4: V4, name: string): string {
  if (name === "chip") return v4("fstChip");
  if (name === "pair") return v4("fstPair");
  if (name === "row") return v4("fstRow");
  if (name === "blank") return v4("fstClear");
  return v4("fstUnmarked");
}

function toneLabel(v4: V4, name: string): string {
  if (name === "firm") return v4("fstFirm");
  if (name === "soft") return v4("fstSoft");
  return v4("fstUnmarked");
}

function auditLabel(v4: V4, audit: string): string {
  const key = {
    save: "wslAuditSave",
    edit: "wslAuditEdit",
    pace: "wslAuditPace",
    pin: "wslAuditPin",
    unpin: "wslAuditUnpin",
    hold: "wslAuditHold",
    lift: "wslAuditLift",
    close: "wslAuditClose",
    reopen: "wslAuditReopen",
    seat: "wslAuditSeat",
    tag: "wslAuditTag",
    hush: "wslAuditHush",
  }[audit];
  return key ? v4(key as CrmV4CopyKey) : "";
}

function gapLabel(v4: V4, hour: number | null, desk: string): string {
  const gap = hourGap(hour, desk);
  if (gap === null) return "";
  if (gap > 0) return `${v4("wslPast")} ${gap}`;
  if (gap < 0) return `${v4("wslAhead")} ${Math.abs(gap)}`;
  return v4("wslDue");
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

export function WaitlistSlots({ v4 }: { v4: V4 }) {
  const [slots, setSlots] = useState<WaitSlot[]>([]);
  const [views, setViews] = useState<WslView[]>([]);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [host, setHost] = useState("");
  const [hour, setHour] = useState("");
  const [seat, setSeat] = useState("");
  const [pace, setPace] = useState("");
  const [rank, setRank] = useState("");
  const [spanValue, setSpanValue] = useState("");
  const [tag, setTag] = useState("");
  const [roster, setRoster] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<WslTray>("open");
  const [hostFilter, setHostFilter] = useState("all");
  const [seatFilter, setSeatFilter] = useState("all");
  const [paceFilter, setPaceFilter] = useState("all");
  const [hourFilter, setHourFilter] = useState("all");
  const [rankFilter, setRankFilter] = useState("all");
  const [spanFilter, setSpanFilter] = useState("all");
  const [callingOnly, setCallingOnly] = useState(false);
  const [peakOnly, setPeakOnly] = useState(false);
  const [duskOnly, setDuskOnly] = useState(false);
  const [houseOnly, setHouseOnly] = useState(false);
  const [awakeOnly, setAwakeOnly] = useState(false);
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const [order, setOrder] = useState<WslSort>("hour");
  const [density, setDensity] = useState<WslDensity>("roomy");
  const [copied, setCopied] = useState("");
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [deskHour, setDeskHour] = useState("");
  const [moveSeat, setMoveSeat] = useState("one");
  const [picked, setPicked] = useState<string[]>([]);
  const [focus, setFocus] = useState(0);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  useEffect(() => {
    const next = readSlots(readJson(WSL_KEY, []));
    const saved = readSlotViews(readJson(WSL_VIEW_KEY, []));
    setSlots(next);
    setViews(saved);
    setDensity(densityOf(readJson(WSL_DENSITY_KEY, "roomy")));
    writeJson(WSL_KEY, next);
    writeJson(WSL_VIEW_KEY, saved);
    setRole(storedRole());
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);
  function store(next: WaitSlot[]) {
    const saved = readSlots(next);
    setSlots(saved);
    writeJson(WSL_KEY, saved);
    setPicked((ids) => ids.filter((id) => saved.some((slot) => slot.id === id)));
  }
  function storeViews(next: WslView[]) {
    const saved = readSlotViews(next);
    setViews(saved);
    writeJson(WSL_VIEW_KEY, saved);
  }
  function storeDensity(next: WslDensity) {
    setDensity(next);
    writeJson(WSL_DENSITY_KEY, next);
  }
  const hosts = slotHosts(slots);
  const seats = slotSeats(slots);
  const bars = SEATS.map((item) => ({ seat: item.toUpperCase(), count: slots.filter((slot) => slot.seat === item.toUpperCase()).length })).filter((row) => row.count > 0);
  const hostOn = activeHost(hostFilter, hosts);
  const seatOn = activeSeat(seatFilter, seats);
  const paceOn = activePace(paceFilter, ["call", "hold", "done"]);
  const hourOn = activeHour(hourFilter);
  const rankOn = activeRank(rankFilter);
  const spanOn = activeSpan(spanFilter);
  const pickedHour = hourArg(hourOn);
  const shown = sortSlots(visibleSlots(
    slots,
    tray,
    query,
    hostArg(hostOn),
    seatArg(seatOn),
    paceArg(paceOn),
    pickedHour.exact,
    pickedHour.pick,
    rankArg(rankOn),
    spanArg(spanOn),
    callingOnly,
    peakOnly,
    houseOnly,
    duskOnly,
    awakeOnly,
  ), order);
  const timeline = slotTimeline(slots, query);
  const counts = slotCounts(slots, deskHour);
  const clashes = clashHourCount(slots);
  const ranks = rankClashCount(slots);
  const nextId = nextSlot(slots, deskHour);
  const nextRow = slots.find((slot) => slot.id === nextId);
  const suggestedSeat = suggestSeat(slots);
  const suggestedHost = suggestHost(slots);
  const suggestedSpan = suggestSpan(slots);
  const fair = fairHost(slots, roster);
  const busy = busiestHost(slots);
  const reminders = reminderSlots(slots, deskHour);
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
    setHour("");
    setSeat("");
    setPace("");
    setRank("");
    setSpanValue("");
    setTag("");
    setQuery("");
    setEditing("");
  }
  function applyView(view: WslView) {
    setTray(view.tray);
    setQuery(view.query);
    setHostFilter(view.host);
    setSeatFilter(view.seat);
    setPaceFilter(view.pace);
    setHourFilter(view.hour);
    setRankFilter(view.rank);
    setSpanFilter(view.span);
  }
  return (
    <section className="c4-wsl" aria-label={v4("wslTitle")} data-waitlist="1" data-role={role} data-density={density}>
      <header className="c4-wsl-mast">
        <div>
          <p className="c4-wsl-kicker">{v4("wslSub")}</p>
          <h2 className="c4-title">{v4("wslTitle")}</h2>
        </div>
        <p className="c4-wsl-plate" data-logo="mono">{v4("wslLogo")}</p>
      </header>
      <p className="c4-wsl-rules">{v4("wslHint")}</p>
      <p className="c4-meta">{v4("wslLocal")}</p>
      <p className="c4-meta">{v4("wslNew")} {v4("wslSlash")} {v4("wslEscape")} {v4("wslKeys")}</p>
      {viewer && <p className="c4-wsl-notice" data-viewer="1">{v4("wslViewer")}</p>}
      {counts.peak > 0 && (
        <p className="c4-wsl-notice" role="status">
          {v4("wslNotice")} · {counts.peak}
          <button type="button" className="c4-btn" onClick={() => setPeakOnly((on) => !on)}>{peakOnly ? v4("wslNoticeAll") : v4("wslNoticePeak")}</button>
        </p>
      )}
      <dl className="c4-wsl-kpi" aria-label={v4("wslKpi")}>
        <div><dt>{v4("wslOpen")}</dt><dd>{counts.open}</dd></div>
        <div><dt>{v4("wslHeld")}</dt><dd>{counts.held}</dd></div>
        <div><dt>{v4("wslClosed")}</dt><dd>{counts.closed}</dd></div>
        <div><dt>{v4("wslPinned")}</dt><dd>{counts.pinned}</dd></div>
        <div><dt>{v4("wslPeak")}</dt><dd>{counts.peak}</dd></div>
        <div><dt>{v4("wslLate")}</dt><dd>{counts.late}</dd></div>
        <div><dt>{v4("wslSoon")}</dt><dd>{counts.soon}</dd></div>
        <div><dt>{v4("wslHush")}</dt><dd>{counts.hush}</dd></div>
        <div><dt>{v4("wslHouseShare")}</dt><dd>{slotShare(counts.house, slots.length)}%</dd></div>
      </dl>
      <div className="c4-wsl-chart" aria-label={v4("wslSeats")}>
        {bars.map((bar) => (
          <div key={bar.seat} className="c4-wsl-col">
            <div className="c4-wsl-track" aria-hidden="true"><i style={{ height: `${Math.round((bar.count / maxBar) * 100)}%` }} /></div>
            <button type="button" className="c4-btn" onClick={() => setSeatFilter(bar.seat)}>{seatLabel(v4, bar.seat)} · {bar.count}</button>
          </div>
        ))}
        {!bars.length && <p className="c4-empty-gold">{v4("wslEmpty")}</p>}
      </div>
      <p className="c4-meta">{v4("wslSuggestSeat")} · {seatLabel(v4, suggestedSeat)} · {v4("wslSuggestHost")} · {suggestedHost || v4("wslBlankHost")} · {v4("wslSuggestSpan")} · {spanLabel(v4, suggestedSpan)}</p>
      <p className="c4-meta">{v4("wslHours")} · {usedHours(slots)} · {clashes ? `${v4("wslClash")} · ${clashes}` : v4("wslClashNone")} · {ranks ? `${v4("wslRankClash")} · ${ranks}` : v4("wslRankClashNone")}</p>
      <p className="c4-meta">{nextRow ? `${v4("wslNext")} · ${nextRow.title}` : v4("wslNextNone")} · {busy ? `${v4("wslBusiest")} · ${busy}` : v4("wslBusiestNone")} · {reminders.length ? `${v4("wslReminders")} · ${reminders.length}` : v4("wslReminderNone")}</p>
      <ul className="c4-wsl-reminders" aria-label={v4("wslReminders")}>
        {reminders.map((slot) => (
          <li key={slot.id}>{slot.title} · {lateSlot(slot, deskHour) ? v4("wslLate") : v4("wslSoon")}</li>
        ))}
        {!reminders.length && <li className="c4-empty-gold">{v4("wslReminderNone")}</li>}
      </ul>
      <form className="c4-wsl-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        store(addSlot(slots, {
          id: `s${Date.now().toString(36)}`,
          title,
          note,
          host,
          hour,
          seat,
          pace,
          rank,
          span: spanValue,
          tags: tag,
        }));
        setTitle("");
        setNote("");
      }}>
        <label className="c4-lab"><span>{v4("wslLine")}</span>
          <input ref={titleRef} className="c4-field" aria-label={v4("wslLine")} value={title} disabled={viewer} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("wslNote")}</span>
          <input className="c4-field" aria-label={v4("wslNote")} value={note} disabled={viewer} onChange={(event) => setNote(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("wslHost")}</span>
          <input className="c4-field" aria-label={v4("wslHost")} value={host} disabled={viewer} onChange={(event) => setHost(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("wslHour")}</span>
          <input className="c4-field" aria-label={v4("wslHour")} value={hour} disabled={viewer} onChange={(event) => setHour(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("wslSeat")}</span>
          <select className="c4-field" aria-label={v4("wslSeat")} value={seat} disabled={viewer} onChange={(event) => setSeat(event.target.value)}>
            <option value="">{v4("wslBlankSeat")}</option>
            {SEATS.map((item) => <option key={item} value={item}>{seatLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("wslPace")}</span>
          <select className="c4-field" aria-label={v4("wslPace")} value={pace} disabled={viewer} onChange={(event) => setPace(event.target.value)}>
            <option value="">{v4("wslBlankPace")}</option>
            <option value="call">{v4("wslCall")}</option>
            <option value="hold">{v4("wslHoldPace")}</option>
            <option value="done">{v4("wslDone")}</option>
          </select>
        </label>
        <label className="c4-lab"><span>{v4("wslRank")}</span>
          <input className="c4-field" aria-label={v4("wslRank")} value={rank} disabled={viewer} onChange={(event) => setRank(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("wslSpan")}</span>
          <input className="c4-field" aria-label={v4("wslSpan")} value={spanValue} disabled={viewer} onChange={(event) => setSpanValue(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("wslTag")}</span>
          <input className="c4-field" aria-label={v4("wslTag")} value={tag} disabled={viewer} onChange={(event) => setTag(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("wslRoster")}</span>
          <input className="c4-field" aria-label={v4("wslRoster")} value={roster} disabled={viewer} onChange={(event) => setRoster(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("wslAdd")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => setSeat(suggestedSeat.toLowerCase())}>{v4("wslUseSeat")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !suggestedHost} onClick={() => setHost(suggestedHost)}>{v4("wslUseHost")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => setSpanValue(String(suggestedSpan))}>{v4("wslUseSpan")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !fair} onClick={() => setHost(fair)}>{v4("wslAssign")}</button>
      </form>
      <div className="c4-wsl-filters">
        <label className="c4-lab"><span>{v4("wslSearch")}</span>
          <input ref={searchRef} className="c4-field" aria-label={v4("wslSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            clearDraft();
          }} />
        </label>
        <label className="c4-lab"><span>{v4("wslDeskHour")}</span>
          <input className="c4-field" aria-label={v4("wslDeskHour")} value={deskHour} onChange={(event) => setDeskHour(event.target.value)} />
        </label>
      </div>
      <div className="c4-row">
        {(["open", "held", "closed"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} aria-pressed={tray === item} onClick={() => setTray(item)}>
            {item === "open" ? v4("wslOpen") : item === "held" ? v4("wslHeld") : v4("wslClosed")}
          </button>
        ))}
        <button type="button" className="c4-chip" data-on={callingOnly ? "1" : "0"} aria-pressed={callingOnly} onClick={() => setCallingOnly((on) => !on)}>{v4("wslCalling")}</button>
        <button type="button" className="c4-chip" data-on={houseOnly ? "1" : "0"} aria-pressed={houseOnly} onClick={() => setHouseOnly((on) => !on)}>{v4("wslHouseOnly")}</button>
        <button type="button" className="c4-chip" data-on={duskOnly ? "1" : "0"} aria-pressed={duskOnly} onClick={() => setDuskOnly((on) => !on)}>{v4("wslDuskOnly")}</button>
        <button type="button" className="c4-chip" data-on={awakeOnly ? "1" : "0"} aria-pressed={awakeOnly} onClick={() => setAwakeOnly((on) => !on)}>{v4("wslAwake")}</button>
        <button type="button" className="c4-chip" data-on={board === "cards" ? "1" : "0"} aria-pressed={board === "cards"} onClick={() => setBoard("cards")}>{v4("wslCards")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} aria-pressed={board === "timeline"} onClick={() => setBoard("timeline")}>{v4("wslTimeline")}</button>
        <button type="button" className="c4-chip" data-on={order === "hour" ? "1" : "0"} aria-pressed={order === "hour"} onClick={() => setOrder(sortMode(order === "hour" ? "title" : "hour"))}>{order === "hour" ? v4("wslSortHour") : v4("wslSortTitle")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} aria-pressed={density === "tight"} onClick={() => storeDensity(densityOf(density === "tight" ? "roomy" : "tight"))}>{density === "tight" ? v4("wslTight") : v4("wslRoomy")}</button>
      </div>
      <div className="c4-wsl-filters">
        <label className="c4-lab"><span>{v4("wslHost")}</span>
          <select className="c4-field" aria-label={v4("wslHost")} value={hostOn} onChange={(event) => setHostFilter(event.target.value)}>
            <option value="all">{v4("wslAll")}</option>
            <option value="blank">{v4("wslBlankHost")}</option>
            {hosts.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("wslSeat")}</span>
          <select className="c4-field" aria-label={v4("wslSeat")} value={seatOn} onChange={(event) => setSeatFilter(event.target.value)}>
            <option value="all">{v4("wslAll")}</option>
            <option value="blank">{v4("wslBlankSeat")}</option>
            {seats.map((item) => <option key={item} value={item}>{seatLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("wslPace")}</span>
          <select className="c4-field" aria-label={v4("wslPace")} value={paceOn} onChange={(event) => setPaceFilter(event.target.value)}>
            <option value="all">{v4("wslAll")}</option>
            <option value="blank">{v4("wslBlankPace")}</option>
            <option value="call">{v4("wslCall")}</option>
            <option value="hold">{v4("wslHoldPace")}</option>
            <option value="done">{v4("wslDone")}</option>
          </select>
        </label>
        <label className="c4-lab"><span>{v4("wslHour")}</span>
          <select className="c4-field" aria-label={v4("wslHour")} value={hourOn} onChange={(event) => setHourFilter(event.target.value)}>
            <option value="all">{v4("wslAll")}</option>
            <option value="blank">{v4("wslBlankHour")}</option>
            <option value="early">{v4("wslEarly")}</option>
            <option value="mid">{v4("wslMid")}</option>
            <option value="late">{v4("wslLateBand")}</option>
            <option value="peak">{v4("wslPeak")}</option>
            <option value="dusk">{v4("wslDusk")}</option>
          </select>
        </label>
        <label className="c4-lab"><span>{v4("wslRank")}</span>
          <select className="c4-field" aria-label={v4("wslRank")} value={rankOn} onChange={(event) => setRankFilter(event.target.value)}>
            <option value="all">{v4("wslAll")}</option>
            <option value="blank">{v4("wslBlankRank")}</option>
            <option value="1">{v4("wslRank1")}</option>
            <option value="2">{v4("wslRank2")}</option>
            <option value="4">{v4("wslRank4")}</option>
          </select>
        </label>
        <label className="c4-lab"><span>{v4("wslSpan")}</span>
          <select className="c4-field" aria-label={v4("wslSpan")} value={spanOn} onChange={(event) => setSpanFilter(event.target.value)}>
            <option value="all">{v4("wslAll")}</option>
            <option value="blank">{v4("wslBlankSpan")}</option>
            <option value="15">{v4("wslSpan15")}</option>
            <option value="30">{v4("wslSpan30")}</option>
            <option value="60">{v4("wslSpan60")}</option>
          </select>
        </label>
      </div>
      <form className="c4-row" onSubmit={(event) => {
        event.preventDefault();
        if (viewer || !viewName.trim()) return;
        storeViews(addSlotView(views, {
          id: `v${Date.now().toString(36)}`,
          name: viewName,
          tray,
          query,
          host: hostOn,
          seat: seatOn,
          pace: paceOn,
          hour: hourOn,
          rank: rankOn,
          span: spanOn,
        }));
        setViewName("");
      }}>
        <label className="c4-lab"><span>{v4("wslViews")}</span>
          <input className="c4-field" aria-label={v4("wslViews")} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("wslSaveView")}</button>
      </form>
      {!!views.length && (
        <ul className="c4-wsl-views">
          {views.map((view) => (
            <li key={view.id}>
              <button type="button" className="c4-btn" onClick={() => applyView(view)}>{view.name}</button>
              <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropSlotView(views, view.id))}>{v4("wslDropView")}</button>
            </li>
          ))}
        </ul>
      )}
      <div className="c4-row">
        <button type="button" className="c4-btn" onClick={() => setPicked(shown.map((slot) => slot.id))}>{v4("wslPickAll")}</button>
        <button type="button" className="c4-btn" onClick={() => setPicked([])}>{v4("wslPickNone")}</button>
        <span className="c4-meta">{v4("wslPicked")} · {picked.length}</span>
        <select className="c4-field" aria-label={v4("wslBulkSeat")} value={moveSeat} disabled={viewer} onChange={(event) => setMoveSeat(event.target.value)}>
          {SEATS.map((item) => <option key={item} value={item}>{seatLabel(v4, item)}</option>)}
        </select>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkSlotSeat(slots, picked, moveSeat))}>{v4("wslBulkSeat")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkSlotPin(slots, picked, true))}>{v4("wslBulkPin")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkSlotClose(slots, picked, true))}>{v4("wslBulkClose")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length || !tagOfSafe(tag)} onClick={() => store(bulkSlotTag(slots, picked, tag))}>{v4("wslBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("waitlist-slots.csv", slotsCsv(slots, deskHour))}>{v4("wslCsv")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(resetSlots())}>{v4("wslReset")}</button>
      </div>
      {board === "timeline" ? (
        <ol className="c4-wsl-time" aria-label={v4("wslTimeline")}>
          {timeline.map((slot) => (
            <li key={slot.id} data-peak={peakHour(slot.hour) ? "1" : "0"} data-house={houseSeat(slot.seat) ? "1" : "0"}>
              <strong>{slot.hour}</strong>
              <span>{slot.title}</span>
              <span>{gapLabel(v4, slot.hour, deskHour)}</span>
            </li>
          ))}
          {!timeline.length && <li className="c4-empty-gold">{v4("wslEmpty")}</li>}
        </ol>
      ) : (
        <ul className="c4-wsl-cards">
          {shown.map((slot, index) => {
            const open = editing === slot.id;
            return (
              <li key={slot.id} data-focus={index === focusAt ? "1" : "0"} data-peak={peakHour(slot.hour) ? "1" : "0"} data-late={lateSlot(slot, deskHour) ? "1" : "0"} data-soon={soonSlot(slot) ? "1" : "0"} data-house={houseSeat(slot.seat) ? "1" : "0"}>
                <label className="c4-row">
                  <input type="checkbox" checked={picked.includes(slot.id)} aria-label={slot.title} onChange={() => setPicked((ids) => ids.includes(slot.id) ? ids.filter((id) => id !== slot.id) : [...ids, slot.id])} />
                  {open ? (
                    <input className="c4-field" aria-label={v4("wslEdit")} value={draft} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                  ) : <strong>{slot.title}</strong>}
                </label>
                <p className="c4-meta">{slot.host || v4("wslBlankHost")} · {slot.hour ?? v4("wslBlankHour")} · {seatLabel(v4, slot.seat)} · {paceLabel(v4, slot.pace)} · {rankLabel(v4, slot.rank)} · {spanLabel(v4, slot.span)} · {gapLabel(v4, slot.hour, deskHour)} · {auditLabel(v4, slot.audit)}</p>
                <p className="c4-meta">{slot.tags.join(" ") || v4("wslBlankTag")} · {slot.note}</p>
                {open && (
                  <input className="c4-field" aria-label={v4("wslNote")} value={noteDraft} disabled={viewer} onChange={(event) => setNoteDraft(event.target.value)} />
                )}
                <div className="c4-row">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cyclePace(slots, slot.id))}>{v4("wslPaceUp")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSlotPin(slots, slot.id, !slot.pinned))}>{slot.pinned ? v4("wslUnpin") : v4("wslPin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSlotHold(slots, slot.id, !slot.held))}>{slot.held ? v4("wslLift") : v4("wslHold")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSlotClose(slots, slot.id, !slot.closed))}>{slot.closed ? v4("wslReopen") : v4("wslClose")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSlotHush(slots, slot.id, slot.hush ? 0 : 15))}>{slot.hush ? v4("wslHushOff") : v4("wslHushOn")}</button>
                  <button type="button" className="c4-btn" disabled={viewer || !tagOfSafe(tag)} onClick={() => store(addSlotTag(slots, slot.id, tag))}>{v4("wslTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => {
                    if (open) {
                      store(editSlotNote(editSlot(slots, slot.id, draft), slot.id, noteDraft));
                      setEditing("");
                      return;
                    }
                    setEditing(slot.id);
                    setDraft(slot.title);
                    setNoteDraft(slot.note);
                  }}>{open ? v4("wslSaveView") : v4("wslEdit")}</button>
                  <button type="button" className="c4-btn" onClick={() => {
                    void navigator.clipboard?.writeText(slotCopy(slot, deskHour));
                    setCopied(slot.id);
                  }}>{copied === slot.id ? v4("wslCopied") : v4("wslCopy")}</button>
                </div>
              </li>
            );
          })}
          {!shown.length && <li className="c4-empty-gold">{v4("wslEmpty")}</li>}
        </ul>
      )}
      <p className="c4-meta">{v4("wslRules")}</p>
    </section>
  );
}

function tagOfSafe(raw: string): boolean {
  return /^[a-z]+$/.test(raw.trim());
}

export function FollowStamps({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [query, setQuery] = useState("");
  const [band, setBand] = useState("all");
  const [tone, setTone] = useState("all");
  const [shape, setShape] = useState<StampShape>("all");
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
    note: { retentionNote: user.retentionNote ?? null },
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
    const present = presentStamps(rows);
    const ids = rows.map((row) => row.id);
    const nextHidden = readHiddenStamps(readJson(STAMP_KEY, []), present);
    const nextReviewed = readReviewedStamps(readJson(STAMP_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(STAMP_KEY, nextHidden);
    writeJson(STAMP_REVIEW_KEY, nextReviewed);
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
  const present = presentStamps(rows);
  const bands = visibleStampBands(present, hidden, showHidden);
  const bandOn = activeStampBand(band, present);
  const toneOn = activeStampTone(tone);
  const shown = visibleStampCustomers(rows, stampBandArg(bandOn), stampToneArg(toneOn), query, review, reviewed, shape)
    .filter((row) => {
      const state = stampState(row.note);
      const token = state === "set" ? stampBand(row.note) : state === "clear" ? "blank" : "";
      if (!token) return true;
      return bands.includes(token);
    });
  const lead = leadingStamp(rows);
  const toneLead = leadingStampTone(rows);
  const shared = sharedStampCount(rows);
  const catalog = catalogStampCount(rows);
  const bars = stampBands(rows).filter((line) => line.band);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const ids = rows.map((row) => row.id);
  function storeHidden(next: string[]) {
    setHidden(next);
    writeJson(STAMP_KEY, next);
  }
  function storeReviewed(next: string[]) {
    const saved = readReviewedStamps(next, ids);
    setReviewed(saved);
    writeJson(STAMP_REVIEW_KEY, saved);
  }
  return (
    <section className="c4-fst" aria-label={v4("fstTitle")} data-stamps="1" data-role={role} data-catalog={catalog ? "1" : "0"}>
      <header className="c4-fst-mast">
        <div>
          <p className="c4-fst-kicker">{v4("fstSub")}</p>
          <h2 className="c4-title">{v4("fstTitle")}</h2>
        </div>
        <p className="c4-fst-plate" data-logo="mono">{v4("fstLogo")}</p>
      </header>
      <p className="c4-fst-rules">{v4("fstHint")}</p>
      <p className="c4-meta">{v4("fstKept")} {v4("fstEscape")}</p>
      {viewer && <p className="c4-fst-notice" data-viewer="1">{v4("fstViewer")}</p>}
      {data.error && <p className="c4-empty-gold" role="alert">{v4("fstFailed")}</p>}
      {data.loading && <p className="c4-meta">{v4("fstLoading")}</p>}
      {shared > 0 && <p className="c4-fst-notice" role="status">{v4("fstNotice")} · {shared}</p>}
      <dl className="c4-fst-kpi" aria-label={v4("fstKpi")}>
        <div><dt>{v4("fstSet")}</dt><dd>{rows.filter((row) => stampState(row.note) === "set").length}</dd></div>
        <div><dt>{v4("fstCatalog")}</dt><dd>{catalog}</dd></div>
        <div><dt>{v4("fstRowCount")}</dt><dd>{rowStampCount(rows)}</dd></div>
        <div><dt>{v4("fstFirmCount")}</dt><dd>{firmStampCount(rows)}</dd></div>
        <div><dt>{v4("fstShare")}</dt><dd>{stampShare(catalog, rows.length)}%</dd></div>
        <div><dt>{v4("fstShared")}</dt><dd>{shared}</dd></div>
      </dl>
      <div className="c4-fst-chart" aria-label={v4("fstBands")}>
        {bars.map((bar) => (
          <div key={bar.band} className="c4-fst-col">
            <div className="c4-fst-track" aria-hidden="true"><i style={{ height: `${Math.round((bar.count / maxBar) * 100)}%` }} /></div>
            <button type="button" className="c4-btn" onClick={() => setBand(bar.band)}>{bandLabel(v4, bar.band)} · {bar.count}</button>
          </div>
        ))}
        {!bars.length && <p className="c4-empty-gold">{v4("fstEmpty")}</p>}
      </div>
      <p className="c4-meta">{lead ? `${v4("fstLeading")} · ${bandLabel(v4, lead)}` : v4("fstLeadingNone")} · {toneLead ? `${v4("fstToneLead")} · ${toneLabel(v4, toneLead)}` : v4("fstToneNone")} · {shared ? `${v4("fstShared")} · ${shared}` : v4("fstSharedNone")}</p>
      <div className="c4-fst-filters">
        <label className="c4-lab"><span>{v4("fstSearch")}</span>
          <input ref={searchRef} className="c4-field" aria-label={v4("fstSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            setQuery("");
          }} />
        </label>
        <label className="c4-lab"><span>{v4("fstBands")}</span>
          <select className="c4-field" aria-label={v4("fstBands")} value={bandOn} onChange={(event) => setBand(event.target.value)}>
            <option value="all">{v4("fstAll")}</option>
            <option value="blank">{v4("fstClear")}</option>
            {BANDS.map((item) => <option key={item} value={item}>{bandLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("fstTone")}</span>
          <select className="c4-field" aria-label={v4("fstTone")} value={toneOn} onChange={(event) => setTone(event.target.value)}>
            <option value="all">{v4("fstAll")}</option>
            <option value="soft">{v4("fstSoft")}</option>
            <option value="firm">{v4("fstFirm")}</option>
          </select>
        </label>
      </div>
      <div className="c4-row">
        {(["all", "catalog", "row", "firm"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} aria-pressed={shape === item} onClick={() => setShape(item)}>
            {item === "all" ? v4("fstAllShapes") : item === "catalog" ? v4("fstCatalog") : item === "row" ? v4("fstRow") : v4("fstFirm")}
          </button>
        ))}
        {(["all", "reviewed", "open"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} aria-pressed={review === item} onClick={() => setReview(item)}>
            {item === "all" ? v4("fstAllReview") : item === "reviewed" ? v4("fstReviewed") : v4("fstOpenReview")}
          </button>
        ))}
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden((on) => !on)}>{showHidden ? v4("fstShown") : v4("fstHidden")}</button>
      </div>
      <ul className="c4-fst-bands" aria-label={v4("fstBands")}>
        {present.map((item) => (
          <li key={item}>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeHidden(toggleStamp(hidden, item, present))}>{bandLabel(v4, item)} · {hidden.includes(item) ? v4("fstShow") : v4("fstHide")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-row">
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkStampReview(reviewed, shown.flatMap((row) => (row.id ? [row.id] : [])), ids, true))}>{v4("fstBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkStampReview(reviewed, shown.flatMap((row) => (row.id ? [row.id] : [])), ids, false))}>{v4("fstBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("follow-stamps.csv", stampsCsv(rows))}>{v4("fstCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("follow-stamp-rows.csv", stampRowsCsv(shown, reviewed))}>{v4("fstRowCsv")}</button>
        <Link className="c4-btn" href={crmv4Href(base, "customers")}>{v4("fstCustomers")}</Link>
      </div>
      <ul className="c4-fst-rows">
        {shown.map((row) => {
          const code = stampCopy(row.note);
          const marked = reviewed.includes(row.id);
          return (
            <li key={row.id || row.label} data-band={stampBand(row.note) || "blank"} data-tone={stampTone(row.note) || "blank"} data-catalog={catalogStamp(row.note) ? "1" : "0"} data-reviewed={marked ? "1" : "0"}>
              <strong>{row.label}</strong>
              <p className="c4-meta">{code || v4("fstClear")} · {bandLabel(v4, stampBand(row.note) || (stampState(row.note) === "clear" ? "blank" : ""))} · {toneLabel(v4, stampTone(row.note))} {catalogStamp(row.note) ? `· ${v4("fstCatalogMark")}` : ""}</p>
              <div className="c4-row">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleStampReview(reviewed, row.id, ids))}>{marked ? v4("fstReviewed") : v4("fstReview")}</button>
                <button type="button" className="c4-btn" disabled={!code} onClick={() => {
                  if (!code) return;
                  void navigator.clipboard?.writeText(code);
                  setCopied(row.id);
                }}>{copied === row.id ? v4("fstCopied") : v4("fstCopy")}</button>
              </div>
            </li>
          );
        })}
        {!data.loading && !shown.length && <li className="c4-empty-gold">{v4("fstEmpty")}</li>}
      </ul>
      <p className="c4-meta">{v4("fstRules")}</p>
    </section>
  );
}
