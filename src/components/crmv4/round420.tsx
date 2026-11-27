"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  FRL_HIDE_KEY,
  FRL_REVIEW_KEY,
  GNW_DENSITY_KEY,
  GNW_KEY,
  GNW_PROFILES,
  GNW_VIEW_KEY,
  addGunwale,
  addGunwaleTag,
  addGunwaleView,
  bedFocused,
  briskGunwale,
  bulkFairleadReview,
  bulkGunwaleLinen,
  bulkGunwaleShelf,
  bulkGunwaleRaise,
  bulkGunwaleTag,
  busiestHand,
  dropGunwaleView,
  editGunwale,
  editGunwaleNote,
  fairHand,
  fairleadBlank,
  fairleadCopy,
  fairleadDigit,
  fairleadEven,
  fairleadFar,
  fairleadHue,
  fairleadLane,
  fairleadLanes,
  fairleadLanesCsv,
  fairleadLength,
  fairleadLetter,
  fairleadDark,
  fairleadDim,
  fairleadFade,
  fairleadLit,
  fairleadOpen,
  fairleadRowsCsv,
  fairleadShare,
  fairleadSlice,
  fairleadStamp,
  fairleadNear,
  fairleadUpper,
  idleGunwale,
  laneFairleadCount,
  lateGunwale,
  leadingFairlead,
  leadingFairleadHue,
  ivoryQuiet,
  lowerDepthFocused,
  lowerHourFocused,
  moveGunwaleFocus,
  gunwaleBars,
  gunwaleCopy,
  gunwaleCounts,
  gunwaleCsv,
  gunwaleDensity,
  gunwaleHands,
  gunwaleTimeline,
  overdueGunwale,
  pinGunwaleFocused,
  presentFairleadLanes,
  profileCool,
  profileWarm,
  rackGunwaleFocused,
  raiseDepthFocused,
  raiseHourFocused,
  readHiddenFairlead,
  readReviewedFairlead,
  readGunwaleViews,
  readGunwaleList,
  reminderGunwaleList,
  restingGunwale,
  setGunwaleFocused,
  setGunwaleBed,
  setGunwalePin,
  setGunwaleRack,
  setGunwaleRaised,
  setGunwaleShelf,
  sortGunwaleList,
  suggestProfile,
  suggestGunwaleBed,
  suggestGunwaleHour,
  toggleFairlead,
  toggleFairleadReview,
  visibleFairlead,
  visibleFairleadLanes,
  visibleGunwaleList,
  type FairleadReview,
  type FairleadRow,
  type FairleadShape,
  type Gunwale,
  type GunwaleDensity,
  type GunwaleRack,
  type GunwaleSort,
  type GunwaleView,
} from "@/lib/crmv4/round420";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const BEDS = ["IVORY", "GRAPHITE", "GILT"] as const;
const HOURS = ["3", "6", "12", "24"] as const;
const DEPTHS = ["1", "3", "6"] as const;

const PROFILE_KEY: Record<string, CrmV4CopyKey> = {
  gunwale: "gnwGunwale",
  bulwark: "gnwBulwark",
  stanchion: "gnwStanchion",
  capstan: "gnwCapstan",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "gnwAuditSave",
  edit: "gnwAuditEdit",
  note: "gnwAuditNote",
  bed: "gnwAuditBed",
  raise: "gnwAuditRaise",
  free: "gnwAuditFree",
  press: "gnwAuditPress",
  return: "gnwAuditReturn",
  shelf: "gnwAuditShelf",
  open: "gnwAuditOpen",
  tag: "gnwAuditTag",
  depth: "gnwAuditDepth",
  hour: "gnwAuditHour",
  lower: "gnwAuditLower",
  pin: "gnwAuditPin",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  live: "frlLaneLive",
  code: "frlLaneCode",
  short: "frlLaneShort",
  long: "frlLaneLong",
  hold: "frlLaneHold",
  shut: "frlLaneShut",
  blank: "frlLaneBlank",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  gilt: "frlGilt",
  pearl: "frlPearl",
  ash: "frlAsh",
};

const SHAPE_KEY: Record<FairleadShape, CrmV4CopyKey> = {
  all: "frlShapeAll",
  live: "frlShapeLive",
  code: "frlShapeCode",
  short: "frlShapeShort",
  long: "frlShapeLong",
  hold: "frlShapeHold",
  shut: "frlShapeShut",
  blank: "frlShapeBlank",
  open: "frlShapeOpen",
  digit: "frlShapeDigit",
  letter: "frlShapeLetter",
  even: "frlShapeEven",
  upper: "frlShapeUpper",
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
  return key ? v4(key) : v4("gnwBlankProfile");
}

function bedLabel(v4: V4, bed: string): string {
  if (bed === "IVORY") return v4("gnwLinen");
  if (bed === "GRAPHITE") return v4("gnwSlate");
  if (bed === "GILT") return v4("gnwGilt");
  return v4("gnwAll");
}

function laneLabel(v4: V4, mail: string): string {
  const key = LANE_KEY[mail];
  return key ? v4(key) : v4("frlBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("frlBlank");
}

export function GunwaleCourses({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Gunwale[]>([]);
  const [views, setViews] = useState<GunwaleView[]>([]);
  const [density, setDensity] = useState<GunwaleDensity>("open");
  const [rack, setRack] = useState<GunwaleRack>("base");
  const [query, setQuery] = useState("");
  const [handFilter, setHandFilter] = useState("");
  const [bedFilter, setBedFilter] = useState("all");
  const [profileFilter, setProfileFilter] = useState("all");
  const [hourFilter, setHourFilter] = useState("all");
  const [depthFilter, setDepthFilter] = useState("all");
  const [sort, setSort] = useState<GunwaleSort>("profile");
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
  const [station, setStation] = useState("gunwale");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readGunwaleList(readJson(GNW_KEY, [])));
    setViews(readGunwaleViews(readJson(GNW_VIEW_KEY, [])));
    setDensity(gunwaleDensity(readJson(GNW_DENSITY_KEY, "open")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Gunwale[]) {
    setCards(next);
    writeJson(GNW_KEY, next);
  }
  function storeViews(next: GunwaleView[]) {
    setViews(next);
    writeJson(GNW_VIEW_KEY, next);
  }
  function storeDensity(next: GunwaleDensity) {
    setDensity(next);
    writeJson(GNW_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortGunwaleList(visibleGunwaleList(cards, rack, query, handFilter, bedFilter, profileFilter, hourFilter, depthFilter), sort),
    [cards, rack, query, handFilter, bedFilter, profileFilter, hourFilter, depthFilter, sort],
  );
  const counts = gunwaleCounts(cards, shown, station);
  const bars = gunwaleBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = gunwaleTimeline(cards);
  const reminders = reminderGunwaleList(cards);
  const hands = gunwaleHands(cards);
  const busy = busiestHand(cards);
  const fair = fairHand(cards, hands.join(","));
  const suggestedBed = suggestGunwaleBed(cards);
  const suggestedHour = suggestGunwaleHour(cards, clock);
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
        download("gunwale-courses.csv", gunwaleCsv(shown, station));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((card) => card.id));
        return;
      }
      if (event.key === "j" || event.key === "J") setFocusAt((index) => moveGunwaleFocus(index, shown.length, 1));
      if (event.key === "k" || event.key === "K") setFocusAt((index) => moveGunwaleFocus(index, shown.length, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, shown, station]);

  function saveCard() {
    if (viewer) return;
    store(addGunwale(cards, { title, note, hand, profile, hour: hourNo, bed, depth: depthNo, tags }));
    setTitle("");
    setNote("");
    setTags("");
  }

  return (
    <section className="c4-gnw420" aria-label={v4("gnwTitle")} data-gnw420="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-gnw420-mast">
        <p className="c4-gnw420-seal" data-logo="mono">{v4("gnwLogo")}</p>
        <div>
          <p className="c4-gnw420-kicker">{v4("gnwSub")}</p>
          <h2 className="c4-title">{v4("gnwTitle")}</h2>
        </div>
        <p className="c4-gnw420-count">{shown.length}</p>
      </header>
      <p className="c4-gnw420-links">
        <Link href={crmv4Href(base, "frl")}>{v4("frlTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("gnwCustomers")}</Link>
      </p>
      <p className="c4-gnw420-hint">{v4("gnwHint")}</p>
      {viewer && <p className="c4-gnw420-note">{v4("gnwViewer")}</p>}
      <p className="c4-gnw420-meta">{v4("gnwFair")} {fair || "—"} · {v4("gnwBusy")} {busy || "—"} · {v4("gnwSuggest")} {profileLabel(v4, suggestedProfile)} · {bedLabel(v4, suggestedBed)} · {suggestedHour}</p>
      <ol className="c4-gnw420-index" aria-label={v4("gnwRemind")}>
        <li data-tone="gold">{v4("gnwOverdue")} {counts.overdue}</li>
        <li data-tone="pitch">{v4("gnwIdle")} {counts.idle}</li>
        <li data-tone="mist">{v4("gnwBrisk")} {counts.brisk}</li>
        <li data-tone="mist">{v4("gnwResting")} {counts.resting}</li>
      </ol>
      {reminders.length > 0 && (
        <ul className="c4-gnw420-remind c4-gnw420-notices" role="status" aria-label={v4("gnwRemind")}>
          {reminders.map((name) => <li key={name}>{v4("gnwOverdue")} {name}</li>)}
        </ul>
      )}
      <div className="c4-gnw420-chart" aria-label={v4("gnwChart")}>
        {bars.map((bar) => (
          <button key={bar.profile} type="button" className="c4-gnw420-column" data-on={profileFilter === bar.profile ? "1" : "0"} onClick={() => setProfileFilter(profileFilter === bar.profile ? "all" : bar.profile)}>
            <i style={{ width: `${Math.max(18, Math.round((bar.count / peak) * 100))}%` }} />
            <strong>{bar.count}</strong>
            <span>{profileLabel(v4, bar.profile)}</span>
          </button>
        ))}
      </div>
      <form className="c4-gnw420-form" onSubmit={(event) => { event.preventDefault(); saveCard(); }}>
        <label className="c4-lab">{v4("gnwEdit")}<input ref={titleRef} className="c4-field" aria-label={v4("gnwEdit")} value={title} maxLength={48} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("gnwNote")}<input className="c4-field" aria-label={v4("gnwNote")} aria-required={false} value={note} maxLength={80} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("gnwHand")}<input className="c4-field" aria-label={v4("gnwHand")} aria-required={false} value={hand} maxLength={24} disabled={viewer} onChange={(event) => setHand(event.target.value)} /></label>
        <label className="c4-lab">{v4("gnwProfile")}<select className="c4-field" aria-label={v4("gnwProfile")} value={profile} disabled={viewer} onChange={(event) => setProfile(event.target.value)}><option value="">{v4("gnwBlankProfile")}</option>{GNW_PROFILES.map((item) => <option key={item} value={item}>{profileLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("gnwBed")}<select className="c4-field" aria-label={v4("gnwBed")} value={bed} disabled={viewer} onChange={(event) => setBed(event.target.value)}><option value="">{v4("gnwAll")}</option>{BEDS.map((item) => <option key={item} value={item}>{bedLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("gnwHour")}<select className="c4-field" aria-label={v4("gnwHour")} value={hourNo} disabled={viewer} onChange={(event) => setHourNo(event.target.value)}><option value="">{v4("gnwAll")}</option>{HOURS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("gnwDepth")}<select className="c4-field" aria-label={v4("gnwDepth")} value={depthNo} disabled={viewer} onChange={(event) => setDepthNo(event.target.value)}><option value="">{v4("gnwAll")}</option>{DEPTHS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("gnwTag")}<input className="c4-field" aria-label={v4("gnwTag")} aria-required={false} value={tags} maxLength={8} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("gnwAdd")}</button>
      </form>
      <div className="c4-gnw420-tools">
        <input ref={searchRef} className="c4-field c4-gnw420-search" aria-label={v4("gnwSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("gnwSearch")} />
        {(["base", "press", "shelf"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={rack === item ? "1" : "0"} onClick={() => setRack(item)}>{v4(item === "base" ? "gnwYard" : item === "press" ? "gnwPress" : "gnwShelf")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={profileFilter === "warm" ? "1" : "0"} onClick={() => setProfileFilter(profileFilter === "warm" ? "all" : "warm")}>{v4("gnwWarm")}</button>
        <button type="button" className="c4-chip" data-on={profileFilter === "cool" ? "1" : "0"} onClick={() => setProfileFilter(profileFilter === "cool" ? "all" : "cool")}>{v4("gnwCool")}</button>
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
        <button type="button" className="c4-chip" data-on={sort === "hand" ? "1" : "0"} onClick={() => setSort(sort === "hand" ? "profile" : "hand")}>{sort === "hand" ? v4("gnwSortHand") : v4("gnwSortProfile")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "tight" ? "open" : "tight")}>{density === "tight" ? v4("gnwTight") : v4("gnwOpenDensity")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("gnwTimeline")}</button>
        <label className="c4-lab">{v4("gnwDesk")}<select className="c4-field" aria-label={v4("gnwDesk")} value={station} onChange={(event) => setStation(event.target.value)}>{GNW_PROFILES.map((item) => <option key={item} value={item}>{profileLabel(v4, item)}</option>)}</select></label>
      </div>
      <form className="c4-gnw420-view" onSubmit={(event) => {
        event.preventDefault();
        const id = `v${Date.now().toString(36)}`;
        storeViews(addGunwaleView(views, { id, name: viewName, rack, query, hand: handFilter, bed: bedFilter, profile: profileFilter, hour: hourFilter, depth: depthFilter }));
        setViewName("");
      }}>
        <label className="c4-lab">{v4("gnwViewName")}<input className="c4-field" aria-label={v4("gnwViewName")} aria-required={false} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn">{v4("gnwSaveView")}</button>
      </form>
      <ul className="c4-gnw420-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setRack(view.rack); setQuery(view.query); setHandFilter(view.hand); setBedFilter(view.bed); setProfileFilter(view.profile); setHourFilter(view.hour); setDepthFilter(view.depth); }}>{v4("gnwApply")} {view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropGunwaleView(views, view.id))}>{v4("gnwDropView")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-gnw420-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkGunwaleRaise(cards, picked))}>{v4("gnwBulkRaise")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkGunwaleShelf(cards, picked))}>{v4("gnwBulkArchive")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkGunwaleLinen(cards, picked))}>{v4("gnwBulkLinen")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkGunwaleTag(cards, picked))}>{v4("gnwBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("gunwale-courses.csv", gunwaleCsv(shown, station))}>{v4("gnwCsv")}</button>
        <p className="c4-gnw420-meta">{v4("gnwKeys")} / c x a j k · {v4("gnwQuiet")} {counts.quiet} · {v4("gnwWarm")} {counts.warm}</p>
      </div>
      {board === "timeline" && (
        <ol className="c4-gnw420-time" aria-label={v4("gnwTimeline")}>
          {timeline.map((row) => <li key={row.hour}><span>{row.hour}</span> {row.titles.join(", ")}</li>)}
        </ol>
      )}
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("gnwEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-gnw420-list">
          {shown.map((card) => {
            const late = lateGunwale(card, station);
            return (
              <li key={card.id} className="c4-gnw420-card" data-on={focused?.id === card.id ? "1" : "0"} data-late={late ? "1" : "0"} data-idle={idleGunwale(card) ? "1" : "0"} data-brisk={briskGunwale(card) ? "1" : "0"} data-overdue={overdueGunwale(card) ? "1" : "0"} data-resting={restingGunwale(card) ? "1" : "0"} data-warm={profileWarm(card.profile) ? "1" : "0"} data-cool={profileCool(card.profile) ? "1" : "0"} data-quiet={ivoryQuiet(card.bed) ? "1" : "0"}>
                <label className="c4-gnw420-pick">
                  <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                </label>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editGunwale(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("gnwEdit")} value={draft} maxLength={48} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("gnwApply")}</button>
                    </form>
                  ) : <p>{card.title}</p>}
                  <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editGunwaleNote(cards, card.id, noteId === card.id ? noteDraft : card.note)); }}>
                    <input className="c4-field" aria-label={v4("gnwNote")} aria-required={false} value={noteId === card.id ? noteDraft : card.note} maxLength={80} disabled={viewer} onChange={(event) => { setNoteId(card.id); setNoteDraft(event.target.value); }} onFocus={() => { setNoteId(card.id); setNoteDraft(card.note); }} />
                  </form>
                  <p className="c4-gnw420-meta">{profileLabel(v4, card.profile)} · {bedLabel(v4, card.bed)} · {card.hour ?? "—"} · {card.depth} · {card.hand || "—"} · {card.tags.join(" ") || "—"}{card.audit ? ` · ${v4(AUDIT_KEY[card.audit] || "gnwAuditSave")}` : ""}{late ? ` · ${v4("gnwOverdue")}` : ""}</p>
                </div>
                <div className="c4-gnw420-actions">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("gnwEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setGunwaleRaised(cards, card.id, !card.raised))}>{card.raised ? v4("gnwFree") : v4("gnwRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setGunwaleBed(cards, card.id, suggestedBed))}>{v4("gnwSuggest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setGunwaleRack(cards, card.id, !card.pressed))}>{card.pressed ? v4("gnwUnpress") : v4("gnwPressIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setGunwaleShelf(cards, card.id, !card.shelved))}>{card.shelved ? v4("gnwUnshelf") : v4("gnwShelfIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setGunwalePin(cards, card.id, !card.pinned))}>{card.pinned ? v4("gnwUnpin") : v4("gnwPin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addGunwaleTag(cards, card.id, "v"))}>{v4("gnwTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHourFocused(cards, card.id))}>{v4("gnwRaiseHour")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHourFocused(cards, card.id))}>{v4("gnwLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseDepthFocused(cards, card.id))}>{v4("gnwDepth")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerDepthFocused(cards, card.id))}>{v4("gnwDepth")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bedFocused(cards, card.id))}>{v4("gnwBed")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setGunwaleFocused(cards, card.id))}>{v4("gnwRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(rackGunwaleFocused(cards, card.id))}>{v4("gnwPress")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(pinGunwaleFocused(cards, card.id))}>{v4("gnwPin")}</button>
                  <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(gunwaleCopy(card))}>{v4("gnwCopy")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

type GroupDesk = { id?: string; name?: string | null; defaultEmail?: unknown };

export function FairleadPlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ desks?: GroupDesk[] }>("/api/admin/desks?take=24");
  const [mail, setMail] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<FairleadShape>("all");
  const [review, setReview] = useState<FairleadReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.desks || []).map((row): FairleadRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      userId: id,
      code: fairleadSlice(row),
    };
  }).filter((row): row is FairleadRow => Boolean(row));
  const present = presentFairleadLanes(rows);
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
    const next = readHiddenFairlead(readJson(FRL_HIDE_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(FRL_HIDE_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedFairlead(readJson(FRL_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(FRL_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleFairleadLanes(present, hidden, showHidden);
  const shown = visibleFairlead(rows, lanes.includes(mail) || mail === "all" ? mail : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = fairleadLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = fairleadLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingFairlead(rows);
  const leadHue = leadingFairleadHue(rows);
  const whole = rows.filter((row) => fairleadLane(row.code)).length;
  const share = fairleadShare(laneFairleadCount(rows, "live"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("fairlead-mail-lanes.csv", fairleadLanesCsv(rows));
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
    writeJson(FRL_HIDE_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(FRL_REVIEW_KEY, next);
  }

  return (
    <section className="c4-frl420" aria-label={v4("frlTitle")} data-frl420="1" data-role={role} data-mail="1">
      <header className="c4-frl420-mast">
        <p className="c4-frl420-seal" data-logo="mono">{v4("frlLogo")}</p>
        <div>
          <p className="c4-frl420-kicker">{v4("frlSub")}</p>
          <h2 className="c4-title">{v4("frlTitle")}</h2>
        </div>
        <p className="c4-frl420-count">{shown.length}</p>
      </header>
      <p className="c4-frl420-links">
        <Link href={crmv4Href(base, "gnw")}>{v4("gnwTitle")}</Link>
        <Link href={crmv4Href(base, "settings", { area: "desks" })}>{v4("frlCustomer")}</Link>
      </p>
      <p className="c4-frl420-hint">{v4("frlHint")}</p>
      {viewer && <p className="c4-frl420-note">{v4("frlViewer")}</p>}
      {queue.loading && <p className="c4-frl420-meta">{v4("frlLoading")}</p>}
      {queue.error && <p className="c4-frl420-meta">{v4("frlFailed")}</p>}
      <p className="c4-frl420-meta">{v4("frlLead")} {laneLabel(v4, lead)} · {v4("frlToneLead")} {hueLabel(v4, leadHue)} · {v4("frlShare")} {share}</p>
      <div className="c4-frl420-chart" aria-label={v4("frlChart")}>
        {lines.map((line) => (
          <button key={line.mail} type="button" className="c4-frl420-column" data-on={mail === line.mail ? "1" : "0"} data-lang={line.mail} onClick={() => setMail(mail === line.mail ? "all" : line.mail)}>
            <i style={{ width: `${Math.max(18, Math.round((line.count / peak) * 100))}%` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.mail)}</span>
          </button>
        ))}
      </div>
      <div className="c4-frl420-tools">
        <input ref={searchRef} className="c4-field c4-frl420-search" aria-label={v4("frlSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("frlSearch")} />
        <label className="c4-lab">{v4("frlChart")}<select className="c4-field" aria-label={v4("frlChart")} value={shape} onChange={(event) => setShape(event.target.value as FairleadShape)}>{(Object.keys(SHAPE_KEY) as FairleadShape[]).map((item) => <option key={item} value={item}>{v4(SHAPE_KEY[item])}</option>)}</select></label>
        <button type="button" className="c4-chip" data-on={hue === "gilt" ? "1" : "0"} onClick={() => setHue(hue === "gilt" ? "all" : "gilt")}>{v4("frlGilt")}</button>
        <button type="button" className="c4-chip" data-on={hue === "pearl" ? "1" : "0"} onClick={() => setHue(hue === "pearl" ? "all" : "pearl")}>{v4("frlPearl")}</button>
        <button type="button" className="c4-chip" data-on={hue === "ash" ? "1" : "0"} onClick={() => setHue(hue === "ash" ? "all" : "ash")}>{v4("frlAsh")}</button>
        <button type="button" className="c4-chip" data-on={review === "fresh" ? "1" : "0"} onClick={() => setReview(review === "fresh" ? "all" : "fresh")}>{v4("frlFresh")}</button>
        <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} onClick={() => setReview(review === "reviewed" ? "all" : "reviewed")}>{v4("frlReviewed")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((on) => !on)}>{v4("frlShow")}</button>
        {present.map((lane) => (
          <button key={lane} type="button" className="c4-chip" data-on={hidden.includes(lane) ? "1" : "0"} onClick={() => storeHidden(toggleFairlead(hidden, lane))}>{v4("frlHide")} {laneLabel(v4, lane)}</button>
        ))}
      </div>
      <div className="c4-frl420-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkFairleadReview(reviewed, picked, true))}>{v4("frlBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkFairleadReview(reviewed, picked, false))}>{v4("frlBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("fairlead-mail-rows.csv", fairleadRowsCsv(shown, reviewed))}>{v4("frlRowCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("fairlead-mail-marks.csv", fairleadLanesCsv(rows))}>{v4("frlCsv")}</button>
      </div>
      {!shown.length && !queue.loading && <p className="c4-pay-empty">{v4("frlEmpty")}</p>}
      <ul className="c4-frl420-list">
        {shown.map((row) => {
          const tone = fairleadHue(row.code);
          const name = fairleadCopy(row.code);
          return (
            <li key={row.id} className="c4-frl420-card" data-mail={fairleadLane(row.code) || "open"} data-hue={tone || "none"} data-lit={fairleadLit(row.code) ? "1" : "0"} data-figure={fairleadNear(row.code) ? "1" : "0"} data-short={fairleadFar(row.code) ? "1" : "0"} data-long={fairleadFade(row.code) ? "1" : "0"} data-dark={fairleadDark(row.code) ? "1" : "0"} data-dim={fairleadDim(row.code) ? "1" : "0"} data-blank={fairleadBlank(row.code) ? "1" : "0"} data-open={fairleadOpen(row.code) ? "1" : "0"} data-even={fairleadEven(row.code) ? "1" : "0"} data-digit={fairleadDigit(row.code) ? "1" : "0"} data-letter={fairleadLetter(row.code) ? "1" : "0"} data-upper={fairleadUpper(row.code) ? "1" : "0"}>
              <label className="c4-frl420-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-frl420-meta">{name || v4("frlOpen")} · {fairleadStamp(row.code) || "—"} · {fairleadLength(row.code) ?? "—"} · {laneLabel(v4, fairleadLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-frl420-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleFairleadReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("frlReviewed") : v4("frlReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { navigator.clipboard?.writeText(fairleadCopy(row.code)); setCopied(row.id); }}>{copied === row.id ? v4("frlCopied") : v4("frlCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, "settings", { area: "desks" })}>{v4("frlCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function RateMarlinspikeHead({ v4, title }: { v4: V4; title: string }) {
  return (
    <header className="c4-rate-marlinspike-mast">
      <p className="c4-rate-marlinspike-seal" data-logo="mono">{v4("mlnMarlinspikeLogo")}</p>
      <div>
        <p className="c4-rate-marlinspike-kicker">{v4("mlnMarlinspikeKicker")}</p>
        <h3 className="c4-title">{title}</h3>
        <p className="c4-rate-marlinspike-lead">{v4("mlnMarlinspikeLead")}</p>
      </div>
    </header>
  );
}

export function LeadTurnbuckleHead({ v4, title }: { v4: V4; title: string }) {
  return (
    <header className="c4-lead-turnbuckle-mast">
      <p className="c4-lead-turnbuckle-seal" data-logo="mono">{v4("tbkTurnbuckleLogo")}</p>
      <div>
        <p className="c4-lead-turnbuckle-kicker">{v4("tbkTurnbuckleKicker")}</p>
        <h3 className="c4-title">{title}</h3>
        <p className="c4-lead-turnbuckle-lead">{v4("tbkTurnbuckleLead")}</p>
      </div>
    </header>
  );
}
