import type { Locale } from "../locales";
import type { Dict } from "../types";

/** Terminal price-feed strings. Kept with the public dictionaries so the trade page does not pull CRM copy. */
export const FEED_UI: Record<Locale, Dict> = {
  en: {
    "term.feed.live": "Live",
    "term.feed.short.stale": "Reconnecting…",
    "term.feed.short.offline": "Offline",
    "term.feed.stale": "Price feed delayed — reconnecting…",
    "term.feed.offline":
      "No internet connection — prices are not updating (last known prices shown)",
    "term.feed.lastUpdate": "last update {s}s ago",
    "term.feed.retry": "Retry",
    "term.feed.recovered": "Connection restored — prices are live",
    "term.feed.dismiss": "Dismiss",
  },
  tr: {
    "term.feed.live": "Canlı",
    "term.feed.short.stale": "Yeniden bağlanıyor…",
    "term.feed.short.offline": "Çevrimdışı",
    "term.feed.stale": "Fiyat akışı gecikiyor — yeniden bağlanılıyor…",
    "term.feed.offline":
      "İnternet bağlantısı yok — fiyatlar güncellenmiyor (son bilinen fiyatlar gösteriliyor)",
    "term.feed.lastUpdate": "son güncelleme {s} sn önce",
    "term.feed.retry": "Yeniden dene",
    "term.feed.recovered": "Bağlantı yeniden kuruldu — fiyatlar canlı",
    "term.feed.dismiss": "Kapat",
  },
  ru: {
    "term.feed.live": "Онлайн",
    "term.feed.short.stale": "Переподключение…",
    "term.feed.short.offline": "Офлайн",
    "term.feed.stale": "Котировки задерживаются — переподключение…",
    "term.feed.offline":
      "Нет подключения к интернету — котировки не обновляются (показаны последние)",
    "term.feed.lastUpdate": "обновлено {s} с назад",
    "term.feed.retry": "Повторить",
    "term.feed.recovered": "Соединение восстановлено — котировки онлайн",
    "term.feed.dismiss": "Закрыть",
  },
  de: {
    "term.feed.live": "Live",
    "term.feed.short.stale": "Verbinde neu…",
    "term.feed.short.offline": "Offline",
    "term.feed.stale": "Kursdaten verzögert — verbinde neu…",
    "term.feed.offline":
      "Keine Internetverbindung — Kurse werden nicht aktualisiert (letzte bekannte Kurse)",
    "term.feed.lastUpdate": "zuletzt vor {s} s",
    "term.feed.retry": "Erneut versuchen",
    "term.feed.recovered": "Verbindung wiederhergestellt — Kurse live",
    "term.feed.dismiss": "Schließen",
  },
  ar: {
    "term.feed.live": "مباشر",
    "term.feed.short.stale": "إعادة الاتصال…",
    "term.feed.short.offline": "غير متصل",
    "term.feed.stale": "تأخر تدفق الأسعار — جارٍ إعادة الاتصال…",
    "term.feed.offline":
      "لا يوجد اتصال بالإنترنت — الأسعار لا تتحدث (تُعرض آخر الأسعار المعروفة)",
    "term.feed.lastUpdate": "آخر تحديث قبل {s} ث",
    "term.feed.retry": "إعادة المحاولة",
    "term.feed.recovered": "تمت استعادة الاتصال — الأسعار مباشرة",
    "term.feed.dismiss": "إغلاق",
  },
};
