import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Install 7FX on iPhone / iPad",
  description: "Add 7FX to your Home Screen for an app-like experience on iOS.",
};

export default function IosInstallPage() {
  return (
    <main className="min-h-screen bg-[#ffffff] text-[#111111]">
      <div className="mx-auto max-w-lg px-5 py-10 sm:py-14">
        <Link href="/" className="text-[13px] font-medium text-[#5c657a] hover:text-[#111111]">
          ← Back to 7FX
        </Link>
        <div className="mt-8 flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/apple-touch-icon.png" alt="" className="h-14 w-14 rounded-[14px] shadow" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Install on iOS</h1>
            <p className="mt-1 text-[14px] text-[#5c657a]">iPhone &amp; iPad · Safari · Add to Home Screen</p>
          </div>
        </div>

        <p className="mt-6 text-[15px] leading-relaxed text-[#5c657a]">
          7FX is available as a Progressive Web App (PWA). On iOS there is no App Store IPA
          in this build — use <strong className="text-[#111111]">Add to Home Screen</strong> for a
          full-screen, icon-on-home experience (same as a native install for web apps).
        </p>

        <ol className="mt-8 space-y-4">
          {[
            {
              n: "1",
              t: "Open in Safari",
              d: "Use Safari (not Chrome/in-app browsers). Open https://7fx.customer.org.tr",
            },
            {
              n: "2",
              t: "Tap Share",
              d: "Tap the Share button (square with ↑) in the Safari toolbar.",
            },
            {
              n: "3",
              t: "Add to Home Screen",
              d: "Scroll the sheet and tap “Add to Home Screen”, then Add. The 7FX icon appears on your Home Screen.",
            },
            {
              n: "4",
              t: "Launch like an app",
              d: "Open 7FX from the Home Screen — it runs standalone (no Safari chrome) and opens the trade terminal.",
            },
          ].map((s) => (
            <li
              key={s.n}
              className="flex gap-4 rounded-2xl border border-[rgba(16,20,37,0.08)] bg-white p-4 shadow-[0_8px_24px_rgba(16,20,37,0.04)]"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#111111] text-[13px] font-semibold text-white">
                {s.n}
              </span>
              <div>
                <p className="text-[15px] font-semibold text-[#111111]">{s.t}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-[#5c657a]">{s.d}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-8 rounded-2xl border border-[rgba(16,20,37,0.08)] bg-[#f7f8fa] p-4 text-[13px] leading-relaxed text-[#5c657a]">
          <p className="font-semibold text-[#111111]">Android?</p>
          <p className="mt-1">
            Download the APK from the landing page or{" "}
            <Link href="/apk" className="font-semibold text-[#111111] underline">
              /apk
            </Link>
            .
          </p>
          <p className="mt-3 font-semibold text-[#111111]">TestFlight / IPA</p>
          <p className="mt-1">
            A signed App Store / TestFlight build is not published for 7FX in this environment.
            PWA Home Screen install is the supported iOS path today.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/trade"
            className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-[#111111] px-6 text-[14px] font-semibold text-white"
          >
            Open trade terminal
          </Link>
          <Link
            href="/register"
            className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-[rgba(16,20,37,0.14)] px-6 text-[14px] font-semibold text-[#111111]"
          >
            Open account
          </Link>
        </div>
      </div>
    </main>
  );
}
