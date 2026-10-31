"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import CrmI18n from "@/components/i18n/CrmI18n";
import { useI18n } from "@/lib/i18n/context";
import { crmv2Text, type CrmV2CopyKey } from "@/lib/crmv2/copy";
import { CRM_V2_SECTIONS, crmv2Href, type CrmV2SectionId } from "@/lib/crmv2/sections";
import BrandLogo from "@/components/landing/BrandLogo";
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

export default function CrmV2App(props: Props) {
  return (
    <CrmI18n>
      <Shell {...props} />
    </CrmI18n>
  );
}

function Shell({ base, section, name }: Props) {
  const { locale } = useI18n();
  const tx = useCallback((key: CrmV2CopyKey) => crmv2Text(locale, key), [locale]);
  const view = (section[0] || "overview") as CrmV2SectionId | string;
  const id = section[1] || "";
  const [more, setMore] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const params = useSearchParams();
  const q = params.get("q") || "";
  const notes = useJson<{ items?: { id: string; title?: string; body?: string; readAt?: string | null; createdAt?: string }[]; unread?: number }>(notesOpen ? "/api/notifications?take=20" : null);

  useEffect(() => {
    const saved = window.localStorage.getItem("crmv2-theme");
    if (saved === "light" || saved === "dark") setTheme(saved);
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    window.localStorage.setItem("crmv2-theme", next);
  }

  const mainTabs: CrmV2SectionId[] = ["overview", "customers", "finance", "support"];
  const moreTabs: CrmV2SectionId[] = ["positions", "marketing", "settings", "logs", "control"];

  return (
    <div data-crmv2-root="" data-theme={theme} data-crmv2-view={id ? `${view}/${id}` : view} className="cv-app min-h-screen font-normal">
      <div className="mx-auto flex min-h-screen max-w-[1440px]">
        <aside className="cv-side hidden w-56 shrink-0 flex-col md:flex">
          <div className="flex items-center gap-2 px-4 py-5">
            <BrandLogo tone={theme === "light" ? "ink" : "paper"} height={32} className="h-8 w-8" />
            <span className="text-sm font-normal tracking-tight">CRM</span>
          </div>
          <nav className="flex flex-1 flex-col gap-1 px-2">
            {CRM_V2_SECTIONS.map((item) => (
              <Link
                key={item.id}
                href={crmv2Href(base, item.path)}
                data-nav={item.id}
                data-on={view === item.id ? "1" : "0"}
                className="cv-nav px-3 py-2 text-sm"
              >
                {tx(item.id)}
              </Link>
            ))}
          </nav>
          <form method="post" action="/api/auth/logout" className="m-3">
            <input type="hidden" name="nav" value="1" />
            <button type="submit" className="cv-btn w-full text-start">{tx("signOut")}</button>
          </form>
          <p className="cv-muted px-4 pb-4 text-xs">
            {tx("signedInAs")}
            <span className="mt-1 block">{name}</span>
          </p>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col pb-16 md:pb-0">
          <header className="flex items-center gap-3">
            <BrandLogo tone={theme === "light" ? "ink" : "paper"} height={28} className="h-7 w-7 shrink-0 md:hidden" />
            <h1 className="hidden text-base font-normal sm:block">{tx("panel")}</h1>
            <form action={crmv2Href(base, "customers")} className="relative min-w-0 flex-1 md:max-w-sm">
              <input
                name="q"
                defaultValue={q}
                placeholder={tx("search")}
                aria-label={tx("search")}
                className="cv-field cv-search"
              />
            </form>
            <button type="button" className="cv-btn" onClick={toggleTheme}>{theme === "dark" ? tx("themeLight") : tx("themeDark")}</button>
            <button type="button" className="cv-btn" onClick={() => setNotesOpen(true)}>{tx("notifications")}</button>
            <LanguageSwitcher compact tone="crm" />
          </header>
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
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
            {!CRM_V2_SECTIONS.some((item) => item.id === view) && (
              <section className="cv-card cv-soon" data-coming-soon="">
                <h2 className="cv-title" style={{ padding: 16 }}>{tx("comingSoon")}</h2>
                <p className="cv-muted" style={{ padding: "0 16px 16px" }}>{tx("comingSoonBody")}</p>
              </section>
            )}
          </main>
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-20 flex md:hidden" aria-label={tx("panel")}>
        {mainTabs.map((tab) => (
          <Link key={tab} href={crmv2Href(base, tab === "overview" ? "" : tab)} data-on={view === tab ? "1" : "0"} className="flex-1 py-2 text-center text-[11px] font-normal">
            {tx(tab)}
          </Link>
        ))}
        <button type="button" className="flex-1 py-2 text-center text-[11px] font-normal" onClick={() => setMore(true)}>
          {tx("more")}
        </button>
      </nav>
      {more && (
        <Sheet title={tx("more")} onClose={() => setMore(false)} closeLabel={tx("close")}>
          <div className="cv-stack">
            {moreTabs.map((tab) => (
              <Link key={tab} href={crmv2Href(base, tab)} onClick={() => setMore(false)} className="cv-btn">
                {tx(tab)}
              </Link>
            ))}
            <form method="post" action="/api/auth/logout">
              <input type="hidden" name="nav" value="1" />
              <button type="submit" className="cv-btn w-full text-start">{tx("signOut")}</button>
            </form>
          </div>
        </Sheet>
      )}
      {notesOpen && (
        <Sheet title={tx("notifications")} onClose={() => setNotesOpen(false)} closeLabel={tx("close")}>
          <div className="cv-stack">
            <button
              type="button"
              className="cv-btn"
              onClick={async () => {
                await sendJson("/api/notifications", "PATCH", { all: true });
                notes.reload();
              }}
            >
              {tx("markRead")}{typeof notes.data?.unread === "number" ? ` · ${notes.data.unread}` : ""}
            </button>
            {(notes.data?.items || []).map((item) => (
              <div key={item.id} className="cv-note">
                <div>{item.title || tx("notifications")}</div>
                <div className="cv-muted">{item.body}</div>
                <div className="cv-muted">{when(item.createdAt, locale)}{item.readAt ? "" : ` · ${tx("unread")}`}</div>
              </div>
            ))}
            {!notes.loading && !(notes.data?.items || []).length && <p className="cv-muted">{tx("noneYet")}</p>}
          </div>
        </Sheet>
      )}
    </div>
  );
}
