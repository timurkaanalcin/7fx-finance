"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import {
  CUE_KEY,
  CUE_VIEW_KEY,
  REGION_KEY,
  activeCompass,
  activeMark,
  activeMinute,
  activeOwner,
  activeRegion,
  activeRegionInitial,
  activeSpan,
  activeTone,
  activeWing,
  addCue,
  addCueView,
  bulkCueDone,
  bulkCuePinned,
  compassArg,
  compassLines,
  compassOf,
  cueClashIds,
  cueCopy,
  cueCounts,
  cueMarks,
  cueOwners,
  cueShare,
  cueTimeline,
  cueTones,
  cueWings,
  cuesCsv,
  dropCueView,
  editCue,
  leadingCompass,
  leadingRegion,
  leadingRegionInitial,
  leadingSpan,
  markArg,
  minuteArg,
  minuteBand,
  minuteGap,
  namedCompasses,
  namedRegionInitials,
  namedRegions,
  namedSpans,
  nextCue,
  ownerArg,
  quarterCounts,
  readCueViews,
  readCues,
  readHiddenRegions,
  regionInitialArg,
  regionInitialLines,
  regionInitialOf,
  regionLines,
  regionShare,
  regionText,
  regionsCsv,
  resetCues,
  setCueDone,
  setCueHeld,
  setCuePinned,
  spanArg,
  spanLines,
  spanOf,
  stepCueTone,
  toneArg,
  toneOf,
  toggleRegion,
  visibleCues,
  visibleRegionCustomers,
  visibleRegions,
  wingArg,
  wingOf,
  type Compass,
  type CueCard,
  type CueTone,
  type CueTray,
  type CueView,
  type CueWing,
  type RegionRow,
  type RegionSpan,
} from "@/lib/crmv4/round142";
import { crmv4Href } from "@/lib/crmv4/sections";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  email?: string | null;
  lastRegion?: string | null;
};

type GlanceRow = RegionRow & { id: string };

const QUARTERS = ["q1", "q2", "q3", "q4"] as const;

function wingName(v4: V4, wing: CueWing): string {
  if (wing === "north") return v4("cueWingNorth");
  if (wing === "south") return v4("cueWingSouth");
  if (wing === "east") return v4("cueWingEast");
  if (wing === "west") return v4("cueWingWest");
  return v4("cueBlankWing");
}

function toneName(v4: V4, tone: CueTone): string {
  if (tone === "quiet") return v4("cueToneQuiet");
  if (tone === "warm") return v4("cueToneWarm");
  if (tone === "sharp") return v4("cueToneSharp");
  return v4("cueBlankTone");
}

function compassName(v4: V4, name: string): string {
  if (name === "north") return v4("rgnNorth");
  if (name === "south") return v4("rgnSouth");
  if (name === "east") return v4("rgnEast");
  if (name === "west") return v4("rgnWest");
  if (name === "central") return v4("rgnCentral");
  if (name === "other") return v4("rgnCompassOther");
  return v4("rgnBlankCompass");
}

function spanName(v4: V4, name: string): string {
  if (name === "short") return v4("rgnShort");
  if (name === "mid") return v4("rgnMid");
  if (name === "long") return v4("rgnLong");
  return v4("rgnBlankSpan");
}

function auditName(v4: V4, audit: string): string {
  if (audit === "save") return v4("cueAuditSave");
  if (audit === "edit") return v4("cueAuditEdit");
  if (audit === "raise") return v4("cueAuditRaise");
  if (audit === "lower") return v4("cueAuditLower");
  if (audit === "pin") return v4("cueAuditPin");
  if (audit === "unpin") return v4("cueAuditUnpin");
  if (audit === "hold") return v4("cueAuditHold");
  if (audit === "release") return v4("cueAuditRelease");
  if (audit === "done") return v4("cueAuditDone");
  if (audit === "reopen") return v4("cueAuditReopen");
  return "";
}

function quarterLabel(index: number): string {
  const start = index * 15;
  const end = start + 14;
  return `${String(start).padStart(2, "0")}–${String(end).padStart(2, "0")}`;
}

function minuteLabel(minute: number | null): string {
  return minute === null ? "—" : String(minute).padStart(2, "0");
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

export function CueCards({ v4 }: { v4: V4 }) {
  const [cues, setCues] = useState<CueCard[]>([]);
  const [views, setViews] = useState<CueView[]>([]);
  const [text, setText] = useState("");
  const [owner, setOwner] = useState("");
  const [minute, setMinute] = useState("");
  const [wing, setWing] = useState("");
  const [mark, setMark] = useState("");
  const [tone, setTone] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<CueTray>("open");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [wingFilter, setWingFilter] = useState("all");
  const [markFilter, setMarkFilter] = useState("all");
  const [toneFilter, setToneFilter] = useState("all");
  const [minuteFilter, setMinuteFilter] = useState("all");
  const [sharpOnly, setSharpOnly] = useState(false);
  const [lateOnly, setLateOnly] = useState(false);
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const [copied, setCopied] = useState("");
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [desk, setDesk] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const next = readCues(readJson(CUE_KEY, []));
    const saved = readCueViews(readJson(CUE_VIEW_KEY, []));
    setCues(next);
    setViews(saved);
    writeJson(CUE_KEY, next);
    writeJson(CUE_VIEW_KEY, saved);
  }, []);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      const tagName = (event.target as HTMLElement | null)?.tagName;
      if (tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT") return;
      event.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const owners = cueOwners(cues);
  const wings = cueWings(cues);
  const marks = cueMarks(cues);
  const tones = cueTones(cues);
  const quarters = quarterCounts(cues);
  const ownerOn = activeOwner(ownerFilter, owners);
  const wingOn = activeWing(wingFilter, wings);
  const markOn = activeMark(markFilter, marks);
  const toneOn = activeTone(toneFilter, tones);
  const minuteOn = activeMinute(minuteFilter);
  const picked = minuteArg(minuteOn);
  const shown = visibleCues(
    cues,
    tray,
    query,
    ownerArg(ownerOn),
    wingArg(wingOn),
    markArg(markOn),
    toneArg(toneOn),
    picked.exact,
    picked.band,
    sharpOnly,
    lateOnly,
    desk,
  );
  const timeline = cueTimeline(cues, query);
  const counts = cueCounts(cues, desk);
  const total = cues.length;
  const nextId = nextCue(cues, desk);
  const nextCard = cues.find((cue) => cue.id === nextId);
  const tallest = Math.max(1, ...quarters);

  function store(next: CueCard[]) {
    setCues(next);
    writeJson(CUE_KEY, next);
  }

  function storeViews(next: CueView[]) {
    setViews(next);
    writeJson(CUE_VIEW_KEY, next);
  }

  function clearDraft() {
    setText("");
    setOwner("");
    setMinute("");
    setWing("");
    setMark("");
    setTone("");
  }

  function copyCue(cue: CueCard) {
    const body = cueCopy(cue.text);
    if (!body) return;
    if (navigator.clipboard?.writeText) void navigator.clipboard.writeText(body);
    setCopied(cue.id);
  }

  function applyView(view: CueView) {
    setTray(view.tray);
    setQuery(view.query);
    setOwnerFilter(activeOwner(view.owner, cueOwners(cues)));
    setWingFilter(activeWing(view.wing, cueWings(cues)));
    setMarkFilter(activeMark(view.mark, cueMarks(cues)));
    setToneFilter(activeTone(view.tone, cueTones(cues)));
    setMinuteFilter(activeMinute(view.minute));
    setBoard("cards");
    setSharpOnly(false);
    setLateOnly(false);
  }

  return (
    <section className="c4-cue" aria-label={v4("cueTitle")} data-cue="1" data-press="1">
      <header className="c4-cue-head">
        <p className="c4-cue-plate" data-logo="mono">{v4("cueLogo")}</p>
        <div>
          <p className="c4-pay-kicker">{v4("cueSub")}</p>
          <h2 className="c4-title">{v4("cueTitle")}</h2>
        </div>
        <p className="c4-cue-count">{shown.length}</p>
      </header>
      <p className="c4-meta">{v4("cueHint")}</p>
      <p className="c4-meta">{v4("cueLocal")}</p>
      <p className="c4-meta">{v4("cueBlank")}</p>
      <p className="c4-meta">{v4("cueOwnerBlank")}</p>
      <p className="c4-meta">{v4("cueMinuteBlank")}</p>
      <p className="c4-meta">{v4("cueWingBlank")}</p>
      <p className="c4-meta">{v4("cueMarkBlank")}</p>
      <p className="c4-meta">{v4("cueToneBlank")}</p>
      <p className="c4-meta">{v4("cueEscape")}</p>
      <p className="c4-meta">{v4("cueSlash")}</p>
      <p className="c4-cue-notice" role="status">
        <span>{v4("cueNotice")}</span>
        <span className="c4-cue-count">{counts.late}</span>
        <button type="button" className="c4-btn" aria-pressed={lateOnly} onClick={() => { setLateOnly((value) => !value); setTray("open"); setBoard("cards"); }}>
          {lateOnly ? v4("cueNoticeAll") : v4("cueNoticeOpen")}
        </button>
      </p>
      <section className="c4-cue-kpi" aria-label={v4("cueKpi")}>
        <p className="c4-pay-kicker">{v4("cueKpi")}</p>
        {(["open", "held", "done", "pinned"] as const).map((key) => {
          const count = counts[key];
          const share = cueShare(count, total);
          const label = key === "open" ? v4("cueOpen") : key === "held" ? v4("cueHeld") : key === "done" ? v4("cueDoneTray") : v4("cuePinned");
          return (
            <p key={key} className="c4-cue-meter" data-tray={key}>
              <span>{label}</span>
              <span>{count}</span>
              <span>{v4("cueShare")} {share}%</span>
              <span className="c4-cue-track" aria-hidden="true"><i style={{ width: `${share}%` }} /></span>
            </p>
          );
        })}
      </section>
      <section className="c4-cue-chart" aria-label={v4("cueChart")}>
        {quarters.map((count, index) => {
          const code = QUARTERS[index];
          const on = minuteOn === code;
          const height = Math.max(8, Math.round((count / tallest) * 100));
          return (
            <button
              key={code}
              type="button"
              className="c4-cue-band"
              data-on={on ? "1" : "0"}
              data-filled={count ? "1" : "0"}
              aria-pressed={on}
              onClick={() => setMinuteFilter(on ? "all" : code)}
            >
              <span className="c4-cue-bar" aria-hidden="true"><i style={{ height: `${height}%` }} /></span>
              <span>{quarterLabel(index)}</span>
              <span>{count}</span>
            </button>
          );
        })}
      </section>
      <form className="c4-cue-next" onSubmit={(event) => event.preventDefault()}>
        <label className="c4-lab">
          <span>{v4("cueDeskMinute")}</span>
          <input className="c4-field" aria-label={v4("cueDeskMinute")} value={desk} inputMode="numeric" maxLength={2} onChange={(event) => setDesk(event.target.value)} onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            setDesk("");
          }} />
        </label>
        <p className="c4-cue-next-line">
          <span>{v4("cueNext")}</span>
          {nextCard ? <strong>{minuteLabel(nextCard.minute)} {nextCard.text}</strong> : <span>{minuteArg(desk).exact !== null ? v4("cueNextEmpty") : "—"}</span>}
        </p>
      </form>
      <form className="c4-cue-form" onSubmit={(event) => {
        event.preventDefault();
        const next = addCue(cues, { id: `cue-${Date.now().toString(36)}`, text, owner, minute, wing, mark, tone });
        if (next.length === cues.length) return;
        store(next);
        clearDraft();
      }} onKeyDown={(event) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        clearDraft();
      }}>
        <label className="c4-lab">
          <span>{v4("cueText")}</span>
          <input className="c4-field" aria-label={v4("cueText")} value={text} maxLength={72} onChange={(event) => setText(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("cueOwner")}</span>
          <input className="c4-field" aria-label={v4("cueOwner")} value={owner} maxLength={16} onChange={(event) => setOwner(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("cueMinute")}</span>
          <input className="c4-field" aria-label={v4("cueMinute")} value={minute} inputMode="numeric" maxLength={2} onChange={(event) => setMinute(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("cueWing")}</span>
          <input className="c4-field" aria-label={v4("cueWing")} value={wing} maxLength={8} onChange={(event) => setWing(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("cueMark")}</span>
          <input className="c4-field" aria-label={v4("cueMark")} value={mark} maxLength={10} onChange={(event) => setMark(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("cueTone")}</span>
          <input className="c4-field" aria-label={v4("cueTone")} value={tone} maxLength={8} onChange={(event) => setTone(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn">{v4("cueAdd")}</button>
      </form>
      <div className="c4-row" role="group" aria-label={v4("cueTitle")}>
        {(["open", "held", "done"] as const).map((key) => (
          <button key={key} type="button" className="c4-chip" data-on={tray === key ? "1" : "0"} aria-pressed={tray === key} onClick={() => { setTray(key); setBoard("cards"); if (key !== "open") setLateOnly(false); }}>
            {key === "open" ? v4("cueOpen") : key === "held" ? v4("cueHeld") : v4("cueDoneTray")}
          </button>
        ))}
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} aria-pressed={board === "timeline"} onClick={() => setBoard((value) => value === "timeline" ? "cards" : "timeline")}>{v4("cueTimeline")}</button>
        <button type="button" className="c4-chip" data-on={sharpOnly ? "1" : "0"} aria-pressed={sharpOnly} onClick={() => setSharpOnly((value) => !value)}>{v4("cueSharp")}</button>
      </div>
      <label className="c4-lab">
        <span>{v4("cueSearch")}</span>
        <input ref={searchRef} className="c4-field" aria-label={v4("cueSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          setQuery("");
        }} />
      </label>
      <div className="c4-row" role="group" aria-label={v4("cueOwners")}>
        <button type="button" className="c4-chip" data-on={ownerOn === "all" ? "1" : "0"} aria-pressed={ownerOn === "all"} onClick={() => setOwnerFilter("all")}>{v4("cueAllOwners")}</button>
        <button type="button" className="c4-chip" data-on={ownerOn === "blank" ? "1" : "0"} aria-pressed={ownerOn === "blank"} onClick={() => setOwnerFilter(ownerOn === "blank" ? "all" : "blank")}>{v4("cueBlankOwner")}</button>
        {owners.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={ownerOn === item ? "1" : "0"} aria-pressed={ownerOn === item} onClick={() => setOwnerFilter(ownerOn === item ? "all" : item)}>{item}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("cueWings")}>
        <button type="button" className="c4-chip" data-on={wingOn === "all" ? "1" : "0"} aria-pressed={wingOn === "all"} onClick={() => setWingFilter("all")}>{v4("cueAllWings")}</button>
        <button type="button" className="c4-chip" data-on={wingOn === "blank" ? "1" : "0"} aria-pressed={wingOn === "blank"} onClick={() => setWingFilter(wingOn === "blank" ? "all" : "blank")}>{v4("cueBlankWing")}</button>
        {wings.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={wingOn === item ? "1" : "0"} aria-pressed={wingOn === item} onClick={() => setWingFilter(wingOn === item ? "all" : item)}>{wingName(v4, item)}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("cueMarks")}>
        <button type="button" className="c4-chip" data-on={markOn === "all" ? "1" : "0"} aria-pressed={markOn === "all"} onClick={() => setMarkFilter("all")}>{v4("cueAllMarks")}</button>
        <button type="button" className="c4-chip" data-on={markOn === "blank" ? "1" : "0"} aria-pressed={markOn === "blank"} onClick={() => setMarkFilter(markOn === "blank" ? "all" : "blank")}>{v4("cueBlankMark")}</button>
        {marks.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={markOn === item ? "1" : "0"} aria-pressed={markOn === item} onClick={() => setMarkFilter(markOn === item ? "all" : item)}>{item}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("cueTones")}>
        <button type="button" className="c4-chip" data-on={toneOn === "all" ? "1" : "0"} aria-pressed={toneOn === "all"} onClick={() => setToneFilter("all")}>{v4("cueAllTones")}</button>
        <button type="button" className="c4-chip" data-on={toneOn === "blank" ? "1" : "0"} aria-pressed={toneOn === "blank"} onClick={() => setToneFilter(toneOn === "blank" ? "all" : "blank")}>{v4("cueBlankTone")}</button>
        {tones.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={toneOn === item ? "1" : "0"} aria-pressed={toneOn === item} onClick={() => setToneFilter(toneOn === item ? "all" : item)}>{toneName(v4, item)}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("cueMinutes")}>
        {(["all", "blank", "early", "middle", "late"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={minuteOn === item ? "1" : "0"} aria-pressed={minuteOn === item} onClick={() => setMinuteFilter(item)}>
            {item === "all" ? v4("cueAllMinutes") : item === "blank" ? v4("cueBlankMinute") : item === "early" ? v4("cueEarly") : item === "middle" ? v4("cueMiddle") : v4("cueLate")}
          </button>
        ))}
      </div>
      <form className="c4-cue-view" onSubmit={(event) => {
        event.preventDefault();
        const next = addCueView(views, {
          id: `view-${Date.now().toString(36)}`,
          name: viewName,
          tray,
          query,
          owner: ownerOn,
          wing: wingOn,
          mark: markOn,
          tone: toneOn,
          minute: minuteOn,
        });
        if (next.length === views.length) return;
        storeViews(next);
        setViewName("");
      }}>
        <label className="c4-lab">
          <span>{v4("cueViewName")}</span>
          <input className="c4-field" aria-label={v4("cueViewName")} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn">{v4("cueSaveView")}</button>
      </form>
      <section aria-label={v4("cueViews")}>
        <p className="c4-pay-kicker">{v4("cueViews")}</p>
        {!views.length && <p className="c4-meta">{v4("cueViewEmpty")}</p>}
        <ul className="c4-cue-views">
          {views.map((view) => (
            <li key={view.id}>
              <button type="button" className="c4-btn" onClick={() => applyView(view)}>{view.name}</button>
              <button type="button" className="c4-btn" onClick={() => storeViews(dropCueView(views, view.id))}>{v4("cueDropView")}</button>
            </li>
          ))}
        </ul>
      </section>
      <p className="c4-row">
        <button type="button" className="c4-btn" onClick={() => store(bulkCuePinned(cues, shown.map((cue) => cue.id), true))}>{v4("cueBulkPin")}</button>
        <button type="button" className="c4-btn" onClick={() => store(bulkCueDone(cues, shown.map((cue) => cue.id), true))}>{v4("cueBulkDone")}</button>
        <button type="button" className="c4-btn" onClick={() => download("cue-cards.csv", cuesCsv(cues, desk))}>{v4("cueCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => store(resetCues())}>{v4("cueReset")}</button>
      </p>
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("cueEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-cue-rows">
          {shown.map((cue) => {
            const band = minuteBand(cue.minute);
            const clashes = cueClashIds(cues, cue.id);
            const gap = minuteGap(cue.minute, desk);
            const wingLabel = wingOf(cue.wing);
            const toneLabel = toneOf(cue.tone);
            return (
              <li key={cue.id} data-band={band} data-wing={wingLabel} data-tone={toneLabel} data-late={gap !== null && gap > 0 && !cue.held && !cue.done ? "1" : "0"}>
                <span className="c4-cue-minute">{minuteLabel(cue.minute)}</span>
                <div>
                  <p className="c4-cue-pips" aria-label={v4("cueTone")}>
                    {(["quiet", "warm", "sharp"] as const).map((pip) => <i key={pip} data-on={toneLabel === pip || (pip === "quiet" && toneLabel === "warm") || (pip !== "sharp" && toneLabel === "sharp") ? "1" : "0"} />)}
                  </p>
                  {editing === cue.id ? (
                    <form onSubmit={(event) => {
                      event.preventDefault();
                      store(editCue(cues, cue.id, draft));
                      setEditing("");
                      setDraft("");
                    }}>
                      <label className="c4-lab">
                        <span>{v4("cueEdit")}</span>
                        <input className="c4-field" aria-label={v4("cueEdit")} value={draft} maxLength={72} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => {
                          if (event.key !== "Escape") return;
                          event.preventDefault();
                          setEditing("");
                          setDraft("");
                        }} />
                      </label>
                      <button type="submit" className="c4-btn">{v4("cueSaveEdit")}</button>
                    </form>
                  ) : <p>{cue.text}</p>}
                  <p className="c4-cue-wing">{wingName(v4, wingLabel)}</p>
                  <p className="c4-cue-tone">{toneName(v4, toneLabel)}</p>
                  {cue.owner ? <p className="c4-cue-owner">{cue.owner}</p> : null}
                  {cue.mark ? <p className="c4-cue-mark">{cue.mark}</p> : null}
                  {gap !== null ? <p className="c4-meta">{gap > 0 ? v4("cueLate") : gap < 0 ? v4("cueAhead") : v4("cueNow")} {gap === 0 ? "" : Math.abs(gap)}</p> : null}
                  <p className="c4-meta">{clashes.length ? `${v4("cueClash")} ${clashes.length}` : v4("cueClashNone")}</p>
                  {cue.audit ? <p className="c4-meta">{v4("cueAudit")} {auditName(v4, cue.audit)}</p> : null}
                </div>
                <div className="c4-row">
                  <button type="button" className="c4-btn" onClick={() => copyCue(cue)}>{copied === cue.id ? v4("cueCopied") : v4("cueCopy")}</button>
                  <button type="button" className="c4-btn" onClick={() => { setEditing(cue.id); setDraft(cue.text); }}>{v4("cueEdit")}</button>
                  <button type="button" className="c4-btn" onClick={() => store(stepCueTone(cues, cue.id, 1))}>{v4("cueRaise")}</button>
                  <button type="button" className="c4-btn" onClick={() => store(stepCueTone(cues, cue.id, -1))}>{v4("cueLower")}</button>
                  <button type="button" className="c4-btn" aria-pressed={cue.pinned} onClick={() => store(setCuePinned(cues, cue.id, !cue.pinned))}>{cue.pinned ? v4("cueUnpin") : v4("cuePin")}</button>
                  <button type="button" className="c4-btn" aria-pressed={cue.held} onClick={() => store(setCueHeld(cues, cue.id, !cue.held))}>{cue.held ? v4("cueRelease") : v4("cueHold")}</button>
                  <button type="button" className="c4-btn" aria-pressed={cue.done} onClick={() => store(setCueDone(cues, cue.id, !cue.done))}>{cue.done ? v4("cueReopen") : v4("cueDone")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {board === "timeline" && (
        <ol className="c4-cue-time">
          {timeline.map((cue) => (
            <li key={cue.id} data-band={minuteBand(cue.minute)}>
              <span className="c4-cue-hour">{minuteLabel(cue.minute)}</span>
              <p>{cue.text}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export function CustomerRegions({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [hiddenRegions, setHiddenRegions] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [compass, setCompass] = useState("all");
  const [span, setSpan] = useState("all");
  const [initial, setInitial] = useState("all");
  const [blank, setBlank] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [query, setQuery] = useState("");
  const rows = (data.data?.users || []).map((row): GlanceRow | null => {
    const id = String(row.id || "").trim();
    if (!id) return null;
    return {
      id,
      label: String(row.name || row.email || "").trim(),
      region: row.lastRegion,
    };
  }).filter((row): row is GlanceRow => Boolean(row));
  const lines = regionLines(rows);
  const compasses = compassLines(rows);
  const spans = spanLines(rows);
  const initials = regionInitialLines(rows);
  const present = namedRegions(rows);
  const presentKey = present.join("\n");
  const compassNames = namedCompasses(rows);
  const spanNames = namedSpans(rows);
  const initialNames = namedRegionInitials(rows);
  const blankCount = lines.find((line) => !line.region)?.count || 0;
  const blankInitial = initials.find((line) => !line.initial)?.count || 0;
  const lead = leadingRegion(rows);
  const leadCompass = leadingCompass(rows);
  const leadSpan = leadingSpan(rows);
  const leadInitial = leadingRegionInitial(rows);
  const loading = data.loading && !data.data;
  const failed = Boolean(data.error);
  useEffect(() => {
    if (loading || failed) return;
    const next = readHiddenRegions(readJson(REGION_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHiddenRegions(next);
    writeJson(REGION_KEY, next);
  }, [loading, failed, presentKey]);
  const chips = visibleRegions(present, hiddenRegions, showHidden);
  const region = activeRegion(selected, chips);
  const compassOn = activeCompass(compass, compassNames);
  const spanOn = activeSpan(span, spanNames);
  const initialOn = activeRegionInitial(initial, initialNames);
  const shown = visibleRegionCustomers(rows, region, blank, compassArg(compassOn), spanArg(spanOn), regionInitialArg(initialOn), query);
  const widest = Math.max(1, ...compasses.map((line) => line.count));

  function store(next: string[], clear: string) {
    setHiddenRegions(next);
    writeJson(REGION_KEY, next);
    if (clear && activeRegion(selected, [clear])) setSelected("");
  }

  return (
    <section className="c4-region" aria-label={v4("rgnTitle")} data-region="1" data-press="1">
      <header className="c4-rgn-head">
        <div>
          <p className="c4-pay-kicker">{v4("rgnSub")}</p>
          <h2 className="c4-title">{v4("rgnTitle")}</h2>
        </div>
        <p className="c4-cue-count">{v4("rgnRows")} {rows.length}</p>
      </header>
      <p className="c4-meta">{v4("rgnHint")}</p>
      <p className="c4-meta">{v4("rgnLocal")}</p>
      <p className="c4-meta">{v4("rgnEscape")}</p>
      {lead ? <p className="c4-rgn-lead"><span>{v4("rgnLead")}</span> {lead}</p> : null}
      {leadCompass ? <p className="c4-rgn-lead"><span>{v4("rgnLeadCompass")}</span> {compassName(v4, leadCompass)}</p> : null}
      {leadSpan ? <p className="c4-rgn-lead"><span>{v4("rgnLeadSpan")}</span> {spanName(v4, leadSpan)}</p> : null}
      {leadInitial ? <p className="c4-rgn-lead"><span>{v4("rgnLeadInitial")}</span> {leadInitial}</p> : null}
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "customers")}>{v4("rgnBoard")}</Link>
        <button type="button" className="c4-btn" onClick={() => download("customer-regions.csv", regionsCsv(rows))}>{v4("rgnCsv")}</button>
      </p>
      {loading && !rows.length && <p className="c4-meta">{v4("rgnLoading")}</p>}
      {failed && !rows.length && <p className="c4-meta">{v4("rgnFailed")}</p>}
      {!loading && !failed && !rows.length && <p className="c4-pay-empty">{v4("rgnNone")}</p>}
      {compasses.length > 0 && (
        <section className="c4-rgn-chart" aria-label={v4("rgnCompass")}>
          {compasses.map((line) => {
            const share = regionShare(line.count, rows.length);
            const width = Math.max(8, Math.round((line.count / widest) * 100));
            const name = line.compass || "blank";
            return (
              <p key={name} className="c4-rgn-col" data-compass={name}>
                <span>{compassName(v4, line.compass)}</span>
                <span className="c4-rgn-track" aria-hidden="true"><i style={{ width: `${width}%` }} /></span>
                <span>{line.count}</span>
                <span>{v4("rgnShare")} {share}%</span>
              </p>
            );
          })}
        </section>
      )}
      {blankCount > 0 && (
        <button type="button" className="c4-rgn-blank" data-on={blank ? "1" : "0"} aria-pressed={blank} onClick={() => { setBlank((value) => !value); setSelected(""); setCompass("all"); setSpan("all"); setInitial("all"); }}>
          <span>{v4("rgnBlank")}</span>
          <span className="c4-cue-count">{blankCount}</span>
          <span className="c4-rgn-track" aria-hidden="true"><i style={{ width: `${regionShare(blankCount, rows.length)}%` }} /></span>
        </button>
      )}
      <div className="c4-row" role="group" aria-label={v4("rgnCompass")}>
        <button type="button" className="c4-chip" data-on={compassOn === "all" && !blank ? "1" : "0"} aria-pressed={compassOn === "all"} onClick={() => { setCompass("all"); setBlank(false); }}>{v4("rgnAllCompass")}</button>
        {compasses.some((line) => !line.compass) && (
          <button type="button" className="c4-chip" data-on={compassOn === "blank" ? "1" : "0"} aria-pressed={compassOn === "blank"} onClick={() => { setCompass(compassOn === "blank" ? "all" : "blank"); setBlank(false); setSelected(""); }}>{v4("rgnBlankCompass")}</button>
        )}
        {compassNames.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={compassOn === item ? "1" : "0"} aria-pressed={compassOn === item} onClick={() => { setBlank(false); setSelected(""); setCompass(compassOn === item ? "all" : item); }}>{compassName(v4, item)}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("rgnSpans")}>
        <button type="button" className="c4-chip" data-on={spanOn === "all" && !blank ? "1" : "0"} aria-pressed={spanOn === "all"} onClick={() => { setSpan("all"); setBlank(false); }}>{v4("rgnAllSpans")}</button>
        {spans.some((line) => !line.span) && (
          <button type="button" className="c4-chip" data-on={spanOn === "blank" ? "1" : "0"} aria-pressed={spanOn === "blank"} onClick={() => { setSpan(spanOn === "blank" ? "all" : "blank"); setBlank(false); setSelected(""); }}>{v4("rgnBlankSpan")}</button>
        )}
        {spanNames.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={spanOn === item ? "1" : "0"} aria-pressed={spanOn === item} onClick={() => { setBlank(false); setSelected(""); setSpan(spanOn === item ? "all" : item); }}>{spanName(v4, item)}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("rgnInitials")}>
        <button type="button" className="c4-chip" data-on={initialOn === "all" && !blank ? "1" : "0"} aria-pressed={initialOn === "all"} onClick={() => { setInitial("all"); setBlank(false); }}>{v4("rgnAllInitials")}</button>
        {blankInitial > 0 && (
          <button type="button" className="c4-chip" data-on={initialOn === "blank" ? "1" : "0"} aria-pressed={initialOn === "blank"} onClick={() => { setInitial(initialOn === "blank" ? "all" : "blank"); setBlank(false); setSelected(""); }}>{v4("rgnBlankInitial")}</button>
        )}
        {initialNames.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={initialOn === item ? "1" : "0"} aria-pressed={initialOn === item} onClick={() => { setBlank(false); setSelected(""); setInitial(initialOn === item ? "all" : item); }}>{item === "#" ? v4("rgnOther") : item}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("rgnShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("rgnShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("rgnHidden")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("rgnTitle")}>
        <button type="button" className="c4-chip" data-on={!region && !blank && compassOn === "all" && spanOn === "all" && initialOn === "all" ? "1" : "0"} aria-pressed={!region && !blank} onClick={() => { setSelected(""); setBlank(false); setCompass("all"); setSpan("all"); setInitial("all"); }}>{v4("rgnAll")}</button>
        {chips.map((item) => {
          const line = lines.find((row) => row.region === item);
          const count = line?.count || 0;
          const share = regionShare(count, rows.length);
          const mark = regionInitialOf(item);
          const compassMark = compassOf(item) as Compass;
          const spanMark = spanOf(item) as RegionSpan;
          return (
            <span key={item} className="c4-rgn-pair" data-region={item}>
              <button type="button" className="c4-chip" data-on={region === item ? "1" : "0"} aria-pressed={region === item} onClick={() => { setBlank(false); setCompass("all"); setSpan("all"); setInitial("all"); setSelected(region === item ? "" : item); }}>{item}</button>
              {compassMark ? <span className="c4-rgn-compass">{compassName(v4, compassMark)}</span> : null}
              {spanMark ? <span className="c4-rgn-span">{spanName(v4, spanMark)}</span> : null}
              {mark ? <span className="c4-rgn-initial">{v4("rgnInitial")} {mark === "#" ? v4("rgnOther") : mark}</span> : null}
              <span className="c4-cue-count">{count}</span>
              <span className="c4-rgn-share">{v4("rgnShare")} {share}%</span>
              <span className="c4-rgn-track" aria-hidden="true"><i style={{ width: `${share}%` }} /></span>
              <button type="button" className="c4-btn" onClick={() => store(toggleRegion(hiddenRegions, item, present), showHidden ? "" : item)}>{showHidden ? v4("rgnShow") : v4("rgnHide")}</button>
            </span>
          );
        })}
      </div>
      <label className="c4-lab">
        <span>{v4("rgnSearch")}</span>
        <input className="c4-field" aria-label={v4("rgnSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          setQuery("");
        }} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c4-pay-empty">{v4("rgnEmpty")}</p>}
      <ul className="c4-rgn-rows">
        {shown.map((row) => {
          const name = regionText(row.region);
          const mark = regionInitialOf(name);
          const compassMark = compassOf(name);
          const spanMark = spanOf(name);
          return (
            <li key={row.id} data-region={name || "blank"}>
              <span className="c4-rgn-spine" aria-hidden="true" />
              <p>{row.label || row.id}</p>
              <p className="c4-meta">{name || v4("rgnBlank")}</p>
              {compassMark ? <p className="c4-rgn-compass">{compassName(v4, compassMark)}</p> : null}
              {spanMark ? <p className="c4-rgn-span">{spanName(v4, spanMark)}</p> : null}
              {mark ? <p className="c4-rgn-initial">{mark === "#" ? v4("rgnOther") : mark}</p> : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
