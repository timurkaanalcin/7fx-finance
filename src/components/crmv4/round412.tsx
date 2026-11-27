"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  TRG_HIDE_KEY,
  TRG_REVIEW_KEY,
  MTE_DENSITY_KEY,
  MTE_KEY,
  MTE_PROFILES,
  MTE_VIEW_KEY,
  addMetope,
  addMetopeTag,
  addMetopeView,
  bedFocused,
  briskMetope,
  bulkTriglyphReview,
  bulkMetopeLinen,
  bulkMetopeShelf,
  bulkMetopeRaise,
  bulkMetopeTag,
  busiestHand,
  dropMetopeView,
  editMetope,
  editMetopeNote,
  fairHand,
  triglyphBlank,
  triglyphCopy,
  triglyphDigit,
  triglyphEven,
  triglyphFar,
  triglyphHue,
  triglyphLane,
  triglyphLanes,
  triglyphLanesCsv,
  triglyphLength,
  triglyphLetter,
  triglyphDark,
  triglyphDim,
  triglyphFade,
  triglyphLit,
  triglyphOpen,
  triglyphRowsCsv,
  triglyphShare,
  triglyphSlice,
  triglyphStamp,
  triglyphNear,
  triglyphUpper,
  idleMetope,
  laneTriglyphCount,
  lateMetope,
  leadingTriglyph,
  leadingTriglyphHue,
  graphiteQuiet,
  lowerDepthFocused,
  lowerHourFocused,
  moveMetopeFocus,
  metopeBars,
  metopeCopy,
  metopeCounts,
  metopeCsv,
  metopeDensity,
  metopeHands,
  metopeTimeline,
  overdueMetope,
  pinMetopeFocused,
  presentTriglyphLanes,
  profileCool,
  profileWarm,
  rackMetopeFocused,
  raiseDepthFocused,
  raiseHourFocused,
  readHiddenTriglyph,
  readReviewedTriglyph,
  readMetopeViews,
  readMetopeList,
  reminderMetopeList,
  restingMetope,
  setMetopeFocused,
  setMetopeBed,
  setMetopePin,
  setMetopeRack,
  setMetopeRaised,
  setMetopeShelf,
  sortMetopeList,
  suggestProfile,
  suggestMetopeBed,
  suggestMetopeHour,
  toggleTriglyph,
  toggleTriglyphReview,
  visibleTriglyph,
  visibleTriglyphLanes,
  visibleMetopeList,
  type TriglyphReview,
  type TriglyphRow,
  type TriglyphShape,
  type Metope,
  type MetopeDensity,
  type MetopeRack,
  type MetopeSort,
  type MetopeView,
} from "@/lib/crmv4/round412";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const BEDS = ["IVORY", "GRAPHITE", "GILT"] as const;
const HOURS = ["2", "7", "11", "18"] as const;
const DEPTHS = ["4", "7", "11"] as const;

const PROFILE_KEY: Record<string, CrmV4CopyKey> = {
  metope: "mteMetope",
  gutta: "mteGutta",
  regula: "mteRegula",
  mutule: "mteMutule",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "mteAuditSave",
  edit: "mteAuditEdit",
  note: "mteAuditNote",
  bed: "mteAuditBed",
  raise: "mteAuditRaise",
  free: "mteAuditFree",
  press: "mteAuditPress",
  return: "mteAuditReturn",
  shelf: "mteAuditShelf",
  open: "mteAuditOpen",
  tag: "mteAuditTag",
  depth: "mteAuditDepth",
  hour: "mteAuditHour",
  lower: "mteAuditLower",
  pin: "mteAuditPin",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  live: "trgLaneLive",
  code: "trgLaneCode",
  short: "trgLaneShort",
  long: "trgLaneLong",
  hold: "trgLaneHold",
  shut: "trgLaneShut",
  blank: "trgLaneBlank",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  gilt: "trgGilt",
  pearl: "trgPearl",
  ash: "trgAsh",
};

const SHAPE_KEY: Record<TriglyphShape, CrmV4CopyKey> = {
  all: "trgShapeAll",
  live: "trgShapeLive",
  code: "trgShapeCode",
  short: "trgShapeShort",
  long: "trgShapeLong",
  hold: "trgShapeHold",
  shut: "trgShapeShut",
  blank: "trgShapeBlank",
  open: "trgShapeOpen",
  digit: "trgShapeDigit",
  letter: "trgShapeLetter",
  even: "trgShapeEven",
  upper: "trgShapeUpper",
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
  return key ? v4(key) : v4("mteBlankProfile");
}

function bedLabel(v4: V4, bed: string): string {
  if (bed === "IVORY") return v4("mteLinen");
  if (bed === "GRAPHITE") return v4("mteSlate");
  if (bed === "GILT") return v4("mteGilt");
  return v4("mteAll");
}

function laneLabel(v4: V4, mail: string): string {
  const key = LANE_KEY[mail];
  return key ? v4(key) : v4("trgBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("trgBlank");
}

export function MetopeCourses({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Metope[]>([]);
  const [views, setViews] = useState<MetopeView[]>([]);
  const [density, setDensity] = useState<MetopeDensity>("open");
  const [rack, setRack] = useState<MetopeRack>("base");
  const [query, setQuery] = useState("");
  const [handFilter, setHandFilter] = useState("");
  const [bedFilter, setBedFilter] = useState("all");
  const [profileFilter, setProfileFilter] = useState("all");
  const [hourFilter, setHourFilter] = useState("all");
  const [depthFilter, setDepthFilter] = useState("all");
  const [sort, setSort] = useState<MetopeSort>("profile");
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
  const [station, setStation] = useState("metope");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readMetopeList(readJson(MTE_KEY, [])));
    setViews(readMetopeViews(readJson(MTE_VIEW_KEY, [])));
    setDensity(metopeDensity(readJson(MTE_DENSITY_KEY, "open")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Metope[]) {
    setCards(next);
    writeJson(MTE_KEY, next);
  }
  function storeViews(next: MetopeView[]) {
    setViews(next);
    writeJson(MTE_VIEW_KEY, next);
  }
  function storeDensity(next: MetopeDensity) {
    setDensity(next);
    writeJson(MTE_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortMetopeList(visibleMetopeList(cards, rack, query, handFilter, bedFilter, profileFilter, hourFilter, depthFilter), sort),
    [cards, rack, query, handFilter, bedFilter, profileFilter, hourFilter, depthFilter, sort],
  );
  const counts = metopeCounts(cards, shown, station);
  const bars = metopeBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = metopeTimeline(cards);
  const reminders = reminderMetopeList(cards);
  const hands = metopeHands(cards);
  const busy = busiestHand(cards);
  const fair = fairHand(cards, hands.join(","));
  const suggestedBed = suggestMetopeBed(cards);
  const suggestedHour = suggestMetopeHour(cards, clock);
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
        download("metope-courses.csv", metopeCsv(shown, station));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((card) => card.id));
        return;
      }
      if (event.key === "j" || event.key === "J") setFocusAt((index) => moveMetopeFocus(index, shown.length, 1));
      if (event.key === "k" || event.key === "K") setFocusAt((index) => moveMetopeFocus(index, shown.length, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, shown, station]);

  function saveCard() {
    if (viewer) return;
    store(addMetope(cards, { title, note, hand, profile, hour: hourNo, bed, depth: depthNo, tags }));
    setTitle("");
    setNote("");
    setTags("");
  }

  return (
    <section className="c4-mte412" aria-label={v4("mteTitle")} data-mte412="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-mte412-mast">
        <p className="c4-mte412-seal" data-logo="mono">{v4("mteLogo")}</p>
        <div>
          <p className="c4-mte412-kicker">{v4("mteSub")}</p>
          <h2 className="c4-title">{v4("mteTitle")}</h2>
        </div>
        <p className="c4-mte412-count">{shown.length}</p>
      </header>
      <p className="c4-mte412-links">
        <Link href={crmv4Href(base, "trg")}>{v4("trgTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("mteCustomers")}</Link>
      </p>
      <p className="c4-mte412-hint">{v4("mteHint")}</p>
      {viewer && <p className="c4-mte412-note">{v4("mteViewer")}</p>}
      <p className="c4-mte412-meta">{v4("mteFair")} {fair || "—"} · {v4("mteBusy")} {busy || "—"} · {v4("mteSuggest")} {profileLabel(v4, suggestedProfile)} · {bedLabel(v4, suggestedBed)} · {suggestedHour}</p>
      <ol className="c4-mte412-index" aria-label={v4("mteRemind")}>
        <li data-tone="gold">{v4("mteOverdue")} {counts.overdue}</li>
        <li data-tone="pitch">{v4("mteIdle")} {counts.idle}</li>
        <li data-tone="mist">{v4("mteBrisk")} {counts.brisk}</li>
        <li data-tone="mist">{v4("mteResting")} {counts.resting}</li>
      </ol>
      {reminders.length > 0 && (
        <ul className="c4-mte412-remind c4-mte412-notices" role="status" aria-label={v4("mteRemind")}>
          {reminders.map((name) => <li key={name}>{v4("mteOverdue")} {name}</li>)}
        </ul>
      )}
      <div className="c4-mte412-chart" aria-label={v4("mteChart")}>
        {bars.map((bar) => (
          <button key={bar.profile} type="button" className="c4-mte412-column" data-on={profileFilter === bar.profile ? "1" : "0"} onClick={() => setProfileFilter(profileFilter === bar.profile ? "all" : bar.profile)}>
            <i style={{ width: `${Math.max(18, Math.round((bar.count / peak) * 100))}%` }} />
            <strong>{bar.count}</strong>
            <span>{profileLabel(v4, bar.profile)}</span>
          </button>
        ))}
      </div>
      <form className="c4-mte412-form" onSubmit={(event) => { event.preventDefault(); saveCard(); }}>
        <label className="c4-lab">{v4("mteEdit")}<input ref={titleRef} className="c4-field" aria-label={v4("mteEdit")} value={title} maxLength={48} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("mteNote")}<input className="c4-field" aria-label={v4("mteNote")} aria-required={false} value={note} maxLength={80} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("mteHand")}<input className="c4-field" aria-label={v4("mteHand")} aria-required={false} value={hand} maxLength={24} disabled={viewer} onChange={(event) => setHand(event.target.value)} /></label>
        <label className="c4-lab">{v4("mteProfile")}<select className="c4-field" aria-label={v4("mteProfile")} value={profile} disabled={viewer} onChange={(event) => setProfile(event.target.value)}><option value="">{v4("mteBlankProfile")}</option>{MTE_PROFILES.map((item) => <option key={item} value={item}>{profileLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("mteBed")}<select className="c4-field" aria-label={v4("mteBed")} value={bed} disabled={viewer} onChange={(event) => setBed(event.target.value)}><option value="">{v4("mteAll")}</option>{BEDS.map((item) => <option key={item} value={item}>{bedLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("mteHour")}<select className="c4-field" aria-label={v4("mteHour")} value={hourNo} disabled={viewer} onChange={(event) => setHourNo(event.target.value)}><option value="">{v4("mteAll")}</option>{HOURS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("mteDepth")}<select className="c4-field" aria-label={v4("mteDepth")} value={depthNo} disabled={viewer} onChange={(event) => setDepthNo(event.target.value)}><option value="">{v4("mteAll")}</option>{DEPTHS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("mteTag")}<input className="c4-field" aria-label={v4("mteTag")} aria-required={false} value={tags} maxLength={8} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("mteAdd")}</button>
      </form>
      <div className="c4-mte412-tools">
        <input ref={searchRef} className="c4-field c4-mte412-search" aria-label={v4("mteSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("mteSearch")} />
        {(["base", "press", "shelf"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={rack === item ? "1" : "0"} onClick={() => setRack(item)}>{v4(item === "base" ? "mteYard" : item === "press" ? "mtePress" : "mteShelf")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={profileFilter === "warm" ? "1" : "0"} onClick={() => setProfileFilter(profileFilter === "warm" ? "all" : "warm")}>{v4("mteWarm")}</button>
        <button type="button" className="c4-chip" data-on={profileFilter === "cool" ? "1" : "0"} onClick={() => setProfileFilter(profileFilter === "cool" ? "all" : "cool")}>{v4("mteCool")}</button>
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
        <button type="button" className="c4-chip" data-on={sort === "hand" ? "1" : "0"} onClick={() => setSort(sort === "hand" ? "profile" : "hand")}>{sort === "hand" ? v4("mteSortHand") : v4("mteSortProfile")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "tight" ? "open" : "tight")}>{density === "tight" ? v4("mteTight") : v4("mteOpenDensity")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("mteTimeline")}</button>
        <label className="c4-lab">{v4("mteDesk")}<select className="c4-field" aria-label={v4("mteDesk")} value={station} onChange={(event) => setStation(event.target.value)}>{MTE_PROFILES.map((item) => <option key={item} value={item}>{profileLabel(v4, item)}</option>)}</select></label>
      </div>
      <form className="c4-mte412-view" onSubmit={(event) => {
        event.preventDefault();
        const id = `v${Date.now().toString(36)}`;
        storeViews(addMetopeView(views, { id, name: viewName, rack, query, hand: handFilter, bed: bedFilter, profile: profileFilter, hour: hourFilter, depth: depthFilter }));
        setViewName("");
      }}>
        <label className="c4-lab">{v4("mteViewName")}<input className="c4-field" aria-label={v4("mteViewName")} aria-required={false} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn">{v4("mteSaveView")}</button>
      </form>
      <ul className="c4-mte412-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setRack(view.rack); setQuery(view.query); setHandFilter(view.hand); setBedFilter(view.bed); setProfileFilter(view.profile); setHourFilter(view.hour); setDepthFilter(view.depth); }}>{v4("mteApply")} {view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropMetopeView(views, view.id))}>{v4("mteDropView")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-mte412-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkMetopeRaise(cards, picked))}>{v4("mteBulkRaise")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkMetopeShelf(cards, picked))}>{v4("mteBulkArchive")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkMetopeLinen(cards, picked))}>{v4("mteBulkLinen")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkMetopeTag(cards, picked))}>{v4("mteBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("metope-courses.csv", metopeCsv(shown, station))}>{v4("mteCsv")}</button>
        <p className="c4-mte412-meta">{v4("mteKeys")} / c x a j k · {v4("mteQuiet")} {counts.quiet} · {v4("mteWarm")} {counts.warm}</p>
      </div>
      {board === "timeline" && (
        <ol className="c4-mte412-time" aria-label={v4("mteTimeline")}>
          {timeline.map((row) => <li key={row.hour}><span>{row.hour}</span> {row.titles.join(", ")}</li>)}
        </ol>
      )}
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("mteEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-mte412-list">
          {shown.map((card) => {
            const late = lateMetope(card, station);
            return (
              <li key={card.id} className="c4-mte412-card" data-on={focused?.id === card.id ? "1" : "0"} data-late={late ? "1" : "0"} data-idle={idleMetope(card) ? "1" : "0"} data-brisk={briskMetope(card) ? "1" : "0"} data-overdue={overdueMetope(card) ? "1" : "0"} data-resting={restingMetope(card) ? "1" : "0"} data-warm={profileWarm(card.profile) ? "1" : "0"} data-cool={profileCool(card.profile) ? "1" : "0"} data-quiet={graphiteQuiet(card.bed) ? "1" : "0"}>
                <label className="c4-mte412-pick">
                  <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                </label>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editMetope(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("mteEdit")} value={draft} maxLength={48} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("mteApply")}</button>
                    </form>
                  ) : <p>{card.title}</p>}
                  <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editMetopeNote(cards, card.id, noteId === card.id ? noteDraft : card.note)); }}>
                    <input className="c4-field" aria-label={v4("mteNote")} aria-required={false} value={noteId === card.id ? noteDraft : card.note} maxLength={80} disabled={viewer} onChange={(event) => { setNoteId(card.id); setNoteDraft(event.target.value); }} onFocus={() => { setNoteId(card.id); setNoteDraft(card.note); }} />
                  </form>
                  <p className="c4-mte412-meta">{profileLabel(v4, card.profile)} · {bedLabel(v4, card.bed)} · {card.hour ?? "—"} · {card.depth} · {card.hand || "—"} · {card.tags.join(" ") || "—"}{card.audit ? ` · ${v4(AUDIT_KEY[card.audit] || "mteAuditSave")}` : ""}{late ? ` · ${v4("mteOverdue")}` : ""}</p>
                </div>
                <div className="c4-mte412-actions">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("mteEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setMetopeRaised(cards, card.id, !card.raised))}>{card.raised ? v4("mteFree") : v4("mteRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setMetopeBed(cards, card.id, suggestedBed))}>{v4("mteSuggest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setMetopeRack(cards, card.id, !card.pressed))}>{card.pressed ? v4("mteUnpress") : v4("mtePressIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setMetopeShelf(cards, card.id, !card.shelved))}>{card.shelved ? v4("mteUnshelf") : v4("mteShelfIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setMetopePin(cards, card.id, !card.pinned))}>{card.pinned ? v4("mteUnpin") : v4("mtePin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addMetopeTag(cards, card.id, "m"))}>{v4("mteTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHourFocused(cards, card.id))}>{v4("mteRaiseHour")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHourFocused(cards, card.id))}>{v4("mteLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseDepthFocused(cards, card.id))}>{v4("mteDepth")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerDepthFocused(cards, card.id))}>{v4("mteDepth")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bedFocused(cards, card.id))}>{v4("mteBed")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setMetopeFocused(cards, card.id))}>{v4("mteRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(rackMetopeFocused(cards, card.id))}>{v4("mtePress")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(pinMetopeFocused(cards, card.id))}>{v4("mtePin")}</button>
                  <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(metopeCopy(card))}>{v4("mteCopy")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

type GroupUser = { id?: string; name?: string | null; username?: unknown };

export function TriglyphPlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: GroupUser[] }>("/api/admin/users?take=24&meta=0");
  const [mail, setMail] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<TriglyphShape>("all");
  const [review, setReview] = useState<TriglyphReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): TriglyphRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      userId: id,
      code: triglyphSlice(row),
    };
  }).filter((row): row is TriglyphRow => Boolean(row));
  const present = presentTriglyphLanes(rows);
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
    const next = readHiddenTriglyph(readJson(TRG_HIDE_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(TRG_HIDE_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedTriglyph(readJson(TRG_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(TRG_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleTriglyphLanes(present, hidden, showHidden);
  const shown = visibleTriglyph(rows, lanes.includes(mail) || mail === "all" ? mail : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = triglyphLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = triglyphLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingTriglyph(rows);
  const leadHue = leadingTriglyphHue(rows);
  const whole = rows.filter((row) => triglyphLane(row.code)).length;
  const share = triglyphShare(laneTriglyphCount(rows, "live"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("triglyph-username-lanes.csv", triglyphLanesCsv(rows));
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
    writeJson(TRG_HIDE_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(TRG_REVIEW_KEY, next);
  }

  return (
    <section className="c4-trg412" aria-label={v4("trgTitle")} data-trg412="1" data-role={role} data-username="1">
      <header className="c4-trg412-mast">
        <p className="c4-trg412-seal" data-logo="mono">{v4("trgLogo")}</p>
        <div>
          <p className="c4-trg412-kicker">{v4("trgSub")}</p>
          <h2 className="c4-title">{v4("trgTitle")}</h2>
        </div>
        <p className="c4-trg412-count">{shown.length}</p>
      </header>
      <p className="c4-trg412-links">
        <Link href={crmv4Href(base, "mte")}>{v4("mteTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("trgCustomer")}</Link>
      </p>
      <p className="c4-trg412-hint">{v4("trgHint")}</p>
      {viewer && <p className="c4-trg412-note">{v4("trgViewer")}</p>}
      {queue.loading && <p className="c4-trg412-meta">{v4("trgLoading")}</p>}
      {queue.error && <p className="c4-trg412-meta">{v4("trgFailed")}</p>}
      <p className="c4-trg412-meta">{v4("trgLead")} {laneLabel(v4, lead)} · {v4("trgToneLead")} {hueLabel(v4, leadHue)} · {v4("trgShare")} {share}</p>
      <div className="c4-trg412-chart" aria-label={v4("trgChart")}>
        {lines.map((line) => (
          <button key={line.mail} type="button" className="c4-trg412-column" data-on={mail === line.mail ? "1" : "0"} data-lang={line.mail} onClick={() => setMail(mail === line.mail ? "all" : line.mail)}>
            <i style={{ width: `${Math.max(18, Math.round((line.count / peak) * 100))}%` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.mail)}</span>
          </button>
        ))}
      </div>
      <div className="c4-trg412-tools">
        <input ref={searchRef} className="c4-field c4-trg412-search" aria-label={v4("trgSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("trgSearch")} />
        <label className="c4-lab">{v4("trgChart")}<select className="c4-field" aria-label={v4("trgChart")} value={shape} onChange={(event) => setShape(event.target.value as TriglyphShape)}>{(Object.keys(SHAPE_KEY) as TriglyphShape[]).map((item) => <option key={item} value={item}>{v4(SHAPE_KEY[item])}</option>)}</select></label>
        <button type="button" className="c4-chip" data-on={hue === "gilt" ? "1" : "0"} onClick={() => setHue(hue === "gilt" ? "all" : "gilt")}>{v4("trgGilt")}</button>
        <button type="button" className="c4-chip" data-on={hue === "pearl" ? "1" : "0"} onClick={() => setHue(hue === "pearl" ? "all" : "pearl")}>{v4("trgPearl")}</button>
        <button type="button" className="c4-chip" data-on={hue === "ash" ? "1" : "0"} onClick={() => setHue(hue === "ash" ? "all" : "ash")}>{v4("trgAsh")}</button>
        <button type="button" className="c4-chip" data-on={review === "fresh" ? "1" : "0"} onClick={() => setReview(review === "fresh" ? "all" : "fresh")}>{v4("trgFresh")}</button>
        <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} onClick={() => setReview(review === "reviewed" ? "all" : "reviewed")}>{v4("trgReviewed")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((on) => !on)}>{v4("trgShow")}</button>
        {present.map((lane) => (
          <button key={lane} type="button" className="c4-chip" data-on={hidden.includes(lane) ? "1" : "0"} onClick={() => storeHidden(toggleTriglyph(hidden, lane))}>{v4("trgHide")} {laneLabel(v4, lane)}</button>
        ))}
      </div>
      <div className="c4-trg412-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkTriglyphReview(reviewed, picked, true))}>{v4("trgBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkTriglyphReview(reviewed, picked, false))}>{v4("trgBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("triglyph-username-rows.csv", triglyphRowsCsv(shown, reviewed))}>{v4("trgRowCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("triglyph-username-marks.csv", triglyphLanesCsv(rows))}>{v4("trgCsv")}</button>
      </div>
      {!shown.length && !queue.loading && <p className="c4-pay-empty">{v4("trgEmpty")}</p>}
      <ul className="c4-trg412-list">
        {shown.map((row) => {
          const tone = triglyphHue(row.code);
          const name = triglyphCopy(row.code);
          return (
            <li key={row.id} className="c4-trg412-card" data-mail={triglyphLane(row.code) || "open"} data-hue={tone || "none"} data-lit={triglyphLit(row.code) ? "1" : "0"} data-figure={triglyphNear(row.code) ? "1" : "0"} data-short={triglyphFar(row.code) ? "1" : "0"} data-long={triglyphFade(row.code) ? "1" : "0"} data-dark={triglyphDark(row.code) ? "1" : "0"} data-dim={triglyphDim(row.code) ? "1" : "0"} data-blank={triglyphBlank(row.code) ? "1" : "0"} data-open={triglyphOpen(row.code) ? "1" : "0"} data-even={triglyphEven(row.code) ? "1" : "0"} data-digit={triglyphDigit(row.code) ? "1" : "0"} data-letter={triglyphLetter(row.code) ? "1" : "0"} data-upper={triglyphUpper(row.code) ? "1" : "0"}>
              <label className="c4-trg412-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-trg412-meta">{name || v4("trgOpen")} · {triglyphStamp(row.code) || "—"} · {triglyphLength(row.code) ?? "—"} · {laneLabel(v4, triglyphLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-trg412-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleTriglyphReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("trgReviewed") : v4("trgReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { navigator.clipboard?.writeText(triglyphCopy(row.code)); setCopied(row.id); }}>{copied === row.id ? v4("trgCopied") : v4("trgCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.userId || row.id}`)}>{v4("trgCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
