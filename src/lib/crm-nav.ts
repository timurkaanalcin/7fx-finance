/** 7FX admin CRM navigation — labelKey maps to i18n (CRM default locale = Turkish). */

export type CrmNavItem = {
  href: string;
  /** i18n key under crm.nav.* or full key */
  labelKey: string;
  exact?: boolean;
  group?: string;
};

export type CrmNavGroup = {
  id: string;
  labelKey: string;
  items: CrmNavItem[];
};

export const CRM_NAV_GROUPS: CrmNavGroup[] = [
  {
    id: "main",
    labelKey: "crm.group.main",
    items: [
      { href: "/admin", labelKey: "crm.nav.dashboard", exact: true },
      { href: "/admin/traders", labelKey: "crm.nav.traders" },
      { href: "/admin/tickets", labelKey: "crm.nav.tickets" },
      { href: "/admin/positions", labelKey: "crm.nav.positions" },
      { href: "/admin/transactions", labelKey: "crm.nav.transactions" },
    ],
  },
  {
    id: "ops",
    labelKey: "crm.group.ops",
    items: [
      { href: "/admin/desks", labelKey: "crm.nav.desks" },
      { href: "/admin/workers", labelKey: "crm.nav.workers" },
      { href: "/admin/trading-groups", labelKey: "crm.nav.tradingGroups" },
      { href: "/admin/assets", labelKey: "crm.nav.assets" },
      { href: "/admin/rates", labelKey: "crm.nav.rates" },
      { href: "/admin/methods", labelKey: "crm.nav.methods" },
      { href: "/admin/settings", labelKey: "crm.nav.settings" },
    ],
  },
  {
    id: "comms",
    labelKey: "crm.group.comms",
    items: [
      { href: "/admin/communications", labelKey: "crm.nav.communications" },
      { href: "/admin/chat", labelKey: "crm.nav.chat" },
      { href: "/admin/documents", labelKey: "crm.nav.documents" },
      { href: "/admin/calendar", labelKey: "crm.nav.calendar" },
      { href: "/admin/mail", labelKey: "crm.nav.mail" },
    ],
  },
  {
    id: "analytics",
    labelKey: "crm.group.analytics",
    items: [
      { href: "/admin/analytics/finance", labelKey: "crm.nav.finance" },
      { href: "/admin/analytics/scoreboard", labelKey: "crm.nav.scoreboard" },
      { href: "/admin/analytics/report", labelKey: "crm.nav.report" },
      { href: "/admin/summary", labelKey: "crm.nav.summary" },
    ],
  },
];

export const CRM_STUB_NOTE =
  "This module is a structural stub. Live data connections will be expanded in a later iteration.";
