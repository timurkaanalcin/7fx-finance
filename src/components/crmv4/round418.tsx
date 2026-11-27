"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  BKT_HIDE_KEY,
  BKT_REVIEW_KEY,
  CRV_DENSITY_KEY,
  CRV_KEY,
  CRV_PROFILES,
  CRV_VIEW_KEY,
  addCarvel,
  addCarvelTag,
  addCarvelView,
  bedFocused,
  briskCarvel,
  bulkBecketReview,
  bulkCarvelLinen,
  bulkCarvelShelf,
  bulkCarvelRaise,
  bulkCarvelTag,
  busiestHand,
  dropCarvelView,
  editCarvel,
  editCarvelNote,
  fairHand,
  becketBlank,
  becketCopy,
  becketDigit,
  becketEven,
  becketFar,
  becketHue,
  becketLane,
  becketLanes,
  becketLanesCsv,
  becketLength,
  becketLetter,
  becketDark,
  becketDim,
  becketFade,
  becketLit,
  becketOpen,
  becketRowsCsv,
  becketShare,
  becketSlice,
  becketStamp,
  becketNear,
  becketUpper,
  idleCarvel,
  laneBecketCount,
  lateCarvel,
  leadingBecket,
  leadingBecketHue,
  ivoryQuiet,
  lowerDepthFocused,
  lowerHourFocused,
  moveCarvelFocus,
  carvelBars,
  carvelCopy,
  carvelCounts,
  carvelCsv,
  carvelDensity,
  carvelHands,
  carvelTimeline,
  overdueCarvel,
  pinCarvelFocused,
  presentBecketLanes,
  profileCool,
  profileWarm,
  rackCarvelFocused,
  raiseDepthFocused,
  raiseHourFocused,
  readHiddenBecket,
  readReviewedBecket,
  readCarvelViews,
  readCarvelList,
  reminderCarvelList,
  restingCarvel,
  setCarvelFocused,
  setCarvelBed,
  setCarvelPin,
  setCarvelRack,
  setCarvelRaised,
  setCarvelShelf,
  sortCarvelList,
  suggestProfile,
  suggestCarvelBed,
  suggestCarvelHour,
  toggleBecket,
  toggleBecketReview,
  visibleBecket,
  visibleBecketLanes,
  visibleCarvelList,
  type BecketReview,
  type BecketRow,
  type BecketShape,
  type Carvel,
  type CarvelDensity,
  type CarvelRack,
  type CarvelSort,
  type CarvelView,
} from "@/lib/crmv4/round418";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const BEDS = ["IVORY", "GRAPHITE", "GILT"] as const;
const HOURS = ["3", "6", "12", "24"] as const;
const DEPTHS = ["1", "3", "6"] as const;

const PROFILE_KEY: Record<string, CrmV4CopyKey> = {
  carvel: "crvCarvel",
  clinker: "crvClinker",
  tumblehome: "crvTumblehome",
  stemson: "crvStemson",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "crvAuditSave",
  edit: "crvAuditEdit",
  note: "crvAuditNote",
  bed: "crvAuditBed",
  raise: "crvAuditRaise",
  free: "crvAuditFree",
  press: "crvAuditPress",
  return: "crvAuditReturn",
  shelf: "crvAuditShelf",
  open: "crvAuditOpen",
  tag: "crvAuditTag",
  depth: "crvAuditDepth",
  hour: "crvAuditHour",
  lower: "crvAuditLower",
  pin: "crvAuditPin",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  live: "bktLaneLive",
  code: "bktLaneCode",
  short: "bktLaneShort",
  long: "bktLaneLong",
  hold: "bktLaneHold",
  shut: "bktLaneShut",
  blank: "bktLaneBlank",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  gilt: "bktGilt",
  pearl: "bktPearl",
  ash: "bktAsh",
};

const SHAPE_KEY: Record<BecketShape, CrmV4CopyKey> = {
  all: "bktShapeAll",
  live: "bktShapeLive",
  code: "bktShapeCode",
  short: "bktShapeShort",
  long: "bktShapeLong",
  hold: "bktShapeHold",
  shut: "bktShapeShut",
  blank: "bktShapeBlank",
  open: "bktShapeOpen",
  digit: "bktShapeDigit",
  letter: "bktShapeLetter",
  even: "bktShapeEven",
  upper: "bktShapeUpper",
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
  return key ? v4(key) : v4("crvBlankProfile");
}

function bedLabel(v4: V4, bed: string): string {
  if (bed === "IVORY") return v4("crvLinen");
  if (bed === "GRAPHITE") return v4("crvSlate");
  if (bed === "GILT") return v4("crvGilt");
  return v4("crvAll");
}

function laneLabel(v4: V4, mail: string): string {
  const key = LANE_KEY[mail];
  return key ? v4(key) : v4("bktBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("bktBlank");
}

export function CarvelCourses({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Carvel[]>([]);
  const [views, setViews] = useState<CarvelView[]>([]);
  const [density, setDensity] = useState<CarvelDensity>("open");
  const [rack, setRack] = useState<CarvelRack>("base");
  const [query, setQuery] = useState("");
  const [handFilter, setHandFilter] = useState("");
  const [bedFilter, setBedFilter] = useState("all");
  const [profileFilter, setProfileFilter] = useState("all");
  const [hourFilter, setHourFilter] = useState("all");
  const [depthFilter, setDepthFilter] = useState("all");
  const [sort, setSort] = useState<CarvelSort>("profile");
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
  const [station, setStation] = useState("carvel");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readCarvelList(readJson(CRV_KEY, [])));
    setViews(readCarvelViews(readJson(CRV_VIEW_KEY, [])));
    setDensity(carvelDensity(readJson(CRV_DENSITY_KEY, "open")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Carvel[]) {
    setCards(next);
    writeJson(CRV_KEY, next);
  }
  function storeViews(next: CarvelView[]) {
    setViews(next);
    writeJson(CRV_VIEW_KEY, next);
  }
  function storeDensity(next: CarvelDensity) {
    setDensity(next);
    writeJson(CRV_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortCarvelList(visibleCarvelList(cards, rack, query, handFilter, bedFilter, profileFilter, hourFilter, depthFilter), sort),
    [cards, rack, query, handFilter, bedFilter, profileFilter, hourFilter, depthFilter, sort],
  );
  const counts = carvelCounts(cards, shown, station);
  const bars = carvelBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = carvelTimeline(cards);
  const reminders = reminderCarvelList(cards);
  const hands = carvelHands(cards);
  const busy = busiestHand(cards);
  const fair = fairHand(cards, hands.join(","));
  const suggestedBed = suggestCarvelBed(cards);
  const suggestedHour = suggestCarvelHour(cards, clock);
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
        download("carvel-courses.csv", carvelCsv(shown, station));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((card) => card.id));
        return;
      }
      if (event.key === "j" || event.key === "J") setFocusAt((index) => moveCarvelFocus(index, shown.length, 1));
      if (event.key === "k" || event.key === "K") setFocusAt((index) => moveCarvelFocus(index, shown.length, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, shown, station]);

  function saveCard() {
    if (viewer) return;
    store(addCarvel(cards, { title, note, hand, profile, hour: hourNo, bed, depth: depthNo, tags }));
    setTitle("");
    setNote("");
    setTags("");
  }

  return (
    <section className="c4-crv418" aria-label={v4("crvTitle")} data-crv418="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-crv418-mast">
        <p className="c4-crv418-seal" data-logo="mono">{v4("crvLogo")}</p>
        <div>
          <p className="c4-crv418-kicker">{v4("crvSub")}</p>
          <h2 className="c4-title">{v4("crvTitle")}</h2>
        </div>
        <p className="c4-crv418-count">{shown.length}</p>
      </header>
      <p className="c4-crv418-links">
        <Link href={crmv4Href(base, "bkt")}>{v4("bktTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("crvCustomers")}</Link>
      </p>
      <p className="c4-crv418-hint">{v4("crvHint")}</p>
      {viewer && <p className="c4-crv418-note">{v4("crvViewer")}</p>}
      <p className="c4-crv418-meta">{v4("crvFair")} {fair || "—"} · {v4("crvBusy")} {busy || "—"} · {v4("crvSuggest")} {profileLabel(v4, suggestedProfile)} · {bedLabel(v4, suggestedBed)} · {suggestedHour}</p>
      <ol className="c4-crv418-index" aria-label={v4("crvRemind")}>
        <li data-tone="gold">{v4("crvOverdue")} {counts.overdue}</li>
        <li data-tone="pitch">{v4("crvIdle")} {counts.idle}</li>
        <li data-tone="mist">{v4("crvBrisk")} {counts.brisk}</li>
        <li data-tone="mist">{v4("crvResting")} {counts.resting}</li>
      </ol>
      {reminders.length > 0 && (
        <ul className="c4-crv418-remind c4-crv418-notices" role="status" aria-label={v4("crvRemind")}>
          {reminders.map((name) => <li key={name}>{v4("crvOverdue")} {name}</li>)}
        </ul>
      )}
      <div className="c4-crv418-chart" aria-label={v4("crvChart")}>
        {bars.map((bar) => (
          <button key={bar.profile} type="button" className="c4-crv418-column" data-on={profileFilter === bar.profile ? "1" : "0"} onClick={() => setProfileFilter(profileFilter === bar.profile ? "all" : bar.profile)}>
            <i style={{ width: `${Math.max(18, Math.round((bar.count / peak) * 100))}%` }} />
            <strong>{bar.count}</strong>
            <span>{profileLabel(v4, bar.profile)}</span>
          </button>
        ))}
      </div>
      <form className="c4-crv418-form" onSubmit={(event) => { event.preventDefault(); saveCard(); }}>
        <label className="c4-lab">{v4("crvEdit")}<input ref={titleRef} className="c4-field" aria-label={v4("crvEdit")} value={title} maxLength={48} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("crvNote")}<input className="c4-field" aria-label={v4("crvNote")} aria-required={false} value={note} maxLength={80} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("crvHand")}<input className="c4-field" aria-label={v4("crvHand")} aria-required={false} value={hand} maxLength={24} disabled={viewer} onChange={(event) => setHand(event.target.value)} /></label>
        <label className="c4-lab">{v4("crvProfile")}<select className="c4-field" aria-label={v4("crvProfile")} value={profile} disabled={viewer} onChange={(event) => setProfile(event.target.value)}><option value="">{v4("crvBlankProfile")}</option>{CRV_PROFILES.map((item) => <option key={item} value={item}>{profileLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("crvBed")}<select className="c4-field" aria-label={v4("crvBed")} value={bed} disabled={viewer} onChange={(event) => setBed(event.target.value)}><option value="">{v4("crvAll")}</option>{BEDS.map((item) => <option key={item} value={item}>{bedLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("crvHour")}<select className="c4-field" aria-label={v4("crvHour")} value={hourNo} disabled={viewer} onChange={(event) => setHourNo(event.target.value)}><option value="">{v4("crvAll")}</option>{HOURS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("crvDepth")}<select className="c4-field" aria-label={v4("crvDepth")} value={depthNo} disabled={viewer} onChange={(event) => setDepthNo(event.target.value)}><option value="">{v4("crvAll")}</option>{DEPTHS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("crvTag")}<input className="c4-field" aria-label={v4("crvTag")} aria-required={false} value={tags} maxLength={8} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("crvAdd")}</button>
      </form>
      <div className="c4-crv418-tools">
        <input ref={searchRef} className="c4-field c4-crv418-search" aria-label={v4("crvSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("crvSearch")} />
        {(["base", "press", "shelf"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={rack === item ? "1" : "0"} onClick={() => setRack(item)}>{v4(item === "base" ? "crvYard" : item === "press" ? "crvPress" : "crvShelf")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={profileFilter === "warm" ? "1" : "0"} onClick={() => setProfileFilter(profileFilter === "warm" ? "all" : "warm")}>{v4("crvWarm")}</button>
        <button type="button" className="c4-chip" data-on={profileFilter === "cool" ? "1" : "0"} onClick={() => setProfileFilter(profileFilter === "cool" ? "all" : "cool")}>{v4("crvCool")}</button>
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
        <button type="button" className="c4-chip" data-on={sort === "hand" ? "1" : "0"} onClick={() => setSort(sort === "hand" ? "profile" : "hand")}>{sort === "hand" ? v4("crvSortHand") : v4("crvSortProfile")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "tight" ? "open" : "tight")}>{density === "tight" ? v4("crvTight") : v4("crvOpenDensity")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("crvTimeline")}</button>
        <label className="c4-lab">{v4("crvDesk")}<select className="c4-field" aria-label={v4("crvDesk")} value={station} onChange={(event) => setStation(event.target.value)}>{CRV_PROFILES.map((item) => <option key={item} value={item}>{profileLabel(v4, item)}</option>)}</select></label>
      </div>
      <form className="c4-crv418-view" onSubmit={(event) => {
        event.preventDefault();
        const id = `v${Date.now().toString(36)}`;
        storeViews(addCarvelView(views, { id, name: viewName, rack, query, hand: handFilter, bed: bedFilter, profile: profileFilter, hour: hourFilter, depth: depthFilter }));
        setViewName("");
      }}>
        <label className="c4-lab">{v4("crvViewName")}<input className="c4-field" aria-label={v4("crvViewName")} aria-required={false} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn">{v4("crvSaveView")}</button>
      </form>
      <ul className="c4-crv418-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setRack(view.rack); setQuery(view.query); setHandFilter(view.hand); setBedFilter(view.bed); setProfileFilter(view.profile); setHourFilter(view.hour); setDepthFilter(view.depth); }}>{v4("crvApply")} {view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropCarvelView(views, view.id))}>{v4("crvDropView")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-crv418-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkCarvelRaise(cards, picked))}>{v4("crvBulkRaise")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkCarvelShelf(cards, picked))}>{v4("crvBulkArchive")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkCarvelLinen(cards, picked))}>{v4("crvBulkLinen")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkCarvelTag(cards, picked))}>{v4("crvBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("carvel-courses.csv", carvelCsv(shown, station))}>{v4("crvCsv")}</button>
        <p className="c4-crv418-meta">{v4("crvKeys")} / c x a j k · {v4("crvQuiet")} {counts.quiet} · {v4("crvWarm")} {counts.warm}</p>
      </div>
      {board === "timeline" && (
        <ol className="c4-crv418-time" aria-label={v4("crvTimeline")}>
          {timeline.map((row) => <li key={row.hour}><span>{row.hour}</span> {row.titles.join(", ")}</li>)}
        </ol>
      )}
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("crvEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-crv418-list">
          {shown.map((card) => {
            const late = lateCarvel(card, station);
            return (
              <li key={card.id} className="c4-crv418-card" data-on={focused?.id === card.id ? "1" : "0"} data-late={late ? "1" : "0"} data-idle={idleCarvel(card) ? "1" : "0"} data-brisk={briskCarvel(card) ? "1" : "0"} data-overdue={overdueCarvel(card) ? "1" : "0"} data-resting={restingCarvel(card) ? "1" : "0"} data-warm={profileWarm(card.profile) ? "1" : "0"} data-cool={profileCool(card.profile) ? "1" : "0"} data-quiet={ivoryQuiet(card.bed) ? "1" : "0"}>
                <label className="c4-crv418-pick">
                  <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                </label>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editCarvel(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("crvEdit")} value={draft} maxLength={48} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("crvApply")}</button>
                    </form>
                  ) : <p>{card.title}</p>}
                  <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editCarvelNote(cards, card.id, noteId === card.id ? noteDraft : card.note)); }}>
                    <input className="c4-field" aria-label={v4("crvNote")} aria-required={false} value={noteId === card.id ? noteDraft : card.note} maxLength={80} disabled={viewer} onChange={(event) => { setNoteId(card.id); setNoteDraft(event.target.value); }} onFocus={() => { setNoteId(card.id); setNoteDraft(card.note); }} />
                  </form>
                  <p className="c4-crv418-meta">{profileLabel(v4, card.profile)} · {bedLabel(v4, card.bed)} · {card.hour ?? "—"} · {card.depth} · {card.hand || "—"} · {card.tags.join(" ") || "—"}{card.audit ? ` · ${v4(AUDIT_KEY[card.audit] || "crvAuditSave")}` : ""}{late ? ` · ${v4("crvOverdue")}` : ""}</p>
                </div>
                <div className="c4-crv418-actions">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("crvEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCarvelRaised(cards, card.id, !card.raised))}>{card.raised ? v4("crvFree") : v4("crvRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCarvelBed(cards, card.id, suggestedBed))}>{v4("crvSuggest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCarvelRack(cards, card.id, !card.pressed))}>{card.pressed ? v4("crvUnpress") : v4("crvPressIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCarvelShelf(cards, card.id, !card.shelved))}>{card.shelved ? v4("crvUnshelf") : v4("crvShelfIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCarvelPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("crvUnpin") : v4("crvPin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addCarvelTag(cards, card.id, "v"))}>{v4("crvTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHourFocused(cards, card.id))}>{v4("crvRaiseHour")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHourFocused(cards, card.id))}>{v4("crvLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseDepthFocused(cards, card.id))}>{v4("crvDepth")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerDepthFocused(cards, card.id))}>{v4("crvDepth")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bedFocused(cards, card.id))}>{v4("crvBed")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCarvelFocused(cards, card.id))}>{v4("crvRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(rackCarvelFocused(cards, card.id))}>{v4("crvPress")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(pinCarvelFocused(cards, card.id))}>{v4("crvPin")}</button>
                  <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(carvelCopy(card))}>{v4("crvCopy")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

type GroupUser = { id?: string; name?: string | null; lastSeenAt?: unknown };

export function BecketPlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: GroupUser[] }>("/api/admin/users?take=24&meta=0");
  const [mail, setMail] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<BecketShape>("all");
  const [review, setReview] = useState<BecketReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): BecketRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      userId: id,
      code: becketSlice(row),
    };
  }).filter((row): row is BecketRow => Boolean(row));
  const present = presentBecketLanes(rows);
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
    const next = readHiddenBecket(readJson(BKT_HIDE_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(BKT_HIDE_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedBecket(readJson(BKT_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(BKT_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleBecketLanes(present, hidden, showHidden);
  const shown = visibleBecket(rows, lanes.includes(mail) || mail === "all" ? mail : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = becketLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = becketLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingBecket(rows);
  const leadHue = leadingBecketHue(rows);
  const whole = rows.filter((row) => becketLane(row.code)).length;
  const share = becketShare(laneBecketCount(rows, "live"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("becket-seen-lanes.csv", becketLanesCsv(rows));
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
    writeJson(BKT_HIDE_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(BKT_REVIEW_KEY, next);
  }

  return (
    <section className="c4-bkt418" aria-label={v4("bktTitle")} data-bkt418="1" data-role={role} data-seen="1">
      <header className="c4-bkt418-mast">
        <p className="c4-bkt418-seal" data-logo="mono">{v4("bktLogo")}</p>
        <div>
          <p className="c4-bkt418-kicker">{v4("bktSub")}</p>
          <h2 className="c4-title">{v4("bktTitle")}</h2>
        </div>
        <p className="c4-bkt418-count">{shown.length}</p>
      </header>
      <p className="c4-bkt418-links">
        <Link href={crmv4Href(base, "crv")}>{v4("crvTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("bktCustomer")}</Link>
      </p>
      <p className="c4-bkt418-hint">{v4("bktHint")}</p>
      {viewer && <p className="c4-bkt418-note">{v4("bktViewer")}</p>}
      {queue.loading && <p className="c4-bkt418-meta">{v4("bktLoading")}</p>}
      {queue.error && <p className="c4-bkt418-meta">{v4("bktFailed")}</p>}
      <p className="c4-bkt418-meta">{v4("bktLead")} {laneLabel(v4, lead)} · {v4("bktToneLead")} {hueLabel(v4, leadHue)} · {v4("bktShare")} {share}</p>
      <div className="c4-bkt418-chart" aria-label={v4("bktChart")}>
        {lines.map((line) => (
          <button key={line.mail} type="button" className="c4-bkt418-column" data-on={mail === line.mail ? "1" : "0"} data-lang={line.mail} onClick={() => setMail(mail === line.mail ? "all" : line.mail)}>
            <i style={{ width: `${Math.max(18, Math.round((line.count / peak) * 100))}%` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.mail)}</span>
          </button>
        ))}
      </div>
      <div className="c4-bkt418-tools">
        <input ref={searchRef} className="c4-field c4-bkt418-search" aria-label={v4("bktSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("bktSearch")} />
        <label className="c4-lab">{v4("bktChart")}<select className="c4-field" aria-label={v4("bktChart")} value={shape} onChange={(event) => setShape(event.target.value as BecketShape)}>{(Object.keys(SHAPE_KEY) as BecketShape[]).map((item) => <option key={item} value={item}>{v4(SHAPE_KEY[item])}</option>)}</select></label>
        <button type="button" className="c4-chip" data-on={hue === "gilt" ? "1" : "0"} onClick={() => setHue(hue === "gilt" ? "all" : "gilt")}>{v4("bktGilt")}</button>
        <button type="button" className="c4-chip" data-on={hue === "pearl" ? "1" : "0"} onClick={() => setHue(hue === "pearl" ? "all" : "pearl")}>{v4("bktPearl")}</button>
        <button type="button" className="c4-chip" data-on={hue === "ash" ? "1" : "0"} onClick={() => setHue(hue === "ash" ? "all" : "ash")}>{v4("bktAsh")}</button>
        <button type="button" className="c4-chip" data-on={review === "fresh" ? "1" : "0"} onClick={() => setReview(review === "fresh" ? "all" : "fresh")}>{v4("bktFresh")}</button>
        <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} onClick={() => setReview(review === "reviewed" ? "all" : "reviewed")}>{v4("bktReviewed")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((on) => !on)}>{v4("bktShow")}</button>
        {present.map((lane) => (
          <button key={lane} type="button" className="c4-chip" data-on={hidden.includes(lane) ? "1" : "0"} onClick={() => storeHidden(toggleBecket(hidden, lane))}>{v4("bktHide")} {laneLabel(v4, lane)}</button>
        ))}
      </div>
      <div className="c4-bkt418-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkBecketReview(reviewed, picked, true))}>{v4("bktBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkBecketReview(reviewed, picked, false))}>{v4("bktBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("becket-seen-rows.csv", becketRowsCsv(shown, reviewed))}>{v4("bktRowCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("becket-seen-marks.csv", becketLanesCsv(rows))}>{v4("bktCsv")}</button>
      </div>
      {!shown.length && !queue.loading && <p className="c4-pay-empty">{v4("bktEmpty")}</p>}
      <ul className="c4-bkt418-list">
        {shown.map((row) => {
          const tone = becketHue(row.code);
          const name = becketCopy(row.code);
          return (
            <li key={row.id} className="c4-bkt418-card" data-mail={becketLane(row.code) || "open"} data-hue={tone || "none"} data-lit={becketLit(row.code) ? "1" : "0"} data-figure={becketNear(row.code) ? "1" : "0"} data-short={becketFar(row.code) ? "1" : "0"} data-long={becketFade(row.code) ? "1" : "0"} data-dark={becketDark(row.code) ? "1" : "0"} data-dim={becketDim(row.code) ? "1" : "0"} data-blank={becketBlank(row.code) ? "1" : "0"} data-open={becketOpen(row.code) ? "1" : "0"} data-even={becketEven(row.code) ? "1" : "0"} data-digit={becketDigit(row.code) ? "1" : "0"} data-letter={becketLetter(row.code) ? "1" : "0"} data-upper={becketUpper(row.code) ? "1" : "0"}>
              <label className="c4-bkt418-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-bkt418-meta">{name || v4("bktOpen")} · {becketStamp(row.code) || "—"} · {becketLength(row.code) ?? "—"} · {laneLabel(v4, becketLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-bkt418-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleBecketReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("bktReviewed") : v4("bktReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { navigator.clipboard?.writeText(becketCopy(row.code)); setCopied(row.id); }}>{copied === row.id ? v4("bktCopied") : v4("bktCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.userId || row.id}`)}>{v4("bktCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function SponsorTholeHead({ v4, title }: { v4: V4; title: string }) {
  return (
    <header className="c4-sponsor-thole-mast">
      <p className="c4-sponsor-thole-seal" data-logo="mono">{v4("thlTholeLogo")}</p>
      <div>
        <p className="c4-sponsor-thole-kicker">{v4("thlTholeKicker")}</p>
        <h3 className="c4-title">{title}</h3>
        <p className="c4-sponsor-thole-lead">{v4("thlTholeLead")}</p>
      </div>
    </header>
  );
}

export function ImportCleatHead({ v4, title }: { v4: V4; title: string }) {
  return (
    <header className="c4-import-cleat-mast">
      <p className="c4-import-cleat-seal" data-logo="mono">{v4("cltCleatLogo")}</p>
      <div>
        <p className="c4-import-cleat-kicker">{v4("cltCleatKicker")}</p>
        <h3 className="c4-title">{title}</h3>
        <p className="c4-import-cleat-lead">{v4("cltCleatLead")}</p>
      </div>
    </header>
  );
}
