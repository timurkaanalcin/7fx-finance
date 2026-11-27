"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  FAS_HIDE_KEY,
  FAS_REVIEW_KEY,
  DNT_DENSITY_KEY,
  DNT_KEY,
  DNT_PROFILES,
  DNT_VIEW_KEY,
  addDentil,
  addDentilTag,
  addDentilView,
  bedFocused,
  briskDentil,
  bulkFasciaReview,
  bulkDentilLinen,
  bulkDentilLoft,
  bulkDentilRaise,
  bulkDentilTag,
  busiestHand,
  dropDentilView,
  editDentil,
  editDentilNote,
  fairHand,
  fasciaBlank,
  fasciaCopy,
  fasciaDigit,
  fasciaEven,
  fasciaFar,
  fasciaHue,
  fasciaLane,
  fasciaLanes,
  fasciaLanesCsv,
  fasciaLength,
  fasciaLetter,
  fasciaDark,
  fasciaDim,
  fasciaFade,
  fasciaLit,
  fasciaOpen,
  fasciaRowsCsv,
  fasciaShare,
  fasciaStamp,
  fasciaNear,
  fasciaUpper,
  idleDentil,
  laneFasciaCount,
  lateDentil,
  leadingFascia,
  leadingFasciaHue,
  graphiteQuiet,
  lowerDepthFocused,
  lowerHourFocused,
  moveDentilFocus,
  dentilBars,
  dentilCopy,
  dentilCounts,
  dentilCsv,
  dentilDensity,
  dentilHands,
  dentilTimeline,
  overdueDentil,
  pinDentilFocused,
  presentFasciaLanes,
  profileCool,
  profileWarm,
  rackDentilFocused,
  raiseDepthFocused,
  raiseHourFocused,
  readHiddenFascia,
  readReviewedFascia,
  readDentilViews,
  readDentilList,
  reminderDentilList,
  restingDentil,
  setDentilFocused,
  setDentilBed,
  setDentilPin,
  setDentilRack,
  setDentilRaised,
  setDentilLoft,
  sortDentilList,
  suggestProfile,
  suggestDentilBed,
  suggestDentilHour,
  toggleFascia,
  toggleFasciaReview,
  visibleFascia,
  visibleFasciaLanes,
  visibleDentilList,
  type FasciaReview,
  type FasciaRow,
  type FasciaShape,
  type FasciaValue,
  type Dentil,
  type DentilDensity,
  type DentilRack,
  type DentilSort,
  type DentilView,
} from "@/lib/crmv4/round391";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const BEDS = ["IVORY", "GRAPHITE", "CHAMPAGNE"] as const;
const HOURS = ["1", "5", "9", "13"] as const;
const DEPTHS = ["1", "3", "5"] as const;

const PROFILE_KEY: Record<string, CrmV4CopyKey> = {
  dentil: "dcsDentil",
  reel: "dcsReel",
  fillet: "dcsFillet",
  bead: "dcsBead",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "dcsAuditSave",
  edit: "dcsAuditEdit",
  note: "dcsAuditNote",
  bed: "dcsAuditBed",
  raise: "dcsAuditRaise",
  free: "dcsAuditFree",
  kiln: "dcsAuditKiln",
  return: "dcsAuditReturn",
  loft: "dcsAuditLoft",
  open: "dcsAuditOpen",
  tag: "dcsAuditTag",
  depth: "dcsAuditDepth",
  hour: "dcsAuditHour",
  lower: "dcsAuditLower",
  pin: "dcsAuditPin",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  due: "fasLaneDue",
  soon: "fasLaneSoon",
  far: "fasLaneFar",
  late: "fasLaneLate",
  missed: "fasLaneMissed",
  hold: "fasLaneHold",
  blank: "fasLaneBlank",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  gilt: "fasGilt",
  pearl: "fasPearl",
  ash: "fasAsh",
};

const SHAPE_KEY: Record<FasciaShape, CrmV4CopyKey> = {
  all: "fasShapeAll",
  due: "fasShapeDue",
  soon: "fasShapeSoon",
  far: "fasShapeFar",
  late: "fasShapeLate",
  missed: "fasShapeMissed",
  hold: "fasShapeHold",
  blank: "fasShapeBlank",
  open: "fasShapeOpen",
  digit: "fasShapeDigit",
  letter: "fasShapeLetter",
  even: "fasShapeEven",
  upper: "fasShapeUpper",
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
  return key ? v4(key) : v4("dcsBlankProfile");
}

function bedLabel(v4: V4, bed: string): string {
  if (bed === "IVORY") return v4("dcsLinen");
  if (bed === "GRAPHITE") return v4("dcsSlate");
  if (bed === "CHAMPAGNE") return v4("dcsGilt");
  return v4("dcsAll");
}

function laneLabel(v4: V4, mail: string): string {
  const key = LANE_KEY[mail];
  return key ? v4(key) : v4("fasBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("fasBlank");
}

export function DentilCourses({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Dentil[]>([]);
  const [views, setViews] = useState<DentilView[]>([]);
  const [density, setDensity] = useState<DentilDensity>("open");
  const [rack, setRack] = useState<DentilRack>("bench");
  const [query, setQuery] = useState("");
  const [handFilter, setHandFilter] = useState("");
  const [bedFilter, setBedFilter] = useState("all");
  const [profileFilter, setProfileFilter] = useState("all");
  const [hourFilter, setHourFilter] = useState("all");
  const [depthFilter, setDepthFilter] = useState("all");
  const [sort, setSort] = useState<DentilSort>("profile");
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
  const [station, setStation] = useState("dentil");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readDentilList(readJson(DNT_KEY, [])));
    setViews(readDentilViews(readJson(DNT_VIEW_KEY, [])));
    setDensity(dentilDensity(readJson(DNT_DENSITY_KEY, "open")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Dentil[]) {
    setCards(next);
    writeJson(DNT_KEY, next);
  }
  function storeViews(next: DentilView[]) {
    setViews(next);
    writeJson(DNT_VIEW_KEY, next);
  }
  function storeDensity(next: DentilDensity) {
    setDensity(next);
    writeJson(DNT_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortDentilList(visibleDentilList(cards, rack, query, handFilter, bedFilter, profileFilter, hourFilter, depthFilter), sort),
    [cards, rack, query, handFilter, bedFilter, profileFilter, hourFilter, depthFilter, sort],
  );
  const counts = dentilCounts(cards, shown, station);
  const bars = dentilBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = dentilTimeline(cards);
  const reminders = reminderDentilList(cards);
  const hands = dentilHands(cards);
  const busy = busiestHand(cards);
  const fair = fairHand(cards, hands.join(","));
  const suggestedBed = suggestDentilBed(cards);
  const suggestedHour = suggestDentilHour(cards, clock);
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
        download("dentil.csv", dentilCsv(shown, station));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((card) => card.id));
        return;
      }
      if (event.key === "j" || event.key === "J") setFocusAt((index) => moveDentilFocus(index, shown.length, 1));
      if (event.key === "k" || event.key === "K") setFocusAt((index) => moveDentilFocus(index, shown.length, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, shown, station]);

  function saveCard() {
    if (viewer) return;
    store(addDentil(cards, { title, note, hand, profile, hour: hourNo, bed, depth: depthNo, tags }));
    setTitle("");
    setNote("");
    setTags("");
  }

  return (
    <section className="c4-dentil" aria-label={v4("dcsTitle")} data-dentil="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-dentil-mast">
        <p className="c4-dentil-seal" data-logo="mono">{v4("dcsLogo")}</p>
        <div>
          <p className="c4-dentil-kicker">{v4("dcsSub")}</p>
          <h2 className="c4-title">{v4("dcsTitle")}</h2>
        </div>
        <p className="c4-dentil-count">{shown.length}</p>
      </header>
      <p className="c4-dentil-links">
        <Link href={crmv4Href(base, "cvt")}>{v4("fasTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("dcsCustomers")}</Link>
      </p>
      <p className="c4-dentil-hint">{v4("dcsHint")}</p>
      {viewer && <p className="c4-dentil-note">{v4("dcsViewer")}</p>}
      <p className="c4-dentil-meta">{v4("dcsFair")} {fair || "—"} · {v4("dcsBusy")} {busy || "—"} · {v4("dcsSuggest")} {profileLabel(v4, suggestedProfile)} · {bedLabel(v4, suggestedBed)} · {suggestedHour}</p>
      <ol className="c4-dentil-index" aria-label={v4("dcsRemind")}>
        <li data-tone="gold">{v4("dcsOverdue")} {counts.overdue}</li>
        <li data-tone="pitch">{v4("dcsIdle")} {counts.idle}</li>
        <li data-tone="mist">{v4("dcsBrisk")} {counts.brisk}</li>
        <li data-tone="mist">{v4("dcsResting")} {counts.resting}</li>
      </ol>
      {reminders.length > 0 && (
        <ul className="c4-dentil-remind c4-dentil-notices" role="status" aria-label={v4("dcsRemind")}>
          {reminders.map((name) => <li key={name}>{v4("dcsOverdue")} {name}</li>)}
        </ul>
      )}
      <div className="c4-dentil-chart" aria-label={v4("dcsChart")}>
        {bars.map((bar) => (
          <button key={bar.profile} type="button" className="c4-dentil-column" data-on={profileFilter === bar.profile ? "1" : "0"} onClick={() => setProfileFilter(profileFilter === bar.profile ? "all" : bar.profile)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / peak) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{profileLabel(v4, bar.profile)}</span>
          </button>
        ))}
      </div>
      <form className="c4-dentil-form" onSubmit={(event) => { event.preventDefault(); saveCard(); }}>
        <label className="c4-lab">{v4("dcsEdit")}<input ref={titleRef} className="c4-field" aria-label={v4("dcsEdit")} value={title} maxLength={48} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("dcsNote")}<input className="c4-field" aria-label={v4("dcsNote")} aria-required={false} value={note} maxLength={80} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("dcsHand")}<input className="c4-field" aria-label={v4("dcsHand")} aria-required={false} value={hand} maxLength={24} disabled={viewer} onChange={(event) => setHand(event.target.value)} /></label>
        <label className="c4-lab">{v4("dcsProfile")}<select className="c4-field" aria-label={v4("dcsProfile")} value={profile} disabled={viewer} onChange={(event) => setProfile(event.target.value)}><option value="">{v4("dcsBlankProfile")}</option>{DNT_PROFILES.map((item) => <option key={item} value={item}>{profileLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("dcsBed")}<select className="c4-field" aria-label={v4("dcsBed")} value={bed} disabled={viewer} onChange={(event) => setBed(event.target.value)}><option value="">{v4("dcsAll")}</option>{BEDS.map((item) => <option key={item} value={item}>{bedLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("dcsHour")}<select className="c4-field" aria-label={v4("dcsHour")} value={hourNo} disabled={viewer} onChange={(event) => setHourNo(event.target.value)}><option value="">{v4("dcsAll")}</option>{HOURS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("dcsDepth")}<select className="c4-field" aria-label={v4("dcsDepth")} value={depthNo} disabled={viewer} onChange={(event) => setDepthNo(event.target.value)}><option value="">{v4("dcsAll")}</option>{DEPTHS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("dcsTag")}<input className="c4-field" aria-label={v4("dcsTag")} aria-required={false} value={tags} maxLength={8} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("dcsAdd")}</button>
      </form>
      <div className="c4-dentil-tools">
        <input ref={searchRef} className="c4-field c4-dentil-search" aria-label={v4("dcsSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("dcsSearch")} />
        {(["bench", "kiln", "loft"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={rack === item ? "1" : "0"} onClick={() => setRack(item)}>{v4(item === "bench" ? "dcsBench" : item === "kiln" ? "dcsKiln" : "dcsLoft")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={profileFilter === "warm" ? "1" : "0"} onClick={() => setProfileFilter(profileFilter === "warm" ? "all" : "warm")}>{v4("dcsWarm")}</button>
        <button type="button" className="c4-chip" data-on={profileFilter === "cool" ? "1" : "0"} onClick={() => setProfileFilter(profileFilter === "cool" ? "all" : "cool")}>{v4("dcsCool")}</button>
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
        <button type="button" className="c4-chip" data-on={sort === "hand" ? "1" : "0"} onClick={() => setSort(sort === "hand" ? "profile" : "hand")}>{sort === "hand" ? v4("dcsSortHand") : v4("dcsSortProfile")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "tight" ? "open" : "tight")}>{density === "tight" ? v4("dcsTight") : v4("dcsOpenDensity")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("dcsTimeline")}</button>
        <label className="c4-lab">{v4("dcsDesk")}<select className="c4-field" aria-label={v4("dcsDesk")} value={station} onChange={(event) => setStation(event.target.value)}>{DNT_PROFILES.map((item) => <option key={item} value={item}>{profileLabel(v4, item)}</option>)}</select></label>
      </div>
      <form className="c4-dentil-view" onSubmit={(event) => {
        event.preventDefault();
        const id = `v${Date.now().toString(36)}`;
        storeViews(addDentilView(views, { id, name: viewName, rack, query, hand: handFilter, bed: bedFilter, profile: profileFilter, hour: hourFilter, depth: depthFilter }));
        setViewName("");
      }}>
        <label className="c4-lab">{v4("dcsViewName")}<input className="c4-field" aria-label={v4("dcsViewName")} aria-required={false} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn">{v4("dcsSaveView")}</button>
      </form>
      <ul className="c4-dentil-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setRack(view.rack); setQuery(view.query); setHandFilter(view.hand); setBedFilter(view.bed); setProfileFilter(view.profile); setHourFilter(view.hour); setDepthFilter(view.depth); }}>{v4("dcsApply")} {view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropDentilView(views, view.id))}>{v4("dcsDropView")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-dentil-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkDentilRaise(cards, picked))}>{v4("dcsBulkRaise")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkDentilLoft(cards, picked))}>{v4("dcsBulkArchive")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkDentilLinen(cards, picked))}>{v4("dcsBulkLinen")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkDentilTag(cards, picked))}>{v4("dcsBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("dentil.csv", dentilCsv(shown, station))}>{v4("dcsCsv")}</button>
        <p className="c4-dentil-meta">{v4("dcsKeys")} / c x a j k · {v4("dcsQuiet")} {counts.quiet} · {v4("dcsWarm")} {counts.warm}</p>
      </div>
      {board === "timeline" && (
        <ol className="c4-dentil-time" aria-label={v4("dcsTimeline")}>
          {timeline.map((row) => <li key={row.hour}><span>{row.hour}</span> {row.titles.join(", ")}</li>)}
        </ol>
      )}
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("dcsEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-dentil-list">
          {shown.map((card) => {
            const late = lateDentil(card, station);
            return (
              <li key={card.id} className="c4-dentil-card" data-on={focused?.id === card.id ? "1" : "0"} data-late={late ? "1" : "0"} data-idle={idleDentil(card) ? "1" : "0"} data-brisk={briskDentil(card) ? "1" : "0"} data-overdue={overdueDentil(card) ? "1" : "0"} data-resting={restingDentil(card) ? "1" : "0"} data-warm={profileWarm(card.profile) ? "1" : "0"} data-cool={profileCool(card.profile) ? "1" : "0"} data-quiet={graphiteQuiet(card.bed) ? "1" : "0"}>
                <label className="c4-dentil-pick">
                  <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                </label>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editDentil(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("dcsEdit")} value={draft} maxLength={48} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("dcsApply")}</button>
                    </form>
                  ) : <p>{card.title}</p>}
                  <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editDentilNote(cards, card.id, noteId === card.id ? noteDraft : card.note)); }}>
                    <input className="c4-field" aria-label={v4("dcsNote")} aria-required={false} value={noteId === card.id ? noteDraft : card.note} maxLength={80} disabled={viewer} onChange={(event) => { setNoteId(card.id); setNoteDraft(event.target.value); }} onFocus={() => { setNoteId(card.id); setNoteDraft(card.note); }} />
                  </form>
                  <p className="c4-dentil-meta">{profileLabel(v4, card.profile)} · {bedLabel(v4, card.bed)} · {card.hour ?? "—"} · {card.depth} · {card.hand || "—"} · {card.tags.join(" ") || "—"}{card.audit ? ` · ${v4(AUDIT_KEY[card.audit] || "dcsAuditSave")}` : ""}{late ? ` · ${v4("dcsOverdue")}` : ""}</p>
                </div>
                <div className="c4-dentil-actions">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("dcsEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setDentilRaised(cards, card.id, !card.raised))}>{card.raised ? v4("dcsFree") : v4("dcsRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setDentilBed(cards, card.id, suggestedBed))}>{v4("dcsSuggest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setDentilRack(cards, card.id, !card.kilned))}>{card.kilned ? v4("dcsUnkiln") : v4("dcsKilnIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setDentilLoft(cards, card.id, !card.lofted))}>{card.lofted ? v4("dcsUnloft") : v4("dcsLoftIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setDentilPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("dcsUnpin") : v4("dcsPin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addDentilTag(cards, card.id, "r"))}>{v4("dcsTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHourFocused(cards, card.id))}>{v4("dcsRaiseHour")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHourFocused(cards, card.id))}>{v4("dcsLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseDepthFocused(cards, card.id))}>{v4("dcsDepth")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerDepthFocused(cards, card.id))}>{v4("dcsDepth")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bedFocused(cards, card.id))}>{v4("dcsBed")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setDentilFocused(cards, card.id))}>{v4("dcsRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(rackDentilFocused(cards, card.id))}>{v4("dcsKiln")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(pinDentilFocused(cards, card.id))}>{v4("dcsPin")}</button>
                  <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(dentilCopy(card))}>{v4("dcsCopy")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

type GroupUser = { id?: string; name?: string | null; username?: string | null };

export function FasciaBands({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: GroupUser[] }>("/api/admin/users?take=24&meta=0");
  const [mail, setMail] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<FasciaShape>("all");
  const [review, setReview] = useState<FasciaReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): FasciaRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      userId: id,
      code: { username: textField(row.username) } satisfies FasciaValue,
    };
  }).filter((row): row is FasciaRow => Boolean(row));
  const present = presentFasciaLanes(rows);
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
    const next = readHiddenFascia(readJson(FAS_HIDE_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(FAS_HIDE_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedFascia(readJson(FAS_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(FAS_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleFasciaLanes(present, hidden, showHidden);
  const shown = visibleFascia(rows, lanes.includes(mail) || mail === "all" ? mail : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = fasciaLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = fasciaLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingFascia(rows);
  const leadHue = leadingFasciaHue(rows);
  const whole = rows.filter((row) => fasciaLane(row.code)).length;
  const share = fasciaShare(laneFasciaCount(rows, "due"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("fascia-lanes.csv", fasciaLanesCsv(rows));
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
    writeJson(FAS_HIDE_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(FAS_REVIEW_KEY, next);
  }

  return (
    <section className="c4-fascia" aria-label={v4("fasTitle")} data-fascia="1" data-role={role} data-names="1">
      <header className="c4-fascia-mast">
        <p className="c4-fascia-seal" data-logo="mono">{v4("fasLogo")}</p>
        <div>
          <p className="c4-fascia-kicker">{v4("fasSub")}</p>
          <h2 className="c4-title">{v4("fasTitle")}</h2>
        </div>
        <p className="c4-fascia-count">{shown.length}</p>
      </header>
      <p className="c4-fascia-links">
        <Link href={crmv4Href(base, "oge")}>{v4("dcsTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("fasCustomer")}</Link>
      </p>
      <p className="c4-fascia-hint">{v4("fasHint")}</p>
      {viewer && <p className="c4-fascia-note">{v4("fasViewer")}</p>}
      {queue.loading && <p className="c4-fascia-meta">{v4("fasLoading")}</p>}
      {queue.error && <p className="c4-fascia-meta">{v4("fasFailed")}</p>}
      <p className="c4-fascia-meta">{v4("fasLead")} {laneLabel(v4, lead)} · {v4("fasToneLead")} {hueLabel(v4, leadHue)} · {v4("fasShare")} {share}</p>
      <div className="c4-fascia-chart" aria-label={v4("fasChart")}>
        {lines.map((line) => (
          <button key={line.mail} type="button" className="c4-fascia-column" data-on={mail === line.mail ? "1" : "0"} data-lang={line.mail} onClick={() => setMail(mail === line.mail ? "all" : line.mail)}>
            <i style={{ height: `${Math.max(12, Math.round((line.count / peak) * 72))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.mail)}</span>
          </button>
        ))}
      </div>
      <div className="c4-fascia-tools">
        <input ref={searchRef} className="c4-field c4-fascia-search" aria-label={v4("fasSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("fasSearch")} />
        <label className="c4-lab">{v4("fasChart")}<select className="c4-field" aria-label={v4("fasChart")} value={shape} onChange={(event) => setShape(event.target.value as FasciaShape)}>{(Object.keys(SHAPE_KEY) as FasciaShape[]).map((item) => <option key={item} value={item}>{v4(SHAPE_KEY[item])}</option>)}</select></label>
        <button type="button" className="c4-chip" data-on={hue === "gilt" ? "1" : "0"} onClick={() => setHue(hue === "gilt" ? "all" : "gilt")}>{v4("fasGilt")}</button>
        <button type="button" className="c4-chip" data-on={hue === "pearl" ? "1" : "0"} onClick={() => setHue(hue === "pearl" ? "all" : "pearl")}>{v4("fasPearl")}</button>
        <button type="button" className="c4-chip" data-on={hue === "ash" ? "1" : "0"} onClick={() => setHue(hue === "ash" ? "all" : "ash")}>{v4("fasAsh")}</button>
        <button type="button" className="c4-chip" data-on={review === "fresh" ? "1" : "0"} onClick={() => setReview(review === "fresh" ? "all" : "fresh")}>{v4("fasFresh")}</button>
        <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} onClick={() => setReview(review === "reviewed" ? "all" : "reviewed")}>{v4("fasReviewed")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((on) => !on)}>{v4("fasShow")}</button>
        {present.map((lane) => (
          <button key={lane} type="button" className="c4-chip" data-on={hidden.includes(lane) ? "1" : "0"} onClick={() => storeHidden(toggleFascia(hidden, lane))}>{v4("fasHide")} {laneLabel(v4, lane)}</button>
        ))}
      </div>
      <div className="c4-fascia-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkFasciaReview(reviewed, picked, true))}>{v4("fasBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkFasciaReview(reviewed, picked, false))}>{v4("fasBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("fascia-usernames.csv", fasciaRowsCsv(shown, reviewed))}>{v4("fasRowCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("fascia-lanes.csv", fasciaLanesCsv(rows))}>{v4("fasCsv")}</button>
      </div>
      {!shown.length && !queue.loading && <p className="c4-pay-empty">{v4("fasEmpty")}</p>}
      <ul className="c4-fascia-list">
        {shown.map((row) => {
          const tone = fasciaHue(row.code);
          const name = fasciaCopy(row.code);
          return (
            <li key={row.id} className="c4-fascia-card" data-mail={fasciaLane(row.code) || "open"} data-hue={tone || "none"} data-lit={fasciaLit(row.code) ? "1" : "0"} data-near={fasciaNear(row.code) ? "1" : "0"} data-far={fasciaFar(row.code) ? "1" : "0"} data-fade={fasciaFade(row.code) ? "1" : "0"} data-dark={fasciaDark(row.code) ? "1" : "0"} data-dim={fasciaDim(row.code) ? "1" : "0"} data-blank={fasciaBlank(row.code) ? "1" : "0"} data-open={fasciaOpen(row.code) ? "1" : "0"} data-even={fasciaEven(row.code) ? "1" : "0"} data-digit={fasciaDigit(row.code) ? "1" : "0"} data-letter={fasciaLetter(row.code) ? "1" : "0"} data-upper={fasciaUpper(row.code) ? "1" : "0"}>
              <label className="c4-fascia-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-fascia-meta">{name || v4("fasOpen")} · {fasciaStamp(row.code) || "—"} · {fasciaLength(row.code) ?? "—"} · {laneLabel(v4, fasciaLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-fascia-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleFasciaReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("fasReviewed") : v4("fasReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { navigator.clipboard?.writeText(fasciaCopy(row.code)); setCopied(row.id); }}>{copied === row.id ? v4("fasCopied") : v4("fasCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.userId || row.id}`)}>{v4("fasCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
