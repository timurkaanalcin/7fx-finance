"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import {
  OS_KEY,
  WATCH_KEY,
  WATCH_VIEW_KEY,
  activeMinute,
  activeOsFamily,
  activeOsInitial,
  activeOwner,
  activeSystem,
  activeTone,
  activeWatchTag,
  addWatch,
  addWatchView,
  bulkWatchArmed,
  bulkWatchDone,
  dropWatchView,
  editWatch,
  leadingOs,
  leadingOsFamily,
  leadingOsInitial,
  minuteArg,
  minuteBand,
  minuteCounts,
  minuteGap,
  namedOsFamilies,
  namedOsInitials,
  namedSystems,
  nextWatch,
  osFamilyArg,
  osFamilyLines,
  osFamilyOf,
  osInitialArg,
  osInitialLines,
  osInitialOf,
  osLines,
  osShare,
  osText,
  ownerArg,
  readHiddenSystems,
  readWatchViews,
  readWatches,
  resetWatches,
  setWatchArmed,
  setWatchDone,
  setWatchHush,
  stepWatchRank,
  systemsCsv,
  toneArg,
  toneOf,
  toggleSystem,
  visibleOsCustomers,
  visibleSystems,
  visibleWatches,
  watchClashIds,
  watchCopy,
  watchCounts,
  watchOwners,
  watchShare,
  watchTagArg,
  watchTags,
  watchTimeline,
  watchTones,
  watchesCsv,
  type OsRow,
  type Tone,
  type WatchSlip,
  type WatchTray,
  type WatchView,
} from "@/lib/crmv4/round139";
import { crmv4Href } from "@/lib/crmv4/sections";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  email?: string | null;
  lastOs?: string | null;
};

type GlanceRow = OsRow & { id: string };

const BANDS = ["d1", "d2", "d3", "d4", "d5", "d6"] as const;

function toneName(v4: V4, tone: Tone): string {
  if (tone === "calm") return v4("wchToneCalm");
  if (tone === "firm") return v4("wchToneFirm");
  if (tone === "urgent") return v4("wchToneUrgent");
  return v4("wchBlankTone");
}

function familyName(v4: V4, family: string): string {
  if (family === "windows") return v4("ostWindows");
  if (family === "macos") return v4("ostMacos");
  if (family === "ios") return v4("ostIos");
  if (family === "android") return v4("ostAndroid");
  if (family === "linux") return v4("ostLinux");
  if (family === "chromeos") return v4("ostChromeos");
  if (family === "other") return v4("ostFamilyOther");
  return v4("ostBlankFamily");
}

function auditName(v4: V4, audit: string): string {
  if (audit === "save") return v4("wchAuditSave");
  if (audit === "edit") return v4("wchAuditEdit");
  if (audit === "raise") return v4("wchAuditRaise");
  if (audit === "lower") return v4("wchAuditLower");
  if (audit === "arm") return v4("wchAuditArm");
  if (audit === "rest") return v4("wchAuditRest");
  if (audit === "done") return v4("wchAuditDone");
  if (audit === "reopen") return v4("wchAuditReopen");
  if (audit === "hush") return v4("wchAuditHush");
  if (audit === "speak") return v4("wchAuditSpeak");
  return "";
}

function bandLabel(index: number): string {
  const start = index * 10 + 1;
  const end = (index + 1) * 10;
  return `${start}–${end}`;
}

function download(name: string, body: string) {
  const blob = new Blob([body], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

export function WatchSlips({ v4 }: { v4: V4 }) {
  const [slips, setSlips] = useState<WatchSlip[]>([]);
  const [views, setViews] = useState<WatchView[]>([]);
  const [text, setText] = useState("");
  const [owner, setOwner] = useState("");
  const [minute, setMinute] = useState("");
  const [tone, setTone] = useState("");
  const [tag, setTag] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<WatchTray>("open");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [toneFilter, setToneFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [minuteFilter, setMinuteFilter] = useState("all");
  const [topOnly, setTopOnly] = useState(false);
  const [passedOnly, setPassedOnly] = useState(false);
  const [board, setBoard] = useState<"slips" | "timeline">("slips");
  const [copied, setCopied] = useState("");
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [desk, setDesk] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const next = readWatches(readJson(WATCH_KEY, []));
    const saved = readWatchViews(readJson(WATCH_VIEW_KEY, []));
    setSlips(next);
    setViews(saved);
    writeJson(WATCH_KEY, next);
    writeJson(WATCH_VIEW_KEY, saved);
  }, []);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      const tagName = (event.target as HTMLElement | null)?.tagName;
      if (tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT") return;
      event.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const owners = watchOwners(slips);
  const tones = watchTones(slips);
  const tags = watchTags(slips);
  const bands = minuteCounts(slips);
  const ownerOn = activeOwner(ownerFilter, owners);
  const toneOn = activeTone(toneFilter, tones);
  const tagOn = activeWatchTag(tagFilter, tags);
  const minuteOn = activeMinute(minuteFilter);
  const picked = minuteArg(minuteOn);
  const shown = visibleWatches(
    slips,
    tray,
    query,
    ownerArg(ownerOn),
    toneArg(toneOn),
    watchTagArg(tagOn),
    picked.exact,
    picked.band,
    topOnly,
    passedOnly,
    desk,
  );
  const timeline = watchTimeline(slips, query);
  const counts = watchCounts(slips, desk);
  const total = slips.length;
  const nextId = nextWatch(slips, desk);
  const nextSlip = slips.find((slip) => slip.id === nextId);

  function store(next: WatchSlip[]) {
    setSlips(next);
    writeJson(WATCH_KEY, next);
  }

  function storeViews(next: WatchView[]) {
    setViews(next);
    writeJson(WATCH_VIEW_KEY, next);
  }

  function clearDraft() {
    setText("");
    setOwner("");
    setMinute("");
    setTone("");
    setTag("");
  }

  function copySlip(slip: WatchSlip) {
    const body = watchCopy(slip.text);
    if (!body) return;
    if (navigator.clipboard?.writeText) void navigator.clipboard.writeText(body);
    setCopied(slip.id);
  }

  function applyView(view: WatchView) {
    setTray(view.tray);
    setQuery(view.query);
    setOwnerFilter(activeOwner(view.owner, watchOwners(slips)));
    setToneFilter(activeTone(view.tone, watchTones(slips)));
    setTagFilter(activeWatchTag(view.tag, watchTags(slips)));
    setMinuteFilter(activeMinute(view.minute));
    setBoard("slips");
    setTopOnly(false);
    setPassedOnly(false);
  }

  return (
    <section className="c4-watch" aria-label={v4("wchTitle")} data-watch="1" data-folio="1">
      <header className="c4-wch-head">
        <p className="c4-wch-plate" data-logo="mono">{v4("wchLogo")}</p>
        <div>
          <p className="c4-pay-kicker">{v4("wchSub")}</p>
          <h2 className="c4-title">{v4("wchTitle")}</h2>
        </div>
        <p className="c4-wch-count">{shown.length}</p>
      </header>
      <p className="c4-meta">{v4("wchHint")}</p>
      <p className="c4-meta">{v4("wchLocal")}</p>
      <p className="c4-meta">{v4("wchBlank")}</p>
      <p className="c4-meta">{v4("wchOwnerBlank")}</p>
      <p className="c4-meta">{v4("wchMinuteBlank")}</p>
      <p className="c4-meta">{v4("wchToneBlank")}</p>
      <p className="c4-meta">{v4("wchTagBlank")}</p>
      <p className="c4-meta">{v4("wchEscape")}</p>
      <p className="c4-meta">{v4("wchSlash")}</p>
      <p className="c4-wch-notice" role="status">
        <span>{v4("wchNotice")}</span>
        <span className="c4-wch-count">{counts.passed}</span>
        <button type="button" className="c4-btn" aria-pressed={passedOnly} onClick={() => { setPassedOnly((value) => !value); setTray("open"); setBoard("slips"); }}>
          {passedOnly ? v4("wchNoticeAll") : v4("wchNoticeOpen")}
        </button>
      </p>
      <section className="c4-wch-kpi" aria-label={v4("wchKpi")}>
        <p className="c4-pay-kicker">{v4("wchKpi")}</p>
        {(["open", "armed", "done"] as const).map((key) => {
          const count = counts[key];
          const share = watchShare(count, total);
          const label = key === "open" ? v4("wchOpen") : key === "armed" ? v4("wchArmed") : v4("wchDoneTray");
          return (
            <p key={key} className="c4-wch-meter" data-tray={key}>
              <span>{label}</span>
              <span>{count}</span>
              <span>{v4("wchShare")} {share}%</span>
              <span className="c4-wch-track" aria-hidden="true"><i style={{ width: `${share}%` }} /></span>
            </p>
          );
        })}
      </section>
      <section className="c4-wch-chart" aria-label={v4("wchChart")}>
        {bands.map((count, index) => {
          const code = BANDS[index];
          const on = minuteOn === code;
          return (
            <button
              key={code}
              type="button"
              className="c4-wch-band"
              data-on={on ? "1" : "0"}
              data-filled={count ? "1" : "0"}
              aria-pressed={on}
              onClick={() => setMinuteFilter(on ? "all" : code)}
            >
              <span className="c4-wch-tick" aria-hidden="true" />
              <span>{bandLabel(index)}</span>
              <span>{count}</span>
            </button>
          );
        })}
      </section>
      <form className="c4-wch-next" onSubmit={(event) => event.preventDefault()}>
        <label className="c4-lab">
          <span>{v4("wchDeskMinute")}</span>
          <input className="c4-field" aria-label={v4("wchDeskMinute")} value={desk} inputMode="numeric" maxLength={2} onChange={(event) => setDesk(event.target.value)} onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            setDesk("");
          }} />
        </label>
        <p className="c4-wch-next-line">
          <span>{v4("wchNext")}</span>
          {nextSlip ? <strong>{nextSlip.minute} {nextSlip.text}</strong> : <span>{minuteArg(desk).exact ? v4("wchNextEmpty") : "—"}</span>}
        </p>
      </form>
      <form className="c4-wch-form" onSubmit={(event) => {
        event.preventDefault();
        const next = addWatch(slips, { id: `wch-${Date.now().toString(36)}`, text, owner, minute, tone, tag });
        if (next.length === slips.length) return;
        store(next);
        clearDraft();
      }} onKeyDown={(event) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        clearDraft();
      }}>
        <label className="c4-lab">
          <span>{v4("wchText")}</span>
          <input className="c4-field" aria-label={v4("wchText")} value={text} maxLength={80} onChange={(event) => setText(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("wchOwner")}</span>
          <input className="c4-field" aria-label={v4("wchOwner")} value={owner} maxLength={18} onChange={(event) => setOwner(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("wchMinute")}</span>
          <input className="c4-field" aria-label={v4("wchMinute")} value={minute} inputMode="numeric" maxLength={2} onChange={(event) => setMinute(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("wchTone")}</span>
          <input className="c4-field" aria-label={v4("wchTone")} value={tone} maxLength={8} onChange={(event) => setTone(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("wchTag")}</span>
          <input className="c4-field" aria-label={v4("wchTag")} value={tag} maxLength={14} onChange={(event) => setTag(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn">{v4("wchAdd")}</button>
      </form>
      <div className="c4-row" role="group" aria-label={v4("wchTitle")}>
        {(["open", "armed", "done"] as const).map((key) => (
          <button key={key} type="button" className="c4-chip" data-on={tray === key ? "1" : "0"} aria-pressed={tray === key} onClick={() => { setTray(key); setBoard("slips"); if (key !== "open") setPassedOnly(false); }}>
            {key === "open" ? v4("wchOpen") : key === "armed" ? v4("wchArmed") : v4("wchDoneTray")}
          </button>
        ))}
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} aria-pressed={board === "timeline"} onClick={() => setBoard((value) => value === "timeline" ? "slips" : "timeline")}>{v4("wchTimeline")}</button>
        <button type="button" className="c4-chip" data-on={topOnly ? "1" : "0"} aria-pressed={topOnly} onClick={() => setTopOnly((value) => !value)}>{v4("wchTop")}</button>
      </div>
      <label className="c4-lab">
        <span>{v4("wchSearch")}</span>
        <input ref={searchRef} className="c4-field" aria-label={v4("wchSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          setQuery("");
        }} />
      </label>
      <div className="c4-row" role="group" aria-label={v4("wchOwners")}>
        <button type="button" className="c4-chip" data-on={ownerOn === "all" ? "1" : "0"} aria-pressed={ownerOn === "all"} onClick={() => setOwnerFilter("all")}>{v4("wchAllOwners")}</button>
        <button type="button" className="c4-chip" data-on={ownerOn === "blank" ? "1" : "0"} aria-pressed={ownerOn === "blank"} onClick={() => setOwnerFilter(ownerOn === "blank" ? "all" : "blank")}>{v4("wchBlankOwner")}</button>
        {owners.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={ownerOn === item ? "1" : "0"} aria-pressed={ownerOn === item} onClick={() => setOwnerFilter(ownerOn === item ? "all" : item)}>{item}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("wchTones")}>
        <button type="button" className="c4-chip" data-on={toneOn === "all" ? "1" : "0"} aria-pressed={toneOn === "all"} onClick={() => setToneFilter("all")}>{v4("wchAllTones")}</button>
        <button type="button" className="c4-chip" data-on={toneOn === "blank" ? "1" : "0"} aria-pressed={toneOn === "blank"} onClick={() => setToneFilter(toneOn === "blank" ? "all" : "blank")}>{v4("wchBlankTone")}</button>
        {tones.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={toneOn === item ? "1" : "0"} aria-pressed={toneOn === item} onClick={() => setToneFilter(toneOn === item ? "all" : item)}>{toneName(v4, item)}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("wchTags")}>
        <button type="button" className="c4-chip" data-on={tagOn === "all" ? "1" : "0"} aria-pressed={tagOn === "all"} onClick={() => setTagFilter("all")}>{v4("wchAllTags")}</button>
        <button type="button" className="c4-chip" data-on={tagOn === "blank" ? "1" : "0"} aria-pressed={tagOn === "blank"} onClick={() => setTagFilter(tagOn === "blank" ? "all" : "blank")}>{v4("wchBlankTag")}</button>
        {tags.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={tagOn === item ? "1" : "0"} aria-pressed={tagOn === item} onClick={() => setTagFilter(tagOn === item ? "all" : item)}>{item}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("wchMinutes")}>
        {(["all", "blank", "brief", "steady", "long"] as const).map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={minuteOn === item ? "1" : "0"} aria-pressed={minuteOn === item} onClick={() => setMinuteFilter(item)}>
            {item === "all" ? v4("wchAllMinutes") : item === "blank" ? v4("wchBlankMinute") : item === "brief" ? v4("wchBrief") : item === "steady" ? v4("wchSteady") : v4("wchLong")}
          </button>
        ))}
      </div>
      <form className="c4-wch-view" onSubmit={(event) => {
        event.preventDefault();
        const next = addWatchView(views, {
          id: `view-${Date.now().toString(36)}`,
          name: viewName,
          tray,
          query,
          owner: ownerOn,
          tone: toneOn,
          tag: tagOn,
          minute: minuteOn,
        });
        if (next.length === views.length) return;
        storeViews(next);
        setViewName("");
      }}>
        <label className="c4-lab">
          <span>{v4("wchViewName")}</span>
          <input className="c4-field" aria-label={v4("wchViewName")} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn">{v4("wchSaveView")}</button>
      </form>
      <section aria-label={v4("wchViews")}>
        <p className="c4-pay-kicker">{v4("wchViews")}</p>
        {!views.length && <p className="c4-meta">{v4("wchViewEmpty")}</p>}
        <ul className="c4-wch-views">
          {views.map((view) => (
            <li key={view.id}>
              <button type="button" className="c4-btn" onClick={() => applyView(view)}>{view.name}</button>
              <button type="button" className="c4-btn" onClick={() => storeViews(dropWatchView(views, view.id))}>{v4("wchDropView")}</button>
            </li>
          ))}
        </ul>
      </section>
      <p className="c4-row">
        <button type="button" className="c4-btn" onClick={() => store(bulkWatchArmed(slips, shown.map((slip) => slip.id), true))}>{v4("wchBulkArm")}</button>
        <button type="button" className="c4-btn" onClick={() => store(bulkWatchDone(slips, shown.map((slip) => slip.id), true))}>{v4("wchBulkDone")}</button>
        <button type="button" className="c4-btn" onClick={() => download("watch-slips.csv", watchesCsv(slips, desk))}>{v4("wchCsv")}</button>
        <button type="button" className="c4-btn" onClick={() => store(resetWatches())}>{v4("wchReset")}</button>
      </p>
      {board === "slips" && !shown.length && <p className="c4-pay-empty">{v4("wchEmpty")}</p>}
      {board === "slips" && (
        <ul className="c4-wch-rows">
          {shown.map((slip) => {
            const band = minuteBand(slip.minute);
            const clashes = watchClashIds(slips, slip.id);
            const gap = minuteGap(slip.minute, desk);
            const toneLabel = toneOf(slip.tone);
            return (
              <li key={slip.id} data-band={band} data-tone={toneLabel} data-passed={gap !== null && gap > 0 && !slip.armed && !slip.done ? "1" : "0"}>
                <span className="c4-wch-spine" aria-hidden="true" />
                <div>
                  <p className="c4-wch-pips" aria-label={v4("wchRank")}>
                    {[0, 1, 2].map((pip) => <i key={pip} data-on={slip.rank > pip ? "1" : "0"} />)}
                  </p>
                  {editing === slip.id ? (
                    <form onSubmit={(event) => {
                      event.preventDefault();
                      store(editWatch(slips, slip.id, draft));
                      setEditing("");
                      setDraft("");
                    }}>
                      <label className="c4-lab">
                        <span>{v4("wchEdit")}</span>
                        <input className="c4-field" aria-label={v4("wchEdit")} value={draft} maxLength={80} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => {
                          if (event.key !== "Escape") return;
                          event.preventDefault();
                          setEditing("");
                          setDraft("");
                        }} />
                      </label>
                      <button type="submit" className="c4-btn">{v4("wchSaveEdit")}</button>
                    </form>
                  ) : <p>{slip.text}</p>}
                  <p className="c4-wch-tone">{toneName(v4, toneLabel)}</p>
                  {slip.owner ? <p className="c4-wch-owner">{slip.owner}</p> : null}
                  {slip.tag ? <p className="c4-wch-tag">{slip.tag}</p> : null}
                  {slip.minute ? <p className="c4-meta">{v4("wchMinute")} {slip.minute}</p> : null}
                  {gap !== null ? <p className="c4-meta">{gap < 0 ? v4("wchAhead") : v4("wchPassed")} {Math.abs(gap)}</p> : null}
                  <p className="c4-meta">{clashes.length ? `${v4("wchClash")} ${clashes.length}` : v4("wchClashNone")}</p>
                  {slip.audit ? <p className="c4-meta">{v4("wchAudit")} {auditName(v4, slip.audit)}</p> : null}
                </div>
                <div className="c4-row">
                  <button type="button" className="c4-btn" onClick={() => copySlip(slip)}>{copied === slip.id ? v4("wchCopied") : v4("wchCopy")}</button>
                  <button type="button" className="c4-btn" onClick={() => { setEditing(slip.id); setDraft(slip.text); }}>{v4("wchEdit")}</button>
                  <button type="button" className="c4-btn" onClick={() => store(stepWatchRank(slips, slip.id, 1))}>{v4("wchRaise")}</button>
                  <button type="button" className="c4-btn" onClick={() => store(stepWatchRank(slips, slip.id, -1))}>{v4("wchLower")}</button>
                  <button type="button" className="c4-btn" aria-pressed={slip.armed} onClick={() => store(setWatchArmed(slips, slip.id, !slip.armed))}>{slip.armed ? v4("wchRest") : v4("wchArm")}</button>
                  <button type="button" className="c4-btn" aria-pressed={slip.done} onClick={() => store(setWatchDone(slips, slip.id, !slip.done))}>{slip.done ? v4("wchReopen") : v4("wchDone")}</button>
                  <button type="button" className="c4-btn" aria-pressed={slip.hush} onClick={() => store(setWatchHush(slips, slip.id, !slip.hush))}>{slip.hush ? v4("wchSpeak") : v4("wchHush")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {board === "timeline" && (
        <ol className="c4-wch-time">
          {timeline.map((slip) => (
            <li key={slip.id} data-band={minuteBand(slip.minute)}>
              <span className="c4-wch-hour">{slip.minute || "—"}</span>
              <p>{slip.text}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export function CustomerSystems({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [hiddenSystems, setHiddenSystems] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [family, setFamily] = useState("all");
  const [initial, setInitial] = useState("all");
  const [blank, setBlank] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [query, setQuery] = useState("");
  const rows = (data.data?.users || []).map((row): GlanceRow | null => {
    const id = String(row.id || "").trim();
    if (!id) return null;
    return {
      id,
      label: String(row.name || row.email || "").trim(),
      lastOs: row.lastOs,
    };
  }).filter((row): row is GlanceRow => Boolean(row));
  const lines = osLines(rows);
  const families = osFamilyLines(rows);
  const initials = osInitialLines(rows);
  const present = namedSystems(rows);
  const presentKey = present.join("\n");
  const familyNames = namedOsFamilies(rows);
  const initialNames = namedOsInitials(rows);
  const blankCount = lines.find((line) => !line.os)?.count || 0;
  const blankInitial = initials.find((line) => !line.initial)?.count || 0;
  const lead = leadingOs(rows);
  const leadFamily = leadingOsFamily(rows);
  const leadInitial = leadingOsInitial(rows);
  const loading = data.loading && !data.data;
  const failed = Boolean(data.error);
  useEffect(() => {
    if (loading || failed) return;
    const next = readHiddenSystems(readJson(OS_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHiddenSystems(next);
    writeJson(OS_KEY, next);
  }, [loading, failed, presentKey]);
  const chips = visibleSystems(present, hiddenSystems, showHidden);
  const system = activeSystem(selected, chips);
  const familyOn = activeOsFamily(family, familyNames);
  const initialOn = activeOsInitial(initial, initialNames);
  const shown = visibleOsCustomers(rows, system, blank, osFamilyArg(familyOn), osInitialArg(initialOn), query);
  const widest = Math.max(1, ...families.map((line) => line.count));

  function store(next: string[], clear: string) {
    setHiddenSystems(next);
    writeJson(OS_KEY, next);
    if (clear && activeSystem(selected, [clear])) setSelected("");
  }

  return (
    <section className="c4-system" aria-label={v4("ostTitle")} data-system="1" data-folio="1">
      <header className="c4-ost-head">
        <div>
          <p className="c4-pay-kicker">{v4("ostSub")}</p>
          <h2 className="c4-title">{v4("ostTitle")}</h2>
        </div>
        <p className="c4-wch-count">{v4("ostRows")} {rows.length}</p>
      </header>
      <p className="c4-meta">{v4("ostHint")}</p>
      <p className="c4-meta">{v4("ostLocal")}</p>
      <p className="c4-meta">{v4("ostEscape")}</p>
      {lead ? <p className="c4-ost-lead"><span>{v4("ostLead")}</span> {lead}</p> : null}
      {leadFamily ? <p className="c4-ost-lead"><span>{v4("ostLeadFamily")}</span> {familyName(v4, leadFamily)}</p> : null}
      {leadInitial ? <p className="c4-ost-lead"><span>{v4("ostLeadInitial")}</span> {leadInitial}</p> : null}
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "customers")}>{v4("ostBoard")}</Link>
        <button type="button" className="c4-btn" onClick={() => download("customer-systems.csv", systemsCsv(rows))}>{v4("ostCsv")}</button>
      </p>
      {loading && !rows.length && <p className="c4-meta">{v4("ostLoading")}</p>}
      {failed && !rows.length && <p className="c4-meta">{v4("ostFailed")}</p>}
      {!loading && !failed && !rows.length && <p className="c4-pay-empty">{v4("ostNone")}</p>}
      {families.length > 0 && (
        <section className="c4-ost-chart" aria-label={v4("ostFamilies")}>
          {families.map((line) => {
            const share = osShare(line.count, rows.length);
            const width = Math.max(8, Math.round((line.count / widest) * 100));
            const name = line.family || "blank";
            return (
              <p key={name} className="c4-ost-col" data-family={name}>
                <span>{familyName(v4, line.family)}</span>
                <span className="c4-ost-track" aria-hidden="true"><i style={{ width: `${width}%` }} /></span>
                <span>{line.count}</span>
                <span>{v4("ostShare")} {share}%</span>
              </p>
            );
          })}
        </section>
      )}
      {blankCount > 0 && (
        <button type="button" className="c4-ost-blank" data-on={blank ? "1" : "0"} aria-pressed={blank} onClick={() => { setBlank((value) => !value); setSelected(""); setFamily("all"); setInitial("all"); }}>
          <span>{v4("ostBlank")}</span>
          <span className="c4-wch-count">{blankCount}</span>
          <span className="c4-ost-track" aria-hidden="true"><i style={{ width: `${osShare(blankCount, rows.length)}%` }} /></span>
        </button>
      )}
      <div className="c4-row" role="group" aria-label={v4("ostFamilies")}>
        <button type="button" className="c4-chip" data-on={familyOn === "all" && !blank ? "1" : "0"} aria-pressed={familyOn === "all"} onClick={() => { setFamily("all"); setBlank(false); }}>{v4("ostAllFamilies")}</button>
        {families.some((line) => !line.family) && (
          <button type="button" className="c4-chip" data-on={familyOn === "blank" ? "1" : "0"} aria-pressed={familyOn === "blank"} onClick={() => { setFamily(familyOn === "blank" ? "all" : "blank"); setBlank(false); setSelected(""); }}>{v4("ostBlankFamily")}</button>
        )}
        {familyNames.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={familyOn === item ? "1" : "0"} aria-pressed={familyOn === item} onClick={() => { setBlank(false); setSelected(""); setFamily(familyOn === item ? "all" : item); }}>{familyName(v4, item)}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("ostInitials")}>
        <button type="button" className="c4-chip" data-on={initialOn === "all" && !blank ? "1" : "0"} aria-pressed={initialOn === "all"} onClick={() => { setInitial("all"); setBlank(false); }}>{v4("ostAllInitials")}</button>
        {blankInitial > 0 && (
          <button type="button" className="c4-chip" data-on={initialOn === "blank" ? "1" : "0"} aria-pressed={initialOn === "blank"} onClick={() => { setInitial(initialOn === "blank" ? "all" : "blank"); setBlank(false); setSelected(""); }}>{v4("ostBlankInitial")}</button>
        )}
        {initialNames.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={initialOn === item ? "1" : "0"} aria-pressed={initialOn === item} onClick={() => { setBlank(false); setSelected(""); setInitial(initialOn === item ? "all" : item); }}>{item === "#" ? v4("ostOther") : item}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("ostShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("ostShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("ostHidden")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("ostTitle")}>
        <button type="button" className="c4-chip" data-on={!system && !blank && familyOn === "all" && initialOn === "all" ? "1" : "0"} aria-pressed={!system && !blank} onClick={() => { setSelected(""); setBlank(false); setFamily("all"); setInitial("all"); }}>{v4("ostAll")}</button>
        {chips.map((item) => {
          const line = lines.find((row) => row.os === item);
          const count = line?.count || 0;
          const share = osShare(count, rows.length);
          const mark = osInitialOf(item);
          const familyMark = osFamilyOf(item);
          return (
            <span key={item} className="c4-ost-pair" data-system={item}>
              <button type="button" className="c4-chip" data-on={system === item ? "1" : "0"} aria-pressed={system === item} onClick={() => { setBlank(false); setFamily("all"); setInitial("all"); setSelected(system === item ? "" : item); }}>{item}</button>
              {familyMark ? <span className="c4-ost-family">{familyName(v4, familyMark)}</span> : null}
              {mark ? <span className="c4-ost-initial">{v4("ostInitial")} {mark === "#" ? v4("ostOther") : mark}</span> : null}
              <span className="c4-wch-count">{count}</span>
              <span className="c4-ost-share">{v4("ostShare")} {share}%</span>
              <span className="c4-ost-track" aria-hidden="true"><i style={{ width: `${share}%` }} /></span>
              <button type="button" className="c4-btn" onClick={() => store(toggleSystem(hiddenSystems, item, present), showHidden ? "" : item)}>{showHidden ? v4("ostShow") : v4("ostHide")}</button>
            </span>
          );
        })}
      </div>
      <label className="c4-lab">
        <span>{v4("ostSearch")}</span>
        <input className="c4-field" aria-label={v4("ostSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          setQuery("");
        }} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c4-pay-empty">{v4("ostEmpty")}</p>}
      <ul className="c4-ost-rows">
        {shown.map((row) => {
          const name = osText(row.lastOs);
          const mark = osInitialOf(name);
          const familyMark = osFamilyOf(name);
          return (
            <li key={row.id} data-system={name || "blank"}>
              <span className="c4-ost-spine" aria-hidden="true" />
              <p>{row.label || row.id}</p>
              <p className="c4-meta">{name || v4("ostBlank")}</p>
              {familyMark ? <p className="c4-ost-family">{familyName(v4, familyMark)}</p> : null}
              {mark ? <p className="c4-ost-initial">{mark === "#" ? v4("ostOther") : mark}</p> : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
