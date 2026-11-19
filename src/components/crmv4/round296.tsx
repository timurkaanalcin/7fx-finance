"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  TRIQUETRUM_SPANS,
  TQT_DENSITY_KEY,
  TQT_KEY,
  TQT_VIEW_KEY,
  UNP_KEY,
  UNP_REVIEW_KEY,
  addTriquetrum,
  addTriquetrumTag,
  addTriquetrumView,
  briskTriquetrum,
  bulkTriquetrumCoffer,
  bulkTriquetrumGilt,
  bulkTriquetrumSight,
  bulkTriquetrumTag,
  bulkUsernameReview,
  busiestRuleSighter,
  cycleInk,
  dropTriquetrumView,
  editTriquetrum,
  editTriquetrumNote,
  fairRuleSighter,
  idleTriquetrum,
  inkFocused,
  innerSpan,
  laneUsernameCount,
  lateTriquetrum,
  leadingUsername,
  leadingUsernameHue,
  liftNotchFocused,
  lowerNotchFocused,
  lowerPegFocused,
  moveTriquetrumFocus,
  outerSpan,
  overdueTriquetrum,
  presentUsernameLanes,
  raisePegFocused,
  readHiddenUsername,
  readReviewedUsername,
  readTriquetrumViews,
  readTriquetrums,
  reminderTriquetrums,
  restingTriquetrum,
  setTriquetrumCoffer,
  setTriquetrumInk,
  setTriquetrumSighted,
  setTriquetrumSleeve,
  setTriquetrumStar,
  sightTriquetrumFocused,
  sleeveTriquetrumFocused,
  sortTriquetrums,
  starTriquetrumFocused,
  suggestNotch,
  suggestSpan,
  suggestTriquetrumInk,
  tagTriquetrumFocused,
  toggleUsername,
  toggleUsernameReview,
  triquetrumBars,
  triquetrumCopy,
  triquetrumCounts,
  triquetrumCsv,
  triquetrumDensity,
  triquetrumSighters,
  triquetrumTimeline,
  usernameCopy,
  usernameDigit,
  usernameEven,
  usernameFirst,
  usernameGlyph,
  usernameHeld,
  usernameHue,
  usernameKnot,
  usernameLane,
  usernameLanes,
  usernameLanesCsv,
  usernameLength,
  usernameLetter,
  usernameLower,
  usernameMark,
  usernameMixed,
  usernameOpen,
  usernameRowsCsv,
  usernameScroll,
  usernameShare,
  usernameSoon,
  usernameSpace,
  usernameStamp,
  usernameTail,
  usernameUpper,
  usernameVowel,
  visibleTriquetrums,
  visibleUsername,
  visibleUsernameLanes,
  type Triquetrum,
  type TriquetrumDensity,
  type TriquetrumSort,
  type TriquetrumTray,
  type TriquetrumView,
  type UsernameReview,
  type UsernameRow,
  type UsernameShape,
  type UsernameValue,
} from "@/lib/crmv4/round296";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const INKS = ["DRY", "WASH", "GILT"] as const;
const NOTCHES = ["6", "12", "24"] as const;
const PEGS = ["2", "6", "9"] as const;
const SPAN_KEY: Record<string, CrmV4CopyKey> = {
  base: "tqtBase",
  joint: "tqtJoint",
  sight: "tqtSight",
  crown: "tqtCrown",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "tqtAuditSave",
  edit: "tqtAuditEdit",
  note: "tqtAuditNote",
  ink: "tqtAuditInk",
  sight: "tqtAuditSight",
  unsight: "tqtAuditUnsight",
  sleeve: "tqtAuditSleeve",
  resume: "tqtAuditResume",
  coffer: "tqtAuditCoffer",
  open: "tqtAuditOpen",
  tag: "tqtAuditTag",
  peg: "tqtAuditPeg",
  notch: "tqtAuditNotch",
  lower: "tqtAuditLower",
  star: "tqtAuditStar",
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
  const target = event.target;
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
}

function textField(raw: unknown): string {
  return String(raw ?? "").replace(/\s+/g, " ").trim();
}

function separationLabel(v4: V4, span: string): string {
  const key = SPAN_KEY[span];
  return key ? v4(key) : v4("tqtBlankSpan");
}

function inkLabel(v4: V4, ink: string): string {
  if (ink === "DRY") return v4("tqtDry");
  if (ink === "WASH") return v4("tqtWash");
  if (ink === "GILT") return v4("tqtGilt");
  return v4("tqtAll");
}

export function TriquetrumRules({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Triquetrum[]>([]);
  const [views, setViews] = useState<TriquetrumView[]>([]);
  const [density, setDensity] = useState<TriquetrumDensity>("wide");
  const [tray, setTray] = useState<TriquetrumTray>("rule");
  const [query, setQuery] = useState("");
  const [readerFilter, setReaderFilter] = useState("");
  const [glassFilter, setGlassFilter] = useState("all");
  const [separationFilter, setSeparationFilter] = useState("all");
  const [secondFilter, setSecondFilter] = useState("all");
  const [slideFilter, setSlideFilter] = useState("all");
  const [sort, setSort] = useState<TriquetrumSort>("span");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [sighter, setReader] = useState("");
  const [span, setSeparation] = useState("");
  const [ink, setGlass] = useState("");
  const [secondNo, setSecondNo] = useState("");
  const [slideNo, setSlideNo] = useState("");
  const [tags, setTags] = useState("");
  const [viewName, setViewName] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [focusAt, setFocusAt] = useState(0);
  const [desk, setDesk] = useState("base");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readTriquetrums(readJson(TQT_KEY, [])));
    setViews(readTriquetrumViews(readJson(TQT_VIEW_KEY, [])));
    setDensity(triquetrumDensity(readJson(TQT_DENSITY_KEY, "wide")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Triquetrum[]) {
    setCards(next);
    writeJson(TQT_KEY, next);
  }
  function storeViews(next: TriquetrumView[]) {
    setViews(next);
    writeJson(TQT_VIEW_KEY, next);
  }
  function storeDensity(next: TriquetrumDensity) {
    setDensity(next);
    writeJson(TQT_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortTriquetrums(visibleTriquetrums(cards, tray, query, readerFilter, glassFilter, separationFilter, secondFilter, slideFilter), sort),
    [cards, tray, query, readerFilter, glassFilter, separationFilter, secondFilter, slideFilter, sort],
  );
  const counts = triquetrumCounts(cards, shown, desk);
  const bars = triquetrumBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = triquetrumTimeline(cards);
  const readers = triquetrumSighters(cards);
  const ids = shown.map((card) => card.id);
  const suggested = suggestTriquetrumInk(cards);
  const fair = fairRuleSighter(cards, readers.join(","));
  const busy = busiestRuleSighter(cards);
  const reminders = reminderTriquetrums(cards);
  const secondHint = suggestNotch(cards, clock);
  const separationHint = suggestSpan(clock);
  const focused = shown[focusAt];

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setTitle("");
        setNote("");
        setReader("");
        setSeparation("");
        setGlass("");
        setSecondNo("");
        setSlideNo("");
        setTags("");
        return;
      }
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocusAt((index) => moveTriquetrumFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocusAt((index) => moveTriquetrumFocus(index, shown.length, -1));
        return;
      }
      if (viewer) return;
      const id = shown[focusAt]?.id || "";
      if (event.key === "q" || event.key === "Q") {
        event.preventDefault();
        store(liftNotchFocused(cards, id));
        return;
      }
      if (event.key === "v" || event.key === "V") {
        event.preventDefault();
        store(setTriquetrumCoffer(cards, id, !shown[focusAt]?.coffered));
        return;
      }
      if (event.key === "g" || event.key === "G") {
        event.preventDefault();
        store(inkFocused(cards, id));
        return;
      }
      if (event.key === "l" || event.key === "L") {
        event.preventDefault();
        store(sleeveTriquetrumFocused(cards, id));
        return;
      }
      if (event.key === "n" || event.key === "N") {
        event.preventDefault();
        store(sightTriquetrumFocused(cards, id));
        return;
      }
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("triquetrum-rules.csv", triquetrumCsv(shown, desk));
        return;
      }
      if (event.key === "s" || event.key === "S") {
        event.preventDefault();
        store(starTriquetrumFocused(cards, id));
        return;
      }
      if (event.key === "u" || event.key === "U") {
        event.preventDefault();
        store(raisePegFocused(cards, id));
        return;
      }
      if (event.key === "y" || event.key === "Y") {
        event.preventDefault();
        store(lowerPegFocused(cards, id));
        return;
      }
      if (event.key === "f" || event.key === "F") {
        event.preventDefault();
        store(lowerNotchFocused(cards, id));
        return;
      }
      if (event.key !== "/") return;
      event.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cards, desk, focusAt, shown, viewer]);

  return (
    <section className="c4-triquetrum" aria-label={v4("tqtTitle")} data-cards="1" data-desk={tray} data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-triquetrum-mast">
        <p className="c4-triquetrum-seal" data-logo="mono">{v4("tqtLogo")}</p>
        <div>
          <p className="c4-triquetrum-kicker">{v4("tqtSub")}</p>
          <h2 className="c4-title">{v4("tqtTitle")}</h2>
        </div>
        <ol className="c4-triquetrum-index" aria-label={v4("tqtTitle")}>
          <li data-tone="gold">{v4("tqtGilt")}</li>
          <li data-tone="ink">{v4("tqtWash")}</li>
          <li data-tone="ivory">{v4("tqtDry")}</li>
        </ol>
      </header>
      <p className="c4-triquetrum-links">
        <Link href={crmv4Href(base, "unp")}>{v4("unpTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("tqtCustomers")}</Link>
        <Link href={crmv4Href(base, "orderstatus")}>{v4("ogColonnadeKicker")}</Link>
      </p>
      <p className="c4-triquetrum-hint">{v4("tqtHint")}</p>
      {viewer && <p className="c4-triquetrum-note">{v4("tqtViewer")}</p>}
      {counts.overdue > 0 && <p className="c4-triquetrum-notice" role="status">{v4("tqtOverdue")} {counts.overdue}</p>}
      <ol className="c4-triquetrum-dials" aria-label={v4("tqtChart")}>
        <li><span>{v4("tqtRule")}</span><strong>{counts.rule}</strong></li>
        <li><span>{v4("tqtSleeve")}</span><strong>{counts.sleeve}</strong></li>
        <li><span>{v4("tqtCoffer")}</span><strong>{counts.coffer}</strong></li>
        <li><span>{v4("tqtOverdue")}</span><strong>{counts.overdue}</strong></li>
        <li><span>{v4("tqtIdle")}</span><strong>{counts.idle}</strong></li>
        <li><span>{v4("tqtBrisk")}</span><strong>{counts.brisk}</strong></li>
        <li><span>{v4("tqtFair")}</span><strong>{fair || "·"}</strong></li>
        <li><span>{v4("tqtBusy")}</span><strong>{busy || "·"}</strong></li>
      </ol>
      <div className="c4-triquetrum-chart" aria-label={v4("tqtChart")}>
        {bars.map((bar) => (
          <button key={bar.span} type="button" className="c4-triquetrum-column" data-on={separationFilter === bar.span ? "1" : "0"} data-span={bar.span} onClick={() => setSeparationFilter(separationFilter === bar.span ? "all" : bar.span)}>
            <i style={{ height: `${Math.max(8, Math.round((bar.count / peak) * 100))}%` }} />
            <strong>{bar.count}</strong>
            <span>{separationLabel(v4, bar.span)}</span>
          </button>
        ))}
      </div>
      <div className="c4-triquetrum-tools">
        <input ref={searchRef} className="c4-field c4-triquetrum-search" aria-label={v4("tqtSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("tqtSearch")} />
        {(["rule", "sleeve", "coffer"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{v4(item === "rule" ? "tqtRule" : item === "sleeve" ? "tqtSleeve" : "tqtCoffer")}</button>
        ))}
        {(["all", "inner", "outer", ...TRIQUETRUM_SPANS] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={separationFilter === item ? "1" : "0"} onClick={() => setSeparationFilter(item)}>{item === "all" ? v4("tqtAll") : item === "inner" ? v4("tqtInner") : item === "outer" ? v4("tqtOuter") : separationLabel(v4, item)}</button>
        ))}
        {["all", ...INKS].map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={glassFilter === item ? "1" : "0"} onClick={() => setGlassFilter(item)}>{item === "all" ? v4("tqtInk") : inkLabel(v4, item)}</button>
        ))}
        {["all", ...NOTCHES].map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={secondFilter === item ? "1" : "0"} onClick={() => setSecondFilter(item)}>{item === "all" ? v4("tqtNotch") : item}</button>
        ))}
        {["all", ...PEGS].map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={slideFilter === item ? "1" : "0"} onClick={() => setSlideFilter(item)}>{item === "all" ? v4("tqtPeg") : item}</button>
        ))}
        <button type="button" className="c4-chip" data-on={sort === "sighter" ? "1" : "0"} onClick={() => setSort(sort === "span" ? "sighter" : "span")}>{sort === "span" ? v4("tqtSortSpan") : v4("tqtSortSighter")}</button>
        <button type="button" className="c4-chip" data-on={density === "narrow" ? "1" : "0"} onClick={() => storeDensity(density === "wide" ? "narrow" : "wide")}>{density === "wide" ? v4("tqtWide") : v4("tqtNarrow")}</button>
        <button type="button" className="c4-btn" onClick={() => download("triquetrum-rules.csv", triquetrumCsv(shown, desk))}>{v4("tqtCsv")}</button>
      </div>
      <div className="c4-triquetrum-tools" role="group" aria-label={v4("tqtDesk")}>
        {TRIQUETRUM_SPANS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={desk === item ? "1" : "0"} onClick={() => setDesk(item)}>{v4("tqtDesk")} {separationLabel(v4, item)}</button>
        ))}
        <span className="c4-triquetrum-meta">{v4("tqtSuggest")} {inkLabel(v4, suggested)} · {secondHint} · {separationLabel(v4, separationHint)}</span>
      </div>
      <form className="c4-triquetrum-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addTriquetrum(cards, { title, note, sighter, span, ink: ink || suggested, notch: secondNo, peg: slideNo, tags });
        if (next.length === cards.length) return;
        store(next);
        setTitle("");
        setNote("");
        setTags("");
      }}>
        <input className="c4-field" aria-label={v4("tqtEdit")} aria-required={false} value={title} disabled={viewer} onChange={(event) => setTitle(event.target.value)} placeholder={v4("tqtTitle")} />
        <input className="c4-field" aria-label={v4("tqtNote")} aria-required={false} value={note} disabled={viewer} onChange={(event) => setNote(event.target.value)} placeholder={v4("tqtNote")} />
        <input className="c4-field" aria-label={v4("tqtSighter")} aria-required={false} value={sighter} disabled={viewer} onChange={(event) => setReader(event.target.value)} placeholder={v4("tqtSighter")} />
        <select className="c4-select" aria-label={v4("tqtDesk")} value={span} disabled={viewer} onChange={(event) => setSeparation(event.target.value)}>
          <option value="">{v4("tqtBlankSpan")}</option>
          {TRIQUETRUM_SPANS.map((item) => <option key={item} value={item}>{separationLabel(v4, item)}</option>)}
        </select>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("tqtAdd")}</button>
      </form>
      <form className="c4-triquetrum-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addTriquetrumView(views, { id: `v${Date.now().toString(36)}`, name: viewName, tray, query, sighter: readerFilter, ink: glassFilter, span: separationFilter, notch: secondFilter, peg: slideFilter });
        if (next.length === views.length) return;
        storeViews(next);
        setViewName("");
      }}>
        <input className="c4-field" aria-label={v4("tqtViewName")} aria-required={false} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} placeholder={v4("tqtViewName")} />
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("tqtSaveView")}</button>
      </form>
      <ul className="c4-triquetrum-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setTray(view.tray); setQuery(view.query); setReaderFilter(view.sighter); setGlassFilter(view.ink); setSeparationFilter(view.span); setSecondFilter(view.notch); setSlideFilter(view.peg); }}>{v4("tqtApply")} {view.name}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropTriquetrumView(views, view.id))}>{v4("tqtDrop")}</button>
          </li>
        ))}
      </ul>
      {picked.length > 0 && (
        <div className="c4-triquetrum-tools">
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkTriquetrumGilt(cards, picked))}>{v4("tqtBulkGilt")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkTriquetrumSight(cards, picked))}>{v4("tqtBulkSight")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkTriquetrumCoffer(cards, picked))}>{v4("tqtBulkCoffer")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkTriquetrumTag(cards, picked))}>{v4("tqtBulkTag")}</button>
        </div>
      )}
      <p className="c4-triquetrum-meta">{v4("tqtKeys")} · j k n l g v s f q u y x /</p>
      {timeline.length > 0 && (
        <ol className="c4-triquetrum-time" aria-label={v4("tqtTimeline")}>
          {timeline.map((lane) => (
            <li key={lane.notch}><span>{v4("tqtNotch")} {lane.notch}</span><strong>{lane.titles.join(" · ")}</strong></li>
          ))}
        </ol>
      )}
      {reminders.length > 0 && <p className="c4-triquetrum-meta">{v4("tqtRemind")} {reminders.join(" · ")}</p>}
      {!shown.length && <p className="c4-triquetrum-empty">{v4("tqtEmpty")}</p>}
      <ol className="c4-triquetrum-board">
        {shown.map((card, index) => {
          const on = index === focusAt;
          return (
            <li key={card.id} className="c4-triquetrum-card" data-on={on ? "1" : "0"} data-overdue={overdueTriquetrum(card) ? "1" : "0"} data-idle={idleTriquetrum(card) ? "1" : "0"} data-brisk={briskTriquetrum(card) ? "1" : "0"} data-resting={restingTriquetrum(card) ? "1" : "0"} data-late={lateTriquetrum(card, desk) ? "1" : "0"} data-outer={outerSpan(card.span) ? "1" : "0"} data-inner={innerSpan(card.span) ? "1" : "0"} data-star={card.flagged ? "1" : "0"}>
              <label className="c4-triquetrum-pick"><input type="checkbox" checked={picked.includes(card.id)} aria-label={card.title} onChange={() => setPicked((current) => (current.includes(card.id) ? current.filter((item) => item !== card.id) : [...current, card.id]))} /></label>
              <div>
                {on && !viewer ? (
                  <input className="c4-field" aria-label={v4("tqtEdit")} aria-required={false} value={card.title} onChange={(event) => store(editTriquetrum(cards, card.id, event.target.value))} />
                ) : (
                  <strong>{card.title}</strong>
                )}
                <p className="c4-triquetrum-meta">{card.sighter || v4("tqtSighter")} · {separationLabel(v4, card.span)} · {inkLabel(v4, card.ink)} · {card.notch ?? "·"} · {v4("tqtPeg")} {card.peg}{card.tags.length ? ` · ${card.tags.join("")}` : ""}{card.audit ? ` · ${AUDIT_KEY[card.audit] ? v4(AUDIT_KEY[card.audit]) : card.audit}` : ""}</p>
                {on && !viewer ? (
                  <input className="c4-field" aria-label={v4("tqtNote")} aria-required={false} value={card.note} onChange={(event) => store(editTriquetrumNote(cards, card.id, event.target.value))} />
                ) : (
                  card.note && <p className="c4-triquetrum-meta">{card.note}</p>
                )}
                <div className="c4-triquetrum-tools">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setTriquetrumSighted(cards, card.id, !card.sighted))}>{card.sighted ? v4("tqtUnsight") : v4("tqtSight")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setTriquetrumSleeve(cards, card.id, !card.sleeved))}>{card.sleeved ? v4("tqtUnsleeve") : v4("tqtSleeveIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setTriquetrumCoffer(cards, card.id, !card.coffered))}>{card.coffered ? v4("tqtUncoffer") : v4("tqtCofferIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setTriquetrumStar(cards, card.id, !card.flagged))}>{card.flagged ? v4("tqtUnstar") : v4("tqtStar")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setTriquetrumInk(cards, card.id, cycleInk(card.ink)))}>{v4("tqtInk")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(liftNotchFocused(cards, card.id))}>{v4("tqtLift")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerNotchFocused(cards, card.id))}>{v4("tqtLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raisePegFocused(cards, card.id))}>{v4("tqtPeg")}+</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerPegFocused(cards, card.id))}>{v4("tqtPeg")}−</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addTriquetrumTag(cards, card.id, "a"))}>{v4("tqtTag")} a</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(tagTriquetrumFocused(cards, card.id))}>{v4("tqtTag")}</button>
                  <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(triquetrumCopy(card)); }}>{v4("tqtCopy")}</button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <p className="c4-triquetrum-meta">{v4("tqtMatched")} {counts.matched} · {ids.length}</p>
    </section>
  );
}

const NAME_SHAPES: UsernameShape[] = ["all", "glyph", "stem", "knot", "braid", "scroll", "plain", "open", "soon", "digit", "letter", "mixed", "upper", "lower", "space", "even", "odd", "vowel", "tail", "mark", "first", "held"];

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  glyph: "unpGlyph",
  stem: "unpStem",
  knot: "unpKnot",
  braid: "unpBraid",
  scroll: "unpScroll",
  plain: "unpPlain",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  ivory: "unpIvory",
  graphite: "unpGraphite",
  champagne: "unpChampagne",
};

const SHAPE_KEY: Record<UsernameShape, CrmV4CopyKey> = {
  all: "unpShapeAll",
  glyph: "unpShapeGlyph",
  stem: "unpShapeStem",
  knot: "unpShapeKnot",
  braid: "unpShapeBraid",
  scroll: "unpShapeScroll",
  plain: "unpShapePlain",
  open: "unpShapeOpen",
  soon: "unpShapeSoon",
  digit: "unpShapeDigit",
  letter: "unpShapeLetter",
  mixed: "unpShapeMixed",
  upper: "unpShapeUpper",
  lower: "unpShapeLower",
  space: "unpShapeSpace",
  even: "unpShapeEven",
  odd: "unpShapeOdd",
  vowel: "unpShapeVowel",
  tail: "unpShapeTail",
  mark: "unpShapeMark",
  first: "unpShapeFirst",
  held: "unpShapeHeld",
};

function laneLabel(v4: V4, lane: string): string {
  const key = LANE_KEY[lane];
  return key ? v4(key) : v4("unpUnmarked");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("unpUnmarked");
}

type NameRow = { id?: string; name?: string | null; username?: string | null };

export function UsernamePlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: NameRow[] }>("/api/admin/users?take=24&meta=0&role=TRADER");
  const [lane, setLane] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<UsernameShape>("all");
  const [review, setReview] = useState<UsernameReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [focusAt, setFocusAt] = useState(0);
  const [copied, setCopied] = useState("");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";

  useEffect(() => {
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  const rows = useMemo<UsernameRow[]>(() => {
    return (queue.data?.users || []).map((row, index) => ({
      id: textField(row.id) || `c${index}`,
      label: textField(row.name),
      handle: { username: textField(row.username) } satisfies UsernameValue,
    }));
  }, [queue.data]);

  useEffect(() => {
    const ids = rows.map((row) => row.id);
    setHidden(readHiddenUsername(readJson(UNP_KEY, []), presentUsernameLanes(rows)));
    setReviewed(readReviewedUsername(readJson(UNP_REVIEW_KEY, []), ids));
  }, [rows]);

  function storeHidden(next: string[]) {
    setHidden(next);
    writeJson(UNP_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(UNP_REVIEW_KEY, next);
  }

  const lanes = visibleUsernameLanes(presentUsernameLanes(rows), hidden, showHidden);
  const shown = visibleUsername(rows, lane, hue, query, review, reviewed, shape).filter((row) => !hidden.includes(usernameLane(row.handle)) || showHidden);
  const bars = usernameLanes(rows);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const lead = leadingUsername(rows);
  const leadHue = leadingUsernameHue(rows);
  const soon = rows.filter((row) => usernameSoon(row.handle)).length;

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocusAt((index) => moveTriquetrumFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocusAt((index) => moveTriquetrumFocus(index, shown.length, -1));
        return;
      }
      if (event.key === "m" || event.key === "M") {
        event.preventDefault();
        if (viewer) return;
        const id = shown[focusAt]?.id;
        if (id) storeReviewed(toggleUsernameReview(reviewed, id));
        return;
      }
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("username-rows.csv", usernameRowsCsv(rows, reviewed));
        return;
      }
      if (event.key !== "/") return;
      event.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focusAt, reviewed, rows, shown, viewer]);

  return (
    <section className="c4-username" aria-label={v4("unpTitle")} data-plates="1" data-names={rows.length} data-role={role}>
      <header className="c4-username-mast">
        <p className="c4-username-seal" data-logo="mono">{v4("unpLogo")}</p>
        <div>
          <p className="c4-username-kicker">{v4("unpSub")}</p>
          <h2 className="c4-title">{v4("unpTitle")}</h2>
        </div>
      </header>
      <ol className="c4-username-index" aria-label={v4("unpTitle")}>
        <li data-tone="gold">{v4("unpGlyph")}</li>
        <li data-tone="ink">{v4("unpKnot")}</li>
        <li data-tone="ivory">{v4("unpStem")}</li>
        <li data-tone="mist">{v4("unpPlain")}</li>
        <li data-tone="line">{v4("unpScroll")}</li>
      </ol>
      <p className="c4-username-links">
        <Link href={crmv4Href(base, "tqt")}>{v4("tqtTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("tqtCustomers")}</Link>
        <Link href={crmv4Href(base, "scratchpad")}>{v4("npGalleryKicker")}</Link>
      </p>
      <p className="c4-username-hint">{v4("unpHint")}</p>
      {viewer && <p className="c4-username-note">{v4("unpViewer")}</p>}
      {soon > 0 && <p className="c4-username-notice" role="status">{v4("unpSoon")} {soon}</p>}
      {queue.loading && <p className="c4-username-meta">{v4("unpEmpty")}</p>}
      {queue.error && <p className="c4-username-meta">{queue.error}</p>}
      <ul className="c4-username-kpis" aria-label={v4("unpRules")}>
        <li><span>{v4("unpLead")}</span><strong>{lead ? laneLabel(v4, lead) : v4("unpUnmarked")}</strong></li>
        <li><span>{v4("unpToneLead")}</span><strong>{leadHue ? hueLabel(v4, leadHue) : v4("unpUnmarked")}</strong></li>
        <li><span>{v4("unpGlyph")}</span><strong>{laneUsernameCount(rows, "glyph")}</strong></li>
        <li><span>{v4("unpScroll")}</span><strong>{laneUsernameCount(rows, "scroll")}</strong></li>
        <li><span>{v4("unpShare")}</span><strong>{usernameShare(laneUsernameCount(rows, "glyph"), Math.max(1, rows.length))}%</strong></li>
        <li><span>{v4("unpOpen")}</span><strong>{rows.filter((row) => usernameOpen(row.handle)).length}</strong></li>
        <li><span>{v4("unpHeld")}</span><strong>{rows.filter((row) => usernameHeld(row.handle)).length}</strong></li>
        <li><span>{v4("unpKnot")}</span><strong>{rows.filter((row) => usernameKnot(row.handle)).length}</strong></li>
      </ul>
      <div className="c4-username-chart" aria-label={v4("unpRules")}>
        {bars.map((bar) => (
          <button key={bar.lane} type="button" className="c4-username-column" data-on={lane === bar.lane ? "1" : "0"} data-lane={bar.lane} onClick={() => setLane(lane === bar.lane ? "all" : bar.lane)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / maxBar) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{laneLabel(v4, bar.lane)}</span>
          </button>
        ))}
      </div>
      <div className="c4-username-tools">
        <input ref={searchRef} className="c4-field c4-username-search" aria-label={v4("unpSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("unpSearch")} />
        {(["all", "ivory", "graphite", "champagne"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hue === item ? "1" : "0"} onClick={() => setHue(item)}>{item === "all" ? v4("unpAll") : hueLabel(v4, item)}</button>
        ))}
        {NAME_SHAPES.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={shape === item ? "1" : "0"} onClick={() => setShape(item)}>{v4(SHAPE_KEY[item])}</button>
        ))}
        {(["all", "reviewed", "fresh"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={review === item ? "1" : "0"} onClick={() => setReview(item)}>{item === "all" ? v4("unpAll") : item === "reviewed" ? v4("unpReviewed") : v4("unpFresh")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((value) => !value)}>{v4("unpShow")}</button>
        <button type="button" className="c4-btn" onClick={() => download("username-lanes.csv", usernameLanesCsv(rows))}>{v4("unpCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("username-rows.csv", usernameRowsCsv(rows, reviewed))}>{v4("unpRowCsv")}</button>
      </div>
      <ul className="c4-username-lanes">
        {lanes.map((item) => (
          <li key={item}>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeHidden(toggleUsername(hidden, item))}>{hidden.includes(item) ? v4("unpShow") : v4("unpHide")} {laneLabel(v4, item)}</button>
          </li>
        ))}
      </ul>
      {picked.length > 0 && (
        <div className="c4-username-tools">
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkUsernameReview(reviewed, picked, true))}>{v4("unpBulkReview")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkUsernameReview(reviewed, picked, false))}>{v4("unpBulkClear")}</button>
        </div>
      )}
      {!shown.length && <p className="c4-username-empty">{v4("unpEmpty")}</p>}
      <ol className="c4-username-board">
        {shown.map((row, index) => {
          const seen = reviewed.includes(row.id);
          const length = usernameLength(row.handle);
          return (
            <li key={row.id} className="c4-username-card" data-on={index === focusAt ? "1" : "0"} data-lane={usernameLane(row.handle)} data-hue={usernameHue(row.handle)} data-reviewed={seen ? "1" : "0"} data-glyph={usernameGlyph(row.handle) ? "1" : "0"} data-scroll={usernameScroll(row.handle) ? "1" : "0"} data-knot={usernameKnot(row.handle) ? "1" : "0"} data-soon={usernameSoon(row.handle) ? "1" : "0"}>
              <p className="c4-username-stamp">{usernameStamp(row.handle) || "·"}</p>
              <label className="c4-username-pick"><input type="checkbox" checked={picked.includes(row.id)} aria-label={row.label || row.id} onChange={() => setPicked((current) => (current.includes(row.id) ? current.filter((item) => item !== row.id) : [...current, row.id]))} /></label>
              <div>
                <strong>{row.label || v4("unpUnmarked")}</strong>
                <p className="c4-username-meta">{laneLabel(v4, usernameLane(row.handle))} · {hueLabel(v4, usernameHue(row.handle))}{length !== null ? ` · ${length}` : ""}{usernameDigit(row.handle) ? ` · ${v4("unpDigit")}` : ""}{usernameLetter(row.handle) ? ` · ${v4("unpLetter")}` : ""}{usernameMixed(row.handle) ? ` · ${v4("unpMixed")}` : ""}{usernameUpper(row.handle) ? ` · ${v4("unpUpper")}` : ""}{usernameLower(row.handle) ? ` · ${v4("unpLower")}` : ""}{usernameEven(row.handle) ? ` · ${v4("unpEven")}` : ""}{usernameVowel(row.handle) ? ` · ${v4("unpVowel")}` : ""}{usernameFirst(row.handle) ? ` · ${v4("unpFirst")}` : ""}{usernameTail(row.handle) ? ` · ${v4("unpTail")}` : ""}{usernameMark(row.handle) ? ` · ${v4("unpMark")}` : ""}{usernameSpace(row.handle) ? ` · ${v4("unpSpace")}` : ""}{usernameHeld(row.handle) ? ` · ${v4("unpHeld")}` : ""}{usernameSoon(row.handle) ? ` · ${v4("unpSoon")}` : ""}{usernameOpen(row.handle) ? ` · ${v4("unpOpen")}` : ""}</p>
                <div className="c4-username-tools">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleUsernameReview(reviewed, row.id))}>{seen ? v4("unpReviewed") : v4("unpReview")}</button>
                  <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(usernameCopy(row.handle)); setCopied(row.id); }}>{copied === row.id ? v4("unpCopied") : v4("unpCopy")}</button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
