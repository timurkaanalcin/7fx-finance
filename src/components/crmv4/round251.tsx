"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  CMO_KEY,
  CMO_REVIEW_KEY,
  LCT_DENSITY_KEY,
  LCT_KEY,
  LCT_VIEW_KEY,
  LECTERN_FOLIOS,
  addLeafTag,
  addLeafView,
  addLecternLeaf,
  bulkCameoReview,
  bulkLeafBrisk,
  bulkLeafPin,
  bulkLeafShelve,
  bulkLeafSoot,
  bulkLeafTag,
  busiestReader,
  cameoBound,
  cameoCopy,
  cameoHue,
  cameoJoin,
  cameoLane,
  cameoLanes,
  cameoLanesCsv,
  cameoNotch,
  cameoRowsCsv,
  cameoShare,
  cameoStamp,
  cameoState,
  cameoStep,
  cameoWide,
  clashFolioCount,
  cyclePace,
  dropLeafView,
  editLeaf,
  editLeafNote,
  fairReader,
  flagFocusedLeaf,
  holdFocusedLeaf,
  houseInk,
  hueCameoCount,
  idleLeaf,
  idleLeaves,
  laneCameoCount,
  lateLeaf,
  leadingCameo,
  leadingCameoHue,
  leafBars,
  leafCopy,
  leafCounts,
  leafCsv,
  leafDensity,
  leafReaders,
  leafShare,
  leafTimeline,
  lengthenFocusedLeaf,
  lengthenMargin,
  lowerFocusedLeaf,
  lowerQuire,
  moveLeafFocus,
  neighborLeafCount,
  overdueLeaf,
  paceFocusedLeaf,
  peakFolio,
  pinFocusedLeaf,
  presentCameoLanes,
  quietFolio,
  raiseFocusedLeaf,
  raiseQuire,
  readHiddenCameos,
  readLeafViews,
  readLecternLeaves,
  readReviewedCameos,
  reminderLeaves,
  restingLeaf,
  rushLeaf,
  setLeafFlag,
  setLeafHold,
  setLeafInk,
  setLeafPin,
  setLeafShelve,
  sharedCameoCount,
  shortenFocusedLeaf,
  shortenMargin,
  sortLeaves,
  suggestInk,
  suggestMargin,
  tagFocusedLeaf,
  toggleCameo,
  toggleCameoReview,
  visibleCameoLanes,
  visibleCameos,
  visibleLeaves,
  type CameoReview,
  type CameoRow,
  type CameoShape,
  type CameoValue,
  type LeafDensity,
  type LeafSort,
  type LeafTray,
  type LeafView,
  type LecternLeaf,
} from "@/lib/crmv4/round251";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const INKS = ["iron", "oak", "soot"] as const;
const PACES = ["calm", "even", "brisk"] as const;
const MARGINS = ["12", "24", "36"] as const;
const QUIRES = ["1", "3", "5", "7"] as const;

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "lctAuditSave",
  edit: "lctAuditEdit",
  note: "lctAuditNote",
  pace: "lctAuditPace",
  pin: "lctAuditPin",
  unpin: "lctAuditUnpin",
  hold: "lctAuditHold",
  resume: "lctAuditResume",
  shelve: "lctAuditShelve",
  open: "lctAuditOpen",
  ink: "lctAuditInk",
  tag: "lctAuditTag",
  quire: "lctAuditQuire",
  margin: "lctAuditMargin",
  short: "lctAuditShort",
  flag: "lctAuditFlag",
};

const FOLIO_KEY: Record<string, CrmV4CopyKey> = {
  preface: "lctPreface",
  chapter: "lctChapter",
  margin: "lctMarginFolio",
  index: "lctIndex",
  colophon: "lctColophon",
  errata: "lctErrata",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  figure: "cmoFigure",
  short: "cmoShort",
  open: "cmoOpen",
  pair: "cmoPair",
  break: "cmoBreak",
  scroll: "cmoScroll",
  plain: "cmoPlain",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  ivory: "cmoIvory",
  graphite: "cmoGraphite",
  champagne: "cmoChampagne",
  ink: "cmoInkHue",
  vellum: "cmoVellum",
  ash: "cmoAsh",
  bronze: "cmoBronze",
};

type TraderRow = {
  id?: string;
  name?: string | null;
  saleStatus?: string | null;
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
  return typeof raw === "string" ? raw : "";
}

function folioLabel(v4: V4, folio: string): string {
  const key = FOLIO_KEY[folio];
  return key ? v4(key) : v4("lctBlank");
}

function inkLabel(v4: V4, ink: string): string {
  if (ink === "IRON" || ink === "iron") return v4("lctIron");
  if (ink === "OAK" || ink === "oak") return v4("lctOak");
  if (ink === "SOOT" || ink === "soot") return v4("lctSoot");
  return v4("lctBlankInk");
}

function paceLabel(v4: V4, pace: string): string {
  if (pace === "calm") return v4("lctCalm");
  if (pace === "even") return v4("lctEven");
  if (pace === "brisk") return v4("lctBrisk");
  return v4("lctBlankPace");
}

function laneLabel(v4: V4, lane: string): string {
  const key = LANE_KEY[lane];
  return key ? v4(key) : v4("cmoUnmarked");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("cmoUnmarked");
}

export function LecternLeaves({ base, v4 }: { base: string; v4: V4 }) {
  const [leaves, setLeaves] = useState<LecternLeaf[]>([]);
  const [views, setViews] = useState<LeafView[]>([]);
  const [density, setDensity] = useState<LeafDensity>("airy");
  const [sort, setSort] = useState<LeafSort>("folio");
  const [tray, setTray] = useState<LeafTray>("open");
  const [query, setQuery] = useState("");
  const [readerFilter, setReaderFilter] = useState("all");
  const [inkFilter, setInkFilter] = useState("all");
  const [paceFilter, setPaceFilter] = useState("all");
  const [folioFilter, setFolioFilter] = useState("all");
  const [marginFilter, setMarginFilter] = useState("all");
  const [quireFilter, setQuireFilter] = useState("all");
  const [houseOnly, setHouseOnly] = useState(false);
  const [peakOnly, setPeakOnly] = useState(false);
  const [quietOnly, setQuietOnly] = useState(false);
  const [desk, setDesk] = useState("chapter");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [reader, setReader] = useState("");
  const [folio, setFolio] = useState("");
  const [ink, setInk] = useState("");
  const [pace, setPace] = useState("");
  const [marginMin, setMarginMin] = useState("");
  const [quire, setQuire] = useState("1");
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
    setLeaves(readLecternLeaves(readJson(LCT_KEY, [])));
    setViews(readLeafViews(readJson(LCT_VIEW_KEY, [])));
    setDensity(leafDensity(readJson(LCT_DENSITY_KEY, "airy")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);
  const shown = sortLeaves(visibleLeaves(leaves, tray, query, readerFilter, inkFilter, paceFilter, folioFilter, marginFilter, quireFilter, houseOnly, peakOnly, quietOnly), sort);
  const focusAt = shown.length ? focus % shown.length : 0;
  const counts = leafCounts(leaves, shown, desk);
  const timeline = leafTimeline(leaves);
  const reminders = reminderLeaves(leaves);
  const idling = idleLeaves(leaves);
  const readers = leafReaders(leaves);
  const bars = leafBars(leaves);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const ids = shown.map((leaf) => leaf.id);
  const busy = busiestReader(leaves);
  function store(next: LecternLeaf[]) {
    const saved = readLecternLeaves(next);
    setLeaves(saved);
    writeJson(LCT_KEY, saved);
  }
  function storeViews(next: LeafView[]) {
    const saved = readLeafViews(next);
    setViews(saved);
    writeJson(LCT_VIEW_KEY, saved);
  }
  function storeDensity(next: LeafDensity) {
    setDensity(next);
    writeJson(LCT_DENSITY_KEY, next);
  }
  function togglePick(id: string) {
    setPicked((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }
  function applyView(view: LeafView) {
    setTray(view.tray);
    setQuery(view.query);
    setReaderFilter(view.reader || "all");
    setInkFilter(view.ink);
    setPaceFilter(view.pace);
    setFolioFilter(view.folio);
    setMarginFilter(view.margin);
    setQuireFilter(view.quire);
  }
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setTitle("");
        setNote("");
        setReader("");
        setFolio("");
        setInk("");
        setPace("");
        setMarginMin("");
        setTags("");
        return;
      }
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocus((index) => moveLeafFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => moveLeafFocus(index, shown.length, -1));
        return;
      }
      if (event.key === "h" || event.key === "H") {
        event.preventDefault();
        if (!viewer) store(holdFocusedLeaf(leaves, ids, focusAt));
        return;
      }
      if (event.key === "p" || event.key === "P") {
        event.preventDefault();
        if (!viewer) store(pinFocusedLeaf(leaves, ids, focusAt));
        return;
      }
      if (event.key === "f" || event.key === "F") {
        event.preventDefault();
        if (!viewer) store(paceFocusedLeaf(leaves, ids, focusAt));
        return;
      }
      if (event.key === "s" || event.key === "S") {
        event.preventDefault();
        if (!viewer) store(lengthenFocusedLeaf(leaves, ids, focusAt));
        return;
      }
      if (event.key === "u" || event.key === "U") {
        event.preventDefault();
        if (!viewer) store(shortenFocusedLeaf(leaves, ids, focusAt));
        return;
      }
      if (event.key === "t" || event.key === "T") {
        event.preventDefault();
        if (!viewer) store(tagFocusedLeaf(leaves, ids, focusAt, "x"));
        return;
      }
      if (event.key === "w" || event.key === "W") {
        event.preventDefault();
        if (!viewer) store(flagFocusedLeaf(leaves, ids, focusAt));
        return;
      }
      if (event.key === "b" || event.key === "B") {
        event.preventDefault();
        if (!viewer) store(raiseFocusedLeaf(leaves, ids, focusAt));
        return;
      }
      if (event.key === "n" || event.key === "N") {
        event.preventDefault();
        if (!viewer) store(lowerFocusedLeaf(leaves, ids, focusAt));
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
  }, [shown.length, viewer, leaves, ids, focusAt]);
  return (
    <section className="c4-lct" aria-label={v4("lctTitle")} data-leaves="1" data-desk="lectern" data-role={role} data-density={density} data-board={board}>
      <header className="c4-lct-mast">
        <p className="c4-lct-seal" data-logo="mono">{v4("lctLogo")}</p>
        <div>
          <p className="c4-lct-kicker">{v4("lctSub")}</p>
          <h2 className="c4-title">{v4("lctTitle")}</h2>
        </div>
        <ol className="c4-lct-index" aria-label={v4("lctTitle")}>
          <li data-tone="gold">{v4("lctChampagne")}</li>
          <li data-tone="ink">{v4("lctGraphite")}</li>
          <li data-tone="ivory">{v4("lctIvory")}</li>
        </ol>
      </header>
      <p className="c4-lct-links">
        <Link href={crmv4Href(base, "cmo")}>{v4("lctCameos")}</Link>
        <Link href={crmv4Href(base, "compare")}>{v4("lctCompare")}</Link>
        <Link href={crmv4Href(base, "vip")}>{v4("lctVip")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("lctCustomers")}</Link>
      </p>
      {viewer && <p className="c4-lct-note">{v4("lctViewer")}</p>}
      <p className="c4-lct-lead">{v4("lctKeys")}</p>
      <ul className="c4-lct-kpis" aria-label={v4("lctChart")}>
        <li><span>{v4("lctOpen")}</span><strong>{counts.open}</strong></li>
        <li><span>{v4("lctHeld")}</span><strong>{counts.held}</strong></li>
        <li><span>{v4("lctShelved")}</span><strong>{counts.shelved}</strong></li>
        <li><span>{v4("lctPinned")}</span><strong>{counts.pinned}</strong></li>
        <li><span>{v4("lctOverdue")}</span><strong>{counts.overdue}</strong></li>
        <li><span>{v4("lctPeak")}</span><strong>{counts.peak}</strong></li>
        <li><span>{v4("lctQuiet")}</span><strong>{counts.quiet}</strong></li>
        <li><span>{v4("lctHouse")}</span><strong>{leafShare(counts.house, Math.max(1, counts.open))}%</strong></li>
        <li><span>{v4("lctIdle")}</span><strong>{counts.idle}</strong></li>
        <li><span>{v4("lctRush")}</span><strong>{counts.rush}</strong></li>
        <li><span>{v4("lctResting")}</span><strong>{counts.resting}</strong></li>
        <li><span>{v4("lctSoon")}</span><strong>{counts.soon}</strong></li>
        <li><span>{v4("lctMatched")}</span><strong>{counts.matched}</strong></li>
        <li><span>{v4("lctClash")}</span><strong>{clashFolioCount(leaves) || v4("lctClashNone")}</strong></li>
        <li><span>{v4("lctNeighbor")}</span><strong>{neighborLeafCount(leaves)}</strong></li>
        <li><span>{v4("lctBusiest")}</span><strong>{busy || v4("lctBusiestNone")}</strong></li>
      </ul>
      <div className="c4-lct-bars" aria-label={v4("lctChart")}>
        {bars.map((bar) => (
          <div key={bar.folio} className="c4-lct-bar" data-folio={bar.folio}>
            <span>{folioLabel(v4, bar.folio)}</span>
            <i style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} />
            <strong>{bar.count}</strong>
          </div>
        ))}
      </div>
      {board === "index" && (
        <ol className="c4-lct-time" aria-label={v4("lctTimeline")}>
          {timeline.map((lane) => (
            <li key={lane.quire}><span>{v4("lctQuire")} {lane.quire}</span><strong>{lane.titles.join(" · ")}</strong></li>
          ))}
          {!timeline.length && <li>{v4("lctEmpty")}</li>}
        </ol>
      )}
      <form className="c4-lct-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        store(addLecternLeaf(leaves, { id: `lct-${Date.now().toString(36)}`, title, note, reader, folio, ink, pace, margin: marginMin, quire, tags }));
        setTitle("");
        setNote("");
        setTags("");
        titleRef.current?.focus();
      }}>
        <label className="c4-lab"><span>{v4("lctTitleField")}</span><input ref={titleRef} className="c4-field" aria-label={v4("lctTitleField")} value={title} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("lctNote")}</span><input className="c4-field" aria-label={v4("lctNote")} aria-required={false} value={note} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("lctReader")}</span><input className="c4-field" aria-label={v4("lctReader")} aria-required={false} value={reader} disabled={viewer} onChange={(event) => setReader(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("lctFolio")}</span>
          <select className="c4-select" aria-label={v4("lctFolio")} value={folio} disabled={viewer} onChange={(event) => setFolio(event.target.value)}>
            <option value="">{v4("lctBlank")}</option>
            {LECTERN_FOLIOS.map((item) => <option key={item} value={item}>{folioLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("lctInk")}</span>
          <select className="c4-select" aria-label={v4("lctInk")} value={ink} disabled={viewer} onChange={(event) => setInk(event.target.value)}>
            <option value="">{v4("lctBlankInk")}</option>
            {INKS.map((item) => <option key={item} value={item}>{inkLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("lctPace")}</span>
          <select className="c4-select" aria-label={v4("lctPace")} value={pace} disabled={viewer} onChange={(event) => setPace(event.target.value)}>
            <option value="">{v4("lctBlankPace")}</option>
            {PACES.map((item) => <option key={item} value={item}>{paceLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("lctMargin")}</span>
          <select className="c4-select" aria-label={v4("lctMargin")} value={marginMin} disabled={viewer} onChange={(event) => setMarginMin(event.target.value)}>
            <option value="">{v4("lctBlankMargin")}</option>
            {MARGINS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("lctQuire")}</span>
          <select className="c4-select" aria-label={v4("lctQuire")} value={quire} disabled={viewer} onChange={(event) => setQuire(event.target.value)}>
            {QUIRES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("lctTags")}</span><input className="c4-field" aria-label={v4("lctTags")} value={tags} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button className="c4-btn" type="submit" disabled={viewer}>{v4("lctAdd")}</button>
        <button className="c4-btn" type="button" disabled={viewer} onClick={() => setReader(fairReader(leaves, reader || "Ada, Bea, Cem"))}>{v4("lctAssign")}</button>
        <button className="c4-btn" type="button" disabled={viewer} onClick={() => setInk(suggestInk(leaves).toLowerCase())}>{v4("lctSuggestInk")}</button>
        <button className="c4-btn" type="button" disabled={viewer} onClick={() => setMarginMin(String(suggestMargin(leaves, new Date().getHours())))}>{v4("lctSuggestMargin")}</button>
      </form>
      <div className="c4-lct-tools">
        <label className="c4-lab"><span>{v4("lctSearch")}</span><input ref={searchRef} className="c4-field c4-lct-search" aria-label={v4("lctSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("lctDesk")}</span>
          <select className="c4-select" aria-label={v4("lctDesk")} value={desk} onChange={(event) => setDesk(event.target.value)}>
            {LECTERN_FOLIOS.map((item) => <option key={item} value={item}>{folioLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("lctReader")}</span>
          <select className="c4-select" aria-label={v4("lctReader")} value={readerFilter} onChange={(event) => setReaderFilter(event.target.value)}>
            <option value="all">{v4("lctAll")}</option>
            {readers.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <button type="button" className="c4-btn" onClick={() => download("lectern-leaves.csv", leafCsv(shown, desk))}>{v4("lctCsv")}</button>
        <button type="button" className="c4-btn" aria-pressed={density === "tight"} onClick={() => storeDensity(density === "airy" ? "tight" : "airy")}>{density === "airy" ? v4("lctDensityTight") : v4("lctDensityAiry")}</button>
        <button type="button" className="c4-btn" onClick={() => setSort(sort === "folio" ? "reader" : "folio")}>{sort === "folio" ? v4("lctSortReader") : v4("lctSortFolio")}</button>
        <button type="button" className="c4-btn" onClick={() => setBoard(board === "hall" ? "index" : "hall")}>{board === "hall" ? v4("lctBoardIndex") : v4("lctBoardHall")}</button>
      </div>
      <div className="c4-lct-tools" role="group" aria-label={v4("lctAll")}>
        {(["open", "held", "shelved"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{item === "open" ? v4("lctOpen") : item === "held" ? v4("lctHeld") : v4("lctShelved")}</button>
        ))}
        {INKS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={inkFilter === item ? "1" : "0"} onClick={() => setInkFilter(inkFilter === item ? "all" : item)}>{inkLabel(v4, item)}</button>
        ))}
        {PACES.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={paceFilter === item ? "1" : "0"} onClick={() => setPaceFilter(paceFilter === item ? "all" : item)}>{paceLabel(v4, item)}</button>
        ))}
        <button type="button" className="c4-chip" data-on={folioFilter === "peak" ? "1" : "0"} onClick={() => setFolioFilter(folioFilter === "peak" ? "all" : "peak")}>{v4("lctPeakOnly")}</button>
        <button type="button" className="c4-chip" data-on={folioFilter === "quiet" ? "1" : "0"} onClick={() => setFolioFilter(folioFilter === "quiet" ? "all" : "quiet")}>{v4("lctQuietOnly")}</button>
        <button type="button" className="c4-chip" data-on={houseOnly ? "1" : "0"} onClick={() => setHouseOnly((value) => !value)}>{v4("lctHouseOnly")}</button>
        <button type="button" className="c4-chip" data-on={peakOnly ? "1" : "0"} onClick={() => setPeakOnly((value) => !value)}>{v4("lctPeak")}</button>
        <button type="button" className="c4-chip" data-on={quietOnly ? "1" : "0"} onClick={() => setQuietOnly((value) => !value)}>{v4("lctQuiet")}</button>
        {MARGINS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={marginFilter === item ? "1" : "0"} onClick={() => setMarginFilter(marginFilter === item ? "all" : item)}>{item}</button>
        ))}
        {QUIRES.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={quireFilter === item ? "1" : "0"} onClick={() => setQuireFilter(quireFilter === item ? "all" : item)}>{v4("lctQuire")} {item}</button>
        ))}
      </div>
      <form className="c4-lct-tools" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        storeViews(addLeafView(views, {
          id: `view-${Date.now().toString(36)}`,
          name: viewName,
          tray,
          query,
          reader: readerFilter,
          ink: inkFilter,
          pace: paceFilter,
          folio: folioFilter,
          margin: marginFilter,
          quire: quireFilter,
        }));
        setViewName("");
      }}>
        <label className="c4-lab"><span>{v4("lctViewName")}</span><input className="c4-field" aria-label={v4("lctViewName")} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} /></label>
        <button className="c4-btn" type="submit" disabled={viewer}>{v4("lctSaveView")}</button>
        {views.map((view) => (
          <span key={view.id} className="c4-lct-view">
            <button type="button" className="c4-btn" onClick={() => applyView(view)}>{v4("lctApply")} {view.name}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropLeafView(views, view.id))}>{v4("lctDropView")}</button>
          </span>
        ))}
      </form>
      {picked.length > 0 && (
        <div className="c4-lct-tools">
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkLeafPin(leaves, picked))}>{v4("lctBulkPin")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkLeafShelve(leaves, picked))}>{v4("lctBulkShelve")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkLeafBrisk(leaves, picked))}>{v4("lctBulkBrisk")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkLeafSoot(leaves, picked))}>{v4("lctBulkSoot")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkLeafTag(leaves, picked, "y"))}>{v4("lctBulkTag")}</button>
        </div>
      )}
      {(reminders.length > 0 || idling.length > 0) && (
        <p className="c4-lct-meta">{v4("lctDue")} {reminders.map((leaf) => leaf.title).join(" · ")} · {v4("lctIdle")} {idling.map((leaf) => leaf.title).join(" · ")}</p>
      )}
      {!shown.length && <p className="c4-lct-empty">{v4("lctEmpty")}</p>}
      <ol className="c4-lct-board" data-density={density}>
        {shown.map((leaf, index) => (
          <li key={leaf.id} className="c4-lct-card" data-on={index === focusAt ? "1" : "0"} data-pinned={leaf.pinned ? "1" : "0"} data-overdue={overdueLeaf(leaf) ? "1" : "0"} data-peak={peakFolio(leaf.folio) ? "1" : "0"} data-quiet={quietFolio(leaf.folio) ? "1" : "0"} data-house={houseInk(leaf.ink) ? "1" : "0"} data-rush={rushLeaf(leaf) ? "1" : "0"} data-idle={idleLeaf(leaf) ? "1" : "0"} data-resting={restingLeaf(leaf) ? "1" : "0"} data-late={lateLeaf(leaf, desk) ? "1" : "0"}>
            <label className="c4-lct-pick"><input type="checkbox" checked={picked.includes(leaf.id)} aria-label={leaf.title} onChange={() => togglePick(leaf.id)} /></label>
            <div>
              <input className="c4-field" aria-label={v4("lctEdit")} value={leaf.title} disabled={viewer} onChange={(event) => store(editLeaf(leaves, leaf.id, event.target.value))} />
              <input className="c4-field" aria-label={v4("lctEditNote")} aria-required={false} value={leaf.note} disabled={viewer} onChange={(event) => store(editLeafNote(leaves, leaf.id, event.target.value))} />
              <p className="c4-lct-meta">{leaf.reader || v4("lctBlankReader")} · {folioLabel(v4, leaf.folio)} · {inkLabel(v4, leaf.ink)} · {paceLabel(v4, leaf.pace)} · {leaf.margin ?? v4("lctBlankMargin")} · {v4("lctQuire")} {leaf.quire} · {leaf.tags.join(" ") || v4("lctTags")}</p>
              <p className="c4-lct-meta">{folioLabel(v4, desk)} · {AUDIT_KEY[leaf.audit] ? v4(AUDIT_KEY[leaf.audit]) : v4("lctAuditSave")}</p>
              <div className="c4-lct-tools">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setLeafPin(leaves, leaf.id, !leaf.pinned))}>{leaf.pinned ? v4("lctUnpin") : v4("lctPin")}</button>
                <button type="button" className="c4-btn" disabled={viewer || leaf.shelved} onClick={() => store(setLeafHold(leaves, leaf.id, !leaf.held))}>{leaf.held ? v4("lctResume") : v4("lctHold")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setLeafShelve(leaves, leaf.id, !leaf.shelved))}>{leaf.shelved ? v4("lctOpen") : v4("lctShelve")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setLeafFlag(leaves, leaf.id, !leaf.flagged))}>{leaf.flagged ? v4("lctUnflag") : v4("lctFlag")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cyclePace(leaves, leaf.id))}>{v4("lctPace")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lengthenMargin(leaves, leaf.id))}>{v4("lctLengthen")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(shortenMargin(leaves, leaf.id))}>{v4("lctShorten")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseQuire(leaves, leaf.id))}>{v4("lctRaise")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerQuire(leaves, leaf.id))}>{v4("lctLower")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setLeafInk(leaves, leaf.id, leaf.ink === "SOOT" ? "iron" : "soot"))}>{v4("lctInk")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addLeafTag(leaves, leaf.id, "x"))}>{v4("lctTag")}</button>
                <button type="button" className="c4-btn" onClick={() => { const body = leafCopy(leaf); void navigator.clipboard.writeText(body).catch(() => undefined); setCopied(leaf.id); }}>{copied === leaf.id ? v4("lctCopied") : v4("lctCopy")}</button>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function markNote(row: TraderRow): CameoValue {
  return { saleStatus: textField(row.saleStatus) };
}

export function CameoPlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: TraderRow[] }>("/api/admin/users?take=24&meta=0&role=TRADER");
  const [query, setQuery] = useState("");
  const [lane, setLane] = useState("all");
  const [hue, setHue] = useState("all");
  const [review, setReview] = useState<CameoReview>("all");
  const [shape, setShape] = useState<CameoShape>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [copied, setCopied] = useState("");
  const [focus, setFocus] = useState(0);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = useMemo<CameoRow[]>(() => (queue.data?.users || []).map((row, index) => ({
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
    const present = presentCameoLanes(rows);
    const ids = rows.map((row) => row.id);
    const nextHidden = readHiddenCameos(readJson(CMO_KEY, []), present);
    const nextReviewed = readReviewedCameos(readJson(CMO_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(CMO_KEY, nextHidden);
    writeJson(CMO_REVIEW_KEY, nextReviewed);
  }, [rows]);
  const present = presentCameoLanes(rows);
  const lanes = visibleCameoLanes(present, hidden, showHidden);
  const shown = visibleCameos(rows, lane, hue, query, review, reviewed, shape).filter((row) => {
    const token = cameoLane(row.note);
    if (!token) return true;
    return showHidden || !hidden.includes(token);
  });
  const focusAt = shown.length ? focus % shown.length : 0;
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocus((index) => moveLeafFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => moveLeafFocus(index, shown.length, -1));
        return;
      }
      if (event.key === "r" || event.key === "R") {
        event.preventDefault();
        if (viewer) return;
        const row = shown[focusAt];
        if (!row) return;
        const next = toggleCameoReview(reviewed, row.id);
        setReviewed(next);
        writeJson(CMO_REVIEW_KEY, next);
        return;
      }
      if (event.key === "m" || event.key === "M") {
        event.preventDefault();
        setShowHidden((value) => !value);
        return;
      }
      if (event.key === "g" || event.key === "G") {
        event.preventDefault();
        const order: CameoShape[] = ["all", "pair", "wide", "bound", "notch", "figure", "open", "short"];
        setShape((value) => order[(order.indexOf(value) + 1) % order.length]);
        return;
      }
      if (event.key !== "/") return;
      event.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shown.length, viewer, shown, focusAt, reviewed]);
  const lead = leadingCameo(rows);
  const hueLead = leadingCameoHue(rows);
  const shared = sharedCameoCount(rows);
  const bound = rows.filter((row) => cameoBound(row.note)).length;
  const bars = cameoLanes(rows);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const ids = shown.map((row) => row.id);
  const known = rows.filter((row) => cameoState(row.note) === "set").length;
  function storeHidden(next: string[]) {
    setHidden(next);
    writeJson(CMO_KEY, next);
  }
  function storeReviewed(next: string[]) {
    const saved = readReviewedCameos(next, rows.map((row) => row.id));
    setReviewed(saved);
    writeJson(CMO_REVIEW_KEY, saved);
  }
  return (
    <section className="c4-cmo" aria-label={v4("cmoTitle")} data-cameos="1" data-desk="cameo" data-traders={queue.data?.users?.length ? "1" : "0"} data-role={role}>
      <header className="c4-cmo-mast">
        <p className="c4-cmo-seal" data-logo="mono">{v4("cmoLogo")}</p>
        <div>
          <p className="c4-cmo-kicker">{v4("cmoSub")}</p>
          <h2 className="c4-title">{v4("cmoTitle")}</h2>
        </div>
        <ol className="c4-cmo-index" aria-label={v4("cmoTitle")}>
          <li data-tone="gold">{v4("cmoChampagne")}</li>
          <li data-tone="ink">{v4("cmoGraphite")}</li>
          <li data-tone="ivory">{v4("cmoIvory")}</li>
        </ol>
      </header>
      <p className="c4-cmo-links">
        <Link href={crmv4Href(base, "lct")}>{v4("cmoLeaves")}</Link>
        <Link href={crmv4Href(base, "compare")}>{v4("lctCompare")}</Link>
        <Link href={crmv4Href(base, "vip")}>{v4("lctVip")}</Link>
      </p>
      {viewer && <p className="c4-cmo-note">{v4("cmoViewer")}</p>}
      <p className="c4-cmo-lead">{v4("cmoHint")}</p>
      <ul className="c4-cmo-kpis" aria-label={v4("cmoRules")}>
        <li><span>{v4("cmoSet")}</span><strong>{known}</strong></li>
        <li><span>{v4("cmoClear")}</span><strong>{rows.filter((row) => cameoState(row.note) === "clear").length}</strong></li>
        <li><span>{v4("cmoPlain")}</span><strong>{laneCameoCount(rows, "plain")}</strong></li>
        <li><span>{v4("cmoOpen")}</span><strong>{laneCameoCount(rows, "open")}</strong></li>
        <li><span>{v4("cmoShort")}</span><strong>{laneCameoCount(rows, "short")}</strong></li>
        <li><span>{v4("cmoPair")}</span><strong>{laneCameoCount(rows, "pair")}</strong></li>
        <li><span>{v4("cmoBreak")}</span><strong>{laneCameoCount(rows, "break")}</strong></li>
        <li><span>{v4("cmoScroll")}</span><strong>{laneCameoCount(rows, "scroll")}</strong></li>
        <li><span>{v4("cmoFigure")}</span><strong>{laneCameoCount(rows, "figure")}</strong></li>
        <li><span>{v4("cmoWide")}</span><strong>{rows.filter((row) => cameoWide(row.note)).length}</strong></li>
        <li><span>{v4("cmoNotch")}</span><strong>{rows.filter((row) => cameoNotch(row.note)).length}</strong></li>
        <li><span>{v4("cmoJoin")}</span><strong>{rows.filter((row) => cameoJoin(row.note)).length}</strong></li>
        <li><span>{v4("cmoShare")}</span><strong>{cameoShare(bound, Math.max(1, known))}%</strong></li>
        <li><span>{v4("cmoShared")}</span><strong>{shared}</strong></li>
        <li><span>{v4("cmoInkHue")}</span><strong>{hueCameoCount(rows, "ink")}</strong></li>
      </ul>
      <div className="c4-cmo-bars" aria-label={v4("cmoLead")}>
        {bars.map((bar) => (
          <div key={bar.lane} className="c4-cmo-bar" data-lane={bar.lane}>
            <span>{laneLabel(v4, bar.lane)}</span>
            <i style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} />
            <strong>{bar.count}</strong>
          </div>
        ))}
      </div>
      <p className="c4-cmo-meta">{lead ? `${v4("cmoLead")} ${laneLabel(v4, lead)}` : v4("cmoEmpty")} · {hueLead ? `${v4("cmoToneLead")} ${hueLabel(v4, hueLead)}` : v4("cmoUnmarked")}</p>
      <div className="c4-cmo-tools">
        <label className="c4-lab"><span>{v4("cmoSearch")}</span><input ref={searchRef} className="c4-field c4-cmo-search" aria-label={v4("cmoSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <button type="button" className="c4-btn" onClick={() => download("cameo-plates.csv", cameoLanesCsv(rows))}>{v4("cmoCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("cameo-plate-rows.csv", cameoRowsCsv(rows, reviewed))}>{v4("cmoRowCsv")}</button>
        <button type="button" className="c4-btn" aria-pressed={showHidden} onClick={() => setShowHidden((value) => !value)}>{v4("cmoShow")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkCameoReview(reviewed, ids, true))}>{v4("cmoBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkCameoReview(reviewed, ids, false))}>{v4("cmoBulkClear")}</button>
      </div>
      <div className="c4-cmo-tools" role="group" aria-label={v4("cmoAll")}>
        <button type="button" className="c4-chip" data-on={lane === "all" ? "1" : "0"} onClick={() => setLane("all")}>{v4("cmoAll")}</button>
        {lanes.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={lane === item ? "1" : "0"} onClick={() => setLane(item)}>{laneLabel(v4, item)}</button>
        ))}
        {(["all", "ivory", "graphite", "champagne", "ink", "vellum", "ash", "bronze"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("cmoAll") : hueLabel(v4, item)}</button>
        ))}
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{item === "all" ? v4("cmoAll") : item === "reviewed" ? v4("cmoReviewed") : v4("cmoUnreviewed")}</button>
        ))}
        {(["all", "pair", "wide", "bound", "notch", "figure", "open", "short"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>
            {item === "all" ? v4("cmoShapeAll") : item === "pair" ? v4("cmoShapePair") : item === "wide" ? v4("cmoShapeWide") : item === "bound" ? v4("cmoShapeBound") : item === "notch" ? v4("cmoShapeNotch") : item === "figure" ? v4("cmoShapeFigure") : item === "open" ? v4("cmoShapeOpen") : v4("cmoShapeShort")}
          </button>
        ))}
      </div>
      {!shown.length && <p className="c4-cmo-empty">{v4("cmoEmpty")}</p>}
      <ol className="c4-cmo-board">
        {shown.map((row, index) => {
          const current = cameoLane(row.note);
          const hueName = cameoHue(row.note);
          return (
            <li key={row.id} className="c4-cmo-card" data-on={index === focusAt ? "1" : "0"} data-lane={current || "blank"} data-reviewed={reviewed.includes(row.id) ? "1" : "0"} data-wide={cameoWide(row.note) ? "1" : "0"} data-join={cameoJoin(row.note) ? "1" : "0"} data-notch={cameoNotch(row.note) ? "1" : "0"} data-bound={cameoBound(row.note) ? "1" : "0"}>
              <strong>{row.label || v4("cmoClear")}</strong>
              <p className="c4-cmo-meta">{v4("cmoCode")} {cameoStamp(row.note) || v4("cmoUnmarked")} · {laneLabel(v4, current)} · {hueLabel(v4, hueName)} · {v4("cmoStep")} {cameoStep(row.note)}</p>
              <div className="c4-cmo-tools">
                <button type="button" className="c4-btn" disabled={viewer || !current} onClick={() => storeHidden(toggleCameo(hidden, current))}>{hidden.includes(current) ? v4("cmoShow") : v4("cmoHide")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleCameoReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("cmoReviewed") : v4("cmoReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { const body = cameoCopy(row.note); void navigator.clipboard.writeText(body).catch(() => undefined); setCopied(row.id); }}>{copied === row.id ? v4("cmoCopied") : v4("cmoCopy")}</button>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
