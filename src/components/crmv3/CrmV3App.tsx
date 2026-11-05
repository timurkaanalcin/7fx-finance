"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import CrmI18n from "@/components/i18n/CrmI18n";
import { useI18n } from "@/lib/i18n/context";
import { crmv2Text, type CrmV2CopyKey } from "@/lib/crmv2/copy";
import { crmv3Text, type CrmV3CopyKey } from "@/lib/crmv3/copy";
import { CRM_V3_MORE, CRM_V3_SECTIONS, CRM_V3_TABS, crmv3Href, type CrmV3SectionId } from "@/lib/crmv3/sections";
import BrandLogo from "@/components/landing/BrandLogo";
import { Sheet } from "./kit";
import { CommandPalette, ShortcutHelp, ShortcutHost } from "./desk/command";
import { DeskFooter } from "./desk/later";
import { QuickSheet } from "./desk/statement";
import { StaffPage } from "./desk/people";
import { GoalsPage, TopTrail } from "./desk/goals";
import { KycDesk, ReportsPage } from "./desk/review";
import { WithdrawDesk } from "./desk/withdraw";
import { DepositDesk, InboxDesk } from "./desk/deposit";
import { InsightsHome, PrefsHub } from "./desk/insights";
import { AgendaPage } from "./desk/book";
import { DeskStaff } from "./desk/today";
import { NoticeDesk, useNotices } from "./desk/notices";
import { HelpDrawer } from "./desk/board";
import { DayDesk } from "./desk/period";
import { RiskDesk } from "./desk/risk";
import { AffiliateDesk } from "./desk/tickets";
import { AccessDesk, PayoutDesk } from "./desk/payout";
import { FundingDesk } from "./desk/funding";
import { ThreadDesk } from "./desk/thread";
import { GalleryDesk, HistoryDesk } from "./desk/papers";
import { DenseList } from "./desk/dense";
import { NoticeCenter, TagBoard } from "./desk/inbox-board";
import { DeskPad, TradeBlotter } from "./desk/blotter";
import { CaseQueue, ShortcutRail } from "./desk/cases";
import { PayoutBoard, ShiftSheet } from "./desk/shift";
import { readJson } from "@/lib/crmv3/bridge";
import { RAIL_KEY, readFold } from "@/lib/crmv3/nav";
import { MoreNav, RailNav } from "./desk/nav";
import { useLocal } from "./desk/store";
import Overview from "./views/Overview";
import { CustomerDetail, Customers } from "./views/Customers";
import Finance from "./views/Finance";
import Positions from "./views/Positions";
import Support from "./views/Support";
import Marketing from "./views/Marketing";
import Settings from "./views/Settings";
import Logs from "./views/Logs";
import Control from "./views/Control";

type Props = { base: string; section: string[]; name: string };
type Toast = { id: number; ok: boolean; text: string };

export default function CrmV3App(props: Props) {
  return (
    <CrmI18n>
      <Shell {...props} />
    </CrmI18n>
  );
}

function Shell({ base, section, name }: Props) {
  const { locale } = useI18n();
  const tx = useCallback((key: CrmV2CopyKey) => crmv2Text(locale, key), [locale]);
  const v3 = useCallback((key: CrmV3CopyKey) => crmv3Text(locale, key), [locale]);
  const view = (section[0] || "overview") as CrmV3SectionId | string;
  const id = section[1] || "";
  const [more, setMore] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [palette, setPalette] = useState(false);
  const [help, setHelp] = useState(false);
  const [guide, setGuide] = useState(false);
  const [quick, setQuick] = useState(false);
  const [folded, setFolded] = useState(false);
  const [railQuery, setRailQuery] = useState("");
  const [banner] = useLocal<string>("crmv3-banner", "");
  const [idle, setIdle] = useState(false);
  const [offline, setOffline] = useState(false);
  const [trail, setTrail] = useState<string[]>([]);
  const params = useSearchParams();
  const q = params.get("q") || "";
  const notices = useNotices();

  const [shownName, setShownName] = useState("");
  useEffect(() => {
    const apply = () => {
      const saved = window.localStorage.getItem("crmv3-theme");
      if (saved === "light" || saved === "dark") setTheme(saved);
    };
    const readName = () => setShownName(String(readJson<{ displayName?: string }>("crmv3-staff-prefs", {}).displayName || ""));
    apply();
    readName();
    window.addEventListener("crmv3:theme", apply);
    window.addEventListener("crmv3:staff-prefs", readName);
    return () => {
      window.removeEventListener("crmv3:theme", apply);
      window.removeEventListener("crmv3:staff-prefs", readName);
    };
  }, []);

  useEffect(() => { setFolded(readFold(window.localStorage.getItem(RAIL_KEY))); }, []);

  useEffect(() => {
    if (!searchOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSearchOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [searchOpen]);

  function toggleFold() {
    setFolded((current) => {
      const next = !current;
      window.localStorage.setItem(RAIL_KEY, next ? "1" : "0");
      return next;
    });
  }

  useEffect(() => {
    const onToast = (event: Event) => {
      const detail = (event as CustomEvent<{ ok: boolean; error: string }>).detail;
      if (!detail) return;
      const item = { id: Date.now(), ok: detail.ok, text: detail.ok ? tx("saved") : detail.error || tx("failed") };
      setToasts((list) => [...list.slice(-2), item]);
      window.setTimeout(() => setToasts((list) => list.filter((row) => row.id !== item.id)), 2400);
    };
    window.addEventListener("crmv3:toast", onToast);
    return () => window.removeEventListener("crmv3:toast", onToast);
  }, [tx]);

  useEffect(() => {
    if (window.localStorage.getItem("crmv3-motion") === "reduce") {
      document.querySelector("[data-crmv3-root]")?.setAttribute("data-motion", "reduce");
    }
    const onOff = () => setOffline(!navigator.onLine);
    onOff();
    window.addEventListener("online", onOff);
    window.addEventListener("offline", onOff);
    let timer = 0;
    const arm = () => {
      setIdle(false);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setIdle(true), 12 * 60 * 1000);
    };
    arm();
    window.addEventListener("pointerdown", arm);
    window.addEventListener("keydown", arm);
    return () => {
      window.removeEventListener("online", onOff);
      window.removeEventListener("offline", onOff);
      window.removeEventListener("pointerdown", arm);
      window.removeEventListener("keydown", arm);
      window.clearTimeout(timer);
    };
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    window.localStorage.setItem("crmv3-theme", next);
  }

  function label(tab: string) {
    if (tab === "finance") return v3("money");
    if (tab === "me") return v3("staffProfile");
    if (tab === "goals") return v3("goalsTitle");
    if (tab === "kyc") return v3("kycDesk");
    if (tab === "gallery") return v3("glTitle");
    if (tab === "dense") return v3("dnTitle");
    if (tab === "notices") return v3("ibTitle");
    if (tab === "tags") return v3("tgTitle");
    if (tab === "blotter") return v3("blTitle");
    if (tab === "pad") return v3("pdTitle");
    if (tab === "cases") return v3("cqTitle");
    if (tab === "shortcuts") return v3("scTitle");
    if (tab === "payboard") return v3("pbTitle");
    if (tab === "handoff") return v3("shTitle");
    if (tab === "history") return v3("hsTitle");
    if (tab === "risk") return v3("rkTitle");
    if (tab === "withdraw") return v3("wdDesk");
    if (tab === "payout") return v3("pqTitle");
    if (tab === "deposit") return v3("depDesk");
    if (tab === "funding") return v3("fuTitle");
    if (tab === "inbox") return v3("inboxTitle");
    if (tab === "thread") return v3("cvTitle");
    if (tab === "reports") return v3("reportsTitle");
    if (tab === "insights") return v3("insTitle");
    if (tab === "affiliates") return v3("afTitle");
    if (tab === "agenda") return v3("agTitle");
    if (tab === "day") return v3("dayTitle");
    if (tab === "roster") return v3("staffTitle");
    if (tab === "access") return v3("axTitle");
    if (tab === "prefs") return v3("prefTitle");
    if (tab === "more") return tx("more");
    return tx(tab as CrmV2CopyKey);
  }

  const known = CRM_V3_SECTIONS.some((item) => item.id === view);
  const heading = known ? label(view) : tx("comingSoon");
  const names = Object.fromEntries(CRM_V3_SECTIONS.map((item) => [item.id, label(item.id)]));

  useEffect(() => {
    const path = window.location.pathname + window.location.search;
    let prev: string[] = [];
    try {
      const raw = window.sessionStorage.getItem("crmv3-trail");
      prev = raw ? JSON.parse(raw) as string[] : [];
      if (!Array.isArray(prev)) prev = [];
    } catch {
      prev = [];
    }
    const next = [...prev.filter((item) => item !== path), path].slice(-8);
    window.sessionStorage.setItem("crmv3-trail", JSON.stringify(next));
    setTrail(next);
  }, [view, id]);

  return (
    <div data-crmv3-root="" data-theme={theme} data-fold={folded ? "1" : "0"} data-crmv3-view={id ? `${view}/${id}` : view} className="c3-app font-normal">
      <a className="c3-skip" href="#c3-main">{v3("skipMain")}</a>
      <ShortcutHost base={base} onPalette={() => setPalette(true)} onHelp={(open) => { setHelp(open); if (open) setGuide(false); }} />
      <aside className="c3-rail">
        <div className="c3-rail-brand">
          <BrandLogo tone={theme === "light" ? "ink" : "paper"} height={24} className="c3-logo" />
          <span>{v3("v3mark")}</span>
        </div>
        <RailNav base={base} view={view} names={names} folded={folded} query={railQuery} v3={v3} onQuery={setRailQuery} onToggle={toggleFold} />
        <div className="c3-rail-foot">
          <p className="c3-muted c3-meta">{tx("signedInAs")}<span className="c3-value">{shownName || name}</span></p>
          <button type="button" className="c3-btn" onClick={() => setQuick(true)} aria-label={v3("quickPlus")}>+</button>
          <form method="post" action="/api/auth/logout">
            <input type="hidden" name="nav" value="1" />
            <button type="submit" className="c3-btn" aria-label={tx("signOut")}>
              <span className="c3-rail-mark" aria-hidden="true">{tx("signOut").slice(0, 1)}</span>
              <span className="c3-rail-name">{tx("signOut")}</span>
            </button>
          </form>
        </div>
      </aside>

      <div className="c3-body">
        <header className="c3-header" data-bar="1">
          <BrandLogo tone={theme === "light" ? "ink" : "paper"} height={24} className="c3-logo" />
          <div className="c3-header-copy">
            <p className="c3-kicker">{v3("v3mark")}</p>
            <h1 className="c3-heading">{heading}</h1>
          </div>
          <form action={crmv3Href(base, "customers")} className="c3-header-search" role="search">
            <input name="q" defaultValue={q} placeholder={v3("barSearch")} aria-label={v3("barSearch")} className="c3-field" />
          </form>
          <button type="button" className="c3-fab" aria-label={v3("searchFab")} onClick={() => setSearchOpen((open) => !open)}>⌕</button>
          {searchOpen && (
            <form action={crmv3Href(base, "customers")} className="c3-float" role="search">
              <input name="q" defaultValue={q} placeholder={v3("barSearch")} aria-label={v3("barSearch")} className="c3-field" autoFocus />
              <button type="button" className="c3-btn" onClick={() => setSearchOpen(false)}>{tx("close")}</button>
            </form>
          )}
          <button type="button" className="c3-icon-btn c3-plus-phone" onClick={() => setQuick(true)} aria-label={v3("quickPlus")}>+</button>
          <button type="button" className="c3-icon-btn" onClick={toggleTheme} aria-label={theme === "dark" ? tx("themeLight") : tx("themeDark")}>
            {theme === "dark" ? "Lt" : "Dk"}
          </button>
          <Link href={crmv3Href(base, "me")} className="c3-desk-name">{shownName || name || v3("barProfile")}</Link>
          <button type="button" className="c3-icon-btn c3-help-btn" onClick={() => setGuide(true)} aria-label={v3("hdTitle")}>?</button>
          <button type="button" className="c3-icon-btn" onClick={() => setNotesOpen(true)} aria-label={tx("notifications")}>
            {notices.unread > 0 ? notices.unread : "•"}
          </button>
          <div className="c3-lang-slot">
            <LanguageSwitcher compact tone={theme === "dark" ? "dark" : "crm"} />
          </div>
          <TopTrail base={base} view={view} id={id} heading={heading} openId={params.get("open") || ""} trail={trail} />
        </header>
        <main
          id="c3-main"
          className="c3-main"
          onTouchStart={(event) => {
            if (event.currentTarget.scrollTop > 0) return;
            event.currentTarget.dataset.y = String(event.touches[0].clientY);
          }}
          onTouchMove={(event) => {
            const start = Number(event.currentTarget.dataset.y || "");
            if (!start || event.currentTarget.scrollTop > 0) return;
            setPull(Math.max(0, Math.min(64, event.touches[0].clientY - start)));
          }}
          onTouchEnd={() => {
            if (pull >= 56) {
              setRefreshing(true);
              window.dispatchEvent(new Event("crmv3:refresh"));
              window.setTimeout(() => setRefreshing(false), 700);
            }
            setPull(0);
          }}
        >
          <div className="c3-pull" data-on={pull > 8 || refreshing ? "1" : "0"}>{refreshing ? v3("refreshing") : v3("pullHint")}</div>
          {banner && <p className="c3-banner">{banner}</p>}
          {offline && <p className="c3-banner">{v3("offlineWord")}</p>}
          {!offline && idle && <p className="c3-banner">{v3("idleWord")} {v3("idleStay")}</p>}
          <div className="c3-stage">
            {view === "overview" && <Overview base={base} tx={tx} locale={locale} name={shownName || name} />}
            {view === "customers" && !id && <Customers base={base} tx={tx} locale={locale} q={q} />}
            {view === "customers" && id && <CustomerDetail base={base} id={id} tx={tx} locale={locale} />}
            {view === "finance" && <Finance base={base} tx={tx} locale={locale} q={q} />}
            {view === "positions" && <Positions tx={tx} locale={locale} q={q} />}
            {view === "support" && <Support base={base} tx={tx} locale={locale} q={q} />}
            {view === "marketing" && <Marketing tx={tx} />}
            {view === "settings" && <Settings tx={tx} />}
            {view === "me" && <StaffPage signInName={name} base={base} locale={locale} />}
            {view === "goals" && <GoalsPage locale={locale} />}
            {view === "kyc" && <KycDesk tx={tx} locale={locale} />}
            {view === "gallery" && <GalleryDesk base={base} tx={tx} locale={locale} />}
            {view === "dense" && <DenseList base={base} tx={tx} />}
            {view === "notices" && <NoticeCenter base={base} locale={locale} tx={tx} />}
            {view === "tags" && <TagBoard base={base} tx={tx} />}
            {view === "blotter" && <TradeBlotter base={base} locale={locale} tx={tx} />}
            {view === "pad" && <DeskPad base={base} tx={tx} />}
            {view === "cases" && <CaseQueue base={base} locale={locale} tx={tx} />}
            {view === "shortcuts" && <ShortcutRail base={base} tx={tx} />}
            {view === "payboard" && <PayoutBoard base={base} locale={locale} tx={tx} />}
            {view === "handoff" && <ShiftSheet tx={tx} />}
            {view === "history" && <HistoryDesk base={base} tx={tx} locale={locale} />}
            {view === "risk" && <RiskDesk base={base} tx={tx} locale={locale} />}
            {view === "withdraw" && <WithdrawDesk base={base} tx={tx} locale={locale} />}
            {view === "payout" && <PayoutDesk base={base} tx={tx} locale={locale} />}
            {view === "deposit" && <DepositDesk base={base} tx={tx} locale={locale} />}
            {view === "funding" && <FundingDesk base={base} tx={tx} locale={locale} />}
            {view === "inbox" && <InboxDesk tx={tx} locale={locale} />}
            {view === "thread" && <ThreadDesk tx={tx} locale={locale} />}
            {view === "reports" && <ReportsPage locale={locale} />}
            {view === "insights" && <InsightsHome locale={locale} />}
            {view === "affiliates" && <AffiliateDesk base={base} locale={locale} />}
            {view === "agenda" && <AgendaPage base={base} locale={locale} />}
            {view === "day" && <DayDesk base={base} name={name} locale={locale} />}
            {view === "roster" && <DeskStaff />}
            {view === "access" && <AccessDesk base={base} tx={tx} locale={locale} />}
            {view === "prefs" && <PrefsHub locale={locale} />}
            {view === "logs" && <Logs tx={tx} locale={locale} q={q} />}
            {view === "control" && <Control tx={tx} locale={locale} />}
            {!known && (
              <section className="c3-card c3-soon" data-coming-soon="">
                <h2 className="c3-title c3-pad">{tx("comingSoon")}</h2>
                <p className="c3-muted c3-pad">{tx("comingSoonBody")}</p>
              </section>
            )}
          </div>
        </main>
        <DeskFooter section={heading} name={name} onHelp={() => setHelp(true)} />
      </div>

      <nav className="c3-tabs" aria-label={tx("panel")}>
        {CRM_V3_TABS.map((tab) => (
          <Link key={tab} href={crmv3Href(base, tab === "overview" ? "" : tab)} data-on={view === tab ? "1" : "0"} className="c3-tab" aria-current={view === tab ? "page" : undefined}>
            {label(tab)}
          </Link>
        ))}
        <button type="button" className="c3-tab" data-on={more ? "1" : "0"} aria-expanded={more} onClick={() => setMore(true)}>
          {tx("more")}
        </button>
      </nav>

      <div className="c3-toasts" aria-live="polite">
        {toasts.map((item) => (
          <div key={item.id} className="c3-toast" data-ok={item.ok ? "1" : "0"}>{item.text}</div>
        ))}
      </div>

      {more && (
        <Sheet title={tx("more")} onClose={() => setMore(false)} closeLabel={tx("close")}>
          <MoreGroups base={base} view={view} label={label} tx={tx} v3={v3} theme={theme} name={name} onClose={() => setMore(false)} onTheme={toggleTheme} onHelp={() => { setMore(false); setHelp(true); }} onGuide={() => { setMore(false); setGuide(true); }} />
        </Sheet>
      )}
      <QuickSheet open={quick} onClose={() => setQuick(false)} onSearch={() => setSearchOpen(true)} tx={tx} />
      <CommandPalette base={base} open={palette} onClose={() => setPalette(false)} />
      <HelpDrawer open={guide} onClose={() => setGuide(false)} onShortcuts={() => { setGuide(false); setHelp(true); }} closeLabel={tx("close")} />
      <ShortcutHelp open={help} onClose={() => setHelp(false)} onGuide={() => { setHelp(false); setGuide(true); }} />
      {notesOpen && (
        <Sheet title={v3("noticeTitle")} onClose={() => setNotesOpen(false)} closeLabel={tx("close")}>
          <NoticeDesk base={base} locale={locale} tx={tx} notices={notices} />
        </Sheet>
      )}
    </div>
  );
}

function MoreGroups({ base, view, label, tx, v3, theme, name, onClose, onTheme, onHelp, onGuide }: {
  base: string;
  view: string;
  label: (tab: string) => string;
  tx: (key: "more" | "themeLight" | "themeDark" | "signedInAs" | "signOut" | "close") => string;
  v3: (key: CrmV3CopyKey) => string;
  theme: "dark" | "light";
  name: string;
  onClose: () => void;
  onTheme: () => void;
  onHelp: () => void;
  onGuide: () => void;
}) {
  const names = Object.fromEntries(CRM_V3_SECTIONS.map((item) => [item.id, label(item.id)]));
  return (
    <div className="c3-stack">
      <MoreNav base={base} view={view} names={names} allow={CRM_V3_MORE} v3={v3} onPick={onClose} />
      <section className="c3-stack">
        <h3 className="c3-title">{v3("moreSession")}</h3>
        <button type="button" className="c3-btn" onClick={onHelp}>{v3("footShortcuts")}</button>
        <button type="button" className="c3-btn" onClick={onGuide}>{v3("hdTitle")}</button>
        <button type="button" className="c3-btn" onClick={() => {
          const root = document.querySelector("[data-crmv3-root]");
          const next = root?.getAttribute("data-motion") === "reduce" ? "" : "reduce";
          window.localStorage.setItem("crmv3-motion", next);
          root?.setAttribute("data-motion", next);
        }}>{v3("motionLess")}</button>
        <LanguageSwitcher compact tone={theme === "dark" ? "dark" : "crm"} />
        <button type="button" className="c3-btn" onClick={onTheme}>{theme === "dark" ? tx("themeLight") : tx("themeDark")}</button>
        <p className="c3-muted c3-meta">{tx("signedInAs")} {name}</p>
        <form method="post" action="/api/auth/logout">
          <input type="hidden" name="nav" value="1" />
          <button type="submit" className="c3-btn">{tx("signOut")}</button>
        </form>
      </section>
    </div>
  );
}
