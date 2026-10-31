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
import { Sheet, sendJson, useJson, when } from "./kit";
import { CommandPalette, ShortcutHelp, ShortcutHost } from "./desk/command";
import { DeskFooter } from "./desk/later";
import { groupedNav } from "@/lib/crmv3/local-pack";
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
  const [noteQuery, setNoteQuery] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [banner] = useLocal<string>("crmv3-banner", "");
  const [idle, setIdle] = useState(false);
  const [offline, setOffline] = useState(false);
  const params = useSearchParams();
  const q = params.get("q") || "";
  const notes = useJson<{ items?: { id: string; title?: string; body?: string; readAt?: string | null; createdAt?: string }[]; unread?: number }>(notesOpen ? "/api/notifications?take=20" : null);

  useEffect(() => {
    const saved = window.localStorage.getItem("crmv3-theme");
    if (saved === "light" || saved === "dark") setTheme(saved);
  }, []);

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
    if (tab === "more") return tx("more");
    return tx(tab as CrmV2CopyKey);
  }

  const known = CRM_V3_SECTIONS.some((item) => item.id === view);
  const heading = known ? label(view) : tx("comingSoon");

  return (
    <div data-crmv3-root="" data-theme={theme} data-crmv3-view={id ? `${view}/${id}` : view} className="c3-app font-normal">
      <a className="c3-skip" href="#c3-main">{v3("skipMain")}</a>
      <ShortcutHost base={base} onPalette={() => setPalette(true)} onHelp={setHelp} />
      <aside className="c3-rail">
        <div className="c3-rail-brand">
          <BrandLogo tone={theme === "light" ? "ink" : "paper"} height={24} className="c3-logo" />
          <span>{v3("v3mark")}</span>
        </div>
        <nav className="c3-stack" aria-label={tx("panel")}>
          {CRM_V3_SECTIONS.map((item) => (
            <Link key={item.id} href={crmv3Href(base, item.path)} data-nav={item.id} data-on={view === item.id ? "1" : "0"} className="c3-nav" aria-current={view === item.id ? "page" : undefined}>
              {label(item.id)}
            </Link>
          ))}
        </nav>
        <div className="c3-rail-foot">
          <p className="c3-muted c3-meta">{tx("signedInAs")}<span className="c3-value">{name}</span></p>
          <form method="post" action="/api/auth/logout">
            <input type="hidden" name="nav" value="1" />
            <button type="submit" className="c3-btn">{tx("signOut")}</button>
          </form>
        </div>
      </aside>

      <div className="c3-body">
        <header className="c3-header">
          <BrandLogo tone={theme === "light" ? "ink" : "paper"} height={24} className="c3-logo" />
          <div className="c3-header-copy">
            <p className="c3-kicker">{v3("v3mark")}</p>
            <h1 className="c3-heading">{heading}</h1>
          </div>
          <form action={crmv3Href(base, "customers")} className="c3-header-search">
            <input name="q" defaultValue={q} placeholder={tx("search")} aria-label={tx("search")} className="c3-field" />
          </form>
          <button type="button" className="c3-fab" aria-label={v3("searchFab")} onClick={() => setSearchOpen((open) => !open)}>⌕</button>
          {searchOpen && (
            <form action={crmv3Href(base, "customers")} className="c3-float" role="search">
              <input name="q" defaultValue={q} placeholder={tx("search")} aria-label={tx("search")} className="c3-field" autoFocus />
              <button type="button" className="c3-btn" onClick={() => setSearchOpen(false)}>{tx("close")}</button>
            </form>
          )}
          <button type="button" className="c3-icon-btn" onClick={toggleTheme} aria-label={theme === "dark" ? tx("themeLight") : tx("themeDark")}>
            {theme === "dark" ? "Lt" : "Dk"}
          </button>
          <button type="button" className="c3-icon-btn" onClick={() => setNotesOpen(true)} aria-label={tx("notifications")}>
            {typeof notes.data?.unread === "number" && notes.data.unread > 0 ? notes.data.unread : "•"}
          </button>
          <div className="c3-lang-slot">
            <LanguageSwitcher compact tone={theme === "dark" ? "dark" : "crm"} />
          </div>
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
            {view === "overview" && <Overview base={base} tx={tx} locale={locale} />}
            {view === "customers" && !id && <Customers base={base} tx={tx} locale={locale} q={q} />}
            {view === "customers" && id && <CustomerDetail base={base} id={id} tx={tx} locale={locale} />}
            {view === "finance" && <Finance tx={tx} locale={locale} q={q} />}
            {view === "positions" && <Positions tx={tx} locale={locale} q={q} />}
            {view === "support" && <Support tx={tx} locale={locale} q={q} />}
            {view === "marketing" && <Marketing tx={tx} />}
            {view === "settings" && <Settings tx={tx} />}
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
          <MoreGroups base={base} view={view} label={label} tx={tx} v3={v3} theme={theme} name={name} onClose={() => setMore(false)} onTheme={toggleTheme} onHelp={() => { setMore(false); setHelp(true); }} />
        </Sheet>
      )}
      <CommandPalette base={base} open={palette} onClose={() => setPalette(false)} />
      <ShortcutHelp open={help} onClose={() => setHelp(false)} />
      {notesOpen && (
        <Sheet title={tx("notifications")} onClose={() => setNotesOpen(false)} closeLabel={tx("close")}>
          <div className="c3-stack">
            <input className="c3-field" aria-label={v3("noteSearch")} placeholder={v3("noteSearch")} value={noteQuery} onChange={(event) => setNoteQuery(event.target.value)} />
            <button type="button" className="c3-chip" data-on={unreadOnly ? "1" : "0"} onClick={() => setUnreadOnly((on) => !on)}>{v3("unreadOnly")}</button>
            <p className="c3-muted">{v3("unreadHint")}</p>
            <button
              type="button"
              className="c3-btn"
              onClick={async () => {
                await sendJson("/api/notifications", "PATCH", { all: true });
                notes.reload();
              }}
            >
              {tx("markRead")}{typeof notes.data?.unread === "number" ? ` · ${notes.data.unread}` : ""}
            </button>
            {(notes.data?.items || []).filter((item) => {
              if (unreadOnly && item.readAt) return false;
              const blob = `${item.title || ""} ${item.body || ""}`.toLowerCase();
              return blob.includes(noteQuery.trim().toLowerCase());
            }).map((item) => (
              <div key={item.id} className="c3-note">
                <div>{item.title || tx("notifications")}</div>
                <div className="c3-muted">{item.body}</div>
                <div className="c3-muted c3-meta">{when(item.createdAt, locale)}{item.readAt ? "" : ` · ${tx("unread")}`}</div>
                {!item.readAt && (
                  <button type="button" className="c3-btn" onClick={async () => { await sendJson("/api/notifications", "PATCH", { id: item.id }); notes.reload(); }}>{v3("markOne")}</button>
                )}
              </div>
            ))}
            {!notes.loading && !(notes.data?.items || []).length && <p className="c3-muted">{tx("noneYet")}</p>}
          </div>
        </Sheet>
      )}
    </div>
  );
}

function MoreGroups({ base, view, label, tx, v3, theme, name, onClose, onTheme, onHelp }: {
  base: string;
  view: string;
  label: (tab: string) => string;
  tx: (key: "more" | "themeLight" | "themeDark" | "signedInAs" | "signOut" | "close") => string;
  v3: (key: "moreWork" | "moreRecords" | "moreDesk" | "moreSession" | "footShortcuts" | "motionLess") => string;
  theme: "dark" | "light";
  name: string;
  onClose: () => void;
  onTheme: () => void;
  onHelp: () => void;
}) {
  const groups = groupedNav(CRM_V3_MORE);
  const blocks = [
    ["moreWork", groups.work],
    ["moreRecords", groups.records],
    ["moreDesk", groups.desk],
  ] as const;
  return (
    <div className="c3-stack">
      {blocks.map(([title, ids]) => (
        <section key={title} className="c3-stack">
          <h3 className="c3-title">{v3(title)}</h3>
          {ids.map((tab) => (
            <Link key={tab} href={crmv3Href(base, tab)} onClick={onClose} className="c3-btn" aria-current={view === tab ? "page" : undefined}>
              {label(tab)}
            </Link>
          ))}
        </section>
      ))}
      <section className="c3-stack">
        <h3 className="c3-title">{v3("moreSession")}</h3>
        <button type="button" className="c3-btn" onClick={onHelp}>{v3("footShortcuts")}</button>
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
