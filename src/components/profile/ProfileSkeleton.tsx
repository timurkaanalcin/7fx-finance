"use client";

import Skeleton from "@/components/ui/Skeleton";
import { useI18n } from "@/lib/i18n/context";

/** Same header and card stack the profile page uses once the account arrives. */
export default function ProfileSkeleton() {
  const { t } = useI18n();
  return (
    <div className="fx-profile min-h-screen bg-desk-bg" data-fx-profile-skeleton="" aria-busy="true" role="status">
      <span className="sr-only">{t("term.profile.loading")}</span>
      <header className="sticky top-0 z-30 flex min-h-12 items-center gap-3 border-b border-desk-border bg-desk-panel px-4" style={{ paddingTop: "env(safe-area-inset-top)", minHeight: "calc(3rem + env(safe-area-inset-top))" }}>
        <Skeleton className="h-7 w-7 rounded-md" />
        <Skeleton className="h-3 w-36" />
        <Skeleton className="ml-auto h-7 w-20" />
      </header>
      <main className="mx-auto max-w-2xl p-4 md:p-6">
        <Skeleton className="mb-4 h-24 w-full rounded-xl" />
        <Skeleton className="mb-4 h-14 w-full rounded-xl" />
        <Skeleton className="mb-4 h-14 w-full rounded-xl" />
        <Skeleton className="mb-4 h-28 w-full rounded-xl" />
        <div className="mb-4 grid grid-cols-2 gap-2">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-40 w-full rounded-xl" />
      </main>
    </div>
  );
}
