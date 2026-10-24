"use client";

import Image from "next/image";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";

export default function IosInstallPage() {
  const { t } = useI18n();
  const steps = [
    { n: "1", title: t("landing.ios.safariTitle"), body: t("landing.ios.safariBody") },
    { n: "2", title: t("landing.ios.step1Title"), body: t("landing.ios.step1Body") },
    { n: "3", title: t("landing.ios.step2Title"), body: t("landing.ios.step2Body") },
    { n: "4", title: t("landing.ios.step3Title"), body: t("landing.ios.step3Body") },
  ];

  return (
    <main className="fx-ios min-h-screen">
      <div className="fx-ios-shell px-1 py-8 sm:py-14">
        <Link href="/" className="fx-ios-back inline-flex items-center text-sm font-medium text-[#9aa3b5] hover:text-white">
          ← {t("landing.ios.back")}
        </Link>
        <div className="mt-8 flex items-center gap-3">
          <Image
            src="/icons/v3/apple-touch-icon.png"
            alt="7FX"
            width={56}
            height={56}
            priority
            className="h-14 w-14 rounded-[14px] shadow"
          />
          <div>
            <h1 className="fx-ios-title font-semibold">{t("landing.ios.pageTitle")}</h1>
            <p className="mt-1 text-[14px] text-[#9aa3b5]">{t("landing.ios.devices")}</p>
          </div>
        </div>

        <p className="mt-6 text-[15px] leading-relaxed text-[#9aa3b5]">{t("landing.ios.lead")}</p>

        <ol className="mt-8 space-y-3">
          {steps.map((s) => (
            <li key={s.n} className="fx-ios-step">
              <span>{s.n}</span>
              <div>
                <p>{s.title}</p>
                <p>{s.body}</p>
                {s.n === "2" && (
                  <div className="fx-ios-share" aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M12 16V4M12 4l-4.5 4.5M12 4l4.5 4.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M6 11v7.5A1.5 1.5 0 0 0 7.5 20h9a1.5 1.5 0 0 0 1.5-1.5V11" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                    </svg>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>

        <div className="fx-ios-note">
          <p>{t("landing.ios.androidQ")}</p>
          <p>
            {t("landing.ios.androidBody")}{" "}
            <Link href="/apk">{t("landing.ios.androidLink")}</Link>.
          </p>
          <p className="mt-3">{t("landing.ios.tfTitle")}</p>
          <p>{t("landing.ios.tfBody")}</p>
        </div>

        <div className="fx-cta-row mt-8">
          <Link href="/trade" className="fx-btn-primary inline-flex min-h-12 items-center justify-center rounded-full px-6 text-[14px] font-semibold">
            {t("landing.ios.openTerminal")}
          </Link>
          <Link href="/register" className="fx-btn-secondary inline-flex min-h-12 items-center justify-center rounded-full px-6 text-[14px] font-semibold">
            {t("landing.openAccount")}
          </Link>
        </div>
      </div>
    </main>
  );
}
