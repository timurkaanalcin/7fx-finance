"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  GUT_HIDE_KEY,
  GUT_REVIEW_KEY,
  MDL_DENSITY_KEY,
  MDL_KEY,
  MDL_PROFILES,
  MDL_VIEW_KEY,
  addModillion,
  addModillionTag,
  addModillionView,
  bedFocused,
  briskModillion,
  bulkGuttaReview,
  bulkModillionLinen,
  bulkModillionShelf,
  bulkModillionRaise,
  bulkModillionTag,
  busiestHand,
  dropModillionView,
  editModillion,
  editModillionNote,
  fairHand,
  guttaBlank,
  guttaCopy,
  guttaDigit,
  guttaEven,
  guttaFar,
  guttaHue,
  guttaLane,
  guttaLanes,
  guttaLanesCsv,
  guttaLength,
  guttaLetter,
  guttaDark,
  guttaDim,
  guttaFade,
  guttaLit,
  guttaOpen,
  guttaRowsCsv,
  guttaShare,
  guttaStamp,
  guttaNear,
  guttaUpper,
  idleModillion,
  laneGuttaCount,
  lateModillion,
  leadingGutta,
  leadingGuttaHue,
  graphiteQuiet,
  lowerDepthFocused,
  lowerHourFocused,
  moveModillionFocus,
  modillionBars,
  modillionCopy,
  modillionCounts,
  modillionCsv,
  modillionDensity,
  modillionHands,
  modillionTimeline,
  overdueModillion,
  pinModillionFocused,
  presentGuttaLanes,
  profileCool,
  profileWarm,
  rackModillionFocused,
  raiseDepthFocused,
  raiseHourFocused,
  readHiddenGutta,
  readReviewedGutta,
  readModillionViews,
  readModillionList,
  reminderModillionList,
  restingModillion,
  setModillionFocused,
  setModillionBed,
  setModillionPin,
  setModillionRack,
  setModillionRaised,
  setModillionShelf,
  sortModillionList,
  suggestProfile,
  suggestModillionBed,
  suggestModillionHour,
  toggleGutta,
  toggleGuttaReview,
  visibleGutta,
  visibleGuttaLanes,
  visibleModillionList,
  type GuttaReview,
  type GuttaRow,
  type GuttaShape,
  type GuttaValue,
  type Modillion,
  type ModillionDensity,
  type ModillionRack,
  type ModillionSort,
  type ModillionView,
} from "@/lib/crmv4/round392";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const BEDS = ["IVORY", "GRAPHITE", "CHAMPAGNE"] as const;
const HOURS = ["2", "6", "10", "14"] as const;
const DEPTHS = ["2", "4", "8"] as const;

const PROFILE_KEY: Record<string, CrmV4CopyKey> = {
  modillion: "mdlModillion",
  console: "mdlConsole",
  ancone: "mdlAncone",
  corbel: "mdlCorbel",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "mdlAuditSave",
  edit: "mdlAuditEdit",
  note: "mdlAuditNote",
  bed: "mdlAuditBed",
  raise: "mdlAuditRaise",
  free: "mdlAuditFree",
  press: "mdlAuditPress",
  return: "mdlAuditReturn",
  shelf: "mdlAuditShelf",
  open: "mdlAuditOpen",
  tag: "mdlAuditTag",
  depth: "mdlAuditDepth",
  hour: "mdlAuditHour",
  lower: "mdlAuditLower",
  pin: "mdlAuditPin",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  due: "gutLaneDue",
  soon: "gutLaneSoon",
  far: "gutLaneFar",
  late: "gutLaneLate",
  missed: "gutLaneMissed",
  hold: "gutLaneHold",
  blank: "gutLaneBlank",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  gilt: "gutGilt",
  pearl: "gutPearl",
  ash: "gutAsh",
};

const SHAPE_KEY: Record<GuttaShape, CrmV4CopyKey> = {
  all: "gutShapeAll",
  due: "gutShapeDue",
  soon: "gutShapeSoon",
  far: "gutShapeFar",
  late: "gutShapeLate",
  missed: "gutShapeMissed",
  hold: "gutShapeHold",
  blank: "gutShapeBlank",
  open: "gutShapeOpen",
  digit: "gutShapeDigit",
  letter: "gutShapeLetter",
  even: "gutShapeEven",
  upper: "gutShapeUpper",
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

function profileLabel(v4: V4, profile: string): string {
  const key = PROFILE_KEY[profile];
  return key ? v4(key) : v4("mdlBlankProfile");
}

function bedLabel(v4: V4, bed: string): string {
  if (bed === "IVORY") return v4("mdlLinen");
  if (bed === "GRAPHITE") return v4("mdlSlate");
  if (bed === "CHAMPAGNE") return v4("mdlGilt");
  return v4("mdlAll");
}

function laneLabel(v4: V4, mail: string): string {
  const key = LANE_KEY[mail];
  return key ? v4(key) : v4("gutBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("gutBlank");
}

export function ModillionBrackets({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Modillion[]>([]);
  const [views, setViews] = useState<ModillionView[]>([]);
  const [density, setDensity] = useState<ModillionDensity>("open");
  const [rack, setRack] = useState<ModillionRack>("yard");
  const [query, setQuery] = useState("");
  const [handFilter, setHandFilter] = useState("");
  const [bedFilter, setBedFilter] = useState("all");
  const [profileFilter, setProfileFilter] = useState("all");
  const [hourFilter, setHourFilter] = useState("all");
  const [depthFilter, setDepthFilter] = useState("all");
  const [sort, setSort] = useState<ModillionSort>("profile");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [hand, setHand] = useState("");
  const [profile, setProfile] = useState("");
  const [bed, setBed] = useState("");
  const [hourNo, setHourNo] = useState("");
  const [depthNo, setDepthNo] = useState("");
  const [tags, setTags] = useState("");
  const [viewName, setViewName] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [focusAt, setFocusAt] = useState(0);
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [noteId, setNoteId] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [station, setStation] = useState("modillion");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readModillionList(readJson(MDL_KEY, [])));
    setViews(readModillionViews(readJson(MDL_VIEW_KEY, [])));
    setDensity(modillionDensity(readJson(MDL_DENSITY_KEY, "open")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Modillion[]) {
    setCards(next);
    writeJson(MDL_KEY, next);
  }
  function storeViews(next: ModillionView[]) {
    setViews(next);
    writeJson(MDL_VIEW_KEY, next);
  }
  function storeDensity(next: ModillionDensity) {
    setDensity(next);
    writeJson(MDL_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortModillionList(visibleModillionList(cards, rack, query, handFilter, bedFilter, profileFilter, hourFilter, depthFilter), sort),
    [cards, rack, query, handFilter, bedFilter, profileFilter, hourFilter, depthFilter, sort],
  );
  const counts = modillionCounts(cards, shown, station);
  const bars = modillionBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = modillionTimeline(cards);
  const reminders = reminderModillionList(cards);
  const hands = modillionHands(cards);
  const busy = busiestHand(cards);
  const fair = fairHand(cards, hands.join(","));
  const suggestedBed = suggestModillionBed(cards);
  const suggestedHour = suggestModillionHour(cards, clock);
  const suggestedProfile = suggestProfile(clock);
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
        download("modillion.csv", modillionCsv(shown, station));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((card) => card.id));
        return;
      }
      if (event.key === "j" || event.key === "J") setFocusAt((index) => moveModillionFocus(index, shown.length, 1));
      if (event.key === "k" || event.key === "K") setFocusAt((index) => moveModillionFocus(index, shown.length, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, shown, station]);

  function saveCard() {
    if (viewer) return;
    store(addModillion(cards, { title, note, hand, profile, hour: hourNo, bed, depth: depthNo, tags }));
    setTitle("");
    setNote("");
    setTags("");
  }

  return (
    <section className="c4-modillion" aria-label={v4("mdlTitle")} data-modillion="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-modillion-mast">
        <p className="c4-modillion-seal" data-logo="mono">{v4("mdlLogo")}</p>
        <div>
          <p className="c4-modillion-kicker">{v4("mdlSub")}</p>
          <h2 className="c4-title">{v4("mdlTitle")}</h2>
        </div>
        <p className="c4-modillion-count">{shown.length}</p>
      </header>
      <p className="c4-modillion-links">
        <Link href={crmv4Href(base, "gut")}>{v4("gutTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("mdlCustomers")}</Link>
      </p>
      <p className="c4-modillion-hint">{v4("mdlHint")}</p>
      {viewer && <p className="c4-modillion-note">{v4("mdlViewer")}</p>}
      <p className="c4-modillion-meta">{v4("mdlFair")} {fair || "—"} · {v4("mdlBusy")} {busy || "—"} · {v4("mdlSuggest")} {profileLabel(v4, suggestedProfile)} · {bedLabel(v4, suggestedBed)} · {suggestedHour}</p>
      <ol className="c4-modillion-index" aria-label={v4("mdlRemind")}>
        <li data-tone="gold">{v4("mdlOverdue")} {counts.overdue}</li>
        <li data-tone="pitch">{v4("mdlIdle")} {counts.idle}</li>
        <li data-tone="mist">{v4("mdlBrisk")} {counts.brisk}</li>
        <li data-tone="mist">{v4("mdlResting")} {counts.resting}</li>
      </ol>
      {reminders.length > 0 && (
        <ul className="c4-modillion-remind c4-modillion-notices" role="status" aria-label={v4("mdlRemind")}>
          {reminders.map((name) => <li key={name}>{v4("mdlOverdue")} {name}</li>)}
        </ul>
      )}
      <div className="c4-modillion-chart" aria-label={v4("mdlChart")}>
        {bars.map((bar) => (
          <button key={bar.profile} type="button" className="c4-modillion-column" data-on={profileFilter === bar.profile ? "1" : "0"} onClick={() => setProfileFilter(profileFilter === bar.profile ? "all" : bar.profile)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / peak) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{profileLabel(v4, bar.profile)}</span>
          </button>
        ))}
      </div>
      <form className="c4-modillion-form" onSubmit={(event) => { event.preventDefault(); saveCard(); }}>
        <label className="c4-lab">{v4("mdlEdit")}<input ref={titleRef} className="c4-field" aria-label={v4("mdlEdit")} value={title} maxLength={48} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("mdlNote")}<input className="c4-field" aria-label={v4("mdlNote")} aria-required={false} value={note} maxLength={80} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("mdlHand")}<input className="c4-field" aria-label={v4("mdlHand")} aria-required={false} value={hand} maxLength={24} disabled={viewer} onChange={(event) => setHand(event.target.value)} /></label>
        <label className="c4-lab">{v4("mdlProfile")}<select className="c4-field" aria-label={v4("mdlProfile")} value={profile} disabled={viewer} onChange={(event) => setProfile(event.target.value)}><option value="">{v4("mdlBlankProfile")}</option>{MDL_PROFILES.map((item) => <option key={item} value={item}>{profileLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("mdlBed")}<select className="c4-field" aria-label={v4("mdlBed")} value={bed} disabled={viewer} onChange={(event) => setBed(event.target.value)}><option value="">{v4("mdlAll")}</option>{BEDS.map((item) => <option key={item} value={item}>{bedLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("mdlHour")}<select className="c4-field" aria-label={v4("mdlHour")} value={hourNo} disabled={viewer} onChange={(event) => setHourNo(event.target.value)}><option value="">{v4("mdlAll")}</option>{HOURS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("mdlDepth")}<select className="c4-field" aria-label={v4("mdlDepth")} value={depthNo} disabled={viewer} onChange={(event) => setDepthNo(event.target.value)}><option value="">{v4("mdlAll")}</option>{DEPTHS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("mdlTag")}<input className="c4-field" aria-label={v4("mdlTag")} aria-required={false} value={tags} maxLength={8} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("mdlAdd")}</button>
      </form>
      <div className="c4-modillion-tools">
        <input ref={searchRef} className="c4-field c4-modillion-search" aria-label={v4("mdlSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("mdlSearch")} />
        {(["yard", "press", "shelf"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={rack === item ? "1" : "0"} onClick={() => setRack(item)}>{v4(item === "yard" ? "mdlYard" : item === "press" ? "mdlPress" : "mdlShelf")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={profileFilter === "warm" ? "1" : "0"} onClick={() => setProfileFilter(profileFilter === "warm" ? "all" : "warm")}>{v4("mdlWarm")}</button>
        <button type="button" className="c4-chip" data-on={profileFilter === "cool" ? "1" : "0"} onClick={() => setProfileFilter(profileFilter === "cool" ? "all" : "cool")}>{v4("mdlCool")}</button>
        {BEDS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={bedFilter === item ? "1" : "0"} onClick={() => setBedFilter(bedFilter === item ? "all" : item)}>{bedLabel(v4, item)}</button>
        ))}
        {HOURS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={hourFilter === item ? "1" : "0"} onClick={() => setHourFilter(hourFilter === item ? "all" : item)}>{item}</button>
        ))}
        {DEPTHS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={depthFilter === item ? "1" : "0"} onClick={() => setDepthFilter(depthFilter === item ? "all" : item)}>{item}</button>
        ))}
        {hands.map((name) => (
          <button key={name} type="button" className="c4-chip" data-on={handFilter === name ? "1" : "0"} onClick={() => setHandFilter(handFilter === name ? "" : name)}>{name}</button>
        ))}
        <button type="button" className="c4-chip" data-on={sort === "hand" ? "1" : "0"} onClick={() => setSort(sort === "hand" ? "profile" : "hand")}>{sort === "hand" ? v4("mdlSortHand") : v4("mdlSortProfile")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "tight" ? "open" : "tight")}>{density === "tight" ? v4("mdlTight") : v4("mdlOpenDensity")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("mdlTimeline")}</button>
        <label className="c4-lab">{v4("mdlDesk")}<select className="c4-field" aria-label={v4("mdlDesk")} value={station} onChange={(event) => setStation(event.target.value)}>{MDL_PROFILES.map((item) => <option key={item} value={item}>{profileLabel(v4, item)}</option>)}</select></label>
      </div>
      <form className="c4-modillion-view" onSubmit={(event) => {
        event.preventDefault();
        const id = `v${Date.now().toString(36)}`;
        storeViews(addModillionView(views, { id, name: viewName, rack, query, hand: handFilter, bed: bedFilter, profile: profileFilter, hour: hourFilter, depth: depthFilter }));
        setViewName("");
      }}>
        <label className="c4-lab">{v4("mdlViewName")}<input className="c4-field" aria-label={v4("mdlViewName")} aria-required={false} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn">{v4("mdlSaveView")}</button>
      </form>
      <ul className="c4-modillion-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setRack(view.rack); setQuery(view.query); setHandFilter(view.hand); setBedFilter(view.bed); setProfileFilter(view.profile); setHourFilter(view.hour); setDepthFilter(view.depth); }}>{v4("mdlApply")} {view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropModillionView(views, view.id))}>{v4("mdlDropView")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-modillion-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkModillionRaise(cards, picked))}>{v4("mdlBulkRaise")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkModillionShelf(cards, picked))}>{v4("mdlBulkArchive")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkModillionLinen(cards, picked))}>{v4("mdlBulkLinen")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkModillionTag(cards, picked))}>{v4("mdlBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("modillion.csv", modillionCsv(shown, station))}>{v4("mdlCsv")}</button>
        <p className="c4-modillion-meta">{v4("mdlKeys")} / c x a j k · {v4("mdlQuiet")} {counts.quiet} · {v4("mdlWarm")} {counts.warm}</p>
      </div>
      {board === "timeline" && (
        <ol className="c4-modillion-time" aria-label={v4("mdlTimeline")}>
          {timeline.map((row) => <li key={row.hour}><span>{row.hour}</span> {row.titles.join(", ")}</li>)}
        </ol>
      )}
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("mdlEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-modillion-list">
          {shown.map((card) => {
            const late = lateModillion(card, station);
            return (
              <li key={card.id} className="c4-modillion-card" data-on={focused?.id === card.id ? "1" : "0"} data-late={late ? "1" : "0"} data-idle={idleModillion(card) ? "1" : "0"} data-brisk={briskModillion(card) ? "1" : "0"} data-overdue={overdueModillion(card) ? "1" : "0"} data-resting={restingModillion(card) ? "1" : "0"} data-warm={profileWarm(card.profile) ? "1" : "0"} data-cool={profileCool(card.profile) ? "1" : "0"} data-quiet={graphiteQuiet(card.bed) ? "1" : "0"}>
                <label className="c4-modillion-pick">
                  <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                </label>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editModillion(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("mdlEdit")} value={draft} maxLength={48} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("mdlApply")}</button>
                    </form>
                  ) : <p>{card.title}</p>}
                  <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editModillionNote(cards, card.id, noteId === card.id ? noteDraft : card.note)); }}>
                    <input className="c4-field" aria-label={v4("mdlNote")} aria-required={false} value={noteId === card.id ? noteDraft : card.note} maxLength={80} disabled={viewer} onChange={(event) => { setNoteId(card.id); setNoteDraft(event.target.value); }} onFocus={() => { setNoteId(card.id); setNoteDraft(card.note); }} />
                  </form>
                  <p className="c4-modillion-meta">{profileLabel(v4, card.profile)} · {bedLabel(v4, card.bed)} · {card.hour ?? "—"} · {card.depth} · {card.hand || "—"} · {card.tags.join(" ") || "—"}{card.audit ? ` · ${v4(AUDIT_KEY[card.audit] || "mdlAuditSave")}` : ""}{late ? ` · ${v4("mdlOverdue")}` : ""}</p>
                </div>
                <div className="c4-modillion-actions">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("mdlEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setModillionRaised(cards, card.id, !card.raised))}>{card.raised ? v4("mdlFree") : v4("mdlRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setModillionBed(cards, card.id, suggestedBed))}>{v4("mdlSuggest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setModillionRack(cards, card.id, !card.pressed))}>{card.pressed ? v4("mdlUnpress") : v4("mdlPressIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setModillionShelf(cards, card.id, !card.shelved))}>{card.shelved ? v4("mdlUnshelf") : v4("mdlShelfIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setModillionPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("mdlUnpin") : v4("mdlPin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addModillionTag(cards, card.id, "m"))}>{v4("mdlTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHourFocused(cards, card.id))}>{v4("mdlRaiseHour")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHourFocused(cards, card.id))}>{v4("mdlLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseDepthFocused(cards, card.id))}>{v4("mdlDepth")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerDepthFocused(cards, card.id))}>{v4("mdlDepth")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bedFocused(cards, card.id))}>{v4("mdlBed")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setModillionFocused(cards, card.id))}>{v4("mdlRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(rackModillionFocused(cards, card.id))}>{v4("mdlPress")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(pinModillionFocused(cards, card.id))}>{v4("mdlPin")}</button>
                  <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(modillionCopy(card))}>{v4("mdlCopy")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

type GroupUser = { id?: string; name?: string | null; firstName?: string | null };

export function GuttaDrops({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: GroupUser[] }>("/api/admin/users?take=24&meta=0");
  const [mail, setMail] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<GuttaShape>("all");
  const [review, setReview] = useState<GuttaReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): GuttaRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      userId: id,
      code: { firstName: textField(row.firstName) } satisfies GuttaValue,
    };
  }).filter((row): row is GuttaRow => Boolean(row));
  const present = presentGuttaLanes(rows);
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
    const next = readHiddenGutta(readJson(GUT_HIDE_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(GUT_HIDE_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedGutta(readJson(GUT_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(GUT_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleGuttaLanes(present, hidden, showHidden);
  const shown = visibleGutta(rows, lanes.includes(mail) || mail === "all" ? mail : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = guttaLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = guttaLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingGutta(rows);
  const leadHue = leadingGuttaHue(rows);
  const whole = rows.filter((row) => guttaLane(row.code)).length;
  const share = guttaShare(laneGuttaCount(rows, "due"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("gutta-lanes.csv", guttaLanesCsv(rows));
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
    writeJson(GUT_HIDE_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(GUT_REVIEW_KEY, next);
  }

  return (
    <section className="c4-gutta" aria-label={v4("gutTitle")} data-gutta="1" data-role={role} data-given="1">
      <header className="c4-gutta-mast">
        <p className="c4-gutta-seal" data-logo="mono">{v4("gutLogo")}</p>
        <div>
          <p className="c4-gutta-kicker">{v4("gutSub")}</p>
          <h2 className="c4-title">{v4("gutTitle")}</h2>
        </div>
        <p className="c4-gutta-count">{shown.length}</p>
      </header>
      <p className="c4-gutta-links">
        <Link href={crmv4Href(base, "mdl")}>{v4("mdlTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("gutCustomer")}</Link>
      </p>
      <p className="c4-gutta-hint">{v4("gutHint")}</p>
      {viewer && <p className="c4-gutta-note">{v4("gutViewer")}</p>}
      {queue.loading && <p className="c4-gutta-meta">{v4("gutLoading")}</p>}
      {queue.error && <p className="c4-gutta-meta">{v4("gutFailed")}</p>}
      <p className="c4-gutta-meta">{v4("gutLead")} {laneLabel(v4, lead)} · {v4("gutToneLead")} {hueLabel(v4, leadHue)} · {v4("gutShare")} {share}</p>
      <div className="c4-gutta-chart" aria-label={v4("gutChart")}>
        {lines.map((line) => (
          <button key={line.mail} type="button" className="c4-gutta-column" data-on={mail === line.mail ? "1" : "0"} data-lang={line.mail} onClick={() => setMail(mail === line.mail ? "all" : line.mail)}>
            <i style={{ height: `${Math.max(12, Math.round((line.count / peak) * 72))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.mail)}</span>
          </button>
        ))}
      </div>
      <div className="c4-gutta-tools">
        <input ref={searchRef} className="c4-field c4-gutta-search" aria-label={v4("gutSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("gutSearch")} />
        <label className="c4-lab">{v4("gutChart")}<select className="c4-field" aria-label={v4("gutChart")} value={shape} onChange={(event) => setShape(event.target.value as GuttaShape)}>{(Object.keys(SHAPE_KEY) as GuttaShape[]).map((item) => <option key={item} value={item}>{v4(SHAPE_KEY[item])}</option>)}</select></label>
        <button type="button" className="c4-chip" data-on={hue === "gilt" ? "1" : "0"} onClick={() => setHue(hue === "gilt" ? "all" : "gilt")}>{v4("gutGilt")}</button>
        <button type="button" className="c4-chip" data-on={hue === "pearl" ? "1" : "0"} onClick={() => setHue(hue === "pearl" ? "all" : "pearl")}>{v4("gutPearl")}</button>
        <button type="button" className="c4-chip" data-on={hue === "ash" ? "1" : "0"} onClick={() => setHue(hue === "ash" ? "all" : "ash")}>{v4("gutAsh")}</button>
        <button type="button" className="c4-chip" data-on={review === "fresh" ? "1" : "0"} onClick={() => setReview(review === "fresh" ? "all" : "fresh")}>{v4("gutFresh")}</button>
        <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} onClick={() => setReview(review === "reviewed" ? "all" : "reviewed")}>{v4("gutReviewed")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((on) => !on)}>{v4("gutShow")}</button>
        {present.map((lane) => (
          <button key={lane} type="button" className="c4-chip" data-on={hidden.includes(lane) ? "1" : "0"} onClick={() => storeHidden(toggleGutta(hidden, lane))}>{v4("gutHide")} {laneLabel(v4, lane)}</button>
        ))}
      </div>
      <div className="c4-gutta-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkGuttaReview(reviewed, picked, true))}>{v4("gutBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkGuttaReview(reviewed, picked, false))}>{v4("gutBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("gutta-firstnames.csv", guttaRowsCsv(shown, reviewed))}>{v4("gutRowCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("gutta-lanes.csv", guttaLanesCsv(rows))}>{v4("gutCsv")}</button>
      </div>
      {!shown.length && !queue.loading && <p className="c4-pay-empty">{v4("gutEmpty")}</p>}
      <ul className="c4-gutta-list">
        {shown.map((row) => {
          const tone = guttaHue(row.code);
          const name = guttaCopy(row.code);
          return (
            <li key={row.id} className="c4-gutta-card" data-mail={guttaLane(row.code) || "open"} data-hue={tone || "none"} data-lit={guttaLit(row.code) ? "1" : "0"} data-near={guttaNear(row.code) ? "1" : "0"} data-far={guttaFar(row.code) ? "1" : "0"} data-fade={guttaFade(row.code) ? "1" : "0"} data-dark={guttaDark(row.code) ? "1" : "0"} data-dim={guttaDim(row.code) ? "1" : "0"} data-blank={guttaBlank(row.code) ? "1" : "0"} data-open={guttaOpen(row.code) ? "1" : "0"} data-even={guttaEven(row.code) ? "1" : "0"} data-digit={guttaDigit(row.code) ? "1" : "0"} data-letter={guttaLetter(row.code) ? "1" : "0"} data-upper={guttaUpper(row.code) ? "1" : "0"}>
              <label className="c4-gutta-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-gutta-meta">{name || v4("gutOpen")} · {guttaStamp(row.code) || "—"} · {guttaLength(row.code) ?? "—"} · {laneLabel(v4, guttaLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-gutta-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleGuttaReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("gutReviewed") : v4("gutReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { navigator.clipboard?.writeText(guttaCopy(row.code)); setCopied(row.id); }}>{copied === row.id ? v4("gutCopied") : v4("gutCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.userId || row.id}`)}>{v4("gutCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
