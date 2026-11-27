"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  RGL_HIDE_KEY,
  RGL_REVIEW_KEY,
  TRG_DENSITY_KEY,
  TRG_KEY,
  TRG_PROFILES,
  TRG_VIEW_KEY,
  addTriglyph,
  addTriglyphTag,
  addTriglyphView,
  bedFocused,
  briskTriglyph,
  bulkRegulaReview,
  bulkTriglyphLinen,
  bulkTriglyphShelf,
  bulkTriglyphRaise,
  bulkTriglyphTag,
  busiestHand,
  dropTriglyphView,
  editTriglyph,
  editTriglyphNote,
  fairHand,
  regulaBlank,
  regulaCopy,
  regulaDigit,
  regulaEven,
  regulaFar,
  regulaHue,
  regulaLane,
  regulaLanes,
  regulaLanesCsv,
  regulaLength,
  regulaLetter,
  regulaDark,
  regulaDim,
  regulaFade,
  regulaLit,
  regulaOpen,
  regulaRowsCsv,
  regulaShare,
  regulaStamp,
  regulaNear,
  regulaUpper,
  idleTriglyph,
  laneRegulaCount,
  lateTriglyph,
  leadingRegula,
  leadingRegulaHue,
  champagneQuiet,
  lowerDepthFocused,
  lowerHourFocused,
  moveTriglyphFocus,
  triglyphBars,
  triglyphCopy,
  triglyphCounts,
  triglyphCsv,
  triglyphDensity,
  triglyphHands,
  triglyphTimeline,
  overdueTriglyph,
  pinTriglyphFocused,
  presentRegulaLanes,
  profileCool,
  profileWarm,
  rackTriglyphFocused,
  raiseDepthFocused,
  raiseHourFocused,
  readHiddenRegula,
  readReviewedRegula,
  readTriglyphViews,
  readTriglyphList,
  reminderTriglyphList,
  restingTriglyph,
  setTriglyphFocused,
  setTriglyphBed,
  setTriglyphPin,
  setTriglyphRack,
  setTriglyphRaised,
  setTriglyphShelf,
  sortTriglyphList,
  suggestProfile,
  suggestTriglyphBed,
  suggestTriglyphHour,
  toggleRegula,
  toggleRegulaReview,
  visibleRegula,
  visibleRegulaLanes,
  visibleTriglyphList,
  type RegulaReview,
  type RegulaRow,
  type RegulaShape,
  type RegulaValue,
  type Triglyph,
  type TriglyphDensity,
  type TriglyphRack,
  type TriglyphSort,
  type TriglyphView,
} from "@/lib/crmv4/round396";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const BEDS = ["IVORY", "GRAPHITE", "CHAMPAGNE"] as const;
const HOURS = ["2", "5", "9", "13"] as const;
const DEPTHS = ["2", "5", "8"] as const;

const PROFILE_KEY: Record<string, CrmV4CopyKey> = {
  triglyph: "tglTriglyph",
  channel: "tglChannel",
  flute: "tglFlute",
  drip: "tglDrip",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "tglAuditSave",
  edit: "tglAuditEdit",
  note: "tglAuditNote",
  bed: "tglAuditBed",
  raise: "tglAuditRaise",
  free: "tglAuditFree",
  press: "tglAuditPress",
  return: "tglAuditReturn",
  shelf: "tglAuditShelf",
  open: "tglAuditOpen",
  tag: "tglAuditTag",
  depth: "tglAuditDepth",
  hour: "tglAuditHour",
  lower: "tglAuditLower",
  pin: "tglAuditPin",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  link: "rglLaneLink",
  figure: "rglLaneFigure",
  short: "rglLaneShort",
  long: "rglLaneLong",
  hold: "rglLaneHold",
  shut: "rglLaneShut",
  blank: "rglLaneBlank",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  gilt: "rglGilt",
  pearl: "rglPearl",
  ash: "rglAsh",
};

const SHAPE_KEY: Record<RegulaShape, CrmV4CopyKey> = {
  all: "rglShapeAll",
  link: "rglShapeLink",
  figure: "rglShapeFigure",
  short: "rglShapeShort",
  long: "rglShapeLong",
  hold: "rglShapeHold",
  shut: "rglShapeShut",
  blank: "rglShapeBlank",
  open: "rglShapeOpen",
  digit: "rglShapeDigit",
  letter: "rglShapeLetter",
  even: "rglShapeEven",
  upper: "rglShapeUpper",
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
  return key ? v4(key) : v4("tglBlankProfile");
}

function bedLabel(v4: V4, bed: string): string {
  if (bed === "IVORY") return v4("tglLinen");
  if (bed === "GRAPHITE") return v4("tglSlate");
  if (bed === "CHAMPAGNE") return v4("tglGilt");
  return v4("tglAll");
}

function laneLabel(v4: V4, mail: string): string {
  const key = LANE_KEY[mail];
  return key ? v4(key) : v4("rglBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("rglBlank");
}

export function TriglyphCourses({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Triglyph[]>([]);
  const [views, setViews] = useState<TriglyphView[]>([]);
  const [density, setDensity] = useState<TriglyphDensity>("open");
  const [rack, setRack] = useState<TriglyphRack>("yard");
  const [query, setQuery] = useState("");
  const [handFilter, setHandFilter] = useState("");
  const [bedFilter, setBedFilter] = useState("all");
  const [profileFilter, setProfileFilter] = useState("all");
  const [hourFilter, setHourFilter] = useState("all");
  const [depthFilter, setDepthFilter] = useState("all");
  const [sort, setSort] = useState<TriglyphSort>("profile");
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
  const [station, setStation] = useState("triglyph");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readTriglyphList(readJson(TRG_KEY, [])));
    setViews(readTriglyphViews(readJson(TRG_VIEW_KEY, [])));
    setDensity(triglyphDensity(readJson(TRG_DENSITY_KEY, "open")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Triglyph[]) {
    setCards(next);
    writeJson(TRG_KEY, next);
  }
  function storeViews(next: TriglyphView[]) {
    setViews(next);
    writeJson(TRG_VIEW_KEY, next);
  }
  function storeDensity(next: TriglyphDensity) {
    setDensity(next);
    writeJson(TRG_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortTriglyphList(visibleTriglyphList(cards, rack, query, handFilter, bedFilter, profileFilter, hourFilter, depthFilter), sort),
    [cards, rack, query, handFilter, bedFilter, profileFilter, hourFilter, depthFilter, sort],
  );
  const counts = triglyphCounts(cards, shown, station);
  const bars = triglyphBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = triglyphTimeline(cards);
  const reminders = reminderTriglyphList(cards);
  const hands = triglyphHands(cards);
  const busy = busiestHand(cards);
  const fair = fairHand(cards, hands.join(","));
  const suggestedBed = suggestTriglyphBed(cards);
  const suggestedHour = suggestTriglyphHour(cards, clock);
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
        download("triglyph-courses.csv", triglyphCsv(shown, station));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((card) => card.id));
        return;
      }
      if (event.key === "j" || event.key === "J") setFocusAt((index) => moveTriglyphFocus(index, shown.length, 1));
      if (event.key === "k" || event.key === "K") setFocusAt((index) => moveTriglyphFocus(index, shown.length, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, shown, station]);

  function saveCard() {
    if (viewer) return;
    store(addTriglyph(cards, { title, note, hand, profile, hour: hourNo, bed, depth: depthNo, tags }));
    setTitle("");
    setNote("");
    setTags("");
  }

  return (
    <section className="c4-triglyph" aria-label={v4("tglTitle")} data-triglyph="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-triglyph-mast">
        <p className="c4-triglyph-seal" data-logo="mono">{v4("tglLogo")}</p>
        <div>
          <p className="c4-triglyph-kicker">{v4("tglSub")}</p>
          <h2 className="c4-title">{v4("tglTitle")}</h2>
        </div>
        <p className="c4-triglyph-count">{shown.length}</p>
      </header>
      <p className="c4-triglyph-links">
        <Link href={crmv4Href(base, "rgl")}>{v4("rglTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("tglCustomers")}</Link>
      </p>
      <p className="c4-triglyph-hint">{v4("tglHint")}</p>
      {viewer && <p className="c4-triglyph-note">{v4("tglViewer")}</p>}
      <p className="c4-triglyph-meta">{v4("tglFair")} {fair || "—"} · {v4("tglBusy")} {busy || "—"} · {v4("tglSuggest")} {profileLabel(v4, suggestedProfile)} · {bedLabel(v4, suggestedBed)} · {suggestedHour}</p>
      <ol className="c4-triglyph-index" aria-label={v4("tglRemind")}>
        <li data-tone="gold">{v4("tglOverdue")} {counts.overdue}</li>
        <li data-tone="pitch">{v4("tglIdle")} {counts.idle}</li>
        <li data-tone="mist">{v4("tglBrisk")} {counts.brisk}</li>
        <li data-tone="mist">{v4("tglResting")} {counts.resting}</li>
      </ol>
      {reminders.length > 0 && (
        <ul className="c4-triglyph-remind c4-triglyph-notices" role="status" aria-label={v4("tglRemind")}>
          {reminders.map((name) => <li key={name}>{v4("tglOverdue")} {name}</li>)}
        </ul>
      )}
      <div className="c4-triglyph-chart" aria-label={v4("tglChart")}>
        {bars.map((bar) => (
          <button key={bar.profile} type="button" className="c4-triglyph-column" data-on={profileFilter === bar.profile ? "1" : "0"} onClick={() => setProfileFilter(profileFilter === bar.profile ? "all" : bar.profile)}>
            <i style={{ width: `${Math.max(18, Math.round((bar.count / peak) * 100))}%` }} />
            <strong>{bar.count}</strong>
            <span>{profileLabel(v4, bar.profile)}</span>
          </button>
        ))}
      </div>
      <form className="c4-triglyph-form" onSubmit={(event) => { event.preventDefault(); saveCard(); }}>
        <label className="c4-lab">{v4("tglEdit")}<input ref={titleRef} className="c4-field" aria-label={v4("tglEdit")} value={title} maxLength={48} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("tglNote")}<input className="c4-field" aria-label={v4("tglNote")} aria-required={false} value={note} maxLength={80} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("tglHand")}<input className="c4-field" aria-label={v4("tglHand")} aria-required={false} value={hand} maxLength={24} disabled={viewer} onChange={(event) => setHand(event.target.value)} /></label>
        <label className="c4-lab">{v4("tglProfile")}<select className="c4-field" aria-label={v4("tglProfile")} value={profile} disabled={viewer} onChange={(event) => setProfile(event.target.value)}><option value="">{v4("tglBlankProfile")}</option>{TRG_PROFILES.map((item) => <option key={item} value={item}>{profileLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("tglBed")}<select className="c4-field" aria-label={v4("tglBed")} value={bed} disabled={viewer} onChange={(event) => setBed(event.target.value)}><option value="">{v4("tglAll")}</option>{BEDS.map((item) => <option key={item} value={item}>{bedLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("tglHour")}<select className="c4-field" aria-label={v4("tglHour")} value={hourNo} disabled={viewer} onChange={(event) => setHourNo(event.target.value)}><option value="">{v4("tglAll")}</option>{HOURS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("tglDepth")}<select className="c4-field" aria-label={v4("tglDepth")} value={depthNo} disabled={viewer} onChange={(event) => setDepthNo(event.target.value)}><option value="">{v4("tglAll")}</option>{DEPTHS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("tglTag")}<input className="c4-field" aria-label={v4("tglTag")} aria-required={false} value={tags} maxLength={8} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("tglAdd")}</button>
      </form>
      <div className="c4-triglyph-tools">
        <input ref={searchRef} className="c4-field c4-triglyph-search" aria-label={v4("tglSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("tglSearch")} />
        {(["yard", "press", "shelf"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={rack === item ? "1" : "0"} onClick={() => setRack(item)}>{v4(item === "yard" ? "tglYard" : item === "press" ? "tglPress" : "tglShelf")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={profileFilter === "warm" ? "1" : "0"} onClick={() => setProfileFilter(profileFilter === "warm" ? "all" : "warm")}>{v4("tglWarm")}</button>
        <button type="button" className="c4-chip" data-on={profileFilter === "cool" ? "1" : "0"} onClick={() => setProfileFilter(profileFilter === "cool" ? "all" : "cool")}>{v4("tglCool")}</button>
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
        <button type="button" className="c4-chip" data-on={sort === "hand" ? "1" : "0"} onClick={() => setSort(sort === "hand" ? "profile" : "hand")}>{sort === "hand" ? v4("tglSortHand") : v4("tglSortProfile")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "tight" ? "open" : "tight")}>{density === "tight" ? v4("tglTight") : v4("tglOpenDensity")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("tglTimeline")}</button>
        <label className="c4-lab">{v4("tglDesk")}<select className="c4-field" aria-label={v4("tglDesk")} value={station} onChange={(event) => setStation(event.target.value)}>{TRG_PROFILES.map((item) => <option key={item} value={item}>{profileLabel(v4, item)}</option>)}</select></label>
      </div>
      <form className="c4-triglyph-view" onSubmit={(event) => {
        event.preventDefault();
        const id = `v${Date.now().toString(36)}`;
        storeViews(addTriglyphView(views, { id, name: viewName, rack, query, hand: handFilter, bed: bedFilter, profile: profileFilter, hour: hourFilter, depth: depthFilter }));
        setViewName("");
      }}>
        <label className="c4-lab">{v4("tglViewName")}<input className="c4-field" aria-label={v4("tglViewName")} aria-required={false} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn">{v4("tglSaveView")}</button>
      </form>
      <ul className="c4-triglyph-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setRack(view.rack); setQuery(view.query); setHandFilter(view.hand); setBedFilter(view.bed); setProfileFilter(view.profile); setHourFilter(view.hour); setDepthFilter(view.depth); }}>{v4("tglApply")} {view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropTriglyphView(views, view.id))}>{v4("tglDropView")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-triglyph-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkTriglyphRaise(cards, picked))}>{v4("tglBulkRaise")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkTriglyphShelf(cards, picked))}>{v4("tglBulkArchive")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkTriglyphLinen(cards, picked))}>{v4("tglBulkLinen")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkTriglyphTag(cards, picked))}>{v4("tglBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("triglyph-courses.csv", triglyphCsv(shown, station))}>{v4("tglCsv")}</button>
        <p className="c4-triglyph-meta">{v4("tglKeys")} / c x a j k · {v4("tglQuiet")} {counts.quiet} · {v4("tglWarm")} {counts.warm}</p>
      </div>
      {board === "timeline" && (
        <ol className="c4-triglyph-time" aria-label={v4("tglTimeline")}>
          {timeline.map((row) => <li key={row.hour}><span>{row.hour}</span> {row.titles.join(", ")}</li>)}
        </ol>
      )}
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("tglEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-triglyph-list">
          {shown.map((card) => {
            const late = lateTriglyph(card, station);
            return (
              <li key={card.id} className="c4-triglyph-card" data-on={focused?.id === card.id ? "1" : "0"} data-late={late ? "1" : "0"} data-idle={idleTriglyph(card) ? "1" : "0"} data-brisk={briskTriglyph(card) ? "1" : "0"} data-overdue={overdueTriglyph(card) ? "1" : "0"} data-resting={restingTriglyph(card) ? "1" : "0"} data-warm={profileWarm(card.profile) ? "1" : "0"} data-cool={profileCool(card.profile) ? "1" : "0"} data-quiet={champagneQuiet(card.bed) ? "1" : "0"}>
                <label className="c4-triglyph-pick">
                  <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                </label>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editTriglyph(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("tglEdit")} value={draft} maxLength={48} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("tglApply")}</button>
                    </form>
                  ) : <p>{card.title}</p>}
                  <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editTriglyphNote(cards, card.id, noteId === card.id ? noteDraft : card.note)); }}>
                    <input className="c4-field" aria-label={v4("tglNote")} aria-required={false} value={noteId === card.id ? noteDraft : card.note} maxLength={80} disabled={viewer} onChange={(event) => { setNoteId(card.id); setNoteDraft(event.target.value); }} onFocus={() => { setNoteId(card.id); setNoteDraft(card.note); }} />
                  </form>
                  <p className="c4-triglyph-meta">{profileLabel(v4, card.profile)} · {bedLabel(v4, card.bed)} · {card.hour ?? "—"} · {card.depth} · {card.hand || "—"} · {card.tags.join(" ") || "—"}{card.audit ? ` · ${v4(AUDIT_KEY[card.audit] || "tglAuditSave")}` : ""}{late ? ` · ${v4("tglOverdue")}` : ""}</p>
                </div>
                <div className="c4-triglyph-actions">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("tglEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setTriglyphRaised(cards, card.id, !card.raised))}>{card.raised ? v4("tglFree") : v4("tglRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setTriglyphBed(cards, card.id, suggestedBed))}>{v4("tglSuggest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setTriglyphRack(cards, card.id, !card.pressed))}>{card.pressed ? v4("tglUnpress") : v4("tglPressIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setTriglyphShelf(cards, card.id, !card.shelved))}>{card.shelved ? v4("tglUnshelf") : v4("tglShelfIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setTriglyphPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("tglUnpin") : v4("tglPin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addTriglyphTag(cards, card.id, "e"))}>{v4("tglTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHourFocused(cards, card.id))}>{v4("tglRaiseHour")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHourFocused(cards, card.id))}>{v4("tglLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseDepthFocused(cards, card.id))}>{v4("tglDepth")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerDepthFocused(cards, card.id))}>{v4("tglDepth")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bedFocused(cards, card.id))}>{v4("tglBed")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setTriglyphFocused(cards, card.id))}>{v4("tglRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(rackTriglyphFocused(cards, card.id))}>{v4("tglPress")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(pinTriglyphFocused(cards, card.id))}>{v4("tglPin")}</button>
                  <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(triglyphCopy(card))}>{v4("tglCopy")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

type GroupUser = { id?: string; name?: string | null; timezone?: string | null };

export function RegulaPanels({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: GroupUser[] }>("/api/admin/users?take=24&meta=0");
  const [mail, setMail] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<RegulaShape>("all");
  const [review, setReview] = useState<RegulaReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): RegulaRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      userId: id,
      code: { timezone: textField(row.timezone) } satisfies RegulaValue,
    };
  }).filter((row): row is RegulaRow => Boolean(row));
  const present = presentRegulaLanes(rows);
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
    const next = readHiddenRegula(readJson(RGL_HIDE_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(RGL_HIDE_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedRegula(readJson(RGL_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(RGL_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleRegulaLanes(present, hidden, showHidden);
  const shown = visibleRegula(rows, lanes.includes(mail) || mail === "all" ? mail : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = regulaLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = regulaLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingRegula(rows);
  const leadHue = leadingRegulaHue(rows);
  const whole = rows.filter((row) => regulaLane(row.code)).length;
  const share = regulaShare(laneRegulaCount(rows, "link"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("regula-timezone-lanes.csv", regulaLanesCsv(rows));
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
    writeJson(RGL_HIDE_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(RGL_REVIEW_KEY, next);
  }

  return (
    <section className="c4-regula" aria-label={v4("rglTitle")} data-regula="1" data-role={role} data-timezone="1">
      <header className="c4-regula-mast">
        <p className="c4-regula-seal" data-logo="mono">{v4("rglLogo")}</p>
        <div>
          <p className="c4-regula-kicker">{v4("rglSub")}</p>
          <h2 className="c4-title">{v4("rglTitle")}</h2>
        </div>
        <p className="c4-regula-count">{shown.length}</p>
      </header>
      <p className="c4-regula-links">
        <Link href={crmv4Href(base, "tgl")}>{v4("tglTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("rglCustomer")}</Link>
      </p>
      <p className="c4-regula-hint">{v4("rglHint")}</p>
      {viewer && <p className="c4-regula-note">{v4("rglViewer")}</p>}
      {queue.loading && <p className="c4-regula-meta">{v4("rglLoading")}</p>}
      {queue.error && <p className="c4-regula-meta">{v4("rglFailed")}</p>}
      <p className="c4-regula-meta">{v4("rglLead")} {laneLabel(v4, lead)} · {v4("rglToneLead")} {hueLabel(v4, leadHue)} · {v4("rglShare")} {share}</p>
      <div className="c4-regula-chart" aria-label={v4("rglChart")}>
        {lines.map((line) => (
          <button key={line.mail} type="button" className="c4-regula-column" data-on={mail === line.mail ? "1" : "0"} data-lang={line.mail} onClick={() => setMail(mail === line.mail ? "all" : line.mail)}>
            <i style={{ height: `${Math.max(12, Math.round((line.count / peak) * 72))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.mail)}</span>
          </button>
        ))}
      </div>
      <div className="c4-regula-tools">
        <input ref={searchRef} className="c4-field c4-regula-search" aria-label={v4("rglSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("rglSearch")} />
        <label className="c4-lab">{v4("rglChart")}<select className="c4-field" aria-label={v4("rglChart")} value={shape} onChange={(event) => setShape(event.target.value as RegulaShape)}>{(Object.keys(SHAPE_KEY) as RegulaShape[]).map((item) => <option key={item} value={item}>{v4(SHAPE_KEY[item])}</option>)}</select></label>
        <button type="button" className="c4-chip" data-on={hue === "gilt" ? "1" : "0"} onClick={() => setHue(hue === "gilt" ? "all" : "gilt")}>{v4("rglGilt")}</button>
        <button type="button" className="c4-chip" data-on={hue === "pearl" ? "1" : "0"} onClick={() => setHue(hue === "pearl" ? "all" : "pearl")}>{v4("rglPearl")}</button>
        <button type="button" className="c4-chip" data-on={hue === "ash" ? "1" : "0"} onClick={() => setHue(hue === "ash" ? "all" : "ash")}>{v4("rglAsh")}</button>
        <button type="button" className="c4-chip" data-on={review === "fresh" ? "1" : "0"} onClick={() => setReview(review === "fresh" ? "all" : "fresh")}>{v4("rglFresh")}</button>
        <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} onClick={() => setReview(review === "reviewed" ? "all" : "reviewed")}>{v4("rglReviewed")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((on) => !on)}>{v4("rglShow")}</button>
        {present.map((lane) => (
          <button key={lane} type="button" className="c4-chip" data-on={hidden.includes(lane) ? "1" : "0"} onClick={() => storeHidden(toggleRegula(hidden, lane))}>{v4("rglHide")} {laneLabel(v4, lane)}</button>
        ))}
      </div>
      <div className="c4-regula-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkRegulaReview(reviewed, picked, true))}>{v4("rglBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkRegulaReview(reviewed, picked, false))}>{v4("rglBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("regula-timezone.csv", regulaRowsCsv(shown, reviewed))}>{v4("rglRowCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("regula-timezone-lanes.csv", regulaLanesCsv(rows))}>{v4("rglCsv")}</button>
      </div>
      {!shown.length && !queue.loading && <p className="c4-pay-empty">{v4("rglEmpty")}</p>}
      <ul className="c4-regula-list">
        {shown.map((row) => {
          const tone = regulaHue(row.code);
          const name = regulaCopy(row.code);
          return (
            <li key={row.id} className="c4-regula-card" data-mail={regulaLane(row.code) || "open"} data-hue={tone || "none"} data-lit={regulaLit(row.code) ? "1" : "0"} data-figure={regulaNear(row.code) ? "1" : "0"} data-short={regulaFar(row.code) ? "1" : "0"} data-long={regulaFade(row.code) ? "1" : "0"} data-dark={regulaDark(row.code) ? "1" : "0"} data-dim={regulaDim(row.code) ? "1" : "0"} data-blank={regulaBlank(row.code) ? "1" : "0"} data-open={regulaOpen(row.code) ? "1" : "0"} data-even={regulaEven(row.code) ? "1" : "0"} data-digit={regulaDigit(row.code) ? "1" : "0"} data-letter={regulaLetter(row.code) ? "1" : "0"} data-upper={regulaUpper(row.code) ? "1" : "0"}>
              <label className="c4-regula-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-regula-meta">{name || v4("rglOpen")} · {regulaStamp(row.code) || "—"} · {regulaLength(row.code) ?? "—"} · {laneLabel(v4, regulaLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-regula-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleRegulaReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("rglReviewed") : v4("rglReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { navigator.clipboard?.writeText(regulaCopy(row.code)); setCopied(row.id); }}>{copied === row.id ? v4("rglCopied") : v4("rglCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.userId || row.id}`)}>{v4("rglCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
