"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  PLATE_KEY,
  PLATE_REVIEW_KEY,
  VPS_DENSITY_KEY,
  VPS_KEY,
  VPS_VIEW_KEY,
  activeHost,
  activeManner,
  activeMinute,
  activePhase,
  activePlateBand,
  activePlateTone,
  activeRank,
  activeSpan,
  activeWing,
  addPass,
  addPassTag,
  addPassView,
  bulkPassClose,
  bulkPassManner,
  bulkPassPin,
  bulkPassTag,
  bulkPlateReview,
  busiestHost,
  catalogPlate,
  catalogPlateCount,
  clashMinuteCount,
  cyclePhase,
  densityOf,
  dropPassView,
  editPass,
  editPassNote,
  fairHost,
  hostArg,
  houseWing,
  latePass,
  leadingPlate,
  leadingPlateTone,
  mannerArg,
  minuteArg,
  minuteGap,
  moveFocus,
  nextPass,
  passCopy,
  passCounts,
  passHosts,
  passShare,
  passTimeline,
  passWings,
  passesCsv,
  phaseArg,
  plateBand,
  plateBandArg,
  plateBands,
  plateCopy,
  plateRowsCsv,
  plateShare,
  plateState,
  plateTone,
  plateToneArg,
  platesCsv,
  presentPlates,
  rankArg,
  rankClashCount,
  readHiddenPlates,
  readPassViews,
  readPasses,
  readReviewedPlates,
  reminderPasses,
  resetPasses,
  setPassClose,
  setPassHold,
  setPassPause,
  setPassPin,
  sharedPlateCount,
  softPlateCount,
  soonPass,
  sortMode,
  sortPasses,
  spanArg,
  suggestHost,
  suggestManner,
  suggestSpan,
  togglePlate,
  togglePlateReview,
  usedMinutes,
  visiblePasses,
  visiblePlateBands,
  visiblePlateCustomers,
  widePlateCount,
  wingArg,
  type PlateRow,
  type PlateShape,
  type VisitPass,
  type VpsDensity,
  type VpsManner,
  type VpsPhase,
  type VpsSort,
  type VpsTray,
  type VpsView,
} from "@/lib/crmv4/round195";
import { useJson } from "./kit";
import { storedRole } from "./round5";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  brokerName?: string | null;
};

type GlanceRow = PlateRow & { id: string };

const MANNERS = ["quiet", "bright", "formal", "open"] as const;
const BANDS = ["trio", "quad", "span"] as const;

function mannerLabel(v4: V4, manner: VpsManner | string): string {
  if (manner === "quiet") return v4("vpsQuiet");
  if (manner === "bright") return v4("vpsBright");
  if (manner === "formal") return v4("vpsFormal");
  if (manner === "open") return v4("vpsOpen");
  return v4("vpsBlankManner");
}

function phaseLabel(v4: V4, phase: VpsPhase | string): string {
  if (phase === "wait") return v4("vpsWait");
  if (phase === "seat") return v4("vpsSeat");
  if (phase === "leave") return v4("vpsLeave");
  return v4("vpsBlankPhase");
}

function rankLabel(v4: V4, rank: number | null): string {
  if (rank === 2) return v4("vpsRank2");
  if (rank === 4) return v4("vpsRank4");
  if (rank === 8) return v4("vpsRank8");
  return v4("vpsBlankRank");
}

function spanLabel(v4: V4, span: number | null): string {
  if (span === 15) return v4("vpsSpan15");
  if (span === 30) return v4("vpsSpan30");
  if (span === 45) return v4("vpsSpan45");
  return v4("vpsBlankSpan");
}

function bandLabel(v4: V4, name: string): string {
  if (name === "trio") return v4("bplTrio");
  if (name === "quad") return v4("bplQuad");
  if (name === "span") return v4("bplSpan");
  if (name === "blank") return v4("bplClear");
  return v4("bplUnmarked");
}

function plateToneLabel(v4: V4, name: string): string {
  if (name === "soft") return v4("bplSoft");
  if (name === "hard") return v4("bplHard");
  return v4("bplUnmarked");
}

function auditLabel(v4: V4, audit: string): string {
  const key = {
    save: "vpsAuditSave",
    edit: "vpsAuditEdit",
    phase: "vpsAuditPhase",
    pin: "vpsAuditPin",
    unpin: "vpsAuditUnpin",
    hold: "vpsAuditHold",
    lift: "vpsAuditLift",
    close: "vpsAuditClose",
    reopen: "vpsAuditReopen",
    manner: "vpsAuditManner",
    tag: "vpsAuditTag",
    pause: "vpsAuditPause",
  }[audit];
  return key ? v4(key as CrmV4CopyKey) : "";
}

function gapLabel(v4: V4, minute: number | null, desk: string): string {
  const gap = minuteGap(minute, desk);
  if (gap === null) return "";
  if (gap > 0) return `${v4("vpsPast")} ${gap}`;
  if (gap < 0) return `${v4("vpsAhead")} ${Math.abs(gap)}`;
  return v4("vpsDue");
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

export function VisitPasses({ v4 }: { v4: V4 }) {
  const [passes, setPasses] = useState<VisitPass[]>([]);
  const [views, setViews] = useState<VpsView[]>([]);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [host, setHost] = useState("");
  const [minute, setMinute] = useState("");
  const [manner, setManner] = useState("");
  const [wing, setWing] = useState("");
  const [phase, setPhase] = useState("");
  const [rank, setRank] = useState("");
  const [spanValue, setSpanValue] = useState("");
  const [tag, setTag] = useState("");
  const [roster, setRoster] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<VpsTray>("open");
  const [hostFilter, setHostFilter] = useState("all");
  const [mannerFilter, setMannerFilter] = useState("all");
  const [wingFilter, setWingFilter] = useState("all");
  const [phaseFilter, setPhaseFilter] = useState("all");
  const [minuteFilter, setMinuteFilter] = useState("all");
  const [rankFilter, setRankFilter] = useState("all");
  const [spanFilter, setSpanFilter] = useState("all");
  const [seatedOnly, setSeatedOnly] = useState(false);
  const [peakOnly, setPeakOnly] = useState(false);
  const [quietOnly, setQuietOnly] = useState(false);
  const [houseOnly, setHouseOnly] = useState(false);
  const [awakeOnly, setAwakeOnly] = useState(false);
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const [order, setOrder] = useState<VpsSort>("minute");
  const [density, setDensity] = useState<VpsDensity>("roomy");
  const [copied, setCopied] = useState("");
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [deskMinute, setDeskMinute] = useState("");
  const [moveManner, setMoveManner] = useState("open");
  const [picked, setPicked] = useState<string[]>([]);
  const [focus, setFocus] = useState(0);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  useEffect(() => {
    const next = readPasses(readJson(VPS_KEY, []));
    const saved = readPassViews(readJson(VPS_VIEW_KEY, []));
    setPasses(next);
    setViews(saved);
    setDensity(densityOf(readJson(VPS_DENSITY_KEY, "roomy")));
    writeJson(VPS_KEY, next);
    writeJson(VPS_VIEW_KEY, saved);
    setRole(storedRole());
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);
  function store(next: VisitPass[]) {
    const saved = readPasses(next);
    setPasses(saved);
    writeJson(VPS_KEY, saved);
    setPicked((ids) => ids.filter((id) => saved.some((pass) => pass.id === id)));
  }
  function storeViews(next: VpsView[]) {
    const saved = readPassViews(next);
    setViews(saved);
    writeJson(VPS_VIEW_KEY, saved);
  }
  function storeDensity(next: VpsDensity) {
    setDensity(next);
    writeJson(VPS_DENSITY_KEY, next);
  }
  const hosts = passHosts(passes);
  const wings = passWings(passes);
  const bars = mannerCountsSafe(passes);
  const hostOn = activeHost(hostFilter, hosts);
  const mannerOn = activeManner(mannerFilter, MANNERS);
  const wingOn = activeWing(wingFilter, wings);
  const phaseOn = activePhase(phaseFilter, ["wait", "seat", "leave"]);
  const minuteOn = activeMinute(minuteFilter);
  const rankOn = activeRank(rankFilter);
  const spanOn = activeSpan(spanFilter);
  const pickedMinute = minuteArg(minuteOn);
  const shown = sortPasses(visiblePasses(
    passes,
    tray,
    query,
    hostArg(hostOn),
    mannerArg(mannerOn),
    wingArg(wingOn),
    phaseArg(phaseOn),
    pickedMinute.exact,
    pickedMinute.pick,
    rankArg(rankOn),
    spanArg(spanOn),
    seatedOnly,
    peakOnly,
    houseOnly,
    quietOnly,
    awakeOnly,
  ), order);
  const timeline = passTimeline(passes, query);
  const counts = passCounts(passes, deskMinute);
  const clashes = clashMinuteCount(passes);
  const ranks = rankClashCount(passes);
  const nextId = nextPass(passes, deskMinute);
  const nextRow = passes.find((pass) => pass.id === nextId);
  const suggestedManner = suggestManner(passes);
  const suggestedHost = suggestHost(passes);
  const suggestedSpan = suggestSpan(passes);
  const fair = fairHost(passes, roster);
  const busy = busiestHost(passes);
  const reminders = reminderPasses(passes, deskMinute);
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
    setManner("");
    setWing("");
    setPhase("");
    setRank("");
    setSpanValue("");
    setTag("");
    setQuery("");
    setEditing("");
  }
  return (
    <section className="c4-vps" aria-label={v4("vpsTitle")} data-visits="1" data-role={role} data-density={density}>
      <header className="c4-vps-mast">
        <div>
          <p className="c4-vps-kicker">{v4("vpsSub")}</p>
          <h2 className="c4-title">{v4("vpsTitle")}</h2>
        </div>
        <p className="c4-vps-plate" data-logo="mono">{v4("vpsLogo")}</p>
      </header>
      <p className="c4-vps-rules">{v4("vpsHint")}</p>
      <p className="c4-meta">{v4("vpsLocal")}</p>
      <p className="c4-meta">{v4("vpsNew")} {v4("vpsSlash")} {v4("vpsEscape")} {v4("vpsKeys")}</p>
      {viewer && <p className="c4-vps-notice" data-viewer="1">{v4("vpsViewer")}</p>}
      {counts.peak > 0 && (
        <p className="c4-vps-notice" role="status">
          {v4("vpsNotice")} · {counts.peak}
          <button type="button" className="c4-btn" onClick={() => setPeakOnly((on) => !on)}>{peakOnly ? v4("vpsNoticeAll") : v4("vpsNoticePeak")}</button>
        </p>
      )}
      <dl className="c4-vps-kpi" aria-label={v4("vpsKpi")}>
        <div><dt>{v4("vpsOpen")}</dt><dd>{counts.open}</dd></div>
        <div><dt>{v4("vpsHeld")}</dt><dd>{counts.held}</dd></div>
        <div><dt>{v4("vpsClosed")}</dt><dd>{counts.closed}</dd></div>
        <div><dt>{v4("vpsPinned")}</dt><dd>{counts.pinned}</dd></div>
        <div><dt>{v4("vpsPeak")}</dt><dd>{counts.peak}</dd></div>
        <div><dt>{v4("vpsLate")}</dt><dd>{counts.late}</dd></div>
        <div><dt>{v4("vpsSoon")}</dt><dd>{counts.soon}</dd></div>
        <div><dt>{v4("vpsPaused")}</dt><dd>{counts.paused}</dd></div>
        <div><dt>{v4("vpsHouseShare")}</dt><dd>{passShare(counts.house, passes.length)}%</dd></div>
      </dl>
      <div className="c4-vps-chart" aria-label={v4("vpsManners")}>
        {bars.map((bar) => (
          <div key={bar.manner} className="c4-vps-col">
            <div className="c4-vps-track" aria-hidden="true"><i style={{ height: `${Math.round((bar.count / maxBar) * 100)}%` }} /></div>
            <button type="button" className="c4-btn" onClick={() => setMannerFilter(bar.manner)}>{mannerLabel(v4, bar.manner)} · {bar.count}</button>
          </div>
        ))}
        {!bars.length && <p className="c4-empty-gold">{v4("vpsEmpty")}</p>}
      </div>
      <p className="c4-meta">{v4("vpsSuggestManner")} · {mannerLabel(v4, suggestedManner)} · {v4("vpsSuggestHost")} · {suggestedHost || v4("vpsBlankHost")} · {v4("vpsSuggestSpan")} · {spanLabel(v4, suggestedSpan)}</p>
      <p className="c4-meta">{v4("vpsMinuteUse")} · {usedMinutes(passes)} · {clashes ? `${v4("vpsClash")} · ${clashes}` : v4("vpsClashNone")} · {ranks ? `${v4("vpsRankClash")} · ${ranks}` : v4("vpsRankClashNone")}</p>
      <p className="c4-meta">{nextRow ? `${v4("vpsNext")} · ${nextRow.title}` : v4("vpsNextNone")} · {busy ? `${v4("vpsBusiest")} · ${busy}` : v4("vpsBusiestNone")} · {reminders.length ? `${v4("vpsReminders")} · ${reminders.length}` : v4("vpsReminderNone")}</p>
      <form className="c4-vps-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        store(addPass(passes, {
          id: `p${Date.now().toString(36)}`,
          title,
          note,
          host,
          minute,
          manner,
          wing,
          phase,
          rank,
          span: spanValue,
          tags: tag,
        }));
        setTitle("");
        setNote("");
      }}>
        <label className="c4-lab"><span>{v4("vpsLine")}</span>
          <input ref={titleRef} className="c4-field" aria-label={v4("vpsLine")} value={title} disabled={viewer} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("vpsNote")}</span>
          <input className="c4-field" aria-label={v4("vpsNote")} value={note} disabled={viewer} onChange={(event) => setNote(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("vpsHost")}</span>
          <input className="c4-field" aria-label={v4("vpsHost")} value={host} disabled={viewer} onChange={(event) => setHost(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("vpsMinute")}</span>
          <input className="c4-field" aria-label={v4("vpsMinute")} value={minute} disabled={viewer} onChange={(event) => setMinute(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("vpsManner")}</span>
          <select className="c4-field" aria-label={v4("vpsManner")} value={manner} disabled={viewer} onChange={(event) => setManner(event.target.value)}>
            <option value="">{v4("vpsBlankManner")}</option>
            {MANNERS.map((item) => <option key={item} value={item}>{mannerLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("vpsWing")}</span>
          <input className="c4-field" aria-label={v4("vpsWing")} value={wing} disabled={viewer} onChange={(event) => setWing(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("vpsPhase")}</span>
          <select className="c4-field" aria-label={v4("vpsPhase")} value={phase} disabled={viewer} onChange={(event) => setPhase(event.target.value)}>
            <option value="">{v4("vpsBlankPhase")}</option>
            <option value="wait">{v4("vpsWait")}</option>
            <option value="seat">{v4("vpsSeat")}</option>
            <option value="leave">{v4("vpsLeave")}</option>
          </select>
        </label>
        <label className="c4-lab"><span>{v4("vpsRank")}</span>
          <input className="c4-field" aria-label={v4("vpsRank")} value={rank} disabled={viewer} onChange={(event) => setRank(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("vpsSpan")}</span>
          <input className="c4-field" aria-label={v4("vpsSpan")} value={spanValue} disabled={viewer} onChange={(event) => setSpanValue(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("vpsTag")}</span>
          <input className="c4-field" aria-label={v4("vpsTag")} value={tag} disabled={viewer} onChange={(event) => setTag(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("vpsRoster")}</span>
          <input className="c4-field" aria-label={v4("vpsRoster")} value={roster} disabled={viewer} onChange={(event) => setRoster(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("vpsAdd")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => setManner(suggestedManner)}>{v4("vpsUseManner")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !suggestedHost} onClick={() => setHost(suggestedHost)}>{v4("vpsUseHost")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => setSpanValue(String(suggestedSpan))}>{v4("vpsUseSpan")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !fair} onClick={() => setHost(fair)}>{v4("vpsAssign")}</button>
      </form>
      <div className="c4-vps-filters">
        <label className="c4-lab"><span>{v4("vpsSearch")}</span>
          <input ref={searchRef} className="c4-field" aria-label={v4("vpsSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            clearDraft();
          }} />
        </label>
        <label className="c4-lab"><span>{v4("vpsMinute")}</span>
          <input className="c4-field" aria-label={v4("vpsDeskMinute")} value={deskMinute} onChange={(event) => setDeskMinute(event.target.value)} />
        </label>
      </div>
      <div className="c4-row">
        {(["open", "held", "closed"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} aria-pressed={tray === item} onClick={() => setTray(item)}>
            {item === "open" ? v4("vpsOpen") : item === "held" ? v4("vpsHeld") : v4("vpsClosed")}
          </button>
        ))}
        <button type="button" className="c4-chip" data-on={seatedOnly ? "1" : "0"} aria-pressed={seatedOnly} onClick={() => setSeatedOnly((on) => !on)}>{v4("vpsSeated")}</button>
        <button type="button" className="c4-chip" data-on={houseOnly ? "1" : "0"} aria-pressed={houseOnly} onClick={() => setHouseOnly((on) => !on)}>{v4("vpsHouseOnly")}</button>
        <button type="button" className="c4-chip" data-on={quietOnly ? "1" : "0"} aria-pressed={quietOnly} onClick={() => setQuietOnly((on) => !on)}>{v4("vpsQuietOnly")}</button>
        <button type="button" className="c4-chip" data-on={awakeOnly ? "1" : "0"} aria-pressed={awakeOnly} onClick={() => setAwakeOnly((on) => !on)}>{v4("vpsAwake")}</button>
        <button type="button" className="c4-chip" data-on={board === "cards" ? "1" : "0"} aria-pressed={board === "cards"} onClick={() => setBoard("cards")}>{v4("vpsCards")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} aria-pressed={board === "timeline"} onClick={() => setBoard("timeline")}>{v4("vpsTimeline")}</button>
        <button type="button" className="c4-chip" data-on={order === "minute" ? "1" : "0"} aria-pressed={order === "minute"} onClick={() => setOrder(sortMode(order === "minute" ? "title" : "minute"))}>{order === "minute" ? v4("vpsSortMinute") : v4("vpsSortTitle")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} aria-pressed={density === "tight"} onClick={() => storeDensity(densityOf(density === "tight" ? "roomy" : "tight"))}>{density === "tight" ? v4("vpsTight") : v4("vpsRoomy")}</button>
      </div>
      <div className="c4-vps-filters">
        <label className="c4-lab"><span>{v4("vpsHost")}</span>
          <select className="c4-field" aria-label={v4("vpsHost")} value={hostOn} onChange={(event) => setHostFilter(event.target.value)}>
            <option value="all">{v4("vpsAll")}</option>
            <option value="blank">{v4("vpsBlankHost")}</option>
            {hosts.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("vpsManner")}</span>
          <select className="c4-field" aria-label={v4("vpsManner")} value={mannerOn} onChange={(event) => setMannerFilter(event.target.value)}>
            <option value="all">{v4("vpsAll")}</option>
            <option value="blank">{v4("vpsBlankManner")}</option>
            {MANNERS.map((item) => <option key={item} value={item}>{mannerLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("vpsWing")}</span>
          <select className="c4-field" aria-label={v4("vpsWing")} value={wingOn} onChange={(event) => setWingFilter(event.target.value)}>
            <option value="all">{v4("vpsAll")}</option>
            <option value="blank">{v4("vpsBlankWing")}</option>
            {wings.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("vpsPhase")}</span>
          <select className="c4-field" aria-label={v4("vpsPhase")} value={phaseOn} onChange={(event) => setPhaseFilter(event.target.value)}>
            <option value="all">{v4("vpsAll")}</option>
            <option value="blank">{v4("vpsBlankPhase")}</option>
            <option value="wait">{v4("vpsWait")}</option>
            <option value="seat">{v4("vpsSeat")}</option>
            <option value="leave">{v4("vpsLeave")}</option>
          </select>
        </label>
        <label className="c4-lab"><span>{v4("vpsMinute")}</span>
          <select className="c4-field" aria-label={v4("vpsMinute")} value={minuteOn} onChange={(event) => setMinuteFilter(event.target.value)}>
            <option value="all">{v4("vpsAll")}</option>
            <option value="blank">{v4("vpsBlankMinute")}</option>
            <option value="dawn">{v4("vpsDawn")}</option>
            <option value="day">{v4("vpsDay")}</option>
            <option value="night">{v4("vpsNight")}</option>
            <option value="peak">{v4("vpsPeak")}</option>
            <option value="quiet">{v4("vpsQuietMinute")}</option>
          </select>
        </label>
        <label className="c4-lab"><span>{v4("vpsRank")}</span>
          <select className="c4-field" aria-label={v4("vpsRank")} value={rankOn} onChange={(event) => setRankFilter(event.target.value)}>
            <option value="all">{v4("vpsAll")}</option>
            <option value="blank">{v4("vpsBlankRank")}</option>
            <option value="2">{v4("vpsRank2")}</option>
            <option value="4">{v4("vpsRank4")}</option>
            <option value="8">{v4("vpsRank8")}</option>
          </select>
        </label>
        <label className="c4-lab"><span>{v4("vpsSpan")}</span>
          <select className="c4-field" aria-label={v4("vpsSpan")} value={spanOn} onChange={(event) => setSpanFilter(event.target.value)}>
            <option value="all">{v4("vpsAll")}</option>
            <option value="blank">{v4("vpsBlankSpan")}</option>
            <option value="15">{v4("vpsSpan15")}</option>
            <option value="30">{v4("vpsSpan30")}</option>
            <option value="45">{v4("vpsSpan45")}</option>
          </select>
        </label>
      </div>
      <form className="c4-row" onSubmit={(event) => {
        event.preventDefault();
        if (viewer || !viewName.trim()) return;
        storeViews(addPassView(views, {
          id: `v${Date.now().toString(36)}`,
          name: viewName,
          tray,
          query,
          host: hostOn,
          manner: mannerOn,
          wing: wingOn,
          phase: phaseOn,
          minute: minuteOn,
          rank: rankOn,
          span: spanOn,
        }));
        setViewName("");
      }}>
        <label className="c4-lab"><span>{v4("vpsViews")}</span>
          <input className="c4-field" aria-label={v4("vpsViews")} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("vpsSaveView")}</button>
      </form>
      {!!views.length && (
        <ul className="c4-vps-views">
          {views.map((view) => (
            <li key={view.id}>
              <button type="button" className="c4-btn" onClick={() => {
                setTray(view.tray);
                setQuery(view.query);
                setHostFilter(view.host);
                setMannerFilter(view.manner);
                setWingFilter(view.wing);
                setPhaseFilter(view.phase);
                setMinuteFilter(view.minute);
                setRankFilter(view.rank);
                setSpanFilter(view.span);
              }}>{view.name}</button>
              <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropPassView(views, view.id))}>{v4("vpsDropView")}</button>
            </li>
          ))}
        </ul>
      )}
      <div className="c4-row">
        <button type="button" className="c4-btn" onClick={() => setPicked(shown.map((pass) => pass.id))}>{v4("vpsPickAll")}</button>
        <button type="button" className="c4-btn" onClick={() => setPicked([])}>{v4("vpsPickNone")}</button>
        <p className="c4-meta">{v4("vpsPicked")} · {picked.length}</p>
        <label className="c4-lab"><span>{v4("vpsBulkManner")}</span>
          <select className="c4-field" aria-label={v4("vpsBulkManner")} value={moveManner} disabled={viewer} onChange={(event) => setMoveManner(event.target.value)}>
            {MANNERS.map((item) => <option key={item} value={item}>{mannerLabel(v4, item)}</option>)}
          </select>
        </label>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkPassManner(passes, picked, moveManner))}>{v4("vpsBulkManner")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkPassPin(passes, picked, true))}>{v4("vpsBulkPin")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkPassClose(passes, picked, true))}>{v4("vpsBulkClose")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length || !tag} onClick={() => store(bulkPassTag(passes, picked, tag))}>{v4("vpsBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("visit-passes.csv", passesCsv(passes, deskMinute))}>{v4("vpsCsv")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(resetPasses())}>{v4("vpsReset")}</button>
      </div>
      {board === "timeline" ? (
        <ol className="c4-vps-timeline">
          {timeline.map((pass) => (
            <li key={pass.id}>
              <strong>{pass.minute}</strong> {pass.title}
              <span className="c4-meta"> {gapLabel(v4, pass.minute, deskMinute)}</span>
            </li>
          ))}
          {!timeline.length && <li className="c4-empty-gold">{v4("vpsEmpty")}</li>}
        </ol>
      ) : (
        <ul className="c4-vps-cards">
          {shown.map((pass, index) => {
            const openEdit = editing === pass.id;
            const gap = gapLabel(v4, pass.minute, deskMinute);
            const late = latePass(pass, deskMinute);
            const soon = soonPass(pass);
            return (
              <li key={pass.id} data-late={late ? "1" : "0"} data-soon={soon ? "1" : "0"} data-house={houseWing(pass.wing) ? "1" : "0"} data-manner={pass.manner || "blank"} data-focus={index === focusAt ? "1" : "0"} tabIndex={index === focusAt ? 0 : -1}>
                <label className="c4-row">
                  <input type="checkbox" checked={picked.includes(pass.id)} aria-label={pass.title} onChange={() => setPicked((ids) => ids.includes(pass.id) ? ids.filter((id) => id !== pass.id) : [...ids, pass.id])} />
                  {openEdit ? (
                    <span className="c4-stack">
                      <input className="c4-field" aria-label={v4("vpsLine")} value={draft} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <input className="c4-field" aria-label={v4("vpsNote")} value={noteDraft} disabled={viewer} onChange={(event) => setNoteDraft(event.target.value)} />
                    </span>
                  ) : (
                    <span><strong>{pass.title}</strong> <span className="c4-meta">{pass.note}</span></span>
                  )}
                </label>
                <p className="c4-meta">{pass.host || v4("vpsBlankHost")} · {pass.minute ?? v4("vpsBlankMinute")} · {mannerLabel(v4, pass.manner)} · {pass.wing || v4("vpsBlankWing")} · {phaseLabel(v4, pass.phase)} · {rankLabel(v4, pass.rank)} · {spanLabel(v4, pass.span)} · {pass.tags.join(" ") || v4("vpsBlankTag")} · {gap} {auditLabel(v4, pass.audit)}</p>
                <div className="c4-row">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setPassPin(passes, pass.id, !pass.pinned))}>{pass.pinned ? v4("vpsUnpin") : v4("vpsPin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setPassHold(passes, pass.id, !pass.held))}>{pass.held ? v4("vpsLift") : v4("vpsHold")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setPassClose(passes, pass.id, !pass.closed))}>{pass.closed ? v4("vpsReopen") : v4("vpsClose")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cyclePhase(passes, pass.id))}>{v4("vpsPhaseUp")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setPassPause(passes, pass.id, pass.pause === 0 ? 15 : pass.pause === 15 ? 30 : 0))}>{pass.pause ? `${v4("vpsPause")} ${pass.pause}` : v4("vpsPauseOff")}</button>
                  <button type="button" className="c4-btn" disabled={viewer || !tag} onClick={() => store(addPassTag(passes, pass.id, tag))}>{v4("vpsTag")}</button>
                  {openEdit ? (
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => {
                      store(editPassNote(editPass(passes, pass.id, draft), pass.id, noteDraft));
                      setEditing("");
                    }}>{v4("vpsEdit")}</button>
                  ) : (
                    <button type="button" className="c4-btn" disabled={viewer} onClick={() => {
                      setEditing(pass.id);
                      setDraft(pass.title);
                      setNoteDraft(pass.note);
                    }}>{v4("vpsEdit")}</button>
                  )}
                  <button type="button" className="c4-btn" onClick={() => {
                    void navigator.clipboard?.writeText(passCopy(pass, deskMinute));
                    setCopied(pass.id);
                  }}>{copied === pass.id ? v4("vpsCopied") : v4("vpsCopy")}</button>
                </div>
              </li>
            );
          })}
          {!shown.length && <li className="c4-empty-gold">{v4("vpsEmpty")}</li>}
        </ul>
      )}
      <p className="c4-meta">{v4("vpsRules")}</p>
    </section>
  );
}

function mannerCountsSafe(passes: VisitPass[]): { manner: Exclude<VpsManner, "blank">; count: number }[] {
  return MANNERS.map((manner) => ({ manner, count: passes.filter((pass) => pass.manner === manner).length })).filter((row) => row.count > 0);
}

export function BrokerPlates({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [query, setQuery] = useState("");
  const [band, setBand] = useState("all");
  const [tone, setTone] = useState("all");
  const [shape, setShape] = useState<PlateShape>("all");
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
    note: { brokerName: user.brokerName ?? null },
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
    const present = presentPlates(rows);
    const ids = rows.map((row) => row.id);
    const nextHidden = readHiddenPlates(readJson(PLATE_KEY, []), present);
    const nextReviewed = readReviewedPlates(readJson(PLATE_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(PLATE_KEY, nextHidden);
    writeJson(PLATE_REVIEW_KEY, nextReviewed);
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
  const present = presentPlates(rows);
  const bands = visiblePlateBands(present, hidden, showHidden);
  const bandOn = activePlateBand(band, present);
  const toneOn = activePlateTone(tone);
  const shown = visiblePlateCustomers(rows, plateBandArg(bandOn), plateToneArg(toneOn), query, review, reviewed, shape)
    .filter((row) => {
      const state = plateState(row.note);
      const token = state === "set" ? plateBand(row.note) : state === "clear" ? "blank" : "";
      if (!token) return true;
      return bands.includes(token);
    });
  const lead = leadingPlate(rows);
  const toneLead = leadingPlateTone(rows);
  const shared = sharedPlateCount(rows);
  const catalog = catalogPlateCount(rows);
  const bars = plateBands(rows).filter((line) => line.band);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const ids = rows.map((row) => row.id);
  function storeHidden(next: string[]) {
    setHidden(next);
    writeJson(PLATE_KEY, next);
  }
  function storeReviewed(next: string[]) {
    const saved = readReviewedPlates(next, ids);
    setReviewed(saved);
    writeJson(PLATE_REVIEW_KEY, saved);
  }
  return (
    <section className="c4-bpl" aria-label={v4("bplTitle")} data-plates="1" data-role={role} data-catalog={catalog ? "1" : "0"}>
      <header className="c4-bpl-mast">
        <div>
          <p className="c4-bpl-kicker">{v4("bplSub")}</p>
          <h2 className="c4-title">{v4("bplTitle")}</h2>
        </div>
        <p className="c4-bpl-plate" data-logo="mono">{v4("bplLogo")}</p>
      </header>
      <p className="c4-bpl-rules">{v4("bplHint")}</p>
      <p className="c4-meta">{v4("bplKept")} {v4("bplEscape")}</p>
      {viewer && <p className="c4-bpl-notice" data-viewer="1">{v4("bplViewer")}</p>}
      {data.error && <p className="c4-empty-gold" role="alert">{v4("bplFailed")}</p>}
      {data.loading && <p className="c4-meta">{v4("bplLoading")}</p>}
      {shared > 0 && <p className="c4-bpl-notice" role="status">{v4("bplNotice")} · {shared}</p>}
      <dl className="c4-bpl-kpi" aria-label={v4("bplKpi")}>
        <div><dt>{v4("bplSet")}</dt><dd>{rows.filter((row) => plateState(row.note) === "set").length}</dd></div>
        <div><dt>{v4("bplCatalog")}</dt><dd>{catalog}</dd></div>
        <div><dt>{v4("bplWide")}</dt><dd>{widePlateCount(rows)}</dd></div>
        <div><dt>{v4("bplSoftCount")}</dt><dd>{softPlateCount(rows)}</dd></div>
        <div><dt>{v4("bplShare")}</dt><dd>{plateShare(catalog, rows.length)}%</dd></div>
        <div><dt>{v4("bplShared")}</dt><dd>{shared}</dd></div>
      </dl>
      <div className="c4-bpl-chart" aria-label={v4("bplBands")}>
        {bars.map((bar) => (
          <div key={bar.band} className="c4-bpl-col">
            <div className="c4-bpl-track" aria-hidden="true"><i style={{ height: `${Math.round((bar.count / maxBar) * 100)}%` }} /></div>
            <button type="button" className="c4-btn" onClick={() => setBand(bar.band)}>{bandLabel(v4, bar.band)} · {bar.count}</button>
          </div>
        ))}
        {!bars.length && <p className="c4-empty-gold">{v4("bplEmpty")}</p>}
      </div>
      <p className="c4-meta">{lead ? `${v4("bplLeading")} · ${bandLabel(v4, lead)}` : v4("bplLeadingNone")} · {toneLead ? `${v4("bplToneLead")} · ${plateToneLabel(v4, toneLead)}` : v4("bplToneNone")} · {shared ? `${v4("bplShared")} · ${shared}` : v4("bplSharedNone")}</p>
      <div className="c4-bpl-filters">
        <label className="c4-lab"><span>{v4("bplSearch")}</span>
          <input ref={searchRef} className="c4-field" aria-label={v4("bplSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            setQuery("");
          }} />
        </label>
        <label className="c4-lab"><span>{v4("bplBands")}</span>
          <select className="c4-field" aria-label={v4("bplBands")} value={bandOn} onChange={(event) => setBand(event.target.value)}>
            <option value="all">{v4("bplAll")}</option>
            <option value="blank">{v4("bplClear")}</option>
            {BANDS.map((item) => <option key={item} value={item}>{bandLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("bplTone")}</span>
          <select className="c4-field" aria-label={v4("bplTone")} value={toneOn} onChange={(event) => setTone(event.target.value)}>
            <option value="all">{v4("bplAll")}</option>
            <option value="soft">{v4("bplSoft")}</option>
            <option value="hard">{v4("bplHard")}</option>
          </select>
        </label>
      </div>
      <div className="c4-row">
        {(["all", "catalog", "span", "soft"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} aria-pressed={shape === item} onClick={() => setShape(item)}>
            {item === "all" ? v4("bplAllShapes") : item === "catalog" ? v4("bplCatalog") : item === "span" ? v4("bplSpan") : v4("bplSoft")}
          </button>
        ))}
        {(["all", "reviewed", "open"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} aria-pressed={review === item} onClick={() => setReview(item)}>
            {item === "all" ? v4("bplAllReview") : item === "reviewed" ? v4("bplReviewed") : v4("bplOpenReview")}
          </button>
        ))}
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden((on) => !on)}>{showHidden ? v4("bplShown") : v4("bplHidden")}</button>
      </div>
      <ul className="c4-bpl-bands" aria-label={v4("bplBands")}>
        {present.map((item) => (
          <li key={item}>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeHidden(togglePlate(hidden, item, present))}>{bandLabel(v4, item)} · {hidden.includes(item) ? v4("bplShow") : v4("bplHide")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-row">
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkPlateReview(reviewed, shown.map((row) => row.id), ids, true))}>{v4("bplBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkPlateReview(reviewed, shown.map((row) => row.id), ids, false))}>{v4("bplBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("broker-plates.csv", platesCsv(rows))}>{v4("bplCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("broker-plate-rows.csv", plateRowsCsv(shown, reviewed))}>{v4("bplRowCsv")}</button>
        <Link className="c4-btn" href={crmv4Href(base, "customers")}>{v4("bplCustomers")}</Link>
      </div>
      <ul className="c4-bpl-rows">
        {shown.map((row) => {
          const code = plateCopy(row.note);
          const marked = reviewed.includes(row.id);
          return (
            <li key={row.id} data-band={plateBand(row.note) || "blank"} data-tone={plateTone(row.note) || "blank"} data-catalog={catalogPlate(row.note) ? "1" : "0"} data-reviewed={marked ? "1" : "0"}>
              <strong>{row.label}</strong>
              <p className="c4-meta">{code || v4("bplClear")} · {bandLabel(v4, plateBand(row.note) || (plateState(row.note) === "clear" ? "blank" : ""))} · {plateToneLabel(v4, plateTone(row.note))} {catalogPlate(row.note) ? `· ${v4("bplCatalogMark")}` : ""}</p>
              <div className="c4-row">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(togglePlateReview(reviewed, row.id, ids))}>{marked ? v4("bplReviewed") : v4("bplReview")}</button>
                <button type="button" className="c4-btn" disabled={!code} onClick={() => {
                  if (!code) return;
                  void navigator.clipboard?.writeText(code);
                  setCopied(row.id);
                }}>{copied === row.id ? v4("bplCopied") : v4("bplCopy")}</button>
              </div>
            </li>
          );
        })}
        {!data.loading && !shown.length && <li className="c4-empty-gold">{v4("bplEmpty")}</li>}
      </ul>
      <p className="c4-meta">{v4("bplRules")}</p>
    </section>
  );
}
