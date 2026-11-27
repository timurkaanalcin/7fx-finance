"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  CNL_HIDE_KEY,
  CNL_REVIEW_KEY,
  HTR_DENSITY_KEY,
  HTR_KEY,
  HTR_PROFILES,
  HTR_VIEW_KEY,
  addHypotrachelion,
  addHypotrachelionTag,
  addHypotrachelionView,
  bedFocused,
  briskHypotrachelion,
  bulkCanalisReview,
  bulkHypotrachelionLinen,
  bulkHypotrachelionShelf,
  bulkHypotrachelionRaise,
  bulkHypotrachelionTag,
  busiestHand,
  dropHypotrachelionView,
  editHypotrachelion,
  editHypotrachelionNote,
  fairHand,
  canalisBlank,
  canalisCopy,
  canalisDigit,
  canalisEven,
  canalisFar,
  canalisHue,
  canalisLane,
  canalisLanes,
  canalisLanesCsv,
  canalisLength,
  canalisLetter,
  canalisDark,
  canalisDim,
  canalisFade,
  canalisLit,
  canalisOpen,
  canalisRowsCsv,
  canalisShare,
  canalisSlice,
  canalisStamp,
  canalisNear,
  canalisUpper,
  idleHypotrachelion,
  laneCanalisCount,
  lateHypotrachelion,
  leadingCanalis,
  leadingCanalisHue,
  graphiteQuiet,
  lowerDepthFocused,
  lowerHourFocused,
  moveHypotrachelionFocus,
  hypotrachelionBars,
  hypotrachelionCopy,
  hypotrachelionCounts,
  hypotrachelionCsv,
  hypotrachelionDensity,
  hypotrachelionHands,
  hypotrachelionTimeline,
  overdueHypotrachelion,
  pinHypotrachelionFocused,
  presentCanalisLanes,
  profileCool,
  profileWarm,
  rackHypotrachelionFocused,
  raiseDepthFocused,
  raiseHourFocused,
  readHiddenCanalis,
  readReviewedCanalis,
  readHypotrachelionViews,
  readHypotrachelionList,
  reminderHypotrachelionList,
  restingHypotrachelion,
  setHypotrachelionFocused,
  setHypotrachelionBed,
  setHypotrachelionPin,
  setHypotrachelionRack,
  setHypotrachelionRaised,
  setHypotrachelionShelf,
  sortHypotrachelionList,
  suggestProfile,
  suggestHypotrachelionBed,
  suggestHypotrachelionHour,
  toggleCanalis,
  toggleCanalisReview,
  visibleCanalis,
  visibleCanalisLanes,
  visibleHypotrachelionList,
  type CanalisReview,
  type CanalisRow,
  type CanalisShape,
  type Hypotrachelion,
  type HypotrachelionDensity,
  type HypotrachelionRack,
  type HypotrachelionSort,
  type HypotrachelionView,
} from "@/lib/crmv4/round409";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const BEDS = ["IVORY", "GRAPHITE", "GILT"] as const;
const HOURS = ["3", "6", "9", "15"] as const;
const DEPTHS = ["3", "5", "9"] as const;

const PROFILE_KEY: Record<string, CrmV4CopyKey> = {
  hypotrachelion: "htrHypotrachelion",
  quirk: "htrQuirk",
  pedestal: "htrPedestal",
  canalis: "htrCanalis",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "htrAuditSave",
  edit: "htrAuditEdit",
  note: "htrAuditNote",
  bed: "htrAuditBed",
  raise: "htrAuditRaise",
  free: "htrAuditFree",
  press: "htrAuditPress",
  return: "htrAuditReturn",
  shelf: "htrAuditShelf",
  open: "htrAuditOpen",
  tag: "htrAuditTag",
  depth: "htrAuditDepth",
  hour: "htrAuditHour",
  lower: "htrAuditLower",
  pin: "htrAuditPin",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  live: "cnlLaneLive",
  code: "cnlLaneCode",
  short: "cnlLaneShort",
  long: "cnlLaneLong",
  hold: "cnlLaneHold",
  shut: "cnlLaneShut",
  blank: "cnlLaneBlank",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  gilt: "cnlGilt",
  pearl: "cnlPearl",
  ash: "cnlAsh",
};

const SHAPE_KEY: Record<CanalisShape, CrmV4CopyKey> = {
  all: "cnlShapeAll",
  live: "cnlShapeLive",
  code: "cnlShapeCode",
  short: "cnlShapeShort",
  long: "cnlShapeLong",
  hold: "cnlShapeHold",
  shut: "cnlShapeShut",
  blank: "cnlShapeBlank",
  open: "cnlShapeOpen",
  digit: "cnlShapeDigit",
  letter: "cnlShapeLetter",
  even: "cnlShapeEven",
  upper: "cnlShapeUpper",
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
  return key ? v4(key) : v4("htrBlankProfile");
}

function bedLabel(v4: V4, bed: string): string {
  if (bed === "IVORY") return v4("htrLinen");
  if (bed === "GRAPHITE") return v4("htrSlate");
  if (bed === "GILT") return v4("htrGilt");
  return v4("htrAll");
}

function laneLabel(v4: V4, mail: string): string {
  const key = LANE_KEY[mail];
  return key ? v4(key) : v4("cnlBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("cnlBlank");
}

export function HypotrachelionCourses({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Hypotrachelion[]>([]);
  const [views, setViews] = useState<HypotrachelionView[]>([]);
  const [density, setDensity] = useState<HypotrachelionDensity>("open");
  const [rack, setRack] = useState<HypotrachelionRack>("base");
  const [query, setQuery] = useState("");
  const [handFilter, setHandFilter] = useState("");
  const [bedFilter, setBedFilter] = useState("all");
  const [profileFilter, setProfileFilter] = useState("all");
  const [hourFilter, setHourFilter] = useState("all");
  const [depthFilter, setDepthFilter] = useState("all");
  const [sort, setSort] = useState<HypotrachelionSort>("profile");
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
  const [station, setStation] = useState("hypotrachelion");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readHypotrachelionList(readJson(HTR_KEY, [])));
    setViews(readHypotrachelionViews(readJson(HTR_VIEW_KEY, [])));
    setDensity(hypotrachelionDensity(readJson(HTR_DENSITY_KEY, "open")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Hypotrachelion[]) {
    setCards(next);
    writeJson(HTR_KEY, next);
  }
  function storeViews(next: HypotrachelionView[]) {
    setViews(next);
    writeJson(HTR_VIEW_KEY, next);
  }
  function storeDensity(next: HypotrachelionDensity) {
    setDensity(next);
    writeJson(HTR_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortHypotrachelionList(visibleHypotrachelionList(cards, rack, query, handFilter, bedFilter, profileFilter, hourFilter, depthFilter), sort),
    [cards, rack, query, handFilter, bedFilter, profileFilter, hourFilter, depthFilter, sort],
  );
  const counts = hypotrachelionCounts(cards, shown, station);
  const bars = hypotrachelionBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = hypotrachelionTimeline(cards);
  const reminders = reminderHypotrachelionList(cards);
  const hands = hypotrachelionHands(cards);
  const busy = busiestHand(cards);
  const fair = fairHand(cards, hands.join(","));
  const suggestedBed = suggestHypotrachelionBed(cards);
  const suggestedHour = suggestHypotrachelionHour(cards, clock);
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
        download("hypotrachelion-courses.csv", hypotrachelionCsv(shown, station));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((card) => card.id));
        return;
      }
      if (event.key === "j" || event.key === "J") setFocusAt((index) => moveHypotrachelionFocus(index, shown.length, 1));
      if (event.key === "k" || event.key === "K") setFocusAt((index) => moveHypotrachelionFocus(index, shown.length, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, shown, station]);

  function saveCard() {
    if (viewer) return;
    store(addHypotrachelion(cards, { title, note, hand, profile, hour: hourNo, bed, depth: depthNo, tags }));
    setTitle("");
    setNote("");
    setTags("");
  }

  return (
    <section className="c4-hypotrachelion" aria-label={v4("htrTitle")} data-hypotrachelion="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-hypotrachelion-mast">
        <p className="c4-hypotrachelion-seal" data-logo="mono">{v4("htrLogo")}</p>
        <div>
          <p className="c4-hypotrachelion-kicker">{v4("htrSub")}</p>
          <h2 className="c4-title">{v4("htrTitle")}</h2>
        </div>
        <p className="c4-hypotrachelion-count">{shown.length}</p>
      </header>
      <p className="c4-hypotrachelion-links">
        <Link href={crmv4Href(base, "cnl")}>{v4("cnlTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("htrCustomers")}</Link>
      </p>
      <p className="c4-hypotrachelion-hint">{v4("htrHint")}</p>
      {viewer && <p className="c4-hypotrachelion-note">{v4("htrViewer")}</p>}
      <p className="c4-hypotrachelion-meta">{v4("htrFair")} {fair || "—"} · {v4("htrBusy")} {busy || "—"} · {v4("htrSuggest")} {profileLabel(v4, suggestedProfile)} · {bedLabel(v4, suggestedBed)} · {suggestedHour}</p>
      <ol className="c4-hypotrachelion-index" aria-label={v4("htrRemind")}>
        <li data-tone="gold">{v4("htrOverdue")} {counts.overdue}</li>
        <li data-tone="pitch">{v4("htrIdle")} {counts.idle}</li>
        <li data-tone="mist">{v4("htrBrisk")} {counts.brisk}</li>
        <li data-tone="mist">{v4("htrResting")} {counts.resting}</li>
      </ol>
      {reminders.length > 0 && (
        <ul className="c4-hypotrachelion-remind c4-hypotrachelion-notices" role="status" aria-label={v4("htrRemind")}>
          {reminders.map((name) => <li key={name}>{v4("htrOverdue")} {name}</li>)}
        </ul>
      )}
      <div className="c4-hypotrachelion-chart" aria-label={v4("htrChart")}>
        {bars.map((bar) => (
          <button key={bar.profile} type="button" className="c4-hypotrachelion-column" data-on={profileFilter === bar.profile ? "1" : "0"} onClick={() => setProfileFilter(profileFilter === bar.profile ? "all" : bar.profile)}>
            <i style={{ width: `${Math.max(18, Math.round((bar.count / peak) * 100))}%` }} />
            <strong>{bar.count}</strong>
            <span>{profileLabel(v4, bar.profile)}</span>
          </button>
        ))}
      </div>
      <form className="c4-hypotrachelion-form" onSubmit={(event) => { event.preventDefault(); saveCard(); }}>
        <label className="c4-lab">{v4("htrEdit")}<input ref={titleRef} className="c4-field" aria-label={v4("htrEdit")} value={title} maxLength={48} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("htrNote")}<input className="c4-field" aria-label={v4("htrNote")} aria-required={false} value={note} maxLength={80} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("htrHand")}<input className="c4-field" aria-label={v4("htrHand")} aria-required={false} value={hand} maxLength={24} disabled={viewer} onChange={(event) => setHand(event.target.value)} /></label>
        <label className="c4-lab">{v4("htrProfile")}<select className="c4-field" aria-label={v4("htrProfile")} value={profile} disabled={viewer} onChange={(event) => setProfile(event.target.value)}><option value="">{v4("htrBlankProfile")}</option>{HTR_PROFILES.map((item) => <option key={item} value={item}>{profileLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("htrBed")}<select className="c4-field" aria-label={v4("htrBed")} value={bed} disabled={viewer} onChange={(event) => setBed(event.target.value)}><option value="">{v4("htrAll")}</option>{BEDS.map((item) => <option key={item} value={item}>{bedLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("htrHour")}<select className="c4-field" aria-label={v4("htrHour")} value={hourNo} disabled={viewer} onChange={(event) => setHourNo(event.target.value)}><option value="">{v4("htrAll")}</option>{HOURS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("htrDepth")}<select className="c4-field" aria-label={v4("htrDepth")} value={depthNo} disabled={viewer} onChange={(event) => setDepthNo(event.target.value)}><option value="">{v4("htrAll")}</option>{DEPTHS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("htrTag")}<input className="c4-field" aria-label={v4("htrTag")} aria-required={false} value={tags} maxLength={8} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("htrAdd")}</button>
      </form>
      <div className="c4-hypotrachelion-tools">
        <input ref={searchRef} className="c4-field c4-hypotrachelion-search" aria-label={v4("htrSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("htrSearch")} />
        {(["base", "press", "shelf"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={rack === item ? "1" : "0"} onClick={() => setRack(item)}>{v4(item === "base" ? "htrYard" : item === "press" ? "htrPress" : "htrShelf")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={profileFilter === "warm" ? "1" : "0"} onClick={() => setProfileFilter(profileFilter === "warm" ? "all" : "warm")}>{v4("htrWarm")}</button>
        <button type="button" className="c4-chip" data-on={profileFilter === "cool" ? "1" : "0"} onClick={() => setProfileFilter(profileFilter === "cool" ? "all" : "cool")}>{v4("htrCool")}</button>
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
        <button type="button" className="c4-chip" data-on={sort === "hand" ? "1" : "0"} onClick={() => setSort(sort === "hand" ? "profile" : "hand")}>{sort === "hand" ? v4("htrSortHand") : v4("htrSortProfile")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "tight" ? "open" : "tight")}>{density === "tight" ? v4("htrTight") : v4("htrOpenDensity")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("htrTimeline")}</button>
        <label className="c4-lab">{v4("htrDesk")}<select className="c4-field" aria-label={v4("htrDesk")} value={station} onChange={(event) => setStation(event.target.value)}>{HTR_PROFILES.map((item) => <option key={item} value={item}>{profileLabel(v4, item)}</option>)}</select></label>
      </div>
      <form className="c4-hypotrachelion-view" onSubmit={(event) => {
        event.preventDefault();
        const id = `v${Date.now().toString(36)}`;
        storeViews(addHypotrachelionView(views, { id, name: viewName, rack, query, hand: handFilter, bed: bedFilter, profile: profileFilter, hour: hourFilter, depth: depthFilter }));
        setViewName("");
      }}>
        <label className="c4-lab">{v4("htrViewName")}<input className="c4-field" aria-label={v4("htrViewName")} aria-required={false} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn">{v4("htrSaveView")}</button>
      </form>
      <ul className="c4-hypotrachelion-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setRack(view.rack); setQuery(view.query); setHandFilter(view.hand); setBedFilter(view.bed); setProfileFilter(view.profile); setHourFilter(view.hour); setDepthFilter(view.depth); }}>{v4("htrApply")} {view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropHypotrachelionView(views, view.id))}>{v4("htrDropView")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-hypotrachelion-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkHypotrachelionRaise(cards, picked))}>{v4("htrBulkRaise")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkHypotrachelionShelf(cards, picked))}>{v4("htrBulkArchive")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkHypotrachelionLinen(cards, picked))}>{v4("htrBulkLinen")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkHypotrachelionTag(cards, picked))}>{v4("htrBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("hypotrachelion-courses.csv", hypotrachelionCsv(shown, station))}>{v4("htrCsv")}</button>
        <p className="c4-hypotrachelion-meta">{v4("htrKeys")} / c x a j k · {v4("htrQuiet")} {counts.quiet} · {v4("htrWarm")} {counts.warm}</p>
      </div>
      {board === "timeline" && (
        <ol className="c4-hypotrachelion-time" aria-label={v4("htrTimeline")}>
          {timeline.map((row) => <li key={row.hour}><span>{row.hour}</span> {row.titles.join(", ")}</li>)}
        </ol>
      )}
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("htrEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-hypotrachelion-list">
          {shown.map((card) => {
            const late = lateHypotrachelion(card, station);
            return (
              <li key={card.id} className="c4-hypotrachelion-card" data-on={focused?.id === card.id ? "1" : "0"} data-late={late ? "1" : "0"} data-idle={idleHypotrachelion(card) ? "1" : "0"} data-brisk={briskHypotrachelion(card) ? "1" : "0"} data-overdue={overdueHypotrachelion(card) ? "1" : "0"} data-resting={restingHypotrachelion(card) ? "1" : "0"} data-warm={profileWarm(card.profile) ? "1" : "0"} data-cool={profileCool(card.profile) ? "1" : "0"} data-quiet={graphiteQuiet(card.bed) ? "1" : "0"}>
                <label className="c4-hypotrachelion-pick">
                  <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                </label>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editHypotrachelion(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("htrEdit")} value={draft} maxLength={48} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("htrApply")}</button>
                    </form>
                  ) : <p>{card.title}</p>}
                  <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editHypotrachelionNote(cards, card.id, noteId === card.id ? noteDraft : card.note)); }}>
                    <input className="c4-field" aria-label={v4("htrNote")} aria-required={false} value={noteId === card.id ? noteDraft : card.note} maxLength={80} disabled={viewer} onChange={(event) => { setNoteId(card.id); setNoteDraft(event.target.value); }} onFocus={() => { setNoteId(card.id); setNoteDraft(card.note); }} />
                  </form>
                  <p className="c4-hypotrachelion-meta">{profileLabel(v4, card.profile)} · {bedLabel(v4, card.bed)} · {card.hour ?? "—"} · {card.depth} · {card.hand || "—"} · {card.tags.join(" ") || "—"}{card.audit ? ` · ${v4(AUDIT_KEY[card.audit] || "htrAuditSave")}` : ""}{late ? ` · ${v4("htrOverdue")}` : ""}</p>
                </div>
                <div className="c4-hypotrachelion-actions">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("htrEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setHypotrachelionRaised(cards, card.id, !card.raised))}>{card.raised ? v4("htrFree") : v4("htrRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setHypotrachelionBed(cards, card.id, suggestedBed))}>{v4("htrSuggest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setHypotrachelionRack(cards, card.id, !card.pressed))}>{card.pressed ? v4("htrUnpress") : v4("htrPressIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setHypotrachelionShelf(cards, card.id, !card.shelved))}>{card.shelved ? v4("htrUnshelf") : v4("htrShelfIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setHypotrachelionPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("htrUnpin") : v4("htrPin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addHypotrachelionTag(cards, card.id, "h"))}>{v4("htrTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHourFocused(cards, card.id))}>{v4("htrRaiseHour")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHourFocused(cards, card.id))}>{v4("htrLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseDepthFocused(cards, card.id))}>{v4("htrDepth")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerDepthFocused(cards, card.id))}>{v4("htrDepth")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bedFocused(cards, card.id))}>{v4("htrBed")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setHypotrachelionFocused(cards, card.id))}>{v4("htrRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(rackHypotrachelionFocused(cards, card.id))}>{v4("htrPress")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(pinHypotrachelionFocused(cards, card.id))}>{v4("htrPin")}</button>
                  <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(hypotrachelionCopy(card))}>{v4("htrCopy")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

type GroupUser = { id?: string; name?: string | null; lastOs?: unknown };

export function CanalisPlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: GroupUser[] }>("/api/admin/users?take=24&meta=0");
  const [mail, setMail] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<CanalisShape>("all");
  const [review, setReview] = useState<CanalisReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): CanalisRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      userId: id,
      code: canalisSlice(row),
    };
  }).filter((row): row is CanalisRow => Boolean(row));
  const present = presentCanalisLanes(rows);
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
    const next = readHiddenCanalis(readJson(CNL_HIDE_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(CNL_HIDE_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedCanalis(readJson(CNL_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(CNL_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleCanalisLanes(present, hidden, showHidden);
  const shown = visibleCanalis(rows, lanes.includes(mail) || mail === "all" ? mail : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = canalisLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = canalisLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingCanalis(rows);
  const leadHue = leadingCanalisHue(rows);
  const whole = rows.filter((row) => canalisLane(row.code)).length;
  const share = canalisShare(laneCanalisCount(rows, "live"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("canalis-os-lanes.csv", canalisLanesCsv(rows));
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
    writeJson(CNL_HIDE_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(CNL_REVIEW_KEY, next);
  }

  return (
    <section className="c4-canalis" aria-label={v4("cnlTitle")} data-canalis="1" data-role={role} data-os="1">
      <header className="c4-canalis-mast">
        <p className="c4-canalis-seal" data-logo="mono">{v4("cnlLogo")}</p>
        <div>
          <p className="c4-canalis-kicker">{v4("cnlSub")}</p>
          <h2 className="c4-title">{v4("cnlTitle")}</h2>
        </div>
        <p className="c4-canalis-count">{shown.length}</p>
      </header>
      <p className="c4-canalis-links">
        <Link href={crmv4Href(base, "htr")}>{v4("htrTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("cnlCustomer")}</Link>
      </p>
      <p className="c4-canalis-hint">{v4("cnlHint")}</p>
      {viewer && <p className="c4-canalis-note">{v4("cnlViewer")}</p>}
      {queue.loading && <p className="c4-canalis-meta">{v4("cnlLoading")}</p>}
      {queue.error && <p className="c4-canalis-meta">{v4("cnlFailed")}</p>}
      <p className="c4-canalis-meta">{v4("cnlLead")} {laneLabel(v4, lead)} · {v4("cnlToneLead")} {hueLabel(v4, leadHue)} · {v4("cnlShare")} {share}</p>
      <div className="c4-canalis-chart" aria-label={v4("cnlChart")}>
        {lines.map((line) => (
          <button key={line.mail} type="button" className="c4-canalis-column" data-on={mail === line.mail ? "1" : "0"} data-lang={line.mail} onClick={() => setMail(mail === line.mail ? "all" : line.mail)}>
            <i style={{ width: `${Math.max(18, Math.round((line.count / peak) * 100))}%` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.mail)}</span>
          </button>
        ))}
      </div>
      <div className="c4-canalis-tools">
        <input ref={searchRef} className="c4-field c4-canalis-search" aria-label={v4("cnlSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("cnlSearch")} />
        <label className="c4-lab">{v4("cnlChart")}<select className="c4-field" aria-label={v4("cnlChart")} value={shape} onChange={(event) => setShape(event.target.value as CanalisShape)}>{(Object.keys(SHAPE_KEY) as CanalisShape[]).map((item) => <option key={item} value={item}>{v4(SHAPE_KEY[item])}</option>)}</select></label>
        <button type="button" className="c4-chip" data-on={hue === "gilt" ? "1" : "0"} onClick={() => setHue(hue === "gilt" ? "all" : "gilt")}>{v4("cnlGilt")}</button>
        <button type="button" className="c4-chip" data-on={hue === "pearl" ? "1" : "0"} onClick={() => setHue(hue === "pearl" ? "all" : "pearl")}>{v4("cnlPearl")}</button>
        <button type="button" className="c4-chip" data-on={hue === "ash" ? "1" : "0"} onClick={() => setHue(hue === "ash" ? "all" : "ash")}>{v4("cnlAsh")}</button>
        <button type="button" className="c4-chip" data-on={review === "fresh" ? "1" : "0"} onClick={() => setReview(review === "fresh" ? "all" : "fresh")}>{v4("cnlFresh")}</button>
        <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} onClick={() => setReview(review === "reviewed" ? "all" : "reviewed")}>{v4("cnlReviewed")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((on) => !on)}>{v4("cnlShow")}</button>
        {present.map((lane) => (
          <button key={lane} type="button" className="c4-chip" data-on={hidden.includes(lane) ? "1" : "0"} onClick={() => storeHidden(toggleCanalis(hidden, lane))}>{v4("cnlHide")} {laneLabel(v4, lane)}</button>
        ))}
      </div>
      <div className="c4-canalis-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkCanalisReview(reviewed, picked, true))}>{v4("cnlBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkCanalisReview(reviewed, picked, false))}>{v4("cnlBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("canalis-os-rows.csv", canalisRowsCsv(shown, reviewed))}>{v4("cnlRowCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("canalis-os-marks.csv", canalisLanesCsv(rows))}>{v4("cnlCsv")}</button>
      </div>
      {!shown.length && !queue.loading && <p className="c4-pay-empty">{v4("cnlEmpty")}</p>}
      <ul className="c4-canalis-list">
        {shown.map((row) => {
          const tone = canalisHue(row.code);
          const name = canalisCopy(row.code);
          return (
            <li key={row.id} className="c4-canalis-card" data-mail={canalisLane(row.code) || "open"} data-hue={tone || "none"} data-lit={canalisLit(row.code) ? "1" : "0"} data-figure={canalisNear(row.code) ? "1" : "0"} data-short={canalisFar(row.code) ? "1" : "0"} data-long={canalisFade(row.code) ? "1" : "0"} data-dark={canalisDark(row.code) ? "1" : "0"} data-dim={canalisDim(row.code) ? "1" : "0"} data-blank={canalisBlank(row.code) ? "1" : "0"} data-open={canalisOpen(row.code) ? "1" : "0"} data-even={canalisEven(row.code) ? "1" : "0"} data-digit={canalisDigit(row.code) ? "1" : "0"} data-letter={canalisLetter(row.code) ? "1" : "0"} data-upper={canalisUpper(row.code) ? "1" : "0"}>
              <label className="c4-canalis-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-canalis-meta">{name || v4("cnlOpen")} · {canalisStamp(row.code) || "—"} · {canalisLength(row.code) ?? "—"} · {laneLabel(v4, canalisLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-canalis-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleCanalisReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("cnlReviewed") : v4("cnlReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { navigator.clipboard?.writeText(canalisCopy(row.code)); setCopied(row.id); }}>{copied === row.id ? v4("cnlCopied") : v4("cnlCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.userId || row.id}`)}>{v4("cnlCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
