"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  HALL_KEY,
  HALL_REVIEW_KEY,
  SLIP_KEY,
  SLIP_VIEW_KEY,
  activeCipher,
  activeClerk,
  activeHouseBand,
  activeHouseParity,
  activeLeaf,
  activePace,
  activeShelf,
  activeSpan,
  activeWait,
  addSlip,
  addSlipView,
  bulkHouseReview,
  bulkSlipFile,
  bulkSlipPin,
  bulkSlipShelf,
  catalogHouse,
  catalogHouseCount,
  cipherArg,
  clashLeafCount,
  clerkArg,
  cyclePace,
  dropSlipView,
  editSlip,
  editSlipNote,
  evenHouse,
  evenHouseCount,
  fairClerk,
  homeCipher,
  houseBand,
  houseBandArg,
  houseCopy,
  houseParity,
  houseParityArg,
  houseRowsCsv,
  houseShare,
  houseState,
  housesCsv,
  lateSlip,
  leafArg,
  leafGap,
  nextSlip,
  paceArg,
  presentHouses,
  readHiddenHouses,
  readReviewedHouses,
  readSlipViews,
  readSlips,
  resetSlips,
  setSlipFile,
  setSlipHold,
  setSlipPin,
  shelfArg,
  shelfCounts,
  slipCopy,
  slipCounts,
  slipShare,
  slipsCsv,
  soonSlip,
  spanArg,
  spanClashCount,
  suggestClerk,
  suggestShelf,
  suggestWait,
  toggleHouse,
  toggleHouseReview,
  usedLeaves,
  visibleHouseBands,
  visibleHouseCustomers,
  visibleSlips,
  waitArg,
  wideHouse,
  wideHouseCount,
  slipClerks,
  slipCiphers,
  slipPaces,
  slipTimeline,
  leadingHouse,
  leadingHouseParity,
  sharedHouseCount,
  type HallRow,
  type HallShape,
  type Slip,
  type SlipPace,
  type SlipShelf,
  type SlipTray,
  type SlipView,
} from "@/lib/crmv4/round188";
import { useJson } from "./kit";
import { storedRole } from "./round5";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  email?: string | null;
};

type GlanceRow = HallRow & { id: string };

const SHELVES = ["oak", "linen", "gilt", "ink"] as const;
const BANDS = ["post", "lane", "court", "hall"] as const;

function shelfName(v4: V4, shelf: SlipShelf | string): string {
  if (shelf === "oak") return v4("idxOak");
  if (shelf === "linen") return v4("idxLinen");
  if (shelf === "gilt") return v4("idxGilt");
  if (shelf === "ink") return v4("idxInk");
  return v4("idxBlankShelf");
}

function paceName(v4: V4, pace: SlipPace | string): string {
  if (pace === "hush") return v4("idxPaceHush");
  if (pace === "walk") return v4("idxPaceWalk");
  if (pace === "rush") return v4("idxPaceRush");
  return v4("idxBlankPace");
}

function leafName(v4: V4, name: string): string {
  if (name === "dawn") return v4("idxDawn");
  if (name === "day") return v4("idxDay");
  if (name === "dusk") return v4("idxDusk");
  if (name === "peak") return v4("idxPeak");
  if (name === "quiet") return v4("idxQuiet");
  if (/^(?:[1-9]|1[0-9]|2[0-8])$/.test(name)) return name;
  return v4("idxBlankLeaf");
}

function spanName(v4: V4, span: number | null): string {
  if (span === 2) return v4("idxSpan2");
  if (span === 4) return v4("idxSpan4");
  if (span === 8) return v4("idxSpan8");
  return v4("idxBlankSpan");
}

function waitName(v4: V4, wait: number | null): string {
  if (wait === 1) return v4("idxWait1");
  if (wait === 3) return v4("idxWait3");
  if (wait === 7) return v4("idxWait7");
  return v4("idxBlankWait");
}

function bandName(v4: V4, name: string): string {
  if (name === "post") return v4("mhlPost");
  if (name === "lane") return v4("mhlLane");
  if (name === "court") return v4("mhlCourt");
  if (name === "hall") return v4("mhlHall");
  if (name === "blank") return v4("mhlClear");
  return v4("mhlUnmarked");
}

function parityName(v4: V4, name: string): string {
  if (name === "even") return v4("mhlEven");
  if (name === "odd") return v4("mhlOdd");
  return v4("mhlUnmarked");
}

function auditName(v4: V4, audit: string): string {
  const key = {
    save: "idxAuditSave",
    edit: "idxAuditEdit",
    pace: "idxAuditPace",
    pin: "idxAuditPin",
    unpin: "idxAuditUnpin",
    hold: "idxAuditHold",
    lift: "idxAuditLift",
    file: "idxAuditFile",
    reopen: "idxAuditReopen",
    shelf: "idxAuditShelf",
  }[audit];
  return key ? v4(key as CrmV4CopyKey) : "";
}

function gapLabel(v4: V4, leaf: number | null, desk: string): string {
  const gap = leafGap(leaf, desk);
  if (gap === null) return "";
  if (gap > 0) return `${v4("idxPast")} ${gap}`;
  if (gap < 0) return `${v4("idxAhead")} ${Math.abs(gap)}`;
  return v4("idxDue");
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

export function IndexSlips({ v4 }: { v4: V4 }) {
  const [cards, setCards] = useState<Slip[]>([]);
  const [views, setViews] = useState<SlipView[]>([]);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [clerk, setClerk] = useState("");
  const [leaf, setLeaf] = useState("");
  const [shelf, setShelf] = useState("");
  const [cipher, setCipher] = useState("");
  const [pace, setPace] = useState("");
  const [span, setSpan] = useState("");
  const [wait, setWait] = useState("");
  const [roster, setRoster] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<SlipTray>("open");
  const [clerkFilter, setClerkFilter] = useState("all");
  const [shelfFilter, setShelfFilter] = useState("all");
  const [cipherFilter, setCipherFilter] = useState("all");
  const [paceFilter, setPaceFilter] = useState("all");
  const [leafFilter, setLeafFilter] = useState("all");
  const [spanFilter, setSpanFilter] = useState("all");
  const [waitFilter, setWaitFilter] = useState("all");
  const [hushOnly, setHushOnly] = useState(false);
  const [peakOnly, setPeakOnly] = useState(false);
  const [homeOnly, setHomeOnly] = useState(false);
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const [copied, setCopied] = useState("");
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [desk, setDesk] = useState("");
  const [moveShelf, setMoveShelf] = useState("ink");
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  useEffect(() => {
    const next = readSlips(readJson(SLIP_KEY, []));
    const saved = readSlipViews(readJson(SLIP_VIEW_KEY, []));
    setCards(next);
    setViews(saved);
    writeJson(SLIP_KEY, next);
    writeJson(SLIP_VIEW_KEY, saved);
    setRole(storedRole());
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey || typingTarget(event)) return;
      if (event.key === "n" || event.key === "N") {
        event.preventDefault();
        titleRef.current?.focus();
        return;
      }
      if (event.key !== "/") return;
      event.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  function store(next: Slip[]) {
    const saved = readSlips(next);
    setCards(saved);
    writeJson(SLIP_KEY, saved);
    setPicked((ids) => ids.filter((id) => saved.some((card) => card.id === id)));
  }
  const clerks = slipClerks(cards);
  const ciphers = slipCiphers(cards);
  const paces = slipPaces(cards);
  const bars = shelfCounts(cards);
  const clerkOn = activeClerk(clerkFilter, clerks);
  const shelfOn = activeShelf(shelfFilter, SHELVES);
  const cipherOn = activeCipher(cipherFilter, ciphers);
  const paceOn = activePace(paceFilter, paces);
  const leafOn = activeLeaf(leafFilter);
  const spanOn = activeSpan(spanFilter);
  const waitOn = activeWait(waitFilter);
  const pickedLeaf = leafArg(leafOn);
  const shown = visibleSlips(
    cards,
    tray,
    query,
    clerkArg(clerkOn),
    shelfArg(shelfOn),
    cipherArg(cipherOn),
    paceArg(paceOn),
    pickedLeaf.exact,
    pickedLeaf.pick,
    spanArg(spanOn),
    waitArg(waitOn),
    hushOnly,
    peakOnly,
    homeOnly,
  );
  const timeline = slipTimeline(cards, query);
  const counts = slipCounts(cards, desk);
  const clashes = clashLeafCount(cards);
  const spans = spanClashCount(cards);
  const nextId = nextSlip(cards, desk);
  const nextCard = cards.find((card) => card.id === nextId);
  const suggestedShelf = suggestShelf(cards);
  const suggestedClerk = suggestClerk(cards);
  const suggestedWait = suggestWait(cards);
  const fair = fairClerk(cards, roster);
  const total = cards.length;
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  function clearDraft() {
    setTitle("");
    setNote("");
    setClerk("");
    setLeaf("");
    setShelf("");
    setCipher("");
    setPace("");
    setSpan("");
    setWait("");
    setQuery("");
    setEditing("");
  }
  return (
    <section className="c4-idx" aria-label={v4("idxTitle")} data-slips="1" data-role={role}>
      <header className="c4-idx-mast">
        <div>
          <p className="c4-idx-kicker">{v4("idxSub")}</p>
          <h2 className="c4-title">{v4("idxTitle")}</h2>
        </div>
        <p className="c4-idx-plate" data-logo="mono">{v4("idxLogo")}</p>
      </header>
      <p className="c4-idx-rules">{v4("idxHint")}</p>
      <p className="c4-meta">{v4("idxLocal")}</p>
      <p className="c4-meta">{v4("idxNew")} {v4("idxSlash")} {v4("idxEscape")}</p>
      {viewer && <p className="c4-idx-notice" data-viewer="1">{v4("idxViewer")}</p>}
      {counts.peak > 0 && (
        <div className="c4-idx-bells">
          <p className="c4-idx-notice">{v4("idxNotice")} · {counts.peak}</p>
          <button type="button" className="c4-btn" onClick={() => setPeakOnly((on) => !on)}>{peakOnly ? v4("idxNoticeAll") : v4("idxNoticePeak")}</button>
        </div>
      )}
      <dl className="c4-idx-kpi" aria-label={v4("idxKpi")}>
        <div><dt>{v4("idxOpen")}</dt><dd>{counts.open}</dd></div>
        <div><dt>{v4("idxHeld")}</dt><dd>{counts.held}</dd></div>
        <div><dt>{v4("idxFiled")}</dt><dd>{counts.filed}</dd></div>
        <div><dt>{v4("idxPinned")}</dt><dd>{counts.pinned}</dd></div>
        <div><dt>{v4("idxPeak")}</dt><dd>{counts.peak}</dd></div>
        <div><dt>{v4("idxLate")}</dt><dd>{counts.late}</dd></div>
        <div><dt>{v4("idxSoon")}</dt><dd>{counts.soon}</dd></div>
        <div><dt>{v4("idxHomeShare")}</dt><dd>{slipShare(counts.home, total)}%</dd></div>
      </dl>
      <div className="c4-idx-chart" aria-label={v4("idxShelves")}>
        {bars.map((bar) => (
          <div key={bar.shelf} className="c4-idx-col" data-on={shelfOn === bar.shelf ? "1" : "0"}>
            <span className="c4-idx-swatch" data-shelf={bar.shelf} />
            <div className="c4-idx-track" aria-hidden="true"><i style={{ height: `${Math.round((bar.count / maxBar) * 100)}%` }} /></div>
            <button type="button" className="c4-btn" onClick={() => setShelfFilter(bar.shelf)}>{shelfName(v4, bar.shelf)} · {bar.count}</button>
          </div>
        ))}
        {!bars.length && <p className="c4-empty-gold">{v4("idxEmpty")}</p>}
      </div>
      <div className="c4-idx-suggest">
        <p>{v4("idxSuggestShelf")} · {shelfName(v4, suggestedShelf)}</p>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => setShelf(suggestedShelf)}>{v4("idxUseShelf")}</button>
        <p>{v4("idxSuggestClerk")} · {suggestedClerk || v4("idxBlankClerk")}</p>
        <button type="button" className="c4-btn" disabled={viewer || !suggestedClerk} onClick={() => setClerk(suggestedClerk)}>{v4("idxUseClerk")}</button>
        <p>{v4("idxSuggestWait")} · {waitName(v4, suggestedWait)}</p>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => setWait(String(suggestedWait))}>{v4("idxUseWait")}</button>
        <p>{v4("idxAssign")} · {fair || v4("idxBlankClerk")}</p>
        <button type="button" className="c4-btn" disabled={viewer || !fair} onClick={() => setClerk(fair)}>{v4("idxAssign")}</button>
      </div>
      <p className="c4-meta">{v4("idxLeafUse")} · {usedLeaves(cards)} · {clashes ? `${v4("idxClash")} · ${clashes}` : v4("idxClashNone")} · {spans ? `${v4("idxSpanClash")} · ${spans}` : v4("idxSpanClashNone")}</p>
      <p className="c4-meta">{v4("idxNext")} · {nextCard ? nextCard.title : v4("idxNextNone")}</p>
      <form className="c4-idx-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addSlip(cards, { id: `idx-${Date.now()}`, title, note, clerk, leaf, shelf, cipher, pace, span, wait });
        if (next.length === cards.length && title.trim()) return;
        store(next);
        setTitle("");
        setNote("");
      }}>
        <label className="c4-lab"><span>{v4("idxLine")}</span>
          <input ref={titleRef} className="c4-field" aria-label={v4("idxLine")} value={title} disabled={viewer} onChange={(event) => setTitle(event.target.value)} onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            clearDraft();
          }} />
        </label>
        <label className="c4-lab"><span>{v4("idxNote")}</span>
          <input className="c4-field" aria-label={v4("idxNote")} value={note} disabled={viewer} onChange={(event) => setNote(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("idxClerk")}</span>
          <input className="c4-field" aria-label={v4("idxClerk")} value={clerk} disabled={viewer} onChange={(event) => setClerk(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("idxLeaf")}</span>
          <input className="c4-field" aria-label={v4("idxLeaf")} inputMode="numeric" value={leaf} disabled={viewer} onChange={(event) => setLeaf(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("idxShelf")}</span>
          <select className="c4-field" aria-label={v4("idxShelf")} value={shelf} disabled={viewer} onChange={(event) => setShelf(event.target.value)}>
            <option value="">{v4("idxBlankShelf")}</option>
            {SHELVES.map((item) => <option key={item} value={item}>{shelfName(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("idxCipher")}</span>
          <input className="c4-field" aria-label={v4("idxCipher")} value={cipher} disabled={viewer} onChange={(event) => setCipher(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("idxPace")}</span>
          <select className="c4-field" aria-label={v4("idxPace")} value={pace} disabled={viewer} onChange={(event) => setPace(event.target.value)}>
            <option value="">{v4("idxBlankPace")}</option>
            <option value="hush">{v4("idxPaceHush")}</option>
            <option value="walk">{v4("idxPaceWalk")}</option>
            <option value="rush">{v4("idxPaceRush")}</option>
          </select>
        </label>
        <label className="c4-lab"><span>{v4("idxSpan")}</span>
          <input className="c4-field" aria-label={v4("idxSpan")} inputMode="numeric" value={span} disabled={viewer} onChange={(event) => setSpan(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("idxWait")}</span>
          <input className="c4-field" aria-label={v4("idxWait")} inputMode="numeric" value={wait} disabled={viewer} onChange={(event) => setWait(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("idxRoster")}</span>
          <input className="c4-field" aria-label={v4("idxRoster")} value={roster} disabled={viewer} onChange={(event) => setRoster(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn c4-btn-hot" disabled={viewer}>{v4("idxAdd")}</button>
      </form>
      <p className="c4-meta">{v4("idxBlank")} {v4("idxLeafBlank")}</p>
      <div className="c4-idx-filters">
        {(["open", "held", "filed"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>
            {item === "open" ? v4("idxOpen") : item === "held" ? v4("idxHeld") : v4("idxFiled")}
          </button>
        ))}
        <label className="c4-lab"><span>{v4("idxSearch")}</span>
          <input ref={searchRef} className="c4-field" aria-label={v4("idxSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            clearDraft();
          }} />
        </label>
        <label className="c4-lab"><span>{v4("idxDeskLeaf")}</span>
          <input className="c4-field" aria-label={v4("idxDeskLeaf")} inputMode="numeric" value={desk} onChange={(event) => setDesk(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("idxClerks")}</span>
          <select className="c4-field" aria-label={v4("idxAllClerks")} value={clerkOn} onChange={(event) => setClerkFilter(event.target.value)}>
            <option value="all">{v4("idxAllClerks")}</option>
            <option value="blank">{v4("idxBlankClerk")}</option>
            {clerks.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("idxShelves")}</span>
          <select className="c4-field" aria-label={v4("idxShelves")} value={shelfOn} onChange={(event) => setShelfFilter(event.target.value)}>
            <option value="all">{v4("idxShelves")}</option>
            <option value="blank">{v4("idxBlankShelf")}</option>
            {SHELVES.map((item) => <option key={item} value={item}>{shelfName(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("idxCiphers")}</span>
          <select className="c4-field" aria-label={v4("idxAllCiphers")} value={cipherOn} onChange={(event) => setCipherFilter(event.target.value)}>
            <option value="all">{v4("idxAllCiphers")}</option>
            <option value="blank">{v4("idxBlankCipher")}</option>
            {ciphers.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("idxPaces")}</span>
          <select className="c4-field" aria-label={v4("idxAllPaces")} value={paceOn} onChange={(event) => setPaceFilter(event.target.value)}>
            <option value="all">{v4("idxAllPaces")}</option>
            <option value="blank">{v4("idxBlankPace")}</option>
            {paces.map((item) => <option key={item} value={item}>{paceName(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("idxLeaves")}</span>
          <select className="c4-field" aria-label={v4("idxAllLeaves")} value={leafOn} onChange={(event) => setLeafFilter(event.target.value)}>
            <option value="all">{v4("idxAllLeaves")}</option>
            {["blank", "dawn", "day", "dusk", "peak", "quiet", "1", "7", "15", "28"].map((item) => <option key={item} value={item}>{leafName(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("idxSpans")}</span>
          <select className="c4-field" aria-label={v4("idxAllSpans")} value={spanOn} onChange={(event) => setSpanFilter(event.target.value)}>
            <option value="all">{v4("idxAllSpans")}</option>
            <option value="blank">{v4("idxBlankSpan")}</option>
            <option value="2">{v4("idxSpan2")}</option>
            <option value="4">{v4("idxSpan4")}</option>
            <option value="8">{v4("idxSpan8")}</option>
          </select>
        </label>
        <label className="c4-lab"><span>{v4("idxWaits")}</span>
          <select className="c4-field" aria-label={v4("idxAllWaits")} value={waitOn} onChange={(event) => setWaitFilter(event.target.value)}>
            <option value="all">{v4("idxAllWaits")}</option>
            <option value="blank">{v4("idxBlankWait")}</option>
            <option value="1">{v4("idxWait1")}</option>
            <option value="3">{v4("idxWait3")}</option>
            <option value="7">{v4("idxWait7")}</option>
          </select>
        </label>
        <button type="button" className="c4-chip" data-on={hushOnly ? "1" : "0"} onClick={() => setHushOnly((on) => !on)}>{v4("idxHushOnly")}</button>
        <button type="button" className="c4-chip" data-on={homeOnly ? "1" : "0"} onClick={() => setHomeOnly((on) => !on)}>{homeOnly ? v4("idxHomeOnly") : v4("idxHomeAll")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard((item) => item === "cards" ? "timeline" : "cards")}>{board === "cards" ? v4("idxTimeline") : v4("idxCards")}</button>
      </div>
      <form className="c4-idx-views" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addSlipView(views, {
          id: `view-${Date.now()}`,
          name: viewName,
          tray,
          query,
          clerk: clerkOn,
          shelf: shelfOn,
          cipher: cipherOn,
          pace: paceOn,
          leaf: leafOn,
          span: spanOn,
          wait: waitOn,
        });
        setViews(next);
        writeJson(SLIP_VIEW_KEY, next);
        setViewName("");
      }}>
        <label className="c4-lab"><span>{v4("idxViewName")}</span>
          <input className="c4-field" aria-label={v4("idxViewName")} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("idxSaveView")}</button>
        <ul aria-label={v4("idxViews")}>
          {views.map((view) => (
            <li key={view.id}>
              <button type="button" className="c4-btn" onClick={() => {
                setTray(view.tray);
                setQuery(view.query);
                setClerkFilter(view.clerk);
                setShelfFilter(view.shelf);
                setCipherFilter(view.cipher);
                setPaceFilter(view.pace);
                setLeafFilter(view.leaf);
                setSpanFilter(view.span);
                setWaitFilter(view.wait);
              }}>{view.name}</button>
              <button type="button" className="c4-btn" disabled={viewer} onClick={() => {
                const next = dropSlipView(views, view.id);
                setViews(next);
                writeJson(SLIP_VIEW_KEY, next);
              }}>{v4("idxDropView")}</button>
            </li>
          ))}
        </ul>
      </form>
      <div className="c4-row">
        <button type="button" className="c4-btn" onClick={() => setPicked(shown.map((card) => card.id))}>{v4("idxPickAll")}</button>
        <button type="button" className="c4-btn" onClick={() => setPicked([])}>{v4("idxPickNone")}</button>
        <span className="c4-meta">{v4("idxPicked")} · {picked.length}</span>
        <select className="c4-field" aria-label={v4("idxBulkShelf")} value={moveShelf} disabled={viewer} onChange={(event) => setMoveShelf(event.target.value)}>
          {SHELVES.map((item) => <option key={item} value={item}>{shelfName(v4, item)}</option>)}
        </select>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkSlipShelf(cards, picked, moveShelf))}>{v4("idxBulkShelf")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkSlipPin(cards, picked, true))}>{v4("idxBulkPin")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkSlipFile(cards, picked, true))}>{v4("idxBulkFile")}</button>
        <button type="button" className="c4-btn" onClick={() => download("index-slips.csv", slipsCsv(cards, desk))}>{v4("idxCsv")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(resetSlips())}>{v4("idxReset")}</button>
      </div>
      {board === "timeline" ? (
        <ol className="c4-idx-timeline" aria-label={v4("idxTimeline")}>
          {timeline.map((card) => <li key={card.id} data-leaf={card.leaf}>{card.leaf} · {card.title}</li>)}
          {!timeline.length && <li className="c4-empty-gold">{v4("idxEmpty")}</li>}
        </ol>
      ) : (
        <ul className="c4-idx-cards">
          {shown.map((card) => {
            const openEdit = editing === card.id;
            return (
              <li key={card.id} data-shelf={card.shelf || "blank"} data-pace={card.pace || "blank"} data-pinned={card.pinned ? "1" : "0"} data-late={lateSlip(card, desk) ? "1" : "0"} data-soon={soonSlip(card) ? "1" : "0"} data-home={homeCipher(card.cipher) ? "1" : "0"}>
                <label className="c4-row">
                  <input type="checkbox" checked={picked.includes(card.id)} aria-label={card.title} onChange={(event) => setPicked((ids) => event.target.checked ? [...ids, card.id] : ids.filter((id) => id !== card.id))} />
                  {openEdit ? (
                    <input className="c4-field" aria-label={v4("idxEdit")} value={draft} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                  ) : <strong>{card.title}</strong>}
                </label>
                <p className="c4-meta">{card.clerk || v4("idxBlankClerk")} · {card.leaf ?? v4("idxBlankLeaf")} · {shelfName(v4, card.shelf)} · {card.cipher || v4("idxBlankCipher")} · {paceName(v4, card.pace)} · {spanName(v4, card.span)} · {waitName(v4, card.wait)}</p>
                {openEdit ? (
                  <input className="c4-field" aria-label={v4("idxNote")} value={noteDraft} disabled={viewer} onChange={(event) => setNoteDraft(event.target.value)} />
                ) : card.note && <p>{card.note}</p>}
                <p className="c4-meta">{gapLabel(v4, card.leaf, desk)} {auditName(v4, card.audit)}</p>
                <div className="c4-row">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSlipPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("idxUnpin") : v4("idxPin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSlipHold(cards, card.id, !card.held))}>{card.held ? v4("idxLift") : v4("idxHold")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSlipFile(cards, card.id, !card.filed))}>{card.filed ? v4("idxReopen") : v4("idxFile")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cyclePace(cards, card.id))}>{v4("idxPaceUp")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => {
                    if (openEdit) {
                      store(editSlipNote(editSlip(cards, card.id, draft), card.id, noteDraft));
                      setEditing("");
                      return;
                    }
                    setEditing(card.id);
                    setDraft(card.title);
                    setNoteDraft(card.note);
                  }}>{openEdit ? v4("idxAdd") : v4("idxEdit")}</button>
                  <button type="button" className="c4-btn" onClick={() => {
                    void navigator.clipboard?.writeText(slipCopy(card));
                    setCopied(card.id);
                  }}>{copied === card.id ? v4("idxCopied") : v4("idxCopy")}</button>
                </div>
              </li>
            );
          })}
          {!shown.length && <li className="c4-empty-gold">{v4("idxEmpty")}</li>}
        </ul>
      )}
      <p className="c4-meta">{v4("idxRules")}</p>
    </section>
  );
}

export function MailHalls({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [band, setBand] = useState("all");
  const [parity, setParity] = useState("all");
  const [shape, setShape] = useState<HallShape>("all");
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
    note: { email: user.email ?? null },
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
    const present = presentHouses(rows);
    const ids = rows.map((row) => row.id);
    const nextHidden = readHiddenHouses(readJson(HALL_KEY, []), present);
    const nextReviewed = readReviewedHouses(readJson(HALL_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(HALL_KEY, nextHidden);
    writeJson(HALL_REVIEW_KEY, nextReviewed);
  }, [rows]);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey || typingTarget(event)) return;
      if (event.key === "n" || event.key === "N") {
        event.preventDefault();
        searchRef.current?.focus();
        return;
      }
      if (event.key !== "/") return;
      event.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const present = presentHouses(rows);
  const bandOn = activeHouseBand(band, present);
  const parityOn = activeHouseParity(parity);
  const bands = visibleHouseBands(present, hidden, showHidden);
  const shown = visibleHouseCustomers(rows, houseBandArg(bandOn), houseParityArg(parityOn), query, review, reviewed, shape).filter((row) => {
    const state = houseState(row.note);
    if (state === "") return bandOn === "all" && !showHidden;
    const token = state === "set" ? houseBand(row.note) : "blank";
    return bands.includes(token);
  });
  const lead = leadingHouse(rows);
  const leadParity = leadingHouseParity(rows);
  const shared = sharedHouseCount(rows);
  const setCount = rows.filter((row) => houseState(row.note) === "set").length;
  return (
    <section className="c4-mhl" aria-label={v4("mhlTitle")} data-halls="1" data-role={role}>
      <header className="c4-mhl-mast">
        <div>
          <p className="c4-mhl-kicker">{v4("mhlSub")}</p>
          <h2 className="c4-title">{v4("mhlTitle")}</h2>
        </div>
        <p className="c4-mhl-plate" data-logo="mono">{v4("mhlLogo")}</p>
      </header>
      <p className="c4-mhl-rules">{v4("mhlHint")}</p>
      <p className="c4-meta">{v4("mhlKept")} {v4("mhlEscape")}</p>
      {viewer && <p className="c4-mhl-notice">{v4("mhlViewer")}</p>}
      {data.error && <p className="c4-empty-gold">{v4("mhlFailed")}</p>}
      {data.loading && <p className="c4-meta">{v4("mhlLoading")}</p>}
      {!data.loading && !rows.length && <p className="c4-empty-gold">{v4("mhlNone")}</p>}
      <dl className="c4-idx-kpi" aria-label={v4("mhlSetNotice")}>
        <div><dt>{v4("mhlCustomers")}</dt><dd>{rows.length}</dd></div>
        <div><dt>{v4("mhlSetNotice")}</dt><dd>{setCount}</dd></div>
        <div><dt>{v4("mhlShare")}</dt><dd>{houseShare(setCount, rows.length)}%</dd></div>
        <div><dt>{v4("mhlShared")}</dt><dd>{shared}</dd></div>
        <div><dt>{v4("mhlLeadBand")}</dt><dd>{lead ? bandName(v4, lead) : v4("mhlUnmarked")}</dd></div>
        <div><dt>{v4("mhlLeadParity")}</dt><dd>{leadParity ? parityName(v4, leadParity) : v4("mhlUnmarked")}</dd></div>
        <div><dt>{v4("mhlCatalog")}</dt><dd>{catalogHouseCount(rows)}</dd></div>
        <div><dt>{v4("mhlWide")}</dt><dd>{wideHouseCount(rows)}</dd></div>
        <div><dt>{v4("mhlEven")}</dt><dd>{evenHouseCount(rows)}</dd></div>
      </dl>
      <div className="c4-idx-chart" aria-label={v4("mhlShapes")}>
        {BANDS.map((item) => {
          const count = rows.filter((row) => houseBand(row.note) === item).length;
          return (
            <div key={item} className="c4-idx-col" data-on={bandOn === item ? "1" : "0"}>
              <div className="c4-idx-track"><i style={{ height: `${houseShare(count, rows.length) || (count ? 8 : 0)}%` }} /></div>
              <button type="button" className="c4-btn" onClick={() => setBand(item)}>{bandName(v4, item)} · {count}</button>
            </div>
          );
        })}
      </div>
      <div className="c4-row">
        <label className="c4-lab"><span>{v4("mhlSearch")}</span>
          <input ref={searchRef} className="c4-field" aria-label={v4("mhlSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            setQuery("");
          }} />
        </label>
        <label className="c4-lab"><span>{v4("mhlAllBands")}</span>
          <select className="c4-field" aria-label={v4("mhlAllBands")} value={bandOn} onChange={(event) => setBand(event.target.value)}>
            <option value="all">{v4("mhlAllBands")}</option>
            <option value="blank">{v4("mhlClear")}</option>
            {present.filter((item) => item !== "blank").map((item) => <option key={item} value={item}>{bandName(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("mhlAllParities")}</span>
          <select className="c4-field" aria-label={v4("mhlAllParities")} value={parityOn} onChange={(event) => setParity(event.target.value)}>
            <option value="all">{v4("mhlAllParities")}</option>
            {["even", "odd"].map((item) => <option key={item} value={item}>{parityName(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("mhlAllShapes")}</span>
          <select className="c4-field" aria-label={v4("mhlAllShapes")} value={shape} onChange={(event) => setShape(event.target.value as HallShape)}>
            <option value="all">{v4("mhlAllShapes")}</option>
            <option value="catalog">{v4("mhlCatalogOnly")}</option>
            <option value="wide">{v4("mhlWideOnly")}</option>
            <option value="even">{v4("mhlEvenOnly")}</option>
          </select>
        </label>
        <button type="button" className="c4-chip" data-on={review === "open" ? "1" : "0"} onClick={() => setReview((item) => item === "open" ? "all" : "open")}>{v4("mhlOpenMarks")}</button>
        <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} onClick={() => setReview((item) => item === "reviewed" ? "all" : "reviewed")}>{v4("mhlReviewed")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((on) => !on)}>{showHidden ? v4("mhlHidden") : v4("mhlShow")}</button>
      </div>
      <ul className="c4-mhl-bands" aria-label={v4("mhlHide")}>
        {present.map((item) => (
          <li key={item}>
            <button type="button" className="c4-btn" data-on={hidden.includes(item) ? "1" : "0"} disabled={viewer} onClick={() => {
              const next = toggleHouse(hidden, item, present);
              setHidden(next);
              writeJson(HALL_KEY, next);
            }}>{hidden.includes(item) ? v4("mhlShow") : v4("mhlHide")} · {bandName(v4, item)}</button>
          </li>
        ))}
      </ul>
      <div className="c4-row">
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => {
          const next = bulkHouseReview(reviewed, shown.map((row) => row.id), rows.map((row) => row.id), true);
          setReviewed(next);
          writeJson(HALL_REVIEW_KEY, next);
        }}>{v4("mhlBulkReview")}</button>
        <button type="button" className="c4-btn" onClick={() => download("mail-halls.csv", housesCsv(rows))}>{v4("mhlCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("mail-hall-rows.csv", houseRowsCsv(shown, reviewed))}>{v4("mhlRowCsv")}</button>
        <span className="c4-meta">{v4("mhlShown")} · {shown.length}</span>
      </div>
      <ul className="c4-mhl-rows" aria-label={v4("mhlBoard")}>
        {shown.map((row) => {
          const code = houseCopy(row.note);
          const seen = reviewed.includes(row.id);
          const catalog = catalogHouse(row.note);
          const wide = wideHouse(row.note);
          const even = evenHouse(row.note);
          return (
            <li key={row.id} data-band={houseBand(row.note) || "blank"} data-reviewed={seen ? "1" : "0"} data-catalog={catalog ? "1" : "0"} data-wide={wide ? "1" : "0"} data-even={even ? "1" : "0"}>
              <Link href={crmv4Href(base, `customers/${row.id}`)}>{row.label}</Link>
              <p className="c4-meta">{code || (houseState(row.note) === "clear" ? v4("mhlClear") : v4("mhlUnmarked"))} · {bandName(v4, houseBand(row.note) || (houseState(row.note) === "clear" ? "blank" : ""))} · {parityName(v4, houseParity(row.note))}</p>
              <div className="c4-row">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => {
                  const next = toggleHouseReview(reviewed, row.id, rows.map((item) => item.id));
                  setReviewed(next);
                  writeJson(HALL_REVIEW_KEY, next);
                }}>{seen ? v4("mhlReviewed") : v4("mhlReview")}</button>
                <button type="button" className="c4-btn" disabled={!code} onClick={() => {
                  void navigator.clipboard?.writeText(code);
                  setCopied(row.id);
                }}>{copied === row.id ? v4("mhlCopied") : v4("mhlCopy")}</button>
              </div>
            </li>
          );
        })}
        {!shown.length && <li className="c4-empty-gold">{v4("mhlEmpty")}</li>}
      </ul>
      <p className="c4-meta">{v4("mhlUnreviewed")} · {rows.filter((row) => !reviewed.includes(row.id)).length} · {v4("mhlRules")}</p>
    </section>
  );
}
