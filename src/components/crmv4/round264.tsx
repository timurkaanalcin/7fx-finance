"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  PST_DENSITY_KEY,
  PST_KEY,
  PST_VIEW_KEY,
  PASTRY_BENCHES,
  CPH_KEY,
  CPH_REVIEW_KEY,
  addPastry,
  addPastryTag,
  addPastryView,
  briskPastry,
  bulkPastryCocoa,
  bulkPastryPin,
  bulkPastrySeal,
  bulkPastryWhip,
  bulkPastryTag,
  bulkCipherReview,
  busiestPastryBaker,
  pastryBars,
  pastryCopy,
  pastryCounts,
  pastryCsv,
  pastryDensity,
  pastryBakers,
  pastryTimeline,
  clashBenchCount,
  cyclePace,
  dropPastryView,
  editPastry,
  editPastryNote,
  fairPastryBaker,
  houseGlaze,
  idlePastry,
  idleButteries,
  laneCipherCount,
  latePastry,
  leadingCipher,
  leadingCipherHue,
  lengthenPastry,
  lengthenPastryFocused,
  lowerPastry,
  lowerPastryFocused,
  movePastryFocus,
  neighborPastryCount,
  overduePastry,
  pausePastryFocused,
  peakBench,
  pinPastryFocused,
  paceFocused,
  presentCipherLanes,
  quietBench,
  raisePastry,
  raisePastryFocused,
  readButteries,
  readPastryViews,
  readHiddenCiphers,
  readReviewedCiphers,
  reminderButteries,
  restingPastry,
  setPastryGlaze,
  setPastryPause,
  setPastryPin,
  setPastrySeal,
  setPastryStar,
  sharedCipherCount,
  shortenPastry,
  shortenPastryFocused,
  sortButteries,
  cipherCopy,
  cipherEcho,
  cipherHue,
  cipherKnown,
  cipherCap,
  cipherLane,
  cipherLanes,
  cipherLanesCsv,
  cipherLeap,
  cipherNotch,
  cipherRowsCsv,
  cipherShare,
  cipherSlash,
  cipherStamp,
  cipherStep,
  cipherTail,
  cipherTwin,
  cipherWide,
  starPastryFocused,
  suggestPastryWait,
  suggestBench,
  suggestGlaze,
  tagPastryFocused,
  toggleCipher,
  toggleCipherReview,
  visibleButteries,
  visibleCipherLanes,
  visibleCiphers,
  type PastryDensity,
  type PastrySlip,
  type PastrySort,
  type PastryTray,
  type PastryView,
  type CipherReview,
  type CipherRow,
  type CipherShape,
  type CipherValue,
} from "@/lib/crmv4/round264";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const GLASSES = ["sugar", "butter", "cocoa"] as const;
const POURS = ["fold", "whip", "rest"] as const;
const WAITS = ["15", "30", "45"] as const;
const RANKS = ["1", "3", "5", "7"] as const;

const CELLAR_KEY: Record<string, CrmV4CopyKey> = {
  slab: "pstSlab",
  peel: "pstPeel",
  hearth: "pstHearth",
  loft: "pstLoft",
  peak: "pstPeakBench",
  quiet: "pstQuietBench",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "pstAuditSave",
  edit: "pstAuditEdit",
  note: "pstAuditNote",
  pace: "pstAuditPace",
  pin: "pstAuditPin",
  unpin: "pstAuditUnpin",
  pause: "pstAuditPause",
  resume: "pstAuditResume",
  seal: "pstAuditSeal",
  open: "pstAuditOpen",
  glaze: "pstAuditGlaze",
  tag: "pstAuditTag",
  rank: "pstAuditRank",
  wait: "pstAuditWait",
  short: "pstAuditShort",
  flag: "pstAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  crest: "cphCrest",
  board: "cphBoard",
  mark: "cphMark",
  seam: "cphSeam",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  ivory: "cphIvory",
  graphite: "cphGraphite",
  champagne: "cphChampagne",
};

type TraderRow = {
  id?: string;
  name?: string | null;
  affiliateC?: string | null;
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

function benchLabel(v4: V4, bench: string): string {
  const key = CELLAR_KEY[bench];
  return key ? v4(key) : v4("pstBlank");
}

function glazeLabel(v4: V4, glaze: string): string {
  if (glaze === "SUGAR") return v4("pstSugar");
  if (glaze === "BUTTER") return v4("pstButter");
  if (glaze === "COCOA") return v4("pstCocoa");
  return v4("pstBlankGlaze");
}

function paceLabel(v4: V4, pace: string): string {
  if (pace === "fold") return v4("pstFold");
  if (pace === "whip") return v4("pstWhip");
  if (pace === "rest") return v4("pstRest");
  return v4("pstBlankPace");
}

function laneLabel(v4: V4, lane: string): string {
  const key = LANE_KEY[lane];
  return key ? v4(key) : v4("cphUnmarked");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("cphUnmarked");
}

export function PastrySlips({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<PastrySlip[]>([]);
  const [views, setViews] = useState<PastryView[]>([]);
  const [density, setDensity] = useState<PastryDensity>("roomy");
  const [sort, setSort] = useState<PastrySort>("bench");
  const [tray, setTray] = useState<PastryTray>("open");
  const [query, setQuery] = useState("");
  const [bakerFilter, setBakerFilter] = useState("all");
  const [glazeFilter, setGlazeFilter] = useState("all");
  const [paceFilter, setPaceFilter] = useState("all");
  const [benchFilter, setBenchFilter] = useState("all");
  const [waitFilter, setWaitFilter] = useState("all");
  const [rankFilter, setRankFilter] = useState("all");
  const [houseOnly, setHouseOnly] = useState(false);
  const [peakOnly, setPeakOnly] = useState(false);
  const [quietOnly, setQuietOnly] = useState(false);
  const [desk, setDesk] = useState("hearth");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [baker, setBaker] = useState("");
  const [bench, setBench] = useState("");
  const [glaze, setGlaze] = useState("");
  const [pace, setPace] = useState("");
  const [waitMin, setWaitMin] = useState("");
  const [rank, setRank] = useState("1");
  const [tags, setTags] = useState("");
  const [viewName, setViewName] = useState("");
  const [board, setBoard] = useState<"hall" | "index">("hall");
  const [picked, setPicked] = useState<string[]>([]);
  const [focus, setFocus] = useState(0);
  const [copied, setCopied] = useState("");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  useEffect(() => {
    setCards(readButteries(readJson(PST_KEY, [])));
    setViews(readPastryViews(readJson(PST_VIEW_KEY, [])));
    setDensity(pastryDensity(readJson(PST_DENSITY_KEY, "roomy")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);
  const shown = sortButteries(visibleButteries(cards, tray, query, bakerFilter, glazeFilter, paceFilter, benchFilter, waitFilter, rankFilter, houseOnly, peakOnly, quietOnly), sort);
  const focusAt = shown.length ? focus % shown.length : 0;
  const counts = pastryCounts(cards, shown, desk);
  const timeline = pastryTimeline(cards);
  const reminders = reminderButteries(cards);
  const idling = idleButteries(cards);
  const bakers = pastryBakers(cards);
  const bars = pastryBars(cards);
  const ribbon = Math.max(1, bars.reduce((sum, bar) => sum + bar.count, 0));
  const ids = shown.map((card) => card.id);
  const busy = busiestPastryBaker(cards);
  const clock = new Date().getUTCHours();
  const suggested = suggestGlaze(cards);
  const fair = fairPastryBaker(cards, bakers.join(", ") || "Ada, Bea");
  const benchHint = suggestBench(clock);
  function store(next: PastrySlip[]) {
    const saved = readButteries(next);
    setCards(saved);
    writeJson(PST_KEY, saved);
  }
  function storeViews(next: PastryView[]) {
    const saved = readPastryViews(next);
    setViews(saved);
    writeJson(PST_VIEW_KEY, saved);
  }
  function storeDensity(next: PastryDensity) {
    setDensity(next);
    writeJson(PST_DENSITY_KEY, next);
  }
  function togglePick(id: string) {
    setPicked((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }
  function applyView(view: PastryView) {
    setTray(view.tray);
    setQuery(view.query);
    setBakerFilter(view.baker || "all");
    setGlazeFilter(view.glaze);
    setPaceFilter(view.pace);
    setBenchFilter(view.bench);
    setWaitFilter(view.wait);
    setRankFilter(view.rank);
  }
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setTitle("");
        setNote("");
        setBaker("");
        setBench("");
        setGlaze("");
        setPace("");
        setWaitMin("");
        setTags("");
        return;
      }
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocus((index) => movePastryFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => movePastryFocus(index, shown.length, -1));
        return;
      }
      if (event.key === "h" || event.key === "H") {
        event.preventDefault();
        if (!viewer) store(pausePastryFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "p" || event.key === "P") {
        event.preventDefault();
        if (!viewer) store(pinPastryFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "g" || event.key === "G") {
        event.preventDefault();
        if (!viewer) store(paceFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "l" || event.key === "L") {
        event.preventDefault();
        if (!viewer) store(lengthenPastryFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "r" || event.key === "R") {
        event.preventDefault();
        if (!viewer) store(shortenPastryFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        if (!viewer) store(tagPastryFocused(cards, ids, focusAt, "a"));
        return;
      }
      if (event.key === "w" || event.key === "W") {
        event.preventDefault();
        if (!viewer) store(starPastryFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "u" || event.key === "U") {
        event.preventDefault();
        if (!viewer) store(raisePastryFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "y" || event.key === "Y") {
        event.preventDefault();
        if (!viewer) store(lowerPastryFocused(cards, ids, focusAt));
        return;
      }
      if (event.key === "b" || event.key === "B") {
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
  }, [shown.length, viewer, cards, ids, focusAt]);
  return (
    <section className="c4-pastry" aria-label={v4("pstTitle")} data-cards="1" data-desk="pastry" data-role={role} data-density={density} data-board={board}>
      <header className="c4-pastry-mast">
        <p className="c4-pastry-seal" data-logo="mono">{v4("pstLogo")}</p>
        <div className="c4-pastry-mast-copy">
          <p className="c4-pastry-kicker">{v4("pstSub")}</p>
          <h2 className="c4-title">{v4("pstTitle")}</h2>
        </div>
        <i className="c4-pastry-rule" aria-hidden="true" />
      </header>
      <p className="c4-pastry-links">
        <Link href={crmv4Href(base, "cph")}>{v4("pstPlates")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("pstCustomers")}</Link>
        <Link href={crmv4Href(base, "support")}>{v4("pstSupport")}</Link>
      </p>
      {viewer && <p className="c4-pastry-note">{v4("pstViewer")}</p>}
      <p className="c4-pastry-lead">{v4("pstKeys")}</p>
      <p className="c4-pastry-hint">{v4("pstHint")}</p>
      <p className="c4-pastry-notice" role="status">{v4("pstNotice")} {counts.overdue}</p>
      <ol className="c4-pastry-ledger" aria-label={v4("pstChart")}>
        <li><span>{v4("pstOpen")}</span><strong>{counts.open}</strong></li>
        <li><span>{v4("pstPause")}</span><strong>{counts.pause}</strong></li>
        <li><span>{v4("pstSealed")}</span><strong>{counts.seal}</strong></li>
        <li><span>{v4("pstPinned")}</span><strong>{counts.pinned}</strong></li>
        <li><span>{v4("pstPeak")}</span><strong>{counts.peak}</strong></li>
        <li><span>{v4("pstQuiet")}</span><strong>{counts.quiet}</strong></li>
        <li><span>{v4("pstSoon")}</span><strong>{counts.soon}</strong></li>
        <li><span>{v4("pstOverdue")}</span><strong>{counts.overdue}</strong></li>
      </ol>
      <ol className="c4-pastry-bars" aria-label={v4("pstBars")}>
        {bars.map((bar) => (
          <li key={bar.bench} data-bench={bar.bench}>
            <span>{benchLabel(v4, bar.bench)}</span>
            <i style={{ width: `${Math.round((bar.count / ribbon) * 100)}%` }} />
            <strong>{bar.count}</strong>
          </li>
        ))}
      </ol>
      <ol className="c4-pastry-time" aria-label={v4("pstTimeline")}>
        {timeline.map((lane) => (
          <li key={lane.rank}><span>{lane.rank}</span><strong>{lane.titles.join(" · ")}</strong></li>
        ))}
      </ol>
      <div className="c4-pastry-tools">
        <label className="c4-lab">
          <span>{v4("pstDesk")}</span>
          <select className="c4-select" aria-label={v4("pstDesk")} value={desk} onChange={(event) => setDesk(event.target.value)}>
            {PASTRY_BENCHES.map((item) => <option key={item} value={item}>{benchLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("pstSearch")}</span>
          <input ref={searchRef} className="c4-field c4-pastry-search" aria-label={v4("pstSearch")} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("pstSearch")} />
        </label>
        {(["open", "pause", "seal"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{item === "open" ? v4("pstOpen") : item === "pause" ? v4("pstPause") : v4("pstSealed")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={houseOnly ? "1" : "0"} onClick={() => setHouseOnly((value) => !value)}>{v4("pstHouseOnly")}</button>
        <button type="button" className="c4-chip" data-on={peakOnly ? "1" : "0"} onClick={() => setPeakOnly((value) => !value)}>{v4("pstPeak")}</button>
        <button type="button" className="c4-chip" data-on={quietOnly ? "1" : "0"} onClick={() => setQuietOnly((value) => !value)}>{v4("pstQuiet")}</button>
        <button type="button" className="c4-chip" data-on={sort === "baker" ? "1" : "0"} onClick={() => setSort((value) => value === "bench" ? "baker" : "bench")}>{sort === "baker" ? v4("pstSortBaker") : v4("pstSortBench")}</button>
        <button type="button" className="c4-chip" data-on={density === "close" ? "1" : "0"} onClick={() => storeDensity(density === "roomy" ? "close" : "roomy")}>{density === "roomy" ? v4("pstRoomy") : v4("pstClose")}</button>
        <button type="button" className="c4-chip" onClick={() => setBoard((value) => value === "hall" ? "index" : "hall")}>{board === "hall" ? v4("pstHall") : v4("pstIndex")}</button>
      </div>
      <div className="c4-pastry-tools">
        <select className="c4-select" aria-label={v4("pstBaker")} value={bakerFilter} onChange={(event) => setBakerFilter(event.target.value)}>
          <option value="all">{v4("pstAll")}</option>
          {bakers.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("pstGlaze")} value={glazeFilter} onChange={(event) => setGlazeFilter(event.target.value)}>
          <option value="all">{v4("pstAll")}</option>
          {GLASSES.map((item) => <option key={item} value={item}>{glazeLabel(v4, item.toUpperCase())}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("pstPace")} value={paceFilter} onChange={(event) => setPaceFilter(event.target.value)}>
          <option value="all">{v4("pstAll")}</option>
          {POURS.map((item) => <option key={item} value={item}>{paceLabel(v4, item)}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("pstBench")} value={benchFilter} onChange={(event) => setBenchFilter(event.target.value)}>
          <option value="all">{v4("pstAll")}</option>
          <option value="peak">{v4("pstPeakBench")}</option>
          <option value="quiet">{v4("pstQuietBench")}</option>
          {PASTRY_BENCHES.map((item) => <option key={item} value={item}>{benchLabel(v4, item)}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("pstWait")} value={waitFilter} onChange={(event) => setWaitFilter(event.target.value)}>
          <option value="all">{v4("pstAll")}</option>
          {WAITS.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="c4-select" aria-label={v4("pstRank")} value={rankFilter} onChange={(event) => setRankFilter(event.target.value)}>
          <option value="all">{v4("pstAll")}</option>
          {RANKS.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </div>
      <form className="c4-pastry-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addPastry(cards, { id: `pst-${Date.now()}`, title, note, baker, bench, glaze, pace, wait: waitMin, rank, tags });
        if (next.length === cards.length) return;
        store(next);
        setTitle("");
        setNote("");
        setTags("");
      }}>
        <label className="c4-lab"><span>{v4("pstTitleField")}</span><input className="c4-field" aria-label={v4("pstTitleField")} value={title} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("pstNote")}</span><input className="c4-field" aria-label={v4("pstNote")} aria-required={false} value={note} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <p className="c4-pastry-meta">{v4("pstNoteOptional")}</p>
        <label className="c4-lab"><span>{v4("pstBaker")}</span><input className="c4-field" aria-label={v4("pstBaker")} value={baker} disabled={viewer} onChange={(event) => setBaker(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("pstBench")}</span>
          <select className="c4-select" aria-label={v4("pstBench")} value={bench} disabled={viewer} onChange={(event) => setBench(event.target.value)}>
            <option value="">{v4("pstBlank")}</option>
            {PASTRY_BENCHES.map((item) => <option key={item} value={item}>{benchLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("pstGlaze")}</span>
          <select className="c4-select" aria-label={v4("pstGlaze")} value={glaze} disabled={viewer} onChange={(event) => setGlaze(event.target.value)}>
            <option value="">{v4("pstBlankGlaze")}</option>
            {GLASSES.map((item) => <option key={item} value={item}>{glazeLabel(v4, item.toUpperCase())}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("pstPace")}</span>
          <select className="c4-select" aria-label={v4("pstPace")} value={pace} disabled={viewer} onChange={(event) => setPace(event.target.value)}>
            <option value="">{v4("pstBlankPace")}</option>
            {POURS.map((item) => <option key={item} value={item}>{paceLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("pstWait")}</span>
          <select className="c4-select" aria-label={v4("pstWait")} value={waitMin} disabled={viewer} onChange={(event) => setWaitMin(event.target.value)}>
            <option value="">{v4("pstBlankWait")}</option>
            {WAITS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("pstRank")}</span>
          <select className="c4-select" aria-label={v4("pstRank")} value={rank} disabled={viewer} onChange={(event) => setRank(event.target.value)}>
            {RANKS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("pstTags")}</span><input className="c4-field" aria-label={v4("pstTags")} value={tags} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("pstAdd")}</button>
      </form>
      <form className="c4-pastry-tools" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addPastryView(views, { id: `view-${Date.now()}`, name: viewName, tray, query, baker: bakerFilter, glaze: glazeFilter, pace: paceFilter, bench: benchFilter, wait: waitFilter, rank: rankFilter });
        if (next.length === views.length) return;
        storeViews(next);
        setViewName("");
      }}>
        <label className="c4-lab"><span>{v4("pstViewName")}</span><input className="c4-field" aria-label={v4("pstViewName")} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("pstSaveView")}</button>
        {views.map((view) => (
          <span key={view.id} className="c4-pastry-view">
            <button type="button" className="c4-btn" onClick={() => applyView(view)}>{v4("pstApply")} {view.name}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropPastryView(views, view.id))}>{v4("pstDropView")}</button>
          </span>
        ))}
      </form>
      {picked.length > 0 && (
        <div className="c4-pastry-tools">
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkPastryPin(cards, picked))}>{v4("pstBulkPin")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkPastrySeal(cards, picked))}>{v4("pstBulkSeal")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkPastryWhip(cards, picked))}>{v4("pstBulkWhip")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkPastryCocoa(cards, picked))}>{v4("pstBulkCocoa")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkPastryTag(cards, picked, "b"))}>{v4("pstBulkTag")}</button>
        </div>
      )}
      <p className="c4-pastry-meta">{v4("pstSuggest")} {glazeLabel(v4, suggested)} · {v4("pstFair")} {fair} · {v4("pstBusy")} {busy || v4("pstBlankBaker")} · {v4("pstNeighbors")} {neighborPastryCount(cards)} · {v4("pstClash")} {clashBenchCount(cards)} · {v4("pstWaitHint")} {suggestPastryWait(cards, clock)} · {v4("pstBenchHint")} {benchLabel(v4, benchHint)}</p>
      {(reminders.length > 0 || idling.length > 0) && (
        <p className="c4-pastry-meta">{v4("pstDue")} {reminders.map((card) => card.title).join(" · ")} · {v4("pstIdle")} {idling.map((card) => card.title).join(" · ")}</p>
      )}
      {!shown.length && <p className="c4-pastry-empty">{v4("pstEmpty")}</p>}
      <ol className={board === "index" ? "c4-pastry-index" : "c4-pastry-board"} data-density={density}>
        {shown.map((card, index) => {
          const dial = Math.round(((card.wait ?? 0) / 45) * 100);
          return (
            <li key={card.id} className="c4-pastry-label" data-on={index === focusAt ? "1" : "0"} data-pinned={card.pinned ? "1" : "0"} data-overdue={overduePastry(card) ? "1" : "0"} data-peak={peakBench(card.bench) ? "1" : "0"} data-quiet={quietBench(card.bench) ? "1" : "0"} data-house={houseGlaze(card.glaze) ? "1" : "0"} data-brisk={briskPastry(card) ? "1" : "0"} data-idle={idlePastry(card) ? "1" : "0"} data-resting={restingPastry(card) ? "1" : "0"} data-late={latePastry(card, desk) ? "1" : "0"}>
              <div className="c4-pastry-monogram" aria-hidden="true">{(card.title[0] || "·").toUpperCase()}</div>
              <label className="c4-pastry-pick"><input type="checkbox" checked={picked.includes(card.id)} aria-label={card.title} onChange={() => togglePick(card.id)} /></label>
              <div>
                <input className="c4-field" aria-label={v4("pstEdit")} value={card.title} disabled={viewer} onChange={(event) => store(editPastry(cards, card.id, event.target.value))} />
                <input className="c4-field" aria-label={v4("pstEditNote")} aria-required={false} value={card.note} disabled={viewer} onChange={(event) => store(editPastryNote(cards, card.id, event.target.value))} />
                <p className="c4-pastry-meta">{card.baker || v4("pstBlankBaker")} · {benchLabel(v4, card.bench)} · {glazeLabel(v4, card.glaze)} · {paceLabel(v4, card.pace)} · {card.wait ?? v4("pstBlankWait")} · {v4("pstRank")} {card.rank} · {card.tags.join(" ") || v4("pstTags")}</p>
                <p className="c4-pastry-dial" aria-label={v4("pstWait")} style={{ background: `conic-gradient(#c6a15b ${dial}%, #efe6d6 ${dial}% 100%)` }} />
                <p className="c4-pastry-meta">{benchLabel(v4, desk)} · {AUDIT_KEY[card.audit] ? v4(AUDIT_KEY[card.audit]) : v4("pstAuditSave")}</p>
                <div className="c4-pastry-tools">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setPastryPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("pstUnpin") : v4("pstPin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer || card.sealed} onClick={() => store(setPastryPause(cards, card.id, !card.paused))}>{card.paused ? v4("pstResume") : v4("pstPause")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setPastrySeal(cards, card.id, !card.sealed))}>{card.sealed ? v4("pstOpenAgain") : v4("pstSealed")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setPastryStar(cards, card.id, !card.flagged))}>{card.flagged ? v4("pstUnstar") : v4("pstStar")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cyclePace(cards, card.id))}>{v4("pstTempo")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lengthenPastry(cards, card.id))}>{v4("pstLengthen")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(shortenPastry(cards, card.id))}>{v4("pstShorten")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raisePastry(cards, card.id))}>{v4("pstRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerPastry(cards, card.id))}>{v4("pstLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setPastryGlaze(cards, card.id, card.glaze === "COCOA" ? "sugar" : "cocoa"))}>{v4("pstGlaze")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addPastryTag(cards, card.id, "c"))}>{v4("pstTags")}</button>
                  <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(pastryCopy(card)); setCopied(card.id); }}>{copied === card.id ? v4("pstCopied") : v4("pstCopy")}</button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <button type="button" className="c4-btn" onClick={() => download("pastry-slips.csv", pastryCsv(shown, desk))}>{v4("pstCsv")}</button>
    </section>
  );
}

export function CipherPlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: TraderRow[] }>("/api/admin/users?take=24&meta=0&role=TRADER");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [lane, setLane] = useState("all");
  const [hue, setHue] = useState("all");
  const [shape, setShape] = useState<CipherShape>("all");
  const [review, setReview] = useState<CipherReview>("all");
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [focus, setFocus] = useState(0);
  const [copied, setCopied] = useState("");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = useMemo<CipherRow[]>(() => (queue.data?.users || []).map((row, index) => ({
    id: row.id ? `trader-${row.id}` : `trader-${index}`,
    label: textField(row.name),
    note: { affiliateC: textField(row.affiliateC) } satisfies CipherValue,
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
    const present = presentCipherLanes(rows);
    const ids = rows.map((row) => row.id);
    const nextHidden = readHiddenCiphers(readJson(CPH_KEY, []), present);
    const nextReviewed = readReviewedCiphers(readJson(CPH_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(CPH_KEY, nextHidden);
    writeJson(CPH_REVIEW_KEY, nextReviewed);
  }, [rows]);
  const present = presentCipherLanes(rows);
  const lanes = visibleCipherLanes(present, hidden, showHidden);
  const shown = visibleCiphers(rows, lane, hue, query, review, reviewed, shape).filter((row) => {
    const token = cipherLane(row.note);
    if (!token) return true;
    return showHidden || !hidden.includes(token);
  });
  const focusAt = shown.length ? focus % shown.length : 0;
  const bars = cipherLanes(rows);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const lead = leadingCipher(rows);
  const leadHue = leadingCipherHue(rows);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocus((index) => movePastryFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => movePastryFocus(index, shown.length, -1));
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
    writeJson(CPH_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(CPH_REVIEW_KEY, next);
  }
  return (
    <section className="c4-cipher" aria-label={v4("cphTitle")} data-plates="1" data-traders={rows.length} data-role={role}>
      <header className="c4-cipher-mast">
        <p className="c4-cipher-seal" data-logo="mono">{v4("cphLogo")}</p>
        <div>
          <p className="c4-cipher-kicker">{v4("cphSub")}</p>
          <h2 className="c4-title">{v4("cphTitle")}</h2>
        </div>
      </header>
      <ol className="c4-cipher-index" aria-label={v4("cphTitle")}>
        <li data-tone="gold">{v4("cphChampagne")}</li>
        <li data-tone="ink">{v4("cphGraphite")}</li>
        <li data-tone="ivory">{v4("cphIvory")}</li>
      </ol>
      <p className="c4-cipher-links">
        <Link href={crmv4Href(base, "pst")}>{v4("cphCards")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("pstCustomers")}</Link>
        <Link href={crmv4Href(base, "support")}>{v4("pstSupport")}</Link>
      </p>
      <p className="c4-cipher-hint">{v4("cphHint")}</p>
      {viewer && <p className="c4-cipher-note">{v4("cphViewer")}</p>}
      {queue.loading && <p className="c4-cipher-meta">{v4("cphEmpty")}</p>}
      {queue.error && <p className="c4-cipher-meta">{queue.error}</p>}
      <ul className="c4-cipher-kpis" aria-label={v4("cphRules")}>
        <li><span>{v4("cphLead")}</span><strong>{lead ? laneLabel(v4, lead) : v4("cphUnmarked")}</strong></li>
        <li><span>{v4("cphToneLead")}</span><strong>{leadHue ? hueLabel(v4, leadHue) : v4("cphUnmarked")}</strong></li>
        <li><span>{v4("cphShared")}</span><strong>{sharedCipherCount(rows)}</strong></li>
        <li><span>{v4("cphShare")}</span><strong>{cipherShare(laneCipherCount(rows, "crest"), Math.max(1, rows.length))}%</strong></li>
        <li><span>{v4("cphKnown")}</span><strong>{rows.filter((row) => cipherKnown(row.note)).length}</strong></li>
        <li><span>{v4("cphTwin")}</span><strong>{rows.filter((row) => cipherTwin(row.note)).length}</strong></li>
        <li><span>{v4("cphSlash")}</span><strong>{rows.filter((row) => cipherSlash(row.note)).length}</strong></li>
        <li><span>{v4("cphEcho")}</span><strong>{rows.filter((row) => cipherEcho(row.note)).length}</strong></li>
      </ul>
      <div className="c4-cipher-chart" aria-label={v4("cphRules")}>
        {bars.map((bar) => (
          <button key={bar.lane} type="button" className="c4-cipher-bar" data-on={lane === bar.lane ? "1" : "0"} onClick={() => setLane(lane === bar.lane ? "all" : bar.lane)}>
            <i style={{ height: `${Math.round((bar.count / maxBar) * 100)}%` }} />
            <strong>{bar.count}</strong>
            <span>{laneLabel(v4, bar.lane)}</span>
          </button>
        ))}
      </div>
      <div className="c4-cipher-tools">
        <input ref={searchRef} className="c4-field c4-cipher-search" aria-label={v4("cphSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("cphSearch")} />
        {(["all", "ivory", "graphite", "champagne"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("cphAll") : hueLabel(v4, item)}</button>
        ))}
        {(["all", "crest", "board", "mark", "seam", "wide", "notch", "leap", "slash", "twin", "known", "echo"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>
            {item === "all" ? v4("cphShapeAll") : item === "wide" ? v4("cphShapeWide") : item === "notch" ? v4("cphShapeNotch") : item === "leap" ? v4("cphShapeLeap") : item === "slash" ? v4("cphShapeSlash") : item === "twin" ? v4("cphShapeTwin") : item === "known" ? v4("cphShapeKnown") : item === "echo" ? v4("cphShapeEcho") : laneLabel(v4, item)}
          </button>
        ))}
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{item === "all" ? v4("cphAll") : item === "reviewed" ? v4("cphReviewed") : v4("cphUnreviewed")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("cphShow")}</button>
      </div>
      <ul className="c4-cipher-lanes">
        {lanes.map((item) => (
          <li key={item}>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeHidden(toggleCipher(hidden, item))}>{hidden.includes(item) ? v4("cphShow") : v4("cphHide")} {laneLabel(v4, item)}</button>
          </li>
        ))}
      </ul>
      {picked.length > 0 && (
        <div className="c4-cipher-tools">
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkCipherReview(reviewed, picked, true))}>{v4("cphBulkReview")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkCipherReview(reviewed, picked, false))}>{v4("cphBulkClear")}</button>
        </div>
      )}
      {!shown.length && <p className="c4-cipher-empty">{v4("cphEmpty")}</p>}
      <ol className="c4-cipher-board">
        {shown.map((row, index) => {
          const seen = reviewed.includes(row.id);
          return (
            <li key={row.id} className="c4-cipher-card" data-on={index === focusAt ? "1" : "0"} data-lane={cipherLane(row.note)} data-hue={cipherHue(row.note)} data-reviewed={seen ? "1" : "0"} data-known={cipherKnown(row.note) ? "1" : "0"}>
              <p className="c4-cipher-stamp">{cipherStamp(row.note) || "·"}</p>
              <label className="c4-cipher-pick"><input type="checkbox" checked={picked.includes(row.id)} aria-label={row.label || row.id} onChange={() => setPicked((current) => current.includes(row.id) ? current.filter((item) => item !== row.id) : [...current, row.id])} /></label>
              <div>
                <strong>{row.label || v4("cphUnmarked")}</strong>
                <p className="c4-cipher-meta">{laneLabel(v4, cipherLane(row.note))} · {hueLabel(v4, cipherHue(row.note))} · {v4("cphStep")} {cipherStep(row.note)}{cipherCap(row.note) ? ` · ${v4("cphCap")}` : ""}{cipherTail(row.note) ? ` · ${v4("cphTail")}` : ""}{cipherWide(row.note) ? ` · ${v4("cphWide")}` : ""}{cipherNotch(row.note) ? ` · ${v4("cphNotch")}` : ""}{cipherLeap(row.note) ? ` · ${v4("cphLeap")}` : ""}</p>
                <div className="c4-cipher-tools">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleCipherReview(reviewed, row.id))}>{seen ? v4("cphReviewed") : v4("cphReview")}</button>
                  <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(cipherCopy(row.note)); setCopied(row.id); }}>{copied === row.id ? v4("cphCopied") : v4("cphCopy")}</button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <div className="c4-cipher-tools">
        <button type="button" className="c4-btn" onClick={() => download("cipher-lanes.csv", cipherLanesCsv(rows))}>{v4("cphCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("cipher-rows.csv", cipherRowsCsv(shown, reviewed))}>{v4("cphRowCsv")}</button>
      </div>
    </section>
  );
}
