"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { crmv4Href } from "@/lib/crmv4/sections";
import {
  CRT_DENSITY_KEY,
  CRT_HANDS,
  CRT_KEY,
  CRT_VIEW_KEY,
  GSA_HIDE_KEY,
  GSA_REVIEW_KEY,
  addCartouche,
  addCartoucheTag,
  addCartoucheView,
  briskCartouche,
  bulkCartoucheCoffer,
  bulkCartoucheGraphite,
  bulkCartoucheRaise,
  bulkCartoucheTag,
  bulkGsaReview,
  busiestCarver,
  cartoucheBars,
  cartoucheCarvers,
  cartoucheCopy,
  cartoucheCounts,
  cartoucheCsv,
  cartoucheDensity,
  cartoucheTimeline,
  clipCartoucheFocused,
  dropCartoucheView,
  editCartouche,
  editCartoucheNote,
  fairCarver,
  filmFocused,
  gsaBare,
  gsaBrief,
  gsaCopy,
  gsaDesk,
  gsaDigit,
  gsaEven,
  gsaFamily,
  gsaFirst,
  gsaHeld,
  gsaHue,
  gsaLane,
  gsaLanes,
  gsaLanesCsv,
  gsaLater,
  gsaLength,
  gsaLetter,
  gsaLine,
  gsaLower,
  gsaMixed,
  gsaOpen,
  gsaPair,
  gsaReturn,
  gsaRowsCsv,
  gsaScope,
  gsaShare,
  gsaShut,
  gsaSpace,
  gsaSpanLane,
  gsaStamp,
  gsaTail,
  gsaUpper,
  gsaVowel,
  graphiteQuiet,
  handCool,
  handWarm,
  idleCartouche,
  laneGsaCount,
  lateCartouche,
  leadingGsa,
  leadingGsaHue,
  lowerRibFocused,
  lowerSpanFocused,
  moveCartoucheFocus,
  overdueCartouche,
  presentGsaLanes,
  raiseRibFocused,
  raiseSpanFocused,
  readCartoucheViews,
  readCartouches,
  readHiddenGsa,
  readReviewedGsa,
  reminderCartouches,
  restingCartouche,
  setCartoucheClip,
  setCartoucheCoffer,
  setCartoucheFilm,
  setCartoucheFocused,
  setCartoucheRaised,
  setCartoucheStar,
  sortCartouches,
  starCartoucheFocused,
  suggestFilm,
  suggestHand,
  suggestSpan,
  toggleGsa,
  toggleGsaReview,
  visibleCartouches,
  visibleGsa,
  visibleGsaLanes,
  type Cartouche,
  type CartoucheDensity,
  type CartoucheSort,
  type CartoucheTray,
  type CartoucheView,
  type GsaReview,
  type GsaRow,
  type GsaShape,
  type GsaValue,
} from "@/lib/crmv4/round378";
import { storedRole } from "./round5";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

const FILMS = ["IVORY", "GRAPHITE", "CHAMPAGNE"] as const;
const SPANS = ["10", "20", "40", "80"] as const;
const RIBS = ["3", "5", "7"] as const;

const HAND_KEY: Record<string, CrmV4CopyKey> = {
  pomme: "crtPomme",
  lance: "crtLance",
  feuille: "crtFeuille",
  alpha: "crtAlpha",
};

const AUDIT_KEY: Record<string, CrmV4CopyKey> = {
  save: "crtAuditSave",
  edit: "crtAuditEdit",
  note: "crtAuditNote",
  film: "crtAuditFilm",
  raise: "crtAuditRaise",
  free: "crtAuditFree",
  pin: "crtAuditPin",
  return: "crtAuditReturn",
  vault: "crtAuditVault",
  open: "crtAuditOpen",
  tag: "crtAuditTag",
  bead: "crtAuditBead",
  sla: "crtAuditSla",
  lower: "crtAuditLower",
  star: "crtAuditStar",
};

const LANE_KEY: Record<string, CrmV4CopyKey> = {
  line: "gsaLaneLine",
  shut: "gsaLaneShut",
  later: "gsaLaneLater",
  desk: "gsaLaneDesk",
  return: "gsaLaneReturn",
  pair: "gsaPair",
  scope: "gsaScope",
  brief: "gsaBrief",
  span: "gsaSpan",
  digit: "gsaStampLane",
  openv: "gsaShapeVowel",
  bare: "gsaBare",
};

const HUE_KEY: Record<string, CrmV4CopyKey> = {
  champagne: "gsaChampagne",
  ivory: "gsaIvory",
  graphite: "gsaGraphite",
};

const SHAPE_KEY: Record<GsaShape, CrmV4CopyKey> = {
  all: "gsaShapeAll",
  line: "gsaShapeLine",
  shut: "gsaShapeShut",
  later: "gsaShapeLater",
  return: "gsaShapeReturn",
  pair: "gsaShapePair",
  scope: "gsaShapeScope",
  brief: "gsaShapeBrief",
  span: "gsaShapeSpan",
  digit: "gsaShapeDigit",
  openv: "gsaShapeVowel",
  bare: "gsaShapeBare",
  open: "gsaShapeOpen",
  soon: "gsaShapeOpen",
  letter: "gsaShapeBare",
  mixed: "gsaShapeDigit",
  upper: "gsaShapeUpper",
  lower: "gsaShapeBare",
  space: "gsaShapeSpace",
  even: "gsaShapeEven",
  odd: "gsaShapeEven",
  tail: "gsaShapeDigit",
  first: "gsaShapeBare",
  held: "gsaShapeSpan",
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

function handLabel(v4: V4, hand: string): string {
  const key = HAND_KEY[hand];
  return key ? v4(key) : v4("crtBlankHand");
}

function filmLabel(v4: V4, film: string): string {
  if (film === "IVORY") return v4("crtIvory");
  if (film === "GRAPHITE") return v4("crtGraphite");
  if (film === "CHAMPAGNE") return v4("crtChampagne");
  return v4("crtAll");
}

function laneLabel(v4: V4, mail: string): string {
  const key = LANE_KEY[mail];
  return key ? v4(key) : v4("gsaBlank");
}

function hueLabel(v4: V4, hue: string): string {
  const key = HUE_KEY[hue];
  return key ? v4(key) : v4("gsaBlank");
}

export function CartoucheRules({ base, v4 }: { base: string; v4: V4 }) {
  const [cards, setCards] = useState<Cartouche[]>([]);
  const [views, setViews] = useState<CartoucheView[]>([]);
  const [density, setDensity] = useState<CartoucheDensity>("open");
  const [tray, setTray] = useState<CartoucheTray>("tablet");
  const [query, setQuery] = useState("");
  const [carverFilter, setCarverFilter] = useState("");
  const [filmFilter, setFilmFilter] = useState("all");
  const [handFilter, setHandFilter] = useState("all");
  const [slaFilter, setSlaFilter] = useState("all");
  const [ribFilter, setRibFilter] = useState("all");
  const [sort, setSort] = useState<CartoucheSort>("hand");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [carver, setCarver] = useState("");
  const [hand, setHand] = useState("");
  const [film, setFilm] = useState("");
  const [slaNo, setSlaNo] = useState("");
  const [ribNo, setRibNo] = useState("");
  const [tags, setTags] = useState("");
  const [viewName, setViewName] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [focusAt, setFocusAt] = useState(0);
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [noteId, setNoteId] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [station, setStation] = useState("pomme");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [board, setBoard] = useState<"cards" | "timeline">("cards");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const clock = new Date().getUTCHours();

  useEffect(() => {
    setCards(readCartouches(readJson(CRT_KEY, [])));
    setViews(readCartoucheViews(readJson(CRT_VIEW_KEY, [])));
    setDensity(cartoucheDensity(readJson(CRT_DENSITY_KEY, "open")));
    setRole(storedRole() === "viewer" ? "viewer" : "desk");
    function onRole(event: Event) {
      const detail = (event as CustomEvent).detail;
      setRole(detail === "viewer" ? "viewer" : "desk");
    }
    window.addEventListener("crmv4:role", onRole);
    return () => window.removeEventListener("crmv4:role", onRole);
  }, []);

  function store(next: Cartouche[]) {
    setCards(next);
    writeJson(CRT_KEY, next);
  }
  function storeViews(next: CartoucheView[]) {
    setViews(next);
    writeJson(CRT_VIEW_KEY, next);
  }
  function storeDensity(next: CartoucheDensity) {
    setDensity(next);
    writeJson(CRT_DENSITY_KEY, next);
  }

  const shown = useMemo(
    () => sortCartouches(visibleCartouches(cards, tray, query, carverFilter, filmFilter, handFilter, slaFilter, ribFilter), sort),
    [cards, tray, query, carverFilter, filmFilter, handFilter, slaFilter, ribFilter, sort],
  );
  const counts = cartoucheCounts(cards, shown, station);
  const bars = cartoucheBars(cards);
  const peak = Math.max(1, ...bars.map((bar) => bar.count));
  const timeline = cartoucheTimeline(cards);
  const reminders = reminderCartouches(cards);
  const carvers = cartoucheCarvers(cards);
  const busy = busiestCarver(cards);
  const fair = fairCarver(cards, carvers.join(","));
  const suggestedFilm = suggestFilm(cards);
  const suggestedSla = suggestSpan(cards, clock);
  const suggestedHand = suggestHand(clock);
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
        download("cartouches.csv", cartoucheCsv(shown, station));
        return;
      }
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        setPicked(shown.map((card) => card.id));
        return;
      }
      if (event.key === "j" || event.key === "J") setFocusAt((index) => moveCartoucheFocus(index, shown.length, 1));
      if (event.key === "k" || event.key === "K") setFocusAt((index) => moveCartoucheFocus(index, shown.length, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, shown, station]);

  function saveCard() {
    if (viewer) return;
    store(addCartouche(cards, { title, note, carver, hand, sla: slaNo, film, rib: ribNo, tags }));
    setTitle("");
    setNote("");
    setTags("");
  }

  return (
    <section className="c4-cartouche" aria-label={v4("crtTitle")} data-cards="1" data-role={role} data-density={density} data-focus={focused?.id || ""}>
      <header className="c4-cartouche-mast">
        <p className="c4-cartouche-seal" data-logo="mono">{v4("crtLogo")}</p>
        <div>
          <p className="c4-cartouche-kicker">{v4("crtSub")}</p>
          <h2 className="c4-title">{v4("crtTitle")}</h2>
        </div>
        <p className="c4-cartouche-count">{shown.length}</p>
      </header>
      <p className="c4-cartouche-links">
        <Link href={crmv4Href(base, "gsa")}>{v4("gsaTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("crtCustomers")}</Link>
      </p>
      <p className="c4-cartouche-hint">{v4("crtHint")}</p>
      {viewer && <p className="c4-cartouche-note">{v4("crtViewer")}</p>}
      <p className="c4-cartouche-meta">{v4("crtFair")} {fair || "—"} · {v4("crtBusy")} {busy || "—"} · {v4("crtSuggest")} {handLabel(v4, suggestedHand)} · {filmLabel(v4, suggestedFilm)} · {suggestedSla}</p>
      <ol className="c4-cartouche-index" aria-label={v4("crtRemind")}>
        <li data-tone="gold">{v4("crtOverdue")} {counts.overdue}</li>
        <li data-tone="ink">{v4("crtIdle")} {counts.idle}</li>
        <li data-tone="ivory">{v4("crtBrisk")} {counts.brisk}</li>
        <li data-tone="ivory">{v4("crtResting")} {counts.resting}</li>
      </ol>
      {reminders.length > 0 && (
        <ul className="c4-cartouche-remind c4-cartouche-notices" role="status" aria-label={v4("crtRemind")}>
          {reminders.map((name) => <li key={name}>{v4("crtOverdue")} {name}</li>)}
        </ul>
      )}
      <div className="c4-cartouche-chart" aria-label={v4("crtChart")}>
        {bars.map((bar) => (
          <button key={bar.hand} type="button" className="c4-cartouche-column" data-on={handFilter === bar.hand ? "1" : "0"} onClick={() => setHandFilter(handFilter === bar.hand ? "all" : bar.hand)}>
            <i style={{ height: `${Math.max(18, Math.round((bar.count / peak) * 88))}px` }} />
            <strong>{bar.count}</strong>
            <span>{handLabel(v4, bar.hand)}</span>
          </button>
        ))}
      </div>
      <form className="c4-cartouche-form" onSubmit={(event) => { event.preventDefault(); saveCard(); }}>
        <label className="c4-lab">{v4("crtEdit")}<input ref={titleRef} className="c4-field" aria-label={v4("crtEdit")} value={title} maxLength={48} disabled={viewer} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="c4-lab">{v4("crtNote")}<input className="c4-field" aria-label={v4("crtNote")} aria-required={false} value={note} maxLength={80} disabled={viewer} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="c4-lab">{v4("crtCarver")}<input className="c4-field" aria-label={v4("crtCarver")} aria-required={false} value={carver} maxLength={24} disabled={viewer} onChange={(event) => setCarver(event.target.value)} /></label>
        <label className="c4-lab">{v4("crtHand")}<select className="c4-field" aria-label={v4("crtHand")} value={hand} disabled={viewer} onChange={(event) => setHand(event.target.value)}><option value="">{v4("crtBlankHand")}</option>{CRT_HANDS.map((item) => <option key={item} value={item}>{handLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("crtFilm")}<select className="c4-field" aria-label={v4("crtFilm")} value={film} disabled={viewer} onChange={(event) => setFilm(event.target.value)}><option value="">{v4("crtAll")}</option>{FILMS.map((item) => <option key={item} value={item}>{filmLabel(v4, item)}</option>)}</select></label>
        <label className="c4-lab">{v4("crtSpan")}<select className="c4-field" aria-label={v4("crtSpan")} value={slaNo} disabled={viewer} onChange={(event) => setSlaNo(event.target.value)}><option value="">{v4("crtAll")}</option>{SPANS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("crtRib")}<select className="c4-field" aria-label={v4("crtRib")} value={ribNo} disabled={viewer} onChange={(event) => setRibNo(event.target.value)}><option value="">{v4("crtAll")}</option>{RIBS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="c4-lab">{v4("crtTag")}<input className="c4-field" aria-label={v4("crtTag")} aria-required={false} value={tags} maxLength={8} disabled={viewer} onChange={(event) => setTags(event.target.value)} /></label>
        <button type="submit" className="c4-btn" disabled={viewer}>{v4("crtAdd")}</button>
      </form>
      <div className="c4-cartouche-tools">
        <input ref={searchRef} className="c4-field c4-cartouche-search" aria-label={v4("crtSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("crtSearch")} />
        {(["tablet", "clip", "coffer"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tray === item ? "1" : "0"} onClick={() => setTray(item)}>{v4(item === "tablet" ? "crtTablet" : item === "clip" ? "crtClip" : "crtCoffer")}</button>
        ))}
        <button type="button" className="c4-chip" data-on={handFilter === "warm" ? "1" : "0"} onClick={() => setHandFilter(handFilter === "warm" ? "all" : "warm")}>{v4("crtWarm")}</button>
        <button type="button" className="c4-chip" data-on={handFilter === "cool" ? "1" : "0"} onClick={() => setHandFilter(handFilter === "cool" ? "all" : "cool")}>{v4("crtCool")}</button>
        {FILMS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={filmFilter === item ? "1" : "0"} onClick={() => setFilmFilter(filmFilter === item ? "all" : item)}>{filmLabel(v4, item)}</button>
        ))}
        {SPANS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={slaFilter === item ? "1" : "0"} onClick={() => setSlaFilter(slaFilter === item ? "all" : item)}>{item}</button>
        ))}
        {RIBS.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={ribFilter === item ? "1" : "0"} onClick={() => setRibFilter(ribFilter === item ? "all" : item)}>{item}</button>
        ))}
        {carvers.map((name) => (
          <button key={name} type="button" className="c4-chip" data-on={carverFilter === name ? "1" : "0"} onClick={() => setCarverFilter(carverFilter === name ? "" : name)}>{name}</button>
        ))}
        <button type="button" className="c4-chip" data-on={sort === "carver" ? "1" : "0"} onClick={() => setSort(sort === "carver" ? "hand" : "carver")}>{sort === "carver" ? v4("crtSortCarver") : v4("crtSortHand")}</button>
        <button type="button" className="c4-chip" data-on={density === "tight" ? "1" : "0"} onClick={() => storeDensity(density === "tight" ? "open" : "tight")}>{density === "tight" ? v4("crtTight") : v4("crtOpen")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} onClick={() => setBoard(board === "timeline" ? "cards" : "timeline")}>{v4("crtTimeline")}</button>
        <label className="c4-lab">{v4("crtDesk")}<select className="c4-field" aria-label={v4("crtDesk")} value={station} onChange={(event) => setStation(event.target.value)}>{CRT_HANDS.map((item) => <option key={item} value={item}>{handLabel(v4, item)}</option>)}</select></label>
      </div>
      <form className="c4-cartouche-view" onSubmit={(event) => {
        event.preventDefault();
        const id = `v${Date.now().toString(36)}`;
        storeViews(addCartoucheView(views, { id, name: viewName, tray, query, carver: carverFilter, film: filmFilter, hand: handFilter, sla: slaFilter, rib: ribFilter }));
        setViewName("");
      }}>
        <label className="c4-lab">{v4("crtViewName")}<input className="c4-field" aria-label={v4("crtViewName")} aria-required={false} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} /></label>
        <button type="submit" className="c4-btn">{v4("crtSaveView")}</button>
      </form>
      <ul className="c4-cartouche-views">
        {views.map((view) => (
          <li key={view.id}>
            <button type="button" className="c4-btn" onClick={() => { setTray(view.tray); setQuery(view.query); setCarverFilter(view.carver); setFilmFilter(view.film); setHandFilter(view.hand); setSlaFilter(view.sla); setRibFilter(view.rib); }}>{v4("crtApply")} {view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropCartoucheView(views, view.id))}>{v4("crtDropView")}</button>
          </li>
        ))}
      </ul>
      <div className="c4-cartouche-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkCartoucheRaise(cards, picked))}>{v4("crtBulkRaise")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkCartoucheCoffer(cards, picked))}>{v4("crtBulkCoffer")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkCartoucheGraphite(cards, picked))}>{v4("crtBulkGraphite")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => store(bulkCartoucheTag(cards, picked))}>{v4("crtBulkTag")}</button>
        <button type="button" className="c4-btn" onClick={() => download("cartouches.csv", cartoucheCsv(shown, station))}>{v4("crtCsv")}</button>
        <p className="c4-cartouche-meta">{v4("crtKeys")} / c x a j k · {v4("crtQuiet")} {counts.quiet} · {v4("crtWarm")} {counts.warm}</p>
      </div>
      {board === "timeline" && (
        <ol className="c4-cartouche-time" aria-label={v4("crtTimeline")}>
          {timeline.map((row) => <li key={row.sla}><span>{row.sla}</span> {row.titles.join(", ")}</li>)}
        </ol>
      )}
      {board === "cards" && !shown.length && <p className="c4-pay-empty">{v4("crtEmpty")}</p>}
      {board === "cards" && (
        <ul className="c4-cartouche-list">
          {shown.map((card) => {
            const late = lateCartouche(card, station);
            return (
              <li key={card.id} className="c4-cartouche-card" data-on={focused?.id === card.id ? "1" : "0"} data-late={late ? "1" : "0"} data-idle={idleCartouche(card) ? "1" : "0"} data-brisk={briskCartouche(card) ? "1" : "0"} data-overdue={overdueCartouche(card) ? "1" : "0"} data-resting={restingCartouche(card) ? "1" : "0"} data-warm={handWarm(card.hand) ? "1" : "0"} data-cool={handCool(card.hand) ? "1" : "0"} data-quiet={graphiteQuiet(card.film) ? "1" : "0"}>
                <label className="c4-cartouche-pick">
                  <input type="checkbox" aria-label={card.title} checked={picked.includes(card.id)} onChange={() => setPicked((ids) => ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id])} />
                </label>
                <div>
                  {editing === card.id ? (
                    <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editCartouche(cards, card.id, draft)); setEditing(""); }}>
                      <input className="c4-field" aria-label={v4("crtEdit")} value={draft} maxLength={48} disabled={viewer} onChange={(event) => setDraft(event.target.value)} />
                      <button type="submit" className="c4-btn" disabled={viewer}>{v4("crtApply")}</button>
                    </form>
                  ) : <p>{card.title}</p>}
                  <form onSubmit={(event) => { event.preventDefault(); if (viewer) return; store(editCartoucheNote(cards, card.id, noteId === card.id ? noteDraft : card.note)); }}>
                    <input className="c4-field" aria-label={v4("crtNote")} aria-required={false} value={noteId === card.id ? noteDraft : card.note} maxLength={80} disabled={viewer} onChange={(event) => { setNoteId(card.id); setNoteDraft(event.target.value); }} onFocus={() => { setNoteId(card.id); setNoteDraft(card.note); }} />
                  </form>
                  <p className="c4-cartouche-meta">{handLabel(v4, card.hand)} · {filmLabel(v4, card.film)} · {card.sla ?? "—"} · {card.rib} · {card.carver || "—"} · {card.tags.join(" ") || "—"}{card.audit ? ` · ${v4(AUDIT_KEY[card.audit] || "crtAuditSave")}` : ""}{late ? ` · ${v4("crtOverdue")}` : ""}</p>
                </div>
                <div className="c4-cartouche-actions">
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => { setEditing(card.id); setDraft(card.title); }}>{v4("crtEdit")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCartoucheRaised(cards, card.id, !card.raised))}>{card.raised ? v4("crtFree") : v4("crtRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCartoucheFilm(cards, card.id, suggestedFilm))}>{v4("crtSuggest")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCartoucheClip(cards, card.id, !card.clipped))}>{card.clipped ? v4("crtUnclip") : v4("crtClipIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCartoucheCoffer(cards, card.id, !card.coffered))}>{card.coffered ? v4("crtUncoffer") : v4("crtCofferIt")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCartoucheStar(cards, card.id, !card.starred))}>{card.starred ? v4("crtUnstar") : v4("crtStar")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(addCartoucheTag(cards, card.id, "c"))}>{v4("crtTag")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseSpanFocused(cards, card.id))}>{v4("crtRaiseSpan")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerSpanFocused(cards, card.id))}>{v4("crtLower")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(raiseRibFocused(cards, card.id))}>{v4("crtRib")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(lowerRibFocused(cards, card.id))}>{v4("crtRib")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(filmFocused(cards, card.id))}>{v4("crtFilm")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(setCartoucheFocused(cards, card.id))}>{v4("crtRaise")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(clipCartoucheFocused(cards, card.id))}>{v4("crtClip")}</button>
                  <button type="button" className="c4-btn" disabled={viewer} onClick={() => store(starCartoucheFocused(cards, card.id))}>{v4("crtStar")}</button>
                  <button type="button" className="c4-btn" onClick={() => navigator.clipboard?.writeText(cartoucheCopy(card))}>{v4("crtCopy")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

type CapUser = { id?: string; name?: string | null; phone?: string | null };

export function GrisaillePhones({ base, v4 }: { base: string; v4: V4 }) {
  const queue = useJson<{ users?: CapUser[] }>("/api/admin/users?take=24&meta=0");
  const [mail, setMail] = useState("all");
  const [hue, setHue] = useState("all");
  const [query, setQuery] = useState("");
  const [shape, setShape] = useState<GsaShape>("all");
  const [review, setReview] = useState<GsaReview>("all");
  const [hidden, setHidden] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [copied, setCopied] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const viewer = role === "viewer";
  const rows = (queue.data?.users || []).map((row): GsaRow | null => {
    const id = textField(row.id);
    if (!id) return null;
    return {
      id,
      label: textField(row.name) || id,
      userId: id,
      code: { phone: textField(row.phone) } satisfies GsaValue,
    };
  }).filter((row): row is GsaRow => Boolean(row));
  const present = presentGsaLanes(rows);
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
    const next = readHiddenGsa(readJson(GSA_HIDE_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHidden(next);
    writeJson(GSA_HIDE_KEY, next);
  }, [queue.loading, queue.error, presentKey]);

  useEffect(() => {
    if (queue.loading || queue.error) return;
    const next = readReviewedGsa(readJson(GSA_REVIEW_KEY, []), idKey ? idKey.split("\n") : []);
    setReviewed(next);
    writeJson(GSA_REVIEW_KEY, next);
  }, [queue.loading, queue.error, idKey]);

  const lanes = visibleGsaLanes(present, hidden, showHidden);
  const shown = visibleGsa(rows, lanes.includes(mail) || mail === "all" ? mail : "all", hue, query, review, reviewed, shape).filter((row) => {
    const found = gsaLane(row.code);
    return !found || lanes.includes(found) || showHidden;
  });
  const lines = gsaLanes(rows);
  const peak = Math.max(1, ...lines.map((line) => line.count));
  const lead = leadingGsa(rows);
  const leadHue = leadingGsaHue(rows);
  const whole = rows.filter((row) => gsaLane(row.code)).length;
  const share = gsaShare(laneGsaCount(rows, "line"), whole);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (typingTarget(event)) return;
      if (event.key === "x" || event.key === "X") {
        event.preventDefault();
        download("grisaille-lanes.csv", gsaLanesCsv(rows));
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
    writeJson(GSA_HIDE_KEY, next);
  }
  function storeReviewed(next: string[]) {
    setReviewed(next);
    writeJson(GSA_REVIEW_KEY, next);
  }

  return (
    <section className="c4-grisaille" aria-label={v4("gsaTitle")} data-plates="1" data-role={role} data-names="1">
      <header className="c4-grisaille-mast">
        <p className="c4-grisaille-seal" data-logo="mono">{v4("gsaLogo")}</p>
        <div>
          <p className="c4-grisaille-kicker">{v4("gsaSub")}</p>
          <h2 className="c4-title">{v4("gsaTitle")}</h2>
        </div>
        <p className="c4-grisaille-count">{shown.length}</p>
      </header>
      <p className="c4-grisaille-links">
        <Link href={crmv4Href(base, "crt")}>{v4("crtTitle")}</Link>
        <Link href={crmv4Href(base, "customers")}>{v4("gsaCustomer")}</Link>
      </p>
      <p className="c4-grisaille-hint">{v4("gsaHint")}</p>
      {viewer && <p className="c4-grisaille-note">{v4("gsaViewer")}</p>}
      {queue.loading && <p className="c4-grisaille-meta">{v4("gsaLoading")}</p>}
      {queue.error && <p className="c4-grisaille-meta">{v4("gsaFailed")}</p>}
      <p className="c4-grisaille-meta">{v4("gsaLead")} {laneLabel(v4, lead)} · {v4("gsaToneLead")} {hueLabel(v4, leadHue)} · {v4("gsaShare")} {share}</p>
      <div className="c4-grisaille-chart" aria-label={v4("gsaChart")}>
        {lines.map((line) => (
          <button key={line.mail} type="button" className="c4-grisaille-column" data-on={mail === line.mail ? "1" : "0"} data-lang={line.mail} onClick={() => setMail(mail === line.mail ? "all" : line.mail)}>
            <i style={{ height: `${Math.max(12, Math.round((line.count / peak) * 72))}px` }} />
            <strong>{line.count}</strong>
            <span>{laneLabel(v4, line.mail)}</span>
          </button>
        ))}
      </div>
      <div className="c4-grisaille-tools">
        <input ref={searchRef} className="c4-field c4-grisaille-search" aria-label={v4("gsaSearch")} aria-required={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={v4("gsaSearch")} />
        <label className="c4-lab">{v4("gsaChart")}<select className="c4-field" aria-label={v4("gsaChart")} value={shape} onChange={(event) => setShape(event.target.value as GsaShape)}>{(Object.keys(SHAPE_KEY) as GsaShape[]).map((item) => <option key={item} value={item}>{v4(SHAPE_KEY[item])}</option>)}</select></label>
        <button type="button" className="c4-chip" data-on={hue === "champagne" ? "1" : "0"} onClick={() => setHue(hue === "champagne" ? "all" : "champagne")}>{v4("gsaChampagne")}</button>
        <button type="button" className="c4-chip" data-on={hue === "ivory" ? "1" : "0"} onClick={() => setHue(hue === "ivory" ? "all" : "ivory")}>{v4("gsaIvory")}</button>
        <button type="button" className="c4-chip" data-on={hue === "graphite" ? "1" : "0"} onClick={() => setHue(hue === "graphite" ? "all" : "graphite")}>{v4("gsaGraphite")}</button>
        <button type="button" className="c4-chip" data-on={review === "fresh" ? "1" : "0"} onClick={() => setReview(review === "fresh" ? "all" : "fresh")}>{v4("gsaFresh")}</button>
        <button type="button" className="c4-chip" data-on={review === "reviewed" ? "1" : "0"} onClick={() => setReview(review === "reviewed" ? "all" : "reviewed")}>{v4("gsaReviewed")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} onClick={() => setShowHidden((on) => !on)}>{v4("gsaShow")}</button>
        {present.map((lane) => (
          <button key={lane} type="button" className="c4-chip" data-on={hidden.includes(lane) ? "1" : "0"} onClick={() => storeHidden(toggleGsa(hidden, lane))}>{v4("gsaHide")} {laneLabel(v4, lane)}</button>
        ))}
      </div>
      <div className="c4-grisaille-bulk">
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkGsaReview(reviewed, picked, true))}>{v4("gsaBulkReview")}</button>
        <button type="button" className="c4-btn" disabled={viewer || !picked.length} onClick={() => storeReviewed(bulkGsaReview(reviewed, picked, false))}>{v4("gsaBulkClear")}</button>
        <button type="button" className="c4-btn" onClick={() => download("grisaille-phones.csv", gsaRowsCsv(shown, reviewed))}>{v4("gsaRowCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => download("grisaille-lanes.csv", gsaLanesCsv(rows))}>{v4("gsaCsv")}</button>
      </div>
      {!shown.length && !queue.loading && <p className="c4-pay-empty">{v4("gsaEmpty")}</p>}
      <ul className="c4-grisaille-list">
        {shown.map((row) => {
          const tone = gsaHue(row.code);
          const name = gsaCopy(row.code);
          return (
            <li key={row.id} className="c4-grisaille-card" data-mail={gsaLane(row.code) || "open"} data-hue={tone || "none"} data-home={gsaLane(row.code) === "line" ? "1" : "0"} data-away={gsaShut(row.code) ? "1" : "0"} data-hold={gsaLater(row.code) ? "1" : "0"} data-guest={gsaReturn(row.code) ? "1" : "0"} data-open={gsaOpen(row.code) ? "1" : "0"} data-even={gsaEven(row.code) ? "1" : "0"} data-digit={gsaDigit(row.code) ? "1" : "0"} data-letter={gsaLetter(row.code) ? "1" : "0"} data-mixed={gsaMixed(row.code) ? "1" : "0"} data-upper={gsaUpper(row.code) ? "1" : "0"} data-lower={gsaLower(row.code) ? "1" : "0"} data-space={gsaSpace(row.code) ? "1" : "0"} data-vowel={gsaVowel(row.code) ? "1" : "0"} data-tail={gsaTail(row.code) ? "1" : "0"} data-first={gsaFirst(row.code) ? "1" : "0"} data-held={gsaHeld(row.code) ? "1" : "0"} data-join={gsaPair(row.code) ? "1" : "0"} data-route={gsaScope(row.code) ? "1" : "0"} data-brief={gsaBrief(row.code) ? "1" : "0"} data-span={gsaSpanLane(row.code) ? "1" : "0"} data-bare={gsaBare(row.code) ? "1" : "0"} data-line={gsaLine(row.code) ? "1" : "0"} data-desk={gsaDesk(row.code) ? "1" : "0"}>
              <label className="c4-grisaille-pick">
                <input type="checkbox" aria-label={row.label} checked={picked.includes(row.id)} onChange={() => setPicked((ids) => ids.includes(row.id) ? ids.filter((id) => id !== row.id) : [...ids, row.id])} />
              </label>
              <div>
                <p>{row.label}</p>
                <p className="c4-grisaille-meta">{name || v4("gsaOpen")} · {gsaStamp(row.code) || "—"} · {gsaFamily(row.code) || "—"} · {gsaLength(row.code) ?? "—"} · {laneLabel(v4, gsaLane(row.code))} · {hueLabel(v4, tone)}</p>
              </div>
              <div className="c4-grisaille-actions">
                <button type="button" className="c4-btn" disabled={viewer} onClick={() => storeReviewed(toggleGsaReview(reviewed, row.id))}>{reviewed.includes(row.id) ? v4("gsaReviewed") : v4("gsaReview")}</button>
                <button type="button" className="c4-btn" onClick={() => { navigator.clipboard?.writeText(gsaCopy(row.code)); setCopied(row.id); }}>{copied === row.id ? v4("gsaCopied") : v4("gsaCopy")}</button>
                <Link className="c4-btn" href={crmv4Href(base, `customers/${row.userId || row.id}`)}>{v4("gsaCustomer")}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
