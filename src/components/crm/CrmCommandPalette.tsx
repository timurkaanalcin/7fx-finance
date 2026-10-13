"use client";

/**
 * CRM quick jump (Ctrl/⌘+K): search CRM pages and customers (name / login id / phone)
 * and open them with the keyboard. Recent pages are kept per-device (paths only —
 * no customer data is stored locally). Read-only viewers get page search only.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CRM_NAV_GROUPS } from "@/lib/crm-nav";
import { useI18n } from "@/lib/i18n/context";

type Item = { kind: "page" | "client"; href: string; title: string; sub?: string };

const RECENT_KEY = "fx-crm-recent-pages";

function fold(s: string) {
  return s
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i");
}

export default function CrmCommandPalette({ readOnly }: { readOnly?: boolean }) {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const [clients, setClients] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const pages = useMemo(
    () =>
      CRM_NAV_GROUPS.flatMap((g) =>
        g.items.map((n) => ({ kind: "page" as const, href: n.href, title: t(n.labelKey), sub: t(g.labelKey) })),
      ),
    [t],
  );

  // Track recently visited CRM pages (paths only).
  useEffect(() => {
    if (!pathname) return;
    const page = pages.find((p) => (p.href === "/izcrm" ? pathname === "/izcrm" : pathname.startsWith(p.href)));
    if (!page) return;
    try {
      const prev: string[] = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
      const next = [page.href, ...prev.filter((h) => h !== page.href)].slice(0, 5);
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      setRecent(next);
    } catch {
      /* ignore */
    }
  }, [pathname, pages]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && !e.altKey && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    function onOpen() {
      setOpen(true);
    }
    document.addEventListener("keydown", onKey);
    window.addEventListener("fx-crm-palette", onOpen);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("fx-crm-palette", onOpen);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setQ("");
      setSel(0);
      setClients([]);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  // Customer search (debounced) — not for read-only viewers.
  useEffect(() => {
    if (!open || readOnly) return;
    const term = q.trim();
    if (term.length < 2) {
      setClients([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await fetch(`/api/admin/clients?role=TRADER&q=${encodeURIComponent(term)}`);
        const d = r.ok ? await r.json() : { clients: [] };
        if (cancelled) return;
        setClients(
          (d.clients || []).slice(0, 8).map((c: { id: string; name?: string; accountLoginId?: string | null }) => ({
            kind: "client" as const,
            href: `/izcrm/traders/${c.id}`,
            title: c.name || "—",
            sub: c.accountLoginId ? `ID ${c.accountLoginId}` : undefined,
          })),
        );
      } catch {
        if (!cancelled) setClients([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 220);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [q, open, readOnly]);

  const pageResults = useMemo(() => {
    const term = fold(q.trim());
    if (!term) {
      const rec = recent.map((h) => pages.find((p) => p.href === h)).filter(Boolean) as Item[];
      const rest = pages.filter((p) => !recent.includes(p.href));
      return [...rec, ...rest];
    }
    return pages.filter((p) => fold(p.title).includes(term) || fold(p.sub || "").includes(term));
  }, [q, pages, recent]);

  const items: Item[] = useMemo(() => [...clients, ...pageResults], [clients, pageResults]);

  useEffect(() => {
    if (sel >= items.length) setSel(Math.max(0, items.length - 1));
  }, [items.length, sel]);

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${sel}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [sel]);

  function go(it: Item | undefined) {
    if (!it) return;
    setOpen(false);
    router.push(it.href);
  }

  if (!open) return null;

  const recentSet = new Set(recent);

  return (
    <div
      className="fixed inset-0 z-[90] flex items-start justify-center bg-black/30 px-3 pt-[12vh]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
      role="dialog"
      aria-modal="true"
      aria-label={t("crm.palette.title")}
    >
      <div className="w-full max-w-[520px] overflow-hidden rounded-lg border border-black/10 bg-white text-black shadow-2xl">
        <div className="flex items-center gap-2 border-b border-black/10 px-3">
          <span className="text-neutral-400" aria-hidden>⌕</span>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setSel(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setSel((s) => Math.min(items.length - 1, s + 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setSel((s) => Math.max(0, s - 1));
              } else if (e.key === "Enter") {
                e.preventDefault();
                go(items[sel]);
              } else if (e.key === "Escape") {
                e.preventDefault();
                setOpen(false);
              }
            }}
            placeholder={readOnly ? t("crm.palette.phPages") : t("crm.palette.ph")}
            className="h-11 w-full bg-transparent text-[13px] outline-none placeholder:text-neutral-400"
            aria-label={t("crm.palette.title")}
          />
          {loading && <span className="text-[10px] text-neutral-400">…</span>}
          <kbd className="rounded border border-black/10 px-1.5 py-0.5 text-[9px] text-neutral-500">Esc</kbd>
        </div>
        <div ref={listRef} className="max-h-[50vh] overflow-y-auto py-1" role="listbox">
          {items.length === 0 ? (
            <div className="px-3 py-6 text-center text-[12px] text-neutral-500">{t("crm.palette.empty")}</div>
          ) : (
            items.map((it, i) => {
              const showHeader =
                i === 0 || items[i - 1].kind !== it.kind;
              return (
                <div key={it.kind + it.href}>
                  {showHeader && (
                    <div className="px-3 pb-0.5 pt-2 text-[9px] font-semibold uppercase tracking-wider text-neutral-400">
                      {it.kind === "client"
                        ? t("crm.palette.clients")
                        : !q.trim() && recent.length
                          ? t("crm.palette.recentAndPages")
                          : t("crm.palette.pages")}
                    </div>
                  )}
                  <button
                    type="button"
                    data-idx={i}
                    role="option"
                    aria-selected={i === sel}
                    onMouseEnter={() => setSel(i)}
                    onClick={() => go(it)}
                    className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-[12px] ${
                      i === sel ? "bg-black text-white" : "text-black hover:bg-neutral-100"
                    }`}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span className={i === sel ? "text-white/60" : "text-neutral-400"} aria-hidden>
                        {it.kind === "client" ? "👤" : !q.trim() && recentSet.has(it.href) ? "↺" : "▸"}
                      </span>
                      <span className="truncate font-medium">{it.title}</span>
                    </span>
                    {it.sub && (
                      <span className={`shrink-0 text-[10px] ${i === sel ? "text-white/70" : "text-neutral-400"}`}>{it.sub}</span>
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>
        <div className="flex items-center justify-between border-t border-black/10 px-3 py-1.5 text-[10px] text-neutral-500">
          <span>↑↓ {t("crm.palette.move")} · Enter {t("crm.palette.open")}</span>
          <span>Ctrl/⌘ + K</span>
        </div>
      </div>
    </div>
  );
}
