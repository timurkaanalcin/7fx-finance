/** 7FX admin CRM navigation — labelKey maps to i18n (CRM default locale = Turkish). */

export type CrmNavItem = {
  href: string;
  /** i18n key under crm.nav.* or full key */
  labelKey: string;
  exact?: boolean;
  group?: string;
  /** Full document navigation. This href is a route handler, not an App Router page. */
  document?: boolean;
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
      { href: "/izcrm", labelKey: "crm.nav.dashboard", exact: true },
      { href: "/izcrm/crmv2", labelKey: "crm.nav.crmv2" },
      { href: "/izcrm/crmv3", labelKey: "crm.nav.crmv3" },
      { href: "/izcrm/traders", labelKey: "crm.nav.traders" },
      { href: "/izcrm/import", labelKey: "crm.nav.import" },
      { href: "/izcrm/tickets", labelKey: "crm.nav.tickets" },
      { href: "/izcrm/positions", labelKey: "crm.nav.positions" },
      { href: "/izcrm/transactions", labelKey: "crm.nav.transactions" },
    ],
  },
  {
    id: "ops",
    labelKey: "crm.group.ops",
    items: [
      { href: "/izcrm/desks", labelKey: "crm.nav.desks" },
      { href: "/izcrm/workers", labelKey: "crm.nav.workers" },
      { href: "/izcrm/trading-groups", labelKey: "crm.nav.tradingGroups" },
      { href: "/izcrm/assets", labelKey: "crm.nav.assets" },
      { href: "/izcrm/rates", labelKey: "crm.nav.rates" },
      { href: "/izcrm/methods", labelKey: "crm.nav.methods" },
      { href: "/izcrm/sponsors", labelKey: "crm.nav.sponsors" },
      { href: "/izcrm/licenses", labelKey: "crm.nav.licenses" },
      { href: "/izcrm/settings", labelKey: "crm.nav.settings" },
    ],
  },
  {
    id: "comms",
    labelKey: "crm.group.comms",
    items: [
      { href: "/izcrm/communications", labelKey: "crm.nav.communications" },
      { href: "/izcrm/chat", labelKey: "crm.nav.chat" },
      { href: "/izcrm/documents", labelKey: "crm.nav.documents" },
      { href: "/izcrm/evrak", labelKey: "crm.nav.evrak" },
      { href: "/izcrm/uyelikler", labelKey: "crm.nav.uyelikler" },
      { href: "/izcrm/calendar", labelKey: "crm.nav.calendar" },
      { href: "/izcrm/mail", labelKey: "crm.nav.mail" },
    ],
  },
  {
    id: "analytics",
    labelKey: "crm.group.analytics",
    items: [
      { href: "/izcrm/analytics/finance", labelKey: "crm.nav.finance" },
      { href: "/izcrm/analytics/scoreboard", labelKey: "crm.nav.scoreboard" },
      { href: "/izcrm/analytics/affiliates", labelKey: "crm.nav.affiliates" },
      { href: "/izcrm/analytics/report", labelKey: "crm.nav.report" },
      { href: "/izcrm/summary", labelKey: "crm.nav.summary" },
    ],
  },
];

export const CRM_STUB_NOTE =
  "This module is a structural stub. Live data connections will be expanded in a later iteration.";
