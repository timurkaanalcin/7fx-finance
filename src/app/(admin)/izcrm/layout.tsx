"use client";

import "../../globals.css";
import SignOutForm from "@/components/auth/SignOutForm";
import NotificationBell from "@/components/notifications/NotificationBell";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CRM_NAV_GROUPS as ALL_NAV_GROUPS } from "@/lib/crm-nav";
import { scopedPageAllowed } from "@/lib/crm-scope-pages";
import CrmI18n from "@/components/i18n/CrmI18n";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import SymbolCatalogSync from "@/components/trading/SymbolCatalogSync";
import { useI18n } from "@/lib/i18n/context";
import CrmSecurityShell from "@/components/crm/CrmSecurityShell";
import { CrmShellSkeleton } from "@/components/crm/CrmStates";
import CrmCommandPalette from "@/components/crm/CrmCommandPalette";
import CrmShortcuts from "@/components/crm/CrmShortcuts";

function AdminChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t, dir } = useI18n();
  const [ready, setReady] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [adminId, setAdminId] = useState("");
  const [perms, setPerms] = useState<Record<string, boolean>>({});
  const readOnly = Boolean(perms.crmReadOnly);
  const CRM_NAV_GROUPS = useMemo(
    () =>
      perms.scoped
        ? ALL_NAV_GROUPS.map((g) => ({ ...g, items: g.items.filter((n) => scopedPageAllowed(n.href)) })).filter((g) => g.items.length)
        : ALL_NAV_GROUPS,
    [perms.scoped]
  );
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    main: true,
    ops: true,
    comms: false,
    analytics: false,
  });

  useEffect(() => {
    fetch("/api/auth/me?scope=admin")
      .then(async (r) => {
        if (r.status === 401) {
          router.push("/login");
          return null;
        }
        return r.json();
      })
      .then((d) => {
        if (!d) return;
        if (d.user?.role !== "ADMIN") {
          router.push("/trade");
          return;
        }
        setName(d.user.name || "Admin");
        setEmail(d.user.email || "");
        setAdminId(d.user.id || "");
        setPerms(d.permissions || {});
        if (d.permissions?.scoped && !scopedPageAllowed(window.location.pathname)) {
          router.replace("/izcrm/traders");
        }
        setReady(true);
      })
      .catch(() => router.push("/login"));
  }, [router]);

  useEffect(() => {
    if (perms.scoped && pathname && !scopedPageAllowed(pathname)) router.replace("/izcrm/traders");
  }, [perms.scoped, pathname, router]);

  useEffect(() => {
    for (const g of CRM_NAV_GROUPS) {
      if (g.items.some((n) => (n.exact ? pathname === n.href : pathname?.startsWith(n.href)))) {
        setOpenGroups((prev) => ({ ...prev, [g.id]: true }));
      }
    }
  }, [pathname, CRM_NAV_GROUPS]);

  if (!ready) {
    return <CrmShellSkeleton label={t("crm.loading")} />;
  }

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    if (href === "/izcrm") return pathname === "/izcrm";
    return pathname?.startsWith(href);
  }

  const flatMobile = CRM_NAV_GROUPS.flatMap((g) => g.items);

  return (
    <CrmSecurityShell adminName={name} adminEmail={email} adminId={adminId} readOnly={readOnly}>
    <div className="fx-crm fx-crm-root flex min-h-screen bg-white text-black" dir={dir}>
      <aside className="hidden w-[200px] shrink-0 flex-col border-r border-black/10 bg-white text-black md:flex">
        <div className="flex h-11 items-center gap-2 border-b border-black/10 px-3">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-black text-[10px] font-bold tracking-tight text-white">
            7FX
          </div>
          <div className="min-w-0">
            <div className="truncate text-[12px] font-bold leading-tight text-black">{t("crm.desk")}</div>
            <div className="text-[9px] uppercase tracking-wider text-neutral-500">{t("crm.brokerCrm")}</div>
          </div>
        </div>
        <nav className="flex-1 space-y-3 overflow-y-auto p-2 text-[11px]">
          {CRM_NAV_GROUPS.map((g) => (
            <div key={g.id}>
              <button
                type="button"
                onClick={() => setOpenGroups((p) => ({ ...p, [g.id]: !p[g.id] }))}
                aria-expanded={Boolean(openGroups[g.id])}
                className="mb-0.5 flex w-full items-center justify-between px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-neutral-500 hover:text-neutral-700"
              >
                {t(g.labelKey)}
                <span className="text-neutral-400">{openGroups[g.id] ? "▾" : "▸"}</span>
              </button>
              {openGroups[g.id] && (
                <div className="space-y-0.5">
                  {g.items.map((n) => {
                    const active = isActive(n.href, n.exact);
                    const className = `block rounded px-2.5 py-1.5 font-medium transition ${
                      active
                        ? "bg-black text-white"
                        : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
                    }`;
                    if (n.document) {
                      return (
                        <a key={n.href} href={n.href} className={className}>
                          {t(n.labelKey)}
                        </a>
                      );
                    }
                    return (
                      <Link key={n.href} href={n.href} className={className}>
                        {t(n.labelKey)}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </nav>
        <div className="border-t border-neutral-200 p-2.5 text-[9px] text-neutral-500">
          <div className="mb-1 font-medium text-neutral-500">{t("crm.permissions")}</div>
          {Object.entries(perms)
            .filter(([k]) => k.startsWith("can"))
            .map(([k, v]) => {
              const permKey =
                k === "canManageUsers"
                  ? "crm.perm.users"
                  : k === "canApproveDeposits"
                    ? "crm.perm.deposits"
                    : k === "canEditRates"
                      ? "crm.perm.rates"
                      : k === "canManageMethods"
                        ? "crm.perm.methods"
                        : k === "canAdjustBalance"
                          ? "crm.perm.balance"
                          : "";
              const label = permKey ? t(permKey) : k.replace("can", "");
              return (
              <div key={k} className="flex justify-between gap-1 py-0.5">
                <span className="truncate">{label}</span>
                <span className={v ? "text-[#26a69a]" : "text-[#ef5350]"}>{v ? "✓" : "✗"}</span>
              </div>
              );
            })}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col bg-white">
        <header className="flex h-11 items-center gap-2 border-b border-black/10 bg-white px-3">
          <div className="fx-crm-mobile-nav flex max-w-[50%] gap-1 overflow-x-auto md:hidden">
            {[...flatMobile.filter((n) => !n.document).slice(0, 8), ...flatMobile.filter((n) => n.document)].map((n) => {
              const className = `whitespace-nowrap rounded px-2 py-1 text-[10px] ${
                isActive(n.href, n.exact) ? "bg-black text-white" : "bg-neutral-100 text-black"
              }`;
              if (n.document) {
                return (
                  <a key={n.href} href={n.href} className={className}>
                    {t(n.labelKey)}
                  </a>
                );
              }
              return (
                <Link key={n.href} href={n.href} className={className}>
                  {t(n.labelKey)}
                </Link>
              );
            })}
          </div>
          <div className="fx-crm-actions ml-auto flex items-center gap-2 text-[11px] text-neutral-500">
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event("fx-crm-palette"))}
              className="flex items-center gap-1.5 rounded border border-black/10 px-2 py-1 text-neutral-500 hover:bg-neutral-100 hover:text-black"
              aria-label={t("crm.palette.title")}
              title={`${t("crm.palette.title")} (Ctrl/⌘ + K)`}
            >
              <span aria-hidden>⌕</span>
              <span className="hidden sm:inline">{t("crm.palette.search")}</span>
              <kbd className="hidden rounded bg-neutral-100 px-1 text-[9px] text-neutral-500 lg:inline">⌘K</kbd>
            </button>
            <NotificationBell enableButton liveAlerts pollMs={5000} />
            <LanguageSwitcher compact tone="crm" />
            <CrmShortcuts />
            <span className="hidden sm:inline">{name}{readOnly ? (
            <span className="ml-1 rounded bg-amber-50 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-amber-700">{t("crm.ui.readOnly")}</span>
          ) : null}</span>
            <Link
              href="/trade"
              className="rounded bg-neutral-100 px-2 py-1 hover:bg-neutral-100 hover:text-black"
            >
              {t("crm.terminal")}
            </Link>
            <SignOutForm
              label={t("crm.signOut")}
              buttonClassName="rounded px-2 py-1 hover:bg-neutral-100 hover:text-black"
            />
          </div>
        </header>
        <main className="flex-1 overflow-auto bg-white p-3 md:p-4">{children}</main>
        <CrmCommandPalette readOnly={readOnly} />
      </div>
    </div>
    </CrmSecurityShell>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <CrmI18n>
      <SymbolCatalogSync />
      <AdminChrome>{children}</AdminChrome>
    </CrmI18n>
  );
}
