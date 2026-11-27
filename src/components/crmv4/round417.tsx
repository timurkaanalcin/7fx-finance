"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  LMB_HIDE_KEY,
  LMB_REVIEW_KEY,
  SPK_DENSITY_KEY,
  SPK_KEY,
  SPK_PROFILES,
  SPK_VIEW_KEY,
  addSpirketing,
  addSpirketingTag,
  addSpirketingView,
  bedFocused,
  briskSpirketing,
  bulkLimberReview,
  bulkSpirketingLinen,
  bulkSpirketingShelf,
  bulkSpirketingRaise,
  bulkSpirketingTag,
  busiestHand,
  dropSpirketingView,
  editSpirketing,
  editSpirketingNote,
  fairHand,
  limberBlank,
  limberCopy,
  limberDigit,
  limberEven,
  limberFar,
  limberHue,
  limberLane,
  limberLanes,
  limberLanesCsv,
  limberLength,
  limberLetter,
  limberDark,
  limberDim,
  limberFade,
  limberLit,
  limberOpen,
  limberRowsCsv,
  limberShare,
  limberSlice,
  limberStamp,
  limberNear,
  limberUpper,
  idleSpirketing,
  laneLimberCount,
  lateSpirketing,
  leadingLimber,
  leadingLimberHue,
  graphiteQuiet,
  lowerDepthFocused,
  lowerHourFocused,
  moveSpirketingFocus,
  spirketingBars,
  spirketingCopy,
  spirketingCounts,
  spirketingCsv,
  spirketingDensity,
  spirketingHands,
  spirketingTimeline,
  overdueSpirketing,
  pinSpirketingFocused,
  presentLimberLanes,
  profileCool,
  profileWarm,
  rackSpirketingFocused,
  raiseDepthFocused,
  raiseHourFocused,
  readHiddenLimber,
  readReviewedLimber,
  readSpirketingViews,
  readSpirketingList,
  reminderSpirketingList,
  restingSpirketing,
  setSpirketingFocused,
  setSpirketingBed,
  setSpirketingPin,
  setSpirketingRack,
  setSpirketingRaised,
  setSpirketingShelf,
  sortSpirketingList,
  suggestProfile,
  suggestSpirketingBed,
  suggestSpirketingHour,
  toggleLimber,
  toggleLimberReview,
  visibleLimber,
  visibleLimberLanes,
  visibleSpirketingList,
  type LimberReview,
  type LimberRow,
  type LimberShape,
  type Spirketing,
  type SpirketingDensity,
  type SpirketingRack,
  type SpirketingSort,
  type SpirketingView,
} from "@/lib/crmv4/round417";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const BEDS = ["IVORY", "GRAPHITE", "GILT"] as const;
const HOURS = ["4", "8", "16", "32"] as const;
const DEPTHS = ["2", "4", "8"] as const;

const PROFILE_KEY: Record<string, CrmV4CopyKey> = {
  spirketing: "spkSpirketing",
  deadwood: "spkDeadwood",
  breastwork: "spkBreastwork",
  taffrail: "spkTaffrail",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "spkAuditSave",
  edit: "spkAuditEdit",
  note: "spkAuditNote",
  bed: "spkAuditBed",
  raise: "spkAuditRaise",
  free: "spkAuditFree",
  press: "spkAuditPress",
  return: "spkAuditReturn",
  shelf: "spkAuditShelf",
  open: "spkAuditOpen",
  tag: "spkAuditTag",
  depth: "spkAuditDepth",
  hour: "spkAuditHour",
  lower: "spkAuditLower",
  pin: "spkAuditPin",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  live: "lmbLaneLive",
  code: "lmbLaneCode",
  short: "lmbLaneShort",
  long: "lmbLaneLong",
  hold: "lmbLaneHold",
  shut: "lmbLaneShut",
  blank: "lmbLaneBlank",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  gilt: "lmbGilt",
  pearl: "lmbPearl",
  ash: "lmbAsh",
};

const SHAPE_KEY: Record<LimberShape, CrmV4CopyKey> = {
  all: "lmbShapeAll",
  live: "lmbShapeLive",
  code: "lmbShapeCode",
  short: "lmbShapeShort",
  long: "lmbShapeLong",
  hold: "lmbShapeHold",
  shut: "lmbShapeShut",
  blank: "lmbShapeBlank",
  open: "lmbShapeOpen",
  digit: "lmbShapeDigit",
  letter: "lmbShapeLetter",
  even: "lmbShapeEven",
  upper: "lmbShapeUpper",
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
  return key ? v4(key) : v4("spkBlankProfile");
}

function bedLabel(v4: V4, bed: string): string {
  if (bed === "IVORY") return v4("spkLinen");
  if (bed === "GRAPHITE") return v4("spkSlate");
  if (bed === "GILT") return v4("spkGilt");
  return v4("spkAll");
}

function laneLabel(v4: V4, mail: string): string {
  const key = LANE_KEY[mail];
  return key ? v4(key) : v4("lmbBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("lmbBlank");
}

export function SpirketingCourses({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Spirketing[]>([]);
  const [views, setViews] = useState<SpirketingView[]>([]);
  const [density, setDensity] = useState<SpirketingDensity>("open");
  const [rack, setRack] = useState<SpirketingRack>("base");
  const [query, setQuery] = useState("");
  const [handFilter, setHandFilter] = useState("");
  const [bedFilter, setBedFilter] = useState("all");
  const [profileFilter, setProfileFilter] = useState("all");
  const [hourFilter, setHourFilter] = useState("all");
  const [depthFilter, setDepthFilter] = useState("all");
  const [sort, setSort] = useState<SpirketingSort>("profile");
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
  const [station, setStation] = useState("spirketing");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readSpirketingList(readJson(SPK_KEY, [])));
    setViews(readSpirketingViews(readJson(SPK_VIEW_KEY, [])));
    setDensity(spirketingDensity(readJson(SPK_DENSITY_KEY, "open")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Spirketing[]) {
    setCards(next);
    writeJson(SPK_KEY, next);
  }
  function storeViews(next: SpirketingView[]) {
    setViews(next);
    writeJson(SPK_VIEW_KEY, next);
  }
  function storeDensity(next: SpirketingDensity) {
    setDensity(next);
    writeJson(SPK_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortSpirketingList(visibleSpirketingList(cards, rack, query, handFilter, bedFilter, profileFilter, hourFilter, depthFilter), sort),
    [cards, rack, query, handFilter, bedFilter, profileFilter, hourFilter, depthFilter, sort],
  );
  const counts = spirketingCounts(cards, shown, station);
  const bars = spirketingBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = spirketingTimeline(cards);
  const reminders = reminderSpirketingList(cards);
  const hands = spirketingHands(cards);
  const busy = busiestHand(cards);
  const fair = fairHand(cards, hands.join(","));
  const suggestedBed = suggestSpirketingBed(cards);
  const suggestedHour = suggestSpirketingHour(cards, clock);
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
        download("spirketing-courses.csv", spirketingCsv(shown, station));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((card) => card.id));
        return;
      }
      if (event.key === "j" || event.key === "J") setFocusAt((index) => moveSpirketingFocus(index, shown.length, 1));
      if (event.key === "k" || event.key === "K") setFocusAt((index) => moveSpirketingFocus(index, shown.length, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, shown, station]);

  function saveCard() {
    if (viewer) return;
    store(addSpirketing(cards, { title, note, hand, profile, hour: hourNo, bed, depth: depthNo, tags }));
    setTitle("");
    setNote("");
    setTags("");
  }

  return (
    <section className="c4-spk417" aria-label={v4("spkTitle")} data-spk417="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-spk417-mast">
        <p className="c4-spk417-seal" data-logo="mono">{v4("spkLogo")}</p>
        <div>
          <p className="c4-spk417-kicker">{v4("spkSub")}</p>
          <h2 className="c4-title">{v4("spkTitle")}</h2>
        </div>
        <p className="c4-spk417-count">{shown.length}</p>
      </header>
      <p className="c4-spk417-links">
        <Link href={crmv4Href(base, "lmb")}>{v4("lmbTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("spkCustomers")}</Link>
      </p>
      <p className="c4-spk417-hint">{v4("spkHint")}</p>
      {viewer && <p className="c4-spk417-note">{v4("spkViewer")}</p>}
      <p className="c4-spk417-meta">{v4("spkFair")} {fair || "—"} · {v4("spkBusy")} {busy || "—"} · {v4("spkSuggest")} {profileLabel(v4, suggestedProfile)} · {bedLabel(v4, suggestedBed)} · {suggestedHour}</p>
      <ol className="c4-spk417-index" aria-label={v4("spkRemind")}>
        <li data-tone="gold">{v4("spkOverdue")} {counts.overdue}</li>
        <li data-tone="pitch">{v4("spkIdle")} {counts.idle}</li>
        <li data-tone="mist">{v4("spkBrisk")} {counts.brisk}</li>
        <li data-tone="mist">{v4("spkResting")} {counts.resting}</li>
      </ol>
      {reminders.length > 0 && (
        <ul className="c4-spk417-remind c4-spk417-notices" role="status" aria-label={v4("spkRemind")}>
          {reminders.map((name) => <li key={name}>{v4("spkOverdue")} {name}</li>)}
        </ul>
      )}
      <div className="c4-spk417-chart" aria-label={v4("spkChart")}>
        {bars.map((bar) => (
          <button key={bar.profile} type="button" className="c4-spk417-column" data-on={profileFilter === bar.profile ? "1" : "0"} onClick={() => setProfileFilter(profileFilter === bar.profile ? "all" : bar.profile)}>
            <i style={{ width: `${Math.max(18, Math.round((bar.count / peak) * 100))}%` }} />
            <strong>{bar.count}</strong>
            <span>{profileLabel(v4, bar.profile)}</span>
          </button>
        ))}
      </div>
      <form className="c4-spk417-form" onSubmit={(event) => { event.preventDefault(); saveCard(); }}>
        <label className="c4-lab">{v4("spkEdit")}<input ref={titleRef} className="c4-field" aria-label={v4("spkEdit")} value={title} maxLength={48} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("spkNote")}<input className="c4-field" aria-label={v4("spkNote")} aria-required={false} value={note} maxLength={80} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("spkHand")}<input className="c4-field" aria-label={v4("spkHand")} aria-required={false} value={hand} maxLength={24} disabled={viewer} onChange={(event) => setHand(event.target.value)} /></label>
        <label className="c4-lab">{v4("spkProfile")}<select className="c4-field" aria-label={v4("spkProfile")} value={profile} disabled={viewer} onChange={(event) => setProfile(event.target.value)}><option value="">{v4("spkBlankProfile")}</option>{SPK_PROFILES.map((item) => <option key={item} value={item}>{profileLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("spkBed")}<select className="c4-field" aria-label={v4("spkBed")} value={bed} disabled={viewer} onChange={(event) => setBed(event.target.value)}><option value="">{v4("spkAll")}</option>{BEDS.map((item) => <option key={item} value={item}>{bedLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("spkHour")}<select className="c4-field" aria-label={v4("spkHour")} value={hourNo} disabled={viewer} onChange={(event) => setHourNo(event.target.value)}><option value="">{v4("spkAll")}</option>{HOURS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("spkDepth")}<select className="c4-field" aria-label={v4("spkDepth")} value={depthNo} disabled={viewer} onChange={(event) => setDepthNo(event.target.value)}><option value="">{v4("spkAll")}</option>{DEPTHS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("spkTag")}<input className="c4-field" aria-label={v4("spkTag")} aria-required={false} value={tags} maxLength={8} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("spkAdd")}</button>
      </form>
      <div className="c4-spk417-tools">
        <input ref={searchRef} className="c4-field c4-spk417-search" aria-label={v4("spkSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("spkSearch")} />
        {(["base", "press", "shelf"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={rack === item ? "1" : "0"} onClick={() => setRack(item)}>{v4(item === "base" ? "spkYard" : item === "press" ? "spkPress" : "spkShelf")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={profileFilter === "warm" ? "1" : "0"} onClick={() => setProfileFilter(profileFilter === "warm" ? "all" : "warm")}>{v4("spkWarm")}</button>
        <button type="button" className="c4-chip" data-on={profileFilter === "cool" ? "1" : "0"} onClick={() => setProfileFilter(profileFilter === "cool" ? "all" : "cool")}>{v4("spkCool")}</button>
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
        <button type="button" className="c4-chip" data-on={sort === "hand" ? "1" : "0"} onClick={() => setSort(sort === "hand" ? "profile" : "hand")}>{sort === "hand" ? v4("spkSortHand") : v4("spkSortProfile")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "tight" ? "open" : "tight")}>{density === "tight" ? v4("spkTight") : v4("spkOpenDensity")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("spkTimeline")}</button>
        <label className="c4-lab">{v4("spkDesk")}<select className="c4-field" aria-label={v4("spkDesk")} value={station} onChange={(event) => setStation(event.target.value)}>{SPK_PROFILES.map((item) => <option key={item} value={item}>{profileLabel(v4, item)}</option>)}</select></label>
      </div>
      <form className="c4-spk417-view" onSubmit={(event) => {
        event.preventDefault();
        const id = `v${Date.now().toString(36)}`;
        storeViews(addSpirketingView(views, { id, name: viewName, rack, query, hand: handFilter, bed: bedFilter, profile: profileFilter, hour: hourFilter, depth: depthFilter }));
        setViewName("");
      }}>
        <label className="c4-lab">{v4("spkViewName")}<input className="c4-field" aria-label={v4("spkViewName")} aria-required={false} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn">{v4("spkSaveView")}</button>
      </form>
      <ul className="c4-spk417-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setRack(view.rack); setQuery(view.query); setHandFilter(view.hand); setBedFilter(view.bed); setProfileFilter(view.profile); setHourFilter(view.hour); setDepthFilter(view.depth); }}>{v4("spkApply")} {view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropSpirketingView(views, view.id))}>{v4("spkDropView")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-spk417-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkSpirketingRaise(cards, picked))}>{v4("spkBulkRaise")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkSpirketingShelf(cards, picked))}>{v4("spkBulkArchive")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkSpirketingLinen(cards, picked))}>{v4("spkBulkLinen")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkSpirketingTag(cards, picked))}>{v4("spkBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("spirketing-courses.csv", spirketingCsv(shown, station))}>{v4("spkCsv")}</button>
        <p className="c4-spk417-meta">{v4("spkKeys")} / c x a j k · {v4("spkQuiet")} {counts.quiet} · {v4("spkWarm")} {counts.warm}</p>
      </div>
      {board === "timeline" && (
        <ol className="c4-spk417-time" aria-label={v4("spkTimeline")}>
          {timeline.map((row) => <li key={row.hour}><span>{row.hour}</span> {row.titles.join(", ")}</li>)}
        </ol>
      )}
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("spkEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-spk417-list">
          {shown.map((card) => {
            const late = lateSpirketing(card, station);
            return (
              <li key={card.id} className="c4-spk417-card" data-on={focused?.id === card.id ? "1" : "0"} data-late={late ? "1" : "0"} data-idle={idleSpirketing(card) ? "1" : "0"} data-brisk={briskSpirketing(card) ? "1" : "0"} data-overdue={overdueSpirketing(card) ? "1" : "0"} data-resting={restingSpirketing(card) ? "1" : "0"} data-warm={profileWarm(card.profile) ? "1" : "0"} data-cool={profileCool(card.profile) ? "1" : "0"} data-quiet={graphiteQuiet(card.bed) ? "1" : "0"}>
                <label className="c4-spk417-pick">
                  <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                </label>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editSpirketing(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("spkEdit")} value={draft} maxLength={48} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("spkApply")}</button>
                    </form>
                  ) : <p>{card.title}</p>}
                  <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editSpirketingNote(cards, card.id, noteId === card.id ? noteDraft : card.note)); }}>
                    <input className="c4-field" aria-label={v4("spkNote")} aria-required={false} value={noteId === card.id ? noteDraft : card.note} maxLength={80} disabled={viewer} onChange={(event) => { setNoteId(card.id); setNoteDraft(event.target.value); }} onFocus={() => { setNoteId(card.id); setNoteDraft(card.note); }} />
                  </form>
                  <p className="c4-spk417-meta">{profileLabel(v4, card.profile)} · {bedLabel(v4, card.bed)} · {card.hour ?? "—"} · {card.depth} · {card.hand || "—"} · {card.tags.join(" ") || "—"}{card.audit ? ` · ${v4(AUDIT_KEY[card.audit] || "spkAuditSave")}` : ""}{late ? ` · ${v4("spkOverdue")}` : ""}</p>
                </div>
                <div className="c4-spk417-actions">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("spkEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSpirketingRaised(cards, card.id, !card.raised))}>{card.raised ? v4("spkFree") : v4("spkRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSpirketingBed(cards, card.id, suggestedBed))}>{v4("spkSuggest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSpirketingRack(cards, card.id, !card.pressed))}>{card.pressed ? v4("spkUnpress") : v4("spkPressIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSpirketingShelf(cards, card.id, !card.shelved))}>{card.shelved ? v4("spkUnshelf") : v4("spkShelfIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSpirketingPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("spkUnpin") : v4("spkPin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addSpirketingTag(cards, card.id, "l"))}>{v4("spkTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHourFocused(cards, card.id))}>{v4("spkRaiseHour")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHourFocused(cards, card.id))}>{v4("spkLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseDepthFocused(cards, card.id))}>{v4("spkDepth")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerDepthFocused(cards, card.id))}>{v4("spkDepth")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bedFocused(cards, card.id))}>{v4("spkBed")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setSpirketingFocused(cards, card.id))}>{v4("spkRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(rackSpirketingFocused(cards, card.id))}>{v4("spkPress")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(pinSpirketingFocused(cards, card.id))}>{v4("spkPin")}</button>
                  <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(spirketingCopy(card))}>{v4("spkCopy")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

type GroupUser = { id?: string; name?: string | null; affiliateC?: unknown };

export function LimberPlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: GroupUser[] }>("/api/admin/users?take=24&meta=0");
  const [mail, setMail] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<LimberShape>("all");
  const [review, setReview] = useState<LimberReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): LimberRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      userId: id,
      code: limberSlice(row),
    };
  }).filter((row): row is LimberRow => Boolean(row));
  const present = presentLimberLanes(rows);
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
    const next = readHiddenLimber(readJson(LMB_HIDE_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(LMB_HIDE_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedLimber(readJson(LMB_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(LMB_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleLimberLanes(present, hidden, showHidden);
  const shown = visibleLimber(rows, lanes.includes(mail) || mail === "all" ? mail : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = limberLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = limberLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingLimber(rows);
  const leadHue = leadingLimberHue(rows);
  const whole = rows.filter((row) => limberLane(row.code)).length;
  const share = limberShare(laneLimberCount(rows, "live"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("limber-affiliate-lanes.csv", limberLanesCsv(rows));
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
    writeJson(LMB_HIDE_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(LMB_REVIEW_KEY, next);
  }

  return (
    <section className="c4-lmb417" aria-label={v4("lmbTitle")} data-lmb417="1" data-role={role} data-affiliate="1">
      <header className="c4-lmb417-mast">
        <p className="c4-lmb417-seal" data-logo="mono">{v4("lmbLogo")}</p>
        <div>
          <p className="c4-lmb417-kicker">{v4("lmbSub")}</p>
          <h2 className="c4-title">{v4("lmbTitle")}</h2>
        </div>
        <p className="c4-lmb417-count">{shown.length}</p>
      </header>
      <p className="c4-lmb417-links">
        <Link href={crmv4Href(base, "spk")}>{v4("spkTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("lmbCustomer")}</Link>
      </p>
      <p className="c4-lmb417-hint">{v4("lmbHint")}</p>
      {viewer && <p className="c4-lmb417-note">{v4("lmbViewer")}</p>}
      {queue.loading && <p className="c4-lmb417-meta">{v4("lmbLoading")}</p>}
      {queue.error && <p className="c4-lmb417-meta">{v4("lmbFailed")}</p>}
      <p className="c4-lmb417-meta">{v4("lmbLead")} {laneLabel(v4, lead)} · {v4("lmbToneLead")} {hueLabel(v4, leadHue)} · {v4("lmbShare")} {share}</p>
      <div className="c4-lmb417-chart" aria-label={v4("lmbChart")}>
        {lines.map((line) => (
          <button key={line.mail} type="button" className="c4-lmb417-column" data-on={mail === line.mail ? "1" : "0"} data-lang={line.mail} onClick={() => setMail(mail === line.mail ? "all" : line.mail)}>
            <i style={{ width: `${Math.max(18, Math.round((line.count / peak) * 100))}%` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.mail)}</span>
          </button>
        ))}
      </div>
      <div className="c4-lmb417-tools">
        <input ref={searchRef} className="c4-field c4-lmb417-search" aria-label={v4("lmbSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("lmbSearch")} />
        <label className="c4-lab">{v4("lmbChart")}<select className="c4-field" aria-label={v4("lmbChart")} value={shape} onChange={(event) => setShape(event.target.value as LimberShape)}>{(Object.keys(SHAPE_KEY) as LimberShape[]).map((item) => <option key={item} value={item}>{v4(SHAPE_KEY[item])}</option>)}</select></label>
        <button type="button" className="c4-chip" data-on={hue === "gilt" ? "1" : "0"} onClick={() => setHue(hue === "gilt" ? "all" : "gilt")}>{v4("lmbGilt")}</button>
        <button type="button" className="c4-chip" data-on={hue === "pearl" ? "1" : "0"} onClick={() => setHue(hue === "pearl" ? "all" : "pearl")}>{v4("lmbPearl")}</button>
        <button type="button" className="c4-chip" data-on={hue === "ash" ? "1" : "0"} onClick={() => setHue(hue === "ash" ? "all" : "ash")}>{v4("lmbAsh")}</button>
        <button type="button" className="c4-chip" data-on={review === "fresh" ? "1" : "0"} onClick={() => setReview(review === "fresh" ? "all" : "fresh")}>{v4("lmbFresh")}</button>
        <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} onClick={() => setReview(review === "reviewed" ? "all" : "reviewed")}>{v4("lmbReviewed")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((on) => !on)}>{v4("lmbShow")}</button>
        {present.map((lane) => (
          <button key={lane} type="button" className="c4-chip" data-on={hidden.includes(lane) ? "1" : "0"} onClick={() => storeHidden(toggleLimber(hidden, lane))}>{v4("lmbHide")} {laneLabel(v4, lane)}</button>
        ))}
      </div>
      <div className="c4-lmb417-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkLimberReview(reviewed, picked, true))}>{v4("lmbBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkLimberReview(reviewed, picked, false))}>{v4("lmbBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("limber-affiliate-rows.csv", limberRowsCsv(shown, reviewed))}>{v4("lmbRowCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("limber-affiliate-marks.csv", limberLanesCsv(rows))}>{v4("lmbCsv")}</button>
      </div>
      {!shown.length && !queue.loading && <p className="c4-pay-empty">{v4("lmbEmpty")}</p>}
      <ul className="c4-lmb417-list">
        {shown.map((row) => {
          const tone = limberHue(row.code);
          const name = limberCopy(row.code);
          return (
            <li key={row.id} className="c4-lmb417-card" data-mail={limberLane(row.code) || "open"} data-hue={tone || "none"} data-lit={limberLit(row.code) ? "1" : "0"} data-figure={limberNear(row.code) ? "1" : "0"} data-short={limberFar(row.code) ? "1" : "0"} data-long={limberFade(row.code) ? "1" : "0"} data-dark={limberDark(row.code) ? "1" : "0"} data-dim={limberDim(row.code) ? "1" : "0"} data-blank={limberBlank(row.code) ? "1" : "0"} data-open={limberOpen(row.code) ? "1" : "0"} data-even={limberEven(row.code) ? "1" : "0"} data-digit={limberDigit(row.code) ? "1" : "0"} data-letter={limberLetter(row.code) ? "1" : "0"} data-upper={limberUpper(row.code) ? "1" : "0"}>
              <label className="c4-lmb417-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-lmb417-meta">{name || v4("lmbOpen")} · {limberStamp(row.code) || "—"} · {limberLength(row.code) ?? "—"} · {laneLabel(v4, limberLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-lmb417-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleLimberReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("lmbReviewed") : v4("lmbReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { navigator.clipboard?.writeText(limberCopy(row.code)); setCopied(row.id); }}>{copied === row.id ? v4("lmbCopied") : v4("lmbCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.userId || row.id}`)}>{v4("lmbCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
