"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  QUILL_KEY,
  QUILL_VIEW_KEY,
  SEAL_KEY,
  activeAge,
  activeBand,
  activeBell,
  activeDay,
  activeHue,
  activeKeeper,
  activePace,
  activeTag,
  activeWeekday,
  addQuill,
  addQuillView,
  ageArg,
  ageLines,
  ageOf,
  bandArg,
  bandLines,
  bandOf,
  bellArg,
  bulkQuillPinned,
  bulkQuillSent,
  clashQuillCount,
  dayArg,
  dayOf,
  dropQuillView,
  editQuill,
  halfOf,
  hueArg,
  hueOf,
  keeperArg,
  leadingBand,
  leadingDay,
  namedAges,
  namedBands,
  namedDays,
  namedWeekdays,
  nextQuill,
  paceArg,
  paceOf,
  quillClashIds,
  quillCopy,
  quillCounts,
  quillGap,
  quillHues,
  quillKeepers,
  quillPaces,
  quillShare,
  quillTags,
  quillTimeline,
  quillsCsv,
  readHiddenDays,
  readQuillViews,
  readQuills,
  resetQuills,
  sealShare,
  sealsCsv,
  setQuillKept,
  setQuillPinned,
  setQuillSent,
  stepQuillPace,
  tagArg,
  toggleDay,
  visibleDays,
  visibleQuills,
  visibleSealCustomers,
  watchCounts,
  watchOf,
  weekdayArg,
  weekdayLines,
  weekdayOf,
  type ContactAge,
  type ContactBand,
  type ContactWeek,
  type QuillCard,
  type QuillHue,
  type QuillPace,
  type QuillTray,
  type QuillView,
  type SealRow,
} from "@/lib/crmv4/round162";
import { useJson } from "./kit";
import { storedRole } from "./round5";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  lastContactAt?: string | null;
};

type GlanceRow = SealRow & { id: string };

const WATCHES = ["night", "day", "eve"] as const;

function hueName(v4: V4, hue: QuillHue): string {
  if (hue === "amber") return v4("qllHueAmber");
  if (hue === "slate") return v4("qllHueSlate");
  if (hue === "ivory") return v4("qllHueIvory");
  if (hue === "ink") return v4("qllHueInk");
  return v4("qllBlankHue");
}

function paceName(v4: V4, pace: QuillPace): string {
  if (pace === "slow") return v4("qllSlow");
  if (pace === "even") return v4("qllEven");
  if (pace === "brisk") return v4("qllBrisk");
  return v4("qllBlankPace");
}

function watchName(v4: V4, name: string): string {
  if (name === "night") return v4("qllNight");
  if (name === "day") return v4("qllDay");
  if (name === "eve") return v4("qllEve");
  if (name === "early") return v4("qllEarly");
  if (name === "late") return v4("qllLate");
  if (/^(?:0?[0-5])$/.test(name)) return String(Number(name));
  return v4("qllBlankBell");
}

function bandName(v4: V4, name: string): string {
  if (name === "dawn") return v4("aslDawn");
  if (name === "day") return v4("aslDay");
  if (name === "dusk") return v4("aslDusk");
  return v4("aslUnmarked");
}

function ageName(v4: V4, name: string): string {
  if (name === "fresh") return v4("aslFresh");
  if (name === "quiet") return v4("aslQuiet");
  if (name === "cold") return v4("aslCold");
  return v4("aslUnmarked");
}

function weekName(v4: V4, name: string): string {
  const key = {
    sun: "aslSun",
    mon: "aslMon",
    tue: "aslTue",
    wed: "aslWed",
    thu: "aslThu",
    fri: "aslFri",
    sat: "aslSat",
  }[name];
  return key ? v4(key as CrmV4CopyKey) : v4("aslUnmarked");
}

function auditName(v4: V4, audit: string): string {
  if (audit === "save") return v4("qllAuditSave");
  if (audit === "edit") return v4("qllAuditEdit");
  if (audit === "raise") return v4("qllAuditRaise");
  if (audit === "lower") return v4("qllAuditLower");
  if (audit === "pin") return v4("qllAuditPin");
  if (audit === "unpin") return v4("qllAuditUnpin");
  if (audit === "keep") return v4("qllAuditKeep");
  if (audit === "release") return v4("qllAuditRelease");
  if (audit === "send") return v4("qllAuditSend");
  if (audit === "recall") return v4("qllAuditRecall");
  return "";
}

function bellLabel(bell: number | null): string {
  return bell === null ? "—" : String(bell);
}

function gapLabel(v4: V4, bell: number | null, desk: string): string {
  const gap = quillGap(bell, desk);
  if (gap === null) return "";
  if (gap > 0) return `${v4("qllPast")} ${gap}`;
  if (gap < 0) return `${v4("qllAhead")} ${Math.abs(gap)}`;
  return v4("qllDue");
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
  if (pace === "brisk") return 3;
  if (pace === "even") return 2;
  if (pace === "slow") return 1;
  return 0;
}

export function QuillReminders({ v4 }: { v4: V4 }) {
  const [cards, setCards] = useState<QuillCard[]>([]);
  const [views, setViews] = useState<QuillView[]>([]);
  const [text, setText] = useState("");
  const [keeper, setKeeper] = useState("");
  const [bell, setBell] = useState("");
  const [hue, setHue] = useState("");
  const [tag, setTag] = useState("");
  const [pace, setPace] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<QuillTray>("open");
  const [keeperFilter, setKeeperFilter] = useState("all");
  const [hueFilter, setHueFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [paceFilter, setPaceFilter] = useState("all");
  const [bellFilter, setBellFilter] = useState("all");
  const [briskOnly, setBriskOnly] = useState(false);
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
    const next = readQuills(readJson(QUILL_KEY, []));
    const saved = readQuillViews(readJson(QUILL_VIEW_KEY, []));
    setCards(next);
    setViews(saved);
    writeJson(QUILL_KEY, next);
    writeJson(QUILL_VIEW_KEY, saved);
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
  const keepers = quillKeepers(cards);
  const hues = quillHues(cards);
  const tagsOn = quillTags(cards);
  const paces = quillPaces(cards);
  const bars = watchCounts(cards);
  const keeperOn = activeKeeper(keeperFilter, keepers);
  const hueOn = activeHue(hueFilter, hues);
  const tagOn = activeTag(tagFilter, tagsOn);
  const paceOn = activePace(paceFilter, paces);
  const bellOn = activeBell(bellFilter);
  const picked = bellArg(bellOn);
  const shown = visibleQuills(
    cards,
    tray,
    query,
    keeperArg(keeperOn),
    hueArg(hueOn),
    tagArg(tagOn),
    paceArg(paceOn),
    picked.exact,
    picked.watch,
    briskOnly,
    lateOnly,
    desk,
  );
  const timeline = quillTimeline(cards, query);
  const counts = quillCounts(cards, desk);
  const clashes = clashQuillCount(cards);
  const total = cards.length;
  const nextId = nextQuill(cards, desk);
  const nextCard = cards.find((card) => card.id === nextId);
  const widest = Math.max(1, ...bars);
  const pinned = cards.filter((card) => card.pinned);

  function store(next: QuillCard[]) {
    setCards(next);
    writeJson(QUILL_KEY, next);
  }

  function storeViews(next: QuillView[]) {
    setViews(next);
    writeJson(QUILL_VIEW_KEY, next);
  }

  function clearDraft() {
    setText("");
    setKeeper("");
    setBell("");
    setHue("");
    setTag("");
    setPace("");
  }

  function copyCard(card: QuillCard) {
    const body = quillCopy(card.text);
    if (!body) return;
    if (navigator.clipboard?.writeText) void navigator.clipboard.writeText(body);
    setCopied(card.id);
  }

  function applyView(view: QuillView) {
    setTray(view.tray);
    setQuery(view.query);
    setKeeperFilter(activeKeeper(view.keeper, quillKeepers(cards)));
    setHueFilter(activeHue(view.hue, quillHues(cards)));
    setTagFilter(activeTag(view.tag, quillTags(cards)));
    setPaceFilter(activePace(view.pace, quillPaces(cards)));
    setBellFilter(activeBell(view.bell));
    setBoard("cards");
    setBriskOnly(false);
    setLateOnly(false);
  }

  return (
    <section className="c4-qll" aria-label={v4("qllTitle")} data-quills="1" data-role={role}>
      <header className="c4-qll-head">
        <p className="c4-qll-plate" data-logo="mono">{v4("qllLogo")}</p>
        <div>
          <p className="c4-qll-kicker">{v4("qllSub")}</p>
          <h2 className="c4-title">{v4("qllTitle")}</h2>
        </div>
        <p className="c4-qll-count">{shown.length}</p>
      </header>
      <details className="c4-qll-rules">
        <summary>{v4("qllRules")}</summary>
        <p className="c4-meta">{v4("qllHint")}</p>
        <p className="c4-meta">{v4("qllLocal")}</p>
        <p className="c4-meta">{v4("qllBlank")}</p>
        <p className="c4-meta">{v4("qllKeeperBlank")}</p>
        <p className="c4-meta">{v4("qllBellBlank")}</p>
        <p className="c4-meta">{v4("qllHueBlank")}</p>
        <p className="c4-meta">{v4("qllTagBlank")}</p>
        <p className="c4-meta">{v4("qllPaceBlank")}</p>
        <p className="c4-meta">{v4("qllEscape")}</p>
        <p className="c4-meta">{v4("qllSlash")}</p>
        <p className="c4-meta">{v4("qllNew")}</p>
      </details>
      {viewer ? <p className="c4-qll-notice" role="status">{v4("qllViewer")}</p> : null}
      <p className="c4-qll-notice" role="status">
        <span>{v4("qllNotice")}</span>
        <span className="c4-qll-count">{counts.late}</span>
        <button type="button" className="c4-btn" aria-pressed={lateOnly} onClick={() => { setLateOnly((value) => !value); setTray("open"); setBoard("cards"); }}>
          {lateOnly ? v4("qllNoticeAll") : v4("qllNoticeOpen")}
        </button>
      </p>
      <p className="c4-qll-notice" role="status">
        <span>{v4("qllClashNotice")}</span>
        <span className="c4-qll-count">{clashes}</span>
      </p>
      {pinned.length > 0 && (
        <ul className="c4-qll-pins" aria-label={v4("qllPinned")}>
          {pinned.map((card) => (
            <li key={card.id}>
              <button type="button" className="c4-chip" onClick={() => { setQuery(card.text); setBoard("cards"); }}>{card.text}</button>
            </li>
          ))}
        </ul>
      )}
      <section className="c4-qll-kpi" aria-label={v4("qllKpi")}>
        {(["open", "kept", "sent", "pinned"] as const).map((key) => {
          const count = counts[key];
          const share = quillShare(count, total);
          const label = key === "open" ? v4("qllOpen") : key === "kept" ? v4("qllKept") : key === "sent" ? v4("qllSent") : v4("qllPinned");
          return (
            <p key={key} className="c4-qll-meter" data-tray={key}>
              <span>{label}</span>
              <strong>{count}</strong>
              <span>{v4("qllShare")} {share}%</span>
              <span className="c4-qll-track" aria-hidden="true"><i style={{ width: `${share}%` }} /></span>
            </p>
          );
        })}
      </section>
      <section className="c4-qll-chart" aria-label={v4("qllChart")}>
        <p className="c4-qll-kicker">{v4("qllChart")}</p>
        {WATCHES.map((name, index) => {
          const count = bars[index] || 0;
          const width = Math.max(8, Math.round((count / widest) * 100));
          return (
            <button key={name} type="button" className="c4-qll-col" data-on={bellOn === name ? "1" : "0"} aria-pressed={bellOn === name} onClick={() => setBellFilter(bellOn === name ? "all" : name)}>
              <span>{watchName(v4, name)}</span>
              <span className="c4-qll-bar" aria-hidden="true"><i style={{ width: `${width}%` }} /></span>
              <span>{count}</span>
            </button>
          );
        })}
      </section>
      <form className="c4-qll-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addQuill(cards, { id: `qll-${Date.now()}`, text, keeper, bell, hue, tag, pace });
        if (next === cards || next.length === cards.length) return;
        store(next);
        clearDraft();
      }}>
        <label className="c4-lab">
          <span>{v4("qllText")}</span>
          <input ref={textRef} className="c4-field" aria-label={v4("qllText")} value={text} disabled={viewer} onChange={(event) => setText(event.target.value)} onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            clearDraft();
          }} />
        </label>
        <label className="c4-lab">
          <span>{v4("qllKeeper")}</span>
          <input className="c4-field" aria-label={v4("qllKeeper")} value={keeper} disabled={viewer} onChange={(event) => setKeeper(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("qllBell")}</span>
          <input className="c4-field" inputMode="numeric" aria-label={v4("qllBell")} value={bell} disabled={viewer} onChange={(event) => setBell(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("qllHue")}</span>
          <select className="c4-select" aria-label={v4("qllHue")} value={hue} disabled={viewer} onChange={(event) => setHue(event.target.value)}>
            <option value="">{v4("qllBlankHue")}</option>
            <option value="amber">{v4("qllHueAmber")}</option>
            <option value="slate">{v4("qllHueSlate")}</option>
            <option value="ivory">{v4("qllHueIvory")}</option>
            <option value="ink">{v4("qllHueInk")}</option>
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("qllTag")}</span>
          <input className="c4-field" aria-label={v4("qllTag")} value={tag} disabled={viewer} onChange={(event) => setTag(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("qllPace")}</span>
          <select className="c4-select" aria-label={v4("qllPace")} value={pace} disabled={viewer} onChange={(event) => setPace(event.target.value)}>
            <option value="">{v4("qllBlankPace")}</option>
            <option value="slow">{v4("qllSlow")}</option>
            <option value="even">{v4("qllEven")}</option>
            <option value="brisk">{v4("qllBrisk")}</option>
          </select>
        </label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("qllAdd")}</button>
      </form>
      <div className="c4-row" role="group" aria-label={v4("qllTitle")}>
        <button type="button" className="c4-chip" data-on={tray === "open" ? "1" : "0"} aria-pressed={tray === "open"} onClick={() => setTray("open")}>{v4("qllOpen")}</button>
        <button type="button" className="c4-chip" data-on={tray === "kept" ? "1" : "0"} aria-pressed={tray === "kept"} onClick={() => setTray("kept")}>{v4("qllKept")}</button>
        <button type="button" className="c4-chip" data-on={tray === "sent" ? "1" : "0"} aria-pressed={tray === "sent"} onClick={() => setTray("sent")}>{v4("qllSent")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} aria-pressed={board === "timeline"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("qllTimeline")}</button>
        <button type="button" className="c4-chip" data-on={briskOnly ? "1" : "0"} aria-pressed={briskOnly} onClick={() => setBriskOnly((value) => !value)}>{v4("qllBriskOnly")}</button>
        <button type="button" className="c4-btn" onClick={() => download("quill-reminders.csv", quillsCsv(cards, desk))}>{v4("qllCsv")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkQuillPinned(cards, shown.map((card) => card.id), true))}>{v4("qllBulkPin")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkQuillSent(cards, shown.map((card) => card.id), true))}>{v4("qllBulkSend")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => { store(resetQuills()); setEditing(""); }}>{v4("qllReset")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("qllBells")}>
        <button type="button" className="c4-chip" data-on={bellOn === "all" ? "1" : "0"} aria-pressed={bellOn === "all"} onClick={() => setBellFilter("all")}>{v4("qllAllBells")}</button>
        <button type="button" className="c4-chip" data-on={bellOn === "blank" ? "1" : "0"} aria-pressed={bellOn === "blank"} onClick={() => setBellFilter("blank")}>{v4("qllBlankBell")}</button>
        <button type="button" className="c4-chip" data-on={bellOn === "early" ? "1" : "0"} aria-pressed={bellOn === "early"} onClick={() => setBellFilter("early")}>{v4("qllEarly")}</button>
        <button type="button" className="c4-chip" data-on={bellOn === "late" ? "1" : "0"} aria-pressed={bellOn === "late"} onClick={() => setBellFilter("late")}>{v4("qllLate")}</button>
        {["0", "2", "4"].map((slot) => (
          <button key={slot} type="button" className="c4-chip" data-on={bellOn === slot ? "1" : "0"} aria-pressed={bellOn === slot} onClick={() => setBellFilter(bellOn === slot ? "all" : slot)}>{slot}</button>
        ))}
      </div>
      <label className="c4-lab">
        <span>{v4("qllSearch")}</span>
        <input ref={searchRef} className="c4-field" aria-label={v4("qllSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          setQuery("");
        }} />
      </label>
      <div className="c4-qll-next">
        <label className="c4-lab">
          <span>{v4("qllDesk")}</span>
          <input className="c4-field" inputMode="numeric" aria-label={v4("qllDesk")} value={desk} onChange={(event) => setDesk(event.target.value)} />
        </label>
        <p className="c4-meta">
          <span>{v4("qllNext")}</span>
          {" "}
          {nextCard ? nextCard.text : v4("qllNextEmpty")}
        </p>
      </div>
      <div className="c4-row">
        <label className="c4-lab">
          <span>{v4("qllKeepers")}</span>
          <select className="c4-select" aria-label={v4("qllKeepers")} value={keeperOn} onChange={(event) => setKeeperFilter(event.target.value)}>
            <option value="all">{v4("qllAllKeepers")}</option>
            <option value="blank">{v4("qllBlankKeeper")}</option>
            {keepers.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("qllHues")}</span>
          <select className="c4-select" aria-label={v4("qllHues")} value={hueOn} onChange={(event) => setHueFilter(event.target.value)}>
            <option value="all">{v4("qllAllHues")}</option>
            <option value="blank">{v4("qllBlankHue")}</option>
            {hues.map((item) => <option key={item} value={item}>{hueName(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("qllTags")}</span>
          <select className="c4-select" aria-label={v4("qllTags")} value={tagOn} onChange={(event) => setTagFilter(event.target.value)}>
            <option value="all">{v4("qllAllTags")}</option>
            <option value="blank">{v4("qllBlankTag")}</option>
            {tagsOn.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab">
          <span>{v4("qllPaces")}</span>
          <select className="c4-select" aria-label={v4("qllPaces")} value={paceOn} onChange={(event) => setPaceFilter(event.target.value)}>
            <option value="all">{v4("qllAllPaces")}</option>
            <option value="blank">{v4("qllBlankPace")}</option>
            {paces.map((item) => <option key={item} value={item}>{paceName(v4, item)}</option>)}
          </select>
        </label>
      </div>
      <form className="c4-qll-view" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addQuillView(views, {
          id: `view-${Date.now()}`,
          name: viewName,
          tray,
          query,
          keeper: keeperOn,
          hue: hueOn,
          tag: tagOn,
          pace: paceOn,
          bell: bellOn,
        });
        if (next.length === views.length) return;
        storeViews(next);
        setViewName("");
      }}>
        <label className="c4-lab">
          <span>{v4("qllViewName")}</span>
          <input className="c4-field" aria-label={v4("qllViewName")} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("qllSaveView")}</button>
      </form>
      <section aria-label={v4("qllViews")}>
        <p className="c4-qll-kicker">{v4("qllViews")}</p>
        {!views.length && <p className="c4-qll-empty">{v4("qllViewEmpty")}</p>}
        <ul className="c4-qll-views">
          {views.map((view) => (
            <li key={view.id}>
              <button type="button" className="c4-btn" onClick={() => applyView(view)}>{view.name}</button>
              <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropQuillView(views, view.id))}>{v4("qllDropView")}</button>
            </li>
          ))}
        </ul>
      </section>
      {board === "cards" && !shown.length && <p className="c4-qll-empty">{v4("qllEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-qll-rows">
          {shown.map((card) => {
            const clashesOn = quillClashIds(cards, card.id);
            const gap = gapLabel(v4, card.bell, desk);
            const half = halfOf(card.bell);
            const editingCard = editing === card.id;
            return (
              <li key={card.id} data-pace={card.pace || "blank"} data-hue={card.hue || "blank"} data-watch={watchOf(card.bell)}>
                <span className="c4-qll-bell" aria-hidden="true">{bellLabel(card.bell)}</span>
                <span className="c4-qll-marks" aria-hidden="true">
                  {[0, 1, 2].map((index) => <i key={index} data-on={index < marks(card.pace) ? "1" : "0"} />)}
                </span>
                <div>
                  {editingCard ? (
                    <form className="c4-row" onSubmit={(event) => {
                      event.preventDefault();
                      if (viewer) return;
                      store(editQuill(cards, card.id, draft));
                      setEditing("");
                    }}>
                      <input className="c4-field" aria-label={v4("qllEdit")} value={draft} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("qllSaveEdit")}</button>
                    </form>
                  ) : <p>{card.text}</p>}
                  <p className="c4-meta">
                    {card.keeper || v4("qllBlankKeeper")}
                    {" · "}
                    {bellLabel(card.bell)}
                    {" · "}
                    {hueName(v4, hueOf(card.hue))}
                    {" · "}
                    {card.tag || v4("qllBlankTag")}
                    {" · "}
                    {paceName(v4, paceOf(card.pace))}
                    {half === "blank" ? "" : ` · ${half === "early" ? v4("qllEarly") : v4("qllLate")}`}
                    {gap ? ` · ${gap}` : ""}
                    {auditName(v4, card.audit) ? ` · ${v4("qllAudit")} ${auditName(v4, card.audit)}` : ""}
                    {" · "}
                    {clashesOn.length ? `${v4("qllClash")} ${clashesOn.length}` : v4("qllClashNone")}
                  </p>
                </div>
                <div className="c4-row">
                  <button type="button" className="c4-btn" onClick={() => copyCard(card)}>{copied === card.id ? v4("qllCopied") : v4("qllCopy")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.text); }}>{v4("qllEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(stepQuillPace(cards, card.id, 1))}>{v4("qllRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(stepQuillPace(cards, card.id, -1))}>{v4("qllLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.pinned} onClick={() => store(setQuillPinned(cards, card.id, !card.pinned))}>{card.pinned ? v4("qllUnpin") : v4("qllPin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.kept} onClick={() => store(setQuillKept(cards, card.id, !card.kept))}>{card.kept ? v4("qllRelease") : v4("qllKeep")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.sent} onClick={() => store(setQuillSent(cards, card.id, !card.sent))}>{card.sent ? v4("qllRecall") : v4("qllSend")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {board === "timeline" && (
        <ol className="c4-qll-time">
          {timeline.map((card) => (
            <li key={card.id} data-watch={watchOf(card.bell)}>
              <span className="c4-qll-clock">{bellLabel(card.bell)}</span>
              <p>{card.text}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export function ContactSeals({ base, v4 }: { base: string; v4: V4 }) {
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
      lastContactAt: row.lastContactAt,
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
    const next = readHiddenDays(readJson(SEAL_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHiddenDays(next);
    writeJson(SEAL_KEY, next);
  }, [loading, failed, presentKey]);
  const chips = visibleDays(present, hiddenDays, showHidden);
  const bandOn = activeBand(band, bandNames);
  const ageOn = activeAge(age, ageNames);
  const weekOn = activeWeekday(week, weekNames);
  const shown = visibleSealCustomers(
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
  const cold = ages.find((line) => line.age === "cold")?.count || 0;

  function store(next: string[], clear: string) {
    setHiddenDays(next);
    writeJson(SEAL_KEY, next);
    if (clear && activeDay(selected, [clear]) === clear) setSelected("");
  }

  return (
    <section className="c4-asl" aria-label={v4("aslTitle")} data-seals="1">
      <header className="c4-asl-head">
        <div>
          <p className="c4-qll-kicker">{v4("aslSub")}</p>
          <h2 className="c4-title">{v4("aslTitle")}</h2>
        </div>
        <p className="c4-qll-count">{v4("aslRows")} {rows.length}</p>
      </header>
      <details className="c4-qll-rules">
        <summary>{v4("aslRules")}</summary>
        <p className="c4-meta">{v4("aslHint")}</p>
        <p className="c4-meta">{v4("aslLocal")}</p>
        <p className="c4-meta">{v4("aslEscape")}</p>
      </details>
      <p className="c4-qll-notice" role="status">
        <span>{v4("aslColdNotice")}</span>
        <span className="c4-qll-count">{cold}</span>
      </p>
      {leadDay ? <p className="c4-asl-lead"><span>{v4("aslLeadDay")}</span> {leadDay}</p> : null}
      {leadBand ? <p className="c4-asl-lead"><span>{v4("aslLeadBand")}</span> {bandName(v4, leadBand)}</p> : null}
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "customers")}>{v4("aslBoard")}</Link>
        <button type="button" className="c4-btn" onClick={() => download("contact-seals.csv", sealsCsv(rows, now))}>{v4("aslCsv")}</button>
      </p>
      {loading && !rows.length && <p className="c4-meta">{v4("aslLoading")}</p>}
      {failed && !rows.length && <p className="c4-meta">{v4("aslFailed")}</p>}
      {!loading && !failed && !rows.length && <p className="c4-qll-empty">{v4("aslNone")}</p>}
      {bands.length > 0 && (
        <section className="c4-asl-chart" aria-label={v4("aslAllBand")}>
          {bands.map((line) => {
            const share = sealShare(line.count, rows.length);
            const width = Math.max(8, Math.round((line.count / widest) * 100));
            const name = line.band || "blank";
            return (
              <p key={name} className="c4-asl-col" data-band={line.band || "blank"}>
                <span>{bandName(v4, line.band)}</span>
                <span className="c4-qll-track" aria-hidden="true"><i style={{ width: `${width}%` }} /></span>
                <span>{line.count}</span>
                <span>{v4("aslShare")} {share}%</span>
              </p>
            );
          })}
        </section>
      )}
      <div className="c4-asl-bands" role="group" aria-label={v4("aslAllBand")}>
        <button type="button" className="c4-asl-band" data-on={bandOn === "all" ? "1" : "0"} aria-pressed={bandOn === "all"} onClick={() => { setSelected(""); setBand("all"); }}>
          <span>{v4("aslAllBand")}</span>
          <span className="c4-qll-count">{rows.length}</span>
        </button>
        {blankBand > 0 && (
          <button type="button" className="c4-asl-band" data-on={band === "blank" ? "1" : "0"} aria-pressed={band === "blank"} onClick={() => { setSelected(""); setBand(band === "blank" ? "all" : "blank"); }}>
            <span>{v4("aslUnmarked")}</span>
            <span className="c4-qll-count">{blankBand}</span>
          </button>
        )}
        {bandNames.map((item) => {
          const count = bands.find((line) => line.band === item)?.count || 0;
          return (
            <button key={item} type="button" className="c4-asl-band" data-on={band === item ? "1" : "0"} aria-pressed={band === item} onClick={() => { setSelected(""); setBand(band === item ? "all" : item); }}>
              <span>{bandName(v4, item)}</span>
              <span className="c4-qll-count">{count}</span>
              <span>{v4("aslShare")} {sealShare(count, rows.length)}%</span>
            </button>
          );
        })}
      </div>
      <div className="c4-row" role="group" aria-label={v4("aslAges")}>
        <button type="button" className="c4-chip" data-on={ageOn === "all" ? "1" : "0"} aria-pressed={ageOn === "all"} onClick={() => setAge("all")}>{v4("aslAllAges")}</button>
        {ages.filter((line) => line.age).map((line) => (
          <button key={line.age} type="button" className="c4-chip" data-on={ageOn === line.age ? "1" : "0"} aria-pressed={ageOn === line.age} onClick={() => setAge(ageOn === line.age ? "all" : line.age)}>
            {ageName(v4, line.age)} {line.count}
          </button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("aslWeek")}>
        <button type="button" className="c4-chip" data-on={weekOn === "all" ? "1" : "0"} aria-pressed={weekOn === "all"} onClick={() => setWeek("all")}>{v4("aslWeek")}</button>
        {weeks.filter((line) => line.week).map((line) => (
          <button key={line.week} type="button" className="c4-chip" data-on={weekOn === line.week ? "1" : "0"} aria-pressed={weekOn === line.week} onClick={() => setWeek(weekOn === line.week ? "all" : line.week)}>
            {weekName(v4, line.week)} {line.count}
          </button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("aslShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("aslShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("aslHidden")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("aslDays")}>
        <button type="button" className="c4-chip" data-on={!selected ? "1" : "0"} aria-pressed={!selected} onClick={() => setSelected("")}>{v4("aslAll")}</button>
        {chips.map((item) => {
          const count = rows.filter((row) => dayOf(row.lastContactAt) === item).length;
          const share = sealShare(count, rows.length);
          return (
            <span key={item} className="c4-asl-pair">
              <button type="button" className="c4-chip" data-on={selected === item ? "1" : "0"} aria-pressed={selected === item} onClick={() => { setBand("all"); setSelected(selected === item ? "" : item); }}>{item}</button>
              <span className="c4-qll-count">{count}</span>
              <span className="c4-asl-share">{v4("aslShare")} {share}%</span>
              <span className="c4-qll-track" aria-hidden="true"><i style={{ width: `${share}%` }} /></span>
              <button type="button" className="c4-btn" onClick={() => store(toggleDay(hiddenDays, item, present), showHidden ? "" : item)}>{showHidden ? v4("aslShow") : v4("aslHide")}</button>
            </span>
          );
        })}
      </div>
      <label className="c4-lab">
        <span>{v4("aslSearch")}</span>
        <input className="c4-field" aria-label={v4("aslSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          setQuery("");
        }} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c4-qll-empty">{v4("aslEmpty")}</p>}
      <ul className="c4-asl-rows">
        {shown.map((row) => {
          const bandMark = bandOf(row.lastContactAt) as ContactBand;
          const ageMark = ageOf(row.lastContactAt, now) as ContactAge;
          const weekMark = weekdayOf(row.lastContactAt) as ContactWeek;
          const day = dayOf(row.lastContactAt);
          return (
            <li key={row.id} data-band={bandMark || "blank"} data-age={ageMark || "blank"} data-week={weekMark || "blank"}>
              <span className="c4-asl-face" aria-hidden="true">{day ? day.slice(8) : "—"}</span>
              <p>{row.label || row.id}</p>
              <p className="c4-meta">
                {day || v4("aslUnmarked")}
                {" · "}
                {bandName(v4, bandMark)}
                {" · "}
                {ageName(v4, ageMark)}
                {" · "}
                {weekName(v4, weekMark)}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
