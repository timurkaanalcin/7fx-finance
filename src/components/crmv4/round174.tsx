"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  LADDER_KEY,
  LADDER_VIEW_KEY,
  MARK_KEY,
  MARK_REVIEW_KEY,
  activeGait,
  activeHold,
  activeMark,
  activeMarkDepth,
  activePicker,
  activePitch,
  activeRow,
  activeRung,
  activeTint,
  addLadder,
  addLadderView,
  bulkLadderFile,
  bulkLadderGait,
  bulkLadderPin,
  bulkReview,
  clashRungCount,
  cycleTint,
  dropLadderView,
  editLadder,
  editLadderNote,
  gaitArg,
  gaitCounts,
  holdArg,
  isoPair,
  ladderCopy,
  ladderCounts,
  ladderGaits,
  ladderPickers,
  ladderRows,
  ladderShare,
  ladderTints,
  laddersCsv,
  lateLadder,
  leadingMark,
  leadingMarkDepth,
  markArg,
  markBand,
  markBands,
  markCopy,
  markDepth,
  markDepthArg,
  markDepths,
  markLength,
  markRowsCsv,
  markShare,
  markState,
  marksCsv,
  nextLadder,
  oddCodeCount,
  pickerArg,
  pickerLoad,
  pitchArg,
  pitchClashCount,
  pitchClashIds,
  presentMarks,
  readHiddenMarks,
  readLadderViews,
  readLadders,
  readReviewed,
  resetLadders,
  rowArg,
  rungArg,
  rungBand,
  rungClashIds,
  rungGap,
  rungTimeline,
  setLadderClimb,
  setLadderFiled,
  setLadderPin,
  suggestGait,
  suggestPicker,
  tintArg,
  tintOf,
  toggleMark,
  toggleReview,
  usedRungs,
  visibleLadders,
  visibleMarkBands,
  visibleMarkCustomers,
  gaitOf,
  type Ladder,
  type LadderGait,
  type LadderTint,
  type LadderTray,
  type LadderView,
  type MarkBand,
  type MarkDepth,
  type MarkRow,
  type MarkShape,
} from "@/lib/crmv4/round174";
import { useJson } from "./kit";
import { storedRole } from "./round5";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  lastCountry?: string | null;
};

type GlanceRow = MarkRow & { id: string };

const GAITS = ["step", "climb", "reach"] as const;
const BANDS = ["mote", "pair", "span", "name"] as const;

function gaitName(v4: V4, gait: LadderGait | string): string {
  if (gait === "step") return v4("ldrGaitStep");
  if (gait === "climb") return v4("ldrGaitClimb");
  if (gait === "reach") return v4("ldrGaitReach");
  return v4("ldrBlankGait");
}

function tintName(v4: V4, tint: LadderTint): string {
  if (tint === "dew") return v4("ldrDew");
  if (tint === "amber") return v4("ldrAmber");
  if (tint === "garnet") return v4("ldrGarnet");
  return v4("ldrBlankTint");
}

function rungName(v4: V4, name: string): string {
  if (name === "low") return v4("ldrLow");
  if (name === "mid") return v4("ldrMid");
  if (name === "high") return v4("ldrHigh");
  if (name === "end") return v4("ldrEnd");
  if (name === "body") return v4("ldrBody");
  if (/^[1-9]$/.test(name)) return name;
  return v4("ldrBlankRung");
}

function pitchName(v4: V4, pitch: number | null): string {
  if (pitch === 1) return v4("ldrPitch1");
  if (pitch === 2) return v4("ldrPitch2");
  if (pitch === 3) return v4("ldrPitch3");
  if (pitch === 4) return v4("ldrPitch4");
  if (pitch === 5) return v4("ldrPitch5");
  return v4("ldrBlankPitch");
}

function holdName(v4: V4, hold: number | null): string {
  if (hold === 6) return v4("ldrHold6");
  if (hold === 12) return v4("ldrHold12");
  if (hold === 18) return v4("ldrHold18");
  if (hold === 24) return v4("ldrHold24");
  return v4("ldrBlankHold");
}

function bandName(v4: V4, name: string): string {
  if (name === "mote") return v4("ctyMote");
  if (name === "pair") return v4("ctyPair");
  if (name === "span") return v4("ctySpan");
  if (name === "name") return v4("ctyName");
  if (name === "blank") return v4("ctyClear");
  return v4("ctyUnmarked");
}

function depthName(v4: V4, name: string): string {
  if (name === "near") return v4("ctyNear");
  if (name === "mid") return v4("ctyMid");
  if (name === "far") return v4("ctyFar");
  return v4("ctyUnmarked");
}

function auditName(v4: V4, audit: string): string {
  const key = {
    save: "ldrAuditSave",
    edit: "ldrAuditEdit",
    tint: "ldrAuditTint",
    pin: "ldrAuditPin",
    unpin: "ldrAuditUnpin",
    climb: "ldrAuditClimb",
    ground: "ldrAuditGround",
    file: "ldrAuditFile",
    reopen: "ldrAuditReopen",
    move: "ldrAuditMove",
  }[audit];
  return key ? v4(key as CrmV4CopyKey) : "";
}

function rungLabel(rung: number | null): string {
  return rung === null ? "—" : String(rung);
}

function gapLabel(v4: V4, rung: number | null, desk: string): string {
  const gap = rungGap(rung, desk);
  if (gap === null) return "";
  if (gap > 0) return `${v4("ldrPast")} ${gap}`;
  if (gap < 0) return `${v4("ldrAhead")} ${Math.abs(gap)}`;
  return v4("ldrDue");
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

function sameCards(left: readonly Ladder[], right: readonly Ladder[]): boolean {
  return left.length === right.length && left.every((card, index) => card.id === right[index]?.id && card.title === right[index]?.title && card.note === right[index]?.note && card.audit === right[index]?.audit);
}

export function OrchardLadders({ v4 }: { v4: V4 }) {
  const [cards, setCards] = useState<Ladder[]>([]);
  const [views, setViews] = useState<LadderView[]>([]);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [picker, setPicker] = useState("");
  const [rung, setRung] = useState("");
  const [gait, setGait] = useState("");
  const [row, setRow] = useState("");
  const [tint, setTint] = useState("");
  const [pitch, setPitch] = useState("");
  const [hold, setHold] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<LadderTray>("open");
  const [pickerFilter, setPickerFilter] = useState("all");
  const [gaitFilter, setGaitFilter] = useState("all");
  const [rowFilter, setRowFilter] = useState("all");
  const [tintFilter, setTintFilter] = useState("all");
  const [rungFilter, setRungFilter] = useState("all");
  const [pitchFilter, setPitchFilter] = useState("all");
  const [holdFilter, setHoldFilter] = useState("all");
  const [garnetOnly, setGarnetOnly] = useState(false);
  const [endOnly, setEndOnly] = useState(false);
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const [copied, setCopied] = useState("");
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [desk, setDesk] = useState("");
  const [moveGait, setMoveGait] = useState("step");
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  useEffect(() => {
    const next = readLadders(readJson(LADDER_KEY, []));
    const saved = readLadderViews(readJson(LADDER_VIEW_KEY, []));
    setCards(next);
    setViews(saved);
    writeJson(LADDER_KEY, next);
    writeJson(LADDER_VIEW_KEY, saved);
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
  const pickers = ladderPickers(cards);
  const gaits = ladderGaits(cards);
  const rows = ladderRows(cards);
  const tints = ladderTints(cards);
  const bars = gaitCounts(cards);
  const pickerOn = activePicker(pickerFilter, pickers);
  const gaitOn = activeGait(gaitFilter, GAITS);
  const rowOn = activeRow(rowFilter, rows);
  const tintOn = activeTint(tintFilter, tints);
  const rungOn = activeRung(rungFilter);
  const pitchOn = activePitch(pitchFilter);
  const holdOn = activeHold(holdFilter);
  const pickedRung = rungArg(rungOn);
  const shown = visibleLadders(
    cards,
    tray,
    query,
    pickerArg(pickerOn),
    gaitArg(gaitOn),
    rowArg(rowOn),
    tintArg(tintOn),
    pickedRung.exact,
    pickedRung.pick,
    pitchArg(pitchOn),
    holdArg(holdOn),
    garnetOnly,
    endOnly,
  );
  const timeline = rungTimeline(cards, query);
  const counts = ladderCounts(cards, desk);
  const clashes = clashRungCount(cards);
  const pitchClashes = pitchClashCount(cards);
  const span = usedRungs(cards);
  const total = cards.length;
  const nextId = nextLadder(cards, desk);
  const nextCard = cards.find((card) => card.id === nextId);
  const widest = Math.max(1, ...bars);
  const pinned = cards.filter((card) => card.pinned);
  const load = pickerLoad(cards, picker);
  const suggested = suggestGait(cards);
  const lightPicker = suggestPicker(cards);
  const targets = picked.length ? picked : shown.map((card) => card.id);

  function store(next: Ladder[]) {
    setCards(next);
    writeJson(LADDER_KEY, next);
  }

  function storeViews(next: LadderView[]) {
    setViews(next);
    writeJson(LADDER_VIEW_KEY, next);
  }

  function clearDraft() {
    setTitle("");
    setNote("");
    setPicker("");
    setRung("");
    setGait("");
    setRow("");
    setTint("");
    setPitch("");
    setHold("");
  }

  function copyCard(card: Ladder) {
    const body = ladderCopy(card.title);
    if (!body) return;
    if (navigator.clipboard?.writeText) void navigator.clipboard.writeText(body);
    setCopied(card.id);
  }

  function applyView(view: LadderView) {
    setTray(view.tray);
    setQuery(view.query);
    setPickerFilter(activePicker(view.picker, ladderPickers(cards)));
    setGaitFilter(activeGait(view.gait, GAITS));
    setRowFilter(activeRow(view.row, ladderRows(cards)));
    setTintFilter(activeTint(view.tint, ladderTints(cards)));
    setRungFilter(activeRung(view.rung));
    setPitchFilter(activePitch(view.pitch));
    setHoldFilter(activeHold(view.hold));
    setBoard("cards");
    setGarnetOnly(false);
    setEndOnly(false);
  }

  function togglePick(id: string) {
    setPicked((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  return (
    <section className="c4-ldr" aria-label={v4("ldrTitle")} data-ladders="1" data-role={role}>
      <header className="c4-ldr-head">
        <p className="c4-ldr-plate" data-logo="mono">{v4("ldrLogo")}</p>
        <div>
          <p className="c4-ldr-kicker">{v4("ldrSub")}</p>
          <h2 className="c4-title">{v4("ldrTitle")}</h2>
        </div>
        <p className="c4-ldr-count">{shown.length}</p>
      </header>
      <details className="c4-ldr-rules">
        <summary>{v4("ldrRules")}</summary>
        <p className="c4-meta">{v4("ldrHint")}</p>
        <p className="c4-meta">{v4("ldrLocal")}</p>
        <p className="c4-meta">{v4("ldrBlank")}</p>
        <p className="c4-meta">{v4("ldrPickerBlank")}</p>
        <p className="c4-meta">{v4("ldrRungBlank")}</p>
        <p className="c4-meta">{v4("ldrGaitBlank")}</p>
        <p className="c4-meta">{v4("ldrRowBlank")}</p>
        <p className="c4-meta">{v4("ldrTintBlank")}</p>
        <p className="c4-meta">{v4("ldrPitchBlank")}</p>
        <p className="c4-meta">{v4("ldrHoldBlank")}</p>
        <p className="c4-meta">{v4("ldrNoteBlank")}</p>
        <p className="c4-meta">{v4("ldrEscape")}</p>
        <p className="c4-meta">{v4("ldrSlash")}</p>
        <p className="c4-meta">{v4("ldrNew")}</p>
      </details>
      {viewer ? <p className="c4-ldr-notice" role="status">{v4("ldrViewer")}</p> : null}
      <p className="c4-ldr-notice" role="status">
        <span>{v4("ldrNotice")}</span>
        <span className="c4-ldr-count">{counts.end}</span>
        <button type="button" className="c4-btn" aria-pressed={endOnly} onClick={() => { setEndOnly((value) => !value); setTray("open"); setBoard("cards"); }}>
          {endOnly ? v4("ldrNoticeAll") : v4("ldrNoticeEnd")}
        </button>
      </p>
      <p className="c4-ldr-notice" role="status">
        <span>{v4("ldrLate")}</span>
        <span className="c4-ldr-count">{counts.late}</span>
      </p>
      <p className="c4-ldr-notice" role="status">
        <span>{v4("ldrSpan")}</span>
        <span className="c4-ldr-count">{span}</span>
      </p>
      <p className="c4-ldr-notice" role="status">
        <span>{v4("ldrClash")}</span>
        <span className="c4-ldr-count">{clashes}</span>
      </p>
      <p className="c4-ldr-notice" role="status">
        <span>{v4("ldrPitchClash")}</span>
        <span className="c4-ldr-count">{pitchClashes}</span>
      </p>
      <p className="c4-ldr-suggest" role="status">
        <span>{v4("ldrSuggest")}</span>
        <strong>{gaitName(v4, suggested)}</strong>
        <button type="button" className="c4-btn" disabled={viewer} onClick={() => setGait(suggested)}>{v4("ldrUseGait")}</button>
      </p>
      <p className="c4-ldr-suggest" role="status">
        <span>{v4("ldrSuggestPicker")}</span>
        <strong>{lightPicker || v4("ldrBlankPicker")}</strong>
        <button type="button" className="c4-btn" disabled={viewer || !lightPicker} onClick={() => setPicker(lightPicker)}>{v4("ldrUsePicker")}</button>
      </p>
      {pinned.length > 0 && (
        <ul className="c4-ldr-pins" aria-label={v4("ldrPinned")}>
          {pinned.map((card) => (
            <li key={card.id}>
              <button type="button" className="c4-chip" onClick={() => { setQuery(card.title); setBoard("cards"); }}>{card.title}</button>
            </li>
          ))}
        </ul>
      )}
      <section className="c4-ldr-kpi" aria-label={v4("ldrKpi")}>
        {(["open", "climbed", "filed", "pinned"] as const).map((key) => {
          const count = counts[key];
          const share = ladderShare(count, total);
          const label = key === "open" ? v4("ldrWaiting") : key === "climbed" ? v4("ldrClimbed") : key === "filed" ? v4("ldrFiled") : v4("ldrPin");
          return (
            <p key={key} className="c4-ldr-meter" data-tray={key}>
              <span>{label}</span>
              <strong>{count}</strong>
              <span>{v4("ldrShare")} {share}%</span>
              <span className="c4-ldr-track" aria-hidden="true"><i style={{ width: `${share}%` }} /></span>
            </p>
          );
        })}
      </section>
      <section className="c4-ldr-chart" aria-label={v4("ldrChart")}>
        <p className="c4-ldr-kicker">{v4("ldrChart")}</p>
        {GAITS.map((name, index) => {
          const count = bars[index] || 0;
          const width = Math.max(8, Math.round((count / widest) * 100));
          return (
            <button key={name} type="button" className="c4-ldr-col" data-on={gaitOn === name ? "1" : "0"} aria-pressed={gaitOn === name} onClick={() => setGaitFilter(gaitOn === name ? "all" : name)}>
              <span>{gaitName(v4, name)}</span>
              <span className="c4-ldr-bar" aria-hidden="true"><i style={{ width: `${width}%` }} /></span>
              <span>{count}</span>
            </button>
          );
        })}
      </section>
      <div className="c4-ldr-split">
        <form className="c4-ldr-form" onSubmit={(event) => {
          event.preventDefault();
          if (viewer) return;
          const next = addLadder(cards, { id: `ldr-${Date.now()}`, title, note, picker, rung, gait, row, tint, pitch, hold });
          if (sameCards(next, cards)) return;
          store(next);
          clearDraft();
        }}>
          <label className="c4-lab">
            <span>{v4("ldrLine")}</span>
            <input ref={titleRef} className="c4-field" aria-label={v4("ldrLine")} value={title} disabled={viewer} onChange={(event) => setTitle(event.target.value)} onKeyDown={(event) => {
              if (event.key !== "Escape") return;
              event.preventDefault();
              clearDraft();
            }} />
          </label>
          <label className="c4-lab">
            <span>{v4("ldrNote")}</span>
            <input className="c4-field" aria-label={v4("ldrNote")} value={note} disabled={viewer} onChange={(event) => setNote(event.target.value)} />
          </label>
          <label className="c4-lab">
            <span>{v4("ldrPicker")}</span>
            <input className="c4-field" aria-label={v4("ldrPicker")} value={picker} disabled={viewer} onChange={(event) => setPicker(event.target.value)} />
          </label>
          <p className="c4-meta" role="status">{v4("ldrLoad")} {load}</p>
          <label className="c4-lab">
            <span>{v4("ldrRung")}</span>
            <input className="c4-field" inputMode="numeric" aria-label={v4("ldrRung")} value={rung} disabled={viewer} onChange={(event) => setRung(event.target.value)} />
          </label>
          <label className="c4-lab">
            <span>{v4("ldrGait")}</span>
            <select className="c4-select" aria-label={v4("ldrGait")} value={gait} disabled={viewer} onChange={(event) => setGait(event.target.value)}>
              <option value="">{v4("ldrBlankGait")}</option>
              <option value="step">{v4("ldrGaitStep")}</option>
              <option value="climb">{v4("ldrGaitClimb")}</option>
              <option value="reach">{v4("ldrGaitReach")}</option>
            </select>
          </label>
          <label className="c4-lab">
            <span>{v4("ldrRow")}</span>
            <input className="c4-field" aria-label={v4("ldrRow")} value={row} disabled={viewer} onChange={(event) => setRow(event.target.value)} />
          </label>
          <label className="c4-lab">
            <span>{v4("ldrTint")}</span>
            <select className="c4-select" aria-label={v4("ldrTint")} value={tint} disabled={viewer} onChange={(event) => setTint(event.target.value)}>
              <option value="">{v4("ldrBlankTint")}</option>
              <option value="dew">{v4("ldrDew")}</option>
              <option value="amber">{v4("ldrAmber")}</option>
              <option value="garnet">{v4("ldrGarnet")}</option>
            </select>
          </label>
          <label className="c4-lab">
            <span>{v4("ldrPitch")}</span>
            <select className="c4-select" aria-label={v4("ldrPitch")} value={pitch} disabled={viewer} onChange={(event) => setPitch(event.target.value)}>
              <option value="">{v4("ldrBlankPitch")}</option>
              <option value="1">{v4("ldrPitch1")}</option>
              <option value="2">{v4("ldrPitch2")}</option>
              <option value="3">{v4("ldrPitch3")}</option>
              <option value="4">{v4("ldrPitch4")}</option>
              <option value="5">{v4("ldrPitch5")}</option>
            </select>
          </label>
          <label className="c4-lab">
            <span>{v4("ldrHold")}</span>
            <select className="c4-select" aria-label={v4("ldrHold")} value={hold} disabled={viewer} onChange={(event) => setHold(event.target.value)}>
              <option value="">{v4("ldrBlankHold")}</option>
              <option value="6">{v4("ldrHold6")}</option>
              <option value="12">{v4("ldrHold12")}</option>
              <option value="18">{v4("ldrHold18")}</option>
              <option value="24">{v4("ldrHold24")}</option>
            </select>
          </label>
          <button type="submit" className="c4-btn" disabled={viewer}>{v4("ldrAdd")}</button>
        </form>
        <div className="c4-ldr-board">
          <div className="c4-row" role="group" aria-label={v4("ldrTitle")}>
            <button type="button" className="c4-chip" data-on={tray === "open" ? "1" : "0"} aria-pressed={tray === "open"} onClick={() => setTray("open")}>{v4("ldrWaiting")}</button>
            <button type="button" className="c4-chip" data-on={tray === "climbed" ? "1" : "0"} aria-pressed={tray === "climbed"} onClick={() => setTray("climbed")}>{v4("ldrClimbed")}</button>
            <button type="button" className="c4-chip" data-on={tray === "filed" ? "1" : "0"} aria-pressed={tray === "filed"} onClick={() => setTray("filed")}>{v4("ldrFiled")}</button>
            <button type="button" className="c4-chip" data-on={board === "cards" ? "1" : "0"} aria-pressed={board === "cards"} onClick={() => setBoard("cards")}>{v4("ldrCards")}</button>
            <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} aria-pressed={board === "timeline"} onClick={() => setBoard("timeline")}>{v4("ldrTimeline")}</button>
            <button type="button" className="c4-chip" data-on={garnetOnly ? "1" : "0"} aria-pressed={garnetOnly} onClick={() => setGarnetOnly((value) => !value)}>{v4("ldrGarnetOnly")}</button>
            <button type="button" className="c4-chip" data-on={endOnly ? "1" : "0"} aria-pressed={endOnly} onClick={() => { setEndOnly((value) => !value); setTray("open"); }}>{v4("ldrEndOnly")}</button>
            <button type="button" className="c4-btn" onClick={() => download("orchard-ladders.csv", laddersCsv(cards, desk))}>{v4("ldrCsv")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => setPicked(shown.map((card) => card.id))}>{v4("ldrPickAll")}</button>
            <button type="button" className="c4-btn" onClick={() => setPicked([])}>{v4("ldrPickNone")}</button>
            <span className="c4-ldr-count">{v4("ldrPicked")} {picked.length}</span>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkLadderPin(cards, targets, true))}>{v4("ldrBulkPin")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkLadderFile(cards, targets, true))}>{v4("ldrBulkFile")}</button>
            <label className="c4-lab">
              <span>{v4("ldrBulkGait")}</span>
              <select className="c4-select" aria-label={v4("ldrBulkGait")} value={moveGait} disabled={viewer} onChange={(event) => setMoveGait(event.target.value)}>
                <option value="step">{v4("ldrGaitStep")}</option>
                <option value="climb">{v4("ldrGaitClimb")}</option>
                <option value="reach">{v4("ldrGaitReach")}</option>
              </select>
            </label>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bulkLadderGait(cards, targets, moveGait))}>{v4("ldrBulkGait")}</button>
            <button type="button" className="c4-btn" disabled={viewer} onClick={() => { store(resetLadders()); setPicked([]); }}>{v4("ldrReset")}</button>
          </div>
          <label className="c4-lab">
            <span>{v4("ldrSearch")}</span>
            <input ref={searchRef} className="c4-field" aria-label={v4("ldrSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
              if (event.key !== "Escape") return;
              event.preventDefault();
              setQuery("");
            }} />
          </label>
          <label className="c4-lab">
            <span>{v4("ldrDesk")}</span>
            <input className="c4-field" inputMode="numeric" aria-label={v4("ldrDesk")} value={desk} onChange={(event) => setDesk(event.target.value)} />
          </label>
          <p className="c4-meta" role="status">
            {v4("ldrNext")} {nextCard ? nextCard.title : v4("ldrNextNone")}
          </p>
          <div className="c4-row" role="group" aria-label={v4("ldrPickers")}>
            <button type="button" className="c4-chip" data-on={pickerOn === "all" ? "1" : "0"} aria-pressed={pickerOn === "all"} onClick={() => setPickerFilter("all")}>{v4("ldrAllPickers")}</button>
            <button type="button" className="c4-chip" data-on={pickerOn === "blank" ? "1" : "0"} aria-pressed={pickerOn === "blank"} onClick={() => setPickerFilter("blank")}>{v4("ldrBlankPicker")}</button>
            {pickers.map((name) => (
              <button key={name} type="button" className="c4-chip" data-on={pickerOn === name ? "1" : "0"} aria-pressed={pickerOn === name} onClick={() => setPickerFilter(name)}>{name}</button>
            ))}
          </div>
          <div className="c4-row" role="group" aria-label={v4("ldrGaits")}>
            <button type="button" className="c4-chip" data-on={gaitOn === "all" ? "1" : "0"} aria-pressed={gaitOn === "all"} onClick={() => setGaitFilter("all")}>{v4("ldrAllGaits")}</button>
            <button type="button" className="c4-chip" data-on={gaitOn === "blank" ? "1" : "0"} aria-pressed={gaitOn === "blank"} onClick={() => setGaitFilter("blank")}>{v4("ldrBlankGait")}</button>
            {gaits.map((name) => (
              <button key={name} type="button" className="c4-chip" data-on={gaitOn === name ? "1" : "0"} aria-pressed={gaitOn === name} onClick={() => setGaitFilter(name)}>{gaitName(v4, name)}</button>
            ))}
          </div>
          <div className="c4-row" role="group" aria-label={v4("ldrRows")}>
            <button type="button" className="c4-chip" data-on={rowOn === "all" ? "1" : "0"} aria-pressed={rowOn === "all"} onClick={() => setRowFilter("all")}>{v4("ldrAllRows")}</button>
            <button type="button" className="c4-chip" data-on={rowOn === "blank" ? "1" : "0"} aria-pressed={rowOn === "blank"} onClick={() => setRowFilter("blank")}>{v4("ldrBlankRow")}</button>
            {rows.map((name) => (
              <button key={name} type="button" className="c4-chip" data-on={rowOn === name ? "1" : "0"} aria-pressed={rowOn === name} onClick={() => setRowFilter(name)}>{name}</button>
            ))}
          </div>
          <div className="c4-row" role="group" aria-label={v4("ldrTints")}>
            <button type="button" className="c4-chip" data-on={tintOn === "all" ? "1" : "0"} aria-pressed={tintOn === "all"} onClick={() => setTintFilter("all")}>{v4("ldrAllTints")}</button>
            <button type="button" className="c4-chip" data-on={tintOn === "blank" ? "1" : "0"} aria-pressed={tintOn === "blank"} onClick={() => setTintFilter("blank")}>{v4("ldrBlankTint")}</button>
            {tints.map((name) => (
              <button key={name} type="button" className="c4-chip" data-on={tintOn === name ? "1" : "0"} aria-pressed={tintOn === name} onClick={() => setTintFilter(name)}>{tintName(v4, name)}</button>
            ))}
          </div>
          <div className="c4-row" role="group" aria-label={v4("ldrRungs")}>
            {(["all", "blank", "low", "mid", "high", "end", "body"] as const).map((name) => (
              <button key={name} type="button" className="c4-chip" data-on={rungOn === name ? "1" : "0"} aria-pressed={rungOn === name} onClick={() => setRungFilter(name)}>
                {name === "all" ? v4("ldrAllRungs") : rungName(v4, name)}
              </button>
            ))}
          </div>
          <div className="c4-row" role="group" aria-label={v4("ldrPitches")}>
            {(["all", "blank", "1", "2", "3", "4", "5"] as const).map((name) => (
              <button key={name} type="button" className="c4-chip" data-on={pitchOn === name ? "1" : "0"} aria-pressed={pitchOn === name} onClick={() => setPitchFilter(name)}>
                {name === "all" ? v4("ldrAllPitches") : name === "blank" ? v4("ldrBlankPitch") : pitchName(v4, Number(name))}
              </button>
            ))}
          </div>
          <div className="c4-row" role="group" aria-label={v4("ldrHolds")}>
            {(["all", "blank", "6", "12", "18", "24"] as const).map((name) => (
              <button key={name} type="button" className="c4-chip" data-on={holdOn === name ? "1" : "0"} aria-pressed={holdOn === name} onClick={() => setHoldFilter(name)}>
                {name === "all" ? v4("ldrAllHolds") : name === "blank" ? v4("ldrBlankHold") : holdName(v4, Number(name))}
              </button>
            ))}
          </div>
          <form className="c4-row" onSubmit={(event) => {
            event.preventDefault();
            if (viewer) return;
            const next = addLadderView(views, {
              id: `view-${Date.now()}`,
              name: viewName,
              tray,
              query,
              picker: pickerOn,
              gait: gaitOn,
              row: rowOn,
              tint: tintOn,
              rung: rungOn,
              pitch: pitchOn,
              hold: holdOn,
            });
            if (next.length === views.length) return;
            storeViews(next);
            setViewName("");
          }}>
            <label className="c4-lab">
              <span>{v4("ldrViewName")}</span>
              <input className="c4-field" aria-label={v4("ldrViewName")} value={viewName} disabled={viewer} onChange={(event) => setViewName(event.target.value)} />
            </label>
            <button type="submit" className="c4-btn" disabled={viewer}>{v4("ldrSaveView")}</button>
          </form>
          <section aria-label={v4("ldrViews")}>
            <p className="c4-ldr-kicker">{v4("ldrViews")}</p>
            {!views.length && <p className="c4-ldr-empty">{v4("ldrViewEmpty")}</p>}
            <ul className="c4-ldr-views">
              {views.map((view) => (
                <li key={view.id}>
                  <button type="button" className="c4-btn" onClick={() => applyView(view)}>{view.name}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeViews(dropLadderView(views, view.id))}>{v4("ldrDropView")}</button>
                </li>
              ))}
            </ul>
          </section>
          {board === "cards" && !shown.length && <p className="c4-ldr-empty">{v4("ldrEmpty")}</p>}
          {board === "cards" && (
            <ul className="c4-ldr-rows">
              {shown.map((card) => {
                const clashesOn = rungClashIds(cards, card.id);
                const pitchesOn = pitchClashIds(cards, card.id);
                const gap = gapLabel(v4, card.rung, desk);
                const band = rungBand(card.rung);
                const editingCard = editing === card.id;
                const late = lateLadder(card, desk);
                return (
                  <li key={card.id} data-tint={card.tint || "blank"} data-gait={card.gait || "blank"} data-late={late ? "1" : "0"}>
                    <span className="c4-ldr-mark" aria-hidden="true">{rungLabel(card.rung)}</span>
                    <div>
                      <label className="c4-ldr-pick">
                        <input type="checkbox" checked={picked.includes(card.id)} aria-label={v4("ldrPick")} onChange={() => togglePick(card.id)} />
                        <span>{v4("ldrPick")}</span>
                      </label>
                      {editingCard ? (
                        <form className="c4-row" onSubmit={(event) => {
                          event.preventDefault();
                          if (viewer) return;
                          const titled = editLadder(cards, card.id, draft);
                          store(editLadderNote(titled, card.id, noteDraft));
                          setEditing("");
                        }}>
                          <input className="c4-field" aria-label={v4("ldrEdit")} value={draft} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                          <input className="c4-field" aria-label={v4("ldrNote")} value={noteDraft} disabled={viewer} onChange={(event) => setNoteDraft(event.target.value)} />
                          <button type="submit" className="c4-btn" disabled={viewer}>{v4("ldrSaveEdit")}</button>
                        </form>
                      ) : (
                        <>
                          <p>{card.title}</p>
                          {card.note ? <p className="c4-meta">{card.note}</p> : null}
                        </>
                      )}
                      <p className="c4-meta">
                        {card.picker || v4("ldrBlankPicker")}
                        {" · "}
                        {rungLabel(card.rung)}
                        {" · "}
                        {gaitName(v4, gaitOf(card.gait))}
                        {" · "}
                        {card.row || v4("ldrBlankRow")}
                        {" · "}
                        {tintName(v4, tintOf(card.tint))}
                        {" · "}
                        {pitchName(v4, card.pitch)}
                        {" · "}
                        {holdName(v4, card.hold)}
                        {band === "blank" ? "" : ` · ${rungName(v4, band)}`}
                        {gap ? ` · ${gap}` : ""}
                        {late ? ` · ${v4("ldrLate")}` : ""}
                        {auditName(v4, card.audit) ? ` · ${v4("ldrAudit")} ${auditName(v4, card.audit)}` : ""}
                        {" · "}
                        {clashesOn.length ? `${v4("ldrClash")} ${clashesOn.length}` : v4("ldrClashNone")}
                        {" · "}
                        {pitchesOn.length ? `${v4("ldrPitchClash")} ${pitchesOn.length}` : v4("ldrPitchClashNone")}
                      </p>
                    </div>
                    <div className="c4-row">
                      <button type="button" className="c4-btn" onClick={() => copyCard(card)}>{copied === card.id ? v4("ldrCopied") : v4("ldrCopy")}</button>
                      <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); setNoteDraft(card.note); }}>{v4("ldrEdit")}</button>
                      <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(cycleTint(cards, card.id))}>{v4("ldrTintUp")}</button>
                      <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.pinned} onClick={() => store(setLadderPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("ldrUnpin") : v4("ldrPin")}</button>
                      <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.climbed} onClick={() => store(setLadderClimb(cards, card.id, !card.climbed))}>{card.climbed ? v4("ldrGround") : v4("ldrClimbOn")}</button>
                      <button type="button" className="c4-btn" disabled={viewer} aria-pressed={card.filed} onClick={() => store(setLadderFiled(cards, card.id, !card.filed))}>{card.filed ? v4("ldrReopen") : v4("ldrFile")}</button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          {board === "timeline" && (
            <ol className="c4-ldr-time">
              {timeline.map((card) => (
                <li key={card.id}>
                  <span className="c4-ldr-clock">{rungLabel(card.rung)}</span>
                  <p>{card.title}</p>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </section>
  );
}

export function CountryMarks({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [hiddenBands, setHiddenBands] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [depth, setDepth] = useState("all");
  const [showHidden, setShowHidden] = useState(false);
  const [review, setReview] = useState<"all" | "reviewed" | "open">("all");
  const [shape, setShape] = useState<MarkShape>("all");
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState("");
  const rows = useMemo(() => (data.data?.users || []).map((row): GlanceRow | null => {
    const id = String(row.id || "").trim();
    if (!id) return null;
    return {
      id,
      label: String(row.name || "").trim(),
      note: row.lastCountry,
    };
  }).filter((row): row is GlanceRow => Boolean(row)), [data.data?.users]);
  const bandsOn = markBands(rows);
  const depths = markDepths(rows);
  const present = presentMarks(rows);
  const presentKey = present.join("\n");
  const presentIds = rows.map((row) => row.id);
  const idKey = presentIds.join("\n");
  const bandNames = present.filter((item) => item !== "blank");
  const depthNames = depths.map((line) => line.depth).filter(Boolean);
  const leadBand = leadingMark(rows);
  const leadDepth = leadingMarkDepth(rows);
  const odd = oddCodeCount(rows);
  const loading = data.loading && !data.data;
  const failed = Boolean(data.error);
  useEffect(() => {
    if (loading || failed) return;
    const known = presentKey ? presentKey.split("\n") : [];
    const next = readHiddenMarks(readJson(MARK_KEY, []), known);
    setHiddenBands(next);
    writeJson(MARK_KEY, next);
  }, [loading, failed, presentKey]);
  useEffect(() => {
    if (loading || failed) return;
    const known = idKey ? idKey.split("\n") : [];
    const next = readReviewed(readJson(MARK_REVIEW_KEY, []), known);
    setReviewed(next);
    writeJson(MARK_REVIEW_KEY, next);
  }, [loading, failed, idKey]);
  const chips = visibleMarkBands(present, hiddenBands, showHidden);
  const depthOn = activeMarkDepth(depth, depthNames);
  const bandOn = selected ? activeMark(selected, bandNames) : "all";
  const shown = visibleMarkCustomers(
    rows,
    selected ? markArg(bandOn === "all" && selected === "blank" ? "blank" : bandOn) : null,
    markDepthArg(depthOn),
    query,
    review,
    reviewed,
    shape,
  );
  const widest = Math.max(1, ...bandsOn.map((line) => line.count));
  const setCount = rows.filter((row) => markState(row.note) === "set").length;
  const openCount = rows.filter((row) => !reviewed.includes(row.id)).length;

  function store(next: string[], clear: string) {
    setHiddenBands(next);
    writeJson(MARK_KEY, next);
    if (clear && selected === clear) setSelected("");
  }

  function storeReview(next: string[]) {
    setReviewed(next);
    writeJson(MARK_REVIEW_KEY, next);
  }

  function copyCode(row: GlanceRow) {
    const body = markCopy(row.note);
    if (!body) return;
    if (navigator.clipboard?.writeText) void navigator.clipboard.writeText(body);
    setCopied(row.id);
  }

  return (
    <section className="c4-cty" aria-label={v4("ctyTitle")} data-marks="1">
      <header className="c4-cty-head">
        <div>
          <p className="c4-ldr-kicker">{v4("ctySub")}</p>
          <h2 className="c4-title">{v4("ctyTitle")}</h2>
        </div>
        <p className="c4-ldr-count">{v4("ctyRows")} {rows.length}</p>
      </header>
      <details className="c4-ldr-rules">
        <summary>{v4("ctyRules")}</summary>
        <p className="c4-meta">{v4("ctyHint")}</p>
        <p className="c4-meta">{v4("ctyLocal")}</p>
        <p className="c4-meta">{v4("ctyEscape")}</p>
      </details>
      <p className="c4-ldr-notice" role="status">
        <span>{v4("ctySetNotice")}</span>
        <span className="c4-ldr-count">{setCount}</span>
      </p>
      <p className="c4-ldr-notice" role="status">
        <span>{v4("ctyUnreviewed")}</span>
        <span className="c4-ldr-count">{openCount}</span>
      </p>
      <p className="c4-ldr-notice" role="status">
        <span>{v4("ctyOdd")}</span>
        <span className="c4-ldr-count">{odd}</span>
        <button type="button" className="c4-btn" aria-pressed={shape === "odd"} onClick={() => setShape(shape === "odd" ? "all" : "odd")}>
          {shape === "odd" ? v4("ctyAllShapes") : v4("ctyOddOnly")}
        </button>
      </p>
      {leadBand ? <p className="c4-cty-lead"><span>{v4("ctyLeadBand")}</span> {bandName(v4, leadBand)}</p> : null}
      {leadDepth ? <p className="c4-cty-lead"><span>{v4("ctyLeadDepth")}</span> {depthName(v4, leadDepth)}</p> : null}
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "customers")}>{v4("ctyBoard")}</Link>
        <button type="button" className="c4-btn" onClick={() => download("country-marks.csv", marksCsv(rows))}>{v4("ctyCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("country-mark-rows.csv", markRowsCsv(rows, reviewed))}>{v4("ctyRowCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => storeReview(bulkReview(reviewed, shown.map((row) => row.id), presentIds, true))}>{v4("ctyBulkReview")}</button>
      </p>
      {loading && !rows.length && <p className="c4-meta">{v4("ctyLoading")}</p>}
      {failed && !rows.length && <p className="c4-meta">{v4("ctyFailed")}</p>}
      {!loading && !failed && !rows.length && <p className="c4-ldr-empty">{v4("ctyNone")}</p>}
      {bandsOn.length > 0 && (
        <section className="c4-cty-chart" aria-label={v4("ctyAllBands")}>
          {bandsOn.map((line) => {
            const share = markShare(line.count, rows.length);
            const bar = Math.max(8, Math.round((line.count / widest) * 100));
            const name = line.band || "blank";
            return (
              <p key={name} className="c4-cty-col" data-band={name}>
                <span>{bandName(v4, line.band)}</span>
                <span className="c4-ldr-track" aria-hidden="true"><i style={{ width: `${bar}%` }} /></span>
                <span>{line.count}</span>
                <span>{v4("ctyShare")} {share}%</span>
              </p>
            );
          })}
        </section>
      )}
      <div className="c4-row" role="group" aria-label={v4("ctyShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("ctyShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("ctyHidden")}</button>
      </div>
      <div className="c4-cty-bands" role="group" aria-label={v4("ctyAllBands")}>
        <button type="button" className="c4-cty-band" data-on={!selected ? "1" : "0"} aria-pressed={!selected} onClick={() => setSelected("")}>
          <span>{v4("ctyAllBands")}</span>
          <span className="c4-ldr-count">{rows.length}</span>
        </button>
        {chips.map((item) => {
          const count = rows.filter((row) => {
            const state = markState(row.note);
            const token = state === "set" ? markBand(row.note) : state === "clear" ? "blank" : "";
            return token === item;
          }).length;
          const share = markShare(count, rows.length);
          return (
            <span key={item} className="c4-cty-pair">
              <button type="button" className="c4-cty-band" data-on={selected === item ? "1" : "0"} aria-pressed={selected === item} onClick={() => setSelected(selected === item ? "" : item)}>
                <span>{bandName(v4, item)}</span>
                <span className="c4-ldr-count">{count}</span>
                <span>{v4("ctyShare")} {share}%</span>
              </button>
              <button type="button" className="c4-btn" onClick={() => store(toggleMark(hiddenBands, item, present), showHidden ? "" : item)}>{showHidden ? v4("ctyShow") : v4("ctyHide")}</button>
            </span>
          );
        })}
      </div>
      <div className="c4-row" role="group" aria-label={v4("ctyDepths")}>
        <button type="button" className="c4-chip" data-on={depthOn === "all" ? "1" : "0"} aria-pressed={depthOn === "all"} onClick={() => setDepth("all")}>{v4("ctyAllDepths")}</button>
        {depths.filter((line) => line.depth).map((line) => (
          <button key={line.depth} type="button" className="c4-chip" data-on={depthOn === line.depth ? "1" : "0"} aria-pressed={depthOn === line.depth} onClick={() => setDepth(depthOn === line.depth ? "all" : line.depth)}>
            {depthName(v4, line.depth)} {line.count}
          </button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("ctyShapes")}>
        <button type="button" className="c4-chip" data-on={shape === "all" ? "1" : "0"} aria-pressed={shape === "all"} onClick={() => setShape("all")}>{v4("ctyAllShapes")}</button>
        <button type="button" className="c4-chip" data-on={shape === "pair" ? "1" : "0"} aria-pressed={shape === "pair"} onClick={() => setShape("pair")}>{v4("ctyPairs")}</button>
        <button type="button" className="c4-chip" data-on={shape === "odd" ? "1" : "0"} aria-pressed={shape === "odd"} onClick={() => setShape("odd")}>{v4("ctyOddOnly")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("ctyReview")}>
        <button type="button" className="c4-chip" data-on={review === "all" ? "1" : "0"} aria-pressed={review === "all"} onClick={() => setReview("all")}>{v4("ctyAllMarks")}</button>
        <button type="button" className="c4-chip" data-on={review === "open" ? "1" : "0"} aria-pressed={review === "open"} onClick={() => setReview("open")}>{v4("ctyOpenMarks")}</button>
        <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} aria-pressed={review === "reviewed"} onClick={() => setReview("reviewed")}>{v4("ctyReviewed")}</button>
      </div>
      <label className="c4-lab">
        <span>{v4("ctySearch")}</span>
        <input className="c4-field" aria-label={v4("ctySearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          setQuery("");
        }} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c4-ldr-empty">{v4("ctyEmpty")}</p>}
      <ul className="c4-cty-rows">
        {shown.map((row) => {
          const state = markState(row.note);
          const band = markBand(row.note) as MarkBand;
          const depthMark = markDepth(row.note) as MarkDepth;
          const length = markLength(row.note);
          const pair = isoPair(row.note);
          const done = reviewed.includes(row.id);
          return (
            <li key={row.id} data-state={state || "blank"} data-band={band || "blank"} data-depth={depthMark || "blank"} data-pair={pair ? "1" : "0"} data-reviewed={done ? "1" : "0"}>
              <span className="c4-cty-face" aria-hidden="true">{length === null ? "—" : String(length)}</span>
              <p>{row.label || row.id}</p>
              <p className="c4-meta">
                {state === "set" ? bandName(v4, band) : state === "clear" ? v4("ctyClear") : v4("ctyUnmarked")}
                {" · "}
                {depthName(v4, depthMark)}
                {length === null ? "" : ` · ${v4("ctyLength")} ${length}`}
                {pair ? ` · ${v4("ctyPairs")}` : ""}
              </p>
              <div className="c4-row">
                <button type="button" className="c4-btn" onClick={() => copyCode(row)}>{copied === row.id ? v4("ctyCopied") : v4("ctyCopy")}</button>
                <button type="button" className="c4-btn" aria-pressed={done} onClick={() => storeReview(toggleReview(reviewed, row.id, presentIds))}>{done ? v4("ctyReviewed") : v4("ctyReview")}</button>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="c4-meta">{BANDS.map((name) => bandName(v4, name)).join(" · ")}</p>
    </section>
  );
}
