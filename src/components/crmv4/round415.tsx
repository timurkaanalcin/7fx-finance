"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  HCH_HIDE_KEY,
  HCH_REVIEW_KEY,
  KLS_DENSITY_KEY,
  KLS_KEY,
  KLS_PROFILES,
  KLS_VIEW_KEY,
  addKeelson,
  addKeelsonTag,
  addKeelsonView,
  bedFocused,
  briskKeelson,
  bulkHachureReview,
  bulkKeelsonLinen,
  bulkKeelsonShelf,
  bulkKeelsonRaise,
  bulkKeelsonTag,
  busiestHand,
  dropKeelsonView,
  editKeelson,
  editKeelsonNote,
  fairHand,
  hachureBlank,
  hachureCopy,
  hachureDigit,
  hachureEven,
  hachureFar,
  hachureHue,
  hachureLane,
  hachureLanes,
  hachureLanesCsv,
  hachureLength,
  hachureLetter,
  hachureDark,
  hachureDim,
  hachureFade,
  hachureLit,
  hachureOpen,
  hachureRowsCsv,
  hachureShare,
  hachureSlice,
  hachureStamp,
  hachureNear,
  hachureUpper,
  idleKeelson,
  laneHachureCount,
  lateKeelson,
  leadingHachure,
  leadingHachureHue,
  ivoryQuiet,
  lowerDepthFocused,
  lowerHourFocused,
  moveKeelsonFocus,
  keelsonBars,
  keelsonCopy,
  keelsonCounts,
  keelsonCsv,
  keelsonDensity,
  keelsonHands,
  keelsonTimeline,
  overdueKeelson,
  pinKeelsonFocused,
  presentHachureLanes,
  profileCool,
  profileWarm,
  rackKeelsonFocused,
  raiseDepthFocused,
  raiseHourFocused,
  readHiddenHachure,
  readReviewedHachure,
  readKeelsonViews,
  readKeelsonList,
  reminderKeelsonList,
  restingKeelson,
  setKeelsonFocused,
  setKeelsonBed,
  setKeelsonPin,
  setKeelsonRack,
  setKeelsonRaised,
  setKeelsonShelf,
  sortKeelsonList,
  suggestProfile,
  suggestKeelsonBed,
  suggestKeelsonHour,
  toggleHachure,
  toggleHachureReview,
  visibleHachure,
  visibleHachureLanes,
  visibleKeelsonList,
  type HachureReview,
  type HachureRow,
  type HachureShape,
  type Keelson,
  type KeelsonDensity,
  type KeelsonRack,
  type KeelsonSort,
  type KeelsonView,
} from "@/lib/crmv4/round415";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const BEDS = ["IVORY", "GRAPHITE", "GILT"] as const;
const HOURS = ["2", "5", "10", "20"] as const;
const DEPTHS = ["2", "4", "8"] as const;

const PROFILE_KEY: Record<string, CrmV4CopyKey> = {
  keelson: "klsKeelson",
  garboard: "klsGarboard",
  strake: "klsStrake",
  ribband: "klsRibband",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "klsAuditSave",
  edit: "klsAuditEdit",
  note: "klsAuditNote",
  bed: "klsAuditBed",
  raise: "klsAuditRaise",
  free: "klsAuditFree",
  press: "klsAuditPress",
  return: "klsAuditReturn",
  shelf: "klsAuditShelf",
  open: "klsAuditOpen",
  tag: "klsAuditTag",
  depth: "klsAuditDepth",
  hour: "klsAuditHour",
  lower: "klsAuditLower",
  pin: "klsAuditPin",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  live: "hchLaneLive",
  code: "hchLaneCode",
  short: "hchLaneShort",
  long: "hchLaneLong",
  hold: "hchLaneHold",
  shut: "hchLaneShut",
  blank: "hchLaneBlank",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  gilt: "hchGilt",
  pearl: "hchPearl",
  ash: "hchAsh",
};

const SHAPE_KEY: Record<HachureShape, CrmV4CopyKey> = {
  all: "hchShapeAll",
  live: "hchShapeLive",
  code: "hchShapeCode",
  short: "hchShapeShort",
  long: "hchShapeLong",
  hold: "hchShapeHold",
  shut: "hchShapeShut",
  blank: "hchShapeBlank",
  open: "hchShapeOpen",
  digit: "hchShapeDigit",
  letter: "hchShapeLetter",
  even: "hchShapeEven",
  upper: "hchShapeUpper",
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
  return key ? v4(key) : v4("klsBlankProfile");
}

function bedLabel(v4: V4, bed: string): string {
  if (bed === "IVORY") return v4("klsLinen");
  if (bed === "GRAPHITE") return v4("klsSlate");
  if (bed === "GILT") return v4("klsGilt");
  return v4("klsAll");
}

function laneLabel(v4: V4, mail: string): string {
  const key = LANE_KEY[mail];
  return key ? v4(key) : v4("hchBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("hchBlank");
}

export function KeelsonCourses({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Keelson[]>([]);
  const [views, setViews] = useState<KeelsonView[]>([]);
  const [density, setDensity] = useState<KeelsonDensity>("open");
  const [rack, setRack] = useState<KeelsonRack>("base");
  const [query, setQuery] = useState("");
  const [handFilter, setHandFilter] = useState("");
  const [bedFilter, setBedFilter] = useState("all");
  const [profileFilter, setProfileFilter] = useState("all");
  const [hourFilter, setHourFilter] = useState("all");
  const [depthFilter, setDepthFilter] = useState("all");
  const [sort, setSort] = useState<KeelsonSort>("profile");
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
  const [station, setStation] = useState("keelson");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readKeelsonList(readJson(KLS_KEY, [])));
    setViews(readKeelsonViews(readJson(KLS_VIEW_KEY, [])));
    setDensity(keelsonDensity(readJson(KLS_DENSITY_KEY, "open")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Keelson[]) {
    setCards(next);
    writeJson(KLS_KEY, next);
  }
  function storeViews(next: KeelsonView[]) {
    setViews(next);
    writeJson(KLS_VIEW_KEY, next);
  }
  function storeDensity(next: KeelsonDensity) {
    setDensity(next);
    writeJson(KLS_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortKeelsonList(visibleKeelsonList(cards, rack, query, handFilter, bedFilter, profileFilter, hourFilter, depthFilter), sort),
    [cards, rack, query, handFilter, bedFilter, profileFilter, hourFilter, depthFilter, sort],
  );
  const counts = keelsonCounts(cards, shown, station);
  const bars = keelsonBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = keelsonTimeline(cards);
  const reminders = reminderKeelsonList(cards);
  const hands = keelsonHands(cards);
  const busy = busiestHand(cards);
  const fair = fairHand(cards, hands.join(","));
  const suggestedBed = suggestKeelsonBed(cards);
  const suggestedHour = suggestKeelsonHour(cards, clock);
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
        download("keelson-courses.csv", keelsonCsv(shown, station));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((card) => card.id));
        return;
      }
      if (event.key === "j" || event.key === "J") setFocusAt((index) => moveKeelsonFocus(index, shown.length, 1));
      if (event.key === "k" || event.key === "K") setFocusAt((index) => moveKeelsonFocus(index, shown.length, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, shown, station]);

  function saveCard() {
    if (viewer) return;
    store(addKeelson(cards, { title, note, hand, profile, hour: hourNo, bed, depth: depthNo, tags }));
    setTitle("");
    setNote("");
    setTags("");
  }

  return (
    <section className="c4-kln415" aria-label={v4("klsTitle")} data-kln415="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-kln415-mast">
        <p className="c4-kln415-seal" data-logo="mono">{v4("klsLogo")}</p>
        <div>
          <p className="c4-kln415-kicker">{v4("klsSub")}</p>
          <h2 className="c4-title">{v4("klsTitle")}</h2>
        </div>
        <p className="c4-kln415-count">{shown.length}</p>
      </header>
      <p className="c4-kln415-links">
        <Link href={crmv4Href(base, "hch")}>{v4("hchTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("klsCustomers")}</Link>
      </p>
      <p className="c4-kln415-hint">{v4("klsHint")}</p>
      {viewer && <p className="c4-kln415-note">{v4("klsViewer")}</p>}
      <p className="c4-kln415-meta">{v4("klsFair")} {fair || "—"} · {v4("klsBusy")} {busy || "—"} · {v4("klsSuggest")} {profileLabel(v4, suggestedProfile)} · {bedLabel(v4, suggestedBed)} · {suggestedHour}</p>
      <ol className="c4-kln415-index" aria-label={v4("klsRemind")}>
        <li data-tone="gold">{v4("klsOverdue")} {counts.overdue}</li>
        <li data-tone="pitch">{v4("klsIdle")} {counts.idle}</li>
        <li data-tone="mist">{v4("klsBrisk")} {counts.brisk}</li>
        <li data-tone="mist">{v4("klsResting")} {counts.resting}</li>
      </ol>
      {reminders.length > 0 && (
        <ul className="c4-kln415-remind c4-kln415-notices" role="status" aria-label={v4("klsRemind")}>
          {reminders.map((name) => <li key={name}>{v4("klsOverdue")} {name}</li>)}
        </ul>
      )}
      <div className="c4-kln415-chart" aria-label={v4("klsChart")}>
        {bars.map((bar) => (
          <button key={bar.profile} type="button" className="c4-kln415-column" data-on={profileFilter === bar.profile ? "1" : "0"} onClick={() => setProfileFilter(profileFilter === bar.profile ? "all" : bar.profile)}>
            <i style={{ width: `${Math.max(18, Math.round((bar.count / peak) * 100))}%` }} />
            <strong>{bar.count}</strong>
            <span>{profileLabel(v4, bar.profile)}</span>
          </button>
        ))}
      </div>
      <form className="c4-kln415-form" onSubmit={(event) => { event.preventDefault(); saveCard(); }}>
        <label className="c4-lab">{v4("klsEdit")}<input ref={titleRef} className="c4-field" aria-label={v4("klsEdit")} value={title} maxLength={48} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("klsNote")}<input className="c4-field" aria-label={v4("klsNote")} aria-required={false} value={note} maxLength={80} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("klsHand")}<input className="c4-field" aria-label={v4("klsHand")} aria-required={false} value={hand} maxLength={24} disabled={viewer} onChange={(event) => setHand(event.target.value)} /></label>
        <label className="c4-lab">{v4("klsProfile")}<select className="c4-field" aria-label={v4("klsProfile")} value={profile} disabled={viewer} onChange={(event) => setProfile(event.target.value)}><option value="">{v4("klsBlankProfile")}</option>{KLS_PROFILES.map((item) => <option key={item} value={item}>{profileLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("klsBed")}<select className="c4-field" aria-label={v4("klsBed")} value={bed} disabled={viewer} onChange={(event) => setBed(event.target.value)}><option value="">{v4("klsAll")}</option>{BEDS.map((item) => <option key={item} value={item}>{bedLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("klsHour")}<select className="c4-field" aria-label={v4("klsHour")} value={hourNo} disabled={viewer} onChange={(event) => setHourNo(event.target.value)}><option value="">{v4("klsAll")}</option>{HOURS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("klsDepth")}<select className="c4-field" aria-label={v4("klsDepth")} value={depthNo} disabled={viewer} onChange={(event) => setDepthNo(event.target.value)}><option value="">{v4("klsAll")}</option>{DEPTHS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("klsTag")}<input className="c4-field" aria-label={v4("klsTag")} aria-required={false} value={tags} maxLength={8} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("klsAdd")}</button>
      </form>
      <div className="c4-kln415-tools">
        <input ref={searchRef} className="c4-field c4-kln415-search" aria-label={v4("klsSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("klsSearch")} />
        {(["base", "press", "shelf"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={rack === item ? "1" : "0"} onClick={() => setRack(item)}>{v4(item === "base" ? "klsYard" : item === "press" ? "klsPress" : "klsShelf")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={profileFilter === "warm" ? "1" : "0"} onClick={() => setProfileFilter(profileFilter === "warm" ? "all" : "warm")}>{v4("klsWarm")}</button>
        <button type="button" className="c4-chip" data-on={profileFilter === "cool" ? "1" : "0"} onClick={() => setProfileFilter(profileFilter === "cool" ? "all" : "cool")}>{v4("klsCool")}</button>
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
        <button type="button" className="c4-chip" data-on={sort === "hand" ? "1" : "0"} onClick={() => setSort(sort === "hand" ? "profile" : "hand")}>{sort === "hand" ? v4("klsSortHand") : v4("klsSortProfile")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "tight" ? "open" : "tight")}>{density === "tight" ? v4("klsTight") : v4("klsOpenDensity")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("klsTimeline")}</button>
        <label className="c4-lab">{v4("klsDesk")}<select className="c4-field" aria-label={v4("klsDesk")} value={station} onChange={(event) => setStation(event.target.value)}>{KLS_PROFILES.map((item) => <option key={item} value={item}>{profileLabel(v4, item)}</option>)}</select></label>
      </div>
      <form className="c4-kln415-view" onSubmit={(event) => {
        event.preventDefault();
        const id = `v${Date.now().toString(36)}`;
        storeViews(addKeelsonView(views, { id, name: viewName, rack, query, hand: handFilter, bed: bedFilter, profile: profileFilter, hour: hourFilter, depth: depthFilter }));
        setViewName("");
      }}>
        <label className="c4-lab">{v4("klsViewName")}<input className="c4-field" aria-label={v4("klsViewName")} aria-required={false} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn">{v4("klsSaveView")}</button>
      </form>
      <ul className="c4-kln415-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setRack(view.rack); setQuery(view.query); setHandFilter(view.hand); setBedFilter(view.bed); setProfileFilter(view.profile); setHourFilter(view.hour); setDepthFilter(view.depth); }}>{v4("klsApply")} {view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropKeelsonView(views, view.id))}>{v4("klsDropView")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-kln415-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkKeelsonRaise(cards, picked))}>{v4("klsBulkRaise")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkKeelsonShelf(cards, picked))}>{v4("klsBulkArchive")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkKeelsonLinen(cards, picked))}>{v4("klsBulkLinen")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkKeelsonTag(cards, picked))}>{v4("klsBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("keelson-courses.csv", keelsonCsv(shown, station))}>{v4("klsCsv")}</button>
        <p className="c4-kln415-meta">{v4("klsKeys")} / c x a j k · {v4("klsQuiet")} {counts.quiet} · {v4("klsWarm")} {counts.warm}</p>
      </div>
      {board === "timeline" && (
        <ol className="c4-kln415-time" aria-label={v4("klsTimeline")}>
          {timeline.map((row) => <li key={row.hour}><span>{row.hour}</span> {row.titles.join(", ")}</li>)}
        </ol>
      )}
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("klsEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-kln415-list">
          {shown.map((card) => {
            const late = lateKeelson(card, station);
            return (
              <li key={card.id} className="c4-kln415-card" data-on={focused?.id === card.id ? "1" : "0"} data-late={late ? "1" : "0"} data-idle={idleKeelson(card) ? "1" : "0"} data-brisk={briskKeelson(card) ? "1" : "0"} data-overdue={overdueKeelson(card) ? "1" : "0"} data-resting={restingKeelson(card) ? "1" : "0"} data-warm={profileWarm(card.profile) ? "1" : "0"} data-cool={profileCool(card.profile) ? "1" : "0"} data-quiet={ivoryQuiet(card.bed) ? "1" : "0"}>
                <label className="c4-kln415-pick">
                  <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                </label>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editKeelson(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("klsEdit")} value={draft} maxLength={48} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("klsApply")}</button>
                    </form>
                  ) : <p>{card.title}</p>}
                  <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editKeelsonNote(cards, card.id, noteId === card.id ? noteDraft : card.note)); }}>
                    <input className="c4-field" aria-label={v4("klsNote")} aria-required={false} value={noteId === card.id ? noteDraft : card.note} maxLength={80} disabled={viewer} onChange={(event) => { setNoteId(card.id); setNoteDraft(event.target.value); }} onFocus={() => { setNoteId(card.id); setNoteDraft(card.note); }} />
                  </form>
                  <p className="c4-kln415-meta">{profileLabel(v4, card.profile)} · {bedLabel(v4, card.bed)} · {card.hour ?? "—"} · {card.depth} · {card.hand || "—"} · {card.tags.join(" ") || "—"}{card.audit ? ` · ${v4(AUDIT_KEY[card.audit] || "klsAuditSave")}` : ""}{late ? ` · ${v4("klsOverdue")}` : ""}</p>
                </div>
                <div className="c4-kln415-actions">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("klsEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setKeelsonRaised(cards, card.id, !card.raised))}>{card.raised ? v4("klsFree") : v4("klsRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setKeelsonBed(cards, card.id, suggestedBed))}>{v4("klsSuggest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setKeelsonRack(cards, card.id, !card.pressed))}>{card.pressed ? v4("klsUnpress") : v4("klsPressIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setKeelsonShelf(cards, card.id, !card.shelved))}>{card.shelved ? v4("klsUnshelf") : v4("klsShelfIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setKeelsonPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("klsUnpin") : v4("klsPin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addKeelsonTag(cards, card.id, "o"))}>{v4("klsTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHourFocused(cards, card.id))}>{v4("klsRaiseHour")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHourFocused(cards, card.id))}>{v4("klsLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseDepthFocused(cards, card.id))}>{v4("klsDepth")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerDepthFocused(cards, card.id))}>{v4("klsDepth")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bedFocused(cards, card.id))}>{v4("klsBed")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setKeelsonFocused(cards, card.id))}>{v4("klsRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(rackKeelsonFocused(cards, card.id))}>{v4("klsPress")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(pinKeelsonFocused(cards, card.id))}>{v4("klsPin")}</button>
                  <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(keelsonCopy(card))}>{v4("klsCopy")}</button>
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

export function HachurePlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: GroupUser[] }>("/api/admin/users?take=24&meta=0");
  const [mail, setMail] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<HachureShape>("all");
  const [review, setReview] = useState<HachureReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): HachureRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      userId: id,
      code: hachureSlice(row),
    };
  }).filter((row): row is HachureRow => Boolean(row));
  const present = presentHachureLanes(rows);
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
    const next = readHiddenHachure(readJson(HCH_HIDE_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(HCH_HIDE_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedHachure(readJson(HCH_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(HCH_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleHachureLanes(present, hidden, showHidden);
  const shown = visibleHachure(rows, lanes.includes(mail) || mail === "all" ? mail : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = hachureLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = hachureLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingHachure(rows);
  const leadHue = leadingHachureHue(rows);
  const whole = rows.filter((row) => hachureLane(row.code)).length;
  const share = hachureShare(laneHachureCount(rows, "live"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("hachure-document-lanes.csv", hachureLanesCsv(rows));
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
    writeJson(HCH_HIDE_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(HCH_REVIEW_KEY, next);
  }

  return (
    <section className="c4-hcr415" aria-label={v4("hchTitle")} data-hcr415="1" data-role={role} data-documents="1">
      <header className="c4-hcr415-mast">
        <p className="c4-hcr415-seal" data-logo="mono">{v4("hchLogo")}</p>
        <div>
          <p className="c4-hcr415-kicker">{v4("hchSub")}</p>
          <h2 className="c4-title">{v4("hchTitle")}</h2>
        </div>
        <p className="c4-hcr415-count">{shown.length}</p>
      </header>
      <p className="c4-hcr415-links">
        <Link href={crmv4Href(base, "orl")}>{v4("klsTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("hchCustomer")}</Link>
      </p>
      <p className="c4-hcr415-hint">{v4("hchHint")}</p>
      {viewer && <p className="c4-hcr415-note">{v4("hchViewer")}</p>}
      {queue.loading && <p className="c4-hcr415-meta">{v4("hchLoading")}</p>}
      {queue.error && <p className="c4-hcr415-meta">{v4("hchFailed")}</p>}
      <p className="c4-hcr415-meta">{v4("hchLead")} {laneLabel(v4, lead)} · {v4("hchToneLead")} {hueLabel(v4, leadHue)} · {v4("hchShare")} {share}</p>
      <div className="c4-hcr415-chart" aria-label={v4("hchChart")}>
        {lines.map((line) => (
          <button key={line.mail} type="button" className="c4-hcr415-column" data-on={mail === line.mail ? "1" : "0"} data-lang={line.mail} onClick={() => setMail(mail === line.mail ? "all" : line.mail)}>
            <i style={{ width: `${Math.max(18, Math.round((line.count / peak) * 100))}%` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.mail)}</span>
          </button>
        ))}
      </div>
      <div className="c4-hcr415-tools">
        <input ref={searchRef} className="c4-field c4-hcr415-search" aria-label={v4("hchSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("hchSearch")} />
        <label className="c4-lab">{v4("hchChart")}<select className="c4-field" aria-label={v4("hchChart")} value={shape} onChange={(event) => setShape(event.target.value as HachureShape)}>{(Object.keys(SHAPE_KEY) as HachureShape[]).map((item) => <option key={item} value={item}>{v4(SHAPE_KEY[item])}</option>)}</select></label>
        <button type="button" className="c4-chip" data-on={hue === "gilt" ? "1" : "0"} onClick={() => setHue(hue === "gilt" ? "all" : "gilt")}>{v4("hchGilt")}</button>
        <button type="button" className="c4-chip" data-on={hue === "pearl" ? "1" : "0"} onClick={() => setHue(hue === "pearl" ? "all" : "pearl")}>{v4("hchPearl")}</button>
        <button type="button" className="c4-chip" data-on={hue === "ash" ? "1" : "0"} onClick={() => setHue(hue === "ash" ? "all" : "ash")}>{v4("hchAsh")}</button>
        <button type="button" className="c4-chip" data-on={review === "fresh" ? "1" : "0"} onClick={() => setReview(review === "fresh" ? "all" : "fresh")}>{v4("hchFresh")}</button>
        <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} onClick={() => setReview(review === "reviewed" ? "all" : "reviewed")}>{v4("hchReviewed")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((on) => !on)}>{v4("hchShow")}</button>
        {present.map((lane) => (
          <button key={lane} type="button" className="c4-chip" data-on={hidden.includes(lane) ? "1" : "0"} onClick={() => storeHidden(toggleHachure(hidden, lane))}>{v4("hchHide")} {laneLabel(v4, lane)}</button>
        ))}
      </div>
      <div className="c4-hcr415-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkHachureReview(reviewed, picked, true))}>{v4("hchBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkHachureReview(reviewed, picked, false))}>{v4("hchBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("hachure-document-rows.csv", hachureRowsCsv(shown, reviewed))}>{v4("hchRowCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("hachure-document-marks.csv", hachureLanesCsv(rows))}>{v4("hchCsv")}</button>
      </div>
      {!shown.length && !queue.loading && <p className="c4-pay-empty">{v4("hchEmpty")}</p>}
      <ul className="c4-hcr415-list">
        {shown.map((row) => {
          const tone = hachureHue(row.code);
          const name = hachureCopy(row.code);
          return (
            <li key={row.id} className="c4-hcr415-card" data-mail={hachureLane(row.code) || "open"} data-hue={tone || "none"} data-lit={hachureLit(row.code) ? "1" : "0"} data-figure={hachureNear(row.code) ? "1" : "0"} data-short={hachureFar(row.code) ? "1" : "0"} data-long={hachureFade(row.code) ? "1" : "0"} data-dark={hachureDark(row.code) ? "1" : "0"} data-dim={hachureDim(row.code) ? "1" : "0"} data-blank={hachureBlank(row.code) ? "1" : "0"} data-open={hachureOpen(row.code) ? "1" : "0"} data-even={hachureEven(row.code) ? "1" : "0"} data-digit={hachureDigit(row.code) ? "1" : "0"} data-letter={hachureLetter(row.code) ? "1" : "0"} data-upper={hachureUpper(row.code) ? "1" : "0"}>
              <label className="c4-hcr415-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-hcr415-meta">{name || v4("hchOpen")} · {hachureStamp(row.code) || "—"} · {hachureLength(row.code) ?? "—"} · {laneLabel(v4, hachureLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-hcr415-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleHachureReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("hchReviewed") : v4("hchReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { navigator.clipboard?.writeText(hachureCopy(row.code)); setCopied(row.id); }}>{copied === row.id ? v4("hchCopied") : v4("hchCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.userId || row.id}`)}>{v4("hchCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
