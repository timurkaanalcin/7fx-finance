"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  LGH_KEY,
  LGH_REVIEW_KEY,
  ORS_DENSITY_KEY,
  ORS_KEY,
  ORS_VIEW_KEY,
  activeChime,
  activeGlaze,
  activeHourLane,
  activeHourTone,
  activeLight,
  activeMood,
  activeRank,
  activeSteward,
  addSill,
  addSillTag,
  addSillView,
  adjacentSillCount,
  bulkHourReview,
  bulkSillArchive,
  bulkSillGlaze,
  bulkSillMood,
  bulkSillPin,
  bulkSillTag,
  busiestSteward,
  catalogHour,
  catalogHourCount,
  chimeArg,
  chimeClashCount,
  clashLightCount,
  cycleMood,
  dawnHourCount,
  densityOf,
  dropSillView,
  duskLoad,
  editSill,
  editSillNote,
  fairSteward,
  glazeArg,
  holdFocused,
  hourCopy,
  hourLane,
  hourLaneArg,
  hourLanes,
  hourRowsCsv,
  hourShare,
  hourState,
  hourStep,
  hourTone,
  hourToneArg,
  hoursCsv,
  houseGlaze,
  lateShare,
  lateSill,
  leadingHour,
  leadingHourTone,
  lightArg,
  lightGap,
  lightSpan,
  markOf,
  matchedSills,
  moodArg,
  moodFocused,
  moveFocus,
  nextSill,
  openHourCount,
  pairStewardCount,
  peakLight,
  pinFocused,
  presentLanes,
  quietGalleryCount,
  quietLight,
  rankArg,
  rankLoad,
  readHiddenLanes,
  readReviewedHours,
  readSillViews,
  readSills,
  reminderSills,
  resetSills,
  setSillArchive,
  setSillHold,
  setSillPin,
  setSillRank,
  sharedGlazeCount,
  sharedMarkCount,
  shutHourCount,
  sillCopy,
  sillCounts,
  sillGlazes,
  sillLedger,
  sillShare,
  sillStewards,
  sillsCsv,
  snoozeFocused,
  snoozeSill,
  sortSills,
  stewardArg,
  suggestChime,
  suggestGlaze,
  suggestSteward,
  toggleHour,
  toggleHourReview,
  usedLights,
  visibleHourLanes,
  visibleHours,
  visibleSills,
  wideHour,
  wideHourCount,
  windowSills,
  type HourReview,
  type HourRow,
  type HourShape,
  type HourValue,
  type OrielSill,
  type SillDensity,
  type SillSort,
  type SillTray,
  type SillView,
} from "@/lib/crmv4/round223";
import { useJson } from "./kit";
import { storedRole } from "./round5";

export type V4 = (key: CrmV4CopyKey) => string;

type LogRow = {
  id: string;
  type?: string | null;
  title?: string | null;
  createdAt?: string | null;
};

type GlanceRow = HourRow & { id: string };

const GLAZES = ["ivory", "ink", "gilt"] as const;
const MOODS = ["still", "warm", "dusk"] as const;
const LANES = ["folio", "bell", "thread"] as const;

function glazeLabel(v4: V4, glaze: string): string {
  if (glaze === "ivory" || glaze === "IVORY") return v4("orsIvory");
  if (glaze === "ink" || glaze === "INK") return v4("orsInk");
  if (glaze === "gilt" || glaze === "GILT") return v4("orsGilt");
  return v4("orsBlankGlaze");
}

function moodLabel(v4: V4, mood: string): string {
  if (mood === "still") return v4("orsStill");
  if (mood === "warm") return v4("orsWarm");
  if (mood === "dusk") return v4("orsDusk");
  return v4("orsBlankMood");
}

function chimeLabel(v4: V4, chime: number | null): string {
  if (chime === 12) return v4("orsChime12");
  if (chime === 24) return v4("orsChime24");
  if (chime === 48) return v4("orsChime48");
  return v4("orsBlankChime");
}

function laneLabel(v4: V4, name: string): string {
  if (name === "folio") return v4("lghFolio");
  if (name === "bell") return v4("lghBell");
  if (name === "thread") return v4("lghThread");
  if (name === "blank") return v4("lghClear");
  return v4("lghUnmarked");
}

function toneLabel(v4: V4, name: string): string {
  if (name === "dawn") return v4("lghDawnTone");
  if (name === "day") return v4("lghDay");
  if (name === "night") return v4("lghNight");
  if (name === "hush") return v4("lghHush");
  if (name === "mist") return v4("lghMist");
  return v4("lghUnmarked");
}

function auditLabel(v4: V4, audit: string): string {
  const key = {
    save: "orsAuditSave",
    edit: "orsAuditEdit",
    note: "orsAuditNote",
    mood: "orsAuditMood",
    pin: "orsAuditPin",
    unpin: "orsAuditUnpin",
    hold: "orsAuditHold",
    resume: "orsAuditResume",
    archive: "orsAuditArchive",
    open: "orsAuditOpen",
    glaze: "orsAuditGlaze",
    tag: "orsAuditTag",
    rank: "orsAuditRank",
    chime: "orsAuditChime",
  }[audit];
  return key ? v4(key as CrmV4CopyKey) : "";
}

function gapLabel(v4: V4, light: number | null, desk: string): string {
  const gap = lightGap(light, desk);
  if (gap === null) return "";
  if (gap > 0) return `${v4("orsPast")} ${gap}`;
  if (gap < 0) return `${v4("orsAhead")} ${Math.abs(gap)}`;
  return v4("orsDue");
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
  const node = event.target as HTMLElement | null;
  if (!node) return false;
  const tag = node.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || node.isContentEditable;
}

export function OrielSills({ v4 }: { v4: V4 }) {
  const [sills, setSills] = useState<OrielSill[]>([]);
  const [views, setViews] = useState<SillView[]>([]);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [steward, setSteward] = useState("");
  const [light, setLight] = useState("");
  const [glaze, setGlaze] = useState("");
  const [mood, setMood] = useState("");
  const [chimeValue, setChimeValue] = useState("");
  const [rank, setRank] = useState("");
  const [tag, setTag] = useState("");
  const [roster, setRoster] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<SillTray>("open");
  const [stewardFilter, setStewardFilter] = useState("all");
  const [glazeFilter, setGlazeFilter] = useState("all");
  const [moodFilter, setMoodFilter] = useState("all");
  const [lightFilter, setLightFilter] = useState("all");
  const [chimeFilter, setChimeFilter] = useState("all");
  const [rankFilter, setRankFilter] = useState("all");
  const [duskOnly, setDuskOnly] = useState(false);
  const [peakOnly, setPeakOnly] = useState(false);
  const [quietOnly, setQuietOnly] = useState(false);
  const [houseOnly, setHouseOnly] = useState(false);
  const [restingOnly, setRestingOnly] = useState(false);
  const [board, setBoard] = useState<"gallery" | "ledger">("gallery");
  const [order, setOrder] = useState<SillSort>("light");
  const [density, setDensity] = useState<SillDensity>("airy");
  const [copied, setCopied] = useState("");
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [deskLight, setDeskLight] = useState("");
  const [moveGlaze, setMoveGlaze] = useState("ivory");
  const [picked, setPicked] = useState<string[]>([]);
  const [focus, setFocus] = useState(0);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const pinRef = useRef<() => void>(() => {});
  const chimeRef = useRef<() => void>(() => {});
  const holdRef = useRef<() => void>(() => {});
  const moodRef = useRef<() => void>(() => {});
  const viewer = role === "viewer";
  useEffect(() => {
    const next = readSills(readJson(ORS_KEY, []));
    const saved = readSillViews(readJson(ORS_VIEW_KEY, []));
    setSills(next);
    setViews(saved);
    setDensity(densityOf(readJson(ORS_DENSITY_KEY, "airy")));
    writeJson(ORS_KEY, next);
    writeJson(ORS_VIEW_KEY, saved);
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);
  function store(next: OrielSill[]) {
    const saved = readSills(next);
    setSills(saved);
    writeJson(ORS_KEY, saved);
    setPicked((ids) => ids.filter((id) => saved.some((sill) => sill.id === id)));
  }
  function storeViews(next: SillView[]) {
    const saved = readSillViews(next);
    setViews(saved);
    writeJson(ORS_VIEW_KEY, saved);
  }
  function storeDensity(next: SillDensity) {
    setDensity(next);
    writeJson(ORS_DENSITY_KEY, next);
  }
  const stewards = sillStewards(sills);
  const glazes = sillGlazes(sills);
  const bars = GLAZES.map((item) => ({ glaze: item.toUpperCase(), count: sills.filter((sill) => sill.glaze === item.toUpperCase()).length })).filter((row) => row.count > 0);
  const stewardOn = activeSteward(stewardFilter, stewards);
  const glazeOn = activeGlaze(glazeFilter, ["IVORY", "INK", "GILT", ...glazes]);
  const moodOn = activeMood(moodFilter, ["still", "warm", "dusk"]);
  const lightOn = activeLight(lightFilter);
  const chimeOn = activeChime(chimeFilter);
  const rankOn = activeRank(rankFilter);
  const pickedLight = lightArg(lightOn);
  const shown = sortSills(visibleSills(
    sills,
    tray,
    query,
    stewardArg(stewardOn),
    glazeArg(glazeOn),
    moodArg(moodOn),
    pickedLight.exact,
    pickedLight.pick,
    chimeArg(chimeOn),
    rankArg(rankOn),
    duskOnly,
    peakOnly,
    houseOnly,
    quietOnly,
    restingOnly,
  ), order);
  const ledger = sillLedger(sills, query);
  const counts = sillCounts(sills, deskLight);
  const share = lateShare(sills, deskLight);
  const matched = matchedSills(sills, deskLight);
  const clashes = clashLightCount(sills);
  const chimes = chimeClashCount(sills);
  const neighbors = adjacentSillCount(sills);
  const suggestedGlaze = suggestGlaze(sills);
  const suggestedName = suggestSteward(sills);
  const suggestedChime = suggestChime(sills);
  const fair = fairSteward(sills, roster);
  const busy = busiestSteward(sills);
  const reminders = reminderSills(sills, deskLight);
  const windowRows = windowSills(sills, deskLight);
  const nextTitle = nextSill(sills, deskLight);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  pinRef.current = () => {
    if (!viewer) store(pinFocused(sills, shown.map((sill) => sill.id), focus));
  };
  chimeRef.current = () => {
    if (!viewer) store(snoozeFocused(sills, shown.map((sill) => sill.id), focus));
  };
  holdRef.current = () => {
    if (!viewer) store(holdFocused(sills, shown.map((sill) => sill.id), focus));
  };
  moodRef.current = () => {
    if (!viewer) store(moodFocused(sills, shown.map((sill) => sill.id), focus));
  };
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setTitle("");
        setNote("");
        setSteward("");
        setLight("");
        setGlaze("");
        setMood("");
        setChimeValue("");
        setRank("");
        setTag("");
        setQuery("");
        setEditing("");
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey || typingTarget(event)) return;
      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        setFocus((index) => moveFocus(index, shown.length, 1));
        return;
      }
      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        setFocus((index) => moveFocus(index, shown.length, -1));
        return;
      }
      if (event.key === "n" || event.key === "N") {
        event.preventDefault();
        titleRef.current?.focus();
        return;
      }
      if (event.key === "p" || event.key === "P") {
        event.preventDefault();
        pinRef.current();
        return;
      }
      if (event.key === "g" || event.key === "G") {
        event.preventDefault();
        chimeRef.current();
        return;
      }
      if (event.key === "h" || event.key === "H") {
        event.preventDefault();
        holdRef.current();
        return;
      }
      if (event.key === "r" || event.key === "R") {
        event.preventDefault();
        moodRef.current();
        return;
      }
      if (event.key === "y" || event.key === "Y") {
        event.preventDefault();
        setBoard((current) => (current === "gallery" ? "ledger" : "gallery"));
        return;
      }
      if (event.key !== "/") return;
      event.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shown.length]);
  function clearDraft() {
    setTitle("");
    setNote("");
    setSteward("");
    setLight("");
    setGlaze("");
    setMood("");
    setChimeValue("");
    setRank("");
    setTag("");
    setQuery("");
    setEditing("");
  }
  function applyView(view: SillView) {
    setTray(view.tray);
    setQuery(view.query);
    setStewardFilter(view.steward);
    setGlazeFilter(view.glaze);
    setMoodFilter(view.mood);
    setLightFilter(view.light);
    setChimeFilter(view.chime);
    setRankFilter(view.rank);
  }
  const rows = board === "ledger" ? ledger : shown;
  const houseOpen = sills.filter((sill) => !sill.held && !sill.archived && houseGlaze(sill.glaze)).length;
  const openCount = Math.max(1, counts.open);
  return (
    <section className="c4-ors" aria-label={v4("orsTitle")} data-sills="1" data-role={role} data-density={density}>
      <div className="c4-ors-sheet">
        <header className="c4-ors-mast">
          <div>
            <p className="c4-ors-kicker">{v4("orsSub")}</p>
            <h2 className="c4-title">{v4("orsTitle")}</h2>
          </div>
          <p className="c4-ors-plate" data-logo="mono">{v4("orsLogo")}</p>
        </header>
        <p className="c4-ors-time">{v4("orsLocal")}</p>
        <p className="c4-ors-rules">{v4("orsHint")}</p>
        <p className="c4-meta">{v4("orsNew")} {v4("orsSlash")} {v4("orsEscape")} {v4("orsKeys")} {v4("orsPinKey")} {v4("orsChimeKey")} {v4("orsHoldKey")} {v4("orsMoodKey")} {v4("orsBoardKey")}</p>
        {viewer && <p className="c4-ors-notice" data-viewer="1">{v4("orsViewer")}</p>}
        {counts.peak > 0 && (
          <p className="c4-ors-notice" role="status">
            {v4("orsNotice")} · {counts.peak}
            <button type="button" className="c4-btn" onClick={() => setPeakOnly((on) => !on)}>{peakOnly ? v4("orsNoticeAll") : v4("orsNoticePeak")}</button>
          </p>
        )}
        {counts.late > 0 && <p className="c4-ors-notice" role="status">{v4("orsLateNotice")} · {counts.late}</p>}
        <ol className="c4-ors-kpis" aria-label={v4("orsKpi")}>
          <li><span>{v4("orsOpen")}</span><strong>{counts.open}</strong></li>
          <li><span>{v4("orsHeld")}</span><strong>{counts.held}</strong></li>
          <li><span>{v4("orsArchived")}</span><strong>{counts.archived}</strong></li>
          <li><span>{v4("orsPinned")}</span><strong>{counts.pinned}</strong></li>
          <li><span>{v4("orsPeak")}</span><strong>{counts.peak}</strong></li>
          <li><span>{v4("orsLate")}</span><strong>{counts.late}</strong></li>
          <li><span>{v4("orsSoon")}</span><strong>{counts.soon}</strong></li>
          <li><span>{v4("orsRank")}</span><strong>{counts.rank}</strong></li>
          <li><span>{v4("orsMatched")}</span><strong>{matched}</strong></li>
        </ol>
        <div className="c4-ors-meter" aria-label={v4("orsLateShare")}>
          <span>{v4("orsHouseShare")} {sillShare(houseOpen, openCount)}%</span>
          <span>{v4("orsLateShare")} {share}%</span>
          <i style={{ width: `${share}%` }} />
        </div>
        <ol className="c4-ors-bars" aria-label={v4("orsGlazes")}>
          {bars.map((bar) => (
            <li key={bar.glaze}>
              <span>{glazeLabel(v4, bar.glaze)}</span>
              <b style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} />
              <em>{bar.count}</em>
            </li>
          ))}
        </ol>
        {!sills.length && <p className="c4-ors-empty">{v4("orsEmpty")}</p>}
        <div className="c4-ors-suggest">
          <p>{v4("orsSuggestGlaze")}: {glazeLabel(v4, suggestedGlaze)}</p>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => setGlaze(suggestedGlaze.toLowerCase())}>{v4("orsUseGlaze")}</button>
          <p>{suggestedName ? `${v4("orsSuggestSteward")}: ${suggestedName}` : v4("orsBlankSteward")}</p>
          <button type="button" className="c4-btn" disabled={viewer || !suggestedName} onClick={() => setSteward(suggestedName)}>{v4("orsUseSteward")}</button>
          <p>{v4("orsSuggestChime")}: {chimeLabel(v4, suggestedChime)}</p>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => setChimeValue(String(suggestedChime))}>{v4("orsUseChime")}</button>
          <p>{v4("orsAssign")}: {fair || v4("orsBlankSteward")}</p>
          <button type="button" className="c4-btn" disabled={viewer || !fair} onClick={() => setSteward(fair)}>{v4("orsUseSteward")}</button>
        </div>
        <ul className="c4-ors-facts">
          <li>{v4("orsLights")}: {usedLights(sills)}</li>
          <li>{clashes ? `${v4("orsClash")} ${clashes}` : v4("orsClashNone")}</li>
          <li>{chimes ? `${v4("orsChimeClash")} ${chimes}` : v4("orsChimeClashNone")}</li>
          <li>{neighbors ? `${v4("orsAdjacent")} ${neighbors}` : v4("orsAdjacentNone")}</li>
          <li>{pairStewardCount(sills) ? `${v4("orsPairs")} ${pairStewardCount(sills)}` : v4("orsPairsNone")}</li>
          <li>{sharedGlazeCount(sills) ? `${v4("orsSharedGlaze")} ${sharedGlazeCount(sills)}` : v4("orsSharedGlazeNone")}</li>
          <li>{v4("orsRankLoad")}: {rankLoad(sills)}</li>
          <li>{v4("orsQuietGallery")}: {quietGalleryCount(sills)}</li>
          <li>{v4("orsDuskLoad")}: {duskLoad(sills)}</li>
          <li>{v4("orsLightSpan")}: {lightSpan(sills)}</li>
          <li>{nextTitle ? `${v4("orsNext")}: ${nextTitle}` : v4("orsNextNone")}</li>
          <li>{busy ? `${v4("orsBusiest")}: ${busy}` : v4("orsBusiestNone")}</li>
          <li>{v4("orsWindow")}: {windowRows.length}</li>
        </ul>
        <section className="c4-ors-reminders" aria-label={v4("orsReminders")}>
          <h3>{v4("orsReminders")}</h3>
          {!reminders.length && <p className="c4-ors-empty">{v4("orsReminderEmpty")}</p>}
          <ul>
            {reminders.map((sill) => (
              <li key={sill.id}>{sill.title} · {lateSill(sill, deskLight) ? v4("orsLate") : v4("orsSoon")}</li>
            ))}
          </ul>
        </section>
        <form className="c4-ors-form" onSubmit={(event) => {
          event.preventDefault();
          if (viewer) return;
          store(addSill(sills, {
            id: `ors-${Date.now()}`,
            title,
            note,
            steward,
            light,
            glaze,
            mood,
            chime: chimeValue,
            rank,
            tags: tag,
          }));
          clearDraft();
        }}>
          <input ref={titleRef} className="c4-field" aria-label={v4("orsTitle")} value={title} disabled={viewer} onChange={(event) => setTitle(event.target.value)} />
          <input className="c4-field" aria-label={v4("orsNote")} value={note} disabled={viewer} onChange={(event) => setNote(event.target.value)} />
          <input className="c4-field" aria-label={v4("orsSteward")} value={steward} disabled={viewer} onChange={(event) => setSteward(event.target.value)} />
          <input className="c4-field" aria-label={v4("orsLight")} inputMode="numeric" value={light} disabled={viewer} onChange={(event) => setLight(event.target.value)} />
          <select className="c4-select" aria-label={v4("orsGlaze")} value={glaze} disabled={viewer} onChange={(event) => setGlaze(event.target.value)}>
            <option value="">{v4("orsBlankGlaze")}</option>
            {GLAZES.map((item) => <option key={item} value={item}>{glazeLabel(v4, item)}</option>)}
          </select>
          <select className="c4-select" aria-label={v4("orsMood")} value={mood} disabled={viewer} onChange={(event) => setMood(event.target.value)}>
            <option value="">{v4("orsBlankMood")}</option>
            {MOODS.map((item) => <option key={item} value={item}>{moodLabel(v4, item)}</option>)}
          </select>
          <select className="c4-select" aria-label={v4("orsChime")} value={chimeValue} disabled={viewer} onChange={(event) => setChimeValue(event.target.value)}>
            <option value="">{v4("orsBlankChime")}</option>
            <option value="12">{v4("orsChime12")}</option>
            <option value="24">{v4("orsChime24")}</option>
            <option value="48">{v4("orsChime48")}</option>
          </select>
          <input className="c4-field" aria-label={v4("orsTag")} value={tag} disabled={viewer} onChange={(event) => setTag(event.target.value)} />
          <select className="c4-select" aria-label={v4("orsRankField")} value={rank} disabled={viewer} onChange={(event) => setRank(event.target.value)}>
            <option value="">{v4("orsRankField")}</option>
            <option value="1">1</option>
            <option value="3">3</option>
            <option value="9">9</option>
          </select>
          <button type="submit" className="c4-btn c4-btn-hot" disabled={viewer}>{v4("orsAdd")}</button>
        </form>
        <div className="c4-ors-tools">
          <input ref={searchRef} className="c4-field" aria-label={v4("orsSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
          <button type="button" className="c4-chip" data-on={tray === "open" ? "1" : "0"} onClick={() => setTray("open")}>{v4("orsTrayOpen")}</button>
          <button type="button" className="c4-chip" data-on={tray === "held" ? "1" : "0"} onClick={() => setTray("held")}>{v4("orsTrayHeld")}</button>
          <button type="button" className="c4-chip" data-on={tray === "archived" ? "1" : "0"} onClick={() => setTray("archived")}>{v4("orsTrayArchived")}</button>
          <button type="button" className="c4-chip" data-on={board === "ledger" ? "1" : "0"} onClick={() => setBoard((current) => (current === "gallery" ? "ledger" : "gallery"))}>{board === "ledger" ? v4("orsLedger") : v4("orsGallery")}</button>
          <button type="button" className="c4-chip" data-on={order === "steward" ? "1" : "0"} onClick={() => setOrder((current) => (current === "light" ? "steward" : "light"))}>{order === "steward" ? v4("orsSortSteward") : v4("orsSortLight")}</button>
          <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "tight" ? "airy" : "tight")}>{density === "tight" ? v4("orsTight") : v4("orsAiry")}</button>
          <button type="button" className="c4-chip" data-on={duskOnly ? "1" : "0"} onClick={() => setDuskOnly((on) => !on)}>{v4("orsDusk")}</button>
          <button type="button" className="c4-chip" data-on={houseOnly ? "1" : "0"} onClick={() => setHouseOnly((on) => !on)}>{v4("orsHouseShare")}</button>
          <button type="button" className="c4-chip" data-on={quietOnly ? "1" : "0"} onClick={() => setQuietOnly((on) => !on)}>{v4("orsQuiet")}</button>
          <button type="button" className="c4-chip" data-on={restingOnly ? "1" : "0"} onClick={() => setRestingOnly((on) => !on)}>{v4("orsRankField")}</button>
        </div>
        <div className="c4-ors-tools">
          <select className="c4-select" aria-label={v4("orsSteward")} value={stewardOn} onChange={(event) => setStewardFilter(event.target.value)}>
            <option value="all">{v4("orsAll")}</option>
            <option value="blank">{v4("orsBlank")}</option>
            {stewards.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
          <select className="c4-select" aria-label={v4("orsGlaze")} value={glazeOn} onChange={(event) => setGlazeFilter(event.target.value)}>
            <option value="all">{v4("orsAll")}</option>
            <option value="blank">{v4("orsBlank")}</option>
            {GLAZES.map((item) => <option key={item} value={item.toUpperCase()}>{glazeLabel(v4, item)}</option>)}
          </select>
          <select className="c4-select" aria-label={v4("orsMood")} value={moodOn} onChange={(event) => setMoodFilter(event.target.value)}>
            <option value="all">{v4("orsAll")}</option>
            <option value="blank">{v4("orsBlank")}</option>
            {MOODS.map((item) => <option key={item} value={item}>{moodLabel(v4, item)}</option>)}
          </select>
          <select className="c4-select" aria-label={v4("orsLight")} value={lightOn} onChange={(event) => setLightFilter(event.target.value)}>
            <option value="all">{v4("orsAll")}</option>
            <option value="blank">{v4("orsBlank")}</option>
            <option value="early">{v4("orsEarly")}</option>
            <option value="mid">{v4("orsMid")}</option>
            <option value="late">{v4("orsLateBand")}</option>
            <option value="peak">{v4("orsPeak")}</option>
            <option value="quiet">{v4("orsQuiet")}</option>
            {["1", "2", "3", "4", "5"].map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select className="c4-select" aria-label={v4("orsChime")} value={chimeOn} onChange={(event) => setChimeFilter(event.target.value)}>
            <option value="all">{v4("orsAll")}</option>
            <option value="blank">{v4("orsBlank")}</option>
            <option value="12">{v4("orsChime12")}</option>
            <option value="24">{v4("orsChime24")}</option>
            <option value="48">{v4("orsChime48")}</option>
          </select>
          <select className="c4-select" aria-label={v4("orsRankField")} value={rankOn} onChange={(event) => setRankFilter(event.target.value)}>
            <option value="all">{v4("orsAll")}</option>
            <option value="blank">{v4("orsBlank")}</option>
            <option value="1">1</option>
            <option value="3">3</option>
            <option value="9">9</option>
          </select>
          <input className="c4-field" aria-label={v4("orsDesk")} inputMode="numeric" value={deskLight} onChange={(event) => setDeskLight(event.target.value)} />
          <input className="c4-field" aria-label={v4("orsRoster")} value={roster} disabled={viewer} onChange={(event) => setRoster(event.target.value)} />
        </div>
        <form className="c4-ors-views" onSubmit={(event) => {
          event.preventDefault();
          if (viewer) return;
          storeViews(addSillView(views, {
            id: `view-${Date.now()}`,
            name: viewName,
            tray,
            query,
            steward: stewardOn,
            glaze: glazeOn,
            mood: moodOn,
            light: lightOn,
            chime: chimeOn,
            rank: rankOn,
          }));
          setViewName("");
        }}>
          <input className="c4-field" aria-label={v4("orsViewName")} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} />
          <button type="submit" className="c4-btn" disabled={viewer}>{v4("orsSaveView")}</button>
          <ul>
            {views.map((view) => (
              <li key={view.id}>
                <button type="button" className="c4-btn" onClick={() => applyView(view)}>{view.name}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropSillView(views, view.id))}>{v4("orsDropView")}</button>
              </li>
            ))}
          </ul>
        </form>
        <div className="c4-ors-bulk">
          <select className="c4-select" aria-label={v4("orsBulkGlaze")} value={moveGlaze} disabled={viewer} onChange={(event) => setMoveGlaze(event.target.value)}>
            {GLAZES.map((item) => <option key={item} value={item}>{glazeLabel(v4, item)}</option>)}
          </select>
          <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkSillGlaze(sills, picked, moveGlaze))}>{v4("orsBulkGlaze")}</button>
          <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkSillPin(sills, picked, true))}>{v4("orsBulkPin")}</button>
          <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkSillArchive(sills, picked, true))}>{v4("orsBulkArchive")}</button>
          <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkSillMood(sills, picked, "dusk"))}>{v4("orsBulkMood")}</button>
          <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkSillTag(sills, picked, "d"))}>{v4("orsBulkTag")}</button>
          <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(resetSills())}>{v4("orsClear")}</button>
          <button type="button" className="c4-btn" onClick={() => download("oriel-sills.csv", sillsCsv(sills, deskLight))}>{v4("orsExport")}</button>
        </div>
        {!rows.length && <p className="c4-ors-empty">{v4("orsEmpty")}</p>}
        <ol className="c4-ors-book">
          {rows.map((sill, index) => {
            const on = index === focus;
            return (
              <li key={sill.id} data-focus={on ? "1" : "0"} data-peak={peakLight(sill.light) ? "1" : "0"} data-quiet={quietLight(sill.light) ? "1" : "0"} data-house={houseGlaze(sill.glaze) ? "1" : "0"}>
                <label className="c4-ors-pick">
                  <input type="checkbox" checked={picked.includes(sill.id)} aria-label={sill.title} onChange={() => setPicked((ids) => ids.includes(sill.id) ? ids.filter((id) => id !== sill.id) : [...ids, sill.id])} />
                </label>
                {editing === sill.id ? (
                  <input className="c4-field" aria-label={v4("orsEdit")} value={draft} disabled={viewer} onChange={(event) => setDraft(event.target.value)} onBlur={() => { if (!viewer) store(editSill(sills, sill.id, draft)); setEditing(""); }} />
                ) : (
                  <button type="button" className="c4-ors-title" disabled={viewer} onClick={() => { setEditing(sill.id); setDraft(sill.title); setFocus(index); }}>{sill.title}</button>
                )}
                <input className="c4-field" aria-label={v4("orsNote")} value={editing === `${sill.id}-note` ? noteDraft : sill.note} disabled={viewer} onFocus={() => { setEditing(`${sill.id}-note`); setNoteDraft(sill.note); }} onChange={(event) => setNoteDraft(event.target.value)} onBlur={() => { if (!viewer) store(editSillNote(sills, sill.id, noteDraft)); setEditing(""); }} />
                <span>{sill.steward || v4("orsBlankSteward")}</span>
                <span>{sill.light ?? v4("orsBlank")}</span>
                <span>{glazeLabel(v4, sill.glaze)}</span>
                <span>{moodLabel(v4, sill.mood)}</span>
                <span>{chimeLabel(v4, sill.chime)}</span>
                <span>{sill.rank}</span>
                <span>{sill.tags.join(" ")}</span>
                <span>{gapLabel(v4, sill.light, deskLight)}</span>
                <span>{auditLabel(v4, sill.audit)}</span>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSillPin(sills, sill.id, !sill.pinned))}>{sill.pinned ? v4("orsUnpin") : v4("orsPin")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(snoozeSill(sills, sill.id))}>{v4("orsSnooze")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSillHold(sills, sill.id, !sill.held))}>{sill.held ? v4("orsResume") : v4("orsHold")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cycleMood(sills, sill.id))}>{v4("orsCycle")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSillArchive(sills, sill.id, !sill.archived))}>{sill.archived ? v4("orsReopen") : v4("orsArchive")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSillRank(sills, sill.id, sill.rank === 1 ? 3 : sill.rank === 3 ? 9 : 1))}>{v4("orsRankField")}</button>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addSillTag(sills, sill.id, "e"))}>{v4("orsTag")}</button>
                <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(sillCopy(sill, deskLight)); setCopied(sill.id); }}>{copied === sill.id ? v4("orsCopied") : v4("orsCopy")}</button>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

export function LogHours({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ communications?: LogRow[] }>("/api/admin/communications?take=40");
  const [query, setQuery] = useState("");
  const [lane, setLane] = useState("all");
  const [tone, setTone] = useState("all");
  const [review, setReview] = useState<HourReview>("all");
  const [shape, setShape] = useState<HourShape>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [copied, setCopied] = useState("");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = useMemo<GlanceRow[]>(() => (data.data?.communications || []).map((row) => ({
    id: row.id,
    label: row.title || row.type || row.id,
    note: { type: row.type || "", title: row.title || "", createdAt: row.createdAt || "" } satisfies HourValue,
  })), [data.data?.communications]);
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
    const present = presentLanes(rows);
    const ids = rows.map((row) => row.id);
    const nextHidden = readHiddenLanes(readJson(LGH_KEY, []), present);
    const nextReviewed = readReviewedHours(readJson(LGH_REVIEW_KEY, []), ids);
    setHidden(nextHidden);
    setReviewed(nextReviewed);
    writeJson(LGH_KEY, nextHidden);
    writeJson(LGH_REVIEW_KEY, nextReviewed);
  }, [rows]);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setQuery("");
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey || typingTarget(event)) return;
      if (event.key === "n" || event.key === "N" || event.key === "/") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const present = presentLanes(rows);
  const lanes = visibleHourLanes(present, hidden, showHidden);
  const laneOn = activeHourLane(lane, present);
  const toneOn = activeHourTone(tone);
  const shown = visibleHours(rows, hourLaneArg(laneOn), hourToneArg(toneOn), query, review, reviewed, shape)
    .filter((row) => {
      const state = hourState(row.note);
      const token = state === "set" ? hourLane(row.note) : state === "clear" ? "blank" : "";
      if (!token) return true;
      return lanes.includes(token);
    });
  const lead = leadingHour(rows);
  const toneLead = leadingHourTone(rows);
  const shared = sharedMarkCount(rows);
  const catalog = catalogHourCount(rows);
  const bars = hourLanes(rows).filter((line) => line.lane);
  const maxBar = Math.max(1, ...bars.map((bar) => bar.count));
  const ids = rows.map((row) => row.id);
  const known = rows.filter((row) => hourState(row.note) === "set").length;
  function storeHidden(next: string[]) {
    setHidden(next);
    writeJson(LGH_KEY, next);
  }
  function storeReviewed(next: string[]) {
    const saved = readReviewedHours(next, ids);
    setReviewed(saved);
    writeJson(LGH_REVIEW_KEY, saved);
  }
  return (
    <section className="c4-lgh" aria-label={v4("lghTitle")} data-hours="1" data-role={role} data-catalog={catalog ? "1" : "0"}>
      <div className="c4-lgh-sheet">
        <header className="c4-lgh-mast">
          <div>
            <p className="c4-lgh-kicker">{v4("lghSub")}</p>
            <h2 className="c4-title">{v4("lghTitle")}</h2>
          </div>
          <p className="c4-lgh-plate" data-logo="mono">{v4("lghLogo")}</p>
        </header>
        <p className="c4-lgh-time">{v4("lghKept")}</p>
        <div className="c4-lgh-body">
          <p className="c4-lgh-rules">{v4("lghHint")}</p>
          <p className="c4-meta">{v4("lghEscape")}</p>
          {viewer && <p className="c4-lgh-notice" data-viewer="1">{v4("lghViewer")}</p>}
          {data.error && <p className="c4-lgh-empty" role="alert">{v4("lghFailed")}</p>}
          {data.loading && <p className="c4-meta">{v4("lghLoading")}</p>}
          {!data.loading && !rows.length && <p className="c4-lgh-empty">{v4("lghEmpty")}</p>}
          {shared > 0 && <p className="c4-lgh-notice" role="status">{v4("lghNotice")} · {shared}</p>}
          <ol className="c4-lgh-ledger" aria-label={v4("lghKpi")}>
            <li><span>{v4("lghSet")}</span><strong>{known}</strong></li>
            <li><span>{v4("lghClear")}</span><strong>{rows.filter((row) => hourState(row.note) === "clear").length}</strong></li>
            <li><span>{v4("lghCatalog")}</span><strong>{catalog}</strong></li>
            <li><span>{v4("lghWide")}</span><strong>{wideHourCount(rows)}</strong></li>
            <li><span>{v4("lghDawn")}</span><strong>{dawnHourCount(rows)}</strong></li>
            <li><span>{v4("lghOpen")}</span><strong>{openHourCount(rows)}</strong></li>
            <li><span>{v4("lghShut")}</span><strong>{shutHourCount(rows)}</strong></li>
            <li><span>{v4("lghShare")}</span><strong>{hourShare(catalog, Math.max(1, known))}%</strong></li>
          </ol>
          <p className="c4-meta">{v4("lghLead")}: {laneLabel(v4, lead)} · {v4("lghToneLead")}: {toneLabel(v4, toneLead)}</p>
          <ol className="c4-lgh-index" aria-label={v4("lghKpi")}>
            {bars.map((bar) => (
              <li key={bar.lane} data-tone={bar.lane === "bell" ? "gold" : bar.lane === "folio" ? "ink" : "ivory"}>
                <span>{laneLabel(v4, bar.lane)}</span>
                <b style={{ width: `${Math.round((bar.count / maxBar) * 100)}%` }} />
                <em>{bar.count}</em>
              </li>
            ))}
          </ol>
          <div className="c4-lgh-tools">
            <input ref={searchRef} className="c4-field" aria-label={v4("lghSearch")} value={query} onChange={(event) => setQuery(event.target.value)} />
            <select className="c4-select" aria-label={v4("lghFolio")} value={laneOn} onChange={(event) => setLane(event.target.value)}>
              <option value="all">{v4("lghAll")}</option>
              {present.map((name) => <option key={name} value={name}>{laneLabel(v4, name)}</option>)}
            </select>
            <select className="c4-select" aria-label={v4("lghDawnTone")} value={toneOn} onChange={(event) => setTone(event.target.value)}>
              <option value="all">{v4("lghAll")}</option>
              <option value="dawn">{v4("lghDawnTone")}</option>
              <option value="day">{v4("lghDay")}</option>
              <option value="night">{v4("lghNight")}</option>
              <option value="hush">{v4("lghHush")}</option>
              <option value="mist">{v4("lghMist")}</option>
            </select>
            <select className="c4-select" aria-label={v4("lghReviewed")} value={review} onChange={(event) => setReview(event.target.value as HourReview)}>
              <option value="all">{v4("lghAll")}</option>
              <option value="reviewed">{v4("lghReviewed")}</option>
              <option value="fresh">{v4("lghFresh")}</option>
            </select>
            <select className="c4-select" aria-label={v4("lghShapeAll")} value={shape} onChange={(event) => setShape(event.target.value as HourShape)}>
              <option value="all">{v4("lghShapeAll")}</option>
              <option value="catalog">{v4("lghShapeCatalog")}</option>
              <option value="wide">{v4("lghShapeWide")}</option>
              <option value="open">{v4("lghShapeOpen")}</option>
              <option value="shut">{v4("lghShapeShut")}</option>
            </select>
            <button type="button" className="c4-btn" onClick={() => setShowHidden((on) => !on)}>{showHidden ? v4("lghHide") : v4("lghShow")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkHourReview(reviewed, shown.map((row) => row.id), true))}>{v4("lghBulkReview")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(bulkHourReview(reviewed, shown.map((row) => row.id), false))}>{v4("lghBulkClear")}</button>
            <button type="button" className="c4-btn" onClick={() => download("log-hours.csv", hoursCsv(rows))}>{v4("lghCsv")}</button>
            <button type="button" className="c4-btn" onClick={() => download("log-hour-rows.csv", hourRowsCsv(rows, reviewed))}>{v4("lghRowCsv")}</button>
            <Link href={crmv4Href(base, "logs")}>{v4("lghLogs")}</Link>
          </div>
          <ul className="c4-lgh-lanes">
            {LANES.map((name) => (
              <li key={name}>
                <button type="button" className="c4-chip" data-on={hidden.includes(name) ? "1" : "0"} disabled={viewer || !present.includes(name)} onClick={() => storeHidden(toggleHour(hidden, name))}>{laneLabel(v4, name)}</button>
              </li>
            ))}
          </ul>
          <ol className="c4-lgh-book">
            {shown.map((row) => (
              <li key={row.id} data-catalog={catalogHour(row.note) ? "1" : "0"} data-wide={wideHour(row.note) ? "1" : "0"} data-reviewed={reviewed.includes(row.id) ? "1" : "0"}>
                <Link href={crmv4Href(base, "logs")}>{row.label}</Link>
                <span>{markOf(row.note)}</span>
                <span>{laneLabel(v4, hourLane(row.note))}</span>
                <span>{toneLabel(v4, hourTone(row.note))}</span>
                <span>{v4("lghStep")} {hourStep(row.note)}</span>
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleHourReview(reviewed, row.id))}>{v4("lghReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { void navigator.clipboard?.writeText(hourCopy(row.note)); setCopied(row.id); }}>{copied === row.id ? v4("lghCopied") : v4("lghCopy")}</button>
              </li>
            ))}
          </ol>
          <p className="c4-lgh-rules">{v4("lghRules")} · {v4("lghCatalogMark")}</p>
        </div>
      </div>
    </section>
  );
}
