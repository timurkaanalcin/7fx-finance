import { CRM_NAV_GROUPS } from "@/lib/crm-nav";

export type CrmxIcon =
  | "dashboard"
  | "traders"
  | "deposits"
  | "withdrawals"
  | "tickets"
  | "transactions"
  | "positions"
  | "inbox"
  | "settings"
  | "search";

export type CrmxNavItem = {
  href: string;
  labelKey: string;
  icon: CrmxIcon;
  exact?: boolean;
};

export type CrmxNavGroup = {
  id: string;
  labelKey: string;
  items: CrmxNavItem[];
};

export const CRMX_NAV: CrmxNavGroup[] = [
  {
    id: "work",
    labelKey: "crmx.group.work",
    items: [
      { href: "/crmx", labelKey: "crm.nav.dashboard", icon: "dashboard", exact: true },
      { href: "/crmx/traders", labelKey: "crm.nav.traders", icon: "traders" },
      { href: "/crmx/positions", labelKey: "crm.nav.positions", icon: "positions" },
      { href: "/crmx/chat", labelKey: "crmx.nav.inbox", icon: "inbox" },
    ],
  },
  {
    id: "money",
    labelKey: "crmx.group.money",
    items: [
      { href: "/crmx/deposits", labelKey: "crmx.nav.deposits", icon: "deposits" },
      { href: "/crmx/withdrawals", labelKey: "crmx.nav.withdrawals", icon: "withdrawals" },
      { href: "/crmx/tickets", labelKey: "crm.nav.tickets", icon: "tickets" },
      { href: "/crmx/transactions", labelKey: "crm.nav.transactions", icon: "transactions" },
    ],
  },
  {
    id: "desk",
    labelKey: "crmx.group.desk",
    items: [{ href: "/crmx/settings", labelKey: "crm.nav.settings", icon: "settings" }],
  },
];

export type ClassicLink = { href: string; labelKey: string; groupKey: string };

export function classicLinks(): ClassicLink[] {
  const out: ClassicLink[] = [
    { href: "/izcrm/balance-requests", labelKey: "crmx.nav.balance", groupKey: "crm.group.main" },
  ];
  for (const group of CRM_NAV_GROUPS) {
    for (const item of group.items) {
      out.push({ href: item.href, labelKey: item.labelKey, groupKey: group.labelKey });
    }
  }
  return out;
}

export function crmxActive(pathname: string, href: string, exact?: boolean): boolean {
  if (exact || href === "/crmx") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function flatCrmxNav(): CrmxNavItem[] {
  const items: CrmxNavItem[] = [];
  for (const group of CRMX_NAV) {
    for (const item of group.items) items.push(item);
  }
  return items;
}
