"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getSeenDocs, markDocsSeen } from "@/lib/docs-seen";
import { useI18n } from "@/lib/i18n/context";
import ProtectedAttachmentViewer from "@/components/chat/ProtectedAttachmentViewer";
import { DeskRetry, DeskSkeleton } from "@/components/system/PanelState";
import ThemeToggle from "@/components/theme/ThemeToggle";

type Doc = { id: string; title: string; kind: "pdf" | "image"; size: number; createdAt: string };

/** Customer "Evraklar": view-only list; opens in the direct document viewer (scroll + zoom). */
export default function DocumentsPage() {
  const { t, locale } = useI18n();
  const [docs, setDocs] = useState<Doc[] | null>(null);
  const [docsError, setDocsError] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const [q, setQ] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [moreBusy, setMoreBusy] = useState(false);
  const docsRef = useRef<Doc[]>([]);

  useEffect(() => setSeen(getSeenDocs()), []);

  const openDoc = (id: string) => {
    setOpen(id);
    setSeen(new Set(markDocsSeen([id])));
  };

  const shown = useMemo(() => {
    const term = q.trim().toLocaleLowerCase(locale);
    if (!docs || !term) return docs;
    return docs.filter((d) => d.title.toLocaleLowerCase(locale).includes(term));
  }, [docs, q, locale]);
  const unseen = (docs || []).filter((d) => !seen.has(d.id)).length;

  const load = useCallback(async (mode: "replace" | "more" = "replace") => {
    const skip = mode === "more" ? docsRef.current.length : 0;
    if (mode === "more") setMoreBusy(true);
    try {
      const params = new URLSearchParams({ take: "50", skip: String(skip) });
      const r = await fetch(`/api/documents?${params}`, { cache: "no-store", credentials: "include" });
      if (!r.ok) {
        if (mode === "replace") {
          setDocsError(true);
          setDocs([]);
        }
        return;
      }
      setDocsError(false);
      const data = await r.json();
      const incoming: Doc[] = data.documents || [];
      const seenIds = new Set(docsRef.current.map((d) => d.id));
      const next = mode === "more" ? docsRef.current.concat(incoming.filter((d) => !seenIds.has(d.id))) : incoming;
      docsRef.current = next;
      setDocs(next);
      setHasMore(Boolean(data.hasMore));
    } catch {
      if (mode === "replace") {
        setDocsError(true);
        setDocs([]);
      }
    } finally {
      if (mode === "more") setMoreBusy(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="fx-profile min-h-screen bg-[#000000] text-slate-100">
      <header className="sticky top-0 z-30 flex min-h-12 items-center gap-3 border-b border-[#2a2a2a] bg-[#0a0a0a] px-4" style={{ paddingTop: "env(safe-area-inset-top)", minHeight: "calc(3rem + env(safe-area-inset-top))" }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- static bitmap; next/image would change this layout */}
        <img src="/icons/v3/icon-64.png" alt="" className="h-7 w-7 rounded-md object-cover ring-1 ring-[#2a2a2a]" />
        <span className="min-w-0 truncate text-sm font-medium">{t("docs.title")}</span>
        <Link href="/profile" className="ml-auto inline-flex min-h-11 items-center rounded-md bg-[#2a2a2a] px-3 text-xs hover:bg-[#1f1f1f]">
          <span className="fx-rtl-flip" aria-hidden="true">←</span> {t("docs.back")}
        </Link>
        <ThemeToggle />
      </header>
      <main className="mx-auto max-w-2xl p-4 pb-10 md:p-6">
        <p className="mb-4 text-xs text-slate-500">{t("docs.subtitle")}</p>
        {docs && docs.length > 0 && (unseen > 0 || docs.length > 4) && (
          <div className="mb-3 flex items-center gap-2">
            {docs.length > 4 && (
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === "Escape" && setQ("")}
                placeholder={t("docs.search")}
                aria-label={t("docs.search")}
                className="min-h-11 min-w-0 flex-1 rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] px-3 text-base text-slate-100 placeholder:text-slate-500"
              />
            )}
            {unseen > 0 && (
              <button
                type="button"
                onClick={() => setSeen(new Set(markDocsSeen(docs.map((d) => d.id))))}
                className="ml-auto inline-flex min-h-11 shrink-0 items-center rounded-md bg-[#2a2a2a] px-3 text-xs text-slate-200 hover:bg-[#1f1f1f]"
              >
                {t("docs.markAll")} ({unseen})
              </button>
            )}
          </div>
        )}
        {docs === null ? (
          <DeskSkeleton label={t("state.loading")} />
        ) : docsError ? (
          <DeskRetry title={t("state.docsFailed")} retry={t("state.retry")} onRetry={() => void load()} />
        ) : docs.length === 0 ? (
          <div className="rounded-xl border border-[#2a2a2a] bg-[#0a0a0a] p-8 text-center text-sm text-slate-500">{t("docs.empty")}</div>
        ) : shown && shown.length === 0 ? (
          <p className="p-6 text-center text-sm text-slate-500">{t("docs.noMatch")}</p>
        ) : (
          <ul className="space-y-3">
            {(shown || []).map((d) => (
              <li key={d.id} className="flex items-stretch gap-2">
                <button
                  type="button"
                  onClick={() => openDoc(d.id)}
                  className="flex min-h-[64px] min-w-0 flex-1 items-center gap-3 rounded-xl border border-[#2a2a2a] bg-[#0a0a0a] px-4 py-3 text-left"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#1f1f1f] text-[10px] font-bold uppercase tracking-wider text-slate-300">
                    {d.kind === "pdf" ? "PDF" : "IMG"}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold text-slate-100">{d.title}</span>
                      {!seen.has(d.id) && (
                        <span className="shrink-0 rounded-full bg-[#c9a54a] px-1.5 py-0.5 text-[10px] font-bold uppercase leading-none text-black">
                          {t("docs.new")}
                        </span>
                      )}
                    </span>
                    <span className="block text-xs text-slate-500">
                      {new Date(d.createdAt).toLocaleDateString(locale)} · {Math.max(1, Math.round(d.size / 1024))} KB
                    </span>
                  </span>
                  <span className="shrink-0 text-xs font-semibold text-slate-300">{t("docs.view")} ›</span>
                </button>
                <a
                  href={`/api/documents/${d.id}/download`}
                  download
                  aria-label={t("docs.download")}
                  className="flex min-h-[64px] shrink-0 flex-col items-center justify-center rounded-xl border border-[#c9a54a]/50 bg-[#0a0a0a] px-3 text-xs font-semibold text-[#c9a54a] no-underline"
                >
                  <span aria-hidden className="text-base leading-none">⬇</span>
                  <span className="mt-1">{t("docs.download")}</span>
                </a>
              </li>
            ))}
          </ul>
        )}
        {hasMore && (
          <button
            type="button"
            disabled={moreBusy}
            onClick={() => void load("more")}
            className="mt-3 w-full rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] px-3 py-2 text-sm font-medium text-slate-200 hover:bg-[#1f1f1f] disabled:opacity-50"
          >
            {moreBusy ? "…" : t("term.loadMore")}
          </button>
        )}
      </main>
      {open && (
        <ProtectedAttachmentViewer
          attId={open}
          apiBase="/api/documents"
          downloadHref={`/api/documents/${open}/download`}
          onClose={() => setOpen(null)}
          labels={{
            loading: t("profile.support.attLoading"),
            failed: t("profile.support.attFailed"),
            close: t("profile.support.close"),
            download: t("docs.download"),
            hold: t("profile.support.holdToView"),
          }}
        />
      )}
    </div>
  );
}
