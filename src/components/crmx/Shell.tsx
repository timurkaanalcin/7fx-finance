"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import SignOutForm from "@/components/auth/SignOutForm";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { decideCrmxSession, scopedCrmxPageAllowed } from "@/lib/crmx/guard";
import { classicLinks, CRMX_NAV, crmxActive } from "@/lib/crmx/nav";
import { scopedPageAllowed } from "@/lib/crm-scope-pages";
import { useI18n } from "@/lib/i18n/context";
import Icon from "./icons";

const CommandPalette = dynamic(() => import("./CommandPalette"), { ssr: false });

export type CrmxAccess = {
  readOnly: boolean;
  canApprove: boolean;
  scoped: boolean;
  name: string;
};

const CrmxAccessContext = createContext<CrmxAccess>({
  readOnly: true,
  canApprove: false,
  scoped: false,
  name: "",
});

export function useCrmxAccess(): CrmxAccess {
  return useContext(CrmxAccessContext);
}

type MePayload = {
  user?: { role?: string; name?: string };
  permissions?: { crmReadOnly?: boolean; scoped?: boolean; canApproveDeposits?: boolean };
};

export default function Shell({ children }: { children: ReactNode }) {
  const { t, dir } = useI18n();
  const pathname = usePathname() || "/crmx";
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [access, setAccess] = useState<CrmxAccess>({ readOnly: true, canApprove: false, scoped: false, name: "" });
  const [collapsed, setCollapsed] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [palette, setPalette] = useState(false);
  const [classicOpen, setClassicOpen] = useState(false);

  useEffect(() => {
    let live = true;
    fetch("/api/auth/me?scope=admin", { cache: "no-store" })
      .then(async (res) => {
        if (res.status === 401) return { user: undefined, permissions: undefined } satisfies MePayload;
        return (await res.json()) as MePayload;
      })
      .then((data) => {
        if (!live) return;
        const decision = decideCrmxSession({
          authenticated: Boolean(data?.user),
          role: data?.user?.role ?? null,
        });
        if (!decision.allow) {
          router.push(decision.redirect);
          return;
        }
        const perms = data.permissions || {};
        const readOnly = Boolean(perms.crmReadOnly);
        setAccess({
          readOnly,
          canApprove: Boolean(perms.canApproveDeposits) && !readOnly,
          scoped: Boolean(perms.scoped),
          name: data.user?.name || "",
        });
        if (perms.scoped && !scopedCrmxPageAllowed(window.location.pathname)) {
          router.replace("/crmx/traders");
        }
        setReady(true);
      })
      .catch(() => {
        const decision = decideCrmxSession({ authenticated: false, role: null });
        if (!decision.allow) router.push(decision.redirect);
      });
    return () => {
      live = false;
    };
  }, [router]);

  useEffect(() => {
    if (access.scoped && !scopedCrmxPageAllowed(pathname)) router.replace("/crmx/traders");
  }, [access.scoped, pathname, router]);

  useEffect(() => {
    try {
      if (window.localStorage.getItem("crmx-nav") === "collapsed") setCollapsed(true);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPalette(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  const classics = useMemo(() => {
    const links = classicLinks();
    if (!access.scoped) return links;
    return links.filter((link) => scopedPageAllowed(link.href));
  }, [access.scoped]);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem("crmx-nav", next ? "collapsed" : "open");
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  if (!ready) {
    return (
      <div className="fx-crm fx-crmx" dir={dir} role="status">
        <p className="crmx-lead" style={{ padding: 24 }}>{t("crmx.loading")}</p>
      </div>
    );
  }

  const shellClass = `crmx-shell${collapsed ? " is-collapsed" : ""}${navOpen ? " is-nav-open" : ""}`;

  return (
    <CrmxAccessContext.Provider value={access}>
      <div className="fx-crm fx-crmx" dir={dir}>
        <a className="crmx-skip" href="#crmx-content">{t("crmx.skip")}</a>
        <div className={shellClass}>
          {navOpen ? <div className="crmx-backdrop" onClick={() => setNavOpen(false)} /> : null}
          <aside className="crmx-side" aria-label={t("crmx.primary")}>
            <div className="crmx-brand">
              <div className="crmx-mark">7F</div>
              <div className="crmx-brand-copy">
                <div className="crmx-brand-name">7FX</div>
                <div className="crmx-brand-sub">{t("crmx.brand")}</div>
              </div>
            </div>
            <nav className="crmx-nav">
              {CRMX_NAV.map((group) => (
                <div key={group.id} className="crmx-group">
                  <p className="crmx-group-label">{t(group.labelKey)}</p>
                  {group.items.map((item) => {
                    const active = crmxActive(pathname, item.href, item.exact);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`crmx-link${active ? " is-active" : ""}`}
                        aria-current={active ? "page" : undefined}
                        title={t(item.labelKey)}
                      >
                        <Icon name={item.icon} />
                        <span className="crmx-label">{t(item.labelKey)}</span>
                      </Link>
                    );
                  })}
                </div>
              ))}
              <div className="crmx-classic-block">
                <button
                  type="button"
                  className="crmx-group-label"
                  onClick={() => setClassicOpen((v) => !v)}
                  aria-expanded={classicOpen}
                  style={{ background: "transparent", border: 0, cursor: "pointer" }}
                >
                  {t("crmx.group.classic")} {classicOpen ? "▾" : "▸"}
                </button>
                {classicOpen ? (
                  <div className="crmx-classic-list">
                    {classics.map((link) => (
                      <Link key={link.href} href={link.href}>
                        {t(link.labelKey)}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            </nav>
            <div className="crmx-side-foot">
              <button
                type="button"
                className="crmx-link"
                onClick={toggleCollapsed}
                aria-pressed={collapsed}
                aria-label={collapsed ? t("crmx.expand") : t("crmx.collapse")}
              >
                <Icon name={collapsed ? "menu" : "close"} />
                <span className="crmx-label">{collapsed ? t("crmx.expand") : t("crmx.collapse")}</span>
              </button>
            </div>
          </aside>
          <div className="crmx-column">
            <header className="crmx-top">
              <button type="button" className="crmx-icon-btn crmx-menu-btn" aria-label={t("crmx.menu")} onClick={() => setNavOpen(true)}>
                <Icon name="menu" />
              </button>
              <button type="button" className="crmx-search" onClick={() => setPalette(true)}>
                <Icon name="search" />
                <span>{t("crmx.search")}</span>
                <kbd>Ctrl/⌘ K</kbd>
              </button>
              <div className="crmx-top-actions">
                {access.name ? <span className="crmx-name">{access.name}</span> : null}
                {access.readOnly ? <span className="crmx-ro">{t("crm.ui.readOnly")}</span> : null}
                <LanguageSwitcher compact tone="crm" />
                <ThemeToggle className="crmx-icon-btn" />
                <SignOutForm label={t("crm.signOut")} buttonClassName="crmx-text-btn" />
              </div>
            </header>
            <main id="crmx-content" className="crmx-main">{children}</main>
          </div>
        </div>
        {palette ? <CommandPalette readOnly={access.readOnly} onClose={() => setPalette(false)} /> : null}
      </div>
    </CrmxAccessContext.Provider>
  );
}
