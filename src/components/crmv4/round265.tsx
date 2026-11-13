"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  LOM_DENSITY_KEY,
  LOM_KEY,
  LOM_VIEW_KEY,
  LOOM_FRAMES,
  IVT_KEY,
  IVT_REVIEW_KEY,
  addLoom,
  addLoomTag,
  addLoomView,
  briskLoom,
  bulkLoomSilk,
  bulkLoomPin,
  bulkLoomSeal,
  bulkLoomBeat,
  bulkLoomTag,
  bulkInviteReview,
  busiestLoomWeaver,
  loomBars,
  loomCopy,
  loomCounts,
  loomCsv,
  loomDensity,
  loomWeavers,
  loomTimeline,
  clashFrameCount,
  cycleShuttle,
  dropLoomView,
  editLoom,
  editLoomNote,
  fairLoomWeaver,
  houseDye,
  idleLoom,
  idleLooms,
  laneInviteCount,
  lateLoom,
  leadingInvite,
  leadingInviteHue,
  lengthenLoom,
  lengthenLoomFocused,
  lowerLoom,
  lowerLoomFocused,
  moveLoomFocus,
  neighborLoomCount,
  overdueLoom,
  pauseLoomFocused,
  peakFrame,
  pinLoomFocused,
  shuttleFocused,
  presentInviteLanes,
  quietFrame,
  raiseLoom,
  raiseLoomFocused,
  readLooms,
  readLoomViews,
  readHiddenInvites,
  readReviewedInvites,
  reminderLooms,
  restingLoom,
  setLoomDye,
  setLoomPause,
  setLoomPin,
  setLoomSeal,
  setLoomStar,
  sharedInviteCount,
  shortenLoom,
  shortenLoomFocused,
  sortLooms,
  inviteCopy,
  inviteEcho,
  inviteHue,
  inviteKnown,
  inviteCap,
  inviteLane,
  inviteLanes,
  inviteLanesCsv,
  inviteLeap,
  inviteNotch,
  inviteRowsCsv,
  inviteShare,
  inviteSlash,
  inviteStamp,
  inviteStep,
  inviteTail,
  inviteTwin,
  inviteWide,
  starLoomFocused,
  suggestLoomWait,
  suggestFrame,
  suggestDye,
  tagLoomFocused,
  toggleInvite,
  toggleInviteReview,
  visibleLooms,
  visibleInviteLanes,
  visibleInvites,
  type LoomDensity,
  type LoomSlip,
  type LoomSort,
  type LoomTray,
  type LoomView,
  type InviteReview,
  type InviteRow,
  type InviteShape,
  type InviteValue,
} from "@/lib/crmv4/round265";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const DYES = ["flax", "wool", "silk"] as const;
const SHUTTLES = ["draw", "beat", "rest"] as const;
const WAITS = ["10", "20", "40"] as const;
const RANKS = ["2", "4", "6", "8"] as const;

const FRAME_KEY: Record<string, CrmV4CopyKey> = {
  warp: "lomWarp",
  weft: "lomWeft",
  reed: "lomReed",
  beam: "lomBeam",
  peak: "lomPeakFrame",
  quiet: "lomQuietFrame",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "lomAuditSave",
  edit: "lomAuditEdit",
  note: "lomAuditNote",
  shuttle: "lomAuditShuttle",
  pin: "lomAuditPin",
  unpin: "lomAuditUnpin",
  pause: "lomAuditPause",
  resume: "lomAuditResume",
  seal: "lomAuditSeal",
  open: "lomAuditOpen",
  dye: "lomAuditDye",
  tag: "lomAuditTag",
  rank: "lomAuditRank",
  wait: "lomAuditWait",
  short: "lomAuditShort",
  flag: "lomAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  seal: "ivtSeal",
  card: "ivtCard",
  mark: "ivtMark",
  seam: "ivtSeam",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  ivory: "ivtIvory",
  graphite: "ivtGraphite",
  champagne: "ivtChampagne",
};

type TraderRow = {
  id?: string;
  name?: string | null;
  referralCodeUsed?: string | null;
};

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

function textField(raw: unknown): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").trim();
}

function frameLabel(v4: V4, frame: string): string {
  const key = FRAME_KEY[frame];
  return key ? v4(key) : v4("lomBlank");
}

function dyeLabel(v4: V4, dye: string): string {
  if (dye === "FLAX") return v4("lomFlax");
  if (dye === "WOOL") return v4("lomWool");
  if (dye === "SILK") return v4("lomSilk");
  return v4("lomBlankDye");
}

function shuttleLabel(v4: V4, shuttle: string): string {
  if (shuttle === "draw") return v4("lomDraw");
  if (shuttle === "beat") return v4("lomBeat");
  if (shuttle === "rest") return v4("lomRest");
  return v4("lomBlankShuttle");
}

function laneLabel(v4: V4, lane: string): string {
  const key = LANE_KEY[lane];
  return key ? v4(key) : v4("ivtUnmarked");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("ivtUnmarked");
}

export function LoomSlips({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<LoomSlip[]>([]);
  const [views, setViews] = useState<LoomView[]>([]);
  const [density, setDensity] = useState<LoomDensity>("roomy");
  const [sort, setSort] = useState<LoomSort>("frame");
  const [tray, setTray] = useState<LoomTray>("open");
  const [query, setQuery] = useState("");
  const [weaverFilter, setWeaverFilter] = useState("all");
  const [dyeFilter, setDyeFilter] = useState("all");
  const [shuttleFilter, setShuttleFilter] = useState("all");
  const [frameFilter, setFrameFilter] = useState("all");
  const [waitFilter, setWaitFilter] = useState("all");
  const [rankFilter, setRankFilter] = useState("all");
  const [houseOnly, setHouseOnly] = useState(false);
  const [peakOnly, setPeakOnly] = useState(false);
  const [quietOnly, setQuietOnly] = useState(false);
  const [desk, setDesk] = useState("reed");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [weaver, setWeaver] = useState("");
  const [frame, setFrame] = useState("");
  const [dye, setDye] = useState("");
  const [shuttle, setShuttle] = useState("");
  const [waitMin, setWaitMin] = useState("");
  const [rank, setRank] = useState("2");
  const [tags, setTags] = useState("");
  const [viewName, setViewName] = useState("");
  const [sheet, setSheet] = useState<"hall" | "index">("hall");
  const [picked, setPicked] = useState<string[]>([]);
  const [focus, setFocus] = useState(0);
  const [copied, setCopied] = useState("");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  useEffect(() => {
    setCards(readLooms(readJson(LOM_KEY, [])));
    setViews(readLoomViews(readJson(LOM_VIEW_KEY, [])));
    setDensity(loomDensity(readJson(LOM_DENSITY_KEY, "roomy")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);
  const shown = sortLooms(visibleLooms(cards, tray, query, weaverFilter, dyeFilter, shuttleFilter, frameFilter, waitFilter, rankFilter, houseOnly, peakOnly, quietOnly), sort);
  const focusAt = shown.length ? focus % shown.length : 0;
  const counts = loomCounts(cards, shown, desk);
  const timeline = loomTimeline(cards);
  const reminders = reminderLooms(cards);
  const idling = idleLooms(cards);
  const weavers = loomWeavers(cards);
  const bars = loomBars(cards);
  const ribbon = Math.max(1, bars.reduce((sum, bar) => sum + bar.count, 0));
  const ids = shown.map((card) => card.id);
  const busy = busiestLoomWeaver(cards);
  const clock = new Date().getUTCHours();
  const suggested = suggestDye(cards);
  const fair = fairLoomWeaver(cards, weavers.join(", ") || "Ada, Bea");
  const frameHint = suggestFrame(clock);
  function store(next: LoomSlip[]) {
    const saved = readLooms(next);
    setCards(saved);
    writeJson(LOM_KEY, saved);
  }
  function storeViews(next: LoomView[]) {
    const saved = readLoomViews(next);
    setViews(saved);
    writeJson(LOM_VIEW_KEY, saved);
  }
  function storeDensity(next: LoomDensity) {
    setDensity(next);
    writeJson(LOM_DENSITY_KEY, next);
  }
  function togglePick(id: string) {
    setPicked((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }
  function applyView(view: LoomView) {
    setTray(view.tray);
    setQuery(view.query);
    setWeaverFilter(view.weaver || "all");
    setDyeFilter(view.dye);
    setShuttleFilter(view.shuttle);
    setFrameFilter(view.frame);
    setWaitFilter(view.wait);
    setRankFilter(view.rank);
  }
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setTitle("");
        setNote("");
        setWeaver("");
        setFrame("");
        setDye("");
        setShuttle("");
        setWaitMin("");
        setTags("");
        return;
      }
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocus((index) => moveLoomFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => moveLoomFocus(index, shown.length, -1));
        return;
      }
      if (event.key === "h" || event.key === "H") {
        event.preventDefault();
        if (!viewer) store(pauseLoomFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "p" || event.key === "P") {
        event.preventDefault();
        if (!viewer) store(pinLoomFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "g" || event.key === "G") {
        event.preventDefault();
        if (!viewer) store(shuttleFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "l" || event.key === "L") {
        event.preventDefault();
        if (!viewer) store(lengthenLoomFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "r" || event.key === "R") {
        event.preventDefault();
        if (!viewer) store(shortenLoomFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        if (!viewer) store(tagLoomFocused(cards, ids, focusAt, "a"));
        return;
      }
      if (event.key === "w" || event.key === "W") {
        event.preventDefault();
        if (!viewer) store(starLoomFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "u" || event.key === "U") {
        event.preventDefault();
        if (!viewer) store(raiseLoomFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "y" || event.key === "Y") {
        event.preventDefault();
        if (!viewer) store(lowerLoomFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "b" || event.key === "B") {
        event.preventDefault();
        setSheet((value) => value === "hall" ? "index" : "hall");
        return;
      }
      if (event.key !== "/") return;
      event.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shown.length, viewer, cards, ids, focusAt]);
  return (
    <section className="c4-loom" aria-label={v4("lomTitle")} data-cards="1" data-desk="loom" data-role={role} data-density={density} data-sheet={sheet}>
      <header className="c4-loom-mast">
        <p className="c4-loom-seal" data-logo="mono">{v4("lomLogo")}</p>
        <div className="c4-loom-mast-copy">
          <p className="c4-loom-kicker">{v4("lomSub")}</p>
          <h2 className="c4-title">{v4("lomTitle")}</h2>
        </div>
        <i className="c4-loom-rule" aria-hidden="true" />
      </header>
      <p className="c4-loom-links">
        <Link href={crmv4Href(base, "ivt")}>{v4("lomPlates")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("lomCustomers")}</Link>
        <Link href={crmv4Href(base, "support")}>{v4("lomSupport")}</Link>
      </p>
      {viewer && <p className="c4-loom-note">{v4("lomViewer")}</p>}
      <p className="c4-loom-lead">{v4("lomKeys")}</p>
      <p className="c4-loom-hint">{v4("lomHint")}</p>
      <p className="c4-loom-notice" role="status">{v4("lomNotice")} {counts.overdue}</p>
      <ol className="c4-loom-ledger" aria-label={v4("lomChart")}>
        <li><span>{v4("lomOpen")}</span><strong>{counts.open}</strong></li>
        <li><span>{v4("lomPause")}</span><strong>{counts.pause}</strong></li>
        <li><span>{v4("lomSealed")}</span><strong>{counts.seal}</strong></li>
        <li><span>{v4("lomPinned")}</span><strong>{counts.pinned}</strong></li>
        <li><span>{v4("lomPeak")}</span><strong>{counts.peak}</strong></li>
        <li><span>{v4("lomQuiet")}</span><strong>{counts.quiet}</strong></li>
        <li><span>{v4("lomSoon")}</span><strong>{counts.soon}</strong></li>
        <li><span>{v4("lomOverdue")}</span><strong>{counts.overdue}</strong></li>
      </ol>
      <ol className="c4-loom-bars" aria-label={v4("lomBars")}>
        {bars.map((bar) => (
          <li key={bar.frame} data-frame={bar.frame}>
            <span>{frameLabel(v4, bar.frame)}</span>
            <i style={{ width: `${Math.round((bar.count / ribbon) * 100)}%` }} />
            <strong>{bar.count}</strong>
          </li>
        ))}
      </ol>
      <ol className="c4-loom-time" aria-label={v4("lomTimeline")}>
        {timeline.map((lane) => (
          <li key={lane.rank}><span>{lane.rank}</span><strong>{lane.titles.join(" · ")}</strong></li>
        ))}
      </ol>
      <div className="c4-loom-tools">
        <label className="c4-lab">
          <span>{v4("lomDesk")}</span>
          <select className="c4-select" aria-label={v4("lomDesk")} value={desk} onChange={(event) => setDesk(event.target.value)}>
            {LOOM_FRAMES.map((item) => <option key={item} value={item}>{frameLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("lomSearch")}</span>
          <input ref={searchRef} className="c4-field c4-loom-search" aria-label={v4("lomSearch")} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("lomSearch")} />
        </label>
        {(["open", "pause", "seal"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{item === "open" ? v4("lomOpen") : item === "pause" ? v4("lomPause") : v4("lomSealed")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={houseOnly ? "1" : "0"} onClick={() => setHouseOnly((value) => !value)}>{v4("lomHouseOnly")}</button>
        <button type="button" className="c4-chip" data-on={peakOnly ? "1" : "0"} onClick={() => setPeakOnly((value) => !value)}>{v4("lomPeak")}</button>
        <button type="button" className="c4-chip" data-on={quietOnly ? "1" : "0"} onClick={() => setQuietOnly((value) => !value)}>{v4("lomQuiet")}</button>
        <button type="button" className="c4-chip" data-on={sort === "weaver" ? "1" : "0"} onClick={() => setSort((value) => value === "frame" ? "weaver" : "frame")}>{sort === "weaver" ? v4("lomSortWeaver") : v4("lomSortFrame")}</button>
        <button type="button" className="c4-chip" data-on={density === "close" ? "1" : "0"} onClick={() => storeDensity(density === "roomy" ? "close" : "roomy")}>{density === "roomy" ? v4("lomRoomy") : v4("lomClose")}</button>
        <button type="button" className="c4-chip" onClick={() => setSheet((value) => value === "hall" ? "index" : "hall")}>{sheet === "hall" ? v4("lomHall") : v4("lomIndex")}</button>
      </div>
      <div className="c4-loom-tools">
        <select className="c4-select" aria-label={v4("lomWeaver")} value={weaverFilter} onChange={(event) => setWeaverFilter(event.target.value)}>
          <option value="all">{v4("lomAll")}</option>
          {weavers.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("lomDye")} value={dyeFilter} onChange={(event) => setDyeFilter(event.target.value)}>
          <option value="all">{v4("lomAll")}</option>
          {DYES.map((item) => <option key={item} value={item}>{dyeLabel(v4, item.toUpperCase())}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("lomShuttle")} value={shuttleFilter} onChange={(event) => setShuttleFilter(event.target.value)}>
          <option value="all">{v4("lomAll")}</option>
          {SHUTTLES.map((item) => <option key={item} value={item}>{shuttleLabel(v4, item)}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("lomFrame")} value={frameFilter} onChange={(event) => setFrameFilter(event.target.value)}>
          <option value="all">{v4("lomAll")}</option>
          <option value="peak">{v4("lomPeakFrame")}</option>
          <option value="quiet">{v4("lomQuietFrame")}</option>
          {LOOM_FRAMES.map((item) => <option key={item} value={item}>{frameLabel(v4, item)}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("lomWait")} value={waitFilter} onChange={(event) => setWaitFilter(event.target.value)}>
          <option value="all">{v4("lomAll")}</option>
          {WAITS.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("lomRank")} value={rankFilter} onChange={(event) => setRankFilter(event.target.value)}>
          <option value="all">{v4("lomAll")}</option>
          {RANKS.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </div>
      <form className="c4-loom-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addLoom(cards, { id: `lom-${Date.now()}`, title, note, weaver, frame, dye, shuttle, wait: waitMin, rank, tags });
        if (next.length === cards.length) return;
        store(next);
        setTitle("");
        setNote("");
        setTags("");
      }}>
        <label className="c4-lab"><span>{v4("lomTitleField")}</span><input className="c4-field" aria-label={v4("lomTitleField")} value={title} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("lomNote")}</span><input className="c4-field" aria-label={v4("lomNote")} aria-required={false} value={note} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <p className="c4-loom-meta">{v4("lomNoteOptional")}</p>
        <label className="c4-lab"><span>{v4("lomWeaver")}</span><input className="c4-field" aria-label={v4("lomWeaver")} value={weaver} disabled={viewer} onChange={(event) => setWeaver(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("lomFrame")}</span>
          <select className="c4-select" aria-label={v4("lomFrame")} value={frame} disabled={viewer} onChange={(event) => setFrame(event.target.value)}>
            <option value="">{v4("lomBlank")}</option>
            {LOOM_FRAMES.map((item) => <option key={item} value={item}>{frameLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("lomDye")}</span>
          <select className="c4-select" aria-label={v4("lomDye")} value={dye} disabled={viewer} onChange={(event) => setDye(event.target.value)}>
            <option value="">{v4("lomBlankDye")}</option>
            {DYES.map((item) => <option key={item} value={item}>{dyeLabel(v4, item.toUpperCase())}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("lomShuttle")}</span>
          <select className="c4-select" aria-label={v4("lomShuttle")} value={shuttle} disabled={viewer} onChange={(event) => setShuttle(event.target.value)}>
            <option value="">{v4("lomBlankShuttle")}</option>
            {SHUTTLES.map((item) => <option key={item} value={item}>{shuttleLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("lomWait")}</span>
          <select className="c4-select" aria-label={v4("lomWait")} value={waitMin} disabled={viewer} onChange={(event) => setWaitMin(event.target.value)}>
            <option value="">{v4("lomBlankWait")}</option>
            {WAITS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("lomRank")}</span>
          <select className="c4-select" aria-label={v4("lomRank")} value={rank} disabled={viewer} onChange={(event) => setRank(event.target.value)}>
            {RANKS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("lomTags")}</span><input className="c4-field" aria-label={v4("lomTags")} value={tags} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("lomAdd")}</button>
      </form>
      <form className="c4-loom-tools" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addLoomView(views, { id: `view-${Date.now()}`, name: viewName, tray, query, weaver: weaverFilter, dye: dyeFilter, shuttle: shuttleFilter, frame: frameFilter, wait: waitFilter, rank: rankFilter });
        if (next.length === views.length) return;
        storeViews(next);
        setViewName("");
      }}>
        <label className="c4-lab"><span>{v4("lomViewName")}</span><input className="c4-field" aria-label={v4("lomViewName")} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("lomSaveView")}</button>
        {views.map((view) => (
          <span key={view.id} className="c4-loom-view">
            <button type="button" className="c4-btn" onClick={() => applyView(view)}>{v4("lomApply")} {view.name}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropLoomView(views, view.id))}>{v4("lomDropView")}</button>
          </span>
        ))}
      </form>
      {picked.length > 0 && (
        <div className="c4-loom-tools">
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkLoomPin(cards, picked))}>{v4("lomBulkPin")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkLoomSeal(cards, picked))}>{v4("lomBulkSeal")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkLoomBeat(cards, picked))}>{v4("lomBulkBeat")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkLoomSilk(cards, picked))}>{v4("lomBulkSilk")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkLoomTag(cards, picked, "b"))}>{v4("lomBulkTag")}</button>
        </div>
      )}
      <p className="c4-loom-meta">{v4("lomSuggest")} {dyeLabel(v4, suggested)} · {v4("lomFair")} {fair} · {v4("lomBusy")} {busy || v4("lomBlankWeaver")} · {v4("lomNeighbors")} {neighborLoomCount(cards)} · {v4("lomClash")} {clashFrameCount(cards)} · {v4("lomWaitHint")} {suggestLoomWait(cards, clock)} · {v4("lomFrameHint")} {frameLabel(v4, frameHint)}</p>
      {(reminders.length > 0 || idling.length > 0) && (
        <p className="c4-loom-meta">{v4("lomDue")} {reminders.map((card) => card.title).join(" · ")} · {v4("lomIdle")} {idling.map((card) => card.title).join(" · ")}</p>
      )}
      {!shown.length && <p className="c4-loom-empty">{v4("lomEmpty")}</p>}
      <ol className={sheet === "index" ? "c4-loom-index" : "c4-loom-board"} data-density={density}>
        {shown.map((card, index) => {
          const dial = Math.round(((card.wait ?? 0) / 40) * 100);
          return (
            <li key={card.id} className="c4-loom-label" data-on={index === focusAt ? "1" : "0"} data-pinned={card.pinned ? "1" : "0"} data-overdue={overdueLoom(card) ? "1" : "0"} data-peak={peakFrame(card.frame) ? "1" : "0"} data-quiet={quietFrame(card.frame) ? "1" : "0"} data-house={houseDye(card.dye) ? "1" : "0"} data-brisk={briskLoom(card) ? "1" : "0"} data-idle={idleLoom(card) ? "1" : "0"} data-resting={restingLoom(card) ? "1" : "0"} data-late={lateLoom(card, desk) ? "1" : "0"}>
              <div className="c4-loom-monogram" aria-hidden="true">{(card.title[0] || "·").toUpperCase()}</div>
              <label className="c4-loom-pick"><input type="checkbox" checked={picked.includes(card.id)} aria-label={card.title} onChange={() => togglePick(card.id)} /></label>
              <div>
                <input className="c4-field" aria-label={v4("lomEdit")} value={card.title} disabled={viewer} onChange={(event) => store(editLoom(cards, card.id, event.target.value))} />
                <input className="c4-field" aria-label={v4("lomEditNote")} aria-required={false} value={card.note} disabled={viewer} onChange={(event) => store(editLoomNote(cards, card.id, event.target.value))} />
                <p className="c4-loom-meta">{card.weaver || v4("lomBlankWeaver")} · {frameLabel(v4, card.frame)} · {dyeLabel(v4, card.dye)} · {shuttleLabel(v4, card.shuttle)} · {card.wait ?? v4("lomBlankWait")} · {v4("lomRank")} {card.rank} · {card.tags.join(" ") || v4("lomTags")}</p>
                <p className="c4-loom-dial" aria-label={v4("lomWait")} style={{ background: `conic-gradient(#c6a15b ${dial}%, #efe6d6 ${dial}% 100%)` }} />
                <p className="c4-loom-meta">{frameLabel(v4, desk)} · {AUDIT_KEY[card.audit] ? v4(AUDIT_KEY[card.audit]) : v4("lomAuditSave")}</p>
                <div className="c4-loom-tools">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setLoomPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("lomUnpin") : v4("lomPin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer || card.sealed} onClick={() => store(setLoomPause(cards, card.id, !card.paused))}>{card.paused ? v4("lomResume") : v4("lomPause")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setLoomSeal(cards, card.id, !card.sealed))}>{card.sealed ? v4("lomOpenAgain") : v4("lomSealed")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setLoomStar(cards, card.id, !card.flagged))}>{card.flagged ? v4("lomUnstar") : v4("lomStar")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cycleShuttle(cards, card.id))}>{v4("lomTempo")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lengthenLoom(cards, card.id))}>{v4("lomLengthen")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(shortenLoom(cards, card.id))}>{v4("lomShorten")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseLoom(cards, card.id))}>{v4("lomRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerLoom(cards, card.id))}>{v4("lomLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setLoomDye(cards, card.id, card.dye === "SILK" ? "flax" : "silk"))}>{v4("lomDye")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addLoomTag(cards, card.id, "c"))}>{v4("lomTags")}</button>
                  <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(loomCopy(card)); setCopied(card.id); }}>{copied === card.id ? v4("lomCopied") : v4("lomCopy")}</button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <button type="button" className="c4-btn" onClick={() => download("loom-spools.csv", loomCsv(shown, desk))}>{v4("lomCsv")}</button>
    </section>
  );
}

export function InvitePlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: TraderRow[] }>("/api/admin/users?take=24&meta=0&role=TRADER");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [lane, setLane] = useState("all");
  const [hue, setHue] = useState("all");
  const [shape, setShape] = useState<InviteShape>("all");
  const [review, setReview] = useState<InviteReview>("all");
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [focus, setFocus] = useState(0);
  const [copied, setCopied] = useState("");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = useMemo<InviteRow[]>(() => (queue.data?.users || []).map((row, index) => ({
    id: row.id ? `trader-${row.id}` : `trader-${index}`,
    label: textField(row.name),
    note: { referralCodeUsed: textField(row.referralCodeUsed) } satisfies InviteValue,
  })), [queue.data?.users]);
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
    const present = presentInviteLanes(rows);
    const ids = rows.map((row) => row.id);
    const nextHidden = readHiddenInvites(readJson(IVT_KEY, []), present);
    const nextReviewed = readReviewedInvites(readJson(IVT_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(IVT_KEY, nextHidden);
    writeJson(IVT_REVIEW_KEY, nextReviewed);
  }, [rows]);
  const present = presentInviteLanes(rows);
  const lanes = visibleInviteLanes(present, hidden, showHidden);
  const shown = visibleInvites(rows, lane, hue, query, review, reviewed, shape).filter((row) => {
    const token = inviteLane(row.note);
    if (!token) return true;
    return showHidden || !hidden.includes(token);
  });
  const focusAt = shown.length ? focus % shown.length : 0;
  const bars = inviteLanes(rows);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const lead = leadingInvite(rows);
  const leadHue = leadingInviteHue(rows);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocus((index) => moveLoomFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => moveLoomFocus(index, shown.length, -1));
        return;
      }
      if (event.key === "m" || event.key === "M") {
        event.preventDefault();
        setShowHidden((value) => !value);
        return;
      }
      if (event.key !== "/") return;
      event.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shown, focusAt]);
  function storeHidden(next: string[]) {
    setHidden(next);
    writeJson(IVT_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(IVT_REVIEW_KEY, next);
  }
  return (
    <section className="c4-invite" aria-label={v4("ivtTitle")} data-plates="1" data-traders={rows.length} data-role={role}>
      <header className="c4-invite-mast">
        <p className="c4-invite-seal" data-logo="mono">{v4("ivtLogo")}</p>
        <div>
          <p className="c4-invite-kicker">{v4("ivtSub")}</p>
          <h2 className="c4-title">{v4("ivtTitle")}</h2>
        </div>
      </header>
      <ol className="c4-invite-index" aria-label={v4("ivtTitle")}>
        <li data-tone="gold">{v4("ivtChampagne")}</li>
        <li data-tone="ink">{v4("ivtGraphite")}</li>
        <li data-tone="ivory">{v4("ivtIvory")}</li>
      </ol>
      <p className="c4-invite-links">
        <Link href={crmv4Href(base, "lom")}>{v4("ivtSpools")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("lomCustomers")}</Link>
        <Link href={crmv4Href(base, "support")}>{v4("lomSupport")}</Link>
      </p>
      <p className="c4-invite-hint">{v4("ivtHint")}</p>
      {viewer && <p className="c4-invite-note">{v4("ivtViewer")}</p>}
      {queue.loading && <p className="c4-invite-meta">{v4("ivtEmpty")}</p>}
      {queue.error && <p className="c4-invite-meta">{queue.error}</p>}
      <ul className="c4-invite-kpis" aria-label={v4("ivtRules")}>
        <li><span>{v4("ivtLead")}</span><strong>{lead ? laneLabel(v4, lead) : v4("ivtUnmarked")}</strong></li>
        <li><span>{v4("ivtToneLead")}</span><strong>{leadHue ? hueLabel(v4, leadHue) : v4("ivtUnmarked")}</strong></li>
        <li><span>{v4("ivtShared")}</span><strong>{sharedInviteCount(rows)}</strong></li>
        <li><span>{v4("ivtShare")}</span><strong>{inviteShare(laneInviteCount(rows, "seal"), Math.max(1, rows.length))}%</strong></li>
        <li><span>{v4("ivtKnown")}</span><strong>{rows.filter((row) => inviteKnown(row.note)).length}</strong></li>
        <li><span>{v4("ivtTwin")}</span><strong>{rows.filter((row) => inviteTwin(row.note)).length}</strong></li>
        <li><span>{v4("ivtSlash")}</span><strong>{rows.filter((row) => inviteSlash(row.note)).length}</strong></li>
        <li><span>{v4("ivtEcho")}</span><strong>{rows.filter((row) => inviteEcho(row.note)).length}</strong></li>
      </ul>
      <div className="c4-invite-chart" aria-label={v4("ivtRules")}>
        {bars.map((bar) => (
          <button key={bar.lane} type="button" className="c4-invite-bar" data-on={lane === bar.lane ? "1" : "0"} onClick={() => setLane(lane === bar.lane ? "all" : bar.lane)}>
            <i style={{ height: `${Math.round((bar.count / maxBar) * 100)}%` }} />
            <strong>{bar.count}</strong>
            <span>{laneLabel(v4, bar.lane)}</span>
          </button>
        ))}
      </div>
      <div className="c4-invite-tools">
        <input ref={searchRef} className="c4-field c4-invite-search" aria-label={v4("ivtSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("ivtSearch")} />
        {(["all", "ivory", "graphite", "champagne"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("ivtAll") : hueLabel(v4, item)}</button>
        ))}
        {(["all", "seal", "card", "mark", "seam", "wide", "notch", "leap", "slash", "twin", "known", "echo"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>
            {item === "all" ? v4("ivtShapeAll") : item === "wide" ? v4("ivtShapeWide") : item === "notch" ? v4("ivtShapeNotch") : item === "leap" ? v4("ivtShapeLeap") : item === "slash" ? v4("ivtShapeSlash") : item === "twin" ? v4("ivtShapeTwin") : item === "known" ? v4("ivtShapeKnown") : item === "echo" ? v4("ivtShapeEcho") : laneLabel(v4, item)}
          </button>
        ))}
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{item === "all" ? v4("ivtAll") : item === "reviewed" ? v4("ivtReviewed") : v4("ivtUnreviewed")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("ivtShow")}</button>
      </div>
      <ul className="c4-invite-lanes">
        {lanes.map((item) => (
          <li key={item}>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeHidden(toggleInvite(hidden, item))}>{hidden.includes(item) ? v4("ivtShow") : v4("ivtHide")} {laneLabel(v4, item)}</button>
          </li>
        ))}
      </ul>
      {picked.length > 0 && (
        <div className="c4-invite-tools">
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkInviteReview(reviewed, picked, true))}>{v4("ivtBulkReview")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkInviteReview(reviewed, picked, false))}>{v4("ivtBulkClear")}</button>
        </div>
      )}
      {!shown.length && <p className="c4-invite-empty">{v4("ivtEmpty")}</p>}
      <ol className="c4-invite-board">
        {shown.map((row, index) => {
          const seen = reviewed.includes(row.id);
          return (
            <li key={row.id} className="c4-invite-card" data-on={index === focusAt ? "1" : "0"} data-lane={inviteLane(row.note)} data-hue={inviteHue(row.note)} data-reviewed={seen ? "1" : "0"} data-known={inviteKnown(row.note) ? "1" : "0"}>
              <p className="c4-invite-stamp">{inviteStamp(row.note) || "·"}</p>
              <label className="c4-invite-pick"><input type="checkbox" checked={picked.includes(row.id)} aria-label={row.label || row.id} onChange={() => setPicked((current) => current.includes(row.id) ? current.filter((item) => item !== row.id) : [...current, row.id])} /></label>
              <div>
                <strong>{row.label || v4("ivtUnmarked")}</strong>
                <p className="c4-invite-meta">{laneLabel(v4, inviteLane(row.note))} · {hueLabel(v4, inviteHue(row.note))} · {v4("ivtStep")} {inviteStep(row.note)}{inviteCap(row.note) ? ` · ${v4("ivtCap")}` : ""}{inviteTail(row.note) ? ` · ${v4("ivtTail")}` : ""}{inviteWide(row.note) ? ` · ${v4("ivtWide")}` : ""}{inviteNotch(row.note) ? ` · ${v4("ivtNotch")}` : ""}{inviteLeap(row.note) ? ` · ${v4("ivtLeap")}` : ""}</p>
                <div className="c4-invite-tools">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleInviteReview(reviewed, row.id))}>{seen ? v4("ivtReviewed") : v4("ivtReview")}</button>
                  <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(inviteCopy(row.note)); setCopied(row.id); }}>{copied === row.id ? v4("ivtCopied") : v4("ivtCopy")}</button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <div className="c4-invite-tools">
        <button type="button" className="c4-btn" onClick={() => download("invite-lanes.csv", inviteLanesCsv(rows))}>{v4("ivtCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("invite-rows.csv", inviteRowsCsv(shown, reviewed))}>{v4("ivtRowCsv")}</button>
      </div>
    </section>
  );
}
