/** M1 Finance admin CRM navigation — broker-desk structure (Turkish labels).
 * Do NOT copy Prime CRM logos, CSS, or trademarks.
 */

export type CrmNavItem = {
  href: string;
  label: string;
  exact?: boolean;
  group?: string;
};

export type CrmNavGroup = {
  id: string;
  label: string;
  items: CrmNavItem[];
};

export const CRM_NAV_GROUPS: CrmNavGroup[] = [
  {
    id: "main",
    label: "Ana",
    items: [
      { href: "/admin", label: "Gösterge Paneli", exact: true },
      { href: "/admin/traders", label: "Traderlar" },
      { href: "/admin/tickets", label: "Biletler / Yatırmalar" },
      { href: "/admin/positions", label: "Pozisyonlar" },
      { href: "/admin/transactions", label: "İşlemler (Ledger)" },
    ],
  },
  {
    id: "ops",
    label: "Operasyon",
    items: [
      { href: "/admin/desks", label: "Desklar" },
      { href: "/admin/workers", label: "Çalışanlar" },
      { href: "/admin/trading-groups", label: "Trading Grupları" },
      { href: "/admin/assets", label: "Varlıklar" },
      { href: "/admin/rates", label: "İşlem Oranları" },
      { href: "/admin/methods", label: "Yatırma Yöntemleri" },
    ],
  },
  {
    id: "comms",
    label: "İletişim",
    items: [
      { href: "/admin/communications", label: "İletişimler" },
      { href: "/admin/chat", label: "Sohbet" },
      { href: "/admin/documents", label: "Belgeler" },
      { href: "/admin/calendar", label: "Takvim" },
      { href: "/admin/mail", label: "Mail Şablonları" },
    ],
  },
  {
    id: "analytics",
    label: "Analitik",
    items: [
      { href: "/admin/analytics/finance", label: "Finans" },
      { href: "/admin/analytics/scoreboard", label: "Skor Tablosu" },
      { href: "/admin/analytics/report", label: "Rapor" },
      { href: "/admin/summary", label: "Hesap Özeti" },
    ],
  },
];

export const CRM_STUB_NOTE =
  "Bu modül yapı iskeleti olarak hazırdır. Canlı veri bağları sonraki iterasyonda genişletilecek.";
