"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  CVT_HIDE_KEY,
  CVT_REVIEW_KEY,
  OGE_DENSITY_KEY,
  OGE_KEY,
  OGE_PROFILES,
  OGE_VIEW_KEY,
  addOgee,
  addOgeeTag,
  addOgeeView,
  bedFocused,
  briskOgee,
  bulkHollowReview,
  bulkOgeeLinen,
  bulkOgeeLoft,
  bulkOgeeRaise,
  bulkOgeeTag,
  busiestHand,
  dropOgeeView,
  editOgee,
  editOgeeNote,
  fairHand,
  hollowBlank,
  hollowCopy,
  hollowDigit,
  hollowEven,
  hollowFar,
  hollowHue,
  hollowLane,
  hollowLanes,
  hollowLanesCsv,
  hollowLength,
  hollowLetter,
  hollowDark,
  hollowDim,
  hollowFade,
  hollowLit,
  hollowOpen,
  hollowRowsCsv,
  hollowShare,
  hollowStamp,
  hollowNear,
  hollowUpper,
  idleOgee,
  laneHollowCount,
  lateOgee,
  leadingHollow,
  leadingHollowHue,
  linenQuiet,
  lowerDepthFocused,
  lowerHourFocused,
  moveOgeeFocus,
  ogeeBars,
  ogeeCopy,
  ogeeCounts,
  ogeeCsv,
  ogeeDensity,
  ogeeHands,
  ogeeTimeline,
  overdueOgee,
  pinOgeeFocused,
  presentHollowLanes,
  profileCool,
  profileWarm,
  rackOgeeFocused,
  raiseDepthFocused,
  raiseHourFocused,
  readHiddenHollow,
  readReviewedHollow,
  readOgeeViews,
  readOgeeList,
  reminderOgeeList,
  restingOgee,
  setOgeeFocused,
  setOgeeBed,
  setOgeePin,
  setOgeeRack,
  setOgeeRaised,
  setOgeeLoft,
  sortOgeeList,
  suggestProfile,
  suggestOgeeBed,
  suggestOgeeHour,
  toggleHollow,
  toggleHollowReview,
  visibleHollow,
  visibleHollowLanes,
  visibleOgeeList,
  type HollowReview,
  type HollowRow,
  type HollowShape,
  type HollowValue,
  type Ogee,
  type OgeeDensity,
  type OgeeRack,
  type OgeeSort,
  type OgeeView,
} from "@/lib/crmv4/round390";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const BEDS = ["LINEN", "SLATE", "GILT"] as const;
const HOURS = ["2", "6", "10", "14"] as const;
const DEPTHS = ["2", "4", "8"] as const;

const PROFILE_KEY: Record<string, CrmV4CopyKey> = {
  ogee: "ogeOgee",
  cyma: "ogeCyma",
  scotia: "ogeScotia",
  torus: "ogeTorus",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "ogeAuditSave",
  edit: "ogeAuditEdit",
  note: "ogeAuditNote",
  bed: "ogeAuditBed",
  raise: "ogeAuditRaise",
  free: "ogeAuditFree",
  kiln: "ogeAuditKiln",
  return: "ogeAuditReturn",
  loft: "ogeAuditLoft",
  open: "ogeAuditOpen",
  tag: "ogeAuditTag",
  depth: "ogeAuditDepth",
  hour: "ogeAuditHour",
  lower: "ogeAuditLower",
  pin: "ogeAuditPin",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  due: "cvtLaneDue",
  soon: "cvtLaneSoon",
  far: "cvtLaneFar",
  late: "cvtLaneLate",
  missed: "cvtLaneMissed",
  hold: "cvtLaneHold",
  blank: "cvtLaneBlank",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  gilt: "cvtGilt",
  pearl: "cvtPearl",
  ash: "cvtAsh",
};

const SHAPE_KEY: Record<HollowShape, CrmV4CopyKey> = {
  all: "cvtShapeAll",
  due: "cvtShapeDue",
  soon: "cvtShapeSoon",
  far: "cvtShapeFar",
  late: "cvtShapeLate",
  missed: "cvtShapeMissed",
  hold: "cvtShapeHold",
  blank: "cvtShapeBlank",
  open: "cvtShapeOpen",
  digit: "cvtShapeDigit",
  letter: "cvtShapeLetter",
  even: "cvtShapeEven",
  upper: "cvtShapeUpper",
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
  return key ? v4(key) : v4("ogeBlankProfile");
}

function bedLabel(v4: V4, bed: string): string {
  if (bed === "LINEN") return v4("ogeLinen");
  if (bed === "SLATE") return v4("ogeSlate");
  if (bed === "GILT") return v4("ogeGilt");
  return v4("ogeAll");
}

function laneLabel(v4: V4, mail: string): string {
  const key = LANE_KEY[mail];
  return key ? v4(key) : v4("cvtBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("cvtBlank");
}

export function OgeeScrolls({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Ogee[]>([]);
  const [views, setViews] = useState<OgeeView[]>([]);
  const [density, setDensity] = useState<OgeeDensity>("open");
  const [rack, setRack] = useState<OgeeRack>("bench");
  const [query, setQuery] = useState("");
  const [handFilter, setHandFilter] = useState("");
  const [bedFilter, setBedFilter] = useState("all");
  const [profileFilter, setProfileFilter] = useState("all");
  const [hourFilter, setHourFilter] = useState("all");
  const [depthFilter, setDepthFilter] = useState("all");
  const [sort, setSort] = useState<OgeeSort>("profile");
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
  const [station, setStation] = useState("ogee");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readOgeeList(readJson(OGE_KEY, [])));
    setViews(readOgeeViews(readJson(OGE_VIEW_KEY, [])));
    setDensity(ogeeDensity(readJson(OGE_DENSITY_KEY, "open")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Ogee[]) {
    setCards(next);
    writeJson(OGE_KEY, next);
  }
  function storeViews(next: OgeeView[]) {
    setViews(next);
    writeJson(OGE_VIEW_KEY, next);
  }
  function storeDensity(next: OgeeDensity) {
    setDensity(next);
    writeJson(OGE_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortOgeeList(visibleOgeeList(cards, rack, query, handFilter, bedFilter, profileFilter, hourFilter, depthFilter), sort),
    [cards, rack, query, handFilter, bedFilter, profileFilter, hourFilter, depthFilter, sort],
  );
  const counts = ogeeCounts(cards, shown, station);
  const bars = ogeeBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = ogeeTimeline(cards);
  const reminders = reminderOgeeList(cards);
  const hands = ogeeHands(cards);
  const busy = busiestHand(cards);
  const fair = fairHand(cards, hands.join(","));
  const suggestedBed = suggestOgeeBed(cards);
  const suggestedHour = suggestOgeeHour(cards, clock);
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
        download("ogee.csv", ogeeCsv(shown, station));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((card) => card.id));
        return;
      }
      if (event.key === "j" || event.key === "J") setFocusAt((index) => moveOgeeFocus(index, shown.length, 1));
      if (event.key === "k" || event.key === "K") setFocusAt((index) => moveOgeeFocus(index, shown.length, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, shown, station]);

  function saveCard() {
    if (viewer) return;
    store(addOgee(cards, { title, note, hand, profile, hour: hourNo, bed, depth: depthNo, tags }));
    setTitle("");
    setNote("");
    setTags("");
  }

  return (
    <section className="c4-ogee" aria-label={v4("ogeTitle")} data-ogee="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-ogee-mast">
        <p className="c4-ogee-seal" data-logo="mono">{v4("ogeLogo")}</p>
        <div>
          <p className="c4-ogee-kicker">{v4("ogeSub")}</p>
          <h2 className="c4-title">{v4("ogeTitle")}</h2>
        </div>
        <p className="c4-ogee-count">{shown.length}</p>
      </header>
      <p className="c4-ogee-links">
        <Link href={crmv4Href(base, "cvt")}>{v4("cvtTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("ogeCustomers")}</Link>
      </p>
      <p className="c4-ogee-hint">{v4("ogeHint")}</p>
      {viewer && <p className="c4-ogee-note">{v4("ogeViewer")}</p>}
      <p className="c4-ogee-meta">{v4("ogeFair")} {fair || "—"} · {v4("ogeBusy")} {busy || "—"} · {v4("ogeSuggest")} {profileLabel(v4, suggestedProfile)} · {bedLabel(v4, suggestedBed)} · {suggestedHour}</p>
      <ol className="c4-ogee-index" aria-label={v4("ogeRemind")}>
        <li data-tone="gold">{v4("ogeOverdue")} {counts.overdue}</li>
        <li data-tone="pitch">{v4("ogeIdle")} {counts.idle}</li>
        <li data-tone="mist">{v4("ogeBrisk")} {counts.brisk}</li>
        <li data-tone="mist">{v4("ogeResting")} {counts.resting}</li>
      </ol>
      {reminders.length > 0 && (
        <ul className="c4-ogee-remind c4-ogee-notices" role="status" aria-label={v4("ogeRemind")}>
          {reminders.map((name) => <li key={name}>{v4("ogeOverdue")} {name}</li>)}
        </ul>
      )}
      <div className="c4-ogee-chart" aria-label={v4("ogeChart")}>
        {bars.map((bar) => (
          <button key={bar.profile} type="button" className="c4-ogee-column" data-on={profileFilter === bar.profile ? "1" : "0"} onClick={() => setProfileFilter(profileFilter === bar.profile ? "all" : bar.profile)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / peak) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{profileLabel(v4, bar.profile)}</span>
          </button>
        ))}
      </div>
      <form className="c4-ogee-form" onSubmit={(event) => { event.preventDefault(); saveCard(); }}>
        <label className="c4-lab">{v4("ogeEdit")}<input ref={titleRef} className="c4-field" aria-label={v4("ogeEdit")} value={title} maxLength={48} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("ogeNote")}<input className="c4-field" aria-label={v4("ogeNote")} aria-required={false} value={note} maxLength={80} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("ogeHand")}<input className="c4-field" aria-label={v4("ogeHand")} aria-required={false} value={hand} maxLength={24} disabled={viewer} onChange={(event) => setHand(event.target.value)} /></label>
        <label className="c4-lab">{v4("ogeProfile")}<select className="c4-field" aria-label={v4("ogeProfile")} value={profile} disabled={viewer} onChange={(event) => setProfile(event.target.value)}><option value="">{v4("ogeBlankProfile")}</option>{OGE_PROFILES.map((item) => <option key={item} value={item}>{profileLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("ogeBed")}<select className="c4-field" aria-label={v4("ogeBed")} value={bed} disabled={viewer} onChange={(event) => setBed(event.target.value)}><option value="">{v4("ogeAll")}</option>{BEDS.map((item) => <option key={item} value={item}>{bedLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("ogeHour")}<select className="c4-field" aria-label={v4("ogeHour")} value={hourNo} disabled={viewer} onChange={(event) => setHourNo(event.target.value)}><option value="">{v4("ogeAll")}</option>{HOURS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("ogeDepth")}<select className="c4-field" aria-label={v4("ogeDepth")} value={depthNo} disabled={viewer} onChange={(event) => setDepthNo(event.target.value)}><option value="">{v4("ogeAll")}</option>{DEPTHS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("ogeTag")}<input className="c4-field" aria-label={v4("ogeTag")} aria-required={false} value={tags} maxLength={8} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("ogeAdd")}</button>
      </form>
      <div className="c4-ogee-tools">
        <input ref={searchRef} className="c4-field c4-ogee-search" aria-label={v4("ogeSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("ogeSearch")} />
        {(["bench", "kiln", "loft"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={rack === item ? "1" : "0"} onClick={() => setRack(item)}>{v4(item === "bench" ? "ogeBench" : item === "kiln" ? "ogeKiln" : "ogeLoft")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={profileFilter === "warm" ? "1" : "0"} onClick={() => setProfileFilter(profileFilter === "warm" ? "all" : "warm")}>{v4("ogeWarm")}</button>
        <button type="button" className="c4-chip" data-on={profileFilter === "cool" ? "1" : "0"} onClick={() => setProfileFilter(profileFilter === "cool" ? "all" : "cool")}>{v4("ogeCool")}</button>
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
        <button type="button" className="c4-chip" data-on={sort === "hand" ? "1" : "0"} onClick={() => setSort(sort === "hand" ? "profile" : "hand")}>{sort === "hand" ? v4("ogeSortHand") : v4("ogeSortProfile")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "tight" ? "open" : "tight")}>{density === "tight" ? v4("ogeTight") : v4("ogeOpenDensity")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("ogeTimeline")}</button>
        <label className="c4-lab">{v4("ogeDesk")}<select className="c4-field" aria-label={v4("ogeDesk")} value={station} onChange={(event) => setStation(event.target.value)}>{OGE_PROFILES.map((item) => <option key={item} value={item}>{profileLabel(v4, item)}</option>)}</select></label>
      </div>
      <form className="c4-ogee-view" onSubmit={(event) => {
        event.preventDefault();
        const id = `v${Date.now().toString(36)}`;
        storeViews(addOgeeView(views, { id, name: viewName, rack, query, hand: handFilter, bed: bedFilter, profile: profileFilter, hour: hourFilter, depth: depthFilter }));
        setViewName("");
      }}>
        <label className="c4-lab">{v4("ogeViewName")}<input className="c4-field" aria-label={v4("ogeViewName")} aria-required={false} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn">{v4("ogeSaveView")}</button>
      </form>
      <ul className="c4-ogee-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setRack(view.rack); setQuery(view.query); setHandFilter(view.hand); setBedFilter(view.bed); setProfileFilter(view.profile); setHourFilter(view.hour); setDepthFilter(view.depth); }}>{v4("ogeApply")} {view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropOgeeView(views, view.id))}>{v4("ogeDropView")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-ogee-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkOgeeRaise(cards, picked))}>{v4("ogeBulkRaise")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkOgeeLoft(cards, picked))}>{v4("ogeBulkArchive")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkOgeeLinen(cards, picked))}>{v4("ogeBulkLinen")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkOgeeTag(cards, picked))}>{v4("ogeBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("ogee.csv", ogeeCsv(shown, station))}>{v4("ogeCsv")}</button>
        <p className="c4-ogee-meta">{v4("ogeKeys")} / c x a j k · {v4("ogeQuiet")} {counts.quiet} · {v4("ogeWarm")} {counts.warm}</p>
      </div>
      {board === "timeline" && (
        <ol className="c4-ogee-time" aria-label={v4("ogeTimeline")}>
          {timeline.map((row) => <li key={row.hour}><span>{row.hour}</span> {row.titles.join(", ")}</li>)}
        </ol>
      )}
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("ogeEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-ogee-list">
          {shown.map((card) => {
            const late = lateOgee(card, station);
            return (
              <li key={card.id} className="c4-ogee-card" data-on={focused?.id === card.id ? "1" : "0"} data-late={late ? "1" : "0"} data-idle={idleOgee(card) ? "1" : "0"} data-brisk={briskOgee(card) ? "1" : "0"} data-overdue={overdueOgee(card) ? "1" : "0"} data-resting={restingOgee(card) ? "1" : "0"} data-warm={profileWarm(card.profile) ? "1" : "0"} data-cool={profileCool(card.profile) ? "1" : "0"} data-quiet={linenQuiet(card.bed) ? "1" : "0"}>
                <label className="c4-ogee-pick">
                  <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                </label>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editOgee(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("ogeEdit")} value={draft} maxLength={48} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("ogeApply")}</button>
                    </form>
                  ) : <p>{card.title}</p>}
                  <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editOgeeNote(cards, card.id, noteId === card.id ? noteDraft : card.note)); }}>
                    <input className="c4-field" aria-label={v4("ogeNote")} aria-required={false} value={noteId === card.id ? noteDraft : card.note} maxLength={80} disabled={viewer} onChange={(event) => { setNoteId(card.id); setNoteDraft(event.target.value); }} onFocus={() => { setNoteId(card.id); setNoteDraft(card.note); }} />
                  </form>
                  <p className="c4-ogee-meta">{profileLabel(v4, card.profile)} · {bedLabel(v4, card.bed)} · {card.hour ?? "—"} · {card.depth} · {card.hand || "—"} · {card.tags.join(" ") || "—"}{card.audit ? ` · ${v4(AUDIT_KEY[card.audit] || "ogeAuditSave")}` : ""}{late ? ` · ${v4("ogeOverdue")}` : ""}</p>
                </div>
                <div className="c4-ogee-actions">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("ogeEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setOgeeRaised(cards, card.id, !card.raised))}>{card.raised ? v4("ogeFree") : v4("ogeRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setOgeeBed(cards, card.id, suggestedBed))}>{v4("ogeSuggest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setOgeeRack(cards, card.id, !card.kilned))}>{card.kilned ? v4("ogeUnkiln") : v4("ogeKilnIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setOgeeLoft(cards, card.id, !card.lofted))}>{card.lofted ? v4("ogeUnloft") : v4("ogeLoftIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setOgeePin(cards, card.id, !card.pinned))}>{card.pinned ? v4("ogeUnpin") : v4("ogePin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addOgeeTag(cards, card.id, "r"))}>{v4("ogeTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHourFocused(cards, card.id))}>{v4("ogeRaiseHour")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHourFocused(cards, card.id))}>{v4("ogeLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseDepthFocused(cards, card.id))}>{v4("ogeDepth")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerDepthFocused(cards, card.id))}>{v4("ogeDepth")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bedFocused(cards, card.id))}>{v4("ogeBed")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setOgeeFocused(cards, card.id))}>{v4("ogeRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(rackOgeeFocused(cards, card.id))}>{v4("ogeKiln")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(pinOgeeFocused(cards, card.id))}>{v4("ogePin")}</button>
                  <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(ogeeCopy(card))}>{v4("ogeCopy")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

type GroupUser = { id?: string; name?: string | null; tradingGroup?: string | null };

export function CavettoHollows({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: GroupUser[] }>("/api/admin/users?take=24&meta=0");
  const [mail, setMail] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<HollowShape>("all");
  const [review, setReview] = useState<HollowReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): HollowRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      userId: id,
      code: { tradingGroup: textField(row.tradingGroup) } satisfies HollowValue,
    };
  }).filter((row): row is HollowRow => Boolean(row));
  const present = presentHollowLanes(rows);
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
    const next = readHiddenHollow(readJson(CVT_HIDE_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(CVT_HIDE_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedHollow(readJson(CVT_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(CVT_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleHollowLanes(present, hidden, showHidden);
  const shown = visibleHollow(rows, lanes.includes(mail) || mail === "all" ? mail : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = hollowLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = hollowLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingHollow(rows);
  const leadHue = leadingHollowHue(rows);
  const whole = rows.filter((row) => hollowLane(row.code)).length;
  const share = hollowShare(laneHollowCount(rows, "due"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("cavetto-lanes.csv", hollowLanesCsv(rows));
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
    writeJson(CVT_HIDE_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(CVT_REVIEW_KEY, next);
  }

  return (
    <section className="c4-cavetto" aria-label={v4("cvtTitle")} data-cavetto="1" data-role={role} data-names="1">
      <header className="c4-cavetto-mast">
        <p className="c4-cavetto-seal" data-logo="mono">{v4("cvtLogo")}</p>
        <div>
          <p className="c4-cavetto-kicker">{v4("cvtSub")}</p>
          <h2 className="c4-title">{v4("cvtTitle")}</h2>
        </div>
        <p className="c4-cavetto-count">{shown.length}</p>
      </header>
      <p className="c4-cavetto-links">
        <Link href={crmv4Href(base, "oge")}>{v4("ogeTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("cvtCustomer")}</Link>
      </p>
      <p className="c4-cavetto-hint">{v4("cvtHint")}</p>
      {viewer && <p className="c4-cavetto-note">{v4("cvtViewer")}</p>}
      {queue.loading && <p className="c4-cavetto-meta">{v4("cvtLoading")}</p>}
      {queue.error && <p className="c4-cavetto-meta">{v4("cvtFailed")}</p>}
      <p className="c4-cavetto-meta">{v4("cvtLead")} {laneLabel(v4, lead)} · {v4("cvtToneLead")} {hueLabel(v4, leadHue)} · {v4("cvtShare")} {share}</p>
      <div className="c4-cavetto-chart" aria-label={v4("cvtChart")}>
        {lines.map((line) => (
          <button key={line.mail} type="button" className="c4-cavetto-column" data-on={mail === line.mail ? "1" : "0"} data-lang={line.mail} onClick={() => setMail(mail === line.mail ? "all" : line.mail)}>
            <i style={{ height: `${Math.max(12, Math.round((line.count / peak) * 72))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.mail)}</span>
          </button>
        ))}
      </div>
      <div className="c4-cavetto-tools">
        <input ref={searchRef} className="c4-field c4-cavetto-search" aria-label={v4("cvtSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("cvtSearch")} />
        <label className="c4-lab">{v4("cvtChart")}<select className="c4-field" aria-label={v4("cvtChart")} value={shape} onChange={(event) => setShape(event.target.value as HollowShape)}>{(Object.keys(SHAPE_KEY) as HollowShape[]).map((item) => <option key={item} value={item}>{v4(SHAPE_KEY[item])}</option>)}</select></label>
        <button type="button" className="c4-chip" data-on={hue === "gilt" ? "1" : "0"} onClick={() => setHue(hue === "gilt" ? "all" : "gilt")}>{v4("cvtGilt")}</button>
        <button type="button" className="c4-chip" data-on={hue === "pearl" ? "1" : "0"} onClick={() => setHue(hue === "pearl" ? "all" : "pearl")}>{v4("cvtPearl")}</button>
        <button type="button" className="c4-chip" data-on={hue === "ash" ? "1" : "0"} onClick={() => setHue(hue === "ash" ? "all" : "ash")}>{v4("cvtAsh")}</button>
        <button type="button" className="c4-chip" data-on={review === "fresh" ? "1" : "0"} onClick={() => setReview(review === "fresh" ? "all" : "fresh")}>{v4("cvtFresh")}</button>
        <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} onClick={() => setReview(review === "reviewed" ? "all" : "reviewed")}>{v4("cvtReviewed")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((on) => !on)}>{v4("cvtShow")}</button>
        {present.map((lane) => (
          <button key={lane} type="button" className="c4-chip" data-on={hidden.includes(lane) ? "1" : "0"} onClick={() => storeHidden(toggleHollow(hidden, lane))}>{v4("cvtHide")} {laneLabel(v4, lane)}</button>
        ))}
      </div>
      <div className="c4-cavetto-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkHollowReview(reviewed, picked, true))}>{v4("cvtBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkHollowReview(reviewed, picked, false))}>{v4("cvtBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("cavetto-groups.csv", hollowRowsCsv(shown, reviewed))}>{v4("cvtRowCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("cavetto-lanes.csv", hollowLanesCsv(rows))}>{v4("cvtCsv")}</button>
      </div>
      {!shown.length && !queue.loading && <p className="c4-pay-empty">{v4("cvtEmpty")}</p>}
      <ul className="c4-cavetto-list">
        {shown.map((row) => {
          const tone = hollowHue(row.code);
          const name = hollowCopy(row.code);
          return (
            <li key={row.id} className="c4-cavetto-card" data-mail={hollowLane(row.code) || "open"} data-hue={tone || "none"} data-lit={hollowLit(row.code) ? "1" : "0"} data-near={hollowNear(row.code) ? "1" : "0"} data-far={hollowFar(row.code) ? "1" : "0"} data-fade={hollowFade(row.code) ? "1" : "0"} data-dark={hollowDark(row.code) ? "1" : "0"} data-dim={hollowDim(row.code) ? "1" : "0"} data-blank={hollowBlank(row.code) ? "1" : "0"} data-open={hollowOpen(row.code) ? "1" : "0"} data-even={hollowEven(row.code) ? "1" : "0"} data-digit={hollowDigit(row.code) ? "1" : "0"} data-letter={hollowLetter(row.code) ? "1" : "0"} data-upper={hollowUpper(row.code) ? "1" : "0"}>
              <label className="c4-cavetto-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-cavetto-meta">{name || v4("cvtOpen")} · {hollowStamp(row.code) || "—"} · {hollowLength(row.code) ?? "—"} · {laneLabel(v4, hollowLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-cavetto-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleHollowReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("cvtReviewed") : v4("cvtReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { navigator.clipboard?.writeText(hollowCopy(row.code)); setCopied(row.id); }}>{copied === row.id ? v4("cvtCopied") : v4("cvtCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.userId || row.id}`)}>{v4("cvtCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
