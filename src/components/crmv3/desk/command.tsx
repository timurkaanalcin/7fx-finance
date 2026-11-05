"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { crmv2Text, type CrmV2CopyKey } from "@/lib/crmv2/copy";
import { crmv3Href } from "@/lib/crmv3/sections";
import { readJson, trapFocus, writeJson } from "@/lib/crmv3/bridge";
import { questionOpensSheet } from "@/lib/crmv3/board";
import { useEscape } from "@/lib/crmv3/focus";
import { groupHits, moveIndex, pageHits, pushRecent, type SearchGroup, type SearchHit } from "@/lib/crmv3/withdraw";
import type { CrmV3CopyKey } from "@/lib/crmv3/copy";
import { money, useJson } from "../kit";
import { shortcutRows } from "./later";
import { TipList } from "./board";
import { useV3 } from "./store";

const RECENT_KEY = "crmv3-palette-recent";
const GROUP_LABEL: Record<SearchGroup, CrmV3CopyKey> = {
  customer: "findCustomers",
  ticket: "findTickets",
  finance: "findFinance",
  page: "findPages",
};

const GO: Record<string, string> = {
  o: "",
  c: "customers",
  f: "finance",
  p: "positions",
  s: "support",
  m: "marketing",
  l: "logs",
  e: "settings",
  k: "control",
  x: "control",
};

export function ShortcutHost({ base, onPalette, onHelp }: { base: string; onPalette: () => void; onHelp: (open: boolean) => void }) {
  const armed = useRef(false);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = Boolean(target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable));
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        onPalette();
        return;
      }
      if (questionOpensSheet(event.key, typing)) {
        onHelp(true);
        return;
      }
      if (typing) return;
      if (event.key === "Escape") onHelp(false);
      if (event.key === "g") {
        armed.current = true;
        window.setTimeout(() => { armed.current = false; }, 800);
        return;
      }
      if (!armed.current) return;
      const path = GO[event.key.toLowerCase()];
      if (path !== undefined) window.location.assign(crmv3Href(base, path));
      armed.current = false;
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [base, onHelp, onPalette]);
  return null;
}

export function CommandPalette({ base, open, onClose }: { base: string; open: boolean; onClose: () => void }) {
  const v3 = useV3();
  const { locale } = useI18n();
  const [q, setQ] = useState("");
  const [recent, setRecent] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const query = q.trim();
  const users = useJson<{ users?: { id: string; name?: string | null; email?: string | null }[] }>(open && query.length >= 2 ? `/api/admin/users?view=table&take=6&meta=0&role=TRADER&q=${encodeURIComponent(query)}` : null);
  const tickets = useJson<{ tickets?: { id: string; customer?: string | null; kind?: string | null; currency?: string | null }[] }>(open && query.length >= 2 ? `/api/admin/tickets?q=${encodeURIComponent(query)}&take=6` : null);
  const deposits = useJson<{ requests?: { id: string; amount?: number | null; currency?: string | null; user?: { name?: string | null } | null }[] }>(open && query.length >= 2 ? `/api/admin/deposits?take=6&q=${encodeURIComponent(query)}` : null);
  const withdrawals = useJson<{ requests?: { id: string; amount?: number | null; currency?: string | null; user?: { name?: string | null } | null }[] }>(open && query.length >= 2 ? `/api/admin/withdrawals?take=6&q=${encodeURIComponent(query)}` : null);
  useEffect(() => {
    if (!open) return;
    setRecent(readJson<string[]>(RECENT_KEY, []));
    const node = panel.current;
    if (!node) return;
    const onTab = trapFocus(node);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeRef.current();
      onTab(event);
    };
    node.addEventListener("keydown", onKey);
    input.current?.focus();
    return () => node.removeEventListener("keydown", onKey);
  }, [open]);
  const pages = useMemo(() => {
    const label = (key: CrmV2CopyKey) => crmv2Text(locale, key);
    return [
      { id: "overview", label: label("overview"), href: crmv3Href(base, "") },
      { id: "customers", label: label("customers"), href: crmv3Href(base, "customers") },
      { id: "finance", label: v3("money"), href: crmv3Href(base, "finance") },
      { id: "withdraw", label: v3("wdDesk"), href: crmv3Href(base, "withdraw") },
      { id: "payout", label: v3("pqTitle"), href: crmv3Href(base, "payout") },
      { id: "funding", label: v3("fuTitle"), href: crmv3Href(base, "funding") },
      { id: "access", label: v3("axTitle"), href: crmv3Href(base, "access") },
      { id: "deposit", label: v3("depDesk"), href: crmv3Href(base, "deposit") },
      { id: "inbox", label: v3("inboxTitle"), href: crmv3Href(base, "inbox") },
      { id: "kyc", label: v3("kycDesk"), href: crmv3Href(base, "kyc") },
      { id: "dense", label: v3("dnTitle"), href: crmv3Href(base, "dense") },
      { id: "notices", label: v3("ibTitle"), href: crmv3Href(base, "notices") },
      { id: "tags", label: v3("tgTitle"), href: crmv3Href(base, "tags") },
      { id: "blotter", label: v3("blTitle"), href: crmv3Href(base, "blotter") },
      { id: "pad", label: v3("pdTitle"), href: crmv3Href(base, "pad") },
      { id: "cases", label: v3("cqTitle"), href: crmv3Href(base, "cases") },
      { id: "shortcuts", label: v3("scTitle"), href: crmv3Href(base, "shortcuts") },
      { id: "payboard", label: v3("pbTitle"), href: crmv3Href(base, "payboard") },
      { id: "handoff", label: v3("shTitle"), href: crmv3Href(base, "handoff") },
      { id: "leads", label: v3("ldTitle"), href: crmv3Href(base, "leads") },
      { id: "quiet", label: v3("qfTitle"), href: crmv3Href(base, "quiet") },
      { id: "triage", label: v3("trTitle"), href: crmv3Href(base, "triage") },
      { id: "accents", label: v3("acTitle"), href: crmv3Href(base, "accents") },
      { id: "depboard", label: v3("dbTitle"), href: crmv3Href(base, "depboard") },
      { id: "sop", label: v3("sopTitle"), href: crmv3Href(base, "sop") },
      { id: "alerts", label: v3("raTitle"), href: crmv3Href(base, "alerts") },
      { id: "folders", label: v3("bmTitle"), href: crmv3Href(base, "folders") },
      { id: "health", label: v3("hlTitle"), href: crmv3Href(base, "health") },
      { id: "scratch", label: v3("sbTitle"), href: crmv3Href(base, "scratch") },
      { id: "ibpay", label: v3("cmTitle"), href: crmv3Href(base, "ibpay") },
      { id: "jumps", label: v3("jpTitle"), href: crmv3Href(base, "jumps") },
      { id: "expiry", label: v3("exTitle"), href: crmv3Href(base, "expiry") },
      { id: "density", label: v3("lyTitle"), href: crmv3Href(base, "density") },
      { id: "rejects", label: v3("rjTitle"), href: crmv3Href(base, "rejects") },
      { id: "vault", label: v3("vhTitle"), href: crmv3Href(base, "vault") },
      { id: "heatmap", label: v3("htTitle"), href: crmv3Href(base, "heatmap") },
      { id: "cheats", label: v3("csTitle"), href: crmv3Href(base, "cheats") },
      { id: "digest", label: v3("odTitle"), href: crmv3Href(base, "digest") },
      { id: "glass", label: v3("gsTitle"), href: crmv3Href(base, "glass") },
      { id: "compare", label: v3("mcTitle"), href: crmv3Href(base, "compare") },
      { id: "eod", label: v3("eodTitle"), href: crmv3Href(base, "eod") },
      { id: "stale", label: v3("slTitle"), href: crmv3Href(base, "stale") },
      { id: "scripts", label: v3("tkTitle"), href: crmv3Href(base, "scripts") },
      { id: "dupes", label: v3("dpTitle"), href: crmv3Href(base, "dupes") },
      { id: "prep", label: v3("mpTitle"), href: crmv3Href(base, "prep") },
      { id: "referrals", label: v3("sxTitle"), href: crmv3Href(base, "referrals") },
      { id: "winloss", label: v3("wnTitle"), href: crmv3Href(base, "winloss") },
      { id: "vip", label: v3("vwTitle"), href: crmv3Href(base, "vip") },
      { id: "packet", label: v3("pkTitle"), href: crmv3Href(base, "packet") },
      { id: "clocks", label: v3("ckTitle"), href: crmv3Href(base, "clocks") },
      { id: "snippets", label: v3("snTitle"), href: crmv3Href(base, "snippets") },
      { id: "pulse", label: v3("puTitle"), href: crmv3Href(base, "pulse") },
      { id: "swatches", label: v3("swTitle"), href: crmv3Href(base, "swatches") },
      { id: "week", label: v3("wkTitle"), href: crmv3Href(base, "week") },
      { id: "scale", label: v3("tyTitle"), href: crmv3Href(base, "scale") },
      { id: "shield", label: v3("qhTitle"), href: crmv3Href(base, "shield") },
      { id: "stickies", label: v3("cnTitle"), href: crmv3Href(base, "stickies") },
      { id: "shiftlist", label: v3("sfTitle"), href: crmv3Href(base, "shiftlist") },
      { id: "glance", label: v3("gcTitle"), href: crmv3Href(base, "glance") },
      { id: "lane", label: v3("lnTitle"), href: crmv3Href(base, "lane") },
      { id: "docpulse", label: v3("xpTitle"), href: crmv3Href(base, "docpulse") },
      { id: "edge", label: v3("egTitle"), href: crmv3Href(base, "edge") },
      { id: "outcomes", label: v3("ocTitle"), href: crmv3Href(base, "outcomes") },
      { id: "riskwatch", label: v3("rwTitle"), href: crmv3Href(base, "riskwatch") },
      { id: "maildense", label: v3("mdTitle"), href: crmv3Href(base, "maildense") },
      { id: "callpack", label: v3("cpTitle"), href: crmv3Href(base, "callpack") },
      { id: "curchips", label: v3("ccTitle"), href: crmv3Href(base, "curchips") },
      { id: "markbar", label: v3("mbTitle"), href: crmv3Href(base, "markbar") },
      { id: "kycglance", label: v3("kgTitle"), href: crmv3Href(base, "kycglance") },
      { id: "snooze", label: v3("szTitle"), href: crmv3Href(base, "snooze") },
      { id: "sideglance", label: v3("sdTitle"), href: crmv3Href(base, "sideglance") },
      { id: "focusmode", label: v3("fmTitle"), href: crmv3Href(base, "focusmode") },
      { id: "suppulse", label: v3("qpTitle"), href: crmv3Href(base, "suppulse") },
      { id: "pinboard", label: v3("pnTitle"), href: crmv3Href(base, "pinboard") },
      { id: "ibglance", label: v3("igTitle"), href: crmv3Href(base, "ibglance") },
      { id: "desktimer", label: v3("dtTitle"), href: crmv3Href(base, "desktimer") },
      { id: "licglance", label: v3("lcTitle"), href: crmv3Href(base, "licglance") },
      { id: "voicetray", label: v3("vsTitle"), href: crmv3Href(base, "voicetray") },
      { id: "wdreason", label: v3("wrTitle"), href: crmv3Href(base, "wdreason") },
      { id: "utcmark", label: v3("cdTitle"), href: crmv3Href(base, "utcmark") },
      { id: "depchannel", label: v3("dcTitle"), href: crmv3Href(base, "depchannel") },
      { id: "statusbanner", label: v3("bnTitle"), href: crmv3Href(base, "statusbanner") },
      { id: "doctype", label: v3("dgTitle"), href: crmv3Href(base, "doctype") },
      { id: "quicklinks", label: v3("qkTitle"), href: crmv3Href(base, "quicklinks") },
      { id: "prioglance", label: v3("pgTitle"), href: crmv3Href(base, "prioglance") },
      { id: "checklist", label: v3("chTitle"), href: crmv3Href(base, "checklist") },
      { id: "countryglance", label: v3("cyTitle"), href: crmv3Href(base, "countryglance") },
      { id: "scratchpad", label: v3("npTitle"), href: crmv3Href(base, "scratchpad") },
      { id: "orderstatus", label: v3("ogTitle"), href: crmv3Href(base, "orderstatus") },
      { id: "contacts", label: v3("ctTitle"), href: crmv3Href(base, "contacts") },
      { id: "zeroglance", label: v3("bzTitle"), href: crmv3Href(base, "zeroglance") },
      { id: "reminders", label: v3("rmTitle"), href: crmv3Href(base, "reminders") },
      { id: "sourceglance", label: v3("lsTitle"), href: crmv3Href(base, "sourceglance") },
      { id: "tagpalette", label: v3("plTitle"), href: crmv3Href(base, "tagpalette") },
      { id: "assignee", label: v3("gnTitle"), href: crmv3Href(base, "assignee") },
      { id: "filterpresets", label: v3("fpTitle"), href: crmv3Href(base, "filterpresets") },
      { id: "docstatus", label: v3("dsTitle"), href: crmv3Href(base, "docstatus") },
      { id: "sessionnote", label: v3("syTitle"), href: crmv3Href(base, "sessionnote") },
      { id: "wdstatus", label: v3("wzTitle"), href: crmv3Href(base, "wdstatus") },
      { id: "pinrail", label: v3("rlTitle"), href: crmv3Href(base, "pinrail") },
      { id: "depstatus", label: v3("dzTitle"), href: crmv3Href(base, "depstatus") },
      { id: "mutelist", label: v3("muTitle"), href: crmv3Href(base, "mutelist") },
      { id: "symbolglance", label: v3("ymTitle"), href: crmv3Href(base, "symbolglance") },
      { id: "recentjumps", label: v3("jvTitle"), href: crmv3Href(base, "recentjumps") },
      { id: "ticketchannel", label: v3("tcTitle"), href: crmv3Href(base, "ticketchannel") },
      { id: "watchwords", label: v3("wwTitle"), href: crmv3Href(base, "watchwords") },
      { id: "langglance", label: v3("lgTitle"), href: crmv3Href(base, "langglance") },
      { id: "layoutlock", label: v3("lxTitle"), href: crmv3Href(base, "layoutlock") },
      { id: "ibstatus", label: v3("bxTitle"), href: crmv3Href(base, "ibstatus") },
      { id: "draftstash", label: v3("dfTitle"), href: crmv3Href(base, "draftstash") },
      { id: "doctypemix", label: v3("kmTitle"), href: crmv3Href(base, "doctypemix") },
      { id: "focuscustomer", label: v3("fcTitle"), href: crmv3Href(base, "focuscustomer") },
      { id: "ordertype", label: v3("oyTitle"), href: crmv3Href(base, "ordertype") },
      { id: "bookmarks", label: v3("bqTitle"), href: crmv3Href(base, "bookmarks") },
      { id: "wdglance", label: v3("wxTitle"), href: crmv3Href(base, "wdglance") },
      { id: "snoozelist", label: v3("nqTitle"), href: crmv3Href(base, "snoozelist") },
      { id: "depmethod", label: v3("mgTitle"), href: crmv3Href(base, "depmethod") },
      { id: "checkpolish", label: v3("hkTitle"), href: crmv3Href(base, "checkpolish") },
      { id: "casepriority", label: v3("zqTitle"), href: crmv3Href(base, "casepriority") },
      { id: "colortags", label: v3("qaTitle"), href: crmv3Href(base, "colortags") },
      { id: "tradeside", label: v3("ysTitle"), href: crmv3Href(base, "tradeside") },
      { id: "gallery", label: v3("glTitle"), href: crmv3Href(base, "gallery") },
      { id: "history", label: v3("hsTitle"), href: crmv3Href(base, "history") },
      { id: "reports", label: v3("reportsTitle"), href: crmv3Href(base, "reports") },
      { id: "goals", label: v3("goalsTitle"), href: crmv3Href(base, "goals") },
      { id: "support", label: label("support"), href: crmv3Href(base, "support") },
      { id: "thread", label: v3("cvTitle"), href: crmv3Href(base, "thread") },
      { id: "affiliates", label: v3("afTitle"), href: crmv3Href(base, "affiliates") },
    ];
  }, [base, locale, v3]);
  const hits = useMemo(() => {
    const people: SearchHit[] = (users.data?.users || []).map((row) => ({ group: "customer", id: row.id, label: row.name || row.email || row.id, detail: row.email || "", href: crmv3Href(base, `customers/${row.id}`) }));
    const ticketHits: SearchHit[] = (tickets.data?.tickets || []).slice(0, 6).map((row) => ({ group: "ticket", id: row.id, label: row.customer || row.id, detail: `${row.kind || ""}${row.currency ? ` ${row.currency}` : ""}`, href: crmv3Href(base, "support", { open: row.id }) }));
    const moneyHits: SearchHit[] = [
      ...(deposits.data?.requests || []).map((row) => ({ group: "finance" as const, id: `d-${row.id}`, label: row.user?.name || row.id, detail: money(row.amount, row.currency, locale), href: crmv3Href(base, "finance", { open: row.id }) })),
      ...(withdrawals.data?.requests || []).map((row) => ({ group: "finance" as const, id: `w-${row.id}`, label: row.user?.name || row.id, detail: money(row.amount, row.currency, locale), href: crmv3Href(base, "finance", { tab: "withdrawals", open: row.id }) })),
    ];
    return [...people, ...ticketHits, ...moneyHits, ...pageHits(query, pages)];
  }, [users.data, tickets.data, deposits.data, withdrawals.data, base, pages, query, locale]);
  const groups = groupHits(query.length >= 2 ? hits : pageHits("", pages));
  const flat = groups.flatMap((group) => group.items);
  const active = flat[Math.min(index, Math.max(0, flat.length - 1))];
  function remember(text: string) {
    const next = pushRecent(readJson<string[]>(RECENT_KEY, []), text);
    writeJson(RECENT_KEY, next);
    setRecent(next);
  }
  function choose(hit: SearchHit) {
    if (query.length >= 2) remember(query);
    onClose();
    window.location.assign(hit.href);
  }
  if (!open) return null;
  return (
    <div className="c3-sheet-back" role="presentation" onClick={onClose}>
      <div ref={panel} role="dialog" aria-modal="true" aria-label={v3("findTitle")} className="c3-sheet" onClick={(event) => event.stopPropagation()}>
        <input
          ref={input}
          className="c3-field"
          value={q}
          placeholder={v3("findHint")}
          aria-label={v3("findTitle")}
          aria-activedescendant={active ? `find-${active.id}` : undefined}
          onChange={(event) => { setQ(event.target.value); setIndex(0); }}
          onKeyDown={(event) => {
            if (event.key === "Escape") onClose();
            if (event.key === "ArrowDown") { event.preventDefault(); setIndex((current) => moveIndex(current, 1, flat.length)); }
            if (event.key === "ArrowUp") { event.preventDefault(); setIndex((current) => moveIndex(current, -1, flat.length)); }
            if (event.key === "Enter" && active) { event.preventDefault(); choose(active); }
          }}
        />
        {query.length < 2 && (
          <div>
            <p className="c3-muted">{v3("findRecent")}</p>
            {!recent.length && <p className="c3-muted">{v3("findRecentEmpty")}</p>}
            <div className="c3-tools">
              {recent.map((item) => <button key={item} type="button" className="c3-chip" onClick={() => { setQ(item); setIndex(0); }}>{item}</button>)}
              {recent.length > 0 && <button type="button" className="c3-btn" onClick={() => { writeJson(RECENT_KEY, []); setRecent([]); }}>{v3("findClear")}</button>}
            </div>
          </div>
        )}
        {!flat.length && <p className="c3-muted">{v3("findEmpty")}</p>}
        {groups.map((group) => (
          <section key={group.group} aria-label={v3(GROUP_LABEL[group.group])}>
            <h3 className="c3-title">{v3(GROUP_LABEL[group.group])}</h3>
            <ul className="c3-arrange-list" role="listbox">
              {group.items.map((hit) => (
                <li key={`${hit.group}-${hit.id}`} id={`find-${hit.id}`} role="option" aria-selected={active?.id === hit.id}>
                  <button type="button" className="c3-btn" data-on={active?.id === hit.id ? "1" : "0"} onClick={() => choose(hit)}>{hit.label}{hit.detail ? ` · ${hit.detail}` : ""}</button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

export function ShortcutHelp({ open, onClose, onGuide }: { open: boolean; onClose: () => void; onGuide?: () => void }) {
  const v3 = useV3();
  const panel = useRef<HTMLDivElement>(null);
  useEscape(open, onClose);
  useEffect(() => {
    if (!open) return;
    const node = panel.current;
    if (!node) return;
    const onTab = trapFocus(node);
    node.addEventListener("keydown", onTab);
    const focusable = node.querySelector("button");
    if (focusable instanceof HTMLElement) focusable.focus();
    return () => node.removeEventListener("keydown", onTab);
  }, [open]);
  if (!open) return null;
  return (
    <div className="c3-sheet-back" role="presentation" onClick={onClose}>
      <div ref={panel} role="dialog" aria-modal="true" aria-label={v3("ksTitle")} className="c3-sheet" data-shortcuts="" onClick={(event) => event.stopPropagation()}>
        <h2 className="c3-title">{v3("ksTitle")}</h2>
        <p className="c3-muted">{v3("ksHint")}</p>
        <TipList />
        <ul className="c3-shortcut-list">
          {shortcutRows(v3).map(([key, text]) => (
            <li key={key}><kbd>{key}</kbd><span>{text}</span></li>
          ))}
          <li><kbd>Escape</kbd><span>{v3("ksEscape")}</span></li>
        </ul>
        <div className="c3-row">
          {onGuide && <button type="button" className="c3-btn" onClick={onGuide}>{v3("hdTitle")}</button>}
          <button type="button" className="c3-btn" onClick={onClose}>{v3("closeForm")}</button>
        </div>
      </div>
    </div>
  );
}
