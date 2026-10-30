import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n/locales";
import { MARKETING_COPY } from "@/lib/public-pages";

const OG_LOCALE: Record<Locale, string> = {
  en: "en_US",
  tr: "tr_TR",
  de: "de_DE",
  ru: "ru_RU",
  ar: "ar_AR",
};

export type PublicNavCopy = {
  skip: string;
  home: string;
  nav: string;
  markets: string;
  platform: string;
  faq: string;
  licenses: string;
  signIn: string;
  signOut: string;
  language: string;
};

export type LicensePageCopy = {
  title: string;
  lede: string;
  emptyTitle: string;
  emptyBody: string;
  kicker: string;
  authority: string;
  number: string;
  type: string;
  entity: string;
  jurisdiction: string;
  issued: string;
  valid: string;
  scope: string;
  verify: string;
  viewFull: string;
  back: string;
  print: string;
  seal: string;
  stamp: string;
  footnote: string;
};

export type AssetCopy = {
  title: string;
  lede: string;
  session: string[];
  symbolsHeading: string;
  symbolsNote: string;
  allMarkets: string;
};

export type PublicBundle = {
  nav: PublicNavCopy;
  markets: { title: string; lede: string; intro: string; platformLink: string };
  assets: Record<"crypto" | "forex" | "commodities" | "indices" | "stocks", AssetCopy>;
  platform: {
    title: string;
    lede: string;
    includes: string;
    items: string[];
    language: string;
    languageBody: string;
    phone: string;
    phoneBefore: string;
    phoneLink: string;
    phoneAfter: string;
    money: string;
    moneyBody: string;
    marketsLink: string;
  };
  faq: {
    title: string;
    lede: string;
    items: { q: string; a: string }[];
    markets: string;
    platform: string;
    register: string;
  };
  licenses: LicensePageCopy;
};

const EN: PublicBundle = {
  nav: {
    skip: "Skip to content",
    home: "7FX home",
    nav: "Public pages",
    markets: "Markets",
    platform: "Platform",
    faq: "FAQ",
    licenses: "Licenses",
    signIn: "Sign in",
    signOut: "Sign out",
    language: "Language",
  },
  markets: {
    title: "Markets",
    lede: "7FX lists crypto, forex, commodities, indices, and stocks in one terminal. The names below are the built-in catalog. The terminal can also show symbols added by the desk.",
    intro:
      "Each asset class has its own session rule. Stock orders are rejected when that stock's session is closed. Crypto is treated as open continuously. Forex, commodity, and index orders are not rejected only because the session label says closed.",
    platformLink: "Platform overview",
  },
  assets: {
    crypto: {
      title: "Crypto",
      lede: "Crypto pairs in the built-in 7FX catalog are quoted in the trading terminal.",
      session: [
        "The platform treats crypto as open 24 hours a day, including weekends.",
        "A closed-session check does not reject a new crypto order.",
      ],
      symbolsHeading: "Built-in symbols",
      symbolsNote: "These names ship with 7FX. A desk can add more. This page does not publish live prices.",
      allMarkets: "All markets",
    },
    forex: {
      title: "Forex",
      lede: "Forex pairs in the built-in 7FX catalog are quoted in the trading terminal.",
      session: [
        "The session label follows roughly Sunday 22:00 UTC through Friday 22:00 UTC. Saturday is closed, as is Friday after 22:00 UTC and Sunday before 22:00 UTC.",
        "A closed forex label does not by itself reject a new forex order.",
      ],
      symbolsHeading: "Built-in symbols",
      symbolsNote: "These names ship with 7FX. A desk can add more. This page does not publish live prices.",
      allMarkets: "All markets",
    },
    commodities: {
      title: "Commodities",
      lede: "Commodity symbols in the built-in 7FX catalog are quoted in the trading terminal.",
      session: [
        "The platform uses the same weekly window as forex for the commodity session label.",
        "A closed commodity label does not by itself reject a new commodity order.",
      ],
      symbolsHeading: "Built-in symbols",
      symbolsNote: "These names ship with 7FX. A desk can add more. This page does not publish live prices.",
      allMarkets: "All markets",
    },
    indices: {
      title: "Indices",
      lede: "Cash-index symbols in the built-in 7FX catalog are quoted in the trading terminal.",
      session: [
        "The session label is on when the US regular cash session is open (weekdays 09:30–16:00 America/New_York) or when Istanbul weekday hours 10:00–18:30 are open.",
        "A closed index label does not by itself reject a new index order.",
      ],
      symbolsHeading: "Built-in symbols",
      symbolsNote: "These names ship with 7FX. A desk can add more. This page does not publish live prices.",
      allMarkets: "All markets",
    },
    stocks: {
      title: "Stocks",
      lede: "US and BIST stock symbols in the built-in 7FX catalog are quoted in the trading terminal.",
      session: [
        "US names follow weekdays 09:30–16:00 America/New_York.",
        "BIST names (Istanbul listings in the catalog) follow weekdays 10:00–18:00 Europe/Istanbul.",
        "A new stock order is rejected when that symbol's session is closed.",
      ],
      symbolsHeading: "Built-in symbols",
      symbolsNote: "These names ship with 7FX. A desk can add more. This page does not publish live prices.",
      allMarkets: "All markets",
    },
  },
  platform: {
    title: "Platform",
    lede: "7FX is a multi-asset trading platform. After you sign in, the terminal is where you watch symbols, place orders, and review open and closed positions.",
    includes: "What the terminal includes",
    items: [
      "One account per signed-in user, with the balance stored on that account.",
      "An order ticket for the selected symbol.",
      "Open positions, pending orders, and closed-trade history.",
      "A chart for the selected symbol.",
    ],
    language: "Language",
    languageBody:
      "Public pages are in English until a language is chosen. Turkish, German, Russian, and Arabic are available in the language menu. The choice is stored in the fx_lang cookie.",
    phone: "Phone",
    phoneBefore: "The site is usable in a phone browser. On iPhone and iPad you can add it to the Home Screen.",
    phoneLink: "iPhone and iPad install steps",
    phoneAfter: "",
    money: "Deposits and withdrawals",
    moneyBody:
      "Deposit and withdrawal requests are submitted from the signed-in account. They stay pending until the desk updates the request. This page does not describe a transfer as instant.",
    marketsLink: "Markets and session rules",
  },
  faq: {
    title: "Questions",
    lede: "Short answers about how 7FX behaves. These pages describe the product. They are not an offer of returns.",
    items: [
      {
        q: "What can I trade?",
        a: "The built-in catalog covers crypto, forex, commodities, indices, and stocks. The desk can add further symbols. See the markets pages for the built-in names and the session rule for each class.",
      },
      {
        q: "Which language is the public site in?",
        a: "English. If you have not chosen a language, pages stay in English. You can switch to Turkish, German, Russian, or Arabic from the language menu.",
      },
      {
        q: "When does 7FX accept a stock order?",
        a: "US stock orders are accepted on weekdays from 09:30 to 16:00 America/New_York. BIST stock orders are accepted on weekdays from 10:00 to 18:00 Europe/Istanbul. Outside that session the platform rejects a new stock order.",
      },
      {
        q: "Are forex, crypto, commodity, and index orders rejected when the session label says closed?",
        a: "Crypto is treated as open continuously. Forex, commodity, and index symbols still show a session label, and a closed label does not by itself reject those orders. Stock orders are the ones rejected when the session is closed.",
      },
      {
        q: "Does this website publish a regulatory license number?",
        a: "A license number appears only on the licenses page, and only when a record is stored there. That page does not state a number, a regulator, or a date that is not on file.",
      },
      {
        q: "Does 7FX promise a profit or a quoted spread?",
        a: "No. Nothing on this site is a forecast, a target return, or a promise of profit. Spreads and prices shown in the terminal come from the platform quote feed at that moment.",
      },
      {
        q: "How do I open an account?",
        a: "Use the register page. If you have a referral code, the form asks for it. After sign-in, the trading terminal is at the trade page.",
      },
    ],
    markets: "Markets",
    platform: "Platform",
    register: "Open an account",
  },
  licenses: {
    title: "Licenses",
    lede: "Each active record is laid out as its own document. Only fields stored in 7FX are filled in. A — means that field is not on file.",
    emptyTitle: "No license records are published",
    emptyBody: "When a license is added and marked active, it appears here as a document. The fields below are the ones this page can show.",
    kicker: "License record",
    authority: "Issuing authority",
    number: "License or registration number",
    type: "License type",
    entity: "Entity name",
    jurisdiction: "Jurisdiction",
    issued: "Issue date",
    valid: "Validity",
    scope: "Scope of permitted activities",
    verify: "Verify on the official register",
    viewFull: "View full page",
    back: "All licenses",
    print: "Print",
    seal: "Record seal",
    stamp: "RECORD",
    footnote: "A — means that field is not on file.",
  },
};

const META: Record<Exclude<Locale, "en">, Record<string, { title: string; description: string }>> = {
  tr: {
    "/markets": {
      title: "7FX piyasaları",
      description:
        "7FX kataloğunda kripto, forex, emtia, endeks ve hisse sembolleri vardır. Seans kuralı varlık sınıfına göre değişir.",
    },
    "/markets/crypto": {
      title: "7FX kripto piyasaları",
      description:
        "7FX kripto sembollerini sürekli açık kabul eder. Platform, seans kapalı diye bir kripto emrini reddetmez.",
    },
    "/markets/forex": {
      title: "7FX forex piyasaları",
      description:
        "7FX forex sembollerinde seans etiketi pazar 22:00 UTC ile cuma 22:00 UTC arasındadır. Kapalı etiket tek başına forex emrini reddetmez.",
    },
    "/markets/commodities": {
      title: "7FX emtia piyasaları",
      description:
        "7FX emtia sembollerinde forex ile aynı seans penceresi kullanılır. Kapalı etiket tek başına emtia emrini reddetmez.",
    },
    "/markets/indices": {
      title: "7FX endeks piyasaları",
      description:
        "7FX endeks etiketi ABD nakit seansı veya İstanbul hafta içi saatlerinde açıktır. Kapalı etiket tek başına endeks emrini reddetmez.",
    },
    "/markets/stocks": {
      title: "7FX hisse piyasaları",
      description:
        "ABD hisse emirleri hafta içi 09:30–16:00 America/New_York dışında reddedilir. BIST sembolleri hafta içi 10:00–18:00 Europe/Istanbul kullanır.",
    },
    "/platform": {
      title: "7FX platformu",
      description:
        "7FX çok varlık sınıflı bir işlem terminalidir: bir hesap, emir bileti, açık pozisyonlar ve grafikler. Herkese açık varsayılan dil İngilizcedir.",
    },
    "/faq": {
      title: "7FX soruları",
      description: "7FX piyasaları, diller, hisse seansları ve bu sitenin iddia etmediği konular hakkında yanıtlar.",
    },
    "/licenses": {
      title: "7FX lisansları",
      description: "7FX üzerinde yayımlanan lisans kayıtları. Dosyada olmayan alanlar — olarak durur.",
    },
  },
  de: {
    "/markets": {
      title: "Märkte auf 7FX",
      description:
        "Der eingebaute 7FX-Katalog umfasst Krypto, Forex, Rohstoffe, Indizes und Aktien. Die Sitzungsregel hängt von der Anlageklasse ab.",
    },
    "/markets/crypto": {
      title: "Krypto-Märkte auf 7FX",
      description:
        "Krypto-Symbole auf 7FX gelten als durchgehend geöffnet. Die Plattform lehnt einen Krypto-Auftrag nicht ab, weil eine Sitzung geschlossen ist.",
    },
    "/markets/forex": {
      title: "Forex-Märkte auf 7FX",
      description:
        "Forex-Symbole auf 7FX nutzen das Fenster Sonntag 22:00 UTC bis Freitag 22:00 UTC. Eine geschlossene Markierung lehnt einen Forex-Auftrag nicht für sich allein ab.",
    },
    "/markets/commodities": {
      title: "Rohstoffmärkte auf 7FX",
      description:
        "Rohstoff-Symbole auf 7FX nutzen dasselbe Wochenfenster wie Forex. Eine geschlossene Markierung lehnt einen Rohstoff-Auftrag nicht für sich allein ab.",
    },
    "/markets/indices": {
      title: "Indexmärkte auf 7FX",
      description:
        "Index-Symbole auf 7FX gelten als offen während der US-Kassasitzung oder der Istanbuler Wochentagszeiten. Eine geschlossene Markierung lehnt einen Index-Auftrag nicht für sich allein ab.",
    },
    "/markets/stocks": {
      title: "Aktienmärkte auf 7FX",
      description:
        "US-Aktienaufträge werden außerhalb von 09:30–16:00 America/New_York an Wochentagen abgelehnt. BIST-Namen nutzen 10:00–18:00 Europe/Istanbul an Wochentagen.",
    },
    "/platform": {
      title: "Die 7FX-Plattform",
      description:
        "7FX ist ein Multi-Asset-Terminal mit einem Konto, einem Order-Ticket, offenen Positionen und Charts. Englisch ist die öffentliche Standardsprache.",
    },
    "/faq": {
      title: "Fragen zu 7FX",
      description: "Antworten zu 7FX-Märkten, Sprachen, Aktiensitzungen und dazu, was diese Website nicht behauptet.",
    },
    "/licenses": {
      title: "Lizenzen auf 7FX",
      description: "Auf 7FX veröffentlichte Lizenznachweise. Felder, die nicht vorliegen, stehen als —.",
    },
  },
  ru: {
    "/markets": {
      title: "Рынки на 7FX",
      description:
        "Встроенный каталог 7FX включает крипто, форекс, сырьё, индексы и акции. Правило сессии зависит от класса актива.",
    },
    "/markets/crypto": {
      title: "Крипторынки на 7FX",
      description:
        "Криптосимволы на 7FX считаются открытыми постоянно. Платформа не отклоняет криптозаявку только потому, что сессия закрыта.",
    },
    "/markets/forex": {
      title: "Рынки форекс на 7FX",
      description:
        "Для форекс на 7FX метка сессии — с воскресенья 22:00 UTC по пятницу 22:00 UTC. Закрытая метка сама по себе не отклоняет заявку форекс.",
    },
    "/markets/commodities": {
      title: "Сырьевые рынки на 7FX",
      description:
        "Сырьевые символы на 7FX используют то же недельное окно, что и форекс. Закрытая метка сама по себе не отклоняет сырьевую заявку.",
    },
    "/markets/indices": {
      title: "Индексные рынки на 7FX",
      description:
        "Метка индекса на 7FX открыта в американскую кассовую сессию или в будние часы Стамбула. Закрытая метка сама по себе не отклоняет индексную заявку.",
    },
    "/markets/stocks": {
      title: "Рынки акций на 7FX",
      description:
        "Заявки по акциям США отклоняются вне 09:30–16:00 America/New_York по будням. Бумаги BIST используют 10:00–18:00 Europe/Istanbul по будням.",
    },
    "/platform": {
      title: "Платформа 7FX",
      description:
        "7FX — мультиактивный терминал: один счёт, тикет заявки, открытые позиции и графики. Публичный язык по умолчанию — английский.",
    },
    "/faq": {
      title: "Вопросы о 7FX",
      description: "Ответы о рынках 7FX, языках, сессиях акций и о том, чего этот сайт не обещает.",
    },
    "/licenses": {
      title: "Лицензии на 7FX",
      description: "Лицензионные записи, опубликованные на 7FX. Поля, которых нет в деле, показаны как —.",
    },
  },
  ar: {
    "/markets": {
      title: "الأسواق على 7FX",
      description:
        "يضم كتالوج 7FX المدمج رموز العملات الرقمية والفوركس والسلع والمؤشرات والأسهم. تختلف قاعدة الجلسة حسب فئة الأصل.",
    },
    "/markets/crypto": {
      title: "أسواق العملات الرقمية على 7FX",
      description: "تُعامل رموز العملات الرقمية على 7FX على أنها مفتوحة باستمرار. لا ترفض المنصة أمرًا رقميًا لأن الجلسة مغلقة.",
    },
    "/markets/forex": {
      title: "أسواق الفوركس على 7FX",
      description:
        "تستخدم رموز الفوركس على 7FX نافذة الأحد 22:00 UTC حتى الجمعة 22:00 UTC. لا ترفض علامة الإغلاق وحدها أمر فوركس.",
    },
    "/markets/commodities": {
      title: "أسواق السلع على 7FX",
      description: "تستخدم رموز السلع على 7FX نافذة الفوركس الأسبوعية نفسها. لا ترفض علامة الإغلاق وحدها أمر سلعة.",
    },
    "/markets/indices": {
      title: "أسواق المؤشرات على 7FX",
      description:
        "تكون علامة المؤشر مفتوحة خلال الجلسة النقدية الأمريكية أو ساعات إسطنبول في أيام الأسبوع. لا ترفض علامة الإغلاق وحدها أمر مؤشر.",
    },
    "/markets/stocks": {
      title: "أسواق الأسهم على 7FX",
      description:
        "تُرفض أوامر الأسهم الأمريكية خارج 09:30–16:00 America/New_York في أيام الأسبوع. تستخدم أسماء BIST الفترة 10:00–18:00 Europe/Istanbul في أيام الأسبوع.",
    },
    "/platform": {
      title: "منصة 7FX",
      description: "7FX منصة تداول متعددة الأصول: حساب واحد، تذكرة أمر، صفقات مفتوحة ورسوم بيانية. الإنجليزية هي اللغة العامة الافتراضية.",
    },
    "/faq": {
      title: "أسئلة 7FX",
      description: "إجابات عن أسواق 7FX واللغات وجلسات الأسهم وما لا يدّعيه هذا الموقع.",
    },
    "/licenses": {
      title: "التراخيص على 7FX",
      description: "سجلات التراخيص المنشورة على 7FX. الحقول غير الموجودة في الملف تظهر كـ —.",
    },
  },
};

const TR: PublicBundle = {
  nav: {
    skip: "İçeriğe geç",
    home: "7FX ana sayfa",
    nav: "Herkese açık sayfalar",
    markets: "Piyasalar",
    platform: "Platform",
    faq: "SSS",
    licenses: "Lisanslar",
    signIn: "Giriş yap",
    signOut: "Çıkış",
    language: "Dil",
  },
  markets: {
    title: "Piyasalar",
    lede: "7FX kripto, forex, emtia, endeks ve hisseleri tek terminalde listeler. Aşağıdaki adlar yerleşik katalogdur. Terminal, masanın eklediği sembolleri de gösterebilir.",
    intro:
      "Her varlık sınıfının kendi seans kuralı vardır. Bir hissenin seansı kapalıyken hisse emri reddedilir. Kripto sürekli açık kabul edilir. Forex, emtia ve endeks emirleri yalnızca seans etiketi kapalı diye reddedilmez.",
    platformLink: "Platform özeti",
  },
  assets: {
    crypto: {
      title: "Kripto",
      lede: "Yerleşik 7FX kataloğundaki kripto çiftleri işlem terminalinde kotelenir.",
      session: [
        "Platform kriptoyu hafta sonları dahil günde 24 saat açık kabul eder.",
        "Kapalı seans kontrolü yeni bir kripto emrini reddetmez.",
      ],
      symbolsHeading: "Yerleşik semboller",
      symbolsNote: "Bu adlar 7FX ile gelir. Masa yenilerini ekleyebilir. Bu sayfa canlı fiyat yayımlamaz.",
      allMarkets: "Tüm piyasalar",
    },
    forex: {
      title: "Forex",
      lede: "Yerleşik 7FX kataloğundaki forex çiftleri işlem terminalinde kotelenir.",
      session: [
        "Seans etiketi yaklaşık olarak pazar 22:00 UTC ile cuma 22:00 UTC arasındadır. Cumartesi kapalıdır; cuma 22:00 UTC sonrası ve pazar 22:00 UTC öncesi de kapalıdır.",
        "Kapalı forex etiketi tek başına yeni bir forex emrini reddetmez.",
      ],
      symbolsHeading: "Yerleşik semboller",
      symbolsNote: "Bu adlar 7FX ile gelir. Masa yenilerini ekleyebilir. Bu sayfa canlı fiyat yayımlamaz.",
      allMarkets: "Tüm piyasalar",
    },
    commodities: {
      title: "Emtia",
      lede: "Yerleşik 7FX kataloğundaki emtia sembolleri işlem terminalinde kotelenir.",
      session: [
        "Platform, emtia seans etiketi için forex ile aynı haftalık pencereyi kullanır.",
        "Kapalı emtia etiketi tek başına yeni bir emtia emrini reddetmez.",
      ],
      symbolsHeading: "Yerleşik semboller",
      symbolsNote: "Bu adlar 7FX ile gelir. Masa yenilerini ekleyebilir. Bu sayfa canlı fiyat yayımlamaz.",
      allMarkets: "Tüm piyasalar",
    },
    indices: {
      title: "Endeksler",
      lede: "Yerleşik 7FX kataloğundaki nakit endeks sembolleri işlem terminalinde kotelenir.",
      session: [
        "Seans etiketi, ABD nakit seansı açıkken (hafta içi 09:30–16:00 America/New_York) veya İstanbul hafta içi 10:00–18:30 açıkken açıktır.",
        "Kapalı endeks etiketi tek başına yeni bir endeks emrini reddetmez.",
      ],
      symbolsHeading: "Yerleşik semboller",
      symbolsNote: "Bu adlar 7FX ile gelir. Masa yenilerini ekleyebilir. Bu sayfa canlı fiyat yayımlamaz.",
      allMarkets: "Tüm piyasalar",
    },
    stocks: {
      title: "Hisseler",
      lede: "Yerleşik 7FX kataloğundaki ABD ve BIST hisse sembolleri işlem terminalinde kotelenir.",
      session: [
        "ABD adları hafta içi 09:30–16:00 America/New_York izler.",
        "BIST adları (katalogdaki İstanbul kayıtları) hafta içi 10:00–18:00 Europe/Istanbul izler.",
        "Sembolün seansı kapalıyken yeni hisse emri reddedilir.",
      ],
      symbolsHeading: "Yerleşik semboller",
      symbolsNote: "Bu adlar 7FX ile gelir. Masa yenilerini ekleyebilir. Bu sayfa canlı fiyat yayımlamaz.",
      allMarkets: "Tüm piyasalar",
    },
  },
  platform: {
    title: "Platform",
    lede: "7FX çok varlık sınıflı bir işlem platformudur. Girişten sonra sembolleri izlediğiniz, emir verdiğiniz ve açık ile kapalı pozisyonları gördüğünüz yer terminaldir.",
    includes: "Terminalde neler var",
    items: [
      "Giriş yapmış her kullanıcı için bir hesap; bakiye o hesapta durur.",
      "Seçili sembol için bir emir bileti.",
      "Açık pozisyonlar, bekleyen emirler ve kapanmış işlem geçmişi.",
      "Seçili sembol için bir grafik.",
    ],
    language: "Dil",
    languageBody:
      "Bir dil seçilene kadar herkese açık sayfalar İngilizcedir. Dil menüsünde Türkçe, Almanca, Rusça ve Arapça vardır. Seçim fx_lang çerezinde durur.",
    phone: "Telefon",
    phoneBefore: "Site telefon tarayıcısında kullanılabilir. iPhone ve iPad’de Ana Ekrana ekleyebilirsiniz.",
    phoneLink: "iPhone ve iPad kurulum adımları",
    phoneAfter: "",
    money: "Para yatırma ve çekme",
    moneyBody:
      "Para yatırma ve çekme talepleri giriş yapılmış hesaptan gönderilir. Masa talebi güncelleyene kadar beklemede kalırlar. Bu sayfa bir transferi anında diye anlatmaz.",
    marketsLink: "Piyasalar ve seans kuralları",
  },
  faq: {
    title: "Sorular",
    lede: "7FX’in nasıl davrandığına dair kısa yanıtlar. Bu sayfalar ürünü anlatır. Getiri vaadi değildir.",
    items: [
      {
        q: "Ne işlem yapabilirim?",
        a: "Yerleşik katalog kripto, forex, emtia, endeks ve hisse kapsar. Masa başka semboller ekleyebilir. Yerleşik adlar ve her sınıfın seans kuralı için piyasa sayfalarına bakın.",
      },
      {
        q: "Herkese açık site hangi dilde?",
        a: "İngilizce. Bir dil seçmediyseniz sayfalar İngilizce kalır. Dil menüsünden Türkçe, Almanca, Rusça veya Arapça seçebilirsiniz.",
      },
      {
        q: "7FX hisse emrini ne zaman kabul eder?",
        a: "ABD hisse emirleri hafta içi 09:30–16:00 America/New_York arasında kabul edilir. BIST hisse emirleri hafta içi 10:00–18:00 Europe/Istanbul arasında kabul edilir. Bu seansın dışında platform yeni hisse emrini reddeder.",
      },
      {
        q: "Seans etiketi kapalıyken forex, kripto, emtia ve endeks emirleri reddedilir mi?",
        a: "Kripto sürekli açık kabul edilir. Forex, emtia ve endeks sembollerinde seans etiketi yine görünür; kapalı etiket tek başına bu emirleri reddetmez. Seans kapalıyken reddedilenler hisse emirleridir.",
      },
      {
        q: "Bu site bir düzenleyici lisans numarası yayımlar mı?",
        a: "Bir lisans numarası yalnızca lisanslar sayfasında ve yalnızca bir kayıt saklandığında görünür. Bu sayfa, dosyada olmayan bir numara, kurum veya tarih yazmaz.",
      },
      {
        q: "7FX kâr veya belirli bir spread vaat eder mi?",
        a: "Hayır. Bu sitede hiçbir şey bir tahmin, hedef getiri veya kâr vaadi değildir. Terminaldeki spread ve fiyatlar o andaki kotasyon akışından gelir.",
      },
      {
        q: "Nasıl hesap açarım?",
        a: "Kayıt sayfasını kullanın. Bir referans kodunuz varsa form onu sorar. Girişten sonra işlem terminali trade sayfasındadır.",
      },
    ],
    markets: "Piyasalar",
    platform: "Platform",
    register: "Hesap aç",
  },
  licenses: {
    title: "Lisanslar",
    lede: "Her aktif kayıt kendi belgesi olarak düzenlenir. Yalnızca 7FX içinde saklanan alanlar doludur. — işareti, o alanın kayıtta olmadığını gösterir.",
    emptyTitle: "Yayımlanmış lisans kaydı yok",
    emptyBody: "Bir lisans eklenip aktif işaretlendiğinde burada bir belge olarak görünür. Aşağıdaki alanlar bu sayfanın gösterebildikleridir.",
    kicker: "Lisans kaydı",
    authority: "Düzenleyen kurum",
    number: "Lisans veya kayıt numarası",
    type: "Lisans türü",
    entity: "Tüzel kişi adı",
    jurisdiction: "Yetki bölgesi",
    issued: "Düzenlenme tarihi",
    valid: "Geçerlilik",
    scope: "İzin verilen faaliyetlerin kapsamı",
    verify: "Resmi kayıtta doğrula",
    viewFull: "Tam sayfa görüntüle",
    back: "Tüm lisanslar",
    print: "Yazdır",
    seal: "Kayıt mührü",
    stamp: "KAYIT",
    footnote: "— işareti, o alanın kayıtta olmadığını gösterir.",
  },
};

const DE: PublicBundle = {
  nav: {
    skip: "Zum Inhalt",
    home: "7FX Startseite",
    nav: "Öffentliche Seiten",
    markets: "Märkte",
    platform: "Plattform",
    faq: "FAQ",
    licenses: "Lizenzen",
    signIn: "Anmelden",
    signOut: "Abmelden",
    language: "Sprache",
  },
  markets: {
    title: "Märkte",
    lede: "7FX führt Krypto, Forex, Rohstoffe, Indizes und Aktien in einem Terminal. Die Namen unten sind der eingebaute Katalog. Das Terminal kann auch Symbole zeigen, die der Desk hinzufügt.",
    intro:
      "Jede Anlageklasse hat eine eigene Sitzungsregel. Aktienaufträge werden abgelehnt, wenn die Sitzung dieser Aktie geschlossen ist. Krypto gilt als durchgehend geöffnet. Forex-, Rohstoff- und Indexaufträge werden nicht allein deshalb abgelehnt, weil die Sitzungsmarkierung geschlossen sagt.",
    platformLink: "Plattformüberblick",
  },
  assets: {
    crypto: {
      title: "Krypto",
      lede: "Krypto-Paare im eingebauten 7FX-Katalog werden im Handelsterminal quotiert.",
      session: [
        "Die Plattform behandelt Krypto als 24 Stunden geöffnet, auch am Wochenende.",
        "Eine Prüfung auf geschlossene Sitzung lehnt einen neuen Krypto-Auftrag nicht ab.",
      ],
      symbolsHeading: "Eingebaute Symbole",
      symbolsNote: "Diese Namen gehören zu 7FX. Ein Desk kann weitere hinzufügen. Diese Seite veröffentlicht keine Live-Kurse.",
      allMarkets: "Alle Märkte",
    },
    forex: {
      title: "Forex",
      lede: "Forex-Paare im eingebauten 7FX-Katalog werden im Handelsterminal quotiert.",
      session: [
        "Die Sitzungsmarkierung folgt ungefähr Sonntag 22:00 UTC bis Freitag 22:00 UTC. Samstag ist geschlossen, ebenso Freitag nach 22:00 UTC und Sonntag vor 22:00 UTC.",
        "Eine geschlossene Forex-Markierung lehnt einen neuen Forex-Auftrag nicht für sich allein ab.",
      ],
      symbolsHeading: "Eingebaute Symbole",
      symbolsNote: "Diese Namen gehören zu 7FX. Ein Desk kann weitere hinzufügen. Diese Seite veröffentlicht keine Live-Kurse.",
      allMarkets: "Alle Märkte",
    },
    commodities: {
      title: "Rohstoffe",
      lede: "Rohstoff-Symbole im eingebauten 7FX-Katalog werden im Handelsterminal quotiert.",
      session: [
        "Die Plattform nutzt für die Rohstoff-Sitzung dasselbe Wochenfenster wie für Forex.",
        "Eine geschlossene Rohstoff-Markierung lehnt einen neuen Rohstoff-Auftrag nicht für sich allein ab.",
      ],
      symbolsHeading: "Eingebaute Symbole",
      symbolsNote: "Diese Namen gehören zu 7FX. Ein Desk kann weitere hinzufügen. Diese Seite veröffentlicht keine Live-Kurse.",
      allMarkets: "Alle Märkte",
    },
    indices: {
      title: "Indizes",
      lede: "Kassa-Index-Symbole im eingebauten 7FX-Katalog werden im Handelsterminal quotiert.",
      session: [
        "Die Sitzungsmarkierung ist an, wenn die US-Kassasitzung offen ist (Wochentage 09:30–16:00 America/New_York) oder die Istanbuler Wochentagszeiten 10:00–18:30 offen sind.",
        "Eine geschlossene Index-Markierung lehnt einen neuen Index-Auftrag nicht für sich allein ab.",
      ],
      symbolsHeading: "Eingebaute Symbole",
      symbolsNote: "Diese Namen gehören zu 7FX. Ein Desk kann weitere hinzufügen. Diese Seite veröffentlicht keine Live-Kurse.",
      allMarkets: "Alle Märkte",
    },
    stocks: {
      title: "Aktien",
      lede: "US- und BIST-Aktiensymbole im eingebauten 7FX-Katalog werden im Handelsterminal quotiert.",
      session: [
        "US-Namen folgen Wochentagen 09:30–16:00 America/New_York.",
        "BIST-Namen (Istanbul-Listings im Katalog) folgen Wochentagen 10:00–18:00 Europe/Istanbul.",
        "Ein neuer Aktienauftrag wird abgelehnt, wenn die Sitzung dieses Symbols geschlossen ist.",
      ],
      symbolsHeading: "Eingebaute Symbole",
      symbolsNote: "Diese Namen gehören zu 7FX. Ein Desk kann weitere hinzufügen. Diese Seite veröffentlicht keine Live-Kurse.",
      allMarkets: "Alle Märkte",
    },
  },
  platform: {
    title: "Plattform",
    lede: "7FX ist eine Multi-Asset-Handelsplattform. Nach der Anmeldung ist das Terminal der Ort, an dem Sie Symbole beobachten, Aufträge erteilen und offene sowie geschlossene Positionen prüfen.",
    includes: "Was das Terminal enthält",
    items: [
      "Ein Konto je angemeldetem Benutzer, mit dem Saldo auf diesem Konto.",
      "Ein Order-Ticket für das gewählte Symbol.",
      "Offene Positionen, wartende Aufträge und die Historie geschlossener Trades.",
      "Ein Chart für das gewählte Symbol.",
    ],
    language: "Sprache",
    languageBody:
      "Öffentliche Seiten sind Englisch, bis eine Sprache gewählt wird. Türkisch, Deutsch, Russisch und Arabisch stehen im Sprachmenü. Die Wahl liegt im Cookie fx_lang.",
    phone: "Telefon",
    phoneBefore: "Die Seite lässt sich im Telefonbrowser nutzen. Auf iPhone und iPad können Sie sie zum Home-Bildschirm hinzufügen.",
    phoneLink: "Installationsschritte für iPhone und iPad",
    phoneAfter: "",
    money: "Ein- und Auszahlungen",
    moneyBody:
      "Ein- und Auszahlungsanträge werden vom angemeldeten Konto gesendet. Sie bleiben ausstehend, bis der Desk den Antrag aktualisiert. Diese Seite beschreibt eine Überweisung nicht als sofortig.",
    marketsLink: "Märkte und Sitzungsregeln",
  },
  faq: {
    title: "Fragen",
    lede: "Kurze Antworten dazu, wie sich 7FX verhält. Diese Seiten beschreiben das Produkt. Sie sind kein Renditeangebot.",
    items: [
      {
        q: "Was kann ich handeln?",
        a: "Der eingebaute Katalog umfasst Krypto, Forex, Rohstoffe, Indizes und Aktien. Der Desk kann weitere Symbole hinzufügen. Die Marktseiten nennen die eingebauten Namen und die Sitzungsregel jeder Klasse.",
      },
      {
        q: "In welcher Sprache ist die öffentliche Website?",
        a: "Englisch. Wenn Sie keine Sprache gewählt haben, bleiben die Seiten Englisch. Im Sprachmenü können Sie Türkisch, Deutsch, Russisch oder Arabisch wählen.",
      },
      {
        q: "Wann nimmt 7FX einen Aktienauftrag an?",
        a: "US-Aktienaufträge werden an Wochentagen von 09:30 bis 16:00 America/New_York angenommen. BIST-Aktienaufträge werden an Wochentagen von 10:00 bis 18:00 Europe/Istanbul angenommen. Außerhalb dieser Sitzung lehnt die Plattform einen neuen Aktienauftrag ab.",
      },
      {
        q: "Werden Forex-, Krypto-, Rohstoff- und Indexaufträge abgelehnt, wenn die Sitzungsmarkierung geschlossen sagt?",
        a: "Krypto gilt als durchgehend geöffnet. Forex-, Rohstoff- und Indexsymbole zeigen weiter eine Sitzungsmarkierung, und eine geschlossene Markierung lehnt diese Aufträge nicht für sich allein ab. Abgelehnt werden Aktienaufträge, wenn die Sitzung geschlossen ist.",
      },
      {
        q: "Veröffentlicht diese Website eine Aufsichts-Lizenznummer?",
        a: "Eine Lizenznummer steht nur auf der Lizenzseite, und nur wenn dort ein Nachweis gespeichert ist. Die Seite nennt keine Nummer, keine Stelle und kein Datum, die nicht vorliegen.",
      },
      {
        q: "Verspricht 7FX einen Gewinn oder einen genannten Spread?",
        a: "Nein. Nichts auf dieser Website ist eine Prognose, eine Zielrendite oder ein Gewinnversprechen. Spreads und Preise im Terminal kommen in dem Moment aus dem Kursfeed der Plattform.",
      },
      {
        q: "Wie eröffne ich ein Konto?",
        a: "Nutzen Sie die Registrierungsseite. Wenn Sie einen Empfehlungscode haben, fragt das Formular danach. Nach der Anmeldung liegt das Handelsterminal auf der Trade-Seite.",
      },
    ],
    markets: "Märkte",
    platform: "Plattform",
    register: "Konto eröffnen",
  },
  licenses: {
    title: "Lizenzen",
    lede: "Jeder aktive Nachweis ist als eigenes Dokument gesetzt. Ausgefüllt sind nur Felder, die in 7FX gespeichert sind. Ein — bedeutet, dass das Feld nicht vorliegt.",
    emptyTitle: "Keine Lizenznachweise veröffentlicht",
    emptyBody: "Eine Lizenz erscheint hier als Dokument, sobald sie hinzugefügt und aktiv ist. Die Felder unten sind die, die diese Seite zeigen kann.",
    kicker: "Lizenznachweis",
    authority: "Ausstellende Stelle",
    number: "Lizenz- oder Registrierungsnummer",
    type: "Lizenzart",
    entity: "Name des Rechtsträgers",
    jurisdiction: "Zuständigkeit",
    issued: "Ausstellungsdatum",
    valid: "Gültigkeit",
    scope: "Umfang der erlaubten Tätigkeiten",
    verify: "Im amtlichen Register prüfen",
    viewFull: "Ganzseitig ansehen",
    back: "Alle Lizenzen",
    print: "Drucken",
    seal: "Nachweissiegel",
    stamp: "AKTE",
    footnote: "Ein — bedeutet, dass das Feld nicht vorliegt.",
  },
};

const RU: PublicBundle = {
  nav: {
    skip: "К содержанию",
    home: "Главная 7FX",
    nav: "Публичные страницы",
    markets: "Рынки",
    platform: "Платформа",
    faq: "Вопросы",
    licenses: "Лицензии",
    signIn: "Войти",
    signOut: "Выйти",
    language: "Язык",
  },
  markets: {
    title: "Рынки",
    lede: "7FX показывает крипто, форекс, сырьё, индексы и акции в одном терминале. Имена ниже — встроенный каталог. Терминал может показывать и символы, которые добавил деск.",
    intro:
      "У каждого класса активов своё правило сессии. Заявка по акции отклоняется, когда сессия этой акции закрыта. Крипто считается открытым постоянно. Заявки форекс, сырья и индексов не отклоняются только потому, что метка сессии говорит «закрыто».",
    platformLink: "Обзор платформы",
  },
  assets: {
    crypto: {
      title: "Крипто",
      lede: "Криптопары встроенного каталога 7FX котируются в торговом терминале.",
      session: [
        "Платформа считает крипто открытым 24 часа в сутки, включая выходные.",
        "Проверка закрытой сессии не отклоняет новую криптозаявку.",
      ],
      symbolsHeading: "Встроенные символы",
      symbolsNote: "Эти имена поставляются с 7FX. Деск может добавить другие. Эта страница не публикует живые цены.",
      allMarkets: "Все рынки",
    },
    forex: {
      title: "Форекс",
      lede: "Пары форекс встроенного каталога 7FX котируются в торговом терминале.",
      session: [
        "Метка сессии примерно с воскресенья 22:00 UTC по пятницу 22:00 UTC. Суббота закрыта, как и пятница после 22:00 UTC и воскресенье до 22:00 UTC.",
        "Закрытая метка форекс сама по себе не отклоняет новую заявку форекс.",
      ],
      symbolsHeading: "Встроенные символы",
      symbolsNote: "Эти имена поставляются с 7FX. Деск может добавить другие. Эта страница не публикует живые цены.",
      allMarkets: "Все рынки",
    },
    commodities: {
      title: "Сырьё",
      lede: "Сырьевые символы встроенного каталога 7FX котируются в торговом терминале.",
      session: [
        "Для метки сырьевой сессии платформа использует то же недельное окно, что и для форекс.",
        "Закрытая сырьевая метка сама по себе не отклоняет новую сырьевую заявку.",
      ],
      symbolsHeading: "Встроенные символы",
      symbolsNote: "Эти имена поставляются с 7FX. Деск может добавить другие. Эта страница не публикует живые цены.",
      allMarkets: "Все рынки",
    },
    indices: {
      title: "Индексы",
      lede: "Символы наличных индексов встроенного каталога 7FX котируются в торговом терминале.",
      session: [
        "Метка сессии включена, когда открыта американская кассовая сессия (будни 09:30–16:00 America/New_York) или будние часы Стамбула 10:00–18:30.",
        "Закрытая индексная метка сама по себе не отклоняет новую индексную заявку.",
      ],
      symbolsHeading: "Встроенные символы",
      symbolsNote: "Эти имена поставляются с 7FX. Деск может добавить другие. Эта страница не публикует живые цены.",
      allMarkets: "Все рынки",
    },
    stocks: {
      title: "Акции",
      lede: "Акции США и BIST встроенного каталога 7FX котируются в торговом терминале.",
      session: [
        "Бумаги США следуют будням 09:30–16:00 America/New_York.",
        "Бумаги BIST (стамбульские имена в каталоге) следуют будням 10:00–18:00 Europe/Istanbul.",
        "Новая заявка по акции отклоняется, когда сессия этого символа закрыта.",
      ],
      symbolsHeading: "Встроенные символы",
      symbolsNote: "Эти имена поставляются с 7FX. Деск может добавить другие. Эта страница не публикует живые цены.",
      allMarkets: "Все рынки",
    },
  },
  platform: {
    title: "Платформа",
    lede: "7FX — мультиактивная торговая платформа. После входа терминал — это место, где вы смотрите символы, выставляете заявки и проверяете открытые и закрытые позиции.",
    includes: "Что есть в терминале",
    items: [
      "Один счёт на вошедшего пользователя, баланс хранится на этом счёте.",
      "Тикет заявки для выбранного символа.",
      "Открытые позиции, ожидающие заявки и история закрытых сделок.",
      "График выбранного символа.",
    ],
    language: "Язык",
    languageBody:
      "Публичные страницы на английском, пока язык не выбран. В меню есть турецкий, немецкий, русский и арабский. Выбор хранится в cookie fx_lang.",
    phone: "Телефон",
    phoneBefore: "Сайт можно открыть в браузере телефона. На iPhone и iPad его можно добавить на экран «Домой».",
    phoneLink: "Шаги установки на iPhone и iPad",
    phoneAfter: "",
    money: "Пополнение и вывод",
    moneyBody:
      "Заявки на пополнение и вывод отправляются из вошедшего счёта. Они остаются в ожидании, пока деск не обновит заявку. Эта страница не описывает перевод как мгновенный.",
    marketsLink: "Рынки и правила сессий",
  },
  faq: {
    title: "Вопросы",
    lede: "Короткие ответы о том, как ведёт себя 7FX. Эти страницы описывают продукт. Это не предложение доходности.",
    items: [
      {
        q: "Чем можно торговать?",
        a: "Встроенный каталог включает крипто, форекс, сырьё, индексы и акции. Деск может добавить другие символы. На страницах рынков — встроенные имена и правило сессии каждого класса.",
      },
      {
        q: "На каком языке публичный сайт?",
        a: "На английском. Если язык не выбран, страницы остаются английскими. В меню можно выбрать турецкий, немецкий, русский или арабский.",
      },
      {
        q: "Когда 7FX принимает заявку по акции?",
        a: "Заявки по акциям США принимаются по будням с 09:30 до 16:00 America/New_York. Заявки по акциям BIST принимаются по будням с 10:00 до 18:00 Europe/Istanbul. Вне этой сессии платформа отклоняет новую заявку по акции.",
      },
      {
        q: "Отклоняются ли заявки форекс, крипто, сырья и индексов, если метка сессии говорит «закрыто»?",
        a: "Крипто считается открытым постоянно. У форекс, сырья и индексов метка сессии всё равно показывается, и закрытая метка сама по себе эти заявки не отклоняет. Отклоняются заявки по акциям, когда сессия закрыта.",
      },
      {
        q: "Публикует ли этот сайт номер регуляторной лицензии?",
        a: "Номер лицензии есть только на странице лицензий и только если запись сохранена. Страница не указывает номер, орган или дату, которых нет в деле.",
      },
      {
        q: "Обещает ли 7FX прибыль или названный спред?",
        a: "Нет. Ничто на этом сайте не является прогнозом, целевой доходностью или обещанием прибыли. Спреды и цены в терминале берутся из котировочного потока платформы в этот момент.",
      },
      {
        q: "Как открыть счёт?",
        a: "Откройте страницу регистрации. Если есть реферальный код, форма его спрашивает. После входа торговый терминал находится на странице trade.",
      },
    ],
    markets: "Рынки",
    platform: "Платформа",
    register: "Открыть счёт",
  },
  licenses: {
    title: "Лицензии",
    lede: "Каждая активная запись оформлена как отдельный документ. Заполнены только поля, которые хранит 7FX. Знак — значит, что поля в деле нет.",
    emptyTitle: "Опубликованных записей о лицензиях нет",
    emptyBody: "Когда лицензию добавляют и отмечают активной, она появляется здесь документом. Ниже поля, которые эта страница может показать.",
    kicker: "Запись о лицензии",
    authority: "Выдавший орган",
    number: "Номер лицензии или регистрации",
    type: "Вид лицензии",
    entity: "Наименование лица",
    jurisdiction: "Юрисдикция",
    issued: "Дата выдачи",
    valid: "Срок действия",
    scope: "Объём разрешённой деятельности",
    verify: "Проверить в официальном реестре",
    viewFull: "Открыть на всю страницу",
    back: "Все лицензии",
    print: "Печать",
    seal: "Печать записи",
    stamp: "ДЕЛО",
    footnote: "Знак — значит, что поля в деле нет.",
  },
};

const AR: PublicBundle = {
  nav: {
    skip: "تخطي إلى المحتوى",
    home: "الصفحة الرئيسية لـ 7FX",
    nav: "صفحات عامة",
    markets: "الأسواق",
    platform: "المنصة",
    faq: "الأسئلة",
    licenses: "التراخيص",
    signIn: "تسجيل الدخول",
    signOut: "تسجيل الخروج",
    language: "اللغة",
  },
  markets: {
    title: "الأسواق",
    lede: "يعرض 7FX العملات الرقمية والفوركس والسلع والمؤشرات والأسهم في طرفية واحدة. الأسماء أدناه هي الكتالوج المدمج. يمكن للطرفية أيضًا أن تعرض رموزًا يضيفها المكتب.",
    intro:
      "لكل فئة أصل قاعدة جلسة خاصة. تُرفض أوامر الأسهم عندما تكون جلسة ذلك السهم مغلقة. تُعامل العملات الرقمية على أنها مفتوحة باستمرار. لا تُرفض أوامر الفوركس والسلع والمؤشرات فقط لأن علامة الجلسة تقول مغلقة.",
    platformLink: "نظرة على المنصة",
  },
  assets: {
    crypto: {
      title: "العملات الرقمية",
      lede: "تُسعَّر أزواج العملات الرقمية في كتالوج 7FX المدمج داخل طرفية التداول.",
      session: [
        "تعامل المنصة العملات الرقمية على أنها مفتوحة 24 ساعة يوميًا، بما في ذلك عطلة نهاية الأسبوع.",
        "لا يرفض فحص الجلسة المغلقة أمر عملة رقمية جديدًا.",
      ],
      symbolsHeading: "الرموز المدمجة",
      symbolsNote: "هذه الأسماء تأتي مع 7FX. يمكن للمكتب إضافة المزيد. لا تنشر هذه الصفحة أسعارًا حية.",
      allMarkets: "كل الأسواق",
    },
    forex: {
      title: "الفوركس",
      lede: "تُسعَّر أزواج الفوركس في كتالوج 7FX المدمج داخل طرفية التداول.",
      session: [
        "تتبع علامة الجلسة تقريبًا من الأحد 22:00 UTC إلى الجمعة 22:00 UTC. السبت مغلق، وكذلك الجمعة بعد 22:00 UTC والأحد قبل 22:00 UTC.",
        "لا ترفض علامة فوركس المغلقة وحدها أمر فوركس جديدًا.",
      ],
      symbolsHeading: "الرموز المدمجة",
      symbolsNote: "هذه الأسماء تأتي مع 7FX. يمكن للمكتب إضافة المزيد. لا تنشر هذه الصفحة أسعارًا حية.",
      allMarkets: "كل الأسواق",
    },
    commodities: {
      title: "السلع",
      lede: "تُسعَّر رموز السلع في كتالوج 7FX المدمج داخل طرفية التداول.",
      session: [
        "تستخدم المنصة نافذة الفوركس الأسبوعية نفسها لعلامة جلسة السلع.",
        "لا ترفض علامة السلعة المغلقة وحدها أمر سلعة جديدًا.",
      ],
      symbolsHeading: "الرموز المدمجة",
      symbolsNote: "هذه الأسماء تأتي مع 7FX. يمكن للمكتب إضافة المزيد. لا تنشر هذه الصفحة أسعارًا حية.",
      allMarkets: "كل الأسواق",
    },
    indices: {
      title: "المؤشرات",
      lede: "تُسعَّر رموز المؤشرات النقدية في كتالوج 7FX المدمج داخل طرفية التداول.",
      session: [
        "تكون علامة الجلسة مفتوحة عندما تكون الجلسة النقدية الأمريكية مفتوحة (أيام الأسبوع 09:30–16:00 America/New_York) أو عندما تكون ساعات إسطنبول 10:00–18:30 في أيام الأسبوع مفتوحة.",
        "لا ترفض علامة المؤشر المغلقة وحدها أمر مؤشر جديدًا.",
      ],
      symbolsHeading: "الرموز المدمجة",
      symbolsNote: "هذه الأسماء تأتي مع 7FX. يمكن للمكتب إضافة المزيد. لا تنشر هذه الصفحة أسعارًا حية.",
      allMarkets: "كل الأسواق",
    },
    stocks: {
      title: "الأسهم",
      lede: "تُسعَّر رموز أسهم الولايات المتحدة وBIST في كتالوج 7FX المدمج داخل طرفية التداول.",
      session: [
        "تتبع الأسماء الأمريكية أيام الأسبوع 09:30–16:00 America/New_York.",
        "تتبع أسماء BIST (إدراجات إسطنبول في الكتالوج) أيام الأسبوع 10:00–18:00 Europe/Istanbul.",
        "يُرفض أمر سهم جديد عندما تكون جلسة ذلك الرمز مغلقة.",
      ],
      symbolsHeading: "الرموز المدمجة",
      symbolsNote: "هذه الأسماء تأتي مع 7FX. يمكن للمكتب إضافة المزيد. لا تنشر هذه الصفحة أسعارًا حية.",
      allMarkets: "كل الأسواق",
    },
  },
  platform: {
    title: "المنصة",
    lede: "7FX منصة تداول متعددة الأصول. بعد تسجيل الدخول، الطرفية هي المكان الذي تراقب فيه الرموز وتضع الأوامر وتراجع الصفقات المفتوحة والمغلقة.",
    includes: "ماذا تتضمن الطرفية",
    items: [
      "حساب واحد لكل مستخدم مسجّل الدخول، والرصيد مخزّن على ذلك الحساب.",
      "تذكرة أمر للرمز المحدد.",
      "صفقات مفتوحة وأوامر معلّقة وسجل الصفقات المغلقة.",
      "رسم بياني للرمز المحدد.",
    ],
    language: "اللغة",
    languageBody:
      "تبقى الصفحات العامة بالإنجليزية إلى أن تُختار لغة. التركية والألمانية والروسية والعربية متاحة في قائمة اللغة. يُحفظ الاختيار في ملف تعريف الارتباط fx_lang.",
    phone: "الهاتف",
    phoneBefore: "يمكن استخدام الموقع في متصفح الهاتف. على iPhone وiPad يمكن إضافته إلى الشاشة الرئيسية.",
    phoneLink: "خطوات التثبيت على iPhone وiPad",
    phoneAfter: "",
    money: "الإيداع والسحب",
    moneyBody:
      "تُرسل طلبات الإيداع والسحب من الحساب الذي سجّل الدخول. تبقى قيد الانتظار إلى أن يحدّث المكتب الطلب. لا تصف هذه الصفحة التحويل على أنه فوري.",
    marketsLink: "الأسواق وقواعد الجلسة",
  },
  faq: {
    title: "أسئلة",
    lede: "إجابات قصيرة عن سلوك 7FX. تصف هذه الصفحات المنتج. ليست عرضًا لعائد.",
    items: [
      {
        q: "ماذا يمكنني أن أتداول؟",
        a: "يغطي الكتالوج المدمج العملات الرقمية والفوركس والسلع والمؤشرات والأسهم. يمكن للمكتب إضافة رموز أخرى. راجع صفحات الأسواق للأسماء المدمجة وقاعدة الجلسة لكل فئة.",
      },
      {
        q: "بأي لغة يكون الموقع العام؟",
        a: "الإنجليزية. إذا لم تختر لغة، تبقى الصفحات بالإنجليزية. يمكنك التبديل إلى التركية أو الألمانية أو الروسية أو العربية من قائمة اللغة.",
      },
      {
        q: "متى يقبل 7FX أمر سهم؟",
        a: "تُقبل أوامر الأسهم الأمريكية في أيام الأسبوع من 09:30 إلى 16:00 America/New_York. تُقبل أوامر أسهم BIST في أيام الأسبوع من 10:00 إلى 18:00 Europe/Istanbul. خارج تلك الجلسة ترفض المنصة أمر سهم جديدًا.",
      },
      {
        q: "هل تُرفض أوامر الفوركس والعملات الرقمية والسلع والمؤشرات عندما تقول علامة الجلسة إنها مغلقة؟",
        a: "تُعامل العملات الرقمية على أنها مفتوحة باستمرار. تظل رموز الفوركس والسلع والمؤشرات تعرض علامة جلسة، ولا ترفض العلامة المغلقة تلك الأوامر وحدها. أوامر الأسهم هي التي تُرفض عندما تكون الجلسة مغلقة.",
      },
      {
        q: "هل ينشر هذا الموقع رقم ترخيص رقابي؟",
        a: "يظهر رقم الترخيص فقط في صفحة التراخيص، وفقط عندما يكون السجل مخزّنًا. لا تذكر الصفحة رقمًا أو جهة أو تاريخًا غير موجود في الملف.",
      },
      {
        q: "هل يعد 7FX بربح أو بفارق سعر معلن؟",
        a: "لا. لا شيء في هذا الموقع توقّع أو عائد مستهدف أو وعد بربح. الفروقات والأسعار المعروضة في الطرفية تأتي من تغذية أسعار المنصة في تلك اللحظة.",
      },
      {
        q: "كيف أفتح حسابًا؟",
        a: "استخدم صفحة التسجيل. إذا كان لديك رمز إحالة، يطلبه النموذج. بعد تسجيل الدخول تكون طرفية التداول في صفحة التداول.",
      },
    ],
    markets: "الأسواق",
    platform: "المنصة",
    register: "فتح حساب",
  },
  licenses: {
    title: "التراخيص",
    lede: "كل سجل نشط منسق كوثيقة مستقلة. تُملأ فقط الحقول المخزّنة في 7FX. العلامة — تعني أن الحقل غير موجود في الملف.",
    emptyTitle: "لا توجد سجلات تراخيص منشورة",
    emptyBody: "عندما يُضاف ترخيص ويُعلَّم نشطًا يظهر هنا كوثيقة. الحقول أدناه هي ما تستطيع هذه الصفحة عرضه.",
    kicker: "سجل ترخيص",
    authority: "الجهة المُصدِرة",
    number: "رقم الترخيص أو التسجيل",
    type: "نوع الترخيص",
    entity: "اسم الكيان",
    jurisdiction: "الاختصاص",
    issued: "تاريخ الإصدار",
    valid: "الصلاحية",
    scope: "نطاق الأنشطة المسموح بها",
    verify: "تحقق في السجل الرسمي",
    viewFull: "عرض الصفحة كاملة",
    back: "كل التراخيص",
    print: "طباعة",
    seal: "ختم السجل",
    stamp: "سجل",
    footnote: "العلامة — تعني أن الحقل غير موجود في الملف.",
  },
};

const BUNDLES: Record<Locale, PublicBundle> = { en: EN, tr: TR, de: DE, ru: RU, ar: AR };

export function publicBundle(locale: Locale): PublicBundle {
  return BUNDLES[locale] ?? EN;
}

export function metaFor(locale: Locale, path: string): { title: string; description: string } {
  if (locale === "en") {
    return (
      MARKETING_COPY[path] || {
        title: "7FX",
        description: "7FX is an international multi-asset trading platform for stocks, crypto, forex and commodities.",
      }
    );
  }
  return META[locale][path] || metaFor("en", path);
}

/** Keep English metadata identical. Other fx_lang values replace title, description, and Open Graph locale. */
export function localizeMarketingMeta(
  meta: Metadata,
  locale: Locale,
  title: string,
  description: string
): Metadata {
  if (locale === "en") return meta;
  const og = meta.openGraph;
  const tw = meta.twitter;
  return {
    ...meta,
    title: { absolute: title },
    description,
    openGraph:
      og && !Array.isArray(og)
        ? { ...og, title, description, locale: OG_LOCALE[locale] }
        : og,
    twitter: tw && !Array.isArray(tw) ? { ...tw, title, description } : tw,
  };
}
