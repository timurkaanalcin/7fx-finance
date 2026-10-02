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
    label: "Main",
    items: [
      { href: "/admin", label: "Dashboard", exact: true },
      { href: "/admin/traders", label: "Traders" },
      { href: "/admin/tickets", label: "Tickets / Deposits" },
      { href: "/admin/positions", label: "Positions" },
      { href: "/admin/transactions", label: "Transactions (Ledger)" },
    ],
  },
  {
    id: "ops",
    label: "Operations",
    items: [
      { href: "/admin/desks", label: "Desks" },
      { href: "/admin/workers", label: "Workers" },
      { href: "/admin/trading-groups", label: "Trading Groups" },
      { href: "/admin/assets", label: "Assets" },
      { href: "/admin/rates", label: "Trading Rates" },
      { href: "/admin/methods", label: "Deposit Methods" },
      { href: "/admin/settings", label: "System Settings" },
    ],
  },
  {
    id: "comms",
    label: "Communications",
    items: [
      { href: "/admin/communications", label: "Communications" },
      { href: "/admin/chat", label: "Chat" },
      { href: "/admin/documents", label: "Documents" },
      { href: "/admin/calendar", label: "Calendar" },
      { href: "/admin/mail", label: "Mail Templates" },
    ],
  },
  {
    id: "analytics",
    label: "Analytics",
    items: [
      { href: "/admin/analytics/finance", label: "Finance" },
      { href: "/admin/analytics/scoreboard", label: "Scoreboard" },
      { href: "/admin/analytics/report", label: "Report" },
      { href: "/admin/summary", label: "Account Summary" },
    ],
  },
];

export const CRM_STUB_NOTE =
  "This module is a structural stub. Live data connections will be expanded in a later iteration.";
