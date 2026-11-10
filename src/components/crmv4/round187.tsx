"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  STEM_KEY,
  STEM_REVIEW_KEY,
  BELL_KEY,
  BELL_VIEW_KEY,
  activeMinute,
  activeMark,
  activeKeeper,
  activeStemBand,
  activeStemParity,
  activeCadence,
  activeTone,
  activePause,
  activeSpan,
  addBell,
  addBellView,
  bulkStemReview,
  bulkBellRing,
  bulkBellPin,
  bulkBellTone,
  catalogStem,
  catalogStemCount,
  clashMinuteCount,
  cycleCadence,
  dropBellView,
  editBell,
  editBellNote,
  evenStem,
  evenStemCount,
  fairKeeper,
  homeCode,
  minuteArg,
  minuteGap,
  lateBell,
  leadingStem,
  leadingStemParity,
  markArg,
  nextBell,
  keeperArg,
  stemBand,
  stemBandArg,
  stemCopy,
  stemParity,
  stemParityArg,
  stemRowsCsv,
  stemShare,
  stemState,
  stemsCsv,
  presentStems,
  readHiddenStems,
  readReviewedStems,
  readBellViews,
  readBells,
  resetBells,
  setBellRing,
  setBellHold,
  setBellPin,
  sharedStemCount,
  bellCopy,
  bellCounts,
  bellCodes,
  bellKeepers,
  bellShare,
  bellCadences,
  bellTimeline,
  bellsCsv,
  soonBell,
  suggestKeeper,
  suggestTone,
  suggestPause,
  cadenceArg,
  toneArg,
  toneCounts,
  toggleStem,
  toggleStemReview,
  usedMinutes,
  visibleStemBands,
  visibleStemCustomers,
  visibleBells,
  pauseArg,
  spanArg,
  spanClashCount,
  wideStem,
  wideStemCount,
  type StemRow,
  type StemShape,
  type Bell,
  type BellCadence,
  type BellTone,
  type BellTray,
  type BellView,
} from "@/lib/crmv4/round187";
import { useJson } from "./kit";
import { storedRole } from "./round5";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  tradingServer?: string | null;
};

type GlanceRow = StemRow & { id: string };

const TONES = ["ivory", "ink", "champagne", "graphite"] as const;
const BANDS = ["seed", "stem", "trunk", "canopy"] as const;

function toneName(v4: V4, tone: BellTone | string): string {
  if (tone === "ivory") return v4("vspIvory");
  if (tone === "ink") return v4("vspInk");
  if (tone === "champagne") return v4("vspChampagne");
  if (tone === "graphite") return v4("vspGraphite");
  return v4("vspBlankTone");
}

function cadenceName(v4: V4, cadence: BellCadence | string): string {
  if (cadence === "still") return v4("vspCadenceStill");
  if (cadence === "soft") return v4("vspCadenceSoft");
  if (cadence === "brisk") return v4("vspCadenceBrisk");
  return v4("vspBlankCadence");
}

function minuteName(v4: V4, name: string): string {
  if (name === "first") return v4("vspFirst");
  if (name === "mid") return v4("vspMid");
  if (name === "late") return v4("vspLate");
  if (name === "peak") return v4("vspPeak");
  if (name === "quiet") return v4("vspQuiet");
  if (/^(?:[0-9]|[1-5][0-9])$/.test(name)) return name;
  return v4("vspBlankMinute");
}

function spanName(v4: V4, span: number | null): string {
  if (span === 3) return v4("vspSpan3");
  if (span === 6) return v4("vspSpan6");
  if (span === 12) return v4("vspSpan12");
  return v4("vspBlankSpan");
}

function pauseName(v4: V4, pause: number | null): string {
  if (pause === 5) return v4("vspPause5");
  if (pause === 15) return v4("vspPause15");
  if (pause === 45) return v4("vspPause45");
  return v4("vspBlankPause");
}

function bandName(v4: V4, name: string): string {
  if (name === "seed") return v4("stmSeed");
  if (name === "stem") return v4("stmStem");
  if (name === "trunk") return v4("stmTrunk");
  if (name === "canopy") return v4("stmCanopy");
  if (name === "blank") return v4("stmClear");
  return v4("stmUnmarked");
}

function parityName(v4: V4, name: string): string {
  if (name === "even") return v4("stmEven");
  if (name === "odd") return v4("stmOdd");
  return v4("stmUnmarked");
}

function auditName(v4: V4, audit: string): string {
  const key = {
    save: "vspAuditSave",
    edit: "vspAuditEdit",
    cadence: "vspAuditCadence",
    pin: "vspAuditPin",
    unpin: "vspAuditUnpin",
    hold: "vspAuditHold",
    lift: "vspAuditLift",
    done: "vspAuditDone",
    undo: "vspAuditUndo",
    tone: "vspAuditTone",
  }[audit];
  return key ? v4(key as CrmV4CopyKey) : "";
}

function gapLabel(v4: V4, hour: number | null, desk: string): string {
  const gap = minuteGap(hour, desk);
  if (gap === null) return "";
  if (gap > 0) return `${v4("vspPast")} ${gap}`;
  if (gap < 0) return `${v4("vspAhead")} ${Math.abs(gap)}`;
  return v4("vspDue");
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

export function VesperBells({ v4 }: { v4: V4 }) {
  const [cards, setCards] = useState<Bell[]>([]);
  const [views, setViews] = useState<BellView[]>([]);
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
  const [tray, setTray] = useState<BellTray>("open");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [tintFilter, setTintFilter] = useState("all");
  const [markFilter, setMarkFilter] = useState("all");
  const [tempoFilter, setTempoFilter] = useState("all");
  const [hourFilter, setHourFilter] = useState("all");
  const [weightFilter, setWeightFilter] = useState("all");
  const [waitFilter, setWaitFilter] = useState("all");
  const [stillOnly, setHushOnly] = useState(false);
  const [peakOnly, setPeakOnly] = useState(false);
  const [homeOnly, setHomeOnly] = useState(false);
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const [copied, setCopied] = useState("");
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [desk, setDesk] = useState("");
  const [moveTone, setMoveTone] = useState("ivory");
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  useEffect(() => {
    const next = readBells(readJson(BELL_KEY, []));
    const saved = readBellViews(readJson(BELL_VIEW_KEY, []));
    setCards(next);
    setViews(saved);
    writeJson(BELL_KEY, next);
    writeJson(BELL_VIEW_KEY, saved);
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
  function store(next: Bell[]) {
    const saved = readBells(next);
    setCards(saved);
    writeJson(BELL_KEY, saved);
    setPicked((ids) => ids.filter((id) => saved.some((card) => card.id === id)));
  }
  const owners = bellKeepers(cards);
  const marks = bellCodes(cards);
  const tempos = bellCadences(cards);
  const bars = toneCounts(cards);
  const ownerOn = activeKeeper(ownerFilter, owners);
  const tintOn = activeTone(tintFilter, TONES);
  const markOn = activeMark(markFilter, marks);
  const tempoOn = activeCadence(tempoFilter, tempos);
  const hourOn = activeMinute(hourFilter);
  const weightOn = activeSpan(weightFilter);
  const waitOn = activePause(waitFilter);
  const pickedHour = minuteArg(hourOn);
  const shown = visibleBells(
    cards,
    tray,
    query,
    keeperArg(ownerOn),
    toneArg(tintOn),
    markArg(markOn),
    cadenceArg(tempoOn),
    pickedHour.exact,
    pickedHour.pick,
    spanArg(weightOn),
    pauseArg(waitOn),
    stillOnly,
    peakOnly,
    homeOnly,
  );
  const timeline = bellTimeline(cards, query);
  const counts = bellCounts(cards, desk);
  const clashes = clashMinuteCount(cards);
  const weights = spanClashCount(cards);
  const nextId = nextBell(cards, desk);
  const nextCard = cards.find((card) => card.id === nextId);
  const suggestedTint = suggestTone(cards);
  const suggestedOwner = suggestKeeper(cards);
  const suggestedWait = suggestPause(cards);
  const fair = fairKeeper(cards, roster);
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
    <section className="c4-vsp" aria-label={v4("vspTitle")} data-bells="1" data-role={role}>
      <header className="c4-vsp-mast">
        <div>
          <p className="c4-vsp-kicker">{v4("vspSub")}</p>
          <h2 className="c4-title">{v4("vspTitle")}</h2>
        </div>
        <p className="c4-vsp-plate" data-logo="mono">{v4("vspLogo")}</p>
      </header>
      <p className="c4-vsp-rules">{v4("vspHint")}</p>
      <p className="c4-meta">{v4("vspLocal")}</p>
      <p className="c4-meta">{v4("vspNew")} {v4("vspSlash")} {v4("vspEscape")}</p>
      {viewer && <p className="c4-vsp-notice" data-viewer="1">{v4("vspViewer")}</p>}
      {counts.peak > 0 && (
        <div className="c4-vsp-bells">
          <p className="c4-vsp-notice">{v4("vspNotice")} · {counts.peak}</p>
          <button type="button" className="c4-btn" onClick={() => setPeakOnly((on) => !on)}>{peakOnly ? v4("vspNoticeAll") : v4("vspNoticePeak")}</button>
        </div>
      )}
      <dl className="c4-vsp-kpi" aria-label={v4("vspKpi")}>
        <div><dt>{v4("vspOpen")}</dt><dd>{counts.open}</dd></div>
        <div><dt>{v4("vspHeld")}</dt><dd>{counts.held}</dd></div>
        <div><dt>{v4("vspDoneTray")}</dt><dd>{counts.done}</dd></div>
        <div><dt>{v4("vspPinned")}</dt><dd>{counts.pinned}</dd></div>
        <div><dt>{v4("vspPeak")}</dt><dd>{counts.peak}</dd></div>
        <div><dt>{v4("vspLate")}</dt><dd>{counts.late}</dd></div>
        <div><dt>{v4("vspSoon")}</dt><dd>{counts.soon}</dd></div>
        <div><dt>{v4("vspHomeShare")}</dt><dd>{bellShare(counts.home, total)}%</dd></div>
      </dl>
      <div className="c4-vsp-chart" aria-label={v4("vspTints")}>
        {bars.map((bar) => (
          <div key={bar.tone} className="c4-vsp-col" data-on={tintOn === bar.tone ? "1" : "0"}>
            <span className="c4-vsp-swatch" data-tone={bar.tone} />
            <div className="c4-vsp-track" aria-hidden="true"><i style={{ height: `${Math.round((bar.count / maxBar) * 100)}%` }} /></div>
            <button type="button" className="c4-btn" onClick={() => setTintFilter(bar.tone)}>{toneName(v4, bar.tone)} · {bar.count}</button>
          </div>
        ))}
        {!bars.length && <p className="c4-empty-gold">{v4("vspEmpty")}</p>}
      </div>
      <div className="c4-vsp-suggest">
        <p>{v4("vspSuggestTint")} · {toneName(v4, suggestedTint)}</p>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => setTint(suggestedTint)}>{v4("vspUseTint")}</button>
        <p>{v4("vspSuggestOwner")} · {suggestedOwner || v4("vspBlankOwner")}</p>
        <button type="button" className="c4-btn" disabled={viewer || !suggestedOwner} onClick={() => setOwner(suggestedOwner)}>{v4("vspUseOwner")}</button>
        <p>{v4("vspSuggestPause")} · {pauseName(v4, suggestedWait)}</p>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => setWait(String(suggestedWait))}>{v4("vspUseWait")}</button>
        <p>{v4("vspAssign")} · {fair || v4("vspBlankOwner")}</p>
        <button type="button" className="c4-btn" disabled={viewer || !fair} onClick={() => setOwner(fair)}>{v4("vspAssign")}</button>
      </div>
      <p className="c4-meta">{v4("vspHourUse")} · {usedMinutes(cards)} · {clashes ? `${v4("vspClash")} · ${clashes}` : v4("vspClashNone")} · {weights ? `${v4("vspWeightClash")} · ${weights}` : v4("vspWeightClashNone")}</p>
      <p className="c4-meta">{v4("vspNext")} · {nextCard ? nextCard.title : v4("vspNextNone")}</p>
      <form className="c4-vsp-form" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addBell(cards, { id: `vsp-${Date.now()}`, title, note, keeper: owner, minute: hour, tone: tint, code: mark, cadence: tempo, span: weight, pause: wait });
        if (next.length === cards.length && title.trim()) return;
        store(next);
        setTitle("");
        setNote("");
      }}>
        <label className="c4-lab"><span>{v4("vspLine")}</span>
          <input ref={titleRef} className="c4-field" aria-label={v4("vspLine")} value={title} disabled={viewer} onChange={(event) => setTitle(event.target.value)} onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            clearDraft();
          }} />
        </label>
        <label className="c4-lab"><span>{v4("vspNote")}</span>
          <input className="c4-field" aria-label={v4("vspNote")} value={note} disabled={viewer} onChange={(event) => setNote(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("vspOwner")}</span>
          <input className="c4-field" aria-label={v4("vspOwner")} value={owner} disabled={viewer} onChange={(event) => setOwner(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("vspHour")}</span>
          <input className="c4-field" aria-label={v4("vspHour")} inputMode="numeric" value={hour} disabled={viewer} onChange={(event) => setHour(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("vspTint")}</span>
          <select className="c4-field" aria-label={v4("vspTint")} value={tint} disabled={viewer} onChange={(event) => setTint(event.target.value)}>
            <option value="">{v4("vspBlankTint")}</option>
            {TONES.map((item) => <option key={item} value={item}>{toneName(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("vspMark")}</span>
          <input className="c4-field" aria-label={v4("vspMark")} value={mark} disabled={viewer} onChange={(event) => setMark(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("vspTempo")}</span>
          <select className="c4-field" aria-label={v4("vspTempo")} value={tempo} disabled={viewer} onChange={(event) => setTempo(event.target.value)}>
            <option value="">{v4("vspBlankTempo")}</option>
            <option value="still">{v4("vspCadenceStill")}</option>
            <option value="soft">{v4("vspCadenceSoft")}</option>
            <option value="brisk">{v4("vspCadenceBrisk")}</option>
          </select>
        </label>
        <label className="c4-lab"><span>{v4("vspWeight")}</span>
          <input className="c4-field" aria-label={v4("vspWeight")} inputMode="numeric" value={weight} disabled={viewer} onChange={(event) => setWeight(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("vspWait")}</span>
          <input className="c4-field" aria-label={v4("vspWait")} inputMode="numeric" value={wait} disabled={viewer} onChange={(event) => setWait(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("vspRoster")}</span>
          <input className="c4-field" aria-label={v4("vspRoster")} value={roster} disabled={viewer} onChange={(event) => setRoster(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn c4-btn-hot" disabled={viewer}>{v4("vspAdd")}</button>
      </form>
      <p className="c4-meta">{v4("vspBlank")} {v4("vspHourBlank")}</p>
      <div className="c4-vsp-filters">
        {(["open", "held", "done"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>
            {item === "open" ? v4("vspOpen") : item === "held" ? v4("vspHeld") : v4("vspDoneTray")}
          </button>
        ))}
        <label className="c4-lab"><span>{v4("vspSearch")}</span>
          <input ref={searchRef} className="c4-field" aria-label={v4("vspSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            clearDraft();
          }} />
        </label>
        <label className="c4-lab"><span>{v4("vspDeskHour")}</span>
          <input className="c4-field" aria-label={v4("vspDeskHour")} inputMode="numeric" value={desk} onChange={(event) => setDesk(event.target.value)} />
        </label>
        <label className="c4-lab"><span>{v4("vspOwners")}</span>
          <select className="c4-field" aria-label={v4("vspAllOwners")} value={ownerOn} onChange={(event) => setOwnerFilter(event.target.value)}>
            <option value="all">{v4("vspAllOwners")}</option>
            <option value="blank">{v4("vspBlankOwner")}</option>
            {owners.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("vspTints")}</span>
          <select className="c4-field" aria-label={v4("vspAllTints")} value={tintOn} onChange={(event) => setTintFilter(event.target.value)}>
            <option value="all">{v4("vspAllTints")}</option>
            <option value="blank">{v4("vspBlankTint")}</option>
            {TONES.map((item) => <option key={item} value={item}>{toneName(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("vspMarks")}</span>
          <select className="c4-field" aria-label={v4("vspAllMarks")} value={markOn} onChange={(event) => setMarkFilter(event.target.value)}>
            <option value="all">{v4("vspAllMarks")}</option>
            <option value="blank">{v4("vspBlankMark")}</option>
            {marks.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("vspTempos")}</span>
          <select className="c4-field" aria-label={v4("vspAllTempos")} value={tempoOn} onChange={(event) => setTempoFilter(event.target.value)}>
            <option value="all">{v4("vspAllTempos")}</option>
            <option value="blank">{v4("vspBlankTempo")}</option>
            {tempos.map((item) => <option key={item} value={item}>{cadenceName(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("vspHours")}</span>
          <select className="c4-field" aria-label={v4("vspAllHours")} value={hourOn} onChange={(event) => setHourFilter(event.target.value)}>
            <option value="all">{v4("vspAllHours")}</option>
            {["blank", "first", "mid", "late", "peak", "quiet", "0", "5", "30", "55"].map((item) => <option key={item} value={item}>{minuteName(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("vspWeights")}</span>
          <select className="c4-field" aria-label={v4("vspAllWeights")} value={weightOn} onChange={(event) => setWeightFilter(event.target.value)}>
            <option value="all">{v4("vspAllWeights")}</option>
            <option value="blank">{v4("vspBlankWeight")}</option>
            <option value="3">{v4("vspSpan3")}</option>
            <option value="6">{v4("vspSpan6")}</option>
            <option value="12">{v4("vspSpan12")}</option>
          </select>
        </label>
        <label className="c4-lab"><span>{v4("vspWaits")}</span>
          <select className="c4-field" aria-label={v4("vspAllWaits")} value={waitOn} onChange={(event) => setWaitFilter(event.target.value)}>
            <option value="all">{v4("vspAllWaits")}</option>
            <option value="blank">{v4("vspBlankWait")}</option>
            <option value="5">{v4("vspPause5")}</option>
            <option value="15">{v4("vspPause15")}</option>
            <option value="45">{v4("vspPause45")}</option>
          </select>
        </label>
        <button type="button" className="c4-chip" data-on={stillOnly ? "1" : "0"} onClick={() => setHushOnly((on) => !on)}>{v4("vspHushOnly")}</button>
        <button type="button" className="c4-chip" data-on={homeOnly ? "1" : "0"} onClick={() => setHomeOnly((on) => !on)}>{homeOnly ? v4("vspHomeOnly") : v4("vspHomeAll")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard((item) => item === "cards" ? "timeline" : "cards")}>{board === "cards" ? v4("vspTimeline") : v4("vspCards")}</button>
      </div>
      <form className="c4-vsp-views" onSubmit={(event) => {
        event.preventDefault();
        if (viewer) return;
        const next = addBellView(views, {
          id: `view-${Date.now()}`,
          name: viewName,
          tray,
          query,
          keeper: ownerOn,
          tone: tintOn,
          code: markOn,
          cadence: tempoOn,
          minute: hourOn,
          span: weightOn,
          pause: waitOn,
        });
        setViews(next);
        writeJson(BELL_VIEW_KEY, next);
        setViewName("");
      }}>
        <label className="c4-lab"><span>{v4("vspViewName")}</span>
          <input className="c4-field" aria-label={v4("vspViewName")} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("vspSaveView")}</button>
        <ul aria-label={v4("vspViews")}>
          {views.map((view) => (
            <li key={view.id}>
              <button type="button" className="c4-btn" onClick={() => {
                setTray(view.tray);
                setQuery(view.query);
                setOwnerFilter(view.keeper);
                setTintFilter(view.tone);
                setMarkFilter(view.code);
                setTempoFilter(view.cadence);
                setHourFilter(view.minute);
                setWeightFilter(view.span);
                setWaitFilter(view.pause);
              }}>{view.name}</button>
              <button type="button" className="c4-btn" disabled={viewer} onClick={() => {
                const next = dropBellView(views, view.id);
                setViews(next);
                writeJson(BELL_VIEW_KEY, next);
              }}>{v4("vspDropView")}</button>
            </li>
          ))}
        </ul>
      </form>
      <div className="c4-row">
        <button type="button" className="c4-btn" onClick={() => setPicked(shown.map((card) => card.id))}>{v4("vspPickAll")}</button>
        <button type="button" className="c4-btn" onClick={() => setPicked([])}>{v4("vspPickNone")}</button>
        <span className="c4-meta">{v4("vspPicked")} · {picked.length}</span>
        <select className="c4-field" aria-label={v4("vspBulkTone")} value={moveTone} disabled={viewer} onChange={(event) => setMoveTone(event.target.value)}>
          {TONES.map((item) => <option key={item} value={item}>{toneName(v4, item)}</option>)}
        </select>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkBellTone(cards, picked, moveTone))}>{v4("vspBulkTint")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkBellPin(cards, picked, true))}>{v4("vspBulkPin")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkBellRing(cards, picked, true))}>{v4("vspBulkDone")}</button>
        <button type="button" className="c4-btn" onClick={() => download("vesper-bells.csv", bellsCsv(cards, desk))}>{v4("vspCsv")}</button>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(resetBells())}>{v4("vspReset")}</button>
      </div>
      {board === "timeline" ? (
        <ol className="c4-vsp-timeline" aria-label={v4("vspTimeline")}>
          {timeline.map((card) => <li key={card.id} data-minute={card.minute}>{card.minute} · {card.title}</li>)}
          {!timeline.length && <li className="c4-empty-gold">{v4("vspEmpty")}</li>}
        </ol>
      ) : (
        <ul className="c4-vsp-cards">
          {shown.map((card) => {
            const openEdit = editing === card.id;
            return (
              <li key={card.id} data-tone={card.tone || "blank"} data-cadence={card.cadence || "blank"} data-pinned={card.pinned ? "1" : "0"} data-late={lateBell(card, desk) ? "1" : "0"} data-soon={soonBell(card) ? "1" : "0"} data-home={homeCode(card.code) ? "1" : "0"}>
                <label className="c4-row">
                  <input type="checkbox" checked={picked.includes(card.id)} aria-label={card.title} onChange={(event) => setPicked((ids) => event.target.checked ? [...ids, card.id] : ids.filter((id) => id !== card.id))} />
                  {openEdit ? (
                    <input className="c4-field" aria-label={v4("vspEdit")} value={draft} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                  ) : <strong>{card.title}</strong>}
                </label>
                <p className="c4-meta">{card.keeper || v4("vspBlankKeeper")} · {card.minute ?? v4("vspBlankMinute")} · {toneName(v4, card.tone)} · {card.code || v4("vspBlankCode")} · {cadenceName(v4, card.cadence)} · {spanName(v4, card.span)} · {pauseName(v4, card.pause)}</p>
                {openEdit ? (
                  <input className="c4-field" aria-label={v4("vspNote")} value={noteDraft} disabled={viewer} onChange={(event) => setNoteDraft(event.target.value)} />
                ) : card.note && <p>{card.note}</p>}
                <p className="c4-meta">{gapLabel(v4, card.minute, desk)} {auditName(v4, card.audit)}</p>
                <div className="c4-row">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setBellPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("vspUnpin") : v4("vspPin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setBellHold(cards, card.id, !card.held))}>{card.held ? v4("vspLift") : v4("vspHold")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setBellRing(cards, card.id, !card.done))}>{card.done ? v4("vspUndo") : v4("vspDone")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cycleCadence(cards, card.id))}>{v4("vspTempoUp")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => {
                    if (openEdit) {
                      store(editBellNote(editBell(cards, card.id, draft), card.id, noteDraft));
                      setEditing("");
                      return;
                    }
                    setEditing(card.id);
                    setDraft(card.title);
                    setNoteDraft(card.note);
                  }}>{openEdit ? v4("vspAdd") : v4("vspEdit")}</button>
                  <button type="button" className="c4-btn" onClick={() => {
                    void navigator.clipboard?.writeText(bellCopy(card));
                    setCopied(card.id);
                  }}>{copied === card.id ? v4("vspCopied") : v4("vspCopy")}</button>
                </div>
              </li>
            );
          })}
          {!shown.length && <li className="c4-empty-gold">{v4("vspEmpty")}</li>}
        </ul>
      )}
      <p className="c4-meta">{v4("vspRules")}</p>
    </section>
  );
}

export function ServerStems({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [band, setBand] = useState("all");
  const [parity, setParity] = useState("all");
  const [shape, setShape] = useState<StemShape>("all");
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
    note: { tradingServer: user.tradingServer ?? null },
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
    const present = presentStems(rows);
    const ids = rows.map((row) => row.id);
    const nextHidden = readHiddenStems(readJson(STEM_KEY, []), present);
    const nextReviewed = readReviewedStems(readJson(STEM_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(STEM_KEY, nextHidden);
    writeJson(STEM_REVIEW_KEY, nextReviewed);
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
  const present = presentStems(rows);
  const bandOn = activeStemBand(band, present);
  const parityOn = activeStemParity(parity);
  const bands = visibleStemBands(present, hidden, showHidden);
  const shown = visibleStemCustomers(rows, stemBandArg(bandOn), stemParityArg(parityOn), query, review, reviewed, shape).filter((row) => {
    const state = stemState(row.note);
    if (state === "") return bandOn === "all" && !showHidden;
    const token = state === "set" ? stemBand(row.note) : "blank";
    return bands.includes(token);
  });
  const lead = leadingStem(rows);
  const leadParity = leadingStemParity(rows);
  const shared = sharedStemCount(rows);
  const setCount = rows.filter((row) => stemState(row.note) === "set").length;
  return (
    <section className="c4-stm" aria-label={v4("stmTitle")} data-stems="1" data-role={role}>
      <header className="c4-stm-mast">
        <div>
          <p className="c4-stm-kicker">{v4("stmSub")}</p>
          <h2 className="c4-title">{v4("stmTitle")}</h2>
        </div>
        <p className="c4-stm-plate" data-logo="mono">{v4("stmLogo")}</p>
      </header>
      <p className="c4-stm-rules">{v4("stmHint")}</p>
      <p className="c4-meta">{v4("stmKept")} {v4("stmEscape")}</p>
      {viewer && <p className="c4-stm-notice">{v4("stmViewer")}</p>}
      {data.error && <p className="c4-empty-gold">{v4("stmFailed")}</p>}
      {data.loading && <p className="c4-meta">{v4("stmLoading")}</p>}
      {!data.loading && !rows.length && <p className="c4-empty-gold">{v4("stmNone")}</p>}
      <dl className="c4-vsp-kpi" aria-label={v4("stmSetNotice")}>
        <div><dt>{v4("stmCustomers")}</dt><dd>{rows.length}</dd></div>
        <div><dt>{v4("stmSetNotice")}</dt><dd>{setCount}</dd></div>
        <div><dt>{v4("stmShare")}</dt><dd>{stemShare(setCount, rows.length)}%</dd></div>
        <div><dt>{v4("stmShared")}</dt><dd>{shared}</dd></div>
        <div><dt>{v4("stmLeadBand")}</dt><dd>{lead ? bandName(v4, lead) : v4("stmUnmarked")}</dd></div>
        <div><dt>{v4("stmLeadParity")}</dt><dd>{leadParity ? parityName(v4, leadParity) : v4("stmUnmarked")}</dd></div>
        <div><dt>{v4("stmCatalog")}</dt><dd>{catalogStemCount(rows)}</dd></div>
        <div><dt>{v4("stmWide")}</dt><dd>{wideStemCount(rows)}</dd></div>
        <div><dt>{v4("stmEven")}</dt><dd>{evenStemCount(rows)}</dd></div>
      </dl>
      <div className="c4-vsp-chart" aria-label={v4("stmShapes")}>
        {BANDS.map((item) => {
          const count = rows.filter((row) => stemBand(row.note) === item).length;
          return (
            <div key={item} className="c4-vsp-col" data-on={bandOn === item ? "1" : "0"}>
              <div className="c4-vsp-track"><i style={{ height: `${stemShare(count, rows.length) || (count ? 8 : 0)}%` }} /></div>
              <button type="button" className="c4-btn" onClick={() => setBand(item)}>{bandName(v4, item)} · {count}</button>
            </div>
          );
        })}
      </div>
      <div className="c4-row">
        <label className="c4-lab"><span>{v4("stmSearch")}</span>
          <input ref={searchRef} className="c4-field" aria-label={v4("stmSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            setQuery("");
          }} />
        </label>
        <label className="c4-lab"><span>{v4("stmAllBands")}</span>
          <select className="c4-field" aria-label={v4("stmAllBands")} value={bandOn} onChange={(event) => setBand(event.target.value)}>
            <option value="all">{v4("stmAllBands")}</option>
            <option value="blank">{v4("stmClear")}</option>
            {present.filter((item) => item !== "blank").map((item) => <option key={item} value={item}>{bandName(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("stmAllParities")}</span>
          <select className="c4-field" aria-label={v4("stmAllParities")} value={parityOn} onChange={(event) => setParity(event.target.value)}>
            <option value="all">{v4("stmAllParities")}</option>
            {["even", "odd"].map((item) => <option key={item} value={item}>{parityName(v4, item)}</option>)}
          </select>
        </label>
        <label className="c4-lab"><span>{v4("stmAllShapes")}</span>
          <select className="c4-field" aria-label={v4("stmAllShapes")} value={shape} onChange={(event) => setShape(event.target.value as StemShape)}>
            <option value="all">{v4("stmAllShapes")}</option>
            <option value="catalog">{v4("stmCatalogOnly")}</option>
            <option value="wide">{v4("stmWideOnly")}</option>
            <option value="even">{v4("stmEvenOnly")}</option>
          </select>
        </label>
        <button type="button" className="c4-chip" data-on={review === "open" ? "1" : "0"} onClick={() => setReview((item) => item === "open" ? "all" : "open")}>{v4("stmOpenMarks")}</button>
        <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} onClick={() => setReview((item) => item === "reviewed" ? "all" : "reviewed")}>{v4("stmReviewed")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((on) => !on)}>{showHidden ? v4("stmHidden") : v4("stmShow")}</button>
      </div>
      <ul className="c4-stm-bands" aria-label={v4("stmHide")}>
        {present.map((item) => (
          <li key={item}>
            <button type="button" className="c4-btn" data-on={hidden.includes(item) ? "1" : "0"} disabled={viewer} onClick={() => {
              const next = toggleStem(hidden, item, present);
              setHidden(next);
              writeJson(STEM_KEY, next);
            }}>{hidden.includes(item) ? v4("stmShow") : v4("stmHide")} · {bandName(v4, item)}</button>
          </li>
        ))}
      </ul>
      <div className="c4-row">
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => {
          const next = bulkStemReview(reviewed, shown.map((row) => row.id), rows.map((row) => row.id), true);
          setReviewed(next);
          writeJson(STEM_REVIEW_KEY, next);
        }}>{v4("stmBulkReview")}</button>
        <button type="button" className="c4-btn" onClick={() => download("server-stems.csv", stemsCsv(rows))}>{v4("stmCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("server-stem-rows.csv", stemRowsCsv(shown, reviewed))}>{v4("stmRowCsv")}</button>
        <span className="c4-meta">{v4("stmShown")} · {shown.length}</span>
      </div>
      <ul className="c4-stm-rows" aria-label={v4("stmBoard")}>
        {shown.map((row) => {
          const code = stemCopy(row.note);
          const seen = reviewed.includes(row.id);
          const catalog = catalogStem(row.note);
          const wide = wideStem(row.note);
          const even = evenStem(row.note);
          return (
            <li key={row.id} data-band={stemBand(row.note) || "blank"} data-reviewed={seen ? "1" : "0"} data-catalog={catalog ? "1" : "0"} data-wide={wide ? "1" : "0"} data-even={even ? "1" : "0"}>
              <Link href={crmv4Href(base, `customers/${row.id}`)}>{row.label}</Link>
              <p className="c4-meta">{code || (stemState(row.note) === "clear" ? v4("stmClear") : v4("stmUnmarked"))} · {bandName(v4, stemBand(row.note) || (stemState(row.note) === "clear" ? "blank" : ""))} · {parityName(v4, stemParity(row.note))}</p>
              <div className="c4-row">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => {
                  const next = toggleStemReview(reviewed, row.id, rows.map((item) => item.id));
                  setReviewed(next);
                  writeJson(STEM_REVIEW_KEY, next);
                }}>{seen ? v4("stmReviewed") : v4("stmReview")}</button>
                <button type="button" className="c4-btn" disabled={!code} onClick={() => {
                  void navigator.clipboard?.writeText(code);
                  setCopied(row.id);
                }}>{copied === row.id ? v4("stmCopied") : v4("stmCopy")}</button>
              </div>
            </li>
          );
        })}
        {!shown.length && <li className="c4-empty-gold">{v4("stmEmpty")}</li>}
      </ul>
      <p className="c4-meta">{v4("stmUnreviewed")} · {rows.filter((row) => !reviewed.includes(row.id)).length} · {v4("stmRules")}</p>
    </section>
  );
}
