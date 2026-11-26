"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  CIS_DENSITY_KEY,
  CIS_STROKES,
  CIS_KEY,
  CIS_VIEW_KEY,
  ITG_HIDE_KEY,
  ITG_REVIEW_KEY,
  addCisele,
  addCiseleTag,
  addCiseleView,
  briskCisele,
  bulkCiseleChest,
  bulkCiseleInk,
  bulkCiseleRaise,
  bulkCiseleTag,
  bulkItgReview,
  busiestChisel,
  ciseleBars,
  ciseleChisels,
  ciseleCopy,
  ciseleCounts,
  ciseleCsv,
  ciseleDensity,
  ciseleTimeline,
  clampCiseleFocused,
  dropCiseleView,
  editCisele,
  editCiseleNote,
  fairChisel,
  glazeFocused,
  itgBare,
  itgBrief,
  itgCopy,
  itgDesk,
  itgDigit,
  itgEven,
  itgFamily,
  itgFirst,
  itgHeld,
  itgHue,
  itgLane,
  itgLanes,
  itgLanesCsv,
  itgLater,
  itgLength,
  itgLetter,
  itgLine,
  itgLower,
  itgMixed,
  itgOpen,
  itgPair,
  itgReturn,
  itgRowsCsv,
  itgScope,
  itgShare,
  itgShut,
  itgSpace,
  itgSpanLane,
  itgStamp,
  itgTail,
  itgUpper,
  itgVowel,
  inkQuiet,
  strokeCool,
  strokeWarm,
  idleCisele,
  laneItgCount,
  lateCisele,
  leadingItg,
  leadingItgHue,
  lowerBeadFocused,
  lowerSpanFocused,
  moveCiseleFocus,
  overdueCisele,
  presentItgLanes,
  raiseBeadFocused,
  raiseSpanFocused,
  readCiseleViews,
  readCiseles,
  readHiddenItg,
  readReviewedItg,
  reminderCiseles,
  restingCisele,
  setCiseleClip,
  setCiseleChest,
  setCiseleGlaze,
  setCiseleFocused,
  setCiseleRaised,
  setCiseleStar,
  sortCiseles,
  starCiseleFocused,
  suggestGlaze,
  suggestStroke,
  suggestSpan,
  toggleItg,
  toggleItgReview,
  visibleCiseles,
  visibleItg,
  visibleItgLanes,
  type Cisele,
  type CiseleDensity,
  type CiseleSort,
  type CiseleTray,
  type CiseleView,
  type ItgReview,
  type ItgRow,
  type ItgShape,
  type ItgValue,
} from "@/lib/crmv4/round379";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const GLAZES = ["PEARL", "INK", "GILT"] as const;
const SPANS = ["8", "16", "32", "64"] as const;
const BEADS = ["2", "4", "6"] as const;

const STROKE_KEY: Record<string, CrmV4CopyKey> = {
  trace: "cisTrace",
  bevel: "cisBevel",
  point: "cisPoint",
  flare: "cisFlare",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "cisAuditSave",
  edit: "cisAuditEdit",
  note: "cisAuditNote",
  glaze: "cisAuditGlaze",
  raise: "cisAuditRaise",
  free: "cisAuditFree",
  pin: "cisAuditPin",
  return: "cisAuditReturn",
  vault: "cisAuditVault",
  open: "cisAuditOpen",
  tag: "cisAuditTag",
  bead: "cisAuditBead",
  sla: "cisAuditSla",
  lower: "cisAuditLower",
  star: "cisAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  mark: "itgLaneMark",
  shut: "itgLaneShut",
  later: "itgLaneLater",
  desk: "itgLaneDesk",
  return: "itgLaneReturn",
  pair: "itgPair",
  scope: "itgScope",
  brief: "itgBrief",
  span: "itgSpan",
  digit: "itgStampLane",
  openv: "itgShapeVowel",
  bare: "itgBare",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  gilt: "itgGilt",
  pearl: "itgPearl",
  ink: "itgInk",
};

const SHAPE_KEY: Record<ItgShape, CrmV4CopyKey> = {
  all: "itgShapeAll",
  mark: "itgShapeMark",
  shut: "itgShapeShut",
  later: "itgShapeLater",
  return: "itgShapeReturn",
  pair: "itgShapePair",
  scope: "itgShapeScope",
  brief: "itgShapeBrief",
  span: "itgShapeSpan",
  digit: "itgShapeDigit",
  openv: "itgShapeVowel",
  bare: "itgShapeBare",
  open: "itgShapeOpen",
  soon: "itgShapeOpen",
  letter: "itgShapeBare",
  mixed: "itgShapeDigit",
  upper: "itgShapeUpper",
  lower: "itgShapeBare",
  space: "itgShapeSpace",
  even: "itgShapeEven",
  odd: "itgShapeEven",
  tail: "itgShapeDigit",
  first: "itgShapeBare",
  held: "itgShapeSpan",
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

function strokeLabel(v4: V4, stroke: string): string {
  const key = STROKE_KEY[stroke];
  return key ? v4(key) : v4("cisBlankStroke");
}

function glazeLabel(v4: V4, glaze: string): string {
  if (glaze === "PEARL") return v4("cisPearl");
  if (glaze === "INK") return v4("cisInk");
  if (glaze === "GILT") return v4("cisGilt");
  return v4("cisAll");
}

function laneLabel(v4: V4, mail: string): string {
  const key = LANE_KEY[mail];
  return key ? v4(key) : v4("itgBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("itgBlank");
}

export function CiseleRules({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Cisele[]>([]);
  const [views, setViews] = useState<CiseleView[]>([]);
  const [density, setDensity] = useState<CiseleDensity>("open");
  const [tray, setTray] = useState<CiseleTray>("bench");
  const [query, setQuery] = useState("");
  const [chiselFilter, setChiselFilter] = useState("");
  const [glazeFilter, setGlazeFilter] = useState("all");
  const [strokeFilter, setStrokeFilter] = useState("all");
  const [slaFilter, setSlaFilter] = useState("all");
  const [beadFilter, setBeadFilter] = useState("all");
  const [sort, setSort] = useState<CiseleSort>("stroke");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [chisel, setChisel] = useState("");
  const [stroke, setStroke] = useState("");
  const [glaze, setGlaze] = useState("");
  const [slaNo, setSlaNo] = useState("");
  const [beadNo, setBeadNo] = useState("");
  const [tags, setTags] = useState("");
  const [viewName, setViewName] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [focusAt, setFocusAt] = useState(0);
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [noteId, setNoteId] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [station, setStation] = useState("trace");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readCiseles(readJson(CIS_KEY, [])));
    setViews(readCiseleViews(readJson(CIS_VIEW_KEY, [])));
    setDensity(ciseleDensity(readJson(CIS_DENSITY_KEY, "open")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Cisele[]) {
    setCards(next);
    writeJson(CIS_KEY, next);
  }
  function storeViews(next: CiseleView[]) {
    setViews(next);
    writeJson(CIS_VIEW_KEY, next);
  }
  function storeDensity(next: CiseleDensity) {
    setDensity(next);
    writeJson(CIS_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortCiseles(visibleCiseles(cards, tray, query, chiselFilter, glazeFilter, strokeFilter, slaFilter, beadFilter), sort),
    [cards, tray, query, chiselFilter, glazeFilter, strokeFilter, slaFilter, beadFilter, sort],
  );
  const counts = ciseleCounts(cards, shown, station);
  const bars = ciseleBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = ciseleTimeline(cards);
  const reminders = reminderCiseles(cards);
  const chisels = ciseleChisels(cards);
  const busy = busiestChisel(cards);
  const fair = fairChisel(cards, chisels.join(","));
  const suggestedGlaze = suggestGlaze(cards);
  const suggestedSla = suggestSpan(cards, clock);
  const suggestedStroke = suggestStroke(clock);
  const focused = shown[Math.min(focusAt, Math.max(0, shown.length - 1))];

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "/" && !typingTarget(event)) {
        event.preventDefault();
        searchRef.current?.focus();
        return;
      }
      if (typingTarget(event) || viewer) return;
      if (event.key === "c" || event.key === "C") {
        event.preventDefault();
        titleRef.current?.focus();
        return;
      }
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("strokes.csv", ciseleCsv(shown, station));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((card) => card.id));
        return;
      }
      if (event.key === "j" || event.key === "J") setFocusAt((index) => moveCiseleFocus(index, shown.length, 1));
      if (event.key === "k" || event.key === "K") setFocusAt((index) => moveCiseleFocus(index, shown.length, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, shown, station]);

  function saveCard() {
    if (viewer) return;
    store(addCisele(cards, { title, note, chisel, stroke, sla: slaNo, glaze, bead: beadNo, tags }));
    setTitle("");
    setNote("");
    setTags("");
  }

  return (
    <section className="c4-cisele" aria-label={v4("cisTitle")} data-cards="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-cisele-mast">
        <p className="c4-cisele-seal" data-logo="mono">{v4("cisLogo")}</p>
        <div>
          <p className="c4-cisele-kicker">{v4("cisSub")}</p>
          <h2 className="c4-title">{v4("cisTitle")}</h2>
        </div>
        <p className="c4-cisele-count">{shown.length}</p>
      </header>
      <p className="c4-cisele-links">
        <Link href={crmv4Href(base, "itg")}>{v4("itgTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("cisCustomers")}</Link>
      </p>
      <p className="c4-cisele-hint">{v4("cisHint")}</p>
      {viewer && <p className="c4-cisele-note">{v4("cisViewer")}</p>}
      <p className="c4-cisele-meta">{v4("cisFair")} {fair || "—"} · {v4("cisBusy")} {busy || "—"} · {v4("cisSuggest")} {strokeLabel(v4, suggestedStroke)} · {glazeLabel(v4, suggestedGlaze)} · {suggestedSla}</p>
      <ol className="c4-cisele-index" aria-label={v4("cisRemind")}>
        <li data-tone="gold">{v4("cisOverdue")} {counts.overdue}</li>
        <li data-tone="ink">{v4("cisIdle")} {counts.idle}</li>
        <li data-tone="pearl">{v4("cisBrisk")} {counts.brisk}</li>
        <li data-tone="pearl">{v4("cisResting")} {counts.resting}</li>
      </ol>
      {reminders.length > 0 && (
        <ul className="c4-cisele-remind c4-cisele-notices" role="status" aria-label={v4("cisRemind")}>
          {reminders.map((name) => <li key={name}>{v4("cisOverdue")} {name}</li>)}
        </ul>
      )}
      <div className="c4-cisele-chart" aria-label={v4("cisChart")}>
        {bars.map((bar) => (
          <button key={bar.stroke} type="button" className="c4-cisele-column" data-on={strokeFilter === bar.stroke ? "1" : "0"} onClick={() => setStrokeFilter(strokeFilter === bar.stroke ? "all" : bar.stroke)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / peak) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{strokeLabel(v4, bar.stroke)}</span>
          </button>
        ))}
      </div>
      <form className="c4-cisele-form" onSubmit={(event) => { event.preventDefault(); saveCard(); }}>
        <label className="c4-lab">{v4("cisEdit")}<input ref={titleRef} className="c4-field" aria-label={v4("cisEdit")} value={title} maxLength={48} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("cisNote")}<input className="c4-field" aria-label={v4("cisNote")} aria-required={false} value={note} maxLength={80} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("cisChisel")}<input className="c4-field" aria-label={v4("cisChisel")} aria-required={false} value={chisel} maxLength={24} disabled={viewer} onChange={(event) => setChisel(event.target.value)} /></label>
        <label className="c4-lab">{v4("cisStroke")}<select className="c4-field" aria-label={v4("cisStroke")} value={stroke} disabled={viewer} onChange={(event) => setStroke(event.target.value)}><option value="">{v4("cisBlankStroke")}</option>{CIS_STROKES.map((item) => <option key={item} value={item}>{strokeLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("cisGlaze")}<select className="c4-field" aria-label={v4("cisGlaze")} value={glaze} disabled={viewer} onChange={(event) => setGlaze(event.target.value)}><option value="">{v4("cisAll")}</option>{GLAZES.map((item) => <option key={item} value={item}>{glazeLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("cisSpan")}<select className="c4-field" aria-label={v4("cisSpan")} value={slaNo} disabled={viewer} onChange={(event) => setSlaNo(event.target.value)}><option value="">{v4("cisAll")}</option>{SPANS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("cisBead")}<select className="c4-field" aria-label={v4("cisBead")} value={beadNo} disabled={viewer} onChange={(event) => setBeadNo(event.target.value)}><option value="">{v4("cisAll")}</option>{BEADS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("cisTag")}<input className="c4-field" aria-label={v4("cisTag")} aria-required={false} value={tags} maxLength={8} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("cisAdd")}</button>
      </form>
      <div className="c4-cisele-tools">
        <input ref={searchRef} className="c4-field c4-cisele-search" aria-label={v4("cisSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("cisSearch")} />
        {(["bench", "clamp", "chest"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{v4(item === "bench" ? "cisTablet" : item === "clamp" ? "cisClip" : "cisChest")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={strokeFilter === "warm" ? "1" : "0"} onClick={() => setStrokeFilter(strokeFilter === "warm" ? "all" : "warm")}>{v4("cisWarm")}</button>
        <button type="button" className="c4-chip" data-on={strokeFilter === "cool" ? "1" : "0"} onClick={() => setStrokeFilter(strokeFilter === "cool" ? "all" : "cool")}>{v4("cisCool")}</button>
        {GLAZES.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={glazeFilter === item ? "1" : "0"} onClick={() => setGlazeFilter(glazeFilter === item ? "all" : item)}>{glazeLabel(v4, item)}</button>
        ))}
        {SPANS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={slaFilter === item ? "1" : "0"} onClick={() => setSlaFilter(slaFilter === item ? "all" : item)}>{item}</button>
        ))}
        {BEADS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={beadFilter === item ? "1" : "0"} onClick={() => setBeadFilter(beadFilter === item ? "all" : item)}>{item}</button>
        ))}
        {chisels.map((name) => (
          <button key={name} type="button" className="c4-chip" data-on={chiselFilter === name ? "1" : "0"} onClick={() => setChiselFilter(chiselFilter === name ? "" : name)}>{name}</button>
        ))}
        <button type="button" className="c4-chip" data-on={sort === "chisel" ? "1" : "0"} onClick={() => setSort(sort === "chisel" ? "stroke" : "chisel")}>{sort === "chisel" ? v4("cisSortChisel") : v4("cisSortStroke")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "tight" ? "open" : "tight")}>{density === "tight" ? v4("cisTight") : v4("cisOpen")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("cisTimeline")}</button>
        <label className="c4-lab">{v4("cisDesk")}<select className="c4-field" aria-label={v4("cisDesk")} value={station} onChange={(event) => setStation(event.target.value)}>{CIS_STROKES.map((item) => <option key={item} value={item}>{strokeLabel(v4, item)}</option>)}</select></label>
      </div>
      <form className="c4-cisele-view" onSubmit={(event) => {
        event.preventDefault();
        const id = `v${Date.now().toString(36)}`;
        storeViews(addCiseleView(views, { id, name: viewName, tray, query, chisel: chiselFilter, glaze: glazeFilter, stroke: strokeFilter, sla: slaFilter, bead: beadFilter }));
        setViewName("");
      }}>
        <label className="c4-lab">{v4("cisViewName")}<input className="c4-field" aria-label={v4("cisViewName")} aria-required={false} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn">{v4("cisSaveView")}</button>
      </form>
      <ul className="c4-cisele-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setTray(view.tray); setQuery(view.query); setChiselFilter(view.chisel); setGlazeFilter(view.glaze); setStrokeFilter(view.stroke); setSlaFilter(view.sla); setBeadFilter(view.bead); }}>{v4("cisApply")} {view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropCiseleView(views, view.id))}>{v4("cisDropView")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-cisele-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkCiseleRaise(cards, picked))}>{v4("cisBulkRaise")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkCiseleChest(cards, picked))}>{v4("cisBulkChest")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkCiseleInk(cards, picked))}>{v4("cisBulkInk")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkCiseleTag(cards, picked))}>{v4("cisBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("strokes.csv", ciseleCsv(shown, station))}>{v4("cisCsv")}</button>
        <p className="c4-cisele-meta">{v4("cisKeys")} / c x a j k · {v4("cisQuiet")} {counts.quiet} · {v4("cisWarm")} {counts.warm}</p>
      </div>
      {board === "timeline" && (
        <ol className="c4-cisele-time" aria-label={v4("cisTimeline")}>
          {timeline.map((row) => <li key={row.sla}><span>{row.sla}</span> {row.titles.join(", ")}</li>)}
        </ol>
      )}
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("cisEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-cisele-list">
          {shown.map((card) => {
            const late = lateCisele(card, station);
            return (
              <li key={card.id} className="c4-cisele-card" data-on={focused?.id === card.id ? "1" : "0"} data-late={late ? "1" : "0"} data-idle={idleCisele(card) ? "1" : "0"} data-brisk={briskCisele(card) ? "1" : "0"} data-overdue={overdueCisele(card) ? "1" : "0"} data-resting={restingCisele(card) ? "1" : "0"} data-warm={strokeWarm(card.stroke) ? "1" : "0"} data-cool={strokeCool(card.stroke) ? "1" : "0"} data-quiet={inkQuiet(card.glaze) ? "1" : "0"}>
                <label className="c4-cisele-pick">
                  <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                </label>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editCisele(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("cisEdit")} value={draft} maxLength={48} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("cisApply")}</button>
                    </form>
                  ) : <p>{card.title}</p>}
                  <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editCiseleNote(cards, card.id, noteId === card.id ? noteDraft : card.note)); }}>
                    <input className="c4-field" aria-label={v4("cisNote")} aria-required={false} value={noteId === card.id ? noteDraft : card.note} maxLength={80} disabled={viewer} onChange={(event) => { setNoteId(card.id); setNoteDraft(event.target.value); }} onFocus={() => { setNoteId(card.id); setNoteDraft(card.note); }} />
                  </form>
                  <p className="c4-cisele-meta">{strokeLabel(v4, card.stroke)} · {glazeLabel(v4, card.glaze)} · {card.sla ?? "—"} · {card.bead} · {card.chisel || "—"} · {card.tags.join(" ") || "—"}{card.audit ? ` · ${v4(AUDIT_KEY[card.audit] || "cisAuditSave")}` : ""}{late ? ` · ${v4("cisOverdue")}` : ""}</p>
                </div>
                <div className="c4-cisele-actions">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("cisEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCiseleRaised(cards, card.id, !card.raised))}>{card.raised ? v4("cisFree") : v4("cisRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCiseleGlaze(cards, card.id, suggestedGlaze))}>{v4("cisSuggest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCiseleClip(cards, card.id, !card.clamped))}>{card.clamped ? v4("cisUnclamp") : v4("cisClipIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCiseleChest(cards, card.id, !card.chested))}>{card.chested ? v4("cisUnchest") : v4("cisChestIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCiseleStar(cards, card.id, !card.starred))}>{card.starred ? v4("cisUnstar") : v4("cisStar")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addCiseleTag(cards, card.id, "e"))}>{v4("cisTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseSpanFocused(cards, card.id))}>{v4("cisRaiseSpan")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerSpanFocused(cards, card.id))}>{v4("cisLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseBeadFocused(cards, card.id))}>{v4("cisBead")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerBeadFocused(cards, card.id))}>{v4("cisBead")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(glazeFocused(cards, card.id))}>{v4("cisGlaze")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCiseleFocused(cards, card.id))}>{v4("cisRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(clampCiseleFocused(cards, card.id))}>{v4("cisClip")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(starCiseleFocused(cards, card.id))}>{v4("cisStar")}</button>
                  <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(ciseleCopy(card))}>{v4("cisCopy")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

type CapUser = { id?: string; name?: string | null; accountLoginId?: string | null };

export function IntaglioLogins({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: CapUser[] }>("/api/admin/users?take=24&meta=0");
  const [mail, setMail] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<ItgShape>("all");
  const [review, setReview] = useState<ItgReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): ItgRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      userId: id,
      code: { accountLoginId: textField(row.accountLoginId) } satisfies ItgValue,
    };
  }).filter((row): row is ItgRow => Boolean(row));
  const present = presentItgLanes(rows);
  const presentKey = present.join("\n");
  const idKey = rows.map((row) => row.id).join("\n");

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
    if (queue.loading || queue.error) return;
    const next = readHiddenItg(readJson(ITG_HIDE_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(ITG_HIDE_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedItg(readJson(ITG_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(ITG_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleItgLanes(present, hidden, showHidden);
  const shown = visibleItg(rows, lanes.includes(mail) || mail === "all" ? mail : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = itgLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = itgLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingItg(rows);
  const leadHue = leadingItgHue(rows);
  const whole = rows.filter((row) => itgLane(row.code)).length;
  const share = itgShare(laneItgCount(rows, "mark"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("intaglio-lanes.csv", itgLanesCsv(rows));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((row) => row.id));
        return;
      }
      if (event.key !== "/") return;
      event.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [rows, shown]);

  function storeHidden(next: string[]) {
    setHidden(next);
    writeJson(ITG_HIDE_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(ITG_REVIEW_KEY, next);
  }

  return (
    <section className="c4-intaglio" aria-label={v4("itgTitle")} data-plates="1" data-role={role} data-names="1">
      <header className="c4-intaglio-mast">
        <p className="c4-intaglio-seal" data-logo="mono">{v4("itgLogo")}</p>
        <div>
          <p className="c4-intaglio-kicker">{v4("itgSub")}</p>
          <h2 className="c4-title">{v4("itgTitle")}</h2>
        </div>
        <p className="c4-intaglio-count">{shown.length}</p>
      </header>
      <p className="c4-intaglio-links">
        <Link href={crmv4Href(base, "cis")}>{v4("cisTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("itgCustomer")}</Link>
      </p>
      <p className="c4-intaglio-hint">{v4("itgHint")}</p>
      {viewer && <p className="c4-intaglio-note">{v4("itgViewer")}</p>}
      {queue.loading && <p className="c4-intaglio-meta">{v4("itgLoading")}</p>}
      {queue.error && <p className="c4-intaglio-meta">{v4("itgFailed")}</p>}
      <p className="c4-intaglio-meta">{v4("itgLead")} {laneLabel(v4, lead)} · {v4("itgToneLead")} {hueLabel(v4, leadHue)} · {v4("itgShare")} {share}</p>
      <div className="c4-intaglio-chart" aria-label={v4("itgChart")}>
        {lines.map((line) => (
          <button key={line.mail} type="button" className="c4-intaglio-column" data-on={mail === line.mail ? "1" : "0"} data-lang={line.mail} onClick={() => setMail(mail === line.mail ? "all" : line.mail)}>
            <i style={{ height: `${Math.max(12, Math.round((line.count / peak) * 72))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.mail)}</span>
          </button>
        ))}
      </div>
      <div className="c4-intaglio-tools">
        <input ref={searchRef} className="c4-field c4-intaglio-search" aria-label={v4("itgSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("itgSearch")} />
        <label className="c4-lab">{v4("itgChart")}<select className="c4-field" aria-label={v4("itgChart")} value={shape} onChange={(event) => setShape(event.target.value as ItgShape)}>{(Object.keys(SHAPE_KEY) as ItgShape[]).map((item) => <option key={item} value={item}>{v4(SHAPE_KEY[item])}</option>)}</select></label>
        <button type="button" className="c4-chip" data-on={hue === "gilt" ? "1" : "0"} onClick={() => setHue(hue === "gilt" ? "all" : "gilt")}>{v4("itgGilt")}</button>
        <button type="button" className="c4-chip" data-on={hue === "pearl" ? "1" : "0"} onClick={() => setHue(hue === "pearl" ? "all" : "pearl")}>{v4("itgPearl")}</button>
        <button type="button" className="c4-chip" data-on={hue === "ink" ? "1" : "0"} onClick={() => setHue(hue === "ink" ? "all" : "ink")}>{v4("itgInk")}</button>
        <button type="button" className="c4-chip" data-on={review === "fresh" ? "1" : "0"} onClick={() => setReview(review === "fresh" ? "all" : "fresh")}>{v4("itgFresh")}</button>
        <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} onClick={() => setReview(review === "reviewed" ? "all" : "reviewed")}>{v4("itgReviewed")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((on) => !on)}>{v4("itgShow")}</button>
        {present.map((lane) => (
          <button key={lane} type="button" className="c4-chip" data-on={hidden.includes(lane) ? "1" : "0"} onClick={() => storeHidden(toggleItg(hidden, lane))}>{v4("itgHide")} {laneLabel(v4, lane)}</button>
        ))}
      </div>
      <div className="c4-intaglio-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkItgReview(reviewed, picked, true))}>{v4("itgBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkItgReview(reviewed, picked, false))}>{v4("itgBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("intaglio-logins.csv", itgRowsCsv(shown, reviewed))}>{v4("itgRowCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("intaglio-lanes.csv", itgLanesCsv(rows))}>{v4("itgCsv")}</button>
      </div>
      {!shown.length && !queue.loading && <p className="c4-pay-empty">{v4("itgEmpty")}</p>}
      <ul className="c4-intaglio-list">
        {shown.map((row) => {
          const tone = itgHue(row.code);
          const name = itgCopy(row.code);
          return (
            <li key={row.id} className="c4-intaglio-card" data-mail={itgLane(row.code) || "open"} data-hue={tone || "none"} data-home={itgLane(row.code) === "mark" ? "1" : "0"} data-away={itgShut(row.code) ? "1" : "0"} data-hold={itgLater(row.code) ? "1" : "0"} data-guest={itgReturn(row.code) ? "1" : "0"} data-open={itgOpen(row.code) ? "1" : "0"} data-even={itgEven(row.code) ? "1" : "0"} data-digit={itgDigit(row.code) ? "1" : "0"} data-letter={itgLetter(row.code) ? "1" : "0"} data-mixed={itgMixed(row.code) ? "1" : "0"} data-upper={itgUpper(row.code) ? "1" : "0"} data-lower={itgLower(row.code) ? "1" : "0"} data-space={itgSpace(row.code) ? "1" : "0"} data-vowel={itgVowel(row.code) ? "1" : "0"} data-tail={itgTail(row.code) ? "1" : "0"} data-first={itgFirst(row.code) ? "1" : "0"} data-held={itgHeld(row.code) ? "1" : "0"} data-join={itgPair(row.code) ? "1" : "0"} data-route={itgScope(row.code) ? "1" : "0"} data-brief={itgBrief(row.code) ? "1" : "0"} data-span={itgSpanLane(row.code) ? "1" : "0"} data-bare={itgBare(row.code) ? "1" : "0"} data-line={itgLine(row.code) ? "1" : "0"} data-desk={itgDesk(row.code) ? "1" : "0"}>
              <label className="c4-intaglio-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-intaglio-meta">{name || v4("itgOpen")} · {itgStamp(row.code) || "—"} · {itgFamily(row.code) || "—"} · {itgLength(row.code) ?? "—"} · {laneLabel(v4, itgLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-intaglio-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleItgReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("itgReviewed") : v4("itgReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { navigator.clipboard?.writeText(itgCopy(row.code)); setCopied(row.id); }}>{copied === row.id ? v4("itgCopied") : v4("itgCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.userId || row.id}`)}>{v4("itgCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
