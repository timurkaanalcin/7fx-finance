"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import ProtectedAttachmentViewer from "@/components/chat/ProtectedAttachmentViewer";
import ThemeToggle from "@/components/theme/ThemeToggle";

type Doc = { id: string; title: string; kind: "pdf" | "image"; size: number; createdAt: string };

/** Customer "Evraklar": view-only list; opens in the protected (hold-to-reveal, watermarked) viewer. */
export default function DocumentsPage() {
  const { t, locale } = useI18n();
  const [docs, setDocs] = useState<Doc[] | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/documents", { cache: "no-store", credentials: "include" })
      .then((r) => (r.ok ? r.json() : { documents: [] }))
      .then((d) => setDocs(d.documents || []))
      .catch(() => setDocs([]));
  }, []);

  return (
    <div className="fx-profile min-h-screen bg-[#000000] text-slate-100">
      <header className="sticky top-0 z-30 flex h-12 items-center gap-3 border-b border-[#2a2a2a] bg-[#0a0a0a] px-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/v3/icon-192.png" alt="" className="h-7 w-7 rounded-md object-cover ring-1 ring-[#2a2a2a]" />
        <span className="text-sm font-semibold">{t("docs.title")}</span>
        <Link href="/profile" className="ml-auto rounded-md bg-[#2a2a2a] px-2.5 py-1.5 text-xs hover:bg-[#1f1f1f]">
          ← {t("docs.back")}
        </Link>
        <ThemeToggle />
      </header>
      <main className="mx-auto max-w-2xl p-4 pb-10 md:p-6">
        <p className="mb-4 text-xs text-slate-500">{t("docs.subtitle")}</p>
        {docs === null ? (
          <p className="p-6 text-center text-sm text-slate-500">…</p>
        ) : docs.length === 0 ? (
          <div className="rounded-xl border border-[#2a2a2a] bg-[#0a0a0a] p-8 text-center text-sm text-slate-500">{t("docs.empty")}</div>
        ) : (
          <ul className="space-y-3">
            {docs.map((d) => (
              <li key={d.id}>
                <button
                  type="button"
                  onClick={() => setOpen(d.id)}
                  className="flex min-h-[64px] w-full items-center gap-3 rounded-xl border border-[#2a2a2a] bg-[#0a0a0a] px-4 py-3 text-left"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#1f1f1f] text-[10px] font-bold uppercase tracking-wider text-slate-300">
                    {d.kind === "pdf" ? "PDF" : "IMG"}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-slate-100">{d.title}</span>
                    <span className="block text-xs text-slate-500">
                      {new Date(d.createdAt).toLocaleDateString(locale)} · {Math.max(1, Math.round(d.size / 1024))} KB
                    </span>
                  </span>
                  <span className="shrink-0 text-xs font-semibold text-slate-300">{t("docs.view")} ›</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>
      {open && (
        <ProtectedAttachmentViewer
          attId={open}
          apiBase="/api/documents"
          onClose={() => setOpen(null)}
          labels={{
            loading: t("profile.support.attLoading"),
            failed: t("profile.support.attFailed"),
            close: t("profile.support.close"),
            hold: t("profile.support.holdToView"),
          }}
        />
      )}
    </div>
  );
}
