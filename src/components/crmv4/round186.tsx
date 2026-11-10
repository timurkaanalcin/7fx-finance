"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  OWNER_KEY,
  OWNER_REVIEW_KEY,
  SLATE_KEY,
  SLATE_VIEW_KEY,
  activeHour,
  activeMark,
  activeOwner,
  activeOwnerBand,
  activeOwnerParity,
  activeTempo,
  activeTint,
  activeWait,
  activeWeight,
  addSlate,
  addSlateView,
  bulkOwnerReview,
  bulkSlateDone,
  bulkSlatePin,
  bulkSlateTint,
  catalogOwner,
  catalogOwnerCount,
  clashHourCount,
  cycleTempo,
  dropSlateView,
  editSlate,
  editSlateNote,
  evenOwner,
  evenOwnerCount,
  fairOwner,
  homeMark,
  hourArg,
  hourGap,
  lateSlate,
  leadingOwner,
  leadingOwnerParity,
  markArg,
  nextSlate,
  ownerArg,
  ownerBand,
  ownerBandArg,
  ownerCopy,
  ownerParity,
  ownerParityArg,
  ownerRowsCsv,
  ownerShare,
  ownerState,
  ownersCsv,
  presentOwners,
  readHiddenOwners,
  readReviewedOwners,
  readSlateViews,
  readSlates,
  resetSlates,
  setSlateDone,
  setSlateHold,
  setSlatePin,
  sharedOwnerCount,
  slateCopy,
  slateCounts,
  slateMarks,
  slateOwners,
  slateShare,
  slateTempos,
  slateTimeline,
  slatesCsv,
  soonSlate,
  suggestOwner,
  suggestTint,
  suggestWait,
  tempoArg,
  tintArg,
  tintCounts,
  toggleOwner,
  toggleOwnerReview,
  usedHours,
  visibleOwnerBands,
  visibleOwnerCustomers,
  visibleSlates,
  waitArg,
  weightArg,
  weightClashCount,
  wideOwner,
  wideOwnerCount,
  type OwnerRow,
  type OwnerShape,
  type Slate,
  type SlateTempo,
  type SlateTint,
  type SlateTray,
  type SlateView,
} from "@/lib/crmv4/round186";
import { useJson } from "./kit";
import { storedRole } from "./round5";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  assigneeId?: string | null;
};

type GlanceRow = OwnerRow & { id: string };

const TINTS = ["pearl", "soot", "gilt", "mist"] as const;
const BANDS = ["stub", "slip", "plate", "wide"] as const;

function tintName(v4: V4, tint: SlateTint | string): string {
  if (tint === "pearl") return v4("sltPearl");
  if (tint === "soot") return v4("sltSoot");
  if (tint === "gilt") return v4("sltGilt");
  if (tint === "mist") return v4("sltMist");
  return v4("sltBlankTint");
}

function tempoName(v4: V4, tempo: SlateTempo | string): string {
  if (tempo === "hush") return v4("sltTempoHush");
  if (tempo === "walk") return v4("sltTempoWalk");
  if (tempo === "run") return v4("sltTempoRun");
  return v4("sltBlankTempo");
}

function hourName(v4: V4, name: string): string {
  if (name === "night") return v4("sltNight");
  if (name === "day") return v4("sltDay");
  if (name === "eve") return v4("sltEve");
  if (name === "peak") return v4("sltPeak");
  if (name === "quiet") return v4("sltQuiet");
  if (/^(?:[0-9]|1[0-9]|2[0-3])$/.test(name)) return name;
  return v4("sltBlankHour");
}

function weightName(v4: V4, weight: number | null): string {
  if (weight === 2) return v4("sltWeight2");
  if (weight === 4) return v4("sltWeight4");
  if (weight === 8) return v4("sltWeight8");
  return v4("sltBlankWeight");
}

function waitName(v4: V4, wait: number | null): string {
  if (wait === 10) return v4("sltWait10");
  if (wait === 30) return v4("sltWait30");
  if (wait === 60) return v4("sltWait60");
  return v4("sltBlankWait");
}

function bandName(v4: V4, name: string): string {
  if (name === "stub") return v4("ownStub");
  if (name === "slip") return v4("ownSlip");
  if (name === "plate") return v4("ownPlate");
  if (name === "wide") return v4("ownWide");
  if (name === "blank") return v4("ownClear");
  return v4("ownUnmarked");
}

function parityName(v4: V4, name: string): string {
  if (name === "even") return v4("ownEven");
  if (name === "odd") return v4("ownOdd");
  return v4("ownUnmarked");
}

function auditName(v4: V4, audit: string): string {
  const key = {
    save: "sltAuditSave",
    edit: "sltAuditEdit",
    tempo: "sltAuditTempo",
    pin: "sltAuditPin",
    unpin: "sltAuditUnpin",
    hold: "sltAuditHold",
    lift: "sltAuditLift",
    done: "sltAuditDone",
    undo: "sltAuditUndo",
    tint: "sltAuditTint",
  }[audit];
  return key ? v4(key as CrmV4CopyKey) : "";
}

function gapLabel(v4: V4, hour: number | null, desk: string): string {
  const gap = hourGap(hour, desk);
  if (gap === null) return "";
  if (gap > 0) return `${v4("sltPast")} ${gap}`;
  if (gap < 0) return `${v4("sltAhead")} ${Math.abs(gap)}`;
  return v4("sltDue");
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

export function SlateWatches({ v4 }: { v4: V4 }) {
  const [cards, setCards] = useState<Slate[]>([]);
  const [views, setViews] = useState<SlateView[]>([]);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [owner, setOwner] = useState("");
  const [hour, setHour] = useState("");
  const [tint, setTint] = useState("");
  const [mark, setMark] = useState("");
  const [tempo, setTempo] = useState("");
  const [weight, setWeight] = useState("");
  const [wait, setWait] = useState("");
  const [roster, setRoster] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<SlateTray>("open");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [tintFilter, setTintFilter] = useState("all");
  const [markFilter, setMarkFilter] = useState("all");
  const [tempoFilter, setTempoFilter] = useState("all");
  const [hourFilter, setHourFilter] = useState("all");
  const [weightFilter, setWeightFilter] = useState("all");
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
  const [moveTint, setMoveTint] = useState("pearl");
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  useEffect(() => {
    const next = readSlates(readJson(SLATE_KEY, []));
    const saved = readSlateViews(readJson(SLATE_VIEW_KEY, []));
    setCards(next);
    setViews(saved);
    writeJson(SLATE_KEY, next);
    writeJson(SLATE_VIEW_KEY, saved);
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
  function store(next: Slate[]) {
    const saved = readSlates(next);
    setCards(saved);
    writeJson(SLATE_KEY, saved);
    setPicked((ids) => ids.filter((id) => saved.some((card) => card.id === id)));
  }
  const owners = slateOwners(cards);
  const marks = slateMarks(cards);
  const tempos = slateTempos(cards);
  const bars = tintCounts(cards);
  const ownerOn = activeOwner(ownerFilter, owners);
  const tintOn = activeTint(tintFilter, TINTS);
  const markOn = activeMark(markFilter, marks);
  const tempoOn = activeTempo(tempoFilter, tempos);
  const hourOn = activeHour(hourFilter);
  const weightOn = activeWeight(weightFilter);
  const waitOn = activeWait(waitFilter);
  const pickedHour = hourArg(hourOn);
  const shown = visibleSlates(
    cards,
    tray,
    query,
    ownerArg(ownerOn),
    tintArg(tintOn),
    markArg(markOn),
    tempoArg(tempoOn),
    pickedHour.exact,
    pickedHour.pick,
    weightArg(weightOn),
    waitArg(waitOn),
    hushOnly,
    peakOnly,
    homeOnly,
  );
  const timeline = slateTimeline(cards, query);
  const counts = slateCounts(cards, desk);
  const clashes = clashHourCount(cards);
  const weights = weightClashCount(cards);
  const nextId = nextSlate(cards, desk);
  const nextCard = cards.find((card) => card.id === nextId);
  const suggestedTint = suggestTint(cards);
  const suggestedOwner = suggestOwner(cards);
  const suggestedWait = suggestWait(cards);
  const fair = fairOwner(cards, roster);
  const total = cards.length;
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  function clearDraft() {
    setTitle("");
    setNote("");
    setOwner("");
    setHour("");
    setTint("");
    setMark("");
    setTempo("");
    setWeight("");
    setWait("");
    setQuery("");
    setEditing("");
  }
  return (
    <section className="c4-slt" aria-label={v4("sltTitle")} data-slates="1" data-role={role}>
      <header className="c4-slt-mast">
        <div>
          <p className="c4-slt-kicker">{v4("sltSub")}</p>
          <h2 className="c4-title">{v4("sltTitle")}</h2>
        </div>
        <p className="c4-slt-plate" data-logo="mono">{v4("sltLogo")}</p>
      </header>
      <p className="c4-slt-rules">{v4("sltHint")}</p>
      <p className="c4-meta">{v4("sltLocal")}</p>
      <p className="c4-meta">{v4("sltNew")} {v4("sltSlash")} {v4("sltEscape")}</p>
      {viewer && <p className="c4-slt-notice" data-viewer="1">{v4("sltViewer")}</p>}
      {counts.peak > 0 && (
        <div className="c4-slt-bells">
          <p className="c4-slt-notice">{v4("sltNotice")} · {counts.peak}</p>
          <button type="button" className="c4-btn" onClick={() => setPeakOnly((on) => !on)}>{peakOnly ? v4("sltNoticeAll") : v4("sltNoticePeak")}</button>
        </div>
      )}
      <dl className="c4-slt-kpi" aria-label={v4("sltKpi")}>
        <div><dt>{v4("sltOpen")}</dt><dd>{counts.open}</dd></div>
        <div><dt>{v4("sltHeld")}</dt><dd>{counts.held}</dd></div>
        <div><dt>{v4("sltDoneTray")}</dt><dd>{counts.done}</dd></div>
        <div><dt>{v4("sltPinned")}</dt><dd>{counts.pinned}</dd></div>
        <div><dt>{v4("sltPeak")}</dt><dd>{counts.peak}</dd></div>
        <div><dt>{v4("sltLate")}</dt><dd>{counts.late}</dd></div>
        <div><dt>{v4("sltSoon")}</dt><dd>{counts.soon}</dd></div>
        <div><dt>{v4("sltHomeShare")}</dt><dd>{slateShare(counts.home, total)}%</dd></div>
      </dl>
      <div className="c4-slt-chart" aria-label={v4("sltTints")}>
        {bars.map((bar) => (
          <div key={bar.tint} className="c4-slt-col" data-on={tintOn === bar.tint ? "1" : "0"}>
            <span className="c4-slt-swatch" data-tint={bar.tint} />
            <div className="c4-slt-track" aria-hidden="true"><i style={{ height: `${Math.round((bar.count / maxBar) * 100)}%` }} /></div>
            <button type="button" className="c4-btn" onClick={() => setTintFilter(bar.tint)}>{tintName(v4, bar.tint)} · {bar.count}</button>
          </div>
        ))}
        {!bars.length && <p className="c4-empty-gold">{v4("sltEmpty")}</p>}
      </div>
      <div className="c4-slt-suggest">
        <p>{v4("sltSuggestTint")} · {tintName(v4, suggestedTint)}</p>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => setTint(suggestedTint)}>{v4("sltUseTint")}</button>
        <p>{v4("sltSuggestOwner")} · {suggestedOwner || v4("sltBlankOwner")}</p>
        <button type="button" className="c4-btn" disabled={viewer || !suggestedOwner} onClick={() => setOwner(suggestedOwner)}>{v4("sltUseOwner")}</button>
        <p>{v4("sltSuggestWait")} · {waitName(v4, suggestedWait)}</p>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => setWait(String(suggestedWait))}>{v4("sltUseWait")}</button>
        <p>{v4("sltAssign")} · {fair || v4("sltBlankOwner")}</p>
        <button type="button" className="c4-btn" disabled={viewer || !fair} onClick={() => setOwner(fair)}>{v4("sltAssign")}</button>
      </div>
      <p className="c4-meta">{v4("sltHourUse")} · {usedHours(cards)} · {clashes ? `${v4("sltClash")} · ${clashes}` : v4("sltClashNone")} · {weights ? `${v4("sltWeightClash")} · ${weights}` : v4("sltWeightClashNone")}</p>
      <p className="c4-meta">{v4("sltNext")} · {nextCard ? nextCard.title : v4("sltNextNone")}</p>
      <form className="c4-slt-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addSlate(cards, { id: `slt-${Date.now()}`, title, note, owner, hour, tint, mark, tempo, weight, wait });
        if (next.length === cards.length && title.trim()) return;
        store(next);
        setTitle("");
        setNote("");
      }}>
        <label className="c4-lab"><span>{v4("sltLine")}</span>
          <input ref={titleRef} className="c4-field" aria-label={v4("sltLine")} value={title} disabled={viewer} onChange={(event) => setTitle(event.target.value)} onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            clearDraft();
          }} />
        </label>
        <label className="c4-lab"><span>{v4("sltNote")}</span>
          <input className="c4-field" aria-label={v4("sltNote")} value={note} disabled={viewer} onChange={(event) => setNote(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("sltOwner")}</span>
          <input className="c4-field" aria-label={v4("sltOwner")} value={owner} disabled={viewer} onChange={(event) => setOwner(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("sltHour")}</span>
          <input className="c4-field" aria-label={v4("sltHour")} inputMode="numeric" value={hour} disabled={viewer} onChange={(event) => setHour(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("sltTint")}</span>
          <select className="c4-field" aria-label={v4("sltTint")} value={tint} disabled={viewer} onChange={(event) => setTint(event.target.value)}>
            <option value="">{v4("sltBlankTint")}</option>
            {TINTS.map((item) => <option key={item} value={item}>{tintName(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("sltMark")}</span>
          <input className="c4-field" aria-label={v4("sltMark")} value={mark} disabled={viewer} onChange={(event) => setMark(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("sltTempo")}</span>
          <select className="c4-field" aria-label={v4("sltTempo")} value={tempo} disabled={viewer} onChange={(event) => setTempo(event.target.value)}>
            <option value="">{v4("sltBlankTempo")}</option>
            <option value="hush">{v4("sltTempoHush")}</option>
            <option value="walk">{v4("sltTempoWalk")}</option>
            <option value="run">{v4("sltTempoRun")}</option>
          </select>
        </label>
        <label className="c4-lab"><span>{v4("sltWeight")}</span>
          <input className="c4-field" aria-label={v4("sltWeight")} inputMode="numeric" value={weight} disabled={viewer} onChange={(event) => setWeight(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("sltWait")}</span>
          <input className="c4-field" aria-label={v4("sltWait")} inputMode="numeric" value={wait} disabled={viewer} onChange={(event) => setWait(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("sltRoster")}</span>
          <input className="c4-field" aria-label={v4("sltRoster")} value={roster} disabled={viewer} onChange={(event) => setRoster(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn c4-btn-hot" disabled={viewer}>{v4("sltAdd")}</button>
      </form>
      <p className="c4-meta">{v4("sltBlank")} {v4("sltHourBlank")}</p>
      <div className="c4-slt-filters">
        {(["open", "held", "done"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>
            {item === "open" ? v4("sltOpen") : item === "held" ? v4("sltHeld") : v4("sltDoneTray")}
          </button>
        ))}
        <label className="c4-lab"><span>{v4("sltSearch")}</span>
          <input ref={searchRef} className="c4-field" aria-label={v4("sltSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            clearDraft();
          }} />
        </label>
        <label className="c4-lab"><span>{v4("sltDeskHour")}</span>
          <input className="c4-field" aria-label={v4("sltDeskHour")} inputMode="numeric" value={desk} onChange={(event) => setDesk(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("sltOwners")}</span>
          <select className="c4-field" aria-label={v4("sltAllOwners")} value={ownerOn} onChange={(event) => setOwnerFilter(event.target.value)}>
            <option value="all">{v4("sltAllOwners")}</option>
            <option value="blank">{v4("sltBlankOwner")}</option>
            {owners.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("sltTints")}</span>
          <select className="c4-field" aria-label={v4("sltAllTints")} value={tintOn} onChange={(event) => setTintFilter(event.target.value)}>
            <option value="all">{v4("sltAllTints")}</option>
            <option value="blank">{v4("sltBlankTint")}</option>
            {TINTS.map((item) => <option key={item} value={item}>{tintName(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("sltMarks")}</span>
          <select className="c4-field" aria-label={v4("sltAllMarks")} value={markOn} onChange={(event) => setMarkFilter(event.target.value)}>
            <option value="all">{v4("sltAllMarks")}</option>
            <option value="blank">{v4("sltBlankMark")}</option>
            {marks.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("sltTempos")}</span>
          <select className="c4-field" aria-label={v4("sltAllTempos")} value={tempoOn} onChange={(event) => setTempoFilter(event.target.value)}>
            <option value="all">{v4("sltAllTempos")}</option>
            <option value="blank">{v4("sltBlankTempo")}</option>
            {tempos.map((item) => <option key={item} value={item}>{tempoName(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("sltHours")}</span>
          <select className="c4-field" aria-label={v4("sltAllHours")} value={hourOn} onChange={(event) => setHourFilter(event.target.value)}>
            <option value="all">{v4("sltAllHours")}</option>
            {["blank", "night", "day", "eve", "peak", "quiet", "0", "6", "9", "16", "22"].map((item) => <option key={item} value={item}>{hourName(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("sltWeights")}</span>
          <select className="c4-field" aria-label={v4("sltAllWeights")} value={weightOn} onChange={(event) => setWeightFilter(event.target.value)}>
            <option value="all">{v4("sltAllWeights")}</option>
            <option value="blank">{v4("sltBlankWeight")}</option>
            <option value="2">{v4("sltWeight2")}</option>
            <option value="4">{v4("sltWeight4")}</option>
            <option value="8">{v4("sltWeight8")}</option>
          </select>
        </label>
        <label className="c4-lab"><span>{v4("sltWaits")}</span>
          <select className="c4-field" aria-label={v4("sltAllWaits")} value={waitOn} onChange={(event) => setWaitFilter(event.target.value)}>
            <option value="all">{v4("sltAllWaits")}</option>
            <option value="blank">{v4("sltBlankWait")}</option>
            <option value="10">{v4("sltWait10")}</option>
            <option value="30">{v4("sltWait30")}</option>
            <option value="60">{v4("sltWait60")}</option>
          </select>
        </label>
        <button type="button" className="c4-chip" data-on={hushOnly ? "1" : "0"} onClick={() => setHushOnly((on) => !on)}>{v4("sltHushOnly")}</button>
        <button type="button" className="c4-chip" data-on={homeOnly ? "1" : "0"} onClick={() => setHomeOnly((on) => !on)}>{homeOnly ? v4("sltHomeOnly") : v4("sltHomeAll")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard((item) => item === "cards" ? "timeline" : "cards")}>{board === "cards" ? v4("sltTimeline") : v4("sltCards")}</button>
      </div>
      <form className="c4-slt-views" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addSlateView(views, {
          id: `view-${Date.now()}`,
          name: viewName,
          tray,
          query,
          owner: ownerOn,
          tint: tintOn,
          mark: markOn,
          tempo: tempoOn,
          hour: hourOn,
          weight: weightOn,
          wait: waitOn,
        });
        setViews(next);
        writeJson(SLATE_VIEW_KEY, next);
        setViewName("");
      }}>
        <label className="c4-lab"><span>{v4("sltViewName")}</span>
          <input className="c4-field" aria-label={v4("sltViewName")} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("sltSaveView")}</button>
        <ul aria-label={v4("sltViews")}>
          {views.map((view) => (
            <li key={view.id}>
              <button type="button" className="c4-btn" onClick={() => {
                setTray(view.tray);
                setQuery(view.query);
                setOwnerFilter(view.owner);
                setTintFilter(view.tint);
                setMarkFilter(view.mark);
                setTempoFilter(view.tempo);
                setHourFilter(view.hour);
                setWeightFilter(view.weight);
                setWaitFilter(view.wait);
              }}>{view.name}</button>
              <button type="button" className="c4-btn" disabled={viewer} onClick={() => {
                const next = dropSlateView(views, view.id);
                setViews(next);
                writeJson(SLATE_VIEW_KEY, next);
              }}>{v4("sltDropView")}</button>
            </li>
          ))}
        </ul>
      </form>
      <div className="c4-row">
        <button type="button" className="c4-btn" onClick={() => setPicked(shown.map((card) => card.id))}>{v4("sltPickAll")}</button>
        <button type="button" className="c4-btn" onClick={() => setPicked([])}>{v4("sltPickNone")}</button>
        <span className="c4-meta">{v4("sltPicked")} · {picked.length}</span>
        <select className="c4-field" aria-label={v4("sltBulkTint")} value={moveTint} disabled={viewer} onChange={(event) => setMoveTint(event.target.value)}>
          {TINTS.map((item) => <option key={item} value={item}>{tintName(v4, item)}</option>)}
        </select>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkSlateTint(cards, picked, moveTint))}>{v4("sltBulkTint")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkSlatePin(cards, picked, true))}>{v4("sltBulkPin")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkSlateDone(cards, picked, true))}>{v4("sltBulkDone")}</button>
        <button type="button" className="c4-btn" onClick={() => download("slate-watches.csv", slatesCsv(cards, desk))}>{v4("sltCsv")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(resetSlates())}>{v4("sltReset")}</button>
      </div>
      {board === "timeline" ? (
        <ol className="c4-slt-timeline" aria-label={v4("sltTimeline")}>
          {timeline.map((card) => <li key={card.id} data-hour={card.hour}>{card.hour} · {card.title}</li>)}
          {!timeline.length && <li className="c4-empty-gold">{v4("sltEmpty")}</li>}
        </ol>
      ) : (
        <ul className="c4-slt-cards">
          {shown.map((card) => {
            const openEdit = editing === card.id;
            return (
              <li key={card.id} data-tint={card.tint || "blank"} data-tempo={card.tempo || "blank"} data-pinned={card.pinned ? "1" : "0"} data-late={lateSlate(card, desk) ? "1" : "0"} data-soon={soonSlate(card) ? "1" : "0"} data-home={homeMark(card.mark) ? "1" : "0"}>
                <label className="c4-row">
                  <input type="checkbox" checked={picked.includes(card.id)} aria-label={card.title} onChange={(event) => setPicked((ids) => event.target.checked ? [...ids, card.id] : ids.filter((id) => id !== card.id))} />
                  {openEdit ? (
                    <input className="c4-field" aria-label={v4("sltEdit")} value={draft} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                  ) : <strong>{card.title}</strong>}
                </label>
                <p className="c4-meta">{card.owner || v4("sltBlankOwner")} · {card.hour ?? v4("sltBlankHour")} · {tintName(v4, card.tint)} · {card.mark || v4("sltBlankMark")} · {tempoName(v4, card.tempo)} · {weightName(v4, card.weight)} · {waitName(v4, card.wait)}</p>
                {openEdit ? (
                  <input className="c4-field" aria-label={v4("sltNote")} value={noteDraft} disabled={viewer} onChange={(event) => setNoteDraft(event.target.value)} />
                ) : card.note && <p>{card.note}</p>}
                <p className="c4-meta">{gapLabel(v4, card.hour, desk)} {auditName(v4, card.audit)}</p>
                <div className="c4-row">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSlatePin(cards, card.id, !card.pinned))}>{card.pinned ? v4("sltUnpin") : v4("sltPin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSlateHold(cards, card.id, !card.held))}>{card.held ? v4("sltLift") : v4("sltHold")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSlateDone(cards, card.id, !card.done))}>{card.done ? v4("sltUndo") : v4("sltDone")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cycleTempo(cards, card.id))}>{v4("sltTempoUp")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => {
                    if (openEdit) {
                      store(editSlateNote(editSlate(cards, card.id, draft), card.id, noteDraft));
                      setEditing("");
                      return;
                    }
                    setEditing(card.id);
                    setDraft(card.title);
                    setNoteDraft(card.note);
                  }}>{openEdit ? v4("sltAdd") : v4("sltEdit")}</button>
                  <button type="button" className="c4-btn" onClick={() => {
                    void navigator.clipboard?.writeText(slateCopy(card));
                    setCopied(card.id);
                  }}>{copied === card.id ? v4("sltCopied") : v4("sltCopy")}</button>
                </div>
              </li>
            );
          })}
          {!shown.length && <li className="c4-empty-gold">{v4("sltEmpty")}</li>}
        </ul>
      )}
      <p className="c4-meta">{v4("sltRules")}</p>
    </section>
  );
}

export function OwnerPlates({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [band, setBand] = useState("all");
  const [parity, setParity] = useState("all");
  const [shape, setShape] = useState<OwnerShape>("all");
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
    note: { assigneeId: user.assigneeId ?? null },
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
    const present = presentOwners(rows);
    const ids = rows.map((row) => row.id);
    const nextHidden = readHiddenOwners(readJson(OWNER_KEY, []), present);
    const nextReviewed = readReviewedOwners(readJson(OWNER_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(OWNER_KEY, nextHidden);
    writeJson(OWNER_REVIEW_KEY, nextReviewed);
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
  const present = presentOwners(rows);
  const bandOn = activeOwnerBand(band, present);
  const parityOn = activeOwnerParity(parity);
  const bands = visibleOwnerBands(present, hidden, showHidden);
  const shown = visibleOwnerCustomers(rows, ownerBandArg(bandOn), ownerParityArg(parityOn), query, review, reviewed, shape).filter((row) => {
    const state = ownerState(row.note);
    if (state === "") return bandOn === "all" && !showHidden;
    const token = state === "set" ? ownerBand(row.note) : "blank";
    return bands.includes(token);
  });
  const lead = leadingOwner(rows);
  const leadParity = leadingOwnerParity(rows);
  const shared = sharedOwnerCount(rows);
  const setCount = rows.filter((row) => ownerState(row.note) === "set").length;
  return (
    <section className="c4-own" aria-label={v4("ownTitle")} data-owners="1" data-role={role}>
      <header className="c4-own-mast">
        <div>
          <p className="c4-own-kicker">{v4("ownSub")}</p>
          <h2 className="c4-title">{v4("ownTitle")}</h2>
        </div>
        <p className="c4-own-plate" data-logo="mono">{v4("ownLogo")}</p>
      </header>
      <p className="c4-own-rules">{v4("ownHint")}</p>
      <p className="c4-meta">{v4("ownKept")} {v4("ownEscape")}</p>
      {viewer && <p className="c4-own-notice">{v4("ownViewer")}</p>}
      {data.error && <p className="c4-empty-gold">{v4("ownFailed")}</p>}
      {data.loading && <p className="c4-meta">{v4("ownLoading")}</p>}
      {!data.loading && !rows.length && <p className="c4-empty-gold">{v4("ownNone")}</p>}
      <dl className="c4-slt-kpi" aria-label={v4("ownSetNotice")}>
        <div><dt>{v4("ownCustomers")}</dt><dd>{rows.length}</dd></div>
        <div><dt>{v4("ownSetNotice")}</dt><dd>{setCount}</dd></div>
        <div><dt>{v4("ownShare")}</dt><dd>{ownerShare(setCount, rows.length)}%</dd></div>
        <div><dt>{v4("ownShared")}</dt><dd>{shared}</dd></div>
        <div><dt>{v4("ownLeadBand")}</dt><dd>{lead ? bandName(v4, lead) : v4("ownUnmarked")}</dd></div>
        <div><dt>{v4("ownLeadParity")}</dt><dd>{leadParity ? parityName(v4, leadParity) : v4("ownUnmarked")}</dd></div>
        <div><dt>{v4("ownCatalog")}</dt><dd>{catalogOwnerCount(rows)}</dd></div>
        <div><dt>{v4("ownWide")}</dt><dd>{wideOwnerCount(rows)}</dd></div>
        <div><dt>{v4("ownEven")}</dt><dd>{evenOwnerCount(rows)}</dd></div>
      </dl>
      <div className="c4-slt-chart" aria-label={v4("ownShapes")}>
        {BANDS.map((item) => {
          const count = rows.filter((row) => ownerBand(row.note) === item).length;
          return (
            <div key={item} className="c4-slt-col" data-on={bandOn === item ? "1" : "0"}>
              <div className="c4-slt-track"><i style={{ height: `${ownerShare(count, rows.length) || (count ? 8 : 0)}%` }} /></div>
              <button type="button" className="c4-btn" onClick={() => setBand(item)}>{bandName(v4, item)} · {count}</button>
            </div>
          );
        })}
      </div>
      <div className="c4-row">
        <label className="c4-lab"><span>{v4("ownSearch")}</span>
          <input ref={searchRef} className="c4-field" aria-label={v4("ownSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            setQuery("");
          }} />
        </label>
        <label className="c4-lab"><span>{v4("ownAllBands")}</span>
          <select className="c4-field" aria-label={v4("ownAllBands")} value={bandOn} onChange={(event) => setBand(event.target.value)}>
            <option value="all">{v4("ownAllBands")}</option>
            <option value="blank">{v4("ownClear")}</option>
            {present.filter((item) => item !== "blank").map((item) => <option key={item} value={item}>{bandName(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("ownAllParities")}</span>
          <select className="c4-field" aria-label={v4("ownAllParities")} value={parityOn} onChange={(event) => setParity(event.target.value)}>
            <option value="all">{v4("ownAllParities")}</option>
            {["even", "odd"].map((item) => <option key={item} value={item}>{parityName(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("ownAllShapes")}</span>
          <select className="c4-field" aria-label={v4("ownAllShapes")} value={shape} onChange={(event) => setShape(event.target.value as OwnerShape)}>
            <option value="all">{v4("ownAllShapes")}</option>
            <option value="catalog">{v4("ownCatalogOnly")}</option>
            <option value="wide">{v4("ownWideOnly")}</option>
            <option value="even">{v4("ownEvenOnly")}</option>
          </select>
        </label>
        <button type="button" className="c4-chip" data-on={review === "open" ? "1" : "0"} onClick={() => setReview((item) => item === "open" ? "all" : "open")}>{v4("ownOpenMarks")}</button>
        <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} onClick={() => setReview((item) => item === "reviewed" ? "all" : "reviewed")}>{v4("ownReviewed")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((on) => !on)}>{showHidden ? v4("ownHidden") : v4("ownShow")}</button>
      </div>
      <ul className="c4-own-bands" aria-label={v4("ownHide")}>
        {present.map((item) => (
          <li key={item}>
            <button type="button" className="c4-btn" data-on={hidden.includes(item) ? "1" : "0"} disabled={viewer} onClick={() => {
              const next = toggleOwner(hidden, item, present);
              setHidden(next);
              writeJson(OWNER_KEY, next);
            }}>{hidden.includes(item) ? v4("ownShow") : v4("ownHide")} · {bandName(v4, item)}</button>
          </li>
        ))}
      </ul>
      <div className="c4-row">
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => {
          const next = bulkOwnerReview(reviewed, shown.map((row) => row.id), rows.map((row) => row.id), true);
          setReviewed(next);
          writeJson(OWNER_REVIEW_KEY, next);
        }}>{v4("ownBulkReview")}</button>
        <button type="button" className="c4-btn" onClick={() => download("owner-plates.csv", ownersCsv(rows))}>{v4("ownCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("owner-plate-rows.csv", ownerRowsCsv(shown, reviewed))}>{v4("ownRowCsv")}</button>
        <span className="c4-meta">{v4("ownShown")} · {shown.length}</span>
      </div>
      <ul className="c4-own-rows" aria-label={v4("ownBoard")}>
        {shown.map((row) => {
          const code = ownerCopy(row.note);
          const seen = reviewed.includes(row.id);
          const catalog = catalogOwner(row.note);
          const wide = wideOwner(row.note);
          const even = evenOwner(row.note);
          return (
            <li key={row.id} data-band={ownerBand(row.note) || "blank"} data-reviewed={seen ? "1" : "0"} data-catalog={catalog ? "1" : "0"} data-wide={wide ? "1" : "0"} data-even={even ? "1" : "0"}>
              <Link href={crmv4Href(base, `customers/${row.id}`)}>{row.label}</Link>
              <p className="c4-meta">{code || (ownerState(row.note) === "clear" ? v4("ownClear") : v4("ownUnmarked"))} · {bandName(v4, ownerBand(row.note) || (ownerState(row.note) === "clear" ? "blank" : ""))} · {parityName(v4, ownerParity(row.note))}</p>
              <div className="c4-row">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => {
                  const next = toggleOwnerReview(reviewed, row.id, rows.map((item) => item.id));
                  setReviewed(next);
                  writeJson(OWNER_REVIEW_KEY, next);
                }}>{seen ? v4("ownReviewed") : v4("ownReview")}</button>
                <button type="button" className="c4-btn" disabled={!code} onClick={() => {
                  void navigator.clipboard?.writeText(code);
                  setCopied(row.id);
                }}>{copied === row.id ? v4("ownCopied") : v4("ownCopy")}</button>
              </div>
            </li>
          );
        })}
        {!shown.length && <li className="c4-empty-gold">{v4("ownEmpty")}</li>}
      </ul>
      <p className="c4-meta">{v4("ownUnreviewed")} · {rows.filter((row) => !reviewed.includes(row.id)).length} · {v4("ownRules")}</p>
    </section>
  );
}
