"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  XST_HIDE_KEY,
  XST_REVIEW_KEY,
  ORL_DENSITY_KEY,
  ORL_KEY,
  ORL_PROFILES,
  ORL_VIEW_KEY,
  addOrillon,
  addOrillonTag,
  addOrillonView,
  bedFocused,
  briskOrillon,
  bulkCrossetteReview,
  bulkOrillonLinen,
  bulkOrillonShelf,
  bulkOrillonRaise,
  bulkOrillonTag,
  busiestHand,
  dropOrillonView,
  editOrillon,
  editOrillonNote,
  fairHand,
  crossetteBlank,
  crossetteCopy,
  crossetteDigit,
  crossetteEven,
  crossetteFar,
  crossetteHue,
  crossetteLane,
  crossetteLanes,
  crossetteLanesCsv,
  crossetteLength,
  crossetteLetter,
  crossetteDark,
  crossetteDim,
  crossetteFade,
  crossetteLit,
  crossetteOpen,
  crossetteRowsCsv,
  crossetteShare,
  crossetteSlice,
  crossetteStamp,
  crossetteNear,
  crossetteUpper,
  idleOrillon,
  laneCrossetteCount,
  lateOrillon,
  leadingCrossette,
  leadingCrossetteHue,
  ivoryQuiet,
  lowerDepthFocused,
  lowerHourFocused,
  moveOrillonFocus,
  orillonBars,
  orillonCopy,
  orillonCounts,
  orillonCsv,
  orillonDensity,
  orillonHands,
  orillonTimeline,
  overdueOrillon,
  pinOrillonFocused,
  presentCrossetteLanes,
  profileCool,
  profileWarm,
  rackOrillonFocused,
  raiseDepthFocused,
  raiseHourFocused,
  readHiddenCrossette,
  readReviewedCrossette,
  readOrillonViews,
  readOrillonList,
  reminderOrillonList,
  restingOrillon,
  setOrillonFocused,
  setOrillonBed,
  setOrillonPin,
  setOrillonRack,
  setOrillonRaised,
  setOrillonShelf,
  sortOrillonList,
  suggestProfile,
  suggestOrillonBed,
  suggestOrillonHour,
  toggleCrossette,
  toggleCrossetteReview,
  visibleCrossette,
  visibleCrossetteLanes,
  visibleOrillonList,
  type CrossetteReview,
  type CrossetteRow,
  type CrossetteShape,
  type Orillon,
  type OrillonDensity,
  type OrillonRack,
  type OrillonSort,
  type OrillonView,
} from "@/lib/crmv4/round414";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const BEDS = ["IVORY", "GRAPHITE", "GILT"] as const;
const HOURS = ["3", "6", "12", "15"] as const;
const DEPTHS = ["3", "6", "9"] as const;

const PROFILE_KEY: Record<string, CrmV4CopyKey> = {
  orillon: "ornOrillon",
  caponier: "ornCaponier",
  tenaille: "ornTenaille",
  bartizan: "ornBartizan",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "ornAuditSave",
  edit: "ornAuditEdit",
  note: "ornAuditNote",
  bed: "ornAuditBed",
  raise: "ornAuditRaise",
  free: "ornAuditFree",
  press: "ornAuditPress",
  return: "ornAuditReturn",
  shelf: "ornAuditShelf",
  open: "ornAuditOpen",
  tag: "ornAuditTag",
  depth: "ornAuditDepth",
  hour: "ornAuditHour",
  lower: "ornAuditLower",
  pin: "ornAuditPin",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  live: "xstLaneLive",
  code: "xstLaneCode",
  short: "xstLaneShort",
  long: "xstLaneLong",
  hold: "xstLaneHold",
  shut: "xstLaneShut",
  blank: "xstLaneBlank",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  gilt: "xstGilt",
  pearl: "xstPearl",
  ash: "xstAsh",
};

const SHAPE_KEY: Record<CrossetteShape, CrmV4CopyKey> = {
  all: "xstShapeAll",
  live: "xstShapeLive",
  code: "xstShapeCode",
  short: "xstShapeShort",
  long: "xstShapeLong",
  hold: "xstShapeHold",
  shut: "xstShapeShut",
  blank: "xstShapeBlank",
  open: "xstShapeOpen",
  digit: "xstShapeDigit",
  letter: "xstShapeLetter",
  even: "xstShapeEven",
  upper: "xstShapeUpper",
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
  return key ? v4(key) : v4("ornBlankProfile");
}

function bedLabel(v4: V4, bed: string): string {
  if (bed === "IVORY") return v4("ornLinen");
  if (bed === "GRAPHITE") return v4("ornSlate");
  if (bed === "GILT") return v4("ornGilt");
  return v4("ornAll");
}

function laneLabel(v4: V4, mail: string): string {
  const key = LANE_KEY[mail];
  return key ? v4(key) : v4("xstBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("xstBlank");
}

export function OrillonCourses({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Orillon[]>([]);
  const [views, setViews] = useState<OrillonView[]>([]);
  const [density, setDensity] = useState<OrillonDensity>("open");
  const [rack, setRack] = useState<OrillonRack>("base");
  const [query, setQuery] = useState("");
  const [handFilter, setHandFilter] = useState("");
  const [bedFilter, setBedFilter] = useState("all");
  const [profileFilter, setProfileFilter] = useState("all");
  const [hourFilter, setHourFilter] = useState("all");
  const [depthFilter, setDepthFilter] = useState("all");
  const [sort, setSort] = useState<OrillonSort>("profile");
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
  const [station, setStation] = useState("orillon");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readOrillonList(readJson(ORL_KEY, [])));
    setViews(readOrillonViews(readJson(ORL_VIEW_KEY, [])));
    setDensity(orillonDensity(readJson(ORL_DENSITY_KEY, "open")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Orillon[]) {
    setCards(next);
    writeJson(ORL_KEY, next);
  }
  function storeViews(next: OrillonView[]) {
    setViews(next);
    writeJson(ORL_VIEW_KEY, next);
  }
  function storeDensity(next: OrillonDensity) {
    setDensity(next);
    writeJson(ORL_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortOrillonList(visibleOrillonList(cards, rack, query, handFilter, bedFilter, profileFilter, hourFilter, depthFilter), sort),
    [cards, rack, query, handFilter, bedFilter, profileFilter, hourFilter, depthFilter, sort],
  );
  const counts = orillonCounts(cards, shown, station);
  const bars = orillonBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = orillonTimeline(cards);
  const reminders = reminderOrillonList(cards);
  const hands = orillonHands(cards);
  const busy = busiestHand(cards);
  const fair = fairHand(cards, hands.join(","));
  const suggestedBed = suggestOrillonBed(cards);
  const suggestedHour = suggestOrillonHour(cards, clock);
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
        download("orillon-courses.csv", orillonCsv(shown, station));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((card) => card.id));
        return;
      }
      if (event.key === "j" || event.key === "J") setFocusAt((index) => moveOrillonFocus(index, shown.length, 1));
      if (event.key === "k" || event.key === "K") setFocusAt((index) => moveOrillonFocus(index, shown.length, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, shown, station]);

  function saveCard() {
    if (viewer) return;
    store(addOrillon(cards, { title, note, hand, profile, hour: hourNo, bed, depth: depthNo, tags }));
    setTitle("");
    setNote("");
    setTags("");
  }

  return (
    <section className="c4-orl414" aria-label={v4("ornTitle")} data-orl414="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-orl414-mast">
        <p className="c4-orl414-seal" data-logo="mono">{v4("ornLogo")}</p>
        <div>
          <p className="c4-orl414-kicker">{v4("ornSub")}</p>
          <h2 className="c4-title">{v4("ornTitle")}</h2>
        </div>
        <p className="c4-orl414-count">{shown.length}</p>
      </header>
      <p className="c4-orl414-links">
        <Link href={crmv4Href(base, "xst")}>{v4("xstTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("ornCustomers")}</Link>
      </p>
      <p className="c4-orl414-hint">{v4("ornHint")}</p>
      {viewer && <p className="c4-orl414-note">{v4("ornViewer")}</p>}
      <p className="c4-orl414-meta">{v4("ornFair")} {fair || "—"} · {v4("ornBusy")} {busy || "—"} · {v4("ornSuggest")} {profileLabel(v4, suggestedProfile)} · {bedLabel(v4, suggestedBed)} · {suggestedHour}</p>
      <ol className="c4-orl414-index" aria-label={v4("ornRemind")}>
        <li data-tone="gold">{v4("ornOverdue")} {counts.overdue}</li>
        <li data-tone="pitch">{v4("ornIdle")} {counts.idle}</li>
        <li data-tone="mist">{v4("ornBrisk")} {counts.brisk}</li>
        <li data-tone="mist">{v4("ornResting")} {counts.resting}</li>
      </ol>
      {reminders.length > 0 && (
        <ul className="c4-orl414-remind c4-orl414-notices" role="status" aria-label={v4("ornRemind")}>
          {reminders.map((name) => <li key={name}>{v4("ornOverdue")} {name}</li>)}
        </ul>
      )}
      <div className="c4-orl414-chart" aria-label={v4("ornChart")}>
        {bars.map((bar) => (
          <button key={bar.profile} type="button" className="c4-orl414-column" data-on={profileFilter === bar.profile ? "1" : "0"} onClick={() => setProfileFilter(profileFilter === bar.profile ? "all" : bar.profile)}>
            <i style={{ width: `${Math.max(18, Math.round((bar.count / peak) * 100))}%` }} />
            <strong>{bar.count}</strong>
            <span>{profileLabel(v4, bar.profile)}</span>
          </button>
        ))}
      </div>
      <form className="c4-orl414-form" onSubmit={(event) => { event.preventDefault(); saveCard(); }}>
        <label className="c4-lab">{v4("ornEdit")}<input ref={titleRef} className="c4-field" aria-label={v4("ornEdit")} value={title} maxLength={48} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("ornNote")}<input className="c4-field" aria-label={v4("ornNote")} aria-required={false} value={note} maxLength={80} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("ornHand")}<input className="c4-field" aria-label={v4("ornHand")} aria-required={false} value={hand} maxLength={24} disabled={viewer} onChange={(event) => setHand(event.target.value)} /></label>
        <label className="c4-lab">{v4("ornProfile")}<select className="c4-field" aria-label={v4("ornProfile")} value={profile} disabled={viewer} onChange={(event) => setProfile(event.target.value)}><option value="">{v4("ornBlankProfile")}</option>{ORL_PROFILES.map((item) => <option key={item} value={item}>{profileLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("ornBed")}<select className="c4-field" aria-label={v4("ornBed")} value={bed} disabled={viewer} onChange={(event) => setBed(event.target.value)}><option value="">{v4("ornAll")}</option>{BEDS.map((item) => <option key={item} value={item}>{bedLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("ornHour")}<select className="c4-field" aria-label={v4("ornHour")} value={hourNo} disabled={viewer} onChange={(event) => setHourNo(event.target.value)}><option value="">{v4("ornAll")}</option>{HOURS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("ornDepth")}<select className="c4-field" aria-label={v4("ornDepth")} value={depthNo} disabled={viewer} onChange={(event) => setDepthNo(event.target.value)}><option value="">{v4("ornAll")}</option>{DEPTHS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("ornTag")}<input className="c4-field" aria-label={v4("ornTag")} aria-required={false} value={tags} maxLength={8} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("ornAdd")}</button>
      </form>
      <div className="c4-orl414-tools">
        <input ref={searchRef} className="c4-field c4-orl414-search" aria-label={v4("ornSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("ornSearch")} />
        {(["base", "press", "shelf"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={rack === item ? "1" : "0"} onClick={() => setRack(item)}>{v4(item === "base" ? "ornYard" : item === "press" ? "ornPress" : "ornShelf")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={profileFilter === "warm" ? "1" : "0"} onClick={() => setProfileFilter(profileFilter === "warm" ? "all" : "warm")}>{v4("ornWarm")}</button>
        <button type="button" className="c4-chip" data-on={profileFilter === "cool" ? "1" : "0"} onClick={() => setProfileFilter(profileFilter === "cool" ? "all" : "cool")}>{v4("ornCool")}</button>
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
        <button type="button" className="c4-chip" data-on={sort === "hand" ? "1" : "0"} onClick={() => setSort(sort === "hand" ? "profile" : "hand")}>{sort === "hand" ? v4("ornSortHand") : v4("ornSortProfile")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "tight" ? "open" : "tight")}>{density === "tight" ? v4("ornTight") : v4("ornOpenDensity")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("ornTimeline")}</button>
        <label className="c4-lab">{v4("ornDesk")}<select className="c4-field" aria-label={v4("ornDesk")} value={station} onChange={(event) => setStation(event.target.value)}>{ORL_PROFILES.map((item) => <option key={item} value={item}>{profileLabel(v4, item)}</option>)}</select></label>
      </div>
      <form className="c4-orl414-view" onSubmit={(event) => {
        event.preventDefault();
        const id = `v${Date.now().toString(36)}`;
        storeViews(addOrillonView(views, { id, name: viewName, rack, query, hand: handFilter, bed: bedFilter, profile: profileFilter, hour: hourFilter, depth: depthFilter }));
        setViewName("");
      }}>
        <label className="c4-lab">{v4("ornViewName")}<input className="c4-field" aria-label={v4("ornViewName")} aria-required={false} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn">{v4("ornSaveView")}</button>
      </form>
      <ul className="c4-orl414-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setRack(view.rack); setQuery(view.query); setHandFilter(view.hand); setBedFilter(view.bed); setProfileFilter(view.profile); setHourFilter(view.hour); setDepthFilter(view.depth); }}>{v4("ornApply")} {view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropOrillonView(views, view.id))}>{v4("ornDropView")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-orl414-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkOrillonRaise(cards, picked))}>{v4("ornBulkRaise")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkOrillonShelf(cards, picked))}>{v4("ornBulkArchive")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkOrillonLinen(cards, picked))}>{v4("ornBulkLinen")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkOrillonTag(cards, picked))}>{v4("ornBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("orillon-courses.csv", orillonCsv(shown, station))}>{v4("ornCsv")}</button>
        <p className="c4-orl414-meta">{v4("ornKeys")} / c x a j k · {v4("ornQuiet")} {counts.quiet} · {v4("ornWarm")} {counts.warm}</p>
      </div>
      {board === "timeline" && (
        <ol className="c4-orl414-time" aria-label={v4("ornTimeline")}>
          {timeline.map((row) => <li key={row.hour}><span>{row.hour}</span> {row.titles.join(", ")}</li>)}
        </ol>
      )}
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("ornEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-orl414-list">
          {shown.map((card) => {
            const late = lateOrillon(card, station);
            return (
              <li key={card.id} className="c4-orl414-card" data-on={focused?.id === card.id ? "1" : "0"} data-late={late ? "1" : "0"} data-idle={idleOrillon(card) ? "1" : "0"} data-brisk={briskOrillon(card) ? "1" : "0"} data-overdue={overdueOrillon(card) ? "1" : "0"} data-resting={restingOrillon(card) ? "1" : "0"} data-warm={profileWarm(card.profile) ? "1" : "0"} data-cool={profileCool(card.profile) ? "1" : "0"} data-quiet={ivoryQuiet(card.bed) ? "1" : "0"}>
                <label className="c4-orl414-pick">
                  <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                </label>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editOrillon(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("ornEdit")} value={draft} maxLength={48} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("ornApply")}</button>
                    </form>
                  ) : <p>{card.title}</p>}
                  <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editOrillonNote(cards, card.id, noteId === card.id ? noteDraft : card.note)); }}>
                    <input className="c4-field" aria-label={v4("ornNote")} aria-required={false} value={noteId === card.id ? noteDraft : card.note} maxLength={80} disabled={viewer} onChange={(event) => { setNoteId(card.id); setNoteDraft(event.target.value); }} onFocus={() => { setNoteId(card.id); setNoteDraft(card.note); }} />
                  </form>
                  <p className="c4-orl414-meta">{profileLabel(v4, card.profile)} · {bedLabel(v4, card.bed)} · {card.hour ?? "—"} · {card.depth} · {card.hand || "—"} · {card.tags.join(" ") || "—"}{card.audit ? ` · ${v4(AUDIT_KEY[card.audit] || "ornAuditSave")}` : ""}{late ? ` · ${v4("ornOverdue")}` : ""}</p>
                </div>
                <div className="c4-orl414-actions">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("ornEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setOrillonRaised(cards, card.id, !card.raised))}>{card.raised ? v4("ornFree") : v4("ornRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setOrillonBed(cards, card.id, suggestedBed))}>{v4("ornSuggest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setOrillonRack(cards, card.id, !card.pressed))}>{card.pressed ? v4("ornUnpress") : v4("ornPressIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setOrillonShelf(cards, card.id, !card.shelved))}>{card.shelved ? v4("ornUnshelf") : v4("ornShelfIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setOrillonPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("ornUnpin") : v4("ornPin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addOrillonTag(cards, card.id, "o"))}>{v4("ornTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHourFocused(cards, card.id))}>{v4("ornRaiseHour")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHourFocused(cards, card.id))}>{v4("ornLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseDepthFocused(cards, card.id))}>{v4("ornDepth")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerDepthFocused(cards, card.id))}>{v4("ornDepth")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bedFocused(cards, card.id))}>{v4("ornBed")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setOrillonFocused(cards, card.id))}>{v4("ornRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(rackOrillonFocused(cards, card.id))}>{v4("ornPress")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(pinOrillonFocused(cards, card.id))}>{v4("ornPin")}</button>
                  <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(orillonCopy(card))}>{v4("ornCopy")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

type GroupUser = { id?: string; name?: string | null; documentsStatus?: unknown };

export function CrossettePlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: GroupUser[] }>("/api/admin/users?take=24&meta=0");
  const [mail, setMail] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<CrossetteShape>("all");
  const [review, setReview] = useState<CrossetteReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): CrossetteRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      userId: id,
      code: crossetteSlice(row),
    };
  }).filter((row): row is CrossetteRow => Boolean(row));
  const present = presentCrossetteLanes(rows);
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
    const next = readHiddenCrossette(readJson(XST_HIDE_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(XST_HIDE_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedCrossette(readJson(XST_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(XST_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleCrossetteLanes(present, hidden, showHidden);
  const shown = visibleCrossette(rows, lanes.includes(mail) || mail === "all" ? mail : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = crossetteLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = crossetteLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingCrossette(rows);
  const leadHue = leadingCrossetteHue(rows);
  const whole = rows.filter((row) => crossetteLane(row.code)).length;
  const share = crossetteShare(laneCrossetteCount(rows, "live"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("crossette-document-lanes.csv", crossetteLanesCsv(rows));
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
    writeJson(XST_HIDE_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(XST_REVIEW_KEY, next);
  }

  return (
    <section className="c4-xst414" aria-label={v4("xstTitle")} data-xst414="1" data-role={role} data-documents="1">
      <header className="c4-xst414-mast">
        <p className="c4-xst414-seal" data-logo="mono">{v4("xstLogo")}</p>
        <div>
          <p className="c4-xst414-kicker">{v4("xstSub")}</p>
          <h2 className="c4-title">{v4("xstTitle")}</h2>
        </div>
        <p className="c4-xst414-count">{shown.length}</p>
      </header>
      <p className="c4-xst414-links">
        <Link href={crmv4Href(base, "orl")}>{v4("ornTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("xstCustomer")}</Link>
      </p>
      <p className="c4-xst414-hint">{v4("xstHint")}</p>
      {viewer && <p className="c4-xst414-note">{v4("xstViewer")}</p>}
      {queue.loading && <p className="c4-xst414-meta">{v4("xstLoading")}</p>}
      {queue.error && <p className="c4-xst414-meta">{v4("xstFailed")}</p>}
      <p className="c4-xst414-meta">{v4("xstLead")} {laneLabel(v4, lead)} · {v4("xstToneLead")} {hueLabel(v4, leadHue)} · {v4("xstShare")} {share}</p>
      <div className="c4-xst414-chart" aria-label={v4("xstChart")}>
        {lines.map((line) => (
          <button key={line.mail} type="button" className="c4-xst414-column" data-on={mail === line.mail ? "1" : "0"} data-lang={line.mail} onClick={() => setMail(mail === line.mail ? "all" : line.mail)}>
            <i style={{ width: `${Math.max(18, Math.round((line.count / peak) * 100))}%` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.mail)}</span>
          </button>
        ))}
      </div>
      <div className="c4-xst414-tools">
        <input ref={searchRef} className="c4-field c4-xst414-search" aria-label={v4("xstSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("xstSearch")} />
        <label className="c4-lab">{v4("xstChart")}<select className="c4-field" aria-label={v4("xstChart")} value={shape} onChange={(event) => setShape(event.target.value as CrossetteShape)}>{(Object.keys(SHAPE_KEY) as CrossetteShape[]).map((item) => <option key={item} value={item}>{v4(SHAPE_KEY[item])}</option>)}</select></label>
        <button type="button" className="c4-chip" data-on={hue === "gilt" ? "1" : "0"} onClick={() => setHue(hue === "gilt" ? "all" : "gilt")}>{v4("xstGilt")}</button>
        <button type="button" className="c4-chip" data-on={hue === "pearl" ? "1" : "0"} onClick={() => setHue(hue === "pearl" ? "all" : "pearl")}>{v4("xstPearl")}</button>
        <button type="button" className="c4-chip" data-on={hue === "ash" ? "1" : "0"} onClick={() => setHue(hue === "ash" ? "all" : "ash")}>{v4("xstAsh")}</button>
        <button type="button" className="c4-chip" data-on={review === "fresh" ? "1" : "0"} onClick={() => setReview(review === "fresh" ? "all" : "fresh")}>{v4("xstFresh")}</button>
        <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} onClick={() => setReview(review === "reviewed" ? "all" : "reviewed")}>{v4("xstReviewed")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((on) => !on)}>{v4("xstShow")}</button>
        {present.map((lane) => (
          <button key={lane} type="button" className="c4-chip" data-on={hidden.includes(lane) ? "1" : "0"} onClick={() => storeHidden(toggleCrossette(hidden, lane))}>{v4("xstHide")} {laneLabel(v4, lane)}</button>
        ))}
      </div>
      <div className="c4-xst414-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkCrossetteReview(reviewed, picked, true))}>{v4("xstBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkCrossetteReview(reviewed, picked, false))}>{v4("xstBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("crossette-document-rows.csv", crossetteRowsCsv(shown, reviewed))}>{v4("xstRowCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("crossette-document-marks.csv", crossetteLanesCsv(rows))}>{v4("xstCsv")}</button>
      </div>
      {!shown.length && !queue.loading && <p className="c4-pay-empty">{v4("xstEmpty")}</p>}
      <ul className="c4-xst414-list">
        {shown.map((row) => {
          const tone = crossetteHue(row.code);
          const name = crossetteCopy(row.code);
          return (
            <li key={row.id} className="c4-xst414-card" data-mail={crossetteLane(row.code) || "open"} data-hue={tone || "none"} data-lit={crossetteLit(row.code) ? "1" : "0"} data-figure={crossetteNear(row.code) ? "1" : "0"} data-short={crossetteFar(row.code) ? "1" : "0"} data-long={crossetteFade(row.code) ? "1" : "0"} data-dark={crossetteDark(row.code) ? "1" : "0"} data-dim={crossetteDim(row.code) ? "1" : "0"} data-blank={crossetteBlank(row.code) ? "1" : "0"} data-open={crossetteOpen(row.code) ? "1" : "0"} data-even={crossetteEven(row.code) ? "1" : "0"} data-digit={crossetteDigit(row.code) ? "1" : "0"} data-letter={crossetteLetter(row.code) ? "1" : "0"} data-upper={crossetteUpper(row.code) ? "1" : "0"}>
              <label className="c4-xst414-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-xst414-meta">{name || v4("xstOpen")} · {crossetteStamp(row.code) || "—"} · {crossetteLength(row.code) ?? "—"} · {laneLabel(v4, crossetteLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-xst414-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleCrossetteReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("xstReviewed") : v4("xstReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { navigator.clipboard?.writeText(crossetteCopy(row.code)); setCopied(row.id); }}>{copied === row.id ? v4("xstCopied") : v4("xstCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.userId || row.id}`)}>{v4("xstCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
