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
import { LeadBoard, QuietDesk } from "./desk/leads";
import { AccentStrip, TriageBoard } from "./desk/triage";
import { DepositBoard, SopPad } from "./desk/sop";
import { AlertDesk, FolderPad } from "./desk/alerts";
import { HealthStrip, ScratchBoard } from "./desk/health";
import { IntroducerBoard, JumpHistory } from "./desk/introducer";
import { ExpiryWatch, PanelDensityStrip } from "./desk/expiry";
import { RejectBoard, VaultPad } from "./desk/rejects";
import { CheatSheet, HeatStrip } from "./desk/heatmap";
import { GlassToggle, OvernightDigest } from "./desk/digest";
import { DeskCompare, EodList } from "./desk/compare";
import { CallScripts, StaleWatch } from "./desk/stale";
import { DupeStrip, MeetingPrep } from "./desk/dupes";
import { SourceMix, WinLog } from "./desk/mix";
import { HandoffPacket, VipWatch } from "./desk/vip";
import { DeskClocks, SnippetPad } from "./desk/clocks";
import { QueuePulse, RouteSwatches } from "./desk/pulse";
import { FontScale, WeekAgenda } from "./desk/week";
import { QuietShield, StickyPad } from "./desk/shield";
import { LedgerGlance, ShiftCheck } from "./desk/shiftlist";
import { DocPulse, PriorityLane } from "./desk/lane";
import { CallOutcomes, EdgeStrip } from "./desk/edge";
import { MailDensityStrip, RiskWatch } from "./desk/watch";
import { CallPack, CurrencyChips } from "./desk/pack";
import { BookmarkBar, KycGlance } from "./desk/marks";
import { SideGlance, SnoozeStrip } from "./desk/snooze";
import { FocusDesk, SupportPulse } from "./desk/focus";
import { IbGlance, PinBoard } from "./desk/pin";
import { DeskTimer, LicenseGlance } from "./desk/timer";
import { ReasonGlance, VoiceTray } from "./desk/voice";
import { ChannelGlance, UtcMarks } from "./desk/utc";
import { StatusBanner, TypeGlance } from "./desk/banner";
import { PriorityGlance, QuickLinks } from "./desk/links";
import { CountryGlance, DeskCheck } from "./desk/check";
import { OrderGlance, ScratchPads } from "./desk/notepad";
import { ContactChips, ZeroGlance } from "./desk/contact";
import { ReminderChips, SourceGlance } from "./desk/remind";
import { AssigneeGlance, TagPalette } from "./desk/palette";
import { DocStatusGlance, FilterPresets } from "./desk/preset";
import { SessionNote, WithdrawalGlance } from "./desk/session";
import { DepStatusGlance, PinRail } from "./desk/rail";
import { MuteList, SymbolGlance } from "./desk/mute";
import { RecentJumps, TicketChannels } from "./desk/jumps";
import { LanguageGlance, WatchWords } from "./desk/words";
import { IbStatusGlance, LayoutLock } from "./desk/desklock";
import { DocTypeMix, DraftStash } from "./desk/drafts";
import { FocusCustomer, OrderTypeGlance } from "./desk/focuscustomer";
import { BookmarkBoard, WithdrawalStatus } from "./desk/bookmarkboard";
import { DepositMethod, SnoozeList } from "./desk/snoozelist";
import { CasePriority, CheckPolish } from "./desk/checkpolish";
import { ColorTags, TradeSide } from "./desk/colortags";
import { KycStatus, SavedViews } from "./desk/savedviews";
import { FollowQueue, TicketStatus } from "./desk/followqueue";
import { IbCountry, RowDensityDesk } from "./desk/rowdensity";
import { AuditDayStrip, CsvColumnDesk } from "./desk/csvpresets";
import { ReminderPolish, RiskGlance } from "./desk/remindpolish";
import { DepositCurrencies, HandoffPolish } from "./desk/handoffpolish";
import { StaffPolish, WithdrawalMethods } from "./desk/staffpolish";
import { MeetingNotes, OrderStatuses } from "./desk/meetnotes";
import { QuickDial, TicketAssignees } from "./desk/quickdial";
import { CallbackQueue, CasePriorities } from "./desk/callbackqueue";
import { DocumentStatuses, VisitLog } from "./desk/visitlog";
import { ROW_DENSITY_KEY, activeDensity, type RowDensity } from "@/lib/crmv3/rowdensity";
import { FOCUS_KEY, readFocus, type FocusPanel } from "@/lib/crmv3/deskfocus";
import { EDGE_KEY, readEdge, type Accent } from "@/lib/crmv3/edge";
import { MAIL_KEY, readDensity, type MailDensity } from "@/lib/crmv3/risklist";
import { SCALE_KEY, readScale, type PanelScale } from "@/lib/crmv3/week";
import { PAUSE_KEY, shieldOn } from "@/lib/crmv3/shield";
import { QUIET_KEY, readQuiet } from "@/lib/crmv3/leads";
import { CHROME_KEY, GOLD_KEY, readChrome, readGold, type ChromeMode, type GoldLevel } from "@/lib/crmv3/triage";
import { readJson, writeJson } from "@/lib/crmv3/bridge";
import { JUMP_KEY, pushJump, readJumps } from "@/lib/crmv3/introducer";
import { JUMP_KEY as RECENT_JUMP_KEY, pushVisit, readVisits } from "@/lib/crmv3/jumps";
import { PANEL_KEY, readPanel, type PanelDensity } from "@/lib/crmv3/expiry";
import { GLASS_KEY, readGlass, type GlassMode } from "@/lib/crmv3/digest";
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
  const [gold, setGold] = useState<GoldLevel>("desk");
  const [chrome, setChrome] = useState<ChromeMode>("roomy");
  const [panel, setPanel] = useState<PanelDensity>("desk");
  const [glass, setGlass] = useState<GlassMode>("soft");
  const [scale, setScale] = useState<PanelScale>("desk");
  const [shield, setShield] = useState(false);
  const [edge, setEdge] = useState<Accent>("champagne");
  const [mail, setMail] = useState<MailDensity>("desk");
  const [deskFocus, setDeskFocus] = useState<FocusPanel[]>([]);
  const [rowDensity, setRowDensity] = useState<RowDensity>("comfortable");
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
    const applyGold = (event?: Event) => setGold(readGold(event ? (event as CustomEvent).detail : readJson(GOLD_KEY, "desk")));
    const applyChrome = (event?: Event) => setChrome(readChrome(event ? (event as CustomEvent).detail : readJson(CHROME_KEY, "roomy")));
    const applyPanel = (event?: Event) => setPanel(readPanel(event ? (event as CustomEvent).detail : readJson(PANEL_KEY, "desk")));
    const applyGlass = (event?: Event) => setGlass(readGlass(event ? (event as CustomEvent).detail : readJson(GLASS_KEY, "soft")));
    const applyScale = (event?: Event) => setScale(readScale(event ? (event as CustomEvent).detail : readJson(SCALE_KEY, "desk")));
    applyGold();
    applyChrome();
    applyPanel();
    applyGlass();
    applyScale();
    const onGold = (event: Event) => applyGold(event);
    const onChrome = (event: Event) => applyChrome(event);
    const onPanel = (event: Event) => applyPanel(event);
    const onGlass = (event: Event) => applyGlass(event);
    const onScale = (event: Event) => applyScale(event);
    window.addEventListener("crmv3:gold", onGold);
    window.addEventListener("crmv3:chrome", onChrome);
    window.addEventListener("crmv3:panel", onPanel);
    window.addEventListener("crmv3:glass", onGlass);
    window.addEventListener("crmv3:scale", onScale);
    return () => {
      window.removeEventListener("crmv3:gold", onGold);
      window.removeEventListener("crmv3:chrome", onChrome);
      window.removeEventListener("crmv3:panel", onPanel);
      window.removeEventListener("crmv3:glass", onGlass);
      window.removeEventListener("crmv3:scale", onScale);
    };
  }, []);

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
      if (shieldOn(readQuiet(readJson(QUIET_KEY, {})), readJson(PAUSE_KEY, ""), new Date())) return;
      setToasts((list) => [...list.slice(-2), item]);
      window.setTimeout(() => setToasts((list) => list.filter((row) => row.id !== item.id)), 2400);
    };
    window.addEventListener("crmv3:toast", onToast);
    return () => window.removeEventListener("crmv3:toast", onToast);
  }, [tx]);

  useEffect(() => {
    const read = () => setShield(shieldOn(readQuiet(readJson(QUIET_KEY, {})), readJson(PAUSE_KEY, ""), new Date()));
    read();
    const timer = window.setInterval(read, 30000);
    window.addEventListener("crmv3:quiet", read);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("crmv3:quiet", read);
    };
  }, []);

  useEffect(() => {
    const apply = (event?: Event) => setEdge(readEdge(event ? String((event as CustomEvent).detail || "") : window.localStorage.getItem(EDGE_KEY)));
    apply();
    window.addEventListener("crmv3:accent", apply);
    return () => window.removeEventListener("crmv3:accent", apply);
  }, []);

  useEffect(() => {
    const apply = (event?: Event) => setMail(readDensity(event ? (event as CustomEvent).detail : readJson(MAIL_KEY, "desk")));
    apply();
    window.addEventListener("crmv3:mail", apply);
    return () => window.removeEventListener("crmv3:mail", apply);
  }, []);

  useEffect(() => {
    const apply = (event?: Event) => setDeskFocus(readFocus(event ? (event as CustomEvent).detail : readJson(FOCUS_KEY, [])));
    apply();
    window.addEventListener("crmv3:desk-focus", apply);
    return () => window.removeEventListener("crmv3:desk-focus", apply);
  }, []);

  useEffect(() => {
    const apply = () => setRowDensity(activeDensity(readJson(ROW_DENSITY_KEY, "")));
    apply();
    window.addEventListener("crmv3:row-density", apply);
    return () => window.removeEventListener("crmv3:row-density", apply);
  }, []);

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
    if (tab === "leads") return v3("ldTitle");
    if (tab === "quiet") return v3("qfTitle");
    if (tab === "triage") return v3("trTitle");
    if (tab === "accents") return v3("acTitle");
    if (tab === "depboard") return v3("dbTitle");
    if (tab === "sop") return v3("sopTitle");
    if (tab === "alerts") return v3("raTitle");
    if (tab === "folders") return v3("bmTitle");
    if (tab === "health") return v3("hlTitle");
    if (tab === "scratch") return v3("sbTitle");
    if (tab === "ibpay") return v3("cmTitle");
    if (tab === "jumps") return v3("jpTitle");
    if (tab === "expiry") return v3("exTitle");
    if (tab === "density") return v3("lyTitle");
    if (tab === "rejects") return v3("rjTitle");
    if (tab === "vault") return v3("vhTitle");
    if (tab === "heatmap") return v3("htTitle");
    if (tab === "cheats") return v3("csTitle");
    if (tab === "digest") return v3("odTitle");
    if (tab === "glass") return v3("gsTitle");
    if (tab === "compare") return v3("mcTitle");
    if (tab === "eod") return v3("eodTitle");
    if (tab === "stale") return v3("slTitle");
    if (tab === "scripts") return v3("tkTitle");
    if (tab === "dupes") return v3("dpTitle");
    if (tab === "prep") return v3("mpTitle");
    if (tab === "referrals") return v3("sxTitle");
    if (tab === "winloss") return v3("wnTitle");
    if (tab === "vip") return v3("vwTitle");
    if (tab === "packet") return v3("pkTitle");
    if (tab === "clocks") return v3("ckTitle");
    if (tab === "snippets") return v3("snTitle");
    if (tab === "pulse") return v3("puTitle");
    if (tab === "swatches") return v3("swTitle");
    if (tab === "week") return v3("wkTitle");
    if (tab === "scale") return v3("tyTitle");
    if (tab === "shield") return v3("qhTitle");
    if (tab === "stickies") return v3("cnTitle");
    if (tab === "shiftlist") return v3("sfTitle");
    if (tab === "glance") return v3("gcTitle");
    if (tab === "lane") return v3("lnTitle");
    if (tab === "docpulse") return v3("xpTitle");
    if (tab === "edge") return v3("egTitle");
    if (tab === "outcomes") return v3("ocTitle");
    if (tab === "riskwatch") return v3("rwTitle");
    if (tab === "maildense") return v3("mdTitle");
    if (tab === "callpack") return v3("cpTitle");
    if (tab === "curchips") return v3("ccTitle");
    if (tab === "markbar") return v3("mbTitle");
    if (tab === "kycglance") return v3("kgTitle");
    if (tab === "snooze") return v3("szTitle");
    if (tab === "sideglance") return v3("sdTitle");
    if (tab === "focusmode") return v3("fmTitle");
    if (tab === "suppulse") return v3("qpTitle");
    if (tab === "pinboard") return v3("pnTitle");
    if (tab === "ibglance") return v3("igTitle");
    if (tab === "desktimer") return v3("dtTitle");
    if (tab === "licglance") return v3("lcTitle");
    if (tab === "voicetray") return v3("vsTitle");
    if (tab === "wdreason") return v3("wrTitle");
    if (tab === "utcmark") return v3("cdTitle");
    if (tab === "depchannel") return v3("dcTitle");
    if (tab === "statusbanner") return v3("bnTitle");
    if (tab === "doctype") return v3("dgTitle");
    if (tab === "quicklinks") return v3("qkTitle");
    if (tab === "prioglance") return v3("pgTitle");
    if (tab === "checklist") return v3("chTitle");
    if (tab === "countryglance") return v3("cyTitle");
    if (tab === "scratchpad") return v3("npTitle");
    if (tab === "orderstatus") return v3("ogTitle");
    if (tab === "contacts") return v3("ctTitle");
    if (tab === "zeroglance") return v3("bzTitle");
    if (tab === "reminders") return v3("rmTitle");
    if (tab === "sourceglance") return v3("lsTitle");
    if (tab === "tagpalette") return v3("plTitle");
    if (tab === "assignee") return v3("gnTitle");
    if (tab === "filterpresets") return v3("fpTitle");
    if (tab === "docstatus") return v3("dsTitle");
    if (tab === "sessionnote") return v3("syTitle");
    if (tab === "wdstatus") return v3("wzTitle");
    if (tab === "pinrail") return v3("rlTitle");
    if (tab === "depstatus") return v3("dzTitle");
    if (tab === "mutelist") return v3("muTitle");
    if (tab === "symbolglance") return v3("ymTitle");
    if (tab === "recentjumps") return v3("jvTitle");
    if (tab === "ticketchannel") return v3("tcTitle");
    if (tab === "watchwords") return v3("wwTitle");
    if (tab === "langglance") return v3("lgTitle");
    if (tab === "layoutlock") return v3("lxTitle");
    if (tab === "ibstatus") return v3("bxTitle");
    if (tab === "draftstash") return v3("dfTitle");
    if (tab === "doctypemix") return v3("kmTitle");
    if (tab === "focuscustomer") return v3("fcTitle");
    if (tab === "ordertype") return v3("oyTitle");
    if (tab === "bookmarks") return v3("bqTitle");
    if (tab === "wdglance") return v3("wxTitle");
    if (tab === "snoozelist") return v3("nqTitle");
    if (tab === "depmethod") return v3("mgTitle");
    if (tab === "checkpolish") return v3("hkTitle");
    if (tab === "casepriority") return v3("zqTitle");
    if (tab === "colortags") return v3("qaTitle");
    if (tab === "tradeside") return v3("ysTitle");
    if (tab === "savedviews") return v3("dvTitle");
    if (tab === "kycstatus") return v3("kyTitle");
    if (tab === "followqueue") return v3("ffTitle");
    if (tab === "ticketstatus") return v3("tzTitle");
    if (tab === "rowdensity") return v3("rdTitle");
    if (tab === "ibcountry") return v3("icTitle");
    if (tab === "csvpresets") return v3("xvTitle");
    if (tab === "auditdays") return v3("uyTitle");
    if (tab === "remindpolish") return v3("hcTitle");
    if (tab === "riskglance") return v3("vpTitle");
    if (tab === "handoffpolish") return v3("hpTitle");
    if (tab === "depcurrency") return v3("qcTitle");
    if (tab === "staffpolish") return v3("spTitle");
    if (tab === "wdmethod") return v3("wgTitle");
    if (tab === "meetnotes") return v3("mnTitle");
    if (tab === "orderstat") return v3("jqTitle");
    if (tab === "quickdial") return v3("qdTitle");
    if (tab === "ticketassign") return v3("taTitle");
    if (tab === "callbackqueue") return v3("cbTitle");
    if (tab === "casepriopolish") return v3("zpTitle");
    if (tab === "visitlog") return v3("vlTitle");
    if (tab === "kycdocstat") return v3("ydTitle");
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
    if (CRM_V3_SECTIONS.some((item) => item.id === view)) {
      const jumps = pushJump(readJumps(readJson(JUMP_KEY, [])), view, new Date().toISOString(), CRM_V3_SECTIONS.map((item) => item.id));
      writeJson(JUMP_KEY, jumps);
      window.dispatchEvent(new Event("crmv3:jumps"));
    }
  }, [view, id]);

  useEffect(() => {
    const current = readVisits(readJson(RECENT_JUMP_KEY, []));
    const next = pushVisit(current, String(view), new Date().toISOString());
    const same = next.length === current.length && next.every((item, index) => item.section === current[index]?.section && item.at === current[index]?.at);
    if (same) return;
    writeJson(RECENT_JUMP_KEY, next);
    window.dispatchEvent(new Event("crmv3:recent-jumps"));
  }, [view]);

  return (
    <div data-crmv3-root="" data-theme={theme} data-gold={gold} data-chrome={chrome} data-panel={panel} data-glass={glass} data-scale={scale} data-edge={edge} data-mail={mail} data-focus-sections={deskFocus.includes("sections") ? "1" : "0"} data-focus-rail={deskFocus.includes("rail") ? "1" : "0"} data-focus-tools={deskFocus.includes("tools") ? "1" : "0"} data-row-density={rowDensity} data-fold={folded ? "1" : "0"} data-crmv3-view={id ? `${view}/${id}` : view} className="c3-app font-normal">
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
          <div className="c3-top-tools">
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
          {banner && !shield && <p className="c3-banner">{banner}</p>}
          {offline && !shield && <p className="c3-banner">{v3("offlineWord")}</p>}
          {!offline && idle && !shield && <p className="c3-banner">{v3("idleWord")} {v3("idleStay")}</p>}
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
            {view === "leads" && <LeadBoard base={base} tx={tx} />}
            {view === "quiet" && <QuietDesk />}
            {view === "triage" && <TriageBoard base={base} locale={locale} tx={tx} />}
            {view === "accents" && <AccentStrip />}
            {view === "depboard" && <DepositBoard base={base} locale={locale} tx={tx} />}
            {view === "sop" && <SopPad />}
            {view === "alerts" && <AlertDesk locale={locale} tx={tx} />}
            {view === "folders" && <FolderPad base={base} />}
            {view === "health" && <HealthStrip base={base} locale={locale} tx={tx} />}
            {view === "scratch" && <ScratchBoard />}
            {view === "ibpay" && <IntroducerBoard base={base} locale={locale} tx={tx} />}
            {view === "jumps" && <JumpHistory base={base} />}
            {view === "expiry" && <ExpiryWatch base={base} locale={locale} tx={tx} />}
            {view === "density" && <PanelDensityStrip />}
            {view === "rejects" && <RejectBoard base={base} locale={locale} tx={tx} />}
            {view === "vault" && <VaultPad />}
            {view === "heatmap" && <HeatStrip tx={tx} />}
            {view === "cheats" && <CheatSheet />}
            {view === "digest" && <OvernightDigest />}
            {view === "glass" && <GlassToggle />}
            {view === "compare" && <DeskCompare locale={locale} tx={tx} />}
            {view === "eod" && <EodList />}
            {view === "stale" && <StaleWatch base={base} locale={locale} tx={tx} />}
            {view === "scripts" && <CallScripts />}
            {view === "dupes" && <DupeStrip base={base} locale={locale} tx={tx} />}
            {view === "prep" && <MeetingPrep tx={tx} />}
            {view === "referrals" && <SourceMix base={base} tx={tx} />}
            {view === "winloss" && <WinLog tx={tx} />}
            {view === "vip" && <VipWatch base={base} locale={locale} tx={tx} />}
            {view === "packet" && <HandoffPacket />}
            {view === "clocks" && <DeskClocks />}
            {view === "snippets" && <SnippetPad />}
            {view === "pulse" && <QueuePulse base={base} tx={tx} />}
            {view === "swatches" && <RouteSwatches base={base} />}
            {view === "week" && <WeekAgenda base={base} locale={locale} tx={tx} />}
            {view === "scale" && <FontScale />}
            {view === "shield" && <QuietShield />}
            {view === "stickies" && <StickyPad base={base} />}
            {view === "shiftlist" && <ShiftCheck />}
            {view === "glance" && <LedgerGlance base={base} tx={tx} />}
            {view === "lane" && <PriorityLane base={base} />}
            {view === "docpulse" && <DocPulse base={base} tx={tx} />}
            {view === "edge" && <EdgeStrip />}
            {view === "outcomes" && <CallOutcomes base={base} />}
            {view === "riskwatch" && <RiskWatch base={base} />}
            {view === "maildense" && <MailDensityStrip />}
            {view === "callpack" && <CallPack base={base} />}
            {view === "curchips" && <CurrencyChips base={base} locale={locale} />}
            {view === "markbar" && <BookmarkBar base={base} names={names} />}
            {view === "kycglance" && <KycGlance base={base} />}
            {view === "snooze" && <SnoozeStrip base={base} locale={locale} />}
            {view === "sideglance" && <SideGlance base={base} />}
            {view === "focusmode" && <FocusDesk />}
            {view === "suppulse" && <SupportPulse base={base} />}
            {view === "pinboard" && <PinBoard />}
            {view === "ibglance" && <IbGlance base={base} />}
            {view === "desktimer" && <DeskTimer />}
            {view === "licglance" && <LicenseGlance base={base} />}
            {view === "voicetray" && <VoiceTray />}
            {view === "wdreason" && <ReasonGlance base={base} />}
            {view === "utcmark" && <UtcMarks />}
            {view === "depchannel" && <ChannelGlance base={base} />}
            {view === "statusbanner" && <StatusBanner />}
            {view === "doctype" && <TypeGlance base={base} />}
            {view === "quicklinks" && <QuickLinks />}
            {view === "prioglance" && <PriorityGlance base={base} />}
            {view === "checklist" && <DeskCheck />}
            {view === "countryglance" && <CountryGlance base={base} />}
            {view === "scratchpad" && <ScratchPads />}
            {view === "orderstatus" && <OrderGlance base={base} />}
            {view === "contacts" && <ContactChips />}
            {view === "zeroglance" && <ZeroGlance base={base} />}
            {view === "reminders" && <ReminderChips />}
            {view === "sourceglance" && <SourceGlance base={base} />}
            {view === "tagpalette" && <TagPalette />}
            {view === "assignee" && <AssigneeGlance base={base} />}
            {view === "filterpresets" && <FilterPresets />}
            {view === "docstatus" && <DocStatusGlance base={base} />}
            {view === "sessionnote" && <SessionNote />}
            {view === "wdstatus" && <WithdrawalGlance base={base} />}
            {view === "pinrail" && <PinRail base={base} />}
            {view === "depstatus" && <DepStatusGlance base={base} />}
            {view === "mutelist" && <MuteList base={base} />}
            {view === "symbolglance" && <SymbolGlance base={base} />}
            {view === "recentjumps" && <RecentJumps base={base} />}
            {view === "ticketchannel" && <TicketChannels base={base} />}
            {view === "watchwords" && <WatchWords />}
            {view === "langglance" && <LanguageGlance base={base} />}
            {view === "layoutlock" && <LayoutLock />}
            {view === "ibstatus" && <IbStatusGlance base={base} />}
            {view === "draftstash" && <DraftStash />}
            {view === "doctypemix" && <DocTypeMix base={base} />}
            {view === "focuscustomer" && <FocusCustomer base={base} />}
            {view === "ordertype" && <OrderTypeGlance base={base} />}
            {view === "bookmarks" && <BookmarkBoard base={base} />}
            {view === "wdglance" && <WithdrawalStatus base={base} />}
            {view === "snoozelist" && <SnoozeList base={base} />}
            {view === "depmethod" && <DepositMethod base={base} />}
            {view === "checkpolish" && <CheckPolish />}
            {view === "casepriority" && <CasePriority base={base} />}
            {view === "colortags" && <ColorTags base={base} />}
            {view === "tradeside" && <TradeSide base={base} />}
            {view === "savedviews" && <SavedViews />}
            {view === "kycstatus" && <KycStatus base={base} />}
            {view === "followqueue" && <FollowQueue base={base} />}
            {view === "ticketstatus" && <TicketStatus base={base} />}
            {view === "rowdensity" && <RowDensityDesk />}
            {view === "ibcountry" && <IbCountry base={base} />}
            {view === "csvpresets" && <CsvColumnDesk base={base} />}
            {view === "auditdays" && <AuditDayStrip base={base} />}
            {view === "remindpolish" && <ReminderPolish />}
            {view === "riskglance" && <RiskGlance base={base} />}
            {view === "handoffpolish" && <HandoffPolish base={base} />}
            {view === "depcurrency" && <DepositCurrencies base={base} />}
            {view === "staffpolish" && <StaffPolish base={base} />}
            {view === "wdmethod" && <WithdrawalMethods base={base} />}
            {view === "meetnotes" && <MeetingNotes />}
            {view === "orderstat" && <OrderStatuses base={base} />}
            {view === "quickdial" && <QuickDial />}
            {view === "ticketassign" && <TicketAssignees base={base} />}
            {view === "callbackqueue" && <CallbackQueue />}
            {view === "casepriopolish" && <CasePriorities base={base} />}
            {view === "visitlog" && <VisitLog />}
            {view === "kycdocstat" && <DocumentStatuses base={base} />}
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

      <nav className="c3-tabs c3-icon-rail" aria-label={tx("panel")}>
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
