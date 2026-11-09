"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import {
  CALL_KEY,
  CALL_VIEW_KEY,
  ZONE_KEY,
  activeBand,
  activeCallZone,
  activeTimezone,
  addCall,
  addCallView,
  bandArg,
  bandOf,
  bulkCallDone,
  bulkCallParked,
  callBands,
  callCopy,
  callCounts,
  callShare,
  callTimeline,
  callZoneArg,
  callZones,
  callsCsv,
  clashIds,
  clockLabel,
  dropCallView,
  editCall,
  leadingRegion,
  leadingTimezone,
  namedRegions,
  namedTimezones,
  nextCall,
  readCallViews,
  readCalls,
  readHiddenZones,
  regionLines,
  regionOf,
  resetCalls,
  setCallDone,
  setCallMute,
  setCallParked,
  spanMinutes,
  stepCallRank,
  timezoneText,
  toggleZone,
  visibleCalls,
  visibleTimezones,
  visibleZoneCustomers,
  zoneLines,
  zoneShare,
  zonesCsv,
  type CallBand,
  type CallSlip,
  type CallTray,
  type CallView,
  type ZoneRow,
} from "@/lib/crmv4/round136";
import { crmv4Href } from "@/lib/crmv4/sections";
import { useJson } from "./kit";

export type V4 = (key: CrmV4CopyKey) => string;

type Person = {
  id: string;
  name?: string | null;
  email?: string | null;
  timezone?: string | null;
};

type GlanceRow = ZoneRow & { id: string };

function bandName(v4: V4, band: CallBand): string {
  if (band === "morning") return v4("cwnMorning");
  if (band === "afternoon") return v4("cwnAfternoon");
  if (band === "evening") return v4("cwnEvening");
  if (band === "overnight") return v4("cwnOvernight");
  return v4("cwnBlankBand");
}

function auditName(v4: V4, audit: string): string {
  if (audit === "save") return v4("cwnAuditSave");
  if (audit === "edit") return v4("cwnAuditEdit");
  if (audit === "raise") return v4("cwnAuditRaise");
  if (audit === "lower") return v4("cwnAuditLower");
  if (audit === "park") return v4("cwnAuditPark");
  if (audit === "unpark") return v4("cwnAuditUnpark");
  if (audit === "done") return v4("cwnAuditDone");
  if (audit === "reopen") return v4("cwnAuditReopen");
  if (audit === "mute") return v4("cwnAuditMute");
  if (audit === "unmute") return v4("cwnAuditUnmute");
  return "";
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

export function CallWindows({ v4 }: { v4: V4 }) {
  const [slips, setSlips] = useState<CallSlip[]>([]);
  const [views, setViews] = useState<CallView[]>([]);
  const [text, setText] = useState("");
  const [zone, setZone] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [viewName, setViewName] = useState("");
  const [query, setQuery] = useState("");
  const [tray, setTray] = useState<CallTray>("open");
  const [zoneFilter, setZoneFilter] = useState("all");
  const [bandFilter, setBandFilter] = useState("all");
  const [firstOnly, setFirstOnly] = useState(false);
  const [board, setBoard] = useState<"slips" | "timeline">("slips");
  const [copied, setCopied] = useState("");
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [clock, setClock] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const next = readCalls(readJson(CALL_KEY, []));
    const saved = readCallViews(readJson(CALL_VIEW_KEY, []));
    setSlips(next);
    setViews(saved);
    writeJson(CALL_KEY, next);
    writeJson(CALL_VIEW_KEY, saved);
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
  const zones = callZones(slips);
  const bands = callBands(slips);
  const zoneOn = activeCallZone(zoneFilter, zones);
  const bandOn = activeBand(bandFilter, bands);
  const shown = visibleCalls(slips, tray, query, callZoneArg(zoneOn), bandArg(bandOn), firstOnly);
  const timeline = callTimeline(slips, query);
  const counts = callCounts(slips);
  const total = slips.length;
  const nextId = nextCall(slips, clock);
  const nextSlip = slips.find((slip) => slip.id === nextId);

  function store(next: CallSlip[]) {
    setSlips(next);
    writeJson(CALL_KEY, next);
  }

  function storeViews(next: CallView[]) {
    setViews(next);
    writeJson(CALL_VIEW_KEY, next);
  }

  function clearDraft() {
    setText("");
    setZone("");
    setStart("");
    setEnd("");
  }

  function copySlip(slip: CallSlip) {
    const body = callCopy(slip.text);
    if (!body) return;
    if (navigator.clipboard?.writeText) void navigator.clipboard.writeText(body);
    setCopied(slip.id);
  }

  function applyView(view: CallView) {
    setTray(view.tray);
    setQuery(view.query);
    setZoneFilter(activeCallZone(view.zone, callZones(slips)));
    setBandFilter(activeBand(view.band, callBands(slips)));
    setBoard("slips");
    setFirstOnly(false);
  }

  return (
    <section className="c4-call" aria-label={v4("cwnTitle")} data-call="1" data-folio="1">
      <header className="c4-cwn-head">
        <p className="c4-cwn-plate" data-logo="mono">{v4("cwnLogo")}</p>
        <div>
          <p className="c4-pay-kicker">{v4("cwnSub")}</p>
          <h2 className="c4-title">{v4("cwnTitle")}</h2>
        </div>
        <p className="c4-cwn-count">{shown.length}</p>
      </header>
      <p className="c4-meta">{v4("cwnHint")}</p>
      <p className="c4-meta">{v4("cwnLocal")}</p>
      <p className="c4-meta">{v4("cwnBlank")}</p>
      <p className="c4-meta">{v4("cwnZoneBlank")}</p>
      <p className="c4-meta">{v4("cwnClockBlank")}</p>
      <p className="c4-meta">{v4("cwnEscape")}</p>
      <p className="c4-meta">{v4("cwnSlash")}</p>
      <p className="c4-cwn-notice" role="status">
        <span>{v4("cwnNotice")}</span>
        <span className="c4-cwn-count">{counts.overnightOpen}</span>
        <button type="button" className="c4-btn" aria-pressed={bandOn === "overnight"} onClick={() => { setBandFilter(bandOn === "overnight" ? "all" : "overnight"); setTray("open"); setBoard("slips"); setFirstOnly(false); }}>
          {bandOn === "overnight" ? v4("cwnNoticeAll") : v4("cwnNoticeOpen")}
        </button>
      </p>
      <section className="c4-cwn-kpi" aria-label={v4("cwnKpi")}>
        <p className="c4-pay-kicker">{v4("cwnKpi")}</p>
        {(["open", "parked", "done"] as const).map((key) => {
          const count = counts[key];
          const share = callShare(count, total);
          const label = key === "open" ? v4("cwnOpen") : key === "parked" ? v4("cwnParked") : v4("cwnDoneTray");
          return (
            <p key={key} className="c4-cwn-meter" data-tray={key}>
              <span>{label}</span>
              <span>{count}</span>
              <span>{v4("cwnShare")} {share}%</span>
              <span className="c4-cwn-track" aria-hidden="true"><i style={{ width: `${share}%` }} /></span>
            </p>
          );
        })}
      </section>
      <form className="c4-cwn-next" onSubmit={(event) => event.preventDefault()}>
        <label className="c4-lab">
          <span>{v4("cwnNextClock")}</span>
          <input className="c4-field" aria-label={v4("cwnNextClock")} value={clock} maxLength={5} onChange={(event) => setClock(event.target.value)} onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            setClock("");
          }} />
        </label>
        <p className="c4-cwn-next-line">
          <span>{v4("cwnNext")}</span>
          {nextSlip ? <strong>{nextSlip.start} {nextSlip.text}</strong> : <span>{clockLabel(clock) ? v4("cwnNextEmpty") : "—"}</span>}
        </p>
      </form>
      <form className="c4-cwn-form" onSubmit={(event) => {
        event.preventDefault();
        const next = addCall(slips, { id: `cwn-${Date.now().toString(36)}`, text, zone, start, end });
        if (next.length === slips.length) return;
        store(next);
        clearDraft();
      }} onKeyDown={(event) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        clearDraft();
      }}>
        <label className="c4-lab">
          <span>{v4("cwnText")}</span>
          <input className="c4-field" aria-label={v4("cwnText")} value={text} maxLength={96} onChange={(event) => setText(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("cwnZone")}</span>
          <input className="c4-field" aria-label={v4("cwnZone")} value={zone} maxLength={16} onChange={(event) => setZone(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("cwnStart")}</span>
          <input className="c4-field" aria-label={v4("cwnStart")} value={start} maxLength={5} placeholder="09:00" onChange={(event) => setStart(event.target.value)} />
        </label>
        <label className="c4-lab">
          <span>{v4("cwnEnd")}</span>
          <input className="c4-field" aria-label={v4("cwnEnd")} value={end} maxLength={5} placeholder="12:00" onChange={(event) => setEnd(event.target.value)} />
        </label>
        <div className="c4-row">
          <button type="submit" className="c4-btn">{v4("cwnAdd")}</button>
          <button type="button" className="c4-btn" onClick={() => download("call-windows.csv", callsCsv(slips))}>{v4("cwnCsv")}</button>
          <button type="button" className="c4-btn" onClick={() => store(bulkCallParked(slips, shown.map((slip) => slip.id), true))}>{v4("cwnBulkPark")}</button>
          <button type="button" className="c4-btn" onClick={() => store(bulkCallDone(slips, shown.map((slip) => slip.id), true))}>{v4("cwnBulkDone")}</button>
          <button type="button" className="c4-btn" onClick={() => store(resetCalls())}>{v4("cwnReset")}</button>
        </div>
      </form>
      <form className="c4-cwn-form" onSubmit={(event) => {
        event.preventDefault();
        const next = addCallView(views, { id: `cwnv-${Date.now().toString(36)}`, name: viewName, tray, query, zone: zoneOn, band: bandOn });
        if (next.length === views.length) return;
        storeViews(next);
        setViewName("");
      }}>
        <label className="c4-lab">
          <span>{v4("cwnViewName")}</span>
          <input className="c4-field" aria-label={v4("cwnViewName")} value={viewName} maxLength={24} onChange={(event) => setViewName(event.target.value)} />
        </label>
        <button type="submit" className="c4-btn">{v4("cwnSaveView")}</button>
      </form>
      <div className="c4-row" role="group" aria-label={v4("cwnViews")}>
        {!views.length && <p className="c4-meta">{v4("cwnViewEmpty")}</p>}
        {views.map((view) => (
          <span key={view.id} className="c4-cwn-view">
            <button type="button" className="c4-chip" onClick={() => applyView(view)}>{view.name}</button>
            <button type="button" className="c4-btn" onClick={() => storeViews(dropCallView(views, view.id))}>{v4("cwnDropView")}</button>
          </span>
        ))}
      </div>
      <label className="c4-lab">
        <span>{v4("cwnSearch")}</span>
        <input ref={searchRef} className="c4-field" aria-label={v4("cwnSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          setQuery("");
        }} />
      </label>
      <div className="c4-row" role="group" aria-label={v4("cwnTitle")}>
        <button type="button" className="c4-chip" data-on={tray === "open" && board === "slips" ? "1" : "0"} aria-pressed={tray === "open"} onClick={() => { setTray("open"); setBoard("slips"); }}>{v4("cwnOpen")}</button>
        <button type="button" className="c4-chip" data-on={tray === "parked" ? "1" : "0"} aria-pressed={tray === "parked"} onClick={() => { setTray("parked"); setBoard("slips"); }}>{v4("cwnParked")}</button>
        <button type="button" className="c4-chip" data-on={tray === "done" ? "1" : "0"} aria-pressed={tray === "done"} onClick={() => { setTray("done"); setBoard("slips"); }}>{v4("cwnDoneTray")}</button>
        <button type="button" className="c4-chip" data-on={board === "timeline" ? "1" : "0"} aria-pressed={board === "timeline"} onClick={() => setBoard(board === "timeline" ? "slips" : "timeline")}>{v4("cwnTimeline")}</button>
        <button type="button" className="c4-chip" data-on={firstOnly ? "1" : "0"} aria-pressed={firstOnly} onClick={() => { setFirstOnly((value) => !value); setTray("open"); setBoard("slips"); }}>{v4("cwnRank")} 2</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("cwnZones")}>
        <button type="button" className="c4-chip" data-on={zoneOn === "all" ? "1" : "0"} aria-pressed={zoneOn === "all"} onClick={() => setZoneFilter("all")}>{v4("cwnAllZones")}</button>
        <button type="button" className="c4-chip" data-on={zoneOn === "blank" ? "1" : "0"} aria-pressed={zoneOn === "blank"} onClick={() => setZoneFilter("blank")}>{v4("cwnBlankZone")}</button>
        {zones.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={zoneOn === item ? "1" : "0"} aria-pressed={zoneOn === item} onClick={() => setZoneFilter(zoneOn === item ? "all" : item)}>{item}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("cwnBands")}>
        <button type="button" className="c4-chip" data-on={bandOn === "all" ? "1" : "0"} aria-pressed={bandOn === "all"} onClick={() => setBandFilter("all")}>{v4("cwnAllBands")}</button>
        <button type="button" className="c4-chip" data-on={bandOn === "blank" ? "1" : "0"} aria-pressed={bandOn === "blank"} onClick={() => setBandFilter("blank")}>{v4("cwnBlankBand")}</button>
        {bands.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={bandOn === item ? "1" : "0"} aria-pressed={bandOn === item} onClick={() => setBandFilter(bandOn === item ? "all" : item)}>{bandName(v4, item)}</button>
        ))}
      </div>
      {board === "slips" && !shown.length && <p className="c4-pay-empty">{v4("cwnEmpty")}</p>}
      {board === "timeline" && !timeline.length && <p className="c4-pay-empty">{v4("cwnEmpty")}</p>}
      {board === "slips" && (
        <ul className="c4-cwn-rows">
          {shown.map((slip) => {
            const band = bandOf(slip.start, slip.end);
            const span = spanMinutes(slip.start, slip.end);
            const clashes = clashIds(slips, slip.id);
            return (
              <li key={slip.id} data-rank={slip.rank} data-parked={slip.parked ? "1" : "0"} data-done={slip.done ? "1" : "0"} data-mute={slip.mute ? "1" : "0"} data-band={band}>
                <span className="c4-cwn-pips" aria-label={`${v4("cwnRank")} ${slip.rank}`}>
                  {[1, 2].map((pip) => <i key={pip} data-on={slip.rank >= pip ? "1" : "0"} />)}
                </span>
                <div>
                  {editing === slip.id ? (
                    <form className="c4-cwn-edit" onSubmit={(event) => {
                      event.preventDefault();
                      const next = editCall(slips, slip.id, draft);
                      store(next);
                      if (next.find((item) => item.id === slip.id)?.text === callCopy(draft)) {
                        setEditing("");
                        setDraft("");
                      }
                    }}>
                      <label className="c4-lab">
                        <span>{v4("cwnEdit")}</span>
                        <input className="c4-field" aria-label={v4("cwnEdit")} value={draft} maxLength={96} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => {
                          if (event.key !== "Escape") return;
                          event.preventDefault();
                          setEditing("");
                          setDraft("");
                        }} />
                      </label>
                      <button type="submit" className="c4-btn">{v4("cwnSaveEdit")}</button>
                    </form>
                  ) : <p>{slip.text}</p>}
                  <p className="c4-cwn-band">{bandName(v4, band)}</p>
                  {slip.zone ? <p className="c4-cwn-zone">{slip.zone}</p> : null}
                  {(slip.start || slip.end) ? <p className="c4-meta">{slip.start || "—"} – {slip.end || "—"}</p> : null}
                  {span !== null ? <p className="c4-meta">{v4("cwnSpan")} {span}</p> : null}
                  <p className="c4-meta">{clashes.length ? `${v4("cwnClash")} ${clashes.length}` : v4("cwnClashNone")}</p>
                  {slip.audit ? <p className="c4-meta">{v4("cwnAudit")} {auditName(v4, slip.audit)}</p> : null}
                </div>
                <div className="c4-row">
                  <button type="button" className="c4-btn" onClick={() => copySlip(slip)}>{copied === slip.id ? v4("cwnCopied") : v4("cwnCopy")}</button>
                  <button type="button" className="c4-btn" onClick={() => { setEditing(slip.id); setDraft(slip.text); }}>{v4("cwnEdit")}</button>
                  <button type="button" className="c4-btn" onClick={() => store(stepCallRank(slips, slip.id, 1))}>{v4("cwnRaise")}</button>
                  <button type="button" className="c4-btn" onClick={() => store(stepCallRank(slips, slip.id, -1))}>{v4("cwnLower")}</button>
                  <button type="button" className="c4-btn" aria-pressed={slip.parked} onClick={() => store(setCallParked(slips, slip.id, !slip.parked))}>{slip.parked ? v4("cwnUnpark") : v4("cwnPark")}</button>
                  <button type="button" className="c4-btn" aria-pressed={slip.done} onClick={() => store(setCallDone(slips, slip.id, !slip.done))}>{slip.done ? v4("cwnReopen") : v4("cwnDone")}</button>
                  <button type="button" className="c4-btn" aria-pressed={slip.mute} onClick={() => store(setCallMute(slips, slip.id, !slip.mute))}>{slip.mute ? v4("cwnUnmute") : v4("cwnMute")}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {board === "timeline" && (
        <ol className="c4-cwn-time">
          {timeline.map((slip) => (
            <li key={slip.id} data-band={bandOf(slip.start, slip.end)}>
              <span className="c4-cwn-hour">{slip.start || "—"}</span>
              <p>{slip.text}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export function CustomerTimezones({ base, v4 }: { base: string; v4: V4 }) {
  const data = useJson<{ users?: Person[] }>("/api/admin/users?take=40&meta=0&role=TRADER");
  const [hiddenZones, setHiddenZones] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [region, setRegion] = useState("all");
  const [blank, setBlank] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [query, setQuery] = useState("");
  const rows = (data.data?.users || []).map((row): GlanceRow | null => {
    const id = String(row.id || "").trim();
    if (!id) return null;
    return {
      id,
      label: String(row.name || row.email || "").trim(),
      timezone: row.timezone,
    };
  }).filter((row): row is GlanceRow => Boolean(row));
  const lines = zoneLines(rows);
  const regions = regionLines(rows);
  const present = namedTimezones(rows);
  const presentKey = present.join("\n");
  const regionNames = namedRegions(rows);
  const blankCount = lines.find((line) => !line.timezone)?.count || 0;
  const blankRegion = regions.find((line) => !line.region)?.count || 0;
  const lead = leadingTimezone(rows);
  const leadRegion = leadingRegion(rows);
  const loading = data.loading && !data.data;
  const failed = Boolean(data.error);
  useEffect(() => {
    if (loading || failed) return;
    const next = readHiddenZones(readJson(ZONE_KEY, []), presentKey ? presentKey.split("\n") : []);
    setHiddenZones(next);
    writeJson(ZONE_KEY, next);
  }, [loading, failed, presentKey]);
  const chips = visibleTimezones(present, hiddenZones, showHidden);
  const timezone = activeTimezone(selected, chips);
  const regionOn = region === "blank" || regionNames.includes(region) ? region : "all";
  const shown = visibleZoneCustomers(rows, timezone, blank, regionOn === "all" ? null : regionOn === "blank" ? "" : regionOn, query);
  const tallest = Math.max(1, ...regions.map((line) => line.count));

  function store(next: string[], clear: string) {
    setHiddenZones(next);
    writeJson(ZONE_KEY, next);
    if (clear && activeTimezone(selected, [clear])) setSelected("");
  }

  return (
    <section className="c4-zone" aria-label={v4("zonTitle")} data-zone="1" data-folio="1">
      <header className="c4-zon-head">
        <div>
          <p className="c4-pay-kicker">{v4("zonSub")}</p>
          <h2 className="c4-title">{v4("zonTitle")}</h2>
        </div>
        <p className="c4-cwn-count">{v4("zonRows")} {rows.length}</p>
      </header>
      <p className="c4-meta">{v4("zonHint")}</p>
      <p className="c4-meta">{v4("zonLocal")}</p>
      <p className="c4-meta">{v4("zonEscape")}</p>
      {lead ? <p className="c4-zon-lead"><span>{v4("zonLead")}</span> {lead}</p> : null}
      {leadRegion ? <p className="c4-zon-lead"><span>{v4("zonLeadRegion")}</span> {leadRegion}</p> : null}
      <p className="c4-row">
        <Link className="c4-btn" href={crmv4Href(base, "customers")}>{v4("zonBoard")}</Link>
        <button type="button" className="c4-btn" onClick={() => download("customer-timezones.csv", zonesCsv(rows))}>{v4("zonCsv")}</button>
      </p>
      {loading && !rows.length && <p className="c4-meta">{v4("zonLoading")}</p>}
      {failed && !rows.length && <p className="c4-meta">{v4("zonFailed")}</p>}
      {!loading && !failed && !rows.length && <p className="c4-pay-empty">{v4("zonNone")}</p>}
      {regions.length > 0 && (
        <section className="c4-zon-chart" aria-label={v4("zonRegions")}>
          {regions.map((line) => {
            const share = zoneShare(line.count, rows.length);
            const height = Math.max(8, Math.round((line.count / tallest) * 88));
            return (
              <p key={line.region || "blank"} className="c4-zon-col" data-region={line.region || "blank"}>
                <span className="c4-zon-bar" style={{ height }} aria-hidden="true" />
                <span>{line.region || v4("zonBlankRegion")}</span>
                <span>{line.count}</span>
                <span>{v4("zonShare")} {share}%</span>
              </p>
            );
          })}
        </section>
      )}
      {blankCount > 0 && (
        <button type="button" className="c4-zon-blank" data-on={blank ? "1" : "0"} aria-pressed={blank} onClick={() => { setBlank((value) => !value); setSelected(""); setRegion("all"); }}>
          <span>{v4("zonBlank")}</span>
          <span className="c4-cwn-count">{blankCount}</span>
          <span className="c4-zon-track" aria-hidden="true"><i style={{ width: `${zoneShare(blankCount, rows.length)}%` }} /></span>
        </button>
      )}
      <div className="c4-row" role="group" aria-label={v4("zonRegions")}>
        <button type="button" className="c4-chip" data-on={regionOn === "all" && !blank ? "1" : "0"} aria-pressed={regionOn === "all"} onClick={() => { setRegion("all"); setBlank(false); }}>{v4("zonAllRegions")}</button>
        {blankRegion > 0 && (
          <button type="button" className="c4-chip" data-on={regionOn === "blank" ? "1" : "0"} aria-pressed={regionOn === "blank"} onClick={() => { setRegion(regionOn === "blank" ? "all" : "blank"); setBlank(false); setSelected(""); }}>{v4("zonBlankRegion")}</button>
        )}
        {regionNames.map((item) => (
          <button key={item} type="button" className="c4-chip" data-on={regionOn === item ? "1" : "0"} aria-pressed={regionOn === item} onClick={() => { setBlank(false); setSelected(""); setRegion(regionOn === item ? "all" : item); }}>{item}</button>
        ))}
      </div>
      <div className="c4-row" role="group" aria-label={v4("zonShown")}>
        <button type="button" className="c4-chip" data-on={showHidden ? "0" : "1"} aria-pressed={!showHidden} onClick={() => setShowHidden(false)}>{v4("zonShown")}</button>
        <button type="button" className="c4-chip" data-on={showHidden ? "1" : "0"} aria-pressed={showHidden} onClick={() => setShowHidden(true)}>{v4("zonHidden")}</button>
      </div>
      <div className="c4-row" role="group" aria-label={v4("zonTitle")}>
        <button type="button" className="c4-chip" data-on={!timezone && !blank && regionOn === "all" ? "1" : "0"} aria-pressed={!timezone && !blank} onClick={() => { setSelected(""); setBlank(false); setRegion("all"); }}>{v4("zonAll")}</button>
        {chips.map((item) => {
          const count = lines.find((line) => line.timezone === item)?.count || 0;
          const share = zoneShare(count, rows.length);
          const area = regionOf(item);
          return (
            <span key={item} className="c4-zon-pair" data-zone={item}>
              <button type="button" className="c4-chip" data-on={timezone === item ? "1" : "0"} aria-pressed={timezone === item} onClick={() => { setBlank(false); setRegion("all"); setSelected(timezone === item ? "" : item); }}>{item}</button>
              {area ? <span className="c4-zon-region">{v4("zonRegion")} {area}</span> : null}
              <span className="c4-cwn-count">{count}</span>
              <span className="c4-zon-share">{v4("zonShare")} {share}%</span>
              <span className="c4-zon-track" aria-hidden="true"><i style={{ width: `${share}%` }} /></span>
              <button type="button" className="c4-btn" onClick={() => store(toggleZone(hiddenZones, item, present), showHidden ? "" : item)}>{showHidden ? v4("zonShow") : v4("zonHide")}</button>
            </span>
          );
        })}
      </div>
      <label className="c4-lab">
        <span>{v4("zonSearch")}</span>
        <input className="c4-field" aria-label={v4("zonSearch")} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          setQuery("");
        }} />
      </label>
      {!shown.length && rows.length > 0 && <p className="c4-pay-empty">{v4("zonEmpty")}</p>}
      <ul className="c4-zon-rows">
        {shown.map((row) => {
          const name = timezoneText(row.timezone);
          return (
            <li key={row.id} data-zone={name || "blank"}>
              <span className="c4-zon-spine" aria-hidden="true" />
              <p>{row.label || row.id}</p>
              <p className="c4-meta">{name || v4("zonBlank")}</p>
              {regionOf(name) ? <p className="c4-zon-region">{regionOf(name)}</p> : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
