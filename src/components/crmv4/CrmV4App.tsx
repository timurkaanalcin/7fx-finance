"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import CrmI18n from "@/components/i18n/CrmI18n";
import BrandLogo from "@/components/landing/BrandLogo";
import { useI18n } from "@/lib/i18n/context";
import { crmv2Text, type CrmV2CopyKey } from "@/lib/crmv2/copy";
import { crmv4Text, type CrmV4CopyKey } from "@/lib/crmv4/copy";
import { readJson, writeJson } from "@/lib/crmv4/local";
import { CRM_V4_NAV, CRM_V4_SECTIONS, CRM_V4_TABS, crmv4Href, type CrmV4SectionId } from "@/lib/crmv4/sections";
import { ShortcutHost } from "./round1";
import { DeskSearch, WithdrawDesk } from "./round28";
import { DepositDesk, InboxDesk } from "./round29";
import { InsightsHome, PrefsHub } from "./round32";
import { AgendaPage } from "./round33";
import { DeskStaff } from "./round35";
import { DeskBar } from "./round38";
import { GroupedMenu, PageRail } from "./round30";
import { DeskFoot } from "./round18";
import { HelpDrawer, ShortcutsSheet } from "./round41";
import { OfflineBanner, Tour, UndoHost, densityMode, storeDensity } from "./round2";
import { rememberToast, toastHistory } from "./round3";
import { AnnounceBar, DeskBoundary, FreshnessBar, storedAccent } from "./round4";
import { IdleWarning, storedRole, storedZebra } from "./round5";
import { CallTarget, Fab, MotionPref, storedMotion } from "./round6";
import { RAIL_KEY, readFold } from "@/lib/crmv4/round30";
import { QuickSheet } from "./round22";
import { StaffPage } from "./round24";
import { GoalsPage, TopTrail } from "./round25";
import { KycDesk } from "./round27";
import { DayDesk, ReportDesk } from "./round43";
import { AffiliateDesk } from "./round45";
import { AccessDesk, PayoutDesk } from "./round46";
import { RiskDesk } from "./round47";
import { FundingDesk } from "./round48";
import { ThreadDesk } from "./round49";
import { GalleryDesk, HistoryDesk } from "./round50";
import { DayStrip, DenseList } from "./round51";
import { NoticeCenter, TagBoard, useLocalInboxCount } from "./round52";
import { DeskPad, TradeBlotter } from "./round53";
import { CaseQueue, ShortcutRail } from "./round54";
import { PayoutBoard, ShiftSheet } from "./round55";
import { LeadBoard, QuietDesk } from "./round56";
import { AccentStrip, TriageBoard } from "./round57";
import { DepositBoard, SopPad } from "./round58";
import { AlertDesk, FolderPad } from "./round59";
import { HealthStrip, ScratchBoard } from "./round60";
import { IntroducerBoard, JumpHistory } from "./round61";
import { ExpiryWatch, PanelDensityStrip } from "./round62";
import { RejectBoard, VaultPad } from "./round63";
import { CheatSheet, HeatStrip } from "./round64";
import { GlassToggle, OvernightDigest } from "./round65";
import { DeskCompare, EodList } from "./round66";
import { CallScripts, StaleWatch } from "./round67";
import { DupeStrip, MeetingPrep } from "./round68";
import { SourceMix, WinLog } from "./round69";
import { HandoffPacket, VipWatch } from "./round70";
import { DeskClocks, SnippetPad } from "./round71";
import { QueuePulse, RouteSwatches } from "./round72";
import { FontScale, WeekAgenda } from "./round73";
import { QuietShield, StickyPad } from "./round74";
import { LedgerGlance, ShiftCheck } from "./round75";
import { DocPulse, PriorityLane } from "./round76";
import { CallOutcomes, EdgeStrip } from "./round77";
import { MailDensityStrip, RiskWatch } from "./round78";
import { CallPack, CurrencyChips } from "./round79";
import { BookmarkBar, KycGlance } from "./round80";
import { SideGlance, SnoozeStrip } from "./round81";
import { FocusDesk, SupportPulse } from "./round82";
import { IbGlance, PinBoard } from "./round83";
import { DeskTimer, LicenseGlance } from "./round84";
import { ReasonGlance, VoiceTray } from "./round85";
import { ChannelGlance, UtcMarks } from "./round86";
import { StatusBanner, TypeGlance } from "./round87";
import { PriorityGlance, QuickLinks } from "./round88";
import { CountryGlance, DeskCheck } from "./round89";
import { OrderGlance, ScratchPads } from "./round90";
import { ContactChips, ZeroGlance } from "./round91";
import { ReminderChips, SourceGlance } from "./round92";
import { AssigneeGlance, TagPalette } from "./round93";
import { DocStatusGlance, FilterPresets } from "./round94";
import { SessionNote, WithdrawalGlance } from "./round95";
import { DepStatusGlance, PinRail } from "./round96";
import { MuteList, SymbolGlance } from "./round97";
import { ChannelGlance as TicketChannels, RecentJumps } from "./round98";
import { LanguageGlance, WatchWords } from "./round99";
import { IbStatusGlance, LayoutLock } from "./round100";
import { DocTypeMix, DraftStash } from "./round101";
import { FocusCustomer, OrderTypeGlance } from "./round102";
import { BookmarkBoard, WithdrawalStatus } from "./round103";
import { DepositMethod, SnoozeList } from "./round104";
import { CasePriority, CheckPolish } from "./round105";
import { ColorTags, TradeSide } from "./round106";
import { KycStatus, SavedViews } from "./round107";
import { FollowQueue, TicketStatus } from "./round108";
import { IbCountry, RowDensityDesk } from "./round109";
import { AuditDayStrip, CsvColumnDesk } from "./round110";
import { ReminderPolish, RiskGlance } from "./round111";
import { DepositCurrencies, HandoffPolish } from "./round112";
import { StaffPolish, WithdrawalMethods } from "./round113";
import { MeetingNotes, OrderStatuses } from "./round114";
import { QuickDial, TicketAssignees } from "./round115";
import { CallbackQueue, CasePriorities } from "./round116";
import { DocumentStatuses, VisitLog } from "./round117";
import { LeadSources, ParkingNotes } from "./round118";
import { LockerNotes, TradeSymbols } from "./round119";
import { CourierNotes, IbCountries } from "./round120";
import { DepositMethods, VisitorNotes } from "./round121";
import { MailNotes, WithdrawalStatuses } from "./round122";
import { ReceptionNotes, TicketStatuses } from "./round123";
import { KycStatuses, SupplyNotes } from "./round124";
import { RoomNotes, TradeSides } from "./round125";
import { AffiliateChannels, BreakNotes } from "./round126";
import { LeadStatuses, LoungeNotes } from "./round127";
import { AccountTypes, PantryNotes } from "./round128";
import { CoatNotes, KycFileStatuses } from "./round129";
import { ConciergeNotes, RetentionStatuses } from "./round130";
import { PotentialStatuses, ValetNotes } from "./round131";
import { PorterSlips, ValidationStatuses } from "./round132";
import { BellSlips, TradingGroups } from "./round133";
import { BrokerNames, LampCards } from "./round134";
import { HostCards, TradingServers } from "./round135";
import { CallWindows, CustomerTimezones } from "./round136";
import { ArrivalCards, CustomerCities } from "./round137";
import { CustomerBrowsers, PlaceCards } from "./round138";
import { CustomerSystems, WatchSlips } from "./round139";
import { CustomerDevices, KeyCards } from "./round140";
import { CustomerAtlas, StackSlips } from "./round141";
import { CueCards, CustomerRegions } from "./round142";
import { InvalidReasons, RibbonCards } from "./round143";
import { InvalidSources, PlaybillCards } from "./round144";
import { InterludeCards, RegistrationVintages } from "./round145";
import { FolioSlips, NatalMonths } from "./round146";
import { HouseholdMarks, VellumSlips } from "./round147";
import { CourtesyRanks, QuireLeaves } from "./round148";
import { CallingCodes, SlaPromises } from "./round149";
import { ShiftBriefings, SpokenLanguages } from "./round150";
import { DeskWings, DispatchSlips } from "./round151";
import { LoginBands, LoomTickets } from "./round152";
import { KilnSlips, UsernameHandles } from "./round153";
import { GivenNames, PressProofs } from "./round154";
import { DocketSlips, FamilyNames } from "./round155";
import { QuaySlips, TimezoneBelts } from "./round156";
import { ConservatoryBenches, CountryPlates } from "./round157";
import { AviaryPerches, PresenceWatches } from "./round158";
import { HearthRelays, LoginLanterns } from "./round159";
import { BinderyStitches, CampaignCloths } from "./round160";
import { AffiliateRibbons, DocumentProofs } from "./round161";
import { ContactSeals, QuillReminders } from "./round162";
import { FollowLamps, WaxFollowUps } from "./round163";
import { FirstMarks, GiltAssignments } from "./round164";
import { MarquetryTasks, TradeGates } from "./round165";
import { CloakroomPasses, LoginLatches } from "./round166";
import { ReadingNooks, WithdrawalBolts } from "./round167";
import { OrielHours, TrialLamps } from "./round168";
import { AtelierPasses, BlockNotices } from "./round169";
import { ShutterTimes, VestryChits } from "./round170";
import { ChoirStalls, EmberAges } from "./round171";
import { ArcadeBays, FailedStrikes } from "./round172";
import { GlasshouseStools, RetentionSlips } from "./round173";
import { CountryMarks, OrchardLadders } from "./round174";
import { PhoneStems, WinterTrellises } from "./round175";
import { AddressLanes, HerbariumSheets } from "./round176";
import { RegistryCartouches, RegistryMarks } from "./round177";
import { AtelierChits, CitySlips } from "./round178";
import { DeskPlates, SalonFrames } from "./round179";
import { MailSeals, MapBearings } from "./round180";
import { PartnerCodes, PressSlips } from "./round181";
import { NightChimes, ReferralTokens } from "./round182";
import { AffiliateStems, MorningOrders } from "./round183";
import { InvalidStamps, RetentionKeeps } from "./round184";
import { CourtesyVows, LeverageSpans } from "./round185";
import { OwnerPlates, SlateWatches } from "./round186";
import { ServerStems, VesperBells } from "./round187";
import { IndexSlips, MailHalls } from "./round188";
import { GalleryHooks, LanguageLanes } from "./round189";
import { CallbackWindows, InviteRings } from "./round190";
import { NoticeCrests, ReviewMinutes } from "./round191";
import { DialLanes, QuietHolds } from "./round192";
import { CityMarks, SittingBook } from "./round193";
import { CountrySeals, CourtesyCards } from "./round194";
import { BrokerPlates, VisitPasses } from "./round195";
import { EscortSlips, NoteRibbons } from "./round196";
import { FollowStamps, WaitlistSlots } from "./round197";
import { HandoffBriefs, PledgeMarks } from "./round198";
import { FolioWarrants, MailMonograms } from "./round199";
import { AtelierSittings, SurnameCrests } from "./round200";
import { SalonRecitals, UsernameSeals } from "./round201";
import { GalleryWalks, TimezoneOffsets } from "./round202";
import { OratoryCards, VisitorSeals } from "./round203";
import { AgentScripts, VestibuleBenches } from "./round204";
import { ConservatorySlips, ReferralRibbons } from "./round205";
import { LetterCrests, ReadingLamps } from "./round206";
import { DevicePlates, GalleryMounts } from "./round207";
import { CloisterStalls, SystemCrests } from "./round208";
import { LanguageRibbons, NaveBenches } from "./round209";
import { ApseAlcoves, BrowserCrests } from "./round210";
import { AccountWafers, TranseptStalls } from "./round211";
import { AmbulatoryLanterns, CountryLamps } from "./round212";
import { AddressPlates, NarthexCandles } from "./round213";
import { CryptChests, ResidencySeals } from "./round214";
import { DocumentGrades, InkFolios } from "./round215";
import { ChapterSlips, PartnerRibbons } from "./round216";
import { BellCords, DialSeals } from "./round217";
import { FountainPens, MailCrests } from "./round218";
import { GroupMarks, SeatCards } from "./round219";
import { CityCrests, LoggiaSlips } from "./round220";
import { BelvedereSteps, KeeperSeals } from "./round221";
import { MezzanineRails, SymbolCrests } from "./round222";
import { LogHours, OrielSills } from "./round223";
import { FriezeCards, QuoinMarks } from "./round224";
import { DentilTiles, VoussoirMarks } from "./round225";
import { BrocadeSwatches, PennantMarks } from "./round226";
import { CofferPanels, RosetteMarks } from "./round227";
import { SacristyDrawers, AntiphonMarks } from "./round228";
import { AisleNiches, EscutcheonMarks } from "./round229";
import { CabinetDrawers, WatermarkMarks } from "./round230";
import { ReportMargins, ReportQuires } from "./round231";
import { DutySlips, ProfileCrests } from "./round232";
import { HourMarks, LintelWatches } from "./round233";
import { NoticeBells, TicketSeals } from "./round234";
import { StageMarks, VisitCards } from "./round235";
import { DialectMarks, RefectorySlips } from "./round236";
import { ObservatorySlips, PostureMarks } from "./round237";
import { BadgeMarks, BerthSlips } from "./round238";
import { AlcoveSlips, PassportStamps } from "./round239";
import { ColophonMarks, TerraceCards } from "./round240";
import { CallSheets, PressPlates } from "./round241";
import { DawnBooks, VowelMarks } from "./round242";
import { HourglassSlips, SyllablePlates } from "./round243";
import { BinnacleCards, LuffMarks } from "./round244";
import { MeridianMarks, OrchardBenches } from "./round245";
import { PostmarkLanes, QuireSlips } from "./round246";
import { EmailCrests, NicheCards } from "./round247";
import { CarrelSlips, LoginSeals } from "./round248";
import { ROW_DENSITY_KEY, activeDensity, type RowDensity } from "@/lib/crmv4/round109";
import { JUMP_KEY as RECENT_JUMP_KEY, pushVisit, readVisits } from "@/lib/crmv4/round98";
import { FOCUS_KEY, readFocus, type FocusPanel } from "@/lib/crmv4/round82";
import { MAIL_KEY, readDensity, type MailDensity } from "@/lib/crmv4/round78";
import { PAUSE_KEY, shieldOn } from "@/lib/crmv4/round74";
import { SCALE_KEY, readScale, type PanelScale } from "@/lib/crmv4/round73";
import { GLASS_KEY, readGlass, type GlassMode } from "@/lib/crmv4/round65";
import { PANEL_KEY, readPanel, type PanelDensity } from "@/lib/crmv4/round62";
import { JUMP_KEY, pushJump, readJumps } from "@/lib/crmv4/round61";
import { CHROME_KEY, GOLD_KEY, readChrome, readGold, type ChromeMode, type GoldLevel } from "@/lib/crmv4/round57";
import { FOCUS_FLAG, MUTE_KEY, QUIET_KEY, nowMinutes, readFocusFlag, readMute, readQuiet, shouldAlert } from "@/lib/crmv4/round56";
import { lastView, playPing, rememberView, soundEnabled, ticketAlertsOn } from "./round7";
import { resolvedTheme, storedContrast, storedFont, storedFreeze, themeMode } from "./round8";
import { readBrand } from "./round10";
import type { Accent } from "@/lib/crmv4/round4";
import { Sheet, sendJson, useJson, when } from "./kit";
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
type Scratch = { id: string; body: string };
type Reminder = { id: string; body?: string; remindAt?: string; trader?: string | null };

const FINANCE_LINKS = [
  { tab: "", key: "deposits" },
  { tab: "withdrawals", key: "withdrawals" },
  { tab: "balance", key: "balanceRequests" },
  { tab: "ledger", key: "ledger" },
] as const;

const NOTES_KEY = "crmv4-scratch-notes";

export default function CrmV4App(props: Props) {
  return (
    <CrmI18n>
      <Shell {...props} />
    </CrmI18n>
  );
}

function Shell({ base, section, name }: Props) {
  const { locale } = useI18n();
  const tx = useCallback((key: CrmV2CopyKey) => crmv2Text(locale, key), [locale]);
  const v4 = useCallback((key: CrmV4CopyKey) => crmv4Text(locale, key), [locale]);
  const view = (section[0] || "overview") as CrmV4SectionId | string;
  const id = section[1] || "";
  const [more, setMore] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [padOpen, setPadOpen] = useState(false);
  const [remindersOpen, setRemindersOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [rowDensity, setRowDensity] = useState<RowDensity>("comfortable");
  const [shownName, setShownName] = useState("");
  const [trail, setTrail] = useState<string[]>([]);
  const [toastsLog, setToastsLog] = useState<{ id: number; text: string; ok: boolean }[]>([]);
  const [logOpen, setLogOpen] = useState(false);
  const [financeOpen, setFinanceOpen] = useState(false);
  const [gearOpen, setGearOpen] = useState(false);
  const [folded, setFolded] = useState(false);
  const [railQuery, setRailQuery] = useState("");
  const [theme, setTheme] = useState<"dark" | "light">("light");
  const [accent, setAccent] = useState<Accent>("champagne");
  const [role, setRole] = useState<"desk" | "viewer">("desk");
  const [zebra, setZebra] = useState(false);
  const [motion, setMotion] = useState<"system" | "reduce">("system");
  const [resume, setResume] = useState("");
  const [shield, setShield] = useState(false);
  const [compact, setCompact] = useState(false);
  const [font, setFont] = useState<"sm" | "md" | "lg">("md");
  const [contrast, setContrast] = useState(false);
  const [freeze, setFreeze] = useState(false);
  const [focus, setFocus] = useState(false);
  const [gold, setGold] = useState<GoldLevel>("desk");
  const [panel, setPanel] = useState<PanelDensity>("desk");
  const [glass, setGlass] = useState<GlassMode>("soft");
  const [scale, setScale] = useState<PanelScale>("desk");
  const [mail, setMail] = useState<MailDensity>("desk");
  const [deskFocus, setDeskFocus] = useState<FocusPanel[]>([]);
  const [chrome, setChrome] = useState<ChromeMode>("roomy");
  const [brand, setBrand] = useState("");
  const ticketSeen = useRef(0);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [scratch, setScratch] = useState<Scratch[]>([]);
  const params = useSearchParams();
  const q = params.get("q") || "";
  const notes = useJson<{ items?: { id: string; kind?: string; title?: string; body?: string; readAt?: string | null; createdAt?: string }[]; unread?: number }>("/api/notifications?take=20");
  const inboxUnread = useLocalInboxCount();
  const stats = useJson<{ kpis?: { pendingDeposits?: number; pendingBalanceRequests?: number } }>("/api/admin/stats");
  const reminders = useJson<{ reminders?: Reminder[] }>(remindersOpen ? "/api/admin/calendar?take=80" : null);
  const pending = (stats.data?.kpis?.pendingDeposits || 0) + (stats.data?.kpis?.pendingBalanceRequests || 0);
  const unread = notes.data?.unread || 0;

  useEffect(() => {
    const current = readVisits(readJson(RECENT_JUMP_KEY, []));
    const next = pushVisit(current, String(view), new Date().toISOString());
    const same = next.length === current.length && next.every((item, index) => item.section === current[index]?.section && item.at === current[index]?.at);
    if (same) return;
    writeJson(RECENT_JUMP_KEY, next);
    window.dispatchEvent(new Event("crmv4:jumps"));
  }, [view]);

  useEffect(() => {
    const mode = themeMode();
    setTheme(resolvedTheme(mode === "light" || mode === "dark" ? mode : "system"));
    setFont(storedFont());
    setContrast(storedContrast());
    setFreeze(storedFreeze());
    const onFont = (event: Event) => setFont((event as CustomEvent<"sm" | "md" | "lg">).detail || "md");
    const onContrast = (event: Event) => setContrast(Boolean((event as CustomEvent<boolean>).detail));
    const onFreeze = (event: Event) => setFreeze(Boolean((event as CustomEvent<boolean>).detail));
    const onMode = () => setTheme(resolvedTheme(themeMode()));
    window.addEventListener("crmv4:font", onFont);
    window.addEventListener("crmv4:contrast", onContrast);
    window.addEventListener("crmv4:freeze", onFreeze);
    window.addEventListener("crmv4:theme-mode", onMode);
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", onMode);
    setDensity(densityMode());
    const onDensity = () => setDensity(densityMode());
    window.addEventListener("crmv4:density", onDensity);
    const applyRow = () => setRowDensity(activeDensity(readJson(ROW_DENSITY_KEY, "")));
    applyRow();
    window.addEventListener("crmv4:row-density", applyRow);
    setTrail(readTrail());
    setToastsLog(toastHistory());
    setScratch(readJson<Scratch[]>(NOTES_KEY, []));
    setAccent(storedAccent());
    setBrand(readBrand());
    const onFocus = (event: Event) => setFocus(Boolean((event as CustomEvent<boolean>).detail));
    const onBrand = () => setBrand(readBrand());
    window.addEventListener("crmv4:focus", onFocus);
    window.addEventListener("crmv4:brand", onBrand);
    setRole(storedRole());
    setFocus(readFocusFlag(readJson(FOCUS_FLAG, false)));
    setGold(readGold(readJson(GOLD_KEY, "desk")));
    setChrome(readChrome(readJson(CHROME_KEY, "roomy")));
    setPanel(readPanel(readJson(PANEL_KEY, "desk")));
    setGlass(readGlass(readJson(GLASS_KEY, "soft")));
    setScale(readScale(readJson(SCALE_KEY, "desk")));
    setMail(readDensity(readJson(MAIL_KEY, "desk")));
    setDeskFocus(readFocus(readJson(FOCUS_KEY, [])));
    const onGold = (event: Event) => setGold(readGold((event as CustomEvent).detail));
    const onChrome = (event: Event) => setChrome(readChrome((event as CustomEvent).detail));
    const onPanel = (event: Event) => setPanel(readPanel((event as CustomEvent).detail));
    const onGlass = (event: Event) => setGlass(readGlass((event as CustomEvent).detail));
    const onScale = (event: Event) => setScale(readScale((event as CustomEvent).detail));
    const onMail = (event: Event) => setMail(readDensity((event as CustomEvent).detail));
    const onDeskFocus = (event: Event) => setDeskFocus(readFocus((event as CustomEvent).detail));
    window.addEventListener("crmv4:gold", onGold);
    window.addEventListener("crmv4:chrome", onChrome);
    window.addEventListener("crmv4:panel", onPanel);
    window.addEventListener("crmv4:glass", onGlass);
    window.addEventListener("crmv4:scale", onScale);
    window.addEventListener("crmv4:mail", onMail);
    window.addEventListener("crmv4:desk-focus", onDeskFocus);
    setZebra(storedZebra());
    setMotion(storedMotion());
    const onMotion = (event: Event) => setMotion((event as CustomEvent<string>).detail === "reduce" ? "reduce" : "system");
    window.addEventListener("crmv4:motion", onMotion);
    const onRole = (event: Event) => setRole((event as CustomEvent<string>).detail === "viewer" ? "viewer" : "desk");
    const onZebra = (event: Event) => setZebra(Boolean((event as CustomEvent<boolean>).detail));
    window.addEventListener("crmv4:role", onRole);
    window.addEventListener("crmv4:zebra", onZebra);
    const onAccent = (event: Event) => setAccent((event as CustomEvent<Accent>).detail || "champagne");
    window.addEventListener("crmv4:accent", onAccent);
    return () => {
      window.removeEventListener("crmv4:accent", onAccent);
      window.removeEventListener("crmv4:role", onRole);
      window.removeEventListener("crmv4:zebra", onZebra);
      window.removeEventListener("crmv4:motion", onMotion);
      window.removeEventListener("crmv4:font", onFont);
      window.removeEventListener("crmv4:contrast", onContrast);
      window.removeEventListener("crmv4:freeze", onFreeze);
      window.removeEventListener("crmv4:theme-mode", onMode);
      window.removeEventListener("crmv4:density", onDensity);
      window.removeEventListener("crmv4:row-density", applyRow);
      window.removeEventListener("crmv4:focus", onFocus);
      window.removeEventListener("crmv4:gold", onGold);
      window.removeEventListener("crmv4:chrome", onChrome);
      window.removeEventListener("crmv4:panel", onPanel);
      window.removeEventListener("crmv4:glass", onGlass);
      window.removeEventListener("crmv4:mail", onMail);
      window.removeEventListener("crmv4:desk-focus", onDeskFocus);
      window.removeEventListener("crmv4:brand", onBrand);
      media.removeEventListener("change", onMode);
    };
  }, []);

  useEffect(() => {
    const read = () => {
      const prefs = readJson<{ displayName?: string }>("crmv4-staff-prefs", {});
      setShownName(String(prefs.displayName || "").trim());
    };
    read();
    window.addEventListener("crmv4:staff-prefs", read);
    return () => window.removeEventListener("crmv4:staff-prefs", read);
  }, []);

  useEffect(() => {
    const read = () => setShield(shieldOn(readQuiet(readJson(QUIET_KEY, {})), readJson(PAUSE_KEY, ""), new Date()));
    read();
    const timer = window.setInterval(read, 30000);
    window.addEventListener("crmv4:quiet", read);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("crmv4:quiet", read);
    };
  }, []);

  function alertNow(kind: string) {
    const quiet = readQuiet(readJson(QUIET_KEY, {}));
    return shouldAlert({
      kind,
      muted: readMute(readJson(MUTE_KEY, [])),
      focus: readFocusFlag(readJson(FOCUS_FLAG, false)),
      start: quiet.start,
      end: quiet.end,
      nowMin: nowMinutes(new Date()),
    });
  }

  useEffect(() => {
    const baseTitle = "CRM v4";
    document.title = unread > 0 ? `(${unread}) ${baseTitle}` : baseTitle;
    const kind = String((notes.data?.items || []).find((row) => !row.readAt)?.kind || "info");
    if (unread > ticketSeen.current && soundEnabled() && alertNow(kind)) playPing();
    ticketSeen.current = unread;
  }, [unread, notes.data]);

  useEffect(() => {
    if (!ticketAlertsOn()) return;
    const id = window.setInterval(async () => {
      if (!ticketAlertsOn() || typeof Notification === "undefined" || Notification.permission !== "granted") return;
      const res = await fetch("/api/admin/tickets?status=PENDING", { cache: "no-store" });
      if (!res.ok) return;
      const body = await res.json() as { tickets?: unknown[] };
      const count = (body.tickets || []).length;
      const seen = Number(window.sessionStorage.getItem("crmv4-ticket-count") || "0");
      if (count > seen && alertNow("ticket")) new Notification(v4("ticketNotify"));
      window.sessionStorage.setItem("crmv4-ticket-count", String(count));
    }, 60000);
    return () => window.clearInterval(id);
  }, [v4]);

  useEffect(() => {
    const path = window.location.pathname + window.location.search;
    const previous = lastView();
    if (previous && previous !== path && view === "overview" && !id) setResume(previous);
    rememberView(path);
    if (CRM_V4_SECTIONS.some((item) => item.id === view)) {
      const jumps = pushJump(readJumps(readJson(JUMP_KEY, [])), view, new Date().toISOString(), CRM_V4_SECTIONS.map((item) => item.id));
      writeJson(JUMP_KEY, jumps);
      window.dispatchEvent(new Event("crmv4:jumps"));
    }
    const next = [...readTrail().filter((item) => item !== path), path].slice(-8);
    window.sessionStorage.setItem("crmv4-trail", JSON.stringify(next));
    setTrail(next);
  }, [view, id]);

  useEffect(() => {
    const onToast = (event: Event) => {
      const detail = (event as CustomEvent<{ ok: boolean; error: string }>).detail;
      if (!detail) return;
      const item = { id: Date.now(), ok: detail.ok, text: detail.ok ? tx("saved") : detail.error || tx("failed") };
      rememberToast(item.text, item.ok);
      setToastsLog(toastHistory());
      if (shieldOn(readQuiet(readJson(QUIET_KEY, {})), readJson(PAUSE_KEY, ""), new Date())) return;
      setToasts((list) => [...list.slice(-2), item]);
      window.setTimeout(() => setToasts((list) => list.filter((row) => row.id !== item.id)), 2400);
    };
    window.addEventListener("crmv4:toast", onToast);
    return () => window.removeEventListener("crmv4:toast", onToast);
  }, [tx]);

  useEffect(() => {
    if (!financeOpen && !gearOpen) return;
    const close = () => {
      setFinanceOpen(false);
      setGearOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("click", close);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("keydown", onKey);
    };
  }, [financeOpen, gearOpen]);

  useEffect(() => { setFolded(readFold(window.localStorage.getItem(RAIL_KEY))); }, []);

  function toggleFold() {
    setFolded((current) => {
      const next = !current;
      window.localStorage.setItem(RAIL_KEY, next ? "1" : "0");
      return next;
    });
  }

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    window.localStorage.setItem("crmv4-theme-mode", next);
    window.dispatchEvent(new Event("crmv4:theme-mode"));
  }

  function label(tab: string) {
    if (tab === "me") return v4("staffProfile");
    if (tab === "goals") return v4("goalsTitle");
    if (tab === "kyc") return v4("kycDesk");
    if (tab === "reports") return v4("reportsTitle");
    if (tab === "withdraw") return v4("wdDesk");
    if (tab === "deposit") return v4("depDesk");
    if (tab === "inbox") return v4("inboxTitle");
    if (tab === "insights") return v4("insTitle");
    if (tab === "prefs") return v4("prefTitle");
    if (tab === "agenda") return v4("agTitle");
    if (tab === "roster") return v4("staffTitle");
    if (tab === "day") return v4("dayTitle");
    if (tab === "affiliates") return v4("afTitle");
    if (tab === "payout") return v4("pqTitle");
    if (tab === "access") return v4("axTitle");
    if (tab === "risk") return v4("rkTitle");
    if (tab === "funding") return v4("fuTitle");
    if (tab === "thread") return v4("cvTitle");
    if (tab === "gallery") return v4("glTitle");
    if (tab === "history") return v4("hsTitle");
    if (tab === "dense") return v4("dnTitle");
    if (tab === "notices") return v4("ibTitle");
    if (tab === "tags") return v4("tgTitle");
    if (tab === "blotter") return v4("blTitle");
    if (tab === "pad") return v4("pdTitle");
    if (tab === "cases") return v4("cqTitle");
    if (tab === "shortcuts") return v4("scTitle");
    if (tab === "payboard") return v4("pbTitle");
    if (tab === "handoff") return v4("shTitle");
    if (tab === "leads") return v4("ldTitle");
    if (tab === "quiet") return v4("qfTitle");
    if (tab === "triage") return v4("trTitle");
    if (tab === "accents") return v4("acTitle");
    if (tab === "depboard") return v4("dbTitle");
    if (tab === "sop") return v4("sopTitle");
    if (tab === "alerts") return v4("raTitle");
    if (tab === "folders") return v4("bmTitle");
    if (tab === "health") return v4("hlTitle");
    if (tab === "scratch") return v4("sbTitle");
    if (tab === "ibpay") return v4("cmTitle");
    if (tab === "jumps") return v4("jpTitle");
    if (tab === "expiry") return v4("exTitle");
    if (tab === "density") return v4("lyTitle");
    if (tab === "rejects") return v4("rjTitle");
    if (tab === "vault") return v4("vhTitle");
    if (tab === "heatmap") return v4("htTitle");
    if (tab === "cheats") return v4("csTitle");
    if (tab === "digest") return v4("odTitle");
    if (tab === "glass") return v4("gsTitle");
    if (tab === "compare") return v4("mcTitle");
    if (tab === "eod") return v4("eodTitle");
    if (tab === "stale") return v4("slTitle");
    if (tab === "scripts") return v4("tkTitle");
    if (tab === "dupes") return v4("dpTitle");
    if (tab === "prep") return v4("mpTitle");
    if (tab === "sources") return v4("sxTitle");
    if (tab === "winlog") return v4("wnTitle");
    if (tab === "vip") return v4("vwTitle");
    if (tab === "packet") return v4("pkTitle");
    if (tab === "clocks") return v4("ckTitle");
    if (tab === "snippets") return v4("snTitle");
    if (tab === "pulse") return v4("puTitle");
    if (tab === "swatches") return v4("swTitle");
    if (tab === "week") return v4("wkTitle");
    if (tab === "scale") return v4("tyTitle");
    if (tab === "shield") return v4("qhTitle");
    if (tab === "stickies") return v4("cnTitle");
    if (tab === "shiftlist") return v4("sfTitle");
    if (tab === "glance") return v4("gcTitle");
    if (tab === "lane") return v4("lnTitle");
    if (tab === "docpulse") return v4("xpTitle");
    if (tab === "edge") return v4("egTitle");
    if (tab === "outcomes") return v4("ocTitle");
    if (tab === "riskwatch") return v4("rwTitle");
    if (tab === "maildense") return v4("mdTitle");
    if (tab === "callpack") return v4("cpTitle");
    if (tab === "curchips") return v4("ccTitle");
    if (tab === "markbar") return v4("mbTitle");
    if (tab === "kycglance") return v4("kgTitle");
    if (tab === "snooze") return v4("szTitle");
    if (tab === "sideglance") return v4("sdTitle");
    if (tab === "focusmode") return v4("fmTitle");
    if (tab === "suppulse") return v4("qpTitle");
    if (tab === "pinboard") return v4("pnTitle");
    if (tab === "ibglance") return v4("igTitle");
    if (tab === "desktimer") return v4("dtTitle");
    if (tab === "licglance") return v4("lcTitle");
    if (tab === "voicetray") return v4("vsTitle");
    if (tab === "wdreason") return v4("wrTitle");
    if (tab === "utcmark") return v4("cdTitle");
    if (tab === "depchannel") return v4("dcTitle");
    if (tab === "statusbanner") return v4("bnTitle");
    if (tab === "doctype") return v4("dgTitle");
    if (tab === "quicklinks") return v4("qkTitle");
    if (tab === "prioglance") return v4("pgTitle");
    if (tab === "checklist") return v4("chTitle");
    if (tab === "countryglance") return v4("cyTitle");
    if (tab === "scratchpad") return v4("npTitle");
    if (tab === "orderstatus") return v4("ogTitle");
    if (tab === "contacts") return v4("ctTitle");
    if (tab === "zeroglance") return v4("bzTitle");
    if (tab === "reminders") return v4("rmTitle");
    if (tab === "sourceglance") return v4("lsTitle");
    if (tab === "tagpalette") return v4("plTitle");
    if (tab === "assignee") return v4("gnTitle");
    if (tab === "filterpresets") return v4("fpTitle");
    if (tab === "docstatus") return v4("dsTitle");
    if (tab === "sessionnote") return v4("syTitle");
    if (tab === "wdstatus") return v4("wzTitle");
    if (tab === "pinrail") return v4("rlTitle");
    if (tab === "depstatus") return v4("dzTitle");
    if (tab === "mutelist") return v4("muTitle");
    if (tab === "symbolglance") return v4("ymTitle");
    if (tab === "recentjumps") return v4("jvTitle");
    if (tab === "ticketchannel") return v4("tcTitle");
    if (tab === "watchwords") return v4("wwTitle");
    if (tab === "langglance") return v4("lgTitle");
    if (tab === "layoutlock") return v4("lxTitle");
    if (tab === "ibstatus") return v4("bxTitle");
    if (tab === "draftstash") return v4("dfTitle");
    if (tab === "doctypemix") return v4("kmTitle");
    if (tab === "focuscustomer") return v4("fcTitle");
    if (tab === "ordertype") return v4("oyTitle");
    if (tab === "bookmarks") return v4("bqTitle");
    if (tab === "wdglance") return v4("wxTitle");
    if (tab === "snoozelist") return v4("nqTitle");
    if (tab === "depmethod") return v4("mgTitle");
    if (tab === "checkpolish") return v4("hkTitle");
    if (tab === "casepriority") return v4("zqTitle");
    if (tab === "colortags") return v4("qaTitle");
    if (tab === "tradeside") return v4("ysTitle");
    if (tab === "savedviews") return v4("dvTitle");
    if (tab === "kycstatus") return v4("kyTitle");
    if (tab === "followqueue") return v4("ffTitle");
    if (tab === "ticketstatus") return v4("tzTitle");
    if (tab === "rowdensity") return v4("rdTitle");
    if (tab === "ibcountry") return v4("icTitle");
    if (tab === "csvpresets") return v4("xvTitle");
    if (tab === "auditdays") return v4("uyTitle");
    if (tab === "remindpolish") return v4("hcTitle");
    if (tab === "riskglance") return v4("vpTitle");
    if (tab === "handoffpolish") return v4("hpTitle");
    if (tab === "depcurrency") return v4("qcTitle");
    if (tab === "staffpolish") return v4("spTitle");
    if (tab === "wdmethod") return v4("wgTitle");
    if (tab === "meetnotes") return v4("mnTitle");
    if (tab === "orderstat") return v4("jqTitle");
    if (tab === "quickdial") return v4("qdTitle");
    if (tab === "ticketassign") return v4("taTitle");
    if (tab === "callbackqueue") return v4("cbTitle");
    if (tab === "casepriopolish") return v4("zpTitle");
    if (tab === "visitlog") return v4("vlTitle");
    if (tab === "kycdocstat") return v4("ydTitle");
    if (tab === "parkspot") return v4("bayTitle");
    if (tab === "leadsrc") return v4("lsgTitle");
    if (tab === "locker") return v4("lokTitle");
    if (tab === "tradesym") return v4("tsyTitle");
    if (tab === "courier") return v4("crrTitle");
    if (tab === "ibctry") return v4("ibgTitle");
    if (tab === "visitor") return v4("bdgTitle");
    if (tab === "depglance") return v4("dmgTitle");
    if (tab === "mailroom") return v4("mlrTitle");
    if (tab === "wdsg") return v4("wsgTitle");
    if (tab === "reception") return v4("rxnTitle");
    if (tab === "tktsg") return v4("tksTitle");
    if (tab === "supply") return v4("splTitle");
    if (tab === "kycsg") return v4("kysTitle");
    if (tab === "confroom") return v4("rmnTitle");
    if (tab === "sidesg") return v4("sdgTitle");
    if (tab === "breakroom") return v4("brkTitle");
    if (tab === "affchan") return v4("acgTitle");
    if (tab === "lounge") return v4("lngTitle");
    if (tab === "leadstat") return v4("ldsTitle");
    if (tab === "pantry") return v4("pntTitle");
    if (tab === "accttype") return v4("atyTitle");
    if (tab === "coat") return v4("cctTitle");
    if (tab === "kycfile") return v4("kflTitle");
    if (tab === "concierge") return v4("cncTitle");
    if (tab === "retstat") return v4("rtnTitle");
    if (tab === "valet") return v4("vltTitle");
    if (tab === "potstat") return v4("potTitle");
    if (tab === "porter") return v4("prtTitle");
    if (tab === "valstat") return v4("vldTitle");
    if (tab === "bell") return v4("bllTitle");
    if (tab === "trgroup") return v4("tgrTitle");
    if (tab === "lamp") return v4("lmpTitle");
    if (tab === "broker") return v4("bknTitle");
    if (tab === "host") return v4("hstTitle");
    if (tab === "server") return v4("tsvTitle");
    if (tab === "callwin") return v4("cwnTitle");
    if (tab === "zones") return v4("zonTitle");
    if (tab === "arrival") return v4("arrTitle");
    if (tab === "cities") return v4("citTitle");
    if (tab === "place") return v4("plcTitle");
    if (tab === "browsers") return v4("brwTitle");
    if (tab === "watch") return v4("wchTitle");
    if (tab === "systems") return v4("ostTitle");
    if (tab === "keys") return v4("kcdTitle");
    if (tab === "devices") return v4("dvcTitle");
    if (tab === "stacks") return v4("slpTitle");
    if (tab === "atlas") return v4("atlTitle");
    if (tab === "cues") return v4("cueTitle");
    if (tab === "regions") return v4("rgnTitle");
    if (tab === "ribbons") return v4("ribTitle");
    if (tab === "reasons") return v4("rsnTitle");
    if (tab === "playbill") return v4("plyTitle");
    if (tab === "ivsource") return v4("ivsTitle");
    if (tab === "interlude") return v4("itlTitle");
    if (tab === "vintage") return v4("vntTitle");
    if (tab === "folio") return v4("folTitle");
    if (tab === "natal") return v4("ntlTitle");
    if (tab === "vellum") return v4("vlmTitle");
    if (tab === "house") return v4("hhdTitle");
    if (tab === "quire") return v4("qreTitle");
    if (tab === "courtesy") return v4("ctsTitle");
    if (tab === "promise") return v4("slaTitle");
    if (tab === "calling") return v4("clgTitle");
    if (tab === "briefing") return v4("brfTitle");
    if (tab === "lexicon") return v4("lexTitle");
    if (tab === "dispatch") return v4("dspTitle");
    if (tab === "wings") return v4("dskTitle");
    if (tab === "loom") return v4("lomTitle");
    if (tab === "bands") return v4("bndTitle");
    if (tab === "kiln") return v4("klnTitle");
    if (tab === "handles") return v4("hdlTitle");
    if (tab === "proofs") return v4("prfTitle");
    if (tab === "given") return v4("gvnTitle");
    if (tab === "dockets") return v4("dktTitle");
    if (tab === "family") return v4("famTitle");
    if (tab === "quay") return v4("quyTitle");
    if (tab === "belts") return v4("zblTitle");
    if (tab === "bench") return v4("bnkTitle");
    if (tab === "perch") return v4("avpTitle");
    if (tab === "presence") return v4("pswTitle");
    if (tab === "hearth") return v4("hrlTitle");
    if (tab === "lantern") return v4("ltnTitle");
    if (tab === "stitch") return v4("bstTitle");
    if (tab === "cloth") return v4("cclTitle");
    if (tab === "proof") return v4("prfTitle");
    if (tab === "ribbon") return v4("arbTitle");
    if (tab === "quill") return v4("qllTitle");
    if (tab === "seal") return v4("aslTitle");
    if (tab === "wax") return v4("wxfTitle");
    if (tab === "lamp") return v4("flmTitle");
    if (tab === "gilt") return v4("gltTitle");
    if (tab === "ftd") return v4("fdmTitle");
    if (tab === "marq") return v4("mrqTitle");
    if (tab === "gate") return v4("tgnTitle");
    if (tab === "cloak") return v4("clkTitle");
    if (tab === "latch") return v4("ltcTitle");
    if (tab === "nook") return v4("nokTitle");
    if (tab === "bolt") return v4("bltTitle");
    if (tab === "oriel") return v4("orlTitle");
    if (tab === "trial") return v4("trlTitle");
    if (tab === "atelier") return v4("atpTitle");
    if (tab === "notice") return v4("nbmTitle");
    if (tab === "vestry") return v4("vstTitle");
    if (tab === "shutter") return v4("shtTitle");
    if (tab === "choir") return v4("chrTitle");
    if (tab === "ember") return v4("embTitle");
    if (tab === "arcade") return v4("arcTitle");
    if (tab === "strike") return v4("stkTitle");
    if (tab === "stool") return v4("stlTitle");
    if (tab === "rslip") return v4("rslTitle");
    if (tab === "ladder") return v4("ldrTitle");
    if (tab === "ctmark") return v4("ctyTitle");
    if (tab === "wtrls") return v4("wtrTitle");
    if (tab === "pstems") return v4("pstTitle");
    if (tab === "hbrms") return v4("hbrTitle");
    if (tab === "alane") return v4("alnTitle");
    if (tab === "crtch") return v4("crtTitle");
    if (tab === "rgtry") return v4("rgtTitle");
    if (tab === "chits") return v4("chtTitle");
    if (tab === "ctysl") return v4("cslTitle");
    if (tab === "frames") return v4("frmTitle");
    if (tab === "dkplt") return v4("dkpTitle");
    if (tab === "bear") return v4("brgTitle");
    if (tab === "mlsl") return v4("mlsTitle");
    if (tab === "press") return v4("prsTitle");
    if (tab === "pcmk") return v4("pcmTitle");
    if (tab === "chime") return v4("nchTitle");
    if (tab === "rftok") return v4("rftTitle");
    if (tab === "morn") return v4("morTitle");
    if (tab === "aaid") return v4("aidTitle");
    if (tab === "keeps") return v4("kpvTitle");
    if (tab === "istmp") return v4("stpTitle");
    if (tab === "vows") return v4("vowTitle");
    if (tab === "span") return v4("spnTitle");
    if (tab === "plates") return v4("pltTitle");
    if (tab === "vesper") return v4("vspTitle");
    if (tab === "stem") return v4("stmTitle");
    if (tab === "index") return v4("idxTitle");
    if (tab === "mhall") return v4("mhlTitle");
    if (tab === "ghook") return v4("ghkTitle");
    if (tab === "llane") return v4("llnTitle");
    if (tab === "cwin") return v4("cbkTitle");
    if (tab === "iring") return v4("irgTitle");
    if (tab === "rvmin") return v4("rvmTitle");
    if (tab === "ncts") return v4("nctTitle");
    if (tab === "qhold") return v4("qhdTitle");
    if (tab === "dials") return v4("dlnTitle");
    if (tab === "sbook") return v4("stbTitle");
    if (tab === "cmks") return v4("cmkTitle");
    if (tab === "crtsy") return v4("ccrTitle");
    if (tab === "nseal") return v4("nslTitle");
    if (tab === "vpass") return v4("vpsTitle");
    if (tab === "bplt") return v4("bplTitle");
    if (tab === "esl") return v4("eslTitle");
    if (tab === "nrb") return v4("nrbTitle");
    if (tab === "wslt") return v4("wslTitle");
    if (tab === "fstp") return v4("fstTitle");
    if (tab === "hbrf") return v4("hbfTitle");
    if (tab === "plgm") return v4("pgmTitle");
    if (tab === "flwt") return v4("flwTitle");
    if (tab === "mngm") return v4("mngTitle");
    if (tab === "sitt") return v4("sitTitle");
    if (tab === "crst") return v4("crsTitle");
    if (tab === "rctl") return v4("rctTitle");
    if (tab === "unsl") return v4("unsTitle");
    if (tab === "gwlk") return v4("gwkTitle");
    if (tab === "tzon") return v4("tznTitle");
    if (tab === "orcd") return v4("orcTitle");
    if (tab === "vsip") return v4("vslTitle");
    if (tab === "vstb") return v4("vnbTitle");
    if (tab === "agsc") return v4("agsTitle");
    if (tab === "cnsl") return v4("cnsTitle");
    if (tab === "rfbn") return v4("rfbTitle");
    if (tab === "rdlm") return v4("rdlTitle");
    if (tab === "ltrc") return v4("ltrTitle");
    if (tab === "glmt") return v4("glmTitle");
    if (tab === "dvpl") return v4("dvpTitle");
    if (tab === "clst") return v4("clsTitle");
    if (tab === "sycr") return v4("syoTitle");
    if (tab === "nvbn") return v4("nvbTitle");
    if (tab === "lnrb") return v4("lnrTitle");
    if (tab === "apal") return v4("apsTitle");
    if (tab === "brcr") return v4("brcTitle");
    if (tab === "trst") return v4("trsTitle");
    if (tab === "acwf") return v4("acwTitle");
    if (tab === "amln") return v4("amlnTitle");
    if (tab === "clmp") return v4("clmTitle");
    if (tab === "nxcd") return v4("nxcTitle");
    if (tab === "adpl") return v4("adrTitle");
    if (tab === "crbx") return v4("crbTitle");
    if (tab === "rsdl") return v4("rsdTitle");
    if (tab === "iflo") return v4("iflTitle");
    if (tab === "dgrd") return v4("dgrTitle");
    if (tab === "chsl") return v4("chsTitle");
    if (tab === "pbrb") return v4("pbrTitle");
    if (tab === "blcd") return v4("blcTitle");
    if (tab === "dlsl") return v4("dlsTitle");
    if (tab === "fpen") return v4("fpnTitle");
    if (tab === "mcrs") return v4("mcrTitle");
    if (tab === "stcd") return v4("stcTitle");
    if (tab === "gmkp") return v4("gmkTitle");
    if (tab === "lgsl") return v4("lgsTitle");
    if (tab === "ctcr") return v4("ctcrTitle");
    if (tab === "bvst") return v4("bvsTitle");
    if (tab === "kpsl") return v4("kpsTitle");
    if (tab === "mzrl") return v4("mzrTitle");
    if (tab === "syct") return v4("sycTitle");
    if (tab === "orsl") return v4("orsTitle");
    if (tab === "lghr") return v4("lghTitle");
    if (tab === "frze") return v4("frzTitle");
    if (tab === "qmks") return v4("qmkTitle");
    if (tab === "dntl") return v4("dntTitle");
    if (tab === "vous") return v4("vousTitle");
    if (tab === "brdc") return v4("brdTitle");
    if (tab === "pnnt") return v4("wmpTitle");
    if (tab === "coff") return v4("cffTitle");
    if (tab === "rsst") return v4("rstTitle");
    if (tab === "scdr") return v4("sdrTitle");
    if (tab === "antp") return v4("antTitle");
    if (tab === "aisl") return v4("ainTitle");
    if (tab === "esct") return v4("escTitle");
    if (tab === "cabn") return v4("cabTitle");
    if (tab === "wmk") return v4("wmkTitle");
    if (tab === "qire") return v4("qirTitle");
    if (tab === "rmgn") return v4("rmgTitle");
    if (tab === "dty") return v4("dtyTitle");
    if (tab === "pcr") return v4("pcrTitle");
    if (tab === "lnw") return v4("lnwTitle");
    if (tab === "hmk") return v4("hmkTitle");
    if (tab === "nbl") return v4("nblTitle");
    if (tab === "tsl") return v4("tslTitle");
    if (tab === "vcd") return v4("vcdTitle");
    if (tab === "smk") return v4("smkTitle");
    if (tab === "rsl") return v4("rfsTitle");
    if (tab === "dlg") return v4("dlgTitle");
    if (tab === "obv") return v4("obvTitle");
    if (tab === "psr") return v4("psrTitle");
    if (tab === "brt") return v4("brtTitle");
    if (tab === "bdg") return v4("bdgTitle");
    if (tab === "alv") return v4("alvTitle");
    if (tab === "psp") return v4("pspTitle");
    if (tab === "trc") return v4("trcTitle");
    if (tab === "clp") return v4("clpTitle");
    if (tab === "csh") return v4("cshTitle");
    if (tab === "ppl") return v4("pplTitle");
    if (tab === "dnb") return v4("dnbTitle");
    if (tab === "lcr") return v4("lcrTitle");
    if (tab === "hgl") return v4("hglTitle");
    if (tab === "syl") return v4("sylTitle");
    if (tab === "bnc") return v4("bncTitle");
    if (tab === "luf") return v4("lufTitle");
    if (tab === "orb") return v4("orbTitle");
    if (tab === "mrd") return v4("mrdTitle");
    if (tab === "qsl") return v4("qslTitle");
    if (tab === "pmk") return v4("pmkTitle");
    if (tab === "nch") return v4("nchTitle");
    if (tab === "emc") return v4("emcTitle");
    if (tab === "finance") return v4("financeNav");
    if (tab === "more") return tx("more");
    return tx(tab as CrmV2CopyKey);
  }

  function subtitle(tab: string) {
    if (tab === "overview") return v4("subOverview");
    if (tab === "customers") return v4("subCustomers");
    if (tab === "finance") return v4("subFinance");
    if (tab === "positions") return v4("subPositions");
    if (tab === "support") return v4("subSupport");
    if (tab === "marketing") return v4("subMarketing");
    if (tab === "logs") return v4("subLogs");
    if (tab === "settings") return v4("subSettings");
    if (tab === "control") return v4("subControl");
    if (tab === "me") return v4("staffSub");
    if (tab === "goals") return v4("goalsSub");
    if (tab === "kyc") return v4("kycSub");
    if (tab === "reports") return v4("reportsSub");
    if (tab === "withdraw") return v4("wdSub");
    if (tab === "deposit") return v4("depSub");
    if (tab === "inbox") return v4("inboxSub");
    if (tab === "insights") return v4("insSub");
    if (tab === "prefs") return v4("prefSub");
    if (tab === "agenda") return v4("agSub");
    if (tab === "roster") return v4("staffSub");
    if (tab === "day") return v4("daySub");
    if (tab === "affiliates") return v4("afCustomers");
    if (tab === "payout") return v4("pqSub");
    if (tab === "access") return v4("axSub");
    if (tab === "risk") return v4("rkSub");
    if (tab === "funding") return v4("fuSub");
    if (tab === "thread") return v4("cvSub");
    if (tab === "gallery") return v4("glSub");
    if (tab === "history") return v4("hsSub");
    if (tab === "dense") return v4("dnSub");
    if (tab === "notices") return v4("ibSub");
    if (tab === "tags") return v4("tgSub");
    if (tab === "blotter") return v4("blSub");
    if (tab === "pad") return v4("pdSub");
    if (tab === "cases") return v4("cqSub");
    if (tab === "shortcuts") return v4("scSub");
    if (tab === "payboard") return v4("pbSub");
    if (tab === "handoff") return v4("shSub");
    if (tab === "leads") return v4("ldSub");
    if (tab === "quiet") return v4("qfSub");
    if (tab === "triage") return v4("trSub");
    if (tab === "accents") return v4("acSub");
    if (tab === "depboard") return v4("dbSub");
    if (tab === "sop") return v4("sopSub");
    if (tab === "alerts") return v4("raSub");
    if (tab === "folders") return v4("bmSub");
    if (tab === "health") return v4("hlSub");
    if (tab === "scratch") return v4("sbSub");
    if (tab === "ibpay") return v4("cmSub");
    if (tab === "jumps") return v4("jpSub");
    if (tab === "expiry") return v4("exSub");
    if (tab === "density") return v4("lySub");
    if (tab === "rejects") return v4("rjSub");
    if (tab === "vault") return v4("vhSub");
    if (tab === "heatmap") return v4("htSub");
    if (tab === "cheats") return v4("csSub");
    if (tab === "digest") return v4("odSub");
    if (tab === "glass") return v4("gsSub");
    if (tab === "compare") return v4("mcSub");
    if (tab === "eod") return v4("eodSub");
    if (tab === "stale") return v4("slSub");
    if (tab === "scripts") return v4("tkSub");
    if (tab === "dupes") return v4("dpSub");
    if (tab === "prep") return v4("mpSub");
    if (tab === "sources") return v4("sxSub");
    if (tab === "winlog") return v4("wnSub");
    if (tab === "vip") return v4("vwSub");
    if (tab === "packet") return v4("pkSub");
    if (tab === "clocks") return v4("ckSub");
    if (tab === "snippets") return v4("snSub");
    if (tab === "pulse") return v4("puSub");
    if (tab === "swatches") return v4("swSub");
    if (tab === "week") return v4("wkSub");
    if (tab === "scale") return v4("tySub");
    if (tab === "shield") return v4("qhSub");
    if (tab === "stickies") return v4("cnSub");
    if (tab === "shiftlist") return v4("sfSub");
    if (tab === "glance") return v4("gcSub");
    if (tab === "lane") return v4("lnSub");
    if (tab === "docpulse") return v4("xpSub");
    if (tab === "edge") return v4("egSub");
    if (tab === "outcomes") return v4("ocSub");
    if (tab === "riskwatch") return v4("rwSub");
    if (tab === "maildense") return v4("mdSub");
    if (tab === "callpack") return v4("cpSub");
    if (tab === "curchips") return v4("ccSub");
    if (tab === "markbar") return v4("mbSub");
    if (tab === "kycglance") return v4("kgSub");
    if (tab === "snooze") return v4("szSub");
    if (tab === "sideglance") return v4("sdSub");
    if (tab === "focusmode") return v4("fmSub");
    if (tab === "suppulse") return v4("qpSub");
    if (tab === "pinboard") return v4("pnSub");
    if (tab === "ibglance") return v4("igSub");
    if (tab === "desktimer") return v4("dtSub");
    if (tab === "licglance") return v4("lcSub");
    if (tab === "voicetray") return v4("vsSub");
    if (tab === "wdreason") return v4("wrSub");
    if (tab === "utcmark") return v4("cdSub");
    if (tab === "depchannel") return v4("dcSub");
    if (tab === "statusbanner") return v4("bnSub");
    if (tab === "doctype") return v4("dgSub");
    if (tab === "quicklinks") return v4("qkSub");
    if (tab === "prioglance") return v4("pgSub");
    if (tab === "checklist") return v4("chSub");
    if (tab === "countryglance") return v4("cySub");
    if (tab === "scratchpad") return v4("npSub");
    if (tab === "orderstatus") return v4("ogSub");
    if (tab === "contacts") return v4("ctSub");
    if (tab === "zeroglance") return v4("bzSub");
    if (tab === "reminders") return v4("rmSub");
    if (tab === "sourceglance") return v4("lsSub");
    if (tab === "tagpalette") return v4("plSub");
    if (tab === "assignee") return v4("gnSub");
    if (tab === "filterpresets") return v4("fpSub");
    if (tab === "docstatus") return v4("dsSub");
    if (tab === "sessionnote") return v4("sySub");
    if (tab === "wdstatus") return v4("wzSub");
    if (tab === "pinrail") return v4("rlSub");
    if (tab === "depstatus") return v4("dzSub");
    if (tab === "mutelist") return v4("muSub");
    if (tab === "symbolglance") return v4("ymSub");
    if (tab === "recentjumps") return v4("jvSub");
    if (tab === "ticketchannel") return v4("tcSub");
    if (tab === "watchwords") return v4("wwSub");
    if (tab === "langglance") return v4("lgSub");
    if (tab === "layoutlock") return v4("lxSub");
    if (tab === "ibstatus") return v4("bxSub");
    if (tab === "draftstash") return v4("dfSub");
    if (tab === "doctypemix") return v4("kmSub");
    if (tab === "focuscustomer") return v4("fcSub");
    if (tab === "ordertype") return v4("oySub");
    if (tab === "bookmarks") return v4("bqSub");
    if (tab === "wdglance") return v4("wxSub");
    if (tab === "snoozelist") return v4("nqSub");
    if (tab === "depmethod") return v4("mgSub");
    if (tab === "checkpolish") return v4("hkSub");
    if (tab === "casepriority") return v4("zqSub");
    if (tab === "colortags") return v4("qaSub");
    if (tab === "tradeside") return v4("ysSub");
    if (tab === "savedviews") return v4("dvSub");
    if (tab === "kycstatus") return v4("kySub");
    if (tab === "followqueue") return v4("ffSub");
    if (tab === "ticketstatus") return v4("tzSub");
    if (tab === "rowdensity") return v4("rdSub");
    if (tab === "ibcountry") return v4("icSub");
    if (tab === "csvpresets") return v4("xvSub");
    if (tab === "auditdays") return v4("uySub");
    if (tab === "remindpolish") return v4("hcSub");
    if (tab === "riskglance") return v4("vpSub");
    if (tab === "handoffpolish") return v4("hpSub");
    if (tab === "depcurrency") return v4("qcSub");
    if (tab === "staffpolish") return v4("spSub");
    if (tab === "wdmethod") return v4("wgSub");
    if (tab === "meetnotes") return v4("mnSub");
    if (tab === "orderstat") return v4("jqSub");
    if (tab === "quickdial") return v4("qdSub");
    if (tab === "ticketassign") return v4("taSub");
    if (tab === "callbackqueue") return v4("cbSub");
    if (tab === "casepriopolish") return v4("zpSub");
    if (tab === "visitlog") return v4("vlSub");
    if (tab === "kycdocstat") return v4("ydSub");
    if (tab === "parkspot") return v4("baySub");
    if (tab === "leadsrc") return v4("lsgSub");
    if (tab === "locker") return v4("lokSub");
    if (tab === "tradesym") return v4("tsySub");
    if (tab === "courier") return v4("crrSub");
    if (tab === "ibctry") return v4("ibgSub");
    if (tab === "visitor") return v4("bdgSub");
    if (tab === "depglance") return v4("dmgSub");
    if (tab === "mailroom") return v4("mlrSub");
    if (tab === "wdsg") return v4("wsgSub");
    if (tab === "reception") return v4("rxnSub");
    if (tab === "tktsg") return v4("tksSub");
    if (tab === "supply") return v4("splSub");
    if (tab === "kycsg") return v4("kysSub");
    if (tab === "confroom") return v4("rmnSub");
    if (tab === "sidesg") return v4("sdgSub");
    if (tab === "breakroom") return v4("brkSub");
    if (tab === "affchan") return v4("acgSub");
    if (tab === "lounge") return v4("lngSub");
    if (tab === "leadstat") return v4("ldsSub");
    if (tab === "pantry") return v4("pntSub");
    if (tab === "accttype") return v4("atySub");
    if (tab === "coat") return v4("cctSub");
    if (tab === "kycfile") return v4("kflSub");
    if (tab === "concierge") return v4("cncSub");
    if (tab === "retstat") return v4("rtnSub");
    if (tab === "valet") return v4("vltSub");
    if (tab === "potstat") return v4("potSub");
    if (tab === "porter") return v4("prtSub");
    if (tab === "valstat") return v4("vldSub");
    if (tab === "bell") return v4("bllSub");
    if (tab === "trgroup") return v4("tgrSub");
    if (tab === "lamp") return v4("lmpSub");
    if (tab === "broker") return v4("bknSub");
    if (tab === "host") return v4("hstSub");
    if (tab === "server") return v4("tsvSub");
    if (tab === "callwin") return v4("cwnSub");
    if (tab === "zones") return v4("zonSub");
    if (tab === "arrival") return v4("arrSub");
    if (tab === "cities") return v4("citSub");
    if (tab === "place") return v4("plcSub");
    if (tab === "browsers") return v4("brwSub");
    if (tab === "watch") return v4("wchSub");
    if (tab === "systems") return v4("ostSub");
    if (tab === "keys") return v4("kcdSub");
    if (tab === "devices") return v4("dvcSub");
    if (tab === "stacks") return v4("slpSub");
    if (tab === "atlas") return v4("atlSub");
    if (tab === "cues") return v4("cueSub");
    if (tab === "regions") return v4("rgnSub");
    if (tab === "ribbons") return v4("ribSub");
    if (tab === "reasons") return v4("rsnSub");
    if (tab === "playbill") return v4("plySub");
    if (tab === "ivsource") return v4("ivsSub");
    if (tab === "interlude") return v4("itlSub");
    if (tab === "vintage") return v4("vntSub");
    if (tab === "folio") return v4("folSub");
    if (tab === "natal") return v4("ntlSub");
    if (tab === "vellum") return v4("vlmSub");
    if (tab === "house") return v4("hhdSub");
    if (tab === "quire") return v4("qreSub");
    if (tab === "courtesy") return v4("ctsSub");
    if (tab === "promise") return v4("slaSub");
    if (tab === "calling") return v4("clgSub");
    if (tab === "briefing") return v4("brfSub");
    if (tab === "lexicon") return v4("lexSub");
    if (tab === "dispatch") return v4("dspSub");
    if (tab === "wings") return v4("dskSub");
    if (tab === "loom") return v4("lomSub");
    if (tab === "bands") return v4("bndSub");
    if (tab === "kiln") return v4("klnSub");
    if (tab === "handles") return v4("hdlSub");
    if (tab === "proofs") return v4("prfSub");
    if (tab === "given") return v4("gvnSub");
    if (tab === "dockets") return v4("dktSub");
    if (tab === "family") return v4("famSub");
    if (tab === "quay") return v4("quySub");
    if (tab === "belts") return v4("zblSub");
    if (tab === "bench") return v4("bnkSub");
    if (tab === "perch") return v4("avpSub");
    if (tab === "presence") return v4("pswSub");
    if (tab === "hearth") return v4("hrlSub");
    if (tab === "lantern") return v4("ltnSub");
    if (tab === "stitch") return v4("bstSub");
    if (tab === "cloth") return v4("cclSub");
    if (tab === "proof") return v4("prfSub");
    if (tab === "ribbon") return v4("arbSub");
    if (tab === "quill") return v4("qllSub");
    if (tab === "seal") return v4("aslSub");
    if (tab === "wax") return v4("wxfSub");
    if (tab === "lamp") return v4("flmSub");
    if (tab === "gilt") return v4("gltSub");
    if (tab === "ftd") return v4("fdmSub");
    if (tab === "marq") return v4("mrqSub");
    if (tab === "gate") return v4("tgnSub");
    if (tab === "cloak") return v4("clkSub");
    if (tab === "latch") return v4("ltcSub");
    if (tab === "nook") return v4("nokSub");
    if (tab === "bolt") return v4("bltSub");
    if (tab === "oriel") return v4("orlSub");
    if (tab === "trial") return v4("trlSub");
    if (tab === "atelier") return v4("atpSub");
    if (tab === "notice") return v4("nbmSub");
    if (tab === "vestry") return v4("vstSub");
    if (tab === "shutter") return v4("shtSub");
    if (tab === "choir") return v4("chrSub");
    if (tab === "ember") return v4("embSub");
    if (tab === "arcade") return v4("arcSub");
    if (tab === "strike") return v4("stkSub");
    if (tab === "stool") return v4("stlSub");
    if (tab === "rslip") return v4("rslSub");
    if (tab === "ladder") return v4("ldrSub");
    if (tab === "ctmark") return v4("ctySub");
    if (tab === "wtrls") return v4("wtrSub");
    if (tab === "pstems") return v4("pstSub");
    if (tab === "hbrms") return v4("hbrSub");
    if (tab === "alane") return v4("alnSub");
    if (tab === "crtch") return v4("crtSub");
    if (tab === "rgtry") return v4("rgtSub");
    if (tab === "chits") return v4("chtSub");
    if (tab === "ctysl") return v4("cslSub");
    if (tab === "frames") return v4("frmSub");
    if (tab === "dkplt") return v4("dkpSub");
    if (tab === "bear") return v4("brgSub");
    if (tab === "mlsl") return v4("mlsSub");
    if (tab === "press") return v4("prsSub");
    if (tab === "pcmk") return v4("pcmSub");
    if (tab === "morn") return v4("morSub");
    if (tab === "aaid") return v4("aidSub");
    if (tab === "keeps") return v4("kpvSub");
    if (tab === "istmp") return v4("stpSub");
    if (tab === "vows") return v4("vowSub");
    if (tab === "span") return v4("spnSub");
    if (tab === "slate") return v4("sltSub");
    if (tab === "ownr") return v4("ownSub");
    if (tab === "vesper") return v4("vspSub");
    if (tab === "stem") return v4("stmSub");
    if (tab === "index") return v4("idxSub");
    if (tab === "mhall") return v4("mhlSub");
    if (tab === "ghook") return v4("ghkSub");
    if (tab === "llane") return v4("llnSub");
    if (tab === "cwin") return v4("cbkSub");
    if (tab === "iring") return v4("irgSub");
    if (tab === "rvmin") return v4("rvmSub");
    if (tab === "ncts") return v4("nctSub");
    if (tab === "qhold") return v4("qhdSub");
    if (tab === "dials") return v4("dlnSub");
    if (tab === "sbook") return v4("stbSub");
    if (tab === "cmks") return v4("cmkSub");
    if (tab === "crtsy") return v4("ccrSub");
    if (tab === "nseal") return v4("nslSub");
    if (tab === "vpass") return v4("vpsSub");
    if (tab === "bplt") return v4("bplSub");
    if (tab === "esl") return v4("eslSub");
    if (tab === "nrb") return v4("nrbSub");
    if (tab === "wslt") return v4("wslSub");
    if (tab === "fstp") return v4("fstSub");
    if (tab === "hbrf") return v4("hbfSub");
    if (tab === "plgm") return v4("pgmSub");
    if (tab === "flwt") return v4("flwSub");
    if (tab === "mngm") return v4("mngSub");
    if (tab === "sitt") return v4("sitSub");
    if (tab === "crst") return v4("crsSub");
    if (tab === "rctl") return v4("rctSub");
    if (tab === "unsl") return v4("unsSub");
    if (tab === "gwlk") return v4("gwkSub");
    if (tab === "tzon") return v4("tznSub");
    if (tab === "orcd") return v4("orcSub");
    if (tab === "vsip") return v4("vslSub");
    if (tab === "vstb") return v4("vnbSub");
    if (tab === "agsc") return v4("agsSub");
    if (tab === "cnsl") return v4("cnsSub");
    if (tab === "rfbn") return v4("rfbSub");
    if (tab === "rdlm") return v4("rdlSub");
    if (tab === "ltrc") return v4("ltrSub");
    if (tab === "glmt") return v4("glmSub");
    if (tab === "dvpl") return v4("dvpSub");
    if (tab === "clst") return v4("clsSub");
    if (tab === "sycr") return v4("syoSub");
    if (tab === "nvbn") return v4("nvbSub");
    if (tab === "lnrb") return v4("lnrSub");
    if (tab === "apal") return v4("apsSub");
    if (tab === "brcr") return v4("brcSub");
    if (tab === "trst") return v4("trsSub");
    if (tab === "acwf") return v4("acwSub");
    if (tab === "amln") return v4("amlnSub");
    if (tab === "clmp") return v4("clmSub");
    if (tab === "nxcd") return v4("nxcSub");
    if (tab === "adpl") return v4("adrSub");
    if (tab === "crbx") return v4("crbSub");
    if (tab === "rsdl") return v4("rsdSub");
    if (tab === "iflo") return v4("iflSub");
    if (tab === "dgrd") return v4("dgrSub");
    if (tab === "chsl") return v4("chsSub");
    if (tab === "pbrb") return v4("pbrSub");
    if (tab === "blcd") return v4("blcSub");
    if (tab === "dlsl") return v4("dlsSub");
    if (tab === "fpen") return v4("fpnSub");
    if (tab === "mcrs") return v4("mcrSub");
    if (tab === "stcd") return v4("stcSub");
    if (tab === "gmkp") return v4("gmkSub");
    if (tab === "mzrl") return v4("mzrSub");
    if (tab === "syct") return v4("sycSub");
    if (tab === "orsl") return v4("orsSub");
    if (tab === "lghr") return v4("lghSub");
    if (tab === "frze") return v4("frzSub");
    if (tab === "qmks") return v4("qmkSub");
    if (tab === "dntl") return v4("dntSub");
    if (tab === "vous") return v4("vousSub");
    if (tab === "brdc") return v4("brdSub");
    if (tab === "pnnt") return v4("wmpSub");
    if (tab === "coff") return v4("cffSub");
    if (tab === "rsst") return v4("rstSub");
    if (tab === "scdr") return v4("sdrSub");
    if (tab === "antp") return v4("antSub");
    if (tab === "aisl") return v4("ainSub");
    if (tab === "esct") return v4("escSub");
    if (tab === "cabn") return v4("cabSub");
    if (tab === "wmk") return v4("wmkSub");
    if (tab === "qire") return v4("qirSub");
    if (tab === "rmgn") return v4("rmgSub");
    if (tab === "dty") return v4("dtySub");
    if (tab === "pcr") return v4("pcrSub");
    if (tab === "lnw") return v4("lnwSub");
    if (tab === "hmk") return v4("hmkSub");
    if (tab === "nbl") return v4("nblSub");
    if (tab === "tsl") return v4("tslSub");
    if (tab === "vcd") return v4("vcdSub");
    if (tab === "smk") return v4("smkSub");
    if (tab === "rsl") return v4("rfsSub");
    if (tab === "dlg") return v4("dlgSub");
    if (tab === "obv") return v4("obvSub");
    if (tab === "psr") return v4("psrSub");
    if (tab === "brt") return v4("brtSub");
    if (tab === "bdg") return v4("bdgSub");
    if (tab === "alv") return v4("alvSub");
    if (tab === "psp") return v4("pspSub");
    if (tab === "trc") return v4("trcSub");
    if (tab === "clp") return v4("clpSub");
    if (tab === "csh") return v4("cshSub");
    if (tab === "ppl") return v4("pplSub");
    if (tab === "dnb") return v4("dnbSub");
    if (tab === "lcr") return v4("lcrSub");
    if (tab === "hgl") return v4("hglSub");
    if (tab === "syl") return v4("sylSub");
    if (tab === "bnc") return v4("bncSub");
    if (tab === "luf") return v4("lufSub");
    if (tab === "orb") return v4("orbSub");
    if (tab === "mrd") return v4("mrdSub");
    if (tab === "qsl") return v4("qslSub");
    if (tab === "pmk") return v4("pmkSub");
    if (tab === "nch") return v4("nchSub");
    if (tab === "emc") return v4("emcSub");
    if (tab === "plates") return v4("pltSub");
    return "";
  }

  const known = CRM_V4_SECTIONS.some((item) => item.id === view);
  const heading = known ? label(view) : tx("comingSoon");
  const tone = theme === "light" ? "ink" : "paper";


  const names: Record<string, string> = {};
  for (const item of CRM_V4_SECTIONS) names[item.id] = label(item.id);

  return (
    <div data-crmv4-root="" data-theme={theme} data-accent={accent} data-role={role} data-zebra={zebra ? "1" : "0"} data-motion={motion} data-compact={compact ? "1" : "0"} data-font={font} data-contrast={contrast ? "1" : "0"} data-freeze={freeze ? "1" : "0"} data-focus={focus ? "1" : "0"} data-gold={gold} data-chrome={chrome} data-panel={panel} data-glass={glass} data-scale={scale} data-mail={mail} data-focus-sections={deskFocus.includes("sections") ? "1" : "0"} data-focus-rail={deskFocus.includes("rail") ? "1" : "0"} data-focus-tools={deskFocus.includes("tools") ? "1" : "0"} data-density={density} data-row-density={rowDensity} data-fold={folded ? "1" : "0"} data-crmv4-view={id ? `${view}/${id}` : view} className="c4-app font-normal">
      <a className="c4-skip" href="#c4-main">{v4("skipContent")}</a>
      <OfflineBanner v4={v4} quiet={shield} />
      <IdleWarning v4={v4} />
      <ShortcutHost base={base} v4={v4} onPalette={() => setPaletteOpen(true)} onHelp={setHelpOpen} onSheet={() => setSheetOpen(true)} />
      <Tour v4={v4} />
      <header className="c4-top c4-top-rail">
        <Link href={crmv4Href(base, "")} className="c4-brand" aria-label={v4("v4mark")}>
          <BrandLogo tone={tone} height={26} className="c4-logo" />
        </Link>
        <nav className="c4-nav" aria-label={tx("panel")}>
          {CRM_V4_NAV.map((item) => item.id === "finance" ? (
            <div key={item.id} className="c4-drop" data-open={financeOpen ? "1" : "0"} onClick={(event) => event.stopPropagation()}>
              <button
                type="button"
                className="c4-nav-item"
                data-nav={item.id}
                data-on={view === "finance" ? "1" : "0"}
                aria-expanded={financeOpen}
                onClick={() => { setFinanceOpen((open) => !open); setGearOpen(false); }}
              >
                <span className="c4-nav-title">{v4("financeNav")}</span>
                <span className="c4-nav-sub">{v4(item.sub)}</span>
                {pending > 0 && <span className="c4-count">{pending}</span>}
              </button>
              <div className="c4-drop-menu" role="menu">
                {FINANCE_LINKS.map((link) => (
                  <Link key={link.key} href={crmv4Href(base, "finance", link.tab ? { tab: link.tab } : undefined)} onClick={() => setFinanceOpen(false)}>
                    {tx(link.key)}
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <Link key={item.id} href={crmv4Href(base, item.path)} data-nav={item.id} data-on={view === item.id ? "1" : "0"} className="c4-nav-item">
              <span className="c4-nav-title">{label(item.id)}</span>
              <span className="c4-nav-sub">{v4(item.sub)}</span>
            </Link>
          ))}
          <div className="c4-drop" data-open={gearOpen ? "1" : "0"} onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="c4-nav-item c4-gear"
              data-nav="settings"
              data-on={view === "settings" || view === "control" ? "1" : "0"}
              aria-label={tx("settings")}
              aria-expanded={gearOpen}
              aria-controls="c4-gear-menu"
              onClick={() => { setGearOpen((open) => !open); setFinanceOpen(false); }}
            >
              <span className="c4-nav-title"><GearIcon /></span>
              <span className="c4-nav-sub">{v4("gear")}</span>
            </button>
            <div className="c4-drop-menu c4-gear-menu" id="c4-gear-menu">
              <GroupedMenu base={base} view={view} names={names} v4={v4} onPick={() => setGearOpen(false)} />
            </div>
          </div>
        </nav>
        <DeskBar base={base} name={name} theme={theme} onTheme={toggleTheme} onNotes={() => setNotesOpen(true)} unread={inboxUnread} v4={v4} tx={tx} />
        <div className="c4-top-tools">
          <button type="button" className="c4-rail-btn c4-plus" aria-label={v4("quickPlus")} onClick={() => setQuickOpen(true)}>+</button>
          <button type="button" className="c4-rail-btn" aria-label={v4("palette")} onClick={() => setPaletteOpen(true)}>
            <span>⌘K</span>
          </button>
          <button type="button" className="c4-rail-btn" aria-label={tx("notifications")} onClick={() => setNotesOpen(true)}>
            <BellIcon />
            {inboxUnread > 0 && <span className="c4-rail-badge">{inboxUnread}</span>}
          </button>
          <button type="button" className="c4-rail-btn" aria-label={v4("openMenu")} onClick={() => setMore(true)}>
            <MenuIcon />
          </button>
        </div>
        <TopTrail base={base} view={view} id={id} heading={heading} openId={params.get("open") || ""} trail={trail} v4={v4} />
      </header>

      <PageRail base={base} view={view} names={names} folded={folded} query={railQuery} v4={v4} onQuery={setRailQuery} onToggle={toggleFold} />

      <div className="c4-frame">
        <div className="c4-panel" data-view={view} onScroll={(event) => setCompact(event.currentTarget.scrollTop > 24)}>
          {!id && (
            <div className="c4-pagehead c4-pagehead-folio c4-pagehead-crest c4-pagehead-atelier c4-pagehead-salon c4-pagehead-gallery c4-pagehead-library c4-pagehead-press c4-pagehead-ribbon c4-pagehead-playbill c4-pagehead-interlude c4-pagehead-slip c4-pagehead-vellum c4-pagehead-quire c4-pagehead-promise c4-pagehead-briefing c4-pagehead-dispatch c4-pagehead-loom c4-pagehead-kiln c4-pagehead-proof c4-pagehead-docket c4-pagehead-quay c4-pagehead-bench c4-pagehead-perch c4-pagehead-hearth c4-pagehead-inkwell c4-pagehead-lacquer c4-pagehead-gilt c4-pagehead-vestry c4-pagehead-choir c4-pagehead-arcade c4-pagehead-stool c4-pagehead-ladder c4-pagehead-inlay c4-pagehead-atlas c4-pagehead-oratory c4-pagehead-vestibule c4-pagehead-conservatory c4-pagehead-reading c4-pagehead-mount c4-pagehead-cloister c4-pagehead-apse c4-pagehead-seat c4-pagehead-loggia c4-pagehead-belvedere c4-pagehead-mezzanine">
              <div className="c4-crest-band">
                <p className="c4-folio-plate" data-logo="mono" aria-hidden="true">7FX</p>
                <span className="c4-crest-mark" aria-hidden="true" />
              </div>
              <div className="c4-crest-copy">
                <h1 className="c4-page-title">{heading}</h1>
                {brand ? <p className="c4-brand-line">{brand}</p> : null}
                <p className="c4-page-sub">{known ? subtitle(view) : tx("comingSoonBody")}</p>
                <FreshnessBar v4={v4} />
              </div>
              <form action={crmv4Href(base, "customers")} className="c4-page-search c4-search-luxe c4-crest-search" role="search">
                <input name="q" defaultValue={q} placeholder={tx("search")} aria-label={tx("search")} className="c4-field" />
              </form>
            </div>
          )}
          <AnnounceBar />
          <main
          id="c4-main"
          className="c4-stage"
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
                window.dispatchEvent(new Event("crmv4:refresh"));
                window.setTimeout(() => setRefreshing(false), 700);
              }
              setPull(0);
            }}
          >
            <div className="c4-pull" data-on={pull > 8 || refreshing ? "1" : "0"}>{refreshing ? v4("refreshing") : v4("pullHint")}</div>
              {resume && !shield && (
              <p className="c4-resume">
                <span className="c4-resume-path">{resume}</span>
                <button type="button" className="c4-btn" onClick={() => { window.location.assign(resume); }}>{v4("resumeView")}</button>
                <button type="button" className="c4-btn" onClick={() => setResume("")}>{tx("close")}</button>
              </p>
            )}
            <DeskBoundary v4={v4}>
            {view === "overview" && <Overview base={base} tx={tx} locale={locale} name={name} />}
            {view === "customers" && !id && <Customers base={base} tx={tx} locale={locale} q={q} />}
            {view === "customers" && id && <CustomerDetail base={base} id={id} tx={tx} locale={locale} />}
            {view === "finance" && <Finance tx={tx} locale={locale} q={q} />}
            {view === "positions" && <Positions tx={tx} locale={locale} q={q} />}
            {view === "support" && <Support tx={tx} locale={locale} q={q} />}
            {view === "marketing" && <Marketing tx={tx} />}
            {view === "settings" && <Settings tx={tx} />}
            {view === "me" && <StaffPage signInName={name} base={base} v4={v4} locale={locale} />}
            {view === "day" && <DayDesk base={base} name={name} v4={v4} locale={locale} />}
            {view === "goals" && <GoalsPage v4={v4} locale={locale} />}
            {view === "kyc" && <KycDesk v4={v4} tx={tx} locale={locale} />}
            {view === "reports" && <ReportDesk v4={v4} locale={locale} />}
            {view === "affiliates" && <AffiliateDesk v4={v4} locale={locale} />}
            {view === "payout" && <PayoutDesk base={base} v4={v4} tx={tx} locale={locale} />}
            {view === "access" && <AccessDesk v4={v4} tx={tx} locale={locale} />}
            {view === "risk" && <RiskDesk base={base} v4={v4} tx={tx} locale={locale} />}
            {view === "funding" && <FundingDesk base={base} v4={v4} tx={tx} locale={locale} />}
            {view === "thread" && <ThreadDesk v4={v4} tx={tx} locale={locale} />}
            {view === "gallery" && <GalleryDesk base={base} v4={v4} tx={tx} locale={locale} />}
            {view === "history" && <HistoryDesk v4={v4} tx={tx} locale={locale} />}
            {view === "dense" && <DenseList base={base} v4={v4} tx={tx} />}
            {view === "notices" && <NoticeCenter base={base} v4={v4} locale={locale} tx={tx} />}
            {view === "tags" && <TagBoard base={base} v4={v4} tx={tx} />}
            {view === "blotter" && <TradeBlotter base={base} v4={v4} locale={locale} tx={tx} />}
            {view === "pad" && <DeskPad base={base} v4={v4} tx={tx} />}
            {view === "cases" && <CaseQueue base={base} v4={v4} locale={locale} tx={tx} />}
            {view === "shortcuts" && <ShortcutRail base={base} v4={v4} />}
            {view === "payboard" && <PayoutBoard base={base} v4={v4} locale={locale} tx={tx} />}
            {view === "handoff" && <ShiftSheet v4={v4} tx={tx} />}
            {view === "leads" && <LeadBoard base={base} v4={v4} tx={tx} />}
            {view === "quiet" && <QuietDesk v4={v4} />}
            {view === "triage" && <TriageBoard base={base} v4={v4} locale={locale} tx={tx} />}
            {view === "accents" && <AccentStrip v4={v4} />}
            {view === "depboard" && <DepositBoard base={base} v4={v4} locale={locale} tx={tx} />}
            {view === "sop" && <SopPad v4={v4} />}
            {view === "alerts" && <AlertDesk v4={v4} locale={locale} tx={tx} />}
            {view === "folders" && <FolderPad base={base} v4={v4} />}
            {view === "health" && <HealthStrip base={base} v4={v4} locale={locale} tx={tx} />}
            {view === "scratch" && <ScratchBoard v4={v4} />}
            {view === "ibpay" && <IntroducerBoard base={base} v4={v4} locale={locale} tx={tx} />}
            {view === "jumps" && <JumpHistory base={base} v4={v4} />}
            {view === "expiry" && <ExpiryWatch base={base} v4={v4} locale={locale} tx={tx} />}
            {view === "density" && <PanelDensityStrip v4={v4} />}
            {view === "rejects" && <RejectBoard base={base} v4={v4} locale={locale} tx={tx} />}
            {view === "vault" && <VaultPad v4={v4} base={base} />}
            {view === "heatmap" && <HeatStrip v4={v4} tx={tx} base={base} />}
            {view === "cheats" && <CheatSheet v4={v4} />}
            {view === "digest" && <OvernightDigest base={base} v4={v4} />}
            {view === "glass" && <GlassToggle base={base} v4={v4} />}
            {view === "compare" && <DeskCompare v4={v4} locale={locale} tx={tx} />}
            {view === "eod" && <EodList v4={v4} />}
            {view === "stale" && <StaleWatch base={base} v4={v4} locale={locale} tx={tx} />}
            {view === "scripts" && <CallScripts v4={v4} />}
            {view === "dupes" && <DupeStrip base={base} v4={v4} locale={locale} tx={tx} />}
            {view === "prep" && <MeetingPrep v4={v4} tx={tx} />}
            {view === "sources" && <SourceMix base={base} v4={v4} tx={tx} />}
            {view === "winlog" && <WinLog v4={v4} tx={tx} />}
            {view === "vip" && <VipWatch base={base} v4={v4} locale={locale} tx={tx} />}
            {view === "packet" && <HandoffPacket v4={v4} />}
            {view === "clocks" && <DeskClocks base={base} v4={v4} />}
            {view === "snippets" && <SnippetPad base={base} v4={v4} />}
            {view === "pulse" && <QueuePulse base={base} v4={v4} tx={tx} />}
            {view === "swatches" && <RouteSwatches base={base} v4={v4} />}
            {view === "week" && <WeekAgenda base={base} v4={v4} locale={locale} tx={tx} />}
            {view === "scale" && <FontScale v4={v4} />}
            {view === "shield" && <QuietShield v4={v4} />}
            {view === "stickies" && <StickyPad base={base} v4={v4} />}
            {view === "shiftlist" && <ShiftCheck v4={v4} />}
            {view === "glance" && <LedgerGlance base={base} v4={v4} tx={tx} />}
            {view === "lane" && <PriorityLane base={base} v4={v4} />}
            {view === "docpulse" && <DocPulse base={base} v4={v4} tx={tx} />}
            {view === "edge" && <EdgeStrip v4={v4} />}
            {view === "outcomes" && <CallOutcomes base={base} v4={v4} />}
            {view === "riskwatch" && <RiskWatch base={base} v4={v4} />}
            {view === "maildense" && <MailDensityStrip v4={v4} />}
            {view === "callpack" && <CallPack base={base} v4={v4} />}
            {view === "curchips" && <CurrencyChips base={base} v4={v4} locale={locale} />}
            {view === "markbar" && <BookmarkBar base={base} v4={v4} names={names} />}
            {view === "kycglance" && <KycGlance base={base} v4={v4} />}
            {view === "snooze" && <SnoozeStrip base={base} v4={v4} locale={locale} />}
            {view === "sideglance" && <SideGlance base={base} v4={v4} />}
            {view === "focusmode" && <FocusDesk v4={v4} />}
            {view === "suppulse" && <SupportPulse base={base} v4={v4} />}
            {view === "pinboard" && <PinBoard v4={v4} />}
            {view === "ibglance" && <IbGlance base={base} v4={v4} />}
            {view === "desktimer" && <DeskTimer v4={v4} />}
            {view === "licglance" && <LicenseGlance base={base} v4={v4} />}
            {view === "voicetray" && <VoiceTray v4={v4} />}
            {view === "wdreason" && <ReasonGlance base={base} v4={v4} />}
            {view === "utcmark" && <UtcMarks v4={v4} />}
            {view === "depchannel" && <ChannelGlance base={base} v4={v4} />}
            {view === "statusbanner" && <StatusBanner v4={v4} />}
            {view === "doctype" && <TypeGlance base={base} v4={v4} />}
            {view === "quicklinks" && <QuickLinks v4={v4} />}
            {view === "prioglance" && <PriorityGlance base={base} v4={v4} />}
            {view === "checklist" && <DeskCheck v4={v4} />}
            {view === "countryglance" && <CountryGlance base={base} v4={v4} />}
            {view === "scratchpad" && <ScratchPads v4={v4} />}
            {view === "orderstatus" && <OrderGlance base={base} v4={v4} />}
            {view === "contacts" && <ContactChips v4={v4} />}
            {view === "zeroglance" && <ZeroGlance base={base} v4={v4} />}
            {view === "reminders" && <ReminderChips v4={v4} />}
            {view === "sourceglance" && <SourceGlance base={base} v4={v4} />}
            {view === "tagpalette" && <TagPalette v4={v4} />}
            {view === "assignee" && <AssigneeGlance base={base} v4={v4} />}
            {view === "filterpresets" && <FilterPresets v4={v4} />}
            {view === "docstatus" && <DocStatusGlance base={base} v4={v4} />}
            {view === "sessionnote" && <SessionNote v4={v4} />}
            {view === "wdstatus" && <WithdrawalGlance base={base} v4={v4} />}
            {view === "pinrail" && <PinRail base={base} v4={v4} />}
            {view === "depstatus" && <DepStatusGlance base={base} v4={v4} />}
            {view === "mutelist" && <MuteList base={base} v4={v4} />}
            {view === "symbolglance" && <SymbolGlance base={base} v4={v4} />}
            {view === "recentjumps" && <RecentJumps base={base} v4={v4} />}
            {view === "ticketchannel" && <TicketChannels base={base} v4={v4} />}
            {view === "watchwords" && <WatchWords v4={v4} />}
            {view === "langglance" && <LanguageGlance base={base} v4={v4} />}
            {view === "layoutlock" && <LayoutLock v4={v4} />}
            {view === "ibstatus" && <IbStatusGlance base={base} v4={v4} />}
            {view === "draftstash" && <DraftStash v4={v4} />}
            {view === "doctypemix" && <DocTypeMix base={base} v4={v4} />}
            {view === "focuscustomer" && <FocusCustomer base={base} v4={v4} />}
            {view === "ordertype" && <OrderTypeGlance base={base} v4={v4} />}
            {view === "bookmarks" && <BookmarkBoard base={base} v4={v4} />}
            {view === "wdglance" && <WithdrawalStatus base={base} v4={v4} />}
            {view === "snoozelist" && <SnoozeList base={base} v4={v4} />}
            {view === "depmethod" && <DepositMethod base={base} v4={v4} />}
            {view === "checkpolish" && <CheckPolish v4={v4} />}
            {view === "casepriority" && <CasePriority base={base} v4={v4} />}
            {view === "colortags" && <ColorTags base={base} v4={v4} />}
            {view === "tradeside" && <TradeSide base={base} v4={v4} />}
            {view === "savedviews" && <SavedViews v4={v4} />}
            {view === "kycstatus" && <KycStatus base={base} v4={v4} />}
            {view === "followqueue" && <FollowQueue base={base} v4={v4} />}
            {view === "ticketstatus" && <TicketStatus base={base} v4={v4} />}
            {view === "rowdensity" && <RowDensityDesk v4={v4} />}
            {view === "ibcountry" && <IbCountry base={base} v4={v4} />}
            {view === "csvpresets" && <CsvColumnDesk base={base} v4={v4} />}
            {view === "auditdays" && <AuditDayStrip base={base} v4={v4} />}
            {view === "remindpolish" && <ReminderPolish v4={v4} />}
            {view === "riskglance" && <RiskGlance base={base} v4={v4} />}
            {view === "handoffpolish" && <HandoffPolish base={base} v4={v4} />}
            {view === "depcurrency" && <DepositCurrencies base={base} v4={v4} />}
            {view === "staffpolish" && <StaffPolish base={base} v4={v4} />}
            {view === "wdmethod" && <WithdrawalMethods base={base} v4={v4} />}
            {view === "meetnotes" && <MeetingNotes v4={v4} />}
            {view === "orderstat" && <OrderStatuses base={base} v4={v4} />}
            {view === "quickdial" && <QuickDial v4={v4} />}
            {view === "ticketassign" && <TicketAssignees base={base} v4={v4} />}
            {view === "callbackqueue" && <CallbackQueue v4={v4} />}
            {view === "casepriopolish" && <CasePriorities base={base} v4={v4} />}
            {view === "visitlog" && <VisitLog v4={v4} />}
            {view === "kycdocstat" && <DocumentStatuses base={base} v4={v4} />}
            {view === "parkspot" && <ParkingNotes v4={v4} />}
            {view === "leadsrc" && <LeadSources base={base} v4={v4} />}
            {view === "locker" && <LockerNotes v4={v4} />}
            {view === "tradesym" && <TradeSymbols base={base} v4={v4} />}
            {view === "courier" && <CourierNotes v4={v4} />}
            {view === "ibctry" && <IbCountries base={base} v4={v4} />}
            {view === "visitor" && <VisitorNotes v4={v4} />}
            {view === "depglance" && <DepositMethods base={base} v4={v4} />}
            {view === "mailroom" && <MailNotes v4={v4} />}
            {view === "wdsg" && <WithdrawalStatuses base={base} v4={v4} />}
            {view === "reception" && <ReceptionNotes v4={v4} />}
            {view === "tktsg" && <TicketStatuses base={base} v4={v4} />}
            {view === "supply" && <SupplyNotes v4={v4} />}
            {view === "kycsg" && <KycStatuses base={base} v4={v4} />}
            {view === "confroom" && <RoomNotes v4={v4} />}
            {view === "sidesg" && <TradeSides base={base} v4={v4} />}
            {view === "breakroom" && <BreakNotes v4={v4} />}
            {view === "affchan" && <AffiliateChannels base={base} v4={v4} />}
            {view === "lounge" && <LoungeNotes v4={v4} />}
            {view === "leadstat" && <LeadStatuses base={base} v4={v4} />}
            {view === "pantry" && <PantryNotes v4={v4} />}
            {view === "accttype" && <AccountTypes base={base} v4={v4} />}
            {view === "coat" && <CoatNotes v4={v4} />}
            {view === "kycfile" && <KycFileStatuses base={base} v4={v4} />}
            {view === "concierge" && <ConciergeNotes v4={v4} />}
            {view === "retstat" && <RetentionStatuses base={base} v4={v4} />}
            {view === "valet" && <ValetNotes v4={v4} />}
            {view === "potstat" && <PotentialStatuses base={base} v4={v4} />}
            {view === "porter" && <PorterSlips v4={v4} />}
            {view === "valstat" && <ValidationStatuses base={base} v4={v4} />}
            {view === "bell" && <BellSlips v4={v4} />}
            {view === "trgroup" && <TradingGroups base={base} v4={v4} />}
            {view === "lamp" && <LampCards v4={v4} />}
            {view === "broker" && <BrokerNames base={base} v4={v4} />}
            {view === "host" && <HostCards v4={v4} />}
            {view === "server" && <TradingServers base={base} v4={v4} />}
            {view === "callwin" && <CallWindows v4={v4} />}
            {view === "zones" && <CustomerTimezones base={base} v4={v4} />}
            {view === "arrival" && <ArrivalCards v4={v4} />}
            {view === "cities" && <CustomerCities base={base} v4={v4} />}
            {view === "place" && <PlaceCards v4={v4} />}
            {view === "browsers" && <CustomerBrowsers base={base} v4={v4} />}
            {view === "watch" && <WatchSlips v4={v4} />}
            {view === "systems" && <CustomerSystems base={base} v4={v4} />}
            {view === "keys" && <KeyCards v4={v4} />}
            {view === "devices" && <CustomerDevices base={base} v4={v4} />}
            {view === "stacks" && <StackSlips v4={v4} />}
            {view === "atlas" && <CustomerAtlas base={base} v4={v4} />}
            {view === "cues" && <CueCards v4={v4} />}
            {view === "regions" && <CustomerRegions base={base} v4={v4} />}
            {view === "ribbons" && <RibbonCards v4={v4} />}
            {view === "reasons" && <InvalidReasons base={base} v4={v4} />}
            {view === "playbill" && <PlaybillCards v4={v4} />}
            {view === "ivsource" && <InvalidSources base={base} v4={v4} />}
            {view === "interlude" && <InterludeCards v4={v4} />}
            {view === "vintage" && <RegistrationVintages base={base} v4={v4} />}
            {view === "folio" && <FolioSlips v4={v4} />}
            {view === "natal" && <NatalMonths base={base} v4={v4} />}
            {view === "vellum" && <VellumSlips v4={v4} />}
            {view === "house" && <HouseholdMarks base={base} v4={v4} />}
            {view === "quire" && <QuireLeaves v4={v4} />}
            {view === "courtesy" && <CourtesyRanks base={base} v4={v4} />}
            {view === "promise" && <SlaPromises v4={v4} />}
            {view === "calling" && <CallingCodes base={base} v4={v4} />}
            {view === "briefing" && <ShiftBriefings v4={v4} />}
            {view === "lexicon" && <SpokenLanguages base={base} v4={v4} />}
            {view === "dispatch" && <DispatchSlips v4={v4} />}
            {view === "wings" && <DeskWings base={base} v4={v4} />}
            {view === "loom" && <LoomTickets v4={v4} />}
            {view === "bands" && <LoginBands base={base} v4={v4} />}
            {view === "kiln" && <KilnSlips v4={v4} />}
            {view === "handles" && <UsernameHandles base={base} v4={v4} />}
            {view === "proofs" && <PressProofs v4={v4} />}
            {view === "given" && <GivenNames base={base} v4={v4} />}
            {view === "dockets" && <DocketSlips v4={v4} />}
            {view === "family" && <FamilyNames base={base} v4={v4} />}
            {view === "quay" && <QuaySlips v4={v4} />}
            {view === "belts" && <TimezoneBelts base={base} v4={v4} />}
            {view === "bench" && <ConservatoryBenches v4={v4} />}
            {view === "plates" && <CountryPlates base={base} v4={v4} />}
            {view === "perch" && <AviaryPerches v4={v4} />}
            {view === "presence" && <PresenceWatches base={base} v4={v4} />}
            {view === "hearth" && <HearthRelays v4={v4} />}
            {view === "lantern" && <LoginLanterns base={base} v4={v4} />}
            {view === "stitch" && <BinderyStitches v4={v4} />}
            {view === "cloth" && <CampaignCloths base={base} v4={v4} />}
            {view === "proof" && <DocumentProofs v4={v4} />}
            {view === "ribbon" && <AffiliateRibbons base={base} v4={v4} />}
            {view === "quill" && <QuillReminders v4={v4} />}
            {view === "seal" && <ContactSeals base={base} v4={v4} />}
            {view === "wax" && <WaxFollowUps v4={v4} />}
            {view === "lamp" && <FollowLamps base={base} v4={v4} />}
            {view === "gilt" && <GiltAssignments v4={v4} />}
            {view === "ftd" && <FirstMarks base={base} v4={v4} />}
            {view === "marq" && <MarquetryTasks v4={v4} />}
            {view === "gate" && <TradeGates base={base} v4={v4} />}
            {view === "cloak" && <CloakroomPasses v4={v4} />}
            {view === "latch" && <LoginLatches base={base} v4={v4} />}
            {view === "nook" && <ReadingNooks v4={v4} />}
            {view === "bolt" && <WithdrawalBolts base={base} v4={v4} />}
            {view === "oriel" && <OrielHours v4={v4} />}
            {view === "trial" && <TrialLamps base={base} v4={v4} />}
            {view === "atelier" && <AtelierPasses v4={v4} />}
            {view === "notice" && <BlockNotices base={base} v4={v4} />}
            {view === "vestry" && <VestryChits v4={v4} />}
            {view === "shutter" && <ShutterTimes base={base} v4={v4} />}
            {view === "choir" && <ChoirStalls v4={v4} />}
            {view === "ember" && <EmberAges base={base} v4={v4} />}
            {view === "arcade" && <ArcadeBays v4={v4} />}
            {view === "strike" && <FailedStrikes base={base} v4={v4} />}
            {view === "stool" && <GlasshouseStools v4={v4} />}
            {view === "rslip" && <RetentionSlips base={base} v4={v4} />}
            {view === "ladder" && <OrchardLadders v4={v4} />}
            {view === "ctmark" && <CountryMarks base={base} v4={v4} />}
            {view === "wtrls" && <WinterTrellises v4={v4} />}
            {view === "pstems" && <PhoneStems base={base} v4={v4} />}
            {view === "hbrms" && <HerbariumSheets v4={v4} />}
            {view === "alane" && <AddressLanes base={base} v4={v4} />}
            {view === "crtch" && <RegistryCartouches v4={v4} />}
            {view === "rgtry" && <RegistryMarks base={base} v4={v4} />}
            {view === "chits" && <AtelierChits v4={v4} />}
            {view === "ctysl" && <CitySlips base={base} v4={v4} />}
            {view === "frames" && <SalonFrames v4={v4} />}
            {view === "dkplt" && <DeskPlates base={base} v4={v4} />}
            {view === "bear" && <MapBearings v4={v4} />}
            {view === "mlsl" && <MailSeals base={base} v4={v4} />}
            {view === "press" && <PressSlips v4={v4} />}
            {view === "pcmk" && <PartnerCodes base={base} v4={v4} />}
            {view === "chime" && <NightChimes v4={v4} />}
            {view === "rftok" && <ReferralTokens base={base} v4={v4} />}
            {view === "morn" && <MorningOrders v4={v4} />}
            {view === "aaid" && <AffiliateStems base={base} v4={v4} />}
            {view === "keeps" && <RetentionKeeps v4={v4} />}
            {view === "istmp" && <InvalidStamps base={base} v4={v4} />}
            {view === "vows" && <CourtesyVows v4={v4} />}
            {view === "span" && <LeverageSpans base={base} v4={v4} />}
            {view === "slate" && <SlateWatches v4={v4} />}
            {view === "ownr" && <OwnerPlates base={base} v4={v4} />}
            {view === "vesper" && <VesperBells v4={v4} />}
            {view === "stem" && <ServerStems base={base} v4={v4} />}
            {view === "index" && <IndexSlips v4={v4} />}
            {view === "mhall" && <MailHalls base={base} v4={v4} />}
            {view === "ghook" && <GalleryHooks v4={v4} />}
            {view === "llane" && <LanguageLanes base={base} v4={v4} />}
            {view === "cwin" && <CallbackWindows v4={v4} />}
            {view === "iring" && <InviteRings base={base} v4={v4} />}
            {view === "rvmin" && <ReviewMinutes v4={v4} />}
            {view === "ncts" && <NoticeCrests base={base} v4={v4} />}
            {view === "qhold" && <QuietHolds v4={v4} />}
            {view === "dials" && <DialLanes base={base} v4={v4} />}
            {view === "sbook" && <SittingBook v4={v4} />}
            {view === "cmks" && <CityMarks base={base} v4={v4} />}
            {view === "crtsy" && <CourtesyCards v4={v4} />}
            {view === "nseal" && <CountrySeals base={base} v4={v4} />}
            {view === "vpass" && <VisitPasses v4={v4} />}
            {view === "bplt" && <BrokerPlates base={base} v4={v4} />}
            {view === "esl" && <EscortSlips v4={v4} />}
            {view === "nrb" && <NoteRibbons base={base} v4={v4} />}
            {view === "wslt" && <WaitlistSlots v4={v4} />}
            {view === "fstp" && <FollowStamps base={base} v4={v4} />}
            {view === "hbrf" && <HandoffBriefs v4={v4} />}
            {view === "plgm" && <PledgeMarks base={base} v4={v4} />}
            {view === "flwt" && <FolioWarrants v4={v4} />}
            {view === "mngm" && <MailMonograms base={base} v4={v4} />}
            {view === "sitt" && <AtelierSittings v4={v4} />}
            {view === "crst" && <SurnameCrests base={base} v4={v4} />}
            {view === "rctl" && <SalonRecitals v4={v4} />}
            {view === "unsl" && <UsernameSeals base={base} v4={v4} />}
            {view === "gwlk" && <GalleryWalks v4={v4} />}
            {view === "tzon" && <TimezoneOffsets base={base} v4={v4} />}
            {view === "orcd" && <OratoryCards v4={v4} />}
            {view === "vsip" && <VisitorSeals base={base} v4={v4} />}
            {view === "vstb" && <VestibuleBenches v4={v4} />}
            {view === "agsc" && <AgentScripts base={base} v4={v4} />}
            {view === "cnsl" && <ConservatorySlips v4={v4} />}
            {view === "rfbn" && <ReferralRibbons base={base} v4={v4} />}
            {view === "rdlm" && <ReadingLamps v4={v4} />}
            {view === "ltrc" && <LetterCrests base={base} v4={v4} />}
            {view === "glmt" && <GalleryMounts v4={v4} />}
            {view === "dvpl" && <DevicePlates base={base} v4={v4} />}
            {view === "clst" && <CloisterStalls v4={v4} />}
            {view === "sycr" && <SystemCrests base={base} v4={v4} />}
            {view === "nvbn" && <NaveBenches v4={v4} />}
            {view === "lnrb" && <LanguageRibbons base={base} v4={v4} />}
            {view === "apal" && <ApseAlcoves v4={v4} />}
            {view === "brcr" && <BrowserCrests base={base} v4={v4} />}
            {view === "trst" && <TranseptStalls v4={v4} />}
            {view === "acwf" && <AccountWafers base={base} v4={v4} />}
            {view === "amln" && <AmbulatoryLanterns v4={v4} />}
            {view === "clmp" && <CountryLamps base={base} v4={v4} />}
            {view === "nxcd" && <NarthexCandles v4={v4} />}
            {view === "adpl" && <AddressPlates base={base} v4={v4} />}
            {view === "crbx" && <CryptChests v4={v4} />}
            {view === "rsdl" && <ResidencySeals base={base} v4={v4} />}
            {view === "iflo" && <InkFolios v4={v4} />}
            {view === "dgrd" && <DocumentGrades base={base} v4={v4} />}
            {view === "chsl" && <ChapterSlips v4={v4} />}
            {view === "pbrb" && <PartnerRibbons base={base} v4={v4} />}
            {view === "blcd" && <BellCords v4={v4} />}
            {view === "dlsl" && <DialSeals base={base} v4={v4} />}
            {view === "fpen" && <FountainPens v4={v4} />}
            {view === "mcrs" && <MailCrests base={base} v4={v4} />}
            {view === "stcd" && <SeatCards v4={v4} />}
            {view === "gmkp" && <GroupMarks base={base} v4={v4} />}
            {view === "lgsl" && <LoggiaSlips v4={v4} />}
            {view === "ctcr" && <CityCrests base={base} v4={v4} />}
            {view === "bvst" && <BelvedereSteps v4={v4} />}
            {view === "kpsl" && <KeeperSeals base={base} v4={v4} />}
            {view === "mzrl" && <MezzanineRails v4={v4} />}
            {view === "syct" && <SymbolCrests base={base} v4={v4} />}
            {view === "orsl" && <OrielSills v4={v4} />}
            {view === "lghr" && <LogHours base={base} v4={v4} />}
            {view === "frze" && <FriezeCards v4={v4} />}
            {view === "qmks" && <QuoinMarks base={base} v4={v4} />}
            {view === "dntl" && <DentilTiles v4={v4} />}
            {view === "vous" && <VoussoirMarks base={base} v4={v4} />}
            {view === "brdc" && <BrocadeSwatches v4={v4} />}
            {view === "pnnt" && <PennantMarks base={base} v4={v4} />}
            {view === "coff" && <CofferPanels v4={v4} />}
            {view === "rsst" && <RosetteMarks base={base} v4={v4} />}
            {view === "scdr" && <SacristyDrawers v4={v4} />}
            {view === "antp" && <AntiphonMarks base={base} v4={v4} />}
            {view === "aisl" && <AisleNiches v4={v4} />}
            {view === "esct" && <EscutcheonMarks base={base} v4={v4} />}
            {view === "cabn" && <CabinetDrawers v4={v4} />}
            {view === "wmk" && <WatermarkMarks base={base} v4={v4} />}
            {view === "qire" && <ReportQuires base={base} v4={v4} />}
            {view === "rmgn" && <ReportMargins base={base} v4={v4} />}
            {view === "dty" && <DutySlips base={base} v4={v4} />}
            {view === "pcr" && <ProfileCrests base={base} v4={v4} />}
            {view === "lnw" && <LintelWatches base={base} v4={v4} />}
            {view === "hmk" && <HourMarks base={base} v4={v4} />}
            {view === "nbl" && <NoticeBells base={base} v4={v4} />}
            {view === "tsl" && <TicketSeals base={base} v4={v4} />}
            {view === "vcd" && <VisitCards base={base} v4={v4} />}
            {view === "smk" && <StageMarks base={base} v4={v4} />}
            {view === "rsl" && <RefectorySlips base={base} v4={v4} />}
            {view === "dlg" && <DialectMarks base={base} v4={v4} />}
            {view === "obv" && <ObservatorySlips base={base} v4={v4} />}
            {view === "psr" && <PostureMarks base={base} v4={v4} />}
            {view === "brt" && <BerthSlips base={base} v4={v4} />}
            {view === "bdg" && <BadgeMarks base={base} v4={v4} />}
            {view === "alv" && <AlcoveSlips base={base} v4={v4} />}
            {view === "psp" && <PassportStamps base={base} v4={v4} />}
            {view === "trc" && <TerraceCards base={base} v4={v4} />}
            {view === "clp" && <ColophonMarks base={base} v4={v4} />}
            {view === "csh" && <CallSheets base={base} v4={v4} />}
            {view === "ppl" && <PressPlates base={base} v4={v4} />}
            {view === "dnb" && <DawnBooks base={base} v4={v4} />}
            {view === "lcr" && <VowelMarks base={base} v4={v4} />}
            {view === "hgl" && <HourglassSlips base={base} v4={v4} />}
            {view === "syl" && <SyllablePlates base={base} v4={v4} />}
            {view === "bnc" && <BinnacleCards base={base} v4={v4} />}
            {view === "luf" && <LuffMarks base={base} v4={v4} />}
            {view === "orb" && <OrchardBenches base={base} v4={v4} />}
            {view === "mrd" && <MeridianMarks base={base} v4={v4} />}
            {view === "qsl" && <QuireSlips base={base} v4={v4} />}
            {view === "pmk" && <PostmarkLanes base={base} v4={v4} />}
            {view === "nch" && <NicheCards base={base} v4={v4} />}
            {view === "emc" && <EmailCrests base={base} v4={v4} />}
            {view === "crl" && <CarrelSlips base={base} v4={v4} />}
            {view === "lgs" && <LoginSeals base={base} v4={v4} />}
            {view === "agenda" && <DayStrip base={base} v4={v4} locale={locale} />}
            {view === "insights" && <InsightsHome base={base} v4={v4} locale={locale} />}
            {view === "prefs" && <PrefsHub v4={v4} locale={locale} />}
            {view === "agenda" && <AgendaPage base={base} v4={v4} locale={locale} />}
            {view === "roster" && <DeskStaff v4={v4} />}
            {view === "withdraw" && <WithdrawDesk base={base} v4={v4} tx={tx} locale={locale} />}
            {view === "deposit" && <DepositDesk base={base} v4={v4} tx={tx} locale={locale} />}
            {view === "inbox" && <InboxDesk v4={v4} tx={tx} locale={locale} />}
            {view === "logs" && <Logs tx={tx} locale={locale} q={q} />}
            {view === "control" && <Control tx={tx} locale={locale} base={base} />}
            {!known && (
              <section className="c4-card c4-soon" data-coming-soon="">
                <h2 className="c4-title c4-pad">{tx("comingSoon")}</h2>
                <p className="c4-muted c4-pad">{tx("comingSoonBody")}</p>
              </section>
            )}
            </DeskBoundary>
          </main>
          <DeskFoot section={heading} name={name} v4={v4} onHelp={() => setSheetOpen(true)} />
        </div>
      </div>

      <aside className="c4-rail c4-rail-luxe c4-rail-folio c4-rail-crest c4-rail-salon c4-rail-gallery c4-rail-library c4-rail-press c4-rail-ribbon c4-rail-playbill c4-rail-interlude c4-rail-slip c4-rail-vellum c4-rail-quire c4-rail-promise c4-rail-briefing c4-rail-dispatch c4-rail-loom c4-rail-kiln c4-rail-proof c4-rail-docket c4-rail-quay c4-rail-bench c4-rail-perch c4-rail-hearth c4-rail-inkwell c4-rail-stool c4-rail-ladder c4-rail-compositor c4-rail-inlay c4-rail-atlas c4-rail-oratory c4-rail-vestibule c4-rail-conservatory c4-rail-reading c4-rail-mount c4-rail-cloister c4-rail-apse c4-rail-narthex c4-rail-crypt c4-rail-seat c4-rail-loggia c4-rail-belvedere c4-rail-mezzanine" aria-label={v4("admin")}>
        <p className="c4-rail-plate" data-logo="mono" aria-hidden="true">7FX</p>
        <button type="button" className="c4-rail-btn c4-plus" aria-label={v4("quickPlus")} onClick={() => setQuickOpen(true)}>+</button>
        <CallTarget v4={v4} />
        <button type="button" className="c4-rail-btn" aria-label={`${shownName || name} ${v4("staffProfile")}`} onClick={() => window.location.assign(crmv4Href(base, "me"))}>
          <span className="c4-avatar">{initials(shownName || name)}</span>
          <span>{shownName || v4("admin")}</span>
        </button>
        <button type="button" className="c4-rail-btn" aria-label={tx("notifications")} onClick={() => setNotesOpen(true)}>
          <BellIcon />
          {inboxUnread > 0 && <span className="c4-rail-badge">{inboxUnread}</span>}
          <span>{tx("notifications")}</span>
        </button>
        <button type="button" className="c4-rail-btn" aria-label={v4("reminders")} onClick={() => setRemindersOpen(true)}>
          <ClockIcon />
          <span>{v4("reminders")}</span>
        </button>
        <button type="button" className="c4-rail-btn" aria-label={v4("notes")} onClick={() => setPadOpen(true)}>
          <NoteIcon />
          <span>{v4("notes")}</span>
        </button>
        <button type="button" className="c4-rail-btn" aria-label={v4("language")} onClick={() => setLangOpen(true)}>
          <LangIcon />
          <span>{locale.toUpperCase()}</span>
        </button>
        <button type="button" className="c4-rail-btn" aria-label={v4("density")} onClick={() => {
          const next = density === "compact" ? "comfortable" : "compact";
          setDensity(next);
          storeDensity(next);
        }}>
          <span>{density === "compact" ? v4("compact") : v4("comfortable")}</span>
        </button>
        <button type="button" className="c4-rail-btn" aria-label={v4("toastHistory")} onClick={() => setLogOpen(true)}>
          <span>{v4("toastHistory")}</span>
        </button>
        <button type="button" className="c4-rail-btn" aria-label={v4("helpCenter")} onClick={() => setHelpOpen(true)}>
          <span>{v4("helpCenter")}</span>
        </button>
        <button type="button" className="c4-rail-btn" aria-label={theme === "dark" ? tx("themeLight") : tx("themeDark")} onClick={toggleTheme}>
          <SunIcon />
          <span>{theme === "dark" ? tx("themeLight") : tx("themeDark")}</span>
        </button>
        <form method="post" action="/api/auth/logout" style={{ marginTop: "auto", width: "100%" }}>
          <input type="hidden" name="nav" value="1" />
          <input type="hidden" name="desk" value="crmv4" />
          <button type="submit" className="c4-rail-btn" aria-label={tx("signOut")}>
            <OutIcon />
            <span>{tx("signOut")}</span>
          </button>
        </form>
      </aside>

      <nav className="c4-tabs c4-tabs-luxe c4-tabs-folio c4-tabs-cellar" aria-label={tx("panel")}>
        {CRM_V4_TABS.map((tab) => (
          <Link key={tab} href={crmv4Href(base, tab === "overview" ? "" : tab)} data-on={view === tab ? "1" : "0"} className="c4-tab" aria-current={view === tab ? "page" : undefined}>
            {label(tab)}
          </Link>
        ))}
        <button type="button" className="c4-tab" data-on={more ? "1" : "0"} aria-expanded={more} aria-haspopup="dialog" onClick={() => setMore(true)}>
          {tx("more")}
        </button>
      </nav>

      <div className="c4-toasts" aria-live="polite">
        {toasts.map((item) => (
          <div key={item.id} className="c4-toast" data-ok={item.ok ? "1" : "0"}>{item.text}</div>
        ))}
      </div>

      {more && (
        <Sheet title={tx("more")} onClose={() => setMore(false)} closeLabel={tx("close")}>
          <div className="c4-more-luxe">
            <GroupedMenu base={base} view={view} names={names} v4={v4} onPick={() => setMore(false)} />
            <section aria-label={v4("moreSession")}>
              <h3 className="c4-title">{v4("moreSession")}</h3>
              <button type="button" className="c4-btn" onClick={() => { setMore(false); setNotesOpen(true); }}>{tx("notifications")}</button>
              <button type="button" className="c4-btn" onClick={() => { setMore(false); setRemindersOpen(true); }}>{v4("reminders")}</button>
              <button type="button" className="c4-btn" onClick={() => { setMore(false); setPadOpen(true); }}>{v4("notes")}</button>
              <button type="button" className="c4-btn" onClick={() => { setMore(false); setSheetOpen(true); }}>{v4("openHelp")}</button>
              <MotionPref v4={v4} />
              <LanguageSwitcher compact tone={theme === "dark" ? "dark" : "crm"} />
              <button type="button" className="c4-btn" onClick={toggleTheme}>{theme === "dark" ? tx("themeLight") : tx("themeDark")}</button>
              <p className="c4-muted c4-meta">{tx("signedInAs")} {name}</p>
              <form method="post" action="/api/auth/logout">
                <input type="hidden" name="nav" value="1" />
                <input type="hidden" name="desk" value="crmv4" />
                <button type="submit" className="c4-btn">{tx("signOut")}</button>
              </form>
            </section>
          </div>
        </Sheet>
      )}

      {notesOpen && (
        <Drawer title={v4("ibTitle")} className="c4-inbox" onClose={() => setNotesOpen(false)} closeLabel={tx("close")}>
          <NoticeCenter base={base} v4={v4} locale={locale} tx={tx} placed="drawer" />
        </Drawer>
      )}

      {remindersOpen && (
        <Drawer title={v4("reminders")} onClose={() => setRemindersOpen(false)} closeLabel={tx("close")}>
          <ReminderForm tx={tx} v4={v4} onDone={reminders.reload} />
          <div className="c4-stack">
            {(reminders.data?.reminders || []).map((row) => (
              <div key={row.id} className="c4-note">
                <div>{row.body}</div>
                <div className="c4-muted c4-meta">{when(row.remindAt, locale)}{row.trader ? ` · ${row.trader}` : ""}</div>
              </div>
            ))}
            {!reminders.loading && !(reminders.data?.reminders || []).length && <p className="c4-muted">{v4("noReminders")}</p>}
          </div>
        </Drawer>
      )}

      {padOpen && (
        <Drawer title={v4("notes")} onClose={() => setPadOpen(false)} closeLabel={tx("close")}>
          <ScratchNotes tx={tx} v4={v4} notes={scratch} setNotes={setScratch} />
        </Drawer>
      )}
      <Fab v4={v4} onCreate={() => setQuickOpen(true)} />
      <QuickSheet open={quickOpen} onClose={() => setQuickOpen(false)} onSearch={() => setPaletteOpen(true)} v4={v4} tx={tx} closeLabel={tx("close")} />
      <DeskSearch base={base} open={paletteOpen} onClose={() => setPaletteOpen(false)} v4={v4} locale={locale} />
      <HelpDrawer open={helpOpen} onClose={() => setHelpOpen(false)} onShortcuts={() => { setHelpOpen(false); setSheetOpen(true); }} v4={v4} closeLabel={tx("close")} />
      <ShortcutsSheet open={sheetOpen} onClose={() => setSheetOpen(false)} onHelp={() => { setSheetOpen(false); setHelpOpen(true); }} v4={v4} closeLabel={tx("close")} />
      <UndoHost v4={v4} />
      {logOpen && (
        <Drawer title={v4("toastHistory")} onClose={() => setLogOpen(false)} closeLabel={tx("close")}>
          <ul>{toastsLog.map((row) => <li key={row.id} className="c4-pad">{row.text}</li>)}</ul>
          {!toastsLog.length && <p className="c4-muted">{v4("toastHistory")}</p>}
        </Drawer>
      )}
      {langOpen && (
        <Sheet title={v4("language")} onClose={() => setLangOpen(false)} closeLabel={tx("close")}>
          <LanguageSwitcher tone={theme === "dark" ? "dark" : "crm"} />
        </Sheet>
      )}
    </div>
  );
}

function readTrail(): string[] {
  try {
    const parsed = JSON.parse(window.sessionStorage.getItem("crmv4-trail") || "[]") as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  const mark = parts.map((part) => part.slice(0, 1)).join("").toUpperCase();
  return mark || "A";
}

function Drawer({ title, onClose, closeLabel, children, className }: { title: string; onClose: () => void; closeLabel: string; children: ReactNode; className?: string }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);
  return (
    <div className="c4-drawer-back" role="presentation" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} className={className ? `c4-drawer ${className}` : "c4-drawer"} onClick={(event) => event.stopPropagation()}>
        <div className="c4-grab" aria-hidden />
        <div className="c4-row c4-between">
          <h2 className="c4-title">{title}</h2>
          <button type="button" className="c4-btn" onClick={onClose}>{closeLabel}</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ScratchNotes({ tx, v4, notes, setNotes }: { tx: (key: CrmV2CopyKey) => string; v4: (key: CrmV4CopyKey) => string; notes: Scratch[]; setNotes: (rows: Scratch[]) => void }) {
  const [body, setBody] = useState("");
  return (
    <div className="c4-stack">
      <p className="c4-muted c4-meta">{v4("scratchHint")}</p>
      <form
        className="c4-form"
        onSubmit={(event) => {
          event.preventDefault();
          const text = body.trim();
          if (!text) return;
          const next = [{ id: String(Date.now()), body: text }, ...notes].slice(0, 40);
          setNotes(next);
          writeJson(NOTES_KEY, next);
          setBody("");
        }}
      >
        <label className="c4-lab">
          <span>{v4("notes")}</span>
          <textarea value={body} onChange={(event) => setBody(event.target.value)} className="c4-field" rows={3} />
        </label>
        <button type="submit" className="c4-btn c4-btn-hot">{v4("addScratch")}</button>
        <p className="c4-muted c4-meta">{v4("localOnly")}</p>
      </form>
      {notes.map((row) => (
        <div key={row.id} className="c4-note">
          <div>{row.body}</div>
          <button
            type="button"
            className="c4-btn c4-btn-coral"
            onClick={() => {
              const next = notes.filter((item) => item.id !== row.id);
              setNotes(next);
              writeJson(NOTES_KEY, next);
            }}
          >
            {tx("close")}
          </button>
        </div>
      ))}
      {!notes.length && <p className="c4-muted">{v4("noScratch")}</p>}
    </div>
  );
}

function ReminderForm({ tx, v4, onDone }: { tx: (key: CrmV2CopyKey) => string; v4: (key: CrmV4CopyKey) => string; onDone: () => void }) {
  const [msg, setMsg] = useState("");
  return (
    <form
      className="c4-form"
      onSubmit={async (event) => {
        event.preventDefault();
        const fd = new FormData(event.currentTarget);
        const res = await sendJson("/api/admin/calendar", "POST", {
          action: "create",
          body: fd.get("body"),
          remindAt: fd.get("remindAt"),
        });
        setMsg(res.ok ? tx("saved") : res.error || tx("failed"));
        if (res.ok) {
          event.currentTarget.reset();
          onDone();
        }
      }}
    >
      <label className="c4-lab">
        <span>{v4("reminderBody")}</span>
        <input name="body" required className="c4-field" />
      </label>
      <label className="c4-lab">
        <span>{v4("reminderWhen")}</span>
        <input name="remindAt" type="datetime-local" required className="c4-field" />
      </label>
      <button type="submit" className="c4-btn c4-btn-hot">{v4("addReminder")}</button>
      {msg && <p className="c4-muted c4-meta">{msg}</p>}
    </form>
  );
}

function GearIcon() {
  return (
    <svg className="c4-ico" viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5v2.2M12 18.3v2.2M4.9 6.4l1.6 1.6M17.5 16l1.6 1.6M3.5 12h2.2M18.3 12h2.2M4.9 17.6l1.6-1.6M17.5 8l1.6-1.6" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg className="c4-ico" viewBox="0 0 24 24" aria-hidden>
      <path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg className="c4-ico" viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v5l3 2" />
    </svg>
  );
}

function NoteIcon() {
  return (
    <svg className="c4-ico" viewBox="0 0 24 24" aria-hidden>
      <path d="M7 4h8l4 4v12H7z" />
      <path d="M15 4v4h4M9 12h6M9 16h4" />
    </svg>
  );
}

function LangIcon() {
  return (
    <svg className="c4-ico" viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="8" />
      <path d="M4 12h16M12 4c2.5 2.6 2.5 13.4 0 16M12 4c-2.5 2.6-2.5 13.4 0 16" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg className="c4-ico" viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 3.5v2M12 18.5v2M4.8 4.8l1.4 1.4M17.8 17.8l1.4 1.4M3.5 12h2M18.5 12h2M4.8 19.2l1.4-1.4M17.8 6.2l1.4-1.4" />
    </svg>
  );
}

function OutIcon() {
  return (
    <svg className="c4-ico" viewBox="0 0 24 24" aria-hidden>
      <path d="M9 6H6v12h3M10 12h9M15 8l4 4-4 4" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg className="c4-ico" viewBox="0 0 24 24" aria-hidden>
      <path d="M5 7h14M5 12h14M5 17h14" />
    </svg>
  );
}
