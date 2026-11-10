"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  LAMP_KEY,
  WAX_KEY,
  WAX_VIEW_KEY,
  activeAge,
  activeBand,
  activeDay,
  activeHue,
  activeKeeper,
  activeMark,
  activePace,
  activeTag,
  activeWeekday,
  addWax,
  addWaxView,
  ageArg,
  ageLines,
  ageOf,
  bandArg,
  bandLines,
  bandOf,
  bulkWaxFiled,
  bulkWaxPinned,
  clashWaxCount,
  dayArg,
  dayOf,
  dropWaxView,
  editWax,
  followSpan,
  halfOf,
  hueArg,
  hueOf,
  keeperArg,
  keeperLoad,
  leadingBand,
  leadingDay,
  lampShare,
  lampsCsv,
  markArg,
  namedAges,
  namedBands,
  namedDays,
  namedWeekdays,
  nextWax,
  paceArg,
  paceOf,
  readHiddenDays,
  readWaxViews,
  readWaxes,
  resetWaxes,
  setWaxFiled,
  setWaxHeld,
  setWaxPinned,
  stepWaxPace,
  tagArg,
  toggleDay,
  visibleDays,
  visibleLampCustomers,
  visibleWaxes,
  watchCounts,
  watchOf,
  waxClashIds,
  waxCopy,
  waxCounts,
  waxGap,
  waxHues,
  waxKeepers,
  waxPaces,
  waxShare,
  waxTags,
  waxTimeline,
  waxesCsv,
  weekdayArg,
  weekdayLines,
  weekdayOf,
  type FollowAge,
  type FollowBand,
  type FollowWeek,
  type LampRow,
  type WaxCard,
  type WaxHue,
  type WaxPace,
  type WaxTray,
  type WaxView,
} from "@/lib/crmv4/round163";
import { useJson } from "./kit";
import { storedRole } from "./round5";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  retentionFollowUpAt?: string | null;
};

type GlanceRow = LampRow & { id: string };

const WATCHES = ["night", "day", "eve"] as const;

function hueName(v4: V4, hue: WaxHue): string {
  if (hue === "champagne") return v4("wxfHueChampagne");
  if (hue === "graphite") return v4("wxfHueGraphite");
  if (hue === "ivory") return v4("wxfHueIvory");
  if (hue === "soot") return v4("wxfHueSoot");
  return v4("wxfBlankHue");
}

function paceName(v4: V4, pace: WaxPace): string {
  if (pace === "still") return v4("wxfStill");
  if (pace === "steady") return v4("wxfSteady");
  if (pace === "swift") return v4("wxfSwift");
  return v4("wxfBlankPace");
}

function watchName(v4: V4, name: string): string {
  if (name === "night") return v4("wxfNight");
  if (name === "day") return v4("wxfDay");
  if (name === "eve") return v4("wxfEve");
  if (name === "early") return v4("wxfEarly");
  if (name === "late") return v4("wxfLate");
  if (/^(?:0?[0-4])$/.test(name)) return String(Number(name));
  return v4("wxfBlankMark");
}

function bandName(v4: V4, name: string): string {
  if (name === "morn") return v4("flmMorn");
  if (name === "noon") return v4("flmNoon");
  if (name === "eve") return v4("flmEve");
  return v4("flmUnmarked");
}

function ageName(v4: V4, name: string): string {
  if (name === "near") return v4("flmNear");
  if (name === "week") return v4("flmWeek");
  if (name === "over") return v4("flmOver");
  return v4("flmUnmarked");
}

function weekName(v4: V4, name: string): string {
  const key = {
    sun: "flmSun",
    mon: "flmMon",
    tue: "flmTue",
    wed: "flmWed",
    thu: "flmThu",
    fri: "flmFri",
    sat: "flmSat",
  }[name];
  return key ? v4(key as CrmV4CopyKey) : v4("flmUnmarked");
}

function auditName(v4: V4, audit: string): string {
  if (audit === "save") return v4("wxfAuditSave");
  if (audit === "edit") return v4("wxfAuditEdit");
  if (audit === "raise") return v4("wxfAuditRaise");
  if (audit === "lower") return v4("wxfAuditLower");
  if (audit === "pin") return v4("wxfAuditPin");
  if (audit === "unpin") return v4("wxfAuditUnpin");
  if (audit === "hold") return v4("wxfAuditHold");
  if (audit === "release") return v4("wxfAuditRelease");
  if (audit === "file") return v4("wxfAuditFile");
  if (audit === "unfile") return v4("wxfAuditUnfile");
  return "";
}

function markLabel(mark: number | null): string {
  return mark === null ? "—" : String(mark);
}

function gapLabel(v4: V4, mark: number | null, desk: string): string {
  const gap = waxGap(mark, desk);
  if (gap === null) return "";
  if (gap > 0) return `${v4("wxfPast")} ${gap}`;
  if (gap < 0) return `${v4("wxfAhead")} ${Math.abs(gap)}`;
  return v4("wxfDue");
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

function marks(pace: string): number {
  if (pace === "swift") return 3;
  if (pace === "steady") return 2;
  if (pace === "still") return 1;
  return 0;
}

function sameCards(left: readonly WaxCard[], right: readonly WaxCard[]): boolean {
  return left.length === right.length && left.every((card, index) => card.id === right[index]?.id && card.text === right[index]?.text && card.audit === right[index]?.audit);
}

export function WaxFollowUps({ v4 }: { v4: V4 }) {
  const [cards, setCards] = useState<WaxCard[]>([]);
  const [views, setViews] = useState<WaxView[]>([]);
  const [text, setText] = useState("");
  const [keeper, setKeeper] = useState("");
  const [mark, setMark] = useState("");
  const [hue, setHue] = useState("");
  const [tag, setTag] = useState("");
  const [pace, setPace] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<WaxTray>("open");
  const [keeperFilter, setKeeperFilter] = useState("all");
  const [hueFilter, setHueFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [paceFilter, setPaceFilter] = useState("all");
  const [markFilter, setMarkFilter] = useState("all");
  const [swiftOnly, setSwiftOnly] = useState(false);
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
    const next = readWaxes(readJson(WAX_KEY, []));
    const saved = readWaxViews(readJson(WAX_VIEW_KEY, []));
    setCards(next);
    setViews(saved);
    writeJson(WAX_KEY, next);
    writeJson(WAX_VIEW_KEY, saved);
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
      if (event.key === "w" || event.key === "W") {
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
  const keepers = waxKeepers(cards);
  const hues = waxHues(cards);
  const tagsOn = waxTags(cards);
  const paces = waxPaces(cards);
  const bars = watchCounts(cards);
  const keeperOn = activeKeeper(keeperFilter, keepers);
  const hueOn = activeHue(hueFilter, hues);
  const tagOn = activeTag(tagFilter, tagsOn);
  const paceOn = activePace(paceFilter, paces);
  const markOn = activeMark(markFilter);
  const picked = markArg(markOn);
  const shown = visibleWaxes(
    cards,
    tray,
    query,
    keeperArg(keeperOn),
    hueArg(hueOn),
    tagArg(tagOn),
    paceArg(paceOn),
    picked.exact,
    picked.watch,
    swiftOnly,
    lateOnly,
    desk,
  );
  const timeline = waxTimeline(cards, query);
  const counts = waxCounts(cards, desk);
  const clashes = clashWaxCount(cards);
  const total = cards.length;
  const nextId = nextWax(cards, desk);
  const nextCard = cards.find((card) => card.id === nextId);
  const widest = Math.max(1, ...bars);
  const pinned = cards.filter((card) => card.pinned);
  const load = keeperLoad(cards, keeper);

  function store(next: WaxCard[]) {
    setCards(next);
    writeJson(WAX_KEY, next);
  }

  function storeViews(next: WaxView[]) {
    setViews(next);
    writeJson(WAX_VIEW_KEY, next);
  }

  function clearDraft() {
    setText("");
    setKeeper("");
    setMark("");
    setHue("");
    setTag("");
    setPace("");
  }

  function copyCard(card: WaxCard) {
    const body = waxCopy(card.text);
    if (!body) return;
    if (navigator.clipboard?.writeText) void navigator.clipboard.writeText(body);
    setCopied(card.id);
  }

  function applyView(view: WaxView) {
    setTray(view.tray);
    setQuery(view.query);
    setKeeperFilter(activeKeeper(view.keeper, waxKeepers(cards)));
    setHueFilter(activeHue(view.hue, waxHues(cards)));
    setTagFilter(activeTag(view.tag, waxTags(cards)));
    setPaceFilter(activePace(view.pace, waxPaces(cards)));
    setMarkFilter(activeMark(view.mark));
    setBoard("cards");
    setSwiftOnly(false);
    setLateOnly(false);
  }

  return (
    <section className="c4-wxf" aria-label={v4("wxfTitle")} data-waxes="1" data-role={role}>
      <header className="c4-wxf-head">
        <p className="c4-wxf-plate" data-logo="mono">{v4("wxfLogo")}</p>
        <div>
          <p className="c4-wxf-kicker">{v4("wxfSub")}</p>
          <h2 className="c4-title">{v4("wxfTitle")}</h2>
        </div>
        <p className="c4-wxf-count">{shown.length}</p>
      </header>
      <details className="c4-wxf-rules">
        <summary>{v4("wxfRules")}</summary>
        <p className="c4-meta">{v4("wxfHint")}</p>
        <p className="c4-meta">{v4("wxfLocal")}</p>
        <p className="c4-meta">{v4("wxfBlank")}</p>
        <p className="c4-meta">{v4("wxfKeeperBlank")}</p>
        <p className="c4-meta">{v4("wxfMarkBlank")}</p>
        <p className="c4-meta">{v4("wxfHueBlank")}</p>
        <p className="c4-meta">{v4("wxfTagBlank")}</p>
        <p className="c4-meta">{v4("wxfPaceBlank")}</p>
        <p className="c4-meta">{v4("wxfEscape")}</p>
        <p className="c4-meta">{v4("wxfSlash")}</p>
        <p className="c4-meta">{v4("wxfNew")}</p>
      </details>
      {viewer ? <p className="c4-wxf-notice" role="status">{v4("wxfViewer")}</p> : null}
      <p className="c4-wxf-notice" role="status">
        <span>{v4("wxfNotice")}</span>
        <span className="c4-wxf-count">{counts.late}</span>
        <button type="button" className="c4-btn" aria-pressed={lateOnly} onClick={() => { setLateOnly((value) => !value); setTray("open"); setBoard("cards"); }}>
          {lateOnly ? v4("wxfNoticeAll") : v4("wxfNoticeOpen")}
        </button>
      </p>
      <p className="c4-wxf-notice" role="status">
        <span>{v4("wxfClashNotice")}</span>
        <span className="c4-wxf-count">{clashes}</span>
      </p>
      {pinned.length > 0 && (
        <ul className="c4-wxf-pins" aria-label={v4("wxfPinned")}>
          {pinned.map((card) => (
            <li key={card.id}>
              <button type="button" className="c4-chip" onClick={() => { setQuery(card.text); setBoard("cards"); }}>{card.text}</button>
            </li>
          ))}
        </ul>
      )}
      <section className="c4-wxf-kpi" aria-label={v4("wxfKpi")}>
        {(["open", "held", "filed", "pinned"] as const).map((key) => {
          const count = counts[key];
          const share = waxShare(count, total);
          const label = key === "open" ? v4("wxfOpen") : key === "held" ? v4("wxfHeld") : key === "filed" ? v4("wxfFiled") : v4("wxfPinned");
          return (
            <p key={key} className="c4-wxf-meter" data-tray={key}>
              <span>{label}</span>
              <strong>{count}</strong>
              <span>{v4("wxfShare")} {share}%</span>
              <span className="c4-wxf-track" aria-hidden="true"><i style={{ width: `${share}%` }} /></span>
            </p>
          );
        })}
      </section>
      <section className="c4-wxf-chart" aria-label={v4("wxfChart")}>
        <p className="c4-wxf-kicker">{v4("wxfChart")}</p>
        {WATCHES.map((name, index) => {
          const count = bars[index] || 0;
          const width = Math.max(8, Math.round((count / widest) * 100));
          return (
            <button key={name} type="button" className="c4-wxf-col" data-on={markOn === name ? "1" : "0"} aria-pressed={markOn === name} onClick={() => setMarkFilter(markOn === name ? "all" : name)}>
              <span>{watchName(v4, name)}</span>
              <span className="c4-wxf-bar" aria-hidden="true"><i style={{ width: `${width}%` }} /></span>
              <span>{count}</span>
            </button>
          );
        })}
      </section>
      <form className="c4-wxf-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addWax(cards, { id: `wxf-${Date.now()}`, text, keeper, mark, hue, tag, pace });
        if (sameCards(next, cards)) return;
        store(next);
        clearDraft();
      }}>
        <label className="c4-lab">
          <span>{v4("wxfText")}</span>
          <input ref={textRef} className="c4-field" aria-label={v4("wxfText")} value={text} disabled={viewer} onChange={(event) => setText(event.target.value)} onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            clearDraft();
          }} />
        </label>
        <label className="c4-lab">
          <span>{v4("wxfKeeper")}</span>
          <input className="c4-field" aria-label={v4("wxfKeeper")} value={keeper} disabled={viewer} onChange={(event) => setKeeper(event.target.value)} />
        </label>
        <p className="c4-meta" role="status">{v4("wxfLoad")} {load}</p>
        <label className="c4-lab">
          <span>{v4("wxfMark")}</span>
          <input className="c4-field" inputMode="numeric" aria-label={v4("wxfMark")} value={mark} disabled={viewer} onChange={(event) => setMark(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("wxfHue")}</span>
          <select className="c4-select" aria-label={v4("wxfHue")} value={hue} disabled={viewer} onChange={(event) => setHue(event.target.value)}>
            <option value="">{v4("wxfBlankHue")}</option>
            <option value="champagne">{v4("wxfHueChampagne")}</option>
            <option value="graphite">{v4("wxfHueGraphite")}</option>
            <option value="ivory">{v4("wxfHueIvory")}</option>
            <option value="soot">{v4("wxfHueSoot")}</option>
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("wxfTag")}</span>
          <input className="c4-field" aria-label={v4("wxfTag")} value={tag} disabled={viewer} onChange={(event) => setTag(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("wxfPace")}</span>
          <select className="c4-select" aria-label={v4("wxfPace")} value={pace} disabled={viewer} onChange={(event) => setPace(event.target.value)}>
            <option value="">{v4("wxfBlankPace")}</option>
            <option value="still">{v4("wxfStill")}</option>
            <option value="steady">{v4("wxfSteady")}</option>
            <option value="swift">{v4("wxfSwift")}</option>
          </select>
        </label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("wxfAdd")}</button>
      </form>
      <div className="c4-row" role="group" aria-label={v4("wxfTitle")}>
        <button type="button" className="c4-chip" data-on={tray === "open" ? "1" : "0"} aria-pressed={tray === "open"} onClick={() => setTray("open")}>{v4("wxfOpen")}</button>
        <button type="button" className="c4-chip" data-on={tray === "held" ? "1" : "0"} aria-pressed={tray === "held"} onClick={() => setTray("held")}>{v4("wxfHeld")}</button>
        <button type="button" className="c4-chip" data-on={tray === "filed" ? "1" : "0"} aria-pressed={tray === "filed"} onClick={() => setTray("filed")}>{v4("wxfFiled")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} aria-pressed={board === "timeline"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("wxfTimeline")}</button>
        <button type="button" className="c4-chip" data-on={swiftOnly ? "1" : "0"} aria-pressed={swiftOnly} onClick={() => setSwiftOnly((value) => !value)}>{v4("wxfSwiftOnly")}</button>
        <button type="button" className="c4-btn" onClick={() => download("wax-follow-ups.csv", waxesCsv(cards, desk))}>{v4("wxfCsv")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkWaxPinned(cards, shown.map((card) => card.id), true))}>{v4("wxfBulkPin")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkWaxFiled(cards, shown.map((card) => card.id), true))}>{v4("wxfBulkFile")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => { store(resetWaxes()); setEditing(""); }}>{v4("wxfReset")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("wxfMarks")}>
        <button type="button" className="c4-chip" data-on={markOn === "all" ? "1" : "0"} aria-pressed={markOn === "all"} onClick={() => setMarkFilter("all")}>{v4("wxfAllMarks")}</button>
        <button type="button" className="c4-chip" data-on={markOn === "blank" ? "1" : "0"} aria-pressed={markOn === "blank"} onClick={() => setMarkFilter("blank")}>{v4("wxfBlankMark")}</button>
        <button type="button" className="c4-chip" data-on={markOn === "early" ? "1" : "0"} aria-pressed={markOn === "early"} onClick={() => setMarkFilter("early")}>{v4("wxfEarly")}</button>
        <button type="button" className="c4-chip" data-on={markOn === "late" ? "1" : "0"} aria-pressed={markOn === "late"} onClick={() => setMarkFilter("late")}>{v4("wxfLate")}</button>
        {["0", "2", "4"].map((slot) => (
          <button key={slot} type="button" className="c4-chip" data-on={markOn === slot ? "1" : "0"} aria-pressed={markOn === slot} onClick={() => setMarkFilter(markOn === slot ? "all" : slot)}>{slot}</button>
        ))}
      </div>
      <label className="c4-lab">
        <span>{v4("wxfSearch")}</span>
        <input ref={searchRef} className="c4-field" aria-label={v4("wxfSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          setQuery("");
        }} />
      </label>
      <div className="c4-wxf-next">
        <label className="c4-lab">
          <span>{v4("wxfDesk")}</span>
          <input className="c4-field" inputMode="numeric" aria-label={v4("wxfDesk")} value={desk} onChange={(event) => setDesk(event.target.value)} />
        </label>
        <p className="c4-meta">
          <span>{v4("wxfNext")}</span>
          {" "}
          {nextCard ? nextCard.text : v4("wxfNextEmpty")}
        </p>
      </div>
      <div className="c4-row">
        <label className="c4-lab">
          <span>{v4("wxfKeepers")}</span>
          <select className="c4-select" aria-label={v4("wxfKeepers")} value={keeperOn} onChange={(event) => setKeeperFilter(event.target.value)}>
            <option value="all">{v4("wxfAllKeepers")}</option>
            <option value="blank">{v4("wxfBlankKeeper")}</option>
            {keepers.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("wxfHues")}</span>
          <select className="c4-select" aria-label={v4("wxfHues")} value={hueOn} onChange={(event) => setHueFilter(event.target.value)}>
            <option value="all">{v4("wxfAllHues")}</option>
            <option value="blank">{v4("wxfBlankHue")}</option>
            {hues.map((item) => <option key={item} value={item}>{hueName(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("wxfTags")}</span>
          <select className="c4-select" aria-label={v4("wxfTags")} value={tagOn} onChange={(event) => setTagFilter(event.target.value)}>
            <option value="all">{v4("wxfAllTags")}</option>
            <option value="blank">{v4("wxfBlankTag")}</option>
            {tagsOn.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("wxfPaces")}</span>
          <select className="c4-select" aria-label={v4("wxfPaces")} value={paceOn} onChange={(event) => setPaceFilter(event.target.value)}>
            <option value="all">{v4("wxfAllPaces")}</option>
            <option value="blank">{v4("wxfBlankPace")}</option>
            {paces.map((item) => <option key={item} value={item}>{paceName(v4, item)}</option>)}
          </select>
        </label>
      </div>
      <form className="c4-wxf-view" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addWaxView(views, {
          id: `view-${Date.now()}`,
          name: viewName,
          tray,
          query,
          keeper: keeperOn,
          hue: hueOn,
          tag: tagOn,
          pace: paceOn,
          mark: markOn,
        });
        if (next.length === views.length) return;
        storeViews(next);
        setViewName("");
      }}>
        <label className="c4-lab">
          <span>{v4("wxfViewName")}</span>
          <input className="c4-field" aria-label={v4("wxfViewName")} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("wxfSaveView")}</button>
      </form>
      <section aria-label={v4("wxfViews")}>
        <p className="c4-wxf-kicker">{v4("wxfViews")}</p>
        {!views.length && <p className="c4-wxf-empty">{v4("wxfViewEmpty")}</p>}
        <ul className="c4-wxf-views">
          {views.map((view) => (
            <li key={view.id}>
              <button type="button" className="c4-btn" onClick={() => applyView(view)}>{view.name}</button>
              <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropWaxView(views, view.id))}>{v4("wxfDropView")}</button>
            </li>
          ))}
        </ul>
      </section>
      {board === "cards" && !shown.length && <p className="c4-wxf-empty">{v4("wxfEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-wxf-rows">
          {shown.map((card) => {
            const clashesOn = waxClashIds(cards, card.id);
            const gap = gapLabel(v4, card.mark, desk);
            const half = halfOf(card.mark);
            const editingCard = editing === card.id;
            return (
              <li key={card.id} data-pace={card.pace || "blank"} data-hue={card.hue || "blank"} data-watch={watchOf(card.mark)}>
                <span className="c4-wxf-mark" aria-hidden="true">{markLabel(card.mark)}</span>
                <span className="c4-wxf-marks" aria-hidden="true">
                  {[0, 1, 2].map((index) => <i key={index} data-on={index < marks(card.pace) ? "1" : "0"} />)}
                </span>
                <div>
                  {editingCard ? (
                    <form className="c4-row" onSubmit={(event) => {
                      event.preventDefault();
                      if (viewer) return;
                      store(editWax(cards, card.id, draft));
                      setEditing("");
                    }}>
                      <input className="c4-field" aria-label={v4("wxfEdit")} value={draft} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("wxfSaveEdit")}</button>
                    </form>
                  ) : <p>{card.text}</p>}
                  <p className="c4-meta">
                    {card.keeper || v4("wxfBlankKeeper")}
                    {" · "}
                    {markLabel(card.mark)}
                    {" · "}
                    {hueName(v4, hueOf(card.hue))}
                    {" · "}
                    {card.tag || v4("wxfBlankTag")}
                    {" · "}
                    {paceName(v4, paceOf(card.pace))}
                    {half === "blank" ? "" : ` · ${half === "early" ? v4("wxfEarly") : v4("wxfLate")}`}
                    {gap ? ` · ${gap}` : ""}
                    {auditName(v4, card.audit) ? ` · ${v4("wxfAudit")} ${auditName(v4, card.audit)}` : ""}
                    {" · "}
                    {clashesOn.length ? `${v4("wxfClash")} ${clashesOn.length}` : v4("wxfClashNone")}
                  </p>
                </div>
                <div className="c4-row">
                  <button type="button" className="c4-btn" onClick={() => copyCard(card)}>{copied === card.id ? v4("wxfCopied") : v4("wxfCopy")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.text); }}>{v4("wxfEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(stepWaxPace(cards, card.id, 1))}>{v4("wxfRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(stepWaxPace(cards, card.id, -1))}>{v4("wxfLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.pinned} onClick={() => store(setWaxPinned(cards, card.id, !card.pinned))}>{card.pinned ? v4("wxfUnpin") : v4("wxfPin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.held} onClick={() => store(setWaxHeld(cards, card.id, !card.held))}>{card.held ? v4("wxfRelease") : v4("wxfHold")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.filed} onClick={() => store(setWaxFiled(cards, card.id, !card.filed))}>{card.filed ? v4("wxfUnfile") : v4("wxfFile")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {board === "timeline" && (
        <ol className="c4-wxf-time">
          {timeline.map((card) => (
            <li key={card.id} data-watch={watchOf(card.mark)}>
              <span className="c4-wxf-clock">{markLabel(card.mark)}</span>
              <p>{card.text}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export function FollowLamps({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [hiddenDays, setHiddenDays] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [band, setBand] = useState("all");
  const [age, setAge] = useState("all");
  const [week, setWeek] = useState("all");
  const [showHidden, setShowHidden] = useState(false);
  const [query, setQuery] = useState("");
  const now = useMemo(() => Date.now(), []);
  const rows = useMemo(() => (data.data?.users || []).map((row): GlanceRow | null => {
    const id = String(row.id || "").trim();
    if (!id) return null;
    return {
      id,
      label: String(row.name || "").trim(),
      retentionFollowUpAt: row.retentionFollowUpAt,
    };
  }).filter((row): row is GlanceRow => Boolean(row)), [data.data?.users]);
  const bands = bandLines(rows);
  const ages = ageLines(rows, now);
  const weeks = weekdayLines(rows);
  const present = namedDays(rows);
  const presentKey = present.join("\n");
  const bandNames = namedBands(rows);
  const ageNames = namedAges(rows, now);
  const weekNames = namedWeekdays(rows);
  const leadDay = leadingDay(rows);
  const leadBand = leadingBand(rows);
  const loading = data.loading && !data.data;
  const failed = Boolean(data.error);
  useEffect(() => {
    if (loading || failed) return;
    const next = readHiddenDays(readJson(LAMP_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHiddenDays(next);
    writeJson(LAMP_KEY, next);
  }, [loading, failed, presentKey]);
  const chips = visibleDays(present, hiddenDays, showHidden);
  const bandOn = activeBand(band, bandNames);
  const ageOn = activeAge(age, ageNames);
  const weekOn = activeWeekday(week, weekNames);
  const shown = visibleLampCustomers(
    rows,
    bandArg(bandOn),
    ageArg(ageOn),
    weekdayArg(weekOn),
    selected ? dayArg(activeDay(selected, chips)) : null,
    query,
    now,
  );
  const widest = Math.max(1, ...bands.map((line) => line.count));
  const blankBand = bands.find((line) => !line.band)?.count || 0;
  const over = ages.find((line) => line.age === "over")?.count || 0;

  function store(next: string[], clear: string) {
    setHiddenDays(next);
    writeJson(LAMP_KEY, next);
    if (clear && activeDay(selected, [clear]) === clear) setSelected("");
  }

  return (
    <section className="c4-flm" aria-label={v4("flmTitle")} data-lamps="1">
      <header className="c4-flm-head">
        <div>
          <p className="c4-wxf-kicker">{v4("flmSub")}</p>
          <h2 className="c4-title">{v4("flmTitle")}</h2>
        </div>
        <p className="c4-wxf-count">{v4("flmRows")} {rows.length}</p>
      </header>
      <details className="c4-wxf-rules">
        <summary>{v4("flmRules")}</summary>
        <p className="c4-meta">{v4("flmHint")}</p>
        <p className="c4-meta">{v4("flmLocal")}</p>
        <p className="c4-meta">{v4("flmEscape")}</p>
      </details>
      <p className="c4-wxf-notice" role="status">
        <span>{v4("flmOverNotice")}</span>
        <span className="c4-wxf-count">{over}</span>
      </p>
      {leadDay ? <p className="c4-flm-lead"><span>{v4("flmLeadDay")}</span> {leadDay}</p> : null}
      {leadBand ? <p className="c4-flm-lead"><span>{v4("flmLeadBand")}</span> {bandName(v4, leadBand)}</p> : null}
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "customers")}>{v4("flmBoard")}</Link>
        <button type="button" className="c4-btn" onClick={() => download("follow-lamps.csv", lampsCsv(rows, now))}>{v4("flmCsv")}</button>
      </p>
      {loading && !rows.length && <p className="c4-meta">{v4("flmLoading")}</p>}
      {failed && !rows.length && <p className="c4-meta">{v4("flmFailed")}</p>}
      {!loading && !failed && !rows.length && <p className="c4-wxf-empty">{v4("flmNone")}</p>}
      {bands.length > 0 && (
        <section className="c4-flm-chart" aria-label={v4("flmAllBand")}>
          {bands.map((line) => {
            const share = lampShare(line.count, rows.length);
            const width = Math.max(8, Math.round((line.count / widest) * 100));
            const name = line.band || "blank";
            return (
              <p key={name} className="c4-flm-col" data-band={line.band || "blank"}>
                <span>{bandName(v4, line.band)}</span>
                <span className="c4-wxf-track" aria-hidden="true"><i style={{ width: `${width}%` }} /></span>
                <span>{line.count}</span>
                <span>{v4("flmShare")} {share}%</span>
              </p>
            );
          })}
        </section>
      )}
      <div className="c4-flm-bands" role="group" aria-label={v4("flmAllBand")}>
        <button type="button" className="c4-flm-band" data-on={bandOn === "all" ? "1" : "0"} aria-pressed={bandOn === "all"} onClick={() => { setSelected(""); setBand("all"); }}>
          <span>{v4("flmAllBand")}</span>
          <span className="c4-wxf-count">{rows.length}</span>
        </button>
        {blankBand > 0 && (
          <button type="button" className="c4-flm-band" data-on={band === "blank" ? "1" : "0"} aria-pressed={band === "blank"} onClick={() => { setSelected(""); setBand(band === "blank" ? "all" : "blank"); }}>
            <span>{v4("flmUnmarked")}</span>
            <span className="c4-wxf-count">{blankBand}</span>
          </button>
        )}
        {bandNames.map((item) => {
          const count = bands.find((line) => line.band === item)?.count || 0;
          return (
            <button key={item} type="button" className="c4-flm-band" data-on={band === item ? "1" : "0"} aria-pressed={band === item} onClick={() => { setSelected(""); setBand(band === item ? "all" : item); }}>
              <span>{bandName(v4, item)}</span>
              <span className="c4-wxf-count">{count}</span>
              <span>{v4("flmShare")} {lampShare(count, rows.length)}%</span>
            </button>
          );
        })}
      </div>
      <div className="c4-row" role="group" aria-label={v4("flmAges")}>
        <button type="button" className="c4-chip" data-on={ageOn === "all" ? "1" : "0"} aria-pressed={ageOn === "all"} onClick={() => setAge("all")}>{v4("flmAllAges")}</button>
        {ages.filter((line) => line.age).map((line) => (
          <button key={line.age} type="button" className="c4-chip" data-on={ageOn === line.age ? "1" : "0"} aria-pressed={ageOn === line.age} onClick={() => setAge(ageOn === line.age ? "all" : line.age)}>
            {ageName(v4, line.age)} {line.count}
          </button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("flmWeekdays")}>
        <button type="button" className="c4-chip" data-on={weekOn === "all" ? "1" : "0"} aria-pressed={weekOn === "all"} onClick={() => setWeek("all")}>{v4("flmWeekdays")}</button>
        {weeks.filter((line) => line.week).map((line) => (
          <button key={line.week} type="button" className="c4-chip" data-on={weekOn === line.week ? "1" : "0"} aria-pressed={weekOn === line.week} onClick={() => setWeek(weekOn === line.week ? "all" : line.week)}>
            {weekName(v4, line.week)} {line.count}
          </button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("flmShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("flmShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("flmHidden")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("flmDays")}>
        <button type="button" className="c4-chip" data-on={!selected ? "1" : "0"} aria-pressed={!selected} onClick={() => setSelected("")}>{v4("flmAll")}</button>
        {chips.map((item) => {
          const count = rows.filter((row) => dayOf(row.retentionFollowUpAt) === item).length;
          const share = lampShare(count, rows.length);
          return (
            <span key={item} className="c4-flm-pair">
              <button type="button" className="c4-chip" data-on={selected === item ? "1" : "0"} aria-pressed={selected === item} onClick={() => { setBand("all"); setSelected(selected === item ? "" : item); }}>{item}</button>
              <span className="c4-wxf-count">{count}</span>
              <span className="c4-flm-share">{v4("flmShare")} {share}%</span>
              <span className="c4-wxf-track" aria-hidden="true"><i style={{ width: `${share}%` }} /></span>
              <button type="button" className="c4-btn" onClick={() => store(toggleDay(hiddenDays, item, present), showHidden ? "" : item)}>{showHidden ? v4("flmShow") : v4("flmHide")}</button>
            </span>
          );
        })}
      </div>
      <label className="c4-lab">
        <span>{v4("flmSearch")}</span>
        <input className="c4-field" aria-label={v4("flmSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          setQuery("");
        }} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c4-wxf-empty">{v4("flmEmpty")}</p>}
      <ul className="c4-flm-rows">
        {shown.map((row) => {
          const bandMark = bandOf(row.retentionFollowUpAt) as FollowBand;
          const ageMark = ageOf(row.retentionFollowUpAt, now) as FollowAge;
          const weekMark = weekdayOf(row.retentionFollowUpAt) as FollowWeek;
          const day = dayOf(row.retentionFollowUpAt);
          const span = followSpan(row.retentionFollowUpAt, now);
          return (
            <li key={row.id} data-band={bandMark || "blank"} data-age={ageMark || "blank"} data-week={weekMark || "blank"}>
              <span className="c4-flm-face" aria-hidden="true">{day ? day.slice(8) : "—"}</span>
              <p>{row.label || row.id}</p>
              <p className="c4-meta">
                {day || v4("flmUnmarked")}
                {" · "}
                {bandName(v4, bandMark)}
                {" · "}
                {ageName(v4, ageMark)}
                {" · "}
                {weekName(v4, weekMark)}
                {span === null ? "" : ` · ${v4("flmSpan")} ${span}`}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
