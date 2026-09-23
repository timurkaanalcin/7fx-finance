"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CRM_NAV_GROUPS } from "@/lib/crm-nav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [name, setName] = useState("");
  const [perms, setPerms] = useState<Record<string, boolean>>({});
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    main: true,
    ops: true,
    comms: false,
    analytics: false,
  });

  useEffect(() => {
    fetch("/api/auth/me")
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
        setPerms(d.permissions || {});
        setReady(true);
      })
      .catch(() => router.push("/login"));
  }, [router]);

  useEffect(() => {
    // Auto-expand group containing active route
    for (const g of CRM_NAV_GROUPS) {
      if (g.items.some((n) => (n.exact ? pathname === n.href : pathname?.startsWith(n.href)))) {
        setOpenGroups((prev) => ({ ...prev, [g.id]: true }));
      }
    }
  }, [pathname]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070b14] text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
          <span className="text-sm">CRM yükleniyor…</span>
        </div>
      </div>
    );
  }

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    if (href === "/admin") return pathname === "/admin";
    return pathname?.startsWith(href);
  }

  const flatMobile = CRM_NAV_GROUPS.flatMap((g) => g.items);

  return (
    <div className="flex min-h-screen bg-[#070b14] text-slate-100">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-800/80 bg-[#0a1020] md:flex">
        <div className="flex h-12 items-center gap-2 border-b border-slate-800/80 px-3">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-sky-600 text-[10px] font-bold tracking-tight">
            M1
          </div>
          <div className="min-w-0">
            <div className="truncate text-xs font-semibold leading-tight">M1 Finance</div>
            <div className="text-[9px] uppercase tracking-wider text-slate-500">Desk CRM</div>
          </div>
        </div>
        <nav className="flex-1 space-y-3 overflow-y-auto p-2 text-[11px]">
          {CRM_NAV_GROUPS.map((g) => (
            <div key={g.id}>
              <button
                type="button"
                onClick={() => setOpenGroups((p) => ({ ...p, [g.id]: !p[g.id] }))}
                className="mb-0.5 flex w-full items-center justify-between px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-300"
              >
                {g.label}
                <span className="text-slate-600">{openGroups[g.id] ? "▾" : "▸"}</span>
              </button>
              {openGroups[g.id] && (
                <div className="space-y-0.5">
                  {g.items.map((n) => {
                    const active = isActive(n.href, n.exact);
                    return (
                      <Link
                        key={n.href}
                        href={n.href}
                        className={`block rounded px-2.5 py-1.5 font-medium transition ${
                          active
                            ? "bg-sky-600/90 text-white"
                            : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-100"
                        }`}
                      >
                        {n.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </nav>
        <div className="border-t border-slate-800/80 p-2.5 text-[9px] text-slate-500">
          <div className="mb-1 font-medium text-slate-400">Yetkiler</div>
          {Object.entries(perms)
            .filter(([k]) => k.startsWith("can"))
            .map(([k, v]) => (
              <div key={k} className="flex justify-between gap-1 py-0.5">
                <span className="truncate">{k.replace("can", "")}</span>
                <span className={v ? "text-emerald-400" : "text-red-400"}>{v ? "✓" : "✗"}</span>
              </div>
            ))}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-12 items-center gap-2 border-b border-slate-800/80 bg-[#0a1020] px-3">
          <div className="flex max-w-[60%] gap-1 overflow-x-auto md:hidden">
            {flatMobile.slice(0, 8).map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={`whitespace-nowrap rounded px-2 py-1 text-[10px] ${
                  isActive(n.href, n.exact) ? "bg-sky-600" : "bg-slate-800"
                }`}
              >
                {n.label}
              </Link>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2 text-[11px] text-slate-400">
            <span className="hidden sm:inline">{name}</span>
            <Link
              href="/trade"
              className="rounded bg-slate-800 px-2 py-1 hover:bg-slate-700 hover:text-white"
            >
              Terminal
            </Link>
            <button
              onClick={async () => {
                await fetch("/api/auth/logout", { method: "POST" });
                router.push("/login");
              }}
              className="rounded px-2 py-1 hover:bg-slate-700 hover:text-white"
            >
              Çıkış
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-3 md:p-4">{children}</main>
      </div>
    </div>
  );
}
