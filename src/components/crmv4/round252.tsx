"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  ACR_KEY,
  ACR_REVIEW_KEY,
  CHR_DENSITY_KEY,
  CHR_KEY,
  CHR_VIEW_KEY,
  CHOIR_VERSES,
  addCardTag,
  addCardView,
  addChoirCard,
  bulkCrestReview,
  bulkCardPresto,
  bulkCardPin,
  bulkCardFile,
  bulkCardWax,
  bulkCardTag,
  busiestSinger,
  crestBound,
  crestCopy,
  crestHue,
  crestJoin,
  crestLane,
  crestLanes,
  crestLanesCsv,
  crestNotch,
  crestRowsCsv,
  crestShare,
  crestStamp,
  crestState,
  crestStep,
  crestWide,
  clashVerseCount,
  cycleTempo,
  dropCardView,
  editCard,
  editCardNote,
  fairSinger,
  starFocusedCard,
  waitFocusedCard,
  houseCloth,
  hueCrestCount,
  idleCard,
  idleCards,
  laneCrestCount,
  lateCard,
  leadingCrest,
  leadingCrestHue,
  cardBars,
  cardCopy,
  cardCounts,
  cardCsv,
  cardDensity,
  cardSingers,
  cardShare,
  cardTimeline,
  lengthenFocusedCard,
  lengthenBar,
  lowerFocusedCard,
  lowerMeasure,
  moveCardFocus,
  neighborCardCount,
  overdueCard,
  tempoFocusedCard,
  peakVerse,
  pinFocusedCard,
  presentCrestLanes,
  quietVerse,
  raiseFocusedCard,
  raiseMeasure,
  readHiddenCrests,
  readCardViews,
  readChoirCards,
  readReviewedCrests,
  reminderCards,
  restingCard,
  rushCard,
  setCardStar,
  setCardWait,
  setCardCloth,
  setCardPin,
  setCardFile,
  sharedCrestCount,
  shortenFocusedCard,
  shortenBar,
  sortCards,
  suggestCloth,
  suggestBar,
  tagFocusedCard,
  toggleCrest,
  toggleCrestReview,
  visibleCrestLanes,
  visibleCrests,
  visibleCards,
  type CrestReview,
  type CrestRow,
  type CrestShape,
  type CrestValue,
  type CardDensity,
  type CardSort,
  type CardTray,
  type CardView,
  type ChoirCard,
} from "@/lib/crmv4/round252";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const INKS = ["linen", "gilt", "wax"] as const;
const PACES = ["largo", "andante", "presto"] as const;
const MARGINS = ["6", "12", "18"] as const;
const QUIRES = ["2", "4", "8", "16"] as const;

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "chrAuditSave",
  edit: "chrAuditEdit",
  note: "chrAuditNote",
  pace: "chrAuditPace",
  pin: "chrAuditPin",
  unpin: "chrAuditUnpin",
  hold: "chrAuditWait",
  resume: "chrAuditResume",
  shelve: "chrAuditFile",
  open: "chrAuditOpen",
  ink: "chrAuditCloth",
  tag: "chrAuditTag",
  quire: "chrAuditMeasure",
  margin: "chrAuditBar",
  short: "chrAuditShort",
  flag: "chrAuditStar",
};

const FOLIO_KEY: Record<string, CrmV4CopyKey> = {
  intro: "chrIntro",
  stanza: "chrStanza",
  chorus: "chrChorus",
  bridge: "chrBridge",
  outro: "chrOutro",
  coda: "chrCoda",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  house: "acrHouse",
  bench: "acrBench",
  duo: "acrDuo",
  link: "acrLink",
  brief: "acrBrief",
  long: "acrLong",
  plain: "acrPlain",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  ivory: "acrIvory",
  graphite: "acrGraphite",
  champagne: "acrChampagne",
  ink: "acrClothHue",
  vellum: "acrVellum",
  ash: "acrAsh",
  bronze: "acrBronze",
};

type TraderRow = {
  id?: string;
  name?: string | null;
  assigneeName?: string | null;
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
  return key ? v4(key) : v4("chrBlank");
}

function inkLabel(v4: V4, ink: string): string {
  if (ink === "LINEN" || ink === "linen") return v4("chrLinen");
  if (ink === "GILT" || ink === "gilt") return v4("chrGilt");
  if (ink === "WAX" || ink === "wax") return v4("chrWax");
  return v4("chrBlankCloth");
}

function paceLabel(v4: V4, pace: string): string {
  if (pace === "largo") return v4("chrLargo");
  if (pace === "andante") return v4("chrAndante");
  if (pace === "presto") return v4("chrPresto");
  return v4("chrBlankPace");
}

function laneLabel(v4: V4, lane: string): string {
  const key = LANE_KEY[lane];
  return key ? v4(key) : v4("acrUnmarked");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("acrUnmarked");
}

export function ChoirCards({ base, v4 }: { base: string; v4: V4 }) {
  const [leaves, setLeaves] = useState<ChoirCard[]>([]);
  const [views, setViews] = useState<CardView[]>([]);
  const [density, setDensity] = useState<CardDensity>("airy");
  const [sort, setSort] = useState<CardSort>("folio");
  const [tray, setTray] = useState<CardTray>("open");
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
  const [desk, setDesk] = useState("stanza");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [reader, setReader] = useState("");
  const [folio, setFolio] = useState("");
  const [ink, setInk] = useState("");
  const [pace, setPace] = useState("");
  const [marginMin, setMarginMin] = useState("");
  const [quire, setQuire] = useState("2");
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
    setLeaves(readChoirCards(readJson(CHR_KEY, [])));
    setViews(readCardViews(readJson(CHR_VIEW_KEY, [])));
    setDensity(cardDensity(readJson(CHR_DENSITY_KEY, "airy")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);
  const shown = sortCards(visibleCards(leaves, tray, query, readerFilter, inkFilter, paceFilter, folioFilter, marginFilter, quireFilter, houseOnly, peakOnly, quietOnly), sort);
  const focusAt = shown.length ? focus % shown.length : 0;
  const counts = cardCounts(leaves, shown, desk);
  const timeline = cardTimeline(leaves);
  const reminders = reminderCards(leaves);
  const idling = idleCards(leaves);
  const readers = cardSingers(leaves);
  const bars = cardBars(leaves);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const ids = shown.map((leaf) => leaf.id);
  const busy = busiestSinger(leaves);
  function store(next: ChoirCard[]) {
    const saved = readChoirCards(next);
    setLeaves(saved);
    writeJson(CHR_KEY, saved);
  }
  function storeViews(next: CardView[]) {
    const saved = readCardViews(next);
    setViews(saved);
    writeJson(CHR_VIEW_KEY, saved);
  }
  function storeDensity(next: CardDensity) {
    setDensity(next);
    writeJson(CHR_DENSITY_KEY, next);
  }
  function togglePick(id: string) {
    setPicked((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }
  function applyView(view: CardView) {
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
        setFocus((index) => moveCardFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => moveCardFocus(index, shown.length, -1));
        return;
      }
      if (event.key === "h" || event.key === "H") {
        event.preventDefault();
        if (!viewer) store(waitFocusedCard(leaves, ids, focusAt));
        return;
      }
      if (event.key === "p" || event.key === "P") {
        event.preventDefault();
        if (!viewer) store(pinFocusedCard(leaves, ids, focusAt));
        return;
      }
      if (event.key === "f" || event.key === "F") {
        event.preventDefault();
        if (!viewer) store(tempoFocusedCard(leaves, ids, focusAt));
        return;
      }
      if (event.key === "s" || event.key === "S") {
        event.preventDefault();
        if (!viewer) store(lengthenFocusedCard(leaves, ids, focusAt));
        return;
      }
      if (event.key === "u" || event.key === "U") {
        event.preventDefault();
        if (!viewer) store(shortenFocusedCard(leaves, ids, focusAt));
        return;
      }
      if (event.key === "t" || event.key === "T") {
        event.preventDefault();
        if (!viewer) store(tagFocusedCard(leaves, ids, focusAt, "a"));
        return;
      }
      if (event.key === "w" || event.key === "W") {
        event.preventDefault();
        if (!viewer) store(starFocusedCard(leaves, ids, focusAt));
        return;
      }
      if (event.key === "b" || event.key === "B") {
        event.preventDefault();
        if (!viewer) store(raiseFocusedCard(leaves, ids, focusAt));
        return;
      }
      if (event.key === "n" || event.key === "N") {
        event.preventDefault();
        if (!viewer) store(lowerFocusedCard(leaves, ids, focusAt));
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
    <section className="c4-chr" aria-label={v4("chrTitle")} data-cards="1" data-desk="choir" data-role={role} data-density={density} data-board={board}>
      <header className="c4-chr-mast">
        <p className="c4-chr-seal" data-logo="mono">{v4("chrLogo")}</p>
        <div>
          <p className="c4-chr-kicker">{v4("chrSub")}</p>
          <h2 className="c4-title">{v4("chrTitle")}</h2>
        </div>
        <ol className="c4-chr-index" aria-label={v4("chrTitle")}>
          <li data-tone="gold">{v4("chrChampagne")}</li>
          <li data-tone="ink">{v4("chrGraphite")}</li>
          <li data-tone="ivory">{v4("chrIvory")}</li>
        </ol>
      </header>
      <p className="c4-chr-links">
        <Link href={crmv4Href(base, "acr")}>{v4("chrCameos")}</Link>
        <Link href={crmv4Href(base, "dense")}>{v4("chrCompare")}</Link>
        <Link href={crmv4Href(base, "folders")}>{v4("chrVip")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("chrCustomers")}</Link>
      </p>
      {viewer && <p className="c4-chr-note">{v4("chrViewer")}</p>}
      <p className="c4-chr-lead">{v4("chrKeys")}</p>
      <ul className="c4-chr-kpis" aria-label={v4("chrChart")}>
        <li><span>{v4("chrOpen")}</span><strong>{counts.open}</strong></li>
        <li><span>{v4("chrWaiting")}</span><strong>{counts.held}</strong></li>
        <li><span>{v4("chrFiled")}</span><strong>{counts.shelved}</strong></li>
        <li><span>{v4("chrPinned")}</span><strong>{counts.pinned}</strong></li>
        <li><span>{v4("chrOverdue")}</span><strong>{counts.overdue}</strong></li>
        <li><span>{v4("chrPeak")}</span><strong>{counts.peak}</strong></li>
        <li><span>{v4("chrQuiet")}</span><strong>{counts.quiet}</strong></li>
        <li><span>{v4("chrHouse")}</span><strong>{cardShare(counts.house, Math.max(1, counts.open))}%</strong></li>
        <li><span>{v4("chrIdle")}</span><strong>{counts.idle}</strong></li>
        <li><span>{v4("chrRush")}</span><strong>{counts.rush}</strong></li>
        <li><span>{v4("chrResting")}</span><strong>{counts.resting}</strong></li>
        <li><span>{v4("chrSoon")}</span><strong>{counts.soon}</strong></li>
        <li><span>{v4("chrMatched")}</span><strong>{counts.matched}</strong></li>
        <li><span>{v4("chrClash")}</span><strong>{clashVerseCount(leaves) || v4("chrClashNone")}</strong></li>
        <li><span>{v4("chrNeighbor")}</span><strong>{neighborCardCount(leaves)}</strong></li>
        <li><span>{v4("chrBusiest")}</span><strong>{busy || v4("chrBusiestNone")}</strong></li>
      </ul>
      <div className="c4-chr-bars" aria-label={v4("chrChart")}>
        {bars.map((bar) => (
          <div key={bar.folio} className="c4-chr-bar" data-folio={bar.folio}>
            <span>{folioLabel(v4, bar.folio)}</span>
            <i style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} />
            <strong>{bar.count}</strong>
          </div>
        ))}
      </div>
      {board === "index" && (
        <ol className="c4-chr-time" aria-label={v4("chrTimeline")}>
          {timeline.map((lane) => (
            <li key={lane.quire}><span>{v4("chrMeasure")} {lane.quire}</span><strong>{lane.titles.join(" · ")}</strong></li>
          ))}
          {!timeline.length && <li>{v4("chrEmpty")}</li>}
        </ol>
      )}
      <form className="c4-chr-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        store(addChoirCard(leaves, { id: `chr-${Date.now().toString(36)}`, title, note, reader, folio, ink, pace, margin: marginMin, quire, tags }));
        setTitle("");
        setNote("");
        setTags("");
        titleRef.current?.focus();
      }}>
        <label className="c4-lab"><span>{v4("chrTitleField")}</span><input ref={titleRef} className="c4-field" aria-label={v4("chrTitleField")} value={title} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("chrNote")}</span><input className="c4-field" aria-label={v4("chrNote")} aria-required={false} value={note} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("chrSinger")}</span><input className="c4-field" aria-label={v4("chrSinger")} aria-required={false} value={reader} disabled={viewer} onChange={(event) => setReader(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("chrVerse")}</span>
          <select className="c4-select" aria-label={v4("chrVerse")} value={folio} disabled={viewer} onChange={(event) => setFolio(event.target.value)}>
            <option value="">{v4("chrBlank")}</option>
            {CHOIR_VERSES.map((item) => <option key={item} value={item}>{folioLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("chrCloth")}</span>
          <select className="c4-select" aria-label={v4("chrCloth")} value={ink} disabled={viewer} onChange={(event) => setInk(event.target.value)}>
            <option value="">{v4("chrBlankCloth")}</option>
            {INKS.map((item) => <option key={item} value={item}>{inkLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("chrPace")}</span>
          <select className="c4-select" aria-label={v4("chrPace")} value={pace} disabled={viewer} onChange={(event) => setPace(event.target.value)}>
            <option value="">{v4("chrBlankPace")}</option>
            {PACES.map((item) => <option key={item} value={item}>{paceLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("chrBar")}</span>
          <select className="c4-select" aria-label={v4("chrBar")} value={marginMin} disabled={viewer} onChange={(event) => setMarginMin(event.target.value)}>
            <option value="">{v4("chrBlankBar")}</option>
            {MARGINS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("chrMeasure")}</span>
          <select className="c4-select" aria-label={v4("chrMeasure")} value={quire} disabled={viewer} onChange={(event) => setQuire(event.target.value)}>
            {QUIRES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("chrTags")}</span><input className="c4-field" aria-label={v4("chrTags")} value={tags} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button className="c4-btn" type="submit" disabled={viewer}>{v4("chrAdd")}</button>
        <button className="c4-btn" type="button" disabled={viewer} onClick={() => setReader(fairSinger(leaves, reader || "Ada, Bea, Cem"))}>{v4("chrAssign")}</button>
        <button className="c4-btn" type="button" disabled={viewer} onClick={() => setInk(suggestCloth(leaves).toLowerCase())}>{v4("chrSuggestCloth")}</button>
        <button className="c4-btn" type="button" disabled={viewer} onClick={() => setMarginMin(String(suggestBar(leaves, new Date().getHours())))}>{v4("chrSuggestBar")}</button>
      </form>
      <div className="c4-chr-tools">
        <label className="c4-lab"><span>{v4("chrSearch")}</span><input ref={searchRef} className="c4-field c4-chr-search" aria-label={v4("chrSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <label className="c4-lab"><span>{v4("chrDesk")}</span>
          <select className="c4-select" aria-label={v4("chrDesk")} value={desk} onChange={(event) => setDesk(event.target.value)}>
            {CHOIR_VERSES.map((item) => <option key={item} value={item}>{folioLabel(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("chrSinger")}</span>
          <select className="c4-select" aria-label={v4("chrSinger")} value={readerFilter} onChange={(event) => setReaderFilter(event.target.value)}>
            <option value="all">{v4("chrAll")}</option>
            {readers.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <button type="button" className="c4-btn" onClick={() => download("choir-cards.csv", cardCsv(shown, desk))}>{v4("chrCsv")}</button>
        <button type="button" className="c4-btn" aria-pressed={density === "tight"} onClick={() => storeDensity(density === "airy" ? "tight" : "airy")}>{density === "airy" ? v4("chrDensityTight") : v4("chrDensityAiry")}</button>
        <button type="button" className="c4-btn" onClick={() => setSort(sort === "folio" ? "reader" : "folio")}>{sort === "folio" ? v4("chrSortSinger") : v4("chrSortVerse")}</button>
        <button type="button" className="c4-btn" onClick={() => setBoard(board === "hall" ? "index" : "hall")}>{board === "hall" ? v4("chrBoardIndex") : v4("chrBoardHall")}</button>
      </div>
      <div className="c4-chr-tools" role="group" aria-label={v4("chrAll")}>
        {(["open", "held", "shelved"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{item === "open" ? v4("chrOpen") : item === "held" ? v4("chrWaiting") : v4("chrFiled")}</button>
        ))}
        {INKS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={inkFilter === item ? "1" : "0"} onClick={() => setInkFilter(inkFilter === item ? "all" : item)}>{inkLabel(v4, item)}</button>
        ))}
        {PACES.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={paceFilter === item ? "1" : "0"} onClick={() => setPaceFilter(paceFilter === item ? "all" : item)}>{paceLabel(v4, item)}</button>
        ))}
        <button type="button" className="c4-chip" data-on={folioFilter === "peak" ? "1" : "0"} onClick={() => setFolioFilter(folioFilter === "peak" ? "all" : "peak")}>{v4("chrPeakOnly")}</button>
        <button type="button" className="c4-chip" data-on={folioFilter === "quiet" ? "1" : "0"} onClick={() => setFolioFilter(folioFilter === "quiet" ? "all" : "quiet")}>{v4("chrQuietOnly")}</button>
        <button type="button" className="c4-chip" data-on={houseOnly ? "1" : "0"} onClick={() => setHouseOnly((value) => !value)}>{v4("chrHouseOnly")}</button>
        <button type="button" className="c4-chip" data-on={peakOnly ? "1" : "0"} onClick={() => setPeakOnly((value) => !value)}>{v4("chrPeak")}</button>
        <button type="button" className="c4-chip" data-on={quietOnly ? "1" : "0"} onClick={() => setQuietOnly((value) => !value)}>{v4("chrQuiet")}</button>
        {MARGINS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={marginFilter === item ? "1" : "0"} onClick={() => setMarginFilter(marginFilter === item ? "all" : item)}>{item}</button>
        ))}
        {QUIRES.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={quireFilter === item ? "1" : "0"} onClick={() => setQuireFilter(quireFilter === item ? "all" : item)}>{v4("chrMeasure")} {item}</button>
        ))}
      </div>
      <form className="c4-chr-tools" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        storeViews(addCardView(views, {
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
        <label className="c4-lab"><span>{v4("chrViewName")}</span><input className="c4-field" aria-label={v4("chrViewName")} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} /></label>
        <button className="c4-btn" type="submit" disabled={viewer}>{v4("chrSaveView")}</button>
        {views.map((view) => (
          <span key={view.id} className="c4-chr-view">
            <button type="button" className="c4-btn" onClick={() => applyView(view)}>{v4("chrApply")} {view.name}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropCardView(views, view.id))}>{v4("chrDropView")}</button>
          </span>
        ))}
      </form>
      {picked.length > 0 && (
        <div className="c4-chr-tools">
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkCardPin(leaves, picked))}>{v4("chrBulkPin")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkCardFile(leaves, picked))}>{v4("chrBulkFile")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkCardPresto(leaves, picked))}>{v4("chrBulkPresto")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkCardWax(leaves, picked))}>{v4("chrBulkWax")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkCardTag(leaves, picked, "b"))}>{v4("chrBulkTag")}</button>
        </div>
      )}
      {(reminders.length > 0 || idling.length > 0) && (
        <p className="c4-chr-meta">{v4("chrDue")} {reminders.map((leaf) => leaf.title).join(" · ")} · {v4("chrIdle")} {idling.map((leaf) => leaf.title).join(" · ")}</p>
      )}
      {!shown.length && <p className="c4-chr-empty">{v4("chrEmpty")}</p>}
      <ol className="c4-chr-board" data-density={density}>
        {shown.map((leaf, index) => (
          <li key={leaf.id} className="c4-chr-card" data-on={index === focusAt ? "1" : "0"} data-pinned={leaf.pinned ? "1" : "0"} data-overdue={overdueCard(leaf) ? "1" : "0"} data-peak={peakVerse(leaf.folio) ? "1" : "0"} data-quiet={quietVerse(leaf.folio) ? "1" : "0"} data-house={houseCloth(leaf.ink) ? "1" : "0"} data-rush={rushCard(leaf) ? "1" : "0"} data-idle={idleCard(leaf) ? "1" : "0"} data-resting={restingCard(leaf) ? "1" : "0"} data-late={lateCard(leaf, desk) ? "1" : "0"}>
            <label className="c4-chr-pick"><input type="checkbox" checked={picked.includes(leaf.id)} aria-label={leaf.title} onChange={() => togglePick(leaf.id)} /></label>
            <div>
              <input className="c4-field" aria-label={v4("chrEdit")} value={leaf.title} disabled={viewer} onChange={(event) => store(editCard(leaves, leaf.id, event.target.value))} />
              <input className="c4-field" aria-label={v4("chrEditNote")} aria-required={false} value={leaf.note} disabled={viewer} onChange={(event) => store(editCardNote(leaves, leaf.id, event.target.value))} />
              <p className="c4-chr-meta">{leaf.reader || v4("chrBlankSinger")} · {folioLabel(v4, leaf.folio)} · {inkLabel(v4, leaf.ink)} · {paceLabel(v4, leaf.pace)} · {leaf.margin ?? v4("chrBlankBar")} · {v4("chrMeasure")} {leaf.quire} · {leaf.tags.join(" ") || v4("chrTags")}</p>
              <p className="c4-chr-meta">{folioLabel(v4, desk)} · {AUDIT_KEY[leaf.audit] ? v4(AUDIT_KEY[leaf.audit]) : v4("chrAuditSave")}</p>
              <div className="c4-chr-tools">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCardPin(leaves, leaf.id, !leaf.pinned))}>{leaf.pinned ? v4("chrUnpin") : v4("chrPin")}</button>
                <button type="button" className="c4-btn" disabled={viewer || leaf.shelved} onClick={() => store(setCardWait(leaves, leaf.id, !leaf.held))}>{leaf.held ? v4("chrResume") : v4("chrWait")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCardFile(leaves, leaf.id, !leaf.shelved))}>{leaf.shelved ? v4("chrOpen") : v4("chrFile")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCardStar(leaves, leaf.id, !leaf.flagged))}>{leaf.flagged ? v4("chrUnstar") : v4("chrStar")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cycleTempo(leaves, leaf.id))}>{v4("chrPace")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lengthenBar(leaves, leaf.id))}>{v4("chrLengthen")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(shortenBar(leaves, leaf.id))}>{v4("chrShorten")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseMeasure(leaves, leaf.id))}>{v4("chrRaise")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerMeasure(leaves, leaf.id))}>{v4("chrLower")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCardCloth(leaves, leaf.id, leaf.ink === "WAX" ? "linen" : "wax"))}>{v4("chrCloth")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addCardTag(leaves, leaf.id, "a"))}>{v4("chrTag")}</button>
                <button type="button" className="c4-btn" onClick={() => { const body = cardCopy(leaf); void navigator.clipboard.writeText(body).catch(() => undefined); setCopied(leaf.id); }}>{copied === leaf.id ? v4("chrCopied") : v4("chrCopy")}</button>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function markNote(row: TraderRow): CrestValue {
  return { assigneeName: textField(row.assigneeName) };
}

export function AssignCrests({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: TraderRow[] }>("/api/admin/users?take=24&meta=0&role=TRADER");
  const [query, setQuery] = useState("");
  const [lane, setLane] = useState("all");
  const [hue, setHue] = useState("all");
  const [review, setReview] = useState<CrestReview>("all");
  const [shape, setShape] = useState<CrestShape>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [copied, setCopied] = useState("");
  const [focus, setFocus] = useState(0);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = useMemo<CrestRow[]>(() => (queue.data?.users || []).map((row, index) => ({
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
    const present = presentCrestLanes(rows);
    const ids = rows.map((row) => row.id);
    const nextHidden = readHiddenCrests(readJson(ACR_KEY, []), present);
    const nextReviewed = readReviewedCrests(readJson(ACR_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(ACR_KEY, nextHidden);
    writeJson(ACR_REVIEW_KEY, nextReviewed);
  }, [rows]);
  const present = presentCrestLanes(rows);
  const lanes = visibleCrestLanes(present, hidden, showHidden);
  const shown = visibleCrests(rows, lane, hue, query, review, reviewed, shape).filter((row) => {
    const token = crestLane(row.note);
    if (!token) return true;
    return showHidden || !hidden.includes(token);
  });
  const focusAt = shown.length ? focus % shown.length : 0;
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocus((index) => moveCardFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => moveCardFocus(index, shown.length, -1));
        return;
      }
      if (event.key === "r" || event.key === "R") {
        event.preventDefault();
        if (viewer) return;
        const row = shown[focusAt];
        if (!row) return;
        const next = toggleCrestReview(reviewed, row.id);
        setReviewed(next);
        writeJson(ACR_REVIEW_KEY, next);
        return;
      }
      if (event.key === "m" || event.key === "M") {
        event.preventDefault();
        setShowHidden((value) => !value);
        return;
      }
      if (event.key === "g" || event.key === "G") {
        event.preventDefault();
        const order: CrestShape[] = ["all", "house", "bench", "duo", "link", "brief", "long", "wide", "notch"];
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
  const lead = leadingCrest(rows);
  const hueLead = leadingCrestHue(rows);
  const shared = sharedCrestCount(rows);
  const bound = rows.filter((row) => crestBound(row.note)).length;
  const bars = crestLanes(rows);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const ids = shown.map((row) => row.id);
  const known = rows.filter((row) => crestState(row.note) === "set").length;
  function storeHidden(next: string[]) {
    setHidden(next);
    writeJson(ACR_KEY, next);
  }
  function storeReviewed(next: string[]) {
    const saved = readReviewedCrests(next, rows.map((row) => row.id));
    setReviewed(saved);
    writeJson(ACR_REVIEW_KEY, saved);
  }
  return (
    <section className="c4-acr" aria-label={v4("acrTitle")} data-crests="1" data-desk="crest" data-traders={queue.data?.users?.length ? "1" : "0"} data-role={role}>
      <header className="c4-acr-mast">
        <p className="c4-acr-seal" data-logo="mono">{v4("acrLogo")}</p>
        <div>
          <p className="c4-acr-kicker">{v4("acrSub")}</p>
          <h2 className="c4-title">{v4("acrTitle")}</h2>
        </div>
        <ol className="c4-acr-index" aria-label={v4("acrTitle")}>
          <li data-tone="gold">{v4("acrChampagne")}</li>
          <li data-tone="ink">{v4("acrGraphite")}</li>
          <li data-tone="ivory">{v4("acrIvory")}</li>
        </ol>
      </header>
      <p className="c4-acr-links">
        <Link href={crmv4Href(base, "chr")}>{v4("acrCards")}</Link>
        <Link href={crmv4Href(base, "dense")}>{v4("chrCompare")}</Link>
        <Link href={crmv4Href(base, "folders")}>{v4("chrVip")}</Link>
      </p>
      {viewer && <p className="c4-acr-note">{v4("acrViewer")}</p>}
      <p className="c4-acr-lead">{v4("acrHint")}</p>
      <ul className="c4-acr-kpis" aria-label={v4("acrRules")}>
        <li><span>{v4("acrSet")}</span><strong>{known}</strong></li>
        <li><span>{v4("acrClear")}</span><strong>{rows.filter((row) => crestState(row.note) === "clear").length}</strong></li>
        <li><span>{v4("acrPlain")}</span><strong>{laneCrestCount(rows, "plain")}</strong></li>
        <li><span>{v4("acrHouse")}</span><strong>{laneCrestCount(rows, "house")}</strong></li>
        <li><span>{v4("acrBench")}</span><strong>{laneCrestCount(rows, "bench")}</strong></li>
        <li><span>{v4("acrDuo")}</span><strong>{laneCrestCount(rows, "duo")}</strong></li>
        <li><span>{v4("acrLink")}</span><strong>{laneCrestCount(rows, "link")}</strong></li>
        <li><span>{v4("acrBrief")}</span><strong>{laneCrestCount(rows, "brief")}</strong></li>
        <li><span>{v4("acrLong")}</span><strong>{laneCrestCount(rows, "long")}</strong></li>
        <li><span>{v4("acrWide")}</span><strong>{rows.filter((row) => crestWide(row.note)).length}</strong></li>
        <li><span>{v4("acrNotch")}</span><strong>{rows.filter((row) => crestNotch(row.note)).length}</strong></li>
        <li><span>{v4("acrJoin")}</span><strong>{rows.filter((row) => crestJoin(row.note)).length}</strong></li>
        <li><span>{v4("acrShare")}</span><strong>{crestShare(bound, Math.max(1, known))}%</strong></li>
        <li><span>{v4("acrShared")}</span><strong>{shared}</strong></li>
        <li><span>{v4("acrClothHue")}</span><strong>{hueCrestCount(rows, "ink")}</strong></li>
      </ul>
      <div className="c4-acr-bars" aria-label={v4("acrLead")}>
        {bars.map((bar) => (
          <div key={bar.lane} className="c4-acr-bar" data-lane={bar.lane}>
            <span>{laneLabel(v4, bar.lane)}</span>
            <i style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} />
            <strong>{bar.count}</strong>
          </div>
        ))}
      </div>
      <p className="c4-acr-meta">{lead ? `${v4("acrLead")} ${laneLabel(v4, lead)}` : v4("acrEmpty")} · {hueLead ? `${v4("acrToneLead")} ${hueLabel(v4, hueLead)}` : v4("acrUnmarked")}</p>
      <div className="c4-acr-tools">
        <label className="c4-lab"><span>{v4("acrSearch")}</span><input ref={searchRef} className="c4-field c4-acr-search" aria-label={v4("acrSearch")} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <button type="button" className="c4-btn" onClick={() => download("assign-crests.csv", crestLanesCsv(rows))}>{v4("acrCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("assign-crest-rows.csv", crestRowsCsv(rows, reviewed))}>{v4("acrRowCsv")}</button>
        <button type="button" className="c4-btn" aria-pressed={showHidden} onClick={() => setShowHidden((value) => !value)}>{v4("acrShow")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkCrestReview(reviewed, ids, true))}>{v4("acrBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkCrestReview(reviewed, ids, false))}>{v4("acrBulkClear")}</button>
      </div>
      <div className="c4-acr-tools" role="group" aria-label={v4("acrAll")}>
        <button type="button" className="c4-chip" data-on={lane === "all" ? "1" : "0"} onClick={() => setLane("all")}>{v4("acrAll")}</button>
        {lanes.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={lane === item ? "1" : "0"} onClick={() => setLane(item)}>{laneLabel(v4, item)}</button>
        ))}
        {(["all", "ivory", "graphite", "champagne", "ink", "vellum", "ash", "bronze"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("acrAll") : hueLabel(v4, item)}</button>
        ))}
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{item === "all" ? v4("acrAll") : item === "reviewed" ? v4("acrReviewed") : v4("acrUnreviewed")}</button>
        ))}
        {(["all", "house", "bench", "duo", "link", "brief", "long", "wide", "notch"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>
            {item === "all" ? v4("acrShapeAll") : item === "house" ? v4("acrHouse") : item === "bench" ? v4("acrBench") : item === "duo" ? v4("acrDuo") : item === "link" ? v4("acrLink") : item === "brief" ? v4("acrBrief") : item === "long" ? v4("acrLong") : item === "wide" ? v4("acrWide") : v4("acrNotch")}
          </button>
        ))}
      </div>
      {!shown.length && <p className="c4-acr-empty">{v4("acrEmpty")}</p>}
      <ol className="c4-acr-board">
        {shown.map((row, index) => {
          const current = crestLane(row.note);
          const hueName = crestHue(row.note);
          return (
            <li key={row.id} className="c4-acr-card" data-on={index === focusAt ? "1" : "0"} data-lane={current || "blank"} data-reviewed={reviewed.includes(row.id) ? "1" : "0"} data-wide={crestWide(row.note) ? "1" : "0"} data-join={crestJoin(row.note) ? "1" : "0"} data-notch={crestNotch(row.note) ? "1" : "0"} data-bound={crestBound(row.note) ? "1" : "0"}>
              <strong>{row.label || v4("acrClear")}</strong>
              <p className="c4-acr-meta">{v4("acrCode")} {crestStamp(row.note) || v4("acrUnmarked")} · {laneLabel(v4, current)} · {hueLabel(v4, hueName)} · {v4("acrStep")} {crestStep(row.note)}</p>
              <div className="c4-acr-tools">
                <button type="button" className="c4-btn" disabled={viewer || !current} onClick={() => storeHidden(toggleCrest(hidden, current))}>{hidden.includes(current) ? v4("acrShow") : v4("acrHide")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleCrestReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("acrReviewed") : v4("acrReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { const body = crestCopy(row.note); void navigator.clipboard.writeText(body).catch(() => undefined); setCopied(row.id); }}>{copied === row.id ? v4("acrCopied") : v4("acrCopy")}</button>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
