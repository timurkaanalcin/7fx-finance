"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  PMK_KEY,
  PMK_REVIEW_KEY,
  QRE_DENSITY_KEY,
  QRE_KEY,
  QRE_VIEW_KEY,
  QUIRE_ROOMS,
  activeFolio,
  activeInk,
  activeRoom,
  activeStage,
  activeWait,
  addQuireSlip,
  addQuireTag,
  addQuireView,
  bulkPostmarkReview,
  bulkQuireArchive,
  bulkQuireInk,
  bulkQuirePin,
  bulkQuireSeal,
  bulkQuireTag,
  busiestReader,
  clashRoomCount,
  cycleStage,
  dropQuireView,
  editQuire,
  editQuireNote,
  fairReader,
  folioLoad,
  holdFocusedSlip,
  houseInk,
  huePostmarkCount,
  idleSlip,
  idleSlips,
  lanePostmarkCount,
  lateSlip,
  leadingPostmark,
  leadingPostmarkHue,
  lengthenFocusedSlip,
  lengthenWait,
  lowerFocusedSlip,
  lowerFolio,
  matchedSlips,
  moveQuireFocus,
  neighborSlipCount,
  nextSlip,
  overdueSlip,
  pairReaderCount,
  peakRoom,
  pinFocusedSlip,
  postmarkBound,
  postmarkCopy,
  postmarkHue,
  postmarkJoin,
  postmarkLane,
  postmarkLanes,
  postmarkLanesCsv,
  postmarkNotch,
  postmarkRowsCsv,
  postmarkShare,
  postmarkStamp,
  postmarkState,
  postmarkStep,
  postmarkWide,
  presentPostmarkLanes,
  sharedPostmarkCount,
  quietRoom,
  quireCopy,
  quireCounts,
  quireCsv,
  quireDensity,
  quireReaders,
  quireShare,
  quireSort,
  quireTimeline,
  raiseFocusedSlip,
  raiseFolio,
  readHiddenPostmarks,
  readQuireSlips,
  readQuireViews,
  readReviewedPostmarks,
  reminderSlips,
  restingSlip,
  ribbonFocusedSlip,
  roomBand,
  roomGap,
  rushSlip,
  setSlipArchive,
  setSlipHold,
  setSlipInk,
  setSlipPin,
  setSlipRibbon,
  shortenFocusedSlip,
  shortenWait,
  sortQuire,
  stageFocusedSlip,
  suggestInk,
  suggestWait,
  tagFocusedSlip,
  togglePostmark,
  togglePostmarkReview,
  visiblePostmarkLanes,
  visiblePostmarks,
  visibleQuire,
  waitClashCount,
  type PostmarkReview,
  type PostmarkRow,
  type PostmarkShape,
  type PostmarkValue,
  type QuireSlip,
  type QuireView,
  type SlipDensity,
  type SlipSort,
  type SlipTray,
} from "@/lib/crmv4/round246";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const INKS = ["iron", "oak", "soot"] as const;
const STAGES = ["draft", "fair", "sealed"] as const;
const WAITS = ["15", "30", "45"] as const;
const FOLIOS = ["2", "4", "6", "8"] as const;

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "qslAuditSave",
  edit: "qslAuditEdit",
  note: "qslAuditNote",
  stage: "qslAuditStage",
  pin: "qslAuditPin",
  unpin: "qslAuditUnpin",
  hold: "qslAuditHold",
  resume: "qslAuditResume",
  archive: "qslAuditArchive",
  open: "qslAuditOpen",
  ink: "qslAuditInk",
  tag: "qslAuditTag",
  folio: "qslAuditFolio",
  wait: "qslAuditWait",
  short: "qslAuditShort",
  ribbon: "qslAuditRibbon",
};

const ROOM_KEY: Record<string, CrmV4CopyKey> = {
  folio: "qslFolioRoom",
  quire: "qslQuire",
  vellum: "qslVellum",
  index: "qslIndex",
  margin: "qslMargin",
  colophon: "qslColophon",
};

type TraderRow = {
  id?: string;
  name?: string | null;
  phone?: string | null;
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

function textField(raw: string | null | undefined): string {
  return typeof raw === "string" ? raw : "";
}

function inkLabel(v4: V4, ink: string): string {
  if (ink === "IRON" || ink === "iron") return v4("qslIron");
  if (ink === "OAK" || ink === "oak") return v4("qslOak");
  if (ink === "SOOT" || ink === "soot") return v4("qslSoot");
  return v4("qslBlankInk");
}

function stageLabel(v4: V4, stage: string): string {
  if (stage === "draft") return v4("qslDraft");
  if (stage === "fair") return v4("qslFair");
  if (stage === "sealed") return v4("qslSealed");
  return v4("qslBlankStage");
}

function roomLabel(v4: V4, room: string): string {
  const key = ROOM_KEY[room];
  return key ? v4(key) : v4("qslBlank");
}

function bandLabel(v4: V4, band: string): string {
  if (band === "early") return v4("qslEarly");
  if (band === "mid") return v4("qslMid");
  if (band === "late") return v4("qslLate");
  return v4("qslBlank");
}

function laneLabel(v4: V4, lane: string): string {
  if (lane === "plus") return v4("pmkPlus");
  if (lane === "paren") return v4("pmkParen");
  if (lane === "dash") return v4("pmkDash");
  if (lane === "space") return v4("pmkSpace");
  if (lane === "short") return v4("pmkShort");
  if (lane === "local") return v4("pmkLocal");
  if (lane === "intl") return v4("pmkIntl");
  if (lane === "long") return v4("pmkLong");
  return v4("pmkUnmarked");
}

function hueLabel(v4: V4, hue: string): string {
  if (hue === "gilt") return v4("pmkGilt");
  if (hue === "slate") return v4("pmkSlate");
  if (hue === "sand") return v4("pmkSand");
  if (hue === "clay") return v4("pmkClay");
  if (hue === "soot") return v4("pmkSoot");
  if (hue === "pearl") return v4("pmkPearl");
  if (hue === "mist") return v4("pmkMist");
  return v4("pmkUnmarked");
}

export function QuireSlips({ base, v4 }: { base: string; v4: V4 }) {
  const [slips, setSlips] = useState<QuireSlip[]>([]);
  const [views, setViews] = useState<QuireView[]>([]);
  const [density, setDensity] = useState<SlipDensity>("airy");
  const [sort, setSort] = useState<SlipSort>("room");
  const [tray, setTray] = useState<SlipTray>("open");
  const [query, setQuery] = useState("");
  const [readerFilter, setReaderFilter] = useState("all");
  const [inkFilter, setInkFilter] = useState("all");
  const [stageFilter, setStageFilter] = useState("all");
  const [roomFilter, setRoomFilter] = useState("all");
  const [waitFilter, setWaitFilter] = useState("all");
  const [folioFilter, setFolioFilter] = useState("all");
  const [houseOnly, setHouseOnly] = useState(false);
  const [peakOnly, setPeakOnly] = useState(false);
  const [quietOnly, setQuietOnly] = useState(false);
  const [desk, setDesk] = useState("quire");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [reader, setReader] = useState("");
  const [room, setRoom] = useState("");
  const [ink, setInk] = useState("");
  const [stage, setStage] = useState("");
  const [waitMin, setWaitMin] = useState("");
  const [folio, setFolio] = useState("2");
  const [tags, setTags] = useState("");
  const [viewName, setViewName] = useState("");
  const [board, setBoard] = useState<"hall" | "index">("hall");
  const [picked, setPicked] = useState<string[]>([]);
  const [focus, setFocus] = useState(0);
  const [copied, setCopied] = useState("");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  useEffect(() => {
    setSlips(readQuireSlips(readJson(QRE_KEY, [])));
    setViews(readQuireViews(readJson(QRE_VIEW_KEY, [])));
    setDensity(quireDensity(readJson(QRE_DENSITY_KEY, "airy")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);
  const shown = sortQuire(visibleQuire(slips, tray, query, readerFilter, inkFilter, stageFilter, roomFilter, waitFilter, folioFilter, houseOnly, peakOnly, quietOnly), sort);
  const focusAt = shown.length ? focus % shown.length : 0;
  const counts = quireCounts(slips, shown, desk);
  const timeline = quireTimeline(slips);
  const reminders = reminderSlips(slips);
  const idling = idleSlips(slips);
  const readers = quireReaders(slips);
  const focused = shown[focusAt];
  const ids = shown.map((slip) => slip.id);
  function store(next: QuireSlip[]) {
    const saved = readQuireSlips(next);
    setSlips(saved);
    writeJson(QRE_KEY, saved);
  }
  function storeViews(next: QuireView[]) {
    const saved = readQuireViews(next);
    setViews(saved);
    writeJson(QRE_VIEW_KEY, saved);
  }
  function storeDensity(next: SlipDensity) {
    setDensity(next);
    writeJson(QRE_DENSITY_KEY, next);
  }
  function togglePick(id: string) {
    setPicked((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }
  function applyView(view: QuireView) {
    setTray(view.tray);
    setQuery(view.query);
    setReaderFilter(view.reader || "all");
    setInkFilter(view.ink);
    setStageFilter(view.stage);
    setRoomFilter(view.room);
    setWaitFilter(view.wait);
    setFolioFilter(view.folio);
  }
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setTitle("");
        setNote("");
        setReader("");
        setRoom("");
        setInk("");
        setStage("");
        setWaitMin("");
        setTags("");
        return;
      }
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocus((index) => moveQuireFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => moveQuireFocus(index, shown.length, -1));
        return;
      }
      if (event.key === "h" || event.key === "H") {
        event.preventDefault();
        if (!viewer) store(holdFocusedSlip(slips, ids, focusAt));
        return;
      }
      if (event.key === "p" || event.key === "P") {
        event.preventDefault();
        if (!viewer) store(pinFocusedSlip(slips, ids, focusAt));
        return;
      }
      if (event.key === "f" || event.key === "F") {
        event.preventDefault();
        if (!viewer) store(stageFocusedSlip(slips, ids, focusAt));
        return;
      }
      if (event.key === "s" || event.key === "S") {
        event.preventDefault();
        if (!viewer) store(lengthenFocusedSlip(slips, ids, focusAt));
        return;
      }
      if (event.key === "u" || event.key === "U") {
        event.preventDefault();
        if (!viewer) store(shortenFocusedSlip(slips, ids, focusAt));
        return;
      }
      if (event.key === "t" || event.key === "T") {
        event.preventDefault();
        if (!viewer) store(tagFocusedSlip(slips, ids, focusAt, "a"));
        return;
      }
      if (event.key === "w" || event.key === "W") {
        event.preventDefault();
        if (!viewer) store(ribbonFocusedSlip(slips, ids, focusAt));
        return;
      }
      if (event.key === "b" || event.key === "B") {
        event.preventDefault();
        if (!viewer) store(raiseFocusedSlip(slips, ids, focusAt));
        return;
      }
      if (event.key === "n" || event.key === "N") {
        event.preventDefault();
        if (!viewer) store(lowerFocusedSlip(slips, ids, focusAt));
        return;
      }
      if (event.key === "d" || event.key === "D") {
        event.preventDefault();
        setBoard((value) => value === "hall" ? "index" : "hall");
        return;
      }
      if (event.key !== "/") return;
      event.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });
  const bars = QUIRE_ROOMS.map((item) => ({ room: item, count: slips.filter((slip) => !slip.archived && !slip.held && slip.room === item).length }));
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const suggested = suggestInk(slips);
  const suggestedWait = suggestWait(slips, new Date().getUTCHours());
  const fair = fairReader(slips, readers.join(", "));
  return (
    <section className="c4-qsl" aria-label={v4("qslTitle")} data-slips="1" data-desk="scriptorium" data-role={role} data-density={density}>
      <header className="c4-qsl-mast">
        <p className="c4-qsl-seal" data-logo="mono">{v4("qslLogo")}</p>
        <div className="c4-qsl-rule" aria-hidden="true"><i /><i /><i /><i /></div>
        <div>
          <p className="c4-qsl-kicker">{v4("qslSub")}</p>
          <h2 className="c4-title">{v4("qslTitle")}</h2>
        </div>
        <ol className="c4-qsl-index" aria-label={v4("qslTitle")}>
          <li data-tone="gold">{v4("qslChampagne")}</li>
          <li data-tone="ink">{v4("qslGraphite")}</li>
          <li data-tone="ivory">{v4("qslIvory")}</li>
        </ol>
      </header>
      <p className="c4-qsl-links">
        <Link href={crmv4Href(base, "pmk")}>{v4("pmkTitle")}</Link>
        <Link href={crmv4Href(base, "scripts")}>{v4("qslScripts")}</Link>
        <Link href={crmv4Href(base, "eod")}>{v4("qslClose")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("qslCustomers")}</Link>
      </p>
      {viewer && <p className="c4-qsl-note">{v4("qslViewer")}</p>}
      <p className="c4-qsl-lead">{v4("qslHint")}</p>
      <p className="c4-qsl-meta">{v4("qslLocal")} · {v4("qslKeys")} · {v4("qslHoldKey")} · {v4("qslPinKey")} · {v4("qslWaitKey")} · {v4("qslShortKey")} · {v4("qslTagKey")} · {v4("qslBoardKey")} · {v4("qslFolioKey")} · {v4("qslLowerKey")} · {v4("qslStageKey")} · {v4("qslRibbonKey")} · {v4("qslEscape")}</p>
      <ul className="c4-qsl-kpis" aria-label={v4("qslKpi")}>
        <li><span>{v4("qslOpen")}</span><strong>{counts.open}</strong></li>
        <li><span>{v4("qslHeld")}</span><strong>{counts.held}</strong></li>
        <li><span>{v4("qslArchived")}</span><strong>{counts.archived}</strong></li>
        <li><span>{v4("qslPin")}</span><strong>{counts.pinned}</strong></li>
        <li><span>{v4("qslPeak")}</span><strong>{counts.peak}</strong></li>
        <li><span>{v4("qslQuiet")}</span><strong>{counts.quiet}</strong></li>
        <li><span>{v4("qslSoon")}</span><strong>{counts.soon}</strong></li>
        <li><span>{v4("qslLoad")}</span><strong>{counts.folio}</strong></li>
        <li><span>{v4("qslHouse")}</span><strong>{counts.house}</strong></li>
        <li><span>{v4("qslWait")}</span><strong>{counts.wait}</strong></li>
        <li><span>{v4("qslMatched")}</span><strong>{counts.matched}</strong></li>
        <li><span>{v4("qslRibbon")}</span><strong>{counts.ribbon}</strong></li>
        <li><span>{v4("qslIdle")}</span><strong>{counts.idle}</strong></li>
        <li><span>{v4("qslRush")}</span><strong>{counts.rush}</strong></li>
        <li><span>{v4("qslResting")}</span><strong>{counts.resting}</strong></li>
        <li><span>{v4("qslOverdue")}</span><strong>{counts.overdue}</strong></li>
        <li><span>{v4("qslLateShare")}</span><strong>{quireShare(shown.filter((slip) => lateSlip(slip, desk)).length, Math.max(1, shown.length))}%</strong></li>
        <li><span>{v4("qslShare")}</span><strong>{quireShare(counts.house, Math.max(1, counts.open))}%</strong></li>
        <li><span>{v4("qslNeighbors")}</span><strong>{neighborSlipCount(slips)}</strong></li>
        <li><span>{v4("qslClash")}</span><strong>{clashRoomCount(slips)}</strong></li>
        <li><span>{v4("qslWaitClash")}</span><strong>{waitClashCount(slips)}</strong></li>
      </ul>
      <div className="c4-qsl-bars" aria-label={v4("qslChart")}>
        {bars.map((bar) => (
          <div key={bar.room} className="c4-qsl-bar" data-room={bar.room}>
            <span>{roomLabel(v4, bar.room)}</span>
            <i style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} />
            <strong>{bar.count}</strong>
          </div>
        ))}
      </div>
      <p className="c4-qsl-meta">{v4("qslSuggest")} {inkLabel(v4, suggested)} · {v4("qslWait")} {suggestedWait} · {fair ? `${v4("qslAssign")} ${fair}` : v4("qslBlankReader")} · {busiestReader(slips) ? `${v4("qslBusiest")} ${busiestReader(slips)}` : v4("qslBusiestNone")}</p>
      <form className="c4-qsl-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addQuireSlip(slips, { id: `qsl-${Date.now()}`, title, note, reader, room, ink, stage, wait: waitMin, folio, tags });
        if (next.length === slips.length) return;
        store(next);
        setTitle("");
        setNote("");
        setTags("");
        titleRef.current?.focus();
      }}>
        <label className="c4-lab"><span>{v4("qslTitleField")}</span><input ref={titleRef} className="c4-field" aria-label={v4("qslTitleField")} value={title} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("qslNote")}</span><input className="c4-field" aria-label={v4("qslNote")} value={note} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("qslReader")}</span><input className="c4-field" aria-label={v4("qslReader")} value={reader} onChange={(event) => setReader(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("qslRoom")}</span>
          <select className="c4-field" aria-label={v4("qslRoom")} value={room} onChange={(event) => setRoom(event.target.value)}>
            <option value="">{v4("qslBlank")}</option>
            {QUIRE_ROOMS.map((item) => <option key={item} value={item}>{roomLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("qslInk")}</span>
          <select className="c4-field" aria-label={v4("qslInk")} value={ink} onChange={(event) => setInk(event.target.value)}>
            <option value="">{v4("qslBlankInk")}</option>
            {INKS.map((item) => <option key={item} value={item}>{inkLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("qslStage")}</span>
          <select className="c4-field" aria-label={v4("qslStage")} value={stage} onChange={(event) => setStage(event.target.value)}>
            <option value="">{v4("qslBlankStage")}</option>
            {STAGES.map((item) => <option key={item} value={item}>{stageLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("qslWait")}</span>
          <select className="c4-field" aria-label={v4("qslWait")} value={waitMin} onChange={(event) => setWaitMin(event.target.value)}>
            <option value="">{v4("qslBlankWait")}</option>
            {WAITS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("qslFolio")}</span>
          <select className="c4-field" aria-label={v4("qslFolio")} value={folio} onChange={(event) => setFolio(event.target.value)}>
            {FOLIOS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("qslTag")}</span><input className="c4-field" aria-label={v4("qslTag")} value={tags} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("qslAdd")}</button>
        <button type="button" className="c4-btn" onClick={() => { setInk(suggested === "OAK" ? "oak" : suggested === "SOOT" ? "soot" : "iron"); setWaitMin(String(suggestedWait)); if (fair) setReader(fair); }}>{v4("qslSuggest")}</button>
      </form>
      <div className="c4-qsl-tools">
        <label className="c4-lab"><span>{v4("qslSearch")}</span><input ref={searchRef} className="c4-field c4-qsl-search" aria-label={v4("qslSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("qslDesk")}</span>
          <select className="c4-field" aria-label={v4("qslDesk")} value={desk} onChange={(event) => setDesk(event.target.value)}>
            {QUIRE_ROOMS.map((item) => <option key={item} value={item}>{roomLabel(v4, item)}</option>)}
          </select>
        </label>
        <button type="button" className="c4-btn" onClick={() => download("quire-slips.csv", quireCsv(slips, desk))}>{v4("qslCsv")}</button>
        <button type="button" className="c4-btn" aria-pressed={density === "tight"} onClick={() => storeDensity(density === "airy" ? "tight" : "airy")}>{density === "airy" ? v4("qslDensityTight") : v4("qslDensityAiry")}</button>
        <button type="button" className="c4-btn" aria-pressed={sort === "reader"} onClick={() => setSort(quireSort(sort === "room" ? "reader" : "room"))}>{sort === "room" ? v4("qslSortReader") : v4("qslSortRoom")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkQuirePin(slips, picked))}>{v4("qslBulkPin")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkQuireArchive(slips, picked))}>{v4("qslBulkArchive")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkQuireSeal(slips, picked))}>{v4("qslBulkSeal")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkQuireTag(slips, picked, "b"))}>{v4("qslBulkTag")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkQuireInk(slips, picked, "soot"))}>{v4("qslBulkInk")}</button>
      </div>
      <div className="c4-qsl-tools" role="group" aria-label={v4("qslTray")}>
        {(["open", "held", "archived"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{item === "open" ? v4("qslOpen") : item === "held" ? v4("qslHeld") : v4("qslArchived")}</button>
        ))}
        {(["hall", "index"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={board === item ? "1" : "0"} onClick={() => setBoard(item)}>{item === "hall" ? v4("qslBoardHall") : v4("qslBoardIndex")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={houseOnly ? "1" : "0"} aria-pressed={houseOnly} onClick={() => setHouseOnly((value) => !value)}>{v4("qslHouseOnly")}</button>
        <button type="button" className="c4-chip" data-on={peakOnly ? "1" : "0"} aria-pressed={peakOnly} onClick={() => setPeakOnly((value) => !value)}>{v4("qslPeakOnly")}</button>
        <button type="button" className="c4-chip" data-on={quietOnly ? "1" : "0"} aria-pressed={quietOnly} onClick={() => setQuietOnly((value) => !value)}>{v4("qslQuietOnly")}</button>
        <button type="button" className="c4-chip" data-on={readerFilter === "all" ? "1" : "0"} onClick={() => setReaderFilter("all")}>{v4("qslAll")}</button>
        {readers.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={readerFilter === item ? "1" : "0"} onClick={() => setReaderFilter(item)}>{item}</button>
        ))}
        {INKS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={inkFilter === item ? "1" : "0"} onClick={() => setInkFilter(activeInk(inkFilter) === item ? "all" : item)}>{inkLabel(v4, item)}</button>
        ))}
        {STAGES.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={stageFilter === item ? "1" : "0"} onClick={() => setStageFilter(activeStage(stageFilter, STAGES) === item ? "all" : item)}>{stageLabel(v4, item)}</button>
        ))}
        <button type="button" className="c4-chip" data-on={roomFilter === "all" ? "1" : "0"} onClick={() => setRoomFilter("all")}>{v4("qslAll")}</button>
        <button type="button" className="c4-chip" data-on={roomFilter === "peak" ? "1" : "0"} onClick={() => setRoomFilter("peak")}>{v4("qslPeak")}</button>
        <button type="button" className="c4-chip" data-on={roomFilter === "quiet" ? "1" : "0"} onClick={() => setRoomFilter("quiet")}>{v4("qslQuiet")}</button>
        {QUIRE_ROOMS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={roomFilter === item ? "1" : "0"} onClick={() => setRoomFilter(activeRoom(roomFilter) === item ? "all" : item)}>{roomLabel(v4, item)}</button>
        ))}
        {WAITS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={waitFilter === item ? "1" : "0"} onClick={() => setWaitFilter(activeWait(waitFilter) === item ? "all" : item)}>{item}</button>
        ))}
        {FOLIOS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={folioFilter === item ? "1" : "0"} onClick={() => setFolioFilter(activeFolio(folioFilter) === item ? "all" : item)}>{item}</button>
        ))}
      </div>
      <form className="c4-qsl-tools" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addQuireView(views, { id: `view-${Date.now()}`, name: viewName, tray, query, reader: readerFilter, ink: inkFilter, stage: stageFilter, room: roomFilter, wait: waitFilter, folio: folioFilter });
        if (next.length === views.length) return;
        storeViews(next);
        setViewName("");
      }}>
        <label className="c4-lab"><span>{v4("qslViewName")}</span><input className="c4-field" aria-label={v4("qslViewName")} value={viewName} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("qslSaveView")}</button>
      </form>
      <ul className="c4-qsl-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => applyView(view)}>{v4("qslApply")} {view.name}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropQuireView(views, view.id))}>{v4("qslDropView")}</button>
          </li>
        ))}
      </ul>
      {board === "hall" ? (
        <ol className="c4-qsl-board">
          {!shown.length && <li className="c4-qsl-empty"><span className="c4-qsl-rule" aria-hidden="true"><i /><i /><i /><i /></span>{v4("qslEmpty")}</li>}
          {shown.map((slip, index) => {
            const gap = roomGap(slip.room, desk);
            return (
              <li key={slip.id} className="c4-qsl-card" data-on={index === focusAt ? "1" : "0"} data-pinned={slip.pinned ? "1" : "0"} data-ribbon={slip.ribbon ? "1" : "0"} data-ink={slip.ink || "blank"} data-late={lateSlip(slip, desk) ? "1" : "0"} data-idle={idleSlip(slip) ? "1" : "0"} data-rush={rushSlip(slip) ? "1" : "0"} data-resting={restingSlip(slip) ? "1" : "0"} data-overdue={overdueSlip(slip) ? "1" : "0"}>
                <p className="c4-qsl-dial" aria-hidden="true">{slip.folio}</p>
                <label className="c4-lab"><span>{v4("qslSelect")}</span><input type="checkbox" aria-label={v4("qslSelect")} checked={picked.includes(slip.id)} onChange={() => togglePick(slip.id)} /></label>
                <input className="c4-field" aria-label={v4("qslEdit")} value={slip.title} disabled={viewer} onChange={(event) => { if (!viewer) store(editQuire(slips, slip.id, event.target.value)); }} />
                <input className="c4-field" aria-label={v4("qslEditNote")} value={slip.note} disabled={viewer} onChange={(event) => { if (!viewer) store(editQuireNote(slips, slip.id, event.target.value)); }} />
                <p className="c4-qsl-meta">{slip.reader || v4("qslBlankReader")} · {roomLabel(v4, slip.room)} · {inkLabel(v4, slip.ink)} · {stageLabel(v4, slip.stage)} · {slip.wait ?? v4("qslBlankWait")} · {v4("qslFolio")} {slip.folio} · {slip.tags.join(" ") || v4("qslBlank")} · {bandLabel(v4, roomBand(slip.room))}{peakRoom(slip.room) ? ` · ${v4("qslPeak")}` : ""}{quietRoom(slip.room) ? ` · ${v4("qslQuiet")}` : ""}{houseInk(slip.ink) ? ` · ${v4("qslHouse")}` : ""}{idleSlip(slip) ? ` · ${v4("qslIdle")}` : ""}{rushSlip(slip) ? ` · ${v4("qslRush")}` : ""}{restingSlip(slip) ? ` · ${v4("qslResting")}` : ""}{overdueSlip(slip) ? ` · ${v4("qslOverdue")}` : ""}</p>
                <p className="c4-qsl-meta">{gap === null ? v4("qslBlank") : gap > 0 ? `${v4("qslPast")} ${gap}` : gap < 0 ? `${v4("qslAhead")} ${Math.abs(gap)}` : v4("qslDue")} · {AUDIT_KEY[slip.audit] ? v4(AUDIT_KEY[slip.audit]) : v4("qslBlank")} · {nextSlip(slips, slip.id) ? `${v4("qslNext")} ${nextSlip(slips, slip.id)?.title}` : v4("qslNextNone")}</p>
                <div className="c4-qsl-tools">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cycleStage(slips, slip.id))}>{v4("qslStage")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSlipPin(slips, slip.id, !slip.pinned))}>{slip.pinned ? v4("qslUnpin") : v4("qslPin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer || slip.archived} onClick={() => store(setSlipHold(slips, slip.id, !slip.held))}>{slip.held ? v4("qslResume") : v4("qslHold")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSlipArchive(slips, slip.id, !slip.archived))}>{slip.archived ? v4("qslReopen") : v4("qslArchive")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSlipRibbon(slips, slip.id, !slip.ribbon))}>{slip.ribbon ? v4("qslUnribbon") : v4("qslRibbon")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lengthenWait(slips, slip.id))}>{v4("qslWait")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(shortenWait(slips, slip.id))}>{v4("qslShorten")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseFolio(slips, slip.id))}>{v4("qslRaised")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerFolio(slips, slip.id))}>{v4("qslLowered")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSlipInk(slips, slip.id, slip.ink === "SOOT" ? "iron" : slip.ink === "OAK" ? "soot" : "oak"))}>{v4("qslInk")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addQuireTag(slips, slip.id, "c"))}>{v4("qslTag")}</button>
                  <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard.writeText(quireCopy(slip)).catch(() => undefined); setCopied(slip.id); }}>{copied === slip.id ? v4("qslCopied") : v4("qslCopy")}</button>
                </div>
              </li>
            );
          })}
        </ol>
      ) : (
        <ol className="c4-qsl-timeline">
          {!timeline.length && <li className="c4-qsl-empty">{v4("qslEmpty")}</li>}
          {timeline.map((lane) => <li key={lane.folio}><span>{lane.folio}</span><strong>{lane.titles.join(" · ")}</strong></li>)}
        </ol>
      )}
      <aside className="c4-qsl-side" aria-label={v4("qslReminders")}>
        <h3 className="c4-title">{v4("qslReminders")}</h3>
        {!reminders.length && <p>{v4("qslEmpty")}</p>}
        <ul>{reminders.map((slip) => <li key={slip.id}>{slip.title} · {lateSlip(slip, desk) ? v4("qslLate") : v4("qslSame")}</li>)}</ul>
        <h3 className="c4-title">{v4("qslIdle")}</h3>
        {!idling.length && <p>{v4("qslIdleEmpty")}</p>}
        <ul>{idling.map((slip) => <li key={slip.id}>{slip.title}</li>)}</ul>
        {focused && <p>{v4("qslFocus")} {focused.title} · {quireShare(counts.house, Math.max(1, counts.open))}%</p>}
        <p>{clashRoomCount(slips) ? v4("qslClash") : v4("qslClashNone")} · {pairReaderCount(slips) ? v4("qslPair") : v4("qslPairNone")} · {folioLoad(slips)} · {matchedSlips(slips, desk).length}</p>
      </aside>
    </section>
  );
}

function markNote(row: TraderRow): PostmarkValue {
  return { phone: textField(row.phone), line: textField(row.phone) };
}

export function PostmarkLanes({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: TraderRow[] }>("/api/admin/users?take=24&meta=0&role=TRADER");
  const [query, setQuery] = useState("");
  const [lane, setLane] = useState("all");
  const [hue, setHue] = useState("all");
  const [review, setReview] = useState<PostmarkReview>("all");
  const [shape, setShape] = useState<PostmarkShape>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [copied, setCopied] = useState("");
  const [focus, setFocus] = useState(0);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const reviewRef = useRef<() => void>(() => {});
  const viewer = role === "viewer";
  const rows = useMemo<PostmarkRow[]>(() => (queue.data?.users || []).map((row, index) => ({
    id: row.id ? `trader-${row.id}` : `trader-${index}`,
    label: textField(row.name),
    note: markNote(row),
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
    const present = presentPostmarkLanes(rows);
    const ids = rows.map((row) => row.id);
    const nextHidden = readHiddenPostmarks(readJson(PMK_KEY, []), present);
    const nextReviewed = readReviewedPostmarks(readJson(PMK_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(PMK_KEY, nextHidden);
    writeJson(PMK_REVIEW_KEY, nextReviewed);
  }, [rows]);
  const present = presentPostmarkLanes(rows);
  const lanes = visiblePostmarkLanes(present, hidden, showHidden);
  const shown = visiblePostmarks(rows, lane, hue, query, review, reviewed, shape).filter((row) => {
    const token = postmarkLane(row.note);
    if (!token) return true;
    return showHidden || !hidden.includes(token);
  });
  const focusAt = shown.length ? focus % shown.length : 0;
  useEffect(() => {
    reviewRef.current = () => {
      if (viewer) return;
      const row = shown[focusAt];
      if (!row) return;
      const next = togglePostmarkReview(reviewed, row.id);
      setReviewed(next);
      writeJson(PMK_REVIEW_KEY, next);
    };
  });
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocus((index) => moveQuireFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => moveQuireFocus(index, shown.length, -1));
        return;
      }
      if (event.key === "r" || event.key === "R") {
        event.preventDefault();
        reviewRef.current();
        return;
      }
      if (event.key === "m" || event.key === "M") {
        event.preventDefault();
        setShowHidden((value) => !value);
        return;
      }
      if (event.key === "g" || event.key === "G") {
        event.preventDefault();
        const order: PostmarkShape[] = ["all", "plus", "wide", "bound", "notch", "paren"];
        setShape((value) => order[(order.indexOf(value) + 1) % order.length]);
        return;
      }
      if (event.key !== "/") return;
      event.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shown.length]);
  const lead = leadingPostmark(rows);
  const hueLead = leadingPostmarkHue(rows);
  const shared = sharedPostmarkCount(rows);
  const bound = rows.filter((row) => postmarkBound(row.note)).length;
  const bars = postmarkLanes(rows);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const ids = shown.map((row) => row.id);
  const known = rows.filter((row) => postmarkState(row.note) === "set").length;
  function storeHidden(next: string[]) {
    setHidden(next);
    writeJson(PMK_KEY, next);
  }
  function storeReviewed(next: string[]) {
    const saved = readReviewedPostmarks(next, rows.map((row) => row.id));
    setReviewed(saved);
    writeJson(PMK_REVIEW_KEY, saved);
  }
  return (
    <section className="c4-pmk" aria-label={v4("pmkTitle")} data-marks="1" data-desk="scriptorium" data-traders={queue.data?.users?.length ? "1" : "0"} data-role={role} data-keyed={bound ? "1" : "0"}>
      <header className="c4-pmk-mast">
        <p className="c4-pmk-seal" data-logo="mono">{v4("pmkLogo")}</p>
        <div>
          <p className="c4-pmk-kicker">{v4("pmkSub")}</p>
          <h2 className="c4-title">{v4("pmkTitle")}</h2>
        </div>
        <ol className="c4-pmk-index" aria-label={v4("pmkTitle")}>
          <li data-tone="gold">{v4("pmkChampagne")}</li>
          <li data-tone="ink">{v4("pmkGraphite")}</li>
          <li data-tone="ivory">{v4("pmkIvory")}</li>
        </ol>
      </header>
      <p className="c4-pmk-links">
        <Link href={crmv4Href(base, "qsl")}>{v4("pmkGallery")}</Link>
        <Link href={crmv4Href(base, "scripts")}>{v4("qslScripts")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("pmkSub")}</Link>
      </p>
      {viewer && <p className="c4-pmk-note">{v4("pmkViewer")}</p>}
      <p className="c4-pmk-lead">{v4("pmkHint")}</p>
      <ul className="c4-pmk-kpis" aria-label={v4("pmkRules")}>
        <li><span>{v4("pmkSet")}</span><strong>{known}</strong></li>
        <li><span>{v4("pmkClear")}</span><strong>{rows.filter((row) => postmarkState(row.note) === "clear").length}</strong></li>
        <li><span>{v4("pmkPlus")}</span><strong>{lanePostmarkCount(rows, "plus")}</strong></li>
        <li><span>{v4("pmkParen")}</span><strong>{lanePostmarkCount(rows, "paren")}</strong></li>
        <li><span>{v4("pmkDash")}</span><strong>{lanePostmarkCount(rows, "dash")}</strong></li>
        <li><span>{v4("pmkSpace")}</span><strong>{lanePostmarkCount(rows, "space")}</strong></li>
        <li><span>{v4("pmkShort")}</span><strong>{lanePostmarkCount(rows, "short")}</strong></li>
        <li><span>{v4("pmkLocal")}</span><strong>{lanePostmarkCount(rows, "local")}</strong></li>
        <li><span>{v4("pmkIntl")}</span><strong>{lanePostmarkCount(rows, "intl")}</strong></li>
        <li><span>{v4("pmkLong")}</span><strong>{lanePostmarkCount(rows, "long")}</strong></li>
        <li><span>{v4("pmkGilt")}</span><strong>{huePostmarkCount(rows, "gilt")}</strong></li>
        <li><span>{v4("pmkNotch")}</span><strong>{rows.filter((row) => postmarkNotch(row.note)).length}</strong></li>
        <li><span>{v4("pmkWide")}</span><strong>{rows.filter((row) => postmarkWide(row.note)).length}</strong></li>
        <li><span>{v4("pmkJoin")}</span><strong>{rows.filter((row) => postmarkJoin(row.note)).length}</strong></li>
        <li><span>{v4("pmkShare")}</span><strong>{postmarkShare(bound, Math.max(1, known))}%</strong></li>
        <li><span>{v4("pmkShared")}</span><strong>{shared}</strong></li>
      </ul>
      <div className="c4-pmk-bars" aria-label={v4("pmkLead")}>
        {bars.map((bar) => (
          <div key={bar.lane} className="c4-pmk-bar" data-lane={bar.lane}>
            <span>{laneLabel(v4, bar.lane)}</span>
            <i style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} />
            <strong>{bar.count}</strong>
          </div>
        ))}
      </div>
      <p className="c4-pmk-meta">{lead ? `${v4("pmkLead")} ${laneLabel(v4, lead)}` : v4("pmkEmpty")} · {hueLead ? `${v4("pmkToneLead")} ${hueLabel(v4, hueLead)}` : v4("pmkUnmarked")}</p>
      <div className="c4-pmk-tools">
        <label className="c4-lab"><span>{v4("pmkSearch")}</span><input ref={searchRef} className="c4-field c4-pmk-search" aria-label={v4("pmkSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <button type="button" className="c4-btn" onClick={() => download("postmark-lanes.csv", postmarkLanesCsv(rows))}>{v4("pmkCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("postmark-rows.csv", postmarkRowsCsv(rows, reviewed))}>{v4("pmkRowCsv")}</button>
        <button type="button" className="c4-btn" aria-pressed={showHidden} onClick={() => setShowHidden((value) => !value)}>{v4("pmkShow")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkPostmarkReview(reviewed, ids, true))}>{v4("pmkBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkPostmarkReview(reviewed, ids, false))}>{v4("pmkBulkClear")}</button>
      </div>
      <div className="c4-pmk-tools" role="group" aria-label={v4("pmkAll")}>
        <button type="button" className="c4-chip" data-on={lane === "all" ? "1" : "0"} onClick={() => setLane("all")}>{v4("pmkAll")}</button>
        {lanes.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={lane === item ? "1" : "0"} onClick={() => setLane(item)}>{laneLabel(v4, item)}</button>
        ))}
        {(["gilt", "slate", "sand", "clay", "soot", "pearl", "mist"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(hue === item ? "all" : item)}>{hueLabel(v4, item)}</button>
        ))}
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{item === "all" ? v4("pmkAll") : item === "reviewed" ? v4("pmkReviewed") : v4("pmkUnreviewed")}</button>
        ))}
        {(["all", "plus", "wide", "bound", "notch", "paren"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{item === "all" ? v4("pmkShapeAll") : item === "plus" ? v4("pmkShapePlus") : item === "wide" ? v4("pmkShapeWide") : item === "bound" ? v4("pmkShapeBound") : item === "notch" ? v4("pmkShapeNotch") : v4("pmkShapeParen")}</button>
        ))}
      </div>
      {!shown.length && <p className="c4-pmk-empty">{v4("pmkEmpty")}</p>}
      <ol className="c4-pmk-board">
        {shown.map((row, index) => {
          const current = postmarkLane(row.note);
          const hueName = postmarkHue(row.note);
          return (
            <li key={row.id} className="c4-pmk-card" data-on={index === focusAt ? "1" : "0"} data-lane={current || "blank"} data-reviewed={reviewed.includes(row.id) ? "1" : "0"} data-wide={postmarkWide(row.note) ? "1" : "0"} data-join={postmarkJoin(row.note) ? "1" : "0"} data-notch={postmarkNotch(row.note) ? "1" : "0"} data-bound={postmarkBound(row.note) ? "1" : "0"}>
              <strong>{row.label || v4("pmkClear")}</strong>
              <p className="c4-pmk-meta">{v4("pmkMarkWord")} {postmarkStamp(row.note) || v4("pmkUnmarked")} · {laneLabel(v4, current)} · {hueLabel(v4, hueName)} · {v4("pmkStep")} {postmarkStep(row.note)} · {v4("pmkPhone")}</p>
              <div className="c4-pmk-tools">
                <button type="button" className="c4-btn" disabled={viewer || !current} onClick={() => storeHidden(togglePostmark(hidden, current))}>{hidden.includes(current) ? v4("pmkShow") : v4("pmkHide")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(togglePostmarkReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("pmkReviewed") : v4("pmkReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { const body = postmarkCopy(row.note); void navigator.clipboard.writeText(body).catch(() => undefined); setCopied(row.id); }}>{copied === row.id ? v4("pmkCopied") : v4("pmkCopy")}</button>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
