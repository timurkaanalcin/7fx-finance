"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  TRM_HIDE_KEY,
  TRM_REVIEW_KEY,
  MUL_DENSITY_KEY,
  MUL_KEY,
  MUL_PROFILES,
  MUL_VIEW_KEY,
  addMullion,
  addMullionTag,
  addMullionView,
  bedFocused,
  briskMullion,
  bulkTransomReview,
  bulkMullionLinen,
  bulkMullionShelf,
  bulkMullionRaise,
  bulkMullionTag,
  busiestHand,
  dropMullionView,
  editMullion,
  editMullionNote,
  fairHand,
  transomBlank,
  transomCopy,
  transomDigit,
  transomEven,
  transomFar,
  transomHue,
  transomLane,
  transomLanes,
  transomLanesCsv,
  transomLength,
  transomLetter,
  transomDark,
  transomDim,
  transomFade,
  transomLit,
  transomOpen,
  transomRowsCsv,
  transomShare,
  transomSlice,
  transomStamp,
  transomNear,
  transomUpper,
  idleMullion,
  laneTransomCount,
  lateMullion,
  leadingTransom,
  leadingTransomHue,
  graphiteQuiet,
  lowerDepthFocused,
  lowerHourFocused,
  moveMullionFocus,
  mullionBars,
  mullionCopy,
  mullionCounts,
  mullionCsv,
  mullionDensity,
  mullionHands,
  mullionTimeline,
  overdueMullion,
  pinMullionFocused,
  presentTransomLanes,
  profileCool,
  profileWarm,
  rackMullionFocused,
  raiseDepthFocused,
  raiseHourFocused,
  readHiddenTransom,
  readReviewedTransom,
  readMullionViews,
  readMullionList,
  reminderMullionList,
  restingMullion,
  setMullionFocused,
  setMullionBed,
  setMullionPin,
  setMullionRack,
  setMullionRaised,
  setMullionShelf,
  sortMullionList,
  suggestProfile,
  suggestMullionBed,
  suggestMullionHour,
  toggleTransom,
  toggleTransomReview,
  visibleTransom,
  visibleTransomLanes,
  visibleMullionList,
  type TransomReview,
  type TransomRow,
  type TransomShape,
  type Mullion,
  type MullionDensity,
  type MullionRack,
  type MullionSort,
  type MullionView,
} from "@/lib/crmv4/round406";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const BEDS = ["IVORY", "GRAPHITE", "GILT"] as const;
const HOURS = ["2", "4", "8", "16"] as const;
const DEPTHS = ["2", "4", "8"] as const;

const PROFILE_KEY: Record<string, CrmV4CopyKey> = {
  mullion: "mulMullion",
  jamb: "mulJamb",
  lintel: "mulLintel",
  sill: "mulSill",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "mulAuditSave",
  edit: "mulAuditEdit",
  note: "mulAuditNote",
  bed: "mulAuditBed",
  raise: "mulAuditRaise",
  free: "mulAuditFree",
  press: "mulAuditPress",
  return: "mulAuditReturn",
  shelf: "mulAuditShelf",
  open: "mulAuditOpen",
  tag: "mulAuditTag",
  depth: "mulAuditDepth",
  hour: "mulAuditHour",
  lower: "mulAuditLower",
  pin: "mulAuditPin",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  live: "trmLaneLive",
  code: "trmLaneCode",
  short: "trmLaneShort",
  long: "trmLaneLong",
  hold: "trmLaneHold",
  shut: "trmLaneShut",
  blank: "trmLaneBlank",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  gilt: "trmGilt",
  pearl: "trmPearl",
  ash: "trmAsh",
};

const SHAPE_KEY: Record<TransomShape, CrmV4CopyKey> = {
  all: "trmShapeAll",
  live: "trmShapeLive",
  code: "trmShapeCode",
  short: "trmShapeShort",
  long: "trmShapeLong",
  hold: "trmShapeHold",
  shut: "trmShapeShut",
  blank: "trmShapeBlank",
  open: "trmShapeOpen",
  digit: "trmShapeDigit",
  letter: "trmShapeLetter",
  even: "trmShapeEven",
  upper: "trmShapeUpper",
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
  return key ? v4(key) : v4("mulBlankProfile");
}

function bedLabel(v4: V4, bed: string): string {
  if (bed === "IVORY") return v4("mulLinen");
  if (bed === "GRAPHITE") return v4("mulSlate");
  if (bed === "GILT") return v4("mulGilt");
  return v4("mulAll");
}

function laneLabel(v4: V4, mail: string): string {
  const key = LANE_KEY[mail];
  return key ? v4(key) : v4("trmBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("trmBlank");
}

export function MullionCourses({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Mullion[]>([]);
  const [views, setViews] = useState<MullionView[]>([]);
  const [density, setDensity] = useState<MullionDensity>("open");
  const [rack, setRack] = useState<MullionRack>("base");
  const [query, setQuery] = useState("");
  const [handFilter, setHandFilter] = useState("");
  const [bedFilter, setBedFilter] = useState("all");
  const [profileFilter, setProfileFilter] = useState("all");
  const [hourFilter, setHourFilter] = useState("all");
  const [depthFilter, setDepthFilter] = useState("all");
  const [sort, setSort] = useState<MullionSort>("profile");
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
  const [station, setStation] = useState("mullion");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readMullionList(readJson(MUL_KEY, [])));
    setViews(readMullionViews(readJson(MUL_VIEW_KEY, [])));
    setDensity(mullionDensity(readJson(MUL_DENSITY_KEY, "open")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Mullion[]) {
    setCards(next);
    writeJson(MUL_KEY, next);
  }
  function storeViews(next: MullionView[]) {
    setViews(next);
    writeJson(MUL_VIEW_KEY, next);
  }
  function storeDensity(next: MullionDensity) {
    setDensity(next);
    writeJson(MUL_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortMullionList(visibleMullionList(cards, rack, query, handFilter, bedFilter, profileFilter, hourFilter, depthFilter), sort),
    [cards, rack, query, handFilter, bedFilter, profileFilter, hourFilter, depthFilter, sort],
  );
  const counts = mullionCounts(cards, shown, station);
  const bars = mullionBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = mullionTimeline(cards);
  const reminders = reminderMullionList(cards);
  const hands = mullionHands(cards);
  const busy = busiestHand(cards);
  const fair = fairHand(cards, hands.join(","));
  const suggestedBed = suggestMullionBed(cards);
  const suggestedHour = suggestMullionHour(cards, clock);
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
        download("mullion-courses.csv", mullionCsv(shown, station));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((card) => card.id));
        return;
      }
      if (event.key === "j" || event.key === "J") setFocusAt((index) => moveMullionFocus(index, shown.length, 1));
      if (event.key === "k" || event.key === "K") setFocusAt((index) => moveMullionFocus(index, shown.length, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, shown, station]);

  function saveCard() {
    if (viewer) return;
    store(addMullion(cards, { title, note, hand, profile, hour: hourNo, bed, depth: depthNo, tags }));
    setTitle("");
    setNote("");
    setTags("");
  }

  return (
    <section className="c4-mullion" aria-label={v4("mulTitle")} data-mullion="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-mullion-mast">
        <p className="c4-mullion-seal" data-logo="mono">{v4("mulLogo")}</p>
        <div>
          <p className="c4-mullion-kicker">{v4("mulSub")}</p>
          <h2 className="c4-title">{v4("mulTitle")}</h2>
        </div>
        <p className="c4-mullion-count">{shown.length}</p>
      </header>
      <p className="c4-mullion-links">
        <Link href={crmv4Href(base, "trm")}>{v4("trmTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("mulCustomers")}</Link>
      </p>
      <p className="c4-mullion-hint">{v4("mulHint")}</p>
      {viewer && <p className="c4-mullion-note">{v4("mulViewer")}</p>}
      <p className="c4-mullion-meta">{v4("mulFair")} {fair || "—"} · {v4("mulBusy")} {busy || "—"} · {v4("mulSuggest")} {profileLabel(v4, suggestedProfile)} · {bedLabel(v4, suggestedBed)} · {suggestedHour}</p>
      <ol className="c4-mullion-index" aria-label={v4("mulRemind")}>
        <li data-tone="gold">{v4("mulOverdue")} {counts.overdue}</li>
        <li data-tone="pitch">{v4("mulIdle")} {counts.idle}</li>
        <li data-tone="mist">{v4("mulBrisk")} {counts.brisk}</li>
        <li data-tone="mist">{v4("mulResting")} {counts.resting}</li>
      </ol>
      {reminders.length > 0 && (
        <ul className="c4-mullion-remind c4-mullion-notices" role="status" aria-label={v4("mulRemind")}>
          {reminders.map((name) => <li key={name}>{v4("mulOverdue")} {name}</li>)}
        </ul>
      )}
      <div className="c4-mullion-chart" aria-label={v4("mulChart")}>
        {bars.map((bar) => (
          <button key={bar.profile} type="button" className="c4-mullion-column" data-on={profileFilter === bar.profile ? "1" : "0"} onClick={() => setProfileFilter(profileFilter === bar.profile ? "all" : bar.profile)}>
            <i style={{ width: `${Math.max(18, Math.round((bar.count / peak) * 100))}%` }} />
            <strong>{bar.count}</strong>
            <span>{profileLabel(v4, bar.profile)}</span>
          </button>
        ))}
      </div>
      <form className="c4-mullion-form" onSubmit={(event) => { event.preventDefault(); saveCard(); }}>
        <label className="c4-lab">{v4("mulEdit")}<input ref={titleRef} className="c4-field" aria-label={v4("mulEdit")} value={title} maxLength={48} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("mulNote")}<input className="c4-field" aria-label={v4("mulNote")} aria-required={false} value={note} maxLength={80} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("mulHand")}<input className="c4-field" aria-label={v4("mulHand")} aria-required={false} value={hand} maxLength={24} disabled={viewer} onChange={(event) => setHand(event.target.value)} /></label>
        <label className="c4-lab">{v4("mulProfile")}<select className="c4-field" aria-label={v4("mulProfile")} value={profile} disabled={viewer} onChange={(event) => setProfile(event.target.value)}><option value="">{v4("mulBlankProfile")}</option>{MUL_PROFILES.map((item) => <option key={item} value={item}>{profileLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("mulBed")}<select className="c4-field" aria-label={v4("mulBed")} value={bed} disabled={viewer} onChange={(event) => setBed(event.target.value)}><option value="">{v4("mulAll")}</option>{BEDS.map((item) => <option key={item} value={item}>{bedLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("mulHour")}<select className="c4-field" aria-label={v4("mulHour")} value={hourNo} disabled={viewer} onChange={(event) => setHourNo(event.target.value)}><option value="">{v4("mulAll")}</option>{HOURS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("mulDepth")}<select className="c4-field" aria-label={v4("mulDepth")} value={depthNo} disabled={viewer} onChange={(event) => setDepthNo(event.target.value)}><option value="">{v4("mulAll")}</option>{DEPTHS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("mulTag")}<input className="c4-field" aria-label={v4("mulTag")} aria-required={false} value={tags} maxLength={8} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("mulAdd")}</button>
      </form>
      <div className="c4-mullion-tools">
        <input ref={searchRef} className="c4-field c4-mullion-search" aria-label={v4("mulSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("mulSearch")} />
        {(["base", "press", "shelf"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={rack === item ? "1" : "0"} onClick={() => setRack(item)}>{v4(item === "base" ? "mulYard" : item === "press" ? "mulPress" : "mulShelf")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={profileFilter === "warm" ? "1" : "0"} onClick={() => setProfileFilter(profileFilter === "warm" ? "all" : "warm")}>{v4("mulWarm")}</button>
        <button type="button" className="c4-chip" data-on={profileFilter === "cool" ? "1" : "0"} onClick={() => setProfileFilter(profileFilter === "cool" ? "all" : "cool")}>{v4("mulCool")}</button>
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
        <button type="button" className="c4-chip" data-on={sort === "hand" ? "1" : "0"} onClick={() => setSort(sort === "hand" ? "profile" : "hand")}>{sort === "hand" ? v4("mulSortHand") : v4("mulSortProfile")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "tight" ? "open" : "tight")}>{density === "tight" ? v4("mulTight") : v4("mulOpenDensity")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("mulTimeline")}</button>
        <label className="c4-lab">{v4("mulDesk")}<select className="c4-field" aria-label={v4("mulDesk")} value={station} onChange={(event) => setStation(event.target.value)}>{MUL_PROFILES.map((item) => <option key={item} value={item}>{profileLabel(v4, item)}</option>)}</select></label>
      </div>
      <form className="c4-mullion-view" onSubmit={(event) => {
        event.preventDefault();
        const id = `v${Date.now().toString(36)}`;
        storeViews(addMullionView(views, { id, name: viewName, rack, query, hand: handFilter, bed: bedFilter, profile: profileFilter, hour: hourFilter, depth: depthFilter }));
        setViewName("");
      }}>
        <label className="c4-lab">{v4("mulViewName")}<input className="c4-field" aria-label={v4("mulViewName")} aria-required={false} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn">{v4("mulSaveView")}</button>
      </form>
      <ul className="c4-mullion-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setRack(view.rack); setQuery(view.query); setHandFilter(view.hand); setBedFilter(view.bed); setProfileFilter(view.profile); setHourFilter(view.hour); setDepthFilter(view.depth); }}>{v4("mulApply")} {view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropMullionView(views, view.id))}>{v4("mulDropView")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-mullion-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkMullionRaise(cards, picked))}>{v4("mulBulkRaise")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkMullionShelf(cards, picked))}>{v4("mulBulkArchive")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkMullionLinen(cards, picked))}>{v4("mulBulkLinen")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkMullionTag(cards, picked))}>{v4("mulBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("mullion-courses.csv", mullionCsv(shown, station))}>{v4("mulCsv")}</button>
        <p className="c4-mullion-meta">{v4("mulKeys")} / c x a j k · {v4("mulQuiet")} {counts.quiet} · {v4("mulWarm")} {counts.warm}</p>
      </div>
      {board === "timeline" && (
        <ol className="c4-mullion-time" aria-label={v4("mulTimeline")}>
          {timeline.map((row) => <li key={row.hour}><span>{row.hour}</span> {row.titles.join(", ")}</li>)}
        </ol>
      )}
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("mulEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-mullion-list">
          {shown.map((card) => {
            const late = lateMullion(card, station);
            return (
              <li key={card.id} className="c4-mullion-card" data-on={focused?.id === card.id ? "1" : "0"} data-late={late ? "1" : "0"} data-idle={idleMullion(card) ? "1" : "0"} data-brisk={briskMullion(card) ? "1" : "0"} data-overdue={overdueMullion(card) ? "1" : "0"} data-resting={restingMullion(card) ? "1" : "0"} data-warm={profileWarm(card.profile) ? "1" : "0"} data-cool={profileCool(card.profile) ? "1" : "0"} data-quiet={graphiteQuiet(card.bed) ? "1" : "0"}>
                <label className="c4-mullion-pick">
                  <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                </label>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editMullion(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("mulEdit")} value={draft} maxLength={48} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("mulApply")}</button>
                    </form>
                  ) : <p>{card.title}</p>}
                  <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editMullionNote(cards, card.id, noteId === card.id ? noteDraft : card.note)); }}>
                    <input className="c4-field" aria-label={v4("mulNote")} aria-required={false} value={noteId === card.id ? noteDraft : card.note} maxLength={80} disabled={viewer} onChange={(event) => { setNoteId(card.id); setNoteDraft(event.target.value); }} onFocus={() => { setNoteId(card.id); setNoteDraft(card.note); }} />
                  </form>
                  <p className="c4-mullion-meta">{profileLabel(v4, card.profile)} · {bedLabel(v4, card.bed)} · {card.hour ?? "—"} · {card.depth} · {card.hand || "—"} · {card.tags.join(" ") || "—"}{card.audit ? ` · ${v4(AUDIT_KEY[card.audit] || "mulAuditSave")}` : ""}{late ? ` · ${v4("mulOverdue")}` : ""}</p>
                </div>
                <div className="c4-mullion-actions">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("mulEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setMullionRaised(cards, card.id, !card.raised))}>{card.raised ? v4("mulFree") : v4("mulRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setMullionBed(cards, card.id, suggestedBed))}>{v4("mulSuggest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setMullionRack(cards, card.id, !card.pressed))}>{card.pressed ? v4("mulUnpress") : v4("mulPressIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setMullionShelf(cards, card.id, !card.shelved))}>{card.shelved ? v4("mulUnshelf") : v4("mulShelfIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setMullionPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("mulUnpin") : v4("mulPin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addMullionTag(cards, card.id, "m"))}>{v4("mulTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHourFocused(cards, card.id))}>{v4("mulRaiseHour")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHourFocused(cards, card.id))}>{v4("mulLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseDepthFocused(cards, card.id))}>{v4("mulDepth")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerDepthFocused(cards, card.id))}>{v4("mulDepth")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bedFocused(cards, card.id))}>{v4("mulBed")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setMullionFocused(cards, card.id))}>{v4("mulRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(rackMullionFocused(cards, card.id))}>{v4("mulPress")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(pinMullionFocused(cards, card.id))}>{v4("mulPin")}</button>
                  <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(mullionCopy(card))}>{v4("mulCopy")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

type GroupUser = { id?: string; name?: string | null };

export function TransomPlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: GroupUser[] }>("/api/admin/users?take=24&meta=0");
  const [mail, setMail] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<TransomShape>("all");
  const [review, setReview] = useState<TransomReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): TransomRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      userId: id,
      code: transomSlice(row),
    };
  }).filter((row): row is TransomRow => Boolean(row));
  const present = presentTransomLanes(rows);
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
    const next = readHiddenTransom(readJson(TRM_HIDE_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(TRM_HIDE_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedTransom(readJson(TRM_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(TRM_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleTransomLanes(present, hidden, showHidden);
  const shown = visibleTransom(rows, lanes.includes(mail) || mail === "all" ? mail : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = transomLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = transomLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingTransom(rows);
  const leadHue = leadingTransomHue(rows);
  const whole = rows.filter((row) => transomLane(row.code)).length;
  const share = transomShare(laneTransomCount(rows, "live"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("transom-device-lanes.csv", transomLanesCsv(rows));
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
    writeJson(TRM_HIDE_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(TRM_REVIEW_KEY, next);
  }

  return (
    <section className="c4-transom" aria-label={v4("trmTitle")} data-transom="1" data-role={role} data-desk="1">
      <header className="c4-transom-mast">
        <p className="c4-transom-seal" data-logo="mono">{v4("trmLogo")}</p>
        <div>
          <p className="c4-transom-kicker">{v4("trmSub")}</p>
          <h2 className="c4-title">{v4("trmTitle")}</h2>
        </div>
        <p className="c4-transom-count">{shown.length}</p>
      </header>
      <p className="c4-transom-links">
        <Link href={crmv4Href(base, "mul")}>{v4("mulTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("trmCustomer")}</Link>
      </p>
      <p className="c4-transom-hint">{v4("trmHint")}</p>
      {viewer && <p className="c4-transom-note">{v4("trmViewer")}</p>}
      {queue.loading && <p className="c4-transom-meta">{v4("trmLoading")}</p>}
      {queue.error && <p className="c4-transom-meta">{v4("trmFailed")}</p>}
      <p className="c4-transom-meta">{v4("trmLead")} {laneLabel(v4, lead)} · {v4("trmToneLead")} {hueLabel(v4, leadHue)} · {v4("trmShare")} {share}</p>
      <div className="c4-transom-chart" aria-label={v4("trmChart")}>
        {lines.map((line) => (
          <button key={line.mail} type="button" className="c4-transom-column" data-on={mail === line.mail ? "1" : "0"} data-lang={line.mail} onClick={() => setMail(mail === line.mail ? "all" : line.mail)}>
            <i style={{ width: `${Math.max(18, Math.round((line.count / peak) * 100))}%` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.mail)}</span>
          </button>
        ))}
      </div>
      <div className="c4-transom-tools">
        <input ref={searchRef} className="c4-field c4-transom-search" aria-label={v4("trmSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("trmSearch")} />
        <label className="c4-lab">{v4("trmChart")}<select className="c4-field" aria-label={v4("trmChart")} value={shape} onChange={(event) => setShape(event.target.value as TransomShape)}>{(Object.keys(SHAPE_KEY) as TransomShape[]).map((item) => <option key={item} value={item}>{v4(SHAPE_KEY[item])}</option>)}</select></label>
        <button type="button" className="c4-chip" data-on={hue === "gilt" ? "1" : "0"} onClick={() => setHue(hue === "gilt" ? "all" : "gilt")}>{v4("trmGilt")}</button>
        <button type="button" className="c4-chip" data-on={hue === "pearl" ? "1" : "0"} onClick={() => setHue(hue === "pearl" ? "all" : "pearl")}>{v4("trmPearl")}</button>
        <button type="button" className="c4-chip" data-on={hue === "ash" ? "1" : "0"} onClick={() => setHue(hue === "ash" ? "all" : "ash")}>{v4("trmAsh")}</button>
        <button type="button" className="c4-chip" data-on={review === "fresh" ? "1" : "0"} onClick={() => setReview(review === "fresh" ? "all" : "fresh")}>{v4("trmFresh")}</button>
        <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} onClick={() => setReview(review === "reviewed" ? "all" : "reviewed")}>{v4("trmReviewed")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((on) => !on)}>{v4("trmShow")}</button>
        {present.map((lane) => (
          <button key={lane} type="button" className="c4-chip" data-on={hidden.includes(lane) ? "1" : "0"} onClick={() => storeHidden(toggleTransom(hidden, lane))}>{v4("trmHide")} {laneLabel(v4, lane)}</button>
        ))}
      </div>
      <div className="c4-transom-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkTransomReview(reviewed, picked, true))}>{v4("trmBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkTransomReview(reviewed, picked, false))}>{v4("trmBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("transom-devices.csv", transomRowsCsv(shown, reviewed))}>{v4("trmRowCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("transom-mark-lanes.csv", transomLanesCsv(rows))}>{v4("trmCsv")}</button>
      </div>
      {!shown.length && !queue.loading && <p className="c4-pay-empty">{v4("trmEmpty")}</p>}
      <ul className="c4-transom-list">
        {shown.map((row) => {
          const tone = transomHue(row.code);
          const name = transomCopy(row.code);
          return (
            <li key={row.id} className="c4-transom-card" data-mail={transomLane(row.code) || "open"} data-hue={tone || "none"} data-lit={transomLit(row.code) ? "1" : "0"} data-figure={transomNear(row.code) ? "1" : "0"} data-short={transomFar(row.code) ? "1" : "0"} data-long={transomFade(row.code) ? "1" : "0"} data-dark={transomDark(row.code) ? "1" : "0"} data-dim={transomDim(row.code) ? "1" : "0"} data-blank={transomBlank(row.code) ? "1" : "0"} data-open={transomOpen(row.code) ? "1" : "0"} data-even={transomEven(row.code) ? "1" : "0"} data-digit={transomDigit(row.code) ? "1" : "0"} data-letter={transomLetter(row.code) ? "1" : "0"} data-upper={transomUpper(row.code) ? "1" : "0"}>
              <label className="c4-transom-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-transom-meta">{name || v4("trmOpen")} · {transomStamp(row.code) || "—"} · {transomLength(row.code) ?? "—"} · {laneLabel(v4, transomLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-transom-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleTransomReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("trmReviewed") : v4("trmReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { navigator.clipboard?.writeText(transomCopy(row.code)); setCopied(row.id); }}>{copied === row.id ? v4("trmCopied") : v4("trmCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.userId || row.id}`)}>{v4("trmCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
