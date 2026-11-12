"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  NBL_DENSITY_KEY,
  NBL_KEY,
  NBL_VIEW_KEY,
  TSL_KEY,
  TSL_REVIEW_KEY,
  activeBay,
  activePace,
  activeMetal,
  activePull,
  activeSealLane,
  activeSealTone,
  activeBellRinger,
  activeWeight,
  addBell,
  addBellTag,
  addBellView,
  adjacentBellCount,
  bayArg,
  bayGap,
  bayWidth,
  bulkSealReview,
  bulkBellArchive,
  bulkBellPace,
  bulkBellMetal,
  bulkBellPin,
  bulkBellTag,
  busiestBellRinger,
  clashBayCount,
  coolingBell,
  coolingBells,
  cyclePace,
  dropBellView,
  editBell,
  editBellNote,
  fairBellRinger,
  pealBellLoad,
  paceArg,
  paceFocusedBell,
  giltSealCount,
  holdFocusedBell,
  houseMetal,
  metalArg,
  lateBell,
  lateBellShare,
  pullArg,
  pullClashCount,
  leadingSeal,
  leadingSealTone,
  sealCopy,
  sealLane,
  sealLaneArg,
  sealLanes,
  sealMark,
  sealRowsCsv,
  sealShare,
  sealState,
  sealStep,
  sealTone,
  sealToneArg,
  sealsCsv,
  matchedBells,
  moveBellFocus,
  nextBell,
  pairBellCount,
  peakBay,
  pinFocusedBell,
  porchSealCount,
  threadSealCount,
  bellLaneCount,
  presentSealLanes,
  bellRingerArg,
  bellRingers,
  bellCopy,
  bellCounts,
  bellDensity,
  bellIndex,
  bellMetals,
  bellShare,
  bellsCsv,
  quietBay,
  quietHallBells,
  readHiddenSeals,
  readBellViews,
  readBells,
  readReviewedSeals,
  reminderBells,
  waxFocusedBell,
  ribbonSealCount,
  setBellArchive,
  setBellHold,
  setBellPin,
  setBellWax,
  setBellWeight,
  sharedMetalCount,
  sharedSealCount,
  snoozeFocusedBell,
  snoozeBell,
  sortBells,
  weightArg,
  weightLoad,
  cipherSealCount,
  stitchedSeal,
  stitchedSealCount,
  suggestMetal,
  suggestPull,
  suggestBellRinger,
  toggleSeal,
  toggleSealReview,
  visibleSealLanes,
  visibleSeals,
  visibleBells,
  wideSeal,
  type SealReview,
  type SealRow,
  type SealShape,
  type SealValue,
  type BellDensity,
  type BellSort,
  type BellTray,
  type BellView,
  type NoticeBell,
} from "@/lib/crmv4/round234";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const METALS = ["bronze", "pewter", "gilt"] as const;
const PACES = ["hush", "toll", "peal"] as const;
const LEAVES = ["3", "9", "27"] as const;
const SPINES = ["2", "6", "8"] as const;
const BAYS = ["1", "2", "3", "4", "5", "6", "7", "8"] as const;

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "nblAuditSave",
  edit: "nblAuditEdit",
  note: "nblAuditNote",
  gait: "nblAuditGait",
  pin: "nblAuditPin",
  unpin: "nblAuditUnpin",
  hold: "nblAuditHold",
  resume: "nblAuditResume",
  archive: "nblAuditArchive",
  open: "nblAuditOpen",
  ink: "nblAuditInk",
  tag: "nblAuditTag",
  spine: "nblAuditSpine",
  leaf: "nblAuditLeaf",
  seal: "nblAuditSeal",
};

type NoticeRow = { id?: string; title?: string | null; kind?: string | null };
type TicketRow = { id?: string; customer?: string | null; kind?: string | null; status?: string | null };

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

function textField(raw: string | null | undefined): string {
  return typeof raw === "string" ? raw : "";
}

function inkLabel(v4: V4, ink: string): string {
  if (ink === "BRONZE" || ink === "bronze") return v4("nblLinen");
  if (ink === "PEWTER" || ink === "pewter") return v4("nblWool");
  if (ink === "GILT" || ink === "gilt") return v4("nblSilk");
  return v4("nblBlankInk");
}

function gaitLabel(v4: V4, gait: string): string {
  if (gait === "hush") return v4("nblStill");
  if (gait === "toll") return v4("nblWalk");
  if (gait === "peal") return v4("nblFlare");
  return v4("nblBlankGait");
}

function laneLabel(v4: V4, lane: string): string {
  if (lane === "cipher") return v4("tslDigit");
  if (lane === "ribbon") return v4("tslFlag");
  if (lane === "thread") return v4("tslChoir");
  if (lane === "bell") return v4("tslNave");
  if (lane === "porch") return v4("tslPorch");
  if (lane === "blank") return v4("tslClear");
  return v4("tslUnmarked");
}

function toneLabel(v4: V4, tone: string): string {
  if (tone === "gilt") return v4("tslGilt");
  if (tone === "pale") return v4("tslPale");
  if (tone === "linen") return v4("tslLinen");
  if (tone === "ash") return v4("tslAsh");
  if (tone === "haze") return v4("tslHaze");
  return v4("tslUnmarked");
}

function gapLabel(v4: V4, bay: number | null, desk: string): string {
  const gap = bayGap(bay, desk);
  if (gap === null) return "";
  if (gap > 0) return `${v4("nblPast")} ${gap}`;
  if (gap < 0) return `${v4("nblAhead")} ${Math.abs(gap)}`;
  return v4("nblDue");
}

export function NoticeBells({ base, v4 }: { base: string; v4: V4 }) {
  const [panels, setPanels] = useState<NoticeBell[]>([]);
  const [views, setViews] = useState<BellView[]>([]);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [clerk, setClerk] = useState("");
  const [bay, setBay] = useState("");
  const [ink, setInk] = useState("");
  const [gait, setGait] = useState("");
  const [leafValue, setLeafValue] = useState("");
  const [spine, setSpine] = useState("");
  const [tag, setTag] = useState("");
  const [roster, setRoster] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<BellTray>("open");
  const [clerkFilter, setClerkFilter] = useState("all");
  const [inkFilter, setInkFilter] = useState("all");
  const [gaitFilter, setGaitFilter] = useState("all");
  const [bayFilter, setBayFilter] = useState("all");
  const [leafFilter, setLeafFilter] = useState("all");
  const [spineFilter, setSpineFilter] = useState("all");
  const [flareOnly, setFlareOnly] = useState(false);
  const [peakOnly, setPeakOnly] = useState(false);
  const [quietOnly, setQuietOnly] = useState(false);
  const [houseOnly, setHouseOnly] = useState(false);
  const [restingOnly, setRestingOnly] = useState(false);
  const [board, setBoard] = useState<"hall" | "index">("hall");
  const [order, setOrder] = useState<BellSort>("bay");
  const [density, setDensity] = useState<BellDensity>("airy");
  const [copied, setCopied] = useState("");
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [deskBay, setDeskBay] = useState("");
  const [moveInk, setMoveInk] = useState("gilt");
  const [picked, setPicked] = useState<string[]>([]);
  const [focus, setFocus] = useState(0);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const pinRef = useRef<() => void>(() => {});
  const leafRef = useRef<() => void>(() => {});
  const holdRef = useRef<() => void>(() => {});
  const gaitRef = useRef<() => void>(() => {});
  const sealRef = useRef<() => void>(() => {});
  const viewer = role === "viewer";
  useEffect(() => {
    const next = readBells(readJson(NBL_KEY, []));
    const saved = readBellViews(readJson(NBL_VIEW_KEY, []));
    setPanels(next);
    setViews(saved);
    setDensity(bellDensity(readJson(NBL_DENSITY_KEY, "airy")));
    writeJson(NBL_KEY, next);
    writeJson(NBL_VIEW_KEY, saved);
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);
  function store(next: NoticeBell[]) {
    const saved = readBells(next);
    setPanels(saved);
    writeJson(NBL_KEY, saved);
    setPicked((ids) => ids.filter((id) => saved.some((panel) => panel.id === id)));
  }
  function storeViews(next: BellView[]) {
    const saved = readBellViews(next);
    setViews(saved);
    writeJson(NBL_VIEW_KEY, saved);
  }
  function storeDensity(next: BellDensity) {
    setDensity(next);
    writeJson(NBL_DENSITY_KEY, next);
  }
  const clerks = bellRingers(panels);
  const inks = bellMetals(panels);
  const bars = METALS.map((item) => ({ ink: item.toUpperCase(), count: panels.filter((panel) => panel.ink === item.toUpperCase()).length })).filter((row) => row.count > 0);
  const clerkOn = activeBellRinger(clerkFilter, clerks);
  const inkOn = activeMetal(inkFilter, ["BRONZE", "PEWTER", "GILT", ...inks]);
  const gaitOn = activePace(gaitFilter, ["hush", "toll", "peal"]);
  const bayOn = activeBay(bayFilter);
  const leafOn = activePull(leafFilter);
  const spineOn = activeWeight(spineFilter);
  const pickedBay = bayArg(bayOn);
  const shown = sortBells(visibleBells(
    panels,
    tray,
    query,
    bellRingerArg(clerkOn),
    metalArg(inkOn),
    paceArg(gaitOn),
    pickedBay.exact,
    pickedBay.pick,
    pullArg(leafOn),
    weightArg(spineOn),
    flareOnly,
    peakOnly,
    houseOnly,
    quietOnly,
    restingOnly,
  ), order);
  const book = bellIndex(panels, query);
  const counts = bellCounts(panels, deskBay);
  const share = lateBellShare(panels, deskBay);
  const matched = matchedBells(panels, deskBay);
  const clashes = clashBayCount(panels);
  const leaves = pullClashCount(panels);
  const neighbors = adjacentBellCount(panels);
  const suggestedInk = suggestMetal(panels);
  const suggestedName = suggestBellRinger(panels);
  const suggestedLeaf = suggestPull(panels);
  const fair = fairBellRinger(panels, roster);
  const busy = busiestBellRinger(panels);
  const reminders = reminderBells(panels, deskBay);
  const cooling = coolingBells(panels);
  const nextTitle = nextBell(panels, deskBay);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  pinRef.current = () => {
    if (!viewer) store(pinFocusedBell(panels, shown.map((panel) => panel.id), focus));
  };
  leafRef.current = () => {
    if (!viewer) store(snoozeFocusedBell(panels, shown.map((panel) => panel.id), focus));
  };
  holdRef.current = () => {
    if (!viewer) store(holdFocusedBell(panels, shown.map((panel) => panel.id), focus));
  };
  gaitRef.current = () => {
    if (!viewer) store(paceFocusedBell(panels, shown.map((panel) => panel.id), focus));
  };
  sealRef.current = () => {
    if (!viewer) store(waxFocusedBell(panels, shown.map((panel) => panel.id), focus));
  };
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setTitle("");
        setNote("");
        setClerk("");
        setBay("");
        setInk("");
        setGait("");
        setLeafValue("");
        setSpine("");
        setTag("");
        setQuery("");
        setEditing("");
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey || typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocus((index) => moveBellFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => moveBellFocus(index, shown.length, -1));
        return;
      }
      if (event.key === "t" || event.key === "T") {
        event.preventDefault();
        titleRef.current?.focus();
        return;
      }
      if (event.key === "u" || event.key === "U") {
        event.preventDefault();
        pinRef.current();
        return;
      }
      if (event.key === "b" || event.key === "B") {
        event.preventDefault();
        leafRef.current();
        return;
      }
      if (event.key === "h" || event.key === "H") {
        event.preventDefault();
        holdRef.current();
        return;
      }
      if (event.key === "p" || event.key === "P") {
        event.preventDefault();
        gaitRef.current();
        return;
      }
      if (event.key === "g" || event.key === "G") {
        event.preventDefault();
        sealRef.current();
        return;
      }
      if (event.key === "d" || event.key === "D") {
        event.preventDefault();
        setBoard((value) => (value === "hall" ? "index" : "hall"));
        return;
      }
      if (event.key !== "/") return;
      event.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shown.length]);
  function saveBell() {
    if (viewer) return;
    store(addBell(panels, {
      id: `nbl-${Date.now()}`,
      title,
      note,
      clerk,
      bay,
      ink,
      gait,
      leaf: leafValue,
      spine,
      tags: tag,
    }));
    setTitle("");
    setNote("");
    setTag("");
  }
  function applyView(view: BellView) {
    setTray(view.tray);
    setQuery(view.query);
    setClerkFilter(view.clerk || "all");
    setInkFilter(view.ink || "all");
    setGaitFilter(view.gait || "all");
    setBayFilter(view.bay || "all");
    setLeafFilter(view.leaf || "all");
    setSpineFilter(view.spine || "all");
  }
  const focused = shown[focus];
  return (
    <section className="c4-nbl" aria-label={v4("nblTitle")} data-bells="1" data-desk="cloister" data-role={role} data-board={board} data-density={density}>
      <header className="c4-nbl-mast">
        <p className="c4-nbl-seal" data-logo="mono">{v4("nblLogo")}</p>
        <div>
          <p className="c4-nbl-kicker">{v4("nblSub")}</p>
          <h2 className="c4-title">{v4("nblTitle")}</h2>
        </div>
        <p className="c4-nbl-links">
          <Link href={crmv4Href(base, "notices")}>{v4("nblSub")}</Link>
          <Link href={crmv4Href(base, "tsl")}>{v4("tslTitle")}</Link>
        </p>
      </header>
      {viewer && <p className="c4-nbl-note">{v4("nblViewer")}</p>}
      <p className="c4-nbl-rule">{v4("nblHint")}</p>
      <ul className="c4-nbl-kpis" aria-label={v4("nblKpi")}>
        <li><span>{v4("nblOpen")}</span><strong>{counts.open}</strong></li>
        <li><span>{v4("nblHeld")}</span><strong>{counts.held}</strong></li>
        <li><span>{v4("nblArchived")}</span><strong>{counts.archived}</strong></li>
        <li><span>{v4("nblPinned")}</span><strong>{counts.pinned}</strong></li>
        <li><span>{v4("nblPeak")}</span><strong>{counts.peak}</strong></li>
        <li><span>{v4("nblLate")}</span><strong>{counts.late}</strong></li>
        <li><span>{v4("nblSame")}</span><strong>{counts.soon}</strong></li>
        <li><span>{v4("nblRaised")}</span><strong>{counts.spine}</strong></li>
        <li><span>{v4("nblHouse")}</span><strong>{counts.house}</strong></li>
        <li><span>{v4("nblWindow")}</span><strong>{counts.window}</strong></li>
        <li><span>{v4("nblMatched")}</span><strong>{matched}</strong></li>
        <li><span>{v4("nblSeal")}</span><strong>{counts.seal}</strong></li>
        <li><span>{v4("nblCooling")}</span><strong>{counts.cooling}</strong></li>
      </ul>
      <div className="c4-nbl-bars" aria-label={v4("nblInks")}>
        {bars.map((bar) => (
          <div key={bar.ink} className="c4-nbl-bar" data-ink={bar.ink.toLowerCase()}>
            <span>{inkLabel(v4, bar.ink)}</span>
            <i style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} />
            <strong>{bar.count}</strong>
          </div>
        ))}
      </div>
      <p className="c4-nbl-meta">
        {v4("nblLateShare")} {share}% · {v4("nblSuggestInk")} {inkLabel(v4, suggestedInk)} · {v4("nblSuggestLeaf")} {suggestedLeaf} · {v4("nblSuggestClerk")} {suggestedName || v4("nblBlankClerk")} · {v4("nblAssign")} {fair || v4("nblBlankClerk")} · {busy ? `${v4("nblBusiest")} ${busy}` : v4("nblBusiestNone")} · {clashes ? `${v4("nblClash")} ${clashes}` : v4("nblClashNone")} · {v4("nblLeafClash")} {leaves} · {neighbors ? `${v4("nblNeighbors")} ${neighbors}` : v4("nblNeighborsNone")} · {v4("nblLoad")} {weightLoad(panels)} · {v4("nblPair")} {pairBellCount(panels)} · {v4("nblShared")} {sharedMetalCount(panels)} · {v4("nblQuietHall")} {quietHallBells(panels)} · {v4("nblFlare")} {pealBellLoad(panels)} · {v4("nblBayWidth")} {bayWidth(panels)} · {v4("nblBays")} {new Set(panels.map((panel) => panel.bay).filter((item) => item !== null)).size} · {nextTitle ? `${v4("nblNext")} ${nextTitle}` : v4("nblNextNone")}
      </p>
      <div className="c4-nbl-tools">
        <label className="c4-lab"><span>{v4("nblTitleField")}</span><input ref={titleRef} className="c4-field" aria-label={v4("nblTitleField")} value={title} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("nblNote")}</span><input className="c4-field" aria-label={v4("nblNote")} aria-required={false} value={note} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("nblClerk")}</span><input className="c4-field" aria-label={v4("nblClerk")} aria-required={false} value={clerk} onChange={(event) => setClerk(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("nblBay")}</span>
          <select className="c4-select" aria-label={v4("nblBay")} value={bay} onChange={(event) => setBay(event.target.value)}>
            <option value="">{v4("nblBlank")}</option>
            {BAYS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("nblInk")}</span>
          <select className="c4-select" aria-label={v4("nblInk")} value={ink} onChange={(event) => setInk(event.target.value)}>
            <option value="">{v4("nblBlankInk")}</option>
            {METALS.map((item) => <option key={item} value={item}>{inkLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("nblGait")}</span>
          <select className="c4-select" aria-label={v4("nblGait")} value={gait} onChange={(event) => setGait(event.target.value)}>
            <option value="">{v4("nblBlankGait")}</option>
            {PACES.map((item) => <option key={item} value={item}>{gaitLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("nblLeaf")}</span>
          <select className="c4-select" aria-label={v4("nblLeaf")} value={leafValue} onChange={(event) => setLeafValue(event.target.value)}>
            <option value="">{v4("nblBlankLeaf")}</option>
            {LEAVES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("nblSpine")}</span>
          <select className="c4-select" aria-label={v4("nblSpine")} value={spine} onChange={(event) => setSpine(event.target.value)}>
            <option value="">{v4("nblResting")}</option>
            {SPINES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("nblTag")}</span><input className="c4-field" aria-label={v4("nblTag")} aria-required={false} value={tag} onChange={(event) => setTag(event.target.value)} /></label>
        <button type="button" className="c4-btn c4-btn-hot" disabled={viewer} onClick={saveBell}>{v4("nblAdd")}</button>
      </div>
      <div className="c4-nbl-tools">
        <label className="c4-lab"><span>{v4("nblDesk")}</span><input className="c4-field" aria-label={v4("nblDesk")} aria-required={false} value={deskBay} onChange={(event) => setDeskBay(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("nblRoster")}</span><input className="c4-field" aria-label={v4("nblRoster")} aria-required={false} value={roster} onChange={(event) => setRoster(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("nblSearch")}</span><input ref={searchRef} className="c4-field c4-nbl-search" aria-label={v4("nblSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <button type="button" className="c4-btn" onClick={() => storeDensity(density === "airy" ? "tight" : "airy")}>{density === "airy" ? v4("nblDensityTight") : v4("nblDensityAiry")}</button>
        <button type="button" className="c4-btn" data-on={order === "bay" ? "1" : "0"} onClick={() => setOrder("bay")}>{v4("nblSortBay")}</button>
        <button type="button" className="c4-btn" data-on={order === "clerk" ? "1" : "0"} onClick={() => setOrder("clerk")}>{v4("nblSortClerk")}</button>
        <button type="button" className="c4-btn" data-on={board === "hall" ? "1" : "0"} onClick={() => setBoard("hall")}>{v4("nblBoardHall")}</button>
        <button type="button" className="c4-btn" data-on={board === "index" ? "1" : "0"} onClick={() => setBoard("index")}>{v4("nblBoardIndex")}</button>
        <button type="button" className="c4-btn" onClick={() => download("report-lintels.csv", bellsCsv(panels, deskBay))}>{v4("nblCsv")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("nblOpen")}>
        {(["open", "held", "archived"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{item === "open" ? v4("nblOpen") : item === "held" ? v4("nblHeld") : v4("nblArchived")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={flareOnly ? "1" : "0"} onClick={() => setFlareOnly((value) => !value)}>{v4("nblFlareOnly")}</button>
        <button type="button" className="c4-chip" data-on={peakOnly ? "1" : "0"} onClick={() => setPeakOnly((value) => !value)}>{v4("nblPeakOnly")}</button>
        <button type="button" className="c4-chip" data-on={quietOnly ? "1" : "0"} onClick={() => setQuietOnly((value) => !value)}>{v4("nblQuietOnly")}</button>
        <button type="button" className="c4-chip" data-on={houseOnly ? "1" : "0"} onClick={() => setHouseOnly((value) => !value)}>{v4("nblHouseOnly")}</button>
        <button type="button" className="c4-chip" data-on={restingOnly ? "1" : "0"} onClick={() => setRestingOnly((value) => !value)}>{v4("nblRestingOnly")}</button>
      </div>
      <div className="c4-nbl-tools">
        <label className="c4-lab"><span>{v4("nblClerk")}</span>
          <select className="c4-select" aria-label={v4("nblClerk")} value={clerkOn} onChange={(event) => setClerkFilter(event.target.value)}>
            <option value="all">{v4("nblAll")}</option>
            <option value="blank">{v4("nblBlankClerk")}</option>
            {clerks.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("nblInk")}</span>
          <select className="c4-select" aria-label={v4("nblInk")} value={inkOn} onChange={(event) => setInkFilter(event.target.value)}>
            <option value="all">{v4("nblAll")}</option>
            <option value="blank">{v4("nblBlankInk")}</option>
            {METALS.map((item) => <option key={item} value={item.toUpperCase()}>{inkLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("nblGait")}</span>
          <select className="c4-select" aria-label={v4("nblGait")} value={gaitOn} onChange={(event) => setGaitFilter(event.target.value)}>
            <option value="all">{v4("nblAll")}</option>
            <option value="blank">{v4("nblBlankGait")}</option>
            {PACES.map((item) => <option key={item} value={item}>{gaitLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("nblBay")}</span>
          <select className="c4-select" aria-label={v4("nblBay")} value={bayOn} onChange={(event) => setBayFilter(event.target.value)}>
            <option value="all">{v4("nblAll")}</option>
            <option value="blank">{v4("nblBlank")}</option>
            <option value="early">{v4("nblEarly")}</option>
            <option value="mid">{v4("nblMid")}</option>
            <option value="late">{v4("nblLate")}</option>
            <option value="peak">{v4("nblPeak")}</option>
            <option value="quiet">{v4("nblQuiet")}</option>
            {BAYS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("nblLeaf")}</span>
          <select className="c4-select" aria-label={v4("nblLeaf")} value={leafOn} onChange={(event) => setLeafFilter(event.target.value)}>
            <option value="all">{v4("nblAll")}</option>
            <option value="blank">{v4("nblBlankLeaf")}</option>
            {LEAVES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("nblSpine")}</span>
          <select className="c4-select" aria-label={v4("nblSpine")} value={spineOn} onChange={(event) => setSpineFilter(event.target.value)}>
            <option value="all">{v4("nblAll")}</option>
            <option value="blank">{v4("nblResting")}</option>
            {SPINES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
      </div>
      <div className="c4-nbl-tools">
        <label className="c4-lab"><span>{v4("nblView")}</span><input className="c4-field" aria-label={v4("nblView")} aria-required={false} value={viewName} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => {
          storeViews(addBellView(views, { id: `view-${Date.now()}`, name: viewName, tray, query, clerk: clerkOn, ink: inkOn, gait: gaitOn, bay: bayOn, leaf: leafOn, spine: spineOn }));
          setViewName("");
        }}>{v4("nblView")}</button>
        {views.map((view) => (
          <span key={view.id} className="c4-nbl-view">
            <button type="button" className="c4-chip" onClick={() => applyView(view)}>{v4("nblApply")} {view.name}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropBellView(views, view.id))}>{v4("nblDropView")}</button>
          </span>
        ))}
      </div>
      <div className="c4-nbl-tools">
        <label className="c4-lab"><span>{v4("nblBulkInk")}</span>
          <select className="c4-select" aria-label={v4("nblBulkInk")} value={moveInk} onChange={(event) => setMoveInk(event.target.value)}>
            {METALS.map((item) => <option key={item} value={item}>{inkLabel(v4, item)}</option>)}
          </select>
        </label>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkBellMetal(panels, picked, moveInk))}>{v4("nblBulkInk")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkBellPin(panels, picked, true))}>{v4("nblBulkPin")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkBellArchive(panels, picked, true))}>{v4("nblBulkArchive")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkBellPace(panels, picked, "peal"))}>{v4("nblBulkGait")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkBellTag(panels, picked, "m"))}>{v4("nblBulkTag")}</button>
      </div>
      <p className="c4-nbl-keys">{v4("nblKeys")} {v4("nblEscape")} {v4("nblBoardKey")} {v4("nblGaitKey")} {v4("nblHoldKey")} {v4("nblSealKey")} {v4("nblPinKey")} {v4("nblLeafKey")}</p>
      {!shown.length && board === "hall" && <p className="c4-nbl-empty">{v4("nblEmpty")}</p>}
      {board === "hall" ? (
        <ol className={`c4-nbl-list ${density === "tight" ? "is-tight" : "is-airy"}`}>
          {shown.map((panel, index) => (
            <li key={panel.id} className="c4-nbl-card" data-on={focus === index ? "1" : "0"} data-ink={panel.ink.toLowerCase() || "blank"} data-late={lateBell(panel, deskBay) ? "1" : "0"} data-cooling={coolingBell(panel) ? "1" : "0"} data-peak={peakBay(panel.bay) ? "1" : "0"} data-quiet={quietBay(panel.bay) ? "1" : "0"} data-house={houseMetal(panel.ink) ? "1" : "0"}>
              <label className="c4-row">
                <input type="checkbox" checked={picked.includes(panel.id)} aria-label={panel.title} onChange={(event) => setPicked((ids) => event.target.checked ? [...ids, panel.id] : ids.filter((id) => id !== panel.id))} />
                <button type="button" className="c4-btn" data-on={focus === index ? "1" : "0"} onClick={() => setFocus(index)}>{v4("nblFocus")}</button>
              </label>
              {editing === panel.id ? (
                <label className="c4-lab"><span>{v4("nblEdit")}</span><input className="c4-field" aria-label={v4("nblEdit")} value={draft} onChange={(event) => setDraft(event.target.value)} onBlur={() => { if (!viewer) store(editBell(panels, panel.id, draft)); setEditing(""); }} /></label>
              ) : (
                <h3 className="c4-title">{panel.title}</h3>
              )}
              <p>{panel.clerk || v4("nblBlankClerk")} · {panel.bay ?? v4("nblBlank")} · {inkLabel(v4, panel.ink)} · {gaitLabel(v4, panel.gait)} · {panel.leaf ?? v4("nblBlankLeaf")} · {panel.spine} · {panel.tags.join(" ") || v4("nblBlank")} · {gapLabel(v4, panel.bay, deskBay)} · {panel.audit ? v4(AUDIT_KEY[panel.audit] || "nblAuditSave") : ""}</p>
              {editing === `${panel.id}-note` ? (
                <label className="c4-lab"><span>{v4("nblEditNote")}</span><input className="c4-field" aria-label={v4("nblEditNote")} aria-required={false} value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} onBlur={() => { if (!viewer) store(editBellNote(panels, panel.id, noteDraft)); setEditing(""); }} /></label>
              ) : <p>{panel.note}</p>}
              <div className="c4-row">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(panel.id); setDraft(panel.title); }}>{v4("nblEdit")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(`${panel.id}-note`); setNoteDraft(panel.note); }}>{v4("nblEditNote")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setBellPin(panels, panel.id, !panel.pinned))}>{panel.pinned ? v4("nblUnpin") : v4("nblPin")}</button>
                <button type="button" className="c4-btn" disabled={viewer || panel.archived} onClick={() => store(setBellHold(panels, panel.id, !panel.held))}>{panel.held ? v4("nblResume") : v4("nblHold")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setBellArchive(panels, panel.id, !panel.archived))}>{panel.archived ? v4("nblReopen") : v4("nblArchive")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cyclePace(panels, panel.id))}>{v4("nblGait")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setBellWax(panels, panel.id, !panel.seal))}>{panel.seal ? v4("nblUnseal") : v4("nblSeal")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(snoozeBell(panels, panel.id))}>{v4("nblSnooze")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setBellWeight(panels, panel.id, panel.spine === 8 ? "2" : panel.spine === 6 ? "8" : "6"))}>{v4("nblSpine")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addBellTag(panels, panel.id, "x"))}>{v4("nblTag")}</button>
                <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(bellCopy(panel, deskBay)); setCopied(panel.id); }}>{copied === panel.id ? v4("nblCopied") : v4("nblCopy")}</button>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <ol className="c4-nbl-index">
          {!book.length && <li className="c4-nbl-empty">{v4("nblEmpty")}</li>}
          {book.map((panel) => <li key={panel.id}><span>{panel.bay}</span><strong>{panel.title}</strong><em>{panel.clerk || v4("nblBlankClerk")}</em></li>)}
        </ol>
      )}
      <aside className="c4-nbl-side" aria-label={v4("nblReminders")}>
        <h3 className="c4-title">{v4("nblReminders")}</h3>
        {!reminders.length && <p>{v4("nblEmpty")}</p>}
        <ul>{reminders.map((panel) => <li key={panel.id}>{panel.title} · {lateBell(panel, deskBay) ? v4("nblLate") : v4("nblSame")}</li>)}</ul>
        <h3 className="c4-title">{v4("nblCooling")}</h3>
        {!cooling.length && <p>{v4("nblCoolingEmpty")}</p>}
        <ul>{cooling.map((panel) => <li key={panel.id}>{panel.title}</li>)}</ul>
        {focused && <p>{v4("nblFocus")} {focused.title} · {bellShare(counts.house, Math.max(1, counts.open))}%</p>}
      </aside>
    </section>
  );
}

function ticketNote(row: TicketRow): SealValue {
  return {
    customer: textField(row.customer),
    kind: textField(row.kind),
    status: textField(row.status),
  };
}

function noticeNote(row: NoticeRow): SealValue {
  return {
    customer: textField(row.title),
    kind: textField(row.kind),
    status: "",
  };
}

export function TicketSeals({ base, v4 }: { base: string; v4: V4 }) {
  const tickets = useJson<{ tickets?: TicketRow[] }>("/api/admin/tickets?take=24");
  const notes = useJson<{ items?: NoticeRow[] }>("/api/notifications?take=24");
  const [query, setQuery] = useState("");
  const [lane, setLane] = useState("all");
  const [tone, setTone] = useState("all");
  const [review, setReview] = useState<SealReview>("all");
  const [shape, setShape] = useState<SealShape>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [copied, setCopied] = useState("");
  const [focus, setFocus] = useState(0);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const reviewRef = useRef<() => void>(() => {});
  const viewer = role === "viewer";
  const rows = useMemo<SealRow[]>(() => {
    const cases = (tickets.data?.tickets || []).map((row, index) => ({
      id: row.id ? `ticket-${row.id}` : `ticket-${index}`,
      label: textField(row.customer),
      note: ticketNote(row),
    }));
    const inbox = (notes.data?.items || []).map((row, index) => ({
      id: row.id ? `notice-${row.id}` : `notice-${index}`,
      label: textField(row.title),
      note: noticeNote(row),
    }));
    return [...cases, ...inbox];
  }, [tickets.data?.tickets, notes.data?.items]);
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
    const present = presentSealLanes(rows);
    const ids = rows.map((row) => row.id);
    const nextHidden = readHiddenSeals(readJson(TSL_KEY, []), present);
    const nextReviewed = readReviewedSeals(readJson(TSL_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(TSL_KEY, nextHidden);
    writeJson(TSL_REVIEW_KEY, nextReviewed);
  }, [rows]);
  const present = presentSealLanes(rows);
  const lanes = visibleSealLanes(present, hidden, showHidden);
  const laneOn = activeSealLane(lane, present);
  const toneOn = activeSealTone(tone);
  const shown = visibleSeals(rows, sealLaneArg(laneOn), sealToneArg(toneOn), query, review, reviewed, shape)
    .filter((row) => {
      const state = sealState(row.note);
      const token = state === "set" ? sealLane(row.note) : state === "clear" ? "blank" : "";
      if (!token) return true;
      return lanes.includes(token);
    });
  reviewRef.current = () => {
    const row = shown[focus];
    if (!row || viewer) return;
    const next = toggleSealReview(reviewed, row.id);
    setReviewed(next);
    writeJson(TSL_REVIEW_KEY, next);
  };
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setQuery("");
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey || typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocus((index) => moveBellFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => moveBellFocus(index, shown.length, -1));
        return;
      }
      if (event.key === "r" || event.key === "R") {
        event.preventDefault();
        reviewRef.current();
        return;
      }
      if (event.key !== "/") return;
      event.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shown.length]);
  const lead = leadingSeal(rows);
  const toneLead = leadingSealTone(rows);
  const shared = sharedSealCount(rows);
  const stitched = stitchedSealCount(rows);
  const bars = sealLanes(rows).filter((line) => line.lane);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const ids = rows.map((row) => row.id);
  const known = rows.filter((row) => sealState(row.note) === "set").length;
  function storeHidden(next: string[]) {
    setHidden(next);
    writeJson(TSL_KEY, next);
  }
  function storeReviewed(next: string[]) {
    const saved = readReviewedSeals(next, ids);
    setReviewed(saved);
    writeJson(TSL_REVIEW_KEY, saved);
  }
  return (
    <section className="c4-tsl" aria-label={v4("tslTitle")} data-seals="1" data-desk="cloister" data-notices={notes.data?.items?.length ? "1" : "0"} data-tickets={tickets.data?.tickets?.length ? "1" : "0"} data-role={role} data-keyed={stitched ? "1" : "0"}>
      <header className="c4-tsl-mast">
        <p className="c4-tsl-seal" data-logo="mono">{v4("tslLogo")}</p>
        <div>
          <p className="c4-tsl-kicker">{v4("tslSub")}</p>
          <h2 className="c4-title">{v4("tslTitle")}</h2>
        </div>
        <ol className="c4-tsl-index" aria-label={v4("tslTitle")}>
          <li data-tone="gold">{v4("tslDigit")}</li>
          <li data-tone="ink">{v4("tslFlag")}</li>
          <li data-tone="wool">{v4("tslPorch")}</li>
        </ol>
      </header>
      <p className="c4-tsl-links">
        <Link href={crmv4Href(base, "notices")}>{v4("nblSub")}</Link>
        <Link href={crmv4Href(base, "nbl")}>{v4("nblTitle")}</Link>
        <Link href={crmv4Href(base, "support")}>{v4("tslSub")}</Link>
      </p>
      {viewer && <p className="c4-tsl-note">{v4("tslViewer")}</p>}
      <p className="c4-tsl-rule">{v4("tslHint")}</p>
      <ul className="c4-tsl-kpis" aria-label={v4("tslRules")}>
        <li><span>{v4("tslSet")}</span><strong>{known}</strong></li>
        <li><span>{v4("tslClear")}</span><strong>{rows.filter((row) => sealState(row.note) === "clear").length}</strong></li>
        <li><span>{v4("tslPorch")}</span><strong>{porchSealCount(rows)}</strong></li>
        <li><span>{v4("tslChoir")}</span><strong>{threadSealCount(rows)}</strong></li>
        <li><span>{v4("tslNave")}</span><strong>{bellLaneCount(rows)}</strong></li>
        <li><span>{v4("tslFlag")}</span><strong>{ribbonSealCount(rows)}</strong></li>
        <li><span>{v4("tslDigit")}</span><strong>{cipherSealCount(rows)}</strong></li>
        <li><span>{v4("tslGilt")}</span><strong>{giltSealCount(rows)}</strong></li>
        <li><span>{v4("tslShare")}</span><strong>{sealShare(stitched, Math.max(1, known))}%</strong></li>
        <li><span>{v4("tslShared")}</span><strong>{shared}</strong></li>
      </ul>
      <div className="c4-tsl-bars" aria-label={v4("tslLead")}>
        {bars.map((bar) => (
          <div key={bar.lane} className="c4-tsl-bar" data-lane={bar.lane}>
            <span>{laneLabel(v4, bar.lane)}</span>
            <i style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} />
            <strong>{bar.count}</strong>
          </div>
        ))}
      </div>
      <p className="c4-tsl-meta">{lead ? `${v4("tslLead")} ${laneLabel(v4, lead)}` : v4("tslEmpty")} · {toneLead ? `${v4("tslToneLead")} ${toneLabel(v4, toneLead)}` : v4("tslUnmarked")} · {v4("tslWide")} {rows.filter((row) => wideSeal(row.note)).length}</p>
      <label className="c4-lab"><span>{v4("tslSearch")}</span><input ref={searchRef} className="c4-field c4-tsl-search" aria-label={v4("tslSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
      <div className="c4-row" role="group" aria-label={v4("tslAll")}>
        <button type="button" className="c4-chip" data-on={laneOn === "all" ? "1" : "0"} onClick={() => setLane("all")}>{v4("tslAll")}</button>
        {present.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={laneOn === item ? "1" : "0"} onClick={() => setLane(item)}>{laneLabel(v4, item)}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("tslGilt")}>
        {(["all", "gilt", "pale", "linen", "ash", "haze"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={toneOn === item ? "1" : "0"} onClick={() => setTone(item)}>{item === "all" ? v4("tslAll") : toneLabel(v4, item)}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("tslShapeAll")}>
        {(["all", "clasp", "wide", "porch", "cipher", "ribbon"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>
            {item === "all" ? v4("tslShapeAll") : item === "clasp" ? v4("tslShapeClasp") : item === "wide" ? v4("tslShapeWide") : item === "porch" ? v4("tslShapePorch") : item === "cipher" ? v4("tslShapeDigit") : v4("tslShapeFlag")}
          </button>
        ))}
        <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} onClick={() => setReview("reviewed")}>{v4("tslReviewed")}</button>
        <button type="button" className="c4-chip" data-on={review === "fresh" ? "1" : "0"} onClick={() => setReview("fresh")}>{v4("tslFresh")}</button>
        <button type="button" className="c4-chip" data-on={review === "all" ? "1" : "0"} onClick={() => setReview("all")}>{v4("tslAll")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("tslShow")}</button>
      </div>
      <div className="c4-row">
        {present.map((item) => (
          <button key={item} type="button" className="c4-btn" data-on={hidden.includes(item) ? "1" : "0"} onClick={() => storeHidden(toggleSeal(hidden, item))}>{v4("tslHide")} {laneLabel(v4, item)}</button>
        ))}
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkSealReview(reviewed, shown.map((row) => row.id), true))}>{v4("tslBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkSealReview(reviewed, shown.map((row) => row.id), false))}>{v4("tslBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("hour-lanes.csv", sealsCsv(rows))}>{v4("tslCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("hour-rows.csv", sealRowsCsv(rows, reviewed))}>{v4("tslRowCsv")}</button>
      </div>
      <p className="c4-tsl-keys">{v4("nblKeys")} {v4("nblEscape")}</p>
      {!shown.length && <p className="c4-tsl-empty">{notes.error || tickets.error ? v4("tslUnmarked") : v4("tslEmpty")}</p>}
      <ol className="c4-tsl-list">
        {shown.map((row, index) => (
          <li key={row.id} className="c4-tsl-card" data-on={focus === index ? "1" : "0"} data-lane={sealLane(row.note) || "blank"} data-tone={sealTone(row.note) || "blank"} data-stitch={stitchedSeal(row.note) ? "1" : "0"} data-wide={wideSeal(row.note) ? "1" : "0"} data-reviewed={reviewed.includes(row.id) ? "1" : "0"}>
            <span className="c4-tsl-mark">{sealMark(row.note) || "—"}</span>
            <strong>{row.label || v4("tslClear")}</strong>
            <span>{laneLabel(v4, sealState(row.note) === "clear" ? "blank" : sealLane(row.note))}</span>
            <span>{toneLabel(v4, sealTone(row.note))}</span>
            <span>{v4("tslStep")} {sealStep(row.note)}</span>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleSealReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("tslReviewed") : v4("tslReview")}</button>
            <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(sealCopy(row.note)); setCopied(row.id); }}>{copied === row.id ? v4("tslCopied") : v4("tslCopy")}</button>
          </li>
        ))}
      </ol>
    </section>
  );
}
