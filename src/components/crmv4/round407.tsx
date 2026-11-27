"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  EXD_HIDE_KEY,
  EXD_REVIEW_KEY,
  ITR_DENSITY_KEY,
  ITR_KEY,
  ITR_PROFILES,
  ITR_VIEW_KEY,
  addIntrados,
  addIntradosTag,
  addIntradosView,
  bedFocused,
  briskIntrados,
  bulkExtradosReview,
  bulkIntradosLinen,
  bulkIntradosShelf,
  bulkIntradosRaise,
  bulkIntradosTag,
  busiestHand,
  dropIntradosView,
  editIntrados,
  editIntradosNote,
  fairHand,
  extradosBlank,
  extradosCopy,
  extradosDigit,
  extradosEven,
  extradosFar,
  extradosHue,
  extradosLane,
  extradosLanes,
  extradosLanesCsv,
  extradosLength,
  extradosLetter,
  extradosDark,
  extradosDim,
  extradosFade,
  extradosLit,
  extradosOpen,
  extradosRowsCsv,
  extradosShare,
  extradosSlice,
  extradosStamp,
  extradosNear,
  extradosUpper,
  idleIntrados,
  laneExtradosCount,
  lateIntrados,
  leadingExtrados,
  leadingExtradosHue,
  graphiteQuiet,
  lowerDepthFocused,
  lowerHourFocused,
  moveIntradosFocus,
  intradosBars,
  intradosCopy,
  intradosCounts,
  intradosCsv,
  intradosDensity,
  intradosHands,
  intradosTimeline,
  overdueIntrados,
  pinIntradosFocused,
  presentExtradosLanes,
  profileCool,
  profileWarm,
  rackIntradosFocused,
  raiseDepthFocused,
  raiseHourFocused,
  readHiddenExtrados,
  readReviewedExtrados,
  readIntradosViews,
  readIntradosList,
  reminderIntradosList,
  restingIntrados,
  setIntradosFocused,
  setIntradosBed,
  setIntradosPin,
  setIntradosRack,
  setIntradosRaised,
  setIntradosShelf,
  sortIntradosList,
  suggestProfile,
  suggestIntradosBed,
  suggestIntradosHour,
  toggleExtrados,
  toggleExtradosReview,
  visibleExtrados,
  visibleExtradosLanes,
  visibleIntradosList,
  type ExtradosReview,
  type ExtradosRow,
  type ExtradosShape,
  type Intrados,
  type IntradosDensity,
  type IntradosRack,
  type IntradosSort,
  type IntradosView,
} from "@/lib/crmv4/round407";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const BEDS = ["IVORY", "GRAPHITE", "GILT"] as const;
const HOURS = ["1", "3", "6", "12"] as const;
const DEPTHS = ["1", "3", "5"] as const;

const PROFILE_KEY: Record<string, CrmV4CopyKey> = {
  intrados: "itrIntrados",
  soffit: "itrSoffit",
  haunch: "itrHaunch",
  springer: "itrSpringer",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "itrAuditSave",
  edit: "itrAuditEdit",
  note: "itrAuditNote",
  bed: "itrAuditBed",
  raise: "itrAuditRaise",
  free: "itrAuditFree",
  press: "itrAuditPress",
  return: "itrAuditReturn",
  shelf: "itrAuditShelf",
  open: "itrAuditOpen",
  tag: "itrAuditTag",
  depth: "itrAuditDepth",
  hour: "itrAuditHour",
  lower: "itrAuditLower",
  pin: "itrAuditPin",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  live: "exdLaneLive",
  code: "exdLaneCode",
  short: "exdLaneShort",
  long: "exdLaneLong",
  hold: "exdLaneHold",
  shut: "exdLaneShut",
  blank: "exdLaneBlank",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  gilt: "exdGilt",
  pearl: "exdPearl",
  ash: "exdAsh",
};

const SHAPE_KEY: Record<ExtradosShape, CrmV4CopyKey> = {
  all: "exdShapeAll",
  live: "exdShapeLive",
  code: "exdShapeCode",
  short: "exdShapeShort",
  long: "exdShapeLong",
  hold: "exdShapeHold",
  shut: "exdShapeShut",
  blank: "exdShapeBlank",
  open: "exdShapeOpen",
  digit: "exdShapeDigit",
  letter: "exdShapeLetter",
  even: "exdShapeEven",
  upper: "exdShapeUpper",
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
  return key ? v4(key) : v4("itrBlankProfile");
}

function bedLabel(v4: V4, bed: string): string {
  if (bed === "IVORY") return v4("itrLinen");
  if (bed === "GRAPHITE") return v4("itrSlate");
  if (bed === "GILT") return v4("itrGilt");
  return v4("itrAll");
}

function laneLabel(v4: V4, mail: string): string {
  const key = LANE_KEY[mail];
  return key ? v4(key) : v4("exdBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("exdBlank");
}

export function IntradosCourses({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Intrados[]>([]);
  const [views, setViews] = useState<IntradosView[]>([]);
  const [density, setDensity] = useState<IntradosDensity>("open");
  const [rack, setRack] = useState<IntradosRack>("base");
  const [query, setQuery] = useState("");
  const [handFilter, setHandFilter] = useState("");
  const [bedFilter, setBedFilter] = useState("all");
  const [profileFilter, setProfileFilter] = useState("all");
  const [hourFilter, setHourFilter] = useState("all");
  const [depthFilter, setDepthFilter] = useState("all");
  const [sort, setSort] = useState<IntradosSort>("profile");
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
  const [station, setStation] = useState("intrados");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readIntradosList(readJson(ITR_KEY, [])));
    setViews(readIntradosViews(readJson(ITR_VIEW_KEY, [])));
    setDensity(intradosDensity(readJson(ITR_DENSITY_KEY, "open")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Intrados[]) {
    setCards(next);
    writeJson(ITR_KEY, next);
  }
  function storeViews(next: IntradosView[]) {
    setViews(next);
    writeJson(ITR_VIEW_KEY, next);
  }
  function storeDensity(next: IntradosDensity) {
    setDensity(next);
    writeJson(ITR_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortIntradosList(visibleIntradosList(cards, rack, query, handFilter, bedFilter, profileFilter, hourFilter, depthFilter), sort),
    [cards, rack, query, handFilter, bedFilter, profileFilter, hourFilter, depthFilter, sort],
  );
  const counts = intradosCounts(cards, shown, station);
  const bars = intradosBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = intradosTimeline(cards);
  const reminders = reminderIntradosList(cards);
  const hands = intradosHands(cards);
  const busy = busiestHand(cards);
  const fair = fairHand(cards, hands.join(","));
  const suggestedBed = suggestIntradosBed(cards);
  const suggestedHour = suggestIntradosHour(cards, clock);
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
        download("intrados-courses.csv", intradosCsv(shown, station));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((card) => card.id));
        return;
      }
      if (event.key === "j" || event.key === "J") setFocusAt((index) => moveIntradosFocus(index, shown.length, 1));
      if (event.key === "k" || event.key === "K") setFocusAt((index) => moveIntradosFocus(index, shown.length, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, shown, station]);

  function saveCard() {
    if (viewer) return;
    store(addIntrados(cards, { title, note, hand, profile, hour: hourNo, bed, depth: depthNo, tags }));
    setTitle("");
    setNote("");
    setTags("");
  }

  return (
    <section className="c4-intrados" aria-label={v4("itrTitle")} data-intrados="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-intrados-mast">
        <p className="c4-intrados-seal" data-logo="mono">{v4("itrLogo")}</p>
        <div>
          <p className="c4-intrados-kicker">{v4("itrSub")}</p>
          <h2 className="c4-title">{v4("itrTitle")}</h2>
        </div>
        <p className="c4-intrados-count">{shown.length}</p>
      </header>
      <p className="c4-intrados-links">
        <Link href={crmv4Href(base, "exd")}>{v4("exdTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("itrCustomers")}</Link>
      </p>
      <p className="c4-intrados-hint">{v4("itrHint")}</p>
      {viewer && <p className="c4-intrados-note">{v4("itrViewer")}</p>}
      <p className="c4-intrados-meta">{v4("itrFair")} {fair || "—"} · {v4("itrBusy")} {busy || "—"} · {v4("itrSuggest")} {profileLabel(v4, suggestedProfile)} · {bedLabel(v4, suggestedBed)} · {suggestedHour}</p>
      <ol className="c4-intrados-index" aria-label={v4("itrRemind")}>
        <li data-tone="gold">{v4("itrOverdue")} {counts.overdue}</li>
        <li data-tone="pitch">{v4("itrIdle")} {counts.idle}</li>
        <li data-tone="mist">{v4("itrBrisk")} {counts.brisk}</li>
        <li data-tone="mist">{v4("itrResting")} {counts.resting}</li>
      </ol>
      {reminders.length > 0 && (
        <ul className="c4-intrados-remind c4-intrados-notices" role="status" aria-label={v4("itrRemind")}>
          {reminders.map((name) => <li key={name}>{v4("itrOverdue")} {name}</li>)}
        </ul>
      )}
      <div className="c4-intrados-chart" aria-label={v4("itrChart")}>
        {bars.map((bar) => (
          <button key={bar.profile} type="button" className="c4-intrados-column" data-on={profileFilter === bar.profile ? "1" : "0"} onClick={() => setProfileFilter(profileFilter === bar.profile ? "all" : bar.profile)}>
            <i style={{ width: `${Math.max(18, Math.round((bar.count / peak) * 100))}%` }} />
            <strong>{bar.count}</strong>
            <span>{profileLabel(v4, bar.profile)}</span>
          </button>
        ))}
      </div>
      <form className="c4-intrados-form" onSubmit={(event) => { event.preventDefault(); saveCard(); }}>
        <label className="c4-lab">{v4("itrEdit")}<input ref={titleRef} className="c4-field" aria-label={v4("itrEdit")} value={title} maxLength={48} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("itrNote")}<input className="c4-field" aria-label={v4("itrNote")} aria-required={false} value={note} maxLength={80} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("itrHand")}<input className="c4-field" aria-label={v4("itrHand")} aria-required={false} value={hand} maxLength={24} disabled={viewer} onChange={(event) => setHand(event.target.value)} /></label>
        <label className="c4-lab">{v4("itrProfile")}<select className="c4-field" aria-label={v4("itrProfile")} value={profile} disabled={viewer} onChange={(event) => setProfile(event.target.value)}><option value="">{v4("itrBlankProfile")}</option>{ITR_PROFILES.map((item) => <option key={item} value={item}>{profileLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("itrBed")}<select className="c4-field" aria-label={v4("itrBed")} value={bed} disabled={viewer} onChange={(event) => setBed(event.target.value)}><option value="">{v4("itrAll")}</option>{BEDS.map((item) => <option key={item} value={item}>{bedLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("itrHour")}<select className="c4-field" aria-label={v4("itrHour")} value={hourNo} disabled={viewer} onChange={(event) => setHourNo(event.target.value)}><option value="">{v4("itrAll")}</option>{HOURS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("itrDepth")}<select className="c4-field" aria-label={v4("itrDepth")} value={depthNo} disabled={viewer} onChange={(event) => setDepthNo(event.target.value)}><option value="">{v4("itrAll")}</option>{DEPTHS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("itrTag")}<input className="c4-field" aria-label={v4("itrTag")} aria-required={false} value={tags} maxLength={8} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("itrAdd")}</button>
      </form>
      <div className="c4-intrados-tools">
        <input ref={searchRef} className="c4-field c4-intrados-search" aria-label={v4("itrSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("itrSearch")} />
        {(["base", "press", "shelf"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={rack === item ? "1" : "0"} onClick={() => setRack(item)}>{v4(item === "base" ? "itrYard" : item === "press" ? "itrPress" : "itrShelf")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={profileFilter === "warm" ? "1" : "0"} onClick={() => setProfileFilter(profileFilter === "warm" ? "all" : "warm")}>{v4("itrWarm")}</button>
        <button type="button" className="c4-chip" data-on={profileFilter === "cool" ? "1" : "0"} onClick={() => setProfileFilter(profileFilter === "cool" ? "all" : "cool")}>{v4("itrCool")}</button>
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
        <button type="button" className="c4-chip" data-on={sort === "hand" ? "1" : "0"} onClick={() => setSort(sort === "hand" ? "profile" : "hand")}>{sort === "hand" ? v4("itrSortHand") : v4("itrSortProfile")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "tight" ? "open" : "tight")}>{density === "tight" ? v4("itrTight") : v4("itrOpenDensity")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("itrTimeline")}</button>
        <label className="c4-lab">{v4("itrDesk")}<select className="c4-field" aria-label={v4("itrDesk")} value={station} onChange={(event) => setStation(event.target.value)}>{ITR_PROFILES.map((item) => <option key={item} value={item}>{profileLabel(v4, item)}</option>)}</select></label>
      </div>
      <form className="c4-intrados-view" onSubmit={(event) => {
        event.preventDefault();
        const id = `v${Date.now().toString(36)}`;
        storeViews(addIntradosView(views, { id, name: viewName, rack, query, hand: handFilter, bed: bedFilter, profile: profileFilter, hour: hourFilter, depth: depthFilter }));
        setViewName("");
      }}>
        <label className="c4-lab">{v4("itrViewName")}<input className="c4-field" aria-label={v4("itrViewName")} aria-required={false} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn">{v4("itrSaveView")}</button>
      </form>
      <ul className="c4-intrados-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setRack(view.rack); setQuery(view.query); setHandFilter(view.hand); setBedFilter(view.bed); setProfileFilter(view.profile); setHourFilter(view.hour); setDepthFilter(view.depth); }}>{v4("itrApply")} {view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropIntradosView(views, view.id))}>{v4("itrDropView")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-intrados-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkIntradosRaise(cards, picked))}>{v4("itrBulkRaise")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkIntradosShelf(cards, picked))}>{v4("itrBulkArchive")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkIntradosLinen(cards, picked))}>{v4("itrBulkLinen")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkIntradosTag(cards, picked))}>{v4("itrBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("intrados-courses.csv", intradosCsv(shown, station))}>{v4("itrCsv")}</button>
        <p className="c4-intrados-meta">{v4("itrKeys")} / c x a j k · {v4("itrQuiet")} {counts.quiet} · {v4("itrWarm")} {counts.warm}</p>
      </div>
      {board === "timeline" && (
        <ol className="c4-intrados-time" aria-label={v4("itrTimeline")}>
          {timeline.map((row) => <li key={row.hour}><span>{row.hour}</span> {row.titles.join(", ")}</li>)}
        </ol>
      )}
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("itrEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-intrados-list">
          {shown.map((card) => {
            const late = lateIntrados(card, station);
            return (
              <li key={card.id} className="c4-intrados-card" data-on={focused?.id === card.id ? "1" : "0"} data-late={late ? "1" : "0"} data-idle={idleIntrados(card) ? "1" : "0"} data-brisk={briskIntrados(card) ? "1" : "0"} data-overdue={overdueIntrados(card) ? "1" : "0"} data-resting={restingIntrados(card) ? "1" : "0"} data-warm={profileWarm(card.profile) ? "1" : "0"} data-cool={profileCool(card.profile) ? "1" : "0"} data-quiet={graphiteQuiet(card.bed) ? "1" : "0"}>
                <label className="c4-intrados-pick">
                  <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                </label>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editIntrados(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("itrEdit")} value={draft} maxLength={48} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("itrApply")}</button>
                    </form>
                  ) : <p>{card.title}</p>}
                  <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editIntradosNote(cards, card.id, noteId === card.id ? noteDraft : card.note)); }}>
                    <input className="c4-field" aria-label={v4("itrNote")} aria-required={false} value={noteId === card.id ? noteDraft : card.note} maxLength={80} disabled={viewer} onChange={(event) => { setNoteId(card.id); setNoteDraft(event.target.value); }} onFocus={() => { setNoteId(card.id); setNoteDraft(card.note); }} />
                  </form>
                  <p className="c4-intrados-meta">{profileLabel(v4, card.profile)} · {bedLabel(v4, card.bed)} · {card.hour ?? "—"} · {card.depth} · {card.hand || "—"} · {card.tags.join(" ") || "—"}{card.audit ? ` · ${v4(AUDIT_KEY[card.audit] || "itrAuditSave")}` : ""}{late ? ` · ${v4("itrOverdue")}` : ""}</p>
                </div>
                <div className="c4-intrados-actions">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("itrEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setIntradosRaised(cards, card.id, !card.raised))}>{card.raised ? v4("itrFree") : v4("itrRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setIntradosBed(cards, card.id, suggestedBed))}>{v4("itrSuggest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setIntradosRack(cards, card.id, !card.pressed))}>{card.pressed ? v4("itrUnpress") : v4("itrPressIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setIntradosShelf(cards, card.id, !card.shelved))}>{card.shelved ? v4("itrUnshelf") : v4("itrShelfIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setIntradosPin(cards, card.id, !card.pinned))}>{card.pinned ? v4("itrUnpin") : v4("itrPin")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addIntradosTag(cards, card.id, "i"))}>{v4("itrTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseHourFocused(cards, card.id))}>{v4("itrRaiseHour")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerHourFocused(cards, card.id))}>{v4("itrLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseDepthFocused(cards, card.id))}>{v4("itrDepth")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerDepthFocused(cards, card.id))}>{v4("itrDepth")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(bedFocused(cards, card.id))}>{v4("itrBed")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setIntradosFocused(cards, card.id))}>{v4("itrRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(rackIntradosFocused(cards, card.id))}>{v4("itrPress")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(pinIntradosFocused(cards, card.id))}>{v4("itrPin")}</button>
                  <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(intradosCopy(card))}>{v4("itrCopy")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

type GroupUser = { id?: string; name?: string | null; deskId?: unknown };

export function ExtradosPlates({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: GroupUser[] }>("/api/admin/users?take=24&meta=0");
  const [mail, setMail] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<ExtradosShape>("all");
  const [review, setReview] = useState<ExtradosReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): ExtradosRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      userId: id,
      code: extradosSlice(row),
    };
  }).filter((row): row is ExtradosRow => Boolean(row));
  const present = presentExtradosLanes(rows);
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
    const next = readHiddenExtrados(readJson(EXD_HIDE_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(EXD_HIDE_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedExtrados(readJson(EXD_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(EXD_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleExtradosLanes(present, hidden, showHidden);
  const shown = visibleExtrados(rows, lanes.includes(mail) || mail === "all" ? mail : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = extradosLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = extradosLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingExtrados(rows);
  const leadHue = leadingExtradosHue(rows);
  const whole = rows.filter((row) => extradosLane(row.code)).length;
  const share = extradosShare(laneExtradosCount(rows, "live"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("extrados-desk-lanes.csv", extradosLanesCsv(rows));
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
    writeJson(EXD_HIDE_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(EXD_REVIEW_KEY, next);
  }

  return (
    <section className="c4-extrados" aria-label={v4("exdTitle")} data-extrados="1" data-role={role} data-desk="1">
      <header className="c4-extrados-mast">
        <p className="c4-extrados-seal" data-logo="mono">{v4("exdLogo")}</p>
        <div>
          <p className="c4-extrados-kicker">{v4("exdSub")}</p>
          <h2 className="c4-title">{v4("exdTitle")}</h2>
        </div>
        <p className="c4-extrados-count">{shown.length}</p>
      </header>
      <p className="c4-extrados-links">
        <Link href={crmv4Href(base, "itr")}>{v4("itrTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("exdCustomer")}</Link>
      </p>
      <p className="c4-extrados-hint">{v4("exdHint")}</p>
      {viewer && <p className="c4-extrados-note">{v4("exdViewer")}</p>}
      {queue.loading && <p className="c4-extrados-meta">{v4("exdLoading")}</p>}
      {queue.error && <p className="c4-extrados-meta">{v4("exdFailed")}</p>}
      <p className="c4-extrados-meta">{v4("exdLead")} {laneLabel(v4, lead)} · {v4("exdToneLead")} {hueLabel(v4, leadHue)} · {v4("exdShare")} {share}</p>
      <div className="c4-extrados-chart" aria-label={v4("exdChart")}>
        {lines.map((line) => (
          <button key={line.mail} type="button" className="c4-extrados-column" data-on={mail === line.mail ? "1" : "0"} data-lang={line.mail} onClick={() => setMail(mail === line.mail ? "all" : line.mail)}>
            <i style={{ width: `${Math.max(18, Math.round((line.count / peak) * 100))}%` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.mail)}</span>
          </button>
        ))}
      </div>
      <div className="c4-extrados-tools">
        <input ref={searchRef} className="c4-field c4-extrados-search" aria-label={v4("exdSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("exdSearch")} />
        <label className="c4-lab">{v4("exdChart")}<select className="c4-field" aria-label={v4("exdChart")} value={shape} onChange={(event) => setShape(event.target.value as ExtradosShape)}>{(Object.keys(SHAPE_KEY) as ExtradosShape[]).map((item) => <option key={item} value={item}>{v4(SHAPE_KEY[item])}</option>)}</select></label>
        <button type="button" className="c4-chip" data-on={hue === "gilt" ? "1" : "0"} onClick={() => setHue(hue === "gilt" ? "all" : "gilt")}>{v4("exdGilt")}</button>
        <button type="button" className="c4-chip" data-on={hue === "pearl" ? "1" : "0"} onClick={() => setHue(hue === "pearl" ? "all" : "pearl")}>{v4("exdPearl")}</button>
        <button type="button" className="c4-chip" data-on={hue === "ash" ? "1" : "0"} onClick={() => setHue(hue === "ash" ? "all" : "ash")}>{v4("exdAsh")}</button>
        <button type="button" className="c4-chip" data-on={review === "fresh" ? "1" : "0"} onClick={() => setReview(review === "fresh" ? "all" : "fresh")}>{v4("exdFresh")}</button>
        <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} onClick={() => setReview(review === "reviewed" ? "all" : "reviewed")}>{v4("exdReviewed")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((on) => !on)}>{v4("exdShow")}</button>
        {present.map((lane) => (
          <button key={lane} type="button" className="c4-chip" data-on={hidden.includes(lane) ? "1" : "0"} onClick={() => storeHidden(toggleExtrados(hidden, lane))}>{v4("exdHide")} {laneLabel(v4, lane)}</button>
        ))}
      </div>
      <div className="c4-extrados-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkExtradosReview(reviewed, picked, true))}>{v4("exdBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkExtradosReview(reviewed, picked, false))}>{v4("exdBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("extrados-desks.csv", extradosRowsCsv(shown, reviewed))}>{v4("exdRowCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("extrados-desk-marks.csv", extradosLanesCsv(rows))}>{v4("exdCsv")}</button>
      </div>
      {!shown.length && !queue.loading && <p className="c4-pay-empty">{v4("exdEmpty")}</p>}
      <ul className="c4-extrados-list">
        {shown.map((row) => {
          const tone = extradosHue(row.code);
          const name = extradosCopy(row.code);
          return (
            <li key={row.id} className="c4-extrados-card" data-mail={extradosLane(row.code) || "open"} data-hue={tone || "none"} data-lit={extradosLit(row.code) ? "1" : "0"} data-figure={extradosNear(row.code) ? "1" : "0"} data-short={extradosFar(row.code) ? "1" : "0"} data-long={extradosFade(row.code) ? "1" : "0"} data-dark={extradosDark(row.code) ? "1" : "0"} data-dim={extradosDim(row.code) ? "1" : "0"} data-blank={extradosBlank(row.code) ? "1" : "0"} data-open={extradosOpen(row.code) ? "1" : "0"} data-even={extradosEven(row.code) ? "1" : "0"} data-digit={extradosDigit(row.code) ? "1" : "0"} data-letter={extradosLetter(row.code) ? "1" : "0"} data-upper={extradosUpper(row.code) ? "1" : "0"}>
              <label className="c4-extrados-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-extrados-meta">{name || v4("exdOpen")} · {extradosStamp(row.code) || "—"} · {extradosLength(row.code) ?? "—"} · {laneLabel(v4, extradosLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-extrados-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleExtradosReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("exdReviewed") : v4("exdReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { navigator.clipboard?.writeText(extradosCopy(row.code)); setCopied(row.id); }}>{copied === row.id ? v4("exdCopied") : v4("exdCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.userId || row.id}`)}>{v4("exdCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
