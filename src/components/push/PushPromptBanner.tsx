"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/context";

const KEY = "fx_push_prompt_v1";
const T: Record<string, { t: string; b: string; on: string; later: string; ios: string }> = {
  tr: { t: "Bildirimleri açın", b: "Destek ekibi yanıt verdiğinde telefonunuza anında bildirim gelsin.", on: "Bildirimleri aç", later: "Sonra", ios: "iPhone'da bildirim için: Paylaş › Ana Ekrana Ekle, ardından uygulamadan açın." },
  en: { t: "Turn on notifications", b: "Get an instant alert on your phone when support replies.", on: "Enable", later: "Later", ios: "On iPhone: Share › Add to Home Screen, then open from the icon to enable alerts." },
  ru: { t: "Включите уведомления", b: "Мгновенное уведомление, когда поддержка ответит.", on: "Включить", later: "Позже", ios: "На iPhone: Поделиться › На экран «Домой», затем откройте с иконки." },
  ar: { t: "فعّل الإشعارات", b: "احصل على تنبيه فوري عند رد فريق الدعم.", on: "تفعيل", later: "لاحقًا", ios: "على iPhone: مشاركة › إضافة إلى الشاشة الرئيسية ثم افتح من الأيقونة." },
  de: { t: "Benachrichtigungen aktivieren", b: "Sofortige Meldung aufs Handy, wenn der Support antwortet.", on: "Aktivieren", later: "Später", ios: "Auf dem iPhone: Teilen › Zum Home-Bildschirm, dann über das Symbol öffnen." },
};

function b64ToU8(b64: string) {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

export async function subscribePush(vapid: string) {
  const reg = await navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" });
  await navigator.serviceWorker.ready;
  const sub = (await reg.pushManager.getSubscription()) || (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToU8(vapid) }));
  await fetch("/api/notifications/push", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(sub.toJSON()) });
}

/** One-time in-app banner asking the customer to enable phone push (live-support replies). */
export default function PushPromptBanner() {
  const { locale } = useI18n();
  const L = T[locale] ?? T.en;
  const [mode, setMode] = useState<"" | "ask" | "ios">("");
  const [vapid, setVapid] = useState("");

  useEffect(() => {
    try { if (localStorage.getItem(KEY)) return; } catch { return; }
    const ua = navigator.userAgent;
    const ios = /iPhone|iPad|iPod/.test(ua);
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
    const supported = "Notification" in window && "serviceWorker" in navigator && "PushManager" in window;
    if (!supported) { if (ios && !standalone) setTimeout(() => setMode("ios"), 2500); return; }
    if (Notification.permission !== "default") return;
    fetch("/api/notifications", { cache: "no-store", credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.vapidPublicKey) { setVapid(d.vapidPublicKey); setTimeout(() => setMode("ask"), 2500); } })
      .catch(() => {});
  }, []);

  const dismiss = () => { try { localStorage.setItem(KEY, String(Date.now())); } catch {} setMode(""); };
  if (!mode) return null;
  return (
    <div className="fx-push-banner fixed inset-x-3 z-[150] mx-auto max-w-md rounded-2xl border border-[#c9a54a]/50 bg-[#0a0a0a] p-4 text-slate-100 shadow-2xl" style={{ top: "calc(env(safe-area-inset-top) + 12px)" }}>
      <div className="flex gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#b8923a] to-[#e0c27a] text-lg text-black">🔔</span>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold">{L.t}</div>
          <div className="mt-0.5 text-xs text-slate-400">{mode === "ios" ? L.ios : L.b}</div>
        </div>
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <button type="button" onClick={dismiss} className="min-h-[40px] rounded-lg px-4 text-xs text-slate-400">{L.later}</button>
        {mode === "ask" && (
          <button type="button" className="min-h-[40px] rounded-lg bg-gradient-to-r from-[#b8923a] to-[#e0c27a] px-4 text-xs font-semibold text-black"
            onClick={async () => { dismiss(); try { const p = await Notification.requestPermission(); if (p === "granted") await subscribePush(vapid); } catch {} }}>
            {L.on}
          </button>
        )}
      </div>
    </div>
  );
}
