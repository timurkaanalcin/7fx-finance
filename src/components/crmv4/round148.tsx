"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  COURTESY_KEY,
  QUIRE_KEY,
  QUIRE_VIEW_KEY,
  activeDay,
  activeInitial,
  activeRank,
  activeRibbon,
  activeScribe,
  activeShelf,
  activeTitle,
  activeWeight,
  addQuire,
  addQuireView,
  bulkQuireFiled,
  bulkQuireStarred,
  courtesyCsv,
  courtesyShare,
  dayArg,
  dayBand,
  dayCounts,
  dayGap,
  dayKind,
  dropQuireView,
  editQuire,
  initialArg,
  initialLines,
  leadingRank,
  leadingTitle,
  namedInitials,
  namedRanks,
  namedTitles,
  nextQuire,
  quireClashIds,
  quireCopy,
  quireCounts,
  quireRibbons,
  quireScribes,
  quireShare,
  quireShelves,
  quireTimeline,
  quireWeights,
  quiresCsv,
  rankArg,
  rankLines,
  readHiddenTitles,
  readQuireViews,
  readQuires,
  resetQuires,
  setQuireFiled,
  setQuireFolded,
  setQuireStarred,
  shelfArg,
  ribbonArg,
  scribeArg,
  stepQuireWeight,
  titleArg,
  titleLines,
  titleOf,
  toggleTitle,
  visibleCourtesyCustomers,
  visibleQuires,
  visibleTitles,
  weightArg,
  rankOf,
  type CourtesyRow,
  type Quire,
  type QuireShelf,
  type QuireTray,
  type QuireView,
  type QuireWeight,
  type Rank,
} from "@/lib/crmv4/round148";
import { useJson } from "./kit";
import { storedRole } from "./round5";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  jobTitle?: string | null;
};

type GlanceRow = CourtesyRow & { id: string };

const DAYS = ["1", "2", "3", "4", "5", "6", "7"] as const;

function shelfName(v4: V4, shelf: QuireShelf): string {
  if (shelf === "desk") return v4("qreShelfDesk");
  if (shelf === "floor") return v4("qreShelfFloor");
  if (shelf === "vault") return v4("qreShelfVault");
  return v4("qreBlankShelf");
}

function weightName(v4: V4, weight: QuireWeight): string {
  if (weight === "light") return v4("qreWeightLight");
  if (weight === "steady") return v4("qreWeightSteady");
  if (weight === "heavy") return v4("qreWeightHeavy");
  return v4("qreBlankWeight");
}

function dayName(v4: V4, name: string): string {
  if (name === "1") return v4("qreMon");
  if (name === "2") return v4("qreTue");
  if (name === "3") return v4("qreWed");
  if (name === "4") return v4("qreThu");
  if (name === "5") return v4("qreFri");
  if (name === "6") return v4("qreSat");
  if (name === "7") return v4("qreSun");
  if (name === "early") return v4("qreEarly");
  if (name === "late") return v4("qreLate");
  if (name === "weekday") return v4("qreWeekday");
  if (name === "weekend") return v4("qreWeekend");
  return v4("qreBlankDay");
}

function rankName(v4: V4, name: string): string {
  if (name === "bench") return v4("ctsBench");
  if (name === "desk") return v4("ctsDesk");
  if (name === "chair") return v4("ctsChair");
  return v4("ctsUnmarked");
}

function auditName(v4: V4, audit: string): string {
  if (audit === "save") return v4("qreAuditSave");
  if (audit === "edit") return v4("qreAuditEdit");
  if (audit === "raise") return v4("qreAuditRaise");
  if (audit === "lower") return v4("qreAuditLower");
  if (audit === "star") return v4("qreAuditStar");
  if (audit === "unstar") return v4("qreAuditUnstar");
  if (audit === "fold") return v4("qreAuditFold");
  if (audit === "unfold") return v4("qreAuditUnfold");
  if (audit === "file") return v4("qreAuditFile");
  if (audit === "reopen") return v4("qreAuditReopen");
  return "";
}

function dayLabel(day: number | null): string {
  return day === null ? "—" : String(day).padStart(2, "0");
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

function deskDay(): string {
  const utc = new Date().getUTCDay();
  return utc === 0 ? "7" : String(utc);
}

export function QuireLeaves({ v4 }: { v4: V4 }) {
  const [cards, setCards] = useState<Quire[]>([]);
  const [views, setViews] = useState<QuireView[]>([]);
  const [text, setText] = useState("");
  const [scribe, setScribe] = useState("");
  const [day, setDay] = useState("");
  const [shelf, setShelf] = useState("");
  const [ribbon, setRibbon] = useState("");
  const [weight, setWeight] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<QuireTray>("open");
  const [scribeFilter, setScribeFilter] = useState("all");
  const [shelfFilter, setShelfFilter] = useState("all");
  const [ribbonFilter, setRibbonFilter] = useState("all");
  const [weightFilter, setWeightFilter] = useState("all");
  const [dayFilter, setDayFilter] = useState("all");
  const [heavyOnly, setHeavyOnly] = useState(false);
  const [lateOnly, setLateOnly] = useState(false);
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const [copied, setCopied] = useState("");
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [desk, setDesk] = useState("");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  useEffect(() => {
    const next = readQuires(readJson(QUIRE_KEY, []));
    const saved = readQuireViews(readJson(QUIRE_VIEW_KEY, []));
    setCards(next);
    setViews(saved);
    writeJson(QUIRE_KEY, next);
    writeJson(QUIRE_VIEW_KEY, saved);
    setDesk(deskDay());
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
      if (event.key === "q" || event.key === "Q") {
        event.preventDefault();
        textRef.current?.focus();
        return;
      }
      if (event.key !== "/") return;
      event.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const scribes = quireScribes(cards);
  const shelves = quireShelves(cards);
  const ribbons = quireRibbons(cards);
  const weights = quireWeights(cards);
  const days = dayCounts(cards);
  const scribeOn = activeScribe(scribeFilter, scribes);
  const shelfOn = activeShelf(shelfFilter, shelves);
  const ribbonOn = activeRibbon(ribbonFilter, ribbons);
  const weightOn = activeWeight(weightFilter, weights);
  const dayOn = activeDay(dayFilter);
  const picked = dayArg(dayOn);
  const shown = visibleQuires(
    cards,
    tray,
    query,
    scribeArg(scribeOn),
    shelfArg(shelfOn),
    ribbonArg(ribbonOn),
    weightArg(weightOn),
    picked.exact,
    picked.band,
    heavyOnly,
    lateOnly,
    desk,
  );
  const timeline = quireTimeline(cards, query);
  const counts = quireCounts(cards, desk);
  const total = cards.length;
  const nextId = nextQuire(cards, desk);
  const nextCard = cards.find((card) => card.id === nextId);
  const widest = Math.max(1, ...days);

  function store(next: Quire[]) {
    setCards(next);
    writeJson(QUIRE_KEY, next);
  }

  function storeViews(next: QuireView[]) {
    setViews(next);
    writeJson(QUIRE_VIEW_KEY, next);
  }

  function clearDraft() {
    setText("");
    setScribe("");
    setDay("");
    setShelf("");
    setRibbon("");
    setWeight("");
  }

  function copyCard(card: Quire) {
    const body = quireCopy(card.text);
    if (!body) return;
    if (navigator.clipboard?.writeText) void navigator.clipboard.writeText(body);
    setCopied(card.id);
  }

  function applyView(view: QuireView) {
    setTray(view.tray);
    setQuery(view.query);
    setScribeFilter(activeScribe(view.scribe, quireScribes(cards)));
    setShelfFilter(activeShelf(view.shelf, quireShelves(cards)));
    setRibbonFilter(activeRibbon(view.ribbon, quireRibbons(cards)));
    setWeightFilter(activeWeight(view.weight, quireWeights(cards)));
    setDayFilter(activeDay(view.day));
    setBoard("cards");
    setHeavyOnly(false);
    setLateOnly(false);
  }

  return (
    <section className="c4-qre" aria-label={v4("qreTitle")} data-quire="1" data-role={role} data-quire-ledger="1">
      <header className="c4-qre-head">
        <p className="c4-qre-plate" data-logo="mono">{v4("qreLogo")}</p>
        <div>
          <p className="c4-pay-kicker">{v4("qreSub")}</p>
          <h2 className="c4-title">{v4("qreTitle")}</h2>
        </div>
        <p className="c4-qre-count">{shown.length}</p>
      </header>
      <p className="c4-meta">{v4("qreHint")}</p>
      <p className="c4-meta">{v4("qreLocal")}</p>
      <p className="c4-meta">{v4("qreBlank")}</p>
      <p className="c4-meta">{v4("qreScribeBlank")}</p>
      <p className="c4-meta">{v4("qreDayBlank")}</p>
      <p className="c4-meta">{v4("qreShelfBlank")}</p>
      <p className="c4-meta">{v4("qreRibbonBlank")}</p>
      <p className="c4-meta">{v4("qreWeightBlank")}</p>
      <p className="c4-meta">{v4("qreEscape")}</p>
      <p className="c4-meta">{v4("qreSlash")}</p>
      <p className="c4-meta">{v4("qreNew")}</p>
      {viewer ? <p className="c4-qre-notice" role="status">{v4("qreViewer")}</p> : null}
      <p className="c4-qre-notice" role="status">
        <span>{v4("qreNotice")}</span>
        <span className="c4-qre-count">{counts.late}</span>
        <button type="button" className="c4-btn" aria-pressed={lateOnly} onClick={() => { setLateOnly((value) => !value); setTray("open"); setBoard("cards"); }}>
          {lateOnly ? v4("qreNoticeAll") : v4("qreNoticeOpen")}
        </button>
      </p>
      <section className="c4-qre-kpi" aria-label={v4("qreKpi")}>
        <p className="c4-pay-kicker">{v4("qreKpi")}</p>
        {(["open", "folded", "filed", "starred"] as const).map((key) => {
          const count = counts[key];
          const share = quireShare(count, total);
          const label = key === "open" ? v4("qreOpen") : key === "folded" ? v4("qreFolded") : key === "filed" ? v4("qreFiled") : v4("qreStarred");
          return (
            <p key={key} className="c4-qre-meter" data-tray={key}>
              <span>{label}</span>
              <span>{count}</span>
              <span>{v4("qreShare")} {share}%</span>
              <span className="c4-qre-track" aria-hidden="true"><i style={{ width: `${share}%` }} /></span>
            </p>
          );
        })}
      </section>
      <section className="c4-qre-chart" aria-label={v4("qreChart")}>
        <p className="c4-pay-kicker">{v4("qreChart")}</p>
        {DAYS.map((name, index) => {
          const count = days[index] || 0;
          const width = Math.max(count ? 8 : 0, Math.round((count / widest) * 100));
          return (
            <button
              key={name}
              type="button"
              className="c4-qre-band"
              data-day={name}
              aria-pressed={dayOn === name}
              onClick={() => { setDayFilter(dayOn === name ? "all" : name); setBoard("cards"); }}
            >
              <span>{dayName(v4, name)}</span>
              <span className="c4-qre-bar" aria-hidden="true"><i style={{ width: `${width}%` }} /></span>
              <span>{count}</span>
            </button>
          );
        })}
      </section>
      <form className="c4-qre-next" onSubmit={(event) => event.preventDefault()}>
        <label className="c4-lab">
          <span>{v4("qreDeskDay")}</span>
          <input className="c4-field" inputMode="numeric" aria-label={v4("qreDeskDay")} value={desk} onChange={(event) => setDesk(event.target.value)} />
        </label>
        <p className="c4-qre-next-card">
          <span>{v4("qreNext")}</span>
          {nextCard ? <strong>{nextCard.text}</strong> : <span>{v4("qreNextEmpty")}</span>}
        </p>
      </form>
      <form
        className="c4-qre-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (viewer) return;
          const next = addQuire(cards, { id: `qre-${Date.now()}`, text, scribe, day, shelf, ribbon, weight });
          if (next.length === cards.length) return;
          store(next);
          clearDraft();
        }}
      >
        <label className="c4-lab">
          <span>{v4("qreText")}</span>
          <input ref={textRef} className="c4-field" aria-label={v4("qreText")} value={text} disabled={viewer} onChange={(event) => setText(event.target.value)} onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            clearDraft();
          }} />
        </label>
        <label className="c4-lab">
          <span>{v4("qreScribe")}</span>
          <input className="c4-field" aria-label={v4("qreScribe")} value={scribe} disabled={viewer} onChange={(event) => setScribe(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("qreDay")}</span>
          <input className="c4-field" inputMode="numeric" aria-label={v4("qreDay")} value={day} disabled={viewer} onChange={(event) => setDay(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("qreShelf")}</span>
          <select className="c4-select" aria-label={v4("qreShelf")} value={shelf} disabled={viewer} onChange={(event) => setShelf(event.target.value)}>
            <option value="">{v4("qreBlankShelf")}</option>
            <option value="desk">{v4("qreShelfDesk")}</option>
            <option value="floor">{v4("qreShelfFloor")}</option>
            <option value="vault">{v4("qreShelfVault")}</option>
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("qreRibbon")}</span>
          <input className="c4-field" aria-label={v4("qreRibbon")} value={ribbon} disabled={viewer} onChange={(event) => setRibbon(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("qreWeight")}</span>
          <select className="c4-select" aria-label={v4("qreWeight")} value={weight} disabled={viewer} onChange={(event) => setWeight(event.target.value)}>
            <option value="">{v4("qreBlankWeight")}</option>
            <option value="light">{v4("qreWeightLight")}</option>
            <option value="steady">{v4("qreWeightSteady")}</option>
            <option value="heavy">{v4("qreWeightHeavy")}</option>
          </select>
        </label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("qreAdd")}</button>
      </form>
      <div className="c4-row" role="group" aria-label={v4("qreTitle")}>
        <button type="button" className="c4-chip" data-on={tray === "open" ? "1" : "0"} aria-pressed={tray === "open"} onClick={() => { setTray("open"); setBoard("cards"); }}>{v4("qreOpen")}</button>
        <button type="button" className="c4-chip" data-on={tray === "folded" ? "1" : "0"} aria-pressed={tray === "folded"} onClick={() => { setTray("folded"); setBoard("cards"); }}>{v4("qreFolded")}</button>
        <button type="button" className="c4-chip" data-on={tray === "filed" ? "1" : "0"} aria-pressed={tray === "filed"} onClick={() => { setTray("filed"); setBoard("cards"); }}>{v4("qreFiled")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} aria-pressed={board === "timeline"} onClick={() => setBoard("timeline")}>{v4("qreTimeline")}</button>
        <button type="button" className="c4-btn" aria-pressed={heavyOnly} onClick={() => setHeavyOnly((value) => !value)}>{v4("qreHeavy")}</button>
        <button type="button" className="c4-btn" onClick={() => download("quire-leaves.csv", quiresCsv(cards, desk))}>{v4("qreCsv")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkQuireStarred(cards, shown.map((card) => card.id), true))}>{v4("qreBulkStar")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkQuireFiled(cards, shown.map((card) => card.id), true))}>{v4("qreBulkFile")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => { store(resetQuires()); setEditing(""); }}>{v4("qreReset")}</button>
      </div>
      <div className="c4-row">
        <label className="c4-lab">
          <span>{v4("qreSearch")}</span>
          <input ref={searchRef} className="c4-field" aria-label={v4("qreSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            setQuery("");
          }} />
        </label>
        <label className="c4-lab">
          <span>{v4("qreScribes")}</span>
          <select className="c4-select" aria-label={v4("qreScribes")} value={scribeOn} onChange={(event) => setScribeFilter(event.target.value)}>
            <option value="all">{v4("qreAllScribes")}</option>
            <option value="blank">{v4("qreBlankScribe")}</option>
            {scribes.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("qreShelves")}</span>
          <select className="c4-select" aria-label={v4("qreShelves")} value={shelfOn} onChange={(event) => setShelfFilter(event.target.value)}>
            <option value="all">{v4("qreAllShelves")}</option>
            <option value="blank">{v4("qreBlankShelf")}</option>
            {shelves.map((item) => <option key={item} value={item}>{shelfName(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("qreRibbons")}</span>
          <select className="c4-select" aria-label={v4("qreRibbons")} value={ribbonOn} onChange={(event) => setRibbonFilter(event.target.value)}>
            <option value="all">{v4("qreAllRibbons")}</option>
            <option value="blank">{v4("qreBlankRibbon")}</option>
            {ribbons.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("qreWeights")}</span>
          <select className="c4-select" aria-label={v4("qreWeights")} value={weightOn} onChange={(event) => setWeightFilter(event.target.value)}>
            <option value="all">{v4("qreAllWeights")}</option>
            <option value="blank">{v4("qreBlankWeight")}</option>
            {weights.map((item) => <option key={item} value={item}>{weightName(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("qreDays")}</span>
          <select className="c4-select" aria-label={v4("qreDays")} value={dayOn} onChange={(event) => setDayFilter(event.target.value)}>
            <option value="all">{v4("qreAllDays")}</option>
            <option value="blank">{v4("qreBlankDay")}</option>
            <option value="early">{v4("qreEarly")}</option>
            <option value="late">{v4("qreLate")}</option>
            <option value="weekday">{v4("qreWeekday")}</option>
            <option value="weekend">{v4("qreWeekend")}</option>
            {DAYS.map((item) => <option key={item} value={item}>{dayName(v4, item)}</option>)}
          </select>
        </label>
      </div>
      <form
        className="c4-qre-view"
        onSubmit={(event) => {
          event.preventDefault();
          if (viewer) return;
          const next = addQuireView(views, {
            id: `view-${Date.now()}`,
            name: viewName,
            tray,
            query,
            scribe: scribeOn,
            shelf: shelfOn,
            ribbon: ribbonOn,
            weight: weightOn,
            day: dayOn,
          });
          if (next.length === views.length) return;
          storeViews(next);
          setViewName("");
        }}
      >
        <label className="c4-lab">
          <span>{v4("qreViewName")}</span>
          <input className="c4-field" aria-label={v4("qreViewName")} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("qreSaveView")}</button>
      </form>
      <section aria-label={v4("qreViews")}>
        <p className="c4-pay-kicker">{v4("qreViews")}</p>
        {!views.length && <p className="c4-qre-empty">{v4("qreViewEmpty")}</p>}
        <ul className="c4-qre-views">
          {views.map((view) => (
            <li key={view.id}>
              <button type="button" className="c4-btn" onClick={() => applyView(view)}>{view.name}</button>
              <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropQuireView(views, view.id))}>{v4("qreDropView")}</button>
            </li>
          ))}
        </ul>
      </section>
      {board === "cards" && !shown.length && <p className="c4-qre-empty">{v4("qreEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-qre-rows">
          {shown.map((card) => {
            const gap = dayGap(card.day, desk);
            const clashes = quireClashIds(cards, card.id);
            const band = dayBand(card.day);
            const kind = dayKind(card.day);
            return (
              <li key={card.id} data-weight={card.weight || "blank"} data-day={band} data-starred={card.starred ? "1" : "0"}>
                <span className="c4-qre-clock">{dayLabel(card.day)}</span>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); store(editQuire(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("qreEdit")} value={draft} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("qreSaveEdit")}</button>
                    </form>
                  ) : <p>{card.text}</p>}
                  <p className="c4-meta">
                    {card.scribe || v4("qreBlankScribe")}
                    {" · "}
                    {shelfName(v4, (card.shelf || "blank") as QuireShelf)}
                    {" · "}
                    {card.ribbon || v4("qreBlankRibbon")}
                    {" · "}
                    {weightName(v4, (card.weight || "blank") as QuireWeight)}
                    {" · "}
                    {dayName(v4, kind === "blank" ? "blank" : kind)}
                    {gap === null ? "" : ` · ${gap > 0 ? v4("qreLateWord") : gap < 0 ? v4("qreAhead") : v4("qreNow")} ${gap}`}
                    {card.audit ? ` · ${v4("qreAudit")} ${auditName(v4, card.audit)}` : ""}
                    {clashes.length ? ` · ${v4("qreClash")} ${clashes.length}` : ` · ${v4("qreClashNone")}`}
                  </p>
                </div>
                <div className="c4-row">
                  <button type="button" className="c4-btn" onClick={() => copyCard(card)}>{copied === card.id ? v4("qreCopied") : v4("qreCopy")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.text); }}>{v4("qreEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(stepQuireWeight(cards, card.id, 1))}>{v4("qreRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(stepQuireWeight(cards, card.id, -1))}>{v4("qreLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.starred} onClick={() => store(setQuireStarred(cards, card.id, !card.starred))}>{card.starred ? v4("qreUnstar") : v4("qreStar")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.folded} onClick={() => store(setQuireFolded(cards, card.id, !card.folded))}>{card.folded ? v4("qreUnfold") : v4("qreFold")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.filed} onClick={() => store(setQuireFiled(cards, card.id, !card.filed))}>{card.filed ? v4("qreReopen") : v4("qreFile")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {board === "timeline" && (
        <ol className="c4-qre-time">
          {timeline.map((card) => (
            <li key={card.id} data-day={dayBand(card.day)}>
              <span className="c4-qre-clock">{dayLabel(card.day)}</span>
              <p>{card.text}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export function CourtesyRanks({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [hiddenTitles, setHiddenTitles] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [rank, setRank] = useState("all");
  const [initial, setInitial] = useState("all");
  const [showHidden, setShowHidden] = useState(false);
  const [query, setQuery] = useState("");
  const rows = useMemo(() => (data.data?.users || []).map((row): GlanceRow | null => {
    const id = String(row.id || "").trim();
    if (!id) return null;
    return {
      id,
      label: String(row.name || "").trim(),
      title: row.jobTitle,
    };
  }).filter((row): row is GlanceRow => Boolean(row)), [data.data?.users]);
  const ranks = rankLines(rows);
  const titles = titleLines(rows);
  const initials = initialLines(rows);
  const present = namedTitles(rows);
  const presentKey = present.join("\n");
  const rankNames = namedRanks(rows);
  const initialNames = namedInitials(rows);
  const blankRank = ranks.find((line) => !line.rank)?.count || 0;
  const leadRank = leadingRank(rows);
  const leadTitle = leadingTitle(rows);
  const loading = data.loading && !data.data;
  const failed = Boolean(data.error);
  useEffect(() => {
    if (loading || failed) return;
    const next = readHiddenTitles(readJson(COURTESY_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHiddenTitles(next);
    writeJson(COURTESY_KEY, next);
  }, [loading, failed, presentKey]);
  const chips = visibleTitles(present, hiddenTitles, showHidden);
  const titleOn = activeTitle(selected, chips);
  const rankOn = activeRank(rank, rankNames);
  const initialOn = activeInitial(initial, initialNames);
  const shown = visibleCourtesyCustomers(rows, rankArg(rankOn), titleArg(titleOn), initialArg(initialOn), query);
  const widest = Math.max(1, ...ranks.map((line) => line.count));

  function store(next: string[], clear: string) {
    setHiddenTitles(next);
    writeJson(COURTESY_KEY, next);
    if (clear && activeTitle(selected, [clear]) === clear) setSelected("");
  }

  return (
    <section className="c4-cts" aria-label={v4("ctsTitle")} data-courtesy="1" data-quire-ledger="1">
      <header className="c4-cts-head">
        <div>
          <p className="c4-pay-kicker">{v4("ctsSub")}</p>
          <h2 className="c4-title">{v4("ctsTitle")}</h2>
        </div>
        <p className="c4-qre-count">{v4("ctsRows")} {rows.length}</p>
      </header>
      <p className="c4-meta">{v4("ctsHint")}</p>
      <p className="c4-meta">{v4("ctsLocal")}</p>
      <p className="c4-meta">{v4("ctsEscape")}</p>
      {leadRank ? <p className="c4-cts-lead"><span>{v4("ctsLeadRank")}</span> {rankName(v4, leadRank)}</p> : null}
      {leadTitle ? <p className="c4-cts-lead"><span>{v4("ctsLeadTitle")}</span> {leadTitle}</p> : null}
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "customers")}>{v4("ctsBoard")}</Link>
        <button type="button" className="c4-btn" onClick={() => download("courtesy-ranks.csv", courtesyCsv(rows))}>{v4("ctsCsv")}</button>
      </p>
      {loading && !rows.length && <p className="c4-meta">{v4("ctsLoading")}</p>}
      {failed && !rows.length && <p className="c4-meta">{v4("ctsFailed")}</p>}
      {!loading && !failed && !rows.length && <p className="c4-qre-empty">{v4("ctsNone")}</p>}
      {ranks.length > 0 && (
        <section className="c4-cts-chart" aria-label={v4("ctsAllRank")}>
          {ranks.map((line) => {
            const share = courtesyShare(line.count, rows.length);
            const width = Math.max(8, Math.round((line.count / widest) * 100));
            const name = line.rank || "blank";
            return (
              <p key={name} className="c4-cts-col" data-rank={name}>
                <span>{rankName(v4, line.rank)}</span>
                <span className="c4-cts-track" aria-hidden="true"><i style={{ width: `${width}%` }} /></span>
                <span>{line.count}</span>
                <span>{v4("ctsShare")} {share}%</span>
              </p>
            );
          })}
        </section>
      )}
      <div className="c4-cts-ranks" role="group" aria-label={v4("ctsAllRank")}>
        <button type="button" className="c4-cts-rank" data-rank="all" data-on={rankOn === "all" ? "1" : "0"} aria-pressed={rankOn === "all"} onClick={() => setRank("all")}>
          <span>{v4("ctsAllRank")}</span>
          <span className="c4-qre-count">{rows.length}</span>
        </button>
        {blankRank > 0 && (
          <button type="button" className="c4-cts-rank" data-rank="blank" data-on={rankOn === "blank" ? "1" : "0"} aria-pressed={rankOn === "blank"} onClick={() => { setRank(rankOn === "blank" ? "all" : "blank"); setSelected(""); }}>
            <span>{v4("ctsUnmarked")}</span>
            <span className="c4-qre-count">{blankRank}</span>
          </button>
        )}
        {rankNames.map((item) => {
          const count = ranks.find((line) => line.rank === item)?.count || 0;
          return (
            <button key={item} type="button" className="c4-cts-rank" data-rank={item} data-on={rankOn === item ? "1" : "0"} aria-pressed={rankOn === item} onClick={() => { setSelected(""); setRank(rankOn === item ? "all" : item); }}>
              <span>{rankName(v4, item)}</span>
              <span className="c4-qre-count">{count}</span>
              <span>{v4("ctsShare")} {courtesyShare(count, rows.length)}%</span>
            </button>
          );
        })}
      </div>
      <div className="c4-row" role="group" aria-label={v4("ctsInitials")}>
        <button type="button" className="c4-chip" data-on={initialOn === "all" ? "1" : "0"} aria-pressed={initialOn === "all"} onClick={() => setInitial("all")}>{v4("ctsAllInitials")}</button>
        {initials.map((line) => (
          <button key={line.initial} type="button" className="c4-chip" data-on={initialOn === line.initial ? "1" : "0"} aria-pressed={initialOn === line.initial} onClick={() => setInitial(initialOn === line.initial ? "all" : line.initial)}>
            {line.initial.toUpperCase()} {line.count}
          </button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("ctsShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("ctsShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("ctsHidden")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("ctsTitles")}>
        <button type="button" className="c4-chip" data-on={titleOn === "all" && rankOn === "all" && initialOn === "all" ? "1" : "0"} aria-pressed={titleOn === "all"} onClick={() => { setSelected(""); setRank("all"); setInitial("all"); }}>{v4("ctsAll")}</button>
        {chips.map((item) => {
          const line = titles.find((row) => row.title === item);
          const count = line?.count || 0;
          const share = courtesyShare(count, rows.length);
          const rankMark = (line?.rank || "") as Rank;
          return (
            <span key={item} className="c4-cts-pair" data-title={item}>
              <button type="button" className="c4-chip" data-on={titleOn === item ? "1" : "0"} aria-pressed={titleOn === item} onClick={() => { setRank("all"); setInitial("all"); setSelected(titleOn === item ? "" : item); }}>{item}</button>
              {rankMark ? <span className="c4-cts-rank-name">{rankName(v4, rankMark)}</span> : null}
              <span className="c4-qre-count">{count}</span>
              <span className="c4-cts-share">{v4("ctsShare")} {share}%</span>
              <span className="c4-cts-track" aria-hidden="true"><i style={{ width: `${share}%` }} /></span>
              <button type="button" className="c4-btn" onClick={() => store(toggleTitle(hiddenTitles, item, present), showHidden ? "" : item)}>{showHidden ? v4("ctsShow") : v4("ctsHide")}</button>
            </span>
          );
        })}
      </div>
      <label className="c4-lab">
        <span>{v4("ctsSearch")}</span>
        <input className="c4-field" aria-label={v4("ctsSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          setQuery("");
        }} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c4-qre-empty">{v4("ctsEmpty")}</p>}
      <ul className="c4-cts-rows">
        {shown.map((row) => {
          const title = titleOf(row.title);
          const rankMark = rankOf(row.title) as Rank;
          return (
            <li key={row.id} data-rank={rankMark || "blank"} data-title={title || "blank"}>
              <span className="c4-cts-spine" aria-hidden="true" />
              <p>{row.label || row.id}</p>
              <p className="c4-meta">
                {rankName(v4, rankMark)}
                {title ? ` · ${title}` : ""}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
